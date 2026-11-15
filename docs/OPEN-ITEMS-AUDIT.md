# Open items audit (2026-11-14, read-only; no game code, QUEUE.md or LOCKED.md edited)

Sources read: docs/QUEUE.md (all decision lines, top block, "Decisions waiting", "Matt playtest feedback", LATER sections), docs/LOCKED.md (rows from 2026-10-14 to 2026-11-13, headings of all rows), docs/LAUNCH-CHECKLIST.md (STATUS, E), docs/PLAN.md (old build plan, nothing open), docs/design/ (file list and status lines only), and Matt's typed messages from the session transcript (669 genuine user entries, 2026-10-14 to 2026-11-13; one-word replies like "Next", "Update", "Go" skipped). Repo state: main = PR 13 (tree rework, Wardrobe v2, title cover live); dev is 176 files ahead (Dragonfire Meteor, Wildfire, Cinder Wyrm, Cinder Brand, Lucinda + Ophimber, DM8 tree cluster, all hidden by `unreleased`).

Caveat: QUEUE.md has about 470 lines of history below its top block. I classified every line that asks Matt for something; lines that only log a build are not listed. Where I could not confirm a status I say UNSURE.

## A. Decision / waiting items in QUEUE.md

### STILL OPEN (10)
| # | Item (QUEUE row) | What Matt must do / decide | Recommended default |
|---|---|---|---|
| A1 | Top block "Real-phone checks: heat, Battery Saver, long session; ring 3 of the Rise clips portrait edges" | Run docs/REAL-PHONE-CHECKLIST.md on the iPhone; LOCKED "PHONE CHECK (first pass)" says heat / Battery Saver / long-session not reported yet | Do the checklist; report model + minutes to hot |
| A2 | Top block "Teaser slot 'Dragonfire Meteor' already shows dashed in the live tree" | Keep or hide until release | Keep (QUEUE rec) |
| A3 | Top block "Release switch for Lucinda (DM10)" | Yes/no, after DM9 numbers and a phone heat check | Wait for DM9; then yes if bands hold |
| A4 | Top block chores: tell testers (one-time tree refund, saves fresh at new address) | Send the message | Send after next stable build |
| A5 | Top block chores: delete old `hollowlight` Cloudflare project | Matt-only account step (also QUEUE "LAUNCHED 2026-11-01" OPEN) | Delete (old address already serves the moved page) |
| A6 | Top block chores: "5 old worktree folders with uncommitted work" | Say keep or discard each (Claude can list them) | Claude lists diffs, Matt says discard/keep. UNSURE which folders |
| A7 | Full Almanac riddles: LOCKED "RT6-RT8 + overnight decisions" (2) and "Full Almanac riddles" (2026-10-24); QUEUE line 53 and CODEX row | Read the 15 riddle lines (RIDDLE in src/ui/codexcopy.js); Full Almanac stays inert until then | Read and edit wording, or accept drafts |
| A8 | "Settings tab label at phone portrait" (QUEUE "Decisions waiting"; final-verification rec: rename 'Controls' to 'Keys' on phones only) | No LOCKED answer found, and `'Keys'` is not in src | Take rec (tiny, reversible) |
| A9 | Judgement Wheel stream40 5.7-7x (EVO-FIX QUEUE line; LOCKED 2026-10-17 exemption stands) | Keep the exemption, or accept ~1.3x kite-home. Never asked after EVO-FIX merged. UNSURE if Matt saw it | Keep the exemption |
| A10 | "DECISION GATE (Matt, 2026-11-01)": hero Bond cap 25 vs 30/35 | Decided at the Chapter 2 balance chunk (maxed-tree bots at 25 and 30/35) | Review then, not now |

