# Orca

See [README.md](README.md) for setup and usage.

## Fork notes

Orca is a rebrand and customization of the upstream CloudCLI / Claude Code UI project. Runtime data lives under `~/.orca/`. Legacy paths (`~/.cloudcli`, `~/.claude-code-ui`) are migrated automatically on first boot.

## Provider scope

Claude-only mode is enabled by default. To show all upstream providers, set `ORCA_CLAUDE_ONLY = false` in [`src/config/orca.ts`](src/config/orca.ts) and rebuild.

## Feature overview

| Area | Where to find it |
|------|------------------|
| Chat & tools | Main chat tab |
| Terminal | Shell tab |
| Git | Git tab |
| Tasks | Tasks tab (enable in Settings → Tasks) |
| Browser | Browser tab (enable in Settings → Browser) |
| Claude Config | Settings → Claude Config |
| MCP | Settings → Agents → MCP |
| Command palette | `⌘K` / `Ctrl+K` |
| Health status | Settings → About |
| Session export/fork | Sidebar session hover actions |

## Authentication

By default Orca skips login for local development. To require a password when binding to a network interface:

```env
DISABLE_AUTH=false
VITE_DISABLE_AUTH=false
```

Create the first account on launch, then sign in on subsequent visits.

## Theming

Default color theme is **Orca** (navy + ice). Users can switch themes in Settings → Appearance. Configure `VITE_GITHUB_OWNER` and `VITE_GITHUB_REPO` in `.env` for About tab links.

## Onboarding

First-run onboarding covers git configuration, Claude login, project discovery, MCP intro, power features, and a system health check.
