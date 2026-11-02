# UI audit v1 (2026-11-02): non-run screens vs the new tree-home look

Read-only audit for the UI alignment pass (docs/QUEUE.md). No source was changed.
Screenshots: `docs/screenshots/ui-audit-2026-11-02/` (jpg, ~7 MB). Suffix `-desk` = 1280x720, `-phone` = 390x844 (dpr 2), `-land` = 844x390 (dpr 2).
Target kit (from docs/mockups/tree-v3/R3-bgB-carved-stone-night.png, R3-hero-panel-variants.png, README): carved-stone night wall with runic rings; dark panels with warm-gold borders; slim glass pill buttons, Play = warm-gold primary; medallions with progress rings; name banner + condition tile; chancery display type; one shared hero panel (Play, Almanac, Goals, Back); gold + shard counters. docs/design/skill-tree-rework-v1.md did not exist yet; it was not read.

## How the shots were made (and what is NOT verified)
- Driver: headless Chrome through scripts/phone-shots.mjs machinery (in-process Vite on this checkout), seeded with the existing mid-game preset (scripts/seed-midgame.js.txt: half tree, 2,600 gold, 7 shards). Debug perf overlay hidden.
- Screens were opened by calling the UI methods directly (`ui.showNights`, `ui.showWear`, `ui.showLanterns`, ...), not by clicking through. Real click paths unverified.
- Seed side effect: the Characters page shows both heroes as "???" sleeping, which is almost certainly a seed artefact (no starter hero chosen). Treat the Characters shot as a layout reference only; the awake layout was not captured.
- Victory/defeat were forced with a fake sim state (so "Debug run: not saved" shows and the spirit bar reads 0%). Layout is real, numbers are not.
- Tree was shot at its default far zoom only; no node selected, no banner/condition tile. The tree is already being reworked by someone else, so I audit its chrome only.
- Not reached: boot loading screen, intro/first-minute hints, celebrations, starter hero/spirit pick (new-profile path), settings Controls remap in progress, mobile in-run touch controls. No real phone used (emulated only).
- Tap targets: a DOM scan at 390x844 found no visible control under 44x44 css px and no horizontal page scroll on any screen. Visually small things (the home icon in the tab row) still have a 44 px hit area.

## Screen table
Severity: MUST = breaks the "one game" feel or hurts use; NICE = polish. Effort S (<half day), M (1-2 days), L (3+). Risk = chance of regressions.

