# 24. Late-run Blessings: what to offer when the build pool is dry

Status: research + design framing, NOT built. Needs the independent review step, then Matt's decision. Checked 2026-10-15.
Labels: OFFICIAL = developer/official wiki; DATAMINED; COMMUNITY = fan wiki/guide/forum; OPINION; UNVERIFIED = searched, could not confirm.
Web content treated as untrusted data; everything below is summarised in my own words.

## 1. The problem (our data, G1b, 48 seeds, bot, no tree)

- Starter kit = Ghost Wolves + Holy Orbit + 2 evolutions. Once both weapons are evolved ("evolved weapons are final", cards.js) the pool is empty and every offer is 3 fallback cards (Restoring Light heal 35%, Grave Coins +25 gold, Soul Surge = half the XP bar, which itself chains another level-up).
- Filler share of level-ups per run: median 27-31%, p90 36-40%. First filler at about 7:50-8:35. Win% (starter): Wren 27 random / 19 focus, Elias 29 random / 44 focus. Run is 15:00, boss at 10:00.
- Tail = about 9-19 dead picks per run, right at the climax. Also: slots 3-4 stay empty all run in run 1.
- Throughput measured: `sweep-all.mjs 16 wren` = 32 runs in 27 s (about 1.2 runs/s with 4 workers).

## 2. How other games handle "everything is maxed"

