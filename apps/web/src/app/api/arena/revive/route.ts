import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '../../../../services/llm';
import { supabase } from '@/lib/db/supabase';

// Basic in-memory rate limiter for MVP
const rateLimit = new Map<string, number>();

export async function GET(req: NextRequest) {
  try {
    // 1. Rate Limiting (Simple IP-based for MVP)
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const lastRequest = rateLimit.get(ip) || 0;
    
    // 1 request per 5 seconds
    if (now - lastRequest < 5000) {
       return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    rateLimit.set(ip, now);

    const question = await llmService.generateReviveQuestion();
    return NextResponse.json(question);
  } catch (error: any) {
    console.error('LLM Generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
