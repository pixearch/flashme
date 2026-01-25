'use client'

import { useState, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateDeck, deleteDeck } from "@/app/actions"
import DeckTagSelector from '@/components/DeckTagSelector'

interface DeckSettingsProps {
  deck: {
    id: string
    title: string
    description: string | null
    tags: { id: string; name: string; color: string }[]
  }
  variant?: 'button' | 'icon'
}

export default function DeckSettings({ deck, variant }: DeckSettingsProps) {
  const [open, setOpen] = useState(false)
  
  // State variables
  const [title, setTitle] = useState(deck.title)
  const [description, setDescription] = useState(deck.description || "")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    deck.tags ? deck.tags.map(t => t.id) : []
  )
  
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // SYNC: Ensure state updates if the database (props) changes while we are viewing it
  useEffect(() => {
    if (open) return // Don't overwrite if user is currently typing
    setTitle(deck.title)
    setDescription(deck.description || "")
    setSelectedTagIds(deck.tags ? deck.tags.map(t => t.id) : [])
  }, [deck, open])

  // RESET: When closing, discard changes and revert to original data
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
        // Slight delay to allow animation to finish before snapping back content
        setTimeout(() => {
            setTitle(deck.title)
            setDescription(deck.description || "")
            setSelectedTagIds(deck.tags ? deck.tags.map(t => t.id) : [])
            setIsDeleteConfirming(false) // Reset delete view too
        }, 150) 
    }
  }

  const handleUpdate = async () => {
    setIsLoading(true)
    await updateDeck(deck.id, title, description, selectedTagIds)
    setIsLoading(false)
    setOpen(false) // This will trigger handleOpenChange(false)
  }

  const handleDelete = async () => {
    setIsLoading(true)
    await deleteDeck(deck.id)
  }

  return (
    <div onClick={(e) => e.stopPropagation()} className="contents">
      
      {/* UPDATE THIS LINE: Use handleOpenChange instead of setOpen */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        
        {variant === 'icon' ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-500 hover:text-slate-900"
            onClick={(e) => {
              e.preventDefault(); 
              e.stopPropagation(); 
              setOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Deck</span>
          </Button>
        ) : (
          <DialogTrigger asChild>
            <Button variant="outline">Deck Settings</Button>
          </DialogTrigger>
        )}

        <DialogContent className="sm:max-w-[425px]">
          
          {!isDeleteConfirming && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Deck</DialogTitle>
                <DialogDescription>
                  Make changes to your deck here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Desc</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Tags</Label>
                  <div className="col-span-3">
                    <DeckTagSelector 
                        selectedTagIds={selectedTagIds} 
                        onSelectionChange={setSelectedTagIds} 
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button 
                  variant="destructive" 
                  type="button" 
                  onClick={() => setIsDeleteConfirming(true)}
                >
                  Delete Deck
                </Button>
                <Button type="submit" onClick={handleUpdate} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </>
          )}

          {isDeleteConfirming && (
            <>
              <DialogHeader>
                <DialogTitle className="text-red-600">Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the deck 
                  <strong> "{deck.title}"</strong> and all of its cards.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex justify-between sm:justify-between mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteConfirming(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete} 
                  disabled={isLoading}
                >
                  {isLoading ? "Deleting..." : "Yes, Delete Everything"}
                </Button>
              </DialogFooter>
            </>
          )}

        </DialogContent>
      </Dialog>
    </div>
  )
}
