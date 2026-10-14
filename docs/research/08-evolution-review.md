# 08 Evolution review

Method: `node scripts/evo-dps.mjs`. God-mode Sim, no waves, one weapon with all four stats at rank 5, 30 s, averaged over 3 placements. Compare maxed base vs evolved on three dummies sets: `single` (one static target 30 px out), `stream10` and `stream40` (10 or 40 indestructible walkers marching at the player, recycled to a 170 px ring on contact). Damage includes bleed, zones and explosions. Orbit weapons read 0 on `single` because the target never touches the ring; ignore that column for them.

Caveats: raw DPS only (no overkill, so one-shot spikes such as Soul Lance look better than they play vs low HP enemies, and worse vs late HP); fear/pins are crowd control that DPS does not capture; evolutions read the same maxed stats the unlock required (the pair), so multiples are "evolved vs maxed base", the fair comparison. All tuning values now live in `evolutions.json` under `tune` (code keeps the same numbers as fallbacks).

Target 1.8-2.3x, hard cap 3x. Multiples shown as single / stream10 / stream40. "Before" is the state at the start of this task.

| Evolution | Before | After | Behaviour change? | Notes / change |
|---|---|---|---|---|
| Pouncing Pack (phantom_stampede) | 1.10 / 1.27 / 1.00 | 1.10 / 1.52 / 1.12 | Yes: leap, pin (non-boss held 1 s), maul | Leap hit 1.3->1.8x, leap cooldown 3.2->1.8 s, maul 0.3->0.45. Still the weakest on raw DPS; the pin (enemy stops attacking) is the value, and Matt reported the old version as too strong, so I stopped at ~1.5x. In contact the wolves never leap (needs >12 px gap), so single-target is flat. Recommendation: keep. |
| Howling Legion | 1.48 / 1.34 / 1.45 | 1.94 / 1.80 / 1.84 | Weak: bigger pack (x1.4+1), longer bleed, periodic move-speed howl | Added x1.25 bite damage. In range. Behaviour change is mostly a number change plus the speed howl; flagged as the least "new verb" evolution. |
| Dire Alpha | 0.51 / 0.91 / 1.52 | 0.66 / 1.17 / 2.01 | Yes: one giant wolf, cleaving bites, heavy bleed | Bite dmg x2.6->x3.2, bite gap 0.6->0.45 s, cleave radius 22->24. Single-target stays below base (0.66x) because 7 wolves focus a boss better than one; it is a horde cleaver by design. If Matt wants it to be a boss killer, raise `dmg`. |
| Murder Storm | 0.50 / 0.50 / 0.50 (3.4x when enemies don't flee) | 0.00 / 1.88 / 1.90 | Yes: 2 counter-rotating rings, doubled flock, fear | Fear on touch 1.2->0.3 s (`fear` tune). At 1.2 s the enemies fled out of the rings and DPS fell below base; at 0.3 s they are shoved back, keep taking hits, and it keeps the crowd-control feel. |
| Dive Bombers | 0.05 (bug) | 0.00 / 2.75 / 1.38 (single 247 DPS vs base 0) | Yes: ravens dive at the toughest enemy, splash | **Bug fix**: returning ravens flew at 240 px/s but their orbit slot moves at radius x spin = ~315 px/s at max ranks, so they never rejoined the flock after one dive (the evolution was effectively dead). Return speed is now max(240, range x spin x 1.4). Now in range; this makes it noticeably stronger than players have seen. |
| Spirit Tempest | 1.62 / 1.97 / 2.41 | unchanged | Yes: 8 homing bolts, ring pattern, explode on last hit | Upper edge of range at high density, under the 3x cap. `dmg` tune exists if it needs a nerf (0.9 gives ~2.2x at stream40). |
| Soul Lance | 1.02 / 0.44 / 0.51 | 2.00 / 0.91 / 1.28 | Yes: single huge unhoming piercing bolt | Dmg x5->x8, radius 8->12, cooldown 1.4->1.1 s. Raw DPS vs the best base weapon in the game (Spirit Bolts maxed is the strongest base at 1032 vs 439-815 for the others) can't reach 2x in a horde without a big nerf to the base; it shines on lines of enemies and single targets. Recommendation: consider trimming Spirit Bolts base (power perRank 5->4), Matt's decision. |
| Thunder Judgment | 1.59 / 2.18 / 5.61 | 1.26 / 1.59 / 2.51 | Yes: periodic smite on everyone in 260 px, 9 chains | Was a 5.6x outlier. Chains 14->9, smite every 2.4->3.0 s, cap 45->30 enemies, smite dmg 1.6->0.9x. Now under 3x at saturation. |
| Static Storm | 3.60 / 1.38 / 1.21 | 2.57 / 2.12 / 1.73 | Yes: replaces the chain with a constant random-strike field | Strikes per tick 2->4, per-strike dmg 0.7->0.5x. Flatter across densities (it was a single-target outlier at 3.6x and weak in swarms). |
| Sanctum Halo | 16.5 (static orb ring) / 2.12 / 2.09 | 0.00 / 2.12 / 2.06 | Yes: doubled orbs, wide ring, holy ground zones that heal | No change; best-behaved evolution. |
| Judgement Wheel | 2.90 / 1.30 / 1.10 | 0.00 / 2.00 / 1.58 | Yes: fast orbs that explode on contact then re-form | Explosion dmg 1.3->1.8x, re-form 1.2->1.0 s. |

Base weapon changes made for pacing (not evolutions): Ghost Wolves start with 2 wolves and 7 bite power (was 1 and 6), Holy Orbit base power 10 / radius 38 / spin 2.2 and +4 power per rank (was 8 / 34 / 2.0 / +3.5). Because these raise the base, the evolution multiples above already include them.

In-game evidence (96-seed sweep): focused bots evolve at a median 5:06-5:34 and take 1-2 evolutions; no sign of runaway wins from evolutions (focus win 41-46%).

## Open recommendations
1. Spirit Bolts maxed is ~2x the base DPS of every other weapon in a horde; trimming it would let Soul Lance read as a proper upgrade. Not done (changes a base weapon).
2. Howling Legion and Pouncing Pack are the least distinct. If more variety is wanted later, they are the ones to give a new verb.
3. Hearts/pity: evolutions that heal (Sanctum Halo) were left as is.
