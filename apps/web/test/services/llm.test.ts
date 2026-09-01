// agent-notes: { ctx: "Unit tests for llmService grounded quiz generation and fallback logic", deps: ["apps/web/src/services/llm.ts"], state: active, last: "sato@2026-09-01" }
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { llmService } from '../../src/services/llm';

describe('llmService.generateQuizQuestion', () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
  });

  it('should return null when empty chunks array is provided', async () => {
    const result = await llmService.generateQuizQuestion([], 'CS101');
    expect(result).toBeNull();
  });

  it('should generate a question derived from provided knowledge chunks using fallback when no API key is present', async () => {
    const chunks = [
      { content: 'Photosynthesis converts light energy into chemical energy stored in glucose.' }
    ];
    const result = await llmService.generateQuizQuestion(chunks, 'BIO101');
    expect(result).not.toBeNull();
    expect(result?.question).toContain('Photosynthesis converts light');
    expect(result?.options).toHaveLength(4);
    expect(result?.correctIndex).toBe(0);
  });

  it('should parse LLM JSON response when Gemini API key is present and returns valid JSON', async () => {
    process.env.GEMINI_API_KEY = 'mock-key';

    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  question: 'What energy form is produced in photosynthesis?',
                  options: ['Chemical energy in glucose', 'Kinetic energy', 'Thermal energy', 'Nuclear energy'],
                  correctIndex: 0
                })
              }
            ]
          }
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const chunks = [{ content: 'Photosynthesis produces chemical energy.' }];
    const result = await llmService.generateQuizQuestion(chunks, 'BIO101');

    expect(result?.question).toBe('What energy form is produced in photosynthesis?');
    expect(result?.options[0]).toBe('Chemical energy in glucose');
    expect(result?.correctIndex).toBe(0);
  });
});
