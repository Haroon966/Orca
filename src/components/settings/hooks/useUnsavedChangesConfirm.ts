import { useCallback, useEffect, useRef } from 'react';

const DEFAULT_MESSAGE =
  'You have unsaved changes. Discard them and continue?';

export function confirmDiscardUnsavedChanges(message = DEFAULT_MESSAGE): boolean {
  return window.confirm(message);
}

export function useUnsavedChangesReporter(
  isDirty: boolean,
  onDirtyChange?: (dirty: boolean) => void,
) {
  const onDirtyChangeRef = useRef(onDirtyChange);
  onDirtyChangeRef.current = onDirtyChange;

  useEffect(() => {
    onDirtyChangeRef.current?.(isDirty);
  }, [isDirty]);

  useEffect(
    () => () => {
      onDirtyChangeRef.current?.(false);
    },
    [],
  );
}

export function useGuardedAction(isDirty: boolean, confirmMessage?: string) {
  return useCallback(
    (action: () => void) => {
      if (isDirty && !confirmDiscardUnsavedChanges(confirmMessage)) {
        return;
      }
      action();
    },
    [confirmMessage, isDirty],
  );
}
