/**
 * <!-- agent-notes: { ctx: "Header component with live guest/auth session indicators", deps: ["@/utils/supabase/client", "next/navigation"], state: "canonical", last: "sato@2026-09-01" } -->
 */

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const supabaseClient = createClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        setUser(null);
      }
    };
    fetchSession();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  const navLinks = [
    { name: 'Professor', href: '/professor' },
    { name: 'Prompt Lab', href: '/prompt-lab' },
    { name: 'Lobby', href: '/lobby' },
  ];

  return (
    <header className="w-full bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-sm"
              >
                Prompt Royale
              </Link>
            </div>
            <nav aria-label="Main Navigation" className="flex space-x-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.name}
                    href={link.href} 
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                      isActive ? 'text-white bg-gray-800 shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400 font-mono">
                  {user.email || `Guest (${user.id.substring(0, 8)})`}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-900/50 hover:border-red-800 rounded-xl transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 border border-indigo-900/50 hover:border-indigo-800 rounded-xl transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
