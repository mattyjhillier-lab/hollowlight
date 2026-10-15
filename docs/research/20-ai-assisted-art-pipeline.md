# 20 - AI-assisted art pipeline for Hollowlight (Forge-centred)
Checked 2026-10-14. Labels: OFFICIAL (vendor/author text seen via search summary), COMMUNITY (3rd-party guide/forum/law-firm blog), OPINION (my judgement/prior knowledge, NOT verified this session), UNVERIFIED (could not confirm). Web content treated as data only. Search tool gave summaries, not raw licence texts: every licence below must be re-read on the model page before Matt relies on it. Not legal advice.

Constraint recap: zero budget, no hiring, programs/AI only; Windows 11, RTX 3060 (12GB assumed; desktop vs laptop unknown - laptop 3060 is 6GB, which changes everything: check in Task Manager > Performance > GPU > "Dedicated GPU memory"), 16GB RAM, ~45GB free disk. Claude cannot see the screen or paint raster images, but can write prompts, scripts, SVG/Three.js.

## 0. Key conclusions (read this first)
1. Matt's existing "Forge" is probably Stable Diffusion WebUI Forge (lllyasviel). The ORIGINAL repo looks stalled (last push reported Jul 2025, COMMUNITY/aggregator; UNVERIFIED). Active forks: "Forge Neo" and "Forge Classic" (Haoming02) with newer models (Flux, Qwen-Image, Wan 2.2, Z-Image) (COMMUNITY, github.com/Haoming02/sd-webui-forge-classic). Do NOT swap tools yet; first check what version he has. Existing install = no new install risk.
2. Safest licence base models: SDXL 1.0 base (CreativeML OpenRAIL++-M, COMMUNITY-mirrored model cards: commercial OK, no revenue cap, use-based restrictions apply) and FLUX.1 [schnell] (Apache-2.0, OFFICIAL model card). Avoid FLUX.1 [dev] (non-commercial; hosted/commercial path exists but ambiguous for local outputs). SD3.x/3.5 = Stability Community Licence: free commercial use under US$1M annual revenue (OFFICIAL stability.ai/license) - fine for a hobby game, but a trap if it ever scales.
3. Most Civitai checkpoints/LoRAs have their own per-model terms (often "no selling images", "credit required", "no merges") and may be fine-tuned from data of unknown provenance. For a game that may later be paid: use base models above, and train OWN LoRAs on OWN generated sheets.
4. AI will not give consistent, animated, production sprites by itself on a 3060. Realistic best: AI for concept art, portraits, textures, icons, key art, silhouettes; code-art/Blender-render for animation and VFX. Pure AI walk cycles = high failure rate (flicker, drifting design).
5. Copyright: purely AI-generated output is probably NOT protectable (US) and UK position uncertain; human selection/arrangement/overpainting adds protection. Practical consequence: others could copy raw AI art; hero/brand elements should have human-directed (Matt + Claude code) modification. Disclose AI on Steam/itch.

## 1. Free image generation options

