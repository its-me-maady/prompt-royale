// agent-notes: { ctx: "API route for reviving wiped squad with taunting boss questions", deps: ["apps/web/src/services/llm.ts", "apps/web/src/services/rateLimiter.ts"], state: active, last: "sato@2026-09-01" }
import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '../../../../services/llm';
import { rateLimiter } from '../../../../services/rateLimiter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const key = `revive:${ip}`;
    
    // 1 request per 5 seconds
    const limitResult = await rateLimiter.checkRateLimit(key, 1, 5000);
    if (!limitResult.allowed) {
       return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const question = await llmService.generateReviveQuestion();
    return NextResponse.json(question);
  } catch (error: any) {
    console.error('LLM Generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
