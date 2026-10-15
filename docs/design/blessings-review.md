# Blessings review (independent; reviewer did not write research/24)

Scope: `docs/research/24-late-run-blessings.md` against the real code (`cards.js`, `Sim.js`, `balance.json`, `bot.mjs`) and G1b numbers. Review only; nothing else changed. Evidence is file:line.

**VERDICT: GO WITH CHANGES.** Approach A is the right shape and the smallest blast radius. But the doc mis-states when "dry" begins, ignores that today's tail heals are a hidden power source, and ships 6 first Blessings of which 3 are weak or redundant. Trim to the BLESS-1 slice at the bottom.

## 1. Does A+C fix the dead-pick tail?

Mostly yes, with these real-code facts the doc misses:

| # | Finding | Evidence | Consequence / fix |
|---|---|---|---|
| B1 | "Dry" is NOT "pool empty". `drawNormalCards` fills from `drawWeighted(pool, 3)` then `fillWithFallbacks`; fallbacks appear whenever real cards < 3. With one weapon evolved and the other having <=2 unmaxed stats, you already get 1-2 fallbacks. | `cards.js:179-183`, evolved = final `cards.js:127` | Blessings start BEFORE the 7:50-8:35 first all-filler offer; the doc's "first filler ~8-9 min" is the first FULL-filler offer. Measure "first offer with <3 real cards" (expect ~6-7 min) and redefine the bot metric (B7). |
| B2 | 1 real + 2 Blessings is common and fine, but the "real" card can itself be junk: a stat of a weapon whose pair is locked (nudge weight 1, `cards.js:130-134`) or a stat that finishes nothing. Players then see "1 meaningful + 2 quiet" every level; that is acceptable (still a choice) but Blessings are not "only the tail" in feel. | `cards.js:126-137` | Accept. Do not claim zero effect before min 6. |
| B3 | Gold evolution cards are separate (`offer.gold`, `cards.js:175,187`) so A cannot displace them. Safe. But `pickCard` searches `cards.concat(gold)` by key (`Sim.js:751`): Blessing keys must be unique and never collide with `w:/s:/e:/f:` prefixes. | `Sim.js:751` | Key `b:<id>` only; validate id regex at load; reject duplicates. |
| B4 | Repeat offers: `rerollOffer` calls `drawNormalCards(ctx, rng, n)` with empty `exclude` (`cards.js:191-194`), so a reroll can return the same Blessings. Banish passes `exclude=keep` (`:197-203`). Weighted-without-replacement makes within-offer duplicates impossible; cross-offer repeats are normal for stat cards today. | `cards.js:191-204` | Fine. Add test: Blessing not duplicated within one offer, including after banish. |
| B5 | Banish interaction: banish key `b:<id>` removes a Blessing for the whole run (`Sim.js:742-745`, `banished` filter at `cards.js:138` only filters real pool: the new Blessing pool must apply the same filter). Banishing one Blessing at a rank<max is a real cost with only ~38 rank-picks and 15 ids; with 3 banishes + all-maxed ids it can empty the pool, then fallbacks return. | `cards.js:138` | Required: Blessing pool filtered by `banished` AND max rank. Fallback-after-Blessings is acceptable (doc rule 3). Test it. |
| B6 | The bot's banish rule drops fallback cards (`bot.mjs:64`). Under A there are no fallbacks, so banish goes unused in the tail and the bot's reroll rule (`:65`) only triggers on "no weapon and no ranked stat"; Blessings count as neither, so a hand of 3 Blessings forces a reroll if rerolls exist. | `bot.mjs:64-65` | Update bot so Blessing hands do not reroll/banish by default; otherwise META runs burn rerolls on Blessings. |
| B7 | Metric breaks: the bot's `filler` counts all-fallback offers (`bot.mjs:86`). After A it will read ~0 trivially. | `bot.mjs:81-86` | Add `deadOffers` (offers with 0 real cards) and `blessPicks`; keep `filler` for "offers containing any fallback". |
| B8 | Removing Soul Surge from the tail removes hidden level chaining: it gives `ceil(xpNeeded*0.5)` (`Sim.js:756`), and bot picks it ~1/3 of filler picks, so today's tail has MORE level-ups than the Blessing world. Baseline and post counts are confounded; also total picks drop, so fewer Blessing picks than the doc's "9-19". | `Sim.js:756` | Report picks, not just levels. Expect ~25-40% fewer tail picks; re-estimate Blessing counts. |
| B9 | **Hidden power loss.** The tail's Restoring Light (+35% max HP, `Sim.js:754`) is chosen ~1/3 of ~9-19 filler picks = 3-6 free big heals per run in the climax. A+C removes most of them (heal only under 50% HP, one swap). Win rate in the tail may DROP, not rise, even with +6% damage. | `Sim.js:754`, g1-review 3 | The doc only tests for drift upward. Pre-register: expect Wren/Elias starter win% to fall a few points; G1d retunes anyway. Do not "fix" it by adding sustain Blessings. |
| B10 | C's swap rule: "no heal in the offer and Blessing slot exists, HP<50%". Under A there is never a heal card in the offer, so it is "always swap the last Blessing when HP<50%". That is a guaranteed free heal 35% each level-up while low = near-unbounded sustain in a death spiral, stronger than VS chicken (which is one random roll). Pending chain (`Sim.js:726,766`) can give 3 heals in a row. | `Sim.js:749-767` | Cap C: at most once per 60 s of run time, and only when 0 hearts on screen is not needed; keep it simple: `healSwapCooldown` 45 s, offered only if HP<40%. Or heal 25%. Test chain of 3 pendings. |
| B11 | Level-up pause: offers occur in `state='levelup'` so time is paused; the 50% check reads HP at offer time, fine. | `Sim.js:726` | None. |

