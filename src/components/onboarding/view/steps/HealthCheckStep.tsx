import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authenticatedFetch } from '../../../../utils/api';

type HealthData = {
  claudeCli?: { found: boolean; path: string; version: string | null };
  dataDir?: string;
  dataDirExists?: boolean;
  legacyPathsPresent?: string[];
  taskMaster?: { installed: boolean; version: string | null };
  browser?: { enabled: boolean; available: boolean };
  server?: { host: string; bindWarning: boolean; bindWarningMessage: string | null };
};

type StatusRow = {
  label: string;
  status: 'ok' | 'warn' | 'error' | 'info';
  detail: string;
};

function StatusIcon({ status }: { status: StatusRow['status'] }) {
  if (status === 'ok') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === 'warn') return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  if (status === 'error') return <XCircle className="h-4 w-4 text-red-600" />;
  return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
}

export default function HealthCheckStep() {
  const { t } = useTranslation('onboarding');
  const [rows, setRows] = useState<StatusRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const response = await authenticatedFetch('/api/health');
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        const data = (payload.data ?? payload) as HealthData;
        const nextRows: StatusRow[] = [];

        nextRows.push({
          label: t('health.claudeCli'),
          status: data.claudeCli?.found ? 'ok' : 'error',
          detail: data.claudeCli?.found
            ? `${data.claudeCli.path}${data.claudeCli.version ? ` (${data.claudeCli.version})` : ''}`
            : t('health.notFound'),
        });

        nextRows.push({
          label: t('health.dataDir'),
          status: data.dataDirExists ? 'ok' : 'warn',
          detail: data.dataDir ?? '—',
        });

        nextRows.push({
          label: t('health.taskMaster'),
          status: data.taskMaster?.installed ? 'ok' : 'info',
          detail: data.taskMaster?.installed
            ? (data.taskMaster.version ?? t('health.ready'))
            : t('health.notInstalled'),
        });

        nextRows.push({
          label: t('health.browser'),
          status: data.browser?.available ? 'ok' : data.browser?.enabled ? 'warn' : 'info',
          detail: data.browser?.available
            ? t('health.ready')
            : data.browser?.enabled
              ? t('health.setupRequired')
              : t('health.disabled'),
        });

        nextRows.push({
          label: t('health.serverBind'),
          status: data.server?.bindWarning ? 'warn' : 'ok',
          detail: data.server?.bindWarning
            ? (data.server.bindWarningMessage ?? data.server.host)
            : (data.server?.host ?? '—'),
        });

        setRows(nextRows);

        if (data.legacyPathsPresent && data.legacyPathsPresent.length > 0) {
          setRows((prev) => [
            ...prev,
            {
              label: t('health.legacyPaths'),
              status: 'info',
              detail: data.legacyPathsPresent!.join(', '),
            },
          ]);
        }
      } catch {
        // Non-fatal
      } finally {
        setLoading(false);
      }
    };

    void loadHealth();
  }, [t]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">{t('health.title')}</h2>
        <p className="text-muted-foreground">{t('health.description')}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('health.loading')}
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {rows.map((row) => (
            <li key={row.label} className="flex items-start gap-3 px-4 py-3">
              <StatusIcon status={row.status} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{row.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{row.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
