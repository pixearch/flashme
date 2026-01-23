import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import CardForm from "@/components/CardForm"; 

export default async function DeckPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) return <div>Please sign in</div>;

  const deck = await prisma.deck.findUnique({
    where: { 
      id: params.id,
      userId 
    },
    include: { 
      cards: {
        orderBy: { orderIndex: 'asc' }
      } 
    }
  });

  if (!deck) return <div>Deck not found</div>;

  return (
    <div className="container mx-auto p-10 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">{deck.title}</h1>
          <p className="text-muted-foreground">{deck.description}</p>
          <p className="text-sm text-slate-500 mt-2">{deck.cards.length} cards</p>
        </div>
        <div className="space-x-4">
            <Link href="/dashboard">
                <Button variant="outline">Back to Decks</Button>
            </Link>
            {deck.cards.length > 0 && (
                <Button className="bg-green-600 hover:bg-green-700">Study Now</Button>
            )}
        </div>
      </div>

      {/* The Add Card Form */}
      <CardForm deckId={deck.id} />

      {/* The Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deck.cards.map((card, index) => (
          <Card key={card.id} className="relative group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-400">Card {index + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-lg mb-4">{card.front}</p>
              <div className="h-px bg-slate-100 my-4"/>
              <p className="text-slate-600">{card.back}</p>
            </CardContent>
          </Card>
        ))}
        
        {deck.cards.length === 0 && (
            <div className="col-span-full text-center py-20 bg-slate-50 rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">This deck is empty. Add your first card above!</p>
            </div>
        )}
      </div>
    </div>
  );
}
