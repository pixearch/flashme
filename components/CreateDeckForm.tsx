'use client'

import { useState } from 'react'
import { createDeck } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import DeckTagSelector from '@/components/DeckTagSelector'
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

  const handleSubmit = async (formData: FormData) => {
    // Append tags manually
    formData.append('tagIds', JSON.stringify(selectedTagIds))
    await createDeck(formData)
    setOpen(false)
    setSelectedTagIds([])
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
        <form action={handleSubmit} className="space-y-4">
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
            <DeckTagSelector selectedTagIds={selectedTagIds} onSelectionChange={setSelectedTagIds} />
          </div>
          <Button type="submit" className="w-full">Create Deck</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
