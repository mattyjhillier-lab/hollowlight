# High-quality bloom vs the 3:1 summon contrast gate (measure only, 2026-10-23)

Nothing here is built on dev. Prototype lives on throwaway branch `wip/bloom` (flags `?bloomx=a|b|c`, `?ravdark=1|2`, `bt`, `bs`; never merged).

## Why it fails (found in the Phaser 3.90 shader)
The built-in bloom's last step is `mix(sharpFrame, blur * strength, 0.5)`. So at strength 0.55 the output is 50% sharp + 27% blur: the whole frame loses ~23% brightness and every small sprite is 27% smeared into its surroundings. Lowering `strength` makes it DARKER, not lighter (so "0.55 -> 0.3" is the wrong direction; the dim comes from the 0.5 mix itself).

## Options tried (High, all five weapons evolved, 350 foes, WL6 disc, scripts/s7-fx.mjs matrix, 0:30 / 4:00 / 8:00, 3 repeats each; pass = median or core p90 >= 3:1)
| option | what it is | passes | notes |
|---|---|---|---|
| today | built-in bloom | 15/43 (35%) | 8:00 only 2/13 |
| **B tuned** (bt 0.78, bs 0.5) | bright-pass only: threshold the frame, blur that, ADD it on top of the untouched frame. Nothing is dimmed, small sprites stay sharp | 12/29 (41%, 2 repeats) | **recommended** |
| B hot (bt 0.62, bs 0.9) | same, stronger | 22/44 (50%) | best number but the day frame goes white-hot around the hero: not Warm Lantern, rejected |
| A | custom 75% sharp / 25% blur, no dimming, self-light copies off | 16/42 (38%) | crisp, but the lantern glow is lost (flat) |
| C | keep bloom, self-light copies x1.6 | 13/44 (30%) | worse: bright copies on a bright pool |

Noise is large (one frozen frame per cell, 6-8 samples per kind, +/- 0.5 per cell; +/-10 points on a total), so only the big picture is trustworthy: NO option gets the matrix to 3:1 everywhere. B (tuned) is about +5 to +15 points over today, removes the dimming, and is the only one that looks as good or better. A day-time contrast gap against the cream pool remains because the bodies are pale on pale ground; bloom is not the only cause.
Pace (pace.mjs, High, 350 foes, headed RTX 3060, 20 s, 2 pairs): draw 3.5-3.7 ms avg for today, A, B and C alike, 59 fps locked, same 2 long tasks. CPU cost is the same; GPU cost of B (one extra bright-pass blur, same pass count as today) was not separable here.

## Look (docs/screenshots/bloom/, 1280x720 and 844x390@2x, day + night: base-, a-, b-(hot), b2-(tuned, recommended), b2rav-, c-)
- today: night washed and grey-lilac, spirits look pasted-flat; day pool is dim olive.
- B tuned: warm cream pool kept, ground not dimmed, spirits crisp with a soft glow; night richer and more lantern-like. Reads as Hollowlight Style v1. Day is slightly hotter than today around the hero (watch it on a phone).
- B hot: day over-glows (rejected). A: crisp but cold, no glow. C: busy, bright copies fight the pool.

## Recommendation
1. Replace the High bloom with B tuned (custom post pipeline, ~40 lines, same cost class), then drop the per-sprite self-light copies (they were only there to fight the dimming). Needs Matt (it changes the High look and supersedes the LOCKED 'High bloom kept as is'). If he prefers no change: accept today, all kinds still read by shape and outline.
2. Ravens inside the lantern pool (fail on every tier): tint the body darker ONLY within ~110 u of Matt's hero (0x8470c4 at 80-110 u, 0x5e4eaa inside 80 u; bright self-light copy off there), keep the cream paper tips and ink outline. Measured with B: ravens 1/6 pass, medians 1.6-3.3 (mean ~2.4 -> ~2.5): helps the median but the cream wing tips still sit at pool luminance (the core metric reads them). Real fix needs a second step: dim the pool lightmap ~15% under the raven ring (Wall of Wings) or make the tips warm grey (#c9b896). Not tested. Raven pale lavender was a locked pick, so a dark-in-pool body needs Matt's yes.
3. Flames and chain lose in daylight on every tier (not bloom only): a dark ink inner rim on the flame and a slightly darker arc core for chain, same idea as the glyph orb ink rim. Not tested here.
