# Hollowlight: Spirits of the Dusk — survivors-style incremental game
(Working title was Cursed Forest; that is now Chapter 1's name. Always write "Hollowlight" as one word. Repo: mattyjhillier-lab/hollowlight, live at mattyjhillier-lab.github.io/hollowlight/. Plan: docs/PLAN.md, research: docs/research/.)

Owner: Matt Hillier (non-professional dev, Melton Mowbray UK, Windows PC). Building a game inspired by *Spirit Hunters: Infinite Horde*. **Everything must be free to build and host.**

## How to work with Matt
- Strict token-saving style: no pleasantries, extreme concision, no explanations unless asked, targeted diffs, don't restate his request.
- He playtests and gives feedback in plain language. Treat feedback as the spec; fix, run tests, rebuild, tell him in a few bullets.
- Do not build parked features until he says so. Ask before big design changes.

Task queue / to-do list: docs/QUEUE.md (keep it updated; add items Matt says to save for later). Art decisions log: docs/ART-DECISIONS.md.

## Standing rule: how to ask Matt questions (set by Matt, 2026-10-15)
Use the one-tap question format we have been using:
- Use AskUserQuestion; at most 3 questions per batch; if more are pending, ask the most blocking 3 first, record the answers, then ask the next batch.
- Each question is self-contained (plain words, no jargon), has 2-4 options, the recommended option FIRST and labelled "(Recommended)", each option with a short description of what happens.
- Before asking, give a short plain-language summary of what was found and why the decision matters (a few bullets); after the answers, state in one line what was locked.
- Record every answer immediately in docs/LOCKED.md (and docs/QUEUE.md/design docs as relevant) before continuing.
- Do not ask about trivial or reversible choices: take the recommended default, say so, and list it so Matt can override. Open feedback (how something feels) is asked as a plain question in chat, not a button question.
- When Matt returns after being away and prompts, ask the pending questions in this format, most blocking first.

## Standing rule: definition of done, every chunk (set by Matt, 2026-10-15)
Every chunk follows the same loop: RESEARCH -> DESIGN -> REVIEW -> LOCK (docs/LOCKED.md, Matt approves) -> BUILD (small chunk) -> VERIFY -> Matt reviews. VERIFY always includes ALL of: (1) tests green + build OK; (2) BALANCE CHECK: run the bot sweeps (scripts/sweep.mjs, bless-sweep.mjs, g1d-sweep.mjs, gates-*.mjs as relevant) with the Blessings and gates in their current state, compare to the locked targets (no-tree random-pick win ~15-30%, no deaths before ~5:00, deaths spread 6-14 min, evolution 1.8-2.3x base with 3x cap, abilities a modest share of power, tree total power inside the soft-cap budget, Wren vs Elias gap small) and report the numbers honestly with seed counts and noise; anything that moves a target needs Matt's decision; (3) SECURITY check (inputs validated, no new deps without review, audit reported, no secrets); (4) FIT check (look/identity + mechanical sense) and a conflict check against docs/LOCKED.md; (5) screenshots at true in-game size and phone size for anything visual; (6) update docs/LOCKED.md, docs/QUEUE.md and the relevant design doc. Report in a few bullets and end with Right now / Next / Parked.

## Standing rule: design, lock, then build (set by Matt)
Design everything fully and get it LOCKED as we go, so we never go back on something we have added unless it no longer fits how the game evolves. Register: docs/LOCKED.md (area, decision, date, source). Process: design sheet/spec -> Matt approves -> record in docs/LOCKED.md -> build exactly that. A locked item is reopened only if (a) a later decision conflicts with it or (b) Matt says so; record the reason in the Reopened list. Bugs (behaviour that contradicts the locked design) are fixed freely; design changes need Matt's explicit reopen. Before proposing anything, check docs/LOCKED.md for conflicts.

## Standing rule: research, review, then build (set by Matt)
Everything going forward is researched and reviewed BEFORE it is built, to make sure it is the best fit and makes sense. Process for every chunk, scaled to its size (token rule still applies):
1. RESEARCH: how do comparable games handle it, what are the options, what are the risks (sources, labelled OFFICIAL/COMMUNITY/OPINION). Small chunks: a quick check of existing docs/research first; big or new areas: a research file.
2. DESIGN: state the choice, alternatives considered, why this one, and the fit check (look/identity) and mechanical-sense check (locked design, balance, player readability).
3. REVIEW: a second look before building: for anything medium or big, an independent reviewer (fresh agent or the strongest model) critiques the design/research for gaps, risks and better options; Matt sees the summary and decides.
4. BUILD in small chunks, then verify (tests, numbers, screenshots, security + fit check), then Matt playtests/reviews.
Trivial or reversible changes (typo, colour tweak, data tuning) need only a one-line rationale. Never skip steps for big things (new mechanics, art direction, content systems, hosting, anything touching saves or security).

## Standing rule: keep Matt focused (asked by Matt)
Matt sometimes runs away with ideas and loses track of what matters next. Claude acts as focus keeper:
- Keep a single NOW / NEXT / LATER list at the top of docs/QUEUE.md. NOW is one small chunk.
- When Matt raises a new idea or tangent, say so kindly in one line, put it in the parking lot (docs/QUEUE.md), and steer back to NOW unless it truly blocks NOW or is urgent/security.
- End substantive replies with: Right now: <chunk>. Next: <chunk>. (Parked: <idea> if any.)
- If several things are open, name the ONE most important next step and why; do not offer a menu of many.
- Be honest if an idea would delay the launch or add scope; recommend, but Matt decides.

## Standing rule: fix the weak spots (set by Matt, 2026-10-16)
Every chunk ends with its honest weak-spot list. By default FIX the fixable weak spots before presenting the chunk (same chunk or an immediate small follow-up), not just list them. Only leave one open if it needs Matt (real-phone test, design/taste call with a recommendation, a locked decision, or a different chunk owns it); say which and why. Do not ship a chunk and ask Matt whether to fix its known flaws.

## Standing rule: new content = three options, Matt picks (set by Matt, 2026-10-16)
Whenever new gameplay content is added (weapon, evolution, hero, ability, enemy, boss, status effect, power-up, tree node group), design THREE genuinely different options for each piece, recommended first, with plain-words fantasy/verb, how it looks and sounds, estimated numbers, fit with the weapon/hero stats and recipe pairs, risks. Present as one-tap questions (max 3 per batch, one weapon or hero at a time), Matt picks, record each pick in docs/LOCKED.md, then build in small chunks. Keep every piece consistent with its siblings (same counts per weapon, distinct verbs, different recipe pairs).

## Standing rule: small chunks, never get ahead (set by Matt)
Work in small, manageable chunks, one at a time. Do not get ahead of Matt.
- One chunk = one small, clearly described piece with a visible result and a done-check (tests green, screenshot/numbers, security + fit check). State the chunk before starting; finish and show it before starting the next.
- Never start the next chunk, a new phase or a new direction without Matt's go-ahead. New ideas go to docs/QUEUE.md, not straight into building.
- Max 1-2 agents at once, on separate files; no new agents while Matt has unreviewed results waiting.
- Ask Matt for at most 3 decisions at a time, each with a recommendation; keep messages short.
- After each chunk: summarise in a few bullets, show what changed, say what the next small chunk would be, and wait.

## Standing rule: everything must fit the game (set by Matt)
Whatever is added or designed (feature, creature, weapon, evolution, UI, effect, sound, asset, story) must (1) fit Hollowlight's look and identity (docs/IDENTITY.md, docs/BIBLE.md, the chosen art direction, role colours, restraint) and (2) make mechanical sense inside the game (consistent with the locked design, the sim rules, the summoner fantasy, balance targets, and how the player reads and understands it). Before building anything new, state in one line how it fits the look and why it makes mechanical sense; if it does not clearly fit, do not add it and raise it with Matt. Generic or off-style assets and mechanics that do not belong are rejected even if they are free or easy. Check this in every review and end each task with a one-line "Fit check" next to the "Security check".

## Standing rule: token conservation (set by Matt)
Use the cheapest model/effort that does the job well; save the most powerful model for work that truly needs it.
- Agents: set `model` explicitly. haiku = file lookups, formatting, simple edits, running scripts and reporting. sonnet = research, routine coding, tests, balance sweeps. opus (or stronger) only for hard architecture/design decisions, tricky bugs, or security-critical review.
- Keep the main chat light: delegate long or bulky work to agents, read only the parts of files needed, avoid re-reading files, keep replies and agent briefs short, cap agent report length.
- Do not spawn agents for quick lookups; do not run overlapping agents on the same files; reuse an agent via SendMessage rather than starting a new one when context matters.
- Prefer deterministic scripts (sweep/bot/tests) over repeated model reasoning; batch tool calls.
- Never trade away the security rule below to save tokens.

## Standing rule: security first (set by Matt, applies to everything)
Every change, dependency, asset, workflow and deploy gets a security check and is made as safe as possible before it is shipped. Minimum, each time:
- Dependencies: add as few as possible; check each is well-known and maintained; run `npm audit` and report results; never `npm audit fix --force` blindly (test upgrades on `dev` branch).
- Assets/downloads: only well-known sources (Kenney, OpenGameArt, itch.io CC0); verify licence; treat downloads as untrusted; record in a CREDITS file.
- Secrets: never put passwords/keys/tokens in code, commits, docs or chat. Ask Matt to do any account/security-setting change himself (e.g. 2FA).
- Saves/imports and any URL params: treat as untrusted input; validate and sanitise before use; never inject into the DOM with innerHTML from untrusted data; add tests.
- GitHub: work on `dev` branch and merge via PR; `main` is protected and is the live site. Workflow permissions stay minimal; pin/verify action versions; secret scanning, push protection and Dependabot stay on.
- Outward-facing/irreversible actions (publish, push to main, settings, deletes) need Matt's explicit yes first.
- End each task with a short "Security check" line: what was checked and any findings.

## Stack and layout
Phaser 3 + Vite, vanilla JS, ES modules. Single-file build (vite-plugin-singlefile -> dist/index.html).
- `src/sim/` pure-JS simulation (no Phaser/DOM): `Sim.js`, `weapons.js`, `cards.js`, `rng.js`, `grid.js`. Seeded RNG (mulberry32). Unit/bot-testable in Node.
- `src/data/*.json` all content (balance, weapons, evolutions, characters, enemies, chapters). New content = data first.
- `src/scenes/RunScene.js` Phaser rendering only (placeholder generated textures, pooled sprites). `src/ui/ui.js` DOM overlay (HUD, cards, menus). `src/app.js` glue. `src/main.js` boot.
- `tests/*.test.mjs` (`npm test`, 48 tests). `scripts/bot.mjs` headless balance probe: `node scripts/bot.mjs wren 8` (`FOCUS=1` for a focused-pick bot). Prints first-evolution time.
- Commands: `npm install`, `npm run dev`, `npm run build`, `npm test`.
- View is 640x360 logical, Phaser FIT scaling, pixelArt. World 4000x4000. DOM HUD scales by container query.
- URL debug params: `?auto=wren&seed=1&t=540&god=1&rr=3&ban=3&grant=ghost_wolves:speed=5,power=5:phantom_stampede&debug=1`.
- Hooks already present for the future skill tree: `sim.mods = {damage, area, cooldown, speed, pickup, xp, gold, abilityCd}`, `meta.rerolls/banishes`.

## Locked design
- Platform: web, keyboard first (WASD/arrows, Space ability, Esc pause, 1-4 pick, R reroll). Touch later. ART STYLE (LOCKED by Matt 2026-10-14): polished chunky 2D cartoon, mood P1 WARM LANTERN (cosy golden cream-amber spirit light on a cool grey-blue Hollow; see docs/mockups/cartoon-polished/). Art is created by code (Claude-written SVG-style textures) and/or AI tools, at 2-4x resolution with native-res rendering, Moonlit-Glass-style DOM UI reworked to the Warm Lantern look (lantern-flame HP, moon-arc timer, spirit-thread XP). STYLE RECIPE: HOLLOWLIGHT STYLE v1 (Matt, 2026-10-14) = mix of S1 Storybook Glow + S5 Heroic Cartoon: LINE L2 (tinted outline, a darker shade of each fill) + SHADE H2 (soft gradient with rim light) + PROPORTIONS P1 (chibi: big head, small and round, cosy and appealing) + WORLD W2 (richly textured painted ground with grass/flower detail) + LIGHT G1 lantern pool plus long glowing trails behind lantern, scarf and spirits (from G2). Mood P1 Warm Lantern. See docs/mockups/style-lab/. 3D is PARKED (spike-3d branch kept; real 3D was richer but generic and too heavy). Pixel art is rejected. Must feel premium and make people say wow 15-minute runs.
- Currencies: gold (spent on tree) and soul shards (from bosses). Tree is shown greyed-out with unlock conditions (kill counts, chapter clears, hidden nodes). Versioned saves. 
- IDENTITY (Matt approved 2026-10-14, see docs/IDENTITY.md): "The Hollow" - world starts drained/grey; spirits restore colour and leave luminous trails; enemies spread corruption; powered by one low-res life-map texture; visual only unless Matt approves a gameplay link. Art family: polished 2D cartoon, P1 Warm Lantern (3D parked).
- CHARACTER/ENEMY IDENTITY (Matt, 2026-10-14): every playable character and every enemy type has its own unique, instantly recognisable design (silhouette, colour accent, shape language, animation personality), not recolours of one generic sprite; author each creature as its own data-driven vector definition. Whole-game art must have ONE strong identity, restrained (few colours/effects), not generic dark-fantasy.
- META-PROGRESSION PRINCIPLE (Matt, from his reference game Spirit Hunters): the skill tree must give a sense of accomplishment and make the player want to explore: new skills unlock as you go, and different nodes are unlocked by killing different enemies, playing different stages, trying different builds/heroes. Big pannable node web, nodes light up, branch choices matter, locked nodes show progress toward their unlock.
- ASSET PRODUCTION (Matt, 2026-10-14): zero budget and NO hiring artists. All art/audio/models must be created by programs (code-drawn/procedural, Claude-written) or AI tools, or come from verified CC0/free licences. PC: Windows 11, RTX 3060, 16GB RAM, ~45GB free disk. Any AI-generated asset needs licence/provenance checks, consistency review, and fit-the-game review; never prompt for a living artist's style or copy another game's art.
- PROGRESSION DIRECTION (Matt, 2026-10-14; supersedes stat-heavy tree): power comes from unlocking OPTIONS (new weapons, evolutions, abilities, heroes) gated behind conditions, so the game gets easier as the toolkit grows and players replay to try new things; stat nodes are small (~1-3%) with a global soft cap so the tree can grow huge without breaking balance. APPROVED by Matt 2026-10-14: docs/design/progression-gates-v1.md. Run 1 pool = Ghost Wolves + Holy Orbit + 2 evolutions; Ravens, Spirit Bolts, Chain Lightning and 9 evolutions are tree gates; evolutions also need the tree unlock (recipe stays hidden); base difficulty to be raised via enemy hp scaling so a no-tree player wins ~15-20%; first launch heroes Wren + Elias (others unlock later). Overrides the older locked lines that all weapons/evolutions are available from the start. NOT BUILT YET (build chunk G1 queued after the Elias design, with research/review/tests first).
- ABILITY DESIGN PRINCIPLE (Matt, 2026-10-14; applies equally to weapons/summons, EVOLUTIONS, power-ups and tree unlocks): abilities, evolutions, powers and power-ups must be MEANINGFUL and fit who the character is (their story, personality, look and weapon), never game-breaking. Each ability has one clear verb you can feel, bounded power (limited uptime/cooldown, no runaway stacking, measured with the bot/ablation so it stays a modest share of total damage/survival), readable effects, and a thematic tie to the hero. Evolutions specifically: each changes the weapon's verb in a way that fits its spirit and the hero who uses it (not just bigger numbers), lands around 1.8-2.3x the maxed base measured in its HOME scenario (the situation it is built for; Matt approved 2026-10-15) with a hard cap of 3x and never below the base weapon at the same ranks in any scenario, has a readable look, and is checked against the weapon's real behaviour. Reject anything generic or overpowered.
- Weapons: **summons and magic only** (more types can be added later). 4 weapon slots, 4 stats per weapon x 5 ranks.
- V1 weapons: Ghost Wolves, Raven Flock, Spirit Bolts, Chain Lightning, Holy Orbit. 11 evolutions (see evolutions.json).
- Level-up: 3 random cards. New weapons while slots open + stat cards for owned weapons; only stat cards once slots are full; maxed stats leave the pool; fallback cards (heal/gold/xp) if empty. Weighted draw without replacement (weapon card weight 4, stat 1). Stat cards in an evolution pair get a hidden weight bump (x4 for a stat in an evolution pair, x3 more once the partner stat is rank 2+; values live in balance.json evoNudge).
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
