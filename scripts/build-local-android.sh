#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"
REQUIRED_NDK_VERSION="27.1.12297006"
REQUIRED_PLATFORM="android-35"
REQUIRED_BUILD_TOOLS="35.0.0"

echo "[0/6] Validate environment"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required."
  exit 1
fi

if ! command -v java >/dev/null 2>&1; then
  echo "Java is required (JDK 17+ recommended)."
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required."
  exit 1
fi

echo "[0.3/6] Auto bump Android version (versionCode + versionName)"
node scripts/bump-app-version.mjs

echo "[0.5/6] Validate Expo package alignment"
set +e
node <<'EOF'
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const bundledPath = path.join(root, 'node_modules', 'expo', 'bundledNativeModules.json');
const checks = [
  'expo-constants',
  'expo-device',
  'expo-notifications',
  '@react-native-async-storage/async-storage'
];

function normalize(version) {
  return String(version || '').replace(/^[~^]/, '');
}

if (!fs.existsSync(bundledPath)) {
  process.exit(0);
}

const bundled = JSON.parse(fs.readFileSync(bundledPath, 'utf8'));
const mismatches = [];

for (const pkgName of checks) {
  const expected = normalize(bundled[pkgName]);
  if (!expected) continue;

  const pkgJsonPath = path.join(root, 'node_modules', pkgName, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) continue;

  const installed = normalize(JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).version);
  if (installed !== expected) {
    mismatches.push({ pkgName, expected, installed });
  }
}

if (mismatches.length > 0) {
  console.error('Expo package mismatch detected:');
  for (const mismatch of mismatches) {
    console.error(
      ` - ${mismatch.pkgName}: installed ${mismatch.installed}, expected ${mismatch.expected}`
    );
  }
  process.exit(42);
}
EOF
ALIGNMENT_STATUS=$?
set -e

if [[ "$ALIGNMENT_STATUS" -eq 42 ]]; then
  echo "Dependency versions are not aligned with current Expo SDK."
  echo "Run:"
  echo "  npx expo install expo-constants expo-device expo-notifications @react-native-async-storage/async-storage"
  echo "Then retry:"
  echo "  npm run build:local:android"
  exit 1
elif [[ "$ALIGNMENT_STATUS" -ne 0 ]]; then
  echo "Unable to validate Expo package alignment."
  exit 1
fi

# Resolve Android SDK path (prefer writable user SDK)
declare -a SDK_CANDIDATES=()
if [[ -n "${ANDROID_SDK_ROOT:-}" ]]; then
  SDK_CANDIDATES+=("$ANDROID_SDK_ROOT")
fi
if [[ -n "${ANDROID_HOME:-}" ]]; then
  SDK_CANDIDATES+=("$ANDROID_HOME")
fi
SDK_CANDIDATES+=("$HOME/Library/Android/sdk" "/Library/Android/sdk")

SDK_PATH=""
for candidate in "${SDK_CANDIDATES[@]}"; do
  if [[ -d "$candidate" && -w "$candidate" ]]; then
    SDK_PATH="$candidate"
    break
  fi
done

if [[ -z "$SDK_PATH" ]]; then
  echo "No writable Android SDK found."
  echo "Checked:"
  printf ' - %s\n' "${SDK_CANDIDATES[@]}"
  echo "Use one of these fixes:"
  echo "1) export ANDROID_SDK_ROOT=\"$HOME/Library/Android/sdk\""
  echo "2) grant write access to your SDK directory"
  exit 1
fi

export ANDROID_SDK_ROOT="$SDK_PATH"
export ANDROID_HOME="$SDK_PATH"
echo "Using Android SDK: $SDK_PATH"

if [[ ! -d android ]]; then
  echo "[1/6] android/ missing -> running local prebuild"
  CI=1 npx expo prebuild --platform android
else
  echo "[1/6] android/ exists -> skip prebuild"
fi

echo "[2/6] Write android/local.properties"
mkdir -p android
printf "sdk.dir=%s\n" "${SDK_PATH//\//\\/}" > android/local.properties

find_sdkmanager() {
  local sdk_root="$1"
  local candidate=""

  # Common locations first.
  for candidate in \
    "$sdk_root/cmdline-tools/latest/bin/sdkmanager" \
    "$sdk_root/cmdline-tools/bin/sdkmanager" \
    "$sdk_root/tools/bin/sdkmanager"
  do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  # Fallback: any versioned cmdline-tools directory.
  local dir=""
  for dir in "$sdk_root"/cmdline-tools/*/bin; do
    candidate="$dir/sdkmanager"
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  # Last fallback: sdkmanager from PATH.
  if command -v sdkmanager >/dev/null 2>&1; then
    command -v sdkmanager
    return 0
  fi

  return 1
}

echo "[3/6] Ensure SDK licenses accepted"
if SDKMANAGER_BIN="$(find_sdkmanager "$SDK_PATH")"; then
  echo "Using sdkmanager: $SDKMANAGER_BIN"
  yes | "$SDKMANAGER_BIN" --sdk_root="$SDK_PATH" --licenses >/dev/null || true
else
  SDKMANAGER_BIN=""
  echo "sdkmanager not found. Skip SDK auto-install/repair."
fi

echo "[3.5/6] Ensure required Android SDK components"
if [[ -n "$SDKMANAGER_BIN" ]]; then
  NDK_SOURCE_PROPERTIES="$SDK_PATH/ndk/$REQUIRED_NDK_VERSION/source.properties"
  if [[ -d "$SDK_PATH/ndk/$REQUIRED_NDK_VERSION" && ! -f "$NDK_SOURCE_PROPERTIES" ]]; then
    echo "Broken NDK detected at $SDK_PATH/ndk/$REQUIRED_NDK_VERSION -> removing..."
    rm -rf "$SDK_PATH/ndk/$REQUIRED_NDK_VERSION"
  fi

  "$SDKMANAGER_BIN" --sdk_root="$SDK_PATH" \
    "platforms;$REQUIRED_PLATFORM" \
    "build-tools;$REQUIRED_BUILD_TOOLS" \
    "ndk;$REQUIRED_NDK_VERSION"

  if [[ ! -f "$SDK_PATH/ndk/$REQUIRED_NDK_VERSION/source.properties" ]]; then
    echo "NDK still invalid after install: $SDK_PATH/ndk/$REQUIRED_NDK_VERSION"
    exit 1
  fi
fi

echo "[4/6] Build release APK + AAB with Gradle"
(
  cd android
  ./gradlew :app:assembleRelease :app:bundleRelease
)

APK_SRC="android/app/build/outputs/apk/release/app-release.apk"
AAB_SRC="android/app/build/outputs/bundle/release/app-release.aab"

if [[ ! -f "$APK_SRC" ]]; then
  echo "APK not found: $APK_SRC"
  exit 1
fi

if [[ ! -f "$AAB_SRC" ]]; then
  echo "AAB not found: $AAB_SRC"
  exit 1
fi

echo "[5/6] Collect artifacts"
OUT_DIR="apk/local"
mkdir -p "$OUT_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
APK_OUT="$OUT_DIR/app-release-$STAMP.apk"
AAB_OUT="$OUT_DIR/app-release-$STAMP.aab"

cp "$APK_SRC" "$APK_OUT"
cp "$AAB_SRC" "$AAB_OUT"

echo "[6/6] Done"
echo "APK: $ROOT_DIR/$APK_OUT"
echo "AAB: $ROOT_DIR/$AAB_OUT"
