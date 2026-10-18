# 38 - Skill tree v2: layout, constellations, reveal, progress display, phone and performance

Checked 2026-10-18 for design sheet #5 (docs/design/skill-tree-v2.md). Tags: OFFICIAL (developer/store/official guide), COMMUNITY (wiki, guide, forum), OPINION (review, blog, my own inference). Paraphrased, no copied text.
Not repeated here (already in the repo): file 19 (Spirit Hunters: Infinite Horde web, currencies, no-respec complaint), file 22 (gate families, balance techniques, PoE/Grim Dawn/D4/Last Epoch/Brotato/StS/Hades/Halls of Torment/Soulstone/Death Must Die/Dead Cells/RoR2/Hollow Knight notches), docs/design/progression-gates-v1.md (PE budget, soft cap, gate list) and skill-tree-v1.md (schema, sanitiser, bot finding). This file adds what sheet #5 needs: SHAPE and LOOK of a big tree, reveal, progress display, phone ergonomics and rendering cost.

## 1. Headlines

1. **A constellation sky map is a proven shape for "a web you explore".** Grim Dawn's Devotion screen is a star map where each constellation is a picture (an animal, a tool, a god) made of stars; a constellation opens from a starting star, brighter stars carry a power, and completing one feeds affinity that opens further ones (OFFICIAL grimdawn.com guide; COMMUNITY forum tools exist because the map is dense). This is the closest precedent for Matt's emblem constellations and it is beloved enough that fans built planners for it.
2. **Players read big trees through a node-size ladder.** Path of Exile separates small passives, larger named "notables" and build-changing keystones (plus jewel sockets), and the bigger icon is exactly how players see what a cluster is for at a glance (COMMUNITY PoE wiki). Diablo 4's Paragon boards do the same (normal / magic / rare / legendary; file 22).
3. **Search/highlight and zoom are mandatory past ~150 nodes.** PoE's tree has a search box that pulses matching nodes and keeps them visible at full zoom-out, and zoom by wheel or slider (COMMUNITY PoE wiki, maxroll beginner guide). Our v1 has zoom but no find.
4. **Locked things must stay readable.** Spirit Hunters reviews call the web obscure and locked nodes hard to see (file 19, OPINION); Soulstone Survivors fogs later tree sections and players were confused when the fog did not lift (COMMUNITY Steam threads). Lesson: fog the far future, but never hide what a locked node needs or how far along you are.
5. **Unlocks tied to specific play, shown with a goal, are what make players replay.** Vampire Survivors Arcanas each name a concrete task (reach level 50 with a given character, survive to minute 31 on a given stage, beat a specific boss) behind one discovery (the Randomazzo relic) (COMMUNITY rogueranker, vampire.survivors.wiki); Slay the Spire shows a per-character score bar that unlocks cards/relics at thresholds (COMMUNITY slaythespire.info, Steam). Both are "visible bar toward a named reward".
6. **Alternatives you can swap for free reduce fear of choosing.** Hades' Mirror: every talent has a mutually exclusive alternative, switchable for free at the mirror; keys unlock the alternatives and later rows; a full reset costs one key (COMMUNITY pcinvasion, primagames, Hades wiki). Supports keeping our free respec and our exclusive keystone pairs.
7. **A tree can be a building.** Rogue Legacy 2's skill tree is drawn as the castle: each purchase adds a room, and some rooms unlock classes or vendors (COMMUNITY ggrecon, primagames). Reviewers liked the fantasy but disliked repeated identical health nodes (OPINION). This is the precedent for our option C (the Hollow map) and a warning about filler.
8. **Touch targets: 44 pt (Apple) / 48 dp (Google), about 9 mm, with ~8 dp between targets**; WCAG 2.2 AA asks 24 CSS px, AAA 44 px (COMMUNITY summaries of Apple HIG; OFFICIAL Google Android accessibility help). The hit area can be larger than the drawn icon.
9. **Rendering: SVG is fine up to a few hundred nodes; cull and use level of detail.** Graph benchmarks find SVG and Canvas roughly equal below ~400 nodes / ~8000 shapes and both degrade above (COMMUNITY/academic Horak 2018 poster); vendors recommend culling off-screen elements and switching to a cheaper drawing at far zoom (COMMUNITY yWorks, JointJS). Canvas cost grows with pixel area, which matters for full-screen pan.