| Screen | Files | Looks like now | Gap vs target kit | Sev | Eff | Risk |
|---|---|---|---|---|---|---|
| Title / front door | 01-title-{desk,phone}; land | Dark flat slate, faint root doodles; big gold wordmark; heavy double-rim gold "slab" buttons (Continue = orange gradient); lantern chip top-left, purses top-right; tab row on top | No carved-stone wall or runic rings. Slab buttons are heavier/rounder than the slim glass pills. Menu is Continue/Skill Tree/Almanac/Settings/New game, not the shared Play/Almanac/Goals/Back panel. No hero on the title. Desktop: install card pushes below fold (page scrolls) | MUST (background + menu), NICE (hero) | M | Low-Med (title.css, saves untouched) |
| Whose lantern (profiles) | 02-lanterns-{desk,phone} | Two hanging-lamp cards on a dashed rail, gold arch frames, dark slate | Closest to the target in spirit (gold border, dark panel). Only the background and button weight differ | NICE | S | Low |
| Night select | 03-nights-{desk,phone} | Big scene card (forest silhouettes + moon) with night tabs, right detail panel, gold counters, step dots; Back / Skill Tree / Next at bottom | Panels + counters already match. Scene card is a flat vector forest, not carved stone. Heading "Choose your night" is bigger/cream vs gold in the mockup. Phone: dead gap above the buttons, Back and Skill Tree on different row widths | NICE | S | Low |
| Hero select | 04-hero-select-{desk,phone,land} | Two arched hero cards (portrait, role, ability), Back/Wear/Next | Not the left "Your hero" panel with big portrait + companion + hero swap row; it is a separate screen from the tree hero panel, so the same hero is presented two ways. Landscape phone: cards fill the width and the title is squeezed | MUST (one hero panel, shared) | M-L | Med (flow: Begin -> night -> hero -> spirit) |
| Wardrobe (Wear) | 05-wardrobe-{desk,phone} | Title + chancery subtitle, large preview card, chip tabs (Flame/Trail/Look), option tiles, Back/Wear | Chips and tiles are a third button style (thin pill, no gold rim). Preview is a bare code-drawn lantern on flat blue. Has Back + Wear (good). Phone list clips the last tile behind a fade (scrolls, ok) | NICE | S | Low |
| Characters (Kindred) | 06-characters-{desk,phone} | Title row, small portrait tiles, one large gold-framed detail card; empty lower half | Page is mostly empty space; detail card uses the heavy gold glass, tiles use dashed amber; no Back button (only the tab row). Awake state not captured (see caveats) | NICE (MUST if it stays as a separate hero page next to the new hero panel) | M | Low |
| Skill tree (current) | 07-tree-{desk,phone,land} | Near-black sky, gold hub with thread burst, ghost constellations; round dark tool buttons at right rail; "Next lights" pill; key-hint chip bottom-left; tab row doubles as header with purse | This IS the thing being redone; chrome gaps listed: no hero panel, no stone wall, tool buttons are circles (own style), no Back (Esc/home tab only), "Got it" welcome card uses a fourth panel style, region labels overlap nodes on phone landscape ("The Almanac" label) | MUST (owned by tree rework) | L | High, other agent |
| Goals | 08-goals-{desk,phone} | Right slide-over inside the tree: two tabs (Lantern/Goals), thin-border dark list with teal progress bars | Goals is not its own page in the target (it is a hero-panel button). Panel style is the flat tree style (thin line, no gold rim) | NICE | S-M | Low |
| Almanac, all 5 tabs (Foes, Spirits, Wickbearers, Nights, Places) | 11-almanac-t0..t4-{desk,phone,land} | Full-width blue-grey gradient sheet with thin gold hairline, flat grey tab row, grid of ?-tiles + detail pane, chancery title only on the header, "How things work" outlined button | Furthest from the kit: lighter slate-blue (not the night/stone palette), hairline border not warm-gold rim, plain tabs vs pill tabs, tiles grey not medallions with rings, no Back button (tab row only), header subtitle floats mid-bar. Places tab has circle placeholders (ok) but only 3 of 6 show before sight. Phone: tab row is wide, big empty body | MUST | M | Low-Med (codex.css, 31 hard-coded colours) |
| Settings (Sound, Picture, Controls, Saves, About) | 09-settings-t0..t4-{desk,phone} | Centred gold-framed hanging panel, left pill tab stack, gold sliders, toggles, About text | Already the "gold border + pill" look, maybe the best match. Gaps: slab pills (thicker than target), panel hangs from a cap ornament the other pages lack, no Back button (only tab row/Esc), phone tab pills crowd their labels (Controls touches the rim), large dead space above the panel on phone, About is dense body text with a scroll | NICE (+ MUST for a visible Back) | S | Low |
| About | 09-settings-t4-About-{desk,phone} | Last Settings tab: blurb, How to play, Credits, version, scrolling | Plain long text; headings use chancery (good); no dedicated page; wording owned by Matt (open item) | NICE | S | Low |
| Pause | 13-pause-{desk,phone} | Centred hanging gold panel over dimmed run; Resume (orange), Settings, Almanac, Quit (red text), Full screen pill | Matches the "dark panel + gold border + primary gold" kit. Buttons are slab not slim glass. Not the shared menu (Resume instead of Play). Fine as a pause | NICE | S | Low |
| Level-up cards | 14-levelup-{desk,phone} | Three hanging arch cards, gold rim, weapon medallion, % big number, pips | Medallions already close to the target. Cards use heavy rim like the buttons. Reference only | NICE | S | Low |
| Results: defeat | 15-defeat-{desk,phone,land} | Lantern emblem + title left, stat panel right with timeline bar, tile grid, Main menu / Again / Tree | Panel + tiles match; background is flat brown-black, no stone. "Tree" button sends the player to the tree; no Almanac/Goals buttons (target menu has them) | NICE | S | Low |
| Results: victory | 16-victory-{desk,phone} | Warm dawn gradient, rainbow-tiled panel border, full lantern | The rainbow border is a unique style (intentional "colour returns"); keep. Same button row as defeat | NICE | S | Low |
| In-run HUD (reference) | 12-hud-{desk,phone} | Lantern HP, moon-arc timer, gold/shard coin chip, minimap, weapon strip, ability ring | Out of scope; its dark pills with thin gold rim are a fifth button style. Note only | n/a | - | - |

## Shared component inventory
There are THREE style systems in play, which is the root of the gaps.

