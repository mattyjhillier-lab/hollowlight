# Summons art (design sheet #3): static mock-ups, not game code

Design + decisions: `docs/design/summons-art-v1.md`. Research: `docs/research/41-summons-art.md`. Nothing here is locked; no game code changed. Open `index.html` for the gallery.

| File | What |
|---|---|
| `00-audit.png` | the summons in the game TODAY: real build (HEAD 25efa05), every weapon + evolution via `?grant=`, 2x crops at the 0:30 dark start or 11:30 light, with a verdict per weapon |
| `01-ghost-wolf.png` ... `05-holy-orbit.png` | one sheet per weapon family (send as a single image): options A/B/C large with look, silhouette hook, animation, crowd/night read, perf, evolutions, cost, risk; insets at 1:1 night/day, black silhouettes at 30/20 px, evolved x2; option A at TRUE size on real build plates (desktop 1280x720 night + 11:30, phone 844x390 night, phone 390x844 day); A's three evolutions; a motion strip |
| `06-shared-fx.png` | shared FX options (A/B/C), spawn/despawn strips, verb-shaped hits, the gold-rim treatment, tier ladder + Calm, per-tier caps |
| `w1..w4-*.png` | the whole recommended (all-A) roster at true size: desktop night Wren (wolves, ravens, chain), desktop day Elias (orbit, bolts, a Judgment pillar), phone 844x390 @2x, phone 390x844 @2x |
| `plates/` | summon-free frames of the real build (same staging, weapons removed) used under the composites |

Code (Node built-ins only, local headless Chrome via CDP, own PID/port/temp profile, no deps, no network, no AI tools):
`spirits.mjs` (shared friendly painter on `../enemies-art2/paint.mjs`: tinted outline, warm rim, ember heart, gold-rim/hollow/flat filters; Ghost Wolf A/B/C), `ravens.mjs`, `more.mjs` (glyphs, lightning, orbit flames, shared FX), `roster.mjs` (all sheet text), `sheets.mjs` (pages), `build.mjs` (`node build.mjs [audit|fam|fx|world] [family]`; the audit page needs `AUD=<dir written by audit.mjs>`), `audit.mjs` (`node audit.mjs <outDir> <distDir>`: captures the current look + the plates from a build served on 127.0.0.1:4237), `test.mjs` (iteration harness).

True size: desktop 2.34 px per world unit, phone 1.3 css px per world unit (same as the Husk sheets); 4 design units = 1 world unit. Recommended scales: wolf x0.72 (~42 px), raven x0.85 (~30 px).

Honest limits: static poses; composites sit on frames without the summons' lightmap/grade interaction; summon positions are hand-placed (chain arcs schematic, not on real targets); the 11:30 plates show the HEAD boss bar (boss at 10:00 before the Treant re-lock); code-drawn texture is lighter than the Husk painter's; Wall of Wings spread ravens read a little like paper fans at 2x.
