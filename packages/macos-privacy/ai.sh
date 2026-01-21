#!/bin/bash
# ai.sh - AI CLI helper stub

# PURPOSE:
#   Quick, minimal local OpenAI CLI tool. Add your API key, customize endpoints as needed.
#   Privacy-respecting: key is never stored outside your machine.

# USAGE:
#   ./ai.sh "What is the capital of France?"

API_KEY="YOUR_OPENAI_API_KEY_HERE"
MODEL="gpt-3.5-turbo"
ENDPOINT="https://api.openai.com/v1/chat/completions"
USER_PROMPT="$1"

if [[ -z "$API_KEY" || "$API_KEY" == "YOUR_OPENAI_API_KEY_HERE" ]]; then
  echo "Please set your OpenAI API key in ai.sh before running."
  exit 1
fi

RESPONSE=$(curl -s $ENDPOINT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"model": "'$MODEL'", "messages": [{"role": "user", "content": "'$USER_PROMPT'"}]}'
)

CHOICE=$(echo "$RESPONSE" | grep -o '"content":"[^"]*"' | sed 's/"content":"//')
echo "$CHOICE"
