# Credits

## Fonts (UI IDENTITY v1, chunk U1b: pairing A "Chancery Storybook", replaces the U1 trio)
Both families are SIL Open Font License 1.1. Source: github.com/google/fonts, folders `ofl/fondamento/` and `ofl/alegreyasans/` (downloaded 2026-10-16 with Matt's approval into an empty scratch folder outside the repo; sizes matched the GitHub API listing; TTF magic bytes checked; OFL.txt read; nothing executed). Subset to Latin (Basic Latin, Latin-1, punctuation, arrows, minus, euro, a few symbols) and converted to woff2 with fontTools in a throwaway venv (build-time tool, not a project dependency). Self-hosted, inlined into the single-file build; no CDN.

| Font (as shipped) | Use | Author / copyright | Source | Files | Licence text |
|---|---|---|---|---|---|
| Hollowlight Chancery (subset of Fondamento Regular + Italic) | Headings, names, big numerals, whisper/flavour (italic) | Copyright (c) 2011 Brian J. Bonislawsky DBA Astigmatic (AOETI), astigma@astigmatic.com | github.com/google/fonts/tree/main/ofl/fondamento | hollowlight-chancery.woff2, hollowlight-chancery-italic.woff2 | src/assets/fonts/OFL-fondamento.txt |
| Alegreya Sans (subset, Regular 400 + Bold 700) | Body, labels, numerals, arrows | Copyright 2013 The Alegreya Sans Project Authors (github.com/huertatipografica/Alegreya-Sans) | github.com/google/fonts/tree/main/ofl/alegreyasans | alegreya-sans-400.woff2, alegreya-sans-700.woff2 | src/assets/fonts/OFL-alegreya-sans.txt |

Reserved Font Name: Fondamento declares Reserved Font Names "Fondamento" and "Fondamento Italic". Subsetting is a modification (OFL FAQ 2.6), so the shipped subset is renamed "Hollowlight Chancery" (name table IDs 1/3/4/6 rewritten; the name does not contain the RFN); copyright and licence notices are kept and the OFL text is shipped. Alegreya Sans declares no RFN, so it keeps its name.

Modified (subset) versions are distributed under the same OFL 1.1; the fonts are not sold on their own.

## Code and libraries (shipped in the build)
Facts from package.json and package-lock.json at origin/dev b2e78ce (2026-10-28). `npm ls` could not be run in the worktree (no node_modules); licences read from the lockfile.

| Package | Version | Role | Licence | Notes |
|---|---|---|---|---|
| phaser | 3.90.0 | Game engine, bundled into dist/index.html (runtime) | MIT | The only runtime dependency. TODO Matt: confirm the MIT notice is shown on the About page (LAUNCH-CHECKLIST row 19). |
| vite | 6.4.4 | Build tool (dev only, not shipped) | MIT | Pulls in esbuild, rollup and others as build-time dependencies. |

Lockfile: 69 package entries, 66 MIT, 1 ISC, 1 BSD-3-Clause (the root entry has no licence field). Everything except Phaser is build-time. The single-file build is done by a small in-repo Vite plugin (vite.config.js), not by a package.

## Art
- In-game art is drawn by code (SVG-style painters under src/gfx/, baked to textures at boot). No third-party sprite, tile or icon packs are in the repo.
- src/assets/heroes/wren.webp and elias.webp are small crops of the project's own approved hero sheets (docs/mockups/wren-v2, elias-v2), made by scripts/gen-hero-portraits.mjs. How those sheets were first produced (code only, or with an AI image tool): TODO Matt, confirm.
- public/ icons (favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png): origin not recorded in the repo. TODO Matt, confirm they are the project's own.

## Audio
- All sound is synthesised at run time with the Web Audio API in src/audio/ (oscillators, noise, envelopes). No audio files are shipped or downloaded.

## Fonts
See the Fonts section above (Fondamento and Alegreya Sans, SIL OFL 1.1, self-hosted, subset).

## AI-use disclosure (draft for the About page, itch.io and Steam)
Facts from the repo and CLAUDE.md:
- The code, game data, tests, documentation, art-drawing code and sound synthesis were written with the help of Claude (Anthropic's AI coding assistant, used through Claude Code), directed and playtested by the developer, Matt Hillier.
- Design, balance targets and creative decisions were made or approved by the developer.
- No generative-AI image, music or voice files are known to be shipped. TODO Matt: confirm that no hero sheet, icon, wordmark or store art came from an AI image tool. If any did, name the tool, date and terms here.
- No runtime AI: the game makes no network calls and sends no data anywhere (static site, saves in the browser's localStorage).

Suggested short text (edit once the TODOs are settled): "Hollowlight was made by one developer working with an AI coding assistant (Claude). Code, game systems, art-drawing code and sound synthesis were written with its help; design decisions and playtesting are human. No AI-generated image or audio files are used. [confirm]"

Platform notes (not verified here, TODO Matt): Steam and itch.io both ask developers to disclose AI use; re-read the current policy and form fields on each when filling them in.
