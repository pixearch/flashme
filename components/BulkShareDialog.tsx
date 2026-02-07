'use client'

import { useState } from 'react'
import { 
  Globe, Lock, Link as LinkIcon, Users, ChevronDown, Eye, Edit3, Download, KeyRound, X 
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { bulkUpdateSettings, bulkShareWithUser } from "@/app/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface BulkShareDialogProps {
  deckIds: string[]
  onComplete?: () => void
}

export default function BulkShareDialog({ deckIds, onComplete }: BulkShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Settings State
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC' | 'UNLISTED'>('PRIVATE')
  const [allowClone, setAllowClone] = useState(true)
  const [password, setPassword] = useState("")
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  
  // Invite State
  const [emailInput, setEmailInput] = useState("")
  const [inviteRole, setInviteRole] = useState<'VIEWER' | 'CLONER' | 'EDITOR'>('VIEWER')
  const [isPending, setIsPending] = useState(false)

  // When we save, we apply ALL settings state to ALL selected decks
  const handleSaveSettings = async () => {
    setIsPending(true)
    try {
      await bulkUpdateSettings(deckIds, visibility, allowClone, showPasswordInput ? password : null)
      toast.success(`Updated settings for ${deckIds.length} decks`)
    } catch (e) {
      toast.error("Failed to update settings")
    } finally {
      setIsPending(false)
    }
  }

  const handleInvite = async () => {
    if (!emailInput.trim()) return
    setIsPending(true)
    try {
      await bulkShareWithUser(deckIds, emailInput, inviteRole)
      setEmailInput("")
      toast.success(`Invited ${emailInput} to ${deckIds.length} decks`)
    } catch (e) {
      toast.error("Failed to invite user")
    } finally {
      setIsPending(false)
    }
  }

  // Helper for role labels
  const getRoleLabel = (role: string) => {
    if (role === 'VIEWER') return 'View Only'
    if (role === 'CLONER') return 'View & Download'
    if (role === 'EDITOR') return 'Editor'
    return role
  }

  const isPrivate = visibility === 'PRIVATE';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-slate-900 text-white hover:bg-slate-800 hover:text-white border-slate-900">
          <Users className="w-4 h-4" /> Manage Permissions ({deckIds.length})
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0">
        
        <DialogHeader className="p-5 border-b bg-white">
            <DialogTitle className="text-xl">Bulk Manage {deckIds.length} Decks</DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-8">
            
            {/* 1. BULK INVITE */}
            <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add people to selected decks</h4>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input 
                            placeholder="Add email address..." 
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="pr-32" 
                        />
                        <div className="absolute right-1 top-1 bottom-1">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-full px-3 text-xs font-medium text-slate-600 hover:bg-slate-100">
                                        {getRoleLabel(inviteRole)} <ChevronDown className="w-3 h-3 ml-1" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setInviteRole('VIEWER')} className="gap-2">
                                        <Eye className="w-4 h-4 text-slate-400" /> View Only
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setInviteRole('CLONER')} className="gap-2">
                                        <Download className="w-4 h-4 text-slate-400" /> View & Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setInviteRole('EDITOR')} className="gap-2">
                                        <Edit3 className="w-4 h-4 text-slate-400" /> Editor
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <Button onClick={handleInvite} disabled={!emailInput || isPending}>
                        {isPending ? "..." : "Send"}
                    </Button>
                </div>
            </div>

            <div className="border-t" />

            {/* 2. GENERAL SETTINGS (Visibility, Password, Clone) */}
            <div className="space-y-4">
                 <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">General Settings</h4>
                 
                 <div className="space-y-4">
                     {/* Visibility Dropdown */}
                     <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border">
                           <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", 
                                visibility === 'PRIVATE' ? "bg-slate-200" : "bg-green-100"
                           )}>
                                {visibility === 'PRIVATE' && <Lock className="w-5 h-5 text-slate-500" />}
                                {visibility !== 'PRIVATE' && <Globe className="w-5 h-5 text-green-600" />}
                           </div>
                           
                           <div className="space-y-1 flex-1">
                                <DropdownMenu>
                                     <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent font-medium text-base text-slate-900 justify-start">
                                              {visibility === 'PRIVATE' ? 'Restricted' : visibility === 'PUBLIC' ? 'Public' : 'Anyone with link'} 
                                              <ChevronDown className="w-4 h-4 ml-1" />
                                          </Button>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent align="start" className="w-[300px]">
                                          <DropdownMenuItem onClick={() => setVisibility('PRIVATE')}>
                                              <div className="flex flex-col gap-1">
                                                   <span className="font-medium flex items-center gap-2"><Lock className="w-3 h-3" /> Restricted</span>
                                                   <span className="text-xs text-slate-500">Only people added can access.</span>
                                              </div>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setVisibility('UNLISTED')}>
                                              <div className="flex flex-col gap-1">
                                                   <span className="font-medium flex items-center gap-2"><LinkIcon className="w-3 h-3" /> Anyone with the link</span>
                                                   <span className="text-xs text-slate-500">Accessible via link.</span>
                                              </div>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setVisibility('PUBLIC')}>
                                              <div className="flex flex-col gap-1">
                                                   <span className="font-medium flex items-center gap-2"><Globe className="w-3 h-3" /> Public</span>
                                                   <span className="text-xs text-slate-500">Listed in search/public.</span>
                                              </div>
                                          </DropdownMenuItem>
                                     </DropdownMenuContent>
                                </DropdownMenu>
                                <p className="text-xs text-slate-500">
                                    Applies to all {deckIds.length} selected decks.
                                </p>
                           </div>
                     </div>

                     {/* Advanced Settings (Password & Clone) */}
                     {/* We now show these even if Private, but dimmed, so you see they exist */}
                     <div className={cn("pl-2 space-y-4 transition-opacity", isPrivate ? "opacity-40 pointer-events-none" : "opacity-100")}>
                        
                        {/* Password Toggle */}
                        {!showPasswordInput ? (
                            <Button variant="outline" size="sm" onClick={() => setShowPasswordInput(true)} className="w-full justify-start gap-2 border-dashed text-slate-500">
                                <KeyRound className="w-4 h-4" /> Add Password to all {deckIds.length} decks
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                                    <Input 
                                        type="text" 
                                        placeholder="Set password for all selected..." 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => { setShowPasswordInput(false); setPassword(""); }}>
                                    <X className="w-4 h-4 text-slate-500" />
                                </Button>
                            </div>
                        )}

                        {/* Clone Toggle */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <Download className="w-4 h-4 text-slate-500" />
                                <Label htmlFor="bulk-clone" className="text-sm font-medium text-slate-700 cursor-pointer">
                                    Allow viewers to download (clone)
                                </Label>
                            </div>
                            <Switch 
                                id="bulk-clone" 
                                checked={allowClone} 
                                onCheckedChange={setAllowClone} 
                            />
                        </div>
                     </div>
                 </div>
            </div>

            <div className="flex justify-end pt-4 gap-2">
                 <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                 <Button onClick={() => { handleSaveSettings(); if(onComplete) onComplete(); }} disabled={isPending}>
                    {isPending ? "Applying..." : "Apply Changes"}
                 </Button>
            </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
