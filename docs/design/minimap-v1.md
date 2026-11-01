# Minimap v1 (design sheet, three options; NOT built, parked until Matt picks)
Status 2026-10-30. Docs only. Process: research -> design -> independent review -> Matt picks -> LOCK -> build. Nothing here is locked.
Builds on: LOCKED 'World / map events' (2026-10-15: "PHONE compass: edge arrows + a tiny optional minimap (tested on a real phone)"), docs/design/map-events-v1.md section 5 (minimap "Default ON desktop, OFF phone", may slip post-launch), docs/research/30-world-and-maps.md. Edge arrows already exist (src/gfx/siteview.js, max 2, outside the HUD bands).

## 1. Research (brief)
| Finding | Label |
|---|---|
| Survivors-likes mostly have NO minimap: the arena is one screen of action and the genre's pillar is "stay moving, read the swarm". Vampire Survivors, Brotato, HoloCure use fixed or wrapped arenas with no map. | COMMUNITY (genre convention, widely discussed) |
| Open-field survivors with a big scrolling world lean on screen-edge pointers for chests, bosses and objectives, not a corner map. | COMMUNITY |
| Where a map exists, it is tiny, shows player + objectives only, and is toggleable; heavy detail is judged "noise during action". | COMMUNITY / OPINION (docs/research/30-world-and-maps.md lines 75-76, weak sources) |
| One pointer can mislead in open worlds; use a small map or at most 1-2 arrows. | COMMUNITY (same file, weak) |
| Phones: WebKit kills tabs past a few hundred MB total. A 64x64 canvas is ~16 KB, negligible; the risk is extra full-frame or per-frame GPU uploads, not the map itself (see src/gfx/memprofile.js LOWMEM: render scale capped, ~8 full-frame render targets). | OFFICIAL (our own measured profile) |
| Fog of war on a minimap makes exploring itself a reward. | OPINION (our research file, line 111) |
Takeaway: the genre norm is "no minimap", so anything we add must earn its screen space, and must be off or tiny on phones. Our world is 4000x4000 u with 1,800 u trips to events, so some orientation help is justified; the edge arrows already do most of it.

## 2. What data exists (no sim change needed for any option)
- Life map: `src/world/lifemap.js`, 256x256 Float32 (life, corruption). Visual only. A 64x64 average is a cheap derived view.
- Sites: `sim.sites` published list (position, kind, state), read-only.
- Boss / miniboss position: from the sim enemy list (already read by render). Pickups (hearts, magnet, gems): hundreds of gems would be noise.
All options are RENDER/UI only. src/sim and src/data untouched. A Settings toggle persists in the existing settings store (one new validated boolean/enum).

## 3. Options

### A. "Lantern Pool" corner map (Recommended)
- Look: a small round glass disc (Warm Lantern glass, like the HUD) in the top-right (desktop) showing the restored ground as a soft warm-gold glow on dim grey-blue, so the player's mural is visible at a glance. Hero = cream dot with a tiny lantern glow. Awake sites = their badge icon (lamp, lantern, knot) at ~6 px; done sites = small warm dots; the lit Lantern Road = a thin gold line. Boss/miniboss = a rose-red ring that pulses once when it spawns. NO gems, NO pickups (clutter). Undiscovered sites hidden (fog): a site appears when it wakes.
- Behaviour: north-up, fixed scale (whole 4000 u world in the disc), life layer repainted ~2 Hz, hero dot every frame. Hidden while a card/menu is open. Settings > Picture > "Mini map" (On / Off). Default ON on desktop, OFF on phone (matches the map-events locked line).
- Placement: desktop top-right under the timer, ~96 px at 1280x720 (about 7% of width); scales with the existing container query, capped at 1.25x for Text size. Phone landscape: 64 px inside the safe-area frame (--sa-*) on the side away from the thumb pad; phone portrait: 56 px under the moon arc. Must stay inside the locked HUD bands (12/14/16%) and never overlap card UI. Exact position set by screenshot in the build chunk.
- Perf: one 64x64 offscreen canvas (16 KB) + one small DOM canvas, repainted ~2 Hz only for rows that changed (lifemap dy0..dy1). No new Phaser texture, no extra render target, no shader: does not touch the LOWMEM budget. Expect under 0.2 ms per paint. Low tier: skip the glow fill, dots only.
- Fit: strongest identity tie: it is the life-map "mural" shrunk down (light = colour = life). Mechanical sense: reads the same facts as the edge arrows, fog gives no hidden info, no gameplay link.
- Risks: clutter on phone (hence default OFF); invites "wander the map" play the 15-minute run does not want; one more thing to teach (fold into the Lamp Post / Lantern Road intro cards, not its own card).
- Conflicts: none with LOCKED. The Lantern Compass node is retired, so no tree gating; optional via Settings.

