# Hollowlight: Spirits of the Dusk - Build Guide

Written 2026-10-14. Replaces `docs/PLAN.md`. For Matt. Plain English.
Sources are the files in `docs/research/` (named like `05` = `05-hosting-and-saves.md`). Many research numbers are opinion, not datamined; the files say which. Locked design lives in `CLAUDE.md` and does not change here.

Words used:
- **Juice**: small effects that make hits feel good (shake, flashes, numbers, sparks).
- **Bloom**: a glow filter over the whole screen. Costly on phones.
- **PWA**: a website a phone can install like an app.
- **Tier**: a quality setting (Low / Med / High).
- **PR**: pull request, the "please merge this" button on GitHub.
- **Palette**: the fixed set of colours every picture in the game must use.

---

## 1. Overview

### The vision
A dark, moonlit forest at dusk. You are a summoner. Glowing spirits (wolves, ravens, bolts, lightning, holy orbs) do the fighting. The screen fills with light as you grow. Over 15 minutes the sky moves from dusk to dawn, and winning means surviving to sunrise. It must be free, safe, and smooth on a mid-range phone.

The "wow" comes from light, glow and feel, not from fancy sprites (`06` section 1). Dark world, bright spirits.

### Build order at a glance
Effort: S = an evening, M = a few evenings, L = a week or more.
"Matt" column: D = needs your decision, H = needs your hands (accounts, downloads, phone tests).

| Phase | Name | What you will SEE at the end | Effort | Matt |
|---|---|---|---|---|
| P0 | Hosting, privacy, merge, housekeeping | Same game, safe home, clean repo, PR merged | S | D, H |
| P1 | Finish balance | Game tuned; 4 open choices settled | S | D |
| P2 | Save + results + settings | Progress kept between visits; end-of-run screen; volume/shake options | M | - |
| P3 | Wow foundation | Same game now glows: dusk-to-dawn sky, shake, numbers, sparks, quality tiers | L | D |
| P4 | Art pass, Chapter 1 | Real sprites in one colour palette; CREDITS page | L | D, H |
| P5 | Audio v1 | Music, hit sounds, level-up chime | M | H |
| P6 | Enemies + Elder Treant boss | New enemy types; 3-phase boss fight with intro | L | - |
| P7 | Skill tree v1 | ~60 nodes, greyed locked ones, gold spent between runs | L | D |
| P8 | Phone: touch + install | Play on your phone with thumb stick; install to home screen | M | H |
| P9 | Windows .exe / Android APK | Downloadable builds | M-L | H, D |
| P10 | Polish + launch | Title screen hook, final checks, launch | M | D, H |

Why this order (from the research):
- Saves and settings come before art, because art and audio add options that need saving (`05`, `09`).
- Wow foundation (P3) comes before the art pass, so we pick the look once and repaint to it (`06`).
- Touch controls come after the look is fixed, but performance is watched from P3 on, so phones never become a nasty surprise (`11`).
- Skill tree is after the boss, so the tree can be balanced against a real chapter.

### Parked (not scheduled)
Weapon combining, boss chests, items/passives, chapters 2-8, other 8 characters, prestige, codex. See section 7 for the "after launch" roadmap. We do not touch these until you say so.

---

## 2. Phases

Each phase ends with: tests pass, a security line, a short list of changes, and your playtest.
"Claude" = main chat. "Agents" = cheap helpers set up by Claude (haiku for lookups, sonnet for coding/sweeps, opus only for hard design or security review, per `CLAUDE.md`).

### P0 - Hosting, privacy, merge, housekeeping
**Goal:** a safe home for the game, and a clean base to build on.

**The hosting question (your decision).** Facts from `05` and `11`:
| Option | Free? | Repo can be private? | Good for | Catch |
|---|---|---|---|---|
| GitHub Pages (now) | Yes | No. Free plan needs a PUBLIC repo | Simplest. Already working | Anyone can read your code and assets. Pages site is public |
| Cloudflare Pages | Yes (500 builds/month, 25 MiB per file) | Yes | Private repo, own headers, no shared-origin issue | Needs a Cloudflare account. Free `*.pages.dev` URL |
| Cloudflare Pages + Access | Access is free for small teams (my recollection, UNVERIFIED: check the Cloudflare plan page) | Yes | Playtest gate: only people you email can open it | Extra setup. Testers need to sign in |
| itch.io, restricted/draft page with password | Yes (itch feature; UNVERIFIED here) | Yes | Easy for friends, plus audience later | Saves tied to itch's origin; test them (`05`) |

