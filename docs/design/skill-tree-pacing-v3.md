# Skill tree pacing v3 (S1 tree, 274 nodes, measurement for Q7)

STATUS: MEASURED 2026-11-12, measure only (no sim/data/balance change). Tree = composed live tree (274 nodes, roads, branches, v5), `S1=1 node scripts/pace-v2.mjs run out.jsonl 5 55 12`, report with `S1=1 node scripts/pace-v2.mjs report out.jsonl 55`. Method unchanged from [pacing v2](skill-tree-pacing-v2.md): real SaveStore/bankRun/buy, live bot, human factor 0.75, tier policy (play highest open tier, drop one for 3 runs after 5 straight losses).

Sample: **50 journeys** = 5 spirits x 2 heroes x **5 journeys per cell (seeds j=1..5**; run seed j*1000+r, journey rng j*7919+17), cap 55 runs, 84 min on 12 workers. The brief asked for 32+ per cell; that is about 16 h at about 30 min per journey, so it was cut to 5 (v2 used 6). **p90 is noisy; treat p25/p50 as the signal, and a per-start cell (n=10 per spirit) as a trend only.** "56" means "not reached within 55 runs"; where under 50% reached, the p50 is censored.

## 1. Arrival run per landmark (ALL 50 journeys; run it is affordable + unlocked, or bought)
| Landmark | p25 / p50 / p90 | reached | what gates it (data) |
|---|---|---|---|
| Second Glance (sp_reroll1) | 1 / 1 / 1 | 100% | gold 150 |
| Almanac bridge | 1 / 2 / 4 | 100% | gold, short road |
| Holy Orbit | 3 / 4 / 8 | 100% (n=40) | gold 150 + road (or_way3); no kill gate |
| Halo seal (or_halo) | 4 / 5 / 9 | 100% | gold |
| Deep Dusk gate | 5 / 8 / 16 | 100% | CLEAR Cursed Forest + 1200 gold + 2 shards |
| Raven Flock | 8 / 9 / 13 | 100% (n=40) | 4,500 crows (kills) + road + 200 gold |
| Last Whistle (sp_auto) | 9 / 14 / 24 | 100% | survive 5:00 (met run 1); GOLD 1050 + road |
| Judgement Wheel seal | 10 / 13 / 24 | 100% | gold + conditions |
| Hearth Key bridge | 12 / 14 / 26 | 100% | gold + road |
| Kindred Start (rs_start) | 14 / 18 / 29 | 100% | met run 7; GOLD 1500 + road |
| Card Fan bridge | 16 / 21 / 31 | 100% | gold + road |
| Spirit Bolts | 16 / 23 / 39 | 100% (n=40) | 1,500 root crawlers (about 70 per run) |
| Lantern Blessing (rs_bless) | 22 / 28 / 37 | 100% | 15 Blessings (met run 3); GOLD 1800 + 2 shards |
| Satchel bridge | 22 / 28 / 39 | 100% | gold + road |
| Last Light (li_last) | 24 / 30 / 41 | 98% | CLEAR (met run 3); SHARDS 5 + gold 900 |
| Murder Storm seal (veiled) | 31 / 38 / 56 | 68% | evolve ravens + 12,000 crows |
| Chain Lightning | 32 / 42 / 55 | 95% (n=40) | 2,500 crawlers AND 2 Elder Treant kills |
| Wardrobe bridge | 37 / 45 / 56 | 74% | gold + long road |
| Spirit Tempest seal (veiled) | 38 / 47 / 56 | 75% (n=40) | Treant kill + 6 evolutions |
| Static Storm seal (veiled) | 39 / 49 / 56 | 80% | kills + evolutions |
| Fourth Card (cd_fourth) | 43 / 56+ / 56 | **40%** | CLEAR Deep Dusk (hard) + 2000 gold + 8 Dawnglass |
| Long Night gate (expert) | 43 / 56+ / 56 | **42%** | clear Deep Dusk + 2500 gold, 4 shards, 10 Dawnglass |
| Soul Lance, Returning Pages, Thunder Judgment, Vesper Tide, Storm Tether, Phantom Stampede (veiled evolution seals) | 38-56 / mostly 56 | 18-42% | multi-part: Treant kills x2 + evolve that weapon, or start-weapon wins |
| Fifth Hook (rs_slot5) | 56 / 56 / 56 | **8%** | clear Deep Dusk with BOTH heroes + 3000 gold, 3 shards, 12 Dawnglass |

