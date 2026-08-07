import { Router } from 'express';
import express from 'express';
import { registerFile, uploadChunk, getFileChunk } from '../controllers/file.controller.js';
import { validate } from '../middlewares/validation.js';
import { registerFileSchema, uploadChunkSchema } from '../validators/file.validator.js';

const router = Router();

router.post(
  '/shares/:id/files',
  validate(registerFileSchema),
  registerFile
);

router.post(
  '/shares/:id/files/:fileId/chunks',
  express.raw({ limit: '6mb', type: 'application/octet-stream' }),
  validate(uploadChunkSchema),
  uploadChunk
);

router.get('/shares/:token/files/:fileId/chunks/:index', getFileChunk);

export default router;
