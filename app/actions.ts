'use server'

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// --- VALIDATION HELPERS ---

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateInput(input: string, fieldName: string, maxLength: number = 1000): void {
  if (!input || typeof input !== 'string') {
    throw new Error(`${fieldName} is required`);
  }
  if (input.trim().length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  if (input.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
  }
}

function getSafeUserEmail(user: any): string {
  if (!user?.emailAddresses || user.emailAddresses.length === 0) {
    throw new Error("User email not found");
  }
  return user.emailAddresses[0].emailAddress;
}

// --- PERMISSION HELPER (TIERED LOGIC) ---
// Tiers: OWNER > EDITOR > CLONER > VIEWER
// EDITOR includes CLONER permissions.

async function verifyDeckPermission(deckId: string, requiredLevel: 'EDIT' | 'CLONE' | 'VIEWER') {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) throw new Error("Unauthorized");

  const userEmail = getSafeUserEmail(user);

  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: { accessList: true }
  });

  if (!deck) throw new Error("Deck not found");

  // 1. Owner always has full access
  if (deck.userId === userId) return true;

  // 2. Check if deck is public/unlisted (for VIEWER level)
  if (requiredLevel === 'VIEWER') {
    if (deck.visibility === 'PUBLIC' || deck.visibility === 'UNLISTED') {
      return true;
    }
  }

  // 3. Check Shared Access
  const access = deck.accessList.find(a => a.userEmail === userEmail);
  if (!access) {
    // For VIEWER level, also check if public/unlisted
    if (requiredLevel === 'VIEWER' && (deck.visibility === 'PUBLIC' || deck.visibility === 'UNLISTED')) {
      return true;
    }
    throw new Error("Unauthorized");
  }

  // 4. Tiered Logic
  if (requiredLevel === 'EDIT') {
    // Only EDITOR can edit
    if (access.role === 'EDITOR') return true;
  } 
  
  if (requiredLevel === 'CLONE') {
    // EDITOR and CLONER can clone
    if (access.role === 'EDITOR' || access.role === 'CLONER') return true;
  }

  if (requiredLevel === 'VIEWER') {
    // All roles (VIEWER, CLONER, EDITOR) can view
    return true;
  }

  throw new Error("Insufficient permissions");
}

// --- DECK ACTIONS ---

export async function createDeck(title: string, description: string, visibility: 'PRIVATE' | 'PUBLIC' | 'UNLISTED' = 'PRIVATE') {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  validateInput(title, "Title", 200);
  if (description) validateInput(description, "Description", 2000);
  if (!['PRIVATE', 'PUBLIC', 'UNLISTED'].includes(visibility)) {
    throw new Error("Invalid visibility value");
  }

  const deck = await prisma.deck.create({
    data: {
      userId,
      title: title.trim(),
      description: description?.trim() || null,
      visibility,
    },
  });

  revalidatePath("/dashboard");
  return deck;
}