Per start (p50, n=10 each): **Ghost Wolves** Orbit 3, Raven 8, Bolts 14, Chain 30, Blessing 19, Last Light 22 (fastest). **Holy Orbit** Raven 12, Bolts 25, Chain 44, Blessing 34. **Spirit Bolts** Raven 12, Chain 33, Blessing 30. **Chain Lightning** Raven 9, Bolts 21, Blessing 22. **Raven** Orbit 8, Bolts 39, Chain 54, Blessing 37, Last Light 41 (slowest: the crawler gate is the long pole and Ravens kill crows, not crawlers). Wren vs Elias: no meaningful difference (max-gap p50 10 vs 11).

## 2. Gaps between landmarks (ALL, ordered by p50 arrival)
Run 1 Second Glance, 2 Almanac, 4 Orbit, 8 Deep Dusk, 9 Raven, 14 Last Whistle + Hearth Key, 18 Kindred Start, 21 Card Fan, 23 Bolts, 28 Blessing + Satchel, 30 Last Light, **42 Chain**, 45 Wardrobe, **56+ Fourth Card / Long Night / Fifth Hook**.
Biggest holes between consecutive p50 arrivals: **30 -> 42 (12 runs)**, **45 -> 56+ (11+ runs)**, then 9 -> 14 (5) and 23 -> 28 (5).

Per-journey MAX gap between consecutive landmarks (v2 aim: no gap > 5 before run 30, > 8 after):
| What counts as an event | p25 / p50 / p90 of a journey's max gap | journeys breaking the aim |
|---|---|---|
| landmarks only | 9 / 11 / 17 | 50 / 50 |
| + keystone/mastery diamonds | 9 / 11 / 16 | 50 / 50 |
| + sockets and beads (every bought diamond-tier node) | 6 / 8 / 10 | 32 / 50 |

v2 comparison: landmarks-only max gap p50 17 -> 11 (better: bridges and seals added), wide 8 -> 8 (unchanged). The old biggest hole (Bolts 21 -> Chain 40) is still there (23 -> 42), but the middle is no longer empty. Early landmarks moved LATER versus v2 because they now sit at the end of bought roads: Last Whistle 4 -> 14, Kindred Start 9 -> 18, Blessing 14 -> 28, Last Light 7 -> 30, Orbit 2 -> 4.

## 3. Dry stretches and what gates them
| Stretch (runs, p50) | What arrives | Gated by |
|---|---|---|
| 9 -> 18 | Last Whistle, Hearth Key, Kindred Start | GOLD (roads + 1,050-1,500 landmark price); the condition is met long before |
| 23 -> 30 | Blessing, Satchel, Last Light | GOLD + SHARDS (Blessing 2, Last Light 5; shards come from boss kills) |
| **30 -> 42** | Chain Lightning alone | **KILLS** (2,500 crawlers, about run 35-40) plus **2 Treant clears** |
| **45 -> 56+** | Fourth Card, Long Night, Fifth Hook, most evolution seals | **CLEARS**: all need a Deep Dusk (hard) clear; Fifth Hook with both heroes; Dawnglass 8-12 |

So: early and middle runs are GOLD-gated, Bolts and Chain are KILL-gated (crawlers about 70 per run), the late game is CLEAR-gated. Mean gold per run (human-factored): win about 1,600-2,100, loss about 800-1,400 (higher from run 31 via tier bonus). Run 1: wallet >= 150 gold in 50/50 journeys, so Second Glance is always buyable after run 1.

