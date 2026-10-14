# 09 - Audio and music research (Hollowlight)

Date: 2026-10-14. Labels: OFFICIAL = read on the vendor/author page this session; COMMUNITY = forum/FAQ/search snippet; OPINION = my design judgement (not sourced); UNVERIFIED = not read on the page, check before use. All web content treated as untrusted data. Nothing downloaded or installed.

## 1. Sound design for survivors-likes (all OPINION unless stated; no datamined sources were read)

### Clutter control
| Technique | Concrete setting for Hollowlight |
|---|---|
| Global voice cap | Max ~24 simultaneous SFX voices; hard cap per sound ID (hit 4, kill 3, gem pickup 3, wolf bite 3, lightning 2). When over cap, drop the new sound (or steal the oldest). |
| Rate limiting | Per-ID min gap: hit 40-60 ms, kill 50 ms, gem 30 ms (but see pitch-climb), lightning 100 ms. Implement as `lastPlayed[id]` timestamp check in the audio manager, not in Sim. |
| Aggregation | Hundreds of hits/sec: play ONE "hit" sound per weapon per ~80 ms window; scale volume by sqrt(hit count in window) instead of one sound per hit. |
| Pitch/volume variation | Random detune +/-150 cents (Phaser `detune`, Web Audio only) and volume 0.8-1.0 per play; 3-4 sample variants per sound, never repeat the last variant. Kills the machine-gun effect. |
| Priority tiers | T0 (never dropped): level-up, evolution, boss intro/death, player hurt, low-HP. T1: weapon fire/cast, pickups. T2: enemy hit/death, ambience one-shots. Over cap, drop T2 first. |
| Ducking | When T0 plays, drop SFX bus to 0.4 and music to 0.5 for 0.4-1.0 s (linear ramp), then restore. Keep a separate music bus and SFX bus (Phaser: manage via per-sound volume multipliers, or Web Audio GainNodes via `this.sound.context`). |
| Spectral separation | Enemy hits = short, dry, mid-high; player spells = tonal/airy; low end (wolf thump) reserved for big events. Cut high-pass below ~100 Hz on frequent sounds so mix does not mud. |
| Frequent sounds quiet | Hit/death -12 to -18 dB below level-up/evolution. Target loudness: SFX peak around -6 dBFS, music around -16 LUFS-ish, stingers louder by design. |

### Signature sounds
- Level-up: short rising 3-note chime + soft whoosh (0.8-1.2 s), ducks music; same motif as the "card pick" confirm so it becomes recognisable.
- Evolution: longer (2-3 s) swell + choir/pad + bright hit; briefly drop music to near-silence before the hit (anticipation), then music returns with an added layer. Must be audibly bigger than level-up.
- Pickup pitch-climb: gem pickups within 0.5 s of each other step the pitch up a pentatonic scale (up to +12 semitones, `detune` = 100 * step), reset after 0.6 s idle. Cheap, hugely satisfying. Cap volume so hundreds of gems stay soft.
- Boss intro: 1.5 s silence-ish cut (music fades to ambience), low drone + ground rumble + tree creak/roar, then boss track starts on a hit. Boss death: slow-mo-feel low boom, music stops, then victory jingle.
- Silence and stingers: use 2-3 s of near-silence before big beats; short stingers for swarm events (at 60/150/240/360/450/540/660 s per CLAUDE.md), a warning drone 2 s before each swarm.

### Reactive music
- Layered stems by run time, one track split into 3-4 synchronized loops (pad, rhythm, melody, percussion) of identical length; add layers by time/threat. Simplest robust approach: crossfade whole tracks at fixed times.
- Dusk-to-dawn mapping (15 min): 0-3 min calm forest ambience + pad (twilight); 3-8 min add rhythm/percussion; 8-10 min tension, drop to quiet before Elder Treant at 10:00; boss track 10:00+; after boss, victory/dawn theme with bright layer.
- Intensity driver: use `min(1, enemyCount / 250)` smoothed (lerp over 2 s), not instant, to avoid layer flapping; add a hysteresis band.
- Simplest v1: 3 tracks (calm loop, combat loop, boss loop) + 1 jingle; crossfade 2-3 s on time thresholds. Layered stems = phase 3.

