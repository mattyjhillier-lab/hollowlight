# Fire weapon + Lucinda v2: Dragonfire Meteor, Wildfire, Cinder Wyrm, third evolution, her ability (design sheet, NOT locked)

Date 2026-11-01. DESIGN ONLY: no src/tests/data touched. Supersedes docs/design/new-weapon-hero-v1.md (wip/design-weapon-hero) for the weapon, evolutions and Lucinda's ability; its tree + build-order shape is reused.
Checked against: CLAUDE.md, LOCKED rows FIRE WEAPON DIRECTION + HER ABILITY / NEW WEAPON + HERO PICKS / NEW HERO + PET NAMES / ANY STARTER ON A NEW PROFILE, docs/research/31-fire-weapons.md, evolutions-and-stats-review.md, CONTENT-GUIDE.md, weapons/evolutions/characters.json, Sim.js Burn (`burn(e,hit,time,rate)`, BURN_RATE 0.2, BURN_TIME 2, one instance per enemy, strongest potency wins, `tfx.burnMul` from the shared status cap), cluster raven_flock.json (+ holy_orbit.json `or_kindle` status nodes), wip/ember-breath (already merged into dev, flagged `unreleased`).
Decided by Matt (not reopened): base DRAGONFIRE METEOR; evolutions WILDFIRE + CINDER WYRM; hero Lucinda + pet Ophimber; ability = pet rises, three expanding fire rings, ground ablaze a few seconds; fire = warm lantern light (soft gold to ember-rose, restores colour, never scorches, no smoke).
Ids: weapon `dragonfire_meteor`, hero `hearthwarden` (display Lucinda), pet id neutral (display Ophimber). All numbers are ESTIMATES until the bot sweeps (section 6).

## 1. WEAPON: Dragonfire Meteor (verb CRASH)
Fantasy: Lucinda calls a blazing fireball out of the sky; it crashes into the thickest crowd, bursts, and leaves a hearth-pool of burning ground that warms the grey Hollow. Magic, summon-spirit type ("a dragon's ember she calls down"), tags none (a new "fire" tag would need a new soft-cap category; avoid). Colour #ffb35c. Hero-agnostic (NO HERO WEAPON rule): Wren or Elias can carry it.

- **Aim rule:** densest cluster, never random. Each volley queries the spatial grid for the block (radius = burst radius) holding the most enemies on screen, tie-break nearest the player. Min distance 50 px from the player, max 230 px; no enemies, no volley. Extra fireballs (count) take the next-densest clusters at least 1.4 x burst radius apart so they never stack on one spot; with only one cluster they land spaced around it.
- **Beat (the "this is fire" sequence):** launch whoomp at her hand -> 0.45 s arc (ball shadow + faint target ring on the ground so the player sees the landing) -> impact flash + 2-frame scale pop, no hit-stop -> burst damage -> ground fire.
- **Cadence:** one volley per 2.6 s (`cd: 2.6` in weapons.json; cooldown is a tree node, not a card stat). First volley 0.8 s after the weapon is picked, so a fresh pick pays off at once.
- **Four stats x 5 ranks** (base + perRank x rank, sibling convention):

| key | card name | base | per rank | rank 5 | hint |
|---|---|---|---|---|---|
| count | Fireballs | 1 | 0.6 (ceil) | 4 | "One more fireball falls each volley" (ranks 1,2,2,3,3,4) |
| power | Impact | 14 | 5.6 | 42 | "The crash hits harder, and the fire it leaves burns harder" |
| area | Blaze | 34 | 5 | 59 | "The burst and the burning ground are {old} → {new} wide" |
| duration | Embers | 2.5 | 0.5 | 5.0 s | "The ground burns {old} → {new} s" |

