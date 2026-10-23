# Summons art v1 (design sheet #3, NOT locked)

Date 2026-10-20. Release-gate item 10 'SUMMONS ART sheet'. Design + mock-ups only: no game code, no LOCKED edits. Mock-ups: `docs/mockups/summons-art/` (README there; one PNG per weapon family, each can be sent as a single image). Research: `docs/research/41-summons-art.md`.

Goal: give every v1 summon/weapon (Ghost Wolves, Raven Flock, Spirit Bolts, Chain Lightning, Holy Orbit) and its three evolutions the same polished Hollowlight Style v1 treatment as Wren v2, Elias v2, the world and the Husks, without breaking the readability rules (friendly effects never hide enemies, pickups or numbers).

## 0. Decisions for Matt (first batch, recommendation first)

1. **Family look** (sets all five weapons at once): **A Light-bodied chibi spirits with a warm heart** (pale role-colour body made of light + tinted outline + warm lantern rim + a small warm ember heart; value-inverse of the dark Husks) (RECOMMENDED) / B crafted paper-and-lantern spirits (paper-lantern wolves, origami ravens, page scraps) / C minimal comet-and-sparkle spirits (mist runners, feather wisps, star seeds).
2. **Wolf size**: **about 36-42 px long on desktop (0.7-0.8x a Fell Wolf; S1 picks the size by measurement, the mock-ups show the upper bound 42), ravens ~30 px, flames 1.6x today** (RECOMMENDED; this partly reverses the A1b 12% wolf shrink, but Wren stays the focal point by value and her lantern pool) / keep today's footprint (~37 px box, body ~25 px; only restyle) / hero-sized wolves (~52 px, same as the Fell Wolf).
3. **Evolution look rule**: **same creature + gold rim + ONE signature change per evolution** (Alpha mane, hollow echoes, pawprint trail, wax-seal omen, lance of letters, flower of flame...) (RECOMMENDED) / gold rim only (today) / a new sprite set per evolution.

Independent review (sonnet reviewer, 2026-10-20) folded in: Rally wolves-only, measurable ground-pool rule, Talon chevron stays dominant, 36-42 px wolf range, darker raven tips, hard Light Trails cap, cream (not gold) despawn motes, cross-cutting gates (a)-(h) in section 6.

Then per-weapon one-tap batches (max 3 per batch, recommended first, each A/B/C exactly as on the sheets): batch 2 = Ghost Wolf, Raven, Spirit Bolt; batch 3 = Chain Lightning, Holy Orbit, Shared FX. If Matt picks family A in decision 1, batches 2-3 become a quick confirm of the all-A set (any single weapon can still take B or C).

Defaults taken by Claude (trivial/reversible, Matt may override): invented glyph letters (no real alphabet); Talon Mark omen keeps the locked W8b violet chevron as the dominant shape (a faint wax-seal ring behind it only on the evolved Talon Mark, dropped if it weakens the status read in S3); Thunder Judgment pillar height capped so it stops below the HUD band (a readability fix, see 1); Light Trails trail colour stays pale wolf blue with a warm core but drawn as a pawprint ribbon instead of the line web (see 1).

## 1. Audit: what the summons look like today (real build)

Captured from a clean build of HEAD 25efa05 (`docs/mockups/summons-art/audit.mjs`: `?auto=<hero>&seed=7&t=<30|690>&god=1&grant=<weapon>:<ranks>:<evo>`, staged swarm of 34 Husks, High tier, desktop 1280x720, 2x crops). Sheet `00-audit.png`.

