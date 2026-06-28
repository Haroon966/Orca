import type { LLMProvider } from '@/shared/types.js';

export type SkillCatalogEntry = {
  id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  providers: LLMProvider[];
  repoUrl: string;
  skillPath?: string;
  tags?: string[];
};

export type SkillCatalog = {
  version: number;
  skills: SkillCatalogEntry[];
};

export type SkillCatalogListOptions = {
  query?: string;
  category?: string;
  provider?: LLMProvider;
};

export type SkillInstallRequest = {
  catalogId?: string;
  repoUrl?: string;
  skillPath?: string;
  provider: LLMProvider;
};

export type SkillInstallResult = {
  provider: LLMProvider;
  skills: Array<{
    name: string;
    description: string;
    command: string;
    sourcePath: string;
  }>;
};
