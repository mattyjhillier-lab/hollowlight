# 31 - Fire weapons in survivors-likes: verbs, feel, risks, shortlist for Lucinda

Date 2026-11-01. Research only; nothing built. Trigger: Matt rejected "Ember Breath" (short cone of candle-flames) as "doesn't fit the idea of a fire weapon". Coordinator added three Matt-liked concepts (Dragonfire Meteor, Wildfire, Cinder Wyrm); each is evaluated in section 6.
Labels: OFFICIAL = game wiki/dev statement, COMMUNITY = player/guide/forum, OPINION = mine. Patterns only; no art, names or numbers are copied. Web search was standard mode; thin spots are flagged UNVERIFIED.

## 0. Why Ember Breath missed (OPINION)
A cone of small flames is a flamethrower with the power taken out. In the games below, "proper fire" is one of: a big thing that lands and bursts, ground that stays burning, or fire that visibly spreads. A short weak cone does none of these, and a cone also fights our no-aim, summon-first fantasy.

## 1. Verbs fire weapons use, and what players love or complain about
- **Thrown projectile, big pierce.** Vampire Survivors Fire Wand -> Hellfire: slow large meteors, infinite pierce, long cooldown, low amount (OFFICIAL https://vampire.survivors.wiki/w/Hellfire). Fire Wand fires at a RANDOM enemy; ranked low/mid, Hellfire near the top (COMMUNITY https://steamcommunity.com/app/1794680/discussions/0/4944391800273810157, https://destructoid.com/?p=602399). Loved once big, piercing and readable; the complaint is random aim and a weak base.
- **Projectile + explosion.** Diablo 4 Meteor: impact hit then burning ground for a few seconds (COMMUNITY https://pcgamer.com/best-diablo-4-sorcerer-build, https://www.purediablo.com/diablo4/Sorcerer_Pyromancy_Skills). Hades II Hestia cast is described as an exploding fireball (UNVERIFIED, sources disagree: https://steamcommunity.com/app/1145350/discussions/0/4358998752035093467). The classic "this is fire" beat: wind-up, impact, flash, lingering remainder.
- **Ground fire / area denial.** VS Santa Water -> La Borra: bottles shatter into flame puddles that creep toward you and grow (OFFICIAL https://vampire.survivors.wiki/w/La_Borra); Santa Water base called weak, La Borra "one of the best" (COMMUNITY https://primagames.com/gaming/the-10-worst-weapons-in-vampire-survivors). Diablo Firewall burns about 8s (COMMUNITY purediablo link). Soulstone Fire Walk trail (COMMUNITY https://soulstone-survivors.fandom.com/wiki/Lasting). Loved; weak when puddles are small or infrequent; per-puddle hit limit about every 0.5s (OFFICIAL La Borra page). Safest high-value verb against chasing crowds.
- **Flamethrower / cone.** Brotato flamethrower praised for fast hits but burn on melee fire is thin (COMMUNITY https://steamcommunity.com/app/1942280/discussions/0/3364776031337549283/?l=latam). 20 Minutes Till Dawn Flame Cannon: tiny direct damage, Burn does the work (COMMUNITY https://20minutestilldawn.wiki.gg/wiki/Flame_Cannon). HoloCure Dragon Fire: rapid narrow fireballs, player-aimed (COMMUNITY https://holocure.wiki.gg/wiki/Dragon_Fire). Works in aimed/shooter games; in auto-fire games range is the complaint. This is Ember Breath's family: poor fit for us.
- **Spreading burn.** Brotato Snake: burn spreads to nearby un-burning enemies with a shared spread counter (OFFICIAL https://brotato.wiki.spellsandguns.com/Snake). Soulstone Pyromancer: aura applies Burn every 0.5s, Heat Explosion detonates Burn stacks (COMMUNITY Soulstone link). Burn builds are a loved "melt the horde" archetype in Soulstone and Halls of Torment (COMMUNITY https://www.pocketgamer.com/halls-of-torment/best-builds). Most fire-like behaviour per effect; the risk is balance (section 3).
- **Orbiting flames.** Spirit Hunters: Infinite Horde has an "Orbital Fire", a circling orange ball you start with (COMMUNITY review https://buried-treasure.org/2022/08/spirit-hunters-infinite-horde/; the full roster is UNVERIFIED, no wiki found). Common, safe, generic. TAKEN by our Holy Orbit.
- **Fire familiar / summon.** Diablo 4 Hydra: three-headed fire-spitting summon, one at a time (COMMUNITY purediablo link). Survivor.io Dragon pet periodically summons fireballs (COMMUNITY https://api.copychief.com/survivor-io-best-pets/). Liked as "fire with personality"; fits our summon-only rule.
- **Brand / detonate.** Soulstone Heat Explosion; Hades II Scorch/Ignite combos (COMMUNITY, low-quality sources). Loved by min-maxers; the two-step is harder to read.

Pattern (OPINION): loved fire weapons are large, slow or lingering and visible, with a payoff beat. Complained-about ones are small, random, or only work after investment.

## 2. What makes fire READ as fire and feel powerful
- Burn as a visible state, not just a number: enemies keep burning after the hit (Diablo Firebolt burning DoT; 20MTD Flame Cannon relies on Burn). COMMUNITY links above.
- Wind-up, impact beat, lingering remainder (Meteor: hit, then ground burns about 3s). COMMUNITY.
- Ground persistence is the fire feel in VS: puddles that stay, grow and stack (OFFICIAL La Borra page).
- Generic game-feel sources: sound carries presence ("warmer with soft crackling"), screen shake, trails, scale pops (COMMUNITY https://www.gameanalytics.com/blog/squeezing-more-juice-out-of-your-game-design, https://itch.io/blog/1063213/satisfying-player-feedback-with-vfx-and-sound). Critics warn exaggerated juice homogenises games (https://www.wayline.io/blog/the-juice-problem-how-exaggerated-feedback-is-harming-game-design).
- UNVERIFIED: no source found for fire-specific VFX craft. The next list is OPINION for our engine: (1) white-yellow core to orange to deep red edge, (2) irregular upward flicker, never a fixed sprite, (3) rising embers, (4) a warm light pool on the ground (matches our lantern language), (5) sound: low whoomp on launch, crunchy crackle on impact, soft looping crackle for lingering fire, (6) a brief flash and tiny screen punch on the big hit only.

## 3. Common problems
- Clutter: overlapping puddles and particles hide enemies and player; VS needs Area/Duration investment before La Borra forms a ring (OFFICIAL La Borra page). Cap live zones.
- DoT stacking confusion: Brotato players report burn does not stack on one target, strongest wins (COMMUNITY, hedged and unverified: https://steamcommunity.com/app/1942280/discussions/0/3488628040290756118); Darktide devs say burn from different weapons shares and adds stacks (COMMUNITY https://devtrackers.gg/darktide/p/7fce253f-infernus-blessing-burn-stack-inconsistencies). Unclear stacking confuses players. Brotato's shared spread counter bounds runaway chains.
- Balance traps: weak base with strong evolution (Santa Water, Fire Wand) feels bad early; burn builds in Soulstone/Halls of Torment snowball through damage-type conversion and multiplicative burn chance (COMMUNITY). Per-target hit limits are the usual bound.
- Random aim feels unreliable (Fire Wand). Aim at densest crowd or nearest, not random.
- Phone heat/perf: UNVERIFIED, no source found. OPINION: additive blending and particle counts cost most on phones; pool sprites, cap simultaneous fire zones (about 4-6), use a few large textured flames instead of hundreds of particles.
- Fire that hurts the player or scorches the world fights our identity (section 5).

## 4. Dragon heroes and pet dragons
Sources are thin; most is UNVERIFIED. Found:
- Black Dragon Mage (survivors-like, Early Access): hatch your own dragon from an egg and ride it (COMMUNITY press release https://www.gamedeveloper.com/press-release/slay-demon-hordes-in-black-dragon-mage-on-steam-challenging-you-to-survive-an-action-packed-roguelike-shooter).
- Survivor.io Dragon pet: periodic fireball summon, valued as powerful and versatile (COMMUNITY copychief link above).
- OPINION patterns that make dragon kits work: (a) the dragon is a visible character that acts on its own, so the hero's fire feels shared; (b) the pet adds a verb the hero lacks (reach, spread, ignite) rather than duplicating damage; (c) breath is the pet's signature but the hero needs a bigger cast to be the star; (d) pet and weapon share one fire palette and a clear "who did that" read.

## 5. Which verbs are free for us, and fit
Taken: Wolves hunt, Ravens, Spirit Bolts (homing glyph orbs), Chain Lightning, Holy Orbit (orbiting lights). Burn status exists (shared potency cap). So orbiting flames and homing fire bolts are out; cones are out by Matt's reaction.
Free and distinct: lobbed arc + burst + ground fire; spreading ground patch; long-looping serpent summon; detonate; trail.
Identity filter (docs/IDENTITY.md, CLAUDE.md): warm lantern fire that restores colour, never scorching the world, low coverage for phones. OPINION: golden-amber with a lantern glow; burning ground should look like a hearth pool that warms the grey Hollow (colour blooms where it burns), not char or scorch marks; cap zones; no friendly damage.

## 6. Ranked shortlist (Matt's three evaluated explicitly)

### 1. Dragonfire Meteor (Matt's idea 1) - lobbed fireball + burst + burning ground. RECOMMENDED
Verb: big blazing fireballs crash into the thickest crowd, burst, leave burning ground for a few seconds.
Comparable: Hellfire big slow meteors that pierce (OFFICIAL); Diablo Meteor impact then ground burn about 3s (COMMUNITY). Loved: big, visible impact. Complained: Fire Wand random aim, long cooldown with low count.
Why proper fire: arc wind-up, impact flash, lingering pool, every beat from section 2. Target the densest cluster via the spatial grid, not random.
Fit: amber lantern burst, ground flame blooms colour back. Pet: Ophimber could be a second thrower or a glowing marker over the target.
Risks: pool clutter (cap 4-6 live, 0.5s hit interval per pool); readable on phone; Burn goes through the shared potency cap; long cooldown feels slow early, so use smaller, more frequent balls at low ranks.

### 2. Wildfire (Matt's idea 2) - ground flames that spread foe to foe and grow
Comparable: Brotato Snake spread with a shared counter (OFFICIAL); Soulstone aura and Fire Walk (COMMUNITY). Loved as an archetype because it behaves like real fire: it grows, jumps, feels alive.
Risks: highest balance risk (snowball, chain runaway), clutter, unclear burn stacking, perf, and touches the Burn sim. Needs hard caps: max spreads per patch, max live flames, spread fades out. Most identity-sensitive: a spreading blaze can read as scorching the world unless it blooms colour.
Pet: Ophimber seeds the first patch or carries fire between patches.

### 3. Cinder Wyrm (Matt's idea 3) - flaming serpent spirit looping through the crowd
Comparable: Hydra fire summon, one at a time (COMMUNITY); Survivor.io dragon pet (COMMUNITY); path-of-fire like Soulstone Fire Walk. Summons with personality are liked.
Why proper fire: a long glowing body trailing sparks reads strongly, is dragon-shaped, and is a summon (fits our rule).
Risks: sibling of Ophimber (role and look overlap; make the wyrm a flame spirit, the pet a small creature); loops resemble Wolves/Ravens motion unless large, slow and arcing; coverage if too long. One at a time limits clutter.
Pet: strong family fit but must differ: Ophimber stays small and personal, the Wyrm is the big ancestor spirit.

### 4. Lantern Burst (new) - mark then pop
Her fire plants glowing sparks on enemies; a second beat pops all marks in a bright burst (Soulstone Heat Explosion, COMMUNITY). Builds on existing Burn and gives a satisfying pop. Risk: two-step is harder to read; best as an evolution of #1 or #3, not a base weapon.

### 5. Ember Trail (new) - fire in her wake
A ribbon of flame left behind her path (Soulstone Fire Walk, COMMUNITY). Matches our glowing-trails identity. Risk: overlaps Light Trails (phantom_stampede) and rewards only movement; likely redundant.

## 7. Recommendation
1. Build Dragonfire Meteor as the base weapon: biggest "this is fire" payoff, easiest to read, proven with a lingering remainder, and it directly answers Matt's complaint (big, not small).
2. Use Wildfire as an evolution of Meteor's ground fire (spread capped via the shared potency cap), not a base weapon, because of its balance risk.
3. Use Cinder Wyrm as the dragon-fantasy payoff: a second Meteor evolution or the pet's super-form, so the wyrm and Ophimber relate without duplicating.
The actual pick is Matt's via the three-options format; this doc is input only. Before design: confirm in the sim that the Burn potency cap supports ground fire plus spread, and test zone/particle caps on a real phone (no source found on phone heat).

Source gaps: Spirit Hunters roster, Halls of Torment weapon verbs, Magic Survival fire entries, Megabonk/Death Must Die, Hades II cast details, and phone-performance evidence were not verifiable in this pass.
