# 23 - Hero abilities, summons and evolutions: research and design framework

Purpose: input for the heroes/abilities/summons/evolutions workshop. Research first, so the design is the best fit.
Date checked for all web items: 2026-10-14. Labels: OFFICIAL (dev/wiki page maintained by game), DATAMINED, COMMUNITY (wiki/forum/guide), OPINION (mine or a reviewer's), PROJECT (our own files/probes), UNVERIFIED (not confirmed; do not build on it).
Rule used for evidence: web search quality was poor (many scraped mirrors; Wowpedia/PoE wiki blocked by bot protection). Anything from a scraped mirror was dropped. Numbers below are only those read from a game wiki page or from our own probes.

## 0. Read first (project context, PROJECT)
- Heroes today (`characters.json`): Wren (60 HP, +10% move, Ghost Wolves, Pack Howl 60 s cd / 6 s) and Elias (110 HP, +15% holy, Holy Orbit, Sanctuary 60 s / 6 s). Both abilities are "6 s of a buff or zone".
- BIBLE has 10 heroes with a proposed active each: Wren Pack Howl, Elias Sanctuary, Mara Black Sky (blind), Isolde Recitation (spiral volley), Thomas Lamplight Hour (slow bubble + colour), Gideon Open Ground (grave ring), Vane Stormcall (strike tower), Agnes Still Hour (freeze 2 s), Kael Reassemble (armour), Hollow One Unmake (absorb corruption). Role families: Beastcallers, Lightbearers, Stormcasters, Deathspeakers.
- Wren v2 approved (ART-DECISIONS 2026-10-14): Pelt Walker (alpha wolf-pelt hood, shadowed face with amber glints, amber paw stitches, ember lantern on a thread) plus ghost wolf pup at her heel. Open idea: pup shows Ghost Wolves rank visually only.
- IDENTITY: The Hollow (colour returns, spirit-painted trails, creeping corruption). Gold reserved for evolutions. Gameplay links to the life map need Matt's OK.
- File 18 findings that shape this doc: only Wolves (and Dive Bombers) behave as real summons; Raven Flock and Holy Orbit are the same ring code; orbit "donut hole"; Pack Howl is about 3.7x wolf DPS (not 2x); Soul Lance and Howling Legion and Pouncing Pack are the weakest evolutions; recipes are invisible; Murder Storm was an invulnerable wall.
- File 22 (skim): option-based progression with gates; keep unlocks sideways (options, not raw power); gate types catalogue in its section 8.

## 1. Hero actives in the genre

### 1.1 What the games do
| Game | Hero active? | What is known (source, label) |
|---|---|---|
| Vampire Survivors | No active button. Identity = starting weapon + passive stat growth (+ a few unique mechanics). | Characters are defined by a start weapon and bonuses; base-game characters can "morph" at level 80 with a relic, evolving the start weapon automatically (vampire.survivors.wiki/w/Evolution, COMMUNITY wiki). Hidden character Smith IV starts with a union weapon (Vandalier) (vampire.survivors.wiki/w/Vandalier via search, COMMUNITY). |
| HoloCure | Yes: one Special Attack per character, long cooldown, fixed (not levelled). | Gawr Gura: Shark Call, 45 s cooldown, a shark hits nearby targets for 500% damage (hit gap 0.17 s), then a 15 s red state with +50% ATK and +25% SPD. So about 33% uptime of a buff plus a burst. Identity tie: shark / Atlantis lore reused in her weapon (Trident Thrust), skill (Power of Atlantis) and special (holocure.wiki.gg/wiki/Gawr_Gura, COMMUNITY wiki, version 0.7.1746645739). Other specials seen by name only: Calliope "The Reaper", Sana "Become Beeg", Moona "Moon Goddess", Roboco "Hi-Spec Mode", Mumei "True Horror", Aki "Shallys", Korone "Ending Making Time!", AZKi "Geo Queen" (holocure.wiki.gg search results, COMMUNITY). Cooldowns for these: UNVERIFIED. |
| Brotato | No active. Identity = stat trade-offs + weapon restrictions + a unique mechanic. | Characters have bonuses and penalties, some restrict weapons or start with specific kit. Engineer: bonus Engineering, less damage, structures placed closer. Ranger: extra range, ranged-only, less max HP. Mage: boosted elemental, heavily reduced melee/ranged (brotato.wiki.spellsandguns.com/Characters, COMMUNITY wiki). |
| Spirit Hunters: Infinite Horde | Yes: 8 heroes, each with passive skills plus one hero ability; 14 base abilities with 2 modifiers each; 20+ pets with unique buffs/behaviour (store/review text via search, COMMUNITY/OFFICIAL store copy). | Per-hero ability numbers: UNVERIFIED (the TheGamer ranking page 404'd). One player says an early XP pet and a digger pet (every 10 s) are good picks (Steam forum, OPINION). Pets are an extra slot system, not part of the hero. |
| Halls of Torment | No active. Warlock = Summoner class; main weapon is a summoned unit that homes, has a limited life; "(Summons)" traits boost summons; Duration extends summon life (primagames / number13 guide, COMMUNITY). Special-ability cooldowns: UNVERIFIED (none found). |
| Soulstone Survivors | Summoner archetype exists. Forum advice: take several summon types, plus a "re-summon" effect that can double or triple minions ("swarm mode"), plus global minion buffs (Bloodlust/Might) (Steam threads 2022-2024, OPINION). Official numbers: UNVERIFIED. |
| Death Must Die | Classes: Knight, Sorceress, Assassin, Barbarian, Warrior, unlockable Reaper and Valkyrie; gods give boons with passives, actives and synergies (commonsensegamer / primagames, COMMUNITY, low quality). Per-class active detail: UNVERIFIED. |
| Hades | Weapons have Aspects (3 per weapon plus base) that change one verb each; Supergiant move ideas between boons and Aspects when tuning, and cut ideas that do not serve the whole (Kasavin, Hades II interview via search summary, OFFICIAL-ish, secondhand). Duo boons need one boon from each of two gods and are never guaranteed (guides, COMMUNITY). |
| Dead Cells / Slay the Spire | Not researched (no usable sources returned). Recalled genre knowledge only: StS classes differ by a starting relic + card pool; Dead Cells has no classes (OPINION, UNVERIFIED). |
| Survivor.io, 20 Minutes Till Dawn | Not found within budget. UNVERIFIED. |

### 1.2 Active-ability archetypes (OPINION, synthesised from the above and file 18)
| Archetype | Typical shape | Genre example | Risk |
|---|---|---|---|
| Burst nuke | one big hit, long cd (30-60 s) | Shark Call 500% hit | Becomes "the panic button" only; fine if bounded |
| Self buff window | 5-15 s of stat boost | Shark Call red state (+50% ATK) | Dominates if uptime above ~35% |
| Summon command | order the pack: gather, focus, rush | Pack Howl (ours) | Needs summons that obey; only wolves do now |
| Zone | placed area that heals/damages/slows | Sanctuary | Standing-still incentive; fine if zone is small |
| Dash / reposition | short invuln move | common in action roguelites (not sourced here) | Trivialises kiting if cd short |
| Shield / invuln | block N damage or 2 s | - | Mandatory pick; hard to balance on mobile |
| Revive | one extra life, per-run | Tree already has revive | Do not also put it on a button |
| Utility / control | freeze, blind, pull, fear | Still Hour (BIBLE) | Fear/freeze on bosses breaks fights (file 18 B2) |

### 1.3 Cooldown and power share (numbers where we have them)
- HoloCure Shark Call: 45 s cd, 15 s buff = 33% uptime; buff worth +50% ATK so avg +17% damage from the buff, plus the burst. Reference point only (COMMUNITY).
- Ours today: Pack Howl 60 s cd, 6 s = 10% uptime. At 3.7x wolf DPS (file 18, PROJECT) that is about +27% average wolf DPS, wolves being only one weapon of up to six, so well under 15% of total damage. Sanctuary same cd; healing barely works (B1 is about Halo, Sanctuary zone is separate and untested here).
- Working target for us (OPINION): an active should add at most 15-20% of average total damage OR roughly one "free" emergency per 60 s, never both. Cooldown 40-75 s; effect window 5-8 s; uptime below 15%. Burst is allowed to feel huge because uptime is small.

### 1.4 Identity: what makes one memorable vs generic (OPINION, grounded in Gura example and our BIBLE)
- Memorable: the ability reuses the hero's prop, silhouette and weapon verb (Gura's shark theme everywhere; Elias plants his candle wheel; Isolde's book fires every page). The 40 px tell and the active are the same object.
- Generic: a stat window with a coloured aura ("+X% for Y s") that any hero could own. Test: swap the hero's name; if the ability still reads, it is generic.
- Personality shows in the animation of the cast (wind-up, hold, release) more than in numbers.
- Pitfalls: (1) mandatory pick: one hero's active is so strong all runs pick them; (2) game-breaking: freeze/fear on bosses, stacking with the tree; (3) redundancy: five heroes with "buff window"; (4) ability that only works with the start weapon (Pack Howl wolves-only) so a hero with a swapped loadout feels cheated.

## 2. Summon design

### 2.1 Sourced facts
| Fact | Source / label |
|---|---|
| Brotato engineering structures: stationary, scale with Engineering. Turret 10 dmg (+80% of Engineering) every ~0.73 s; Laser Turret 20 piercing (+125%); Explosive 25 area (+150%); Medical heals 3 HP (+5%) every ~2.2 s; Landmine 10 area (+100%), placed every 12 s; shot rate randomised 70-130%. Turrets scale only with Engineering plus secondary stats. | brotato.wiki.spellsandguns.com/Engineering, COMMUNITY wiki. A summoner build there is a dedicated stat commitment. |
| Halls of Torment summons have a life timer; Duration extends it; "(Summons)" traits buff only summons. | primagames / number13 guides, COMMUNITY |
| Soulstone: re-summon effects and global minion buffs are what players value; mixing summon types works. | Steam forums, OPINION |
| Spirit Hunters pets are a separate collectible slot with unique behaviours. | store/review text, COMMUNITY |
| Path of Exile / Diablo 4 minion mechanics (follow, leash, resurrect, command skills): pages blocked or irrelevant. | UNVERIFIED. Do not cite numbers. |

### 2.2 What makes a true summon vs a projectile or orbit (OPINION; supported by file 18 section 3)
| Property | Projectile / orbit | True summon |
|---|---|---|
| Chooses target | no (nearest at fire time) | yes, with a rule other summons respect (claim sets) |
| Persistent identity | no | yes: 1 wolf stays "that wolf" |
| Idle behaviour | none | returns to heel, sits, looks back, reacts |
| Reacts to hero | no | to ability, damage taken, level-up, stillness |
| Visible state | none | hunting / chasing / attacking / returning |
| Can fail visibly | no | can be staggered, lost, late |

Our wolves already tick most boxes; Raven Flock ticks none (file 18).

### 2.3 Making orbits and bolts feel like spirits (cheap, mostly visual/behavioural)
| Technique | Applies to | Cost | Risk |
|---|---|---|---|
| Spirit "breathing": orbit radius pulses 50-100% (also fixes donut hole, file 18 D8) | Holy Orbit, Ravens | S | none |
| Swoop-peck: enters range, dips at target, returns (light Dive Bombers) | Ravens base | M | changes feel; retune Murder Storm |
| Idle poses: orbs sit back in the chandelier sockets when no enemy (BIBLE) | Holy Orbit | S visual | none |
| Reaction: orbs flare when hero is hit; wolves bristle and howl on ability | all | S visual | none |
| Target claiming: second raven/bolt picks next target | Ravens, Bolts | S | none |
| Signature trail in hero's accent colour painted onto life map | all | S-M | needs life map |
| Names or small personalities (Wren's pup flicks ears, chases the first wolf) | pup, wolves | S visual | none |
| Summons "returning" to the hero as ability command (Rally) | all summons | M | per-ability code |
| Staggered, not killed, by boss slams (file 18 D4) | summons | S-M | readability |

### 2.4 Commanding a team (OPINION)
Commands that work for a survivors-like with no extra buttons: (1) the hero active is the only command, so give it a summon verb (Rally, Focus, Guard, Surge); (2) auto "stance" by movement (still = guard, moving = hunt); (3) a visible leash/heel line (Wren's amber threads already do this). Do NOT add per-summon micromanagement on mobile. Keep summons invulnerable or stagger-only (file 18; babysitting is a chore).

## 3. Magic weapons and evolutions

### 3.1 Vampire Survivors rules (COMMUNITY wiki, vampire.survivors.wiki/w/Evolution, partly read: first 100k of 173k chars)
- Evolution needs the base weapon at max level plus its paired passive held; some recipes require that passive at max level, and the needed level varies per recipe.
- Exceptions: Bracelet, Bi-Bracelet, some unions need no passive. Unions need all base weapons at max level (a passive may also be required). A union consumes all components and takes one slot, freeing slots.
- Triggered by opening a Treasure Chest with an evolution reward (normally from bosses at 10:00+; some stages allow it earlier). The evolved weapon replaces the first random upgrade, if not banished. Usually one per chest; some stages up to 3-5.
- Base weapon is removed, passive stays. "Gifts" add an item without removing the base.
- Examples: Whip + Hollow Heart = Bloody Tear; Magic Wand + Empty Tome = Holy Wand; Garlic + Pummarola = Soul Eater; Lightning Ring + Duplicator = Thunder Loop; Peachone + Ebony Wings (union) = Vandalier.
- Vandalier: two zones revolving opposite directions around the player; slightly lower base damage/amount than the parts, higher projectile speed and pool limit (vampire.survivors.wiki/w/Vandalier via search, COMMUNITY). Shows an evolution can trade raw numbers for a new shape.
- Arcanas: up to three per run, a special boss at 11:00 drops an Arcana chest, unlocked by level-50 characters or 31:00 survival (vampire.survivors.wiki/w/Arcana, COMMUNITY).
- Important lesson for us: VS evolution is gated by TIME (chest after boss) AND by two items, so discoverability is by trying; recipes are community knowledge. Our system gates by stat ranks and has no chest.

### 3.2 HoloCure collabs (holocure.wiki.gg/wiki/Collabs, COMMUNITY)
- Merge two max-level basic weapons with a valid pair using a Golden Anvil; start weapons cannot be used.
- Anvil drops only once two weapons with a valid collab are level 7+; base drop 1/100, +1/2000 per minute; only one anvil at a time.
- Both parts consumed; a collab counts as max-level; can hold up to two enchantments (inherits both); with 5 slots, max 4 collabs.
- Examples: Blood Lust (Owl Dagger + Psycho Axe), Lightning Wiener (Plug Type Asacoco + Sausage), Snow Flower Sake (Glowstick + Wamy Water; 30% freeze chance). General collab damage multiple: not published (UNVERIFIED).

### 3.3 Brotato tiers (brotato.wiki.spellsandguns.com/Weapons, COMMUNITY)
Higher tier raises base damage, scaling and special strength. Knife base damage goes 9 (T1) to 25 (T4), crit multiplier 2.5x to 4x, i.e. about 2.8x base damage over 3 merges, more once scaling counts. Two identical weapons of the same tier merge to the next tier. Set bonuses: UNVERIFIED (page truncated).

### 3.4 Others
- Spirit Hunters evolution paths: UNVERIFIED (not found).
- Hades: Aspects change one verb of a weapon, duo boons require two gods. Pattern, not numbers (COMMUNITY).

### 3.5 Patterns that change the VERB (OPINION, supported by file 18 audit)
Best in our own data: Dive Bombers (hitbox ring becomes hunters), Spirit Tempest (steady homing becomes burst + explosion, 1.5-2.05x), Dire Alpha (pack becomes one cleaver). Worst: Howling Legion (more of the same), Soul Lance in a horde (84% overkill), Pouncing Pack (verb rarely fires).
Verb families that read in one second: Burst (all at once), Hunt (seeks a target), Field (ground zone), Wall (blocks/pushes), Cleave (one big arc), Chain, Pin (holds one target), Return (comes back after impact).

### 3.6 Power multiples
- Our target (08/file 18): 1.8-2.3x of the maxed base, cap 3x. Probe results are spread 0.38x to 13x (file 18 section 2), so the target is not yet met by 8 of 11.
- External: Brotato T1 to T4 about 2.8x base damage (COMMUNITY). VS Vandalier is deliberately slightly lower base damage than the parts (COMMUNITY). HoloCure collab multiple: UNVERIFIED.

### 3.7 Discoverability and readability
- VS: hint is "max the weapon and hold the item"; community wiki supplies the rest. HoloCure: the anvil drop tells you a collab exists. Hades: the boon menu only offers duos once prerequisites are met (COMMUNITY).
- Ours: pips only; `evoHints` unused (file 18 B7, D2). Random picker evolves at level 42, focused at 19.
- Readability rules: one evolution per weapon (already), one signature shape per evolution, gold rim only for evolutions, do not let two evolutions share a screen-fill pattern (e.g. Murder Storm and Spirit Tempest both fill the screen with points).

## 4. Chapter/stage power-ups and pickups (short, for a later step)
| Pattern | Source / label |
|---|---|
| Stage-specific pickups and chest rules: VS lets some stages evolve early or give more chests; stage content (chest tiers) differs per map (vampire.survivors.wiki/w/Evolution, COMMUNITY). | sourced |
| Unique weapon per stage unlock/start: VS Moonspell DLC and others gate weapons by stage achievements (RogueRanker via search, COMMUNITY, partial). | partial |
| Hazards and stage mechanics per map in HoloCure (stage-specific modifiers): not verified (UNVERIFIED). | - |
| Our fit (OPINION): each chapter gets one signature pickup that reads as a Hollow idea (e.g. Ch1 "Pack Spark": a pale spark from a hollowed wolf adds a temporary extra wolf), one hazard (creeping corruption zone), and one stage-only gate for an evolution/option. Pickup power bounded to 60-90 s and ~10% effect. |

## 5. Design framework for Hollowlight

### 5.1 Ability checklist (every active must pass all)
| # | Check | Pass rule |
|---|---|---|
| 1 | Verb | One sentence, one verb: "Wren calls the pack to one target". |
| 2 | Identity tie | Uses the hero's prop/silhouette/weapon; fails the "swap the name" test if generic. |
| 3 | Fits the hero | Role family, personality (BIBLE), start weapon. |
| 4 | Bounded power | Adds at most 15-20% avg total damage OR a single bounded survival effect; measured by ablation (section 6). |
| 5 | Cooldown/uptime | cd 40-75 s, window 5-8 s, uptime below 15%; no refresh on kill unless capped. |
| 6 | Counterplay/readability | Player sees start, duration, end (visible ring, sound, UI timer). No effect that hides the screen. |
| 7 | Boss rule | No fear/freeze/pin lock on bosses beyond a short bounded stagger; boss TTK change below 25%. |
| 8 | Works with any loadout | Reasonable (even if smaller) with a non-start weapon. |
| 9 | Mobile clarity | One tap, one big visual, no hold or aim; readable at 40 px and at 60 fps on a phone. |
| 10 | Style v1 hook | Accent colour only on one prop; Hollow link (colour/life) at cast; gold untouched. |
| 11 | Stacks safely | No multiplicative stacking with tree/pack buffs; use max, not product (file 18 B4). |
| 12 | Not mandatory | Run win rate with ability off is within 5 points. |

### 5.2 Wren's active: three options (fit: Pelt Walker, ghost wolf pup, ember lantern, Ghost Wolves)
Bounded-power estimate approach: measure Wren-only runs with and without the ability; compute average DPS uplift = uptime x (burst multiple - 1) on the wolves; compare to total run damage. Today Pack Howl is about +27% wolf DPS at 10% uptime (derived from file 18's 3.7x), so wolves-only; the share of total is lower if other weapons are held.

| Option | What it does | Pros | Cons | Power estimate |
|---|---|---|---|---|
| A. Pack Howl, retuned (Rally the Pack) | Keep the howl but make it a command: all wolves converge on and pin the toughest enemy for 6 s, then flare; the pup howls with the lantern flaring amber. Fear removed or limited to non-bosses. | Smallest change; matches BIBLE art; fixes B3 text mismatch; reuses wolf AI | Wolves only; needs Rally code | burst: +50-80% wolf DPS in window; avg +5-8% wolf DPS; share well under 15% |
| B. Lantern Call (ember-lantern mark) | Her ember lantern flares and drops a "den" ember on the ground for 8 s; wolves and summons gather there, deal +25% and enemies in the ember circle get slowed 20%; leaves a patch of restored colour (Hollow link). | Fits Hollow identity (colour returns); works with all summons (rally to the ember); the lantern is on her design | A zone encourages standing; needs life-map hooks (parked) | avg +4% total damage at 12% uptime; slow capped at 20% |
| C. Pup Spirit-Walk (pelt dash) | She wraps in the pelt and dashes 120 px with the pup, leaving 3 s of ghost-wolf afterimages that bite; 0.4 s invuln. | Pelt Walker fantasy, mobile-friendly, distinct from Elias; reposition archetype | Dash trivialises kiting; invuln needs strict cap (cd 20 s?); invuln stack with tree revive/regen | needs probe; start cd 30 s, invuln 0.3 s, afterimages 0.3x bite; keep below 8% survival uplift |

Recommendation (OPINION): A as the base (Rally the Pack), with B's ember visual as flavour; C as an unlockable second option via the gates system (fits "options, not just power").

### 5.3 Ten hero-ability ideas matched to weapon pairings (avoid sameness)
Each has a distinct verb family (rally, mark, ground, freeze, absorb, heal, volley, strike, armour, summon-more). Starting numbers are for probes, not final.

| Weapon / hero | Ability | Verb | Window / cd | Notes and limits |
|---|---|---|---|---|
| Ghost Wolves / Wren | Rally the Pack | Command: converge and pin toughest | 6 s / 60 s | Boss: wolves attack but no pin; bounded +50% wolf dmg |
| Holy Orbit / Elias | Sanctuary: Candle Wheel | Ground: plant the wheel, small ring blooms colour, heals while inside, orbs lock into the ring | 6 s / 60 s | Fix zone size (r about 80 px); heal 1.5 HP/s; avoid standing meta by slow 15%? no; keep damage low |
| Raven Flock / Mara | Dead Letters | Mark: letters strike marked enemy, ravens deliver 3 big pecks | 5 s / 50 s | Replaces Black Sky blind (blind on bosses = lock) |
| Spirit Bolts / Isolde | Recitation | Volley: spiral of N pages, each homes on a different target | instant / 55 s | One cast; cap at 1.5x one Tempest burst; no boss immunity |
| Lantern Wisps / Thomas | Lamplight Hour | Zone: lantern swells; wisps spread out, colour restored, enemies in it slowed 25% | 8 s / 70 s | Slow below 30%; no boss hard-CC |
| Grave Hand / Gideon | Open Ground | Ring: graves crack; hands erupt once then hold 1.5 s | 1.5 s / 45 s | Single big stagger, boss gets stagger only; ring radius 90 px |
| Chain Lightning / Vane | Stormcall | Placed tower: copper rod strikes nearest 2 per s for 6 s | 6 s / 60 s | Rod is a visible target; weak vs boss (cap 3 hits on boss) |
| Frost Bell / Agnes | Still Hour | Control: one toll slows all on screen 60% for 2.5 s (not freeze) | 2.5 s / 70 s | Slow, not stop; boss ignores 50% of it; avoid the "nothing moves" screenshot problem |
| Bone Servant / Kael | Reassemble | Armour: servant folds around Kael, shared damage reduction 30%, servant cannot attack | 6 s / 65 s | Tradeoff: loses servant DPS; prevents mandatory pick |
| Soul Harvest / Hollow One | Unmake | Absorb: sucks enemies within 140 px toward them, then releases a pulse proportional to hits taken | 4 s / 70 s | Grey life-map trail (identity); pulse capped at 2x one wave; hero is high risk by design |

Sameness check: no two share a verb family; only Wren and Kael touch summons. If the workshop wants more "command" heroes, give Mara a rally of ravens rather than a mark.

### 5.4 Archetype catalogue (pick 1 per hero, at most 2 heroes per archetype)
Command / rally (Wren, Mara), Zone (Elias, Thomas, Gideon), Volley (Isolde), Placed turret (Vane), Slow control (Agnes), Armour/trade (Kael), Absorb/pulse (Hollow One). Dash and revive stay as options (unlocks), not defaults.

### 5.5 Evolution design template
| Field | Rule |
|---|---|
| Verb | Must name a new verb from the family list (3.5); "more of the same" is a fail. |
| Signature look | One silhouette in the parent colour plus a thin gold rim; readable at 40 px; no two evolutions share the screen shape. |
| Power | 1.8-2.3x maxed base in the weapon's intended scenario (single and swarm and kite measured); cap 3x in any one; never below 1.0x in any scenario (Soul Lance fail). |
| Cost | pair of stats at max, plus a gate (below). Dead stats after evolving must be re-purposed (file 18 D6). |
| Boss rule | No hard lock; fear/pin/freeze short or stagger-only. |
| Gate type | Pick one: A. Stat pair (current); B. Item/relic found in chapter (like VS passive); C. Event gate: kills/time/hero-specific; D. Hero synergy (e.g. Wren + wolves gets Pouncing Pack easier); E. Chapter pickup (stage-only). Keep a visible hint (gold edge on the second pair card, "Something stirs") per file 18 D2. |
| Memorability | One "wow" moment within 3 seconds of unlock (Dire Alpha scale, Tempest burst). |
| Anti-overlap | Max one Field, one Wall, one Cleave, etc. per run; sibling evolutions of the same weapon use different verb families. |

### 5.6 Things not to do
- Do not make the ability a generic "+X% for Y s" buff with an aura.
- Do not let CC (fear, freeze, blind) work on bosses (file 18 B2 shows how it breaks fights).
- Do not add a dash or invuln without a cooldown floor and a probe; avoid stacking invuln with revive and regen.
- Do not give any hero a mandatory active (win rate off within 5 points).
- Do not make evolutions only bigger numbers (Howling Legion pattern).
- Do not leave dead stats after evolving; do not hide the evolution rule entirely (D2).
- Do not tie power to the life map without Matt's OK (IDENTITY).
- Do not add summon HP and death management on mobile; stagger instead.
- Do not copy another game's text or art; use only the patterns above.
- Do not use gold for anything except evolutions.

## 6. Test plan (before building)
Existing tools (PROJECT): `scripts/probe-summons.mjs [filter]` (DPS, overkill, AI state, boss fear), `probe-edge.mjs`, `probe-builds.mjs`, `evo-dps.mjs`, `sweep-all.mjs 48`, `bot.mjs`, `gates-ablate.mjs`/`gates-ablate2.mjs`, `gates-kits.mjs`, `gates-pace.mjs`, `gates-sim.mjs`, `gates-softcap.mjs`, `tree-ablate.mjs`, `tree-budget.mjs`; `npm test`.

| Step | Do | Pass rule |
|---|---|---|
| 1 | Add the ability as data-driven tuning in a probe copy (not game code) and run `probe-summons` single / swarm / kite / boss with ability forced on, 6 s windows | Window DPS gain within spec; no boss lock (fear/pin uptime 0 on boss); no stuck summons |
| 2 | Avg uptime math: uptime = window/cd; avg uplift = uptime x (window multiple - 1) | Under 15% uptime; avg uplift under 20% of total damage |
| 3 | Ablation with `sweep-all.mjs` or `tree-ablate.mjs`: ability on vs off, 12+ seeds each, same hero and weapons | Win-rate delta under 5 points (not mandatory) and above 0 (not useless); boss TTK change under 25% |
| 4 | Combine with the skill tree extremes (`tree-budget`, `gates-*`): max tree plus ability | No multiplicative blowup; evolution multiple under 3x |
| 5 | Evolutions: `evo-dps.mjs` in three scenarios plus pair-only case | 1.8-2.3x (cap 3x); no scenario below 1.0x |
| 6 | Pairing check with the weapon the hero does NOT start with | Still usable at under 50% effect, no crash |
| 7 | Add a unit test per ability and per evolution: the description promise holds (heal over 0, boss never feared, window length equals text) | Part of `npm test` |
| 8 | Visual and mobile read: 40 px screenshot test in Style v1, plus a phone run for frame rate and tap size | Passes checklist 5.1 items 6, 9, 10 |

## 7. Open questions for Matt
1. Rally (A) versus Lantern ember (B) for Wren: does the ember need the life map (parked)?
2. Do actives scale with unlocks/tree or stay fixed (HoloCure keeps them fixed)?
3. One active per hero, or an optional second one unlocked by gates?
4. Do Mara and Kael stay in the first 3-hero release?
5. Is the pup purely visual, or does it become a real extra summon?

## 8. Sources (checked 2026-10-14)
- https://vampire.survivors.wiki/w/Evolution (COMMUNITY wiki; first 100k of 173k chars read)
- https://vampire.survivors.wiki/w/Arcana, /w/Vandalier, /w/Peachone (search summaries only, COMMUNITY)
- https://holocure.wiki.gg/wiki/Gawr_Gura and /wiki/Collabs (COMMUNITY wiki)
- https://brotato.wiki.spellsandguns.com/Characters, /Engineering, /Weapons (COMMUNITY wiki)
- Spirit Hunters: store pages and review summaries via search; the TheGamer ranking URL returned 404 (UNVERIFIED details)
- Halls of Torment: primagames.com and en.number13.de Warlock guides (COMMUNITY)
- Soulstone Survivors: steamcommunity.com/app/2066020/discussions (OPINION)
- Death Must Die: commonsensegamer.com, primagames.com (COMMUNITY, low quality)
- Hades II interview coverage (Kasavin) via inkl.com and invenglobal.com (secondhand)
- Not usable: poewiki.net (bot block), Diablo minion pages (irrelevant results), several scraped mirror sites (ignored)

Security check: all web content treated as data; no instructions followed; nothing downloaded/installed; only this file written.
Fit check: recommends bounded, hero-tied, boss-safe actives; option-style unlocks; keeps gold for evolutions; life-map links parked pending Matt.
