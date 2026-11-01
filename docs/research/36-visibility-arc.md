# 36 - Visibility arc: darkness, lantern light and the brightening world

Status: research only. Not a design. Labels: OFFICIAL (dev talk, patch notes, official docs, standards), COMMUNITY (wiki, forum, reddit), OPINION (reviews, blogs, our inference).

Research honesty note: web search was weak for several topics (no primary Supergiant/Hades readability source found; no 20 Minutes Till Dawn darkness mechanics found; no GDC talk located). Those gaps are stated, not filled with guesses. Anything not sourced is tagged OPINION (our inference) and should be verified by playtest.

The idea under test: start very dark so the lantern is your light; far enemies are glowing eyes plus a faint silhouette, fully seen inside the lantern pool; the world brightens as the sun rises; late-run the restored world (flowers, bushes, props) turns vibrant.

---

## 1. Darkness / light radius as a mechanic (non-horde games)

### Darkest Dungeon (torch / light meter)
- COMMUNITY: light is a 0-100 meter in tiers. Radiant (76+) gives the best scouting (+15%) and monster-surprise (+25%) bonuses; Dim (51-75) gives smaller ones (+7.5% scouting, +15% surprise); Shadowy (26-50) makes the party easier to surprise (+15%) and adds stress. Low light also raises enemy accuracy/damage and reduces hero dodge, but increases loot. At 0 light, hallway fights can be replaced with an ambush by a Shambler. Numbers come from wiki pages and may not match the current version.
  https://darkestdungeon.wiki.gg/wiki/Light_meter
- Key lesson (OPINION): darkness there is a risk/reward dial the PLAYER controls (snuff the torch for loot). It changes odds, not what you can see on screen; the screen stays readable.
- What it means for Hollowlight: darkness should cost the player something specific and visible (less warning), and the player must always be able to read the immediate fight. Do not make darkness a hidden stat penalty.

### Don't Starve
- COMMUNITY: standing in darkness lets "Charlie" attack. The wiki states an unlit player is warned, then attacked after 5 seconds for 100 health and 20 sanity, and again 10 seconds later. Darkness also drains sanity (50/min stated). Campfires have a large light area that shrinks as the fire weakens; torches have a large light area but burn briefly. Light removes the big darkness penalty but not the gradual dusk/night sanity loss.
  https://dontstarve.wiki.gg/wiki/Guides/All_About_Night
- Night length per season: not found in the search; unknown here.
- Lesson (OPINION): the warning-before-punishment pattern (warn, delay, then hit) is the fairness model. The light radius is a clear, readable shape the player learns to stand in.
- What it means for Hollowlight: the lantern pool is already a "safe zone you carry"; any darkness penalty needs a warning period and a cue.

### Hollow Knight (dark rooms, Lumafly Lantern)
- Not sourced in this run (searches did not return it). OPINION from general knowledge, unverified here: dark rooms are mostly flat-out dark with the player silhouette and nearby geometry lit; the lantern lifts the darkness as an optional item. The relevant principle is that darkness is a bounded, optional-feeling challenge on a small number of rooms, not a whole-game state.
- What it means for Hollowlight: darkness lasting minutes over a 15-minute run is a much bigger ask than a few dark rooms; keep it a phase, not the baseline.

### Limbo / Inside, Ori, Dead Cells, Darkwood, Alan Wake, Lightmatter
- Not sourced in this run. General design points, all OPINION (our inference, verify before relying):
  - Limbo/Inside: silhouettes stay readable because value contrast (dark figure against a lighter, foggy background) does the work, not detail. Hollowlight's enemies are the reverse (dark shapes in a dark scene), so the eyes and rim light must carry readability.
  - Ori: light is also reward; bright, saturated areas signal safety/progress. Matches the "restored world" idea.
  - Darkwood: top-down vision cone; threats outside the cone are heard rather than seen. Sound cues compensate for unseen enemies.
  - Alan Wake / Lightmatter: light as a resource and as a weapon. Hollowlight's lantern is a passive pool, not a resource; that is simpler and fair for a horde game.