Answer to (1): yes it removes dead offers if B3-B6 and B10 are handled; but it is not "zero effect before min 6" and B9 likely lowers win rate.

## 2. Power budget (stacking with real mods)

Mods are plain multipliers set once at construction from the tree (`Sim.js:46-48`), then read at use sites: damage `Sim.js:136`, area `weapons.js:159,286,335`, cooldown `weapons.js:262,291,325`, speed `Sim.js:478`, pickup `Sim.js:578,630`. They multiply with hero traits (`Sim.js:138-141`) and Rush (`:137`). **There is no soft cap in code yet** (grep: no `softCap`; it is a G2 plan), so "goes through the tree soft cap" (research rule 4) is currently vapour.

- Do NOT mutate `sim.mods` (hard to ablate, double-counts on save/debug). Add `sim.bless = {damage,area,speed,pickup,gold,maxHpPct...}` and read `mods.X * bless.X` at the same sites, or a single getter. Caps clamped at the getter (research rule 3 is right to enforce at read time).
- Damage +6% x tree damage x hero trait x Rush is multiplicative; at progression-gates "2 win-rate pts per PE" (progression-gates-v1:10) +6% dmg is ~3 pts alone. Research budget "+/-3 pts total" is tight vs 15 blessings; caps are mathematically bounded but the SUM of the 15 maxed is not +8-10% PE, it is nearer 20 PE-points (my estimate, OPINION): dmg 6 + HP 18 + regen + 24% pickup + speed 6 + CDR 12% + heal drops 50% + DR window. Cut the set, do not rely on the offer-gate to bound it (a lucky run can take 12 rank-picks of one axis? No: only 3 ranks each, so true max is ~38 picks; typical 9-19 means you do take half of them).

Per Blessing (keep / cut / change):

| # | Verdict | Reason |
|---|---|---|
| 1 Wider Glow | keep | Safe, visible. Clamp with tree pickup. Low value late (gems matter less) so low-stakes. |
| 2 Steadier Flame | change | Bounded only if "10 s cooldown, 2 s window" is hard-coded; stacking with iframes 0.4 s (`balance.json:31`) makes it hard to read. Rank 3 = 20% of 2 s per 10 s = 4% damage taken reduction. Boring. Cut from v1. |
| 3 Ember Trail | defer | Rendering + new zone entity + standing-still exploit. Fits identity strongly. Slice M. |
| 4 Pup's Errand | cut | Fetches gems; XP late is only more Blessings (the doc admits this). Gold gain trivial. CPU + sprite for no verb you feel. Off-fit: Wren-only flavour but Elias offered it too. |
| 5 Last Ember | defer, ship alone | Conflicts with existing `tfx.revive` / `reviveLeft` (`Sim.js:61,248`) and tree `autoHp`: THREE low-HP rescue verbs stacking. Biggest swing. Fits (lantern reserve). Needs ablation first; one-time heal 30% over 3 s is weaker than a revive so it is acceptable. |
| 6 Dawnlit Soles | keep (1 rank cap +3%) | Speed is the strongest kite stat; 2 ranks +6% stacking with Wren trait + tree speed is too much for a Hollow with `spawnDistance 340`. Make 1-2 ranks at +2%. |
| 7 Hearthwarm | cut | `drops.heart 0.008` with pity timers (`balance.json:34-41`); +25% prob on top of pity = near no effect, wasted pick. |
| 8 Kind Fortune | keep but rename | Replaces Grave Coins, same job, no combat power. Feeds the gold economy: re-run `gates-pace`. |
| 9 Bloom Ring | defer | Good verb, fits "colour returns", new sim entity. Not v1. |
| 10 Dusk Compass | cut | A pick that does nothing in a 3-card offer reproduces the dead-pick feeling the whole design exists to fix. Honest answer to Q3. |
| 11 Warm Hands | change | `abilityCooldown` clamps to floor 30 (`Sim.js:129-133`); a tree already at floor makes this a dead pick; hide when at floor. Heroes' later Candle Wheel / Rally the Pack are allowed +5 win pts each, so CDR here compounds ability power. Defer until abilities land. |
| 12 Wrapped Warmth | keep | Readable, +6% HP per rank (Wren 60 hp = +3.6/rank). Cap +18% is plenty; cut cap to +12%. |
| 13 Kindled Spirits | keep | Fits summoner fantasy. +2% x 3 is below noise: the player cannot feel it. Make +3% x 2. |
| 14 Lingering Light | defer | Area clamps wolf/orbit unpredictably (`weapons.js:159,335`). Test per weapon. |
| 15 Quiet Hours | cut | Doc admits it can silently dominate; regen already a tree verb (`tfx.regen`, `Sim.js:490`). |

