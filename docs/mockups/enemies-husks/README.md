# Enemies: HUSKS options round (static mock-ups, not game code)

Matt picked Take A "Husks" (docs/LOCKED.md 2026-10-18 ENEMY BESTIARY LOOK). This round gives every piece THREE genuinely different Husks designs (A recommended). Design + decisions: docs/design/enemies-husks-options.md. Open `index.html` for the gallery. Nothing here is locked; no game code changed.

| File | What |
|---|---|
| `00-overview.png` | all 27 options (9 pieces x A/B/C) at ONE honest scale (2x true desktop), 30 px black silhouettes, 1:1 day + night, Wren/Elias at 2x for reference, the mask rules |
| `01-fell-wolf.png` ... `09-treant-hint.png` | one sheet per piece (send as a single image): A/B/C large side by side with story, silhouette hook, personality/animation, mask, risk; true-size day/night/silhouette insets; A at TRUE size on 4 real-build frames next to Wren and Elias (desktop night, desktop day x2, phone night); A walk x4, tell, hurt, death x3 (big and 1:1); bake/atlas cost, tier caps, rig plan |
| `w1..w4-*.png` | the whole recommended (all-A) roster at true size on the real build frames: desktop 0:30 dark start with Wren, 11:30 grey light with Elias, phone night + day |

Code (Node built-ins only, local headless Chrome via CDP, own PID only, no deps, no network, no AI tools):
`kit.mjs` (Husk painter on top of `../enemies-art2/paint.mjs`: bark mask with growth grain, chips, lichen, root straps, knot-hole sockets, sprout; ink socks; shared hurt/death beat; telegraph decals), `wolves.mjs` (Fell Wolf A/B/C + the shared quadruped rig), `alphas.mjs` (Grey Alpha A/B/C), `birds.mjs`, `crawlers.mjs`, `ranged.mjs`, `bulbs.mjs`, `chargers.mjs`, `bigs.mjs` (chest + Treant hint), `roster.mjs` (all text + scale + bake inputs), `sheets.mjs` (pages), `build.mjs` (`node build.mjs [overview|pieces|world] [pieceKey]`), `test.mjs` (one-creature iteration harness).

True size rule (same as rounds 1-2): desktop 2.34 px per world unit (`DESK_K` = 2.34/4 px per design unit), phone 1.3 css px per world unit. Real-build plates: `../enemies-sheet/plates/`. Wolf ~52 px long on desktop (Matt: ~hero-sized).

Honest limits: static poses (no live motion), night look is an SVG colour filter (tells are darkened with the body here; in the build they draw above the vignette), code-drawn texture is approximate, side views only (no turnaround), boss is a hint only.
