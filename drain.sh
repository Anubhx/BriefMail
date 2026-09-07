#!/bin/bash

# Load environment variables from .env if available
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
  export $(grep -v '^#' "$SCRIPT_DIR/.env" | grep -E '^N8N_WEBHOOK_SECRET|^NEXT_PUBLIC_APP_URL' | xargs)
elif [ -f "$SCRIPT_DIR/.env.local" ]; then
  export $(grep -v '^#' "$SCRIPT_DIR/.env.local" | grep -E '^N8N_WEBHOOK_SECRET|^NEXT_PUBLIC_APP_URL' | xargs)
fi

SECRET="${N8N_WEBHOOK_SECRET}"
BASE_URL="${NEXT_PUBLIC_APP_URL:-https://briefmail.vercel.app}"
URL="${BASE_URL%/}/api/queue/drain"

if [ -z "$SECRET" ]; then
  echo "❌ Error: N8N_WEBHOOK_SECRET environment variable is missing."
  echo "Please export N8N_WEBHOOK_SECRET=... or add it to your .env file."
  exit 1
fi

echo "Starting queue drain loop against $URL..."
echo "Configured for Gemini 3.5 Flash Lite with multi-key rate-limit pacing (3s delay)"

while true; do
  RESULT=$(curl -s -X POST "$URL" \
    -H "x-n8n-secret: $SECRET" \
    -H "Content-Type: application/json")
  
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $RESULT"
  
  REMAINING=$(echo "$RESULT" | grep -o '"remaining_count":[0-9]*' | grep -o '[0-9]*')
  
  if [ -z "$REMAINING" ]; then
    REMAINING=$(echo "$RESULT" | grep -o '"remaining":[0-9]*' | grep -o '[0-9]*')
  fi

  if [ "$REMAINING" = "0" ]; then
    echo "✅ Queue is empty! All items processed."
    break
  fi

  sleep 3
done
