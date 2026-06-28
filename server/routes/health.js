import express from 'express';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ORCA_HOME } from '../constants/orca.js';
import { browserUseService } from '../modules/browser-use/browser-use.service.js';

const CLAUDE_CLI = process.env.CLAUDE_CLI_PATH || 'claude';
const HOST = process.env.HOST || '0.0.0.0';

function spawnAsync(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: false });
    let stdout = '';
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.on('error', () => resolve({ ok: false, output: '' }));
    child.on('close', (code) => resolve({ ok: code === 0, output: stdout.trim() }));
  });
}

async function checkClaudeCli() {
  const versionResult = await spawnAsync(CLAUDE_CLI, ['--version']);
  if (versionResult.ok) {
    return { found: true, path: CLAUDE_CLI, version: versionResult.output || null };
  }

  const whichResult = await spawnAsync('which', [CLAUDE_CLI]);
  return {
    found: whichResult.ok,
    path: whichResult.ok ? whichResult.output : CLAUDE_CLI,
    version: null,
  };
}

async function checkTaskMaster() {
  const whichResult = await spawnAsync('which', ['task-master']);
  if (!whichResult.ok) {
    return { installed: false, version: null };
  }

  const versionResult = await spawnAsync('task-master', ['--version']);
  return {
    installed: true,
    version: versionResult.ok ? versionResult.output : null,
  };
}

function checkLegacyMigration() {
  const legacyPaths = [
    path.join(os.homedir(), '.cloudcli'),
    path.join(os.homedir(), '.claude-code-ui'),
  ];
  const legacyPresent = legacyPaths.filter((legacyPath) => fs.existsSync(legacyPath));
  return {
    dataDir: ORCA_HOME,
    dataDirExists: fs.existsSync(ORCA_HOME),
    legacyPathsPresent: legacyPresent,
  };
}

export async function getHealthPayload() {
  const [claudeCli, taskMaster, browserStatus] = await Promise.all([
    checkClaudeCli(),
    checkTaskMaster(),
    browserUseService.getStatus().catch(() => null),
  ]);

  const migration = checkLegacyMigration();
  const bindWarning = HOST === '0.0.0.0' || HOST === '::';

  return {
    claudeCli,
    dataDir: migration.dataDir,
    dataDirExists: migration.dataDirExists,
    legacyPathsPresent: migration.legacyPathsPresent,
    taskMaster,
    browser: browserStatus
      ? {
          enabled: browserStatus.enabled,
          available: browserStatus.available,
          playwrightInstalled: browserStatus.playwrightInstalled,
          chromiumInstalled: browserStatus.chromiumInstalled,
        }
      : {
          enabled: false,
          available: false,
          playwrightInstalled: false,
          chromiumInstalled: false,
        },
    server: {
      host: HOST,
      bindWarning,
      bindWarningMessage: bindWarning
        ? 'Server is bound to all interfaces. Set HOST=127.0.0.1 for local-only access or enable authentication.'
        : null,
    },
    timestamp: new Date().toISOString(),
  };
}

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const data = await getHealthPayload();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});

export default router;
