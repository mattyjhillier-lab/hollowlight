#!/bin/sh
# BLESSINGS 2 LATE HEAL SLOT sweeps: same cells/seeds/workers as docs/blessings-partials/run.sh "after", on the 8-Blessing build. Re-run to resume.
set -e
FRESH=""
for h in wren elias hearthwarden; do for w in spirit_bolts chain_lightning holy_orbit dragonfire_meteor; do FRESH="$FRESH,$h:$w"; done; done
MM=wren:ghost_wolves,wren:spirit_bolts,elias:holy_orbit,hearthwarden:dragonfire_meteor
OUT_DIR=docs/blessings4-partials node scripts/companions-baseline.mjs fresh 100 "${FRESH#,}" 9
OUT_DIR=docs/blessings4-partials node scripts/companions-baseline.mjs mid 100 $MM 9
OUT_DIR=docs/blessings4-partials node scripts/companions-baseline.mjs max 100 $MM 9
