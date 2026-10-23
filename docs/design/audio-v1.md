# Audio v1 design sheet (release gate item 14)

Status: LOCKED 2026-10-23 (all A). AU0 (engine) + AU1 (weapon / pickup / UI sounds) BUILT 2026-10-24 in src/audio/ (the brief's AU0 = section 9 AU1; AU1 = the play sounds of AU2 + AU3). Music, moments, enemies still to build.
Prototype (recommended options, playable, self-contained, no network, no files): `docs/mockups/audio/index.html` (click "Light the lantern", scrub the night, press the weapon buttons, run the horde test).
Builds on `docs/research/09-audio-and-music.md` (2026-10-14; not redone). Labels: OFFICIAL = vendor/standard page; COMMUNITY = forums, interviews, wikis, talks; OPINION = my judgement. No web pages were re-read for this sheet: anything below marked OFFICIAL/COMMUNITY is from prior knowledge and research 09, so treat it as "check before quoting".

## 0. What exists today
- No audio code at all: no Howler/Tone/WebAudio in `src/`; Phaser's built-in sound manager is unused (default config, so Phaser still creates an AudioContext at boot).
- Settings already store `musicVol` 0.7 and `sfxVol` 0.8 (src/save/schema.js, validated 0..1), sliders in steps of 5 on the Sound tab (src/ui/settings.js). LOCKED: audio settings are per DEVICE, not per profile (2026-10-15).
- Reserved cue names (LOCKED E9, AL-6): `evo_<id>` for all 15 evolutions, `dawn_chorus_1` (first light 8:30), `dawn_chorus_2` (the hush 10:00), `dawn_chorus_3` (flood 14:00 / victory).
- BIBLE has a "Sound-feel" column for every weapon and evolution, plus 3 scripted sound beats: evolution = "all sound drops to a single held note"; boss phase change = "music shifts down a key"; low HP = "heartbeat is the only sound under the music".
- LOCKED asset rule: code / AI / CC0 only, AI assets need licence + provenance checks; downloads need Matt's yes one by one (LAUNCH-CHECKLIST row 10). QUEUE P5 (older plan) assumed CC0 MP3s from Freesound; this sheet supersedes that plan only if Matt picks option A or C below.
- LOCKED conflict check: none found. Nothing in LOCKED fixes the music style or the source of sounds. The BIBLE beats above are kept by every option.

## 1. Research summary (how comparable games do it)
| Topic | Finding | Label |
|---|---|---|
| Horde hit spam | Vampire Survivors keeps hit/kill sounds tiny and lets them blur into a texture; the loud, memorable sounds are pickups (gem, chest, coin shower) and level-up. Players still often turn SFX down late in a run. | COMMUNITY |
| Horde hit spam | Brotato / Halls of Torment: hits are short and dry, kill sounds rate-limited; separate SFX and music sliders. | COMMUNITY |
| Voice limits | Standard middleware practice (FMOD/Wwise): a global voice cap, a per-event cap, a cooldown, and priority with "steal oldest" or "drop new". Values like 24-32 voices are typical for mobile. | COMMUNITY |
| Ducking | Big moments duck the rest of the mix (sidechain) for under a second; the mix should never go fully silent unless by design. | COMMUNITY |
| Adaptive music | Hades (Darren Korb): stems per track; layers (vocals, drums) enter or drop for combat vs calm and boss phases; middleware FMOD. | COMMUNITY |
| Adaptive music | Ori (Gareth Coker): music follows scripted moments (escape sequences, discoveries), heavy use of a recurring motif; Wwise. | COMMUNITY |
| Adaptive music | Hollow Knight (Christopher Larkin): area tracks built from layers that switch on and off as you move (e.g. Greenpath, the City); boss themes reuse area motifs. | COMMUNITY |
| Survivors music | Vampire Survivors: one composed loop per stage, no adaptive layers; boss/chest stingers. Spirit Hunters: per-stage loops, little adaptivity (not verified). | COMMUNITY / OPINION |
| Silence | Hollow Knight and Hades both use near-silence before boss entrances; contrast makes the hit land. | COMMUNITY |
| Web autoplay | Browsers start an AudioContext "suspended" until a user gesture; call `resume()` from a click/tap/key handler. | OFFICIAL (Chrome autoplay policy, MDN) |
| iOS | The ring/silent switch can mute Web Audio on iPhone; Safari 16.4+ `navigator.audioSession.type = 'playback'` changes that. Unlock from a direct tap. | COMMUNITY (needs a real-phone check) |
| Accessibility | Separate volume controls for music, effects (and voice); never rely on sound alone for important info; avoid sudden loud sounds; let players mute. | OFFICIAL (Game Accessibility Guidelines; Xbox Accessibility Guidelines audio section) |
| Accessibility | Low-HP heartbeats and alarms are a common complaint when they cannot be turned down. | COMMUNITY |

What this means for Hollowlight (OPINION): hits must be a soft texture, not the star; the stars are pickups, level-up, evolutions, the hush, the boss and the dawn. Adaptive layers by run time are cheap for us because our timeline is fixed (dusk 0:00, first light 8:30, hush/boss 10:00, dawn 14:00, victory 15:00) and already drives the visuals.

## 2. Decision 1: sound identity and how it is made
Identity line (all options): "a warm lantern in a grey wood". The Hollow is low, airy and colourless (wind, a drone, no melody); everything the player's spirits do is warm, wooden, glassy and in tune. As colour returns to the ground, music returns to the night. Cosy storybook, not horror: no screams, no metal, no gore.

| | A. Fully made in code (RECOMMENDED) | B. CC0 packs | C. Hybrid |
|---|---|---|---|
| What | Every sound and all music synthesised at runtime in plain Web Audio (oscillators, filtered noise, a code-made reverb), written by Claude, tuned to one key | Download CC0 sound packs (Kenney audio packs, OpenGameArt CC0, per-file CC0 on Freesound) and CC0 music loops; mix in our own manager | Code for music, UI, pickups, spells and moments; 3-6 CC0 organic sounds (wolf howl, raven caw, wood creak, bird call) where synthesis sounds flat |
| Looks/feels | One coherent, restrained palette; everything in key; "music box and lantern glass" | Realistic but mixed styles; hard to make it ONE identity; packs are widely used (generic risk) | Coherent plus a few real creature voices |
| Cost / size | 0 KB of audio files, ~15-25 KB code; zero dependencies | Each MP3 adds size to the single-file build (base64 +33%); 1-3 MB likely | ~100-300 KB for a few short clips |
| Licence / security | Nothing downloaded; nothing to credit beyond "made in code" | Each file needs a licence check, untrusted-download handling, CREDITS row and Matt's yes | Same as B but only a handful of files |
| Risk | Creature calls can sound synthetic; needs careful tuning by ear; CPU on old phones (budgeted below) | Generic; size; mood mismatch; Freesound needs Matt's login | Two pipelines; the real howl may stick out of the stylised mix |

Why A: our spirits are made of moonlight and ink, not real animals, so stylised calls fit better than real recordings; it is the only option that is fully free, has no downloads or licences, keeps the single-file build small and gives one unified sound. C stays as the fallback if Matt finds the synthetic howl/caw flat after playtesting (decide per sound later, each download asked separately). AI audio tools (Suno, ElevenLabs etc.): NOT used by default; would need provenance/licence review and Matt's yes.

## 3. Decision 2: music approach
Shared rules: one key family (D dorian at dusk, a tone lower and minor for the boss, D major at dawn); tempo 72 bpm; one 4-note lantern motif reused by level-up, card pick, evolution and victory so the player learns it.

| | M1. The night as music: adaptive layers on the run clock (RECOMMENDED, in the prototype) | M2. Three composed loops, crossfaded | M3. Soundscape first, music only for moments |
|---|---|---|---|
| How | Seven layers on the fixed timeline: Hollow drone (wind + low sines), Lantern pad (warm chord, filter opens as colour returns), Music box (sparse plucks), Pulse (soft drum), Heartbeat (hush only), Dawn bells, Birds. Layer gains follow the clock with slow ramps; chord changes on bar lines | Calm loop (0-5 min), night loop (5-10), boss loop, dawn loop; 2-3 s crossfades at fixed times | Wind, critters, the drone; no music in normal play; music swells only for the hush, boss, evolutions and the dawn |
| Arc | 0:00 grey: drone + muffled pad. 1:00 lantern pad warms. 1:30 music box. 4:00 pulse. 8:30 faint first-light bells (dawn_chorus_1). 9:45 the hush: everything falls to drone + heartbeat (dawn_chorus_2). 10:00 boss: down a tone, pulse on every beat, pad darkens. Boss dead: "last of the night". 14:00 dawn flood: shimmer rises into the first major chord, bells and birds, pulse lightens (dawn_chorus_3). 15:00 victory chord + bird burst | Same beats but as hard sections | Strong contrast; very cosy |
| Pros | Mirrors the visual arc exactly (IDENTITY: the Hollow drains, light returns); never loops audibly; tiny; procedural in code | Easiest to compose as "real tracks"; predictable | Cheapest CPU; most restrained |
| Cons | Generative music can feel aimless: needs a written motif and chord plan (done in the prototype) and taste tuning | Audible loop seams over 15 min; 4 tracks to write; less tied to the visuals | Long stretches feel empty in a horde game; less "premium" |

Boss phases (from the treant sheet): each phase change = 1 s near-silence + low boom + the pulse pattern gets denser (BIBLE beat "shifts down a key" happens at boss entry). Defeat: music falls to the drone and a single low pad chord (no sad jingle). Title / menus: the drone + pad only, the motif once when the lantern lights (BIBLE title beat). Swarm events (60/150/240/360/450/540/660 s): a 2 s low swell + distant crows before each, music unchanged.

## 4. Decision 3: sound language for play
| | L1. Tuned textures (RECOMMENDED, in the prototype) | L2. Everything is a note | L3. Quiet hits, loud moments |
|---|---|---|---|
| Hits | Short soft textures per weapon (filtered noise shapes: snaps, flutters, crackles), random pitch +-1.5 semitones and volume 0.85-1.0 | Every hit plays a pluck in the current chord (Rez/Lumines style) | One aggregated "bed" per weapon (volume by sqrt of hits per 80 ms), no individual hit sounds |
| Pickups, UI, moments | Tonal, in key, the lantern motif | Same | Same, louder |
| Pros | Readable per weapon, never harsh, in tune with the music | Very musical, unique | Calmest; lowest CPU |
| Cons | Needs the voice budget below | At 300 hits/s it turns into mush; weapons lose their identity | Weapons feel weightless; less feedback for summons |

### Per-weapon verbs (Lantern set art)
| Weapon (art) | Verb | Sound recipe (code) | Evolution sound rule (cue evo_<id>) |
|---|---|---|---|
| Ghost Wolves (Lantern-Heart Pack) | snap | two quick bandpass clicks (jaws) + a breathy low huff; pack spawn = soft pad "yip" glide | Lightfoot Pack: light padding taps along the trail; Howling Legion: chorus of detuned glides; The Alpha: one deep growl + crunch |
| Raven Flock (Letter Ravens) | flutter-peck | 3-4 fast paper-grain bursts + a tiny wooden tick; paper rustle on circle | Wall of Wings: wide rustle bed; Talon Mark: wax-seal "tock" on the mark; Spearhead: rising whistle then thud |
| Spirit Bolts (Ink Glyph Orb) | whisper-pop | rising breathy hiss on cast, small glassy pop + ink "plip" on hit | Spirit Tempest: 8 rapid whispers; Soul Lance: drawn-out shriek-thrum; Returning Pages: page flip there and back |
| Chain Lightning (Storm Thread) | crack | highpass crack + 3-4 crackle ticks per jump, tiny low buzz; one sound per chain, not per jump | Thunder Judgment: one rolling thunder for the volley; Static Storm: quiet tick bed inside the dome; Storm Tether: held taut hum while tethered |
| Holy Orbit (Candle Flames) | hush-flare | soft lowpass whoosh + ember ticks + faint candle hum | Vesper Tide: slow breathing swell; Sanctum Halo: soft choir-like pad while the ground is holy; Judgement Wheel: whoosh-bang then sparks tinkle back |
Hero abilities: Pack Howl = rising detuned howl-chord + low thump (in prototype); Sanctuary = bell toll + warm pad bloom. Enemies (husks, crows, root-crawlers, stoat piper, puffback toad, bramble hart, Branch-Mane, Elder Treant): dry, wooden, cool; only spawns of special enemies, Branch-Mane howl/charge tells and treant tells get sounds (tells must also be visual).

### Moments
- Gem: glassy note that climbs the major pentatonic when collected within 0.5 s (up to 10 steps), resets after a pause. Magnet: a rising sweep then the climb. Heart: warm three-note triad.
- Level-up: lantern motif (3 rising notes) + soft whoosh; ducks music to 0.55 for 0.6 s. Card pick = two notes of the motif; UI hover = a tiny tick.
- Evolution (BIBLE beat): everything drops to one held note (music 0.06, sfx 0.1) for 1.2 s, then a bright gold chord bloom; then its own evo_<id> verb. Calm: duck only to 0.4.
- Hurt: muffled low thud, small duck. Low HP: heartbeat under the music (own slider-respecting gain, Calm halves it, stops above 35% HP).
- Dawn victory flood: shimmer rising for 3 s into the first D major chord, bells cascade, bird burst (matches AL-6 flock), then music settles to pad + bells for the results screen.

### Voice budget and ducking (built into the prototype)
| Tier | Cues | Per-cue cap | Min gap | Over budget |
|---|---|---|---|---|
| T0 never dropped | level-up, evolution, ability, hurt, boss intro/phase, swarm warning, victory, dawn flood | 1 | 0.25-2 s | always plays, ducks others |
| T1 | storm crack, gem, heart, magnet, UI | 1-3 | 30-100 ms | dropped if 24 voices busy |
| T2 first to go | wolf snap, raven peck, glyph pop, candle flare, enemy death | 3 | 70-80 ms | rate-limited hits are folded into the next one (volume x sqrt(n), max 1.5x); dropped at cap |
Global cap 24 voices (Calm 12). Measured in the prototype horde test: about 1,200 requests in 3 s became 194 played, 854 folded, 159 dropped, peak 22 voices (under the 24 cap), no console errors.

| Duck | Music | SFX | Hold | Release |
|---|---|---|---|---|
| Level-up | 0.55 | 0.5 | 0.6 s | 0.5 s |
| Evolution | 0.06 (Calm 0.4) | 0.1 (Calm 0.4) | 1.4 s | 0.8 s |
| Ability | 0.6 | 0.6 | 0.5 s | 0.5 s |
| Hurt | 0.75 | 0.7 | 0.15 s | 0.3 s |
| Boss intro / phase | 0.2 | 0.6 | 1.2 s | 1 s |
| Victory | 1.0 | 0.3 | 4 s | 1 s |

## 5. Settings and accessibility
- Sound tab: Master (new), Music (existing `musicVol`), Sound effects (existing `sfxVol`), sliders mapped to gain with a square curve so steps feel even. New stored keys (validated 0..1 / bool in schema.js like the others): `masterVol` 0.8, `muted` false, `muteOnBlur` true, `calmSound` false. Per device (LOCKED).
- Mute key: M (keyboard first). Quiet when the tab is hidden or the window loses focus (on by default; pausing the game on blur already exists).
- Calm sound (separate toggle, defaults to follow Calm motion): voice cap 12, hits -3 dB, no deep duck on evolutions, pulse capped, fewer birds, heartbeat halved.
- Nothing important is sound-only: every tell already has a visual (LOCKED readability work). No sudden loud peaks: master compressor (-14 dB threshold, 4:1).
- Sliders preview: moving the SFX slider plays one gem note; Music slider is heard live (fixes the accepted A11 "sliders do nothing" note).

## 6. Performance and mobile budget
- Zero dependencies: plain Web Audio. Phaser's sound manager is switched off (`audio: { noAudio: true }`) so there is one AudioContext, ours, created on the first gesture (title "Play"/any key), resumed in the same handler.
- Budget: <= 24 active SFX voices (each 1-3 nodes), music <= ~30 live oscillators at a chord change; audio work on the main thread < 0.3 ms/frame for scheduling; scheduler = 25 ms timer with 150 ms look-ahead (not tied to frame rate, so frame drops do not stutter music). Low quality tier: music without the reverb send, birds off, voice cap 16.
- Code size target: audio module <= 25 KB unminified.
- Mobile: unlock on first tap; iOS silent switch handled via `navigator.audioSession` when present; suspend on `visibilitychange`; resume only after a gesture if the browser re-suspends. Real-phone test is Matt's (needs an iPhone/Android).
- Sim stays pure: the sim emits events it already has (hit, kill, pickup, level-up, evolve, ability, swarm, boss phase); a new `src/audio/` module listens in app.js/RunScene. Headless bots and sweeps are byte-identical (no audio in Node).

## 7. Fit and mechanical-sense checks
- Fit: warm, tuned, wooden/glassy sounds on a grey airy drone = the Warm Lantern on the grey Hollow; music colour returns as ground colour returns; dawn flood matches AL-6; gold = evolutions in art, the gold chord bloom in sound. Not generic dark fantasy (no choirs of doom, no horror stingers).
- Mechanical sense: the loudest sounds are the decisions and rewards (cards, evolutions, pickups), hits are a texture; tells are always visual first; Calm and sliders respect the player; no gameplay link to audio (no balance change, sweeps untouched).

## 8. Risks
| Risk | Mitigation |
|---|---|
| Synth sounds "cheap" or chiptune-like | Filtered noise + detune + reverb, slow envelopes; Matt's ear check per chunk; fallback C for named sounds |
| Generative music aimless or tiring over 15 min | Fixed chord plan, recurring motif, sparse density, clear sections tied to the clock |
| CPU on old phones | Voice caps, Low tier, measure in the perf check (frame time with audio on vs off) |
| iOS silent switch / unlock bugs | audioSession, gesture unlock, Matt's real-phone test |
| Hit fatigue late run | Folding + caps + Calm; SFX slider |
| Taste | Every chunk ends with Matt listening to the prototype or the build |

## 9. Build plan (small chunks, after Matt locks)
- AU1 Audio core: `src/audio/` manager (context on first gesture, buses master/music/sfx, duck, compressor, voice budget, Calm), settings keys + schema validation + tests, M key, mute on blur, Phaser `noAudio`. No sounds yet beyond a UI tick.
- AU2 UI + pickups: UI tick/pick, gem climb, heart, magnet, level-up motif, results; slider preview.
- AU3 Weapons: 5 weapon verbs wired to sim hit/cast events; horde check (voices, frame time).
- AU4 Music M1: 7 layers on the run clock, title/menu version, defeat ending; dawn_chorus_1..3.
- AU5 Moments: evolution beat + 15 evo_<id> verbs, abilities, hurt, low-HP heartbeat, swarm warning.
- AU6 Enemies + boss: special-enemy tells, Branch-Mane, Elder Treant entry/phases/death, critter and dawn birds.
- AU7 Verify: perf (desktop + phone tier), real-phone unlock (Matt), mix pass, security + fit report.
Each chunk: tests green, build OK, sweeps byte-identical (audio is outside the sim), npm audit, Matt listens.

## 10. Decisions for Matt (one-tap)
1. How sounds are made: A all in code (Recommended) / C code + a few CC0 creature sounds / B CC0 packs.
2. Music: M1 the night as adaptive layers (Recommended) / M2 three crossfaded loops / M3 soundscape, music only for moments.
3. Hit sounds: L1 tuned textures (Recommended) / L3 quiet hits, loud moments / L2 every hit is a note.
Defaults taken (reversible, override any): Master slider added; mute on blur on; M mutes; Calm sound follows Calm motion; key D; 72 bpm.

Security check: no downloads, no new dependencies, prototype is a single self-contained HTML file with no network calls, no untrusted input (innerHTML only on static strings), no secrets.
Fit check: warm tuned lantern sounds over a grey drone, music colour returning with the ground colour, dawn flood matching AL-6; no conflict with docs/LOCKED.md.
