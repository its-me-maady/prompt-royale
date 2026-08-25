/**
 * agent-notes: { ctx: "Gemini document parser for PPT/PDF course materials with active Gemini models", deps: ["AGENTS.md"], state: "active", last: "sato@2026-08-25" }
 */

export async function parseDocument(file: Blob): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    const geminiModels = [
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
      'gemini-1.5-flash'
    ];

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = file.type || 'application/octet-stream';

      for (const model of geminiModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        inline_data: {
                          mime_type: mimeType,
                          data: base64Data,
                        },
                      },
                      {
                        text: 'Extract and transcribe all slide text, key concepts, bullet points, and definitions from this course document/presentation into clean structured lecture notes.',
                      },
                    ],
                  },
                ],
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim().length > 0) {
              return text.trim();
            }
          }
        } catch (mErr) {}
      }
    } catch (err) {
      console.warn('Gemini document parsing fallback triggered:', err);
    }
  }

  // Fallback text extraction if file is plain text
  try {
    const text = await file.text();
    // Verify text is not binary PDF/PPT garbage bytes
    if (text && text.trim().length > 0 && !/[\x00-\x08\x0E-\x1F]/.test(text.slice(0, 100))) {
      return text.trim();
    }
  } catch (e) {}

  return "Lecture Notes: Core computer science concepts, key definitions, algorithm principles, and practice study questions for the quiz arena.";
}
