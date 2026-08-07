import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

type Download = Prisma.DownloadGetPayload<object>;


export class DownloadRepository {
  /**
   * Create a new download record
   */
  async create(data: {
    shareId: string;
    receiverIpHash: string;
    userAgent?: string;
  }): Promise<Download> {
    return prisma.download.create({
      data: {
        shareId: data.shareId,
        receiverIpHash: data.receiverIpHash,
        userAgent: data.userAgent,
        status: 'in_progress',
        bytesDownloaded: 0n,
      },
    });
  }

  /**
   * Find a download by ID
   */
  async findById(id: string): Promise<Download | null> {
    return prisma.download.findUnique({
      where: { id },
    });
  }

  /**
   * Find all downloads for a specific share
   */
  async findByShareId(shareId: string): Promise<Download[]> {
    return prisma.download.findMany({
      where: { shareId },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Update download status and/or bytes downloaded
   */
  async updateStatus(
    id: string,
    status: string,
    bytesDownloaded?: bigint,
    completedAt?: Date
  ): Promise<Download> {
    const updateData: any = { status };
    
    if (bytesDownloaded !== undefined) {
      updateData.bytesDownloaded = bytesDownloaded;
    }
    
    if (completedAt !== undefined) {
      updateData.completedAt = completedAt;
    }

    return prisma.download.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Mark a download as completed
   */
  async markCompleted(id: string, totalBytes: bigint): Promise<Download> {
    return this.updateStatus(id, 'completed', totalBytes, new Date());
  }
}

export const downloadRepository = new DownloadRepository();
