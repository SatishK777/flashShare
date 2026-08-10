import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useUploadStore } from '../../stores/uploadStore';
import { useShareStore } from '../../stores/shareStore';
import { formatBytes } from './FileList';

export function UploadProgress() {
  const { overallProgress, files } = useUploadStore();
  const { status } = useShareStore();

  if (status === 'idle' || status === 'ready' || status === 'error') return null;

  const totalSpeed = files.reduce((acc, f) => acc + (f.speed || 0), 0);
  const totalEta = Math.max(...files.map(f => f.eta || 0));

  let statusText = 'Processing...';
  if (status === 'creating') statusText = 'Creating secure share...';
  if (status === 'uploading') statusText = 'Encrypting & Uploading...';
  if (status === 'finalizing') statusText = 'Finalizing share...';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="upload-progress-card glass premium-ring"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
            <Loader2 className="animate-spin text-brand-500" size={20} />
          </div>
          <h3 className="font-semibold text-text-primary text-base truncate">{statusText}</h3>
        </div>
        <div className="text-brand-400 font-bold font-mono text-sm px-3.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 shrink-0">
          {Math.round(overallProgress)}%
        </div>
      </div>

      <div className="h-2.5 w-full bg-bg-secondary rounded-full overflow-hidden mb-4 relative p-0.5 border border-border-primary/50">
        <motion.div 
          className="h-full gradient-bg rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${overallProgress}%` }}
          transition={{ ease: "linear", duration: 0.3 }}
        />
      </div>

      {status === 'uploading' && (
        <div className="flex justify-between items-center text-xs font-medium text-text-secondary px-1">
          <span className="flex items-center gap-1.5 text-brand-400 font-semibold">
            {formatBytes(totalSpeed)}/s
          </span>
          <span>{totalEta > 0 ? `~${Math.ceil(totalEta)}s remaining` : 'Calculating...'}</span>
        </div>
      )}
    </motion.div>
  );
}
