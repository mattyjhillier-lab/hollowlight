# Tree screen + timeline: independent review (2026-10-21)

Scope: `docs/mockups/tree-screen/` (prototype source + all `ts-*.png`), `scripts/tree-timeline.mjs` (re-run: default, `--live`, `--nodes 1000`, seed 7), skill-tree-v2.md Appendix D, LOCKED rows TREE PULL / NODE STATE VISIBILITY / TOP PRIORITY / tree screen design 2026-10-21. Fresh eyes, design-only; no game code or locked doc touched.

Tags: **[TINY]** = small, safe, reversible prototype/doc/script change, no lock touched. **[MATT]** = taste call, scope, or touches a locked rule.

Re-run numbers matched Appendix D exactly (design tree done run 61, 25% unfinished at 100, dead-zone A 39.5% / B 36.5% of player-runs, all in runs 26-100, longest no-buy stretch median 23 / max 58; live tree done run 43, zero dead zones; 1000 nodes done run 116, 1.2% dead).

## Ranked findings

### 1. The "best next" pick will be the wrong node unless its rule is defined (locked choice 2)
The timeline's buyer, and any naive marker, picks *cheapest first*. That points at +2% max health (Warm Embers) while a weapon wake or evolution socket is two runs away. It contradicts the impact rule ("every purchase changes how a run plays") and fights the pinned goals.
**Fix [TINY to spec, MATT to confirm order]:** best next = first match in: (a) the next affordable node ON THE PATH to a pinned goal; (b) affordable option/verb nodes (weapon wake, evolution socket, tier gate, keystone, reroll/banish); (c) the node that completes a nearly-finished constellation; (d) cheapest stat bead. Show it at every zoom level (incl. far: a marker on the emblem) and as an edge-of-screen arrow when off-screen; one line of "why" in the panel ("Opens a new evolution").

### 2. Run-1 flood, then a cliff: the curve is front-loaded and back-empty
Run 1: 14 lightable, 6 buys; run 3: 24 lightable (preset shows "24 can light", the 1000 tree shows 251). When everything glows, nothing glows, so the "can light" ring loses meaning exactly when a new player most needs guidance. Then from ~run 38 the design tree has nothing to buy for a median 23 runs.
**Fix [MATT]:** Vampire-Survivors/Rogue-Legacy style price creep: each purchase raises the price of all remaining *stat beads* in that group by ~5-8% (options/gates keep flat prices). It trims the run-1 flood to ~3-5 buys, stretches the stat tail into runs 38-60, and is itself a gold sink that never "runs out". Re-run the timeline with it before choosing; target 3-6 buys after run 1, a buy every 1-2 runs to run ~60.
**Fix [TINY]:** cap the "can light" ray crown to the current constellation + best next when the count is > ~12; elsewhere show a quiet dot. The counter badge stays.

### 3. Cosmetic gold sink (locked choice 1) opens too late and competes with completion rewards
- The lock says "once the tree is bought out", but gold has nothing to buy from ~run 38 while condition-only nodes (Three Dawns, Treant x15, Fifth Hook) are still open (the tree is "done" only at run 61, 25% never). So the dead zone the sink was meant to fix stays for ~23 runs.
- Completion rewards already award cosmetics; if gold also buys cosmetics, earned titles feel cheap.
- 4,000 gold/run x 50+ runs (~200k) needs a large catalogue of code-drawn art (scope).
**Fix [MATT]:** open the sink when "no gold-priced node is left" (not "tree complete"); keep earned cosmetics (emblems/titles) separate and un-buyable; make the gold sink something cheap to produce and endless: lantern/trail tints and hub-lantern decorations at rising prices, or (better, with finding 2) price creep so the sink is rarely needed at launch.

### 4. Model assumptions flatter the early game; re-calibrate before trusting run numbers
- Death time is uniform 4:30-14:00 for every run, independent of skill: a first-time human likely dies at 3-6 min. Run-1 gold (median 1,575) is probably high, so the "first buy run 1" claim is fragile.
- Win odds at run 1 are ~25%: that is the bot's no-tree target, not a first-time human's.
- Gold uses human x0.75 but kills x0.85, so condition goals move relatively faster than gold for humans than for the bot.
- Income is from 2026-10-18 (before boss HP 36000): win gold may drop (Appendix D open item e).
- Growth mode: conditions are trivial and a chapter opens every 3 clears, so run 116 is a gold-pacing floor, not a forecast.
- Savers/greedy buyers: no player model ignores the tree for a few runs (a common human pattern), which is where a banked-gold "big buy" moment should feel good.
**Fix [TINY]:** make death time skill-dependent (e.g. `270 + 570*skill*R()`, floor 180 s), add a `--novice` profile, and re-run with gates-pace income after boss HP 36000; report run-1 gold and buys again.

### 5. 1000 nodes split a fixed budget into dust (impact rule)
At 1000 nodes with the per-weapon pool fixed at 3.2 PE and +1.5 PE per chapter, a typical synthetic bead is ~0.02 PE: no player will feel it. That breaks "each purchase changes how a run plays or feels, not just +1%".
**Fix [MATT, design rule]:** each new constellation must be mostly options/verbs (new evolution, ability variant, behaviour knot, cosmetic emblem) with at most ~30% stat beads; the scaffold (C.11) should enforce an options share, like the 60% region rule, and refuse a cluster whose beads are all stat.

