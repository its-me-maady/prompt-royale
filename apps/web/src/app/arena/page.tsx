'use client';
import { useEffect, useState, useRef } from 'react';
import { GameState, calculateRoundResults, processRevive, PlayerVote } from '../../engine/game-logic';
import { supabaseClient } from '../../lib/db/supabase-client';

const SQUAD_ID = 'test-squad-1'; // Hardcoded for MVP

export default function BossRaidArena() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId] = useState(`p${Math.floor(Math.random() * 10000)}`);
  const [isHost, setIsHost] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [votes, setVotes] = useState<PlayerVote[]>([]);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [question, setQuestion] = useState<{question: string, options: string[], correctIndex: number} | null>(null);
  
  const channelRef = useRef<any>(null);

  // Initialize game state and channel
  useEffect(() => {
    const channel = supabaseClient.channel(`boss-raid-${SQUAD_ID}`);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const playersIds = Object.keys(state).sort();
        if (playersIds[0] === playerId) {
          setIsHost(true);
        }
        
        // Initial setup for Host
        if (playersIds[0] === playerId && !gameState) {
          const initialState: GameState = {
            boss: { hp: 1000, maxHp: 1000 },
            players: playersIds.map(id => ({ id, hp: 100, status: 'alive' })),
            status: 'active'
          };
          setGameState(initialState);
          channel.send({ type: 'broadcast', event: 'state_update', payload: initialState });
          fetchQuestion();
        }
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (isHost && gameState) {
          // Add new player
          const newState = { ...gameState, players: [...gameState.players, { id: key, hp: 100, status: 'alive' as const }] };
          setGameState(newState);
          channel.send({ type: 'broadcast', event: 'state_update', payload: newState });
        }
      })
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        setGameState(payload);
      })
      .on('broadcast', { event: 'timer_update' }, ({ payload }) => {
        setTimeLeft(payload.time);
      })
      .on('broadcast', { event: 'question_update' }, ({ payload }) => {
        setQuestion(payload);
        setMyVote(null);
        setVotes([]);
      })
      .on('broadcast', { event: 'player_vote' }, ({ payload }) => {
        setVotes(prev => {
          const newVotes = prev.filter(v => v.playerId !== payload.playerId);
          return [...newVotes, payload];
        });
      });

    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [playerId]);

  const fetchQuestion = async () => {
    try {
      const res = await fetch('/api/arena/revive');
      const data = await res.json();
      setQuestion(data);
      channelRef.current?.send({ type: 'broadcast', event: 'question_update', payload: data });
    } catch (e) {
      console.error(e);
    }
  };

  // Host Timer Logic & Resolution
  useEffect(() => {
    if (!isHost || !gameState || gameState.status !== 'active' || !question) return;

    // Check if everyone voted
    const activePlayers = gameState.players.filter(p => p.status === 'alive');
    if (activePlayers.length > 0 && votes.length === activePlayers.length) {
       resolveRound();
       return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          resolveRound();
          return 0;
        }
        channelRef.current?.send({ type: 'broadcast', event: 'timer_update', payload: { time: prev - 1 } });
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost, gameState, votes, question]);

  const resolveRound = () => {
    if (!gameState || !question) return;
    
    // Instead of RPC for MVP, calculate locally as Host and broadcast
    // In production, this would be: await supabase.rpc('resolve_round', { squadId: SQUAD_ID, votes });
    const newState = calculateRoundResults(gameState, votes);
    setGameState(newState);
    channelRef.current?.send({ type: 'broadcast', event: 'state_update', payload: newState });
    
    if (newState.status === 'active') {
      setTimeLeft(60);
      fetchQuestion();
    } else if (newState.status === 'revive') {
      fetchQuestion(); // Fetch hard-mode revive question
    }
  };

  const handleVote = (index: number) => {
    if (gameState?.status !== 'active' && gameState?.status !== 'revive') return;
    if (!question || myVote !== null) return;
    
    setMyVote(index);
    const votePayload: PlayerVote = {
      playerId,
      isCorrect: index === question.correctIndex
    };
    
    // Optimistic update locally
    setVotes(prev => [...prev.filter(v => v.playerId !== playerId), votePayload]);
    
    // Broadcast vote
    channelRef.current?.send({ type: 'broadcast', event: 'player_vote', payload: votePayload });
    
    // Revive Logic for single player
    if (gameState.status === 'revive') {
       const reviveSuccess = index === question.correctIndex;
       const newState = processRevive(gameState, reviveSuccess);
       setGameState(newState);
       channelRef.current?.send({ type: 'broadcast', event: 'state_update', payload: newState });
       if (reviveSuccess) {
         setTimeLeft(60);
         fetchQuestion();
       }
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse"></div>
        <h1 className="text-3xl font-bold mb-4 z-10 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Boss Raid Arena</h1>
        <p className="text-xl animate-pulse text-gray-400 z-10">Connecting to Arena (Realtime)...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-8 md:p-16 max-w-4xl mx-auto relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900 rounded-full mix-blend-screen filter blur-[200px] opacity-10"></div>
      
      {/* Top Bar: Subtle Health Indicators */}
      <header className="flex justify-between items-center mb-12 z-10 relative">
        <div className="flex gap-4">
          {gameState.players?.map((p, i) => (
            <div key={p.id} className={`text-sm ${p.id === playerId ? 'ring-2 ring-blue-500 rounded p-1' : ''}`}>
              <span className="font-bold text-gray-300">P{i + 1} {p.id === playerId ? '(You)' : ''}</span>
              <div className="w-16 h-1.5 bg-gray-800 mt-1 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${p.hp > 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}
                  style={{ width: `${(p.hp / 100) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-red-500 font-extrabold mb-1 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">Boss</p>
          <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700 relative">
             <div 
                className="h-full bg-red-600 transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.8)]"
                style={{ width: `${(gameState.boss?.hp / gameState.boss?.maxHp) * 100}%` }}
              />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mt-8 z-10 relative">
        {gameState.status === 'victory' && (
          <div className="text-center mt-20">
            <h1 className="text-5xl font-bold text-green-400 mb-4 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]">VICTORY</h1>
            <p className="text-xl text-gray-300">The boss has been defeated!</p>
          </div>
        )}
        
        {gameState.status === 'defeat' && (
          <div className="text-center mt-20">
            <h1 className="text-5xl font-bold text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">DEFEAT</h1>
            <p className="text-xl text-gray-300">The squad was wiped out.</p>
          </div>
        )}

        {(gameState.status === 'active' || gameState.status === 'revive') && question && (
          <>
            <div className="flex justify-between items-center mb-8">
              <span className={`text-sm font-bold uppercase tracking-widest px-3 py-1 rounded-full ${gameState.status === 'revive' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'}`}>
                {gameState.status === 'revive' ? 'HARD MODE: REVIVE' : 'BATTLE PHASE'}
              </span>
              <span className={`text-2xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-gray-300'}`}>
                00:{timeLeft.toString().padStart(2, '0')}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold leading-relaxed mb-10 text-gray-100">
              {question.question}
            </h1>
            
            <div className="space-y-4">
              {question.options.map((opt, i) => (
                <button 
                  key={i}
                  onClick={() => handleVote(i)}
                  disabled={myVote !== null}
                  className={`w-full text-left px-6 py-4 rounded-xl border transition-all duration-200 text-lg group shadow-lg ${
                    myVote === i 
                      ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                      : myVote !== null
                      ? 'bg-gray-900/30 border-gray-800 opacity-50'
                      : 'border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:border-red-500/50 hover:bg-gray-800'
                  }`}
                >
                  <span className={`inline-block w-8 font-bold transition-colors ${myVote === i ? 'text-blue-400' : 'text-gray-500 group-hover:text-red-400'}`}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <span className={myVote === i ? 'text-white' : 'text-gray-200'}>{opt}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-8 flex justify-center text-sm text-gray-500">
               {votes.length} / {gameState.players.filter(p => p.status === 'alive').length || 1} votes locked in
            </div>
          </>
        )}
      </main>
    </div>
  );
}
