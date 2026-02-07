'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { createTag, deleteTag } from "@/app/actions"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'

interface ManageTagsDialogProps {
  tags: any[]
}

export default function ManageTagsDialog({ tags }: ManageTagsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3b82f6") // Default blue
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const handleCreate = async () => {
    if (!newTagName.trim()) return
    setIsPending(true)
    try {
      await createTag(newTagName, newTagColor)
      setNewTagName("")
      toast.success("Tag created")
      router.refresh()
    } catch (e) {
      toast.error("Failed to create tag")
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag globally? It will be removed from all cards.")) return
    try {
      await deleteTag(id)
      toast.success("Tag deleted")
      router.refresh()
    } catch (e) {
      toast.error("Failed to delete tag")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600">
          Manage Global Tags
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>Create or remove tags used across your decks.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* CREATE NEW */}
          <div className="flex items-end gap-2">
            <div className="space-y-1 flex-1">
                <Label>New Tag Name</Label>
                <Input 
                    value={newTagName} 
                    onChange={(e) => setNewTagName(e.target.value)} 
                    placeholder="e.g. Science"
                />
            </div>
            <div className="space-y-1">
                <Label>Color</Label>
                <div className="flex items-center gap-1 h-10">
                    <input 
                        type="color" 
                        value={newTagColor} 
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="h-9 w-9 p-0 border rounded cursor-pointer shadow-sm" 
                    />
                </div>
            </div>
            <Button onClick={handleCreate} disabled={!newTagName || isPending} size="icon">
                <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="border-t my-2" />

          {/* LIST */}
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
             {tags.length === 0 && <p className="text-sm text-slate-400 text-center py-2">No tags yet.</p>}
             {tags.map(tag => (
                 <div key={tag.id} className="flex items-center justify-between p-2 rounded bg-slate-50 border group hover:border-slate-300 transition-colors">
                     <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: tag.color }} />
                         <span className="font-medium text-sm text-slate-700">{tag.name}</span>
                     </div>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-slate-300 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(tag.id)}
                     >
                         <Trash2 className="w-3 h-3" />
                     </Button>
                 </div>
             ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