Redundancy: 8, 12, 13, 1, 6 are 1-2% tree-style stat clones. That is exactly the "stat sink" the progression principle says power should NOT come from. Count how many of the kept set are stat clones vs verbs: only 5 (Last Ember) and 9 (Bloom Ring) are verbs. A "reward" pick of +3% damage is still a boring pick. Recommend v1 mix: 2 stat-ish (Wrapped Warmth, Kindled Spirits), Kind Fortune, Wider Glow, plus ONE verb.

## 3. Interaction risks

- **Gates/starter kit:** safe: kit "all" had filler 0% (progression-gates-v1:241-244), so Blessings appear only for starter-kit players. But a human who later unlocks Ravens sees them fewer times, so the sink fades by design. Consistent. Note `evoOpen` hidden recipes (`cards.js:40`): Blessing card text must never name stats/pairs.
- **Tree:** Blessings must not become a second tree. No Blessing node in the tree (agree with doc 7). Once tree mods hit the planned soft cap, Blessing multipliers must be inside the cap, not beside it; until G2 exists that cap does not, so the Blessing getter clamps itself.
- **Abilities later:** Warm Hands and Last Ember overlap with Candle Wheel/Rally and `autoHp`; defer both.
- **Order:** Blessings -> G1d (hpScale) is correct and necessary: B9 shows the tail win rate will move. Also re-tune after abilities land. Do NOT tune G1d against a no-Blessing build.
- **Bot validity:** the bot picks by weights (`bot.mjs:69`): stat = rank-based, weapon 2-3, any other kind 0.3. Blessings get weight 0.3 each: uniform random among them, and the bot always prefers a real card. A human will pick by perceived value (heal/defence first). So the bot measures a random-Blessing player, not an optimiser. Add a `BLESSPICK=random|defence|offence` policy; report the spread as the uncertainty, not one number.

## 4. Test plan realism

- Research sample sizes are right (n=48: +/-12; 250: +/-5; ~1,600 per cell for 3 pts). Per-Blessing win% is undetectable: use continuous metrics. Add: paired-seed deltas (same seed streams diverge once the offers differ, so pairing helps little after the first Blessing pick; the RNG consumption order changes: `rng.shuffle` in `fillWithFallbacks` `cards.js:161` is no longer called, shifting every later draw). Say so; pairing is only valid for the first 6 min.
- Measure instead: (a) dead offers = 0; (b) real-card offers unchanged before first short offer (A/B identical event log up to that point: strong determinism test, valid); (c) HP lost, time-to-death in losing runs, boss TTK, damage share of Blessing sources (needs a counter); (d) heal-swap frequency; (e) picks per run.
- Acceptance: filler share is a bad pass criterion ("<5% fallback") since fallback count is now ~0 by construction. Use dead offers, total heal received in tail, and win% with CI.

## 5. Security / robustness

