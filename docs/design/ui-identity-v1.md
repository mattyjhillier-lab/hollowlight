# UI visual + voice sheet v1 (DESIGN, awaiting Matt; NOT in LOCKED)

Date 2026-10-16. Research: docs/research/32-ui-identity.md. Pictures: docs/mockups/ui-identity/ (README there). Current-build audit shots: docs/mockups/ui-identity/audit/. Results layout stays the locked R1-R5 layout (one screen, no scroll), only re-skinned.

## 1. Audit of the CURRENT live screens: what is bland and WHY
(Real screenshots of the dev build, 1280x720 / 844x390 / 390x844; see audit/.)
1. TWO LOOKS IN ONE GAME. HUD and level-up cards are warm brass-and-cream (HUD A). Title, hero select, pause, settings, tree panel and results are still the old Moonlit Glass: navy fills, cyan-to-violet gradient edges, lavender text. The player crosses a style border every time a menu opens. Biggest single cause of "generic".
2. ONE BORDER FOR EVERYTHING. Cards, buttons, bars, toasts, hero cards all get the same 1 px glow edge and the same 10-14 px radius. Nothing says "this is the important thing"; it reads as default rounded boxes.
3. BLOCKY PROPORTIONS. Full-width equal-weight buttons, big uniform radii, big filled boxes, label-over-value lists. Stat blocks (Health / Speed / Trait / Weapon / Ability) are a plain two-column list, the same on both heroes.
4. NO TYPE HIERARCHY. System stacks (Palatino / Trebuchet / Segoe), one weight, similar sizes; the results screen is a centred label-then-value list. Wordmark is the only styled text.
5. NATIVE CONTROLS. Settings uses the browser's checkboxes, range sliders and select; they carry Windows/Chrome identity, not ours.
6. LAYOUT BUGS THAT HURT FIRST IMPRESSION. At 1280x720 the title wordmark is clipped off the top (install card, hint text, two hero cards and key hints all stack in one column); on phone the title and hero select are one long stack with a gold install box in the middle. Hero select and title are the same screen.
7. COPY IS PLACEHOLDER. "prototype", "Landscape recommended", "Play again", "Spend gold", "Quit to menu", "You were overrun" (red), "Level reached", "Enemies slain". Correct but no voice; the bible's bittersweet lantern tone never reaches the menus. Defeat in red clashes with the locked "dim, not out" direction.
8. ICONS ARE ONLY IN CARDS. Everything else is text. The tree uses identical grey circles with 8 px labels.
Verdict: the warm HUD/cards direction is right; the rest of the UI simply has not been brought across, and none of it has a signature motif.

## 2. UI language (shared by both takes)
One idea: the UI is made of things a lantern-bearer carries. Lantern glass, brass fittings, thread, wicks, paper tags. Finer and lighter than now: hairlines and thread instead of fat glow borders; ornament only at corners, ends and dividers; big scale contrast instead of boxes inside boxes.

