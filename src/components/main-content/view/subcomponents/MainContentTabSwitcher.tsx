import { MessageSquare, Terminal, Folder, GitBranch, ClipboardCheck, MonitorPlay, type LucideIcon } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import { Tooltip, PillBar, Pill } from '../../../../shared/view/ui';
import type { AppTab, PrimaryTab } from '../../../../types/app';
import { usePlugins } from '../../../../contexts/PluginsContext';
import PluginIcon from '../../../plugins/view/PluginIcon';

type MainContentTabSwitcherProps = {
  activeTab: PrimaryTab;
  sidePanel: AppTab | null;
  setActiveTab: Dispatch<SetStateAction<AppTab>>;
  shouldShowTasksTab: boolean;
  shouldShowBrowserTab: boolean;
};

type BuiltInTab = {
  kind: 'builtin';
  id: AppTab;
  labelKey: string;
  icon: LucideIcon;
};

type PluginTab = {
  kind: 'plugin';
  id: AppTab;
  label: string;
  pluginName: string;
  iconFile: string;
};

type TabDefinition = BuiltInTab | PluginTab;

const PRIMARY_TABS: BuiltInTab[] = [
  { kind: 'builtin', id: 'chat', labelKey: 'tabs.chat', icon: MessageSquare },
  { kind: 'builtin', id: 'shell', labelKey: 'tabs.shell', icon: Terminal },
];

const PANEL_TABS: BuiltInTab[] = [
  { kind: 'builtin', id: 'files', labelKey: 'tabs.files', icon: Folder },
  { kind: 'builtin', id: 'git', labelKey: 'tabs.git', icon: GitBranch },
];

const BROWSER_TAB: BuiltInTab = {
  kind: 'builtin',
  id: 'browser',
  labelKey: 'tabs.browser',
  icon: MonitorPlay,
};

const TASKS_TAB: BuiltInTab = {
  kind: 'builtin',
  id: 'tasks',
  labelKey: 'tabs.tasks',
  icon: ClipboardCheck,
};

function renderTabPill(
  tab: TabDefinition,
  isActive: boolean,
  onClick: () => void,
  t: (key: string) => string,
) {
  const displayLabel = tab.kind === 'builtin' ? t(tab.labelKey) : tab.label;

  return (
    <Tooltip key={tab.id} content={displayLabel} position="bottom">
      <Pill isActive={isActive} onClick={onClick} className="px-2.5 py-[5px]">
        {tab.kind === 'builtin' ? (
          <tab.icon className="h-3.5 w-3.5" strokeWidth={isActive ? 2.2 : 1.8} />
        ) : (
          <PluginIcon
            pluginName={tab.pluginName}
            iconFile={tab.iconFile}
            className="flex h-3.5 w-3.5 items-center justify-center [&>svg]:h-full [&>svg]:w-full"
          />
        )}
        <span className="hidden lg:inline">{displayLabel}</span>
      </Pill>
    </Tooltip>
  );
}

export default function MainContentTabSwitcher({
  activeTab,
  sidePanel,
  setActiveTab,
  shouldShowTasksTab,
  shouldShowBrowserTab,
}: MainContentTabSwitcherProps) {
  const { t } = useTranslation();
  const { plugins } = usePlugins();

  const panelTabs: TabDefinition[] = [
    ...PANEL_TABS,
    ...(shouldShowBrowserTab ? [BROWSER_TAB] : []),
    ...(shouldShowTasksTab ? [TASKS_TAB] : []),
    ...plugins
      .filter((p) => p.enabled)
      .map((p) => ({
        kind: 'plugin' as const,
        id: `plugin:${p.name}` as AppTab,
        label: p.displayName,
        pluginName: p.name,
        iconFile: p.icon,
      })),
  ];

  return (
    <PillBar>
      {PRIMARY_TABS.map((tab) =>
        renderTabPill(tab, tab.id === activeTab, () => setActiveTab(tab.id), t),
      )}

      {panelTabs.length > 0 && (
        <div className="mx-1 h-5 w-px flex-shrink-0 bg-border/70" aria-hidden="true" />
      )}

      {panelTabs.map((tab) =>
        renderTabPill(tab, tab.id === sidePanel, () => setActiveTab(tab.id), t),
      )}
    </PillBar>
  );
}
