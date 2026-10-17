# Enemies v1: Chapter 1 roster, miniboss, chest, corruption bloom (DESIGN SHEET #4, NOT locked)

Design only (no game code changed). Research: docs/research/37-enemy-design.md (new) + research 10 (roster/timeline) + research 30 (minibosses/chests/POIs). Mock-ups: docs/mockups/enemies-sheet/ (code-drawn Style v1, real build plates at true size, desktop + phone, night + day). Boss Elder Treant is sheet #7; this sheet only fixes how minibosses relate to it.

Matt's problem: "enemies feel blocky/flat". Measured cause in the build: every enemy is ONE static baked sprite (src/gfx/sprites.js `wolf` 18x12, `crow` 14x10, `root` 20x20 world units at VIS 1.3-1.44) moved by position + flipX only. No walk, no anticipation, no hit squash, no death beat beyond wisps; all three share one eye look; corruption is one round stamp for all (W3). The fix is mostly ANIMATION + SHAPE LANGUAGE + per-type NIGHT IDENTITY, not more detail.

## 0. The plan in one paragraph
Keep the three ids (wolf, crow, root_crawler: saves, tree kill-gates and sweeps depend on them) and rework their look to the identity bar; add THREE new verbs (ranged, area denial, heavy charge) arriving one at a time between 2:00 and 6:20; add ONE miniboss on a clock (3:20, 7:00, and 12:30 after the Treant) that drops the already-locked chest; give every type its own EYE CONSTELLATION (count, spacing, height, motion) so the dark start stays readable, and its own CORRUPTION FOOTPRINT on the W3 ink layer. Animation = code rig baked into ONE chapter atlas of frames at boot (no extra sprites per enemy vs today).

