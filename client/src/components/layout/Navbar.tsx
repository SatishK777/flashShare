import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../common/ThemeToggle';
import { Menu, X, BarChart3, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Create Share', path: '/create' },
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'glass-strong border-b border-[var(--border-glass)] shadow-2xl shadow-black/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="nav-shell">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 rounded-lg gradient-bg glow shadow-lg text-white group-hover:scale-105 transition-all duration-300">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="font-display font-extrabold text-xl md:text-2xl tracking-tight text-[var(--text-primary)]">
            Flash<span className="gradient-text">Share</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="nav-menu desktop-nav font-medium">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.name}
                to={link.path} 
                className={`nav-link ${
                  isActive ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                {Icon && <Icon className="w-4 h-4" />}
                {link.name}
                </span>
              </Link>
            );
          })}
          
          <div className="w-px h-6 bg-[var(--border-glass)] mx-1.5"></div>
          
          <ThemeToggle />
        </nav>

        {/* Mobile Toggle */}
        <div className="mobile-nav-actions items-center gap-4">
          <div className="glass p-1 rounded-md border-[var(--border-glass)]">
            <ThemeToggle />
          </div>
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="p-2.5 glass rounded-lg text-[var(--text-primary)] border-[var(--border-glass)]"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed inset-x-4 top-4 z-50 glass-strong border border-[var(--border-glass)] rounded-lg p-6 shadow-2xl md:hidden flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <span className="font-display font-bold text-xl text-[var(--text-primary)]">Menu</span>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                className="p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--border-primary)] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-4 text-xl font-display font-semibold">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;
                
                return (
                  <Link 
                    key={link.name}
                    to={link.path} 
                    onClick={() => setMobileMenuOpen(false)} 
                    className={`flex items-center gap-3 p-4 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20' 
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-transparent'
                    }`}
                  >
                    {Icon && <Icon className="w-6 h-6" />}
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
