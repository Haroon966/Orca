import { useEffect, useRef, useState } from 'react';

export type DesktopUpdateAvailable = {
  version: string;
  releaseNotes: string;
  releaseDate: string | null;
};

export type DesktopUpdateProgress = {
  percent: number;
  transferred: number;
  total: number;
};

export type DesktopUpdateDownloaded = {
  version: string;
};

export type DesktopUpdateError = {
  message: string;
};

type UseDesktopUpdaterOptions = {
  onUpdateAvailable?: (info: DesktopUpdateAvailable) => void;
};

export function useDesktopUpdater({ onUpdateAvailable }: UseDesktopUpdaterOptions = {}) {
  const [updateAvailable, setUpdateAvailable] = useState<DesktopUpdateAvailable | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DesktopUpdateProgress | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState<DesktopUpdateDownloaded | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const notifiedVersionRef = useRef<string | null>(null);

  useEffect(() => {
    const desktop = window.orcaDesktop;
    if (!desktop?.isDesktop) {
      return;
    }

    const unsubscribers = [
      desktop.onUpdateEvent('desktop-update-available', (payload) => {
        const info = payload as DesktopUpdateAvailable;
        setUpdateAvailable(info);
        setUpdateError(null);

        if (notifiedVersionRef.current !== info.version) {
          notifiedVersionRef.current = info.version;
          onUpdateAvailable?.(info);
        }
      }),
      desktop.onUpdateEvent('desktop-update-progress', (payload) => {
        setDownloadProgress(payload as DesktopUpdateProgress);
      }),
      desktop.onUpdateEvent('desktop-update-downloaded', (payload) => {
        setUpdateDownloaded(payload as DesktopUpdateDownloaded);
        setDownloadProgress(null);
      }),
      desktop.onUpdateEvent('desktop-update-error', (payload) => {
        const error = payload as DesktopUpdateError;
        setUpdateError(error.message);
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [onUpdateAvailable]);

  const downloadUpdate = async () => {
    setUpdateError(null);
    const result = await window.orcaDesktop?.downloadUpdate();
    if (result && !result.ok) {
      throw new Error(result.message || result.reason || 'Update failed');
    }
  };

  const installUpdate = async () => {
    const result = await window.orcaDesktop?.installUpdate();
    if (result && !result.ok) {
      throw new Error(result.message || result.reason || 'Install failed');
    }
  };

  return {
    isDesktop: Boolean(window.orcaDesktop?.isDesktop),
    updateAvailable,
    downloadProgress,
    updateDownloaded,
    updateError,
    downloadUpdate,
    installUpdate,
  };
}
