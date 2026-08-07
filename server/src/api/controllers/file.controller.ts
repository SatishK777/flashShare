// File Controller
import { Request, Response, NextFunction } from 'express';
import { fileService } from '../../services/file.service.js';
import { shareService } from '../../services/share.service.js';
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
    
    const share = await shareService.getShareByToken(token);
    const buffer = await fileService.getFileChunk(share.id, fileId, parseInt(index, 10));
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
