# First minute v1: first launch, first 60 seconds, teaching moments, game feel (design sheet, NOT locked)

Release gate item 9 (LOCKED 2026-10-17: "a first-time player should think wow, a lot of thought went into this"). Goal: a new player always knows what to do next, nothing blocks play, no wall of text.
Mock-ups: docs/mockups/first-minute/ (`node build.mjs && node shoot.mjs`; static HTML drawn over REAL in-game captures from docs/screenshots/dr/dr1 at 0:40, so sizes are true; own headless Chrome, temp profile deleted). Pages: fm-move, fm-ability, fm-levelup, fm-results at 1280x720, 844x390@2x, 390x844@2x; fm-opt-desk.png = the three questions side by side.

## 0. Decisions for Matt (max 3, recommended first)

| # | Question | A (Recommended) | B | C |
|---|---|---|---|---|
| 1 | How we teach | **Lantern whispers**: one small plate at a time, triggered by what you do, fades by itself, first time only, never pauses | Guided first night: run 1 scripted for 60 s, few foes, waits for each step | Practice dusk: safe 90 s clearing before the real first run |
| 2 | First cards + first evolution | **One line each**: whisper above the first offer, NEW tag on new weapons, rank dots named once; first "stirs" edge and first evolution card get one line | Card anatomy: first offer slides in with three labelled callouts you tap away | Codex first: nothing extra in the run; results + codex explain afterwards |
| 3 | Game-feel pass | **Sharp small set** (8 items, bounded, Calm-aware, phone buzz with a setting) | Big juice pass (squash/stretch every hit, knockback, slow-mo level-ups, flashes everywhere) | Tune only (no new effects, re-measure what is built) |

Reversible defaults taken (Matt may override): hints are per lantern (profile) and stored in the save; a "Tips" toggle in Settings > Controls (on by default) plus "Show tips again"; Tab hides the current tip on keyboard; phone buzz ON by default where supported, with its own toggle; no gamepad prompts until gamepad support exists (release-gate accessibility item).

## 1. What exists vs what is new
- EXISTS: title -> hero -> run (map screen skipped until there is a night choice, FRONT DOOR row); HUD toasts (swarm, heart, magnet, chest...); "Something stirs" gold edge (Evolve hint row); E9 evolution beat + evo plate; low-HP frost edge (frost tuning row); DR1 hurt feedback; results card with a one-line nudge (closest/new unlock) + Tree shortcut (U6); tree first-visit tip ("Got it", fades, "Show the tip again") + calm Next-step bar (T4); audio cues incl. level_up, ui_step, results_win/lose, low-HP heartbeat (AUDIO row, AU0-AU6); screen shake setting + Calm (reducedMotion); RunScene.stop() hit-stop (cap 0.06 s, 0.6 s cooldown, off under Calm); zoomPunch(); touch stick.
- MISSING: nothing tells a first-timer to move, that attacks are automatic, what gems are, what the ability does, what the card dots mean; no first-death or first-win teaching line; no phone vibration; hit-stop/shake only used for boss/hurt, no per-moment budget; reroll/banish (tree unlocks) never explained when first owned.

