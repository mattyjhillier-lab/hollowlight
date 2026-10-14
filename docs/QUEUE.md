# Hollowlight: to-do queue (kept up to date by Claude; Matt can add anything)

## NOW / NEXT / LATER (focus keeper)
- NOW: skill tree build finishing (the last running job). Art family LOCKED: polished 2D cartoon, P1 Warm Lantern.
- NOW (art): style recipe chosen (S1+S5 mix, see ART-DECISIONS). Next small chunk: Wren design sheet in this recipe for Matt to approve.
- NEXT (Matt asked): ROSTER + ABILITIES WORKSHOP right after the Wren sheet and before drawing other heroes: revisit who the heroes are, their special abilities and how summons/evolutions work, so everything matches what the game is evolving into (inputs: docs/BIBLE.md hero section, docs/research/18 summons review, docs/IDENTITY.md). Do it in small steps, 2-3 heroes at a time, check mechanical sense and look fit.
- THEN (Matt asked): CONTENT REVIEW SERIES, small steps, in this order: (1) roster + hero abilities workshop, (2) summons and magic weapons and their evolutions (what each is, how it plays, fit with the Hollow look and mechanics; use docs/research/18 findings: only wolves are true summons, ravens/orbit are rings, several evolution texts do not match behaviour, Murder Storm 5-13x outlier), (3) power-ups/pickups and what each CHAPTER adds (chapter-specific power-ups, hazards, rewards). Research to do first for steps 2-3 (how other games design summon/magic weapon sets, evolutions, per-chapter pickups); keep it in separate small research chunks.
- THEN: agree the action plan in small chunks: first chunk proposal = approve creature design sheets one at a time (Wren first), then rebuild the in-game look step by step.
- LATER: build phases in small chunks after the GO gate (docs/READINESS.md).
- PARKING LOT (ideas not started): see bottom of this file.

Legend: [ ] queued, [~] in progress, [?] waiting on Matt, [x] done. Parked items are not started without Matt's say-so (CLAUDE.md).
Standing rules always apply: security first, token conservation, everything must fit the game, no hiring/zero budget.

## In progress (agents running)
- [~] 3D proof (branch spike-3d): real 3D vs pre-rendered sprites, plus a "life map" (The Hollow) ground prototype. Go/no-go: >=45 fps at 300 enemies on throttled phone viewport.
- [~] Polished 2D cartoon mock-ups (P1 Warm Lantern, P2 Moonwell): world, creature sheet, skill-tree web, level-up cards.
- [x] Skill tree v1 built on dev (v0.4.0, 63 nodes, node web, exploration unlocks, 87 tests). Plain styling; re-skin later. PROBLEM: full tree makes the bot win 100% (half tree 75-94%): needs difficulty tiers or base re-tune.
- [~] Summons and evolution design review (read-only report): docs/research/18-*.md.

