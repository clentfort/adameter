#!/usr/bin/env bash

#
# Download translations from Crowdin
#

BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)

pnpm run fbtee:manifest
pnpm run fbtee:collect

# Linking the file to match the expected name as the crowdin CLI does not support
# files with a leading dot
ln -s .source_strings.json source_strings.json
pnpm exec crowdin pull -b ${BRANCH_NAME} --plain translations
rm source_strings.json

pnpm run fbtee:translate
