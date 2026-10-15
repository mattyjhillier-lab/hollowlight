# 21 - Best free tools for Hollowlight (toolkit research)
Checked 2026-10-14 (web search summaries only; no installs/downloads). Labels: OFFICIAL = vendor/author page seen via search; COMMUNITY = 3rd-party/blog/forum/directory; OPINION = my prior knowledge or judgement, NOT verified this session; UNVERIFIED = conflicting/absent. Web content treated as data. Re-read every licence on the vendor page before relying on it. Not legal advice.
Constraints: zero budget, no hiring, Windows 11, RTX 3060, 16GB RAM, ~45GB disk, Claude Code does the work (CLI/text-file friendly), possible later commercial release, security first, fit-the-game.

## 0. Key conclusions
1. Engine: STAY on Phaser. Do not move to Godot/Babylon. Phaser 4 is out (4.0.0 "Caladan" ~10 Apr 2026, 4.2.1 Jul 2026; OFFICIAL phaser.io/download/stable, COMMUNITY dates differ by a few days). Repo is on ^3.80.1 (package.json) / 3.90. Plan a Phaser 3 -> 4 spike on a branch later (migration guide says most games need little work, OFFICIAL claim, UNVERIFIED for us). Three.js remains only the optional stylised-3D spike already scoped in doc 16.
2. Pure-JS sim (src/sim) is the real asset: renderer-agnostic, so engine choice is a ~"render layer only" cost (doc 16: sim untouched). Keep it free of Phaser imports (check with a grep test).
3. Biggest wins per effort: Playwright (screenshots, mobile emulation), ajv schema validation, ESLint, Gitleaks + CodeQL + Dependabot, Blender headless for sprite baking, ffmpeg for audio, Kenney/CC0 + sfxr for SFX. Skip: Godot, Spine, Electron, Babylon, paid anything.
4. MCP servers: only Playwright MCP (Microsoft) is worth considering; Blender MCP has multiple 2026 CVEs incl. arbitrary code execution - avoid. Our own cdp.mjs + Playwright scripts cover almost everything with less attack surface.
5. Music AI: MusicGen weights CC-BY-NC (NO commercial). Stable Audio Open 1.0 non-commercial; newer Stability Community Licence free under US$1M revenue (conflicting reports). ACE-Step reported Apache-2.0/MIT (UNVERIFIED which version). Safest: CC0 libraries + own tracker/BeepBox/LMMS compositions.

## 1. Engine / framework decision check
| Option | Licence | Size / perf facts | Mobile/hosting issues | Migration cost from now | Verdict |
|---|---|---|---|---|---|
| Phaser 3.90 (current) | MIT (OPINION) | Already proven: 300+ sprites batched in one atlas, mobile pipeline since 3.60 (OFFICIAL changelog, doc 11) | None; works on GitHub Pages/itch/PWA | 0 | PRIMARY (stay) |
| Phaser 4 (4.2.1) | MIT (OPINION) | New renderer, filters, lighting, GPU-powered objects (OFFICIAL phaser.io); no independent 3-vs-4 benchmark found (UNVERIFIED perf) | Same | S-M: bump version, fix API diffs, re-test; do on `dev` branch | FALLBACK/upgrade path; spike only when a feature needs it (lighting/filters) |
| PixiJS v8 | MIT (OPINION) | Vendor Bunnymark: 100k sprites CPU ~50->15ms (OFFICIAL, 2024, vendor-run); no independent Phaser comparison | Same | M-L: Pixi is renderer only; we'd re-do scenes, input, audio, tweens, scale (Phaser gives these) | Not worth it: 300 sprites is far under Phaser's ceiling |
| Three.js | MIT (OPINION, well known) | ~140-150 kB gz core (COMMUNITY via doc 16); skinned meshes CPU-bound >~200 unless VAT instancing (COMMUNITY, doc 16) | WebGL on phones OK; thermal throttling risk | L for real-time 3D (doc 16 effort table) | ONLY as spike (doc 16 plan); default path is Blender-baked sprites in Phaser |
| Babylon.js | Apache-2.0 (OPINION) | Large bundle (OPINION, several hundred kB gz) | Same as Three | L | Skip: heavier than Three, no advantage here |
| Godot 4 web export | MIT (OPINION) | Empty project ~25-35 MB compressed WASM (COMMUNITY, single blog, UNVERIFIED) vs our single-file HTML of ~1-2 MB | 4.3+ single-thread export by default needs no COOP/COEP so works on itch & GitHub Pages; threaded export needs cross-origin isolation headers (no custom headers on GitHub Pages; no third-party embeds) (OFFICIAL Godot 4.3 web progress report + docs via search) | XL: rewrite sim in GDScript/C# (C# has no web export in 4.x - OPINION), lose browser-native DOM UI, saves, Vite pipeline, our bot/sweep tests | REJECT: size, load time on phones, rewrite, loses engine-independent JS sim |
| Others (Excalibur, melonJS, Kaplay, LittleJS, raw Canvas/WebGL2) | MIT mostly (OPINION) | Small | Same | M-L | Not worth a switch; raw WebGL2 only if Phaser becomes the bottleneck (not shown) |

