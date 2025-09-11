"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [answeredOption, setAnsweredOption] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [allFlashcards, setAllFlashcards] = useState<Flashcard[]>([]);
  const [usedFlashcardIds, setUsedFlashcardIds] = useState<Set<string>>(new Set());
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [matchCompleted, setMatchCompleted] = useState(false);

  // 🔹 Fetch scores for the current match
  const fetchScores = useCallback(async () => {
    if (!matchId) return;
    
    try {
      // Try multiple possible table names for scores
      let { data, error } = await supabase
        .from("match_scores")
        .select("player_id, score")
        .eq("match_id", matchId);
        
      // If match_scores doesn't exist, try alternative table names
      if (error && error.code === 'PGRST116') {
        ({ data, error } = await supabase
          .from("scores")
          .select("player_id, score")
          .eq("match_id", matchId));
      }
      
      if (!error && data) {
        setScores(data);
        console.log("Scores fetched:", data);
      } else {
        console.log("No scores found or error:", error);
      }
    } catch (err) {
      console.error("Error fetching scores:", err);
    }
  }, [matchId]);

  // 🔹 Fetch current player
  useEffect(() => {
    const fetchPlayer = async () => {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) return;

      // Try to find existing player
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle(); // Use maybeSingle() instead of single()

      if (playerData) {
        setCurrentPlayerId(playerData.id);
        return;
      }

      // If no player exists, create one
      if (playerError?.code === 'PGRST116' || !playerData) {
        const { data: newPlayer, error: createError } = await supabase
          .from("players")
          .insert([{ user_id: userId }])
          .select("id")
          .single();

        if (!createError && newPlayer) {
          setCurrentPlayerId(newPlayer.id);
          return;
        }
      }

      // Final fallback: pick first available player
      const { data: fallbackData } = await supabase
        .from("players")
        .select("id")
        .limit(1)
        .maybeSingle(); // Use maybeSingle() here too

      if (fallbackData) {
        setCurrentPlayerId(fallbackData.id);
      }
    };

    fetchPlayer();
  }, []);

  // 🔹 Fetch scores on component mount
  useEffect(() => {
    if (matchId) {
      fetchScores();
    }
  }, [matchId, fetchScores]);

  // 🔹 Load all flashcards when component mounts
  useEffect(() => {
    const loadFlashcards = async () => {
      const { data: flashcards, error } = await supabase
        .from("flashcards")
        .select("id, question, options, correct_answer");

      if (!error && flashcards) {
        setAllFlashcards(flashcards);
        setTotalQuestions(flashcards.length);
      }
    };
    loadFlashcards();
  }, []);

  // 🔹 Check for existing rounds to restore match progress
  useEffect(() => {
    const checkExistingRounds = async () => {
      if (!matchId) return;
      
      const { data: existingRounds } = await supabase
        .from("match_rounds")
        .select("flashcard_id")
        .eq("match_id", matchId);

      if (existingRounds && existingRounds.length > 0) {
        const usedIds = new Set(existingRounds.map(round => round.flashcard_id));
        setUsedFlashcardIds(usedIds);
        setCurrentQuestionNumber(existingRounds.length + 1);
      }
    };
    checkExistingRounds();
  }, [matchId]);

  // 🔹 Start a new round
  const startRound = async () => {
    if (!matchId) return alert("Invalid match ID");
    
    // Check if all flashcards have been used
    const availableFlashcards = allFlashcards.filter(fc => !usedFlashcardIds.has(fc.id));
    
    if (availableFlashcards.length === 0) {
      // All flashcards completed - end the match
      setMatchCompleted(true);
      
      // Update match status to completed
      await supabase
        .from("matches")
        .update({ status: "completed" })
        .eq("id", matchId);
      
      // Redirect to results page
      router.push(`/match/${matchId}/results`);
      return;
    }

    setLoading(true);

    // Pick a random flashcard from available ones
    const flashcard = availableFlashcards[Math.floor(Math.random() * availableFlashcards.length)];

    const { data: roundData, error: roundError } = await supabase
      .from("match_rounds")
      .insert([{ match_id: matchId, flashcard_id: flashcard.id }])
      .select("id")
      .single();

    if (roundError || !roundData) {
      setLoading(false);
      return alert("Failed to start round.");
    }

    // Update used flashcards and question number
    const newUsedIds = new Set(usedFlashcardIds);
    newUsedIds.add(flashcard.id);
    setUsedFlashcardIds(newUsedIds);
    setCurrentQuestionNumber(newUsedIds.size);

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

  // 🔹 Answer a flashcard
  const answerFlashcard = async (playerId: string, answer: string) => {
    if (!round) return;
    const isCorrect = round.correct_answer === answer;

    setAnsweredOption(answer);

    try {
      // insert attempt
      await supabase.from("round_attempts").insert([
        {
          round_id: round.roundId,
          player_id: playerId,
          answer,
          is_correct: isCorrect,
        },
      ]);

      // update match_rounds
      await supabase
        .from("match_rounds")
        .update({ answered_by: playerId, is_correct: isCorrect })
        .eq("id", round.roundId);

      // increment score via RPC if exists
      if (isCorrect) {
        await supabase.rpc("increment_score", { matchid: matchId, playerid: playerId, points: 1 });
        // Refresh scores after updating
        await fetchScores();
      }

      // Set transitioning state and move to next question after 2 seconds delay
      setIsTransitioning(true);
      setCountdown(2);
      
      // Start countdown
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
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
      {/* 🔙 Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <span>←</span>
          <span>Back to Home</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Match #{matchId.slice(0, 8)}</h1>
      </div>

      {/* 🏆 Scoreboard */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl shadow-lg text-white">
        <h2 className="text-2xl font-bold mb-2">🏆 Scoreboard</h2>
        {scores.length === 0 ? (
          <p>No scores yet</p>
        ) : (
          <ul className="space-y-1">
            {scores.map((s) => (
              <li key={s.player_id} className="flex justify-between">
                <span>{s.player_id.slice(0, 6)}...</span>
                <span className="font-bold">{s.score}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 🎮 Game UI */}
      {matchCompleted ? (
        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">🎉 Match Completed!</h2>
          <p className="text-gray-600 mb-4">All questions have been answered. Redirecting to results...</p>
        </div>
      ) : !round ? (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-center mb-4">
            {totalQuestions > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{currentQuestionNumber - 1} / {totalQuestions} completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionNumber - 1) / totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={startRound}
            disabled={loading || allFlashcards.length === 0}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Starting..." : 
             allFlashcards.length === 0 ? "Loading flashcards..." :
             currentQuestionNumber === 1 ? "Start Match" : "Next Question"}
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-md">
          {/* Progress indicator */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionNumber} of {totalQuestions}</span>
              <span>{totalQuestions - currentQuestionNumber + 1} remaining</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentQuestionNumber / totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">{round.question}</h2>
          <div className="grid grid-cols-1 gap-3">
            {round.options.map((opt, i) => (
              <button
                key={i}
                onClick={() =>
                  currentPlayerId && answerFlashcard(currentPlayerId, opt)
                }
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
                  answeredOption === correctAnswer
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {answeredOption === correctAnswer
                  ? "✅ Correct Answer!"
                  : "❌ Wrong Answer!"}
              </p>
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {isTransitioning 
                    ? "Loading next question..." 
                    : countdown 
                    ? `Next question in ${countdown} seconds...`
                    : currentQuestionNumber >= totalQuestions 
                    ? "Match completed! Redirecting to results..." 
                    : "Next question in 2 seconds..."
                  }
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
                  {loading || isTransitioning ? "Loading..." : 
                   currentQuestionNumber >= totalQuestions ? "View Results →" : "Next Question →"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
