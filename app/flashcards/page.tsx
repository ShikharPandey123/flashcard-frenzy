"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

type Flashcard = {
  id: string
  question: string
  options: string[]
  correct_answer: string
}

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFlashcards() {
      const { data, error } = await supabase.from("flashcards").select("*")
      if (!error && data) setFlashcards(data)
      setLoading(false)
    }
    fetchFlashcards()
  }, [])

  async function handleDelete(id: string) {
    const { error } = await supabase.from("flashcards").delete().eq("id", id)
    if (!error) {
      setFlashcards((prev) => prev.filter((f) => f.id !== id))
    }
  }

  if (loading) return <p className="p-6">Loading flashcards...</p>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Flashcards</h1>
        <Link
          href="/flashcards/new"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          + New Flashcard
        </Link>
      </div>

      {flashcards.length === 0 ? (
        <p>No flashcards yet. Create one!</p>
      ) : (
        <ul className="space-y-4">
          {flashcards.map((f) => (
            <li
              key={f.id}
              className="p-4 border rounded-lg shadow-sm bg-white flex flex-col gap-2"
            >
              <div className="flex justify-between">
                <h2 className="font-semibold">{f.question}</h2>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="text-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
              <ul className="list-disc list-inside">
                {f.options.map((opt, i) => (
                  <li
                    key={i}
                    className={opt === f.correct_answer ? "font-bold text-green-600" : ""}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
