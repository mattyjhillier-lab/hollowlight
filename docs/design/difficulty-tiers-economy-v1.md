# Difficulty tiers, tree upgrade groups and economy v1 (LOCKED A/A/A 2026-10-18; DT0 + DT4 data + Satchel hooks BUILT in T3b)

**Build status (2026-10-18, T3b):** DT0 done (budget rule: lore + choice categories, the five trims -> combat 15.18 / 15.5, sustain 5.0 / 5.0, `perTier` allowances 2.5 / 0.6, `scope.minTier`, Blessing combined caps in `blessings.json`). DT1 data + plumbing done WITHOUT the map UI: `src/data/tiers.json` (template + per-chapter overrides, validated by `src/sim/tiers.js`), `Sim({tier})` applies enemy HP x, damage x, boss HP x and the heart pity x (density, marks and rewards are data only until DT2 / DT3), `?tier=normal|hard|expert` strict whitelist (debug run, never banks), `TIER=` for `scripts/bot.mjs`. Save (still v3, additive): `dawnglass` 0..1e9, `stats.tiers` records with first-dawn claim flags, tool counters; `recordTierRun` pays the bounty once per (map, tier, hero) and records an unopened tier as Twilight. DT4 data done: the five tool clusters as `src/data/tree/tools/*.json` (31 new ids + 11 moved; the 12 Husk / Grey Alpha Almanac lanterns wait for EN3-EN7 ids). DT5a done for the simple Satchel hooks (gem pull, Lantern Call, Kinder Hearts pity, Lodestar pity, pickup steps). INERT (data + tests only): Card Fan perks, Almanac, Hearth-key perks, the whole Night Gate; tier-bought power (Fourth Card, Fifth Hook, Long Night keystones) is enforced to work only on its tier or harder (`aggregateMods(..., {tier})`, tested). Tier data lives in `src/data/tiers.json`, not `chapters.json`, to keep out of the enemy agent's files (the sheet's `chapters.json -> tiers` location can be restored by a move).

Date 2026-10-18. Status: DESIGN ONLY, awaiting Matt (no game code changed). Scope: the LOCKED 2026-10-18 rows 'DIFFICULTY TIERS IDEA' (= release-gate item 12, post-victory replay loop), 'TREE UPGRADE GROUPS' and 'TREE SIZE AND RESOURCES', designed together BEFORE tree T3 (rescale) and T4/T5 (screen) because they change the economy, the budget rule and the Lantern Web layout.
Research: docs/research/39-difficulty-tiers-economy.md (new) on top of 19, 22, 38. Mock-ups: docs/mockups/difficulty-tiers/ (`node build.mjs && node shoot.mjs`; every number below comes from `node inventory.mjs`, saved as tables.txt).

## 0. Decisions for Matt FIRST (max 3, recommended first)

| # | Decision | A (Recommended) | B | C | Mock-up |
|---|---|---|---|---|---|
| 1 | How tiers work | **Three nights per map**: Twilight / Deep Dusk / Long Night (names provisional). Each tier is a data block: tougher foes + ONE readable new rule (Hollow-marked foes on Deep Dusk; more marks, slower heart luck and a 4th mark on Long Night) | **Gloom dial**: Hades-style Omens (8-10 toggles worth points); Deep Dusk = 5+ points, Long Night = 10+ | **Ascending nights 1-10**: Slay-the-Spire ladder per map, one rule per step, win N to open N+1 | dt-options-desk.png |
| 2 | New resource | **One: Dawnglass** (morning light caught in glass), dropped ONLY on Deep Dusk / Long Night; buys the Daybreak lanterns (Fourth Card, Fifth Hook, Long Night gate, Long Night keystones) + cosmetic tints; never on Twilight, no conversion, capped per run | **Two**: Wax (Deep Dusk) + Dawnglass (Long Night), each with its own ring | **None**: harder tiers pay x1.5 / x2 gold and more shards; tier clears are only unlock conditions | dt-options-desk.png |
| 3 | Where tier-earned power works | **Only on the tiers that pay it** (tier-scoped like chapter scope): Fourth Card, Fifth Hook, Long Night keystones work on Deep Dusk / Long Night; QoL and info nodes work everywhere; Twilight balance and the locked ceiling never move | **Everywhere, inside one ceiling**: bigger trims elsewhere, Fourth Card / Fifth Hook become an exclusive keystone pair (own one) | **Everywhere, ceiling raised** +2.5 PE by rule (needs a reopen of 'the budget ceiling still holds'; Twilight gets easier for veterans) | dt-options-desk.png |

Taken as defaults (reversible; asked later in batches of max 3, A first, per the three-options rule): unlock path (c) A, reward scaling (d) A, UI (e) A, mastery/bestiary system (f.3) A, tree placement of the groups L-A, each group's node set A (section 8), tier display names Twilight / Deep Dusk / Long Night (alternatives: Dusk / Nightfall / Long Night, or Lanternlit / Dim / Starless; "Dusk" alone was avoided because the tree already has a Dusk ring).

Proposed order of the later batches: batch 2 = unlock path, reward scaling, UI; batch 3 = mastery system, Satchel, Card Fan; batch 4 = Hearth-key, Night Gate contents, tree placement.

## 1. The recommended design in one page

- **Tiers (per chapter, data in chapters.json)**: Twilight = today's game (the locked 15-30% no-tree starter band). Deep Dusk = enemy HP x1.45, damage x1.15, early density x1.15, boss HP x1.5, and **Hollow marks** (5% of spawns from 4:00 carry one readable affix). Long Night = HP x2.0, damage x1.3, density x1.3, boss HP x2.0, marks 10% from 2:30 incl. the 4th mark Hollowheart, heart pity x1.3. Blessings, the tree and the run length stay the same on every tier.
- **Resources**: gold (every kill; x1 / x1.5 / x2 by tier), soul shards (boss: 5 / 7 / 10), **Dawnglass** (new; Deep Dusk / Long Night only: boss 2/3, dawn 2/4, first dawn per hero 6/10, marked foes 1 each capped 2/3; per-run cap 6/10 excluding first dawns).
- **Unlock path**: a new **Night Gate** tool cluster in the Lantern Web. `gt_cursed_forest_hard` (permanent gate; condition: clear Twilight once; 1,200 gold + 2 shards) opens Deep Dusk; `gt_cursed_forest_expert` (clear Deep Dusk once; 2,500 gold + 4 shards + 10 Dawnglass) opens Long Night. Tier-locked upgrades: Fourth Card (clear Deep Dusk), Fifth Hook (clear Deep Dusk with BOTH heroes), Long Night keystone pair (clear Long Night), Three Dawns cosmetic (all 9 stars). Each map-tier has 3 stars (clear; clear with both heroes; Bright Dawn = all three Grey Alphas slain and no revive used).
- **Four upgrade groups** = four more tool clusters: **Satchel** (collection & pickup, 8 lanterns), **Card Fan** (cards & information, 10), **Almanac** (mastery & bestiary, 25), **Hearth-key** (run start & safety, 6). 54 lanterns in the five tool clusters, of which 11 are existing ids moved (no id changes) and 43 are new.
- **Budget**: the Twilight (Chapter 1) ceiling HOLDS: combat PE-at-cap 15.32 (v2) -> 15.18 with the new lore and choice categories, paid for by trimming five category caps (section 9.4). Tier-scoped power gets its own allowance by rule: Deep Dusk +2.5 combat PE, Long Night +0.6 more, only active on those tiers, small against the tier's own difficulty (HP x1.45 alone is about -31% effective damage).
- **Economy** (model): whole tree ~110,850 gold + 43 shards + 46 Dawnglass. First Twilight clear ~run 3 (bot) and Deep Dusk opens at once; first Deep Dusk clear ~27 bot / ~35 human runs (OVER the 15-25 target: levers in 9.3); everything bought ~48 bot / ~64 human runs (v2 alone was 41 / 57).
- **UI**: the map card gets a row of three tier chips (state, stars, NEW, Recommended, lock + condition bar), a side card with "what changes", "you earn" pills and records, and a one-line "next light" nudge; the results screen gets a tier badge, a Dawnglass chip, the first-dawn line and the star row (dt-mapselect-*.png, dt-results-*.png).

## 2. Locked constraints kept (conflict check against docs/LOCKED.md)

