/**
 * <!-- agent-notes: { ctx: "Supabase SSR middleware session refresher and protector", deps: ["@supabase/ssr", "next/server"], state: "canonical", last: "sato@2026-08-31" } -->
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Safely retrieve user session JWT state
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // List of protected routes that require a valid session
  const isProtectedRoute =
    pathname.startsWith('/lobby') ||
    pathname.startsWith('/arena') ||
    pathname.startsWith('/professor') ||
    pathname.startsWith('/prompt-lab');

  if (!user && isProtectedRoute && !pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