Kit (names used in both takes; build = CSS component classes + tokens):
| Part | Rule |
|---|---|
| Panel | One calm surface (never nested boxes). Frame ornament at corners only. Title kicker (small) + title (large) + hairline divider. |
| Button | Slim (min 44 px high), text-led, no fat fill. Primary = warm amber glow + wick-flame glyph at the left (the flame IS the focus/hover mark); secondary = outline only; danger = red text, never red fill. Key hint (Enter / Esc / R) at the right, hidden on touch. Optional whisper line under the label. |
| Tab / toggle | Toggle = wick: thumb is a flame bead, on = amber lit; slider = thread with a bead handle. Select = hairline box with a small chevron. No native controls. |
| Card | Tall, one icon, one big word/number, thin pips (rank), one line of text; badge on the corner (NEW teal, EVOLVE gold with seal star), key hint corner. Blessing = quieter strip below, left-aligned. |
| Tooltip | Small tag, same frame as panel at 85% size: name (display face), one-line verb, rank line, flavour in whisper face. Max 3 lines; appears on focus/long-press as well as hover; never covers the thing it describes. |
| Divider | Thread with a centre bead (A: dashed thread + round knot; B: gradient hairline + lozenge). Same bead as the XP knot on the HUD. |
| Badge | NEW = teal; EVOLVE = gold (gold stays reserved for evolutions, dawn and the sun); counts as pips, not numbers, where possible. |
| State indicator | Wick-flame: lit = selected/ready/on; dim ember = available; dark = locked. Replaces glow-border-as-selection. |
Materials and colour roles reuse existing tokens: plate #1c1714 (surfaces), brass #d8b26a / brassDark #8d6c34 (frames, currency), cream #fff3dc (text, thread), thread #ffe0a0, flame #ffab3a (primary action, HP, lit), teal #6fd3c5 (NEW / good), gold #ffd36b (evolution only), danger #d9534f (danger text only), frost for low-HP. Take A adds two NEW tokens: vellum #eadbb8 and ink-brown #2b1f17 (paper surface + its text); needs a palette.test.mjs entry if chosen. Cyan and violet are retired from menus (violet stays as Elias's accent on his own card only).
Type system: see research 32 section 4. Display face for titles, names, numerals; plain body face for labels and descriptions; one whisper face for flavour. Sizes (rem at 16 px base): wordmark 4.6-5, screen title 2.2, card title 1.3, big number 2.5, body 1 (floor 12 px landscape phone, 13 px portrait), small 0.8 (floor 11 px). Numerals tabular.
Icon style rules: 24-grid, 1.5 px round stroke in cream (or ink in A), ONE accent fill per icon in flame colour (or gold for evolutions), silhouette readable at 16 px, no gradients, no outline-plus-shadow stacking, one visual idea per icon (wolf head, orbit ring, bolt, boots, flame, coin, shard in the mock-ups). Each hero/weapon icon gets the same grid so the tree, cards, results and tooltips share one set.
Motion hooks (all off under reduced motion, which then uses fades): panel enters with 180-250 ms rise and a soft light leak; focus moves a small flame between buttons (120 ms); cards ignite one by one 60 ms apart; toggle bead slides 120 ms; dividers draw left to right once; hanging tags (A) sway +-0.6 deg slowly. Sound hooks (names only, assets later): ui_focus (soft wick tick), ui_confirm (low chime), ui_back (muted), card_ignite, evolve_stir, toggle_wick; each one short, warm, quiet; respect the SFX volume.
Phone rules: targets 44 px+; no hover-only info; landscape phone drops secondary lines (whispers, descriptions) by priority rather than scrolling; portrait stacks cards as horizontal rows; keep safe-area padding; text floors above.

## 3. The two takes
Take A "WICK & VELLUM" (pictures a-*.png): hand-made paper-tag world. Cream vellum tags (sheets of paper) hanging by a brass eyelet and thread from the top; dashed rust thread stitched round the edge; luggage-tag buttons with a pointed end and eyelet; deckled irregular corners; Fraunces-style soft serif in ink on paper, Caveat-style handwriting for kicker and flavour lines; pips are knotted beads; EVOLVE is a gold wax seal; NEW is a teal swallow-tail flag. Pro: the most ownable and warm, nothing else in the genre looks like it, matches "lantern-craft" and the thread motif literally. Con: big bright cream areas against the dark world (glare, and different from the locked dark brass HUD plates); clip-path buttons lose box-shadow; handwriting font is the legibility risk; wants real paper texture for best effect; needs two new colour tokens; cards will feel like a different system from the HUD.
Take B "LANTERN GLASS" (pictures b-*.png): smoked-glass panes with a light leak from the corner, thin brass hairline, brass corner brackets instead of rounded corners, a small brass lantern cap on top of each card, letter-spaced caps display type (Cormorant-style), wick tick marks for stats and diamond beads for rank, lozenge dividers; buttons are bracket-corner outlines. Pro: stays dark and calm so the world art stays the star, extends the locked HUD A (brass plates, cream text) directly, cheapest and safest on phones (gradients and borders only), finest proportions, easy to scale. Con: the least unique of the two (brackets and glass can read as generic fantasy), the thread motif is weak, thin serif needs semibold at small sizes.
Comparison:
| | A Wick & Vellum | B Lantern Glass |
|---|---|---|
| Ownable / distinct | High | Medium |
| Fits locked HUD A | Medium (new surface colour) | High |
| Phone legibility | Medium (handwriting, paper contrast) | High |
| Build effort | M (clip-path buttons, texture, new tokens, tilt/sway) | S-M |
| Perf risk | Low-Med (shadows, rotation) | Low |
| Mood | Cosy, craft, storybook | Calm, premium, reverent |

