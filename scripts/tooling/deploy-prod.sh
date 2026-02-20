#!/bin/bash
# Deploy to production (odisai.net) via Taylor's Vercel project
# Usage: ./scripts/tooling/deploy-prod.sh
#
# This builds locally and uploads prebuilt artifacts to avoid
# Vercel Hobby tier build limits (2 cores / 8 GB).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VERCEL_DIR="$REPO_ROOT/.vercel"
TOKEN="${VERCEL_DEPLOY_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "Error: VERCEL_DEPLOY_TOKEN is not set."
  echo "Set it with: export VERCEL_DEPLOY_TOKEN=<token>"
  echo "Create a token at: https://vercel.com/account/tokens"
  exit 1
fi

echo "==> Switching to Taylor's project config..."
cp "$VERCEL_DIR/project.json" "$VERCEL_DIR/project.json.bak"
cp "$VERCEL_DIR/project.taylor.json" "$VERCEL_DIR/project.json"

cleanup() {
  echo "==> Restoring local project config..."
  cp "$VERCEL_DIR/project.json.bak" "$VERCEL_DIR/project.json"
}
trap cleanup EXIT

echo "==> Pulling production env vars..."
vercel pull --yes --environment=production --token="$TOKEN"

echo "==> Building locally..."
vercel build --prod --token="$TOKEN"

echo "==> Deploying prebuilt to production..."
vercel deploy --prebuilt --prod --token="$TOKEN"

echo ""
echo "Done! Check https://odisai.net"
