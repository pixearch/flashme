import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getTags } from "@/app/actions";
import DeckPageClient from "@/components/DeckPageClient";

export default async function DeckPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) return <div>Please sign in</div>;

  // 1. Fetch the Deck and its Cards (and Tags)
  const deck = await prisma.deck.findUnique({
    where: { 
      id: params.id,
      userId 
    },
    include: { 
      tags: true, // Deck tags (to display in header)
      cards: {
        orderBy: { orderIndex: 'asc' },
        include: { tags: true } // Card tags (for filtering)
      } 
    }
  });

  if (!deck) return <div>Deck not found</div>;

  // 2. Fetch ALL available tags (for the filter dropdown options)
  const allTags = await getTags();

  // 3. Render the Client Component
  return <DeckPageClient deck={deck} allTags={allTags} />;
}
