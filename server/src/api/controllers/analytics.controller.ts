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
      let tokens: string[] = [];
      if (req.body && Array.isArray(req.body.tokens)) {
        tokens = req.body.tokens;
      } else if (req.query.tokens) {
        const raw = req.query.tokens as string;
        tokens = raw.split(',').map((t) => t.trim()).filter(Boolean);
      }

      const data = await analyticsService.getDashboardStats(tokens);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};
