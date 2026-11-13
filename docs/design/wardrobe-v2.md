# Wardrobe v2: costumes, ring rewards, preview (design sheet)

Date 2026-11-12. Status: DESIGN ONLY, awaiting Matt. No code, balance or assets changed. Does not touch docs/LOCKED.md or docs/QUEUE.md.
Reopens nothing: extends LOCKED "EXTRAS v1 (2) COSMETICS BUILT" (zero-power, derived ownership, `cosm.worn` only) and fills the open row "RING COMPLETION REWARD = COSMETIC" (2026-11-02, "three options then").

## 0. Decisions for Matt (max 3, recommended first)
| # | Decision | A (Recommended) | B | C |
|---|---|---|---|---|
| 1 | What a ring gives | **Ring Keepsakes**: each ring completed gives every hero one named costume (a palette + one accessory on the existing rig) | **Mix-and-match pieces**: each ring gives one piece (cloak, trim, charm), you combine them | **Lantern-side only**: rings give flames, trails, portrait frames; one costume per hero in total |
| 2 | The special costume | **Dawnbearer**: all five rings complete, per hero | **Deed costume**: win Deep Dusk with that hero | **Bond 25 costume**: the hero's last Bond level |
| 3 | Preview and equip | **Wear drawer v2**: live preview on the real rig, a ring-by-ring shelf | **Dress-up booth**: separate Wardrobe screen with poses | **Pick at hero select only** (no preview beyond the card portrait) |

## 1. What the Wardrobe is for (plain words)
- A place that answers "what did all that tree-walking earn me that I can SEE?". Power is the tree's job; the Wardrobe is the vanity reward, and the only reward that never changes balance.
- Today (built): 7 zero-power lanterns (flames, trails), hero looks from Bond levels (wisp colour + small charm), Wear drawer on hero select (Flame / Trail / look, live preview).
- Gap: the five distance rings (Hearth, Wick, Dusk, Far Hollow, Deep Hollow; LOCKED "TREE RINGS PICKED", each has a progress arc) finish with nothing to show. Matt wants a ring finish to feel like an event, plus one special costume.

## 2. Research (labels: OFFICIAL / COMMUNITY / OPINION)
- Spirit Hunters: heroes have skins unlocked by play and store/event items (COMMUNITY; exact unlock list UNVERIFIED). Lesson: cosmetics as a long-tail goal.
- Hades: weapon aspects and house cosmetics bought with a resource, visible in the hub (COMMUNITY). Lesson: the reward must be seen where you live, here the hero select.
- Vampire Survivors / Brotato: skins mostly tied to achievements or the character's own milestones (COMMUNITY). Lesson: tie a costume to a deed so it reads as earned.
- Common risk: a changed look can hurt silhouette readability in a swarm (OPINION). Wispwick rule already locked for hero looks: silhouette untouched.

## 3. Area 1: what a ring completion gives

