'use client'

import { useState } from "react"
import { Trash2 } from "lucide-react"
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { deleteDeck } from "@/app/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface DeleteDeckButtonProps {
  deckId: string
  asMenuItem?: boolean
}

export default function DeleteDeckButton({ deckId, asMenuItem = true }: DeleteDeckButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteDeck(deckId)
      toast.success("Deck deleted")
      // If we are on the deck page (not dashboard), redirect home
      if (!asMenuItem) {
          router.push("/dashboard")
      }
    } catch (error) {
      toast.error("Failed to delete deck")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {asMenuItem ? (
           // Render as Dropdown Item (For Dashboard)
           <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 focus:bg-red-50 gap-2 cursor-pointer">
              <Trash2 className="w-4 h-4" /> Delete Deck
           </DropdownMenuItem>
        ) : (
           // Render as Regular Button (For Settings Modal)
           <Button variant="destructive" size="sm" className="gap-2">
              <Trash2 className="w-4 h-4" /> Delete Deck
           </Button>
        )}
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your deck and all its cards.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
