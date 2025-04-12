#!/usr/bin/env bash
#
# Upload source strings to Crowdin
#

BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)

pnpm run fbtee:manifest
pnpm run fbtee:collect

# Rename the file to match the expected name as the crowdin CLI does not support
# files with a leading dot
mv .source_strings.json source_strings.json
pnpm exec crowdin push -b ${BRANCH_NAME} --plain sources
rm source_strings.json