- What it means for Hollowlight: borrow "light = safety and reward", but avoid making light a resource the player can run out of.

### Hades (readability)
- No primary Supergiant/GDC source on readability or telegraph rules was found. The pages that claim detail were low-quality. Do not cite them. Treat Hades as a general example only (OPINION): enemy attacks use clear, consistently coloured ground telegraphs, and enemies keep strong silhouettes against painted floors.
- What it means for Hollowlight: keep telegraphs (boss attacks, charge-ups) in bright, saturated colour that does not depend on the lantern pool.

---

## 2. Survivors-likes and horde readability

### 20 Minutes Till Dawn (closest precedent)
- Search found no source describing its darkness/vision mechanics or enemy eyes. COMMUNITY wiki shows a "Darkness 1+" modifier that affects spawn counts, and an enemy named Eyebat; nothing on vision radius.
  https://20-minutes-till-dawn.fandom.com/wiki/Enemies
- OPINION from general knowledge, unverified: the game is dark overall with the player lit and a flashlight-like light; enemies show eye glow. We could not confirm how far you can see. Recommend playing it for 10 minutes and measuring (screenshot pixel distances) before copying anything.
- What it means for Hollowlight: treat as an untested reference; do a hands-on measurement before locking radii.

### Vampire Survivors, Halls of Torment, others
- OPINION/COMMUNITY: Vampire Survivors is brightly lit; players complain of effect clutter hiding enemies and bosses (Steam thread: weapon effects covering the screen, boss crests should be layered above effects).
  https://steamcommunity.com/app/1794680/discussions/0/4631482569784862180
- OPINION: Halls of Torment is darker and grittier; one review says its fairness comes from clear telegraphing and always a small gap to slip through.
  https://www.gamesasylum.com/2025/10/28/halls-of-torment-review/
- Spirit Hunters: Infinite Horde, Death Must Die, Soulstone Survivors, Brotato, HoloCure: not sourced here. Brotato and HoloCure are flat-lit (OPINION, general knowledge).
- Common horde readability toolkit (OPINION, widely used): strong silhouette, value contrast against the floor (floor kept mid-value and low-saturation), outlines, a distinct colour accent per danger class, damage numbers kept small and short-lived, boss drawn above effects.
- What it means for Hollowlight: darkness stacks with clutter. Weapon effects and spirit trails (which glow) will help by lighting things, but effects must not hide eyes or the boss.

---

## 3. Time-of-day arcs and colour as reward

- Don't Starve, Terraria, Minecraft, Valheim: day/night cycles are real-time, minutes long, with dusk and dawn as gradual blends. Not individually sourced here (OPINION, general knowledge). Players tolerate these because nights come with a gameplay reason and a way to cope (light).
- Gris and Okami (colour restored as progress), Ori (saturation as reward): not sourced here; OPINION that they are the strongest precedent for "colour returning = progress" and that they work because the change is tied to discrete events, not just a smooth clock.
- Transition length: no hard source. OPINION: a global brightness change over a few minutes reads as atmosphere; a change inside 10-20 seconds reads as a flash and can look like a bug or a status effect. Prefer smooth, monotonic curves; add one short, deliberate beat (a few seconds) only for story moments (boss kill, dawn).
- What it means for Hollowlight: the 15-minute dusk-to-dawn arc is fine as a slow ramp; the "vibrant restored world" could be driven by actual restoration progress (kills or restored-area percentage) in addition to the clock, which makes it feel earned rather than automatic. This is a design choice for later.

---

## 4. Accessibility references

