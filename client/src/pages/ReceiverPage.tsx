import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Clock, CheckCircle, Download, File, Image as ImageIcon, Video, FileText, Music, Archive, Wifi, Cloud } from 'lucide-react';
import { Button } from '../components/ui/button';
import { importKey } from '../services/encryption';
import { downloadAndDecryptFile, DownloadProgress } from '../services/downloader';
import { formatBytes } from '../components/upload/FileList';
import { joinRoom, leaveRoom, getSocket, SOCKET_EVENTS } from '../services/socket';
import { WebRTCTransfer, isWebRTCSupported, P2PTransferProgress } from '../services/webrtc';

import { API_BASE } from '../services/api';

type ReceiverState = 'loading' | 'password_required' | 'ready' | 'downloading' | 'completed' | 'expired' | 'not_found';

// Matches actual API response shape from GET /api/shares/:token
interface ShareFile {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: string; // BigInt comes as string
  storagePath: string;
  chunkCount: number;
  status: string;
  shareId: string;
}

interface ShareData {
  id: string;
  token: string;
  expiresAt: string;
  maxDownloads: number;
  downloadCount: number;
  passwordHash: string | null;
  showFilenames: boolean;
  autoDeletePolicy: string;
  status: string;
  files: ShareFile[];
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('video/')) return Video;
  if (type.startsWith('audio/')) return Music;
  if (type.startsWith('text/')) return FileText;
  if (type.includes('zip') || type.includes('tar') || type.includes('rar')) return Archive;
  return File;
};

