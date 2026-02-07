'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Settings2, Tag, Users, Shield, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { bulkUpdateSettings, bulkShareWithUser, bulkAddTagsToDecks, bulkRemoveTagsFromDecks } from "@/app/actions"
import { useRouter } from 'next/navigation'

interface BulkManageDialogProps {
  selectedDecks: any[]
  userTags: any[]
  onComplete: () => void
}

export default function BulkManageDialog({ selectedDecks, userTags, onComplete }: BulkManageDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const deckIds = selectedDecks.map(d => d.id)

  // --- FORM STATE ---
  
  // Settings
  const [visibility, setVisibility] = useState<'NO_CHANGE' | 'PRIVATE' | 'PUBLIC' | 'UNLISTED'>('NO_CHANGE')
  
  // Sharing
  const [shareEmail, setShareEmail] = useState("")
  const [shareRole, setShareRole] = useState<'VIEWER' | 'CLONER' | 'EDITOR'>('VIEWER')
  
  // Tags
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([])
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([])

  // --- LOGIC: Filter tags to remove ---
  const availableTagsToRemove = useMemo(() => {
      const existingTagIds = new Set<string>();
      selectedDecks.forEach(deck => {
          deck.tags.forEach((t: any) => existingTagIds.add(t.id));
      });
      return userTags.filter(tag => existingTagIds.has(tag.id));
  }, [selectedDecks, userTags]);


  // --- HANDLERS ---

  const handleApply = async () => {
    if (deckIds.length === 0) return;
    setIsLoading(true);
    let successCount = 0;

    try {
      // 1. Apply Visibility Changes
      if (visibility !== 'NO_CHANGE') {
        await bulkUpdateSettings(deckIds, visibility, true, null);
        successCount++;
      }

      // 2. Apply Sharing
      if (shareEmail.trim()) {
        await bulkShareWithUser(deckIds, shareEmail, shareRole);
        successCount++;
      }

      // 3. Apply Tags (Add)
      if (tagsToAdd.length > 0) {
        for (const tagId of tagsToAdd) {
          await bulkAddTagsToDecks(deckIds, tagId);
        }
        successCount++;
      }

      // 4. Apply Tags (Remove)
      if (tagsToRemove.length > 0) {
        for (const tagId of tagsToRemove) {
          await bulkRemoveTagsFromDecks(deckIds, tagId);
        }
        successCount++;
      }

      if (successCount > 0) {
        toast.success(`Updated ${deckIds.length} decks successfully`);
        setIsOpen(false);
        onComplete();
        router.refresh();
      } else {
        toast.info("No changes were selected.");
        setIsLoading(false);
      }

    } catch (error) {
      console.error(error);
      toast.error("Some updates failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const toggleTagAdd = (tagId: string) => {
    setTagsToAdd(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
    setTagsToRemove(prev => prev.filter(id => id !== tagId))
  }

  const toggleTagRemove = (tagId: string) => {
    setTagsToRemove(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
    setTagsToAdd(prev => prev.filter(id => id !== tagId))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
          <Settings2 className="w-4 h-4" /> Bulk Edit ({deckIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] flex flex-col h-[80vh] sm:h-auto">
        <DialogHeader>
          <DialogTitle>Bulk Manage {deckIds.length} Decks</DialogTitle>
          <DialogDescription>
            Select the changes you want to apply. All actions will be performed when you click Apply.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tags" className="flex-1 overflow-y-auto py-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="settings">Visibility</TabsTrigger>
            <TabsTrigger value="sharing">Sharing</TabsTrigger>
          </TabsList>

          {/* --- TAGS TAB --- */}
          <TabsContent value="tags" className="space-y-6 pt-4">
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-green-600"><Plus className="w-4 h-4" /> Add Tags</h3>
              <div className="grid grid-cols-2 gap-2">
                {userTags.map(tag => (
                  <div key={`add-${tag.id}`} className="flex items-center space-x-2 border p-2 rounded hover:bg-slate-50">
                    <Checkbox 
                      id={`add-${tag.id}`} 
                      checked={tagsToAdd.includes(tag.id)}
                      onCheckedChange={() => toggleTagAdd(tag.id)}
                    />
                    <label htmlFor={`add-${tag.id}`} className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: tag.color }} />
                      {tag.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-red-600"><Trash2 className="w-4 h-4" /> Remove Tags</h3>
              {availableTagsToRemove.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No tags found on selected decks.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                    {availableTagsToRemove.map(tag => (
                    <div key={`rem-${tag.id}`} className="flex items-center space-x-2 border p-2 rounded hover:bg-slate-50">
                        <Checkbox 
                        id={`rem-${tag.id}`} 
                        checked={tagsToRemove.includes(tag.id)}
                        onCheckedChange={() => toggleTagRemove(tag.id)}
                        />
                        <label htmlFor={`rem-${tag.id}`} className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: tag.color }} />
                        {tag.name}
                        </label>
                    </div>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* --- SETTINGS TAB --- */}
          <TabsContent value="settings" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_CHANGE">Don&apos;t Change</SelectItem>
                  <SelectItem value="PRIVATE">Private (Only you)</SelectItem>
                  <SelectItem value="PUBLIC">Public (Everyone)</SelectItem>
                  <SelectItem value="UNLISTED">Unlisted (Link only)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">This will update the visibility setting for all selected decks.</p>
            </div>
          </TabsContent>

          {/* --- SHARING TAB --- */}
          <TabsContent value="sharing" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Share with Email</Label>
              <Input 
                placeholder="user@example.com" 
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={shareRole} onValueChange={(v: any) => setShareRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEWER">Viewer (Read Only)</SelectItem>
                  <SelectItem value="CLONER">Importer (View + Clone)</SelectItem>
                  <SelectItem value="EDITOR">Editor (View + Clone + Edit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-sm border border-yellow-200 mt-4">
              Note: This will add this user to all {deckIds.length} decks.
            </div>
          </TabsContent>

        </Tabs>

        <DialogFooter className="mt-4 pt-4 border-t">
            <div className="flex justify-between w-full items-center">
                <span className="text-xs text-slate-500">
                    {tagsToAdd.length + tagsToRemove.length + (visibility !== 'NO_CHANGE' ? 1 : 0) + (shareEmail ? 1 : 0)} changes pending
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleApply} disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Apply Changes
                    </Button>
                </div>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
