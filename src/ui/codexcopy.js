// CX2 / CX7 Almanac copy (docs/design/codex-celebrations-v1.md). Pure data: quiet, warm, a little sad; one line each. Shown via textContent only.
// Riddles (CX7) name ONE stat of an evolution's pair, never both: the recipe stays hidden (tests/codex.test.mjs checks the other label is absent).

export const CX = Object.freeze({
  title: 'The Almanac',
  sub: 'What you have learned of the Hollow',
  back: 'Back',
  readOnly: 'Read only while the night waits',
  tabs: Object.freeze({ foes: 'Foes', spirits: 'Spirits', heroes: 'Hollowlighters', nights: 'Nights' }),
  pages: (a, b) => `${a} / ${b} pages`,
  unknown: '?????',
  notMet: 'not met',
  newTag: 'NEW',
  husk: 'Husk',
  freed: (n) => `${n} freed from their masks`,
  slain: (n) => `${n} slain`,
  nextAt: (at, cur) => `Next page at ${at} slain (${cur})`,
  sealedAt: (at) => `Sealed until ${at} slain`,
  webSame: (name) => `Lantern Web: ${name} lights at the same page`,
  keysFoes: 'foes',
  keysPages: 'pages',
  marks: 'Hollow marks',
  marksWhere: 'Deep Dusk and Long Night',
  marksNone: 'Seen on the harder nights. Not yet met.',
  markUnseen: 'Not yet seen',
  // spirits
  sleeping: 'Sleeping',
  notFound: 'Not yet found',
  awake: 'Its socket is awake in the Lantern Web.',
  riddleNote: 'Riddle from the Full Almanac: one half of the way',
  wake: (t) => `Wake its socket in the Lantern Web: ${t}.`,
  stirs: 'Something stirs in the Hollow. Keep playing to find out what.',
  taken: (n) => `Taken ${n} time${n === 1 ? '' : 's'}`,
  recipe: (a, b) => `Recipe: ${a} + ${b}`,
  weaponAsleep: 'This spirit still sleeps in the Lantern Web.',
  fullAlmanacOn: 'Full Almanac: riddles are lit',
  // heroes
  heroWalked: (runs, clears) => `${runs} night${runs === 1 ? '' : 's'} walked · ${clears} dawn${clears === 1 ? '' : 's'}`,
  heroNot: 'Not yet walked',
  heroPick: (name) => `Choose ${name} when you begin a night.`,
  heroLocked: 'Wakes when you gather their keepsakes.', // CHARACTER SYSTEM v2: heroes wake by keepsakes, not the tree
  ability: 'Ability',
  // nights
  nightRuns: (runs, clears) => `${runs} walked · ${clears} cleared`,
  best: (t) => `Longest walk ${t}`,
  stars: (n) => `${n} / 3 stars`,
  firstDawn: 'First dawn here',
  nightClosed: 'This night is not open yet.',
  nightUnplayed: 'Open, not yet walked.',
  boss: 'Elder Treant waits at the end of the night',
  lore: 'Lore',
  loreLocked: 'A page not yet written',
  // results / title links
  open: 'Almanac',
  openHint: 'J',
  written: 'written in the Almanac',
});

// first-kill line per foe (the entry quote), a hint while unmet, and the staged pages
export const FOE = Object.freeze({
  wolf: { line: 'It still runs with a pack. It no longer knows why.' },
  crow: { line: 'It counts the fallen. It has lost count.' },
  root_crawler: { line: 'Slow, patient, hungry. The Treant\'s fingers.' },
  stoat_piper: { line: 'It plays a song no one asked for, from a safe distance.' },
  puffback_toad: { line: 'It swells with the forest\'s grief and lets it out all at once.' },
  bramble_hart: { line: 'Once it ran from hunters. Now it runs at them.' },
  branch_mane: { line: 'The old leader of a pack that is gone. It still calls them.', hint: 'Something old leads the rival pack.' },
  elder_treant: { line: 'Its bark is every mask in the forest.', hint: 'the end of night' },
  treant_pod: { line: 'A seed that grew up grey. It never chose to.', hint: 'Something falls from the oldest tree.' },
  treant_sapling: { line: 'A Husk too young to know it is one.', hint: 'Something falls from the oldest tree.' },
});
export const UNMET = 'Somewhere in the Cursed Forest.';

export const PAGE_LABEL = Object.freeze({ habits: 'Habits', weakness: 'Weakness', tells: 'Tells' });
export const PAGE = Object.freeze({
  wolf: { habits: 'Hunts in twos and threes. Turns when the lantern turns.', weakness: 'Light from the side scatters it; it only knows how to run straight.', tells: 'It drops its head before it lunges. Step aside, not back.' },
  crow: { habits: 'Comes in clouds after the first howl. Leaves when the light stays.', weakness: 'Hollow bones. One touch of light is enough.', tells: 'It circles once, high, before it falls.' },
  root_crawler: { habits: 'It goes where the ground is soft and the light is thin.', weakness: 'Slow to turn. Walk around it and it forgets you.', tells: 'The soil shivers just before it rises.' },
  elder_treant: { habits: 'It waits for the night to be nearly over. It has always waited.', weakness: 'Its heart glows when it rages. That is where the light gets in.', tells: 'It lifts its arms before the ground answers.' },
});

export const MARK_LINE = Object.freeze({
  ironbark: 'Bark plates over the mask: outlast it.',
  swiftshade: 'A cold streak behind it: out-turn it.',
  emberwake: 'Ember cracks in the mask: step out of the ring it leaves.',
  hollowheart: 'A hollow chest that hurries its kin: free it first.',
});

