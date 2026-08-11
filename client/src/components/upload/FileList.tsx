import { motion, AnimatePresence } from 'framer-motion';
import { X, File, Image as ImageIcon, Video, FileText, Music, Archive } from 'lucide-react';
import { useUploadStore } from '../../stores/uploadStore';

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('video/')) return Video;
  if (type.startsWith('audio/')) return Music;
  if (type.startsWith('text/')) return FileText;
  if (type.includes('zip') || type.includes('tar') || type.includes('rar')) return Archive;
  return File;
};

export function FileList() {
  const { files, removeFile, totalSize, isUploading } = useUploadStore();

  if (files.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 mt-6 w-full min-w-0 max-w-full overflow-hidden">
      <div className="flex justify-between items-center px-1 gap-2 w-full min-w-0">
        <h3 className="font-display font-medium text-base sm:text-lg text-text-primary shrink-0">Selected Files</h3>
        <span className="file-count-badge truncate shrink min-w-0 max-w-[55%] text-xs">
          {files.length} {files.length === 1 ? 'file' : 'files'} • {formatBytes(totalSize())}
        </span>
      </div>
      
      <div className="flex flex-col gap-3 w-full min-w-0 max-w-full overflow-hidden">
        <AnimatePresence mode="popLayout">
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                key={file.id}
                className="glass rounded-lg p-3 pr-3 flex items-center gap-3 relative overflow-hidden group border border-border-primary/60 w-full min-w-0 max-w-full box-border"
              >
                {/* Background progress bar during upload */}
                {isUploading && (
                  <div 
                    className="absolute inset-0 bg-brand-500/10 origin-left transition-transform duration-300 ease-out"
                    style={{ transform: `scaleX(${file.progress / 100})` }}
                  />
                )}
                
                <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-bg-secondary flex items-center justify-center shrink-0 overflow-hidden border border-border-primary">
                  {file.preview ? (
                    <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="text-brand-500 shrink-0" size={22} />
                  )}
                </div>
                
                <div className="relative z-10 flex-grow min-w-0 overflow-hidden">
                  <div className="font-medium text-text-primary truncate text-sm sm:text-base" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-xs text-text-secondary flex items-center gap-2 truncate">
                    <span>{formatBytes(file.size)}</span>
                    {isUploading && file.status === 'uploading' && (
                      <>
                        <span>•</span>
                        <span className="text-brand-500">{Math.round(file.progress)}%</span>
                      </>
                    )}
                  </div>
                </div>

                {!isUploading && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="relative z-10 p-1.5 text-text-tertiary hover:text-error-500 hover:bg-error-500/10 rounded-md transition-colors shrink-0 ml-auto min-w-[32px] min-h-[32px] flex items-center justify-center"
                    aria-label="Remove file"
                  >
                    <X size={18} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
