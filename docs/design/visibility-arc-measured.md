# Visibility arc: measured results (WL6b2 + WL6c + WL6d), 2026-10-17

Spec: docs/design/visibility-arc-v1.md (gates G1-G8). Everything here is measured on the REAL build (`dist/`, Chrome headless, software GL), not a mock-up. Visual only: `git diff src/sim` is empty for all three chunks.

## How to re-run (independent of npm scripts; needs `npm run build` first and Chrome)
```
node scripts/wl6-measure.mjs contrast <outDir>     # full matrix, resumable (<outDir>/cells.jsonl), prints the gate summary
node scripts/wl6-measure.mjs summary  <outDir>     # re-read cells.jsonl and print/write summary.txt
node scripts/wl6-measure.mjs strip    <outDir>     # 4-frame eye-motion strips (WL6b2)
node scripts/wl6-measure.mjs vib      <outDir>     # vibrancy on/off chroma + screenshots (WL6c)
node scripts/wl6-measure.mjs shots    <outDir>     # true-size + phone screenshots at the 5 moments
```
Env (all optional): `SIZES=desk,land,port` `TS=30,240,480,690,870` `TIERS=high,med,low` `GROUNDS=hollow,restored,corrupt` `CBS=none,protan,deutan,tritan` `BRIGHT=normal|brighter|clear` `DIST=<build dir>` `SLOT=n` (own ports, so slices run in parallel; same outDir is fine) `RESUME=0` `KEEP=1` (keep the PNGs).
The full Normal matrix used: `GROUNDS=hollow,restored,corrupt CBS=none,protan,deutan,tritan TIERS=high,med,low`, run as three slices (`SIZES=desk`, `land`, `port`). Every capture is retried (max 3, fresh page; a frame with an unrendered enemy or a blink-dim eye is re-taken at a shifted held sim time) and every Chrome call has a 90 s timeout; finished captures are appended to `cells.jsonl` and skipped on resume.

Matrix: 3 views (desktop 1280x720@1, phone landscape 844x390@2, phone portrait 390x844@2) x 5 moments (0:30, 4:00, 8:00, 11:30, 14:30) x 3 tiers x 3 grounds (Hollow, restored radius 420, corrupted: 4 x stampCorr r460) x 3 enemy types (wolf, crow, root crawler) x 3 distances (70 inside the lantern pool, 140 edge, 220 outside) x 4 colour-vision modes (none, protan, deutan, tritan; Machado 2009 severity 1.0 matrices on linear RGB, applied to both frames before measuring) = **4860 cells**. Brighter and Clear sanity: desk + portrait, High + Low, Hollow + restored, none + protan = 720 cells each. Note: the distance-70 enemy always stands on the hero's own restored patch, in every ground column.

Gates in the harness: **G1|G2 cell pass** = eye peak contrast >= 3:1 against the local ground (WCAG, ground = median of the same pixels with the enemy removed) OR body-vs-ground |delta L*| >= 6. **G1 alone** (eyes only, up to 8:00). **Strict daylight reading** (design 4: after 11:00 every enemy also needs |delta L*| >= 6). **G3** = enemy pixels below RGB 12 (never pure black).

## Results, final build (Normal brightness)
| gate | result |
|---|---|
| G1 or G2 per cell (the gate) | **4850 / 4860**. Normal vision 1215/1215; protan 1209/1215, deutan 1214/1215, tritan 1212/1215 |
| by view | desk 1619/1620, land 1620/1620, port 1611/1620 |
| by tier | High 1611/1620, Med 1620/1620, Low 1619/1620 |
| by ground | Hollow 1616/1620, restored 1617/1620, corrupted 1617/1620 |
| by moment | 0:30 972/972, 4:00 972/972, 8:00 972/972, 11:30 969/972, 14:30 965/972 |
| G1 eyes alone >= 3:1, 0:30-8:00 | 2890 / 2916. All 26 cells under 3:1 are the root crawler at 220 units on the portrait phone under protan/tritan simulation, eye 2.87-2.99:1 (within 0.13 of the line) and every one passes G2 (|delta L*| 6.2-7.7) |
| G2 strict daylight reading (11:30 and 14:30, all must have |delta L*| >= 6) | 4494 / 4860 overall; of the 366 misses 289 are on CORRUPTED ground (dark violet ink under the daylight sky, body and ground within a few L*), all with eyes >= 2.83:1 and 356 of the 366 with eyes >= 3:1. Not a gate miss, listed because the sheet's wording asks for it |
| G3 no enemy pixel below RGB 12 | **0** (was 5344 before WL6d: 8% of Med root-crawler pixels at 0:30/4:00) |
| G4 visible >= 0.6 s before contact; G5 above the dark; G6 smoothness | unit tests (tests/nightlook.test.mjs, tests/arc.test.mjs, tests/visibility-pins.test.mjs): pass |
| G7 sim untouched | `git diff src/sim` empty for WL6b2, WL6c, WL6d; sweeps WREN + ELIAS x 24 seeds, random + FOCUS, worktree of the base commit vs the WL6c commit: **byte-identical (cmp, 4 of 4)** |
| G8 perf | see LOCKED WL6b2 / WL6c rows (same-build on/off, 350 enemies per tier, scripts/pace.mjs; noisy machine, no difference above the noise) |

