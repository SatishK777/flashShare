import { create } from 'zustand';

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  progress: number;
  speed: number;
  eta: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'encrypting';
  serverFileId?: string;
}

interface UploadState {
  files: FileItem[];
  overallProgress: number;
  isUploading: boolean;
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  updateFileProgress: (id: string, progress: Partial<FileItem>) => void;
  setUploading: (uploading: boolean) => void;
  totalSize: () => number;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  files: [],
  overallProgress: 0,
  isUploading: false,
  
  addFiles: (newFiles: File[]) => {
    const fileItems: FileItem[] = newFiles.map(file => {
      let preview;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
      return {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        progress: 0,
        speed: 0,
        eta: 0,
        status: 'pending',
      };
    });
    set(state => ({ files: [...state.files, ...fileItems] }));
  },
  
  removeFile: (id: string) => {
    set(state => {
      const file = state.files.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return { files: state.files.filter(f => f.id !== id) };
    });
  },
  
  clearFiles: () => {
    set(state => {
      state.files.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      return { files: [], overallProgress: 0 };
    });
  },
  
  updateFileProgress: (id: string, progress: Partial<FileItem>) => {
    set(state => {
      const files = state.files.map(f => f.id === id ? { ...f, ...progress } : f);
      
      const totalSize = files.reduce((acc, f) => acc + f.size, 0);
      const totalUploaded = files.reduce((acc, f) => acc + (f.size * f.progress / 100), 0);
      const overallProgress = totalSize > 0 ? (totalUploaded / totalSize) * 100 : 0;
      
      return { files, overallProgress };
    });
  },
  
  setUploading: (isUploading: boolean) => set({ isUploading }),
  
  totalSize: () => get().files.reduce((acc, f) => acc + f.size, 0),
}));
