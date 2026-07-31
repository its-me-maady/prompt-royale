'use client';
import { useState } from 'react';

export default function PromptLab() {
  const [courseId, setCourseId] = useState('');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async () => {
    setLoading(true);
    setError('');
    setResponse('');
    try {
      const token = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('supabase.auth.token') || 'dummy-token' : 'dummy-token';
      const res = await fetch('/api/lab/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ courseId, query }),
      });
      if (!res.ok) {
        let errorMsg = 'Failed to get answer';
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          // If it's not JSON, maybe it's an HTML error page from the server
          errorMsg = `Server error: ${res.status}`;
        }
        setError(errorMsg);
      } else {
        const data = await res.json();
        setResponse(data.response);
      }
    } catch (e) {
      setError('Network error. The AI might be taking a nap.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center p-8 font-sans text-gray-100 relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="z-10 max-w-3xl w-full mt-12 mb-8 text-center">
        <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 drop-shadow-sm">
          Prompt Lab
        </h1>
        <p className="text-lg text-gray-400">Query the master knowledge base and prepare for the Boss Raid.</p>
      </div>

      <div className="z-10 max-w-3xl w-full bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-800">
        <div className="mb-6">
          <label htmlFor="courseId" className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Course ID
          </label>
          <input
            id="courseId"
            type="text"
            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            placeholder="e.g. CS101"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="query" className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Your Question
          </label>
          <textarea 
            id="query"
            className="w-full h-32 p-4 bg-gray-800/50 border border-gray-700 text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-500"
            placeholder="Ask a synthesis question... e.g., 'Compare the algorithms in Lecture 1 and 4'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        
        <button 
          onClick={handleAsk}
          disabled={loading || !query.trim() || !courseId.trim()}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/50 transform hover:-translate-y-1"
        >
          {loading ? (
             <span className="flex items-center justify-center">
               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Synthesizing...
             </span>
          ) : 'Ask Knowledge Base'}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-800/50 rounded-xl text-red-400 text-center">
            {error}
          </div>
        )}
        
        {response && (
          <div className="mt-8 p-6 bg-gray-800/50 rounded-2xl border border-gray-700/50 shadow-inner">
            <h3 className="text-sm font-semibold text-purple-400 mb-4 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              AI Synthesis
            </h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}
