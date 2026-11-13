# Skill tree pacing v4 (2026-11-13, measure only)

Model: scripts/pace-v2.mjs, S1=1, human factor 0.75, cap 55 runs, 50 journeys (10 per starter). Tree = current dev (Q7-A promoted hidden seals, Far Sight `co_far`, Kindling diamonds). Raw report: the table below was produced by `S1=1 node scripts/pace-v2.mjs report <out.jsonl> 55`.

## Headline (v3 -> v4)
| Measure | v3 | v4 |
|---|---|---|
| Biggest gap, landmarks only, p25/p50/p90 | n/a/11/n/a | 9/11/16 |
| Biggest gap, + diamonds (incl. Kindling), p50 | 8 | 11 |
| Biggest gap, + sockets/beads/keys/mastery, p50 | n/a | 8 |
| Journeys reaching Fourth Card by run 55 | 40% | 50% |
| Journeys reaching Long Night (cursed_forest_expert) | 42% | 54% |
| Journeys reaching Fifth Hook (rs_slot5) | 8% | 16% |

## Honest reading
- Landmark gap p50 is unchanged at 11. The new landmarks did NOT shorten the biggest dry stretch in this model. The gap that still dominates is runs ~30-56 (Chain Lightning at p50 run 40, Murder Storm 39, Spirit Tempest 46, Static Storm 49, Fourth Card/Long Night about 55-56).
- Far Sight (`co_far`) shows 0% reached: the model never satisfies "Light 120 lamps" inside 55 runs. CAUSE FOUND (2026-11-13): the sweeps run Sim with `sites` off (the game passes `sites: true`; sweeps default off), so lamps are never lit or banked and `stats.sites.lamps` stays 0. This is a model gap, not a game fault: Far Sight's 0% says nothing about 120 lamps. Real pace is unmeasured; a run has lamp groups at 40 s, 260 s and 620 s, so a player lighting a handful per run would reach 120 in roughly 10-25 runs. To measure it, run a sweep with `sites: true` and count lit lamps per run.
- Kindling diamonds were added to the model as kind `verb` (one per weapon cluster). They did not lower the diamond-inclusive gap (p50 8 -> 11 is the metric difference plus the later landmarks, not an improvement or regression we can separate here).
- Late gates still sit behind Deep Dusk clears (Fourth Card 50%, Long Night 54%, Fifth Hook 16%, and the evolutions Vesper Tide / Returning Pages / Phantom Stampede about 20% outside Ghost Wolves starters).
- Noise: 10 journeys per starter; percentages move in 10% steps per starter, about +-7 points overall. Differences of one or two journeys are not signal.

## Suggested follow-ups (Matt decides)
1. Check how pace-v2 models lamps lit; then decide whether 120 lamps stays.
2. If the 30-56 stretch should be filled, add landmarks there, or lower the Deep Dusk clear gates. That is a design call (LOCKED).

## Full report

