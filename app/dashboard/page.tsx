import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, MoreVertical, BookOpen, Layers, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import DeleteDeckButton from "@/components/DeleteDeckButton"; 

// Helper: Generates a smooth, weighted gradient based on card status
function getSmoothGradient(cards: any[]) {
  const total = cards.length;
  if (total === 0) return 'linear-gradient(to right, #f1f5f9, #f1f5f9)'; // Empty Gray

  const learning = cards.filter(c => c.status === 'learning').length;
  const reviewing = cards.filter(c => c.status === 'reviewing').length;
  const mastered = cards.filter(c => c.status === 'mastered').length;
  const newCards = total - learning - reviewing - mastered;

  // Calculate midpoints for the gradient stops
  let currentPos = 0;
  const stops = [];

  // 1. Gray (New)
  if (newCards > 0) {
    const width = (newCards / total) * 100;
    stops.push(`#cbd5e1 ${currentPos + (width / 2)}%`); 
    currentPos += width;
  }

  // 2. Red (Learning)
  if (learning > 0) {
    const width = (learning / total) * 100;
    stops.push(`#f87171 ${currentPos + (width / 2)}%`); 
    currentPos += width;
  }

  // 3. Yellow (Reviewing)
  if (reviewing > 0) {
    const width = (reviewing / total) * 100;
    stops.push(`#facc15 ${currentPos + (width / 2)}%`); 
    currentPos += width;
  }

  // 4. Green (Mastered)
  if (mastered > 0) {
    const width = (mastered / total) * 100;
    stops.push(`#4ade80 ${currentPos + (width / 2)}%`); 
    currentPos += width;
  }

  if (stops.length === 1) {
    return `linear-gradient(to right, ${stops[0].split(' ')[0]}, ${stops[0].split(' ')[0]})`;
  }

  return `linear-gradient(to right, ${stops.join(', ')})`;
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const decks = await prisma.deck.findMany({
    where: {
      userId: userId,
    },
    include: {
      _count: {
        select: { cards: true },
      },
      tags: true,
      cards: {
        select: { status: true } 
      }
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container mx-auto p-10 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Your Decks</h1>
          <p className="text-muted-foreground mt-2">
            Manage your collections and track your progress.
          </p>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
            <Link href="/dashboard/import">
                <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" /> Import / Merge
                </Button>
            </Link>
            <Link href="/dashboard/create">
                <Button className="gap-2">
                    <Plus className="w-4 h-4" /> Create Deck
                </Button>
            </Link>
        </div>
      </div>

      {/* Deck Grid */}
      {decks.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-lg border border-dashed">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No decks yet</h3>
          <p className="text-slate-500 mb-6">Create your first deck to get started.</p>
          <div className="flex justify-center gap-4">
              <Link href="/dashboard/import">
                <Button variant="outline">Import / Merge</Button>
              </Link>
              <Link href="/dashboard/create">
                <Button>Create Deck</Button>
              </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => {
            const gradientStyle = getSmoothGradient(deck.cards);
            
            return (
              <Card key={deck.id} className="group relative flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                
                {/* --- CLICKABLE COVER LINK (Background) --- */}
                <Link 
                  href={`/dashboard/deck/${deck.id}`} 
                  className="absolute inset-0 z-0 focus:outline-none"
                >
                  <span className="sr-only">View Deck</span>
                </Link>

                <CardHeader className="pb-2 relative pointer-events-none">
                  <div className="flex justify-between items-start">
                    
                    {/* TITLE AREA - Explicitly Clickable Link above the cover link */}
                    <Link 
                        href={`/dashboard/deck/${deck.id}`} 
                        className="space-y-1 relative z-10 pointer-events-auto block hover:opacity-80 transition-opacity"
                    > 
                      <CardTitle className="line-clamp-1 text-xl">
                          {deck.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 min-h-[40px]">
                        {deck.description || "No description provided."}
                      </CardDescription>
                    </Link>
                    
                    {/* DROPDOWN MENU - Z-Index 10 ensures it sits above the background link */}
                    <div className="relative z-10 pointer-events-auto pl-2">
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                              <MoreVertical className="h-4 w-4" />
                          </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                          <Link href={`/dashboard/deck/${deck.id}`}>
                              <DropdownMenuItem>View Cards</DropdownMenuItem>
                          </Link>
                          <Link href={`/dashboard/deck/${deck.id}/study`}>
                              <DropdownMenuItem>Study Now</DropdownMenuItem>
                          </Link>
                          <DeleteDeckButton deckId={deck.id} />
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 relative z-0 pointer-events-none">
                  <div className="flex flex-wrap gap-2 mt-2 pointer-events-auto">
                    <Badge variant="secondary" className="font-normal text-slate-500">
                      {deck._count.cards} cards
                    </Badge>
                    {deck.tags.slice(0, 3).map((tag) => (
                      <Badge 
                          key={tag.id} 
                          style={{ backgroundColor: tag.color }} 
                          className="text-white border-0 px-2 font-medium text-[10px]"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    {deck.tags.length > 3 && (
                       <span className="text-xs text-slate-400 self-center">+{deck.tags.length - 3}</span>
                    )}
                  </div>
                </CardContent>

                {/* FOOTER - STUDY BUTTON */}
                <CardFooter className="pt-2 pb-4 border-t bg-slate-50/50 flex justify-between items-center relative z-10 pointer-events-none">
                   <Link href={`/dashboard/deck/${deck.id}/study`} className="w-full pointer-events-auto">
                      <Button variant="ghost" className="w-full justify-between hover:bg-white group-hover:text-blue-600 transition-colors" size="sm">
                          <span className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4" /> Study
                          </span>
                          <span className="text-xs text-muted-foreground group-hover:text-blue-600">
                               Launch Session &rarr;
                          </span>
                      </Button>
                   </Link>
                </CardFooter>

                {/* TEMPERATURE BAR - SMOOTH GRADIENT */}
                <div 
                  className="h-2 w-full absolute bottom-0 left-0 transition-all duration-1000"
                  style={{ background: gradientStyle }}
                />
                
                {/* SUBTLE INNER GLOW */}
                {deck.cards.length > 0 && (
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-[0.05] z-0 mix-blend-multiply"
                      style={{ background: gradientStyle }}
                    />
                )}

              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
