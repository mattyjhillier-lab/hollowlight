# Companions v1 (DIRECTION recorded; NOT designed in detail, NOT built)
Status 2026-11-02. Matt's direction after playtesting: summons should not be weapons you pick. Circle back AFTER Lucinda (DM5-DM10) and Chapter 2 (Hushbell Hamlet). Research: docs/research/32-standing-summons.md. Parked ideas: docs/QUEUE.md.

## Direction (Matt, 2026-11-02)
- Summons are no longer weapons. Each hero has their own COMPANION that follows them, modelled on Lucinda's Ophimber.
- The hero ability is the companion's big moment (Wren: wolves; Mara: ravens; Elias: his spirit; Lucinda: Ophimber's Rise, already built that way).
- Between abilities the companion needs another job, so it is never a passenger. Candidate jobs (Claude's ideas, none chosen): Hunter (small steady attacks), Fetcher (brings gems/pickups), Guardian (soaks an occasional hit), Scout (points to sites/bosses/hearts), Lantern (light + small buff, colour returns where it walks).
- Weapon slots become magic (Bolts, Chain Lightning, Orbit, Dragonfire Meteor, future magic). Wolves and Ravens leave the weapon pool.

## Why (fit + sense)
Fit: a bonded creature matches Spirits of the Dusk and the Warm Lantern tone; heroes become more different. Sense: abilities stay bounded, the companion gives them a persistent identity without a hidden fifth weapon.

## Risks to design around (Claude, honest)
- Do not make it a second weapon system: mostly utility, light damage, or the balance bands (LOCKED FINAL RETUNE TARGETS, abilities modest share of power) break.
- Wren is the risky one (favourite, wolves are her identity). Design and prototype her wolf first; it must feel better than today.
- Large scope: reworks 2 weapons, their 6 evolutions (Dire Alpha, Echo Pack, Light Trails, Talon Mark, Wall of Wings, Spearhead...), tree nodes, codex ENTRY_KEYS (append-only), saves/migrations, balance for every starter, art. Reopens LOCKED rows: V1 weapons scope, 15 evolutions, progression gates (Ravens as a tree gate), abilities modest share.
- Saves: existing players own wolf/raven tree nodes and evolutions; needs a migration plan (nodes re-pointed, nothing lost) and golden fixtures.
- Hero-specific: Elias's companion and the Holy Orbit relationship must be decided (orbit stays magic?).

## Suggestions to evaluate later
- Small reactions (brightens at low HP, animation on level-up), a bond moment on hero pick, colour returning where the companion walks.
- Prototype Wren's wolf behind an `unreleased` flag, judge feel, then decide the roster.
- Gate on friend feedback: if testers never mention summon feel, go slower.

## Open questions for Matt (when we return)
1. Companion jobs per hero (three options each, per the new-content rule).
2. Does the companion level with the hero/Bond, or with run picks, or both?
3. Can a companion fall and be re-called (see research 32 framing D), or stay unhurtable?
4. Migration for existing wolf/raven unlocks (tree nodes become companion nodes?).
5. Does Holy Orbit stay a weapon?
