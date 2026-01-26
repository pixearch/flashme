'use client'

import { useState } from 'react'
import StudySelectionClient from "@/components/StudySelectionClient"
import StudySessionClient from "@/components/StudySessionClient"
import StudyResumeDialog from "@/components/StudyResumeDialog"
import { deleteStudySession } from "@/app/actions"

export default function StudyController({ deck, initialSession }: any) {
  // STATE: 'resume-check' | 'selection' | 'active'
  const [viewState, setViewState] = useState<'resume-check' | 'selection' | 'active'>(
    initialSession ? 'resume-check' : 'selection'
  )

  const [activeCards, setActiveCards] = useState<any[]>([])
  const [startIndex, setStartIndex] = useState(0)

  // 1. Resume Existing Session
  const handleContinue = () => {
    // Reconstruct card array based on saved order
    const orderedCards = initialSession.cardOrder
      .map((id: string) => deck.cards.find((c: any) => c.id === id))
      .filter(Boolean); // Filter out any deleted cards

    setActiveCards(orderedCards)
    setStartIndex(initialSession.currentIndex)
    setViewState('active')
  }

  // 2. Start New Session
  const handleNewSession = async () => {
    await deleteStudySession(deck.id)
    setViewState('selection')
  }

  // 3. Start from Selection Screen
  const handleStartSelected = (cards: any[]) => {
    setActiveCards(cards)
    setStartIndex(0)
    setViewState('active')
  }

  // -- RENDER --

  if (viewState === 'resume-check' && initialSession) {
    return (
      <StudyResumeDialog 
        open={true}
        lastPlayedDate={new Date(initialSession.updatedAt)}
        progress={initialSession.currentIndex}
        total={initialSession.cardOrder.length}
        onContinue={handleContinue}
        onNewSession={handleNewSession}
      />
    )
  }

  if (viewState === 'active') {
    return (
      <StudySessionClient 
        cards={activeCards} 
        deckId={deck.id} 
        initialIndex={startIndex}
      />
    )
  }

  // Default: Selection Screen
  return (
    <StudySelectionClient 
      deck={deck} 
      onStartSession={handleStartSelected} 
    />
  )
}
