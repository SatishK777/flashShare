import { AppError } from '../api/middlewares/errorHandler.js';
import { analyticsRepository } from '../repositories/analytics.repository.js';
import { shareRepository } from '../repositories/share.repository.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export const analyticsService = {
  async logEvent(
    shareId: string,
    eventType: string,
    metadata?: any,
    ipHash?: string,
    userAgent?: string
  ) {
    try {
      await analyticsRepository.create({
        shareId,
        eventType,
        metadata,
        ipHash,
        userAgent,
      });
      logger.info(`Logged event ${eventType} for share ${shareId}`);
    } catch (error) {
      logger.error('Failed to log analytics event', { shareId, eventType, error });
    }
  },

  async getShareAnalytics(shareId: string) {
    const share = await shareRepository.findById(shareId);
    if (!share) {
      throw new AppError(404, 'Share not found');
    }

    // totalScans is the number of 'share_viewed' events
    const totalScans = await prisma.analyticsEvent.count({
      where: { shareId, eventType: 'share_viewed' },
    });

    const totalDownloads = await prisma.download.count({
      where: { shareId, status: 'completed' },
    });

    const uniqueVisitorsResult = await prisma.analyticsEvent.findMany({
      where: { shareId },
      select: { ipHash: true },
      distinct: ['ipHash'],
    });
    // Filter out nulls
    const uniqueVisitors = uniqueVisitorsResult.filter((v: { ipHash: string | null }) => v.ipHash).length;

    // Downloads by day using raw query or group by
    // Prisma group by date is a bit tricky, but we can do:
    const downloads = await prisma.download.findMany({
      where: { shareId, status: 'completed' },
      select: { completedAt: true },
    });
    
    const downloadsByDayMap = new Map<string, number>();
    for (const d of downloads) {
      if (d.completedAt) {
        const date = d.completedAt.toISOString().split('T')[0];
        downloadsByDayMap.set(date, (downloadsByDayMap.get(date) || 0) + 1);
      }
    }
    const downloadsByDay = Array.from(downloadsByDayMap.entries()).map(([date, count]) => ({ date, count }));
    
    // Sort chronologically
    downloadsByDay.sort((a, b) => a.date.localeCompare(b.date));

    const events = await analyticsRepository.findByShareId(shareId);

    return {
      totalScans,
      totalDownloads,
      uniqueVisitors,
      downloadsByDay,
      events,
    };
  },

  async getDashboardStats() {
    const totalShares = await prisma.share.count();
    
    const activeShares = await prisma.share.count({
      where: {
        status: 'active',
        expiresAt: { gt: new Date() },
      },
    });

    const totalDownloads = await prisma.download.count({
      where: { status: 'completed' },
    });

    const bandwidthResult = await prisma.download.aggregate({
      where: { status: 'completed' },
      _sum: { bytesDownloaded: true },
    });
    const totalBandwidth = Number(bandwidthResult._sum.bytesDownloaded || 0);

    const recentActivity = await analyticsRepository.getRecentEvents(20);

    return {
      totalShares,
      activeShares,
      totalDownloads,
      totalBandwidth,
      recentActivity,
    };
  },
};
