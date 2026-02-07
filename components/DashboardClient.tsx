'use client'

import { useState } from 'react'
import Link from "next/link"
import { Plus, MoreVertical, BookOpen, Layers, Upload, Lock, Globe, Link as LinkIcon, CheckSquare, Square, X, Settings2, Users, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import DeleteDeckButton from "@/components/DeleteDeckButton"
import ShareDialog from "@/components/ShareDialog"
import BulkManageDialog from "@/components/BulkManageDialog" 
import { useRouter } from 'next/navigation'

// --- GRADIENT LOGIC ---
function getSmoothGradient(cards: any[]) {
  const total = cards.length;
  if (total === 0) return 'linear-gradient(to right, #f1f5f9, #f1f5f9)';
  const learning = cards.filter(c => c.status === 'learning').length;
  const reviewing = cards.filter(c => c.status === 'reviewing').length;
  const mastered = cards.filter(c => c.status === 'mastered').length;
  const newCards = total - learning - reviewing - mastered;

  let currentPos = 0;
  const stops = [];
  if (newCards > 0) {
    const width = (newCards / total) * 100;
    stops.push(`#cbd5e1 ${currentPos + (width / 2)}%`); currentPos += width;
  }
  if (learning > 0) {
    const width = (learning / total) * 100;
    stops.push(`#f87171 ${currentPos + (width / 2)}%`); currentPos += width;
  }
  if (reviewing > 0) {
    const width = (reviewing / total) * 100;
    stops.push(`#facc15 ${currentPos + (width / 2)}%`); currentPos += width;
  }
  if (mastered > 0) {
    const width = (mastered / total) * 100;
    stops.push(`#4ade80 ${currentPos + (width / 2)}%`); currentPos += width;
  }
  if (stops.length === 1) return `linear-gradient(to right, ${stops[0].split(' ')[0]}, ${stops[0].split(' ')[0]})`;
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

interface DashboardClientProps {
    decks: any[]
    currentUserId: string
    currentUserEmail: string
    userTags: any[] 
}

export default function DashboardClient({ decks, currentUserId, currentUserEmail, userTags }: DashboardClientProps) {
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  
  // --- FILTER STATE ---
  const [filterTagIds, setFilterTagIds] = useState<string[]>([])
  const [filterMode, setFilterMode] = useState<'OR' | 'AND'>('OR')
  
  const router = useRouter()

  // --- FILTER LOGIC ---
  const filteredDecks = decks.filter(deck => {
      if (filterTagIds.length === 0) return true;

      const deckTagIds = deck.tags.map((t: any) => t.id);
      
      if (filterMode === 'AND') {
          // Must have ALL selected tags
          return filterTagIds.every(id => deckTagIds.includes(id));
      } else {
          // Must have AT LEAST ONE selected tag
          return filterTagIds.some(id => deckTagIds.includes(id));
      }
  });

  const toggleSelection = (id: string) => {
    setSelectedDeckIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
      const ownedDecks = filteredDecks.filter(d => d.userId === currentUserId).map(d => d.id);
      
      if (selectedDeckIds.length === ownedDecks.length) {
          setSelectedDeckIds([]) 
      } else {
          setSelectedDeckIds(ownedDecks) 
      }
  }

  const getDeckMeta = (deck: any) => {
      const isOwner = deck.userId === currentUserId;
      const access = deck.accessList?.find((a: any) => a.userEmail === currentUserEmail);
      const isEditor = isOwner || access?.role === 'EDITOR';
      const isShared = !isOwner;
      const href = isEditor ? `/dashboard/deck/${deck.id}` : `/share/${deck.id}`;
      return { isOwner, isEditor, isShared, href };
  }

  // Helper to get full deck objects for the dialog
  const selectedDecks = decks.filter(d => selectedDeckIds.includes(d.id));

  return (
    <div className="container mx-auto p-10 space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center h-16">
        <div>
          <h1 className="text-4xl font-bold">Your Decks</h1>
          <p className="text-muted-foreground mt-2">
            Manage your collections and track your progress.
          </p>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex gap-3 items-center">
            
            {/* --- ADVANCED FILTER DROPDOWN --- */}
            {!isSelectionMode && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant={filterTagIds.length > 0 ? "secondary" : "outline"} className="gap-2">
                            <Filter className="w-4 h-4" /> 
                            {filterTagIds.length > 0 ? `Tags (${filterTagIds.length})` : "Filter"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>Filter Decks</DropdownMenuLabel>
                        <div className="px-2 py-2 flex items-center justify-between">
                            <Label htmlFor="mode-switch" className="text-xs font-normal text-slate-500">
                                Match {filterMode === 'AND' ? 'ALL' : 'ANY'}
                            </Label>
                            <div className="flex items-center gap-2">
                                <span className={filterMode === 'OR' ? "font-bold text-xs" : "text-xs text-slate-400"}>OR</span>
                                <Switch 
                                    id="mode-switch"
                                    checked={filterMode === 'AND'}
                                    onCheckedChange={(c) => setFilterMode(c ? 'AND' : 'OR')}
                                />
                                <span className={filterMode === 'AND' ? "font-bold text-xs" : "text-xs text-slate-400"}>AND</span>
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem 
                            checked={filterTagIds.length === 0}
                            onCheckedChange={() => setFilterTagIds([])}
                        >
                            Show All
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        <div className="max-h-[200px] overflow-y-auto">
                            {userTags.map(tag => (
                                <DropdownMenuCheckboxItem
                                    key={tag.id}
                                    checked={filterTagIds.includes(tag.id)}
                                    onSelect={(e) => e.preventDefault()}
                                    onCheckedChange={(checked) => {
                                        setFilterTagIds(prev => 
                                            checked 
                                            ? [...prev, tag.id] 
                                            : prev.filter(id => id !== tag.id)
                                        )
                                    }}
                                >
                                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                                    {tag.name}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </div>
                        {filterTagIds.length > 0 && (
                            <>
                                <DropdownMenuSeparator />
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="w-full justify-center text-xs h-8"
                                    onClick={() => setFilterTagIds([])}
                                >
                                    Clear Filters
                                </Button>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* --- SELECTION BAR --- */}
            {isSelectionMode ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 bg-white border border-slate-200 p-2 pl-4 rounded-xl shadow-sm">
                    {/* SELECT ALL */}
                    <div className="flex items-center gap-2 mr-2 border-r pr-4">
                        <div 
                            onClick={toggleSelectAll}
                            className="cursor-pointer flex items-center gap-2 text-sm font-bold text-slate-700 select-none"
                        >
                           {selectedDeckIds.length > 0 && selectedDeckIds.length === filteredDecks.filter(d => d.userId === currentUserId).length 
                                ? <CheckSquare className="w-5 h-5 text-blue-600" /> 
                                : <Square className="w-5 h-5 text-slate-300" />
                           }
                           <span className="w-[80px]">{selectedDeckIds.length} Selected</span>
                        </div>
                    </div>

                    {/* NEW: UNIFIED BULK MANAGE BUTTON */}
                    <BulkManageDialog 
                        selectedDecks={selectedDecks} // PASSING FULL OBJECTS
                        userTags={userTags}
                        onComplete={() => {
                            setIsSelectionMode(false)
                            setSelectedDeckIds([])
                            router.refresh()
                        }}
                    />

                    {/* CANCEL SELECTION BUTTON */}
                    <Button variant="ghost" size="icon" onClick={() => { setIsSelectionMode(false); setSelectedDeckIds([]); }} className="ml-1 text-slate-400 hover:text-slate-900">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <>
                    {decks.length > 0 && (
                        <Button variant="outline" onClick={() => setIsSelectionMode(true)} className="gap-2">
                            <Settings2 className="w-4 h-4" /> Bulk Manage
                        </Button>
                    )}
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
                </>
            )}
        </div>
      </div>

      {/* DECK GRID */}
      {filteredDecks.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-lg border border-dashed">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No decks found</h3>
          <p className="text-slate-500 mb-6">
             {filterTagIds.length > 0 ? "Try adjusting your filters." : "Create your first deck to get started."}
          </p>
          <div className="flex justify-center gap-4">
              {filterTagIds.length > 0 ? (
                  <Button variant="outline" onClick={() => setFilterTagIds([])}>Clear Filters</Button>
              ) : (
                  <>
                    <Link href="/dashboard/import">
                        <Button variant="outline">Import / Merge</Button>
                    </Link>
                    <Link href="/dashboard/create">
                        <Button>Create Deck</Button>
                    </Link>
                  </>
              )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => {
            const gradientStyle = getSmoothGradient(deck.cards);
            const isSelected = selectedDeckIds.includes(deck.id);
            const { isOwner, isEditor, isShared, href } = getDeckMeta(deck);
            
            return (
              <div key={deck.id} className="relative group">
                
                {/* SELECTION OVERLAY */}
                {isSelectionMode && isOwner && (
                    <div 
                        onClick={() => toggleSelection(deck.id)}
                        className={`absolute inset-0 z-50 cursor-pointer backdrop-blur-[1px] flex items-start justify-end p-3 rounded-lg border-2 transition-all ${isSelected ? 'bg-blue-50/30 border-blue-500' : 'bg-white/40 border-transparent hover:border-slate-300'}`}
                    >
                         <div className={`w-6 h-6 rounded border flex items-center justify-center shadow-lg transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                            {isSelected && <CheckSquare className="w-4 h-4" />}
                         </div>
                    </div>
                )}

                {/* SHARED WARNING */}
                {isSelectionMode && !isOwner && (
                     <div className="absolute inset-0 z-50 bg-slate-100/80 flex items-center justify-center rounded-lg border-2 border-transparent">
                         <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded shadow-sm">Shared (Cannot Manage)</span>
                     </div>
                )}

                <Card className={`group relative flex flex-col overflow-hidden hover:shadow-lg transition-all ${isSelected && isSelectionMode ? 'ring-0' : ''}`}>
                    
                    {!isSelectionMode && (
                        <Link href={href} className="absolute inset-0 z-0 focus:outline-none">
                            <span className="sr-only">View Deck</span>
                        </Link>
                    )}

                    <CardHeader className="pb-2 relative pointer-events-none">
                    <div className="flex justify-between items-start">
                        
                        <div className="space-y-1 relative z-10 pointer-events-none block"> 
                            <CardTitle className="line-clamp-1 text-xl flex items-center gap-2">
                                {deck.title}
                                {isShared && (
                                    <span title="Shared with you" className="bg-blue-100 text-blue-700 p-0.5 rounded">
                                        <Users className="w-3 h-3" />
                                    </span>
                                )}
                                {isOwner && (
                                    <>
                                    {deck.visibility === 'PRIVATE' && <Lock className="w-3 h-3 text-slate-300" />}
                                    {deck.visibility === 'PUBLIC' && <Globe className="w-3 h-3 text-green-500" />}
                                    {deck.visibility === 'UNLISTED' && <LinkIcon className="w-3 h-3 text-blue-500" />}
                                    </>
                                )}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 min-h-[40px]">
                                {deck.description || "No description provided."}
                            </CardDescription>
                        </div>
                        
                        <div className="relative z-10 pointer-events-auto pl-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <Link href={href}>
                                <DropdownMenuItem>{isEditor ? 'Manage Deck' : 'View Cards'}</DropdownMenuItem>
                            </Link>
                            <Link href={`/dashboard/deck/${deck.id}/study`}>
                                <DropdownMenuItem>Study Now</DropdownMenuItem>
                            </Link>
                            {isOwner && <DeleteDeckButton deckId={deck.id} />}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                    </div>
                    </CardHeader>

                    <CardContent className="flex-1 relative z-0 pointer-events-none">
                        <div className="flex flex-wrap gap-2 mt-2 pointer-events-auto">
                            <Badge variant="secondary" className="font-normal text-slate-500">
                            {deck._count?.cards || 0} cards
                            </Badge>
                            {deck.tags.slice(0, 3).map((tag: any) => (
                            <Badge 
                                key={tag.id} 
                                style={{ backgroundColor: tag.color }} 
                                className="text-white border-0 px-2 font-medium text-[10px]"
                            >
                                {tag.name}
                            </Badge>
                            ))}
                        </div>
                    </CardContent>

                    <CardFooter className="pt-2 pb-4 border-t bg-slate-50/50 flex items-center justify-between gap-2 relative z-10 pointer-events-none px-4">
                        <div className="pointer-events-auto z-20">
                            {isEditor && <ShareDialog deck={deck} />}
                        </div>
                        <Link href={`/dashboard/deck/${deck.id}/study`} className={`flex-1 pointer-events-auto ${isSelectionMode ? 'pointer-events-none opacity-50' : ''}`}>
                            <Button variant="ghost" className="w-full justify-end hover:bg-white group-hover:text-blue-600 transition-colors" size="sm">
                                <span className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" /> Study
                                </span>
                            </Button>
                        </Link>
                    </CardFooter>

                    <div 
                        className="h-2 w-full absolute bottom-0 left-0 transition-all duration-1000"
                        style={{ background: gradientStyle }}
                    />
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
