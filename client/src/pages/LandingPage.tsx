import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Upload, QrCode, Download, Shield, Wifi, RefreshCw, HardDrive, Timer, Activity, ArrowRight, CheckCircle2, QrCode as QrCodeIcon, Play, X } from 'lucide-react';
import { Button } from '../components/ui/button';


const FadeIn = ({ children, delay = 0, yOffset = 30 }: { children: React.ReactNode, delay?: number, yOffset?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
};

export const LandingPage: React.FC = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <div className="flex flex-col w-full min-h-screen">
      <div className="ambient-bg"></div>
      <div className="noise-overlay"></div>
      
      {/* Video Modal */}
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md cursor-pointer"
            onClick={() => setIsVideoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl bg-bg-primary border border-border-primary/80 rounded-2xl overflow-hidden shadow-2xl premium-ring cursor-default flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary/60 bg-bg-secondary/60">
                <div className="flex items-center gap-2.5 font-bold text-text-primary text-sm font-display">
                  <Play size={16} className="text-brand-400 fill-brand-400" />
                  <span>FlashShare Demo Walkthrough</span>
                </div>
                <button
                  onClick={() => setIsVideoOpen(false)}
                  className="p-1.5 rounded-xl bg-bg-secondary hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors border border-border-primary/50 cursor-pointer"
                  title="Close Video"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Video Player */}
              <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                <video
                  src="/videos/flashshare_demo.mp4"
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hero Section */}
      <section className="landing-hero relative overflow-hidden z-10">
        <div className="page-container text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="hero-status-badge mb-10">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
              </span>
              <span>FlashShare v1.0 is live</span>
            </div>
          </motion.div>

          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            Secure file sharing.<br className="hidden md:block" />
            <span className="gradient-text">Built for speed.</span>
          </motion.h1>

          <motion.p 
            className="hero-copy"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            Drop files, generate a private QR code, and move data between devices with encryption, clear status, and zero account friction.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <Link to="/create" className="w-full sm:w-auto">
              <Button size="lg" className="hero-button h-14 text-base font-bold rounded-lg w-full sm:w-auto gradient-bg border-0 glow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-2xl text-white">
                Start Sharing <ArrowRight className="ml-3 w-5 h-5" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => setIsVideoOpen(true)}
              className="hero-button h-14 text-base font-semibold rounded-lg w-full sm:w-auto glass-strong hover:bg-[var(--bg-tertiary)] border-[var(--border-glass)] text-[var(--text-primary)] transition-all duration-300 gap-2"
            >
              <Play size={18} className="text-brand-400 fill-brand-400/20" />
              <span>See How It Works</span>
            </Button>
          </motion.div>
        </div>

        {/* Floating QR Mockup */}
        <motion.div
          className="mt-16 w-full max-w-md mx-auto perspective-1000 z-10 hidden md:block"
          initial={{ opacity: 0, y: 50, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
        >
          <div className="glass-strong p-8 rounded-lg glow-lg mx-auto w-64 h-64 flex flex-col items-center justify-center border-[var(--border-glass)] transform hover:-translate-y-2 transition-transform duration-500 premium-ring">
            <QrCodeIcon className="w-32 h-32 text-brand-400" />
            <div className="mt-4 text-[var(--text-secondary)] font-semibold text-sm tracking-wide">SCAN TO DOWNLOAD</div>
          </div>
        </motion.div>
      </section>

      {/* How it Works */}
      <section className="landing-section bg-[var(--bg-secondary)] relative z-10">
        <div className="page-container">
          <div className="section-heading">
            <h2>Transfer in three steps</h2>
            <p>A focused workflow for quick, private movement between devices without extra setup.</p>
          </div>

          <div className="steps-grid relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-1 bg-gradient-to-r from-transparent via-brand-500/50 to-transparent -translate-y-1/2 z-0"></div>
            
            {[
              { icon: Upload, step: '01', title: 'Drop your files', desc: 'Select or drag & drop any file directly into your browser window.' },
              { icon: QrCode, step: '02', title: 'Share the QR code', desc: 'A unique, secure QR code is generated instantly for your transfer.' },
              { icon: Download, step: '03', title: 'Download instantly', desc: 'Scan the code with any device to start the peer-to-peer transfer.' }
            ].map((step, idx) => (
              <FadeIn key={idx} delay={idx * 0.2}>
                <div className="step-card relative z-10 glass-strong p-6 text-center h-full flex flex-col items-center hover:-translate-y-2 transition-transform duration-500 hover:glow-lg premium-ring">
                  <div className="absolute top-5 left-6 text-5xl font-black text-[var(--border-glass)] opacity-30 pointer-events-none font-display">
                    {step.step}
                  </div>
                  <div className="w-14 h-14 rounded-lg gradient-bg text-white flex items-center justify-center mb-5 shadow-2xl shadow-brand-500/30 mt-2">
                    <step.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">{step.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="landing-section relative z-10 bg-[var(--bg-primary)]">
        <div className="page-container-wide">
          <div className="section-heading">
            <h2>Built for speed and security</h2>
            <p>Professional transfer basics: encryption, direct handoff, resumable downloads, and live feedback.</p>
          </div>

          <div className="features-grid">
            {[
              { icon: Shield, title: 'End-to-End Encrypted', desc: 'Your files are encrypted in the browser before being transferred. We never see your data.' },
              { icon: Wifi, title: 'Peer-to-Peer Transfer', desc: 'Files go directly from device to device when on the same network for lightning speeds.' },
              { icon: RefreshCw, title: 'Resume Downloads', desc: 'Connection dropped? Pick up right where you left off without restarting the transfer.' },
              { icon: HardDrive, title: 'No Size Limits', desc: 'Share 1MB or 50GB. The only limit is your local storage space.' },
              { icon: Timer, title: 'Self Destructing', desc: 'Transfer links and data automatically expire after the transfer is complete.' },
              { icon: Activity, title: 'Real-Time Status', desc: 'Watch the transfer progress live on both devices with detailed metrics.' }
            ].map((feat, idx) => (
              <FadeIn key={idx} delay={idx * 0.1}>
                <div className="feature-card h-full glass p-6 hover:border-brand-500/40 hover:glow-lg transition-all duration-500 group">
                  <div className="w-11 h-11 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center mb-5 group-hover:scale-105 group-hover:bg-brand-500/10 transition-all duration-300 border border-[var(--border-glass)]">
                    <feat.icon className="w-6 h-6 text-brand-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">{feat.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{feat.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-section relative z-10 bg-[var(--bg-secondary)]">
        <div className="page-container">
          <FadeIn>
            <div className="cta-panel relative overflow-hidden premium-ring">
              <div className="cta-content">
                <div className="cta-copy">
                  <h2>Ready to share?</h2>
                  <p>Create a secure transfer link in seconds with private QR access, browser-side encryption, and no account setup.</p>
                </div>

                <div className="cta-actions">
                  <Link to="/create">
                    <Button size="lg" className="cta-button h-14 w-full text-lg font-bold rounded-lg gradient-bg border-0 glow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-2xl text-white">
                      Get Started Now
                    </Button>
                  </Link>
                  <div className="cta-badges">
                    <span className="cta-badge"><CheckCircle2 className="w-4 h-4 text-brand-500" /> Free forever</span>
                    <span className="cta-badge"><CheckCircle2 className="w-4 h-4 text-brand-500" /> No credit card</span>
                    <span className="cta-badge"><CheckCircle2 className="w-4 h-4 text-brand-500" /> Open source</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
};