## 2. Phaser 3 audio specifics

| Topic | Finding | Label |
|---|---|---|
| Web Audio vs HTML5 | Phaser uses Web Audio, HTML5 audio, or none by device support. Detune and pan only work in Web Audio; Web Audio may have lower latency. Force HTML5 with `audio:{disableWebAudio:true}` (do not; you need detune). | COMMUNITY https://github.com/samme/phaser3-faq/wiki/Sound |
| Unlock | Most browsers will not play until a click/tap. Phaser auto-resumes the AudioContext after first click/tap; check `sound.locked`. Chrome warning is normal. | COMMUNITY (same FAQ) |
| iOS Safari | Plays only from direct user-gesture calls; unlock context once, then it stays usable. Phaser changelog says audio again unlocks properly on iOS14+ from v3.60 (you are on 3.90, fine). Silent/ringer switch can mute Web Audio on iOS (reported). Headphone unplug on iOS 13 broke audio (old report). | COMMUNITY https://phaser.discourse.group/t/trying-to-solve-audio-drop-out-on-ios-13-safari-and-cordova/4582 ; https://app.unpkg.com/phaser@4.2.1/files/changelog/v3/3.60/Sound.md |
| Plan | Start button (title screen) = the gesture; call `this.sound.context.resume()` in it, start music from the same handler. Add visibilitychange handler to pause/resume music. Test on a real iPhone. | OPINION |
| Formats | FAQ: support at least MP3; Phaser picks the first supported file from the array and silently skips unsupported. Pass `['x.ogg','x.mp3']` or m4a. Ogg Vorbis support in iOS Safari is version-dependent: UNVERIFIED, so ship MP3 (or m4a/AAC) as the safe baseline for phones. | COMMUNITY + UNVERIFIED |
| Audio sprites | Combine many short SFX into one file (audiosprite tool), `load.audioSprite()` + `sound.playAudioSprite()`. Fewer requests; for a single inlined file it mainly saves base64 overhead per asset. Marker spacing needs ~0.1 s gaps to avoid bleed. | COMMUNITY (FAQ) |
| Same sound overlapping | `play()` on a playing sound restarts it; for overlap use `sound.play(key,config)` (fire-and-forget) rather than a single `sound.add()` instance. | COMMUNITY (FAQ) |
| Looping gaps | Not covered by sources read. OPINION: MP3 adds encoder padding gap; Ogg/WAV loop cleaner. Safest: trim loops to exact bar length, test loop point, if gap audible use Web Audio loop of decoded buffer (Phaser decodes into AudioBuffer, loops are sample-accurate for Ogg; MP3 priming silence is the usual culprit; m4a/AAC also has padding). Test in Chrome and Safari. | OPINION |
| Single-file build | vite-plugin-singlefile inlines assets as base64 = +33% size. Budget (OPINION): total audio under ~3 MB raw (~4 MB base64) so the HTML stays ~6 MB or less. SFX 25 x ~15-40 KB mono 22-44.1 kHz mp3 at 64-96 kbps = ~0.6 MB; music 2-3 tracks mono/joint-stereo 64-96 kbps, ~2 min each = ~1-1.5 MB each. Alternative: load audio as separate files next to index.html (GitHub Pages is fine) and keep inlined only code/art. | OPINION |
| Volume/mute persistence | Master/music/SFX sliders -> `localStorage` key in versioned settings (validate range 0..1 on load, per CLAUDE.md untrusted-input rule); apply on boot; mute toggle (M key) and pause-menu sliders. | OPINION |

## 3. Free, licence-safe sources (VERIFIED = licence field read on the page this session)

