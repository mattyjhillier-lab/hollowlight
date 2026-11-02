# 33 - Why the Lantern Web lacks "wow", and five redesign directions

Date 2026-11-02. Docs only, nothing built. Trigger: Matt opened the tree properly for the first time and felt no wow.
Source tags: OFFICIAL (developer/store/official guide), COMMUNITY (wiki, forum, guide, aggregator), OPINION (review, blog, my inference). Web results this session were THIN: no developer interviews surfaced for Hades, PoE, Dead Cells or Rogue Legacy; most claims are community/opinion and said so. Older verified notes live in docs/research/19, 22, 38 (checked 2026-10-18; I reuse them and mark them "(file 38)" - not re-verified today).

## 1. What the tree is today (from code + data + screenshots)

Facts (read from `src/data/tree/*`, `src/meta/treelayout.js`, `src/ui/treescreen.js`, docs/screenshots/tree/desk-far.png, desk-run3.png):

| Item | Value |
|---|---|
| Buyable nodes | **163** (launch fixture is smaller; this is live `dev`) |
| By kind | ring 79 (global stat ring lanterns), knot 38 (weapon stat), bead 12 (verb/status), socket 13 (evolution/gate seals), key 6 (keystones), heart 5 (weapon medallions), mastery 5, teaser 3 (future chapters), gate 2 |
| So | about 100 of 163 (61%) are small stat nodes (ring + knot); only ~29 are "landmarks" (heart/socket/key/bead-with-verb) |
| Conditions | 74 nodes carry an unlock condition (kills, chapter clears, evolve a weapon...); 89 are gold-only |
| Layout | Hub lantern (Hearth ring, Wick ring), five weapon constellations around it (Wolves, Ravens, Bolts, Chain, Orbit), Dusk ring of keystones, fogged "?" band for future chapters, "The Satchel" tools cluster |
| Look | Dark navy sky, thin trails between lit lanterns, hub rays, faint emblem watermark per weapon, five node states, no padlocks (design sheet skill-tree-v2.md, LOCKED T4) |
| Unlock display | Teal arc per challenge node, "Next step" bar (one best-next pin + Show me), Goals tab, Spirits index, panel with numbered checklist; progress numbers only in the panel |
| Juice already there | `tree_light` / `tree_whole` sounds, spark toward open lanterns, a "wake" celebration (CX5), fly-in camera, fading first-visit tip |
| Camera | Opens on the best-next lantern; far view shows names only for lit/near-lit constellations |

First-time player experience (inferred from code and screenshots, not a recorded session): a dark screen, a glowing hub, a ring of identical sun-icon lanterns ("19 can light"), a "Light Third Glance - 310 gold" bar, and four constellations that are faint grey scatter at mid zoom. Everything affordable is a +1-3% stat or a utility key; the exciting items (evolution sockets, new weapons) are small dim marks far from the hub that read as "?"/grey.

### Hypotheses: why it lacks wow (labelled HYPOTHESIS; none tested with players)