Claude's recommendation:
1. Short term: keep GitHub Pages and the public repo until P4. Nothing secret is in it. The risk is low (no keys, no accounts).
2. Before adding art you do not want copied, or before inviting testers: move to a private repo plus Cloudflare Pages. Add Access only if you want a login gate.
3. Pick the final URL once. Saves are tied to the web address; moving strands old saves (`05`). Do this move BEFORE players have saves, i.e. now or in P2.

**Steps**
| # | Step | Who |
|---|---|---|
| 1 | Decide hosting (checklist in section 6) | Matt |
| 2 | If moving: Claude writes the Cloudflare steps one click at a time; Matt creates the account and turns on 2FA himself | Matt + Claude |
| 3 | Review and merge the open PR `dev` -> `main` | Matt clicks Merge, Claude summarises the diff |
| 4 | Housekeeping: `.npmrc` with `save-exact=true`, `npm ci` in CI, `npm audit`, Dependabot on, workflow actions pinned to commit SHAs, minimal workflow permissions (`11` section 5) | Agent (sonnet) |
| 5 | Add `CREDITS.md` (empty template from `12` section 5) and `assets-src/` folder to `.gitignore` decisions | Agent (haiku) |
| 6 | Add `?bench=1` + debug overlay (FPS, sim ms, sprite count) and record a desktop baseline (`11` checklist #1) | Agent (sonnet) |
| 7 | Update `CLAUDE.md` "Current state" and point it at this guide | Claude |

**Done when:** `main` equals tested `dev`; live site loads; audit reports clean or explained; baseline FPS number written down.
**Security check:** secret scanning and push protection on; no tokens in repo; Pages/Cloudflare permissions minimal; 2FA on GitHub and Cloudflare (Matt does this himself).
**Playtest question:** "Does the live link still play exactly as before?"

### P1 - Finish balance
**Goal:** close pass 1 and lock numbers before building on them.
Current win rates (96 seeds, `07`): Wren random 21%, focus 46%; Elias random 31%, focus 41%. Boss 3000 HP, kill time 40-49 s. Targets: random 15-25%, focused 45-60% (`00`).

| # | Decision (from `07`/`08`) | Claude's advice |
|---|---|---|
| 1 | Lower the evolution rank requirement for Elias (locked design) | Do NOT change locked design yet. Test with a real human first (see playtest question). If Elias feels slow to evolve, revisit |
| 2 | Spirit Bolts power per rank 5 -> 4 | Yes. It is the strongest base weapon (~2x others in a horde, `08`) and this makes Soul Lance read as a real upgrade |
| 3 | Howling Legion / Pouncing Pack feel too similar; give one a new verb | Later. Do it in P6 when the boss exists. Flag only |
| 4 | Magnet slightly rare (~1 per 140-160 s vs 90-120 target) | Yes, small fix: lower the "needs >12 gems" threshold |

**Steps:** Matt answers the four choices. Agent (sonnet) applies #2 and #4, runs `node scripts/sweep-all.mjs 96`, reports a before/after table. Claude checks win rates stay in range.
**Done when:** sweep table inside targets or explained; `07-balance-log.md` updated.
**Security check:** data-only changes; tests (35+) pass.
**Playtest question:** "Standing in the horde as Elias, do evolutions come fast enough, and does the boss fight feel fair?" (The bot flees, a human does not: `07`.)

### P2 - Save system, results screen, settings
**Goal:** your progress survives closing the tab.

**Steps**
| # | Step | Who |
|---|---|---|
| 1 | Save module: `localStorage`, unique key prefix `hollowlight:`, version number, migration chain, backup copy before each write (`05` section 3) | Agent (sonnet) |
| 2 | Safe loading: corrupt or hostile JSON never crashes; validate every field; no `innerHTML` with save data | Agent + Claude review |
| 3 | `navigator.storage.persist()` request; autosave on run end, tab hide (`pagehide`), and each purchase | Agent |
| 4 | Gold and soul-shard banking; results screen (time, kills, gold, shards, best time, what evolved) | Agent |
| 5 | Settings menu: master/music/SFX volume, screen shake, flashes, damage numbers, quality tier (Low/Med/High/Auto), reduced motion (`06`, `09`, `11`) | Agent |
| 6 | Export/import save file buttons with validation | Agent |
| 7 | Tests: migrations, corrupt save, malicious import (oversized, wrong types, `__proto__`), quota error | Agent |

**Done when:** close and reopen keeps gold; broken save loads a fresh game; export then import round-trips.
**Security check:** import is untrusted input (validated, size-capped, no prototype pollution); debug URL params cannot write the real save (`11`); `npm audit`.
**Playtest question:** "Did you trust it? Close the tab mid-run and between runs. Was anything lost?"

### P3 - Wow foundation
**Goal:** the same game, now clearly beautiful, with a speed budget to protect phones. Biggest "wow per hour" phase (`06` section 6).

**Steps**
| # | Step | Who |
|---|---|---|
| 1 | Lock the palette. Claude shows 3 mock swatches; Matt picks. Recommended: A "Moonlit Spirit-Glow" (`06`: `#07070d #12182b #1d2b3a #2f4a4a #6fd3c5 #b8f2ff #8a5cff #ffd27a #e8e0ff`) | Matt picks |
| 2 | Dusk-to-dawn: a full-screen multiply colour rectangle shifting `#2a1c4a` -> `#8a6a5a` -> `#ffd9a0` across the run; dawn on victory (`06`) | Agent |
| 3 | Glow: soft additive halo sprites behind summons, bolts, gems (fake bloom, one sprite each); fireflies; fog layers; vignette that pulses at low HP | Agent |
| 4 | Juice: hit flash (60 ms), tiny screen shake, pooled damage numbers (merged per 100 ms), death wisps, zoom punch on big kills, level-up fanfare (brief slow-down, ring, zoom) | Agent |
| 5 | Hit-stop only for boss hits and evolution (50-100 ms) | Agent |
| 6 | Quality tiers + auto-downgrade on slow frames (`11`): Low <=100 particles, no post effects; Med <=250 + vignette; High <=500 + one bloom (steps 2). Never raise tier mid-run | Agent |
| 7 | One texture atlas for all sprites; fix any per-frame allocation (`11` checklist #2, #3) | Agent |
| 8 | Performance budget check: <=12 ms avg frame, <=600 visible sprites, <=25 draw calls, <=300 particles (`11`) | Claude reads `?bench=1` results |

**Done when:** a 30-second screen recording looks good; Low tier holds 60 fps on desktop with 4x CPU throttle; every effect has a settings switch.
**Security check:** no new dependencies (all effects use Phaser built-ins); no third-party fonts or CDNs.
**Playtest question:** "Pause at minute 1, 6 and 12. Does the sky change feel like a journey? Is anything too bright, too shaky, or hard to read?"

### P4 - Art pass, Chapter 1
**Goal:** replace placeholder shapes with real sprites in one palette.

**Be honest about this (see section 4):** free packs do not match each other. We recolour everything to the P3 palette, add a 1 px dark outline, and expect to repaint wolves, ravens, the hero and the Elder Treant (`12` section 4).

**Steps**
| # | Step | Who |
|---|---|---|
| 1 | Matt downloads packs BY HAND from the author pages in the `12` shortlist, into `C:\Users\matty\quarantine\<pack>\`, outside the repo. Safe-download steps in `12` section 6 (no .exe, scan with Defender, unzip only there) | Matt |
| 2 | Claude re-reads each licence box and the zip's licence file on the day. Skip anything flagged in `12` (inkBubi A16, Ulerinn A17, Blacis A26 AI-made) | Claude |
| 3 | Agent writes a small recolour script (map to palette, add outline); copy only used files into `public/assets/` | Agent (sonnet) |
| 4 | Fill `CREDITS.md` (name, author, URL, licence, date, files used) and add an in-game credits screen | Agent |
| 5 | Replace generated textures in `RunScene.js`; keep one atlas | Agent |

Chosen assets (`12` section 4):
| Need | Best | Backup |
|---|---|---|
| Wolf | 32x32 Walking Wolf (A3, **UNVERIFIED page, re-check**) or Cough-E 16x16 (A2) | pixel wolf side view (A1); LPC wolf (needs credit) |
| Raven | Pixel Raven 16x16, CC0 (A5) | Animated Birds, recoloured (A6) |
| Spirit enemies | Ghost monster 32x32, CC0 (ImogiaGames) | Ghost sprite (A25) |
| Hero (Wren) | mage 0, CC0 (A8) | Sollision mage (A7) |
| Elias | Eldiran 32x32 RPG sprites (A9) - needs custom armour/halo | - |
| Ground and props | Kenney Roguelike RPG Pack + Tiny Town, Cemetery 16x16 | 0x72 DungeonTileset II |
| Elder Treant | Treant Monster, **CC-BY 3.0**, credit "Treant made by Tuomo Untinen" (A12), scaled 2x | Custom, from tree props |
| Glows | Kenney Particle Pack, DevWizard spells | Gothicvania Magic 9 |
| UI | Kenney Pixel UI + Fantasy UI Borders; OwlishMedia icons | UI Pack RPG Expansion |
| Font | Public Pixel Font (use at 8/16/32 px) | Pixelated Elegance |

**Done when:** all Chapter 1 things have real art in one palette; CREDITS complete; licence page captures kept in `assets-src/` (not shipped).
**Security check:** every file is png/ogg/wav/ttf only; each licence verified on the author page and dated; only needed files shipped; CC-BY credits visible in game.
**Playtest question:** "Can you tell wolf, crow, crawler, pickup and your own hero apart at a glance in a swarm? Does anything look 'from a different game'?"

### P5 - Audio v1
**Goal:** it sounds alive, and never turns into noise.

**Steps** (`09` section 5):
| # | Step | Who |
|---|---|---|
| 1 | AudioManager: separate music and SFX volume, max ~24 voices, per-sound rate limit, pitch and volume variation, quiet frequent sounds, loud rare ones | Agent |
| 2 | Start/Tap button unlocks audio (browsers require a click). Pause music when tab hidden | Agent |
| 3 | About 25 SFX + 3 music loops (calm, combat, boss) from Kenney packs and CC0 loops: Cathedral in the Forest, Forest Ambience, Dark Place (all CC0, verified in `12`) | Matt downloads, Claude verifies |
| 4 | Signature sounds: level-up chime, bigger evolution swell with a half-second hush before it, gem pickup that climbs in pitch, boss intro silence | Agent |
| 5 | Ship MP3 (safe on iPhone); trim loops so they loop cleanly; keep total audio under ~3 MB (`09`) | Agent |

**Done when:** a long swarm is not harsh; level-up and evolution are clearly different; mute works.
**Security check:** CC0 only for v1 (avoid CC-BY music so credits stay simple); Freesound only if filtered to CC0.
**Playtest question:** "At minute 8 in a big swarm, are you annoyed or excited? Which sound do you most want changed?"

### P6 - Enemy roster and Elder Treant boss
**Goal:** a proper Chapter 1: new enemy verbs and a boss worth beating.

**Steps** (`10`):
| # | Step | Who |
|---|---|---|
| 1 | Add enemy types over time: thorn sprite (ranged, 2:00), mire wisp (explodes, 3:00), Dire Wolf elite (4:00), moss shaman (healer, 5:00), bramble stag (charger, 6:00), Briar Matron mini-boss (7:30), Thornwall ring event (8:00). Data first, new verbs in code | Agent (sonnet) |
| 2 | Red ground circles for danger, one colour language for the whole game (`10`) | Agent |
| 3 | Elder Treant 3 phases: Awakening (root eruptions, 1 s telegraph), Blight (saplings remove bark armour, sweep), Wrath (faster, root patches, thorn nova). Soft enrage at 180 s (`10`) | Opus designs attack list once; Agent builds |
| 4 | Boss intro: music dips, letterbox bars, name card "ELDER TREANT", shake, health bar slides in | Agent |
| 5 | Re-run the full sweep. Boss HP currently 3000 (40-50 s kill); the research aims for 60-120 s, so tune with the bot, then confirm by hand | Agent + Matt |
| 6 | Give Howling Legion or Pouncing Pack a new verb (pending decision #3 from P1) | Agent |

Rules (`10`): one new verb at a time; no more than ~3 must-react types alive together; cap enemies at ~240-280 and cull cheapest swarmers first.

**Done when:** a run has a visible story: calm, pressure, mini-boss, wall, boss. Win rates still in range.
**Security check:** no new dependencies; new data files validated; tests for boss phase transitions.
**Playtest question:** "Which fight moment made you say 'oh no' and which one felt unfair?"

### P7 - Skill tree v1
**Goal:** a reason to come back. About 60 nodes, greyed-out locked ones, spend gold.

**Steps** (`03`, `04`, `00`):
| # | Step | Who |
|---|---|---|
| 1 | Data-driven `tree.json`: node id, cost, effect (maps to `sim.mods`), prerequisites, unlock condition (kill counts, chapter clear, hidden nodes) | Agent (sonnet) |
| 2 | Fewer, bigger nodes: 5-10% or a new verb. Whole tree capped around +40% power. "+1%" nodes feel useless (`00`, `04`) | Claude |
| 3 | Early nodes: reroll, banish, Summoner and Magic branches, per-weapon, ability cooldown (floor ~30 s) | Agent |
| 4 | Tree UI: pan/zoom, tap a node to see cost and why it is locked. Large touch targets | Agent |
| 5 | Design file format so 500+ nodes can come later | Agent |
| 6 | Re-run sweeps WITH a fully bought tree and with none; wins must stay sensible | Agent |

**Done when:** you can spend gold, see locked nodes with reasons, and feel the difference in a run.
**Security check:** tree state lives in the versioned save; purchases validated against data (no negative costs, no unknown ids).
**Playtest question:** "Which node did you most want but could not afford or unlock? Did any purchase feel pointless?"

### P8 - Phone: touch controls, install, testing
**Goal:** it plays well on your phone and installs like an app.

**Steps** (`11`):
| # | Step | Who |
|---|---|---|
| 1 | Hand-rolled floating thumb stick (left half) + ability button (right), no plugin dependency. `touch-action: none`, safe-area padding, 2-pointer multitouch | Agent |
| 2 | Landscape lock prompt; auto-pause on tab hide; clamp big time gaps; screen wake lock | Agent |
| 3 | PWA: manifest, icons (192, 512, maskable, 180 for iPhone), tiny hand-written service worker (same-origin only, versioned cache), "new version" button shown only on menus | Agent |
| 4 | Content Security Policy (try in report-only mode first) | Agent + Claude security review |
| 5 | Bigger tap targets, card text readable at phone size | Agent |
| 6 | Test on your real phone: install, play 10 min, check heat and FPS using `?bench=1` | Matt |
| 7 | Auto tier picks Low on weak phones. Cap canvas size if needed | Agent |

**Done when:** full run on your phone holds near 60 fps (or Auto picks a tier that does); install works on Android Chrome; iPhone works via Share > Add to Home Screen.
**Security check:** service worker caches only own files; no external scripts; CSP active; save export visible so iPhone users can back up (`11`).
**Playtest question:** "After 10 minutes, is the phone hot, are your thumbs covering the action, and can you read the cards?"

### P9 - Windows .exe and Android APK
**Goal:** optional downloads. The web version stays the main one.

| # | Step | Who |
|---|---|---|
| 1 | Android: PWA install first. Then PWABuilder APK for sideload via GitHub Releases/itch.io (free). Full-screen TWA needs `assetlinks.json` at the site root, which GitHub Pages project sites cannot serve; Cloudflare Pages can (`11`) | Matt + Claude |
| 2 | Windows: choose Electron (about 80-150 MB, identical to Chrome) or Tauri (about 5 MB, needs Rust setup). Claude's lean: Electron for simplicity | Matt decides |
| 3 | Hardened defaults (context isolation, no Node in page, block navigation, no remote debugging) | Agent + opus security review |
| 4 | Publish SHA-256 hash next to each file; README note about the SmartScreen warning | Agent |
| 5 | Skip: Play Store ($25), iOS App Store ($99/yr + Mac) | - |

**Done when:** a friend can install and play from a download link.
**Security check:** unsigned builds are untrusted by Windows; say so plainly. Keep the Android signing key out of the repo and backed up by you.
**Playtest question:** "Did the install warning scare your tester? Would they just use the web link instead?"

### P10 - Polish, title screen, launch
**Goal:** first 10 seconds sell the game.

| # | Step | Who |
|---|---|---|
| 1 | Title screen over a live auto-run (the `?auto=` bot already exists): wolves and ravens fighting in moonlight, fireflies, soft music fading in, logo glow. One click to play (`06` section 4) | Agent |
| 2 | Opening hook: hero attacking by second 3, first level-up by about 5-10 s (check XP curve), first swarm by 10-60 s | Agent + sweeps |
| 3 | Character select with idle animation; locked characters as silhouettes | Agent |
| 4 | Tutorial hints (3 lines max), accessibility check (shake, flashes, volume) | Agent |
| 5 | Launch checklist below | Claude + Matt |

Launch checklist:
- [ ] `npm test` and a 96-seed sweep pass
- [ ] `npm audit` clean or explained; Dependabot on
- [ ] CREDITS complete; every licence re-checked within the last 30 days
- [ ] No secrets, no `innerHTML` with untrusted data (grep), no debug params that touch real saves
- [ ] Phone test on at least one Android and (if you can borrow one) one iPhone
- [ ] Save export/import works; old-version save loads
- [ ] Privacy line on the page: no accounts, no tracking, saves stay on the device
- [ ] You say "ship it"

**Playtest question:** "Hand it to someone who has never seen it. Do they smile in the first minute without asking you how to play?"

---

## 3. The "wow" section

### Limits to keep in mind
- Free packs are not one style. Raw mixing looks cheap. Recolour to one palette, add outlines, repaint the core cast (`12` section 4).
- Glow is cheap if faked with small pre-made sprites. It is costly if done with shaders on many things (`11`).
- Phones are the limit. Anything full-screen and layered (bloom, big additive fog) is High tier only.

### Ranked list
Impact = how much "wow". Mobile cost = how likely to slow a phone. Items marked * come from `06` (rank given there); others are extra ideas from me (OPINION, not researched).

| Rank | Idea | Impact | Effort | Mobile cost | Ship in | Low-end phone |
|---|---|---|---|---|---|---|
| 1 | Dusk-to-dawn colour arc over the run, dawn = win * | Very high | S | Very low | v1 (P3) | Keep |
| 2 | Spirit glow: additive halos, fireflies, fog, vignette * | Very high | S | Low-med | v1 (P3) | Fewer fireflies, no fog |
| 3 | Level-up fanfare (slow-down, ring, zoom punch, chime) * | High | S | Very low | v1 (P3) | Keep |
| 4 | Evolution hero moment: world dims, weapon icon flies in, white flash, name letters reveal, ring burst, new music layer. 1.2 s * | High | M | Low (one-off) | v1 (P6) | Keep, skip shake |
| 5 | Boss intro: letterbox, name card, roar, zoom, health bar slides in * | High | M | Low | v1 (P6) | Keep |
| 6 | Unique look per evolution (own colour, trail, sound) * | High | M | Low-med | v1 (spread across P3-P6) | Shorter trails |
| 7 | Live title screen (auto-run behind logo) * | High | S | Low | v1 (P10) | Keep |
| 8 | Summon bond glow trails: summons leave fading light ribbons; glow stronger as the weapon ranks up (visual only in v1) | High | M | Med | v1 if P3 budget allows | Trails off |
| 9 | Pooled damage numbers, hit flash, death wisps * | Med-high | S | Low | v1 (P3) | Fewer numbers |
| 10 | Character select presentation: hero on a pedestal, summon orbiting, ability preview | Med-high | M | Very low (menu) | v1 (P10) | Keep |
| 11 | Ability showpiece: Wren's Pack Howl sends a light wave across the map and wolves flare; Elias's Sanctuary draws a glowing holy circle | High | M | Med | v1 (P6) | Simple ring |
| 12 | Screen-space accents: brief colour fringe on hit/evolve, heat-shimmer at dawn | Med | M | Med-high | Later | Off |
| 13 | Camera bloom (High only) * | Med | S | High | v1, High tier only | Off |
| 14 | Real-time lights (player, boss, pickups) * | Med | M | Med-high | Later; the fake multiply layer is enough | Off |
| 15 | Chapter signature hazard (Ch1: creeping lantern fog) * | High | M | Med | After launch, per chapter | Off |
| 16 | Shareable run summary card, daily seed * | Med | S | None | After launch | Keep |
| 17 | Codex of discovered evolutions and enemies * | Med-high | S-M | None | After launch (v1.1) | Keep |
| 18 | Real bond mechanic (kills raise a summon's power) * | High | M | Low | After launch (v1.1) | Keep |

### What to cut first for low-end phones (in order)
1. Bloom and any post effect. 2. Fog layers and chromatic fringe. 3. Trails and halos on projectiles. 4. Particle caps (500 -> 250 -> 100). 5. Damage numbers (merge, then hide). 6. Hit-stop and shake (also an accessibility toggle). The gameplay, dusk colour arc and vignette stay in every tier.

---

## 4. Risks and honest caveats

| Risk | What it means | Mitigation |
|---|---|---|
| Research is mostly opinion | `00`, `04`, `10`, `11` say few datamined sources were found. Targets such as "first evolution 5:30" are opinion | Treat numbers as starting points; use the bot and your hands |
| Unverified items | `12`: wolf A3 page not resolved; `09` and `11` mark items "unverified/recalled" (Cloudflare Access pricing, itch password, some Phaser config names, SmartScreen costs) | Claude re-checks each before relying on it |
| Licence drift | OGA licence boxes can change after upload; mirrors misstate licences (`12` section 7). Derivative sprites (Ghost monster, Undead King) have an upstream licence nobody checked | Re-check on download day; keep page captures; CREDITS rows with dates |
| CC-BY assets | Treant needs credit and a "modified" note | Credits screen in game |
| AI-made "CC0" art | Ownership unclear (Blacis pack) | Avoid |
| Art style clash | Mixed packs look like a collage | Palette lock, outline, repaint core cast. Plan real art time; budget more than you expect |
| Elias gap | Elias focus 41% vs 45-60 target; his orbit weapon suffers from the bot running away (`07`). His evolution rank requirement is locked design | Human playtest first; change design only with your yes |
| Boss may be too short | Current kill time 40-49 s; research suggests 60-120 s (`10`) | P6 tuning |
| Balance noise | Two 48-seed sets differed by up to 20 points (`07`) | Use 96+ seeds; never trust small runs |
| iOS limits | No install prompt (Share > Add to Home Screen). Safari can wipe browser storage after 7 days unused unless installed. Silent switch can mute web audio. No free native app (`11`, `09`) | Export button, "install" tip, persist request, test on a real iPhone |
| Windows SmartScreen | Unsigned .exe shows a warning. Signing costs roughly 100-400 GBP a year (`11`, UNVERIFIED) | Publish hash; explain; push web version |
| Public repo | Source and assets are visible; GitHub Pages needs it (`05`) | Decide in P0 |
| Shared GitHub origin | All `*.github.io` project sites share one storage origin (`05`, `11`) | Unique key prefix; Cloudflare gives isolation |
| Perf on phones | No measured phone numbers exist yet (`11`) | Baseline in P0, test in P3 and P8 |
| Scope creep | Wow list is long | Anything not in the table's "v1" column waits |

---

## 5. Decisions Matt needs to make

Tick when done. Claude's recommendation first.

- [ ] **Hosting (P0):** GitHub Pages now; move to private repo + Cloudflare Pages before art/testers. Add Access only if you want a login gate.
- [ ] **Final web address (P0/P2):** choose once, before players have saves.
- [ ] **Merge the open PR (P0):** yes, after the diff summary.
- [ ] **Elias evolution requirement (P1):** keep locked for now; revisit after a human playtest.
- [ ] **Spirit Bolts 5 -> 4 per rank (P1):** yes.
- [ ] **Howling Legion / Pouncing Pack new verb (P1/P6):** yes, in P6. Claude decides which of the two gets it and proposes the verb for your approval.
- [ ] **Magnet slightly rarer (P1):** fix it (make it a bit more frequent).
- [ ] **Palette (P3):** A "Moonlit Spirit-Glow". B "Ember Dusk" fits the title but has less spirit glow (`06`).
- [ ] **Sprite size (P4):** 16 px tiles, 32 px hero/summons, 64-96 px boss (`06`).
- [ ] **Accept CC-BY credit for the Treant (P4):** yes, it is the only treant found.
- [ ] **Audio: CC0 only for v1 (P5):** yes.
- [ ] **Boss HP and length (P6):** tune toward 60-120 s.
- [ ] **Tree size and cap (P7):** ~60 nodes, total about +40% power.
- [ ] **Windows wrapper (P9):** Electron (simple) over Tauri (small), unless size matters to you.
- [ ] **Paid steps (Play Store $25, iOS $99, code signing):** skip all. Everything stays free.
- [ ] **Launch channels:** web link first; itch.io page second.

---

## 6. How we work together

### The loop
`branch (dev)` -> `build` -> `tests` -> `sweep (bot)` -> `security line` -> `PR` -> `Matt playtests` -> `Matt merges` -> `live`

1. Claude or an agent works on `dev`. `main` is protected and is the live site.
2. `npm test` runs. Balance-touching changes also run `node scripts/sweep-all.mjs 96`.
3. Every task ends with a "Security check" line (`CLAUDE.md`).
4. Claude opens a PR and gives you 3-5 bullets plus a link to try.
5. You playtest and answer the phase's playtest question in plain words. Your feedback is the spec.
6. You press Merge. Claude never pushes to `main`, publishes, or changes settings without your explicit yes.

### What agents handle (token rules from `CLAUDE.md`)
| Work | Model |
|---|---|
| File lookups, formatting, renames, running scripts and reporting | haiku |
| Coding, tests, sweeps, research, asset checks | sonnet |
| Boss/attack design, tricky bugs, security-critical review (CSP, wrappers, save import) | opus or stronger |

- Prefer scripts (bot, sweep, tests) over repeated reasoning.
- Agent briefs stay short; reports are capped; no overlapping agents on the same files; reuse an agent with SendMessage when context matters.
- Claude reads only the needed parts of files.

### Security rules (always)
- Few dependencies; check each; run `npm audit`; never blind `audit fix --force`.
- Downloads come only from well-known sources, treated as untrusted, licence recorded in CREDITS.
- No passwords, keys or tokens in code, commits, docs or chat. Account and 2FA changes are done by you.
- Saves, imports and URL params are untrusted: validate, never `innerHTML`.
- Actions pinned, minimal permissions, secret scanning, push protection and Dependabot stay on.

### Using your phone with Remote Control
- Use it to watch progress, answer yes/no decisions from section 5, and playtest the live link on the phone itself.
- Keep replies short ("yes", "merge", "too bright at min 6").
- Do not paste passwords or keys into the chat. Do account steps on a screen you control.
- For phone performance tests (P3, P8), open the live link on the phone with `?bench=1` and tell Claude the numbers shown.

### After launch (roadmap, NOT scheduled)
Codex; bond mechanic; chapter 2 (Bog Hag) with the reusable chapter template (`10` section 1); remaining 8 characters; weapon combining; boss chests; items/passives; prestige; chapters 3-8; daily seed. Each starts only when you say so.
