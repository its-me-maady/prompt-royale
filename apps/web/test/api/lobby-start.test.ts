/**
 * agent-notes: { ctx: "Unit tests for /api/lobby/start POST endpoint calling start_raid RPC", deps: ["apps/web/src/app/api/lobby/start/route.ts"], state: "canonical", last: "sato@2026-09-16" }
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../src/app/api/lobby/start/route';
import { supabase } from '../../src/lib/db/supabase';

vi.mock('../../src/lib/db/supabase', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

describe('POST /api/lobby/start', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when missing required parameters', async () => {
    const req = new Request('http://localhost:3000/api/lobby/start', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Missing or invalid parameters/i);
  });

  it('should return 400 when members array has fewer than 2 members', async () => {
    const req = new Request('http://localhost:3000/api/lobby/start', {
      method: 'POST',
      body: JSON.stringify({
        lobbyId: 'squad-123',
        hostId: 'p1',
        members: [{ playerId: 'p1', name: 'Player 1' }]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/at least 2 members are required/i);
  });

  it('should invoke start_raid RPC and return 200 on success', async () => {
    const mockRpcData = {
      squad_id: 'squad-123',
      status: 'active',
      host_player_id: 'p1',
      member_count: 2
    };

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: mockRpcData,
      error: null
    } as any);

    const req = new Request('http://localhost:3000/api/lobby/start', {
      method: 'POST',
      body: JSON.stringify({
        lobbyId: 'squad-123',
        hostId: 'p1',
        members: [
          { playerId: 'p1', name: 'Player 1' },
          { playerId: 'p2', name: 'Player 2' }
        ]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toMatch(/no-store/i);
    const data = await res.json();
    expect(data).toEqual(mockRpcData);

    expect(supabase.rpc).toHaveBeenCalledWith('start_raid', {
      target_squad_id: 'squad-123',
      host_id: 'p1',
      member_ids: ['p1', 'p2'],
      member_names: ['Player 1', 'Player 2']
    });
  });

  it('should return 500 when start_raid RPC fails', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection failed' }
    } as any);

    const req = new Request('http://localhost:3000/api/lobby/start', {
      method: 'POST',
      body: JSON.stringify({
        lobbyId: 'squad-123',
        hostId: 'p1',
        members: [
          { playerId: 'p1', name: 'Player 1' },
          { playerId: 'p2', name: 'Player 2' }
        ]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Database connection failed');
  });
});
