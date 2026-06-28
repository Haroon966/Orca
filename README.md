<div align="center">

# Orca

**A polished, self-hosted web IDE for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI**

Refined UI/UX · Navy + ice theming · Deep appearance customization · Local-first

<br />

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![GitHub](https://img.shields.io/badge/GitHub-Haroon966%2FOrca-181717?logo=github)](https://github.com/Haroon966/Orca)
[![npm](https://img.shields.io/badge/npm-@orca--ai%2Forca-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/package/@orca-ai/orca)
[![Fork of CloudCLI UI](https://img.shields.io/badge/Fork-CloudCLI%20UI-0077B6)](https://github.com/siteboon/claudecodeui)

<br />

[Quick start](#quick-start) · [Features](#features) · [Why Orca?](#why-orca) · [Configuration](#configuration) · [Issues](https://github.com/Haroon966/Orca/issues) · [License](#license)

<br />

<img src="ui-thumnail.png" alt="Orca UI — chat, sidebar, and navy + ice theme" width="900" style="border-radius: 6px;" />

*Orca — intelligent coding interface for Claude Code*

</div>

---

## Table of contents

- [About](#about)
- [Why Orca?](#why-orca)
- [Features](#features)
- [Quick start](#quick-start)
- [Install](#install)
- [Production](#production)
- [Configuration](#configuration)
- [CLI](#cli)
- [Desktop](#desktop)
- [Theming & appearance](#theming--appearance)
- [Fork & attribution](#fork--attribution)
- [License](#license)

---

## About

**Orca** is a community fork of [CloudCLI UI](https://github.com/siteboon/claudecodeui) (formerly *claudecodeui*).

It inherits the same browser-based IDE foundation — chat, terminal, files, git, MCP, plugins, TaskMaster, and browser automation — and builds on it with a **Claude-first focus**, a **more polished interface**, and **richer customization**.

> **Choose Orca** if you run Claude Code locally or on your own server and want a refined, customizable UI without juggling multiple agent CLIs.
>
> **Choose upstream** if you need Cursor, Codex, Gemini, or OpenCode in the same app, or prefer the managed [CloudCLI Cloud](https://cloudcli.ai) offering.

---

## Why Orca?

| Area | Upstream (CloudCLI UI) | Orca |
| :--- | :--------------------- | :--- |
| **Focus** | Multi-provider (Claude, Cursor, Codex, Gemini, OpenCode) | **Claude Code CLI** by default — simpler UI, fewer providers to configure |
| **UI & UX** | Functional, provider-centric layout | **Refined interface** — cleaner navigation, guided onboarding, command palette, cohesive navy + ice design |
| **Onboarding** | Basic setup | Guided wizard: git, Claude login, project discovery, MCP intro, power features, and a **health check** |
| **Skills** | Upload and manage per project | Same, plus a built-in **skills marketplace** to browse and install curated skills |
| **Claude Config** | MCP and permissions via settings | Dedicated editor for **CLAUDE.md**, hooks, memory, skills, agents, and rules |
| **Tasks** | TaskMaster kanban | TaskMaster plus **one-click “implement in chat”** from the board |
| **Theming** | Standard light/dark | **Orca**, Classic, Slate presets + **custom palette editor** — light/dark toggled independently |
| **Appearance** | Limited | Full **Settings → Appearance**: themes, language, project sort, code editor options |
| **Desktop** | Web only | Optional **Electron** app |
| **Self-hosting** | Open source, oriented toward CloudCLI Cloud | **Local-first** — no cloud upsell, optional auth for LAN/remote |
| **Data** | `~/.cloudcli` | `~/.orca/` with automatic migration from legacy paths |

---

## Features

<table>
<tr>
<td width="50%" valign="top">

<h3>Core workspace</h3>
<ul>
<li><strong>Chat</strong> — streaming sessions, tool rendering, subagents, plan mode, permissions</li>
<li><strong>Terminal</strong> — integrated PTY shell per project</li>
<li><strong>File tree &amp; editor</strong> — browse, edit, upload, and create files</li>
<li><strong>Git panel</strong> — diffs, commits (AI message generation), branches, push/pull</li>
<li><strong>Command palette</strong> — <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> to jump anywhere</li>
</ul>

</td>
<td width="50%" valign="top">

<h3>Claude &amp; automation</h3>
<ul>
<li><strong>Claude Config</strong> — CLAUDE.md, hooks, memory, skills, agents, rules</li>
<li><strong>MCP management</strong> — add and configure Model Context Protocol servers</li>
<li><strong>Task board</strong> — TaskMaster kanban (Settings → Tasks)</li>
<li><strong>Browser automation</strong> — agent-driven and manual URL sessions (Settings → Browser)</li>
<li><strong>Skills marketplace</strong> — browse and install curated skills</li>
</ul>

</td>
</tr>
<tr>
<td width="50%" valign="top">

<h3>Customization</h3>
<ul>
<li><strong>Color themes</strong> — Orca, Classic, Slate, or fully custom palettes</li>
<li><strong>Appearance settings</strong> — code editor theme, font size, word wrap, minimap, line numbers</li>
<li><strong>Light / dark mode</strong> — independent of color theme</li>
<li><strong>i18n</strong> — 10+ locales</li>
</ul>

</td>
<td width="50%" valign="top">

<h3>Platform</h3>
<ul>
<li><strong>Plugins</strong> — tab-slot extensions under <code>~/.orca/plugins/</code></li>
<li><strong>Notifications</strong> — in-app, sound, and web push</li>
<li><strong>Session tools</strong> — export to markdown, fork from the sidebar</li>
<li><strong>Auth</strong> — optional login for network exposure (<code>DISABLE_AUTH=false</code>)</li>
</ul>

</td>
</tr>
</table>

---

## Quick start

**Requirements:** [Node.js 22+](https://nodejs.org/) · [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated

```bash
git clone https://github.com/Haroon966/Orca.git
cd Orca
npm install
npm run dev
```

| Service | URL |
| :------ | :-- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3001` |

---

## Install

**Requirements (all installs):** [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated

### Windows

Download the latest `Orca-x.y.z-x64.exe` from [GitHub Releases](https://github.com/Haroon966/Orca/releases), run the installer, then launch **Orca** from the Start menu.

Future updates install in-app: click **Update Now**, then **Restart to install** — no uninstall required.

> Unsigned builds may show a SmartScreen prompt on first run — choose **More info → Run anyway**.

### Ubuntu / Linux

Download from [GitHub Releases](https://github.com/Haroon966/Orca/releases):

**AppImage (recommended for one-click updates):**

```bash
chmod +x Orca-x.y.z-x86_64.AppImage
./Orca-x.y.z-x86_64.AppImage
```

Future updates install in-app: **Update Now** → **Restart to install** — no uninstall required.

**`.deb` (traditional Ubuntu/Debian install):**

```bash
sudo dpkg -i Orca-x.y.z-amd64.deb
```

Launch **Orca** from your applications menu. To upgrade later, install the new `.deb` over the old one (`sudo dpkg -i Orca-new-version-amd64.deb`) — no uninstall required, but not fully in-app.

### npm (developers)

If you already have [Node.js 22+](https://nodejs.org/):

```bash
npm install -g @orca-ai/orca
orca
```

---

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

---

## Configuration

Copy `.env.example` to `.env` and adjust as needed.

| Setting | Default | Description |
| :------ | :------ | :---------- |
| Data directory | `~/.orca/` | Auth DB, plugins, browser profiles |
| Legacy migration | automatic | Migrates from `~/.cloudcli` and `~/.claude-code-ui` on first boot |

<details>
<summary><strong>Network / LAN access</strong></summary>

<br />

Set both variables, then create an account on first launch:

```env
DISABLE_AUTH=false
VITE_DISABLE_AUTH=false
```

</details>

<details>
<summary><strong>About tab & GitHub star badge</strong></summary>

<br />

```env
VITE_GITHUB_OWNER=Haroon966
VITE_GITHUB_REPO=Orca
```

</details>

---

## CLI

| Command | Description |
| :------ | :---------- |
| `orca` | Start the server |
| `orca status` | Show config and data paths |
| `orca help` | Show all options |

---

## Desktop

Orca ships as a desktop app for Windows, Ubuntu/Linux, and macOS. Installers are attached to each [GitHub Release](https://github.com/Haroon966/Orca/releases).

### Development

```bash
npm run desktop:dev   # run npm run dev in another terminal first
npm run desktop:pack  # build + unpackaged Electron app (local testing)
```

### Build installers locally

```bash
npm run desktop:dist:win     # Windows .exe
npm run desktop:dist:linux   # Linux .deb + AppImage
npm run desktop:dist:mac     # macOS .dmg + .zip
```

### Auto-update

When a new [GitHub Release](https://github.com/Haroon966/Orca/releases) is published, the desktop app checks for updates on launch and every 4 hours. Users see an **Update Available** prompt in the sidebar:

1. Click **Update Now** — the new version downloads in the background
2. Click **Restart to install** — Orca relaunches on the new version

No uninstall or manual reinstall is required on supported platforms. This is free (GitHub Releases + `electron-updater`).

| Platform | In-app auto-update |
| :------- | :----------------- |
| Windows (`.exe`) | Full download + restart to install |
| macOS (`.zip`) | Full download + restart to install |
| Linux (AppImage) | Full download + restart to install |
| Linux (`.deb`) | Update notification + download new `.deb` from GitHub Releases |

> Auto-update only works in **packaged** desktop installs (`.exe`, AppImage, etc.), not in `npm run dev` or `desktop:dev`.

Web and npm installs continue to use the existing update notification flow (`npm install -g @orca-ai/orca@latest` or git pull).

### Publishing (maintainers)

**GitHub Release + desktop installers:**

```bash
./release.sh --increment=patch
gh release create vX.Y.Z --title "Orca vX.Y.Z" --notes-file CHANGELOG.md   # if release-it skips GitHub
gh workflow run desktop-release.yml -f tag=vX.Y.Z                          # re-run desktop builds
```

Add to `.env` (never commit):

```env
GITHUB_TOKEN=ghp_...   # repo scope PAT for release-it
NPM_TOKEN=npm_...      # publish token with Bypass 2FA enabled
```

**npm publish** (if not using release-it npm step):

```bash
npm login
npm publish --access public --otp=123456   # use authenticator code if 2FA enabled
```

---

## Theming & appearance

Open **Settings → Appearance**:

| Option | Details |
| :----- | :------ |
| **Color theme** | Orca (default), Classic, Slate, or custom palette with per-token color pickers |
| **Dark mode** | Toggled independently of the color theme |
| **Code editor** | Theme, font size, word wrap, minimap, line numbers |
| **Language** | 10+ locales |
| **Project sorting** | Alphabetical or by recent activity |

---

## Fork & attribution

Orca is derived from [CloudCLI UI](https://github.com/siteboon/claudecodeui) by Siteboon AI B.V. and contributors.

See [NOTICE](NOTICE) for upstream copyright and license attribution.

---

<div align="center">

## License

[AGPL-3.0-or-later](LICENSE) · See [NOTICE](NOTICE) for upstream attribution

<br />

**Made for the Claude Code community**

</div>
