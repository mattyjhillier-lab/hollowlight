# Handoff: EN6-EN9 Branch-Mane miniboss + Lantern Reliquary chest (WIP, branch wip/en6, 2026-10-22)

Safe-stop on Matt's shutdown. NOT merged to dev. Nothing appended to docs/LOCKED.md / docs/QUEUE.md yet.

## Done (built, unit-tested)
- SIM: `src/sim/enemyai.js` kind `alpha` (howl every 12 s, first 3 s, 0.6 s pose, 4 wolves / 6 after 50% hp, cap 8 called alive; 0.7 s line-charge tell, x4 for 0.7 s, 14 x dmgScale, cd 7, phase-2 repeat once; leash >500 u lopes x2). `Sim.js`: schedule from `chapters.json minis` (3:20 / 7:00 / 11:30, hp 700/1600/3200 fixed x tier enemyHp), countdown `miniSoon` (30 s), control immune (`ai.immune 'all'`), never recycled, no echo wolves, drops heart + chest (no gem), chest tiers 55/40/5, 20/60/20, 0/50/50 + pity (never two Large), walk-onto open: floor (heal 30%, XP 0.5 level, 25 gold) + Medium Blessing 1 of 3 + Large free stat rank 1 of 3 (run-start offer path, pending untouched, never an evolution card). Boss arrival: live mane crumbles, unopened chest moved inside the Root Ring. Counters: minis, chests, chestTiers, miniLog.
- TIERS: `tiers.js` knobs miniHowl / miniExtra / chestLarge (validated; Twilight must be 0). Deep Dusk +1 howl wolf, Large +10; Long Night +1 howl wolf, 4th mane at 8:40 (520 s), Large +20.
- ART/RENDER: `src/gfx/husk/husks3.js` maneA (ported alphaA) + reliquaryA (ported chestA); frames.js entry (tpw 3.5, atlas now ~4.06 MB GPU, mane 0.84 MB); amber eyes (paint.js AMBER); flat fallbacks 'mane' + 'chest' (sprites.js, nightlook EYE_DEFS); enemyrig howl frame; charge lane + threatens() for alpha; MUST_REACT branch_mane; `src/gfx/minibossview.js` (always-lit amber light, howl veins, death sprout+flower + 50 ms hit-stop, chest sprites by tier, open beat, reliquary bake); RunScene: only small hooks (import, pool, MiniView create/update, bake, chest skip in pickup loop, mini never far-tinted).
- HUD/UI: hud.js bar reused for the mane (one notch 50%), 30 s chip 'The Branch-Mane stirs 0:12'; hud.css 3 rules; cardsui START_COPY chestBless/chestStat; app.js events (arrival banner, toasts, MiniView events).
- BOT: scripts/bot.mjs alpha dodge, walks to chests, chest choices not counted as level-ups, NO_MINI=1 / NO_CHEST=1 ablations.
- TESTS: tests/en6789.test.mjs (12) + updates to en345/dr3/husks/nightlook. Full suite last run: all green except known load flakes (R06 parse-time, T1/T2 timing). Build OK.
- SHOTS: docs/screenshots/minibosses/ (scripts/mini-shots.mjs world): desk/land/port at night 3:20 + day 11:30; walk, charge tell, howl, chests, open, choice screens, chip. Not yet reviewed by eye (only the first walk shot checked: bar + notch fine).

## Half-done / not done
- SWEEPS (96 seeds, starter, Blessings on, dodge on, NO_MINI=1 baseline): wren 28/24% random/FOCUS, elias 18/27%; deaths <5:00 wren 8/9, elias 2/2. WITH minis: the run was still going at shutdown (results would land in the scratchpad, lost): RE-RUN `node <par.mjs> mini-random 96` equivalent (bot + NO_MINI baseline vs default), plus NO_CHEST ablation.
- Perf pace.mjs (one mane + chest on 350 enemies vs HEAD worktree), DR gate re-measure (dr-verify with a mane), contrast (wl6-measure TYPES=branch_mane): NOT run.
- docs/LOCKED.md EN6-EN9 BUILT rows + docs/QUEUE.md: NOT written.
- Commit only covers my hunks of RunScene.js (S2's wolf edits in the same file left unstaged on dev).

## Defaults taken (not locked; Matt may override)
- Chest floor amounts: XP = 50% of the level (= Soul Surge card), gold 25 (= Grave Coins card); heal 30% locked.
- Miniboss xp 0 / gold 0 (the chest carries the reward); first charge 4.5-5.5 s after arrival; charge range 200 u; tier hp uses enemyHp (not bossHp); 4th Long Night mane takes #2's hp/odds; 8:40 sits only 20 s from the 9:00 swarm (tier sheet said >= 30 s: flag to Matt).
- Baked frames on every tier (no live part rig on Med/High as the cost table suggested).
- Chip/banner copy: 'The Branch-Mane stirs', 'The Branch-Mane howls / the old leader of the rival pack'.

## Next step
1. Re-run sweeps (with/without minis, NO_CHEST), compare to the band; 2. review the shots by eye; 3. pace + DR + contrast; 4. LOCKED/QUEUE rows; 5. merge wip/en6 into dev.
