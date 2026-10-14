# Hollowlight: Spirits of the Dusk — survivors-style incremental game
(Working title was Cursed Forest; that is now Chapter 1's name. Always write "Hollowlight" as one word. Repo: mattyjhillier-lab/hollowlight, live at mattyjhillier-lab.github.io/hollowlight/. Plan: docs/PLAN.md, research: docs/research/.)

Owner: Matt Hillier (non-professional dev, Melton Mowbray UK, Windows PC). Building a game inspired by *Spirit Hunters: Infinite Horde*. **Everything must be free to build and host.**

## How to work with Matt
- Strict token-saving style: no pleasantries, extreme concision, no explanations unless asked, targeted diffs, don't restate his request.
- He playtests and gives feedback in plain language. Treat feedback as the spec; fix, run tests, rebuild, tell him in a few bullets.
- Do not build parked features until he says so. Ask before big design changes.

## Stack and layout
Phaser 3 + Vite, vanilla JS, ES modules. Single-file build (vite-plugin-singlefile -> dist/index.html).
- `src/sim/` pure-JS simulation (no Phaser/DOM): `Sim.js`, `weapons.js`, `cards.js`, `rng.js`, `grid.js`. Seeded RNG (mulberry32). Unit/bot-testable in Node.
- `src/data/*.json` all content (balance, weapons, evolutions, characters, enemies, chapters). New content = data first.
- `src/scenes/RunScene.js` Phaser rendering only (placeholder generated textures, pooled sprites). `src/ui/ui.js` DOM overlay (HUD, cards, menus). `src/app.js` glue. `src/main.js` boot.
- `tests/*.test.mjs` (`npm test`, 35 tests). `scripts/bot.mjs` headless balance probe: `node scripts/bot.mjs wren 8` (`FOCUS=1` for a focused-pick bot). Prints first-evolution time.
- Commands: `npm install`, `npm run dev`, `npm run build`, `npm test`.
- View is 640x360 logical, Phaser FIT scaling, pixelArt. World 4000x4000. DOM HUD scales by container query.
- URL debug params: `?auto=wren&seed=1&t=540&god=1&rr=3&ban=3&grant=ghost_wolves:speed=5,power=5:phantom_stampede&debug=1`.
- Hooks already present for the future skill tree: `sim.mods = {damage, area, cooldown, speed, pickup, xp, gold, abilityCd}`, `meta.rerolls/banishes`.

## Locked design
- Platform: web, keyboard first (WASD/arrows, Space ability, Esc pause, 1-4 pick, R reroll). Touch later. 16x16 pixel art from free CC0 packs later (Kenney, OpenGameArt, itch.io CC0); placeholders for now. 15-minute runs.
- Currencies: gold (spent on tree) and soul shards (from bosses). Tree is shown greyed-out with unlock conditions (kill counts, chapter clears, hidden nodes). Versioned saves. 
- Weapons: **summons and magic only** (more types can be added later). 4 weapon slots, 4 stats per weapon x 5 ranks.
- V1 weapons: Ghost Wolves, Raven Flock, Spirit Bolts, Chain Lightning, Holy Orbit. 11 evolutions (see evolutions.json).
- Level-up: 3 random cards. New weapons while slots open + stat cards for owned weapons; only stat cards once slots are full; maxed stats leave the pool; fallback cards (heal/gold/xp) if empty. Weighted draw without replacement (weapon card weight 4, stat 1). Stat cards in an evolution pair get a hidden weight bump (x2.2, x2 more once the partner stat is rank 3+).
- Evolutions: maxing a specific stat pair unlocks an evolution as an extra gold card (max 3 shown); multiple per weapon, one per weapon per run, evolved weapons are final. Recipes hidden until discovered (codex later).
- Reroll/banish are early tree unlocks (not available at start).
- Characters each have an active ability, 60s base cooldown (Wren: Pack Howl, Elias: Sanctuary). Tree later adds cooldown reduction (floor ~30s) and auto-activate thresholds (e.g. low HP).
- Chapter 1 Cursed Forest (wolves, crows, root-crawlers, boss Elder Treant at 10:00). Wren is Matt's favourite character. Planned: 8 chapters, 10 characters: Elias/Holy Orbit, Mara/Raven Flock, Wren/Ghost Wolves, Isolde/Spirit Bolts, Thomas/Lantern Wisps, Gideon/Grave Hand, Captain Vane/Chain Lightning, Sister Agnes/Frost Bell, Kael/Bone Servant, Hollow One/Soul Harvest.
- Pickups (added): heart (heal 30% max HP, more likely when below half HP, pity timer, boss always drops one) and Soul Magnet (pulls all gems; rarer; boss drops one).

## Current state (stage 1 done, playtested by Matt: "plays really well")
Playable run with Wren/Elias, all 5 weapons + 11 evolutions, abilities, boss, victory/defeat, pickups. Published privately as a Claude artifact for testing. 
Latest tuning (see balance.json / chapters.json): xp {3, 0.6, 0.008}; hpScale {0.26, 0.012}; dmgScale 0.04/min; waves ramp with a `curve` exponent (<1 = front-loaded); swarm events at 60/150/240/360/450/540/660s. Bot: first evolution median ~4 min, bot wins nearly every run (may be too easy; ask Matt).
Wolf evolution Phantom Stampede was reworked to **Pouncing Pack** (leap, pin, maul; id unchanged). Wolves now spread across different targets.

## Matt's feedback so far (drives next work)
1. Wolves should attack different targets (done).
2. Enemy density ramped too slowly (faster ramp done; XP rebalanced).
3. First evolution took until ~6 min left; too long (now ~4 min in bot runs).
4. Stampede wolves "zipped around" and were far too strong; not wolf-like (reworked). Evolutions in general may be too powerful: **review all 11**.
5. Wanted a magnet pickup and a way to regain health (done).

## Task list for Claude Code (in order)
1. **Research first** (Matt asked for deep research): how survivors-likes (Vampire Survivors, Spirit Hunters, Brotato, Halls of Torment, HoloCure, Soulstone Survivors, Death Must Die, 20 Minutes Till Dawn, Survivor.io) handle enemy scaling, wave/density ramps, XP curves and level-up frequency, time to first evolution, evolution power vs base, summon AI design, healing/magnet drops, meta-progression and difficulty tiers, balance pitfalls. Save notes in `docs/research/` with sources and numbers; flag datamined vs opinion. A partial research run may already exist in `docs/research/` (check first, don't redo).
2. Apply research to balance: review all 11 evolutions for power and feel (each should change behaviour, not just multiply numbers); retest with `scripts/bot.mjs`; check difficulty (bot should lose some runs, especially unfocused); check heal/magnet frequency.
3. Save system (localStorage, versioned, migration-ready) + gold/shard banking + results screen.
4. Skill tree v1 (~60 starter nodes, data-driven JSON, greyed-out locked nodes with unlock conditions, reroll/banish nodes, Summoner and Magic branches, per-weapon and stat nodes, ability cooldown node). Design for 500+ nodes later.
5. Art pass: free CC0 16x16 packs (re-find the best candidates: Kenney, OpenGameArt, itch.io; verify each licence). Replace generated textures in RunScene.
6. Parked until core feels right (do NOT start without Matt): weapon combining, boss chest rewards, item/passive list, chapters 2-8, other 8 characters, prestige, touch controls, codex.

## Hosting plan (free only)
- Static site, no backend. Build with `npm run build`; deploy `dist/` to **GitHub Pages** (GitHub Actions workflow on push to main) or Cloudflare Pages / Netlify free tier. Vite `base: './'` is already set. Later optionally publish to itch.io (free, HTML5 zip upload).
- Saves live in the browser (localStorage); add export/import save-file buttons so players can back up. No accounts, no server costs.
- Matt's setup: Windows PC, Node.js LTS + Git to install, GitHub account (free). Walk him through any one-time setup step by step.
