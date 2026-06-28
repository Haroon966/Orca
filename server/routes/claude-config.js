import { Router } from 'express';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import os from 'os';
import path from 'path';

const router = Router();

const getClaudeHome = () => path.join(os.homedir(), '.claude');

const resolveGlobalClaudeMdPath = async () => {
  const candidates = [
    path.join(getClaudeHome(), 'CLAUDE.md'),
    path.join(os.homedir(), '.config', 'claude', 'CLAUDE.md'),
  ];

  for (const candidate of candidates) {
    try {
      await fsPromises.access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  return candidates[0];
};

const getClaudeMdPathForLevel = async (level, projectPath) => {
  switch (level) {
    case 'global':
      return resolveGlobalClaudeMdPath();
    case 'project':
      if (!projectPath) throw new Error('projectPath is required for project-level CLAUDE.md');
      return path.join(projectPath, 'CLAUDE.md');
    case 'local':
      if (!projectPath) throw new Error('projectPath is required for local CLAUDE.md');
      return path.join(projectPath, '.claude', 'CLAUDE.local.md');
    case 'private':
      if (!projectPath) throw new Error('projectPath is required for private CLAUDE.md');
      return path.join(projectPath, '.claude', 'CLAUDE.md');
    default:
      throw new Error(`Unknown CLAUDE.md level: ${level}`);
  }
};

const ensureParentDir = async (filePath) => {
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
};

const readTextFileOrEmpty = async (filePath) => {
  try {
    return await fsPromises.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
};

const readJsonFileOrEmpty = async (filePath) => {
  const content = await readTextFileOrEmpty(filePath);
  if (!content.trim()) {
    return {};
  }
  return JSON.parse(content);
};

const writeJsonFile = async (filePath, data) => {
  await ensureParentDir(filePath);
  await fsPromises.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const getSettingsPaths = (projectPath) => {
  const paths = [
    { scope: 'user', path: path.join(getClaudeHome(), 'settings.json') },
  ];

  if (projectPath) {
    paths.push(
      { scope: 'project', path: path.join(projectPath, '.claude', 'settings.json') },
      { scope: 'local', path: path.join(projectPath, '.claude', 'settings.local.json') },
    );
  }

  return paths;
};

const listMarkdownFiles = async (directoryPath, basePath = directoryPath) => {
  const entries = [];

  try {
    const dirEntries = await fsPromises.readdir(directoryPath, { withFileTypes: true });

    for (const entry of dirEntries) {
      const fullPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        entries.push(...await listMarkdownFiles(fullPath, basePath));
        continue;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        entries.push({
          name: entry.name,
          path: fullPath,
          relativePath: path.relative(basePath, fullPath),
        });
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return entries.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
};

const listMemoryRoots = () => [
  path.join(getClaudeHome(), 'memory'),
  path.join(getClaudeHome(), 'auto-memory'),
  path.join(getClaudeHome(), 'projects'),
];

const listMemoryFiles = async () => {
  const files = [];
  const roots = listMemoryRoots();

  for (const root of roots) {
    const rootFiles = await listMarkdownFiles(root, root);
    for (const file of rootFiles) {
      files.push({
        ...file,
        root: path.basename(root),
      });
    }
  }

  return files;
};

const listAgentFiles = async (projectPath) => {
  const roots = [
    { scope: 'user', path: path.join(getClaudeHome(), 'agents') },
  ];

  if (projectPath) {
    roots.push({ scope: 'project', path: path.join(projectPath, '.claude', 'agents') });
  }

  const agents = [];
  for (const root of roots) {
    const files = await listMarkdownFiles(root.path, root.path);
    for (const file of files) {
      agents.push({ ...file, scope: root.scope });
    }
  }

  return agents;
};

const listRuleFiles = async (projectPath) => {
  if (!projectPath) {
    return [];
  }

  const rulesDir = path.join(projectPath, '.claude', 'rules');
  const files = await listMarkdownFiles(rulesDir, rulesDir);
  return files.map((file) => ({ ...file, scope: 'project' }));
};

router.get('/claude-md', async (req, res) => {
  try {
    const { projectPath } = req.query;
    const levels = ['global', 'project', 'local', 'private'];
    const files = [];

    for (const level of levels) {
      if ((level === 'global') || projectPath) {
        const filePath = await getClaudeMdPathForLevel(level, projectPath);
        let exists = false;
        try {
          await fsPromises.access(filePath);
          exists = true;
        } catch {
          exists = false;
        }

        files.push({ level, path: filePath, exists });
      }
    }

    res.json({ files, projectPath: projectPath || null });
  } catch (error) {
    console.error('Error listing CLAUDE.md files:', error);
    res.status(500).json({ error: error.message || 'Failed to list CLAUDE.md files' });
  }
});

router.get('/claude-md/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const { projectPath } = req.query;
    const filePath = await getClaudeMdPathForLevel(level, projectPath);
    const content = await readTextFileOrEmpty(filePath);

    res.json({ level, path: filePath, content, exists: fs.existsSync(filePath) });
  } catch (error) {
    console.error('Error reading CLAUDE.md:', error);
    res.status(500).json({ error: error.message || 'Failed to read CLAUDE.md' });
  }
});

router.put('/claude-md/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const { projectPath, content } = req.body;

    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'content must be a string' });
    }

    const filePath = await getClaudeMdPathForLevel(level, projectPath);
    await ensureParentDir(filePath);
    await fsPromises.writeFile(filePath, content, 'utf8');

    res.json({ success: true, level, path: filePath });
  } catch (error) {
    console.error('Error writing CLAUDE.md:', error);
    res.status(500).json({ error: error.message || 'Failed to write CLAUDE.md' });
  }
});