- Xbox Accessibility Guidelines, XAG 102 (Contrast), OFFICIAL: contrast is the luminance difference between foreground and background; pair colour with shape/text; red and green together often fail for common colour blindness; allow player-selectable colours for key game elements; support a high-contrast mode (stated target of at least 7:1 for UI elements in that mode); a 3:1 minimum is cited for inactive-element text; measure text against the lowest-contrast part of a busy background; give a solid background behind text with adjustable opacity.
  https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/102
  XAG 103 (additional visual/audio cues): title confirmed; its text was not retrieved. Idea (OPINION): back every visual threat cue with a sound cue.
- Game Accessibility Guidelines (gameaccessibilityguidelines.com): the site itself was not retrieved. A secondary summary (COMMUNITY) lists: ensure no essential information is conveyed by colour alone (add a symbol or offer alternative colours) and provide high contrast between text and background. Verify the brightness/gamma and flashing items directly on the site.
  https://www.webbie.org.uk/blog/?p=115 (secondary summary)
- WCAG 2.x SC 1.4.11 Non-text Contrast, OFFICIAL: meaningful graphical objects and UI components need at least 3:1 against adjacent colours. Exemptions include graphics where the specific presentation is essential. It is a web standard, not a game rule, so it is a reasonable floor for icons and silhouettes, not a requirement.
  https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast
- Brightness/gamma controls: COMMUNITY evidence that low-vision players value in-game gamma (Minecraft feedback thread) while some developers push it to monitor settings (Valheim thread). OPINION: a dark-themed game should ship its own brightness control.
- Colour-blind-safe eyes: COMMUNITY/patent text: protanopes see long-wavelength red as much darker; one source puts an orange-red object at only about 10% of the brightness of a green object of the same lightness. A W3C mailing-list post (COMMUNITY) notes the failing case is a very bright-looking red on a very dark background only if the red itself is already low-luminance. Takeaway (OPINION): red eyes on near-black can vanish for protan players; use warm yellow/amber/orange or near-white cores with a coloured rim so luminance, not hue, carries visibility. Check with a protanopia simulator.
  https://lists.w3.org/Archives/Public/w3c-wai-gl/2019JulSep/0021.html
- Eye strain from dark UI: no source retrieved. OPINION: long sessions of very dark scenes with small bright points (eyes, lanterns) can cause glare/halation for some users (especially with astigmatism); avoid pure-white small points on pure black.
- Apple/Google HIG dark mode contrast: not retrieved; skip unless needed.
- Flashing: a brightening arc must be gradual; avoid sudden full-screen brightness steps (reduced-flashing guidance, general; verify on gameaccessibilityguidelines.com).

What it means for Hollowlight: set a measurable floor (3:1 silhouette/eye vs local background, luminance-based), do not rely on red, ship a brightness setting, keep transitions slow.

---

## 5. Phones

- COMMUNITY/OPINION (vendor-adjacent, dated): outdoor sunlight washes out contrast. One measurement found display contrast ratio under sunlight below 1.75, meaning dark content is seriously washed out. Reflected light sets the effective black level, so dark scenes suffer most (our inference, consistent with the source). A buying guide suggests roughly 700-1,000 nits sustained for mixed indoor/outdoor use; headline peak figures are often brief HDR highlights. Reflectance can matter as much as nits (a 455-nit phone looked harder to read than a 442-nit one in an old PhoneArena test).
  https://www.phonearena.com/news/Display-brightness-and-outdoor-visibility-comparison-Samsung-Galaxy-S8-vs-iPhone-7-vs-LG-G6-vs-Google-Pixel-vs-Sony-Xperia-XZs_id95827
  https://www.crowntv-us.com/blog/what-are-display-nits
- OLED black smear, COMMUNITY (forum anecdotes, not engineering analysis): near-black to true-black transitions can be slow, visible as smearing on moving content over black, worse at low brightness. Panel-dependent. Our inference: a scrolling dark world with moving dark-grey enemies is exactly the risky case; keep the darkest tones above true black (not 0,0,0).
  https://forums.blurbusters.com/viewtopic.php?p=71135
