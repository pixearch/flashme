import { getSharedDeck } from "@/app/actions"
import SharedDeckClient from "@/components/SharedDeckClient"
import { notFound } from "next/navigation"

export default async function SharedDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  try {
    // Initial fetch - if password protected, this returns isLocked: true and hides cards
    const deck = await getSharedDeck(id)
    return <SharedDeckClient initialDeck={deck} deckId={id} />
  } catch (error) {
    // If private or not found
    notFound()
  }
}