### 6. Six staggered slots (locked choice 3): good fix, three gaps
`ts-desk-1000-staggered.png`: compact web (r ~4,800 vs ~11,000), but (a) far-zoom labels and "0/15 . N can light" lines collide everywhere, (b) a dark wedge artefact on the right (likely the background "remembers" sector/fog mask), (c) emblems are one glowing dot each, so 50 constellations read as identical.
**Fix [TINY]:** at far zoom show only the chapter band name + one count per band; constellation names only at mid. Investigate the wedge. **[MATT-adjacent, already in the lock]:** add a test that launch node positions are byte-identical before/after the stagger rule (the lock says "today's tree unaffected"; prove it), and that slot angles are a permanent function of slot index.

### 7. First-time player confusion: too many words for "locked"
States a new player meets: can light now / not enough yet / not yet woken / locked / spirit asleep / fogged / NEW, plus three currencies (gold, shards, Dawnglass). Red Thread (`ts-phl-selected.png`) is "Locked" AND "To wake it: slay 2,500", two gates in one panel. The legend lives only in the prototype gear drawer; a new save (`ts-desk-new.png`) opens on 0 lightable, three empty "150 gold short" bars and a sea of padlocks and "???".
**Fix [TINY]:** (a) one "?" button on the toolbar opening the legend; (b) the panel lists gates as a numbered checklist ("1. Light Hunter's Scent  2. Slay 2,500 Fell Wolf 1,749/2,500"); (c) empty-save first open: hide the goal bars, show one coach line ("Finish a run to earn gold, then light your first lantern") and auto-fly to the hub. **[MATT]:** merge "spirit asleep" into "locked" in player-facing words (keep the dashed look).

### 8. Goal tracker covers the map and suggests grind, not rewards
Desktop: the panel hides the Ghost Wolves label. Phone portrait: ~35% of the screen. Suggested goals are all condition grinds ("Slay 20,000 Grave Crow"), never the next affordable or near-affordable buy, and are not weighted by payoff.
**Fix [TINY]:** collapsed by default on every size after the first visit (one line: "Next: Spirit Bolts 81%"); suggestions mix 1 gold goal (best next, finding 1) + 2 conditions ordered by estimated runs left (the panel already computes "about N runs"); show the REWARD, not only the task ("Wakes Spirit Bolts"). PoE-style: pinning a far node highlights the path and shows the total gold for the path.

### 9. Thread spaghetti and label overlaps
`ts-desk-overview/new`: hub-ring threads cross the whole map; the hub itself is a criss-cross star; labels overlap nodes and dashed rings ("The Alpha" over Red Thread; "2/16 . 2 can light" under nodes in portrait; top-bar pills over map labels in landscape).
**Fix [TINY]:** draw only owned + available edges at full alpha, others at ~0.15 and only at mid/near; order hub-ring edges by angle so they do not cross; add a 6 px label-to-node collision pass at mid/near (the far pass already exists); give the toolbar a solid band behind it on phone.

### 10. Accessibility
- Good: affordable uses a ray crown (shape), locked a padlock, asleep a dash, reduced motion respected, tap radius min 24 px (48 px target).
- Gaps: phone-landscape `.btn` 40 px and goals toggle 32 px (< 44); nearest-wins tap picks the wrong bead when 2 beads sit inside one 48 px circle at mid zoom; fog text "A part of the Hollow..." at 55% alpha of mute is ~3:1 contrast (< 4.5 for 12 px); teal means both "not yet woken" progress and goal bars and NEW; canvas is aria-hidden with no node focus list (Appendix D open d); portrait badge shows "24" with no words.
**Fix [TINY]:** 44 px minimums; if 2+ nodes fall within the hit radius, zoom in on the cluster instead of guessing; fog text alpha >= 0.8; "24 can light" kept in portrait (shorten other pills); give NEW a shape (flag) not only teal (it has one; keep the text); keep d) for T4.

### 11. What comparable games do that we are not yet using
- Vampire Survivors Power Ups (OFFICIAL in-game behaviour): flat list, every buy raises later prices, free full refund. Price creep = finding 2; a cheap refund ("respec") lowers fear of wrong picks (check C.7 respec cost is low early).
- Path of Exile / Grim Dawn webs (COMMUNITY): plan a path to a far node with total cost; search highlights; Grim Dawn constellations give a named bonus on completion (already have completion lighting; make the bonus visible on the emblem before completion).
- Spirit Hunters (COMMUNITY/OPINION, from Matt's reference): enemy-kill-gated nodes, which we have; its weak spot reported by players is grindy kill counts late, the same risk as "Slay 20,000": cap any single kill condition at ~5 runs of normal play at the chapter it belongs to.
- Hades Mirror (OPINION): fewer, bigger choices with visible alternatives; supports finding 5.

## Summary of the three just-locked choices
| Choice | Verdict | Main flaw | Fix |
|---|---|---|---|
| 1 Cosmetic gold sink | keep, amend | opens at "tree complete" but the gold dead zone starts ~23 runs earlier; competes with earned cosmetics; art scope | trigger on "no gold node left", earned cosmetics stay unbuyable, prefer price creep (MATT) |
| 2 Best-next marker | keep, specify | undefined rule; cheapest-first points at trivial stat beads | priority order in finding 1 (TINY spec) |
| 3 Six staggered slots | keep | far-zoom clutter, wedge artefact, launch positions unproven | band-level labels at far zoom, invariance test (TINY) |

## Suggested order
TINY now (prototype + script, no locks): 1 (spec), 2 (ray cap), 4, 6 (labels/test), 7 a-c, 8, 9, 10. Needs Matt: price creep (2), sink trigger (3), options share per constellation (5), "asleep" wording (7).
