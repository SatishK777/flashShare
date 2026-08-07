// ============================================
// FlashShare — Shared Types: API
// ============================================

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Create share request */
export interface CreateShareRequest {
  settings: {
    expiresInMinutes: number;
    maxDownloads: number;
    password?: string;
    showFilenames: boolean;
    autoDeletePolicy: 'after_download' | 'after_expiry' | 'manual';
  };
}

/** Create share response */
export interface CreateShareResponse {
  id: string;
  token: string;
  uploadUrl: string;
  expiresAt: string;
}

/** Register file for upload */
export interface RegisterFileRequest {
  originalName: string;
  mimeType: string;
  size: number;
  checksumSha256: string;
  chunkCount: number;
  encryptionIv: string;
}

export interface RegisterFileResponse {
  fileId: string;
  uploadUrls: string[];
}

/** Verify password */
export interface VerifyPasswordRequest {
  password: string;
}

export interface VerifyPasswordResponse {
  valid: boolean;
  accessToken?: string;
}

/** Analytics */
export interface ShareAnalytics {
  totalScans: number;
  totalDownloads: number;
  failedDownloads: number;
  bandwidth: number;
  remainingTime: number;
  liveVisitors: number;
  downloads: DownloadRecord[];
}

export interface DownloadRecord {
  id: string;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  bytesDownloaded: number;
  startedAt: string;
  completedAt?: string;
  userAgent?: string;
}

/** Admin */
export interface AdminStats {
  activeShares: number;
  totalShares: number;
  totalDownloads: number;
  totalBandwidth: number;
  storageUsed: number;
}
