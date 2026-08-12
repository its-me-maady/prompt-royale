/**
 * agent-notes: { ctx: "P0 principal SDE, TDD green phase", deps: ["@supabase/supabase-js"], state: "canonical", last: "sato@2026-08-08" }
 */
import { supabaseClient } from '../lib/db/supabase-client';

export interface VectorRecord {
  id?: string;
  content: string;
  metadata?: Record<string, any>;
  embedding: number[];
}

export const vectorDb = {
  upsert: async (records: VectorRecord[]): Promise<boolean> => {
    const { error } = await supabaseClient
      .from('knowledge_base')
      .upsert(records);
      
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
    try {
      const { data, error } = await supabaseClient
        .rpc('match_knowledge_base', {
          query_embedding,
          match_threshold,
          match_count,
          filter
        });

      if (error) {
        if (typeof error.message === 'string' && !error.message.includes('fetch failed')) {
          console.warn('Vector search warning:', error.message);
        }
        return [];
      }
      return data || [];
    } catch (err: any) {
      console.warn('[Dev Mode] Database offline (127.0.0.1:54321) - returning empty vector context.');
      return [];
    }
  }
};
