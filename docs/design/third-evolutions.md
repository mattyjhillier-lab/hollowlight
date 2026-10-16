# Third evolutions: Raven Flock, Spirit Bolts, Chain Lightning, Holy Orbit (2026-10-16)

Status: DESIGN ONLY, NOT LOCKED. No gameplay code or data changed. Follows the locked EVOLUTION COUNT (every weapon has three evolutions, 15 total; 3 different stat pairs per weapon covering all four stats) and EVOLUTION RULES (stats keep ranking after evolving; Rend 15-35%; Burn sources) in docs/LOCKED.md, the measurement standard and per-evolution format of docs/design/evolutions-second-review.md (2.3, 4), the ability principle (CLAUDE.md) and docs/design/weapons-and-summons-v1.1.md. Matt decides weapon by weapon: options **A (recommended) / B / C**, each first as a one-tap card, then in full.

## 0. Bottom line
1. Four new evolutions, one per weapon, each with a verb no other evolution, hero ability or planned hero uses: ravens **finish the fading** (Mercy Wings), bolts **fly out and come home** (Returning Pages), chain **holds arcs on foes** (Storm Tether), orbit **swings a censer** (Swinging Censer).
2. Each weapon's three evolutions then cover three different situations: ravens near/strong/weak, bolts kite/boss/advancing line, chain kite/standing crowd/lone big foe, orbit swarm/kite/foe pressed close. Every weapon gets one evolution that is good on a lone tough enemy.
3. Pairs (no existing pair needs to shift): Ravens **Watch + Wingbeat**, Bolts **Swiftness + Pierce**, Chain **Chains + Jump range (Arc)**, Orbit **Orbit size + Orbit speed**. Each new pair is the two stats that were "in one recipe only" pushed into a second meaning, so with all three evolutions unlocked every stat sits in one or two recipes (same shape as wolves).
4. All four A options were prototyped in memory and measured (`scripts/third-evo-probe.mjs`, read-only): every one is inside the 3x cap at pick (pair 5, others rank 1), never below base, and inside or near its home band. Caveat: they are measured against TODAY's base (or a proxy of the planned base for ravens W8a and orbit W4); each is re-measured in its build chunk after its weapon's W-chunk lands.
5. Gating: run 1 unchanged (Howling Legion + Sanctum Halo only). The four new ones are late tree gates ("third recipe" mastery gates) after the weapon's other two; the tree shows three evolution sockets per weapon so the player learns "every weapon has three".

