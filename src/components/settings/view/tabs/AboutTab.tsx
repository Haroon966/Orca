import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, Star, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IS_PLATFORM } from '../../../../constants/config';
import { useVersionCheck } from '../../../../hooks/useVersionCheck';
import {
  ORCA_GITHUB,
  ORCA_GITHUB_URL,
  ORCA_PRODUCT_NAME,
  ORCA_TAGLINE,
} from '../../../../config/orca';
import { authenticatedFetch } from '../../../../utils/api';

type HealthData = {
  claudeCli?: { found: boolean; path: string; version: string | null };
  dataDir?: string;
  dataDirExists?: boolean;
  taskMaster?: { installed: boolean; version: string | null };
  browser?: { enabled: boolean; available: boolean };
  server?: { host: string; bindWarning: boolean; bindWarningMessage: string | null };
};

function StatusIcon({ ok, warn }: { ok?: boolean; warn?: boolean }) {
  if (ok) return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
  if (warn) return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
  return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function AboutTab() {
  const { t } = useTranslation('settings');
  const { updateAvailable, latestVersion, currentVersion, releaseInfo } = useVersionCheck(
    ORCA_GITHUB.owner,
    ORCA_GITHUB.repo,
  );
  const releasesUrl = releaseInfo?.htmlUrl || `${ORCA_GITHUB_URL}/releases`;
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const response = await authenticatedFetch('/api/health');
        if (response.ok) {
          const payload = await response.json();
          setHealth(payload.data ?? payload);
        }
      } catch {
        // Non-fatal
      } finally {
        setHealthLoading(false);
      }
    };

    void loadHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/90 shadow-sm">
          <img src="/logo.svg" alt={ORCA_PRODUCT_NAME} className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">{ORCA_PRODUCT_NAME}</span>
            <a
              href={releasesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              v{currentVersion}
            </a>
            {updateAvailable && latestVersion && (
              <a
                href={releasesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 transition-colors hover:bg-green-500/20 dark:text-green-400"
              >
                {t('apiKeys.version.updateAvailable', { version: latestVersion })}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{ORCA_TAGLINE}</p>
        </div>
      </div>

      {!IS_PLATFORM && ORCA_GITHUB.owner !== 'YOUR_USER' && (
        <a
          href={ORCA_GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <GitHubIcon className="h-4 w-4" />
          <Star className="h-3.5 w-3.5" />
          <span>Star on GitHub</span>
        </a>
      )}

      <div className="rounded-lg border border-border bg-card/40 p-4">
        <h4 className="text-sm font-semibold text-foreground">
          {t('about.health.title', { defaultValue: 'System health' })}
        </h4>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('about.health.description', { defaultValue: 'Runtime status for Claude CLI, data paths, and optional features.' })}
        </p>

        {healthLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('about.health.loading', { defaultValue: 'Checking…' })}
          </div>
        ) : health ? (
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <StatusIcon ok={health.claudeCli?.found} />
              <div>
                <span className="font-medium">{t('about.health.claudeCli', { defaultValue: 'Claude CLI' })}</span>
                <p className="text-xs text-muted-foreground">
                  {health.claudeCli?.found
                    ? `${health.claudeCli.path}${health.claudeCli.version ? ` · ${health.claudeCli.version}` : ''}`
                    : t('about.health.notFound', { defaultValue: 'Not found' })}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <StatusIcon ok={health.dataDirExists} warn={!health.dataDirExists} />
              <div>
                <span className="font-medium">{t('about.health.dataDir', { defaultValue: 'Data directory' })}</span>
                <p className="text-xs text-muted-foreground">{health.dataDir}</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <StatusIcon ok={health.taskMaster?.installed} />
              <div>
                <span className="font-medium">{t('about.health.taskMaster', { defaultValue: 'TaskMaster' })}</span>
                <p className="text-xs text-muted-foreground">
                  {health.taskMaster?.installed
                    ? (health.taskMaster.version ?? t('about.health.installed', { defaultValue: 'Installed' }))
                    : t('about.health.notInstalled', { defaultValue: 'Not installed' })}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <StatusIcon ok={health.browser?.available} warn={Boolean(health.browser?.enabled && !health.browser?.available)} />
              <div>
                <span className="font-medium">{t('about.health.browser', { defaultValue: 'Browser runtime' })}</span>
                <p className="text-xs text-muted-foreground">
                  {health.browser?.available
                    ? t('about.health.ready', { defaultValue: 'Ready' })
                    : health.browser?.enabled
                      ? t('about.health.setupRequired', { defaultValue: 'Setup required' })
                      : t('about.health.disabled', { defaultValue: 'Disabled' })}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <StatusIcon ok={!health.server?.bindWarning} warn={health.server?.bindWarning} />
              <div>
                <span className="font-medium">{t('about.health.server', { defaultValue: 'Server bind' })}</span>
                <p className="text-xs text-muted-foreground">
                  {health.server?.bindWarning
                    ? (health.server.bindWarningMessage ?? health.server.host)
                    : health.server?.host}
                </p>
              </div>
            </li>
          </ul>
        ) : null}
      </div>

      <div className="border-t border-border/50 pt-4">
        <p className="text-xs text-muted-foreground/60">Licensed under AGPL-3.0</p>
      </div>
    </div>
  );
}