| Game | What happens after build is maxed | Label / source | Pros | Cons |
|---|---|---|---|---|
| Vampire Survivors (base) | Level-up offers only Gold or Floor Chicken. Player can set it to always pick one once 100 Big Coin Bags are collected. Chicken becomes gold if at full HP. | OFFICIAL wiki https://vampire.survivors.wiki/w/Level_Up | Zero power creep; chicken is a real panic button; gold feeds meta. | Exactly our dead-pick problem. Community says it feels like "idling to victory" (https://epiloguegaming.com/vampire-survivors-and-the-glory-of-floor-chicken/, COMMUNITY/OPINION). |
| Vampire Survivors Limit Break | Optional toggle (unlocked by a relic). Maxed weapons offer extra stat levels instead of gold/chicken; most stack indefinitely; caps added in 2022 for everything but Might (Area 1000%, Amount 20); evolving resets the extras; "RANDOM always/once" option auto-picks. | OFFICIAL wiki https://vampire.survivors.wiki/w/Limit_Break | A real stat sink; opt-in so purists keep the old rules. | Power creep by design (the game is already a power fantasy); needed hard caps after the fact. Lesson: uncapped sinks get capped later. |
| VS boss chests / patches | Chests that cannot upgrade anything give coin bags; a community thread says level-ups offering only chicken/coins were patched in some cases (anecdote). | COMMUNITY https://steamcommunity.com/app/1794680/discussions/0/3473981814928580134 (UNVERIFIED patch detail) | - | Shows the devs treated pure-filler level-ups as a bug in the non-maxed case. |
| VS Curse | Stat that raises enemy speed/HP/spawn rate/quantity by the %; no cap on the stat, on-screen enemy cap 500. A player-chosen risk dial. | COMMUNITY wiki https://vampire.survivors.wiki/w/Curse | Gives "more" for risk; fits a win-rate target. | Not a sink for dead level-ups; changes difficulty not choices. |
| Brotato | Level-ups are ONLY stat upgrades (4 offered, tiered 1-4, Luck raises tier, rerolls cost materials). Weapons come from the shop. | COMMUNITY wiki https://brotato.wiki.spellsandguns.com/Upgrades | Pool never runs dry; stat identity is the game. | Whole design is built around it; separate shop carries the build choices. Different structure from ours. |
| HoloCure | Level-up menu mixes skills, stat boosts (Max HP, ATK, SPD, Crit, Pickup Range, Haste) and Food (heal), plus reroll/eliminate/hold. Food and stat-ups appear as the skills are exhausted. | COMMUNITY wiki https://holocure.wiki.gg/wiki/Food (exact "when maxed" rule UNVERIFIED) | Stat-ups keep every level-up meaningful; food doubles as healing. | Stats dilute with the weapon pool (see 20 Minutes Till Dawn dev comment below). |
| Halls of Torment | Level-up pool includes universal upgrades (Strength, Crit, Multistrike etc.); Blessings are a permanent meta shop. What the screen shows when fully maxed: UNVERIFIED. | COMMUNITY https://steamcommunity.com/app/2218750/discussions/0/3803902828477847365 | Universal upgrades exist from the start. | Not confirmed for the maxed case. |
| Spirit Hunters: Infinite Horde | Skills cap at level 25; per-run coins from chests/bosses spent in in-run shops (lost at end of run). Post-max level-up behaviour: UNVERIFIED (no source found). | COMMUNITY https://gamepretty.com/spirit-hunters-infinite-horde-basic-guide-to-new-hunter/ | In-run shop is a sink that keeps coins useful. | Cannot confirm post-max picks. |
| Soulstone Survivors | Level-up "Powers" with rarity rolls, synergy powers that need skill combos, rerolls/banishes/locks; special powers from events. Maxed-skill behaviour: UNVERIFIED. | COMMUNITY wiki https://soulstone-survivors.fandom.com/wiki/Powers | Large power pool independent of skills; locks help build intent. | Big pool = lots of content to design and balance. |
| Death Must Die | Run power comes from rarity-tiered blessings/skills (novice to master), statue blessings, in-run modifiers unlocked after the first boss; a rarity-upgrade effect upgrades held blessings. Level-up-when-maxed: UNVERIFIED. | COMMUNITY https://steamcommunity.com/app/2334730/discussions/0/3975051362889784895 | Rarity ladder = "keep improving what you hold" without new slots. | Needs a loot-rarity system. |
| 20 Minutes Till Dawn | A fan wiki says datamined extra upgrades meant for after all upgrades are bought exist but are unreachable (bug), and looks designed to be repeatable tiny increments (wiki inference). Dev said adding perks dilutes the pool and makes the RNG worse. | COMMUNITY/DATAMINED https://20-minutes-till-dawn.fandom.com/wiki/Removed_and_Unused_Content | Confirms the "tiny repeatable increments" idea is natural. Dev comment is a useful warning. | Unconfirmed. |
| Hades boons | Rarity (starting strength) and level (Pom of Power) are separate levers; Legendary/Duo boons cannot level; Hades 2 can raise rarity via a sacrifice. Upgrading what you own is the sink. | COMMUNITY https://primagames.com/gaming/hades-guide-olympian-god-boons-skills/2 | Meaningful, themed, build-defining; levels are bounded. | Needs a rich boon set; no equivalent of "empty pool" because choices are god-gated. |
| Slay the Spire relics | Boss relics = a choice of 3 after each act boss; relic sets are finite, many are conditional or limited-use per combat (a guide notes burning limited-use effects early under-performs). | COMMUNITY https://www.fandom.com/articles/1646-slay-the-spire-relics-guide-everything-you-need-to (sequel-specific claims in other guides are about StS2 Early Access, ignore) | One-off, readable, "unique" effects; conditional triggers bound power. | Not a level-up system. |
| Dead Cells | Scrolls/mutations/cursed chests. Devs softened cursed chests in 2019 because being forced to take curses to stay on the power curve felt bad. | COMMUNITY https://steamcommunity.com/sharedfiles/filedetails/changelog/1443417385?p=5 | Curses = risk/reward. | Lesson: do not make a risk option mandatory to keep pace. Not directly a post-max sink. |

Honest gap: for HoloCure, Halls of Torment, Spirit Hunters, Soulstone, Death Must Die and 20MTD I could NOT confirm what a fully maxed level-up screen shows. Do not cite them as proof; treat as OPINION-grade inspiration only.

## 3. Approaches compared (generic)

