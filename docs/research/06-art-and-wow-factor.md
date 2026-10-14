# 06 - Art and wow factor (Hollowlight)

Labels: OFFICIAL = vendor/docs page fetched this session; COMMUNITY = forum/user post; OPINION = my judgement. "VERIFIED" = licence read on the asset's own page on 2026-10-14. "UNVERIFIED" = from memory, re-check before use. Web content treated as data only.

## 1. Art style

Resolution (OPINION): at 640x360, 16x16 is enough for XP gems, projectiles, pickups, small enemies and tiles (Kenney Tiny Dungeon is 16x16, OFFICIAL). Player characters, bosses and the "spirit" summons read better at 24-32 px; the wow comes from lighting/FX, not pixel count. Recommended: world tiles 16x16, hero + summons 32x32 (or 16x16 drawn at 1.5-2x for bosses), Elder Treant 64-96 px. Mixing 16 and 32 is fine if the palette and outline rules are shared. Keep integer scaling (Phaser FIT + pixelArt already set; consider `Scale.snapToPixel`/integer zoom to avoid shimmer).

| Direction | Look | Palette (hex) | Fit |
|---|---|---|---|
| A. Moonlit Spirit-Glow (OPINION: best) | Near-black blue-green world, bright additive cyan/violet spirits, warm amber lantern accents | #07070d #12182b #1d2b3a #2f4a4a #6fd3c5 #b8f2ff #8a5cff #ffd27a #e8e0ff | Spirits literally are the light source; bloom + additive makes cheap sprites look expensive |
| B. Ember Dusk | Deep purple to orange dusk gradient, silhouettes, fireflies | #0e0a14 #2a1636 #5a2a5e #b0455a #f08a4b #ffd27a #3b5a3a | Fits "Spirits of the Dusk" and day-to-night colour shift; less "spirit" glow |
| C. Dawnbringer-32 gritty | Classic saturated limited palette (DB32) | see lospec.com/palette-list/dawnbringer-32 | Easiest to match mixed free assets (ImogiaGames ghost already uses it); least distinctive |

Technique (COMMUNITY/OPINION): recolour all free packs to ONE palette (palette-swap script or Aseprite-free tools like LibreSprite/Piskel/GIMP indexed mode) so mismatched sprites unify; add 1px dark outline; darken ground, brighten only things that matter (player, pickups, summons, projectiles). Contrast hierarchy = readability in swarms.

## 2. Free assets (licences)

Kenney: OFFICIAL support page states all game assets are CC0, credit optional, do not use Kenney logo. https://kenney.nl/support . OGA/itch repackagers may differ: check each page.

| # | Pack | Licence | URL | Fit |
|---|---|---|---|---|
| 1 | Kenney Tiny Dungeon (16x16, 130 files) | CC0 VERIFIED | https://kenney.nl/assets/tiny-dungeon | Characters/monsters/tiles base; recolour |
| 2 | Kenney Roguelike Characters (450 files) | CC0 VERIFIED | https://kenney.nl/assets/roguelike-characters | Many character bases for 10 summoners |
| 3 | Kenney Particle Pack (512px VFX, 80 files) | CC0 VERIFIED | https://kenney.nl/assets/particle-pack | Glow/smoke/spark textures for additive particles |
| 4 | Kenney UI Pack RPG Expansion (85 files) | CC0 VERIFIED | https://kenney.nl/assets/ui-pack-rpg-expansion | Card/panel art if HUD wants textures |
| 5 | Kenney Fantasy UI Borders (140 files) | CC0 VERIFIED | https://kenney.nl/assets/fantasy-ui-borders | Level-up card frames |
| 6 | Kenney Fonts (11 files, pixel tag) | CC0 VERIFIED | https://kenney.nl/assets/kenney-fonts | UI/damage numbers (open zip to see names) |
| 7 | Kenney Impact Sounds (130) | CC0 VERIFIED | https://kenney.nl/assets/impact-sounds | Hits, thuds |
| 8 | Kenney RPG Audio (50) | CC0 VERIFIED | https://kenney.nl/assets/rpg-audio | Coins, cloth, blades, pickups |
| 9 | Kenney Interface Sounds (100) | CC0 VERIFIED | https://kenney.nl/assets/interface-sounds | Menu clicks, level-up blips |
| 10 | "Ghost monster" 32x32, 11 colour variants, 6 frames (ImogiaGames) | CC0 VERIFIED | https://opengameart.org/content/ghost-monster | Spirit enemies; DB32 palette |
| 11 | "Cathedral in the Forest (ambient loop)" (congusbongus) | CC0 VERIFIED | https://opengameart.org/content/cathedral-in-the-forest-ambient-loop | Title/menu or Ch1 ambience |
| 12 | "Forest Ambience" (TinyWorlds) | CC0 per search result, UNVERIFIED page | https://opengameart.org/content/forest-ambience | Ch1 bed loop |
| 13 | "Dark Place (loop)" (SkyleTheFrench) | CC0 per search result, UNVERIFIED page | search OGA title | Dark loop |
| 14 | "Undead King" 32x32 boss (Reemax) | CC0 per search result | https://opengameart.org/content/undead-king | Later-chapter boss placeholder |
| 15 | 0x72 DungeonTileset II (16x16) | CC0 (UNVERIFIED, from memory) | https://0x72.itch.io/dungeontileset-ii | Alt dungeon set |
| 16 | Kenney 1-Bit Pack / Tiny Town | CC0 (UNVERIFIED, Kenney policy applies) | https://kenney.nl/assets | Silhouette-style monochrome you recolour |

