import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  init: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  resolvedTheme: 'light',
  
  setMode: (mode) => {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolvedTheme = mode === 'system' ? (isSystemDark ? 'dark' : 'light') : mode;

    set({ mode, resolvedTheme });

    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('theme', mode);
  },
  
  toggleTheme: () => {
    const { resolvedTheme } = get();
    get().setMode(resolvedTheme === 'light' ? 'dark' : 'light');
  },
  
  init: () => {
    const savedMode = localStorage.getItem('theme') as ThemeMode | null;
    const currentMode = get().mode;
    const mode = savedMode && ['light', 'dark', 'system'].includes(savedMode) ? savedMode : currentMode;
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const resolvedTheme = mode === 'system' ? (isSystemDark ? 'dark' : 'light') : mode;
    
    set({ mode, resolvedTheme });
    
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('theme', mode);
  }
}));

// Setup listener for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { mode, init } = useThemeStore.getState();
    if (mode === 'system') {
      init();
    }
  });
}