## Waiting on Matt (decisions / inputs)
- [x] Art direction settled: polished 2D cartoon P1 Warm Lantern (3D parked). Still open: final palette tweaks, UI personality details, creature design approvals.
- [?] Reference screenshots of games/art he loves (esp. Spirit Hunters' Divinity Web and look) with notes on what he likes.
- [?] Bible draft (docs/BIBLE.md): react/rewrite; 10 open creative questions inside it; proposed renames (enemy display names, Chapter 6 light/dark theme, gold coins as brass/"embers", Chapter 8 boss "The Unlit" instead of "Hollow King").
- [?] Name check: "Hollowlight" medium clash risk (Hollow Knight, "Hollow Light" jam game/studio). Search UK IPO/EUIPO/itch/Steam himself; decide before any public launch.
- [?] Balance decisions: Elias evolves too rarely (lowering evolution rank requirement = locked design change), Howling Legion/Pouncing Pack new verbs (P6), Elder Treant fight length (40-49s now, aim 60-120s), quitting mid-run banks no gold (recommend keep).
- [?] Hosting: stay on public GitHub Pages for now; move to private repo + Cloudflare Pages (+ Access or itch.io password for testers) before outside testers/art. Verify: Cloudflare Access free tier, itch.io password feature.
- [?] P3 (v0.3.0 lighting/juice/zoom/lightmap) and style work sit on dev; live game is still v0.2.0. Merge to main only when the look is settled and Matt says yes.

## Queued: AI art pipeline (saved for later, Forge is busy with Matt's other project)
- [ ] When Forge is free: 1-hour first experiment (docs/research/20-ai-assisted-art-pipeline.md): generate Wren + a ghost wolf in the Hollow identity from a prompt sheet Claude writes. Do NOT use the GPU or touch Forge while the other project runs.
- [ ] Check licences of the exact checkpoints before use in a game (NoobAI-XL/Illustrious merges: Fair AI Public License + possible commercial bans; RealVisXL V5.0 OpenRAIL++-M). Prefer SDXL base (OpenRAIL++-M) or FLUX.1 schnell (Apache-2.0) (needs a download Matt approves). Keep Hollowlight outputs in their own folder, separate from the other project.
- [ ] Write prompt sheets for Wren, Elias, wolves, ravens, enemies, Elder Treant (no GPU needed).
- [ ] Decide LoRA-per-hero consistency approach (lora-train folder exists) and the code-art vs AI split (AI for concepts/portraits/icons/key art; code or 3D for moving sprites and VFX).
- [ ] Add AI disclosure for Steam/itch.io at launch; keep prompt logs; credits file.

## Queued: build phases (see docs/BUILD-GUIDE.md; art-dependent ones wait for the look)
- [ ] P1 leftovers: none pending (Spirit Bolts trim and magnet frequency done).
- [x] P2 saves/results/settings (v0.2.0, live). 
- [~] P7 skill tree (running now).
- [ ] P3b Art identity build-out once chosen: creature design sheets (approve each), life map, hero/boss/spirit art, palette, UI personality (Borderlands-like boldness/restraint).
- [ ] P4 art pass Chapter 1 with verified assets + CREDITS.md (CC0 shortlist in docs/research/12-art-pack-shortlist.md; 3D assets in 16/17 if 3D).
- [ ] P5 audio v1: verified CC0 SFX/music (docs/research/09); find wolf howl/raven caw (Freesound login needed, per-file CC0); embed MP3; audio manager with voice caps.
- [ ] P6 enemies + Elder Treant 3 phases + new enemy types from the bible (docs/research/10).
- [ ] P8 phone: touch controls, PWA install, quality tiers verified on a real phone.
- [ ] P9 Windows .exe / Android APK (unsigned; Play Store $25 optional; iOS not free).
- [ ] P10 title screen hook, polish, launch checklist.
- [ ] Embed free OFL fonts self-hosted (e.g. Cinzel + Rajdhani) once the UI look is set; add game-icons credits if used.

## Queued: housekeeping and security
- [ ] Upgrade Vite on dev to clear npm audit findings (dev-only toolchain; never `audit fix --force` blindly; test first).
- [ ] CSP meta tag, save-import tests already done; service worker recipe per docs/research/11.
- [ ] Re-read each asset licence box by eye before shipping; keep CREDITS files.
- [ ] Private repo move + Cloudflare Pages setup (guided, step by step).
- [ ] Phone test of current dev build (performance baseline).

## Decisions pending from skill tree report
- [~] Matt chose a different fix than difficulty tiers: progression gates (options unlocked behind conditions, small capped stat nodes). Design doc + bot test running: docs/design/progression-gates-v1.md. Difficulty tiers stay an optional later idea.
- [ ] Exclusive branches vs exclusive keystone pairs; tree-gated weapons/heroes (supported via treeGate); free respec in v1 (kept); flat +1 spirit nodes removed (bot found them strongest). Raise in the roster workshop.

## Ideas parked (do not start without Matt)
Weapon combining, boss chest rewards, item/passive list, chapters 2-8, other 8 characters, prestige, codex, touch controls beyond P8, gameplay link for the life map (restored ground empowers summons), "summon mastery/commands" idea from the review, kill-streak/other systems.
