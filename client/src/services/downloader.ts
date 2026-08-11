import { decryptChunk } from './encryption';
import { API_BASE } from './api';

export interface DownloadProgress {
  fileId?: string;
  fileName: string;
  totalChunks: number;
  downloadedChunks: number;
  totalSize: number;
  downloadedSize: number;
  status: 'pending' | 'downloading' | 'decrypting' | 'completed' | 'failed' | 'error';
}

const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_CONCURRENT_DOWNLOADS = 6;

export async function downloadAndSaveFile(
  token: string,
  fileId: string,
  fileName: string,
  fileSize: number,
  chunkCount: number,
  mimeType: string,
  encryptionKey: CryptoKey | null,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  // Check if Native FileSystem Access API is supported for direct zero-RAM disk streaming
  const canStreamToDisk = 'showSaveFilePicker' in window && fileSize > 100 * 1024 * 1024;

  if (canStreamToDisk) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
      });
      const writable = await handle.createWritable();

      let downloadedChunksCount = 0;
      let downloadedSize = 0;

      for (let i = 0; i < chunkCount; i++) {
        const response = await fetch(`${API_BASE}/shares/${token}/files/${fileId}/chunks/${i}`);
        if (!response.ok) throw new Error(`Failed to download chunk ${i}`);

        const buffer = await response.arrayBuffer();
        let chunkData = new Uint8Array(buffer);

        if (encryptionKey) {
          const iv = new Uint8Array(chunkData.slice(0, 12));
          const ciphertext = chunkData.slice(12);
          const decryptedBuffer = await decryptChunk(ciphertext.buffer as ArrayBuffer, encryptionKey, iv);
          chunkData = new Uint8Array(decryptedBuffer);
        }

        await writable.write({
          type: 'write',
          position: i * CHUNK_SIZE,
          data: chunkData,
        });

        downloadedChunksCount++;
        downloadedSize += chunkData.length;

        onProgress?.({
          fileId,
          fileName,
          totalChunks: chunkCount,
          downloadedChunks: downloadedChunksCount,
          totalSize: fileSize,
          downloadedSize,
          status: downloadedChunksCount === chunkCount ? 'completed' : 'downloading',
        });
      }

      await writable.close();
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Save cancelled by user');
      }
      console.warn('Direct stream to disk failed, falling back to memory download:', err);
    }
  }

  // Fallback to parallel memory Blob download with explicit MIME type
  const downloadedChunksArr = new Array<Uint8Array>(chunkCount);
  let downloadedChunksCount = 0;
  let downloadedSize = 0;

  const queue = Array.from({ length: chunkCount }, (_, i) => i);
  let hasFailed = false;
  let failureError: any = null;

  async function worker() {
    while (queue.length > 0 && !hasFailed) {
      const i = queue.shift();
      if (i === undefined) break;

      try {
        const response = await fetch(`${API_BASE}/shares/${token}/files/${fileId}/chunks/${i}`);
        if (!response.ok) {
          throw new Error(`Failed to download chunk ${i}`);
        }

        const buffer = await response.arrayBuffer();
        let chunkData = new Uint8Array(buffer);

        if (encryptionKey) {
          const iv = new Uint8Array(chunkData.slice(0, 12));
          const ciphertext = chunkData.slice(12);
          const decryptedBuffer = await decryptChunk(ciphertext.buffer as ArrayBuffer, encryptionKey, iv);
          chunkData = new Uint8Array(decryptedBuffer);
        }

        downloadedChunksArr[i] = chunkData;
        downloadedChunksCount++;
        downloadedSize += chunkData.length;

        onProgress?.({
          fileId,
          fileName,
          totalChunks: chunkCount,
          downloadedChunks: downloadedChunksCount,
          totalSize: fileSize,
          downloadedSize,
          status: downloadedChunksCount === chunkCount ? 'completed' : 'downloading',
        });
      } catch (error) {
        hasFailed = true;
        failureError = error;
        throw error;
      }
    }
  }

  const workerCount = Math.min(MAX_CONCURRENT_DOWNLOADS, chunkCount);
  const workers = Array.from({ length: workerCount }, () => worker());

  await Promise.all(workers);

  if (hasFailed) {
    onProgress?.({
      fileId,
      fileName,
      totalChunks: chunkCount,
      downloadedChunks: downloadedChunksCount,
      totalSize: fileSize,
      downloadedSize,
      status: 'failed',
    });
    throw failureError || new Error('Download failed');
  }

  // Create Blob with explicit mimeType for proper OS file registration
  const blob = new Blob(downloadedChunksArr as BlobPart[], { type: mimeType || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Keep backward compatibility export
export async function downloadAndDecryptFile(
  token: string,
  fileId: string,
  fileName: string,
  fileSize: number,
  chunkCount: number,
  encryptionKey: CryptoKey | null,
  onProgress?: (progress: DownloadProgress) => void
): Promise<Blob> {
  const downloadedChunksArr = new Array<Uint8Array>(chunkCount);
  let downloadedChunksCount = 0;
  let downloadedSize = 0;

  const queue = Array.from({ length: chunkCount }, (_, i) => i);
  let hasFailed = false;
  let failureError: any = null;

  async function worker() {
    while (queue.length > 0 && !hasFailed) {
      const i = queue.shift();
      if (i === undefined) break;

      try {
        const response = await fetch(`${API_BASE}/shares/${token}/files/${fileId}/chunks/${i}`);
        if (!response.ok) {
          throw new Error(`Failed to download chunk ${i}`);
        }

        const buffer = await response.arrayBuffer();
        let chunkData = new Uint8Array(buffer);

        if (encryptionKey) {
          const iv = new Uint8Array(chunkData.slice(0, 12));
          const ciphertext = chunkData.slice(12);
          const decryptedBuffer = await decryptChunk(ciphertext.buffer as ArrayBuffer, encryptionKey, iv);
          chunkData = new Uint8Array(decryptedBuffer);
        }

        downloadedChunksArr[i] = chunkData;
        downloadedChunksCount++;
        downloadedSize += chunkData.length;

        onProgress?.({
          fileId,
          fileName,
          totalChunks: chunkCount,
          downloadedChunks: downloadedChunksCount,
          totalSize: fileSize,
          downloadedSize,
          status: downloadedChunksCount === chunkCount ? 'completed' : 'downloading',
        });
      } catch (error) {
        hasFailed = true;
        failureError = error;
        throw error;
      }
    }
  }

  const workerCount = Math.min(MAX_CONCURRENT_DOWNLOADS, chunkCount);
  const workers = Array.from({ length: workerCount }, () => worker());

  await Promise.all(workers);

  if (hasFailed) {
    throw failureError || new Error('Download failed');
  }

  return new Blob(downloadedChunksArr as BlobPart[]);
}
