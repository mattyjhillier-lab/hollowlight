# Night band misses: causes and options (wip/gates-nights, 2026-10-30)

Base = origin/dev. NO data change applied (see verdict). All numbers: `scripts/rt-matrix.mjs`, random bot, 64 seeds per cell, deterministic, 95% CI about +-12 points. Kindred weapon: Wren/Ghost Wolves, Elias/Holy Orbit. Baselines reproduce evo-fix-sweeps.md exactly.

## Already covered by LOCKED?
Partly. LOCKED 'RT5 decisions' (Matt): Deep Dusk stays enemyHp 1.1, full-tree band counts at Bond 0, "met 19-44" accepted. 'RT6-RT8 + overnight decisions': Long Night hero gap (pooled 18%) ACCEPTED. The current misses are lower than those accepted readings: Deep Dusk full Bond 0 kindred 19/17 (RT5 per-weapon Wolves 38, Orbit 19-27) and Wren Long Night Wolves 3% (RT6: 13%). The wolves drop matches EVO FLOW v2 (evolution only at 16 ranks of one weapon) arriving after RT5/RT6.

## Baseline (64 seeds)
| cell | win | evolved | first evo | reach boss |
|---|---|---|---|---|
| Wren Deep Dusk full Bond 0 (band 35-55) | 19% | 28% | 9:23 | 25% |
| Elias Deep Dusk full Bond 0 | 17% | 25% | 9:59 | 31% |
| Wren Long Night full Bond 25 (band 10-20) | 3% | 5% | 8:28 | 17% |
| Elias Long Night full Bond 25 | 19% | 17% | 11:16 | 47% |

## Causes
1. Evolution is late on harder nights: with a full tree the bot spreads ranks over 4-5 weapons, so one weapon rarely reaches 16 ranks (Wren Long Night: 5% evolve; Twilight max: 70-73%). Wolves also win 0% of Long Night runs that do evolve, so timing is not the whole story.
2. Deep Dusk is flat between tree states: mid tree (band 15-30) and full tree (band 35-55) are only about 10-20 points apart at Bond 0 (soft cap), so no tier lever fits both bands (RT5 finding, reproduced below).
3. The Wren / Elias Long Night gap is the ability: ABILITY=off (64 seeds): Elias Long Night 19 -> 9, Wren 3 -> 5; Twilight max Wren 80 -> 81, Elias 83 -> 86. Sanctuary Ring is worth about 10 points at Long Night and nothing at Twilight. So "abilities a modest share" holds at Twilight (0 to 3 pts); at Long Night it is Elias's whole edge.
4. Wren early deaths (focus bot 9%, 7 of 64 at 3:50-4:50): all 7 hold ONE weapon (a fresh profile can only offer the single starter), level 11-17, no evolution yet; killers Branch-Mane (3:20 mini, seed 9) or crow+wolf+root-crawler. The random bot has 3%.

## Options tried (all reverted; data on this branch is unchanged)
| option | change | Deep Dusk full b0 Wren / Elias | Long Night max Wren / Elias | Twilight guards | verdict |
|---|---|---|---|---|---|
| base | none | 19 / 17 | 3 / 19 | fresh 22/25, mid 31/33, max 80/83 | |
| A evo timing -2 | `evoTriggerPerWeapon` 0 -> -2 (trigger 12 with 4 weapons held) | 28 / 25 | 6 / 17 | fresh 22/25 (unchanged), mid 50/42, max 84/97 | Elias max 97 > 90. Reopens LOCKED 'EVO FLOW v2 LOCKED CHOICE' (PerWeapon stays OFF) |
| A' evo timing -1 + Deep Dusk dmg/density 1.05 | as named | 25 / 30 (mid tree 17 / 23) | 5 / 17 | max 81/92 | Elias max 92 > 90; Deep Dusk still under 35 |
| B Deep Dusk eased | enemyDmg 1.15 -> 1.05, density 1.15 -> 1.05 (knob 0) | 23 / 31 (mid tree 16 / 9) | not run | not run | Elias mid 9 falls under 15: the RT5 conflict again |
| C Wren Pelt Dash stronger | secs 0.5 -> 1.2, shove 26 -> 40 | 9 / - | 11 / - | max 70 / - | inconclusive: Long Night +8 but Deep Dusk -10 and Twilight max -10 (all inside the +-12 noise; the dash changes the run's whole path). Not recommended |
| D `evoTriggerRanks` 16 -> 14 (fresh) | | | | fresh Wren 25/25, Elias 25/30 (first evo Wren 3:29, Elias 5:48), Wren focus deaths <5:00 8% (was 9%) | no effect on early deaths; reopens LOCKED 16 |

## Verdict (honest)
- No option brings BOTH Deep Dusk full-tree Bond 0 (35-55) AND Wren Long Night (10-20) into band without breaking another band: the evolution lever overshoots Twilight max for Elias (92-97 vs 90), the tier lever breaks Deep Dusk mid tree (RT5), and the Pelt Dash lever is lost in noise. Nothing was applied.
- What needs Matt (locked-target change), recommended first:
  1. (Rec) Accept as measured again, but record the new numbers: Deep Dusk full Bond 0 kindred 17-19%, Wren Wolves Long Night 3%. Reason: only locked bands or the locked EVO FLOW trigger can move them. Wren's pooled Long Night across all five start weapons was 12.7% in RT6, inside 10-20; Wolves is Wren's weakest start now.
  2. Reopen EVO FLOW v2 `evoTriggerPerWeapon` at -1 (A'), gets Deep Dusk Wren/Elias to 25/30 but Elias Twilight max to 92; needs the Twilight max band to read 65-92 or Elias's Halo trimmed.
  3. Relax the Deep Dusk full-tree band to 25-45 at Bond 0 (the band counted at Bond 0 was Matt's RT5 pick; mid-tree 15-30 and full-tree 35-55 cannot both hold with one tier multiplier).
- Early deaths: no small safe change found (see D). Remaining cause is a one-weapon fresh start that dies before the first evolution on the greedy focus bot; the random bot is at 3%.

## Gates probes (item 1)
Run on an idle 12-core machine. `gates-kits.mjs 32` took 64 min and reads 0-13% for every kit (Wren +Ravens 13%, +Bolts 9%, +Orbit 6%, alone 0%; Elias 0-3%): this is the OLD gates-lib bot (no dodge, Blessings, Bond or map events) and starter grants, not the live game (rt-matrix says 22-25% fresh). The script's question (which second starter) was settled by the RT1 start pick. Marked STALE in the script headers rather than rewritten. `gates-softcap` and `gates-ablate` share that bot: not run (their win rates would be equally unreliable). Replacements measured with the live bot: ability ablation above (modest at Twilight, ~10 pts for Elias at Long Night), tree power inside the soft cap = tests (budget goldens) green, 1253/1253.

Security check: no deps, no src change, data and bot untouched. Fit check: no gameplay change shipped.
