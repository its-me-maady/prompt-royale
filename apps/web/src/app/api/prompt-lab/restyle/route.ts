import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '../../../../services/llm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const notes = body.notes;

    if (!notes || typeof notes !== 'string' || notes.trim() === '') {
      return NextResponse.json({ error: 'Notes are required' }, { status: 400 });
    }

    const restyledSummary = await llmService.restylePrompt(notes);

    return NextResponse.json({
      restyledSummary
    }, { status: 200 });
  } catch (error) {
    // If the request body is empty, req.json() will throw
    return NextResponse.json({ error: 'Invalid JSON body or missing notes' }, { status: 400 });
  }
}
