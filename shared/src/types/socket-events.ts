// ============================================
// FlashShare — Shared Types: Socket Events
// ============================================

export interface ServerToClientEvents {
  // Share lifecycle
  'share:status': (data: { shareId: string; status: string }) => void;
  'share:expired': (data: { shareId: string }) => void;

  // QR & receiver
  'qr:scanned': (data: { shareId: string; receiverId: string }) => void;
  'receiver:connected': (data: { shareId: string; receiverId: string }) => void;
  'receiver:disconnected': (data: { shareId: string; receiverId: string }) => void;

  // Download tracking
  'download:started': (data: {
    shareId: string;
    receiverId: string;
    downloadId: string;
  }) => void;
  'download:progress': (data: {
    shareId: string;
    downloadId: string;
    bytesDownloaded: number;
    totalBytes: number;
    speed: number;
  }) => void;
  'download:completed': (data: {
    shareId: string;
    downloadId: string;
    receiverId: string;
  }) => void;
  'download:failed': (data: {
    shareId: string;
    downloadId: string;
    error: string;
  }) => void;

  // WebRTC signaling
  'webrtc:offer': (data: { shareId: string; offer: RTCSessionDescriptionInit }) => void;
  'webrtc:answer': (data: { shareId: string; answer: RTCSessionDescriptionInit }) => void;
  'webrtc:ice-candidate': (data: {
    shareId: string;
    candidate: RTCIceCandidateInit;
  }) => void;

  // Analytics
  'analytics:live-visitors': (data: { shareId: string; count: number }) => void;

  // Errors
  'error': (data: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  // Room management
  'share:join': (data: { shareId: string; role: 'sender' | 'receiver' }) => void;
  'share:leave': (data: { shareId: string }) => void;

  // QR scanning
  'qr:scan': (data: { token: string }) => void;

  // Download
  'download:start': (data: { shareId: string }) => void;
  'download:progress': (data: {
    shareId: string;
    downloadId: string;
    bytesDownloaded: number;
    totalBytes: number;
    speed: number;
  }) => void;
  'download:complete': (data: { shareId: string; downloadId: string }) => void;

  // WebRTC signaling
  'webrtc:offer': (data: { shareId: string; offer: RTCSessionDescriptionInit }) => void;
  'webrtc:answer': (data: { shareId: string; answer: RTCSessionDescriptionInit }) => void;
  'webrtc:ice-candidate': (data: {
    shareId: string;
    candidate: RTCIceCandidateInit;
  }) => void;
}

// RTCSessionDescriptionInit and RTCIceCandidateInit are browser globals.
// For the server side, we re-declare minimal versions:
export interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp?: string;
}

export interface RTCIceCandidateInit {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}
