# .zshrc sample for macos-privacy-dev-setup
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="powerlevel10k/powerlevel10k"
plugins=(git brew)

# Privacy aliases
git config --global blame.ignoreRevsFile .git-blame-ignore-revs
alias ls='ls -F'
alias brewup='brew update && brew upgrade && brew cleanup'

# Less cognitive load
autoload -Uz compinit; compinit
setopt prompt_subst

# Add more settings as needed
