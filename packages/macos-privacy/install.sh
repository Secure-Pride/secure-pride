#!/bin/bash
# install.sh
set -e

echo "🔒 macos-privacy-dev-setup installer"

echo "Checking for Xcode CLI tools ..."
xcode-select --install 2>/dev/null || echo "Xcode CLI already installed"

echo "Checking for Homebrew ..."
which brew >/dev/null 2>&1 || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

echo "Installing iTerm2 ..."
brew install --cask iterm2

echo "Installing Objective-See tools ..."
brew install --cask lulu
brew install --cask blockblock

echo "Setting up .zshrc, privacy defaults ..."
cp .zshrc ~/
cp .p10k.zsh ~/

# Security Audit
cp verify-auth-plugins.sh ~/macos-privacy-dev-setup/
chmod +x ~/macos-privacy-dev-setup/verify-auth-plugins.sh

# AI CLI stub
cp ai.sh ~/macos-privacy-dev-setup/
chmod +x ~/macos-privacy-dev-setup/ai.sh

# iPad translational folder
mkdir -p ~/macos-privacy-dev-setup/ipad-sync/

echo "✅ Install complete. Restart terminal, approve system prompts, and enjoy!"