| Weapon | Today | Verdict |
|---|---|---|
| Ghost Wolves | `wolfU` 18x12-unit sprite from the old style-B pipeline in `src/gfx/sprites.js` (posterised colour, 1 px dark outline, no rim), drawn x0.88 (A1b) + additive halo; ribbons on Med/High | a pale-blue slug, body ~25 px, no legs or face, smaller than the Fell Wolves it hunts; at night mostly halo, in daylight lost in the pile |
| Echo Pack | same sprite tinted 0xbfe6ff, scaled, faded | blurry smudges; no 'risen from the fallen' idea |
| The Alpha | same sprite scaled + 'frost mane' strokes + gold rim; cleave = thin white arc | a dark-blue blob and a white line |
| Light Trails | ribbon trail points (Low: 70 pts) | a screen-wide web of pale lines that shifts green on yellow-green ground; reads as cracks or lasers, not paw trails; the heaviest friendly coverage in the game |
| Raven Flock | `raven` 12x10-unit violet sprite + halo | violet specks; dark-ish violet reads like a Grave Crow (enemy) at 20 px; perch/swoop/peck all one pose |
| Wall / Talon / Spearhead | thin white rings, white circle tell, wake | the rings show, the ravens on them do not; Talon reads as a white circle + number |
| Spirit Bolts | `bolt` 10-unit cyan orb + straight hairline thread | generic lens-flare ball; no glyph/ink (the Archivist idea is missing) |
| Tempest / Lance / Pages | orbs + threads; white beam with ticks; orbs | Lance reads as a laser; Pages invisible as pages |
| Chain Lightning | Graphics jag lines, white splat impacts | short white scribbles gone before you see them; impacts look like paint splats |
| Thunder Judgment | full-height white pillars | 30 pillars = a barcode that covers numbers and runs into the HUD band (a readability bug vs damage-readability-v1) |
| Static Storm / Tether | faint ring / steady arcs | field ring near invisible; Tether is the best of the set, its splats are not |
| Holy Orbit | `orb` lilac-white flame 12x14 units + halo | right shape (locked Elias v2 ring) but ~10 px, pale-on-pale next to Elias, gone in daylight |
| Halo / Wheel / Tide | faint disc, white circle, breathing | Halo ground barely visible; Wheel = a white circle; Tide invisible in a still frame |

Common causes: (1) summons are the last pre-Style-v1 art (no tinted outline L2, no rim H2, no chibi faces P1); (2) they are drawn smaller than the enemies; (3) effects are generic white (no role colour, no shape language); (4) evolved gold rims are 1 px and vanish at 1x; (5) nothing ties a summon to its hero (no warm light, no thread, no shared motif).

## 2. Shared rules (apply to every option)

