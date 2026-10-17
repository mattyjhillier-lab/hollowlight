// Enemies art round 2: the three bestiary takes as data (names, stories, hooks, personalities, draw functions, game scale). Mock-ups only.
import * as A1 from './takeA.mjs'; import * as A2 from './takeA2.mjs'; import * as A3 from './takeA3.mjs';
import * as B1 from './takeB.mjs'; import * as B2 from './takeB2.mjs';
import * as C1 from './takeC.mjs'; import * as C2 from './takeC2.mjs';

// g = design units -> game size factor (so 1 du * g * DESK_K = css px at true size). Targets (world units): wolf ~22 long, crow ~13 span,
// crawler ~24, ranged ~14 tall, bulb ~12, hart ~24 tall, miniboss ~1.7x wolf, chest ~12, treant ~ the current 64 x 72 boss.
export const ROLES = [
  ['wolf', 'Fell Wolf role', 'swarm chaser, short lunge'], ['crow', 'Grave Crow role', 'fast flyer, zig-zag + dive'], ['crawler', 'Root Crawler role', 'slow tank, root-slam ring'],
  ['spit', 'NEW ranged (Thornspitter role)', 'stops at range, aims, shoots'], ['bulb', 'NEW area denial (Blightbulb role)', 'swells, bursts, leaves a patch'], ['hart', 'NEW charger (Bramble Hart role)', 'lowers head, lane tell, charges'],
  ['alpha', 'MINIBOSS (Grey Alpha role)', 'howl calls the pack, charge'], ['treant', 'BOSS hint (Elder Treant)', 'family consistency only'], ['chest', 'Miniboss CHEST', 'reward, warm light allowed'],
];
export const G = { wolf: 0.64, crow: 0.72, crawler: 0.72, spit: 0.72, bulb: 0.78, hart: 0.78, alpha: 1.12, treant: 0.82, chest: 0.72 };

