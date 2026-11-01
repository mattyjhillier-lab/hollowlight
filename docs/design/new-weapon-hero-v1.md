# New weapon + new hero v1: a fire spirit and a dragon-kin hero (design sheet, NOT locked)

Source: Matt via coordinator, 2026-11-01. The next hero is a FEMALE DRAGON-KIN with a SMALL DRAGON PET; her kindred weapon is a FIRE/FLAME weapon. Status: DESIGN ONLY, nothing built. Matt picks by one-tap questions (rule: three options each). A new MAP is a separate sheet (section 8).
Checked against: CLAUDE.md, docs/LOCKED.md, IDENTITY.md, BIBLE.md, CONTENT-GUIDE.md (sections 1-3), characters-v2.md, src/data/{weapons,evolutions,characters}.json, tree cluster raven_flock.json, tree core.json budget.

## 0. Hard facts that shape the design
- Heroes differ ONLY by ability + look + keepsake (characters-v2; LOCKED NO HERO WEAPON 2026-10-31). `kindred` is data only, never shown. So the new weapon must work for EVERY hero, and the hero's ability must work with EVERY weapon. The pet and the flame are linked by theme and look, never by code.
- Existing weapon verbs: Wolves HUNT + bite + bleed, Ravens SWOOP, Bolts HOME, Chain JUMP, Orbit CIRCLE (evolutions add trail, legion, storm, mark, spear, burst, lance and more). Burn already exists as a weapon-owned status (Holy Orbit) with shared tree potency nodes (`or_kindle`, status cap 16).
- Existing hero verbs: Wren DART (escape, self), Elias SHELTER (stationary heal + slow). Open slots: an offence verb and a line/area verb.
- The tree is character-agnostic; heroes have NO tree nodes (hero lanterns retired). A hero's "tree" = keepsake hint + Bond perks + Almanac page + cosmetics.
- Tests pin 5 weapons, 15 evolutions, 2 heroes. Update the pins deliberately in the same commit.

## 1. Research (short)
| Source | Finding | Label |
|---|---|---|
| Vampire Survivors wiki | Fire weapons differ by verb, not just damage type: aimed fireball, ground pools, expanding rings. Each later weapon gets a unique pattern plus an evolution pair. | OFFICIAL (in-game/wiki) |
| Hades (weapon Aspects) | A new weapon sells on a new verb you feel in a second; extra numbers do not. | OFFICIAL |
| Halls of Torment, Brotato | Late additions that repeat an existing verb with new art get called filler; ones that open a new playstyle get praised. | COMMUNITY |
| Dragon heroes in survivors-likes | A dragon/fire hero is a common default; it reads generic unless silhouette and tone are specific. | OPINION |
| Pets in action games | Followers feel alive from lag, bob, perch and reactions, and stay readable when small and out of the way. They stay cosmetic unless the pet has one clear job. | COMMUNITY/OPINION |

Lessons: (1) pick a verb nobody has (cone, ground, delayed blast; not another projectile or orbit); (2) fire is the easiest effect to overdo: cap coverage and particles, keep it warm and soft; (3) make her specific (hearth-warden lineage, tiny wyrmling), not "generic dragon".

