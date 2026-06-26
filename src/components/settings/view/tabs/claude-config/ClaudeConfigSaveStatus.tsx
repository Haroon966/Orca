import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ClaudeConfigSaveStatusProps = {
  status: 'success' | 'error' | null;
  errorKey?: string;
};

export default function ClaudeConfigSaveStatus({ status, errorKey }: ClaudeConfigSaveStatusProps) {
  const { t } = useTranslation('settings');

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <Check className="h-4 w-4" />
        {t('claudeConfig.saveSuccess', { defaultValue: 'Saved' })}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <span className="text-sm text-red-600 dark:text-red-400">
        {errorKey
          ? t(errorKey, { defaultValue: 'Save failed' })
          : t('claudeConfig.saveFailed', { defaultValue: 'Save failed' })}
      </span>
    );
  }

  return null;
}
