# macos-privacy-dev-setup

A ready-to-deploy starter kit that bootstraps a privacy-first, ADHD-friendly macOS terminal + developer environment —
includes Objective-See integration, AI-friendly CLI hooks, and a translational add-on for iPad Pro. Clone it, run `./install.sh`, and you’re set.

## Quick start (5 min)
```bash
git clone <repo_url_or_zip> ~/macos-privacy-dev-setup
cd ~/macos-privacy-dev-setup
./install.sh
```

**What it installs / configures**
- Xcode Command Line Tools (if missing)
- Homebrew (idempotent)
- iTerm2 (cask)
- LuLu + BlockBlock (Objective-See) via brew cask where available
- zsh config, aliases, privacy defaults
- verify-auth-plugins.sh (security audit)
- Optional Powerlevel10k prompt
- AI CLI helper stub (`ai.sh`) which you configure with your API key
- iPad translational folder for a-Shell / Blink workflows

**Design principles**
- Minimal defaults, privacy-first, low cognitive load.
- Non-destructive: scripts are idempotent and print actions before doing them.
- No hidden actions: review any shell scripts before running.
- Prompt for user approval when needed (macOS security).

## Post-install steps
1. Restart your terminal.
2. Approve system security prompts if asked (LuLu, BlockBlock, etc).
3. Optionally, set up the iPad translational folder (for code flow to a-Shell/Blink).

## Repo contents
- `install.sh`: main setup/install script
- `.zshrc`, `.p10k.zsh`: shell config
- `verify-auth-plugins.sh`: quick security audit script
- `ai.sh`: starter stub for AI CLI integrations
- `config/`: config files & add-ons
- `ipad-sync/`: folder for iPad code transfer

## Security
No telemetry. No data collection. AI API key usage is opt-in & local only.
