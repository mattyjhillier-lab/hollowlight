# Codex + unlock celebrations v1 (release gate 11)

Status: DESIGN ONLY, not locked. Mock-ups: docs/mockups/codex/ (true size: 1280x720, 844x390@2x, 390x844@2x). Owner decisions at the end.

## 0. What is already locked or built (conflict check inputs)
- CLAUDE.md: "Recipes hidden until discovered (codex later)". skill-tree-v2: the tree never shows a recipe pair; results/codex reveal it after the first take.
- E9 (LOCKED, built): evolutions.json has `codex` (one quiet line) + `cue` = `evo_<id>` per evolution; the evolution plate shows "Recipe: A + B" only on the first ever take; `stats.evolved[id]` IS the discovered record. "No codex screen" yet.
- TREE PULL PRINCIPLE (LOCKED): fog teasers; COMPLETION REWARDS + "THE HOLLOW REMEMBERS": a finished cluster lights its emblem and awards a title + cosmetic; hub lantern brightens with total progress; title backdrop regains colour as the tree fills (visual only).
- skill-tree-v2 section 11: tree emits `tree:wake {id, kind: heart|socket|lantern}`, queued max 3 per screen; v2 ships the minimum (glide, thread draw, watermark colour 0.6 s, reduced motion instant). "The codex chunk adds the full celebration and sound on the same event."
- Almanac tool cluster (tree, built): Habits / Weakness / Tells per foe (kill-count gates) + **Full Almanac** (`bs_page`, INERT): "The codex pages light up and chests show one more Blessing". Its `info: 'codex'` effect has no meaning yet; this sheet gives it one.
- Hunter's Eye (`cd_bars`, built): bars + mark names on Hollow-marked foes.
- Audio (LOCKED, built): all code-made; cues `tree_light`, `tree_whole`, `results_win`, `ui_step`, level-up motif, evolution beat; Calm sound halves/limits; T0 cues never dropped.
- Front door (LOCKED): entry points title (T tree, S settings), map, results; Esc = back one step; results = one-screen card with ONE nudge line (`bank.newly`, "+N").
- First minute (LOCKED): whispers one at a time, never over a toast/banner/evolution plate.
- Save already records almost everything a codex needs: `stats.killsByEnemy`, `bossKills`, `evolved`, `weaponsUsed`, `charsUsed`, `chapters`, `markedKills`.
- BIBLE voice: quiet, warm, a little sad; "Gold is a promise" (gold only for evolutions/dawn); nothing the Hollow touches has a face.

## 1. Research (how comparable games do it)
| Game | Collection log | Unlock moment | Label | Lesson |
|---|---|---|---|---|
| Hades | Codex opened any time (also mid-run, game paused); entries per character/foe/boon; text unlocks in stages as you meet or kill more; "?" until met | Small corner note "Codex updated"; nothing stops play | COMMUNITY (wiki, play) | Staged text by count turns grind into lore; never interrupt combat |
| Hollow Knight | Hunter's Journal: entry appears on first kill with a corner pop-up; full notes need N kills ("Defeat N more to decipher"); completing all = reward | Tiny pop-up + sound, no pause | COMMUNITY (wiki) | Kill-count reveal is the perfect fit for our Almanac nodes (they already use kill counts) |
| Vampire Survivors | Collection grid from the main menu: "?" silhouettes for unfound items; evolution recipes visible once found; unlocks shown as a queue of pop-ups after the run | Queued "New unlock" cards at run end, one tap each | COMMUNITY | Queue at results, not mid-run; a grid of "?" makes the gap visible and pulls replay |
| Vampire Crawlers (VS spin-off) | Grimoire recipe book, readable in-run, shows discovered recipes | n/a | COMMUNITY (docs/research/35) | In-run read access to KNOWN recipes is fine; unknown stay hidden |
| Spirit Hunters | No strong codex; unlocks live in the node web; achievement-gated unlocks felt grindy | Node lights in the web | COMMUNITY / OPINION (docs/research/19) | Do not hide progress; show every condition and its progress |
| Death Must Die | Progress bars toward unlocks on the recap | Bars fill on results | COMMUNITY (docs/research/31) | Bars beat plain text for "almost there" |
| General (GDC talks on reward pacing) | - | Tier the fanfare by importance; frequent small, rare big; let players skip | OPINION | Fanfare inflation kills meaning; respect skip + reduced motion |

