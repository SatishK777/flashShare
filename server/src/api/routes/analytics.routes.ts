import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';

const router = Router();

// Dashboard route (supports GET with ?tokens= or POST with { tokens: [] })
router.get('/dashboard', analyticsController.getDashboard);
router.post('/dashboard', analyticsController.getDashboard);

// Share analytics route
router.get('/shares/:id/analytics', analyticsController.getShareAnalytics);

export default router;
