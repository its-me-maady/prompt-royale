/**
 * agent-notes: { ctx: "Deprecated plain Supabase client - DO NOT use for auth, use @/utils/supabase/client for cookie-based auth", deps: ["@supabase/supabase-js"], state: "deprecated-for-auth", last: "sato@2026-09-01" }
 * @deprecated DO NOT use supabaseClient for authentication or session operations.
 * It persists state to localStorage only, which is invisible to Next.js middleware and server routes.
 * Use `createClient()` from `@/utils/supabase/client` instead.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key_for_mock_ui';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
