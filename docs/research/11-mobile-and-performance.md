# 11 - Mobile, performance, PWA, wrappers, hardening

Labels: OFFICIAL = vendor docs/changelog; COMMUNITY = forums/blogs; OPINION = my judgement. Web content treated as untrusted data. Items marked (unverified) came from my background knowledge, not a fetched page: check before relying. Researched 2026-10-14.

## 1. Phaser 3 performance (200-380 enemies + projectiles + gems)

| Topic | Advice | Label / source |
|---|---|---|
| Mobile renderer | Phaser 3.60+ auto-uses the Mobile pipeline on iOS/Android (single bound texture, no bufferSubData stall). Don't override the default pipeline. iPhone SE texture binds @60fps rose from 192 (3.50) to ~15,104 (3.60). Benchmark counts binds, not sprites. | OFFICIAL https://unpkg.com/phaser@4.2.1/changelog/v3/3.60/MobilePerformance.md |
| Batching | Sprites sharing one texture/atlas batch into one draw call. Alternating textures per sprite flushes the batch each time. Put all enemies/gems/projectiles in ONE atlas; order display lists by atlas (e.g. all enemies, then gems, then projectiles). Generated placeholder textures: pack into one canvas atlas at boot. | OFFICIAL (changelog above); https://phaser.io/tutorials/advanced-rendering-tutorial/part2 |
| Pooling | Keep pooled Sprites/Images (Image is cheaper than Sprite if no animation). Hide with `setActive(false).setVisible(false)`, never destroy mid-run. Pre-size pools to the cap (e.g. 450). Use `Image` for gems/projectiles, `Sprite` only for animated enemies. | COMMUNITY/OPINION; already done in RunScene |
| Per-frame allocation | No `{}`/`[]`/closures/`.map/.filter` in update; reuse scratch objects/arrays; avoid `Phaser.Math.Vector2` creation; use typed arrays (Float32Array) in sim; no string building per frame (cache HUD strings, only touch DOM on change). Allocation churn -> minor GC pauses (visible as 5-15ms spikes). | COMMUNITY; verify with Chrome Memory "Allocation sampling" |
| WebGL vs Canvas | Use WebGL (`Phaser.AUTO` falls back). Canvas renderer is 3-10x slower for hundreds of sprites; keep only as emergency fallback, no FX there. | COMMUNITY |
| Culling | Camera culls offscreen game objects from render automatically for Sprites, but the sim/update still runs; skip `setPosition`/anim updates for enemies outside view+margin. World 4000x4000: use sim spatial grid (already grid.js) not Phaser overlap. | OPINION |
| Particles | Cost scales with live particles x blend mode. Cap total at ~300-500; prefer sprite-pool "puffs" w/ tween-free manual fade; one shared emitter per effect type, `emitParticleAt` rather than creating emitters; avoid emitter per enemy. Kill hit-spark counts on low tier. | OPINION |
| FX (bloom, vignette, glow, blur) | Phaser 3.60 FX (postFX/preFX) render the object/camera to an extra framebuffer; Bloom cost grows "exponentially" with `steps` (default 4: keep 1-2). Per-sprite preFX/postFX = extra pass each = never on swarm sprites. Use at most ONE camera-level postFX (vignette is cheap) on high tier only; fake glow with a pre-baked additive sprite instead. | OFFICIAL https://docs.phaser.io/api-documentation/3.88.2/class/renderer-webgl-pipelines-fx-bloomfxpipeline ; mobile ms figures not found: measure on device |
| Additive blending | Blend mode changes break batches and cause fill-rate overdraw (many large overlapping additive quads is the classic mobile killer). Keep additive sprites small, group them so blend mode switches happen once per frame, limit full-screen additive layers to 0. | COMMUNITY/OPINION |
| Resolution / DPR | Canvas is 640x360 logical, scaled by FIT: GPU does the upscale, so fill cost is tied to the displayed size on screen, not 640x360. Keep `pixelArt: true` (nearest filter) and `roundPixels: true`; integer-ish scale looks crisp. Do NOT raise renderer resolution to devicePixelRatio (4x fill cost, no benefit for pixel art). On weak phones, cap CSS size or use `Scale.FIT` with `autoRound`. (unverified for 3.90 config names: check `scale.autoRound`). | OPINION |
| `antialias` / `powerPreference` | `render: { antialias:false, powerPreference:'high-performance', batchSize: 4096 }` (Phaser 3 default batchSize 4096). | OFFICIAL Phaser config docs (unverified) |
| Fixed-step sim | Already pure JS at fixed step: cap catch-up steps (max 3-4 per frame) to avoid spiral of death after tab throttling. | OPINION |
| DOM HUD | Only write `textContent`/`style.transform` when the value changed; update HUD at 10-15 Hz not 60; batch reads then writes (no layout thrash: don't read offsetWidth after writing); use `transform`/`opacity` for animated bars (compositor-only), not width/left; `contain: layout paint` on the HUD root; avoid `backdrop-filter`/big `box-shadow`/`filter: blur` over the canvas (very costly on mobile). Container queries are fine but avoid resizing during play. | OFFICIAL web.dev rendering perf https://web.dev/articles/rendering-performance |

### Concrete budget (OPINION, mid-range phone e.g. Snapdragon 6xx/7xx class, 60fps = 16.6ms)
| Item | Budget |
|---|---|
| Frame total | <= 12 ms avg, 16.6 hard (leave headroom for thermal drop) |
| Sim update (380 enemies) | <= 3 ms |
| Phaser sync/render submit (JS) | <= 4 ms |
| GPU | <= 8 ms |
| DOM HUD | <= 0.5 ms (updates at <= 15 Hz) |
| Visible sprites | <= 600 (enemies 380 + proj 100 + gems 100) |
| Draw calls | <= 15-25 (1 atlas + 1 UI/text + FX) |
| Live particles | <= 300 (low tier: 100) |
| Texture memory | <= 32 MB total; atlas <= 2048x2048 (4096 fails on old GPUs) |
| GC | no allocation spikes; heap sawtooth flat after warm-up |

### Quality tiers (OPINION)
| Tier | Particles | postFX | Hit sparks / shake | Shadows | Resolution cap |
|---|---|---|---|---|---|
| Low | <=100 | none | off/minimal | off | cap canvas CSS px to ~720x405 |
| Med | <=250 | vignette only | on | simple | native |
| High | <=500 | vignette + 1 bloom (steps 2) | on | on | native |

Auto tier: measure frame time during first 10 s of run (and rolling 5 s); if avg dt > 20 ms drop a tier, if < 12 ms for 30 s allow rise (never rise mid-run, avoids flicker). Save choice; always expose manual toggle. Hints: `navigator.hardwareConcurrency <= 4`, `navigator.deviceMemory` (Chrome only, coarse), `matchMedia('(prefers-reduced-motion)')` -> low shake. No reliable "battery saver" API: `navigator.getBattery()` is Chrome-only/deprecated-ish, so rely on measured frame time (OPINION). Phaser's own `game.loop.actualFps` / `game.loop.delta` give the data.

### How to measure
- Phaser: `game.loop.actualFps`; `?debug=1` overlay with fps, sim ms, sprite counts, `renderer.drawCount` (Phaser WebGL renderer exposes per-frame draw info; field name unverified), `game.textures` memory.
- Chrome DevTools Performance panel: record 10 s of a swarm, look at long tasks, GC (yellow/"Minor GC"), Raster/GPU lanes; Rendering > FPS meter + "Paint flashing" for HUD layout/paint. CPU throttle 4x/6x to approximate a mid phone. https://developer.chrome.com/docs/devtools/performance (OFFICIAL)
- Android remote debugging: enable Developer options + USB debugging, open chrome://inspect on desktop, inspect the phone tab; Performance and Memory work remotely. https://developer.chrome.com/docs/devtools/remote-debugging (OFFICIAL)
- iOS: Safari Web Inspector on a Mac only (Develop menu > device); no Mac = rely on Android + BrowserStack/free tiers (limited). https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios (OFFICIAL, unverified path)
- Spector.js (Chrome extension) to count WebGL draw calls/state changes (COMMUNITY, https://spector.babylonjs.com/).
- Add a built-in `?bench=1` that spawns 380 enemies and logs p50/p95/p99 frame time: gives repeatable numbers on every device.

## 2. Mobile specifics

| Topic | Advice | Label / source |
|---|---|---|
| Virtual joystick | Hand-roll: ~60 lines. Floating stick: on pointerdown in left half, anchor there; vector = (pointer - anchor) clamped to radius; deadzone ~8%; output to the same input vector the keyboard feeds. Phaser plugin option: rexVirtualJoyStick in `phaser3-rex-plugins`, package licence MIT per jsDelivr (check LICENSE in repo and that you import only the needed file; adds bundle size). Avoid the official Phaser "Virtual Joystick Plugin" (commercial). Hand-rolled = no dependency (fits standing rule). Recommend hand-rolled using DOM pointer events or Phaser pointer. | COMMUNITY https://www.jsdelivr.com/package/npm/phaser3-rex-plugins ; https://phaser.discourse.group/t/phaser-3-rexvirtualjoystick-plugin/385 |
| Multitouch | `input.addPointer(2)`; CSS `touch-action: none; user-select: none; -webkit-touch-callout: none` on canvas + HUD; block context menu and double-tap zoom; `viewport` meta `user-scalable=no` (iOS ignores partly; touch-action handles it). Ability button must be separate pointer id. | OFFICIAL MDN touch-action https://developer.mozilla.org/docs/Web/CSS/touch-action |
| Safe areas / notch | `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`; pad HUD with `env(safe-area-inset-left/right/top/bottom)`; use `100dvh` not `100vh` (mobile URL bar). | OFFICIAL https://developer.mozilla.org/docs/Web/CSS/env |
| Orientation | Manifest `"orientation":"landscape"` works for installed PWA on Android; `screen.orientation.lock()` requires fullscreen and is unsupported on iOS Safari. Fallback: "rotate your device" overlay via `@media (orientation: portrait)`; pause game in portrait. | OFFICIAL MDN https://developer.mozilla.org/docs/Web/API/ScreenOrientation/lock |
| Fullscreen | Fullscreen API works on Android Chrome (`Phaser scale.startFullscreen()` needs a user gesture). iPhone Safari does NOT support Fullscreen API for non-video elements (iPad does): on iPhone the answer is "Add to Home Screen" (standalone display). | OFFICIAL/COMMUNITY https://caniuse.com/fullscreen |
| Audio unlock | WebAudio starts suspended until a user gesture: show a "Tap to start" title screen that calls `audioContext.resume()`; Phaser handles via `sound.unlock` on first pointer. iOS mute switch silences WebAudio in some versions; nothing to do. Pause audio on `visibilitychange`. | OFFICIAL https://developer.chrome.com/blog/autoplay |
| Page visibility | `document.addEventListener('visibilitychange')`: auto-pause the run and show Pause menu when hidden; Phaser already stops RAF in background (it fires `blur`/`hidden` events); don't let sim catch up with huge dt on return (clamp dt). Also handle `pagehide`: save to localStorage. | OFFICIAL MDN |
| Battery / thermal | Phones throttle after 3-10 min sustained load; a 15-min run will see it. Mitigate: lower tier automatically (rolling avg frame time), optional 30fps cap mode (`fps: {target:30}` via `game.loop.targetFps`), lower brightness-heavy effects. No web thermal API: measure only. | OPINION |
| Wake Lock | `navigator.wakeLock.request('screen')` during a run so screen doesn't dim (Chrome/Safari 16.4+; re-request after visibility change). | OFFICIAL https://developer.mozilla.org/docs/Web/API/Screen_Wake_Lock_API |
| Input size | Touch targets >= 44-48 CSS px; DOM cards/menus already scale by container query: check tap targets at phone size. | OFFICIAL WCAG 2.2 target size |

## 3. PWA (Vite single-file / static)

Choice (OPINION): for a single-file game that rarely changes, a hand-written ~40-line SW is safer, dependency-free and easier to audit than vite-plugin-pwa (which pulls Workbox, ~100+ transitive deps). vite-plugin-pwa (https://vite-pwa-org.netlify.app/, MIT, widely used) is fine if you want auto-generated precache + the `registerType:'prompt'` update UI; with `vite-plugin-singlefile` you still have extra assets (icons, manifest, sw.js) so the SW precache list is tiny anyway.

Required pieces:
- `manifest.webmanifest`: `name`, `short_name`, `start_url: "./"`, `scope: "./"`, `display: "standalone"`, `orientation: "landscape"`, `background_color`, `theme_color`, `icons`.
- Icons: 192x192 and 512x512 PNG (any) + 512 maskable (safe zone = centre 80%), plus 180x180 `apple-touch-icon` for iOS. Chrome installability: https://web.dev/articles/install-criteria (OFFICIAL).
- HTTPS (GitHub Pages and Cloudflare Pages both give it).
- Use RELATIVE paths everywhere (`./`) because GitHub Pages serves under `/hollowlight/`. Register with `navigator.serviceWorker.register('./sw.js')` (scope defaults to the SW's directory = `/hollowlight/`; never put the SW outside the project path). Vite `base:'./'` already set; manifest/`sw.js`/icons go in `public/` so they're copied as-is (they are NOT inlined by singlefile).
- Pitfalls: (a) GitHub Pages is case-sensitive; (b) `start_url` absolute `/` breaks on project pages; (c) Cloudflare Pages serves `index.html` for unknown paths (fine, no SPA routing needed); (d) set cache headers: GitHub Pages sends `max-age=600`, so SW bytes updates are checked via byte-diff anyway (browser bypasses HTTP cache for sw.js update checks up to 24h by default, `updateViaCache:'none'` makes it explicit).

Minimal safe SW (hand-written):
```js
// public/sw.js - bump VERSION each release (or inject build hash)
const VERSION = 'hl-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)));   // no skipWaiting: user-prompted
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))));
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // same-origin GET only
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(r => r || fetch(e.request)));
});
```
Update flow: page registers, listens `reg.addEventListener('updatefound')`; when new worker is `installed` and `navigator.serviceWorker.controller` exists, show a "New version - Reload" button (DOM, textContent only) that posts `SKIP_WAITING`, then on `controllerchange` do `location.reload()` (guard against loop with a flag). Never reload mid-run: show the toast only on menu/results screen. Cache-first with versioned cache name = old versions never mix (a stale index.html referencing missing files can't happen since single file).

iOS caveats (COMMUNITY/OFFICIAL, https://webkit.org/blog/14403/updates-to-storage-policy/): Safari 7-day cap on script-writable storage (localStorage, IndexedDB, SW caches) for sites NOT added to Home Screen if user doesn't interact; installed Home Screen web apps are exempt from the 7-day rule but storage can still be evicted under pressure. No install prompt (user does Share > Add to Home Screen); `beforeinstallprompt` is Chromium-only (provide a small "Install" hint for each). Home Screen app has SEPARATE storage from Safari (existing saves do not carry over): reinforces need for export/import save and `navigator.storage.persist()` request (Chrome grants heuristically; Safari 17+ supports it).

Security (OFFICIAL https://developers.google.com/web/fundamentals/primers/service-workers, MDN): SW can only be registered over HTTPS from same origin, scope limited to its directory; keep fetch handler same-origin-only (above) so third-party responses are never cached; precache only your own files; versioned cache names and deleting old ones prevent stale/poisoned entries persisting; do not cache opaque responses; the GitHub Pages origin `mattyjhillier-lab.github.io` is SHARED with every other project page under that user (localStorage and SW scope are per-origin, not per-path): do not host other apps under the same user domain that you don't trust, or put the game on a custom/Cloudflare Pages origin for isolation (OPINION, important for saves).

## 4. Wrappers

| Option | Size | Notes | Cost |
|---|---|---|---|
| Electron | ~80-150 MB install (bundles Chromium) | Most predictable rendering (same engine as Chrome, so identical perf to test); needs `contextIsolation: true` (default since v12), `nodeIntegration: false`, `sandbox: true`, a CSP, no remote content, `webSecurity` on, block `new-window`/navigation outside own origin. Auto-update via `electron-updater` needs a signed build for a smooth UX. | Free (MIT) |
| Tauri v2 | ~3-10 MB (uses WebView2 on Windows, preinstalled on Win10/11) | Rust toolchain needed to build (more setup for a non-pro); capability/permission system is deny-by-default; CSP configurable in `tauri.conf.json`; WebView2 is Chromium-based so Phaser behaves like Chrome. Updater plugin requires its own signing key (free, minisign) separate from Windows code signing. | Free (MIT/Apache) |
| Sources | COMMUNITY (SEO-ish, treat sizes as indicative): https://www.pkgpulse.com/guides/electron-vs-tauri-2026 , https://blog.openreplay.com/comparing-electron-tauri-desktop-applications/ ; OFFICIAL https://www.electronjs.org/docs/latest/tutorial/security , https://v2.tauri.app/security/ |

Code signing / SmartScreen (COMMUNITY + background, verify before paying): unsigned .exe triggers "Windows protected your PC" (user clicks More info > Run anyway); EV certs no longer instantly bypass SmartScreen; reputation builds with downloads. Certificates cost roughly GBP 100-400/yr and require hardware token/cloud HSM since June 2023. Free-ish routes: Microsoft Trusted Signing / "Artifact Signing" (about USD 10/month, availability limited by country/org age: check eligibility for UK individual; NOT free); SignPath Foundation offers free signing only for qualifying open-source projects (unverified eligibility, https://signpath.org/). itch.io butler distribution reduces some friction. Also publish the SHA-256 hash of the .exe in the release notes.

Android:
| Route | Cost | Notes |
|---|---|---|
| Install PWA from Chrome ("Add to Home screen"/Install) | Free | Zero build, best first step |
| PWABuilder -> TWA (Trusted Web Activity) APK/AAB | Free tool (https://www.pwabuilder.com/); sideload APK free; Play Store one-time USD 25 developer fee | Needs Digital Asset Links (`/.well-known/assetlinks.json`) on the origin: GitHub Pages project sites can't serve that path at domain root (only on `user.github.io` root repo) -> use Cloudflare Pages/custom domain if you want full-screen TWA (without it Chrome shows a URL bar). Keep signing keystore SECRET and backed up. |
| Capacitor (https://capacitorjs.com/, MIT) | Free; needs Android Studio + JDK (large install) | Bundles assets locally (offline without SW), full native access; heavier setup, more deps, more attack surface. Good if you later want plugins (haptics, in-app purchases). |
Play Store (OFFICIAL https://support.google.com/googleplay/android-developer/answer/6112435): USD 25 once; new personal accounts must run a closed test with 12+ testers for 14 days before production (policy as of 2024-25, verify). Sideload APK is free via GitHub Releases/itch.io.
iOS: no free path. Apple Developer Program USD 99/yr and a Mac needed for Capacitor/Xcode builds; web/PWA via Safari Add to Home Screen is the free route. Apple's App Store rejects thin web wrappers unless they add value (guideline 4.2) (OFFICIAL https://developer.apple.com/app-store/review/guidelines/ ).

Recommended path (OPINION): 1) PWA on GitHub Pages/Cloudflare Pages (free). 2) itch.io HTML5 upload (free). 3) Android: PWA install, then PWABuilder sideload APK on GitHub Releases (free). 4) Windows: Electron zip ("portable", unsigned, hash published) for familiarity and identical rendering, OR Tauri if you accept Rust setup for a ~5 MB build; both free, unsigned = SmartScreen warning (explain in README). Skip Play Store ($25) and iOS ($99) until the game has traction. Steam ($100 per app) not free.

## 5. Security hardening of the web build

CSP via `<meta http-equiv="Content-Security-Policy">` (meta can't set `frame-ancestors`, `report-uri`, or `sandbox`; GitHub Pages can't set headers; Cloudflare Pages can via `_headers`). A single-file build has inline `<script type="module">` and inline `<style>`, so strict nonce/hash is needed or `'unsafe-inline'` (weaker). Options (OPINION):
1. Post-build script computes the SHA-256 of the inline script/style and writes `script-src 'sha256-...'` into the meta (stays strict, no unsafe-inline for scripts). Needs a small Node step (no dependency; `crypto` built-in).
2. Simpler: `script-src 'self' 'unsafe-inline'` is little protection against XSS; prefer hashes.

Starter policy (test in browser console for violations; Phaser uses `blob:`/`data:` images and WebGL; Web Audio decode needs `blob:`/`data:` media):
```
default-src 'none';
script-src 'sha256-<hash>';
style-src 'unsafe-inline';      /* Phaser/DOM set inline styles; style attrs need this, low risk */
img-src 'self' data: blob:;
media-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
worker-src 'self';
manifest-src 'self';
base-uri 'none';
form-action 'none';
object-src 'none';
```
(Add `'wasm-unsafe-eval'` only if wasm is used; add `worker-src blob:` only if a blob worker is needed.) Reference: OFFICIAL https://developer.mozilla.org/docs/Web/HTTP/CSP and https://web.dev/articles/strict-csp. Use `Content-Security-Policy-Report-Only` first while testing.

Other hardening:
- No `innerHTML` with any untrusted string (names, imported save fields, URL params): use `textContent`/`createElement`. Grep `innerHTML|insertAdjacentHTML|outerHTML|document.write` in `src/ui/ui.js` and keep a unit test/lint that fails on new uses of untrusted data. Card text from `src/data/*.json` is trusted, but if any value is ever player-influenced, treat as untrusted.
- Save import: parse with `JSON.parse` in try/catch; size cap (e.g. 256 KB) before parsing; check `version` integer and run migrations; validate schema by whitelisting known keys; clamp numbers (`Number.isFinite`, min/max), coerce booleans, ignore unknown keys; reject `__proto__`/`constructor`/`prototype` keys (build a fresh object, don't `Object.assign` from input); strings length-capped and printable; validate IDs against known content ids (weapons/nodes); never `eval`/`new Function`. Optionally add a checksum for accidental corruption (NOT security; saves are client-side and cheat-able; accept that). Add tests with malicious payloads (prototype pollution, huge arrays, NaN/Infinity, wrong types).
- URL debug params (`?god=1&grant=...`): gate behind a build flag or `debug` only on localhost, or at minimum validate against whitelist; they alter save? Ensure they never write to the real save slot.
- Dependencies: pin exact versions (`save-exact=true` in `.npmrc`), commit lockfile, `npm ci` in CI, `npm audit` each change, Dependabot on, avoid install scripts (`ignore-scripts=true` where possible), check `phaser`, `vite`, `vite-plugin-singlefile` maintainers; remove unused packages; consider `npm audit signatures` for provenance (OFFICIAL https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities ). Review any new package for typosquatting before install.
- GitHub Actions: minimal `permissions:`, pin actions to commit SHA (already in standing rule).
- Subresource: no third-party scripts/CDNs/fonts at runtime (keeps CSP `'none'` base and privacy clean).
- Electron/Tauri: load only local file/custom protocol, deny external navigation, no remote debugging port in release.

## 6. Prioritised checklist (S <= 1 evening, M = a few evenings, L = a week+)

| # | Task | Effort | Free? |
|---|---|---|---|
| 1 | Add `?bench=1` + FPS/draw-call/sim-ms debug overlay; capture baseline on desktop and one real phone | S | yes |
| 2 | Pack all generated textures into one atlas; order display so batches stay unbroken; verify draw calls <= 25 | M | yes |
| 3 | Audit per-frame allocations in sim and RunScene update; fix hot spots using Chrome allocation sampling | M | yes |
| 4 | HUD: update on change and at <= 15 Hz; transform-based bars; `contain`; drop blur/backdrop effects | S | yes |
| 5 | Save import/export validation + malicious-payload tests; grep & ban `innerHTML` with untrusted data | M | yes |
| 6 | Hand-rolled touch joystick + ability button, `touch-action:none`, safe-area CSS, viewport-fit=cover, portrait overlay | M | yes |
| 7 | Visibility auto-pause, dt clamp, `pagehide` save, audio unlock "Tap to start", Wake Lock | S | yes |
| 8 | Quality tiers (low/med/high) + auto-downgrade on frame time + manual toggle; FX only on High | M | yes |
| 9 | CSP meta with post-build script hash; test in Report-Only first | M | yes |
| 10 | PWA: manifest + icons (192/512/maskable/180) + minimal versioned SW + "new version" prompt on menu only | M | yes |
| 11 | Request `navigator.storage.persist()`; explain Home-Screen separate storage on iOS; surface export-save button prominently | S | yes |
| 12 | Decide origin: GitHub Pages is shared origin per user; consider Cloudflare Pages for isolation/headers/assetlinks | S | yes |
| 13 | Dependency hygiene: exact pins, `npm ci`, audit, Dependabot, action SHA pinning | S | yes |
| 14 | Android: test PWA install; build sideload APK with PWABuilder; publish on GitHub Releases/itch.io | M | yes (Play Store USD 25 optional) |
| 15 | Windows: Electron (or Tauri) portable build with hardened defaults; publish SHA-256; document SmartScreen warning | L | yes (signing certificate not free) |
| 16 | iOS: PWA only; skip App Store (USD 99/yr + Mac) | - | - |

## Source list
- https://unpkg.com/phaser@4.2.1/changelog/v3/3.60/MobilePerformance.md (OFFICIAL)
- https://docs.phaser.io/api-documentation/3.88.2/class/renderer-webgl-pipelines-fx-bloomfxpipeline (OFFICIAL)
- https://phaser.io/tutorials/advanced-rendering-tutorial/part2 (OFFICIAL)
- https://www.jsdelivr.com/package/npm/phaser3-rex-plugins (COMMUNITY, MIT listed)
- https://tessl.io/registry/tessl/npm-vite-plugin-pwa (COMMUNITY mirror; official docs https://vite-pwa-org.netlify.app/)
- https://www.pkgpulse.com/guides/electron-vs-tauri-2026 , https://blog.openreplay.com/comparing-electron-tauri-desktop-applications/ (COMMUNITY)
- https://www.electronjs.org/docs/latest/tutorial/security , https://v2.tauri.app/security/ (OFFICIAL, recalled not fetched)
- https://web.dev/articles/install-criteria , https://webkit.org/blog/14403/updates-to-storage-policy/ , MDN pages above (OFFICIAL, recalled not fetched)

Search tool returned limited results this run; items not fetched are flagged "unverified" or "recalled" and should be spot-checked before acting.