export const TAKES = {
  A: {
    id: 'A', name: 'HUSKS', tag: 'the forest\'s own creatures, drained; the Hollow wears their faces',
    story: 'The Hollow drank the colour out of the forest animals and kept them walking. Their faces are gone: each wears a pale lichen-bark HUSK (a mask grown from the Elder Treant\'s bark) with an empty void where ember eye-points float. Ink got in through their paws.',
    look: 'plush slate-indigo fur and feather, pale bark husk masks, ink-dipped "socks" and veins, lichen spots. Shape language: soft round bodies + one hard pale mask.',
    accent: '#bdbba6', accentName: 'bark-husk bone', pal: [['#45506d', 'fur'], ['#8e9cb9', 'scruff'], ['#bdbba6', 'husk'], ['#171222', 'ink'], ['#8fa596', 'lichen']],
    death: 'the husk clatters off and cracks, the body breaks into ink wisps and ash; a lichen sprout and a warm mote stay (colour returns)',
    sh: 'closest to Spirit Hunters creature appeal (real animals, chibi, big readable heads) but owned by the Hollow mask idea; the mask rhymes with Wren\'s void face (her glints are warm, theirs cold)',
    f: { wolf: A1.wolfA, crow: A2.crowA, crawler: A2.crawlerA, spit: A3.spitA, bulb: A3.bulbA, hart: A3.hartA, alpha: A3.alphaA, treant: A3.treantA, chest: A3.chestA },
    names: { wolf: 'Fell Wolf (husk)', crow: 'Grave Crow (one-eyed)', crawler: 'Rootback', spit: 'Quillhog', bulb: 'Puffback Toad', hart: 'Bramble Hart', alpha: 'Grey Alpha', treant: 'Elder Treant (first husk)', chest: 'Root-bound coffer' },
    hooks: { wolf: 'long pale husk snout held LOW + frosted scruff + torn ear + ink plume tail', crow: 'puff body + ragged V wings + ONE eye in a cracked eggshell visor', crawler: 'stump-shell crown with 3 broken root prongs', spit: 'ball of dark-tipped thorn quills + tube snout', bulb: 'huge pale spore blister on a squat toad + slit visor', hart: 'lyre of thorn antlers, twice the head', alpha: 'mane of pale dead branches + third eye + scar', treant: 'the great cracked husk face (all masks come from it)', chest: 'bark box in root bands, warm lantern lock' },
    moves: { wolf: 'hunched slinking lope, tail drags, hackles rise on the tell', crow: 'jerky 2-beat flap, hangs, head tilts', crawler: 'heavy plod, rocks side to side, roots drag', spit: 'bustling waddle, stops, PUFFS, recoils', bulb: 'heavy hop-waddle, blister breathes', hart: 'proud stillness, then explosive', alpha: 'deliberate, commanding, howls', treant: 'groaning sway', chest: 'still; light breathes in the seams' },
  },
  B: {
    id: 'B', name: 'WICKERKIN', tag: 'effigies the Hollow weaves from what the forest drops',
    story: 'Where the Hollow found a creature already gone, it wove a new one from what was lying about: den sticks, bramble, straw, moss and grave-rags. They are hollow cages (you see the dark through the weave) with a carved wooden DISC for a face.',
    look: 'ash-grey wicker weave with dark gaps, twine bindings, bramble, cold blue grave-rag ribbons, straw. Shape language: stick lines + see-through cages + fluttering ribbons.',
    accent: '#5c6f8e', accentName: 'grave-rag blue', pal: [['#93918a', 'wicker'], ['#1d1a25', 'inside'], ['#5c6f8e', 'grave-rag'], ['#3a3245', 'bramble'], ['#a3a493', 'straw']],
    death: 'UNRAVELS: the weave springs loose, twigs scatter, a rag flutters down, the disc face rolls away; a warm mote and a sprout stay',
    sh: 'folk-horror craft (Don\'t Starve / Cult of the Lamb territory) instead of Spirit Hunters creatures; strongest "made by the Hollow" story, weakest cute-animal appeal',
    f: { wolf: B1.wolfB, crow: B1.crowB, crawler: B1.crawlerB, spit: B2.spitB, bulb: B2.bulbB, hart: B2.hartB, alpha: B2.alphaB, treant: B2.treantB, chest: B2.chestB },
    names: { wolf: 'Wicker Hound', crow: 'Rag Crow', crawler: 'Bundle Crawler', spit: 'Briar Poppet', bulb: 'Spore Basket', hart: 'Bramble Hart (woven)', alpha: 'Effigy Alpha', treant: 'Elder Treant (wicker-man)', chest: 'Woven hamper' },
    hooks: { wolf: 'see-through cage body + rag ribbon tail + triangle twig ears', crow: 'two bare stick wings hung with rag strips + broom tail', crawler: 'a firewood bundle in twine bands on many root legs', spit: 'straw bell-skirt corn doll with a thorn crown', bulb: 'round basket with moss bulging through the gaps', hart: 'bramble antlers streaming grave-rags', alpha: 'rag cape + bramble crown + third eye', treant: 'wicker-man tree with a great disc face', chest: 'woven hamper, warm light through the weave' },
    moves: { wolf: 'clattery stiff trot, ribbons stream, head wobbles', crow: 'blown about in gusts, rags snap', crawler: 'skitters in bursts, legs patter, stops dead', spit: 'rigid hops, plucks a thorn (tell), rocks back', bulb: 'wobbly waddle, creaks as it swells', hart: 'still as a scarecrow, ribbons snap, bolts', alpha: 'cape drags, crown rattles', treant: 'creaking', chest: 'still' },
  },
  C: {
    id: 'C', name: 'SNUFFED', tag: 'the forest\'s little lights, put out; what was left set as cold wax',
    story: 'The Hollow snuffed every candle, lantern and glow-worm in the forest. What was left set as cold blue-grey wax and walks: each has a charred WICK trailing a curl of cold smoke. On the tell the wick catches a red-orange flame; when one dies it melts and the wick gives back a warm spark.',
    look: 'soft glossy slate-blue wax, drips and puddles, charred wicks with smoke curls, one iron candle-snuffer. Shape language: melting rounds + vertical wick/candle accents.',
    accent: '#1e1a22', accentName: 'charred wick + smoke', pal: [['#5f6a82', 'wax'], ['#7f8a9e', 'old wax'], ['#1e1a22', 'wick'], ['#9aa3b2', 'smoke'], ['#3a3f4c', 'snuffer iron']],
    death: 'MELTS into a glossy puddle; the wick tips over and lets a warm spark go (the stolen light returns); a sprout',
    sh: 'the most ownable idea (light stolen = the game\'s whole myth, and the tell is built in: wicks catch red), but the least "forest" and the least Spirit Hunters-like',
    f: { wolf: C1.wolfC, crow: C1.crowC, crawler: C1.crawlerC, spit: C2.spitC, bulb: C2.bulbC, hart: C2.hartC, alpha: C2.alphaC, treant: C2.treantC, chest: C2.chestC },
    names: { wolf: 'Tallow Wolf', crow: 'Snuffer Crow', crawler: 'Stubheap', spit: 'Taper', bulb: 'Wax Bloat', hart: 'Candelabra Hart', alpha: 'Old Tallow', treant: 'Elder Treant (wax-bled)', chest: 'Sealed lantern box' },
    hooks: { wolf: 'slumped wax wolf with a smoking wick on its head + melted ear', crow: 'iron snuffer bell for a head, the cone is its beak', crawler: 'mound crowned by a skyline of 5 candle stubs', spit: 'tall thin crooked taper with a bulb head', bulb: 'fat ball candle with a fuse wick', hart: 'antlers that ARE a candelabra (6 wicks)', alpha: 'row of melted candles down the spine + drip mane', treant: 'wax curtains, every branch a snuffed wick', chest: 'iron box with a big cold wax seal' },
    moves: { wolf: 'oozing slink, drops wax', crow: 'swoops then hangs, smoke trails', crawler: 'slow slide, leaves a wax trail', spit: 'sways like a flame in a draught', bulb: 'wobble-waddle, fuse fizzes on the tell', hart: 'still; every wick catches in a ripple, then charges', alpha: 'heavy, candles flicker red on the howl', treant: 'drips', chest: 'still' },
  },
};
export const KEYS = ['wolf', 'crow', 'crawler', 'spit', 'bulb', 'hart', 'alpha', 'treant', 'chest'];
