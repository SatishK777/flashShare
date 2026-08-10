import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Lock, Sparkles, Upload } from 'lucide-react';
import { DropZone } from '../components/upload/DropZone';
import { FileList } from '../components/upload/FileList';
import { ShareSettingsPanel } from '../components/upload/ShareSettings';
import { UploadProgress } from '../components/upload/UploadProgress';
import { QRDisplay } from '../components/share/QRDisplay';
import { Button } from '../components/ui/button';
import { useUploadStore } from '../stores/uploadStore';
import { useShareStore } from '../stores/shareStore';
import { api } from '../services/api';
import { generateEncryptionKey, exportKey } from '../services/encryption';
import { uploadFileInChunks } from '../services/chunker';

export function CreateSharePage() {
  const { files, setUploading, updateFileProgress, clearFiles } = useUploadStore();
  const { status, settings, setStatus, setShare, setError } = useShareStore();

  const expiresAt = useShareStore(state => state.expiresAt);
  const resetShare = useShareStore(state => state.reset);

  // Check if active share is expired on mount
  useEffect(() => {
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
      resetShare();
    }
  }, [expiresAt, resetShare]);

  const handleGenerate = async () => {
    try {
      setStatus('creating');
      setUploading(true);

      // 1. Generate encryption key
      const key = await generateEncryptionKey();
      const keyStr = await exportKey(key);

      // 2. Create share
      const shareRes = await api.createShare(settings);
      const share = shareRes.data;

      setStatus('uploading');

      // 3. Register files
      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
      for (const fileItem of files) {
        const chunkCount = Math.ceil(fileItem.size / CHUNK_SIZE);
        const fileRes = await api.registerFile(share.id, {
          originalName: fileItem.name,
          size: fileItem.size,
          mimeType: fileItem.type,
          checksumSha256: 'pending', // Will be verified after upload
          chunkCount,
        });
        updateFileProgress(fileItem.id, { serverFileId: fileRes.data.fileId });
      }

      // 4. Upload files
      for (const fileItem of files) {
        const currentFile = useUploadStore.getState().files.find(f => f.id === fileItem.id);
        if (!currentFile?.serverFileId) continue;
        
        await uploadFileInChunks(
          share.id,
          currentFile.serverFileId,
          currentFile.file,
          key,
          (progress) => {
            updateFileProgress(currentFile.id, {
              progress: (progress.uploadedSize / progress.totalSize) * 100,
              speed: progress.speed,
              eta: progress.eta,
              status: progress.status
            });
          }
        );
      }

      setStatus('finalizing');

      // 5. Finalize
      await api.finalizeShare(share.id);

      // 6. Complete
      setShare({
        shareId: share.id,
        token: share.token,
        encryptionKey: keyStr,
        expiresAt: share.expiresAt,
      });
      setStatus('ready');
      setUploading(false);
      clearFiles();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during upload');
      setStatus('error');
      setUploading(false);
    }
  };

  if (status === 'ready') {
    return (
      <div className="page-container app-page animate-in fade-in zoom-in duration-500">
        <QRDisplay />
      </div>
    );
  }

  const hasFiles = files.length > 0;
  const isProcessing = status === 'creating' || status === 'uploading' || status === 'finalizing';

  let buttonText = 'Generate QR Code';
  if (status === 'creating') buttonText = 'Preparing Share...';
  if (status === 'uploading') buttonText = 'Encrypting & Uploading...';
  if (status === 'finalizing') buttonText = 'Finalizing...';

  return (
    <div className="page-container app-page">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="app-heading text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="flex items-center justify-center md:justify-start gap-4">
            <ShieldCheck className="text-brand-500 w-10 h-10 md:w-12 md:h-12" />
            <span className="gradient-text">Create a Secure Share</span>
          </h1>
          <p className="flex items-center justify-center md:justify-start gap-2">
            Upload files with end-to-end encryption and zero-knowledge architecture.
          </p>
        </div>
      </motion.div>

      <div className="create-grid">
        {/* Left Column: Files */}
        <div className="flex flex-col gap-6">
          <motion.div 
            layout 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-brand-500/5 rounded-lg blur-xl -z-10" />
            <DropZone compact={hasFiles} />
          </motion.div>
          <FileList />
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <UploadProgress />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Settings */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="settings-card glass p-5 md:p-6 relative overflow-hidden premium-ring"
          >
            <div className="absolute inset-x-0 top-0 h-1 gradient-bg" />
            
            <div className="security-settings-header relative z-10">
              <div className="w-11 h-11 rounded-xl bg-bg-secondary flex items-center justify-center text-brand-500 border border-border-primary shadow-sm shrink-0">
                <Lock size={22} />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-text-primary">Security Settings</h2>
                <p className="text-xs sm:text-sm text-text-secondary mt-0.5">Configure access controls</p>
              </div>
            </div>

            <div className="relative z-10">
              <ShareSettingsPanel />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              size="lg"
              className="w-full h-14 text-lg rounded-lg shadow-lg hover:shadow-brand-500/30 transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed border border-brand-500/20"
              disabled={!hasFiles || isProcessing}
              onClick={handleGenerate}
            >
              <div className="absolute inset-0 gradient-bg opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center justify-center gap-3 font-bold text-white">
                {isProcessing ? (
                  <Upload className="animate-bounce" size={26} />
                ) : (
                  <Sparkles className="group-hover:rotate-12 transition-transform duration-300" size={26} />
                )}
                {buttonText}
              </span>
            </Button>
          </motion.div>

          {/* Features info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2"
          >
            <div className="upload-info-card glass p-4 flex flex-col gap-2 hover:bg-bg-secondary/50 transition-colors border border-border-primary/50">
              <div className="w-10 h-10 rounded-md bg-brand-500/10 flex items-center justify-center text-brand-500 mb-1">
                <ShieldCheck size={20} />
              </div>
              <h4 className="font-semibold text-text-primary text-sm">E2E Encrypted</h4>
              <p className="text-xs text-text-secondary leading-relaxed">Zero-knowledge architecture. Files are encrypted on device.</p>
            </div>
            
            <div className="upload-info-card glass p-4 flex flex-col gap-2 hover:bg-bg-secondary/50 transition-colors border border-border-primary/50">
              <div className="w-10 h-10 rounded-md bg-accent-500/10 flex items-center justify-center text-accent-500 mb-1">
                <Zap size={20} />
              </div>
              <h4 className="font-semibold text-text-primary text-sm">Lightning Fast</h4>
              <p className="text-xs text-text-secondary leading-relaxed">Parallel chunking ensures maximum transfer speeds.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
