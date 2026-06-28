#!/bin/bash
# Load release tokens from .env when present.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -v '^#' .env | grep -E '^(GITHUB_TOKEN|NPM_TOKEN)=' | sed 's/^/export /')
  set +a
fi
exec npx release-it "$@"