Sibling check: Impact 14 vs Orbit 12 and Wolves 7 (a bite lands several times a second; Meteor lands once per 2.6 s so its hit is front-loaded). Fireballs max 4 (each is an area hit plus a pool, so 4 is the clutter ceiling; Wolves and Ravens go to 7).
- **Rank 0 impact:** the burst hits everything in radius 34 for 14 (kills most Chapter 1 trash in one hit early), applies Burn, pool burns 2.5 s. The "weak slow start" complaint (Fire Wand, Santa Water) is answered by the immediate first volley, guaranteed damage at the densest spot, and a burst worth the pick before the ground matters.
- **Ground fire (pool):** radius 0.9 x Blaze, life = Embers, tick 0.5 s, tick damage 0.3 x Impact, each tick refreshes Burn. Global per-target lockout 0.5 s across all pools, so overlap never multiplies.
- **Burn (existing, shared):** impact calls `burn(e, hit, 2.0, 0.20)` (same as Holy Orbit): one instance per enemy, strongest wins, time refreshes, `tfx.burnMul` from the status cap applies; no new status or cap category. Meteor and Holy Orbit burn do not add. Credited to `burnBy.dragonfire_meteor`.
- **HARD caps:** live pools max 5 (full cap replaces the oldest, which fades in 0.3 s); max 24 targets per pool tick via the grid. Total flame-visual budget per run (weapon + evolutions + ability) = 8 pool visuals; 3 are reserved for the ability so the weapon cannot starve it.
- **Boss clause:** `boss: 1.4` in weapons.json (impact and every form, as Spirit Bolts has 2). Pools tick a boss at 0.5 x. Burn refreshes but is one instance. The global per-target lockout means a boss standing in 5 pools takes the same as in 1.
- **Particles per tier** (render only, pooled sprites, no per-frame allocation):

| tier | per pool | impact burst | extras |
|---|---|---|---|
| High | baked ground glow + 4 flame tongues + 3 rising embers | 14 sparks + flash | warm light pool, 3 px screen punch |
| Medium | glow + 3 tongues + 1 ember | 8 sparks + flash | 2 px punch |
| Low | ONE baked glow-and-flame sprite, no embers, no additive blend | 4 sparks, flash as 1-frame sprite | no punch |
| Calm motion (any tier) | tongues pulse slowly (no flicker), no embers | flash only, fades not pops | no punch, no shake, ball arc slowed 20% |

Flame tongues are 6 hand-baked frames in the critter-atlas style, reused across pools (rotate + tint): GPU cost is sprites, not particles.
- **Look:** core pale gold #fff1c2, mid amber #ffb35c, rim ember-rose #e07a6b at 0.5 alpha; no black, no smoke. Burning ground "blooms": a faint colour-restoring tint (life-map hook) fades in under the pool and lingers 1 s after, never char. Ball: round, short comet tail, a dragon-scale glint (tie to Lucinda).
- **Sound:** low "whoomp" on launch (EW2 cue retuned lower), soft rising whistle on the arc, warm crackle on impact (existing noise engine), quiet looping crackle per pool with max 2 shared loop voices. Calm motion does not mute sound (separate setting).
- **As a STARTER (fresh-start 15-30%):** lower sustained single-target than Wolves, better vs crowds, no aim or chasing. Expect fresh random-pick win 16-24%; accept only if inside 15-30% AND within 6 points of the median starter. Knobs if off: base Impact and first-volley delay, never the caps. Evolutions are tree-gated so a fresh profile plays the base weapon only. ANY-STARTER rule: the id stays out of `balance.starter.weapons` (and `unreleased`) until this holds; adding it is the release switch.

## 2. EVOLUTION 1: WILDFIRE (verb SPREAD, "the pool that learns to walk")
Recipe pair: area + duration (Blaze + Embers). Recipe hidden, discovered via codex.
- **Change:** while a living enemy stands in a Wildfire pool, every 1.2 s the pool seeds ONE child pool 20-30 px toward the nearest un-burning enemy. Generation 0 = meteor pool, children gen 1, grandchildren gen 2, none after (spread fades). Child radius 0.8 x parent, life 0.7 x parent. Pools grow 1.0 -> 1.25 radius over their life. Tick damage 0.45 x Impact (base is 0.3).
- **Caps:** max 6 live Wildfire pools in total (not per meteor); a pool seeds at most 2 children in its life; max 3 seeds/s across all pools; at cap, seeding is blocked (no replacing). Burn stays one instance per enemy, strongest wins, no spread-stacking. Reach 30 px so it creeps, never teleports.
- **Home scenario:** a dense, slow-moving crowd (Chapter 1 mid-run, and kiting circles so foes follow through the fire). Target 1.9 x maxed base there, hard cap 3 x, never below base (it keeps the full base burst and ground). Ablation vs base at identical ranks in 3 scenarios: dense crowd, sparse, boss.
- **Look/sound:** same hearth glow, tongues leaning toward the next foe; a soft ember-"tick" as a child lights; no extra particles (children reuse pooled visuals).
- **Fit:** fire that warms and spreads like a hearth, restores colour, no scorch. Sense: capped generations (cannot run away), visible chain. Codex: "A hearth never stays where it is lit."

