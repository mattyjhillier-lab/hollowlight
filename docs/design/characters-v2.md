# Characters v2: the character system redesign (design sheet, NOT locked)

Source: Matt's BIG IDEA 2026-10-24 (docs/QUEUE.md) + fixed rule from Matt (2026-10-24, via coordinator): **character levels are granted ONLY after a run ends (win or death), never during a run.** Bond XP is earned in the run (kills, chests, boss, time) but banked and applied on the results screen. In-run stats are fixed for the whole run.
Mock-ups: docs/mockups/characters/ (`node shoot.mjs`; own headless Chrome, temp profile deleted). Pages: ch-page (Characters page), ch-loadout (map-select loadout step), ch-results (results level-up beat). 1280x720, 844x390@2x, 390x844@2x.
Status: DESIGN ONLY. Nothing here is built or locked. Matt picks via one-tap questions (section 8).

## 0. Matt's proposal in one screen

1. A **Characters** page (own tab, beside the Lantern Web and the Almanac). Characters are woken there, by their own resources found in play, not by tree gates.
2. Every character starts with the **same body** (HP, speed, ward). Characters gain **Bond levels** by being played; each level is a small stat step. The tree still gives shared stat boosts.
3. No fixed weapon. At map select the player picks **character + starting spirit** (any weapon whose tree heart is awake).
4. Characters differ ONLY by their **action skill (ability)** and their **look** (silhouette, accent, animation personality, barks).
5. Wren's and Elias's abilities are redesigned to work with any weapon.

Fixed rule (all options): levels and Bond XP are applied once, in `bankRun`, alongside gold. A run that is quit from pause banks like a defeat (same path as gold today). A crash or closed tab mid-run banks nothing, so the save is never half-written and nothing changes mid-run.

## 1. Research (how comparable games do it)

| Game | Character progression | Loadout freedom | Label |
|---|---|---|---|
| Vampire Survivors | Characters bought with gold or unlocked by achievements; each has a fixed starting weapon and its own passive growth (stat every N in-run levels). No out-of-run character levels. | Starting weapon fixed per character; characters are mostly "starting weapon + stat quirk". | OFFICIAL (in-game, wiki) |
| 20 Minutes Till Dawn | Characters unlocked with gems; each has a passive/active quirk. | **Character and weapon are picked separately** before a run, any unlocked weapon. Closest precedent to Matt's idea. | OFFICIAL |
| Brotato | Characters are big stat modifiers (huge differences); no character levels; per-character "danger" clears tracked. | Starting weapon picked from a short list allowed for that character. | OFFICIAL |
| Hades | One character; six weapons unlocked with Chthonic Keys; each weapon has Aspects upgraded with Titan Blood (per-weapon mastery). | Weapon picked freely in the House before each run. Mastery attaches to the weapon, not the body. | OFFICIAL |
| Deep Rock Galactic: Survivor | **Per-class mastery levels** from playing that class; each level a small reward (stat or unlock). | Class picks the starting weapon set; later weapons freely. | COMMUNITY (guides, patch notes) |
| Halls of Torment | Characters woken by quests (do X with Y); characters keep distinct starting abilities; shared "blessings" and item unlocks. | Starting ability fixed per character. | COMMUNITY |
| Soulstone Survivors | Many characters, each with own skill set; large shared account-wide unlock tree. | Skills drafted in run; characters keep a signature kit. | COMMUNITY (not verified first-hand) |
| Spirit Hunters: Infinite Horde | Heroes with a signature weapon and an active skill; account tree. | Signature weapon per hero. | COMMUNITY (store page, videos; unverified details) |
| General (GDC/postmortems on mastery tracks) | Per-character mastery drives replay of "the ones you have not tried" only if every level is visible and small; big level power makes the game feel solved. | Loadout freedom works when defaults are strong and the choice is shown only once it exists. | OPINION |

