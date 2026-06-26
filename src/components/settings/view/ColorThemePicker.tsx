import { Check, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PRESET_COLOR_THEMES, type ColorThemeId } from '../../../config/orca';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../lib/utils';
import CustomPaletteEditor from './CustomPaletteEditor';

export default function ColorThemePicker() {
  const { t } = useTranslation('settings');
  const { colorTheme, setColorTheme } = useTheme();
  const isCustom = colorTheme === 'custom';

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PRESET_COLOR_THEMES.map((theme) => {
          const isSelected = colorTheme === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => setColorTheme(theme.id as ColorThemeId)}
              aria-pressed={isSelected}
              className={cn(
                'group relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all',
                isSelected
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border/60 hover:border-primary/40',
              )}
            >
              <div
                className="h-16 w-full rounded-lg shadow-inner"
                style={{ background: theme.gradient }}
                aria-hidden
              />
              <span className="text-xs font-medium text-foreground">{t(theme.labelKey)}</span>
              {isSelected && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setColorTheme('custom')}
          aria-pressed={isCustom}
          className={cn(
            'group relative flex flex-col items-center gap-2 rounded-xl border border-dashed p-3 transition-all',
            isCustom
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border/60 hover:border-primary/40',
          )}
        >
          <div className="flex h-16 w-full items-center justify-center rounded-lg bg-muted/50">
            <Palette className="h-8 w-8 text-muted-foreground" aria-hidden />
          </div>
          <span className="text-xs font-medium text-foreground">
            {t('appearanceSettings.colorTheme.custom')}
          </span>
          {isCustom && (
            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </span>
          )}
        </button>
      </div>

      {isCustom && <CustomPaletteEditor />}
    </div>
  );
}
