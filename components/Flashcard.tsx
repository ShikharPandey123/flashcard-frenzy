"use client"

import { useState } from "react"

type FlashcardProps = {
  id: string
  question: string
  options: string[]
  onAnswer: (answer: string) => void
}

export default function Flashcard({ id, question, options, onAnswer }: FlashcardProps) {
  const [selected, setSelected] = useState<string | null>(null)

  function handleSelect(option: string) {
    setSelected(option)
    onAnswer(option) // Pass the answer back to parent (Match UI)
  }

  return (
    <div className="p-6 border rounded-lg shadow-md bg-white">
      <h2 className="text-xl font-bold mb-4">{question}</h2>
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <button
            key={i}
            className={`p-2 border rounded ${
              selected === opt ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
            onClick={() => handleSelect(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
