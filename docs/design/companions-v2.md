# Companions v2: design + migration plan (DRAFT for review, NOTHING LOCKED, NOTHING BUILT)
Date 2026-11-15. Branch wip/companions-design. Builds on docs/design/companions-v1.md (framework + Tracker + Wick LOCKED 2026-11-15) and docs/research/32-standing-summons.md.
Scope of this sheet: what happens to Ghost Wolves and Raven Flock, their 6 evolutions, the tree, codex, starter pick, Bond, balance, build order. Decisions Matt must make are numbered QUESTIONS (section 10).

Already locked (not reopened here): companions grow with hero Bond between runs, never hurt or lost, no run cards; Holy Orbit stays a weapon; 4 magic weapons = Spirit Bolts, Chain Lightning, Holy Orbit, Dragonfire Meteor; Wren = The Tracker (~5-8% of Wren damage, runs the Pelt Dash line); Elias = The Wick (one hit every ~20 s, feeds Sanctuary Ring, ~4-6% survival, no damage); next update = Lucinda released + companions (LOCKED NEXT UPDATE SCOPE).
This sheet REOPENS (needs Matt's explicit reopen, per LOCKED 'SUMMONS BECOME HERO COMPANIONS'): V1 weapons scope, the 15 evolutions, progression gates (Ravens as a gate), starter pick list, tree branch rows for wolves/ravens, Bond row (if Q4 is taken).

## 0. What exists today (checked in the code, dev @ b700ef8)
| Thing | Today | Where |
|---|---|---|
| Weapons | ghost_wolves + raven_flock `type: summon`; 3 magic + Meteor (unreleased) | src/data/weapons.json |
| Evolutions | wolves: Lightfoot Pack (`phantom_stampede`, speed+power), Howling Legion (`howling_legion`, count+duration, starter evo, no gate), The Alpha (`dire_alpha`, power+duration). Ravens: Wall of Wings (`murder_storm`), Talon Mark (`dive_bombers`), Spearhead (`spearhead`) | src/data/evolutions.json |
| Starter pick | balance.starter.weapons lists both summons; Wren `kindred: ghost_wolves` (default pick + Sim fallback when the start id is bad) | balance.json, characters.json, Sim.js l.80 |
| Free starter grant | wolves: `gt_ghost_wolves`; ravens: `gt_raven_flock` + `gt_dive_bombers` (frozen STARTER_V5) | src/meta/migrations/tree-v5.js |
| Tree (all RELEASED in v5 snapshot, 283 ids) | wolves cluster 15 ids (heart, 2 seals, 11 stat/status/mastery incl. su_call, Kindling Start) ~6,720 gold + 1 shard; ravens cluster 16 ids ~8,080 gold + 1 shard; summons ring `su_*` 5 ids 3,660 gold + 3 shards (keystone Bonded Pack = summons +3%, magic -3%); roads `wf_way1-6`, `rv_way1-5` (generic: Soul Magnet, gem speed, ability +5%, evolutions +10%) ~2,400 gold | src/data/tree/clusters/*.json, core.json, tests/fixtures/tree-released.json |
| Who depends on them | only the wolf/raven clusters themselves (`su_call` needs the wolf heart). Kill-count gates on Fell Wolf / Grave Crow are ENEMIES, unaffected | tree scan |
| Statuses | bleed owned by ghost_wolves, mark owned by raven_flock | src/meta/status.js |
| Codex | append-only ENTRY_KEYS hold `e:` for all 6 evolutions, `c:ghost_wolves`, `c:raven_flock`; `p:ophimber` already reserved (prefix p = a hero's pet) | src/meta/codex.js |
| Titles | Friend of Wolves / Friend of Ravens earned by completing that weapon's Almanac page; `c:spirits` and the book need every evolution found | codexcopy.js TITLES, codex.js l.286-297 |
| Bond | cap 25, 20,500 XP (~110 runs), totals at cap HP +10 / ward 8 / speed +6 / damage +5 %, perks at 5/10/15/20/25 same for every hero. Bond 25 alone is worth +45-56 win points (QUEUE CH4-6) | balance.json bond |
| Save | SAVE_VERSION 3, tree core.version 5, migration registry with frozen price tables, retired ids = tombstones | src/save/schema.js, src/meta/migrations/ |

## 1. Ghost Wolves and Raven Flock as weapons
Proposal (the same for both):
- Add a data flag `retired: true` on both weapons (kept in weapons.json for one release so codex pages, old scripts and Mara's later raven companion can read the data). Retired = never offered: not in level-up cards, not in starter pick, not a valid start weapon, no tree heart. Code paths stay until a later clean-up chunk.
- Runs in progress: nothing is saved mid-run (crash/close = nothing banked, LOCKED), so no live run can hold a wolf after the update. A tab still running the old build banks with the old code; the next load migrates.
- `notes.loadout.weapon` / `notes.starter.weapon` = a retired id: sanitiser falls back to the hero's kindred (no crash, no prompt). `stats.startWeapon` counts are history and stay.
- Sim: `startWeapon` that is retired -> kindred (same path as a bad id). Wren's `kindred` must change to a magic weapon (QUESTION 2).
- URL debug params: `?grant=ghost_wolves...` and `?auto=` with a retired start are ignored with a console warning (debug params never write saves; tests/debug-saves.test.mjs classifies the change). A dev-only `?retired=1` lets old probes still run the summons for comparison.
- Scripts that hard-code ghost_wolves/raven_flock (~80 files, mostly shot/probe scripts) are NOT rewritten: the sweep set in section 6 is updated; the rest get a STALE banner when they are next touched.
- Ravens in the meantime (Mara not launched): ravens leave play entirely. Their art (Letter Ravens), sim code and the three raven evolutions stay in the repo, inactive, for Mara's companion. Almanac keeps their pages. No zero-power ambient ravens (clutter, and a promise of something you cannot use).

## 2. The six evolutions: three options
| | A. Companion milestones (RECOMMENDED) | B. Fold into magic weapons | C. Retire all six |
|---|---|---|---|
| What | Wolf verbs become The Tracker's Bond milestones (one ladder, no choice): Lightfoot trail, Howling Legion echoes, The Alpha bite, scaled down to one pup. Raven verbs wait for Mara's raven companion (her milestones later). | Move the verbs into weapons: e.g. Lightfoot trail -> Spirit Bolts, Echo Pack -> Chain Lightning, Alpha -> Meteor, raven three -> Orbit/Bolts | Tombstone all 6; companions get fresh, smaller milestone ideas (three-options rounds) |
| Fit | Good: the wolf verbs were already Wren's; she keeps "her pack" in miniature | Poor: wolf verbs on glyphs/lightning do not fit those spirits; breaks the LOCKED 3-per-weapon sibling rule (weapons would hold 4-5) | Neutral: clean, but players lose the Alpha (Matt's favourite hero's best moment) |
| Power | Small by construction (one pup; capped inside the Tracker's 5-8%) | Large: each is a full evolution at 1.8-2.3x, needs home-scenario tuning for each | Lowest risk |
| Cost | Medium: 3 small companion verbs (reuse trail/echo/cleave sim parts), 3 three-options-light checks, codex pages reused | Largest: 6 re-designs, sweeps per weapon, tree branch templates change shape | Smallest build; refunds only |
| Codex | `e:phantom_stampede` etc. pages become the milestone pages (same bits) | bits kept, new pages | bits kept as "old tales" |
| Risk | Pup becomes a hidden 5th weapon if the milestones stack; must be bounded by the share target | balance + fit | feels like taking toys away |
Recommendation A: wolves' 3 evolutions = Tracker milestones at Bond 10 / 15 / 25 (table in section 5); ravens' 3 = parked for Mara (design round when Mara starts). The six evolution entries get `retired: true` (no gold card ever); their tree seals retire with refunds (section 3). Note: milestone behaviour is new content, so the new-content rule applies: each milestone still gets a short three-options round before lock (cheap: verb is given, options differ in numbers/feel).

## 3. Tree migration (core.version 5 -> 6)
Rule (LOCKED H3 + TREE RESTART pattern): any change to a released id needs a core.version bump + a migration step with a FROZEN price table, guarded by tests/treerelease.test.mjs. Retired ids become tombstones `{id, frag, idx}` in core.json `retired` (id and slot never reused).

Recommended step 6 `retireSummons` (NOT a full restart; only the summon ids):
| Ids | Count | What happens | Refund |
|---|---|---|---|
| Wolf cluster `gt_ghost_wolves`, `gt_phantom_stampede`, `gt_dire_alpha`, `su_call`, `wf_fang/bite/coat/maul/hunt/third/scent/bleed/rend/lope`, `wf_kindling` | 15 | tombstone | full price PAID (frozen v5 price x rising-price steps, bounded like tree-v5.js) |
| Raven cluster `gt_raven_flock`, `gt_dive_bombers`, `gt_murder_storm`, `gt_spearhead`, `rv_talon/quill/wide/glide/eye/watch/oath/wing/kin/beat/peck`, `rv_kindling` | 16 | tombstone | same |
| Summons ring `su_bond`, `su_pot`, `su_swift`, `su_rush`, `su_key` | 5 | tombstone (they buff nothing once summons are gone; the keystone would be a pure -3% magic nerf) | same (gold + shards) |
| Roads `wf_way1-6`, `rv_way1-5` | 11 | KEPT, owned, effects unchanged; `requires`/position re-pointed so they lead to the hero/companion landmark (or onward) instead of a dead heart. Ownership never depends on links (M1), so nobody loses them | none |
| Free starter nodes (wolf/raven starters) | 1-2 | not refunded (they were free) | replaced: grant a magic heart + its first seal (Q2) |
Max refund for a veteran who owned everything: about 18,460 gold + 5 shards (before rising-price steps). Exact numbers come from the frozen table, not this sheet.

Compensation (beyond the refund): the refund is shown with the existing one-time notice pattern (`treeResetNotice`-style, new key `summonsNotice`, shown once on the title/tree): "Your wolves now walk with Wren as her pup; the spirits you lit are returned as N gold." Titles already earned are kept forever (`titles.got` is saved). Discovered evolutions stay discovered. Optional (not a question, Claude's default, Matt may drop it): a zero-power "Old Pack" costume palette for the pup for any save that had evolved Ghost Wolves at least once (append-only cosm.earned, fixed id).

Implementation (C7):
- `src/meta/migrations/tree-v6.js` + `tree-v6.prices.js` (FROZEN copy of the v5 price/creep/max-rank/shard rows for the 36 retired ids + V5_IDS forge guard, same shape as tree-v5.prices.js). Pure, idempotent, untrusted-input safe, never reads live data.
- Forge guard: a tree that owns any id that only exists in v6+ does not replay the refund (as tree-v5.js does).
- Starter replacement: if the save's starter (`notes.starter.weapon`) is ghost_wolves/raven_flock AND the tree owns no magic heart, grant the replacement starter set (frozen STARTER_V6 map). If it owns a magic heart already, nothing is granted (the refund covers it).
- tests/fixtures/tree-released.json: v5 block untouched; a v6 snapshot is taken only at the launch merge (`node scripts/tree-release.mjs --snapshot`, LAUNCH-CHECKLIST).
Fixtures needed (tests/fixtures/saves/, each with a test):
1. v5 Wren + wolves starter, owns only the free heart, no magic heart -> gets replacement heart + seal, 0 refund, loadout falls back.
2. v5 raven starter (heart + Talon seal free) -> same, Talon seal not refunded.
3. v5 veteran owning all 36 ids with rising-price steps and shards -> exact refund equals frozen table sum; roads still owned.
4. v5 Elias + Orbit starter who never touched summons -> byte-identical tree, 0 refund, no notice.
5. Idempotency: run step 6 twice -> second run refunds 0.
6. Forged stamp (v6-only id with v5 stamp) -> no replay.
7. Newer-version save -> read-only, untouched (H1).
8. Hostile: ranks 1e9, strings, arrays, prototype keys -> bounded, no throw.
9. Codex bits for all 6 evolutions + both `c:` keys set, titles Friend of Wolves/Ravens owned -> kept, not NEW again.

## 4. Codex / Almanac and the starter screen
- ENTRY_KEYS stay append-only. Append (end of list): `p:tracker`, `p:wick` (prefix p = a hero's pet, like `p:ophimber`), and if option A, nothing more: the 3 wolf `e:` bits become the Tracker milestone pages (same bit, new page text). Raven `e:` bits and `c:raven_flock` stay as Spirits pages marked "resting until Mara wakes".
- Completion sets must skip retired content, or new players can never complete `c:spirits`, the book or the titles: `c:spirits` counts live evolutions only; the book counts live pages only (already the rule for `c:book`); Friend of Wolves re-points to "The Tracker reaches Bond 25" (title id unchanged); Friend of Ravens waits for Mara (cannot be earned until then; owners keep it).
- Starter pick (`balance.starter.weapons`) = the 4 magic weapons (Meteor joins at DM10, same update). Wren's kindred = Q2. The spirit step already shows only offered ids; the hero card gains a companion line ("with her pup, the Tracker").
- Characters page: companion panel next to the Bond bar (milestones lit/dim, same pattern as the five Bond gifts). Tree left panel already reserves hero-with-companion (LOCKED TREE REWORK DIRECTION 3).

## 5. Bond: what the companion does at each level
Principle: one growth axis (Bond). No tree nodes add companion power (keeps the soft-cap budget clean; cosmetic companion nodes later are fine).
Cap: keep 25 for this update (LOCKED DECISION GATE: the 25 vs 30/35 review belongs to the Chapter 2 balance chunk). The ladder is written so 30/35 can append milestones without changing old ones.
Budget problem: Bond 25 is already worth +45-56 win points and DM9 shows max bands Wren 87 / Elias 96 / Lucinda 91 (band 65-90). Adding companion growth on top pushes max over 90. Recommended fix (Q4, second batch): companions are budget-NEUTRAL: the Bond `damage` row (+5% at cap) is removed for every hero and the companion's growth replaces it (Tracker = damage, Wick = survival, Ophimber = her Rise). Same ladder size for all heroes (LOCKED "same ladder for every hero" kept in spirit; reopen needed).

The Tracker (Wren). Targets: 5-8% of Wren's damage at Bond 25, ~3% at Bond 0. Bite scales with Wren's in-run level (automatic, not a card) so it does not fade late.
| Bond | Step | Milestone (option A) |
|---|---|---|
| 0 | pup follows; bites the weakest/most wounded foe within ~90 u every ~1.4 s; on Pelt Dash runs the dash line and bites what Wren passed | - |
| 1-25 | each level: bite +3% (about +75% at 25) | - |
| 5 | (Bond perk Pup's Nose, unchanged) | Keen Nose: hunt radius 90 -> 110 u |
| 10 | | LIGHTFOOT (from Lightfoot Pack): the dash run leaves a 1.5 s light trail that bleeds foes crossing it |
| 15 | | HOWL (from Howling Legion): after Pelt Dash, up to 2 echo wolves rise from foes the pup kills, for 4 s |
| 20 | | Red Thread: bites bleed (bleed potency shared cap) |
| 25 | | THE ALPHA'S BITE (from The Alpha): every 5th bite cleaves foes beside the target |

The Wick (Elias). Targets: ~4-6% survival at Bond 25, ~2% at Bond 0; zero damage.
| Bond | Step | Milestone (needs its three-options-light round) |
|---|---|---|
| 0 | holds one ward charge; absorbs one hit, relights after 24 s | - |
| 1-25 | each level: relight -0.2 s (19 s at 25) | - |
| 10 | | Ring Lamp: if charged when Sanctuary Ring is planted, the ring lasts +1 s |
| 15 | | Warm Wax: an absorbed hit also heals 2 HP |
| 25 | | Steady Flame: absorb flash nudges small foes back 16 u |
Ophimber (Lucinda): her Bond growth is not designed (gap, see critique). Raven companion: deferred until Mara launches.
Measured, not guessed: each table row is a starting point; C9 measures share and win points and Matt decides if a target moves.

## 6. Balance plan
Why "identical sweeps" are impossible: removing two weapons changes every card draw, so every seed diverges. New baseline procedure:
1. BASE-0 (before any change, current dev): sweep-all.mjs, rt-matrix.mjs (META tiers GATES=preset BOND=0/25), boss-sweep.mjs, bless-sweep.mjs, 96 seeds per cell, both heroes + Lucinda (hidden), every starter; archive to docs/companions-data/base0/.
2. BASE-1 (retire switch on, companions OFF via flag): same matrix. Isolates the pool change.
3. COMP (companions ON): same matrix + PAIRED on/off ablation (same seeds, 300 pairs, like DM9) for Tracker, Wick, each milestone: win points, damage share (Tracker), hits absorbed / HP saved (Wick).
4. Compare distributions with CIs (report seed counts and +-noise), never seed-by-seed.
Targets (LOCKED FINAL RETUNE TARGETS + CLAUDE.md): fresh Twilight 15-30% per starter, within ~6 pts of the median starter; mid tree 30-55%; max Bond + full tree 65-90%; boss: reachers win 60-75%, boss 20-35% of defeats, fight 75-100 s; no deaths before ~5:00, spread 6-14 min; evolutions 1.8-2.3x, cap 3x (untouched weapons need no re-check unless BASE-1 moves them); hero gap small; ability on-off +2-5 pts; Tracker 5-8% damage, Wick 4-6% survival.
Expected shift (ESTIMATES, to be measured):
| State | Expected | Why |
|---|---|---|
| Fresh | pooled -2 to -5, then +2 to +4 back from companions | Ravens starter (40-50%, accepted above band) leaves; Wolves starter (25-26) leaves; fresh runs only use the starter weapon |
| Mid tree | Wren -3 to -8 | she loses her strongest kindred synergy; pool 5 -> 4 |
| Max | roughly flat, maybe up | every run ends with the same 4 magic weapons (no weak picks); plus companion growth unless Q4 offsets it |
| Long Night | Wren may improve | the 3% Wren-with-Wolves cell disappears |
Bots: random-pick and FOCUS bots need the new pool (data-driven, should follow the flag) and Lucinda/Meteor included once DM10 lands. Stale scripts (gates-kits/softcap/ablate) stay stale.

## 7. Build chunks (one at a time, each with tests + build + sweeps as relevant + shots + security + fit)
| # | Chunk | Done-check |
|---|---|---|
| C0 | Matt answers Q1-Q3 (then Q4-Q6); LOCKED rows + reopen list; independent review of this sheet | rows in LOCKED, review summary |
| C1 | BASE-0 sweeps archived | numbers file, seed counts |
| C2 | Tracker sim (RNG-free, fixed update order, behind `unreleased` flag, `?companion=1` debug) | determinism test, share at Bond 0/25, no perf regression |
| C3 | Wick sim + Sanctuary feed | tests, absorb counts, on/off pairs |
| C4 | Art/audio: pup from the Lantern-Heart wolf rig (36-42 px, pale blue, light trail), Wick from the candle-flame; light-in/light-out FX reused | true-size + phone shots, Low/High quality |
| C5 | Milestones (option A ladders) after their short three-options rounds | each milestone on/off pairs |
| C6 | Retire switch: `retired` flag, starter list, kindred, loadout/params sanitising (companions still flagged) | tests incl. debug-saves, BASE-1 sweeps |
| C7 | Tree step 6 + frozen table + tombstones + roads re-pointed + starter replacement + notice | 9 fixtures, treerelease guard, tree-validate, pacing chart (pace-v2) for no new dry stretch |
| C8 | Codex/titles/Characters page/results Bond beat lines for companions | codex tests (append-only, completion skips retired), shots |
| C9 | COMP sweeps + retune (only levers Matt approves if a target moves) | report vs every band |
| C10 | Phone feel + heat check, exploit pass, release snapshot at merge (Matt's yes) | LAUNCH-CHECKLIST items |
Order note: build and feel-test the pup (C2-C4) BEFORE the retire switch (C6), so Matt can compare "pup + no wolves" against today on the dev link and stop if it feels worse.

## 8. Risks
- Wren feel: from a pack of 2-7 wolves to one pup. Biggest taste risk; mitigated by C2-C4 first and a side-by-side on dev.
- Hidden fifth weapon: milestones + per-level growth can creep past 8%. Hard caps in data, measured each chunk.
- Max band breaks: Bond already +45-56 pts; Elias max 96 is already over 90. Without Q4 the companion pushes further.
- Migration bugs touch real saves on main: wrong refund or a profile with zero usable weapons. Covered by fixtures 1-9; the zero-weapon case is the nastiest.
- Codex/titles become unearnable if completion counts retired content.
- Tree pacing: removing 36 buyable nodes (~18.5k gold of sinks) shortens the mid-game; Q0 pacing dry stretches may grow. Re-run pace-v2.
- Raven art and code sit idle for months and rot; tests must keep compiling them while flagged.
- Scope: this lands in the same update as Lucinda; two big changes in one release make bugs hard to trace.
- 80 scripts reference the summons; a careless global edit could break probes nobody runs any more.

## 9. INDEPENDENT CRITIQUE (sceptical reviewer)
- Four magic weapons in four slots means every long run ends with the SAME four weapons. The only build choice left is which evolution. That is a real variety loss in a game whose tree pitch is "unlock options". This is not a nice-to-have: it should be decided before C6 (Q3).
- The sheet treats refund as compensation. Veterans who built the wolf branch lose the thing, not the gold; gold buys nodes they may already own. Expect "I liked wolves" feedback. The costume nod is cheap goodwill but not a substitute.
- Option A smuggles 3 evolution-scale ideas into a companion that is meant to be 5-8%. Tiny versions of Lightfoot/Howl/Alpha may read as weak copies of what players remember. Option C (fresh, smaller ideas) may feel better and be honest; worth a mockup before choosing A.
- Lucinda ships in the same update with Ophimber as an ability-only pet. Under the companion framework every companion has a between-ability job and Bond growth; Ophimber has neither. Either design it now or the three heroes are inconsistent at launch of the feature.
- Retiring the su_ ring (5 nodes, one keystone) is right mechanically but leaves a hole in a released ring; the ring layout and its pacing were tuned. Re-pointing them to "companion" would break the one-growth-axis rule; leaving holes looks unfinished. Needs a layout pass, not just tombstones.
- Wren's kindred becoming a magic weapon weakens the hero/spirit identity the starter screen was built around ("Walk with Wren · Ghost Wolves"). The pup carries it only if the hero card says so clearly.
- Mid-tree Wren is likely to drop, and the RT retune is the only lever; that means another retune pass right after a big one.
- The plan has 11 chunks plus Lucinda's DM10; "next update" may slip. Consider shipping Lucinda first, companions second (contradicts LOCKED NEXT UPDATE SCOPE, so only Matt can change it).
- Keeping retired data "for one release" tends to become forever. Put the clean-up chunk in QUEUE with a date.
- Ravens disappear for everyone until Mara. Players who started with Ravens (fresh win 40-50%, the easiest start) lose the friendliest opening; new players lose a starter option too.

## 10. QUESTIONS for Matt (ask max 3 at a time; most blocking first)
Batch 1 (blocks C2/C5/C6):
1. What happens to the six evolutions? (A, Recommended) wolf three become the pup's Bond milestones, raven three wait for Mara; (B) fold them into magic weapons; (C) retire all six, design new small milestones fresh.
2. Players whose first spirit was Wolves or Ravens, and Wren's default spirit: (A, Recommended) a one-time "choose your new first spirit" screen (the existing spirit step) grants that heart + first seal free; Wren's default becomes Spirit Bolts; (B) everyone gets Holy Orbit free, Wren defaults to Chain Lightning; (C) no free grant, refund only (risk: profiles with no usable weapon need a forced pick anyway).
3. Four weapons for four slots means every long run ends with the same four: (A, Recommended) accept for this update and queue a 5th magic weapon three-options round straight after; (B) cut to 3 weapon slots (big rebalance); (C) hold companions until a 5th magic weapon exists (delays the update).
Batch 2 (blocks C7/C9):
4. Companion power vs Bond: (A, Recommended) budget-neutral: drop Bond's +5% damage row for every hero, companions fill it; (B) companions on top, retune bands; (C) companions fixed strength (no Bond growth; reopens the framework).
5. The 5 summons ring nodes: (A, Recommended) retire with full refund and re-lay the ring; (B) re-point to "companion" (adds a second growth axis); (C) keep as dead nodes (no).
6. Ophimber: (A, Recommended) design her between-ability job + Bond ladder now so all three heroes match at release; (B) ship Lucinda with an ability-only pet, add later.
Defaults taken without asking (Matt may override): migration is a targeted step 6, not a full restart; roads stay owned and re-pointed; titles kept; Bond cap stays 25 until Chapter 2; Old Pack costume for evolved-wolves saves; `retired` data kept one release then removed.

Fit check: companions follow the hero in the Warm Lantern look (pale-blue pup trailing light, a tiny candle-flame), restore the summoner fantasy through the hero, no gore, no clutter; mechanically one growth axis (Bond), bounded shares, deterministic sim.
Security check: docs only. The plan keeps saves untrusted (frozen tables, idempotent, forge guard, hostile fixtures), no new dependencies, debug params still never write saves.
- Decisions 1-3 LOCKED 2026-11-15: retire all six evolutions; choose-new-spirit screen; accept 4 weapons then design a 5th. Next batch: Bond damage row, 5 summons ring nodes, Ophimber between-ability job.
- Decisions 4-6 LOCKED 2026-11-15: companion power replaces Bond +5% damage; retire+refund 5 ring nodes; design Ophimber everyday job now. Remaining before build: pup Bond steps (no evolutions now), look rounds (Tracker, Wick, Ophimber job), independent review of the final plan.
- Tracker Bond steps LOCKED 2026-11-15: 5 gem fetch, 10 pawprint speed trail, 15 mark on bite, 25 once-per-run howl stagger. Elias Wick and Ophimber steps still to design with the look rounds.
