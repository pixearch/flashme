'use client'

import { createCard } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRef } from "react";

export default function CardForm({ deckId }: { deckId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="p-6 border rounded-lg bg-slate-50 mb-8">
      <h3 className="font-semibold mb-4">Add a New Card</h3>
      
      <form 
        ref={formRef}
        action={async (formData) => {
          await createCard(formData);
          formRef.current?.reset(); 
        }} 
        className="space-y-4"
      >
        <input type="hidden" name="deckId" value={deckId} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Front (Question)</label>
            <Textarea 
                name="front" 
                placeholder="e.g. What is the mitochondria?" 
                required 
                className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Back (Answer)</label>
            <Textarea 
                name="back" 
                placeholder="e.g. The powerhouse of the cell." 
                required 
                className="bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
            <Button type="submit">Add Card</Button>
        </div>
      </form>
    </div>
  );
}
