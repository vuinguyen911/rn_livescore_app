#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  echo ".env not found. Copy from .env.example and fill values first."
  exit 1
fi

set -a
source .env
set +a

required=(
  EXPO_TOKEN
  EAS_PROJECT_ID
  ANDROID_PACKAGE_NAME
)

for key in "${required[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required env: $key"
    exit 1
  fi
done

export EXPO_TOKEN
export EAS_PROJECT_ID
export ANDROID_PACKAGE_NAME
export IOS_BUNDLE_IDENTIFIER="${IOS_BUNDLE_IDENTIFIER:-$ANDROID_PACKAGE_NAME}"

echo "[1/5] Install dependencies"
npm install

echo "[2/5] Bump app version (+0.1)"
npm run bump:version

echo "[3/5] Sync Expo config from .env"
npm run sync:config

echo "[4/5] Build iOS (production profile)"
npx eas build \
  --platform ios \
  --profile production \
  --non-interactive \
  --wait

echo "[5/5] Done. iOS build completed."
