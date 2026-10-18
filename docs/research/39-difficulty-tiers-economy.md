# 39 - Difficulty tiers, tier rewards and second currencies

Date 2026-10-18. For docs/design/difficulty-tiers-economy-v1.md (LOCKED 'DIFFICULTY TIERS IDEA', 'TREE UPGRADE GROUPS', 'TREE SIZE AND RESOURCES'). Builds on research 19 (Spirit Hunters), 22 and 38 (skill trees), 03 (meta), 04 (pitfalls). Labels: OFFICIAL (developer / store / in-game text), COMMUNITY (wikis, guides, forum tests), OPINION (reviews, single player views). UNVERIFIED = single source or conflicting sources. Web read 2026-10-18; read-only, nothing downloaded.

## 1. Game by game

### Vampire Survivors
- Per-stage toggles on the stage select: **Hyper** (player and enemies faster, +50% gold, on some stages more luck and enemy HP; bonuses shown in a window above stage select), **Hurry** (clock x2, +25% XP; timed events keep their timestamps), **Inverse** (enemies 200% max HP plus +5% HP and +0.5% speed per minute, more gold and +20% luck; figures conflict between sources). Hyper unlocks per stage, mostly by beating a stage boss; Inverse needs a relic (COMMUNITY vampire.survivors.wiki/w/Hyper, fandom Stages, dotesports; Inverse numbers UNVERIFIED).
- The **Curse** stat (more, faster, tougher enemies) is a player-built difficulty dial that also feeds item/arcana builds (COMMUNITY, from research 03).
- Lesson: difficulty as small readable toggles that each PAY (gold, luck, XP); bonuses are printed before you start. Risk: stacking toggles turns gold into a farm (VS players farm Hyper/Inverse for gold; COMMUNITY).

### Spirit Hunters: Infinite Horde (Matt's reference; research 19)
- Maps and Hard / Hardcore / Brutal sit behind web nodes (Hard reported ~500 runes per map; UNVERIFIED). Hard adds curses and bigger resource multipliers; **Ember Cores drop only in Hard** and buy the outer web, which then makes higher tiers beatable: a clean outward spiral (COMMUNITY gamepretty; OPINION buried-treasure).
- Complaints: grindy tail, tiny bonuses, achievement-gated unlocks, currency-conversion passives that go dead once the web is full (OPINION vaporlens; COMMUNITY Yippo).
- Lesson: tier-only currency is the strongest "why play Hard" hook; it must have a real, finite sink and never go dead.

### Brotato (Danger 0-5)
- Cumulative danger levels. Enemy HP and damage +12% at D3, +26% at D4, +40% at D5 (totals, not stacked). Elites/hordes start at D2 (1 wave at D2-3, up to 3 at D4-5, waves 11-18; 40% horde / 60% elite); elites from D2 drop a Legendary crate. D5: both bosses at wave 20 with -25% HP each. Patch 0.6.0.7 replaced "inflation" / "fewer materials" rules with elite/horde rules (COMMUNITY brotato.wiki.spellsandguns.com Waves/Enemies/Patch_0.6.0.7, gameplay.tips, ludo.guide).
- Rewards: no meta currency; the hook is per-character danger records/achievements (COMMUNITY).
- Lesson: modest stat steps (12-40%) plus NEW situations (elites, a second boss) read better than big multipliers; economy-penalty rules were removed because they felt bad.

### Halls of Torment (Agony)
- Per stage, unlocked after beating the stage Lord; toggled on the stage select. A meter rises with kills and falls while monsters live; each Agony level raises monster count, HP and XP drops; a revive costs Agony (COMMUNITY Steam threads, primagames; OFFICIAL patch text via fullcleared). Max level IV or V (UNVERIFIED). A planned Shrine of Torment (artifact = +1 Torment + a modifier) was a dev concept (OFFICIAL dev post, shipping UNVERIFIED).
- Lesson: performance-scaled difficulty self-balances but is hard to read and hard to bot-measure; giving MORE XP with the danger keeps it fair.

### Hades (Heat, Pact of Punishment)
- Players compose Heat from ~15 conditions with ranks. Rewards are **bounties**: the first clear of a boss at a new Heat with each weapon pays Titan Blood / Diamonds / Ambrosia; without a bounty the boss pays Darkness instead (COMMUNITY fextralife, thegamer, primagames).
- Lesson: first-clear bounty per (loadout x tier) gives a lot of replay with a FINITE payout; a fallback currency means a run is never worth nothing; player-composed difficulty is loved by experts but is a lot of UI.

