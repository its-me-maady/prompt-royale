/**
 * <!-- agent-notes: { ctx: "Login page component with guest auth triggers", deps: ["@/lib/db/supabase-client.ts", "next/navigation"], state: "canonical", last: "sato@2026-08-31" } -->
 */

'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/db/supabase-client';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: authErr } = await supabaseClient.auth.signInAnonymously();
      if (authErr) throw authErr;

      const nextParam = searchParams.get('next');
      let target = '/lobby';
      
      // Sanitization: Ensure redirection target is safe
      if (nextParam && nextParam.startsWith('/')) {
        target = nextParam;
      }
      
      router.push(target);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
      setLoading(false);
    }
  };

  return (
    <div className="z-10 max-w-md w-full text-center bg-slate-900/60 backdrop-blur-xl p-8 md:p-10 border border-slate-800 rounded-3xl shadow-2xl">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
        PromptRoyale
      </h1>
      <p className="text-sm text-slate-400 mb-8">
        Edge Authentication & Secure AI Battle Arena
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200 text-xs">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-left">
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-2">Anonymous Guest Entry</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Students can enter the study room instantly. Your guest progress is preserved within this browser session cookie.
          </p>
        </div>

        <button
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          {loading ? 'Entering...' : 'Enter Arena'}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 font-sans text-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse"></div>
      
      <Suspense fallback={
        <div className="z-10 max-w-md w-full text-center bg-slate-900/60 backdrop-blur-xl p-8 md:p-10 border border-slate-800 rounded-3xl shadow-2xl animate-pulse">
          <div className="h-8 bg-slate-800 rounded-lg w-1/2 mx-auto mb-4"></div>
          <div className="h-4 bg-slate-800 rounded-lg w-3/4 mx-auto mb-8"></div>
          <div className="h-16 bg-slate-800 rounded-xl mb-6"></div>
          <div className="h-12 bg-slate-800 rounded-xl"></div>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