| # | Hypothesis | Evidence |
|---|---|---|
| H1 | **First purchases are the least exciting things in the tree.** Day-one buys are stat/utility knots; the headline unlocks (Ravens, evolutions, Orbit tier) sit behind gold + conditions and look like dim dots. | Node mix above; screenshot "Light Third Glance - lets you reroll cards" is the featured goal |
| H2 | **Filler outnumbers landmarks 3.5 : 1.** 79 identical ring lanterns make the sky read as a menu of percentage bonuses. Players in other games call this "chores disguised as character development" (COMMUNITY, wayline blog) and Spirit Hunters' own tree is criticised for "+1%" nodes (COMMUNITY, vaporlens aggregator, one source). | counts |
| H3 | **Dark, low-contrast, sparse sky.** At mid zoom most of the screen is empty navy with tiny grey rings; only owned items glow. A fresh save has nearly nothing lit, so the screen shows what you do NOT have. | desk-run3.png, desk-far.png |
| H4 | **No spectacle at the moment of unlock.** One sound + spark + pulse; no camera beat, no reveal of what the unlock changes in the run, no persistent visible change to the world. The reward is a number going up. | code: single sound id, no shared "world gets brighter" payoff |
| H5 | **Weapon constellations are abstract.** The emblem exists only as a faint watermark; the wolf does not read as a wolf until nearly complete. The picture is the reward, but you see it last (file 38 flagged raven and chain as weakest). | screenshots |
| H6 | **Far goals are not tempting.** Evolution sockets show a name only once "stirring"; hidden recipes are locked by design, so the strongest carrot (what will my wolf become?) is invisible. Locked state = "???" + dim ring. | LOCKED hidden recipes rule |
| H7 | **Menu-feel framing.** Title bar, pills, side panels and a "can light" counter frame it as a shop UI; the map metaphor (a restored sky) is not tied to the game's identity (the Hollow regaining colour). The in-run world never shows the tree's progress. | UI chrome; IDENTITY.md |
| H8 | **Pacing of the first 10 minutes.** A new player has ~1,200 gold after a few runs and can buy ~19 things: choice paralysis with no clear "first big moment". Hades front-loads wins (first 10 runs unlock new weapons/abilities/story beats - COMMUNITY, blog comparison). | desk-run3 "19 can light" |
| H9 | **Choices lack tension.** Only 6 keystones, 5 exclusive pairs; almost everything is additive, so nothing is a trade-off. "A true choice needs trade-offs" (COMMUNITY, forum). | key count |

Honest caveat: H1-H9 are an armchair diagnosis from screenshots and data; Matt's own words on what felt flat (colour? too empty? too samey? no payoff?) would sharpen it (see open questions).

## 2. How other games get "wow" (verified where tagged)

| Game | Technique | Source / confidence |
|---|---|---|
| Path of Exile passive tree | One huge shared web, classes start at different points; node ladder small < notable < keystone; keystones "significantly alter how the character functions"; search pulses matches; roads/"suburbs" of clusters | COMMUNITY (PoE wiki), OFFICIAL (Legion jewel dev post on keystones, gamebanshee quoting GGG); cost of keystone design acknowledged: studio could not make 20+ good ones |
| PoE cluster jewels | Expansion by plugging new notable clusters into the web: 280 new notables, sized by role | COMMUNITY (gamebanshee patch notes) |
| Diablo 4 Paragon / Last Epoch | Boards bolted on via gate nodes, glyph sockets, legendary tile at board centre; players asked D4 for "build-altering" choices like Last Epoch's mastery split | COMMUNITY/OPINION (icy-veins, dexerto); thin on glyph detail |
| Grim Dawn Devotion | Sky map of picture-constellations, each opened by a starting star | (file 38) OFFICIAL/COMMUNITY |
| Skyrim perk constellations | Designer: make it "very visual rather than like Excel"; each perk a star, gated by skill level and prereqs, linear chains, a few forks | COMMUNITY (forum quoting the designer; unconfirmed primary) |
| Hades Mirror of Night | Base/alternative talent per row, free swap; mostly percentage bumps (a critique); front-loaded unlock rewards in the first ~10 runs | COMMUNITY/OPINION (blog comparison, forums); no developer interview found |
| Hades Pact of Punishment | Opt-in difficulty "Heat" sliders unlocked after first escape; extends replay and counters staleness | COMMUNITY (guides) |
| Hollow Knight | Notch budget (3 -> 11) forces trade-offs; each new notch is a discrete moment (and refills health); map only reveals what you explored | COMMUNITY (wiki), file 22 |
| Spirit Hunters: Infinite Horde ("Divinity Web") | Large web with separate upgrade paths per ability; criticised as "extensive but obscure", small incremental bonuses, no respec requested | COMMUNITY (vaporlens one-source aggregator; seasonedgaming review) |
| Vampire Survivors | Arcanas each name a concrete task, in-game Unlocks list; permanent flat-stat growth called "too easy" by some | (file 38) COMMUNITY; OPINION (itch/reddit) |
| Brotato / HoloCure / Halls of Torment | Brotato light meta (difficulty + achievements) is loved by some, "no long-term goals" by others (OPINION); Halls of Torment: 500+ quests as meta board (OFFICIAL, chasing-carrots) | mixed |
| Slay the Spire | Score thresholds unlock cards/relics INTO the pool, not the starting deck | (file 38) COMMUNITY |
| Rogue Legacy 2 | The tree is the castle: each purchase adds a room; rooms unlock classes/vendors; "always some progress however small" | (file 38) COMMUNITY; OPINION (reddit) |
| Dead Cells | Blacksmith/blueprints unlock WEAPON options; "give the player the tools" philosophy | OPINION (reviews); design rationale NOT verified |
| Cult of the Lamb, Sea of Stars, Genshin ascension | Not retrieved this session. Do not cite. (Cult of the Lamb = base-building as meta; Genshin = ascension milestone gates: my knowledge, UNVERIFIED) | - |
| GMTK "Building Better Skill Trees" | Skills should be interesting, not "boring"; trees feel like growth | OPINION; only subtitle fragments retrieved, full argument unverified |

