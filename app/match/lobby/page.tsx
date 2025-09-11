"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LobbyPage() {
  const router = useRouter();

  const handleJoin = async () => {
    try {
      // 1️⃣ Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error("Failed to get user:", userError);
        return alert("You must be logged in to join a match.");
      }
      const user = userData.user;

      // 2️⃣ Create a new match
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .insert({ created_by: user.id })
        .select("id, created_by")
        .single();

      if (matchError || !match) {
        console.error("Failed to create match:", matchError);
        return alert("Could not create match. Please try again.");
      }

      // 3️⃣ Join the match as a player
      const { error: joinError } = await supabase
        .from("match_players")
        .insert({
          match_id: match.id, // UUID from created match
          user_id: user.id,   // UUID of current user
        });

      if (joinError) {
        console.error("Failed to join match:", joinError);
        return alert("Could not join match. Please try again.");
      }

      // 4️⃣ Redirect to match page
      router.push(`/match/${match.id}`);
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Match Lobby</h1>
      <button
        onClick={handleJoin}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Join Match
      </button>
    </div>
  );
}
