#!/bin/sh
# Companions C1 BASELINE commands (exact). Run from the repo root; re-run to resume (finished seeds are skipped).
set -e
FRESH=""
for h in wren elias hearthwarden; do for w in spirit_bolts chain_lightning holy_orbit dragonfire_meteor ghost_wolves raven_flock; do FRESH="$FRESH,$h:$w"; done; done
node scripts/companions-baseline.mjs fresh 100 "${FRESH#,}" 9
node scripts/companions-baseline.mjs mid 100 wren:ghost_wolves,wren:spirit_bolts,elias:holy_orbit,hearthwarden:dragonfire_meteor 9
node scripts/companions-baseline.mjs max 100 wren:ghost_wolves,wren:spirit_bolts,elias:holy_orbit,hearthwarden:dragonfire_meteor 9
node scripts/companions-baseline.mjs --sum > docs/companions-baseline/SUMMARY-raw.txt
