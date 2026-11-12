# New tree landmark verbs v1: Lamp-lighter and Starting Synergy (DESIGN ONLY)

Date 2026-11-12. Status: options for Matt, nothing built, no balance change, nothing locked. Follows LOCKED 'TREE DRY STRETCH = NEW LANDMARKS' (2026-11-12) and 'TREE REWORK PICKS' (Set B: reserved slots Starting Synergy + Lamp-lighter). Standing rule 'new content = three options, Matt picks'. The reference (docs/research/34, lessons L5, L8) is inspiration for STRUCTURE only: no names, art or text copied.

## 0. Why, and the rules every option must respect

- Gap: landmarks-only p25/p50/p90 = 13/17/30 runs (pacing-v2); the Long Night gate (p50 run 44) and Fourth Card (p50 50) are far out, so runs ~26-42 have no landmark. Gold per run is about 1,000-2,600 (loss to win), so a 12-run stretch earns roughly 15-25k gold: a landmark with a path of about 6-8 small nodes (4-6k) plus a 1,500-2,500 landmark fits one gap if its CONDITION lands near runs 26-35.
- Landmark rule (LOCKED 'ALWAYS SOMETHING TO BUY UP TO'): reached by a path of small stat/utility nodes, connects onward; path nodes live in path regions outside weapon clusters; a purchase changes something visible (research L5).
- Power rules: soft cap + PE ceiling (treebudget.js: combat 31 at cap, sustain/verb 5.00 which is already fully used, status cap 8%). A new verb is priced INSIDE an existing category or ships with a ceiling raise (rule edit + snapshot test + LOCKED row). Everything below is sized under about 0.3 PE; treebudget confirms at build.
- Targets to hold (FINAL RETUNE TARGETS): fresh Twilight 15-30%, mid tree 30-55%, max 65-90%, Long Night max 10-20%, no deaths before ~5:00, deaths spread 6-14 min, abilities a modest share (ON vs OFF within 1-2 win points), Wren vs Elias gap small. When a node is NOT owned every effect is a no-op, so existing sweep cells stay byte-identical.
- Hooks that exist: `sim.mods {damage, area, cooldown, speed, pickup, xp, gold, abilityCd}`, `T.perks`, banked site counters (save SITE_KEYS lamps/roads/knots), own seeded streams (Twilight draws do not shift).

## 1. LAMP-LIGHTER (landmark verb, fills runs ~26-42)

Context: Lamp Posts (map events): 12 lamps in 3 wake groups (0:40 near, 4:20 mid, 10:20 far; 4 per group = 2 XP + 1 gold + 1 heart, shuffled per seed), reward glyph shown when you approach, instant light by touch. The reserved-slot brief was 'see lamps early'. Name clash: Elias's look is already 'the Lamplighter', so the in-game node name should differ (names under each option).

### Option A (Recommended): FAR SIGHT, 'the lamps show themselves'
- Fantasy/verb: you learn to read the Hollow's dark; unlit lamps glimmer as embers at the screen edge so you can plan a route. Verb: SPOT, then walk.
- Look/sound: a tiny amber ember plus the reward glyph (gold/XP/heart) pinned to the screen edge toward each awake lamp, in the existing Warm Lantern glass kit; Calm mode: static, no pulse. A soft wick-flicker tick when a group wakes (code-made, the lamp wake cue pitched down).
- Numbers: information only, no damage. Detect radius by rank 900 / 1,400 / 2,100 u. Expected about 1-2 more lamps lit per run (of 12): roughly +0.15 L XP and +10 gold per run, about 0.1 PE in the existing pickup/collection category (no ceiling raise). Win-rate move inside noise (< 2 points).
- Fit: Wren (fast scout) and Elias (lamp bearer) both gain; works with all 5 weapons; a utility landmark, not a +1% stat.
- Unlock: tool landmark `lamp_sight` (tool region, orbit tier 3 Dusk, beside the Lantern Road / Satchel tools). Condition: banked `lamps` stat >= 120 (about 10 per run, so run ~15-30 for players who touch lamps; steady, no kill grind). Cost band: path of 6 small collection nodes (250-600 gold) + landmark 1,800 gold; ranks 2-3 are diamonds at 1,500 / 2,500. Onward link to Lantern Road and Hollow Knot, so it starts a 'Places' spine.
- Risks: edge arrows can clutter the phone screen (cap 4, edge-pinned, 44 px safe); some players will ignore it; least exciting of the three.
- Verify with: `scripts/rt-matrix.mjs` with SITES=1 (bot walks to lamps inside the radius), 48 seeds per cell before/after, expect inside noise (+-7 at 96 seeds); unit test that arrows show only awake, unlit, in-range lamps; treebudget test (<= 0.15 PE); `scripts/pace-v2.mjs` re-run for the gap.
- In-game name: 'Far Sight'.

