// Share Service
import { shareRepository } from '../repositories/share.repository.js';
import { fileRepository } from '../repositories/file.repository.js';
import { generateToken, hashPassword, verifyPassword } from '../utils/crypto.js';
import { calculateExpiry } from '../utils/helpers.js';
import { AppError } from '../api/middlewares/errorHandler.js';
import { storage } from '../config/storage.js';
import { logger } from '../utils/logger.js';

export interface CreateShareSettings {
  expiresInMinutes: number;
  maxDownloads: number;
  password?: string;
  showFilenames?: boolean;
  autoDeletePolicy?: string;
}

export class ShareService {
  async createShare(settings: CreateShareSettings) {
    const token = generateToken(16);
    let passwordHash = null;

    if (settings.password) {
      passwordHash = await hashPassword(settings.password);
    }

    const expiresAt = calculateExpiry(settings.expiresInMinutes);

    const share = await shareRepository.create({
      token,
      expiresAt,
      maxDownloads: settings.maxDownloads,
      passwordHash: passwordHash ?? undefined,
      showFilenames: settings.showFilenames ?? true,
      autoDeletePolicy: settings.autoDeletePolicy ?? 'after_expiry',
      status: 'pending',
    });

    return {
      id: share.id,
      token: share.token,
      expiresAt: share.expiresAt,
    };
  }

  async finalizeShare(shareId: string) {
    const share = await shareRepository.findById(shareId);
    if (!share) {
      throw new AppError(404, 'Share not found');
    }

    const files = await fileRepository.findByShareId(shareId);
    const totalSize = files.reduce((acc: bigint, file: { size: bigint }) => acc + BigInt(file.size), BigInt(0));

    const updatedShare = await shareRepository.updateStatus(shareId, 'active');

    return {
      id: updatedShare.id,
      token: updatedShare.token,
      totalSize: totalSize.toString(),
    };
  }

  async getShareByToken(token: string) {
    const share = await shareRepository.findByToken(token);
    if (!share) {
      throw new AppError(404, 'Share not found');
    }

    if (share.status === 'completed' || share.status === 'expired' || share.status === 'cancelled') {
      throw new AppError(410, `Share is no longer available (status: ${share.status})`);
    }

    if (share.maxDownloads !== -1 && share.downloadCount >= share.maxDownloads) {
      if (share.status !== 'completed') {
        await shareRepository.updateStatus(share.id, 'completed');
      }
      throw new AppError(410, 'Maximum download limit reached');
    }

    if (new Date() > share.expiresAt) {
      if (share.status !== 'expired') {
        await shareRepository.updateStatus(share.id, 'expired');
      }
      throw new AppError(410, 'Share has expired');
    }

    return share;
  }

  async getShareById(id: string) {
    const share = await shareRepository.findById(id);
    if (!share) {
      throw new AppError(404, 'Share not found');
    }
    return share;
  }

  async verifyPassword(shareId: string, password: string) {
    const share = await shareRepository.findById(shareId);
    if (!share) {
      throw new AppError(404, 'Share not found');
    }

    if (!share.passwordHash) {
      return true;
    }

    const isValid = await verifyPassword(password, share.passwordHash);
    if (!isValid) {
      throw new AppError(401, 'Invalid password');
    }

    return true;
  }

  async cancelShare(shareId: string) {
    const share = await shareRepository.findById(shareId);
    if (!share) {
      throw new AppError(404, 'Share not found');
    }

    await shareRepository.updateStatus(shareId, 'cancelled');

    const files = await fileRepository.findByShareId(shareId);
    const keysToDelete = files.map((f: { storagePath: string }) => f.storagePath);
    if (keysToDelete.length > 0) {
      await storage.deleteMany(keysToDelete);
    }

    return { success: true };
  }

  async getShareForReceiver(token: string) {
    const share = await this.getShareByToken(token);
    
    // Check if share needs password (we shouldn't return files if it does, but for now we assume they provided it or we return a generic structure)
    // Actually, usually they have to verify password first, but for receiver view we format the share.
    let files = share.files || [];
    
    // Respect showFilenames setting
    if (!share.showFilenames) {
      files = files.map((file, index: number) => {
        // Extract extension from original name if possible
        const ext = file.originalName.includes('.') ? `.${file.originalName.split('.').pop()}` : '';
        return {
          ...file,
          originalName: `file_${index + 1}${ext}`,
        } as typeof file;
      });
    }

    return {
      ...share,
      files,
    };
  }

  async recordDownload(shareId: string) {
    const share = await shareRepository.findById(shareId);
    if (!share) return null;

    const updatedCount = share.downloadCount + 1;
    await shareRepository.incrementDownloadCount(shareId);

    const isFullyCompleted = share.maxDownloads !== -1 && updatedCount >= share.maxDownloads;

    if (isFullyCompleted) {
      await shareRepository.updateStatus(shareId, 'completed');
      logger.info(`Share ${shareId} marked completed after reaching max downloads (${share.maxDownloads})`);

      if (share.autoDeletePolicy === 'after_download') {
        const files = await fileRepository.findByShareId(shareId);
        const keysToDelete = files.map((f: { storagePath: string }) => f.storagePath);
        if (keysToDelete.length > 0) {
          await storage.deleteMany(keysToDelete);
        }
      }
    }

    return {
      downloadCount: updatedCount,
      maxDownloads: share.maxDownloads,
      isFullyCompleted,
    };
  }
}

export const shareService = new ShareService();
