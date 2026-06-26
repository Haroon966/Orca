import { useCallback, useEffect, useState } from 'react';
import { Download, Maximize2, Minimize2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authenticatedFetch } from '../../../../utils/api';
import type { CodeEditorFile } from '../../types/types';

type CodeEditorImagePreviewProps = {
  file: CodeEditorFile;
  onClose: () => void;
  projectPath?: string;
  isSidebar?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (() => void) | null;
  onPopOut?: (() => void) | null;
};

export default function CodeEditorImagePreview({
  file,
  onClose,
  projectPath,
  isSidebar = false,
  isExpanded = false,
  onToggleExpand = null,
  onPopOut = null,
}: CodeEditorImagePreviewProps) {
  const { t } = useTranslation('codeEditor');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fileProjectId = file.projectId ?? projectPath;
  const imagePath = fileProjectId
    ? `/api/projects/${fileProjectId}/files/content?path=${encodeURIComponent(file.path)}`
    : null;

  useEffect(() => {
    if (!imagePath) {
      setError('Missing project identifier');
      setLoading(false);
      return;
    }

    let objectUrl: string | null = null;
    const controller = new AbortController();

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);
        setImageUrl(null);

        const response = await authenticatedFetch(imagePath, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (loadError: unknown) {
        if (loadError instanceof Error && loadError.name === 'AbortError') {
          return;
        }
        console.error('Error loading image:', loadError);
        setError('Unable to load image');
      } finally {
        setLoading(false);
      }
    };

    void loadImage();

    return () => {
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imagePath]);

  const handleDownload = useCallback(async () => {
    if (!imagePath) {
      return;
    }

    try {
      const response = await authenticatedFetch(imagePath);
      if (!response.ok) {
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Error downloading image:', downloadError);
    }
  }, [file.name, imagePath]);

  const header = (
    <div className="flex min-w-0 flex-shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-1.5">
      <div className="flex min-w-0 flex-1 shrink items-center gap-2">
        <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">{file.name}</h3>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={loading || !imageUrl}
          className="flex items-center justify-center rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          title={t('actions.download')}
        >
          <Download className="h-4 w-4" />
        </button>
        {isSidebar && onPopOut && (
          <button
            type="button"
            onClick={onPopOut}
            className="flex items-center justify-center rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title={t('actions.fullscreen')}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}
        {isSidebar && onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-center justify-center rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title={isExpanded ? t('toolbar.collapse') : t('toolbar.expand')}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        )}
        {!isSidebar && (
          <button
            type="button"
            onClick={() => setIsFullscreen((previous) => !previous)}
            className="flex items-center justify-center rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title={isFullscreen ? t('actions.exitFullscreen') : t('actions.fullscreen')}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          title={t('actions.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const body = (
    <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/30 p-4">
      {loading && (
        <p className="text-sm text-muted-foreground">{t('loading', { fileName: file.name })}</p>
      )}
      {!loading && imageUrl && (
        <img
          src={imageUrl}
          alt={file.name}
          className="max-h-full max-w-full object-contain"
        />
      )}
      {!loading && !imageUrl && (
        <div className="text-center text-sm text-muted-foreground">
          <p>{error || 'Unable to load image'}</p>
          <p className="mt-2 break-all">{file.path}</p>
        </div>
      )}
    </div>
  );

  if (isSidebar) {
    return (
      <div className="flex h-full w-full flex-col bg-background">
        {header}
        {body}
      </div>
    );
  }

  const outerContainerClassName = isFullscreen
    ? 'fixed inset-0 z-[9999] bg-background flex flex-col'
    : 'fixed inset-0 z-[9999] md:bg-black/50 md:flex md:items-center md:justify-center md:p-4';

  const innerContainerClassName = isFullscreen
    ? 'bg-background flex flex-col w-full h-full'
    : 'bg-background shadow-2xl flex flex-col w-full h-full md:rounded-lg md:shadow-2xl md:w-full md:max-w-6xl md:h-[80vh] md:max-h-[80vh]';

  return (
    <div className={outerContainerClassName}>
      <div className={innerContainerClassName}>
        {header}
        {body}
      </div>
    </div>
  );
}
