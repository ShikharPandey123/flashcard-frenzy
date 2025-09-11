"use client"

import { useRouter } from "next/navigation"
import FlashcardForm from "@/components/FlashcardForm"
import Navbar from "@/components/Navbar"

export default function NewFlashcardPage() {
  const router = useRouter()

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <FlashcardForm
            onSuccess={() => {
              router.push("/flashcards")
            }}
          />
        </div>
      </div>
    </div>
  )
}
