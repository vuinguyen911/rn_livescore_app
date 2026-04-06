#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

KEYSTORE_PATH="android-upload-keystore.jks"
CREDENTIALS_PATH="credentials.json"
ALIAS="upload"

if [[ -f "$KEYSTORE_PATH" && -f "$CREDENTIALS_PATH" ]]; then
  echo "Keystore and credentials.json already exist."
  exit 0
fi

passgen() {
  python3 - <<'PY'
import secrets, string
chars=string.ascii_letters + string.digits
print(''.join(secrets.choice(chars) for _ in range(24)))
PY
}

KEYSTORE_PASSWORD="$(passgen)"
KEY_PASSWORD="$(passgen)"

keytool -genkeypair \
  -v \
  -storetype JKS \
  -keystore "$KEYSTORE_PATH" \
  -storepass "$KEYSTORE_PASSWORD" \
  -keypass "$KEY_PASSWORD" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=UVI LiveScore, OU=Mobile, O=UVI, L=Tokyo, ST=Tokyo, C=JP"

cat > "$CREDENTIALS_PATH" <<JSON
{
  "android": {
    "keystore": {
      "keystorePath": "$KEYSTORE_PATH",
      "keystorePassword": "$KEYSTORE_PASSWORD",
      "keyAlias": "$ALIAS",
      "keyPassword": "$KEY_PASSWORD"
    }
  }
}
JSON

cat > .android-keystore.env <<ENV
ANDROID_KEYSTORE_PATH=$KEYSTORE_PATH
ANDROID_KEY_ALIAS=$ALIAS
ANDROID_KEYSTORE_PASSWORD=$KEYSTORE_PASSWORD
ANDROID_KEY_PASSWORD=$KEY_PASSWORD
ENV

echo "Generated $KEYSTORE_PATH, $CREDENTIALS_PATH, and .android-keystore.env"
