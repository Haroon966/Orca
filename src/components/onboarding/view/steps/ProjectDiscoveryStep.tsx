import { FolderOpen, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authenticatedFetch } from '../../../../utils/api';

type DiscoveredProject = {
  projectId: string;
  displayName?: string;
  name?: string;
  fullPath?: string;
  sessionCount?: number;
};

export default function ProjectDiscoveryStep() {
  const { t } = useTranslation('onboarding');
  const [projects, setProjects] = useState<DiscoveredProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await authenticatedFetch('/api/projects');
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        const list = Array.isArray(payload) ? payload : payload.projects ?? payload.data ?? [];
        setProjects(list.slice(0, 8));
      } catch {
        // Non-fatal during onboarding
      } finally {
        setLoading(false);
      }
    };

    void loadProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">{t('projects.title')}</h2>
        <p className="text-muted-foreground">{t('projects.description')}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('projects.loading')}
        </div>
      ) : projects.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          {t('projects.empty')}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {projects.map((project) => (
            <li key={project.projectId} className="flex items-center gap-3 px-4 py-3">
              <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {project.displayName || project.name || project.projectId}
                </p>
                {project.fullPath && (
                  <p className="truncate text-xs text-muted-foreground">{project.fullPath}</p>
                )}
              </div>
              {typeof project.sessionCount === 'number' && (
                <span className="text-xs text-muted-foreground">
                  {t('projects.sessionCount', { count: project.sessionCount })}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
