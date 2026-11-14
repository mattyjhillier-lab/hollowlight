# 35 - Visual character options: better-looking, faster-made creatures
Researched 2026-11-14 (web only, nothing downloaded or installed). Labels: OFFICIAL, COMMUNITY, OPINION (my judgement, not verified), UNVERIFIED. Builds on docs/research/20-ai-assisted-art-pipeline.md (hosted-tier ToS, copyright law, Civitai licence checks, LoRA trainers are not repeated) and 41-summons-art.md. No AI-art decision made here; that is Matt's. Written under time pressure: sections marked TODO are unfinished.

## 0. Short answer
1. Nothing found beats our code-drawn rigs as SHIPPED art: skeletal tools/packs either cost money, add a runtime dependency, or cannot match our locked recipe (L2, H2, chibi P1, unique silhouettes).
2. The real cost on Lucinda was no shared target image: Claude drew from words, Matt reacted, repeat. Cheapest win: give Claude a picture to draw from (Claude can read PNGs) plus an automatic silhouette/size test sheet.
3. Local AI (SDXL, FLUX.1 schnell) suits one-off private concept references; poor at consistent animated sprites.
4. CC0 packs suit props/particles/study only, not heroes, bosses or companions.

## 1. Free / CC0 art packs
| Source | Licence | Use for us | Label / URL |
|---|---|---|---|
| Kenney.nl | CC0, "free to use, even in commercial projects", no credit needed; modification/AI not addressed on page, per-pack licence file governs; some packs ship vector source | Study + parts (shapes, UI, particles). Flat style does not match H2 rim light | OFFICIAL https://kenney.nl/support ; mirrors https://opengameart.org/content/shape-characters |
| OpenGameArt | PER-ASSET (CC0, CC-BY, CC-BY-SA, GPL). BY needs credit in docs/CREDITS.md; avoid SA/GPL | Mostly pixel or generic. Kawaii Monster Enemy 03 is CC0 SVG (one monster) https://opengameart.org/content/kawaii-monster-enemy-03 ; Food Monsters Pack has SVG but CC-BY https://opengameart.org/node/18957 | COMMUNITY |
| itch.io free assets | PER-ASSET; filter CC0, verify on each page, downloads untrusted | Props only | OPINION |
| Quaternius / Kenney 3D | CC0 3D | PARKED (3D rejected) | - |

OPINION: CC0 lets us legally modify and ship, but a generic pack sprite contradicts IDENTITY.md (hero/boss/signature creatures custom, unique silhouette).

