/**
 * agent-notes: { ctx: "P0 TDD red phase, Epic B Prompt Lab RAG", deps: ["apps/web/src/engine/rag.ts"], state: "canonical", last: "tara@2026-08-05", key: ["owns RAG engine tests"] }
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processRagQuery, RagDependencies } from '../../src/engine/rag';

describe('RAG Engine', () => {
  let mockDeps: RagDependencies;

  beforeEach(() => {
    mockDeps = {
      retrieveEmbeddings: vi.fn(),
      generateLlmResponse: vi.fn(),
    };
  });

  describe('processRagQuery', () => {
    it('successfully processes a valid query by retrieving context and generating a response', async () => {
      const mockDocs = [
        { id: 'doc1', content: 'The mitochondria is the powerhouse of the cell.', score: 0.95 }
      ];
      vi.mocked(mockDeps.retrieveEmbeddings).mockResolvedValue(mockDocs);
      vi.mocked(mockDeps.generateLlmResponse).mockResolvedValue('The mitochondria is the powerhouse of the cell, according to biology.');

      const response = await processRagQuery('What is the powerhouse of the cell?', mockDeps);

      expect(mockDeps.retrieveEmbeddings).toHaveBeenCalledWith('What is the powerhouse of the cell?');
      expect(mockDeps.generateLlmResponse).toHaveBeenCalled();
      
      const promptArg = vi.mocked(mockDeps.generateLlmResponse).mock.calls[0][0];
      expect(promptArg).toContain('What is the powerhouse of the cell?');
      expect(promptArg).toContain('The mitochondria is the powerhouse of the cell.');

      expect(response).toEqual({
        answer: 'The mitochondria is the powerhouse of the cell, according to biology.',
        sources: ['doc1']
      });
    });

    it('throws an error if the query is empty or whitespace', async () => {
      await expect(processRagQuery('   ', mockDeps)).rejects.toThrow('Query cannot be empty');
      expect(mockDeps.retrieveEmbeddings).not.toHaveBeenCalled();
    });

    it('handles cases where no relevant context is found', async () => {
      vi.mocked(mockDeps.retrieveEmbeddings).mockResolvedValue([]);
      vi.mocked(mockDeps.generateLlmResponse).mockResolvedValue('I do not have enough context to answer that.');

      const response = await processRagQuery('What is string theory?', mockDeps);

      expect(mockDeps.retrieveEmbeddings).toHaveBeenCalledWith('What is string theory?');
      expect(mockDeps.generateLlmResponse).toHaveBeenCalled();
      
      const promptArg = vi.mocked(mockDeps.generateLlmResponse).mock.calls[0][0];
      expect(promptArg).toContain('What is string theory?');

      expect(response).toEqual({
        answer: 'I do not have enough context to answer that.',
        sources: []
      });
    });

    it('throws an error if the LLM generation fails', async () => {
      const mockDocs = [
        { id: 'doc1', content: 'Some context.', score: 0.9 }
      ];
      vi.mocked(mockDeps.retrieveEmbeddings).mockResolvedValue(mockDocs);
      vi.mocked(mockDeps.generateLlmResponse).mockRejectedValue(new Error('LLM API timeout'));

      await expect(processRagQuery('What is this?', mockDeps)).rejects.toThrow('LLM API timeout');
    });

    it('truncates context if retrieved documents exceed the character/token limit', async () => {
      const longContext = 'A'.repeat(5000);
      const mockDocs = [
        { id: 'doc1', content: longContext, score: 0.9 }
      ];
      vi.mocked(mockDeps.retrieveEmbeddings).mockResolvedValue(mockDocs);
      vi.mocked(mockDeps.generateLlmResponse).mockResolvedValue('Short answer.');

      const options = { maxContextLength: 1000 };
      
      await processRagQuery('Query', mockDeps, options);

      const promptArg = vi.mocked(mockDeps.generateLlmResponse).mock.calls[0][0];
      expect(promptArg.length).toBeLessThan(longContext.length + 100);
      expect(promptArg).toContain('A'.repeat(990)); 
    });
  });
});