## 4. Honest caveats (model pessimism)
- **Win rate is a model artefact.** 25% in runs 1-10 (above v2's 14%), then 9% (runs 11-20) and 8% (21-40) once the tier policy pushes the random-pick bot onto Deep Dusk with the 0.75 human factor stacked on it. Clear-gated items (Fourth Card, Long Night, Fifth Hook, Treant x2 for Chain) are therefore pessimistic; a real player tuning a build clears Deep Dusk sooner. Treat the late column as an upper bound on dryness.
- **Tool purchase order cuts both ways.** The buyer is landmark-first (missing road nodes for landmarks whose condition is met), then cheapest-first, and holds shard/Dawnglass nodes back. It never spends gold on small perks instead of saving, so gold-gated landmarks arrive somewhat EARLIER than for a human who buys everything (optimistic by a few runs); it also does not count the many cheap nodes a human buys between landmarks, which is the real "always something to buy" feel (pessimistic about felt pacing). Clear-gated items are pessimistic as above.
- Cap 55: Fourth Card, Long Night, Fifth Hook and several evolution seals have under 50% reach; their p50 is censored, read them as "later than run 55 for the typical bot".
- Starter pick is equal-weight over 5 spirits; Raven-start is an outlier (Chain p50 54). Not modelled: map events, human skill spread, per-run hero choice, Dawnglass beyond the gates.
- n=5 per cell (50 total). A 10-per-cell run (about 3 h more) only if a Q7 decision hinges on p90.

## 5. Q7 options (landmark promotion / gating)
Numbers below are ESTIMATES from reading the gates against the measured kill/clear/gold rates; none were re-run.

**Option A, promote seals, change no gate (recommended first step). PICKED + BUILT 2026-11-12 (wip/tree-q1):** display-only node flag `chase: true` on gt_murder_storm, gt_spirit_tempest, gt_static_storm, br_wardrobe (tree.js describeNode unmasks it, treetier draws it as a landmark medallion, the map label shows a 'To wake' progress chip even before its spirit wakes; forks behind a seal stay veiled; release fingerprints ignore the flag; pace-v2 counts the three seals as landmarks via CHASE). Expected gap numbers below still to be re-measured. Promote existing hidden seals and bridges into chase landmarks (progress chips and Next lights) at the dry points: Murder Storm (p50 38), Wardrobe (45), Spirit Tempest (47), Static Storm (49) already sit inside the 30-56 hole. Expected: landmark-only max-gap p50 11 -> about 8, p90 17 -> about 12. No balance risk, no locked-design change. Weakness: the seals are evolution-gated and hidden, so a player must be shown what to chase (chip, Almanac hint).

**Option B, relax the two gates that create the holes (needs Matt: unlock conditions and a power perk).** (1) Chain Lightning: 2 Treant kills -> 1 and/or crawlers 2,500 -> 2,000; crawlers dominate, so expected p50 42 -> about 34, closing the 30 -> 42 hole to about 4-5. (2) Fourth Card: unlock `clearTier hard` -> `clearChapter cursed_forest` (normal clear), Dawnglass 8 kept; it then arrives about run 20-30 instead of past 55. Keep Long Night and Fifth Hook on hard clears as the long-game goals. Risk: offerSize +1 is a real power perk, so it moves the tree's power budget earlier; re-run bless-sweep and the RT matrix before locking. That is a balance decision.

**Option C, gold-side fill.** Add 2 more gold-only landmark-class nodes (reserved slots) at about run 33-38 and 46-52 on existing roads, plus Last Light shards 5 -> 3 (arrives about run 18-20 instead of 30). Fills the 30-56 span for every player regardless of skill. Risk: needs roads long enough that progress is felt, adds nodes and budget.

**Recommendation: A now. Then B(2) only (Fourth Card on a normal clear) if Matt wants the mid game fuller: it is the single change with the biggest measured effect, since the late hole is clear-gated and about 60% of bots never reach it by run 55. Leave Chain alone unless Raven-start (Chain p50 54) is judged too slow, in which case B(1). C is the fallback if gate relaxations are refused.** Re-measure at 10 per cell after any gate change.
