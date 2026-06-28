#!/bin/bash
# Publish @orca_ai/orca to npm using NPM_TOKEN from .env (granular token with Bypass 2FA).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "Error: .env not found. Add NPM_TOKEN (granular token with Bypass 2FA enabled)." >&2
  exit 1
fi

NPM_TOKEN="$(grep '^NPM_TOKEN=' .env | cut -d= -f2- | tr -d '\r' || true)"
if [ -z "$NPM_TOKEN" ]; then
  echo "Error: NPM_TOKEN is missing in .env." >&2
  exit 1
fi

TMP_NPMRC="$(mktemp)"
PUBLISH_ERR="$(mktemp)"
trap 'rm -f "$TMP_NPMRC" "$PUBLISH_ERR"' EXIT
printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" > "$TMP_NPMRC"

echo "Building…"
npm run build

echo "Publishing $(node -p "require('./package.json').name")@$(node -p "require('./package.json').version")…"
if ! npm publish --access public --userconfig "$TMP_NPMRC" 2>"$PUBLISH_ERR"; then
  cat "$PUBLISH_ERR" >&2
  if grep -q EOTP "$PUBLISH_ERR"; then
    echo >&2
    echo "Publish blocked: NPM_TOKEN does not bypass 2FA." >&2
    echo "Create a NEW granular token at https://www.npmjs.com/settings/~/tokens" >&2
    echo "Enable \"Bypass two-factor authentication (2FA)\" when creating it (not after)." >&2
    echo "Replace NPM_TOKEN in .env, then run: npm run publish:npm" >&2
  elif grep -qE '404 Not Found - PUT|E403.*org/orca-ai' "$PUBLISH_ERR"; then
    echo >&2
    echo "Publish blocked: NPM_TOKEN cannot publish to @orca_ai." >&2
    echo "Recreate the token with Organization access: orca_ai (Read and write)," >&2
    echo "or grant scope @orca_ai, then update NPM_TOKEN in .env." >&2
  fi
  exit 1
fi

echo "Published successfully."