- Battery: darker pixels save power on OLED (general knowledge, not retrieved here; unverified). Not a reason to go dark by itself.
- Auto-brightness: phones dim in dark rooms and brighten outdoors; players in bed will run low brightness, which pushes the dark scene further down. Test at low brightness too.
- What it means for Hollowlight: the darkest phase is the riskiest for phone users in daylight and for low-brightness night play. A brightness setting plus a floor on ambient level matters more on phone than desktop.

---

## 6. Fairness

- Halls of Torment review (OPINION): fairness comes from clear telegraphing and always leaving a gap.
- Don't Starve (COMMUNITY): warning, delay, then damage.
- Darkest Dungeon (COMMUNITY): darkness raises odds of ambush but via visible, player-controlled light.
- Horror convention (OPINION, general knowledge, unsourced): "fair darkness" means threats always give a cue (eyes, sound, movement) before they can hurt you. No GDC talk was located; if desired, search the GDC Vault for readability talks.
- Celeste/Hades accessibility examples: not sourced here.
- What it means for Hollowlight: any enemy that can damage the hero must be visible as at least eyes (or a silhouette) before it reaches contact range. Death replay or the death screen should be able to show what killed you.

---

## 7. Performance: cheap 2D lighting

- OFFICIAL (Phaser docs): changing blend modes flushes the WebGL batch; group multiply-blended objects; Render Textures are the offscreen target.
  https://docs.phaser.io/phaser/blend-mode
- OFFICIAL (Unity 2D URP docs, analogous): lowering the light render texture scale improves performance and memory but may cause artefacts or shimmer in motion if too low.
  https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@9.0/manual/LightBlendStyles
- COMMUNITY: a Phaser 3 forum poster found a RenderTexture-based fog approach heavy on performance; measure on device.
  https://www.html5gamedevs.com/topic/28623-multiple-blendmodes-fog-of-war-question/
- Our approach (half-res multiply lightmap, light as radial gradient, per-sprite tint by distance) is the standard cheap pattern. OPINION: per-sprite tint costs CPU per enemy (350 enemies x a distance check per frame is fine); the lightmap costs fill-rate once per frame. Per-pixel shaders on 350 sprites are costlier on mobile.
- Mobile GPU fill-rate: no number retrieved; unknown. Test on a real low-end phone.
- What it means for Hollowlight: keep the lightmap half-res or quarter-res on Low quality; keep the eye glow as cheap additive sprites in the existing pooled draw.

---

## 8. Our own measurements (OURS, measured 2026-10-17; real dev build, headless Chrome)