## ALL  (50 journeys, cap 55 runs)
landmark | p25/p50/p90 run it is AFFORDABLE+UNLOCKED | % reached | condition-met p50 | bought p50 | n(not owned at start)
sp_reroll1               1/1/1        100%   met 1  bought 1  n=50
gt_holy_orbit            3/4/8        100%   met 2  bought 4  n=40
gt_spirit_bolts          16/23/39     100%   met 23  bought 23  n=40
gt_raven_flock           8/9/13       100%   met 9  bought 9  n=40
gt_chain_lightning       32/40/56      90%   met 40  bought 40  n=40
gt_cursed_forest_hard    5/8/16       100%   met 3  bought 23  n=50
sp_auto                  9/14/24      100%   met 1  bought 25  n=50
rs_start                 14/18/29     100%   met 7  bought 27  n=50
rs_bless                 22/28/37     100%   met 3  bought 30  n=50
cd_fourth                43/56/56      50%   met 55  bought 56  n=50
gt_cursed_forest_expert  43/55/56      54%   met 55  bought 56  n=50
rs_slot5                 56/56/56      16%   met 56  bought 56  n=50
li_last                  24/30/41     100%   met 3  bought 34  n=50
gt_murder_storm          31/39/56      78%   met 39  bought 39  n=50
gt_spirit_tempest        40/46/56      70%   met 8  bought 46  n=40
gt_static_storm          38/49/56      74%   met 27  bought 49  n=50
co_far                   56/56/56       0%   met 56  bought 56  n=50
br_satchel               22/28/39     100%   met 1  bought 28  n=50
br_almanac               1/2/4        100%   met 1  bought 2  n=50
br_hearthkey             12/14/26     100%   met 1  bought 14  n=50
br_cardfan               16/21/31     100%   met 1  bought 21  n=50
br_wardrobe              35/47/56      70%   met 1  bought 47  n=50
gt_phantom_stampede      56/56/56      20%   met 56  bought 56  n=50
or_halo                  4/5/9        100%   met 1  bought 5  n=40
gt_judgement_wheel       10/13/24     100%   met 6  bought 13  n=50
gt_vesper_tide           56/56/56      20%   met 56  bought 56  n=50
gt_soul_lance            43/56/56      36%   met 56  bought 56  n=50
gt_returning_pages       56/56/56      20%   met 56  bought 56  n=50
gt_thunder_judgment      53/56/56      33%   met 56  bought 56  n=40
gt_storm_tether          56/56/56      20%   met 56  bought 56  n=50
max gap (landmarks only): p25/p50/p90 = 9/11/16, journeys breaking the aim (>5 before run 30, >8 after): 50/50
max gap (+ diamonds (key/mastery bought)): p25/p50/p90 = 9/11/16, journeys breaking the aim (>5 before run 30, >8 after): 50/50
max gap (+ wide (socket/bead/key/mastery)): p25/p50/p90 = 6/8/10, journeys breaking the aim (>5 before run 30, >8 after): 34/50

## start:ghost_wolves  (10 journeys, cap 55 runs)
landmark | p25/p50/p90 run it is AFFORDABLE+UNLOCKED | % reached | condition-met p50 | bought p50 | n(not owned at start)
sp_reroll1               1/1/1        100%   met 1  bought 1  n=10
gt_holy_orbit            2/3/4        100%   met 2  bought 3  n=10
gt_spirit_bolts          13/14/16     100%   met 14  bought 14  n=10
gt_raven_flock           6/8/9        100%   met 7  bought 8  n=10
gt_chain_lightning       29/29/56      90%   met 29  bought 29  n=10
gt_cursed_forest_hard    5/6/44       100%   met 4  bought 15  n=10
sp_auto                  8/9/12       100%   met 1  bought 17  n=10
rs_start                 11/12/14     100%   met 7  bought 17  n=10
rs_bless                 18/19/23     100%   met 2  bought 21  n=10
cd_fourth                34/56/56      50%   met 56  bought 56  n=10
gt_cursed_forest_expert  34/56/56      50%   met 56  bought 56  n=10
rs_slot5                 53/56/56      30%   met 56  bought 56  n=10
li_last                  20/22/46     100%   met 4  bought 24  n=10
gt_murder_storm          32/53/56      60%   met 53  bought 53  n=10
gt_spirit_tempest        33/34/44     100%   met 6  bought 34  n=10
gt_static_storm          31/43/56      80%   met 32  bought 43  n=10
co_far                   56/56/56       0%   met 56  bought 56  n=10
br_satchel               19/20/21     100%   met 1  bought 20  n=10
br_almanac               1/1/1        100%   met 1  bought 1  n=10
br_hearthkey             10/10/12     100%   met 1  bought 10  n=10
br_cardfan               12/14/16     100%   met 1  bought 14  n=10
br_wardrobe              31/36/56      90%   met 1  bought 36  n=10
gt_phantom_stampede      1/1/1        100%   met 1  bought 1  n=10
or_halo                  3/4/6        100%   met 1  bought 4  n=10
gt_judgement_wheel       8/9/10       100%   met 4  bought 9  n=10
gt_vesper_tide           56/56/56       0%   met 56  bought 56  n=10
gt_soul_lance            53/56/56      40%   met 56  bought 56  n=10
gt_returning_pages       56/56/56       0%   met 56  bought 56  n=10
gt_thunder_judgment      46/56/56      50%   met 56  bought 56  n=10
gt_storm_tether          56/56/56      10%   met 56  bought 56  n=10
max gap (landmarks only): p25/p50/p90 = 7/10/24, journeys breaking the aim (>5 before run 30, >8 after): 10/10
max gap (+ diamonds (key/mastery bought)): p25/p50/p90 = 8/11/24, journeys breaking the aim (>5 before run 30, >8 after): 10/10
max gap (+ wide (socket/bead/key/mastery)): p25/p50/p90 = 5/6/9, journeys breaking the aim (>5 before run 30, >8 after): 3/10

