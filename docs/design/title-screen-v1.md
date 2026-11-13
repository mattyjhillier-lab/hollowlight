# Title screen v1: picture-based front door with key art (design sheet)

Date 2026-11-12. Status: DESIGN ONLY, awaiting Matt. No code, balance or assets changed. Does not touch docs/LOCKED.md or docs/QUEUE.md.
Builds on front-door-v1 (Lantern Hall: chip top-left, Continue/Begin, Skill Tree, Settings, New game) and the built U3 title (drawn wordmark). The menu stays as built; this only adds the picture behind it.

## 0. What Matt wants, in plain words
A "picture-based login screen". No accounts exist (LOCKED: no backend, lanterns are device-only), so the real meaning is: the first screen is a proper picture (key art) that says what the game is, and the lantern chip is the "who are you" step. Reference photos are inspiration for structure and rhythm only; nothing is copied.

## 1. Decisions for Matt (max 3, recommended first)
| # | Decision | A (Recommended) | B | C |
|---|---|---|---|---|
| 1 | Key art composition | **Lantern Vigil**: hero and companion in front with the lantern, the grey Hollow behind, colour flowing out from the light | **Hero poster**: one big hero portrait on one side, wordmark on the other | **Lantern gallery**: up to three hanging lanterns each show a tiny scene; pick yours (picture login) |
| 2 | How the art is made | **Code-drawn layers** from the existing rigs, animated in the engine | **AI-painted still** split into depth layers, glow added in code | **Hybrid**: code-drawn scene, AI only for a painted sky and ground texture |
| 3 | Hero on the cover | **Last-played hero** (Wren on first launch) | **Wren always** | **Both heroes side by side** |

## 2. Research (labels: OFFICIAL / COMMUNITY / OPINION)
- Spirit Hunters: simple title with logo and START / OPTIONS, a single save (COMMUNITY + store text, research 19/27). Lesson: key art plus few buttons.
- Hollow Knight, Hades, Cult of the Lamb: title with painted key art and slow ambient motion, small menu (COMMUNITY; layouts from memory = UNVERIFIED). Lesson: big picture, small menu, one animated light.
- Mobile first-run advice: 2-4 inputs to a run; long intro animations get skipped (OPINION, research 27). Lesson: art must never delay Continue.
- Parallax on a title: 3-5 layers with small offsets feels premium enough (OPINION).

## 3. Area 1: key-art composition
| | A Lantern Vigil (Recommended) | B Hero poster | C Lantern gallery (picture login) |
|---|---|---|---|
| Fantasy | Dusk in the Hollow: your hero holds the lantern, the pup (Wren) or ring-light (Elias) at their side, a pool of warm colour spreading into a grey forest | A cover painting: big hero, wordmark and tagline beside, menu under | Under the wordmark hang up to three lanterns, each glowing with a mini scene of that lantern's last hero. Tap yours to enter |
| Layers (back to front) | 1 sky and moon, 2 far grey trees, 3 mid trees with colour bloom, 4 ground with grass and flowers, 5 hero + companion, 6 lantern light and motes, 7 foreground grass/leaf frame | 1 backdrop, 2 hero, 3 glow, 4 wordmark | 1 sky, 2 hanging lanterns, 3 mini scenes, 4 wordmark |
| Animation | Slow lantern flicker, breathing colour bloom, drifting motes, grass sway, 3-layer parallax, fog drift | Glow pulse and a few motes | Lantern sway, flame flicker |
| Matches identity | Strongest: "spirits restore colour" is literally the picture | Good, but loses the world | Diegetic, but see lock conflict |
| Matches front-door-v1 | Yes: Lantern Hall menu over the art | Yes | No: reopens "skip the profile screen when only one lantern" and the rejected Lantern Gate option |
| Risk | Busy art behind buttons hurts legibility; needs a calm zone | Static, less alive; one hero spotlighted | A first-timer sees empty lanterns; needs a reopen decision |
| Mechanical sense | Menu stays small and fixed; the art never changes hit targets | Same | Adds a decision to a first launch |

Layout, desktop (1280x720 reference): art full-bleed; wordmark upper left third; menu column (Continue / Begin, Skill Tree, Settings, Almanac, Characters) lower left over a darkening calm-zone gradient; hero and lantern right of centre on the rule of thirds; lantern chip top-left, purses top-right (existing), version bottom-right.
Layout, phone portrait (390x844): art vertical; wordmark top, hero and lantern centre, menu stacked in the bottom third over a gradient; far trees cropped. Same layer data re-cropped, no second image set. Landscape phone (844x390): hero right, menu left, wordmark above the menu.
Continue / New / lantern chip: unchanged from front-door-v1. Continue has focus on load (Enter works at once, no animation gate); the chip opens "Whose lantern?" only with 2+ lanterns; New game stays quiet below. The art loads under the buttons, which are never delayed.
Entry animation (light blooming on) is 1.2 s; any key or tap finishes it instantly.

