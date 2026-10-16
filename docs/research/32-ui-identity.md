# 32 - UI identity: what makes a game's UI its own (research for the UI visual + voice sheet, 2026-10-16)

Labels: OFFICIAL = primary source fetched this session; COMMUNITY = secondary page seen in search; OPINION = my play/design knowledge, NOT fetched. HONEST NOTE: two web searches this session (Hades UI, Cult of the Lamb/Inscryption/Spiritfarer UI) returned only thin results, so almost every per-game row is OPINION (same limit as docs/research/28 and 31). Verify by looking at each game before treating a row as fact. The design rests on the principles in section 3, not on the rows. Banners of Ruin: I do not know its UI well enough to say anything, so it is left out of the conclusions.

## 1. Sources actually fetched
| Source | Label | What it gave |
|---|---|---|
| Supergiant job post, "UI illustrator for Hades II" (supergiantgames.com/blog) via search | OFFICIAL (via search excerpt) | UI is drawn as layered, animation-ready art; "hundreds of icons ... stylistically consistent"; the Hades Keepsakes screen is their own example of target style. Lesson: identity = one consistent illustrated system, not default controls. |
| Cult of the Lamb title/logo write-ups (madegooddesigns, fontsinuse) via search | COMMUNITY (sources disagree on menu font names; treat names as unverified) | Title lettering is custom, sharp and jagged; the UI itself is deliberately simple so the art does the talking; identity comes from cute-vs-occult contrast. |
| Font licences: raw OFL.txt for Fraunces, Alegreya Sans, Cormorant Garamond, Figtree, Caveat, IM Fell English from github.com/google/fonts | OFFICIAL | All six: SIL Open Font License 1.1, no Reserved Font Name declared (so subsetting/self-hosting is allowed; keep OFL.txt + copyright lines in CREDITS). Copyright lines: Fraunces Project Authors 2018; Alegreya Sans Project Authors 2013; Cormorant Project Authors 2015; Figtree Project Authors 2022; Caveat Project Authors 2014; IM Fell English (c) 2010 Igino Marini. |

## 2. Games with a UI of their own (all OPINION unless marked)
| Game | What makes the UI recognisably theirs | Shape / frame | Material | Type | Motion / sound | Copy voice | Phone-friendliness |
|---|---|---|---|---|---|---|---|
| Hades | Painted, illustrated objects: Keepsakes, boon cards, the Mirror are artwork not widgets (OFFICIAL: UI is layered illustrator work) | Light ornate frames, thin gold edges, little filler fill | Dark lacquer + gold leaf + painted portraits | Narrow warm serif, caps for names | Hover glow, card flips, voiced reactions | Characterful, gods speak in-voice | Port is clean but text small on handheld |
| Hollow Knight | Restraint: thin ivory line-work on black, tiny filigree dividers, masks as health | Hairline, almost no boxes | Ink, bone, soul glow | Classical serif, small caps | Slow fades, soft chimes | Terse, melancholy | Fine; dense small text |
| Gris | Almost no UI; soft watercolour shapes, colour = progress | Organic, no frames | Wash, paper | Tiny hand-set type | Colour + music | None needed | Excellent (barely any UI) |
| Inscryption | Diegetic: menus and cards ARE objects on a table (printed card stock, wax, candle) | Physical objects, torn edges | Card stock, wood, candle light | Typewriter / printed | Physical clicks, candle flicker | Dread, a narrator | Cards are big, readable |
| Dead Cells | UI belongs to the pixel world: flask, scroll counters, chunky readable icons | Pixel frames, strong silhouettes | Pixel metal and ink | Pixel font | Punchy, snappy | Dry, short | Readable if scaled |
| Cult of the Lamb | Cute-vs-occult contrast, custom lettering, simple readable panels (COMMUNITY) | Soft chunky panels, wobbly hand-drawn edges | Paper / felt cut-outs | Custom display + plain sans | Bouncy | Cheerful menace | Good |
| Spiritfarer | Warm hand-painted wood and paper, rounded lettering, UI sits in the cosy world | Soft panels with painted trim | Wood, paper, string | Friendly rounded display | Gentle | Tender, plain | Good (large targets) |
| Ori | Spirit-light: glowing thin lines, light leaks, nothing heavy | Thin glowing outlines | Light on dark | Light humanist | Chime + glow | Sparse | Fine |
| Vampire Survivors (genre baseline) | Utilitarian: flat boxes, bright pixel icons, little decoration | Plain rectangles | Flat | Pixel font | Minimal | Dry, jokey item text | Good because it is simple |
| Spirit Hunters: Infinite Horde (genre baseline, Matt's reference) | Glossy mobile-fantasy: gem frames, bright rarity colours | Bevelled rounded panels | Plastic gem + gold | Heavy sans | Loud rewards | Plain | Built for phone |

## 3. Principles drawn (OPINION; confidence medium, they match common game-UI craft)
1. UI as an OBJECT of the world: the strongest identities make panels, buttons and dividers feel like things that exist there (cards, tags, glass, string). For Hollowlight those things are lantern glass, brass fittings, thread, wicks, tags: all things a lantern-bearer would carry.
2. ONE signature motif repeated everywhere (Hollow Knight filigree, Inscryption candle, Spiritfarer string). Ours: the thread (a thin dashed/stitched line with a bead or knot) and the wick-flame (the state indicator).
3. Hierarchy by scale contrast and few weights, not by borders on everything: one big number or title per screen, light supporting text. The current build gives every element the same 1 px glow border.
4. Ornament lives at corners, ends and dividers only. At phone size (11-14 px text) fine ornament inside text areas hurts legibility (Cinzel/Cormorant thin weights fail under ~14 px; use semibold or reserve for headings).
5. Two type voices only: one display face with character, one plain readable body; numerals set in the display face, tabular. Optional third: a handwritten face for ONE kind of line (flavour/whisper), never for data.
6. Voice is part of the look: short, concrete nouns from the world, one whisper line under a plain label so first-time players still understand.
7. Phone-friendliness: tap targets at least 44 px (Apple HIG 44 pt, Material 48 dp; known guidelines, not re-fetched), text at least 11 px (we use 12-13 px floors for body), safe-area insets, nothing that needs hover.

## 4. Fonts shortlist (all OFL 1.1, verified above; self-host woff2, Latin subset, font-display swap, no CDN at runtime)
| Role | Take A "Wick & Vellum" | Take B "Lantern Glass" |
|---|---|---|
| Display / headings / numerals | Fraunces (soft warm serif; use a static bold instance, NOT the whole variable file, to save size) | Cormorant Garamond SemiBold/Bold (caps with letter-spacing for titles; do not use Light below 16 px) |
| Body / labels | Alegreya Sans (humanist, warm, good small) | Figtree (clean, very legible small, tabular numerals) |
| Whisper / flavour | Caveat at 15 px and up only | Cormorant Garamond Italic (no extra file family) |
Rejected: IM Fell English (licence fine, but its rough print texture drops legibility below ~16 px; maybe the logo only); Cinzel (already in doc 13, now seen as the generic fantasy-caps choice); Google Fonts CDN (privacy and offline; self-host only).
Size budget estimate: subset woff2 around 15-30 KB per weight; about 4-5 files, roughly 100-150 KB, base64 inside the single-file build (OPINION; measure at build time).
Mock-ups in this sheet use INSTALLED STAND-INS (Constantia, Candara, Ink Free for A; Garamond, Corbel for B) because downloading font files needs Matt's yes. Real fonts are slightly different in width and weight; proof renders must be redone with the real files before locking.
