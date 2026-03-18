import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import DashboardClient from "@/components/DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  // 1. Fetch Decks (with counts and tags)
  const decks = await prisma.deck.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { cards: true }
      },
      tags: true, // Fetch tags for display
      accessList: true, // Fetch access info
      cards: true // Fetch cards for gradient logic
    }
  });

  // 2. Fetch Shared Decks
  const userEmail = user.emailAddresses?.[0]?.emailAddress;
  if (!userEmail) {
    return <div>User email not found</div>;
  }

  const sharedAccess = await prisma.deckAccess.findMany({
    where: { userEmail },
    include: {
      deck: {
        include: {
          _count: { select: { cards: true } },
          tags: true,
          cards: true
        }
      }
    }
  });

  const sharedDecks = sharedAccess.map(a => a.deck);

  // 3. Combine them
  const allDecks = [...decks, ...sharedDecks];

  // 4. Fetch ALL User Tags (for the filter dropdown)
  const allTags = await prisma.tag.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
  });

  return (
    <DashboardClient 
        decks={allDecks} 
        currentUserId={userId} 
        currentUserEmail={userEmail}
        userTags={allTags} // Pass tags to client
    />
  );
}
