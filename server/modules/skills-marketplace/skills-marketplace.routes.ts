import express, { type Request, type Response } from 'express';

import type { LLMProvider } from '@/shared/types.js';
import { AppError, asyncHandler, createApiSuccessResponse } from '@/shared/utils.js';

import { skillsCatalogService } from './skills-catalog.service.js';
import { skillsInstallService } from './skills-install.service.js';
import type { SkillInstallRequest } from './skills-marketplace.types.js';

const router = express.Router();

const readOptionalQueryString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const parseProvider = (value: unknown): LLMProvider => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!skillsCatalogService.isSupportedProvider(normalized)) {
    throw new AppError(`Unsupported provider "${normalized}".`, {
      code: 'UNSUPPORTED_PROVIDER',
      statusCode: 400,
    });
  }

  return normalized;
};

const parseInstallRequest = (body: unknown): SkillInstallRequest => {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be an object.', {
      code: 'INVALID_REQUEST_BODY',
      statusCode: 400,
    });
  }

  const record = body as Record<string, unknown>;
  const provider = parseProvider(record.provider);
  const catalogId = readOptionalQueryString(record.catalogId);
  const repoUrl = readOptionalQueryString(record.repoUrl);
  const skillPath = readOptionalQueryString(record.skillPath);

  if (!catalogId && !repoUrl) {
    throw new AppError('Either catalogId or repoUrl is required.', {
      code: 'SKILL_INSTALL_SOURCE_REQUIRED',
      statusCode: 400,
    });
  }

  return {
    provider,
    catalogId,
    repoUrl,
    skillPath,
  };
};

router.get(
  '/catalog',
  asyncHandler(async (req: Request, res: Response) => {
    const query = readOptionalQueryString(req.query.q);
    const category = readOptionalQueryString(req.query.category);
    const providerParam = readOptionalQueryString(req.query.provider);
    const provider = providerParam ? parseProvider(providerParam) : undefined;

    const catalog = await skillsCatalogService.listCatalog({ query, category, provider });
    res.json(createApiSuccessResponse(catalog));
  }),
);

router.get(
  '/catalog/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = readOptionalQueryString(req.params.id);
    if (!id) {
      throw new AppError('Catalog id is required.', {
        code: 'SKILLS_CATALOG_ID_REQUIRED',
        statusCode: 400,
      });
    }

    const entry = await skillsCatalogService.getCatalogEntry(id);
    res.json(createApiSuccessResponse({ entry }));
  }),
);

router.post(
  '/install',
  asyncHandler(async (req: Request, res: Response) => {
    const request = parseInstallRequest(req.body);
    const result = await skillsInstallService.installSkill(request);
    res.json(createApiSuccessResponse(result));
  }),
);

export default router;