router.get('/hooks', async (req, res) => {
  try {
    const { projectPath } = req.query;
    const settingsPaths = getSettingsPaths(projectPath);
    const scopes = [];

    for (const entry of settingsPaths) {
      const settings = await readJsonFileOrEmpty(entry.path);
      scopes.push({
        scope: entry.scope,
        path: entry.path,
        hooks: settings.hooks ?? {},
        exists: fs.existsSync(entry.path),
      });
    }

    res.json({ scopes, projectPath: projectPath || null });
  } catch (error) {
    console.error('Error reading hooks:', error);
    res.status(500).json({ error: error.message || 'Failed to read hooks' });
  }
});

router.put('/hooks', async (req, res) => {
  try {
    const { scope, projectPath, hooks } = req.body;

    if (!scope || typeof hooks !== 'object' || hooks === null) {
      return res.status(400).json({ error: 'scope and hooks object are required' });
    }

    const settingsEntry = getSettingsPaths(projectPath).find((entry) => entry.scope === scope);
    if (!settingsEntry) {
      return res.status(400).json({ error: `Unknown scope: ${scope}` });
    }

    const settings = await readJsonFileOrEmpty(settingsEntry.path);
    settings.hooks = hooks;
    await writeJsonFile(settingsEntry.path, settings);

    res.json({ success: true, scope, path: settingsEntry.path });
  } catch (error) {
    console.error('Error writing hooks:', error);
    res.status(500).json({ error: error.message || 'Failed to write hooks' });
  }
});

router.get('/memory', async (_req, res) => {
  try {
    const files = await listMemoryFiles();
    res.json({ files });
  } catch (error) {
    console.error('Error listing memory files:', error);
    res.status(500).json({ error: error.message || 'Failed to list memory files' });
  }
});

router.get('/memory/file', async (req, res) => {
  try {
    const { filePath } = req.query;
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'filePath is required' });
    }

    const resolved = path.resolve(filePath);
    const allowedRoots = listMemoryRoots().map((root) => path.resolve(root));
    const isAllowed = allowedRoots.some((root) => resolved.startsWith(`${root}${path.sep}`) || resolved === root);

    if (!isAllowed) {
      return res.status(403).json({ error: 'Path is outside allowed memory directories' });
    }

    const content = await readTextFileOrEmpty(resolved);
    res.json({ path: resolved, content, exists: fs.existsSync(resolved) });
  } catch (error) {
    console.error('Error reading memory file:', error);
    res.status(500).json({ error: error.message || 'Failed to read memory file' });
  }
});

router.put('/memory/file', async (req, res) => {
  try {
    const { filePath, content } = req.body;
    if (!filePath || typeof content !== 'string') {
      return res.status(400).json({ error: 'filePath and content are required' });
    }

    const resolved = path.resolve(filePath);
    const allowedRoots = listMemoryRoots().map((root) => path.resolve(root));
    const isAllowed = allowedRoots.some((root) => resolved.startsWith(`${root}${path.sep}`) || resolved === root);

    if (!isAllowed) {
      return res.status(403).json({ error: 'Path is outside allowed memory directories' });
    }

    await ensureParentDir(resolved);
    await fsPromises.writeFile(resolved, content, 'utf8');
    res.json({ success: true, path: resolved });
  } catch (error) {
    console.error('Error writing memory file:', error);
    res.status(500).json({ error: error.message || 'Failed to write memory file' });
  }
});

router.get('/agents', async (req, res) => {
  try {
    const { projectPath } = req.query;
    const agents = await listAgentFiles(projectPath);
    res.json({ agents, projectPath: projectPath || null });
  } catch (error) {
    console.error('Error listing agents:', error);
    res.status(500).json({ error: error.message || 'Failed to list agents' });
  }
});

const isAgentPathAllowed = (resolved, projectPath) => {
  const claudeHome = path.resolve(getClaudeHome());
  if (resolved.startsWith(`${claudeHome}${path.sep}`) || resolved === claudeHome) {
    return true;
  }

  if (projectPath) {
    const projectAgents = path.resolve(path.join(projectPath, '.claude', 'agents'));
    if (resolved.startsWith(`${projectAgents}${path.sep}`) || resolved === projectAgents) {
      return true;
    }
  }

  return false;
};

