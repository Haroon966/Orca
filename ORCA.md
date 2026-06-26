# Orca

See [README.md](README.md) for setup and usage.

## Fork notes

Orca is a rebrand and customization of the upstream CloudCLI / Claude Code UI project. Runtime data lives under `~/.orca/`. Legacy paths (`~/.cloudcli`, `~/.claude-code-ui`) are migrated automatically on first boot.

## Provider scope

Claude-only mode is enabled by default. To show all upstream providers, set `ORCA_CLAUDE_ONLY = false` in [`src/config/orca.ts`](src/config/orca.ts).

## Theming

Default color theme is **Orca** (navy + ice). Users can switch themes in Settings → Appearance. Configure `VITE_GITHUB_OWNER` and `VITE_GITHUB_REPO` in `.env` for About tab links.
