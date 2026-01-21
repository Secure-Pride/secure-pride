#!/bin/bash
# verify-auth-plugins.sh

set -e

echo "🔎 Checking auth plugins and privacy configs..."

# Check ZSH plugins
ZSHRC=~/.zshrc
if grep -q 'plugins=' "$ZSHRC"; then
  echo "Plugins found in .zshrc:"
  grep 'plugins=' "$ZSHRC"
else
  echo "No plugins specified in .zshrc"
fi

# List installed Homebrew packages
if command -v brew >/dev/null 2>&1; then
  echo "Homebrew packages:"
  brew list
else
  echo "Brew not found."
fi

# Objective-See
echo "Objective-See software installed via Homebrew:"
brew list --cask | grep -E 'lulu|blockblock' || echo "None found"

echo "Audit complete."