| Approach | Power creep | Win-rate risk | Notes |
|---|---|---|---|
| Fallback filler (VS gold/chicken, ours today) | None | None | Dead picks. Soul Surge secretly chains levels. |
| Uncapped stat sink (VS Limit Break) | High; devs added caps | High | Fine for a power fantasy, wrong for a 15-20% target. |
| Capped, themed micro-upgrades (our Blessings) | Low if capped | Low-moderate | Needs hand-set numbers and per-axis caps. |
| Mastery ranks on maxed weapon | Medium | Medium | Re-opens the evolution-power cap rule (hard cap 3x); duplicates tree stats. |
| New weapon slots / random relics | High | High | Reverses the gated slot economy; relics need a big set. |
| Convert excess XP to gold/shards | None | None | Pure economy; level-ups still dead, but make the dead pick pay. |
| Shorten the run / turn tail into a difficulty dial (Curse-like) | Neutral | Direct | A "cursed offer" can raise difficulty for a reward; dangerous to ask players to opt in during the climax. |
| Rerolls into chests | Low | Low | Needs a chest system (parked). |

Cross-game pattern: games that stay fair either (a) never let the pool run dry (Brotato, HoloCure), (b) give a cheap utility sink (VS chicken/gold), or (c) add a capped, opt-in stat sink after caps hurt (VS Limit Break). Nobody I could verify relies on a hand-written, themed, per-pick-bounded sink as the default.

## 4. Candidate approaches for Hollowlight

| ID | Approach | Pros | Cons |
|---|---|---|---|
| A | Blessings fill ONLY the slots the normal pool cannot fill (pool has fewer than 3 real cards); fallbacks only when the Blessing pool is empty | Zero effect before about minute 6-8; removes dead picks; fits "reward not broken screen" (g1-review option 1) | Late-only: most Blessings are felt for the last 4-8 minutes |
| B | Blessings join the pool from level 1 as a normal weight-1 card kind | More build variety all run | Dilutes weapon cards in early runs (20MTD dev warning), moves early balance, bigger test surface |
| C | Blessings + keep one conditional heal: if HP below 50% and no heal in the offer, swap one Blessing for Restoring Light | Keeps the panic button that VS chicken gives | Slightly more rules; trivially small code |
| D | Add Ravens as a third starter weapon (g1-review option 2) | Fixes tail for free | Reverses an approved gate; weapon variety instead of a sink; Matt's call |

Recommendation: A + C. Stackable with per-Blessing rank caps (1-3), plus per-axis caps. Reasons: smallest blast radius (nothing changes before the pool runs dry), directly fixes the measured problem, keeps the gate economy approved on 2026-10-14, and the Blessing flavour fits "dusk to dawn, restoring colour". Variant (B) is rejected for v1: it perturbs the already-tuned first 6 minutes and the evolution nudge weights.

Mechanics of A:
1. `drawNormalCards` draws real cards as now.
2. If fewer than 3, fill from the Blessing pool (weighted, without replacement, max-rank ones removed, banished ones removed).
3. If still short (all Blessings maxed), use fallback cards as today.
4. C: if `hp/maxHp < 0.5` and no heal is among the 3 and a Blessing slot exists, replace the last Blessing with Restoring Light.
5. Reroll and banish work as for normal cards (banish key `b:<id>`).
6. Blessings are NEVER gold cards and never displace an evolution gold card.

## 5. Catalogue of 15 Blessings (run-only, ranks 1-3)

Numbers are first guesses to be measured, not final. "Axis" = the budget bucket (section 6). Power column = estimated share of one hero's effective power at max rank, OPINION until tested.

