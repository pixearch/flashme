'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Copy, PlusCircle, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { mergeDecks, createDeckFromMerge } from "@/app/actions"
import { toast } from "sonner" // Assuming you might have a toast, if not we'll use alerts

interface Deck {
  id: string
  title: string
  description: string | null
  cards: { id: string }[]
}

export default function ImportDecksClient({ decks }: { decks: Deck[] }) {
  const router = useRouter()
  const [mode, setMode] = useState<'menu' | 'existing' | 'new'>('menu')
  
  // Selection State
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [selectedTargetId, setSelectedTargetId] = useState<string>("")
  
  // New Deck Form State
  const [newDeckTitle, setNewDeckTitle] = useState("")
  const [newDeckDesc, setNewDeckDesc] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [isVerifyOpen, setIsVerifyOpen] = useState(false)

  // -- HANDLERS --

  const toggleSource = (id: string) => {
    setSelectedSourceIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleReset = () => {
    setMode('menu')
    setSelectedSourceIds([])
    setSelectedTargetId("")
    setNewDeckTitle("")
    setNewDeckDesc("")
  }

  const executeImport = async () => {
    setIsLoading(true)
    try {
      if (mode === 'existing') {
        if (!selectedTargetId) return
        await mergeDecks(selectedTargetId, selectedSourceIds)
        router.push(`/dashboard/deck/${selectedTargetId}`)
      } else {
        if (!newDeckTitle) return
        const newDeck = await createDeckFromMerge(selectedSourceIds, newDeckTitle)
        router.push(`/dashboard/deck/${newDeck.id}`)
      }
    } catch (error) {
      console.error(error)
      alert("Something went wrong during import.")
    } finally {
      setIsLoading(false)
      setIsVerifyOpen(false)
    }
  }

  // -- RENDER HELPERS --

  // The Card Component for the Deck List
  const DeckItem = ({ deck, isSource }: { deck: Deck, isSource: boolean }) => {
    const isSelected = isSource 
      ? selectedSourceIds.includes(deck.id)
      : selectedTargetId === deck.id

    // Prevent selecting the same deck for source and target
    const isDisabled = !isSource && selectedSourceIds.includes(deck.id)

    return (
      <div 
        className={`flex items-start space-x-3 p-3 rounded border transition-all cursor-pointer 
          ${isSelected ? 'border-black bg-slate-50' : 'border-slate-200 hover:border-slate-300'}
          ${isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}
        `}
        onClick={() => {
          if (isDisabled) return
          if (isSource) toggleSource(deck.id)
          else setSelectedTargetId(deck.id)
        }}
      >
        <div className="mt-1">
          {isSource ? (
            <Checkbox checked={isSelected} />
          ) : (
            <div className={`h-4 w-4 rounded-full border border-primary ${isSelected ? 'bg-black' : 'bg-transparent'}`} />
          )}
        </div>
        <div>
          <h4 className="font-semibold text-sm">{deck.title}</h4>
          <p className="text-xs text-slate-500 line-clamp-1">{deck.description || "No description"}</p>
          <span className="text-[10px] text-slate-400">{deck.cards.length} cards</span>
        </div>
      </div>
    )
  }

  // -- MAIN VIEWS --

  if (mode === 'menu') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-10">
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-slate-400 group"
          onClick={() => setMode('existing')}
        >
          <CardHeader>
            <Copy className="w-10 h-10 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
            <CardTitle>Import into Existing</CardTitle>
            <CardDescription>
              Select multiple decks and combine them into one of your existing decks.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-slate-400 group"
          onClick={() => setMode('new')}
        >
          <CardHeader>
            <PlusCircle className="w-10 h-10 mb-2 text-green-600 group-hover:scale-110 transition-transform" />
            <CardTitle>Combine into New Deck</CardTitle>
            <CardDescription>
              Take cards from multiple decks and merge them into a brand new deck.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleReset}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Selection
        </Button>
        <h2 className="text-xl font-bold">
          {mode === 'existing' ? "Merge Decks" : "Create Combined Deck"}
        </h2>
        <div /> 
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: SOURCES */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2 flex items-center">
              <span className="bg-white border w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">1</span>
              Select Source Decks (Export From)
            </h3>
            <p className="text-sm text-slate-500 mb-4">Choose as many as you like.</p>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {decks.map(deck => (
                <DeckItem key={deck.id} deck={deck} isSource={true} />
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE ARROW (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-2 items-center justify-center">
           <ArrowRight className="w-8 h-8 text-slate-300" />
        </div>

        {/* RIGHT COLUMN: TARGET */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border h-full">
            <h3 className="font-semibold mb-2 flex items-center">
              <span className="bg-white border w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">2</span>
              {mode === 'existing' ? "Select Destination" : "Create Destination"}
            </h3>
            
            {mode === 'existing' ? (
              <>
                 <p className="text-sm text-slate-500 mb-4">Select one deck to receive the cards.</p>
                 <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {decks.map(deck => (
                    <DeckItem key={deck.id} deck={deck} isSource={false} />
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-4 mt-8">
                 <div className="space-y-2">
                   <Label>New Deck Title</Label>
                   <Input 
                     placeholder="e.g. Master Biology Review" 
                     value={newDeckTitle}
                     onChange={(e) => setNewDeckTitle(e.target.value)}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Description</Label>
                   <Textarea 
                     placeholder="Combined cards from chapters 1-5" 
                     value={newDeckDesc}
                     onChange={(e) => setNewDeckDesc(e.target.value)}
                   />
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end px-10">
         <div className="flex gap-4 items-center">
             <div className="text-sm text-slate-500">
               {selectedSourceIds.length} decks selected to import
             </div>
             
             <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
               <DialogTrigger asChild>
                 <Button 
                   disabled={selectedSourceIds.length === 0 || (mode === 'existing' && !selectedTargetId) || (mode === 'new' && !newDeckTitle)}
                   className="min-w-[150px]"
                 >
                   Verify & Import
                 </Button>
               </DialogTrigger>
               <DialogContent>
                 <DialogHeader>
                   <DialogTitle>Confirm Import</DialogTitle>
                   <DialogDescription>
                     Are you sure you want to proceed?
                   </DialogDescription>
                 </DialogHeader>
                 
                 <div className="bg-slate-50 p-4 rounded text-sm space-y-2 my-2">
                    <div className="flex justify-between">
                       <span>Source Decks:</span>
                       <span className="font-bold">{selectedSourceIds.length}</span>
                    </div>
                    <div className="flex justify-between">
                       <span>Target Deck:</span>
                       <span className="font-bold">
                         {mode === 'existing' 
                           ? decks.find(d => d.id === selectedTargetId)?.title 
                           : newDeckTitle}
                       </span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-600 mt-4">
                       <AlertCircle className="w-4 h-4" />
                       <span className="text-xs">This will COPY cards. Originals are kept safe.</span>
                    </div>
                 </div>

                 <DialogFooter>
                   <Button variant="outline" onClick={() => setIsVerifyOpen(false)}>Cancel</Button>
                   <Button onClick={executeImport} disabled={isLoading}>
                     {isLoading ? "Importing..." : "Yes, Import Cards"}
                   </Button>
                 </DialogFooter>
               </DialogContent>
             </Dialog>
         </div>
      </div>
    </div>
  )
}
