import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { COLOR_SWATCHES, type CustomThemeColorKey } from '../../../config/orca';
import { cn } from '../../../lib/utils';
import { normalizeHex } from '../../../utils/customTheme';

type ColorSwatchPickerProps = {
  colorKey: CustomThemeColorKey;
  value: string;
  onChange: (hex: string) => void;
};

export default function ColorSwatchPicker({ colorKey, value, onChange }: ColorSwatchPickerProps) {
  const { t } = useTranslation('settings');
  const [hexInput, setHexInput] = useState(value);
  const swatches = COLOR_SWATCHES[colorKey];

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const handleHexCommit = (raw: string) => {
    const normalized = normalizeHex(raw);
    if (normalized) {
      onChange(normalized);
      setHexInput(normalized);
      return;
    }

    setHexInput(value);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {swatches.map((swatch) => {
          const isSelected = value.toUpperCase() === swatch.toUpperCase();
          return (
            <button
              key={swatch}
              type="button"
              onClick={() => onChange(swatch)}
              aria-label={swatch}
              aria-pressed={isSelected}
              className={cn(
                'h-7 w-7 rounded-full border-2 transition-all',
                isSelected
                  ? 'border-primary ring-2 ring-primary/30 scale-110'
                  : 'border-border/60 hover:scale-105 hover:border-primary/40',
              )}
              style={{ backgroundColor: swatch }}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-9 w-12 cursor-pointer rounded-lg border border-input bg-card p-1"
          aria-label={t('appearanceSettings.colorTheme.pickColor')}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(event) => setHexInput(event.target.value)}
          onBlur={() => handleHexCommit(hexInput)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleHexCommit(hexInput);
            }
          }}
          placeholder={t('appearanceSettings.colorTheme.hexPlaceholder')}
          className="w-28 rounded-lg border border-input bg-card px-2.5 py-2 font-mono text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
