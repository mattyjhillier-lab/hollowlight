# Damage + crowd readability mock-ups (2026-10-20)

Design sheet: `docs/design/damage-readability-v1.md`. Open `index.html` for the side-by-side gallery.

All frames are the REAL build (HEAD 59c0062, clean export, `npm run build`) in our own headless Chrome, High quality, Normal brightness, Wren unless named. Moments are staged like `scripts/pace.mjs` (enemies injected around the hero, level-ups suppressed) and the sim is frozen on a real hit. Option frames are drawn ON that frozen frame with a throwaway in-page painter (`scripts/dr-mock.mjs`): Phaser objects (outline copies, arcs, chevrons, alpha/depth changes) and DOM (HUD glow). Nothing in the game is changed.

Sizes: `desk` 1280x720, `land` 844x390 @2x, `port` 390x844 @2x. `*-crop2x.png` = the 400x300 px around the hero from the desk frame at 2x.

## before/ (today)
- `m1-dark-0m40-*-hit-*ms`: dark opening, first wolf lunges, 30/120/300 ms after a wolf hit.
- `m2-swarm-4m00-*`: 4:00 with pipers + toads, a thorn hit.
- `m3-hart-6m20-*`: a Bramble Hart charge hit (-17 = 29% of Wren's HP).
- `m4-crowd-11m30-*`: 350 enemies at 11:30 (`*-crowd` = before the hit, low HP).
- `m5-elias-11m30-desk-crowd`: Elias in the same crowd.

## options/
| File | Shows |
|---|---|
| `hit-before-*` | the 6:20 hart hit as it looks today (re-triggered flash) |
| `hit-hitA/B/C-*` | (i) hit feedback options A hurt rim + lantern flinch + number above head, B white silhouette + feet ring + edge glow, C HUD-led |
| `hit-dirA/B/C-*` | (ii) direction options (with hit A): A attacker lifted + light-red outline + crescent, B compass arc + badge, C source-tagged number |
| `thorn-before/tellA/B/C-*` | (iii) tells at 4:00 after a thorn hit: A threat-first chevrons + thorn floor, B body-first (eye flare only), C hero radar ring |
| `crowd-before/crowdA/B/C-*` | (v) 350-enemy crowd: A threat hierarchy (+ ambient clarity: fog/motes/critters/sway off), B lantern pocket, C A+B (High clarity) |
| `recap-A/B/C-*` | (iv) defeat recap: A struck-down line + 'What hurt you' bars, B last five hits, C one tip (static HTML `recap.html?opt=A`) |

`metrics-hit.json`, `metrics-thorn.json`, `metrics-crowd.json`: per frame `occluders` (enemy sprites above the hero overlapping her), `tellsLive`, `redPct` (red-orange pixels within 0.2 x short side of the hero), `squintEdge` (mean luminance gradient at 1/8 size). `lightRedPct` and `brightPct` read 0 everywhere: the thresholds did not match the rendered colours, so ignore them.

Honest limits:
- crowd A and C are a SECOND page load (ambient layers off by URL flag), so their crowd is staged again: tell counts differ from `before` (desk 29 vs 30, land 28 vs 22, phone portrait 4 vs 18: that phone 'before' had only 4 live tells, so its redPct is not comparable).
- filler de-emphasis in the mock is alpha 0.74 only; the build would pull value/saturation instead (a first mock with a tint multiply turned Husks black because the night tint is already applied).
- the wolf chevrons in `tellA`/`crowdA` are uncapped in the mock (the injected crowd puts 10-18 wolves on course at once); the design caps full-strength chevrons at 4.
- `hit-dirC` also shows option A's above-head number (painted with hit A); in a build C's tagged number replaces it.
- 1-2 extra hits can land between the hook and the freeze (a few ms): numbers on screen are the real ones.

Reproduce (from a clean export with `dist/` built): `DIST=dist node scripts/dr-shots.mjs <out> m1` (before frames), `DIST=dist node scripts/dr-mock.mjs <out> hit|thorn|crowd`, `node scripts/dr-recap.mjs <out> recap` (repo root), sim numbers: `node scripts/dr-hitprobe.mjs wren 24 1 > w.json`.
