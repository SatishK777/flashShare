import { prisma } from '../config/database.js';

export class AnalyticsService {
  /**
   * Log an analytics event for a share
   */
  async logEvent(
    shareId: string,
    eventType: 'share_viewed' | 'share_created' | 'download_started' | 'download_completed',
    metadata?: unknown,
    ipHash?: string,
    userAgent?: string
  ) {
    return prisma.analyticsEvent.create({
      data: {
        shareId,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        ipHash: ipHash || 'unknown',
        userAgent,
      },
    });
  }

  /**
   * Get analytics for a specific share
   */
  async getShareAnalytics(shareId: string) {
    const events = await prisma.analyticsEvent.findMany({
      where: { shareId },
      orderBy: { createdAt: 'desc' },
    });

    const views = events.filter((e) => e.eventType === 'share_viewed').length;
    const downloadStarts = events.filter((e) => e.eventType === 'download_started').length;
    const downloadCompletes = events.filter((e) => e.eventType === 'download_completed').length;

    return {
      shareId,
      totalEvents: events.length,
      views,
      downloadStarts,
      downloadCompletes,
      events,
    };
  }

  /**
   * Get device-scoped dashboard statistics for a specific set of share tokens/ids
   */
  async getDashboardStats(tokens: string[] = []) {
    if (!tokens || tokens.length === 0) {
      return {
        totalShares: 0,
        activeShares: 0,
        totalDownloads: 0,
        totalBandwidth: 0,
        recentActivity: [],
      };
    }

    const myShares = await prisma.share.findMany({
      where: {
        OR: [
          { token: { in: tokens } },
          { id: { in: tokens } },
        ],
      },
      select: { id: true, status: true, expiresAt: true },
    });

    const shareIds = myShares.map((s) => s.id);

    const totalShares = myShares.length;
    const activeShares = myShares.filter((s) => s.status === 'active' && new Date(s.expiresAt) > new Date()).length;

    const totalDownloads = await prisma.download.count({
      where: {
        shareId: { in: shareIds },
        status: 'completed',
      },
    });

    const bandwidthResult = await prisma.download.aggregate({
      where: {
        shareId: { in: shareIds },
        status: 'completed',
      },
      _sum: { bytesDownloaded: true },
    });
    const totalBandwidth = Number(bandwidthResult._sum.bytesDownloaded || 0);

    const recentActivity = await prisma.analyticsEvent.findMany({
      where: {
        shareId: { in: shareIds },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        share: {
          select: { id: true },
        },
      },
    });

    return {
      totalShares,
      activeShares,
      totalDownloads,
      totalBandwidth,
      recentActivity,
    };
  }
}

export const analyticsService = new AnalyticsService();
