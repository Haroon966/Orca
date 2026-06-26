import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

type UseSidePanelOptions = {
  isMobile: boolean;
  initialWidth?: number;
};

export const useSidePanel = ({ isMobile, initialWidth = 380 }: UseSidePanelOptions) => {
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizeHandleRef = useRef<HTMLDivElement | null>(null);

  const handleResizeStart = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (isMobile) {
        return;
      }

      setIsResizing(true);
      event.preventDefault();
    },
    [isMobile],
  );

  useEffect(() => {
    const handleMouseMove = (event: globalThis.MouseEvent) => {
      if (!isResizing) {
        return;
      }

      const panelContainer = resizeHandleRef.current?.parentElement;
      if (!panelContainer) {
        return;
      }

      const panelRect = panelContainer.getBoundingClientRect();
      const newWidth = panelRect.right - event.clientX;

      const minWidth = 280;
      const parentWidth = panelContainer.parentElement?.clientWidth ?? panelRect.width;
      const maxWidth = parentWidth * 0.6;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return {
    panelWidth,
    resizeHandleRef,
    handleResizeStart,
  };
};
