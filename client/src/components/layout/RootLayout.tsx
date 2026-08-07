import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Ambient application background */}
      <div className="ambient-bg" />
      
      {/* Subtle noise texture */}
      <div className="noise-overlay" />
      
      <Navbar />
      
      <main className="site-main flex-grow pb-12 flex flex-col relative z-10">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
};
