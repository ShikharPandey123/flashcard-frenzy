"use client"

type Player = {
  id: string
  email?: string
  isHost?: boolean
}

type PlayerListProps = {
  players: Player[]
}

export default function PlayerList({ players }: PlayerListProps) {
  if (players.length === 0) {
    return <p className="text-gray-500">Waiting for players...</p>
  }

  return (
    <div className="p-6 border rounded-lg shadow-md bg-white">
      <h2 className="text-xl font-bold mb-4">Players in Lobby</h2>
      <ul className="space-y-2">
        {players.map((player) => (
          <li
            key={player.id}
            className="flex justify-between items-center p-2 bg-gray-100 rounded"
          >
            <span>{player.email ?? player.id}</span>
            {player.isHost && <span className="text-sm text-blue-600">Host</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