## 4. Recommendation: B skeleton + A's thread (call it "Lantern Glass, hand-stitched")
Use B for panels, buttons, cards and type (fits the HUD, finest, cheapest, phone-safe) and borrow from A only the parts that make it ownable and cost nothing: the dashed THREAD divider with a round knot, knotted-bead pips, the brass eyelet with a hanging thread on cards (hide in portrait), the teal swallow-tail NEW flag, the gold wax-seal EVOLVE, and the handwritten whisper face for flavour lines only. Not borrowed: cream paper surfaces and luggage-tag buttons (they would fight the dark HUD). If Matt prefers the full storybook feel, A is the bolder choice and should then also re-skin the HUD plates (bigger chunk, reopens HUD A).

## 5. Copy voice guide
Rules: warm, quiet, short (lines of 12 words or fewer); concrete nouns from the world (lantern, wick, thread, hollow, dusk, dawn, spirits); plain label FIRST, whisper SECOND, so a new player is never lost; no exclamation marks, no jokes about dying, no "Game Over" or "You died"; British spelling; numbers plain; red is for danger only; never blame the player. Bittersweet, tender (BIBLE section 8).
| Screen | Sample copy |
|---|---|
| Title / cover | Kicker "Chapter 1 - The Cursed Forest". Wordmark Hollowlight. Tagline "Spirits of the Dusk". Buttons: "Begin the night" (whisper "Pick a hero and walk the Hollow"), "The Thread" ("Spend what you carried home"), "Lantern settings" ("Sound, motion, saves"). Footer "v0.4.0". Replaces "prototype". Install nudge becomes a small footer link "Install for full screen", not a gold box. |
| Hero select | Title "Who carries the lantern?". Wren, the Orphan: "Quick on her feet, with a pack at her heels." Elias, the Priest: "Slow to move, and very hard to put out." Stats renamed Heart / Stride (wick marks). Spirit and Ability lines. Gift line "Light-footed: +10% move speed". Buttons "Walk with Wren", "Back". Locked hero: "Not yet. Someone is still out there." |
| Map select | "Cursed Forest. Night 1. The trees remember being green." Locked: "Cold Marsh. One lantern is not enough yet. Clear the Forest first." Button "Walk this night". |
| Level-up | Title pool: "The light stirs" / "Something answers" / "The thread tightens". Sub "Level 7 - choose one gift". Weapon card: name, "NEW", one verb line "Homing orbs seek out the nearest foe." Stat card: "Wider orbit +12%, 50 to 56 reach", whisper "Something stirs..." when it nears an evolution. Evolution card: badge "EVOLVE", name "Pouncing Pack", big word "Leap", "pin and maul", "from Ghost Wolves". Blessing strip: "Blessings - quiet gifts", e.g. "Dawnlit Soles: +2% move speed, 1/2". Pills "Reroll x2", "Banish x1". |
| Pause | Kicker "The night waits", title "Paused", line "The lantern holds its breath. Take your time." Buttons "Keep walking", "Lantern settings", "Leave the night" (whisper "Back to the title; this run is lost"). |
| Settings | Music, Sounds, Screen shake, "Calm motion" (help "Less movement and flashing"), Damage numbers, Picture quality. Save: "Save to file", "Load from file", "Forget everything". Confirm: "Forget everything? Your gold, shards and the whole Thread will be gone. This cannot be undone." Buttons "Keep it" / "Forget". Bad file: "That is not a Hollowlight save. Nothing was changed." |
| Tooltips | Weapon: "Ghost Wolves. Rank 2 of 5. Wolves hunt separate foes. Next: +1 wolf." Locked node: "Raven Flock. 84% there: slay 120 more crows." Evolution recipe stays hidden: "Something stirs..." |
| Results (locked layout) | Defeat: "The light dwindles" + "The night is long. The lantern still burns, a little. Rest, then walk again." Near miss "3:18 short of dawn - best 12:05". Buttons "Walk again", "The Thread" (whisper "Spend gold"), "Title". Dawn: "Dawn" + "The sun is generous. Every grey thing wakes." Chips: Level, Slain, Evolved; "+312 gold - 432 kept". |

