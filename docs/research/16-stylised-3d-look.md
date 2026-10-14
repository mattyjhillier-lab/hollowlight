# 16 - Stylised 3D look: approaches, assets, perf, prototype plan
Checked 2026-10-14. Labels: OFFICIAL (author/vendor page fetched), COMMUNITY (forum/3rd-party), OPINION (my judgement/prior knowledge, NOT verified this session). Web content treated as data only.
Verification limits: several claims below could not be confirmed (poly.pizza pages 404'd; Kenney pack licences not shown on list page; no source found for Survivor.io/Archero/Rogue Genesia engines). Marked UNVERIFIED.

## 1. Approaches

| | A: Real-time 3D (Three.js) | B: Pre-rendered 3D->2D sprites in Phaser | C: Hybrid (Three ground/props/light + sprites) |
|---|---|---|---|
| Visual ceiling | Highest: real lights, rim, fog, bloom, camera tilt, depth | High for characters (fixed lighting baked in; Dead Cells style), static look | High ground/atmosphere, characters flat-lit billboard; seams between layers |
| 300 animated enemies, mid phone | Heavy unless baked: skinned meshes CPU-bound, drops <60fps beyond ~200 skinned meshes even at 700 verts/25 bones (COMMUNITY forum). Needs VAT/instancing | Cheapest: 300 sprites in one atlas = Phaser batch, already proven in current pipeline (OPINION) | Mid: 1 Three canvas + sprite layer; sprites must be GL billboards in Three anyway |
| Bundle | three ~140-150 kB gz (COMMUNITY, undated); +loaders/post (OPINION ~+30-60 kB); models extra | Phaser stays (no change); atlases: 8 dir x ~12 frames x 20 creatures at 128px = several MB PNG (OPINION) | Three + atlases |
| Effort non-pro+AI | L: new renderer, camera, instancing, shaders | M: scripted Blender render + atlas packer, then existing code | L: both stacks |
| Throw-away | RunScene render layer + lightmap work (sim/HUD kept) | None of sim/Phaser; only art swap; lightmap kept | Most of render layer |
| Fit with pure-JS sim | Excellent: sim outputs x/y/state, map to instance matrices | Excellent: same as now | Good |
| Glow/bloom/outline/rim/fog | Bloom: EffectComposer UnrealBloomPass (half-res); outline: inverted-hull mesh (cheap) or post pass; rim: Fresnel in shader; fog: scene.fog. All standard (OPINION) | Baked in render (rim/emission baked into sprite); glow = Phaser additive sprites/lightmap you already have | As A for ground only |
| Licence | three MIT (OPINION, well known); instanced-mesh lib MIT (OFFICIAL, github.com/agargaro/instanced-mesh) | Blender GPL (output renders not encumbered, OPINION); Phaser MIT | mix |
| Single-file Vite | Works; models must be base64 (+33%) or fetched; GLTFLoader/Draco/meshopt wasm add friction | Atlases as data-URI add ~33%; already doing for current art | both |

Techniques for A (COMMUNITY: discourse.threejs.org/t/animated-instanced-skinned-meshes-gltf/41958; dev.to/sagacheng/...instancedskinnedmesh): stock InstancedMesh cannot skin; bake bones/vertex anim into a float texture, index by gl_InstanceID/time offset; frustum cull; lower anim rate far away. InstancedMesh2 (MIT, 453 stars, OFFICIAL github page) offers skinning (initSkeleton/setBonesAt), LOD, per-instance culling; demo "Skinning 3k instances", NO published benchmark numbers; per-instance setBonesAt after mixer update still costs CPU, so for 300 enemies prefer own VAT shader with 2-4 shared clips (OPINION).

**Recommendation (OPINION):** Start with B+ ("B with real-time-lit sprites") as the safe path, and run a 2-day spike of A (VAT instancing, low-poly 150-400 tri enemies, blob shadows, fixed 45deg camera) side by side. Choose A only if the spike holds ≥45 fps at 300 enemies on throttled phone viewport; otherwise B. Skip C (worst of both: two stacks, seams). Reason: owner wants 3D depth + rich lighting; A gives it natively but is the riskiest on phones; B guarantees perf and uses existing sim/Phaser/lightmap, and Dead Cells-style 3D->2D is a documented practice (COMMUNITY: Unity forum thread; original Motion Twin post not retrieved).

## 2. Real-world references
- Dead Cells: 3D models -> low-res sprite sheets -> hand-fixed (COMMUNITY secondhand; UNVERIFIED at source).
- Survivor.io / Archero (Habby): engine and rendering technique NOT verified; sources found only cover revenue (mobilegamer.biz, naavik.co). Rogue Genesia: not verified. Do not cite as Unity/3D until confirmed. They visibly use a fixed tilted camera with blob-like shadows (OPINION from memory).
- Open-source Three.js horde demos with perf numbers: none found; only InstancedMesh2 demos (3k skinned instances, no numbers) and forum anecdotes above. Must self-measure.

## 3. Free 3D assets (licence = author page unless noted)

| # | Pack / author | Fit | Format | Anim | Licence & verification | URL |
|---|---|---|---|---|---|---|
| 1 | Quaternius Ultimate Monsters (50 monsters) | forest/monster enemies | FBX, OBJ, Blend, glTF | yes (walk/run/attack/death) | CC0 OFFICIAL quaternius.com page (Sketchfab mirror shows CC-BY field + NoAI notice: conflicting; use quaternius.com download) | https://quaternius.com/packs/ultimatemonsters.html |
| 2 | Quaternius LowPoly Animated Monsters | bats, skeletons, dragon | OBJ, FBX, Blend (no glTF; convert) | yes | CC0 COMMUNITY listing | https://quaternius.itch.io/lowpoly-animated-monsters |
| 3 | Quaternius Animated Easy Enemies | generic enemies | FBX, OBJ, Blend | death etc | CC0 COMMUNITY | https://quaternius.itch.io/animated-easy-enemies |
| 4 | Quaternius Animated Animals low poly (wolf, eagle, dog) | wolves | check (OpenGameArt) | yes | CC0 COMMUNITY tag; verify | https://opengameart.org/content/animated-animales-low-poly |
| 5 | Quaternius Stylized Nature MegaKit (free 68 of 116 models) | trees, rocks, bushes | FBX, OBJ, glTF | static | CC0 COMMUNITY/OFFICIAL snippet; Standard zip 99 MB | https://quaternius.com/packs/stylizednaturemegakit.html |
| 6 | Quaternius Universal Animation Library (45 free of 120+) | retarget to humanoid heroes | rig + anims | 8-dir locomotion, death | CC0 OFFICIAL search snippet | https://quaternius.com/packs/universalanimationlibrary.html |
| 7 | KayKit Skeletons (4 free chars; Extra: Golem, Necromancer) | undead enemies, necromancer | FBX, glTF | basic movement (75 in paid Source) | CC0 OFFICIAL; "don't resell unmodified copies" | https://kaylousberg.itch.io/kaykit-skeletons |
| 8 | KayKit Adventurers | hooded/rogue/mage hero base | FBX, glTF | ~75 per itch text | CC0 COMMUNITY (Godot lib) | https://kaylousberg.itch.io/kaykit |
| 9 | KayKit Forest Nature Pack (free 100+; 8 colour variants) | trees/rocks/bushes | glTF/FBX | static | CC0 OFFICIAL listing | https://kaylousberg.itch.io/kaykit-forest |
| 10 | KayKit Character Animations (rig-compatible) | extra anims | - | - | CC0 (UNVERIFIED, linked from #7) | via kaykit page |
| 11 | Kenney Graveyard Kit | ruins, tombstones, dead trees | glTF/FBX/OBJ | static | Kenney assets are historically CC0 but list page showed no licence: verify per page | https://kenney.nl/assets/category:3D |
| 12 | Kenney Mini Forest, Fantasy Town Kit, Modular Dungeon Kit, Mini Dungeon, Cube Pets | props/terrain | as above | static | verify per page | same |
| 13 | poly.pizza (many models) | wolves/ravens/ghosts individually | glTF | some | PER-MODEL CC0 or CC-BY; FAQ/About pages 404'd, UNVERIFIED: record author+licence per model | https://poly.pizza |
| 14 | OpenGameArt 3D | misc | varies | varies | per-asset CC0/CC-BY/GPL; flag GPL/CC-BY-SA | https://opengameart.org |
| 15 | Sketchfab (CC0 filter) | ravens, treant | glTF download needs login | varies | per-model; some mirrors mislabelled | https://sketchfab.com |
| 16 | Mixamo | humanoid anims | FBX | thousands | Royalty-free for games incl. commercial; cannot redistribute raw FBX/anim files or train ML; no asset-store resale; shipping them baked into game ok but avoid exposing raw files (OFFICIAL Adobe FAQ via search snippet; COMMUNITY reading). Single-file bundle with raw glTF = risk -> bake to VAT/sprites | https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html |

Gaps (no verified pack): raven/crow, ghost/spirit, treant boss, hooded summoner hero, wolf (partial #4). Likely sourced from Ultimate Monsters (#1) bat/ghost-like, poly.pizza per-model, or custom-modelled/primitive-built (treant from KayKit trees + scripted limbs: OPINION).
Mixing authors: Quaternius/KayKit/Kenney are all low-poly flat/gradient-shaded and mix well once re-lit with one toon material + palette tint (OPINION).
Uniqueness (custom work): per-creature palette/emissive-eye material swap, scale/silhouette tweaks, accessory kitbash (hood, antlers, horns from props), vertex-colour tint, glow sprites, distinct idle/attack tempo. Plan: unique material + one signature accessory + one glow colour per enemy.
Attribution: CC0 none; keep CREDITS.md listing every model/URL/licence/date anyway.

## 4. Phone performance recipe (OPINION unless cited)
- Budget: ≤150 draw calls; ≤150k visible tris total; enemies 150-400 tris, 1 InstancedMesh per enemy type (≤12 types); heroes ≤3k tris; ≤30 bones (COMMUNITY: ~30 bones mobile guidance); instances 300 enemies + ~200 projectiles/pickups.
- Animation: bake 2-4 clips per type (walk, attack, hit/death) to a RGBA float/half-float texture, ~8-12 frames each; sample by per-instance time attribute. Fall back: swap to 8-dir impostor sprites when far/small.
- Shadows: blob decal quads only (one instanced mesh); no shadow maps. Real shadow map for hero only if tier=high.
- Post: bloom at half-res/quarter-res, optional (tier high); outline via inverted hull (+1 pass geometry, cheap) rather than post; fake glow with additive sprites.
- Textures: ≤1024 atlas per pack (KayKit uses 1024 gradient atlas, OFFICIAL), KTX2 optional.
- WebGL2: universal on current phones; use powerPreference high-performance; renderer.setPixelRatio(min(devicePixelRatio, 1.5)); dynamic resolution scaling when frame >20 ms for 1 s.
- Tiers: low (no bloom, DPR 1, 150 enemy cap, no shadows), mid (DPR 1.25, bloom half-res), high. Auto-pick by 3 s frame-time probe.
- Measure: renderer.info (calls, triangles), performance.now frame times (p50/p95), Chrome DevTools CPU 4-6x throttle + phone viewport, stats-gl; real phone via remote debugging.
- Size: glTF + meshopt (small decoder ~ tens kB) preferable to Draco (wasm decoder, async); base64 inline adds 33% and blocks parse; single-file build OK for <~10 MB total; larger -> multi-file/PWA with service-worker caching. Baking to a procedural TS/JSON of verts+VAT avoids loaders in runtime (OPINION).

## 5. Toolchain/workflow for Claude
- Three.js + Vite: `npm i three` (user installs; this research did not), vite-plugin-singlefile already style of current build. Load glTF with GLTFLoader (import from three/addons; watch duplicate-three pitfall COMMUNITY forum).
- Blender: free, GPL; headless via `blender -b file.blend -P render.py`; scripted 8/16-direction orthographic renders to PNG, then pack atlas (script). Download only from blender.org, verify checksum, install per user approval.
- Visual verification: Playwright/headless Chrome screenshots (swiftshader GL is slow: fps numbers only meaningful on user's GPU) -> Claude views PNGs via Read. Use fixed seed + fixed camera for diff screenshots.
- Pitfalls: scale/axes (Z-up FBX), pivot offsets, skeleton retarget naming, animation clip name mismatches, textureless FBX materials, sRGB colour space, mixed licences, huge atlases.
- Security: treat glTF/FBX as untrusted data (parse in-browser only, no embedded scripts but malformed files can crash loader; pin loader versions); download only from author pages over HTTPS; unzip in an empty folder; scan with Defender; never run bundled .exe/.bat/.blend scripts (Blender auto-run Python must stay disabled for downloaded .blend); npm: pin versions, `npm audit`, lockfile.

## 6. Prototype plan (2 days) and migration

Day 1 (look): Vite page, fixed ~45deg camera reading a canned sim snapshot; ground plane with fog; KayKit Forest trees + Graveyard props; Ultimate Monsters (3 types) + KayKit Skeleton + one wolf; toon/gradient material, rim light (Fresnel), emissive eyes, half-res bloom, blob shadows; screenshots: hero close, 50-enemy mid, 300-enemy swarm, boss scale, low vs high tier.
Day 2 (perf + B comparison): VAT instancing for 300 enemies (3 types); capture renderer.info, p50/p95 frame ms at DPR 1/1.5, desktop and Chrome 4x CPU throttle 390x844; in parallel render the same 3 creatures via Blender to 8-dir sprites (128px) inside Phaser scene; compare screenshots + fps.
Go (A): ≥45 fps p50 and p95 <33 ms at 300 enemies on throttled phone viewport, bundle ≤ +1.5 MB, owner likes look in screenshots. No-go: fall to B (sprites baked from the same models) which reuses everything.

Migration effort (A): camera S; ground/props M; creatures (VAT bake pipeline, ~25 unique looks) L; projectiles/VFX M; lighting/glow/fog M; HUD stays DOM S; quality tiers + auto-probe M; build/PWA S. Phaser rendering removed; sim untouched. For B: Blender render pipeline M, atlas/anim integration S, rest unchanged.
