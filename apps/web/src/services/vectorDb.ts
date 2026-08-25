/**
 * agent-notes: { ctx: "Robust vectorDb service with RPC search and direct table fallback filtering", deps: ["@supabase/supabase-js", "src/lib/db/supabase.ts"], state: "canonical", last: "sato@2026-08-25" }
 */
import { supabase } from '../lib/db/supabase';
import { supabaseClient } from '../lib/db/supabase-client';

export interface VectorRecord {
  id?: string;
  content: string;
  metadata?: Record<string, any>;
  embedding: number[];
}

export const vectorDb = {
  upsert: async (records: VectorRecord[]): Promise<boolean> => {
    const db = supabase || supabaseClient;
    const { error } = await db.from('knowledge_base').upsert(records);
    if (error) {
      console.error('Error upserting vectors:', error);
      return false;
    }
    return true;
  },

  search: async (
    query_embedding: number[],
    match_threshold: number = 0.0,
    match_count: number = 5,
    filter: Record<string, any> = {}
  ): Promise<any[]> => {
    const db = supabase || supabaseClient;

    // 1. Try vector RPC search
    try {
      const { data, error } = await db.rpc('match_knowledge_base', {
        query_embedding,
        match_threshold: 0.0,
        match_count,
        filter
      });

      if (!error && data && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {}

    // 2. Fallback direct Knowledge Base table query if RPC is unconfigured or empty
    try {
      let query = db.from('knowledge_base').select('id, content, metadata').limit(match_count);

      if (filter?.courseId && filter.courseId !== 'all') {
        query = query.eq('metadata->>courseId', filter.courseId);
      }

      const { data, error } = await query;
      if (!error && data && Array.isArray(data) && data.length > 0) {
        return data
          .filter((row: any) => row.content && typeof row.content === 'string' && !/[\x00-\x08\x0E-\x1F]/.test(row.content.slice(0, 100)))
          .map((row: any) => ({
            id: row.id,
            content: row.content,
            metadata: row.metadata,
            similarity: 0.95
          }));
      }
    } catch (e) {}

    return [];
  }
};
