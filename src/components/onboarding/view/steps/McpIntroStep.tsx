import { Plug } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function McpIntroStep() {
  const { t } = useTranslation('onboarding');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Plug className="h-7 w-7 text-primary" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">{t('mcp.title')}</h2>
        <p className="text-muted-foreground">{t('mcp.description')}</p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
        <p>{t('mcp.hint')}</p>
        <p className="mt-2">{t('mcp.skipHint')}</p>
      </div>
    </div>
  );
}