- **Friend vs foe by VALUE first, colour second**: Husks are dark cold bodies with pale bark masks and red-orange eyes; spirits are LIGHT bodies (role colour, high value) with a darker tinted outline and cream/ink eyes (never red). Survives greyscale and colour-blind sims.
- **Warm heart**: every spirit carries a small warm ember (wolf chest, raven wax seal, glyph core, flame core): the friendly-is-warm rule and the 'Wren's light it follows' story in one dot.
- **Role colours** (locked): wolves pale blue #9fd8ff, ravens violet #b79cff, bolts cyan #7ff0ff, chain white/cyan #b8f2ff with a faint violet fringe, orbit lilac-white #e8e0ff with lilac Burn #c79bff; gold #ffd36b ONLY on evolved rims; red-orange only enemy eyes/tells; light red only damage taken; bleed blood red.
- **Night (WL6)**: summons are lit friendly things: drawn above the grade at full brightness with their own soft halo; they never add a ground pool brighter than the hero's lantern pool (Wren/Elias stay the focal point). Measurable: mean luminance of any friendly ground decal (halo disc, petals, flower burst, trail) <= 0.8x the lantern pool's mean luminance in the same frame.
- **Readability budgets** (damage-readability-v1): friendly effects draw under numbers and never over the hero outline; combat clarity rule (8+ foes within 120 u) caps ribbon/glow alpha at 0.6 and pauses spawn beats near the hero; per-tier caps in section 5.
- **Low tier**: one flat baked frame per creature (glow baked in, no halo, no ribbon except Light Trails' 70-point trail); **Calm motion**: no bob/flicker/flutter, static rims, no spawn rings (fades only).

## 3. Options per weapon (A recommended)

Full text, looks and numbers on each sheet (`01-ghost-wolf.png` ... `05-holy-orbit.png`); summary here.

### 3.1 Ghost Wolf (`01-ghost-wolf.png`)
| | A Lantern-Heart Pack (REC) | B Paper-Lantern Wolves | C Moon-Mist Runners |
|---|---|---|---|
| Look | chibi wolf of moon-blue light: big round head, short muzzle, tall ears with warm inner glow, plume tail streaming light, legs fading to mist below the knee, warm ember heart | folded paper lantern shaped like a wolf, rib bands lit warm from inside, tassel tail | sleek hound: bright head/forequarters, body dissolves into a comet of mist |
| Hook | value-inverse of the Fell Wolf; mist legs vs ink socks | glowing rib stripes | comet |
| Animation | lope x4, bite (jaw + two crescents), sit; ears back at speed | stiff paper hop | 2-leg reaching gallop |
| Crowd 20-50 px / night | ears + plume + heart dot survive at 20 px; self-lit | very readable, but reads as an object | motion reads, shape does not (like a bolt) |
| Perf | 6 frames x 3 overlay variants, 1 image + 1 halo each | 3 frames | ribbon per wolf |
| Evolutions | Echo = hollow outline wolf rising from the prey with motes; Alpha = 1.7x, frost mane, amber eyes, gold rim (+2 shades); Light Trails = streaming ears/tail + a pawprint ribbon | unlit paper ghosts / festival lantern / paper prints | fainter comets / huge comet / nothing new |
| Cost / risk | M / cute may read soft: lunge-forward bite | S / festival tone, Elias owns lanterns | M / collides with bolts and Light Trails |

Pack variety: 3 overlay frames (notched ear, chest tuft, curl tail) + per-id 4% scale jitter, never recolours. Pup link: the pup stays cream-amber (Wren v2 lock) and is the only warm-bodied wolf; on Rally it runs at the head of the pack (visual only). Rally visuals are WOLVES (+ pup) ONLY: ravens stay independent (LOCKED 2026-10-18 correction). Light Trails fix inside the same trail caps, with a HARD coverage cap written into the lock (friendly trail pixels within 0.2 screen-height of the hero <= 15%, point caps unchanged): pawprint stamps every 7 px along the existing trail points, a soft ribbon under them, the web of long straight lines removed.

### 3.2 Raven (`02-raven.png`)
A **Letter Ravens** (REC): round chibi violet raven, big head, short pale beak, cream letter-paper wing tips with ink lines, warm wax-seal ember; poses perch / up / down / swoop / peck / spread / dive driven by the existing sim state (perch -> dive -> peck -> return). Wall of Wings = spread-wing ring ravens + a slow ring of loose paper feathers; Talon Mark = folded dive dart + the locked violet chevron inside a wax-seal disc above the foe; Spearhead = wedge with a violet wake, the lead raven gold-rimmed. Paper tips are kept small and a darker cream (#efe1c0, never white) so they cannot read as numbers or pickups; fallback if S3 fails that check: violet-tinted tips. B Origami Ravens (angular, triangle = threat shape language, breaks P1). C Feather Wisps (third comet shape, particle-heavy).

### 3.3 Spirit Bolt glyph (`03-spirit-bolt.png`)
A **Ink Glyph Orb** (REC): a cream invented letter-glyph in a soft cyan orb with a dark ink rim and a curling ink tail (the bible look; the dark tail separates it from mint XP gems). Tempest = 8 glyphs bursting from a torn page, then seeking; Lance = a written line of glyphs inside a pale capsule with gold edges (replaces the laser look); Pages = a folded page with a glyph, ink trail out, dotted curl home. B Torn Page Scraps (cream rectangles read as pickups/cards). C Star Seeds (generic, close to the gem). Note: at true size the orb is ~12 px; the build should try 1.3x (16 px) in S5 and keep whichever passes the gem-confusion check.

### 3.4 Chain Lightning (`04-chain-lightning.png`)
A **Storm Thread** (REC): 3-layer arc (faint blurred violet fringe + cyan glow + white core), small forks, re-jag flicker every ~60 ms, and a dark crack-star scorch that stays 0.5 s where it lands (so you see where it went). Thunder Judgment = sky-crack + pillar with gold edge lines, HEIGHT CAPPED (a 70-120 u column ending below the HUD band, not full-screen), ground crack ring; Static Storm = dashed crackling dome edge + gold hairline + tiny strikes; Storm Tether = braided steady cord with knot beads (no flicker). B Spirit Rope (loses the lightning verb). C Spark Sprites (reads as a fourth projectile).

### 3.5 Holy Orbit (`05-holy-orbit.png`)
A **Candle Flames** (REC): the LOCKED Elias v2 flame ring, polished: 1.6x, tinted outline, cream core, tiny wick and wax bead, flicker x3, lean into the spin, flare on hit, a faint halo ring pressed into the soil joining the lights. Sanctum Halo = 12 small candles + consecrated ground disc with a stained-glass petal ring + gold hairline; Judgement Wheel = 4 big flames bursting into a 6-petal flower of flame that reforms; Vesper Tide = ring breathes out/in, flames stretch into streaks on the outswing + crest ripple. B Lantern Moths and C Glass Rosettes both REOPEN the locked flame ring (shown for completeness, not recommended).

### 3.6 Shared FX language (`06-shared-fx.png`)
A **Light in, light out** (REC): spawn = light gathers from the hero's lantern into the spirit (ring closes 0.25 s); despawn = 5 warm cream-amber motes (never gold) drift up (0.4 s); hits = each weapon's verb as a tiny shape <= 0.15 s (wolf crescents, raven star + feather, glyph ink spatter, lightning crack-star, flame flare + Burn licks); evolved = gold rim (2.6 du soft + 1.1 du hot line) on the evolved units only. B Thread-tied (permanent amber threads: 20+ lines through the crowd, breaks the ribbon budget). C Minimal (cheap, lifeless).

## 4. Fit and mechanical sense

- Look: Style v1 recipe on every summon (L2 tinted outline, H2 soft gradient + WARM rim, P1 chibi heads, G1/G2 glow and trails); the Hollow identity (spirit light = colour and warmth; enemies cold); bible section 4 motifs kept (wolf neck-thread becomes the ember heart, letter-paper ravens, ink glyphs, candle flames, white-blue arcs with violet fringe).
- Mechanics: render only. Hitboxes, speeds, counts, targeting, bleed/burn/mark rules unchanged; poses read existing sim state (wolf bite cooldown, raven phase, bolt heading, orbit radius/tide phase). Evolution signatures show the locked verbs (echoes rise from kills, Alpha cleaves, trails bleed, ring burns, wheel bursts, tide breathes, lance pierces a line, pages return, tether holds, field strikes, pillars smite).

## 5. Perf and atlas budget

- ONE summon atlas `sum_atlas` baked at boot from code (same pipeline as `en_atlas`/`rigtex`, painter ported from the mock-up kit), ~3 texels per world unit. Frame budget: wolf 6 + 3 overlays + Alpha 6 (1.7x) + hollow echo 6; raven 7 + Low 2; glyph 5 + page 2 + lance cap; flame 3 + big flame 3 + bead; decals ~10 (crescent, crack-star, ink spatter, star, feather, wax seal, pawprint, petal); Low flats 4. Estimate ~110k texels: fits a 512x512 RGBA page (1 MB GPU) with room; 1024x512 if we go to 4 texels/unit (2 MB). Bake estimate 30-60 ms desktop (gate <= 80 ms; phone measured in S0).
- Draw calls: Phaser 3.90 multi-texture batching keeps summon + Husk atlas images in one batch through the y-sort; additive halos stay on their own depth band (one batch); arcs stay Graphics. Expected +0-2 draw calls vs today.
- Per-tier caps (extends `quality.js` CAPS, nearest-first):

| | High | Med | Low | phone |
|---|---|---|---|---|
| summon bodies on screen | 40 | 28 | 20 | x0.85 |
| additive halos (shared with gems) | 160 | 90 | 40 | x0.6 |
| spirit ribbons | 12 x 1.3 s | 6 x 1.1 s | none (Light Trails keeps 70 pts) | x0.85 |
| echo wolves drawn | 10 | 6 | 3 | - |
| impact decals | 40 | 24 | 12 | x0.6 |
| spawn/despawn beats in flight | 12 | 8 | 3 | - |
| gold rims | 40 | 24 | 12 (flat 1 px) | - |

## 6. Build plan (small chunks, after the lock; render only, sims byte-identical)

| Chunk | Content | Acceptance gates |
|---|---|---|
| S0 | summon atlas pipeline (`src/gfx/summon/`: painter port, frame defs, bake into `sum_atlas`, `?summons=0` = today's sprites), no visual swap yet | tests for frame list/sizes/anchors; bake <= 80 ms desktop, measured on phone; sweeps byte-identical |
| S1 | Ghost Wolf A in game (frames, variants, mist legs, heart, halo retint, size per decision 2) | contrast: wolf body vs Hollow/restored/corrupted ground >= 3:1 day and night, and >= 25 L* value gap vs Fell Wolf body in greyscale + protan/deutan/tritan (wl6-measure harness); DR3 occluders over hero <= 2 at the staged 350 crowd; perf pace.mjs +<= 0.5 ms High / +0.3 Med-Low |
| S2 | wolf evolutions (Alpha, Echo hollow, Light Trails pawprint ribbon replacing the line web) | Light Trails friendly-pixel coverage near the hero (0.2 screen-height circle) <= 15% (measure today first); numbers/pickups never covered |
| S3 | Raven A + poses from sim state + Wall/Talon/Spearhead looks | 'is it friend or foe' greyscale check vs Grave Crow; ravens visible on the Wall ring at 1x |
| S4 | Holy Orbit A polish + Halo/Wheel/Tide looks | flames visible in daylight next to Elias (contrast gate as S1); Burn licks distinct from flames |
| S5 | Spirit Bolt A glyph + ink tail + Tempest/Lance/Pages | glyph orb never mistaken for a gem (side-by-side at 1x, Matt squint) ; 1.0x vs 1.3x choice |
| S6 | Chain A arcs + crack-star decal pool + capped Judgment pillars + Static + Tether | Judgment: no pixels above the HUD band, numbers readable at 30 strikes; perf at 30 strikes within budget |
| S7 | shared FX: spawn/despawn beats, verb hits, unified gold rim pass, tier caps, Calm | Calm motion: no flicker/bob (<= 3 crossings/s rule); per-tier caps enforced by tests |
| S8 | verify pass (adds the cross-cutting gates below): contrast matrix, pace.mjs at 350 with all five weapons evolved, frames at 1280x720 / 844x390@2x / 390x844@2x day + night, Matt look + real-phone check | all gates above; Matt approves |

Cross-cutting gates (from the independent review, apply from the chunk that adds each look): (a) CROSS-WEAPON CONFUSION: wolf vs bolt vs chain vs flame vs mint XP gem told apart in greyscale at 1x (value or shape difference on a contact sheet, Matt squint); (b) FRIENDLY COVERAGE near the hero (0.2 screen-height circle) measured per weapon and for the all-weapons staged frame, total <= today + 5 points, Light Trails <= 15%; (c) pup distinct from Alpha/Echo wolves (warm body, heel position); (d) ravens vs Grave Crows distinct in greyscale AND protan/deutan/tritan; (e) Burn licks vs orbit flames distinct on the foe; Mark omen still reads as a status; Rally visuals on wolves only; (f) contrast across the whole arc (0:30 / 4:00 / 8:00 / 11:30 / dawn chorus) on High/Med/Low; (g) tests: `?summons=0` restores today's sprites, sim byte-identical (sweep.mjs 24 seeds both heroes) on every chunk; (h) phone texture memory and bake time measured in S0 before any art lands.

Each chunk: tests green, sweeps byte-identical (render only), security check (no new deps, no untrusted input), fit check, LOCKED/QUEUE updated.

## 7. Risks (honest)

- Mock-ups are static composites over summon-free real frames: no lightmap/grade interaction, hand-placed positions (chain arcs are schematic), so the real night look may differ; S1 must be judged in the build.
- Wolf A is cuter/softer than the Husks; at 42 px the bite pose must carry the 'hunter' read. The Wall of Wings spread pose reads a little like a paper fan/fist at 2x.
- Raising summon size reverses A1b (Matt kept the 12% shrink); decision 2 makes that explicit.
- Glyph orbs are small at true size (~12 px); may need 1.3x.
- More summon detail = more busy pixels near the hero; the DR3 occluder and coverage gates guard it.
- Bake time, atlas size, draw calls and phone texture memory are estimates until S0 measures them.
- Hue/value collisions: pale-blue wolves, cyan bolts, white-cyan chain, mint gems and lilac flames all sit in a light cool range on a grey-blue Hollow (wolves and bolts are close in value at 1x in the mock-ups); gate (a) guards it, the shape language (silhouettes vs orb vs line vs teardrop) carries the difference.
- Ground decals (Halo disc, petals, Wheel flower) add friendly coverage near Elias; gate (b) and the decal-luminance rule guard it.

## 8. Conflict check vs docs/LOCKED.md

- Role colours (wolves pale blue, ravens violet, bolts/chain cyan, orbit lilac, gold only evolution, red only danger/tells, light red taken, bleed blood red, burn lilac): kept.
- Elias v2 flame ring (locked): option A keeps it (polish + size); B and C would reopen it.
- Wren v2 pup (cream-amber, at heel): unchanged.
- A1b wolf shrink (kept by Matt): decision 2 recommends reversing it (needs Matt).
- W8b Mark omen (violet chevron): kept, drawn inside a wax-seal disc (default, Matt may override).
- E9 evolution beat: unchanged; the evolved gold rim it fades in becomes the unified rim of section 3.6.
- Damage + crowd readability (DR1-DR4): friendly effects stay under numbers and the hero outline; Thunder Judgment height cap and Light Trails line-web removal FIX two current contradictions with those rules.
- WL6 night look: summons stay self-lit above the grade; no summon ground pool brighter than the lantern.

Fit check: one family language (light-bodied chibi spirits with a warm heart, tinted outlines, warm rims) matching Wren v2/Elias v2/Husks; value-inverse of the enemies; gold only on evolved rims; no new colour family. Security check: docs and mock-ups only; mock-up code uses Node built-ins and a local headless Chrome (own PID, own port, own temp profile), no deps, no network, no AI tools; audit captures came from a local static server on a clean export of HEAD.

## 9. Status after S7 + S8 (2026-10-23)

S0-S7 built (see docs/LOCKED.md 'S0..S7 BUILT'). S8 verify pass run on the real build with all five weapons evolved at once (Howling Legion, Wall of Wings, Spirit Tempest, Thunder Judgment, Sanctum Halo: the busiest looks), harness `scripts/s7-fx.mjs` (shots / coverage / matrix / sheet). Raw numbers: docs/screenshots/summons/s8-matrix.json, s7-coverage.json; frames s7-*.jpg, contact sheet s8-confusion-sheet.png.

Passing:
- Sims byte-identical (sweep wren/elias 24 vs origin/dev); `?summons=0` = old visuals (no S7 FX, no rim budget); per-tier caps and the Calm rule enforced by tests (tests/summon-s7.test.mjs).
- Friendly coverage near the hero (0.2 screen-h circle, High, N=5, all five evolved, 30 foes): S7 FX alone 1.1 / 1.0 / 0.3 % mean (max 2.0 / 2.5 / 0.6) desk / land / port. Every friendly visual, S7 build vs `?summons=0`: +3.9 / +1.7 / +2.3 points mean (inside +5; single-frame max +9.2 desk). Caveat: hiding every friendly also removes their lightmap glow, so the 'total' figure (82-88 %) is saturated by lighting; the S7-only figure is the clean one.
- Cross-weapon confusion (sheet, 1x, colour + greyscale, night + day): told apart by SHAPE (wolf silhouette / raven / ringed orb with glyph / thin jagged line / teardrop / diamond). Value alone does NOT separate them (all light bodies; as S5 found for orb vs gem). Matt squint still open.
- Perf pace.mjs headed RTX 3060, High, 350 foes, all five evolved, 2 interleaved pairs (25 s): work avg S6 11.47 / 13.27 ms, S7 12.70 / 11.57 ms (pair diffs +1.2 / -1.7: noise, no regression seen); ~52-64 fps, p95 work 20-27 ms on this shared machine.

Remaining misses (contrast matrix, WL6 disc per kind vs the same frame with every friendly hidden; pass = median or core p90 >= 3:1; desk, staged 350, 220-320 alive at the frozen frame):

| kind | 0:30 H/M/L | 4:00 | 8:00 | 11:30 | dawn |
|---|---|---|---|---|---|
| wolf | pass/pass/pass | 2.3 / pass / pass | 2.9 / pass / 2.9 | 2.7 / pass / pass | 1.8 / pass / pass |
| raven | 2.4 / 1.9 / 1.5 | 2.0 / 2.0 / 1.5 | 2.3 / 2.2 / 1.7 | 1.7 / 1.8 / 1.8 | 1.6 / 1.8 / 2.0 |
| flame | pass/pass/pass | 2.9 / pass / pass | 1.8 / 1.7 / 1.6 | 2.1 / 1.7 / 1.5 | 2.4 / 1.3 / 2.3 |
| bolt (few samples) | 2.7 / pass / pass | - / pass / pass | 2.2 / - / - | - | 2.7 / - / - |
| chain | pass / 2.6 / pass | 2.2 / 2.9 / 2.95 | 2.1 / 2.7 / 1.5 | 2.0 / 2.7 / 2.6 | 1.8 / 2.9 / 1.4 |

(numbers = best of median / core when failing)
1. The known HIGH-BLOOM DAYTIME loss: from 4:00 on, High fails for every kind (light bodies on the bright restored ground + bloom). Same finding as S1/S4/S6; needs Matt (bloom strength by daylight, or accept: the bodies still read by outline + shape).
2. NEW: ravens fail everywhere, also at night and on Low. The Wall of Wings ring sits inside the cream lantern pool, where violet #d9caff is the same luminance as the pool; they read by hue, ink outline and paper tips, not value. Options for Matt: darker ink outline / value drop on ravens inside the pool, or accept.
3. Flames and chain lose contrast in daylight on every tier (8:00+): white-lilac / white-cyan on the cream pool. Same class as 1 but not bloom-only.
4. Method limits: one frozen frame per cell, 6-8 samples per kind, lightmap glow counted in the mask (lowers medians); treat single cells as +/- 0.5.
Defaults taken (Matt may override): spawn ring 10 -> 2 u cream (#ffe9bc), mote colours cream-amber (#fff1c8..#ffdfa6), claw crescents pale blue, raven star lilac-white + cream feather, ink spatter 5 dots; rim budget order = draw order (wolves, ravens, flames, then glyph rims).
