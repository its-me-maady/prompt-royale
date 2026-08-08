/**
 * agent-notes: { ctx: "Student Prompt Lab UI", deps: [], state: "canonical", last: "sato@2026-08-05" }
 */
'use client';

import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/db/supabase-client';

export default function PromptLabPage() {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState<string[]>([]);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        await supabaseClient.auth.signInAnonymously();
      }
    };
    initAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setContext([]);
    setOutput('');

    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt.trim() })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setContext(data.sources || []);
      setOutput(data.answer || '');
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Prompt Lab
          </h1>
          <p className="text-slate-400 mt-2">Test your prompts against the Knowledge Base.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          <div className="flex flex-col gap-6">
            {/* Input Section */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-lg flex flex-col h-full">
              <h2 className="text-xl font-bold mb-4 text-slate-200">Input Prompt</h2>
              <form onSubmit={handleSubmit} className="flex flex-col h-full gap-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your prompt here..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[200px]"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !prompt.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Running...' : 'Run Prompt'}
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Context Section */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-lg flex-1 min-h-[200px]">
              <h2 className="text-xl font-bold mb-4 text-slate-200">Retrieved Context</h2>
              <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 h-[calc(100%-2rem)] overflow-y-auto">
                {context.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
                    {context.map((src, i) => (
                      <li key={i}>{src}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 italic">No context retrieved yet.</p>
                )}
              </div>
            </div>

            {/* Output Section */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-lg flex-1 min-h-[200px]">
              <h2 className="text-xl font-bold mb-4 text-slate-200">Output</h2>
              <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 h-[calc(100%-2rem)] overflow-y-auto whitespace-pre-wrap text-slate-200">
                {output ? (
                  output
                ) : (
                  <p className="text-slate-500 italic">Output will appear here.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
