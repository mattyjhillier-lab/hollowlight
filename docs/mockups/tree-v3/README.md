# Skill tree redesign mockups (tree-v3)

Static pictures to help Matt choose a direction. Options come from docs/research/33-skill-tree-designs.md.
Comparison: `today-for-comparison.png` is the current Lantern Web (copy of docs/screenshots/tree/desk-far.png).

## Option A: "Restore the Hollow" (directions D5/D1)
The tree becomes a sky that goes from grey to colour as you play. Five big landmark constellations, one "wake me" star each.
- `A-restored-sky-first-open.png` new save: grey sky, warm hub lantern, faint animal silhouettes, glowing threads, named goals, a free first lantern, "Next lights".
- `A-restored-sky-later.png` same screen later: colour back (teal wolves, rose ravens, amber bolts, gold orbit), lit emblems, 47% restored.
- `A-unlock-moment.png` just after buying Raven Flock: light pulse down the thread, big name, "What changes in your next run".
- `A-phone-390x844.png` first-open on a phone, with a bottom "Next lights" sheet.

## Option B: "Lantern Village" (direction D3)
- `B-lantern-village.png` cosy night village round one big lantern. Each weapon is a building (Wolf Den, Raven Roost, Orbit Chapel, Spark Tower, Storm Forge) plus Library and Satchel. Lit = awake, grey = still asleep. Signboard lists the next 3 goals.

## Option C: "Fewer, bigger" (direction D2)
- `C-fewer-bigger.png` 14 large picture-medallions in a tidy web (hub, 5 weapons, 5 evolutions, 3 utilities) with small bonus beads as satellites. A detail card shows the selected node.

## Illustrative only / caveats
- All names, costs, text and the 47% / progress numbers are made up; real unlock rules, prices and which weapons start unlocked are NOT decided here (for example the start weapons would not cost gold).
- Evolution names other than Light Trails / Vesper Tide are placeholders; hidden evolution recipes stay hidden.
- Static pictures drawn by code (HTML + SVG, sources in `src/`), not the real game: no pan or zoom, real build and performance may differ.
- Animals/buildings are simple code-drawn shapes; final art would be refined. The B village is the most work to build.
- Fonts are the game's own (display + Alegreya Sans); colours follow the Warm Lantern palette.

## Round 2: D5 "Restore the Hollow", zoomed single web (files `R2-*.png`, sources `src/R2-gen.py` + `R2-shot.mjs`)
- `R2-web-zoomed-first-open.png`, `R2-web-zoomed-midgame.png`, `R2-banner-hover.png`, `R2-phone-390x844.png`.
- Changed vs round 1: one dense zoomed web with three tiers (large medallions: weapons, heroes Elias/Lucinda, Hushbell Hamlet chapter, Deep Dusk / Long Night; mid diamonds; tiny filler dots as long paths); central lantern hub with threads to every landmark; progress rings; "Next lights" x3; hero portrait panel (Wren, Play / Almanac / Goals / Back) so the tree feels part of home; warmer, brighter sky from frame one; hover banner plus condition tile with an enemy portrait (Elder Treant glyph) and place/difficulty; currency panel; a dim "Far Hollow" ring at the edge of the midgame view; phone layout with header strip and bottom buttons.
- Illustrative only: every name, cost, count, % and condition (Lucinda, Hushbell, nights, Far Hollow), the Elias/Lucinda unlock rules, node positions, and which nodes are tiny filler vs diamonds. Weapon role colours follow src/data/weapons.json for wolves/ravens; bolts/chain/orbit colours are guesses. Static code-drawn art, no pan/zoom; icons are rough placeholders.
- Learned from Matt's reference (inspiration only): landmarks must dominate the eye; heroes and maps belong in the tree; one-line name banner plus a cost/condition tile; filler dots read as a path to something; a dim far region shows there is more to reach; the hero beside the web.
- NOT copied: their frame, skulls, spiderweb threads, red torn banner, art, text, names or layout. Ours stays lantern-lit sky, threads of light, brass-cream banner.

## Round 3 (2026-11-02, illustrative only)
- R3-bgA-misty-forest-dusk.png: darker dusk base, forest silhouette layers, mist, moon haze, vignette.
- R3-bgB-carved-stone-night.png: carved stone wall with runic rings that glow gold where lit, moon haze, vignette.
- R3-hero-panel-variants.png: left panel as (A) Wren + spirit wolf, (B) Lucinda + Ophimber, (C) interim hero-only with an empty glow spot; hero swap row under each.
- R3-scale-zoom-levels.png: the same grown web (~300 nodes) at FAR (landmarks + region names), MID, NEAR zoom.
- Caveats: placeholder art; names, costs, conditions invented; backgrounds are code-drawn, a real build would refine them.
