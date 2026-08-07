import { Router } from 'express';
import { createShare, finalizeShare, getShare, verifyPassword } from '../controllers/share.controller.js';
import { validate } from '../middlewares/validation.js';
import { createShareSchema, finalizeShareSchema } from '../validators/share.validator.js';

const router = Router();

router.post('/', validate(createShareSchema), createShare);
router.post('/:id/finalize', validate(finalizeShareSchema), finalizeShare);
router.get('/:token', getShare);
router.post('/:token/verify-password', verifyPassword);

export default router;
