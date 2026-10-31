# Spirit Tempest stand-still probe (measure only, 2026-10-31)
Scripts: scripts/tempest-standstill.mjs (+ -report), scripts/tempest-standstill-grant.mjs (+ -report). Raw: tempest-standstill.jsonl, tempest-standstill-grant.jsonl. No src/ or tests/ change.
Harness: bot.mjs playRun + live-tree.mjs treeFor (open: gated evolutions unlocked), Wren, Bond 0, Blessings on, random-pick rule. stand = player position reset to start every step + ability off (zero movement, same card rule). Forced evolution = when several are offered, the named one is picked. 32 seeds per cell, same seeds across arms (4 of 1280 main runs missing, n shown). SE = binomial for win%, standard for means.

## Probe 1: full runs from t=0 (fresh = no tree, mid = half tree)
Headline: a standing hero never reaches an evolution. Across all 20 stand cells (Twilight + Deep Dusk, fresh + mid), evolution rate 0/640 and wins 0/640; median death 22-164 s (fresh 22-64 s, mid-tree Twilight 27-164 s). Tempest/Lance/Pages cells are identical (no evolution ever happened, same seeds). Moving bot: Twilight mid tree Tempest 25% win (SE 8, n=32; evolved in only 9%), fresh Twilight 3% (SE 3); Deep Dusk mid 3%, fresh 0%. Bands (LOCKED fresh 15-30, mid 30-55) are not the question here; this harness's moving random bot sits at/below them.

Full table (win%, evo% reached, hpLost, median t, kills/min after evo; n=32 unless shown):