export const LORE = Object.freeze([
  { title: 'Before the Long Dusk', text: 'Colour was simply what life looked like from the outside. Every leaf, wolf and person held a little light, and the sun came back each morning to top it up.', cond: 'Walk your first night.' },
  { title: 'The Hollow wakes', text: 'Something under the world woke hungry and drank colour the way roots drink water. Where it drank, things went grey, then empty, then wrong.', cond: 'See your first dawn.' },
  { title: 'The light that stayed', text: 'The light of the dead did not go into the Hollow. It stayed, waiting for someone living to carry it.', cond: 'Clear the Deep Dusk.' },
  { title: 'Hollowlighters', text: 'Each night they walk into the grey with their spirits. Keep the light until dawn, and the sun remembers that place for good.', cond: 'Clear the Long Night.' },
]);

// CX7 riddles: { stat (one half of the pair), line }. DRAFT copy for Matt to read (Full Almanac stays inert until he does).
export const RIDDLE = Object.freeze({
  phantom_stampede: { stat: 'speed', line: 'The pack leaves light where it runs fast.' },
  howling_legion: { stat: 'count', line: 'The more who run together, the fewer stay fallen.' },
  dire_alpha: { stat: 'power', line: 'One bite, heavy enough for seven.' },
  murder_storm: { stat: 'range', line: 'Watch far enough and the sky becomes a wall.' },
  dive_bombers: { stat: 'power', line: 'A hard beak finds the largest shadow.' },
  spearhead: { stat: 'speed', line: 'Beat the wings fast and the flock becomes a road.' },
  spirit_tempest: { stat: 'count', line: 'Enough glyphs, and each one finds its own name.' },
  soul_lance: { stat: 'pierce', line: 'A light that never stops at the first foe.' },
  returning_pages: { stat: 'speed', line: 'Swift pages always find their way home.' },
  thunder_judgment: { stat: 'chains', line: 'Enough links, and the sky keeps count for you.' },
  static_storm: { stat: 'cooldown', line: 'Strike often enough and the air takes your side.' },
  storm_tether: { stat: 'area', line: 'A wide arc is an arc you can hold.' },
  vesper_tide: { stat: 'radius', line: 'A wide ring breathes like the evening.' },
  sanctum_halo: { stat: 'count', line: 'Enough candles, and the ground itself is holy.' },
  judgement_wheel: { stat: 'speed', line: 'Spin the lights fast and each becomes a verdict.' },
});

// CX6 titles (fixed list; the save keeps only these ids). weapon: Almanac weapon page complete (3 / 3); tab / book completion.
export const TITLES = Object.freeze({
  friend_wolves: { name: 'Friend of Wolves', ornament: 'wolf-ear charm', weapon: 'ghost_wolves' },
  friend_ravens: { name: 'Friend of Ravens', ornament: 'raven feather', weapon: 'raven_flock' },
  friend_glyphs: { name: 'Keeper of Glyphs', ornament: 'glyph seal', weapon: 'spirit_bolts' },
  friend_storms: { name: 'Storm-holder', ornament: 'copper spark', weapon: 'chain_lightning' },
  friend_candles: { name: 'Candle-bearer', ornament: 'candle stub', weapon: 'holy_orbit' },
  keeper_foes: { name: 'Keeper of Foes', ornament: 'bark mask', tab: 'foes' },
  friend_spirits: { name: 'Friend of Spirits', ornament: 'spirit thread', tab: 'spirits' },
  walker_nights: { name: 'Walker of Nights', ornament: 'moon pin', tab: 'nights' },
  hollow_remembers: { name: 'The Hollow Remembers', ornament: 'pressed flower', book: true },
});

// celebration copy (CX4 / CX5)
export const CEL = Object.freeze({
  remembers: 'The Hollow remembers',
  more: (n) => `+${n} more in the Almanac`,
  next: (what, i, n) => `Next: ${what} · ${i} of ${n}`,
  last: (i, n) => `${i} of ${n}`,
  cont: 'any key',
  tap: '/ tap to continue',
  skip: 'skip all',
  away: 'While you were away',
  kinds: Object.freeze({ evo: 'Evolution found', title: 'Title earned', weapon: 'Spirit wakes', socket: 'Socket wakes', heart: 'Heart wakes', gate: 'A way opens', key: 'Lantern lit', hero: 'Hollowlighter awakes', night: 'A new night' }),
  whole: (name) => `${name} ${/s$/.test(name) ? 'are' : 'is'} whole`,
  wholeLine: Object.freeze({
    ghost_wolves: 'Every hunger in the pack has a name again.',
    raven_flock: 'The flock remembers every road in the sky.',
    spirit_bolts: 'Every page is written, every name read out.',
    chain_lightning: 'The storm answers when you call it now.',
    holy_orbit: 'Every candle in the ring is lit.',
    foes: 'You know every mask in the forest by its name.',
    spirits: 'Every spirit has shown you all it can be.',
    nights: 'Every night here has been walked, and remembered.',
    book: 'The whole Almanac is written. The Hollow remembers you.',
  }),
  tabWhole: Object.freeze({ foes: 'The bestiary is whole', spirits: 'The spirits are whole', nights: 'The nights are whole', book: 'The Almanac is whole' }),
  titlePill: (t) => `Title: ${t}`,
  ornPill: (o) => `Lantern ornament: ${o}`,
  constWhole: (name) => `${name} is whole again`,
});