## start:raven_flock  (10 journeys, cap 55 runs)
landmark | p25/p50/p90 run it is AFFORDABLE+UNLOCKED | % reached | condition-met p50 | bought p50 | n(not owned at start)
sp_reroll1               1/1/1        100%   met 1  bought 1  n=10
gt_holy_orbit            7/8/11       100%   met 2  bought 8  n=10
gt_spirit_bolts          36/39/42     100%   met 39  bought 39  n=10
gt_raven_flock           owned at start in all journeys
gt_chain_lightning       49/53/56      70%   met 53  bought 53  n=10
gt_cursed_forest_hard    8/8/30       100%   met 4  bought 32  n=10
sp_auto                  16/19/30     100%   met 1  bought 36  n=10
rs_start                 25/27/36     100%   met 7  bought 34  n=10
rs_bless                 36/37/42     100%   met 3  bought 41  n=10
cd_fourth                49/56/56      40%   met 56  bought 56  n=10
gt_cursed_forest_expert  49/56/56      40%   met 56  bought 56  n=10
rs_slot5                 56/56/56      10%   met 56  bought 56  n=10
li_last                  39/41/45     100%   met 4  bought 42  n=10
gt_murder_storm          30/31/33     100%   met 31  bought 31  n=10
gt_spirit_tempest        56/56/56      10%   met 7  bought 56  n=10
gt_static_storm          50/54/56      60%   met 19  bought 54  n=10
co_far                   56/56/56       0%   met 56  bought 56  n=10
br_satchel               37/39/44     100%   met 1  bought 39  n=10
br_almanac               3/3/5        100%   met 1  bought 3  n=10
br_hearthkey             20/23/30     100%   met 1  bought 23  n=10
br_cardfan               26/30/33     100%   met 1  bought 30  n=10
br_wardrobe              50/56/56      50%   met 1  bought 56  n=10
gt_phantom_stampede      56/56/56       0%   met 56  bought 56  n=10
or_halo                  8/9/14       100%   met 1  bought 9  n=10
gt_judgement_wheel       15/18/30     100%   met 12  bought 18  n=10
gt_vesper_tide           56/56/56       0%   met 56  bought 56  n=10
gt_soul_lance            56/56/56       0%   met 56  bought 56  n=10
gt_returning_pages       56/56/56       0%   met 56  bought 56  n=10
gt_thunder_judgment      56/56/56       0%   met 56  bought 56  n=10
gt_storm_tether          56/56/56       0%   met 56  bought 56  n=10
max gap (landmarks only): p25/p50/p90 = 10/13/17, journeys breaking the aim (>5 before run 30, >8 after): 10/10
max gap (+ diamonds (key/mastery bought)): p25/p50/p90 = 10/11/16, journeys breaking the aim (>5 before run 30, >8 after): 10/10
max gap (+ wide (socket/bead/key/mastery)): p25/p50/p90 = 8/8/15, journeys breaking the aim (>5 before run 30, >8 after): 10/10

