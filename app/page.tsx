"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import Navbar from "@/components/Navbar"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // check auth state on load
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // subscribe to auth changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [])

  return (
    <div>
      <Navbar />
      <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-4xl font-bold mb-6">⚡ Flashcard Battles</h1>

      {!user ? (
        <>
          <p className="mb-4">Login or create an account to get started.</p>
          <Link
            href="/auth"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </>
      ) : (
        <>
          <p className="mb-6">Welcome, {user.email}!</p>
          <div className="flex gap-4">
            <Link
              href="/flashcards/new"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Flashcards
            </Link>
            <Link
              href="/match/lobby"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Join a Match
            </Link>
          </div>
        </>
      )}
    </main>
    </div>
  )
}
