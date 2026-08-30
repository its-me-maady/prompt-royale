/**
 * agent-notes: { ctx: "API route for database-authoritative Boss Raid round resolution", deps: ["apps/web/src/lib/db/supabase.ts"], state: "canonical", last: "sato@2026-08-25" }
 */
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db/supabase';

export async function POST(req: Request) {
  try {
    const { squadId, roundNumber } = await req.json();

    if (!squadId || roundNumber === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Call Postgres RPC resolver function
    const { data, error } = await supabase.rpc('resolve_raid_round', {
      target_squad_id: squadId,
      current_round: roundNumber
    });

    if (error) throw error;

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
    });
  } catch (error: any) {
    console.error('Error resolving round:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
    );
  }
}