| Component | Where it agrees | Where it differs |
|---|---|---|
| Palette / tokens | `--lg-*` (src/ui/kit.css, "Lantern Glass": blue glass #303c56/#161c2a, brass #f5dfae, gold rim) drives title, lanterns, nights, hero, wear, results, settings, pause, level-up (16-34 `var(--lg-` uses per file) | Almanac (codex.css) uses 1 `--lg` token and 31 hard-coded hex values; tree (treescreen.css) uses its own `--ts-*` palette (46 uses, near-black glass, mute #b3bbcf, teal #6fd3c5, line rgba(216,178,106,.38)). Menu tab row (menunav.css) uses 14 hard-coded colours and zero tokens |
| Primary button | Same orange-gold gradient pill with flame disc and key badge (Enter/R/Esc) on title, nights, hero, wear, pause, results | Mockup Play is a flatter warm-gold glass pill with no flame disc; tab row "active" is a third gold pill; tree "Goals" button is a dark pill with no gold |
| Secondary button | Dark navy slab with double gold rim (title, nights, hero, results, settings, pause) | Wear chips: thin pill, no rim. Almanac tabs and "How things work": flat outline. Tree tools: round dark discs. Goals tabs: flat |
| Panels | Gold-rim dark-blue glass with top sheen: nights, settings, pause, characters detail, results | Almanac: hairline gold, lighter slate. Tree welcome card/Goals drawer/Next-lights pill: near-black, thin amber line. Hanging-lamp cap ornament only on settings, pause, level-up, lanterns |
| Headers | Chancery display title in cream (Choose your night, Settings, Paused, Who walks tonight) with an italic subtitle | Gold (not cream) night subtitle; Characters/Wardrobe title is left-aligned with the subtitle on the baseline; Almanac title is small, header text centred oddly; tree has no title |
| Name banner + condition tile | Night select detail panel and Wardrobe locked tile are the nearest | Only in the tree mockup. Not a component yet |
| Counters (gold + shards) | Rounded dark chip with coin/crystal icon on title, nights; in tab row on tree | Tree tab row places them inline as bare text (no chip); settings/almanac/hero/wear/characters show none |
| Back button | Slab Back + Esc badge on lanterns, nights, hero, wear | None on settings, almanac, characters, tree, goals (they rely on the tab row home icon or Esc). Matches "Back" in the target hero panel, which is missing everywhere else |
| Navigation | One shared tab row (Home, Character, Tree, Goals, Almanac, Settings) present on every menu screen; consistent | Target moves nav to a hero-panel button stack on the tree; the tab row would then duplicate it |
| Fonts | "Hollowlight Chancery" (display, italic whisper) + Alegreya Sans (body) used everywhere; one family pair | src/style.css still carries a "planned embed: Cinzel" comment (Cinzel is not shipped; the chancery face already fills that role). Body sizes vary (Almanac 13-14 px vs nights 15-17 px on desk) |
| Background | Dark slate with faint root doodles on all title/menu screens | No carved stone, runic rings, moon haze or vignette anywhere; tree is plain near-black; Almanac sits on a flat gradient |
| Spacing | 44 px tap floor token `--lg-tap` honoured | Gutters differ per screen (24 px on desk Almanac vs 28 px Characters vs 56 px Settings); panel radius varies |

## Phone issues spotted
- No visible Back on Settings, Almanac, Characters, Tree (only the 22 px-looking home icon in the tab row; its hit box is 44x44 but it reads as a lantern, not "back"). Hardest for a first-time phone player.
- Settings (portrait): tab pills are cramped, "Controls" and "Saves" labels touch the pill rim; panel is vertically centred with about 280 px of dead space above it.
- Almanac (portrait): tab row has no counts (desk shows 0/11), body is mostly empty, the "How things work" button is large relative to the title.
- Tree (landscape 844x390): region name "The Almanac" overlaps its own node dots; Goals pill covers the bottom hub; tool discs crowd the right edge.
- Hero select (landscape): title and cards are tight, Back/Wear/Next sit under the cards with little room; card art is small.
- Night select (portrait): large dead gap between the info panel and the buttons; Back and Skill Tree are different widths.
- Title (portrait): usable, but the install card + "Landscape recommended" push content to the bottom; title (desktop 1280x720) scrolls because the install card falls under the fold.
- No horizontal overflow found; no control under 44x44 css px found (scripted check, 390x844 only).

## Recommended order for the alignment pass
1. Shared foundation first (M): one token set (merge `--ts-*` and codex hex into `--lg-*`), one background component (carved stone + runic rings + vignette, reduced-motion safe) behind every menu layer, one button kit (slim glass pill; gold primary), one panel, one counter chip, one Back button. Do this before touching screens so each screen change is small. Risk: gold-rim slab buttons are used by tests/screenshots in many files; change by variant, not by rewrite.
2. Shared hero panel (M-L): build once from the tree-v3 hero panel and reuse on the tree, the title and hero select, so there is one place the hero appears. Needs a decision on how it relates to the tab row (replace or keep).
3. Almanac (M): biggest visual outlier, self-contained (codex.css); move it to the shared panel/tab/medallion style and add Back.
4. Title / front door (M): background + the shared menu; keep the wordmark.
5. Hero select, Characters, Wardrobe (M): fold into the shared hero panel; Characters currently overlaps it.
6. Settings, About, Pause, Night select, Lanterns, Results, Level-up (S each): swap buttons/panels via the shared kit, add visible Back to Settings.
7. Phone pass last (S-M): Back visibility, Settings tab pills, landscape tree/hero select, title scroll.
Tree itself belongs to the tree rework; sync its tokens with step 1 rather than redoing them.

Right now: foundation kit (step 1). Next: shared hero panel. Parked: dedicated About page, Goals as a page.
