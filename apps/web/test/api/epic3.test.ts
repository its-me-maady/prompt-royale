/**
 * <!-- agent-notes: { ctx: "P0 TDD red phase for Epic 3: Discord Lobby & Prompt Lab", deps: ["docs/test-strategy.md"], state: "active", last: "tara@2026-07-29" } -->
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
// These imports will fail because the implementation doesn't exist yet (Red Phase)
import { POST as CreateLobbyRoute } from '../../src/app/api/lobby/create/route';
import { POST as RestylePromptRoute } from '../../src/app/api/prompt-lab/restyle/route';
import { NextRequest } from 'next/server';
import { llmService } from '../../src/services/llm';

// Mocking the LLM Service as per our Test Strategy
vi.mock('../../src/services/llm', () => ({
  llmService: {
    generateQuestions: vi.fn(),
    restylePrompt: vi.fn(),
  },
}));

function createJsonRequest(body: any) {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

describe('Epic 3: Discord Lobby & Prompt Lab Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/lobby/create', () => {
    it('should create a new lobby and return a mock Discord Voice Channel invite link', async () => {
      const req = createJsonRequest({});
      const response = await CreateLobbyRoute(req);
      
      expect(response.status).toBe(200);
      const body = await response.json();
      
      expect(body).toHaveProperty('lobbyId');
      expect(typeof body.lobbyId).toBe('string');
      
      expect(body).toHaveProperty('inviteLink');
      expect(typeof body.inviteLink).toBe('string');
      expect(body.inviteLink).toContain('discord.gg/');
    });
  });

  describe('POST /api/prompt-lab/restyle', () => {
    it('should accept raw text notes and return an AI-generated restyled summary', async () => {
      const mockRestyledSummary = "This is a brilliantly restyled summary.";
      vi.mocked(llmService.restylePrompt).mockResolvedValue(mockRestyledSummary);

      const payload = { notes: "raw unstructured thoughts" };
      const req = createJsonRequest(payload);
      
      const response = await RestylePromptRoute(req);
      
      expect(response.status).toBe(200);
      const body = await response.json();
      
      expect(llmService.restylePrompt).toHaveBeenCalledTimes(1);
      expect(llmService.restylePrompt).toHaveBeenCalledWith("raw unstructured thoughts");
      
      expect(body).toHaveProperty('restyledSummary', mockRestyledSummary);
    });

    it('should return 400 if notes are missing from the request', async () => {
      const req = createJsonRequest({});
      const response = await RestylePromptRoute(req);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
    });

    it('should return 400 if notes are empty or whitespace', async () => {
      const req = createJsonRequest({ notes: "   " });
      const response = await RestylePromptRoute(req);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
    });
  });
});
