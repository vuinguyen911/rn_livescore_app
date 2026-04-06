#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  echo ".env not found. Copy from .env.example and fill values first."
  exit 1
fi

set -a
source .env
set +a

export GOOGLE_PLAY_TRACK="production"
export GOOGLE_PLAY_RELEASE_STATUS="completed"
# Most production Play Console setups auto-send for review.
export GOOGLE_PLAY_COMMIT_MODE="without-not-sent"

echo "Production release mode: track=$GOOGLE_PLAY_TRACK, releaseStatus=$GOOGLE_PLAY_RELEASE_STATUS"

bash scripts/release-android.sh
