'use server'

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createDeck(formData: FormData) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("You must be logged in");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  await prisma.deck.create({
    data: {
      title,
      description,
      userId,
    },
  });

  revalidatePath("/dashboard");
}

export async function createCard(formData: FormData) {
  const { userId } = await auth();
  const deckId = formData.get("deckId") as string;
  const front = formData.get("front") as string;
  const back = formData.get("back") as string;

  if (!userId || !deckId) throw new Error("Invalid Request");

  // Get the current card count to determine order
  const count = await prisma.card.count({
    where: { deckId }
  });

  await prisma.card.create({
    data: {
      front: front,
      back: back,
      deckId,
      orderIndex: count, // Puts it at the end of the deck
    }
  });

  revalidatePath(`/dashboard/deck/${deckId}`);
}

export async function deleteCard(cardId: string, deckId: string) {
    const { userId } = await auth();
    if (!userId) return;

    // Verify ownership before deleting
    const deck = await prisma.deck.findUnique({
        where: { id: deckId, userId }
    });

    if (deck) {
        await prisma.card.delete({
            where: { id: cardId }
        });
        revalidatePath(`/dashboard/deck/${deckId}`);
    }
}
