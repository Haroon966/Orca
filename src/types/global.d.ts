export {};

declare global {
  interface Window {
    __ROUTER_BASENAME__?: string;
    orcaDesktop?: {
      platform: string;
      isDesktop: boolean;
      onUpdateEvent: (channel: string, callback: (payload: unknown) => void) => () => void;
      downloadUpdate: () => Promise<{ ok: boolean; reason?: string; message?: string }>;
      installUpdate: () => Promise<{ ok: boolean; reason?: string; message?: string }>;
      checkForUpdates: () => Promise<{ ok: boolean; reason?: string; message?: string; updateInfo?: unknown }>;
      getAppVersion: () => Promise<string>;
    };
  }

  interface EventSourceEventMap {
    result: MessageEvent;
    progress: MessageEvent;
    done: MessageEvent;
  }
}
