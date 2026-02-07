'use client'

import { useState } from 'react'
import { Plus, X, List, Type, Wand2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { createCard } from '@/app/actions'
import { toast } from "sonner"
import { useRouter } from 'next/navigation'

interface CardFormProps {
  deckId: string
}

interface McOption {
  id: string
  text: string
  isCorrect: boolean
}

// Safe ID generator that works in all browsers/contexts
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).substring(2, 15)
}

export default function CardForm({ deckId }: CardFormProps) {
  const [mode, setMode] = useState<'text' | 'mc'>('text')
  const [front, setFront] = useState("")
  const [back, setBack] = useState("")
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  // --- MC STATE ---
  const [mcQuestion, setMcQuestion] = useState("")
  const [mcRawInput, setMcRawInput] = useState("")
  const [mcOptions, setMcOptions] = useState<McOption[]>([])
  const [manualOptionInput, setManualOptionInput] = useState("")

  // --- ACTIONS ---

  const handleManualAddOption = () => {
    if (!manualOptionInput.trim()) return
    const newOption: McOption = {
      id: generateId(),
      text: manualOptionInput.trim(),
      isCorrect: false
    }
    setMcOptions([...mcOptions, newOption])
    setManualOptionInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleManualAddOption()
    }
  }

  const toggleCorrect = (id: string) => {
    setMcOptions(mcOptions.map(opt => 
      opt.id === id ? { ...opt, isCorrect: !opt.isCorrect } : opt
    ))
  }

  const removeOption = (id: string) => {
    setMcOptions(mcOptions.filter(opt => opt.id !== id))
  }

  const parseRawInput = () => {
    if (!mcRawInput.trim()) return

    const lines = mcRawInput.split('\n').map(l => l.trim()).filter(l => l)
    if (lines.length === 0) return

    // Heuristic: First line is question, rest are answers
    const question = lines[0]
    const potentialOptions = lines.slice(1)

    // Regex to strip common prefixes like "A.", "1)", "a -", etc.
    const prefixRegex = /^([A-Za-z0-9]+[\.\-\)]\s*)/

    const parsedOptions = potentialOptions.map(line => {
      return {
        id: generateId(),
        text: line.replace(prefixRegex, '').trim(),
        isCorrect: false 
      }
    })

    setMcQuestion(question)
    setMcOptions(parsedOptions)
    setMcRawInput("") 
    toast.success("Parsed! Mark the correct answer(s).")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    try {
      let finalFront = front
      let finalBack = back

      // VALIDATION: Multiple Choice
      if (mode === 'mc') {
        if (!mcQuestion.trim()) {
            toast.error("Please enter a question")
            setIsPending(false)
            return
        }
        if (mcOptions.length < 2) {
            toast.error("Please add at least 2 options")
            setIsPending(false)
            return
        }
        
        const payload = {
            q: mcQuestion,
            o: mcOptions.map(opt => opt.text),
            a: mcOptions.reduce((acc, opt, idx) => opt.isCorrect ? [...acc, idx] : acc, [] as number[])
        }
        const encoded = `;;MC;;${JSON.stringify(payload)}`
        finalFront = encoded
        finalBack = encoded 
      } 
      // VALIDATION: Text Mode
      else {
        if (!front.trim() || !back.trim()) {
            toast.error("Front and Back cannot be empty")
            setIsPending(false)
            return
        }
      }

      await createCard(deckId, finalFront, finalBack)
      
      // Reset
      setFront("")
      setBack("")
      setMcQuestion("")
      setMcOptions([])
      setMcRawInput("")
      
      toast.success("Card created successfully")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Failed to create card")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-bold">Add New Card</h2>
         <Tabs value={mode} onValueChange={(v) => setMode(v as 'text' | 'mc')} className="w-[300px]">
            <TabsList className="grid w-full grid-cols-2">
                {/* RENAMED 'Text' -> 'Single' */}
                <TabsTrigger value="text"><Type className="w-4 h-4 mr-2" /> Single</TabsTrigger>
                <TabsTrigger value="mc"><List className="w-4 h-4 mr-2" /> Multi Choice</TabsTrigger>
            </TabsList>
         </Tabs>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* --- STANDARD TEXT MODE --- */}
        {mode === 'text' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-2">
                    <Label htmlFor="front">Front (Question)</Label>
                    <Textarea 
                        id="front" 
                        placeholder="e.g. What is the powerhouse of the cell?"
                        value={front}
                        onChange={(e) => setFront(e.target.value)}
                        className="resize-none h-24"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="back">Back (Answer)</Label>
                    <Textarea 
                        id="back" 
                        placeholder="e.g. Mitochondria"
                        value={back}
                        onChange={(e) => setBack(e.target.value)}
                        className="resize-none h-24"
                    />
                </div>
            </div>
        )}

        {/* --- MULTIPLE CHOICE MODE --- */}
        {mode === 'mc' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                
                {/* 1. AUTO PARSER */}
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                        <Wand2 className="w-3 h-3 inline mr-1" /> Auto Parse (Optional)
                    </Label>
                    <div className="flex gap-2">
                        <Textarea 
                            placeholder="Paste your question and answers here...&#10;Q: What is X?&#10;A. Option 1&#10;B. Option 2"
                            value={mcRawInput}
                            onChange={(e) => setMcRawInput(e.target.value)}
                            className="h-20 text-xs font-mono"
                        />
                        <Button type="button" onClick={parseRawInput} variant="secondary" className="h-20 px-4">
                            Parse
                        </Button>
                    </div>
                </div>

                {/* 2. QUESTION EDITOR */}
                <div className="space-y-2">
                    <Label>Question</Label>
                    <Textarea 
                        value={mcQuestion}
                        onChange={(e) => setMcQuestion(e.target.value)}
                        placeholder="Enter the question here..."
                        className="h-20 resize-none font-medium"
                    />
                </div>

                {/* 3. ANSWERS POOL */}
                <div className="space-y-3">
                    <Label className="flex justify-between">
                        <span>Answers Pool</span>
                        <span className="text-xs text-muted-foreground font-normal">Check the correct answer(s)</span>
                    </Label>
                    
                    {/* List of Options */}
                    <div className="space-y-2">
                        {mcOptions.map((opt, idx) => (
                            <div key={opt.id} className={`flex items-center gap-3 p-2 rounded border ${opt.isCorrect ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                <span className={`flex-1 text-sm ${opt.isCorrect ? 'font-medium text-green-900' : 'text-slate-700'}`}>
                                    {opt.text}
                                </span>
                                <Checkbox 
                                    checked={opt.isCorrect}
                                    onCheckedChange={() => toggleCorrect(opt.id)}
                                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                />
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-slate-400 hover:text-red-500"
                                    onClick={() => removeOption(opt.id)}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Manual Entry Input */}
                    <div className="flex gap-2 mt-2">
                        <Input 
                            placeholder="Type an answer and hit Enter..." 
                            value={manualOptionInput}
                            onChange={(e) => setManualOptionInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <Button type="button" onClick={handleManualAddOption} variant="outline">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

            </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Card'}
        </Button>
      </form>
    </div>
  )
}
