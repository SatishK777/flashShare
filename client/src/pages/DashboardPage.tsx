import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Activity, 
  Download, 
  HardDrive, 
  Eye, 
  Plus, 
  CheckCircle,
  FileQuestion,
  RefreshCw
} from 'lucide-react';
import { formatBytes } from '../components/upload/FileList';

interface ActivityEvent {
  id: string;
  shareId: string;
  eventType: 'share_viewed' | 'share_created' | 'download_started' | 'download_completed';
  createdAt: string;
}

interface DashboardData {
  totalShares: number;
  activeShares: number;
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

import { API_BASE } from '../services/api';

export const DashboardPage: React.FC = () => {
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
          <p>Real-time analytics and activity</p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg glass border border-border-primary text-xs font-medium text-text-secondary">
          <RefreshCw size={14} className={isFetching ? "animate-spin text-brand-500" : ""} />
          Auto-refreshing every 10s
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
        <div className="dashboard-content">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="dashboard-stats"
          >
            {/* Total Shares */}
            <motion.div variants={itemVariants} className="stat-card glass p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-border-primary/50 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/10 premium-ring">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-500 to-transparent opacity-50" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-11 h-11 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 mb-1">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-text-secondary text-sm uppercase tracking-wider mb-1">Total Shares</h3>
                  <div className="text-4xl font-display font-bold text-text-primary">
                    {data.totalShares}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Active Shares */}
            <motion.div variants={itemVariants} className="stat-card glass p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-border-primary/50 hover:border-success-500/30 hover:shadow-lg hover:shadow-success-500/10 premium-ring">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-success-500 to-transparent opacity-50" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-11 h-11 rounded-lg bg-success-500/10 flex items-center justify-center text-success-500 mb-1">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-text-secondary text-sm uppercase tracking-wider mb-1">Active Shares</h3>
                  <div className="text-4xl font-display font-bold text-text-primary flex items-center gap-3">
                    {data.activeShares}
                    {data.activeShares > 0 && (
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

            {/* Total Bandwidth */}
            <motion.div variants={itemVariants} className="stat-card glass p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-border-primary/50 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/10 premium-ring">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-500 to-transparent opacity-50" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-11 h-11 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 mb-1">
                  <HardDrive size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-text-secondary text-sm uppercase tracking-wider mb-1">Bandwidth</h3>
                  <div className="text-3xl lg:text-4xl font-display font-bold text-text-primary truncate" title={formatBytes(data.totalBandwidth)}>
                    {formatBytes(data.totalBandwidth)}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="activity-panel glass overflow-hidden flex flex-col border border-border-primary/50 shadow-xl premium-ring"
          >
            <div className="activity-panel-header">
              <div className="w-11 h-11 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500">
                <Activity size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-semibold text-text-primary">Recent Activity</h2>
                <p className="text-text-secondary text-sm">Latest events across all your shares</p>
              </div>
            </div>
            
            <div>
              {data.recentActivity && data.recentActivity.length > 0 ? (
                <div className="activity-list">
                  <AnimatePresence mode="popLayout">
                    {data.recentActivity.map((event, index) => {
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
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${bg} ${color} group-hover:scale-105 transition-transform duration-300`}>
                            <EventIcon size={24} />
                          </div>
                          
                          <div className="min-w-0">
                            <p className="font-semibold text-text-primary text-lg">{text}</p>
                            <p className="text-sm text-text-tertiary truncate font-mono mt-1">
                              Share ID: {event.shareId.substring(0, 12)}...
                            </p>
                          </div>

                          <div className="activity-time text-sm text-text-secondary whitespace-nowrap font-medium bg-bg-secondary/50 border border-border-primary/50">
                            {timeAgo(event.createdAt)}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 mb-8 rounded-lg bg-bg-secondary/50 flex items-center justify-center text-text-tertiary">
                    <Activity size={56} className="opacity-40" />
                  </div>
                  <h3 className="text-2xl font-display font-semibold text-text-primary mb-3">No activity yet</h3>
                  <p className="text-text-secondary text-lg max-w-sm">When your shares are viewed or downloaded, the events will appear here in real-time.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
