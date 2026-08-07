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
      className="glass rounded-lg p-6 mt-6 border border-border-primary/60"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin text-brand-500" size={20} />
          <h3 className="font-medium text-text-primary">{statusText}</h3>
        </div>
        <div className="text-brand-500 font-semibold">{Math.round(overallProgress)}%</div>
      </div>

      <div className="h-2 w-full bg-bg-secondary rounded-md overflow-hidden mb-4 relative">
        <motion.div 
          className="h-full gradient-bg absolute left-0 top-0"
          initial={{ width: 0 }}
          animate={{ width: `${overallProgress}%` }}
          transition={{ ease: "linear", duration: 0.5 }}
        />
      </div>

      {status === 'uploading' && (
        <div className="flex justify-between text-xs text-text-secondary">
          <div>{formatBytes(totalSpeed)}/s</div>
          <div>{totalEta > 0 ? `~${Math.ceil(totalEta)}s remaining` : 'Calculating...'}</div>
        </div>
      )}
    </motion.div>
  );
}