Lessons: (1) loadout freedom is proven (20MTD, Hades) and removes hero-x-weapon balance cross terms; (2) per-character mastery (DRG:S) gives "play them all" pull; (3) when bodies are identical, the ability must carry the whole identity, so each needs one strong, felt verb; (4) never show a choice before it exists (front-door skip rule already does this).

## 2. Conflict list (every locked item this reopens)

| # | Locked item (source) | What changes |
|---|---|---|
| 1 | Launch heroes row: "other 8 heroes unlock later via the tree" (LOCKED l.11) | Heroes woken on the Characters page by keepsakes/tokens, not tree gates. `characters.json` `treeGate` and tree effect `unlock:'hero'` retire. |
| 2 | Abilities row: Rally the Pack / Candle Wheel, "Pelt Dash later as unlock" (l.12); W2 Rally + CORRECTION row (wolves only, srcAmps, l.216); W3 Candle Wheel (Orbit lights lock into the ring, l.22); CLAUDE.md "Wren: Pack Howl, Elias: Sanctuary" | Both abilities read a specific weapon; with free loadouts they break when Wren takes Orbit. Redesign (section 5). Ids `rally_pack` / `candle_wheel` retire or are re-specified. |
| 3 | Elias stats (speed 76, HP 130 -> 150, holy +30%: l.17, R1 row l.214); Wren HP 60, speed 96, moveSpeed x1.1 (characters.json) | Removed. One shared body (section 6). Holy +30% trait removed, so Holy Orbit base power is retuned once on its own. |
| 4 | Hero/weapon pairing: BIBLE section 3 headers ("Wren, the Orphan - Ghost Wolves"), CLAUDE.md roster list (Mara/Raven Flock, Thomas/Lantern Wisps, ...), `characters.json` `weapon` | Pairing becomes a **kindred spirit** suggestion only (default pick + a small mark), no stat link. BIBLE role families (Beastcallers, Lightbearers) stay as LOOK. Wren's pup and Elias's flame ring stay as cosmetic companions. |
| 5 | R1 retune: "both heroes in the 15-30% no-tree band"; "Wren vs Elias gap small" (l.201, l.214, l.221) | Band becomes per **starting weapon** (no-tree starter pool); hero gap = ability gap only (section 6). |
| 6 | Skill tree v2: three-node hero lantern for Wren and Elias (l.225; src/data/tree/heroes/*.json: ch_wren, wr_grip, wr_spark, ch_elias, el_wheel, el_lamp); ch_* lanterns buff the signature weapon; unlock `useCharacter n`. TREE-GEN1 (BUILT 2026-10-24, l.340): ability tree params now declared in characters.json (`ability.tree` rallySecs / wheelRadius, `treeVisuals` kinSparks / graveLamp), hero fragments carry a `signature` weapon (layout angle offset), codex `h:wren`/`h:elias` frozen bits, later heroes `codexBit` | Hero lanterns leave the tree. Ability nodes move to the Characters page as Bond rewards (option C) or retire (A, B). The ch_* weapon buffs (e.g. "Ghost Wolves bite +4%") move into that weapon's own branch (weapons stay in the tree). Ids retire as tombstones (save-v3 H2). `ability.tree` keys are replaced by the new abilities' keys (or dropped in A/B); `treeVisuals` stay as cosmetic Bond rewards; `signature` becomes `kindred` (default pick + layout only); `codexBit` and frozen hero bits unchanged. Tree budget: hero lantern PE freed. |
| 7 | Tree gates/conditions with a hero: Vesper Tide gate 16 "play 8 runs as Elias" (l.197), Hearth-key `clearTier ... hero` (hearthkey.json), DT first-clear bounty per hero per tier (l.241) | Hero-in-condition becomes **weapon-in-condition** where the intent was the weapon ("8 runs starting with Holy Orbit"). Per-hero first-clear Dawnglass bounty: keep per hero (it rewards trying characters) - flagged for Matt. |
| 8 | TREE IS CHARACTER-AGNOSTIC (l.335) + TREE-GEN1 proof (tests/treegen.test.mjs, fixtures/hero3* "Sable": Spirit Bolts, 110 HP, still_hour) | Kept and simplified: no hero fragments in the tree at all. The hero3 fixture drops its own HP/weapon and becomes "ability + look + kindred" data; the test still proves a new hero needs no code edit. |
| 9 | Front door: U3 hero select ("Walk with Wren"), FD4 night select ("Begin with <hero>", skip rule), flow hero -> map -> run (l.40, l.99, l.320) | Hero select becomes the **loadout step** (character + spirit); FD4 night screen and its skip rule unchanged. Labels "Walk with Wren · Ghost Wolves". |
| 10 | Save v3 (l.235, l.239): `stats.charsUsed`, `stats.tiers[ch][tier][hero]`, results `r.character` | New validated block `chars` (Bond XP/level per character, keepsakes), `notes.loadout` (last pick), `stats.startWeapon` counts. Additive. |
| 11 | Codex + celebrations (l.333, l.338): Almanac hero pages `h:wren`, `h:elias`; Big = "New hero" | Kept. Add Bond level-up as a results beat: Small (level 1-9 line), Medium (level with a reward, e.g. 5, 10), Big unchanged (new character woken). Counts toward the 1 big + 3 medium cap. |
| 12 | Audio (locked cue list) | New: two ability cues (replace the Rally whistle-howl and wheel cues), one `bond_level` cue at results (reuses the level-up motif, Calm halves it). |
| 13 | First minute / whispers (FM1-5, l.331) | Whispers that name Rally or wolves need neutral copy ("Space: your action skill"). |
| 14 | DT0/Sim inputs, sweeps (scripts/sweep.mjs, bless-sweep, gates-*) | Sweeps gain `WEAPON=` alongside the hero arg; Sim takes `{character, startWeapon, bond}`. |
| 15 | Results U6 (l.111) | Adds the Bond beat (ch-results mock). |
| 16 | CONTENT-GUIDE "how to add a hero" (T8) | Hero = look + ability + keepsake data. Cheaper (extensibility principle win). |

Not reopened: **WEAPONS STAY IN THE TREE** (Matt, 2026-10-24, l.343: each weapon still unlocks in the tree via its heart/gate, resources and challenges, and keeps its own branch; the loadout only lets the player START with any weapon already unlocked there), tiers, Dawnglass, Blessings, evolutions, weapon stats, Burn on Holy Orbit (moves with the weapon), lanterns/profiles, ability 60 s base cooldown, role colours, barks.

## 3. Decision 1: character progression model (all bank at results only)

**A (Recommended) Bond levels per character + each character's own keepsake.**
- Each character has its own Bond XP. Earned in the run, banked at results: 1 per 25 kills, 15 per chest, 40 per boss kill, 3 per minute survived, 30 for a dawn (victory). Per-run cap 260. A typical Twilight run gives ~150-220.
- Level cost 100 + 60 x (level - 1); cap **10** at launch (+5 per future chapter band). Level 10 = 3,700 XP = ~20 runs for a steady player.
- Each level: one small step in a fixed cycle HP +1% / ward +1% (damage taken) / speed +1% ... At 10: HP +4%, ward +3%, speed +3%. Levels 5 and 10 also give a cosmetic (lantern trail tint, a victory bark). Nothing that touches the ability's power.
- Waking a character: each one has its **own keepsake** (Mara: raven feathers, Thomas: wisp glass, ...). Keepsakes drop only from chests and bosses, once that character's hint condition is met (e.g. Mara: "slay 300 Grave Crows"); max 1 per run; 5 wake the character. Wren and Elias are awake from the start.
- Why: matches "level up the more they are used"; keepsakes tie each new character to a different enemy/place (meta-progression principle); stats stay tiny; one place to look.
- Risk: grinding one favourite to 10 gives ~+3-4% body; inside budget. Keepsake drop table is one more data file.

**B Shared Kinship level + one shared token.**
- One account XP pool (any character fills it); every level gives the small stat step to ALL characters; cap 20.
- One shared resource, **Spirit Tokens**, from chests (1) and bosses (3); characters cost 6 / 10 / 15 tokens in a fixed order.
- Pros: simplest; no "my new hero is level 0" dip. Cons: does not reward playing a particular character (misses point 2); fixed order loses the "different enemies unlock different things" pull.

**C Bond levels with a three-lane choice per character.**
- Per-character Bond as A, cap 10, but each level gives a point the player spends on that character's page in three lanes: Body (HP/ward), Stride (speed), Skill (ability cooldown -2% or duration +0.2 s, floor 30 s). Wakes via a deed (e.g. "Clear Twilight with Raven Flock"), no resource.
- Pros: most depth; the old hero-lantern ability nodes find a home. Cons: a second small tree beside the Lantern Web (scope + balance surface); ability lane makes ablation per build, not per ability.

## 4. Decision 2: loadout flow at map select

Weapon unlock source stays the tree (a weapon heart awake = startable). The starting spirit fills slot 1 at rank 1; slots 2-4 come from level-up cards as now (the starting weapon's "new weapon" card leaves the pool).

**A (Recommended) One Loadout screen: "Who walks, and with which spirit?"** (ch-loadout mock)
- Replaces the U3 hero select in place (same arched cards, same look). Top: character cards (portrait, name, Bond level, ability card with its one verb). Below: a row of spirit chips for every awake weapon (locked weapons show a dim emblem + "Wake it in the Lantern Web").
- Defaults: last pick per lantern. First time ever: Wren + Ghost Wolves preselected; one press/tap of "Walk with Wren · Ghost Wolves" starts (still 2 taps from title). SUPERSEDED 2026-10-31 (NO HERO WEAPON): no kindred mark, no preselected spirit on a first pick, no hero-weapon pairing shown anywhere.
- The spirit row appears only once 2+ weapons are awake (run 1 pool already has Ghost Wolves + Holy Orbit, so it shows from run 1 with Wolves preselected; a first-time player can ignore it).
- Then FD4 night select as built (skip rule unchanged). Keys: 1-4 character, Q/E or arrows on the spirit row, Enter.

**B Three steps: Character -> Spirit -> Night.** Clearer on portrait phones; one more screen and one more tap every run. Better if the spirit choice later gains detail (stat preview).

**C Spirit picked on the night screen.** Hero select unchanged; the FD4 side card gains a spirit chip row. Fewest screens, but FD4 is skipped for new players, so the choice is hidden until Deep Dusk opens, and the night screen gets crowded on 844x390.

## 5. Decision 3: abilities

### 5.1 Principles (apply to all 10 characters)
1. **Weapon-agnostic.** An ability never reads a weapon id. It acts on the hero, on the foes, or on "all your spirits" through a shared hook (rate/amp/position), so it works with every loadout.
2. **One verb** you can feel in a second, readable at 40 px in a crowd (BIBLE).
3. **60 s base cooldown**, active time <= 6 s (or one instant effect). Tree/Bond may only shorten it to the locked floor ~30 s.
4. **Bounded by ablation:** ability ON vs OFF = +2 to +5 win points on the starter pool for EVERY starting weapon (96 seeds x 2 weapons x random/FOCUS); damage share <= 10%; obeys the x1.75 total damage-amp cap.
5. **Fits who they are**: story, personality, animation (Wren fast/forward/whistle; Elias still/tall/lamplighter).
6. Distinct verbs across the roster; no two characters share a verb family.

### 5.2 Wren (round, fast, forward-leaning orphan; amber scarf; ghost pup)
- **A (Recommended) Rally Whistle** - verb *rally*. She whistles, scarf lifts, an amber ring pulses out: for 6 s **all your spirits act 35% faster** (attack/bite/volley gap, one shared rate hook), and the pup howls (non-boss foes within 90 px flinch 0.4 s). Keeps the locked Pack Howl look and the "fights through her pack" fantasy. Est. ablation +3-4 pts. Risk: rate stacking with Wolf speed/Orbit speed ranks: cap total rate at x1.6.
- **B Pelt Dash** - verb *dart*. Wren and the pup dash 130 px along her heading, 0.5 s untouchable, foes she passes are knocked aside (no damage). Pure escape; already named as a future unlock. Est. +2-3 pts (defensive). Risk: one dash per 60 s feels stingy: could be 2 charges sharing the 60 s.
- **C Hush** - verb *hide*. She crouches under her coat: for 4 s non-boss foes lose her (wander, no contact damage), she moves +20%. Tender orphan beat. Est. +2-4 pts. Risk: reads less clearly in a crowd; boss unaffected may confuse.

### 5.3 Elias (tall, still Lamplighter priest; flame ring; candle white)
- **A (Recommended) Sanctuary Ring** - verb *shelter*. He plants a ring of candles (r80, 6 s): inside he heals 1.5 HP/s (the built W3 numbers) and foes that cross the ring are slowed 40% (no damage). Same look as Candle Wheel minus the Orbit-socket trick. Est. +3-4 pts. Risk: slow + heal may be strongest with short-range weapons; ablation per weapon covers it.
- **B Lamplight Vigil** - verb *repel*. He lifts the lantern: a wave of light pushes non-boss foes within 140 px back 80 px and stuns them 0.6 s. Instant, clear. Est. +2-3 pts. Risk: shoves foes out of melee weapons' reach (Wolves) - feel check.
- **C Wax Ward** - verb *shield*. A candle-wax shell absorbs the next 25% of max HP of damage within 8 s, then melts. Est. +2-4 pts. Risk: invisible power unless the shell is very readable; overlaps HP stat.

### 5.4 Ability archetypes for the future 8 characters (verbs only, picked later by the three-options rule)
Mara *mark* (omen: Mark the 8 nearest foes), Isolde *still* (slow time in a circle), Thomas *guide* (wisps light a path, gems and hearts glide in), Gideon *grasp* (grave hands root foes in a line), Captain Vane *discharge* (release stored static as one burst), Sister Agnes *freeze* (bell toll chills all on screen), Kael *wall* (bone wall blocks a side), Hollow One *harvest* (consume nearby souls for HP). All weapon-agnostic.

## 6. Balance implications

- **Simpler final retune.** Today the matrix is hero x weapon x tier (HP 60/150, speed 105.6/76, holy +30% interact with every weapon). After: one body, so the band is tuned per **starting weapon** (2 starters at launch) and the abilities are tuned per ability by ablation. Cross terms gone; adding a character never retunes weapons.
- **Shared body start point** (sweep to confirm): HP 100, speed 92, ward 0. Holy Orbit loses Elias's +30% holy: expect Orbit base power +15-25% in the one retune.
- **Stays tuned per ability:** duration, radius, rate/amp size, cooldown (60 s), the ablation band +2-5 pts per starting weapon.
- **Wren vs Elias gap** becomes the ability gap only: target <= 3 pts (from the current 1.5-4 pt hero gap with very different bodies). Expect easier to hold.
- **Bond levels:** baseline sweeps run at Bond 0 (no-tree band unchanged). Bond 10 (~+3-4% body) counts in the sustain line of the tree soft-cap budget as its own row. Because levels change only at results, a run's stats are fixed from Sim construction: Bond is applied once like `sim.mods`, so the sim stays deterministic and tests need no mid-run cases.
- Weak spot: the hero "feel" (fast Wren, heavy Elias) now lives only in animation and ability; the playtest must confirm they still feel different.

## 7. Save migration (pre-release; save v3 stays v3, tree release guard rules kept)

- **New fields (additive, validated, unknown ids dropped):** `chars: {id: {xp: int 0..cap, lvl: int 0..cap, keep: int 0..5, woke: bool}}`; `notes.loadout: {hero, weapon}` (known ids only, else defaults); `stats.startWeapon: {weaponId: runs}`. Missing block = fresh defaults. All text via textContent.
- **Banking:** `bankRun` adds Bond XP, levels up, and writes once with gold (one write per run). Debug runs bank nothing (existing rule). Quit from pause = defeat bank. Crash mid-run = nothing banked.
- **Seed from history:** existing `stats.charsUsed` runs grant 100 Bond XP per run, capped at level 5, so old saves are not reset to 0. `stats.startWeapon` seeded: Wren runs -> Ghost Wolves, Elias runs -> Holy Orbit (always true before this change).
- **Hero lanterns:** ch_wren, wr_grip, wr_spark, ch_elias, el_wheel, el_lamp retire as **tombstones** {id, frag, idx} (save-v3 H2: ids and slots permanent); owned ranks refunded at the price paid (T3c rising price). No `core.version` bump needed (nothing released on v3; `tree-release.mjs --snapshot` still runs only at the launch merge). Hostile-save tests for the new block.
- **characters.json v2 (post TREE-GEN1):** drop `hp`, `speed`, `traits`, `traitText`, `weapon`; add `kindred` (weapon id, validated against weapons.json), `keepsake` (A only); `ability` gets the new id/numbers and its `ability.tree` keys only if option C (else empty, so the tree validator carries no hero keys); keep `codexBit`, `color`, `treeVisuals` (now Bond cosmetics). Old saved ability ranks (rallySecs/wheelRadius) come only from the retired lanterns, so the refund covers them.
- **Conditions:** `useCharacter` stays valid (codex, keepsake hints); gate 16 changes to a new `startWeapon` condition; tier records keep their per-hero keys.

## 8. Build plan (small chunks, each fully verified)

| Chunk | What | Done check |
|---|---|---|
| CH0 | Lock this sheet (Matt's picks) + update BIBLE/CLAUDE.md/LOCKED | LOCKED rows |
| CH1 | Data: `characters.json` v2 (body, ability, kindred, look); Sim `{character, startWeapon, bond}`; shared body; Holy Orbit retune; sweeps get `WEAPON=` | tests; sweeps 96 seeds x 2 weapons x 2 heroes; band per weapon |
| CH2 | New abilities (Matt's picks) + ablation script | ON vs OFF +2-5 pts per weapon; amp/rate caps; gap <= 3 |
| CH3 | Save block + bankRun Bond + migration + tombstones/refunds | hostile-save tests; refund tests; one-write test |
| CH4 | Loadout screen (replaces U3 hero select) | shots 3 sizes, 44 px, keys, no innerHTML |
| CH5 | Characters page + keepsake drops | shots; drop caps; a11y |
| CH6 | Results Bond beat + celebrations queue + `bond_level` cue + whisper copy | shots; Calm variant; cap 1 big + 3 medium |
| CH7 | Tree cleanup (hero fragments out, gate 16 condition) + TREE-GEN1 synthetic hero = ability-only | tree validators, budget, timeline |

Order fits the release gate: this lands BEFORE the final retune (it is what makes it simpler).

## 9. Risks, fit and mechanical sense

- Risks: identical bodies flatten hero feel (mitigate: strong ability verbs, animation personality); free loadouts let the strongest weapon dominate starts (mitigate: per-weapon band); keepsake grind if drop rates are low (cap runs-to-wake ~6-10); scope (8 chunks) inside the release gate.
- **Fit check:** Characters page and loadout use the locked Lantern Glass kit, arched cards, role accents; abilities keep each hero's locked look (Wren's whistle and scarf, Elias's candle ring); keepsakes are small warm objects the Hollow "remembers" (fits BIBLE light-is-warmth and tender tone).
- **Mechanical sense:** removes hero x weapon cross terms; abilities weapon-agnostic by rule; Bond levels small and applied only between runs (sim deterministic, no mid-run stat change); tree stays character-agnostic (strengthens the 2026-10-24 lock).
- **Security:** no new deps; new save fields validated and capped, unknown ids dropped, textContent only; hostile-save tests in CH3.
