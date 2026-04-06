set -a
source .env
set +a
npx eas submit --platform android --profile internal --latest --non-interactive



