# Design sheet #1: HUD + level-up cards + damage numbers + pickups (static mock-ups, NOT game code)

Brief: docs/research/28-hud-and-cards.md. Style locked: Hollowlight Style v1 (L2 tinted outline, H2 rim light, P1 chibi, W2 ground, lantern pool + glow trails), mood Warm Lantern. Only this folder was written. Self-contained SVG in local Chrome, no network, no fonts or images fetched (Georgia and Segoe UI Black are placeholders; the build ships a self-hosted OFL font). The battle frame reuses Wren v2 + pup, ghost wolves, ravens, Fell Wolves, root crawlers over the Hollow/restored split (60px hero desktop, 40px phone).

## Files (all PNG < 350KB)
| Per direction (A, B, C) | What |
|---|---|
| `hud-X-world-landscape.png` | in-run 1280x720 frame (shown 91% under the banner) with the full HUD, pickups (gems, heart, magnet), new-style damage numbers, boss-bar inset |
| `hud-X-phone.png` | phone landscape 844x390 + portrait 390x844 (@2x scenes), joystick zone, thumb reach, 44px tap boxes, notch/home-bar simulation, measured checks |
| `hud-X-cards.png` | level-up board: desktop (4 cards + 2 Blessings, the largest hand), phone landscape, phone portrait, wrapping rules |
| `hud-X-cards-desktop.png` | the same desktop level-up screen, one big picture |
| `hud-X-states.png` | low-HP frost, HP widget 100/50/18%, ability cooling/ready/used, level-up burst, pickup feedback, boss intro + bar |

| Shared | What |
|---|---|
| `hud-compare.png` | A, B, C in the same frame: full desktop, 1:1 desktop crop, 1:1 phone crop, measured screen-area %, one-line pros/cons |
| `hud-proof-1-actual-size.png` | 1:1 crops with 44px tap boxes, 60px/40px hero ruler, measured table (footprint, centre-50% use, smallest text, tap size, contrast) |
| `hud-proof-2-phone-2x.png` | phone crops at 2x DPR with the notch / island shaded |
| `hud-proof-3-colour-blind.png` | deuteranopia, protanopia, tritanopia, greyscale on HP, EVOLVE / stirs / Blessing cards, evolved tile |
| `hud-proof-4-damage-numbers.png` | sizes, swarm merge, variants (off / crits only / reduced motion), legibility on 4 grounds, rules |
| `hud-fixes-before-after.png` | the 7 current-build problems (real dev screenshots) vs the fix |

Regenerate: `node build.mjs [world|touch|cards|states|compare|proof|fixes] [A|B|C]` (about 3.5 min for everything; Node built-ins + local Chrome only). Modules: `kit.mjs` (tokens, emblems, lantern, thread, moon arc, tiles, ability, boss bar, frost, numbers), `dirA/B/C.mjs` (the three layouts), `cards.mjs`, `scenes.mjs`, `measure.mjs` (footprint and text-size measuring), the rest are page builders.

## The three directions
| | A LANTERN & THREAD | B HEARTH EDGE | C DAWN FRAME |
|---|---|---|---|
| Idea | Brass lantern plate: flame = HP, cream thread = XP with a level knot; moon arc to dawn | No chrome: thread along the top edge, HP as a flame ring at the hero's feet, weapons fade | One thin rim round the screen; lantern, moon notch, weapons and ability sit in it; frost creeps from the corners |
| HUD area (measured) desktop / landscape / portrait | 5.8% / 10.8% / 10.0% | 3.7% / 7.0% / 6.5% | 17.9% / 21.0% / 23.4% |
| Budget (research 28) | 12 / 14 / 16 | same | same: C is over on all three |
| Centre 50% x 50% used | 0% | 0.7% (the HP ring is on the hero) | 0% |
| Smallest numeral / word | 19.3px (phone 16.8) / 14px | 16px / 14px | 19.3px (phone 16) / 14px |
| Smallest tap target | 48px (ability 84-88) | same | same |
| Cream text vs plate | 9.0:1 on bright grass, 11.4:1 on Hollow | no plate: outline only (17.3:1 against the ink outline) | as A |
| Phone weapon strip | under the lantern (not under the joystick) | top-left, 30px, fades | under the lantern bracket |
| Build effort (our DOM + Phaser stack) | M | S for the HUD, M for the on-hero ring | L |
| Cards | same card design; plates with brass buttons | lighter, ghost buttons, no medallion ring | as A + warm top rail + rim-set buttons |

Measuring: each HUD is rendered alone on a transparent page and pixels with alpha >= 35% are counted; weapon strip faded is within 0.2% of these numbers. Contrast uses the WCAG formula on the real colours.

