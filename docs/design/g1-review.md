# G1 review: progression-gate plumbing (independent review)

Reviewer did not write `progression-gates-v1.md`. Scope: the G1 chunk (section 6) against the real code. Respects Matt's approved decisions (starter pool Wolves + Orbit, 3 weapons + 9 evolutions gated, hidden recipes, hpScale raise, Wren + Elias only, abilities as later chunks). Evidence is `file:line`. One new measurement (scratch script, nothing in the repo changed) is in section 3.

**Verdict: GO WITH CHANGES.** The core plumbing idea is right and small. But the plan as written misses several real interactions: about 8 existing tests break, a leak in `statCard`, respec re-locks content, bot presets change meaning, and about a third of late-run level-ups become dead fallback cards. Fix these in the plan before building. G1 should change no balance and no save version (details below).

## 1. Correctness against the real code

| # | Finding | Evidence | Fix |
|---|---|---|---|
| C1 | The weapon gate already works as designed: `buildPool` skips `treeGate` weapons unless `ctx.unlockedWeapons` has them. It fails closed when the set is missing. | `cards.js:115`, `Sim.js:63,124`, `tree.js:403` | None. Use the same fail-closed rule for evolutions. |
| C2 | The plan's 3 evolution touch-points are right (`availableEvolutions`, `goldCards`, pair nudge in `buildPool`), but there is a **4th: `statCard` `evoHints`**. It counts locked evolutions too. It is unused by the UI today, but it is a recipe leak waiting to happen. | `cards.js:67-69`, `cards.js:123`, `cards.js:38-47` | Add one helper `evoOpen(evo, id, ctx)` and use it at all four sites. Also filter `evoHints`. |
| C3 | `availableEvolutions(w, data)` has 2 args. Tests call it directly. | `cards.test.mjs:84,86,98,109` | Change the signature to `(w, data, unlocked)`. A missing `unlocked` means only ungated evolutions are available (fail closed, same as C1). Update the tests to pass a set. |
| C4 | **Tests that break once real data is gated** (the plan only says "keep the full data copy"): `cards.test` 'open slots' (expects all 4 other weapons, :29-36); 'evolution gold card' and 'several evolutions' and 'taking an evolution' (phantom_stampede/dire_alpha, :80-112); 'first evolution after 18-30 level-ups' (pair taken from the first wolves evolution = gated, so the loop never breaks, :167-191); `sim.test` 'picking the evolution gold card' (:137-147, phantom_stampede); `tree.test` 'nothing shipped is gated' (:509-511, must be inverted). | listed | Add `ungated(data)` and `allOpen(ctx)` helpers to `tests/helpers.mjs`. Rewrite these tests deliberately (do not just loosen them). Add the new gating tests (section 6). |
| C5 | The plan says gate nodes `requires` "the weapon's first node". For Ravens that is `rv_talon` (+6% raven damage), so you would pay for raven damage before ravens exist. Reversed. | `tree.json:57`, design 2.3 | Gate nodes `requires: []` (attached to the hub at the ring/angle of their branch) or only other gate nodes. See C6 for why. |
| C6 | **Respec re-locks content.** `respec` refunds every node and clears `save.tree`. Gate nodes are plain nodes, so a free respec silently removes Ravens/Bolts/Chain until they are bought again. Also, if gate nodes kept `requires` on stat nodes, keeping them would break `sanitizeTree` (it drops nodes whose parents are missing). | `tree.js:330-336`, `tree.js:348` | Make unlock-kind nodes (`weapon`/`evolution`/`hero`) permanent. `respec` keeps them and refunds only the others. Gate nodes need no stat-node parents. One test. |
| C7 | Existing raven/bolt/chain stat nodes (`rv_*`, `bo_*`, `cl_*`, and tag nodes that mention bolts/lightning) stay buyable while their weapon is locked. That is wasted gold and confusing. | `tree.json:57-59,63,69-71,76-78` | G1: data-only desc suffix, e.g. "(needs Raven Flock)". Do NOT re-parent them in G1, because that would make `sanitizeTree` drop owned nodes with no refund. The re-parenting and its refund migration go into G2 (see S1). |
| C8 | Debug params. `?grant=` bypasses gates (fine: `isDebugRun` stops banking, `app.js:186-189`). But the `evo` part is unvalidated: an unknown id sets `w.evo` and then crashes the HUD/results (`ui.js:127,272` read `.name` of undefined). `?meta=full/half` uses `presetTree`, which ignores conditions, so the preset now also buys gate nodes. | `app.js:102-110`, `Sim.js:815-827`, `tree.js:425-446` | `applyGrants`: accept `evo` only if `own(data.evolutions, evo)` and `evo.weapon === id`. Document that `meta=` previews include gates. |
| C9 | **Bot and probe meaning changes.** `bot.mjs` with `META=none` passes `tree:null`, so after G1 it plays the starter pool only. `META=half` buys cheapest-first, so all 12 cheap gate nodes (100-600 gold) get bought first and "half" now also means "all gates open". The probe scripts (`probe-*`, `evo-dps`, `sweep*`) silently measure something different. | `bot.mjs:15-17,62`, `tree.js:432-443` | Add `GATES=starter\|all` to `bot.mjs` (default `starter`, printed in the header). `all` = push every gated id into `tree.unlocks`. `presetTree` skips unlock-kind nodes unless asked. Note this in each probe's usage line. |
| C10 | Existing v2 saves are fine **if G1 only adds nodes**. `sanitizeTree` keeps known ids, and the unlocks come only from compiled tree nodes, never from `save.unlocks` (`tree.js:381-407`). A player like Matt, who already meets many conditions, does not get "Newly unlocked", because `bankRun` diffs before/after. The tree screen's `new` pulse covers this. | `store.js:89,119-120`, `treescreen.js:256` | No v3 save in G1. Plan ONE v3 migration in G2 (tree rewrite plus refund-all respec; see S1). |
| C11 | `closestUnlocks` masks hidden names until `frac >= 0.5`, while `describeNode` reveals them at `frac > 0`. Two different rules, and the approved rule is "reveal on progress". | `tree.js:468` vs `tree.js:478` | Use `frac > 0` in both. Add a test. |
| C12 | The design's "Not built yet" flow uses only existing condition types. Checked: `killEnemy`, `evolveWeapon{id\|any,n}`, `bossKill n`, `clearChapter n` all exist with `n` (`tree.js:18-29,52,58-73`). | | OK. |
| C13 | `stats.evolved`/`killsByEnemy` are capped at 64 keys by `countMap`. That is fine now. Later, with more than 64 enemy types, truncation could undo met conditions, and `sanitizeTree` would then drop owned gate nodes. | `schema.js:55-67,116-119` | Note for chapter 2+. Not G1. |

