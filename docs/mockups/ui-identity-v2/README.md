# Hollowlight UI identity round 2 mock-ups (static HTML proofs, NOT game code)
Sheet: docs/design/ui-identity-v2.md. Research: docs/research/34-ui-round2.md.
- TAKE 1 "Lantern Glass, Lit" = `t1-*` (recommended). TAKE 2 "Leadlight" = `t2-*`. TAKE 3 "Stitchwork" = `t3-*`.
- Screens: `kit` (kit sheet + drawn wordmark, 1280x720 only), `title`, `hero` (select), `levelup` (evolution / stat with "Something stirs" / NEW weapon + Blessings + Reroll/Banish), `pause`, `results` (locked one-screen layout, defeat).
- Sizes: 1280x720, 844x390 @2x, 390x844 @2x. Key hints are hidden on the phone frames (touch). The second card/blessing shows the hover/focus state.
- Backgrounds are REAL captures of the live dev build (`frames/bg-*.jpg`, HUD hidden; `frames/live-hud-*.png` with HUD). Regenerate: `node capture.mjs [baseUrl]` (default http://127.0.0.1:5173, own headless Chrome on port 9371).
- Hero portraits are crops of the APPROVED sheets (../wren-v2, ../elias-v2) standing in for the live rigs.
- Regenerate pictures: `node build.mjs [t1|t2|t3] [screen]` (own headless Chrome on port 9372, Node built-ins only). Source: lib.mjs (filters, textures, painted icons, lantern, drawn wordmarks, portraits), base.mjs (shared layout at 3 sizes), screens.mjs (markup + copy), t1/t2/t3.mjs (materials, ornaments, type).
- Fonts: T1 uses the shipped repo fonts (Hollowlight Chancery = renamed Fondamento subset, Alegreya Sans). T2 (Alegreya) and T3 (Fraunces) load from fonts.googleapis.com for these proofs only; nothing is downloaded into the repo. Both are SIL OFL with no Reserved Font Name (research 33).
- `measured.txt`: per frame overflow, text under 12 px, smallest tap target, scroll, fonts actually loaded. All 48 frames: no overflow, no text under 12 px, min target >= 44 px, no scroll.
- Contrast (WCAG ratio, key text on its own surface): T1 ink 11.3, muted 6.1, kicker 7.8, primary label 8.1, danger 6.4, evolution 9.2. T2 ink 12.0, muted 6.5, button 8.6, danger 5.4, primary 9.7. T3 ink 9.4, muted 5.2, kicker 7.3, evolution 7.0, primary 7.4, danger 6.0.
- The wobble/felt edges use live SVG displacement filters here; the build would bake them into static frame paths (see the sheet).
