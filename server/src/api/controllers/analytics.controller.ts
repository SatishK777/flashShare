import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../../services/analytics.service.js';

export const analyticsController = {
  async getShareAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await analyticsService.getShareAnalytics(id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getDashboardStats();
      // Ensure BigInts are converted before JSON serialization if any sneaked in
      // Actually express res.json handles plain objects but fails on BigInt. 
      // We converted totalBandwidth to Number in service, so it should be fine.
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};
