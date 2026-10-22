# Handoff: S2 wolf evolutions (Lantern-Heart look), safe-stopped 2026-10-22

Branch: `wip/s2`, one commit on top of dev HEAD 0cd86d3 that holds only S2 files. NOT merged to dev. Render only: no src/sim or data change.

## Done (code + tests)
- `src/gfx/summon/wolf.js`: evolution painters. `goldSvg` adds a gold rim through an SVG filter `#grim`: the body alpha is thresholded at 0.5 (the halo and mist feet get no rim), then a 2.6 du soft band and a 1.1 du hot line are drawn outside the silhouette. Gold is used on evolved units only.
  - Alpha (`alpha` kind): frost mane, amber eyes `#b8742a`, heart 1.3x. Baked at 132x96 (1 texel per du) and drawn at ALPHA_K = 1.7.
  - Echo (`echo`, filter `#hollow`): faint ghost body at 0.22 alpha, a pale edge line, a pale eye and the warm heart. No gold rim.
  - Light Trails (`lfoot`): ears swept back, tail lifted, light streamers. The frame box is shifted back (LF_BOX, ax 72/128). Overlay offsets come from OV_OFF_LF.
- `frames.js`: Alpha 132x96 (S0 was 176x128; changed to stay inside the 2.5 MB budget). Echo ay fixed to WOLF_AY. New frames: wolfg_0-5, lfoot_0-5, flat_wolfg. Page is 1024x640, which is exactly the 2.5 MB cap.
- `atlas.js` WOLF_BAKE now holds 35 frames. `paint.js` has a named `decal_paw` painter.
- `wolfanim.js` `wolfSkin()`: picks the frame, size and anchor per unit and evolution:
  - Shades stay plain wolves (0.5 alpha). Echoes get no rim.
  - Low tier uses flat_wolf or flat_wolfg; the Low Alpha is flat_wolfg at 1.7x; Low echoes use echo_0.
- New `src/gfx/summon/pawtrail.js`: one pawprint per existing sim trail point (every 7 px).
  - Paws alternate left and right, and keep their heading (stored in a WeakMap, so the sim is never written).
  - Alpha is 0.85, eased to 0.6 in a dense crowd. Depth is RIBBON_DEPTH+1, below halos, pickups and numbers.
- `ribbons.js` `addTrailSoft`: a soft ribbon with no core and no segment longer than 21 u (this removes the old line web).
  - SOFT_W 1.2, SOFT_A 0.2.
  - `softNear` fades it to 0.4 inside 0.7-1.1 of the near-hero radius.
- `RunScene.js`:
  - drawWolfA uses wolfSkin.
  - The old fx gold circles and frost strokes stay only for `?summons=0`.
  - Echo branch: the hollow wolf rises 4 u out of the prey and gives off 4 pale motes when it spawns.
  - Light Trails wolves no longer add W2 spirit ribbons. Those ribbons were the long straight lines.
  - The paw layer is cleared when ribbons are off and on run reset.
- Tests: `tests/summon-s2.test.mjs` is new. Atlas and wolf tests are updated. Full `npm test` was 966/966 green before the last two small RunScene fixes (paw clear on ribbons off and on reset; these were not re-run).
- Harness:
  - `scripts/s2-wolf.mjs` has shots, coverage, atlas and depth commands. Coverage is the pixel diff of a frozen frame, flicker-rejected, inside 0.2 screen-height of the hero.
  - `scripts/s1-wolf.mjs` takes GRANT and NOSHADE env.
  - `scripts/pace.mjs` takes a GRANT env.

## Measured so far (headless, dist builds in the agent scratchpad)
- Light Trails trail-only coverage near the hero, High, N=12, after the near-hero fade:
  - desk 5.2% mean / 11.6% max.
  - land 5.2 / 9.6.
  - port 4.1 / 6.1.
  - TODAY's trail (pre-S2): desk 15.1% mean / 27.4% max (N=8), and 21.8% in an earlier N=3 run.
  - Cap is 15%: passes.
  - Paws alone are about 3% mean.
- Contrast (s1-wolf WL6 rule, desk+land, 0:30 / 4:00 / 11:30, High+Low, 3 grounds):
  - Legion and Light Trails wolves: median 3.4-6.7 in every cell; gap to the Fell Wolf 35+ L* in every colour-blind sim. Pass.
  - Alpha run INCLUDED the half-alpha shades in the median. High: 3.2-3.4 at night, 2.66-2.74 by day. Low: 2.1-2.8, with a gap of 12-18 L* (that gap is the shades).
  - The NOSHADE (Alpha-only) re-run was started and stopped: NOT measured.
- Sweeps: the scripts/sweep.mjs module graph (17 modules) imports no changed file, so sims are byte-identical by construction.
  - The pristine-worktree before/after sweep run was stopped. The worktree is at the scratchpad `wt` folder. Remove it with `git worktree remove --force <path>` and then `git worktree prune`.
  - Note: another agent changed src/sim and data mid-session, so the first pre/post compare in the main tree was invalid.

## Not done / next steps
1. Re-run `npm test` and `npm run build`.
2. Alpha contrast with `NOSHADE=1`. If the Alpha is below 3:1 by day on High, lift it (the bloom self-light copy is already applied).
   - Decide on the shades: today they are 0.5 alpha, which gives Low an L* gap of about 14 vs the Fell Wolf. Option: 0.65.
3. Friendly coverage total, wolves vs today (gate: <= today + 5 pts) for base/alpha/legion/trails on desk/land/port. Run cells sequentially; Chrome relaunch failed under load. Desk pre-S2 values are in hand (allMean 28-42%, very noisy); new values not yet measured.
4. Worktree sweeps wren/elias 24, before vs after the patch.
5. Screenshots to docs/screenshots/summons/: 1280x720 / 844x390@2x / 390x844@2x, day + night (`node scripts/s2-wolf.mjs shots`), plus the pup check.
6. S1 + S2 perf with pace.mjs on a QUIET machine. Pairs to measure:
   - High: summons on vs `FLAGS=summons=0`, 4 pairs.
   - Med: 2 pairs.
   - Light Trails pre vs new: GRANT=`ghost_wolves:count=5,speed=5,power=5:phantom_stampede`.
   - Budget: +0.5 ms High, +0.3 ms Med/Low.
7. Bake time: wolfMs was 416 ms wall / 265 ms main thread headless (35 frames, up from S1's 110-155 ms). This is a WEAK SPOT. Options: split the bake (evolution frames lazily on first evolution) or measure on a real GPU and phone.
8. Append S2 BUILT to docs/LOCKED.md and docs/QUEUE.md. Then merge to dev with an explicit git add.
9. Delete the temp Chrome profiles: `%TEMP%\hl-s1-*`, `hl-s2-*`, `hl-pace-*`.

Security: no new deps; the SVG is self-contained (tested); there is no untrusted input. Fit: same creature + gold rim + one signature change per lock; gold only on evolved units.
