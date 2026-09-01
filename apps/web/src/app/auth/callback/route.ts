/**
 * agent-notes: { ctx: "Auth PKCE exchange route handler for email confirmation and magic links", deps: ["apps/web/src/utils/supabase/server.ts", "next/server"], state: "canonical", last: "sato@2026-09-01" }
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/lobby';

  if (code) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        const target = next.startsWith('/') ? next : '/lobby';
        const redirectedUrl = new URL(target, requestUrl.origin);
        return NextResponse.redirect(redirectedUrl);
      }
    } catch (err) {
      console.error('Auth callback exchange failed:', err);
    }
  }

  const errorUrl = new URL('/login?error=verification_failed', requestUrl.origin);
  return NextResponse.redirect(errorUrl);
}