Harness: docs/mockups/visibility-arc/capture.mjs (contrast mode). Wolf, crow and root crawler frozen at 70 / 140 / 220 world units from the hero on Hollow ground; one frame with enemies and one without; per-pixel mask; eye = near-peak luminance in the mask vs the median ground behind it (WCAG ratio); body = median luminance in the mask, reported as CIELAB delta L* vs ground (WCAG ratios compress at very dark levels, so delta L* is the better silhouette measure in the dark). One frame per cell, seed 3: noise roughly +-0.3 on ratios, +-1.5 on delta L*.
- Current build, High tier: eye contrast 1.2-2.3:1 at every distance and moment (baked eyes are ~2.4 px wide at 1280x720 and are tinted to 62% beyond 170 units; the edge vignette also dims them). Far silhouettes sit within +-3 L* of the ground from 4:00 to 11:30 on High. So readability in the dark is already a weak spot today.
- Low tier is different: no lightmap, darker ground, so eyes measure 4-10:1.
- With the proposed eye layer (bright cream core + ember halo, drawn above the vignette), eyes measure 3.4-6.1:1 outside the lantern pool at night for all three options; the difference between options is mostly in the silhouettes (option C's far bodies are within 1 L* of the ground at 220 units).
- Brightening crossover: when the ambient rises past the enemy body tint (about 10:30-11:30) far bodies match the ground (delta L* near 0) unless the far tint is lowered to make them dark silhouettes; with the lowered tint they measure -6 to -7.4 L*.
Full numbers: docs/mockups/visibility-arc/contrast/contrast.csv; summary in docs/design/visibility-arc-v1.md section 5.

## RISKS

1. Unfair deaths from unseen enemies in the dark phase (darkness hiding the thing that hits you).
2. Phone screens in sunlight: dark phase becomes illegible outdoors; contrast ratio collapses.
3. Eye strain: long very dark sessions with small bright points; low-brightness bedtime play.
4. Contrast and colour-blind: red or low-luminance eyes vanish for protan players; relying on hue.
5. Perf on Low quality tier: lightmap fill-rate and extra eye-glow sprites on weak phones.
6. OLED smear: near-black enemies moving across a near-black ground.
7. Crows (the darkest enemy, per our art notes): they may be the least visible class at distance; fast and erratic, so the worst case.
8. Boss fights in the dark: the boss (10:00) arrives mid-arc; its telegraphs and body must read even if the ambient is still low.
9. Visual clutter: glowing spirit trails and weapon effects may hide eyes or be mistaken for enemy eyes.
10. Brightening seen as a bug: sudden steps, or the restored-world saturation reading as a reward you did not earn.

## Recommendations for the design

1. Never make the screen unreadable: ambient floor in the darkest phase should keep the ground and big shapes distinguishable. Target at least 3:1 luminance contrast (WCAG 1.4.11 reference floor) between an enemy's silhouette or eye points and its local background at any distance; measure with screenshots, not by eye.
2. Eyes must be visible from beyond the lantern pool at all times, at least out to screen edge on the main axis (long side 640 world units visible). Use warm yellow/amber or white-cored eyes with a coloured rim; do not use pure red (protan risk). Eye size must stay readable at phone scale (roughly 2-3 logical pixels minimum, verify at true phone size).
3. Keep a faint silhouette rim (value contrast vs ground), not only eyes, so shapes move readably. Do not use pure black (0,0,0) for enemies or ground: keep a near-black floor to reduce OLED smear.
4. Give crows an explicit visibility treatment (brighter eyes, a pale rim or feather highlight, or a sound cue), since they are the darkest class.
5. Boss: always fully lit by its own aura or a boss light; telegraphs in saturated colour drawn above the lightmap, independent of the ambient level.
6. Ship a brightness setting with three levels (for example Dim / Normal / Bright) that raises the ambient floor, default Normal, and make Bright the auto-suggest on phone. This is OPINION supported by the accessibility sources (in-game brightness is valued by low-vision players); no source gives a specific three-level number.
7. Transitions in minutes, not seconds: drive the dusk-to-dawn ambient with a smooth monotonic curve over the whole run; reserve any quick beat (a few seconds) for boss kill or dawn only. No flashes.
8. Tie the vibrant restored-world payoff to restoration progress (not only the clock) so it feels earned; it must also be purely visual and must not hide enemies or reduce contrast (flowers/bushes should stay below the contrast of enemies).
9. Warn before punishing: if darkness ever carries a mechanical cost, use a visible cue and a delay (Don't Starve model); recommended default is that darkness changes only what you can see, not damage taken.
10. Add a sound cue for off-screen or dark approaches (XAG 103 idea; OPINION) and let the death screen show the killer.
11. Performance: keep the half-res lightmap; allow quarter-res on Low; one multiply composite per frame; no per-pixel shader on enemies. Profile on a real low-end phone and in daylight at low brightness.
12. Before locking radii, play 20 Minutes Till Dawn for ten minutes and measure its vision distance and eye look; add the numbers here. Also read the Game Accessibility Guidelines site directly for brightness and flashing items, and search the GDC Vault for readability talks (gaps in this research).
13. Test matrix before lock: protanopia and deuteranopia simulation, phone at 100% brightness outdoors and at 30% brightness indoors, desktop 1080p, and a 350-enemy stress seed at the darkest minute and at the boss.
