'use client';

import { useState } from 'react';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify({ courseId, title }));

    try {
      const res = await fetch('/api/kb/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN || 'dev-token'}`
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Upload and processing successful!');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-8 bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-gray-100 flex items-center gap-2">
        <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Upload Course Material
      </h2>
      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label htmlFor="courseId" className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Course ID</label>
          <input
            id="courseId"
            type="text"
            required
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder-gray-500"
            placeholder="e.g. CS101"
          />
        </div>
        
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Lecture Title</label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder-gray-500"
            placeholder="e.g. Intro to Algorithms"
          />
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">File (Audio or PPT)</label>
          <input
            id="file"
            type="file"
            required
            accept="audio/*,.ppt,.pptx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-400
              file:mr-4 file:py-3 file:px-6
              file:rounded-xl file:border-0
              file:text-sm file:font-bold
              file:bg-purple-600/20 file:text-purple-400
              hover:file:bg-purple-600/30 file:transition-colors
              file:cursor-pointer cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/50 transform hover:-translate-y-1 mt-4"
        >
          {loading ? (
             <span className="flex items-center justify-center">
               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Processing...
             </span>
          ) : 'Upload and Process'}
        </button>
      </form>

      {message && (
        <div className={`mt-6 p-4 rounded-xl text-center font-medium border ${message.includes('Error') ? 'bg-red-900/30 border-red-800/50 text-red-400' : 'bg-green-900/30 border-green-800/50 text-green-400'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
