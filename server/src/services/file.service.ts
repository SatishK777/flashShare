// File Service
import { fileRepository } from '../repositories/file.repository.js';
import { shareRepository } from '../repositories/share.repository.js';
import { storage } from '../config/storage.js';
import { AppError } from '../api/middlewares/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

export interface RegisterFileRequest {
  originalName: string;
  mimeType: string;
  size: number;
  checksumSha256: string;
  chunkCount: number;
  encryptionIv?: string;
}

export class FileService {
  async registerFile(shareId: string, fileData: RegisterFileRequest) {
    const share = await shareRepository.findById(shareId);
    if (!share) {
      throw new AppError(404, 'Share not found');
    }

    const storedName = uuidv4();
    const storagePath = `shares/${shareId}/${storedName}`;

    const file = await fileRepository.create({
      share: { connect: { id: shareId } },
      originalName: fileData.originalName,
      storedName,
      mimeType: fileData.mimeType,
      size: BigInt(fileData.size),
      storagePath,
      checksumSha256: fileData.checksumSha256,
      chunkCount: fileData.chunkCount,
      encryptionIv: fileData.encryptionIv,
      status: 'uploading',
    });

    return { fileId: file.id, storagePath };
  }

  async uploadChunk(shareId: string, fileId: string, chunkIndex: number, chunkData: Buffer, totalChunks: number) {
    const file = await fileRepository.findById(fileId);
    if (!file || file.shareId !== shareId) {
      throw new AppError(404, 'File not found');
    }

    if (file.status !== 'uploading') {
      throw new AppError(400, 'File is not in uploading state');
    }

    const chunkPath = `shares/${shareId}/${fileId}/chunk_${chunkIndex}`;
    
    // Store the chunk
    await storage.upload(chunkPath, chunkData, 'application/octet-stream');

    // Mark file as ready when the last chunk is uploaded
    if (chunkIndex === totalChunks - 1) {
      await fileRepository.updateStatus(fileId, 'ready');
    }

    return { success: true };
  }

  async getFileChunk(shareId: string, fileId: string, chunkIndex: number) {
    const file = await fileRepository.findById(fileId);
    if (!file) {
      throw new AppError(404, 'File not found');
    }

    const chunkPath = `shares/${shareId}/${fileId}/chunk_${chunkIndex}`;
    
    const exists = await storage.exists(chunkPath);
    if (!exists) {
      throw new AppError(404, 'Chunk not found');
    }

    const buffer = await storage.download(chunkPath);
    return buffer;
  }

  async deleteShareFiles(shareId: string) {
    const files = await fileRepository.findByShareId(shareId);
    const keysToDelete: string[] = [];
    
    for (const file of files) {
      for (let i = 0; i < file.chunkCount; i++) {
        keysToDelete.push(`shares/${shareId}/${file.id}/chunk_${i}`);
      }
      keysToDelete.push(file.storagePath);
    }

    if (keysToDelete.length > 0) {
      await storage.deleteMany(keysToDelete);
    }
    
    return { success: true };
  }
}

export const fileService = new FileService();