Risks seen across them: spam (VS dozens of pop-ups after a big run), spoilers (wikis do it anyway, so a fair in-game hint beats a wiki trip), dead collections (a list with no pull).

## 2. Decision 1: codex structure and where it lives
**A (Recommended) "The Almanac" book, one screen, four pages.** Named after the existing tree cluster (one name, one idea: "what you have learned of the Hollow"). Tabs: **Foes** (bestiary, Hollow marks), **Spirits** (5 weapons x 3 evolutions, recipes), **Hollowlighters** (heroes, abilities), **Nights** (Cursed Forest + tiers, boss, lore pages). Entry: title button "Almanac" (key **J**, free; A is movement), results ("Almanac" small link when something new was written), pause menu (read-only, game paused), tree Almanac cluster heart ("Open the Almanac"). Back = where it was opened from (front-door rule).
- Pros: one place, fits the lantern-and-book world, mirrors Hades/VS; pause access lets players check a known recipe mid-run (Grimoire lesson). Cons: one more screen to build (~4 small chunks).
**B. Codex inside the Lantern Web.** Each constellation heart opens its weapon page; Almanac cluster opens foes. No new screen. Pros: cheapest, ties codex to the tree. Cons: tree is already dense; heroes/nights have no natural home; no pause access.
**C. Results-and-pause journal only.** A "Hunter's page" panel on results and pause listing what this run added, no browsing hub. Pros: tiny. Cons: no "?" grid to pull replay; fails the release gate's "codex screen".

Plain flow (A): Title -> Almanac (J) -> Foes tab opens on the newest entry (NEW dot) -> tap a foe -> entry slides in (portrait: full-screen sheet) -> Esc back to list -> Esc back to title.

## 3. Decision 2: what is recorded and how it is revealed
**A (Recommended) Staged pages from the save you already have + a riddle hint from Full Almanac.**
- Data: derived from existing stats (no gameplay save change). One new small field `codex.read` (per-entry bitset, validated, unknown ids dropped) only for NEW dots, and `titles` (ids from a fixed list).
- Foes: never met = grey silhouette (mask outline only, no name: "?????", "Somewhere in the Cursed Forest"). First kill = name, portrait, one line. Further lines appear at the SAME counts as the Almanac tree nodes (Habits / Weakness / Tells thresholds), so the book and tree tell one story: "Next page at 1,000 Fell Wolves (612)". Hollow marks get their own row once seen.
- Spirits: each weapon page shows 3 evolution sockets. Discovered = name, verb, codex line, recipe ("Pack size + Rend"), times taken. Not discovered but tree socket lit = sealed socket with the verb word only ("TRAILS") and "Not yet found". Socket not lit = fog ("???"). **Full Almanac** (`info:'codex'`) adds ONE riddle per undiscovered evolution naming ONE stat of the pair, never both: "The pack leaves light where it runs fast." Recipe stays hidden (locked rule kept: one half is a hint, not the recipe).
- Heroes / Nights: unplayed hero = silhouette + its unlock condition; nights show clears, best time, stars, first dawn; lore pages (BIBLE origin myth in 4 short pages) open with chapter progress (first night, first dawn, Deep Dusk clear, Long Night clear).
- Progress counts on every tab ("Foes 7 / 10", "Evolutions 4 / 15") and a book total feeding the hub lantern brightness.
**B. Strict fog.** "?" and counts only; no hints ever; recipes only by playing. Pros: purest discovery. Cons: 15 recipes x 6 stat pairs is luck for new players (docs/research/18 flagged this); players go to wikis.
**C. Usage-led hints (no tree link).** Lifetime kills with a weapon reveal hint lines (10k: one stat, 40k: rank hint). Pros: rewards playing the weapon. Cons: duplicates the Almanac tree cluster's job; Full Almanac stays meaningless.