Recurring lessons (synthesis; mostly OPINION/COMMUNITY, hence moderate confidence):

1. **Landmarks beat filler.** "10 meaningful skills beat 100 stat bumps" (COMMUNITY blog). Bumps are fine as connective tissue, not as the headline.
2. **The shape is the reward.** Constellations/castles/maps: you want to see the picture complete (Skyrim, Grim Dawn, Rogue Legacy 2).
3. **Visible far goals.** Big dim landmarks and hint text pull players across the map (PoE keystones, Divinity Web criticism is the opposite: obscure).
4. **Trade-offs make choices real** (Hollow Knight notches, Hades swap, PoE keystones).
5. **Front-load the first 10 runs** with option-unlocks; slow down later (Hades blog, Slay the Spire thresholds).
6. **Juice the unlock**: every new thing should change what you see and hear and what the next run offers. (My inference; no primary source retrieved.)
7. **Pitfalls**: stat-node bloat, obscure locked nodes, illusion of choice, meta-progression that makes success feel unearned ("only succeeded due to meta", COMMUNITY reddit), analysis paralysis on huge trees, tiny touch targets.

Numbers: PoE ~1,300 nodes but players read ~100-150 landmarks; Spirit Hunters web is large; for Wispwick the useful range is hypothesis only: 150-250 buyable nodes where <= 35% are plain stat knots. (UNVERIFIED; no source gave a "right number".)

## 3. Redesign directions

Common constraints for all: append-only ids (tests/fixtures/tree-released.json), saves unchanged unless stated, locked rules (hidden recipes, gates permanent, free respec, stat nodes 1-3% under soft cap, gold only for evolutions/dawn, no leadlight outside evolution cards/dawn), phone targets >= 44 px, fragment-drop extensibility (cluster/emblem/hero/chapter = JSON file).

### D1. "Restore the Hollow" - the tree IS the map (constellation sky + live world payoff)
- Fantasy: each purchase wakes a patch of the Hollow; the sky map is a night-view of the same world the runs happen in, and colour returns to it as you grow.
- First open: a mostly-grey painted sky; hub lantern glowing; the five weapon emblems drawn as large faint silhouettes with a single bright "wake me" star each; 3-4 big landmark stars pulse. Stat nodes are tiny threads, not icons.
- Unlocks/conditions: each landmark shows its goal as a one-line "to wake" on hover/select; teal arc ring; a "Constellation journal" lists goals; locked emblems show silhouette + one hint line.
- Growth: new weapon = new silhouette on the sky; new chapter = new far "land" panel beyond fog, containing its own map; companions = small satellite stars orbiting their hero.
- Save/migration: none (render + layout + copy only; node ids unchanged). New positions are data in cluster JSON.
- Phone: far view = ~8 big landmarks; tap to fly in; same as today's LOD system.
- Perf: low (canvas already; adds a few pre-rendered backdrops).
- Scope: M. Risk: art is code-drawn only (no new art budget), so "painted sky" must be procedural; overlap with H3/H5/H7 fixes. Fit: high (IDENTITY "spirits restore colour"). Rules: none reopened.