## 2. Procedural / vector / skeletal tools
| Tool | Licence | Beats hand-written canvas code? |
|---|---|---|
| Inkscape | GPL editor | No: GUI needs Matt's hands; Claude already writes SVG-style code |
| Rive | Runtimes MIT, no royalties (OFFICIAL https://help.rive.app/runtimes/overview ; https://github.com/rive-app/rive-wasm). Editor free-tier terms UNVERIFIED | No: extra WASM dependency, editor Claude cannot drive |
| DragonBones | MIT but listed discontinued (COMMUNITY https://alternativeto.net/software/dragonbones/about ; https://cdnjs.com/libraries/dragonbones) | No: dead, GUI-only, needs raster parts |
| Spine | Paid (about 69 to 379 USD, sources disagree); runtime use needs an editor licence, Phaser plugin included (OFFICIAL https://en.esotericsoftware.com/spine-editor-license ; COMMUNITY https://phaser.discourse.group/t/what-is-the-best-free-spine-editor-for-phaser/4381) | No: breaks "everything free" |
| Lottie/dotLottie | Player MIT per index (check repo) https://docs.lottiefiles.com/dotlottie-players | No: not game-oriented, no Phaser integration found |
| Krita / Blender Grease Pencil (GPL) | Free; Krita can export a Phaser atlas https://phaser.discourse.group/t/howto-export-krita-animation-to-texture-atlas/10305 ; Blender sprite-sheet add-on GPL-3.0 https://extensions.blender.org/add-ons/sprite-sheet-generator/ | Only if Matt hand-draws, or Dead Cells-style 3D-to-2D (heavy, needs models) |
| Spriter-style tools | not checked | UNVERIFIED |

Verdict (OPINION): our canvas rigs baked to textures are the right free, dependency-free architecture. Add SCRIPTS around them (test sheets, checks), not a new animation runtime.

## 3. Local AI image generation (RTX 3060, 16GB RAM)
1. Licences: SDXL 1.0 = CreativeML OpenRAIL++-M, commercial use allowed with use restrictions (OFFICIAL https://stability.ai/blog/stable-diffusion-sdxl-1-announcement ; read the repo licence file before relying). FLUX.1 schnell = Apache 2.0 (OFFICIAL https://huggingface.co/black-forest-labs/FLUX.1-schnell). Avoid FLUX.1 dev and most Civitai fine-tunes for shipped work (doc 20).
2. Good at: one concept image per creature (pose, colour, silhouette idea), colour moods, textures; many variants fast so Matt picks by eye.
3. Bad at (OPINION, matches doc 20): same character across poses, walk cycles, clean sprite edges, our exact L2/H2 recipe; drifts to "average fantasy". A LoRA on 15 to 30 curated images helps but costs Matt's curation time.
4. Vectorising: VTracer (MIT, raster to SVG) https://github.com/visioncortex/vtracer (COMMUNITY listings). Output is lumpy, many paths, no articulated parts (OPINION): fine as a trace-over underlay, not a shipped rig.
5. Provenance: if AI images are private reference only and Claude redraws in code, shipped art stays original code art. Add one honest line to the AI-use disclosure in docs/CREDITS.md; wording is Matt's call. Never prompt with a living artist or another game's characters.
6. Security: Forge/ComfyUI installs pull many Python packages (supply-chain risk, doc 20). Only .safetensors from official pages; Matt-side step.

## 4. Checklists: code-drawn creatures at small size (OPINION, standard practice + our recipe)
Sizes: Wren 65px / Elias 75px on desktop at 640x360, 44/50px on phones.
### Silhouette
- [ ] Flat-black fill on grey at 40px: still identifiable and distinct from every other creature.
- [ ] One signature shape (hood point, tail, horn, wing) bigger than 1/5 of height.
- [ ] Different outline families per role: round (friendly), spiky (enemy), tall (boss).
- [ ] At least one visible gap (negative space) at 40px.
- [ ] Hero vs companion differ in overall shape (upright vs low and wide) so the pair never merges (the Lucinda + baby dragon failure).
### Shape language (chibi P1)
- [ ] Head 40 to 50% of height, big low-set eyes, minimal mouth/nose.
- [ ] Rounded rects/circles for bodies; sharp triangles only for danger or magic.
- [ ] Tapered capsule limbs, mitt hands and feet.
- [ ] Hero accent warm amber; enemy cool grey-blue with dark vein corruption; at most 5 colours plus outline.
### Ramp lighting (H2 + L2)
- [ ] 3-stop ramp per fill (shadow, base, light) with hue shift: cooler and more saturated shadows, warmer lights; outline = darker hue-shifted fill, never black.
- [ ] One warm key light (lantern side), 1 to 2px pale-amber rim on the opposite edge.
- [ ] Two to three big value shapes; detail under 2px is noise at 40px.
- [ ] Contrast check against restored grass and grey Hollow ground (known weak spot: pale-on-pale).
- [ ] Squint/blur test: face, hands and prop remain the highest-contrast spots.
### Animation
- [ ] Squash and stretch of 2 to 3px; bob synced to footfalls.
- [ ] Anticipation (2-frame wind-up) then overshoot on abilities.
- [ ] Secondary motion (scarf, tail, lantern thread) lags the body; this gives each character personality.
- [ ] Distinct idle per character; one shared phase variable with per-part offsets.
- [ ] Mirror test; labelled 8-pose contact sheet at 1x and 3x before showing Matt.
- Reading: https://bugnet.io/blog/readable-game-art-why-clarity-beats-detail ; https://unity.com/blog/half-past-yellow-creating-enemy-visuals-tempest-tower (rim light defines top-down silhouettes); both COMMUNITY/vendor blogs, seen via search summaries.

## 5. Learning from similar games (inspiration only)
No GDC talk or postmortem specifically on chibi survivors art surfaced; stated plainly. TODO: search GDC Vault and Brotato/Halls of Torment devlogs directly.
| Source | Takeaway | Label |
|---|---|---|
| Dead Cells pipeline https://www.jikguard.com/news/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-dead-cells , https://80.lv/articles/case-study-dead-cells-character-art-pipeline | Invest in the pipeline once; ours is the code rig + test sheet | COMMUNITY, secondary (original not fetched; the one fetch returned only an index page) |
| Kill Knight identity https://unity.com/blog/how-playside-studios-built-kill-knight-visual-identity | An effect that looked good in concept was noisy in motion: judge in-game | vendor blog |
| Sable readability https://www.gamedeveloper.com/marketing/how-shedworks-refined-the-art-of-sable-in-pursuit-of-readability | Cut detail, lean on shape/colour | COMMUNITY |
| Geometry Survivor notes https://legitsauce.pages.dev/blog/geometry-survivor-design-notes/ | In swarms, distinct filled shapes beat detail; art is a gameplay feature on phones | COMMUNITY |
| Souls Tree devlog https://federicomello.itch.io/souls-tree/devlog/548340/aesthetics-and-character-design | Chibi chosen so faces and weapons read (supports P1) | COMMUNITY |

## 6. Why Lucinda took many rounds (OPINION) and fixes
- No shared target: agree ONE reference image first.
- Hero and pet drawn separately: draw both on one sheet at 40px early.
- Complex anatomy redrawn freehand: a small shared part library (wing, horn, tail, paw) in src/gfx with ramp/outline/rim helpers.
- Feedback only by eye: a check script (silhouette at 40px, palette count, contrast vs ground) printing a contact sheet. TODO: scope against existing src/gfx helpers (not inspected this session).

## 7. Recommendation
First prototype (one chunk, no AI decision needed): a creature test harness in a sandbox (Matt likes live sandboxes): any creature at 1x/3x/phone size, black-silhouette and squint modes, on both ground types, with a pose strip. Redo one weak creature through it as the benchmark (suggest the baby dragon). Success = fewer redraw rounds to Matt's yes.
Risks: harness may feel like "not the game" (keep to one chunk); AI reference may bias toward generic fantasy (Matt picks, Claude keeps the locked recipe and unique silhouette); disclosure wording; Forge install is a Matt-side security step.

### Three options for Matt
1. **A (Recommended): test harness + shared part library, art stays code-drawn.** Free, no dependency, no licence question, helps every future creature, attacks the redraw cost directly.
2. **B: A plus a private AI concept-reference session for the next new creature.** Matt generates 4 to 6 concepts in Forge (SDXL or FLUX.1 schnell), picks one; Claude redraws it in code; references never shipped; one-line CREDITS disclosure. Faster agreement on look; costs Matt time. Matt decides.
3. **C: Try Rive or DragonBones on one creature.** Extra dependency, GUI work Claude cannot do, Rive terms unverified, DragonBones discontinued. Not recommended.
Parked: CC0 packs as props only, Blender 3D-to-2D, own-sheet LoRA (revisit if B proves useful), Quaternius (3D).
