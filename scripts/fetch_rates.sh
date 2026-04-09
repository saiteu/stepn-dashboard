#!/bin/bash

source "$(dirname "$0")/.env"

RATES=$(curl -s \
  "https://api.coingecko.com/api/v3/simple/price?ids=go-game-token,stepn,polygon-ecosystem-token&vs_currencies=usd,jpy&include_24hr_change=true")

JSON=$(echo $RATES | jq \
  --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  '. + {updated_at: $ts}')

curl -s -X PATCH \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"files\":{\"stepn_rates.json\":{\"content\":$(echo $JSON | jq -Rs .)}}}" \
  "https://api.github.com/gists/$GIST_ID" > /dev/null

echo "$(date): レート更新完了"
