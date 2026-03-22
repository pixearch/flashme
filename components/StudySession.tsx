'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { updateCardStatus } from '@/app/actions'

interface CardProps {
  id: string
  front: string
  back: string
  status: string
}

export default function StudySession({ cards: allCards }: { cards: CardProps[] }) {
  // State for the "Session"
  const [mode, setMode] = useState<'setup' | 'study'>('setup')
  const [activeCards, setActiveCards] = useState<CardProps[]>([])
  
  // State for the "Card"
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // 1. FILTER LOGIC
  const startSession = (filterType: string) => {
    let filtered: CardProps[] = []

    if (filterType === 'all') {
      filtered = allCards
    } else if (filterType === 'dontknow') {
      filtered = allCards.filter(c => c.status === 'dontknow')
    } else if (filterType === 'kindof') {
      filtered = allCards.filter(c => c.status === 'kindof')
    } else if (filterType === 'review') {
      // Don't Know + Kind Of
      filtered = allCards.filter(c => c.status === 'dontknow' || c.status === 'kindof')
    } else if (filterType === 'know') {
      filtered = allCards.filter(c => c.status === 'know')
    }

    if (filtered.length === 0) {
      alert("No cards match this category!")
      return
    }

    setActiveCards(filtered)
    setIndex(0)
    setIsFlipped(false)
    setMode('study')
  }

  // 2. SETUP SCREEN (The new part)
  if (mode === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 mt-10">
        <h2 className="text-2xl font-bold text-gray-800">What do you want to study?</h2>
        <div className="grid grid-cols-1 gap-4 w-full max-w-md">
            <Button size="lg" onClick={() => startSession('all')} className="w-full">
                Study All Cards ({allCards.length})
            </Button>
            
            <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => startSession('dontknow')} className="border-black border-2">
                    Don't Know Only
                </Button>
                <Button variant="outline" onClick={() => startSession('kindof')} className="border-orange-400 border-2">
                    Kind Of Only
                </Button>
            </div>

            <Button variant="outline" onClick={() => startSession('review')} className="w-full border-blue-500 border-2">
                Needs Review (Don't Know + Kind Of)
            </Button>

            <Button variant="outline" onClick={() => startSession('know')} className="w-full border-green-500 border-2">
                Know It Only
            </Button>
        </div>
      </div>
    )
  }

  // 3. STUDY SCREEN (The existing part, but using activeCards)
  const currentCard = activeCards[index]

  const getBorderColor = (status: string) => {
    if (status === 'know') return 'border-green-500 border-4 shadow-green-100'
    if (status === 'kindof') return 'border-orange-400 border-4 shadow-orange-100'
    if (status === 'dontknow') return 'border-black border-4 shadow-gray-400'
    return 'border-gray-200 border-2'
  }

  const handleRate = async (status: string) => {
    await updateCardStatus(currentCard.id, status)
    
    // Update local state immediately
    const updated = [...activeCards]
    updated[index].status = status
    setActiveCards(updated)
  }

  const handleNext = () => {
    setIsFlipped(false)
    setIndex((prev) => (prev + 1) % activeCards.length)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setIndex((prev) => (prev - 1 + activeCards.length) % activeCards.length)
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8 mt-10">
      
      {/* THE FLASHCARD */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className={`w-full max-w-lg h-80 bg-white rounded-xl shadow-lg flex items-center justify-center p-8 cursor-pointer transition-all duration-300 ${getBorderColor(currentCard.status)}`}
      >
        <div className="text-center select-none">
            <span className="block text-sm text-gray-400 mb-4 uppercase tracking-wider font-semibold">
                {isFlipped ? "Answer" : "Question"}
            </span>
            <p className="text-3xl font-medium text-gray-800">
                {isFlipped ? currentCard.back : currentCard.front}
            </p>
        </div>
      </div>

      {/* RATING BUTTONS */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
         <Button className="bg-black hover:bg-gray-800 text-white" onClick={() => handleRate('dontknow')}>
            Don't Know
         </Button>
         <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleRate('kindof')}>
            Kind Of
         </Button>
         <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleRate('know')}>
            Know It
         </Button>
      </div>

      {/* NAVIGATION */}
      <div className="flex items-center space-x-6 pt-4">
        <Button variant="outline" onClick={handlePrev}>Previous</Button>
        <span className="text-sm font-medium text-gray-500">
            {index + 1} / {activeCards.length}
        </span>
        <Button variant="outline" onClick={handleNext}>Next</Button>
      </div>

      {/* EXIT BUTTON */}
      <Button variant="ghost" className="text-gray-400 hover:text-red-500" onClick={() => setMode('setup')}>
        End Session
      </Button>
    </div>
  )
}