| tier | tree | weapon/evo | arm | n | win% (SE) | evo% | win% | med t s | hpLost (SE) | kills/min post-evo (n) |
|---|---|---|---|---|---|---|---|---|---|---|
| hard | half | thunder_judgment | move | 32 | 9 (5) | 9 | 33 (n=3) | 645 | 396 (27) | 244 ±39 (2) |
| hard | half | thunder_judgment | stand | 32 | 0 (0) | 0 | - (n=0) | 127 | 163 (7) | 0 ±- (0) |
| hard | half | judgement_wheel | move | 32 | 6 (4) | 3 | 0 (n=1) | 605 | 347 (21) | 11 ±- (1) |
| hard | half | judgement_wheel | stand | 32 | 0 (0) | 0 | - (n=0) | 25 | 129 (2) | 0 ±- (0) |
| hard | half | returning_pages | move | 32 | 0 (0) | 6 | 0 (n=2) | 628 | 345 (19) | 314 ±21 (2) |
| hard | half | returning_pages | stand | 32 | 0 (0) | 0 | - (n=0) | 68 | 150 (7) | 0 ±- (0) |
| hard | half | soul_lance | move | 32 | 3 (3) | 6 | 50 (n=2) | 628 | 339 (16) | 245 ±36 (2) |
| hard | half | soul_lance | stand | 32 | 0 (0) | 0 | - (n=0) | 68 | 150 (7) | 0 ±- (0) |
| hard | half | spirit_tempest | move | 32 | 3 (3) | 6 | 50 (n=2) | 619 | 341 (18) | 224 ±- (1) |
| hard | half | spirit_tempest | stand | 32 | 0 (0) | 0 | - (n=0) | 68 | 150 (7) | 0 ±- (0) |
| hard | none | thunder_judgment | move | 32 | 0 (0) | 0 | - (n=0) | 487 | 207 (16) | 0 ±- (0) |
| hard | none | thunder_judgment | stand | 32 | 0 (0) | 0 | - (n=0) | 50 | 111 (3) | 0 ±- (0) |
| hard | none | judgement_wheel | move | 32 | 0 (0) | 0 | - (n=0) | 486 | 192 (11) | 0 ±- (0) |
| hard | none | judgement_wheel | stand | 32 | 0 (0) | 0 | - (n=0) | 22 | 101 (1) | 0 ±- (0) |
| hard | none | returning_pages | move | 32 | 0 (0) | 0 | - (n=0) | 517 | 179 (14) | 0 ±- (0) |
| hard | none | returning_pages | stand | 32 | 0 (0) | 0 | - (n=0) | 29 | 105 (2) | 0 ±- (0) |
| hard | none | soul_lance | move | 32 | 0 (0) | 0 | - (n=0) | 517 | 179 (14) | 0 ±- (0) |
| hard | none | soul_lance | stand | 32 | 0 (0) | 0 | - (n=0) | 29 | 105 (2) | 0 ±- (0) |
| hard | none | spirit_tempest | move | 32 | 0 (0) | 0 | - (n=0) | 517 | 179 (14) | 0 ±- (0) |
| hard | none | spirit_tempest | stand | 32 | 0 (0) | 0 | - (n=0) | 29 | 105 (2) | 0 ±- (0) |
| normal | half | thunder_judgment | move | 32 | 22 (7) | 16 | 60 (n=5) | 758 | 365 (20) | 200 ±28 (5) |
| normal | half | thunder_judgment | stand | 32 | 0 (0) | 0 | - (n=0) | 164 | 177 (8) | 0 ±- (0) |
| normal | half | judgement_wheel | move | 32 | 16 (6) | 19 | 17 (n=6) | 731 | 385 (25) | 267 ±9 (5) |
| normal | half | judgement_wheel | stand | 32 | 0 (0) | 0 | - (n=0) | 27 | 129 (2) | 0 ±- (0) |
| normal | half | returning_pages | move | 32 | 22 (7) | 9 | 67 (n=3) | 747 | 372 (19) | 246 ±23 (2) |
| normal | half | returning_pages | stand | 32 | 0 (0) | 0 | - (n=0) | 135 | 160 (7) | 0 ±- (0) |
| normal | half | soul_lance | move | 32 | 22 (7) | 9 | 67 (n=3) | 747 | 380 (20) | 242 ±2 (2) |
| normal | half | soul_lance | stand | 32 | 0 (0) | 0 | - (n=0) | 135 | 160 (7) | 0 ±- (0) |
| normal | half | spirit_tempest | move | 32 | 25 (8) | 9 | 100 (n=3) | 747 | 368 (19) | 235 ±2 (2) |
| normal | half | spirit_tempest | stand | 32 | 0 (0) | 0 | - (n=0) | 135 | 160 (7) | 0 ±- (0) |
| normal | none | thunder_judgment | move | 32 | 0 (0) | 3 | 0 (n=1) | 510 | 222 (16) | 378 ±- (1) |
| normal | none | thunder_judgment | stand | 32 | 0 (0) | 0 | - (n=0) | 64 | 113 (4) | 0 ±- (0) |
| normal | none | judgement_wheel | move | 32 | 0 (0) | 0 | - (n=0) | 515 | 199 (14) | 0 ±- (0) |
| normal | none | judgement_wheel | stand | 32 | 0 (0) | 0 | - (n=0) | 23 | 102 (1) | 0 ±- (0) |
| normal | none | returning_pages | move | 32 | 3 (3) | 0 | - (n=0) | 502 | 213 (17) | 0 ±- (0) |
| normal | none | returning_pages | stand | 32 | 0 (0) | 0 | - (n=0) | 37 | 101 (1) | 0 ±- (0) |
| normal | none | soul_lance | move | 32 | 3 (3) | 0 | - (n=0) | 502 | 213 (17) | 0 ±- (0) |
| normal | none | soul_lance | stand | 32 | 0 (0) | 0 | - (n=0) | 37 | 101 (1) | 0 ±- (0) |
| normal | none | spirit_tempest | move | 32 | 3 (3) | 0 | - (n=0) | 502 | 213 (17) | 0 ±- (0) |
| normal | none | spirit_tempest | stand | 32 | 0 (0) | 0 | - (n=0) | 37 | 101 (1) | 0 ±- (0) |

## Probe 2: evolution GRANTED at 7:00 (sim.time jumped to 420 s, Twilight, mid tree), pair 5 / others 3
Kit solo = that weapon only; team = + Ghost Wolves + Holy Orbit at rank 3 (base). 'base' = Spirit Bolts pair 5, no evolution. Survived = seconds after 7:00 (win = 480 s). Solo stand cells die in ~13 s (the jump to 7:00 spawns a dense crowd on a one-weapon hero), so use the team kit for stand-still comparison. kills/min over a 13 s life is not comparable.