### Dead Cells (Boss Cells 0-5)
- Earned one at a time by beating the final boss with N cells active. Each raises enemy tier, density and variety and limits healing (fewer fountains, flask refills only at set points); rewards: more cells dropped, higher Legendary Forge cap, **new blueprints and bonus doors** that exist only on higher BC (COMMUNITY deadcells.wiki.gg BSC). The "Update of Plenty" smoothed the jumps between BC levels (COMMUNITY).
- Lesson: higher tiers unlock NEW CONTENT, not only numbers; healing limits are the sharpest lever; big jumps between tiers had to be smoothed.

### Hollow Knight (Steel Soul, Radiant)
- Steel Soul (permadeath) unlocks after a first completion; rewards are cosmetic/achievement (OFFICIAL in-game; COMMUNITY). Radiant boss fights (one hit kills) in Godhome are pure mastery records.
- Lesson: the top tier can pay prestige and cosmetics only; that is enough for the players who want it.

### Slay the Spire (Ascension 1-20)
- Per character; Ascension N+1 unlocks by winning at N; each level adds ONE rule on top of all previous ones (elites more often, enemy damage/HP, less healing, fewer potion slots, a curse card, worse events, higher prices, a double boss at 20); losing never lowers it (COMMUNITY highgroundgaming; StS2 uses a 10-step ladder, count UNVERIFIED).
- Lesson: one readable rule per step; per-character ladders multiply replay; never take progress away.

### Rogue Legacy 2
- New Game+ "threads" require a rising minimum number of Burdens; Traits pay gold scaled to how debilitating they are (One-Hit Wonder has the biggest bonus and is the most popular trait) (OFFICIAL dev interview via gonintendo; COMMUNITY commonsensegamer; per-burden gold UNVERIFIED).
- Lesson: an opt-in handicap paid in currency is popular when the payment is honest and visible.

### Soulstone Survivors (Curse tiers)
- Curse tiers I-VII (4, 10, 18, 25, 34, 41, 48 curses cumulative); the next tier unlocks by winning with ALL previous curses on; curses raise the soul (meta) reward and prestige; some runes need a curse-tier clear on a specific map (COMMUNITY Steam threads; numbers from a 2022 thread, may be out of date).
- Complaints: daily threads from players blocked by one unticked tier-I curse; summons "get one-shotted" at high curses (OPINION/COMMUNITY).
- Lesson for a SUMMONER game: check summon builds at the top tier; always show exactly what blocks the next tier.

### Death Must Die (Star Crux)
- A difficulty adjustment unlocked later; chosen modifiers raise item rewards; up to difficulty 30. A patch cut enemy health bonuses and boss life per level (40% -> 35% per level, 120% -> 105% max) because the dev wanted D30 "consistently beatable with a wider range of builds" (OFFICIAL patch notes via primagames).
- Lesson: the top tier must be beatable by many builds, not one; tune the scaling, do not gate builds.

## 2. Patterns (what most of them do)

| Pattern | Seen in | Fits Hollowlight? |
|---|---|---|
| Fixed cumulative tiers, one rule per step | StS, Brotato, Dead Cells, Soulstone | yes: readable, bot-measurable, phone-friendly |
| Player-composed dial (Heat, curses, toggles) | Hades, VS, Soulstone, DMD, RL2 | later layer (experts); big UI and balance matrix |
| Performance-scaled meter | Halls of Torment | weak: hard to read and to measure |
| Unlock next tier by clearing the previous | all | yes; Matt wants the tree to hold the unlock |
| Tier-only currency feeding an outer ring | Spirit Hunters (Ember Cores) | yes, the "outward spiral" Matt likes |
| First-clear bounty per loadout x tier | Hades | yes: per hero x tier; finite, generous |
| New content behind tiers (blueprints, doors, runes) | Dead Cells, Soulstone | yes: options behind tiers = progression-gates principle |
| Elites / affixes / second boss instead of only bigger numbers | Brotato, StS, Dead Cells | yes, if each affix is one readable verb |
| Healing limits as the strongest lever | Dead Cells, StS | use gently (heart pity), never remove hearts |
| Cosmetic / record-only top tier | Hollow Knight, Brotato | yes for the very top (stars, lantern rim) |

## 3. Second-currency pitfalls and guard rails

