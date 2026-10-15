# 28 - HUD, level-up cards, damage numbers: research and brief for design sheet #1 (checked 2026-10-15)

Labels: OFFICIAL = primary standard/doc fetched this session. COMMUNITY = forum/guide/search summary. OPINION = my synthesis or background knowledge of the games, NOT verified by a fetched source. UNVERIFIED = could not confirm.
HONEST NOTE: the search tool returned thin results for survivors-likes (no wiki/devlog pages for the HUDs of Vampire Survivors, Brotato, HoloCure, Spirit Hunters, Halls of Torment, Death Must Die; Survivor.io only via guide sites). So per-game HUD rows are OPINION from play knowledge; verify by looking at the games/screenshots before Matt sees the sheet. The standards (WCAG, MDN) are verified. Existing docs read first: CLAUDE.md, LOCKED, IDENTITY, ART-DECISIONS, DESIGN-SHEETS, research 06/11/13, cartoon-polished + style-lab READMEs, p1-world/p1-levelup mockups, touch1/evohint/bless1 screenshots, ui.js, style.css, palette.js.

## 0. Where we are now (ground truth from the code and screenshots)
| Item | Current build (src/ui/ui.js, style.css) | Problem for sheet #1 |
|---|---|---|
| Look | "Moonlit Glass": navy glass pills, cyan->violet gradient borders, violet ability, red HP bar, Palatino/Trebuchet system fonts | Predates the locked Warm Lantern recipe: cold blue, generic glass; Matt rejected "glass/neon" as no identity |
| HP/XP | 2 horizontal pills top-left (23em wide desktop, 13em phone); text "60 / 60", "LEVEL 1" | Nothing says lantern/spirit thread; red HP clashes with warm mood |
| Timer | centre pill "14:58" counting DOWN (runSeconds - time) | No moon arc / dawn line yet |
| Kills/Gold | two pills top-right; touch pause button 48px sits right of them | Kills is low value to show always (see s1) |
| Weapons | 4 text slots bottom-left ("Ghost Wolves" + rank bar, "empty slot" x3) | Text not icon; empty slots read as clutter; no cooldown ring; takes ~30% of bottom edge on phone portrait |
| Ability | bottom-right; desktop = wide bar with [Space]; touch = 92px conic ring | Ring is good; name text 11px is too small |
| Cards | 17em wide, dark navy gradient, top colour bar, number key box, pips; gold EVOLVE (badge clipped at top in screenshots: "EVOLVE" text cut by card top edge), cream BLESSING badge, gold-edge "Something stirs..." | No icons; 5 cards wrap to a second row (bless1 screenshot) and the row reads as clutter; badge clipping bug; blur backdrop only on this layer (correct) |
| Phone | touch1 screenshots: landscape HUD fine but weapon slots eat the bottom-left under joystick zone; portrait HUD crowds top row (bars + timer + kills + pause) | Provisional; sheet #1 replaces it |
| Scale | #ui font-size clamp(9px, 1.7cqw, 20px); touch clamp(11px,..,20px). At 1280 wide = 20px base; at 844 wide phone landscape ~14.3px; portrait 390 wide stage = 11px floor | All em-based; text min must be tested at the floor |
| Colour rules in force | Gold reserved for evolutions (CSS --gold also used for Gold counter and "New best" - a rule leak to fix); cream = Blessing; ember/red = enemy/danger only | HUD red HP bar breaks "red only for danger"; lantern amber for HP needs a distinct hue from gold (see s4) |

