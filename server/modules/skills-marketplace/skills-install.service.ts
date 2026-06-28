import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';

import { spawn } from 'cross-spawn';

import { providerSkillsService } from '@/modules/providers/index.js';
import type { ProviderSkillCreateFile, ProviderSkillCreateInput } from '@/shared/types.js';
import { AppError } from '@/shared/utils.js';

import { skillsCatalogService } from './skills-catalog.service.js';
import type { SkillInstallRequest, SkillInstallResult } from './skills-marketplace.types.js';

const MAX_SUPPORTING_FILE_BYTES = 5 * 1024 * 1024;
const MAX_SUPPORTING_FILES = 500;

const sanitizeRepoUrl = (rawUrl: string): string => skillsCatalogService.sanitizeRepoUrl(rawUrl);

const assertSafeSkillPath = (skillPath: string | undefined): string => {
  const normalized = (skillPath ?? '').trim().replace(/\\/g, '/');
  if (!normalized) {
    return '.';
  }

  const segments = normalized.split('/');
  if (
    segments.some((segment) => !segment || segment === '.' || segment === '..')
    || path.isAbsolute(normalized)
  ) {
    throw new AppError('Invalid skillPath: path traversal is not allowed.', {
      code: 'SKILL_PATH_INVALID',
      statusCode: 400,
    });
  }

  return normalized;
};

const resolveSkillDirectory = (repoRoot: string, skillPath: string | undefined): string => {
  const relativeSkillPath = assertSafeSkillPath(skillPath);
  const resolvedRepoRoot = path.resolve(repoRoot);
  const resolvedSkillDirectory = path.resolve(resolvedRepoRoot, relativeSkillPath);

  if (
    resolvedSkillDirectory !== resolvedRepoRoot
    && !resolvedSkillDirectory.startsWith(`${resolvedRepoRoot}${path.sep}`)
  ) {
    throw new AppError('Invalid skillPath: resolved path escapes the repository root.', {
      code: 'SKILL_PATH_INVALID',
      statusCode: 400,
    });
  }

  return resolvedSkillDirectory;
};

const cloneRepository = async (repoUrl: string): Promise<string> => {
  if (typeof repoUrl !== 'string' || !repoUrl.trim()) {
    throw new AppError('A repository URL is required.', {
      code: 'SKILL_REPO_URL_REQUIRED',
      statusCode: 400,
    });
  }

  if (repoUrl.trim().startsWith('-')) {
    throw new AppError('Invalid repository URL.', {
      code: 'SKILL_REPO_URL_INVALID',
      statusCode: 400,
    });
  }

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'orca-skill-clone-'));

  await new Promise<void>((resolve, reject) => {
    const gitProcess = spawn('git', ['clone', '--depth', '1', '--', repoUrl.trim(), tempRoot], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    gitProcess.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    gitProcess.on('error', (error) => {
      reject(new AppError(`Failed to run git clone: ${error.message}`, {
        code: 'SKILL_GIT_CLONE_FAILED',
        statusCode: 500,
      }));
    });

    gitProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new AppError(`git clone failed (exit code ${code}): ${stderr.trim()}`, {
        code: 'SKILL_GIT_CLONE_FAILED',
        statusCode: 400,
      }));
    });
  });

  return tempRoot;
};

const collectSupportingFiles = async (
  skillDirectoryPath: string,
  relativeDirectory = '',
): Promise<ProviderSkillCreateFile[]> => {
  const absoluteDirectory = path.join(skillDirectoryPath, relativeDirectory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files: ProviderSkillCreateFile[] = [];

  for (const entry of entries) {
    const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...await collectSupportingFiles(skillDirectoryPath, relativePath));
      continue;
    }

    if (!entry.isFile() || relativePath.toLowerCase() === 'skill.md') {
      continue;
    }

    const absolutePath = path.join(skillDirectoryPath, relativePath);
    const stat = fs.statSync(absolutePath);
    if (stat.size > MAX_SUPPORTING_FILE_BYTES) {
      throw new AppError(`Supporting file "${relativePath}" exceeds the 5 MB limit.`, {
        code: 'SKILL_FILE_TOO_LARGE',
        statusCode: 400,
      });
    }

    files.push({
      relativePath,
      content: (await readFile(absolutePath)).toString('base64'),
      encoding: 'base64',
    });

    if (files.length > MAX_SUPPORTING_FILES) {
      throw new AppError(`Skill contains more than ${MAX_SUPPORTING_FILES} supporting files.`, {
        code: 'SKILL_FILE_LIMIT_EXCEEDED',
        statusCode: 400,
      });
    }
  }

  return files;
};

const buildInstallPayload = async (
  skillDirectoryPath: string,
): Promise<ProviderSkillCreateInput> => {
  const skillPath = path.join(skillDirectoryPath, 'SKILL.md');
  if (!fs.existsSync(skillPath) || !fs.statSync(skillPath).isFile()) {
    throw new AppError('Repository does not contain a SKILL.md file at the requested path.', {
      code: 'SKILL_MARKDOWN_MISSING',
      statusCode: 400,
    });
  }

  const content = (await readFile(skillPath, 'utf8')).trim();
  if (!content) {
    throw new AppError('SKILL.md is empty.', {
      code: 'SKILL_MARKDOWN_EMPTY',
      statusCode: 400,
    });
  }

  return {
    entries: [{
      content,
      directoryName: path.basename(skillDirectoryPath),
      files: await collectSupportingFiles(skillDirectoryPath),
    }],
  };
};

const resolveInstallSource = async (
  request: SkillInstallRequest,
): Promise<{ repoUrl: string; skillPath?: string }> => {
  if (request.catalogId) {
    const entry = await skillsCatalogService.getCatalogEntry(request.catalogId);
    if (!entry.providers.includes(request.provider)) {
      throw new AppError(`Skill "${entry.name}" is not compatible with ${request.provider}.`, {
        code: 'SKILL_PROVIDER_INCOMPATIBLE',
        statusCode: 400,
      });
    }

    return {
      repoUrl: sanitizeRepoUrl(entry.repoUrl),
      skillPath: entry.skillPath,
    };
  }

  if (request.repoUrl) {
    return {
      repoUrl: sanitizeRepoUrl(request.repoUrl),
      skillPath: request.skillPath,
    };
  }

  throw new AppError('Either catalogId or repoUrl is required.', {
    code: 'SKILL_INSTALL_SOURCE_REQUIRED',
    statusCode: 400,
  });
};

export const skillsInstallService = {
  async installSkill(request: SkillInstallRequest): Promise<SkillInstallResult> {
    const source = await resolveInstallSource(request);
    assertSafeSkillPath(source.skillPath);
    const tempRoot = await cloneRepository(source.repoUrl);

    try {
      const skillDirectoryPath = resolveSkillDirectory(tempRoot, source.skillPath);
      const payload = await buildInstallPayload(skillDirectoryPath);
      const skills = await providerSkillsService.addProviderSkills(request.provider, payload);

      return {
        provider: request.provider,
        skills: skills.map((skill) => ({
          name: skill.name,
          description: skill.description,
          command: skill.command,
          sourcePath: skill.sourcePath,
        })),
      };
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  },
};
