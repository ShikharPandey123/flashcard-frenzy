import PlayerList from "@/components/PlayerList"

export default function MatchLobbyPage() {
  const players = [
    { id: "1", email: "alice@example.com", isHost: true },
    { id: "2", email: "bob@example.com" },
  ]

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Match Lobby</h1>
      <PlayerList players={players} />
      <button className="mt-6 px-4 py-2 bg-green-600 text-white rounded">
        Start Match
      </button>
    </div>
  )
}
