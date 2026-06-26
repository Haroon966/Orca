// Load environment variables from .env before other imports execute.
import fs from 'fs';
import path from 'path';
import { findAppRoot, getModuleDir } from './utils/runtime-paths.js';

const __dirname = getModuleDir(import.meta.url);
// Resolve the repo/app root via the nearest /server folder so this file keeps finding the
// same top-level .env file from both /server/load-env.js and /dist-server/server/load-env.js.
const APP_ROOT = findAppRoot(__dirname);

try {
  const envPath = path.join(APP_ROOT, '.env');
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0 && !process.env[key]) {
        process.env[key] = valueParts.join('=').trim();
      }
    }
  });
} catch (e) {
  console.log('No .env file found or error reading it:', e.message);
}

import { DEFAULT_DATABASE_PATH } from './constants/orca.js';
import { migrateLegacyPaths } from './utils/migrate-legacy-paths.js';

migrateLegacyPaths();

if (!process.env.DATABASE_PATH) {
  process.env.DATABASE_PATH = DEFAULT_DATABASE_PATH;
}
