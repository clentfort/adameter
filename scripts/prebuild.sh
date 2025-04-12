#!/usr/bin/env bash

BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)

pnpm exec crowdin pull -b ${BRANCH_NAME} --plain translations
pnpm run fbtee:manifest
pnpm run fbtee:collect
pnpm run fbtee:translate
