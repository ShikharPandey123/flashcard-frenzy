'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Star, 
  Target, 
  Users, 
  Home, 
  PlayCircle,
  Crown,
  Medal,
  Zap,
  TrendingUp
} from 'lucide-react';

interface PlayerResult {
  player_id: string;
  username?: string;
  email?: string;
  score: number;
  total_questions: number;
  accuracy: number;
  position: number;
}

interface MatchStats {
  total_questions: number;
  total_players: number;
  match_duration: string;
  highest_score: number;
  average_score: number;
}

// Type definitions for Supabase responses
type MatchPlayerData = {
  player_id: string;
  players: {
    id: string;
    name: string;
    user_id: string;
  };
};

type RoundAttemptData = {
  player_id: string;
  is_correct: boolean;
  created_at: string;
  match_rounds: {
    match_id: string;
  };
  players: {
    id: string;
    name: string;
    user_id: string;
  };
};

export default function MatchResultsPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params?.id as string;

  const [results, setResults] = useState<PlayerResult[]>([]);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        console.log('Fetching results for match:', matchId);
        
        // Validate match ID format
        const isValidUUID = (str: string) => {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return uuidRegex.test(str);
        };

        if (!matchId || !isValidUUID(matchId)) {
          console.error('Invalid match ID format:', matchId);
          setLoading(false);
          return;
        }
        
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        setCurrentUserId(userData.user?.id || null);
        console.log('Current user ID:', userData.user?.id);

        // Fetch all round attempts for this match with proper joins
        const { data: roundAttempts, error: attemptsError } = await supabase
          .from('round_attempts')
          .select(`
            player_id,
            is_correct,
            created_at,
            match_rounds!inner(match_id),
            players!inner(id, name, user_id)
          `)
          .eq('match_rounds.match_id', matchId) as { data: RoundAttemptData[] | null; error: unknown };

        if (attemptsError) {
          console.error('Error fetching round attempts:', attemptsError);
          return;
        }

        console.log('Round attempts fetched:', roundAttempts?.length || 0, roundAttempts);

        // Fetch match players to ensure we have all participants
        const { data: matchPlayers, error: playersError } = await supabase
          .from('match_players')
          .select(`
            player_id,
            players!inner(id, name, user_id)
          `)
          .eq('match_id', matchId) as { data: MatchPlayerData[] | null; error: unknown };

        if (playersError) {
          console.error('Error fetching match players:', playersError);
          return;
        }

        console.log('Match players fetched:', matchPlayers?.length || 0, matchPlayers);

        // Debug: Check the structure of match players
        if (matchPlayers && matchPlayers.length > 0) {
          console.log('Sample match player structure:', matchPlayers[0]);
        }

        // Aggregate scores by player
        const playerScores: Record<string, { 
          score: number; 
          total: number; 
          name: string; 
          user_id: string 
        }> = {};
        
        // Initialize all match players with zero scores
        matchPlayers?.forEach((matchPlayer) => {
          const playerId = matchPlayer.players.id;
          playerScores[playerId] = {
            score: 0,
            total: 0,
            name: matchPlayer.players.name,
            user_id: matchPlayer.players.user_id
          };
        });
        
        // Count scores from attempts
        roundAttempts?.forEach((attempt) => {
          const playerId = attempt.player_id;
          
          if (!playerScores[playerId]) {
            playerScores[playerId] = {
              score: 0,
              total: 0,
              name: attempt.players?.name || 'Unknown Player',
              user_id: attempt.players?.user_id || playerId
            };
          }
          
          playerScores[playerId].total += 1;
          if (attempt.is_correct) {
            playerScores[playerId].score += 1;
          }
        });

        // Create results array
        const playerResults: PlayerResult[] = Object.entries(playerScores).map(([, stats]) => {
          return {
            player_id: stats.user_id,
            username: stats.name,
            email: undefined,
            score: stats.score,
            total_questions: stats.total,
            accuracy: stats.total > 0 ? (stats.score / stats.total) * 100 : 0,
            position: 0 // Will be set after sorting
          };
        });

        // Sort by score (descending) and assign positions
        playerResults.sort((a, b) => b.score - a.score);
        playerResults.forEach((player, index) => {
          player.position = index + 1;
        });

        setResults(playerResults);
        console.log('Final player results:', playerResults);

        // Calculate match statistics
        const totalQuestions = Math.max(...Object.values(playerScores).map(p => p.total), 0);
        const totalPlayers = playerResults.length;
        const highestScore = totalPlayers > 0 ? Math.max(...playerResults.map(p => p.score)) : 0;
        const averageScore = totalPlayers > 0 ? playerResults.reduce((sum, p) => sum + p.score, 0) / totalPlayers : 0;

        // Calculate match duration (rough estimate)
        const timestamps = roundAttempts?.map(r => new Date(r.created_at).getTime()) || [];
        const duration = timestamps.length > 0 
          ? Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 1000 / 60)
          : 0;

        setMatchStats({
          total_questions: totalQuestions || 0,
          total_players: totalPlayers,
          match_duration: `${duration} minutes`,
          highest_score: highestScore,
          average_score: Math.round(averageScore * 10) / 10
        });

      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchResults();
    }
  }, [matchId]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Medal className="h-6 w-6 text-amber-600" />;
      default: return <Target className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRankColor = (position: number) => {
    switch (position) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-amber-400 to-amber-600';
      default: return 'from-gray-100 to-gray-200';
    }
  };

  const currentPlayerResult = results.find(r => r.player_id === currentUserId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading match results...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="p-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 mr-4"
            >
              <Trophy className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Match Results
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            🎉 Congratulations to all players! Here are the final results.
          </p>
        </motion.div>

        {/* Current Player Highlight */}
        {currentPlayerResult && (
          <motion.div variants={itemVariants} className="mb-8">
            <Card className="backdrop-blur-sm bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-2 border-purple-200 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center text-xl">
                  <Star className="h-5 w-5 text-yellow-500 mr-2" />
                  Your Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-white/50">
                    <div className="flex items-center justify-center mb-2">
                      {getRankIcon(currentPlayerResult.position)}
                      <span className="text-2xl font-bold ml-2">#{currentPlayerResult.position}</span>
                    </div>
                    <p className="text-sm text-gray-600">Final Rank</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white/50">
                    <div className="flex items-center justify-center mb-2">
                      <Zap className="h-5 w-5 text-blue-600 mr-1" />
                      <span className="text-2xl font-bold text-blue-600">{currentPlayerResult.score}</span>
                    </div>
                    <p className="text-sm text-gray-600">Score</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white/50">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600 mr-1" />
                      <span className="text-2xl font-bold text-green-600">{currentPlayerResult.accuracy.toFixed(1)}%</span>
                    </div>
                    <p className="text-sm text-gray-600">Accuracy</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white/50">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="h-5 w-5 text-purple-600 mr-1" />
                      <span className="text-2xl font-bold text-purple-600">{currentPlayerResult.total_questions}</span>
                    </div>
                    <p className="text-sm text-gray-600">Questions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Leaderboard */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                  Final Leaderboard
                </CardTitle>
                <CardDescription>
                  Ranked by total score and accuracy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500 mb-4">
                        <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold">No Results Found</p>
                        <p className="text-sm">This match may not have any completed rounds yet.</p>
                      </div>
                      <Button
                        onClick={() => router.push('/match/lobby')}
                        variant="outline"
                        className="mt-4"
                      >
                        Back to Lobby
                      </Button>
                    </div>
                  ) : (
                    results.map((player, index) => (
                      <motion.div
                        key={player.player_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md
                          ${player.player_id === currentUserId 
                            ? 'border-purple-300 bg-purple-50' 
                            : 'border-gray-200 bg-white'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full bg-gradient-to-r ${getRankColor(player.position)}`}>
                              {getRankIcon(player.position)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg flex items-center">
                                {player.username}
                                {player.player_id === currentUserId && (
                                  <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                                )}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Position #{player.position}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-800">{player.score}</div>
                            <div className="text-sm text-gray-600">
                              {player.accuracy.toFixed(1)}% accuracy
                            </div>
                            <div className="text-xs text-gray-500">
                              {player.score}/{player.total_questions} correct
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Match Statistics */}
          <motion.div variants={itemVariants} className="space-y-6">
            {matchStats && (
              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    Match Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-blue-50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Questions</span>
                      <span className="font-semibold">{matchStats.total_questions}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Players</span>
                      <span className="font-semibold">{matchStats.total_players}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Highest Score</span>
                      <span className="font-semibold">{matchStats.highest_score}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average Score</span>
                      <span className="font-semibold">{matchStats.average_score}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="font-semibold">{matchStats.match_duration}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">What&apos;s Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => router.push('/match/lobby')}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Play Another Match
                </Button>
                <Button
                  onClick={() => router.push('/flashcards')}
                  variant="outline"
                  className="w-full border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Practice Flashcards
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="w-full border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
