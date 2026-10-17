// HUSKS options round: the 9 pieces x 3 options as data (names, story, silhouette hook, personality/animation hook, mask note, risk),
// game scale and bake-cost inputs. Mock-ups only (not game code).
import * as W from './wolves.mjs'; import * as AL from './alphas.mjs'; import * as BI from './birds.mjs'; import * as CR from './crawlers.mjs';
import * as RA from './ranged.mjs'; import * as BU from './bulbs.mjs'; import * as CH from './chargers.mjs'; import * as BG from './bigs.mjs';

// g: design units -> world size factor (true px = du * g * 2.34/4 on desktop). dims: [w, h] du at g=1 (bbox), cx: bbox centre x offset, top: bbox top (du, negative)
// Targets (Matt 2026-10-18: enemies ~hero-sized, wolf ~50 px desktop): wolf ~50 px long, crow ~32 px span, crawler ~55 px, ranged ~38 px tall,
// bulb ~30 px, hart ~55 px tall, miniboss = wolf x1.7, chest ~27 px, Treant ~150 px wide (boss sheet #7 owns the real size).
export const PIECES = [
  { key: 'wolf', n: 1, title: 'FELL WOLF', role: 'Fell Wolf (id wolf): swarm chaser, short lunge',
    beh: 'Chases in packs; 0.6 s tell = crouch, hackles rise, ears flat, head drops, eyes narrow to slits; then a short lunge along a red-orange dashed lane (direction locked at tell start).',
    eyes: '2 small eyes, close together, LOW and forward (packs = rows of pairs at night)', g: 0.62, dims: [142, 96], cx: 6, top: -88,
    fns: [W.wolfA, W.wolfB, W.wolfC], frames: 9,
    opts: [
      { id: 'A', name: 'Splitsnout', story: 'A hill wolf the Hollow drained; its husk grew long over the snout and split at the tip like a snapped branch.', hook: 'long pale snout-husk held LOW + split tip, one torn ear, ink-dipped plume tail', moves: 'hunched slinking lope, head low, tail drags; on the tell ash hackles fan up and the head drops', mask: 'long, asymmetric snout of grown bark with a split tip, chipped back edge, root straps, a dead twig sprout; never round', risk: 'closest to the round 2 wolf Matt saw (safe, but the least surprising)' },
      { id: 'B', name: 'Slabface', story: 'An old den guard; the bark grew over its face as one flat plank, leaving a single split to look through.', hook: 'flat square bark PLANK face, shaggy spiked mane, stubby round ears, short brush tail', moves: 'stubborn trudge, mane bristles; on the tell it plants and the slit flares', mask: 'a flat board with one horizontal slit for both eyes: the furthest from a skull-mask', risk: 'square face reads as a box/visor and can look like a bandaged mummy head; less wolf' },
      { id: 'C', name: 'Ringhusk', story: 'A starving yearling wearing a crescent of cut bark; its growth rings show on the cut face.', hook: 'crescent face-rind with growth rings, tall pointed ears, twig-thin tail with an ink puff', moves: 'lean skittish trot, ears swivel; thorns pop along the spine on the tell', mask: 'cut-wood crescent with rings: reads as TREE, not bone', risk: 'thin tail + crescent are small at 50 px; most cartoony' },
    ] },
  { key: 'crow', n: 2, title: 'GRAVE CROW', role: 'Grave Crow (id crow): fast zig-zag flyer',
    beh: 'Flies in zig-zags with two jerky flaps then a short stall; contact damage only (no tell needed); a dive-dip on contact. Dark beak (friendly ravens own the orange beak).',
    eyes: 'ONE big eye (+20%), held HIGH (hovering)', g: 0.66, dims: [96, 92], cx: -6, top: -86,
    fns: [BI.crowA, BI.crowB, BI.crowC], frames: 8,
    opts: [
      { id: 'A', name: 'Cracked Brow', story: 'A crow that ate from the drained fields; a heavy bark brow grew over its head and left one socket.', hook: 'round puff body, ragged raised V wings, heavy cracked brow-husk over one big eye, dark beak below', moves: 'jerky 2-beat flap, hang, head tilt; wings fold back for the dive', mask: 'a brow-helmet of bark with a crack and a sprout; the beak stays dark and free', risk: 'brow + beak can read as a helmeted bird (good) or a plague doctor (watch)' },
      { id: 'B', name: 'Leafhood', story: 'A dead oak leaf stiffened into bark and wrapped the crow like a hood; the stem curls up as a crest.', hook: 'lobed leaf hood framing one hole, curled stem crest, long torn leaf-ribbon tail', moves: 'fluttery, blown about, spirals down on the dive', mask: 'a lobed leaf, not a skull: the most "forest" mask', risk: 'leaf lobes are fine detail; at 30 px the hood is a pale blob' },
      { id: 'C', name: 'Acorn-cap Jackdaw', story: 'A jackdaw that hid in an acorn cup and grew into it; the scaly cup is now its helmet.', hook: 'scaly ACORN CUP helmet down to the beak, stalk stub on top, long thin wings', moves: 'pecky, darting, bobs its head between bursts', mask: 'cupule scales: a pattern no other enemy has', risk: 'cup + stalk reads cute (good) but close to a toy; scale texture shimmer when small' },
    ] },
  { key: 'crawler', n: 3, title: 'ROOT CRAWLER', role: 'Root Crawler (id root_crawler): slow tank, root-slam ring',
    beh: 'Heavy lurch-pause walk (plant, pull, settle); tank hp; telegraphed root-slam: it rears for 0.8 s while a red-orange ground ring fills, then slams (roots burst in the ring).',
    eyes: '2 eyes, WIDE apart, LOW in a dark cleft (lurch-pause rhythm at night)', g: 0.74, dims: [118, 92], cx: 4, top: -86,
    fns: [CR.crawlerA, CR.crawlerB, CR.crawlerC], frames: 9,
    opts: [
      { id: 'A', name: 'Rootback', story: 'A badger that slept under a stump; the Hollow grew the stump into its back and broke three roots off as prongs.', hook: 'stump shell with THREE broken root prongs, moss skirt, wide flat face-plate', moves: 'heavy plod, rocks side to side; rears and the prongs stab down on the slam', mask: 'wide low plank with two far-apart knot holes, root strap, lichen', risk: 'stump shell sits close to the W4 stump props (the prongs and eyes separate it)' },
      { id: 'B', name: 'Burltoise', story: 'A tortoise whose shell became one great knobbly burl, split by a vein of cold ink.', hook: 'round knobbly BURL dome (no prongs), bracket-fungus shelves, small beaked head', moves: 'slowest, inevitable shuffle; lifts its front and drops it for the slam', mask: 'short beaked bark plate on a small head', risk: 'dome silhouette is close to bushes/rocks at 30 px; head is small (less chibi)' },
      { id: 'C', name: 'Molebore', story: 'A blind mole whose husk grew into a spiral root-drill; it ploughs the soil and drags the roots up.', hook: 'pear body, huge ink digging claws, long spiral DRILL snout', moves: 'ploughing scoot; rears on its haunches and drives the drill down, root spikes ring up', mask: 'wound-bark drill cone with two tiny sockets at its base', risk: 'drill reads like a carrot/parsnip if the bark grain is lost; low height' },
    ] },
  { key: 'spit', n: 4, title: 'THORNSPITTER ROLE (ranged)', role: 'NEW ranged (Thornspitter role, new id)',
    beh: 'Walks in to ~160 u, roots, every ~2.8 s a 0.7 s tell (swell + ember glow inside + rock back, red-orange aim tick, direction locked), then spits ONE slow thorn you can step around; backs off if you close in.',
    eyes: 'ONE eye, very HIGH (still while rooted; the glow before a shot)', g: 0.7, dims: [100, 104], cx: 6, top: -96,
    fns: [RA.spitA, RA.spitB, RA.spitC], frames: 9,
    opts: [
      { id: 'A', name: 'Stoat Piper', story: 'A stoat that stood up to watch for danger and never sat down; its husk grew into a bark blowpipe.', hook: 'tall upright S-body + long BLOWPIPE snout + one high socket; curled ink-tip tail', moves: 'twitchy sentry, head snaps around; rears taller, ember glows in the pipe tip, recoils on the shot', mask: 'long tube snout grown from bark: the pipe IS the weapon', risk: 'thin pipe is ~4 px tall at true size (the glow carries the tell)' },
      { id: 'B', name: 'Quillhog', story: 'A hedgehog that curled up when the Hollow came; its quills turned to dark-tipped bark thorns.', hook: 'round ball of pale quills with dark tips + short tube snout', moves: 'bustling waddle, stops, PUFFS (quills fan), recoils', mask: 'tiny bark face with a tube nose', risk: 'LOW and round, not tall: its single eye sits low, weaker night read than the role asks' },
      { id: 'C', name: 'Thorn Squirrel', story: 'A squirrel whose great tail became a curled bramble; it plucks the thorns and throws them.', hook: 'huge curled BRAMBLE tail over its head, walnut-shell husk, upright', moves: 'fidgety, tail flicks; plucks a thorn and holds it high (ember tip) then throws', mask: 'wrinkled walnut shell over half the face', risk: 'tail + body merge into one blob in silhouette; the throw is a busier animation' },
    ] },
  { key: 'bulb', n: 5, title: 'BLIGHTBULB ROLE (area denial)', role: 'NEW area denial (Blightbulb role, new id)',
    beh: 'Waddles in; within ~50 u it plants, pulses faster while a red-orange ground ring fills for 1.0 s, then BURSTS (r36); killed early it only fizzles. Fear cancels the fuse.',
    eyes: 'THREE tiny eyes in a triangle (low-mid), glows on the fuse', g: 0.8, dims: [84, 76], cx: 2, top: -64,
    fns: [BU.bulbA, BU.bulbB, BU.bulbC], frames: 9,
    opts: [
      { id: 'A', name: 'Puffback Toad', story: 'A pond toad the Hollow filled with spores; the blister on its back is the Hollow ripening.', hook: 'squat toad + HUGE pale spore BLISTER on its back, spore motes leak', moves: 'heavy hop-waddle, blister breathes; squats, swells, cracks glow, pops', mask: 'wide flat husk with three small sockets in a triangle', risk: 'blister is pale-green-grey: keep it cold (never warm/yellow) so it never reads as a reward' },
      { id: 'B', name: 'Puffcap Dormouse', story: 'A sleepy dormouse; a giant puffball grew over its head and back as its husk.', hook: 'round PUFFBALL cap with a brim, tiny feet and ears under it, thin tail', moves: 'pattering waddle, wobbles; sits, the cap inflates and dimples, dust puffs, tears open', mask: 'the mushroom IS the husk; three sockets peek from under the brim', risk: 'reads "mushroom enemy" (generic in fantasy games); smallest body' },
      { id: 'C', name: 'Gourd Beetle', story: 'A dung beetle whose shell became a pale spore gourd, split by a seam.', hook: 'round split GOURD shell on six short legs, twin feelers', moves: 'skittery, stops dead; braces, the seam gapes and glows, halves lift, dumps spores', mask: 'small bark face plate with three sockets', risk: 'insect breaks the "forest animals" rule a little; legs are thin at true size' },
    ] },
  { key: 'hart', n: 6, title: 'BRAMBLE HART ROLE (charger)', role: 'NEW charger (Bramble Hart role, new id)',
    beh: 'Stands proud and still, then a 0.8 s tell: head down + hoof scrape + a long red-orange lane (direction locked); charges ~180 u straight through the crowd; 0.6 s stagger after.',
    eyes: '2 eyes HIGH on the head that swing LOW on the tell (high pair dropping = charge coming)', g: 0.62, dims: [110, 150], cx: 8, top: -146,
    fns: [CH.hartA, CH.hartB, CH.hartC], frames: 9,
    opts: [
      { id: 'A', name: 'Bramble Hart', story: 'A stag drained mid-leap; its antlers kept growing, into bramble.', hook: 'lyre of thorny antlers TWICE the head, slim ink-socked legs, moss rag on a tine', moves: 'proud stillness, ears flick; lowers the crown, scrapes, explodes into the charge', mask: 'long deer-skull-shaped bark husk with a crack', risk: 'tallest sprite: antler tips need the 2x bake to stay crisp' },
      { id: 'B', name: 'Briar Ram', story: 'A hill ram with a cold grey fleece; its horns curled into thorned bark spirals.', hook: 'chunky fleece body + two thorned SPIRAL horns + flat battering brow', moves: 'stamps and puffs ash; lowers the curls, charges like a battering ram', mask: 'blunt flat brow-plate (a ram-shaped husk, not a skull)', risk: 'short and stocky: loses the "tall unique shape" the role wanted; fleece is pale (watch the friendly-light rule)' },
      { id: 'C', name: 'Moss Elk', story: 'A gaunt old elk; its antlers are flat palms of grey bark hung with beards of moss.', hook: 'wide flat PALM antlers with moss drapes, long drooping muzzle + moss bell', moves: 'ponderous sway, drapes swing; slow wind-up then a heavy charge', mask: 'long drooping muzzle husk', risk: 'widest silhouette (clutter); moss drapes can cover the eyes at some angles' },
    ] },
  { key: 'alpha', n: 7, title: 'GREY ALPHA ROLE (miniboss)', role: 'MINIBOSS (Grey Alpha role) at 3:20 / 7:00 / 12:30',
    beh: 'Howls every 12 s (0.6 s pose, calls 4 Fell Wolves, a ring of veins spreads); 0.7 s line-charge tell (lane, direction locked) then x4 speed; one phase change at 50%. Control immune. Always fully lit, amber eyes.',
    eyes: '3 AMBER eyes (#ffb84a, locked boss eye), high-mid; always lit; pale cool outline in the build', g: 1.05, dims: [150, 124], cx: 4, top: -118,
    fns: [AL.alphaA, AL.alphaB, AL.alphaC], frames: 10,
    opts: [
      { id: 'A', name: 'Branch-Mane', story: 'The old leader of the rival pack; its husk is the oldest, cracked across, crowned by a mane of dead branches.', hook: 'wolf x1.7 + MANE of pale dead branches + moss beard + a third socket', moves: 'deliberate, commanding; the mane rattles up on the howl, tail lashes', mask: 'the Splitsnout husk grown old: cracked through, two sprouts, third socket', risk: 'needs the Splitsnout wolf picked to read as "the big special version"' },
      { id: 'B', name: 'Lantern Thief', story: 'The alpha that put out the lamplighters’ lanterns, and wears them: dead cold cages on root cords.', hook: 'three dead iron LANTERN cages swinging from its scruff + three bark tines', moves: 'heavy prowl, cages clank and swing; on death each cage cracks and a warm spark escapes', mask: 'tined bark helm with a third socket', risk: 'the cages are a story beat that needs Matt’s OK (ties the boss to Elias’s lanterns); busier silhouette' },
      { id: 'C', name: 'Barkmantle', story: 'The husk never stopped growing: a mantle of bark plates runs from its helm down its spine.', hook: 'overlapping BARK-PLATE mantle down the back, stacked three-eye totem face', moves: 'slow, enormous presence; plates lift and clatter on the howl', mask: 'short heavy helm with three sockets in a column', risk: 'plated back reads armadillo/grub; least wolf-like' },
    ] },
  { key: 'chest', n: 8, title: 'MINIBOSS CHEST', role: 'Miniboss chest: warm BRASS #b98f4e, never gold (rewards may be warm, enemies never)',
    beh: 'Dropped by the miniboss; opened by walking onto it; tiers small / medium / large (enemies-v1 2.8 A, inside the locked contents). Opening = cream-amber light spill (lantern colours).',
    eyes: 'none (a reward, not an enemy)', g: 0.9, dims: [70, 60], cx: 0, top: -54,
    fns: [BG.chestA, BG.chestB, BG.chestC], frames: 4,
    opts: [
      { id: 'A', name: 'Lantern Reliquary', story: 'A small shrine-box the lamplighters left at the forest edge; light still lives in it.', hook: 'peaked-roof shrine box, brass corner bands, a little lit lantern hanging from the roof', moves: 'still; light breathes in the seam; opening tips the roof back and light spills up', mask: 'n/a (tier read: plain / brass bands / + lantern)', risk: 'peaked roof could read as a birdhouse at 22 px (the warm glow makes it a reward either way)' },
      { id: 'B', name: 'Root-bound Coffer', story: 'A coffer the Treant’s roots had seized; you take it back from the Hollow.', hook: 'bark box held by two pale roots, a glowing brass lantern-lock', moves: 'roots creak loose and drop away, lid springs', mask: 'n/a', risk: 'bark + roots are the ENEMY material: the reward can read as part of the Hollow' },
      { id: 'C', name: 'Lantern Hive', story: 'An old skep-hive lantern; moth-motes still circle the light inside.', hook: 'round banded skep on brass feet, glowing slats, two moth-motes', moves: 'motes circle; the dome unscrews and the light rises out', mask: 'n/a', risk: 'round + glowing is close to the Treasure Wisp / lamps language (POI phase)' },
    ] },
  { key: 'treant', n: 9, title: 'ELDER TREANT (boss-scale HINT only)', role: 'Boss hint for family consistency only (the boss gets its own sheet #7)',
    beh: 'Boss at 10:00 (sheet #7 owns its verbs). Here only: how the boss reads as the SOURCE of every husk, at boss scale, with amber eyes.',
    eyes: '2 AMBER eyes (locked boss eye) in its own husk', g: 0.82, dims: [330, 360], cx: 4, top: -350,
    fns: [BG.treantA, BG.treantB, BG.treantC], frames: 0,
    opts: [
      { id: 'A', name: 'The First Husk', story: 'Every mask came from it: its own face is the biggest, oldest husk, chipped where the masks are shed.', hook: 'great cracked husk face on a grey tree, branch arms, a cold split in the chest', moves: 'groaning sway; the face cracks wider in phase 2 (boss sheet)', mask: 'the family mask at boss scale', risk: 'trunk and crown are still placeholder-simple (boss sheet #7 will redo them)' },
      { id: 'B', name: 'The Mask-Bearer', story: 'It GROWS the husks: small animal masks sprout from its bark like bracket fungus, waiting for bodies.', hook: 'trunk studded with small wolf/crow/hart husks, a dark split-knot face', moves: 'masks rattle; in the fight it could shed them onto spawned Husks (boss sheet idea)', mask: 'many small husks + a void knot face', risk: 'creepiest; busiest silhouette; masks shrink to dots at true size' },
      { id: 'C', name: 'The Antlered Elder', story: 'An ancient tree whose bare crown grew into a vast antler rack, its face a long stag-skull husk.', hook: 'huge ANTLER crown of dead branches with moss beards, long stag husk face', moves: 'majestic, slow; moss beards swing', mask: 'long stag husk (boss scale)', risk: 'overlaps the Bramble Hart language (and a stag-skull boss is a common trope)' },
    ] },
];
export const FAMILY = {
  name: 'HUSKS', tag: 'the forest’s own creatures, drained; the Hollow wears their faces',
  maskRules: ['grown BARK, never smooth white: carved growth grain, chipped/splintered back edge, lichen cups', 'asymmetric: sockets differ in size, a crack or chip on one side', 'per-species shape that follows the animal (snout, brow, plank, drill, cup...), never a round head-shell', 'root STRAPS grip the head (it grew on); a dead twig sprout on most', 'knot-hole sockets with a raised bark lip; ember eye-points float in the void (WL6b)'],
};