- 'DIFFICULTY TIERS IDEA': tiers per map, higher tiers unlocked through the tree, harder tiers pay more incl. a new resource, some upgrades locked behind tier clears, higher tiers never the only way to power (ceiling holds). **Kept** (decision 3 A keeps the ceiling literally; 3 C would reopen it).
- 'TREE UPGRADE GROUPS': all four groups, small capped effects inside the soft cap, QoL first/cheap, power later/expensive, no double counting with Blessings. **Kept** (section 8, combined caps 8.6).
- 'TREE SIZE AND RESOURCES': no artificial cap, each resource with identity/source/sink/economy line/save field, no padding nodes. **Kept**; Dawnglass has all five (section 4.2). Padding risk flagged on the Almanac "Tells" lanterns (weak spot 7).
- 'SKILL TREE v2 LANTERN WEB' / 'EXTENSIBILITY' / 'GROWTH': data-driven fragments, permanent namespaced ids with `idx`, budget computed by rule, chapter scope, compact saves, no positions in screen code. **Kept**: new namespaces `co`, `cd`, `bs`, `rs`, `df` (kind `tool`), tier gates `gt_<chapter>_<tier>`, budget gains a `perTier` rule next to `perChapter`, node `scope` gains `minTier`. Layout: the five tool clusters use the five gap-bearing far slots (L-A, section 8.1); this halves the far slots left for future weapons from 10 to 5 (+2 per chapter band): a real cost, stated.
- Progression gates: options not stats; stat nodes 1-3%; permanent gates; hidden recipes. **Kept**: Louder Stirring never names an evolution; the new tier gates are permanent.
- Blessings lock (run-only cream cards, caps) and the chest lock (Blessing choice + floor; chest Blessings count toward the same caps). **Kept**; Lantern Blessing and Full Almanac also count toward the Blessing caps.
- R1 rows: the 15-30% band is the no-tree STARTER pool on Twilight only. **Kept**; tier bands are new and separate (9.1).
- Visibility arc G1-G8, eye colour lock, red-orange = danger telegraphs only, gold only for evolutions/dawn. **Kept**: marks read by SHAPE first; Emberwake's ring is a danger telegraph; Dawnglass is peach-to-pale-cyan glass, never evolution gold (the "Dawn breaks" title keeps the locked dawn gold).
- Results screen lock (defeat lantern dims, fast Again). **Kept**; the tier mock only ADDS a badge, a Dawnglass chip, the first-dawn line and stars to the locked layout; the build follows the locked results layout.
- Release gate item 12 (post-victory replay loop): this sheet is that item. Item 6 (front door map select) hosts the tier chips.
- Save rules (versioned, sanitised, nothing released on v3 yet, release guard). **Kept** (section 10).
- No conflict that needs a reopen with the recommended options. Options 3 C and the tree placement option L-B (merge into the Dusk ring) would each need a reopen.

## 3. (a) Tier structure and modifiers

### 3.1 Options
- **A Three nights per map (Recommended).** Fixed tiers, each a data block of multipliers + ONE readable new rule. Readable on a phone (one chip), measurable by the bot (one env var), cheap to extend (a 4th tier is a data entry), matches Brotato/StS/Dead Cells (modest stat steps + new situations; research 39 section 2). Risk: less self-expression than a dial; experts may want more (answered by the optional Omens suggestion, section 15).
- **B Gloom dial.** Player-composed difficulty (Hades Heat, VS toggles, Soulstone curses). Most replay for experts; 2^8+ combinations to balance and bot-sweep, a big options screen on phones, and the Soulstone "which toggle blocks me" problem. Best as a later layer on top of A.
- **C Ascending nights 1-10.** One rule per step, very clear ladder. Ten steps per map to design, tune and show; a 15-minute run makes a 10-step climb long; content load grows x10 per chapter.

### 3.2 Option A in detail (all values are data; est = tuned in DT8 with the bot)

