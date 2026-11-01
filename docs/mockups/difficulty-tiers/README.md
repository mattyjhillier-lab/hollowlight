# Difficulty tiers + economy mock-ups (design only, NOT game code)

For docs/design/difficulty-tiers-economy-v1.md. Static HTML pages (no runtime JS), code-drawn, Lantern Glass kit tokens and the game's own fonts.

- `inventory.mjs`: all design data (tiers, marks, resources, the five tool clusters' nodes, budget, economy model). `node inventory.mjs` prints every table in the sheet (saved as `tables.txt`).
- `build.mjs`: writes the `dt-*.html` pages. `shoot.mjs`: own headless Chrome on port 9382 with a throwaway profile; renders PNGs at 1280x720, 844x390@2x, 390x844@2x (`*-desk` pages desktop only).
- Regenerate: `node build.mjs && node shoot.mjs && node inventory.mjs > tables.txt`

| File | Shows |
|---|---|
| dt-options-desk.png | the three first decisions (tier structure, new resource, where tier power works), A recommended |
| dt-mapselect-{1280x720,844x390,390x844}.png | map card with Twilight / Deep Dusk / Long Night chips (stars, NEW, Recommended, locked teaser + condition bar), what changes, rewards, records, next-light nudge |
| dt-results-{1280x720,844x390,390x844}.png | victory on Deep Dusk, first dawn: tier badge, gold x1.5, shards, Dawnglass chip with breakdown, stars, next lights (adds to the LOCKED results layout) |
| dt-tree-desk.png | schematic Lantern Web with the five tool clusters on the gap-bearing far slots (layout L-A) |
| dt-affixes-desk.png | the four Hollow marks (schematic husk, not final art), one verb each |
