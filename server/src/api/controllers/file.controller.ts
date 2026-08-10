// File Controller
import { Request, Response, NextFunction } from 'express';
import { fileService } from '../../services/file.service.js';
import { shareService } from '../../services/share.service.js';
import { downloadService } from '../../services/download.service.js';
import { fileRepository } from '../../repositories/file.repository.js';
import { hashIp } from '../../utils/helpers.js';
import { AppError } from '../middlewares/errorHandler.js';

export const registerFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // shareId
    const data = await fileService.registerFile(id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const uploadChunk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, fileId } = req.params; // shareId, fileId
    const index = parseInt(req.query.index as string, 10);
    const chunkData = req.body;

    if (!Buffer.isBuffer(chunkData)) {
      throw new AppError(400, 'Invalid chunk data');
    }

    const data = await fileService.uploadChunk(id, fileId, index, chunkData, 0);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getFileChunk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, fileId, index } = req.params; 
    const chunkIdx = parseInt(index, 10);
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    const share = await shareService.getShareByToken(token);
    const file = await fileRepository.findById(fileId);
    
    if (!file || file.shareId !== share.id) {
      throw new AppError(404, 'File not found');
    }

    const buffer = await fileService.getFileChunk(share.id, fileId, chunkIdx);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(buffer);

    // Track analytics and completed download metrics on last chunk
    if (chunkIdx === file.chunkCount - 1) {
      try {
        const download = await downloadService.startDownload(share.id, hashIp(ip), userAgent);
        if (download) {
          await downloadService.completeDownload(download.id);
        }
      } catch (err) {
        // Silently log metrics error so download stream response is unaffected
        console.error('Metrics recording error in getFileChunk:', err);
      }
    }
  } catch (error) {
    next(error);
  }
};