## 2. Security and robustness (single-player: what actually matters)

- **What matters:** no crash or DoS from a crafted save, URL or import; no DOM injection; no way for corrupt data to wipe progress. Unlocking content by editing localStorage does not matter: anyone can already set `gold` to 1e12. Do not build anti-cheat.
- **Good as designed:** evolution unlocks come from compiled node effects (`checkEffect` validates the id against `data.evolutions`), not from save data. `sanitizeTree` drops unknown ids, unmet conditions and broken parents (`tree.js:340-354`). Conditions are monotonic (stats only grow), so a bought gate never drops on reload.
- **Must hold:** (1) Never read `save.unlocks` (a free-form `cleanMap`, `schema.js:84-98,130`) for gating. Gates come only from the tree. (2) `unlockedEvolutions` is a `Set` of ids from `def`, so there is no object-key path and no pollution risk. Keep `Object.hasOwn` checks. (3) New UI text (results line, tree labels) uses `textContent`. The level-up and HUD templates use `innerHTML` with bundled data (`ui.js:213-218,128`). That is acceptable only because the data is bundled. Do not route node or save strings into them. (4) Validate grant `evo` (C8). (5) `compileTree` must reject: `unlock:'evolution'` with an unknown id; an unlock node with `maxRank > 1`; a `treeGate` weapon or evolution with no unlocking node (unreachable content); an unlock node for an ungated item (dead node).
- **Tests:** forged save owning a gate node with unmet conditions is dropped; forged `__proto__`/`constructor` keys in `tree` and `stats.evolved` are ignored; `save.unlocks.raven_flock=true` unlocks nothing; bad `grant` evo does not crash.

## 3. Gameplay and balance risks

**Starter for each hero:** Wren starts with Ghost Wolves, and Holy Orbit is the only weapon card in her pool. Elias is the mirror. Each weapon has exactly one enabled evolution (Howling Legion = count+duration; Sanctum Halo = count+radius). Slots 3-4 stay "empty slot" all run (`ui.js:124`).

**New measurement: the dead-card tail.** Scratch script, starter pool, random bot, 10 seeds per hero, unmodified Sim + `gatesLib.gatedData`. Once both weapons evolve, evolved weapons are final (`cards.js:120`), so the pool is empty and every offer is three fallback cards (`cards.js:153-160`).

| | Runs reaching both evolutions | Fallback-only level-ups in those runs | Starts at |
|---|---|---|---|
| Wren | 9/10 | 10-19 of 38-51 (about 30-40%) | 6:14-11:16 |
| Elias | 6/10 | 7-17 of 32-49 | 6:32-10:20 |

