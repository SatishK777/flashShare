import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Download, 
  Eye, 
  Plus, 
  CheckCircle,
  FileQuestion,
  RefreshCw,
  Copy,
  ExternalLink,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatBytes } from '../components/upload/FileList';
import { API_BASE, api } from '../services/api';
import { useShareStore } from '../stores/shareStore';

interface ActivityEvent {
  id: string;
  shareId: string;
  eventType: 'share_viewed' | 'share_created' | 'download_started' | 'download_completed';
  createdAt: string;
}

interface ActiveShareFile {
  id: string;
  originalName: string;
  size: string;
  mimeType: string;
}

interface ActiveShareItem {
  id: string;
  token: string;
  expiresAt: string;
  maxDownloads: number;
  downloadCount: number;
  showFilenames: boolean;
  createdAt: string;
  files: ActiveShareFile[];
}

interface DashboardData {
  totalShares: number;
  activeShares: number;
  activeSharesList?: ActiveShareItem[];
  totalDownloads: number;
  totalBandwidth: number;
  recentActivity: ActivityEvent[];
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function useCountdown(expiresAt: string) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const m = Math.floor(diff / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      if (m > 60) {
        const h = Math.floor(m / 60);
        setTimeLeft(`${h}h ${m % 60}m`);
      } else if (m > 0) {
        setTimeLeft(`${m}m ${s}s`);
      } else {
        setTimeLeft(`${s}s`);
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return timeLeft;
}

const MemoizedQRCode = React.memo(({ value }: { value: string }) => (
  <QRCodeSVG value={value} size={128} level="M" />
));

function ActiveShareRow({ share, onRevoke }: { share: ActiveShareItem; onRevoke: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const timeLeft = useCountdown(share.expiresAt);

  const fullUrl = `${window.location.origin}/#/s/${share.token}`;
  const totalSize = share.files.reduce((acc, f) => acc + parseInt(f.size || '0', 10), 0);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to revoke this share? Files will be deleted.')) {
      setRevoking(true);
      try {
        await api.cancelShare(share.id);
        useShareStore.getState().removeCreatedToken(share.token);
        useShareStore.getState().removeCreatedToken(share.id);
        onRevoke(share.id);
      } catch (err) {
        console.error(err);
      } finally {
        setRevoking(false);
      }
    }
  };

  return (
    <div className="active-share-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Info Column */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="active-share-icon-box">
            <ShieldCheck size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono font-bold text-text-primary text-base tracking-wide truncate">
                {share.token}
              </span>
              <span className="active-share-status-pill">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                Active
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1 font-medium truncate">
              {share.files.length} {share.files.length === 1 ? 'file' : 'files'} • {formatBytes(totalSize)}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleCopy}
            className="active-share-btn-copy"
          >
            {copied ? <CheckCircle size={15} className="text-success-500" /> : <Copy size={15} />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>

          <button
            onClick={() => window.open(fullUrl, '_blank')}
            className="active-share-btn-icon"
            title="Open Share"
          >
            <ExternalLink size={15} />
          </button>

          <button
            onClick={handleRevoke}
            disabled={revoking}
            className="active-share-btn-revoke"
            title="Revoke Share"
          >
            <Trash2 size={15} />
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="active-share-btn-icon"
            title={expanded ? "Collapse details" : "Expand details"}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Metrics Bar Pills */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="active-share-metric-pill">
          <Clock size={14} className="text-brand-400" />
          <span>Expires in:</span>
          <strong className="text-text-primary font-bold">{timeLeft}</strong>
        </div>

        <div className="active-share-metric-pill">
          <Download size={14} className="text-brand-400" />
          <span>Downloads:</span>
          <strong className="text-text-primary font-bold">
            {share.downloadCount} {share.maxDownloads > 0 ? `/ ${share.maxDownloads}` : '(Unlimited)'}
          </strong>
        </div>
      </div>

      {/* Hardware-Accelerated CSS Grid Expandable Section */}
      <div className={`active-share-expandable-container ${expanded ? 'is-expanded' : ''}`}>
        <div className="active-share-expandable-inner">
          <div className="active-share-expanded-panel flex flex-col md:flex-row items-stretch gap-5 mt-2">
            <div className="p-3 bg-white rounded-xl shrink-0 shadow-lg flex items-center justify-center self-center md:self-start">
              <MemoizedQRCode value={fullUrl} />
            </div>

            <div className="flex-grow min-w-0 w-full flex flex-col justify-center gap-2">
              <h4 className="text-xs font-extrabold text-text-tertiary uppercase tracking-wider">Files Included ({share.files.length})</h4>
              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                {share.files.map((f) => (
                  <div key={f.id} className="active-share-file-item">
                    <span className="flex items-center gap-2.5 truncate font-medium text-text-primary min-w-0">
                      <FileText size={16} className="text-brand-400 shrink-0" />
                      <span className="truncate">{share.showFilenames ? f.originalName : `File ${f.id.substring(0, 4)}`}</span>
                    </span>
                    <span className="active-share-file-size-badge">
                      {formatBytes(parseInt(f.size, 10))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const getEventDisplay = (eventType: string) => {
  switch (eventType) {
    case 'share_viewed':
      return { icon: Eye, text: 'Share viewed', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    case 'share_created':
      return { icon: Plus, text: 'Share created', color: 'text-success-500', bg: 'bg-success-500/10' };
    case 'download_started':
      return { icon: Download, text: 'Download started', color: 'text-brand-500', bg: 'bg-brand-500/10' };
    case 'download_completed':
      return { icon: CheckCircle, text: 'Download completed', color: 'text-success-500', bg: 'bg-success-500/10' };
    default:
      return { icon: FileQuestion, text: 'Unknown event', color: 'text-text-secondary', bg: 'bg-bg-secondary' };
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeSharesOpen, setActiveSharesOpen] = useState(false);

  const { data, isLoading, isError, isFetching } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/dashboard`);
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 10000,
  });

  const handleRevokeShare = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createdShareTokens = useShareStore((state) => state.createdShareTokens) || [];
  const activeShareToken = useShareStore((state) => state.token);
  const activeShareId = useShareStore((state) => state.shareId);
  const myRecentActivity = (data?.recentActivity || []).filter((event) =>
    createdShareTokens.some(
      (t) => t === event.shareId || event.shareId.startsWith(t) || t.startsWith(event.shareId)
    )
  );

  const myActiveSharesList = (data?.activeSharesList || []).filter((share) => {
    return (
      createdShareTokens.includes(share.token) ||
      createdShareTokens.includes(share.id) ||
      share.token === activeShareToken ||
      share.id === activeShareId
    );
  });

  return (
    <div className="page-container-wide app-page">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="app-heading flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1>
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p>Real-time analytics and active shares management</p>
        </div>
        
        <div className="dashboard-refresh-badge shrink-0">
          <RefreshCw size={14} className={isFetching ? "animate-spin text-brand-500" : ""} />
          <span>Auto-refreshing every 10s</span>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : isError || !data ? (
        <div className="glass p-12 text-center rounded-lg flex flex-col items-center premium-ring">
          <div className="w-20 h-20 rounded-lg bg-error-500/10 flex items-center justify-center mb-6 text-error-500">
            <Activity size={40} />
          </div>
          <h2 className="text-2xl font-display font-semibold text-text-primary mb-3">Unable to load data</h2>
          <p className="text-text-secondary text-lg">There was an error fetching your dashboard statistics.</p>
        </div>
      ) : (
        <div className="dashboard-content flex flex-col gap-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="dashboard-stats"
          >
            {/* Active Shares (Clickable) */}
            <motion.div 
              variants={itemVariants} 
              onClick={() => {
                setActiveSharesOpen(true);
                setTimeout(() => {
                  const el = document.getElementById('active-shares-manager');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="stat-card glass p-5 relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300 border border-border-primary/50 hover:border-success-500/60 hover:shadow-lg hover:shadow-success-500/20 premium-ring"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-success-500 to-transparent opacity-70" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-lg bg-success-500/10 flex items-center justify-center text-success-500">
                    <Activity size={24} />
                  </div>
                  <span className="active-shares-view-badge">
                    View Details {activeSharesOpen ? '↑' : '→'}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-text-secondary text-sm uppercase tracking-wider mb-1">Active Shares</h3>
                  <div className="text-4xl font-display font-bold text-text-primary flex items-center gap-3">
                    {myActiveSharesList.length}
                    {myActiveSharesList.length > 0 && (
                      <span className="relative flex h-3 w-3 mt-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-success-500"></span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Total Downloads */}
            <motion.div variants={itemVariants} className="stat-card glass p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-border-primary/50 hover:border-accent-500/30 hover:shadow-lg hover:shadow-accent-500/10 premium-ring">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-500 to-transparent opacity-50" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-11 h-11 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-500 mb-1">
                  <Download size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-text-secondary text-sm uppercase tracking-wider mb-1">Total Downloads</h3>
                  <div className="text-4xl font-display font-bold text-text-primary">
                    {data.totalDownloads}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Active Shares Manager Section */}
          <div id="active-shares-manager">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="activity-panel glass-strong overflow-hidden flex flex-col border border-border-primary/50 shadow-2xl premium-ring mb-8 rounded-2xl"
            >
              <div className="activity-panel-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success-500/10 flex items-center justify-center text-success-500 border border-success-500/20 shadow-sm shrink-0">
                    <Activity size={22} />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <h2 className="text-lg sm:text-2xl font-display font-bold text-text-primary">
                        Active Shares Manager
                      </h2>
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-success-500/10 text-success-500 text-xs font-extrabold border border-success-500/25 shrink-0 whitespace-nowrap">
                        {myActiveSharesList.length} Live
                      </span>
                    </div>
                    <p className="text-text-secondary text-xs sm:text-sm mt-0.5">
                      View active URLs, copy links, inspect files, or revoke access for shares created on this device
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveSharesOpen(!activeSharesOpen)}
                  className="active-shares-toggle-btn w-full sm:w-auto justify-center mt-1 sm:mt-0 shrink-0"
                >
                  <span>{activeSharesOpen ? 'Hide Active Shares' : `Show Active Shares (${myActiveSharesList.length})`}</span>
                  {activeSharesOpen ? <ChevronUp size={16} className="text-brand-400" /> : <ChevronDown size={16} className="text-brand-400" />}
                </button>
              </div>

              <AnimatePresence>
                {activeSharesOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden border-t border-border-primary/50"
                  >
                    <div className="p-5 sm:p-6">
                      {myActiveSharesList.length > 0 ? (
                        <div className="flex flex-col gap-4">
                          <AnimatePresence mode="popLayout">
                            {myActiveSharesList.map((share) => (
                              <ActiveShareRow key={share.id} share={share} onRevoke={handleRevokeShare} />
                            ))}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="dashboard-empty-state">
                          <div className="dashboard-empty-state-icon">
                            <Activity size={34} className="text-brand-400" />
                          </div>
                          <h3 className="dashboard-empty-state-title">No active shares on this device</h3>
                          <p className="dashboard-empty-state-desc">When you create a new share on this browser, its live URL, QR code, and expiry will appear here for private management.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="activity-panel glass overflow-hidden flex flex-col border border-border-primary/50 shadow-xl premium-ring rounded-2xl"
          >
            <div className="activity-panel-header p-5 sm:p-6 border-b border-border-primary/50">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20 shadow-sm">
                <Activity size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-text-primary">Recent Activity</h2>
                <p className="text-text-secondary text-sm mt-0.5">Latest events across all your shares</p>
              </div>
            </div>
            
            <div>
              {myRecentActivity.length > 0 ? (
                <div className="activity-list p-5">
                  <AnimatePresence mode="popLayout">
                    {myRecentActivity.map((event, index) => {
                      const { icon: EventIcon, text, color, bg } = getEventDisplay(event.eventType);
                      return (
                        <motion.div
                          key={event.id}
                          layout
                          initial={{ opacity: 0, scale: 0.98, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          className="activity-item group"
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color} group-hover:scale-105 transition-transform duration-300 border border-border-primary/30`}>
                            <EventIcon size={22} />
                          </div>
                          
                          <div className="min-w-0">
                            <p className="font-semibold text-text-primary text-base">{text}</p>
                            <p className="text-xs text-text-tertiary truncate font-mono mt-0.5">
                              Share ID: {event.shareId.substring(0, 12)}...
                            </p>
                          </div>

                          <div className="activity-time text-xs text-text-secondary whitespace-nowrap font-semibold bg-bg-secondary px-3 py-1.5 rounded-xl border border-border-primary/60 shadow-sm">
                            {timeAgo(event.createdAt)}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="dashboard-empty-state">
                  <div className="dashboard-empty-state-icon">
                    <Activity size={34} className="text-brand-400" />
                  </div>
                  <h3 className="dashboard-empty-state-title">No recent activity on this device</h3>
                  <p className="dashboard-empty-state-desc">When views or downloads occur on shares created from this browser, live event logs will appear here.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
