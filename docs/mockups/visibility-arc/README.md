# W6 Visibility + Vibrancy Arc mock-ups (design only)

Design sheet: docs/design/visibility-arc-v1.md. Research: docs/research/36-visibility-arc.md.

How these were made: the REAL dev build (snapshot of dist/index.html built 2026-10-17 14:47) runs in headless Chrome; `capture.mjs` injects a runtime debug override (ambient colour, Low tint, lantern radius, far-enemy tint, eye layer, cool rim, saturation, dawn wash) from the option tables in `ARCS`. Nothing in `src/` was changed. Own Chrome process, own ports (9481 / 4199), closes only what it opened.

Open `index.html` directly in a browser, or run `node capture.mjs docs/mockups/visibility-arc x sheets` to rebuild index.html and re-render the PNG sheets.

| File | What |
|---|---|
| index.html | everything on one page: arc chart, frames, eyes crops, contrast tables |
| sheet-1-arc.png | ambient brightness over the run: A / B / C vs current build |
| sheet-2-optionA-wren.png, sheet-3-optionA-elias.png | option A at 0:30, 4:00, 8:00, 11:30, 14:30, desktop 1280x720 |
| sheet-4-current.png | current build ARC at the same 5 moments |
| sheet-5-phones.png | option A, Wren phone landscape 844x390 + Elias portrait 390x844 (@2x), 5 moments |
| sheet-6-options.png | A / B / C at 0:30 and 8:00 |
| sheet-7-tiers.png | option A at 0:30 on High / Med / Low |
| sheet-8-eyes.png | 'eyes in the dark' vs the lantern pool, current / A / B / C |
| sheet-9-contrast.png | measured contrast tables |
| frames/*.jpg | raw true-size frames (`<option>-<time>-<hero>-<view>-<tier>.jpg`; desk = 1280x720, land = 844x390@2x, port = 390x844@2x) |
| contrast/eyes-*.jpg, contrast.csv, contrast.json | eyes crops source frames (0:30 High) and the harness numbers (the harness writes full PNGs per cell to its own out dir; only these 4 are kept here) |
| capture.mjs | the harness: `node capture.mjs <distDir> <outDir> [contrast|frames|all|sheets]` (env OPTS, TS, TIERS, ONLY narrow a run) |

Honest notes:
- Saturation in the mock is a whole-camera colour matrix (it touches enemies too); the design applies vibrancy to restored layers only.
- Eyes are drawn only outside the lantern pool here; the design adds an inside eye floor. Rims are a scaled tint-fill copy (rough); the build uses baked outlines.
- Frames use god mode + injected enemies (seed 3) and a stamped restored area that grows with the moment; HUD is the real HUD. JPEG q86 to keep the repo small.
- Contrast numbers: 1 frame per cell, Hollow ground only; noise about +-0.3 (ratio) / +-1.5 (delta L*).
