import os from 'os';
import path from 'path';

export const ORCA_PRODUCT_NAME = 'Orca';
export const ORCA_NPM_PACKAGE = '@orca_ai/orca';
export const ORCA_CLI_BIN = 'orca';
export const ORCA_DATA_DIR = '.orca';
export const ORCA_MCP_BROWSER = 'orca-browser';
export const LEGACY_MCP_BROWSER_NAMES = ['cloudcli-browser', 'cloudcli-browser-use'];

export const ORCA_HOME = path.join(os.homedir(), ORCA_DATA_DIR);
export const ORCA_PLUGINS_DIR = path.join(ORCA_HOME, 'plugins');
export const ORCA_PLUGINS_CONFIG = path.join(ORCA_HOME, 'plugins.json');
export const DEFAULT_DATABASE_PATH = path.join(ORCA_HOME, 'auth.db');
export const ORCA_BROWSER_USE_DIR = path.join(ORCA_HOME, 'browser-use', 'profiles');

export const LEGACY_CLOUDCLI_HOME = path.join(os.homedir(), '.cloudcli');
export const LEGACY_CLAUDE_CODE_UI_HOME = path.join(os.homedir(), '.claude-code-ui');
