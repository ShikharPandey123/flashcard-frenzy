"use client"

type PlayerScore = {
  player_id: string
  email?: string
  score: number
}

type LeaderboardProps = {
  scores: PlayerScore[]
}

export default function Leaderboard({ scores }: LeaderboardProps) {
  const sorted = [...scores].sort((a, b) => b.score - a.score)

  return (
    <div className="p-6 border rounded-lg shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-4">🏆 Leaderboard</h2>
      <ul className="space-y-2">
        {sorted.map((player, i) => (
          <li
            key={player.player_id}
            className={`flex justify-between p-2 rounded ${
              i === 0 ? "bg-yellow-200 font-bold" : "bg-gray-100"
            }`}
          >
            <span>
              {i + 1}. {player.email ?? player.player_id}
            </span>
            <span>{player.score} pts</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
