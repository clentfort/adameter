#!/usr/bin/env bash
#
# Upload source strings to Crowdin
#

BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)

pnpm run fbtee:collect

jq '.phrases |= map( . + { col_beg: .loc.start.column, col_end: .loc.end.column, line_beg: .loc.start.line, line_end: .loc.end.line, filepath: .filename } | del(.filename, .loc) )' source_strings.json > source_strings.json.tmp && mv source_strings.json.tmp source_strings.json

pnpm exec crowdin push -b ${BRANCH_NAME} --plain sources
