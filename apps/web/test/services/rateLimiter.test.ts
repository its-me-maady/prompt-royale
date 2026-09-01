// agent-notes: { ctx: "Unit tests for rateLimiter distributed service and fallback behavior", deps: ["apps/web/src/services/rateLimiter.ts"], state: active, last: "sato@2026-09-01" }
import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimiter } from '../../src/services/rateLimiter';

describe('rateLimiter service', () => {
  beforeEach(() => {
    rateLimiter.resetFallbackStore();
  });

  it('should allow requests within limit threshold', async () => {
    const result1 = await rateLimiter.checkRateLimit('test-key-1', 2, 60000);
    expect(result1.allowed).toBe(true);

    const result2 = await rateLimiter.checkRateLimit('test-key-1', 2, 60000);
    expect(result2.allowed).toBe(true);
  });

  it('should block requests exceeding limit threshold', async () => {
    await rateLimiter.checkRateLimit('test-key-2', 2, 60000);
    await rateLimiter.checkRateLimit('test-key-2', 2, 60000);

    const result3 = await rateLimiter.checkRateLimit('test-key-2', 2, 60000);
    expect(result3.allowed).toBe(false);
    expect(result3.retryAfter).toBeGreaterThan(0);
  });
});
