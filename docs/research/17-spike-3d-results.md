# 17 - Spike results: real 3D (A) vs pre-rendered sprites (B)
Run 2026-10-14 on branch `spike-3d` (not merged, shipping game untouched, `npm test` 60/60 green). Everything below was measured or looked at in this session unless marked OPINION. Code: `spike/` (standalone page `spike/index.html`, modules `spike/a`, `spike/b`, `spike/common`, tools `spike/tools`). Run: `npx vite --port 4180`, open `/spike/index.html?mode=a|b&q=high|low&n=300&pre=90` (params in `spike/main.js`).

## 1. Assets, licences, what blocked
| Pack | Author | Licence (re-read from the repo LICENSE.txt before download) | Source | Used for |
|---|---|---|---|---|
| KayKit Character Pack: Adventurers 1.0 | Kay Lousberg | CC0 | github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 | hero: `Rogue_Hooded` (hooded, 6k tris, 41 bones) |
| KayKit Character Pack: Skeletons 1.0 | Kay Lousberg | CC0 | github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0 | 4 enemy looks from Minion / Rogue / Warrior (Mage baked but unused) |
| KayKit Halloween Bits 1.0 | Kay Lousberg | CC0 | github.com/KayKit-Game-Assets/KayKit-Halloween-Bits-1.0 | 15 props (dead/pine trees, gravestones, pumpkin, lantern, fence...) |

