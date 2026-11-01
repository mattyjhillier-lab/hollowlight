# Hollowlight UI identity mock-ups (static HTML, NOT game code)
Sheet: docs/design/ui-identity-v1.md. Research: docs/research/32-ui-identity.md.
- TAKE A "Wick & Vellum" = `a-<screen>-<size>.png` / `a-<screen>.html`. TAKE B "Lantern Glass" = `b-...`.
- Screens: title, hero (select), levelup (weapon/stat/evolution + Blessings), pause, settings, results (locked layout, re-skinned).
- Sizes: 1280x720, 844x390 (@2x), 390x844 (@2x). `measured.txt` = overflow / text under 11px / smallest tap target per frame.
- `audit/` = screenshots of the CURRENT live build (title, level-up, pause/settings, tree, results) used for the audit. Regenerate: `node audit.mjs [baseUrl]` (needs a dev server).
- Regenerate mock-ups: `node build.mjs [a|b] [screen]` (own headless Chrome, Node built-ins only). Source: shared.mjs (markup), css.mjs (COMMON structure + A + B).
- Fonts are installed Windows STAND-INS (Constantia/Candara/Ink Free for A, Garamond/Corbel for B). Real OFL fonts are not downloaded yet; see the sheet, decision 2.
