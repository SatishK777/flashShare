// File Repository
import { prisma } from '../config/database.js';
import { Prisma, File } from '@prisma/client';

export class FileRepository {
  async create(data: Prisma.FileCreateInput): Promise<File> {
    return prisma.file.create({ data });
  }

  async findById(id: string): Promise<File | null> {
    return prisma.file.findUnique({
      where: { id },
    });
  }

  async findByShareId(shareId: string): Promise<File[]> {
    return prisma.file.findMany({
      where: { shareId },
    });
  }

  async updateStatus(id: string, status: string): Promise<File> {
    return prisma.file.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<File> {
    return prisma.file.delete({
      where: { id },
    });
  }
}

export const fileRepository = new FileRepository();
