import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import StudySessionClient from "@/components/StudySessionClient";
import { notFound } from "next/navigation";
import { getStudyProgress } from "@/app/actions"; // Import the new action

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  
  if (!userId) return <div>Please sign in</div>;

  const deck = await prisma.deck.findUnique({
    where: { id },
    include: {
      cards: {
        orderBy: { orderIndex: "asc" }
      }
    }
  });

  if (!deck) return notFound();

  // Fetch saved progress
  const savedIndex = await getStudyProgress(id);

  return (
    <StudySessionClient 
        deck={deck} 
        initialIndex={savedIndex} // Pass it to the client
    />
  );
}
