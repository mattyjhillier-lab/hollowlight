# Handoff: CX codex + celebrations (branch wip/cx, NOT merged into dev)

Safe-stop 2026-10-24 (Matt pausing). All code below is on `wip/cx`; nothing merged, no LOCKED/QUEUE BUILT rows yet.

## Done (built, tests green: 1119 pass, build OK)
- CX1 `src/meta/codex.js`: Almanac model derived from existing stats + tree; ENTRY_KEYS append-only bitsets; save fields `codex {v, read, told}` + `titles {got, pick}` added inside save v3 (no version bump, older saves read as v0 and are "adopted" = all current progress read + told, so no flood). Validation + hostile-input tests (`tests/codex.test.mjs`). Store `setCodex` / `setTitles`.
- CX2 `src/ui/codexui.js` + `codex.css` + copy `src/ui/codexcopy.js`: 4 tabs (Foes / Spirits / Hollowlighters / Nights + 4 lore pages), real Husk portraits via `src/gfx/husk/portrait.js` (same painters as the atlas, blob: img), silhouettes for unknown, staged pages at the Almanac node counts, keyboard (J, 1-4, Tab on item, arrows, Enter, Esc), SR names, 44 px, portrait sheet, Calm.
- CX3 entry points: title button + J (NEW dot), pause (read only, J), results link (+ bar fallback when the ledger row is dropped on short screens), tree "Open the Almanac" button on Almanac-cluster lanterns. Back returns to opener.
- CX4 `src/meta/celebrate.js` (pure queue: 1 big + 3 medium, order, told-once, defeat holds bigs for the title) + `src/ui/celebrateui.js` + `celebrate.css`; results ledger line; cues evo_<id> / tree_light / tree_whole via existing engine.
- CX5 big moment (skippable, Calm static) + title "While you were away" for held bigs + tree:wake cards in treescreen doBuy (max 3 per visit; tree sound unchanged).
- CX6 titles (9 fixed ids), title picker in the Almanac, chip title + ornament, title colour bands, hub lantern adds book total (never dims).
- CX7 riddles: 15 DRAFT lines in codexcopy (one stat each, test-checked). Full Almanac `bs_page` stays INERT (pending; also carries blessChoice which is not built) -> Matt decision.
- Screenshots: `docs/screenshots/codex/` (3 sizes, script `scripts/cx-shots.mjs`), viewed and matched to the mock-ups.
- Sweeps: `sweep.mjs wren 24` / `elias 24` byte-identical to dev (no sim/data files touched).

## Not yet done (next step, in order)
1. `node scripts/pace.mjs` no-regression check; `npm audit` (no new deps added).
2. Re-run `node scripts/cx-shots.mjs docs/screenshots/codex` once after the last CSS tweak (landscape title 4-col row font fix) and view cx6-title-land.
3. Quick review of keyboard Space inside the Almanac and the pause->Almanac->Esc path in a real browser (shots log said paused stays true, codex closes).
4. Append BUILT rows to docs/LOCKED.md + docs/QUEUE.md; merge origin/dev into wip/cx, rerun tests, merge into dev, push.

## Defaults taken (Matt may override)
- Fell Wolf Habits page opens at 1,000 kills (bs_wolf1 is gold-only since T6).
- Crow / Crawler Tells pages stay out of the book while their tree nodes are pending.
- Hollow marks "seen" = kinds of the harder nights walked once any marked foe was slain (no per-kind stat).
- Hollowlighters tab lists only heroes in data (2), not the planned 10.
- Medium cards auto-advance after 3.5 s, big after 4.5 s; any key / tap continues, Esc skips all.
- Per-weapon titles (Friend of Wolves etc.) added beside the sheet's tab/book titles.

## Matt decisions pending
- Read the 15 riddle lines; then decide whether Full Almanac goes live (it also needs the blessChoice perk built, which touches the sim).
- Foe / page / lore copy is draft in the Hollowlight voice.