router.get('/agents/file', async (req, res) => {
  try {
    const { filePath, projectPath } = req.query;
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'filePath is required' });
    }

    const resolved = path.resolve(filePath);
    if (!isAgentPathAllowed(resolved, projectPath)) {
      return res.status(403).json({ error: 'Path is outside allowed agent directories' });
    }

    const content = await readTextFileOrEmpty(resolved);
    res.json({ path: resolved, content, exists: fs.existsSync(resolved) });
  } catch (error) {
    console.error('Error reading agent file:', error);
    res.status(500).json({ error: error.message || 'Failed to read agent file' });
  }
});

router.get('/rules', async (req, res) => {
  try {
    const { projectPath } = req.query;
    if (!projectPath) {
      return res.status(400).json({ error: 'projectPath is required' });
    }

    const rules = await listRuleFiles(projectPath);
    res.json({ rules, projectPath });
  } catch (error) {
    console.error('Error listing rules:', error);
    res.status(500).json({ error: error.message || 'Failed to list rules' });
  }
});

const isClaudeConfigPathAllowed = (resolved, projectPath) => {
  const claudeHome = path.resolve(getClaudeHome());
  if (resolved.startsWith(`${claudeHome}${path.sep}`) || resolved === claudeHome) {
    return true;
  }

  if (projectPath) {
    const projectClaude = path.resolve(path.join(projectPath, '.claude'));
    if (resolved.startsWith(`${projectClaude}${path.sep}`) || resolved === projectClaude) {
      return true;
    }
  }

  return isAgentPathAllowed(resolved, projectPath);
};

router.get('/file', async (req, res) => {
  try {
    const { filePath, projectPath } = req.query;
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'filePath is required' });
    }

    const resolved = path.resolve(filePath);
    if (!isClaudeConfigPathAllowed(resolved, projectPath)) {
      return res.status(403).json({ error: 'Path is outside allowed Claude config directories' });
    }

    const content = await readTextFileOrEmpty(resolved);
    res.json({ path: resolved, content, exists: fs.existsSync(resolved) });
  } catch (error) {
    console.error('Error reading config file:', error);
    res.status(500).json({ error: error.message || 'Failed to read config file' });
  }
});

router.get('/rules/file', async (req, res) => {
  try {
    const { filePath, projectPath } = req.query;
    if (!filePath || !projectPath) {
      return res.status(400).json({ error: 'filePath and projectPath are required' });
    }

    const resolved = path.resolve(filePath);
    const rulesRoot = path.resolve(path.join(projectPath, '.claude', 'rules'));
    if (!resolved.startsWith(`${rulesRoot}${path.sep}`) && resolved !== rulesRoot) {
      return res.status(403).json({ error: 'Path is outside project rules directory' });
    }

    const content = await readTextFileOrEmpty(resolved);
    res.json({ path: resolved, content, exists: fs.existsSync(resolved) });
  } catch (error) {
    console.error('Error reading rule file:', error);
    res.status(500).json({ error: error.message || 'Failed to read rule file' });
  }
});

router.put('/agents/file', async (req, res) => {
  try {
    const { filePath, content, projectPath } = req.body;
    if (!filePath || typeof content !== 'string') {
      return res.status(400).json({ error: 'filePath and content are required' });
    }

    const resolved = path.resolve(filePath);
    if (!isAgentPathAllowed(resolved, projectPath)) {
      return res.status(403).json({ error: 'Path is outside allowed agent directories' });
    }

    await ensureParentDir(resolved);
    await fsPromises.writeFile(resolved, content, 'utf8');
    res.json({ success: true, path: resolved });
  } catch (error) {
    console.error('Error writing agent file:', error);
    res.status(500).json({ error: error.message || 'Failed to write agent file' });
  }
});

router.put('/rules/file', async (req, res) => {
  try {
    const { filePath, content, projectPath } = req.body;
    if (!filePath || !projectPath || typeof content !== 'string') {
      return res.status(400).json({ error: 'filePath, projectPath, and content are required' });
    }

    const resolved = path.resolve(filePath);
    const rulesRoot = path.resolve(path.join(projectPath, '.claude', 'rules'));
    if (!resolved.startsWith(`${rulesRoot}${path.sep}`) && resolved !== rulesRoot) {
      return res.status(403).json({ error: 'Path is outside project rules directory' });
    }

    await ensureParentDir(resolved);
    await fsPromises.writeFile(resolved, content, 'utf8');
    res.json({ success: true, path: resolved });
  } catch (error) {
    console.error('Error writing rule file:', error);
    res.status(500).json({ error: error.message || 'Failed to write rule file' });
  }
});

router.put('/file', async (req, res) => {
  try {
    const { filePath, content, projectPath } = req.body;
    if (!filePath || typeof content !== 'string') {
      return res.status(400).json({ error: 'filePath and content are required' });
    }

    const resolved = path.resolve(filePath);
    if (!isClaudeConfigPathAllowed(resolved, projectPath)) {
      return res.status(403).json({ error: 'Path is outside allowed Claude config directories' });
    }

    await ensureParentDir(resolved);
    await fsPromises.writeFile(resolved, content, 'utf8');
    res.json({ success: true, path: resolved });
  } catch (error) {
    console.error('Error writing config file:', error);
    res.status(500).json({ error: error.message || 'Failed to write config file' });
  }
});

export default router;
