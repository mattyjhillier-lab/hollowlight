// CONTENT PIPELINE scaffold (docs/CONTENT-GUIDE.md). PRINT-ONLY: shows the data skeleton and the checklist for a new piece.
// It never writes a file and never touches src/. Copy the skeleton into the named file by hand, then follow the checklist.
//   node scripts/new-content.mjs <weapon|evolution|hero|enemy|chapter|blessing> <new_id> [--weapon <weaponId>] [--json]
//   --weapon  (evolution only) the weapon the evolution belongs to; the recipe pair is pre-filled from its stat keys
//   --json    print only the JSON snippet
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ID_RE = /^[a-z][a-z0-9_]{1,38}$/;
export const KINDS = ['weapon', 'evolution', 'hero', 'enemy', 'chapter', 'blessing'];
const TABLE = { weapon: 'weapons', evolution: 'evolutions', hero: 'characters', enemy: 'enemies', chapter: 'chapters', blessing: 'blessings' };
const HERE = dirname(fileURLToPath(import.meta.url));
export function loadData() {
  const rd = (n) => JSON.parse(readFileSync(join(HERE, '..', 'src', 'data', `${n}.json`), 'utf8'));
  return Object.fromEntries(['weapons', 'evolutions', 'characters', 'enemies', 'chapters', 'blessings'].map((n) => [n, rd(n)]));
}

const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const title = (id) => id.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const COMMON = [
  'THREE OPTIONS first: design 3 genuinely different options, recommended first, Matt picks (one-tap), record the pick in docs/LOCKED.md. Check LOCKED for conflicts.',
  'Fit check (docs/IDENTITY.md, docs/BIBLE.md) and mechanical-sense check in one line each. Security check line (no new deps, no innerHTML, no secrets).',
  'Data first: the JSON below. Then `npm test` green and `npm run build` OK.',
  'Update docs/LOCKED.md, docs/QUEUE.md and the design doc. End the report with Right now / Next / Parked.',
];

