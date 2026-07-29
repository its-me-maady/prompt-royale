import express from 'express';
import multer from 'multer';
import { db } from './db';

export const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

app.post('/api/jobs/upload', upload.single('file'), async (req, res) => {
  const jobId = await db.jobs.create({ status: 'Pending', file: req.file?.originalname });
  res.status(202).json({ jobId, status: 'Pending' });
});

app.get('/api/jobs/:id', async (req, res) => {
  const job = await db.jobs.findById(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.status(200).json({
    status: job.status,
    data: job.result
  });
});
