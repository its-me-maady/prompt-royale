"use client";
import { useEffect, useState, useRef } from "react";
import {
  GameState,
  calculateRoundResults,
  processRevive,
  PlayerVote,
} from "../../engine/game-logic";
import { supabaseClient } from "../../lib/db/supabase-client";
import { BossHealthBar } from "../../components/arena/BossHealthBar";
import { PlayerHealthBar } from "../../components/arena/PlayerHealthBar";
import { VotingOptions } from "../../components/arena/VotingOptions";
import { PhaseIndicator } from "../../components/arena/PhaseIndicator";
import { ReviveModal } from "../../components/ReviveModal";

const SQUAD_ID = "test-squad-1"; // Hardcoded for MVP

export default function BossRaidArena() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [isHost, setIsHost] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [votes, setVotes] = useState<PlayerVote[]>([]);
  const [myVote, setMyVote] = useState<number | null>(null);
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
        if (!session) {
          const { data, error } = await supabaseClient.auth.signInAnonymously();
          if (error) console.error("Anonymous login error:", error);
          if (data?.user) {
            setPlayerId(data.user.id.substring(0, 8));
            return;
          }
        } else {
          setPlayerId(session.user.id.substring(0, 8));
          return;
        }
      } catch (err) {
        console.error("Auth init error:", err);
      }
      setPlayerId(`p${Math.floor(Math.random() * 10000)}`);
    };
    initAuth();
  }, []);

  // Initialize game state and channel
  useEffect(() => {
    if (!playerId) return;

    const channel = supabaseClient.channel(`boss-raid-${SQUAD_ID}`);
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const playersIds = Object.keys(state).sort();
        if (playersIds[0] === playerId) {
          setIsHost(true);
        } else {
          setIsHost(false);
        }

        // Initial setup for Host
        if (playersIds[0] === playerId && !gameState) {
          const initialState: GameState = {
            boss: { hp: 1000, maxHp: 1000 },
            players: playersIds.map((id) => ({ id, hp: 100, status: "alive" })),
            status: "active",
          };
          setGameState(initialState);
          channel.send({
            type: "broadcast",
            event: "state_update",
            payload: initialState,
          });
          fetchQuestion();
        }
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (isHost && gameState) {
          // Add new player
          const newState = {
            ...gameState,
            players: [
              ...gameState.players,
              { id: key, hp: 100, status: "alive" as const },
            ],
          };
          setGameState(newState);
          channel.send({
            type: "broadcast",
            event: "state_update",
            payload: newState,
          });
        }
      })
      .on("broadcast", { event: "state_update" }, ({ payload }) => {
        setGameState(payload);
      })
      .on("broadcast", { event: "error_update" }, ({ payload }) => {
        setFetchError(payload);
      })
      .on("broadcast", { event: "timer_update" }, ({ payload }) => {
        setTimeLeft(payload.time);
      })
      .on("broadcast", { event: "question_update" }, ({ payload }) => {
        setFetchError(null);
        setQuestion(payload);
        setMyVote(null);
        setVotes([]);
      })
      .on("broadcast", { event: "player_vote" }, ({ payload }) => {
        setVotes((prev) => {
          const newVotes = prev.filter((v) => v.playerId !== payload.playerId);
          return [...newVotes, payload];
        });
      });

    const offlineTimer = setTimeout(() => {
      setGameState((prev) => {
        if (!prev) {
          setIsHost(true);
          const initialState: GameState = {
            boss: { hp: 1000, maxHp: 1000 },
            players: [{ id: playerId || "player-1", hp: 100, status: "alive" }],
            status: "active",
          };
          fetchQuestion();
          return initialState;
        }
        return prev;
      });
    }, 1200);

    return () => {
      clearTimeout(offlineTimer);
      channel.unsubscribe();
    };
  }, [playerId]);

  const fetchQuestion = async (retryCount = 0) => {
    try {
      setFetchError(null);
      if (retryCount > 0) {
        setFetchError("Retrying connection to AI Core...");
        channelRef.current?.send({
          type: "broadcast",
          event: "error_update",
          payload: "Retrying connection to AI Core...",
        });
      }

      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      const token = session?.access_token || "anon";
      const res = await fetch("/api/arena/revive", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setFetchError(null);
      setQuestion(data);
      channelRef.current?.send({
        type: "broadcast",
        event: "question_update",
        payload: data,
      });
    } catch (e) {
      console.error("Failed to fetch revive question:", e);
      if (retryCount < 2) {
        setFetchError("AI Core connection unstable... Auto-retrying...");
        channelRef.current?.send({
          type: "broadcast",
          event: "error_update",
          payload: "AI Core connection unstable... Auto-retrying...",
        });
        setTimeout(() => fetchQuestion(retryCount + 1), 1500);
      } else {
        const errorMsg = "AI Core connection lost. Boss is jamming signals!";
        setFetchError(errorMsg);
        channelRef.current?.send({
          type: "broadcast",
          event: "error_update",
          payload: errorMsg,
        });
      }
    }
  };

  // Host Timer Logic & Resolution
  // Host Timer Logic
  useEffect(() => {
    if (!isHost || !gameState || gameState.status !== "active" || !question)
      return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0; // The other useEffect will resolve the round when timeLeft hits 0
        }
        channelRef.current?.send({
          type: "broadcast",
          event: "timer_update",
          payload: { time: prev - 1 },
        });
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost, gameState?.status, question]); // Removed `votes` and `gameState` as dependencies

  // Host Round Resolution Logic (Triggered by Timer or Votes)
  useEffect(() => {
    if (!isHost || !gameState || gameState.status !== "active" || !question)
      return;

    const activePlayers = gameState.players.filter((p) => p.status === "alive");
    const allVoted =
      activePlayers.length > 0 && votes.length === activePlayers.length;
    const timeOut = timeLeft === 0;

    if (allVoted || timeOut) {
      resolveRound();
    }
  }, [isHost, gameState?.status, votes.length, timeLeft]);

  const resolveRound = () => {
    if (!gameState || !question) return;

    // Instead of RPC for MVP, calculate locally as Host and broadcast
    // In production, this would be: await supabase.rpc('resolve_round', { squadId: SQUAD_ID, votes });
    const newState = calculateRoundResults(gameState, votes);
    setGameState(newState);
    channelRef.current?.send({
      type: "broadcast",
      event: "state_update",
      payload: newState,
    });

    if (newState.status === "active") {
      setTimeLeft(60);
      fetchQuestion();
    } else if (newState.status === "revive") {
      fetchQuestion(); // Fetch hard-mode revive question
    }
  };

  const handleVote = (index: number) => {
    if (gameState?.status !== "active" && gameState?.status !== "revive")
      return;
    if (!question || myVote !== null) return;

    setMyVote(index);
    const votePayload: PlayerVote = {
      playerId,
      isCorrect: index === question.correctIndex,
    };

    // Optimistic update locally
    setVotes((prev) => [
      ...prev.filter((v) => v.playerId !== playerId),
      votePayload,
    ]);

    // Broadcast vote
    channelRef.current?.send({
      type: "broadcast",
      event: "player_vote",
      payload: votePayload,
    });

    // Revive Logic for single player
    if (gameState.status === "revive") {
      const reviveSuccess = index === question.correctIndex;
      const newState = processRevive(gameState, reviveSuccess);
      setGameState(newState);
      channelRef.current?.send({
        type: "broadcast",
        event: "state_update",
        payload: newState,
      });
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
        <h1 className="text-3xl font-bold mb-4 z-10 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
          Boss Raid Arena
        </h1>
        <p className="text-xl animate-pulse text-gray-400 z-10">
          Connecting to Arena (Realtime)...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-100 font-sans p-4 md:p-8 lg:p-12 max-w-5xl mx-auto relative overflow-hidden selection:bg-blue-500/30">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-900/20 rounded-full mix-blend-screen filter blur-[150px] opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/20 rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      {/* Top Bar: Subtle Health Indicators */}
      <header className="flex justify-between items-start mb-12 z-10 relative bg-gray-900/40 p-6 rounded-3xl border border-gray-800/50 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-wrap gap-3">
          {gameState.players?.map((p, i) => (
            <PlayerHealthBar
              key={p.id}
              id={p.id}
              isMe={p.id === playerId}
              index={i}
              hp={p.hp}
            />
          ))}
        </div>
        <BossHealthBar
          currentHp={gameState.boss?.hp || 0}
          maxHp={gameState.boss?.maxHp || 1000}
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 mt-8 z-10 relative">
        {gameState.status === "victory" && (
          <div className="text-center mt-20">
            <h1 className="text-5xl font-bold text-green-400 mb-4 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]">
              VICTORY
            </h1>
            <p className="text-xl text-gray-300">The boss has been defeated!</p>
          </div>
        )}

        {gameState.status === "defeat" && (
          <div className="text-center mt-20">
            <h1 className="text-5xl font-bold text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">
              DEFEAT
            </h1>
            <p className="text-xl text-gray-300">The squad was wiped out.</p>
          </div>
        )}

        {fetchError && !question && (
          <div className="text-center mt-20">
            <h2 className="text-2xl text-red-400 mb-6 animate-pulse font-mono">
              {fetchError}
            </h2>
            {isHost ? (
              <button
                onClick={() => fetchQuestion(0)}
                className="px-8 py-3 bg-red-900/50 hover:bg-red-800/80 border border-red-500/50 rounded-xl text-white font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]"
              >
                Manual Override (Retry)
              </button>
            ) : (
              <p className="text-gray-500 font-mono">
                Waiting for Host to re-establish connection...
              </p>
            )}
          </div>
        )}

        {gameState.status === "active" && question && !fetchError && (
          <>
            <PhaseIndicator
              status={gameState.status as "active" | "revive"}
              timeLeft={timeLeft}
            />

            <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 p-8 rounded-3xl shadow-2xl mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />
              <h1 className="text-2xl md:text-3xl font-semibold leading-relaxed text-gray-100 text-center max-w-3xl mx-auto">
                {question.question}
              </h1>
            </div>

            <VotingOptions
              options={question.options}
              myVote={myVote}
              onVote={handleVote}
              disabled={gameState?.status !== "active"}
            />

            <div className="mt-8 flex justify-center items-center gap-3">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-gray-800" />
              <span className="text-sm font-medium text-gray-500 bg-gray-900/80 px-4 py-1.5 rounded-full border border-gray-800/50">
                {votes.length} /{" "}
                {gameState.players.filter((p) => p.status === "alive").length || 1}{" "}
                votes locked in
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-gray-800" />
            </div>
          </>
        )}

        {gameState.status === "revive" && question && !fetchError && (
          <ReviveModal 
            question={question}
            timeLeft={timeLeft}
            myVote={myVote}
            onVote={handleVote}
            votesCount={votes.length}
            totalPlayers={gameState.players.filter((p) => p.status === "alive").length || 1}
          />
        )}
      </main>
    </div>
  );
}
