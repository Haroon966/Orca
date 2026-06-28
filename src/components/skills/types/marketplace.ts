import type { SkillsProvider } from '../types';

export type SkillCatalogEntry = {
  id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  providers: SkillsProvider[];
  repoUrl: string;
  skillPath?: string;
  tags?: string[];
};

export type SkillCatalogResponse = {
  version: number;
  skills: SkillCatalogEntry[];
  categories: string[];
};

export type SkillInstallRequest = {
  catalogId?: string;
  repoUrl?: string;
  skillPath?: string;
  provider: SkillsProvider;
};

export type SkillInstallResponse = {
  provider: SkillsProvider;
  skills: Array<{
    name: string;
    description: string;
    command: string;
    sourcePath: string;
  }>;
};
