#!/usr/bin/env bash

#
# Download translations from Crowdin
#

BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)

pnpm run fbtee:collect

if [ -z "$CROWDIN_API_TOKEN" ]; then
  echo "CROWDIN_API_TOKEN not set, creating dummy translation file."
  mkdir -p translations
  echo '{
 "fb-locale": "de_DE",
 "translations": {
 }
}' > translations/de_DE.json
else
  echo "CROWDIN_API_TOKEN is set, downloading translations."
  pnpm exec crowdin pull -b ${BRANCH_NAME} --plain translations
fi

pnpm run fbtee:translate