### Option B: RELIGHT, 'a lit lamp rekindles your spirit action'
- Fantasy/verb: touching a lamp lights it and flickers your hero's action back to life. Verb: LIGHT to recharge.
- Look/sound: a thin gold thread jumps from the lamp to the hero's action button and the ring flashes warm; a rising two-note chime. Wren: the pup yips. Elias: his candle crown brightens (existing rig flares, no new art).
- Numbers: each lit lamp takes 6 s off the running ability cooldown, capped at 24 s per run (abilityCdFloor still applies). With about 6-9 lamps lit that is roughly +0.4 extra ability uses per run. Pelt Dash (0.5 s untouchable) and Sanctuary Ring (1.5 HP/s for 6 s) are both modest, so ON vs OFF should stay within 1-2 points. Budget: the abilityCd category, small PE, no ceiling raise.
- Fit: strongest match to the ABILITY DESIGN PRINCIPLE (tied to the hero, one felt verb, bounded). Weaker for pure weapon play; may help Elias slightly more, so watch the Wren/Elias gap.
- Unlock: landmark `lamp_relight`, tier 3 Dusk, after the Almanac tool side. Condition: 150 lamps lit AND 5 Chapter 1 clears (not lamp-only). Cost band: path of 7 small nodes (abilityCd -1% steps, pickup) 300-700 each + landmark 2,200 gold; a second rank (cap 36 s) is a far diamond at 3,000 gold, so it can fill a later gap.
- Risks: lamps are early (0:40 / 4:20), so the refund arrives when the ability is least needed (mitigation: store it as a banked 'cd credit' applied when the NEXT cooldown starts); stacking with other cooldown perks (the floor blocks it).
- Verify with: wren + elias, random + FOCUS, 96 seeds, ability ON/OFF x Relight ON/OFF; sweep-all on the three power states; unit test that abilityCdFloor is never breached.
- In-game name: 'Relight' (so Elias keeps his title).

### Option C: AFTERGLOW, 'a lit lamp keeps a pool of light'
- Fantasy/verb: lamps you light keep burning for a while and become a small camp. Verb: HOLD the lamp.
- Look/sound: a warm pool (radius 70 u) breathes around the lit lamp for 20 s and colour returns under it (life map, visual only); a soft hearth hum inside (Calm: no sway).
- Numbers: inside the pool you deal +10% damage and foes are slowed 10% (refresh only, never stacks, like Mark); 20 s per lamp, newest lamp only. Average about +1% damage over a run, peak +10% in the zone. Budget: combat category (about 0.3 PE), and combat is at its 31 cap, so it needs an offset or raise.
- Fit: strong lantern identity, but it asks a survivors player to stand still, which fights kite-and-move and the 'touch and leave' design of lamps; overlaps Elias's Sanctuary Ring.
- Unlock: `lamp_afterglow`, tier 3 Dusk toward Far Hollow, condition 100 lamps lit, path 6 nodes + 2,000 gold.
- Risks: camping spots could skew the 6-14 min death spread; combat cap pressure; most new rendering plus a new sim zone.
- Verify with: does the bot stand in pools (positional test), win and death-time histograms vs LOCKED spread, treebudget ceiling, Wren vs Elias gap.
- In-game name: 'Afterglow'.

Recommendation: A (cheapest, exactly the reserved-slot brief, does not move balance). Choose B if Matt wants the landmark felt in play. A and B can both ship later (A first, B as the next node on the Places spine). C last.

## 2. STARTING SYNERGY (per-weapon run-start bonus)

Context: any hero can start with any starter weapon (balance.starter: heroes '*', 5 weapons). The reference gives each hero a synergy per ability, but our heroes differ by ability and look (CHARACTER SYSTEM v2, the weapon is chosen at the loadout). So a synergy here is one node per WEAPON (5 nodes; Dragonfire reserved) with hero-flavoured visuals (Wren and Elias show it differently) but the same rule for both. That keeps 5 designs instead of 10 and no hero gets a clearly best pairing (research L9, Wren vs Elias gap target).

