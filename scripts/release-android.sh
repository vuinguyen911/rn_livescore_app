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
  GOOGLE_SERVICE_ACCOUNT_JSON
  ANDROID_PACKAGE_NAME
)

for key in "${required[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required env: $key"
    exit 1
  fi
done

if [[ ! -f "$GOOGLE_SERVICE_ACCOUNT_JSON" ]]; then
  echo "GOOGLE_SERVICE_ACCOUNT_JSON path not found: $GOOGLE_SERVICE_ACCOUNT_JSON"
  exit 1
fi

export EXPO_TOKEN
export GOOGLE_SERVICE_ACCOUNT_JSON
export ANDROID_PACKAGE_NAME
export GOOGLE_PLAY_TRACK="${GOOGLE_PLAY_TRACK:-production}"
export GOOGLE_PLAY_RELEASE_STATUS="${GOOGLE_PLAY_RELEASE_STATUS:-completed}"

submit_profile="production"
if [[ "$GOOGLE_PLAY_TRACK" == "internal" ]]; then
  submit_profile="internal"
fi

echo "[1/7] Install dependencies"
npm install

echo "[2/7] Generate store metadata + screenshots"
npm run store:prepare

echo "[3/7] Bump app version (+0.1)"
npm run bump:version

echo "[4/7] Sync Expo config from .env"
npm run sync:config

echo "[5/7] Build + auto submit AAB to Google Play via EAS"
npx eas build \
  --platform android \
  --profile production \
  --non-interactive \
  --wait \
  --auto-submit-with-profile "$submit_profile"

echo "[6/7] Upload screenshots and listing metadata to Google Play"
npm run play:upload-listing

echo "[7/7] Done. Release pipeline completed."
