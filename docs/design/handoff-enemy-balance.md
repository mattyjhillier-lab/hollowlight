# Handoff: enemy balance follow-up (paused 2026-10-18)

Branch wip/enemy-balance holds ONE uncommitted-on-dev edit: ALT6 data (applied, NOT yet verified).

## Task status
1. ALT6: EDITED, unverified. enemies.json bramble_hart hp 70->45; chapters.json stoat_piper from 120->180, maxAlive 8->4; bramble_hart maxAlive 3->2, maxAliveAfter {t:600,n:4} (was 5). The 96-seed confirmation sweep was killed mid-run: NO numbers yet.
2. Wolf AI leash fix (Wren): NOT STARTED (no probes run). Look at src/sim/weapons.js wolf hunting (targets within 150 of player, claim set, Rally, Light Trails/Echo/Alpha). Ideas: ignore/deprioritise rooted ranged enemies beyond a leash radius, prefer targets closest to the hero, tanky enemies lower priority when others near. Measure wolf away-time, kills, damage taken; keep evo-home (scripts/evo-home.mjs) for wolf evos in band; no hpScale/R1 changes.
3. Atlas size (2.53 MB frames vs ~1 MB): NOT STARTED. Options: texel density 4 for new species (-36%), drop half-density rims on walk frames 2/4, lazy bake by chapter, packing. Need before/after true-size shots (day+night, six Husk species), bytes, boot-bake time, contrast spot re-check.
4. Toad eyes (near lantern, High+bloom, 2.6-2.8:1): NOT STARTED. Strengthen eye/socket; re-measure with scripts/wl6-measure.mjs contrast TYPES=puffback_toad (stoat at 14:30 dawn corrupt ground if cheap).

## Sweep command (scratchpad script, recreate if lost)
For each hero in wren elias, FOCUS in 0 1, SEED_FROM in 1 33 65: `FOCUS=$f SEED_FROM=$s node scripts/sweep.mjs $hero 32` (12 procs in parallel; takes >10 min, run in background). Sum "win rate (n/32)" per config. Blessings on, DODGE default on.
Reference: baseline wren 24/30, elias 23/26; all three enemies wren 5/6, elias 13/16; ALT6 earlier measured wren 11/8, elias 18/20 (percent, random/FOCUS). Band 15-30%.

## Next steps in order
1. Run the ALT6 sweep above; if matches, commit data on dev (separate commit), run npm test/build/audit.
2. Wolf AI probes then smallest fix; re-sweep + evo-home.
3. Atlas, then toad eyes. Update docs/LOCKED.md and QUEUE.md with before/after rows.
Open decision: if Wren stays under 15% after 1+2, report next levers for FINAL retune (not apply).
Do not stage src/data/tree/*, src/meta/tree*, aggregateMods, tree-impact.mjs (other agent).