Engine-independence: sim in src/sim is plain JS, deterministic, tested by bot.mjs/sweeps -> any renderer can sit on it. Honest migration cost to Pixi/Three/Phaser 4 = rewrite RunScene render layer + lightmap (S-L depending), HUD (DOM) and sim stay. Add one test: no `phaser` import under src/sim.
Itch.io extra: HTML5 zip limits (COMMUNITY: 200 MB per file, 500 MB total; UNVERIFIED - check itch docs). Single-file Vite build is far inside this.

## 2. 2D art / vector / UI
| Tool | Purpose | Licence / cost | Size | Scriptable by Claude? | Verdict |
|---|---|---|---|---|---|
| Inkscape | SVG editing, export PNG from CLI (`inkscape --export-type=png`) | GPL-2+ (OPINION); outputs not encumbered | ~100-200 MB | CLI yes; SVG is text so Claude can write SVG directly | PRIMARY vector |
| Krita | Painting, sprite touch-up, concept | GPL-3 (OPINION) | ~150-300 MB | Python scripting; mostly GUI by Matt | PRIMARY raster (Matt's hands) |
| GIMP | Raster edits | GPL-3 (OPINION) | ~300 MB | Script-Fu/Python | FALLBACK; Krita covers it |
| LibreSprite | Pixel art | GPL-2 (project README) fork of Aseprite's last GPL version (COMMUNITY via search); lacks Lua scripting and later features | small | GUI | FALLBACK for pixel art only |
| Aseprite | Pixel art/animation | Proprietary, paid (~US$20 on itch/Steam; price UNVERIFIED); source viewable, compile for personal use only, assets you make can be sold (COMMUNITY FAQ summary) | small | CLI export good | Not free: skip (zero budget); Hollowlight is not pixel art per ART-DECISIONS |
| Figma free | Layout mockups | Proprietary freemium; account required, cloud (OPINION) | web | MCP needs OAuth, not attached | Skip; HTML/CSS mockups by Claude are text-diffable |
| Free Texture Packer | Atlas packing | MIT (OPINION; github.com/odrick/free-tex-packer) , has CLI via npm | small | CLI yes | Use only if needed |
| TexturePacker (CodeAndWeb) | Atlas | Free tier limits features (OPINION, UNVERIFIED) | - | CLI | Skip |
| `sharp` / `spritesmith` / own Node script | Atlas + packing in build | sharp Apache-2.0 (OPINION); native binary dep | ~30 MB | Yes | PRIMARY atlas route: Claude writes a ~80-line script that packs PNGs and writes Phaser JSON atlas; or use Blender render to sheet |
| Icon sets: Game-icons.net (CC BY 3.0, attribution) , Kenney Game Icons (CC0), Lucide (ISC), Phosphor (MIT), Tabler (MIT) | UI icons | as listed (OPINION, verify each page; record in CREDITS) | tiny | SVG text | Kenney CC0 + Lucide/Tabler SVG primary; game-icons only with credit |
| Stable Diffusion Forge / ComfyUI | Concept/textures | see doc 20 | existing | API | Already decided in doc 20 |
Matt does: install Inkscape/Krita (installer), hand edits. Claude does: write/convert SVG, CLI export, atlas script.

## 3. 3D / animation / VFX
| Tool | Purpose | Licence | Size | Risk | Verdict |
|---|---|---|---|---|---|
| Blender (headless: `blender -b file.blend -P script.py`) | Model, rig, render 8-dir sprite sheets, glTF export | GPL (OPINION); renders/exports not encumbered (OPINION, doc 16) | ~350 MB | Low (official signed installer; do not install random add-ons) | PRIMARY 3D. Python API scriptable by Claude; Freestyle/inverted-hull outlines + toon (shader-to-RGB) for stylised look (OPINION) |
| gltf-transform CLI (+ meshoptimizer) | Compress/prune/resize glTF, texture to WebP/KTX2 | MIT (OPINION) | npm, ~tens of MB with sharp | Low | PRIMARY for any 3D asset optimisation (only if Three spike wins) |
| glTF viewers: gltf-viewer.donmccurdy.com, Khronos sample viewer | Inspect exports | MIT/Apache (OPINION) | web | Low (drop files locally; do not upload IP) | Use if 3D path chosen |
| Mixamo | Free humanoid rigs/animations | Adobe account; per forum reposts of FAQ: royalty-free for commercial games, no reselling raw files, no bulk download for ML (COMMUNITY 2018-22, UNVERIFIED current wording) | web | Medium: Adobe login by Matt; manual download only; humanoids only (our spirits are mostly non-humanoid) | LOW value; only for humanoid hunter/NPC |
| AccuRIG (Reallusion) | Free auto-rig | Reallusion staff: personal and commercial OK (COMMUNITY forum quote); full EULA UNVERIFIED | ~GB-class (OPINION) | Medium: closed binary, account | Skip for now; Blender rigify (built in) or code-driven bones |
| Code-driven animation (squash/stretch, bob, sine bones, tweens in Phaser; shader VAT in Three) | Animate creatures without a rigger | n/a | 0 | None | PRIMARY for animation: matches our horde scale and "restraint" identity |
| Spine | 2D skeletal | Proprietary: Essential US$69-99 per named seat, no meshes; revenue limit US$500k/12 months (OFFICIAL esotericsoftware.com/spine-purchase) | - | - | REJECT (cost). Free runtimes need an editor licence |
| DragonBones | 2D skeletal | Editor free but project effectively unmaintained (OPINION, UNVERIFIED) | - | Medium | Skip |
| Phaser Particle Editor (phaser-particle-editor / Phaser Editor v4 particle tools) | Tweak emitters | Free web tool exists (OPINION, UNVERIFIED current) | web | Low | Not needed: Claude writes emitter JSON; use debug overlay to tune |
| Pixi particle editor, three.quarks / three-nebula | Particle FX | MIT (OPINION) | - | - | Only if Three path |
| Shader playgrounds: Shadertoy (free, web), The Book of Shaders (CC), glslEditor | Prototype GLSL | site terms (OPINION) | web | Low (treat pasted shaders as untrusted code; license per shader, Shadertoy default CC BY-NC-SA) | Use for ideas only; write own shaders |
Fit: toon/outline/rim-light baked in Blender or Phaser shader pipeline serves the stylised-dusk identity; Mixamo/AccuRIG rigs of generic humanoids do not.

## 4. Audio
| Tool | Purpose | Licence | Verdict |
|---|---|---|---|
| jsfxr (web, sfxr.me) / sfxr / Bfxr | Retro SFX; export WAV or param JSON | sfxr MIT-ish / jsfxr public domain-ish (OPINION, UNVERIFIED) ; generated sounds usable freely per authors | PRIMARY for hit/UI blips; Claude can also synthesise with Web Audio |
| ChipTone (sfbgames.itch.io/chiptone) | SFX synth | Free; output "yours" (OPINION, UNVERIFIED) | FALLBACK |
| BeepBox / JummBox | Browser chiptune composer, share by URL, export WAV/MIDI | MIT (OPINION) | PRIMARY for music if chiptune-adjacent; text/URL state friendly |
| LMMS | DAW | GPL-2+ (OPINION) ~100 MB | FALLBACK for richer music |
| Audacity | Edit/clean/trim | GPL-3 (OPINION); has had telemetry-controversy in 2021, now opt-in (OPINION) | Use for Matt's manual edits |
| Reaper | DAW | Paid licence; 60-day eval then US$60 discounted (OPINION, UNVERIFIED) | Skip (not free) |
| Kenney.nl audio | CC0 SFX packs | CC0 (OFFICIAL kenney.nl) | PRIMARY SFX library |
| OpenGameArt, Freesound | SFX/music | Per-file CC0 / CC-BY / CC-BY-NC (filter to CC0 or CC-BY; reject NC) | Use with CREDITS entry |
| ffmpeg (Gyan.dev essentials or BtbN build) | Convert, trim, loudnorm (`-af loudnorm=I=-16:TP=-1.5:LRA=11`), OGG (libvorbis) / MP3 (libmp3lame) / Opus | LGPL/GPL depending on build; libmp3lame LGPL; calling the CLI as a separate tool does not encumber outputs (OPINION). Use LGPL "essentials" build. MP3 patents expired 2017 (OPINION) | PRIMARY encoder. Prefer OGG Vorbis/Opus (royalty-free) for web; MP3 fallback for old iOS (OPINION) |
| Music AI | Generate loops | MusicGen weights CC-BY-NC 4.0 = NO (COMMUNITY summary of repo licence files). Stable Audio Open 1.0 non-commercial; newer Stability Community Licence <US$1M revenue (conflicting COMMUNITY reports). ACE-Step v1 Apache-2.0 / 1.5 MIT or Apache (aggregator conflict) | Do NOT use AI music for the shipped game until the exact licence file for the exact weights is read; also AI output is likely not copyrightable (doc 20). Prefer CC0 + own BeepBox |
Matt does: choose sounds by ear, install Audacity/LMMS. Claude does: ffmpeg batch normalise/encode, wiring, CREDITS.

## 5. Level / data / content
| Tool | Purpose | Licence | Verdict |
|---|---|---|---|
| Plain JSON in repo + schema | Creatures, evolutions, waves, skill tree | - | PRIMARY: already how the game works |
| ajv (+ ajv-cli) | JSON Schema validation in tests/CI | MIT (OPINION) | PRIMARY validator; devDependency only; ~few hundred kB, not in the game bundle |
| zod / valibot | Alternative validators | MIT | Skip (ajv enough; schemas are portable text) |
| Tiled | Tile maps | GPL (editor) / output free (OPINION) | NOT needed: Hollowlight arena is a procedural survivors field, not authored tilemaps; only if boss rooms get hand-built |
| In-repo skill-tree/node editor | Layout edit, preview | Claude-built single HTML page (SVG + drag) writing JSON | PRIMARY if a tree editor is wanted (zero deps, auditable). Alternatives: Excalidraw (MIT, web) / Obsidian canvas (free personal, proprietary) for sketching only |
| Spreadsheet-to-JSON | Balance tables | Google Sheets / LibreOffice -> CSV -> tiny Node script | Optional; JSON + sweep.mjs is better |
| Balance sim | Tuning | bot.mjs, sweep.mjs, sweep-all.mjs (own) | PRIMARY; add schema + invariants tests |
| Analytics | Playtest data | Zero tracking by default (privacy, UK GDPR/PECR: no consent banner if none). Local-only opt-in debug export (copy JSON to clipboard) | PRIMARY: no third-party analytics. Itch built-in view stats / GitHub Pages traffic is enough |

## 6. Engineering quality
| Tool | Purpose | Licence / cost | Verdict |
|---|---|---|---|
| node:test (current) | Sim unit tests | built-in | PRIMARY: keep; zero deps |
| Vitest 4 (Oct 2025; 4.1 Mar 2026; needs Node 20.19+, Vite 6+ - COMMUNITY) | Test runner w/ browser mode | MIT (OPINION) | Skip unless Vite is upgraded; Vite is on ^5.4 here (incompatible with Vitest 4 per COMMUNITY note) |
| Playwright (Chromium) | Screenshots, mobile emulation (devices list), console/network, visual diff (`toHaveScreenshot`), traces | Apache-2.0 (OPINION); ~150-300 MB browser download | PRIMARY end-to-end; replaces ad-hoc headless Chrome. Latest I saw 1.58 (COMMUNITY, undated) |
| Puppeteer | Same idea | Apache-2.0 | FALLBACK; Playwright superset |
| cdp.mjs (own) | Zero-dep CDP driver | own | KEEP for lightweight probes (no install) |
| ESLint (flat config) | Catch bugs | MIT (OPINION) | PRIMARY linter, devDep, `eslint:recommended` + no-undef |
| Prettier | Formatting | MIT | Optional; adds diff noise; skip unless style drifts |
| TypeScript | Types | Apache-2.0 | Cheaper option: JSDoc + `// @ts-check` + `tsc --noEmit` on src/sim (no rename, no build change). Full TS migration = M-L cost, mostly benefit when AI writes code anyway; defer |
| rollup-plugin-visualizer | Bundle treemap | MIT (OPINION) | PRIMARY analyser (Vite uses Rollup); run once per release |
| Lighthouse (Chrome DevTools / npx) | PWA, perf, a11y audit | Apache-2.0 | Use before PWA release; single-file build scores will be fine |
| Chrome remote debugging (chrome://inspect over USB) | Android perf | OFFICIAL (doc 11 URL) | PRIMARY real-phone test; Matt connects phone, Claude reads exported traces/logs Matt pastes |
| BrowserStack / LambdaTest | Real devices | BrowserStack Open Source programme is free for qualifying public OSS (OPINION, UNVERIFIED) | Skip: needs account + public OSS project; use Matt's phone + Playwright emulation |
| Dependabot (security + version PRs) | Dep updates | Free on GitHub | PRIMARY; weekly, grouped, dev branch |
| Renovate | Same | AGPL app/free GitHub app (OPINION) | Skip (Dependabot enough) |
| GitHub Actions | CI | Public repos free & unlimited; private Free plan 2,000 Linux min/month, Windows x2 (COMMUNITY aggregators, UNVERIFIED vs github.com/pricing) | PRIMARY CI: `npm ci`, test, build, audit; pin actions by SHA |
| Gitleaks (CLI or action) | Secret scanning | MIT (OPINION) | PRIMARY pre-commit/CI. GitHub secret scanning + push protection also free on public repos (OPINION) |
| CodeQL | SAST JS | Free for public repos and OSS research (OFFICIAL codeql.github.com via search) | PRIMARY SAST via default setup |
| `npm audit`, `npm audit signatures` | Known vulns + registry signatures/provenance | built into npm | PRIMARY each change (CLAUDE.md) |
| lockfile-lint | Lockfile policy (https hosts, integrity) | Apache-2.0 (COMMUNITY npm page); does not detect malicious packages | Cheap CI add: `--allowed-hosts npm --validate-https --validate-integrity` |
| Socket.dev GitHub app | Malicious-package detection on PRs | Free tier exists; limits conflict (1,000 scans/month, 3-5 members; dep cap 1,000->10,000 reported) (COMMUNITY, UNVERIFIED) | OPTIONAL: add if repo public and deps grow; installing a GitHub app needs Matt's OAuth consent |
| npm hygiene | | `npm ci --ignore-scripts` in CI, exact versions in lockfile, wait >=7 days before adopting new releases (OPINION) | Do |
| CSP | Hardening | Hand-written `<meta http-equiv=Content-Security-Policy>` (single-file build needs `'unsafe-inline'` for script/style unless hashed; GitHub Pages cannot set headers) ; Google CSP Evaluator (web) to review | Claude writes + Playwright checks console; no generator needed |
Hosting recap (OPINION unless noted):
| Host | Cost | Limits | Notes |
|---|---|---|---|
| GitHub Pages (current) | Free | ~1 GB site, 100 GB/month soft bandwidth, no custom headers (no COOP/COEP) | fine for single-thread JS; PWA OK on HTTPS |
| Cloudflare Pages | Free | 500 builds/month, 20,000 files, 25 MiB per file, 1 concurrent build (OFFICIAL developers.cloudflare.com/pages/platform/limits) ; custom headers file supported | best fallback, allows `_headers` CSP |
| itch.io | Free (revenue share optional) | HTML5 zip, limits per COMMUNITY above | audience/discovery; does not need COOP/COEP for us |

## 7. Packaging
| Route | Size | Security defaults | Auto-update | Signing cost | Verdict |
|---|---|---|---|---|---|
| PWA (manifest + service worker) | ~0 extra | browser sandbox | automatic | none | PRIMARY first; install from Chrome/Edge |
| PWABuilder / Bubblewrap (TWA) -> APK/AAB | ~1-3 MB wrapper (OPINION) | browser sandbox; needs Digital Asset Links | via web | Google Play one-time US$25 (COMMUNITY, older articles: confirm) ; sideload APK free | PRIMARY Android; Bubblewrap is Google tool, PWABuilder (Microsoft, OSS) uses it (COMMUNITY/OFFICIAL blog). Needs Java/Android SDK (~1-2 GB, Matt installs) |
| Capacitor | ~5-10 MB APK (OPINION) | WebView app | Play updates | same | FALLBACK if TWA unsuitable (e.g. native haptics); heavier toolchain |
| Tauri 2 | ~3-10 MB desktop (COMMUNITY: 3.2 MB hello world vs Electron ~85 MB) ; Android supported in v2 (COMMUNITY) | Rust backend, OS WebView, capability allowlist (OPINION) | updater plugin | Windows code-signing cert is paid; unsigned shows SmartScreen warning (OPINION) | PRIMARY desktop .exe if wanted; needs Rust + MSVC build tools (several GB); WebView2 behaviour differs slightly from Chrome |
| Electron | ~85-200 MB (COMMUNITY) | Chromium bundled, must keep patching | electron-updater | same | FALLBACK (identical to Chrome behaviour, simplest) |
| NW.js | ~100+ MB | Node in page by default (weaker) | manual | same | Skip |
| Steam | one-time US$100 app fee per game (OPINION, UNVERIFIED, note only) | - | - | - | Later; Steam can host Electron/Tauri builds |
Reality: web/PWA first; .exe and APK only after the game is stable. Unsigned Windows builds trigger SmartScreen; mention in release notes.

## 8. AI-assist tooling (MCP)
| Tool | Exists / maintainer | Licence | Risk | Worth it? |
|---|---|---|---|---|
| Playwright MCP `@playwright/mcp` | Microsoft, official (COMMUNITY directories; repo microsoft/playwright-mcp) | Apache-2.0 (COMMUNITY listing, unconfirmed) | Medium: runs with user permissions; includes arbitrary-script tool; Node 18+ | MAYBE: Claude already has Browser tools and cdp.mjs; plain Playwright scripts give same result with a smaller surface. If used: user-scope install, pinned version, no `@latest` |
| Blender MCP (ahujasid) | Community individual | MIT (COMMUNITY directory) | HIGH: 2026 CVEs incl. code injection in `execute_blender_code` (CVE-2026-10688), SSRF, path traversal; telemetry on by default (COMMUNITY: NVD/SentinelOne listing); maintainer reportedly closed restriction request | NO. Use headless `blender -b -P script.py` scripts Claude writes and Matt reviews |
| Figma MCP | Figma official remote server | proprietary service | OAuth needed (not authorised in this session) | NO: Figma not in our workflow |
| Image-gen MCP for Forge/ComfyUI | Various community wrappers (UNVERIFIED which are reputable) | varies | HIGH: unknown maintainers, can run code/open local ports | NO: call Forge/ComfyUI HTTP API (localhost, `--api`) directly from a ~50-line script Claude writes; bind to 127.0.0.1 only |
| mcp-registry / Claude Code built-in tools | - | - | Low | Use what is already attached |
Rule: MCP = third-party code running with Matt's rights. Install only official vendor servers, pinned versions, reviewed source, user approval each time.

## 9. Starter toolkit (prioritised)
| # | Tool | Purpose | Free? | Licence | Install size | Risk | Phase | Setup by |
|---|---|---|---|---|---|---|---|---|
| 1 | ajv (dev) | Validate data JSON | Yes | MIT | ~1-2 MB | Low | Now | Claude |
| 2 | ESLint (dev) | Lint | Yes | MIT | ~20-30 MB node_modules | Low | Now | Claude |
| 3 | Gitleaks | Secret scan | Yes | MIT | ~10-20 MB | Low | Now | Claude (CI) / Matt installs locally via winget if wanted |
| 4 | CodeQL default setup | SAST | Yes (public repo) | GitHub terms | 0 local | Low | Now | Matt clicks enable in repo settings |
| 5 | Dependabot | Dep PRs | Yes | n/a | 0 | Low | Now | Claude adds `.github/dependabot.yml`; Matt merges |
| 6 | GitHub Actions CI | test/build/audit | Yes (public) | n/a | 0 | Low | Now | Claude |
| 7 | lockfile-lint | Lockfile policy | Yes | Apache-2.0 | ~5 MB | Low | Now | Claude |
| 8 | Playwright | Screenshots/mobile emu | Yes | Apache-2.0 | ~300 MB browsers | Low | Now | Claude (npm) ; Matt approves download |
| 9 | rollup-plugin-visualizer | Bundle size | Yes | MIT | ~2 MB | Low | Before release | Claude |
| 10 | Blender | 3D + sprite bake | Yes | GPL | ~350 MB | Low | Art phase | Matt installs; Claude scripts |
| 11 | Inkscape + Krita | Vector/raster | Yes | GPL | ~400 MB total | Low | Art phase | Matt installs |
| 12 | ffmpeg (LGPL build) | Audio convert/loudnorm | Yes | LGPL/GPL by build | ~100 MB | Low | Audio phase | Matt installs; Claude scripts |
| 13 | jsfxr / ChipTone / BeepBox | SFX + music | Yes | free/MIT | web | Low | Audio phase | Matt (by ear) |
| 14 | Kenney / OpenGameArt CC0 | Assets | Yes | CC0 | - | Low (verify) | Art/audio | Matt picks; Claude writes CREDITS |
| 15 | gltf-transform | glTF optimise | Yes | MIT | ~50 MB | Low | Only if 3D | Claude |
| 16 | JSDoc + tsc --noEmit | Type checking sim | Yes | Apache-2.0 | ~40 MB | Low | Later | Claude |
| 17 | PWA + PWABuilder/Bubblewrap | Install/Android | Yes (+US$25 Play) | OSS | 1-2 GB SDK | Medium (signing keys: Matt only) | Release | Matt keys/accounts; Claude config |
| 18 | Tauri 2 (or Electron) | .exe | Yes | MIT/Apache | several GB toolchain | Medium | After stable | Matt installs Rust; Claude configures |
| 19 | Socket free app | Malicious pkg alerts | Free tier | proprietary | 0 | Low-Med (OAuth) | Optional | Matt authorises |
| 20 | Lighthouse | PWA audit | Yes | Apache-2.0 | via Chrome | Low | Before PWA release | Claude |

Matt-only tasks: any account/OAuth/payment (Google Play, Steam, Socket, GitHub settings toggles), signing certificates/keys, installers needing admin, choosing sounds/art by eye/ear, phone USB-debug pairing, reading final licence pages.
Claude-only tasks: configs, scripts, tests, CI files, CREDITS, schema, build/bundle reports, atlas/audio batch scripts.

## 10. Do NOT bother (for now)
- Godot web export: 25-35 MB class payload (COMMUNITY), rewrite of sim, loses DOM UI; no benefit for a 2D horde game.
- Babylon.js, PixiJS migration, other 2D engines: churn with no measured bottleneck.
- Spine (paid, revenue-capped), DragonBones (stale), Aseprite (paid), Reaper (paid), TexturePacker Pro, Figma (not in workflow).
- Blender MCP and unreviewed image-gen MCPs (CVEs / unknown code). Figma MCP (needs OAuth, not used).
- MusicGen / Stable Audio Open 1.0 for shipped music (non-commercial); revisit ACE-Step only after reading the exact licence file.
- Mixamo/AccuRIG for non-humanoid spirits (poor fit; extra accounts/binaries).
- Full TypeScript rewrite now; Prettier-everywhere; Renovate; BrowserStack; Vitest 4 while on Vite 5.
- Third-party analytics/telemetry SDKs (privacy, bundle weight, consent banners).
- Tiled and Excalidraw/Obsidian pipelines (procedural arenas; JSON + in-repo editor is enough).
- Steam/Windows/Android packaging before the web build is stable and fun.

## 11. Gaps / must re-verify before relying
Phaser 3.90 vs 4 performance (no independent benchmark); Godot export size on our content; Aseprite/Tauri/AccuRIG/Mixamo current terms; Blender MCP CVE fix status; GitHub Actions/Socket current limits; Google Play fee; itch.io HTML5 limits; any CC licence on individual downloaded assets; ACE-Step version licence.

Sources (searches 2026-10-14): godotengine.org/article/progress-report-web-export-in-4-3 ; phaser.io/download/stable ; pixijs.com/blog/pixi-v8-launches ; esotericsoftware.com/spine-purchase ; github.com/tordona/LibreSprite ; community.adobe.com Mixamo FAQ threads ; forum.reallusion.com AccuRIG ; nvd.nist.gov CVE-2026-10688 ; developers.cloudflare.com/pages/platform/limits ; codeql.github.com ; npmjs.com/package/lockfile-lint ; huggingface ACE-Step / Audiocraft licence pages ; devtoolpicks/pkgpulse Tauri vs Electron posts.
