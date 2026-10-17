# Enemies sheet #4 (static mock-ups, not game code)

Design: docs/design/enemies-v1.md. Research: docs/research/37-enemy-design.md. Code-drawn in Hollowlight Style v1 (L2 tinted outline + H2 soft gradient/rim + P1 chibi) with the style-lab engine (imported, never edited). No deps, no network, system fonts.

| File | What |
|---|---|
| `es1-reworks-options.png` | Fell Wolf, Grave Crow, Root Crawler: 3 looks each (A recommended). Per card: big day, big night, true size desktop + phone (day top, night bottom), black silhouette |
| `es2-new-types-options.png` | Thornspitter (ranged), Blightbulb (area denial), slot 3 (Bramble Hart charger / Moss Mourner support / Seed Mother spawner) |
| `es3-animation.png` | recommended picks: walk x4, TELL, attack, hurt, death x2, corruption bloom; personality notes |
| `es4-night-eyes.png` | eye constellations: outside the lantern (dim cold body + eyes), inside the pool (lit, eyes 0.5), true size desktop + phone |
| `es5-miniboss-chest-bloom.png` | miniboss options (Grey Alpha / Briar Mother / Pale Hart King), chest options (A inside the lock), corruption bloom options |
| `es6-world-desk-*.png` | REAL build plates (1280x720, High, enemies removed) with the recommended roster composited at TRUE scale (2.34 px per world unit): Wren + Elias, night 0:30 and first grey light 11:30; Grey Alpha countdown chip, hart lane, bulb ring, thorn, chest |
| `es7-world-phone-*.png` | same at phone landscape 844x390 @DPR2 (1.3 css px per world unit) |
| `plates/*.jpg` | the empty real-build plates (`plates.mjs`) |

Build: serve a build (`npx vite build --outDir X && npx vite preview --outDir X --port 4191`), `node plates.mjs`, then `node build.mjs [opts|anim|night|extras|world]` (local Chrome via CDP; own Chrome PID only).

Honest limits: static frames (no motion), night look approximated with an SVG filter (not the real shader/lightmap), phone portrait not shown (the installed app is landscape-locked; portrait browsers get ~1.56 px/unit, similar to landscape).
