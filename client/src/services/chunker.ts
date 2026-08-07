import { api } from './api';
import { encryptChunk } from './encryption';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CONCURRENT_UPLOADS = 6;

export interface ChunkUploadProgress {
  fileId: string;
  fileName: string;
  totalChunks: number;
  uploadedChunks: number;
  totalSize: number;
  uploadedSize: number;
  speed: number;
  eta: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

export async function uploadFileInChunks(
  shareId: string,
  fileId: string,
  file: File,
  encryptionKey: CryptoKey | null,
  onProgress: (progress: ChunkUploadProgress) => void,
  signal?: AbortSignal
): Promise<void> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let uploadedChunks = 0;
  let uploadedSize = 0;
  const startTime = Date.now();

  const getProgress = (): ChunkUploadProgress => {
    const elapsed = (Date.now() - startTime) / 1000;
    const speed = uploadedSize / elapsed || 0;
    const remaining = file.size - uploadedSize;
    const eta = speed > 0 ? remaining / speed : 0;
    
    return {
      fileId,
      fileName: file.name,
      totalChunks,
      uploadedChunks,
      totalSize: file.size,
      uploadedSize,
      speed,
      eta,
      status: uploadedChunks === totalChunks ? 'completed' : 'uploading'
    };
  };

  const queue = Array.from({ length: totalChunks }, (_, i) => i);
  let hasFailed = false;

  async function worker() {
    while (queue.length > 0 && !hasFailed && !signal?.aborted) {
      const chunkIndex = queue.shift();
      if (chunkIndex === undefined) break;

      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const buffer = await chunk.arrayBuffer();

      let dataToUpload = buffer;
      
      
      if (encryptionKey) {
        const { ciphertext, iv } = await encryptChunk(buffer, encryptionKey);
        // Prepend IV to ciphertext
        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(ciphertext), iv.length);
        dataToUpload = combined.buffer;
      }

      let retries = 3;
      while (retries > 0) {
        try {
          await api.uploadChunk(shareId, fileId, chunkIndex, dataToUpload);
          uploadedChunks++;
          uploadedSize += chunk.size;
          onProgress(getProgress());
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            hasFailed = true;
            throw error;
          }
          await new Promise(r => setTimeout(r, 1000 * (4 - retries)));
        }
      }
    }
  }

  const workers = Array.from({ length: Math.min(MAX_CONCURRENT_UPLOADS, totalChunks) }, worker);
  await Promise.all(workers);

  if (hasFailed) {
    throw new Error('File upload failed');
  }
}
