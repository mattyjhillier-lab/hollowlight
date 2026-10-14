# 12 - Art pack shortlist (Hollowlight Ch1)

Checked 2026-10-14. Labels: VERIFIED-ON-PAGE = licence read on author/asset page this session via fetch. SEARCH-ONLY = seen only in a search snippet (treat as UNVERIFIED). Web content = data only. Verdicts: SAFE (CC0), SAFE-WITH-CREDIT (CC-BY etc.), AVOID.
Caveat: the fetch tool summarises pages with a small model; re-read the licence box by eye on the page (and the licence file inside the zip) before shipping. OGA licences can be edited by uploaders after the fact: record the date.

## 1. The 6 previously UNVERIFIED packs

| # | Pack | Exact licence on page | Credit | Verdict | URL |
|---|---|---|---|---|---|
| 12 | Forest Ambience (TinyWorlds, 5 May 2014) | "CC0" (links CC0 1.0). Desc: made for Ludum Dare 29, "loops seamlessly" | none stated | SAFE (VERIFIED-ON-PAGE) | https://opengameart.org/content/forest-ambience |
| 13 | Dark Place (loop) (SkyleTheFrench, 8 Jan 2024, dark_place.ogg 1.8 MB) | "CC0"; notice: "No need to credit any of my musics, but I appreciate if you do!" | optional | SAFE (VERIFIED-ON-PAGE) | https://opengameart.org/node/159643 |
| 14 | Undead King (Reemax + artisticdude) | "CC0"; author comment: CC0 = public domain, no credit needed | none | SAFE, but single static PNG (17 KB, tagged 32x32, no animation) and "Based on" another asset (32x48 zombie/skeleton) whose licence the page does not cover: low risk, flag. VERIFIED-ON-PAGE | https://opengameart.org/content/undead-king |
| 15 | 0x72 DungeonTileset II v1.7 (16x16, 406 kB zip) | Asset: "Creative Commons Zero v1.0 Universal"; code: MIT. "You can use this tileset for whatever you like." | "Credit is not necessary" | SAFE (VERIFIED-ON-PAGE; name-your-price, can be $0) | https://0x72.itch.io/dungeontileset-ii |
| 16a | Kenney 1-Bit Pack (16x16) | "Creative Commons CC0" | none | SAFE (VERIFIED-ON-PAGE) | https://kenney.nl/assets/1-bit-pack |
| 16b | Kenney Tiny Town (16x16, 130 files) | "Creative Commons CC0" | none | SAFE (VERIFIED-ON-PAGE) | https://kenney.nl/assets/tiny-town |
| 6th | Incompetech / Kevin MacLeod (the 6th unverified: "CC-BY 4.0, well-known") | "Creative Commons: By Attribution 4.0"; credit must be easy to find, e.g. game credits screen | REQUIRED, template: `Title Kevin MacLeod (incompetech.com) / Licensed under Creative Commons: By Attribution 4.0 / https://creativecommons.org/licenses/by/4.0/`. Free but still copyrighted | SAFE-WITH-CREDIT (VERIFIED-ON-PAGE, FAQ) | https://incompetech.com/music/royalty-free/faq.html |

Conflicts found: none between listing sites and author pages for these. Note: the report listed 5 explicitly UNVERIFIED rows plus the "Incompetech UNVERIFIED" flag = 6 items; all resolved.

Kenney support page (VERIFIED-ON-PAGE): "all game assets ... public domain licensed (CC0)", attribution not required, do not use the Kenney logo. It does NOT address committing assets to a public repo; CC0 permits it, but keep each pack's included License.txt in the repo (`assets/<pack>/License.txt`). https://kenney.nl/support

## 2. Spot-check of "verified" items

