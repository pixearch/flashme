import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import StudySession from "@/components/StudySession";

export default async function StudyPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return <div>Please sign in</div>;

  const { id } = await params;

  const deck = await prisma.deck.findUnique({
    where: { id, userId },
    include: { 
      cards: {
        orderBy: { orderIndex: 'asc' }
      }
    }
  });

  if (!deck) return <div>Deck not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{deck.title}: Study Mode</h1>
        <Link href={`/dashboard/deck/${id}`}>
          <Button variant="ghost">Exit Study</Button>
        </Link>
      </div>

      <StudySession cards={deck.cards} />
    </div>
  );
}
