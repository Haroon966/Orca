# Orca

**Orca** is a self-hosted web interface for managing [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI sessions — an intelligent coding interface with navy + ice theming, light/dark mode, and customizable color palettes.

## Features

- Web UI for Claude Code CLI projects and sessions
- Light / dark mode with **Orca**, **Classic**, and **Slate** color themes
- Self-hosted with optional local auth bypass for development
- Plugin system (`~/.orca/plugins/`)
- MCP server management, file tree, integrated terminal, and more

## Quick start

```bash
git clone https://github.com/YOUR_USER/orca.git
cd orca
npm install
npm run dev
```

Open `http://localhost:5173` (frontend) — the API runs on port `3001` by default.

## Production

```bash
npm run build
npm run server
```

Or install globally:

```bash
npm install -g @orca-ai/orca
orca
```

## Configuration

Copy `.env.example` to `.env` and adjust as needed. Data is stored under `~/.orca/` (auth DB, plugins, browser profiles).

On first start, Orca migrates existing data from legacy `~/.cloudcli` and `~/.claude-code-ui` paths automatically.

## CLI

| Command | Description |
|---------|-------------|
| `orca` | Start the server |
| `orca status` | Show config and data paths |
| `orca help` | Show all options |

## Theming

Settings → **Appearance** → choose **Color theme** (Orca navy/ice is the default) and toggle dark mode independently.

Set your GitHub repo for the About tab and star badge:

```env
VITE_GITHUB_OWNER=your-username
VITE_GITHUB_REPO=orca
```

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE) and [NOTICE](NOTICE) for upstream attribution.
