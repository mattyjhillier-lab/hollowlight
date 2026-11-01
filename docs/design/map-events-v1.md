# Map events v1 - "Hollow Places" (design sheet, NOT built)

Status: DESIGN for Matt's pick (LOCKED 'MAP EVENTS IN v1', 2026-10-28: small set of 2-3 event types in v1). Research + design only; no code, no data touched.
Builds on: docs/research/30-world-and-maps.md (2026-10-15 research, not redone), LOCKED 'World / map events' (phased: cheap pulls, then Grey Well + lanterns, then elites + chests; seeded landmark slots; life map visual only; chest rules; phone compass = edge arrows + tiny optional minimap), world sheet #2 (ws6 already draws 6 POI looks: well, lanterns, den, nest, grove, chapel; W7 zones / W8 POI art), EN6-EN9 (Branch-Mane + Lantern Reliquary built), DT0-DT2 tiers + marks, EXTRAS (Gentle Light, Endless Dusk), FINAL RETUNE TARGETS.

## 0. Repo facts this sheet relies on (checked 2026-10-28)
| Fact | Where |
|---|---|
| Run 900 s; boss Elder Treant at 14:00 (840 s); Root Ring arena; waves stop at the boss | balance.json runSeconds, chapters.json bossAt, src/sim/boss.js |
| Swarms at 1:00 2:30 4:00 5:00 6:00 7:30 9:00 10:00 11:00 | chapters.json events |
| Branch-Mane miniboss 3:20 / 7:00 / 11:30 (30 s warning), drops heart + Lantern Reliquary (tier odds, floor heal 30% + XP 0.5 level + 25 gold; Medium + Blessing 1 of 3; Large + free stat rank); Long Night adds one at 8:20 | chapters.json minis, balance.json chest, LOCKED EN6-EN9 |
| World 4000x4000, hero starts at the centre, spawnDistance 340, maxEnemies 240; Wren ~110 u/s, Elias 76 u/s (an 800 u trip = ~7 s / ~10.5 s) | balance.json, research 30 |
| 3x3 authored zones (visual): Dead Grove / Meadow Run / Root Thicket; Mossy Hollow / Start / Old Road; Graves / Meadow / Chapel | src/world/zones.js |
| Separate seeded RNG streams already used so off-paths stay byte-identical: markRng (Hollow marks), keepRng (keepsakes) | src/sim/Sim.js 83-88 |
| No edge arrows or minimap exist yet; tree node 'Lantern Compass' (inert) reads "Edge arrows also point to chests and to the next miniboss" | src/data/tree/tools/cardfan.json |
| Bot steering: flee foes within 90, gems within 200, a chest within 300, drift to centre; no event logic | scripts/bot.mjs botInput |
| Gold per winning bot run ~1,800 (economy readout); Deep Dusk gold x1.5; boss shards 5 / 7 / 10; Dawnglass only on harder nights, run cap 6 / 10 | LOCKED T3b, T3c, DT1, B5-B7 |

