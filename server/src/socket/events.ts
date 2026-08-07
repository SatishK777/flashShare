// Socket events
export const EVENTS = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  TRANSFER_PROGRESS: 'transfer_progress',
  TRANSFER_COMPLETE: 'transfer_complete',
  TRANSFER_ERROR: 'transfer_error',
  SHARE_EXPIRED: 'share_expired',
  RECEIVER_JOINED: 'receiver_joined',
  RECEIVER_LEFT: 'receiver_left', 
  DOWNLOAD_STARTED: 'download_started',
  DOWNLOAD_PROGRESS: 'download_progress',
  DOWNLOAD_COMPLETED: 'download_completed',
  // WebRTC Signaling
  WEBRTC_OFFER: 'webrtc_offer',
  WEBRTC_ANSWER: 'webrtc_answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc_ice_candidate',
  WEBRTC_READY: 'webrtc_ready',
  WEBRTC_REJECTED: 'webrtc_rejected',
};