## start:spirit_bolts  (10 journeys, cap 55 runs)
landmark | p25/p50/p90 run it is AFFORDABLE+UNLOCKED | % reached | condition-met p50 | bought p50 | n(not owned at start)
sp_reroll1               1/1/1        100%   met 1  bought 1  n=10
gt_holy_orbit            4/4/7        100%   met 2  bought 4  n=10
gt_spirit_bolts          owned at start in all journeys
gt_raven_flock           10/12/22     100%   met 9  bought 12  n=10
gt_chain_lightning       32/33/40     100%   met 33  bought 33  n=10
gt_cursed_forest_hard    4/7/22       100%   met 3  bought 25  n=10
sp_auto                  14/17/27     100%   met 1  bought 26  n=10
rs_start                 16/19/33     100%   met 9  bought 27  n=10
rs_bless                 28/30/35     100%   met 3  bought 30  n=10
cd_fourth                39/45/56      60%   met 44  bought 46  n=10
gt_cursed_forest_expert  38/44/56      60%   met 44  bought 45  n=10
rs_slot5                 53/56/56      30%   met 56  bought 56  n=10
li_last                  29/30/39     100%   met 3  bought 34  n=10
gt_murder_storm          32/45/56      70%   met 45  bought 45  n=10
gt_spirit_tempest        owned at start in all journeys
gt_static_storm          35/43/56      90%   met 28  bought 43  n=10
co_far                   56/56/56       0%   met 56  bought 56  n=10
br_satchel               26/29/38     100%   met 1  bought 29  n=10
br_almanac               1/2/2        100%   met 1  bought 2  n=10
br_hearthkey             14/17/31     100%   met 1  bought 17  n=10
br_cardfan               19/22/32     100%   met 1  bought 22  n=10
br_wardrobe              35/37/53     100%   met 1  bought 37  n=10
gt_phantom_stampede      56/56/56       0%   met 56  bought 56  n=10
or_halo                  4/6/8        100%   met 1  bought 6  n=10
gt_judgement_wheel       15/18/28     100%   met 9  bought 18  n=10
gt_vesper_tide           56/56/56       0%   met 56  bought 56  n=10
gt_soul_lance            17/21/29     100%   met 9  bought 21  n=10
gt_returning_pages       13/16/24     100%   met 9  bought 16  n=10
gt_thunder_judgment      46/56/56      50%   met 56  bought 56  n=10
gt_storm_tether          56/56/56      10%   met 56  bought 56  n=10
max gap (landmarks only): p25/p50/p90 = 8/10/14, journeys breaking the aim (>5 before run 30, >8 after): 10/10
max gap (+ diamonds (key/mastery bought)): p25/p50/p90 = 8/9/14, journeys breaking the aim (>5 before run 30, >8 after): 10/10
max gap (+ wide (socket/bead/key/mastery)): p25/p50/p90 = 5/7/11, journeys breaking the aim (>5 before run 30, >8 after): 4/10

## start:chain_lightning  (10 journeys, cap 55 runs)
landmark | p25/p50/p90 run it is AFFORDABLE+UNLOCKED | % reached | condition-met p50 | bought p50 | n(not owned at start)
sp_reroll1               1/1/1        100%   met 1  bought 1  n=10
gt_holy_orbit            2/3/4        100%   met 2  bought 3  n=10
gt_spirit_bolts          19/21/24     100%   met 21  bought 21  n=10
gt_raven_flock           8/9/11       100%   met 8  bought 9  n=10
gt_chain_lightning       owned at start in all journeys
gt_cursed_forest_hard    6/8/16       100%   met 4  bought 18  n=10
sp_auto                  10/13/16     100%   met 1  bought 21  n=10
rs_start                 14/15/21     100%   met 7  bought 21  n=10
rs_bless                 22/22/28     100%   met 3  bought 26  n=10
cd_fourth                43/53/56      60%   met 52  bought 54  n=10
gt_cursed_forest_expert  41/52/56      80%   met 52  bought 53  n=10
rs_slot5                 56/56/56       0%   met 56  bought 56  n=10
li_last                  24/26/31     100%   met 4  bought 28  n=10
gt_murder_storm          43/52/56      80%   met 52  bought 52  n=10
gt_spirit_tempest        42/44/51     100%   met 7  bought 44  n=10
gt_static_storm          30/51/56      60%   met 48  bought 51  n=10
co_far                   56/56/56       0%   met 56  bought 56  n=10
br_satchel               22/24/29     100%   met 1  bought 24  n=10
br_almanac               1/1/2        100%   met 1  bought 1  n=10
br_hearthkey             12/13/20     100%   met 1  bought 13  n=10
br_cardfan               15/17/22     100%   met 1  bought 17  n=10
br_wardrobe              34/36/56      80%   met 1  bought 36  n=10
gt_phantom_stampede      56/56/56       0%   met 56  bought 56  n=10
or_halo                  4/5/6        100%   met 1  bought 5  n=10
gt_judgement_wheel       10/12/18     100%   met 6  bought 12  n=10
gt_vesper_tide           56/56/56       0%   met 56  bought 56  n=10
gt_soul_lance            49/56/56      40%   met 56  bought 56  n=10
gt_returning_pages       56/56/56       0%   met 56  bought 56  n=10
gt_thunder_judgment      owned at start in all journeys
gt_storm_tether          40/43/56      80%   met 41  bought 43  n=10
max gap (landmarks only): p25/p50/p90 = 10/12/19, journeys breaking the aim (>5 before run 30, >8 after): 10/10
max gap (+ diamonds (key/mastery bought)): p25/p50/p90 = 10/11/19, journeys breaking the aim (>5 before run 30, >8 after): 10/10
max gap (+ wide (socket/bead/key/mastery)): p25/p50/p90 = 7/7/9, journeys breaking the aim (>5 before run 30, >8 after): 8/10

