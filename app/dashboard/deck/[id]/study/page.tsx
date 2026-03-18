import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import StudySessionClient from "@/components/StudySessionClient";
import { notFound } from "next/navigation";
import { getStudyProgress } from "@/app/actions"; // Import the new action

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId || !user) return <div>Please sign in</div>;

  const userEmail = user.emailAddresses?.[0]?.emailAddress;
  if (!userEmail) return <div>User email not found</div>;

  // Check deck access: owner OR shared access OR public/unlisted
  const deck = await prisma.deck.findFirst({
    where: {
      id,
      OR: [
        { userId },
        {
          accessList: {
            some: { userEmail }
          }
        },
        {
          visibility: { in: ['PUBLIC', 'UNLISTED'] }
        }
      ]
    },
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
