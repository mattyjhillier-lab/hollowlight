#!/bin/sh
# BLESSINGS FROM THE START sweeps (exact). Run from the repo root; re-run to resume (finished seeds are skipped).
# after  = the shipped blessings.json draw rule. Same bots, seeds 1-100, GATES/META/BOND sets and Twilight as docs/companions-baseline/run.sh; <=9 workers.
# before = BLESS_DRAW=old (Blessings only fill, the dev rule before this chunk) on this code. It reproduces docs/companions-baseline rows
#          exactly for cells whose data did not change since C1 (checked seed by seed), so only cells that changed since C1 (Meteor: crash
#          damage trim + fireball picks, 16f5a74) are re-run at 100 seeds; the other fresh cells run 20 seeds only, for the card-mix counts.
set -e
FRESH=""
for h in wren elias hearthwarden; do for w in spirit_bolts chain_lightning holy_orbit dragonfire_meteor; do FRESH="$FRESH,$h:$w"; done; done
MM=wren:ghost_wolves,wren:spirit_bolts,elias:holy_orbit,hearthwarden:dragonfire_meteor
OUT_DIR=docs/blessings-partials/after node scripts/companions-baseline.mjs fresh 100 "${FRESH#,}" 9
OUT_DIR=docs/blessings-partials/after node scripts/companions-baseline.mjs mid 100 $MM 9
OUT_DIR=docs/blessings-partials/after node scripts/companions-baseline.mjs max 100 $MM 9
BLESS_DRAW=old OUT_DIR=docs/blessings-partials/before node scripts/companions-baseline.mjs fresh 100 wren:dragonfire_meteor,elias:dragonfire_meteor,hearthwarden:dragonfire_meteor 9
BLESS_DRAW=old OUT_DIR=docs/blessings-partials/before node scripts/companions-baseline.mjs fresh 20 "${FRESH#,}" 9
BLESS_DRAW=old OUT_DIR=docs/blessings-partials/before node scripts/companions-baseline.mjs mid 100 hearthwarden:dragonfire_meteor 9
BLESS_DRAW=old OUT_DIR=docs/blessings-partials/before node scripts/companions-baseline.mjs max 100 hearthwarden:dragonfire_meteor 9
