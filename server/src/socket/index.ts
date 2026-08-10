// Socket config
import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { EVENTS } from "./events.js";
import { shareService } from "../services/share.service.js";

let ioInstance: SocketIOServer;

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized');
  }
  return ioInstance;
};

export const initializeSocket = (httpServer: HttpServer) => {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  ioInstance.on("connection", (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    socket.on(EVENTS.JOIN_ROOM, (roomId: string) => {
      socket.join(roomId);
      logger.debug(`Socket ${socket.id} joined room ${roomId}`);
      // Notify others in room that a receiver joined
      socket.to(roomId).emit(EVENTS.RECEIVER_JOINED, { socketId: socket.id });
    });

    socket.on(EVENTS.LEAVE_ROOM, (roomId: string) => {
      socket.leave(roomId);
      logger.debug(`Socket ${socket.id} left room ${roomId}`);
      // Notify others in room that a receiver left
      socket.to(roomId).emit(EVENTS.RECEIVER_LEFT, { socketId: socket.id });
    });

    // WebRTC Signaling - relay offer from sender to receiver
    socket.on(EVENTS.WEBRTC_OFFER, (data: { roomId: string; offer: any; targetSocketId: string }) => {
      // Relay the offer to the specific target socket
      ioInstance.to(data.targetSocketId).emit(EVENTS.WEBRTC_OFFER, {
        offer: data.offer,
        senderSocketId: socket.id,
      });
      logger.debug(`WebRTC offer relayed from ${socket.id} to ${data.targetSocketId}`);
    });

    socket.on(EVENTS.WEBRTC_ANSWER, (data: { roomId: string; answer: any; targetSocketId: string }) => {
      ioInstance.to(data.targetSocketId).emit(EVENTS.WEBRTC_ANSWER, {
        answer: data.answer,
        receiverSocketId: socket.id,
      });
      logger.debug(`WebRTC answer relayed from ${socket.id} to ${data.targetSocketId}`);
    });

    socket.on(EVENTS.WEBRTC_ICE_CANDIDATE, (data: { candidate: any; targetSocketId: string }) => {
      ioInstance.to(data.targetSocketId).emit(EVENTS.WEBRTC_ICE_CANDIDATE, {
        candidate: data.candidate,
        senderSocketId: socket.id,
      });
    });

    // Sender announces P2P readiness to the room
    socket.on(EVENTS.WEBRTC_READY, (roomId: string) => {
      socket.to(roomId).emit(EVENTS.WEBRTC_READY, { senderSocketId: socket.id });
      logger.debug(`Socket ${socket.id} announced WebRTC ready in room ${roomId}`);
    });

    socket.on(EVENTS.WEBRTC_REJECTED, (data: { targetSocketId: string }) => {
      ioInstance.to(data.targetSocketId).emit(EVENTS.WEBRTC_REJECTED, { receiverSocketId: socket.id });
    });

    socket.on(EVENTS.DOWNLOAD_STARTED, (roomId: string) => {
      socket.to(roomId).emit(EVENTS.DOWNLOAD_STARTED, { timestamp: new Date() });
      logger.info(`Download started in socket room ${roomId}`);
    });

    socket.on(EVENTS.DOWNLOAD_COMPLETED, async (roomId: string) => {
      logger.info(`Download completed in socket room ${roomId}`);
      const result = await shareService.recordDownload(roomId);
      ioInstance.to(roomId).emit(EVENTS.DOWNLOAD_COMPLETED, {
        timestamp: new Date(),
        downloadCount: result?.downloadCount || 1,
        maxDownloads: result?.maxDownloads || 1,
        isFullyCompleted: result?.isFullyCompleted ?? true,
      });
    });

    socket.on("disconnecting", () => {
      // socket.rooms contains the rooms the socket is in
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit(EVENTS.RECEIVER_LEFT, { socketId: socket.id });
        }
      }
    });

    socket.on("disconnect", () => {
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};
