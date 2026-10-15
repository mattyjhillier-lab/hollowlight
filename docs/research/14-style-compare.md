# 14 - In-engine style comparison (branch `style-compare`)

Switch: `?style=a` (smooth vector-glow, default) or `?style=b` (modern HD pixel). Same sim, same Moonlit Glass DOM UI.
Screenshots: `docs/screenshots/compare/` (1280x720 mid-run, swarm, boss, level-up; phone = 390x844 DPR2, stage crop). Taken at High tier.

## What changed
- Phaser 3.90 has no `resolution` option (not in `core/Config.js`). Canvas is sized to stage x min(DPR,2) via `scale.resize`; camera zoom = canvas width / 640 keeps the 640x360 logical world, so the sim is untouched. Screen-space layers are centred on the canvas.
- `src/gfx/sprites.js`: one set of Canvas2D shape definitions. A: 3 texels/unit, gradients, soft shadow, rim, LINEAR. B: 2 texels/unit, then pixelised (hard alpha, luminance-banded colour, 1px dark outline, lit top-left edge, flat shadow), NEAREST for sprites only (glow/UI stay smooth). `INV[key]` = world units per texel.
- Ground: A = 512-unit seamless soft tile (blotches, grain, blades); B = 128-unit pixel tile. Both: fog banks + fireflies (Med/High), player light pool, existing grade/vignette/bloom kept.
- UI: system font stack (Palatino/Georgia headings, Trebuchet numbers). Later embed Cinzel (headings) + Rajdhani (numbers), both SIL OFL 1.1.

## Measurements (Chrome 155 headless, RTX 3060, so NOT phone-representative)
`node scripts/cdp.mjs perf` (env T start time, SIZE w,h,dpr, THROTTLE, TIERS, NOGRANT). Start t=358 (swarm) with a mid-game loadout, 12 s average. Sprites stay ~75-95 because god-mode weapons clear enemies; budget limits (600 sprites) were never approached.

| Run | A fps / work ms | B fps / work ms |
|---|---|---|
| Low 1280x720 | 58.3 / 3.5 | 60 / 3.5 |
| Med | 59.7 / 4.1 | 60 / 3.5 |
| High | 60 / 4.0 | 60 / 3.9 |
| High-DPR2 (2560x1440) | 60 / 4.2 | 59.7 / 3.9 |
| Low, 4x CPU throttle | 51.5 / 10.2 | 58.3 / 7.9 |

Draw calls 4-7, particles 2-58 (caps respected). Both stay under the 12 ms budget at 4x throttle (A 10.2, B 7.9); single run each, expect noise.
