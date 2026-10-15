# Design lock register (Matt, 2026-10-15)

Rule: design each thing fully, get Matt's approval, LOCK it here, then build exactly that. A locked item is only reopened if (a) it no longer fits how the game has evolved (a later locked decision conflicts with it), or (b) Matt says so. Bugs are fixed freely (a bug is behaviour that contradicts the locked design). Changing the design needs Matt's explicit reopen, with a one-line reason recorded here.

| Area | Locked decision | Date | Source |
|---|---|---|---|
| Name | Hollowlight: Spirits of the Dusk (one word Hollowlight; Chapter 1 Cursed Forest) | 2026-10-14 | CLAUDE.md |
| Identity | The Hollow: grey drained world; spirit light restores colour and leaves luminous trails; enemies spread corruption; one life-map system (visual only) | 2026-10-14 | docs/IDENTITY.md |
| Art family | Polished chunky 2D cartoon, mood P1 Warm Lantern; 3D parked | 2026-10-14 | docs/ART-DECISIONS.md |
| Style recipe | Hollowlight Style v1 (L2 tinted outline + H2 soft gradient/rim + P1 chibi + W2 textured ground + lantern pool + glow trails) | 2026-10-14 | docs/ART-DECISIONS.md |
| Launch heroes | Wren v2 (Pelt Walker + ghost wolf pup), Elias v2 (Lamplighter + flame ring); other 8 heroes unlock later via the tree | 2026-10-14 | docs/mockups/wren-v2, elias-v2; docs/design/heroes-and-abilities.md |
| Abilities | Wren: Rally the Pack (+ ember flavour; Pelt Dash later as unlock). Elias: Sanctuary: Candle Wheel (bounded). NOT built yet | 2026-10-14 | docs/design/heroes-and-abilities.md |
| Progression | Power from unlocking options behind gates; run 1 = Wolves + Orbit + 2 evolutions; Ravens, Bolts, Chain Lightning + 9 evolutions are tree gates; gate nodes permanent; recipes hidden; stat nodes small (1-3%) with a soft cap | 2026-10-14 | docs/design/progression-gates-v1.md (built G1a-c) |
| Blessings | Run-only quiet cream cards fill the dry late game; 5 Blessings (caps trimmed); heal swap capped | 2026-10-14/15 | docs/design/blessings-review.md (built BLESS-1) |
| Base difficulty | hpScale 0.46/0.020; no-tree win ~17-30% with Blessings on | 2026-10-15 | docs/research/25-g1d-tuning-log.md (built G1d) |
| Evolve hint | "Something stirs" gold edge on stat cards that would complete a pair; never names the evolution | 2026-10-15 | this register (to build) |
| Elias stats | Speed 76 (heavy tank, about -28% vs Wren's effective 105.6), HP 130, holy damage +15%; fresh-seed win about level with Wren (random/focus 22/23 vs Wren 24/19) | 2026-10-15 | docs/research/26-elias-speed-tuning.md (built) |
| Skill tree v2 | Per-weapon clusters (emblem constellations), global rings, evolutions inside weapon clusters, locked clusters dim until unlocked | 2026-10-15 | docs/QUEUE.md (design sheet pending) |
| Design sheet series | One sheet per area, approved before building; first = HUD + cards | 2026-10-15 | docs/DESIGN-SHEETS.md |
| Working rules | Security first, token conservation, fit-the-game, small chunks, focus keeper, research-review-build, ability principle, no hiring | 2026-10-14/15 | CLAUDE.md |
| Meta-progression principle | The tree rewards exploration: different enemies, stages, builds and heroes unlock different nodes; big pannable web; nodes light up; locked nodes show progress | 2026-10-14 | CLAUDE.md, docs/research/19, 22 |
| Unique creatures | Every hero and enemy has its own silhouette/colour/animation personality (no recolours); each authored as its own data-driven vector definition | 2026-10-14 | CLAUDE.md |
| Creative freedom | docs/BIBLE.md is a starting point, not binding; any idea that fits identity + mechanics + style is welcome | 2026-10-14 | docs/ART-DECISIONS.md |
| Ability/evolution principle | Meaningful, fits the hero/spirit, never game-breaking; evolutions change the verb, ~1.8-2.3x base, 3x cap, checked against real behaviour | 2026-10-14 | CLAUDE.md |
| Asset production | Zero budget, no hiring; code/AI/CC0 only; AI assets need licence and provenance checks; disclose AI use at launch; Matt's Forge/ComfyUI on D:AI is for his other project: no GPU use or changes without asking | 2026-10-14 | CLAUDE.md, docs/research/20 |
| Hosting | Public GitHub Pages for now (main protected, PR + Matt's yes); later private repo + Cloudflare Pages before outside testers/launch | 2026-10-14 | docs/research/05, 11, 21 |
| Phone play | TOUCH-1: floating joystick, ability and pause buttons, tappable cards; provisional layout until HUD sheet #1; PWA/installable later | 2026-10-15 | docs/QUEUE.md (queued) |
| Quality gate | Every chunk: tests + balance check + security + fit + lock-conflict check + true-size screenshots (see CLAUDE.md definition of done) | 2026-10-15 | CLAUDE.md |
| Front door | Device-only save slots/profiles, Continue/New Game, no accounts or backend at launch; flow cover -> play -> profile -> hero -> map -> run (design sheet #6 pending) | 2026-10-15 | docs/QUEUE.md |
| Parked ideas (not locked, research later) | Map challenges/points of interest; minibosses at set times with chest rewards; life-map gameplay link; difficulty tiers/Gloom dial; the other 8 heroes; chapters 2-8; weapon combining | 2026-10-15 | docs/QUEUE.md |

## Reopened (with reason)
- (none yet)
