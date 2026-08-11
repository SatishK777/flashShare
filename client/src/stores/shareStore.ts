import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  createdShareTokens: string[];
  status: 'idle' | 'creating' | 'uploading' | 'finalizing' | 'ready' | 'error';
  error: string | null;
  settings: ShareSettings;
  setSettings: (settings: Partial<ShareSettings>) => void;
  setShare: (data: { shareId: string; token: string; encryptionKey: string; expiresAt: string }) => void;
  addCreatedToken: (tokenOrId: string) => void;
  removeCreatedToken: (tokenOrId: string) => void;
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

export const useShareStore = create<ShareState>()(
  persist(
    (set) => ({
      shareId: null,
      token: null,
      encryptionKey: null,
      shareUrl: null,
      expiresAt: null,
      createdShareTokens: [],
      status: 'idle',
      error: null,
      settings: defaultSettings,

      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      setShare: ({ shareId, token, encryptionKey, expiresAt }) => {
        const shareUrl = `${window.location.origin}/#/s/${token}#${encryptionKey}`;
        set((state) => {
          const tokens = new Set([...(state.createdShareTokens || []), token, shareId]);
          return {
            shareId,
            token,
            encryptionKey,
            expiresAt,
            shareUrl,
            createdShareTokens: Array.from(tokens),
          };
        });
      },

      addCreatedToken: (tokenOrId) =>
        set((state) => ({
          createdShareTokens: Array.from(new Set([...(state.createdShareTokens || []), tokenOrId])),
        })),

      removeCreatedToken: (tokenOrId) =>
        set((state) => ({
          createdShareTokens: (state.createdShareTokens || []).filter((t) => t !== tokenOrId),
        })),

      setStatus: (status) => set({ status }),
      setError: (error) => set({ error, status: 'error' }),

      reset: () =>
        set((state) => ({
          shareId: null,
          token: null,
          encryptionKey: null,
          shareUrl: null,
          expiresAt: null,
          status: 'idle',
          error: null,
          settings: defaultSettings,
          createdShareTokens: state.createdShareTokens || [],
        })),
    }),
    {
      name: 'flashshare-active-share',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        shareId: state.status === 'ready' ? state.shareId : null,
        token: state.status === 'ready' ? state.token : null,
        encryptionKey: state.status === 'ready' ? state.encryptionKey : null,
        shareUrl: state.status === 'ready' ? state.shareUrl : null,
        expiresAt: state.status === 'ready' ? state.expiresAt : null,
        createdShareTokens: state.createdShareTokens || [],
        status: state.status === 'ready' ? 'ready' : 'idle',
        settings: state.settings,
      }),
    }
  )
);
