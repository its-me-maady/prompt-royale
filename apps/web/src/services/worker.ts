import { db } from '../db';
import { llmService } from './llm';

export const workerService = {
  processPendingJobs: async () => {
    const pendingJobs = await db.jobs.findPending();
    for (const job of pendingJobs) {
      await db.jobs.update(job.id, { status: 'Processing' });
      try {
        const result = await llmService.generateQuestions(Buffer.from(''));
        await db.jobs.update(job.id, { status: 'Complete', result });
      } catch (e) {
        await db.jobs.update(job.id, { status: 'Failed' });
      }
    }
  }
};