### Option A (Recommended): KINDLING START, 'your first spirit is already awake'
- Fantasy/verb: the run opens with the starter weapon burning bright, then it settles. Verb: BEGIN strong.
- Look/sound: for the first 60 s a faint halo in the weapon's colour; Wren: the pup runs a step ahead leaving an amber trail; Elias: the candle crown flares and the first orbit light drifts out slowly. A soft 'match strike' at 0:00 (code-made). A thin kindling arc under the HP flame empties over 60 s. Calm: static halo, no pulse.
- Numbers: for the first 60 s the STARTER weapon fires 25% faster (cooldown weapons) or turns 25% faster (Holy Orbit), fading linearly to 0 at 60 s: about +12% on one weapon over that minute, then nothing. Expected fresh win 0-1 points, deaths before 5:00 down about 1 point (helps that target), mid/max unaffected. Budget: one verb item about 0.1-0.2 PE in sustain/verb, which is at its 5.00 ceiling: either trim a matching node or take a small Matt-approved raise (see Question 3).
- Fit: universal, readable, all 5 weapons, per-hero flavour only.
- Unlock: 5 `synergy_*` diamond landmarks, one at the outer end of each weapon cluster (after its first evolution seal), orbit tier 3-4, cost band 1,500-2,200 gold each, condition 'Chapter 1 clears' 8 / 10 / 12 / 14 / 16 (no per-weapon kill counter exists, so none is invented). First appears around run 26-32, the rest chain to about run 42.
- Risks: 60 s is short, so low excitement; mostly helps newer players (fine for retention, not a mid-game wow).
- Verify with: sweep-all, rt-matrix, bless-sweep with the flag ON/OFF per weapon x wren/elias (96 seeds, +-7 noise); OFF cells byte-identical; deaths-before-5:00 and death-time histogram; unit test that the bonus is exactly 0 after 60 s.
- In-game name: 'Kindling Start'.

### Option B: HERO'S ANSWER, 'when you act, your spirit answers'
- Fantasy/verb: using the hero's action wakes the starter weapon for a moment. Verb: ANSWER the hero.
- Look/sound: Wren dashes and the pack surges beside her; Elias plants candles and the orbit lights spin up. A 5 s halo in the weapon colour and a small answering chord.
- Numbers: on ability use the starter weapon gets +30% speed/rate for 5 s (one stat per weapon: wolves speed, ravens Wingbeat, bolts volley rate, chain cooldown, orbit speed). Uptime about 8% (5 s of 60 s): about +2.5% on one weapon on average, but it raises the ability's share (ON/OFF sweep must stay within 1-2 points). Budget about 0.2 PE in abilityCd/verb.
- Fit: best character fit (meaningful, tied to the hero), but it is NOT a run-start bonus and depends on ability uptime.
- Unlock: same 5 landmarks, 2,000-2,800 gold each, condition 'use the hero's action 200 times' (needs a new banked counter: versioned save field, sanitized, clamped).
- Risks: a new counter; makes Pelt Dash feel mandatory; Elias's ring is defensive while Wren's dash is brief, so the gap needs checking.
- Verify with: ability ON/OFF ablation with the synergy ON/OFF (96 seeds per cell), Wren/Elias gap, sanitize test.
- In-game name: 'Hero's Answer'.

### Option C: KINDRED RIDER, 'each pairing carries its own small gift'
- Fantasy/verb: a named little trait per hero x weapon pairing (for example Wren + wolves: the first wolf is a pup that never leaves; Elias + orbit: the first light is a candle that heals a speck).
- Look/sound: a unique small visual and cue per pairing.
- Numbers: each rider about +3% power-equivalent, 10 pairings now (2 heroes x 5 weapons), 50 at ten heroes.
- Fit: most characterful and closest to the reference, but content-heavy, each pairing needing its own three-options round, and a risk that one hero is clearly best with a weapon (L9). Adds hero-specific rules, which edges against CHARACTER SYSTEM v2.
- Unlock: per pairing, after the hero wakes; no cost band set.
- Verify with: full hero x weapon x cell matrix (very heavy).
- In-game name: 'Kindred Rider'.

Recommendation: A now. B later as the rank-2 diamond of A (they compose). C parked with the hero trial lantern.

