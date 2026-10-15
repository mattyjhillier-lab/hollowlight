# Hollowlight UI directions (static mock-ups, not game code)

Open the PNGs. Each direction has: `dN-title.png`, `dN-hud.png`, `dN-levelup.png`, `dN-parts.png` (parts sheet with every mix-and-match code). `mix-a.png` and `mix-b.png` prove parts combine. HTML sources: `d1..d4.html`, `mix-a/b.html` (`?s=title|hud|levelup|parts`). Regenerate: `node build.mjs` (needs local Chrome; Node built-ins only). All inline CSS/SVG, system fonts, no network.

## Directions

| | D1 Moonlit Glass Plus | D2 Gothic Reliquary | D3 Neon Spirit HUD | D4 Ember & Ash |
|---|---|---|---|---|
| What | Evolution of current glass UI, icon-led, glow | Ornate dark fantasy, filigree frames, engraved | Futuristic-arcane, cut corners, line-work | Brutal warm slabs, hard shadows, heavy caps |
| Palette | Night #0b1020, cyan #6fe3d2, violet #9b7bff, gold #ffd26a, HP #e23a55 | Soot #0b0a0f, bronze #8a6a3a, parchment #e9dfc6, spirit #7fd6c6, blood #9e1f2b | Void #050a16, cyan #19f0ff, magenta #c45bff, gold #ffd23a, HP #ff3b6b | Charcoal #140d0c, ember #ff8a2a, bone #efe6d6, glow gold #ffc46a, blood #b3122a |
| Mood | Calm, magical, premium mobile | Solemn, weighty, Hades/Diablo Immortal | Slick, energetic, Survivor.io/Archero | Aggressive, gritty, heat and ash |
| Inspirations | Genshin/mobile gacha menus, Brawl Stars polish | Hades, Diablo Immortal, Darkest Dungeon | Survivor.io, Archero, Destiny/Cyberpunk HUDs | Diablo IV, Dead Cells, Hell Let Loose-style slabs |
| Mobile perf | Fine if glow is cheap: avoid backdrop-filter in HUD; box-shadow glows OK; bars via scaleX | Cheapest: flat fills, SVG frames drawn once; avoid big blur halos | Cheap: clip-path + borders; masks on bars cost a little, pre-render if needed | Cheap: flat fills; hard drop-shadows and hatch are static; many ember particles need pooling |
| Effort | S (closest to what exists) | L (frame SVGs per panel size, 9-slice needed, more art) | M (clip-path panels, hex frames, segmented bars) | M (slab frames + hatch, bold type, particles) |
| Distinct from "plain glass"? | Moderately (polish, not a reset) | Very | Very | Very, warmest |

## Mix-and-match codes (rows = ingredient)

| Ingredient | D1 | D2 | D3 | D4 |
|---|---|---|---|---|
| STYLE (panels, buttons, badges, keys) | S1 Glass | S2 Reliquary frames | S3 Cut-corner | S4 Slab |
| COLOUR | C1 Moonlit | C2 Gold-bronze | C3 Neon | C4 Ember & Ash |
| TYPE (system stacks) | T1 Georgia + Segoe UI | T2 Palatino caps + Georgia | T3 Bahnschrift | T4 Impact + Segoe UI |
| ICONS (frame + glyph) | I1 Glow disc | I2 Medallion | I3 Hex line | I4 Solid chamfer |
| BARS | B1 Glow pill + trail | B2 Embossed | B3 Segmented | B4 Slashed |
| CARDS (level-up layout) | K1 Icon-top | K2 Tarot | K3 Data card | K4 Slab poster |
| LOGO | L1 Glow serif | L2 Engraved caps | L3 Line-tech | L4 Ember slash |

Notes: parts are largely independent (colour is purely CSS variables; type is two font variables). K cards use whichever S frame you pick. The fonts are Windows system stacks; for shipping, self-host the OFL fonts from research doc 13 (Cinzel, Rajdhani, etc.) or similar.

## Recommended mixes (one-line recipes)

1. **Gothic frames + Neon colours** (`mix-a.png`): S2 + C3 + T2 + I2 + B2 + K2 + L2. Ornate and readable, cyan/magenta spirit glow instead of bronze.
2. **Cut-corner HUD + Ember colours** (`mix-b.png`): S3 + C4 + T4 + I3 + B3 + K3 + L4. Techy structure with warm, aggressive colour and bold type.
3. **Glass cards + Ember colours**: S1 + C4 + T1 + I1 + B1 + K1 + L1. Keeps the cheap, modern glass build but escapes the "blue" look; warm gold-orange evolutions need a different rare colour (use bone/white-gold).

## Honest pick

**D3 Neon Spirit HUD structure (S3/B3/I3/K3), with C1 Moonlit or C3 colours.** It reads clearly as "modern game" at a glance, is cheap on mobile (clip-path, flat fills), is medium effort, and fits the spirits-of-light world. D1 is the safest and fastest upgrade (S effort) but is the least different from what Matt called plain. D2 looks richest but is the most expensive to build and maintain across screen sizes; consider using only its title logo (L2) and card frames (K2/S2) for evolution cards. D4 is the boldest colour story and works well for a hard/late-chapter theme (e.g. a later chapter or boss re-skin) but warm-on-dark makes the cyan spirit-glow identity disappear; gold/rare must be redefined as white-gold. Gold-for-rare is respected in D1-D3.

Caveats: mock-ups use placeholder silhouettes and a fake scene; PNGs were channel-rounded to stay under 350KB (slight banding in dark gradients is an artefact, not the design).
