# Desktop: fill the window and feel like a desktop game (DESIGN ONLY, nothing built, nothing locked; awaiting Matt's picks)

Branch wip/desktop-design (from origin/dev de5b3f5). Docs and screenshots only, src untouched. Written 2026-10-30.
Source: Matt installed the game as a Chrome desktop app on Windows ("Install"): (1) two black bars either side of the screen; (2) "it doesn't really feel like I'm playing a desktop game".
Screenshots: docs/screenshots/desktop-v1/ (JPEG, half size: 1 px = 2 CSS px). `before-*` = today's dev build, headless Chrome, desktop emulation (no touch), `?debug=1` (the small perf box top right is the debug overlay, not part of the game; hidden in mocks), fresh save. `mockA-fill-*` = today's build with ONLY the stage rule changed by injected CSS (real render, real camera). `mockB-scale-*` = mockA plus a 1.33x menu scale and wider Character body (approximate: the tab row is left-shifted because CSS `zoom` was used for the mock; the build would use a scale token). Script: `mock-shots.scratch.mjs.txt` (a copy of scripts/phone-shots.mjs with a `SHOT_CSS` hook; not part of the game).
Sizes: 1920x1080 (F11 / true full screen on a 1080p monitor), 1920x1001 (the installed app window maximised on 1080p: screen 1080 minus taskbar ~48 minus app title bar ~31; ESTIMATE, the probe below confirms), 1600x900, 1440x900 (16:10), 1280x720, 2560x1440, 2560x1080 (ultrawide 21:9). A real `chrome --app=` window cannot be opened headless; its only difference to a tab is the viewport size, which these sizes cover (normal tab maximised on 1080p is ~1920x945, worse than the app window).

## 1. Where the bars come from (root causes, measured)
B1 (THE cause): `src/style.css` `#stage { width: min(100%, 100vh * 16/9); aspect-ratio: 16/9; border-radius: 10px; glow border }` inside `#app { padding: 0 16px }`. Desktop windows keep a framed 16:9 card. PHONE-A removed this lock only under `html.phone` (touch-first OR height <= 520 and >= 1.9:1, src/ui/phone.js PHONE_QUERY), so no desktop window ever gets the full-bleed stage.

