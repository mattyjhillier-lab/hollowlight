# Boss sheet #7: THE ELDER TREANT (static mock-ups, not game code)

Design + decisions: docs/design/boss-treant-v1.md. Research: docs/research/40-boss-fights.md. Nothing here is locked; no game code changed. Open `index.html` for the gallery.

| File | What |
|---|---|
| `01-art-takes.png` | three art takes (A The First Husk, Elder / B The Bowed Ancient / C The Lantern-Keeper), big + TRUE SIZE beside Wren on the real desktop plate (14:00 warm wash) |
| `02-phases-tells-death.png` | Take A: P1 / P2 / P3 looks, three tell poses (slam, sweep, thorn), the death in 6 steps (kneel, mask cracks + falls off, leaf, colour runs down), seed pod -> sapling Husk |
| `03-arena-options.png` | arena A Root Ring / B fixed-camera clearing / C shrinking thorn hedge drawn to scale with the real view rectangles (desktop 533x300, phone 620x287, portrait 250x541 world units) + kiting table |
| `04-arrival-desktop-1280x720.png` | arrival A at 14:00: ring tell, roots rising, Husks crumbling to ash, gems flying in, Treant rising, banner, held 14:00 clock |
| `05-moves.png` | the six moves with their telegraphs at desktop true size x0.8 (full strength only when it reaches the hero, else 28%) |
| `06-fight-desktop-1280x720.png` | P2 fight frame, true size: vine sweep at Wren, far eruption faint, saplings, boss bar |
| `07-fight-phone-landscape-844x390.png` | (@2x) P3 root lanes, true phone size (1.3 px/u), touch controls |
| `08-fight-phone-portrait-390x844.png` | (@2x) P1 eruption + seed toss; painted ground (no portrait plate exists) |
| `09-victory-flood.png` | victory A in 6 timed frames (0.0 / 1.2 / 2.6 / 3.4 / 4.6 / 6.0 s) + B and C thumbnails |
| `10-victory-key-desktop-1280x720.png` | victory A key frame at 4.6 s, desktop true size |
| `11-defeat-desktop-1280x720.png` | defeat at the boss: grey beat, dimmed lantern, recap 'Struck down by the Elder Treant's Vine Sweep, 1:21 into the fight' + boss progress line |

Code (Node built-ins only, local headless Chrome via CDP on its own PID, no deps, no network, no AI tools): `treant.mjs` (boss painter on top of `../enemies-husks/kit.mjs`: First Husk mask, socket eyes = baked socket + socket-shaped amber glow pooled low, three takes, phases, tell poses, death, seed pod/sapling), `scenes.mjs` (arena rings, DR2-style decals, thorns, adds, HUD bits, victory flood helpers), `pages.mjs` + `pages2.mjs` (pages), `build.mjs` (`node build.mjs [page-name ...]`).

True-size rule (same as the enemy sheets): desktop 2.34 css px per world unit, phone 1.3 (4 du = 1 world unit). Real-build plates: `../enemies-sheet/plates/` (11:30 day plates with a warm wash standing in for 14:00 light; the plates carry their own HUD, the run timer is covered by the held 14:00 pill).

Honest limits: static poses; the victory flood tints the whole plate (ground and HUD together), the real flood works on the ground/life map only; phone portrait is painted ground at 1.3 px/u (the real portrait zoom is 1.56); the boss trunk/arms are simpler than the Wren/Elias sheets (face and eyes are at the bar); telegraph decals are drawn over the hero as in the build (DR2 tells sit above the vignette).
