'use client'

import { useState, useMemo } from 'react'
import Link from "next/link"
import { Search, Filter, X, Check, Layers } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import DeckSettings from "@/components/DeckSettings"
import CreateDeckForm from "@/components/CreateDeckForm"

interface Tag {
  id: string
  name: string
  color: string
}

interface Deck {
  id: string
  title: string
  description: string | null
  tags: Tag[]
  cards: {
    tags: Tag[]
  }[]
}

interface DashboardClientProps {
  decks: Deck[]
  allDeckTags: Tag[]
  allCardTags: Tag[]
}

export default function DashboardClient({ decks, allDeckTags, allCardTags }: DashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  
  // DECK Tag State
  const [selectedDeckTagIds, setSelectedDeckTagIds] = useState<string[]>([])
  const [deckMatchMode, setDeckMatchMode] = useState<'OR' | 'AND'>('OR')
  
  // CARD Tag State
  const [selectedCardTagIds, setSelectedCardTagIds] = useState<string[]>([])
  const [cardMatchMode, setCardMatchMode] = useState<'OR' | 'AND'>('OR')

  // --- FILTER LOGIC ---
  const filteredDecks = useMemo(() => {
    return decks.filter(deck => {
      // 1. Search Text Match
      const matchesSearch = deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (deck.description || "").toLowerCase().includes(searchQuery.toLowerCase())

      // 2. Deck Tag Match
      let matchesDeckTags = true
      if (selectedDeckTagIds.length > 0) {
        const deckTagIds = deck.tags.map(t => t.id)
        if (deckMatchMode === 'OR') {
            matchesDeckTags = selectedDeckTagIds.some(id => deckTagIds.includes(id))
        } else {
            matchesDeckTags = selectedDeckTagIds.every(id => deckTagIds.includes(id))
        }
      }

      // 3. Card Tag Match
      let matchesCardTags = true
      if (selectedCardTagIds.length > 0) {
        const uniqueCardTagsInDeck = new Set(
            deck.cards.flatMap(c => c.tags.map(t => t.id))
        )

        if (cardMatchMode === 'OR') {
            matchesCardTags = selectedCardTagIds.some(id => uniqueCardTagsInDeck.has(id))
        } else {
            matchesCardTags = selectedCardTagIds.every(id => uniqueCardTagsInDeck.has(id))
        }
      }

      return matchesSearch && matchesDeckTags && matchesCardTags
    })
  }, [decks, searchQuery, selectedDeckTagIds, deckMatchMode, selectedCardTagIds, cardMatchMode])

  // Helpers
  const toggleDeckTag = (id: string) => {
    setSelectedDeckTagIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }
  const toggleCardTag = (id: string) => {
    setSelectedCardTagIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }
  const clearFilters = () => {
    setSearchQuery("")
    setSelectedDeckTagIds([])
    setDeckMatchMode('OR')
    setSelectedCardTagIds([])
    setCardMatchMode('OR')
  }

  return (
    <div className="container mx-auto p-10 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">My Decks</h1>
        <CreateDeckForm />
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-lg border shadow-sm">
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* SEARCH */}
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Search titles..." 
                    className="pl-9" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            {/* DECK TAGS FILTER */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="border-dashed">
                        <Filter className="mr-2 h-4 w-4" />
                        Deck Tags
                        {selectedDeckTagIds.length > 0 && (
                            <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">{selectedDeckTagIds.length}</Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0" align="start">
                    <div className="p-2 border-b text-xs font-medium text-slate-500 uppercase flex justify-between items-center">
                        <span>Deck Category</span>
                        {/* DECK MATCH TOGGLE */}
                        <div className="flex bg-slate-100 rounded p-0.5">
                            <button 
                                onClick={() => setDeckMatchMode('OR')}
                                className={`text-[10px] px-2 py-0.5 rounded ${deckMatchMode === 'OR' ? 'bg-white shadow text-black' : 'text-slate-500'}`}
                            >
                                Any
                            </button>
                            <button 
                                onClick={() => setDeckMatchMode('AND')}
                                className={`text-[10px] px-2 py-0.5 rounded ${deckMatchMode === 'AND' ? 'bg-white shadow text-black' : 'text-slate-500'}`}
                            >
                                All
                            </button>
                        </div>
                    </div>
                    <div className="p-2 space-y-1 max-h-60 overflow-auto">
                        {allDeckTags.map(tag => (
                            <div key={tag.id} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-100 cursor-pointer" onClick={() => toggleDeckTag(tag.id)}>
                                <div className={`flex items-center justify-center w-4 h-4 rounded border ${selectedDeckTagIds.includes(tag.id) ? 'bg-black border-black text-white' : 'border-slate-300'}`}>
                                    {selectedDeckTagIds.includes(tag.id) && <Check className="h-3 w-3" />}
                                </div>
                                <span className="text-sm flex-1">{tag.name}</span>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                            </div>
                        ))}
                    </div>
                    {selectedDeckTagIds.length > 0 && (
                        <div className="p-2 border-t bg-slate-50 text-xs text-center text-slate-500">
                            {deckMatchMode === 'OR' 
                                ? "Contains ANY selected tag" 
                                : "Contains ALL selected tags"}
                        </div>
                    )}
                </PopoverContent>
            </Popover>

            {/* CARD CONTENT FILTER */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="border-dashed">
                        <Layers className="mr-2 h-4 w-4" />
                        Card Content Tags
                        {selectedCardTagIds.length > 0 && (
                            <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">{selectedCardTagIds.length}</Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                    <div className="p-2 border-b text-xs font-medium text-slate-500 uppercase flex justify-between items-center">
                        <span>Has Cards With...</span>
                        {/* CARD MATCH TOGGLE */}
                        <div className="flex bg-slate-100 rounded p-0.5">
                            <button 
                                onClick={() => setCardMatchMode('OR')}
                                className={`text-[10px] px-2 py-0.5 rounded ${cardMatchMode === 'OR' ? 'bg-white shadow text-black' : 'text-slate-500'}`}
                            >
                                Any
                            </button>
                            <button 
                                onClick={() => setCardMatchMode('AND')}
                                className={`text-[10px] px-2 py-0.5 rounded ${cardMatchMode === 'AND' ? 'bg-white shadow text-black' : 'text-slate-500'}`}
                            >
                                All
                            </button>
                        </div>
                    </div>

                    <div className="p-2 space-y-1 max-h-60 overflow-auto">
                        {allCardTags.map(tag => (
                            <div key={tag.id} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-100 cursor-pointer" onClick={() => toggleCardTag(tag.id)}>
                                <div className={`flex items-center justify-center w-4 h-4 rounded border ${selectedCardTagIds.includes(tag.id) ? 'bg-black border-black text-white' : 'border-slate-300'}`}>
                                    {selectedCardTagIds.includes(tag.id) && <Check className="h-3 w-3" />}
                                </div>
                                <span className="text-sm flex-1">{tag.name}</span>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {/* RESET BUTTON */}
            {(searchQuery || selectedDeckTagIds.length > 0 || selectedCardTagIds.length > 0) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 lg:px-3 text-red-500 hover:text-red-600 hover:bg-red-50">
                    Reset Filters
                    <X className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
      </div>

      {/* DECK GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDecks.map((deck) => (
          <Link href={`/dashboard/deck/${deck.id}`} key={deck.id} className="group">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{deck.title}</CardTitle>
                    {/* DECK TAGS */}
                    <div className="flex gap-1 flex-wrap mt-2">
                        {deck.tags.map(tag => (
                            <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded text-white font-medium shadow-sm" style={{ backgroundColor: tag.color }}>
                                #{tag.name}
                            </span>
                        ))}
                    </div>
                  </div>
                  <DeckSettings deck={deck} variant="icon" />
                </div>
                <CardDescription className="mt-2 line-clamp-2">{deck.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between mt-2 text-sm text-slate-500">
                    <span>{deck.cards.length} cards</span>
                    {selectedCardTagIds.length > 0 && (
                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                            Matches Card Filter
                        </span>
                    )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {filteredDecks.length === 0 && (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">No decks match your search criteria.</p>
            <Button variant="link" onClick={clearFilters}>Clear filters</Button>
          </div>
        )}
      </div>
    </div>
  )
}