### DONE (cited) (27)
- Hollowlighters -> Wickbearers: LOCKED 2026-10-30 "HOLLOWLIGHTERS RENAMED WICKBEARERS".
- About wording: QUEUE "2026-10-31 ABOUT WORDING OK"; feedback channel dropped (Matt 10-29 "forget the feedback channel", LOCKED "PRIVATE, NON-COMMERCIAL"); credit line in src/ui/aboutcopy.js `madeBy` matches Matt's 10-29 wording.
- Map events balance 1-3: LOCKED 2026-10-30 "QUEUE DECISIONS ANSWERED" (accept; re-measure after his events-on playtest, a Claude follow-up).
- Level-up cards at Large/Larger: same row (keep rows).
- Long Night hero gap, Ravens fresh win, Orbit-Wren early deaths, first Deep Dusk clear: LOCKED "RT6-RT8 + overnight decisions" (accepted as measured) and 2026-10-30 "QUEUE DECISIONS ANSWERED" (3).
- Deep Dusk full tree 19/17 (band 35-55) and Wren Long Night 3%: LOCKED 2026-10-30 "HARD NIGHTS ACCEPTED AFTER EVO FLOW v2"; LOCKED 2026-11-13 "DEEP DUSK BALANCE" (leave for launch).
- Nights retune options (3 options): same rows.
- Evolution flow v2: LOCKED "EVOLUTION FLOW v2 LOCKED" + "EVO FLOW v2 LOCKED CHOICE" (evoTriggerRanks 16).
- Trademark search: LOCKED 2026-10-30 "TRADEMARK SEARCH DROPPED".
- Name: LOCKED "NAME LOCKED v2", "NAME CONFIRMED".
- Logo / wordmark / About option: LOCKED "WORDMARK" (3 options, Matt picked) and "BRAND + RENAME BUILT".
- CLAUDE.md edits: LOCKED "CLAUDE.md EDITS APPROVED + APPLIED (2026-10-29)".
- Hosting (stay public / private / Cloudflare): LOCKED "PRIVATE HOSTING LIVE", "LAUNCH HOSTING (2026-11-01)"; launched 2026-11-01.
- Account steps (Access, rename, private repo): LOCKED "PARKED DESIGN PICKS" (leave as is).
- Phone layout: LOCKED "PHONE LAYOUT PICK: OPTION A"; Matt's iPhone pass 2026-10-30 "plays really well" (QUEUE "PHONE PLAYTEST").
- Desktop design 3 questions: LOCKED "DESKTOP FILL + FEEL LOCKED"; C1 later reopened as a bug ("C1 WCO PAUSED").
- Menu chrome + tree phone picks: LOCKED "MENU CHROME + LANTERN WEB PHONE REDESIGN LOCKED"; refined by "TOP NAV: FLOATING TABS" and "NO STRIP".
- Minimap + Places tab picks: LOCKED "PARKED DESIGN PICKS"; both built and on main (branches wip/minimap, wip/places merged); QUEUE "MINIMAP LOOK APPROVED".
- blank-fix skipWaiting OK: LOCKED "PWA-1 UPDATE RULE REOPENED: INSTANT UPDATE (Matt yes)".
- Playtest picks (shard card, Blessing on first Road/Knot, pause + full-card explanations): LOCKED "PLAYTEST PICKS" + "BUILT" + "PICK 3 BUILT".
- Bloom + Ravens contrast decisions (10-23): LOCKED "Bloom + raven contrast (2026-10-23)", "BL1 BUILT".
- Alpha feel flag: LOCKED "THE ALPHA STAYS A BOSS-KILLER" + "ALPHA BOOST BUILT".
- Exploit pass flags, Stampede tune: LOCKED "EXPLOIT PASS RESULT", "EXPLOIT CONFIRM RESULT", "ALPHA BOOST BUILT, STAMPEDE TUNE DROPPED".
- Thunder Judgment radius: LOCKED "THUNDER JUDGMENT RADIUS".
- Phone heat (60 fps cap + Battery saver): LOCKED "PHONE HEAT"; built (main log bcfdc76). Matt's real-phone test still open (A1).
- Chapter 2 pick, new weapon/hero direction, names, fire weapon reopen and picks, tree budget, chapter x1.1, harder tiers, enemy reuse, new-content playbook: LOCKED 2026-11-01 rows ("CHAPTER 2 PICK" ... "REUSING ENEMIES ACROSS MAPS").
- Tree rework picks, branches, forks, background, rings, starter handling, restart scope, Q7, Far Sight, Kindling Start, dry stretch: LOCKED 2026-11-02 and 2026-11-12 rows.
- Wardrobe v2, title cover, title tune, loadout hero step, LI_HEAL fixture, Lucinda/Ophimber looks: LOCKED 2026-11-12/13 rows.
- Companions direction and confirmation: LOCKED "SUMMONS BECOME HERO COMPANIONS" and "COMPANIONS CONFIRMED".
- Bible questions and world research: LOCKED "Bible decisions (Matt 2026-10-15)"; reference screenshots supplied (QUEUE 505-513).

