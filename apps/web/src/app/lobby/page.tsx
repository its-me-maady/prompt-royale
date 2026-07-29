'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Lobby() {
  const router = useRouter();
  const [lobbyData, setLobbyData] = useState<{lobbyId: string, inviteLink: string} | null>(null);
  const [loading, setLoading] = useState(false);

  const createLobby = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lobby/create', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLobbyData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-md w-full text-center bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Squad Up</h1>
        <p className="text-gray-500 mb-8">Create a lobby and invite your friends via Discord to begin the Raid.</p>
        
        {!lobbyData ? (
          <button 
            onClick={createLobby}
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {loading ? 'Creating Lobby...' : 'Create Lobby'}
          </button>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-2">Lobby ID</p>
              <p className="font-mono text-lg text-gray-800">{lobbyData.lobbyId}</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-sm text-indigo-500 uppercase tracking-widest font-bold mb-2">Discord Invite</p>
              <a href={lobbyData.inviteLink} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 underline text-lg">
                {lobbyData.inviteLink}
              </a>
            </div>
            
            <button 
              onClick={() => router.push('/arena')}
              className="mt-6 w-full py-4 bg-gray-900 text-white rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all"
            >
              Start Raid
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
