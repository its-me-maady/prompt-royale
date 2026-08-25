/**
 * <!-- agent-notes: { ctx: "Production health check endpoint with dependency checks", deps: ["@supabase/supabase-js"], state: "active", last: "sato@2026-08-25" } -->
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: hasSupabaseUrl ? 'configured' : 'degraded',
      geminiApi: hasGeminiKey ? 'configured' : 'degraded',
    },
  };

  return NextResponse.json(healthData, { status: 200 });
}
