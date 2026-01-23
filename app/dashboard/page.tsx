import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { createDeck } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default async function Dashboard() {
  const { userId } = await auth();
  
  if (!userId) return <div>Please sign in</div>;

  // 1. Fetch the user's decks from the database
  const decks = await prisma.deck.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container mx-auto p-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">My Decks</h1>
      </div>

      {/* 2. Simple Form to Create a Deck */}
      <div className="p-6 border rounded-lg bg-slate-50">
        <h2 className="text-xl font-semibold mb-4">Create New Deck</h2>
        <form action={createDeck} className="flex gap-4">
          <Input name="title" placeholder="Deck Title (e.g. Biology 101)" required />
          <Input name="description" placeholder="Description (optional)" />
          <Button type="submit">Create Deck</Button>
        </form>
      </div>

      {/* 3. List the Decks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {decks.map((deck) => (
          <Link href={`/dashboard/deck/${deck.id}`} key={deck.id}>
            <Card className="hover:shadow-lg transition cursor-pointer h-full">
              <CardHeader>
                <CardTitle>{deck.title}</CardTitle>
                <CardDescription>{deck.description || "No description"}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
        
        {decks.length === 0 && (
          <p className="text-muted-foreground col-span-3 text-center py-10">
            You don't have any decks yet. Create one above!
          </p>
        )}
      </div>
    </div>
  );
}
