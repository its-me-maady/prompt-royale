'use client';
import { useState } from 'react';

export default function PromptLab() {
  const [notes, setNotes] = useState('');
  const [restyled, setRestyled] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRestyle = async () => {
    setLoading(true);
    setError('');
    setRestyled('');
    try {
      const res = await fetch('/api/prompt-lab/restyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to restyle');
      } else {
        setRestyled(data.restyledSummary);
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-2xl w-full bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Prompt Lab</h1>
        <p className="text-gray-500 mb-8">Refine your study notes into powerful prompts to defeat the boss.</p>
        
        <textarea 
          className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-700"
          placeholder="Paste your raw, messy notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        
        <button 
          onClick={handleRestyle}
          disabled={loading || !notes.trim()}
          className="mt-6 w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Restyling...' : 'Restyle Notes'}
        </button>

        {error && <p className="text-red-500 mt-4">{error}</p>}
        
        {restyled && (
          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2">Restyled Output:</h3>
            <p className="text-blue-800 whitespace-pre-wrap">{restyled}</p>
          </div>
        )}
      </div>
    </div>
  );
}
