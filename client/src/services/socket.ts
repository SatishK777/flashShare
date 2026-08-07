import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from './api';

let socket: Socket | null = null;

export const SOCKET_EVENTS = {
  WEBRTC_OFFER: 'webrtc_offer',
  WEBRTC_ANSWER: 'webrtc_answer', 
  WEBRTC_ICE_CANDIDATE: 'webrtc_ice_candidate',
  WEBRTC_READY: 'webrtc_ready',
  WEBRTC_REJECTED: 'webrtc_rejected',
  RECEIVER_JOINED: 'receiver_joined',
  DOWNLOAD_STARTED: 'download_started',
  DOWNLOAD_COMPLETED: 'download_completed',
} as const;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
}

export function joinRoom(roomId: string) {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('join_room', roomId);
}

export function leaveRoom(roomId: string) {
  const s = getSocket();
  s.emit('leave_room', roomId);
}
