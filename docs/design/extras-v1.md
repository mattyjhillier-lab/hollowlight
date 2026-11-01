# Extras v1: cosmetics, Twilight Assist, Daily seed + Endless Dusk, risk vows (design only, NOT locked)

Status 2026-10-25: v1 = A1 + B1 + C1-A BUILT (docs/LOCKED.md 'EXTRAS v1 (1)/(2)/(3) ... BUILT'); C2 Daily seed and D Risk vows wait for the first update after launch.
Status 2026-10-24: design sheet for the four ideas Matt put in v1 on 2026-10-18 (LOCKED 'EXTRA IDEAS INCLUDED IN V1'). Nothing built. Mock-ups: docs/mockups/extras/ (1280x720, 844x390@2x, 390x844@2x; `node docs/mockups/extras/shoot.mjs`).

Read against: LOCKED rows 'EXTRA IDEAS INCLUDED IN V1' (balance rules), 'Tree screen design' (endgame gold = cosmetic sink once the tree is bought out; Three Dawns excluded from complete), 'Tree economy + Deep Dusk' (rising price +8%, cosmetic shop opens ~run 87, ceilings 30.36/31 and 5.00/5), DIFFICULTY TIERS + DT1/DT2 (Dawnglass per-run caps 6/10, first dawns 6/10, marks on markRng), CHARACTER SYSTEM v2 (Bond cap 25, keepsakes wake heroes, starter pick, heroes differ only by ability + look), FRONT DOOR (night chips, side card, results badge, star row), CODEX CX1-CX7 (1 big + 3 medium celebrations, Calm), RELEASE GATE (nothing to main until done), save v3 (forward-tolerant store, untrusted import).

## 0. Verdict first (honest fit + launch speed)

| Idea | Fits the game now? | Balance risk | Build | Recommendation |
|---|---|---|---|---|
| A Cosmetics | Yes: light, flame and trails ARE the identity; the gold sink is already locked and needs a destination | None if zero power + readability guards | S-M | **KEEP in v1** (small set) |
| B Twilight Assist | Yes: cosy lantern game, accessibility; Twilight pays no Dawnglass so tier rewards are untouched by design | Low (lowers difficulty only; records/stars off) | S | **KEEP in v1** |
| C1 Endless Dusk | Yes: "stay in the dark" after dawn; answers LAUNCH-CHECKLIST #16 cheaply | Low with capped rewards | S-M | **KEEP in v1** (post-dawn continue) |
| C2 Daily seed | Weak without any server: local best only, no one to compare with; today one RNG stream feeds spawns AND cards, so "the same night" diverges after the first different pick unless streams are split (sim change, sweeps no longer byte-identical) | Low power risk, medium determinism work | M | **AFTER v1** |
| D Risk vows / curses | Fits (vows = readable rules like tier rules) but needs the economy re-model + DT8 bot measure; Deep Dusk itself is still being tuned (HP reopened 2026-10-21); it is the 'Gloom dial' already judged "best as a later layer" | Highest (Dawnglass income, 11+ combos to sweep, phone options screen) | M-L | **AFTER v1** |

So: v1 = A + B + Endless Dusk. Daily + vows move to the first post-launch update (designs below stay ready). Matt decides; any of the four can be cut.

Shared rules for all four (from the locked balance rules):
- Zero new power in the tree budget (combat 30.36/31, sustain 5.00/5 unchanged). Cosmetics = 0 PE; assist only lowers difficulty; endless/daily give no permanent power beyond normal run banking; vows pay Dawnglass only, capped.
- Twilight starter sweeps stay byte-identical with every extra OFF (test). Each extra is a plain Sim input (`assist`, `endless`, `vows`, `daily`), whitelisted and validated, never read from the DOM.
- No servers, no leaderboards, no accounts, no network. Everything lives in the lantern save.
- Security: URL params stay whitelisted in `src/params.js` (`?seed=` already clamped to int 0..2^31-1); any new param is debug-only and marks the run as not banked (existing rule). Save fields are additive, sanitised against data whitelists on load (unknown ids dropped, counts clamped), DOM via createElement/textContent only. Share text goes out by clipboard only; nothing is imported from a pasted string in v1.
- Accessibility: every toggle is a real button/checkbox with a label, keyboard reachable (Tab/Enter/Space), states shown by shape + text not colour alone, Calm halves trail particles and removes cosmetic shimmer.

---

## A. COSMETICS