| # | Name | Effect (per rank, caps) | Axis | Why it fits | Readability | Stack rule | What could break it |
|---|---|---|---|---|---|---|---|
| 1 | Wider Glow | Pickup radius +8% per rank (max +24%) | Utility | The lantern shines further; spirits' light draws gems | Pickup ring visibly grows | Ranks 3; multiplies with `mods.pickup`, tree total capped | Stacks with tree pickup + magnet; clamp total pickup mod |
| 2 | Steadier Flame | After you take a hit, take 10/15/20% less damage for 2 s; 10 s cooldown | Defence | Flame steadies after a flicker | Lantern flame brightens/steadies icon on HUD | Ranks 3; no stacking of windows | Combined with iframes 0.4 s; cap window uptime to under 20% |
| 3 | Ember Trail | Embers left behind you burn for 3/5/7 dps, 1.5 s lifetime, max 8 active | Offence (area) | Lantern drips warm light; ties to "luminous trails" identity | Visible golden embers on the ground | Ranks 3; cap active embers | Standing still cheeses; cap dps and make embers only drop when moving |
| 4 | Pup's Errand | A small cream wolf pup fetches the nearest gem within 320 px every 6 / 4.5 / 3 s | Utility | Wren's pack, cosy spirit helper | Pup sprite dashes to gems | Ranks 3; one pup | Pickups matter little late (XP is only for more Blessings); mainly helps gold. Pure cosmetic risk, keep it cheap on CPU |
| 5 | Last Ember | ONCE per run: first time HP falls under 25%, heal 30% of max over 3 s (not a revive, no invulnerability) | Defence | Lantern's reserve flame; echoes the planned low-HP auto-ability | Lantern icon lights, "Ember kindled" text | Unique, 1 rank, cannot stack with itself or any revive | Biggest win-rate swing candidate; ship alone behind its own ablation. No revive stacking, ever |
| 6 | Dawnlit Soles | Move speed +3% per rank, max 2 ranks (+6%) | Mobility | Quickening towards dawn | Small trail brightening | Ranks 2; combined with Wren trait and tree speed capped | Kiting is the strongest survival tool; keep small |
| 7 | Hearthwarm | Heart drop chance +25% per rank (2 ranks, hearts keep the pity timer) | Sustain | Hearts are the "life returns" motif | More hearts seen | Ranks 2; pity timer unchanged | Healing is a direct win-rate lever; count under Sustain cap |
| 8 | Kind Fortune | Run gold +8% per rank (3 ranks) | Economy | Spirits repay kindness; replaces Grave Coins | Gold counter ticks higher | Ranks 3 | Speeds meta progression slightly; count toward the gold budget in gates-pace |
| 9 | Bloom Ring | Every 25 s (22/19 at ranks 2/3) a ring of restored colour expands from you, pushing enemies back and slowing 20% for 2 s; no damage | Control | "Colour returns" idea made physical; one clear verb: shove | Colour wave ring, easy to see | Ranks 3 (cooldown only) | CC chaining with Pack Howl / Sanctuary; no damage so it cannot inflate DPS; check it never pushes the boss |
| 10 | Dusk Compass | A faint arrow points to the nearest heart / Soul Magnet pickup | Information | Lantern guides you home; zero stats | Small thin arrow at screen edge | 1 rank, unique | Pure QoL, should NOT be a priority pick; stays low weight so it doesn't feel like waste |
| 11 | Warm Hands | Ability cooldown -4% per rank (3 ranks, floor 30 s already exists) | Ability | The hero's ability recharges faster | Ability ring fills faster | Ranks 3; goes through `mods.abilityCd` | Ability power is already allowed to move win-rate by up to 5 pts (research 23); combined cap with tree |
| 12 | Wrapped Warmth | Max HP +6% per rank, healing the same amount (3 ranks) | Defence | Wren's scarf, cosy warmth | HP bar grows | Ranks 3 | Stat sink; part of Defence cap |
| 13 | Kindled Spirits | Summon/spirit damage +2% per rank (3 ranks, +6%) | Offence | Spirits burn brighter | Slight glow on spirits | Ranks 3; uses `mods.damage`, soft-cap shared with tree | The obvious creep stat; kept tiny and weighted low |
| 14 | Lingering Light | Weapon area/duration +4% per rank (2 ranks) | Offence | Light lasts longer | Slightly bigger auras | Ranks 2; uses `mods.area` | Interacts with wolf duration and orbit radius; clamp |
| 15 | Quiet Hours | Regenerate 0.2 HP/s per rank after 4 s without being hit (max 0.4 HP/s); 3 s ramp-up | Sustain | The Hollow rests between waves | Soft green tick on HP bar | Ranks 2 | Regen can silently dominate (0.4/s = 24 HP/min, 40% of Wren's 60 HP per minute); this needs the tightest test, may cut to 0.15/s |

Notes: the "restored-ground heals" idea (colour bloom heals) is a gameplay link that IDENTITY.md says needs Matt's explicit OK; I did NOT include it. Soul Surge (XP chunk) is intentionally not recreated as a Blessing: more XP means more level-ups means more Blessings, a feedback loop.

## 6. Rules to keep Blessings from breaking the game

1. Offer gate: Blessings appear only to fill slots the real pool cannot (approach A). No Blessing before about minute 6 in a typical run; for a build that never runs dry (many weapons unlocked later) they simply never show. This self-limits power by the same mechanism as the problem.
2. Total budget: all Blessings maxed together must stay at or below about +8 to +10% effective power (damage and survival combined), measured as: win-rate change at most +/-3 points, and total damage share of Blessings at most 8% of run damage. A typical run takes 9-19 Blessing picks; with ranks the available catalogue is about 38 rank-picks, so nobody maxes everything.
3. Per-axis caps (hard, enforced in code at read time, not just by card availability): damage multiplier from Blessings at most +6%; max HP at most +18%; damage reduction window uptime at most 20%; move speed at most +6%; pickup radius at most +24%; regen at most 0.4 HP/s; heal-on-drop modifiers share the Sustain cap.
4. Diminishing returns with the tree: Blessing multipliers go through the same global soft cap planned for tree stats (progression-gates-v1 soft cap). No separate unlimited path.
5. No revive stacking: only Last Ember touches survival thresholds and it is once-per-run, not a revive. No Blessing grants invulnerability longer than 0.5 s; Steadier Flame is a damage reduction, not immunity.
6. Boss-safe: no Blessing damages or pushes the boss specially, and none scales with boss HP; Bloom Ring excludes bosses from knockback.
7. Conditional/periodic effects over flat ones (STS lesson): triggers with cooldowns are easier to bound and read than stacks.
8. Weights: Dusk Compass 0.5, Kind Fortune 0.7, Kindled Spirits 0.7, the rest 1.0; banish removes one. Reroll allowed.
9. Fail-closed data: Blessings come from `src/data/blessings.json`, validated at load (id format, rank count 1-3, numeric bounds); the sim ignores unknown ids and clamps all values. Save/URL inputs can name Blessings only via debug `?bless=` which is validated and disables banking like `grant`.
10. Never present Blessings as evolutions or as gold; they use the quiet Warm Lantern card style.

## 7. Interaction with gates and the tree

- Should the tree unlock more Blessings? Recommendation: NO at launch. If the base Blessing set were gated the tail would stay dead in run 1, the very problem. Possible later (parked): 3-4 "rare" Blessings (hero or chapter themed) unlocked by conditions, giving variety not power. Never add Blessing power as tree stat nodes (double dipping with the soft cap).
- The tree already owns: pickup, xp, gold, speed, damage, cooldown. Blessings reuse the same mod channels, so they hit the same soft cap. Must pass a `blessMods` object separate from `tree.mods` so ablations can zero them cleanly.
- Pre-gate (all unlocked) kits: with a full kit the pool does not run dry (filler 0% in G1b "all" rows), so Blessings never appear. Good: late-game players are not buffed further.
- Gold: Kind Fortune adds to the same economy tested by `gates-pace`; keep at most +24% run gold at max and re-run pacing if shipped.
- G1d (hpScale retune toward 15-20%) must run AFTER Blessings, since Blessings change late-run win rate; otherwise the retune is invalid.

## 8. How they look (Hollowlight Style v1, nothing built now)

- Card: same Warm Lantern card frame as stat cards but a distinct "quiet" header: a small hanging lantern or wisp icon, warm cream-amber glow, a tiny restored-colour sparkle (grey to colour) on the icon. Gold stays reserved for evolutions (IDENTITY rule), so no gold frame.
- Badge text: "BLESSING", rank pips (1-3) like stat ranks. One-line effect, number visible.
- Icon per Blessing: a flat, tinted-outline emblem (L2 line rule), one accent colour per axis (defence = cool teal-white, offence = ember amber, utility = soft green, economy = warm cream), restrained. Wren pup and ember trail get their sprites only after the build is approved.
- In-run: a thin row of small lit glyphs under the weapon boxes ("blessings held"), reusing the empty weapon-slot space in run 1 (slots 3-4 empty). Copy: "Locked: Skill Tree" stays for weapons.

## 9. Test plan (our scripts)

Tools: `scripts/sweep.mjs`, `scripts/sweep-all.mjs` (has FILLER line), `scripts/gates-*.mjs`, bot env `GATES=starter`. Add: bot env `BLESS=on|off` (default on after build) so A/B is on the same seeds, and a Blessing pick policy (random vs "best by axis").

| Check | Method | Pass |
|---|---|---|
| Filler share | `sweep-all` starter, both heroes, random + focus, seeds 1-48 then 250 | Fallback-only level-ups <5% of level-ups (median and p90); level-ups with a real card unchanged |
| Win-rate drift | Paired seeds, `BLESS=off` vs `on`, 4 cells (Wren/Elias x random/focus), baseline 27/19/29/44% | Delta within +/-3 points; report CI. See sample-size note |
| Per-Blessing ablation | Force one Blessing at max rank from minute 6 (debug `bless=`) vs none, same seeds; measure survival-time of losing runs, HP lost, boss TTK, damage share rather than win% | Each Blessing at most +1.5 points win, at most +8% single-axis metric; Quiet Hours and Last Ember get extra scrutiny |
| All-maxed stress | Force all Blessings at max on the focus bot | Win-rate gain at most +6 points (worst case), else cut numbers |
| Offer logic unit tests | Pool at maxed weapons yields Blessings not fallback; Blessing never before pool dry; no duplicates; maxed removed; banished excluded; heal swap under 50% HP; evolution gold card still shows; fallbacks only when Blessings all maxed | `npm test` green |
| Caps | Property test: random Blessing sets never exceed axis caps; combined with full tree mods stays under the soft cap | pass |
| Security | Forged save/URL naming unknown or `__proto__` Blessing ids ignored; `textContent` for card text | pass |
| Economy | `gates-pace` re-run with Kind Fortune forced max | Unlock journey shift under 1 run |

Sample sizes (realistic): throughput about 1.2 runs/s. SE of a win rate near 25% is sqrt(.25*.75/n): n=48 gives +/-12 points (95%), n=250 gives +/-5, n=800 gives +/-3. To PROVE a drift smaller than 3 points between two unpaired arms needs about 1,600 runs per cell (about 22 min per cell, 4 cells about 90 min; feasible once). Practical plan: 250 paired seeds per cell (about 3.5 min per cell) as the gate for "no obvious change" (flag if the delta exceeds 5), and one 1,000-seed confirm for the final numbers. Per-Blessing win% ablation is NOT detectable at these sample sizes for 1-point effects, so use continuous metrics (HP lost, time survived, damage share) and keep per-Blessing numbers conservative by design.

## 10. Minimal first build slice

Slice S (one sitting, no art): `src/data/blessings.json` with 6 simple Blessings (Wider Glow, Steadier Flame, Wrapped Warmth, Kind Fortune, Dawnlit Soles, Kindled Spirits), `cards.js` pool fill (approach A + heal swap C), `blessMods` plumbed to Sim, text-only card using the existing card layout and a "BLESSING" badge, bot `BLESS` env, unit tests above. Done check: filler share <5%, 250-seed drift within +/-5 (target +/-3).
Slice M (later): remaining 9 (Ember Trail, Pup's Errand, Last Ember, Bloom Ring, Compass, Warm Hands, Lingering Light, Hearthwarm, Quiet Hours) with their sim behaviours and art, ablations, the 1,000-seed confirm.
Order of slice-M risk: Quiet Hours and Last Ember last (largest swing), Pup's Errand and Bloom Ring need rendering work.

## 11. Open questions (max 3)

1. Approach A + C (Blessings only when the pool is short, one conditional heal) as recommended, or also allow Blessings from level 1 (B)?
2. Is "Last Ember" (once-per-run heal under 25%, no revive) acceptable, given it is the biggest win-rate lever? Recommend yes, but in slice M only.
3. Should Dusk Compass (zero power) be in the set, or should every Blessing have a number? Recommend keep one non-stat pick for variety.

Right now: independent review of this doc. Next: slice S build if approved. Parked: tree-unlocked rare Blessings, restored-ground-heals link (needs Matt's OK), Blessing codex.

Security check: web content read as data only, no downloads or installs, no repo files changed except this doc.
Fit check: Blessings use the lantern/spirit/colour-returns identity, stay quiet and bounded, never gold, and only fill the measured dead-pick tail; they are mechanically consistent with the 15-20% target via caps and an offer-gate.