## 4. Area 2: how the art is produced with zero budget
| | A Code-drawn layers (Recommended) | B AI-painted still + code glow | C Hybrid |
|---|---|---|---|
| How | Reuse `src/gfx` rigs (hero, Elias, pup), groundtiles, treebg-style sky, propatlas, swaylayer and airlayer for grass and motes; compose one scene in the engine | Generate a painting with an AI tool, cut into 4-5 depth layers, add glow and motes in code | Code-drawn characters, lantern and light; AI only for a painted sky and ground texture, reworked |
| Look | Matches the in-game polished chunky cartoon exactly (LOCKED art style) | Higher fidelity but may not match gameplay art | Mostly consistent, richer backdrop |
| Cost | Medium: one composition; many pieces already built | Low authoring, high cleanup: cutting layers, matching the hero rigs | Medium |
| Licence and provenance | Nothing beyond existing | Tool terms, prompts, date, tool and licence recorded in CREDITS, AI disclosure at launch (LOCKED), never an artist's style, never another game's art; Matt's Forge/ComfyUI on D:AI not used without asking (LOCKED) | Same, for the AI part only |
| Consistency risk | Lowest | Highest: the painted hero would not match the real rig | Medium |
| Size / performance | No new image files (or small baked canvases) | Large images; 16 MB page rule and PWA cache grow | Moderate |
| Fit | Best (LOCKED: art by code first) | Needs a taste and provenance review | OK |

Recommended: A. If Matt later wants a painted feel, try C for the sky only, after A exists.
Review gate: an independent reviewer looks at the composition before building (medium size), per Matt's rules.

## 5. Area 3: hero on the cover
- A Last-played hero (Recommended): feels personal; needs two scene variants (Wren + pup, Elias + ring-light) sharing one background; first launch shows Wren (Matt's favourite).
- B Wren always: simplest and strongest brand image, but Elias players see someone else.
- C Both side by side: shows both, crowded on phone, awkward once the dragon-kin hero arrives.
- Wardrobe tie-in: the cover wears the hero's equipped costume and flame (same `resolveCosm` path as a run), so a new outfit shows at once (see docs/design/wardrobe-v2.md).

## 6. Performance and Calm motion
- Budget: 60 fps on a mid phone, about 3 ms per frame for the title layers; layers baked once, pooled sprites, no per-frame allocation; pause when the tab is hidden (existing pattern).
- Parallax: mouse on desktop; on phones device tilt only after explicit permission, otherwise a slow auto-drift; offsets a few pixels.
- Calm mode: no parallax, no auto-drift, no flicker (static glow), motes frozen or off, entry bloom replaced by a fade. `prefers-reduced-motion` follows Calm by default.
- Low-power fallback: existing quality tiers (`src/gfx/quality.js`) drop motes and the foreground frame first.
- Accessibility: the art is decorative (`aria-hidden`); all text is live DOM text on a legibility gradient; contrast check of the menu against the lightest part of the art; focus order unchanged.
- Offline PWA: A adds no files to cache; B/C add images to the service-worker list.

## 7. Risks and weak spots
- Busy art behind the menu: calm-zone gradient plus a contrast screenshot check.
- Composition taste: the reason for a sandbox before building.
- First paint: wordmark and menu appear immediately, art blooms in beneath; nothing blocks.
- "Login" expectation: there is no account; the chip tooltip says "Lanterns live in this browser" (already in front-door-v1).
- Scope: this is the cover only, not hero select or the map screen.

## 8. Sandbox plan (standalone, outside the repos)
- Location: e.g. C:\Users\matty\sandbox\title\index.html, single file, no build, no network, fake data (two heroes on canvas with the rig colour tokens, a fake lantern name, a Continue-available toggle).
- Tune panel: per-layer parallax strength, glow colour / radius / flicker speed, bloom breathing, motes count, vignette and calm-zone gradient strength, hero position and scale per layout (desktop, phone portrait, phone landscape frames), Calm toggle, true-size and phone-size frame toggles.
- "Copy settings" button: JSON of every value to the clipboard for pasting to Claude, who locks it in LOCKED and moves it into data.
- Not built until Matt picks the three decisions.

## 9. Fit check and mechanical-sense check (summary)
- Fit: IDENTITY (colour returns where the light is), BIBLE tone, LOCKED art style (code-drawn chunky cartoon, Warm Lantern), restraint (one light source, few colours).
- Mechanical sense: menu behaviour unchanged (front-door-v1), the art never touches saves or balance, Continue is immediate.
- Conflicts with docs/LOCKED.md: A and B none. C of Decision 1 conflicts with "skip the profile screen when only one lantern" and the front-door-v1 rejection of the Lantern Gate, so it needs a reopen. AI art (Decision 2 B/C) needs provenance and disclosure per the Asset production row.

## AskUserQuestion-ready block
Summary: no accounts exist, so the "picture login" is a key-art title with the lantern chip as the "who" step. The menu stays as built; only the picture behind it changes.
1. "What should the cover picture show?" Options: Lantern Vigil, hero and companion with the lantern as colour spreads through the grey forest (Recommended); Hero poster, one big hero portrait; Lantern gallery, hanging lanterns you pick from (needs reopening the front-door rule).
2. "How should the art be made?" Options: Code-drawn from the game's own rigs (Recommended); AI-painted still with code glow (needs provenance and disclosure); Hybrid, code characters with an AI-painted sky.
3. "Which hero is on the cover?" Options: The hero you played last, Wren first time (Recommended); Wren always; Both heroes side by side.

Right now: Matt's three picks. Next: title tune sandbox. Parked: AI-painted sky pass, hero select refresh.
