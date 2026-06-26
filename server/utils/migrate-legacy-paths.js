import fs from 'fs';
import path from 'path';
import {
  LEGACY_CLAUDE_CODE_UI_HOME,
  LEGACY_CLOUDCLI_HOME,
  ORCA_HOME,
  ORCA_PLUGINS_DIR,
} from '../constants/orca.js';

function copyIfMissing(source, destination) {
  if (!fs.existsSync(source) || fs.existsSync(destination)) {
    return false;
  }

  fs.cpSync(source, destination, { recursive: true });
  return true;
}

function migrateFile(sourceFile, destinationFile) {
  if (!fs.existsSync(sourceFile) || fs.existsSync(destinationFile)) {
    return false;
  }

  fs.mkdirSync(path.dirname(destinationFile), { recursive: true });
  fs.copyFileSync(sourceFile, destinationFile);
  return true;
}

/**
 * One-time migration from legacy CloudCLI / claude-code-ui paths to ~/.orca
 */
export function migrateLegacyPaths() {
  let migrated = false;

  if (!fs.existsSync(ORCA_HOME)) {
    fs.mkdirSync(ORCA_HOME, { recursive: true });
  }

  if (migrateFile(path.join(LEGACY_CLOUDCLI_HOME, 'auth.db'), path.join(ORCA_HOME, 'auth.db'))) {
    migrated = true;
  }

  if (copyIfMissing(path.join(LEGACY_CLOUDCLI_HOME, 'browser-use'), path.join(ORCA_HOME, 'browser-use'))) {
    migrated = true;
  }

  const legacyPluginsDir = path.join(LEGACY_CLAUDE_CODE_UI_HOME, 'plugins');
  if (copyIfMissing(legacyPluginsDir, ORCA_PLUGINS_DIR)) {
    migrated = true;
  }

  if (
    migrateFile(
      path.join(LEGACY_CLAUDE_CODE_UI_HOME, 'plugins.json'),
      path.join(ORCA_HOME, 'plugins.json'),
    )
  ) {
    migrated = true;
  }

  if (migrated) {
    console.log('[Orca] Migrated data from legacy CloudCLI paths to ~/.orca');
  }

  return migrated;
}
