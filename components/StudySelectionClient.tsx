'use client'

import { useState } from 'react'
import { Play, Shuffle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface StudySelectionClientProps {
  deck: any
  onStartSession: (cards: any[]) => void
}

export default function StudySelectionClient({ deck, onStartSession }: StudySelectionClientProps) {
  const [shuffle, setShuffle] = useState(false)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  
  // Status Filters
  const [includeNew, setIncludeNew] = useState(true)
  const [includeLearning, setIncludeLearning] = useState(true)
  const [includeReviewing, setIncludeReviewing] = useState(true)
  const [includeMastered, setIncludeMastered] = useState(true)

  // Select All Logic
  const allSelected = includeNew && includeLearning && includeReviewing && includeMastered
  
  const toggleSelectAll = (checked: boolean) => {
    setIncludeNew(checked)
    setIncludeLearning(checked)
    setIncludeReviewing(checked)
    setIncludeMastered(checked)
  }

  const handleStart = () => {
    let cardsToPlay = deck.cards.filter((c: any) => {
      const status = c.status || 'new'
      if (status === 'new' && !includeNew) return false
      if (status === 'learning' && !includeLearning) return false
      if (status === 'reviewing' && !includeReviewing) return false
      if (status === 'mastered' && !includeMastered) return false
      return true
    })

    if (filterTag) {
      cardsToPlay = cardsToPlay.filter((c: any) => c.tags.some((t: any) => t.id === filterTag))
    }

    if (shuffle) {
      cardsToPlay = [...cardsToPlay].sort(() => Math.random() - 0.5)
    }

    if (cardsToPlay.length === 0) {
      alert("No cards match your criteria!")
      return
    }

    onStartSession(cardsToPlay)
  }

  const availableTags = Array.from(new Set(deck.cards.flatMap((c: any) => c.tags.map((t: any) => JSON.stringify(t)))))
    .map((s: any) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    })
    .filter((t: any) => t !== null)

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Time to Study</h1>
        <p className="text-muted-foreground">Setup your session for <strong>{deck.title}</strong></p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Settings</CardTitle>
          <CardDescription>Select which cards to study.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Include Cards</Label>
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="select-all" 
                        checked={allSelected}
                        onCheckedChange={(c) => toggleSelectAll(!!c)} 
                    />
                    <Label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">Select All</Label>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="flex items-center space-x-2 border p-3 rounded hover:bg-slate-50">
                 <Checkbox id="new" checked={includeNew} onCheckedChange={(c) => setIncludeNew(!!c)} />
                 <Label htmlFor="new" className="cursor-pointer flex-1">New / Unstudied</Label>
               </div>
               <div className="flex items-center space-x-2 border p-3 rounded hover:bg-slate-50 border-red-200 bg-red-50/50">
                 <Checkbox id="learning" checked={includeLearning} onCheckedChange={(c) => setIncludeLearning(!!c)} />
                 <Label htmlFor="learning" className="cursor-pointer flex-1">Don't Know</Label>
               </div>
               <div className="flex items-center space-x-2 border p-3 rounded hover:bg-slate-50 border-yellow-200 bg-yellow-50/50">
                 <Checkbox id="reviewing" checked={includeReviewing} onCheckedChange={(c) => setIncludeReviewing(!!c)} />
                 <Label htmlFor="reviewing" className="cursor-pointer flex-1">Kind of Know</Label>
               </div>
               <div className="flex items-center space-x-2 border p-3 rounded hover:bg-slate-50 border-green-200 bg-green-50/50">
                 <Checkbox id="mastered" checked={includeMastered} onCheckedChange={(c) => setIncludeMastered(!!c)} />
                 <Label htmlFor="mastered" className="cursor-pointer flex-1">Know It</Label>
               </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 border p-3 rounded hover:bg-slate-50">
             <Checkbox id="shuffle" checked={shuffle} onCheckedChange={(c) => setShuffle(!!c)} />
             <Label htmlFor="shuffle" className="cursor-pointer flex items-center gap-2">
                <Shuffle className="h-4 w-4" /> Shuffle Deck
             </Label>
          </div>

          {availableTags.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base font-medium">Filter by Tag (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                 <Badge 
                    variant={filterTag === null ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1"
                    onClick={() => setFilterTag(null)}
                  >
                    All Tags
                  </Badge>
                 {availableTags.map((tag: any) => (
                    <Badge 
                      key={tag.id}
                      style={filterTag === tag.id ? { backgroundColor: tag.color, color: 'white', borderColor: tag.color } : { borderColor: tag.color, color: 'black' }}
                      variant="outline"
                      className="cursor-pointer px-3 py-1 border"
                      onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                    >
                      {tag.name}
                    </Badge>
                 ))}
              </div>
            </div>
          )}

          <Button size="lg" className="w-full mt-6 text-lg" onClick={handleStart}>
            <Play className="mr-2 h-5 w-5" /> Start Session
          </Button>

        </CardContent>
      </Card>
    </div>
  )
}
