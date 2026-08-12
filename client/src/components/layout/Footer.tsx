import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Github, Twitter, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer relative z-10">
      <div className="page-container-wide">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-brand-link">
              <span className="footer-brand-mark">
                <QrCode className="w-5 h-5" />
              </span>
              <span className="font-display font-bold text-xl tracking-tight text-text-primary">
                Flash<span className="gradient-text">Share</span>
              </span>
            </Link>
            <p className="text-text-secondary text-sm mb-6">
              Share files instantly. No accounts. No apps. Just a QR code.
            </p>
            <div className="footer-socials">
              <a href="#" aria-label="Twitter"><Twitter className="w-4 h-4" /></a>
              <a href="#" aria-label="GitHub"><Github className="w-4 h-4" /></a>
              <a href="#" aria-label="LinkedIn"><Linkedin className="w-4 h-4" /></a>
            </div>
          </div>
          
          <div className="footer-column">
            <h4>Product</h4>
            <ul>
              <li><Link to="/create">Start Sharing</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/features">Features</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">API Reference</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} FlashShare. All rights reserved.</p>
          <p>Secure QR file transfer for modern teams.</p>
        </div>
      </div>
    </footer>
  );
};