## start:holy_orbit  (10 journeys, cap 55 runs)
landmark | p25/p50/p90 run it is AFFORDABLE+UNLOCKED | % reached | condition-met p50 | bought p50 | n(not owned at start)
sp_reroll1               1/1/1        100%   met 1  bought 1  n=10
gt_holy_orbit            owned at start in all journeys
gt_spirit_bolts          23/25/30     100%   met 25  bought 25  n=10
gt_raven_flock           10/12/14     100%   met 11  bought 12  n=10
gt_chain_lightning       40/46/54     100%   met 46  bought 46  n=10
gt_cursed_forest_hard    7/11/13      100%   met 3  bought 27  n=10
sp_auto                  8/11/18      100%   met 1  bought 30  n=10
rs_start                 16/23/28     100%   met 7  bought 29  n=10
rs_bless                 28/34/36     100%   met 5  bought 37  n=10
cd_fourth                48/56/56      40%   met 56  bought 56  n=10
gt_cursed_forest_expert  49/56/56      40%   met 56  bought 56  n=10
rs_slot5                 56/56/56      10%   met 56  bought 56  n=10
li_last                  31/36/40     100%   met 3  bought 38  n=10
gt_murder_storm          31/36/56      80%   met 36  bought 36  n=10
gt_spirit_tempest        45/54/56      70%   met 9  bought 54  n=10
gt_static_storm          41/49/56      80%   met 21  bought 49  n=10
co_far                   56/56/56       0%   met 56  bought 56  n=10
br_satchel               30/36/39     100%   met 1  bought 36  n=10
br_almanac               2/3/7        100%   met 1  bought 3  n=10
br_hearthkey             13/16/27     100%   met 1  bought 16  n=10
br_cardfan               22/23/32     100%   met 1  bought 23  n=10
br_wardrobe              55/56/56      30%   met 1  bought 56  n=10
gt_phantom_stampede      56/56/56       0%   met 56  bought 56  n=10
or_halo                  owned at start in all journeys
gt_judgement_wheel       7/11/24      100%   met 1  bought 11  n=10
gt_vesper_tide           11/16/29     100%   met 8  bought 16  n=10
gt_soul_lance            56/56/56       0%   met 56  bought 56  n=10
gt_returning_pages       56/56/56       0%   met 56  bought 56  n=10
gt_thunder_judgment      54/56/56      30%   met 56  bought 56  n=10
gt_storm_tether          56/56/56       0%   met 56  bought 56  n=10
max gap (landmarks only): p25/p50/p90 = 8/11/15, journeys breaking the aim (>5 before run 30, >8 after): 10/10
max gap (+ diamonds (key/mastery bought)): p25/p50/p90 = 8/11/15, journeys breaking the aim (>5 before run 30, >8 after): 10/10
max gap (+ wide (socket/bead/key/mastery)): p25/p50/p90 = 6/8/13, journeys breaking the aim (>5 before run 30, >8 after): 9/10

