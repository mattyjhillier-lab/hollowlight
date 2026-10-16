# 31 - Defeat / victory (results) screen: research + design for sheet 6a (2026-10-16)

Labels: OFFICIAL = primary source fetched; COMMUNITY = forum/guide; OPINION = my play knowledge/synthesis, NOT fetched this session. HONEST NOTE: no sources were fetched for this file (same thin-results problem as docs/research/28). Every per-game row below is OPINION from play knowledge; verify by looking at each game before treating any row as fact. Design decisions rest on the rules/principles in section 3, not on the game rows.

## 1. Matt's feedback (the spec)
Current build (src/ui/ui.js showEnd + style.css .endstats/.endtree) is a tall stack: title, "New best", 7-row stats list, warn note, unlock list, THEN 3 buttons. On a phone or short window the buttons fall below the fold and need scrolling. Look is the old Moonlit Glass (navy, cyan), red/teal title, no lantern, no identity. Wanted: researched, much better looking, ALL on one screen (desktop, phone landscape 844x390, phone portrait 390x844), no scroll, Retry/Main menu always visible.

## 2. What comparable games do (all OPINION unless stated)
| Game | Results screen shape | Retry friction | Progress celebration | Lesson for Hollowlight |
|---|---|---|---|---|
| Vampire Survivors | Single panel: time, kills, gold, level, weapon/passive icons with damage; coin count-up; then "Continue/Menu" | 1-2 taps | Gold tally + unlock popups after | Weapon icons with damage numbers answer "what carried me / what failed"; gold tally is the reward beat |
| Spirit Hunters: Infinite Horde | Defeat card with hero, time, kills, currency earned, and an upgrade shortcut | low | Shows currency gained, nudges to the upgrade screen | Matt's reference: tree shortcut next to retry is natural |
| Brotato | Run-end screen: wave reached, stats, weapons+items grid, "New run" / "Main menu" | 1 tap | Unlocks listed separately | Item/weapon grid is the "build summary"; bigger than we need |
| HoloCure | Stage-result: time, kills, holo coins, level; hero art | 1-2 taps | Coin count-up | Hero art present on result: use lantern/hero focal |
| Halls of Torment | Death recap: killer, time, level, kills, build | 1-2 taps | modest | "Killed by X" is a useful single line (we could add the killer enemy name) |
| Death Must Die | Run recap with build, damage breakdown, unlock progress, then hub | hub trip | Strong: unlock/mastery progress bars | Progress BARS toward an unlock beat plain text |
| 20 Minutes Till Dawn | Stats + XP/unlock gain, quick restart | 1 tap | modest | Same time-to-dawn theme as us: near-miss framing "X short of dawn" fits perfectly |
| Survivor.io (mobile) | Rewards panel with big claim/retry buttons stacked at the bottom thumb zone, loot count-up | 1 tap | Heavy: chests, rewards | Buttons live in the thumb zone at the bottom; rewards are the hero of the screen |
| Hades | Death is the HUB: you walk back, dialogue, then the next run; no separate stats wall | very low | Meta-currency shown in-world | Principle: death should feel like part of the story, not a failure form; keep it short and warm |

## 3. Principles drawn (OPINION, supported by common game-UX practice; confidence medium)
1. Hierarchy: ONE hero number (time survived), then the reward (banked gold/shards), then the build, then the next-unlock nudge, then actions. Everything else is cut or secondary.
2. Retry friction is the key metric for this genre ("one more run"): primary button big, pre-focused, bound to Enter/R; never behind a scroll or a confirm. Menu is secondary. Tree is a shortcut, not a gate.
3. Near-miss framing converts defeat into motivation: "7:18 short of dawn, best 11:20" plus a moon-arc showing how far you got and where the boss sits.
4. Celebrate progress even on defeat: gold/shards always count up (never "0 earned"), an unlock progress bar ("84% to Raven Flock") shows the death was not wasted; show NEW only when something actually unlocked.
5. Mobile: actions in a bottom bar within thumb reach, >=44px (we use >=46-56px), safe-area insets, no scroll; content shrinks/hides secondary rows by priority rather than scrolling.
6. Tone: Hollowlight is bittersweet and tender (BIBLE section 8): never "You died / Game Over". Defeat is a quiet beat, not a failure card.

## 4. Conflict note (needs Matt)
docs/BIBLE.md (defeat text, line ~355) says the lantern GOES OUT, the screen goes fully grey and spirits keep guard; Matt's brief now says the lantern DIMS but is not out. Recommendation: dim-not-out (hope; faster retry; matches the Warm Lantern mood). If Matt agrees, the BIBLE line is updated and logged in Reopened; the in-world 2 s grey beat before the card (locked in Bible decisions) stays: world desaturates, lantern shrinks to a small flame, spirits stand guard, THEN the card fades in.

