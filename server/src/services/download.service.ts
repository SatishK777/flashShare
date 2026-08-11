import { downloadRepository } from '../repositories/download.repository.js';
import { shareRepository } from '../repositories/share.repository.js';
import { analyticsService } from './analytics.service.js';
import { shareService } from './share.service.js';
import { getIO } from '../socket/index.js';
import { EVENTS } from '../socket/events.js';
import { AppError } from '../api/middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';

export class DownloadService {
  /**
   * Start a new download for a share
   */
  async startDownload(shareId: string, ipHash: string, userAgent?: string) {
    const share = await shareRepository.findById(shareId);
    if (!share) {
      throw new AppError(404, 'Share not found');
    }

    if (share.status !== 'active') {
      throw new AppError(400, `Share is not active (status: ${share.status})`);
    }

    const isUnlimited = share.maxDownloads === 0 || share.maxDownloads === -1;
    if (!isUnlimited && share.downloadCount >= share.maxDownloads) {
      throw new AppError(403, 'Maximum download limit reached');
    }

    // Create download record
    const download = await downloadRepository.create({
      shareId,
      receiverIpHash: ipHash,
      userAgent,
    });

    // Increment download count
    await shareRepository.incrementDownloadCount(shareId);

    // Log analytics
    await analyticsService.logEvent(shareId, 'download_started', null, ipHash, userAgent);

    // Emit socket event
    try {
      const io = getIO();
      io.to(shareId).emit(EVENTS.DOWNLOAD_STARTED, {
        downloadId: download.id,
        timestamp: download.startedAt,
      });
    } catch (err) {
      logger.warn(`Failed to emit DOWNLOAD_STARTED for share ${shareId}:`, err);
    }

    return download;
  }

  /**
   * Update download progress
   */
  async updateProgress(downloadId: string, bytesDownloaded: bigint, totalBytes: bigint) {
    const download = await downloadRepository.findById(downloadId);
    if (!download) return;

    await downloadRepository.updateStatus(downloadId, 'in_progress', bytesDownloaded);

    try {
      const io = getIO();
      io.to(download.shareId).emit(EVENTS.DOWNLOAD_PROGRESS, {
        downloadId,
        bytesDownloaded: bytesDownloaded.toString(),
        totalBytes: totalBytes.toString(),
        percentage: Number((bytesDownloaded * 100n) / totalBytes),
      });
    } catch (err) {
      logger.warn(`Failed to emit DOWNLOAD_PROGRESS for download ${downloadId}:`, err);
    }
  }

  /**
   * Mark a download as completed
   */
  async completeDownload(downloadId: string) {
    const download = await downloadRepository.findById(downloadId);
    if (!download) return;

    // Get total bytes from share to set as final downloaded bytes
    const share = await shareRepository.findById(download.shareId);
    const totalBytes = share ? BigInt(share.totalSize) : download.bytesDownloaded;

    const completed = await downloadRepository.markCompleted(downloadId, totalBytes);

    // Log analytics and record download count limit
    await analyticsService.logEvent(download.shareId, 'download_completed', null, download.receiverIpHash, download.userAgent || undefined);
    await shareService.recordDownload(download.shareId);

    try {
      const io = getIO();
      io.to(download.shareId).emit(EVENTS.DOWNLOAD_COMPLETED, {
        downloadId,
        timestamp: completed.completedAt,
      });
    } catch (err) {
      logger.warn(`Failed to emit DOWNLOAD_COMPLETED for download ${downloadId}:`, err);
    }

    return completed;
  }
}

export const downloadService = new DownloadService();