## 1. Identity rules every enemy obeys (from LOCKED + BIBLE; conflict-checked)
- Faceless: a dark void where a face would be + ember eye-points (ember halo, solid cream core; WL6b). No mouths, no brows. (The Blightbulb mock first had a vein that read as a frown: moved; checklist item F3.)
- Cold and matte: bodies in hollow greys, plum-greys, bark-greys, lichen grey-green; no glow on bodies; no warm colour except the eyes. Friendly things glow (ghost wolves pale blue, ravens violet with orange beak, orbit lilac). Enemy look-alikes of friends are forbidden: enemy crows get a DARK beak stub, enemy wolves are opaque charcoal with ash hackles (never translucent: why Shade Wolf is option C only).
- Red-orange (#ff5a3c, corruption.accent) = eyes + danger telegraphs ONLY. Bleed blood-red tint stays (Matt's reopen). Gold never on enemies (evolution/dawn only); minibosses use the LOCKED boss eye amber #ffb84a.
- Style v1: L2 tinted outline (darker shade of each fill), H2 soft gradient + rim, P1 chibi (round masses, big head/body ratio); each creature its own vector definition.
- Visibility arc G1-G8 apply to every type (eyes >= 3:1 or |dL*| >= 6, never pure black, visible >= 0.6 s before contact, telegraphs above the vignette, minibosses always fully lit like the boss).

## 2. Roster: options per piece (recommended first; one-tap label + 1-2 sentences, then detail)
Stats are relative to src/data/enemies.json today (wolf hp 12 / speed 46 / dmg 5 / r 6; crow 5 / 62 / 3 / 4; root 38 / 26 / 8 / 8). All hp scale with hpScale like today unless marked FIXED. Numbers are first estimates to be bot-measured; nothing in data is edited by this sheet.

### 2.1 Fell Wolf (id wolf, display name Forest Wolf -> Fell Wolf; behaviour kept: chase + short lunge)
- **A (Recommended) Hackled Hollow.** A lean starving wolf, head low and long, with a pale ash hackle ridge that RISES on its lunge tell. Twitchy lope; all heads snap toward you together.
- **B Bark-Backed Wolf.** Heavier wolf with dead branches growing out of its spine. Reads "forest", but busier and close to the Root Crawler's language.
- **C Shade Wolf.** Solid front, rear dissolving into ink wisps. Eerie, but translucent like YOUR ghost wolves: friend/foe confusion risk.
Detail (A): silhouette = forward-leaning wedge (shape language: triangle/forward); colour accent = ash hackles #b9bec8 on charcoal-plum #4a4558; eyes = 2 small, close together, LOW and forward in a void muzzle. Animation: 4-frame gallop (body bob, leg pairs swing, tail straight back), tell = crouch + hackles x2 + ears flat + head drops (0.55 s today; research 37 says >= 0.6 s: DEFAULT proposal 0.6 s, trivial, Matt may override), lunge = stretch forward, hurt = squash + white flash, death = sink, ash flakes rise + one cream spark drifts toward Wren's pack (BIBLE heart beat, visual only). Telegraph: short red-orange dashed lane in the lunge direction, direction locked at tell start (already how the sim works: e.dx/e.dy fixed at 'tele'). Night: rows of close eye pairs bobbing together = "pack". Perf: 1 sprite (frame swap) + 2 eye images. Counters: bleed (Rend) is its natural foe; Wall of Wings fear cancels the tell (sim already: fearT overrides state); Rally pin holds it. Build cost: medium (it is the pipeline pilot, E0). Risk: hackle ridge is small at phone size (survives as a light top line, checked in es1).

### 2.2 Grave Crow (id crow, Carrion Crow -> Grave Crow; behaviour kept: fast zig-zag)
- **A (Recommended) Ash Crow.** A ragged V with wings too long, jerky two-beat flaps then a stall, shedding ash flakes; one big eye.
- **B Murmur.** Arrives as a tight swirl of five small crows (one enemy, five bodies). Strong read, five times the sprites.
- **C Rag Crow.** Torn black cloth on the wind with a ribbon tail. Spooky, but drifts toward the chapter 7 scarecrow tone.
Detail (A): shape language = thin triangle/V (flyer); accent = plum wing flakes #564b72 + ash flake specks; eyes = ONE big eye, high (hovering), +20% (the locked crow boost); dark beak stub (friendly ravens own the orange beak). Animation: 2 beats then a 0.15 s stall glide-dip (never smooth gliding), head tilt; ash flakes fall behind (cap shared with death ash). No attack tell needed (contact damage 3); optional "dip" on contact. Night: single bright high eye zig-zagging. Perf: 1 sprite + 1 eye (B = 5 sprites + 5 eyes per crow: rejected for swarms of 40). Counters: everything kills it; Holy Orbit guard catches it. Build cost: small. Risk: at phone size the crow is ~18 px wide; the eye carries it.

### 2.3 Root Crawler (id root_crawler; behaviour kept: slow tank)
- **A (Recommended) Knot Crawler.** A wide, low dome of knotted roots on six root legs that plant and pull (lurch, pause), two wide-set eyes in a dark cleft.
- **B Stump Crawler.** An old stump walking on roots, eyes in a knot-hole. Clear, but looks like the W4 stump props.
- **C Tangle Spider.** A small body slung high on six long arched root legs. Fast-looking and creepy; probably too scary for the bittersweet tone.
Detail (A): shape = wide dome/circle (heavy, inevitable); accent = lichen grey-green patches #6f7d6a on bark-grey #534d4f, root tendrils curling up off the top (silhouette tell vs bushes); eyes = 2, WIDE apart, low in a cleft. Animation: legs plant in two sets of three, dome lurches forward on the pull (squash 5%), pauses; roots drive into the soil (corruption footprint = strongest radial veins). Night: wide low eye pair moving in a lurch-pause rhythm. Perf: 1 sprite + 2 eyes (as today). Counters: DoTs (bleed/burn), Talon Mark picks it (toughest), Soul Lance lines. Cost: small-medium. Risk: dome vs bush props: the eyes and the moving legs separate it; test G2 on restored ground.

### 2.4 NEW 1, RANGED: Thornspitter (new id thornspitter)
- **A (Recommended) Thornspitter.** A dead sapling with a bone-pale seed bulb; it roots at range, the bulb swells with ember light for 0.7 s, then spits one slow thorn you can step around.
- **B Spore Puffer.** A grey mushroom that lobs a spore ball onto a marked ground circle. Overlaps the Blightbulb's circle language.
- **C Needle Fir.** A small dead fir that fires a fan of three needles every 3 s. Busier to read; fans in crowds stack up.
Detail (A): role = ranged kiter: walks in until 150-170 units from you, roots (0.3 s), every 2.8 s (+0-0.8 s random offset) tells 0.7 s (bulb swells x1.28 + ember glow inside + rocks back; direction locked at tell start, thin red-orange aim tick), spits ONE thorn 110 u/s, life 2.2 s, damage 5 (x dmgScale); uproots and backs off at 30 u/s if you come within 80. hp 10, speed 30, contact 3, r 6, mass 1, xp 2, gold 1. Shape = tall narrow stick (vertical: unique in the roster); accent = bone-pale bulb #a9a8b6; eyes = ONE, very HIGH. Thorn look: dark spike with an ember/cream core and a faint streak (passes G1 like an eye; drawn above the vignette). Night: a single high eye that does not move, then a glowing bulb = "about to shoot". Perf: 1 sprite + 1 eye; thorns pooled, cap 40 (phone 24), one sprite each. Counters: stationary while rooted = Spirit Bolts / Soul Lance / ravens' Watch (base 150 -> 210 at max: range 160 sits at the edge of Watch, so investing in Watch is rewarded). Balance: first must-react type, from 2:00, low rate, max 8 alive; measure bot damage taken from thorns (needs the bot dodge model, E3). Cost: medium (enemy projectiles are new sim code). Risks: thorns in a swarm become noise (cap + max 3 simultaneous tells, section 6); a far spitter outside the view could shoot from off-screen: rule = only tells while inside the view (like Thunder Judgment's in-view rule).

### 2.5 NEW 2, AREA DENIAL: Blightbulb (new id blightbulb)
- **A (Recommended) Blightbulb.** A pallid puffball on stubby legs; near you it plants, pulses faster while a ground ring fills for 1.0 s, then bursts. Killed early, it only fizzles.
- **B Mire Slug.** A low ink slug whose trail hurts to stand in for 3 s. Shapes your path, costs trail points.
- **C Seedpod.** A pod that splits on death into six tiny fast seedlings. Swarm filler with no new tell.
Detail (A): role = suicider/area denial (forces you to step out of a circle; rewards killing it at range). hp 9, speed 38, contact 0, r 7, mass 0.8, xp 2, gold 1; triggers within 50 units: plants, fuse 1.0 s, burst r36 for 12 (x dmgScale), then dies (no xp if it burst? DEFAULT: gives xp either way, simpler, Matt may override). Killed before the burst = harmless fizzle puff. Fear (Wall of Wings) cancels the fuse (it re-plants after fear). Shape = round ball on legs (round = waddle); accent = pallid fungus #b9bdb2 with grey-green spots; eyes = THREE tiny in a triangle. Animation: waddle wobble (body rotates +-7 degrees), fuse = pulse speeding up + ember glow inside, burst = squash pop + ink splash (corruption footprint = round splash with veins). Telegraph: red-orange ground ring with an inner ring that fills (drawn above the vignette, visible at distance: research 37 risk a). Perf: 1 sprite + 3 eye points (counts as ONE eye slot; the eye image is a baked 3-dot variant). Rings pooled, max 6 at once. Counters: wolves (they roam and defuse), chain, orbit; burst never hurts summons (they are not damageable). Balance: from 4:30, max 10 alive; measure burst share of player damage. Cost: medium. Risk: summons defuse too well and it never matters (ok: it then teaches "your spirits protect you"); stacked rings near the boss: rate x0.5 during the Treant.

### 2.6 NEW 3, THE THIRD VERB (each option is a different ROLE)
- **A (Recommended) Bramble Hart, heavy charger.** A stag drained mid-leap with briar antlers twice its head; it lowers its head and scrapes for 0.8 s, then charges straight across the screen.
- **B Moss Mourner, support.** A hooded moss lump that stays behind packs and wards up to three allies. In an auto-aim game you cannot focus it, so its power is invisible.
- **C Seed Mother, spawner.** A walking seed husk that plants sprouts that grow into crawlers unless you stomp them. Fun verb, but overlaps the Treant's Seed Toss (sheet #7).
Detail (A): why a charger when wolves lunge: wolves = short hop (0.6 s x3.2 = ~88 u), Hart = long LINE (0.9 s x5 = ~180 u) through the crowd, with a 0.6 s stagger after (punish window); different shape (tall, antlers), different tell (head down + hoof scrape + long lane). hp 70, speed 40, contact 8, charge 12, r 10, mass 4, xp 6, gold 3, cd 6 s + 0-2 s offset, direction locked at tell start, tells only inside the view; max 3 alive (5 after 10:00). Shape = tall vertical + wide antler crown (proud); accent = dark briar antlers #3e3642 with pale thorn ticks; eyes = 2 HIGH on the head, swing down on the tell. Night: high pair that drops low = charge coming. Corruption footprint = straight scar along the charge + a bramble tuft at the end (visual only). Counters: fear/pin cancel the tell (non-boss), Talon Mark targets it (toughest), Spearhead ravens. Cost: medium. Risk: charge through a dense crowd shoves nothing (no physics push on other enemies; it passes through); bot needs the dodge model.
Detail (B): wards absorb the next 20% max hp of damage on up to 3 allies, re-ward every 6 s; tethers grey-green; would need a summon targeting rule ("prefer warders") = new AI work. Detail (C): plants a sprout every 5 s that grows into 2 Root Crawlers after 4 s unless the player steps on it; adds an active stomp verb; sprout cap 6.

### 2.7 MINIBOSS (one type, timed)
- **A (Recommended) Grey Alpha.** The old leader of a rival pack: twice a Fell Wolf, a ruff of dead branches with bone tips, amber boss eyes. It howls to call its pack and makes a telegraphed line charge.
- **B Briar Mother.** A walking briar thicket with a hollow doorway mouth; root-pulse circles and Blightbulb drops. Strong, but circles + plant are the Treant's language.
- **C Pale Hart King.** A giant hart with a dead white crown whose charges leave bramble walls. Only makes sense if the Bramble Hart is picked.
TIMELINE (A): **3:20, 7:00, then 12:30** (after the 10:00 Treant). Each sits >= 30 s from a swarm event (events at 1:00/2:30/4:00/5:00/6:00/7:30/9:00/10:00/11:00; the "never within 20 s of a swarm" rule from research 30). A countdown chip "The old alpha stirs" shows from 30 s before (HUD sheet budget; mock in es6/es7), a short banner on arrival, a boss bar while alive. Stats (FIXED hp, no hpScale, like the Treant): #1 700, #2 1600, #3 3200 (targets: median time-to-kill 10-20 s with the run kit at that minute; bot-measured, tuned); speed 52, r 14, mass 20, contact 8 (x dmgScale). Verbs: HOWL every 12 s (first 3 s after arrival), 0.6 s pose, calls 4 Fell Wolves from the view edge (cap 8 called alive), a ring of veins spreads (corruption, visual); LINE CHARGE tell 0.7 s (lane drawn, direction locked) then x4 speed for 0.7 s (~145 u), 14 dmg, cd 7 s. ONE phase change at 50%: howl calls 6 and the charge repeats once (research 37: one verb, one phase change). Control immune (no fear, pin, shove: the locked boss rule), takes bleed, burn and mark in full; echo wolves never rise from it (same as bosses). Leash: if > 500 u away it lopes back toward the view (never despawns). Always fully lit (visibility arc 3.4), pale cool outline (#9aa6c8 rim, not gold), amber eyes #ffb84a (locked boss eye; not evolution gold). Drops the chest + a heart. Relation to the Treant: Alpha = animal, pack, LINES; Treant = plant, roots, CIRCLES; the Alpha never appears during the Treant fight (12:30 is after it); Treant escorts stay its own Seed Toss crawlers (sheet #7). Wren story tie: "the rival pack's leader" (BIBLE). Cost: large (new HUD chip/banner/bar reuse, AI, phase). Risks: #1 at 3:20 could kill new players before 5:00 (rule "no deaths before ~5:00"): its damage is low and the howl wolves are fodder; gate on the bot (deaths before 5:00 unchanged) and Matt's playtest.

### 2.8 CHEST REWARDS (what the miniboss chest gives)
LOCKED already (World/map events row, 2026-10-15): "Blessing choice (1 of 3) + a small stat rank in medium/large tiers, never naming gated weapons/evolutions, with a floor fallback (heal/XP) so a chest is never empty, bot-validated". Options 2 and 3 would REOPEN that line.
- **A (Recommended) Lantern Reliquary tiers (inside the lock).** Small = XP burst + heal 30% + gold (the floor, always included); Medium = floor + Blessing choice 1 of 3; Large = floor + Blessing choice + one free stat rank (pick 1 of 3 owned-weapon stats; can complete a recipe pair but never names an evolution).
- **B Choice Chest.** Opens into 3 normal level-up cards with evolution-partner stats weighted up: simple, reuses the card UI, but reopens the locked contents.
- **C Seed of Colour.** A grey bud blooms into gold + 1 soul shard + a heart: zero in-run power, zero balance risk, least exciting in the run; reopens the lock.
Detail (A): tier odds Alpha #1 55/40/5 (small/medium/large), #2 20/60/20, #3 0/50/50; pity: never two Larges in one run. Chest Blessings count toward the SAME Blessing caps (no new power channel). Look: a warm friendly reliquary (wood + brass bands #c9a25a = the currency brass, NOT evolution gold); medium = brass bands, large = a small hanging lantern on the lid; opening = cream-amber light spill (lantern colours), no gold. Opened by walking onto it (no button), then the existing card UI (Blessing row / stat cards) with the 250 ms lock. Bot: open automatically, pick by the bot's Blessing taste; ablation chest on/off. Budget: chests must move no-tree win <= +5 points and stay inside the tree soft-cap power budget.

### 2.9 CORRUPTION BLOOM per type (ties to W3 ink; visual only)
- **A (Recommended) Footprint stamps per type.** Each type stamps the W3 corruption channel in its own shape (wolf paw trail, crow specks, crawler radial roots, bulb splash, hart scar line, alpha howl ring) plus at most one tiny pooled decal kind.
- **B Uniform W3 pool (today).** The same soft ink pool for every type, only radius/strength differ. Cheapest; a screenshot cannot tell what was there.
- **C Growing vein decals.** Each enemy grows animated vein sprites from its feet. Richest look, most sprites, busy under 240 enemies.
Detail (A): data per type in enemies.json `corr: { r, k, shape }` (shape: trail | specks | radial | splash | line | ring); trail = 2 small stamps along the velocity, radial = today's stamp r56 x2 (crawler strongest, BIBLE), specks = r14 x0.3, splash = one-shot r60 on the burst, line = stamps along the charge path, ring = one ring of 12 stamps on the howl. Same 10 Hz tick, same decay and healing by light (W3 untouched). Decals (paw blot, thorn scatter, bramble tuft): caps High 60 / Med 30 / Low 0, pooled. Low keeps its ink blobs. Never red, faint cold-violet crack as W3.

## 3. Night identity: EYE CONSTELLATIONS (the main readability system)
| Type | Eyes | Spacing / height | Motion signature |
|---|---|---|---|
| Fell Wolf | 2 small | close, low, forward | bob together; packs = rows of pairs |
| Grave Crow | 1 big (+20%) | high (hover) | zig-zag, stall |
| Root Crawler | 2 | wide apart, low | lurch-pause |
| Thornspitter | 1 | very high | still while rooted; bulb glows before a shot |
| Blightbulb | 3 tiny (triangle) | low-mid | waddle; glows on the fuse |
| Bramble Hart | 2 | high; swing low on the tell | stillness, then a streak |
| Grey Alpha | 2 big amber | high-mid | always lit, pale cool outline |
Eye layout is data in each rig definition (count, offsets, size). All WL6b/b2 rules kept (eyes above the vignette, ember halo + cream core, caps 200/120/40 counted per ENEMY, irregular blink, drift toward you, closing-in cue, Calm = static). Research 37 suggested eye colour per tier; rejected for fodder vs must-react because the eye colour is locked and colour-only cues fail colour-blind gates: tier is carried by eye SIZE + layout, and only the miniboss/boss use amber (locked).

## 4. Animation / personality system plan (code-driven, like the heroes, but baked)
- Geometry: src/gfx/enemyart.js (pure, data-driven vector defs per type like wrenart.js/eliasart.js) -> at boot rendered into ONE chapter atlas (2048 px max; Chapter 1 = 7 types x ~10 frames) by an enemytex.js (like rigtex.js). Frames per type: walk 4, tell 1, attack 1, hurt 1 (squash pose; the white flash stays the existing tintFill), death 2, plus the night-rim outline frame (WL6b `*_r`) per walk frame or one shared.
- Runtime: ONE sprite per enemy (as today) + frame swap; walk phase advances with distance moved (no foot sliding), per-enemy phase offset so crowds never step in sync; transforms for squash/lean (no allocation; pooled). Tell/attack/hurt/death read sim state already present (e.state, e.tele, e.flash, e.dead) + new states for new verbs.
- Why baked, not a live part-rig per enemy: 240 enemies x 6 parts = 1,440 sprites; baked = 240 sprites in one texture = one batch. The live part-rig is only for the miniboss (and the Treant, sheet #7) on Med/High.
- Tiers: High = all frames + death ash (cap 40) + decals 60; Med = all frames, ash 20, decals 30; Low = 2 walk frames + hurt flash, death = quick fade (no ash), no decals, flat eyes (WL6b Low). Phone x0.6 on the effect caps.
- Spawn beat: enemies rise out of a small ink puddle (0.3 s scale-in) with a 0.8 s spawn grace (move only, no tell: research 37 crowd fairness).
- Death beat: < 0.25 s sink + ash flakes + a cream spark (wolves' spark drifts toward Wren's pack: BIBLE, visual only); low contrast so 100+ deaths a minute do not clutter (research 37 #12). No hit-stop on fodder; minibosses only (40-60 ms, UNVERIFIED value, tune by feel).
- Cost estimate (perf gate): +0 sprites per enemy, eye images unchanged except the 3-dot bulb variant, atlas ~2-4 MB GPU; target at 350 enemies: work +<= 0.5 ms High / +0.3 Med / +0.1 Low (scripts/pace.mjs), no per-frame allocation (tests).

## 5. Spawn / wave composition proposal (data proposal only; chapters.json NOT edited)
| Time | Change | Why |
|---|---|---|
| 0:05 / 0:20 / 1:10 | wolf / crow / root_crawler as today | familiar start; dark 0:00-3:00 has only these three |
| 2:00 | thornspitter wave from 120 s: rate 0.05 -> 0.35, curve 0.8, max 8 alive | first must-react verb, after the first two swarm events |
| 3:20 | Grey Alpha #1 (+ its howl wolves) | first beat; chest |
| 4:30 | blightbulb wave from 270 s: rate 0.06 -> 0.4, max 10 alive | second verb |
| 6:20 | bramble_hart wave from 380 s: rate 0.025 -> 0.12, max 3 (5 after 10:00) | third verb; after the 6:00 wolf swarm, so at most 2 must-react verbs live before 6:00 (research 37 #10) |
| 7:00 | Grey Alpha #2 | pre-boss test |
| 8:30 (optional) | new event: "Bramble rush", 3 harts in a line formation from one side | needs a `line` formation (new, small) |
| 10:00 | Elder Treant; new-type rates x0.5 while it lives | boss focus |
| 12:30 | Grey Alpha #3 (post-boss) | keeps the long tail eventful |
New per-type `maxAlive` caps + a global cap of 3 simultaneous enemy telegraphs (a token: a tell waits up to 0.5 s for a free token). Balance target unchanged: no deaths before ~5:00, deaths spread 6-14 min, no-tree random win 15-30%. Expect the new verbs to LOWER win rates: the planned compensation is enemy counts/hp, decided after measurement (Matt's call if a locked target moves).

## 6. Fairness / readability checklist + acceptance gates (every type, every chunk)
F1 G1-G8 harness (scripts/wl6-measure.mjs contrast) passes for the new type: eyes >= 3:1 or |dL*| >= 6, 0 pixels under RGB 12, visible >= 0.6 s before contact (fastest new mover: hart charge 200 u/s, so the tell itself must be visible: tell >= 0.8 s and only inside the view).
F2 Every damaging action has a tell >= 0.6 s (big/area >= 0.8 s), direction locked at tell start, red-orange lane/ring drawn above the vignette, never darkened; plus a shape change (hackles, bulb swell, head drop) for colour-blind players; tells only inside the view.
F3 Faceless check: no mouth/brow reading at true size (desktop + phone crops).
F4 Friend/foe check vs ghost wolves, ravens, orbit lights at 1:1 desktop and phone (colour, opacity, beak, glow).
F5 Max 3 telegraphs at once; spawn grace 0.8 s; max 2 must-react verbs live before 6:00.
F6 Silhouette test: black silhouettes of all types at 28 px are distinct (es1/es2 top-right thumbnails).
F7 Calm motion: no blink/drift/pulse; telegraphs still shown (threat cues).
F8 Perf: pace.mjs at 350 enemies within the section 4 budget; no per-frame allocation.
F9 Sim/bot: sweeps (sweep.mjs / g1d-sweep / bless-sweep, GATES starter + all, 96 seeds) reported honestly vs the locked targets; render-only chunks byte-identical.
F10 Security: enemies.json/chapters.json validated by tests (no NaN/negative rates, caps bounded); new ids added to save allow-lists (killsByEnemy map is capped at 64 keys: fine); no new deps.

## 7. Bot measurement plan (what to measure, per chunk)
- PREREQUISITE: the bot cannot see telegraphs. Add a simple dodge model to scripts/bot.mjs (on a tell inside 200 u: step perpendicular to the lane / out of the ring after a 0.35 s reaction delay); report results with dodge ON and OFF so we know the range.
- Per new type: ablation on/off (win %, deaths before 5:00, death-time spread, damage taken by source).
- Miniboss: time-to-kill distribution per kit at each spawn time; deaths within 20 s of an alpha.
- Chest: ablation on/off; Blessing count per run vs caps; tree soft-cap budget (gates-softcap.mjs).
- Wolf tell 0.55 -> 0.6 s: tiny effect, measured with the bot dodge model.

## 8. Small-chunk build plan (each needs Matt's lock first; each = tests + sweeps + harness + true-size shots + security + fit)
| Chunk | What | Sim? |
|---|---|---|
| EN0 | Enemy art pipeline (enemyart.js, chapter atlas, frame animator, eye layout data, Low path) + Fell Wolf A | render-only, sweeps byte-identical |
| EN1 | Grave Crow A + Root Crawler A | render-only |
| EN2 | Spawn/hurt/death beats + corruption footprints A (life-map stamp shapes + decals) | render-only |
| EN3 | Bot dodge model + telegraph token cap + spawn grace + wolf tell 0.6 s | sim (small) + bot |
| EN4 | Thornspitter (enemy projectiles) | sim + data + art |
| EN5 | Blightbulb | sim + data + art |
| EN6 | Bramble Hart (or the B/C pick) | sim + data + art |
| EN7 | Grey Alpha + timeline + countdown chip/banner/bar | sim + HUD |
| EN8 | Chest A (tiers, floor, pity, UI reuse) | sim + UI |
| EN9 | Wave composition retune + full sweeps + Matt playtest | data |
ORDER CONFLICT to note: the locked World/map events row says the phases go lamps + Treasure Wisp -> Grey Well + lanterns -> elites + chests. EN7/EN8 are that third phase; EN0-EN6 do not conflict. Matt decides whether EN7/EN8 wait for the POI phases or move ahead.

## 9. Fit check
Look: faceless cold bodies with ember eye-points, Style v1 outline/gradient/chibi masses, ink corruption with cold-violet cracks, warm light only from heroes/spirits/chest; each type has its own silhouette, accent, shape language, eye constellation and motion (es1-es7). Mechanics: each new type adds exactly one verb you react to by MOVING (step out of a lane, out of a ring, close on or ignore a shooter), the miniboss is the locked "minibosses + chest" idea with the locked chest contents, control immunity follows the boss rule, statuses follow the second-review ruleset, ids/saves unchanged for the old three.

## 10. Honest weak spots
1. The bot cannot read telegraphs: until EN3, all balance numbers for the new verbs are guesses. (Fix planned: EN3 dodge model, reported ON/OFF.)
2. Mock-ups are static SVG: animation feel (lope, lurch, waddle) is only shown as frame strips; the real test is in game (EN0 screenshots + Matt's playtest).
3. The night composites approximate the WL6 look with a filter, not the real shader/lightmap; EN0 runs the real contrast harness.
4. Thorns and hart lanes in a 240-enemy swarm are unproven for noise; the 3-telegraph cap is a guess (research 37 #6).
5. Grey Alpha at 3:20 may clash with "no deaths before ~5:00" for new players; gated by measurement + playtest.
6. Chest Blessings at 3:20 put late-game power early; inside the lock but must be measured (EN8).
7. Hackles and the crow's flakes are small at phone size; the eye constellation carries the read there.
8. Real-phone check outstanding for everything visual (as for the world chunks).

## 11. Decisions for Matt first (max 3, recommended first)
1. **New verbs:** Thornspitter (ranged) + Blightbulb (area denial) + Bramble Hart (heavy charger) (Recommended) / swap the Hart for Moss Mourner (support) / swap the Hart for Seed Mother (spawner).
2. **Miniboss:** Grey Alpha at 3:20, 7:00 and 12:30 with the locked chest (Recommended) / Briar Mother once at ~6:00 / Pale Hart King (only with the Hart).
3. **Look bar for the three existing enemies:** all three A (Hackled Hollow, Ash Crow, Knot Crawler) (Recommended) / pick per enemy in the next batch / keep today's sprites and only animate them.
Then, one enemy per question in batches of 3: the A/B/C looks of each new type, chest (A is inside the lock), corruption bloom (A; visual, reversible: default unless Matt objects).
Defaults taken (trivial/reversible, Matt may override): wolf tell 0.55 -> 0.6 s; Blightbulb gives xp even if it bursts; display names Fell Wolf / Grave Crow / Root Crawler (ids unchanged).