## 5. Design (one refined sheet, direction was not open): docs/mockups/results-sheet/
Pictures (PNG, real DOM/CSS in local Chrome, 1280x720 / 844x390@2x / 390x844@2x, defeat + victory): results-{defeat,victory}-{desktop-1280x720,phone-landscape-844x390,phone-portrait-390x844}.png. Measured: measured.txt (regenerate with `node build.mjs`).
Layout rule that kills the scroll: the screen is `position:fixed; display:flex; column`: a flexible BODY (min-height:0, overflow hidden, content sized from one unit --u = min(vw,vh)-based) above a NON-SCROLLING action bar that is part of the flow, not scrolled content. Body shrinks via the unit and drops lowest-priority rows (3rd weapon row, arc captions, build notes) on short screens. Nothing can push the buttons off screen.
- Left (desktop/landscape) or top row (portrait): brass lantern (defeat: small flame in a dim amber pool, victory: full flame + rays), kicker "Night 1 - Cursed Forest - Wren", title, one poetic line. Defeat title "The light dwindles", line "The night is long. The lantern still burns, a little. Rest, then walk again." Victory title "Dawn" (gold), line "The sun is generous. Every grey thing wakes. The Treant sleeps at last." + 3-6 word hero bark (BIBLE: text barks at victory).
- Card: hero time (big numerals) + near-miss line + moon-arc (progress to dawn, Treant tick at 10:00); Level/Slain/Evolved chips; Gold banked and Soul shards with count-up (value, total); spirits mini-summary = up to 3 weapons with share-of-damage bars (evolved shown with a gold star + name); unlock nudge = closest unlock with progress bar, or NEW when something opened.
- Actions bar: Again (big warm primary, glow, key R/Enter), Main menu (Esc), Tree (teal dot when there is something to buy/new). Key hints hidden on touch.
- Motion (all skipped under reduced motion/shown at final values): card slides up 250 ms, lantern flame flickers slowly, gold/shards count up over 1.2 s with a tick, moon-arc fills to the reached point, victory colour wash behind. Input lock 250 ms like cards, but Retry is focusable at once after the wash.
- Keyboard: Enter/R = Again, Esc = Main menu, T = Tree, Tab cycles; focus ring visible; aria-labels on summary; touch targets measured 46-72 px high.

## 6. Measured (see measured.txt)
All six frames: pageOverflowY 0, all 3 buttons fully inside the viewport, card and actions never overlap, button heights 46 px (landscape) / 54-56 px (portrait) / 72 px (desktop). Smallest text 10.1-10.7 px on phones (below the 11 px floor in a few secondary captions: build must clamp captions to >=11 px or drop them), 14.7 px desktop.

## 7. Weak spots (honest)
1. Per-weapon damage share is NOT tracked by the sim today (result() has weapon ranks only); the mini-summary needs a damage counter per weapon id. Counters only (no RNG, no behaviour) so sweeps stay byte-identical, but it touches Sim.js: build chunk R2, tested.
2. "Closest unlock" needs the existing bank.closest data to carry a short plain phrase ("120 crows slain") and a 0-1 fraction: exists in fillEndTree (name, text, frac); reuse.
3. Mock art is code-drawn placeholder (lantern SVG, blurred blobs for the frozen world). Real build uses the actual lantern brand asset and the frozen game frame (desaturated canvas) as backdrop; a screenshot with a real frame is needed before locking the look.
4. Fonts are Georgia/Segoe stand-ins; the build ships the self-hosted OFL font chosen in the fonts chunk.
5. Smallest phone text slightly under 11 px in 2 captions; fix in build (clamp).
6. Count-up and flame flicker are not demonstrable in a still PNG; reviewed as spec only.
7. "Killed by" line (Halls of Torment idea) not included: needs killer tracking; parked.
8. Victory "Hall of Dawns" unlock text is invented placeholder copy; real unlocks come from bank.newly.
9. Defeat/dawn world beat (2 s grey/colour flood) is a separate chunk and not mocked here.

## 8. Build chunks (small; each needs Matt's go; none started)
R1 Layout + look: replace showEnd markup/CSS with the fixed-flex layout, Warm Lantern tokens, lantern SVG, tests that buttons exist/focus/keys (DOM test) + screenshots at 3 sizes. UI only, sweeps untouched.
R2 Data: per-weapon damage counters in Sim (counters only), result().weapons gets dmg; share bars; bot sweeps must stay byte-identical (report).
R3 Motion + keys: count-up, arc fill, flame flicker, slide-in, reduced motion, Enter/R/Esc/T, focus management, 250 ms lock.
R4 Nudge + Tree shortcut: closest unlock / NEW rows from bank, teal dot rule, victory dawn variant polish.
R5 (later, with world sheet) in-world beat: grey 2 s defeat / colour-flood dawn then card; spirits guard.

## 9. Decisions for Matt (recommendation first)
1. Defeat lantern: DIM, not out (recommended; updates BIBLE) vs fully out then relit by Again.
2. Layout: one card + bottom action bar with Again as the big primary (recommended) vs Again/Menu only, no Tree button on the results screen.
3. Weapon summary: show damage share of top 3 weapons (recommended, needs R2 counters) vs hide it for now and ship R1/R3/R4 first.

Security check: docs/mockups only; static HTML/CSS/SVG, own headless Chrome via local debugging port (closed after run, no kill of other processes), no network, no new deps, no secrets. Build notes: render all run values with textContent (existing practice), no innerHTML from save data.
Fit check: lantern/dawn/thread language of Warm Lantern and Identity (restored colour, restrained, gold only for dawn/evolutions, teal only for NEW); mechanically it reuses locked data (gold, shards, bank.closest/newly, best time, hero bark) and the Bible decision of a quiet defeat beat then a focused big Again button.
