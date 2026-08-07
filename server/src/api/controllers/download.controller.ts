import { Request, Response, NextFunction } from 'express';
import { shareService } from '../../services/share.service.js';
import { downloadService } from '../../services/download.service.js';
import { fileRepository } from '../../repositories/file.repository.js';
import { storage } from '../../config/storage.js';
import { hashIp } from '../../utils/helpers.js';
import { AppError } from '../middlewares/errorHandler.js';

export class DownloadController {
  /**
   * POST /api/shares/:token/download
   * Initiate a download session
   */
  async initiateDownload(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];

      // Get share
      const share = await shareService.getShareForReceiver(token);

      // Start download tracking
      const download = await downloadService.startDownload(
        share.id,
        hashIp(ip),
        userAgent
      );

      res.status(201).json({
        success: true,
        data: {
          downloadId: download.id,
          share,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/shares/:token/files/:fileId/download
   * Download a specific file within a share
   */
  async downloadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, fileId } = req.params;
      const downloadId = req.query.downloadId as string;

      const share = await shareService.getShareByToken(token);
      const file = await fileRepository.findById(fileId);

      if (!file || file.shareId !== share.id) {
        throw new AppError(404, 'File not found');
      }

      // Respect showFilenames setting
      let downloadName = file.originalName;
      if (!share.showFilenames) {
        const ext = file.originalName.includes('.') ? `.${file.originalName.split('.').pop()}` : '';
        // Find index of file to match generic naming
        const index = share.files?.findIndex((f: { id: string }) => f.id === file.id) ?? 0;
        downloadName = `file_${index + 1}${ext}`;
      }

      // Set headers for download
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      res.setHeader('Content-Length', file.size.toString());

      let bytesDownloaded = 0n;

      // Stream chunks sequentially
      for (let i = 0; i < file.chunkCount; i++) {
        const chunkPath = `shares/${share.id}/${file.id}/chunk_${i}`;
        const stream = await storage.getStream(chunkPath);

        await new Promise<void>((resolve, reject) => {
          stream.on('data', (chunk) => {
            res.write(chunk);
            bytesDownloaded += BigInt(chunk.length);
            
            // Periodically update progress if downloadId provided
            if (downloadId && bytesDownloaded % (1024n * 1024n) === 0n) { // Update every 1MB
               downloadService.updateProgress(downloadId, bytesDownloaded, BigInt(file.size)).catch(() => {});
            }
          });
          stream.on('end', resolve);
          stream.on('error', reject);
        });
      }

      res.end();

      // Update final progress and mark completed if downloadId is present
      if (downloadId) {
        await downloadService.updateProgress(downloadId, bytesDownloaded, BigInt(file.size));
        await downloadService.completeDownload(downloadId);
      }
    } catch (error) {
      // Clean up response if error occurs during streaming
      if (!res.headersSent) {
        next(error);
      } else {
        res.end();
      }
    }
  }
}

export const downloadController = new DownloadController();
