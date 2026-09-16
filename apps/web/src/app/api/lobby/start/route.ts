/**
 * agent-notes: { ctx: "API route for atomic server-side start_raid RPC execution", deps: ["apps/web/src/lib/db/supabase.ts"], state: "canonical", last: "sato@2026-09-16" }
 */
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db/supabase';

export async function POST(req: Request) {
  try {
    const { lobbyId, hostId, members } = await req.json();

    if (!lobbyId || !hostId || !Array.isArray(members) || members.length < 2) {
      return NextResponse.json(
        { error: 'Missing or invalid parameters: lobbyId, hostId, and at least 2 members are required' },
        { status: 400, headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
      );
    }

    const memberIds = members.map((m: any) => m.playerId);
    const memberNames = members.map((m: any) => m.name || `Player ${m.playerId}`);

    // Call Postgres RPC start_raid function running as SECURITY DEFINER
    const { data, error } = await supabase.rpc('start_raid', {
      target_squad_id: lobbyId,
      host_id: hostId,
      member_ids: memberIds,
      member_names: memberNames
    });

    if (error) throw error;

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
    });
  } catch (error: any) {
    console.error('Error starting raid:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start raid' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
    );
  }
}
