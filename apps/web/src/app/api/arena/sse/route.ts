import { NextRequest } from 'next/server';
import { gameEvents } from '../../../../engine/events';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const sendState = (state: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(state)}\n\n`));
      };

      // Send initial state
      const initialState = {
        boss: { hp: 1000, maxHp: 1000 },
        players: [
          { id: 'p1', hp: 100, status: 'alive' },
          { id: 'p2', hp: 100, status: 'alive' },
          { id: 'p3', hp: 100, status: 'alive' },
          { id: 'p4', hp: 100, status: 'alive' }
        ]
      };
      sendState(initialState);

      const onStateUpdate = (newState: any) => {
        sendState(newState);
      };

      gameEvents.on('stateUpdate', onStateUpdate);

      // Keep-alive ping
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(`event: ping\ndata: "keep-alive"\n\n`));
      }, 10000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        gameEvents.off('stateUpdate', onStateUpdate);
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
