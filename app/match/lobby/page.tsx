'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Users, 
  Trophy, 
  Clock, 
  Plus, 
  Gamepad2, 
  Star,
  Zap,
  Target,
  Crown
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface Match {
  id: string;
  created_at: string;
  created_by: string;
  match_players: { user_id: string }[];
}

interface PlayerStats {
  total_matches: number;
  matches_won: number;
  win_rate: number;
  total_score: number;
}

export default function LobbyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        await fetchActiveMatches();
        await fetchPlayerStats(data.user.id);
      }
    };
    getUser();
  }, []);

  const fetchActiveMatches = async () => {
    try {
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          id,
          created_at,
          created_by,
          match_players (user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setActiveMatches(matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchPlayerStats = async (userId: string) => {
    try {
      // Get all matches the user has participated in
      const { data: matches, error } = await supabase
        .from('match_players')
        .select('match_id')
        .eq('user_id', userId);

      if (error) throw error;

      const totalMatches = matches?.length || 0;
      
      // Calculate total score and wins by counting correct answers from round_attempts
      let totalScore = 0;
      let matchesWon = 0;
      
      if (matches && matches.length > 0) {
        for (const match of matches) {
          // Count correct answers for this user in this match
          const { data: attempts } = await supabase
            .from('round_attempts')
            .select('is_correct, match_rounds!inner(match_id)')
            .eq('player_id', userId)
            .eq('match_rounds.match_id', match.match_id)
            .eq('is_correct', true);
          
          const matchScore = attempts?.length || 0;
          totalScore += matchScore;
          
          // Consider a match "won" if user got at least 1 correct answer
          if (matchScore > 0) {
            matchesWon++;
          }
        }
      }
      
      const winRate = totalMatches > 0 ? (matchesWon / totalMatches) * 100 : 0;

      setPlayerStats({
        total_matches: totalMatches,
        matches_won: matchesWon,
        win_rate: winRate,
        total_score: totalScore
      });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      // Set default stats on error
      setPlayerStats({
        total_matches: 0,
        matches_won: 0,
        win_rate: 0,
        total_score: 0
      });
    }
  };

  const handleCreateMatch = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create a new match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({ created_by: user.id })
        .select('id, created_by')
        .single();

      if (matchError || !match) {
        throw new Error('Could not create match');
      }

      // Join the match as a player
      const { error: joinError } = await supabase
        .from('match_players')
        .insert({
          match_id: match.id,
          user_id: user.id,
        });

      if (joinError) {
        throw new Error('Could not join match');
      }

      // Navigate to the match
      router.push(`/match/${match.id}`);
    } catch (error) {
      console.error('Error creating match:', error);
      setError('Failed to create match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMatch = async (matchId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Join the match as a player
      const { error: joinError } = await supabase
        .from('match_players')
        .insert({
          match_id: matchId,
          user_id: user.id,
        });

      if (joinError) {
        throw new Error('Could not join match');
      }

      // Navigate to the match
      router.push(`/match/${matchId}`);
    } catch (error) {
      console.error('Error joining match:', error);
      setError('Failed to join match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Authentication Required
            </CardTitle>
            <CardDescription>Please sign in to access the match lobby</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/auth')} 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Sign In
            </Button>
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
        {/* Hero Section */}
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
              className="p-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 mr-4"
            >
              <Gamepad2 className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Match Lobby
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Challenge players worldwide in fast-paced flashcard battles. Create your own match or join an existing one!
          </p>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="mb-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Stats Section */}
        {playerStats && (
          <motion.div variants={itemVariants} className="mb-8">
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                  Your Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="h-5 w-5 text-blue-600 mr-1" />
                      <span className="text-2xl font-bold text-blue-600">{playerStats.total_matches}</span>
                    </div>
                    <p className="text-sm text-gray-600">Total Matches</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                    <div className="flex items-center justify-center mb-2">
                      <Crown className="h-5 w-5 text-green-600 mr-1" />
                      <span className="text-2xl font-bold text-green-600">{playerStats.matches_won}</span>
                    </div>
                    <p className="text-sm text-gray-600">Wins</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <div className="flex items-center justify-center mb-2">
                      <Star className="h-5 w-5 text-yellow-600 mr-1" />
                      <span className="text-2xl font-bold text-yellow-600">{playerStats.win_rate.toFixed(1)}%</span>
                    </div>
                    <p className="text-sm text-gray-600">Win Rate</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                    <div className="flex items-center justify-center mb-2">
                      <Zap className="h-5 w-5 text-purple-600 mr-1" />
                      <span className="text-2xl font-bold text-purple-600">{playerStats.total_score}</span>
                    </div>
                    <p className="text-sm text-gray-600">Total Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Section */}
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Start Playing
              </CardTitle>
              <CardDescription>
                Create a new match or join an existing one
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleCreateMatch}
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                {loading ? 'Creating...' : 'Create New Match'}
              </Button>
              <Button
                onClick={fetchActiveMatches}
                variant="outline"
                size="lg"
                className="border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
              >
                <Users className="h-5 w-5 mr-2" />
                Refresh Matches
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Matches Section */}
        <motion.div variants={itemVariants}>
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                Active Matches
                <Badge variant="secondary" className="ml-2">
                  {activeMatches.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Join any of these waiting matches to start playing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeMatches.length === 0 ? (
                <div className="text-center py-12">
                  <Gamepad2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Matches</h3>
                  <p className="text-gray-500 mb-4">Be the first to create a match!</p>
                  <Button
                    onClick={handleCreateMatch}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Match
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="group"
                    >
                      <Card className="border-2 border-gray-100 hover:border-purple-200 transition-all duration-200 hover:shadow-lg cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              Active
                            </Badge>
                            <div className="flex items-center text-sm text-gray-500">
                              <Users className="h-4 w-4 mr-1" />
                              {match.match_players?.length || 0}/4
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <p className="text-sm text-gray-600">
                              Created: {new Date(match.created_at).toLocaleTimeString()}
                            </p>
                          </div>

                          <Button
                            onClick={() => handleJoinMatch(match.id)}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 group-hover:shadow-md transition-all duration-200"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Join Match
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