This is the biggest feel risk of G1: the climax minutes of a good first run are "heal / +25 gold / XP" picks. It was not visible in the design's tables (level 38-46 looked fine). Options for Matt (recommend the first one; the others change locked lines):
1. **Recommended, small, in G1c:** when every card is a fallback, show a compact "Blessing" pick (same 3 effects, one row, auto-focus), so it reads as a reward, not a broken screen. Add `fallbackShare` to the bot output and track it.
2. Put Ravens in the starter pool as a third weapon. It is weak as a second weapon (2% for Elias) but fine as a third. This reverses an approved gate, so it is Matt's call.
3. Let the hidden 2nd evolution of each starter weapon be the first gate (it already is, gates 1-2), so run 2 has more to chase. This is already the case; no change.

**Early pool size is fine:** level 2 = 1 weapon card (weight 4) + 4 stat cards, never short of 3 cards until the tail above. With nudges filtered, locked-pair stats weigh 1 and open-pair stats weigh 4 (`balance.json:26-30`). Maxing a locked pair is wasted, but the player can still finish the open pair.

**Run 1 completeness:** 2 weapons + 1 evolution each is a clean lesson. But a human who dies before about 4:00 sees no evolution and opens no gate in run 1. Gate 1/2 text should make the next goal obvious ("Evolve Ghost Wolves once").

**Hero asymmetry:** starter no-tree focus is Wren 19% vs Elias 44% (design 4.1). A global hpScale raise aimed at 15-20% random could push Wren-focus to about 5-10%, and Wren is Matt's favourite. Tune and report per hero. If the gap stays above 15 points, fix it per hero (data), not globally.

**hpScale timing:** keep it OUT of G1 (no balance change, so a clean A/B). Do it as its own data-only chunk after G1. Re-check it after Rally the Pack / Candle Wheel land, because the ability chunks are allowed to move win rate by up to 5 points (`heroes-and-abilities.md:9,16`). The old tree still gives 96-100% until G2, so the 15-20% target only means something for no-tree players until then.

