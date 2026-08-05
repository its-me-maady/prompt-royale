import { NextResponse } from 'next/server';
import { llmService } from '../../../../services/llm';

export async function GET() {
  try {
    const question = await llmService.generateReviveQuestion();
    return NextResponse.json(question);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