Checksums, sizes, dates: `spike/assets/CREDITS-3D.md`. Raw zips stay outside the repo (`C:\Users\matty\hollowlight-assets-raw\`); Defender custom scan: no new detections; nothing downloaded was executed; GLBs parsed only as data (JSON+bytes) by my strip script and by three's GLTFLoader.
**Substitutions (could not do as briefed):** Quaternius Ultimate Monsters is CC0 on quaternius.com but its Download button is a Google Drive folder click-through, not scriptable, so not downloaded. KayKit Forest Nature is itch.io only (click-through) and has no GitHub repo, so I used KayKit Halloween Bits (same author/style, has trees) instead. Matt can fetch Ultimate Monsters by hand if wanted (see section 6).
Repo-added: assets 2.7 MB (GLBs were 3.6-4.9 MB each; `spike/tools/glbstrip.mjs` drops unused animation clips, leaving walk/run/idle: ~0.5 MB each), baked atlases 1.6 MB, screenshots 2 x 2.7 MB.

## 2. Techniques
- **A (three.js 0.186.1, exact pin, MIT, official package, no other deps).** Enemies: hand-rolled **VAT instancing** (no InstancedMesh2 dependency): each creature type is baked once at load by skinning every vertex over 8 walk frames into a float RGBA32F texture (positions + per-frame smooth normals), then one `InstancedMesh` per type with a patched `MeshToonMaterial` that reads `gl_VertexID`, lerps two frames by `uTime + aPhase` (instanced attribute) and adds rim light + hit flash. Chosen because it is dependency-free, one draw call per type, and cost is independent of bone count. Look: 4-step cel gradient, hemisphere + cool moon directional + one warm lantern point light following the hero, linear fog, blob-shadow decals (one instanced mesh), emissive spirit gems/orbs/bolts with UnrealBloom (half-res, **High only**). Hero is one real SkinnedMesh + AnimationMixer (12 draw calls). Ghost wolf/raven are primitive-built (no creature models in the packs).
- **B (same models, pre-rendered).** `?mode=bake` renders the same models offscreen with three.js in headless Chrome (ortho camera at the same 48 degree pitch, same toon+rim, fixed warm key + cool back rim) into 8-direction x 6-frame atlases: characters 2048x1920 (hero + 4 enemy looks, 128 px cells, 1.5 MB PNG), spirits, props. Drawn with Phaser 3 WebGL (pooled sprites, Y-depth sort, additive glow sprites, blob shadows), ground = one fragment shader. No Blender needed.
- Both: driven by the **real `Sim`** (`spike/common/drive.js`: god mode, fixed 1/60 step, scripted path, enemy top-up to N), same camera pitch and world scale, same life map.

## 3. Numbers
Method: headless Chrome on the RTX 3060 (confirmed GPU string `ANGLE ... RTX 3060 ... D3D11`), `--disable-gpu-vsync --disable-frame-rate-limit` (rAF uncapped), `gl.finish()` each frame so work-ms includes GPU, 8 s after 4 s warm-up, sim at t=300 s with god mode, N enemies topped up. Phone = 390x844 DPR 2 + `Emulation.setCPUThrottlingRate(4)` (CPU only; the GPU is not throttled and no real phone was used). "Work" = scene update + render submit + GPU sync, excluding sim/life (listed separately). Raw rows: `spike/bench-results.json`. **Noise is large** (headless rAF pacing is erratic; one A desktop row reported 261 fps, repeat runs of phone A-high-300 gave 33.7, 37.1 and 24.6 fps), so read the work-ms column and treat fps as +-25%.

Phone viewport + 4x CPU throttle, High tier (DPR capped 1.5):
| Enemies | A fps | A work ms (p95) | A calls / tris | B fps | B work ms (p95) | B calls / quads | Current game fps (cap 60) | cur. calls / sprites |
|---|---|---|---|---|---|---|---|---|
| 100 | 43.5 | 15.1 (30.7) | 53 / 0.70 M | 41.6 | 16.9 (30.2) | 5 / ~N+60 | 35.0 | 9 / 155 |
| 200 | 42.0 | 14.9 (36.2) | 53 / 1.19 M | 34.4 | 14.4 (29.2) | 5 / ~N+60 | 30.0 | 9 / 255 |
| 300 | 33.7 (24.6-37.1) | 16.8 (42.5) | 53 / 1.70 M | 33.8 | 15.4 (30.0) | 6 / ~N+60 | 24.4 | 9 / 349 |

Phone, Low tier (DPR 1, no bloom): A 42.9 / 23.3 / 21.7 fps at 100/200/300 (work 13.1 / 21.8 / 20.6 ms, 39 calls); B 33.0 / 41.7 / 26.7 fps (work 17.3 / 13.1 / 19.6 ms, 5 calls). The sim itself costs 2-12 ms of these frames under 4x throttle (same for every option, not in "work").
Desktop 1280x720 DPR 1, High: A work 1.6 / 3.4 / 3.7 ms (fps 261* / 77 / 73), B work 2.9 / 3.4 / 4.3 ms (83 / 79 / 73), current game 58 fps at 100 and 300 (vsync-capped, work 5.6 / 7.1 ms). Low tier desktop A 2.5-2.8 ms, B 3.3-4.3 ms.
Static budget facts (A): the KayKit characters are **5,000-6,000 tris each** (budget in doc 16 was 150-400), so 300 enemies = 1.7 M tris/frame. That is trivial for an RTX 3060 but unproven and almost certainly too heavy for a mid-range phone GPU, which this test cannot show. Bundle: three + loaders + bloom = 175 kB gz / 681 kB raw JS (spike chunk); Phaser (B) is already in the game; A runtime assets ~2.8 MB (3.7 MB base64), B atlases 1.6 MB for 5 creatures (about 8 MB for 25 creatures, OPINION).

## 4. Screenshots (`docs/screenshots/spike3d/`, copies in `spike/screens/`, all < 300 KB; downscaled/quantised so some banding is the encoder)
a-desktop, a-phone, a-swarm, a-boss-or-big, b-desktop, b-phone, b-swarm, a-life-early, a-life-late, b-life-early, b-life-late. I opened every one with the image reader; this is my own visual judgement, not Matt's.
**Honest critique**
- **A, premium:** real depth (perspective camera, fog, lantern pool on the ground that moves with the hero), toon-banded lighting, rim-lit characters, glowing cyan gems with bloom, transparent ghost wolves. The restored/hollow ground and the dark cracked purple corruption read at a glance. Chunky skeleton crowd in a-swarm is readable and charming. Feels like a mobile hit's camera.
- **A, cheap:** the ghost wolf looks like a boxy low-poly pig, the raven is a paper plane; the green "treant" boss is just a tinted, scaled Skeleton Warrior with a neon rim (reads as a green giant); hero is small at desktop zoom and the green hood is hard to tell from the green-tinted enemies; enemies are all pale skeletons in tints (not dark-fantasy forest creatures); weapon blobs (orbs, bolts) bloom into a bright mess at the hero when many overlap. Props (trees) sit in a ring outside the camera, so no screenshot actually shows the forest wall; the first test with trees at the wrong scale was oppressive, so tree placement/occlusion still needs design.
- **B, premium:** the same character art, tidy silhouettes, 5 draw calls, trivially stable. Ground shader gives the same life/corruption effect.
- **B, cheap:** flat, fixed-light sprites (no response to the lantern), no real depth or parallax, 8 directions pop when turning, only 6 walk frames; ground lacks A's lighting richness; scale of everything is baked, so any later zoom/DPR change softens sprites (128 px cells); props are far fewer (5 types).
- Verdict on look: **A is clearly richer** and matches "stylised 3D-looking"; B is a decent fallback but looks like a smaller step up from today. Visual verification caveat: headless frames only, no motion judged, no real phone.

## 5. Stretch: the life map (Hollowlight identity)
Implemented in `spike/common/life.js`: 128x128 grid over the 4000 px world, two float channels (life, corruption; signed single channel in IDENTITY.md can replace it). The hero lantern (r 80 px) and spirit units (wolves/ravens/orbs, r 40) paint life; every enemy paints corruption (r 36, rate 0.14/s); life fades 0.003/s, corruption fades 0.05/s and eats life. Packed to an RGBA8 `DataTexture` (64 KB) uploaded every 3rd frame. **A:** a patch on the ground and prop materials samples it (world XZ), adds noise-thresholded edges, desaturates/dims hollow cells to cold grey, boosts living cells, and blends corruption to near-black with violet vein lines. **B:** the same GLSL inside the Phaser ground shader, plus per-prop tint sampled on the CPU.
Screenshots: `a-life-early` (1.2 s in: hollow, small lit pool, enemy corruption top-left), `a-life-late` (300 s fast-forward: restored swathes, a corrupted patch right) and `b-life-*`. It works in both and clearly reads; hollow vs alive contrast needs tuning for colour-blind safety (OPINION).
**Cost:** 0 extra draw calls (patched existing materials / shader). CPU painting 0.4-1.1 ms per frame on desktop (2.4-4.2 ms at 4x throttle) for ~300 enemies; GPU +~0.3 ms desktop (A High 300 work 2.75 -> 3.03 ms with life on). On the throttled phone viewport A-High-300 went 37.1 -> 24.6 fps life off -> on in one pair of runs (noisy; painting should be cut by stamping only on-screen enemies and using 1 cell per enemy). Props (A): free (same shader). Since A failed the strict go/no-go below, the identical effect was also done in B as asked.

## 6. How unique can creatures be, gaps, how to fill
With these three packs: 1 hooded hero + 3 skeleton bodies (+ Mage, Rogue-hooded variants) give ~6 silhouettes. Per-instance tint, rim colour, scale, accessory kitbash (Halloween Bits helmets/lanterns/bones as attachments), and animation phase/speed give maybe 10-12 distinguishable looks, but they remain "skeleton family": identity brief wants hero/boss/signature spirits unique. Animation: only walk/run/idle/hit baked; attacks, death and spawn clips exist in the source GLBs (stripped for size).
Gaps confirmed: **no wolf, no raven/crow, no ghost/spirit, no treant, no root crawler**, no Wren/Elias hero model. Filled in the spike with primitives (poor, see critique). Fill options: (1) Matt downloads Quaternius Ultimate Monsters by hand (CC0, Google Drive) for bats, ghosts, plant monsters, wolves-ish; Quaternius animated animals for wolf/raven; (2) KayKit Forest Nature (itch, by hand) trees + scripted limbs/eyes for the Elder Treant; (3) custom-modelled ghost wolf/raven as simple 300-tri shapes (needs a modeller; no Blender installed); (4) poly.pizza per-model CC0, record author each time. Either way models must be decimated to ~300-600 tris for A (needs Blender or a one-off decimation tool, which would need Matt's approval).

## 7. Go / no-go (criteria from doc 16)
| Criterion | Result |
|---|---|
| A: >= 45 fps p50 and p95 < 33 ms at 300 enemies, throttled phone viewport | **Not met as built:** 33.7 fps (range 24.6-37), p95 frame 70 ms; Low tier worse (21.7). |
| Bundle <= +1.5 MB | three 175 kB gz OK; A assets 2.8 MB raw: over until models are decimated. |
| Owner likes the look | Not yet judged by Matt; my read: A better than B. |
| Context | The shipping game measures 24 fps at 300 on the same emulation, B 33.8, so the 4x-throttle profile is CPU-bound by sim + JS, not by rendering tech: A is not worse than today. |
**Strict verdict: NO-GO for A as built.** The failure is a CPU emulation artefact plus un-budgeted 5k-tri models; the real phone GPU risk is untested.

## 8. Recommendation
1. Do not start the full A migration yet. Take Matt's look decision from the screenshots first (A richer; B safer).
2. If Matt wants A: one more short spike with decimated 300-600 tri creatures (real or sourced), life-paint only for on-screen entities, sim cost trimmed, and a test on a real mid-range phone via remote debugging. Gate: >= 45 fps there at 300 enemies, else fall back to B.
3. Otherwise B+ (bake from 3D models, Phaser): lowest risk, reuses sim/UI/pipeline, but expect a smaller visual jump; atlas size grows ~1.5 MB per 5 creatures (OPINION: needs a per-creature frame budget).
4. Regardless: life map is cheap and carries the identity in either path; the hero/boss/spirits need bespoke models.

## 9. Migration effort (S <= 1 evening, M = a few evenings, L = week+)
A: camera S; ground/props/forest-wall design M; creatures (decimate + VAT bake pipeline + 25 looks) L; projectiles/VFX (hit rings, damage numbers, bolts in 3D) M; lighting/fog/bloom + quality tiers + auto-probe M; life map M (S in B); HUD stays DOM S; input/hero rig + animation states M; save/build/PWA S. Phaser rendering removed, sim untouched.
B: bake pipeline hardened (headless script, per-creature frame budgets, 16 dirs?) M; atlas integration into RunScene S; ground life shader S/M; unique creature art unchanged problem L (same as A); rest unchanged.

## 10. Security
Downloads only from the official KayKit GitHub org (CC0 re-read from each LICENSE.txt first), sha256 recorded, Defender scan clean, nothing executed, zips outside repo. `three@0.186.1` exact (MIT, 0 dependencies, published 2026-09-24, >2 weeks old). `npm audit`: **0 vulnerabilities with `--omit=dev`**; full audit shows 5 pre-existing dev-only advisories (esbuild/vite dev-server, braces/micromatch via vite-plugin-singlefile) unrelated to this change; not auto-fixed (fix needs breaking vite upgrade, to be tested on `dev`). No CDN, no other dependency, glTF treated as data.