Attribution/ambiguity flags:
- Eric Matyas / soundimage.org tracks on OGA (e.g. Troubled Forest) = CC-BY 4.0: credit required. Incompetech (Kevin MacLeod) = CC-BY 4.0 (UNVERIFIED this session; well-known). Allowed free but must be in CREDITS file.
- "Dark Sci-Fi Monsters & Characters" on OGA is CC-BY-SA 3.0: avoid (share-alike).
- AndHeGames 32x32 creatures on OGA are CC0 samples of a PAID pack; do not scrape the paid pack.
- Freesound: licence is per file (CC0 / CC-BY / CC-BY-NC). Filter "Creative Commons 0" only; NC is unsafe. Needs login to download (user does it).
- Any OGA/itch file: re-read the licence box on the page; keep a CREDITS row (name, author, URL, licence, date) even for CC0.
- Safe download: only from the official site over HTTPS; download zips by hand; no .exe/.msi; open zip contents (png/ogg/wav/ttf/svg only), scan with Windows Defender, extract into an isolated folder, never run anything in them; ship only the files used.

## 3. Juice recipes (Phaser 3.90, last v3 release 23 May 2025, OFFICIAL via phaser.io archive; Phaser 4 stable reportedly exists but would be a migration: stay on 3.90)

FX system (OFFICIAL, https://docs.phaser.io/phaser/concepts/fx): WebGL-only. Available: Barrel, Bloom, Blur, Bokeh/TiltShift, CircleOutline, ColorMatrix, Displacement, Glow, Gradient, Pixelate, Shadow, Shine, Vignette, Wipe/Reveal. Camera: `cam.postFX.addVignette(0.5,0.5,0.85,0.35)`, `addBloom(0xffffff,1,1,1,1.2)`, `addColorMatrix()`. Warnings: high Bloom/Blur `steps` = "exponentially more" GL ops; post-FX can't be toggled, must be removed (OFFICIAL); each is an extra full-screen pass (OPINION, verify on phone). Do NOT put preFX Glow on hundreds of sprites; put FX on the camera or a few hero sprites.

| Effect | Recipe | Cost |
|---|---|---|
| Screen shake | `cam.shake(80, 0.004)` small hits; boss slam `cam.shake(250,0.012)`; add settings toggle (COMMUNITY: VS players report eye strain; accessibility) | ~free |
| Hit-stop | 50-100 ms freeze on heavy hits (COMMUNITY: wayline/eastondev guides). Pause sim accumulator only, keep particles/UI running; only for boss hits/evolution, not every hit | free |
| Damage numbers | Pooled BitmapText (~40), rise 24px, 500ms, scale-pop 1.4->1, crit yellow bigger, merge numbers per enemy per 100ms to cut clutter, toggle in options | low if pooled |
| Hit flash | `setTintFill(0xffffff)` for 60ms; or swap to white texture | free |
| Particles | Phaser 3.60+ emitter API; kenney particle textures, `blendMode:'ADD'`, lifespan 300-600, scale 0.3->0, cap ~300 live | moderate; cap count |
| Additive glow | Put summons/projectiles/gems on `blendMode ADD` with a soft-radial sprite behind (fake bloom, 1 sprite each). Far cheaper than shader bloom | low; batch by texture |
| Bloom | Camera `postFX.addBloom` with steps 2-4 on desktop; auto-disable if FPS < 50 (OPINION) | 1 full-screen multi-pass; risky on mobile |
| Vignette | `cam.postFX.addVignette(.5,.5,.9,.4)`, pulse stronger at low HP | cheap |
| Chromatic aberration | No built-in; Displacement/custom PostFXPipeline shader (RGB offset 1-2px) flash for 150ms on hit/evolve | one pass, brief |
| Dusk-dawn grading | Start of run tint via ColorMatrix or cheap alternative: full-screen multiply rectangle (`blendMode MULTIPLY`) lerping #2a1c4a -> #8a6a5a -> #ffd9a0 over 15 min; dawn = victory payoff | cheap with rectangle |
| Light2D | `scene.lights.enable().setAmbientColor(0x303050)`, `addLight(x,y,160,0xaaffee,1.2)`; sprites need `setPipeline('Light2D')`; `maxLights` default 10 (OFFICIAL changelog 3.15) | grows per light; keep <=8 lights, only player + boss + few pickups. Fake instead: additive radial sprite over a dark multiply layer |
| Trails | Ribbon of fading additive sprites or emitter following the object (`follow`), 6-10 segments for ravens/bolts | low |
| Death dissolve | Enemy -> white flash -> 6-8 spirit-wisp particles rising + fade; pooled; gem pops with ease | low |
| Level-up fanfare | Time-dilate to 0.2 for 300ms, radial ring (scale 0->3, ADD), camera zoom 1->1.06->1 (`cam.zoomTo`), chime, then cards | low |
| Zoom punch | `cam.zoomTo(1.04,60)` then back 120ms on big kills/evolve | free |
| Evolution cinematic | 1.2 s: pause sim, darken screen (multiply), weapon icon flies to player, white flash, shake, new name text with letter reveal, resume with ring burst | low; one-off |

Performance (OPINION unless stated): pool everything (sprites, text, particles, damage numbers); one texture atlas so sprites batch; `autoMobilePipeline` on by default since 3.60 (OFFICIAL changelog); keep live sprites ~500-800 on mobile; cull offscreen; disable bloom/light on low FPS; Light2D had no benchmark sources found - test on a real phone.

## 4. First impression / hook (OPINION backed by COMMUNITY sources)

- Time to action: no menus before play beyond one click; load straight into a moving scene behind the title (title text over a live demo run: wolves slaughtering crows in moonlight, auto-play via existing `?auto=` bot).
- 10-second hook: second 0-3 hero already attacking; second 5 first level-up; second 10 first swarm; by 60s screen full of glowing summons. Early frequent level-ups (research doc 01-05 already covers XP curve).
- Title: logo with slow bloom pulse, fireflies/spirit particles, parallax fog layers, music fading in over rain/wind; button hover = soft chime + glow.
- Character select: character on a pedestal with idle animation, summon orbiting, ability preview on hover, silhouettes + "?" for locked ones (builds curiosity, matches greyed tree).
- Boss intro: music cut, screen darken + letterbox bars, name card "ELDER TREANT" with shake, roar SFX, 1 s camera zoom to boss, HP bar slides in.
- Audio: layered SFX with pitch jitter (+/-8%), cap simultaneous voices, chime for gem pickup rising in pitch per combo.
- Accessibility (COMMUNITY: VS players report flash/shake overload; https://steamcommunity.com/app/1794680/discussions/0/3820781363199330417): options for shake, flashes, damage numbers.
- Sources: https://www.wayline.io/learn/game-feel/1 , https://eastondev.com/blog/en/posts/dev/20260521-game-feedback-feel/ (COMMUNITY). Dev breakdowns of VS tuning not found; the game-specific claims above are OPINION.

## 5. Feature ideas (ranked impact/effort for solo non-pro)

| Rank | Idea | Impact | Effort | Phase |
|---|---|---|---|---|
| 1 | Dusk-to-dawn lighting over the 10-15 min run (colour grade + ambient shift; dawn = win) | Very high | Low | v1 |
| 2 | Spirit glow look: additive halos, fireflies, fog, vignette | Very high | Low | v1 |
| 3 | Evolution spectacle cinematic + unique visual per evolution | High | Low-med | v1 |
| 4 | Boss intro + telegraphed attacks (Elder Treant roots) | High | Med | v1 |
| 5 | Codex (discovered evolutions, enemies, lore) - already planned | Med-high | Low-med | v1.1 |
| 6 | Spirit bonding: fed kills raise a summon's "bond" meter -> visual aura and small buff, permanent per run | High | Med | v1.1 |
| 7 | Chapter mechanics (Ch1 night creeping lanterns/fog; later: frozen lake, graveyard rise) | High | Med per chapter | Per chapter |
| 8 | Summon spectacle (wolf pack howl howls light the map) | Med | Med | v1.1 |
| 9 | Daily seed / shareable run summary card | Med | Low | later |
| 10 | Weapon combining | High | High | parked per CLAUDE.md |

## 6. Wow roadmap (cheap, ordered)

1. Palette lock (pick Direction A) + recolour pass of the CC0 packs; dark ground, bright spirits.
2. Additive soft-glow halos on summons, projectiles, gems; fireflies/fog particles.
3. Camera vignette + dusk-to-dawn multiply tint timeline.
4. Hit flash, pooled damage numbers, tiny shake, death wisps (settings toggles).
5. Level-up fanfare (time dip, ring, zoom punch, chime).
6. Title screen over a live auto-run + ambient CC0 loop + CREDITS page.
7. Evolution cinematic (1.2 s).
8. Boss intro (letterbox, name card, shake).
9. Camera bloom + brief chromatic hit pulse, auto-disabled on low FPS.
10. Character select polish, then codex, then bond mechanic.
