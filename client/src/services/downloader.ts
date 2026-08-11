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
  // Method 1: Native FileSystem Access API (Zero RAM Disk Streaming for Desktop & Supported Mobile Browsers)
  if ('showSaveFilePicker' in window && fileSize > 50 * 1024 * 1024) {
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
        let chunkData: Uint8Array | null = new Uint8Array(buffer);

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

        downloadedSize += chunkData.length;
        downloadedChunksCount++;
        chunkData = null; // Free chunk memory immediately

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
      console.warn('Direct save file picker unavailable or failed, falling back to ReadableStream:', err);
    }
  }

  // Method 2: ReadableStream -> Response.blob() (Low-RAM Sequential Stream for Mobile Browsers)
  let downloadedChunksCount = 0;
  let downloadedSize = 0;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let i = 0; i < chunkCount; i++) {
          const response = await fetch(`${API_BASE}/shares/${token}/files/${fileId}/chunks/${i}`);
          if (!response.ok) {
            throw new Error(`Failed to download chunk ${i}`);
          }

          const buffer = await response.arrayBuffer();
          let chunkData: Uint8Array | null = new Uint8Array(buffer);

          if (encryptionKey) {
            const iv = new Uint8Array(chunkData.slice(0, 12));
            const ciphertext = chunkData.slice(12);
            const decryptedBuffer = await decryptChunk(ciphertext.buffer as ArrayBuffer, encryptionKey, iv);
            chunkData = new Uint8Array(decryptedBuffer);
          }

          downloadedSize += chunkData.length;
          downloadedChunksCount++;

          controller.enqueue(chunkData);
          chunkData = null; // Free chunk memory immediately after enqueueing to native C++ engine

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
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });

  const responseStream = new Response(stream);
  const blob = await responseStream.blob();

  // Ensure file extension is present in fileName
  let targetFileName = fileName || 'download';
  if (!targetFileName.includes('.') && mimeType) {
    if (mimeType.includes('matroska') || mimeType.includes('mkv')) targetFileName += '.mkv';
    else if (mimeType.includes('mp4')) targetFileName += '.mp4';
    else if (mimeType.includes('pdf')) targetFileName += '.pdf';
    else if (mimeType.includes('zip')) targetFileName += '.zip';
  }

  // Create Blob URL with explicit mimeType for Android Download Manager registration
  const typedBlob = new Blob([blob], { type: mimeType || 'application/octet-stream' });
  const url = URL.createObjectURL(typedBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = targetFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Keep Blob URL alive long enough for mobile OS to finish writing to disk
  setTimeout(() => URL.revokeObjectURL(url), 60000);
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
  let downloadedChunksCount = 0;
  let downloadedSize = 0;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let i = 0; i < chunkCount; i++) {
          const response = await fetch(`${API_BASE}/shares/${token}/files/${fileId}/chunks/${i}`);
          if (!response.ok) throw new Error(`Failed to download chunk ${i}`);

          const buffer = await response.arrayBuffer();
          let chunkData: Uint8Array | null = new Uint8Array(buffer);

          if (encryptionKey) {
            const iv = new Uint8Array(chunkData.slice(0, 12));
            const ciphertext = chunkData.slice(12);
            const decryptedBuffer = await decryptChunk(ciphertext.buffer as ArrayBuffer, encryptionKey, iv);
            chunkData = new Uint8Array(decryptedBuffer);
          }

          downloadedSize += chunkData.length;
          downloadedChunksCount++;

          controller.enqueue(chunkData);
          chunkData = null;

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
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });

  const responseStream = new Response(stream);
  return await responseStream.blob();
}
