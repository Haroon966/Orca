import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { TFunction } from 'i18next';

import { cn } from '../../../../lib/utils';
import type { PermissionMode } from '../../types/types';

type ChatModeDropdownProps = {
  permissionMode: PermissionMode | string;
  permissionModes: PermissionMode[];
  onPermissionModeChange: (mode: PermissionMode) => void;
  t: TFunction;
};

const getModeButtonClass = (mode: PermissionMode | string, isActive = false) => {
  if (isActive) {
    switch (mode) {
      case 'default':
        return 'border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted';
      case 'acceptEdits':
        return 'border-green-300/60 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-600/40 dark:bg-green-900/15 dark:text-green-300 dark:hover:bg-green-900/25';
      case 'auto':
        return 'border-blue-300/60 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-600/40 dark:bg-blue-900/15 dark:text-blue-300 dark:hover:bg-blue-900/25';
      case 'bypassPermissions':
        return 'border-orange-300/60 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-600/40 dark:bg-orange-900/15 dark:text-orange-300 dark:hover:bg-orange-900/25';
      default:
        return 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10';
    }
  }

  return 'border-transparent text-foreground hover:bg-accent/60';
};

const getModeDotClass = (mode: PermissionMode | string) => {
  switch (mode) {
    case 'default':
      return 'bg-muted-foreground';
    case 'acceptEdits':
      return 'bg-green-500';
    case 'auto':
      return 'bg-blue-500';
    case 'bypassPermissions':
      return 'bg-orange-500';
    default:
      return 'bg-primary';
  }
};

const getModeLabelKey = (mode: PermissionMode | string) => `codex.modes.${mode}` as const;
const getModeDescriptionKey = (mode: PermissionMode | string) => `codex.descriptions.${mode}` as const;

export default function ChatModeDropdown({
  permissionMode,
  permissionModes,
  onPermissionModeChange,
  t,
}: ChatModeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  if (permissionModes.length <= 1) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition-all duration-200 sm:px-2.5 sm:py-1',
          getModeButtonClass(permissionMode, true),
        )}
        title={t('input.clickToChangeMode')}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className={cn('h-2.5 w-2.5 rounded-full sm:h-1.5 sm:w-1.5', getModeDotClass(permissionMode))} />
        <span className="hidden max-w-[9rem] truncate whitespace-nowrap sm:inline">
          {t(getModeLabelKey(permissionMode))}
        </span>
        <ChevronDown
          className={cn(
            'h-3 w-3 flex-shrink-0 opacity-70 transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full left-0 z-50 mb-1.5 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          role="listbox"
          aria-label={t('codex.permissionMode')}
        >
          <div className="max-h-72 overflow-y-auto py-1">
            {permissionModes.map((mode) => {
              const isSelected = mode === permissionMode;

              return (
                <button
                  key={mode}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onPermissionModeChange(mode);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors',
                    getModeButtonClass(mode, isSelected),
                  )}
                >
                  <div className={cn('mt-1 h-2 w-2 flex-shrink-0 rounded-full', getModeDotClass(mode))} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      {t(getModeLabelKey(mode))}
                      {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug opacity-80">
                      {t(getModeDescriptionKey(mode))}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