Sample copy (Hollowlight voice, short, warm, a little sad):
- Fell Wolf (first kill): "It still runs with a pack. It no longer knows why."
- Fell Wolf (Habits page): "Hunts in twos and threes. Turns when the lantern turns."
- Grave Crow: "It counts the fallen. It has lost count."
- Root Crawler: "Slow, patient, hungry. The Treant's fingers."
- Elder Treant: "Its bark is every mask in the forest."
- Silhouette: "Something waits deeper in the Cursed Forest."
- Riddle (Lightfoot Pack): "The pack leaves light where it runs fast."
- Lore page 1 title: "Before the Long Dusk".

## 4. Decision 3: celebration scale and rules
**A (Recommended) Three sizes by importance, queued out of combat, one "The Hollow remembers" ledger at results.**
| Size | What | On screen | Sound |
|---|---|---|---|
| Small | New foe page, new lore line, Habits page, Hollow mark seen | One ledger line on results ("The Hollow remembers: Stoat Piper"); NEW dot in the Almanac | none (results already plays) |
| Medium | Evolution discovered (first take), tree socket/heart wakes, weapon unlocked, title earned | Card on results (~1.2 s, tap/any key skips): emblem in role colour, name, one line; tree: existing glide + thread draw + chime | `tree_light` |
| Big | New hero, new night/chapter, constellation whole, Almanac page complete, Full Almanac | Full-screen 2-2.5 s: emblem fills with colour, title backdrop gains a band of colour ("The Hollow remembers"), then lands on results | `tree_whole` (motif + chord) |
Rules: nothing new interrupts a run (E9 plate, whispers and the existing NEW card note stay as they are); queue max **1 big + 3 medium** per results, the rest folds into "+N more in the Almanac"; same item never celebrated twice (keyed on id, written to save); big moments always skippable (any key / tap) and never auto-repeat; order big -> medium -> small; a defeat still gets its medium/small items (no punishment) but never a big flood (big waits for the next title visit, "while you were away" line). Gold rim only on evolution cards (BIBLE: gold is a promise). **Calm**: no flood, no zoom, no particles; 120 ms fades; big becomes a static card; sound follows Calm sound (no deep duck). Screen reader: each item announced once via the results live region ("The Hollow remembers: Lightfoot Pack, recipe Wolf speed and Bite power").
**B. All in place, no results moments.** Tree wakes when you open the tree, Almanac shows NEW dots, results shows a count line. Quietest; misses "wow" the release gate wants.
**C. Live toasts in-run (Hollow Knight style) + results.** Corner toast on first kill of a new foe and each count page. Most immediate; spam risk in hordes (10 types in the first minutes), fights with whispers/evolution plate in the same slot.

Completion rewards (implements the locked principle, no power): per Almanac tab complete -> title ("Keeper of Foes", "Friend of Spirits", "Walker of Nights") + a cosmetic (lantern chip ornament; a pressed flower on the Almanac cover); whole Almanac -> title "The Hollow Remembers" + the title backdrop's last grey band turns to colour. Titles shown under the lantern name on the title chip and lantern cards (one picked; validated id).

## 5. Phone, keyboard, accessibility
- Keyboard: J opens Almanac (title / pause), Tab / Shift+Tab or 1-4 switch pages, arrows move in the grid, Enter opens an entry, Esc back. Controller: LB/RB pages (with the FD6 stub).
- Phone landscape 844x390: list left (2-col grid), entry right; portrait 390x844: grid 3 across, entry as a full-height sheet with a big Back. Targets >= 44 px, text >= 12 px (13 portrait).
- State never colour-only: silhouette + "?????" + lock glyph; NEW as text; sealed socket has a seal glyph.
- Screen reader: tabs role=tablist; entries buttons named "Fell Wolf, 612 slain, next page at 1000"; unknown = "Unknown foe, Cursed Forest".
- Reduced motion / Calm as above. All text via textContent; save fields validated.

