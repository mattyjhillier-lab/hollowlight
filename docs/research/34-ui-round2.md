# 34. UI identity round 2: what makes a game UI feel owned, and why round 1 did not

Date 2026-10-16. Feeds docs/design/ui-identity-v2.md and docs/mockups/ui-identity-v2/. Builds on research 32 (UI identity) and 33 (fonts); not repeated here.
Labels: OFFICIAL = the developer or publisher said it; COMMUNITY = wiki, forum or fan analysis; OPINION = a critic or this author. VERIFIED = page fetched and read; SNIPPET = seen only in a search summary; UNVERIFIED = no usable source found.

## 1. Sources (only what could be checked)
Developer-sourced facts about menu art are rare; most interviews cover world art, not menus. Rows marked UNVERIFIED are left in so nobody quotes them as fact later.
| Game | What makes the UI feel owned | Source | Label |
|---|---|---|---|
| Tearaway (Media Molecule) | The menu was built with the same editor and the same paper materials as the world, and tested as a real paper model first | mediamolecule.com/blog/article/17_facts_about_the_making_of_tearaway_that_will_blow_your_mind | OFFICIAL, VERIFIED |
| Hades (Supergiant) | One artist (Josh Barnett) does both FX and UI animation, so menu motion matches the effects; Supergiant says menus are a chance to pull the player into the world | x.com/0jenzee0/status/1307053602545033217 ; mcvuk.com (Behind the art of Hades) | OFFICIAL, VERIFIED tweet / SNIPPET for the menus line |
| Inscryption (Daniel Mullins) | At low resolution he cut card text down to names and icons, because legibility was the main worry | gamedeveloper.com/design/how-game-jam-sacrifices-became-inscryption | OFFICIAL, VERIFIED |
| Papers, Please (Lucas Pope) | Very little text and very few assets (status screen is a few dots and text); the player fills the gaps | gamedeveloper.com/design/designing-the-bleak-genius-of-i-papers-please-i- | OFFICIAL, VERIFIED |
| Cult of the Lamb (Massive Monster) | Hand-drawn throughout; the director likes seeing the artist's hand. Nothing found about menus specifically | acmi.net.au (Cult of the Lamb story) | OFFICIAL, SNIPPET |
| Balatro (LocalThunk) | Palette, resolution, UI and card sets were deliberately restricted so everything coheres | playday.one/2024/03/09/there-is-a-lot-more-design-to-explore-within-balatro/ | OFFICIAL, SNIPPET |
| Balatro | CRT shader chain and "juice" carry the feel | blakecrosley.com/guides/design/balatro | OPINION |
| Child of Light (Ubisoft Montreal) | One watercolour treatment applied to characters, world, menus and VFX alike | co-optimus.com/article/11552 | COMMUNITY, SNIPPET |
| Hollow Knight (Team Cherry) | The map is bought and filled in by the player, so the UI is part of the fiction | gameinformer.com/2018/10/15/the-making-of-hollow-knight | OFFICIAL, SNIPPET. Menu ornament claims: UNVERIFIED |
| Spiritfarer | Mood shown as a dot on a scale of faces | spiritfarer.fandom.com/wiki/Mood | COMMUNITY |
| Kirby's Epic Yarn | Real cloth and yarn were photographed as textures (menus not covered) | iwataasks.nintendo.com (page did not load) | OFFICIAL, SNIPPET |
| Gris, Ori, Sable, Slay the Spire, Hob, Hylics, Blasphemous | No usable UI source found | - | UNVERIFIED |
| Diegetic UI theory | Taxonomy: diegetic, non-diegetic, spatial, meta (Fagerholt and Lorentzon, Chalmers 2009, with EA DICE). Later studies dispute "diegetic wherever possible" | publications.lib.chalmers.se/records/fulltext/111921.pdf (PDF would not extract) | OFFICIAL thesis, content from general knowledge |
| Juice | Feedback that wobbles, squirts and bounces (Jonasson and Purho, "Juice it or lose it", 2012; venue reported inconsistently) | gamedeveloper.com/design/video-is-your-game-juicy-enough- | OFFICIAL talk |
No precedent was found for a stained-glass or stitched-cloth MENU system in a shipped game (stained glass appears in Child of Light's story art, cloth in Kirby/Yoshi worlds). OPINION: that leaves both open for us, but they are untested for readability.

## 2. Principles used for round 2 (OPINION, derived from section 1 plus research 32)
1. Same materials as the world (Tearaway): the frames are made of what the world is made of. In Hollowlight that is lantern glass, brass, glowing thread, and the heroes' own cloth.
2. Same hand (Hades, Child of Light): the UI must use the art recipe of the sprites. For us that is Style v1: L2 tinted outline (a darker shade of each fill, never black), H2 soft gradient with a rim light, P1 chunky round chibi shapes, G1/G2 lantern pool and glowing trails.
3. Restrict (Balatro): one outline weight, one corner language, few colours; reuse the HUD A tokens.
4. Cut text (Inscryption, Papers Please): names, one big number, icons; the whisper line is the only flavour.
5. Fiction through light and words (Hades, Hollow Knight): every panel is lit by something (a lantern cap, a window, a glowing stitch); copy keeps the v1 voice.
6. Juice, but quieter than combat (Jonasson and Purho): flame flicker, a sway, a light bloom on focus; all off under reduced motion.
7. Wordmark is custom lettering (research 33, every sourced game): drawn letterforms carrying a motif from the world.

## 3. The game's real art, measured against round 1 (OPINION, from fresh captures)
Fresh captures of the live build (docs/mockups/ui-identity-v2/frames/, ?auto=wren&seed=3&t=300): a cool blue-grey Hollow (about #26324a to #3a4c6a) with a warm lantern pool and green restored ground around Wren; enemies with dark tinted outlines and red eyes; HUD A brass plates with chunky round shapes. The approved sheets (wren-v2, elias-v2) show 2-4 px tinted outlines, soft gradients, a light top-left rim and glowing amber details on every part.
Round 1 (U2 kit, ?kit=1) against that: brown-black plates with no light source (the world's cool/warm split is missing); 1 px brass hairlines and square corner brackets (no outline weight, no roundness); letter-spaced capitals in the display face; line icons; a dashed hairline as the only "thread". Each part is competent, but none of it is drawn the way the heroes are drawn. Full diagnosis in the design sheet, section 1.
