import { useTranslation } from 'react-i18next';
import {
  CUSTOM_THEME_COLOR_KEYS,
  type CustomThemeColorKey,
} from '../../../config/orca';
import { useTheme } from '../../../contexts/ThemeContext';
import ColorSwatchPicker from './ColorSwatchPicker';

type PaletteMode = 'light' | 'dark';

type CustomPaletteEditorProps = {
  mode: PaletteMode;
};

function PaletteSection({ mode }: CustomPaletteEditorProps) {
  const { t } = useTranslation('settings');
  const { customPalette, setCustomColor } = useTheme();
  const colors = customPalette[mode];

  const labelKey: Record<CustomThemeColorKey, string> = {
    background: 'appearanceSettings.colorTheme.colors.background',
    foreground: 'appearanceSettings.colorTheme.colors.foreground',
    primary: 'appearanceSettings.colorTheme.colors.primary',
    card: 'appearanceSettings.colorTheme.colors.card',
    border: 'appearanceSettings.colorTheme.colors.border',
    muted: 'appearanceSettings.colorTheme.colors.muted',
  };

  return (
    <div className="space-y-4">
      {CUSTOM_THEME_COLOR_KEYS.map((key) => (
        <div key={key} className="space-y-2">
          <div className="text-sm font-medium text-foreground">{t(labelKey[key])}</div>
          <ColorSwatchPicker
            colorKey={key}
            value={colors[key]}
            onChange={(hex) => setCustomColor(mode, key, hex)}
          />
        </div>
      ))}
    </div>
  );
}

export default function CustomPaletteEditor() {
  const { t } = useTranslation('settings');
  const { resetCustomPalette } = useTheme();

  return (
    <div className="mt-6 space-y-6 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {t('appearanceSettings.colorTheme.custom')}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('appearanceSettings.colorTheme.customDescription')}
          </p>
        </div>
        <button
          type="button"
          onClick={resetCustomPalette}
          className="shrink-0 rounded-lg border border-input bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {t('appearanceSettings.colorTheme.resetCustom')}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('appearanceSettings.colorTheme.lightMode')}
          </h5>
          <PaletteSection mode="light" />
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('appearanceSettings.colorTheme.darkMode')}
          </h5>
          <PaletteSection mode="dark" />
        </div>
      </div>
    </div>
  );
}