The 10 cells of the gate that still miss (all Normal brightness, none under normal vision): root crawler at 220 units, portrait phone, High, at 11:30 / 14:30 under protan or tritan simulation (eye 2.83-2.99:1, |delta L*| 1.4-5.6), plus one deutan crow at 70 units on the desktop at 11:30 (eye 2.91:1, delta L* -5.8). Reason: on a daylight-bright ground (Y above ~0.3) an additive cream eye cannot exceed about 3:1 (its peak is capped near white), so only the silhouette can carry the cell, and a protan/tritan viewer sees a dark root-crawler body only slightly darker than the lit ground. Fix options needing a taste call: darker daylight root-crawler body (costs the G3 floor and makes it a heavier silhouette than Matt asked for at night), or a thin dark eye socket (would not change this metric but reads better to a person).

Brighter (720 cells): gate **720/720**, strict 716/720, G1 alone (<= 8:00) 426/432, G3 0.
Clear (720 cells): gate **718/720**, strict 683/720, G1 alone (<= 8:00) 423/432, G3 0; the 2 misses are the same root-crawler-at-220 protan cells (eye 2.84-2.91:1, |delta L*| 2.4-3.0).

## What was fixed because of the measurement (each fix re-measured)
1. **G3 (pure black)**: Med-tier root crawlers at 220 units had 8% of pixels under RGB 12 at 0:30 and 4:00 (5344 px in the matrix). Fix: a second far-body tint table for dark types (`DARK_FLOOR` root crawler 0.44, `DARK_FLOOR_DAY` final 0.36 once bodyK < 1, `DARK_DAY_K` 0.85); result 0 px. (A lower first floor of 0.30 also failed G3 on Low in WL6b2 and was raised to 0.34.)
2. **Eyes for protan viewers**: the night eye core is now pushed 35% toward white (luminance carries it); this did NOT lift the portrait-phone root crawler at 220 (still 2.87-2.99:1: its peak is already at the additive ceiling for that ground), so it stays a documented near-miss carried by the silhouette; the inside-the-pool eye floor went 0.5 -> 0.6 (crow multiplier 1.8 -> 1.6 so it stays below 1.0) because Land High at 4:00 on corrupted ground had wolf/crow eyes inside the pool at 1.9-2.5:1 (they passed on the 21-31 L* silhouette, but eyes alone should not be the weak link).
3. **Harness**: blink-dim frames were reported as misses (a blink is 0.12 s of every >= 3 s and was caught at the held sim time); the harness now re-takes such frames at a shifted time. Hung Chrome calls used to stall a slice for 30+ minutes; every call now times out and retries.

## Before the WL6d fixes (first full run, same matrix, 4860 cells)
Gate 4860/4860, strict 4540/4860, G1 alone 2898/2916, **G3 5344 px**. (Files: docs/screenshots/wl6d-before/.) The gate count after the fixes is 10 lower, all of it in the protan/tritan daylight cells above: the root crawler is darker in daylight now (DARK_DAY_K) and the capture rule also became stricter (blink-dim frames are no longer hidden by luck), so the two runs are not a like-for-like comparison; the honest reading is "normal vision 100% both times, G3 fixed".

## Eyes in sockets re-measure (2026-10-18)
Husk eyes are now baked into the bark sockets and the night glow is socket-shaped (LOCKED 'EYES IN SOCKETS'). Same full matrix, 4860 cells: G1|G2 4857/4860 (normal vision 1215/1215), G1 eyes alone up to 8:00 2862/2916, G3 0 px; misses = the known root crawler 220 portrait protan/tritan daylight cells. Two findings on the way: the High camera bloom (blur mixed 55% into the frame) halves a 3-5 px eye, so High uses hotter socket frames and a dark pool outline on the crow; and the harness held the sim clock so a hit while staging froze the Husk hurt squint (fixed in POS). Data: docs/screenshots/eyes/contrast/.

## Noise and limits
One frame per cell (plus up to two retries), on one seed, headless software GL; contrast noise about +-0.3, delta L* about +-1.5. The CVD pass is a matrix simulation, not a person. No real phone or sunlight test (Matt's checklist in visibility-arc-v1.md 4.1 still stands). The eye ceiling on bright ground is a property of an additive eye.

Raw data: docs/screenshots/wl6d/cells.jsonl (+ summary.txt), docs/screenshots/wl6d-brighter/, docs/screenshots/wl6d-clear/, docs/screenshots/wl6d-before/.
