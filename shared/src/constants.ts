// ============================================
// FlashShare — Shared Constants
// ============================================

/** Maximum file size: 50 GB */
export const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024;

/** Chunk size for uploads: 5 MB */
export const CHUNK_SIZE = 5 * 1024 * 1024;

/** Maximum concurrent chunk uploads */
export const MAX_CONCURRENT_UPLOADS = 10;

/** Maximum concurrent chunk downloads */
export const MAX_CONCURRENT_DOWNLOADS = 6;

/** WebRTC data channel chunk size: 16 KB */
export const WEBRTC_CHUNK_SIZE = 16 * 1024;

/** WebRTC buffer threshold: 1 MB */
export const WEBRTC_BUFFER_THRESHOLD = 1024 * 1024;

/** Expiration presets (minutes) */
export const EXPIRATION_PRESETS = [
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '6 hours', value: 360 },
  { label: '24 hours', value: 1440 },
] as const;

/** Max download presets */
export const MAX_DOWNLOAD_PRESETS = [
  { label: '1 download', value: 1 },
  { label: '5 downloads', value: 5 },
  { label: '10 downloads', value: 10 },
  { label: 'Unlimited', value: -1 },
] as const;

/** Auto-delete policy options */
export const AUTO_DELETE_OPTIONS = [
  { label: 'After download', value: 'after_download' },
  { label: 'After expiry', value: 'after_expiry' },
  { label: 'Manual', value: 'manual' },
] as const;

/** Supported MIME types for preview */
export const PREVIEWABLE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  pdf: ['application/pdf'],
  text: ['text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json'],
  zip: ['application/zip', 'application/x-zip-compressed'],
} as const;

/** Share status display labels */
export const SHARE_STATUS_LABELS = {
  pending: 'Uploading...',
  active: 'Ready',
  expired: 'Expired',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const;
