/**
 * agent-notes: { ctx: "P0 principal SDE, TDD green phase", deps: ["apps/web/src/services/storage.ts", "apps/web/src/services/transcription.ts", "apps/web/src/services/ocr.ts", "apps/web/src/services/vectorDb.ts", "apps/web/src/services/embedding.ts"], state: "canonical", last: "sato@2026-08-05" }
 */

import { storage } from '../services/storage';
import { transcriptionApi } from '../services/transcription';
import { ocrApi } from '../services/ocr';
import { vectorDb, VectorRecord } from '../services/vectorDb';
import { embeddingApi } from '../services/embedding';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface UploadPayload {
  filename: string;
  buffer: Buffer;
  mimeType: string;
}

export interface UploadResult {
  documentId: string;
  status: string;
}

const SUPPORTED_MIME_TYPES = [
  'audio/mpeg', 
  'application/pdf', 
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

export const processKbUpload = async (payload: UploadPayload): Promise<UploadResult> => {
  if (payload.buffer.length === 0) {
    throw new Error('File is empty');
  }

  if (!SUPPORTED_MIME_TYPES.includes(payload.mimeType)) {
    throw new Error('Unsupported file type');
  }

  await storage.saveFile(payload.filename, payload.buffer);

  return {
    documentId: `doc-${Date.now()}`,
    status: 'processing'
  };
};

export const transcribeAudio = async (fileUrl: string): Promise<string> => {
  try {
    return await transcriptionApi.transcribe(fileUrl);
  } catch (error) {
    throw new Error('Transcription failed');
  }
};

export const processDocument = async (fileUrl: string): Promise<string[]> => {
  return await ocrApi.extractText(fileUrl);
};

export const generateAndStoreEmbeddings = async (documentId: string, chunks: string[]): Promise<boolean> => {
  try {
    const embeddings = await embeddingApi.createEmbeddings(chunks);
    const records: VectorRecord[] = chunks.map((_, index) => ({
      id: `${documentId}-${index}`,
      vector: embeddings[index]
    }));
    return await vectorDb.upsert(records);
  } catch (error) {
    throw new Error('Vector storage failed');
  }
};

export const extractAudioWithFfmpeg = async (inputPath: string, outputPath: string): Promise<void> => {
  await execFileAsync('ffmpeg', ['-i', inputPath, '-vn', '-acodec', 'libmp3lame', outputPath]);
};
