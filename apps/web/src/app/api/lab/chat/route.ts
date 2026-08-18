// agent-notes: { ctx: "Implementation of Prompt Lab RAG endpoint", deps: ["src/services/llm.ts", "src/lib/db/supabase.ts"], state: "active", last: "sato@2026-07-31" }
import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/services/llm';
import { supabase } from '@/lib/db/supabase';
import { z } from 'zod';

const chatSchema = z.object({
  query: z.string({ required_error: 'Missing query', invalid_type_error: 'Missing query' }).min(1, 'Missing query'),
  courseId: z.string({ required_error: 'Missing courseId', invalid_type_error: 'Missing courseId' }).min(1, 'Missing courseId'),
});

export async function POST(req: NextRequest) {
  try {
    // 0. Authentication check
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const result = chatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { query, courseId } = result.data;

    // 1. Query Expansion
    let expandedQueries;
    try {
      expandedQueries = await llmService.expandQuery(query);
    } catch (e) {
      console.error('Query expansion failed', e);
      return NextResponse.json({ error: 'Query expansion failed' }, { status: 500 });
    }

    // 2. Retrieval using expanded query text
    const query_text = expandedQueries.length > 0 ? expandedQueries.join(' ') : query;
    const { data: chunks, error } = await supabase.rpc('match_knowledge_base', {
      query_text,
      filter: { courseId },
    });

    if (error || !chunks) {
      console.error('Supabase retrieval failed', error);
      return NextResponse.json({ error: 'Retrieval failed' }, { status: 500 });
    }

    // 3. Synthesis Generation
    let synthesis;
    try {
      synthesis = await llmService.generateSynthesis(chunks, query);
    } catch (e) {
      console.error('Synthesis generation failed', e);
      return NextResponse.json({ error: 'Synthesis generation failed' }, { status: 500 });
    }

    return NextResponse.json({ response: synthesis }, { status: 200 });
  } catch (error) {
    console.error('Internal server error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
