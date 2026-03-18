'use client'

import { useState } from 'react'
import { createDeck, updateDeck } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import TagSelector from '@/components/TagSelector'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function CreateDeckForm() {
  const [open, setOpen] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    
    if (!title) return
    
    const deck = await createDeck(title, description || '', 'PRIVATE')
    
    // Add tags to deck if needed
    if (selectedTagIds.length > 0) {
      await updateDeck(deck.id, deck.title, deck.description || '', selectedTagIds)
    }
    
    setOpen(false)
    setSelectedTagIds([])
    window.location.reload()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ New Deck</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Deck</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input name="title" required placeholder="e.g. Biology 101" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea name="description" placeholder="Chapter 1-3 Review" />
          </div>
          <div>
            <Label>Tags</Label>
            <TagSelector selectedTagIds={selectedTagIds} onSelectionChange={setSelectedTagIds} />
          </div>
          <Button type="submit" className="w-full">Create Deck</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