| kit | evo | arm | n | win% (SE) | median survived s past T0 | mean (SE) | hpLost (SE) | kills/min (SE) |
|---|---|---|---|---|---|---|---|---|
| solo | thunder_judgment | move | 32 | 100 (0) | 484 | 485 (2) | 170 (13) | 248 (1) |
| solo | thunder_judgment | stand | 32 | 0 (0) | 13 | 13 (0) | 131 (3) | 425 (3) |
| solo | judgement_wheel | move | 32 | 50 (9) | 482 | 435 (17) | 528 (21) | 249 (4) |
| solo | judgement_wheel | stand | 32 | 0 (0) | 14 | 14 (0) | 135 (3) | 407 (3) |
| solo | base | move | 32 | 97 (3) | 471 | 467 (5) | 172 (17) | 255 (1) |
| solo | base | stand | 32 | 0 (0) | 13 | 13 (0) | 139 (4) | 433 (5) |
| solo | returning_pages | move | 32 | 94 (4) | 479 | 467 (7) | 299 (17) | 252 (1) |
| solo | returning_pages | stand | 32 | 0 (0) | 13 | 15 (2) | 142 (5) | 414 (6) |
| solo | soul_lance | move | 32 | 100 (0) | 474 | 474 (2) | 176 (14) | 253 (1) |
| solo | soul_lance | stand | 32 | 0 (0) | 13 | 17 (2) | 136 (7) | 429 (8) |
| solo | spirit_tempest | move | 32 | 100 (0) | 471 | 473 (2) | 80 (9) | 254 (1) |
| solo | spirit_tempest | stand | 32 | 0 (0) | 13 | 17 (4) | 125 (3) | 456 (7) |
| team | thunder_judgment | move | 32 | 100 (0) | 454 | 454 (1) | 33 (5) | 263 (1) |
| team | thunder_judgment | stand | 32 | 0 (0) | 83 | 60 (8) | 164 (7) | 344 (15) |
| team | judgement_wheel | move | 32 | 97 (3) | 470 | 467 (6) | 136 (10) | 254 (1) |
| team | judgement_wheel | stand | 32 | 0 (0) | 14 | 15 (1) | 134 (3) | 409 (6) |
| team | base | move | 32 | 100 (0) | 450 | 451 (1) | 37 (5) | 264 (0) |
| team | base | stand | 32 | 0 (0) | 87 | 114 (11) | 200 (4) | 283 (5) |
| team | returning_pages | move | 32 | 100 (0) | 451 | 451 (1) | 37 (5) | 264 (0) |
| team | returning_pages | stand | 32 | 0 (0) | 73 | 71 (5) | 191 (5) | 299 (9) |
| team | soul_lance | move | 32 | 100 (0) | 451 | 451 (1) | 35 (4) | 265 (0) |
| team | soul_lance | stand | 32 | 0 (0) | 93 | 105 (6) | 197 (2) | 274 (1) |
| team | spirit_tempest | move | 32 | 100 (0) | 450 | 450 (1) | 16 (3) | 265 (0) |
| team | spirit_tempest | stand | 32 | 0 (0) | 219 | 224 (5) | 193 (2) | 273 (1) |

## Read
- Stand-still never wins and never evolves in a real run (0/640); it cannot reach Tempest at all.
- With Tempest granted at 7:00 plus a base team, standing survives 219 s median (mean 224, SE 5) vs 73-105 s for Soul Lance / Returning Pages / base Bolts, and 83 s Thunder Judgment (control), 14 s Judgement Wheel. So Tempest is the best standing evolution (about 2-3x the others) but still 0% win, dies by about 10:40. Moving, all arms win 94-100% (Tempest takes least damage: 16 vs 33-37 team, SE 3-5).
- Not an outlier in the "stand and win" sense; it is an outlier in "stand and last longest" and in lowest damage taken when moving.
- Caveat: Matt's real experience is a mid-run hero who already has other weapons and Bond/tree stats; the probe cannot reproduce that exactly. Bot dodge-less standing also has no heart/gem pickup pull.
- Data change: none recommended beyond a note that if standing is felt too strong, Tempest's auto-seek burst is the only lever; Matt decides.
