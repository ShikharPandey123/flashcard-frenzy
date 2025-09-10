"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface MatchRound {
  id: string;
  match_id: string;
  flashcard_id: string;
  answered_by: string;
  is_correct: boolean;
  created_at: string;
}

interface MatchPageProps {
  params: {
    id: string;
  };
}

export default function MatchPage({ params }: MatchPageProps) {
  const matchId = params.id;
  const [updates, setUpdates] = useState<MatchRound[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`match-${matchId}`);

    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "match_rounds" },
      (payload: { new: MatchRound }) => {
        console.log("Realtime update:", payload.new);
        setUpdates((prev) => [...prev, payload.new]);
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  return (
    <div>
      <h1>Match {matchId}</h1>
      <div>
        {updates.map((u) => (
          <p key={u.id}>
            New answer: {u.answered_by} → {u.is_correct ? "✅" : "❌"}
          </p>
        ))}
      </div>
    </div>
  );
}
