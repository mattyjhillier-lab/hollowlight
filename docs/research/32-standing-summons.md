# 32 - Standing summons (allies that stay, have health, can be lost and re-summoned)

Status: RESEARCH + DESIGN FRAMINGS ONLY. Nothing locked, nothing built. Owner direction (not locked): standing allies.
Date: 2026-11-02. Labels: OFFICIAL = developer/wiki-of-record, COMMUNITY = wiki/forum/guide, OPINION = my inference.

## 1. What the code does today (verified by reading src)
- Wolves and Ravens are already persistent "units" (`sim.units`, made by `syncUnits` in `src/sim/weapons.js`). They exist as long as the weapon is owned; count = the Pack/Flock size stat (`s.count`, 2 + 1 per rank).
- They have NO HP, cannot be hit, cannot die, never need re-summoning. Enemies only ever target the player (no unit-hurt path found in `Sim.js`; unverified beyond grep).
- Wolves: pick a target (claims spread them over foes, leash around the player), run, bite on a cooldown, bleed. Idle = orbit the player. Ravens: perch on the player, swoop at a foe in Watch range, peck 3x, fly home.
- So visually they already "stay on the field"; what is missing for "real summons" is: stakes (they can be hurt/lost), a summoning act (cast, cost, cooldown), and individuality (a wolf you care about). That reframes the task: it is mostly a **health + loss + re-summon layer**, not a new entity system.
- Determinism: units use no RNG (comments say so) and are updated in a fixed order; any HP/respawn layer can stay RNG-free.
- Pet precedent: Lucinda's Ophimber exists as a design (LOCKED 2026-11-01, display names only); it is a hero-bound pet.

## 2. How comparable games do it (web research; thin results, honest summary)
The search tool returned mostly guide spam; many named games had NO verifiable hits. Only claims I could source:

| Game | Finding | Label |
|---|---|---|
| Path of Exile 1/2 | GGG patch notes 3.8.1: minion popularity caused much of the Blight-era performance trouble; "minions are monsters" so all monster costs apply. PoE2 skills carry explicit minion caps (e.g. wardbound minions limit 15 rising to 20). Players report minions hitting wrong targets, not prioritising threats, sticking on walls; PoE2 has "Reviving Minions" mechanics and a minion control system thread. | OFFICIAL (patch notes) + COMMUNITY |
| Soulstone Survivors | Summon skills conjure minions/constructs that fight autonomously and scale with attributes/power-ups. One player: cast speed/multicast raises minion attack rate but also makes you re-summon more often. | COMMUNITY (wiki + Steam post) |
| Brotato (Engineer) | Turrets are structures that spawn from the Wrench; scale with Engineering stat (not normal damage stats); Engineer unlock = 5 turrets alive at once; structures spawn in a cluster. Turrets are static, not mobile allies. | COMMUNITY (wiki/guides) |
| Vampire Survivors | Weapon "familiar" names (Mazo Familiar is a bat-themed weapon evolution scaling with max HP) are weapons, not HP-bearing allies. Peachone/Ebony Wings are orbiting birds, no HP, merge via Union. I could not verify any VS summon with HP. | COMMUNITY |
| Spirit Hunters: Infinite Horde | Store text: 20+ unlockable pets, each with own abilities/behaviours; no source confirms HP-bearing summoned allies. Unverified. | OFFICIAL (store listing) |
| Terraria (summoner) | Minion cap starts at 1 and rises with progression; Remnant 2 patch notes fixed minions targeting corpses/pigs. | COMMUNITY |
| Halls of Torment, HoloCure, Death Must Die, Magic Survival, Hero Siege, Hades/Slay-style | NOT VERIFIED. No usable search hits. From general knowledge only (OPINION, unverified): survivors-likes mostly keep "summons" as immortal auto-attackers (so the genre norm matches Wispwick today) and give loss/rebuild only to minion-class RPGs. | OPINION |

Patterns that hold across what I could verify (treat as moderate confidence):
1. Hard caps on live minions are universal; uncapped counts wreck performance (PoE2 anecdotes of thousands of skeletons -> unplayable).
2. Where minions can die, a visible re-summon rule is the core loop (cooldown, ability, or "free refill over time"). Re-summon rate interacting with cast/attack speed is a known balance trap (Soulstone note).
3. Minion AI complaints are always targeting priority and pathing/sticking; simple "stay near owner, leash" AI avoids most of it.
4. Static structures (Brotato turrets) are the cheap, readable version; mobile allies cost AI and clutter.
5. Evolution/upgrades in these games scale existing summons (more, tougher, new behaviour) rather than adding systems.

