import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { LLMProvider } from '@/shared/types.js';
import { AppError } from '@/shared/utils.js';
import { findAppRoot, getModuleDir } from '@/utils/runtime-paths.js';

import type {
  SkillCatalog,
  SkillCatalogEntry,
  SkillCatalogListOptions,
} from './skills-marketplace.types.js';

const CATALOG_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SKILLS_CATALOG_CACHE_PATH = path.join(os.homedir(), '.orca', 'skills-catalog-cache.json');

type CachedCatalogPayload = {
  fetchedAt: string;
  catalog: SkillCatalog;
};

const normalizeText = (value: string): string => value.trim().toLowerCase();

const getBundledCatalogPath = (): string => {
  const moduleDir = getModuleDir(import.meta.url);
  const candidates = [
    path.join(moduleDir, 'data', 'skills-catalog.json'),
    path.join(findAppRoot(moduleDir), 'server', 'modules', 'skills-marketplace', 'data', 'skills-catalog.json'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new AppError('Bundled skills catalog not found.', {
    code: 'SKILLS_CATALOG_NOT_FOUND',
    statusCode: 500,
  });
};

const readBundledCatalog = (): SkillCatalog => {
  const catalogPath = getBundledCatalogPath();
  const raw = fs.readFileSync(catalogPath, 'utf8');
  return JSON.parse(raw) as SkillCatalog;
};

const readCachedRemoteCatalog = (): CachedCatalogPayload | null => {
  try {
    if (!fs.existsSync(SKILLS_CATALOG_CACHE_PATH)) {
      return null;
    }

    const raw = fs.readFileSync(SKILLS_CATALOG_CACHE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as CachedCatalogPayload;
    if (!parsed?.catalog?.skills || !parsed.fetchedAt) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const writeCachedRemoteCatalog = (catalog: SkillCatalog): void => {
  const cacheDir = path.dirname(SKILLS_CATALOG_CACHE_PATH);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true, mode: 0o700 });
  }

  const payload: CachedCatalogPayload = {
    fetchedAt: new Date().toISOString(),
    catalog,
  };
  fs.writeFileSync(SKILLS_CATALOG_CACHE_PATH, JSON.stringify(payload, null, 2), { mode: 0o600 });
};

const isCacheFresh = (fetchedAt: string): boolean => {
  const fetchedAtMs = Date.parse(fetchedAt);
  if (!Number.isFinite(fetchedAtMs)) {
    return false;
  }

  return Date.now() - fetchedAtMs < CATALOG_CACHE_TTL_MS;
};

const fetchRemoteCatalog = async (url: string): Promise<SkillCatalog | null> => {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return null;
    }

    const catalog = await response.json() as SkillCatalog;
    if (!Array.isArray(catalog?.skills)) {
      return null;
    }

    writeCachedRemoteCatalog(catalog);
    return catalog;
  } catch {
    return null;
  }
};

const mergeCatalogs = (bundled: SkillCatalog, remote: SkillCatalog | null): SkillCatalog => {
  if (!remote) {
    return bundled;
  }

  const mergedById = new Map<string, SkillCatalogEntry>();
  for (const entry of bundled.skills) {
    mergedById.set(entry.id, entry);
  }
  for (const entry of remote.skills) {
    mergedById.set(entry.id, entry);
  }

  return {
    version: Math.max(bundled.version, remote.version ?? bundled.version),
    skills: Array.from(mergedById.values()),
  };
};

const filterCatalog = (
  catalog: SkillCatalog,
  options: SkillCatalogListOptions = {},
): SkillCatalogEntry[] => {
  const query = options.query ? normalizeText(options.query) : '';
  const category = options.category ? normalizeText(options.category) : '';
  const provider = options.provider;

  return catalog.skills.filter((entry) => {
    if (provider && !entry.providers.includes(provider)) {
      return false;
    }

    if (category && normalizeText(entry.category) !== category) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      entry.name,
      entry.description,
      entry.author,
      entry.category,
      ...(entry.tags ?? []),
    ].join(' ').toLowerCase();

    return haystack.includes(query);
  });
};

const resolveCatalog = async (): Promise<SkillCatalog> => {
  const bundled = readBundledCatalog();
  const remoteUrl = process.env.ORCA_SKILLS_CATALOG_URL?.trim();

  if (!remoteUrl) {
    return bundled;
  }

  const cached = readCachedRemoteCatalog();
  if (cached && isCacheFresh(cached.fetchedAt)) {
    return mergeCatalogs(bundled, cached.catalog);
  }

  const remote = await fetchRemoteCatalog(remoteUrl);
  if (remote) {
    return mergeCatalogs(bundled, remote);
  }

  if (cached) {
    return mergeCatalogs(bundled, cached.catalog);
  }

  return bundled;
};

export const skillsCatalogService = {
  async listCatalog(options: SkillCatalogListOptions = {}): Promise<{
    version: number;
    skills: SkillCatalogEntry[];
    categories: string[];
  }> {
    const catalog = await resolveCatalog();
    const skills = filterCatalog(catalog, options);
    const categories = Array.from(new Set(catalog.skills.map((entry) => entry.category))).sort();

    return {
      version: catalog.version,
      skills,
      categories,
    };
  },

  async getCatalogEntry(id: string): Promise<SkillCatalogEntry> {
    const catalog = await resolveCatalog();
    const entry = catalog.skills.find((skill) => skill.id === id);
    if (!entry) {
      throw new AppError(`Skill catalog entry "${id}" was not found.`, {
        code: 'SKILLS_CATALOG_ENTRY_NOT_FOUND',
        statusCode: 404,
      });
    }

    return entry;
  },

  sanitizeRepoUrl(rawUrl: string): string {
    try {
      const parsed = new URL(rawUrl);
      parsed.username = '';
      parsed.password = '';
      return parsed.toString().replace(/\/$/, '');
    } catch {
      return rawUrl.replace(/\/\/[^@/]+@/, '//').replace(/\/$/, '');
    }
  },

  isSupportedProvider(value: string): value is LLMProvider {
    return value === 'claude'
      || value === 'codex'
      || value === 'cursor'
      || value === 'gemini'
      || value === 'opencode';
  },
};
