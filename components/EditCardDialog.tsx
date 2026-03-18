'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import TagSelector from '@/components/TagSelector'
import { updateCard, deleteCard, bulkAddTags, bulkRemoveTags } from "@/app/actions"

interface EditCardProps {
  card: {
    id: string
    front: string
    back: string
    tags: { id: string; name: string; color: string }[]
  }
}

export default function EditCardDialog({ card }: EditCardProps) {
  const [open, setOpen] = useState(false)
  
  // Initialize state with the card's CURRENT data
  const [front, setFront] = useState(card.front)
  const [back, setBack] = useState(card.back)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    card.tags.map(t => t.id)
  )
  
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation() // Stop clicking the card itself
    setOpen(true)
  }

  const handleUpdate = async () => {
    setIsLoading(true)
    try {
      await updateCard(card.id, front, back)
      
      // Update tags separately
      const currentTagIds = card.tags.map(t => t.id)
      const tagsToAdd = selectedTagIds.filter(id => !currentTagIds.includes(id))
      const tagsToRemove = currentTagIds.filter(id => !selectedTagIds.includes(id))
      
      // Add new tags
      for (const tagId of tagsToAdd) {
        await bulkAddTags(tagId, [{ cardId: card.id }])
      }
      
      // Remove tags
      for (const tagId of tagsToRemove) {
        await bulkRemoveTags([card.id], tagId)
      }
      
      window.location.reload()
    } catch (error) {
      console.error(error)
      alert("Failed to update card")
    } finally {
      setIsLoading(false)
      setOpen(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this card?")) return
    setIsLoading(true)
    await deleteCard(card.id)
    setIsLoading(false)
    setOpen(false)
  }

  return (
    <div onClick={(e) => e.stopPropagation()} className="contents">
        {/* The Trigger Icon */}
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-slate-400 hover:text-blue-600 absolute top-2 right-2"
            onClick={handleOpen}
        >
            <Pencil className="h-3 w-3" />
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Card</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Front (Question)</Label>
                        <Textarea 
                            value={front} 
                            onChange={(e) => setFront(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Back (Answer)</Label>
                        <Textarea 
                            value={back} 
                            onChange={(e) => setBack(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Category Tags</Label>
                        <TagSelector 
                            selectedTagIds={selectedTagIds} 
                            onSelectionChange={setSelectedTagIds} 
                        />
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="space-x-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  )
}