### Licence terms read
- Kenney: "Kenney's game assets are released under CC0 ... public domain"; credit optional, do not use the Kenney logo. OFFICIAL https://kenney.nl/support ; each asset page shows "Creative Commons CC0".
- Pixabay: allowed free use, no attribution needed, modify into new works; NOT allowed: sell/distribute Content on a Standalone basis (no creative effort applied), use in trademarks/logos, misleading/immoral use; page does not mention games/apps or Content ID; only the full terms (pixabay.com/service/terms/) are binding. OFFICIAL https://pixabay.com/service/license-summary/ . A game embedding a track as part of a work should be OK in spirit, but raw files must not be shipped as an extractable standalone pack, and Content ID is a known risk. Treat as secondary source; prefer CC0. Terms page itself UNVERIFIED.
- Incompetech (Kevin MacLeod, CC BY 4.0): required text per track: `"Title" Kevin MacLeod (incompetech.com) / Licensed under Creative Commons: By Attribution 4.0 / https://creativecommons.org/licenses/by/4.0/` ; credits must be findable (a Credits screen in settings is accepted); modifications allowed, state your changes. OFFICIAL https://incompetech.com/music/royalty-free/faq.html . Specific track pages not read: all incompetech track picks are UNVERIFIED.
- Freesound: CC0 / CC-BY / CC-BY-NC / Sampling+ (legacy). NC is not allowed here (check each file, game is free but keep it clean: avoid NC). CC-BY needs name, link, licence. Remixes cannot be relicensed more permissively than the source. OFFICIAL https://freesound.org/help/faq/ . Downloading needs a login (Matt's action, not mine).

