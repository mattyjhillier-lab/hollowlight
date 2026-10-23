# Front door v1: title, lanterns (profiles), hero, map + night select, results return (design sheet #6)

Date 2026-10-23. Status: DESIGN ONLY, awaiting Matt (no game code changed). Unblocks: DT7 map/night select, DT3 results additions, Dawnglass UI, DT2 marks line, Fourth Card / Fifth Hook / Night Gate surfaces.
Mock-ups: docs/mockups/front-door/ (`node build.mjs && node shoot.mjs`; static HTML, game fonts + hero portraits, own headless Chrome, temp profile deleted). Recommended pages at 1280x720, 844x390@2x, 390x844@2x; option boards + flow desktop only.
Research used: docs/research/27-front-door-flow.md (front door), 31-results-screens.md (results), 39-difficulty-tiers-economy.md (tiers), 19-spirit-hunters-reference.md. Inputs: docs/design/difficulty-tiers-economy-v1.md (section 7 UI A default, 10 save), ui-identity-v2.md, LOCKED rows Front door, Results screen, UI identity v1/v2, Fonts relock, U3, Save v3, Difficulty tiers, T6.

## 0. Decisions for Matt (max 3, recommended first)

| # | Decision | A (Recommended) | B | C | Board |
|---|---|---|---|---|---|
| 1 | Title + lanterns (profiles) | **Lantern Hall**: the built title stays the first screen; a lantern chip top-left switches player; the "Whose lantern?" screen appears only with 2+ lanterns or on Switch / New game | **Three Lanterns Gate**: the three lanterns ARE the title menu | **Cover, then Hub**: press-any-key cover, then a hub with Quick Start | fd-opt-title-desk.png |
| 2 | Map + night select | **Map card + night chips** (the locked tier mock, refined): screen appears once a 2nd night or chapter exists | **Hollow map path**: painted world map, chapter lanterns on a thread, night drawer | **One "Set out" screen**: hero + map + night together | fd-opt-map-desk.png |
| 3 | Results + way back | **Badge on the locked card**: night badge, Dawnglass tile, first-dawn line, stars; Again replays the same night | **Dawn beat, then ledger**: 2-3 s ceremony on wins first | **Win leads to the map**: big button becomes "Next night" after a win | fd-opt-results-desk.png |

Taken as reversible defaults (Matt may override): first lantern needs no name (auto "Lantern 1", rename later); the map screen is skipped until there is a choice; Dawnglass purse hidden until Deep Dusk is first seen; 1-3 keys pick nights on the map screen; Tree Back returns to the screen it was opened from (from results: to the title); delete a lantern = hold 1.5 s after an Export offer.

## 1. What exists vs what is new
- BUILT (keep, no reopen): title (U3: drawn wordmark, Continue/Begin, Skill Tree, Settings, keys Enter/T/S, PWA card), hero select (U3: arched cards, "Walk with Wren" starts the run), settings + pause (U4), results (U6: locked one-screen layout, Again/Main menu/Tree), skill tree (T4-T6), save v3 with `dawnglass` + `stats.tiers` (T3b).
- NEW here: lanterns (profiles, max 3, device-only), map + night select, tier badge / Dawnglass / first dawn / stars on results, entry points and back rules.
- Mock-ups show only the new parts in context; real screens keep their built details (wordmark art, damage-share rows, PWA card).

## 2. Research (labels: OFFICIAL / COMMUNITY / OPINION / UNVERIFIED)
- Order title -> (hub) -> hero -> stage/difficulty -> run is near universal; returning players reach a run in 2-4 inputs (COMMUNITY, Vampire Survivors / Brotato guides, research 27).
- Spirit Hunters: title START / OPTIONS / CREDITS; single save, Delete Save inside Options (COMMUNITY + OFFICIAL store text, research 27/19). Chapter select UNVERIFIED.
- Hollow Knight: a separate save-slot screen after the title, 4 slots, each showing area, geo, completion and play time (COMMUNITY, widely documented; exact layout from memory = UNVERIFIED). Lesson: slots that show progress at a glance feel like "your" game.
- Hades: title -> save profile pick (several numbered slots) -> game; heat/Pact chosen in-world before a run, rewards shown per heat level (COMMUNITY; menu details UNVERIFIED). Lesson: show what harder play pays BEFORE the run (matches tier mock A).
- Brotato: danger levels unlocked by winning, picked after the character (COMMUNITY). Lesson: earned tiers next to the run start, not in options.
- Empty save slots shown to a first-timer add a decision with no meaning (OPINION, research 27; common mobile onboarding advice).
- Results: fast retry is the core loop; Again stays the big primary (OPINION, research 31, LOCKED).