## Honest recommendation and ranking
1. **A, with two borrowings (recommended).** Closest to p1-world (which Matt liked), every element maps to an existing system (HP, timer, XP, 4 slots, ability), thumb zones are clean, ornament lives on one object (the lantern). It is the only one that keeps the HUD under budget while staying unmistakably Hollowlight. Borrow from B: Kills off the HUD and the weapon strip fades after about 8s (A phone landscape has the room to do it). Borrow from C: only the frost edge at low HP (no frame).
2. **B.** The calmest and most "restraint", and cheapest. But it has the weakest identity (no lantern plate) and HP legibility is its real risk: a 6px flame ring on a 40px hero in a swarm is the hardest thing on the sheet to read, it sits in the action centre, and "86" under the hero is only 16px. Good source of ideas (edge thread, fading weapons, the small moon + digits), not a base.
3. **C.** The boldest "gaming" frame and the best tie to The Hollow, but it breaks the budget: 18% of a desktop screen and 21-23% on phones, brackets sit where edge enemies arrive, the XP thread cannot fit the rim on phones (moves into the plate), and it is the one most likely to read as a generic brass fantasy-RPG frame, i.e. "too much at once". Keep as a later "cosmetic frame" option only if Matt wants more drama.

Combine: A layout + B's weapon fade and no Kills + C's frost edge + B's moon-track-in-pill on portrait (already in A portrait).

## Decisions needed from Matt (max 3, from research 28)
1. Direction: A (recommended), with the borrowings above?
2. Kills counter off the in-run HUD (shown on pause and results)? Recommend yes.
3. Weapon strip fades to ~40% after about 8s of no change (full again on rank-up, evolve or key/tap)? Recommend yes. Also confirm HUD is frost-only for now (no life-map colour on the HUD); revisit in the world sheet.

## Current-build problems and how they are fixed
`hud-fixes-before-after.png`: (1) cards without icons: icon medallion first, big number second; (2) Blessing row wrapped like an error: deliberate smaller quiet row; (3) EVOLVE/BLESSING badges clipped: ribbons sit inside the card; (4) weapon slots under the joystick: strip moves up under the lantern on phone; (5) no safe-area padding: every edge item uses max(12px, env(safe-area-inset-*)) (also needs `viewport-fit=cover`, UNVERIFIED in index.html); (6) red HP bar and gold-coloured Gold counter: flame HP, brass coin, gold only for evolutions and the dawn sun; (7) 11px ability name: icon + key chip, HUD words >= 14px, numerals >= 16px.

## Colour and shape rules shown
Gold: EVOLVE card, evolved weapon rim, dawn sun, and the 40% hairline on "Something stirs..." (a quiet edge, no badge, no glow). Cream: Blessings (quiet, smaller, own row). Red: only the boss bar and danger. HP flame is orange, never gold; low HP = flame shrinks to an ember + frost texture (shape and texture, not hue only). Heart is rose, magnet lilac, coin brass. EVOLVE vs stirs vs Blessing differ by word, outline shape and size (`hud-proof-3`).

## Weak spots, placeholders, unverified
- Fonts are system placeholders (Georgia, Segoe UI Black). Ship OFL fonts; the damage-number font must be baked to a bitmap font.
- Icons are quick Style v1 emblems; wolf and raven art in the cards reuses the creature drawings; the Blessing icons (boot, flame) are the weakest, generic glyphs. The wolf emblem still reads fox-like at 36px (pointy ears survive, the long muzzle does not): needs a redraw before build.
- The world behind the HUD is the shared placeholder frame (flat); the premium feel also depends on the world sheet (#2). No animation is shown, only frames.
- Frost is SVG noise here; the build would use one pre-baked image with an alpha tied to HP. No CSS filter or backdrop blur in-run.
- Colour-blind matrices are approximations. Orange flame and yellow gold collapse together under protan/deutan; they stay apart by place, shape and words.
- Damage-number merge timing (120ms, cap 24) is common practice, no source fetched: tune in play. Per-game HUD facts in research 28 are mostly OPINION.
- Self-critique: A's top-left and top-centre are both decorated (restraint check: the moon arc is the one piece to cut if it feels busy); the A thread is thin (7-8px) and is the least readable part; B/C phone landscape flag "read-only in centre" for B's ring (by design) only.
- Not shown: Elias in this frame, settings screens, pause, results (sheet #6), touch long-press for card descriptions on phone landscape (descriptions are hidden there; recommend long-press or a focused-card bar).

## Build chunks if A is approved (small, one at a time)
1. HUD skeleton: lantern plate, thread, timer, coin, pause, 4 weapon tiles, ability (S-M, DOM + inline SVG, safe-area, 16px numerals). 2. Cards: icon medallions, EVOLVE/stirs/NEW/Blessing treatments, wrapped layouts (M). 3. Damage numbers in canvas (M). 4. Frost edge, moon arc motion, weapon fade, level-up knot burst (S each).

Security check: nothing downloaded or installed; no dependency, network, CDN, external font or image; only existing project screenshots read (and embedded) for the before/after sheet; only docs/mockups/hud-sheet/ written. Fit check: all three directions use only existing systems and the locked recipe (gold reserved, red = danger, cream = Blessing, no backdrop blur in-run, life-map visual only); A fits best, C breaks the 12/14/16% footprint budget.
