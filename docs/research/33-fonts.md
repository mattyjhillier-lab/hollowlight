# 33 - Fonts that match Hollowlight (research + three pairings, 2026-10-16)

Why: Matt finds the locked U1 trio (Cormorant Garamond / Figtree / Caveat) "OK" but not matched to the idea of Hollowlight (lantern-lit, hand-made, cosy-but-haunted, Style v1 storybook glow + heroic cartoon, thread/brass/glass UI). DESIGN/RESEARCH ONLY: no game code touched, nothing downloaded into the repo. Pictures and how to re-render: docs/mockups/font-options/README.md.

Labels: OFFICIAL = primary source fetched this session; COMMUNITY = fan/forum/secondary page; OPINION = my judgement. Licence/glyph/size numbers are MEASURED by me this session (raw OFL.txt + METADATA.pb from github.com/google/fonts, TTFs fetched into a scratch folder outside the repo, fontTools 4.67 in a throwaway venv; same Latin subset as U1: Basic Latin, Latin-1, common punctuation, minus, arrows, euro).

## 1. What gives indie games their own typographic voice
Search was thin (same limit as docs/research/32). Honest summary:
| Game | What is known | Label |
|---|---|---|
| Hollow Knight | UI text widely reported as Perpetua (Gill-style monumental serif); logo is a custom hand-made serif; Team Cherry has not published font names | COMMUNITY (Steam thread / fan wiki, unconfirmed) |
| Hades | No confirmed UI face found; lettering/UI is illustrated art by Supergiant; classical, stylised headers + plain readable body | COMMUNITY / OFFICIAL (job post, research 32) |
| Darkest Dungeon | Logo = Dwarven Axe BB (BlamBot, commercial), per Steam thread with file evidence | COMMUNITY, best-supported of the set |
| Don't Starve | Title is art; text claimed to be Belisa Plumilla (single forum claim) | COMMUNITY, weak |
| Cult of the Lamb | Custom blackletter-ish title; menus reported as JAF Lapture + Fira Sans | COMMUNITY |
| Inscryption | Marksman-based type claimed by a forum post | COMMUNITY, weak |
| Sea of Stars | Custom logo lettering; pixel UI face unnamed | COMMUNITY |
| Spiritfarer, Gris, Ori, Child of Light | No source found naming the faces | none; do not claim |
Pattern (OPINION, consistent across the rows that ARE sourced): (1) the title/wordmark is nearly always custom-lettered art, not a stock font; (2) menus use ordinary, very legible faces (Perpetua, Fira Sans) and get their identity from the frame, colour and voice; (3) the one expressive face is kept to headings and names. So: Hollowlight's identity should come from a distinctive HEADING face + a custom-lettered wordmark later, while body/numerals stay plain and legible. A font that is "too decorative everywhere" fails on phones.

