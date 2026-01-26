'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteDeck } from "@/app/actions"
import { toast } from "sonner"

interface DeleteDeckButtonProps {
  deckId: string
}

export default function DeleteDeckButton({ deckId }: DeleteDeckButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteDeck(deckId)
        setOpen(false)
        toast.success("Deck deleted successfully")
      } catch (error) {
        toast.error("Failed to delete deck")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {/* We use onSelect={(e) => e.preventDefault()} to stop the 
            DropdownMenu from closing immediately when we click "Delete".
            Instead, we let the AlertDialog take over.
        */}
        <DropdownMenuItem 
            onSelect={(e) => e.preventDefault()} 
            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Deck
        </DropdownMenuItem>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this deck and all 
            the flashcards inside it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
                e.preventDefault() // Stop auto-close, let async finish
                handleDelete()
            }}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
            ) : (
                "Delete Deck"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
