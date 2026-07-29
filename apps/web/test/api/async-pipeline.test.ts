/**
 * <!-- agent-notes: { ctx: "P0 TDD red phase for Asynchronous Content Pipeline", deps: ["docs/test-strategy.md"], state: "active", last: "sato@2026-07-29" } -->
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as UploadRoute } from '../../src/app/api/jobs/upload/route';
import { GET as PollRoute } from '../../src/app/api/jobs/[id]/route';
import { NextRequest } from 'next/server';
import { llmService } from '../../src/services/llm';
import { workerService } from '../../src/services/worker';
import { db } from '../../src/db';

vi.mock('../../src/services/llm', () => ({
  llmService: {
    generateQuestions: vi.fn(),
  },
}));

function createFormDataRequest(filename: string, content: string, type: string) {
  const formData = new FormData();
  const blob = new Blob([content], { type });
  formData.append('file', blob, filename);
  
  return {
    formData: async () => formData,
  } as unknown as NextRequest;
}

describe('Asynchronous Content Pipeline Integration Tests (App Router)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await db.jobs.clear();
  });

  it('should accept a PDF upload and return a pending Job ID', async () => {
    const req = createFormDataRequest('test.pdf', 'dummy pdf', 'application/pdf');
    const response = await UploadRoute(req);
    
    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body).toHaveProperty('jobId');
    expect(body).toHaveProperty('status', 'Pending');
  });

  it('should reject non-PDF uploads', async () => {
    const req = createFormDataRequest('test.txt', 'dummy text', 'text/plain');
    const response = await UploadRoute(req);
    
    expect(response.status).toBe(415);
    const body = await response.json();
    expect(body.error).toBe('Only PDF files are allowed');
  });

  it('worker should pull the job, call LLM for 10 MCQs, and update status to Complete', async () => {
    const jobId = await db.jobs.create({ status: 'Pending', file: 'test.pdf' });
    
    const mockQuestions = Array(10).fill({
      question: 'Q?', options: ['A'], answer: 'A'
    });
    vi.mocked(llmService.generateQuestions).mockResolvedValue(mockQuestions);

    await workerService.processPendingJobs();

    expect(llmService.generateQuestions).toHaveBeenCalledTimes(1);
    
    const updatedJob = await db.jobs.findById(jobId);
    expect(updatedJob?.status).toBe('Complete');
    expect(updatedJob?.result).toEqual(mockQuestions);
  });

  it('should allow polling the Job ID and return the generated Question Bank when complete', async () => {
    const mockQuestions = Array(10).fill({ question: 'Q?' });
    const jobId = await db.jobs.create({ status: 'Complete', result: mockQuestions });

    // Mock NextRequest for GET
    const req = {} as NextRequest;
    const response = await PollRoute(req, { params: { id: jobId } });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('status', 'Complete');
    expect(body.data).toHaveLength(10);
  });
});