### STALE (superseded) (8)
- "Hosting: stay on public GitHub Pages ... before outside testers" (QUEUE Waiting list): superseded by LOCKED "LAUNCH HOSTING".
- "P3 ... live game is still v0.2.0. Merge to main only when ... says yes": launched 2026-11-01, tree live 2026-11-13 (LOCKED "TREE + WARDROBE + TITLE LIVE").
- "Balance decisions: Elias evolves too rarely ..." (already tagged STALE in file).
- "3D proof", "Polished 2D mock-ups", "Summons review" in-progress rows (tagged CLOSED, STALE in file).
- "Name check Hollowlight" Waiting row: replaced by Wispwick.
- "WAITING ON MATT (reminder list, 2026-10-15)" block (QUEUE 198-211): HUD-1, front-door 3 questions, PWA orientation, W2 Rally hold; all later locked (LOCKED "Front door", "PWA orientation", "W2 Rally the Pack decision").
- "EVO-FIX Judgement Wheel keep/accept" duplicate wording in Nights block and Launch checklist OPEN table rows for the name search, About wording, hosting, Wickbearers, map events (LAUNCH-CHECKLIST "OPEN, with owner" is dated 2026-10-28 and is out of date; only play tests, phone tests, riddles and the merge yes remain from it).
- Spirit Tempest "stand and do nothing" (QUEUE PARKED 2026-11-01): Matt himself said "Forget the weapon thing" (2026-11-01 00:19) and the probe found no stand-and-win; keep as a watch item only.

## B. Everything Matt voiced vs where it is recorded
Status key: LOCKED row / QUEUE line / BUILT / MISSING. Entries grouped; trivial replies omitted.

