import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { skillsCatalogService } from '@/modules/skills-marketplace/skills-catalog.service.js';
import { skillsInstallService } from '@/modules/skills-marketplace/skills-install.service.js';

const patchHomeDir = (nextHomeDir: string) => {
  const original = os.homedir;
  (os as any).homedir = () => nextHomeDir;
  return () => {
    (os as any).homedir = original;
  };
};

test('skillsCatalogService lists bundled catalog entries', async () => {
  const result = await skillsCatalogService.listCatalog();
  assert.ok(result.skills.length >= 3);
  assert.ok(result.categories.length >= 1);
  assert.ok(result.skills.some((entry) => entry.id === 'skill-creator'));
});

test('skillsCatalogService filters catalog by provider and query', async () => {
  const providerResult = await skillsCatalogService.listCatalog({ provider: 'claude' });
  assert.ok(providerResult.skills.every((entry) => entry.providers.includes('claude')));

  const queryResult = await skillsCatalogService.listCatalog({ query: 'design' });
  assert.ok(queryResult.skills.length >= 1);
  assert.ok(queryResult.skills.some((entry) => entry.name.toLowerCase().includes('design') || entry.category === 'design'));
});

test('skillsCatalogService returns a catalog entry by id', async () => {
  const entry = await skillsCatalogService.getCatalogEntry('skill-creator');
  assert.equal(entry.id, 'skill-creator');
  assert.match(entry.repoUrl, /^https:\/\//);
});

test('skillsCatalogService rejects unknown catalog ids', async () => {
  await assert.rejects(
    () => skillsCatalogService.getCatalogEntry('missing-skill-id'),
    (error: unknown) => error instanceof Error && error.message.includes('not found'),
  );
});

test('skillsInstallService validates skillPath before git clone', async () => {
  await assert.rejects(
    () => skillsInstallService.installSkill({
      provider: 'claude',
      repoUrl: 'https://github.com/anthropics/skills',
      skillPath: '../escape',
    }),
    (error: unknown) => error instanceof Error && error.message.includes('path traversal'),
  );
});

test('skillsInstallService installs a bundled catalog skill into the claude user directory', { concurrency: false }, async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'skills-marketplace-install-'));
  const restoreHomeDir = patchHomeDir(tempRoot);

  try {
    const result = await skillsInstallService.installSkill({
      provider: 'claude',
      catalogId: 'skill-creator',
    });

    assert.equal(result.provider, 'claude');
    assert.equal(result.skills.length, 1);
    assert.equal(result.skills[0]?.name, 'skill-creator');

    const installedSkillPath = path.join(tempRoot, '.claude', 'skills', 'skill-creator', 'SKILL.md');
    const installedContent = await fs.readFile(installedSkillPath, 'utf8');
    assert.match(installedContent, /name:\s*skill-creator/);
  } finally {
    restoreHomeDir();
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
