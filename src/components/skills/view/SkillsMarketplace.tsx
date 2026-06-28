import {
  CheckCircle2,
  Download,
  ExternalLink,
  GitBranch,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Badge,
  Button,
  Input,
  useToast,
} from '../../../shared/view/ui';
import type { ProviderSkill, SkillsProvider } from '../types';
import type { SkillCatalogEntry } from '../types/marketplace';
import { useSkillsCatalog } from '../hooks/useSkillsCatalog';

type SkillsMarketplaceProps = {
  selectedProvider: SkillsProvider;
  installedSkills: ProviderSkill[];
  onInstalled: () => Promise<void>;
};

const CATEGORY_LABELS: Record<string, string> = {
  design: 'Design',
  development: 'Development',
  documents: 'Documents',
  productivity: 'Productivity',
  communication: 'Communication',
  creative: 'Creative',
  efficiency: 'Efficiency',
};

function repoSlug(repoUrl: string) {
  return repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '');
}

function MarketplaceCard({
  entry,
  installing,
  installed,
  onInstall,
}: {
  entry: SkillCatalogEntry;
  installing: boolean;
  installed: boolean;
  onInstall: () => void;
}) {
  const { t } = useTranslation('settings');

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-opacity duration-200">
      <div className={`absolute inset-y-0 left-0 w-[3px] ${installed ? 'bg-emerald-500' : 'bg-blue-500/40'}`} />
      <div className="flex min-h-0 flex-1 flex-col p-4 pl-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold leading-none text-foreground">
              {entry.name}
            </span>
            <Badge variant="outline" className="rounded-full bg-background/70">
              {CATEGORY_LABELS[entry.category] ?? entry.category}
            </Badge>
            {installed && (
              <Badge variant="outline" className="rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                {t('skillsMarketplace.installed')}
              </Badge>
            )}
          </div>
          <p className="mt-1 line-clamp-3 text-sm leading-snug text-muted-foreground">
            {entry.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground/70">
            <span>{entry.author}</span>
            <a
              href={entry.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center gap-1 transition-colors hover:text-foreground"
            >
              <GitBranch className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{repoSlug(entry.repoUrl)}</span>
              <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
            </a>
          </div>
          {entry.tags && entry.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {entry.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          disabled={installing || installed}
          onClick={onInstall}
          className="mt-4 w-full"
        >
          {installing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : installed ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {installing
            ? t('skillsMarketplace.installing')
            : installed
              ? t('skillsMarketplace.installed')
              : t('skillsMarketplace.install')}
        </Button>
      </div>
    </div>
  );
}

export default function SkillsMarketplace({
  selectedProvider,
  installedSkills,
  onInstalled,
}: SkillsMarketplaceProps) {
  const { t } = useTranslation('settings');
  const { showToast } = useToast();

  const installedSkillNames = installedSkills
    .filter((skill) => skill.scope === 'user')
    .map((skill) => skill.name);

  const {
    skills,
    categories,
    isLoading,
    loadError,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    installingId,
    installError,
    refreshCatalog,
    installSkill,
    isInstalled,
  } = useSkillsCatalog({
    selectedProvider,
    installedSkillNames,
    onInstalled,
  });

  const handleInstall = async (catalogId: string, name: string) => {
    const success = await installSkill(catalogId);
    if (success) {
      showToast(t('skillsMarketplace.installSuccess', { name }), 'success');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-foreground">
          {t('skillsMarketplace.title')}
        </h4>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('skillsMarketplace.description')}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('skillsMarketplace.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            aria-label={t('skillsMarketplace.categoryFilter')}
          >
            <option value="">{t('skillsMarketplace.allCategories')}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category] ?? category}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refreshCatalog()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <p className="flex items-start gap-1.5 text-xs leading-snug text-muted-foreground/70">
        <ShieldAlert className="mt-px h-3 w-3 flex-shrink-0" />
        <span>{t('skillsMarketplace.securityWarning')}</span>
      </p>

      {(loadError || installError) && (
        <p className="text-sm text-red-500">{loadError || installError}</p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('skillsMarketplace.loading')}
        </div>
      ) : skills.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {t('skillsMarketplace.empty')}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {skills.map((entry) => (
            <MarketplaceCard
              key={entry.id}
              entry={entry}
              installing={installingId === entry.id}
              installed={isInstalled(entry)}
              onInstall={() => void handleInstall(entry.id, entry.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
