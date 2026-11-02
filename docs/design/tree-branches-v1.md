# Tree branches v1: short chains, then a landmark, then themed follow-ups

Status: DESIGN + MOCKUP only (2026-11-02). Nothing built. Pictures: docs/mockups/tree-v3/B1-*.png (source src/B1-gen.py, B1-shot.mjs). Names and numbers in pictures are invented.
Matt's rule: "a few little nodes, then the evolution node, then a few more nodes relating to that."

## Amendment 2026-11-02 (Matt): every seal forks into two branches
Option A is amended and this section SUPERSEDES the A numbers in section 3 and section 6. Each weapon has three spokes (one per evolution). Per spoke: 3 dots -> diamond (lead-in, must be bought) -> SEAL -> **two separate forks out of the seal itself**, each = 2 small dots -> 1 small diamond. Both forks are buyable (no exclusivity). Picture: B1-wolves-option-a.png (Legion lit landmark, other two veiled with forks hidden) and B1-whole-web-with-branches.png.
- **Node count per weapon:** 4 lead-in (x3 = 12) + 3 seals + 2 forks x 3 nodes x 3 seals (= 18) + heart = **34** (14 today, **+20 new**: 18 fork nodes, 1 extra lead-in knot, 1 zero-power Legion landmark). 11 of 12 lead-ins reuse today's outline ids (re-parented); two seals are today's gates. Five weapons: about 170 nodes (today 70). Chain Lightning/Raven/Bolts already have 3 gates, so no landmark: +19 each; Holy Orbit like Wolves.
- **Fork content (invented names, 1% steps):** fork 1 is flavoured to the evolution's verb (dots +1% weapon stat, diamond +1% or a small mastery), fork 2 is status/utility flavoured (dots bleed/burn +1% in the shared status pool, diamond a zero-power or +1% flavour bead). Never name the recipe pair; each seal's six fork nodes use pair stat, off-pair stat and status in a mix.
- **Power for +5% (estimate with the real soft formula, C 17.2, w 0.08, not the budget code):** wolves today S=24, soft 12.94, PE 1.035. +5% PE means S about 26.9, i.e. only +2.9 net weapon-pool face. As drawn (fork-1 trio at 1% x3 seals = 9 face + 1 lead knot) the gross add is +10 face (+14% PE), so hold +5% by trimming existing nodes by about 7 face (`wf_maul` 4->2, `wf_coat` 4->1, `wf_third` 2/2->1/1). Result S about 27, PE about 1.09 (+0.057 per weapon, +0.29 of 16.9 for five weapons). Fork-2 status nodes sit in the shared status pool (face 14 of cap 16 today; adding 6 per weapon would saturate it, so only 1 status face per seal, 3 per weapon, and the rest are zero-power flavour). All numbers need `rt-matrix`/`bless-sweep` before lock.
- **Data / ids:** `branches[].forks[]` in the weapon fragment, each fork `{"nodes":[id,id,id],"flavour":"pair|status","theme":"trails"}` (last id is the diamond). Fork ids are new, append-only (tests/fixtures/tree-ids.json). `requires`: first fork dot requires the seal, the next requires the previous, so a fork can only be bought after its seal is lit; both forks hang off the same seal. Unlit seals draw no fork nodes (hidden-recipe safety).
- **Layout from the socket ray (no per-node coordinates):** spoke direction = heart -> emblem socket point; lead-in step 36-46 along the ray; seal at lead end; fork directions = ray angle +/- 40 degrees (spread is a template constant, 30-50 allowed); fork step equals the lead-in step. Gap rules: medallion to medallion at least 120, seal to its first fork dot at least 30, node to node at least 18 (v2MinGap). Constellation footprint grows to about 3x the old 11-slot outline (about 500 across near zoom); R1 must size heart distances so neighbouring constellations keep 120 between seals.
- **Effort/risk (revised):** about 4 chunks (schema + compose + validator; layout rays + forks + R1 re-run; content: 15 evolutions x 6 fork nodes = about 90 new nodes with names and sweeps; trim + retune). Risk medium-high: roughly 100 new node ids, status-pool saturation, and the largest constellation footprint yet; mitigated because forks are pure template data. Save impact unchanged (reset v4 -> v5).
- **Web rule (Matt): forks are LEAVES, everything else is one connected web.** The two forks end at their diamond and connect to nothing else; they `require` only their seal. Everything else (hub, hearts, lead-ins, seals, tools, heroes, regions) must be reachable from the hub. Cross-links are drawn as faint woven threads between neighbouring constellations and regions (e.g. a Wolves lead-in/seal to a Raven Flock seal; hero rows to hearts; dim outer rows to seals). They are VISUAL ONLY: no new `requires`, so unlock rules and prices do not change. Threads start only at lead-ins or seals, never at fork leaves. Data: `links: [[idA, idB], ...]` in the fragment (render-only, capped at 2 per node, both ends must exist). In both mockups the cream curved threads show this.
- **How connectivity is validated:** extend `connectIssues` (treelayout.js) with: (1) every non-fork node has a `requires` path to the hub (no orphan outside the forks); (2) every fork node's only prerequisite chain is its own seal (a fork with any other requires, or something requiring a fork node, is an error); (3) every `links` pair exists, is not a fork node, and does not cross a medallion (clearance rule); (4) the existing 'gold-only way in' and 'no far links' rules still pass. The synthetic `--extra` fragment must satisfy all four.
- **Template score:** still best. A 4th evolution = one new socket point + one `branches` entry (lead, seal, 2 forks); siblings keep their rays. The Legion landmark is a normal template seal with `gate: null` and zero power.

