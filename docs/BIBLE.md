# Hollowlight: Spirits of the Dusk - Creative Bible (DRAFT v0.1)

Status: draft for Matt to react to, cross out and rewrite. UPDATE 2026-10-14: Matt says designs do NOT have to follow this bible; he is happy for ANY ideas that fit the game (identity, mechanics, style). Treat the bible as a starting point, not a constraint. Nothing here is locked until Matt says so. Everything is visual or flavour unless marked GAMEPLAY (those need Matt's OK, per CLAUDE.md).
Builds on: CLAUDE.md (locked design), docs/IDENTITY.md (The Hollow, life map), src/data/*.json, docs/research/10-bosses-and-enemies.md.

---

## 1. The fantasy

**One-line pitch:** Hold back one endless night with the light of the dead, and paint a grey world back into colour before dawn.

**The fantasy in one paragraph.** You are a Hollowlighter: one of the few living people the dead still trust. The world has been drained grey by the Hollow, and every night it creeps further. You walk into it carrying a small warm light, and the spirits of those who died there come to fight beside you: wolves, ravens, saints' lights, storms. Wherever they run, colour comes back. Wherever the Hollow's creatures crawl, the ground cracks and goes dark. You cannot aim and you cannot hide; you can only move, choose your spirits, and last. If you last until dawn, the sun comes up over the patch of land you saved and the whole screen floods with colour. That moment is the reward the whole run is building to.

**Tone pillars**
| Pillar | What it means | What it rules out |
|---|---|---|
| Tender, not grim | Sad world, kind heroes. The dead help because they love the living. | Gore, torture imagery, edgy skulls-for-the-sake-of-it |
| Light is warmth | Light is the only warm thing in the world. Every glow should feel like a hand on your shoulder. | Neon cyber glow, rave colours, light used as "cool effect" |
| Colour is earned | The hollow world is grey on purpose; colour appears only where you fought for it. | Saturated backgrounds, colourful enemies |
| Folk, not epic | Village people: an orphan, a priest, a gravedigger, a lamplighter. Hand-made props. | Chosen-one armour, glowing runes on everything, "dark lord" posturing |
| Readable at a glance | Every hero, spirit and enemy has one shape and one tell you can read at 40px in a crowd of 300. | Detail soup, recolours, same-y blobs |

**What Hollowlight is NOT**
- Not a "Vampire Survivors clone": no garlic/whip/bible joke items, no slot-machine chests, no screen-filling particle vomit by minute 10. Our late game should look like a glowing painting, not a firework accident.
- Not generic dark fantasy: no blood-red-and-black palette, no spiky armour, no gothic-font logo with a skull.
- Not cute-chibi: proportions are stylised (big heads, small hands are fine) but the mood is quiet and a bit sad.
- Not a weapon game: there are no swords and guns. Everything is a spirit you called or a power you were given.
- Not silent about its world, but never wordy: the story lives in the ground, the light and the dawn (section 2).

---

## 2. The Hollow

### Origin myth (~150 words, in-world voice)
> Long ago, colour was simply what life looked like from the outside. Every leaf, wolf and person held a little light, and the sun came back each morning to top it up. Then came the Long Dusk. Something underneath the world - people call it the Hollow - woke up hungry and began drinking colour the way roots drink water. Where it drank, things went grey, then empty, then wrong: the wolves still hunt, but nothing is home behind their eyes. The sun stopped rising over drained land, because there was nothing left there to rise for. But the light of the dead did not go into the Hollow. It stayed, waiting for someone living to carry it. Those people are Hollowlighters. Each night they walk into the grey with their spirits. If they keep the light burning until dawn, the sun remembers that place, and colour comes back for good.

**What the words mean in game**
| Term | Meaning | Where you see it |
|---|---|---|
| The Hollow | The hunger under the world. Never shown as a face until chapter 8. | Grey ground, dark cracked veins, empty-eyed enemies |
| Dusk | The hour the Hollow wakes. Every run starts at dusk. | Title screen, run start: last orange sliver on the horizon fades |
| A run | One night. | Run timer is a moon arc, not just a clock |
| Dawn | The sun returning because enough life was restored. | Victory: colour flood (signature moment 9) |
| Spirits | Light of the dead who chose to stay. Not ghosts in sheets: light shaped like what they loved. | All weapons |
| Hollowlighter | A living person spirits will follow. The heroes. | Hero select |

### World rules (things the art and code can express)
1. **Colour = life.** Grey means drained, not dead-yet. Saturation on the ground is a direct readout of the life map.
2. **Light is the only warmth.** All warm colours (amber, candle white) come from heroes and spirits. The hollow world is cool grey. Enemies give off no warm light at all; at most a cold pinprick in their eyes.
3. **Corruption has veins.** The Hollow does not stain like paint; it spreads like roots or cracks in ice: dark branching lines that thicken into dead patches.
4. **Spirits leave something behind.** Every spirit trail fades slowly, so a run leaves a visible mural of where you fought.
5. **Nothing the Hollow touches has a face.** Hollowed creatures have smooth or cracked-over faces with only eye-points. Heroes and spirits always have readable faces or shapes.
6. **Gold is a promise.** Gold light only appears at evolutions (and the dawn sun). If a player sees gold, something great just happened.
7. **Dawn is total.** At victory, every grey thing in view becomes coloured, even if you never touched it. The sun is generous.

### Three ways the myth appears without text
1. **Environment storytelling.** Grey props tell the story of the moment colour was drained: a village well with the bucket still half-raised; a wolf den with grey pups curled asleep (they wake into colour when your light passes, then trot off - pure visual). Around the map edge, small "already saved" patches from earlier runs stay coloured (persistent, ties to save system later).
2. **UI as a lantern.** The HP bar is the hero's lantern flame, the XP bar is a thread of spirit light filling, the run timer is a moon sinking along an arc toward a thin line of dawn. At low HP the whole UI frame frosts grey at the edges: the Hollow is reaching for you.
3. **Victory dawn.** The run does not end on a "You Win" card. The sun crests the edge of the screen, a wave of colour rolls across the map from that side, grey enemies crumble into ash that blows away, and only then the results slide in.

---

## 3. Heroes

**Role-colour scheme for hero accents** (each hero owns exactly ONE accent, used on one prop or cloth piece; the rest of the hero is warm-neutral cloth, leather, skin):
| Role family | Heroes | Accent family |
|---|---|---|
| Beastcallers (summon creatures) | Wren, Mara, Kael | Warm amber / rust |
| Lightbearers (holy, guarding light) | Elias, Thomas, Sister Agnes | Candle white / pale gold-free cream |
| Stormcasters (raw magic) | Isolde, Captain Vane | Cyan / storm blue |
| Deathspeakers (grave magic) | Gideon, the Hollow One | Bone green / violet |

Shape language per hero is intentionally different: round, square, triangle, tall-thin, wide-low, bell, cage, and one "missing" shape.

### Wren, the Orphan - Ghost Wolves (EMOTIONAL CENTRE)
| Field | Design |
|---|---|
| Role | Fast, fragile beastcaller; the starter hero and the face of the game. |
| Backstory hook | When the Hollow came for her village, the wolf pack that lived in the hills stood between it and her, and died there. Their light did not leave; it has been following her ever since. |
| Personality | Small, stubborn, talks to her wolves, never to people. Not trying to save the world - trying to keep her family. Brave because she is terrified of being alone again. |
| Silhouette | Round and small (smallest hero, ~70% of Elias's height). Oversized hand-me-down coat, sleeves rolled. Shape language: round, soft, forward-leaning. |
| Signature prop | A long amber scarf (knitted, frayed) that streams behind her at roughly twice her body length when she runs. A bone whistle on a cord. |
| Accent | Amber #e8b86d (scarf only). |
| How she summons | She does not command: she whistles and the pack comes. Wolves form out of the scarf's trail as if the light unravelled from it, then run ahead. Ghost wolves are pale moon-blue, but each has a tiny amber thread trailing from its neck back to her. |
| Active: Pack Howl | Wren throws her head back; the whistle sounds, a ring of amber light pulses out, every wolf flares bright and howls in sync, and her scarf lifts straight up like a flame. Enemies in range visibly flinch and turn away. |
| Idle / move | Idle: crouches and scratches a wolf behind the ear (the wolf leans in). Move: quick, light, slightly too-big steps; she looks back over her shoulder to check the pack every few seconds. |
| 40px tell | The amber scarf streak. No other hero has a long trailing line of warm colour. |
| Heart beat | Chapter 1's enemies are hollowed wolves - her pack's kin. When she kills one, a tiny pale spark rises from it and drifts to her pack (visual only; GAMEPLAY idea parked: pack grows). This is the emotional engine of the game. |

### Elias, the Priest - Holy Orbit
| Field | Design |
|---|---|
| Role | Sturdy defender; slow, steady, hard to kill. |
| Backstory hook | His church burned its last candle on the night of the Long Dusk. He walked out with the iron candle-wheel from the ceiling on his back and has kept it lit ever since. |
| Personality | Calm, warm, a bit tired. Jokes quietly. The grown-up of the cast. |
| Silhouette | Square and broad, heavy robe hanging straight down like a column. |
| Signature prop | A large iron candle-wheel (chandelier ring) strapped to his back like a halo-frame. |
| Accent | Candle cream #f2efe2 (robe stole). |
| How he casts | Orbs are candle flames that lift off the wheel and circle him. When idle they sit back in their sockets on the wheel. |
| Active: Sanctuary | Plants the wheel flat on the ground; it spins and drops a ring of warm light into the soil; ground inside blooms with colour instantly. |
| Idle / move | Idle: hands folded, eyes closed, mouths a prayer. Move: slow heavy walk, no wasted motion, never runs. |
| 40px tell | The ring on his back (a circle behind a square). |

### Mara, the Letter-Carrier - Raven Flock
| Field | Design |
|---|---|
| Role | Mid-range crowd control; ravens guard a circle around her. |
| Backstory hook | She carried post between villages. When the villages went grey, ravens started bringing her the letters the dead never got to send. She still delivers them. |
| Personality | Dry, sharp-tongued, secretly sentimental. Reads the letters at night. |
| Silhouette | Asymmetric: one huge mail-cape over her left shoulder that hangs like a folded wing; right side lean. Wide flat-brimmed hat. |
| Signature prop | A satchel overflowing with letters; a raven always sits on the hat brim. |
| Accent | Rust #c0643a (wax seals and hat band). |
| How she summons | Unbuckles the satchel; letters fly up and fold into violet ravens mid-air. |
| Active (proposed): Black Sky | Throws the whole satchel open; the sky over her darkens with violet wings for 5s; enemies inside are blinded (wander randomly). |
| Idle / move | Idle: sorts letters, tucks one behind her ear. Move: brisk long stride, cape flapping on one side only. |
| 40px tell | Lopsided shape: one big wing-cape, plus the raven on the hat. |

### Isolde, the Archivist - Spirit Bolts
| Field | Design |
|---|---|
| Role | Glass-cannon caster; precise, high single-target damage. |
| Backstory hook | Keeper of the last library, where every name of the dead was written down. The names glow now, and she can read them out loud into light. |
| Personality | Precise, formal, quietly furious at the Hollow for erasing people. Never raises her voice. |
| Silhouette | Tall thin triangle: high stiff collar, narrow shoulders, long skirt flaring at the base. |
| Signature prop | An open book that floats at her shoulder, pages turning by themselves. |
| Accent | Cyan #7ff0ff (book edges and ink). |
| How she casts | Reads a name; a single glowing letter-glyph tears off the page and becomes a homing bolt. |
| Active (proposed): Recitation | Book flies up and opens wide; every page fires at once in a spiral volley. |
| Idle / move | Idle: reads, adjusts glasses, turns a page with one finger. Move: glides upright, almost no bounce. |
| 40px tell | The floating book: a small bright rectangle hovering off her shoulder. |

### Thomas, the Lamplighter - Lantern Wisps
| Field | Design |
|---|---|
| Role | Support/area; his wisps restore colour fastest of all heroes. |
| Backstory hook | An old lamplighter who lit the town's streetlamps for fifty years. The town is gone; he still lights the lamps, and the lamps still answer. |
| Personality | Gentle, chatty, a little forgetful. The grandfather of the cast. |
| Silhouette | Hunched, round-backed, with a tall vertical line next to him. |
| Signature prop | A lamplighter's pole twice his height with a hooked top, a small lantern swinging from the hook. |
| Accent | Candle cream #f2efe2 on the lantern glass; muted green coat. |
| How he summons | Taps the air with the pole; wisps drip out of the lantern like sparks and float to nearby enemies. |
| Active (proposed): Lamplight Hour | Raises the pole; the lantern swells to a huge soft sphere; everything inside is restored to colour and enemies are slowed. |
| Idle / move | Idle: polishes the lantern, hums. Move: shuffling but steady, pole tapping the ground every step. |
| 40px tell | The tall hooked pole with a dot of light at the top. |

### Gideon, the Gravedigger - Grave Hand
| Field | Design |
|---|---|
| Role | Bruiser; ground-based area control. |
| Backstory hook | He buried the whole valley, one by one, when nobody else would. The dead remember who gave them a decent grave, and they reach up to help him. |
| Personality | Huge, silent, patient. Speaks rarely, always kindly. |
| Silhouette | Wide-low and top-heavy: massive shoulders, short legs, flat cap. |
| Signature prop | A long spade carried over one shoulder. |
| Accent | Bone green #a8c49a (lantern of grave-moss on his belt). |
| How he casts | Stamps the spade into the earth; pale green hands rise from the ground under enemies and grab. |
| Active (proposed): Open Ground | Drives the spade deep; a ring of graves cracks open around him; hands erupt all at once. |
| Idle / move | Idle: leans on the spade, wipes brow. Move: slow, heavy, ground-shaking (tiny dust puffs). |
| 40px tell | The wide flat top shape plus the diagonal spade line. |

### Captain Vane - Chain Lightning
| Field | Design |
|---|---|
| Role | Aggressive caster; damage jumps through crowds. |
| Backstory hook | Captain of a ship that sailed into the Long Dusk and came back with no crew. Her ship's lightning rod still draws storms, and she carries it everywhere. |
| Personality | Loud, reckless, funny, grieving underneath. Talks to her missing crew. |
| Silhouette | Long coat with split tails that flick sharply; tricorn hat; zig-zag shape language. |
| Signature prop | A copper lightning rod carried like a harpoon, crackling at the tip. |
| Accent | Storm blue #5aa9ff (coat lining). |
| How she casts | Points the rod; bolt leaps from tip to nearest enemy and hops. |
| Active (proposed): Stormcall | Plants the rod in the ground; it becomes a strike tower for 6s, hitting everything near it. |
| Idle / move | Idle: spins the rod, squints at the sky. Move: swaggering stride, coat tails snapping. |
| 40px tell | Diagonal rod with a spark at the tip and the zig-zag coat tails. |

### Sister Agnes - Frost Bell
| Field | Design |
|---|---|
| Role | Control; slows and freezes. |
| Backstory hook | The bell-ringer of a mountain convent. When the Hollow came, she rang the bell until it froze, and its cold sound still stops things in their tracks. |
| Personality | Stern, deadpan, deeply kind. Hates waste, including wasted lives. |
| Silhouette | Her habit flares exactly like a bell. Her whole body is a bell shape. |
| Signature prop | A hand-bell rimmed with frost. |
| Accent | Ice cream-white #e6f4f7 (bell rim, wimple edge). |
| How she casts | Rings the bell; a visible ring-wave of frost rolls out; enemies hit go pale and slow. |
| Active (proposed): Still Hour | One great toll; everything on screen freezes for 2s (enemies crack with frost lines). |
| Idle / move | Idle: hands folded around the bell, perfectly still (the stillest hero). Move: small fast steps, no bounce; she seems to slide. |
| 40px tell | The bell silhouette. Unmistakable. |

### Kael, the Bonesetter - Bone Servant
| Field | Design |
|---|---|
| Role | Summoner of one big companion; tanky pet, fragile owner. |
| Backstory hook | A travelling bonesetter who mended people for coins. When there was nobody left to mend, he mended the dead instead - and built himself a friend. |
| Personality | Nervous, clever, overly polite; the companion is his only confidant. |
| Silhouette | Thin, bent forward, with a wooden frame-pack on his back (looks like a cage or ribcage). Next to him, the Bone Servant is three times his size. |
| Signature prop | The frame-pack full of splints, string and bones. |
| Accent | Rust-amber #c98a4b (string binding everything). |
| How he summons | Pulls bones from the pack, ties them with glowing string; the servant assembles in a clatter. |
| Active (proposed): Reassemble | The servant collapses and rebuilds around Kael as armour for 6s. |
| Idle / move | Idle: fiddles with a knot, tests a joint. Move: scurrying, glancing up at his servant like a child at a parent. |
| 40px tell | Tiny hero + huge companion. Size contrast is the tell. |

### The Hollow One - Soul Harvest (unlockable, final hero)
| Field | Design |
|---|---|
| Role | High-risk final hero; gets stronger the more the Hollow spreads. |
| Backstory hook | Someone the Hollow drank completely - and who woke up anyway. They have no colour and no memory, only the habit of walking toward dawn. |
| Personality | Silent. Curious. Gentle in a strange way (touches flowers as they bloom). |
| Silhouette | Normal human shape but drawn as negative space: flat grey-black fill with a thin bright violet outline. |
| Signature prop | None. Their absence of a prop is the point. |
| Accent | Violet #b79cff (outline only). |
| How they cast | Raises a hand; enemies' souls are pulled out as violet streams and gathered into a slowly growing orb above them. |
| Active (proposed): Unmake | Breathes in; all corruption near them is sucked up into their body (life map clears to grey, not colour). |
| Idle / move | Idle: very still, head tilted. Move: walks smoothly, no arm swing. |
| 40px tell | The only hero who is dark with a glowing outline. The life map under them turns GREY, not colour - their trail is the opposite of everyone else's. |

---

## 4. Spirits and summons

Rule: each base weapon has its own light colour and trail shape. Evolutions keep their parent's colour and add a thin gold rim (gold reserved for evolutions).

### V1 weapons
| Weapon | Visual signature | Light colour | Trail shape | Impact look | Sound-feel |
|---|---|---|---|---|---|
| Ghost Wolves | Lean wolves made of moon-light, legs fade to mist below the knee; one amber neck-thread back to Wren | Moon blue #9fd8ff | Paw prints that glow and fade in a dotted line | Bite = two crescent flashes (jaws closing), bleed = slow blue drips | Padding, snarling, breath |
| Raven Flock | Violet ravens with letter-paper wing tips | Violet #b79cff | Loose feather-scatter circling the hero | Peck = small violet star-burst plus a dropped feather | Rustle, caw, flutter |
| Spirit Bolts | A single glowing letter-glyph inside a soft orb | Cyan #7ff0ff | Thin ink-line comet tail that curls as it homes | Glyph splashes into ink-like spatter | Whisper, hiss, pop |
| Chain Lightning | Jagged copper-blue arcs, flickering 2-3 frames | White-blue #b8f2ff with violet fringe | No trail; leaves a scorch-line that fades in 0.5s | White flash plus forked crack on the ground | Crack, snap, sizzle |
| Holy Orbit | Candle flames with a pale halo ring | Candle white #e8e0ff warming to cream | Continuous soft ring on the ground (a halo stamped into soil) | Flame flare and ember sparks | Hum, hush, crackle |

### Evolutions (all 11, names from evolutions.json)
| Evolution (parent) | Visual signature | Light | Trail | Impact | Sound-feel |
|---|---|---|---|---|---|
| Pouncing Pack (Wolves) | Wolves become muscular and lower; leap in a clear arc with a shadow below, then pin | Moon blue + gold rim | Long leap-arc streak, then a ring stamped where they land | Pin: the enemy is pressed flat, pale claws cross over it | Leap, thud, maul |
| Howling Legion (Wolves) | A pack too big to count, lighter and more transparent; heads up when howling | Moon blue + gold rim | Wide band of overlapping paw prints like a river | Howl ripples: rings of sound visible on the ground | Chorus, rumble, rush |
| Dire Alpha (Wolves) | One huge wolf, 3x size, mane of drifting light, amber eyes (a Wren touch) | Moon blue body, gold mane tips | Deep claw gouges that glow | Cleave = wide crescent slash across 3-4 enemies | Growl, crunch, quake |
| Murder Storm (Ravens) | A tornado of ravens around the hero, wall-like | Violet + gold flecks | Spiral of feathers on the ground, slowly rotating | Enemies hit are flung outward, scattering paper | Roar, rustle, gale |
| Dive Bombers (Ravens) | Ravens climb out of view, then stoop in straight lines, wings folded | Violet with gold beak-tip | Straight vertical streak from sky to target | Impact crater with feather ring | Whistle, dive, boom |
| Spirit Tempest (Bolts) | Eight glyphs released in a fan, like a page torn into letters | Cyan + gold rim | Eight thin curling ink lines | Last hit: glyph bursts into a ring of ink | Flurry, whisper, burst |
| Soul Lance (Bolts) | One long spear made of a full written line of text | Cyan core, gold edge | Straight engraved line across the ground that lingers 2s | Pierces through, each target flashes a single letter | Charge, shriek, thrum |
| Thunder Judgment (Lightning) | A sky-crack opens above, many bolts fall at once | White-blue + gold flash | Spider-web of scorch lines connecting all targets | Every enemy hit flashes white for one frame | Thunder, boom, roll |
| Static Storm (Lightning) | A dome of faint crackle around the hero; random strikes inside | Pale blue haze, gold sparks | Ground inside the dome shimmers | Small crisp strikes, many | Buzz, tick, snap |
| Sanctum Halo (Orbit) | Wide ring of many small candles; ground inside the ring becomes a stained-glass-like pattern of colour | Candle white + gold | Holy ground: soft cream circle, flowers bloom in it | Gentle flare, no explosion (it's a protector) | Choir, hum, bloom |
| Judgement Wheel (Orbit) | Few big, fast flames that slam into enemies, burst, and reform from sparks | Candle white with gold core | Tight bright ring with motion-blur | Burst = sharp flower of flame, then sparks fly back to the ring | Whoosh, bang, reform |

### Planned weapons (for the other 5 heroes, one line each)
| Weapon | Look | Light | Trail | Impact | Sound-feel |
|---|---|---|---|---|---|
| Lantern Wisps | Teardrop wisps with a tiny flame core | Warm amber-green #c7d97a | Dripping dotted light, like wax drops | Soft pop, ground blooms colour | Tink, glow, sigh |
| Grave Hand | Pale green hands rising from soil | Bone green #a8c49a | Cracked soil mounds that heal over | Grab and drag down | Crack, grip, drag |
| Frost Bell | Visible ring-wave of frost | Ice white #e6f4f7 | Frost rings that stay on the ground | Enemies go pale, frost-crack lines | Toll, chime, creak |
| Bone Servant | Big lumbering skeleton tied with glowing string | Ivory with amber string-light | Heavy footprints | Overhead slam with dust ring | Clatter, thump, creak |
| Soul Harvest | Violet soul-streams pulled to an orb | Violet #b79cff fading to white | Stream lines from enemy to hero | Enemy collapses into ash | Inhale, hum, drain |

---

## 5. Enemies

Universal enemy rules: hollowed creatures are desaturated, cool-dark, no warm colour, faceless except eye-points (cold red-orange #ff5a3c pinpricks, the ONLY place that colour appears outside telegraphs). Each creature corrupts the ground differently so a screenshot tells you what is on screen.

### Chapter 1: Cursed Forest
| Name (data id) | Lore tie-in | Silhouette | Behaviour tell | Corruption on the ground | Animation personality |
|---|---|---|---|---|---|
| Hollow Wolf (wolf) | Wolves of Wren's hills, drained empty; they still run as a pack because the body remembers | Thin, ribby, head low and long, tail hanging straight | Moves in loose packs, all heads turn at once toward you | Paw-shaped dark blots that grow little vein-roots | Twitchy, starving, lopes |
| Ash Crow (crow) | Crows that ate from drained fields and went grey from the inside | Ragged triangle, wings too long, feathers like flakes of ash | Flickery zig-zag approach, comes from screen edges | Falling grey flakes that leave tiny dark specks | Jerky, tilting head, never glides |
| Root Crawler (root_crawler) | A knot of roots the Hollow pulled up and taught to walk | Wide, low, many-legged root mass with a hunched centre | Slow, every step drives roots into the soil | Thick dark root-veins radiating out (the strongest corrupter) | Heavy, creaky, inevitable |
| Thornspitter (new, ranged) | A sapling that died standing; now it shoots its own thorns | Thin upright stick with a bulb head, splayed twig arms | Stops at range, bulb swells and glows cold before a shot | Thorn-scatter: small dark spikes where shots land | Rigid, rocks back on recoil |
| Blightbulb (new, suicider) | A grey puffball fungus swollen with the Hollow | Round pale bulb on two stubby legs | Pulses faster and faster, ground circle fills, then bursts | Burst leaves a circular dark splash with veins | Waddles, wobbles, panting |
| Moss Mourner (new, healer) | Moss that grew over a grave and kept the grief | Hooded hunched lump with long dangling moss "sleeves" | Stays behind packs, grey tether strands link to allies | Leaves a faint grey-green damp patch, the only "soft" corruption | Slow, swaying, mourning |
| Bramble Hart (new, charger) | A stag drained mid-leap; its antlers grew into thorns | Tall, antlers 2x head size, branchy | Lowers head, scrapes ground (line telegraph), charges | Straight dark scar along its charge path, bramble patch at end | Proud, still, then explosive |
| Rot Hound (variant) | An older Hollow Wolf, more Hollow than wolf | Wolf silhouette, bulkier, back covered in root growth | Same as wolf but does not flinch | Larger blots | Stiff, unflinching |
| Elite: Grey Alpha (dire wolf elite) | The old leader of Wren's pack's rivals; still leads | 2x wolf, mane of dead branches, pale outline glow | Howl (summons wolves), charge with 0.7s line tell | Howl spreads a ring of veins | Commanding, deliberate |
| Mini-boss: Briar Mother | A briar bush the size of a cottage that walks on its roots | Wide dome, tangled, with one hollow "doorway" mouth | Root pulses (circle telegraphs), drops Blightbulbs | Spreads a full circular thicket of veins | Breathing, slow pulsing |

**Boss: Elder Treant (3 phases)**
Lore: the oldest tree in the forest, which once held the forest's colour in its sap. The Hollow drank it from the roots up. It is not evil; it is in pain, and its hollow trunk howls like wind.
| Phase | Look | Behaviour (from research 10) | Corruption | Animation |
|---|---|---|---|---|
| 1 Awakening (100-66%) | Grey trunk with a hollow chest cavity; faint memory of green in its crown | Root Eruption (3 ground circles, 1.0s), Seed Toss spawns crawlers | Veins spread outward from each footstep | Groaning, slow, sways like wind |
| 2 Blight (66-33%) | Bark splits; dark veins glow faintly through cracks; crown drops its leaves | Sapling Ring (kill saplings to remove bark armour), Sweep cone | Saplings each corrupt a circle; veins link them to the boss | Angrier, faster, arms swing wide |
| 3 Wrath (33-0%) | Crown is gone; the hollow chest glows with a cold light (the Hollow inside) | Faster attacks, permanent root patches, Thorn Nova rings | Arena floor turns mostly dark; your light is the only colour left | Frantic, cracking sounds, limbs breaking |
| Death | Treant kneels; a single green leaf grows from the crack in its chest, and colour runs down its trunk into the ground | Drops heart, magnet, shards | Massive radial wave of restored colour from the body | 2s collapse, then stillness |

### The 8 chapters
| # | Chapter | Region/biome | The Hollow's face there | Palette mood | Enemy ideas | Boss | Signature hazard | Dawn reward look |
|---|---|---|---|---|---|---|---|---|
| 1 | Cursed Forest | Pine and oak woods | Root-veins that drink sap | Grey-green fog, cold | Hollow Wolf, Ash Crow, Root Crawler, Thornspitter, Blightbulb | Elder Treant | Thorn thickets / root patches | Leaves burst green and gold-amber autumn colour, wildflowers |
| 2 | Drowned Marsh | Reed beds, sunken huts | Still black water that never ripples | Grey-blue mist, near-silent | Reed Stalker, Bog Leech swarm, Lurefly (fake wisp that explodes), Mud Mourner | The Mire Widow (lurks below, lunges at shadows) | Fog that shrinks vision | Water turns clear and blue, lilies open, reeds gold-green |
| 3 | Ashen Graveyard | Hillside cemetery, chapel ruin | The dead who could not stay: hollow corpses | Bone grey, cold violet shadows | Grave Ghoul, Shroud Bat, Stone Weeper (statue that moves when unseen), Bell Hound | The Gravewarden (armoured, raises tombstones) | Revive: enemies stand once unless killed by spirits | Grass and poppies cover the graves; headstone names glow softly |
| 4 | Frozen Lake | Lake and fishing village under ice | Frost that holds things mid-motion | White-grey, steel blue | Ice Skater (sliding charger), Frost Moth, Lake Drowned (pull from holes), Rime Spider | The Rimewyrm (circles under the ice) | Sliding ice, cracking holes | Ice melts to deep blue water, fishing boats float, warm sky |
| 5 | Bone Catacombs | Underground tombs and ossuaries | Bones stacked as walls; the Hollow builds | Ochre-grey, torchless dark | Shield Ossuary (wall of bones), Skull Swarm, Marrow Crawler, Lamp-Thief (snuffs your light radius) | The Bone Choir (five singers, kill in order) | Sealing doors (wall events) | Shafts of daylight break through the ceiling, moss and roots grow |
| 6 | Sunken Cathedral | Half-flooded great church | Darkness itself: shadows that move | Black-blue, candle-starved | Pew Crawler, Choir Shade, Window Wraith (stained glass, shatters), Drowned Acolyte | The Drowned Bishop (light pillars) | Light pools: enemies shielded outside them (GAMEPLAY, needs OK) | Stained glass lights up in full colour, floor floods with coloured light |
| 7 | Burning Village | Thatched village, fields | False fire: orange that eats colour and leaves grey ash | The only chapter with strong orange - but it is cold, flat, "wrong" orange | Ember Imp (suicide swarm), Scarecrow Pyre, Cinder Dog, Ash Widow | The Pyre Knight (fire-trail charges) | Spreading fire patches, falling beams | Real warm sunrise, fields golden, houses rebuilt in colour |
| 8 | The Hollow | Underneath the world, a landscape of drained memories of chapters 1-7 | The Hollow's face, finally | Pure grey and void with flashes of every earlier chapter | Mirrored enemies from all chapters, Echo (copy of your hero, grey) | The Unlit (see name note in section 8; working name "Hollow King") | Void rifts; XP gems fade | The whole world map floods with colour, every chapter at once |

Note on 2 and 6: both are water chapters. Recommendation: keep both but make 6 about LIGHT and DARK (not water), with only a shallow reflective floor.

---

## 6. Visual identity cheat sheet

### Role colours (tokens for src/gfx/palette.js)
| Token | Hex (starting point) | Used for | Never used for |
|---|---|---|---|
| hollow.dark / mid / light | #1d2026 / #4a4f57 / #8a8f96 | Drained ground, props, enemy bodies | Anything friendly |
| living.green | #7fbf6a | Restored ground, plants | UI buttons |
| living.amber | #e8b86d | Warm restored light, Wren, hero lanterns | Enemies |
| spirit.cyan | #7ff0ff | Spirit magic, XP | Danger |
| spirit.violet | #b79cff | Ravens, souls, the Hollow One | Danger |
| evolution.gold | #ffd36b | Evolutions, evolution cards, the dawn sun ONLY | Gold currency icon (use warm brass #c9a25a instead, see Q7) |
| corruption.vein | #120d14 | Corruption veins, dead patches | - |
| corruption.accent | #ff5a3c | Enemy eye-points and danger telegraphs only | Fire effects of heroes |

### Light hierarchy (brightest to dimmest; never break order)
1. Evolution gold flashes and the dawn sun.
2. Hero's own light (lantern radius, accent).
3. Spirits and their impacts.
4. Pickups (hearts, magnets, XP gems).
5. Restored ground colour.
6. Enemy telegraphs (red-orange circles, lines).
7. Enemy eye-points.
8. Enemy bodies and the hollow world (no emissive light at all).

### UI personality
Adjectives: **quiet, warm, hand-made, glassy, patient.** UI is "Moonlit Glass": frosted panels with a thin warm edge, like glass held up to a candle. No chrome, no metal bevels, no spiky frames. Cards look like small lit windows. Animations ease in like a candle catching, never bounce.

### Logo concept for "Hollowlight"
The word is lettered half grey, half lit: "Hollow" in flat grey, "light" warm. A single thin line of spirit light runs through the word from left to right like a trail, and the first "o" is an empty ring (the Hollow) with one small flame inside it. Subtitle "Spirits of the Dusk" sits smaller underneath, spaced wide. Animated version on the title screen: the light line draws itself across the word, and letters warm up one by one as it passes.

### Typography mood
- Titles: a soft, slightly hand-cut serif with warm curves (free, OFL licence; candidates to test: Fraunces, Spectral, Cormorant). Avoid Cinzel and blackletter (overused in dark fantasy).
- Body/numbers: a clear humanist sans with large x-height (Atkinson Hyperlegible or Inter) so damage numbers and timers read instantly.
- Never all-caps for long text. Hero names in title serif, stats in sans.

### Iconography rules
- One-colour silhouettes with a single glow edge; the glow colour = the weapon's light colour.
- Icons show the spirit, not the effect (a raven, not "feathers flying").
- Evolution icons: same silhouette, gold rim plus one added detail (e.g. Dire Alpha = wolf head with mane).
- Stat icons share a tiny symbol set: count = dots, power = fang/flame, speed = streak, range/radius = ring, duration = hourglass, pierce = arrow through ring.
- No text in icons. Readable at 24px.

---

## 7. Signature moments

1. **Title screen.** A grey hillside under a sinking sun; the last orange sliver vanishes as the music starts; a single lantern flickers on in the dark and the logo's light-line draws across the title.
2. **Run start (dusk).** The camera eases in on the hero standing on grey ground; their first step leaves a small circle of colour behind, and the first spirits form from their light.
3. **First level-up.** Time slows, the world dims to near-black except the hero, and three cards rise like small lit windows; the chosen card dissolves into light that flows into the hero.
4. **First evolution.** All sound drops to a single held note; a gold line traces the evolving spirit's outline; it bursts, re-forms bigger, and a ring of gold-rimmed colour races across the ground in all directions.
5. **First elite (Grey Alpha).** All wolves on screen stop and look the same way; a long howl; the elite steps out of the fog with its name written in thin light.
6. **Boss intro (Elder Treant).** The ground shakes, regular enemies scatter to the edges, and the treant rises out of the soil, roots tearing; its name appears carved into bark-textured light across the screen.
7. **Boss phase change.** A one-second freeze frame, a crack of light through the treant's bark, the music shifts down a key.
8. **Low HP.** Edges of the screen frost grey, colour drains from the ground around the hero, the hero's lantern flame flickers smaller, and the heartbeat is the only sound under the music.
9. **Dawn victory.** The sun crests the screen edge; a wave of full colour rolls across the whole map, grey enemies crumble to ash and blow away, and the hero sits down on the grass with their spirits around them.
10. **Defeat.** The hero's lantern dims, not out (Matt, 2026-10-16: reopened, see LOCKED Reopened list): a small flame still burns in a dim amber pool; the screen goes quiet and grey-warm; the spirits stay, standing guard over the hero, and fade slowly. Results appear on a lantern-glass card: "The light dwindles. The night is long. The lantern still burns, a little."
11. **New hero unlock.** A grey silhouette on the hero select screen fills with colour from the bottom up, and their tell (scarf, bell, book) lights first.
12. **Chapter clear (map).** On the world map, the cleared chapter's region floods with colour and stays that way forever; a thin light-path draws to the next grey region.

---

## 8. Open questions for Matt (with recommendations)

| # | Question | Options | Recommendation |
|---|---|---|---|
| 1 | Should heroes speak (lines, barks)? | Silent / text barks / voiced | Text barks only on run start and victory, 3-6 words. Cheap, adds personality. |
| 2 | Wren's kill sparks joining her pack: visual only, or GAMEPLAY (pack grows)? | Visual / gameplay | Visual first; consider as a Wren-only tree node later. |
| 3 | Should restored ground do anything? (IDENTITY parks this) | Pure visual / small heal / XP bonus | Pure visual for v1; test "standing on colour heals 1 HP/s" later as an option. |
| 4 | How tragic is the tone? | Gentle sad / bittersweet / bleak | Bittersweet. Sad world, hopeful heroes. |
| 5 | Run timer as a moon arc instead of a clock? | Clock / moon arc / both | Both: moon arc as the main read, small mm:ss next to it. |
| 6 | Defeat screen: grey and quiet, or punchy and fast-retry? | Quiet / punchy | Quiet 2s beat, then a big "Again" button focused (fast retry). |
| 7 | Gold currency vs evolution gold clash | Rename currency / recolour currency | Keep the word "gold" but draw coins brass-coloured, never the evolution gold hue. Or rename currency to "embers". |
| 8 | Hero art: realistic proportions or stylised (big heads, small bodies)? | Realistic / stylised | Stylised (head ~1/4 of height). Reads better at 40px and suits 3D-looking renders. |
| 9 | Enemies: show faces or faceless? | Faces / faceless with eye-points | Faceless with eye-points. It's the clearest "the Hollow took them" read. |
| 10 | Which hero after Elias to build next? | Any of the 8 | Mara (Raven Flock already exists, needs only her art and ability). |

### Ideas worth stealing (things that make Hollowlight ownable)
- **The mural:** every run leaves a unique painting of your path. Offer a "save the night" screenshot at the end (just the map, no UI). Shareable without any server.
- **Saved land stays saved:** cleared chapters stay coloured on the world map, and small patches of previous runs' colour persist at the edges of the next run.
- **The amber thread:** a single visible thread from each spirit to its hero. It explains "summoner" without words and is a recognisable house style.
- **The Hollow One plays backwards:** their trail drains colour instead of restoring it. Fresh twist that rewards players who know the rules.
- **Dawn, not a "win" card:** victory is a sunrise. No other survivors-like does this.
- **The UI is a lantern:** HP as flame, XP as spirit thread, timer as moon.
- **Enemies are victims:** every boss death restores something (the treant's leaf). Kills feel like rescues.

### Name check (clash flags)
| Name | Risk | Note |
|---|---|---|
| Hollowlight | Medium | Phonetically close to *Hollow Knight* (big indie IP; a game called *Gleamlight* drew public copycat accusations in 2019). Also a jam game "Hollow Light" on itch.io and a small Montreal studio named "Hollow Light". Keep as one word, avoid knight imagery, consider a proper trademark search before any paid release. |
| Hollow King (ch 8 boss) | High | Too close to *Hollow Knight*. Suggest "The Unlit" or "The Hunger Below". |
| "Hollow" generally | Low-Medium | *Dark Souls* uses "Hollow" for drained undead. Fine as a common word; avoid "Hollowing" as a mechanic name. |
| Kael | Low | Common fantasy name (Warcraft's Kael'thas). Fine; alternative "Kaspar". |
| Captain Vane | Low | Real historical pirate Charles Vane; harmless and fits. |
| Treant | Low | Generic fantasy term (used widely). Fine. |
| Bone Choir, Pyre Knight, Gravewarden, Drowned Bishop | Low | Generic phrases; no known major IP clash found in a quick check. |
| Spirit Hunters (inspiration) | Note | Never reuse its names, icons or UI layouts. |
