/**
 * agent-notes: { ctx: "API route for player vote submission inside the Boss Raid Arena", deps: ["apps/web/src/lib/db/supabase.ts"], state: "canonical", last: "sato@2026-08-25" }
 */
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db/supabase';

export async function POST(req: Request) {
  try {
    const { squadId, playerId, roundNumber, isCorrect } = await req.json();

    if (!squadId || !playerId || roundNumber === undefined || isCorrect === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const { error } = await supabase
      .from('squad_votes')
      .upsert({
        squad_id: squadId,
        player_id: playerId,
        round_number: roundNumber,
        is_correct: isCorrect
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error submitting vote:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
