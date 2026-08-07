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

export async function downloadAndDecryptFile(
  token: string,
  fileId: string,
  fileName: string,
  fileSize: number,
  chunkCount: number,
  encryptionKey: CryptoKey | null,
  onProgress?: (progress: DownloadProgress) => void
): Promise<Blob> {
  const chunks: Uint8Array[] = [];
  let downloadedSize = 0;

  for (let i = 0; i < chunkCount; i++) {
    onProgress?.({
      fileId,
      fileName,
      totalChunks: chunkCount,
      downloadedChunks: i,
      totalSize: fileSize,
      downloadedSize,
      status: 'downloading',
    });

    try {
      const response = await fetch(`${API_BASE}/shares/${token}/files/${fileId}/chunks/${i}`);
      if (!response.ok) {
        throw new Error(`Failed to download chunk ${i}`);
      }

      const buffer = await response.arrayBuffer();
      let chunkData = new Uint8Array(buffer);

      onProgress?.({
        fileId,
        fileName,
        totalChunks: chunkCount,
        downloadedChunks: i + 1,
        totalSize: fileSize,
        downloadedSize: downloadedSize + chunkData.length,
        status: 'decrypting',
      });

      if (encryptionKey) {
        const iv = new Uint8Array(chunkData.slice(0, 12));
        const ciphertext = chunkData.slice(12);
        const decryptedBuffer = await decryptChunk(ciphertext.buffer as ArrayBuffer, encryptionKey, iv);
        chunkData = new Uint8Array(decryptedBuffer);
      }

      chunks.push(chunkData);
      downloadedSize += chunkData.length;
    } catch (error) {
      onProgress?.({
        fileId,
        fileName,
        totalChunks: chunkCount,
        downloadedChunks: i,
        totalSize: fileSize,
        downloadedSize,
        status: 'failed',
      });
      throw error;
    }
  }

  onProgress?.({
    fileId,
    fileName,
    totalChunks: chunkCount,
    downloadedChunks: chunkCount,
    totalSize: fileSize,
    downloadedSize,
    status: 'completed',
  });

  return new Blob(chunks as BlobPart[]);
}