## 3. EVOLUTION 2: CINDER WYRM (verb LOOP, "the old fire remembers its shape")
Recipe pair: count + power (Fireballs + Impact); distinct from Wildfire.
- **Change:** the weapon gains a flame-serpent SPIRIT (large, slow, ancestral, luminous body; clearly bigger than Ophimber and clearly not a creature at her side). One Wyrm at a time. It loops in a great oval of radius 95 px around the densest cluster at 150 px/s, 7 s up, 2 s down, then re-forms at the next densest cluster. 7 body segments; each hits every enemy it touches for 0.7 x Impact, per-target lockout 0.4 s (a pass never multiplies), applies Burn, leaves sparks only (no ground fire). The normal volley continues at 70% rate (cd 3.7 s), so the evolution adds and never removes (never below base).
- **Caps:** one wyrm; max 40 hits/s; no extra pools; sparks 8 live High / 3 Medium / 0 Low (body = one chain sprite); Calm: 70% speed, no spark trail.
- **Home scenario:** sparse-to-medium crowds spread across the screen, and bosses (reach, moving target). Target 2.0 x base there, cap 3 x. Weak in dense stationary crowds (Wildfire wins), so the two are a real choice.
- **Look/sound:** gold-to-rose chain of rounded flame segments with a small horned head, two eye glints (dragon-kin family tie); slow serpent glide, low warm hum, soft whoosh pass-by. Codex: "It was a hearth once. It remembers being a roof."

## 4. EVOLUTION 3: three options (Matt picks; none locked)
Each pair differs from Wildfire (area+duration) and Wyrm (count+power); each verb differs from SPREAD and LOOP.
- **A (Recommended) CINDER BRAND, verb POP, pair power + duration.** Mark then detonate. Impact brands each enemy it burns with a glowing ember-mark; when its Burn ends (~2 s) it pops in a gold burst radius 26 for 0.6 x Impact. Pops never re-brand (one generation), cap 12 pops/s. Uses existing Burn (no new status), cheapest on phones, makes Burn tree nodes matter, pools stay base-sized. Home: tough groups that outlast a burn (elites, mid-run waves), 1.9-2.1 x base. Risk: two-step read; solved by one clear mark glyph plus a pop sound. Codex: "What it touches, it remembers, and returns."
- **B SKYFALL, verb CRASH-BIG, pair power + area.** The volley becomes ONE huge comet every 6 s (burst radius 90, 2.6 x Impact) leaving one large ember pool; the small fireballs stay at 50% rate so it is never below base. Dramatic, very phone-cheap. Home: a packed single mass and bosses; 1.8-2.2 x. Risk: the "Fire Wand with a long cooldown" complaint pattern; weaker vs scattered enemies.
- **C OPHIMBER'S DIVE, verb DIVE, pair count + area.** Every 3rd volley Ophimber folds his wings and dives through the densest line, leaving a 150 x 28 px ember lane for 2.5 s (one lane live). Ties hero to weapon. Risk: reads like her ability (Ophimber fire on the ground) and makes a hero-agnostic weapon feel hero-bound (Wren would need a stand-in sprite); 1.8-2.1 x.
Recommendation: A (cheapest, reuses Burn, most distinct, ability and weapon stay visually separate).

## 5. LUCINDA'S ABILITY (60 s). Names (Matt picks): (1) **Hearth Rings** (Recommended, matches Hearth-Warden), (2) **Ophimber's Rise**, (3) **Three Blazes**
Matt's idea: her pet dragon rises up and breathes fire onto the ground in a circle three times, each ring further out, leaving the ground ablaze a few seconds.
- **Timeline** (centred on Lucinda at activation; the centre stays fixed even if she moves, rings do not drag; she can keep moving):

