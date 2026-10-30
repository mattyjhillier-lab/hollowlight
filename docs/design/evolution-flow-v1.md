# Evolution flow v1 (DESIGN ONLY, not built, not locked)

Source: LOCKED row "EVOLUTION FLOW CHANGE" (Matt 2026-10-30). Replaces the stat-pair-recipe trigger of LOCKED 2026-10-16 EVOLUTION RULES only once Matt locks one option below. Everything else in those rules (one evolution per weapon per run, cannot re-evolve, D1: an evolved weapon keeps offering its stat cards until maxed) is assumed to stay.

## 0. What the code does today (src/sim/cards.js, evolutions.json, balance.json)
- 15 evolutions, 3 per weapon, each tied to a stat PAIR (e.g. Wolves: Lightfoot speed+power, Howling Legion count+duration, Alpha power+duration). 13 are tree-gated (`treeGate`); Howling Legion and Sanctum Halo are free.
- Trigger: both stats of a pair at rank 5 (maxRank 5) gives a gold card (`goldCards`, max 3 shown via `maxGoldCards`). That is 10 specific ranks out of 20 per weapon.
- Steering: `evoNudge` (pair stats x4 weight, x3 more once the partner is rank 2+), `stirs` glow on the card that finishes a pair, `evoHints` on stat cards. Recipes hidden until discovered (Almanac).
- Quick bot read (scripts/bot.mjs wren, 6 seeds, no tree, so only Howling Legion is open): first evolution at 165, 240, 243, 268, 308, 503 s (median about 255 s). Runs last 700-925 s, level 41-51.
- Problem (Matt): players nearly always pick Power, so only evolutions whose pair includes Power are ever reached; the nudge cannot undo the habit.

