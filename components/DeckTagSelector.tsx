'use client'

import { useState, useEffect } from 'react'
import { Check, Plus, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createDeckTag, getDeckTags, deleteDeckTag } from '@/app/actions'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Tag {
  id: string
  name: string
  color: string
}

interface DeckTagSelectorProps {
  selectedTagIds: string[]
  onSelectionChange: (ids: string[]) => void
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#64748b'
]

export default function DeckTagSelector({ selectedTagIds, onSelectionChange }: DeckTagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(COLORS[5]) 

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    const tags = await getDeckTags()
    setAvailableTags(tags)
  }

  const handleCreate = async () => {
    if (!newTagName.trim()) return
    const tag = await createDeckTag(newTagName, newTagColor)
    setAvailableTags([...availableTags, tag])
    setNewTagName('')
    setIsCreating(false)
    if (selectedTagIds.length < 3) {
      onSelectionChange([...selectedTagIds, tag.id])
    }
  }

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onSelectionChange(selectedTagIds.filter(id => id !== tagId))
    } else {
      if (selectedTagIds.length >= 3) return 
      onSelectionChange([...selectedTagIds, tagId])
    }
  }

  const handleDeleteTag = async (e: React.MouseEvent, tagId: string) => {
    e.stopPropagation()
    if (!confirm("Delete this tag?")) return
    await deleteDeckTag(tagId)
    setAvailableTags(availableTags.filter(t => t.id !== tagId))
    onSelectionChange(selectedTagIds.filter(id => id !== tagId))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-white">
        {selectedTagIds.length === 0 && <span className="text-gray-400 text-sm">No tags selected (Max 3)</span>}
        {availableTags.filter(t => selectedTagIds.includes(t.id)).map(tag => (
            <Badge key={tag.id} style={{ backgroundColor: tag.color }} className="text-white hover:opacity-90 pr-1">
              {tag.name}
              <button onClick={() => toggleTag(tag.id)} className="ml-2 hover:bg-black/20 rounded-full p-0.5">
                <X size={12} />
              </button>
            </Badge>
        ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Plus size={14} className="mr-2" /> Manage Deck Tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase">Existing Tags</h4>
            {availableTags.map(tag => (
              <div key={tag.id} className={`flex items-center justify-between p-2 rounded cursor-pointer ${selectedTagIds.includes(tag.id) ? 'bg-gray-100' : 'hover:bg-gray-50'}`} onClick={() => toggleTag(tag.id)}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="text-sm font-medium">{tag.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTagIds.includes(tag.id) && <Check size={14} className="text-green-600" />}
                  <Trash2 size={14} className="text-gray-300 hover:text-red-500" onClick={(e) => handleDeleteTag(e, tag.id)} />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-3">
             <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Create New Tag</h4>
             <div className="flex gap-2 mb-2">
               <Input placeholder="Tag name" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} className="h-8 text-sm" />
             </div>
             <div className="flex gap-1 mb-3 flex-wrap">
               {COLORS.map(color => (
                 <button key={color} onClick={() => setNewTagColor(color)} className={`w-5 h-5 rounded-full border ${newTagColor === color ? 'scale-125 border-black' : 'border-transparent'}`} style={{ backgroundColor: color }} />
               ))}
             </div>
             <Button size="sm" className="w-full h-8" onClick={handleCreate} disabled={!newTagName}>Create Tag</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