## 1. In-run HUD conventions
### 1.1 What genre games show (OPINION unless noted; verify visually)
| Game | Always shown | Contextual / hidden | Notable |
|---|---|---|---|
| Vampire Survivors | XP bar across the full top edge with level; timer top-centre; gold + kills top-right; weapon + passive icon rows top-left (small, rank not shown as pips); player HP is a tiny bar UNDER the character, not in the corner | Boss bar only on boss; pickups feedback in world | Smallest HUD in the genre: world gets ~95% of the screen. A forum comment on an early build praised the tidy "EXP bar on top, health, coins and timer below" (COMMUNITY https://itch.io/post/9481670) |
| Brotato | HP + XP + materials top-left stack; wave number + countdown top-centre; weapon icons bottom or side (6 slots) | Level-up and shop are separate paused screens | Big readable numerals, bold outlines on a busy arena (OPINION) |
| HoloCure | HP bar bottom-left or top-left, XP across the top, weapon/item icons with level numbers in a strip, timer top-centre, kill count + coins | Boss bar top | Bright chibi UI, outlined icon strips (OPINION) |
| Spirit Hunters: Infinite Horde | Mobile-style: HP/XP and timer top, joystick floating, active-ability button right | skill icons contextual (OPINION; no source fetched) | Closest comparison to what Matt plays; Matt likes its look more than its HUD |
| Halls of Torment | Diablo-style: HP orb/bar + XP bottom, skill/ability bar bottom, kill + gold counters top | Rich panel chrome | Ornate; wrong for our "restraint" (OPINION) |
| Death Must Die | Hades-like: HP, abilities row bottom-centre with cooldown, boon icons side, rich tooltips | Boss bars | Heavy chrome, 3 abilities (OPINION) |
| Survivor.io / Archero | Avatar + menu top-left; XP bar and timer top; joystick bottom-left floating; skill icons top-left row; HP bar over the hero's head in Archero | Evolution/chest popups | Mobile conventions: top edge = read-only information, bottom corners = thumbs (COMMUNITY partial: https://www.bluestacks.com:443/blog/game-guides/survivor-io/sio-skills-evolution-guide-en.html ; TalkAndroid guide above) |
| Hades | Health as a bar at bottom-left with number; boon icons stacked; boss bar bottom-centre wide, ornate; damage numbers white/small | Almost everything else hides | Boss bar is the only wide element (OPINION) |
| Dead Cells | HP bar top-left, skills bottom-left, minimal currency; deliberate low screen footprint | Contextual item pickups | Outline + shadow on all HUD text for contrast (OPINION) |
Cross-cutting pattern (OPINION, consistent across games): (1) the top edge is information only; (2) HP is either a corner bar or follows the player; (3) XP is a thin full-width or wide strip, because it changes constantly and needs only a glance; (4) timer is top-centre; (5) weapon icons are small and mostly decorative once learned; (6) the boss bar is the single contextual wide element; (7) kill count is optional and often small; gold is shown because it is a currency.

### 1.2 Screen-area budget (OPINION; my numbers from the mockups)
| Zone | Target share of screen | Our current | Notes |
|---|---|---|---|
| Whole HUD footprint (opaque-ish pixels) | <= 10-12% desktop, <= 14% phone landscape | est. 14-16% desktop, 20%+ portrait | Heroes are 60px (desktop) / 40px (phone): enemies reach screen edges, so corners get covered most |
| Centre 50% x 50% of the screen | 0% HUD | 0% | Hard rule: nothing in the action centre except transient popups |
| Top strip | up to ~10% of height | ~16% desktop (bars + timer + pills) | Timer arc is the tallest piece; keep arc depth <= ~9% of height |
| Bottom corners | thumbs live here on phone; HUD must be translucent / small | weapon slots + ability | Never put read-only info under the joystick base |
(The p1-world mockup, 1280x720, uses roughly 13% for HUD; its top-left lantern plate and bottom-left four icon slots are both under 12% of width. It is a static mockup, not play-tested.)

### 1.3 Thumb zones and phone layout (mixed OFFICIAL/COMMUNITY/OPINION)
- COMMUNITY (Parachute, FluidUI, Packt): comfortable reach = lower centre / lower sides, stretch = mid sides, hard = top corners. For landscape the two thumbs rest on the left and right lower edges; the top corners need a grip change. Test left-handed too.
- COMMUNITY (CMS conference paper, Godot mobile guide): items placed outside the functional reach are a real risk; guard against notch overlap by querying the safe area; do not hard-lock orientation without handling size changes (foldables/tablets).
- COMMUNITY (joystick guides): floating joystick that spawns under the first touch; small dead zone; response curve with fine control near centre. Ours already does this (TOUCH-1).
- OFFICIAL (MDN `env()`): `env(safe-area-inset-top|right|bottom|left)` is 0 on rectangular screens and positive on notched ones; give a fallback. Needs `viewport-fit=cover` in the viewport meta (MDN page did not cover it; known behaviour, UNVERIFIED this session - check our index.html has it). https://developer.mozilla.org/en-US/docs/Web/CSS/env
- OPINION layout rules for phone landscape: left 55% of screen = joystick zone (already built), right-bottom = ability (92px, thumb-reachable), pause top-right with generous but guarded target; weapon strip must NOT sit in the left-bottom corner under the joystick base. Move it to top-left under the HP plate, or to bottom-centre-left but small and read-only.
- OPINION for phone portrait: the camera zoom already uses full height (research 15). Top row holds: HP plate (left), timer (centre), pause (right); a second compact row for weapons below HP; ability bottom-right; joystick floating bottom half. Gold/kills fold into one small chip (or drop Kills).
- Safe area: pad every edge-pinned element by `max(Npx, env(safe-area-inset-*))`. The touch layer already does this for ability + pause; the DOM HUD (bars, slots, timer) does NOT: fix in the build.

### 1.4 Element conventions
| Element | Convention (OPINION unless noted) | Recommendation for Hollowlight |
|---|---|---|
| HP | Bar + number, or orb; low-HP warning via pulse/vignette | Lantern flame fill (see s4); number kept in small text; low-HP = frost edge + flame shrinks and flickers; add a shape cue (flame shrinks, not just recolour) |
| XP | Thin wide strip; level number | Thread strip along the top or beneath the HP plate; level in a small knot/badge; do not show "xx / yy" |
| Timer | Count-up (VS) or countdown (Brotato). We count DOWN to dawn (15:00) | Moon on arc travelling toward dawn line + digits mm:ss (digits always present for accessibility) |
| Currency | Icon + number, top-right | One chip: coin icon + number. Gold colour NOT used (reserved). Use brass/cream |
| Kills | Often small or absent (VS shows it; Brotato not) | Demote: show on pause/results; optional in the settings; keep off the in-run HUD by default (frees ~3% of the top-right) |
| Weapon slots | Icon + rank (dots/number) + sometimes cooldown ring | 4 icon tiles, rank pips under, evolved = gold rim; empty slots = faint dashed outline (no text "empty slot"); no per-weapon cooldown ring needed (weapons auto-fire; ring only if a weapon has a visible charge) |
| Ability | Button with cooldown ring + key hint | Round button, conic cooldown ring, ready = soft pulse + glow; desktop shows [Space] glyph, touch hides it |
| Boss bar | Wide bar top or bottom, name, phase notches | Reuse moon-arc space: replace timer arc with a wide hollow-bark bar below the timer; phase notches for the 3 Treant phases; boss name in head font |
| Combo/kill counters | Used in arcade/bullet-hell, not core to survivors-likes | Skip (not in the identity); parked |
| Pickup toasts | small text lines | One toast lane under the timer (already exists), max 1 visible |

### 1.5 Readability on busy backgrounds (OPINION + COMMUNITY)
- Techniques ranked by cost: (1) dark tinted outline/shadow on all HUD text (free, always on); (2) soft dark plate behind HUD groups at 55-70% opacity (cheap, no blur); (3) a faint top and bottom vignette gradient in the canvas to separate HUD from ground (cheap); (4) backdrop blur (EXPENSIVE, only on paused screens). Research 13 already set rule: no backdrop-filter in-run.
- COMMUNITY (Neverwinter combat-text readability): they moved damage numbers to a plain sans font and shrank them 23-50%; outgoing numbers confined to one quadrant above the enemy. https://forum.arcgames.com/neverwinter/roletracker/jump/1266779
- COMMUNITY (Unity combat-text guide): white text with a slight outline is the most legible over varied backgrounds. https://www.wayline.io/blog/unity-floating-combat-text
- OPINION: our world mixes grey-blue Hollow and green restored ground: HUD plates should be dark-warm (deep brown-slate, not navy) with a cream line so they read on both. The p1-world mockup does this (dark glass + brass edge).

### 1.6 Accessibility (OFFICIAL standards + COMMUNITY)
| Item | Source | Rule applied |
|---|---|---|
| Target size | OFFICIAL WCAG 2.2 SC 2.5.8 AA: >= 24x24 CSS px; SC 2.5.5 AAA: >= 44x44 CSS px (https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html , .../target-size-enhanced.html) | All tappable things >= 44x44 (project rule); read-only icons may be smaller |
| Contrast | COMMUNITY summarising WCAG: 4.5:1 normal text, 3:1 large; HUD text over a moving scene can fail, test across the scene | Text on plates >= 4.5:1 against the plate (plate is opaque enough that the world does not matter) |
| Colour not sole signal | COMMUNITY (Game Accessibility Guidelines, Xbox XAG): pair colour with shape/icon/label; avoid red-green pairs | HP low = shape (flame shrinks) + frost + pulse; cards = badge text + border shape, not colour only; Blessing vs Evolve = badge word + rim shape |
| Text size / scaling | COMMUNITY: text size is one of the 4 most-complained issues; Xbox XAG expects launch minimums and player scaling; mobile needs more px for same physical size (https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/101, https://gameaccessibilityguidelines.com/basic/) | Add a UI scale setting (100/125/150%); min body 14px, HUD numerals 16px+ at the smallest stage |
| Motion/flash | COMMUNITY (Vampire Survivors players report flash/shake overload, Steam thread cited in research 06) | Existing settings: screen shake, reduced motion, damage numbers. Add: reduce flashes (hurt flash, evolve flash, frost pulses) |
| Colour-blind | COMMUNITY | Run the final art through a deuteranopia/protanopia simulation as part of the proof pack |
Colour-blind caution for us: amber (HP lantern) vs gold (evolve) vs cream (Blessing) are all yellow-ish and collapse in tritanopia/low-vision; they MUST be separated by shape and word, not hue alone.

## 2. Level-up card screens
### 2.1 What exists in the genre (OPINION; Survivor.io partial COMMUNITY)
| Feature | Common practice | Notes |
|---|---|---|
| Layout | 3 cards in a row on desktop (VS shows 3-4; Brotato 4); on phone Survivor.io shows 3 vertical stacked wide cards (OPINION) | Row of 3 needs ~ 3 x 17em = 51em + gaps: fits landscape phone only at small text; portrait must stack |
| Card anatomy | Icon (largest element) -> name -> one-line effect -> rank dots or "Lv 2 -> 3" -> rarity frame colour | Our current cards have no icon: slowest to scan. The p1-levelup mockup is icon-led with a big number ("+15%") and a stat label: much faster to read |
| Selection | Tap / click, number keys, d-pad/stick + confirm | Ours: click, 1-5, arrows+Enter, hover. Good. Add: touch tap should select-then-confirm? NO: single tap picks (speed) but the card must have a pressed state and 44px min; protect against mis-taps with a 250ms input lock when the screen opens |
| Reroll/banish/skip | Small buttons below the row; counts shown ("Reroll 2"); banish often as an X on a selected card or a mode (COMMUNITY banish explainer https://gmdq.substack.com/p/vampire-survivors-banish-mechanic ; token model from a RoR2 mod: pick resets the reroll token, banish tokens earned per N levels https://thunderstore.io/c/riskofrain2/p/erenkara/LevelUpChoices/v/1.1.1/) | Keep two separate labelled buttons with counts; mind spacing (a mod changelog fixed overlapping Banish/Reroll buttons). Skip is NOT in our design: no button. |
| Evolution card | Gold/special frame, often fixed position or first | Ours: gold, appended; mockup shows centre. Keep EVOLVE badge + gold rim + sparkle + a word label "EVOLUTION" |
| Stat preview | "old -> new" values (Brotato shows numbers; VS shows text only) | We already show "3.5s -> 4s (+0.5s bleed)": a strength. Mockup shows only "+15%": keep both: big new delta + small "from -> to" line |
| Pause/overlay | Game pauses (ours does), dim + optional blur | Dim with warm vignette (lantern glow behind); blur only if perf allows; fallback to no-blur on touch/low |
| Animation | Deal-in stagger 60-80ms, slight rise, hover lift ~8px, selected glow. Cheap CSS only | Ours already (cardIn stagger 70ms). Keep under 350ms total so it never delays play |
| Decision-time target | OPINION: level-ups happen every 20-40s early; a pick should take <3s; cards must be scannable by icon + one number | Rule: a returning player should identify the best card from icon + title alone, text is for new players |
| Text size | OPINION: >= 14px body on the smallest stage, >= 18px titles; WCAG large text >= 18.66px bold / 24px | Cards on phone landscape: 3-across needs ~ 12em each at 14px = fine at 844px width but tight; consider 2.5-row compact layout |

### 2.2 Distinguishing special cards without confusion (OPINION; our own rule set)
| Card | Border | Badge word | Shape cue | Colour | Position |
|---|---|---|---|---|---|
| Stat (normal) | Thin slate-cream line | none | Rounded rectangle | Weapon's role colour on the icon ring only | in the 3 normal slots |
| New weapon | Thin line | "NEW" tab | Notched top-left tab | Weapon role colour | normal slots |
| Evolution | Double line + corner sparkles | "EVOLVE" ribbon (drawn INSIDE the card, not clipped at the edge) | Ribbon + taller card (+8%) | Gold (reserved) | first or centre |
| Blessing | Single cream line, no glow | "BLESSING" tab, quieter | Smaller card (-10%), sits on a second quiet row | Cream (never gold, never glowing) | Second row, visually "extra" |
| "Something stirs..." | Hairline gold edge only, NO badge, NO glow | italic line (existing) | none (must not look like Evolve) | Dimmed gold at ~40% | on the stat card |
| Fallback (heal/gold/xp) | Plain | icon only | none | Neutral | normal |
Problem seen in bless1 screenshot: 5 cards = 3 + 2 wrapped (second row looks like an error) and both Evolve badges are clipped. The brief must lay out up to 6 cards deliberately: row A = up to 3 normal/gold cards; row B (when present) = quieter smaller Blessing cards; or a single horizontally scrolling lane on phone portrait.

## 3. Damage numbers, pickups, XP and kill feedback
| Topic | Practice | Source label | Recommendation |
|---|---|---|---|
| Size scaling | Scale with hit size: small hits unobtrusive, big hits impactful; may enlarge at distance | COMMUNITY (7 Days to Die mod, https://www.nexusmods.com/7daystodie/mods/7548) | Base 14px-equivalent at 60px hero; big hit (>= 3x median) 1.4x with pop; cap at 2x |
| Colour language | Yellow for crit, separate styles for bleed/fire, white default | COMMUNITY same mod | White-cream default (never gold). Crit = bigger + brass outline + 2-frame pop, not gold. Bleed/holy/lightning get a thin tint only if readable; otherwise skip. Gold stays evolutions. Player damage taken = cool pale rose, small, near the hero, separate lane |
| Clutter | Random small spawn offset; too large detaches from the target | COMMUNITY (Unity guide) | +/-6px jitter, rise 20px, 450ms; 2-6 px outline |
| Merge in swarms | UNVERIFIED by source this session (search found none); common practice is summing rapid ticks per enemy per ~100-150ms (research 06 row: merge per enemy per 100ms) | OPINION | Merge per enemy per 120ms; global cap ~24 live numbers; when over cap, drop the SMALLEST first; AoE hitting > 5 enemies: show only 1-2 numbers + a ring flash |
| Big numbers | Large values must not wrap to two lines; use compact format | COMMUNITY (No Rest for the Wicked bug report) | Format with k/M at >= 10,000; `white-space: nowrap`; fixed digit widths |
| Performance | Pooled BitmapText (research 06: ~40) with scale tween; no DOM per number | OPINION | Keep in the canvas (BitmapText), NOT the DOM; pre-baked outlined bitmap font in Hollowlight style |
| Toggle | Setting to turn numbers off | existing (Damage numbers) | Keep; add "crits only" mode |
| Reduced motion | No rise/pop; numbers fade in place | OPINION | Honour existing reducedMotion setting |
| Gem/XP pickup | Tiny sparkle + sound, gem flies to player (magnet) | OPINION | Gem arc to the player in a short thread trail; spirit thread HUD strip pulses once per N gems (cap: 1 pulse / 150ms); no popups per gem |
| Level-up | Short fanfare, screen flash, immediate pause for card pick | OPINION | Thread knot "ties" and flares, 250ms warm bloom, then cards. No text banner (the card screen is the banner) |
| Heart / magnet / chest | Distinct shape + colour; text popup for rare items | OPINION | Heart: soft pink glyph (already role heart), popup "+30" in cool-rose lane near hero; Magnet: lilac with a one-time ripple; Chest: brass with a single-line popup. None use gold |
| Kill feedback | Small death puff; sometimes a counter pulse | OPINION | Death wisp (already planned in research 06); no per-kill text; Kills is not a HUD element |

## 4. Giving the HUD identity (what to do, what to avoid)
| Idea | What it is | Cost | Risk / avoid |
|---|---|---|---|
| Lantern-flame HP | A small brass lantern whose flame height/size IS the HP; glass tint warm; HP number small beside it. At low HP: flame shrinks toward an ember, flickers slowly | 1 SVG + CSS transform scale on a pre-drawn flame; cheap | Flame colour amber-orange must differ from gold (evolve) and from enemy ember-red: use warm orange-amber for the flame, brass for metal; keep red only for the hit flash |
| Moon-arc timer | A thin arc over the top centre; a moon disc slides along it to a dawn line on the right; digits below. Arc fills with dawn colour in the last minute (palette ARC already has the dusk-to-dawn ramp) | SVG path, one transform per second | Do not make it large: depth <= 9% of height; keep digits (accessibility) |
| Spirit-thread XP | A thin thread (cream-amber) that stretches along the HUD edge with a bead at the head; level-up ties a knot | 1 scaleX-clipped SVG line | Must be readable as a bar: add start/end caps or notches |
| Frost at the edges at low HP | HUD corners get grey crystalline frost as the Hollow "reaches" the player: a pre-baked 640x360 vignette image with alpha tied to HP below 35%; plus the hurt flash | 1 image + opacity | Must not hide enemies: frost only on outer 8% of edges, never the centre; reduced-flash option; this also supports colour-blind (non-hue cue) |
| Colour returning to the HUD as you restore ground | HUD starts desaturated (grey-brown) and gains warmth with the life-map share (e.g. 0-60%) | CSS filter on HUD = EXPENSIVE; do it with 2 stacked pre-coloured layers and opacity | Optional, parked: only if it does not need a CSS filter (perf) and Matt says the life-map is allowed to affect UI (identity says life map is visual only: that includes UI? needs Matt's OK) |
| Weapon icons in Style v1 | Chibi emblem tiles (wolf head, raven, orb ring, bolt, forked lightning), tinted outline L2, rim light, rank pips beneath. The same emblems later trace the skill-tree constellations (sheet #5): reuse | Authored SVG per weapon (5 + 11 evolutions later) | Mockup note: "wolf head looks like a cat" at small size: test wolf at 36px; silhouette must be pointy-eared with a long muzzle |
| Restrained ornament | One ornament idea per element at most (brass rim OR a flourish, not both). Three recurring motifs only: lantern brass, thread, moon | free | User said earlier concepts did "too much at once": the sheet must show where ornament is deliberately ABSENT |
| Typography | Head: Cinzel or a warmer storybook serif; numerals: a rounded legible sans. Georgia + Segoe UI Black in the mockup were placeholders; ship OFL fonts self-hosted (research 13) | ~20-40KB base64 | Cinzel gets thin below 14px; do not use it for numerals |
Avoid: gold everywhere; red HP bars (conflicts with "red only for danger"); full-width glassmorphism panels in-run (perf + generic); ornate gothic frames (Halls of Torment look, wrong tone); gradient rainbow borders (current cyan-violet look); more than ~4 motifs; HUD that animates constantly (competes with enemies); blurry plates on busy ground.

## 5. DESIGN BRIEF for sheet #1 (three directions to mock up)
Common to all three: Hollowlight Style v1 (L2 tinted outlines, H2 soft gradient + rim light), Warm Lantern mood, dark-warm plates (deep slate-brown) not navy glass, gold reserved, cream = Blessing, no backdrop blur in-run, text outlined, every tappable >= 44 CSS px, safe-area padded.

### Direction A: "Lantern & Thread" (the already-proposed concept, refined)
Wireframe, desktop landscape (1280x720; letters = zones):
```
[Lantern plate: flame + HP#  / thread XP strip + Lv knot]      (moon arc + 07:42)      [coin 1,284][pause]
 (top-left ~19% w, 9% h)                                       (top-centre ~16% w)      (top-right ~12% w)

                          ... action: nothing here ...

[wolf][raven][orb][bolt]  (4 icon tiles, 52px, bottom-left)                      (ability ring 84px, bottom-right)
```
Phone landscape (844x390): same, scaled; weapon strip moves UP to sit under the lantern plate as a vertical or short horizontal strip of 4 x 32px icons (read-only, not tappable) so the bottom-left stays free for the joystick; ability ring 88px bottom-right; pause 48px top-right; coin chip tucked under pause or inline.
Phone portrait (390x844): row 1: lantern plate (left, 45% w), moon arc (centre), pause (right); row 2: thread strip full width under row 1 (thin, 6px); row 3: weapon strip under lantern plate; ability bottom-right 88px; joystick floating bottom-left half; coin chip next to timer digits.
Always visible: lantern HP, thread XP + level, moon-arc timer, coin, 4 weapon tiles, ability, pause. Contextual: boss bar (replaces/extends below arc), toast lane, frost edge, level-up.
Cards: three tall cards (icon-led like p1-levelup mockup), Evolve centre/first with gold double line + ribbon inside card, Blessing = smaller quiet cream row below with BLESSING tab; "stirs" = hairline gold edge + italic line, no ribbon. Phone portrait: stacked wide horizontal cards (icon left, text right) 3 high, Blessing row compact below.
Damage numbers: white-cream outlined numerals in a chunky rounded font, pop 1.3 -> 1, crit larger with brass outline.
Readability: dark-brown plates 70% opacity + 2px tinted outline + text shadow; vignette at top.
Perf cost: low (SVG + CSS transforms; no blur).
Strength: closest to what Matt has seen and liked (p1-world); strong identity. Weakness: top-left and top-centre are both "decorated"; risk of "too much at once" unless ornament is cut hard.

### Direction B: "Hearth Edge" (minimal, hero-attached)
Idea: almost no corner chrome; information hugs the world. HP is a small lantern flame glyph + thin arc ring AROUND/under the hero (like Archero/VS under-player bar, but a flame ring); XP is one thin thread running along the very top edge of the screen (full width, 4-6px); moon-arc timer is only a small moon + digits top-centre (no big arc); weapons = 4 tiny icons bottom-left, hidden after 8s unless something changes (new rank/evolve) or the player taps/holds a key; coin chip top-right small.
Wireframe desktop: full-width thread at y=0; top-centre moon + 07:42 (small); top-right coin + pause; bottom-left weapon icons (fade to 35% opacity); bottom-right ability ring; hero has the flame ring at its feet.
Phone: same; portrait thread at top, timer under it; only the ability ring + pause are interactive.
Always visible: thread XP, timer, coin, flame ring HP (tied to hero), ability. Contextual: weapons strip (fades), boss bar.
Cards: same as A (cards are identical across directions unless a direction says otherwise).
Damage numbers: slightly smaller, whiter; crits only get a pop.
Readability: HP ring on the hero must stay readable over busy ground and not hide the 40px phone hero (ring thin, <= 6px); risk: HP legibility during chaos is lower than a plate.
Perf cost: lowest (canvas ring or one DOM transform). Strength: maximum visible world, most "restraint". Weakness: loses the lantern-plate identity Matt liked; HP at a glance is harder; hero ring is ON the action (conflicts with "HUD never hides the action" at 40px).

### Direction C: "Dawn Frame" (frame-based, the Hollow reaches the edges)
Idea: the HUD is a thin continuous frame around the screen edge: a brass-and-slate rim whose top-centre dips into the moon arc, left corner holds the lantern, XP thread runs along the top rim, and the frost/colour state IS the frame (frost creeps in from corners as HP drops, warm light fills the frame as dawn nears and as ground is restored). Weapon tiles sit set into the bottom rim; ability ring sits in the bottom-right corner of the rim.
Wireframe desktop: outer 2-3% border frame (never > 24px at 1280); corners hold the plates; top rim = thread; bottom rim = weapons.
Phone: the frame thins to 10px except where the thumbs are; the bottom-left rim opens (gap) under the joystick; portrait uses top rim + bottom rim only.
Always visible: everything in A, but all drawn as part of one frame.
Readability: the frame itself is the contrast device (solid rim, thin); no per-element plates.
Perf cost: low-medium (a pre-baked 9-slice frame image + 2 alpha layers; frost = image alpha).
Strength: strongest own identity and "gaming" look, ties directly to The Hollow (frost/colour live in the frame), cheap to animate. Weakness: highest chance of "too much at once"; steals 6-10% of the screen edge at phone sizes (hero near the edge gets covered); harder to keep ornaments restrained; frames risk looking like a generic fantasy RPG if the motif is brass.

### Recommendation: A, with two borrowings
Choose A (Lantern & Thread) because: (1) it is the proven, already-liked mockup (p1-world) and matches the locked concept (CLAUDE/ART-DECISIONS); (2) every element maps to an existing system (HP, timer, XP, 4 slots, ability) so the build is small; (3) thumb zones are clean (top = read-only, bottom corners = ability and free joystick). Borrow from B: the weapon strip fades to low opacity after a few seconds and Kills is off the HUD (smaller footprint). Borrow from C: ONLY the frost-edge vignette at low HP as the one "Hollow reaches you" effect (no full frame). Cut ruthlessly: no ornaments on the weapon tiles beyond the rim light and pips; the lantern is the single ornate object.

## 6. True-size constraints
| Constraint | Value | Basis |
|---|---|---|
| Hero height | 60px desktop (1280x720), 40px phone | project spec |
| Stage base | 640x360 logical, ui font: clamp(9px, 1.7cqw, 20px); touch min 11px | style.css |
| Smallest legible text in HUD | 14px for words, 16px for numerals (timer/coin/HP) at the SMALLEST supported stage (390 wide portrait = 11px base currently: must be raised by using a UI-scale or a separate portrait base) | OPINION + Xbox XAG text-size guidance (COMMUNITY) |
| Card body text | >= 14px; card title >= 18px; key numeral (+15%) >= 28px | OPINION |
| Tappable targets | >= 44x44 CSS px (cards, ability, pause, reroll, banish, menus); 8px gaps | OFFICIAL WCAG 2.5.5 AAA; project rule |
| Read-only HUD icons | may be 32px but >= 24px | OFFICIAL WCAG 2.5.8 |
| Contrast | text >= 4.5:1 on its plate; plate edge >= 3:1 against both grey Hollow and green restored ground; gold/cream/amber distinguishable by shape + word | OFFICIAL/COMMUNITY WCAG |
| Safe area | pad edge elements with `max(12px, env(safe-area-inset-*))`; confirm `viewport-fit=cover` | OFFICIAL MDN env(); UNVERIFIED meta |
| HUD footprint | <= 12% desktop / <= 14% phone landscape / <= 16% portrait; centre half = 0% | OPINION |
| Frame cost | no `backdrop-filter` in-run (research 13); one per paused overlay max; `@supports not (backdrop-filter)` fallback to opaque plate (OFFICIAL MDN: Baseline 2024, https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter). Beware backdrop-root: parents with opacity<1/filter/mask break blur | OFFICIAL MDN |
| Animations | transform/opacity only; no `filter` animation; reduce-motion respected | research 06/13 |

## 7. Checklist for the "actual size + phone" proof images
1. Render the HUD over a REAL game frame (grey Hollow edge + restored green + 30 enemies) at 1280x720 with the 60px hero, NOT an empty background.
2. Same at 844x390 (phone landscape, hero 40px) and 390x844 (portrait), plus a notch simulation (top/left inset 44px/47px).
3. Overlay thumb heatmap: joystick zone (left 55%), ability reach (bottom-right 120px), pause (top-right) and prove no read-only element sits under the joystick base and none is within 120px of the centre.
4. Show HUD at 100% on a 1080p desktop crop (1:1 pixels, not scaled-down mockup) and at 2x DPR phone.
5. Measure and state: footprint % per zone, smallest font px, contrast ratios, hit-target sizes (annotate 44px squares).
6. States to show: full HP / 25% HP with frost / boss bar / ability ready vs cooling / empty weapon slots / 4 weapons + 1 evolved / level-up with 3 cards / 3 + 2 Blessing cards / "stirs" card / reroll + banish visible / zero banishes.
7. Damage numbers: 1 hit, a 12-enemy swarm hit, a crit, 4-digit damage, taken-damage lane; show merge/cap in action in a screenshot sequence.
8. Colour-blind check: deuteranopia + protanopia + greyscale simulations of HP, evolve vs Blessing vs stirs.
9. Reduced-motion/no-flash variant and "damage numbers off" variant.
10. Fit check + weak-spots list in the sheet; list which parts are placeholder (fonts, icons) and what the build chunk would be (small chunks: HUD skeleton -> cards -> numbers -> frost/moon extras).

## 8. Open questions for Matt (max 3, each with recommendation)
1. Kills counter off the in-run HUD (results/pause only)? Recommend yes.
2. Weapon strip fades after ~8s of no change? Recommend yes (HUD footprint, calmer look).
3. May the life-map "colour returning" affect the HUD (parked until the world sheet), or is the HUD frost-only for now? Recommend frost-only now; revisit in sheet #2.

## Sources (checked 2026-10-15)
- WCAG 2.2 target size min: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html (OFFICIAL; 24x24 AA)
- WCAG target size enhanced: https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html (OFFICIAL; 44x44 AAA)
- MDN env(): https://developer.mozilla.org/en-US/docs/Web/CSS/env (OFFICIAL)
- MDN backdrop-filter: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter (OFFICIAL; no perf guidance on the page)
- Game Accessibility Guidelines: https://gameaccessibilityguidelines.com/basic/ ; Xbox XAG 101: https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/101 (COMMUNITY via search summary; exact numerics not read)
- Thumb zone: https://parachutedesign.ca/blog/thumb-zone-ux/ ; https://blog.fluidui.com/the-thumb-zone/ ; https://openaccess.cms-conferences.org/publications/book/978-1-964867-13-7/article/978-1-964867-13-7_13 (COMMUNITY)
- Joystick: https://bugnet.io/blog/how-to-fix-mobile-virtual-joystick-feeling-bad (COMMUNITY)
- Banish: https://gmdq.substack.com/p/vampire-survivors-banish-mechanic ; RoR2 LevelUpChoices mod https://thunderstore.io/c/riskofrain2/p/erenkara/LevelUpChoices/v/1.1.1/ ; Rogue: Genesia thread https://steamcommunity.com/app/2067920/discussions/0/3370405530898131214 (COMMUNITY)
- Damage numbers: https://forum.arcgames.com/neverwinter/roletracker/jump/1266779 ; https://www.wayline.io/blog/unity-floating-combat-text ; https://www.nexusmods.com/7daystodie/mods/7548 ; https://forum.norestforthewicked.com/t/damage-numbers-sometimes-wrap-to-a-second-line-single-hit-value-appears-split/23584 (COMMUNITY)
- Survivor.io: https://www.bluestacks.com:443/blog/game-guides/survivor-io/sio-skills-evolution-guide-en.html ; https://www.talkandroid.com/24372-survivor-io-ultimate-game-guide-with-tips-2023/ (COMMUNITY, HUD details thin)
- Vampire Survivors HUD remark: https://itch.io/post/9481670 (COMMUNITY, weak, early build)
- Project docs: research 06, 11, 13; p1-world.png / p1-levelup.png; touch1, evohint, bless1 screenshots.

## Security check
No downloads/installs; web content read as data only; only this file written; no dependency or code change. Fonts/icons named are unadded candidates (OFL/ISC/MIT per research 13, need CREDITS when used).
## Fit check
All three directions use only existing systems (HP, timer, XP, 4 slots, ability, reroll/banish, Blessing, stirs) and the locked recipe (Style v1, Warm Lantern, gold reserved, life-map visual only). Weak spots: per-game HUD facts are mostly OPINION; `viewport-fit=cover` and the DOM HUD's missing safe-area padding are unverified/needed; amber vs gold vs cream hue collisions must be solved by shape and wording.
