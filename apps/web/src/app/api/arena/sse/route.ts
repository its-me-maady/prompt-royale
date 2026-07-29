import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial state
      const initialState = JSON.stringify({
        boss: { hp: 1000, maxHp: 1000 },
        players: [
          { id: 'p1', hp: 100, status: 'alive' },
          { id: 'p2', hp: 100, status: 'alive' },
          { id: 'p3', hp: 100, status: 'alive' },
          { id: 'p4', hp: 100, status: 'alive' }
        ]
      });
      controller.enqueue(encoder.encode(`data: ${initialState}\n\n`));

      // Keep-alive ping
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(`event: ping\ndata: "keep-alive"\n\n`));
      }, 10000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
