'use client'

import { useState, useMemo } from 'react'
import Link from "next/link"
import { Search, Filter, X, Check, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import DeckSettings from "@/components/DeckSettings"
import CardForm from "@/components/CardForm"
import EditCardDialog from "@/components/EditCardDialog"

interface Tag {
  id: string
  name: string
  color: string
}

interface CardData {
  id: string
  front: string
  back: string
  orderIndex: number
  tags: Tag[]
}

interface DeckData {
  id: string
  title: string
  description: string | null
  tags: Tag[] // Deck tags
  cards: CardData[]
}

interface DeckPageClientProps {
  deck: DeckData
  allTags: Tag[] // Global tags for the filter dropdown
}

export default function DeckPageClient({ deck, allTags }: DeckPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [matchMode, setMatchMode] = useState<'OR' | 'AND'>('OR')

  // --- FILTER LOGIC ---
  const filteredCards = useMemo(() => {
    return deck.cards.filter(card => {
      const lowerQuery = searchQuery.toLowerCase()

      // 1. Search Text Match (Front OR Back OR Tag Name)
      const matchesSearch = card.front.toLowerCase().includes(lowerQuery) ||
                            card.back.toLowerCase().includes(lowerQuery) ||
                            card.tags.some(tag => tag.name.toLowerCase().includes(lowerQuery))

      // 2. Tag Filter Match (Dropdown Selection)
      let matchesTags = true
      if (selectedTagIds.length > 0) {
        const cardTagIds = card.tags.map(t => t.id)
        if (matchMode === 'OR') {
            // Does card have ANY of the selected tags?
            matchesTags = selectedTagIds.some(id => cardTagIds.includes(id))
        } else {
            // Does card have ALL of the selected tags?
            matchesTags = selectedTagIds.every(id => cardTagIds.includes(id))
        }
      }

      return matchesSearch && matchesTags
    })
  }, [deck.cards, searchQuery, selectedTagIds, matchMode])

  const toggleTag = (id: string) => {
    setSelectedTagIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTagIds([])
    setMatchMode('OR')
  }

  return (
    <div className="container mx-auto p-10 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold">{deck.title}</h1>
          <p className="text-muted-foreground">{deck.description}</p>
          <div className="flex gap-2 mt-2">
             <span className="text-sm text-slate-500">{deck.cards.length} cards</span>
             {deck.tags && deck.tags.map(t => (
                 <Badge key={t.id} style={{ backgroundColor: t.color }} className="text-[10px] px-1.5 h-5">#{t.name}</Badge>
             ))}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard">
                <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
            </Link>
            
            <DeckSettings deck={deck} />

            {deck.cards.length > 0 && (
                <Link href={`/dashboard/deck/${deck.id}/study`}>
                    <Button className="bg-green-600 hover:bg-green-700">Study Now</Button>
                </Link>
            )}
        </div>
      </div>

      {/* ADD CARD FORM */}
      <CardForm deckId={deck.id} />

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search cards..." 
            className="pl-9" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="border-dashed w-full md:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filter Tags
              {selectedTagIds.length > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                  {selectedTagIds.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[260px] p-0" align="start">
             <div className="p-2 border-b text-xs font-medium text-slate-500 uppercase flex justify-between items-center">
                <span>Filter Cards</span>
                <div className="flex bg-slate-100 rounded p-0.5">
                    <button onClick={() => setMatchMode('OR')} className={`text-[10px] px-2 py-0.5 rounded ${matchMode === 'OR' ? 'bg-white shadow text-black' : 'text-slate-500'}`}>Any</button>
                    <button onClick={() => setMatchMode('AND')} className={`text-[10px] px-2 py-0.5 rounded ${matchMode === 'AND' ? 'bg-white shadow text-black' : 'text-slate-500'}`}>All</button>
                </div>
            </div>
            <div className="p-2 space-y-1 max-h-60 overflow-auto">
                {allTags.map(tag => (
                    <div key={tag.id} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-100 cursor-pointer" onClick={() => toggleTag(tag.id)}>
                        <div className={`flex items-center justify-center w-4 h-4 rounded border ${selectedTagIds.includes(tag.id) ? 'bg-black border-black text-white' : 'border-slate-300'}`}>
                            {selectedTagIds.includes(tag.id) && <Check className="h-3 w-3" />}
                        </div>
                        <span className="text-sm flex-1">{tag.name}</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    </div>
                ))}
            </div>
            {selectedTagIds.length > 0 && (
                <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full justify-center text-xs" onClick={() => setSelectedTagIds([])}>Clear</Button>
                </div>
            )}
          </PopoverContent>
        </Popover>

        {(searchQuery || selectedTagIds.length > 0) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 hover:bg-red-50">
                Reset <X className="ml-2 h-4 w-4" />
            </Button>
        )}
      </div>

      {/* CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card, index) => (
          <Card key={card.id} className="relative group hover:shadow-md transition-shadow">
            
            {/* EDIT PENCIL */}
            <EditCardDialog card={card} />

            <CardHeader className="pb-2 flex flex-row justify-between items-start space-y-0">
              <CardTitle className="text-sm font-bold text-slate-400">Card {card.orderIndex + 1}</CardTitle>
              
              <div className="flex gap-1 flex-wrap justify-end max-w-[70%] pr-6">
                {card.tags.map(tag => (
                   <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded text-white font-medium shadow-sm" style={{ backgroundColor: tag.color }}>
                     #{tag.name}
                   </span>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-lg mb-4 whitespace-pre-wrap">{card.front}</p>
              <div className="h-px bg-slate-100 my-4"/>
              <p className="text-slate-600 whitespace-pre-wrap">{card.back}</p>
            </CardContent>
          </Card>
        ))}
        
        {filteredCards.length === 0 && deck.cards.length > 0 && (
             <div className="col-span-full text-center py-20 bg-slate-50 rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">No cards match your search.</p>
                <Button variant="link" onClick={clearFilters}>Clear filters</Button>
            </div>
        )}

        {deck.cards.length === 0 && (
            <div className="col-span-full text-center py-20 bg-slate-50 rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">This deck is empty. Add your first card above!</p>
            </div>
        )}
      </div>
    </div>
  )
}
