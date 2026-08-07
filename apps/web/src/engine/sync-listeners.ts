import { supabaseClient } from '../lib/db/supabase-client';
import { gameEvents } from './events';

export function initializeRealtimeSync(sessionId: string) {
  return supabaseClient
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'boss_raid_sessions',
        filter: 'id=eq.' + sessionId
      },
      (payload) => {
        gameEvents.emit('stateUpdate', { boss: { hp: payload.new.boss_hp } });
      }
    )
    .subscribe();
}
