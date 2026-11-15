# 42 - Survivors-likes pacing and clarity: what the PUBLIC record says (2026-11-15, docs only)

Purpose: input to docs/QUEUE.md "PACING + SENSE REVIEW". Builds on docs/research/34-spirit-hunters-meta.md (read it first; not repeated). No game files opened (LOCKED: Spirit Hunters file not used). Everything paraphrased; no art/text/names/code copied.
Tags: OFFICIAL (store/developer/wiki-by-developer), COMMUNITY (guides, wikis, forums, Steam threads), OPINION (reviews, my inference). UNVERIFIED = single source, old patch, or inference.

## 0. Honesty note: the record is THIN on the numbers that matter most

- Standard search only. No developer talks, no YouTube transcripts, no Reddit threads reachable. Review-aggregator pages (vaporlens, gamebrain) are auto-generated: weak evidence, flagged where used.
- No source gave a node-by-node unlock list for Spirit Hunters, a first-hour timeline, or an "average runs to first unlock". Nobody publishes cadence data. So Wispwick's own bot model (pacing v4) is better evidence for cadence than anything public; the public record mostly gives DESIGN PATTERNS and PLAYER REACTIONS.
- Versions: most guides are early-access era (2022-23). Treat numbers as approximate.

## 1. Meta progression (question 1)

### Spirit Hunters: Infinite Horde
- Currencies are split by rarity: a common one buys most nodes, a rare one gates milestones, a hard-mode-only one gates top tier. Costs rise through the web (a guide cites 25 up to about 75 for map nodes). COMMUNITY (gamepretty guide, naguide/trophy pages). Single guide, early patch.
- Locks are mostly ACTIVITY gates, not just cost: clear maps on Hard, clear Build Challenges on Hard, do challenges with specific heroes to open HP nodes at the bottom. Some nodes unlock whole maps; map "skull" challenge levels unlock by beating bosses. COMMUNITY (achievement guide excerpts, gamepretty).
- Size: a completed save is reported near 680 nodes; reviewers say dozens to hundreds of hours to finish. OPINION (seasonedgaming) + COMMUNITY (see doc 34). Counts UNVERIFIED.
- Early advice players give: unlock pets first, then weapons and heroes (options), then leveling/XP/collection-speed nodes. COMMUNITY (gamepretty). This matches "options before stats" and is what Wispwick locked.
- Sense of accomplishment (reviewer words, paraphrased): the big visual board makes spending feel concrete; "one more run" habit loop; always something new to chase. OPINION (seasonedgaming review 2023).
- Complaints: tree is extensive but obscure (hard to see where things are), many nodes are tiny, players asked for respec, grindy, difficulty "wonky". OPINION/COMMUNITY (seasonedgaming, moviesgamesandtech review, aggregator summaries). Aggregator claim of "minor upgrades feel insufficient" is weak evidence but consistent with doc 34.
- Respec: not found in any source (UNVERIFIED either way); players asking for it suggests it was absent or hidden.

### Vampire Survivors (comparison)
- Gold buys PowerUps (stat nodes) from the menu; total to max everything quoted around 200k coins in an old guide (UNVERIFIED, old). COMMUNITY (gamerjournalist, rogueranker).
- Refund is free and 100 percent, but players say it is buried and new players do not know it exists. COMMUNITY (rogueranker). Lesson: a good refund rule only works if it is visible.
- Unlocks are a separate checklist (stages, heroes, weapons) by objectives like reach level 20 on a stage, with a wiki for secrets. Beating a stage opens the next. COMMUNITY (primagames, rogueranker, ggrecon).
- First-hour shape per guides: stage 1 spike around minute 10, stage 2 smoother; players suggest "reach minute 10" as the first real goal. COMMUNITY (rogueranker, seinanities).

### Halls of Torment
- Blessings (gold, kept on death) are the stat meta. Only 6 Blessings are available at start, growing to 16 as you progress. COMMUNITY (primagames).
- Characters and abilities unlock by quests (kill a named boss, use a given class); each stage has its own quest line. COMMUNITY (gamepressure, commonsensegamer).
- Complaints: early game slow and repetitive, blessings are expensive so it is unclear what to buy first, stats and upgrade paths under-explained (aggregator, weak). OPINION (xboxera, gamegeeker); aggregator UNVERIFIED.

### Brotato
- Unlocks come from simple achievements (win at a danger level unlocks a character; feats such as kill N trees or heal N in a wave unlock others). Danger 0 to 5 plus Nightmare; each level stacks on the last (hp/damage steps of roughly +12, +26, +40, +60 percent, extra elites, a second weaker boss at D5). OFFICIAL-ish (community wiki, wiki.spellsandguns).
- Difficulty ladder is win-gated: you must win a level to see the next. Simple, legible, and doubles as character unlocks.

