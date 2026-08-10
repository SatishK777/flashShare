// Share Controller
import { Request, Response, NextFunction } from 'express';
import { shareService } from '../../services/share.service.js';
import { analyticsService } from '../../services/analytics.service.js';

export const createShare = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await shareService.createShare(req.body.settings);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const finalizeShare = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await shareService.finalizeShare(id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getShare = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const data = await shareService.getShareByToken(token);
    
    // Log share_viewed analytics
    const ipHash = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    await analyticsService.logEvent(data.id, 'share_viewed', null, ipHash, userAgent);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const verifyPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const share = await shareService.getShareByToken(token);
    const { password } = req.body;
    
    await shareService.verifyPassword(share.id, password);
    res.json({ success: true, data: { verified: true } });
  } catch (error) {
    next(error);
  }
};

export const cancelShare = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await shareService.cancelShare(id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
