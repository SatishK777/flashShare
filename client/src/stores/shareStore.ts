import { create } from 'zustand';

export interface ShareSettings {
  expiresInMinutes: number;
  maxDownloads: number;
  showFilenames: boolean;
  autoDeletePolicy: 'after_download' | 'after_expiry' | 'manual';
  password?: string;
}

interface ShareState {
  shareId: string | null;
  token: string | null;
  encryptionKey: string | null;
  shareUrl: string | null;
  expiresAt: string | null;
  status: 'idle' | 'creating' | 'uploading' | 'finalizing' | 'ready' | 'error';
  error: string | null;
  settings: ShareSettings;
  setSettings: (settings: Partial<ShareSettings>) => void;
  setShare: (data: { shareId: string; token: string; encryptionKey: string; expiresAt: string }) => void;
  setStatus: (status: ShareState['status']) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const defaultSettings: ShareSettings = {
  expiresInMinutes: 60,
  maxDownloads: 5,
  showFilenames: true,
  autoDeletePolicy: 'after_expiry',
};

export const useShareStore = create<ShareState>((set) => ({
  shareId: null,
  token: null,
  encryptionKey: null,
  shareUrl: null,
  expiresAt: null,
  status: 'idle',
  error: null,
  settings: defaultSettings,
  
  setSettings: (newSettings) => set((state) => ({ 
    settings: { ...state.settings, ...newSettings } 
  })),
  
  setShare: ({ shareId, token, encryptionKey, expiresAt }) => {
    const shareUrl = `${window.location.origin}/s/${token}#${encryptionKey}`;
    set({ shareId, token, encryptionKey, expiresAt, shareUrl });
  },
  
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: 'error' }),
  
  reset: () => set({
    shareId: null,
    token: null,
    encryptionKey: null,
    shareUrl: null,
    expiresAt: null,
    status: 'idle',
    error: null,
    settings: defaultSettings
  }),
}));