## Shape language (2026-11-02, Matt: "better than stick figures")
The locked structure stays (3 spokes; 3 dots -> lead-in diamond -> seal -> two leaf forks of 2 dots -> diamond; everything else connected; cross-links visual only). Only the SHAPE changes. Pictures (Ghost Wolves, near zoom): B2-wolves-shape-1/2/3.png; whole web: B2-whole-web-shapes.png. Generator: src/B2-gen.py (imports the B1 helpers).
1. **Emblem skeleton (recommended).** The constellation IS the weapon emblem: heart on the forehead, seals on the eyes and nose (the emblem's existing sockets a, b, c), lead-ins arc from the brow, forks run out along the ears, cheeks and jaw and end on the outline, with a faint filled silhouette behind. Reads as a wolf at FAR zoom and keeps identity per weapon (wolf head, raven wings, star, zigzag, rings in the whole-web picture). Data: the emblem file gains `forkTargets: {a:[pt,pt], b:[...], c:[...]}` next to its `sockets`; layout = curved spoke from `heart` to each socket (control point bowed away from the emblem centre), nodes placed at equal arc length, forks curved toward their targets. No per-node coordinates; a new weapon is one emblem (silhouette, heart, sockets, targets) plus a fragment. A 4th evolution = one more socket + two targets in the emblem. Layout cost: low-medium (curve placement by arc length, one bow constant), but the emblem must be designed so spokes are at least about 90 px at MID zoom and forks do not cross (a validator check: forks and spokes of one constellation must not intersect; node gap 18).
2. **Woven web.** Spokes are S-curves from the heart at fixed angles; thin cross-threads join the same step of neighbouring spokes (4 rings x 3 pairs) with diagonal hairlines, forming cobweb cells; lit threads glow. Closest to the reference's webbed feel. Data: spokes from `branches` order and socket angles; cells are derived (index i of spoke X to index i of spoke Y), so adding a spoke adds its cells automatically, but 4+ spokes make the web crowded and the lengths must match for tidy cells. Layout cost: medium (equalise spoke lengths, thread sag, crossing checks with forks).
3. **Satellite garden.** S-curved spokes; hubs (heart and seals) wear a ring of tiny satellite dots; each fork pair opens like two petals (soft filled petal shapes); dim decorative ghost dots and hairlines fill the gaps. Prettiest at NEAR, softest at FAR. Ghost dots are NOT nodes (no ids, no cost), generated from a seeded RNG per weapon so the layout never changes between runs. Layout cost: highest (curl curves, satellite ring, ghost placement that avoids threads, plus keeping decoration from looking like clickable nodes).
Recommendation: **1 (emblem skeleton)**; borrow the woven cross-threads between neighbouring constellations (already in the whole-web picture) and the satellite ring on the heart from 3. It is the only one where the silhouette itself says which weapon it is, matches the locked rule that every creature has its own recognisable shape, and uses data that already exists (emblem sockets). Open risk: emblems with narrow shapes (zigzag, bolt) need deliberately wide silhouettes to hold 3 spokes at MID zoom.

## 1. Reference structure analysis (read from the reference photos; counts are approximate, one screen)
Photos used: ff14a21b, 01b5ee88, 21963a28, f313d5f5, b2797ad2, 0ef1879e, d99cdcd3, cce8345f, 93125f9c, 6c226447 (others are repeats). Inspiration for rhythm only, no art/frame/names copied.
- Chains: a run of tiny dots is **2-4 long (mode 3)** before a diamond or a hub. Dot:diamond is about **3:1** (about 120-150 dots, 35-45 diamonds on a full screen).
- Diamonds: framed diamonds are the mid-size choices. About **4 diamonds sit within one hop of each big medallion** (1-2 feeding it, 1-2 beyond). Diamonds cluster where chains meet.
- Medallions: about **10 big medallions per screen**, ratio about **1 per 4 diamonds, 1 per 12-15 dots**. 7-8 sit isolated near the edge of the web as the END of a branch; 2-3 sit inside the web as hubs at a junction with threads on all sides. Each medallion is flanked by **2 small gold bells** and has a few diamonds in front of it.
- Hub and satellites: a framed-square hub in the middle has a **sunburst of 4-6 spokes**, each spoke = **2-4 dots then a diamond** (d99cdcd3 centre). Little clusters of **3-6 dots hang off a diamond** (short branches, rings of 6-8 dots, hooks). Spokes end in a gold bell or a diamond: the end of a chain is marked.
- Threads: dot chains are straight thin lines; **cobweb cross-links** (many fine threads) join neighbouring diamonds and medallions, so the web is dense and lopsided, not a clean tree.
- Outer region: a **central emblem with symmetrical wings** (ff14a21b, 6c226447): about 6-7 rows per side of **10-16 grey dots** with a diamond near the emblem end of each row, plus webbing. Dim and quiet: long dot-paths that lead toward something.
- Node types by icon: tiny teal dots (stats), framed diamonds with an icon (choices/abilities), gold bells (small bonuses), big framed medallions (heroes/maps/boss unlocks).
- Density and zoom: one zoom level shows everything; medallions read as landmarks, diamonds as icons, dots as texture. Nothing needs zooming to understand it.

### Where Wispwick deliberately differs
- Warm Lantern look: gold ring medallions, blue wolf light, carved stone; no frame, no skulls, no cobweb texture (we keep clean thin threads, plus at most a few cross-links).
- Our medallions are evolution seals that are VEILED (dashed ring, "?") until their condition is met; the reference shows every medallion.
- We have no bells: the flanking job is done by the follow-ups after the seal. (Open to a tiny gold "keepsake" dot later.)
- Three branches per weapon (we have 3 evolutions), not 4-6 spokes; chains 3-4 dots long (reference mode 3, we add the diamond as the 4th).
- Our dots carry real 1-2% stats under the soft cap, so the lead-in must stay neutral (hidden recipes).

## 2. How Ghost Wolves is built today
- 14 nodes: heart `gt_ghost_wolves` (150 gold, 2 runs), 2 seals (`gt_phantom_stampede` b, `gt_dire_alpha` c), 11 outline nodes = 7 knots + 3 beads + 1 mastery. Evolution a (`howling_legion`) is the STARTER evolution: no gate node, no seal.
- Requires graph is generated from the emblem outline order (treedata.js), not hand-written: heart -> `wf_fang` -> bite -> coat -> maul -> hunt -> **wf_third** (apex, requiresAny) <- rend <- scent <- bleed <- lope <- `su_call` <- heart. So two 5-node chains leave the heart and meet at one mastery. The `requires` typed in the JSON for outline nodes is ignored.
- Seals have NO requires. They are gated only by unlock conditions (evolveWeapon n, wolf kills). No knot has to be bought first, and no node follows a seal.
- Knots: Wolf speed +2 (su_call, lope, hunt), Bite power +2/+4 (scent, maul, bite, fang), beads: bleed +3 (bleed, rend), power +4 (coat); mastery power+speed +2. Per-weapon face sum = **24** (power 16, speed 8; bleed 6 counts in the shared status pool). Nothing is themed to an evolution: the count/duration pair of Howling Legion has no node at all.
- Other weapon (Holy Orbit, same shape): 14 nodes, outline is orb power / orbit speed / halo size / burn chains meeting at the mastery `or_seventh`; 2 seals, starter a seal-less; face 24; seals are also unconnected to the knots. Chain Lightning/Raven/Bolts have 3 seals (15 nodes), face 22-24.
- Budget: per-weapon pool cap 17.2, weight 0.08 per weapon (refWeapons 5, total 5 x 1.376 at cap). Wolves today: soft(24) = 12.94, PE 1.035 = 75% of its asymptote. The at-cap ceiling (30.99 of 31) is a rule, so adding nodes cannot break it; what moves is real power, so every option needs the sweep.

## 3. Three branch structures (Ghost Wolves worked example)
Common rules: knot = dot (+1-2%), bead/mastery = diamond (+3-4%, status or stat), seal gets `requires: [last lead-in diamond]` (a seal now needs its lead-in bought, plus its unlock condition), follow-ups require the seal and appear only once it is lit. **Hidden-recipe safety**: lead-ins are neutral (mixed stats, generic wolf names, never the pair); follow-ups are themed to the evolution's VERB, not its stat pair: each follow-up trio uses one pair stat, one off-pair stat and one status/other, so no stat shows up as "the pair". Seals stay veiled; follow-ups never name a recipe. Estimates use the real soft formula (treebudget.js: C 17.2, w 0.08); the budget code was not run on these options because they are not data yet.

### A. Three spokes (picture B1-wolves-option-a.png)
Per evolution: 3 dots + 1 diamond -> seal -> 2 dots + 1 diamond. The heart has 3 rays toward the emblem sockets.
- Nodes: **24** (14 today + **10 new**: 2 lead-in knots, 8 follow-ups). Reparented ids (requires changed): all 11 outline ids (L: fang, bite, scent, coat; R: su_call, lope, hunt, bleed; D: maul, 2 new, rend); `wf_third` becomes the Alpha's closing diamond; both seals get a requires.
- New follow-ups (invented): Legion "Echo Howl" Rend +2, "Kindred Shade" bleed +3, "Pack Memory" Bite +2; Lightfoot "Light Paws" speed +2, "Bright Wake" bleed +3, "Trailblazer" Rend +2; Alpha "Great Jaw" power +2, "Heavy Rend" duration +2, (wf_third reused).
- Power: face 24 -> about 38 (+14, all 1-2% steps); PE per weapon 1.035 -> about 1.225 (+0.19), five weapons about +0.95 of 16.9. Can be made neutral by trimming `wf_maul`/`wf_coat` 4% to 2% (-4).
- Hidden-recipe: lead-ins neutral, follow-ups hidden until the seal lights. Safe.
- Reads: FAR = 3 spokes with a medallion at each end (a wolf with three arms). MID = chain of dots, diamond, medallion with a tuft. NEAR = node names and follow-up trio.
- Template score: best (see section 5).

### B. Shared trunk, three seals in a row (B1-wolves-option-b.png)
One trunk of 5 dots + diamond -> fork -> three seals stacked -> 3 follow-ups each.
- Nodes: **18** (14 + **4 new**). Reparent: 6 trunk (su_call, lope, fang, bite, scent, coat), 5 old become follow-ups (bleed, rend, hunt, maul, third); the 4 new are the rest of the 9 follow-ups.
- Power: face +8 -> 32, PE +0.125 per weapon (+0.6 total). Least new content, but follow-ups are mostly old generic nodes, so the "themed" feeling is weakest.
- Hidden-recipe: the trunk is shared, so it is the safest; the three seals sit side by side, so seal order can hint at unlock order.
- Reads: FAR = a tree with a trunk and three fruits; the weapon's silhouette is lost (all seals on one side). MID = one long line. NEAR = fork reads well.
- Lowest value: you walk one road to reach any seal, so there is no "which branch" choice.

### C. Ring and spokes (B1-wolves-option-c.png)
Hexagon ring of 6 dots round the heart; every other ring dot starts a spoke of 2 dots + diamond to a seal; 3-4 follow-ups hang beyond.
- Nodes: **27** (14 + **13 new**). Reparent: 6 ring (fang, bite, scent, hunt, su_call, lope), 5 spoke (maul, bleed, rend, coat, third); new 4 spoke nodes + 9 follow-ups.
- Power: face about +20 -> 44, PE +0.24 per weapon (+1.2 total); 95% of its asymptote, so the extra is mostly wasted by the soft cap.
- Hidden-recipe: ring neutral; same follow-up rule. Safe.
- Reads: FAR = a ring with three tails (looks like the reference's closed dot rings and sunburst). MID = busiest, most "web". NEAR = ring is a decoration, few real choices.
- Highest density and closest to the reference sunburst, but most nodes, most budget and hardest to extend.

## 4. Save and migration (all options)
`requires` of released ids changes (11 per weapon, 55 total) and effects may change: needs core.version 4 -> 5 and the already-approved refund-everything reset (Regrowth-style, never lose spent currency, snapshot, announced). New ids are append-only in tests/fixtures/tree-ids.json. The seal-requires change also needs the connected-unlock rule retested. No change to unlock effects (weapon/evolution gates stay permanent, never refunded).

## 5. Template for future content (Matt's rule: data only, laid out automatically)
A branch becomes a template inside the weapon fragment (illustrative, not final):
`"branches":[{"socket":"b","evo":"phantom_stampede","lead":{"len":3,"ids":["su_call","wf_lope","wf_hunt"],"diamond":"wf_bleed"},"seal":"gt_phantom_stampede","follow":{"theme":"trails","ids":["wf_wake","wf_paws","wf_blaze"]}}]`.
Layout needs NO coordinates: the ray = heart -> emblem socket point, lead step, seal distance and follow-up fan are constants of the template. The theme tag is read from evolutions.json (the verb), never typed twice. The same template serves a hero keepsake chain (lead 3 -> landmark -> follow 2) and a chapter/companion landmark (landmark kind replaces seal).
| | A spokes | B trunk + fork | C ring + spokes |
|---|---|---|---|
| Template is per branch | yes, fully independent | trunk shared, fork shared | ring shared |
| Add 4th evolution to a weapon | new socket point + one branch entry; siblings do not move (each owns its ray) | needs a 4th fork slot; arc has room for 4-5 only if reserved | ring of 6 supports 3 spokes; a 4th means a ring of 8, so siblings move |
| New weapon / hero / chapter | fragment data only | data only | data only, but ring size is another field |
| Synthetic --extra test (TREE-GEN1) | still passes if the validator derives counts from the template (today it hard-codes 11 outline nodes and exactly sockets a,b,c) | same | same |
Validator changes needed for A: replace CLUSTER_OUTLINE=11 and "exactly 3 sockets" (treedata.js lines 78-85, 273-286) with counts derived from `branches`; layout rays in treelayout.js; keep the emblem socket points as the ray definition (a 4th evolution adds one point).

## 6. Recommendation: A, with power held neutral
A keeps three self-contained, reusable branches, gives the "dots, evolution, relating nodes" rhythm at reference ratios (dot:diamond about 2.5:1, 3-dot lead-in, seal as branch end, a short follow-up tuft), keeps the wolf-head silhouette on FAR zoom, and is the only option where a 4th evolution does not move its siblings. Trim two 4% nodes so net face is about +10 instead of +14, re-run `rt-matrix.mjs` and `bless-sweep.mjs`.
Effort: about 3 chunks (schema + compose + validator; layout rays + R1 re-run; content for 15 evolutions x 2-3 follow-ups = about 40 new nodes with names/sweeps). Risk: medium (touches compose and ids, needs the reset); balance risk low-medium (+0.95 PE of 16.9 before trim).

## 7. Effect on the rework chunk plan
- R1 re-layout must be re-run on the branch structure: constellation becomes a heart with 3 rays and larger footprint (about 2.2x radius of today's 11-slot outline); do the template/schema chunk first, then R1.
- The refund-everything reset (v4 -> v5) ships with this layout, as already approved for Q4.
- Evolution medallion art (R2) now has 3 seal glyphs per weapon.

## 8. Open questions for Matt (max 3)
1. Howling Legion has no seal node (starter evolution). Add a free, zero-power "landmark" node that lights with the heart so the Legion branch has a medallion (recommended), or hang its follow-ups straight off the last lead-in diamond?
2. Seals must now be preceded by their lead-in diamond (a seal cannot be bought until its chain is). Yes (recommended), or keep seals gold/condition only?
3. Hold weapon power neutral (trim two 4% nodes, recommended) or let the tree get about +5% stronger and retune?