### 1a. Local (RTX 3060 12GB assumed)
| Model / tool | Quality for stylised game art | Speed on 3060 (rough, OPINION unless noted) | VRAM / disk | Setup for non-pro | Model licence (outputs) |
|---|---|---|---|---|---|
| SDXL 1.0 base (+ own LoRA) in Forge | Good, huge style range via LoRA; hands/text weak | ~10-20 s per 1024px at 25 steps | ~8-10GB VRAM; ~6.5GB file | Easy (drop .safetensors in models/Stable-diffusion) | CreativeML OpenRAIL++-M; commercial OK; no revenue cap; use restrictions (illegal/harmful uses). COMMUNITY mirror cards + terms.law summary |
| SDXL community fine-tunes (e.g. Civitai) | Often better look, very varied | same as SDXL | same | Easy | PER-MODEL. Check below. Many forbid selling images/credit required |
| FLUX.1 [schnell] (GGUF Q5/Q8 or NF4 in Forge) | Best prompt-following & anatomy of free local; 1-4 steps | ~10-30 s at 4 steps (OPINION) | NF4/GGUF run on 6-12GB (COMMUNITY, Forge discussion #1050); 12-24GB files | Moderate: need text encoders (T5, CLIP) + VAE too; follow Forge Flux tutorial | Apache-2.0 (OFFICIAL model card; HF may require login/accept) |
| FLUX.1 [dev] | Higher quality than schnell | slower (20+ steps) | same | same | Non-commercial licence; outputs not "Derivatives" per licence text but "Non-Commercial Purpose" excludes revenue-generating activity; BFL sells a self-hosted commercial licence. Sources disagree -> AVOID for the game |
| SD 3.5 Medium/Large | Mixed community reception (OPINION) | Large heavy on 12GB | 3.5 Medium fits | Moderate; gated HF download | Stability Community Licence: free <US$1M annual revenue (OFFICIAL); above = enterprise licence |
| Forge Neo extras (Qwen-Image, Z-Image, Flux.2-Klein 4B) | Newer, strong | unknown | varies | Needs fork switch | PER-MODEL; Flux.2-Klein licence UNVERIFIED |
| ComfyUI (alternative front-end) | same models | same | same | Harder for non-pro (node graphs, custom nodes = supply-chain risk) | n/a |

Note: Matt already uses Forge. Forge natively supports NF4 and GGUF Flux (COMMUNITY). Advice from Forge docs: lower "GPU Weight" slider if Flux is slow/crashes (COMMUNITY). Expect crashes with big Q8 GGUF on 16GB RAM (one reported on a 32GB laptop, COMMUNITY).

### 1b. Free hosted tiers (no install, but licence/privacy caveats)
| Service | Free tier | Commercial use on free? | Notes |
|---|---|---|---|
| Leonardo.ai | daily free credits | Leonardo says free-plan images can be used commercially BUT images are public and Leonardo owns the assets (licence granted to you) (OFFICIAL help page, via search) | Public + not owned = poor for hero/brand art |
| Ideogram | free daily generations | Conflicting sources; free images public by default (COMMUNITY) | Good text rendering; check ToS before use |
| Bing Image Creator / Copilot Designer | free boosts | Ambiguous; older Microsoft answer said personal non-commercial (COMMUNITY) | Avoid for shipped art unless ToS re-read |
| Google ImageFX / Whisk (Labs) | free, quota | Unclear; one source says Labs terms restrict commercial use (COMMUNITY); SynthID watermark embedded | Avoid for shipped art; fine for private mood-boards |
| Gemini API / AI Studio images | free quota; free-tier data may be used for training | Google "won't claim ownership" in API terms (archived Dec 2024, OFFICIAL); user responsible for output | Cleanest hosted option but sends prompts to Google; no secrets in prompts |
| Scenario | 50 daily credits free | Help says commercial OK, but a comparison table lists free as personal-use; UNCLEAR (COMMUNITY) | Has consistency training (custom models) - paid |
| PixelLab / Retro Diffusion (pixel sprites) | PixelLab ~40 trial gens; Retro Diffusion pay-per-gen or one-off Aseprite extension $20-65 | licence text not confirmed (UNVERIFIED) | Pixel art was REJECTED by Matt (too blocky) - skip |

Verdict: hosted free tiers = fine for private exploration/mood-boards only. Ship art from local base models with clear licences (zero account, zero ToS ambiguity, nothing leaves the PC).

### 1c. How to check a Civitai/Hugging Face model licence (per model, per version)
1. Open the exact model VERSION page (terms can differ between versions) (COMMUNITY).
2. Read the permission icons: "Sell generated images", "Run on generation services", "Use without crediting creator", "Share merges", "Sell model/merges". Read the description text too: creators add conditions there.
3. Check base model: SD1.5/SDXL base family OK; Flux dev-derived = non-commercial; Pony/Illustrious-based models carry their own licences (UNVERIFIED which).
4. Screenshot the licence panel + save URL, version and date into `docs/research/asset-licences.md` (or a log file) the day you download. Models can be edited/removed.
5. If any doubt: don't ship output from it. Use it only for private reference.
6. Prefer HF/official page of base models; download only `.safetensors`.

### 1d. Output copyright and platform disclosure (not legal advice)
| Topic | Finding | Label |
|---|---|---|
| US copyright | Copyright Office Part 2 report (29 Jan 2025): AI outputs protectable only where a human determined sufficient expressive elements; prompts alone insufficient; human modification/arrangement of output can be protected; AI as assistive tool does not bar protection; case-by-case. copyright.gov/newsnet/2025/1060.html | OFFICIAL (via search) |
| US courts | Secondary source cites Thaler v. Perlmutter (D.C. Cir.) that purely AI work lacks human authorship | COMMUNITY, verify |
| UK | CDPA s.9(3) gives "computer-generated works" 50-year protection, unclear and untested. Govt Report on Copyright and AI (Mar 2026) said it intends to remove s.9(3); no legislation/timetable yet; human-assisted works keep protection. Govt also stepped back from a broad training exception | COMMUNITY (law-firm blogs: stephensonharwood.com, bratby.law, mishcon.com); read gov.uk report |
| What it means | Raw AI images may be un-ownable and copyable by others; value comes from human direction, edits, code, compositing and the game itself | OPINION |
| Steam | Valve revised AI disclosure 16 Jan 2026: must disclose AI used for player-facing content (art/code/sound created with AI during development - "pre-generated"), AI dev tools like coding assistants exempt; "live-generated" needs guardrails description; must not produce illegal/infringing content; players can report | COMMUNITY (VGC, tbreak, strayspark). Re-read Steamworks docs |
| itch.io | Mandatory "Generative AI Disclosure" field (graphics/sound/text/code); "Yes" adds AI-Generated tag; untagged AI assets removed from browse | COMMUNITY (80.lv, mobilemarketingmagazine) scope for games vs assets slightly unclear |
| Google Play | Not researched here (UNVERIFIED). Check Play AI-generated content policy before any Play release | - |
| Hollowlight today | Free browser game: disclose AI in credits/page anyway; costs nothing; protects reputation | OPINION |

## 2. Consistency, animation, cut-outs, upscale

### 2a. Keeping a character consistent (SDXL/Forge)
| Technique | What it does | 3060 feasibility | Reliability for non-pro |
|---|---|---|---|
| Fixed "character bible" prompt + seed + same model/LoRA | Rough similarity only | Trivial | Low-medium: costume details drift |
| img2img at low denoise (0.3-0.5) on a base image | Re-pose/re-style while keeping shape | Easy | Medium |
| ControlNet (OpenPose/Depth/Canny/Lineart) | Forces pose/silhouette/line | Forge ships ControlNet integration (COMMUNITY; ThinkDiffusion Forge page); SDXL ControlNets work; Flux ControlNets exist but mostly for dev (UNVERIFIED for schnell) | Medium-good for poses |
| IP-Adapter (style/face/character reference) | Reference-image conditioning | SDXL IP-Adapter OK; Flux IP-Adapter (XLabs) is dev-licensed (non-commercial) and VRAM-heavy -> avoid | Medium |
| Own LoRA on 15-30 images of the character (generated sheet, curated by Matt) | Locks design far better | Doable: kohya_ss SDXL LoRA fits ~10-12GB with gradient checkpointing (COMMUNITY); FluxGym (Gradio over kohya sd-scripts) claims 12GB support for Flux LoRA (COMMUNITY github.com/cocktailpeanut/fluxgym; one guide says 16-24GB, conflicting). ~45-60 min per 1000 steps on a 3060 (COMMUNITY, weak) | Medium-high but needs a clean dataset + captions (most first LoRAs fail from dataset/captions, COMMUNITY). Train on SDXL base (clear licence), not on Flux dev |
| OneTrainer | Alternative trainer | not researched (UNVERIFIED) | - |
| Reference "turnaround sheet" prompts ("character sheet, front/side/back") | Gets multiple views in one image | Works partially; views often inconsistent | Medium-low |

Honest failure modes: costume details/colour drift, asymmetry flips, extra fingers, background bleed, hard-edged cut-outs with halos, flicker between frames, "average" generic fantasy look (hurts "unique" goal), LoRA overfit (same pose), VRAM out-of-memory crashes, long trial-and-error sessions (hours). Expect ~1 usable image in 8-20 generations.

### 2b. Sprite sheets / walk cycles
| Approach | Verdict on 3060 for Hollowlight | Label |
|---|---|---|
| Generate each frame with ControlNet pose per frame + LoRA | Possible but flicker/drift between frames; many hours per character; poor for 10 heroes + many enemies | OPINION |
| AnimateDiff / Wan 2.x / LTX video models to produce frames | Heavy, low-res output, inconsistent loops, needs extra VRAM/RAM; Forge Neo lists Wan 2.2 (COMMUNITY); licences vary (Wan Apache-2.0 UNVERIFIED) | OPINION/UNVERIFIED |
| AI sprite tools (PixelLab skeleton animation, Retro Diffusion, Scenario, Layer) | Mostly pixel-art focused or paid; pixel art rejected; free-tier licences unclear | COMMUNITY |
| Procedural/skeletal animation in code on cut-out body parts (Phaser/Three.js tweens, bobbing, squash-stretch, procedural legs) | Best fit: consistent, tiny files, zero drift. Layered parts from one AI-drawn character cut into head/torso/arms/legs | OPINION |
| 3D model -> Blender auto-rig -> pre-rendered sprites (recipe C) | Most consistent animation; art quality depends on the 3D model | OPINION |
| Few-frame "limited animation" (idle 2-4 frames, hit flash, FX in code) | Survivors-style games are forgiving: hundreds of enemies on screen, small size | OPINION |

### 2c. Cut-out, upscale, vectorise (tool licences)
| Tool | Use | Licence | Label |
|---|---|---|---|
| rembg (u2net, isnet models) | Remove background from character PNGs | rembg MIT; model weights come from separate projects (check) | COMMUNITY |
| BiRefNet | Better edges for characters | MIT (official card; mirrors vary - verify checkpoint) | COMMUNITY |
| Segment Anything (SAM/SAM2) | Click-to-cut parts for layered rigs | Apache-2.0 | COMMUNITY |
| RMBG-1.4 / RMBG-2.0 (Bria) | Cut-out | NON-commercial (commercial needs Bria agreement) -> AVOID | COMMUNITY |
| Real-ESRGAN / ESRGAN models (in Forge Extras tab built in) | 2-4x upscale | BSD-3 (code); individual community upscaler models vary - prefer the Real-ESRGAN ones | COMMUNITY |
| Vectorisation (potrace, vtracer) | Icons to SVG | potrace GPL; vtracer MIT (OPINION, not verified here) | OPINION |
Simplest cut-out: generate on a plain flat colour background (e.g. magenta/green or white), threshold in Node (sharp) to alpha; fall back to rembg/BiRefNet for tricky edges. Claude can write the Node cut-out script.

## 3. AI 3D and procedural art

### 3a. Image-to-3D / text-to-3D
| Tool | Licence (model + outputs) | VRAM | Quality for game characters | Label |
|---|---|---|---|---|
| TripoSR | MIT (HF model card) | ~6GB reported (one Japanese blog; weak) | Fast, blobby mesh, weak textures/back side | COMMUNITY |
| Stable Fast 3D | Stability Community Licence: free <US$1M revenue; above needs Enterprise licence (includes outputs per card) | modest (OPINION) | Cleaner UV/material than TripoSR; still not production topology | COMMUNITY/OFFICIAL |
| TRELLIS / TRELLIS.2 (Microsoft) | MIT | Docs/sources say >=24GB for TRELLIS.2 (16GB at 512^3 per one weak source) - likely too heavy for 12GB; original TRELLIS likely needs ~16GB (UNVERIFIED) | Best quality open image-to-3D; Linux-oriented | COMMUNITY |
| Hunyuan3D-2 / 2.1 | Tencent Community Licence - territory EXCLUDES the EU, UK and South Korea (OFFICIAL text via search). Matt is in the UK -> NOT licensed for him. DO NOT USE | 6GB shape-only mode possible (OPINION) | Good geometry | OFFICIAL |
| Meshy / Tripo hosted free tiers | Free tiers usually CC-BY or non-commercial and public (UNVERIFIED; not researched) | none (cloud) | Variable | UNVERIFIED |

Honest limits (OPINION): AI meshes have messy topology (100k+ tris, triangulated noise), baked-in lighting in textures, weak backs/hands, no rig; need Blender cleanup (decimate, retopo, UV) and manual rigging. Characters seen at ~64-128px in a horde game make mesh flaws mostly invisible; texture + silhouette matter more. Poly budget for 300 on-screen mobile enemies: 500-2000 tris each plus instancing (docs/research/16: skinned meshes CPU-bound beyond ~200). Pipeline: image -> TripoSR/SF3D -> Blender decimate -> glTF (glb) -> Three.js. Pre-rendering to sprites (recipe C) hides topology.

### 3b. Rigging/animation
| Tool | Licence/terms | Notes |
|---|---|---|
| Mixamo (Adobe, free Adobe account) | Royalty-free for commercial and non-commercial projects incl. games; no credit needed; you may NOT redistribute raw character/animation files (e.g. via downloadable assets/DLC) or use to train ML (COMMUNITY: Adobe community FAQ quotes; page text said "technology preview"; verify current terms) | Auto-rig humanoids and big animation library; humanoid only. Non-humanoids (wolves, ghosts) need manual rig/Blender |
| AccuRIG (Reallusion) | Free; licence not checked (UNVERIFIED) | Humanoid auto-rig |
| Blender (GPL; outputs yours) + Rigify | Free; OPINION: renders not encumbered | Scripted headless render via Python - Claude can write the script |
| Procedural animation in code (bone-less) | n/a | For ghosts/wolves: wobble, sine wave, squash/stretch, shader vertex animation |

### 3c. Procedural/programmatic art (Claude-written) vs AI image gen
| Domain | Best method | Why |
|---|---|---|
| VFX (spirit trails, hits, bursts, glow, corruption veins, lantern light) | Code: particles, shaders, additive sprites, life-map shaders | Consistent, tiny, animated, tunable; matches Hollow identity system |
| Ground/props shaded by life map | Code + AI-generated tileable textures | AI good at textures; code does desaturate/vein overlay |
| Consistent sprites, animation | Code rig on cut-out parts, or Blender pre-render | Zero flicker |
| Character/enemy concept art, silhouettes, portraits | AI image gen (SDXL/Flux schnell) | Biggest AI win: fast exploration of unique designs |
| Skill-tree icons, UI icons | AI for first drafts at 1024px then cut/upscale/tint to palette; or Claude SVG glyph + AI texture overlay | Icons need consistency of style -> same LoRA/prompt template |
| Key art / store thumbnail | AI + human compositing in code | Disclose AI |
| Unique boss/hero signature | Human-directed: Claude code geometry + AI texture | Needs identity not generic AI look |
Quality ceiling of code-only (OPINION): clean stylised flat/gradient silhouettes with glow and good motion can look polished (cf. Vampire Survivors-like clarity) but "Borderlands-level" painted richness is not reachable without painted or rendered assets. Matt rejected flat vector/pixel looks -> code-only is likely insufficient for characters; best as VFX/atmosphere layer.

## 4. Recommended pipelines for Hollowlight (Forge-based)

Common safe base: SDXL 1.0 base + FLUX.1 schnell (GGUF/NF4) in Forge; any LoRA trained by Matt on his own generations.

### Recipe (a): code-art + AI concept art as guidance — Effort S-M, cost 0, risk low
| # | First 5 steps |
|---|---|
| 1 | Generate 20-40 concept/silhouette sheets per character (Wren, wolf) in Forge with a fixed Hollow style prompt template (grey drained palette, spirit-light accent) |
| 2 | Matt picks favourites; Claude writes a design brief per pick (shape list, palette tokens, motion notes) |
| 3 | Claude builds SVG/Canvas/Three.js geometry from the brief (layered parts) in src/gfx |
| 4 | Add code animation (bob, breathe, squash), glow, trails, corruption veins |
| 5 | Compare in-game vs concept; iterate palette via role tokens (palette.js) |
Pros: zero licence/copyright ambiguity (art = code), consistent, small. Cons: lower painted richness; Claude needs Matt's screenshot feedback.

### Recipe (b): AI 2D characters -> cut-out -> sprite sheets — Effort M-L, cost 0, risk medium
| # | First 5 steps |
|---|---|
| 1 | Train/choose style: generate 3/4-view or side-view, plain background, SDXL + prompt template; 30-60 candidates per hero |
| 2 | Matt picks 15-30 best consistent images; auto-caption; train SDXL LoRA (kohya_ss or FluxGym-style) for the chosen hero |
| 3 | Generate poses with ControlNet OpenPose/Depth: idle, 4-8 walk keys, attack, hit, death |
| 4 | Claude writes Node script: batch via Forge API, cut-out (alpha-key or rembg/BiRefNet), trim, align on feet anchor, pack atlas |
| 5 | Load into Phaser; evaluate flicker; use fewer frames (4) + code squash/stretch to hide drift |
Pros: painted look, unique. Cons: drift/flicker, many retries, per-enemy LoRA cost (~1h train each) -> reserve for heroes/bosses; use generic generation + one shared "Hollow creatures" LoRA for rank-and-file.

### Recipe (c): AI image-to-3D -> rig -> pre-rendered sprites (or realtime) — Effort L, cost 0, risk high
| # | First 5 steps |
|---|---|
| 1 | Generate clean front-facing T-pose concept (plain bg) in Forge |
| 2 | Run TripoSR (MIT) or SF3D (community licence, ok <$1M) locally (Matt must approve the install of each) |
| 3 | Blender: decimate to ~2k tris, fix UVs, paint/bake texture, rig with Rigify/Mixamo (humanoids) |
| 4 | Claude writes Blender Python: render 8 directions x frames with fixed rim light -> PNG atlas (docs/research/16 approach B) |
| 5 | Pack atlas, load in Phaser; or export glb for Three.js |
Pros: true consistency across frames. Cons: heavy learning curve in Blender, non-humanoids need manual rigging, AI mesh quality. Do only after (a)/(b) tests show weakness. Avoid Hunyuan3D (UK excluded).

### Recommendation (OPINION)
Hybrid: use (a) for VFX/world and as the gating step; (b) for the 10 heroes, key bosses and portraits (LoRA per hero, few animation frames + code motion); generic AI-concept-derived code-built shapes for swarm enemies; AI icons for skill tree with one shared icon LoRA/template. Try (c) only for 1 hero as an experiment.

### First 1-hour experiment inside Forge: Wren + ghost wolf (Hollow identity)
Prep (10 min): Matt checks Forge launches, version (Settings > About or git log), and GPU memory. Put `sd_xl_base_1.0.safetensors` (official stabilityai HF page) and, optionally, `flux1-schnell` GGUF/NF4 (official or well-known Forge-supported source) in models folder. No extensions yet. Make a `D:\ai\hollowlight-test` output folder (or inside Forge outputs).
| Min | Task | Output |
|---|---|---|
| 0-10 | Settings: 1024x1024, sampler per model card, SDXL 25-30 steps / schnell 4 steps, batch 4, CFG ~6-7 SDXL, 1 for schnell | baseline |
| 10-25 | Wren: 3 prompt variants x 4 images (Claude supplies prompts: "small hooded lantern-bearer, grey drained palette, one warm gold lantern glow, stylised 3D render look, front 3/4 view, plain light grey background, full body") | 12 Wren images |
| 25-40 | Ghost wolf: same procedure ("translucent spirit wolf, teal-white inner light, root-veined dark corruption cracks on one flank, same style") | 12 wolf images |
| 40-50 | Consistency test: pick best Wren, run img2img (denoise 0.4) twice for walk-pose variants; enable built-in ControlNet OpenPose if present | 4 pose images |
| 50-60 | Cut-out test: flat-background threshold or rembg on 3 images; view on a dark and a hollow-grey game background in Phaser/browser | verdict |
Judge: (1) Could any image pass as a final design? (2) Do 2 poses look like the same character? (3) Is the cut-out edge clean at 128px? (4) Does it fit the Hollow palette? Save prompts, seeds, model hash into `docs/ai-log/` for each kept image (also needed for provenance).
If score < 3/4: fall back to recipe (a) with these images as concept guides.

### Forge-specific notes
| Topic | Recommendation |
|---|---|
| Models in Forge | SDXL base (safe). Flux schnell via NF4/GGUF. Avoid dev. Use Forge's "GPU Weight" slider if OOM |
| LoRA training | Kohya_ss GUI (SDXL LoRA, ~10-12GB tight) or FluxGym (Flux, 12GB claim, conflicting). Train on SDXL base for simplest licence. Separate Python venv; do not mix with Forge's venv. Small datasets: 15-30 images, 1000-2000 steps, rank 16, ~1h on a 3060 (COMMUNITY, weak) |
| Extensions | Prefer built-ins (ControlNet integration, Extras upscaler). For others install only from the official extension index with many stars, read the repo and requirements.txt, one at a time, restore point first |
| Background removal / upscaling | Real-ESRGAN (built in/BSD-3), rembg or BiRefNet via Node/Python script (MIT), avoid Bria RMBG |
| Forge API | Start with `--api` and bind to 127.0.0.1 only (default `--listen` off). Never use `--listen`, `--share`, or `--gradio-auth` over the internet; never port-forward. Claude writes Node script POSTing to `http://127.0.0.1:7860/sdapi/v1/txt2img` (A1111-compatible API; OPINION) with prompt sheet JSON, saves files with names `hero_wren_idle_f01_seed1234.png` |

## 5. How Claude can help without seeing the screen
1. Prompt sheet files (`docs/prompts/*.json`): style block + per-character block + negative + seed list.
2. Node batch script via Forge API: reads the sheet, generates N images, writes manifest (prompt, seed, model hash, date).
3. Cut-out/atlas script in Node (sharp): background key, trim, anchor alignment, atlas JSON for Phaser.
4. Contact-sheet HTML (a local page showing thumbnails with file names) so Matt picks by name and Claude can reason from his choices.
5. Naming/log conventions and a licence log file.
6. Blender Python scripts for turntable/directional rendering.
Matt does: approve downloads/installs, run Forge, pick favourites, paste screenshots/filenames back, and accept licence terms himself.

## 6. Safety checklist (installing AI tools on his main PC)
| # | Item |
|---|---|
| 1 | Create a Windows restore point; back up the project (and Forge's `models` folder if it is shared with the other project) |
| 2 | Use his existing Forge install; do not install anything new until the first-hour test shows value |
| 3 | Install new tools in an isolated folder (e.g. `D:\ai\<tool>`), own Python venv, not in the game repo, no admin rights |
| 4 | Source only from the official GitHub org / Hugging Face org page (check URL spelling, stars, age); no mirrors, no "installer.exe" from videos, no Discord links |
| 5 | Only `.safetensors` (or GGUF). Never `.ckpt/.pt/.pth/.bin` from third parties (pickle can run code, COMMUNITY). Check SHA256 from model page when provided (`Get-FileHash file -Algorithm SHA256`) |
| 6 | Extensions/custom nodes = arbitrary code. Real incident: ComfyUI_LLMVISION malicious node stole browser passwords/crypto/files via bad dependency wheels (June 2024, COMMUNITY: Wikipedia/Gigazine). Another 2026 note reports CVE-2025-67303 in ComfyUI-Manager used to install malicious nodes (COMMUNITY, CSA research note). Install few, popular, reviewed ones; read requirements.txt for odd pinned wheels/URLs |
| 7 | Never run scripts from a pasted forum answer unseen; Claude reviews scripts before Matt runs them; no `curl | bash`/`iex` one-liners |
| 8 | Network: Forge bound to localhost; no `--share/--listen`; firewall prompt = decline "public networks" |
| 9 | Run Windows Defender full scan after installing new tools/models; scan downloads with VirusTotal (do not upload private files) |
| 10 | Disk plan (45GB free): SDXL ~6.5GB + Flux GGUF/NF4 ~6-12GB + text encoders ~5-10GB (T5 etc.) + LoRAs <1GB + outputs. Keep >=15GB free; clean cache; don't download every model. If using FluxGym/kohya, another ~5-10GB (venv, torch). Realistically pick SDXL + schnell-NF4 only |
| 11 | No account/API keys in prompts, scripts or repo; hosted tools accounts use fresh email + password manager (Matt does sign-ups himself, never share passwords with Claude) |
| 12 | Close other GPU-heavy apps while generating; watch GPU temps on laptop |

## 7. Ethics and legal checklist
| # | Item |
|---|---|
| 1 | No artist names ("in the style of X") or living-artist LoRAs; describe style by attributes instead |
| 2 | No copying other games' art/characters/UI (Spirit Hunters etc.): references for feel only; no img2img on others' screenshots |
| 3 | Keep prompts, seeds, model name + version/hash, licence snapshot, date for every shipped asset (`docs/ai-log/`) |
| 4 | Use only base models/LoRAs with clear commercial-compatible terms; record attribution if required (e.g. credits file) |
| 5 | Disclose AI use: credits page, store disclosure (Steam Jan 2026 rules, itch.io AI field), keep a changelog of what is AI-made |
| 6 | Human edits: recolour, composite, add code-built details; document them (supports copyright claims and makes assets less generic) |
| 7 | Avoid real-person likeness, trademark symbols, text in images (AI text is unreliable) |
| 8 | Re-check licences before any paid release (SD3.x/SF3D $1M thresholds; Mixamo terms) and before submitting to Steam/Play |
| 9 | Privacy: hosted services may keep/train on prompts and images; don't upload personal photos |
| 10 | UK law is in flux (s.9(3) CDPA repeal proposed); re-check before commercialising |

## 8. Sources (checked 2026-10-14)
- FLUX licences: help.bfl.ai (self-serve dev licence), HF model cards `black-forest-labs/FLUX.1-schnell` (Apache-2.0), windriver licence mirror of FLUX.1-dev NC.
- Stability licence: stability.ai/license, stability.ai/news/license-update; SDXL OpenRAIL++-M: HF SDXL model cards, terms.law/ai-output-rights/stable-diffusion.
- Forge: github.com/lllyasviel/stable-diffusion-webui-forge discussion #1050 (GGUF/Flux), github.com/Haoming02/sd-webui-forge-classic (Neo/Classic), stablediffusiontutorials.com Forge Neo install.
- LoRA: github.com/cocktailpeanut/fluxgym; lilting.ch RTX 3060 kohya guide; clore.ai kohya guide.
- Copyright: copyright.gov/newsnet/2025/1060.html; UK: stephensonharwood.com, bratby.law, mondaq summary of Mar 2026 gov report.
- Platforms: videogameschronicle.com (Steam AI disclosure), 80.lv + mobilemarketingmagazine (itch.io).
- Hunyuan3D licence: huggingface.co/tencent/Hunyuan3D-2/blob/main/LICENSE (territory excludes EU/UK/South Korea).
- TripoSR MIT: huggingface.co/stabilityai/TripoSR; SF3D: huggingface.co/stabilityai/stable-fast-3d; TRELLIS.2 notes: comfyui-wiki.com.
- Mixamo: community.adobe.com Mixamo FAQ thread.
- Hosted tools: leonardo.ai/news/can-you-use-ai-generated-images-commercially; terms.law/ai-output-rights/*; help.scenario.com.
- Security: gigazine.net 20240611 comfyui llmvision malware; labs.cloudsecurityalliance.org ComfyUI cryptomining note.
- Tools licences: rembg (MIT), Real-ESRGAN (BSD-3), SAM (Apache-2.0), BiRefNet (MIT), briaai RMBG-1.4 card (non-commercial).

## 9. Open items / UNVERIFIED
- Original Forge maintenance state and exact version Matt runs; whether Flux ControlNet/IP-Adapter work on schnell in his Forge.
- GPU is desktop 12GB or laptop 6GB.
- Meshy/Tripo free-tier terms; Google Play AI policy; AccuRIG licence; OneTrainer specifics; Wan/LTX licences and VRAM; Flux.2-Klein licence.
- Per-model licence of any Civitai checkpoint (check at download time).