**Sample size:** at p≈0.2, n=48 gives a 95% CI of about ±11 points (the design's "±7" is about 1 SD). To hit a 5-point band (15-20%) you need about **250 runs per cell** (±5). Plan: paired seeds 1-250, per hero × {random, focus}; sweep about 5 hpScale.linear values at 96 seeds to fit the curve, then confirm the chosen value at 250.

**Pacing note (not blocking):** 5 of 12 gates use large kill counts (4500-12000). Research 22 says to avoid grind-only gates on the main path (`22-...md:206,223,270`); here they are mixed with "play differently" parts. That is acceptable for v1, but tune with human data.

## 4. UX gaps in G1 scope

| Item | Plan | Gap / recommendation |
|---|---|---|
| Gate visibility | `hidden:true` on every gate | Research 22 (:223,270) says main-path gates should state their text. The three **weapon** gates should be visible (the weapons are known; "I want Ravens" is the pull). Keep **evolution** gates hidden until progress (Matt's rule). |
| Evolution node text | reveal "Name (Weapon)" on progress | Data test: an evolution gate's name/desc/flavour must not contain either pair stat's display name (e.g. "Bite power") or key. |
| Results line | "NEW: Spirit Bolts can now appear in your level-ups. Buy it in the Skill Tree." | Contradictory: it cannot appear until bought. Use: "Spirit Bolts can now be unlocked in the Skill Tree (300 gold)." textContent. Reuse the existing "Newly unlocked" block (`ui.js:311-314`). |
| Toast "Unlocked in the Skill Tree" on first card | needs per-save "first time seen" state | A save field means a schema change; per-run it would fire every run. **Defer.** The `NEW` badge is already on every weapon card (`cards.js:57`). |
| HUD empty slots | 2 permanent "empty slot" boxes in run 1 | Copy change to "Locked: Skill Tree" when no gated weapon is unlocked. Tiny, G1c. |
| Respec confirm | n/a | After C6, the text says unlocks are kept. |
| Explicitly deferred | | Recipe pair reveal after first evolve (codex), soft cap/validator, value rescale, ability upgrade nodes, hpScale, condition additions to `sp_cd*` etc. (design 2.4; those also drop owned nodes and belong with the G2 migration). |

## 5. Simplifications and better options

- **S1, the smallest safe slice:** G1 = add-only (12 new nodes plus flags plus code). Touch no existing node's `requires`, `unlock` or cost, so there is no save migration. G2 already rewrites every node value and cost, so it should own the single **v3 migration: refund-all respec plus a one-time notice**. Compute the refund from the raw tree at current costs, clamped; this is safe because gold is self-editable anyway. Fail closed to `{}` if the tree def is not registered.
- **S2, code before data:** land the plumbing with no shipped data gated (as the current weapon-gate test does, `tree.test.mjs:509-527`). Tests stay green and nothing changes. Then flip the data in a separate commit. That makes rollback a one-file revert, so **no runtime feature flag is needed** (rejected: it adds a second code path to test).
- **S3, equivalence check:** after G1b, `bot.mjs` (GATES=starter, real data) must match `gates-sim` row A within noise on the same seeds. Same mechanism, so a mismatch means a plumbing bug.
- **Disagree with the design on:** gate `requires` (C5); gates being refundable (C6); hiding weapon gates (section 4); the results copy; leaving `hpScale` for G2 is correct but should be its own chunk, not mixed into the value rescale.

## 6. Build checklist (one sitting each)

**G1a: plumbing, zero behaviour change.** `tree.js`: `'evolution'` in `UNLOCK_IDS`; `checkEffect` validates the id; `emptyEffects().unlocks.evolutions`; `aggregateMods` pushes it; compile checks from section 2 (5). `Sim.js`: `unlockedEvolutions` Set plus `cardCtx`. `cards.js`: `evoOpen` at the 4 sites (C2/C3). `respec` keeps unlock-kind nodes (C6). `applyGrants` evo validation (C8). `closestUnlocks` rule (C11). Tests T1-T10 below. `npm test` green, bot output unchanged.
**G1b: data flip.** `treeGate:true` on 3 weapons and 9 evolutions; 12 gate nodes (`requires: []`, `maxRank 1`, gold 100-600, evolution gates `hidden`, weapon gates visible, conditions from `gates-lib.mjs:23-36`); desc suffix on `rv_*/bo_*/cl_*` (C7); rewrite the broken tests (C4); `bot.mjs GATES=`, `presetTree` skip (C9). Tests T11-T16. Validation V1-V2.
**G1c: UX.** Results unlock line (copy above), HUD locked-slot copy, all-fallback "Blessing" layout plus `fallbackShare` in the bot (if Matt approves option 1). textContent only. Screenshot check at 640x360 and phone width.
**G1d (separate, after G1, Matt's go):** `hpScale` tune to 15-20% random no-tree per hero (V3). Re-check after the ability chunks.

**Named tests:** T1 `evolution unlock compiles and aggregates`; T2 `compileTree rejects unknown evolution id`; T3 `rejects unlock node with maxRank>1`; T4 `rejects gated item with no unlocking node`; T5 `locked evolution: no gold card even with pair maxed`; T6 `locked evolution: no pair nudge, evoHints excludes it`; T7 `unlocked evolution: gold card returns`; T8 `availableEvolutions without a set is fail-closed`; T9 `respec keeps unlock nodes and refunds the rest`; T10 `bad grant evo is ignored (no crash)`; T11 `starter pool: Wren sees only holy_orbit as a weapon card, Elias only ghost_wolves`; T12 `starter evolutions are exactly howling_legion + sanctum_halo`; T13 `every gated weapon/evolution has exactly one gate node`; T14 `evolution gate text never names its pair stats`; T15 `sanitizer drops a forged gate node with an unmet condition; save.unlocks is ignored for gating`; T16 `v2 save with owned nodes loads unchanged after G1`.

**Validation:** V1 `GATES=starter node scripts/bot.mjs wren|elias 48` vs `gates-sim.mjs 48` row A: same seeds, win% within ±10, first-evolution median within ±20 s. V2: report `fallbackShare` and first all-fallback time (seeds 1-48, both heroes, random/focus). V3 (G1d): hpScale sweep at 96 seeds, confirm at 250 seeds per hero × bot; pass = random 13-22% per hero, focus reported, Wren-Elias gap noted.

**Security checklist:** no new dependencies (`npm audit` unchanged); no save version change in G1; unlocks only from compiled tree; compile-time checks section 2 (5); T15/T16; grant validation; textContent for all new strings; no `save.unlocks` reads.
**Fit checklist:** gated items are existing Hollowlight weapons/evolutions; gates reward hunting different enemies, evolving, beating the Treant (locked meta principle); recipes stay hidden (name+weapon only); no new mechanic or art; the Blessing layout uses the existing Warm Lantern card styling.

Right now: Matt reviews this and decides on the dead-card tail option. Next: G1a plumbing. Parked: per-save first-card toast, codex recipe reveal.

**Security check:** review only; read code/data/docs, ran one read-only scratch probe (no repo change, no install). Findings: no exploitable path that matters; must-fix grant evo crash, keep unlocks tree-derived, compile-time unreachable/dead-gate checks.
**Fit check:** plan fits identity and the locked progression principle; flagged the late-run dead-card tail and the respec re-lock as player-facing issues that would otherwise make gated progression feel broken.