export async function updateDeck(deckId: string, title: string, description: string, tagIds?: string[]) {
  // Check: Owner OR Editor
  await verifyDeckPermission(deckId, 'EDIT');

  validateInput(title, "Title", 200);
  if (description) validateInput(description, "Description", 2000);

  const data: any = { title: title.trim(), description: description?.trim() || null };

  if (tagIds) {
    if (!Array.isArray(tagIds)) throw new Error("tagIds must be an array");
    if (tagIds.length > 50) throw new Error("Too many tags");
    data.tags = {
      set: [],
      connect: tagIds.map(id => ({ id: String(id).trim() }))
    };
  }

  // Note: We use update without userId in 'where' because we verified permissions above
  await prisma.deck.update({
    where: { id: deckId },
    data: data,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/deck/${deckId}`);
}

export async function deleteDeck(deckId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // STRICT: Only Owner can delete the deck
  await prisma.deck.delete({
    where: { id: deckId, userId },
  });

  revalidatePath("/dashboard");
}

export async function updateDeckVisibility(deckId: string, visibility: 'PRIVATE' | 'PUBLIC' | 'UNLISTED') {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // STRICT: Only Owner can change visibility
  await prisma.deck.update({
    where: { id: deckId, userId },
    data: { visibility }
  });

  revalidatePath(`/dashboard`);
  revalidatePath(`/dashboard/deck/${deckId}`);
}

// --- MERGE / CLONE ACTIONS ---

export async function createDeckFromMerge(deckIds: string[], title: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  validateInput(title, "Title", 200);
  if (!Array.isArray(deckIds) || deckIds.length === 0) {
    throw new Error("deckIds must be a non-empty array");
  }

  // 1. Verify Permission on ALL source decks
  // Must be OWNER, EDITOR, or CLONER
  for (const deckId of deckIds) {
      await verifyDeckPermission(deckId, 'CLONE');
  }

  // Use transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    // 2. Create new deck
    const newDeck = await tx.deck.create({
      data: {
        userId,
        title: title.trim(),
        description: `Merged/Cloned from ${deckIds.length} decks`,
        visibility: 'PRIVATE'
      }
    });

    // 3. Fetch source cards
    const sourceCards = await tx.card.findMany({
      where: { deckId: { in: deckIds } },
      orderBy: { orderIndex: 'asc' }
    });

    // 4. Create copies
    if (sourceCards.length > 0) {
        await tx.card.createMany({
            data: sourceCards.map((c, i) => ({
                deckId: newDeck.id,
                front: c.front,
                back: c.back,
                orderIndex: i,
                status: 'learning'
            }))
        });
    }

    revalidatePath("/dashboard");
    return newDeck;
  });
}

export async function mergeDecks(targetDeckId: string, sourceDeckIds: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!Array.isArray(sourceDeckIds) || sourceDeckIds.length === 0) {
    throw new Error("sourceDeckIds must be a non-empty array");
  }

  // Target: Must be Owner or Editor
  await verifyDeckPermission(targetDeckId, 'EDIT');

  // Sources: Must be Owner, Editor, or Cloner
  for (const sourceId of sourceDeckIds) {
      await verifyDeckPermission(sourceId, 'CLONE');
  }

  // Use transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Fetch source cards
    const sourceCards = await tx.card.findMany({
        where: { deckId: { in: sourceDeckIds } }
    });

    if (sourceCards.length === 0) return;

    const lastCard = await tx.card.findFirst({
        where: { deckId: targetDeckId },
        orderBy: { orderIndex: 'desc' }
    });
    let startOrder = lastCard ? lastCard.orderIndex + 1 : 0;

    await tx.card.createMany({
        data: sourceCards.map((c, i) => ({
            deckId: targetDeckId,
            front: c.front,
            back: c.back,
            orderIndex: startOrder + i,
            status: 'learning'
        }))
    });
  });

  revalidatePath(`/dashboard/deck/${targetDeckId}`);
}


// --- SINGLE DECK SHARING ACTIONS ---

export async function getDeckAccessList(deckId: string) {
  const { userId } = await auth();
  if (!userId) return [];

  const accessList = await prisma.deckAccess.findMany({
    where: { deckId },
    orderBy: { createdAt: 'desc' }
  });
  return accessList;
}

export async function shareDeckWithUser(deckId: string, targetEmail: string, role: 'VIEWER' | 'CLONER' | 'EDITOR') {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!validateEmail(targetEmail)) {
    throw new Error("Invalid email address");
  }
  if (!['VIEWER', 'CLONER', 'EDITOR'].includes(role)) {
    throw new Error("Invalid role");
  }

  // Only Owner can share
  const deck = await prisma.deck.findUnique({
    where: { id: deckId, userId }
  });
  if (!deck) throw new Error("Unauthorized");

  const existing = await prisma.deckAccess.findUnique({
    where: {
      deckId_userEmail: { deckId, userEmail: targetEmail.toLowerCase().trim() }
    }
  });

  if (existing) {
    await prisma.deckAccess.update({
      where: { id: existing.id },
      data: { role }
    });
  } else {
    await prisma.deckAccess.create({
      data: {
        deckId,
        userEmail: targetEmail.toLowerCase().trim(),
        role
      }
    });
  }
  revalidatePath(`/dashboard`);
}

export async function removeDeckAccess(deckId: string, targetEmail: string) {
   const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Only Owner can remove access
  const deck = await prisma.deck.findUnique({
      where: { id: deckId, userId }
  });
  if (!deck) throw new Error("Unauthorized");

  await prisma.deckAccess.delete({
      where: {
          deckId_userEmail: { deckId, userEmail: targetEmail }
      }
  });
  revalidatePath(`/dashboard`);
}

// --- CARD ACTIONS ---

export async function createCard(deckId: string, front: string, back: string) {
  // Check: Owner OR Editor
  await verifyDeckPermission(deckId, 'EDIT');

  validateInput(front, "Front", 5000);
  validateInput(back, "Back", 5000);

  const lastCard = await prisma.card.findFirst({
    where: { deckId },
    orderBy: { orderIndex: 'desc' },
  });
  const newOrderIndex = lastCard ? lastCard.orderIndex + 1 : 0;

  await prisma.card.create({
    data: {
      deckId,
      front: front.trim(),
      back: back.trim(),
      orderIndex: newOrderIndex,
      status: 'learning'
    },
  });

  revalidatePath(`/dashboard/deck/${deckId}`);
}

export async function updateCard(cardId: string, front: string, back: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { deck: true },
  });
  if (!card) throw new Error("Card not found");

  // Check: Owner OR Editor of the parent deck
  await verifyDeckPermission(card.deckId, 'EDIT');

  validateInput(front, "Front", 5000);
  validateInput(back, "Back", 5000);

  await prisma.card.update({
    where: { id: cardId },
    data: { front: front.trim(), back: back.trim() },
  });

  revalidatePath(`/dashboard/deck/${card.deckId}`);
}

export async function updateCardStatus(cardId: string, status: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const card = await prisma.card.findUnique({
    where: { id: cardId }
  });
  if (!card) throw new Error("Card not found");
  
  // Verify user has at least VIEWER access to the deck
  await verifyDeckPermission(card.deckId, 'VIEWER');

  // Validate status value
  const validStatuses = ['learning', 'reviewing', 'mastered', 'new', 'dontknow', 'kindof', 'know'];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status value");
  }
  
  await prisma.card.update({
    where: { id: cardId },
    data: { status }
  });
}

export async function deleteCard(cardId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { deck: true },
  });
  if (!card) throw new Error("Card not found");

  // Check: Owner OR Editor
  await verifyDeckPermission(card.deckId, 'EDIT');

  await prisma.card.delete({
    where: { id: cardId },
  });

  revalidatePath(`/dashboard/deck/${card.deckId}`);
}

// --- TAG ACTIONS (UNCHANGED) ---

export async function getTags() {
  const { userId } = await auth();
  if (!userId) return [];
  return await prisma.tag.findMany({ where: { userId }, orderBy: { name: 'asc' } });
}

export async function createTag(name: string, color: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  validateInput(name, "Tag name", 50);
  if (!color || typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    throw new Error("Invalid color format. Must be a hex color (e.g., #FF0000)");
  }
  
  await prisma.tag.create({ data: { name: name.trim(), color, userId } });
  revalidatePath("/dashboard");
}

export async function deleteTag(tagId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.tag.delete({ where: { id: tagId, userId } });
  revalidatePath("/dashboard");
}

// --- BULK ACTIONS ---

export async function bulkUpdateSettings(
  deckIds: string[], 
  visibility: 'PRIVATE' | 'PUBLIC' | 'UNLISTED', 
  allowClone: boolean,
  sharePassword?: string | null
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // STRICT: Owner Only for bulk settings
  await prisma.deck.updateMany({
    where: {
      id: { in: deckIds },
      userId: userId 
    },
    data: {
      visibility,
      allowClone,
      sharePassword: sharePassword === "" ? null : sharePassword 
    }
  });

  revalidatePath("/dashboard");
}

export async function bulkShareWithUser(
  deckIds: string[], 
  targetEmail: string, 
  role: 'VIEWER' | 'CLONER' | 'EDITOR'
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!validateEmail(targetEmail)) {
    throw new Error("Invalid email address");
  }
  if (!['VIEWER', 'CLONER', 'EDITOR'].includes(role)) {
    throw new Error("Invalid role");
  }
  if (!Array.isArray(deckIds) || deckIds.length === 0) {
    throw new Error("deckIds must be a non-empty array");
  }

  // STRICT: Owner Only for sharing
  const count = await prisma.deck.count({
    where: {
      id: { in: deckIds },
      userId: userId
    }
  });

  if (count !== deckIds.length) throw new Error("You do not own all selected decks");

  const normalizedEmail = targetEmail.toLowerCase().trim();
  for (const deckId of deckIds) {
    const existing = await prisma.deckAccess.findUnique({
      where: { deckId_userEmail: { deckId, userEmail: normalizedEmail } }
    });

    if (existing) {
      await prisma.deckAccess.update({
        where: { id: existing.id },
        data: { role }
      });
    } else {
      await prisma.deckAccess.create({
        data: { deckId, userEmail: normalizedEmail, role }
      });
    }
  }
  revalidatePath("/dashboard");
}

export async function bulkAddTags(tagId: string, updates: { cardId: string, removeTagId?: string }[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error("updates must be a non-empty array");
  }
  if (updates.length > 1000) {
    throw new Error("Too many cards. Maximum 1000 at a time");
  }

  // Verify permissions for each card's deck
  const errors: string[] = [];
  for (const update of updates) {
    try {
      const card = await prisma.card.findUnique({
        where: { id: update.cardId },
        include: { deck: true, tags: true }
      });
      if (!card) {
        errors.push(`Card ${update.cardId} not found`);
        continue;
      }
      
      // Verify user has EDIT permission on the deck
      await verifyDeckPermission(card.deckId, 'EDIT');
      
      // Check tag limit (3 tags per card) - but allow if we're removing one
      const currentTagCount = card.tags.length;
      if (currentTagCount >= 3 && !update.removeTagId) {
        errors.push(`Card ${update.cardId} already has 3 tags`);
        continue;
      }

      // If removing a tag, disconnect it first, then connect the new one
      if (update.removeTagId) {
        await prisma.card.update({
          where: { id: update.cardId },
          data: {
            tags: {
              disconnect: { id: update.removeTagId },
              connect: { id: tagId }
            }
          }
        });
      } else {
        await prisma.card.update({
          where: { id: update.cardId },
          data: {
            tags: {
              connect: { id: tagId }
            }
          }
        });
      }
    } catch (error: any) {
      errors.push(`Card ${update.cardId}: ${error.message || 'Permission denied'}`);
    }
  }

  if (errors.length > 0 && errors.length === updates.length) {
    throw new Error(`Failed to add tags: ${errors.join('; ')}`);
  }

  revalidatePath("/dashboard");
}

export async function bulkRemoveTags(cardIds: string[], tagId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    throw new Error("cardIds must be a non-empty array");
  }
  if (cardIds.length > 1000) {
    throw new Error("Too many cards. Maximum 1000 at a time");
  }

  // Verify permissions for each card's deck
  const errors: string[] = [];
  for (const cardId of cardIds) {
    try {
      const card = await prisma.card.findUnique({
        where: { id: cardId },
        include: { deck: true }
      });
      if (!card) {
        errors.push(`Card ${cardId} not found`);
        continue;
      }
      
      // Verify user has EDIT permission on the deck
      await verifyDeckPermission(card.deckId, 'EDIT');

      await prisma.card.update({
        where: { id: cardId },
        data: { tags: { disconnect: { id: tagId } } }
      });
    } catch (error: any) {
      errors.push(`Card ${cardId}: ${error.message || 'Permission denied'}`);
    }
  }

  if (errors.length > 0 && errors.length === cardIds.length) {
    throw new Error(`Failed to remove tags: ${errors.join('; ')}`);
  }

  revalidatePath("/dashboard");
}

// --- BULK DECK TAGGING ---

export async function bulkAddTagsToDecks(deckIds: string[], tagId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!Array.isArray(deckIds) || deckIds.length === 0) {
    throw new Error("deckIds must be a non-empty array");
  }

  const errors: string[] = [];
  for (const deckId of deckIds) {
    try {
      // Check: Owner OR Editor
      await verifyDeckPermission(deckId, 'EDIT');

      await prisma.deck.update({
        where: { id: deckId },
        data: { tags: { connect: { id: tagId } } }
      });
    } catch (e: any) {
      errors.push(`Deck ${deckId}: ${e.message || 'Permission denied'}`);
    }
  }

  if (errors.length > 0 && errors.length === deckIds.length) {
    throw new Error(`Failed to add tags: ${errors.join('; ')}`);
  }

  revalidatePath("/dashboard");
}

export async function bulkRemoveTagsFromDecks(deckIds: string[], tagId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!Array.isArray(deckIds) || deckIds.length === 0) {
    throw new Error("deckIds must be a non-empty array");
  }

  const errors: string[] = [];
  for (const deckId of deckIds) {
    try {
      await verifyDeckPermission(deckId, 'EDIT');

      await prisma.deck.update({
        where: { id: deckId },
        data: { tags: { disconnect: { id: tagId } } }
      });
    } catch (e: any) {
      errors.push(`Deck ${deckId}: ${e.message || 'Permission denied'}`);
    }
  }

  if (errors.length > 0 && errors.length === deckIds.length) {
    throw new Error(`Failed to remove tags: ${errors.join('; ')}`);
  }

  revalidatePath("/dashboard");
}

// --- STUDY SESSION ACTIONS ---

export async function getStudyProgress(deckId: string) {
  const { userId } = await auth();
  if (!userId) return 0;
  const session = await prisma.studySession.findUnique({ where: { userId_deckId: { userId, deckId } } });
  return session ? session.cardIndex : 0;
}

export async function saveStudyProgress(deckId: string, cardIndex: number) {
  const { userId } = await auth();
  if (!userId) return;

  if (typeof cardIndex !== 'number' || cardIndex < 0) {
    throw new Error("Invalid card index");
  }

  try {
    await prisma.studySession.upsert({
      where: { userId_deckId: { userId, deckId } },
      update: { cardIndex },
      create: { userId, deckId, cardIndex }
    });
  } catch (error: any) {
    if (error.code === 'P2003') {
      const user = await currentUser();
      if (user) {
        const email = getSafeUserEmail(user);
        await prisma.user.upsert({ where: { id: userId }, update: { email }, create: { id: userId, email } });
        await prisma.studySession.upsert({
          where: { userId_deckId: { userId, deckId } },
          update: { cardIndex },
          create: { userId, deckId, cardIndex }
        });
      }
    } else {
      throw error;
    }
  }
}

export async function clearStudyProgress(deckId: string) {
  const { userId } = await auth();
  if (!userId) return;
  try {
    await prisma.studySession.delete({ where: { userId_deckId: { userId, deckId } } });
  } catch (e) {}
}

// --- SHARED DECK ACTIONS ---

export async function getSharedDeck(deckId: string, password?: string) {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: {
      cards: {
        orderBy: { orderIndex: 'asc' }
      },
      tags: true,
      _count: {
        select: { cards: true }
      }
    }
  });

  if (!deck) {
    throw new Error("Deck not found");
  }

  // Check visibility
  if (deck.visibility === 'PRIVATE') {
    // Check if user has access via sharing
    const { userId } = await auth();
    const user = await currentUser();
    
    if (userId && user) {
      const userEmail = getSafeUserEmail(user);
      const access = await prisma.deckAccess.findUnique({
        where: {
          deckId_userEmail: { deckId, userEmail }
        }
      });
      if (!access) {
        throw new Error("Deck not found");
      }
    } else {
      throw new Error("Deck not found");
    }
  }

  // Check password if required
  if (deck.sharePassword) {
    if (!password || password !== deck.sharePassword) {
      return {
        ...deck,
        isLocked: true,
        cards: [],
        canEdit: false,
        canClone: false
      };
    }
  }

  // Determine permissions for current user
  const { userId } = await auth();
  const user = await currentUser();
  let canEdit = false;
  let canClone = false;

  if (userId && user) {
    const userEmail = getSafeUserEmail(user);
    if (deck.userId === userId) {
      canEdit = true;
      canClone = true;
    } else {
      const access = await prisma.deckAccess.findUnique({
        where: {
          deckId_userEmail: { deckId, userEmail }
        }
      });
      if (access) {
        canEdit = access.role === 'EDITOR';
        canClone = access.role === 'EDITOR' || access.role === 'CLONER';
      } else if (deck.visibility === 'PUBLIC' || deck.visibility === 'UNLISTED') {
        canClone = deck.allowClone;
      }
    }
  } else if (deck.visibility === 'PUBLIC' || deck.visibility === 'UNLISTED') {
    canClone = deck.allowClone;
  }

  return {
    ...deck,
    isLocked: false,
    canEdit,
    canClone
  };
}

export async function cloneDeck(deckId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify user has CLONE permission
  await verifyDeckPermission(deckId, 'CLONE');

  // Also check if deck allows cloning (for public/unlisted decks)
  const deck = await prisma.deck.findUnique({
    where: { id: deckId }
  });

  if (!deck) throw new Error("Deck not found");
  
  // If not owner/editor/cloner via sharing, check allowClone flag
  const { userId: currentUserId } = await auth();
  if (deck.userId !== currentUserId) {
    const user = await currentUser();
    if (user) {
      const userEmail = getSafeUserEmail(user);
      const access = await prisma.deckAccess.findUnique({
        where: {
          deckId_userEmail: { deckId, userEmail }
        }
      });
      if (!access && !deck.allowClone) {
        throw new Error("Cloning is not allowed for this deck");
      }
    } else if (!deck.allowClone) {
      throw new Error("Cloning is not allowed for this deck");
    }
  }

  // Use transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    // Create new deck
    const newDeck = await tx.deck.create({
      data: {
        userId,
        title: `${deck.title} (Copy)`,
        description: deck.description,
        visibility: 'PRIVATE'
      }
    });

    // Fetch source cards
    const sourceCards = await tx.card.findMany({
      where: { deckId },
      orderBy: { orderIndex: 'asc' }
    });

    // Create copies
    if (sourceCards.length > 0) {
      await tx.card.createMany({
        data: sourceCards.map((c, i) => ({
          deckId: newDeck.id,
          front: c.front,
          back: c.back,
          orderIndex: i,
          status: 'learning'
        }))
      });
    }

    revalidatePath("/dashboard");
    return newDeck;
  });
}
