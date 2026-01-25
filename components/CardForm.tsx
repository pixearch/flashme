'use client'

import { useState, useRef } from 'react'
import { createCard } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TagSelector from '@/components/TagSelector' // <--- Import this

export default function CardForm({ deckId }: { deckId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]) // <--- State for tags

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a New Card</CardTitle>
      </CardHeader>
      <CardContent>
        <form 
          ref={formRef}
          action={async (formData) => {
            await createCard(formData)
            formRef.current?.reset()
            setSelectedTagIds([]) // Reset tags after submit
          }} 
          className="space-y-4"
        >
          <input type="hidden" name="deckId" value={deckId} />

          {/* HIDDEN INPUT TO SEND TAGS TO SERVER */}
          <input type="hidden" name="tagIds" value={JSON.stringify(selectedTagIds)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="front">Front (Question)</Label>
              <Textarea 
                id="front" 
                name="front" 
                placeholder="e.g. What is the mitochondria?" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="back">Back (Answer)</Label>
              <Textarea 
                id="back" 
                name="back" 
                placeholder="e.g. The powerhouse of the cell." 
                required 
              />
            </div>
          </div>

          {/* TAG SELECTOR UI */}
          <div className="space-y-2">
            <Label>Categories (Tags)</Label>
            <TagSelector 
                selectedTagIds={selectedTagIds} 
                onSelectionChange={setSelectedTagIds} 
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Add Card</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