### B. Edge arrows only, extended (cheapest)
- Look: no map. The existing cream edge chevrons gain two more kinds: boss/miniboss (rose chevron from its warning) and the nearest heart when HP is low. Still max 2 arrows, priority: active site, boss, nearest awake site.
- Placement: screen edge, outside HUD bands, already built; nothing new on phone.
- Perf: zero new memory; a few more draws.
- Fit: perfect restraint, matches the genre norm and "few effects". Mechanical: players lose the "where have I restored" overview and the mural view.
- Risks: arrows say "that way", not "how far / what is around"; the mural identity is shown nowhere beyond the ground itself.
- Conflicts: none; fulfils the locked line minus the optional minimap.

### C. Hold-to-peek "Map of the Forest" overlay
- Look: no persistent HUD element. Hold M (desktop) or long-press the moon arc (phone, needs real-phone check) to fade in a large translucent glass map over the centre showing the full mural (life + corruption veins), discovered sites, lit roads, boss, hero. The game keeps running (not paused); release to dismiss. The same drawing is reused as a still on the results screen ("what you restored").
- Perf: one 128x128 canvas drawn only while open (and once at results); nothing while closed.
- Fit: very strong identity (the finished picture is the reward; shareable). Mechanical: takes eyes off the swarm while being hit, against the genre's "always moving" rhythm; on phone it adds a gesture competing with the thumb pad.
- Risks: touch input conflict; accessibility (hold input; offer toggle mode); reading while enemies hit.
- Conflicts: none, but the research file says phone wants "no extra input" (line 215): the weak point.

## 4. Recommendation
A, default OFF on phone, ON on desktop, 2 Hz repaint. Build later as one chunk (E6, ~150 lines): screenshots at 1280x720, 640x360 and phone landscape/portrait, real-phone memory check with ?perf=1, fit-audit run, Calm motion stops the boss ring pulse. If real-phone tests show any hitch or clutter, keep B (already built) and add the C results-screen still instead. A and C share one drawing function, so doing A first leaves C cheap.
Not recommended: pickups on the map (noise), rotating map (motion sickness, cost), fog that persists across runs (needs a save field, little value).

## 5. Self-review (gaps found and fixed)
- Placement vs the moon arc and PHONE-A safe-area frame was vague: now names --sa-* and the HUD bands; pixel position to be fixed by screenshot in build.
- Accessibility: the map is non-interactive (pointer-events none, aria-hidden, decorative; information is also in edge arrows and toasts); Calm motion rule added; Text-size cap added.
- Fog rule stated (site shows only once it has woken).
- Not verified: no hands-on check of any named competitor this session; genre claims are COMMUNITY-level and should be read that way. Real-phone behaviour unmeasured.
- Security: no new input surface except one validated setting.

## 6. Questions for Matt
1. Which option? A (corner Lantern Pool, recommended), B (edge arrows only), or C (hold-to-peek map)?
2. If A: phone default OFF (recommended) or ON?
3. Before or after launch? Recommended: after launch (the map-events sheet allows it to slip), unless playtests show players getting lost.
