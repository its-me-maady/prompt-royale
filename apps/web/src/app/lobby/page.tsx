'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Lobby() {
  const [lobbyData, setLobbyData] = useState<{lobbyId: string, inviteLink: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLobby = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lobby/create', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLobbyData(data);
      } else {
        setError('Failed to create lobby. Please try again.');
      }
    } catch (e) {
      setError('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Basic XSS prevention for the invite link
  const isSafeLink = lobbyData?.inviteLink?.startsWith('http://') || lobbyData?.inviteLink?.startsWith('https://');
  const safeInviteLink = isSafeLink ? lobbyData?.inviteLink ?? '#' : '#';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 font-sans text-gray-100 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse"></div>

      <div className="z-10 max-w-md w-full text-center bg-gray-900/60 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-gray-800">
        <h1 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Squad Lobby</h1>
        <p className="text-gray-400 mb-8">Create a lobby and invite your friends via Discord to begin the Raid.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-xl text-red-200">
            {error}
          </div>
        )}
        
        {!lobbyData ? (
          <button 
            onClick={createLobby}
            disabled={loading}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-red-600/30"
          >
            {loading ? 'Creating Lobby...' : 'Create Lobby'}
          </button>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-gray-950/50 rounded-xl border border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Lobby ID</p>
              <p className="font-mono text-xl text-gray-200">{lobbyData.lobbyId}</p>
            </div>
            <div className="p-4 bg-red-950/30 rounded-xl border border-red-900/50">
              <p className="text-xs text-red-500 uppercase tracking-widest font-bold mb-2">Discord Invite</p>
              {isSafeLink ? (
                <a href={safeInviteLink} target="_blank" rel="noreferrer" className="font-semibold text-red-400 hover:text-red-300 underline text-lg transition-colors">
                  {safeInviteLink}
                </a>
              ) : (
                <p className="text-red-500 font-semibold text-lg">Invalid invite link provided by server.</p>
              )}
            </div>
            
            <Link 
              href="/arena"
              className="mt-6 block w-full py-4 bg-gray-100 text-gray-900 rounded-xl font-bold text-lg hover:bg-white transition-all shadow-lg text-center"
            >
              Start Raid
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
