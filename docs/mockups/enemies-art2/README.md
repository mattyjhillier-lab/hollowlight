# Enemies ART round 2: three bestiary takes (static mock-ups, not game code)

Design + decisions: docs/design/enemies-art-round2.md. Round 1 (rejected look; roles/behaviours still valid): docs/mockups/enemies-sheet/ + docs/design/enemies-v1.md.
Open `index.html` for the gallery. All art is code-drawn SVG (Hollowlight Style v1: L2 tinted outline, H2 soft gradient + COLD rim light, P1 chibi), rendered by local headless Chrome. No deps, no network at build time, no AI/GPU tools, system fonts.

| File | What |
|---|---|
| `00-diagnosis.png` | why the live enemies + round 1 read as generic, beside the Wren v2 bar (live crops from `live/`) |
| `a1-bestiary.png` `b1-` `c1-` | TAKE A HUSKS / B WICKERKIN / C SNUFFED: 9 pieces each (Fell Wolf, Grave Crow, Root Crawler roles, ranged, area denial, charger, miniboss, Elder Treant hint, chest) at large detail + true size day/night + black silhouette + phone + hook + moves |
| `a2-motion.png` `b2-` `c2-` | walk x4, TELL, HURT, DEATH x3 per creature |
| `a3..a6`, `b3..b6`, `c3..c6` | the roster at TRUE size on the REAL build frames: desktop 1280x720 night 0:30 (Wren) + 11:30 grey light (Elias), phone 844x390 @2x night + day |
| `99-compare.png` | the three takes side by side at 1:1 on real ground, day + night, 30 px silhouettes |
| `live/` | current live-build captures (dev server, `live.mjs`) used for the diagnosis |

Code: `paint.mjs` (premium part painter: tinted outline, gradient, soft form shadow, cold rim, clipped texture, grain, gloss; eyes WL6b-style; night/hurt/silhouette filters), `takeA*.mjs` `takeB*.mjs` `takeC*.mjs` (one vector definition per creature; state `{ph, tele, hurt, die}`; returns `{b: body, e: eyes}` so eyes stay above the night), `roster.mjs` (names, stories, hooks, game scale), `sheets.mjs` (pages), `build.mjs` (`node build.mjs [diag|best|motion|world|compare] [A|B|C]`), `test.mjs` (one-creature iteration harness), `live.mjs` (captures the dev server; own Chrome PID only).

True size rule (same as round 1): desktop 2.34 px per world unit (DESK_K = 2.34/4 px per design unit), phone 1.3 css px per world unit. World pages composite onto the empty real-build plates from round 1 (`../enemies-sheet/plates/`).

Honest limits: static frames (motion is 4 poses), night look approximated with an SVG colour filter + outline rim (not the real shader/lightmap/eye caps), boss/treant shown only as a family hint, code-drawn texture is approximate (tick strokes + noise), colour gaps in the design doc are estimates from plate samples (re-measure with the WL6d harness in the build).