## 2. Fit check: dragon-kin vs the Wispwick identity
- Identity (IDENTITY.md): the Hollow is drained and grey; spirits restore colour and leave luminous trails; warm lantern light; restraint. A dragon fits ONLY if her fire is the same thing as lantern light: she is the last **hearth-warden** of a small hearth-wyrm folk who kept village fires. Her blood holds "the first fire"; where she burns, colour blooms back (never scorch, never black smoke).
- Scale: not epic fantasy. Small horns, a short tail, ember-gold scale freckles; the pet is a hatchling the size of a loaf. Cosy chibi (P1 proportions), same family as Wren and Elias.
- Colour restraint: all spirit-flame uses ONE ramp, soft gold core (#ffd98a) to ember rose-gold (#ef8a5a). No red, no pure orange, no smoke. Hero accent is ember rose-gold; Wren stays amber, Elias candle white. The cosmetics validator (lantern colour band) must pass.
- Mechanical sense: all effects go through shared hooks (Burn status, damage-amp cap x1.75, existing zone code).
- Risks: fire dominating the screen at 350 enemies (coverage caps below), heat colour fighting the lantern pool (additive glow capped, no full-screen tint), phone perf (particle cap, Low tier halves it), Orbit Burn visual clash (Burn keeps one small candle-flame icon).

## 3. WEAPON: three fire options
Common art rules: flame drawn as teardrop candle-flames with a soft glow (code-drawn textures), leaves a short warm bloom on the ground (colour returns) instead of a scorch; at most 3 flame sprites per attack on Low tier. Sound: soft whoomph plus crackle in the low-mid band, never a hiss that masks hit cues.

### W-A (Recommended) Ember Breath: verb BREATHE
- Fantasy: every ~2 s a fan of warm spirit-fire breathes out toward the thickest group in front of you. Short range, wide, hits everything in the cone, leaves foes burning.
- Magic, tags none (a new "fire" tag would need a new tag soft-cap category; avoid). Colour #ffb35c. Applies the existing **Burn** status (shares tree burn potency).
- Look: a 70-degree cone of 5-7 teardrop flames that bloom outward and fade over 0.6 s; ground bloom behind. At 40 px it reads as a warm wedge in front of the hero. Not a fireball, not a stream.
- Why distinct: a timed, directed, short-range burst. Wolves hunt, Orbit is a constant ring, Bolts and Chain are single-target. First weapon that rewards facing and positioning.
- Stats (sketch; sweeps tune):

  | Stat | Name | Base | per rank | Hint |
  |---|---|---|---|---|
  | power | Heat | 4.2 per tick (4 ticks per breath) | +1.5 | each flick hits harder |
  | area | Reach | 80 px | +12 | breath reaches further and wider |
  | cooldown | Breath | 2.4 s | -0.2 | breathes more often |
  | duration | Smoulder | 1.5 s burn | +0.5 | burn lasts longer (burn tick 25% of Heat) |

  Rough r0 DPS about 7 plus burn about 2, close to a rank-0 Wolf pack. Needs a boss clause like Spirit Bolts (`boss` coefficient) so the cone never misses a big body (lesson from the Orbit donut hole in weapons-review.md).
- Evolutions (3, different pairs, distinct verbs):
  1. **Hearth Gale** (power + area): GALE. The breath becomes a rolling wave of flame that travels outward 220 px, burning all it crosses.
  2. **Slow Burn** (cooldown + duration): LINGER. Each breath leaves standing candle-flames for 3 s; foes crossing them keep burning, and the ground blooms colour.
  3. **Wyrm's Ring** (area + duration): RING. Every third breath is a full 360-degree ring of flame around you; the others stay cones.
- Fit: "spirit-fire you call", not a gun; readable; low coverage (0.6 s of every 2.4 s). Risks: Burn stacking with Orbit builds (shared status cap covers it); cone aim jitter (add 0.3 s aim hysteresis).

### W-B Ember Seeds: verb SOW
- Fantasy: you toss glowing ember seeds at the thickest crowd; each lands and blooms into a candle-flame pillar for 2.5 s.
- Magic, ground-targeted lob (0.5 s flight, arc shadow as the tell), pillar radius 22 ticking Burn.
- Stats: count (Seeds per toss 1, +1), power (Pillar heat 3.4, +1.2 per tick), area (Pillar size 22, +4), cooldown (Sowing 2.8 s, -0.25).
- Evolutions: **Bloom Cascade** (count + power) SPLIT (a pillar sprouts two seeds as it dies); **Lantern Field** (area + cooldown) FIELD (one wide meadow of low flames); **Sunseed** (power + cooldown) CRASH (one huge seed, big blast, long fuse).
- Pros: least heat per hit, strong vs crowds, ground zones fit the "colour returns" look. Cons: pillars overlap into constant fire on screen (cap 4 live pillars); needs a density search; weak vs bosses unless seeds track.

### W-C Cinder Brand: verb BRAND
- Fantasy: you brand the 3 nearest foes with a glowing ember sigil; after 2 s each pops in a soft burst that burns its neighbours, so crowds chain themselves.
- Magic, targeted, delayed. Detonation hits foes within 36 px.
- Stats: count (Brands, base 2, +1), power (Blast 14, +5), area (Blast radius 36, +6), speed (Fuse 2.0 s, -0.2).
- Evolutions: **Chain Pyre** (count + area) CHAIN-REACT (a pop re-brands neighbours once); **Phoenix Mark** (power + speed) REBIRTH (a branded foe that dies leaves a flame that heals you a little, capped); **Judgement Sigil** (power + area) CRUSH (one sigil on the toughest foe, huge blast).
- Pros: smallest visuals, very readable (sigil, then pop). Cons: overlaps Raven Talon Mark and Chain Lightning in "tag then pop" feel; Phoenix heal needs the heal cap; the delay lets fast foes slip.

**Recommendation: W-A Ember Breath.** Clearest new verb, best screen budget (the cone is short and brief), and it makes the dragon fantasy (breath) readable.

## 4. HERO: three options (female dragon-kin + small dragon pet)
Shared: P1 chibi proportions, own code-drawn rig (`src/gfx/` herorig style), own silhouette, accent ember rose-gold #ef8a5a. Pet = ember wyrmling, about 10 px at 640x360, gold-cream belly, tiny wings. Pet follow: spring 26 px behind with 0.15 s lag, gentle bob, perches on her shoulder after 0.8 s still, tail-flick on kills, sleeps in Calm mode; never collides, blocks pickups or is targeted.

### H-A (Recommended) Hybrid: small horns, tail, scale-hide cloak. Ability: Strafing Run (verb STRAFE)
- Identity: **the Hearth-Warden**. Small curled horns, a short tail, ember scale freckles on cheeks and forearms, a hooded scale-hide cloak (like Wren's pelt but overlapping plates, hem ending in a tail-point). Silhouette: pointed hood + thin tail line + pet on the shoulder; reads as a "triangle with a flick".
- Personality: warm, teasing, a little proud; talks to the pet; fire is hospitality ("light the fire, not the fight"). Idle: warms her hands, pet curled round her neck. Move: purposeful stride, tail sways one beat late. Hit: scales flash then settle.
- Pet role: cosmetic follower that is also the ability's body (summon-like only during the ability).
- **Strafing Run** (60 s): the pet swells to drake size, flies 260 px along her heading in 0.7 s and leaves a 2.5 s lane of warm flame (width 36) that burns foes (Burn) and blooms colour. Bosses are hit too. Bounded: one lane per 60 s; damage via the Burn hook and the x1.75 amp cap. Est. ablation +3-4 pts. Risks: visual overlap with Lightfoot trail and Slow Burn (lane is wider and gold, with a launch tell ring).
- Bond/keepsake: **Warm Scale** (a shed scale that never cools); wake hint: kill N Bramble Harts (they burn). Bond perks (keen, quick, wise, warm, bright): Wyrmling's Nose, Hot Feet, Hearth Lore, Banked Embers, Lucky Hoard. Cosmetics: ember tail trail at Bond 5, pet scarf at 10.
- vs Wren: Wren runs away (escape, self); she sends the pet forward (offence, line). vs Elias: moving and aggressive, not still and sheltering.

### H-B Dragon-skin dress: scales as clothing, human face. Ability: Scale Ward (verb HARDEN)
- Identity: a human-looking woman in layered dragon-scale armour with a small spine crest on the hood; no horns. Silhouette: broad plated shoulders and a hanging scale skirt (a fat bell, close to Sister Agnes's planned bell shape).
- Personality: stoic guard, dry, loyal; the pet rides on her pauldron like a cat.
- Pet: nearly cosmetic; curls on her shoulder as armour and glows during the ability.
- Ability: for 5 s the scales lock: damage taken -40% and foes that touch her burn. Est. +2-3 pts. Risks: overlaps Elias's SHELTER verb; invisible power overlaps the HP stat. Weakest verb distinctness.
- Keepsake: Cooled Plate (hint: slay root crawlers).

### H-C Slight features: horns and tail only, civilian dress. Ability: Hatchling's Roar (verb ROAR)
- Identity: a young hearth-keeper in a patched shawl, small horns, a tail tucked under a skirt. Silhouette is round and small, close to Wren (risk: reads as a Wren recolour with horns).
- Personality: shy and curious; the pet is the brave one, perched on her head.
- Ability: instant roar: non-boss foes within 150 px flee for 1.5 s and the pet breathes a short burst. Est. +2-3 pts. Risks: fear overlaps Wall of Wings; weakest dragon read.
- Keepsake: Egg Shell (hint: slay puffback toads).

**Recommendation: H-A.** Clearest offence verb, the pet has a real job without becoming a weapon, distinct silhouette, strong but small dragon read.

### Name suggestions (hero / pet; taste call, not locked)
Heroes: **Tindra** the Hearth-Warden (from tinder; short, cosy), **Sunniva** Embergarth, **Calla** Ashfold. Pet: **Wick** (candle wick; echoes the game name, may confuse), **Smudge**, **Pip**.

## 5. TREE and codex for the recommended pair (W-A + H-A)
### 5.1 Weapon cluster (new `src/data/tree/clusters/ember_breath.json`, prefix `eb`, emblem `flame`)
- Slot: next free sky slot (core.json `skySlots`; verify sky4 or sky5 with `tree-validate.mjs`). New `emblems/flame.json`: a candle-flame outline with slots like `orbit.json`.
- Shape copies `raven_flock.json`: 11 outline nodes (about 7 knots, 2 beads, 1 mastery, 1 socket spot per evolution as in siblings). Knots +2-4%, beads are status potency; every stat node about 1-3%.
- Heart `gt_ember_breath` (gold 200): `all` of clearChapter cursed_forest n 1 AND killEnemy bramble_hart (n set by `gates-pace.mjs`). Theme: the brambles you burned.
- Sockets (hidden recipes as siblings): `gt_hearth_gale` (evolveWeapon any n 2); `gt_slow_burn` (all of evolveWeapon ember_breath n 1 + killEnemy root_crawler 8000); `gt_wyrms_ring` (all of evolveWeapon ember_breath n 3 + bossKill elder_treant n 2).
- Example nodes: eb_power Heat +2%, eb_wick Heat +4%, eb_reach Reach +2%, eb_breath Breath cooldown (cast category), eb_ember Burn potency +3% (status, shared cap), eb_smoulder Smoulder duration, mastery "Hearth Gold".
- Budget: adds one per-weapon pool (`perWeapon.refWeapons` is 5). Run `node scripts/tree-validate.mjs --table`; if combat PE passes the ceiling (base 31, +3 per chapter), trim node sizes or ask Matt to raise the rule. Burn nodes share the single status cap.
### 5.2 Hero (no tree nodes; the tree stays character-agnostic)
- `characters.json` entry: name, blurb, color, kindred `ember_breath` (data only), keepsake {Warm Scale, hint killEnemy bramble_hart n 300, placeholder}, ability {id strafing_run, cooldown 60, dist 260, secs 2.5, width 36, desc}, treeVisuals ["emberTrail"], bondPerks (5). Sim: a branch beside `pelt_dash` and `sanctuary_ring`; the lane is a zone applying Burn through the shared hook.
- Wardrobe cosmetics entry (validated colours). Bond rewards: trail tint 5, pet scarf 10, a bark at 25. The per-hero first-clear Dawnglass bounty applies unchanged.
### 5.3 Codex / Almanac (append-only keys, never reused)
- Spirits page for Ember Breath ("A breath, not a blaze."). Evolution riddles: Gale "The fire learned to walk." Slow Burn "Embers keep a house warm till morning." Ring "A hearth is a circle before it is a fire."
- Hero page plus a pet note ("It was an egg when the valley was green."). Celebrations: new hero = Big; evolution = Medium (within the 1 Big + 3 Medium cap). Tells entry for her lane ("the small one flies ahead").

## 6. Build order (small chunks, one at a time, each fully verified)
Weapon first (heroes are independent of it), then hero. `wip/` branches merged to dev; never main.

| Chunk | What | Done check |
|---|---|---|
| ED0 | Matt's picks (3+3 one-tap), LOCKED rows, record the V1 scope reopen | LOCKED/QUEUE updated |
| EW1 | weapons.json + handler in weapons.js + registrations (CONTENT-GUIDE 1.4) + Burn hook + boss clause + pins | tests, `tests/ember-breath.test.mjs`, stathints, cards |
| EW2 | Art and sound: cone sprites, ground bloom, cue, particle cap, Low tier | shots true size + phone, `wl6-measure.mjs`, `?debug=1` perf at 350 enemies |
| EW3 | Balance: fresh-start win 15-30% with it as starter, no deaths before 5:00, deaths 6-14 min, boss rules | `sweep-all.mjs 24`, `rt-matrix.mjs` start-weapon matrix, `boss-sweep.mjs` (report seeds and noise) |
| EW4-6 | One evolution per chunk (Gale, Slow Burn, Ring) | `evo-home.mjs` 1.8-2.3x, cap 3x, `evo-same-ranks.mjs` never below base, evo tests, evotext, codex |
| EW7 | Tree cluster + emblem + gates + codex | `tree-validate.mjs --table`, `tree-timeline.mjs`, `gates-pace.mjs`, `gates-softcap.mjs`, `gates-ablate.mjs`, hostile-save tests |
| EH1 | characters.json + Strafing Run + ablation | `ability-ablate.mjs` (+2-5 pts, share <= 10%, amp cap), `sweep-all.mjs 24 <hero>`, gap to Wren/Elias <= 3 pts |
| EH2 | Rig, pet follow and animation, portrait script, charcopy, cosmetics | shots 3 sizes, Calm mode, 44 px targets |
| EH3 | Keepsake drop, Bond perks, Almanac page, celebrations, audio cue | chars-save test patterns, hostile-save, `bless-sweep.mjs` sanity |
| EV | Full verify: `npm test`, build, `npm audit`, FIT check, LOCKED/QUEUE | Matt reviews |

Balance gates (CLAUDE.md DoD): no-tree random-pick win 15-30%, deaths spread, evolution band, abilities a modest share, tree inside the soft-cap budget, hero gap small.

## 7. Self-review: LOCKED conflicts and gaps
Conflicts:
1. LOCKED 2026-10-17 V1 SCOPE (no new weapons in v1; roster review after v1): v1 shipped; Matt's request reopens it. Record the reopen.
2. LOCKED NO HERO WEAPON (2026-10-31): `kindred` stays data only; nothing player-visible links hero and weapon. This sheet obeys it (pet and flame share a look only).
3. Test pins (5 weapons, 15 evolutions, 2 heroes): update in the same commit.
4. Tree budget `refWeapons: 5` and the combat ceiling: a sixth cluster may need trimming or Matt's raise. Not decided here.
5. CLAUDE.md/BIBLE rosters (10 heroes) have no dragon-kin: BIBLE needs a hero row and a family (suggest "Emberkin"); this is Matt's addition, not a clash.
6. ABILITY principle: Strafing Run needs measured ablation before lock.

Gaps:
- All numbers are sketches; cone geometry, base DPS and the Burn tick share are untested and need a probe before stats are fixed.
- Burn is currently Orbit-owned; verify in Sim.js that Ember Breath can apply it and that Orbit + Breath builds stay inside the status cap.
- Pet costs an extra rig plus follower sim state; flame particles at 350 enemies need a `pace.mjs` check on Low.
- Wake counts (bramble_hart kills) are placeholders; no drop-rate data yet.
- A fire hero may suggest hero-weapon synergy to players; by LOCKED she gets none.
- Fire read versus the Warm Lantern pool is a screenshot judgement (true size + phone) before lock.

## 8. Not in this sheet
The new map/chapter needs its own three-options sheet (CONTENT-GUIDE section 5 KNOWN LIMIT: make chapter art/arc data-driven first). The new weapon's heart gate could later move to that map.

Right now: Matt picks W and H (and names). Next: ED0, then EW1. Parked: new map sheet.