| | A Ring Keepsakes (Recommended) | B Mix-and-match pieces | C Lantern-side only |
|---|---|---|---|
| Fantasy | Finish the Hearth and your hero gets their "Hearthwarm" outfit; each ring has its own colours and a small motif matching the ring's engraved rune | Every ring gives a loose piece (scarf colour, hem trim, charm); dress your hero from what you own | Rings light up your lantern: new flames, trails, a portrait frame. Costumes only come from deeds |
| Look | 5 outfits per hero (10 at v1) + the special. Each = a recolour of the existing rig palette plus ONE overlay (trim line, hem pattern, small charm) drawn in code | 3 slots with 3-5 options each; combinations multiply | No new hero art; uses the existing flame / trail pipeline |
| Earned | Ring complete = all real lanterns of that tier owned (same count as the ring's progress arc). A "Keepsake" toast when the arc closes | Same trigger, yields a piece | Same trigger, yields a lantern cosmetic |
| Art cost (code-drawn) | Medium: 10 palette sets + 10 overlays; no new silhouettes; each outfit is data (hex colours + overlay id) | High: slot compositing, many combinations to check | Low: data only |
| AI-art option | Not needed; AI could sketch the 5 ring motifs as concept only, then redrawn as vectors (provenance in CREDITS) | Same | None |
| Risks | Ring "completion" moves if lanterns are added later; fixed by the append-only earned list (section 6) | Clashing combos hurt hero readability; more validation | Matt asked for a COSTUME; C under-delivers on that wish |
| Fit check vs LOCKED | Zero power; reserved colours and brightness band reused; silhouette untouched; fills the RING COMPLETION row | Same, larger surface for breaking the reserved-colour rule | Fits all but the wish |
| Mechanical sense | One ring = one clear reward; players see which ring gave which outfit | Reward is abstract, less memorable | Reward does not touch the hero |

Per-ring identity (A; colours are proposals, final values by Matt in the sandbox; all must clear the reserved-colour check in `src/meta/cosmetics.js`):
- Hearth: ember cream and rust, hem stitching. Wick: wax white and brass, a small wick-curl charm. Dusk: dusk grey-violet (never summon violet, see RESERVED), star-pin. Far Hollow: moss teal and fog silver, thread fringe. Deep Hollow: ash-black with a pale core line (no gold), faint lit lining.
- Gold stays reserved for evolution; no outfit uses it.

## 4. Area 2: the special costume (Matt's request)
| | A Dawnbearer (Recommended) | B Deed costume | C Bond 25 costume |
|---|---|---|---|
| Fantasy | The first-light outfit: all five rings' motifs together, dawn-pale with a soft rising glow at the hem | Won by clearing Deep Dusk with that hero: a hero-specific "Long Night" costume | The hero's finale outfit at max Bond, story-tied (Wren: pup-fur collar; Elias: wax-seal mantle) |
| Earned | Complete all five rings; the same moment for both heroes | Per hero, replayable goal | Per hero, slow (25 Bond levels) |
| Art cost | One extra palette + combined overlay (reuses the 5 motifs) | One look per hero, own overlay | One look per hero, own story overlay |
| Risk | Web-complete is long (~41-57 runs at pace, LOCKED tree pacing); it is meant to be | Deep Dusk win rates differ per hero; Elias may lag | Bond 25 already holds a look; two rewards at one level |
| Fit / sense | Reads as the tree's capstone; mirrors the `webLit` rule | Fits difficulty tiers, but ring rewards and special come from different systems | Fits character system v2, ignores the tree request |

## 5. Area 3: preview and equip
| | A Wear drawer v2 (Recommended) | B Dress-up booth | C Hero select only |
|---|---|---|---|
| Plain words | Keep the built Wear drawer; add a "Costume" row above Flame / Trail with a five-ring shelf (dots lit when earned) and the special at the end | New screen from the title: the hero on a lit platform, cycle outfits, short lore line | Outfits appear only as portrait variants on the hero card |
| Preview | Live rig in the drawer, same render path as the run (no second renderer) | Same rig, more room | Static portrait |
| Locked state | Silhouette plus "Finish the Hearth: 4 of 10 lanterns" (same wording as the tree's arc) | Same | Hidden until earned |
| Equip | One tap = one save write, per hero | One tap | One tap |
| Cost | Low, extends built UI | Medium: new screen, phone layout | Low, but no way to compare |
| Risk | Phone: the drawer must stay one screen (existing rule) | Conflicts with small chunks and the front-door flow | Players cannot discover the ring link |
| Fit | Matches ui-identity (Lantern Glass, whisper copy) | Fine visually | Weak: nothing shows the ring link |

Tree side: the ring arc closing plays the existing small lantern flare (no new effect) and a toast "Hearth complete: Hearthwarm for Wren and Elias" with a "Wear it" link. Calm mode: no flare, toast only.

## 6. Save impact (append-only, validated)
- Existing: `cosm.worn {flame, trail, look{hero}}`; ownership derived. Keep that as the single store for what is WORN. Outfits extend the existing `look` ids (id + outfit data), so `cleanCosm` and worn handling stay unchanged.
- New (recommended) `cosm.earned`: an append-only array of outfit ids (known-id whitelist, capped at 32). Reason: ring completion is derived from the tree, so a later content update that adds a lantern to a ring would silently un-earn an outfit. Once earned it stays; written once at completion; never removed by a refund.
- Validation: ids match `/^[a-z][a-z0-9_]{0,31}$/` and exist in `cosmetics.json`; unknown ids dropped; `__proto__`/`constructor` rejected (existing pattern); outfits not owned fall back to the default at resolve time (existing behaviour).
- Version: an optional additive field, so no schema bump is expected (save-v3 additive rule). Tests: forged earned list, oversized list, wrong types, old saves, export/import round-trip.
- Security: render-only colours and overlay ids from whitelisted data; never innerHTML; no new dependency; hex colours go through the existing reserved-colour and brightness rules.

## 7. Risks and weak spots
- Colour clash with role colours in a swarm: reserved list plus a screenshot check at true size and phone size on the dimmest night.
- Art volume (10 outfits + special): keep to palette plus ONE overlay each.
- Elias vs Wren parity: same motif set, hero-specific placement.
- Hero select crowding: the costume row replaces nothing, so the phone layout needs checking.
- Matt's colour taste is the real gate: see the sandbox.

## 8. Sandbox plan (standalone, per Matt's "live sandbox first" rule)
- Location: outside both repos, e.g. C:\Users\matty\sandbox\wardrobe\index.html (single file, no build, no dependencies, no network).
- Fake data: two heroes drawn on canvas with the same colour tokens as the rigs, five ring states (toggle earned/locked), the special.
- Tune panel (sliders/pickers): per outfit base hue, secondary hue, trim colour, overlay opacity, glow strength; a checker that flags a swatch hitting the reserved-colour or brightness rule; a Calm toggle; true in-game size and phone (390x844) frame toggles.
- "Copy settings" button: copies a JSON block (`{ outfitId: { base, trim, glow, overlay } }`) to the clipboard to paste to Claude; no storage, no network.
- Process: Matt tunes, values are locked in LOCKED, then moved to `src/data/cosmetics.json` as data and covered by the existing validator.
- Not built until Matt picks the three decisions.

## 9. Fit check and mechanical-sense check (summary)
- Fit: restraint, role colours and zero power kept; silhouettes untouched; outfits echo the ring runes engraved on the tree.
- Mechanical sense: reward derived from a visible progress arc, shown where heroes are chosen, never read by the sim, so sweeps stay byte-identical.
- Conflicts with docs/LOCKED.md: none found; reuses "Cosmetics = A1 zero-power", "Calm halves effects", the reserved-colour rule. The RING COMPLETION row is the one being filled (needs a LOCKED entry after Matt picks).

## AskUserQuestion-ready block
Summary: tree rings finish with no reward; Matt wants a ring cosmetic plus a special costume. All options are zero-power and render-only.
1. "What should finishing a tree ring give?" Options: Ring Keepsakes, a named costume per hero for each ring (Recommended); Mix-and-match pieces, loose scarf/trim/charm you combine; Lantern-side only, flames/trails/frames and no costume.
2. "How should the special costume be earned?" Options: Dawnbearer, finish all five rings (Recommended); Deed costume, win Deep Dusk with that hero; Bond 25 costume, the hero's last Bond level.
3. "How do you preview and wear costumes?" Options: Wear drawer with a ring shelf and live preview (Recommended); Separate dress-up booth screen; Hero select only, no preview.

Right now: Matt's three picks. Next: wardrobe tune sandbox. Parked: Daily seed, Risk vows.