## 3. Key design facts that shape every option
- Enemies currently only chase/hit the player. Giving allies HP means enemies need *something* to damage them. Cheapest honest way (OPINION): **no aggro AI**; allies take damage from enemy bodies overlapping them (contact tick, cooldowned per ally) and from area/boss attacks via the existing hit-test. Enemies do not change their pathing, so the 100s-of-enemies flow and balance stay intact.
- Readability at 100+ enemies: allies must differ clearly from enemies (lantern-lit trail, role colour: Wolves #9fd8ff, Ravens #b79cff), show damage state simply (brightness/size of the spirit-light, not HP bars on every unit), and show "lost" as a wisp that fades back to the hero.
- Balance anchor: bands in LOCKED "FINAL RETUNE TARGETS" (fresh Twilight 15-30%, mid-tree 30-55%, max 65-90%, boss rules) were tuned with immortal summons. Any loss mechanic is a pure nerf unless re-summon is cheap; any "death makes them stronger" is a buff. Net effect must be measured by sweeps, not guessed.
- Evolutions: many are verb changes built around the unit list (Alpha + shades, Echo Pack, Light Trails, Talon Mark, Wall of Wings). An HP layer must be added at the *unit* level so evolutions keep working unchanged.

## 4. Four framings

### A. Weapon summons gain HP + re-summon (in-slot)
**Fantasy:** your wolves and ravens are real spirits: they can be hurt, fall, and your weapon re-calls them.
- Structure: no new slot. Each weapon unit gets HP (scales with a stat or Pack size), contact damage can wound it, a downed unit becomes a fading wisp and is re-called by the weapon itself after a delay (per-unit timer, e.g. 6-10 s, shortened by an existing stat rank such as Wolf speed / Wingbeat). Count stat = max alive.
- Wolves concretely: wolves take contact damage when they bite into a crowd; low-HP wolves flash dim; Rend/leash keeps them near. Dire Alpha: Alpha has big HP, shades are fragile and re-form from the Alpha's next bite. Echo Pack echoes are expendable by design.
- Ravens concretely: ravens are vulnerable while diving/pecking, safe while perched; downed raven returns from the player's shoulder as a new perch after delay.
- Sim: add `hp`, `down`, `respawn` to units, a small damage hook in the enemy-contact step, per-weapon respawn timers. Touches `Sim.js` (contact loop) and `weapons.js` (each unit-based weapon incl. Orbit? Orbit and Bolts should stay immortal). Deterministic (no RNG needed). Perf: one extra pass over units x nearby enemies (use the existing grid).
- Balance risk: MEDIUM-HIGH. Pure nerf unless HP/respawn tuned; evolutions designed around constant unit counts (Pack size 5 = 5 bites/s) lose DPS during respawn gaps. Needs RT-style sweep re-run for wolves/ravens and every evolution of both.
- Scope: MEDIUM. Fit: GOOD (stays "summons", no new UI); risk of feeling like "weapons that sometimes stop working" if loss isn't charming.

### B. Separate Companion slot beside the 4 weapon slots
**Fantasy:** one standing spirit friend (a wolf, a raven) that you call and keep; weapons stay weapons.
- Structure: a 5th "Companion" slot, chosen on run start or via a gold card; companion has its own 5 ranks (HP, power, speed, ...), evolutions become "forms". Re-summon via hero ability or a free timer.
- Wolves/Ravens: would move OUT of the weapon pool into companions, or exist twice (weapon version stays).
- Sim: new entity type, new card/pool logic, new save/codex/tree entries, HUD slot; touches `cards.js`, `Sim.js`, UI, tree budget. Deterministic if RNG-free.
- Balance risk: HIGH (new power source on top of 4 slots; breaks "abilities a modest share of power" unless it replaces a slot); invalidates the locked 4-slot x 15-evolution structure.
- Scope: LARGE. Fit: good thematically, but conflicts with LOCKED "4 weapon slots / V1 weapons scope (no new weapons in v1)" -> would need a reopen.

### C. Hero-bound pets only (Ophimber model)
**Fantasy:** your hero has one loyal spirit companion; weapons unchanged.
- Structure: each hero (starting with Lucinda/Ophimber) gets one pet defined by hero data, tied to the hero ability (Ophimber's Rise). Pet HP + re-call via the ability cooldown (60 s base).
- Wolves/Ravens: unchanged (feel stays "magic summons"). Wren could get a "lead wolf", Mara a "lead raven" later.
- Sim: one pet entity per hero; reuse unit list; very small blast radius in `Sim.js`. Perf negligible (1 unit).
- Balance risk: LOW-MEDIUM (one unit, ability-gated, bounded). But does NOT answer the owner's complaint about wolves/ravens.
- Scope: SMALL-MEDIUM. Fit: good; fits existing "hero differs by ability and look" rule.

### D. Hybrid: some weapons become standing allies, others stay attack-style (RECOMMENDED shape)
**Fantasy:** Wolves and Ravens are your *pack and flock*: a few named spirits that fight at your side, can fall, and the lantern calls them back; Bolts, Chain Lightning and Orbit stay as magic.
- Structure: only the two summon-type weapons (`type: "summon"` in weapons.json) get the ally layer (framing A, but limited to them). Stage it:
  1. **Loss only for the *front* unit class:** units have small HP; when downed they become a wisp that returns to the hero and is re-summoned automatically after a visible delay (default), faster with an existing stat. No manual cost.
  2. **Lantern re-call (hero ability or Spirit Gather):** optional later hook, not step 1.
  3. Cap: allies alive <= Pack size (max 7 wolves; Ravens similar); evolutions keep total unit caps.
- Wolves concretely: 2-7 wolves, HP scaling with Bite power; they take contact hits when biting in; evolutions: Alpha = tanky leader + fragile shades; Echo Pack = expendable echoes (already temporary); Light Trails = fast, trail-laying, lower HP.
- Ravens concretely: ravens are vulnerable only during dive/peck; perched = untouchable, so the loss risk is a visible choice (swoop = risk). Talon Mark's big dive is the highest-risk raven moment.
- Sim: same as A but opt-in per weapon via a data flag (`standing: true`) and a shared helper in `weapons.js`; Sim.js contact loop gets one `hurtUnit` call. Deterministic; no RNG. Perf: only summon-weapon units (<= ~14) are tested against nearby enemies via the grid.
- Balance risk: MEDIUM. Two weapons only, so sweeps are bounded (wolves, ravens x their evolutions); fresh-profile starting weapons currently tuned Ravens down / Orbit up ~20% per LOCKED, so ravens' band must be re-checked.
- Scope: MEDIUM. Fit: BEST. Keeps 4-slot structure, evolutions, tree; only adds stakes + a visible "called back by the lantern" beat that matches Warm Lantern (loss = a spirit-light dims and returns to the lantern; no gore, no grim tone).

## 5. Comparison

| | Slots/evolutions intact | Answers "not real summons" | Sim change | Balance risk | Scope | Identity fit |
|---|---|---|---|---|---|---|
| A in-slot all summons | yes | yes | medium | med-high | M | good |
| B Companion slot | NO (reopen LOCKED) | yes | large | high | L | good |
| C hero pets only | yes | no | small | low-med | S-M | good |
| D hybrid (wolves+ravens) | yes | yes | medium, bounded | medium | M | best |

## 6. Recommendation
Framing D, delivered as a small first chunk: **units get HP and a gentle "return to the lantern, then re-called" cycle for Ghost Wolves and Ravens only**, flagged in data (`standing`), RNG-free, enemies keep targeting the player. Ship it behind a balance sweep, not as a new system. Keep framing C (Ophimber) as the separate hero-pet track; it composes with D. Do not do B unless the owner wants to reopen the 4-slot lock.

## 7. Risks and pitfalls (checked against sources above and the code)
- Balance snowball/nerf: respawn gaps cut DPS exactly when the crowd is thickest; mitigate with short delay, pad HP so a downed unit is an event, not routine. Measure with `sweep-all.mjs`, `rt-matrix.mjs`, and the evolution home/ablation scripts; report seed counts and noise.
- Frustration: if wolves die constantly, the fantasy turns into upkeep. Target: a unit falls only in real danger (say 1-3 times per run per unit at fresh power, rarely at max).
- Clutter: re-summon wisps and damage flashes at 100s of enemies; use a single soft light-dim, no numbers.
- Pathing/targeting: avoid new AI; keep leash around the player (PoE complaints are about stuck/stray minions).
- Perf: cap live allies; test via grid, not O(units x enemies) scan.
- Determinism: no RNG in HP/respawn; update in fixed unit order; any damage-to-ally uses the existing per-enemy cooldown pattern (`canHit`).
- Saves/tree: no save-format change needed if HP/respawn are derived from existing stats (otherwise tree nodes touching them need a migration; avoid for v1).
- Existing evolutions assume constant unit counts (Dire Alpha, Echo Pack, Spearhead, Wall of Wings); each needs an explicit "does it use the ally layer?" decision.
- Unverified: genre norm. I could not verify that comparable survivors-likes (VS, Halls of Torment, HoloCure, Spirit Hunters) implement HP-bearing summons; the genre-norm claim that they stay immortal is OPINION.

## 8. Open questions for the owner
1. Should a lost wolf/raven ever be a real cost (a re-summon timer you wait on) or only a brief visible dip that is almost free? (Recommended: short, mostly free at first.)
2. Do you want a manual re-summon (Space/ability or a gather button) or fully automatic?
3. Should enemies deliberately chase the allies (real aggro) or just hurt them when overlapping? Recommended: just overlap/area damage, no aggro.
4. Do Orbit, Bolts and Chain Lightning stay immortal magic? (Recommended yes.)
5. Is it acceptable that Ravens (already a weaker fresh-profile weapon) get a loss mechanic, or should they get a compensating buff?
6. Is Ophimber (Lucinda) meant to share the same ally rules, so one system serves both?
7. Does "evolution" become more about the ally (tougher/new behaviour) or stay a weapon verb change?
