// ============================================
// FlashShare — Shared Types: Share
// ============================================

export type ShareStatus =
  | 'pending'      // Upload in progress
  | 'active'       // Ready for download
  | 'expired'      // Past expiration time
  | 'completed'    // All downloads done
  | 'cancelled';   // Manually cancelled

export type AutoDeletePolicy =
  | 'after_download'   // Delete immediately after successful download
  | 'after_expiry'     // Delete when share expires
  | 'manual';          // Keep until manually deleted

export type TransferMode =
  | 'cloud'    // Upload to storage, download from storage
  | 'p2p'      // Direct WebRTC transfer
  | 'hybrid';  // Started P2P, fell back to cloud

export interface ShareSettings {
  expiresInMinutes: number;
  maxDownloads: number;
  password?: string;
  showFilenames: boolean;
  autoDeletePolicy: AutoDeletePolicy;
}

export interface ShareMeta {
  id: string;
  token: string;
  status: ShareStatus;
  expiresAt: string;
  maxDownloads: number;
  downloadCount: number;
  showFilenames: boolean;
  hasPassword: boolean;
  autoDeletePolicy: AutoDeletePolicy;
  transferMode: TransferMode;
  totalSize: number;
  fileCount: number;
  createdAt: string;
}

export interface FileMeta {
  id: string;
  shareId: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksumSha256: string;
  chunkCount: number;
  status: 'uploading' | 'ready' | 'deleted';
  metadata?: FilePreviewMeta;
}

export interface FilePreviewMeta {
  width?: number;
  height?: number;
  duration?: number;
  pageCount?: number;
  entries?: string[];     // For ZIP files
  thumbnailUrl?: string;
}
