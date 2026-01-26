'use client'

import { useState, useEffect } from 'react'
import { Check, ArrowLeft, ArrowRight, RotateCw } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { updateCardStatus, saveStudySession } from '@/app/actions'
import Link from 'next/link'
import confetti from 'canvas-confetti'

interface StudySessionClientProps {
  cards: any[]
  deckId: string
  initialIndex?: number
}

export default function StudySessionClient({ cards, deckId, initialIndex = 0 }: StudySessionClientProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  
  // Transition State: We toggle this to '0s' when switching cards to prevent seeing the answer
  const [transitionDuration, setTransitionDuration] = useState('0.6s')

  // Local status override (so the border updates instantly when you click)
  const [tempStatus, setTempStatus] = useState<string | null>(null)

  const currentCard = cards[currentIndex]

  // --- AUTOSAVE ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isFinished && cards.length > 0) {
        const currentCardIds = cards.map(c => c.id);
        saveStudySession(deckId, currentIndex, 'custom', currentCardIds);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [currentIndex, deckId, cards, isFinished]);

  // --- HANDLERS ---
  const handleFlip = () => setIsFlipped(!isFlipped)

  const handleNext = () => {
    // 1. Snap to Front Instantly (Disable Animation)
    setTransitionDuration('0s')
    setIsFlipped(false)
    setTempStatus(null)

    // 2. Change Data
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      finishSession()
    }

    // 3. Re-enable Animation (small delay allows the render to complete with 0s)
    setTimeout(() => {
      setTransitionDuration('0.6s')
    }, 50)
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      // 1. Snap to Front Instantly
      setTransitionDuration('0s')
      setIsFlipped(false)
      setTempStatus(null)

      // 2. Change Data
      setCurrentIndex(prev => prev - 1)

      // 3. Re-enable Animation
      setTimeout(() => {
        setTransitionDuration('0.6s')
      }, 50)
    }
  }

  const handleStatusUpdate = async (status: string) => {
    if (currentCard) {
        setTempStatus(status)
        currentCard.status = status 
        await updateCardStatus(currentCard.id, status)
        // Note: We DO NOT auto-advance here anymore, as requested.
    }
  }

  const finishSession = () => {
    setIsFinished(true)
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
  }

  // --- BORDER COLOR LOGIC ---
  const getActiveStatus = () => tempStatus || currentCard.status || 'new'

  const getBorderColor = () => {
    const s = getActiveStatus()
    if (s === 'learning') return 'border-red-500 ring-4 ring-red-100'
    if (s === 'reviewing') return 'border-yellow-500 ring-4 ring-yellow-100'
    if (s === 'mastered') return 'border-green-500 ring-4 ring-green-100'
    return 'border-slate-200'
  }

  // KEYBOARD
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); handleFlip() }
      else if (e.code === 'ArrowRight') handleNext()
      else if (e.code === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, isFlipped, isFinished]) 


  if (!currentCard || isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="rounded-full bg-green-100 p-6"><Check className="w-12 h-12 text-green-600" /></div>
        <h2 className="text-3xl font-bold">Session Complete!</h2>
        <div className="flex gap-4">
            <Link href="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
            <Button onClick={() => window.location.reload()}>Study Again</Button>
        </div>
      </div>
    )
  }

  const activeStatus = getActiveStatus()

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* HEADER NAV */}
      <div className="flex justify-between items-center">
         <Link href="/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Decks</Button>
         </Link>
         <Link href={`/dashboard/deck/${deckId}`}>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">End Session</Button>
         </Link>
      </div>

      {/* PROGRESS */}
      <div className="space-y-2">
         <div className="flex justify-between text-sm text-slate-500">
            <span>Card {currentIndex + 1} of {cards.length}</span>
            <span>{Math.round(((currentIndex + 1) / cards.length) * 100)}%</span>
         </div>
         <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full transition-all duration-300 ease-out" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
         </div>
      </div>

      {/* THE CARD */}
      <div 
        className="group cursor-pointer w-full h-[400px]" 
        onClick={handleFlip} 
        style={{ perspective: '1000px' }}
      >
        <div 
            style={{ 
                position: 'relative',
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: `transform ${transitionDuration}`, // <--- DYNAMIC DURATION
            }}
        >
            
            {/* FRONT */}
            <Card 
                className={`absolute w-full h-full flex flex-col items-center justify-center p-10 shadow-lg border-2 bg-white ${getBorderColor()}`}
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            >
                <div className="absolute top-4 left-4 flex gap-2">
                    {currentCard.tags.map((t: any) => (
                        <Badge key={t.id} style={{ backgroundColor: t.color }} className="text-[10px]">#{t.name}</Badge>
                    ))}
                </div>
                <CardContent className="text-center">
                    <h3 className="text-3xl font-medium">{currentCard.front}</h3>
                    <p className="absolute bottom-6 text-sm text-slate-400 font-medium uppercase tracking-widest">Front</p>
                </CardContent>
            </Card>

            {/* BACK */}
            <Card 
                className="absolute w-full h-full flex flex-col items-center justify-center p-10 shadow-lg border-2 border-slate-200 bg-slate-50"
                style={{ 
                    backfaceVisibility: 'hidden', 
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)' 
                }}
            >
                 <div className="absolute top-4 left-4 flex gap-2">
                    {currentCard.tags.map((t: any) => (
                        <Badge key={t.id} style={{ backgroundColor: t.color }} className="text-[10px]">#{t.name}</Badge>
                    ))}
                </div>
                <CardContent className="text-center">
                    <h3 className="text-3xl font-medium text-slate-800 whitespace-pre-wrap">{currentCard.back}</h3>
                    <p className="absolute bottom-6 text-sm text-slate-400 font-medium uppercase tracking-widest">Back</p>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-col gap-6 items-center">
        <Button onClick={handleFlip} variant="ghost" className="gap-2 text-slate-500">
            <RotateCw className="w-4 h-4" /> Click card or Spacebar to flip
        </Button>

        {/* RATING BUTTONS */}
        <div className={`grid grid-cols-3 gap-6 w-full max-w-2xl transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <Button 
                onClick={(e) => { e.stopPropagation(); handleStatusUpdate('learning'); }} 
                className={`h-16 text-lg border-2 ${activeStatus === 'learning' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}
                variant="outline"
            >
                Don't Know
            </Button>
            <Button 
                onClick={(e) => { e.stopPropagation(); handleStatusUpdate('reviewing'); }} 
                className={`h-16 text-lg border-2 ${activeStatus === 'reviewing' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-yellow-600 border-yellow-200 hover:bg-yellow-50'}`}
                variant="outline"
            >
                Kind of Know
            </Button>
            <Button 
                onClick={(e) => { e.stopPropagation(); handleStatusUpdate('mastered'); }} 
                className={`h-16 text-lg border-2 ${activeStatus === 'mastered' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-600 border-green-200 hover:bg-green-50'}`}
                variant="outline"
            >
                Know It
            </Button>
        </div>

        {/* NAVIGATION */}
        <div className="flex justify-between w-full max-w-2xl pt-4 border-t">
            <Button onClick={handlePrev} disabled={currentIndex === 0} variant="secondary" size="lg">
                <ArrowLeft className="mr-2 h-5 w-5" /> Previous
            </Button>
            <Button onClick={handleNext} variant="default" size="lg" className="min-w-[140px]">
                Next Card <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        </div>
      </div>
    </div>
  )
}
