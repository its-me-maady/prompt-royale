import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 font-sans text-gray-100 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-700 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-700 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900 rounded-full mix-blend-screen filter blur-[200px] opacity-10"></div>

      <main className="z-10 flex flex-col items-center max-w-5xl w-full">
        <h1 className="text-6xl md:text-7xl font-extrabold mb-6 text-center tracking-tight">
          Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400">PromptRoyale</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 mb-16 text-center max-w-2xl leading-relaxed">
          The Gamified AI Study & Quiz Arena. Form squads, debate answers, and defeat AI Bosses using your course knowledge.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {/* Professor Portal Card */}
          <Link href="/professor" className="group relative bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 hover:bg-gray-800/80 hover:border-purple-500/50 transition-all duration-300 shadow-2xl hover:shadow-purple-500/20 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-3 group-hover:text-purple-300 transition-colors">Professor Portal</h2>
            <p className="text-gray-400 leading-relaxed">Upload course materials to generate the master knowledge base for your students.</p>
          </Link>

          {/* Prompt Lab Card */}
          <Link href="/prompt-lab" className="group relative bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 hover:bg-gray-800/80 hover:border-indigo-500/50 transition-all duration-300 shadow-2xl hover:shadow-indigo-500/20 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-3 group-hover:text-indigo-300 transition-colors">Prompt Lab</h2>
            <p className="text-gray-400 leading-relaxed">Interact with the AI using Retrieval-Augmented Generation to master the course content.</p>
          </Link>

          {/* Boss Raid Arena Card */}
          <Link href="/lobby" className="group relative bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 hover:bg-gray-800/80 hover:border-red-500/50 transition-all duration-300 shadow-2xl hover:shadow-red-500/20 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-3 group-hover:text-red-300 transition-colors">Boss Raid Arena</h2>
            <p className="text-gray-400 leading-relaxed">Squad up, test your knowledge, and defeat the AI boss in a time-pressure arena.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
