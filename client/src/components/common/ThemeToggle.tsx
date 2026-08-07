import React from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export const ThemeToggle: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle transition-colors outline-none focus:ring-2 focus:ring-brand-500"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        className="flex items-center justify-center"
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {isDark ? (
          <Moon className="text-brand-300" />
        ) : (
          <Sun className="text-accent-500" />
        )}
      </motion.div>
    </button>
  );
};