### D2. Keystone-led "Fewer, bigger" web
- Fantasy: ~60 landmarks you actually care about; every node does something you can name; stat bonuses are bundled into "ring lanterns" of 4-6 stats you buy together.
- First open: 12-15 large nodes visible, each with a picture; 3 big pillars (Hearth, Wick, Dusk) and five hearts.
- Unlocks: each big node is a mini-quest (kill X, clear Y); connected small sub-nodes open as it is lit.
- Growth: new content = new big node + its mini-satellites; bloat is avoided structurally.
- Save/migration: HIGH. Merging 79 ring nodes into bundles changes ids; needs a Regrowth-style refund migration (existing v3 mechanism) and a retired-id list; budget/soft-cap tests re-based; tree-released snapshot updated by Matt's rule. Players keep spend value but see a changed tree.
- Phone: best of the five (few big targets).
- Perf: lowest. Scope: L (rebalance economy, ~74k gold sizing, all tests). Risk: undoes the "huge, many nodes, replayability" Tree Pull principle (LOCKED 2026-10-18) unless satellites are retained; players who like long grinds lose them. Fit: medium (loses "big pannable web"). Likely needs a LOCKED reopen.

### D3. Lantern Village hub - the tree is a place you rebuild
- Fantasy: between runs you return to a small illustrated village by the lantern; buying builds or relights a building (Wolf Den, Raven Roost, Orbit Chapel, Library = Almanac, Satchel = tools); each building holds a mini-web.
- First open: a cosy night scene with unlit buildings and a glowing central lantern; tapping a building opens its cluster (today's constellation, reused).
- Unlocks: building states (rubble / lit window / bright); a signboard lists "next 3 goals"; NPC-style whispers (Bible: text barks).
- Growth: new weapon = new building; companion = a creature visible in the village; chapters = a road leading out of the village.
- Save: none (UI-only; node ids and positions kept as the interior view). 
- Phone: good (scene + one cluster at a time).
- Perf: medium (a layered scene; static layers cached). 
- Scope: L (new scene art by code/AI under rules, hub navigation, screenshots all sizes). Risk: art quality ceiling with zero budget (generic risk); competes with the front-door/map-select flow and the Almanac. Fit: high on warmth, medium on "Hollow" identity (it is a cosy hub, not a restoration of the world). Rogue Legacy 2 / Cult of the Lamb style (partly UNVERIFIED).

### D4. Per-hero or per-weapon boards (Paragon / mastery style)
- Fantasy: choose a spirit; its board fills the screen as a beautiful emblem you complete; a global board sits underneath.
- First open: the global Hearth board plus two big "weapon" tiles (Wolves, Orbit) you can open; others dormant.
- Unlocks: each board has its own landmark list (heart, three sockets, keystone, masteries) and a progress ring; completing a board gives a signature reward (cosmetic + small bonus).
- Growth: easiest: new weapon/hero/companion = new board file (already the fragment system).
- Save: none (re-presentation; bundle by cluster).
- Phone: very good (one board per screen).
- Perf: low. Scope: M. Risk: loses the single connected "web" feeling (locked principle: big pannable web); can feel like tabs/menu (H7 worsens) unless the boards visibly connect on a hub screen. Fit: medium.

### D5. Hybrid (recommended): "Restore the Hollow" sky + landmark-first reshaping + juice
- Keep the single pannable web and fragment system (no id changes). Re-rank what the screen shows: big landmark constellations first; ring/knot nodes shown as small beads on threads that only enlarge when a neighbour is lit or you zoom in. Add a world payoff (grey-to-colour sky tied to progress, plus a tiny persistent hint in the title/front door scene) and the unlock beat from section 4.
- First open: sky greyed, hub warm; three big "waking" landmarks pulse (a weapon heart, the first evolution, one keystone) with a named goal; a "Next lights" board of 3.
- Add 8-12 NEW landmark nodes that are options (not stats) to make the early buys exciting: see open question Q4; these would be new-content three-options picks per the standing rule.
- Growth: unchanged and good (cluster JSONs; chapter bands; companions as small satellite constellations).
- Save/migration: none for the visual work; the new landmark nodes are append-only new ids.
- Phone: reuse LODs; far view shows only landmarks (about 12-15 targets).
- Perf: low. Scope: M (visual) + S per new landmark group. Risk: visual-only changes may again fail to produce wow if the underlying buys stay dull (H1) - hence the landmark additions. Fit: high. Reopens: none.

### Comparison

| | D1 Sky | D2 Fewer | D3 Village | D4 Boards | D5 Hybrid |
|---|---|---|---|---|---|
| Scope | M | L | L | M | M (+S pieces) |
| Save impact | none | migration | none | none | none (append only) |
| Principle fit (big web, nodes light up) | high | low | medium | medium | high |
| Phone | good | best | good | very good | good |
| Wow potential (my guess) | high | medium | high (art-limited) | medium | high |
| Main risk | procedural art | reopens locks, refund | art ceiling | menu feel | visual-only misses H1 |

## 4. Cheap juice inside the current tree (any direction)

Each is small and mostly visual/audio; none touches saves or the sim.
1. **Unlock beat**: on a landmark purchase (heart, socket, key) a 0.6-0.8 s camera ease-in, hub-to-node light pulse along the trail, soft bell stack (existing `tree_light`, add a rising second note per tier), and the node name in display type; Calm/reduced motion = instant.
2. **Constellation drawing**: when a weapon heart is woken the emblem outline draws itself in 0.6 s (already specified in skill-tree-v2.md section 3; check it is wired) and the watermark fills with the role colour.
3. **World tint**: sky background warms as a function of lit nodes (already partly; make it visible, e.g. a measurable grey-to-amber ramp) and tie it to the title screen backdrop.
4. **Size and contrast pass**: landmarks 1.5-2x current radius; stat knots smaller and dimmer so the eye lands on landmarks; names always visible for landmarks even at far zoom.
5. **Hint text for far goals**: sockets/hearts show a one-line "whisper" (flavour) even when locked; keep recipes hidden; show the condition headline once any progress exists.
6. **"What changes in your next run" line** on every option unlock ("Ravens now appear in level-up cards"), and a pending badge on the front door's Play button after a buy.
7. **First-visit script**: on a fresh save, auto-fly the camera along a 20 s tour: hub -> three landmarks -> Next lights; gift 1 free starter lantern (small, in data) so the first buy is instant and lit with full juice.
8. **Bundled progress**: a visible "Spirit wakened 3/12" ring on each constellation label (fills as you buy), plus a "Constellation complete" mini-celebration (CX5 exists; ensure it is used).
9. **Lit-path preview**: hovering/selecting a far node highlights the shortest path of lanterns to it and shows total cost (PoE pattern, (file 38)).
10. **Find box (`F`)** and a "Show me" for every goal, if not already complete.
11. **Particles**: drifting motes along lit threads, a slow hub breath; capped for phone perf (already measured: draw 0.7-2.1 ms desktop).
12. **Daily-ish retention**: results screen "Next lights" glow flows into the tree via a camera that opens on the closest unlock (partly built).

## 4b. "Everything feels disconnected" (Matt, 2026-11-02)

Hypotheses from code/UI (HYPOTHESIS, not tested with players). Each system is a separate full screen with its own chrome and its own goal list:

| Link | Where it breaks (hypothesis) |
|---|---|
| Run -> tree | The results screen has a "closest unlock" nudge and a Tree shortcut, but a kill/clear that fills a condition does not visibly light anything; the tree is only reached by menu, and what a run did never appears on the map. |
| Tree -> run | Buying changes numbers or the card pool, but the next run never says "because you woke X" (no in-run callout, no visible world change). |
| Heroes <-> weapons <-> tree | Heroes (Wren, Elias) are picked on a separate screen; their hero lanterns sit in the Wick ring, but the tree does not show "your hero's weapon" first. Weapon clusters have no hero faces. |
| Maps/chapters | Chapter/night select is the front door; the tree shows chapters only as three fogged "?" teasers. Clearing a chapter or night is a tree condition but not a place on the tree. |
| Almanac/codex | Separate screen; the tree's Spirits index and Goals tab duplicate parts of it (three lists of "what next"). |
| Currencies/goals | Gold/shards, the Next step bar, Goals pins, results "next lights" and Almanac entries are four goal surfaces, none authoritative. |

**Clarified by Matt: the disconnect is felt INSIDE the tree itself (weight this above the table).** Hypotheses from the data and screenshots (HYPOTHESIS):
1. **Clusters are islands.** The five weapon constellations hang at radius ~600 with long, mostly empty sky between them and the hub; only hero lanterns and gate rules link them, and no visible thread runs hub -> constellation. In desk-run3.png the Wolves/Ravens/Bolts/Chain clusters are isolated grey scatter with the lit hub far away.
2. **Nodes within a cluster do not relate.** A cluster is "heart + 11 stat knots + 3 sockets"; knots are mostly +1-3% weapon stats chained in a line, so neighbours have no shared theme (no "this branch is bleed", "this branch is speed"), and sockets do not require knots (rule: gates never require stats), so the evolutions look unconnected to the stats around them.
3. **Global rings are generic.** 79 ring lanterns mix reroll, health, pickup and cooldown in one circle with the same sun icon; position carries no meaning, and none points to a hero or weapon (cluster identity = weapon only).
4. **Heroes and weapons are barely on the tree.** Hero lanterns are 3 per hero in the Wick ring; the wolf cluster does not say "Wren's", the orbit cluster does not say "Elias's", and no node shows a hero/weapon pairing or companion link.
5. **No world link.** Nothing on the map is the Hollow: no map thumbnails, enemy faces, boss silhouette or chapter art. Conditions like "kill N Fell Wolves" or "clear Cursed Forest" are text in the panel, not a place or creature you see on the node.
6. **No run link.** The tree does not show which node a run advanced, so cause and effect (I killed crows -> this node filled) is invisible except the teal arc.
Design consequence: connectedness must be built into the web itself: thematic branches inside clusters, visible threads hub -> constellation -> sockets, hero/weapon faces on clusters, enemy/chapter icons on condition nodes, and run activity echoed on nodes. D1/D5 give most of this cheaply (data fields `theme`, `cond icon`, thread draw); D4 isolates clusters even more (worse); D3 connects by place but keeps the in-cluster problem; D2 fixes it by having fewer nodes.

Root idea: one persistent object that every system writes to and reads from, shown on the front door and in the tree. How each direction does that (rating: strong / partial / weak):

| Connects | D1 Restore the Hollow | D2 Fewer/bigger | D3 Lantern Village hub | D4 Per-spirit boards | D5 Hybrid |
|---|---|---|---|---|---|
| Heroes | partial: hero stars on the sky | weak | strong: heroes stand in the village | strong: board per hero/weapon | strong if hero face on each constellation |
| Weapons | strong: constellation = weapon | partial | strong: building = weapon | strong | strong |
| Chapters/maps | strong: far lands on the same sky, map select = pick a land | weak | strong: roads out of the village | weak | strong |
| Almanac/codex | partial: entries pin to stars | weak | strong: a Library building | partial | strong: codex pages open from the star they unlock |
| Results screen | strong: run ends with the camera flying to the stars you advanced | partial | strong: walk back into the village, new lights on | partial | strong |
| The run itself | strong: world colour in the Hollow matches map progress; "woken by you" callouts | weak | partial | weak | strong |
| Menu-feel | low | high | low | high | low |

Suggested spine (works in D1/D3/D5): the map is the front door. Title -> the sky/village (home) -> pick a spirit star or land -> run -> results fly back to home with the newly lit stars, Almanac entries and Next lights shown in place; one goal list (Next lights) replaces the duplicates. Cost is mostly navigation/copy, not content; it touches the front-door flow (docs/design/front-door-v1.md, LOCKED) so it needs Matt's reopen decision (Q4).

## 5. Recommendation

Go D5 (hybrid, "Restore the Hollow"): the foundations (fragments, LODs, panel, a11y, perf, saves) are sound and expensive to redo; D2 and D3 are large and D2 reopens locked principle, D4 risks menu-feel. Order of work:
1. Juice 1, 4, 5, 7 (one chunk, visible in a day): size/contrast of landmarks, always-on landmark names, unlock beat, first-visit tour and a free starter lantern.
2. Playtest Matt on the dev link; ask what still feels flat.
3. Landmark-first reshaping (stat nodes become small beads) + world-tint payoff.
4. 8-12 new option landmarks via the three-options rule (Satchel/Hero/Hearth), append-only ids.
Do NOT pursue D2 unless Matt wants the tree to be about 60 big nodes (reopen).
Weak spots: no player data yet; wow is partly the quality of the code-drawn art, which cannot be proven without screenshots; web research was thin (see header).

## 6. Open questions for Matt (max 3 batch, most blocking first)

Q1. What exactly felt flat when you opened it: (a) too dark/empty, (b) everything looked the same / just percentages, (c) nothing happened when you bought, (d) hard to know what to do first? (plain chat answer; steers priority).
Q2. Would you rather the first buys be exciting options (new weapon/evolution/hero style) than small bonuses? Recommended: yes, add a few early option landmarks and a free first lantern (reversible).
Q3. Direction pick: D5 hybrid (recommended), D1 sky only, D3 village hub (bigger, art-limited), or D2 fewer/bigger (reopens "huge web").
Q4. Should the tree/sky become the home screen everything hangs off (front door, results fly back to it, one goal list)? Recommended: yes, in D5 form; it reopens the front-door flow.
Parked for later: per-hero companion satellite constellations (see docs/design/companions-v1.md); village hub as a front-door reskin once art budget allows.

## Sources
- [Legion Jewels design part 3 (GGG, via GameBanshee)](https://gamebanshee.com/khkwa) - OFFICIAL via quote
- [PoE wiki: Passive skill](https://pathofexile.fandom.com/wiki/Passive_skill), [Notable Passive](https://pathofexile.fandom.com/wiki/Notable_Passive) - COMMUNITY
- [Delirium cluster jewel info (GameBanshee)](https://www.gamebanshee.com/3ufk3) - COMMUNITY
- [Icy Veins: Paragon vs D4 skill tree](https://www.icy-veins.com/d4/news/why-paragon-may-be-a-bigger-problem-than-diablo-4s-skill-tree/), [Dexerto](https://www.dexerto.com/diablo/diablo-4-last-epoch-skill-tree-rework-request-2558247/) - OPINION
- [Hades Pact of Punishment (RPG Site)](https://www.rpgsite.net/feature/10287-hades-pact-of-punishment-heat-modifiers-and-how-to-maximize-your-rewards), [Hades vs Hades II (Choost)](https://choostgames.com/blog/hades-vs-hades-2/) - COMMUNITY/OPINION
- [Hollow Knight wiki: Charm Notches](https://hollowknight.wiki/w/Charm_Notches) - COMMUNITY
- [Spirit Hunters review summary (Vaporlens)](https://vaporlens.app/app/1914580/spirit_hunters_infinite_horde), [Seasoned Gaming review](https://seasonedgaming.com/2023/07/21/review-spirit-hunters-infinite-horde-unending-spirit/) - COMMUNITY/OPINION
- [Brotato reviews (TouchArcade)](https://toucharcade.com/2023/04/04/brotato-iphone-ipad-android-review/), Vaporlens Brotato summary - OPINION
- [Wayline: problem with skill trees](https://www.wayline.io/blog/the-problem-with-skill-trees), [Bugnet: skill tree fun to plan](https://bugnet.io/blog/how-to-design-a-skill-tree-thats-fun-to-plan), [GMTK transcript](https://amara.org/v/C3BEZ) - OPINION
- [Skyrim constellation notes](https://gameranx.com/updates/id/3431/article/skyrim-secrets-dragon-armor-perk-constellations-and-dragon-shout-strength/) - COMMUNITY
- Earlier verified notes: docs/research/19, 22, 38 (checked 2026-10-18)
