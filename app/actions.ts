'use server'

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export async function createDeck(formData: FormData) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("You must be logged in");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const tagIdsRaw = formData.get("tagIds") as string;

  // Parse Tags
  let tagConnections = [];
  try {
    const parsedIds = JSON.parse(tagIdsRaw || "[]");
    tagConnections = parsedIds.map((id: string) => ({ id }));
  } catch (e) {
    console.error("Failed to parse deck tags", e);
  }

  await prisma.deck.create({
    data: {
      title,
      description,
      userId,
      tags: { connect: tagConnections }
    },
  });

  revalidatePath("/dashboard");
}

export async function createCard(formData: FormData) {
  const { userId } = await auth();
  const front = formData.get("front") as string;
  const back = formData.get("back") as string;
  const deckId = formData.get("deckId") as string;
  const tagIdsRaw = formData.get("tagIds") as string; // <--- NEW

  if (!userId || !deckId) throw new Error("Invalid Request");

  // Parse the JSON list of IDs (e.g. "['id1', 'id2']")
  let tagConnections = [];
  try {
    const parsedIds = JSON.parse(tagIdsRaw || "[]");
    tagConnections = parsedIds.map((id: string) => ({ id }));
  } catch (e) {
    console.error("Failed to parse tags", e);
  }

  const count = await prisma.card.count({ where: { deckId } });

  await prisma.card.create({
    data: {
      front,
      back,
      deckId,
      orderIndex: count,
      // CONNECT THE TAGS
      tags: {
        connect: tagConnections
      }
    }
  });

  revalidatePath(`/dashboard/deck/${deckId}`);
}

export async function updateCardStatus(cardId: string, status: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await prisma.card.update({
    where: { id: cardId },
    data: { status },
  });
}

export async function updateDeck(
  deckId: string, 
  title: string, 
  description: string,
  tagIds: string[] = [] // <--- Add this argument (default empty)
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await prisma.deck.update({
    where: { id: deckId, userId },
    data: { 
      title, 
      description,
      tags: {
        set: [], // Clear old tags
        connect: tagIds.map(id => ({ id })) // Connect new ones
      }
    },
  });

  revalidatePath(`/dashboard/deck/${deckId}`);
  revalidatePath('/dashboard');
}

export async function deleteDeck(deckId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await prisma.deck.delete({
    where: { id: deckId, userId },
  });

  // After deleting, send them back to the dashboard
  redirect("/dashboard");
}

// --- TAG ACTIONS ---

export async function createTag(name: string, color: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Check if tag already exists to prevent crashing
  const existing = await prisma.tag.findUnique({
    where: {
      userId_name: {
        userId,
        name
      }
    }
  });

  if (existing) return existing;

  return await prisma.tag.create({
    data: {
      name,
      color,
      userId
    }
  });
}

export async function getTags() {
  const { userId } = await auth();
  if (!userId) return [];

  return await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: 'asc' }
  });
}

export async function deleteTag(tagId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await prisma.tag.delete({
    where: { id: tagId, userId } // Ensures user owns the tag
  });

  revalidatePath('/dashboard');
}

// Update the Card Creation to include Tags
// We need to overload or create a new function for this later,
// but for now, let's keep the actions file ready.

export async function updateCard(
  cardId: string, 
  front: string, 
  back: string, 
  tagIds: string[]
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify ownership via the deck
  const existingCard = await prisma.card.findUnique({
    where: { id: cardId },
    include: { deck: true }
  });

  if (!existingCard || existingCard.deck.userId !== userId) {
    throw new Error("Unauthorized");
  }

  await prisma.card.update({
    where: { id: cardId },
    data: {
      front,
      back,
      tags: {
        set: [], // 1. Disconnect all existing tags
        connect: tagIds.map(id => ({ id })) // 2. Connect the new list
      }
    }
  });

  revalidatePath(`/dashboard/deck/${existingCard.deckId}`);
}

export async function deleteCard(cardId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existingCard = await prisma.card.findUnique({
    where: { id: cardId },
    include: { deck: true }
  });

  if (!existingCard || existingCard.deck.userId !== userId) {
    throw new Error("Unauthorized");
  }

  await prisma.card.delete({
    where: { id: cardId }
  });

  revalidatePath(`/dashboard/deck/${existingCard.deckId}`);
}

// --- DECK TAG ACTIONS ---

export async function createDeckTag(name: string, color: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.deckTag.findUnique({
    where: { userId_name: { userId, name } }
  });

  if (existing) return existing;

  return await prisma.deckTag.create({
    data: { name, color, userId }
  });
}

export async function getDeckTags() {
  const { userId } = await auth();
  if (!userId) return [];

  return await prisma.deckTag.findMany({
    where: { userId },
    orderBy: { name: 'asc' }
  });
}

export async function deleteDeckTag(tagId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await prisma.deckTag.delete({
    where: { id: tagId, userId }
  });

  revalidatePath('/dashboard');
}

// --- IMPORT / MERGE ACTIONS ---

export async function mergeDecks(sourceDeckIds: string[], targetDeckId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // 1. Fetch all cards from source decks
  const sourceCards = await prisma.card.findMany({
    where: {
      deckId: { in: sourceDeckIds },
      deck: { userId } // Security check
    },
    include: { tags: true }
  });

  if (sourceCards.length === 0) return { count: 0 };

  // 2. Get current card count in target to set correct orderIndex
  const targetCount = await prisma.card.count({ where: { deckId: targetDeckId } });

  // 3. Create copies of all cards
  // Note: Prisma createMany doesn't support relations (tags), so we map loop or use a transaction.
  // For data integrity with tags, a transaction loop is safest.

  await prisma.$transaction(
    sourceCards.map((card, index) =>
      prisma.card.create({
        data: {
          front: card.front,
          back: card.back,
          deckId: targetDeckId,
          orderIndex: targetCount + index,
          tags: {
            connect: card.tags.map(t => ({ id: t.id })) // Connect to same tags
          }
        }
      })
    )
  );

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/deck/${targetDeckId}`);

  return { count: sourceCards.length };
}

export async function createDeckFromMerge(sourceDeckIds: string[], title: string, description: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // 1. Create the new deck
  const newDeck = await prisma.deck.create({
    data: {
      title,
      description,
      userId
    }
  });

  // 2. Reuse the merge logic to fill it
  await mergeDecks(sourceDeckIds, newDeck.id);

  return newDeck;
}
