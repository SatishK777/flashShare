import { prisma } from '../config/database.js';

// Self-contained interface — no dependency on Prisma.XxxGetPayload
export interface ShareRecord {
  id: string;
  token: string;
  status: string;
  expiresAt: Date;
  maxDownloads: number;
  downloadCount: number;
  passwordHash: string | null;
  showFilenames: boolean;
  autoDeletePolicy: string;
  transferMode: string;
  totalSize: bigint;
  encryptionKeyHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileRecord {
  id: string;
  shareId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: bigint;
  checksumSha256: string;
  storagePath: string;
  encryptionIv: string | null;
  chunkCount: number;
  status: string;
  metadata: unknown;
  createdAt: Date;
}

export type ShareWithFiles = ShareRecord & { files: FileRecord[] };

export class ShareRepository {
  async create(data: {
    token: string;
    expiresAt: Date;
    maxDownloads: number;
    passwordHash?: string;
    showFilenames: boolean;
    autoDeletePolicy: string;
    transferMode?: string;
    encryptionKeyHash?: string;
    status?: string;
  }): Promise<ShareRecord> {
    return prisma.share.create({ data }) as Promise<ShareRecord>;
  }

  async findById(id: string): Promise<ShareWithFiles | null> {
    return prisma.share.findUnique({
      where: { id },
      include: { files: true },
    }) as Promise<ShareWithFiles | null>;
  }

  async findByToken(token: string): Promise<ShareWithFiles | null> {
    return prisma.share.findUnique({
      where: { token },
      include: { files: true },
    }) as Promise<ShareWithFiles | null>;
  }

  async updateStatus(id: string, status: string): Promise<ShareRecord> {
    return prisma.share.update({
      where: { id },
      data: { status },
    }) as Promise<ShareRecord>;
  }

  async incrementDownloadCount(id: string): Promise<ShareRecord> {
    return prisma.share.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    }) as Promise<ShareRecord>;
  }

  async findBatchByTokensOrIds(tokensOrIds: string[]): Promise<ShareWithFiles[]> {
    if (!tokensOrIds || tokensOrIds.length === 0) return [];
    return prisma.share.findMany({
      where: {
        status: 'active',
        expiresAt: { gt: new Date() },
        OR: [
          { token: { in: tokensOrIds } },
          { id: { in: tokensOrIds } },
        ],
      },
      include: { files: true },
      orderBy: { createdAt: 'desc' },
    }) as Promise<ShareWithFiles[]>;
  }

  async findActive(): Promise<ShareRecord[]> {
    return prisma.share.findMany({
      where: {
        status: 'active',
        expiresAt: { gt: new Date() },
      },
    }) as Promise<ShareRecord[]>;
  }

  async delete(id: string): Promise<ShareRecord> {
    return prisma.share.delete({ where: { id } }) as Promise<ShareRecord>;
  }
}

export const shareRepository = new ShareRepository();
