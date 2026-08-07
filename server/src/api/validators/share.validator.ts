// Share Validator
import { z } from 'zod';

export const createShareSchema = z.object({
  body: z.object({
    settings: z.object({
      expiresInMinutes: z.number().min(1).max(1440),
      maxDownloads: z.number().min(-1).max(1000),  // -1 = unlimited
      password: z.string().min(4).max(32).optional(),
      showFilenames: z.boolean().default(true),
      autoDeletePolicy: z.enum(['after_download', 'after_expiry', 'manual']).default('after_expiry'),
    }),
  }),
});

export const finalizeShareSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
