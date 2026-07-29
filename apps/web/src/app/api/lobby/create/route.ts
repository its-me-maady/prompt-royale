import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const lobbyId = randomUUID();
  // Mock Discord invite generation
  const inviteLink = `https://discord.gg/${lobbyId.substring(0, 8)}`;

  return NextResponse.json({
    lobbyId,
    inviteLink
  }, { status: 200 });
}
