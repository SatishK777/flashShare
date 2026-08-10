export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';
export const SERVER_URL = import.meta.env.VITE_API_URL || '/';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.error?.message || error.message || 'Request failed');
  }
  return res.json();
}

export const api = {
  createShare: (settings: any) => request<any>('/shares', { method: 'POST', body: JSON.stringify({ settings }) }),
  registerFile: (shareId: string, file: any) => request<any>(`/shares/${shareId}/files`, { method: 'POST', body: JSON.stringify(file) }),
  uploadChunk: async (shareId: string, fileId: string, chunkIndex: number, data: ArrayBuffer) => {
    const res = await fetch(`${API_BASE}/shares/${shareId}/files/${fileId}/chunks?index=${chunkIndex}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: data,
    });
    if (!res.ok) throw new Error('Chunk upload failed');
    return res.json();
  },
  finalizeShare: (shareId: string) => request<any>(`/shares/${shareId}/finalize`, { method: 'POST' }),
  cancelShare: (shareId: string) => request<any>(`/shares/${shareId}`, { method: 'DELETE' }),
};
