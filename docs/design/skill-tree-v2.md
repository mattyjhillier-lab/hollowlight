# Skill tree v2: "The Lantern Web" (design sheet #5) - LOCKED A / A / A (Matt, 2026-10-18)

Date 2026-10-18. Status: Matt locked option A for all three decisions (section 0) and added the EXTENSIBILITY requirement (LOCKED 2026-10-18 'SKILL TREE EXTENSIBILITY'); how the tree is added to later = Appendix C, folded into the build chunks (section 14). Gate counts 13-16 stay estimates until T5. Release gate item 3 (LOCKED 2026-10-17): structure v2 (per-weapon emblem constellations, three evolution sockets per weapon, gates for all 15 evolutions, status power nodes) + look, desktop and phone.
Research: docs/research/38-skill-trees.md (new) on top of files 19 and 22. Mock-ups: docs/mockups/skill-tree-v2/ (static HTML/SVG + PNG at 1280x720, 844x390@2x, 390x844@2x; `node build.mjs && node build-options.mjs && node shoot.mjs mock`; data and tables from `inventory.mjs` / `tables.mjs`, so every number below is reproducible). Diagnosis screenshots of the CURRENT tree: docs/mockups/skill-tree-v2/current/.

## 0. Decisions for Matt (max 3, recommended first)

| # | Decision | A (recommended) | B | C | Mock-up |
|---|---|---|---|---|---|
| 1 | Overall structure | **Lantern and five constellations**: hub lantern, two global rings (Hearth, Wick), five weapon emblems around them, keystones on an outer Dusk ring, fogged sky band for future chapters | Lantern tree (vertical): trunk from the heroes' roots to dawn, weapons are branches, evolutions blossom at the tips | The Hollow map: a painted map where each weapon is a landmark region you restore | st2-options-structure-desk.png |
| 2 | Node and emblem look | **Lantern stars on glowing thread**: brass-rimmed glass beads; a glowing thread traces the emblem; a soft emblem watermark fills with the spirit's colour as you buy | Stained-glass emblem (each node a pane) | Embroidered sampler (running stitch, French knots) | st2-options-emblem-desk.png |
| 3 | Evolution sockets and progress | **Wax-seal sockets at the emblem's meaningful points** (wolf eyes + nose etc.): sealed -> stirring (teal arc) -> ready (teal NEW) -> lit (gold wax seal) | Lantern door with three keyholes per weapon | Moon-phase sockets (no numbers) | st2-options-sockets-desk.png, st2-states-desk.png |

Defaults taken without asking (reversible, Matt may override): free respec stays; gates/sockets permanent (built); one-time "Regrowth" refund on the save migration (section 7); economy ~74k gold + 29 shards (section 10); `F` Find box; status and hero node CONTENTS are defaults here and go through the three-options pick as one small batch in chunk T6 (they are new "tree node groups", CLAUDE.md rule) before they are built.

## 1. Diagnosis of the current tree (v1 screen, real build, docs/mockups/skill-tree-v2/current/)

1. **No weapon identity.** Four branch wedges (Spirit/Summoner/Magic/Light); weapon nodes are scattered inside them; the 16 gate nodes were dropped wherever there was room (Wall of Wings sits under Spirit, Spirit Tempest next to Light, Talon Mark below Summoner). Nothing says "this is the wolf's part of the tree".
2. **Labels collide** (Warm Embers / Spirit Tempest / The Alpha / Lightfoot Pack overlap at the hub; "GATE" text inside circles; branch names under nodes).
3. **Generic look**: plain dark-blue rounded buttons and flat circles, not the locked Lantern Glass, Lit kit (brass band, cool glass lit warm, thread, wick, wax seal, NEW flag). The U8 tree re-skin has not happened.
4. **Phone landscape: the detail panel takes ~55% of the height and the Buy button is cut off** (current-tree-selected-844x390.png): a real usability bug that v2 fixes with a side sheet.
5. **Locked nodes read as noise**: dozens of identical grey rings with no grouping; progress rings exist but are tiny.
6. **Power**: the v1 tree is 41.4 combat PE vs the locked ~15 (15.5 limit) because the G2 rescale + soft cap were folded into this redesign; the full tree still trivialises Chapter 1 (bot 96-100%).

## 2. Locked constraints this design must keep (conflict check done against docs/LOCKED.md)

- Skill tree v2 row (2026-10-15): per-weapon clusters (emblem constellations), global rings, evolutions inside weapon clusters, locked clusters dim until unlocked. **Kept exactly.**
- Meta-progression principle: big pannable web, nodes light up, locked nodes show progress, unlocks from different enemies/stages/builds/heroes. **Kept** (option B would weaken it; flagged there).
- Progression direction + progression-gates-v1: power from options; stat nodes 1-3%; soft cap per category; combat PE ceiling ~15 (validator 15.5) + sustain 5; gates permanent; recipes hidden; run 1 = Wolves + Orbit + Howling Legion + Sanctum Halo. **Kept**; every knot is 1-3%, the soft cap is applied in `aggregateMods`.
- Evolution count: 3 per weapon, 15 total; the 4 third evolutions are LATE gates (13-16); no-tree players see no gold card/nudge for them; tree shows 3 sockets per weapon. **Kept.**
- Status rules (evolutions-second-review 5.1): one shared Status category, cap 8%, weight 0.15 (1.2 PE at cap), nodes per status not per weapon, appear only once a source is unlocked, prefer duration/visual nodes; control-duration nodes 0.3 sustain PE each; Burn never from Candle Wheel; product of temporary amps <= x1.75. **Kept**; Mark/Pin get +duration nodes, Bleed/Burn get potency nodes.
- UI identity round 2: Lantern Glass, Lit; gold only for evolutions/dawn; teal NEW; wax-seal EVOLVE; leadlight border ONLY on evolution cards + dawn screen (this is why option 2B conflicts); Fondamento ("Hollowlight Chancery") + Alegreya Sans; no backdrop-filter; text >= 12-13 px; targets >= 44 px.
- V1 scope: no new weapons/summons in v1 (future emblem slots are a rule only; nothing shipped). Launch heroes Wren + Elias only.
- Hidden recipes: the tree never shows a recipe pair (the results screen/codex reveal it after the first take).
- Save safety: versioned saves, ids stable, sanitiser on every load/import, no innerHTML from data.
- No conflict found that needs a reopen with the recommended options. Option 2B would reopen the "leadlight only on evolution cards and dawn" line.

## 3. The recommended design (A / A / A) in one page

