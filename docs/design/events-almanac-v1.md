# Map-events Almanac page v1 (design sheet, three options; NOT built, parked until Matt picks)
Status 2026-10-30. Docs only. Nothing here is locked.
Builds on: LOCKED 'CX1-CX7 CODEX + CELEBRATIONS BUILT', 'ALMANAC DECISIONS', 'MAP EVENTS PICKS', 'LAMP POSTS ADAPTATION', 'PLAYTEST PICK 3' (intro cards; Almanac > "How things work" replays them). Deferred in the E0-E5 notes: "Almanac page + sitesRestored leaf + lifetime counts".

## 1. Research (brief)
| Finding | Label |
|---|---|
| Our Almanac already sets the shape: foes unlock at kill counts, pages stage in (Habits / Weakness / Tells), recipes show after first take, riddles only with the Full Almanac lantern. Events should use the same staging. | OFFICIAL (src/meta/codex.js, src/ui/codexcopy.js, codexui.js; docs/design/codex-celebrations-v1.md) |
| Collection-log style bestiaries (Hades Codex, Hollow Knight Hunter's Journal) unlock an entry on first encounter and fill detail with repeat encounters; the drive is "fill the page". | COMMUNITY / OPINION |
| Per-run history logs are common in roguelikes but add save weight and a screen few players reopen. | OPINION |
| Events follow the reward-visible rule (Matt, 2026-10-28): rewards are shown in-world before you commit, so the Almanac must not hide them; the secret is tactics and timing, not numbers. | OFFICIAL (our LOCKED) |

## 2. Constraints from the current Almanac
- Save v3 `codex {v, read, told}` = hex bitsets over APPEND-ONLY `ENTRY_KEYS` (about 57 of 256 slots used; MAX_BITS_HEX 64). New keys append only; never reorder.
- Pages derive from stats where possible. Events have no counters in the save today. A new counter block would be a validated stats field `sites` {lamps, roads, knots, ...}: ints clamped like `markedKills`, absent = 0 (no migration, same trick as intros).
- Tabs now: Foes, Spirits, Heroes, Nights; each has a found/total count, a fresh dot, and celebrations (c:foes, c:spirits, c:nights, c:book).
- Sim untouched in all options; counts are written once per run at results (like chests / blessingsTaken).

## 3. Options

### A. "Places" tab with three staged pages (Recommended)
- Look/behaviour: a fifth Almanac tab "Places" with three entries in the foe-card style: Lamp Posts, Lantern Road, Hollow Knot. Each is a grey silhouette ("Somewhere in the Cursed Forest") until the first time it wakes in a run; then it shows name, one line (same sentence as its intro card), lifetime count (lit 14 / roads relit 3 / knots broken 2) and the reward row exactly as shown in-game. A second "Tells" page per entry (when it wakes and how far, e.g. "far lamps wake at 10:20") unlocks at a count (suggest 3 completions), mirroring Habits/Tells. A "How things work" link replays the intro card.
- Tab shows found / total (3 entries + 3 Tells = 6). Completing all gives one small celebration (`c:places`). It is NOT part of the "book is whole" (c:book) rule by default, so existing saves are not retroactively changed.
- Save: appended keys `s:lamp`, `s:road`, `s:knot`, three `sp:*:tells` keys, `c:places`; stats.sites counters. Fits easily in 256.
- Phone/desktop: reuses the tab layout; a fifth tab must pass fit-audit at 320 px and Larger text (PHONE-A already worked on Almanac grid clipping).
- Perf: none (DOM text).
- Fit: strongest; identical staging to foes so players already understand it. Counts give a reason to chase events.
- Risks: crowded tab row at 320 px; events wake on every night so first unlock is quick (low drama), hence the Tells page is count-gated. Wording needs Matt's voice check.

### B. "Road Journal": a log of recent runs' events
- Look: one section under Nights listing the last 10 runs, each a row of three glyphs (lamps lit n/12, road done or failed, knot beaten) with night and result.
- Save: a ring buffer in the lantern save (10 rows x ~6 ints, validated): more weight and a migration surface.
- Fit: weak; the Almanac is a book of the world, not a scoreboard, and the results screen already shows the events line.
- Risks: save size/validation, low reopening value.

### C. "Mural of the Forest": a stamp page
- Look: one page showing a drawing of the Cursed Forest with a stamp slot per event kind per night (3 x 3 = 9). Each fills in warm colour the first time you finish that event on that night. Completing all 9 gives a celebration.
- Save: 9 bits appended (`s:lamp:twilight` ...); no counters needed.
- Fit: strong identity (colour returning, fill the mural) and pairs with minimap option C. Mechanical: rewards repeat play across nights but does not explain the events (intro cards cover that), and 9 stamps is thin.
- Risks: needs a new code-drawn page illustration (a separate chunk).

## 4. Recommendation
A, as one chunk (E7): stats.sites counters + validated schema field, appended ENTRY_KEYS, `almanac()` Places section, codexcopy text (3 lines, 3 Tells, 1 celebration), codexui tab, tests (hostile save values, append-only guard, key list fits 256, fit-audit 320 px + Larger text). C's stamp row can be added later as a header on the Places tab.
Timing: after launch unless Matt wants it in v1. It touches the save schema, which the Release Gate treats as sensitive, so it needs its own security check.

## 5. Self-review (gaps found and fixed)
- Save safety: append-only keys, clamped ints, absent = 0, hostile-value test; c:book unchanged for existing saves.
- Riddles: Places has none (rewards are visible by rule); stated so nobody adds one.
- Counters written once at results, not mid-run; debug/bot runs (?auto=) must not write counters (check how stats handle debug runs in build).
- Endless Dusk and Gentle Light count like any run (default, Matt may override).
- Not verified: codexui tab-row layout at 320 px was not opened this session; listed as a build check.
- Security: new text via textContent (existing pattern), numbers clamped.

## 6. Questions for Matt
1. Which option? A (Places tab, recommended), B (run journal), or C (stamp mural)?
2. Should finishing Places count toward "the book is whole" (changes c:book for existing saves) or stay separate (recommended: separate)?
3. In v1 or after launch? Recommended: after launch (touches the save schema).
