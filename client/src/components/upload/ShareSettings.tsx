import { Clock, Download, Eye, Trash2 } from 'lucide-react';
import { useShareStore } from '../../stores/shareStore';
import { cn } from '../../lib/utils';

export function ShareSettingsPanel() {
  const settings = useShareStore(state => state.settings);
  const setSettings = useShareStore(state => state.setSettings);
  const status = useShareStore(state => state.status);
  const isUploading = status !== 'idle' && status !== 'error';

  const disabled = isUploading;

  return (
    <div className="flex flex-col gap-4">
        {/* Expiration */}
        <div className="settings-row">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-brand-500" />
            <label className="text-sm font-medium text-text-primary">Expires in</label>
          </div>
          <select
            disabled={disabled}
            className="settings-select bg-bg-primary border border-border-primary rounded-xl px-4 py-2.5 text-sm font-medium text-text-primary outline-none focus:border-brand-500 hover:border-brand-500/50 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            value={settings.expiresInMinutes}
            onChange={(e) => setSettings({ expiresInMinutes: parseInt(e.target.value) })}
          >
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={360}>6 hours</option>
            <option value={1440}>24 hours</option>
          </select>
        </div>

        {/* Max Downloads */}
        <div className="settings-row">
          <div className="flex items-center gap-3">
            <Download size={18} className="text-brand-500" />
            <label className="text-sm font-medium text-text-primary">Max downloads</label>
          </div>
          <select
            disabled={disabled}
            className="settings-select bg-bg-primary border border-border-primary rounded-xl px-4 py-2.5 text-sm font-medium text-text-primary outline-none focus:border-brand-500 hover:border-brand-500/50 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            value={settings.maxDownloads}
            onChange={(e) => setSettings({ maxDownloads: parseInt(e.target.value) })}
          >
            <option value={1}>1 time</option>
            <option value={5}>5 times</option>
            <option value={10}>10 times</option>
            <option value={0}>Unlimited</option>
          </select>
        </div>

        {/* Auto Delete */}
        <div className="settings-row">
          <div className="flex items-center gap-3">
            <Trash2 size={18} className="text-brand-500" />
            <label className="text-sm font-medium text-text-primary">Auto delete</label>
          </div>
          <select
            disabled={disabled}
            className="settings-select bg-bg-primary border border-border-primary rounded-xl px-4 py-2.5 text-sm font-medium text-text-primary outline-none focus:border-brand-500 hover:border-brand-500/50 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            value={settings.autoDeletePolicy}
            onChange={(e) => setSettings({ autoDeletePolicy: e.target.value as any })}
          >
            <option value="after_download">After download</option>
            <option value="after_expiry">After expiry</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {/* Show Filenames */}
        <div className="settings-row">
          <div className="flex items-center gap-3">
            <Eye size={18} className="text-brand-500" />
            <label className="text-sm font-medium text-text-primary">Show filenames</label>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setSettings({ showFilenames: !settings.showFilenames })}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50",
              settings.showFilenames ? "bg-brand-500" : "bg-neutral-300 dark:bg-neutral-700"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                settings.showFilenames ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>
  );
}