Fantasy/verb: **dress your lantern**. The light you carry and the trail your spirits paint are the game's look; letting players choose their glow is the most on-identity reward possible.

Content (same for every option; numbers estimated):
- **Flame tints (6)**: Hearth (default amber), Dawn Rose, Moon Teal, Candle White, Ember Red-Brown, Lilac Hush. Tint the lantern flame, lantern pool edge and the HP flame. Never pure gold (reserved for evolutions), never the danger/corruption colour, never a role colour at full strength; the pool's brightness never changes (readability).
- **Trail styles (4)**: Thread (default), Petal Drift, Firefly Dots, Ember Motes. Palette/shape swaps of the existing trail system; alpha capped at today's; summons keep their weapon colours.
- **Hero looks**: per hero, Bond 5/10/15/20/25 give a small look each (Wren: scarf colours, pup collar charm; Elias: candle wax hue, wheel ribbon). Silhouette never changes (identity rule). Keepsakes stay a waking resource, NOT a skin currency.
- **Sources**: deeds (Bond milestones, stars, codex titles) are free; 3 tints cost Dawnglass (~5 each, the locked S6 sink); gold items open when the live tree is bought out (locked), priced 6,000 (tints) / 9,000 (trails), +8% per purchase in the group (locked rising price), ~85k total = ~25 late runs. Three Dawns rim (df_star, locked) shows here as worn-able.

### A1 (Recommended) Wardrobe cluster in the Lantern Web + "Wear" drawer
- Cosmetics are lanterns in a small **Wardrobe** tool cluster on the tree's edge (0 PE, category `cosm`, excluded from "complete" like Three Dawns). Deed items light themselves; Dawnglass items buy like nodes; gold items link open when the tree is bought out.
- A **Wear** drawer (one button on hero select, also in pause > Settings) picks what is worn: Flame / Trail / Look tabs, live preview of the lantern + trail.
- Flow: earn/buy in the tree you already know -> hero select "Wear" -> pick -> run.
- Why: reuses the tree engine, prices, connected rule, validator and "can light now" glow; one new small drawer.
- Cost **S-M**. Build: X1 data (`cosmetics.json` + `cosm` nodes, validator: 0 PE, colour whitelist), X2 render hook (tint/trail tables in the existing trail + lantern code, Calm halving), X3 Wear drawer + save field `cosm {owned[], worn{flame, trail, look{hero}}}` sanitised, X4 tests + shots.

### A2 Separate Wardrobe shop screen in the hub
- A new hub screen "Lantern Wardrobe" (mock-up ex-wardrobe) with preview, tabs, swatches showing worn/owned/price/locked-with-progress; buy and wear in one place.
- Clearer as a shop, easy to grow later; but a new screen in the front door, its own buy logic outside the tree's rules.
- Cost **M**. Build: as A1 minus tree nodes plus a screen + buy flow + tests.

### A3 Lantern Offerings (endless gold sink that relights the hall)
- Instead of items, gold is offered to the Lantern Hall: each offering (5,000 rising +8%) relights one more lamp on the title screen and map card, slowly restoring colour to the hub (the Hollow idea applied to the menus). Tints/trails come only from deeds and Dawnglass.
- Never ends (true infinite sink), deeply on-identity; but nothing to wear from gold, and title-screen art per step is real art work.
- Cost **M** (art-heavy).

Sample copy: "Dress your lantern. The Hollow will not care, but the light will." / locked swatch: "Bond 10 with Wren" / gold shop opening line: "Every lantern in the Web is lit. Gold may now buy beauty."

Risks: off-style tints (guard: whitelist palette, review sheet); trails hurting readability in dense swarms (alpha cap, Calm); scope creep into skins (silhouettes fixed).

---

## B. TWILIGHT ASSIST

Fantasy/verb: **a gentler night** for players who are struggling or want a calm run. Twilight only (it pays no Dawnglass, so harder-tier rewards cannot be cheapened by it).

