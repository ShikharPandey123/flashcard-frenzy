"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Leaderboard from "@/components/Leaderboard"

type Score = {
  player_id: string
  email?: string
  score: number
}

export default function MatchResultsPage() {
  const params = useParams()
  const matchId = params?.id as string

  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchScores() {
      // Fetch all rounds for this match
      const { data: rounds, error } = await supabase
        .from("match_rounds")
        .select("answered_by, is_correct, users(email)")
        .eq("match_id", matchId)

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      // Aggregate scores
      const scoreMap: Record<string, Score> = {}

      rounds?.forEach((r) => {
        if (!scoreMap[r.answered_by]) {
          scoreMap[r.answered_by] = {
            player_id: r.answered_by,
            email: r.users?.[0]?.email,
            score: 0,
          }
        }
        if (r.is_correct) {
          scoreMap[r.answered_by].score += 1
        }
      })

      setScores(Object.values(scoreMap))
      setLoading(false)
    }

    fetchScores()
  }, [matchId])

  if (loading) return <p className="p-6">Loading results...</p>

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Match Results</h1>
      {scores.length === 0 ? (
        <p>No results found for this match.</p>
      ) : (
        <Leaderboard scores={scores} />
      )}
    </div>
  )
}