| Date | What Matt said | Where recorded |
|---|---|---|
| 10-13/14 | Free hosting on GitHub; step-by-step help; check Hollowlight name; longer name | LOCKED "Hosting", "Name"; CLAUDE.md |
| 10-14 | Security everywhere, standing rule; token conservation rule; modern non-blocky UI; own identity; art direction; mix S1+S5 | CLAUDE.md rules; LOCKED "Art family", "Style recipe", "Identity" |
| 10-14 | Fit-the-game standing rule; skill tree like Spirit Hunters (unlock by killing/stages); nobody hired, AI/programs only; small chunks; focus keeper; abilities meaningful not game-breaking | CLAUDE.md; LOCKED "Meta-progression principle", "Asset production", "Ability/evolution principle" |
| 10-14 | Revisit hero abilities; review chapter power-ups and the summons/magic that go with them; research everything first | Abilities BUILT (heroes-and-abilities). **Chapter power-ups review: MISSING** (only the generic "research first" rule recorded) |
| 10-15 | Skill tree flows better; per-weapon trees; tree shaped like the weapon; moon-touched node unlockable early, give less away | QUEUE "SKILL TREE REDESIGN v2" + "EMBLEM CONSTELLATIONS"; G1e built |
| 10-15 | Phone controls; PWA/full screen; make install obvious to testers | BUILT (PWA-1, install prompt); LOCKED "Phone play" |
| 10-15 | Map challenges / reasons to roam; minibosses at set times + chests | LOCKED "World / map events"; BUILT (EN6-EN9, map events) |
| 10-15 | Front door: login-style cover, hero + map select | LOCKED "Front door"; BUILT FD1-FD7 |
| 10-15 | Weapon roster review (remaining magic/summons); ask questions the one-tap way | LOCKED "Weapon roster review", "Asking Matt questions" |
| 10-15/16 | HUD still not unique; menus bland/blocky; fonts; world not alive | LOCKED "UI IDENTITY DIRECTION", "FONTS REOPENED", WORLD SHEET #2; BUILT |
| 10-16 | Low-HP frost hides too much; death screen scroll to reach buttons | LOCKED "HUD low-HP frost tuning", "U6 RESULTS SCREEN BUILT" |
| 10-16 | Foliage interactive / blooms when lit; game laggy | LOCKED "AL-2 RESTORE-BLOOM BUILT"; perf chunks BUILT |
| 10-16 | Dark start, brightening to vivid dawn | LOCKED "VISIBILITY + VIBRANCY ARC"; BUILT |
| 10-16 | Evolutions in depth (3 options each); wolf bleed unclear; status nodes in tree; same number of evolutions per weapon; bleed numbers red | LOCKED 2026-10-16 evolutions rows; row "BLEED COLOUR" (blood red); QUEUE status IDEA |
| 10-16 | Always fix the weak spots; no need to wait for "go" | CLAUDE.md rules |
| 10-17 | Ravens/Wolves separate trees (retracted); 5 weapons v1, more after v1 (Matt has own ideas); fix all flagged items; "wow" first impression; everything done before launch | LOCKED "V1 SCOPE", "RELEASE GATE"; QUEUE "weapon roster review ... Matt's new weapon/summon ideas = AFTER v1" |
| 10-18 | PC still laggy; walk animation not smooth; eyes look like red balls; tree must scale large | LOCKED "EYES IN SOCKETS BUILT", walk-cycle chunk, "SKILL TREE GROWTH" |
| 10-18 | Difficulty tiers unlock via tree, more resources; extra nodes to balance; tree must pull players; unlockable nodes shown in a different colour | LOCKED "DIFFICULTY TIERS + TREE UPGRADES + ECONOMY", "TREE PULL PRINCIPLE", "TREE NODE STATE VISIBILITY" |
| 10-20 | Wolves all chase one enemy; cannot tell where hits come from; crowds hard to read; outline of Wren off when facing; controls stick | LOCKED "WOLF SPREAD + LEASH FIX", "DAMAGE + CROWD READABILITY", "OL1 BUILT"; input stuck: UNSURE (keys.js last-pressed rule noted in QUEUE parked controller line) |
| 10-20 | Boss: no timer, beat or die at end, whole screen floods with life | LOCKED "BOSS DIRECTION CLARIFIED", "ELDER TREANT BOSS" |
| 10-20 | Controller support later | QUEUE "PARKED 2026-10-20" |
| 10-21 | Tree prettier, no faint lines; connected-unlock rule with gates | LOCKED "Tree look + connected-unlock rule"; BUILT T3c/T4 |
| 10-24 | Every character works with the whole tree; characters on their own page, level from use after a run; +4/+3 too small | LOCKED "TREE IS CHARACTER-AGNOSTIC", "CHARACTER SYSTEM v2", "BOND SIZE"; BUILT |
| 10-24 | Weapons stay unlocked in the tree | LOCKED "WEAPONS STAY IN THE TREE" |
| 10-28 | Almanac handled by Claude; events need rewards; Wren vs Elias % should be level-based; evolution text on pick/Almanac/tree | LOCKED "ALMANAC DECISIONS", "MAP EVENTS ...", "EVOLUTION PLAIN-WORDS TEXT"; Wren/Elias gap = QUEUE "Wren vs Elias gap at max (watch)" |
| 10-29 | Lightning-bolt hitch; lamp posts after max level; Blessing from Road/Knot; Knot unclear; explanations should pause; text not fitting phone; 10-15 s ground load; credit "made by Matt, heavy lifting Claude" | LOCKED "PLAYTEST PICKS" (+BUILT, PICK 3); QUEUE FIX1/FIX4; About `madeBy` |
| 10-29 | Phone crashed when losing a run and would not load | Code fix exists (commit bd7f937 "prebake crash guard") but **not recorded in QUEUE/LOCKED: MISSING record** |
| 10-30 | Phone menus not designed for phones; unify desktop to mirror phone; evolution flow idea; tree page cluttered, banners unpolished; black bar | LOCKED "PHONE LAYOUT PICK", "EVOLUTION FLOW", "MENU CHROME ...", "DESKTOP FILL" |
| 10-30/31 | Installed desktop app blank / two black bars / "not a desktop game"; update needs hard refresh; tab strip looks blocky | LOCKED "C1 WCO PAUSED", "PWA-1 UPDATE RULE REOPENED", "TOP NAV: FLOATING TABS", "NO STRIP" |
| 10-31 | Character picker still shows built-in weapon | LOCKED "NO HERO WEAPON" |
| 10-31 | Ground went bland after 3-4 min, colour only returned about 8 min from the end | **MISSING** (not in QUEUE/LOCKED; may relate to the life-map restore pace; UNSURE) |
| 10-31 | Spirit Bolts + Tempest felt too strong ("stand and do nothing"); balance worry; fix evolutions last resort | QUEUE PARKED Tempest; LOCKED "EXPLOIT PASS RESULT"; rule "evolutions changed only as last resort" implicit in fix order "tune first, replace last" |
| 11-01 | First run won on Spirit Bolts; Alpha unclear; all weapons/evos untested; Elias ability has no symbol like Wren's | Alpha: LOCKED. First-run data point: QUEUE. **Elias ability symbol: MISSING** (cannot confirm built; UNSURE) |
| 11-01 | Phone warm | LOCKED "PHONE HEAT" |
| 11-01 | New hero Lucinda (dragon-kin, small dragon pet Ophimber), fire weapon not a flamethrower, skill tree + new maps x1.1, any starter on new profile, level cap review, harder tiers pay more | LOCKED 2026-11-01 rows (all listed above) |
| 11-02 | Summons not weapons, become companions; visuals review at back of list; tree "wow" first; disconnected feeling | LOCKED "SUMMONS BECOME HERO COMPANIONS"; QUEUE "LATER: Visuals review", "Skill tree wow review" |
| 11-02 | Offered a paid Spirit Hunters game file for study (screenshots too limited) | **MISSING** (photos used: QUEUE 505-513; the offer is not recorded) |
| 11-02 | Tree references: 3 spokes, evolutions, forks, always connected; spread out landmarks; cosmetic for ring completion; picture login screen; UI alignment pass; sandbox-first rule | LOCKED tree rows; "RING COMPLETION REWARD"; QUEUE "LATER: login screen", "UI alignment pass"; "PAGES ARE DESIGNED IN A LIVE SANDBOX FIRST" |
| 11-12 | Centre nodes too big; hero sidebar half-used and unfinished; any hero on new profile | LOCKED "LOOK PORT" / "HEROES ON THE TREE"; hero panel: UNSURE (QUEUE lists "hero portrait soft fade" and "R4 hero panel NOT started") |
| 11-13 | Title cover changes with last-played hero; companions: Elias needs own (no crows); Wolves/Ravens leave weapons; Lucinda must be drawn harder; Ophimber is "she" | LOCKED "TITLE SCREEN v1 PICKS", "COMPANIONS CONFIRMED", "LUCINDA + OPHIMBER LOOKS" |
| 11-13 | "I feel we aren't covering everything we've spoken about" | This audit |

