# Phone layout v1 (DESIGN ONLY, nothing built; awaiting Matt's pick)

Branch wip/phone-design. Before screenshots: docs/screenshots/phone-layout/before-{915x412,844x390,1000x460}-{front,settings,almanac,goals,tree}.png (red = dead gutters). Measured with headless Chrome, mobile emulation, dev build.

## Root causes (measured)
1. **Fixed 16:9 stage.** src/style.css:101-111: `#app` has `padding: 0 16px`; `#stage` is `width: min(100%, 100vh*16/9); aspect-ratio: 16/9`. Phone landscape is 2.0-2.3:1, so the stage is height-limited: 1000x460 -> 818 wide (91px dead each side); 915x412 -> 732 (91px); 844x390 -> 693 (75px). On Matt's ~2000x920 phone that is the "1640px column". Only portrait (`max-aspect-ratio: 1/1`, style.css:113) goes full-bleed.
2. **Everything is sized from the stage, not the screen.** `#stage{container-type:inline-size}` and `#ui{font-size:clamp(9px,1.7cqw,20px)}` (style.css:119; touch: 11px floor, :186). Narrow stage = smaller type and bunched layouts, while the leftover 20% of the screen is empty.
3. **Canvas, HUD and overlays are all inside the stage** (`#game,#ui{inset:0}`, :117; main.js:50 sizes Phaser from the stage rect). But `.touch-layer`/`.touch-ability`/`.touch-pause` are `position:fixed` to the real screen (style.css:187-200). So in-run, controls sit relative to the screen while the HUD sits in the column: two coordinate systems.
4. **Safe-area handled piecemeal and relative to the stage.** `env(safe-area-inset-*)` appears in u4.css:4, menunav.css:2/9, treescreen.css:24/136+, title.css:5, style.css:200+. The stage already sits 75-91px from the edges, so notch and rounded corners are cleared by accident; this will become wrong the moment the stage goes full-bleed unless insets are centralised.
5. **Menus are desktop panels shrunk.** Panels use max-widths (title.css:17 640px, u4.css:55 560px / :126 760px, codex.css:78) and nested tabs inside tabs (top nav `.mnav` 46px + screen bar + inner tabs). Short-height rules key off `H<=500` (`ts-short`, treescreen.js:327; `max-height:480px` in codex.css:96+), so height is respected but width is wasted.
6. **The clipping is real scroll with no cue.** Settings > Sound: panes are `overflow-y:auto` (u4.css:146) in a panel `max-height:100%`; with ~390px of height minus nav, title, tabs and footer, the 3rd slider falls off-screen and nothing says "scroll". Almanac Foes: grid columns fit the narrow width, then clip by height (codex.css:96+). Goals panel is `width:46%` of the narrow stage (treescreen.css:136) over a tree that is also narrow. "New game" overflow: em-sized text from the shrunk #ui font in a button with fixed padding (title.css front-door buttons).
7. Portrait: supported by a second layout (style.css:113, `ts-port`, codex.css:127/153). No rotate prompt exists (no orientation logic in JS).

fit-audit (`__fitAudit`) reports 0 issues at 915x412, 844x390 and 1000x460: it only checks text vs its own box and the viewport, so it cannot see dead gutters, hidden scroll or wasted width. A new check is needed (see Verification).

## Options

### Option A (Recommended): Full-bleed stage + one safe-area frame + phone-aware menu layouts, shipped screen by screen
**What:** (1) Drop the 16:9 lock on phones (touch / short-wide screens); desktop windows keep the framed 16:9 column. (2) One `--safe-*` variable set (from env()) on `#app` and a single `.safe` frame inside `#ui` that holds all UI; the canvas stays full-bleed under it (world draws edge to edge). The touch layer moves into the same frame (removes the two-coordinate-system bug). (3) Base type from `min(cqw, cqh)` with a touch floor, so wide phones get bigger text, not tiny text. (4) A `.phone` class (height <= ~520 CSS px, wide) switches menus to a shared landscape template: left rail (nav, 48px+ targets, thumb-reachable) + right content, full width, no max-widths.
**Per screen:**
- Front door: title left, big buttons in the right third (thumb zone); New game grows to its text (min-width, no fixed padding).
- Settings: left rail = tabs, right = list; Sound rows ~44px so all 3 sliders fit at 390px height; fade-edge scroll cue if longer.
- Almanac: rail of sections; grid `repeat(auto-fill, minmax(96px,1fr))` across the full width; vertical scroll with fade cue.
- Tree + Goals: Goals becomes a slide-in drawer from the right (closed by default, ~40% open), the tree stays visible and pans so the selected node is not covered; tap outside closes.
- In-run HUD: re-anchored to safe corners (HP/timer top-left, XP bar top-centre, pause top-right inside the inset, ability bottom-right 88px, stick left zone), all inside `.safe`. Level-up cards: 3 in one row filling the width, 44px+ touch targets. Results/pause: 2 columns (stats left, buttons right, thumb side).
- Portrait: stays supported (existing layouts) plus a one-time dismissible "Best in landscape" hint; no forced rotate.
**Desktop risk:** low-medium. Desktop keeps the framed 16:9 via a gate; the new styles apply under `.phone` only. Main risk is gate mis-detection on small desktop windows (gate on `pointer:coarse` OR [height <= 520 AND aspect > 1.9]).
**Effort:** medium-large, about 6 chunks: (1) stage/safe-area/touch-layer unification + type basis, (2) front door, (3) settings + almanac, (4) tree + goals drawer, (5) HUD/cards/results/pause pass, (6) portrait hint + new layout audit. Each verified by screenshots at the 3 sizes. Affects every menu screen and the in-run UI.
**Why recommended:** fixes root causes 1-4 once, and answers (a) in-run fit, (b) full-bleed with insets, (c) phone-specific menus where scaling cannot rescue the desktop layout, (d) portrait kept but not promoted.