## 6. Fit + mechanical sense
- Fit: a lantern-lit book of what the Hollow took and what you gave back; silhouettes = grey/hollow, found entries gain colour (IDENTITY "colour = life"); gold kept for evolutions; quiet one-line voice matches evolution codex lines.
- Mechanics: zero sim change; power only from the already-locked Full Almanac Blessing choice; riddles reveal half a recipe (keeps "recipe hidden" while fixing the luck problem); kill-count pages reuse Almanac node thresholds, so chasing a page also chases a tree node (TREE PULL axis 2).
- LOCKED conflicts: none found. Two meanings set here need Matt: (1) Full Almanac's `info:'codex'` = riddles (2) titles/cosmetics list. In-run access is pause-only (no new HUD).

## 7. Risks
- Results card already one-screen tight: the medium cards play BEFORE the card settles, the ledger is one line + "+N" (no layout growth). Screenshot check at 844x390.
- Spoilers: riddle names one stat only; recipes on the evolution plate unchanged.
- Spam after a big first run (many first kills): small items fold into one ledger line.
- Save growth: `codex.read` bitset ~40 bits now, grows with content; capped and validated, versioned migration.
- Portraits: foes reuse their code-drawn sprites (Husk sheets), heroes reuse hero-select art; no new art pipeline.

## 8. Build plan (small chunks, each verified: tests, build, audit, screenshots 3 sizes, fit + security)
- CX1 pure model `src/meta/codex.js`: entries from data + stats (pages, thresholds, riddles, counts); save `codex.read` + `titles` (schema bump + migration + validation tests). No UI.
- CX2 Almanac screen (tabs, grid, entry sheet, keyboard, SR, Calm) + copy file `src/ui/codexcopy.js`.
- CX3 entry points: title J button, pause (read-only), results link, tree Almanac heart link; Back rules.
- CX4 celebration queue (pure, tested: sizes, caps, order, once-only) + results ledger + medium cards + audio hooks (reuse `tree_light` / `tree_whole`).
- CX5 big moment (full-screen, skippable, Calm) + `tree:wake` full celebration on the tree screen.
- CX6 completion rewards: titles + chip ornament + title backdrop colour bands; hub lantern brightness from the book total.
- CX7 riddle copy pass (15 lines, Matt reads) + verify (sweeps byte-identical by construction: no sim files touched).

Right now: this sheet for Matt's three picks. Next: CX1 after lock. Parked: codex for Blessings, voiced barks, Hollow-mark lore pages beyond one line.

## 9. Mock-ups (docs/mockups/codex/, each at 1280x720, 844x390@2x, 390x844@2x; rebuild with `node docs/mockups/codex/shoot.mjs`)
- cx-foes: Almanac, Foes page (real Husk sprites from docs/screenshots/en-atlas; unknown = faceless silhouette + "?????"; staged pages with progress; portrait = entry as a full sheet).
- cx-spirits: Spirits page, Ghost Wolves: found (gold, recipe), sealed + Full Almanac riddle, sleeping (fog + condition progress); portrait = weapon chips + stacked sockets.
- cx-ledger: results with a MEDIUM card (Evolution found) over the results card, queue "2 of 3", ledger line "The Hollow remembers: ... +2 more".
- cx-remember: BIG moment "The Ghost Wolves are whole" (colour band returns, title + ornament pills, skippable).
- Backdrops are blurred placeholder screenshots; Branch-Mane / Seed Pod / Hollow marks show mask placeholders.

## Decisions for Matt (one-tap)
1. Codex home: A one "Almanac" book (title J, pause read-only, results, tree link) (Recommended) / B inside the Lantern Web / C results + pause page only.
2. Reveals: A staged pages + Full Almanac riddles naming one stat (Recommended) / B strict fog, no hints / C hints from lifetime weapon use.
3. Celebrations: A small / medium / big, queued at results, max 1 big + 3 medium (Recommended) / B in place only, no results moments / C live in-run toasts + results.
