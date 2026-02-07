'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Share2, Copy, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { shareDeckWithUser, removeDeckAccess, getDeckAccessList } from "@/app/actions"
import { Badge } from "@/components/ui/badge"

interface ShareDialogProps {
  deck: any
}

export default function ShareDialog({ deck }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<'VIEWER' | 'CLONER' | 'EDITOR'>('VIEWER')
  const [isLoading, setIsLoading] = useState(false)
  const [accessList, setAccessList] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      loadAccessList()
    }
  }, [isOpen])

  const loadAccessList = async () => {
    try {
      const list = await getDeckAccessList(deck.id)
      setAccessList(list)
    } catch (error) {
      console.error("Failed to load access list", error)
    }
  }

  const handleShare = async () => {
    if (!email) return
    setIsLoading(true)
    try {
      await shareDeckWithUser(deck.id, email, role)
      toast.success(`Shared with ${email}`)
      setEmail("")
      await loadAccessList()
    } catch (error) {
      toast.error("Failed to share deck")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (targetEmail: string) => {
    if(!confirm(`Remove access for ${targetEmail}?`)) return
    try {
        await removeDeckAccess(deck.id, targetEmail)
        toast.success("Access removed")
        await loadAccessList()
    } catch(e) {
        toast.error("Failed to remove access")
    }
  }

  const copyLink = () => {
    const url = `${window.location.origin}/share/${deck.id}`
    navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start hover:bg-white group-hover:text-blue-600">
          <Share2 className="w-4 h-4 mr-2" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{deck.title}"</DialogTitle>
          <DialogDescription>
            Invite others to view, import, or edit this deck.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label>Email address</Label>
              <Input 
                placeholder="friend@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="w-[180px] space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
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
            <Button onClick={handleShare} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}
            </Button>
          </div>

          <div className="relative">
             <div className="absolute inset-0 flex items-center">
               <span className="w-full border-t" />
             </div>
             <div className="relative flex justify-center text-xs uppercase">
               <span className="bg-white px-2 text-slate-500">Or share via link</span>
             </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">Link</Label>
              <Input id="link" defaultValue={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${deck.id}`} readOnly />
            </div>
            <Button size="sm" className="px-3" onClick={copyLink}>
              <span className="sr-only">Copy</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* ACCESS LIST */}
          {accessList.length > 0 && (
              <div className="space-y-2 mt-4">
                  <Label>People with access</Label>
                  <div className="border rounded-md divide-y max-h-[150px] overflow-y-auto">
                      {accessList.map((access) => (
                          <div key={access.id} className="p-2 flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-slate-400" />
                                  <span className="truncate max-w-[180px]" title={access.userEmail}>{access.userEmail}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-[10px] h-5">
                                      {access.role}
                                  </Badge>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-600" onClick={() => handleRemove(access.userEmail)}>
                                      <Trash2 className="w-3 h-3" />
                                  </Button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
