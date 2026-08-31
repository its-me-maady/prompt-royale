/**
 * agent-notes: { ctx: "Real-time synchronized Boss Raid Arena with database-authoritative state resolution and dynamic questioning", deps: ["apps/web/src/app/api/arena/vote/route.ts", "apps/web/src/app/api/arena/resolve/route.ts", "apps/web/src/lib/db/supabase-client.ts"], state: "canonical", last: "sato@2026-08-25" }
 */
'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  GameState,
  calculateRoundResults,
  processRevive,
  PlayerVote,
} from '../../engine/game-logic';
import { supabaseClient } from "@/lib/db/supabase-client";
import { BossHealthBar } from '../../components/arena/BossHealthBar';
import { PlayerHealthBar } from '../../components/arena/PlayerHealthBar';
import { VotingOptions } from '../../components/arena/VotingOptions';
import { PhaseIndicator } from '../../components/arena/PhaseIndicator';
import { ReviveModal } from '../../components/ReviveModal';

function ArenaInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const squadId = searchParams.get('squadId') || 'test-squad-1';

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [votes, setVotes] = useState<PlayerVote[]>([]);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [question, setQuestion] = useState<{
    question: string;
    options: string[];
    correctIndex: number;
  } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const channelRef = useRef<any>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.user) {
          setPlayerId(session.user.id.substring(0, 8));
          return;
        }
      } catch (err) {
        console.error('Auth init error:', err);
      }
      setPlayerId(`p${Math.floor(Math.random() * 10000)}`);
    };
    initAuth();
  }, []);

  // 2. Fetch Initial State from Database
  const fetchGameState = async () => {
    try {
      const { data: squad, error: squadErr } = await supabaseClient
        .from('squads')
        .select('*')
        .eq('id', squadId)
        .single();

      if (squadErr) throw squadErr;

      const { data: members, error: memErr } = await supabaseClient
        .from('squad_members')
        .select('*')
        .eq('squad_id', squadId);

      if (memErr) throw memErr;

      const formattedState: GameState = {
        boss: { hp: squad.boss_hp, maxHp: squad.boss_max_hp },
        players: members.map((m: any) => ({ id: m.player_id, hp: m.hp, status: m.status })),
        status: squad.status
      };

      setGameState(formattedState);
    } catch (err) {
      console.warn('[Offline Mode] Connecting locally to state.');
      // Local fallback for offline/test environments
      setGameState({
        boss: { hp: 1000, maxHp: 1000 },
        players: [{ id: playerId || 'player-1', hp: 100, status: 'alive' }],
        status: 'active'
      });
    }
  };

  // 3. Connect to Supabase Realtime Channels
  useEffect(() => {
    if (!playerId) return;

    fetchGameState();

    // Setup broadcast channel for ephemeral round changes (timer, votes)
    const channel = supabaseClient.channel(`boss-raid-${squadId}`);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const playersIds = Object.keys(presenceState).sort();
        const hostElected = playersIds[0] === playerId;
        setIsHost(hostElected);
        if (hostElected && !question) {
          fetchQuestion();
        }
      })
      .on('broadcast', { event: 'timer_update' }, ({ payload }) => {
        setTimeLeft(payload.time);
      })
      .on('broadcast', { event: 'question_update' }, ({ payload }) => {
        setFetchError(null);
        setQuestion(payload);
        setMyVote(null);
        setVotes([]);
      })
      .on('broadcast', { event: 'player_vote' }, ({ payload }) => {
        setVotes((prev) => {
          const newVotes = prev.filter((v) => v.playerId !== payload.playerId);
          return [...newVotes, payload];
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: `Player ${playerId}`,
            online_at: new Date().toISOString()
          });
          if (isHost && !question) {
            fetchQuestion();
          }
        }
      });

    // Setup Postgres changes listener for authoritative state sync
    const dbChannel = supabaseClient
      .channel(`db-changes-${squadId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'squads', filter: `id=eq.${squadId}` },
        async (payload: any) => {
          const updatedSquad = payload.new;
          const { data: members } = await supabaseClient
            .from('squad_members')
            .select('*')
            .eq('squad_id', squadId);

          const newState: GameState = {
            boss: { hp: updatedSquad.boss_hp, maxHp: updatedSquad.boss_max_hp },
            players: (members || []).map((m: any) => ({
              id: m.player_id,
              hp: m.hp,
              status: m.status
            })),
            status: updatedSquad.status
          };

          setGameState(newState);
          setRoundNumber((prev) => prev + 1);

          if (newState.status === 'active') {
            setTimeLeft(60);
            if (isHost) fetchQuestion();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      dbChannel.unsubscribe();
    };
  }, [playerId, isHost]);

  const fetchQuestion = async (retryCount = 0) => {
    try {
      setFetchError(null);
      const res = await fetch('/api/arena/revive');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setQuestion(data);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'question_update',
        payload: data
      });
    } catch (e) {
      if (retryCount < 2) {
        setTimeout(() => fetchQuestion(retryCount + 1), 1500);
      } else {
        setFetchError('AI Core connection lost. Boss is jamming signals!');
      }
    }
  };

  // 4. Host countdown clock broadcasting
  useEffect(() => {
    if (!isHost || !gameState || gameState.status !== 'active' || !question) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          resolveRound();
          return 0;
        }
        channelRef.current?.send({
          type: 'broadcast',
          event: 'timer_update',
          payload: { time: prev - 1 }
        });
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost, gameState?.status, question, roundNumber]);

  // 5. Submit vote to API route
  const handleVote = async (index: number) => {
    if (gameState?.status !== 'active' && gameState?.status !== 'revive') return;
    if (!question || myVote !== null) return;

    setMyVote(index);
    const isCorrect = index === question.correctIndex;

    const votePayload: PlayerVote = {
      playerId,
      isCorrect
    };

    setVotes((prev) => [...prev.filter((v) => v.playerId !== playerId), votePayload]);

    channelRef.current?.send({
      type: 'broadcast',
      event: 'player_vote',
      payload: votePayload
    });

    try {
      const res = await fetch('/api/arena/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          squadId,
          playerId,
          roundNumber,
          isCorrect
        })
      });
      if (!res.ok) {
        setFetchError('Failed to record vote.');
      }
    } catch (err) {
      console.error('Failed to post vote to DB:', err);
      setFetchError('Failed to record vote.');
    }
  };

  // 6. Host resolves round via secure API RPC endpoint
  const resolveRound = async () => {
    if (!isHost || !gameState || !question) return;

    try {
      const res = await fetch('/api/arena/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          squadId,
          roundNumber
        })
      });

      if (res.ok) {
        const updatedState = await res.json();
        if (updatedState && updatedState.status) {
          // If offline/fallback response data
          setGameState(updatedState);
        }
      }
    } catch (err) {
      console.error('Failed to resolve round:', err);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 font-sans relative overflow-hidden">
        <h1 className="text-3xl font-bold mb-4 z-10 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
          Boss Raid Arena
        </h1>
        <p className="text-xl animate-pulse text-gray-400 z-10">Connecting to Arena...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-100 font-sans p-4 md:p-8 lg:p-12 max-w-5xl mx-auto relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-900/10 rounded-full filter blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full filter blur-[150px] pointer-events-none" />

      {/* Top Bar: Squad health metrics */}
      <header className="flex justify-between items-start mb-12 z-10 relative bg-gray-900/40 p-6 rounded-3xl border border-gray-800/50 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-wrap gap-3">
          {gameState.players?.map((p, i) => (
            <PlayerHealthBar key={p.id} id={p.id} isMe={p.id === playerId} index={i} hp={p.hp} />
          ))}
        </div>
        <BossHealthBar currentHp={gameState.boss?.hp || 0} maxHp={gameState.boss?.maxHp || 1000} />
      </header>

      {/* Arena Content */}
      <main className="flex-1 mt-8 z-10 relative">
        {fetchError && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/50 rounded-2xl text-red-300 text-center font-mono text-sm z-50">
            {fetchError}
          </div>
        )}
        {gameState.status === 'victory' && (
          <div className="text-center mt-20">
            <h1 className="text-5xl font-bold text-green-400 mb-4 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]">
              VICTORY
            </h1>
            <p className="text-xl text-gray-300">The Boss has been defeated!</p>
          </div>
        )}

        {gameState.status === 'defeat' && (
          <div className="text-center mt-20">
            <h1 className="text-5xl font-bold text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">
              DEFEAT
            </h1>
            <p className="text-xl text-gray-300">The squad was wiped out.</p>
          </div>
        )}

        {fetchError && !question && (
          <div className="text-center mt-20">
            <h2 className="text-2xl text-red-400 mb-6 animate-pulse font-mono">{fetchError}</h2>
            {isHost ? (
              <button
                onClick={() => fetchQuestion(0)}
                className="px-8 py-3 bg-red-900/50 hover:bg-red-800 border border-red-500 rounded-xl text-white font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                Manual Override (Retry)
              </button>
            ) : (
              <p className="text-gray-500 font-mono">Waiting for Host to re-establish connection...</p>
            )}
          </div>
        )}

        {gameState.status === 'active' && question && !fetchError && (
          <>
            <PhaseIndicator status={gameState.status as 'active' | 'revive'} timeLeft={timeLeft} />

            <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 p-8 rounded-3xl shadow-2xl mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />
              <h1 className="text-2xl md:text-3xl font-semibold leading-relaxed text-gray-100 text-center max-w-3xl mx-auto font-sans">
                {question.question}
              </h1>
            </div>

            <VotingOptions
              options={question.options}
              myVote={myVote}
              onVote={handleVote}
              disabled={gameState?.status !== 'active'}
            />

            <div className="mt-8 flex justify-center items-center gap-3">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-gray-800" />
              <span className="text-sm font-medium text-gray-500 bg-gray-900/80 px-4 py-1.5 rounded-full border border-gray-800/50">
                {votes.length} / {gameState.players.filter((p) => p.status === 'alive').length || 1} votes locked in
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-gray-800" />
            </div>
          </>
        )}

        {gameState.status === 'revive' && question && !fetchError && (
          <ReviveModal
            question={question}
            timeLeft={timeLeft}
            myVote={myVote}
            onVote={handleVote}
            votesCount={votes.length}
            totalPlayers={gameState.players.filter((p) => p.status === 'alive').length || 1}
          />
        )}
      </main>
    </div>
  );
}

export default function BossRaidArena() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 font-sans relative overflow-hidden">
        <h1 className="text-3xl font-bold mb-4 z-10 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
          Boss Raid Arena
        </h1>
        <p className="text-xl animate-pulse text-gray-400 z-10">Connecting to Arena...</p>
      </div>
    }>
      <ArenaInner />
    </Suspense>
  );
}
