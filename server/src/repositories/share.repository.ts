// Share Repository
import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

type Share = Prisma.ShareGetPayload<object>;
type File = Prisma.FileGetPayload<object>;
export type ShareWithFiles = Share & { files: File[] };


export class ShareRepository {
  async create(data: Prisma.ShareCreateInput): Promise<Share> {
    return prisma.share.create({ data });
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

  async updateStatus(id: string, status: string): Promise<Share> {
    return prisma.share.update({
      where: { id },
      data: { status },
    });
  }

  async incrementDownloadCount(id: string): Promise<Share> {
    return prisma.share.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
  }

  async findActive(): Promise<Share[]> {
    return prisma.share.findMany({
      where: {
        status: 'active',
        expiresAt: { gt: new Date() },
      },
    });
  }

  async delete(id: string): Promise<Share> {
    return prisma.share.delete({
      where: { id },
    });
  }
}

export const shareRepository = new ShareRepository();
