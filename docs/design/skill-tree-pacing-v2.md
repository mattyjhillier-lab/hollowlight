# Skill tree pacing v2 (Q0 measurement, 2026-11-02)

STATUS: MEASURED with `scripts/pace-v2.mjs` (new, read-only; smoke test tests/pacev2.test.mjs). 60 journeys (5 starter weapons x 2 heroes x 6), cap 55 runs, 11 workers, 171 minutes. Raw: scratchpad pv2.jsonl; report: `node scripts/pace-v2.mjs report <jsonl> 55`. Replaces the PROVISIONAL chart in skill-tree-rework-v1.md 5.2 and v2 section 9.

## Method (as run)
- Each journey = new in-memory profile through the real SaveStore, `grantStarter` (starter pick: one hero + one of 5 spirits, its heart + first evolution free), `aggregateMods`, `nodeStatus`, `buy`, banked via the real `bankRun`. Live bot (scripts/bot.mjs playRun, Blessings + dodge, random picks), tier policy: play the highest open tier, drop a tier for 3 runs after 5 straight losses.
- Human factor 0.75 by stochastic rounding on kills per enemy type, gold, gems, chests, marked foes, ability uses, Blessings; each win kept with p=0.75 (a dropped win banks as a defeat: no boss kill, no shards); defeat survive-time x 0.75. Second-hero keepsakes sampled from chests/boss kill.
- Purchases after each run: landmarks (+ missing path nodes) first; save when a landmark is short only of gold and within 1.5 runs of income; otherwise cheapest first; non-landmark shard/Dawnglass nodes held back.
- Shared keys come from the real `stats.killsByEnemy` and `clearChapter`.

## Results (median run at which the landmark is affordable + unlocked; ALL 60 journeys)
| Landmark | p25 / p50 / p90 | reached by run 55 | gap to previous |
|---|---|---|---|
| Second Glance (sp_reroll1) | 1 / 1 / 1 | 100% | 1 |
| Holy Orbit | 2 / 2 / 2 | 100% | 1 |
| Last Whistle (sp_auto) | 2 / 4 / 12 | 93% | 2 |
| Deep Dusk gate (gt_cursed_forest_hard) | 3 / 6 / 25 | 100% | 2 |
| Last Light (li_last) | 4 / 7 / 31 | 100% | 1 |
| Raven Flock | 8 / 9 / 11 | 100% | 2 |
| Kindred Start (rs_start) | 8 / 9 / 16 | 100% | 0 |
| Lantern Blessing (rs_bless) | 11 / 14 / 56 | 90% | 5 |
| Spirit Bolts | 17 / 21 / 32 | 100% | 7 |
| Chain Lightning | 33 / 40 / 56 | 90% | 19 |
| Long Night gate (expert) | 23 / 44 / 56 | 77% | 4 |
| Fourth Card (cd_fourth) | 24 / 50 / 56 | 58% | 6 |
| Fifth Hook (rs_slot5) | 55 / 56 / 56 | 27% | 6 |
Hidden seals (veiled, not counted as chase landmarks): Lightfoot Pack p50 run 10 (90%); Wall of Wings p50 run 29 (73%).
Max gap between consecutive landmarks: landmarks only p25/p50/p90 = 13 / 17 / 30 runs; counting key/mastery diamonds 11 / 14 / 25; counting sockets/beads too 7 / 8 / 11. The aim (no gap > 5 before run 30 and > 8 after) is broken by 60 of 60 journeys on landmarks alone (54 of 60 with every node type counted).

## Findings
1. **Early is over-served, the middle and late are dry.** Runs 1-9 carry about 8 landmarks (reroll, Orbit, Last Whistle, Deep Dusk gate, Last Light, Raven, Kindred Start); then run 14 (Blessing), 21 (Bolts), 29 (Wall of Wings, veiled), 40 (Chain), 44, 50, 56. The real dry stretches are runs 10-14, 21-29, 29-40 and 44-56.
2. **Crawlers are the bottleneck.** Mean kills per run (human-factored): wolf 499, crow 569, root crawler 77. Spirit Bolts (1,500 crawlers) lands around run 21, Chain Lightning (2,500 crawlers + Treant x2) around run 40, not runs 4-6 / 11-16 as the v1 chart guessed. Ravens (4,500 crows) land around run 9.
3. **Kindred Start and the first-win pair open early** (as the review predicted): Deep Dusk gate and Last Light open on the first win (about run 5-7).
4. **Second Glance is reachable after run 1:** wallet after run 1 >= 150 gold in 58 of 60 journeys (run-1 gold p25/p50/p90 = 361 / 1,378 / 2,565; loss-run minimum 70). The LOCKED fallback (pulse the cheapest affordable node) covers the other 2.
5. **Gold per run** (mean): win 1,984-2,598, loss 992-1,669 depending on phase (more later because tiers rise).
6. **Starter matters:** Raven-start and Bolts-start journeys reach their other spirits later (Bolts-start: Chain p50 39, max-gap p50 22 runs; Raven-start: Bolts p50 30). Wolves-start is the quickest.

## Honest caveats (do not over-read)
- Win rate in this model is LOW (14% runs 1-5, 6-12% later) versus the locked fresh target 15-30%, because the human factor stacks 0.75 on bot wins and the tier policy pushes players onto harder tiers. So time-to-clear landmarks (Long Night gate p50 44, Fourth Card p50 50) is pessimistic; real players of average skill may clear Deep Dusk sooner. It still confirms the Deep Dusk / Long Night clears are the long pole and is a BALANCE question for Matt (not changed here).
- Not modelled: map events (Lamp Posts, Lantern Road, Hollow Knot), a focus-bot or human-skill spread, hero choice per run (alternates only once both are awake), Dawnglass-only gates in detail. 6 journeys per cell is small: treat p90 as noisy.
- Starter pick distribution is equal-weight across the 5 launch weapons; when wolves/ravens become companions the starter pool changes and this must be re-run.

## What this means for the tree rework (Q7 and the S1 branches)
- Put NEW landmarks (reserved slots, branch seals, hero keepsake medallions, Meteor later) in the gaps: runs ~10-14, ~21-29, ~29-40, ~44-56. The three-spoke branches add 9 seals per weapon with diamonds and forks between landmarks: that alone moves the "wide" gap p50 to 8 runs; with fork/seal gates spread over runs 10-40 it can reach the aim.
- Bolts is the natural mid-game landmark (run ~21); Chain Lightning a late one (run ~40): consistent with the scatter rule (Orbit near, Bolts near-mid, Chain far).
- Consider lowering the crawler gates only after Matt decides on the balance question above.