| Knob | Twilight | Deep Dusk | Long Night | Notes |
|---|---|---|---|---|
| enemy HP x | 1.0 | 1.45 | 2.0 | on top of hpScale (0.53 / 0.020) |
| enemy damage x | 1.0 | 1.15 | 1.3 | on top of dmgScale 0.07/min |
| spawn rate x | 1.0 | 1.15 | 1.3 | bites early only: late runs sit at maxEnemies 240 (perf cap, unchanged) |
| boss HP x | 1.0 | 1.5 | 2.0 | Elder Treant 3600 -> 5400 / 7200; 3-phase boss sheet (#7) adds a per-tier phase knob later |
| Hollow marks | none | 5% of spawns from 4:00, max 1 per foe; Ironbark / Swiftshade / Emberwake | 10% from 2:30; + Hollowheart | never on bosses; Grey Alphas only Ironbark, Long Night only |
| heart pity x | 1.0 | 1.0 | 1.3 | hearts never removed; boss still always drops one |
| miniboss (EN7) | as locked (3:20, 7:00, 12:30) | each Alpha +1 howl wolf | a 4th Alpha at 8:40 (>= 30 s from swarms) | needs EN7 built; data knobs until then |
| Blessings / chest / tree / run length | unchanged | unchanged | unchanged | Blessings fill the late game; cutting them makes dead picks |

**Hollow marks** (dt-affixes-desk.png; one verb each, shape first, colour second):

| Mark | Verb | Effect | Look (shape first) | Tell |
|---|---|---|---|---|
| Ironbark | outlast it | HP x1.8, speed x0.85 | pale bark plates over the mask, heavier outline | static shape |
| Swiftshade | out-turn it | speed x1.3, HP x0.8 | cold violet motion streak, always on (WL6c streak) | streak |
| Emberwake | step out of it | on death a 28 px ring for 1.2 s, damage = its contact damage per s | ember cracks in the mask | red-orange ring telegraph 0.6 s, above the vignette |
| Hollowheart (Long Night) | kill it first | foes within 60 px +15% speed while it lives (no stacking) | hollow chest glow + thin violet threads to neighbours | threads |

Marked foes drop x5 gold and (Deep Dusk / Long Night) 1 Dawnglass, capped 2 / 3 per run. Every mark passes the visibility gates G1-G8 and the protan/deutan harness before it ships (DT2).

Why fair: the stat steps are Brotato-sized (+45% / +100% HP over 15 minutes), every new threat is one verb you answer by MOVING (the enemy sheet's rule), nothing is hidden, nothing is taken away on a loss, and the base tier never changes.

## 4. (b) New resource(s)

### 4.1 Options
- **A One new resource: Dawnglass (Recommended).** Strongest "why play harder" hook (Spirit Hunters' Ember Cores pattern, research 19/39), one purse more on screen, one clear identity, a finite sink plus a cosmetic sink so it never goes dead.
- **B Two: Wax (Deep Dusk) + Dawnglass (Long Night).** More flavour (Elias's candle wax), two rings; doubles every second-currency risk (two purses, two sinks to size, one usually goes dead); premature with one chapter.
- **C None.** Gold x1.5 / x2 and more shards on harder tiers; tier clears only as conditions. Simplest, but gold already buys everything on Twilight, so the pull to play harder is weak (Brotato gets away with it through records only).

### 4.2 Dawnglass (A) in detail

| | |
|---|---|
| Identity | Morning light caught in glass: only where the night is deepest does the first light leave something you can hold. Look: a small faceted teardrop, warm peach core to pale cyan edge (dawn sky colours; not evolution gold, not shard lilac). Fits "The Hollow": light restores; the brightest light is earned in the darkest night. |
| Sources | Deep Dusk / Long Night only: boss kill 2 / 3; dawn (victory) 2 / 4; FIRST DAWN per hero per map-tier 6 / 10 (Hades-style bounty, finite); marked foe 1 each, capped 2 / 3 per run. Per-run cap 6 / 10 excluding first dawns. A loss after the boss keeps the boss glass (never take progress away). |
| Sinks | Night Gate: Long Night gate 10; Long Night keystone (one side) 10. Card Fan: Fourth Card 8. Hearth-key: Fifth Hook 12. Cosmetic: Three Dawns rim 6, lantern tints (suggestion S6, ~5 each). Total progression sink 46 (one side of the keystone pair). |
| Relation to gold / shards | Gold = breadth (every lantern); shards = depth (capstones, keystones, masteries, tier gates); Dawnglass = the night's own toys (tier-locked options and tier power). Nothing converts into anything. |
| Guard rails | Never drops on Twilight (no easy farm); deterministic sources (no rare RNG wall); per-run cap; one-time bounties carry most of it; leftover glass always has a cosmetic sink; tier power bought with it works only where it is earned (decision 3 A). |
| Economy line | Section 9.3 (income per run by tier and outcome; runs to complete). |
| Save field | `save.dawnglass` integer, clamped 0..1e9, sanitised like gold; new runs carry `glass` in the run result (validated). |

## 5. (c) Unlock path in the tree

### 5.1 Options
- **A Night Gate tool cluster (Recommended).** Tier gates are permanent lanterns bought with gold + shards (+ Dawnglass for Long Night) once their condition is met, exactly like weapon gates ("condition met, then spend a little"), so the tree is where tiers live, as Matt asked. Tier-locked upgrades sit in their own groups with tier-clear conditions.
- **B Auto-unlock on clear (Slay the Spire).** Clearing a tier opens the next at once; the tree only holds the Dawnglass sinks. Fastest, but not "unlocked via the tree" (Matt's brief).
- **C Hero keys.** Each hero climbs their own ladder (StS per character): Deep Dusk opens for Wren when Wren clears Twilight. Doubles replay with two heroes; doubles the gates and confuses with more heroes later.

### 5.2 A in detail
- `gt_cursed_forest_hard`: clear Cursed Forest on Twilight once; 1,200 gold + 2 shards; permanent (kept on respec, `requires: []`).
- `gt_cursed_forest_expert`: clear Deep Dusk once; 2,500 gold + 4 shards + 10 Dawnglass; permanent.
- Tier-locked upgrades (examples, all in the inventory, section 8): Fourth Card (clear Deep Dusk), Fifth Hook (clear Deep Dusk with Wren AND with Elias), Dawnward / Night Vigil keystone pair (clear Long Night), Three Dawns (all 9 stars of the chapter), and Hunter's Eye (slay 20 marked foes OR 3 Grey Alphas: the first marked foes appear on Deep Dusk).
- New condition leaf types (validated like the existing ones): `clearTier {chapter, tier, n, hero?}`, `stars {chapter, n}`, `killMarked n`, `openChest n`, `gems n`, `abilityUses n`, `blessings n`, `levelInRun n` (bestLevel exists).
- **Stars** per map-tier (3): Cleared; Cleared with both heroes; Bright Dawn (all three Grey Alphas slain AND Last Light unused). 9 per chapter. Stars are records (no power), shown on the map chips, results and the Night Gate.
- **First-clear bonus**: first dawn per hero per map-tier pays the Dawnglass bounty (6 / 10) and a one-time shard (+1). Records per map-tier: clears, best time, best kills, best level, stars, heroes cleared.
- Night Gate lanterns carry the "next light" goal ("Clear Deep Dusk with Elias") for the Next lights board and the map nudge.

## 6. (d) Reward scaling

### 6.1 Options
- **A Fixed multipliers + first-dawn bounties + per-run caps (Recommended).** Gold x1 / x1.5 / x2, shards 5 / 7 / 10, Dawnglass as 4.2. Easy to read on the chip ("gold x1.5"), easy to model, bounties carry the tier currency (finite), caps stop farming.
- **B Bounty only (Hades).** Dawnglass ONLY from first dawns per hero x map-tier x boss; repeats pay gold. No farming at all, but income ends: with 2 heroes and 2 tiers that is only 32 glass, short of the 46 sink, so the sinks would have to shrink or more heroes would be required.
- **C Performance-scaled (Agony).** Rewards grow with kills/time on a log curve. Rewards skill, but hard to show before the run and hard to model; the maxEnemies cap flattens it anyway.

### 6.2 A in detail

| Reward | Twilight | Deep Dusk | Long Night | Cap / diminishing |
|---|---|---|---|---|
| Gold per kill | x1.0 | x1.5 | x2.0 | gold sinks finish at ~110k: after that gold only buys cosmetics (suggestion S6) |
| Soul shards (boss) | 5 | 7 | 10 | +1 one-time per first dawn per hero |
| Dawnglass | 0 | boss 2, dawn 2, marked 1 (cap 2) | boss 3, dawn 4, marked 1 (cap 3) | per-run cap 6 / 10 |
| First dawn bounty (per hero, per map-tier) | 0 | 6 glass + 1 shard | 10 glass + 1 shard | once each |
| Marked foe gold | - | x5 | x5 | |
| Chest (EN8) | as locked | Large chest odds +10 pts | +20 pts | still never two Larges per run |

Diminishing returns: per-run caps on glass; bounties are once; gold is uncapped but finite in use. No multiplier stacks with another tier multiplier.

## 7. (e) Map / tier select UI

### 7.1 Options
- **A Tier chips on the map card (Recommended; dt-mapselect-*.png).** One row of three chips under the map art: name in the display face, stars, NEW flag (teal), "Recommended next" tag, locked chip dashed with lock glyph + its one condition + teal bar. The side card shows "what changes" (max 4 plain lines), "you earn" pills (coin / shard / Dawnglass, first dawn bounty in teal), records and stars; under it the next-light nudge; buttons Back / Begin with <hero>. Phone portrait stacks map card then the side card; landscape hides the 3rd/4th change lines. Targets >= 44 px, text >= 12 px, state never colour-only (lock glyph, dashed border, NEW text).
- **B Lantern dial.** A brass dial beside the map turns the night darker: lovely, but three states on a dial hide the chip info and are harder on touch.
- **C Night versions of the map card.** Swipe between a dusk, deep and starless painting of the same map: strongest mood, 3x the art per chapter.

### 7.2 A in detail
- Recommended chip rule (data-free): the highest unlocked tier whose last-5-run clear rate on the lower tier is >= 40% (else stay); a fresh unlock is always "Recommended next" once.
- Locked tier teaser: name visible, condition + bar ("Clear Deep Dusk once 0/1"), never hidden (Soulstone lesson: show what blocks you).
- Results (dt-results-*.png): tier badge in the tier colour, Dawnglass chip with its breakdown ("6 + 6 first dawn"), first-dawn line naming the hero still waiting, star row, next lights. Defeat on a tier: same locked dim-lantern beat; the badge and any boss glass are shown.
- The map nudge reuses `closestUnlocks` (the results and tree screens use the same).
- Fog: the next chapter card shows its entry condition (Long Night clear is NOT the default; default stays "clear the previous chapter on Twilight": the mock line is an example).

## 8. (f) The four tree upgrade groups

### 8.1 Where they sit in the Lantern Web (layout options; dt-tree-desk.png)
- **L-A Five tool clusters on the five gap-bearing far slots (Recommended).** Satchel 126 deg, Almanac 198, Night Gate 270 (top, toward the night sky), Card Fan 342, Hearth-key 54; r 1280, radius up to 200 (far slots are 791 apart; Almanac's 25 lanterns fit two rings). Each cluster's entry lantern threads from the Dusk-ring lantern on the same bearing (visual thread; `requires` only on its own entry rule), so the web reads hub -> rings -> constellations -> tools at the edge. Cost: future weapon slots before chapter bands drop from 10 to 5 (the five launch-bearing far slots), +2 per chapter band; the C.4 Lantern Wisps fixture moves from far2 to far1 (test data). Why not closer: at r 800 a tool cluster must stay under radius ~80 to clear the Dusk ring band (960 +- 30 + 50 gap), too small for 8-25 lanterns.
- **L-B Merge into the Dusk ring.** Enlarge the Dusk ring into a band holding the groups as arcs. Compact, but reopens the locked v2 ring layout and crowds the keystones.
- **L-C A separate "Satchel" tab.** The groups live on a second screen. Simplest layout, but splits the one web Matt locked.

Moved ids (place only, ids unchanged; pre-release so effect rescales ride T3's Regrowth): li_reach, li_scav, li_hearts, li_heal, li_magnet (Satchel); sp_reroll2/3, sp_ban2/3 (Card Fan); sp_auto, li_last (Hearth-key). Hearth keeps its other 9 day-one lanterns (incl. sp_reroll1, sp_ban1); its freed slot holds the thread to the Satchel, whose cheap first lanterns (Wider Lantern r1 200 gold, Eager Gems r1 260) stay day-one buys.

### 8.2 Node inventory (generated by inventory.mjs; costs per node incl. all ranks; pool = budget class; scope all = every tier)

Ids follow the permanent namespaced rule (C.7): new prefixes `co_` (Satchel), `cd_` (Card Fan), `bs_` (Almanac), `rs_` (Hearth-key), `df_` (Night Gate), gates `gt_<chapter>_<tier>`; each gets a permanent `idx` in its fragment.

| id | cluster | v2 id moved / NEW | name | effect | ranks | gold (all ranks) | shards | Dawnglass | unlock condition | budget class (PE est) | scope |
|---|---|---|---|---|---|---|---|---|---|---|---|
| li_reach | satchel | moved | Wider Lantern | Gem pickup range +4% per rank (was +6% x1) | 4 | 1630 | 0 | 0 | - | util | all |
| li_scav | satchel | moved | Scavenger | Gem pickup range +4% (was +6%) | 1 | 450 | 0 | 0 | slay 500 wolves OR 800 crows (as v2) | util | all |
| co_pull | satchel | NEW | Eager Gems | Gems fly to you 15% faster per rank (magnetSpeed 260 -> 377 at r3) | 3 | 1350 | 0 | 0 | - | util | all |
| co_call | satchel | NEW | Lantern Call | On level-up, gems within 2x your pickup range fly to you | 1 | 1100 | 0 | 0 | reach level 35 in a run | util 0.05 | all |
| li_hearts | satchel | moved | Kinder Hearts | Hearts +5% AND heart pity 30 s -> 25 s (re-weighted, same 0.2 sustain) | 1 | 840 | 0 | 0 | - | sustain 0.2 | all |
| li_heal | satchel | moved | Mending Light | Hearts heal +5% (as v2) | 1 | 900 | 0 | 0 | - | sustain 0.2 | all |
| li_magnet | satchel | moved | Lodestar | r1 Soul Magnets +25% (as v2); r2 magnet pity 30 s -> 24 s | 2 | 1800 | 0 | 0 | - | util | all |
| co_glean | satchel | NEW | Gleaner | Experience +2% (XP utility cap 7.5% holds: li_study 3% + 2%) | 1 | 1400 | 1 | 0 | collect 60000 gems (lifetime) | util | all |
| sp_reroll2 | cards | moved | Third Glance | +1 reroll (as v2) | 1 | 270 | 0 | 0 | - | sustain 0.1 | all |
| sp_reroll3 | cards | moved | Fourth Glance | +1 reroll (as v2) | 1 | 600 | 0 | 0 | - | sustain 0.1 | all |
| sp_ban2 | cards | moved | Second Snuff | +1 banish (as v2) | 1 | 330 | 0 | 0 | - | sustain 0.1 | all |
| sp_ban3 | cards | moved | Third Snuff | +1 banish (as v2) | 1 | 720 | 0 | 0 | - | sustain 0.1 | all |
| cd_stir | cards | NEW | Louder Stirring | "Something stirs" also lights when the PARTNER stat is rank 2+ (earlier hint); still never names an evolution | 1 | 600 | 0 | 0 | evolve weapons 3 times | info | all |
| cd_peek | cards | NEW | Second Sight | See the next level-up offer, dimmed, under the current one (it can still change if a pick removes a card) | 1 | 900 | 0 | 0 | reach level 30 in a run | choice 0.05 | all |
| cd_bars | cards | NEW | Hunter's Eye | Thin health bars + affix name on affixed enemies and minibosses (boss bar stays free) | 1 | 500 | 0 | 0 | slay 20 affixed enemies OR 3 Grey Alphas | info | all |
| cd_radar | cards | NEW | Lantern Compass | Edge arrows also point to chests and to the next miniboss 20 s before it arrives | 1 | 700 | 0 | 0 | open 5 chests | info | all |
| cd_favour | cards | NEW | Favoured Spirit | At run start mark one weapon: its stat cards weigh x1.5 (inside the evoNudge cap; recipes stay hidden) | 1 | 1200 | 0 | 0 | evolve weapons 8 times | choice 0.2 | all |
| cd_fourth | cards | NEW | Fourth Card | Level-ups offer 4 cards (offerSize 3 -> 4); gold cards stay max 3 | 1 | 2000 | 0 | 8 | clear Cursed Forest on Deep Dusk | tier 1 | hard+ |
| bs_wolf1 | almanac | NEW | Fell Wolf: Habits | +1% damage vs Fell Wolf | 1 | 200 | 0 | 0 | slay 1000 Fell Wolf | combat | all |
| bs_wolf2 | almanac | NEW | Fell Wolf: Weakness | +1% damage vs Fell Wolf (lore cap 2% per type) | 1 | 500 | 0 | 0 | slay 4000 Fell Wolf | combat | all |
| bs_wolf3 | almanac | NEW | Fell Wolf: Tells | its attack tell shows 0.1 s earlier (readability; boss/miniboss: the tell ring is brighter) | 1 | 400 | 0 | 0 | slay 12000 Fell Wolf | info | all |
| bs_crow1 | almanac | NEW | Grave Crow: Habits | +1% damage vs Grave Crow | 1 | 200 | 0 | 0 | slay 1000 Grave Crow | combat | all |
| bs_crow2 | almanac | NEW | Grave Crow: Weakness | +1% damage vs Grave Crow (lore cap 2% per type) | 1 | 500 | 0 | 0 | slay 4000 Grave Crow | combat | all |
| bs_crow3 | almanac | NEW | Grave Crow: Tells | its attack tell shows 0.1 s earlier (readability; boss/miniboss: the tell ring is brighter) | 1 | 400 | 0 | 0 | slay 12000 Grave Crow | info | all |
| bs_crawl1 | almanac | NEW | Root Crawler: Habits | +1% damage vs Root Crawler | 1 | 200 | 0 | 0 | slay 250 Root Crawler | combat | all |
| bs_crawl2 | almanac | NEW | Root Crawler: Weakness | +1% damage vs Root Crawler (lore cap 2% per type) | 1 | 500 | 0 | 0 | slay 1000 Root Crawler | combat | all |
| bs_crawl3 | almanac | NEW | Root Crawler: Tells | its attack tell shows 0.1 s earlier (readability; boss/miniboss: the tell ring is brighter) | 1 | 400 | 0 | 0 | slay 3000 Root Crawler | info | all |
| bs_stoat1 | almanac | NEW | Stoat Piper (EN3): Habits | +1% damage vs Stoat Piper (EN3) | 1 | 200 | 0 | 0 | slay 200 Stoat Piper (EN3) | combat | all |
| bs_stoat2 | almanac | NEW | Stoat Piper (EN3): Weakness | +1% damage vs Stoat Piper (EN3) (lore cap 2% per type) | 1 | 500 | 0 | 0 | slay 800 Stoat Piper (EN3) | combat | all |
| bs_stoat3 | almanac | NEW | Stoat Piper (EN3): Tells | its attack tell shows 0.1 s earlier (readability; boss/miniboss: the tell ring is brighter) | 1 | 400 | 0 | 0 | slay 2500 Stoat Piper (EN3) | info | all |
| bs_hb1 | almanac | NEW | Husk type 5 (EN4/EN5, area denial): Habits | +1% damage vs Husk type 5 (EN4/EN5, area denial) | 1 | 200 | 0 | 0 | slay 200 Husk type 5 (EN4/EN5, area denial) | combat | all |
| bs_hb2 | almanac | NEW | Husk type 5 (EN4/EN5, area denial): Weakness | +1% damage vs Husk type 5 (EN4/EN5, area denial) (lore cap 2% per type) | 1 | 500 | 0 | 0 | slay 800 Husk type 5 (EN4/EN5, area denial) | combat | all |
| bs_hb3 | almanac | NEW | Husk type 5 (EN4/EN5, area denial): Tells | its attack tell shows 0.1 s earlier (readability; boss/miniboss: the tell ring is brighter) | 1 | 400 | 0 | 0 | slay 2500 Husk type 5 (EN4/EN5, area denial) | info | all |
| bs_hc1 | almanac | NEW | Husk type 6 (EN6, heavy charge): Habits | +1% damage vs Husk type 6 (EN6, heavy charge) | 1 | 200 | 0 | 0 | slay 150 Husk type 6 (EN6, heavy charge) | combat | all |
| bs_hc2 | almanac | NEW | Husk type 6 (EN6, heavy charge): Weakness | +1% damage vs Husk type 6 (EN6, heavy charge) (lore cap 2% per type) | 1 | 500 | 0 | 0 | slay 600 Husk type 6 (EN6, heavy charge) | combat | all |
| bs_hc3 | almanac | NEW | Husk type 6 (EN6, heavy charge): Tells | its attack tell shows 0.1 s earlier (readability; boss/miniboss: the tell ring is brighter) | 1 | 400 | 0 | 0 | slay 1800 Husk type 6 (EN6, heavy charge) | info | all |
| bs_alpha1 | almanac | NEW | Branch-Mane / Grey Alpha (miniboss): Habits | +1% damage vs Branch-Mane / Grey Alpha (miniboss) | 1 | 300 | 0 | 0 | slay 5 Branch-Mane / Grey Alpha (miniboss) | combat | all |
| bs_alpha2 | almanac | NEW | Branch-Mane / Grey Alpha (miniboss): Weakness | +1% damage vs Branch-Mane / Grey Alpha (miniboss) (lore cap 2% per type) | 1 | 700 | 0 | 0 | slay 20 Branch-Mane / Grey Alpha (miniboss) | combat | all |
| bs_alpha3 | almanac | NEW | Branch-Mane / Grey Alpha (miniboss): Tells | its attack tell shows 0.1 s earlier (readability; boss/miniboss: the tell ring is brighter) | 1 | 500 | 0 | 0 | slay 60 Branch-Mane / Grey Alpha (miniboss) | info | all |
| bs_treant1 | almanac | NEW | Elder Treant (boss): Habits | +1% damage vs Elder Treant (boss) | 1 | 300 | 0 | 0 | slay 1 Elder Treant (boss) | combat | all |
| bs_treant2 | almanac | NEW | Elder Treant (boss): Weakness | +1% damage vs Elder Treant (boss) (lore cap 2% per type) | 1 | 700 | 0 | 0 | slay 5 Elder Treant (boss) | combat | all |
| bs_treant3 | almanac | NEW | Elder Treant (boss): Tells | its attack tell shows 0.1 s earlier (readability; boss/miniboss: the tell ring is brighter) | 1 | 500 | 0 | 0 | slay 15 Elder Treant (boss) | info | all |
| bs_page | almanac | NEW | Full Almanac | Codex page art + all Almanac lanterns glow; +1 Blessing choice in chests (3 -> 4 shown; no power beyond the Blessing caps) | 1 | 2000 | 2 | 0 | every Habits lantern lit | choice 0.05 | all |
| sp_auto | hearthkey | moved | Steady Hand | Ability fires itself below 30% health (as v2) | 1 | 1050 | 0 | 0 | survive 5:00 in Cursed Forest | util | all |
| rs_autoset | hearthkey | NEW | Chosen Moment | Pick the auto-fire rule in Settings: below 30% / below 50% / when 25+ foes are near / off | 1 | 900 | 0 | 0 | use your ability 100 times | util | all |
| rs_start | hearthkey | NEW | Kindred Start | At 0:00 choose your second spirit from 3 of your unlocked weapons (a free weapon card) | 1 | 1500 | 0 | 0 | wake 1 sleeping spirit (any weapon gate) | choice 0.2 | all |
| rs_bless | hearthkey | NEW | Lantern Blessing | Start with one Blessing rank (choose 1 of 3); counts toward the Blessing caps | 1 | 1800 | 2 | 0 | take 15 Blessings | choice 0.3 | all |
| li_last | hearthkey | moved | Last Light | Once per run a killing blow returns you at 20% health (as v2; the one revive) | 1 | 900 | 5 | 0 | clear Cursed Forest | sustain 4 | all |
| rs_slot5 | hearthkey | NEW | Fifth Hook | A 5th weapon slot (balance.weaponSlots 4 -> 5) | 1 | 3000 | 3 | 12 | clear Deep Dusk with Wren AND with Elias | tier 1.5 | hard+ |
| gt_cursed_forest_hard | nightgate | NEW | Deep Dusk: Cursed Forest | Unlocks the Deep Dusk tier (permanent, kept on respec) | 1 | 1200 | 2 | 0 | clear Cursed Forest (Twilight) | none | all |
| gt_cursed_forest_expert | nightgate | NEW | Long Night: Cursed Forest | Unlocks the Long Night tier (permanent) | 1 | 2500 | 4 | 10 | clear Cursed Forest on Deep Dusk | none | all |
| df_ward | nightgate | NEW | Dawnward (pair A) | Long Night only: hearts heal +10%, all damage -1% (excludes df_vigil) | 1 | 1800 | 0 | 10 | clear Long Night once | tier 0.4 | expert |
| df_vigil | nightgate | NEW | Night Vigil (pair B) | Long Night only: all damage +2%, max health -3% (excludes df_ward) | 1 | 1800 | 0 | 10 | clear Long Night once | tier 0.6 | expert |
| df_star | nightgate | NEW | Three Dawns | Cosmetic: your lantern burns with a dawn rim on the map + results (no power) | 1 | 1000 | 0 | 6 | earn all 9 stars in Cursed Forest | none | all |

Group totals: Satchel 8 lanterns 9,470 gold + 1 shard; Card Fan 10 lanterns 7,820 gold + 8 glass; Almanac 25 lanterns 11,600 gold + 2 shards; Hearth-key 6 lanterns 9,150 gold + 10 shards + 12 glass; Night Gate 5 lanterns 8,300 gold + 6 shards + 36 glass (26 needed: the keystones are a pair). All 54: 46,340 gold of which 36,850 is new; 19 shards; 56 glass listed (46 needed).

Already in the v2 tree and NOT duplicated: per-weapon mastery (constellation masteries wf_third, rv_oath, bo_twin, cl_crown, or_seventh), per-hero mastery (hero lanterns), cooldown reduction to the 30 s floor (sp_cd1-4), the one revive (li_last, moved), auto-use (sp_auto, moved).

### 8.3 Three options per group (the node set A is the inventory above)
- **Satchel**: A small steps (range 4 x +4%, pull 3 x +15%, Lantern Call, hearts/magnet re-weighted) / B two big lanterns (range +10% x2 + "Dawn Tide": every 60 s all gems fly to you) / C "Fetching spirits": your summons carry gems to you (thematic for Wren, but a sim cost and it blurs what wolves do).
- **Card Fan**: A Fourth Card + Second Sight + Favoured Spirit + Louder Stirring + Hunter's Eye + Lantern Compass / B no 4th card; instead "Hold": keep one card into the next offer + extra rerolls / C information only (peek, stir, bars, radar), never more choice.
- **Almanac** (= the mastery/bestiary system, 8.4) / see 8.4.
- **Hearth-key**: A Kindred Start + Lantern Blessing + Chosen Moment + Fifth Hook (+ moved Steady Hand, Last Light) / B "Pilgrim's kit": one capstone that sets a saved loadout (start weapon + start Blessing + auto rule) / C start weapon + its first stat rank, no start Blessing.
- **Night Gate**: A gates bought after the clear + keystone pair + cosmetic / B auto-unlock (5.1 B) with only the keystones and cosmetics / C per-hero keys (5.1 C).

### 8.4 Mastery and bestiary: three options
- **A Almanac lore lanterns in the tree (Recommended).** Per enemy type: Habits (+1% damage vs that type), Weakness (+1% more; lore cap 2% per type), Tells (its attack tell shows 0.1 s earlier; boss/miniboss: brighter tell ring), each unlocked by a slay count and bought cheaply with gold; the Full Almanac capstone (all Habits lit) adds the codex page art and one more Blessing shown in chests. Uses the existing `killEnemy` condition and `killsByEnemy` stats; matches Matt's "1000 crows: +2% vs crows" example; the codex (release-gate item 11) reads the same counts.
- **B Automatic bestiary milestones.** The same milestones pay their bonus automatically (no gold, no tree), shown in the codex. Less to manage; the tree loses the "useful upgrade" feel Matt asked for, and it is invisible power.
- **C Mastery tracks.** Levels 1-10 per enemy, weapon and hero from use (Halls of Torment / Brotato style), each level a cosmetic or a tiny stat. Rich, but a second progression system beside the tree and a big UI.

Slay counts (bot kills per run: ~800 wolves, ~900 crows, ~190 crawlers; human ~1.5x slower): wolf/crow 1,000 / 4,000 / 12,000; crawler 250 / 1,000 / 3,000; the three new Husk types 150-200 / 600-800 / 1,800-2,500 (ESTIMATES until EN3-EN6 exist and their ids are final); Grey Alpha 5 / 20 / 60; Elder Treant 1 / 5 / 15. Lore damage is per type, so its budget weight is the average share of damage dealt to typed foes (section 9.4).

### 8.5 Power class of each group (QoL first and cheap, power later and expensive)
- Satchel: utility (pickup, pull, magnet, xp) + 0.4 sustain (unchanged total; Kinder Hearts re-weighted). Cheapest lanterns 200-450.
- Card Fan: sustain (rerolls/banishes, unchanged), info (0 PE), choice (0.25 est), tier (Fourth Card 1.0, Deep Dusk+ only).
- Almanac: lore combat category (1.2 PE at cap), info (Tells), choice (0.05).
- Hearth-key: utility (auto rules), choice (0.5 est), sustain (Last Light 4.0, unchanged), tier (Fifth Hook 1.5, Deep Dusk+ only).
- Night Gate: gates (0 PE), Long Night keystones (0.6, Long Night only), cosmetic.
New budget classes: **info** (0 PE; UI only; no cap needed but listed) and **choice** (discrete PE per node, estimated, replaced by ablation in DT8; Twilight cap 1.0).

### 8.6 No double counting with Blessings (combined caps)
Today the sim multiplies tree x Blessing (pickup: `pickupRadius x mods.pickup x bless.pickup`; gold: `mods.gold x bless.gold`; speed likewise), so tree 1.12 x Blessing 1.24 = 1.39 pickup is possible already. Rule:
- One **combined cap** per shared effect, applied at read time: `eff = min(combined, treeMul x blessMul)`. Combined caps: pickup 1.45, gold 1.40, speed 1.08, maxHp 1.18, damage 1.09 (each just above what the two systems give together today, so nothing current is cut; the new Satchel steps raise tree pickup to 1.20 and the combined cap keeps the total at 1.45).
- The Blessing for an effect leaves the card pool once the combined cap is reached (like maxed stats), so a Blessing card is never a dead pick; Lantern Blessing (start) and chest Blessings use the same caps.
- Tree utility caps stay the per-system caps (pickup 12 -> 20% to fit the Satchel steps; gold 12; xp 7.5; speed 5).
- Tests: tree max x Blessing max <= combined cap for every effect; a run with all pickup sources reports the clamped radius.

## 9. Balance plan

### 9.1 Win-rate bands per tier (bot, 96+ seeds per cell, Blessings on, both heroes, random and FOCUS)

| Kit | Twilight | Deep Dusk | Long Night |
|---|---|---|---|
| Starter, no tree | 15-30% (LOCKED) | locked (behind a clear); expected < 5% | locked |
| Mid tree (META=half, gates preset) | 40-65% | 15-30% ("the starter struggle again, with a bigger toolkit") | < 10% |
| Full tree, Twilight-scope nodes | 45-55% random / 65-75% FOCUS (progression-gates target) | 25-40% | 5-15% |
| Full tree + Daybreak (tier-scoped) nodes | unchanged | 35-55% | 15-30% |

Also on every tier: no deaths before ~4:00 (Twilight keeps the 5:00 line) for the kit the tier is meant for; deaths spread over 6-14 min; Wren-Elias gap <= 5 pts; summon-heavy kits (wolves + ravens, no magic) within 10 pts of magic kits on Long Night (Soulstone lesson); evolutions still 1.8-2.3x in their home scenario at tier HP (ratios, so they should hold; checked); abilities a modest share; boss-death share 10-35%.

### 9.2 Bot measurement plan
- Tier knobs are DATA (`chapters.json` -> `tiers`), with a `TIER=normal|hard|expert` env in `scripts/bot.mjs`, `sweep.mjs`, `g1d-sweep.mjs`, `gates-sim.mjs` and a `?tier=` debug URL param (whitelisted). `TUNE` overrides per knob for what-ifs (`TUNE='tiers.hard.enemyHp=1.35'`).
- New `scripts/tier-sweep.mjs`: tiers x {starter, half, full, full+daybreak} x {wren, elias} x {random, FOCUS}, 96 seeds per cell, prints win %, death-time histogram, boss-death share, gold/shards/glass per run, marked-foe kills, deaths within 3 s of an Emberwake ring (fairness probe).
- New `scripts/econ-pace.mjs` (replaces this sheet's model): simulated players (as gates-pace) bank real bot runs, buy with a greedy "cheapest next goal" policy, climb tiers when the Recommended rule says so; prints runs to: first clear per tier, each gate, each group complete, everything; p50/p90 over 24 players.
- Ablations for every "est" PE (choice and tier nodes): `stat-ablate`-style on/off, 96 seeds; a node's PE = measured win-point delta x the calibration used in progression-gates 3.1.
- Twilight starter sweeps must stay byte-identical through DT1-DT7 (tier code inert on Twilight; the affix RNG is a separate seeded stream that Twilight never draws).

### 9.3 Economy table (MODEL from inventory.mjs; bot inputs measured 2026-10-18 with `node scripts/bot.mjs wren 8`: starter loss mean 468 gold at ~5:00, win 2,689 + 5 shards; META=full GATES=all win ~3,600)

Income per run (bot; human ~0.75x gold):

| Tier | Win gold | Loss gold | Shards (win) | Dawnglass win / loss | First dawn (per hero) |
|---|---|---|---|---|---|
| Twilight | ~2,700 | ~700 | 5 | 0 / 0 | - |
| Deep Dusk | ~4,540 | ~2,100 | 7 | 6 / ~3 | +6 glass +1 shard |
| Long Night | ~6,050 | ~3,200 | 10 | 9 / ~4 | +10 glass +1 shard |

Totals: v2 tree ~74,000 gold + 29 shards (skill-tree-v2 section 10; the current T1 data sums 83,990 + 26 with v1 prices, T3 sets the v2 prices) + this sheet 36,850 new gold + 19 shards (minus Last Light's 5, already counted) + 46 Dawnglass = **~110,850 gold, 43 shards, 46 Dawnglass**.

Runs to milestones (40 simulated players, median (p90)):

| Milestone | Bot | Human (0.75x gold) | Target |
|---|---|---|---|
| First Twilight clear | 3 (7) | 3 (7) | <= 8 (starter band 15-30%) |
| Deep Dusk opened | 3 (7) | 3 (7) | right after the first clear |
| First Deep Dusk clear | 27 (38) | 35 (44) | 15-25: **OVER** |
| Long Night opened | 27 (38) | 35 (44) | right after the first Deep Dusk clear (bounty covers the 10 glass) |
| First Long Night clear | 40 (47) | 51 (62) | 35-50 |
| All Dawnglass sinks | 32 (39) | 39 (47) | 30-45 |
| All shards | 21 (34) | 21 (33) | before gold |
| Whole tree (gold) | 48 (54) | 64 (69) | <= ~60 human (v2 alone was 41 / 57) |

Per branch (gold at ~1,300 average human run): Satchel ~7 runs, Card Fan ~6 runs + 8 glass, Almanac ~9 runs of gold but its long pole is slay counts (12,000 wolves/crows ~15 bot / ~22 human runs; 60 Alphas ~20 runs), Hearth-key ~7 runs + 12 glass, Night Gate ~6 runs + 26-36 glass.

Time-to-fun targets: run 1 buys 2-4 Hearth lanterns (incl. the first Satchel step); a new toy (Raven heart, first Satchel/Card Fan lantern) by run 4-5; Deep Dusk opens at the first clear; a "next light" is always on the board; no step needs more than ~10 runs of pure grinding (the Almanac's top Tells lanterns are the exception: optional, readability only).

Lever if the first Deep Dusk clear stays over 25 runs when measured (DT8, Matt decides): (1) Deep Dusk HP x1.45 -> x1.35; (2) Deep Dusk marks from 5:00 instead of 4:00; (3) move Kindred Start / Lantern Blessing earlier (cheaper); NOT more Twilight power.

### 9.4 Soft-cap budget integration (numbers from inventory.mjs)

Twilight (Chapter 1) scope, combat categories, PE = soft total x weight:

| Category | v2 cap / weight | v2 PE at cap | Proposed cap | Proposed PE at cap | Change |
|---|---|---|---|---|---|
| Global damage | 3 / 1 | 3.00 | 2.5 | 2.50 | -0.50 (trim) |
| Summon tag | 6 / 0.35 | 2.10 | 5 | 1.75 | -0.35 (trim) |
| Magic tag | 6 / 0.35 | 2.10 | 5 | 1.75 | -0.35 (trim) |
| Cast speed | 4 / 0.3 | 1.20 | 3 | 0.90 | -0.30 (trim) |
| Area / reach | 6 / 0.12 | 0.72 | 4 | 0.48 | -0.24 (trim) |
| Max health | 6 / 0.2 | 1.20 | 6 | 1.20 | - |
| Level-up heal | 1.5 / 0.4 | 0.60 | 1.5 | 0.60 | - |
| Status | 8 / 0.15 | 1.20 | 8 | 1.20 | - |
| Per-weapon pool (5) | 8 / 0.08 | 3.20 | 7 | 2.80 | -0.40 (trim; knots are past saturation anyway) |
| **Lore (NEW)** | - | - | 2 / 0.6 | 1.20 | +1.20 |
| **Choice (NEW, discrete est)** | - | - | 1.0 | 0.80 used | +0.80 |
| **Combat total** | | **15.32** | | **15.18** | inside the 15.5 limit |

At the soft totals the whole Twilight-scope tree moves from 10.48 to 11.27 PE (+0.8), i.e. the full tree gets slightly stronger on Twilight through options (lore, choice), not stats. Sustain stays exactly 5.0 (Kinder Hearts re-weighted inside li_hearts' 0.2; no new sustain). Utility caps: pickup 12 -> 20% (combined cap 8.6), others unchanged.

Tier scope (new rule, `core.budget.perTier`): Deep Dusk +2.5 combat (Fourth Card 1.0 est + Fifth Hook 1.5 est), Long Night +0.6 more (the larger side of the keystone pair), 0 sustain. These apply only in runs of that tier or higher, like chapter scope. Against the tier difficulty (HP x1.45 is about -31% effective damage) they are small by design: tier power makes the night playable, it never makes it easy, and it never touches Twilight. The tree test computes the ceiling per (chapter, tier) and fails if any exceeds `base + perChapter x (k-1) + perTier[t]`.

Is any tier REQUIRED for power? No: everything that adds Twilight power is bought with gold/shards and unlocked by Twilight-reachable conditions, except the tier-scoped nodes, which do nothing on Twilight. A Twilight-only player reaches the same Twilight ceiling as a Long Night veteran.

## 10. Save implications
- New bounded fields (sanitised on every load/import; whitelisted keys; numbers clamped):
  - `save.dawnglass` integer 0..1e9.
  - `stats.tiers = { <chapterId>: { <tierId>: { runs, clears, best: {t, kills, level}, stars: 0..3 bitmask, heroes: { <heroId>: {clears, first: true} } } } }`; chapter and tier keys must exist in the data (unknown keys dropped and counted in `SANITIZE_WARNINGS`), max 32 chapters x 4 tiers x 16 heroes.
  - `stats.markedKills`, `stats.chests`, `stats.gems` (lifetime), `stats.abilityUses`, `stats.blessingsTaken`: integers clamped 0..1e9.
  - `stats.recentRuns[]` gains `d` (tier index 0..3) for the pace hint and the Recommended chip.
  - Run result (sim -> bank) gains `tier`, `glass`, `marked` (validated against the tier's run cap; a forged value cannot exceed the cap + bounties actually unclaimed).
- Version policy (from the save review): nothing is released on save v3 yet, so T2 + T3 + this ship TOGETHER inside v3; all fields above are additive with empty defaults (no envelope step). The moved ids keep their ids and `idx`; their effect/price changes are pre-release and covered by T3 (the Regrowth already refunds from the frozen v1 table). After the v1 release the release guard applies: any change to a released id's price/effect/ranks/requires needs a `core.version` bump + a migration step with its own frozen table; new tiers, new tool lanterns and new chapters are additive (no step).
- Hostile-save tests: unknown chapter/tier keys, negative/huge counts, stars > 7, first-dawn flags for unknown heroes, Dawnglass > cap, a claimed first dawn replayed by import (bounty paid once: bounty claims live in `heroes.<id>.first`, so re-import cannot double-claim within one save; a fresh import is a fresh save, harmless offline).

## 11. Extensibility (tiers as data)
- `chapters.json` -> per chapter `tiers: { normal: {...}, hard: {...}, expert: {...} }`, validated (multipliers within [1, 4], shares within [0, 0.3], times within the run, affix ids registered in a MARK registry like the STATUS registry, reward numbers bounded). A `tierTemplate` in balance.json gives defaults so a new chapter inherits the ladder and overrides only what differs.
- A new tier (e.g. a later "Starless") = one entry with `order: 3` + a gate node in that chapter's fragment + a `perTier` budget line; no screen code (chips render from data).
- A new chapter's tier gates live in its own `chapters/<id>.json` fragment (`gt_<chapter>_<tier>`), placed on its band; the Night Gate cluster shows the launch chapter's gates and a per-chapter row thereafter (constellation index lists them).
- New marks = MARK registry entry + sim hook + look + visibility harness, via the three-options process.
- New resources later: each needs identity, source, sink, economy line and save field (LOCKED 'TREE SIZE AND RESOURCES'); the default is to reuse Dawnglass for later chapters' tiers (one night currency for the whole game).

## 12. Fairness and readability checklist (acceptance gates for every tier chunk)
1. The tier chip states what changes in <= 4 plain lines before the run; the results restate the tier.
2. Every mark is readable by shape at true size on desktop and phone, day and night; eyes/tells pass G1-G8; protan/deutan harness passes; red-orange only for Emberwake's danger ring.
3. No mark or tier rule acts without a tell >= 0.6 s (Emberwake ring 0.6 s; Hollowheart threads visible while alive).
4. Nothing is taken away on a loss (gold and boss glass kept; stars and records only go up).
5. The base tier (Twilight) is byte-identical in starter sweeps; Twilight is never punished for skipping tiers.
6. Bands in 9.1 hit (with seed counts and noise reported honestly); the Wren-Elias gap and the summon check pass.
7. Perf: marks add no per-enemy sprites beyond one overlay frame in the atlas; Hollowheart threads capped (max 6 lines); Low tier = static mark shapes only.
8. Accessibility: the tier chip and the rewards are readable by screen reader (role=radiogroup; locked chip aria-disabled with its condition text); reduced motion = no thread shimmer.
9. Security: the tier id from the URL/debug param and from saves is whitelisted; all new text is `textContent`.

## 13. Build plan (small chunks; named DT1.. because D1 is already the evolution-rules chunk)

| Chunk | What | Verify | Depends on |
|---|---|---|---|
| DT0 | Budget rule: new `lore` + `choice` categories, the five trims, `perTier` + `scope.minTier` in the schema and `treebudget.js`, combined-cap table in data (no sim change) | budget tests (ceiling per chapter x tier, over-budget fixtures fail), tree-validate, npm test; sweeps byte-identical | done INSIDE T3 |
| DT1 | Tier data + sim knobs (enemy HP/damage/rate, boss HP, heart pity) + `TIER` env + `?tier=` param (whitelisted) | Twilight byte-identical; first tier-sweep numbers (no marks yet); tests for the validator | T3 |
| DT2 | Hollow marks (sim: separate RNG stream; looks in the Husk atlas; tells) | visibility harness + protan/deutan, fairness probe (deaths within 3 s of a ring), perf on Low/Med/High, screenshots true size + phone | EN0 pipeline (built), DT1 |
| DT3 | Rewards + Dawnglass + stats.tiers + new condition leaves + stars + first dawns; results screen additions | save tests incl. hostile saves, run-result validation, results screenshots 3 sizes | T2/T3 save code |
| DT4 | Tree data: five tool-cluster fragments (moved ids, new ids with idx), tier gates, new effect kinds | tree-validate (layout L-A clearances, budget per tier), npm test | DT0, before T4 |
| DT5a/b/c | Sim hooks: (a) Satchel (steps, pull, Lantern Call, Kinder Hearts, Lodestar, combined caps); (b) Card Fan (Fourth Card, Second Sight, Favoured Spirit, Louder Stirring); (c) Hearth-key (Kindred Start, Lantern Blessing, Chosen Moment, Fifth Hook) | per-effect tests, tree-less sweeps byte-identical, ablations replace every est PE | DT4 |
| DT6 | Info UI: Hunter's Eye bars, Lantern Compass targets, Second Sight row, Almanac Tells timing | screenshots 3 sizes, perf, no innerHTML | DT5 |
| DT7 | Map select tier chips + locked teaser + records/stars + Recommended + nudge (inside front-door item 6) | screenshots vs these mock-ups at 3 sizes, 44 px + contrast checks, keyboard/screen reader | front door #6 |
| DT8 | Economy + balance pass: `tier-sweep`, `econ-pace`, ablations; tune to 9.1/9.3; report to Matt (anything moving a locked target = Matt) | numbers with seeds + noise | DT1-DT7, EN7/EN8, boss #7 for the final pass |
| DT9 | Polish, weak-spot fixes, Matt playtest on PC + phone | Matt | all |

Ordering with the tree: DT0 rides T3; DT4 lands before T4 so the screen is built for the final layout; DT7 joins the front-door chunk; DT8 is part of the FINAL retune (R1 row: a final retune runs after enemies and tree v2).

## 14. Risks and honest weak spots
1. **The economy is a MODEL**, not a bot measurement: win chances by tier are assumed curves; DT8's econ-pace replaces it.
2. **First Deep Dusk clear models at 27 (bot) / 35 (human) runs**, over the 15-25 target; levers in 9.3. Not fixed now because the model's Deep Dusk win curve is a guess.
3. **Every "choice" and "tier" PE is an estimate** (Fourth Card 1.0, Fifth Hook 1.5, Kindred Start 0.2, Lantern Blessing 0.3, Favoured Spirit 0.2). The Fifth Hook may even LOWER random-bot wins (R1: GATES=all diluted random picks: Wren 5/24); ablations decide.
4. **Fourth Card / Fifth Hook only on harder tiers** (decision 3 A) may read as odd ("why only 3 cards on Twilight?"). The chip copy and node text say "Deep Dusk and Long Night only"; 3 B/C are the alternatives.
5. **Layout L-A uses half of the reserved far slots** (10 -> 5 before chapter bands) and moves the C.4 fixture; the T4 checker must prove all clearances; risk of a sparse-looking outer ring on day one (tool clusters are lit from day one, so it is not empty).
6. **Density is a weak lever** (late runs sit at maxEnemies 240 for perf), so tiers lean on HP, damage and marks; raising maxEnemies on tiers is a perf risk on phones and is NOT proposed.
7. **Almanac Tells lanterns could feel like padding** (readability perks behind long slay counts) and the three new Husk types' ids/counts are not final (EN3-EN6). Alternative if Matt dislikes them: 2 lanterns per type (17 nodes).
8. **Marks need art** (four overlays in the Husk atlas) and must pass the visibility harness; Hollowheart threads add draw calls (capped).
9. **Gold has no sink after ~110k** (all bought): suggestion S6 (cosmetics) is the answer; without it gold goes dead late, like Spirit Hunters' conversions.
10. **Dependencies**: EN7 (miniboss), EN8 (chests) and the boss redesign (#7) carry some tier knobs and the Bright Dawn star; until built, those knobs are inert data and the third star is "boss slain + no revive".
11. **Kinder Hearts and Lodestar change existing ids' effects** (li_hearts, li_magnet): fine pre-release (T3 rescale), but they must land before the release snapshot.
12. Mock-ups are static and schematic (the tree layout and the mark looks are not final art).

## 15. Extra suggestions (NOT part of the recommended design; each needs its own three-options pick)
- **S1 Lantern of the Day / Week**: a fixed seed + fixed hero + fixed tier each day/week; local records only (the deterministic seeded sim makes it free, no server). Pays nothing but a star in the codex.
- **S2 Omens**: optional risk-for-reward toggles on top of tiers (option 1 B as a later layer): e.g. "Thin Wick" (no hearts, +50% glass cap), "Restless Dead" (marks x2, gold x1.25). Max 3 at once; only on cleared tiers.
- **S3 Endless Dusk**: after a cleared tier's dawn, "stay in the dark" past 15:00 for records only (no extra currency beyond the run cap); the life map slowly greys again.
- **S4 Hero trials**: Wren "summons only" clear; Elias "never leave the Candle Wheel's light for more than 10 s"; rewards = hero cosmetics and a codex line.
- **S5 Gentle Twilight assist**: an accessibility toggle on Twilight (enemy damage -25%, marks off); records get a small moon icon; tree progress is never blocked by it.
- **S6 Cosmetic sinks**: lantern tints and spirit-trail colours bought with gold or Dawnglass (code-drawn, palette-swaps of the existing trail system; no power), so no currency ever goes dead.
- **S7 "Recommended next step" nudge everywhere**: the same `closestUnlocks` drives the map nudge, the results line and the tree's Next lights (already in the design; extended to the title screen).
- **S8 Tier-coloured life map**: on Deep Dusk / Long Night the restored colour returns more slowly (visual only, keeps the life-map lock).

## 16. Self-review (independent-style critique of this sheet)
Read as a fresh reviewer against LOCKED, skill-tree-v2 (sections 8, 10, Appendix C), treebudget.js, blessings.js/json, balance.json, chapters.json and enemies-v1. Findings and what was done:

| # | Finding | Action |
|---|---|---|
| 1 | Original layout idea (tool clusters at r 800 in the gaps) breaks the Dusk-ring clearance: a cluster there can only be ~80 units in radius | FIXED: moved to far slots (L-A) with the cost stated; L-B/L-C listed |
| 2 | Blessings already stack multiplicatively with tree pickup/gold (1.12 x 1.24) | FIXED: combined caps at read time + Blessing leaves the pool at cap (8.6) |
| 3 | Sustain is full (5.0): heart pity nodes would overflow | FIXED: Kinder Hearts folds the pity change into li_hearts at the same 0.2 |
| 4 | New lore/choice power would overflow 15.5 | FIXED: five category trims plus the per-weapon trim (-2.14 PE at cap) against +2.0 new (lore 1.2, choice 0.8), ceiling 15.18 |
| 5 | Name clash: tier "Dusk" vs the tree's Dusk ring | FIXED: tier renamed Twilight; the tool cluster is Night Gate |
| 6 | Bounty-only rewards cannot fill the 46-glass sink with two heroes | Recorded under 6.1 B; A keeps per-run income |
| 7 | First Deep Dusk clear too slow in the model | OPEN (needs measurement): levers listed (9.3) |
| 8 | The Fifth Hook may not be power at all for random pickers | OPEN: ablation in DT5c/DT8 |
| 9 | Density knob saturates at maxEnemies | Stated (risk 6); tiers lean on HP/damage/marks |
| 10 | Almanac counts for unbuilt enemies | Marked ESTIMATES; ids bound when EN3-EN6 land |
| 11 | Re-import could double-claim first dawns | Claims live in the save itself; a fresh import is a new save (offline, harmless) |
| 12 | Hunter's Eye health bars could be argued as accessibility, not a purchase | Boss/miniboss bars stay free; the node only adds marked-foe bars + names; S5 covers assists |
| 13 | Gold dead after the tree is complete | Suggestion S6; flagged as weak spot 9 |
| 14 | The tier mock's results card is not the locked results layout | Stated in section 2: the build adds the tier pieces to the locked layout |
| 15 | Summon builds at the top tier (Soulstone) not yet measured | Added as a 9.1 gate |

## 17. Security check and Fit check
- **Security check**: design only, no game code changed, no dependencies, no downloads (web research read-only). The design whitelists tier ids from URL params and saves, bounds every new save field (Dawnglass, stats.tiers, counters, run results), keeps one-time bounties inside the save, uses `textContent` only, and adds hostile-save tests; the mock-up shooter uses its own headless Chrome on port 9382 with a throwaway profile and closes only its own process (dev servers and other Chrome processes untouched).
- **Fit check**: nights that deepen (Twilight -> Deep Dusk -> Long Night) and a currency made of the first light (Dawnglass) fit the Hollow identity (light restores what the dark drained; bittersweet, hopeful); marks are Husk overlays read by shape with the locked danger colour; the tools sit as lanterns at the edge of the same Lantern Web; mechanically it keeps options-not-stats, the locked ceiling on the base tier, the Blessing caps, hidden recipes, permanent gates and the summoner fantasy, and every number is bot-measurable.