**Shape** (st2-overview-*.png). The hub lantern ("Hollowlight") sits in a warm pool. Ring 1 **Hearth** (r 150, 10 lanterns): the day-one buys (Reroll, Banish, small health/summon/magic, pickup, move, XP, first cooldown). Ring 2 **Wick** (r 300, 26 lanterns): verbs, ability, sustain, economy, tag damage, cast/area. Around them, at radius 600, the **five constellations** in a pentagon: Ghost Wolves (left, Wren's side), Raven Flock (upper left), Spirit Bolts (upper right), Chain Lightning (right), Holy Orbit (bottom, Elias). Summons on the left, magic on the right, the holy orbit under the hub. Between the Wick ring and each hero's signature constellation sits that hero's **hero lantern** (3 lanterns). Ring 3 **Dusk** (r 960, dashed): keystone pairs, revive and capstones. Beyond it a **fogged sky band** (r 1180): the three future-chapter teasers and, after v1, new constellations.

**A constellation** (st2-wolf-desk.png, st2-emblems-desk.png). 1 **heart** (the weapon gate; a starter weapon's heart is always lit) + **11 lanterns that trace the emblem** + **3 evolution sockets at its meaningful points**:

| Weapon | Emblem | Socket points (A / B / C) | Heart |
|---|---|---|---|
| Ghost Wolves | wolf head (ears up, ruff, jaw) | left eye Howling Legion (starter), right eye Lightfoot Pack, nose The Alpha | forehead, always lit |
| Raven Flock | raven with a raised wing | eye Talon Mark ("the eye that marks"), wing tip Wall of Wings, beak point Spearhead | breast = gt_raven_flock |
| Spirit Bolts | jagged bolt | top tip Spirit Tempest (burst), bottom tip Soul Lance (pierce), the turn Returning Pages | centre = gt_spirit_bolts |
| Chain Lightning | forked lightning | upper fork Thunder Judgment (from above), middle fork Static Storm (field), lower fork Storm Tether (held arcs) | trunk = gt_chain_lightning |
| Holy Orbit | ring of lights around a flame | lower light Sanctum Halo (starter), left light Judgement Wheel, right light Vesper Tide | centre flame, always lit |

Upgrade flow along the shape: from the heart the thread runs both ways round the emblem (wolf: ears -> cheeks -> ruff -> jaw, meeting at the chin mastery; orbit: round the ring), so the emblem "draws itself" as you buy; you can always see the next lantern on each side. Parent rule (real `requires`): the first lantern on each side of the heart requires the heart's gate node (gated weapons) or nothing (starter weapons: the display heart is drawn as its parent, the edge is not a hub edge); every next lantern requires the previous one on its side; the closing lantern (wolf chin, orbit ring close) uses `requiresAny` of its two neighbours. **Sockets never require knots** (gate nodes may only require other gates: compileTree rule kept), so an evolution is always reachable by its condition alone: options, not stats. "A socket of a sleeping weapon stays dormant" is a **UI-only state, not a `requires`**: gates keep `requires: []`, so a save that already owns Talon Mark without Raven Flock keeps it (the sanitiser would otherwise drop and refund a permanent gate; review finding 1). The gold card can never appear anyway because the weapon itself is not in the pool.

**Sibling sockets** (review finding 6): some conditions can only move after another evolution of the same weapon (Wall of Wings and Spearhead need Raven evolved, so Talon Mark first; Soul Lance and Returning Pages need Bolts evolved, so Spirit Tempest first; Thunder Judgment and Storm Tether need Chain evolved, so Static Storm first). The panel says so in plain words ("Needs one of this spirit's other evolutions woken first") and the map draws a faint gold tether from the socket that opens it; the pace table (section 9) includes the prerequisite.

**Zoom levels** (one view, three LODs; mock-ups show each): FAR (whole web: emblem watermarks + constellation names, nodes as small beads, tap a constellation to fly in), MID (one or two constellations, node shapes readable), NEAR (one constellation + names under nodes; the buying view). Find (`F`) pulses matching lanterns at every LOD (PoE pattern, file 38).

**Node ladder** (st2-states-desk.png): knot (stat 1-3%, drawn 14 px) < ring lantern (global, 16) < bead (verb/status/kin, 20, with a glyph: red drop = Bleed, lilac lick = Burn, violet chevron = Mark) < mastery (condition capstone, star, 24) < socket (wax seal, 32) < keystone (lantern flame, 30) < heart (weapon medallion with its HUD emblem, 40). Every hit area is >= 44 px whatever the drawn size.

**States**: can buy (brass rim, dark glass) / owned (lit in the spirit's role colour + glow; thread between two owned lanterns glows cream with a role-colour halo, like the in-game trails) / condition (teal arc = progress; number only in the panel) / dormant (cluster asleep: grey, dashed thread) / fog (future: dashed "?"). Sockets: sealed (lock, name "???" while progress is 0: locked hidden rule) -> stirring (name shown, teal arc fills) -> ready (condition met: teal glow + NEW flag) -> lit (gold wax seal with star; gold is the evolution colour). The recipe is never shown.

**Locked-cluster teaser** (st2-teaser-desk.png): grey emblem silhouette, dashed thread, locked lanterns with no names, sockets with a lock; the heart shows its one condition and a teal arc; panel copy "A spirit not yet woken". On waking: the thread draws itself round the emblem in 0.6 s and colour returns to the watermark (reduced motion: instant).

**Detail panel** (desktop right panel; phone landscape right side sheet; phone portrait bottom sheet with a grab handle): kicker (kind - weapon), name (display face), whisper line, effect with the big number, "To wake it" condition lines with numbers and bars and a pace hint ("About 6 more runs at your pace", from the player's own per-run averages), cost pill + primary button ("Light it" for lanterns, "Wake it" for hearts/sockets) with two-step confirm kept, "Permanent: kept on respec" for gates. Diminishing value shown as "+2% (now +0.6% after the cap)" for knots past their soft cap.

**Next lights board** (desktop top right; phones: one-line pill that expands): the closest 3-4 unlocks with bars (same `closestUnlocks` used by the results screen), so the player always has a goal. The camera opens on the next lantern you can afford (or the newest NEW).

## 4. Options in detail (why A each time)

### 4.1 Structure
- **A Lantern and five constellations (recommended)**: matches the locked v2 row word for word; weapon = place; grows outward (new chapter = new sky band, new weapon = new constellation on the band); phone works through LODs. Risk: wide canvas, mitigated by Next lights, Find and the far-zoom fly-in.
- **B Lantern tree (vertical)**: best one-thumb phone scrolling, clearest order, but it is a list with branches, not a web; emblems become branches; 500 nodes = very long scroll. Weakens the locked meta-progression principle ("big pannable web").
- **C The Hollow map**: strongest identity (colour returns on a painted map), but 2-3x the art and build, emblems are lost in terrain, and it collides with the front-door map select (sheet #6).

### 4.2 Node and emblem look
- **A Lantern stars on glowing thread (recommended)**: the locked kit language (brass, glass, wick, thread, wax seal, teal NEW) on the in-game trail glow; cheap to draw (circles, lines, one blurred watermark per cluster); any future emblem is just 11 points + a silhouette path. Weak spot: the emblem is implied by the thread, so the watermark carries the read at far zoom (the raven and the chain read weakest; see weak spots).
- **B Stained-glass emblem**: biggest wow, but needs a reopen (leadlight is reserved for evolution cards and the dawn screen), panes are irregular tap targets and every new weapon needs a hand-cut window.
- **C Embroidered sampler**: warm and handmade, but low contrast on phones, a new material outside the kit, and gold stitches break the gold-only-for-evolutions rule.

### 4.3 Evolution sockets
- **A Wax-seal sockets at the emblem's points (recommended)**: the story is in the picture (the wolf opens its eyes), uses the locked wax-seal and NEW flag, exact progress lives in the panel. Weak spot: three 32 px sockets inside a small emblem at phone zoom (solved by 44 px hit areas and names on select).
- **B Lantern door with three keyholes**: very clear "three locks", but sockets leave the emblem and it adds a new object per weapon.
- **C Moon phases**: poetic, but imprecise and the moon already means the run timer in the HUD.

## 5. Node inventory (generated: docs/mockups/skill-tree-v2/tables.mjs)

v1 has 82 node ids (63 real + 3 teasers + 16 gates). v2 has **125 real nodes**: all 82 v1 ids kept + **43 new ids**, plus 4 display-only elements (the two starter hearts and the two starter-evolution sockets, which are not nodes and cannot be bought).

| Region | Nodes (buyable incl. gates) | of which NEW ids | kinds |
|---|---|---|---|
| Ghost Wolves constellation | 13 (+2 display) | 7 | socket 2, knot 7, bead 3, mastery 1 |
| Raven Flock constellation | 15 | 8 | heart 1, socket 3, knot 8, bead 2, mastery 1 |
| Spirit Bolts constellation | 15 | 8 | heart 1, socket 3, knot 8, bead 2, mastery 1 |
| Chain Lightning constellation | 15 | 8 | heart 1, socket 3, knot 8, bead 2, mastery 1 |
| Holy Orbit constellation | 13 (+2 display) | 8 | socket 2, knot 7, bead 3, mastery 1 |
| Hearth ring | 10 | 0 | ring |
| Wick ring | 26 | 0 | ring |
| Dusk ring | 9 | 0 | keystones (2 exclusive pairs), revive, capstones |
| Fog band | 3 | 0 | teasers (future chapters, never buyable) |
| Wren hero lantern | 3 | 2 | hero |
| Elias hero lantern | 3 | 2 | hero |
| **Total** | **125** | **43** | |

Per constellation (same template for every weapon, siblings consistent): heart 1, sockets 3, knots 6-8 (the weapon's non-count stats; **no Pack size / Flock size / Bolt count / Orb count nodes**, because flat spirit counts were measured as the strongest effect in v1), 1-2 status beads where the weapon owns a status (wolves Bleed, orbit Burn, ravens Mark), 1 kin bead (a "play it differently" condition: hunt the right enemy, play the hero, beat the boss), 1 mastery (condition-gated capstone, +1%/+1% and 1 shard). Bolts and Chain own no status, so their beads are their flat verbs (Pierce +1, Chains +1: existing v1 nodes).

Status power nodes (release gate): **Bleed** Deep Bite (wf_bleed) + Red Thread (wf_rend, slay 2500 wolves); **Burn** Kindling (or_kindle) + Votive Embers (or_ember, evolve Holy Orbit 3 times); **Mark** Raven's Eye (rv_eye, Mark +0.5 s, slay 6000 crows). All three share the Status category (Mark's extra uptime is valued as +2% potency). Mark worked example (review finding 13): Mark is +15% damage taken for 3 s, refresh only; +0.5 s changes uptime, never the size of the amp, so Rally x Mark stays 1.5 x 1.15 = 1.725 <= the x1.75 cap; on a single target Talon Mark already re-dives within ~3 s, so the node mostly helps marks spread by base ravens (measured in T6 with mark.test). Pin and Fear get no node at launch: Pin is Rally's (boss-immune, ability-owned) and Fear is Wall of Wings'; the sustain budget is full (section 8). Each status node appears only once its source is unlocked (it lives inside that source's constellation, so it is dormant until then).

Hero lanterns (PROVISIONAL defaults, three-options batch in T6): Wren = Orphan's Instinct (ch_wren), Firm Grip (Rally the Pack lasts +0.5 s: ability duration, utility; pins still never hold bosses), Kindred Sparks (visual only: kill sparks join the pack; the BIBLE lock already mentions this as a possible Wren-only node). Elias = Votive Flame (ch_elias), Wide Wheel (Candle Wheel ring +8% wider, still no Burn, W3 lock), Grave-Lamp (visual only). Conditions: play 3 / 6 / 10 runs as that hero.

The full id-by-id table (every v1 id and every new id, its v2 place, effect, cost and condition) is Appendix A.

## 6. Data and code changes (for the build chunks; design level)

`tree.json` version 2 (validated by `compileTree`, all additive, v1 fields still accepted):
- `clusters`: `{ <weaponId>: { emblem, ang, heart: <gate id>|null, starterEvo, sockets: { a|b|c: {evo, gate|null, at:[x,y]} }, slots: {...}, outline:[...], silhouette:<path> } }`. Validated: weapon exists, every socket evolution belongs to that weapon, exactly 3 sockets, every evolution of the weapon appears once, outline slots unique, path string length-capped and charset-checked `[MLCQAZ0-9 .,-]` (no data reaches the DOM except via `setAttribute('d')` on our own element).
- Node `place`: `{cluster, slot}` | `{ring, i}` | `{hero, i}` | legacy `{ring, ang}` (polar, kept for old data). Positions are computed, never typed as raw x/y.
- `requiresAny` (new, max 4): the chin/closing lantern of an emblem can be reached from either side. It touches more than the sanitiser (review finding 7): cycle detection and topological order, `gateAnc` (a node targeting a gated weapon must have its gate on EVERY alternative path, else compile fails), `nodeStatus`/`describeNode` (locked text names the missing side), `pathToHub` (shortest owned route), `edges`/`children`, and `sanitizeTree` ("at least one owned"). T1 test: a `requiresAny` branch that skips the gate must fail compile.
- `branch` for cluster nodes = the weapon's tag branch (`summoner`/`magic`) so v1 validation and colours keep working; ring nodes keep their v1 branch; `ring`/`ang` become optional when `place` is given.
- Soft-cap categories are assigned per EFFECT, not per resulting stat (review finding 2): every effect maps to one category (`dmg`, `tagS`, `tagM`, `wpn:<id>` = all of that weapon's own stat nodes summed across stats, `cast`, `area`, `hp`, `heal`, `status`); tag effects (@summon/@magic) stay in the tag categories even though they land in `weaponBonus`. One cap per weapon, never one per stat. T3 test: buy every node, assert combat PE-at-cap <= 15.5 and that each `weaponBonus[wid]` total <= its cap.
- Effects (new kinds, each validated with ranges): `{status:'bleed'|'burn', pct}` (Status category), `{status:'mark'|'pin', secs}` (0.1-1 s), `{ability:'wheelRadius', pct}`, `{visual:'kinSparks'|'graveLamp'}` (render only, no sim effect).
- `aggregateMods` applies the **soft cap** per category (`total = C(1 - e^(-S/C))`, negatives pass through; one function, one test), and exposes per-node "now worth" for the panel.
- `compileTree` gains the PE validator: fail if combat PE-at-cap > 15.5, sustain > 5, any knot face > 3%, reroll/banish > 3 each, revive > 1 at <= 20%, or a constellation does not have exactly 1 heart + 3 sockets + the outline count.
- Sim: status potency multipliers on the existing Rend/Burn code paths (counters exist: `dotBy`, `bleedTot`), Mark/Pin duration adds (inside the x1.75 amp cap and the boss-immunity rule), Candle Wheel radius. Tree-less runs must stay byte-identical (sweep check).

## 7. Save migration (ids stay; nothing is lost)

- **Every v1 id is kept** (Appendix A), so `save.tree`, `save.seen`, gate permanence and import/export keep working. No id is renamed or reused with a different meaning.
- `SAVE_VERSION` 2 -> 3, migration `2 -> 3` ("Regrowth"): permanent gate nodes are kept as they are; every other owned node is refunded at its **v1 price** (computed from a frozen copy of the v1 cost table inside the migration, never from save data) and cleared; a one-time notice on the tree screen says "The web has regrown. Your gold is returned." Reason: effects and prices change for most kept ids (for example Fang Sharpening +6% -> +2%), so keeping them owned would silently change what the player paid for. Nothing is public yet, so only Matt's dev saves are affected.
- `requires` change shape in v2 (thread chains inside constellations), but the Regrowth refund clears every non-permanent node first, so no owned node is ever dropped by a new `requires`. Gate nodes keep `requires: []` (dormant sockets are UI only, section 3), so no permanent gate can be dropped or refunded by the sanitiser; a v1 save that owns Talon Mark before Raven Flock keeps it and the panel says "wake the spirit to use it". T2 test: Talon Mark owned, no heart -> still owned after load.
- Migration details (review finding 14): the frozen v1 price table includes `rankCost` and ranks (rv_wide, or_wide are maxRank 2) and shards (sp_cd4, keystones, li_last, li_elder, sp_mastery, ma_pow3, cl_storm); gold/shards clamp at 1e12; the refund runs BEFORE `sanitizeTree` and only when `version < 3` (idempotent); `save.seen` keeps only ids that still exist; re-importing an old v2 export refunds it again, which is harmless (the old export's tree is replaced, gold can never exceed what those nodes cost).
- New bounded save field `stats.recentRuns` (last 10 runs: kills by enemy, evolutions, boss kill, clear; numbers clamped, keys whitelisted) feeds the "about N more runs at your pace" hint (review finding 9); empty for old saves (hint hidden until 3 runs exist).
- Tests (T1/T2): migration from a real v2 fixture (owned nodes + gates + seen), refund equals the frozen v1 prices incl. ranks and shards, gates kept, hostile values clamped, idempotency, import of a v2 save into v3 code, round trip export/import, `sanitizeTree` with `requiresAny`, `recentRuns` sanitising.

### 7b. How saves migrate (BUILT in T2, 2026-10-18; code: src/save/schema.js, src/meta/migrations/, src/meta/treecodec.js)

**Two version numbers.** `save.version` is the envelope (now 3). The skill tree has its own content version (`core.json` `version`, now 3; compact saves store it as `tree.v`). A step exists only when an EXISTING id changes effect, price, ranks or is retired. New clusters, heroes, chapters and ring nodes are additive: nobody owns the new ids, so they need no step (tested by adding a whole fixture cluster to a v3 save with no loss).

**What a save looks like on disk (v3).** In memory the game still holds `tree = { id: rank }` and `seen = { id: true }` (the UI and sim read those). On disk (`serializeSave`, used by the autosave, the backup and Export) they are compact:

```
tree: { v: 3, o: { <fragment key>: "<base64url bitset by idx>" }, r: { <id>: rank } }   // r only for ranks above 1
seen: { o: { <fragment key>: "<base64url bitset>" } }
notes: { regrowth: { gold, shards, nodes } }      // one-time notice for the tree screen (T4 shows then clears it)
stats.recentRuns: last 10 runs { t, k, e, b, c }  // feeds "about N more runs at your pace"
```
A fragment key is the fragment's short prefix (`core`, `wf`, `rv`, `bo`, `cl`, `or`, `wr`, `el`); bit `idx` of its bitset is the node with that permanent `idx`. 2000 nodes all owned = about 1.6 KB (tree) + 1.6 KB (seen).

**Load order (parseSave).** size cap (200 KB) -> JSON.parse -> envelope version check (newer than the game = refuse, code `future`) -> envelope migrations in order (1 -> 2 resets the placeholder tree; 2 -> 3 is the Regrowth) -> if the save is v3 and its `tree.v` is below the data's `core.version`, run the registered tree steps above it (`TREE_STEPS`, one frozen price table per step) -> `sanitize` (decode compact maps, then `sanitizeTree`: unknown ids, bad ranks, broken prerequisites and rivals are dropped; **unlock conditions are NOT re-checked for owned nodes** (see below)).

**A save from a NEWER version is read-only (review H1, fixed).** `SaveStore.load()` treats code `future` (newer envelope or newer `tree.v`) in main or the backup as a lock: `readOnly = true`, the stored text is kept byte for byte, `saveNow`, reset and import write nothing for the whole session, the title screen shows "This save is from a newer version of Hollowlight: it is kept safe and untouched. Update the game to continue...", and Settings > Export still hands over the kept file. The same lock engages if a newer build writes the save mid-session. Rule for deploys: never roll `main` back across a `SAVE_VERSION` bump; the forward-tolerant store (this lock) must be in the v1 release before any further save-version change (docs/LAUNCH-CHECKLIST.md).

**A damaged save is quarantined (M2, fixed).** The damaged text is copied to `hollowlight:save:damaged` (one slot, only replaced by a newer damaged copy, never written by `saveNow`), the title screen shows the note once, and Export returns the damaged text until real progress is banked. **Two tabs (L8, fixed):** `saveNow` compares the stored `updatedAt` with the stamp this tab last read or wrote; a newer stored copy means another tab saved, so this tab adopts it (with a note) instead of overwriting it. **No tree data registered (L7):** `saveNow` refuses to write, so a boot-order change can never write an empty tree.

**The Regrowth (envelope 2 -> 3, tree step 3).** Runs once, before sanitising, only for saves with `version < 3`. For each id in the FROZEN v1 table (`src/meta/migrations/tree-v3.prices.js`, a deep-frozen copy of the 82 shipped prices with `maxRank`, `rankCost`, shards, a `p` flag for the 16 permanent gate nodes and a `t` flag for the 3 teasers): a permanent gate node stays owned at rank 1 and refunds nothing; every other owned node is cleared and refunded `sum over ranks 1..rank of max(10, round(gold x rankCost^(k-1) / 10) x 10)` gold and `shards x rank` shards, ranks clamped to the old `maxRank`; teasers and unknown ids are dropped. Gold and shards are clamped at 1e12. The table is never read from live data or from the save, so rescaling the live tree later can never change what was refunded. Idempotent: a second pass over its own output refunds nothing, and a version-3 save never enters it. A forged low `tree.v` in a v3 save is clamped up to 3, so it can never replay the refund. Importing an old v2 export into the new game refunds it again (harmless: it replaces the tree, and gold can never exceed what those nodes cost).

**Gates are never dropped (M1, fixed).** Gate nodes keep `requires: []`, so no new prerequisite can orphan them, and the sanitiser no longer re-checks unlock conditions for OWNED nodes: conditions gate BUYING (`canBuy` / `nodeStatus`), never owning. A later change that makes a condition stricter, or a stat that regresses, can no longer silently delete a paid node or a weapon unlock (hostile imports gain nothing: stats are forgeable offline anyway). Graph rules (requires, rivals, teasers, inert ids) still apply.

**Links gate buying only (T3c, 2026-10-21, connected-unlock rule).** The sanitiser no longer drops an owned node for a missing parent either: a lantern is buyable when it is linked (either direction) to ANY owned lantern and its condition is met (tree.js `isLinked`, four exceptions: hearts are hub challenges, a gated constellation waits for its heart, starter constellations count as lit, far groups hang from a gold-only bridge), so a data re-link can never delete a paid node. Still dropped: unknown / inert / teaser ids, rivals, and a node whose weapon/evolution GATE is not owned (full refund, rising price included). RISING PRICE: `save.creep = {id: steps}` (additive field, no version bump; old saves have none = base prices = what they paid) stores the group purchases made before a lantern was first bought; price = base x 1.08^steps (core.price.creep), later ranks use the same step, respec and gate-drop refunds pay back exactly what was paid; sanitize keeps only owned rising-price ids and clamps steps to the purchases still owned in the group, so a forged value can never refund more than was legally payable. A future tree migration step that refunds nodes must add their steps the same way.

**Retired ids are TOMBSTONES (H2, fixed).** `core.retired` holds `{id, frag, idx}`. The id AND its (fragment, idx) slot are permanent: `composeTree` rejects a new node on a retired slot, `compileTree` keeps the tombstone in `frags` (never in `nodes`), and `tests/treedata.test.mjs` fails if any shipped or retired slot is reassigned. Migration steps receive a RAW decode (`decodeTreeRaw`): retired and not-yet-live ids are visible and ranks are bounded only by the schema maximum (10), so a step can refund a node the current data no longer has or whose `maxRank` was cut. `sanitize` clamps afterwards as before.

**Release policy (H3, guarded).** Nothing is released on save v3 yet (main is still v2), so T2 and T3 ship TOGETHER in v1 and T3 may still change prices before then. At the v1 launch merge run `node scripts/tree-release.mjs --snapshot`: it records a fingerprint of every live id (price, ranks, requires, excludes, unlock, effects) in `tests/fixtures/tree-released.json`. From then on `tests/treerelease.test.mjs` fails if any released id changes price, effect, requires or max rank at the same `core.version`, if a released id vanishes without a tombstone, or if the version is bumped without a registered migration step. So after release every such change REQUIRES a version bump + a step with its own frozen price table.

**Hostile input.** (Stat maps are capped at 128 enemy keys and 32 per other map; a valid key beyond the cap is counted in `SANITIZE_WARNINGS.capped`, never silently lost. The regrowth notice is written only when something was refunded.) Compact maps never contribute ids: the decoder maps bit positions to ids from the compiled tree, ignores unknown fragment keys, bits above a fragment's last `idx`, non-string / non-base64url / over-long bitsets and ranks without a set bit, clamps ranks to `maxRank`, and caps the number of keys it looks at (4096). Every other new field is whitelisted and clamped (`notes`, `stats.recentRuns`).

**Adding content later.** Add a fragment file (see Appendix C); if you change the effect, price or rank count of an owned id or retire one, bump `core.version`, add `src/meta/migrations/tree-vN.js` with its own frozen price table, register it in `TREE_STEPS`, add a fixture and the tests listed in C.8.

### 7c. The rescale is LIVE (BUILT in T3a / T3b, 2026-10-18; code: src/meta/treedata.js, tree.js, treebudget.js; tests: tests/t3.test.mjs, t3b.test.mjs, treedata.test.mjs)

- **The live tree IS the v2 tree.** The fragments hold the v2 values directly (the old `v2` blocks, `inert`, `ord`, `ring`/`ang` were folded in by `scripts/review/t3-fold.mjs`); `composeTree().live` = every node not marked `inert`, `.v2` = live + the pending (inert) tool nodes, used by the budget and layout checks. A node marked `inert: true` is validated data whose sim hook is not built yet: never buyable, aggregated, shown or accepted from a save.
- **Golden test.** `tests/fixtures/tree-v2-rescale.json` pins every one of the 125 Appendix A ids (effects, prices, ranks, requires, conditions); the test also counts the change set against the shipped v1 fixture: **47 effects, 26 prices, 14 requires, 2 max-rank cuts (Watch, Wide Wheel 2 -> 1)** exactly as specified. Four existing ids were changed again by the tool-cluster build (li_reach, li_scav, li_hearts, li_magnet) and are pinned in `tests/fixtures/tree-t3b-moved.json`. No v1 id was retired, so no tombstones were needed.
- **Version policy.** `core.version` stays 3: nothing is released on save v3, so T2 + T3 + the tier data ship together inside v3 (save-v3-review H3). From the launch snapshot onwards every change to a released id needs a version bump plus a migration step.
- **Soft cap.** `aggregateMods` applies `total = C(1 - e^(-S/C))` per budget category (dmg 2.5, summon tag 5, magic tag 5, cast 3, area 4, max health 6, level-up heal 1.5, status 8 shared by Bleed / Burn / Mark, lore 2, choice 1; one pool of 7 per weapon for all of that weapon's own stat nodes). Negatives (keystone costs) and flat adds (Pierce, Chains) pass through unscaled; tier-scoped nodes sit on top of the caps. Categories come from `treebudget.effectTerms`, the same function the budget uses, so the game and the budget cannot disagree. `aggregateMods(...).softcap` reports S, C, total and factor per category ("now worth" for the screen).
- **Budget after the DT0 trims: combat PE-at-cap 15.18 of 15.5, sustain 5.00 of 5.0** (rule: `src/data/tree/core.json` budget; snapshot-tested). The status nodes (Bleed, Burn, Mark seconds), Firm Grip (+0.5 s Rally), Wide Wheel (+8% Candle Wheel radius) and the two visual-only lanterns are live and read by the sim (`tfx.bleedMul / burnMul / markAdd / rallyAdd / wheelMul`; all 1 / 0 when absent, so tree-less runs are unchanged).
- **Blessings.** `blessings.json` `combined` caps (pickup 1.45, gold 1.40, speed 1.08, max HP 1.18, damage 1.09): tree multiplier x Blessing multiplier is clamped at read time, and a Blessing whose effect is at its combined cap leaves the card pool.
- **Tool clusters (T3b, layout L-A).** `src/data/tree/tools/{satchel,cardfan,almanac,hearthkey,nightgate}.json` on the far slots far4 / far10 / far6 / far2 / far8; the eleven moved ids keep their core id and idx (`place: {tool, at}`). **Live now:** Wider Lantern (4 ranks +4% pickup), Scavenger, Eager Gems (gem pull +15% x3), Lantern Call (gems fly on level-up), Kinder Hearts (hearts +3% and 5 s sooner), Mending Light, Lodestar (2 ranks, +12.5% and 3 s sooner each), Gleaner, the four reroll / banish lanterns, Steady Hand, Last Light. **Inert (data + tests only):** Louder Stirring, Second Sight, Hunter's Eye, Lantern Compass, Favoured Spirit, Fourth Card, Chosen Moment, Kindred Start, Lantern Blessing, Fifth Hook, the Night Gate (Deep Dusk gate, Long Night gate, Dawnward / Night Vigil pair, Three Dawns) and the 13 Almanac lanterns (only for enemies that exist today: Fell Wolf, Grave Crow, Root Crawler, Elder Treant; the Husk and Grey Alpha trios are additive later).

### 7d. The combat ceiling is raised x2 (BUILT 2026-10-20 on Matt's option A; LOCKED row 'TREE POWER CEILING REOPENED')

**The rule (use it for every future growth step).** One scale factor k multiplies every COMBAT allowance and nothing else: `base.combat`, every `categories[*].cap`, `perWeapon.cap`, `perChapter.combat`, every `perTier[*].combat` (and the `pe` estimates of the tier-scoped nodes that pay from it) and `knotMax`. Weights, sustain (revive 4.0, rerolls/banishes 0.1, hearts) and the utility caps are NOT scaled. Faces on nodes stay as authored (the soft cap C(1 - e^(-S/C)) does the work: the larger C is, the less of S the cap throws away). k = 2 was applied to the Lever-1 numbers (which already loaned the lore/choice reserve to the live caps):

| Rule field | Before (T3 / DT0) | Lever 1 | Now (k = 2 on Lever 1) |
|---|---|---|---|
| base.combat ceiling | 15.5 | 15.5 | **31** |
| combat PE at cap (sum of C x w) | 15.18 | 15.18 | **30.36** |
| dmg / tagS / tagM / cast / area / hp / heal / status caps | 2.5 / 5 / 5 / 3 / 4 / 6 / 1.5 / 8 | 2.7 / 6.4 / 6.4 / 3.6 / 4 / 6 / 1.5 / 8 | **5.4 / 12.8 / 12.8 / 7.2 / 8 / 12 / 3 / 16** |
| per-weapon pool cap (weight 0.08 x 5/W) | 7 | 8.6 | **17.2** (6.88 PE at cap for any W) |
| lore / choice caps | 2 / 1 | 0 / 0 (loaned) | 0 / 0 (the inert Card Fan / Almanac / Hearth-key / Night Gate nodes reclaim cap from the live categories when they go live) |
| perChapter combat / sustain | 1.5 / 0.5 | 1.5 / 0.5 | **3.0** / 0.5 |
| perTier combat (Deep Dusk / Long Night) | 2.5 / 0.6 | 2.5 / 0.6 | **5.0 / 1.2** (Fourth Card pe 2, Fifth Hook pe 3, Long Night keystones pe 0.8 / 1.2) |
| knot face limit | 3 | 3 | **6** |
| sustain ceiling | 5.0 | 5.0 | **5.0 (unchanged: measurements do not justify more, see tree-impact.md)** |

Ceiling by chapter k_ch: 31 + 3 (k_ch - 1) combat, 5 + 0.5 (k_ch - 1) sustain. Raising again = the same single multiplier on the same fields, a bot sweep (META=full, GATES=all, both heroes, 96+ seeds), a LOCKED row and the snapshot edit in `tests/treedata.test.mjs`. Result: the live full tree is now 15.7 PE of the 30.4 cap sum (faces, not caps, are what limit it; that is the headroom for later chapters and new weapons).

**Felt-impact face pass (data only, within the schema):** Bleed / Burn beads Deep Bite, Red Thread, Kindling, Votive Embers +2 to +3 (the schema limit for a status pct); the five weapon masteries (Packmaster's Calling, Seventh Light, Black Feather Oath, Twin Wisps, Crown of Sparks) 1 + 1 to 2 + 2; the two hero lanterns Orphan's Instinct and Votive Flame +2 to +4. Descriptions updated; golden fixture regenerated with `scripts/review/regold.mjs`.

## 8. Power budget (soft cap, must stay inside the ceiling)

> **Superseded numbers (2026-10-20):** the caps, ceilings and PE totals in this section and in C.9 are the T3 values (ceiling 15.5). The live rule is x2 of the Lever-1 values, see 7d (combat ceiling 31, PE at cap 30.36, per-weapon pool cap 17.2, per-chapter 3.0, per-tier 5.0 / 1.2, knot 6, sustain 5.0 unchanged). Use the table printed by `node scripts/tree-validate.mjs --table` for the current figures.

Weights and caps from progression-gates-v1 3.1 plus the Status category from evolutions-second-review 5.1. Exclusive pairs counted once (the larger side). Generated by tables.mjs:

| Category | Cap C (stat %) | Weight | Face sum S | Soft total C(1-e^(-S/C)) | PE at total | PE at cap |
|---|---|---|---|---|---|---|
| Global damage | 3 | 1 | 3.0 | 1.90 | 1.90 | 3.00 |
| Summon damage (tag) | 6 | 0.35 | 8.5 | 4.54 | 1.59 | 2.10 |
| Magic damage (tag) | 6 | 0.35 | 4.0 | 2.92 | 1.02 | 2.10 |
| Per-weapon stats (each weapon; 5 weapons) | 8 each | 0.08 | 104 (20/20/22/22/20) | 37.0 (sum of 5) | 2.96 | 3.20 |
| Cast speed | 4 | 0.3 | 2.0 | 1.57 | 0.47 | 1.20 |
| Area / reach | 6 | 0.12 | 5.0 | 3.39 | 0.41 | 0.72 |
| Max health | 6 | 0.2 | 9.0 | 4.66 | 0.93 | 1.20 |
| Level-up heal | 1.5 | 0.4 | 1.3 | 0.85 | 0.34 | 0.60 |
| Status potency (Bleed, Burn, Mark uptime; shared) | 8 | 0.15 | 10.0 | 5.71 | 0.86 | 1.20 |
| **Combat total** | | | | | **10.5** | **15.3** (limit 15.5) |
| Sustain/verb: Last Light revive 4.0, Reroll x3 + Banish x3 at 0.1 each (0.6), Bright Hearts +5% 0.2, Mending Light +5% 0.2 | | | | | **5.0** | ceiling 5 |

Notes (review findings 3-4): summon tag S 8.5 = Bound Spirits 2 + Lantern-Fed 2 + Rousing Light 1.5 (its surge counted as damage here, not as sustain) + Bonded Pack 3; Bolts/Chain per-weapon S 22 includes their flat Pierce +1 / Chains +1 counted as 2 each. Rerolls and banishes are back inside sustain as progression-gates-v1 3.1 lists them; 0.1 each comes from its ablation (removing all six moved the bot 0-4 win points). Headroom: combat 15.3 of 15.5 at cap (0.2 more than the 15.1 in evolutions-second-review 5.1, from Area 0.72 and the per-weapon pool 3.2), sustain 5.0 of 5.0: **no headroom**, any new sustain or capped-stat node means trimming another (risk 4).

Reading: the whole tree bought adds ~10.5 combat PE (about +10% effective power) and can never pass 15.3 however many knots are added later (the cap sums are fixed). The per-weapon knots are deliberately past saturation (S about 2.5x C): the first 3-4 knots of a constellation carry nearly all of its stat value, the rest are mostly the joy of lighting the emblem (the panel shows "now worth"). Utility (not counted, caps only): move speed <= 5%, pickup <= 12%, XP <= 7.5%, gold <= 12%, ability cooldown floor 30 s, ability duration (incl. Firm Grip), auto-activate, evolution luck.

Changes vs v1 effects, all toward the locked 1-3% rule: tag/global damage nodes 2-12% -> 1-3%; per-weapon nodes 5-7% -> 2%; health 2.5-6% -> 2-3%; level-up heal 2.5% -> 0.75%; keystones 12/9% -> 3/3% (still a real trade); Rousing Light 25%/6 s -> 10%/4 s (inside the x1.75 amp cap). Balance acceptance (T5): META=full with all gates, random bot inside the progression-gates target (45-55% random / 65-75% focus), starter no-tree band unchanged (byte-identical sweeps).

## 9. Unlock conditions per gate (all 16) with estimated pace

Bot pace from progression-gates-v1 4.4 (median random/focus; bot ~800 wolves / 900 crows / 190 crawlers per run; a human is ~1.5x slower). Gates 13-16 are ESTIMATES until the T5 `gates-pace` run replaces them.

| # | Gate node | Unlocks | Condition | Bot runs |
|---|---|---|---|---|
| 1 | gt_phantom_stampede | Lightfoot Pack (wolf right eye) | Evolve Ghost Wolves once | 1 |
| 2 | gt_judgement_wheel | Judgement Wheel (orbit left light) | Evolve Holy Orbit once | 1 |
| 3 | gt_raven_flock | Raven Flock heart | Slay 4500 Carrion Crows | 4-5 |
| 4 | gt_dive_bombers | Talon Mark (raven eye) | Evolve weapons 4 times (dormant on the map until the Raven heart wakes; UI only) | 2 (usable after gate 3) |
| 5 | gt_spirit_bolts | Spirit Bolts heart | Slay 1500 Root Crawlers | 8 |
| 6 | gt_spirit_tempest | Spirit Tempest (bolt top tip) | Defeat the Elder Treant AND evolve weapons 6 times | 3-4 |
| 7 | gt_static_storm | Static Storm (chain middle fork) | Evolve weapons 12 times | 8-9 |
| 8 | gt_dire_alpha | The Alpha (wolf nose) | Evolve Ghost Wolves 3 times AND slay 10000 Forest Wolves | 12 |
| 9 | gt_chain_lightning | Chain Lightning heart | Defeat the Elder Treant 2 times AND slay 2500 Root Crawlers | 12-13 |
| 10 | gt_soul_lance | Soul Lance (bolt bottom tip) | Defeat the Elder Treant 2 times AND evolve Spirit Bolts once (needs Spirit Tempest first) | 12 |
| 11 | gt_murder_storm | Wall of Wings (raven wing tip) | Evolve Raven Flock once (needs Talon Mark first) AND slay 12000 Carrion Crows | 13 |
| 12 | gt_thunder_judgment | Thunder Judgment (chain upper fork) | Clear Cursed Forest 3 times AND evolve Chain Lightning once (needs Static Storm first) | 16-24 |
| 13 | gt_spearhead | Spearhead (raven beak point) | Evolve Raven Flock 3 times AND slay 20000 Carrion Crows | ~22-26 (est.) |
| 14 | gt_returning_pages | Returning Pages (bolt turn) | Evolve Spirit Bolts 2 times AND clear Cursed Forest 2 times | ~12-16 (est.) |
| 15 | gt_storm_tether | Storm Tether (chain lower fork) | Evolve Chain Lightning 2 times AND defeat the Elder Treant 5 times | ~16-22 (est.) |
| 16 | gt_vesper_tide | Vesper Tide (orbit right light) | Evolve Holy Orbit 3 times AND play 8 runs as Elias | ~10-14 (est.) |

Mix check (meta-progression principle): kill different enemies (3, 5, 8, 9, 11, 13), beat the boss (6, 9, 10, 15), win runs (12, 14), evolve specific weapons (1, 2, 8, 10-16), play a hero (16, hero lanterns), evolve many (4, 6, 7). Conditions use existing leaf types only. When the Husks roster (Stoat Piper, Puffback Toad, Branch-Mane) is built, kin beads can move to those enemies (one data edit each; T5 note).

## 10. Economy

Total ~74,000 gold + 29 soul shards (v1: 58,430 + 25; more nodes, smaller each). At bot pace (~1,800 gold/run) the whole web is ~41 runs; at a casual ~1,300 ~57 runs; the gate long pole (Spearhead ~22-26 runs) sits inside that. First run (800-1,700 gold) buys 4-6 Hearth lanterns. Costs per kind: Hearth 150-320, Wick 270-2,100 (+shards for capstones), constellation knots 180-570 rising along the thread, masteries 910 + 1 shard, keystones 1,800 + 3 shards, gates 100-600 (unchanged). Tuned at T5 with the bot (`gates-pace`), not now.

## 11. Onboarding (day one) and the first-unlock hook

- Day one (fresh save): the hub and Hearth lanterns glow "can buy"; the Wick ring is visible but locked behind its Hearth parents; **Wolves and Orbit constellations are awake** (hearts lit, Howling Legion and Sanctum Halo sockets already gold "known from run 1"; their other sockets sealed "???"); Ravens, Bolts and Chain are grey silhouettes showing only their one condition (not hidden: the weapon gates show progress from the first kill); the Dusk ring and fog band are faint. The camera opens on Second Glance (Reroll) with the Next lights board showing "Raven Flock: slay 4500 crows".
- A first-visit whisper (one line, dismissable, not a tutorial): "Spend gold on lanterns. Wake the sleeping spirits by playing." The real tutorial is release-gate item 7.
- **First-unlock celebration hook (for the codex chunk, release gate 11)**: the tree emits one event per newly met condition (`tree:wake` with `{id, kind: heart|socket|lantern}`), queued max 3 per screen. v2 ships the minimum: the camera glides to the node, the thread draws itself, the watermark gains colour (0.6 s; reduced motion = instant). The codex chunk adds the full celebration and sound on the same event.

## 12. Accessibility

Off-screen access (review finding 10): the canvas culls, but navigation does not: a persistent visually-hidden `role="tree"` list (constellation -> lanterns, independent of the viewport) carries focus; moving focus pans the camera to that lantern, so Tab, `[`/`]` and screen readers reach every node at every zoom (tested with the camera at FAR zoom). Keyboard: Tab walks lanterns in thread order inside a constellation, `[` / `]` jump between constellations, arrows pan, +/- zoom, Home recentres, `F` find, Enter buys (two-step), Esc backs out. Screen reader: every node is a button with name, kind, state, effect and condition text ("The Alpha, evolution socket, stirring, 52 percent: slay 10000 Forest Wolves 5200 of 10000"). State is never colour-only (lock glyph, arc, seal, NEW text, dashed vs solid thread). Targets >= 44 px at every zoom (hit radius independent of drawn size; LOD switches before targets overlap). Text >= 12 px (13 portrait). Reduced motion: no glide, no thread draw-in, no pulse. Colour-blind: role colours carry no meaning alone (each emblem has its own shape; status beads have their own glyph). Contrast tested like U2/U3.

## 13. Performance plan (125 nodes now, 1000-2000+ later: see Appendix C.12)

- One `<canvas>` (DPR-capped at 2) for the background, rings, threads, glow halos and emblem watermarks; watermarks and glows are pre-rendered once per cluster to offscreen canvases at two scales (no live SVG filters in the game; the mock-ups use filters only for speed of drawing).
- Nodes: pooled DOM `<button>`s created only for nodes inside the viewport plus a margin (existing `queryRect` spatial grid, 240-unit cells), capped at ~120 live buttons; at FAR zoom no buttons at all, one tap target per constellation.
- Redraw on pan/zoom only (no idle animation loop except a slow lantern flicker that stops when the tab is hidden and under reduced motion).
- Budget: 60 fps pan on a mid phone at 500 nodes (synthetic data in tests); measured with the existing pace harness under 4x CPU throttle; `compileTree` stays O(n) plus the O(n^2) overlap check (fine to the low thousands).
- No `backdrop-filter`, blur radii <= 60 px (UI round 2 limits).
- Touch (review finding 11): `touch-action: none` on the map only (page zoom never fights the pinch), tap vs drag threshold 8 px / 250 ms, pinch around the midpoint, double-tap zooms one LOD; labels use collision avoidance (a label that would overlap is hidden until that node is selected or the zoom grows); when a side/bottom sheet opens the camera recentres the selected node into the free area. A **constellation index** (a list button: the five spirits + rings with lit counts and the next light) is the cheap fallback for phones at FAR zoom.

## 14. Build chunks (small, each fully verified)

Every chunk also carries the EXTENSIBILITY acceptance items (LOCKED 2026-10-18; the "Ext" column; details in Appendix C, section numbers C.n).

| Chunk | What | Verify | Ext acceptance (must pass before the chunk is presented) |
|---|---|---|---|
| T1 | Data schema v2 + `compileTree` (clusters, place, requiresAny, new effect kinds, PE validator) with the v1 effects unchanged; old screen still works | tree.test.mjs (+ every validator failure case, hostile paths/ids), npm test, build, sweeps byte-identical | Tree data split into fragments `src/data/tree/{core,clusters/*,heroes/*,chapters/*,emblems/*}.json` merged by one loader (C.1); every schema field in C.2 validated with a failing-case test each; cluster TEMPLATE expansion (outline order -> requires, apex requiresAny, sockets) is code, clusters are data (C.3); namespace + permanent-id + `retired` checks (C.7); synthetic 6th-cluster fixture (the C.4 Lantern Wisps example, test-only data) compiles and lays out with NO screen-code change; GROWTH: permanent `idx` on every node, reserved far slots + fog + chapter bands in `core`, budget RULE (computed ceiling, 5/W per-weapon weight, chapter `scope`) + budget/snapshot tests, spatial-grid overlap check, `tree-synth` generator, compile/load perf tests at 1000 and 2000 nodes inside the C.12 budgets (C.14) |
| T2 | Save v3 migration "Regrowth" (frozen v1 prices incl. ranks/shards, idempotent) + sanitiser for requiresAny + bounded stats.recentRuns | save.test.mjs migration fixtures, import/export round trip, hostile saves | Migration REGISTRY (C.8): `treeVersion` in the save, ordered steps, one frozen price table per step under `src/meta/migrations/`, a fixture per version, "additive content needs no step" proven by a test that adds the C.4 fixture cluster to a v3 save with no data loss; hostile-save tests cover fragment ids, retired ids and unknown clusters; GROWTH: COMPACT save written by this same migration (per-fragment bitsets by `idx`, ranks map, compact `seen`, length caps), tree part <= 2 KB with 2000 nodes owned, migration/load <= 20 ms at 2000 (C.12, C.13) |
| T3 | Rescale: v2 effects/costs + soft cap in `aggregateMods` + status/duration/ability effects in the sim | tests per effect, starter sweeps byte-identical, META=half/full + GATES=all sweeps vs targets, tree-budget table = section 8 | Budget computed from DATA (categories per effect, per-weapon weight 0.08 x 5/W so the pool cap stays fixed when W grows), `budget.test.mjs` FAILS when a node pushes combat PE-at-cap > 15.5 or sustain > 5 (proved by the C.4 fixture plus one deliberately over-budget fixture), knot face > 3% fails, budget constants snapshot-tested so raising them is a visible deliberate edit (C.9); STATUS registry (C.10) with Bleed/Burn/Mark entries |
| T4 | New screen part 1: canvas map, layout, LODs, pan/zoom/keys/touch rules, pooled buttons + hidden role=tree focus list, states, constellation index (no new art yet) | treescreen tests (focus order, keys, no innerHTML), perf at 500 synthetic nodes, screenshots 3 sizes | Screen reads ONLY compiled data (no weapon/hero/chapter id in screen code: grep test); the reserved far-sky slots and the fog band render from data on day one (empty slots drawn as faint "?" stars); layout checker (C.6: overlaps, label collisions per LOD, reachability, cluster/ring clearance) runs in `npm test`; GROWTH: culled rendering through the spatial index, semantic zoom (overview = constellation emblems only; beads at MID; labels at NEAR; thresholds from data), cluster-jump focus list, data-driven constellation index with fast travel; 1000 and 2000-node synthetic trees meet every C.12 budget (frame time desktop + 4x-throttle phone proxy, first frame, heap, <= 120 live buttons) |
| T5 | Look: Lantern Glass kit, emblems, sockets, wake animation, detail panel + side/bottom sheets, Next lights, Find; gate counts 13-16 tuned with gates-pace | screenshots vs these mock-ups at 3 sizes, contrast + 44 px checks, keyboard walkthrough, reduced motion, gates-pace numbers replace the estimates | Emblems drawn from DATA (`emblems/*.json`: silhouette + medallion layers with palette tokens, C.3) by one generic renderer; the five launch emblems converted; the C.4 fixture cluster screenshotted at 3 sizes to prove a new emblem needs no code; GROWTH: search/filter panel, minimap, up to 5 bookmarks (validated save field) (C.13) |
| T6 | Content batch: three-options pick for status nodes + hero lanterns (one-tap), then build the picks | Matt's picks in LOCKED; sweeps (ability share, amp cap), tests | Hero lanterns built through the hero-triple fragment (C.5), status nodes through the STATUS registry (C.10); each added only as data + its one sim hook; budget test green |
| T7 | Polish + weak-spot fixes, real-phone check by Matt | Matt playtest | Re-run `tree-validate` + budget + layout + migration suites; perf re-measured on Matt's phone at the real tree and the 1000/2000-node synthetic trees; region-scoped lazy compile switched on if a second chapter exists by then (API from T1) |
| T8 | CONTENT GUIDE + SCAFFOLD: `docs/CONTENT-GUIDE.md` section "How to add to the skill tree" (C.11 checklists: weapon, evolution socket, hero, chapter band, status node, ring node, raising the budget) + `scripts/tree-scaffold.mjs` and `scripts/tree-validate.mjs` (C.11) | npm test, scaffold dry run creates a valid fixture cluster that passes validate, guide reviewed against the scripts | A dry run "add Lantern Wisps" from the guide alone (fresh agent, no other context) ends with a valid cluster, green tests and a layout SVG; release-gate item 17 (content pipeline) links to this section |

## 15. Risks and honest weak spots

1. **The raven and chain emblems read weaker than wolf, bolt and orbit** at far zoom (mock-up st2-emblems). Fix in T5 by tuning the 11 points and the watermark path against a squint test; the summons-art sheet #3 may also refine the emblems.
2. **Knots past the soft cap are nearly worthless** (by design). Some players will feel the late knots are filler; the panel shows "now worth", and masteries/sockets carry the reasons to come back. Alternative if Matt dislikes it: drop to 7 knots per constellation (still >= 12 nodes per weapon).
3. **Gate counts 13-16 are estimates**; Spearhead (~22-26 bot runs, ~35 human) may feel too long. Measured in T5.
4. **No budget headroom**: sustain exactly 5.0, combat cap-sum 15.3 of 15.5; adding Fear/Pin or any heal node later means trimming another.
4b. **The bot win target may be missed low** (review finding 5): the full tree is ~10.5 combat PE, not ~15, so "all gates + whole tree" may land ~5-10 points under the 45-55% random / 65-75% focus target. Levers (Matt decides at T3 if it happens): raise category caps/weights toward 15, or accept a lower full-tree win rate (the game then stays harder; options carry the rest).
4c. **Gate counts 13-16 are not to be locked** with this sheet: lock the structure, ids and look now, the numbers after T5's gates-pace run.
4d. **Options B and C are weaker** than A in all three questions (honest: A was designed in depth, B/C as genuine but lighter alternatives). A real near-alternative to A1 is "Hearth and Wick as one dense ring + constellations"; it changes only ring radii, so it can be tried in T4 without a new decision.
5. **The Regrowth refund** resets Matt's dev tree once.
6. **New hero lantern and status nodes need sim hooks** (Pin/Mark duration, wheel radius): small, but each must keep tree-less sweeps byte-identical.
7. **Mock-ups are static**: the wake animation, glide and pinch feel are described, not shown; T5 screenshots + Matt's phone check are the real proof.
9. **Growth defaults taken without asking (Matt may override)**: chapter-scoped power (a later chapter's band nodes apply only in that chapter or later, C.5) and the budget rule +1.5 combat / +0.5 sustain PE per chapter (C.9); both protect Chapter 1 balance as the tree grows. The perf budgets in C.12 are targets, not yet measured; label-collision checks use estimated text widths.
8. Mock-ups use SVG blur filters; the game must bake glows (perf plan) and may look slightly softer/flatter.

## 16. Review

An independent reviewer read this sheet before Matt (summary in Appendix B).

## 17. Security check and Fit check

- **Security check**: design only, no game code changed, no dependencies, no downloads (web research read-only). The design keeps every save rule (ids stable, versioned migration with a frozen price table, sanitiser on load/import, clamps), validates every new data field (cluster paths charset-checked, effect ranges, requiresAny cycles), keeps `textContent`/`setAttribute` only (no innerHTML), and the mock-up shooter uses its own headless Chrome on port 9381 with a throwaway profile (the dev server and other Chrome processes untouched).
- **Fit check**: lantern hub, brass and glass lanterns, glowing thread like the in-game trails, gold only on evolution seals, teal NEW, colour returning to a grey emblem as you buy (the Hollow identity), the five spirits' own emblems and role colours; mechanically it keeps options-not-stats, the soft cap, hidden recipes, permanent gates, free respec and the summoner fantasy (Wren's wolves and Elias's orbit are awake on day one, the rest wake by play).

## Appendix A. Every node: id, v1 or NEW, place, effect, cost, condition (generated)

PROVISIONAL (not locked by locking this sheet; T6 three-options batch): wr_grip, wr_spark, el_wheel, el_lamp, wf_rend, or_kindle, or_ember, rv_eye (status + hero groups); knot names/numbers are defaults (data tuning). "display" rows are not nodes (starter heart/socket). Costs per node; mastery nodes also cost 1 shard. Effects marked "v1" keep the v1 id with the v2 (rescaled) effect.

| id | v1 or NEW | v2 place | kind | v2 effect (per node) | gold | shards | unlock condition |
|---|---|---|---|---|---|---|---|
| (ghost_wolves heart) | display | Ghost Wolves / heart | heart | Starter spirit: always lit | 0 | 0 |  |
| (howling_legion socket) | display | Ghost Wolves / left eye | socket | Starter evolution: known from run 1 | 0 | 0 |  |
| gt_phantom_stampede | v1 | Ghost Wolves / right eye | socket | Unlocks the evolution Lightfoot Pack (recipe hidden) | 100 | 0 | Evolve Ghost Wolves once (bot runs: 1) |
| gt_dire_alpha | v1 | Ghost Wolves / nose | socket | Unlocks the evolution The Alpha (recipe hidden) | 300 | 0 | Evolve Ghost Wolves 3 times AND slay 10000 Forest Wolves (bot runs: 12) |
| su_call | v1 | Ghost Wolves / eiL | knot | Wolf speed +2% | 180 | 0 |  |
| wf_lope | NEW | Ghost Wolves / etL | knot | Wolf speed +2% | 290 | 0 |  |
| wf_bleed | v1 | Ghost Wolves / chL | bead | Bleed potency +2% (status, shared cap) | 390 | 0 |  |
| wf_scent | NEW | Ghost Wolves / rfL | knot | Bite power +2% | 450 | 0 |  |
| wf_rend | NEW | Ghost Wolves / jwL | bead | Bleed potency +2% (status, shared cap) | 570 | 0 | killEnemy wolf 2500 |
| wf_third | v1 | Ghost Wolves / chin | mastery | Bite power +1% and Wolf speed +1% | 910 | 1 | killEnemy wolf 4000 |
| wf_hunt | NEW | Ghost Wolves / jwR | knot | Wolf speed +2% | 570 | 0 |  |
| wf_maul | NEW | Ghost Wolves / rfR | knot | Bite power +2% | 450 | 0 |  |
| wf_coat | NEW | Ghost Wolves / chR | bead | Bite power +2% | 390 | 0 | useCharacter wren 5 |
| wf_bite | NEW | Ghost Wolves / etR | knot | Bite power +2% | 290 | 0 |  |
| wf_fang | v1 | Ghost Wolves / eiR | knot | Bite power +2% | 180 | 0 |  |
| gt_raven_flock | v1 | Raven Flock / heart | heart | Unlocks Raven Flock | 200 | 0 | Slay 4500 Carrion Crows (bot runs: 4-5) |
| gt_dive_bombers | v1 | Raven Flock / eye | socket | Unlocks the evolution Talon Mark (recipe hidden) | 200 | 0 | Evolve weapons 4 times (bot runs: 2) |
| gt_murder_storm | v1 | Raven Flock / wing tip | socket | Unlocks the evolution Wall of Wings (recipe hidden) | 400 | 0 | Evolve Raven Flock once AND slay 12000 Carrion Crows (bot runs: 13) |
| gt_spearhead | v1 | Raven Flock / beak point | socket | Unlocks the evolution Spearhead (recipe hidden) | 600 | 0 | Evolve Raven Flock 3 times AND slay 20000 Carrion Crows (bot runs: ~22-26 (est.)) |
| rv_talon | v1 | Raven Flock / tail | knot | Peck power +2% | 210 | 0 |  |
| rv_quill | NEW | Raven Flock / bel | knot | Peck power +2% | 320 | 0 |  |
| rv_wide | v1 | Raven Flock / nape | knot | Watch +2% | 430 | 0 |  |
| rv_glide | NEW | Raven Flock / crown | knot | Wingbeat +2% | 490 | 0 |  |
| rv_eye | NEW | Raven Flock / w1 | bead | Mark lasts +0.5 s (status: Mark; counted as +2% potency; the x1.75 amp cap still clamps) | 630 | 0 | killEnemy crow 6000 |
| rv_watch | NEW | Raven Flock / w2 | knot | Watch +2% | 490 | 0 |  |
| rv_oath | v1 | Raven Flock / w3 | mastery | Peck power +1% and Watch +1% | 910 | 1 | killEnemy crow 8000 |
| rv_wing | NEW | Raven Flock / w4 | knot | Wingbeat +2% | 430 | 0 |  |
| rv_kin | NEW | Raven Flock / w5 | bead | Peck power +2% | 390 | 0 | evolveWeapon raven_flock 2 |
| rv_beat | NEW | Raven Flock / w6 | knot | Wingbeat +2% | 320 | 0 |  |
| rv_peck | NEW | Raven Flock / brs | knot | Peck power +2% | 210 | 0 |  |
| gt_spirit_bolts | v1 | Spirit Bolts / heart | heart | Unlocks Spirit Bolts | 300 | 0 | Slay 1500 Root Crawlers (bot runs: 8) |
| gt_spirit_tempest | v1 | Spirit Bolts / top tip | socket | Unlocks the evolution Spirit Tempest (recipe hidden) | 400 | 0 | Defeat the Elder Treant AND evolve weapons 6 times (bot runs: 3-4) |
| gt_soul_lance | v1 | Spirit Bolts / bottom tip | socket | Unlocks the evolution Soul Lance (recipe hidden) | 500 | 0 | Defeat the Elder Treant 2 times AND evolve Spirit Bolts once (bot runs: 12) |
| gt_returning_pages | v1 | Spirit Bolts / the turn | socket | Unlocks the evolution Returning Pages (recipe hidden) | 600 | 0 | Evolve Spirit Bolts 2 times AND clear Cursed Forest 2 times (bot runs: ~12-16 (est.)) |
| bo_twin | v1 | Spirit Bolts / t1 | mastery | Bolt power +1% and Swiftness +1% | 910 | 1 | evolveWeapon spirit_bolts 1 |
| bo_glyph | NEW | Spirit Bolts / t2 | knot | Bolt power +2% | 320 | 0 |  |
| bo_pierce | v1 | Spirit Bolts / u1 | bead | Spirit Bolts pierce +1 foe | 490 | 0 |  |
| bo_swift | v1 | Spirit Bolts / u2 | knot | Swiftness +2% | 290 | 0 |  |
| bo_ink | NEW | Spirit Bolts / k1 | knot | Bolt power +2% | 210 | 0 |  |
| bo_quick | NEW | Spirit Bolts / k2 | knot | Swiftness +2% | 210 | 0 |  |
| bo_line | NEW | Spirit Bolts / k3 | knot | Swiftness +2% | 320 | 0 |  |
| bo_page | NEW | Spirit Bolts / l1 | knot | Bolt power +2% | 430 | 0 |  |
| bo_hand | NEW | Spirit Bolts / l2 | knot | Swiftness +2% | 430 | 0 |  |
| bo_kin | NEW | Spirit Bolts / l3 | bead | Bolt power +2% | 490 | 0 | killEnemy root_crawler 3000 |
| bo_seal | NEW | Spirit Bolts / b1 | knot | Bolt power +2% | 570 | 0 |  |
| gt_chain_lightning | v1 | Chain Lightning / heart | heart | Unlocks Chain Lightning | 500 | 0 | Defeat the Elder Treant 2 times AND slay 2500 Root Crawlers (bot runs: 12-13) |
| gt_thunder_judgment | v1 | Chain Lightning / upper fork | socket | Unlocks the evolution Thunder Judgment (recipe hidden) | 600 | 0 | Clear Cursed Forest 3 times AND evolve Chain Lightning once (bot runs: 16-24) |
| gt_static_storm | v1 | Chain Lightning / middle fork | socket | Unlocks the evolution Static Storm (recipe hidden) | 600 | 0 | Evolve weapons 12 times (bot runs: 8-9) |
| gt_storm_tether | v1 | Chain Lightning / lower fork | socket | Unlocks the evolution Storm Tether (recipe hidden) | 600 | 0 | Evolve Chain Lightning 2 times AND defeat the Elder Treant 5 times (bot runs: ~16-22 (est.)) |
| cl_arc | v1 | Chain Lightning / s1 | bead | Chain Lightning jumps +1 time | 210 | 0 |  |
| cl_power | v1 | Chain Lightning / s2 | knot | Power +2% | 210 | 0 |  |
| cl_spark | NEW | Chain Lightning / f1 | knot | Power +2% | 320 | 0 |  |
| cl_reach | NEW | Chain Lightning / f2 | knot | Arc +2% | 430 | 0 |  |
| cl_storm | v1 | Chain Lightning / f3 | knot | Arc +2% | 570 | 0 |  |
| cl_quick | NEW | Chain Lightning / m1 | knot | Cooldown +2% | 320 | 0 |  |
| cl_crack | NEW | Chain Lightning / m2 | knot | Power +2% | 430 | 0 |  |
| cl_hum | NEW | Chain Lightning / m3 | knot | Cooldown +2% | 570 | 0 |  |
| cl_ground | NEW | Chain Lightning / g1 | knot | Arc +2% | 430 | 0 |  |
| cl_kin | NEW | Chain Lightning / g2 | bead | Power +2% | 630 | 0 | bossKill elder_treant 3 |
| cl_crown | NEW | Chain Lightning / g3 | mastery | Power +1% and Arc +1% | 910 | 1 | evolveWeapon chain_lightning 2 |
| (holy_orbit heart) | display | Holy Orbit / heart | heart | Starter spirit: always lit | 0 | 0 |  |
| (sanctum_halo socket) | display | Holy Orbit / lower light | socket | Starter evolution: known from run 1 | 0 | 0 |  |
| gt_judgement_wheel | v1 | Holy Orbit / left light | socket | Unlocks the evolution Judgement Wheel (recipe hidden) | 100 | 0 | Evolve Holy Orbit once (bot runs: 1) |
| gt_vesper_tide | v1 | Holy Orbit / right light | socket | Unlocks the evolution Vesper Tide (recipe hidden) | 600 | 0 | Evolve Holy Orbit 3 times AND play 8 runs as Elias (bot runs: ~10-14 (est.)) |
| or_power | v1 | Holy Orbit / o1 | knot | Orb power +2% | 180 | 0 |  |
| or_wick | NEW | Holy Orbit / o2 | knot | Orb power +2% | 290 | 0 |  |
| or_kindle | NEW | Holy Orbit / o3 | bead | Burn potency +2% (status, shared cap) | 390 | 0 |  |
| or_wide | v1 | Holy Orbit / o4 | knot | Orbit size +2% | 450 | 0 |  |
| or_seventh | v1 | Holy Orbit / o5 | mastery | Orb power +1% and Orbit size +1% | 910 | 1 | evolveWeapon holy_orbit 1 |
| or_tide | NEW | Holy Orbit / o6 | knot | Orbit speed +2% | 450 | 0 |  |
| or_ember | NEW | Holy Orbit / o7 | bead | Burn potency +2% (status, shared cap) | 570 | 0 | evolveWeapon holy_orbit 3 |
| or_swing | NEW | Holy Orbit / o8 | knot | Orbit speed +2% | 290 | 0 |  |
| or_spin | NEW | Holy Orbit / o9 | knot | Orbit speed +2% | 180 | 0 |  |
| or_bright | NEW | Holy Orbit / i1 | knot | Orbit size +2% | 390 | 0 |  |
| or_vigil | NEW | Holy Orbit / i2 | bead | Orb power +2% | 490 | 0 | surviveTime cursed_forest 600 |
| ch_wren | v1 | wren lantern | hero | Ghost Wolves bite +2% | 600 | 0 | useCharacter wren 3 |
| wr_grip | NEW | wren lantern | hero | Rally the Pack lasts +0.5 s (ability duration; pins still never hold bosses) | 900 | 0 | useCharacter wren 6 |
| wr_spark | NEW | wren lantern | hero | Visual only: kill sparks join your pack (BIBLE lock) | 400 | 0 | useCharacter wren 10 |
| ch_elias | v1 | elias lantern | hero | Holy Orbit +2% | 600 | 0 | useCharacter elias 3 |
| el_wheel | NEW | elias lantern | hero | Candle Wheel ring +8% wider (still no Burn; W3 lock) | 900 | 0 | useCharacter elias 6 |
| el_lamp | NEW | elias lantern | hero | Visual only: lantern trail lingers longer | 400 | 0 | useCharacter elias 10 |
| sp_reroll1 | v1 | hearth ring | ring | Unlocks Reroll: +1 per run | 150 | 0 |  |
| sp_ban1 | v1 | hearth ring | ring | Unlocks Banish: +1 per run | 150 | 0 |  |
| li_vigor | v1 | hearth ring | ring | Max health +2% | 180 | 0 |  |
| su_bond | v1 | hearth ring | ring | Summons +2% damage | 180 | 0 |  |
| ma_focus | v1 | hearth ring | ring | Magic +2% damage | 180 | 0 |  |
| li_reach | v1 | hearth ring | ring | Pickup radius +6% | 260 | 0 |  |
| li_step | v1 | hearth ring | ring | Move speed +2% | 260 | 0 |  |
| li_study | v1 | hearth ring | ring | Experience +3% | 320 | 0 |  |
| li_oak | v1 | hearth ring | ring | Max health +2% | 320 | 0 |  |
| sp_cd1 | v1 | hearth ring | ring | Ability cooldown -10% | 300 | 0 |  |
| sp_reroll2 | v1 | wick ring | ring | +1 reroll | 270 | 0 |  |
| sp_reroll3 | v1 | wick ring | ring | +1 reroll | 600 | 0 |  |
| sp_ban2 | v1 | wick ring | ring | +1 banish | 330 | 0 |  |
| sp_ban3 | v1 | wick ring | ring | +1 banish | 720 | 0 |  |
| sp_cd2 | v1 | wick ring | ring | Ability cooldown -10% | 660 | 0 |  |
| sp_cd3 | v1 | wick ring | ring | Ability cooldown -10% | 1350 | 0 |  |
| sp_cd4 | v1 | wick ring | ring | Ability cooldown -15% (floor 30 s) | 2100 | 2 |  |
| sp_dur | v1 | wick ring | ring | Ability lasts +15% | 900 | 0 |  |
| sp_auto | v1 | wick ring | ring | Ability fires itself below 30% health | 1050 | 0 | surviveTime cursed_forest 300 |
| li_regen | v1 | wick ring | ring | Level-up heals 0.75% max health | 900 | 0 |  |
| li_hearts | v1 | wick ring | ring | Hearts drop +5% | 840 | 0 |  |
| li_heal | v1 | wick ring | ring | Hearts heal +5% | 900 | 0 |  |
| li_magnet | v1 | wick ring | ring | Soul Magnets +25% | 750 | 0 |  |
| li_coin | v1 | wick ring | ring | Gold +5% | 720 | 0 |  |
| li_scav | v1 | wick ring | ring | Pickup radius +6% | 450 | 0 | killEnemy wolf 500 OR killEnemy crow 800 |
| li_root | v1 | wick ring | ring | Max health +2% | 750 | 0 | killEnemy root_crawler 400 |
| li_vow | v1 | wick ring | ring | Gold +4% | 900 | 0 | surviveTime cursed_forest 600 |
| li_hoard | v1 | wick ring | ring | Gold +3% | 1050 | 0 | totalGold 20000 |
| su_pot | v1 | wick ring | ring | Summons +2% damage | 390 | 0 |  |
| su_swift | v1 | wick ring | ring | Summons move 4% faster (no damage effect) | 540 | 0 |  |
| su_rush | v1 | wick ring | ring | Level-up: summons +10% for 4 s (inside the x1.75 amp cap) | 750 | 0 |  |
| ma_cast | v1 | wick ring | ring | Spells cast 2% faster | 670 | 0 |  |
| ma_area | v1 | wick ring | ring | Areas and reach +3% | 580 | 0 |  |
| ma_attune | v1 | wick ring | ring | Evolution-pair cards +50% (never names a recipe) | 1050 | 0 |  |
| ma_pow3 | v1 | wick ring | ring | Magic +2% damage | 1500 | 1 |  |
| sp_edge | v1 | wick ring | ring | All damage +1% | 1500 | 0 |  |
| su_key | v1 | dusk ring | key | KEYSTONE: summons +3%, magic -3% (excludes ma_key) | 1800 | 3 |  |
| ma_key | v1 | dusk ring | key | KEYSTONE: magic +3%, summons -3% (excludes su_key) | 1800 | 3 |  |
| li_lantern | v1 | dusk ring | key | KEYSTONE: max health +3%, level-ups heal 0.5% more, damage -1% (excludes li_glass) | 1800 | 3 |  |
| li_glass | v1 | dusk ring | key | KEYSTONE: damage +1.5%, max health -4% (excludes li_lantern) | 1800 | 3 |  |
| li_last | v1 | dusk ring | ring | Once per run: a killing blow returns you at 20% health | 900 | 5 | clearChapter cursed_forest |
| li_elder | v1 | dusk ring | ring | Level-up heals 0.5% max health | 1200 | 2 | bossKill elder_treant |
| sp_mastery | v1 | dusk ring | ring | All damage +1% | 2700 | 2 | clearChapter cursed_forest AND evolveWeapon any 5 |
| ma_ascend | v1 | dusk ring | ring | Areas and reach +2% | 1800 | 0 | evolveWeapon any 3 |
| li_dawn | v1 | dusk ring | ring | All damage +1% (hidden until progress) | 1500 | 0 | bestLevel 50 |
| tz_marsh | v1 | fog ring | teaser | A spirit that waits beyond this forest | 0 | 0 |  |
| tz_witch | v1 | fog ring | teaser | A spell that waits beyond this forest | 0 | 0 |  |
| tz_crown | v1 | fog ring | teaser | A light that waits beyond this forest | 0 | 0 |  |

## Appendix B. Independent review

Reviewer: a fresh agent (sonnet), 2026-10-18, read-only, cross-checked against LOCKED, progression-gates-v1 section 3, evolutions-second-review 5.1, tree.js, tree.json and schema.js. It verified the 125 rows, 43 new ids and that all 82 v1 ids are kept, and the combat totals. Its 15 findings and what was done:

| # | Finding | Action |
|---|---|---|
| 1 | Making sockets require the weapon heart would let the sanitiser drop and refund a permanent gate | FIXED: dormant socket is UI-only, gates keep requires [] (sections 3, 7), test named |
| 2 | Soft-cap category per weapon undefined (code keys per stat) | FIXED: categories per effect, one cap per weapon, test (section 6) |
| 3 | Small count mismatches, no headroom | FIXED: counts explained, headroom stated (section 8, risk 4) |
| 4 | Rerolls/banishes dropped from sustain; Mark is an amp, not control | FIXED: rerolls/banishes back in sustain (0.1 each from the ablation), Mark moved to Status, Pin node removed (Firm Grip is now ability duration), sustain = 5.0 |
| 5 | Full tree ~10.5 PE may miss the win target | ADDED as risk 4b with levers (Matt at T3) |
| 6 | Hidden sibling-socket dependencies | FIXED: panel line + map tether, pace table notes (sections 3, 9) |
| 7 | requiresAny touches gateAnc, status text, paths, edges | FIXED: listed in section 6 with a compile-fail test |
| 8 | Parent rule for display hearts / branch field unclear | FIXED: parent rule (section 3), branch rule (section 6) |
| 9 | Pace hint needs per-run data | FIXED: bounded stats.recentRuns in the v3 schema (section 7) |
| 10 | Culled DOM buttons break keyboard/screen reader | FIXED: persistent hidden role=tree list drives focus and camera (section 12) |
| 11 | Phone label collisions, sheet covers cluster, touch rules missing | FIXED in spec: label collision rule, camera recentres, touch rules, constellation index (section 13); the same label rule is applied in the mock-ups |
| 12 | Review pending; provisional nodes look final; visual-only nodes cost gold | FIXED: this appendix; provisional list at Appendix A; visual-only costs flagged as a T6 taste call |
| 13 | Mark/Pin vs amp cap and boss immunity not shown | FIXED: worked example (section 5); Pin node dropped at launch |
| 14 | Migration details (ranks, shards, idempotency, seen) | FIXED (section 7) |
| 15 | B/C thinner than A; phone list fallback; do not lock gate counts | ADDED: risks 4c, 4d; constellation index (section 13) |

## Appendix C. How the tree is added to later (EXTENSIBILITY + GROWTH, LOCKED 2026-10-18)

Goals (Matt): "With skill tree this also needs to be easily added to at later dates" (LOCKED 'SKILL TREE EXTENSIBILITY') and "after v1 the tree will expand A LOT" (LOCKED 'SKILL TREE GROWTH': design for 1000+ nodes, tested at 1000 and 2000). Rule this appendix guarantees: **adding a weapon, hero, chapter, status node or ring node is DATA (+ one emblem drawing for a weapon) + tests; never screen code, never a hand-placed x/y, never an id change, never a hand-edited budget number.** Built in T1-T8 (section 14, "Ext" column; C.14 says what must be in T1/T2/T4).

### C.1 Where the data lives (fragments, one loader)

```
src/data/tree/
  core.json                  hub, rings (hearth, wick, dusk), budget RULE, sky/far slots, chapter bands, namespaces, retired ids
  clusters/<weaponId>.json   one constellation per weapon (template instance, C.3)
  emblems/<emblemId>.json    silhouette + outline slots + sockets + medallion layers (C.3)
  heroes/<heroId>.json       one hero lantern triple (+ optional hero gate) (C.5)
  chapters/<chapterId>.json  one fogged chapter band and its nodes/teasers (C.5)
src/meta/treedata.js         merges fragments (Vite import.meta.glob eager in the game, readdir in Node tests/scripts)
                             in a FIXED order: core, emblems, clusters (sorted by id), heroes, chapters (by order)
```
A fragment can only ADD; it cannot edit another fragment's node (duplicate id = compile error), so content packs never silently fight. The screen and the sim read only the compiled result: no weapon, hero, chapter or cluster list and no count or position exists in screen code (T4 grep test: no `ghost_wolves`, `wren`, `cursed_forest`, `sky1`, numeric radii etc. in `src/ui/tree*`).

### C.2 Schema (all validated by `compileTree`; every rule has a failing-case test)

| Object | Fields | Validation |
|---|---|---|
| `core.version` | integer, bumped only when an EXISTING id changes (C.8) | must match the newest registered migration |
| `core.budget` | the RULE, not a total (C.9): `{base:{combat:15.5, sustain:5}, perChapter:{combat:1.5, sustain:0.5}, knotMax:3, optionShareMin:0.6, categories:{...caps and weights...}, lockedRef}` | snapshot test (C.9) |
| `core.namespaces` | `{ "wf": {kind:"cluster", owner:"ghost_wolves"}, "rv", "bo", "cl", "or", "sp"/"su"/"ma"/"li": {kind:"ring"}, "ch"/"wr"/"el": {kind:"hero"}, "gt": {kind:"gate"}, "tz": {kind:"teaser"}, "c1".."c8": {kind:"chapter"} }` | every node id = `<prefix>_<name>`, prefix registered and owned by the fragment that uses it (C.7) |
| `core.retired` | ids that existed once and were removed | never usable again (C.7) |
| `core.rings` | `{hearth:{r:150, slots:10}, wick:{r:300, slots:26}, heroes:{r:450}, sky:{r:600, slots:5}, dusk:{r:960, slots:12}, fog:{r:1180}, far:{r:1280, slots:10, ang0:18, step:36}, bands:{r0:1600, width:360, slots:24, constellations:2}}` | radii strictly increasing; clearances checked (C.6) |
| `core.skySlots` | `sky1..sky5` = launch constellations (162/234/306/18/90 deg); `far1..far10` = RESERVED constellation slots, angle 18 + 36(k-1) | one cluster per slot; reserved slots are drawn (faint "?" stars) from day one |
| `emblems/<id>` | `{id, box:200, heart:[x,y], outline:[11 slot names], closed, apex, slots:{name:[x,y]}, sockets:{a:[x,y,label], b, c}, silhouette:"<path>", medallion:[{d, fill:<token>, stroke:<token>, w}] (max 12)}` | 11 outline slots + heart + 3 sockets; coordinates within +-box; local min gap 50; paths <= 600 chars, charset `[MLCQAZ0-9 .,-]`, absolute commands only; fills are PALETTE TOKENS from an allow-list (`role.<name>`, `brass`, `ink`, `glass`), never raw CSS |
| `clusters/<weaponId>` | `{weapon, prefix, emblem, slot, chapter:"cursed_forest", hero?, heart:<gate id>|null, starterEvo?, sockets:{a:{evo, gate|null}, b, c}, outline:[11 node specs in emblem order], extra?:[<=4 specs with explicit slot], gates:[gate node specs]}` | weapon exists; socket evolutions = exactly that weapon's evolutions; gated weapon -> heart is its gate; gate ids `gt_<weapon|evo id>` |
| node spec | `{id, idx, name, kind: knot|bead|status|kin|mastery|verb|ring|hero|gate, effects:[...], cost:{gold, shards}, unlock?, desc, flavour?}` (no `requires`, no x/y: the template derives them) | `idx` = permanent small integer, unique inside its fragment, never reused (the compact save key, C.13); knot = one weapon-stat effect, face <= 3%; status = registered status (C.10); mastery and kin need an `unlock` |
| `heroes/<heroId>` | `{hero, prefix, signature:<weaponId>, gate?, lanterns:[3 specs]}` | hero exists; signature cluster exists; exactly 3 |
| `chapters/<chapterId>` | `{chapter, order, prefix, teaser?:<tz id>, entry:<condition>, nodes:[specs with place {band:i}], constellations?:[cluster ids placed at band slots]}` | chapter exists (or `future:true`: teasers only, conditions not validated) |
| ring node | `{id, idx, place:{ring, i}, requires/requiresAny, effects, cost, unlock?}` | slot index unique per ring |

Positions are always computed (cluster centre from its slot + emblem slot; ring nodes from `{ring, i}`; legacy `{ring, ang}` accepted for old data only, lint warning). Cluster `requires` come from the template: heart -> outline[0] and outline[10]; left side chains up to the apex, right side chains up to the apex, the apex uses `requiresAny` of its two neighbours; a gated weapon's first lanterns require its heart; sockets keep `requires: []` (permanent gates never depend on knots, section 3).

### C.3 The CLUSTER TEMPLATE (a new weapon = one cluster file + one emblem file)

Every future weapon: **1 heart + 11 outline lanterns + 3 sockets = 15 nodes** (siblings consistent). Outline kinds by index (enforced for new clusters):

| Index | 0 | 1 | 2 | 3 | 4 | 5 (apex) | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Kind | knot A | knot B | bead: status or verb | knot C | kin | mastery | knot A | bead: verb | knot B | bead: status, verb or kin | knot C |

6 knots of 15 = 60% options/verbs/gates (progression-gates 3.3 rule 3). Knots A/B/C = the weapon's three NON-COUNT stats. Status beads only for a weapon that owns a status (C.10), else verbs. The five launch constellations are the grandfathered region `launch` (6-8 knots); the option-share rule is checked per region. The emblem file carries the silhouette (teaser + watermark), the 11 slots in thread order, the apex, the 3 socket points at the shape's meaningful places with a plain label, and the heart medallion as tokenised layers; ONE generic renderer (T5) draws every emblem.

### C.4 Worked example: a sixth weapon, Lantern Wisps (HYPOTHETICAL test fixture; V1 scope ships no new weapons)

Assumed: weapon `lantern_wisps` (Thomas's spirit), stats count / power / radius / duration, placeholder evolutions `wisp_choir`, `beacon_line`, `ember_veil` (real ones come from the three-options process). Reserved slot **far2** (r 1280, 54 deg: lower right beyond Chain and Orbit); Thomas's hero lantern on the same bearing at r 450.

`src/data/tree/emblems/flame.json`
```json
{ "id": "flame", "box": 200, "heart": [0, 64], "closed": false, "apex": "o5",
  "outline": ["o0","o1","o2","o3","o4","o5","o6","o7","o8","o9","o10"],
  "slots": { "o0": [-50, 96], "o1": [-96, 52], "o2": [-110, -4], "o3": [-88, -60], "o4": [-50, -104], "o5": [0, -140],
             "o6": [50, -104], "o7": [88, -60], "o8": [110, -4], "o9": [96, 52], "o10": [50, 96] },
  "sockets": { "a": [0, -192, "flame tip"], "b": [-150, -96, "left lick"], "c": [0, 130, "ember at the base"] },
  "silhouette": "M0 -150 C30 -110 120 -70 116 6 C112 70 60 108 0 108 C-60 108 -112 70 -116 6 C-120 -50 -70 -80 -40 -120 C-30 -90 -14 -80 0 -70 C8 -100 4 -130 0 -150Z",
  "medallion": [ { "d": "M0 -20 C14 -6 16 8 0 18 C-16 8 -14 -6 0 -20Z", "fill": "role.lantern", "stroke": "ink", "w": 2.4 },
                 { "d": "M0 -4 C5 2 5 8 0 12 C-5 8 -5 2 0 -4Z", "fill": "role.lanternCore" } ] }
```

`src/data/tree/clusters/lantern_wisps.json`
```json
{ "weapon": "lantern_wisps", "prefix": "lw", "emblem": "flame", "slot": "far2", "chapter": "drowned_marsh", "hero": "thomas",
  "heart": "gt_lantern_wisps",
  "sockets": { "a": { "evo": "wisp_choir",  "gate": "gt_wisp_choir" },
               "b": { "evo": "beacon_line", "gate": "gt_beacon_line" },
               "c": { "evo": "ember_veil",  "gate": "gt_ember_veil" } },
  "outline": [
    { "id": "lw_wick",   "idx": 1,  "name": "Trimmed Wick",  "kind": "knot",    "effects": [{ "weapon": "lantern_wisps", "stat": "power",    "pct": 2 }],   "cost": { "gold": 300 } },
    { "id": "lw_glow",   "idx": 2,  "name": "Wide Glow",     "kind": "knot",    "effects": [{ "weapon": "lantern_wisps", "stat": "radius",   "pct": 2 }],   "cost": { "gold": 460 } },
    { "id": "lw_drift",  "idx": 3,  "name": "Slow Drift",    "kind": "verb",    "effects": [{ "weapon": "lantern_wisps", "stat": "duration", "add": 0.5 }], "cost": { "gold": 620 } },
    { "id": "lw_oil",    "idx": 4,  "name": "Long Oil",      "kind": "knot",    "effects": [{ "weapon": "lantern_wisps", "stat": "duration", "pct": 2 }],   "cost": { "gold": 620 } },
    { "id": "lw_kin",    "idx": 5,  "name": "Marsh-Kin",     "kind": "kin",     "effects": [{ "weapon": "lantern_wisps", "stat": "power",    "pct": 2 }],   "cost": { "gold": 700 }, "unlock": { "t": "clearChapter", "id": "drowned_marsh", "n": 2 } },
    { "id": "lw_beacon", "idx": 6,  "name": "Beacon Keeper", "kind": "mastery", "effects": [{ "weapon": "lantern_wisps", "stat": "power",    "pct": 1 }, { "weapon": "lantern_wisps", "stat": "radius", "pct": 1 }], "cost": { "gold": 1300, "shards": 1 }, "unlock": { "t": "evolveWeapon", "id": "lantern_wisps", "n": 2 } },
    { "id": "lw_flare",  "idx": 7,  "name": "Bright Flare",  "kind": "knot",    "effects": [{ "weapon": "lantern_wisps", "stat": "power",    "pct": 2 }],   "cost": { "gold": 820 } },
    { "id": "lw_hood",   "idx": 8,  "name": "Glass Hood",    "kind": "verb",    "effects": [{ "weapon": "lantern_wisps", "stat": "radius",   "add": 4 }],   "cost": { "gold": 620 } },
    { "id": "lw_halo",   "idx": 9,  "name": "Soft Halo",     "kind": "knot",    "effects": [{ "weapon": "lantern_wisps", "stat": "radius",   "pct": 2 }],   "cost": { "gold": 620 } },
    { "id": "lw_vigil",  "idx": 10, "name": "Night Vigil",   "kind": "kin",     "effects": [{ "weapon": "lantern_wisps", "stat": "duration", "pct": 2 }],   "cost": { "gold": 560 }, "unlock": { "t": "useCharacter", "id": "thomas", "n": 5 } },
    { "id": "lw_tallow", "idx": 11, "name": "Tallow Store",  "kind": "knot",    "effects": [{ "weapon": "lantern_wisps", "stat": "duration", "pct": 2 }],   "cost": { "gold": 300 } } ],
  "gates": [
    { "id": "gt_lantern_wisps", "idx": 0,  "effects": [{ "unlock": "weapon", "id": "lantern_wisps" }],  "cost": { "gold": 400 }, "unlock": { "t": "clearChapter", "id": "drowned_marsh" } },
    { "id": "gt_wisp_choir",    "idx": 12, "effects": [{ "unlock": "evolution", "id": "wisp_choir" }],   "cost": { "gold": 300 }, "unlock": { "t": "evolveWeapon", "id": "lantern_wisps", "n": 1 } },
    { "id": "gt_beacon_line",   "idx": 13, "effects": [{ "unlock": "evolution", "id": "beacon_line" }],  "cost": { "gold": 500 }, "unlock": { "t": "all", "of": [{ "t": "evolveWeapon", "id": "lantern_wisps", "n": 2 }, { "t": "useCharacter", "id": "thomas", "n": 6 }] } },
    { "id": "gt_ember_veil",    "idx": 14, "effects": [{ "unlock": "evolution", "id": "ember_veil" }],   "cost": { "gold": 600 }, "unlock": { "t": "all", "of": [{ "t": "evolveWeapon", "id": "lantern_wisps", "n": 3 }, { "t": "bossKill", "id": "drowned_king", "n": 2 }] } } ] }
```

The fixture ships with stub data for the weapon, its three evolutions, Thomas, `drowned_marsh` and `drowned_king` (test-only), so every reference validates.

Resulting layout (computed; world units, hub 0,0, y down):

| Element | Local | World |
|---|---|---|
| cluster centre (far2, r 1280, 54 deg) | 0, 0 | 752.4, 1035.5 |
| heart `gt_lantern_wisps` | 0, 64 | 752.4, 1099.5 |
| apex `lw_beacon` (mastery) | 0, -140 | 752.4, 895.5 |
| socket a `gt_wisp_choir` (flame tip) | 0, -192 | 752.4, 843.5 |
| socket b `gt_beacon_line` (left lick) | -150, -96 | 602.4, 939.5 |
| socket c `gt_ember_veil` (ember at the base) | 0, 130 | 752.4, 1165.5 |
| Thomas hero triple (r 450, 54 +- 8 deg) | - | centre lantern 264.5, 364.1 |

```
             Raven(234)            Bolts(306)
     Wolves(162)    . Hearth / Wick .    Chain(18)
                 ( Dusk ring r 960 )
           Orbit(90)          Thomas lantern (r 450, 54)
  tz_crown(252) ....... fog r 1180 ....... tz_witch(0)
                                  [far2 Lantern Wisps: r 1280, 54 deg]
  ===== chapter band 2 (Drowned Marsh) r 1600-1960, fogged until reached =====
```
Clearances the checker proves: Orbit (0, 600) and Chain (570.6, 185.4) are both 869 from the new centre (> 2 x 200 + 50); the cluster's inner edge (1084) clears the Dusk ring (960 + 22 hit + 50); neighbouring far slots are 791 apart. Budget: its knots/verbs/kin/mastery form the new `wpn:lantern_wisps` category; per-weapon weight becomes 0.08 x 5/6, so the per-weapon pool still caps at 3.2 PE and the test stays green (C.9). Screen/code changes: none (the weapon's sim and its evolutions are separate content work).

### C.5 New heroes and new chapters

- **Hero = a hero lantern triple** (`heroes/<id>.json`): 3 lanterns on the bearing of the hero's signature constellation at r 450, +- 8 deg (the checker steps the triple outward 30 units at a time if it collides). Ids `<heroPrefix>_*` (Thomas `th_`; Wren/Elias keep `ch_wren`/`ch_elias` + `wr_`/`el_`). Pattern as at launch: one signature sidegrade, one ability tweak inside the 30 s floor and the x1.75 amp cap, one visual-only; conditions `useCharacter` 3/6/10. A tree-gated hero's gate `gt_hero_<id>` ({unlock:"hero"}, permanent) is the middle lantern's medallion.
- **Chapter = a fogged band** (`chapters/<id>.json`): band k (chapter order k >= 2) = annulus r 1600 + 360(k-2) .. +360, fog until its `entry` condition (normally clearing the previous chapter). 24 node slots `{band:i}` + 2 constellation slots at the band's mid radius (for that chapter's weapons once far1-far10 are used). Kin/gate conditions may reference that chapter's enemies/boss. Launch teasers (`tz_marsh`, `tz_witch`, `tz_crown`) sit at r 1180 between far slots (0, 180, 252 deg); when their chapter ships the teaser id is reused WITH THE SAME MEANING as that band's entry lantern (`teaser:false`); saves never owned teasers, so this is safe.
- **Chapter scope (default, protects Chapter 1 balance)**: every node in band k has `scope: {minChapter: k}`: its effect applies only in runs of chapter k or later. Buying later-chapter power can never re-break Chapter 1.

### C.6 Layout checker (`npm test` and `tree-validate`)

1. **Overlap**: all placed points (nodes, sockets, hearts, display sockets) >= `minGap` 50, via the 240-unit spatial grid (O(n), replaces today's O(n^2) loop).
2. **Clearance**: cluster bounding circles (max |slot| + 22) never overlap each other, a ring band (r +- 30) or the hub pool (r 90); far slots and chapter bands stay outside the Dusk ring.
3. **Labels**: per LOD, estimated label boxes (13 px Alegreya Sans, chars x 7.2 px, max 2 lines of 18 chars) must not overlap other labels/nodes; failures list the pair (the screen still hides colliding labels at runtime).
4. **Reachability**: every non-teaser node reachable from the hub (requires / requiresAny / template parents); conditions reference existing ids; each gated weapon/evolution has exactly one gate; nothing requires a node in a LATER chapter's band.
5. **Template**: 1 heart + 11 outline + 3 sockets, kinds by index (new regions), sockets = the weapon's evolutions.
6. `tree-validate --svg out/tree-layout.svg` draws the computed layout (failures in red) for a human look.

### C.7 Ids: namespacing and permanence

- `^[a-z0-9_]{1,40}$` (existing) + `<prefix>_<name>` with a registered prefix owned by the fragment; gates `gt_<weapon|evolution|hero id>`; teasers `tz_*`; chapter rings `c<k>_*`. Launch ids that predate the rule (e.g. `su_call` in the wolf cluster) sit in a `legacyIds` allow-list (no rename).
- Every node also has a permanent `idx` (small integer, unique in its fragment, append-only): the compact save key (C.13).
- **Permanent**: never renamed, never re-used with another meaning, never silently deleted. Removing = move to `core.retired` (reuse fails compile) + a migration step that refunds it. Changing an owned node's effect/price = a migration step with a frozen price table. Gates are permanent forever.

### C.8 Versioned migrations (frozen price tables)

- Save stores `treeVersion`. On load, if lower than `core.version`, run each registered step in order (`src/meta/migrations/tree-v3.js`, `tree-v4.js`, ...), each with its OWN frozen copy of the prices/ranks/shards it refunds (`tree-v3.prices.json`; never read from current data or the save), then `sanitizeTree`. Steps are idempotent, O(owned nodes), clamp gold/shards at 1e12.
- **Additive content needs no step** (new cluster/hero/chapter/ring node: nobody owns the new ids). A step is needed only when an EXISTING id changes effect/price/ranks or is retired.
- Tests per step: previous-version fixture (owned nodes, ranks, shards, gates, seen), refund = frozen table, gates kept, hostile values clamped, idempotent, export/import round trip, hostile-save test with retired ids, unknown prefixes, unknown fragments and out-of-range `idx`; time budget (C.12).

### C.9 Budget: computed by rule, tested, raised only deliberately

- **The ceiling is computed, not typed.** Combat ceiling = sum over categories of PE-at-cap, where each category's cap and weight come from rules in `core.budget`:
  - launch categories (section 8) fixed: global damage 3.0, tags 2.1 + 2.1, cast 1.2, area 0.72, health 1.2, level heal 0.6, Status 1.2 (shared by every status forever);
  - **per-weapon pool**: each weapon cap 8%, weight 0.08 x 5/W, so the pool stays 3.2 PE whatever W is (5 more weapons add choices, not power);
  - **per chapter**: chapter band k adds its own scoped categories worth `perChapter.combat` 1.5 PE and `perChapter.sustain` 0.5 (only active in chapter >= k runs, C.5), matched by that chapter's own difficulty; so ceiling(k) = 15.3 + 1.5 (k - 1) combat and 5 + 0.5 (k - 1) sustain;
  - per cluster: the cluster's own category is its weapon's slot in the pool; a cluster may not add effects to global/tag categories (validator), so a new weapon never moves the global numbers.
- `tests/budget.test.mjs` (from the merged data): FAILS if any category exceeds its rule cap, the computed combat ceiling for any chapter exceeds `base.combat + perChapter.combat x (k - 1)` (Chapter 1 = 15.5 limit, 15.3 used), sustain likewise, a knot face > 3%, a verb exceeds its fixed limit (reroll 3, banish 3, revive 1 at <= 20%), or a region's option share < 60%. It prints the section 8 table per chapter. Fixtures: the C.4 cluster passes; an over-budget fixture (one extra heal node, sustain 5.3) fails.
- **Raising** (done once: x2 on 2026-10-20, 7d) = changing a RULE parameter, never a total: (1) short design note + bot sweep (META=full, GATES=all, both heroes, 96+ seeds) showing the targets still hold; (2) Matt decides; (3) LOCKED row; (4) edit `core.budget` and its snapshot in `budget.test.mjs` (the snapshot fails if the rule changes without it). Default answer to "the budget is full" is trim, or make the node an option/verb.

### C.10 Adding a status power node

1. Status must exist in the sim and in the STATUS registry (`src/meta/status.js`: `bleed {owner: ghost_wolves, dot, pct}`, `burn {owner: holy_orbit, dot, pct}`, `mark {owner: raven_flock, amp, secs, valued as +2 potency}`); a new status (e.g. a future Frost Bell chill) gets its sim hook first, via its own three-options design.
2. The node sits in a status bead index of the OWNER's constellation, so it is dormant until that source is unlocked (Soulstone rule) with no extra code.
3. Effect `{status:<id>, pct}` (1-3%) or `{status:<id>, secs}` (0.1-1 s; amps stay inside the x1.75 product cap; control never holds bosses). All statuses share ONE Status category (cap 8%, weight 0.15): new statuses add choices, not power. Control-duration nodes cost 0.3 sustain each (sustain is full at chapter 1: trim, use a later chapter's sustain allowance, or a C.9 raise).
4. Tests: effect hits only that status, tree-less sweeps byte-identical, budget green, amp-cap and boss-immunity tests.

### C.11 Scaffold and validate scripts (T8; documented in docs/CONTENT-GUIDE.md "How to add to the skill tree")

- `node scripts/tree-scaffold.mjs weapon <weaponId> --emblem <id> --slot far<k>|band<k>.<j> [--hero <id>] [--dry]` writes the cluster file (+ an emblem file with a placeholder 11-point ellipse if missing): template kinds pre-filled, ids namespaced, next free `idx` values, TODO names, conservative costs (C.13 economy rule), sockets bound to the weapon's evolutions from evolutions.json, four gate stubs. Refuses to overwrite, occupied slots, unregistered prefixes and retired ids.
- Also `hero <id> --signature <weaponId>`, `chapter <id> --order <n>`, `ring <ring> --i <slot>`, `status <statusId> --owner <weaponId>`.
- `node scripts/tree-validate.mjs [--svg out.svg] [--table] [--synthetic 1000|2000]` = compileTree + layout (C.6) + budget per chapter (C.9) + namespace/retired/idx + reachability + perf smoke at synthetic sizes; exit 1 on any failure.
- Scripts only read/write `src/data/tree/` and `out/`, check every id with the id regex, never execute data.
- Guide checklists: new weapon cluster, new evolution socket gate (counts via gates-pace), hero triple, chapter band, status node, ring node, retiring a node, changing an owned node (migration step), raising the budget rule. Each ends with: three-options pick done, LOCKED row, validate green, sweeps, screenshots at 3 sizes, security + fit line.

### C.12 Performance at 1000+ nodes (budgets with tests at 1000 and 2000 synthetic nodes)

`scripts/tree-synth.mjs <n>` generates valid synthetic trees (clusters on far slots and chapter bands, rings filled) used by tests and the pace harness.

| Budget | 1000 nodes | 2000 nodes | Measured by |
|---|---|---|---|
| compile + validate (Node) | <= 40 ms | <= 80 ms | tree-perf.test.mjs |
| load (parse save + migrate + sanitise) | <= 10 ms | <= 20 ms | tree-perf.test.mjs |
| tree screen first frame (desktop Chrome) | <= 150 ms | <= 250 ms | pace harness |
| pan/zoom frame time desktop p95 | <= 8 ms | <= 10 ms | pace harness |
| pan/zoom frame time phone proxy (4x CPU throttle) p95 | <= 16.7 ms | <= 22 ms | pace harness; real phone in T7 |
| live DOM node buttons | <= 120 | <= 120 | treescreen test |
| JS heap added by the open tree screen | <= 12 MB | <= 20 MB | pace harness (performance.memory) |
| tree part of the save, everything owned | <= 1 KB | <= 2 KB | save test |

How: (1) **culled rendering** through the spatial index (240-unit cells; only cells in the viewport + margin are drawn or get buttons); (2) **semantic zoom**: OVERVIEW draws only constellation emblems (cached watermark bitmaps, lit fraction as a glow, NEW/ready counts as a badge), band outlines and the hub; MID adds node beads without labels; NEAR adds labels and full states; LOD thresholds from data (scale per LOD), so 2000 nodes never draw at once; (3) cached per-cluster layers re-rendered only when that cluster's state changes; (4) pooled buttons; (5) hidden role=tree focus list holds only the focused cluster's nodes plus one entry per other cluster (keyboard/screen-reader reach every node via cluster jump, without 2000 hidden buttons); (6) no idle animation loop (flicker pauses when hidden and under reduced motion).

### C.13 Growth: navigation, lazy data, compact saves, economy

- **Navigation at scale** (all data-driven): search/filter (`F`: name, effect words, kind; filters can-buy / ready / NEW / by spirit / by status / by chapter; results pulse at every LOD and list in a panel with fly-to); **minimap** (one cached bitmap of the whole web from cluster centres and band outlines + the viewport box; tap to jump; phones: in the constellation index sheet); **bookmarks/fast travel** (the constellation index lists every cluster, ring and band from data with lit counts; the player can pin up to 5 bookmarks, stored per profile in the save, ids validated); "Next lights" board stays the goal finder.
- **Lazy, region-scoped data**: at runtime only `core`, the chapters the player has reached and every fragment that holds an owned or condition-tracked id are compiled at open; a fogged band's fragment is compiled the first time it is reached or scrolled into view (its outline is drawn from `core` alone). Validation of ALL fragments still runs in `npm test`/`tree-validate` at build time, so lazy compile never meets bad data. In the single-file build the JSON is inlined anyway; the saving is parse/compile/layout time and memory, not download.
- **Compact save** (built with the T2 migration, cheap now, painful later): `save.tree = {v: <treeVersion>, o: {<fragmentPrefix>: "<base64url bitset by idx>"}, r: {<id>: rank}}` (`r` only for ranks > 1); `save.seen` the same bitset form. 2000 nodes all owned ~ 250 bytes of bitsets + a few rank entries. Decoder: bitsets length-capped per fragment, bits beyond the fragment's max `idx` ignored, unknown prefixes dropped, ranks clamped; then the normal sanitiser. Export/import uses the same form. Old object-form trees (v1/v2) are read once by the migration and written back compact.
- **Economy scaling rule**: a cluster costs about 5 runs of gold at the chapter it belongs to (launch constellations ~9-11k gold at ~1,800/run); later chapters pay more gold per run (chapter gold multiplier, a chapter-design parameter), so adding five weapons (+~50-55k gold at Chapter 1 prices, ~124k total, ~69 bot runs) does NOT mean 69 Chapter 1 runs: new weapons arrive with later chapters whose runs pay more, keeping each cluster ~5-6 runs to complete. Shards scale the same way (one per mastery, keystones per chapter boss). The scaffold sets costs from this rule; T5's gates-pace and economy probe check it per chapter.
- **Power with five more weapons**: per-weapon pool fixed at 3.2 PE, Status fixed at 1.2, no cluster may touch global/tag categories, so Chapter 1's ceiling stays 15.3/15.5 and 5 sustain; only chapter bands add power, scoped to their chapters (+1.5 combat / +0.5 sustain each by rule).

### C.14 What must be in T1/T2/T4 (cheap now, painful later) vs later chunks

| Item | Chunk | Why now / why later |
|---|---|---|
| Fragment loader + full schema + validator, namespaces, `legacyIds`, `retired`, permanent `idx` on every node | **T1** | ids/idx are written into saves: adding them after launch means a migration of every player |
| Template expansion (outline -> requires, apex, sockets), reserved far slots + fog band + chapter bands in `core` | **T1** | positions must never be hand-typed; moving launch clusters later would move players' maps |
| Budget RULE (computed ceiling, per-weapon 5/W weight, chapter scope field) + budget test + snapshot | **T1** (test) / **T3** (soft cap in aggregateMods) | a hand-typed ceiling invites drift; chapter scope must exist before any chapter-2 node |
| Spatial-grid overlap check, synthetic 1000/2000 generator, compile/load perf tests | **T1** | O(n^2) checks and slow compile are invisible at 125 nodes and painful at 2000 |
| Compact save (bitsets by idx, ranks map, compact `seen`), `treeVersion`, migration registry with frozen tables | **T2** | the v2 -> v3 Regrowth migration rewrites every save anyway; doing compact later = a second full migration |
| Culled rendering + semantic zoom (overview = emblems only) + pooled buttons + cluster-jump focus list + no hard-coded lists (grep test) + perf budgets at 1000/2000 | **T4** | the screen architecture; retrofitting culling/LOD into a draw-everything screen is a rewrite |
| Constellation index with fast travel (data-driven list) | **T4** | the phone fallback needed at launch anyway |
| Data-driven emblem renderer, minimap, search filters, bookmarks | T5 | look/UX on top of the T4 architecture; can grow without touching data or saves |
| Region-scoped lazy compile | T7 or the first chapter-2 chunk | Chapter 1 alone is ~125 nodes; the API (compile per fragment) exists from T1, the switch is flipped when a second chapter ships |
| CONTENT-GUIDE + scaffold/validate scripts | T8 | written last so they match the built code |

## Appendix D. T4/T5 design phase: interactive prototype + progression timeline (2026-10-21, design only, NOT locked)

Quality gates 1 and 3 of LOCKED 'SKILL TREE = TOP PRIORITY'. No game code changed.

- **Prototype**: `docs/mockups/tree-screen/tree-screen.html` (self-contained, ~1 MB; open in any browser on PC or phone). Built by `node docs/mockups/tree-screen/build.mjs` from the REAL fragments (composeTree) with the REAL rules bundled in (compileTree, nodeStatus, buy, describeNode, closestUnlocks via esbuild, already a Vite dependency). Canvas map, pan/drag, wheel/pinch zoom, three LODs (far = emblems + group names + counts, mid = beads, near = labels), states owned / CAN LIGHT NOW (candle-white ring + 8 rays + amber halo, pulses; reduced motion static) / not enough yet (brass ring, "415 gold short") / not yet woken (teal arc) / locked / spirit asleep (dashed) / fog, NEW flag on ready seals, "N can light" badge + jump to next (N), "Only lightable" filter, Next lights goal tracker (pin up to 3, suggestions fill the rest), two-step buy, constellation index with fast travel, completion lighting + title toast, hub lantern and background brighten with total progress ("The Hollow remembers"), reserved far slots as "?" stars, fogged chapter bands. Desktop right panel, phone landscape side sheet, phone portrait bottom sheet. Prototype controls (gear): save presets from the timeline sim, bank a run, 3 datasets (launch tree / 1000-node synthetic / 1000-node staggered-band proposal). Screen code names no weapon, hero or chapter (role colours arrive as data). Screenshots `ts-*.png` (1280x720, 844x390@2x, 390x844@2x) by `shoot.mjs` (own Chrome, port 9383, profile deleted after; also runs a buy-flow check and draw timing).
- **Timeline**: `node scripts/tree-timeline.mjs [--live] [--nodes 1000]` simulates human-model players (24 x 100 runs; growth 12 x 320) against the real compiled tree, buying greedily (permanent gates first, 40% "savers"). Runs are a MODEL calibrated to economy 9.3 (human gold 0.75x bot) and the locked win bands, not the Sim.

| Tree | Whole tree (median, p10-p90) | Dead zones before completion | Notes |
|---|---|---|---|
| Live today (123 ownable) | run 43 | none (longest gap without a purchase: 2 runs) | 4-9 buys per visit early |
| Design, all 150 ownable (tool + tier nodes as built) | run 61 (44-86), 25% unfinished at 100 | none in runs 1-25; from ~run 38 a GOLD DEAD ZONE: nothing to buy, gold piles up (40% of later runs; median 23-run gap) | long poles = condition-only: Three Dawns (9 stars), Elder Treant Tells (15 kills), Fifth Hook |
| Growth, 1005 ownable (synthetic, chapter gold x(1+0.6(k-1)), cluster = 5 runs at its chapter) | run 116 (108-127) | 1.2% of runs | synthetic conditions are trivial, so this checks gold pacing only |

Milestones (design tree, median run): first buy 1, first Twilight clear 3, Raven Flock 9, Spirit Bolts 13, first Deep Dusk clear 16, Chain Lightning 21, first Long Night clear 28, all five constellations complete 29-32, 90% of nodes 36.

**Weak spots found and fixed in the prototype**: (1) root lanterns far from the hub drew spokes across the whole web: threads now start at the constellation heart or group centre; (2) suggested goals included blocked nodes ("Requires X"): only goals you can move by playing; (3) group labels collided at far zoom: collision avoidance incl. the count line; (4) presets showed post-spend saves (0 lightable): presets are the moment a run has just been banked; (5) per-node gradients/glows at small sizes were slow: flat fills when small, glow only at near zoom (headless software rendering, noisy: 156 nodes 2-3 ms desktop / ~14-19 ms at 4x throttle; 1000 nodes 4-10 ms / ~23 ms); (6) the screenshot script waits for Chrome to exit and deletes its temp profile.

**Open (need Matt or a later chunk)**: (a) endgame gold dead zone above; (b) early on 14-30 lanterns are lightable at once, so the highlight is everywhere: add ONE "best next" marker on top of it; (c) the C.5 band rule (2 constellation slots per band at 90/270 deg) stacks a 1000-node tree into one vertical spine out to r ~11,000 (`ts-desk-1000.png`); 6 staggered slots per band keeps it a web out to r ~4,800 (`ts-desk-1000-staggered.png`): needs a reopen of the locked C.5 rule; (d) T4 still owes the hidden role=tree focus list, pooled DOM buttons and baked glow layers (not in the prototype); (e) the model uses the 2026-10-18 bot income (before boss HP 36000): re-check with gates-pace/econ-pace in T5.