## hero:wren  (25 journeys, cap 55 runs)
landmark | p25/p50/p90 run it is AFFORDABLE+UNLOCKED | % reached | condition-met p50 | bought p50 | n(not owned at start)
sp_reroll1               1/1/1        100%   met 1  bought 1  n=25
gt_holy_orbit            3/4/8        100%   met 2  bought 4  n=20
gt_spirit_bolts          16/24/39     100%   met 24  bought 24  n=20
gt_raven_flock           8/9/13       100%   met 9  bought 9  n=20
gt_chain_lightning       33/40/56      85%   met 40  bought 40  n=20
gt_cursed_forest_hard    6/8/19       100%   met 4  bought 23  n=25
sp_auto                  9/12/26      100%   met 1  bought 25  n=25
rs_start                 14/16/27     100%   met 7  bought 27  n=25
rs_bless                 22/29/38     100%   met 3  bought 30  n=25
cd_fourth                48/56/56      48%   met 55  bought 56  n=25
gt_cursed_forest_expert  46/55/56      52%   met 55  bought 56  n=25
rs_slot5                 56/56/56      16%   met 56  bought 56  n=25
li_last                  24/30/44     100%   met 4  bought 35  n=25
gt_murder_storm          31/42/56      84%   met 42  bought 42  n=25
gt_spirit_tempest        43/46/56      70%   met 8  bought 46  n=20
gt_static_storm          38/50/56      76%   met 27  bought 50  n=25
co_far                   56/56/56       0%   met 56  bought 56  n=25
br_satchel               23/28/39     100%   met 1  bought 28  n=25
br_almanac               1/2/4        100%   met 1  bought 2  n=25
br_hearthkey             12/14/26     100%   met 1  bought 14  n=25
br_cardfan               16/21/32     100%   met 1  bought 21  n=25
br_wardrobe              37/44/56      76%   met 1  bought 44  n=25
gt_phantom_stampede      56/56/56      20%   met 56  bought 56  n=25
or_halo                  4/6/10       100%   met 1  bought 6  n=20
gt_judgement_wheel       10/12/24     100%   met 6  bought 12  n=25
gt_vesper_tide           56/56/56      20%   met 56  bought 56  n=25
gt_soul_lance            49/56/56      36%   met 56  bought 56  n=25
gt_returning_pages       56/56/56      20%   met 56  bought 56  n=25
gt_thunder_judgment      55/56/56      30%   met 56  bought 56  n=20
gt_storm_tether          56/56/56      16%   met 56  bought 56  n=25
max gap (landmarks only): p25/p50/p90 = 10/11/16, journeys breaking the aim (>5 before run 30, >8 after): 25/25
max gap (+ diamonds (key/mastery bought)): p25/p50/p90 = 10/11/16, journeys breaking the aim (>5 before run 30, >8 after): 25/25
max gap (+ wide (socket/bead/key/mastery)): p25/p50/p90 = 6/7/11, journeys breaking the aim (>5 before run 30, >8 after): 18/25

