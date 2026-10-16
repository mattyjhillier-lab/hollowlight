# Credits

## Fonts (UI IDENTITY v1, chunk U1b: pairing A "Chancery Storybook", replaces the U1 trio)
Both families are SIL Open Font License 1.1. Source: github.com/google/fonts, folders `ofl/fondamento/` and `ofl/alegreyasans/` (downloaded 2026-10-16 with Matt's approval into an empty scratch folder outside the repo; sizes matched the GitHub API listing; TTF magic bytes checked; OFL.txt read; nothing executed). Subset to Latin (Basic Latin, Latin-1, punctuation, arrows, minus, euro, a few symbols) and converted to woff2 with fontTools in a throwaway venv (build-time tool, not a project dependency). Self-hosted, inlined into the single-file build; no CDN.

| Font (as shipped) | Use | Author / copyright | Source | Files | Licence text |
|---|---|---|---|---|---|
| Hollowlight Chancery (subset of Fondamento Regular + Italic) | Headings, names, big numerals, whisper/flavour (italic) | Copyright (c) 2011 Brian J. Bonislawsky DBA Astigmatic (AOETI), astigma@astigmatic.com | github.com/google/fonts/tree/main/ofl/fondamento | hollowlight-chancery.woff2, hollowlight-chancery-italic.woff2 | src/assets/fonts/OFL-fondamento.txt |
| Alegreya Sans (subset, Regular 400 + Bold 700) | Body, labels, numerals, arrows | Copyright 2013 The Alegreya Sans Project Authors (github.com/huertatipografica/Alegreya-Sans) | github.com/google/fonts/tree/main/ofl/alegreyasans | alegreya-sans-400.woff2, alegreya-sans-700.woff2 | src/assets/fonts/OFL-alegreya-sans.txt |

Reserved Font Name: Fondamento declares Reserved Font Names "Fondamento" and "Fondamento Italic". Subsetting is a modification (OFL FAQ 2.6), so the shipped subset is renamed "Hollowlight Chancery" (name table IDs 1/3/4/6 rewritten; the name does not contain the RFN); copyright and licence notices are kept and the OFL text is shipped. Alegreya Sans declares no RFN, so it keeps its name.

Modified (subset) versions are distributed under the same OFL 1.1; the fonts are not sold on their own.
