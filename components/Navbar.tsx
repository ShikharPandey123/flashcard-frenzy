"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function Navbar() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-900 text-white">
      <div className="flex gap-4">
        <Link href="/">Home</Link>
        <Link href="/flashcards">Flashcards</Link>
        <Link href="/match/1">Match Demo</Link>
      </div>
      <div>
        {user ? (
          <div className="flex gap-2">
            <Link href="/profile">Profile</Link>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <Link href="/auth">Login</Link>
        )}
      </div>
    </nav>
  )
}
