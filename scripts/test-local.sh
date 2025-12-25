#!/usr/bin/env bash
# Simple local test script for Dead Drop worker (assumes `wrangler dev` is running on 127.0.0.1:8787)

set -euo pipefail

HOST=${1:-http://127.0.0.1:8787}

echo "Storing a secret..."
resp=$(curl -s -X POST "$HOST/store" -H "Content-Type: application/json" -d '{"message":"hello-local"}')
echo "Response: $resp"

id=$(echo "$resp" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
if [ -z "$id" ]; then
  echo "Failed to get id from response" >&2
  exit 1
fi

echo "Reading secret with id=$id"
curl -s "$HOST/read/$id"
