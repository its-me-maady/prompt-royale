import { db } from '../db';
import { llmService } from './llm';

export const workerService = {
  processPendingJobs: async () => {
    let job;
    // Atomically fetches and locks the next pending job
    while ((job = await db.jobs.findAndLockNextPending()) !== null) {
      try {
        const result = await llmService.generateQuestions(Buffer.from(''));
        await db.jobs.update(job.id, { status: 'Complete', result });
      } catch (e) {
        await db.jobs.update(job.id, { status: 'Failed' });
      }
    }
  }
};
