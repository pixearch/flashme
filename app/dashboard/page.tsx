import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getDeckTags, getTags } from "@/app/actions"; // <--- Added getTags
import DashboardClient from "@/components/DashboardClient";

export default async function Dashboard() {
  const { userId } = await auth();
  if (!userId) return <div>Please sign in</div>;

  // 1. Fetch Decks with their Tags AND their Cards' Tags
  const decks = await prisma.deck.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { 
      tags: true, // Deck Tags
      cards: {    // Card Tags (Deep fetch)
        include: { tags: true }
      }
    }
  });

  // 2. Fetch All Available Tags (for the filter dropdowns)
  const allDeckTags = await getDeckTags();
  const allCardTags = await getTags(); // <--- Fetch Card Tags

  // 3. Render Client Component
  return (
    <DashboardClient 
        decks={decks} 
        allDeckTags={allDeckTags} 
        allCardTags={allCardTags} 
    />
  );
}