## 2. Licence finding that changes the shortlist (OFFICIAL)
OFL FAQ (openfontlicense.org/ofl-faq, fetched): item 2.6 "Is subsetting a webfont considered modification? Yes ... permitted by the OFL but would not normally allow the use of RFNs"; item 2.2: WOFF conversion alone is not a modification, subsetting is. Consequence: a font that DECLARES a Reserved Font Name (RFN) may only be subset and self-hosted if we RENAME it (new family name in the font's name table and CSS) or ship the whole unsubsetted file. U1's three fonts have no RFN, which is why it was frictionless.
RFN declared (read from each OFL.txt header): Fondamento, Almendra (+SC, Display), Eagle Lake, Uncial Antiqua, Macondo, Berkshire Swash, Jim Nightshade, Cinzel Decorative, Metamorphous, Mystery Quest, Marcellus, Forum, Gilda Display, Aladin, Caudex, Lancelot, Lora, Quicksand.
No RFN: Fraunces, Alegreya, Alegreya Sans, Nunito, Kalam, IM Fell (English / SC / Double Pica), Texturina, Sansita Swashed, Grenze Gotisch, Gloock, Young Serif, Mynerve, Gaegu, Itim, Cormorant, Figtree, Caveat.
All are SIL OFL 1.1 (METADATA.pb `license: "OFL"` for every one). Renaming is a small build step (fontTools sets nameIDs 1/4/6) and is allowed; it is the one added chore for options that use an RFN face.

## 3. Shortlist (14) judged against the three roles
Sizes = Latin-subset woff2 as measured; "VF full" = variable font with all axes (upper bound, narrowing axes shrinks it, as U1 did). Glyph check = ← → ↑ ↓ × − · … – — ‘ ’ “ ” % + ± plus tabular figures.
| # | Font | Role tried | RFN | woff2 (Latin) | Glyph / numerals | Verdict |
|---|---|---|---|---|---|---|
| 1 | Fondamento (+Italic) | display, whisper | YES | 23.3 KB / 22.0 KB | no arrows; one weight; digits old-style-ish, no tnum | A display + whisper. Calligraphic, warm, hand-made; best "storybook" match |
| 2 | Almendra (Reg/Bold) | display | YES | 11.7 / 11.1 KB | no arrows; Bold lacks minus | Strong runner-up for display; narrower, more fairy-tale; Bold has gaps |
| 3 | Eagle Lake | display | YES | 27.2 KB | no arrows | Nice calligraphy, wide; less ownable than Fondamento |
| 4 | Fraunces (variable) | display | no | 30.5 KB pinned (wght 600-800, opsz 48, SOFT 100, WONK 1); 114 KB full | no arrows; no tnum | B display. Soft, wonky, cosy-chunky |
| 5 | Texturina | display | no | 76.9 KB VF (axes not narrowed) | no arrows | Textured storybook serif; too heavy in bytes for the gain |
| 6 | IM Fell English SC | display | no | 55.5 KB | no arrows, no U+2212 minus | C display. Rough-print, genuinely haunted |
| 7 | Uncial Antiqua | display | YES | 18.9 KB | no arrows | Very distinctive but h/d/e read oddly; wordmark-only at most; rejected for headings |
| 8 | Sansita Swashed | display | no | 26.0 KB (static 700); 46 KB VF | has tnum | Heroic-cartoon italic swashes; too comic-book, fights the quiet tone; reserve |
| 9 | Alegreya Sans | body | no | 16.4 KB per weight (400/500/700) | arrows yes, tnum yes (not default) | A body. Humanist with calligraphic roots, warm, legible at 11-12 px |
| 10 | Alegreya | body | no | 23.5 + 24.8 KB static 400+700 (VF 44.7 KB upper bound) | arrows yes, tnum yes | C body. Book serif, holds at 12 px |
| 11 | Nunito | body | no | 13.7 KB per static weight (VF ~35 KB upper bound) | digits tabular BY DEFAULT; no arrows | B body. Friendly rounded, safest numerals |
| 12 | Kalam | whisper | no | 13.7 KB | no arrows; all punctuation present | B whisper. Slanted, legible at 15 px |
| 13 | Gaegu | whisper | no | 12.3 KB | MISSING × − · … – — ± £ € • « » | Rejected: punctuation holes |
| 14 | Mynerve | whisper | no | 46.0 KB | arrows yes | Delicate, but 46 KB and thin at 15 px; reserve |
Also looked at and dropped after the contact sheet (candidates.png): Cinzel Decorative (the generic fantasy-caps look the bible warns against, RFN), Metamorphous, Macondo, Berkshire Swash, Jim Nightshade (too narrow), Mystery Quest (comic spooky), Marcellus (Roman, RFN) all RFN; Grenze Gotisch (blackletter, bible forbids a gothic logo); Gloock and Young Serif (generic bold editorial); Quicksand and Lora (RFN, ordinary).
Arrows: none of the display faces has them, so UI arrows (→ in "50 → 56 reach") must come from the body face (Alegreya Sans, Alegreya, Mynerve have them; Nunito does not, so option B needs an SVG arrow or a fallback glyph).
Weights: U1 now ships real files for Cormorant 47 KB + Figtree 18 KB + Caveat 38 KB = 103 KB (measured from the repo).

## 4. The three pairings (same Lantern Glass skeleton, only type changed)
| | DISPLAY (wordmark, titles, names, big words) | BODY / UI / numerals / damage | WHISPER |
|---|---|---|---|
| U1 current | Cormorant Garamond 700, caps, tracked | Figtree 400-700 | Caveat |
| A "Chancery Storybook" | Fondamento 400 (mixed case) | Alegreya Sans 400/700 (HUD + damage numerals, tnum) | Fondamento Italic |
| B "Soft Wonk Cosy" | Fraunces 700-800, SOFT 100, WONK 1 | Nunito 400-800 (tabular by default) | Kalam 400 |
| C "Old Print, Haunted" | IM Fell English SC | Alegreya 400-800 (HUD numerals lining + tnum) | IM Fell English Italic |
Specimens rendered for every option at 1280x720, 844x390@2x, 390x844@2x: wordmark + type ladder, title screen, hero select (Wren/Elias text), level-up (evolution/stat/new cards + Blessings), results block, HUD numerals + damage numbers + whisper toast. measured.txt: no overflow and no text under 11 px in any of the 72 frames.

## 5. What the pictures show (OPINION, honest)
- A: the most hand-made and ownable. The "Hollowlight" wordmark in Fondamento looks like lettering from a storybook, calibrates directly with the thread/lantern idea, and is the best starting point for a later custom-lettered logo. Cards read well; "Leap" and "Pouncing Pack" look like names in a tale. Weak: one weight only (no bold, synthesis off), display digits are old-style-ish (11:42 reads uneven) so every number must use Alegreya Sans, and Fondamento at ~16 px in buttons is fine but fussy below that; a calligraphic fantasy face is also a known indie-RPG look, so ownership comes from pairing and wordmark, not the face.
- B: friendliest and strongest at small sizes (Nunito digits, Fraunces bold), best "heroic cartoon" half of Style v1. Weak: it is the least haunted and the most "cute indie"; the bold soft serif sits closer to cosy-farm or Cult-of-the-Lamb-cute than to a lantern-lit spirit world, and it undersells the tender-and-sad tone (bible: not cute-chibi). Nunito lacks arrows.
- C: the strongest "cosy-but-haunted, hand-made" mood; IM Fell's rough print edges look like an old lantern-bearer's almanac, and it reads as unlike anything else in the genre. Weak: oldstyle digits (a "1" reads like a capital I in "+12%"; mitigated by using Alegreya lining numerals but not in display words), 56 KB per Fell file (about 158 KB total, trim unproven), and small caps are less friendly to the "storybook glow / heroic cartoon" half; rough edges blur at 14 px, so it must be display-only.
- U1 comparison: Cormorant caps are elegant but generic fantasy-museum and thin; its default digits are old-style (the mock-up render shows "+I2%"; the real U1 tokens set lining numerals via --num, so this is a mock-up artefact, not a shipped bug). Caveat whisper is fine but the most common handwriting font on the web.

## 6. Recommendation
Pick A (Fondamento + Alegreya Sans + Fondamento Italic), with B as second choice if Matt wants friendlier and punchier. Reasons: A is the best fit to "lantern-lit, hand-made, storybook", it makes the wordmark ownable now, Alegreya Sans keeps phones legible and gives real arrows and tabular numerals, and it needs only two families (the whisper reuses the display italic), about 78 KB for Fondamento 400 + Italic + Alegreya Sans 400 + 700 versus 103 KB today. Treat the final wordmark as custom lettering later (every sourced example above does), using Fondamento as the sketch base.
If Matt wants the darkest, most distinctive mood instead, C is the bolder choice but costs about 158 KB and needs the numerals rule.

## 7. Estimated font bytes (Latin subset woff2; the PWA cache and the single-file build inline them as base64, +33%)
| Option | Files | woff2 total | As base64 in single file | Delta vs U1 (103 KB) |
|---|---|---|---|---|
| U1 (shipped) | Cormorant 47 + Figtree 18 + Caveat 38 | 103 KB | about 137 KB | 0 |
| A | Fondamento 23 + Fondamento Italic 22 + Alegreya Sans 400 16 + 700 16 (+ 500 16 optional) | about 77 KB (93 with 500) | about 103 KB | -26 KB (-10) |
| B | Fraunces pinned 31 + Nunito static 400 + 700 27 (VF about 35) + Kalam 14 | about 72-80 KB | about 100 KB | about -25 KB |
| C | IM Fell SC 56 + IM Fell Italic 57 + Alegreya 400 + 700 48 (VF about 45) | about 158-161 KB | about 210 KB | +55 KB |
Estimates are measured subsets; narrowing variable axes (Nunito, Alegreya) should shave a little more. Not shipped, not final.

## 8. Fit check
Fit: A matches the lantern-craft, hand-made, storybook idea and works with the thread/brass/glass kit (display only for names and titles, plain body for data); mechanical sense: readable numerals via the body face, 11/12/13 px floors still met, arrows covered, two families only. B and C also fit but trade off cosiness vs haunting as above. No conflict with docs/LOCKED.md except the font line of UI IDENTITY v1 (Cormorant/Figtree/Caveat), which would need Matt's explicit reopen; LOCKED not edited here.

## 9. Honest weak spots of this research
- Per-game font rows are mostly COMMUNITY or unverified; do not treat any as fact (see section 1).
- Subsets for variable fonts were measured full-axis (upper bound) for Nunito/Alegreya/Sansita/Texturina; Fraunces was truly pinned.
- IM Fell trimming (fewer OpenType features) to cut bytes was not tested.
- Proofs use Google-served fonts in headless Chrome; the real self-hosted subset could render slightly differently (hinting off in my subset). Re-proof with the real files before any lock.
- No real-phone check of Fondamento at 15 px whisper size; the 844x390 and 390x844 renders were emulated at 2x only.
- Rename step for RFN fonts (Fondamento) not yet prototyped end to end.

## 10. Decisions for Matt (max 3, recommendation first)
1. Which pairing? A Chancery Storybook (Recommended) / B Soft Wonk Cosy / C Old Print Haunted / keep U1.
2. Wordmark: use the chosen display face for now and plan a custom-lettered logo later (Recommended) / keep it plain font permanently.
3. If A or B/C is chosen: OK to download the needed font files (Fondamento Regular + Italic, Alegreya Sans 400/700 from github.com/google/fonts ofl/ folders, about 80 KB total; Fondamento to be subset AND renamed because of its Reserved Font Name) and swap them in as a small chunk (U1b, replaces the U1 font files and tokens only)? Yes (Recommended) / not yet.

Security check (licences): every shortlisted font verified OFL 1.1 from its own OFL.txt/METADATA.pb; RFN list recorded; no font files downloaded into the repo (TTFs were fetched to a scratch folder for measuring only and are not committed); proof HTML loads fonts from fonts.googleapis.com only for local proofing, nothing shipped; no new dependency (fontTools used in a throwaway venv, not a project dependency).
