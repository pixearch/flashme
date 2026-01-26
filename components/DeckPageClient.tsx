'use client'

import { useState, useMemo } from 'react'
import Link from "next/link"
import { Search, Filter, X, Check, ArrowLeft, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import DeckSettings from "@/components/DeckSettings"
import CardForm from "@/components/CardForm"
import EditCardDialog from "@/components/EditCardDialog"
import { bulkAddTags, bulkRemoveTags } from "@/app/actions"
import { toast } from "sonner" 

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
  status?: string | null // Added Status
}

interface DeckData {
  id: string
  title: string
  description: string | null
  tags: Tag[]
  cards: CardData[]
}

interface DeckPageClientProps {
  deck: DeckData
  allTags: Tag[]
}

export default function DeckPageClient({ deck, allTags }: DeckPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [matchMode, setMatchMode] = useState<'OR' | 'AND'>('OR')

  // --- SELECTION STATE ---
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)
  
  // --- BULK TAG STATE ---
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false)
  const [pendingTagId, setPendingTagId] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<{ card: CardData, resolveTagId: string | null }[]>([])
  const [safeUpdates, setSafeUpdates] = useState<{ cardId: string }[]>([])

  // --- FILTER LOGIC ---
  const filteredCards = useMemo(() => {
    return deck.cards.filter(card => {
      const lowerQuery = searchQuery.toLowerCase()
      const matchesSearch = card.front.toLowerCase().includes(lowerQuery) ||
                            card.back.toLowerCase().includes(lowerQuery) ||
                            card.tags.some(tag => tag.name.toLowerCase().includes(lowerQuery))

      let matchesTags = true
      if (selectedTagIds.length > 0) {
        const cardTagIds = card.tags.map(t => t.id)
        if (matchMode === 'OR') {
            matchesTags = selectedTagIds.some(id => cardTagIds.includes(id))
        } else {
            matchesTags = selectedTagIds.every(id => cardTagIds.includes(id))
        }
      }

      return matchesSearch && matchesTags
    })
  }, [deck.cards, searchQuery, selectedTagIds, matchMode])

  // --- SELECTION HANDLERS ---
  const handleSelect = (id: string, index: number, isSelecting: boolean, shiftKey: boolean) => {
    if (shiftKey && lastSelectedId && isSelecting) {
        const lastIndex = filteredCards.findIndex(c => c.id === lastSelectedId)
        if (lastIndex !== -1) {
            const start = Math.min(lastIndex, index)
            const end = Math.max(lastIndex, index)
            const rangeIds = filteredCards.slice(start, end + 1).map(c => c.id)
            setSelectedCardIds(prev => {
                const newSet = new Set(prev)
                rangeIds.forEach(rid => newSet.add(rid))
                return Array.from(newSet)
            })
            setLastSelectedId(id)
            return
        }
    }
    if (isSelecting) {
        setSelectedCardIds(prev => [...prev, id])
        setLastSelectedId(id)
    } else {
        setSelectedCardIds(prev => prev.filter(cid => cid !== id))
        setLastSelectedId(null)
    }
  }

  const handleSelectAll = () => {
    if (selectedCardIds.length === filteredCards.length) {
        setSelectedCardIds([])
    } else {
        setSelectedCardIds(filteredCards.map(c => c.id))
    }
  }

  // --- BULK ADD LOGIC ---
  const initiateBulkAdd = (tagId: string) => {
    const selectedCards = deck.cards.filter(c => selectedCardIds.includes(c.id))
    const safe: { cardId: string }[] = []
    const conflictList: { card: CardData, resolveTagId: string | null }[] = []

    selectedCards.forEach(card => {
        if (card.tags.some(t => t.id === tagId)) return 
        if (card.tags.length < 3) {
            safe.push({ cardId: card.id })
            return
        }
        conflictList.push({ card: card, resolveTagId: null })
    })

    setPendingTagId(tagId)
    setSafeUpdates(safe)
    setConflicts(conflictList)

    if (conflictList.length > 0) {
        setConflictDialogOpen(true)
    } else {
        if (safe.length > 0) {
            executeBulkAdd(tagId, safe)
        } else {
            toast.info("Selected cards already have this tag")
        }
    }
  }

  const executeBulkAdd = async (tagId: string, updates: { cardId: string, removeTagId?: string }[]) => {
    try {
        await bulkAddTags(tagId, updates)
        setSelectedCardIds([]) 
        setConflictDialogOpen(false)
        toast.success("Tags added successfully")
    } catch (err) {
        toast.error("Failed to add tags")
    }
  }

  const handleResolveConflict = () => {
    const unresolved = conflicts.find(c => !c.resolveTagId)
    if (unresolved) {
        alert(`Please select a tag to replace for card: "${unresolved.card.front.substring(0, 20)}..."`)
        return
    }
    if (!pendingTagId) return
    const resolvedUpdates = conflicts.map(c => ({
        cardId: c.card.id,
        removeTagId: c.resolveTagId! 
    }))
    const allUpdates = [...safeUpdates, ...resolvedUpdates]
    executeBulkAdd(pendingTagId, allUpdates)
  }

  // --- BULK REMOVE LOGIC ---
  const handleBulkRemove = async (tagId: string) => {
    try {
        await bulkRemoveTags(tagId, selectedCardIds)
        setSelectedCardIds([])
        toast.success("Tags removed successfully")
    } catch (err) {
        toast.error("Failed to remove tags")
    }
  }

  // --- RENDER HELPERS ---
  const toggleTag = (id: string) => {
    setSelectedTagIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTagIds([])
    setMatchMode('OR')
  }

  // Helper for Status Border Colors
  const getCardStyle = (status: string | null | undefined, isSelected: boolean) => {
    // 1. Base Border Color (Confidence)
    let borderClass = "border-slate-200 bg-white" // Default
    if (status === 'learning') borderClass = "border-red-400 bg-red-50/20"
    if (status === 'reviewing') borderClass = "border-yellow-400 bg-yellow-50/20"
    if (status === 'mastered') borderClass = "border-green-400 bg-green-50/20"

    // 2. Selection Ring (Blue Outer Glow)
    // We use ring-offset so the status border is still visible inside the blue selection ring
    const selectionClass = isSelected 
        ? "ring-2 ring-blue-600 ring-offset-2 z-10" 
        : "hover:shadow-md hover:border-blue-300" // Hover effect if not selected

    return `border-2 ${borderClass} ${selectionClass}`
  }

  return (
    <div className="container mx-auto p-10 space-y-8 pb-32">
      
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

      <CardForm deckId={deck.id} />

      {/* FILTER & BULK BAR */}
      <div className="sticky top-4 z-20 flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-lg border shadow-sm transition-all min-h-[72px]">
        
        {/* LEFT SIDE: SELECTION OR SEARCH */}
        {selectedCardIds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-4 w-full animate-in fade-in slide-in-from-left-5">
                <div className="bg-slate-900 text-white px-3 py-1 rounded text-sm font-medium">
                    {selectedCardIds.length} Selected
                </div>
                
                {/* BULK ADD */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="border-dashed bg-green-50 hover:bg-green-100 border-green-200 text-green-700">
                            <Plus className="w-4 h-4 mr-2" /> Add Tag
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <div className="p-2 border-b text-xs font-bold text-slate-500 uppercase">Add Tag</div>
                        <div className="max-h-60 overflow-auto p-1">
                            {allTags.map(tag => (
                                <div 
                                    key={tag.id} 
                                    className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer text-sm"
                                    onClick={() => initiateBulkAdd(tag.id)}
                                >
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                                    {tag.name}
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* BULK REMOVE */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="border-dashed bg-red-50 hover:bg-red-100 border-red-200 text-red-700">
                            <Trash2 className="w-4 h-4 mr-2" /> Remove Tag
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <div className="p-2 border-b text-xs font-bold text-slate-500 uppercase">Remove Tag</div>
                        <div className="max-h-60 overflow-auto p-1">
                            {allTags.map(tag => (
                                <div 
                                    key={tag.id} 
                                    className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer text-sm"
                                    onClick={() => handleBulkRemove(tag.id)}
                                >
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                                    {tag.name}
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={() => setSelectedCardIds([])}>
                    Cancel
                </Button>
            </div>
        ) : (
            <>
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
                
                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    {selectedCardIds.length === filteredCards.length ? "Deselect All" : "Select All Visible"}
                </Button>
            </>
        )}
      </div>

      {/* CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card, index) => {
          const isSelected = selectedCardIds.includes(card.id)
          return (
            <Card 
                key={card.id} 
                className={`relative group cursor-pointer transition-all duration-200 select-none ${getCardStyle(card.status, isSelected)}`}
                onClick={(e) => {
                   // Full card select logic
                   handleSelect(card.id, index, !isSelected, e.shiftKey)
                }}
            >
              {/* EDIT PENCIL - Protected */}
              <div onClick={(e) => e.stopPropagation()}>
                 <EditCardDialog card={card} />
              </div>

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
          )
        })}
      </div>

      {/* CONFLICT DIALOG */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                    Tag Limit Reached
                </DialogTitle>
                <DialogDescription>
                    Some selected cards already have 3 tags. Select which tag to replace.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                {conflicts.map((conflict, idx) => (
                    <div key={conflict.card.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-slate-50 rounded border">
                        <div className="flex-1">
                            <div className="font-medium text-sm text-slate-700">Card {conflict.card.orderIndex + 1}: "{conflict.card.front.substring(0, 40)}{conflict.card.front.length > 40 && '...'}"</div>
                            <div className="flex gap-2 mt-2">
                                {conflict.card.tags.map(t => (
                                    <Badge key={t.id} variant="outline" className="text-[10px] bg-white">
                                        {t.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="w-full sm:w-48">
                            <Select 
                                onValueChange={(val) => {
                                    const newConflicts = [...conflicts]
                                    newConflicts[idx].resolveTagId = val
                                    setConflicts(newConflicts)
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Replace which?" />
                                </SelectTrigger>
                                <SelectContent>
                                    {conflict.card.tags.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            Replace {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ))}
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => setConflictDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleResolveConflict}>Confirm & Update</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
