import { prisma } from '../config/database.js';

// Self-contained interface — no dependency on Prisma.XxxGetPayload
export interface DownloadRecord {
  id: string;
  shareId: string;
  receiverIpHash: string;
  status: string;
  bytesDownloaded: bigint;
  startedAt: Date;
  completedAt: Date | null;
  userAgent: string | null;
}

export class DownloadRepository {
  async create(data: {
    shareId: string;
    receiverIpHash: string;
    userAgent?: string;
  }): Promise<DownloadRecord> {
    return prisma.download.create({
      data: {
        shareId: data.shareId,
        receiverIpHash: data.receiverIpHash,
        userAgent: data.userAgent,
        status: 'in_progress',
        bytesDownloaded: 0n,
      },
    }) as Promise<DownloadRecord>;
  }

  async findById(id: string): Promise<DownloadRecord | null> {
    return prisma.download.findUnique({ where: { id } }) as Promise<DownloadRecord | null>;
  }

  async findByShareId(shareId: string): Promise<DownloadRecord[]> {
    return prisma.download.findMany({
      where: { shareId },
      orderBy: { startedAt: 'desc' },
    }) as Promise<DownloadRecord[]>;
  }

  async updateStatus(
    id: string,
    status: string,
    bytesDownloaded?: bigint,
    completedAt?: Date
  ): Promise<DownloadRecord> {
    const updateData: Record<string, unknown> = { status };
    if (bytesDownloaded !== undefined) updateData.bytesDownloaded = bytesDownloaded;
    if (completedAt !== undefined) updateData.completedAt = completedAt;
    return prisma.download.update({ where: { id }, data: updateData }) as Promise<DownloadRecord>;
  }

  async markCompleted(id: string, totalBytes: bigint): Promise<DownloadRecord> {
    return this.updateStatus(id, 'completed', totalBytes, new Date());
  }
}

export const downloadRepository = new DownloadRepository();
