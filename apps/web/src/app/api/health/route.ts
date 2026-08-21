/**
 * agent-notes: { ctx: "Health check endpoint for deployment validation", deps: [], state: "canonical", last: "agent@2026-08-21" }
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