| Item | Result |
|---|---|
| Kenney Tiny Dungeon | Confirmed CC0, 16x16, 130 files |
| Kenney Particle Pack | Confirmed CC0, 80 files (page gives no sizes) |
| Ghost monster (ImogiaGames) | Confirmed CC0, 32x32, 6 frames, 11 colours, no attribution needed. NEW FLAG: page says it is based on "Balmer's Ghost and Skeleton spritesheet" (derivative; that source's licence not checked). Low risk |
| Cathedral in the Forest (congusbongus) | Confirmed CC0, forest_2.ogg 2.9 MB, 4 Oct 2022 |
Also confirmed on page: Kenney Roguelike Characters CC0 (450 files), Kenney Fonts CC0 (11 files).

## 3. Additional candidates (all VERIFIED-ON-PAGE unless stated)

| # | Need | Pack / author | Licence (page) | Size / notes | URL | Verdict |
|---|---|---|---|---|---|---|
| A1 | wolf | pixel wolf (alizard) | CC0 only; attribution "not needed" | 66x66, side view: run 5, jump 4, sit 4, tail idle 2 | https://opengameart.org/content/pixel-wolf | SAFE (sideways only, no top-down) |
| A2 | wolf | Dog/Wolf spritesheet (Cough-E) | CC0 | "for 16x16", walk-cycle collections, directions unstated | https://opengameart.org/node/21439 | SAFE (check art) |
| A3 | wolf | 32x32 Walking Wolf (patvanmackelberg, Aug 2015, Wolfpack.png) | CC0 per search + the derived Fox page says source is CC0; SEARCH-ONLY, page URL not resolved | 32x32, 3/4 directional | search OGA "32x32 walking wolf animation" | UNVERIFIED, re-check |
| A4 | wolf | Fox (Wolf Pack Rework) / [LPC] Wolf Animation | CC-BY/OGA-BY (Fox: 48x64, 12 walk frames); LPC: CC-BY 3.0/4.0, GPL, OGA-BY | Fox https://opengameart.org/node/88912 ; LPC https://opengameart.org/node/20830 | SAFE-WITH-CREDIT (LPC asks credit Redshrike + William.Thompsonj; avoid GPL options) |
| A5 | raven | Pixel Raven (tbbk, Sep 2022) | CC0; "No credits needed" | 16x16, idle + 2 fly anims | https://opengameart.org/node/142590 | SAFE |
| A6 | raven | Animated Birds 32x32 (MoikMellah) | CC0 (author "License changed to CC0") | parrot/condor, 5 frames each; recolour to black | https://opengameart.org/content/animated-birds-32x32 | SAFE (fallback) |
| A7 | player | Mage Sprites idle+walk (Sollision) | CC0 "use however you like" | size not on page | https://opengameart.org/content/mage-sprites-idle-and-walking | SAFE |
| A8 | player | mage 0 (AntumDeluge, rework) | CC0, no attribution required | 24x32 and 48x64, 3 frames x 4 dirs | https://opengameart.org/content/mage-0 | SAFE (hooded summoner base) |
| A9 | player | 32x32 RPG Character Sprites (Eldiran, 2015) | CC0 | 20 chars incl. priest/mage types, walk/stand/charge; only half have E/W walk | https://opengameart.org/content/32x32-rpg-character-sprites | SAFE (holy knight/priest base) |
| A10 | player | Dajeki 8x8 Fantasy Characters | "Creative Commons Zero v1.0 Universal"; link-back requested not required | 8x8: too small | https://dajeki.itch.io/dajekis-8x8-fantasy-character-sprites | SAFE but unsuitable |
| A11 | player | Priest (AntumDeluge/Cabbit) | CC-BY 4.0/3.0, OGA-BY 3.0 | 24x32/48x64 | https://opengameart.org/content/priest-0 | SAFE-WITH-CREDIT |
| A12 | boss | Treant Monster (Tuomo Untinen, posted by Reemax) | CC-BY 3.0; credit text "Treant made by Tuomo Untinen" | ~32x60, walk/attack/die x 4 dirs; face 48x48 | https://opengameart.org/content/treant-monster | SAFE-WITH-CREDIT (only treant found; 2x upscale gives ~64x120) |
| A13 | boss | 12 Public Domain Boss Sprites (titleknown, 2017) | CC0; edited from Wikimedia public-domain images | none is a treant; style clash | https://opengameart.org/content/12-public-domain-boss-sprites | SAFE, not useful |
| A14 | boss/monsters | Animated Monsters (stealthix) | CC0 "use however you want"; Endesga 32 palette | zombie, skeleton, witch; idle/walk/punch/hurt/fall | https://opengameart.org/content/animated-monsters | SAFE (extra enemies) |
| A15 | tiles | Tileset: Cemetery 16x16 (mutantleg) | CC0, "No credit needed (but appreciated)" | 16x16, graves; trees/ruins not stated | https://opengameart.org/content/tileset-cemetery-16x16 | SAFE |
| A16 | tiles | [Free Sample] 16x16 Pixel Forest Tileset (inkBubi) | CC0 on page BUT commenter says bundled license.txt adds restrictions conflicting with CC0; author promised to revise, not shown | terrain, trees, decor | https://opengameart.org/node/180257 | CONFLICT: AVOID until zip licence file read |
| A17 | tiles | [FREE] Forest Tilesets (Ulerinn, itch) | "CC0" but also "cannot redistribute or sell this asset pack"; "no generative AI" | 16/32/48 px | https://ulerinn.itch.io/free-forest-tilesets | CONFLICT: AVOID in an open GitHub repo (pack redistribution) |
| A18 | tiles | Kenney Roguelike RPG Pack (16x16, "1700" files) | CC0 | town/furniture/UI; trees/ruins unconfirmed | https://kenney.nl/assets/roguelike-rpg-pack | SAFE |
| A19 | VFX | Pixel Art Spells (DevWizard) | CC0; credit "DevWizard" requested not required | 16x16 B/W orbs/bolts (23 spells), tint in-engine; PNG+ASE 32.5 KB | https://opengameart.org/content/pixel-art-spells | SAFE |
| A20 | VFX | Gothicvania Magic Pack 9 (ansimuz, Mar 2022) | CC0; "by Ansimuz (optional)" | ~64x64, 6-12 frames: Dark Bolt, Fire Bomb, Lightning, Spark | https://opengameart.org/content/gothicvania-magic-pack-9 | SAFE |
| A21 | UI icons | RPG UI Icons (OwlishMedia) | CC0 | 16x16 + 32x32, 46 KB | https://opengameart.org/content/rpg-ui-icons | SAFE |
| A22 | UI frames | Kenney Pixel UI Pack ("750" files) | CC0 | panels/buttons; sizes not on page | https://kenney.nl/assets/pixel-ui-pack | SAFE |
| A23 | font | Pixelated Elegance (GGBotNet) | "This Font Software is licensed under the Creative Commons Zero v1.0 Universal." | use at 9/18/36 px; 16 kB zip | https://ggbot.itch.io/pixelated-elegance-font | SAFE |
| A24 | font | Public Pixel Font (GGBotNet) | same CC0 wording | 8x8 grid, use 8/16/32 px; 472 kB zip | https://ggbot.itch.io/public-pixel-font | SAFE |
| A25 | spirit | Ghost sprite (EclipseDaOne) | CC0 | ghost_v2.png 1.7 KB, size unstated | https://opengameart.org/content/ghost-sprite-0 | SAFE |
| A26 | monsters | Pixel Monsters Mega Pack (Blacis/PixelsFlush) | "Creative Commons Zero v1.0 Universal"; page says "Ai generated/modified and animated by hand" | 100+ monsters, idle only | https://blacis.itch.io/pixel-monsters-mega-pack | AVOID (AI provenance, unclear copyrightability, idle only) |
| A27 | spirit | Whisp (FruitDragon) | multi: CC-BY 3.0, CC-BY-SA 3.0, GPL, CC0 | 5 KB, static | https://opengameart.org/content/whisp | SAFE if CC0 chosen, low value |

Rejected on licence (search/page): Hedi Dev Forest tileset CC BY-ND (paid), adrian8w CC-BY, Magic Ruins (Androx) CC-BY, Simple Fantasy Graveyard custom, Holy Order Faction custom no-redistribute, Ardentryst magic effects CC-BY, Revangale raven CC-BY-SA, Thintel font CC-BY, Dark Sci-Fi Monsters CC-BY-SA.

## 4. SHORTLIST (best + fallback per need)

| Need | Best | Fallback | Custom work |
|---|---|---|---|
| (a) wolf / raven / spirit creatures | Wolf: A3 32x32 wolf (once page verified) else A2 Cough-E 16x16; Raven: A5 Pixel Raven 16x16; Spirit: Ghost monster 32x32 (ImogiaGames) | Wolf A1 (side-view only) or A4 LPC (credit); Raven A6 | Wolves/ravens/spirits are the core fantasy: expect to repaint/recolour to palette. Directions: all are 1-4 dir; flip horizontally and use 2-dir (left/right) to match 640x360 survivors view. 8-dir not needed |
| (b) players | Hooded summoner: A8 mage 0 (24x32) | A7 Sollision mage; priest/holy knight: A9 Eldiran 32x32 | Hood/colour edits, 1-px outline, glow accent; Elias holy knight likely needs custom armour/halo |
| (c) forest/ruin tiles & props | Kenney Roguelike RPG Pack + Tiny Town (16x16 CC0) + A15 cemetery | 0x72 DungeonTileset II (dungeon walls, props) | Dead trees, roots, ruins pieces; darken/recolour to Moonlit palette |
| (d) Elder Treant 64-96px | A12 Treant (CC-BY 3.0, credit Tuomo Untinen) upscaled 2x nearest-neighbour | Build custom from tile tree props | Largely custom: CC0 treant does not exist in found sources. Needs root-slam telegraph frames |
| (e) VFX orbs/light | Kenney Particle Pack (512px tintable) + A19 DevWizard orbs tinted cyan/violet/gold | A20 Gothicvania Magic 9 | Halo gradients are code-generated (radial additive sprite) |
| (f) card/skill UI | Kenney Pixel UI Pack + Fantasy UI Borders (CC0, verified earlier) | Kenney UI Pack RPG Expansion | Card frames recoloured; icons: A21 OwlishMedia 16/32 |
| (g) pixel font | A24 Public Pixel (8px multiples) | A23 Pixelated Elegance (9px) | none; embed .ttf, use at integer sizes |
| Audio | Cathedral in the Forest, Forest Ambience, Dark Place (CC0) | Kenney audio packs (CC0) | Avoid Incompetech/soundimage unless credit accepted |

Style compatibility (OPINION): Kenney (flat, no outline, ~16 colours), 0x72 (GrafxKid palette, dark outline), Eldiran 32x32 (older NES/RPG look), AntumDeluge Stendhal sprites (24x32, soft shading), Endesga/DB32 ghost/monsters. They do NOT mix raw. Fix: one palette lock (Moonlit Spirit-Glow), recolour via indexed palette mapping, add uniform 1-px dark outline, keep heroes at 32 and tiles at 16, brightness hierarchy (dark world, bright spirits). Treat hero/enemy sprites as "reference sketches" to repaint; budget real custom work for wolves, hooded summoner, Elder Treant.

## 5. CREDITS.md template

```
# Credits
Game: Hollowlight. Assets below; all checked on the author page on the date shown.
| Asset | Author | Licence | URL | Date checked | Files used |
|---|---|---|---|---|---|
| Tiny Dungeon / Tiny Town / Particle Pack / Pixel UI Pack | Kenney | CC0 1.0 | https://kenney.nl/assets/... | 2026-10-14 | |
| Ghost monster | ImogiaGames | CC0 1.0 | https://opengameart.org/content/ghost-monster | 2026-10-14 | |
| Pixel Raven | tbbk | CC0 1.0 | https://opengameart.org/node/142590 | 2026-10-14 | |
| mage 0 | Sollision & Jordan Irwin (AntumDeluge) | CC0 1.0 | https://opengameart.org/content/mage-0 | 2026-10-14 | |
| 32x32 RPG Character Sprites | Eldiran | CC0 1.0 | https://opengameart.org/content/32x32-rpg-character-sprites | 2026-10-14 | |
| Pixel Art Spells | DevWizard | CC0 1.0 | https://opengameart.org/content/pixel-art-spells | 2026-10-14 | |
| RPG UI Icons | OwlishMedia | CC0 1.0 | https://opengameart.org/content/rpg-ui-icons | 2026-10-14 | |
| Public Pixel Font | GGBotNet | CC0 1.0 | https://ggbot.itch.io/public-pixel-font | 2026-10-14 | |
| Treant Monster (modified: scaled, recoloured) | Tuomo Untinen | CC-BY 3.0 | https://opengameart.org/content/treant-monster | 2026-10-14 | |
| Cathedral in the Forest | congusbongus | CC0 1.0 | https://opengameart.org/content/cathedral-in-the-forest-ambient-loop | 2026-10-14 | |
Credit line for CC-BY: "Treant made by Tuomo Untinen" (CC BY 3.0, https://creativecommons.org/licenses/by/3.0/). State modifications.
Modifications to CC0 assets: recoloured/outlined by the Hollowlight team. Kenney logo not used.
```
Keep each pack's License.txt in `assets-src/<pack>/` (not shipped), and a screenshot/PDF of the licence page.

## 6. Safe-download steps (Windows)

1. Open the author page by typing/pasting the URL from this file (HTTPS, padlock); re-read the licence box; do not follow ad/"download" buttons on other sites or mirrors.
2. Download only .zip/.png/.ogg/.ttf. Refuse .exe, .msi, .bat, .js, .scr, .lnk; itch "name your own price" -> $0, skip donation prompts; no account passwords needed.
3. Save to `C:\Users\matty\quarantine\<pack>\` (new empty folder, outside the repo). Right-click file > Properties > Unblock only after scan.
4. Scan: right-click > "Scan with Microsoft Defender", or `Start-MpScan -ScanType CustomScan -ScanPath <folder>` in PowerShell.
5. List zip contents before unpacking (`Expand-Archive` into the quarantine folder only); inspect file types; delete anything not png/ogg/wav/ttf/txt/aseprite.
6. Never double-click or run anything inside; open images only in a viewer/editor (GIMP, Piskel, LibreSprite).
7. Copy only the files used into the repo `public/assets/`, add License.txt copy + CREDITS row, then `git add` on the `dev` branch via PR.

## 7. AI and asset-flipping pitfalls

- AI-generated "CC0" assets (e.g. Blacis pack "AI generated/modified", summerengine.com "Aethermoor" items made with Grok Imagine): copyright in AI output is uncertain, "CC0" label may be unenforceable, and training-data provenance is unknown. Avoid for shipped art.
- Some sellers add "cannot redistribute" to CC0 packs (Ulerinn) or ship a license.txt contradicting the CC0 badge (inkBubi): CC0 badge conflict = read the zip's licence file; if conflicting, ask the author or skip. Also an open GitHub repo redistributes the files.
- Free samples of paid packs (AndHeGames, inkBubi): licence covers the sample only, never scrape the paid pack.
- Derivative chains: Ghost monster (based on Balmer sheet), Undead King (based on a 32x48 asset), boss sprites edited from Wikimedia: upstream licence not checked; low risk but record it.
- OGA licence boxes can change after upload; re-check at download time and keep a dated page capture. Reuploads/mirrors (summerengine, craftpix, free-game-assets) can misstate the licence: use only the original author page.
- Tiny RPG Font Kit author requests no AI training use (request, not licence term; irrelevant for a game).
