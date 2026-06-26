import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, MutableRefObject, ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AppTab } from '../../../types/app';

const MIN_PRIMARY_WIDTH = 200;
const MIN_PANEL_WIDTH = 280;

type SidePanelProps = {
  panel: AppTab;
  isMobile: boolean;
  panelWidth: number;
  resizeHandleRef: MutableRefObject<HTMLDivElement | null>;
  onResizeStart: (event: MouseEvent<HTMLDivElement>) => void;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export default function SidePanel({
  panel,
  isMobile,
  panelWidth,
  resizeHandleRef,
  onResizeStart,
  onClose,
  title,
  children,
}: SidePanelProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [effectiveWidth, setEffectiveWidth] = useState(panelWidth);

  useEffect(() => {
    if (isMobile) {
      return;
    }

    const updateWidth = () => {
      if (!containerRef.current) {
        return;
      }

      const parentElement = containerRef.current.parentElement;
      if (!parentElement) {
        return;
      }

      const containerWidth = parentElement.clientWidth;
      const maxPanelWidth = containerWidth - MIN_PRIMARY_WIDTH;

      if (maxPanelWidth < MIN_PANEL_WIDTH) {
        setEffectiveWidth(MIN_PANEL_WIDTH);
      } else if (panelWidth > maxPanelWidth) {
        setEffectiveWidth(maxPanelWidth);
      } else {
        setEffectiveWidth(panelWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    const resizeObserver = new ResizeObserver(updateWidth);
    const parentEl = containerRef.current?.parentElement;
    if (parentEl) {
      resizeObserver.observe(parentEl);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      resizeObserver.disconnect();
    };
  }, [isMobile, panelWidth]);

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[9998] flex flex-col bg-background">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-3 py-2">
          <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            title={t('common.close', 'Close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full min-w-0 flex-shrink-0"
      style={{ width: `${effectiveWidth}px`, minWidth: `${MIN_PANEL_WIDTH}px` }}
      data-side-panel={panel}
    >
      <div
        ref={resizeHandleRef}
        onMouseDown={onResizeStart}
        className="group relative w-1 flex-shrink-0 cursor-col-resize bg-gray-200 transition-colors hover:bg-blue-500 dark:bg-gray-700 dark:hover:bg-blue-600"
        title="Drag to resize"
      >
        <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-blue-600" />
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden border-l border-border bg-background">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border/60 px-3 py-1.5">
          <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            title={t('common.close', 'Close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