## hero:elias  (25 journeys, cap 55 runs)
landmark | p25/p50/p90 run it is AFFORDABLE+UNLOCKED | % reached | condition-met p50 | bought p50 | n(not owned at start)
sp_reroll1               1/1/1        100%   met 1  bought 1  n=25
gt_holy_orbit            3/4/8        100%   met 2  bought 4  n=20
gt_spirit_bolts          18/23/41     100%   met 23  bought 23  n=20
gt_raven_flock           8/9/14       100%   met 9  bought 9  n=20
gt_chain_lightning       31/37/55      95%   met 37  bought 37  n=20
gt_cursed_forest_hard    5/8/13       100%   met 3  bought 23  n=25
sp_auto                  10/14/19     100%   met 1  bought 25  n=25
rs_start                 13/19/32     100%   met 6  bought 26  n=25
rs_bless                 21/28/36     100%   met 3  bought 30  n=25
cd_fourth                43/53/56      52%   met 52  bought 54  n=25
gt_cursed_forest_expert  42/52/56      56%   met 52  bought 53  n=25
rs_slot5                 56/56/56      16%   met 56  bought 56  n=25
li_last                  25/30/41     100%   met 3  bought 32  n=25
gt_murder_storm          31/36/56      72%   met 36  bought 36  n=25
gt_spirit_tempest        40/48/56      70%   met 7  bought 48  n=20
gt_static_storm          38/47/56      72%   met 26  bought 47  n=25
co_far                   56/56/56       0%   met 56  bought 56  n=25
br_satchel               22/28/39     100%   met 1  bought 28  n=25
br_almanac               1/2/4        100%   met 1  bought 2  n=25
br_hearthkey             12/16/26     100%   met 1  bought 16  n=25
br_cardfan               16/20/31     100%   met 1  bought 20  n=25
br_wardrobe              35/47/56      64%   met 1  bought 47  n=25
gt_phantom_stampede      56/56/56      20%   met 56  bought 56  n=25
or_halo                  4/5/9        100%   met 1  bought 5  n=20
gt_judgement_wheel       10/13/24     100%   met 5  bought 13  n=25
gt_vesper_tide           56/56/56      20%   met 56  bought 56  n=25
gt_soul_lance            43/56/56      36%   met 56  bought 56  n=25
gt_returning_pages       56/56/56      20%   met 56  bought 56  n=25
gt_thunder_judgment      53/56/56      35%   met 56  bought 56  n=20
gt_storm_tether          56/56/56      24%   met 56  bought 56  n=25
max gap (landmarks only): p25/p50/p90 = 8/11/16, journeys breaking the aim (>5 before run 30, >8 after): 25/25
max gap (+ diamonds (key/mastery bought)): p25/p50/p90 = 9/10/14, journeys breaking the aim (>5 before run 30, >8 after): 25/25
max gap (+ wide (socket/bead/key/mastery)): p25/p50/p90 = 5/8/9, journeys breaking the aim (>5 before run 30, >8 after): 16/25

## ALL: landmarks ordered by median affordable+unlocked run, gap to the previous
sp_reroll1               p50   1  gap 1
br_almanac               p50   2  gap 1
gt_holy_orbit            p50   4  gap 2
gt_cursed_forest_hard    p50   8  gap 4
gt_raven_flock           p50   9  gap 1
sp_auto                  p50  14  gap 5
br_hearthkey             p50  14  gap 0
rs_start                 p50  18  gap 4
br_cardfan               p50  21  gap 3
gt_spirit_bolts          p50  23  gap 2
rs_bless                 p50  28  gap 5
br_satchel               p50  28  gap 0
li_last                  p50  30  gap 2
gt_murder_storm          p50  39  gap 9
gt_chain_lightning       p50  40  gap 1
gt_spirit_tempest        p50  46  gap 6
br_wardrobe              p50  47  gap 1
gt_static_storm          p50  49  gap 2
gt_cursed_forest_expert  p50  55  gap 6
cd_fourth                p50  56  gap 1
rs_slot5                 p50  56  gap 0
co_far                   p50  56  gap 0

## Gold per run (human factor applied, after the tier bonus), mean / p50 [n]
runs 1-1 win: mean 1728 p50 2371 [10]
runs 1-1 loss: mean 1322 p50 1378 [40]
runs 2-5 win: mean 1721 p50 2166 [52]
runs 2-5 loss: mean 1011 p50 674 [148]
runs 6-15 win: mean 1591 p50 1746 [83]
runs 6-15 loss: mean 810 p50 669 [417]
runs 16-30 win: mean 1701 p50 1860 [58]
runs 16-30 loss: mean 1004 p50 909 [692]
runs 31-70 win: mean 2050 p50 1981 [145]
runs 31-70 loss: mean 1451 p50 1347 [1105]
run 1: 10 wins of 50; gold p25/p50/p90 361/1378/2548; wallet after run 1 >= 150 in 50/50; loss-run 1 gold min 169

## Win rate (human-factored) and tier mix by phase
runs 1-5: win 25% (n=250) tier mix 100/0/0%
runs 6-10: win 23% (n=250) tier mix 100/0/0%
runs 11-20: win 9% (n=500) tier mix 88/12/0%
runs 21-40: win 8% (n=1000) tier mix 56/42/3%
runs 41-70: win 14% (n=750) tier mix 37/45/18%
mean kills per run: wolf 451, crow 531, root_crawler 69
