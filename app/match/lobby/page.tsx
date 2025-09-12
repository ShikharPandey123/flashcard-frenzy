'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface Match {
  id: string;
  created_at: string;
  created_by: string;
  match_players: { player_id: string }[];
}

interface PlayerStats {
  total_matches: number;
  matches_won: number;
  win_rate: number;
  total_score: number;
}

export default function LobbyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // 🔹 Ensure player exists in `players` table
  const ensurePlayer = async (userId: string) => {
    const { data: players } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    // If player exists, return the first one
    if (players && players.length > 0) {
      return players[0].id;
    }

    // Create new player if none exists
    const { data: newPlayer, error: insertError } = await supabase
      .from('players')
      .insert({ user_id: userId, name: 'Anonymous' }) // you can replace with user.email or profile name
      .select('id')
      .single();

    if (insertError) throw insertError;
    return newPlayer.id;
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;
      setUser(currentUser);

      if (currentUser) {
        const pid = await ensurePlayer(currentUser.id);
        setPlayerId(pid);
        await fetchActiveMatches();
        await fetchPlayerStats(pid);
      }
    };
    init();
  }, []);

  // 🔹 Fetch latest matches
  const fetchActiveMatches = async () => {
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id,
        created_at,
        created_by,
        match_players (player_id)
      `)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error(error);
    } else {
      setActiveMatches(matches || []);
    }
  };

  // 🔹 Fetch player statistics
  const fetchPlayerStats = async (pid: string) => {
    const { data: matches, error } = await supabase
      .from('match_players')
      .select('match_id')
      .eq('player_id', pid);

    if (error) {
      console.error(error);
      return setPlayerStats({ total_matches: 0, matches_won: 0, win_rate: 0, total_score: 0 });
    }

    const totalMatches = matches?.length || 0;
    let totalScore = 0;
    let matchesWon = 0;

    // Calculate stats from match data
    for (let i = 0; i < (matches?.length || 0); i++) {
      const { data: attempts } = await supabase
        .from('round_attempts')
        .select('is_correct, round_id')
        .eq('player_id', pid)
        .eq('is_correct', true);

      const matchScore = attempts?.length || 0;
      totalScore += matchScore;
      if (matchScore > 0) matchesWon++;
    }

    const winRate = totalMatches > 0 ? (matchesWon / totalMatches) * 100 : 0;

    setPlayerStats({
      total_matches: totalMatches,
      matches_won: matchesWon,
      win_rate: winRate,
      total_score: totalScore,
    });
  };

  // 🔹 Create match
  const handleCreateMatch = async () => {
    if (!user || !playerId) return router.push('/auth');

    setLoading(true);
    try {
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({ created_by: user.id })
        .select('id')
        .single();

      if (matchError || !match) throw matchError;

      const { error: joinError } = await supabase
        .from('match_players')
        .insert({ match_id: match.id, player_id: playerId });

      if (joinError) throw joinError;

      router.push(`/match/${match.id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Join match
  const handleJoinMatch = async (matchId: string) => {
    if (!playerId) return router.push('/auth');

    setLoading(true);
    try {
      const { error: joinError } = await supabase
        .from('match_players')
        .insert({ match_id: matchId, player_id: playerId });

      if (joinError) throw joinError;
      router.push(`/match/${matchId}`);
    } catch (err) {
      console.error(err);
      setError('Failed to join match');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Render UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Match Lobby</h1>
          <p className="text-gray-600">Join a match or create your own!</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Player Stats */}
        {playerStats && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{playerStats.total_matches}</div>
                <div className="text-gray-600">Total Matches</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{playerStats.matches_won}</div>
                <div className="text-gray-600">Matches Won</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{playerStats.win_rate.toFixed(1)}%</div>
                <div className="text-gray-600">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{playerStats.total_score}</div>
                <div className="text-gray-600">Total Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Match</h3>
            <p className="text-gray-600 mb-4">Start a new match and invite others to join</p>
            <button
              onClick={handleCreateMatch}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Match'}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Join</h3>
            <p className="text-gray-600 mb-4">Join the most recent available match</p>
            <button
              onClick={() => activeMatches.length > 0 && handleJoinMatch(activeMatches[0].id)}
              disabled={loading || activeMatches.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Joining...' : activeMatches.length === 0 ? 'No Matches Available' : 'Quick Join'}
            </button>
          </div>
        </div>

        {/* Active Matches */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Matches</h3>
          {activeMatches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No matches available. Create one to get started!</p>
          ) : (
            <div className="grid gap-4">
              {activeMatches.map((match) => (
                <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-800">Match #{match.id.slice(0, 8)}</div>
                      <div className="text-sm text-gray-500">
                        {match.match_players.length} player(s) • Created {new Date(match.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinMatch(match.id)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
