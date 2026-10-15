# 27 Front door flow (cover, profiles, hero + map select)
Checked 2026-10-15. Read-only research. Labels: OFFICIAL / COMMUNITY / OPINION / UNVERIFIED.
Scope lock: device-only profiles, Continue/New Game, NO accounts/backend (docs/LOCKED.md).
Honest note: web search gave thin menu-level detail for several games; those cells are UNVERIFIED and should be confirmed by Matt playing them (he owns Spirit Hunters).

## 1. How comparable games structure the front door
| Game | Flow (in words) | Evidence |
|---|---|---|
| Vampire Survivors | Main menu -> Start -> Character select -> Stage select -> Arcana pick -> run. Meta shop and secrets sit on the main menu. Locked heroes show their own unlock requirement. ~4-5 taps to run. | COMMUNITY (unlock guides describe the order), https://www.bluestacks.com/blog/game-guides/vampire-survivors/vps-secret-characters-en.html ; https://www.ggrecon.com/guides/vampire-survivors-cheats/ |
| Spirit Hunters (our reference) | Title: START / OPTIONS (graphics, audio, Delete Save) / CREDITS / QUIT. START -> Divinity Web hub with START RUN and ORACLE. START RUN -> hero select (8 heroes, empty frames for future). Chapter select: not found. Single save (Delete Save lives in Options). | COMMUNITY guide https://gamepretty.com/spirit-hunters-infinite-horde-basic-guide-to-new-hunter/ ; OFFICIAL store text https://www.nintendo.co.uk/Games/Nintendo-Switch-download-software/Spirit-Hunters-Infinite-Horde-2410904.html. Chapter select UNVERIFIED. |
| Brotato | Setup order: character -> starting weapon -> Danger level. Danger 0 only at first; each win opens the next (to 5). Separate accessibility sliders for enemy hp/damage/speed. | COMMUNITY https://www.trueachievements.com/game/Brotato/walkthrough ; OFFICIAL showcase https://godotengine.org/showcase/brotato/ |
| Halls of Torment | Home with a "Register of Halls" (map pick); vendors/shops are hidden at first and appear as you unlock them. Heroes unlocked by boss kills / survival goals (e.g. Shield Maiden via a boss). | COMMUNITY https://fantasywarden.com/?p=21970 |
| Soulstone Survivors / Death Must Die | Menu layouts not found. Heroes unlock by achievements. | UNVERIFIED |
| Survivor.io / Archero | Home layout not found (phone games; widely known to use a home with big bottom Play/Start button, chapter on home). Controls are one-thumb joystick at screen bottom. | Controls COMMUNITY (https://www.wearesync.co.uk/latest-news/archero-iphone-game/); home layout UNVERIFIED |
| Dead Cells | Numbered save slots; autosave at level start and on quit to menu. | COMMUNITY https://www.speedrun.com/deadcells/guide/5kzwe |
| Slay the Spire | Main menu has Continue (if a run is saved) / New run (character + ascension) / Abandon. No slot system; a 2018 player suggestion asked for ~3 slots, implying none. | COMMUNITY https://steamcommunity.com/app/646570/discussions/2/1699417068298637125 (mostly for StS 2 tooling; labels may differ) |
| Hades | Dedicated cross-save entry on the main menu; 3 numbered slots implied by dev advice to keep platform saves separate; no mid-run save. Title -> slot step-by-step NOT found. | COMMUNITY/OFFICIAL FAQ https://www.supergiantgames.com/faqs/hades/ ; UNVERIFIED for the flow |

Patterns that hold across sources:
- Order is almost always: title -> (hub with meta) -> hero -> (stage/difficulty) -> run. Shortest paths are 2-3 taps for returning players.
- Meta spend lives in a hub/menu, not buried; locked things show a condition, and some hubs hide whole features until unlocked (Halls) - fits our "tree greyed with conditions" rule.
- Difficulty tiers are earned by winning (Brotato Danger) rather than picked freely.
- Delete is separated from play (Options) and described as permanent (Spirit Hunters).

## 2. Hero select and map/chapter select patterns
| Aspect | Common practice | Our take |
|---|---|---|
| Layout | Row/grid of portrait cards plus a detail panel (name, weapon, ability, 2-3 stats). | Keep the current two hero cards, move to a lantern-lit stage with a detail panel (weapon, ability, one-line personality). |
| Locked heroes | Silhouette + requirement text; empty frames for "coming" (Spirit Hunters). | Silhouette in grey Hollow tone, condition line, progress bar if numeric. Never hide that they exist. |
| Stats shown | Few; weapon + ability + playstyle tags. | No raw stat tables; 3 pips max (OPINION). |
| Difficulty | Earned tiers (Brotato). | Not at launch (one chapter). Reserve a slot in the layout; tiers later via QUEUE. |
| Chapter/map | Map picker with locked next areas. | Single chapter at launch; still show the map with 1 lit chapter and 7 dim ones as the promise. Cheap and motivating. |
| Phone | Primary action bottom-centre/right for thumb reach; swipe between cards; min tap targets ~44-48px (OPINION, common guideline). | Landscape primary (game is landscape). Big Play at lower right; Back at upper left. |
| Keyboard/pad | Arrow/WASD move focus, Enter/Space confirm, Esc back, 1-4 shortcuts. | Same keys as in-game. Every screen needs a visible focused element and Esc = back one step, never "quit". |
| Back rules | Back = previous screen, state kept; Esc on hub = nothing or "are you sure". | Esc on hub does nothing (no accidental exits). |

## 3. Profiles on a device (no accounts)
Facts
- localStorage ~5 MiB per origin, throws QuotaExceededError; best-effort storage can be evicted under disk pressure (LRU) and cleared by the user; `navigator.storage.persist()` asks for protection (Firefox prompts; Chromium/Safari decide silently). Safari with tracking prevention deletes script data after 7 days of no interaction. Private mode often wipes on close. OFFICIAL https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- Saves are per origin: itch.io iframe, GitHub Pages and the Claude artifact are three separate stores (known; see doc 05).
- Our store already does: persist() request, backup key, in-memory fallback with a `persistent` flag, validated parseSave with versioned migration.

Design options
| Option | Pros | Cons |
|---|---|---|
| A. 1 save only (today) | Simplest | Shared-device/family games clobber each other |
| B. 3 profiles, name + avatar (recommended) | Matches Matt's choice, family-friendly, small | Needs index key, delete UX |
| C. 5+ profiles | More | Scope, clutter |

Recommended storage key design
- `hollowlight:profiles` = index JSON: `{v:1, order:[id..], last:id, items:{id:{name, avatar, createdAt, updatedAt}}}` (metadata only, small, validated).
- `hollowlight:p:<id>:save` and `hollowlight:p:<id>:save:backup` = the existing save objects, unchanged schema (SAVE_VERSION stays; per-profile migration reuses parseSave).
- id = short random `p1..p3` fixed slots or 8 hex chars; whitelist `^[a-z0-9]{2,12}$`; never build keys from user names.
- One-time migration: if legacy `hollowlight:save` exists and no index, create profile "Hunter" wrapping it (copy, keep legacy key for one version as rollback, then remove). Nothing lost for Matt's current save.
- Settings (volume, touch) stay inside each save today; consider a device-level `hollowlight:device` key for audio/touch/lang so a new profile does not reset them (OPINION, small).
- Profile list read must tolerate corrupt entries: skip bad slots, show "Damaged - restore from backup / delete".

UX safety
- Name: 1-12 chars, letters/digits/space/few punctuation, trimmed, default "Hunter"; prompt "Pick a name (not your real name)". No email, no real-name ask, no analytics link. Render via textContent only (existing rule); also length-clamp on load (a hand-edited index is untrusted input).
- Avatar: pick from ~8 built-in spirit/lantern icons by id (no uploads).
- Delete: two-step ("Delete Wren's hunter? Export first" with Export button, then type-or-hold-to-confirm); deleting is the only irreversible action, keep a 1-tap "Export first". No undo needed if hold-to-confirm plus export prompt; optionally keep the backup key for the session (OPINION).
- Export/import: per profile; import checks via checkImport, then a "Create new profile from this file" (never silently overwrites); show errors in friendly words (existing messages).
- Warn once, plainly: "Saves live in this browser. Clearing site data or private mode erases them. Export to back up." Show a "saved on this device" badge and last-saved time.
- Private mode/storage failure: the `persistent=false` flag should surface as a banner on the profile screen ("progress won't be kept").
- Kids/shared device: no chat, no links out on the profile screen, no data leaves device. No account = nothing to leak (positive for GDPR/UK Children's Code posture; OPINION, not legal advice).
- Cap on total profiles to 3 keeps within quota easily (each save is a few KB).

## 4. First impression / cover
| Item | Guidance | Source type |
|---|---|---|
| Audio gate | AudioContext must be created/resumed inside a user gesture; a "Tap / Press any key" cover is a natural gate and also unlocks music on mobile | OFFICIAL https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices |
| Cover | Logo + one animated idea; on first input play the transition into the menu | OPINION |
| Loading | Single-file build is large; show a lantern-flame loader, not a blank page | OPINION |
| PWA/install | Do not nag on cover; offer "Add to home screen" later in Settings or after first win | OPINION |
| Version | Small version label bottom corner; link to changelog | OPINION |
| Legal | Credits screen with asset licences, AI-assistance disclosure, "no accounts, saves stay on your device" line | per CLAUDE.md credits rule |
| Accessibility | Reduced motion respected for the cover animation; focus visible; text contrast; skip-able intro (never block a returning player) | OPINION |

## 5. Recommended Hollowlight flow
Principle: returning player = 2 taps to a run (Press Play -> Play on last hero). New player = guided, never confronted by 3 empty slots.

```
COVER (press any key / tap)         audio unlocks here
  -> PROFILE (only if >1 profile exists, or user taps "Switch")
        first launch: skips to "Name your hunter" (1 field + avatar row), no empty slot list
  -> HOME (hub)
        -> PLAY -> HERO -> MAP -> RUN
        -> Skill Tree   -> Settings   -> Credits/Save tools
```
Returning with one profile: Cover -> Home directly (profile chip top-left shows name + avatar; tap to switch/new/delete). Continue vs New Game collapses into the profile model: a profile IS your continue; "New Game" = New profile. (Runs are short, 15 min, no mid-run save; so no "Continue run" button needed. UNVERIFIED if a mid-run resume is wanted later; QUEUE.)

Text wireframes (desktop 16:9 / phone landscape; portrait unsupported at launch)

COVER
```
        [ grey Hollow, one lantern glows ]
           H O L L O W L I G H T
          Spirits of the Dusk
        < Press any key / Tap to begin >
 v0.x                      Credits · Settings
```
Colour spreads outward from the lantern as you press (visual only).

PROFILE (list, 3 slots)
```
 Who is hunting tonight?
 [avatar] Wren-fan  Lv.12 · 3 wins · 14,200 gold   [Play]
 [avatar] Sam       new                             [Play]
 [ + New hunter ]          [Export] [Import] [Delete]
 Back: -> Cover
```

HOME
```
 [avatar Name]        gold 1,200   shards 3
                  HOLLOWLIGHT
                  [ PLAY ]           <- big, lower right on phone
  [ Skill Tree ]  [ Settings ]  [ Credits ]
  first-run hint line (existing)
```
HERO (lantern-lit stage; replaces the two cards-that-start-a-run)
```
 < Back     Choose your hunter
 [Wren]  [Elias]  [ ? ] [ ? ] ...       detail: weapon, ability, line
                                        [ NEXT ]  (Enter)
```
MAP (one chapter at launch)
```
 < Back     Choose the Hollow
 [ Cursed Forest  lit ]  [ ??? dim ] ...   best time, clears
                                        [ START RUN ]
```
Back always goes up one screen with choices remembered (last hero/map stored in the profile; preselect so repeat play = Play, Next, Start, or hold to skip: "Quick start" on Home uses last hero+map, 1 tap).

Identity tie-ins (fit): cover/home start desaturated and tint warmer as pressing Play (Hollow identity); hero select = lantern pool on a stage with trails; map = hand-drawn Hollow map where cleared chapters are coloured and others grey. Restraint: one animated element per screen, same Warm Lantern palette, existing DOM overlay style.

Fit check wording: restoring colour = the game's identity; Home/Hero/Map are menu-only, no sim changes.

### Taps launch -> run
| Player | Taps |
|---|---|
| First time | Cover(1) + name(type + 1) + Play(1) + Hero(1) + Start(1) ~ 5 |
| Returning, 1 profile | Cover(1) + Quick Start(1) = 2 (or Play + Next + Start = 4) |
| Multi profile | + 1 profile pick |

## Minimal build slices
| Slice | Content | Size |
|---|---|---|
| F1 | Profile store layer: index key, per-profile save keys, legacy migration, validation, tests (store.js multiplexes by active id; schema untouched) | M |
| F2 | Cover + Home split from current title (current screen becomes Home; add cover with audio gate, version, credits link) | S |
| F3 | Profile screen (list, new with name/avatar, switch, delete with export-first, import-as-new, storage banner) | M |
| F4 | Hero select screen (move the two cards; detail panel; locked silhouettes) | S-M |
| F5 | Map select (one lit chapter + dim teasers; remembers last choice; Quick Start) | S |
Order: F1 (invisible, testable) -> F2 -> F4/F5 -> F3. Each chunk gets its own playtest per standing rule. Estimate ~1 session each; F1 and F3 get security review (untrusted index/imports).

## Risks
- Migration from the single save: do copy-not-move; test with the legacy fixture and a corrupt one.
- Quota/eviction and per-origin duplication make "device profile" feel like an account to kids/parents; copy must say "this browser".
- Screen count grows taps; mitigate with Quick Start and remembered picks.
- Old Safari data deletion after 7 days idle: surface export reminders.
- Scope creep (avatars, cloud, accounts): park in QUEUE.
- Cover animation weight on phones: keep CSS/light canvas; respect reduced motion.

## Open questions (max 3)
1. Profiles cap: 3 (recommend) vs unlimited.
2. Skip the profile screen when only one profile exists (recommend yes; show chip to switch).
3. Per-profile vs device-level settings (recommend device-level audio/touch; per-profile everything else).

Security check: researched only; no downloads/installs; web content treated as data. Planned controls: profile names via textContent, whitelisted ids/charset/length, index+save validated on load, import creates a new profile only.
Fit check: devices-only profiles, Hollow colour-return cover, lantern-lit hero stage and coloured-chapter map match IDENTITY and LOCKED front-door row; menus only, no sim/balance impact.
