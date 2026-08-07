// File Validator
import { z } from 'zod';

export const registerFileSchema = z.object({
  params: z.object({
    id: z.string().uuid(),  // shareId
  }),
  body: z.object({
    originalName: z.string().min(1).max(500),
    mimeType: z.string().min(1),
    size: z.number().positive(),
    checksumSha256: z.string().min(1),
    chunkCount: z.number().min(1),
    encryptionIv: z.string().optional(),
  }),
});

export const uploadChunkSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    fileId: z.string().uuid(),
  }),
  query: z.object({
    index: z.string().transform(Number),
  }),
});
