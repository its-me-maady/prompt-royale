type JobStatus = 'Pending' | 'Processing' | 'Complete' | 'Failed';

interface Job {
  id: string;
  status: JobStatus;
  file?: string;
  result?: any;
}

class Database {
  private _jobs: Map<string, Job> = new Map();

  jobs = {
    clear: async () => {
      this._jobs.clear();
    },
    create: async (data: Partial<Job>) => {
      const id = Math.random().toString(36).substring(7);
      const job: Job = {
        id,
        status: data.status || 'Pending',
        file: data.file,
        result: data.result,
      };
      this._jobs.set(id, job);
      return id;
    },
    findById: async (id: string) => {
      return this._jobs.get(id) || null;
    },
    update: async (id: string, data: Partial<Job>) => {
      const job = this._jobs.get(id);
      if (job) {
        Object.assign(job, data);
      }
    },
    findPending: async () => {
      return Array.from(this._jobs.values()).filter(j => j.status === 'Pending');
    }
  }
}

export const db = new Database();
