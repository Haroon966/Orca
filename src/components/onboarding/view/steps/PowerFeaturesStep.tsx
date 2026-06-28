import { Command, FileCode2, GitBranch, ListChecks, MonitorPlay } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FEATURES = [
  { key: 'commandPalette', icon: Command },
  { key: 'gitPanel', icon: GitBranch },
  { key: 'taskMaster', icon: ListChecks },
  { key: 'browser', icon: MonitorPlay },
  { key: 'claudeConfig', icon: FileCode2 },
] as const;

export default function PowerFeaturesStep() {
  const { t } = useTranslation('onboarding');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">{t('features.title')}</h2>
        <p className="text-muted-foreground">{t('features.description')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                {t(`features.${key}.title`)}
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t(`features.${key}.description`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