export const ReceiverPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<ReceiverState>('loading');
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  
  // P2P State
  const [p2pAvailable, setP2pAvailable] = useState(false);
  const [transferMode, setTransferMode] = useState<'cloud' | 'p2p'>('cloud');
  const [p2pProgress, setP2pProgress] = useState<P2PTransferProgress | null>(null);
  const webrtcRef = useRef<WebRTCTransfer | null>(null);

  // Extract encryption key from URL hash (never sent to server)
  const hash = window.location.hash.replace('#', '');
  const isEncrypted = !!hash;

  const fetchShare = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/shares/${token}`);

      if (res.status === 404) { setState('not_found'); return; }
      if (res.status === 410) { setState('expired'); return; }
      if (!res.ok) throw new Error('Failed to fetch share');

      const json = await res.json();
      const share: ShareData = json.data;

      // Check if password protected
      if (share.passwordHash) {
        setState('password_required');
        return;
      }

      setShareData(share);
      setState('ready');
      joinRoom(share.id);
    } catch (err) {
      console.error(err);
      setState('not_found');
    }
  }, [token]);

  useEffect(() => {
    fetchShare();
  }, [fetchShare]);

  // Countdown timer
  useEffect(() => {
    if (!shareData?.expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const end = new Date(shareData.expiresAt).getTime();
      const distance = end - now;

      if (distance < 0) {
        setState('expired');
        setTimeLeft('Expired');
        return;
      }

      const h = Math.floor(distance / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else if (m > 0) setTimeLeft(`${m}m ${s}s`);
      else setTimeLeft(`${s}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [shareData?.expiresAt]);

  // Socket & WebRTC setup
  useEffect(() => {
    if (!shareData) return;
    const socket = getSocket();

    const cleanupWebRTC = () => {
      if (webrtcRef.current) {
        webrtcRef.current.destroy();
        webrtcRef.current = null;
      }
    };

    socket.emit(SOCKET_EVENTS.RECEIVER_JOINED, shareData.id);

    const handleWebRtcReady = () => {
      if (isWebRTCSupported()) {
        setP2pAvailable(true);
        setTransferMode('p2p');
      } else {
        socket.emit(SOCKET_EVENTS.WEBRTC_REJECTED, shareData.id);
      }
    };

    const handleWebRtcOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      try {
        if (!webrtcRef.current) {
          webrtcRef.current = new WebRTCTransfer(shareData.id, 'receiver');
          
          webrtcRef.current.onProgress = (prog) => {
            setP2pProgress(prog);
            setState('downloading');
          };
          
          webrtcRef.current.onComplete = (files) => {
            files.forEach(file => {
              const url = URL.createObjectURL(file.data);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.name;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            });
            setState('completed');
          };
          
          webrtcRef.current.onError = (err) => {
            console.error('P2P Error:', err);
            cleanupWebRTC();
            setTransferMode('cloud');
            setP2pAvailable(false);
          };

          await webrtcRef.current.init();
        }
        await webrtcRef.current.handleOffer(offer);
      } catch (err) {
        console.error('Failed to handle offer:', err);
        cleanupWebRTC();
        setTransferMode('cloud');
      }
    };

    const handleWebRtcIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (webrtcRef.current) {
        await webrtcRef.current.handleIceCandidate(candidate);
      }
    };

    socket.on(SOCKET_EVENTS.WEBRTC_READY, handleWebRtcReady);
    socket.on(SOCKET_EVENTS.WEBRTC_OFFER, handleWebRtcOffer);
    socket.on(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, handleWebRtcIceCandidate);

    return () => {
      leaveRoom(shareData.id);
      cleanupWebRTC();
      socket.off(SOCKET_EVENTS.WEBRTC_READY, handleWebRtcReady);
      socket.off(SOCKET_EVENTS.WEBRTC_OFFER, handleWebRtcOffer);
      socket.off(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, handleWebRtcIceCandidate);
    };
  }, [shareData]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !token) return;
    setPasswordError('');

    try {
      // Verify password first
      const verifyRes = await fetch(`${API_BASE}/shares/${token}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (verifyRes.status === 401) {
        setPasswordError('Incorrect password');
        return;
      }
      if (!verifyRes.ok) throw new Error('Verification failed');

      // Password correct — fetch share data
      const res = await fetch(`${API_BASE}/shares/${token}`);
      if (!res.ok) throw new Error('Failed to fetch share');

      const json = await res.json();
      setShareData(json.data);
      setState('ready');
      joinRoom(json.data.id);
    } catch (err) {
      console.error(err);
      setPasswordError('An error occurred');
    }
  };

  const handleDownloadFile = async (file: ShareFile) => {
    if (!shareData || !token) return;

    setState('downloading');

    try {
      let cryptoKey: CryptoKey | null = null;
      if (isEncrypted) {
        cryptoKey = await importKey(hash);
      }

      const fileSize = parseInt(file.size, 10);
      const blob = await downloadAndDecryptFile(
        token,
        file.id,
        file.originalName,
        fileSize,
        file.chunkCount,
        cryptoKey,
        (prog) => setProgress(prog)
      );

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setState('completed');
    } catch (err) {
      console.error('Download failed', err);
      setState('ready');
    }
  };

  const handleDownloadAll = async () => {
    if (!shareData || !token) return;

    if (transferMode === 'p2p' && webrtcRef.current) {
      // P2P mode: The sender will initiate sending once connected. 
      // The receiver is just waiting. If we are here, we might just show connecting.
      setState('downloading');
      return;
    }

    setState('downloading');
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.DOWNLOAD_STARTED, shareData.id);

    try {
      let cryptoKey: CryptoKey | null = null;
      if (isEncrypted) {
        cryptoKey = await importKey(hash);
      }

      for (const file of shareData.files) {
        const fileSize = parseInt(file.size, 10);
        const blob = await downloadAndDecryptFile(
          token,
          file.id,
          file.originalName,
          fileSize,
          file.chunkCount,
          cryptoKey,
          (prog) => setProgress(prog)
        );

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      socket.emit(SOCKET_EVENTS.DOWNLOAD_COMPLETED, shareData.id);
      setState('completed');
    } catch (err) {
      console.error('Download failed', err);
      setState('ready');
    }
  };

  const totalFilesSize = shareData?.files.reduce((acc, f) => acc + parseInt(f.size, 10), 0) || 0;

  return (
    <div className="receiver-page">
      <div className="receiver-shell">
        <AnimatePresence mode="wait">
          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-text-secondary"
            >
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 bg-bg-secondary rounded-lg mb-4" />
                <div className="h-6 w-32 bg-bg-secondary rounded-md mb-2" />
                <div className="h-4 w-48 bg-bg-secondary rounded-md" />
              </div>
            </motion.div>
          )}

          {state === 'password_required' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="receiver-card receiver-card-compact glass premium-ring"
            >
              <div className="receiver-state-icon receiver-warning-icon">
                <Lock className="text-warning-500" size={32} />
              </div>
              <h2 className="receiver-state-title">Password Protected</h2>
              <p className="receiver-state-copy">This share requires a password to access.</p>

              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-bg-secondary border border-border-primary rounded-md px-4 py-3 text-text-primary focus:outline-none focus:border-brand-500 transition-colors"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-error-500 text-sm text-left">{passwordError}</p>
                )}
                <Button type="submit" className="w-full py-3" size="lg">
                  Unlock
                </Button>
              </form>
            </motion.div>
          )}

          {state === 'ready' && shareData && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="receiver-card glass-strong premium-ring"
            >
              <div className="receiver-accent" />

              <div className="receiver-header">
                <p className="receiver-eyebrow">Private download link</p>
                <h2>Files shared with you</h2>
                <p>Review the file details, then download securely to this device.</p>
                <div className="receiver-badges">
                  {isEncrypted && (
                    <div className="receiver-badge receiver-badge-success">
                      <Shield size={16} />
                      <span>End-to-end encrypted</span>
                    </div>
                  )}
                  {p2pAvailable ? (
                    <div className="receiver-badge receiver-badge-brand">
                      <Wifi size={16} />
                      <span>Direct P2P Transfer</span>
                    </div>
                  ) : (
                    <div className="receiver-badge receiver-badge-accent">
                      <Cloud size={16} />
                      <span>Cloud Transfer</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="receiver-file-list">
                {shareData.files.map((file) => {
                  const Icon = getFileIcon(file.mimeType);
                  const displayName = shareData.showFilenames ? file.originalName : `File ${file.id.substring(0, 4)}`;
                  return (
                    <div key={file.id} className="receiver-file-row">
                      <div className="receiver-file-icon">
                        <Icon className="text-brand-500" size={20} />
                      </div>
                      <div className="receiver-file-info">
                        <div className="receiver-file-name">{displayName}</div>
                        <div className="receiver-file-size">{formatBytes(parseInt(file.size, 10))}</div>
                      </div>
                      {shareData.files.length > 1 && (
                        <button
                          onClick={() => handleDownloadFile(file)}
                          className="receiver-file-download"
                          title={`Download ${displayName}`}
                        >
                          <Download size={18} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="receiver-download-panel">
                <Button
                  onClick={handleDownloadAll}
                  className="receiver-download-button"
                  size="lg"
                >
                  <span className="receiver-download-button-bg" />
                  <span className="receiver-download-button-content">
                    {transferMode === 'p2p' ? <Wifi size={20} /> : <Download size={20} />}
                    {transferMode === 'p2p' ? 'Accept Direct Transfer' : `Download ${shareData.files.length > 1 ? 'All ' : ''}(${formatBytes(totalFilesSize)})`}
                  </span>
                </Button>

                <div className="receiver-expiry">
                  <Clock size={14} />
                  <span>Expires in: {timeLeft}</span>
                </div>
              </div>
            </motion.div>
          )}

          {(state === 'downloading' || state === 'ready') && (progress || p2pProgress) && (
            <motion.div
              key="downloading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="receiver-card receiver-card-compact glass premium-ring"
            >
              <div className="mb-4 flex justify-center">
                {transferMode === 'p2p' ? (
                  <div className="inline-flex items-center gap-2 bg-brand-500/10 text-brand-500 border border-brand-500/20 px-3 py-1 rounded-md text-sm font-medium">
                    <Wifi size={16} className="animate-pulse" />
                    <span>Direct P2P Transfer</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-accent-500/10 text-accent-500 border border-accent-500/20 px-3 py-1 rounded-md text-sm font-medium">
                    <Cloud size={16} />
                    <span>Cloud Download</span>
                  </div>
                )}
              </div>

              <div className="w-20 h-20 mx-auto relative mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-bg-secondary" />
                  <motion.circle
                    cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"
                    className="text-brand-500"
                    strokeDasharray={2 * Math.PI * 45}
                    initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                    animate={{ 
                      strokeDashoffset: 2 * Math.PI * 45 * (1 - (
                        transferMode === 'p2p' && p2pProgress
                          ? (p2pProgress.totalBytes > 0 ? p2pProgress.bytesTransferred / p2pProgress.totalBytes : 0)
                          : (progress && progress.totalSize > 0 ? progress.downloadedSize / progress.totalSize : 0)
                      )) 
                    }}
                    transition={{ duration: 0.2 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-bold text-lg">
                    {transferMode === 'p2p' && p2pProgress
                      ? (p2pProgress.totalBytes > 0 ? Math.round((p2pProgress.bytesTransferred / p2pProgress.totalBytes) * 100) : 0)
                      : (progress && progress.totalSize > 0 ? Math.round((progress.downloadedSize / progress.totalSize) * 100) : 0)}%
                  </span>
                </div>
              </div>

              <h3 className="font-display text-xl font-bold mb-2">
                {transferMode === 'p2p' ? 'Receiving directly...' : (progress?.status === 'decrypting' ? 'Decrypting...' : 'Downloading...')}
              </h3>
              <p className="text-text-secondary text-sm mb-1 truncate px-4">
                {transferMode === 'p2p' && p2pProgress ? p2pProgress.fileName : progress?.fileName}
              </p>
              <p className="text-text-tertiary text-xs">
                {transferMode === 'p2p' && p2pProgress
                  ? `${formatBytes(p2pProgress.bytesTransferred)} of ${formatBytes(p2pProgress.totalBytes)} at ${formatBytes(p2pProgress.speed)}/s`
                  : (progress ? `${formatBytes(progress.downloadedSize)} of ${formatBytes(progress.totalSize)}` : '')}
              </p>
            </motion.div>
          )}

          {state === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="receiver-card receiver-card-compact glass premium-ring"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="receiver-state-icon receiver-success-icon"
              >
                <CheckCircle size={40} />
              </motion.div>
              <h2 className="receiver-state-title">Download Complete!</h2>
              <p className="receiver-state-copy">Your files have been saved successfully.</p>

              <Link to="/">
                <Button variant="outline" className="receiver-secondary-button">Create Your Own Share</Button>
              </Link>
            </motion.div>
          )}

          {state === 'expired' && (
            <motion.div
              key="expired"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="receiver-card receiver-card-compact glass premium-ring"
            >
              <div className="receiver-state-icon receiver-error-icon">
                <Clock className="text-error-500" size={32} />
              </div>
              <h2 className="receiver-state-title">This share has expired</h2>
              <p className="receiver-state-copy">The files are no longer available for download.</p>
              <Link to="/"><Button className="receiver-secondary-button">Return Home</Button></Link>
            </motion.div>
          )}

          {state === 'not_found' && (
            <motion.div
              key="not_found"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="receiver-card receiver-card-compact glass premium-ring"
            >
              <div className="receiver-state-icon receiver-error-icon">
                <File className="text-error-500" size={32} />
              </div>
              <h2 className="receiver-state-title">Share Not Found</h2>
              <p className="receiver-state-copy">This link is invalid or the share was deleted.</p>
              <Link to="/"><Button className="receiver-secondary-button">Return Home</Button></Link>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="receiver-powered">
          <p>
            Powered by <span className="gradient-text font-bold">FlashShare</span>
          </p>
        </div>
      </div>
    </div>
  );
};