## 6. Fit check
Look/identity: lantern, thread, wick and brass are the Warm Lantern world and the HUD A tokens; gold stays for evolutions; no new generic fantasy kit; both takes are code-drawn (no assets). Mechanical sense: same information and same keys as the live build and the locked results layout (nothing is added to or removed from gameplay); Banish/Reroll, Blessings strip, key hints and 250 ms lock all stay; wick-flame gives one consistent state language. Conflict check vs LOCKED: HUD A stays (B skeleton extends it); results layout R1-R5 respected (one screen, no scroll, measured); gold reserved; "dim not out" respected (no red defeat). One possible conflict: if A is chosen the HUD plates should follow (reopen HUD A, needs Matt).

## 7. Measured (docs/mockups/ui-identity/measured.txt, regenerate: node build.mjs)
36 frames (2 takes x 6 screens x 3 sizes; pause and settings counted as two screens): no element outside the viewport, no rendered text under 11 px, every button/card/pill at least 44 px high. Results frames fit one screen without scroll at all three sizes.

## 8. Honest weak spots
1. FONTS ARE STAND-INS (Constantia, Candara, Ink Free, Garamond, Corbel are installed Windows fonts). Real Fraunces/Alegreya/Caveat/Cormorant/Figtree differ in width and weight; every proof must be redone with the real files (needs Matt's yes to download, see decisions). Cormorant is thin at small sizes; handwriting is for whispers only.
2. Mock-up hero portraits, backdrop and lantern are placeholders; real build uses the locked hero rigs and the frozen game frame. Tooltips and map select are copy-only (no picture). The tree screen is NOT re-skinned here (it needs its own sheet #5; the audit shows its 8 px labels and identical grey nodes are weak).
3. Motion and sound are specs; a still PNG cannot show them. Light leak and flame flicker need a real-device check.
4. Take A paper texture is flat gradients here; real paper grain could look better or heavier. Take A needs two new palette tokens and a tests entry.
5. The 44 px / 11 px floors are met in the mock-ups, but the in-game card layout on 844x390 hides descriptions and the evolution "from" line to fit; the build must keep that priority order.
6. A hanging-thread eyelet on stacked portrait cards collides, so it is hidden in portrait; check on a real phone.
7. Copy is my draft; names like "The Thread" for the tree and "Heart/Stride" are new vocabulary that must stay consistent with docs/BIBLE.md and the Blessings names. Needs Matt's ear.
8. Font bytes inside the single-file build (est. 100-150 KB) need measuring against the PWA cache size.

## 9. Build chunks (each needs Matt's go; none started)
U1 Fonts + tokens: download and self-host the chosen OFL fonts (Latin subset woff2), @font-face, CSS variables, CREDITS + OFL.txt, palette parity test; no layout change. U2 Frame kit: panel, button, divider, badge, wick toggle/slider/select CSS classes + a kit test page. U3 Title + hero select split into two screens, fix the clipped wordmark, install nudge to a footer link. U4 Pause + settings with the custom controls. U5 Level-up / Blessing / evolution cards re-skin (cardview/cardsui/cards.css, HUD-2 follow-up, tests kept). U6 Results re-skin (follows build chunks R1-R5; reuse the kit). U7 Tooltips + map select. U8 Tree screen (after sheet #5). U9 Icon set polish to the shared grid + sound hook names wired to silent stubs.

## 10. Decisions for Matt (recommendation first)
1. Which look? (Recommended) Lantern Glass hand-stitched (B skeleton + A thread/seal/flag), A Wick & Vellum (full paper storybook, would also re-skin the HUD plates), B pure.
2. May I download the 5 OFL font families from the Google Fonts GitHub repo (github.com/google/fonts, files under ofl/, about 100-150 KB after subsetting) so the proofs use real fonts before you lock? (Recommended) Yes, only Cormorant Garamond + Figtree + Caveat for the recommended look; no for now = stand-ins stay and U1 waits.
3. How in-world should button words be? (Recommended) Plain label with a whisper under it ("Begin the night" / "Pick a hero and walk the Hollow"); fully in-world names only (no plain helper line); or plain labels only ("Play", "Skill Tree", "Settings").
