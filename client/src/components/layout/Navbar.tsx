import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../common/ThemeToggle';
import { Menu, X, BarChart3, QrCode, Home, PlusCircle, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
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

  // Prevent background body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Create Share', path: '/create', icon: PlusCircle },
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className={`fixed top-0 w-full z-40 transition-all duration-500 ${
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
          <div className="mobile-nav-actions items-center gap-3">
            <div className="glass p-1 rounded-md border-[var(--border-glass)]">
              <ThemeToggle />
            </div>
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="p-2.5 glass rounded-lg text-[var(--text-primary)] border-[var(--border-glass)] hover:bg-[var(--bg-tertiary)] active:scale-95 transition-all"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer Overlay & Sheet */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md md:hidden"
            />

            {/* Slide Down Sheet */}
            <motion.div
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="mobile-nav-drawer md:hidden"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center pb-4 border-b border-[var(--border-primary)]">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
                  <div className="p-2 rounded-lg gradient-bg text-white shadow-md">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <span className="font-display font-bold text-xl text-[var(--text-primary)]">
                    Flash<span className="gradient-text">Share</span>
                  </span>
                </Link>
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="p-2 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] active:scale-95 transition-all"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav Links */}
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  const Icon = link.icon;
                  
                  return (
                    <Link 
                      key={link.name}
                      to={link.path} 
                      onClick={() => setMobileMenuOpen(false)} 
                      className={`flex items-center justify-between p-3.5 rounded-xl transition-all font-display font-semibold ${
                        isActive 
                          ? 'bg-brand-500/10 text-brand-500 border border-brand-500/25 shadow-sm' 
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-brand-500/20 text-brand-400' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-base">{link.name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-brand-500' : 'text-[var(--text-tertiary)]'}`} />
                    </Link>
                  );
                })}
              </nav>

              {/* Bottom Quick Action & Badge */}
              <div className="pt-4 border-t border-[var(--border-primary)] flex flex-col gap-3">
                <Link to="/create" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full py-3.5 px-4 rounded-xl gradient-bg text-white font-bold font-display flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all">
                    <Sparkles className="w-5 h-5" />
                    Create New Share
                  </button>
                </Link>

                <div className="flex items-center justify-center gap-2 py-2 text-xs text-[var(--text-tertiary)] font-medium">
                  <ShieldCheck className="w-4 h-4 text-brand-500" />
                  <span>E2E Encrypted • Zero-Knowledge</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