| Window (CSS px) | Stage | Dead area |
|---|---|---|
| 1920x1080 (F11) | 1888x1062 | 16 px sides + 9 px top/bottom (nearly full) |
| 1920x1001 (installed app, maximised) | 1780x1001 | **70 px black bar each side** (Matt's report) |
| 1920x945 (normal tab) | 1680x945 | 120 px each side |
| 1600x900 / 1280x720 / 2560x1440 (16:9) | width - 32 | 16 px sides |
| 1440x900 (16:10) | 1408x792 | **54 px top and bottom** (letterbox) |
| 2560x1080 (21:9) | 1920x1080 | **320 px each side** |

Not the cause: Phaser. `src/main.js` uses `Phaser.Scale.NONE` with a canvas = stage size x DPR, and RunScene's camera zoom comes from `zoomFor(W, H)` (src/gfx/style.js: ~300 world units on the short side, long side capped at 620). So the in-run view ALREADY adapts to any stage shape (phones prove it); it is only the stage box that is locked. Not the cause either: the 640x360 logical size (it is the sim's data, `balance.json view`, not the render size) and the manifest (see B4).
B2: `#app` padding 16 px + rounded glow border: even a 16:9 window shows a thin dark frame; it reads as "a web page with a game embedded in it".
B3: `#ui` type is `clamp(9px, 1.7cqw, 20px)` and the HUD unit `--hu` is `clamp(.7px, .08cqw, 1.5px)`, both capped. Menus are mostly real px / vh with max-widths (tab row 1000 px, Character 1180 px, cards 900 * --u). Above ~1200 px stage width nothing grows any more.
B4: manifest `display: fullscreen` + `display_override [fullscreen, standalone, minimal-ui]`. Desktop Chrome does not open an installed app full screen; it falls back down the chain to `standalone` (a normal window with a title bar). [COMMUNITY/INFERRED: the fallback chain is documented by Chrome (developer.chrome.com display-override; web.dev), desktop behaviour is consistent with Matt's window; the `?probe=1` overlay (C0, already built) shows the real display-mode on his PC.] So the app window is ~1001 px tall on a 1080p screen = not 16:9 = bars (B1).

## 2. What makes it feel "not a desktop game" (seen in before-* shots)
F1 The framed rounded card in black (B1/B2): the strongest "web page" signal.
F2 Narrow centred columns: front door is one ~470 px column at 1920 (before-1920x1001d-front); tab row max 1000 px; Character body max 1180 px; at 2560 wide the menus use ~40% of the width (mockA-fill-2560x1080d-chars).
F3 Type and controls do not grow with the screen: body copy 12-14 CSS px on Character/Almanac/Settings at 1440p; tab row fixed 48 px; the purse pills 30 px. Reading distance on a desktop (60-70 cm) wants bigger, not equal, text.
F4 Phone-shaped panels stretched: the Character detail frame fills the full height with 3 lines of text (before-1920x1001d-chars: ~75% of the frame empty); the Tree node sheet is the phone component.
F5 Hover/keyboard affordances are thin: key badges exist on the front door (Enter/T/S) and level-up cards (1-3), the tab row has arrow-key roving, but no hover glow/preview on most tiles, no visible key hints on tabs (no 1-6 keys), no tooltips on Character perks or Almanac tiles, Tree shows no hover preview text.
F6 The window chrome: standalone window with the Windows title bar and the game's own thin frame inside it; nothing says "game" (no full-screen by default, no window-controls integration).
F7 In-run (before-2560x1080d-hud): the world is letterboxed into a 1920 box, 640 px of black at the sides; HUD corners are pulled in with it.

## 3. (a) Filling any window, including the in-run world view: THREE options

Fairness first (applies to all three): the SIM does not change. The sim's spawn ring (`spawnDistance` 340), despawn (510), weapons and the bot all use fixed numbers; the bot never renders. ONE existing render -> sim feed is relevant: RunScene sets `sim.view.hw/hh` from the camera every frame (EN3-EN5: telegraph enemies only START a tell inside the real view). That feed already varies today between phones and desktop; filling desktop windows only produces values inside the same range phones already produce (`zoomFor` caps the long side at 620 units). Visible world AREA is roughly constant by design: 16:9 533x300 = 160k units^2, 16:10 480x300 = 144k, 21:9 620x262 = 162k, iPhone 2.17:1 620x285 = 177k. So a wide window does NOT see meaningfully more world; it trades height for width. Two honest edge notes: (1) spawn ring 340 > max half-width 310, so foes still enter from off-screen at any shape; (2) Thunder Judgment's radius 180 (LOCKED W11b "inside the 640x360 view by construction") is already larger than today's visible half-height (150 at 16:9, 131 at 21:9), so some smites land just off-screen vertically today; pre-existing, not caused by this change, flagged for Matt (no fix proposed here; it is a sim number).

### A1 (Recommended): Full-bleed stage everywhere, same camera rule as phones, HUD safe frame on ultrawide
Plain words: the game fills every window, edge to edge, like it already does on phones. The world is drawn by the same `zoomFor` rule (no new camera maths). On very wide screens (wider than ~2.1:1, e.g. 21:9) the HUD stays inside a centred 2.1:1 "safe frame" so the health lantern and the ability button are not in the far corners; the world still fills the whole width.
How: move phone.css A1 rule to the base (`#app` no padding, `#stage` 100% x 100%, no radius/glow) for every window; the menu backdrop paints `#stage`; HUD margin vars `--ml/--mr` = max(sheet margin, (W - 2.1H)/2). No sim/data change. `html.phone` stays only for touch layouts (not for the stage).
Mocks: mockA-fill-1920x1001d-*, mockA-fill-1440x900d-*, mockA-fill-2560x1080d-* (hud, levelup, front, chars, tree). Already looks right in-run; the HUD on 21:9 shows why the safe frame is needed (lantern and ability are 1000+ px apart).
Perf: canvas grows from 1780x1001 to 1920x1001 (+8%) at 1080p; 2560x1080 from 1920x1080 to 2560x1080 (+33% pixels, fill-rate on an RTX 3060 negligible; integrated GPUs: existing quality tiers + LOWMEM DPR cap already apply). Life-map / lighting layers are sized to the visible world (constant area), not the pixels. iPhone: unchanged (already full-bleed).
LOCKED conflicts: "PHONE LAYOUT PICK ... Desktop look stays ... desktop screenshots must stay unchanged" is already reopened by MENU CHROME (2026-10-30, "desktop mirrors phone"); record this as part of that reopen. Camera rule (zoomFor) unchanged. No conflict with the 640x360 sim view.
Tests/audit: tests/style.test.mjs zoomFor unchanged; add: stage rule is full-bleed without html.phone (CSS regex), HUD safe-frame margin pure function (16:9 -> sheet margin, 21:9 -> centred 2.1:1), fit-audit desktop sizes 1920x1001d, 1440x900d, 2560x1080d (menu + run) with the existing dead-gutter check now required to pass on desktop; nightlook test (uses zoomFor) unchanged; sweeps not needed (sim and data 0 diff, state it).
Effort: small (CSS + one HUD margin function + audit sizes). One chunk.
Risk: menus on ultrawide get wider backgrounds; handled by (b).

### A2: Full-bleed with an aspect clamp: fill between 16:10 and ~2.1:1, beyond that decorative side panels (not black)
Plain words: like A1, but on ultrawide the playfield stops at 2.1:1 and the leftover sides show a painted Hollow border (dark forest edge, slow fireflies), never black bars. Everyone sees exactly the same world shape range.
Fairness: strictest (max 2.1:1, matches the iPhone range), Thunder smites stay as today.
Perf: as A1 minus the ultrawide sides (cheap static art). Effort: medium (side-panel art, code-drawn; must pass the fit check). Risk: still "bars", just prettier; on 16:10 identical to A1.
LOCKED: same reopen as A1; new art needs the fit/identity check.

### A3: Keep the 16:9 stage, scale it to cover (ENVELOP-style crop)
Plain words: the 16:9 game is enlarged until it covers the window and the overflow is cut off (on 16:10 the left and right edges are cut; on 21:9 the top and bottom).
Why not recommended: it crops the HUD and menus (they live inside the stage), so every screen would need safe-area rules for cut edges; on 21:9 it cuts 25% of the height (world view 533x225 effectively: fewer foes visible vertically = UNFAIR and harder); it duplicates what zoomFor already does properly. Effort: medium; risk: high (clipped UI, fairness).
Recommendation: A1. It reuses the shipped phone behaviour, fixes Matt's bars in one small chunk, and keeps the sim untouched.

## 4. (b) A desktop layout that mirrors the phone design but uses the room: THREE options
Same principle as LOCKED MENU CHROME: one stylesheet, container queries on the stage's own size, same components; desktop adds room, hover and keys.

### B1 (Recommended): "Desktop room": one UI scale token + roomy layouts per screen + hover/keys
Plain words: everything grows with the window up to a comfortable reading size, and each screen uses the extra width for a second or third column instead of a bigger empty box.
1. Scale: one `--ui` token on `#stage` = clamp(1, stage height / 900, 1.5) for desktop (phones keep 1). Text, tab row (48 -> up to 64 px), pills, panels multiply by it. Replaces the 20 px cap and the separate --hu/--u caps for desktop (they become `--ui`-based). Reading size at 1080p: body ~17-18 px, titles ~40 px (mockB-scale-*: 1.33x).
2. Layout per screen (container query >= 1100 px stage width):
   - Front door: wordmark + Begin column stays centred; Lantern chip and purse in the top corners (as now); a right "last night" card (best time, Bond, next goal) uses the empty side; install card hidden in the installed app (already) and in full screen.
   - Character (Kindred): 3 columns: hero list | portrait + ability + Bond | perks/keepsakes/wardrobe; detail frame sized to content (no 75% empty box).
   - Tree: bigger web (map gets the full width), node sheet DOCKED right (already LOCKED for desktop, C3), opens expanded; HOVER on a lantern shows the compact strip as a tooltip preview; keys: arrows pan, +/- zoom, Enter unlock, N next best (rail "Best next"), Esc close.
   - Goals: list and the web side by side.
   - Almanac: grid becomes 6-8 columns with the selected entry's detail panel on the right (no modal).
   - Settings: two columns (left: sections; right: rows), the existing tabs become the left list.
   - In-run HUD: same sheet, scaled by `--ui` (A1 safe frame on ultrawide); level-up cards capped at ~360 px wide each, centred (today they grow with cqw to 360+ at 1920 already: fine), key badges kept; pause menu gains key hints (Esc resume, R restart?, only for existing actions).
   - Results: two columns (summary | recap bars), Again/Menu with Enter/Esc badges.
3. Hover + keys everywhere: hover glow on every tile/button (same glow as the selected state at 50%), tooltips via the existing `.lg-tip` component, number keys 1-6 on the tab row with small key badges shown only when the last input was keyboard (app.inputKind already tracks it), Esc = back/Home.
4. Window: Settings "Full screen" row exists; add the F11-style shortcut F (only on menus/pause) and remember the choice per device (localStorage, validated boolean).
Fit: no new colours or art; the same lantern-glass components, just more of them side by side; keeps Warm Lantern restraint.
LOCKED conflicts: none beyond the MENU CHROME reopen (desktop mirrors phone, laid out for more room = exactly this). Keys: Space/1-4/R/Esc in-run are LOCKED; 1-6 on the tab row are menu-only (no clash; level-up cards are not on menus). F for full screen is new (menus only, browsers allow requestFullscreen from a key press).
Tests/audit: fitaudit layoutAudit at 1280x720d, 1920x1001d, 2560x1440d, 2560x1080d x text sizes normal/large/larger (no clipping, no overlaps, targets >= 44 px scaled); tests: --ui pure function, key map (tab keys only on menus, never in-run), tooltip text via textContent; re-baseline desktop screenshots (already expected by MENU CHROME). Saves: one new validated boolean (full-screen preference) or none.
Effort: medium-large, in chunks: D1 scale token + front door; D2 Character + Settings; D3 Almanac + Goals + Results; D4 Tree hover/keys; D5 hover/tooltip/key-hint pass. Each chunk small, screenshots desktop + phone (phone must not change except shared fixes).
Perf: DOM only; none in-run.

### B2: "Scale only": one global UI scale, layouts untouched
Plain words: everything is simply drawn bigger on big windows (the mockB-scale shots without the Character widening).
Pros: one small chunk, fixes tiny text. Cons: still a phone layout blown up (empty Character frame, narrow lists): does not answer "doesn't feel like a desktop game", only "too small". Effort: small. LOCKED: none.

### B3: "Desktop shell": a persistent left sidebar (hero, purse, nav) + content area, different from the phone row
Plain words: desktop gets a classic PC game frame: a left column with the lantern, hero portrait, gold/shards and big nav buttons; content on the right.
Pros: very "PC game". Cons: a second navigation pattern breaks the LOCKED principle "ONE shared menu design language, desktop mirrors phone" and the LOCKED T1 lantern tab row; needs a reopen; largest effort. Not recommended.
Recommendation: B1 (B2 is the fallback if Matt wants a single fast chunk first; it is a strict subset of B1 step 1).

## 5. (c) Manifest display mode on desktop: THREE options
### C1 (Recommended): keep `fullscreen` first for phones, add `window-controls-overlay` + `standalone` for desktop, plus an in-game full-screen toggle (exists) and key F
Manifest: `display: "fullscreen"`, `display_override: ["window-controls-overlay", "fullscreen", "standalone", "minimal-ui"]`. Desktop Chrome/Edge pick window-controls-overlay (WCO): the title bar disappears and the game draws up to the top edge, with only the small min/max/close buttons floating top right; phones ignore WCO and take fullscreen as now [OFFICIAL: WCO is a desktop-only Chromium display mode; fallback chain per the manifest spec]. The game must keep the top-right 140x32 px area (env(titlebar-area-*)) free: the tab row and purse read `titlebar-area-x/width` (the existing `--sa-*` frame gets a `--tb-*` sibling; 0 elsewhere) and the row gets `-webkit-app-region: drag` on empty space only so the window can be moved. Plus Settings full screen (exists) and F key (B1.4) for true full screen.
Pros: looks like a native game window, no title bar, fills the window (with A1). Cons: one more inset to audit; users can toggle WCO off (falls back to standalone = still fine with A1).
Security: no new permission; manifest change only; drag region must not cover buttons (tested). Installed users get the new mode after Chrome refreshes the manifest (can take a day; reinstall is instant).
Effort: small-medium. LOCKED: "PWA orientation landscape" kept; PWA-1 manifest `display: fullscreen` kept for phones.
### C2: `standalone` only on desktop (status quo in practice)
Already what Chrome does. With A1 the bars go; the Windows title bar stays. Effort: none. Fine as a stop-gap.
### C3: Launch full screen automatically on desktop
Not possible from the manifest on desktop Chrome (falls back, B4); would need `requestFullscreen` on the first click (must be a user gesture), which surprises players, traps alt-tab habits and Esc conflicts with the game's pause key (Esc first exits browser full screen). Rejected; keep it a choice (Settings + F).
Recommendation: C1 (WCO) after A1; C2 if Matt prefers zero risk.

## 6. Summary of costs
| Pick | Effort | Perf | Sim/balance | Saves | LOCKED |
|---|---|---|---|---|---|
| A1 fill | small, 1 chunk | +0-33% pixels on wide screens, none on phones | none (sim view feed stays inside the phone range) | none | part of the MENU CHROME reopen of "desktop look stays" |
| B1 desktop room | medium-large, 5 chunks | DOM only | none | 0-1 validated boolean | same reopen |
| C1 WCO | small-medium | none | none | none | none |
Order: A1 -> C1 -> B1 D1..D5. A1 alone answers complaint (1); A1 + B1 D1-D2 answer most of (2).

## 7. Independent self-review (gaps and what the design does about them)
1. App-window size is an estimate (1920x1001). The bars exist for ANY non-16:9 window, so the cause holds; the exact px is confirmed by `?probe=1` on Matt's PC (no need before building A1).
2. Desktop fallback of `fullscreen` is inferred from docs + Matt's window, not from a Chromium source line: labelled; probe shows display-mode.
3. `html.phone` also matches short wide desktop windows (<= 520 tall, >= 1.9:1): after A1 the stage rule no longer depends on it, but phone menu layouts still do; B1 should finish the move to container queries (as MENU CHROME already requires).
4. Thunder Judgment off-screen smites: pre-existing (hh 150 < 180 at 16:9); A1 on 21:9 makes it 131. Flag to Matt; A2 (2.1:1 clamp) would hold it at the phone worst case. Not a reason to block A1 (phones already at 142-150).
5. Telegraph tells use the live camera view (sim.view): the sim output for a seed can differ by window shape (already true phone vs desktop). Bot sweeps use the default 266x150, so balance numbers are unaffected; replays are not a feature. Recorded, no change.
6. Ultrawide HUD corners (mockA 2560x1080 hud): the safe frame fixes it; must be in A1, not later.
7. Level-up at 2560x1440: cards scale via --u capped at 1.5; with B1 `--ui` they must keep 3 cards on one row up to 2.5x; audit it.
8. Text size settings (normal/large/larger) multiply with `--ui`: cap the product so large text at 1.5 does not overflow tiles (audit larger at 2560x1440).
9. Multi-monitor / window drag between DPRs: renderSize already re-measures on resize; DPR cap 2 kept.
10. WCO drag region over the tab row: clicks on tabs must still work; only empty row space drags; test with a real install (Matt) since headless cannot show WCO.
11. Screens not shot in every size (Settings/Goals/pause/results only at 1920x1001 and 2560x1080): the cause (stage rule) is shared, so all screens behave the same; B1 chunks re-shoot each.
12. Security: no new deps; manifest change only; any new stored preference validated like PWA dismiss (untrusted storage). npm audit (worktree, fresh npm ci): 1 moderate in vite 6.4.4 (dev server `server.fs.deny` bypass, dev only, not in the built game); fix is vite 6.4.5 outside the pinned range: test on dev before upgrading, never `--force`.
13. Keys are remappable (src/input/keymap.js has pick1-pick6 on Digit1-6): tab keys 1-6 and F must go through the keymap, only on menus, and yield to a player's remap.
14. Fit: A1/B1/C1 add no colours, no new art (A2 would add side art; needs the identity check).

## 8. Questions for Matt (one tap each, recommended first)
1. Filling the window: A1 fill every window like phones, HUD kept in a centred frame on ultrawide (Rec) / A2 fill up to 2.1:1, painted forest edges beyond / A3 enlarge-and-crop.
2. Desktop feel: B1 bigger text + roomier multi-column screens + hover and key hints, in 5 small chunks (Rec) / B2 just scale everything up (one chunk) / B3 separate PC-style sidebar.
3. Installed app window: C1 no title bar (window-controls overlay) + F key for full screen (Rec) / C2 keep the normal window title bar / C3 force full screen on first click.

## 9. Build status (wip/desktop-build, 2026-10-31)
- A1 full-bleed, C1 window-controls-overlay: built earlier on this branch.
- D1 DONE: Settings > Picture > "Menu size" (Auto / Normal / Large 1.25x / Largest 1.5x, `settings.uiScale`, whitelisted in `sanitize`, no save version bump, same as `textSize`). Mechanism: `#ui` gets CSS `zoom: var(--uik)` and is its own size container; `scripts/unitscale.mjs` rewrites every `vh`/`vw` in `src/**.css` to `var(--vh1)`/`var(--vw1)` (= 1vh / --uik). `--uik` = min(want, 1.5, h/600, w/960), floored at 1; always 1 on phones; Auto = h/900. The ultrawide safe frame is measured in the zoomed window. Tooltip nudge divides by the zoom.
- D2 DONE: Character (two flowing columns, frame sized to content) and Settings (left section rail, two columns of rows) at >= 1100 virtual px (`src/ui/deskroom.css`, every rule `html:not(.phone)`). Almanac (grid + detail panel) and Results (hero | summary) were already two-column at desktop sizes after A1; left as they are.
- D3 DONE: Tree hover preview (mouse only: name, state, 110-char line) and a key hint strip (hidden on touch / phone / small tree). The docked right panel already existed; unchanged.
- D5 DONE: hover glow on Character tiles, Almanac items, Goals rows, Settings choices and tabs; number-key badges on the six tabs (only on Home / Tree / Goals / Settings, where the digits are free; shown when the keyboard was the last input or while hovering the tab row); 1-6 jump to tabs and F toggles full screen, both through the key map (tabs = pick card 1-6 keys; new `fullscreen` action, default F, validated like the others, an old key map gets the default only if the key is free). Never in a run (F also works on the pause menu).
- Not done / deviations: no stored "full screen" preference (auto-restoring full screen needs a user gesture, which C3 rejected); Almanac grid not widened to 6-8 columns; Tree node sizes do not scale with Menu size (the map is drawn in canvas pixels), only its panels and chrome.
- Desktop polish (wip/desktop-polish, 2026-10-31): Almanac foes grid 6 columns >= 1400 virtual px and 8 >= 1800 (deskroom.css, container query, html:not(.phone)); spirit sockets no longer stretch tall; Lantern Web lanterns, labels, badges and hit areas scale by `--uik` (Menu size) in `treescreen.js` (`ukNow`); `scripts/desktop-keys-probe.mjs` drives real 1-6 / F key events, ?probe=1 and the boot guard in an --app window (display-mode window-controls-overlay is a matchMedia stub: CDP cannot emulate it, so the CSS titlebar-area rules are not exercised). Not done: no real WCO window test (needs an installed PWA on Matt PC).
