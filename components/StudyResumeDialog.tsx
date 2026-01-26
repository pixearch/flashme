'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { History, PlayCircle } from "lucide-react"

interface StudyResumeDialogProps {
  open: boolean
  lastPlayedDate: Date
  progress: number
  total: number
  onContinue: () => void
  onNewSession: () => void
}

export default function StudyResumeDialog({ 
  open, 
  lastPlayedDate, 
  progress, 
  total, 
  onContinue, 
  onNewSession 
}: StudyResumeDialogProps) {

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Resume Session?</DialogTitle>
          <DialogDescription>
            You have an active study session from {lastPlayedDate.toLocaleDateString()}.
            <br />
            You were on card <strong>{progress + 1}</strong> of <strong>{total}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-4">
          <Button 
            onClick={onContinue} 
            className="w-full h-12 text-lg gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <History className="w-5 h-5" />
            Continue Where I Left Off
          </Button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase">Or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <Button 
            onClick={onNewSession} 
            variant="outline" 
            className="w-full h-10 gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            Start Fresh (Card 1)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