| Pitfall | Example | Guard rail for Hollowlight |
|---|---|---|
| Unclear purpose ("what is this for?") | many F2P games | one identity, one ring: dawnglass buys only Daybreak lanterns + the Long Night gate + cosmetics |
| Conversion loops / dead currency once maxed | Spirit Hunters conversion passives (Yippo) | no conversion between currencies; a cosmetic sink exists from day one so leftover dawnglass is never dead |
| Grind walls (rare RNG drops) | SH:IH grind tail (vaporlens) | deterministic sources (boss, dawn, first clears); small elite drops capped per run |
| Farming the easiest tier for it | VS Hyper gold farming | dawnglass never drops on the base tier; per-run cap |
| Tier currency becomes the only path to power | outer-web power in SH:IH | power bought with it is tier-scoped (works on the tiers that pay it), so the base ceiling holds |
| Too many currencies at once | general | max one new resource per design pass; each new one needs identity, source, sink, economy line, save field (LOCKED) |

## 4. Reward curves (numbers seen)

| Game | Reward step | Difficulty step |
|---|---|---|
| VS Hyper | +50% gold (+ luck on some stages) | faster everything |
| VS Inverse | about +200% gold, +20% luck (UNVERIFIED) | 2x HP + growth per minute |
| Brotato | elite crate per elite | +12 / +26 / +40% HP and damage |
| Dead Cells | cells x2 at high BC, forge cap, new blueprints | tier, density, variety, healing |
| Hades | one-time bounties per weapon x Heat; fallback Darkness | composed Heat |
| DMD | bigger item rewards; boss +35% life per level after the nerf | up to 30 levels |

Reading: reward multipliers sit around 1.5x for the first hard step and 2-3x at the top, usually paid mostly as ONE-TIME bounties or new unlocks rather than a farmable rate. Difficulty steps in stat terms are modest per step (+12% to +40% HP) and get their teeth from new situations (elites, second boss, less healing).

## 5. Time to first clear vs mastery, accessibility, fairness

- First clear of the base tier should be achievable by most players (StS, Hades: the base game is the story). Hollowlight already locks the starter band at 15-30% no-tree (players grow into it with the tree).
- Harder tiers are for players who already won; the first win on the next tier should feel like the first win on the base tier did (the "same struggle, new toys" loop of SH:IH and Dead Cells).
- Accessibility: the lowest tier must not be punished (Hades God Mode, many games' assist modes); harder tiers must not be the only way to power (Matt's lock).
- Fairness: every new threat telegraphed and readable at a glance (Hollowlight visibility gates G1-G8); no hidden RNG walls; never take progress away on a loss (StS); show what blocks the next tier (Soulstone complaint).

## 6. Sources
- vampire.survivors.wiki/w/Hyper; vampire-survivors.fandom.com/wiki/Stages; dotesports.com (Inverse mode) (COMMUNITY)
- docs/research/19-spirit-hunters-reference.md and its sources (gamepretty, buried-treasure, vaporlens, Yippo guide)
- brotato.wiki.spellsandguns.com/Waves, /Enemies, /Patch_0.6.0.7; gameplay.tips/guides/brotato-danger-5-guide.html; ludo.guide Brotato modes (COMMUNITY)
- primagames.com/gaming/halls-of-torment-what-is-agony-mode; steamcommunity.com/app/2218750 discussions; fullcleared.com (Halls of Torment update) (COMMUNITY / OFFICIAL patch text)
- hades.wiki.fextralife.com; thegamer.com/hades-how-to-get-more-titan-blood; primagames.com/gaming/hades-guide-pact-of-punishment-modifiers-heat (COMMUNITY)
- deadcells.wiki.gg/wiki/BSC; deadcells.fandom.com/wiki/Boss_Stem_Cells (COMMUNITY)
- highgroundgaming.com/slay-the-spire-ascension-guide; keengamer / sts2.untapped.gg (StS2) (COMMUNITY)
- gonintendo.com (Rogue Legacy 2 dev on traits, OFFICIAL interview); commonsensegamer.com (burdens) (COMMUNITY)
- steamcommunity.com/app/2066020 discussions (Soulstone Survivors curse tiers) (COMMUNITY/OPINION)
- primagames.com/tips/death-must-die-november-21-update-full-patch-notes-listed (OFFICIAL patch notes, reproduced)
- Hollow Knight Steel Soul / Radiant: in-game and community knowledge (no page fetched; COMMUNITY)
