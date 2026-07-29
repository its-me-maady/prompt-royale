/**
 * <!-- agent-notes: { ctx: "P0 TDD red phase for Asynchronous Content Pipeline", deps: ["docs/test-strategy.md"], state: "active", last: "tara@2026-07-29" } -->
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app'; // Mocked or actual express/Next.js wrapper
import { llmService } from '../../src/services/llm';
import { workerService } from '../../src/services/worker';
import { db } from '../../src/db';

// Mock the external LLM provider as mandated by test strategy
vi.mock('../../src/services/llm', () => ({
  llmService: {
    generateQuestions: vi.fn(),
  },
}));

describe('Asynchronous Content Pipeline Integration Tests', () => {
  beforeEach(async () => {
    // Clean slate for every test
    vi.clearAllMocks();
    await db.jobs.clear();
  });

  it('should accept a PDF upload and return a pending Job ID', async () => {
    const response = await request(app)
      .post('/api/jobs/upload')
      .attach('file', Buffer.from('dummy pdf content'), 'test.pdf');

    expect(response.status).toBe(202); // 202 Accepted for async processing
    expect(response.body).toHaveProperty('jobId');
    expect(response.body).toHaveProperty('status', 'Pending');
  });

  it('worker should pull the job, call LLM for 10 MCQs, and update status to Complete', async () => {
    // Arrange: Create a pending job
    const jobId = await db.jobs.create({ status: 'Pending', file: 'test.pdf' });
    
    // Mock the LLM returning 10 MCQs
    const mockQuestions = Array(10).fill({
      question: 'What is the capital of France?',
      options: ['Paris', 'London', 'Berlin', 'Madrid'],
      answer: 'Paris'
    });
    vi.mocked(llmService.generateQuestions).mockResolvedValue(mockQuestions);

    // Act: Manually trigger the background worker for testing purposes
    await workerService.processPendingJobs();

    // Assert: The LLM service was called exactly once to generate the MCQs
    expect(llmService.generateQuestions).toHaveBeenCalledTimes(1);
    
    // Assert: The job status in the database was updated to Complete
    const updatedJob = await db.jobs.findById(jobId);
    expect(updatedJob.status).toBe('Complete');
    expect(updatedJob.result).toEqual(mockQuestions);
  });

  it('should allow polling the Job ID and return the generated Question Bank when complete', async () => {
    // Arrange: Pre-populate a completed job in the database
    const mockQuestions = Array(10).fill({
      question: 'Test Question?',
      options: ['A', 'B', 'C', 'D'],
      answer: 'A'
    });
    const jobId = await db.jobs.create({ status: 'Complete', result: mockQuestions });

    // Act: Poll the endpoint
    const response = await request(app).get(`/api/jobs/${jobId}`);

    // Assert: Validates the shape of the completed job payload
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'Complete');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveLength(10);
    expect(response.body.data).toEqual(mockQuestions);
  });
});