## 3. Fit check vs LOCKED (conflicts)

- TREE DRY STRETCH: every option is a landmark node aimed at runs 26-42; no existing condition lowered. OK.
- ABILITY DESIGN PRINCIPLE: bounded, one verb, hero-flavoured; Lamp B and Synergy B touch abilities and need the ON/OFF ablation and a cap. OK.
- ALWAYS SOMETHING TO BUY UP TO: each node reached by a path in path regions; costs tuned with pace-v2. NEW ids need no migration; changing `requires` of released ids goes with the already-approved refund-everything reset (core.version 5).
- Soft cap / PE ceiling: Lamp A/B and Synergy A/B under 0.3 PE; sustain/verb is exactly at 5.00 (flagged as Synergy Question 3); combat is at 31 so Lamp C needs an offset, one reason it ranks last.
- STARTER HANDLING: synergy applies to whatever weapon the player started with; the free lit heart + seal stay; synergy is a separate bought node; no forced connection. OK.
- CHARACTER SYSTEM v2 (heroes differ by ability and look): Synergy A/B keep one rule for both heroes. C does not.
- Release Gate / tree rework Q chunks: these are tree-data additions on dev after the Q chunks, not on main; each still needs its own LOCKED row, build chunk and sweep (nothing is locked by this doc).
- Naming: 'Lamp-lighter' collides with Elias's 'Lamplighter'; in-game names above avoid it; the brand-name test (nothing says Hollowlight) applies.
- Reserved slots keep their place in region records until built (no ids, no migration).

## 4. Questions for Matt (AskUserQuestion-ready; answers go to docs/LOCKED.md)

### Block 1: Lamp-lighter landmark

1. Header "Lamp power". Question: "Which lamp power should the new Lamp-lighter landmark give?"
   - "Far Sight (Recommended)": unlit lamps show their reward as little embers at the screen edge so you can plan a route; no damage, no balance change; cheapest and safest.
   - "Relight": every lamp you light shaves 6 s off your hero's action cooldown (max 24 s a run); more exciting, ties to Wren's dash and Elias's ring.
   - "Afterglow": a lit lamp keeps a small glowing camp for 20 s (small damage boost, slows foes); most visual, but pushes you to stand still and uses combat budget.
2. Header "Name". Question: "What should the node be called in the game, since 'Lamplighter' is already Elias's title?"
   - "The power's own name (Recommended)": Far Sight / Relight / Afterglow, so Elias keeps his title.
   - "Lamp-keeper": one name whichever power wins.
   - "Keep 'Lamp-lighter'": shares the word with Elias and may confuse.
3. Header "Unlock". Question: "When should it unlock?"
   - "After 120 lamps lit, about run 26-32 (Recommended)": fills the quiet stretch using what players already do.
   - "120 lamps plus 5 Chapter 1 clears": a little later and harder.
   - "Much later, run 40+": only if you want it as a late bump.

### Block 2: Starting Synergy

1. Header "Synergy". Question: "Which starting synergy should each weapon get?"
   - "Kindling Start (Recommended)": your starter weapon runs 25% faster for the first minute then settles; Wren's pup and Elias's candle crown show it; small, safe, helps new players.
   - "Hero's Answer": using your hero's action gives the starter weapon +30% speed for 5 s; tied to the hero, but needs ability use and a new counter.
   - "Kindred Rider": a unique gift for every hero and weapon pair; most character, but ten designs now and a balance risk; parked for later.
2. Header "Unlock". Question: "How should the five synergies unlock?"
   - "One diamond at the end of each weapon branch, in a chain (Recommended)": the first around run 26-32, the rest spread to about run 42.
   - "All five behind one Kindred Hearth landmark": one purchase gates all five; less to buy.
   - "Each tied to its own weapon's kill count": needs new per-weapon counters (a save change).
3. Header "Budget". Question: "The verb budget is already full. How do we pay for the synergy?"
   - "Trim one existing verb node by the same amount (Recommended)": every cap stays exactly as it is.
   - "Raise the verb ceiling by 0.2": simplest, tiny power rise; needs your yes under the soft-cap rule.
   - "Charge it to the combat budget": no ceiling change, but combat is already at its cap.

Right now: Matt's picks on both blocks. Next: LOCKED rows, then one chunk per verb (data, sim flag, tests, sweep, pace-v2 re-run). Parked: Kindred Riders, hero trial lantern, companion egg.
