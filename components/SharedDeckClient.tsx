'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lock, Unlock, Download, Play, Edit3 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { getSharedDeck, cloneDeck } from "@/app/actions"
import { useRouter } from 'next/navigation'

export default function SharedDeckClient({ initialDeck, deckId }: { initialDeck: any, deckId: string }) {
  const [deck, setDeck] = useState(initialDeck)
  const [password, setPassword] = useState("")
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const router = useRouter()

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUnlocking(true)
    try {
      const unlockedDeck = await getSharedDeck(deckId, password)
      if (unlockedDeck.isLocked) {
        toast.error("Incorrect password")
      } else {
        setDeck(unlockedDeck)
        toast.success("Deck unlocked")
      }
    } catch (err) {
      toast.error("Failed to unlock")
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleClone = async () => {
    setIsCloning(true)
    try {
      const newDeck = await cloneDeck(deck.id)
      toast.success("Deck saved to your dashboard!")
      router.push(`/dashboard/deck/${newDeck.id}`)
    } catch (err) {
      toast.error("Failed to save deck. You may need to sign in.")
    } finally {
      setIsCloning(false)
    }
  }

  // --- LOCKED STATE ---
  if (deck.isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="bg-slate-100 p-6 rounded-full">
            <Lock className="w-12 h-12 text-slate-400" />
        </div>
        <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">This deck is password protected</h1>
            <p className="text-muted-foreground">Please enter the password to view "{deck.title}"</p>
        </div>
        <form onSubmit={handleUnlock} className="flex gap-2 w-full max-w-sm">
            <Input 
                type="password" 
                placeholder="Enter password..." 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" disabled={isUnlocking}>
                {isUnlocking ? "..." : <Unlock className="w-4 h-4" />}
            </Button>
        </form>
      </div>
    )
  }

  // --- UNLOCKED / PUBLIC STATE ---
  return (
    <div className="container mx-auto p-8 max-w-5xl space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Public Deck</Badge>
                    <span className="text-sm text-slate-500">{deck._count?.cards || deck.cards.length} Cards</span>
                </div>
                <h1 className="text-4xl font-bold mb-2">{deck.title}</h1>
                <p className="text-lg text-slate-600 max-w-2xl">{deck.description || "No description provided."}</p>
                <div className="flex gap-2 mt-4">
                    {deck.tags?.map((t: any) => (
                        <Badge key={t.id} style={{ backgroundColor: t.color }}>#{t.name}</Badge>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto">
                 {/* 1. EDIT BUTTON (If Editor) */}
                 {deck.canEdit && (
                     <Button variant="secondary" className="w-full md:w-auto" asChild>
                        <Link href={`/dashboard/deck/${deck.id}`}>
                           <Edit3 className="w-4 h-4 mr-2" /> Edit Deck
                        </Link>
                     </Button>
                 )}

                 {/* 2. CLONE BUTTON (If Cloner/Editor OR Public Allow Clone) */}
                 {deck.canClone && (
                     <Button variant="outline" onClick={handleClone} disabled={isCloning} className="w-full md:w-auto">
                        <Download className="w-4 h-4 mr-2" /> Save Copy
                     </Button>
                 )}

                 {/* 3. VIEW CARDS (Always) */}
                 {deck.cards.length > 0 && (
                    <Button size="lg" className="w-full md:w-auto" asChild>
                        <Link href={`#cards`}>
                           <Play className="w-4 h-4 mr-2" /> View Cards
                        </Link>
                    </Button>
                 )}
            </div>
        </div>

        {/* CARD PREVIEW LIST */}
        <div id="cards" className="grid grid-cols-1 gap-4">
            {deck.cards.map((card: any, idx: number) => (
                <Card key={card.id} className="bg-slate-50/50">
                    <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start">
                         <div className="font-mono text-xs text-slate-400 mt-1 min-w-[24px]">
                            {idx + 1}
                         </div>
                         <div className="flex-1 space-y-4 w-full">
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Front</span>
                                <p className="text-lg font-medium whitespace-pre-wrap">
                                    {card.front.startsWith(';;MC;;') ? JSON.parse(card.front.replace(';;MC;;','')).q : card.front}
                                </p>
                            </div>
                            <div className="h-px bg-slate-200 w-full" />
                            <div className="space-y-1">
                                <span className="text-xs font-
