# Phone + desktop menu chrome and the Lantern Web (DESIGN ONLY, nothing built, nothing locked; awaiting Matt's picks)

Branch wip/tree-phone-design (from dev). Docs and screenshots only, src untouched. Written 2026-10-30.
Source of the problem: Matt's iPhone (landscape, ~874x402 CSS px, screenshots 2622x1206) of the Tree screen and the Home screen.
Screenshots: docs/screenshots/tree-phone/ (half-size PNGs, 1 px = 1 CSS px). `before-*` = today (headless Chrome, mobile emulation, dev build, fresh save, no `?debug`). `mock-*` = option mock-ups made by injecting CSS/DOM into the REAL screens (approximate; sizes noted below are the design targets, the mocks are a few px off). Scratch scripts (not part of the game): `*.scratch.mjs.txt` in the same folder; the real tool is scripts/phone-shots.mjs (already has `tree`, `goals`, `chars`, `almanac`, `settings`, `front`).

## 0. Principle recorded (Matt, 2026-10-30): ONE shared menu design language
Phone and desktop must be the SAME design, laid out for the screen, not two designs. Same chrome, tab style, header, node sheet, Warm Lantern styling; desktop adds room, hover, keyboard and a bigger web view. Consequences used below: (a) every option is built from shared components with ONE stylesheet and responsive rules (container queries on the screen's own size, not `html.phone`); (b) this supersedes the PHONE LAYOUT PICK line "desktop look stays / desktop screenshots must stay unchanged": desktop WILL change to mirror the phone chrome, so Matt's reopen of that line is implied by this principle and must be recorded in LOCKED when he picks; (c) the 1280x720 and 1920x1080 screenshots are re-baselined, not kept. Today the phone and desktop split is by `html.phone` (touch or short-wide) plus a separate `ts-short` gate on height <= 520 that also hits small desktop windows: both go.

## 1. Audit (before): every menu screen
Measured at 844x390 (Matt's phone is 874x402, same numbers +3%) and 390x844. "Chrome" = permanent bars above the content.

| Screen | Landscape 844x390 | Portrait 390x844 |
|---|---|---|
| Home (front door) | Tab bar = plain text on a flat strip, equal wide gaps; Begin / Skill Tree / Settings below use the gold-navy pill language, so the bar looks like a different app. Skill Tree and Settings buttons duplicate two tabs. Install card ("Play full screen") takes the lower right and pushes Begin up. Content sits high and left. | Fine and polished below the bar; same plain tab bar. |
| Character | Title "Kindred", list left, big detail frame, large Back button at the bottom (duplicate of the tabs); a lot of dead space in the frame. | not checked in detail (same chrome) |
| Tree | Chrome 100 px of 390 (26%): tab bar 47 + second header 53 (Back, title, gold, shards, can-light badge, Goals, Spirits, ?). Map is 290 px tall and its constellation names slide UNDER the header (cut off: "The Almanac", "The Card Fan"). Bottom: step bar (49 px) + whole-web button. First visit adds a welcome card on top of the step bar. Node panel 304x279 (36% wide, 72% tall). | Chrome 158 px of 844 (19%): tab bar 47 + two-row header 111. Node panel 390x446 (53% of height). |
| Goals | Same tree screen with a side panel; the header "Goals" button and the tab "Goals" do the same thing. | same |
| Almanac | THREE bars: tab bar 47 + header (back, title, subtitle, How things work) 53 + sub-tabs (Foes/Spirits/...) 44 = 144 px of 390 (37%). Grid is clipped at the bottom (scrollbar, no clear cue beyond the fade). Flat blue glass, a third dialect. | Header 53 + sub-tabs 44 + tab bar 47: fine, grid fills. |
| Settings | Ornate gold frame (a different dialect again), 5 pill tabs, 2-column sound list; Sound rows clipped (fade cue); big orange Back at the bottom duplicates the tabs. | Ornate frame, "Settings" title + subtitle + ornament = ~210 px before the first slider; all rows fit but Back is near the bottom edge. |

Cross-screen findings
1. THREE visual dialects: plain tab bar (flat), Almanac (flat blue glass, small radius), Settings/Home/Character (gold-rimmed navy pills). Only the last is Warm Lantern. The tab bar is the first thing seen on every screen and it is the odd one out.
2. Duplicate navigation everywhere: tab bar + per-screen Back + per-screen title + (Tree) Goals/Spirits/? + (Home) Skill Tree/Settings buttons. There is NO Home tab: today Back is the only way to the front door, so Back cannot simply be deleted (see section 5, gap 1).
3. Chrome stacks (tab bar + screen header + sub-tabs): 100 to 144 px of a 390 px landscape screen.
4. The in-app tab bar is plain text; tap target is 44 px tall but its highlight is a flat gold slab with square-ish corners.
5. DEAD BLACK BAND on Home (Matt's screenshot, ~62 px of 402 at the bottom, content layer ends at ~85% of the height). NOT reproduced: headless Chrome at 874x402 and 844x390 fills the full height on every screen (`#app` is fixed inset 0, `#stage` 100% under `html.phone`, layers are absolute inset 0 below the tab bar). Hypotheses, most likely first: (a) iOS Safari tab (not the installed app): `100vh` and `vh`-based type (phone.css uses `3.02vh`, style.css `100vh`) are the LARGE viewport, `position: fixed; inset: 0` is the visible one; mixing them can leave the stage shorter than the page background; (b) `html.phone` not applied on that device so the 16:9 rule `min(100%, 100vh*16/9)` + `aspect-ratio` applies; (c) the home-indicator/safe-area bottom inset handled as padding on a layer that does not paint its background. Cheap, safe next step (a tiny chunk, in section 6): a `?probe=1` overlay showing innerWidth/innerHeight, visualViewport, screen size, display-mode, `html.phone` yes/no and the rects of `#app`, `#stage`, `#ui`, the active layer; Matt sends ONE screenshot; then fix. Hardening that is safe regardless: `#app { height: 100dvh }` with a `100vh` fallback, size type from `dvh`/container units not `vh`, and paint the menu backdrop on `#stage` (not only on each layer) so any leftover strip matches instead of going black.
6. The floating slider/bar at the left of Matt's Tree screenshot (black pill, speaker icon, tall black bar) is the iOS SYSTEM volume indicator (it appears when the hardware volume buttons are pressed). It is not drawn by the game (no such element in src/ui; sound controls live in Settings). Inference from the iOS look and position, not verified on device; nothing to build. If Matt sees it WITHOUT pressing volume keys, tell us and we investigate.
7. The "home button" bottom right is our own "whole web" zoom button (house glyph). It reads as "go to the home screen" but only re-frames the map. Rename the glyph (see Tree options).

## 2. Root causes
Chrome (all screens)
- C1: the persistent tab bar (src/ui/menunav.js + menunav.css) is a bare row with no Warm Lantern component styling and no icons; every screen then adds its OWN header (ts-bar, Almanac header, Settings title, per-screen Back). Nothing coordinates them, so heights add up.
- C2: no Home destination in the tab bar, so each screen needs its own Back.
- C3: three screens were styled in three different chunks (T4 tree, CX codex, U4 settings/title).
- C4: sizing keyed off the window (`html.phone`, `H <= 520`, vh) not off the screen's own size, so desktop and phone are separate code paths (violates the new principle).
Tree
- T1: toolbar holds 7 controls in one row at 44 px min-height each (Back, title, 2-3 pills, badge, Goals, Spirits, ?), 53 px tall landscape, wraps to 111 px portrait; two of them (Back, Goals) duplicate the tab bar.
- T2: the map canvas is `inset: 0` under the toolbar, so it draws labels beneath the band (cut-off names) and the usable area is smaller than it looks.
- T3: region names are drawn at 14-22 px display font at every zoom (treescreen.js drawRegionNames: `fs = clamp(14, 70*z, 22)`), so on a 290 px-tall map a few labels take a large share; all ~250 lanterns draw at full brightness; the hub glow is a big warm wash.
- T4: the node panel is the DESKTOP panel shrunk: tabs row (Lantern | Goals, 44 px) + kick + name + state + why + description + flavour + steps + meta + cost + message + actions, 340 px wide on desktop, 36% x 72% on phone, 53% of height on portrait. Everything shows at once; Unlock is sticky but the rest scrolls.
- T5: first-visit welcome card (a 440 px dialog) and the Next-step bar both show at once at the bottom.

## 3. Menu chrome: THREE options (all screens; Matt picks ONE)

### T1 (Recommended): "Lantern tabs" - one slim lantern-glass row, icon + label, with Home
Plain words: the tab bar becomes a single 48 px row of small gold-rimmed navy pills (the same look as Begin / Skill Tree / Settings), each with a tiny code-drawn glyph (lantern for Home, hero for Character, star-lantern for Tree, ring for Goals, book for Almanac, gear for Settings), the current one filled gold with a soft glow. A leading Home tab (lantern glyph, icon only) takes you to the front door, which removes every per-screen Back. The right end of the SAME row carries that screen's own controls (Tree: gold, shards; Home: nothing extra). Per-screen title bars shrink to one 28 px caption inside the content (or move into the row on wide screens). See mock-chromeT1-*.
Sizes: row 48 px (tab button 44 px tall hit area, pill drawn 36 px inside it; keeps the 44 px rule and the audit's 40 px minimum); 844x390: 6 tabs ~ 96 px each = ~ 600 px, leaving ~ 240 px for the right-hand slot; 390x844: Home + 5 tabs at 12.5 px labels, ~ 58 px each = 350 px, icons above or beside labels; Larger text (1.3x) falls back to icon-only for the inactive tabs (label only on the active one) instead of scrolling.
Desktop mirror: the same row, same pills, 52 px tall, centred max-width 900 px, hover glow, keys 1-5 / Tab / arrow keys move between tabs, same right slot with the purse. One component, one stylesheet, sizes via container query.
Fit: it IS the Warm Lantern language (gold rim, navy glass, glowing selected state), no new colours, no new art beyond six small code-drawn glyphs in the existing SVG-glyph style.
LOCKED conflicts: none with the persistent tab bar (kept); the "desktop look stays" line (PHONE LAYOUT PICK) is reopened by Matt's new principle; Settings A3 "title hidden because the nav says Settings" is consistent.
Test/audit: tests/fix1.test.mjs asserts menunav.css `min-height: 44px` (kept); add tests: six tabs in order, Home goes to the front door, each tab has an accessible name, label hidden only visually. fitaudit.js: `layoutAudit` small-target rule (< 40 px) passes with 44 px buttons; add 'home' to the screens list and re-run fitSweep at normal/large/larger at 844x390, 390x844, 1280x720.
Effort: small-medium (menunav.js/css + 6 glyphs + removing per-screen Back buttons).
Risk: pill tabs at 390 wide are tight (mock fits at normal text; larger text uses the icon-only fallback).

### T2: Side rail (landscape) / bottom bar (portrait)
Plain words: the tabs become big lantern-glass buttons stacked down the LEFT edge on landscape phones (icon over label, 62 px wide) and along the BOTTOM on portrait (thumb zone, 60 px tall). The top of the screen is free for content. See mock-chromeT2-*.
Sizes: 844x390: rail 62 px wide, content width 782 (-7%), full 390 height (+47 px, +12%); 390x844: bar 60 px at the bottom (+ home-indicator inset), content 784 tall.
Desktop mirror: rail on the left at any window wider than ~1100 px (a left sidebar is natural on desktop); bottom bar on narrow/portrait. Same component, two placements.
Fit: good, still lantern pills. Mixed placement (rail vs bottom vs top) is the cost: the Tree screen's web loses 62 px of width on a phone; the left edge on iPhone also has the notch inset in one landscape direction.
LOCKED conflicts: moves the persistent tab bar from the top (built as FD / menunav) to the side: needs Matt's reopen. Safe-area A2 frame must add left inset to the rail.
Test/audit: menunav tests (position), layout audit overlap check between rail and layers; every layer's `top: calc(47px + ...)` rule in menunav.css changes to `left`.
Effort: medium (touches every layer offset).
Risk: rail + Tree side drawer + zoom rail = three vertical strips on a 390 px-tall screen; thumb reach on the left rail in landscape is fine, on portrait the bottom bar competes with Tree's bottom sheet.

### T3: One slim header: Back, screen title, purse, menu button (destinations in a sheet)
Plain words: a single 44 px header on every screen: left "back" chevron, centre-left the screen name in the display font, right the purse and a menu button; tapping the menu opens a sheet listing Home, Character, Tree, Goals, Almanac, Settings. The most compact: no tab strip at all. See mock-chromeT3-*.
Sizes: 44 px row; 844x390 and 390x844 identical.
Desktop mirror: the same header, with the six destinations shown inline (wide screens) instead of behind the menu button: same component, `menu` expands to tabs at >= 900 px.
Fit: clean, but a hamburger is a generic mobile pattern, not specific to the lantern identity, and every screen change costs two taps; Matt liked seeing the destinations (tabs were his structure).
LOCKED conflicts: removes the always-visible persistent tab bar (reopen needed).
Test/audit: new sheet needs focus trap and Esc; fitaudit adds the sheet as a screen.
Effort: medium. Risk: discoverability (first-time players may not see Goals/Almanac).

Recommendation: T1. It fixes "looks out of place" directly, keeps the structure Matt built, removes duplicates, and mirrors cleanly to desktop. T2 is the best use of height but costs width and reopens a locked placement; T3 is smallest but least discoverable.

## 4. The Lantern Web (Tree): THREE options (Matt picks ONE; all assume the T1 row, and all share one node-sheet component)

All options: gold/shard pills move into the tab-row right slot, Back/title/Goals buttons are dropped on the tree (tab bar already has Tree and Goals; Back becomes the Home tab), Spirits and ? become map-rail buttons.

### A (Recommended): "Quiet web": one row, tool rail, fading distance, compact node strip that expands
Header: only the T1 row (48 px). Tree map starts under it; no second header. Portrait adds ONE 30 px strip under the row with the purse and the best-next button (total 78 px vs 158 now).
Map rail (right edge, vertical, 44 px round lantern-glass buttons, gap 6): Best next (glowing, shows the can-light number, keeps the locked jump-to-next + "N can light" counter), Whole web (new lantern-and-rays glyph instead of a house), Spirits, ? . 4 x 44 + 3 x 6 = 194 px, fits 342 px landscape height.
Declutter (phone sizes; desktop uses the same rules, thresholds by on-screen size so the big window simply meets them less often): (1) constellation names capped at 13 px (desktop 18) in the display font, drawn only for the constellation(s) in view and never under the bar; at far zoom a name is shown only if its cluster is >= 26 px wide (rule already exists) AND leaves a 6 px gap to the nearest name (collision pass already exists); (2) lanterns outside the selected constellation fade to 35% (the `dim` 0.2 alpha path exists) while a node is selected; idle far view draws not-yet-reachable beads at 55%; (3) hub glow at 60% on screens under 600 px; (4) the first-visit welcome card is replaced on small screens by the step bar's own text (one message at a time; the card stays on desktop as a short toast, same copy, FM3 wording kept); (5) the Next-step bar sits left of the rail, one line, 40 px; (6) the iOS volume indicator is the system's, nothing to do.
Node sheet (one component, three heights): COMPACT strip at the bottom: name (display 18 px), state chip, one-line description, and one big Unlock button that carries the price ("Unlock . 300"), plus Pin and a More chevron; target height ~88 px landscape (full width minus the rail, left to right: name+state+line | Unlock | Pin | close), ~132 px portrait (two rows). Tap More or drag the handle: EXPANDED sheet to ~55% (steps checklist, why line, evolution text, meta, flavour) with Unlock still pinned. Close button stays 44 px (locked rule). On DESKTOP the same component docks at the right as a 340 px card and opens EXPANDED by default (more room), with the same order of content; hover shows the same one-line preview. Goals is the tab-bar Goals (same sheet in list form).
Sizes at 844x390: tab row 48, map 342 tall (was 290, +18%), idle nothing else covers the map except the 40 px step bar and the 194 px rail; with the strip open the map above it is ~246 px tall by full width (was 534 wide x 290 tall: 144k px2 vs 203k px2 = +41% visible map area). 390x844: row 48 + 30 strip, map 766 (was 686); strip 132 px of 844 (16%, was 53%).
Fit: stays the T4 Lantern Trails look; the panel is the same glass/brass/gold-button language; nothing new in colour. Mechanical sense: every locked state/legend/jump is preserved; only the arrangement changes.
LOCKED conflicts: none with T4/NODE STATE VISIBILITY/TREE PULL (counter badge, jump-to-next, goal pins, legend, Spirits index all kept and reachable); the T4 rule "Light/Pin always visible (Buy cut off bug)" is satisfied by the pinned Unlock; the 44 px close rule is kept (the mock used 36 px; build uses 44). "Toolbar is a solid band, never floats over map names" is satisfied (the band is the tab row).
Test/audit: tests/treescreen.test.mjs CSS regexes (.ts-btn 44, .ts-round 44, .ts-goal 48, .ts-primary 48) still hold; add tests: strip shows name + price + Unlock without scrolling at 844x390 and 390x844 (layout), freeRect uses the strip top, expanded sheet keeps Unlock visible, label cap, dim-on-select. fitaudit: add `tree-sel` (a node selected, both a long evolution node and a locked node) and `goals` panel open to fitSweep; run at normal/large/larger. Add a "no label under the bar" check.
Effort: medium (treescreen.js/css, menunav slot, one new sheet component, 3 draw rules). Balance/saves/sim: none.

### B: "Patch the panel": keep two rows, slim everything
Header: tab row 40 + toolbar 38 = 78 px (was 100; portrait 40 + 44 = 84 vs 158). Title hidden, Goals button dropped, Back left, pills and badge right; ? and Spirits stay in the toolbar. Panel stays a right side drawer but 30% wide (253 px), no Lantern|Goals tab row, no flavour/why/steps (steps behind a More link). Labels capped 14 px. See mock-optB-*.
Sizes: 844x390: map 312 tall (+8%), panel 253x293 (30% x 75%): still tall; the map beside it is 590 wide. 390x844: panel 306 px (36%).
Fit: unchanged look; good: lowest risk; weak: two rows remain, no icon/pill tab language, the drawer still covers a third of the map, and on desktop nothing mirrors the phone chrome (conflicts with the new principle unless T1 is also taken).
LOCKED conflicts: none. Test/audit: small (CSS regexes). Effort: small (1 chunk, mostly CSS). Use if Matt wants a fast visible win first and A later.

### C: "Immersive web": no tab bar on the Tree; floating glass chips and a popover
Header: the tab bar is hidden on the Tree; floating translucent pills (Menu button, gold, shards) in the top corners; map is 100% of the screen (390 / 844 tall). Tapping a node opens a 250x160 popover card anchored beside the node with name, state, Unlock; tap the card for the full sheet. Menu opens the five destinations. See mock-optC-*.
Sizes: 844x390: map 390 tall (+35%), popover 250x161; 390x844: map 844, bottom card 374x150.
Fit: most "game-like" and the biggest web view, but floating chips over the map is exactly what Matt called busy; the popover must avoid the node and the screen edges; two navigation patterns (tab bar everywhere except Tree) breaks the "one shared design language" principle.
LOCKED conflicts: "solid toolbar band, never over map names" (T4), persistent tab bar (hidden). Needs reopen of both.
Test/audit: popover collision/anchoring tests, fitaudit cannot see canvas-anchored cards; Effort: large. Risk: highest.

Recommendation: A (+ T1). C is rejected on the principle; B is the safe stop-gap.

## 5. Independent self-review (gaps found, and what the design does about them)
1. Back vs Home: there is no Home tab today; removing per-screen Back requires the Home tab in T1 (added). Results screen -> Tree shortcut: the Home tab then goes to the front door, not back to Results; accept (Results has its own Again/Main menu).
2. 44 px rule vs slimmer chrome: slim rows must keep 44 px HIT areas with smaller drawn pills (mock-optA close button was 36 px: build at 44). Audit threshold 40 px.
3. Portrait row is full: Home + 5 tabs leaves no room for the purse; portrait therefore needs the 30 px strip (Tree) or no purse (other screens). The mock-optA portrait shot overflows the row; that is why the strip is specified.
4. Larger text (A2 text size up to 1.3x): pill labels overflow; fallback = icon-only inactive tabs. Must be audited at normal/large/larger.
5. Safe areas: landscape notch/corner insets apply to the rail, the strip and the tab row (use --sa-l/r/b, A2 frame). T2 would add the left inset to the rail.
6. Gesture conflicts: the map is `touch-action: none` (pan/pinch); the sheet drag must use only its handle; map taps near the strip must not select through it.
7. First-visit state: the audit and mocks used a fresh save (0 gold, "Not yet" Unlock). A mid-game save (many lanterns lit, 24 can-light) has more rays/badges: re-shoot before Matt signs off.
8. `ts-short` is keyed to height <= 520, so small desktop windows get the phone layout today; replace by one container-query rule so desktop and phone are the same code (principle).
9. Mock fidelity: mocks inject CSS into the real DOM, so strip height (108 px) is 20 px above target (88) and the rail/purse are cloned nodes; they show the idea, not the final pixels.
10. Not audited in detail: Character hero grid, Lanterns/Nights pickers, Results, in-run HUD (separate chunks: HUD-2/PHONE-A). They inherit the new tab row only.
11. The black band is NOT explained (not reproduced). Do not claim it fixed; chunk 0 below is a probe.
12. Desktop re-baseline is a real change for Matt's playtests: he must look at desktop too.
13. Perf: Tree draw cost unchanged or lower (fewer labels); sheet is DOM only.
14. Security: no new inputs or deps; glyphs are static SVG paths; text still via textContent.

## 6. Build order if Matt picks the recommended set (each chunk small, screenshots + audit each, desktop AND phone)
0. `?probe=1` viewport probe for the black band + hardening (dvh, backdrop on #stage); Matt sends one screenshot. Independent of the rest.
1. T1 tab row + Home tab + glyphs + remove per-screen Back/duplicates (all screens), desktop mirrors.
2. Tree A part 1: remove ts-bar, rail, tab-row slot (purse), step/tip merge.
3. Tree A part 2: node sheet (strip + expanded), shared with desktop.
4. Tree A part 3: label cap, fade-on-select, hub glow; mid-game save screenshots; fitSweep with tree-sel/goals.
Each chunk: tests green + build, fitSweep at 3 text sizes x (844x390, 390x844, 1280x720), no sim/balance change (sweeps not needed; state "sim and data 0 diff"), security check (no deps), fit check, LOCKED + QUEUE updated.

## 7. Questions for Matt (one tap each, recommended first)
1. Menu chrome (all screens): T1 Lantern tabs (Rec) / T2 side rail + bottom bar / T3 slim header + menu button.
2. Lantern Web: A Quiet web + compact node strip (Rec) / B Patch the panel (fast, smaller gain) / C Immersive.
3. Big Back buttons at the bottom of Character, Settings and Almanac: remove them now that Home is a tab (Rec) / keep them.
Plain chat question (not a button): is the black band at the bottom seen in the Safari browser or in the app installed to the Home Screen? (Helps the probe.)
