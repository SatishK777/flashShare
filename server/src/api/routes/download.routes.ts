import { Router } from 'express';
import { downloadController } from '../controllers/download.controller.js';

const router = Router();

router.post('/shares/:token/download', downloadController.initiateDownload);
router.get('/shares/:token/files/:fileId/download', downloadController.downloadFile);

export default router;
