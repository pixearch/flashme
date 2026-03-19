import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import ImportDecksClient from "@/components/ImportDecksClient";
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { isClerkConfigured } from "@/lib/clerk-config";

export default async function ImportPage() {
  if (!isClerkConfigured) {
    return <div>Authentication is not configured.</div>;
  }

  const { userId } = await auth();
  if (!userId) return <div>Please sign in</div>;

  // Fetch decks (lightweight, just needed for the list)
  const decks = await prisma.deck.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      cards: { select: { id: true } } // Just counting cards
    }
  });

  return (
    <div className="container mx-auto p-10 pb-24">
      <div className="mb-8 flex items-center gap-4">
          <Link href="/dashboard">
              <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
              </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Import & Merge</h1>
            <p className="text-muted-foreground">Organize your cards by merging decks.</p>
          </div>
      </div>

      <ImportDecksClient decks={decks} />
    </div>
  );
}
