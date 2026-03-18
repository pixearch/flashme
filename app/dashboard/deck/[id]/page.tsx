import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import DeckPageClient from "@/components/DeckPageClient";
import { notFound } from "next/navigation";

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) return <div>Please sign in</div>;

  const email = user.emailAddresses?.[0]?.emailAddress;
  if (!email) return <div>User email not found</div>;

  // 1. FETCH DECK
  // Allow access if Owner OR Editor
  const deck = await prisma.deck.findFirst({
    where: {
      id: id,
      OR: [
        { userId: userId },
        { 
           accessList: { 
             some: { userEmail: email, role: 'EDITOR' } 
           } 
        }
      ]
    },
    include: {
      cards: {
        orderBy: { orderIndex: "asc" },
        include: { tags: true }
      },
      tags: true,
      accessList: true 
    },
  });

  if (!deck) return notFound();

  // 2. FETCH TAGS (This was missing!)
  // We fetch the *current user's* tags so they can use their own taxonomy
  const allTags = await prisma.tag.findMany({
    where: { userId: userId },
    orderBy: { name: 'asc' }
  });

  // 3. Pass both to the client
  return <DeckPageClient deck={deck} allTags={allTags} />;
}
