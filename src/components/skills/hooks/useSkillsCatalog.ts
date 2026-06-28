import { useCallback, useEffect, useMemo, useState } from 'react';

import { authenticatedFetch } from '../../../utils/api';
import type {
  ApiResponse,
  SkillsProvider,
} from '../types';
import type {
  SkillCatalogEntry,
  SkillCatalogResponse,
  SkillInstallRequest,
  SkillInstallResponse,
} from '../types/marketplace';

type UseSkillsCatalogArgs = {
  selectedProvider: SkillsProvider;
  installedSkillNames: string[];
  onInstalled?: () => void | Promise<void>;
};

type UseSkillsCatalogResult = {
  skills: SkillCatalogEntry[];
  categories: string[];
  isLoading: boolean;
  loadError: string | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  installingId: string | null;
  installError: string | null;
  refreshCatalog: () => Promise<void>;
  installSkill: (catalogId: string) => Promise<boolean>;
  isInstalled: (entry: SkillCatalogEntry) => boolean;
};

const toResponseJson = async <T>(response: Response): Promise<T> => response.json() as Promise<T>;

const getApiErrorMessage = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const error = record.error;
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  if (error && typeof error === 'object') {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
};

export function useSkillsCatalog({
  selectedProvider,
  installedSkillNames,
  onInstalled,
}: UseSkillsCatalogArgs): UseSkillsCatalogResult {
  const [skills, setSkills] = useState<SkillCatalogEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  const installedNameSet = useMemo(
    () => new Set(installedSkillNames.map((name) => name.trim().toLowerCase())),
    [installedSkillNames],
  );

  const refreshCatalog = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams({ provider: selectedProvider });
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }
      if (selectedCategory) {
        params.set('category', selectedCategory);
      }

      const response = await authenticatedFetch(`/api/skills/catalog?${params.toString()}`);
      const payload = await toResponseJson<ApiResponse<SkillCatalogResponse>>(response);

      if (!response.ok || payload.success === false) {
        throw new Error(getApiErrorMessage(payload, 'Failed to load skills catalog.'));
      }

      setSkills(payload.data?.skills ?? []);
      setCategories(payload.data?.categories ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load skills catalog.');
      setSkills([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedProvider]);

  const installSkill = useCallback(async (catalogId: string) => {
    setInstallingId(catalogId);
    setInstallError(null);

    try {
      const body: SkillInstallRequest = {
        catalogId,
        provider: selectedProvider,
      };

      const response = await authenticatedFetch('/api/skills/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await toResponseJson<ApiResponse<SkillInstallResponse>>(response);

      if (!response.ok || payload.success === false) {
        throw new Error(getApiErrorMessage(payload, 'Failed to install skill.'));
      }

      await onInstalled?.();
      return true;
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : 'Failed to install skill.');
      return false;
    } finally {
      setInstallingId(null);
    }
  }, [onInstalled, selectedProvider]);

  const isInstalled = useCallback((entry: SkillCatalogEntry) => (
    installedNameSet.has(entry.name.trim().toLowerCase())
    || installedNameSet.has(entry.id.trim().toLowerCase())
  ), [installedNameSet]);

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  return {
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
  };
}
