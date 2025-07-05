#!/usr/bin/env bash
#
# Upload source strings to Crowdin
#

BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)

pnpm run fbtee:collect

pnpm exec crowdin push -b ${BRANCH_NAME} --plain sources