## 1. Method and evidence
| Item | What |
|---|---|
| Probe | `node scripts/third-evo-probe.mjs [seeds=3] [pickRank=1] [filter]` (NEW, read-only): prototypes the four A options in memory (wrapped weapon behaviours + in-memory evolution entries; nothing written), evo-home harness: MORTAL single (dummy 30 px) / swarm / kite / boss (Elder Treant, boss damage only), IMMORTAL stream40, plus **hug** (dummy pressed at 15 px). Cell = cap@pick (pair 5, others p) and home@max. `PT='{"storm_tether":{"k":0.3}}'` what-ifs (JSON.parse, known keys only, in-memory). |
| Proxies | `_w8a` = W8a-like raven base (swoop nearest unclaimed within Watch, peck, return; Watch 90-150, Wingbeat rest 1.6-0.85 s mapped from today's stats). `_w4` = Holy Orbit + W4 guard contraction (edge < 8 px for 0.2 s -> ring 14 px, hold 0.8 s). Neither includes Burn, the orbit-speed attack-rate bonus, raven mark, W10 Swiftness or W11 chain changes. |
| Noise | 5 seeds (table 1.1) and 3 seeds (pick rank 2 check); swarm/kite +-5-15%, single/boss/stream40 +-1-3% (same harness as the second review). |
| Estimates | B and C options are DESIGN ESTIMATES (not run), reasoned from the A prototypes and the second review's what-ifs. Marked "est.". |

### 1.1 Measured (A options, 5 seeds, pick rank 1)
| Evolution (vs base) | single | hug | swarm | kite | stream40 | boss | cap@pick worst |
|---|---|---|---|---|---|---|---|
| Mercy Wings (vs `_w8a`) @max | 1.40 | 1.40 | **1.82** | **1.95** | 1.40 | 2.35 | 1.68 kite |
| Returning Pages (vs today) @max | 2.34 | 1.60 | 1.62 | 1.40 | **1.87** | 1.58 | 2.70 mortal swarm (stream40 1.85) |
| Storm Tether (vs today) @max | **1.85** | 1.85 | 2.16 | 2.26 | 1.88 | **1.91** | 1.93 kite |
| Swinging Censer (vs `_w4`) @max | INF (base 0) | **1.92** | 1.04 | 1.74 | 1.30 | 1.28 | 2.62 kite (stream40 1.49) |
Bold = home scenario. Pick rank 2 check (3 seeds): Mercy cap@pick <= 1.58, Censer <= 2.60, same verdicts. Today's base ravens are broken (single 0, boss 3 DPS), so Mercy vs today is meaningless (swarm 2.0x, stream40 0.34x); only the W8a-proxy ratio counts.

Reproduce: `node scripts/third-evo-probe.mjs 5 1` (defaults = these numbers). Prototype numbers used (design starting points, retuned in the build chunk): Mercy peck 1.4x, x2 on non-boss below 35% HP, up to 3 chained finishes, fly 300 px/s. Pages 1.6x per hit, 1 + Pierce foes per leg, fresh foes only on the way back, out leg 130-207 px (Swiftness), hit radius 9. Tether ceil(Chains/2) arcs (max 4), 0.3x power per tick, tick 0.25 s x Cooldown/1.6, fork once at 0.5x within Jump range, reach 120 + 0.6 x Jump range, no doubling on a lone foe. Censer: ring KEPT (with W4 contraction) plus one censer swinging out and back along the line to the nearest foe, length Orbit size x 1.8, phase speed = Orbit speed, hit (1.5 + 0.25 x Orb count) x power to the aimed foe, 0.3x to others on the path, per-enemy gate 0.35 s.

## 2. Verbs already taken (checked for every option)
Wolves: ECHO (Legion), ALPHA (Dire), TRAILS (Light Trails, ground trail that bleeds); pounce REJECTED. Ravens: STORM wall + fear (Murder Storm), dive + MARK (Talon Mark). Bolts: BURST and seek (Tempest), LANCE + script line (Soul Lance). Chain: SMITE from the sky (Thunder Judgment), FIELD of random strikes (Static Storm). Orbit: HALO + burning ground (Sanctum Halo), BURST on contact + rekindle (Bursting Lights). Abilities: Rally the Pack (converge, pin), Candle Wheel (planted ring, heal). Planned heroes (BIBLE): Mara Black Sky (blind), Isolde Recitation (spiral volley), Vane Stormcall (planted strike tower), Thomas wisps, Gideon grave hands (grab), Agnes Frost Bell (slow/freeze), Kael bone servant, Hollow One soul harvest. "Many become one" = Dire Alpha. Status set (locked, no new ones): Bleed (wolves), Pin (Rally), Fear (Murder Storm), Mark (ravens/Talon Mark), Burn (Holy Orbit).

---

## 3. Raven Flock (Mara's spirit; stats Flock size / Peck power / Flock radius -> Watch / Flight speed -> Wingbeat)

**Third pair: Watch + Wingbeat** (Flock radius + Flight speed). Existing: Murder Storm = size + Watch, Talon Mark = Wingbeat + power. Watch + Wingbeat = "how far the scouts see, how often they fly": the purest scouting pair. Nudging toward it makes sense only after W8a (today radius is a trap and speed near-dead; both become real in W8a), and the evolution is gated behind W8a anyway. Alternatives considered: size + power (generic "more, harder"; nudges the two stats players already take, so it would appear by accident), Watch + power, size + Wingbeat (both less meaningful). No shift to existing pairs.

### 3.1 One-tap
- **A (Recommended) Mercy Wings:** your ravens watch for the foes that are fading and swoop on the weakest first, finishing them; a finish sends the raven straight on to the next. Watch is how far they see, Wingbeat how soon they fly again.
- **B Last Letters:** each swoop drops a sealed letter on a foe; a second later the seal breaks in a small burst of violet paper that hurts everything around it.
- **C Vanguard:** the flock flies ahead of you in a wedge wherever you walk, clearing a lane; standing still, it spreads to a wide ring.

### 3.2 Full
**A. Mercy Wings** (proposed id `mercy_wings`; verb MERCY, sub "the fading first")
- Fantasy/verb: FINISH. Ravens are omens; they come for the ones already fading and set them free (bittersweet, never grim: freed light, not gore). Distinct from Talon Mark (toughest, mark) and Murder Storm (wall around you, fear); no other weapon picks the weakest.
- Trigger: each resting raven picks the enemy within Watch (90-150 px) with the LOWEST health fraction (non-boss, claim set so ravens spread); if no foe is wounded it takes the nearest (so single/boss never lose damage). Swoop 300 px/s, peck 1.4x; x2 if the target is non-boss and below 35% health. A kill sends the raven on at once to the next weakest (max 3 finishes per flight), then it returns and rests (Wingbeat 1.6 -> 0.85 s). Boss: normal 1.4x pecks, no low-health bonus.
- Look/sound: violet ravens; a thin violet "omen" ring settles over the chosen foe for 0.2 s before the swoop (readable tell, no red); on a finish the foe releases a small cream wisp of freed light that drifts up (identity: light restored); the raven's ribbon (W2) traces the chained flight. Gold rim only on the ravens. Cue `evo_mercy_wings` (one soft caw + rising chime per chained finish, rate-limited 4/s).
- Card: **Mercy Wings** / "They come for the ones already fading."
- Numbers (measured vs W8a proxy, @max): kite **1.95x**, swarm **1.82x** (home), single 1.40x, stream40 1.40x, boss 2.35x (over 2.3: trim the fallback peck to 1.25x on bosses; still >= base). Cap@pick p1 <= 1.68x. Never below base: yes (>= 1.13x everywhere).
- Stats: Watch = how far the scouts look for the fading (bigger pool, more finishes), Wingbeat = rest between flights; Flock size = more scouts; Peck power keeps ranking and decides how many pecks a finish needs. All four live.
- Risks: steals kills from other weapons (fine: kills are team kills; Echo Pack needs pack kills, so Wren's Legion + Mercy compete a little); health-fraction scan cost (bounded: Watch radius, once per raven per flight). Team synergy with Bleed/Burn is emergent (DoT lowers health), not a rule.
- Status: applies none. Base W8b raven mark still rides on pecks as on the base ravens. No fear, no pin. Low-health x2 is the raven's own conditional damage, not an enemy-side amp, so it does not count against the W8b total-amp cap (state this in W8b).
- Worth picking: you see stragglers vanish the moment they are hurt and runners stop leaking past you; skipping leaves half-dead foes chasing you. Feels like the flock is "cleaning up" for the whole team.

**B. Last Letters** (verb DELIVER)
- Swoop to the nearest unclaimed foe within Watch, peck 0.8x and leave a sealed letter (cream paper, rust wax seal = Mara's accent); 1.0 s later the seal breaks: 2.2x to all within 26 px (paper burst). Wingbeat = rest; Watch = delivery range.
- Card: **Last Letters** / "Every swoop leaves a letter that bursts a moment later." Est. (not run): swarm 1.9-2.2x, kite 1.6-1.8x (target moved on, burst lands behind it), single 1.5x, boss 1.5x, cap@pick ~2.0x.
- Risks: delayed burst ~ the rejected Soul Lance B "impale and burst" idea (not used elsewhere, so allowed); paper bursts add screen noise in big swarms (cap 12 seals live). Strong Mara identity (letters of the dead), but Mara is not built yet.

**C. Vanguard** (verb SCOUT)
- Flock forms a wedge 40 px + Watch x0.6 ahead of the move direction and pecks everything in the lane (contact 1.0x, gate 0.55 s); standing still it spreads to a ring at Watch x0.6. Wingbeat = how fast the wedge sweeps side to side.
- Card: **Vanguard** / "The flock flies ahead and clears your path." Est.: kite 1.8-2.0x, swarm (standing) 1.1-1.3x, boss 1.2x, cap@pick ~2.2x.
- Risks: nothing behind you is covered (chasers), weak standing; overlaps the not-chosen "Thunderhead/Rolling Wheel" move-direction ideas; reads as less raven-like.

### 3.3 Raven coherence (all three)
| Evolution | Verb | Pair | Home | Targets |
|---|---|---|---|---|
| Murder Storm (Wall of Wings) | STORM + fear | Flock size + Watch | standing swarm | everything near you |
| Dive Bombers (Talon Mark) | DIVE + mark | Wingbeat + Peck power | boss / single (team) | the strongest |
| Mercy Wings | FINISH | Watch + Wingbeat | kite / swarm | the weakest |
Near / strong / weak: three clear raven jobs, all "scout, mark, fear" family, none copying wolves or orbit. Pairs: size 1, power 1, Watch 2, Wingbeat 2: all four stats in a recipe. With all three unlocked every raven stat card gets the evoNudge (no steering), and "Something stirs" stays exact. Nudge honesty: Watch/Wingbeat are only worth nudging after W8a; all three raven evolutions are tree-gated and W8a ships first, so no run-1 player ever sees a dishonest nudge.

---

## 4. Spirit Bolts (Isolde's spirit; stats Bolt count / Bolt power / Bolt speed -> Swiftness / Pierce)

**Third pair: Swiftness + Pierce.** Existing: Spirit Tempest = count + Swiftness, Soul Lance = power + Pierce. Swiftness + Pierce = "how far and fast a glyph flies, how many it passes through": the natural pair for a glyph that travels a line twice. Count + power (alternative) is the generic raw-damage pair and would appear by accident. No shift.

### 4.1 One-tap
- **A (Recommended) Returning Pages:** each glyph flies out through the line of foes and turns back to you like a page returning to the book, striking fresh foes on the way home. Swiftness is how far it flies, Pierce how many it passes each way.
- **B Splitting Glyphs:** a glyph that hits splits into two half-glyphs that seek two new foes; Pierce lets the halves split again.
- **C Lingering Letters:** glyphs that miss or finish do not fade; they hang in the air as lit letters for a few seconds and dart at the first foe that comes near.

### 4.2 Full
**A. Returning Pages** (proposed id `returning_pages`; verb RETURN, sub "out and home again")
- Fantasy/verb: RETURN. Isolde's book calls its letters home: a glyph read out flies, and comes back to the page. No other weapon or evolution boomerangs (Wheel C "Lantern Flares" was not chosen).
- Trigger: every volley (gap 1.1 s, Swiftness -0.02 s/rank as W10) fires Bolt count glyphs, each aimed at a different nearest foe, steering lightly (3 rad/s) until its first hit, then straight; it passes through 1 + Pierce foes, turns at the end of its flight (130 px + 0.7 px per Swiftness speed point: 130 -> 207 px) or when its pierce is spent, flies back to the hero passing through up to 1 + Pierce FRESH foes (never the same foe twice per throw), then is caught by the book. 1.6x per hit (prototype; tune 1.4-1.7).
- Look/sound: cyan glyph with a thin curling ink line out, a reversed ink curl on the way back; it lands on Isolde's floating book / the hero's lantern with a page-flick sparkle; gold rim only on the glyph. Cue `evo_returning_pages` (paper whoosh out, softer whoosh back, one page-flick per catch, rate-limited).
- Card: **Returning Pages** / "Glyphs fly out through the crowd and home again through fresh foes."
- Numbers (measured vs today, @max): stream40 **1.87x** (home: an advancing crowd/line), mortal swarm 1.62x (supply-limited: the base already kills most of the refill), kite 1.40x, single 2.34x, boss 1.58x, hug 1.60x. Cap@pick p1: 2.70x mortal swarm (stream40 1.85x, saturation rule passes), all others <= 1.85x. Never below base: yes (>= 1.40x).
- Stats: Swiftness = flight length (and volley gap); Pierce = foes per leg (x2 legs); count = glyphs per volley; power = damage. All four live; Pierce becomes worth twice as much (good: it is a strong stat already).
- Risks: single 2.34x at max is above the band (not home; under cap) - trim per-hit to 1.5x if stream40 stays >= 1.8x after W10; W10 Swiftness (speed + turn + gap) changes the base, so re-measure. Glyphs returning to a moving hero must not orbit: catch radius 8 px, life 4 s.
- Status: none (bolts own no status).
- Worth picking: a chasing column gets cut twice per throw; you see the glyphs come home, so the verb is readable at a glance. Skipping keeps cleaner homing but half the hits on a line.

**B. Splitting Glyphs** (verb SPLIT)
- First hit splits the glyph into two half-glyphs (0.5x each) that seek the two nearest other foes; halves split again while generation < 1 + floor(Pierce/2) (max 3 generations = 15 hits per glyph); Swiftness = halves' speed/turn so they find targets before fading.
- Card: **Splitting Glyphs** / "A glyph that strikes breaks into two that seek new foes." Est.: swarm 2.0-2.3x, kite 1.8-2.0x, single 1.0-1.1x (halves have no second target), boss 1.0-1.1x, cap@pick ~2.4x.
- Risks: "spreads from foe to foe" is close to Chain Lightning's jump verb (copy risk); generation cap needed to stop exponential screen noise; single/boss near the floor.

**C. Lingering Letters** (verb LINGER)
- At end of flight or after a kill, the glyph hangs as a lit letter for 3 s; the first foe within 40 px (+3 px per Swiftness rank) triggers a dart (1.0x, passes Pierce foes); max 12 hanging letters.
- Card: **Lingering Letters** / "Spent glyphs hang in the air and strike whoever comes near." Est.: kite 1.6-1.9x, swarm 1.4-1.6x, single 1.1x, boss 1.1x, cap@pick ~2.0x.
- Risks: "leave something behind as you move" is close to Light Trails (wolves); floating letters add clutter; weak on boss.

### 4.3 Bolts coherence
| Evolution | Verb | Pair | Home |
|---|---|---|---|
| Spirit Tempest (Burst and Seek) | BURST, each seeks its own | count + Swiftness | kiting swarm |
| Soul Lance (Lances of Light) | LANCE through the densest line | power + Pierce | single / boss |
| Returning Pages | RETURN through a line, twice | Swiftness + Pierce | advancing crowd (stream) |
Glyph / lance / return: three ways a written word travels, all in the book fantasy. Pairs: count 1, power 1, Swiftness 2, Pierce 2. Swiftness is "barely changes damage" today (honest E1 text) and becomes real in W10 (gap + turn); Returning Pages makes it the flight length, so W10 must ship first. Nudge honesty: bolts are tree-gated, and the new gate comes after W10.

---

## 5. Chain Lightning (Captain Vane's spirit; stats Chains / Power / Cooldown / Jump range -> Arc)

**Third pair: Chains + Jump range (Arc).** Existing: Thunder Judgment = Chains + Power, Static Storm = Cooldown + Jump range. Chains + Arc = "how many arcs, how far they reach": the natural pair for lightning held on several foes at once. Power + Cooldown (alternative) is raw DPS, the stats everyone takes, so it would be the accidental default evolution. No shift.

### 5.1 One-tap
- **A (Recommended) Storm Tether:** lightning no longer jumps and vanishes: it holds crackling arcs on up to four foes at once and burns them steadily, each arc forking to one more foe beside it. Chains is how many arcs, Jump range how far they reach.
- **B Ball Lightning:** every few seconds a slow ball of lightning rolls out into the crowd and zaps everything around it until it pops.
- **C Forked Bolt:** every jump of the chain forks in two, so one strike spreads through a crowd like a branching tree.

### 5.2 Full
**A. Storm Tether** (proposed id `storm_tether`; verb TETHER, sub "arcs that hold")
- Fantasy/verb: TETHER. Vane's rod holds the storm on a rope like rigging in a gale. Distinct from Thunder Judgment (timed sky smite) and Static Storm (random strikes in a field); not Vane's planted Stormcall tower (nothing is planted).
- Trigger: ceil(Chains/2) arcs (2 -> 7 chains = 1 -> 4 arcs) lock onto the nearest foes within 120 + 0.6 x Jump range px (156-186 px); each arc ticks every 0.25 s x Cooldown/1.6 (0.25 -> 0.13 s) for 0.3x power and forks once to a foe within Jump range of its target at 0.5x. An arc re-locks at once when its foe dies or leaves reach. A lone foe gets ONE arc (no doubling: that is what keeps single/boss under the cap; measured: doubling gave single 7.4x).
- Look/sound: 1-4 steady white-blue arcs (violet fringe, BIBLE) from the hero's hand/rod to the foes, jittering 2-3 frames, a short fork spark from each target; gold rim only on the arc core. Low tier: straight lines, no jitter; reduced motion: no flicker. Cue `evo_storm_tether` (sustained hum per arc, one crack on lock).
- Card: **Storm Tether** / "Arcs of lightning that hold on and never let go."
- Numbers (measured vs today, @max): boss **1.91x**, single **1.85x** (home: a lone big foe), swarm 2.16x, kite 2.26x, stream40 1.88x. Cap@pick p1 <= 1.93x. Never below base: yes.
- Stats: Chains = arcs, Jump range = reach + fork reach, Power = damage, Cooldown = tick rate. All four live.
- Risks: an all-rounder (1.85-2.26x everywhere) could feel like the default chain pick; it is the latest gate of the three (section 7) and its kite/swarm stay under Thunder/Static's homes. W11 (first strike 1.5x, power +6, decay 0) raises the base single, so re-measure. Continuous arcs could hide small enemies (thin lines, alpha 0.8).
- Status: none (chain owns no status; no "charged" flag).
- Worth picking: the boss melts under steady arcs while the forks keep the crowd in check; base Chain Lightning is weak on a lone foe (44 DPS at max), so this is the chain's boss answer.

**B. Ball Lightning** (verb DRIFT)
- Every Cooldown x2 a ball rolls toward the densest cluster within 160 px at 50 px/s for 3 s, arcing to up to ceil(Chains/2) foes within Jump range every 0.25 s (0.4x). Several balls can be alive.
- Card: **Ball Lightning** / "A slow ball of lightning rolls into the crowd, zapping all around it." Est.: swarm 2.0-2.3x, kite 1.6-1.8x (balls left behind), single 1.3x, boss 1.4x, cap@pick ~2.3x.
- Risks: a moving field is close to Static Storm's field; St Elmo's fire fits a sailor but the ball looks like a bolt projectile.

**C. Forked Bolt** (verb FORK)
- Each jump forks to two foes (depth = Chains, cap 15 hits), Jump range = fork reach, damage per hit x0.7.
- Card: **Forked Bolt** / "Every jump splits in two." Est.: swarm 2.2-2.5x, kite 2.0x, single 1.0x, boss 1.0x, cap@pick ~2.6x.
- Risks: "a bigger chain", the very thing the principle rejects (no new verb); single/boss at the floor.

### 5.3 Chain coherence
| Evolution | Verb | Pair | Home |
|---|---|---|---|
| Thunder Judgment (Judgment from Above) | SMITE from the sky every 3 s | Chains + Power | kiting swarm |
| Static Storm (Living Field) | FIELD of strikes around you | Cooldown + Jump range | standing swarm |
| Storm Tether | TETHER: held arcs | Chains + Jump range | lone big foe / boss |
Sky / air / rope: three faces of one storm. Pairs: Chains 2, Jump range 2, Power 1, Cooldown 1. Jump range is "little change in a crowd" today and becomes real with W11 Arc; Storm Tether gives it a second strong meaning (reach). Gated after W11, so the nudge is honest when it appears.

---

## 6. Holy Orbit (Elias's spirit; stats Orb count / Orb power / Orbit size / Orbit speed)

**Third pair: Orbit size + Orbit speed.** Existing: Sanctum Halo = count + size, Judgement Wheel = power + speed. Size + speed = "how long the swing, how fast it goes": the natural pair for a censer on a chain. Count + power (alternative) are Elias's two strong stats; a recipe on them would be taken by accident nearly every run. Both size and speed become live with W4 (contraction ends the donut-hole trap) and the locked orbit-speed attack-rate bonus, which ship before this evolution. No shift.

### 6.1 One-tap
- **A (Recommended) Swinging Censer:** Elias's lantern-staff swings a brass censer of holy flame out at the nearest foe and back, a heavy blow at arm's reach and right at his feet, while his ring of lights keeps circling. Orbit size is the chain's length, Orbit speed how fast it swings.
- **B Vesper Tide:** the ring of lights breathes: it swells far out over the crowd, then draws in tight around Elias, again and again, so nothing is safe at any distance.
- **C Guardian Lights:** when a foe is about to touch Elias, the nearest light leaps in front of it and bursts, blocking the blow, then rekindles.

### 6.2 Full
**A. Swinging Censer** (proposed id `censer_swing`; verb SWING, sub "heavy and close")
- Fantasy/verb: SWING. A priest's thurible: Elias swings the candle-wheel lantern of his staff on its chain like a censer. Distinct from Halo (wide ring + ground), Bursting Lights (lights burst on touch) and Candle Wheel (planted ring, heal); no other weapon swings. The ring is kept, so the evolution is base + a new verb (never below base by construction).
- Trigger: the censer swings out and back along the line to the nearest foe (re-aimed each time it returns to the hand), sweeping a 1.6 rad arc; out to Orbit size x 1.8 (68 -> 122 px), back to 16 px; one swing per 2pi / Orbit speed s (2.9 -> 1.6 s). Hits on the path: (1.5 + 0.25 x Orb count) x power to the aimed foe (2.0x -> 3.25x), 0.3x to others it passes, once per foe per 0.35 s. Ring of lights unchanged (incl. W4 contraction, Candle Wheel priority).
- Look/sound: brass censer with a lilac-cream flame (Orbit role colour; Burn licks lilac), a soft incense-smoke ribbon (W2 ribbon, cream-lilac, VISUAL ONLY, never damages: so it does not copy Light Trails), a flame-flare on each heavy hit; gold rim on the censer only. Cue `evo_censer_swing` (chain clink + low whoomph on hit).
- Card: **Swinging Censer** / "A censer of holy flame swings out at the nearest foe and back."
- Numbers (measured vs W4 proxy, @max): hug **1.92x** (home: a foe pressed close, the one place base Orbit is weakest), kite 1.74x, stream40 1.30x, boss 1.28x, swarm 1.04x, single at 30 px INF (base 0 even with W4). Cap@pick p1: kite 2.62x (mortal; stream40 1.49x), hug 2.48x. Never below base: yes (>= 1.04x).
- Stats: Orbit size = chain length (reach), Orbit speed = swing rate, Orb count = lights in the ring AND heat of the censer, Orb power = everything. All four live.
- Risks: boss only 1.28x because W4 already wraps all lights round a big boss (measured: a boss-home censer would need hug > 3x; infeasible, so home = hug/elite, said plainly); censer hits are Holy Orbit hits, so the locked Burn rule applies to them (heavy hits = stronger Burn potency): Burn share gate <= 35% of Orbit damage must be re-checked; the swing hides behind Elias's sprite at 16 px (draw above the hero's shadow, below his body). Swarm 1.04x is close to the floor (acceptance >= 0.98x).
- Status: Burn via Orbit hits (locked source "Holy Orbit hits"; no new source); never Candle Wheel. No pin, no shove.
- Worth picking: the foe that reaches Elias is smashed every swing, and lone elites at arm's reach take heavy blows; skipping keeps a ring that barely touches what is pressed against him.

**B. Vesper Tide** (verb BREATHE)
- Ring radius breathes between 14 px and Orbit size x 1.7 every 2pi / (Orbit speed x 0.8) s; lights hit as the base (contact 1.0x, 0.5 s gate) at every radius; W4 contraction not needed while breathing.
- Card: **Vesper Tide** / "The ring breathes out over the crowd and in to your side." Est.: kite 1.6-1.8x, swarm 1.3-1.6x, hug 1.5-1.8x, boss 1.1-1.3x, cap@pick ~2.2x.
- Risks: still "the ring", only moving (weaker new verb); overlaps Halo's wide ring and W4 contraction's job; may read as wobble.

**C. Guardian Lights** (verb INTERCEPT)
- When a non-boss foe's edge distance to Elias < 10 px, the nearest light leaps onto it: 2.5x blast r20, its contact damage that frame is cancelled; the light rekindles in 3 s - 0.3 s per Orbit speed rank; Orbit size = intercept reach.
- Card: **Guardian Lights** / "A light leaps in front of every blow and bursts." Est.: hits taken -30-40%, hug 1.5-1.8x, swarm 1.2-1.4x, kite 1.0x, boss 1.0x (no intercept on bosses), cap@pick ~2.0x.
- Risks: a defence evolution under the 1.8x damage band (needs the band waived like Murder Storm's "hits taken"); overlaps Bursting Lights (burst on touch) and Candle Wheel (protect).

### 6.3 Orbit coherence
| Evolution | Verb | Pair | Home |
|---|---|---|---|
| Sanctum Halo (Consecrated Ring) | HALO + burning ground | Orb count + Orbit size | standing swarm |
| Judgement Wheel (Bursting Lights) | BURST on contact, rekindle | Orb power + Orbit speed | kiting swarm |
| Swinging Censer | SWING, heavy and close | Orbit size + Orbit speed | foe pressed close / elite |
Ground / burst / swing: three priestly tools of one flame (consecrate, judge, cense). Pairs: count 1, power 1, size 2, speed 2. Name check: "Candle Wheel" (ability), "Judgement Wheel" (evolution) and the censer are three different shapes (planted ring, burst ring, swinging object). Run 1: only Halo shows; Elias players meet the censer late (section 7).

---

## 7. Gating for 15 evolutions (proposal; progression-gates-v1 rules, existing condition types only)
Ladder per weapon: **1st** = taught (run 1 or a fast gate), **2nd** = mid gate, **3rd** = mastery gate needing that weapon evolved twice plus one play goal that fits the new verb. Recipes stay hidden; evolution gates `hidden: true` (??? until progress), small gold claim cost, permanent.
| # | Unlocks | Condition (proposed) | Fits | Bot run est. |
|---|---|---|---|---|
| 13 | Swinging Censer (Orbit 3rd) | Evolve Holy Orbit 3 times AND play 8 runs as Elias | the priest's own tool | ~8-14 (est.) |
| 14 | Mercy Wings (Ravens 3rd) | Evolve Raven Flock 2 times AND slay 3000 Root Crawlers | finish the slow, tough ones | ~14-18 (est.) |
| 15 | Returning Pages (Bolts 3rd) | Evolve Spirit Bolts 2 times AND clear Cursed Forest 2 times | read to the end | ~14-20 (est.) |
| 16 | Storm Tether (Chain 3rd) | Evolve Chain Lightning 2 times AND defeat the Elder Treant 5 times | a boss tool | ~20-30 (est.) |
Run-number estimates are reasoned from the gates-v1 table (bot ~190 crawlers/run; Elias half of runs), NOT measured: the gate data chunk measures them with `gates-pace.mjs 12 40` (target: third recipes land in runs ~10-30, never all at once).
What the no-tree player sees: run 1 is unchanged (Wolves + Orbit, Howling Legion + Sanctum Halo only; gated evolutions give no gold card, no nudge, no "Something stirs"). After the run, the results nudge can point at the closest gate. In the tree (sheet #5), each weapon cluster shows THREE evolution sockets (one lit for starters, two as ???), which teaches "every weapon has three" without naming recipes.
Starter set stays two evolutions (locked progression row); no third evolution is run-1.

## 8. Build chunks and acceptance gates
Each chunk: `npm test` green, `npm run build`, `npm audit`, starter sweep byte-identical (all four are gated), probe table (5 seeds) attached, screenshots true size + phone, Security + Fit + LOCKED-conflict lines, Matt playtests, stop. Data first: evolution entry in `evolutions.json` (new id, pair, verb/sub, desc true on day one), card icon, codex line, E9 pick-beat cue.
| Chunk | After | Contents | Acceptance (5 seeds, measurement standard 2.3) |
|---|---|---|---|
| T3a Censer | W4 + Burn, W5 | censer unit + swing path, aim re-pick, per-foe gate, ring kept, Burn on hits | hug 1.8-2.3x vs W4 base; never below base (>= 0.98x) incl. swarm and boss; cap@pick p1 <= 3.0x stream40/single/boss/hug; Burn share <= 35% of Orbit; Candle Wheel still wins the ring; test: censer never hits beyond chain length |
| T3b Mercy Wings | W8a, W8b, W9 | weakest-first claim pick, chained finishes (max 3), nearest fallback, boss bonus off | kite or swarm 1.8-2.3x vs W8a base; boss <= 2.3x and >= base; cap@pick p1 <= 3.0x; tests: low-health bonus never on boss, max 3 finishes, ravens spread (distinct targets) |
| T3c Returning Pages | W10 | out/back glyph with per-throw hit set, catch radius, steering until first hit | stream40 1.8-2.3x; single <= 2.5x; never below base in kite/swarm/boss; cap@pick p1 <= 3.0x stream40/single/boss; test: a foe is hit at most once per throw |
| T3d Storm Tether | W11 | arcs = ceil(Chains/2) max 4, one fork each, re-lock on death, tick floor after tree mods | boss/single 1.8-2.3x; swarm/kite <= 2.3x; cap@pick p1 <= 3.0x; tests: one arc per foe, arcs never beyond reach, tick never < 0.1 s with tree mods |
| GT3 gates | after the first of T3a-d | 4 hidden gate nodes `gt_<id>` in `tree.json`, `treeGate:true`, sanitiser whitelist via existing evolution unlock plumbing, gates-pace | pacing table measured; tests as gates-data (no leak before unlock, hidden reveal, no recipe text) |
| E9 rows | with each T3 chunk | pick beat: Censer's first swing at the nearest foe; ravens' first omen ring; first glyph throw; arcs snap on | screenshots; sweeps byte-identical (render only) |
Codex lines (draft): Censer "He swings the light the way his church once did." Mercy "No one fades alone while the ravens watch." Pages "Every name read out comes home to the page." Tether "Vane never lets go of a storm."

## 9. Decisions for Matt (weapon by weapon)
1. **Ravens third:** (Recommended) A Mercy Wings / B Last Letters / C Vanguard.
2. **Bolts third:** (Recommended) A Returning Pages / B Splitting Glyphs / C Lingering Letters.
3. **Chain third:** (Recommended) A Storm Tether / B Ball Lightning / C Forked Bolt.
4. **Orbit third:** (Recommended) A Swinging Censer / B Vesper Tide / C Guardian Lights.
Defaults taken (reversible, listed for override): the four recipe pairs in sections 3-6; gate conditions in section 7 (tuned by gates-pace in GT3); proposed ids (permanent once shipped, R9) and names (Matt reviews at build).

## 10. Conflicts checked against docs/LOCKED.md
- EVOLUTION COUNT / recipe rule: met (3 different pairs per weapon, all four stats covered, shared stats as on wolves).
- EVOLUTION RULES: stats keep ranking (worth = cap@pick, measured); Rend untouched; **Burn sources**: censer hits are Holy Orbit hits, so they apply Burn under the locked "Holy Orbit hits" source; flagged for Matt to confirm (alternative: censer applies no Burn). Never Candle Wheel: kept.
- Status set: no new status; no "charged" flag (Tether), no fear/pin on bosses, raven low-health bonus is not an enemy-side amp (W8b cap unaffected; state it in W8b).
- Progression gates: starter set unchanged (two evolutions); new gates use existing condition types; "gate nodes may require only gate nodes" respected.
- Weapons v1.1 build order: each T3 chunk sits after its weapon's W-chunk; nothing reorders the locked chain.
- No conflict found that needs a Reopened line.

Right now: Matt picks A/B/C per weapon (4 one-tap questions). Next: record picks in LOCKED, then the locked build order continues (B1 -> D1 -> W7 -> W4+Burn ...); T3 chunks slot after their weapon chunks. Parked: Mara/Isolde/Vane hero art and abilities (these evolutions are designed to fit them when they arrive).

**Security check:** docs + one read-only analysis script (imports Sim/weapons in memory, wraps behaviours in-process only, no file writes, no network, no new dependencies; `PT` env parsed with JSON.parse, unknown ids/keys and non-finite values rejected); no src/data/tests change; new evolutions add no save fields (gate unlocks go through the existing sanitised `unlock:'evolution'` path).
**Fit check:** every verb belongs to its spirit and hero (Mara's ravens free the fading, Isolde's glyphs return to the book, Vane holds the storm on a rope, Elias swings a censer); colours stay in role (violet ravens, cyan glyphs, white-blue arcs, lilac-cream flame), gold only as the evolution rim, red never used; finishes release freed light (Hollow identity, bittersweet not grim); options that copy another verb (Splitting ~ chain jump, Lingering ~ trails, Forked ~ bigger chain, Guardian ~ bursts/Candle Wheel) are offered only as contrasts.