## 1. Research (brief; full tables in research 30)
| Game | What it does | Lesson for us | Label |
|---|---|---|---|
| Vampire Survivors | Braziers (light sources) break into random pickups (10% spawn, cap 10 on screen); relics on the floor with a green arrow; chests from bosses with tier odds (small common, 5-item rare) | Things NOT carried to you are the reason to move; an arrow is enough UI; tiered containers with a useful floor | COMMUNITY (vampire.survivors.wiki) |
| Halls of Torment | Stage 1 blood-trail altar: two shrines, kill foes inside circles, count shown over the shrine; reward a token that weakens the stage boss | A place + a visible count + a reward tied to the run's goal; optional; one per stage | COMMUNITY (Steam forum, gamezebo guide) |
| Megabonk | Charge Shrine: stand in a circle, leaving resets, pick 1 of 3 boosts; Challenge Shrine summons a marked group, kill all for a chest; Greed shrines opt into difficulty; green map markers | Hold-a-zone and marked-group are the two proven verbs; opt-in risk for experts | COMMUNITY (fan guides) |
| Brotato | Destructible trees drop crates with diminishing chance per wave; elite waves drop a legendary crate + heal | Pity / diminishing returns stop luck stacking; elites = the big container | COMMUNITY (brotato wiki) |
| 20 Minutes Till Dawn | Mysterious Trees: hitting one wakes all of them and adds a secret boss | Trap objects work when the risk is shown; ours stays readable instead | COMMUNITY (wiki) |
| Death Must Die | Store / forum mention shrines and guardians per circle; no mechanics found | Do not cite numbers | COMMUNITY, UNVERIFIED |
| Spirit Hunters: Infinite Horde (Matt's reference) | Mines, chests and pet cages open by standing in a growing circle; minibosses drop a purple chest | Our "stand in the light" verb matches the reference Matt likes | COMMUNITY (research 19) |
| Diablo 4 shrines | The buff icon is shown before you touch it | Reward visible BEFORE commit (Matt's requirement) | COMMUNITY |
| Off-screen indicators | Arrow where the target line crosses the screen edge, hide when on-screen, test the behind-camera jump bug; few marks, big enough to read in action | Max 2 arrows, icon on the arrow, distance pips | COMMUNITY tutorials (research 30 section 2) |

OPINION (ours): (1) the strongest pull is a FIXED place you can see the reward of and choose when to go; (2) each event needs one verb that is not "kill everything" (our weapons kill everything already); (3) rewards are a choice of small things, never raw multipliers; (4) phone: no new input, walk-in only, rings big enough to stand in with a thumb on the stick.

## 2. The three slots (why these three)
The run already has the time spine (swarms, three Branch-Manes with chests, the boss). What it lacks is a reason to cross SPACE. So the three slots are three different reasons to travel, each with a different risk:
1. **REST site (safe, near, hold):** a place that gives back (heal, XP) for standing still briefly. Teaches the system in minute one. Risk = foes keep coming while you stand.
2. **ROUTE site (travel, far, chain):** a set of points across the map; the trip itself is the challenge and it paints a road of colour. Risk = exposure while moving, a timer.
3. **RISK site (opt-in fight at a place):** a corruption source you choose to attack; it fights back. Risk = real damage; pays the best (Blessing, soul shard).
Rejected as a slot: an ambush / elite site (the Branch-Mane already owns "elite + chest"; a second elite would blur it); destructible lamps alone (cheap pull, but no "place" and no reward preview; kept as an option inside slot 1).

All three share one shape language (world sheet ws6): a grey sleeping object with ONE cold ember; an awake site shows a soft cream ring on the ground and a floating OFFER BADGE (round icons of what it pays); completing it floods colour into the life map (render only, V1 'POIs write to the map', already locked as visual) and the object stays restored with a small lasting glow so the player sees what they did.

## 3. Options per slot (three each, recommended first)
Units: **L** = one level's worth of XP at the current level, paid as gems that hang then fly in (EN8 chest-gem style), same unit as the chest's xpLevel 0.5. Gold is run gold (banked at results like all gold, so Deep Dusk x1.5 applies automatically). Distance bands are measured from the map centre (the start): NEAR 600-1000 u, MID 1000-1500 u, FAR 1500+ u (never within 250 u of the edge or 700 u of another site; never on a root patch).

### SLOT 1 - REST site
**1A Grey Well (Recommended).** Verb: *stand in the well's light and let it fill.* A mossy stone well with a half-raised bucket (bible detail), grey, one ember at the bottom. Awake: cream ring r 64 on the ground. Stand inside: a soft arc fills around the ring over 4 s; leaving PAUSES the fill (it drains back 20% per s after 2 s away, never resets instantly). Sound: wooden bucket creak on enter, rising water chime while filling, warm swell + bell on done.
- Reward (badge shows heart + gem; far wells add a coin): NEAR heal 20% max HP + 0.35 L + 10 gold; MID heal 20% + 0.5 L + 15 gold; FAR heal 25% + 0.65 L + 20 gold.
- Count / timing: 3 per run, wake at 0:40 (NEAR, in Start/Mossy Hollow), 4:20 (MID), 9:30 (FAR). Awake until claimed or 13:30.
- Celebration: water spout of light, colour floods r 260 around the well (largest life write in the run so far), "+15" brass pop, gems spill and fly in, toast "The well remembers." (Reduced motion: no spout, flood fades in.)
- Why first: safest teacher of the system; Wren's/Elias' lantern lights it (fits); heal makes it want-to-go when hurt; zero new enemy code.
- Risk: camping (capped at 3, 4 s); Long Night hearts are deliberately slower, so its heal is cut there (tier knob 15%).

**1B Lamp Posts (cheap scattered pulls).** Verb: *touch cold lamps as you pass.* 24 cold lamp posts scattered on the seeded slots; walk into one to light it (instant). Each: 40% gem burst 0.1 L, 25% 6 gold, 15% heart (only if hurt), 5% magnet, 15% nothing but colour. Badge: none (a lamp is a lucky dip). Celebration: small flame pop + r 90 colour. Totals cap: max 12 lit pay, the rest only colour.
- Pros: constant small reason to wander, no UI. Cons: no reward preview (breaks Matt's "visible before commit"), no felt "event", the weakest pull to FAR places.

**1C Stand of Memory (charge shrine, pick a boon).** Verb: *hold the grove's memory, then choose.* A ring of bare grey trees, one with a memory of green. Hold 6 s inside r 80 (pause, not reset), then pick 1 of 3 TEMPORARY boons for 60 s: Swift Light (+12% move speed), Wide Lantern (+40% pickup radius), Kindled Spirits (+10% weapon damage). 2 per run (3:00 MID, 8:30 FAR). Badge: three small cream sparks (choice). Sound: leaves rustle, three soft notes as the boons appear.
- Pros: a real choice; a felt power spike. Cons: new temporary-buff system (sim + UI + tests), timed buffs overlap Blessings' effects (combined caps then need a temp-buff rule), 60 s buffs are easy to waste in a lull.

### SLOT 2 - ROUTE site
**2A Lantern Road (Recommended).** Verb: *carry your light lantern to lantern and relight the old road.* Three cold lantern posts on a seeded line along the Old Road / Meadow (spacing 700 u road 1, 900 u road 2). Touch any one to start; the other two light up their embers and edge arrows point at them; a thread-style timer (90 s road 1, 110 s road 2: sized for Elias at 76 u/s, 1,800 u = 24 s of walking, so the timer is about fighting your way, not sprinting) fills on the HUD chip. Sound: each lantern a bell note rising a step (do, mi, so); done = all three chime together.
- Reward (badge on the first lantern: coins + the set prize icon): each lantern lit 0.15 L + 5 gold (road 1) / 8 gold (road 2); SET on road 1: magnet pulse (all gems on the map fly to you) + 25 gold + 0.5 L; SET on road 2: **Blessing choice 1 of 3** (the existing 'chestBless' offer screen) + 35 gold.
- Fail: timer runs out = lit lanterns keep their small rewards, the set prize is lost, the road goes quiet (no retry, no penalty).
- Count / timing: 2 per run: road 1 wakes 2:40 (MID), road 2 wakes 8:00 (MID-FAR, on the far side of the map from the hero at wake).
- Celebration: the strongest identity moment: a ribbon of colour runs along the ground between the three lanterns (life-map line write, render only) so the run's mural gets a real road; brass pops; toast "The old road is lit." The lit road stays for the run (visible on the optional minimap).
- Why first: the only option that makes the player cross the map on purpose AND leaves a permanent mark of it; travel is the risk, so it suits skilled movement, not tanking; reuses existing Blessing offer + magnet.
- Risk: the timer can feel like a chore (generous timer, no penalty); Wren vs Elias speed gap (timer sized for Elias; measured).

**2B Lost Reliquary (far fetch chest).** Verb: *go and dig out what the Hollow buried.* One half-buried Lantern Reliquary per run at a FAR site, shown from 1:30 by an edge arrow with its tier glyph; walk onto it to open. Tier odds by distance band: MID 40/50/10, FAR 20/55/25 (pity rule shared with the Branch-Mane: never two Large). Uses the built chest exactly (floor heal 30% + 0.5 L + 25 gold; Medium + Blessing; Large + free stat rank). Sound: the existing chest cues.
- Pros: almost no new code; clear reward; obvious. Cons: a 4th chest dilutes the Branch-Mane's chest moment; walking to a box is the least interesting verb; no colour-road payoff.

**2C Wandering Wisp (chase).** Verb: *catch a lost spirit before it fades.* A grey lost wisp appears 700-900 u away and drifts AWAY from you at 60 u/s (slower than Elias), weaving; it fades after 25 s. Catch it (touch) = it takes your colour and flies home: 0.4 L + 30 gold + a heart if hurt. 3 per run (2:00, 6:30, 10:30). Badge: coin + gem on its arrow. Sound: a little lost hum, a happy trill on catch.
- Pros: fun, cheap, and on-theme (spirits). Cons: it drags players into crowds with no warning; it is a moving target (hard to read on phone); no place to restore.

### SLOT 3 - RISK site
**3A Hollow Knot (Recommended).** Verb: *burn out the corruption at its root.* A pulsing knot of black roots in the Root Thicket / Dead Grove / Graves (B zones), with dark veins spreading on the ground around it (life map negative, render only: the creeping Hollow made visible). Sleeps until you come within 260 u, then wakes: a cold ring around it, a HP ring over it.
- Fight: fixed HP (no hpScale, like the Branch-Mane) MID 900 / FAR 2,000 x tier enemy HP. Every 3 s it sprouts 2 knot-born Root Crawlers from its roots (cap 14 alive from the knot; spawns pause while live foes > 200 and during a swarm's arrival second). Every 6 s a ROOT PULSE: 0.8 s tell (veins light cold around it, ground decal r 90, DR shared style), then 10 x dmgScale to anyone inside. Never moves. Walk away past 420 u: it heals back to full over 10 s and sleeps (no penalty, retry any time).
- Reward (badge: Blessing card icon; FAR adds a shard icon): MID: 0.6 L + 35 gold + a heart; FAR: **Blessing choice 1 of 3** + 0.5 L + 55 gold + **1 soul shard** (max 1 shard per run from events, any tier).
- Count / timing: 2 per run: MID wakes 5:30, FAR wakes 9:20 (picked as the far slot furthest from the hero at wake).
- Celebration: the knot cracks with a warm flash, light runs OUT along every vein turning them to living roots, colour floods r 320 (burning corruption away = the Hollow identity rule C exactly); "+1 shard" pop in shard colour; toast "The root is clean."
- Why first: the identity's tug of war as a place; one readable tell; the fight comes TO a place you chose, so risk is opt-in and scales with distance; reuses Root Crawler and the DR tell style.

**3B Hungry Lantern (greed vow).** Verb: *feed a hungry flame with the Hollow and see if you live.* A cracked lantern with a grey flame. Touch to accept: for 40 s spawns around you are x1.8 (from the view edge, counted in the cap) and the lantern's flame grows with each kill near it. Survive the 40 s: reward by kills, bands 0-60 / 61-140 / 141+: 30 gold + 0.4 L / + heart / + Blessing choice. 1 per run, wakes 6:30. Badge: a flame with three pips (shows the tier you are on while it runs).
- Pros: classic opt-in risk (Megabonk greed); self-scaling. Cons: rewards kill speed (Chain Lightning / evolved wolves trivialise it, as research 30 warns); a whole-screen density spike is hard to read on phones; no place to restore.

**3C Grey Circle (marked hunt).** Verb: *break the circle of marked hunters.* A ring of standing stones; touch the centre stone and 12 marked foes (a cold mark ring, existing marks look) step out of the view edge over 6 s; kill all 12 within 45 s (count shown over the stone). Reward: Blessing choice + 40 gold; partial (8+) = 0.5 L + 20 gold. 2 per run (5:00 MID, 9:40 FAR). Badge: Blessing icon + "12".
- Pros: HoT / Megabonk proven pattern; counts only its own foes so fast weapons do not trivialise it. Cons: closest to the Branch-Mane's howl wolves (overlap); a kill-count timer is the most "chore" feeling; marks visuals mean something else on harder nights (confusing).

## 4. Recommended set and totals (1A + 2A + 3A)
Seven sites per run, about one quiet beat every ~1.5-2 min between the existing swarms and minis:
| Time (wake) | Site | Band |
|---|---|---|
| 0:40 | Grey Well 1 | NEAR |
| 2:40 | Lantern Road 1 | MID |
| 4:20 | Grey Well 2 | MID |
| 5:30 | Hollow Knot 1 | MID |
| 8:00 | Lantern Road 2 | MID-FAR |
| 9:20 | Hollow Knot 2 | FAR |
| 9:30 | Grey Well 3 | FAR |
Wake pings never fall within 15 s of a swarm or inside a Branch-Mane's 30 s warning (all times above checked against 60/150/240/300/360/450/540/600/660 and 170-200/390-420/660-690). Sites stay awake until claimed; at 13:30 the toast "The Hollow takes back what is left" and unclaimed sites sleep for good (nothing ever runs into the 14:00 boss arrival; knot-born crumble with the rest at 14:00).

Ceiling if EVERY site is completed (a strong player; typical players finish ~half):
| Reward | All-complete ceiling | Typical (~half) | Bound / comparison |
|---|---|---|---|
| XP | ~3.9 L (wells 1.5, road lanterns 0.9, road 1 set 0.5, knots 1.1) | ~2 L | ~8-10% of run levels (research 30 target 8-12%) |
| Gold | ~230 (wells 45, roads 99, knots 90) | ~120 | ~13% / ~7% of a ~1,800 winning run; Deep Dusk x1.5 applies to all run gold |
| Heal | 65% max HP (wells) + 1 heart (MID knot) | ~45% | about two extra hearts; Long Night wells 15% |
| Blessings | max 2 (road 2 set, FAR knot) | ~1 | Blessing caps + combined caps already clamp stacking |
| Soul shards | max 1 per run (FAR knot) | ~0.4 | boss pays 5 / 7 / 10; see economy flag below |
| Magnet | 1 pulse (road 1) | ~0.6 | existing magnet pickup |
| Dawnglass | 0 new (knot-born may roll marks on Deep Dusk / Long Night via markRng and count toward the EXISTING marked-foe cap 2 / 3) | - | no new Dawnglass income |
| Stat ranks / evolutions | none (never names or completes a recipe; Large chest stays the only free rank) | - | hidden-recipe + gates rules kept |
| Codex / Almanac | new Almanac page "Hollow Places" (3 entries: well, road, knot; lore + lifetime counts); tree condition leaf `sitesRestored` for a later cosmetic / QoL lantern only (tree power budget is full) | - | zero power |
| Bond | none (Bond pace is locked) | - | - |

Risk scales reward (so moving is a real choice): NEAR < MID < FAR on every site (well heal/XP/gold rise with distance; road 2 is longer and pays the Blessing; the FAR knot has 2.2x the HP and pays Blessing + shard). The badge always shows the bigger prize so the far choice is visible.

## 5. Finding it, seeing the prize, feeling the win (phone first)
- **Offer badge** above each awake site: 1-3 round icons (heart, gem, coin, cream Blessing card, shard), the same icon set as cards / results. Readable at the 40 px phone hero scale (badge icons 14 px logical = ~22 css px on a phone).
- **Edge arrows**: max 2 at once: the nearest awake site and the ACTIVE one (road timer / knot fight). A soft cream chevron on the screen edge outside the locked HUD area (12/14/16% budget), the site's main icon inside it, 1-3 distance pips (NEAR/MID/FAR); hidden while the site is on screen; the behind-camera jump bug is tested. Wake ping: one quiet chime + the arrow brightens for 3 s (no banner; banners stay for Branch-Mane / boss).
- **Objective chip** only while a site is active: "Lantern Road 2/3 · 54 s", "Grey Well" with the fill arc, "Hollow Knot" with HP. Auto-hides.
- **Minimap**: tiny optional corner map (locked as optional, real-phone tested): hero, awake sites with badges, restored sites as warm dots, the lit roads. Default ON desktop, OFF phone (Settings toggle). Chunk E5, can slip to after launch if phone tests fail.
- **Lantern Compass** (inert tree node) fits as written: base arrows point at sites; the node ADDS chests and the next miniboss 20 s early. Becomes live in E5 (zero power, already in the tree).
- **Celebrate** every completion: colour flood (life-map write, render only), site sound sting, brass number pops for gold, gem spill, shard pop, one short toast; results screen line "Hollow Places restored: 5 of 7" with the three icons.

## 6. Interplay
| With | Rule |
|---|---|
| Swarms | wake pings avoid +-15 s; a site in progress keeps going (player's risk); knot spawns pause during a swarm's arrival second and while live foes > 200 |
| Branch-Mane | no wake inside its 30 s warning; its leash (500 u) is unchanged; fighting both at once is allowed and is the player's choice |
| Boss | 13:30 sleep; nothing active at 14:00; Root Ring unchanged; knot-born crumble with all foes |
| Blessings | event Blessings use the existing 'chestBless' offer queue; all caps / combined caps apply; if no Blessing can be offered (all capped) the floor is 0.5 L + 25 gold (chest floor rule) |
| Chests | separate source; the Large pity rule stays per Branch-Mane chests only; a road/knot Blessing never consumes chest pity |
| Gentle Light | knot pulse and knot-born hits take the x0.70 foe damage and x0.90 speed like every foe; rewards unchanged (gold/shards pay normally per the assist lock) |
| Endless Dusk | no site wakes after dawn (Endless targets were measured without them); unclaimed sites are already asleep; revisit when Endless is retuned |
| Tiers (data in tiers.json, Twilight = base) | Deep Dusk: knot HP x tier enemy HP, pulse every 5 s, knot-born may roll marks (markRng, existing caps); all event gold x1.5 via the tier gold rule. Long Night: as Deep Dusk + knot spawn x1.25, well heal 15% (hearts are slower there on purpose). Dawnglass: no new source |
| Saves / banking | gold and the shard ride the existing bankRun path (one more clamped field: `sitesShard` 0..1 per run; lifetime `stats.sites` counts 0..1e9, sanitised, hostile tests); debug runs (?auto, ?t=, ?tier=) never bank, as today |
| Life map | visual only: completions write life (well r 260, road line, knot r 320 + vein burn); the corruption around a sleeping knot is a visual write too; NO gameplay reads the life map (lock kept) |

## 7. Sim impact, determinism, bots, tests, measurement
**What changes the sim:** site placement, wake/sleep timers, the hold / touch / fight logic, knot-born spawns and the pulse hit, the reward payouts (XP, gold, heal, Blessing offer, magnet, shard counter). Rendering (badges, arrows, chip, minimap, colour floods, sounds) is render-only and reads published `sim.sites` state (same pattern as `sim.bossTells`).

**Byte-identical default path:**
- Data-driven: a `sites` block in chapters.json (per chapter; validated by a new src/sim/sites.js; bad data fails CLOSED = no sites, like Blessings / tiers). Sim option `sites` (true in the game when the chapter has the block; bots via `SITES=0|1`).
- Own RNG stream `siteRng = createRng(seed ^ 0x51735)`, created always, drawn ONLY when sites are on; placement draws at construction, knot-born spawns take an `rng` argument so they do not draw from `sim.rng` (spawnEnemy's chargeCd / aiCd rolls would otherwise shift the main stream). Once event foes and rewards exist the run diverges (expected); with `SITES=0` every sweep must be byte-identical to HEAD (wren / elias 24 seeds diffed, as every past chunk).
- Placement uses chapter data rectangles per zone (mirrors zones.js; the sim does not import render code) with the distance rules in section 3; deterministic per seed (test).

**Bot support (scripts/bot.mjs + gates-lib.mjs botInput, shared helper scripts/sitebot.mjs):**
- `SITES_BOT=calm` (default, human-like): if a site is awake within 1,200 u, hp > 50%, no imminent dodge: add a pull of weight 0.7 toward it (gems 0.6, chest 0.8 for scale). Well: once inside the ring, flee weight x0.5 so it stays in. Road: go to the nearest unlit lantern. Knot: approach to weapon reach (orbitReach / 140 u), kite at 120-160, leave above 50% knot HP if own hp < 35%.
- `SITES_BOT=greedy` (always goes, ignores hp) and `never` (ignores sites, but they still exist) bracket human behaviour; the gap between them is the event's real power share.
- Bot reports: per-site completion %, time to complete, deaths during a site (`hurtBy.knot`, `hurtBy.pulse`), reward totals (XP L, gold, Blessings, shards).

**Balance targets at risk (LOCKED FINAL RETUNE TARGETS + CLAUDE.md):**
| Target | Expected effect (OPINION, to measure) | Stop rule |
|---|---|---|
| Fresh-profile Twilight win 15-30% | +2 to +5 pts (Blessing + XP + heal) minus travel deaths | > +5 pts or out of band: trim rewards (XP first, then road-2 Blessing to gold), never enemy scaling, then Matt decides |
| No deaths before 5:00 | small risk from road 1 (2:40) travel | any rise > 2 pts: road 1 wakes later / shorter spacing |
| Deaths spread 6-14 min | knot fights may add 6-10 min deaths (wanted) | report |
| First evolution timing / evolution 1.8-2.3x | +XP brings evolution ~10-20 s earlier; evolution multipliers untouched | report; > 30 s earlier: cut XP |
| Abilities a modest share | untouched | - |
| Wren vs Elias gap small | Elias slower: travel risk and road timer hit him more | gap > 5 pts: longer road timer / shorter spacing (not hero stats) |
| Boss: reach-win 60-75%, boss 20-35% of defeats, 75-100 s fight | more Blessings before the boss may lift reach-win | report, Matt decides |
| Mid-tree 30-55%, full tree + max Bond 65-90%, Long Night 10-20% full tree | small lift on all | report per cell |
| Gentle Light band, Endless 3-6 min | Gentle unchanged in rules; Endless no sites | report |
| Economy (first Deep Dusk clear ~run 11-25; tree ~43 bot runs) | +~7% gold typical, +~0.4 shard per run | economy readout (scripts/review/t3-econ.mjs) re-run; flag if runs-to-tree moves > 10% |
**Measurement plan:** before/after matrix with the existing rt-matrix.mjs cells (fresh / mid / full x Wren / Elias x Twilight, plus Deep Dusk and Long Night full-tree), 96 seeds random + 48 FOCUS, `SITES=0` vs `SITES=1 SITES_BOT=calm`, plus `greedy` / `never` on the fresh cell; report +-95% CI (about +-9 pts at 96 seeds); event power share = (calm - never) win-rate delta, must be <= 5 pts (same "modest share" rule as abilities); sweeps with `SITES=0` byte-identical.

**Test plan (tests/sites.test.mjs, node):** data validator fails closed (missing / out-of-range / unknown kind); placement deterministic per seed and obeys distance / edge / root-patch rules over 500 seeds; SITES off = no siteRng draws and identical sim.state snapshot; wake times never inside the protected windows; 13:30 sleep, nothing active at 14:00; well hold pause-and-drain (not reset); road timer, fail keeps lantern rewards, no retry; knot leash heal-back, spawn cap 14, pauses > 200 foes, pulse tell 0.8 s then one hit; rewards: per-run caps (Blessing <= 2, shard <= 1, gold ceiling), Blessing floor when capped, never a weapon / stat / evolution card; tiers (Twilight = base values, Long Night well 15%); Gentle Light multipliers reach knot hits; Endless wakes nothing; banking: forged `sitesShard` / counts clamped, debug runs never bank; render: badge / toast text built with textContent only (no innerHTML).

## 8. Build chunks (small, ordered; each fully verified per the definition of done)
| Chunk | What | Visible result / done-check |
|---|---|---|
| E0 | sites.js validator + chapters.json `sites` data + siteRng placement + `sim.sites` state (no behaviour) + tests; `?debug=1` shows site dots | tests green; SITES=0 and SITES=1 sweeps byte-identical (no behaviour yet) |
| E1 | Render: grey/awake/restored site props from ws6 looks, offer badges, edge arrows (2 max), colour floods; no rewards yet | screenshots 640x360 + phone; arrow edge cases |
| E2 | Grey Well (hold, rewards, celebrate) + bot `calm/greedy/never` helper | well completion %, fresh-cell sweep, byte-identical with SITES=0 |
| E3 | Lantern Road (chain, timer chip, road colour line, set prizes incl. Blessing offer) | road completion % W/E, timer fairness |
| E4 | Hollow Knot (knot, knot-born, pulse tell, leash, shard banking) | knot win/death share, shard bank tests |
| E5 | Tiers / Gentle / Endless / 13:30 sleep, results line, Almanac page, `sitesRestored` leaf, Lantern Compass live, optional minimap + Settings toggle | real-phone check (Matt) |
| E6 | Full measurement matrix + report; Matt playtests | numbers vs targets; Matt decides any move |
Audio stings join the AU pipeline (code-made, no downloads).

## 9. Risks
| Risk | Mitigation |
|---|---|
| Chore feel | all optional, no fail penalty, wake pings quiet, ~7 sites |
| Power creep with Blessings / chests | 2 event Blessings max, caps clamp, ablation <= 5 pts |
| Elias penalised by travel | road timer sized for 76 u/s, measured gap rule |
| Phone clutter | 2 arrows max, badges only on awake sites, minimap off on phone by default |
| Busy screen during a knot fight | one tell type, knot-born cap 14, pauses > 200 foes |
| Determinism drift | own stream, rng argument for event spawns, byte-identical SITES=0 sweeps every chunk |
| Economy drift from shards | 1 per run cap; economy readout re-run; Matt can drop the shard (default listed) |
| Farming via Endless | no sites after dawn |
| Overlap with Branch-Mane identity | no elite slot; knot is a place, not a creature |
| Scope | 6 build chunks; minimap may slip post-launch |

## 10. Fit check / mechanical sense
- Fit: wells, lantern road and the corruption knot are the world sheet's own POIs (ws6) in the Warm Lantern look; completing them restores colour (rule A), paints a road (rule B) and burns corruption away (rule C) on the one life map, render-only; cream/brass rewards, gold stays for evolutions, red only for the pulse danger.
- Mechanical sense: one verb each (stand, travel, burn), rewards are small choices inside existing systems (gems, gold, heal, Blessing offer, magnet, one capped shard), no recipe or gate bypass, seeded and bot-measurable, nothing alive at the boss.

## 11. Defaults Claude took (Matt may override)
- Sites stop waking after dawn (Endless untouched). Minimap ON desktop / OFF phone. 1 soul shard from the FAR knot (cap 1 per run, every tier). No Bond from sites. Lantern Compass becomes live in E5 as written.

## 12. Decisions for Matt (one-tap, see report)
1. Rest site: 1A Grey Well (rec) / 1B Lamp Posts / 1C Stand of Memory.
2. Route site: 2A Lantern Road (rec) / 2B Lost Reliquary / 2C Wandering Wisp.
3. Risk site: 3A Hollow Knot (rec) / 3B Hungry Lantern / 3C Grey Circle.

## 13. As built (2026-10-28, wip/ev-build; see LOCKED 'LAMP POSTS ADAPTATION' and 'MAP EVENTS E0-E5 BUILT')
| Item | Built |
|---|---|
| Rest | Lamp Posts (Matt's pick): 12 lamps, groups 0:40 near / 4:20 mid / 10:20 far, 2 XP + 1 gold + 1 heart per group, glyph badge before you commit, instant light. Budget = the wells' (1.5 L, 45 gold, 65% heal). |
| Route | Lantern Road as section 3 2A; road 1 wakes 2:10 (2:40 broke the +-15 s swarm rule); road 2 picked at wake (3 candidates, closest to 1100 u from the hero). |
| Risk | Hollow Knot as 3A; far knot picked at wake like road 2; the knot is a pinned target in sim.enemies (vanish: no kill / gem / drop), not an enemies.json type. |
| Timeline | 0:40 lamps, 2:10 road 1, 4:20 lamps, 5:30 knot 1, 8:00 road 2, 9:20 knot 2, 10:20 lamps; 13:30 sleep. All checked by tests/sites.test.mjs. |
| Code | src/sim/sites.js, src/gfx/siteview.js, src/ui/sitecopy.js, scripts/sitebot.mjs, scripts/ev-shots.mjs, tests/sites.test.mjs. |
| Deferred | Almanac page + sitesRestored leaf + lifetime counts (Almanac agent owns codex/tree), Lantern Compass (node gone from the tree on dev), minimap (post-launch per section 5). |
| Bot | calm = goes to a site within 900 u only when the area is swept (< 12 loose gems within 300 u) or the site is within 350 u; skips while a Branch-Mane is out; runs a started road at weight 1.5; knot: holds 130 u, steps out of the pulse tell. Travel is costly for the bot (gems left behind): an always-go bot (greedy) loses ~2 levels by 6:00. |
