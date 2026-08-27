/**
 * agent-notes: { ctx: "Squad Lobby page with real-time Supabase Presence slot sync and redirection", deps: ["apps/web/src/app/lobby/page.tsx", "apps/web/src/lib/db/supabase-client.ts"], state: "canonical", last: "sato@2026-08-25" }
 */
'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/db/supabase-client';

interface LobbyMember {
  playerId: string;
  name: string;
}

function LobbyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlLobbyId = searchParams.get('id');

  const [lobbyId, setLobbyId] = useState<string | null>(urlLobbyId);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [members, setMembers] = useState<LobbyMember[]>([]);
  const [playerId, setPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<any>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
          const { data, error } = await supabaseClient.auth.signInAnonymously();
          if (error) console.error('Auth login error:', error);
          if (data?.user) {
            setPlayerId(data.user.id.substring(0, 8));
          }
        } else {
          setPlayerId(session.user.id.substring(0, 8));
        }
      } catch (err) {
        setPlayerId(`p-${Math.floor(Math.random() * 1000)}`);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!lobbyId || !playerId) return;

    // Build invite link (safe URL check)
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    setInviteLink(`${base}/lobby?id=${lobbyId}`);

    // Join Presence Channel
    const channel = supabaseClient.channel(`lobby-${lobbyId}`);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const activeMembers: LobbyMember[] = Object.keys(presenceState)
          .map((id) => ({
            playerId: id,
            name: (presenceState[id]?.[0] as any)?.name || `Player ${id}`
          }))
          .sort((a, b) => a.playerId.localeCompare(b.playerId));

        setMembers(activeMembers);
        setIsHost(activeMembers[0]?.playerId === playerId);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: `Player ${playerId}`,
            online_at: new Date().toISOString()
          });
        }
      });

    // Listen to Database change on squads table to trigger automated redirect on start
    const squadsChannel = supabaseClient
      .channel(`lobby-squad-changes-${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'squads',
          filter: `id=eq.${lobbyId}`
        },
        (payload: any) => {
          if (payload.new && payload.new.status === 'active') {
            router.push(`/arena?squadId=${lobbyId}`);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      squadsChannel.unsubscribe();
    };
  }, [lobbyId, playerId, router]);

  const createLobby = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lobby/create', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLobbyId(data.lobbyId);
        router.replace(`/lobby?id=${data.lobbyId}`);
      } else {
        setError('Failed to create lobby. Please try again.');
      }
    } catch (e) {
      setError('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startRaid = async () => {
    if (!lobbyId || !isHost) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Create a squad record in Supabase database
      const { error: dbErr } = await supabaseClient.from('squads').insert({
        id: lobbyId,
        status: 'active',
        boss_hp: 1000,
        boss_max_hp: 1000
      });

      if (dbErr) throw dbErr;

      // 2. Insert squad members
      const memberInserts = members.map((m) => ({
        squad_id: lobbyId,
        player_id: m.playerId,
        name: m.name,
        hp: 100,
        status: 'alive'
      }));

      const { error: memErr } = await supabaseClient.from('squad_members').insert(memberInserts);
      if (memErr) throw memErr;

      // Navigate host immediately
      router.push(`/arena?squadId=${lobbyId}`);
    } catch (e: any) {
      setError(`Failed to initialize game: ${e.message || String(e)}`);
      setLoading(false);
    }
  };

  const isSafeLink = inviteLink.startsWith('http://') || inviteLink.startsWith('https://');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 font-sans text-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse"></div>

      <div className="z-10 max-w-md w-full text-center bg-slate-900/60 backdrop-blur-xl p-8 md:p-10 border border-slate-800 rounded-3xl shadow-2xl">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
          Squad Lobby
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Assemble your squad and prepare to defeat the course AI Boss.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200 text-xs">
            {error}
          </div>
        )}

        {!lobbyId ? (
          <button
            onClick={createLobby}
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? 'Creating Lobby...' : 'Create Lobby'}
          </button>
        ) : (
          <div className="space-y-6 text-left">
            {/* Share link panel */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-2">Share Invite Link</p>
              {isSafeLink ? (
                <a
                  href={inviteLink}
                  target="_blank"
                  rel="noreferrer"
                  className="block font-semibold text-slate-200 hover:text-indigo-400 underline text-sm break-all"
                >
                  {inviteLink}
                </a>
              ) : (
                <p className="text-red-400 text-sm">Invalid invite link configuration.</p>
              )}
            </div>

            {/* Presence members slot list */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Squad Members ({members.length} / 4)
              </p>
              <div className="grid grid-cols-1 gap-2">
                {[0, 1, 2, 3].map((idx) => {
                  const m = members[idx];
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        m
                          ? 'bg-slate-950/40 border-slate-800 text-slate-200'
                          : 'bg-slate-950/20 border-dashed border-slate-800/60 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs">{m ? '🛡️' : '⚪'}</span>
                        <span className="text-xs font-semibold">
                          {m ? m.name : 'Waiting for player...'}
                        </span>
                      </div>
                      {m && m.playerId === playerId && (
                        <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-700/50 text-[9px] text-indigo-300 rounded-full font-mono uppercase font-bold">
                          Me
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Launch action button */}
            {isHost ? (
              <button
                onClick={startRaid}
                disabled={loading || members.length === 0}
                className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Initializing...' : 'Start Raid'}
              </button>
            ) : (
              <div className="mt-4 p-3.5 bg-indigo-950/20 border border-indigo-900/50 rounded-xl text-center">
                <p className="text-xs text-indigo-400 font-medium animate-pulse">
                  ⚔️ Waiting for Squad Leader to start...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LobbyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
        <p className="animate-pulse text-indigo-400 font-medium">Loading Lobby...</p>
      </div>
    }>
      <LobbyInner />
    </Suspense>
  );
}
