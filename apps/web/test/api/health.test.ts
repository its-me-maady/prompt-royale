/**
 * <!-- agent-notes: { ctx: "Health check API integration test", deps: ["apps/web/src/app/api/health/route.ts"], state: "active", last: "tara@2026-08-25" } -->
 */

import { describe, it, expect } from 'vitest';
import { GET as HealthRoute } from '../../src/app/api/health/route';

describe('/api/health Route Tests', () => {
  it('should return 200 with status ok and component health metrics', async () => {
    const response = await HealthRoute();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('version');
    expect(body.checks).toHaveProperty('database');
    expect(body.checks).toHaveProperty('geminiApi');
  });
});
