// Skill tree v2 PROPOSED inventory (design data for docs/design/skill-tree-v2.md and the mock-ups; NOT game data).
// Every v1 id is kept (saves keep working). `v1:true` = existing id (effect/cost may be rescaled), else NEW id.
// kinds: heart (cluster anchor: weapon gate or starter emblem), socket (evolution: gate node or starter display), knot (1-3% stat),
// bead (verb / status / notable), mastery (condition-gated capstone), key (keystone), hero, ring (global), teaser.
// cat (budget category): dmg, tagS, tagM, wpn:<id>, cast, area, hp, heal, status, sustain, util, none.

export const CLUSTERS = {
  ghost_wolves: { name: 'Ghost Wolves', emblem: 'wolf', ang: 162, col: '#9fe8ff', deep: '#27465f', hero: 'wren', heart: null, starterEvo: 'howling_legion' },
  raven_flock: { name: 'Raven Flock', emblem: 'raven', ang: 234, col: '#b9a2ff', deep: '#432a72', hero: null, heart: 'gt_raven_flock' },
  spirit_bolts: { name: 'Spirit Bolts', emblem: 'bolt', ang: 306, col: '#7ff0ff', deep: '#1f5f80', hero: null, heart: 'gt_spirit_bolts' },
  chain_lightning: { name: 'Chain Lightning', emblem: 'chain', ang: 18, col: '#d6ecff', deep: '#3a5a8a', hero: null, heart: 'gt_chain_lightning' },
  holy_orbit: { name: 'Holy Orbit', emblem: 'orbit', ang: 90, col: '#e2ccff', deep: '#5a3f86', hero: 'elias', heart: null, starterEvo: 'sanctum_halo' },
};
export const CLUSTER_R = 600; // distance hub -> constellation centre (world units)

