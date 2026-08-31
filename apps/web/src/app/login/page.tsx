/**
 * <!-- agent-notes: { ctx: "Login page component with guest and email/password authentication options", deps: ["@/lib/db/supabase-client.ts", "next/navigation"], state: "canonical", last: "sato@2026-08-31" } -->
 */

'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/db/supabase-client';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: authErr } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      if (authErr) throw authErr;

      const nextParam = searchParams.get('next');
      let target = '/lobby';
      if (nextParam && nextParam.startsWith('/')) {
        target = nextParam;
      }
      router.push(target);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
      setLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: authErr } = await supabaseClient.auth.signUp({
        email,
        password
      });
      if (authErr) throw authErr;
      setError('Registration successful! Please check your email or try signing in.');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up.');
    } finally {
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

      {/* Email Login Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
          />
        </div>

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={handleEmailSignUp}
            disabled={loading}
            className="flex-1 py-3 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            Sign Up
          </button>
        </div>
      </form>

      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-slate-800"></div>
        <span className="flex-shrink mx-4 text-slate-500 text-xs font-bold uppercase tracking-widest">or</span>
        <div className="flex-grow border-t border-slate-800"></div>
      </div>

      {/* Guest Login Option */}
      <div className="space-y-4">
        <button
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold transition-all border border-slate-700 disabled:opacity-50"
        >
          Enter as Guest
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
