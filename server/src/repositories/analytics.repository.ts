/**
 * Analytics repository
 */
import { prisma } from '../config/database.js';

export const analyticsRepository = {
  /**
   * Log an event
   */
  async create(data: {
    shareId: string;
    eventType: string;
    metadata?: any;
    ipHash?: string;
    userAgent?: string;
  }) {
    return prisma.analyticsEvent.create({
      data,
    });
  },

  /**
   * All events for a share
   */
  async findByShareId(shareId: string) {
    return prisma.analyticsEvent.findMany({
      where: { shareId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Count events of type since date
   */
  async countByEventType(eventType: string, since?: Date) {
    const whereClause: any = { eventType };
    if (since) {
      whereClause.createdAt = { gte: since };
    }
    return prisma.analyticsEvent.count({
      where: whereClause,
    });
  },

  /**
   * Latest events
   */
  async getRecentEvents(limit: number) {
    return prisma.analyticsEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        share: {
          select: { id: true, token: true },
        },
      },
    });
  },
};