### HoloCure
- Characters come from a coin-funded gacha (free currency earned in play), stages unlock by clearing earlier stages, weapons and items unlock via achievements; up to 6 weapon slots (main plus 5) and 6 passives, main weapon 7 levels. COMMUNITY (dotesports, gfinity, samurai-gamers). Run-length and level-cap not found.

### Soulstone Survivors
- Large skill trees; reviewers praise "plays different maps and modes to progress", one says all content unlocked within about 30 hours, others call it a grind; a "double or nothing" style risk mechanic cost one reviewer progress. OPINION (rogueliker, lootlevelchill, rawg playtime); clarity claim UNVERIFIED (page attribution doubtful).

## 2. In-run pacing and dilution (question 2)

| Fact | Finding | Source |
|---|---|---|
| Spirit Hunters run | 15 minutes, then a final boss in a spike arena; mini-bosses drop chests | COMMUNITY (gamepretty), OFFICIAL (store text) |
| Spirit Hunters loadout | 4 weapons (locked once picked), up to 5 pets, 2 mods; abilities upgrade to level 25; choose a Starting Synergy at run start | COMMUNITY (gamepretty), OPINION (seasonedgaming) |
| Vampire Survivors | 30 minutes, 6 weapons, evolution = weapon level 8 plus matching passive plus an elite chest after about minute 10 | COMMUNITY (rogueranker, earlyguides) |
| HoloCure | 6 weapons + 6 passives, main weapon 7 levels | COMMUNITY (gfinity) |
| Halls of Torment | about 30 minute levels (a reviewer says that is where pacing falters) | OPINION (xboxera) |
| Brotato | 20 waves, boss at wave 20, shop between waves | COMMUNITY (trueachievements, wiki) |

Levels per run and XP curves: NOT found in any source. UNVERIFIED. Do not quote anyone for these; use Wispwick's own sweeps.

