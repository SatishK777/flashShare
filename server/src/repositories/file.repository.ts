import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

// Self-contained types derived from Prisma schema (no GetPayload needed)
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
  metadata: Prisma.JsonValue;
  createdAt: Date;
}

export class FileRepository {
  async create(data: Prisma.FileUncheckedCreateInput): Promise<FileRecord> {
    return prisma.file.create({ data }) as Promise<FileRecord>;
  }

  async findById(id: string): Promise<FileRecord | null> {
    return prisma.file.findUnique({ where: { id } }) as Promise<FileRecord | null>;
  }

  async findByShareId(shareId: string): Promise<FileRecord[]> {
    return prisma.file.findMany({ where: { shareId } }) as Promise<FileRecord[]>;
  }

  async updateStatus(id: string, status: string): Promise<FileRecord> {
    return prisma.file.update({ where: { id }, data: { status } }) as Promise<FileRecord>;
  }

  async deleteById(id: string): Promise<FileRecord> {
    return prisma.file.delete({ where: { id } }) as Promise<FileRecord>;
  }
}

export const fileRepository = new FileRepository();
