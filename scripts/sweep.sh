#!/bin/bash
# Runs random + focused sweeps for wren and elias in parallel. Usage: scripts/sweep.sh [seeds] [outdir]
N=${1:-12}; D=${2:-${TMPDIR:-/tmp}/sweep}; mkdir -p "$D"
cd "$(dirname "$0")/.."
for c in wren elias; do
  node scripts/sweep.mjs $c $N > "$D/${c}_r.txt" &
  FOCUS=1 node scripts/sweep.mjs $c $N > "$D/${c}_f.txt" &
done
wait
cat "$D"/wren_r.txt "$D"/wren_f.txt "$D"/elias_r.txt "$D"/elias_f.txt
