import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckCircle, Share2, Mail, Download, Smartphone, Wifi, Cloud } from 'lucide-react';
import { Button } from '../ui/button';
import { useShareStore } from '../../stores/shareStore';
import { useUploadStore } from '../../stores/uploadStore';
import { getSocket, joinRoom, leaveRoom, SOCKET_EVENTS } from '../../services/socket';
import { WebRTCTransfer, isWebRTCSupported, P2PTransferProgress } from '../../services/webrtc';
import { formatBytes } from '../upload/FileList';

export function QRDisplay() {
  const shareUrl = useShareStore(state => state.shareUrl);
  const expiresAt = useShareStore(state => state.expiresAt);
  const reset = useShareStore(state => state.reset);
  const shareId = useShareStore(state => state.shareId);
  
  const files = useUploadStore(state => state.files);
  const rawFiles = files.map(f => f.file);

  const settings = useShareStore(state => state.settings);
  const [downloadStats, setDownloadStats] = useState<{ count: number; max: number }>({
    count: 0,
    max: settings.maxDownloads,
  });

  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [receiverStatus, setReceiverStatus] = useState<'waiting' | 'connected' | 'downloading' | 'partially_completed' | 'completed' | 'p2p_connecting'>('waiting');
  
  const [transferMode, setTransferMode] = useState<'cloud' | 'p2p' | null>(null);
  const [p2pProgress, setP2pProgress] = useState<P2PTransferProgress | null>(null);
  
  const webrtcRef = useRef<WebRTCTransfer | null>(null);
  const p2pTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(expiresAt).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft('Expired');
        return;
      }

      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else if (m > 0) setTimeLeft(`${m}m ${s}s`);
      else setTimeLeft(`${s}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    if (!shareId) return;
    joinRoom(shareId);
    const socket = getSocket();

    const cleanupWebRTC = () => {
      if (webrtcRef.current) {
        webrtcRef.current.destroy();
        webrtcRef.current = null;
      }
      if (p2pTimeoutRef.current) {
        window.clearTimeout(p2pTimeoutRef.current);
      }
    };

    const handleReceiverJoined = async () => {
      setReceiverStatus('connected');
      
      if (isWebRTCSupported()) {
        setTransferMode('p2p');
        socket.emit(SOCKET_EVENTS.WEBRTC_READY, shareId);
        
        webrtcRef.current = new WebRTCTransfer(shareId, 'sender');
        
        webrtcRef.current.onProgress = (progress) => {
          setP2pProgress(progress);
          setReceiverStatus('downloading');
        };
        
        webrtcRef.current.onPeerConnected = () => {
          if (p2pTimeoutRef.current) window.clearTimeout(p2pTimeoutRef.current);
          webrtcRef.current?.sendFiles(rawFiles);
        };
        
        webrtcRef.current.onError = (err) => {
          console.error('P2P Error:', err);
          cleanupWebRTC();
          setTransferMode('cloud');
        };

        await webrtcRef.current.init();
        await webrtcRef.current.createOffer();

        // 10s fallback timeout
        p2pTimeoutRef.current = window.setTimeout(() => {
          console.log('P2P connection timeout, falling back to cloud');
          cleanupWebRTC();
          setTransferMode('cloud');
        }, 10000);
      } else {
        setTransferMode('cloud');
      }
    };

    const handleWebRtcAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      if (webrtcRef.current) {
        await webrtcRef.current.handleAnswer(answer);
      }
    };

    const handleWebRtcIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (webrtcRef.current) {
        await webrtcRef.current.handleIceCandidate(candidate);
      }
    };

    const handleWebRtcRejected = () => {
      cleanupWebRTC();
      setTransferMode('cloud');
    };

    socket.on(SOCKET_EVENTS.RECEIVER_JOINED, handleReceiverJoined);
    socket.on(SOCKET_EVENTS.WEBRTC_ANSWER, handleWebRtcAnswer);
    socket.on(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, handleWebRtcIceCandidate);
    socket.on(SOCKET_EVENTS.WEBRTC_REJECTED, handleWebRtcRejected);

    socket.on(SOCKET_EVENTS.DOWNLOAD_STARTED, () => {
      if (transferMode !== 'p2p') {
        setTransferMode('cloud');
        setReceiverStatus('downloading');
      }
    });
    
    socket.on(SOCKET_EVENTS.DOWNLOAD_COMPLETED, (data?: { downloadCount?: number; maxDownloads?: number; isFullyCompleted?: boolean }) => {
      const count = data?.downloadCount ?? 1;
      const max = data?.maxDownloads ?? settings.maxDownloads;
      const isFullyCompleted = data?.isFullyCompleted ?? (max > 0 && count >= max);

      setDownloadStats({ count, max });

      if (isFullyCompleted) {
        setReceiverStatus('completed');
      } else {
        setReceiverStatus('partially_completed');
        setTimeout(() => {
          setReceiverStatus('waiting');
        }, 5000);
      }
    });

    return () => {
      leaveRoom(shareId);
      cleanupWebRTC();
      socket.off(SOCKET_EVENTS.RECEIVER_JOINED);
      socket.off(SOCKET_EVENTS.WEBRTC_ANSWER);
      socket.off(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE);
      socket.off(SOCKET_EVENTS.WEBRTC_REJECTED);
      socket.off(SOCKET_EVENTS.DOWNLOAD_STARTED);
      socket.off(SOCKET_EVENTS.DOWNLOAD_COMPLETED);
    };
  }, [shareId, rawFiles, transferMode, settings.maxDownloads]);

  if (!shareUrl) return null;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="qr-share-shell"
    >
      <div className="qr-share-card glass-strong premium-ring">
        <div className="qr-accent" />

        <div className="qr-visual-panel">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.2, bounce: 0.4 }}
            className="qr-code-frame"
          >
            {receiverStatus === 'completed' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="qr-complete-overlay"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="qr-complete-icon"
                >
                  <CheckCircle size={34} />
                </motion.div>
                <p>
                  {downloadStats.max > 1 
                    ? `All ${downloadStats.max} Downloads Complete!` 
                    : 'Transfer Complete!'}
                </p>
              </motion.div>
            )}
            <QRCodeSVG
              value={shareUrl}
              size={232}
              level="H"
              includeMargin={false}
            />
          </motion.div>

          <div className="qr-status-area">
            <AnimatePresence mode="wait">
              {receiverStatus === 'waiting' && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="qr-status-pill"
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Waiting for receiver...
                </motion.div>
              )}
              {receiverStatus === 'partially_completed' && (
                <motion.div
                  key="partially_completed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="qr-status-pill qr-status-success"
                >
                  <CheckCircle size={16} />
                  {downloadStats.max > 0 
                    ? `Download ${downloadStats.count} of ${downloadStats.max} complete!` 
                    : `Download ${downloadStats.count} complete!`}
                </motion.div>
              )}
              {receiverStatus === 'connected' && transferMode === 'p2p' && (
                <motion.div
                  key="connecting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="qr-status-pill qr-status-brand"
                >
                  <Wifi size={16} className="animate-pulse" />
                  Establishing connection...
                </motion.div>
              )}
              {receiverStatus === 'connected' && transferMode === 'cloud' && (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="qr-status-pill qr-status-success"
                >
                  <Smartphone size={16} />
                  Receiver connected!
                </motion.div>
              )}
              {receiverStatus === 'downloading' && transferMode === 'cloud' && (
                <motion.div
                  key="downloading-cloud"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="qr-status-pill qr-status-brand"
                >
                  <Download size={16} className="animate-bounce" />
                  Cloud download started...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="qr-details-panel">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="qr-share-header"
          >
            <p className="qr-eyebrow">Secure link generated</p>
            <h2 className="font-display gradient-text">Ready to Share</h2>
            <p className="mb-2">Scan with any camera or share the private link below.</p>
            
            {downloadStats.count > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/25 text-brand-400 font-semibold text-xs mt-1"
              >
                <Download size={14} />
                <span>
                  Downloads: {downloadStats.count} {downloadStats.max > 0 ? `/ ${downloadStats.max}` : '(Unlimited)'}
                </span>
              </motion.div>
            )}
          </motion.div>

          {transferMode && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`qr-transfer-mode ${
                transferMode === 'p2p' ? 'bg-success-500/10 text-success-500' : 'bg-brand-500/10 text-brand-500'
              }`}
            >
              {transferMode === 'p2p' ? (
                <>
                  <Wifi size={16} />
                  <span>Direct P2P Transfer</span>
                  <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse ml-1" />
                </>
              ) : (
                <>
                  <Cloud size={16} />
                  <span>Cloud Transfer</span>
                  <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse ml-1" />
                </>
              )}
            </motion.div>
          )}

          {transferMode === 'p2p' && p2pProgress && receiverStatus === 'downloading' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="qr-progress-card"
            >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium truncate max-w-[60%]">{p2pProgress.fileName}</span>
                  <span className="text-xs text-text-secondary">
                    File {p2pProgress.fileIndex + 1} of {p2pProgress.totalFiles}
                  </span>
                </div>
                <div className="w-full bg-bg-tertiary rounded-md h-2 mb-2 overflow-hidden">
                  <motion.div 
                    className="bg-success-500 h-2 rounded-md"
                    initial={{ width: 0 }}
                    animate={{ width: `${(p2pProgress.bytesTransferred / p2pProgress.totalBytes) * 100}%` }}
                    transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-text-tertiary">
                  <span>{formatBytes(p2pProgress.bytesTransferred)} / {formatBytes(p2pProgress.totalBytes)}</span>
                  <span>{formatBytes(p2pProgress.speed)}/s</span>
                </div>
            </motion.div>
          )}

          <div className="qr-link-card">
            <span className="qr-link-label">Share link</span>
            <div className="qr-link-row">
              <span className="qr-link-text">
                {shareUrl.replace(/^https?:\/\//, '')}
              </span>
              <Button 
                variant="default" 
                size="sm" 
                className="qr-copy-button"
                onClick={copyLink}
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                <span className="ml-2">{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </div>
            
          <div className="qr-actions">
              <Button 
                variant="outline" 
                size="sm" 
                className="qr-action-button" 
                onClick={() => window.open(`mailto:?subject=FlashShare%20File%20Transfer&body=${encodeURIComponent(shareUrl)}`)}
              >
                <Mail size={16} className="mr-2" /> Email
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="qr-action-button" 
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: 'FlashShare Transfer',
                        text: 'Download files shared securely with FlashShare:',
                        url: shareUrl,
                      });
                    } catch (err) {
                      // Fallback if user cancels or share fails
                    }
                  } else {
                    window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`);
                  }
                }}
              >
                <Share2 size={16} className="mr-2" /> Share
              </Button>
          </div>

          <div className="qr-meta-row">
            <span>Expires in <strong>{timeLeft}</strong></span>
            <Button variant="ghost" size="sm" onClick={reset} className="qr-reset-button">
              Create New Share
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