## 1. Research (quick, COMMUNITY/OPINION, from memory, no live fetch)
- Vampire Survivors: weapon at max level plus a specific passive item, opened from a chest. Fixed recipe, discoverable, famous for "where is my evolution" confusion and wiki lookups.
- Spirit Hunters (Matt's reference): weapon max level plus a condition tied to another item or skill; one fixed outcome per weapon.
- Brotato: no evolutions; merging two identical same-tier weapons raises the tier. Simple and readable; choice is which weapon you commit to.
- HoloCure: max weapon level plus a specific item gives the collab/upgrade; fixed.
- What works: a clear, legible trigger moment that feels like a reward. What fails: opaque recipes and triggers the player cannot steer. None of the four lets the player CHOOSE among several evolutions of one weapon; that is new, and it fits Wispwick's "power comes from unlocked options" progression (the choice is exactly what the tree sells).

## 2. Shared rules for all three options
- Evolutions stay `treeGate` in the tree. The pick offers only unlocked ones for that weapon; the free ones count as unlocked.
- Stat ranks are never reset. D1 stays. With no recipe, "non-recipe stats" becomes "every stat not at max". Stats that are no-ops for a given evolution (dire_alpha Pack size, soul_lance Bolt count, static_storm Chains, thunder_judgment Cooldown on the burst; see LOCKED D1 row) must be dropped from that evolution's card pool or given a use.
- Hidden recipes: the pair stops being a trigger. The Almanac entry is revealed when the evolution is first picked (not on pair-max). The 15 pairs stay in data as each evolution's "home stats" (what the home-scenario measurement maxes).
- evoNudge, `stirs`, `evoHints` and the Card Fan "Louder Stirring" tree node lose their job (except in Option C). Louder Stirring must be repurposed or retired: Matt's call.
- Edge cases (all options): none unlocked means no trigger and the weapon just keeps levelling. Fresh profile: Wolves and Orbit always have one (Howling Legion, Sanctum Halo); Ravens/Bolts/Chain are themselves tree gates. One unlocked: still shown as a single gold card the player taps (keeps the moment and the name; auto-apply would hide the reward). Two or three: pick one. Weapon slots: the trigger is per weapon, so up to 4 awakenings a run; the pick never uses a slot. Reroll/banish: not allowed on the awaken pick (a reward, not a draw); banish can never remove an evolution. The pick should show name, verb (TRAILS/LEGION/ALPHA), one plain line and a small preview so a new player is not choosing blind.

## 3. THREE OPTIONS

### Option A (RECOMMENDED): Awaken at weapon level 10, as gold cards
- Trigger: weapon level = total stat ranks bought on that weapon (0-20). At level 10 (the same count of ranks as today's pair) every unlocked evolution of the weapon appears as a gold card on the next level-up. `maxGoldCards` 3 already equals 3 evolutions per weapon. One trigger per weapon.
- UI: reuse the existing gold evolution card row; no new screen. Card text says "Awaken" plus the weapon name. Optional gold glow on the weapon's HUD slot at level 10.
- After: stat cards continue until maxed (D1); no recipe hints.
- Recipes/Almanac/nudge: pair retired as trigger; evoNudge, stirs, evoHints removed; Almanac reveals on pick.
- Balance estimate (NOT measured): level 10 is reached as soon as 10 cards go into a weapon, so evolutions arrive at least as early as today and far more reliably (main weapon probably about 3:00-4:30, second weapon later). Evolutions are tuned at max pair ranks (home 1.8-2.3x of maxed base, cap 3x); with a free choice of 10 ranks the multiplier at the trigger varies by pick habit (Power-heavy may exceed, spread builds may fall short). Must be re-measured for three habits (Power-first, balanced, spread) at level 10 and at level 20; re-tune each evolution's `tune` block (about 15 values, mostly dmg multipliers, no new mechanics) so cap 3x and never-below-base 0.98x hold. Win bands (fresh 15-30%, mid 30-55%, max 65-90%) will shift UP because evolutions arrive earlier for everyone; counter by raising the level to 11-12 or small enemy hp scaling. Deaths before 5:00 can only fall.
- Files: cards.js (`availableEvolutions`, `goldCards`, `buildPool` nudge, `stirs`, `evoHints`), balance.json (add `evoAwakenLevel`, drop `evoNudge`), weapons.json per-weapon `evoNudge` (Spirit Bolts RT3), Sim.js evolution apply (small), ui.js card badge, Almanac/codex reveal, tree node Louder Stirring, bots (scripts/bot.mjs and FOCUS picker), tests: cards.test.mjs, nudge/stirs tests, codex tests, gold-card tests. Effort: medium (1-2 days including sweeps). Risk: medium (balance), low (UI).

### Option B: Awakening screen, triggered by weapon mastery (kills), not by cards
- Trigger: each weapon earns mastery from its own kills/damage; awakening at a threshold (e.g. 400 kills with that weapon, per-weapon number). Independent of card picks, so a player who never touches a weapon's stats still awakens.
- UI: a dedicated pause screen "Awaken": weapon portrait and 1-3 large evolution cards with a preview animation, one tap; does not consume a level-up. New DOM screen, art, sound cue, phone layout, HUD mastery meter on each weapon slot.
- After: D1 stat cards continue. Gives a visible goal per weapon (sense of accomplishment).
- Recipes: removed; Almanac reveals on pick.
- Balance estimate (NOT measured): timing is tunable with one number per weapon and easy to hold near today's median, so win bands move least in time terms. But kill share differs a lot between Orbit, Bolts and Chain, so thresholds are per weapon, and the evolution lands on whatever ranks the player owns then (could be 4 or 12): needs a floor so a low-rank evolution is not weaker than base. That floor is the hardest balance problem of the three.
- Files: Sim.js (mastery counters, trigger, run state), cards.js, ui.js plus new screen, RunScene HUD/FX, CSS incl. phone, audio cue, new tests, bot (must pick), balance.json, per-weapon thresholds. Effort: large (3-5 days). Risk: high, nicest feel. Better as a post-launch feature.

### Option C: Recipe stays as a bonus; pair OR level 14 backstop
- Trigger: whichever comes first: the old pair maxed, or weapon level 14. Either way the pick offers ALL unlocked evolutions of that weapon. The evolution whose pair is maxed at that moment gets a small "attuned" bonus (e.g. +15% on its main tune value, bounded so home stays within 2.3x and the cap 3x holds).
- UI: same gold row as A; attuned card gets a small badge.
- After: D1 unchanged. evoNudge and stirs stay useful (they steer toward attuned), so Louder Stirring keeps its job; Almanac pair discovery keeps working.
- Balance estimate (NOT measured): nearly today's numbers for recipe followers; Power-first players now get a pick at level 14 (about 5:30-7:00), later than A, so they still see the other evolutions but late. Smallest balance change; only the level-14 path and the attuned bonus need checking.
- Files: cards.js (small backstop + attuned flag), evolutions.json tune (attuned), ui.js badge, balance.json (`evoBackstopLevel`), tests. Effort: small (about 1 day). Risk: low. Downside: two triggers are harder to explain, recipes stay a hidden rule, and Matt's named problem is only fixed late.

## 4. Comparison
| | A level 10 gold cards | B mastery screen | C pair or level 14 |
|---|---|---|---|
| Fixes "Power-first sees nothing" | yes, early | yes | yes, late |
| Matches Matt's idea | closest | close | partial |
| New UI | none | big | badge only |
| Balance rework | medium (re-tune evo tunes at free ranks) | large (floor + per-weapon thresholds) | small |
| Win-band shift | up, retune | small | small |
| Effort / risk | medium / medium | large / high | small / low |
| Keeps recipes, nudge, Almanac recipe | no | no | yes |

## 5. Recommendation
Option A: it is Matt's idea as stated, reuses the gold row (no new screen), and 3 gold cards = 3 evolutions per weapon. Start at level 10, measure, move to 12 if the sweep says too early (one data value). Pick C only if Matt wants the smallest change before launch. B is a post-launch feature.

Before build (any option): bot/FOCUS pickers need an awaken-pick rule; run sweep-all, rt-matrix, bless-sweep, gates-* against FINAL RETUNE TARGETS (fresh 15-30%, mid 30-55%, max 65-90%, boss win 60-75% with 20-35% of defeats and 75-100 s fight, Long Night 10-20%); evolution home 1.8-2.3x, cap 3x, never below 0.98x base; deaths before 5:00 not increased. Anything out of band goes back to Matt. The independent review required by CLAUDE.md has NOT been done yet.

## 6. Questions for Matt
1. Which option: A (recommended), B or C?
2. Trigger level: 10 (matches today) or 12-14 (protects the fresh-profile win band)?
3. Only one evolution unlocked: one-tap gold card (recommended) or automatic?
4. Louder Stirring node: repurpose as "awakening one rank sooner" (recommended) or retire with refund?
5. Show a look-and-verb preview on each pick card (recommended yes)?
6. Almanac: reveal the evolution entry on first pick (recommended) or when the tree node unlocks?
