'use client';
import { useEffect, useState } from 'react';
import { GameState } from '../../engine/game-logic';

export default function BossRaidArena() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    // We try to catch cases where we are in a test environment and EventSource isn't mocked
    if (typeof window !== 'undefined' && !window.EventSource) {
      console.warn("EventSource is not defined. Skipping SSE connection.");
      return;
    }

    const eventSource = new EventSource('/api/arena/sse');
    
    eventSource.onmessage = (event) => {
      const state = JSON.parse(event.data);
      setGameState(state);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse"></div>
        <h1 className="text-3xl font-bold mb-4 z-10 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Boss Raid Arena</h1>
        <p className="text-xl animate-pulse text-gray-400 z-10">Connecting to Arena...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-8 md:p-16 max-w-4xl mx-auto relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900 rounded-full mix-blend-screen filter blur-[200px] opacity-10"></div>
      
      {/* Top Bar: Subtle Health Indicators */}
      <header className="flex justify-between items-center mb-16 z-10 relative">
        <div className="flex gap-4">
          {gameState.players.map((p, i) => (
            <div key={p.id} className="text-sm">
              <span className="font-bold text-gray-300">P{i + 1}</span>
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
          <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
             <div 
                className="h-full bg-red-600 transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.8)]"
                style={{ width: `${(gameState.boss.hp / gameState.boss.maxHp) * 100}%` }}
              />
          </div>
        </div>
      </header>

      {/* Main Content: Question (80% Focus) */}
      <main className="flex-1 mt-12 z-10 relative">
        <h1 className="text-3xl md:text-4xl font-semibold leading-relaxed mb-12 text-gray-100">
          Which of the following architectural patterns best describes the separation of the AI question generation from the live Boss Raid loop?
        </h1>
        
        <div className="space-y-4">
          {['Monolithic Pattern', 'Asynchronous Worker Queue', 'Server-Sent Events', 'Micro-frontends'].map((opt, i) => (
            <button 
              key={i}
              className="w-full text-left px-6 py-4 rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:border-red-500/50 hover:bg-gray-800 transition-all duration-200 text-lg group shadow-lg"
            >
              <span className="inline-block w-8 font-bold text-gray-500 group-hover:text-red-400 transition-colors">
                {String.fromCharCode(65 + i)}.
              </span>
              <span className="text-gray-200">{opt}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
