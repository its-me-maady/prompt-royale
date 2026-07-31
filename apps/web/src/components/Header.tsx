import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
              Prompt Royale
            </Link>
          </div>
          <nav className="flex space-x-4">
            <Link href="/professor" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Professor
            </Link>
            <Link href="/prompt-lab" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Prompt Lab
            </Link>
            <Link href="/lobby" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Lobby
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