MISSING list: (1) chapter power-ups review (10-14); (2) ground goes bland mid-run (10-31); (3) Elias ability symbol (11-01; UNSURE if built); (4) phone crash on loss (10-29; fix exists, undocumented); (5) offer of the Spirit Hunters game file (11-02).

## C. Built but not yet verified by Matt
- Phone heat, Battery saver, long session (REAL-PHONE-CHECKLIST.md; LOCKED "PHONE CHECK" says not reported). Includes Rise ring 3 clipping on portrait.
- Installed desktop app (Chrome install, Windows): last report 10-31 "now worked" after two reloads; C1 window overlay off. Not rechecked on the current live build.
- Tree rework play-test (LOCKED "LOOK SIGN-OFF": looks approved, play-test pending): Lantern Web, Far Sight, Kindling Start, Wardrobe ring costumes, one-time refund path.
- Android and low-end Android, PWA install on Android (LAUNCH-CHECKLIST E2, never done).
- All five weapons and all 15 evolutions played by hand (Matt 11-01: "haven't tested all weapons"); Elias run only Spirit Bolts.
- Deep Dusk and Long Night by hand; Gentle Light, Endless Dusk, Fourth Card/Fifth Hook, Hollow marks.
- Map events on a human run (needed to settle A "map events" re-measure).
- Audio in a full run (AU0-AU6 "Matt to listen").
- Summons art S1-S8 "AWAITING MATT'S LOOK" rows in QUEUE (S2-S7 screenshots, ravens contrast); no explicit approval row found. UNSURE whether he reviewed them.
- Menu-build C0-C3 look on the real iPhone (home-indicator band, 44 px taps) and desktop re-baseline; blank-fix on a real installed app.
- Title cover on the live site on a real phone (first pass OK per LOCKED).
- On dev only, hidden: Dragonfire Meteor, Wildfire, Cinder Wyrm, Cinder Brand, Lucinda art, Ophimber, Ophimber's Rise, DM8 tree cluster; Matt picked looks from sandboxes but has not played them (DM9 balance still running on wip/dm9).
- Almanac Places tab, minimap (look approved), 60 fps phone cap: on main, not tried on a phone.
- Phone first-load (10-15 s) and first-bolt hitch (FIX1/FIX4): last report 10-30 "plays really well"; the long first-load only partly re-reported.

