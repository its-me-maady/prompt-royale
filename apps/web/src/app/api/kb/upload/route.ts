import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/ai/groq';
import { parseDocument } from '@/lib/ai/llamaparse';
import { generateEmbeddings } from '@/lib/ai/openai';
import { supabase } from '@/lib/db/supabase';
import { z } from 'zod';

const metadataSchema = z.object({
  courseId: z.string().min(1).max(50),
  title: z.string().min(1).max(200)
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;
    const metadataRaw = formData.get('metadata') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileType = file.type;
    const isAudio = fileType.startsWith('audio/');
    const isPpt = fileType === 'application/vnd.ms-powerpoint' || fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

    if (!isAudio && !isPpt) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // 2. Zod Validation
    let metadata;
    try {
      const parsed = JSON.parse(metadataRaw || '{}');
      metadata = metadataSchema.parse(parsed);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid metadata schema' }, { status: 400 });
    }

    let extractedText = '';

    try {
      if (isAudio) {
        extractedText = await transcribeAudio(file);
      } else if (isPpt) {
        extractedText = await parseDocument(file);
      }
    } catch (error) {
      console.error('Extraction failed:', error);
      return NextResponse.json({ error: 'External API processing failed' }, { status: 500 });
    }

    // Generate embeddings
    let embeddings: { content: string; embedding: number[] }[] = [];
    try {
      embeddings = await generateEmbeddings(extractedText);
    } catch (e) {
      console.error('Embeddings failed:', e);
      return NextResponse.json({ error: 'Embeddings failed' }, { status: 500 });
    }

    // 3. Bulk Insert Fix
    const recordsToInsert = embeddings.map(chunk => ({
      content: chunk.content,
      embedding: chunk.embedding,
      metadata: metadata
    }));

    if (recordsToInsert.length > 0) {
      const { error } = await supabase.from('knowledge_base').insert(recordsToInsert);

      if (error) {
        console.error('Supabase insert error', error);
        return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
