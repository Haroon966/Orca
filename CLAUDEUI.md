# ClaudeUI

ClaudeUI is a fork of [CloudCLI / claudecodeui](https://github.com/siteboon/claudecodeui) focused on managing **Claude Code CLI** from the browser. It reads and writes the same config files Claude CLI uses (`~/.claude`, `~/.claude.json`, project `.claude/`).

## Quick start (development)

**Requirements:** Node.js 22+, [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated.

```bash
cd /home/olufsen/claudeui
npm install --ignore-scripts
npm rebuild better-sqlite3 node-pty bcrypt
node scripts/fix-node-pty.js
cp .env.example .env   # if needed
```

Configure `.env`:

```env
HOST=127.0.0.1
SERVER_PORT=3001
VITE_PORT=5173
CLAUDE_CLI_PATH=/home/olufsen/.local/bin/claude
```

Run:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

## ClaudeUI-specific features

| Feature | Location |
|---------|----------|
| CLAUDE.md editor (global / project / local / private) | Settings → Claude Config |
| Hooks manager | Settings → Claude Config |
| Memory browser | Settings → Claude Config |
| Skills, agents, rules (read-only) | Settings → Claude Config |
| MCP, permissions, plugins | Settings → Agents (inherited from upstream) |

Claude-only mode is enabled by default. To show all upstream providers (Cursor, Codex, Gemini, OpenCode), set `CLAUDEUI_CLAUDE_ONLY = false` in [`src/config/claudeui.ts`](src/config/claudeui.ts).

## Production deployment

### Build

```bash
npm run build
npm run server
```

The server serves the built frontend on `SERVER_PORT` (default 3001).

### Always-on (PM2)

```bash
npm run build
pm2 start npm --name claudeui -- run server
pm2 save
```

### systemd example

Create `/etc/systemd/system/claudeui.service`:

```ini
[Unit]
Description=ClaudeUI
After=network.target

[Service]
Type=simple
User=YOUR_USER
WorkingDirectory=/home/olufsen/claudeui
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=SERVER_PORT=3001
Environment=CLAUDE_CLI_PATH=/home/olufsen/.local/bin/claude
ExecStart=/usr/bin/npm run server
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now claudeui
```

### Remote / LAN access

1. Set `HOST=0.0.0.0` in `.env` to bind all interfaces.
2. Put **HTTPS** in front (Caddy or nginx reverse proxy).
3. ClaudeUI has no app login — restrict network access via firewall or bind to `127.0.0.1` unless you add your own reverse-proxy auth.

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Bind address (`127.0.0.1` for local-only) |
| `SERVER_PORT` | `3001` | API + production frontend port |
| `VITE_PORT` | `5173` | Dev frontend port |
| `CLAUDE_CLI_PATH` | `claude` | Path to Claude CLI binary |
| `API_KEY` | — | Optional API key for all `/api` routes |

Authentication is **Claude CLI only** (`claude login` or API key in `~/.claude`). There is no separate app login.

## Upstream sync

This repo tracks [siteboon/claudecodeui](https://github.com/siteboon/claudecodeui) as `upstream`:

```bash
git fetch upstream
git merge upstream/main
```

Custom ClaudeUI code lives in:

- [`src/config/claudeui.ts`](src/config/claudeui.ts)
- [`src/components/settings/view/tabs/claude-config/`](src/components/settings/view/tabs/claude-config/)
- [`src/components/settings/hooks/useClaudeConfig.ts`](src/components/settings/hooks/useClaudeConfig.ts)
- [`server/routes/claude-config.js`](server/routes/claude-config.js)

## License

AGPL-3.0-or-later (inherited from upstream). If you modify ClaudeUI and run it as a network service for others, you must make your modified source available.
