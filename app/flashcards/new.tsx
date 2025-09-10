"use client"

import { useRouter } from "next/navigation"
import FlashcardForm from "@/components/FlashcardForm"

export default function NewFlashcardPage() {
  const router = useRouter()

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Flashcard</h1>

      <FlashcardForm
        onSuccess={() => {
          router.push("/flashcards")
        }}
      />
    </div>
  )
}