## 2. Per-game notes (only what is new vs files 19/22)

| Game | What it does | Lesson for Hollowlight | Tag / source |
|---|---|---|---|
| Grim Dawn (Devotion) | Sky map of picture-constellations; start at Crossroads; a starting star opens each constellation; brighter stars = Celestial Powers bound to a skill; five affinities gate higher constellations; 50-55 points fill only a fraction of the sky | Emblem constellations; a "heart" star that opens each cluster; a few bright stars (sockets) carry the real options; never expect a player to light everything early | OFFICIAL grimdawn.com/guide/character/devotion; COMMUNITY forums (Devotion Picker tool) |
| Path of Exile | Node ladder (small, notable, keystone, socket); search pulses matches at any zoom; zoom slider | Size ladder knot / bead / socket / heart / keystone; a Find box; highlight survives zoom-out | COMMUNITY pathofexile.fandom.com/wiki/Passive_skill; maxroll.gg PoE beginner tree guide |
| Vampire Survivors (Arcanas) | One relic opens the Arcana system; each Arcana names a hero/stage/boss task; an in-game Unlocks list shows requirements | Each socket names its task; a "Next lights" board lists the closest; the first discovery opens a whole layer (like the weapon heart) | COMMUNITY rogueranker.com/vampire-survivors-arcanas; vampire.survivors.wiki/w/Arcana; primagames |
| Hades (Mirror of Night) | Base and alternative talent per row, free swap; keys open alternatives and rows; reset costs a key | Free respec stays; exclusive pairs stay; "opening a row" = waking a cluster | COMMUNITY pcinvasion.com, primagames, hades.fandom.com/wiki/Chthonic_Key |
| Slay the Spire | Per-character score bar; thresholds unlock cards/relics into the reward pool, not the starting deck | Unlocks add options to the pool (same as our gates); a bar per goal | COMMUNITY slaythespire.info unlock guide; Steam discussions |
| Rogue Legacy 2 | The castle grows a room per skill; rooms unlock classes and vendors; costs rise with every purchase | The tree as a place (option C); avoid many identical HP nodes | COMMUNITY ggrecon, primagames, rpgfan EA review (OPINION) |
| Soulstone Survivors | First-tier tree has three coloured sections (offence red, defence blue, utility green); later class trees fogged until the first is maxed; fog bugs confused players | Colour = branch is readable; fog must have a clear rule and a visible condition | COMMUNITY Steam threads 2023; thegamer guides |
| Halls of Torment | Quest-based meta (500+ quests listed by the developer); traits gated by character level | A quest board is a good companion to a tree; our "Next lights" board | OFFICIAL chasing-carrots.com (500+ quests); COMMUNITY Steam |
| Death Must Die | Hero unlock chain (finish runs with A to unlock B); some players called the meta thin | Hero lanterns should hold real, if small, things; not only cosmetics | COMMUNITY primagames, casualgamer, Steam |
| Crypt of the NecroDancer | Diamonds persist and are spent in the lobby on permanent upgrades; rescued NPCs open lobby services | Rescue/"wake" as the unlock verb fits our "Wake it" button for weapon hearts and sockets | COMMUNITY wikipedia, gamereactor review, fan guide |
| Hollow Knight (map + charms) | (file 22) charm notch cap; map shows only what you have explored, bought from a cartographer | Fog the outer sky band; the map grows as you explore | file 22, COMMUNITY |
| Spirit Hunters: Infinite Horde | (file 19/22) huge web, mixed currency/challenge gates, no respec, locked nodes hard to see | Our reference for "big web, nodes light up"; fix its legibility and respec | file 19/22 |

## 3. Patterns for each design question

