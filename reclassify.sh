#!/bin/bash

# Load environment variables from .env or .env.local
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
  export $(grep -v '^#' "$SCRIPT_DIR/.env" | grep -E '^N8N_WEBHOOK_SECRET|^NEXT_PUBLIC_APP_URL' | xargs)
elif [ -f "$SCRIPT_DIR/.env.local" ]; then
  export $(grep -v '^#' "$SCRIPT_DIR/.env.local" | grep -E '^N8N_WEBHOOK_SECRET|^NEXT_PUBLIC_APP_URL' | xargs)
fi

SECRET="${N8N_WEBHOOK_SECRET}"
BASE_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
# Change include_regex=true to re-run classification across all unclassified/regex emails
URL="${BASE_URL%/}/api/emails/reclassify-all?limit=100&include_regex=true"

if [ -z "$SECRET" ]; then
  echo "❌ Error: N8N_WEBHOOK_SECRET environment variable is missing."
  echo "Please set N8N_WEBHOOK_SECRET in your .env or .env.local file."
  exit 1
fi

echo "🚀 Starting batch email reclassification loop against $URL..."

TOTAL_RECLASSIFIED=0

while true; do
  RESPONSE=$(curl -s -X POST "$URL" \
    -H "x-n8n-secret: $SECRET" \
    -H "Content-Type: application/json")
  
  # Check if response returned an error
  if echo "$RESPONSE" | grep -q '"error"'; then
    echo "❌ API Error: $RESPONSE"
    exit 1
  fi

  RECLASSIFIED=$(echo "$RESPONSE" | grep -o '"reclassified":[0-9]*' | grep -o '[0-9]*')
  REMAINING=$(echo "$RESPONSE" | grep -o '"remaining":[0-9]*' | grep -o '[0-9]*')
  
  TOTAL_RECLASSIFIED=$((TOTAL_RECLASSIFIED + ${RECLASSIFIED:-0}))
  
  echo "$(date '+%H:%M:%S') - Reclassified this batch: ${RECLASSIFIED:-0} | Remaining: ${REMAINING:-0} | Total so far: $TOTAL_RECLASSIFIED"

  if [ "${REMAINING:-0}" = "0" ] || [ "${RECLASSIFIED:-0}" = "0" ]; then
    echo "✅ All synced emails categorized! (Total processed: $TOTAL_RECLASSIFIED)"
    break
  fi

  # Short pause to prevent throttling
  sleep 1
done
