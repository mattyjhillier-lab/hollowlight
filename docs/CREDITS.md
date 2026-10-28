# Credits: Wispwick: Spirits of the Dusk

Refreshed 2026-10-28 at final verification (LAUNCH-CHECKLIST item 23) against origin/dev c5b6ac3. Wispwick is the locked title (LOCKED "NAME LOCKED v2"); save keys, repo and Pages URL keep the old `hollowlight` names on purpose, and so do some internal file names (for example the font files below).

Game, design and direction: Matt Hillier. No third-party art, sprite, tile, icon or audio packs are shipped.

## Code and libraries (shipped in the build)
Facts from package.json and package-lock.json (npm ci on 2026-10-28; `npm audit`: 0 vulnerabilities).

| Package | Version | Role | Licence | Notes |
|---|---|---|---|---|
| phaser | 3.90.0 | Game engine, bundled into dist/index.html (runtime) | MIT | The only runtime dependency. Named on the About page ("Engine: Phaser 3 (MIT licence)"). |
| vite | 6.4.4 | Build tool (dev only, not shipped) | MIT | Pulls in esbuild, rollup and others as build-time dependencies. |

Lockfile: 68 package entries (root excluded): 66 MIT, 1 ISC, 1 BSD-3-Clause. Everything except Phaser is build-time. The single-file build uses a small in-repo Vite plugin (vite.config.js), not a package. No CDN, no runtime network calls.

## Fonts
Both families are SIL Open Font License 1.1. Source: github.com/google/fonts, folders `ofl/fondamento/` and `ofl/alegreyasans/` (downloaded 2026-10-16 with Matt's approval into an empty scratch folder outside the repo; sizes matched the GitHub API listing; TTF magic bytes checked; OFL.txt read; nothing executed). Subset to Latin and converted to woff2 with fontTools in a throwaway venv (build-time tool, not a project dependency). Self-hosted, inlined into the single-file build.

| Font (as shipped) | Use | Author / copyright | Source | Files | Licence text |
|---|---|---|---|---|---|
| Hollowlight Chancery (subset of Fondamento Regular + Italic; internal name kept) | Headings, names, big numerals, whisper/flavour (italic) | Copyright (c) 2011 Brian J. Bonislawsky DBA Astigmatic (AOETI) | github.com/google/fonts/tree/main/ofl/fondamento | src/assets/fonts/hollowlight-chancery.woff2, hollowlight-chancery-italic.woff2 | src/assets/fonts/OFL-fondamento.txt |
| Alegreya Sans (subset, Regular 400 + Bold 700) | Body, labels, numerals | Copyright 2013 The Alegreya Sans Project Authors | github.com/google/fonts/tree/main/ofl/alegreyasans | src/assets/fonts/alegreya-sans-400.woff2, alegreya-sans-700.woff2 | src/assets/fonts/OFL-alegreya-sans.txt |

Reserved Font Name: Fondamento declares RFNs "Fondamento" and "Fondamento Italic". Subsetting is a modification (OFL FAQ 2.6), so the shipped subset is renamed (name table IDs 1/3/4/6 rewritten; the name does not contain the RFN); copyright and licence notices are kept and the OFL text is shipped. Alegreya Sans declares no RFN. The fonts are not sold on their own.

## Art (all made by code in this repo)
| Asset | How it is made |
|---|---|
| Heroes, spirits, enemies, boss, ground, props, map-event sites (lamp posts, lanterns, Hollow Knot), effects | SVG-style painters under src/gfx/ (for example siteview.js for the map events), baked to textures at boot |
| Wispwick wordmark (Brass Lantern, LOCKED "WORDMARK") | Inline SVG built in code: src/ui/kit.js `wordmark()` |
| App icons (public/favicon.svg, favicon-32/64.png, icon-128/192/512.png, icon-maskable-512.png, apple-touch-icon.png) | Lantern emblem drawn in SVG by scripts/gen-icons.mjs, rendered to PNG with local headless Chrome (no downloads) |
| Share image (public/share.png, 1200x630) | scripts/gen-share.mjs: the real code-drawn wordmark over a code-drawn dusk background |
| Hero portraits (src/assets/heroes/wren.webp, elias.webp) | Crops of the project's own approved hero sheets (docs/mockups/wren-v2, elias-v2) by scripts/gen-hero-portraits.mjs. How the sheets were first produced (code only, or with an AI image tool): TODO Matt, confirm. |

## Audio
All sound and music is synthesised at run time with the Web Audio API in src/audio/ (oscillators, noise, envelopes), including the map-event sounds. No audio files are shipped or downloaded.

## AI-use disclosure
- The code, game data, tests, documentation, art-drawing code and sound synthesis were written with the help of Claude (Anthropic's AI coding assistant, used through Claude Code), directed and playtested by the developer, Matt Hillier.
- Design, balance targets and creative decisions were made or approved by the developer.
- No generative-AI image, music or voice files are known to be shipped. TODO Matt: confirm the hero sheets did not come from an AI image tool; if any did, name the tool, date and terms here.
- No runtime AI and no network calls: static site, saves in the browser's localStorage.
- In-game text: Settings > About (src/ui/aboutcopy.js, draft wording for Matt). Wispwick is private and non-commercial (LOCKED "PRIVATE, NON-COMMERCIAL"), so store AI-disclosure forms are not needed unless that changes.
