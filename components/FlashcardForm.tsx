"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type FlashcardFormProps = {
  onSuccess?: () => void
}

export default function FlashcardForm({ onSuccess }: FlashcardFormProps) {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", "", "", ""])
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!question.trim() || correctIndex === null) {
      setError("Please fill question and select correct answer")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.from("flashcards").insert([
        {
          question,
          options,
          correct_answer: options[correctIndex],
        },
      ])
      if (error) throw error

      setQuestion("")
      setOptions(["", "", "", ""])
      setCorrectIndex(null)

      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 border rounded-lg shadow-md bg-white flex flex-col gap-4"
    >
      <h2 className="text-xl font-bold">Add Flashcard</h2>

      {error && <p className="text-red-600">{error}</p>}

      <input
        type="text"
        placeholder="Question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="border p-2 rounded"
      />

      {options.map((opt, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            placeholder={`Option ${i + 1}`}
            value={opt}
            onChange={(e) =>
              setOptions((prev) => {
                const copy = [...prev]
                copy[i] = e.target.value
                return copy
              })
            }
            className="border p-2 rounded flex-1"
          />
          <input
            type="radio"
            name="correct"
            checked={correctIndex === i}
            onChange={() => setCorrectIndex(i)}
          />
          <span className="text-sm">Correct</span>
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Saving..." : "Save Flashcard"}
      </button>
    </form>
  )
}
