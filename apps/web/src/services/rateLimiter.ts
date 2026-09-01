// agent-notes: { ctx: "Supabase-backed distributed rate limiter service with in-memory fallback", deps: ["src/lib/db/supabase", "src/lib/db/supabase-client"], state: active, last: "sato@2026-09-01" }
import { supabase } from '../lib/db/supabase';
import { supabaseClient } from '../lib/db/supabase-client';

const fallbackStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = {
  resetFallbackStore: () => {
    fallbackStore.clear();
  },

  checkRateLimit: async (
    key: string,
    maxRequests: number = 10,
    windowMs: number = 60000
  ): Promise<{ allowed: boolean; retryAfter: number }> => {
    const now = Date.now();
    const db = supabase || supabaseClient;

    try {
      const { data, error } = await db
        .from('rate_limits')
        .select('*')
        .eq('key', key)
        .single();

      if (!error && data) {
        if (now > Number(data.reset_time)) {
          const resetTime = now + windowMs;
          await db.from('rate_limits').upsert({ key, count: 1, reset_time: resetTime });
          return { allowed: true, retryAfter: 0 };
        }

        if (data.count >= maxRequests) {
          const retryAfter = Math.ceil((Number(data.reset_time) - now) / 1000);
          return { allowed: false, retryAfter: Math.max(1, retryAfter) };
        }

        await db.from('rate_limits').upsert({
          key,
          count: data.count + 1,
          reset_time: data.reset_time
        });
        return { allowed: true, retryAfter: 0 };
      }

      // Record not found in DB
      const resetTime = now + windowMs;
      const { error: upsertErr } = await db.from('rate_limits').upsert({
        key,
        count: 1,
        reset_time: resetTime
      });

      if (!upsertErr) {
        return { allowed: true, retryAfter: 0 };
      }
    } catch (e) {
      // Fall through to in-memory store if DB query fails or unconfigured
    }

    // In-memory fallback for offline/test environments
    const record = fallbackStore.get(key);
    if (!record || now > record.resetTime) {
      fallbackStore.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, retryAfter: 0 };
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return { allowed: false, retryAfter: Math.max(1, retryAfter) };
    }

    record.count += 1;
    fallbackStore.set(key, record);
    return { allowed: true, retryAfter: 0 };
  }
};