### Named packs and tracks
| # | Name | Author | Licence (status) | URL | Size | Fit | Attribution |
|---|---|---|---|---|---|---|---|
| 1 | Impact Sounds (130 files) | Kenney | CC0 VERIFIED | https://kenney.nl/assets/impact-sounds | not listed | enemy hits, deaths, thumps, bone/wood/metal | optional |
| 2 | RPG Audio (50 files) | Kenney | CC0 VERIFIED | https://kenney.nl/assets/rpg-audio | not listed | cloth, coins, weapon, door, generic fantasy foley | optional |
| 3 | Interface Sounds (100 files) | Kenney | CC0 VERIFIED | https://kenney.nl/assets/interface-sounds | not listed | menu/card pick/click/confirm | optional |
| 4 | Music Jingles (85 files) | Kenney | CC0 VERIFIED | https://kenney.nl/assets/music-jingles | not listed | level-up, victory, game-over stingers (check mood: mostly bright; pick minor ones) | optional |
| 5 | UI Audio / Digital Audio / Sci-fi Sounds | Kenney | CC0 likely; UNVERIFIED (only listed on category page) | https://kenney.nl/assets/ui-audio ; /digital-audio ; /sci-fi-sounds | ? | UI, pickup bleeps, zaps (lightning) | optional |
| 6 | Cathedral in the forest (ambient loop) | congusbongus | CC0 VERIFIED | https://opengameart.org/content/cathedral-in-the-forest-ambient-loop | forest_2.ogg 2.9 MB | calm/dusk track 1, pads and bells | none needed; credit courteous |
| 7 | Basilisk Boss Battle Loop | beardalaxy | CC0 VERIFIED | https://opengameart.org/content/basilisk-boss-battle-loop | 657.5 KB ogg | cheap boss loop, small | none |
| 8 | Heavy Boss Battle 2 (bpm110, dark/melancholic) | MintoDog | CC0 VERIFIED | https://opengameart.org/content/heavy-boss-battle-2 | ogg 3.9 MB / mp3 5.2 MB | Elder Treant boss; big, may need trimming/re-encode | none |
| 9 | Heavy Boss Battle 1 (bpm200, metal/dark) | MintoDog | CC0 per search snippet only; UNVERIFIED | https://opengameart.org/content/heavy-boss-battle-1 (URL guessed from series; confirm via search) | ? | faster boss alt | none |
| 10 | Dark Cavern Ambient (2 files: fade + loop) | Paul Wortmann | CC0 VERIFIED | https://opengameart.org/content/dark-cavern-ambient | 2 x 1.7 MB ogg | under-layer drone, boss intro bed | none |
| 11 | Loopable Dungeon Ambience (dungeon_ambient_1.ogg) | JaggedStone | CC0 VERIFIED | https://opengameart.org/content/loopable-dungeon-ambience | 1.6 MB ogg | dark drone layer / tension phase | none |
| 12 | Magic Spell SFX (7 files) | JaggedStone | CC0 VERIFIED | https://opengameart.org/content/magic-spell-sfx | 37-79 KB each ogg | spirit bolts, holy orbit, level-up whoosh | none |
| 13 | Ghost Monster Voice Moaning & Growling | qubodup | CC0 VERIFIED (no wolf howl in it) | https://opengameart.org/content/ghost-monster-voice-moaning-growling | 4 MB zip | ghost moans, enemy spawn/boss growl, evolution choir (pitched down) | none |
| 14 | Monster Sound Effects Pack | Ogrebane | CC0 VERIFIED (contents unlisted; wolf not mentioned) | https://opengameart.org/content/monster-sound-effects-pack | 1.4 MB zip | grunts/pain/death for enemies | none |
| 15 | CC0 Sounds Library | ETTiNGRiNDER | page says "Sound effects under CC0" (no licence field; per-item check) | https://opengameart.org/content/cc0-sounds-library | ? | ghost breath, spells, hits, footsteps, heartbeat; no wolf found | none |
| 16 | Basic Spell Impacts (20 WAV: lightning/fire/ice/water) | lentikula (itch.io) | CC0 VERIFIED ("I release this pack under a CC0 license"), name-your-own-price (can be $0) | https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx | 13 MB zip (48k/24-bit WAV; compress before use) | Chain Lightning zaps, Frost Bell later | none |
| 17 | Fantasy Ambient Sound Effects Pack (CC0) | kmontesdev (itch.io) | CC0 per search snippet; UNVERIFIED on page; ~2 GB on Google Drive (too big, untrusted host; low priority) | https://kmontesdev.itch.io/fantasy-ambient-sound-effects-pack-cc0 | ~2 GB | wide fantasy set incl. monsters | check |
| 18 | Troubled Forest (looping) | Eric Matyas (soundimage.org) | CC-BY 4.0 VERIFIED | https://opengameart.org/content/troubled-forest-looping | mp3 1.9 MB / ogg 2.7 MB | on-theme forest tension track | REQUIRED: `"Troubled Forest" by Eric Matyas soundimage.org` (page text) |
| 19 | Creepy Forest (F) | OGA | listing shows OGA-BY 3.0 and CC0 per search snippet; UNVERIFIED | https://opengameart.org/ (search "creepy forest") | ? | eerie forest | if OGA-BY, attribution needed |
| 20 | Dark Place (loop) | SkyleTheFrench | CC0 per search snippet; UNVERIFIED on page | https://opengameart.org/ (search "Dark Place loop") | ~1.8 MB ogg | dark ambient bed | none |
| 21 | Ghost Voice Pack | Sorth | CC0 but commenter says voice-licence unclear; AVOID | https://opengameart.org/content/ghost-voice-pack | ? | - | - |
| 22 | Incompetech tracks (e.g. dark/ambient/boss) | Kevin MacLeod | CC BY 4.0 per FAQ; individual tracks not checked, UNVERIFIED | https://incompetech.com/music/royalty-free/ | varies | large dark-fantasy catalogue; fallback | REQUIRED text shown above |
| 23 | "Boss Battle (loop)" | Pro Sensory | CC0 per snippet, asks for credit; UNVERIFIED | https://opengameart.org/content/boss-battle-loop | ? | boss alt | requested |
| 24 | Pixabay music/SFX | various | Pixabay Content Licence (see terms above) | https://pixabay.com/music/ | varies | wolf howls, raven caws, big whooshes where CC0 lacks | none required; keep out of standalone distribution |

Gap notes: no verified CC0 wolf howl or raven caw yet. Search Freesound with the CC0 filter ("wolf howl", "raven caw", "crow") and read each file's licence field on its own page; avoid any with Sampling+/NC. Do not use the Pixabay file as a raw standalone download. Avoid any OGA file with a mixed-licence (e.g. the Determined Pursuit remix was reported as GPL 3.0; skip).