Dilution (the "more unlocks makes each pick worse" problem) is the single best-documented design issue:
- Players on several games say that as the pool grows, the chance of the exact item you want falls and builds feel weaker or harder to assemble. COMMUNITY (Steam threads for God of Weapons and similar).
- Vampire Survivors' answer is Banish: remove one option for the rest of the run, capped uses. The banish and its upgrades themselves only unlock after you have added enough items to the pool, so the tool arrives when the need does ("self-scaling"). OPINION (GMDQ analysis, which cites a talk by the game's creator; talk itself not read).
- Other tools seen: reroll, seal/ban power-ups with limited uses, pool-size limits, fixed starting loadouts, evolutions that need a specific passive partner (so a random pick is not wasted), elite chests as guaranteed upgrades, and Brotato's shop bias toward weapons you already own. COMMUNITY/OPINION.
- Complaint about dead picks: offers you cannot use with your build (a game review). Counter-tool: bias the pool toward your build (Brotato shop; Wispwick's evoNudge already does this for recipe stats).
- Reroll-until-right-card behaviour is called out as a symptom that the player has no agency otherwise. OPINION.

## 3. Clarity for new players (question 3)

- Vampire Survivors: no tutorial by design; reviewers split between "it just starts, great" and "evolutions are never explained". Evolution recipes discoverable in a pause-menu book once seen. COMMUNITY (robots.net, itch comments, earlyguides).
- Spirit Hunters: guides leave gaps (a helper figure on the web is not explained; hard-mode details; web paths "explore yourself"). The one clarity complaint a reviewer states plainly: players die without knowing what killed them; wants better feedback. OPINION (seasonedgaming).
- Halls of Torment: stats, skills and upgrade paths said to be under-explained; early RNG heavy before reroll tools exist. Weak (aggregator + guide).
- Soulstone: upgrade descriptions said unclear (weak).
- Recurring pattern: hidden-but-powerful tools (refund, banish, evolution recipes) are the things new players miss; the fix players ask for is a small in-game pointer, not a tutorial wall.

## 4. Praise and complaints, short list

Praise (all OPINION/COMMUNITY): a huge visible web that makes progress feel physical; ever-present "next unlock" goal; options-led unlocks (pets, weapons, heroes) that change how runs feel; short-ish runs; build synergy depth.
Complaints: grind and slow early game (HoT, SH, Soulstone); tiny stat nodes; tree legibility; unbalanced difficulty spikes (first stage minute 10 in VS, boss difficulty in SH); pool dilution; no respec or hidden refund; unclear death cause; repetition after content is done.

## 5. Comparison table

| | Spirit Hunters | Vampire Survivors | Halls of Torment | Brotato | HoloCure | Wispwick (now) |
|---|---|---|---|---|---|---|
| Run | 15 min + boss | 30 min | about 30 min | 20 waves | about 20 min (UNVERIFIED) | 15 min + Elder Treant |
| Weapon slots | 4 (+5 pets) | 6 + passives | not found | 6 (shop) | 6 + 6 passives | 4 |
| Meta shape | one huge web, 3 currencies | flat PowerUp list + unlock checklist | Blessings 6 to 16 + quests | no stat tree; character/danger unlocks | gacha + achievements | Lantern Web 283 + 40 nodes (kills, clears, hidden, hero) |
| Lock types | hard-mode clears, challenges, hero-specific | stage/level objectives, secrets | boss quests | win at danger, feats | stage clears, achievements | kill counts, chapter/night clears, hidden seals, lamps |
| Refund/respec | none found | free full refund (buried) | potions of re-roll (limited) | n/a | n/a | check current build before comparing |
| Dilution tool | starting synergy, locked loadout | banish (self-scaling), seal | oblivion potions (limited) | shop bias | not found | reroll/banish tree unlocks + evoNudge |
| Difficulty ladder | skull challenge levels, hard mode | stages + hyper/curse | per-stage | Danger 0-5 stacking | stage then hard | Twilight, Deep Dusk, Long Night, Gentle Light |

## 6. What applies to Wispwick (small, concrete)

Wispwick facts used: 15-minute runs, 4 slots, 4 magic weapons (5 locked in v1 incl. Spirit Bolts etc; wind coming), Bond, tree 283 + 40 nodes, pacing v4 dry stretch runs 30-56 (Chain Lightning p50 run 40, Fourth Card and Long Night about 55-56).

1. The genre's best-liked structure is options first, small stats later, and the Spirit Hunters community advises exactly that order. Wispwick already does this; the risk is the opposite one: a long gap with NOTHING to open (30-56 runs). Public games hide that gap by running several unlock currencies and checklists in parallel (rare currency for milestones, achievement-style unlocks, hero quests). Wispwick should check that something visible unlocks at least every 8-10 runs even in the dry stretch (pacing v4 gap p50 8 with sockets/beads/keys; 11 landmarks only).
2. A flat number of tiny nodes gets criticised (+1 percent nodes). Wispwick's 1-3 percent nodes are the same hazard; mitigate by showing progress toward the next landmark and by grouping small nodes behind one visible reward.
3. Dilution: Wispwick has 4 slots and 4-5 weapons, so dilution is mild now but will grow with wind and companions. Banish (a self-scaling tool that unlocks as the pool grows) is the proven answer; Wispwick already gates reroll/banish early, which matches. Re-check the order: banish should arrive before the pool grows large, not after.
4. Evolution clarity: VS hides recipes and a book fixes it after discovery. Wispwick's hidden-recipe plus Almanac matches; the missing piece players ask for is a hint that a recipe exists (an "evolution ready" card is a strong signal; keep it loud).
5. Death-cause feedback was named by a reviewer as a pain point. Check Wispwick's results screen states what killed you and at what time.
6. Refunds: free, visible refund beats hidden refund. Verify Wispwick's respec/refund rule is findable in the tree screen itself.
7. Difficulty ladder: Brotato's win-gated danger levels double as unlock triggers and are legible. Wispwick's night ladder is similar; ensure the first locked night is shown with its win condition.
8. Spirit Hunters players tell newcomers what to buy first (XP/pickup nodes, then options). A one-line suggested first purchase in the first 5 runs would address "what do I spend on" confusion reported in Halls of Torment.

## 7. What NOT to copy

- A 500-700 node web that takes dozens to hundreds of hours: Wispwick's 283+40 is already large; legibility complaints rise with size.
- Grind as pacing. The most consistent complaint across HoT, SH and Soulstone is a slow early game. Do not pad the first 5 runs.
- Hidden essentials (VS refund, unexplained helper figures). Make them visible.
- 30-minute runs with first-stage spike at minute 10 (VS/HoT): Wispwick's 15-minute shape is closer to Spirit Hunters and should stay.
- Unclear hard-mode multipliers; Brotato shows stacking is fine but only when each step is named and visible.
- Any specific names, node layouts, art, text from these games.

## 8. Testable hypotheses for the PACING + SENSE REVIEW gate

H1. Something the player can SEE change (new card, weapon, node group, night, Bond rung) happens at least once every 8 runs across runs 1-60. Test: extend pacing v4 with the sockets/beads/keys landmarks and report the max gap (target p50 <= 8, p90 <= 14) for the 30-56 stretch.
H2. First 10 minutes: a fresh player (no tree) reaches level 4-6, takes a second weapon card, and sees the first hint, and dies or wins before minute 10 on a Twilight run with a median first-evolution time after minute 8. Test: bot FOCUS and random on a fresh save; compare to locked targets (no death before about 5:00).
H3. First 5 runs: the player can afford at least 3 purchases and sees one option unlock (weapon, evolution or ability) by run 5. Test: gold per run (human-factored 0.75) summed over 5 runs versus cheapest-node costs; report runs to first option node.
H4. Dilution: with all 4-5 weapons unlocked and 4 slots, the chance that a given level-up offers at least one card for an owned weapon stays above 80 percent after slot 4 fills; and a banish/reroll user reaches the first evolution no later than a no-tool player (median). Test: Monte Carlo on cards.js draw with a full tree pool.
H5. Levels per run (15 min) land in a band where 2-3 weapons reach max stats and 1-2 evolve in a typical winning run; fewer than 1 evolution in a median winning run fails the "dilution" concern. Test: sweep winners, report maxed-weapon count and evolutions per winner.
H6. Orientation test with Matt-as-fresh-player or one outside tester: after run 3 they can say what gold, shards and Bond are for in one sentence each, and name what killed them. Pass if 3 of 3 answered unprompted; any miss gets an in-game line, not a tutorial.
H7. Refund/respec is findable in under 10 seconds from the tree screen. Test: Matt timed on a fresh profile.
H8. Wind weapon + companions raise the pool without moving slot count: with wind added, the first-evolution median shifts by no more than 1 minute versus now. Test: g1d/sweep before and after wind, 48+ seeds each.

## 9. Sources (public pages read or surfaced; none paid)

- gamepretty guide (SH loadout, chests, 15 min, early meta advice): https://gamepretty.com/spirit-hunters-infinite-horde-basic-guide-to-new-hunter/ [COMMUNITY]
- seasonedgaming review (web, grind, death clarity): https://seasonedgaming.com/2023/07/21/review-spirit-hunters-infinite-horde-unending-spirit/ [OPINION]
- moviesgamesandtech review: https://moviesgamesandtech.com/2023/06/28/review-spirit-hunters-infinite-horde-2/ [OPINION]
- Steam store (SH): https://store.steampowered.com/app/1914580 [OFFICIAL]
- Vaporlens/gamebrain aggregators (SH, HoT, Soulstone): https://vaporlens.app/app/1914580/spirit_hunters_infinite_horde [OPINION, weak]
- Trophy/achievement pages (SH web gates): https://trophieshunter.com/games/spirit-hunters-infinite-horde-ps5/achievements/divinity-web-pure-power [COMMUNITY]
- rogueranker VS guide (refund, PowerUps): https://rogueranker.com/vampire-survivors-guide/ [COMMUNITY]
- earlyguides VS beginner guide: https://earlyguides.pages.dev/vampire-survivors/beginners-guide [COMMUNITY]
- GMDQ on Banish design: https://gmdq.substack.com/p/vampire-survivors-banish-mechanic [OPINION]
- Steam thread on pool dilution (God of Weapons): https://steamcommunity.com/app/2342950/discussions/0/3881596263312838083 [COMMUNITY]
- Brotato danger wiki: https://brotato.wiki.spellsandguns.com/Dangers [COMMUNITY]
- Brotato walkthrough: https://www.trueachievements.com/game/Brotato/walkthrough [COMMUNITY]
- HoloCure armory/characters: https://www.gfinityesports.com/guides/holocure-armory ; https://holocure.wiki.gg/wiki/Weapon [COMMUNITY]
- Halls of Torment characters/blessings: https://commonsensegamer.com/halls-of-torment-how-to-unlock-all-characters/ ; https://primagames.com/gaming/best-blessings-in-halls-of-torment [COMMUNITY]
- Halls of Torment review: https://xboxera.com/2025/10/28/halls-of-torment-review ; https://www.gamesasylum.com/2025/10/28/halls-of-torment-review/ [OPINION]
- Soulstone reviews: https://rogueliker.com/soulstone-survivors-review/ ; https://lootlevelchill.com/reviews/soulstone-survivors-review/ [OPINION]
- Prior in-repo research: docs/research/34-spirit-hunters-meta.md, 38-skill-trees.md, 39-difficulty-tiers-economy.md.

## 10. Gaps to close if Matt wants more certainty

- Spirit Hunters levels per run, XP curve, first-hour unlock timeline, respec: not publicly documented in anything reached. Matt's own screenshots and play memory are the only reference (allowed by LOCKED).
- A Steam review sample (not just aggregators) and YouTube first-hour videos would firm up question 3; needs extended search or manual watching.
- Security check: docs only, no deps, public pages only, no personal data in requests. Fit check: research only; nothing added to the game.
