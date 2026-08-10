import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useUploadStore } from '../../stores/uploadStore';

interface DropZoneProps {
  compact?: boolean;
}

export function DropZone({ compact = false }: DropZoneProps) {
  const addFiles = useUploadStore(state => state.addFiles);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      addFiles(acceptedFiles);
    }
  }, [addFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024 * 1024, // 50GB
  });

  // Separate the event handlers from getRootProps to avoid motion.div type conflicts
  const rootProps = getRootProps();
  const { role, tabIndex, ...restRootProps } = rootProps;

  return (
    <div
      {...restRootProps}
      role={role}
      tabIndex={tabIndex}
      className={cn(
        'glass rounded-lg border border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden premium-ring',
        compact ? 'drop-zone drop-zone-compact' : 'drop-zone',
        isDragActive
          ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
          : 'border-border-primary hover:border-brand-400'
      )}
    >
      <input {...getInputProps()} />
      <motion.div
        animate={{ y: isDragActive ? -10 : 0, scale: isDragActive ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="rounded-lg bg-brand-500/10 p-3 mb-4 text-brand-400 border border-brand-500/20"
      >
        <Upload size={compact ? 24 : 32} />
      </motion.div>
      <h3 className={cn("font-display font-semibold text-text-primary", compact ? "text-lg mb-1" : "text-2xl mb-2")}>
        {isDragActive ? "Drop files now" : "Drop files here"}
      </h3>
      <p className="text-text-secondary mb-4 max-w-sm text-sm sm:text-base">
        or tap to select files from your device
      </p>
      {!compact && (
        <div className="text-xs text-text-tertiary rounded-md border border-border-primary bg-bg-secondary/60 px-3 py-1.5">
          Up to 50GB total size • All file types supported
        </div>
      )}
    </div>
  );
}
