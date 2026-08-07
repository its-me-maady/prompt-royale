import React from 'react';
import { PlayerVote } from '../engine/game-logic';

interface ReviveModalProps {
  question: { question: string; options: string[]; correctIndex: number };
  timeLeft: number;
  myVote: number | null;
  onVote: (index: number) => void;
  votesCount: number;
  totalPlayers: number;
}

export function ReviveModal({
  question,
  timeLeft,
  myVote,
  onVote,
  votesCount,
  totalPlayers
}: ReviveModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0 bg-red-900/20 mix-blend-screen filter blur-[100px] animate-pulse"></div>
      
      <div className="relative z-10 w-full max-w-2xl bg-gray-950 border border-orange-500/50 rounded-2xl shadow-[0_0_50px_rgba(249,115,22,0.15)] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-900/50 to-red-900/50 px-6 py-4 border-b border-orange-500/30 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <h2 className="text-xl font-bold text-orange-400 tracking-widest uppercase text-shadow-sm">System Failure: Revive Sequence</h2>
          </div>
          <span className={`text-2xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]' : 'text-gray-300'}`}>
            00:{timeLeft.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-gray-400 mb-6 text-sm uppercase tracking-wider text-center">
            Answer correctly to reboot the squad. One mistake means permanent wipe.
          </p>
          
          <h3 className="text-xl md:text-2xl font-semibold leading-relaxed mb-8 text-gray-100 text-center">
            {question.question}
          </h3>
          
          <div className="space-y-4">
            {question.options.map((opt, i) => (
              <button 
                key={i}
                onClick={() => onVote(i)}
                disabled={myVote !== null}
                className={`w-full text-left px-6 py-4 rounded-xl border transition-all duration-200 text-lg group ${
                  myVote === i 
                    ? 'bg-orange-900/40 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                    : myVote !== null
                    ? 'bg-gray-900/30 border-gray-800 opacity-50'
                    : 'border-orange-900/50 bg-gray-900/50 backdrop-blur-sm hover:border-orange-500 hover:bg-gray-800 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                }`}
              >
                <span className={`inline-block w-8 font-bold transition-colors ${myVote === i ? 'text-orange-400' : 'text-orange-700 group-hover:text-orange-400'}`}>
                  {String.fromCharCode(65 + i)}.
                </span>
                <span className={myVote === i ? 'text-white' : 'text-gray-200'}>{opt}</span>
              </button>
            ))}
          </div>
          
          <div className="mt-8 flex justify-center text-sm font-mono text-orange-500/70">
            Votes locked: {votesCount} / {totalPlayers}
          </div>
        </div>
      </div>
    </div>
  );
}
