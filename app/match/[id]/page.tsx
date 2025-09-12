"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type Round = {
  roundId: string;
  flashcard_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  answered_by?: string | null;
  is_correct?: boolean | null;
};

type ScoreRow = {
  player_id: string;
  player_name: string;
  score: number;
};

type Flashcard = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
};

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [answeredOption, setAnsweredOption] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [allFlashcards, setAllFlashcards] = useState<Flashcard[]>([]);
  const [usedFlashcardIds, setUsedFlashcardIds] = useState<Set<string>>(new Set());
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [matchCompleted, setMatchCompleted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // ✅ UUID validation
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Validate matchId
  useEffect(() => {
    if (matchId && !isValidUUID(matchId)) {
      console.error("Invalid match ID format:", matchId);
      router.push("/match/lobby");
    }
  }, [matchId, router]);

  // 🔹 Fetch all flashcards
  useEffect(() => {
    const loadFlashcards = async () => {
      const { data, error } = await supabase
        .from("flashcards")
        .select("id, question, options, correct_answer");
      if (!error && data) {
        setAllFlashcards(data);
        setTotalQuestions(data.length);
      }
    };
    loadFlashcards();
  }, []);

  // 🔹 Fetch scores
  const fetchScores = useCallback(async () => {
    if (!matchId || !isValidUUID(matchId)) {
      console.error('Invalid or missing match ID for scores fetch');
      setScores([]);
      return;
    }
    
    try {
      // First, get match players with basic player info
      const { data: matchPlayersData, error: matchPlayersError } = await supabase
        .from("match_players")
        .select(`
          player_id, 
          players!inner(id, name, user_id)
        `)
        .eq("match_id", matchId);

      if (matchPlayersError) {
        console.error("Error fetching match players:", matchPlayersError);
        setScores([]);
        return;
      }

      console.log("Match players data:", matchPlayersData);

      if (matchPlayersData && matchPlayersData.length > 0) {
        const transformedScores = await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          matchPlayersData.map(async (mp: any) => {
            // Get round attempts for scoring
            const { data: attempts } = await supabase
              .from("round_attempts")
              .select("is_correct, match_rounds!inner(match_id)")
              .eq("player_id", mp.player_id)
              .eq("match_rounds.match_id", matchId)
              .eq("is_correct", true);

            // Get user email if player name is not available
            let playerName = mp.players?.name;
            
            if (!playerName && mp.players?.user_id) {
              const { data: userData } = await supabase
                .from("users")
                .select("email")
                .eq("id", mp.players.user_id)
                .single();
              
              playerName = userData?.email?.split('@')[0] || 'Anonymous Player';
            }

            return {
              player_id: mp.player_id,
              player_name: playerName || 'Anonymous Player',
              score: attempts?.length ?? 0,
            };
          })
        );

        setScores(transformedScores);
      }
    } catch (err) {
      console.error("Error fetching scores:", err);
      setScores([]);
    }
  }, [matchId]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  // 🔹 Start a new round
  const startRound = async () => {
    if (!matchId || !isValidUUID(matchId)) {
      console.error('Invalid match ID for starting round');
      return;
    }

    const available = allFlashcards.filter(fc => !usedFlashcardIds.has(fc.id));
    if (available.length === 0) {
      setMatchCompleted(true);
      router.push(`/match/${matchId}/results`);
      return;
    }

    setLoading(true);
    const flashcard = available[Math.floor(Math.random() * available.length)];

    const { data: roundData, error: roundError } = await supabase
      .from("match_rounds")
      .insert([{ match_id: matchId, flashcard_id: flashcard.id }])
      .select("id")
      .single();

    if (roundError || !roundData) {
      setLoading(false);
      return alert("Failed to start round.");
    }

    const newUsed = new Set(usedFlashcardIds);
    newUsed.add(flashcard.id);
    setUsedFlashcardIds(newUsed);
    setCurrentQuestionNumber(newUsed.size);

    setRound({
      roundId: roundData.id,
      flashcard_id: flashcard.id,
      question: flashcard.question,
      options: flashcard.options,
      correct_answer: flashcard.correct_answer,
    });
    setAnsweredOption(null);
    setCorrectAnswer(flashcard.correct_answer);
    setLoading(false);
  };

  // 🔹 Answer flashcard
  const answerFlashcard = async (answer: string) => {
    if (!round) return;
    if (!matchId || !isValidUUID(matchId)) {
      console.error('Invalid match ID for answer submission');
      return;
    }
    
    const isCorrect = round.correct_answer === answer;
    setAnsweredOption(answer);

    try {
      // Fetch logged-in user
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) return console.error("No logged-in user");

      // Ensure player exists - handle potential duplicates
      const { data: playersArray } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      let playerData;
      
      // Take the first player if multiple exist
      if (playersArray && playersArray.length > 0) {
        playerData = playersArray[0];
      } else {
        // Create new player if none exists
        const userName =
          authData.user?.user_metadata?.name ??
          authData.user?.email?.split("@")[0] ??
          "Anonymous Player";

        const { data: newPlayer, error: createError } = await supabase
          .from("players")
          .insert([{ user_id: userId, name: userName }])
          .select("id")
          .single();

        if (createError) return console.error("Error creating player", createError);
        playerData = newPlayer;
      }

      if (!playerData) {
        return console.error("Failed to get or create player");
      }

      // Ensure player joined the match
      const { data: matchPlayer } = await supabase
        .from("match_players")
        .select("player_id")
        .eq("match_id", matchId)
        .eq("player_id", playerData.id)
        .maybeSingle();

      if (!matchPlayer) {
        const { error: joinError } = await supabase
          .from("match_players")
          .insert([{ match_id: matchId, player_id: playerData.id }]);
        if (joinError) return console.error("Error joining match", joinError);
      }

      // Insert round attempt
      await supabase.from("round_attempts").insert([
        { round_id: round.roundId, player_id: playerData.id, answer, is_correct: isCorrect },
      ]);

      // Update match_rounds - use userId for answered_by since it references users table
      await supabase
        .from("match_rounds")
        .update({ answered_by: userId, is_correct: isCorrect })
        .eq("id", round.roundId);

      if (isCorrect) await fetchScores();

      setIsTransitioning(true);
      setCountdown(2);

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (!prev || prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => {
        setIsTransitioning(false);
        setCountdown(null);
        startRound();
      }, 2000);

    } catch (err) {
      console.error(err);
      alert("Failed to submit answer.");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
          ← Back to Home
        </button>
        <h1 className="text-2xl font-bold">Match #{matchId.slice(0, 8)}</h1>
      </div>

      {/* Scoreboard */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl text-white">
        <h2 className="text-2xl font-bold mb-2">🏆 Scoreboard</h2>
        {scores.length === 0 ? (
          <p>No scores yet</p>
        ) : (
          <ul className="space-y-1">
            {scores.map((s, i) => (
              <li key={`${s.player_id}-${i}`} className="flex justify-between">
                <span>{s.player_name ?? "Unknown"}</span>
                <span className="font-bold">{s.score}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Game UI */}
      {matchCompleted ? (
        <div className="bg-white p-6 rounded-xl text-center">
          <h2 className="text-2xl font-bold text-green-600">🎉 Match Completed!</h2>
          <p>All questions answered. Redirecting to results...</p>
        </div>
      ) : !round ? (
        <div className="bg-white p-6 rounded-xl">
          <button
            onClick={startRound}
            disabled={loading || allFlashcards.length === 0}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Starting..." : "Start Match"}
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">{round.question}</h2>
          <div className="grid grid-cols-1 gap-3">
            {round.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => answerFlashcard(opt)}
                                disabled={!!answeredOption}
                className={`cursor-pointer p-3 rounded-xl text-lg font-semibold shadow-md transition-all
                  ${
                    answeredOption
                      ? opt === correctAnswer
                        ? "bg-green-500 text-white scale-105"
                        : opt === answeredOption
                        ? "bg-red-500 text-white opacity-80"
                        : "bg-gray-200 text-gray-700"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {answeredOption && (
            <div className="mt-4 space-y-3">
              <p
                className={`text-lg font-bold ${
                  answeredOption === correctAnswer ? "text-green-600" : "text-red-600"
                }`}
              >
                {answeredOption === correctAnswer ? "✅ Correct Answer!" : "❌ Wrong Answer!"}
              </p>

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {isTransitioning
                    ? "Loading next question..."
                    : countdown
                    ? `Next question in ${countdown} seconds...`
                    : currentQuestionNumber >= totalQuestions
                    ? "Match completed! Redirecting to results..."
                    : "Next question in 2 seconds..."}
                </p>
                <button
                  onClick={() => {
                    setIsTransitioning(false);
                    setCountdown(null);
                    startRound();
                  }}
                  disabled={loading || isTransitioning}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading || isTransitioning
                    ? "Loading..."
                    : currentQuestionNumber >= totalQuestions
                    ? "View Results →"
                    : "Next Question →"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

