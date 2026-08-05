/**
 * agent-notes: { ctx: "P0 TDD red phase, Epic A KB Ingestion", deps: ["apps/web/src/engine/kb.ts"], state: "canonical", last: "tara@2026-08-05", key: ["owns KB ingestion tests"] }
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  processKbUpload, 
  transcribeAudio, 
  processDocument,
  generateAndStoreEmbeddings 
} from '../../src/engine/kb';
import { storage } from '../../src/services/storage';
import { transcriptionApi } from '../../src/services/transcription';
import { ocrApi } from '../../src/services/ocr';
import { vectorDb } from '../../src/services/vectorDb';
import { embeddingApi } from '../../src/services/embedding';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Mock external services for Unit Testing
vi.mock('../../src/services/storage');
vi.mock('../../src/services/transcription');
vi.mock('../../src/services/ocr');
vi.mock('../../src/services/vectorDb');
vi.mock('../../src/services/embedding');

describe('Knowledge Base Ingestion Engine', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('1. File Upload & Validation', () => {
    it('should successfully accept valid audio files and return a document ID', async () => {
      vi.mocked(storage.saveFile).mockResolvedValue('s3://bucket/audio123.mp3');
      
      const result = await processKbUpload({
        filename: 'lecture.mp3',
        buffer: Buffer.from('fake-audio-data'),
        mimeType: 'audio/mpeg'
      });

      expect(result.documentId).toBeDefined();
      expect(result.status).toBe('processing');
      expect(storage.saveFile).toHaveBeenCalled();
    });

    it('should throw a validation error for unsupported file types', async () => {
      await expect(processKbUpload({
        filename: 'virus.exe',
        buffer: Buffer.from('malware'),
        mimeType: 'application/x-msdownload'
      })).rejects.toThrow('Unsupported file type');
    });

    it('should throw an error for empty files (0 bytes)', async () => {
      await expect(processKbUpload({
        filename: 'empty.pdf',
        buffer: Buffer.from(''),
        mimeType: 'application/pdf'
      })).rejects.toThrow('File is empty');
    });
  });

  describe('2. Transcription & OCR Integration', () => {
    it('should send audio to transcription API and return raw text', async () => {
      vi.mocked(transcriptionApi.transcribe).mockResolvedValue('Today we will learn about TDD.');
      
      const text = await transcribeAudio('s3://bucket/audio123.mp3');
      
      expect(transcriptionApi.transcribe).toHaveBeenCalledWith('s3://bucket/audio123.mp3');
      expect(text).toContain('TDD');
    });

    it('should fail the job gracefully if transcription API times out or fails', async () => {
      vi.mocked(transcriptionApi.transcribe).mockRejectedValue(new Error('API Timeout'));
      
      await expect(transcribeAudio('s3://bucket/audio123.mp3')).rejects.toThrow('Transcription failed');
    });

    it('should extract text from PPT notes via OCR API', async () => {
      vi.mocked(ocrApi.extractText).mockResolvedValue(['Slide 1: Intro', 'Slide 2: Details']);
      
      const slides = await processDocument('s3://bucket/slides.pptx');
      
      expect(ocrApi.extractText).toHaveBeenCalledWith('s3://bucket/slides.pptx');
      expect(slides.length).toBe(2);
      expect(slides[0]).toBe('Slide 1: Intro');
    });
  });

  describe('3. Embedding Generation and Storage', () => {
    it('should chunk text, generate embeddings, and store them in Vector DB', async () => {
      const inputChunks = ['Chunk 1 text', 'Chunk 2 text'];
      vi.mocked(embeddingApi.createEmbeddings).mockResolvedValue([[0.1, 0.2], [0.3, 0.4]]);
      vi.mocked(vectorDb.upsert).mockResolvedValue(true);

      const success = await generateAndStoreEmbeddings('doc-123', inputChunks);

      expect(embeddingApi.createEmbeddings).toHaveBeenCalledWith(inputChunks);
      expect(vectorDb.upsert).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: 'doc-123-0', vector: [0.1, 0.2] })
      ]));
      expect(success).toBe(true);
    });

    it('should rollback or mark failed if vector DB insertion fails', async () => {
      const inputChunks = ['Chunk 1 text'];
      vi.mocked(embeddingApi.createEmbeddings).mockResolvedValue([[0.1, 0.2]]);
      vi.mocked(vectorDb.upsert).mockRejectedValue(new Error('DB Connection Lost'));

      await expect(generateAndStoreEmbeddings('doc-123', inputChunks))
        .rejects.toThrow('Vector storage failed');
    });
  });
});

// Integration test for external file processing binaries (e.g. ffmpeg for audio extraction)
describe('External Process Integration (ffmpeg)', () => {
  const runIntegration = process.env.INTEGRATION_TEST_FFMPEG === '1' ? it : it.skip;

  runIntegration('should extract audio from video using real ffmpeg binary', async () => {
    // Note: this assumes an actual implementation \`extractAudioWithFfmpeg\` uses child_process spawn/exec
    // We want to ensure it works with real stdio configs.
    const { extractAudioWithFfmpeg } = await import('../../src/engine/kb');
    
    // We would need a dummy test video file here in a real scenario
    const inputPath = '__fixtures__/dummy-video.mp4';
    const outputPath = '__fixtures__/output-audio.mp3';

    await extractAudioWithFfmpeg(inputPath, outputPath);

    // Verify file exists and has size
    const fs = await import('fs/promises');
    const stats = await fs.stat(outputPath);
    expect(stats.size).toBeGreaterThan(0);
  });
});
