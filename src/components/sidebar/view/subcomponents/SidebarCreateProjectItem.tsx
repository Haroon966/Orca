import { Plus } from 'lucide-react';
import type { TFunction } from 'i18next';

import { Button } from '../../../../shared/view/ui';

type SidebarCreateProjectItemProps = {
  onCreateProject: () => void;
  t: TFunction;
};

export default function SidebarCreateProjectItem({ onCreateProject, t }: SidebarCreateProjectItemProps) {
  return (
    <div className="md:space-y-1">
      <div className="md:group group">
        <div className="md:hidden">
          <button
            type="button"
            className="mx-3 my-1 w-[calc(100%-1.5rem)] rounded-lg border border-dashed border-border/50 bg-card p-3 text-left transition-all duration-150 active:scale-[0.98]"
            onClick={onCreateProject}
          >
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-500/10 dark:border-gray-800 dark:bg-gray-900/30">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium text-foreground">{t('projects.newProject')}</h3>
                  <p className="text-xs text-muted-foreground">{t('tooltips.createProject')}</p>
                </div>
              </div>
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center" aria-hidden />
            </div>
          </button>
        </div>

        <Button
          variant="ghost"
          className="hidden h-auto w-full justify-between rounded-lg border border-dashed border-border/50 p-2 font-normal hover:bg-accent/50 md:flex"
          onClick={onCreateProject}
          title={t('tooltips.createProject')}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border border-dashed border-border/80">
              <Plus className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-semibold text-foreground">{t('projects.newProject')}</div>
              <div className="text-xs text-muted-foreground">{t('tooltips.createProject')}</div>
            </div>
          </div>
          <div className="h-4 w-4 flex-shrink-0" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