// Emblem geometry, local units (cluster spans about 240 x 240). outline = the thread that traces the emblem (in order);
// slots = node positions on/inside it; sockets = the three meaningful points; heart = the anchor.
export const EMBLEMS = {
  wolf: {
    heart: [0, -66],
    outline: ['eiL', 'etL', 'chL', 'rfL', 'jwL', 'chin', 'jwR', 'rfR', 'chR', 'etR', 'eiR'], closed: false,
    slots: { eiL: [-30, -46], etL: [-74, -108], chL: [-90, -26], rfL: [-112, 20], jwL: [-58, 70], chin: [0, 106], jwR: [58, 70], rfR: [112, 20], chR: [90, -26], etR: [74, -108], eiR: [30, -46] },
    sockets: { a: [-38, -2, 'left eye'], b: [38, -2, 'right eye'], c: [0, 42, 'nose'] },
    silhouette: 'M-74 -108 L-30 -52 C-12 -58 12 -58 30 -52 L74 -108 L88 -26 L112 18 L80 30 L88 62 L52 64 L28 96 L0 108 L-28 96 L-52 64 L-88 62 L-80 30 L-112 18 L-88 -26Z',
  },
  raven: {
    heart: [10, 12],
    outline: ['tail', 'bel', 'nape', 'crown', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'brs'], closed: false,
    slots: { tail: [-104, 74], bel: [-40, 60], brs: [58, 42], nape: [44, -24], crown: [86, -50], w1: [-6, -30], w2: [-40, -78], w3: [-78, -116], w4: [-112, -70], w5: [-100, -18], w6: [-74, 18] },
    sockets: { a: [98, -30, 'eye'], b: [-120, -128, 'wing tip'], c: [136, -36, 'beak point'] },
    silhouette: 'M-112 82 L-60 52 C-60 20 -20 -6 30 -8 C40 -40 70 -66 100 -56 L140 -38 L106 -24 C106 20 70 54 22 58 L-40 66 Z M-10 -24 C-40 -60 -80 -110 -124 -132 C-118 -80 -106 -30 -70 24 Z',
  },
  bolt: {
    heart: [0, 0],
    outline: ['t1', 't2', 'u1', 'u2', 'k1', 'k2', 'k3', 'l1', 'l2', 'l3', 'b1'], closed: false,
    slots: { t1: [30, -104], t2: [4, -70], u1: [-26, -36], u2: [-58, -2], k1: [-18, 4], k2: [24, 6], k3: [56, -4], l1: [28, 34], l2: [6, 66], l3: [-14, 96], b1: [-46, 18] },
    sockets: { a: [54, -132, 'top tip'], b: [-34, 132, 'bottom tip'], c: [86, 2, 'the turn'] },
    silhouette: 'M50 -136 L-66 6 L-4 6 L-38 136 L92 -6 L28 -6 Z',
  },
  chain: {
    heart: [-70, 60],
    outline: ['s1', 's2', 'f1', 'f2', 'f3', 'm1', 'm2', 'm3', 'g1', 'g2', 'g3'], closed: false,
    slots: { s1: [-104, 100], s2: [-36, 22], f1: [-8, -30], f2: [6, -76], f3: [36, -104], m1: [22, 4], m2: [62, -6], m3: [96, -26], g1: [14, 48], g2: [52, 70], g3: [88, 98] },
    sockets: { a: [62, -138, 'upper fork'], b: [132, -40, 'middle fork'], c: [124, 124, 'lower fork'] },
    silhouette: 'M-112 112 L-30 18 L8 -30 L60 -140 M-30 18 L60 -6 L134 -40 M-30 18 L46 62 L126 126',
  },
  orbit: {
    heart: [0, 0],
    outline: ['o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'o8', 'o9', 'i1', 'i2'], closed: true,
    slots: { o1: [0, -112], o2: [72, -86], o3: [110, -20], o4: [96, 56], o5: [40, 104], o6: [-40, 104], o7: [-96, 56], o8: [-110, -20], o9: [-72, -86], i1: [-36, -40], i2: [36, -40] },
    sockets: { a: [0, 162, 'lower light'], b: [-150, -112, 'left light'], c: [150, -112, 'right light'] },
    silhouette: 'M0 -112 A112 112 0 1 1 -0.1 -112Z',
  },
};

// Weapon stat names (display only).
const S = {
  ghost_wolves: ['power', 'speed', 'duration'], raven_flock: ['power', 'range', 'speed'], spirit_bolts: ['power', 'speed', 'pierce'],
  chain_lightning: ['power', 'area', 'cooldown'], holy_orbit: ['power', 'radius', 'speed'],
};
const SN = { ghost_wolves: ['Bite power', 'Wolf speed', 'Rend'], raven_flock: ['Peck power', 'Watch', 'Wingbeat'], spirit_bolts: ['Bolt power', 'Swiftness', 'Pierce'], chain_lightning: ['Power', 'Arc', 'Cooldown'], holy_orbit: ['Orb power', 'Orbit size', 'Orbit speed'] };

// Per-cluster outline node specs, in outline order (11 each). [id, v1?, name, kindKey, faceValue, gold, unlock?]
// kindKey: A/B/C = the cluster's three stat knots (S[0..2]); ST = status bead; M = mastery; K = kin (play/hunt condition)
const OUT = {
  ghost_wolves: [
    ['su_call', 1, "Pack's Calling", 'B', 2, 260], ['wf_lope', 0, 'Long Lope', 'B', 2, 420], ['wf_bleed', 1, 'Deep Bite', 'ST', 2, 560],
    ['wf_scent', 0, "Hunter's Scent", 'A', 2, 640], ['wf_rend', 0, 'Red Thread', 'ST', 2, 820, { t: 'killEnemy', id: 'wolf', n: 2500 }],
    ['wf_third', 1, "Packmaster's Calling", 'M', 1, 1300, { t: 'killEnemy', id: 'wolf', n: 4000 }],
    ['wf_hunt', 0, 'Running Pack', 'B', 2, 820], ['wf_maul', 0, 'Iron Jaw', 'A', 2, 640], ['wf_coat', 0, 'Moonlit Coat', 'K', 2, 560, { t: 'useCharacter', id: 'wren', n: 5 }],
    ['wf_bite', 0, 'Keen Teeth', 'A', 2, 420], ['wf_fang', 1, 'Fang Sharpening', 'A', 2, 260],
  ],
  raven_flock: [
    ['rv_talon', 1, 'Keen Talons', 'A', 2, 300], ['rv_quill', 0, 'Black Quill', 'A', 2, 460], ['rv_wide', 1, 'Wider Murder', 'B', 2, 620],
    ['rv_glide', 0, 'Long Glide', 'C', 2, 700], ['rv_eye', 0, "Raven's Eye", 'ST', 0, 900, { t: 'killEnemy', id: 'crow', n: 6000 }],
    ['rv_watch', 0, 'High Watch', 'B', 2, 700], ['rv_oath', 1, 'Black Feather Oath', 'M', 1, 1300, { t: 'killEnemy', id: 'crow', n: 8000 }],
    ['rv_wing', 0, 'Swift Wing', 'C', 2, 620], ['rv_kin', 0, 'Crow-Kin', 'K', 2, 560, { t: 'evolveWeapon', id: 'raven_flock', n: 2 }],
    ['rv_beat', 0, 'Wingbeat Drum', 'C', 2, 460], ['rv_peck', 0, 'Hard Peck', 'A', 2, 300],
  ],
  spirit_bolts: [
    ['bo_twin', 1, 'Twin Wisps', 'M', 1, 1300, { t: 'evolveWeapon', id: 'spirit_bolts', n: 1 }], ['bo_glyph', 0, 'Bright Glyph', 'A', 2, 460],
    ['bo_pierce', 1, 'Piercing Wisp', 'C', 0, 700], ['bo_swift', 1, 'Swift Wisps', 'B', 2, 420],
    ['bo_ink', 0, 'Iron Ink', 'A', 2, 300], ['bo_quick', 0, 'Quick Script', 'B', 2, 300], ['bo_line', 0, 'Running Line', 'B', 2, 460],
    ['bo_page', 0, 'Turned Page', 'A', 2, 620], ['bo_hand', 0, 'Steady Hand', 'B', 2, 620], ['bo_kin', 0, 'Rootbreaker', 'K', 2, 700, { t: 'killEnemy', id: 'root_crawler', n: 3000 }],
    ['bo_seal', 0, 'Sealed Margin', 'A', 2, 820],
  ],
  chain_lightning: [
    ['cl_arc', 1, 'Forked Arc', 'C', 0, 300], ['cl_power', 1, 'Static Heart', 'A', 2, 300], ['cl_spark', 0, 'Sparkwood', 'A', 2, 460],
    ['cl_reach', 0, 'Long Reach', 'B', 2, 620], ['cl_storm', 1, 'Storm Mantle', 'B', 2, 820],
    ['cl_quick', 0, 'Quick Charge', 'C', 2, 460], ['cl_crack', 0, 'Thunder Crack', 'A', 2, 620], ['cl_hum', 0, 'Humming Air', 'C', 2, 820],
    ['cl_ground', 0, 'Grounded', 'B', 2, 620], ['cl_kin', 0, 'Storm-Caller', 'K', 2, 900, { t: 'bossKill', id: 'elder_treant', n: 3 }],
    ['cl_crown', 0, 'Crown of Sparks', 'M', 1, 1300, { t: 'evolveWeapon', id: 'chain_lightning', n: 2 }],
  ],
  holy_orbit: [
    ['or_power', 1, 'Burning Orbs', 'A', 2, 260], ['or_wick', 0, 'Long Wick', 'A', 2, 420], ['or_kindle', 0, 'Kindling', 'ST', 2, 560],
    ['or_wide', 1, 'Wider Halo', 'B', 2, 640], ['or_seventh', 1, 'Seventh Light', 'M', 1, 1300, { t: 'evolveWeapon', id: 'holy_orbit', n: 1 }],
    ['or_tide', 0, 'Turning Tide', 'C', 2, 640], ['or_ember', 0, 'Votive Embers', 'ST', 2, 820, { t: 'evolveWeapon', id: 'holy_orbit', n: 3 }],
    ['or_swing', 0, 'Censer Swing', 'C', 2, 420], ['or_spin', 0, 'Quick Circle', 'C', 2, 260],
    ['or_bright', 0, 'Bright Ring', 'B', 2, 560], ['or_vigil', 0, 'Long Vigil', 'K', 2, 700, { t: 'surviveTime', chapter: 'cursed_forest', seconds: 600 }],
  ],
};

// Sockets: [socket slot, evolution id, gate node id or null (starter)]
const SOCK = {
  ghost_wolves: [['a', 'howling_legion', null], ['b', 'phantom_stampede', 'gt_phantom_stampede'], ['c', 'dire_alpha', 'gt_dire_alpha']],
  raven_flock: [['a', 'dive_bombers', 'gt_dive_bombers'], ['b', 'murder_storm', 'gt_murder_storm'], ['c', 'spearhead', 'gt_spearhead']],
  spirit_bolts: [['a', 'spirit_tempest', 'gt_spirit_tempest'], ['b', 'soul_lance', 'gt_soul_lance'], ['c', 'returning_pages', 'gt_returning_pages']],
  chain_lightning: [['a', 'thunder_judgment', 'gt_thunder_judgment'], ['b', 'static_storm', 'gt_static_storm'], ['c', 'storm_tether', 'gt_storm_tether']],
  holy_orbit: [['a', 'sanctum_halo', null], ['b', 'judgement_wheel', 'gt_judgement_wheel'], ['c', 'vesper_tide', 'gt_vesper_tide']],
};
export const EVO_NAMES = { howling_legion: 'Howling Legion', phantom_stampede: 'Lightfoot Pack', dire_alpha: 'The Alpha', dive_bombers: 'Talon Mark', murder_storm: 'Wall of Wings', spearhead: 'Spearhead', spirit_tempest: 'Spirit Tempest', soul_lance: 'Soul Lance', returning_pages: 'Returning Pages', thunder_judgment: 'Thunder Judgment', static_storm: 'Static Storm', storm_tether: 'Storm Tether', sanctum_halo: 'Sanctum Halo', judgement_wheel: 'Judgement Wheel', vesper_tide: 'Vesper Tide' };

// Global rings. [id, v1?, name, ring, cat, face, gold, shards, effectText, unlock?]
export const RINGS = [
  // HEARTH (inner ring, day-one buys)
  ['sp_reroll1', 1, 'Second Glance', 'hearth', 'util', 0, 150, 0, 'Unlocks Reroll: +1 per run'],
  ['sp_ban1', 1, 'Let It Pass', 'hearth', 'util', 0, 150, 0, 'Unlocks Banish: +1 per run'],
  ['li_vigor', 1, 'Warm Embers', 'hearth', 'hp', 2, 180, 0, 'Max health +2%'],
  ['su_bond', 1, 'Bound Spirits', 'hearth', 'tagS', 2, 180, 0, 'Summons +2% damage'],
  ['ma_focus', 1, 'Moon-Touched', 'hearth', 'tagM', 2, 180, 0, 'Magic +2% damage'],
  ['li_reach', 1, 'Reaching Light', 'hearth', 'util', 6, 260, 0, 'Pickup radius +6%'],
  ['li_step', 1, 'Light Step', 'hearth', 'util', 2, 260, 0, 'Move speed +2%'],
  ['li_study', 1, 'Bright Memory', 'hearth', 'util', 3, 320, 0, 'Experience +3%'],
  ['li_oak', 1, 'Steadfast Heart', 'hearth', 'hp', 2, 320, 0, 'Max health +2%'],
  ['sp_cd1', 1, 'Steady Breath', 'hearth', 'util', 10, 300, 0, 'Ability cooldown -10%'],
  // WICK (second ring: verbs, ability, sustain, economy)
  ['sp_reroll2', 1, 'Third Glance', 'wick', 'util', 0, 270, 0, '+1 reroll'],
  ['sp_reroll3', 1, 'Clear Sight', 'wick', 'util', 0, 600, 0, '+1 reroll'],
  ['sp_ban2', 1, 'Let It Fade', 'wick', 'util', 0, 330, 0, '+1 banish'],
  ['sp_ban3', 1, 'Banish the Dusk', 'wick', 'util', 0, 720, 0, '+1 banish'],
  ['sp_cd2', 1, 'Quickening Spirit', 'wick', 'util', 10, 660, 0, 'Ability cooldown -10%'],
  ['sp_cd3', 1, 'Hollow Rhythm', 'wick', 'util', 10, 1350, 0, 'Ability cooldown -10%'],
  ['sp_cd4', 1, 'Unbroken Rhythm', 'wick', 'util', 15, 2100, 2, 'Ability cooldown -15% (floor 30 s)'],
  ['sp_dur', 1, 'Long Howl', 'wick', 'util', 15, 900, 0, 'Ability lasts +15%'],
  ['sp_auto', 1, 'Last Whistle', 'wick', 'util', 0, 1050, 0, 'Ability fires itself below 30% health', { t: 'surviveTime', chapter: 'cursed_forest', seconds: 300 }],
  ['li_regen', 1, 'Growing Warmth', 'wick', 'heal', 0.75, 900, 0, 'Level-up heals 0.75% max health'],
  ['li_hearts', 1, 'Bright Hearts', 'wick', 'sustain', 5, 840, 0, 'Hearts drop +5%'],
  ['li_heal', 1, 'Mending Light', 'wick', 'sustain', 5, 900, 0, 'Hearts heal +5%'],
  ['li_magnet', 1, 'Pull of the Moon', 'wick', 'util', 25, 750, 0, 'Soul Magnets +25%'],
  ['li_coin', 1, 'Grave Coins', 'wick', 'util', 5, 720, 0, 'Gold +5%'],
  ['li_scav', 1, "Scavenger's Eye", 'wick', 'util', 6, 450, 0, 'Pickup radius +6%', { t: 'any', of: [{ t: 'killEnemy', id: 'wolf', n: 500 }, { t: 'killEnemy', id: 'crow', n: 800 }] }],
  ['li_root', 1, 'Heartwood Ward', 'wick', 'hp', 2, 750, 0, 'Max health +2%', { t: 'killEnemy', id: 'root_crawler', n: 400 }],
  ['li_vow', 1, 'Vigil of the Night', 'wick', 'util', 4, 900, 0, 'Gold +4%', { t: 'surviveTime', chapter: 'cursed_forest', seconds: 600 }],
  ['li_hoard', 1, 'Grave Wealth', 'wick', 'util', 3, 1050, 0, 'Gold +3%', { t: 'totalGold', n: 20000 }],
  ['su_pot', 1, 'Lantern-Fed', 'wick', 'tagS', 2, 390, 0, 'Summons +2% damage'],
  ['su_swift', 1, 'Swift Spirits', 'wick', 'util', 0, 540, 0, 'Summons move 4% faster (no damage effect)'],
  ['su_rush', 1, 'Rousing Light', 'wick', 'tagS', 1.5, 750, 0, 'Level-up: summons +10% for 4 s (inside the x1.75 amp cap)'],
  ['ma_cast', 1, 'Quickened Casting', 'wick', 'cast', 2, 670, 0, 'Spells cast 2% faster'],
  ['ma_area', 1, 'Widening Light', 'wick', 'area', 3, 580, 0, 'Areas and reach +3%'],
  ['ma_attune', 1, 'Attuned Hands', 'wick', 'util', 0, 1050, 0, 'Evolution-pair cards +50% (never names a recipe)'],
  ['ma_pow3', 1, 'Dusk Radiance', 'wick', 'tagM', 2, 1500, 1, 'Magic +2% damage'],
  ['sp_edge', 1, 'Edge of Dusk', 'wick', 'dmg', 1, 1500, 0, 'All damage +1%'],
  // DUSK (outer ring: keystones, capstones, revive)
  ['su_key', 1, 'Bonded Pack', 'dusk', 'tagS', 3, 1800, 3, 'KEYSTONE: summons +3%, magic -3%', null, 'ma_key'],
  ['ma_key', 1, 'Unbound Light', 'dusk', 'tagM', 3, 1800, 3, 'KEYSTONE: magic +3%, summons -3%', null, 'su_key'],
  ['li_lantern', 1, 'Lantern-Bearer', 'dusk', 'hp', 3, 1800, 3, 'KEYSTONE: max health +3%, level-ups heal 0.5% more, damage -1%', null, 'li_glass'],
  ['li_glass', 1, 'Glass Dusk', 'dusk', 'dmg', 1.5, 1800, 3, 'KEYSTONE: damage +1.5%, max health -4%', null, 'li_lantern'],
  ['li_last', 1, 'Last Light', 'dusk', 'sustain', 0, 900, 5, 'Once per run: a killing blow returns you at 20% health', { t: 'clearChapter', id: 'cursed_forest' }],
  ['li_elder', 1, "Elder's Marrow", 'dusk', 'heal', 0.5, 1200, 2, 'Level-up heals 0.5% max health', { t: 'bossKill', id: 'elder_treant' }],
  ['sp_mastery', 1, 'Dusk Mastery', 'dusk', 'dmg', 1, 2700, 2, 'All damage +1%', { t: 'all', of: [{ t: 'clearChapter', id: 'cursed_forest' }, { t: 'evolveWeapon', id: 'any', n: 5 }] }],
  ['ma_ascend', 1, 'Convergence', 'dusk', 'area', 2, 1800, 0, 'Areas and reach +2%', { t: 'evolveWeapon', id: 'any', n: 3 }],
  ['li_dawn', 1, 'Dawnlight', 'dusk', 'dmg', 1, 1500, 0, 'All damage +1% (hidden until progress)', { t: 'bestLevel', n: 50 }],
  // FOG BAND (future chapters; never buyable)
  ['tz_marsh', 1, 'Marsh-Light', 'fog', 'none', 0, 0, 0, 'A spirit that waits beyond this forest'],
  ['tz_witch', 1, 'Witch-Fire', 'fog', 'none', 0, 0, 0, 'A spell that waits beyond this forest'],
  ['tz_crown', 1, 'Drowned Crown', 'fog', 'none', 0, 0, 0, 'A light that waits beyond this forest'],
];

// Hero lanterns (between the hub and the hero's signature constellation). New ids are PLACEHOLDERS: the hero-node group
// goes through the three-options pick (CLAUDE.md) in build chunk T6 before anything is built.
export const HEROES = {
  wren: { name: 'Wren', cluster: 'ghost_wolves', nodes: [
    ['ch_wren', 1, "Orphan's Instinct", 'wpn:ghost_wolves', 2, 600, 'Ghost Wolves bite +2%', { t: 'useCharacter', id: 'wren', n: 3 }],
    ['wr_grip', 0, 'Firm Grip', 'util', 0, 900, 'Rally the Pack lasts +0.5 s (ability duration; pins still never hold bosses)', { t: 'useCharacter', id: 'wren', n: 6 }],
    ['wr_spark', 0, 'Kindred Sparks', 'none', 0, 400, 'Visual only: kill sparks join your pack (BIBLE lock)', { t: 'useCharacter', id: 'wren', n: 10 }],
  ] },
  elias: { name: 'Elias', cluster: 'holy_orbit', nodes: [
    ['ch_elias', 1, 'Votive Flame', 'wpn:holy_orbit', 2, 600, 'Holy Orbit +2%', { t: 'useCharacter', id: 'elias', n: 3 }],
    ['el_wheel', 0, 'Wide Wheel', 'util', 0, 900, 'Candle Wheel ring +8% wider (still no Burn; W3 lock)', { t: 'useCharacter', id: 'elias', n: 6 }],
    ['el_lamp', 0, 'Grave-Lamp', 'none', 0, 400, 'Visual only: lantern trail lingers longer', { t: 'useCharacter', id: 'elias', n: 10 }],
  ] },
};

const sockGold = { gt_phantom_stampede: 100, gt_judgement_wheel: 100, gt_raven_flock: 200, gt_dive_bombers: 200, gt_spearhead: 600, gt_spirit_bolts: 300, gt_dire_alpha: 300, gt_spirit_tempest: 400, gt_murder_storm: 400, gt_chain_lightning: 500, gt_soul_lance: 500, gt_returning_pages: 600, gt_static_storm: 600, gt_vesper_tide: 600, gt_storm_tether: 600, gt_thunder_judgment: 600 };
export const GATE_COND = {
  gt_phantom_stampede: 'Evolve Ghost Wolves once', gt_judgement_wheel: 'Evolve Holy Orbit once', gt_raven_flock: 'Slay 4500 Carrion Crows',
  gt_dive_bombers: 'Evolve weapons 4 times', gt_spirit_bolts: 'Slay 1500 Root Crawlers', gt_dire_alpha: 'Evolve Ghost Wolves 3 times AND slay 10000 Forest Wolves',
  gt_spirit_tempest: 'Defeat the Elder Treant AND evolve weapons 6 times', gt_static_storm: 'Evolve weapons 12 times',
  gt_chain_lightning: 'Defeat the Elder Treant 2 times AND slay 2500 Root Crawlers', gt_soul_lance: 'Defeat the Elder Treant 2 times AND evolve Spirit Bolts once',
  gt_murder_storm: 'Evolve Raven Flock once AND slay 12000 Carrion Crows', gt_thunder_judgment: 'Clear Cursed Forest 3 times AND evolve Chain Lightning once',
  gt_spearhead: 'Evolve Raven Flock 3 times AND slay 20000 Carrion Crows', gt_returning_pages: 'Evolve Spirit Bolts 2 times AND clear Cursed Forest 2 times',
  gt_storm_tether: 'Evolve Chain Lightning 2 times AND defeat the Elder Treant 5 times', gt_vesper_tide: 'Evolve Holy Orbit 3 times AND play 8 runs as Elias',
};
// Estimated bot runs to open (gates 1-12 measured, progression-gates-v1 2.2, median random/focus; 13-16 ESTIMATED from per-run rates:
// bot ~800 wolves / 900 crows / 190 crawlers per run, boss kill ~40-60% of runs, evolutions ~2-3 per run).
export const GATE_RUNS = {
  gt_phantom_stampede: '1', gt_judgement_wheel: '1', gt_raven_flock: '4-5', gt_dive_bombers: '2', gt_spirit_bolts: '8', gt_spirit_tempest: '3-4',
  gt_static_storm: '8-9', gt_dire_alpha: '12', gt_chain_lightning: '12-13', gt_soul_lance: '12', gt_murder_storm: '13', gt_thunder_judgment: '16-24',
  gt_spearhead: '~22-26 (est.)', gt_returning_pages: '~12-16 (est.)', gt_storm_tether: '~16-22 (est.)', gt_vesper_tide: '~10-14 (est.)',
};

// ---------------------------------------------------------------- derived full list
export function buildList() {
  const list = [];
  for (const [wid, c] of Object.entries(CLUSTERS)) {
    const em = EMBLEMS[c.emblem];
    if (c.heart) list.push({ id: c.heart, v1: true, name: c.name, kind: 'heart', cluster: wid, cat: 'option', face: 0, gold: sockGold[c.heart], shards: 0, text: `Unlocks ${c.name}`, cond: GATE_COND[c.heart], pos: em.heart });
    else list.push({ id: `(${wid} heart)`, display: true, name: c.name, kind: 'heart', cluster: wid, cat: 'none', face: 0, gold: 0, shards: 0, text: 'Starter spirit: always lit', pos: em.heart });
    for (const [slot, evo, gate] of SOCK[wid]) {
      const p = em.sockets[slot];
      list.push({ id: gate || `(${evo} socket)`, display: !gate, v1: !!gate, name: EVO_NAMES[evo], kind: 'socket', evo, cluster: wid, cat: 'option', face: 0, gold: gate ? sockGold[gate] : 0, shards: 0, text: gate ? `Unlocks the evolution ${EVO_NAMES[evo]} (recipe hidden)` : 'Starter evolution: known from run 1', cond: gate ? GATE_COND[gate] : '', pos: [p[0], p[1]], point: p[2] });
    }
    OUT[wid].forEach(([id, v1, name, k, face, gold, unlock], i) => {
      const slot = em.outline[i];
      const statIdx = { A: 0, B: 1, C: 2 }[k];
      const st = statIdx !== undefined ? S[wid][statIdx] : null;
      let kind = 'knot', cat = `wpn:${wid}`, text;
      const flat = (st === 'pierce' || (wid === 'chain_lightning' && id === 'cl_arc'));
      if (k === 'ST') { kind = 'bead'; cat = 'status'; text = id === 'rv_eye' ? 'Mark lasts +0.5 s (status: Mark; counted as +2% potency; the x1.75 amp cap still clamps)' : `${wid === 'holy_orbit' ? 'Burn' : 'Bleed'} potency +${face}% (status, shared cap)`; if (id === 'rv_eye') face = 2; }
      else if (k === 'M') { kind = 'mastery'; text = `${SN[wid][0]} +1% and ${SN[wid][1]} +1%`; face = 2; }
      else if (k === 'K') { kind = 'bead'; text = `${SN[wid][0]} +${face}%`; }
      else if (flat) { kind = 'bead'; text = id === 'cl_arc' ? 'Chain Lightning jumps +1 time' : 'Spirit Bolts pierce +1 foe'; face = 2; }
      else text = `${SN[wid][statIdx]} +${face}%`;
      list.push({ id, v1: !!v1, name, kind, cluster: wid, cat, face, gold: Math.round(gold * 0.7 / 10) * 10, shards: kind === 'mastery' ? 1 : 0, text, unlock, pos: em.slots[slot], slot, order: i });
    });
  }
  for (const [hid, h] of Object.entries(HEROES)) h.nodes.forEach(([id, v1, name, cat, face, gold, text, unlock]) => list.push({ id, v1: !!v1, name, kind: 'hero', hero: hid, cluster: h.cluster, cat, face, gold, shards: 0, text, unlock }));
  for (const [id, v1, name, ring, cat, face, gold, shards, text, unlock, excl] of RINGS) list.push({ id, v1: !!v1, name, kind: ring === 'fog' ? 'teaser' : ring === 'dusk' && excl ? 'key' : 'ring', ring, cat, face, gold, shards, text, unlock, excl });
  return list;
}

// ---------------------------------------------------------------- budget (progression-gates-v1 3.1 + evolutions-second-review 5.1)
export const CAPS = {
  dmg: { C: 3, w: 1.0, label: 'Global damage' }, tagS: { C: 6, w: 0.35, label: 'Summon damage (tag)' }, tagM: { C: 6, w: 0.35, label: 'Magic damage (tag)' },
  wpn: { C: 8, w: 0.08, label: 'Per-weapon stats (each weapon; 5 weapons)' }, cast: { C: 4, w: 0.3, label: 'Cast speed' }, area: { C: 6, w: 0.12, label: 'Area / reach' },
  hp: { C: 6, w: 0.2, label: 'Max health' }, heal: { C: 1.5, w: 0.4, label: 'Level-up heal' }, status: { C: 8, w: 0.15, label: 'Status potency (Bleed, Burn; shared)' },
};
export const softTotal = (S, C) => (S <= 0 ? S : C * (1 - Math.exp(-S / C)));