## 2. Research (labels: OFFICIAL / COMMUNITY / OPINION; recalled from play and public talks, not re-fetched this session: treat as indicative)
- Vampire Survivors: no tutorial at all; one-stick movement + auto attack is learnable in seconds; the first level-up card screen is self-explaining because each card has one short line. Players learn recipes from the community/codex (COMMUNITY). Lesson: the genre needs very little teaching; keep it tiny.
- Spirit Hunters: Infinite Horde (Matt's reference): short control hint at start, then nothing; skill tree explained by its own screen (COMMUNITY, research 19).
- Brotato: first run hint text on the shop and stat screens, everything else by tooltips on hover (COMMUNITY). Lesson: explain where the player is looking, not up front.
- Halls of Torment: almost no onboarding; the meta screens carry explanations (COMMUNITY). Players report early confusion about blessings/traits (OPINION).
- Hades: teaching is diegetic and spread over many runs; each new system is introduced by a character line the first time it appears, and death is framed as progress ("the House" after each death) (OFFICIAL GDC talks by Supergiant on narrative + COMMUNITY). Lesson: make the first DEATH a teaching moment, not a failure screen.
- General onboarding advice: teach one thing at a time, at the moment it matters, let players skip; avoid modal popups in action games (OPINION, common UX guidance; GDC "tutorials" talks).
- Game feel: hit-stop and shake work when rare and tied to weight; constant shake tires players and hurts readability, and must be optional (OPINION, Vlambeer "art of screenshake", common accessibility guidance; Game Accessibility Guidelines recommend toggles for shake/flash: COMMUNITY/OFFICIAL guideline site).

## 3. Question 1: how we teach

| | A Lantern whispers (Recommended) | B Guided first night | C Practice dusk |
|---|---|---|---|
| Plain words | Small lantern-glass plate, one at a time, appears when the thing first happens, fades on its own or when you do the thing | Run 1 slows spawns and pauses the wave clock until you move, pick, press the ability | A safe glade before the first real run: walk, collect gems, pick a card, try the ability, then "the dusk deepens" and the real run starts |
| Strength | Never blocks; zero extra screens; works on every input; tiny build | Guarantees each step is seen | Real run stays untouched; calm space to learn |
| Weakness | A player who ignores plates may miss one (mitigated: each repeats once if the thing is not done) | Run 1 differs from the real game (balance numbers, bot sweeps, "no deaths before 5:00" target need a special case); feels hand-holdy | Delays the wow by 90 s; extra content to build/test; genre players skip it |
| Fit / sense | Lantern voice whispers = the U4 voice; sim untouched | Touches the sim (spawn gate) = balance risk | New mini-map/scene = scope |

### A in detail: the whisper ladder (first run of each lantern; each step at most once, skippable, fades)
Order is by trigger, not by clock; never two plates at once; a plate waits while a card offer, boss banner or toast is up. Plate = lantern glass, brass edge, cream bold line + italic whisper line, a thin gold thread underneath that burns down (auto-fade timer). Position: desktop bottom-centre above the weapon strip; phone landscape top-centre under the moon arc (thumbs own the bottom); phone portrait under the HUD block.

| # | Trigger | Keyboard copy | Touch copy | Ends when |
|---|---|---|---|---|
| 1 Move | run start + 0.8 s | "W A S D or arrows to walk" / *Your spirits fight for you. Keep moving.* | "Drag anywhere to walk" (+ a faint ghost stick where the thumb goes) | moved 1.5 s total, or 8 s |
| 2 Gems | first gem lands on screen | "Walk over spirit-light to grow" / *Each mote fills the thread.* | same | first gem collected, or 6 s |
| 3 Ability | ability first ready (0:10) | "Press SPACE: Pack Howl" (Elias: Sanctuary) / *Your wolves rush in together. It recharges.* + one gold ring on the button | "Tap the wolf: Pack Howl" | ability used, or 8 s; repeats once at next ready if unused |
| 4 Pickups | first heart / magnet / chest seen | existing toast gains a whisper line once: *Hearts mend the flame.* / *The magnet calls every mote home.* | same | 4 s |
| 5 Low HP | HP first under 30% (frost appears) | "Your flame is low" / *Back away from the pack; hearts fall from the Husks.* | same | HP above 30% or 5 s |
| 6 Reroll/banish | first run after the tree node is lit, on the first offer | "R: new cards  ·  B then a number: banish" / *Spend them; they come back each night.* | "Tap the circle arrows to reroll" | 6 s or used |

Rules: the hint plate never covers the hero or the hurt "-N" layer (DR1); no flashing (Calm: fade only, thread still burns down); screen reader gets each line once via the existing status region; Tab (keyboard) or a tap on the plate hides it; Settings "Tips" off hides all; "Show tips again" resets the ladder. Stored as a small bit set per lantern in the save (versioned field, sanitised: unknown bits dropped). Run 1 of a new lantern only; hint 6 is per unlock.

## 4. Question 2: first level-up and first evolution

| | A One line each (Recommended) | B Card anatomy | C Codex first |
|---|---|---|---|
| First offer | Whisper above the cards once: **"Your light grows"** / *Pick one. Each card makes a spirit stronger.*; NEW tag on new-weapon cards (every run); dots named once by a small note on desktop: "dots = rank, 5 is the most" | First offer slides in slowly with three callouts (spirit, what it does, rank); "Got it" to pick | Nothing extra |
| First "stirs" edge (Evolve hint row) | One whisper under that card, once: *Something stirs: max this and its partner to wake an evolution.* (never names the evolution, recipe stays hidden) | Callout | Explained on results/codex |
| First evolution card | Card kicker once: **"Evolution"** / *Your spirit changes its nature. One per weapon.*; the E9 beat stays as built | Same + callout | Same beat, no line |
| Cost | Copy + one flag; no new screen | A modal (blocks; the offer is already paused so not unfair, but adds a click) | Free, but the mid-run "what is this gold card?" moment is lost |

Weapon-cap teaching: when slots fill (4 weapons) the first stat-only offer whispers once: *Your hands are full: now your spirits grow.*

## 5. First death and first win (results card, U6 one-screen rule holds)
- First death (any lantern's first banked death): the nudge slot (U6) shows **"Your gold is safe"** / *Spend it in the Lantern Web: every lantern you light makes the next night easier.*; "Lantern Web" becomes the primary button for that one card, Again stays. Death recap line stays (DR row). Afterwards the nudge returns to closest/new unlock.
- Second death without any lantern lit: nudge says *You have N gold: enough for <cheapest node>.* (existing nudge data).
- First win: existing first-dawn line (FD5) + whisper *The Hollow remembers. Harder nights wait in the Lantern Web.* when Deep Dusk opens (front-door section 7).
- Tree first visit: keep the built tip + Next-step bar; first-visit tip copy aligned: **"The Lantern Web"** / *Light a lantern with gold. Bright ones are ready now; the pin shows the best next.* The Next-step bar already handles "what next".

## 6. Question 3: game-feel pass

| | A Sharp small set (Recommended) | B Big juice pass | C Tune only |
|---|---|---|---|
| Plain words | 8 cheap, bounded additions on top of what is built | Every hit squashes, knocks back and flashes; slow-mo on level-ups | Measure and re-tune existing shake/stop/numbers/sound |
| Risk | Low; each item has a cap and a Calm rule | Breaks damage-readability rules (DR row: crowd quiet, hero always readable), costs frame time on phones, knockback changes the sim (balance) | Misses the "wow" the release gate asks for |

### A in detail (all render/UI/audio only, sim untouched)
1. **Kill pop**: Husk mask falls (built) + a 0.12 s squash and a 3-mote cream puff; pooled, max 24 per second, merged above that.
2. **Gem pickup pop**: gem scales 1.0 -> 1.25 -> 0 as it reaches the hero, thread knot glints; gem chime rises a semitone per gem within 0.6 s (resets), capped at +7 (audio budget voice cap holds).
3. **Level-up flourish**: XP thread knot flares, a 0.3 s warm ring from the lantern, then the offer; level_up cue (built). No slow-mo; the offer already pauses.
4. **Number pops**: weapon numbers scale in 1.3 -> 1.0 over 90 ms; big hits (top 10% for that weapon this minute) 1.15x and warm; still one layer under the hero "-N" (DR1).
5. **Hit-stop budget**: only on miniboss kill (0.05 s), evolution pick (E9 beat already), boss phase/fall (built), hero hit at under 30% HP (0.03 s). Never on common kills. Cap 0.06 s, cooldown 0.6 s (as built), off under Calm.
6. **Camera kick**: ability use 0.02 zoomPunch (built helper) + 60 ms shake 0.002; miniboss lunge landing 0.003. Shake total budget: never more than 1 shake per 0.4 s, all respect the Screen shake setting and Calm.
7. **Phone vibration** (navigator.vibrate where supported; iPhone Safari has none, so it degrades silently): hurt 20 ms, level-up 2 x 15 ms, evolution 40-20-60 ms, boss fall 80 ms; never more than 1 buzz per 0.5 s; Settings toggle "Vibration" (on by default, device setting like audio); off when the tab is hidden.
8. **Pickup pops**: heart/magnet/chest get a 0.2 s ring + their built cue; heart heals with a lantern-flame swell in the HUD (flareHp built).

## 7. Phone, touch, keyboard, accessibility
- Copy picks the CURRENT input (last used: keyboard vs touch), not the screen size. Gamepad prompts only once gamepad support is built (glyph set reserved).
- Plates: min 16 px text, 4.5:1 contrast on the glass, never in the thumb zones (bottom 35% on phones), never over the hero.
- Calm: no motion on plates (fade only), no hit-stop, no shake, vibration stays (it is not motion; own toggle). Reduced flashing: level-up ring is opacity-only.
- Screen reader: each whisper once through the status region; cards already have labels.
- Skippable at every level: Tab/tap hides one, "Tips" toggle hides all, "Show tips again" restores.

## 8. Fit check and mechanical sense (vs docs/LOCKED.md)
- Fit: plates are the Lantern Glass kit + the lantern whisper voice (U4); gold = lantern role colour; nothing new in the world layer.
- Mechanical sense: no sim change (bot sweeps unaffected); hint triggers read existing events (gem spawn, ability ready, hurt, frost threshold 30%).
- Conflicts checked: Evolve hint (never names evolution: kept); Reroll/banish are tree unlocks (hint 6 only after the node: kept); HUD frost thresholds (unchanged); DR1 layers (plates and pops stay under the hero "-N"); Results one-screen rule (teaching uses the existing nudge slot); Front door (no new screen before run 1); Audio (uses built cues; gem pitch ladder fits the voice budget; Calm sound follows Calm); E9 beat untouched; Screen shake setting respected.

## 9. Risks and honest weak spots
- The first minute is DARK (visibility arc 0.14x brightness 0:00-3:00): plates must be legible on near-black; mock-ups confirm the glass plate reads, but real-phone check needed.
- First level-up timing is estimated (~0:10-0:20); hints 2-3 may collide with it. Mitigation: queue; verify with a scripted first-run capture in FM1.
- iPhone Safari has no vibration API; Android only. Honest: a nice-to-have.
- Recalled research, not re-fetched: indicative only.
- Mock-ups use static cards, not the built U5 arched cards with eyelets; layout intent only.

## 10. Build plan (small chunks; each verified: tests, screenshots 3 sizes, security, fit; Matt reviews)
| Chunk | What | Done-check |
|---|---|---|
| FM1 | Hint engine (pure: ladder state, triggers, queue, per-lantern bits, sanitised save field) + plate UI + hints 1-3 + Tips toggle | unit tests (ladder, queue, save round-trip, bad data), shots at 0:01/0:05/0:10 x 3 sizes, Calm |
| FM2 | Hints 4-6 + first level-up / stirs / evolution / slots-full lines | tests + shots |
| FM3 | First death / second death / first win nudges + tree tip copy | results tests + shots |
| FM4 | Feel set items 1-4 (pops, chime ladder, flourish, numbers) | frame-time check Low tier phone size, audio budget test |
| FM5 | Feel items 5-8 (hit-stop budget, camera kick, vibration + setting, pickup pops) | settings tests, Calm off-switch tests, shake budget test |
| FM6 | Playtest pass: fresh lantern, keyboard + phone, Matt plays run 1 cold | Matt's feedback |

Security: no new deps; hint bits validated like other save fields; all copy via textContent; vibration called only from user-visible events, never from URL params.
