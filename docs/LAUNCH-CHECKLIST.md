# Hollowlight v1: MASTER LAUNCH CHECKLIST

Compiled 2026-10-17 from docs/LOCKED.md, QUEUE.md, DESIGN-SHEETS.md, READINESS.md, BUILD-GUIDE.md, CLAUDE.md, docs/design/*, docs/research/* and `git log origin/dev` (300 commits). Facts only; anything I could not check is marked UNVERIFIED. Items marked "recommend" are recommendations: Matt decides.

Where things stand in one paragraph: the CORE GAME (heroes, world look, ambient life, lighting arc, UI screens, cards, all 5 weapons, all 15 evolutions, skill tree v1, saves, phone controls, PWA) is built on `dev`. What is LIVE on main is only the older build (PR #7: PWA + HUD-1 + HUD-2). The Release Gate (LOCKED 2026-10-17) says nothing merges to main until the list in section C is done and Matt says yes.

Preview the dev build: `npm run dev` then http://127.0.0.1:5173 (a dev server may already be running there). Useful URL params: `?debug=1` (fps, p95, slow frames), `?auto=wren&seed=1&t=540&god=1` (bot run, jump to time, invincible), `?kit=1` (UI kit page), `?life=1`, `?bright=normal|brighter|clear`, `?vib=0`, `?dawn=0`, `?night=0`, `?arc=0`, `?trails=0`, `?props=0`, `?fog=0`.

Legend for C: DECISION = needs Matt (three-options one-tap process); AUTO = can proceed without asking (still gets tests, sweeps, security, fit, screenshots).

---

## A. DONE AND APPROVED (Matt said yes, or it is live)

### A1. Foundations
| Item | Evidence |
|---|---|
| Name "Hollowlight: Spirits of the Dusk" (clash check still open, see E) | LOCKED Name |
| Identity "The Hollow" (grey world, spirit light restores colour, visual only) | LOCKED Identity |
| Art family: polished chunky 2D cartoon, P1 Warm Lantern; Hollowlight Style v1; 3D parked, pixel art rejected | LOCKED Art family / Style recipe |
| Rules: security first, design-lock-build, fit-the-game, three options, small chunks, fix weak spots, keep going back to back | CLAUDE.md, LOCKED |
| Zero budget, no hiring; code/AI/CC0 only | LOCKED Asset production |
| Hosting plan: public GitHub Pages for now; private repo + Cloudflare Pages before outside testers | LOCKED Hosting |
| Vite 6.4.4 pinned, in-repo inliner, npm audit 0 (on dev; ships with next release) | QUEUE item 00 |

### A2. Heroes
| Item | Evidence |
|---|---|
| Wren v2 (Pelt Walker + ghost wolf pup) in game as animated code-drawn rig (A1); focal-point aids + 12% smaller wolves KEPT (A1b) | LOCKED A1, A1b, Reopened |
| Elias v2 (Lamplighter, flame ring) in game (A2); Matt: "looks fine" | LOCKED A2, Reopened |
| Elias stats: speed 76, HP 130, holy +15% (kit lift waits for R1) | LOCKED Elias stats / Elias kit |
| Bible decisions: text barks only, bittersweet tone, quiet defeat beat then Again, enemies faceless with eye-points | LOCKED Bible decisions, Enemy faces |

### A3. World, ambient life, lighting arc
| Item | Evidence |
|---|---|
| World sheet #2 (A Meadow Glade + B Deep Forest Floor by zone) | LOCKED World sheet |
| W0 life map + ground blend; W1/W1b ground tiles; W2/W2b glowing trails: Matt "Good" | LOCKED 2026-10-16 approvals |
| AL-1/AL-1b sway, AL-2 restore-bloom: Matt "Good" | same |
| Ambient-life v1 design locked (AL-0..AL-6) | LOCKED Ambient life v1 |
| Visibility + vibrancy arc option A LOCKED (deep dusk, eyes above vignette, Brightness setting, vibrancy by clock + restored share) | LOCKED Visibility arc |
| Map events/minibosses/chests approved as a phased idea (not built, see D) | LOCKED World / map events |

### A4. UI and screens
| Item | Evidence |
|---|---|
| HUD sheet #1 "Lantern & Thread" LOCKED; HUD-1 frame, HUD-2 cards, HUD-3 numbers/pickups built (HUD-1/2 are on main) | LOCKED HUD + cards |
| UI identity v1 + round 2: Lantern Glass, Lit (+ colour-returns border on evolution cards and Dawn results only) | LOCKED UI IDENTITY v1/v2 |
| Fonts: Fondamento (renamed "Hollowlight Chancery") + Alegreya Sans, self-hosted OFL | LOCKED Fonts (U1b) |
| U2b kit repaint: "looks far better" | LOCKED 2026-10-16 |
| U3 title + hero select: "the right direction for this and going forward" | LOCKED |
| U4 pause + settings: "good, I like this direction" | LOCKED |
| U5 level-up / Blessing / evolution cards: "these work" | LOCKED |
| Results screen DESIGN locked (one screen, lantern dims not out, top-3 damage share, Tree shortcut) | LOCKED Results screen, Reopened |
| Low-HP frost made thinner (edge-only) after feedback | LOCKED row 19 |

### A5. Cards, Blessings, evolution moment
| Item | Evidence |
|---|---|
| 5 Blessings (run-only quiet cards, caps trimmed); copy approved (effect-first lines, "Quiet gifts") | LOCKED Blessings, Blessing copy |
| "Something stirs" evolve hint (never names the evolution) | LOCKED Evolve hint |
| E9 evolution pick moment (0.55 s beat + name plate + codex lines): Matt "I like it... great idea" | LOCKED 2026-10-17 |

### A6. Weapons and all 15 evolutions (DESIGN approved; builds in B)
| Weapon | Evolution 1 | Evolution 2 | Evolution 3 |
|---|---|---|---|
| Ghost Wolves | Howling Legion = Echo Pack | Dire Alpha = The Alpha | Phantom Stampede id = Light Trails (card name PROVISIONAL "Lightfoot Pack") |
| Raven Flock | Murder Storm = Wall of Wings | Dive Bombers = Talon Mark | Spearhead (replaced Vanguard) |
| Spirit Bolts | Spirit Tempest = Burst and Seek | Soul Lance = Lances of Light | Returning Pages |
| Chain Lightning | Thunder Judgment = Judgment from Above | Static Storm = Living Field | Storm Tether |
| Holy Orbit | Sanctum Halo = Consecrated Ring | Judgement Wheel = Bursting Lights | Vesper Tide |

Rules locked: three evolutions per weapon (15), evolved weapons keep their other stat cards, Rend 15-35%, Burn for Elias (Orbit hits, Halo ground, Wheel blasts; never Candle Wheel), 3x cap also at pick time, Mark +15% 3 s with total damage-amp cap x1.75, Pouncing REJECTED, Judgement Wheel exempt from stream40 cap@pick (Alt 1), Light Trails/Spearhead/Vesper Tide picked.

### A7. Progression, tree v1, saves
| Item | Evidence |
|---|---|
| Progression-gates design (options behind gates, run 1 = Wolves + Orbit + 2 evolutions, small capped stat nodes) built G1a-c | LOCKED Progression |
| Base difficulty hpScale 0.46/0.020 (G1d) | LOCKED Base difficulty |
| Skill tree v1 (63 nodes, node web) built; tree v2 design direction locked (see C) | CLAUDE.md, QUEUE |
| Saves: localStorage, versioned, export/import with validation, bank gold + soul shards (live since v0.2.0) | QUEUE P2, U4 |

### A8. Phone, PWA, performance, security
| Item | Evidence |
|---|---|
| Touch controls (floating joystick, ability, pause, tappable cards): Matt playtested on phone, "works exactly how it should" | LOCKED Phone play |
| PWA-1 installable app, fullscreen, landscape manifest, versioned service worker, install card (on main via PR #7; headless-Chrome checks only) | LOCKED Phone play, QUEUE item 0 |
| Perf fix after lag report (life-map active rows, O(n) sort, auto-tier warm-up, `?debug=1` p95) | LOCKED PERF FIX |
| Security habits in force: textContent only (tests forbid innerHTML), saves/imports validated, no secrets, npm audit 0 at last check, main protected | CLAUDE.md, per-chunk rows |

---

## B. BUILT ON DEV, AWAITING MATT'S REVIEW (he has not explicitly approved these)

Everything below is on `dev` only. Preview with the dev server (top of file). "Look at" = what to judge.

### B1. Screens and HUD
| Item | Look at / how to preview |
|---|---|
| HUD-1/2/3 feel (HUD A on main; HUD-3 numbers, pickups, states not reviewed) | Play a run; open `?debug=1`. Open feedback: "HUD feels better but not unique" (UI later restyle done in U-chunks). |
| U6 results screen | Die early and win: `?auto=wren&t=540&god=1` or lose on purpose. Check placeholder copy: 3 defeat lines, Wren/Elias victory barks |
| Frost thinner (reviewed? UNVERIFIED approval) | Run at low HP |
| Evolution plate/beat E9 | Approved (see A5) |

### B2. World and ambient life (all visual only)
| Item | Look at |
|---|---|
| W3 corruption (ink-dark ground round enemies) | Stand in a swarm: too dark / too subtle? |
| W4 props + AL-3 crowns/petals (11 prop kinds) | Size, number, clutter on phone |
| AL-4 reactive foliage | Walk through grass and a swarm |
| W5-world fog, fireflies/motes, edge wall + AL-5 critters | Walk the map; reach the edge |
| WL6a Brightness setting + arc data (Settings > Picture > Brightness) | Play 3 runs on Normal; checklist docs/design/visibility-arc-v1.md 4.1 |
| WL6b/WL6b2 enemy night look: eyes, quiet silhouettes, living eyes | Early minutes: can you see what hits you? |
| WL6c vibrancy (colour ramps with the clock; `?vib=0` to compare) | 10-15 min part of a run |
| WL6d contrast harness + report | docs/design/visibility-arc-measured.md (numbers, no visual) |
| AL-6 dawn chorus (first light 8:30, hush 10:00, flood 14:00) | `?auto=wren&t=520`, `t=590`, `t=860`, `t=889` add `&god=1` |

### B3. Weapons and evolutions (each shows in a run; use GATES via the tree or debug grants)
| Item | Notes / decision pending |
|---|---|
| W1a bug fixes, W1b wolf speed, W7rem wolf bite rate | Numbers only |
| E1 honest card text, E2 readable bleed (blood red), E3 Rend | Check card wording; Elias weaker until R1 |
| B1 gated bug fixes, D1 evolved weapons keep stat cards | Side effect: Wren starter win ~56-70% (R1 retunes) |
| W3 Candle Wheel (Elias ability) | Modest ability by design |
| W4 Orbit guard + Burn | Open: should the contracted ring hit softer? |
| W5 Consecrated Ring, Wheel A Bursting Lights (Alt 1 chosen) | Look at gold rim, lilac burn |
| W6 Echo Pack (Alt A applied by Claude) | Matt may override |
| W7b Light Trails | NAME FINAL? "Lightfoot Pack" provisional |
| W7c The Alpha | DECISION: keep tuned numbers or literal sheet numbers; kite margin thin |
| W8a base Ravens (real scouts) + W8b Mark | Rally does not call ravens yet |
| W9a Wall of Wings, W9b Talon Mark, W9c Spearhead | DECISION: Talon dive 8x (default) vs 12x vs 6x |
| W10a-d Bolts base, Burst and Seek, Lances of Light, Returning Pages | Defaults: Tempest pop 0.12x per hit; Lance 2.0x + 0.07x |
| W11a-d Chain base, Judgment from Above, Living Field, Storm Tether | Defaults: smite 0.72x, strike 0.47x; Static swarm home 1.78x accepted |
| W12 Vesper Tide | Default: breathing rate 1.5x (locked said 1.0x) |

### B4. Phone/PWA (built, never tried on a real phone)
| Item | Notes |
|---|---|
| PWA install flow, offline, update prompt | Headless-Chrome checks only; no real install test |
| Shader ground, sway, trails, fog on real phone GPU | Needs `?debug=1` check, see E |

---

## C. REQUIRED BEFORE v1 AND NOT DONE (the Release Gate)

Source: LOCKED RELEASE GATE and RELEASE GATE ADDITIONS (2026-10-17). Rough order = the locked order where it exists (R1 -> enemies -> tree -> boss -> front door + tutorial -> audio -> final verification), my suggestion otherwise (marked "suggested"). Nothing merges to main without Matt's explicit yes.

| # | Item | Status | Done means (acceptance gate) | Depends on | Matt? |
|---|---|---|---|---|---|
| 1 | R1 RETUNE + merge Rally the Pack (W2, held on branch `w2-rally`) | Not started; prep is "NOW" in QUEUE | Both heroes win 15-30% with no tree (bot, 96+ seeds, noise stated); no deaths before ~5:00; deaths spread 6-14 min; abilities a modest share (on vs off within a few points); Wren-Elias gap small; evolutions still in band; Elias kit lift decided (+15% -> +50% proposed); Rally registers through the srcAmps cap | All weapon/evolution chunks (done) | DECISION on moved targets, Elias kit, Rally softening; mostly AUTO otherwise |
| 2 | ENEMIES design sheet #4 | Research 37 exists (untracked file); no sheet | Locked roster for Chapter 1 (silhouettes, eyes-only night look, animation personality, behaviours, minibosses at set times + chests, corruption bloom), three options each | Can run in parallel with R1 | DECISION (three options per creature) |
| 3 | ENEMIES build | Not started | Each enemy a unique data-driven rig; readability gates G1-G8 still pass (contrast harness); sweeps/targets re-checked; true-size + phone shots | #2 locked; R1 numbers (re-tune after) | AUTO after lock |
| 4 | SUMMONS ART sheet #3 (wolves, ravens, glyphs, lights, lightning in Style v1) | Not started | Three options per summon, Matt picks, locked | Suggested: before tree emblems and after R1 | DECISION |
| 5 | SUMMONS ART build | Not started | Looks match sheet at true size and phone; perf caps held | #4 | AUTO after lock |
| 6 | Weapon roster review (Lantern Wisps, Grave Hand, Frost Bell, Bone Servant, Soul Harvest) design only | Queued, not started | Research -> design -> independent review -> lock (building the weapons is post-launch); tree clusters/emblems need the roster | After R1, before tree sheet | DECISION |
| 7 | SKILL TREE v2 DESIGN sheet #5 | Not started | Per-weapon emblem constellations, 3 evolution sockets per weapon, gates for all 15 evolutions, status power nodes (Bleed/Burn/Mark...), global rings, locked clusters dim, desktop + phone mock-ups, power budget under soft cap | #6, evolution counts final (done) | DECISION |
| 8 | SKILL TREE v2 BUILD (+ re-skin to Lantern Glass, gate data/counts tuned for gates 13-16, G2 rescale) | Not started (tree v1 plain styling is what exists) | Whole tree reads at phone size, pans, nodes light up, locked nodes show progress; full tree no longer makes the bot win 100%; gate counts replace estimates (gates-pace run) | #7 | AUTO after lock |
| 9 | BOSS redesign sheet (Elder Treant, 3 phases + intro) | Not started | Fight 60-120 s (now 40-49 s), boss-death share target, never frightened/pinned rules kept; three options | #2 style/behaviour decisions | DECISION |
| 10 | BOSS build | Not started | Phases readable, telegraphs above vignette, acceptance via sweeps | #9 | AUTO after lock |
| 11 | FRONT DOOR: device profiles (max 3, skip when one), Continue/New Game, hero select, map/chapter select (Chapter 1 now, others locked/dim), per-device audio + touch settings | Design sheet #6 pending; hero select + title already built (U3) | Flow cover -> play -> profile -> hero -> map -> run works with keyboard + touch; hostile profile names inert; export/import covers profiles; no accounts | U3 done | DECISION on look (sheet), then AUTO |
| 12 | FIRST-RUN TUTORIAL (short, skippable hints, 3 lines max) | Not started | New player learns move, pick a card, ability, evolve rule without a wall of text; skippable; not shown again | #11 | DECISION on wording |
| 13 | FIRST-60-SECONDS + GAME-FEEL pass | Not started | Hero attacking by ~3 s, first level-up ~5-10 s, first swarm 10-60 s (XP curve check); hit/kill/gem/level-up feel; phone vibration | #3 (enemy feel), #1 | DECISION (feel taste), AUTO measurable parts |
| 14 | AUDIO: sound palette + music direction sheet, then build | Not started (cue names reserved: evo_<id>, dawn_chorus_1..3) | Sheet locked; free/code-generated sources only, licences in CREDITS; voice caps; music fades; sliders do something; evolution sounds | #3, #9 for the sounds they need | DECISION (sheet), AUTO build |
| 15 | CODEX + UNLOCK CELEBRATIONS | Not started (codex text lives in evolutions.json) | Codex screen (bestiary + evolutions, recipes shown only once discovered), first-unlock celebrations for tree nodes/weapons/evolutions | #8, #3 | DECISION (look) |
| 16 | POST-VICTORY REPLAY LOOP (harder tiers or endless dusk after Chapter 1) | Not started | After first clear there is a clear reason to play again; balance targets per tier; no new weapons needed | #1, #10 | DECISION (three options) |
| 17 | CONTENT PIPELINE (templates + validators + docs/CONTENT-GUIDE.md + scaffold scripts; chapter/ARC/palette per chapter, not hard-coded) | Not started | Weapon, evolution, hero, enemy family, chapter/map templates; `npm test` validates; "how to add X" checklists | After tree and boss builds | AUTO (add the three-options process into the guide) |
| 18 | LOGO + app/favicon/install icons + share-preview image | BUILT on wip/brand-wisp (Wispwick wordmark, icons, share image); awaiting Matt | Final wordmark polish, icons at all sizes, share image at 1200x630 | Name check (E) | DECISION if wordmark changes; else AUTO (default folded in) |
| 19 | ABOUT page (credits, licences, AI disclosure, version, feedback link) | BUILT as Settings > About (wording drafts, TODO Matt); awaiting Matt | In-game page; every asset/font/licence listed; AI-use disclosure for itch.io/Steam; feedback link | Final asset list | DECISION on wording/feedback channel |
| 20 | ACCESSIBILITY basics (text size, remappable keys, PC gamepad) | BUILT on wip/a11y 2026-10-28 (LOCKED A2 + A3): Text size Normal/Large/Larger, full keyboard remap with hints; gamepad stays the menu-only stub (post-v1); one taste call in QUEUE 'Decisions waiting' | Settings for text size and key remap; gamepad on PC; checked at all sizes | #11 | AUTO (folded in unless Matt vetoes) |
| 21 | SAVE SAFETY (backup reminder, corruption recovery) | BUILT on wip/a11y 2026-10-28 (LOCKED A1): crash-proof load, bounded damaged copy + download, gentle backup reminder, fuzz tests | Corrupt save never crashes (falls back + keeps a backup); reminder to export; old-version save loads | #11 | AUTO |
| 22 | LOW-END PHONE PASS (battery, heat, offline, updates) | Not started | Real low-end Android: stable frame rate on Low tier at 350 enemies, no overheating in 15 min, offline works, update prompt safe | Matt's phone (E), #3, #8 | AUTO + Matt's device |
| 23 | FINAL VERIFICATION (all of: full security review + npm audit; real-phone test (shader, fps, controls); name check; CREDITS + AI disclosure; full balance sweep; visual QA at all sizes; friend playtest via private link; Matt playtest checklist) | Not started | Each sub-item reported with numbers; audit 0 or explained; no `innerHTML` with untrusted data; hosting moved to private repo + Cloudflare (or decision to stay public) before outside testers | All above | Matt's actions in E; merge needs his explicit yes |
| 24 | PRIVATE TEST then MERGE dev -> main | Not started | Friend testers play; feedback triaged; Matt says "ship it" | #23 | Matt's explicit yes |
| 24b | SAVE RELEASE GUARDS (from the save-v3 review, docs/design/save-v3-review.md) | Code DONE on dev 2026-10-18; launch steps TODO | At the v1 merge, in this order: (1) CONFIRM the H1 forward-tolerant store (SaveStore read-only lock for newer saves, src/save/store.js) is in the release BEFORE any further SAVE_VERSION change, and never roll main back across a save-version bump; (2) TODO: take the released snapshot: `node scripts/tree-release.mjs --snapshot`, commit tests/fixtures/tree-released.json in the launch merge (T2 + T3 ship together in v1; after this any change to a released tree id needs a core.version bump + migration step with a frozen price table, enforced by tests/treerelease.test.mjs); (3) known limit L2: an imported save can claim gold/stats (offline, same as v1); (4) FD1 lanterns: a newer-version lantern index locks every lantern read-only; the legacy `hollowlight:save` key stays as a frozen pre-lanterns copy, so an older build would show that stale copy (not a loss); matters only if cloud saves or leaderboards ever exist | T3, #24 | Matt: yes to the merge |

Open decisions that block C items (all from sections B/F): Rally softening, Elias +50% kit, W7c Alpha numbers, Talon dive, Light Trails final name, Vesper Tide 1.5x, tree gate counts.

---

## D. PARKED / DISCUSSED IDEAS (recommendations only; Matt decides)

"IN v1" = recommend doing before launch; "AFTER" = after launch.

| Idea | Source | Rec. | One-line reason |
|---|---|---|---|
| Elias polish (wheel-planting animation, glad face, flame count by rank, side/back views) | LOCKED A2 reopen | AFTER | Looks fine to Matt; polish only |
| Wren A1.1 (pup howl on Pack Howl, pup sleep pose, ear flicks, leash, walk views) | QUEUE A1 | AFTER | Cosmetic |
| Briar Mother mini-boss, Grey Alpha elite | BIBLE, research 10 | IN v1 (fold into enemies sheet #4) | Needed for minibosses-at-set-times |
| Treant arena (boss space) | Parked | IN v1 (fold into boss sheet) | Part of the boss redesign if cheap |
| Minibosses at set times + chest rewards | QUEUE parked, LOCKED World | IN v1 (phased, cheap pulls first) | Gives a reason to power up; approved phased |
| Map challenges / POIs (lamps, wisp, Grey Well, lanterns), W8 POI art | QUEUE parked, LOCKED | IN v1 first phase only (lamps, wisp), rest AFTER | Fixes empty maps; each phase needs its own design/bot check |
| Moths circling lit lamps | QUEUE W5 | AFTER (with lamps) | Needs W8 lamps |
| Interactive foliage v1.1 (light a tree and it blooms with flowers, bushes too) | Matt feedback 2026-10-16 | IN v1 if time (design first) | Matt asked for it; needs research/design/lock |
| Life-map gameplay link (restored ground empowers summons) | Parked | AFTER | Needs Matt's approval after playtest; balance risk |
| Weather | Idea | AFTER | Not in locked scope |
| R5 in-world defeat beat | QUEUE U6 | IN v1 (small) | Fits tone; results screen already locked as R5 |
| Results "of which bleed X%" line | QUEUE E2 | AFTER | Counter exists; low value |
| Results recipe reveal after first evolve | QUEUE EVO-HINT | IN v1 with the codex (#15) | Natural fit |
| Real-phone check of results, per-hero bark copy pass | QUEUE U6 | IN v1 | Part of final verification / copy |
| Weapon icons for the kit (wolf/orbit emblems reuse HUD emblems) | QUEUE U3 | IN v1 with the tree emblems | Tree v2 needs per-weapon emblems anyway |
| Evolution sounds (evo_<id>), trail sound, critter sounds, dawn chorus sounds | QUEUE | IN v1 as part of audio | Cue names already reserved |
| Codex screen, Codex link on title | QUEUE | IN v1 (#15) | Release gate item |
| W5b Sanctum Halo kill-heal | LOCKED W5b | AFTER | Halo text is honest without it |
| Chapters 2-8 | CLAUDE.md | AFTER | Pipeline (#17) makes them cheap later |
| Other 8 heroes (Mara next suggested) | LOCKED Bible | AFTER | "Decide later" per Matt |
| Roster weapons: Lantern Wisps, Grave Hand, Frost Bell, Bone Servant, Soul Harvest | QUEUE | Review IN v1 (design only), build AFTER | Tree clusters depend on the roster |
| Prestige | CLAUDE.md | AFTER | Not needed for launch |
| Weapon combining, item/passive list, boss chest rewards beyond minibosses | CLAUDE.md parked | AFTER | Scope |
| Difficulty tiers / Gloom dial | LOCKED parked | IN v1 only as the post-victory loop (#16) | Gives the replay reason |
| Pelt Dash (Wren unlock) | LOCKED Abilities | AFTER | "Later as unlock" |
| Wren-only kill-sparks tree node | LOCKED Bible | AFTER | Visual only for now |
| Status effects tree nodes (Deeper Wounds, Kindling...) | QUEUE idea | IN v1 inside tree v2 design | Release gate lists status power nodes |
| "Summon mastery/commands", kill-streak systems | QUEUE parked | AFTER | Scope |
| Cloud accounts | QUEUE front door | AFTER (probably never) | Needs backend/GDPR; not free-simple |
| Android APK / Windows .exe / Play Store ($25) | BUILD-GUIDE P9 | AFTER | PWA covers launch |
| AI art pipeline (Forge/ComfyUI experiment, LoRA per hero) | QUEUE | AFTER | Forge busy with Matt's other project; no GPU use without asking |
| Gentler earlier evolve hint | QUEUE | AFTER (playtest first) | Check after first-60-seconds pass |
| Raven Rally wiring, Wall of Wings hits-taken -5% | QUEUE W8/W9 | Rally wiring IN v1 (with #1); -5% AFTER | Rally merges at R1 |
| Quitting mid-run banks no gold (keep) | QUEUE | keep | Recommended as is |
| 'Crits only' number mode, real gem-flight thread trail, boss subtitle line | QUEUE HUD-3 | AFTER | Cosmetic |
| Blessing flavour line / Wider Glow colon fix (allow ':' in TEXT_RE) | QUEUE | IN v1 (tiny) | One-character change needs OK |
| Reference screenshots (Spirit Hunters tree) | QUEUE | IN v1 helpful for #7 | Not blocking |
| Perf: fewer ribbon/glow sprites (450 glow objects on High) | QUEUE PERF | IN v1 if the real-phone check shows need | Decide from E data |

---

## E. MATT-ONLY ACTIONS

| # | Action | Why / how |
|---|---|---|
| 1 | Phone check with `?debug=1` on the dev build | Shader ground, sway, trails, fog, props: fps, p95, slow count. Reads the on-screen numbers to Claude. Never done on a real phone. |
| 2 | Real-phone PWA install test (Android Chrome; iPhone Add to Home Screen) | Never tested; saves are separate on iOS (use Export/Import) |
| 3 | Play the dev build (3 runs Normal brightness, then a late-game run) | Checklists: docs/design/visibility-arc-v1.md 4.1; look at the Section B items |
| 4 | Answer open decisions (section B3 + F) via one-tap questions | R1 targets, Elias kit, Alpha, Talon dive, Light Trails name, Vesper Tide 1.5x |
| 5 | Name search "Hollowlight" on itch.io, Steam and UK IPO / EUIPO | Medium clash risk (Hollow Knight, "Hollow Light" jam game/studio); needed before any public launch |
| 6 | Read/edit wording: results lines (3 defeat lines, Wren/Elias victory barks), hero epithets, button copy, Blessing flavour lines | Placeholder copy is Claude's draft |
| 7 | Friend testers list (who gets the private link; at least one Android, one iPhone if possible) | For the private test (#24) |
| 8 | GitHub settings only he can change: Dependabot, secret scanning, push protection, branch protection on main, 2FA | Claude must not change account/security settings |
| 9 | Decide hosting: stay public GitHub Pages, or private repo + Cloudflare Pages (verify Cloudflare Access / itch.io password for testers) | Before outside testers |
| 10 | Approve downloads (any new font, asset, audio) one by one | Standing rule: downloads need his yes |
| 11 | Merge approval: "ship it" for PR dev -> main | Release gate |
| 12 | Optional: reference screenshots of games/art he loves | Helpful for tree and enemies |

---

## F. KNOWN LIMITS / WEAK SPOTS STILL OPEN

TRIAGED 2026-10-17 (FIX-EVERYTHING-FLAGGED): every line below carries its bucket in bold at the end (FIXED / NEEDS MATT / NEEDS PHONE / AFTER-R1 / ACCEPTED / QUEUED CHUNK); full table, option lists and the new items in docs/design/flagged-triage.md. Zero unclassified items.

### F1. Balance (bot sweeps; noise about +-5 to +-10 points at 96 seeds)
- STARTER (no tree) win rates: Wren ~56% random / 64% FOCUS, Elias ~30% / 34%. Target is 15-30% for both: R1 owns it (Matt: leave it until R1). Cause chain: D1, E3, W4 guard, W7rem. **[AFTER-R1 R-1]**
- GATES=all (everything open): Wren random 8-18% / FOCUS 29-45%, Elias random 8-17% / FOCUS 11-14%. No locked target for GATES=all. **[ACCEPTED A16 no target; AFTER-R1 R-2]**
- Wren-Elias gap ~26 points at starter (target small). **[AFTER-R1 R-1]**
- Talon Mark: boss home 1.41x is under the 1.6 target; its own raven damage is about 3.0x base (TEAM measure is the locked yardstick); TEAM standing swarm 0.94x. Alternatives in LOCKED W9b. **[NEEDS MATT N1]**
- Static Storm swarm home 1.78x (0.02 under the 1.8 floor), accepted as noise; pinched by the pick cap. **[NEEDS MATT N6]**
- The Alpha: kite margin 1.41x vs gate 1.4x (thin); numbers differ from the sheet (tuned values + 2 alternatives in LOCKED W7c). **[NEEDS MATT N2]**
- Light Trails: swarm/kite cap@pick 3.12x/3.01x mortal saturation (not a gate); name provisional. **[ACCEPTED A10; name: NEEDS MATT N9; AFTER-R1 R-9]**
- Judgement Wheel: exempt from the stream40 cap@pick (documented exception). **[ACCEPTED A1, Matt chose Alt 1]**
- Spirit Tempest pop 0.12x per hit and Soul Lance 2.0x+0.07x deviate from the locked numbers (defaults, overridable). **[NEEDS MATT N4 (Tempest) and N3 (Lance)]**
- Vesper Tide: breathing 1.5x (locked 1.0x misses band); swarm 1.04x, boss 1.04x (barely above base). **[NEEDS MATT N5]**
- Raven Watch only matters in thin waves; ravens crowd DPS 0.65-0.75x of wolves. **[AFTER-R1 R-7]**
- Wall of Wings does not reduce hits taken (standing 200 vs 210 hits); card makes no safety promise. **[ACCEPTED A9: the card promises no safety]**
- Bleed share 38% for swarm at Rend r5 with other stats r2 (slightly over the 35% gate). **[AFTER-R1 R-3]**
- Gate counts for gates 13-16 (Spearhead, Returning Pages, Storm Tether, Vesper Tide) are ESTIMATES; gates-pace not re-run. **[AFTER-R1 R-4]**
- Elder Treant fight 40-49 s (target 60-120 s); boss-death share and early deaths (4-8%) flagged in the old queue; Murder Storm wall does ~0 damage to a boss (inner ring only; redesign belongs to boss chunk). **[AFTER-R1 R-5; boss chunk]**
- W2 Rally the Pack is NOT on dev (branch `w2-rally`); Pack Howl x2 wolf bite is still outside the amp clamp. **[QUEUED CHUNK W2; A15]**
- Elias without Sanctuary-style carry: Candle Wheel is modest (on vs off within 1-2 points), so Elias depends on base kit until R1. **[AFTER-R1 R-6]**
- Bot never builds bolts-first; no with/without-evolution comparison for bolts evolutions. **[FIXED X11: PREFER_W=spirit_bolts bot; evolution-vs-base is scripts/evo-home.mjs, covered by the W10 sweeps]**

### F2. Visual / readability
- Protan/tritan: root crawler at 220 units on portrait phone in daylight misses G1|G2 (10 of 4860 cells; eyes 2.83-2.99:1); options in docs/design/visibility-arc-measured.md. Needs Matt's choice (darker daylight body vs G3 floor). **[NEEDS MATT N10: measured, no safe knob; see flagged-triage.md]**
- Strict daylight reading (every enemy needs |dL*| >= 6 after 11:00) misses 366 of 4860 cells, 289 of them on corrupted ground. **[NEEDS MATT N10]**
- Last 30 s flood rises 0.009 Y/s (sheet claimed 0.0027); kept as locked. **[ACCEPTED A2]**
- Saturation flush is clipped by the top vibrancy level at 15:00 (shows mostly on ground). **[ACCEPTED A3]**
- Med and phone-portrait shots not taken for AL-6 (same code path). **[FIXED X15: shots taken, docs/screenshots/al6/]**
- Pup sleep/howl/back poses not built; Elias has no side/front/back views, no glad face, no flame count by rank. **[QUEUED CHUNK: A2 polish, parked by Matt]**
- Snag blossoms are cream/peach not pink; lamp posts not built (W8 POIs); oak 0.8x and pillar 0.9x of sheet size; crown sway max ~1.7 deg (sheet's 0.8 deg invisible). **[ACCEPTED A4; lamp posts QUEUED (W8 POIs)]**
- Moths circle a home spot (no lamps). **[ACCEPTED A6]**
- Low tier shows no sway, no critters (reserved for dawn birds), no ground shader; ~2 ambient sprites. **[ACCEPTED A5]**
- Quality tier flapping: fixed in perf pass, UNVERIFIED on Matt's PC after the fix (he was asked to read p95/slow lines). **[FIXED X12 here (0 tier changes in 6 runs); Matt's PC: NEEDS PHONE P3]**

### F3. Performance and devices
- Low-tier perf UNMEASURED on a real phone; shader ground on a phone GPU not proven; ambient/trail/night layers measured only in headless Chrome on the RTX 3060. **[NEEDS PHONE P1]**
- High-tier night-look cost +1.3 ms whole-frame work vs 0.6 budget (noisy machine): re-measure on a quiet machine / real phone. **[RE-MEASURED 2026-10-17, still inconclusive: machine at 100% CPU; see flagged-triage.md 4b; NEEDS PHONE P1 / quiet machine]**
- Frame hitches in the original lag report came from CPU contention; ~450 glow objects on High (parked). **[ACCEPTED A7]**
- No iOS test; no Android install test. **[NEEDS PHONE P2]**

### F4. UI and copy
- Settings: sound/music sliders have no audio to preview (no audio exists). **[ACCEPTED A11; audio QUEUED]**
- Space-on-resume ability queueing: fixed in b6db61e for pause buttons (pre-existing Phaser JustDown issue; UNVERIFIED for all paths). **[FIXED X4: also level-up/end-screen path]**
- Blessing label caps ("BLESSINGS - QUIET GIFTS") in single string; Wider Glow uses comma not colon (TEXT_RE). **[ACCEPTED A8]**
- Results copy is placeholder; no profile UI yet (hostile-profile tests cover hero names, bank, version only). **[NEEDS MATT N11; profile UI QUEUED]**
- Skill tree screen is still the plain v1 styling; full tree makes the bot win ~100% until rebalanced. **[QUEUED CHUNK: tree v2; AFTER-R1 R-8]**

### F5. Process and repo hygiene
- Test suite: 629 tests at the last full count in LOCKED (one failure then: cardsui 'HUD-2 text clamps', fixed by shortening W11 card text; current run UNVERIFIED). Run `npm test` and `npm audit` before any merge. **[FIXED X1/X10: flaky test fixed, suite green, count in flagged-triage.md]**
- `docs/research/37-enemy-design.md` is untracked in the working tree (another agent's/Matt's file; not committed by this checklist). **[FIXED X9: committed in 285caa9]**
- Live site (main) is v0.4.0-era plus PWA/HUD-1/HUD-2; dev is far ahead. **[NEEDS MATT N12: 'ship it']**
- tests/visibility-pins and docs/design/visibility-arc-measured.md: the harness test depends on that report existing (it was missing during one in-flight run; present now). **[ACCEPTED A12]**
- No audio, no tutorial, no profiles, no codex, no About page exist yet (all in section C). **[QUEUED CHUNK, section C]**
- Name clash risk (Hollowlight vs Hollow Knight / "Hollow Light") unchecked. **[NEEDS MATT N12: his own search]**