| Question | What the evidence supports | Our default |
|---|---|---|
| Overall shape | Radial web from a hub (SH:IH, PoE), picture-constellations (Grim Dawn), building (RL2), list (VS PowerUps) | Hub + rings + five picture-constellations (A) |
| Node sizes | 3-5 tier ladder by importance (PoE, D4) | knot 14 px drawn / bead 20 / mastery 24 / socket 32 / heart 40 / keystone 30; every hit area >= 44 px |
| Reveal / fog | Fog the far future, show silhouettes of the next layer (Soulstone, file 22 lesson 7); never hide conditions | Dormant cluster = grey emblem silhouette + one visible condition; outer sky band fogged; hidden only for sockets with 0 progress (locked rule) |
| Progress display | Bars with numbers per goal (StS, RoR2 logbook, Halls quests) | Teal arc on the map (no number), full lines + bars in the panel, "Next lights" board, results-screen nudge (built U6) |
| Recommended path | PoE planners, "start camera on next affordable node" (file 22 advice) | Camera opens on the next light you can afford; "Next lights" board; no forced path |
| Respec | Free swap (Hades) liked; final purchases disliked (SH:IH) | Keep free respec; gates/sockets permanent (built) |
| Search | PoE find box | `F` Find: type a word, matches pulse at every zoom |
| Phone | 44/48 px targets, 8 px gaps, bottom sheet, pinch with `touch-action:none`, no hover-only info (file 22 + HIG/Material) | Hit radius independent of drawn size; bottom sheet (portrait) / side sheet (landscape); tap a constellation at far zoom to fly in |
| Performance | SVG ok to a few hundred, cull, LOD | One canvas for threads/glows/watermarks, pooled DOM buttons only for nodes in view (existing `queryRect`), three LODs |

## 4. Risks seen elsewhere

- Dense maps get planners because the in-game view is hard to read (Grim Dawn): we must make the far zoom readable without a planner (constellation names, emblem watermarks, Next lights).
- Fog that does not lift when expected reads as a bug (Soulstone): every fog has one stated rule.
- Filler nodes that all do the same thing feel padded (RL2, SH:IH): our knots are deliberately small (locked 1-3% rule); the sockets and hearts must stay the visible reasons to come back.
- Re-entry freezes (SH:IH, file 19): test pan/zoom state restore.

## 5. Sources (checked 2026-10-18)

- grimdawn.com/guide/character/devotion (OFFICIAL); forums.crateentertainment.com Devotion Picker thread (COMMUNITY)
- pathofexile.fandom.com/wiki/Passive_skill and /Notable_Passive (COMMUNITY); maxroll.gg/poe/getting-started/passive-skill-tree-for-beginners (COMMUNITY)
- rogueranker.com/vampire-survivors-arcanas (COMMUNITY); vampire.survivors.wiki/w/Arcana (COMMUNITY); primagames Arcana guides (COMMUNITY)
- pcinvasion.com/?p=221713; primagames Hades Mirror guide; hades.fandom.com/wiki/Chthonic_Key (COMMUNITY)
- slaythespire.info unlock guide; Steam app 646570 discussions (COMMUNITY)
- ggrecon.com/guides/rogue-legacy-2-skill-tree; primagames RL2 tips; rpgfan.com RL2 early-access review (COMMUNITY/OPINION)
- steamcommunity.com/app/2066020 discussions; thegamer.com Soulstone guides (COMMUNITY)
- chasing-carrots.com/halls-of-torment (OFFICIAL); Steam app 2218750 discussions (COMMUNITY)
- primagames / casualgamer Death Must Die character unlocks; Steam app 2334730 (COMMUNITY)
- en.wikipedia.org/wiki/Crypt_of_the_NecroDancer; gamereactor review (COMMUNITY/OPINION)
- support.google.com/accessibility/android/answer/7101858 (OFFICIAL, 48 dp, 8 dp spacing); Apple HIG 44 pt via secondary summaries (COMMUNITY: dequeuniversity, openreplay); WCAG 2.2 2.5.8 (24 px AA) and 2.5.5 (44 px AAA)
- mt.inf.tu-dresden.de Horak 2018 graph performance poster (academic); yworks.com/blog/svg-canvas-webgl; jointjs.com/blog/svg-versus-canvas; smus.com/canvas-vs-svg-performance (COMMUNITY/vendor)

Security check: read-only web research, no downloads, no accounts. Fit check: every borrowed pattern is re-expressed in the Hollowlight language (lanterns, thread, brass, colour returning), nothing copied from another game's art or names.