### B1 (Recommended) "Gentle Light": one toggle, fixed bundle
- A checkbox on the Twilight side card ("Gentle Light") and the same switch in Settings. One bundle: foe damage x0.70, foe speed x0.90, heart pity x1.5 (hearts come sooner). Nothing else.
- Paid normally: gold, shards, Bond XP, codex (accessibility players are not punished). A Gentle Light clear COUNTS for the Night Gate (opens Deep Dusk), but Deep Dusk and Long Night have no assist.
- Not counted: Twilight record stars and best times (results shows a small moon: "Gentle Light: stars rest tonight").
- Balance target (bot): no-tree Twilight win ~45-60% with Gentle Light vs 15-30% without; no deaths before ~6:00. Farm check: gold per hour with Gentle Light vs without must not beat Deep Dusk gold per hour (it cannot: Deep Dusk pays x1.5 gold).
- Cost **S**. Build: X5 Sim input `assist` (3 multipliers, data in tiers.json Twilight block, whitelisted), X6 UI toggle (chip side card + Settings) + results moon + stars skip, X7 bot sweep `ASSIST=1` + tests (off = byte-identical).

### B2 Assist panel with separate sliders (Celeste-style)
- Settings > Assist: Damage taken 100/75/50%, Game speed 100/85/70%, Hearts more often (on/off), Ability fires itself at low HP (on/off; overlaps the tree's Steady Hand, so it would make that node pointless on Twilight). Any change = stars rest.
- Most accessible (motor/reaction needs: game speed), but 4 knobs x sweeps, collides with a tree node, and invites "slider then forget".
- Cost **M**.

### B3 Offered, not hunted (adaptive)
- No menu. After 3 Twilight deaths before 5:00 in a row, the lantern whispers on the next night select: "The dark has been hard on you. Walk with a gentler light tonight?" [Yes, gentler] [No, as it is]. Same bundle as B1, per run.
- Zero UI weight, finds the players who need it; but players who want it from the start cannot pick it, and an unasked offer can feel patronising.
- Cost **S**. (Can be added on top of B1 later as the whisper that points at the toggle.)

Sample copy: "Gentle Light — The Hollow bites softer tonight. Your dawn still counts; the stars wait for another night."

---

## C. DAILY SEED + ENDLESS DUSK

### C1 Endless Dusk (recommended for v1)

**C1-A (Recommended) "Stay in the dark" after the dawn**
- On a victory, the dawn beat gets a second button: "Stay in the dark". The run continues from the boss kill: the sky slips back to night, the restored ground slowly greys (life map decay x2), the ramp keeps climbing (density +6%/min, enemy HP +8%/min past 15:00, from the existing curve), marks keep their tier rules.
- Rewards: the run already banked its dawn; endless adds gold at x0.25 of normal, capped at +50% of that run's gold; no extra shards or Dawnglass (run caps unchanged); Bond XP still inside the 260 run cap. Records: "Longest night" per map-tier (local), shown on the map side card.
- Ends on death; the results card shows "Dawn + 6:12 in the dark". A death here is never a defeat (the dawn stays).
- Cost **S-M**. Build: X8 Sim `endless` continue state after the boss (victory flag kept, state back to running), ramp extension data, reward cap in banking (test: forged endless gold capped), X9 UI button + results line + record, X10 sweep: time-past-dawn distribution (target median 3-6 min with a mid-tree kit).

**C1-B Endless Dusk as its own night chip**
- A fourth chip "Endless" on the map card after the first Long Night clear: start at 0:00, no boss, survive as long as you can. Rewards: gold only, capped like a normal Twilight run.
- Clean as a mode, but late to unlock (most players never see it) and the opening 10 minutes repeat a normal run.
- Cost **M**.

**C1-C "Last Stand" encore**
- After the dawn, an optional fixed 3:00 encore: one huge swarm wave, then the real dawn. Score = kills in the encore.
- Short and spectacular; but it is a fixed event, not endless, and repeats identically.
- Cost **S**.

Sample copy: "The dawn is yours. Will you stay in the dark a little longer?" / results: "You held the dark 6:12 past dawn."

### C2 Daily seed (recommended AFTER v1)

**C2-A (Recommended) "Tonight's Night": date seed, set kit, tree off**
- Seed = hash(local date YYYYMMDD) (works offline; changing the device clock only cheats yourself: there is no board). Map Cursed Forest, Twilight, hero + starting weapon chosen by the date from ALL of them (a free taste of locked heroes/weapons, nothing kept), tree and Bond stats OFF so every player plays the same kit.
- Needs split RNG streams (spawns / cards / drops) so two players really get the same night; Twilight normal runs keep the old single stream (byte-identical).
- Rewards: normal gold, no shards/Dawnglass; one daily flame on a streak counter (cosmetic deed: 7 days = Daybreak Ember tint). Local best per date. "Copy result" puts a text line on the clipboard: "Hollowlight · night of 24 Oct · Mara + Spirit Bolts · dawn at 15:00 · 1,912 foes".
- Cost **M**.

**C2-B Daily twist on your own kit**: date seed + one rule from a whitelist (e.g. "Hearts sleep", "Crows in every wave"); your tree and hero; local best. More fun for the player, nothing comparable. Cost **S-M**.

**C2-C Weekly Wanderer**: week seed (ISO week), 3 tries, best kept, same fixed kit as A. Less daily pressure, fits a cosy game. Cost **M**.

Sample copy: "Tonight's night: Mara walks with Spirit Bolts. Everyone who lights a lantern today meets the same dark."

---

## D. RISK VOWS / CURSES (recommended AFTER v1)

Fantasy/verb: **swear a vow to the Hollow** before the night for more Dawnglass. Deep Dusk and Long Night only (Twilight has no glass, keeps the starter band clean).

Economy re-model (all options): today the whole Dawnglass sink is 46 + cosmetics, earned through 6/10 per-run caps and 6/10 first dawns. Vows may raise the per-run cap by at most +2 / +3 (to 8 / 13) and pay ONLY on a dawn (no farming deaths). Model: buying all 46 glass needs ~8 Deep Dusk dawns today; with 2 vows ~6 (est.; DT8 bot to measure). Vow bonus never stacks with the first-dawn bounty multiplier (bounty paid flat). Every vowed dawn is still a normal tier run for stars.

### D1 (Recommended) "Hollow Vows": four fixed vows, swear up to two
- **Brittle Heart**: hearts heal 15% instead of 30%. **Thick Swarm**: spawns +20%. **Sharp Thorns**: foe damage +20%. **Narrow Fan**: one fewer level-up card. Each: +1 Dawnglass at dawn (cap +2). First dawn under each vow on each tier: +3 glass once (12 / tier).
- Shown on the night side card (mock-up ex-vows) as four toggles, max 2, reward line live.
- 11 combinations per tier to sweep (none, 4 singles, 6 pairs). Target: each single costs ~5-10 win-% on the tier's full-tree kit; no pair below 10% win.
- Cost **M**. Build: X11 `vows.json` + Sim inputs (all multipliers on existing knobs), X12 banking caps + tests (forged vows/glass), X13 UI, X14 sweeps + economy table update.

### D2 Hollow bargains in the run
- At levels 10 and 20 one card may be a dark bargain: "Take Thick Swarm for the rest of the night: +1 Dawnglass at dawn". In-run choice, no menu.
- Exciting moment; but it fills a card slot (dilutes picks), and players cannot plan for it.
- Cost **M**.

### D3 Ember Wager: one dial
- One stake 0-3 before the night; each step: foe HP and damage +10%; +1 glass per step at dawn.
- Easiest to balance (4 states), one control on phones; but the least interesting (pure numbers, no new rule to read).
- Cost **S**.

Sample copy: "Swear a vow to the Hollow. Keep it until dawn, and the glass remembers." / cap line: "Vows add up to 2 Dawnglass at dawn (tonight's glass: up to 8)."

---

## Fit check
Cosmetics are light and trails (the Hollow identity), palette-guarded; Gentle Light is a softer lantern, not a cheat menu; Endless Dusk is the night returning after dawn with the ground greying again (bittersweet, on-theme); daily nights and vows are readable rules in Hollowlight's voice. Mechanically: no option adds tree power, Twilight sweeps stay byte-identical with extras off, tier rewards stay tier-only.

## Conflict check vs docs/LOCKED.md
- Cosmetic gold sink 'once the tree is bought out': A1/A2 honour it (gold items open then; deed/Dawnglass items earlier, matching S6). A3 changes what gold buys -> needs Matt.
- Twilight Assist row says 'disables record stars': B1 honours it; gate opening with an assisted clear is a NEW call (recommended yes, in the decision).
- Daily/endless row 'all local, no server', 'no extra permanent power or capped records': met. Moving Daily to after v1 changes the 2026-10-18 v1 scope -> Matt's call (decision 1).
- Curses row 'cap curse income per run, anti-farm, measured by the bot (DT8)': D1 caps per run and pays on dawn only. Moving vows to after v1 also changes v1 scope -> decision 1.
- Character v2: heroes differ only by ability + look -> hero looks are look-only; keepsakes untouched.

## Security check (design)
Seeds from the date are computed locally (integer hash, no params needed); `?seed=` stays clamped; any `?assist/endless/vows` params debug-only and unbanked; save fields additive and whitelisted; clipboard text built from numbers/ids only; no new dependencies.
