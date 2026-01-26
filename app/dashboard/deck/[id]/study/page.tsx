import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getStudySession } from "@/app/actions";
import StudyController from "@/components/StudyController"; // <--- Wrapper Component

export default async function StudyPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) return <div>Please sign in</div>;

  // 1. Fetch Deck & Cards
  const deck = await prisma.deck.findUnique({
    where: { id: params.id, userId },
    include: { 
      cards: {
        include: { tags: true }
      }
    }
  });

  if (!deck) return <div>Deck not found</div>;

  // 2. Fetch Active Session (Bookmark)
  const session = await getStudySession(deck.id);

  // 3. Render the Controller (Client Component)
  return (
    <StudyController 
      deck={deck} 
      initialSession={session} 
    />
  );
}