- No save fields needed: keep Blessings run-only; no `schema.js` change, no version bump (agree). Do not add them to `result()` (`Sim.js:798-813`) unless the results screen shows them, and then through `cleanMap`-style capping.
- `?bless=` debug param: validate against loaded data (`Object.hasOwn`), ranks clamped 1..3, and add to `isDebugRun` so it disables banking (as `grant`).
- `blessings.json` load validation: id regex, unique ids, rank 1-3, numeric bounds, weights >0 finite; unknown ids ignored (fail closed). Reject `__proto__`/`constructor` ids (Object.create(null) or Map).
- UI: Blessing text goes through the existing card template, which uses `innerHTML` with bundled data (`ui.js` per g1-review:29). Bundled-only is fine; never route `?bless=` strings into it. Use `textContent` for the new "held" glyph row.
- Tests: `blessing ids validate`, `forged __proto__ id ignored`, `debug bless disables banking`, `clamps hold with absurd tree mods`, `no NaN when maxHp changes mid-run` (Wrapped Warmth healing + `Sim.js:66-69` rescales HP only at construction).

## 6. Simpler alternatives; what to cut from slice S

- **Alt 1 (cheapest):** keep the 3 fallbacks but rebalance them as real rewards (heal 35% only if below 60%, else +gold; remove Soul Surge's chain; show them as one "Rest" row). Fixes the XP chain and "broken screen" at ~10 lines; but still dead picks. Not enough alone.
- **Alt 2:** convert dead offers to "Dusk Gold" that banks gold for meta (no power creep, ties to the economy), plus the single conditional heal. Zero balance risk; only meh feel. Valid fallback if Blessing tests fail.
- **Alt 3:** Ravens as third starter (option D) reverses a locked gate; still reject.
- Cut from S: Steadier Flame, Dawnlit Soles (or 1 rank), Hearthwarm, Quiet Hours, Pup, Compass, rank 3 tiers where the effect is below perception. Cut the held-glyph row from BLESS-1 (reuses empty slot box, but UI work).

## 7. Open questions

1. **A+C, not B.** Agree with A. Level-1 Blessings dilute weapon cards (20MTD dev comment, research 24:28) and move the tuned first 6 min. But C needs the cap in B10, else it is a stronger heal than today.
2. **Last Ember: acceptable in principle, not in v1.** It stacks with `revive` and `autoHp`; ship only after a solo ablation and only if `reviveLeft===0`-style exclusivity (grant none when the tree has revive).
3. **Dusk Compass: cut.** A zero-stat pick in a 3-card pool is a dead pick by another name; the doc's own goal is no dead picks. Keep QoL out of the card pool.

## BLESS-1 (trimmed first slice, no art)

Data `src/data/blessings.json`, 5 Blessings: Wider Glow (pickup +8%, 2 ranks), Wrapped Warmth (maxHp +6%, 2 ranks, heals the gained amount), Kindled Spirits (damage +3%, 2 ranks), Kind Fortune (gold +8%, 2 ranks), Dawnlit Soles (speed +2%, 1 rank). Plus the capped heal swap (cooldown 45 s, HP<40%). `sim.bless` read-time clamped getter; `cards.js` `blessingPool(ctx)` with banished/max filter; offers fill real -> Blessings -> fallbacks; text card via existing layout with badge "BLESSING". Bot: `BLESS=on|off`, `BLESSPICK`, `deadOffers`, `blessPicks`, rewrite reroll/banish rules.

Named tests: `blessings data validates and rejects bad ids`; `offer fills real first then blessings then fallbacks`; `no blessing while 3 real cards exist`; `no duplicate blessing within one offer`; `banished blessing never reappears`; `maxed blessings leave the pool`; `fallbacks only when all blessings maxed`; `evolution gold card unaffected`; `heal swap needs hp<40pct and respects cooldown (3 pending chain)`; `bless caps hold with extreme tree mods`; `forged bless id ignored / debug bless disables banking`; `blessing pick changes stats once and sets rank`; `seed identical to pre-blessing build until first short offer`.
Validation: 250-seed unpaired x 4 cells report dead offers (0), win% with CI (expect a small drop, B9), tail heal total, picks per run; run `gates-pace` for Kind Fortune. Do NOT start G1d until this reports.

## Checklists

Security: no new deps; no save/schema change; data validated at load, fail closed; debug param validated + non-banking; bundled-text only in `innerHTML`; `textContent` elsewhere; unique `b:` keys; tests above.
Fit: each pick is a lantern/warmth/spirit reward in the quiet card style (never gold); no recipe leak; no stat clones beyond 3; verbs (Last Ember, Bloom Ring) held for M; reject Compass/Pup/Quiet Hours as dead or off-fit.

Right now: BLESS-1 only after Matt's yes. Next: result review, then G1d. Parked: Last Ember, Bloom Ring, Ember Trail.
