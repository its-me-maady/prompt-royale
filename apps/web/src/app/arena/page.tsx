'use client';
import { useEffect, useState } from 'react';
import { GameState } from '../../../../engine/game-logic';

export default function BossRaidArena() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800 font-sans">
        <p className="text-xl animate-pulse">Connecting to Arena...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans p-8 md:p-16 max-w-4xl mx-auto">
      {/* Top Bar: Subtle Health Indicators */}
      <header className="flex justify-between items-center mb-16 opacity-70">
        <div className="flex gap-4">
          {gameState.players.map((p, i) => (
            <div key={p.id} className="text-sm">
              <span className="font-semibold">P{i + 1}</span>
              <div className="w-16 h-1 bg-gray-200 mt-1 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${p.hp > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${(p.hp / 100) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-red-500 font-bold mb-1">Boss</p>
          <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
             <div 
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${(gameState.boss.hp / gameState.boss.maxHp) * 100}%` }}
              />
          </div>
        </div>
      </header>

      {/* Main Content: Question (80% Focus) */}
      <main className="flex-1 mt-12">
        <h1 className="text-3xl md:text-4xl font-semibold leading-relaxed mb-12">
          Which of the following architectural patterns best describes the separation of the AI question generation from the live Boss Raid loop?
        </h1>
        
        <div className="space-y-4">
          {['Monolithic Pattern', 'Asynchronous Worker Queue', 'Server-Sent Events', 'Micro-frontends'].map((opt, i) => (
            <button 
              key={i}
              className="w-full text-left px-6 py-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 text-lg group"
            >
              <span className="inline-block w-8 font-medium text-gray-400 group-hover:text-gray-600">
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