## D. Proposed single prioritised list
1. Matt: run docs/REAL-PHONE-CHECKLIST.md on the iPhone and report heat / Battery Saver / minutes of play (A1; blocks DM10).
2. Matt: play-test the live tree (buy a few nodes, one Far Sight / Kindling Start run, Wardrobe) and say what feels off (C).
3. Matt: one Deep Dusk run and one map-events run; Claude re-measures events after (A "map events").
4. Matt chores: tell testers about the one-time refund; delete the old `hollowlight` Cloudflare project (A4, A5).
5. Matt: read the 15 riddle lines in src/ui/codexcopy.js (A7).
6. Matt: teaser slot keep/hide, 'Keys' label, Judgement Wheel exemption (A2, A8, A9): all one-tap with defaults.
7. Claude: record the 5 MISSING items in QUEUE.md; check the Elias ability symbol and ground-bland report (10-31) and report back.
8. Claude: list the 5 old worktree folders with diffs so Matt can keep/discard (A6).
9. Claude: finish Lucinda DM9 balance, then Matt gives the DM10 release yes with phone heat done (A3).
10. Claude: measure real lamp pace for Far Sight 120 (QUEUE SMALL / MEASURE).
11. Claude: Chapter 2 Hushbell Hamlet design, with the Bond cap 25 vs 30/35 review (A10).
12. Claude: Companions three-options rounds (Elias's own companion); reopens weapon scope, evolutions, gates.
13. Claude: Visuals review, then UI alignment pass.
14. Later: chapter power-ups review, other heroes and roster weapons, Android/Windows app, AI art pipeline.
15. Watch only: Wren vs Elias gap, dry stretch runs 30-56, Spirit Tempest feel.