## 4. Free tools to make or modify audio

| Tool | Use | Licence / output | Label |
|---|---|---|---|
| jsfxr (sfxr in browser) https://sfxr.me | procedural bleeps, zaps, pickups, hits; export wav | sfxr is open source; generated sounds are yours to use, commonly treated as free for any use | COMMUNITY/UNVERIFIED (licence not re-read) |
| Audacity | trim, normalise, fade, pitch, convert, loop-point editing | GPL (software); your edited output is yours, upstream file licences still apply | UNVERIFIED (not re-read) |
| LMMS | compose tracks with free synths | GPL; your compositions are yours; check any bundled samples/presets licences before exporting | UNVERIFIED |
| BeepBox https://www.beepbox.co | quick chiptune/loop music in browser, exports wav/midi | MIT-style open source, output yours | UNVERIFIED |
| Bosca Ceoil | simple music maker | open source (MIT, per memory) | UNVERIFIED |
| ffmpeg (CLI) | batch convert to mp3/ogg, mono, loudnorm | LGPL/GPL software; output yours; install = Matt's decision | UNVERIFIED |
| audiosprite (npm) | build audio sprite + json | MIT per memory; adds a dev dependency, so run npm audit | UNVERIFIED |

Security note (OPINION): install any of these only from the official site; treat downloaded zips as untrusted; record every file in CREDITS.

## 5. Recommendation

### Minimal v1 set (~25 SFX + 3 music)
| Group | Sound | Source |
|---|---|---|
| Player | hurt, low-HP heartbeat, death, footstep (optional) | Kenney Impact; CC0 Sounds Library heartbeat; jsfxr |
| Pickups | gem (pitch-climb, 1 sample), heart, soul magnet, coin | Kenney RPG Audio/Interface; jsfxr |
| UI | card hover, card pick, reroll, banish, menu click, pause | Kenney Interface Sounds |
| Progression | level-up, evolution, boss intro, boss death, victory, defeat | Kenney Music Jingles (minor ones) + JaggedStone Magic Spell + qubodup ghost moan pitched down |
| Weapons | wolf bite/pounce, raven flap/caw, spirit bolt, chain lightning zap, holy orbit hum/tick | Freesound CC0 (wolf/raven) or Pixabay; lentikula spells; JaggedStone magic |
| Enemies | hit (3 variants), death (3), swarm warning, treant root slam | Kenney Impact; Ogrebane monster pack |
| Music | 1 calm/dusk loop: Cathedral in the Forest; 2 combat/tension loop: Dark Cavern Ambient or Dungeon Ambience under a rhythm loop (or Troubled Forest with attribution); 3 boss: Heavy Boss Battle 2 (trim) or Basilisk Boss Battle | OGA CC0 |

Budget: SFX ~0.7 MB + music ~4 MB raw, re-encoded mono/96 kbps to ~2.5 MB total (OPINION).

### Phased roadmap (OPINION)
1. P1: AudioManager (buses, voice cap, rate limit, pitch variation, unlock on Start), settings persistence, 15 core SFX + 1 music loop.
2. P2: remaining SFX, 3 music tracks with time-based crossfade, boss intro silence, ducking on level-up/evolution.
3. P3: pitch-climb gems, enemy-count intensity, stem layers, swarm stingers, dusk-to-dawn palette shift.
4. P4: custom/commissioned-style polish: own jsfxr/LMMS sounds replace weakest assets, spatial pan by screen position, per-chapter themes, mobile audio testing on real iOS/Android.

### Accessibility
Master/Music/SFX sliders and mute (M), defaults ~0.6 music / 0.8 SFX; never autoplay before gesture; cap peak loudness and ramp music in over 1-2 s; no sudden loud sounds (limit stingers to +6 dB over the mix, brief); visual cue for swarm warning/boss intro (audio not sole channel); optional "reduce flashing/sounds" toggle for repeated hit sounds; credits screen listing all licences.

Security check (for this file): web pages treated as data; no downloads/installs; licences only marked VERIFIED where read on the page.
