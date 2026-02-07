'use client'

import { useState } from 'react'
import { Settings, Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { updateDeck } from "@/app/actions"
import DeleteDeckButton from "@/components/DeleteDeckButton"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import ManageTagsDialog from "@/components/ManageTagsDialog"

interface DeckSettingsProps {
  deck: any
  allTags: any[]
}

export default function DeckSettings({ deck, allTags = [] }: DeckSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState(deck.title)
  const [description, setDescription] = useState(deck.description || "")
  
  // Initialize with currently assigned tags
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    deck.tags ? deck.tags.map((t: any) => t.id) : []
  )
  
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setIsPending(true)
    try {
      await updateDeck(deck.id, title, description, selectedTagIds)
      toast.success("Deck updated")
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to update deck")
    } finally {
      setIsPending(false)
    }
  }

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
        setSelectedTagIds(prev => prev.filter(id => id !== tagId))
    } else {
        if (selectedTagIds.length >= 3) {
            toast.error("Max 3 tags allowed")
            return
        }
        setSelectedTagIds(prev => [...prev, tagId])
    }
  }

  // Helper to get selected tag objects for display
  const selectedTags = allTags.filter(t => selectedTagIds.includes(t.id))

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" /> Deck Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Deck</DialogTitle>
          <DialogDescription>Make changes to your deck details here.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          
          {/* TITLE INPUT */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          
          {/* DESCRIPTION INPUT */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="resize-none h-24"
            />
          </div>

          {/* TAG SELECTOR (Standard Dropdown) */}
          <div className="space-y-3">
             <div className="flex justify-between items-center">
                 <Label>Tags ({selectedTagIds.length}/3)</Label>
                 <ManageTagsDialog tags={allTags} />
             </div>
             
             <div className="flex flex-col gap-3">
                 {/* 1. The Dropdown Trigger */}
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between text-left font-normal">
                            <span>Select tags...</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[450px]" align="start">
                        <DropdownMenuLabel>Available Tags</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allTags.length === 0 ? (
                            <div className="p-2 text-sm text-slate-500 text-center">No tags found. Create some in Dashboard.</div>
                        ) : (
                            allTags.map(tag => (
                                <DropdownMenuCheckboxItem
                                    key={tag.id}
                                    checked={selectedTagIds.includes(tag.id)}
                                    onCheckedChange={() => toggleTag(tag.id)}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                                        {tag.name}
                                    </div>
                                </DropdownMenuCheckboxItem>
                            ))
                        )}
                    </DropdownMenuContent>
                 </DropdownMenu>

                 {/* 2. The Selected Tags Display */}
                 <div className="flex flex-wrap gap-2 min-h-[32px]">
                     {selectedTags.length === 0 && (
                         <span className="text-xs text-slate-400 italic">No tags selected</span>
                     )}
                     {selectedTags.map(tag => (
                         <Badge 
                            key={tag.id} 
                            style={{ backgroundColor: tag.color }}
                            className="text-white border-0"
                         >
                             {tag.name}
                         </Badge>
                     ))}
                 </div>
             </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
              <DeleteDeckButton deckId={deck.id} asMenuItem={false} />
              <Button onClick={handleSave} disabled={isPending}>
                  {isPending ? "Saving..." : "Save changes"}
              </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