### Option B: Quick full-bleed only, keep desktop-style menus (scaling fix)
**What:** Only steps (1)-(3) of A: remove the 16:9 lock on phones, one safe-area frame, type from min(cqw,cqh), widen max-widths (u4.css:55/126, title.css:17), Goals panel 46% -> 38% with a Hide button, scroll-cue on clipped lists. Menus stay desktop-style panels, just wider and larger. Portrait unchanged.
**Per screen:** Front door fills width but stays a centred column; Settings Sound still scrolls (cue added); Almanac gets more columns; Goals still overlays, narrower. In-run: HUD and touch controls share one frame; cards unchanged.
**Desktop risk:** low (same gate as A).
**Effort:** small-medium, about 2 chunks. Removes the dead gutters and the double coordinate system, but nested tabs, small targets and the "desktop in a phone" feel Matt objected to remain.
**Use if:** a fast visible win is wanted first (A can follow on top).

### Option C: Dedicated phone UI (separate templates) + landscape lock
**What:** Full-bleed as in A, plus a separate phone menu implementation (own templates and CSS) built like a mobile game: side/bottom tab bar, full-screen sheets with a big back arrow, one-level navigation (no tabs in tabs), 56px targets, swipe between sections. Portrait shows a "turn your phone" screen (run pauses; resumes on rotate); portrait CSS (`ts-port`, codex portrait rules) is removed.
**Per screen:** every menu rebuilt: settings as a list of sheets, almanac as a swipeable carousel, tree with a bottom action bar.
**Desktop risk:** desktop visuals untouched, but maintenance doubles: two UIs to keep in sync with every new content type (CONTENT-GUIDE changes), more tests and screenshots, regression surface on save-linked screens.
**Effort:** large, 10+ chunks. Best final polish; drops portrait play.
**Use if:** phone is to be the primary platform.

## Answers to the widened questions
- (a) In-run: HUD, cards, results and pause fit landscape once the stage is full-bleed and anchored to safe corners; hud.css and cards.css already carry touch tweaks, the fault is where the frame sits (cause 3). Needs a real-phone check of thumb reach for the ability button (88px bottom-right, hud.css:129) and the stick zone (left 55%, style.css:189).
- (b) Full-bleed with insets: yes, but only with a single inset frame (cause 4), otherwise the notch overlaps content. `viewport-fit=cover` is already set (index.html:5); fullscreen PWA recommended.
- (c) A phone-specific menu layout beats scaling for Settings, Almanac, Tree/Goals and the front door (rail + content, drawers). A does it with shared CSS; C with separate templates.
- (d) Portrait: A keeps it and shows a gentle hint; C replaces it with a rotate screen. Recommendation: keep portrait working now (exists and tested), revisit with real use data.

## Verification plan (any option)
Extend fit-audit: (i) fail if `#stage` is under 98% of viewport width on the phone gate; (ii) fail if a menu panel needs vertical scroll without a visible cue; (iii) fail if content leaves the safe frame. Run at 915x412, 844x390, 1000x460@dpr2, 2000x920-equivalent, 375x812 portrait, and 1280x720 desktop (must be pixel-identical to today). Then Matt's real-phone test. Balance sweeps unaffected (UI only).

Security check: none needed (CSS/layout only, no deps, no input). Fit check: keeps Warm Lantern look; no sim change.
Right now: Matt picks A/B/C. Next: chunk 1 (stage + safe-area unification). Parked: portrait rotate screen.