## 3. Area 1: title + lanterns

| | A Lantern Hall (Recommended) | B Three Lanterns Gate | C Cover, then Hub |
|---|---|---|---|
| Plain words | Built title stays; chip top-left "Matt · Switch lantern"; Continue (whisper names hero + next night), Skill Tree, Settings, New game | Under the wordmark hang three lanterns; tap yours to enter; Settings/Tree in corners | Press-any-key cover (colour floods out), then a hub with Quick Start / Play / Tree / Settings |
| First-timer | Sees "Begin" only (no slots, no name); New game is quiet below | Sees two empty lanterns and must pick one | Extra screen, then a hub with many buttons |
| Taps to run (returning, 1 lantern) | 3 (Continue, Next, Begin) or 2 while there is no night choice | 4 | 2 with Quick Start, 4 otherwise |
| Fit | Lantern chip + "light a new lantern" wording; one look with U3 | Most diegetic | Strong Hollow colour-return moment |
| Lock check | Matches "max 3, skip profile screen when one, Continue/New Game" | CONFLICTS with "skip when only one" | Adds a screen the U3 title already covers |

A in detail
- Title (fd-title-*.png): chip top-left (lantern icon tinted per lantern, name, "Switch lantern"); purses top-right (gold, shards; Dawnglass only once Deep Dusk has been seen). Continue whisper = "<last hero> · <next night or Recommended> is waiting". Skill Tree whisper = what can be spent + teal dot when an AFFORDABLE NOW node exists (same rule as the tree's highlight). New game = quiet button "Light a new lantern · N of 3 free"; with 3 lit it opens the lantern screen in replace mode.
- "Whose lantern?" (fd-profiles-*.png): three arched cards hanging on a dashed thread (landscape) / stacked cards (portrait). Card = hero portrait of the most-played hero, name, nights played, last lit, gold/shards, night glyphs with stars. Buttons: Light it (Enter), ··· (Rename, Export, Delete). Empty slot = dashed "New lantern". Footer: "Lanterns live in this browser only. Export to keep a copy." Back (Esc) -> title.
- Save: index key (id list, active id, names) + one save v3 per lantern; legacy save copied (not moved) into lantern 1; settings stay per device (LOCKED). Names: 1-16 chars, letters/digits/space/'- whitelist, shown via textContent. Import = new lantern, or replace a chosen one after confirm.

## 4. Area 2: map + night select

| | A Map card + night chips (Recommended) | B Hollow map path | C One "Set out" screen |
|---|---|---|---|
| Plain words | Left: map art + three night chips; right: what changes, you earn, night tools, records, next light; Begin with <hero> | World map with chapter lanterns on a thread; tapping a chapter opens a drawer with three nights | Hero cards + map + night chips + Begin on one screen |
| Strength | Rewards and rules visible before the run (Hades lesson); matches the locked tier default (e) A | Strongest "8 chapters to come" promise | Fewest taps |
| Weakness | One more screen (mitigated by skip rule) | Mostly fog with one chapter; big art job; drawer hides rewards on phones | REOPENS the approved U3 hero screen and the locked flow; portrait crowded |

A in detail (fd-map-*.png)
- When it appears: after hero select, only once there is a choice (Twilight cleared so Deep Dusk is visible, or a 2nd chapter). Before that, hero select's button stays "Walk with Wren" and starts Twilight. Once it exists, hero select's button reads "Next" and the map screen remembers the last map + night per lantern.
- Header: "Choose your night", crumb "Wren › Cursed Forest › Deep Dusk", chapter thread (1 lit + 7 fogged "?" lanterns; hover/tap: "Chapter 2 sleeps in the fog. Clear Cursed Forest to see it"), purses.
- Night chips (radiogroup; glyph + name + one line; colour never alone):

| State | Look | Line |
|---|---|---|
| Open, cleared | solid brass, tier glyph, stars (filled vs outline) | "cleared 2x" |
| Open, NEW | teal NEW flag (shown once) | "Recommended next" when the rule in tiers doc 7.2 says so |
| Locked, condition | dashed border, lock glyph, teal progress bar | "Clear Deep Dusk once · 0/1" |
| Locked, gate ready in the tree | dashed, open-lock glyph | "Open it in the Lantern Web"; side card shows price + "Open in tree (T)" which jumps to `gt_cursed_forest_expert`; Begin disabled |
| Selected | 2.5 px border in tier colour + glow + focus ring | |

- Tier identity: Twilight = half sun on the horizon (amber), Deep Dusk = crescent (periwinkle), Long Night = ring + small star (pale lilac). Shapes carry meaning for colour-blind players.
- Side card: kicker (glyph + name + "harder night"), one-line headline, up to 4 plain "what changes" lines (Hollow marks line shows the mark shapes once DT2 lands; Long Night adds Hollowheart and slower heart luck), "You earn" pills (gold x, shards, Dawnglass up to N, first dawn +N in teal), Night tools line (owned tier-scoped tools: Fourth Card, Fifth Hook; "rest on Twilight" when Twilight is selected), records (best, clears, stars), next light nudge (reuses `closestUnlocks`).
- Buttons: Back (Esc), Skill Tree (T), Begin with <hero> (Enter).

## 5. Area 3: results + way back

| | A Badge on the locked card (Recommended) | B Dawn beat, then ledger | C Win leads to the map |
|---|---|---|---|
| Plain words | U6 unchanged plus: night badge, Dawnglass tile (Deep Dusk+ only), first-dawn line, star row on wins, "kept" line on deaths | Wins get a 2-3 s full-screen ceremony (colour flood, stars stamp in), then the U6 card | After a win the big button is "Next night" (opens map with the new chip lit) |
| Retry speed | Same as now (Again = R/Enter) | Slower every win | Same on deaths; different on wins |
| Lock check | Adds to the LOCKED results layout | Adds a beat (results R5 "in-world beat later" is parked) | REOPENS "Again is the big primary" |

A in detail (fd-results-win-*.png, fd-results-death-*.png)
- Win: kicker "Night 1 · Cursed Forest · Wren", badge "<glyph> Deep Dusk · first dawn", Dawn headline, colour-returns border (locked T2 accent). Card: time + bar, stats line, three tiles (gold with "x1.5 Deep Dusk", shards with breakdown, Dawnglass with "6 + 6 first dawn"), first-dawn line naming the hero still waiting, star row (Cleared / Both heroes / Bright Dawn), NEW line if a gate became buyable.
- Death: dim lantern (LOCKED), "The light dwindles", same badge, time + "short of dawn", tiles show what was kept (boss shards + boss glass after a 10:00+ fall), line "What you earned before the fall is always kept", ONE next light. No star row (no "you failed" stars).
- Twilight runs: badge shows "Twilight"; no Dawnglass tile; layout identical to today otherwise.
- Way back: Again (R/Enter) = same hero + map + night, label says which night; Main menu (Esc) -> title, Continue preselected; Tree (T, teal dot when something is affordable) -> tree, Back -> title.

## 6. Entry points (all options)
- Skill Tree: title (T), map screen (T), results (T), locked chip "Open in tree". Tree Back = where it was opened from (title/map); from results -> title.
- Settings: title (S), pause menu. Per device: audio, touch, motion; Saves section (Export / Import / Reset) acts on the ACTIVE lantern and names it.
- Pause: Resume, Settings, Main menu (abandon run, confirm).
- Esc: back one step everywhere; on the title it does nothing.

## 7. First-time players
- Fresh device: title shows Begin (no chip text beyond "Lantern 1", no Dawnglass, no New game until a run exists) -> hero select (Wren preselected, "Walk with Wren") -> run. 2 taps.
- First Twilight clear: results NEW line "Deep Dusk can be opened in the Lantern Web". Next Continue -> hero -> map screen appears for the first time with Deep Dusk "NEW" (locked-ready state if the gate is not bought; "Open in tree" explains).
- Second person on the same device: New game -> "Light a new lantern" with a name field (optional) -> hero.

## 8. Phone behaviour
- Landscape 844x390 (primary for play): title uses two-column buttons without whispers; map hides the crumb, chapter thread, 3rd/4th change lines, night tools and records; results compress to the same one-screen card.
- Portrait 390x844 (menus only; the run stays landscape): title button stack near the thumb; lanterns stack; map: art 120 px + chips 3 across, side card with 2 change lines, Begin full width above Back/Tree; results: badge + headline on top, card, Again full width, Menu/Tree under it.
- No horizontal scroll; no page scroll on any front-door screen (checked in all mock PNGs).

## 9. Accessibility
- Targets: >= 48 px desktop, >= 44 px phone; text floors 12 / 13 / 14 portrait (LOCKED U1b).
- Keyboard: arrows/WASD move focus, Enter confirm, Esc back, T tree, S settings, N new game (title), 1-3 nights (map), R again. Roving tabindex in chip radiogroup and lantern list. Focus = cream 3 px ring + flame mark (kit).
- Controller (later): D-pad = arrows, A = Enter, B = Esc, Y = Tree, LB/RB = previous/next night. Key hints hidden on touch (kit rule).
- Colour-blind: tier glyph shapes, lock glyph + dashed border, NEW is text, stars filled vs outline, Dawnglass tile has its icon and word. Protan/deutan check of the three tier colours in the build chunk (Deep Dusk and Long Night are both cool hues: shape + name carry them).
- Screen reader: chips role=radio with aria-checked/aria-disabled + condition as description; lantern cards are buttons with name + summary; reduced motion = no pulse/flood.
- Known contrast risk: locked chip NAME in lock grey (#6b7490 on #0e121c, about 3.8:1, large text OK); its condition line uses cream-dim (passes).

## 10. Fit check and mechanical sense (vs docs/LOCKED.md)
- Fit: lanterns as profiles, thread-hung arched cards, wax/brass Lantern Glass kit, Fondamento display + Alegreya Sans numerals, teal NEW, gold reserved for primary/dawn, colour-return border only on victory, tier names and Dawnglass peach-to-cyan as locked. No new fonts, colours or assets.
- Mechanical sense: rewards/rules shown before the run equal the locked tier data (HP x1.45/x2.0, gold x1/1.5/2, shards 5/7/10, Dawnglass caps 6/10, first dawn 6/10); tier tools shown only where they work (tiers decision 3 A); locked chips name the ONE condition and jump to the Night Gate node; no sim, balance or budget change (UI only, sweeps unaffected).
- Conflict check: Front door row (max 3, skip profile screen with one, Continue/New Game, device-only, settings per device) = kept by A. The row's flow "cover -> play -> profile -> hero -> map -> run": the U3 title (approved) acts as the cover; the map step is skipped while there is no choice (default, Matt may override). Results lock kept (A adds only). U3 hero screen kept (only its button label changes to "Next" once the map screen exists). Options 1B, 2C, 3C each reopen a lock (flagged in the tables).

## 11. Risks and honest weak spots
- Profiles touch saves: legacy copy, quota errors and imports are the riskiest part (FD1 gets hostile-save tests and a security review).
- "This browser only" can still surprise people (Safari 7-day eviction, private mode): export reminder on the lantern screen and in Settings.
- Skip rule means a player meets the map screen only after a clear; if Matt wants chapter teasers visible from run 1, show the map screen always (one extra tap).
- Long Night locked-name contrast (above) and two cool tier hues: verify in FD7 with the protan/deutan harness.
- Mock-ups are code-drawn stand-ins (simple forest, simple lantern, text wordmark), not final art.
- Dawnglass tile and first-dawn copy depend on DT3 rewards (not built); the marks line depends on DT2.

## 12. Build plan (small chunks; each verified: tests, screenshots 3 sizes, security, fit; Matt reviews)

| Chunk | What | Verify | Depends on |
|---|---|---|---|
| FD1 | Lantern store: index key + per-lantern save v3, legacy copy, name validation, quota handling, import-as-new/replace | hostile index/save/import tests, migration fixtures, npm test, security review | save v3 |
| FD2 | Title: lantern chip, New game, Continue whisper, purses (Dawnglass gated), tree dot | screenshots 3 sizes, keyboard | FD1 |
| FD3 | "Whose lantern?" screen: list, new, rename, export, hold-to-delete, replace mode | screenshots, a11y, no innerHTML | FD1 |
| FD4 | Map + night select (= DT7): chips + states, side card, records, nudge, remembered picks, skip rule, tree jump; hero button Next/Walk | screenshots vs fd-map, 44 px + contrast, keyboard/screen reader | DT1 data (built), FD2 |
| FD5 | Results additions (= DT3 UI): badge, Dawnglass tile, first-dawn line, stars, kept line, Again label | screenshots win/death x 3 tiers, save tests | DT3 rewards |
| FD6 | Back rules + entry points (Tree Back target, Esc, pause Main menu confirm), controller mapping stub | flow test, keyboard | FD2-FD5 |
| FD7 | Polish: colour-blind harness on tier colours, reduced motion, phone pass, weak-spot fixes | harness PNGs, Matt PC + phone playtest | all |

Order: FD1 -> FD2 -> FD4 -> FD5 -> FD3 -> FD6 -> FD7 (map/results first because they unblock the tier work; the lantern screen is only needed once a second player exists).

## 13. Security check and Fit check
- Security: design only; no dependencies, no downloads, no network. Mock pages are static, only local fonts/portraits, no runtime script beyond a touch-class toggle. Shooter uses its own headless Chrome and deletes its temp profile. Build plan: names via textContent + whitelist, index/save/import validated and clamped, import never overwrites without confirm, delete needs export offer + hold.
- Fit: Lantern Glass kit, locked fonts and colours, lantern/thread language, Hollow colour-return only on dawn; no new mechanics; UI only.
