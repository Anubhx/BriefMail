#!/bin/bash

SECRET="ecd42864603dfaab506abc673e0fb6d3e58dca3b232678b76fe409714a852fb1"
URL="https://briefmail.vercel.app/api/queue/drain"

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