// Returns { file, snippet (JSON object), checklist: string[] }. Throws on a bad or existing id, or a bad option.
export function build(kind, id, opts = {}, data = loadData()) {
  if (!KINDS.includes(kind)) throw new Error(`kind must be one of ${KINDS.join(', ')}`);
  if (typeof id !== 'string' || !ID_RE.test(id)) throw new Error(`id "${String(id).slice(0, 40)}" must match ${ID_RE}`);
  const table = data[TABLE[kind]];
  if (own(table, id) || (kind === 'blessing' && own(table.items, id))) throw new Error(`${kind} id "${id}" already exists`);
  const N = title(id);
  if (kind === 'weapon') {
    return {
      file: `src/data/weapons.json  (add under key "${id}")`,
      snippet: {
        [id]: {
          name: N, treeGate: true, type: 'summon', tags: [], color: '#9fd8ff', desc: 'TODO one plain sentence: the verb you can feel.',
          stats: Object.fromEntries(['count', 'power', 'speed', 'duration'].map((k) => [k, { name: `TODO ${k}`, base: 1, perRank: 1, fmt: 'int', hint: 'TODO what one more rank does, in plain words' }])),
        },
      },
      checklist: [
        'Exactly 4 stats, maxRank 5 (balance.json maxRank). Stat keys are free but the evolutions use them as recipe pairs. fmt is int|dec|pct|sec; hint may use {old} {new} {rate} (see tests/stathints.test.mjs).',
        `Sim behaviour is CODE, not data: add a handler and register it by id in src/sim/weapons.js (the table near line 924, \`${id}: yourHandler\`). Keep it deterministic (sim.rng only, no Math.random, no Phaser/DOM).`,
        `Also register: HIT_CUE in src/audio/engine.js (+ cue in src/audio/cues.js), EMBLEM_OF in src/ui/hudsvg.js, the line in src/ui/titlecopy.js, codex ids in src/meta/codex.js and text in src/ui/codexcopy.js, the auHits list in src/scenes/RunScene.js, and the weapon art under src/gfx/summon/.`,
        'Tree: a cluster file src/data/tree/clusters/<id>.json (copy the closest existing one: prefix, emblem, slot, heart gate gt_<id>, 3 sockets, gates) + an emblem src/data/tree/emblems/<emblem>.json. Then `node scripts/tree-validate.mjs --table`. New ids go into tests/fixtures/tree-ids.json deliberately (append-only).',
        'Then add THREE evolutions (`node scripts/new-content.mjs evolution <id> --weapon ' + id + '`). Locked: 3 per weapon.',
        'Balance gates: node scripts/sweep-all.mjs 24 (starter bands), scripts/evo-home.mjs, scripts/evo-same-ranks.mjs, scripts/gates-pace.mjs, then the RT matrix (scripts/rt-matrix.mjs) for the fresh / mid / maxed bands. Anything that moves a locked target is Matt\'s decision.',
        'Pins to update on purpose: tests that count weapons (5) / evolutions (15) (e.g. tests/evotext.test.mjs).',
        ...COMMON,
      ],
    };
  }
  if (kind === 'evolution') {
    const wid = opts.weapon;
    const w = wid && own(data.weapons, wid) ? data.weapons[wid] : null;
    if (wid && !w) throw new Error(`--weapon "${String(wid).slice(0, 40)}" is not in weapons.json`);
    const taken = w ? Object.values(data.evolutions).filter((e) => e.weapon === wid) : [];
    if (taken.length >= 3) throw new Error(`${wid} already has 3 evolutions (locked maximum)`);
    const keys = w ? Object.keys(w.stats) : ['statA', 'statB'];
    const usedPairs = new Set(taken.map((e) => [...e.pair].sort().join('+')));
    return {
      file: `src/data/evolutions.json  (add under key "${id}")`,
      snippet: {
        [id]: {
          verb: 'VERB', sub: 'TODO four words', treeGate: true, weapon: wid || 'TODO_weapon_id', pair: keys.slice(0, 2), name: N,
          desc: 'TODO verb-first, no recipe stat named, 96 characters or fewer.', codex: 'TODO one riddle line.', cue: `evo_${id}`, tune: {},
        },
      },
      checklist: [
        `Recipe pair = two DIFFERENT stats of the weapon; each weapon needs three DIFFERENT pairs${w ? ` (already used: ${[...usedPairs].join(', ') || 'none'}; stats: ${keys.join(', ')})` : ''}.`,
        'Behaviour is CODE in src/sim/weapons.js (branch on w.evo === id), numbers in `tune`. It must change the weapon\'s VERB, not just multiply numbers.',
        'Measure: scripts/evo-home.mjs (home scenario 1.8-2.3x of maxed base, hard cap 3x also at pick time), scripts/evo-same-ranks.mjs (never below base), tests/evo-promises.test.mjs.',
        'Tree: a socket + gate gt_<id> in the weapon cluster (src/data/tree/clusters/<weapon>.json), gate count set with scripts/gates-pace.mjs; ids stay permanent.',
        `Cue evo_${id} in src/audio/cues.js; riddle line in src/ui/codexcopy.js; pick-card text is \`desc\` (tests/evotext.test.mjs checks length and that no recipe stat is named).`,
        'Pins to update on purpose: evolution count (15) in tests such as tests/evotext.test.mjs.',
        ...COMMON,
      ],
    };
  }
  if (kind === 'hero') {
    return {
      file: `src/data/characters.json  (add under key "${id}")`,
      snippet: {
        [id]: {
          name: `${N}, the TODO`, blurb: 'TODO one line.', color: '#e8b86d', kindred: 'TODO_weapon_id',
          keepsake: { id: 'todo_keepsake', name: 'TODO Keepsake', desc: 'TODO.', hint: { t: 'killEnemy', id: 'wolf', n: 300 } },
          ability: { id: 'todo_ability', name: 'TODO Ability', cooldown: 60, desc: 'TODO one verb you can feel.' },
          treeVisuals: [],
          bondPerks: { keen: 'TODO', quick: 'TODO', wise: 'TODO', warm: 'TODO', bright: 'TODO' },
        },
      },
      checklist: [
        'The tree is character-agnostic (LOCKED): a hero is data + an ability handler + a rig. Compare tests/fixtures/hero3-data.json and tests/treegen.test.mjs, which prove a third hero needs no tree edit.',
        'The ability is CODE: add a branch on its id next to pelt_dash / sanctuary_ring in src/sim/Sim.js (~line 1122). Bounded power (cooldown >= abilityCdFloor), measured with scripts/ability-ablate.mjs (on vs off within a few points).',
        'Rig and art: a code-drawn rig like src/gfx/herorig.js / eliasrig.js; unique silhouette and colour accent (LOCKED character identity). Save side: src/save/chars.js (character levels are granted after a run only).',
        'Optional tree hero fragment src/data/tree/heroes/<id>.json (copy tests/fixtures/hero3/heroes/sable.json); validate with tree-validate.',
        'Balance: both existing heroes must stay in the Wren vs Elias style gap (small); run scripts/sweep-all.mjs 24 and the RT matrix with the new hero.',
        ...COMMON,
      ],
    };
  }
  if (kind === 'enemy') {
    return {
      file: `src/data/enemies.json  (add under key "${id}")`,
      snippet: { [id]: { name: N, hp: 12, speed: 46, dmg: 5, r: 6, xp: 1, gold: 1, color: '#8a7f78', shape: 'TODO_shape_id', mass: 1 } },
      checklist: [
        'Optional `ai` block (charger / piper / etc.): copy the closest enemy (bramble_hart, stoat_piper) and keep its tell values; src/sim/enemyai.js holds the behaviour.',
        'Art: its own unique rig/frames (never a recolour): src/gfx/husk/frames.js, src/gfx/enemyrig.js, nightlook.js (eyes), crowdread.js; codex text in src/ui/codexcopy.js; audio cue in src/audio/cues.js.',
        'Add it to a chapter\'s `waves` (src/data/chapters.json) with from/to, rate0/rate1, curve and maxAlive. Readability gates: scripts/wl6-measure.mjs and the contrast tests; true-size and phone screenshots.',
        'Balance: scripts/sweep-all.mjs 24 and the RT matrix (deaths spread 6-14 min, no deaths before ~5:00).',
        ...COMMON,
      ],
    };
  }
  if (kind === 'chapter') {
    return {
      file: `src/data/chapters.json  (add under key "${id}")`,
      snippet: {
        [id]: {
          name: N, bossId: 'TODO_boss_enemy_id', bossAt: 840, bossShards: 5, rootPatches: 70,
          minis: { id: 'TODO_mini_enemy_id', at: [200, 420, 690], hp: [700, 1600, 3200], warn: 30, chest: [[55, 40, 5], [20, 60, 20], [0, 50, 50]] },
          waves: [{ enemy: 'TODO_enemy_id', from: 5, to: 900, rate0: 0.4, rate1: 1.8, curve: 0.55 }],
          events: [{ t: 60, enemy: 'TODO_enemy_id', count: 6, formation: 'arc' }],
        },
      },
      checklist: [
        'Copy cursed_forest in src/data/chapters.json and adapt; also needs `sites` (map events) if used, and an entry per difficulty in src/data/tiers.json `chapters`.',
        'KNOWN LIMIT (checked): Sim defaults chapterId to cursed_forest and src/meta/codex.js names it; per-chapter ground/palette/ARC art is not yet data-driven. A second chapter needs a design pass for those first (LOCKED EXTENSIBILITY row, launch checklist 17).',
        'Tree: src/data/tree/chapters/<id>.json (kind chapter, order, prefix) and tier gates gt_<chapter>_<tier>; chapter bands add scoped power only (docs/design/skill-tree-v2.md C.9).',
        'Boss: new enemy with `boss: true` and a `fight` block (copy elder_treant); boss sweep scripts/boss-sweep.mjs (reachers win 60-75%, fight 75-100 s).',
        ...COMMON,
      ],
    };
  }
  return {
    file: `src/data/blessings.json  (add under items."${id}")`,
    snippet: { [id]: { name: N, desc: 'TODO effect-first line.', whisper: 'TODO one quiet line.', effect: 'damage', perRank: 0.02, ranks: 3, weight: 0.7 } },
    checklist: [
      'effect must be one of the existing kinds (damage, maxHp, speed, pickup, gold, ...: see the other items and src/sim/blessings.js). A new effect kind is code and needs its own three options.',
      'Caps: the per-effect caps and `combined` in blessings.json bound the total; stay inside them (tests/blessings.test.mjs).',
      'Icon in src/ui/cardicons.js (tests/cardsui.test.mjs checks every item has one); copy rules in docs/design/blessing-copy.md.',
      'Balance: scripts/bless-sweep.mjs and scripts/g1d-sweep.mjs.',
      ...COMMON,
    ],
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const a = process.argv.slice(2);
  const wi = a.indexOf('--weapon');
  const opts = wi >= 0 ? { weapon: a[wi + 1] } : {};
  const pos = a.filter((x, i) => !x.startsWith('--') && !(wi >= 0 && i === wi + 1));
  try {
    if (pos.length !== 2) throw new Error(`usage: node scripts/new-content.mjs <${KINDS.join('|')}> <new_id> [--weapon <weaponId>] [--json]`);
    const r = build(pos[0], pos[1], opts);
    if (a.includes('--json')) console.log(JSON.stringify(r.snippet, null, 2));
    else {
      console.log(`Add to: ${r.file}\n\n${JSON.stringify(r.snippet, null, 2)}\n\nChecklist (details in docs/CONTENT-GUIDE.md):`);
      r.checklist.forEach((c, i) => console.log(`${i + 1}. ${c}`));
      console.log('\n(Print-only: nothing was written.)');
    }
  } catch (e) { console.error(e.message); process.exit(1); }
}