| t (s) | beat |
|---|---|
| 0.00 | Ophimber rises 26 px above her shoulder over 0.4 s, wings spread, soft chime |
| 0.40 | ring 1: radius 48, band 20 px, breath sweeps the circle clockwise in 0.35 s |
| 1.10 | ring 2: radius 88, band 20 px, sweep 0.45 s (40 px spacing = 20 px safe gap between bands) |
| 1.80 | ring 3: radius 128, band 20 px, sweep 0.55 s |
| +3.0 each | each ring stays ablaze 3.0 s (ring 3 ends ~5.3 s); Ophimber settles at 2.4 s |

- **Damage per ring:** ignition hit 2.2 x `B` (B = 14 + 0.6 x hero level, cap 20: 14-26) on enemies in the band as it sweeps; ground ticks 0.5 x ignition every 0.5 s for 3 s with the global 0.5 s per-target lockout across all rings; Burn 0.20 for 2 s via the shared hook; boss 0.5 x. A crowd charging in meets 1-3 rings; one standing in ring 1 gets ring 1 only.
- **Bounds:** target ability-on vs off within 2-5 win points and <= 10% of run damage (measured with `scripts/gates-ablate.mjs` plus an ability-off sweep flag). Flame budget use = 3 visuals. Cooldown 60 s, floor 30 (`abilityCdFloor`), generic cooldown nodes and auto-activate apply as for other heroes.
- **Versus Elias's Sanctuary Ring** (radius 80, 6 s, static disc on him, heals 1.5 x, slows 20%: SHELTER): Hearth Rings are three expanding offensive bands (48/88/128) staggered over 1.4 s that burn, with no heal and no slow: SCORCH-OUT. Different shape (bands vs disc), job (offence vs defence), palette (gold-to-rose flame vs candle cream).
- **Readability (640x360 and phone):** ring 3 (radius 128) fits the 320 px half-width; band 20 px stays at least 2.4 px tall on a 360 px phone; a thin dotted outline of the next ring shows 0.25 s before it ignites so the player sees where to stand; fire never hurts her or allies. Pet sprite 16 px.
- **Clutter/heat:** 3 ring sprites total (tilted-ellipse textures, one sprite per ring, not per tile); max 2 sparks per ring on High, 0 on Low; ring flames reuse pool tongue frames; one whoomp per ring, no loops. Low tier: baked ring sprites with a 2-frame brightness pulse, no sweep animation. Calm motion: rings fade in over 0.3 s (no sweep), Ophimber rises without bounce, no punch.
- **Tree hooks:** only the generic `abilityCd` and auto-activate nodes, plus the keepsake (Warm Scale; copy says "ring" not "lane"). A late bond perk may widen rings +8% (bounded). Replaces `strafing_run` with `hearth_rings`; the hero is unreleased, so no save carries the old id.

## 6. TREE cluster shipped with the weapon (docs/design/skill-tree-v2.md, raven_flock shape)
File `src/data/tree/clusters/dragonfire_meteor.json`, prefix `dm`, emblem `flame` (new `emblems/flame.json`, from the EW2 candle-flame outline), next free sky slot (verify with `node scripts/tree-validate.mjs`), `chapter: cursed_forest`, `region: launch`, `hero: null`.
- **Heart gate** `gt_dragonfire_meteor` (cost gold 200, unlocks the weapon): killEnemy of a Chapter 1 enemy, n about 6000 (confirm ids and pace with `scripts/gates-pace.mjs`).
- **Socket gates** (hidden, costs like raven): `gt_wildfire` (evolveWeapon any n 4), `gt_cinder_wyrm` (evolveWeapon dragonfire_meteor n 1 + killEnemy mid enemy n 10000), `gt_<third>` (evolveWeapon n 3 + clear cursed_forest). Sockets a/b/c = Wildfire / Cinder Wyrm / third; evolution needs its socket gate.
- **Stat nodes (small, inside the soft cap):** 8 nodes of +2% (two each on Impact, Blaze, Embers, Fireballs) in the per-weapon category, 2 cooldown nodes (-2% volley cooldown), 2 status nodes `dm_kindle` Burn potency +3% (status "burn", shared cap, same as `or_kindle`). No new status category.
- **Budget:** a sixth per-weapon pool (`perWeapon.refWeapons 5 -> 6`, combat ceiling base 31 + 3 per chapter). Run `node scripts/tree-validate.mjs --table`; if combat PE exceeds the ceiling, trim node sizes before touching the rule; raising the rule is Matt's decision. Add the cluster to `scripts/tree-release.mjs --snapshot` for the next launch-merge.
- **Codex/Almanac** (append-only keys): `weapon:dragonfire_meteor`, `evo:wildfire`, `evo:cinder_wyrm`, `evo:<third>`, `hero:hearthwarden`, `pet:ophimber`; recipes stay hidden.
- **Rebalance checks (every change):** `npm test`; `tree-validate --table`; `gates-pace.mjs`, `gates-softcap.mjs`, `gates-ablate.mjs`; `sweep-all.mjs` and `rt-matrix.mjs` (fresh Twilight 15-30%, mid tree 30-55%, max 65-90%); `bless-sweep.mjs`; `boss-sweep.mjs`; `bot.mjs wren 8` (+ `FOCUS=1`) for first-evolution time; Wren vs Elias vs Lucinda gap. Report seed counts and noise.

