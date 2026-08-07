// ============================================
// FlashShare — Shared Package Entry Point
// ============================================

// Types
export type {
  ShareStatus,
  AutoDeletePolicy,
  TransferMode,
  ShareSettings,
  ShareMeta,
  FileMeta,
  FilePreviewMeta,
} from './types/share.js';

export type {
  ServerToClientEvents,
  ClientToServerEvents,
} from './types/socket-events.js';

export type {
  ApiResponse,
  ApiError,
  PaginationMeta,
  CreateShareRequest,
  CreateShareResponse,
  RegisterFileRequest,
  RegisterFileResponse,
  VerifyPasswordRequest,
  VerifyPasswordResponse,
  ShareAnalytics,
  DownloadRecord,
  AdminStats,
} from './types/api.js';

// Constants
export {
  MAX_FILE_SIZE,
  CHUNK_SIZE,
  MAX_CONCURRENT_UPLOADS,
  MAX_CONCURRENT_DOWNLOADS,
  WEBRTC_CHUNK_SIZE,
  WEBRTC_BUFFER_THRESHOLD,
  EXPIRATION_PRESETS,
  MAX_DOWNLOAD_PRESETS,
  AUTO_DELETE_OPTIONS,
  PREVIEWABLE_TYPES,
  SHARE_STATUS_LABELS,
} from './constants.js';
