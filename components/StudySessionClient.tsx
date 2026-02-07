'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, X, CheckCircle, Undo2, BookOpen, LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { useRouter } from 'next/navigation'
import { saveStudyProgress, clearStudyProgress, updateCardStatus } from "@/app/actions"
import { toast } from "sonner"
import Link from 'next/link'
import { cn } from "@/lib/utils"

interface StudySessionClientProps {
  deck: any
  initialIndex: number
}

export default function StudySessionClient({ deck, initialIndex }: StudySessionClientProps) {
  // Store cards locally to track status changes instantly
  const [cards, setCards] = useState(deck.cards)
  
  const [showResumeDialog, setShowResumeDialog] = useState(initialIndex > 0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  
  // -- RESUME LOGIC --
  const startSession = (resume: boolean) => {
    if (resume) {
        setCurrentIndex(initialIndex)
        toast.success("Resumed previous session")
    } else {
        setCurrentIndex(0)
        saveStudyProgress(deck.id, 0)
    }
    setShowResumeDialog(false)
  }

  // -- CARD ACTION LOGIC --
  const handleRate = async (status: 'learning' | 'reviewing' | 'mastered') => {
    // 1. Optimistically update local state
    const updatedCards = [...cards];
    updatedCards[currentIndex] = { ...updatedCards[currentIndex], status: status };
    setCards(updatedCards);

    // 2. Update DB in background
    await updateCardStatus(updatedCards[currentIndex].id, status);

    // 3. Move to next card
    if (currentIndex < cards.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setIsFlipped(false);
      await saveStudyProgress(deck.id, newIndex);
    } else {
      setIsFinished(true);
      await clearStudyProgress(deck.id);
    }
  }

  const handlePrev = async () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      setIsFlipped(false)
      await saveStudyProgress(deck.id, newIndex)
    }
  }

  // -- HELPER: GET BORDER COLOR --
  const getBorderClass = (status?: string) => {
      switch (status) {
          case 'learning': return "border-red-500 shadow-md shadow-red-100 ring-1 ring-red-500"
          case 'reviewing': return "border-yellow-500 shadow-md shadow-yellow-100 ring-1 ring-yellow-500"
          case 'mastered': return "border-green-500 shadow-md shadow-green-100 ring-1 ring-green-500"
          default: return "border-slate-200"
      }
  }

  // -- KEYBOARD SHORTCUTS --
  useEffect(() => {
    if (showResumeDialog || isFinished) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        // CHANGED: Allow toggling back and forth
        setIsFlipped(prev => !prev)
      } else if (e.key === 'ArrowRight') {
         if (isFlipped) handleRate('reviewing') 
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (isFlipped) {
          if (e.key === '1') handleRate('learning')
          if (e.key === '2') handleRate('reviewing')
          if (e.key === '3') handleRate('mastered')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, isFlipped, showResumeDialog, isFinished, cards])

  if (showResumeDialog) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md p-8 text-center space-y-6 shadow-xl">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Undo2 className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold mb-2">Resume Session?</h2>
                    <p className="text-slate-500">
                        You left off at card <span className="font-bold text-slate-900">{initialIndex + 1}</span> of {cards.length}.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <Button size="lg" onClick={() => startSession(true)} className="w-full">Resume</Button>
                    <Button variant="outline" onClick={() => startSession(false)} className="w-full">Start Over</Button>
                </div>
            </Card>
        </div>
    )
  }

  if (isFinished) {
    return (
      <div className="container max-w-2xl mx-auto py-20 px-4 text-center space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900">Session Complete!</h1>
        <div className="flex gap-4 justify-center mt-8">
            <Link href="/dashboard"><Button variant="outline" size="lg">Dashboard</Button></Link>
            <Button size="lg" onClick={() => { setIsFinished(false); setCurrentIndex(0); saveStudyProgress(deck.id, 0); }}>Study Again</Button>
        </div>
      </div>
    )
  }

  const currentCard = cards[currentIndex]
  const progress = ((currentIndex + 1) / cards.length) * 100
  const borderClass = getBorderClass(currentCard.status)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        
        {/* LEFT: Title & Progress */}
        <div className="space-y-1">
           <h2 className="font-semibold text-sm line-clamp-1">{deck.title}</h2>
           <div className="flex items-center gap-2 text-xs text-slate-500">
              <Progress value={progress} className="w-24 h-2" />
              <span>{currentIndex + 1} / {cards.length}</span>
           </div>
        </div>

        {/* RIGHT: Exit Button */}
        <Link href="/dashboard">
          <Button variant="ghost" className="gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4" /> Exit Session
          </Button>
        </Link>
      </div>

      {/* FLASHCARD AREA */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full">
         <div 
            className="relative w-full aspect-[4/3] md:aspect-[16/9] perspective-1000 cursor-pointer group"
            onClick={() => setIsFlipped(!isFlipped)} 
         >
            <div 
                className={`relative w-full h-full duration-500 preserve-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`} 
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* FRONT CARD - Applied Border Color */}
                <Card 
                    className={cn(
                        "absolute inset-0 backface-hidden flex items-center justify-center p-8 md:p-12 text-center bg-white shadow-lg border-2 transition-all duration-300",
                        borderClass
                    )}
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question</span>
                        <p className="text-2xl md:text-4xl font-medium text-slate-800 leading-relaxed select-none">{currentCard.front}</p>
                    </div>
                </Card>

                {/* BACK CARD - Applied Border Color */}
                <Card 
                    className={cn(
                        "absolute inset-0 backface-hidden flex items-center justify-center p-8 md:p-12 text-center bg-white shadow-xl border-2 transition-all duration-300",
                        borderClass
                    )}
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Answer</span>
                        <p className="text-2xl md:text-4xl font-medium text-slate-800 leading-relaxed select-none">{currentCard.back}</p>
                    </div>
                </Card>
            </div>
         </div>

         {/* CONTROLS */}
         <div className="w-full max-w-md mt-8 min-h-[80px] flex items-center justify-center">
             {!isFlipped ? (
                 <Button size="lg" className="w-full text-lg h-12" onClick={() => setIsFlipped(true)}>
                     Show Answer <BookOpen className="ml-2 w-4 h-4" />
                 </Button>
             ) : (
                 <div className="grid grid-cols-3 gap-3 w-full animate-in fade-in slide-in-from-bottom-4">
                     {/* DON'T KNOW IT (Red) */}
                     <Button 
                        variant="outline" 
                        className={cn(
                            "h-12 border-red-200 text-red-600 font-bold transition-all",
                            currentCard.status === 'learning' 
                                ? "bg-red-100 border-red-500 ring-2 ring-red-500 ring-offset-2" 
                                : "hover:bg-red-50 hover:text-red-700"
                        )}
                        onClick={() => handleRate('learning')}
                     >
                         Don&apos;t Know It
                     </Button>

                     {/* CAUTIOUS (Yellow) */}
                     <Button 
                        variant="outline" 
                        className={cn(
                            "h-12 border-yellow-200 text-yellow-600 font-bold transition-all",
                            currentCard.status === 'reviewing' 
                                ? "bg-yellow-100 border-yellow-500 ring-2 ring-yellow-500 ring-offset-2" 
                                : "hover:bg-yellow-50 hover:text-yellow-700"
                        )}
                        onClick={() => handleRate('reviewing')}
                     >
                         Cautious
                     </Button>

                     {/* CONFIDENT (Green) */}
                     <Button 
                        variant="outline" 
                        className={cn(
                            "h-12 border-green-200 text-green-600 font-bold transition-all",
                            currentCard.status === 'mastered' 
                                ? "bg-green-100 border-green-500 ring-2 ring-green-500 ring-offset-2" 
                                : "hover:bg-green-50 hover:text-green-700"
                        )}
                        onClick={() => handleRate('mastered')}
                     >
                         Confident
                     </Button>
                 </div>
             )}
         </div>
         
         <div className="mt-4 flex gap-4">
             <Button variant="ghost" size="sm" onClick={handlePrev} disabled={currentIndex === 0} className="text-slate-400">
                 <ChevronLeft className="w-4 h-4 mr-1" /> Previous
             </Button>
         </div>
      </div>
    </div>
  )
}