## 7. REUSE PLAN for hidden Ember Breath (wip/ember-breath, merged into dev, `unreleased`)
- **Reuse:** the `burn(e, hit, time, rate)` plumbing; the `unreleased` flag and its `starter.js`/`codex.js` skips (release switch = add id to `balance.starter.weapons`); the flame emblem outline and EW2 flame look as pool/ring tongue frames; EW2 audio cues re-pitched for whoomp/crackle; `scripts/ember-shots.mjs` as the screenshot harness (desk/phone x High/Med/Low x Calm).
- **Replace/remove:** ember_breath weapon entry, its cone sim in `sim/weapons.js`, its three evolutions (Hearth Gale, Slow Burn, Wyrm's Ring), codex copy and tests. It never shipped (no save holds it), so ids can be removed outright in the chunk that adds `dragonfire_meteor`; no hidden fourth cone weapon.
- **Keep:** the screenshots under docs/screenshots/ember-breath as history only.

## 8. BUILD ORDER (small chunks, one at a time; each: tests, build, security, FIT)

| # | Chunk | Done check |
|---|---|---|
| DM1 | Data: weapons.json entry (unreleased), balance, boss, cd; remove ember_breath data | `npm test`, build |
| DM2 | Sim: aim, arc, burst, Burn call, pools with caps + lockouts | unit tests (aim, pool cap 5, lockout, boss), `bot.mjs` pass |
| DM3 | Art + sound: ball, flash, tongues, bloom, tier + Calm variants | screenshots desk + phone, High/Med/Low, Calm |
| DM4 | Wildfire sim + art + cue | tests (generation + 6-live cap), 3-scenario ablation |
| DM5 | Cinder Wyrm sim + art + cue | tests, sparse + boss ablation |
| DM6 | Third evolution (Matt's pick) | same |
| DM7 | Hearth Rings + Ophimber rise art; `hearthwarden` entry (unreleased) | tests, ability on/off 2-5 points |
| DM8 | Tree cluster + emblem + gates + codex + hostile-save tests | `tree-validate --table`, `gates-*`, budget decision |
| DM9 | Balance pass (section 6 list) + starter check | numbers, seeds, noise |
| DM10 | Release switch (Matt's yes): starter list, unflag, launch-merge snapshot | checklist, PR |

DM3 may overlap DM2 (render vs sim, separate files).

## 9. SELF-REVIEW
1. Numbers are estimates; sweeps decide. Risk: rank-0 Meteor above Wolves as a starter (hero gap) or under 15%; knobs named in section 1.
2. Tree budget: a sixth weapon pool may breach the combat ceiling (already flagged in LOCKED); Matt decides.
3. Ability vs weapon both leave burning ground: separated by shape (bands vs discs), shared flame budget (8) and per-target lockout.
4. Option C would break hero-agnostic weapons; reason A is recommended.
5. Phone heat has no evidence (research UNVERIFIED): needs a real-phone test (Matt) before DM10; Low tier is near sprite-free.
6. LOCKED conflicts: none. It replaces Ember Breath and Strafing Run per Matt. New LOCKED rows after Matt's picks: stats, ability name, third evolution. ANY-STARTER needs the DM9 starter check before DM10.
7. Gaps: hero ability base B and kill-gate enemy ids need checking against enemies.json and `gates-pace.mjs`; Wyrm and Ophimber art may need a three-options pass.
Fit check: warm lantern flame, restores colour, no smoke or scorch, summon and magic only, readable at 640x360. Security check: docs only, no dependencies or secrets.
