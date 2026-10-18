import { nodeTitle } from './gatewords.js';
// Skill tree (meta-progression). Pure JS, no DOM, no Phaser. All save input is untrusted.
// Schema and rules: docs/design/skill-tree-v1.md and skill-tree-v2.md. Data: fragments in src/data/tree/ composed by src/meta/treedata.js.

const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const ID_RE = /^[a-z0-9_]{1,40}$/;
const MOD_KEYS = ['damage', 'area', 'cooldown', 'speed', 'pickup', 'xp', 'gold', 'abilityCd'];
const UNLOCK_IDS = ['weapon', 'evolution', 'hero', 'abilityUpgrade', 'modifier']; // id-style unlocks
const GATE_KINDS = ['weapon', 'evolution', 'hero']; // permanent unlock kinds (never refunded by respec)
const MAX_NODES = 5000;
const CELL = 240;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const own = (o, k) => Object.hasOwn(o, k);
const clampInt = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.floor(fin(v) ? v : 0)));

function fail(msg) { throw new Error(`tree.json: ${msg}`); }

// ---------------------------------------------------------------- conditions
const LEAF = {
  killEnemy: { need: ['id', 'n'], ref: 'enemies' },
  clearChapter: { need: ['id'], ref: 'chapters' },
  surviveTime: { need: ['chapter', 'seconds'], ref: 'chapters', refKey: 'chapter' },
  evolveWeapon: { need: ['id'], ref: 'weapons', anyOk: true },
  useCharacter: { need: ['id'], ref: 'characters' },
  bossKill: { need: ['id'], ref: 'enemies' },
  totalKills: { need: ['n'] },
  totalGold: { need: ['n'] },
  bestLevel: { need: ['n'] },
  runs: { need: ['n'] },
};

function checkCond(c, data, teaser, depth, budget, where) {
  if (!isObj(c) || depth > 4) fail(`${where}: bad unlock condition`);
  if (c.t === 'all' || c.t === 'any') {
    if (!Array.isArray(c.of) || c.of.length < 1 || c.of.length > 6) fail(`${where}: all/any needs 1-6 children`);
    for (const k of c.of) checkCond(k, data, teaser, depth + 1, budget, where);
    return;
  }
  const spec = own(LEAF, c.t) ? LEAF[c.t] : null;
  if (!spec) fail(`${where}: unknown condition type`);
  if (++budget.n > 10) fail(`${where}: too many conditions`);
  for (const k of spec.need) {
    if (k === 'id' || k === 'chapter') { if (typeof c[k] !== 'string' || !ID_RE.test(c[k])) fail(`${where}: ${c.t}.${k} must be an id`); }
    else if (!fin(c[k]) || c[k] <= 0 || c[k] > 1e9) fail(`${where}: ${c.t}.${k} must be a positive number`);
  }
  if (c.n !== undefined && (!fin(c.n) || c.n <= 0 || c.n > 1e9)) fail(`${where}: bad n`);
  if (spec.ref && !teaser) {
    const id = c[spec.refKey || 'id'];
    if (!(spec.anyOk && id === 'any') && !own(data[spec.ref], id)) fail(`${where}: unknown ${spec.ref} "${id}"`);
  }
}

const target = (c) => (c.t === 'surviveTime' ? c.seconds : c.n ?? 1);

// Current stat value a leaf condition measures.
function leafValue(c, stats, def) {
  const m = (o, k) => (isObj(o) && own(o, k) ? o[k] : 0);
  switch (c.t) {
    case 'killEnemy': return m(stats.killsByEnemy, c.id);
    case 'clearChapter': return m(stats.chapters, c.id)?.clears || 0;
    case 'surviveTime': return m(stats.chapters, c.chapter)?.bestTime || 0;
    case 'evolveWeapon': {
      let sum = 0;
      for (const [evo, n] of Object.entries(stats.evolved || {})) {
        if (c.id === 'any' || (def.evoWeapon && def.evoWeapon[evo] === c.id)) sum += n;
      }
      return sum;
    }
    case 'useCharacter': return m(stats.charsUsed, c.id);
    case 'bossKill': return m(stats.bossKills, c.id);
    case 'totalKills': return stats.kills || 0;
    case 'totalGold': return stats.totalGold || 0;
    case 'bestLevel': return stats.bestLevel || 0;
    case 'runs': return stats.runs || 0;
    default: return 0;
  }
}

const pretty = (id) => String(id).replace(/_/g, ' ');
function leafText(c, data) {
  const nm = (k, id) => (data && data[k] && own(data[k], id) ? data[k][id].name : pretty(id));
  const n = c.n ?? 1;
  switch (c.t) {
    case 'killEnemy': return `Slay ${n} ${nm('enemies', c.id)}`;
    case 'clearChapter': return `Clear ${nm('chapters', c.id)}${n > 1 ? ` ${n} times` : ''}`;
    case 'surviveTime': return `Survive ${Math.floor(c.seconds / 60)}:${String(c.seconds % 60).padStart(2, '0')} in ${nm('chapters', c.chapter)}`;
    case 'evolveWeapon': return c.id === 'any' ? `Evolve weapons ${n} time${n > 1 ? 's' : ''}` : `Evolve ${nm('weapons', c.id)}${n > 1 ? ` ${n} times` : ''}`;
    case 'useCharacter': return `Play ${n} run${n > 1 ? 's' : ''} as ${nm('characters', c.id).split(',')[0]}`;
    case 'bossKill': return `Defeat ${nm('enemies', c.id)}${n > 1 ? ` ${n} times` : ''}`;
    case 'totalKills': return `Slay ${n} enemies in total`;
    case 'totalGold': return `Earn ${n} gold in total`;
    case 'bestLevel': return `Reach level ${n} in one run`;
    case 'runs': return `Complete ${n} runs`;
    default: return '?';
  }
}

// -> { done, frac (0..1), lines: [{ text, cur, goal, done }] }  (all = both needed, any = one of)
export function conditionProgress(c, stats, def, data) {
  if (!c) return { done: true, frac: 1, lines: [] };
  const st = isObj(stats) ? stats : {};
  const walk = (k) => {
    if (k.t === 'all' || k.t === 'any') {
      const subs = k.of.map(walk);
      const done = k.t === 'all' ? subs.every((s) => s.done) : subs.some((s) => s.done);
      const fracs = subs.map((s) => s.frac);
      const frac = k.t === 'all' ? fracs.reduce((a, b) => a + b, 0) / fracs.length : Math.max(...fracs);
      return { done, frac: done ? 1 : Math.min(0.999, frac), lines: subs.flatMap((s) => s.lines), mode: k.t };
    }
    const goal = target(k);
    const cur = Math.min(leafValue(k, st, def), goal);
    return { done: cur >= goal, frac: goal > 0 ? cur / goal : 1, lines: [{ text: leafText(k, data), cur: Math.floor(cur), goal, done: cur >= goal }] };
  };
  return walk(c);
}

// ---------------------------------------------------------------- compile + validate
const KINDS = ['ring', 'key', 'teaser', 'knot', 'bead', 'mastery', 'heart', 'socket', 'hero', 'verb', 'kin', 'status', 'gate'];
const FRAG_RE = /^[a-z][a-z0-9_]{0,39}$/;

// Shared per-node checks (live nodes and inert/pending nodes).
function readCommon(n, w) {
  if (typeof n.name !== 'string' || !n.name || n.name.length > 40) fail(`${w}: bad name`);
  if (typeof n.desc !== 'string' || n.desc.length > 220) fail(`${w}: bad desc`);
  const maxRank = n.maxRank === undefined ? 1 : n.maxRank;
  if (!Number.isInteger(maxRank) || maxRank < 1 || maxRank > 10) fail(`${w}: bad maxRank`);
  const cost = isObj(n.cost) ? n.cost : {};
  const gold = cost.gold === undefined ? 0 : cost.gold;
  const shards = cost.shards === undefined ? 0 : cost.shards;
  if (!Number.isInteger(gold) || gold < 0 || gold > 1e7 || !Number.isInteger(shards) || shards < 0 || shards > 1e5) fail(`${w}: bad cost`);
  const rankCost = n.rankCost === undefined ? 1 : n.rankCost;
  if (!fin(rankCost) || rankCost < 1 || rankCost > 5) fail(`${w}: bad rankCost`);
  for (const [k, max] of [['requires', 8], ['excludes', 8], ['requiresAny', 4]]) {
    if (n[k] !== undefined && (!Array.isArray(n[k]) || n[k].length > max || n[k].some((x) => typeof x !== 'string'))) fail(`${w}: bad ${k}`);
  }
  if (n.requiresAny !== undefined && n.requiresAny.length < 2) fail(`${w}: requiresAny needs at least 2 alternatives`);
  if (n.kind !== undefined && !KINDS.includes(n.kind)) fail(`${w}: bad kind`);
  if (n.idx !== undefined && (!Number.isInteger(n.idx) || n.idx < 0 || n.idx > 65535)) fail(`${w}: bad idx`);
  if (n.frag !== undefined && (typeof n.frag !== 'string' || !FRAG_RE.test(n.frag) || BAD_KEYS.has(n.frag))) fail(`${w}: bad frag`);
  if (n.scope !== undefined && !(isObj(n.scope) && Number.isInteger(n.scope.minChapter) && n.scope.minChapter >= 1 && n.scope.minChapter <= 99)) fail(`${w}: bad scope`);
  return { maxRank, gold, shards, rankCost };
}

export function compileTree(raw, data) {
  if (!isObj(raw) || !Array.isArray(raw.nodes)) fail('missing nodes array');
  if (raw.nodes.length > MAX_NODES) fail('too many nodes');
  const layout = isObj(raw.layout) ? raw.layout : {};
  const ringStep = fin(layout.ringStep) && layout.ringStep >= 20 && layout.ringStep <= 400 ? layout.ringStep : 110;
  const minGap = fin(layout.minGap) ? layout.minGap : 50;
  if (!isObj(raw.branches)) fail('missing branches');
  const branches = Object.create(null);
  for (const [bid, b] of Object.entries(raw.branches)) {
    if (!ID_RE.test(bid) || BAD_KEYS.has(bid) || !isObj(b) || typeof b.name !== 'string' || !fin(b.angle)) fail(`bad branch ${bid}`);
    branches[bid] = { id: bid, name: b.name.slice(0, 30), blurb: String(b.blurb || '').slice(0, 160), angle: b.angle, color: typeof b.color === 'string' && /^#[0-9a-f]{6}$/i.test(b.color) ? b.color : null };
  }

  const nodes = Object.create(null);
  const pending = Object.create(null); // validated but inert: data for later chunks, never bought/aggregated/shown
  const list = [];
  const pendingList = [];
  const hasPos = new Set();
  for (const n of raw.nodes) {
    if (!isObj(n) || typeof n.id !== 'string' || !ID_RE.test(n.id) || BAD_KEYS.has(n.id) || n.id === 'hub') fail(`bad node id ${String(n && n.id)}`);
    if (nodes[n.id] || pending[n.id]) fail(`duplicate id ${n.id}`);
    const w = n.id;
    const c = readCommon(n, w);
    const extra = {};
    if (n.kind !== undefined) extra.kind = n.kind;
    if (n.idx !== undefined) extra.idx = n.idx;
    if (n.frag !== undefined) extra.frag = n.frag;
    if (n.cluster !== undefined) { if (typeof n.cluster !== 'string' || !ID_RE.test(n.cluster)) fail(`${w}: bad cluster`); extra.cluster = n.cluster; }
    if (n.region !== undefined) { if (typeof n.region !== 'string' || !ID_RE.test(n.region)) fail(`${w}: bad region`); extra.region = n.region; }
    if (n.scope !== undefined) extra.scope = { minChapter: n.scope.minChapter };
    if (n.inert === true) {
      if (n.requires !== undefined || n.requiresAny !== undefined) fail(`${w}: inert nodes carry no prerequisites`);
      pending[w] = {
        id: w, name: n.name, desc: n.desc, flavour: typeof n.flavour === 'string' ? n.flavour.slice(0, 120) : '', maxRank: c.maxRank, cost: { gold: c.gold, shards: c.shards }, rankCost: c.rankCost,
        effects: Array.isArray(n.effects) ? n.effects : [], unlock: n.unlock || null, inert: true, ...extra,
      };
      pendingList.push(w);
      continue;
    }
    if (!own(branches, n.branch)) fail(`${w}: unknown branch`);
    const posGiven = n.pos !== undefined;
    if (posGiven) {
      if (!Array.isArray(n.pos) || n.pos.length !== 2 || !n.pos.every((v) => fin(v) && Math.abs(v) <= 1e5)) fail(`${w}: bad pos`);
      hasPos.add(w);
    } else {
      if (!Number.isInteger(n.ring) || n.ring < 1 || n.ring > 60) fail(`${w}: ring must be an integer 1-60`);
      if (!fin(n.ang) || n.ang < -720 || n.ang > 720) fail(`${w}: bad angle`);
    }
    nodes[w] = {
      id: w, name: n.name, desc: n.desc, flavour: typeof n.flavour === 'string' ? n.flavour.slice(0, 120) : '', branch: n.branch,
      ring: posGiven ? 0 : n.ring, ang: posGiven ? 0 : n.ang, maxRank: c.maxRank, cost: { gold: c.gold, shards: c.shards }, rankCost: c.rankCost,
      requires: n.requires ? [...n.requires] : [], excludes: n.excludes ? [...n.excludes] : [],
      effects: Array.isArray(n.effects) ? n.effects : [], unlock: n.unlock || null,
      permanent: false, gateAnc: [],
      hidden: n.hidden === true, teaser: n.teaser === true, keystone: n.keystone === true,
      x: posGiven ? n.pos[0] : 0, y: posGiven ? n.pos[1] : 0,
      ...extra,
    };
    if (n.requiresAny) nodes[w].requiresAny = [...n.requiresAny];
    list.push(w);
  }

  // references, symmetry of exclusion, effects, conditions
  for (const id of list) {
    const n = nodes[id];
    for (const r of n.requires) if (!nodes[r] || r === id) fail(`${id}: unknown prerequisite ${r}`);
    for (const r of n.requiresAny || []) if (!nodes[r] || r === id || n.requires.includes(r)) fail(`${id}: unknown prerequisite ${r}`);
    for (const r of n.excludes) if (!nodes[r] || r === id) fail(`${id}: unknown excludes ${r}`);
    if (n.teaser && (n.effects.length || !n.unlock)) fail(`${id}: teaser nodes need a condition and no effects`);
    if (!n.teaser && !n.effects.length) fail(`${id}: no effects`);
    if (n.effects.length > 6) fail(`${id}: too many effects`);
    for (const e of n.effects) checkEffect(e, data, id);
    if (n.unlock) checkCond(n.unlock, data, n.teaser, 0, { n: 0 }, id);
  }
  for (const id of pendingList) {
    const n = pending[id];
    if (!n.effects.length || n.effects.length > 6) fail(`${id}: needs 1-6 effects`);
    for (const e of n.effects) checkEffect(e, data, id);
    if (n.unlock) checkCond(n.unlock, data, false, 0, { n: 0 }, id);
  }
  for (const id of list) for (const r of nodes[id].excludes) if (!nodes[r].excludes.includes(id)) nodes[r].excludes.push(id);
  for (const id of list) {
    for (const r of nodes[id].requires) if (nodes[id].excludes.includes(r)) fail(`${id}: requires a node it excludes`);
    for (const r of nodes[id].requiresAny || []) if (nodes[id].excludes.includes(r)) fail(`${id}: requires a node it excludes`);
  }

  // cycle detection + topological order (parents first); iterative so a long chain cannot overflow the stack
  const order = [];
  const state = Object.create(null);
  for (const root of list) {
    if (state[root] === 2) continue;
    const stack = [[root, 0]];
    while (stack.length) {
      const top = stack[stack.length - 1];
      const id = top[0];
      if (top[1] === 0) {
        if (state[id] === 1) fail(`cycle through ${id}`);
        state[id] = 1;
      }
      const nd = nodes[id];
      const deps = nd.requiresAny ? nd.requires.concat(nd.requiresAny) : nd.requires;
      if (top[1] < deps.length) {
        const nx = deps[top[1]++];
        if (state[nx] === 1) fail(`cycle through ${nx}`);
        if (state[nx] !== 2) stack.push([nx, 0]);
        continue;
      }
      state[id] = 2;
      order.push(id);
      stack.pop();
    }
  }

  // gate nodes: permanent, maxRank 1, hang off the hub (or other gate nodes only), 1:1 with gated content
  const gateIds = new Set();
  const gateNodeFor = { weapon: new Map(), evolution: new Map() };
  const gateNodeIds = { weapon: new Map(), evolution: new Map() };
  for (const id of list) {
    const n = nodes[id];
    const gates = n.effects.filter((e) => isObj(e) && GATE_KINDS.includes(e.unlock));
    if (!gates.length) continue;
    n.permanent = true;
    gateIds.add(id);
    if (n.maxRank !== 1) fail(`${id}: unlock nodes must have maxRank 1`);
    for (const e of gates) {
      if (e.unlock === 'hero') continue;
      const pool = e.unlock === 'weapon' ? data.weapons : data.evolutions;
      if (!pool[e.id].treeGate) fail(`${id}: unlocks ${e.unlock} "${e.id}" which is not gated`);
      gateNodeFor[e.unlock].set(e.id, (gateNodeFor[e.unlock].get(e.id) || 0) + 1);
      gateNodeIds[e.unlock].set(e.id, id);
    }
  }
  for (const id of gateIds) {
    for (const r of nodes[id].requires) if (!gateIds.has(r)) fail(`${id}: unlock nodes may only require other unlock nodes (respec keeps them)`);
    for (const r of nodes[id].requiresAny || []) if (!gateIds.has(r)) fail(`${id}: unlock nodes may only require other unlock nodes (respec keeps them)`);
  }
  if (data) {
    for (const [kind, pool] of [['weapon', data.weapons], ['evolution', data.evolutions]]) {
      for (const [gid, g] of Object.entries(pool || {})) {
        if (g && g.treeGate && !gateNodeFor[kind].has(gid)) fail(`gated ${kind} "${gid}" has no unlocking node (unreachable)`);
      }
    }
  }

  // Gate-dependency rule: a node that targets a GATED weapon (or sits behind an evolution gate) must
  // transitively require that item's gate node on EVERY route (requiresAny: the gate must be common to all alternatives).
  for (const id of order) {
    const n = nodes[id];
    const anc = new Set();
    for (const r of n.requires) { anc.add(r); for (const a of nodes[r].gateAnc) anc.add(a); }
    if (n.requiresAny) {
      let common = null;
      for (const r of n.requiresAny) {
        const s = new Set([r, ...nodes[r].gateAnc]);
        common = common === null ? s : new Set([...common].filter((x) => s.has(x)));
      }
      for (const a of common || []) anc.add(a);
    }
    n.gateAnc = [...anc].filter((a) => gateIds.has(a)); // gate nodes among all ancestors (transitive)
    if (n.permanent || !data) continue;
    for (const e of n.effects) {
      if (!isObj(e) || typeof e.weapon !== 'string' || !own(data.weapons, e.weapon) || !data.weapons[e.weapon].treeGate) continue;
      const gate = gateNodeIds.weapon.get(e.weapon);
      if (!gate || !n.gateAnc.includes(gate)) fail(`${id}: targets gated weapon "${e.weapon}" so it must (transitively) require its unlock node`);
    }
  }

  // layout + overlap check (spatial grid, O(n)) + spatial index
  const cells = new Map();
  const edges = [];
  const evoWeapon = Object.create(null);
  if (data && data.evolutions) for (const [eid, e] of Object.entries(data.evolutions)) evoWeapon[eid] = e.weapon;
  const placedAt = new Map(); // minGap-sized grid cell -> node ids placed so far
  const gcell = Math.max(1, minGap);
  const seq = Object.create(null);
  list.forEach((id, i) => { seq[id] = i; });
  for (const id of list) {
    const n = nodes[id];
    if (!hasPos.has(id)) {
      const rad = (n.ang * Math.PI) / 180;
      n.x = Math.round(Math.cos(rad) * n.ring * ringStep * 10) / 10;
      n.y = Math.round(Math.sin(rad) * n.ring * ringStep * 10) / 10;
    }
    const gx = Math.floor(n.x / gcell), gy = Math.floor(n.y / gcell);
    let clash = null;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = placedAt.get((gx + dx + 65536) * 131072 + (gy + dy + 65536));
        if (!bucket) continue;
        for (const pid of bucket) {
          const p = nodes[pid];
          if (Math.hypot(p.x - n.x, p.y - n.y) < minGap && (clash === null || seq[pid] < seq[clash])) clash = pid;
        }
      }
    }
    if (clash) fail(`${id} overlaps ${clash}`);
    const gk = (gx + 65536) * 131072 + (gy + 65536);
    if (!placedAt.has(gk)) placedAt.set(gk, []);
    placedAt.get(gk).push(id);
    const key = `${Math.floor(n.x / CELL)},${Math.floor(n.y / CELL)}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(id);
    if (n.requires.length || n.requiresAny) {
      for (const r of n.requires) edges.push({ from: r, to: id });
      for (const r of n.requiresAny || []) edges.push({ from: r, to: id, any: true });
    } else edges.push({ from: 'hub', to: id });
  }
  const children = Object.create(null);
  for (const id of list) children[id] = [];
  for (const id of list) {
    for (const r of nodes[id].requires) children[r].push(id);
    for (const r of nodes[id].requiresAny || []) children[r].push(id);
  }

  // fragments: stable per-fragment index numbers (the compact save key). Made-up test trees without idx get list order.
  const frags = Object.create(null);
  const everyId = list.concat(pendingList);
  const anyIdx = everyId.some((id) => (nodes[id] || pending[id]).idx !== undefined);
  if (anyIdx) {
    for (const id of everyId) {
      const n = nodes[id] || pending[id];
      if (n.idx === undefined || n.frag === undefined) fail(`${id}: idx and frag go together on every node`);
      const f = frags[n.frag] || (frags[n.frag] = { key: n.frag, max: -1, ids: [] });
      if (f.ids[n.idx] !== undefined) fail(`${id}: idx ${n.idx} already used by ${f.ids[n.idx]} in ${n.frag}`);
      f.ids[n.idx] = id;
      if (n.idx > f.max) f.max = n.idx;
    }
  } else if (list.length) {
    const f = (frags.legacy = { key: 'legacy', max: -1, ids: [] });
    for (const id of list) { f.ids[++f.max] = id; }
  }
  // Tombstones (retired nodes) keep their (fragment, idx) slot and their id in frags so a migration step can still see them (never in nodes/list).
  const retiredIds = Object.create(null);
  if (Array.isArray(raw.retired)) {
    for (const t of raw.retired) {
      if (!isObj(t) || typeof t.id !== 'string' || typeof t.frag !== 'string' || !Number.isInteger(t.idx) || t.idx < 0) fail('bad retired tombstone');
      const f = frags[t.frag] || (frags[t.frag] = { key: t.frag, max: -1, ids: [] });
      if (f.ids[t.idx] !== undefined) fail(`${t.id}: tombstone idx ${t.idx} already used by ${f.ids[t.idx]} in ${t.frag}`);
      if (own(nodes, t.id) || own(pending, t.id)) fail(`${t.id}: a retired id is also a live node`);
      f.ids[t.idx] = t.id;
      retiredIds[t.id] = true;
      if (t.idx > f.max) f.max = t.idx;
    }
  }
  const treeVersion = Number.isInteger(raw.treeVersion) && raw.treeVersion >= 3 && raw.treeVersion <= 99 ? raw.treeVersion : 3; // content version the compact save is written with (migrations/index.js)
  return { version: 1, treeVersion, nodes, list, order, edges, branches, cells, children, evoWeapon, ringStep, minGap, cell: CELL, pending, pendingList, frags, retiredIds };
}

function checkEffect(e, data, where) {
  if (!isObj(e)) fail(`${where}: bad effect`);
  const keys = Object.keys(e);
  const num = (k, lo, hi) => { if (!fin(e[k]) || e[k] < lo || e[k] > hi) fail(`${where}: effect ${k} out of range`); };
  if (keys.length > 6) fail(`${where}: effect too large`);
  if (e.mod !== undefined) {
    if (!MOD_KEYS.includes(e.mod)) fail(`${where}: unknown mod`);
    num('pct', -90, 200);
  } else if (e.player !== undefined) {
    if (e.player === 'maxHp') num('pct', -90, 200);
    else if (e.player === 'regen') num('add', 0, 10);
    else if (e.player === 'revive') num('frac', 0.05, 1);
    else if (e.player === 'levelHeal') num('pct', 0, 50);
    else fail(`${where}: unknown player effect`);
  } else if (e.drop !== undefined) {
    if (!['heart', 'magnet', 'heartHeal'].includes(e.drop)) fail(`${where}: unknown drop effect`);
    num('pct', -90, 500);
  } else if (e.ability !== undefined) {
    if (e.ability === 'dur' || e.ability === 'wheelRadius') num('pct', 0, 300);
    else if (e.ability === 'rallySecs') num('secs', 0.1, 5);
    else fail(`${where}: unknown ability effect`);
  } else if (e.status !== undefined) {
    // status power: T3 wires these into the sim; until then only inert nodes carry them
    if (e.status === 'bleed' || e.status === 'burn') num('pct', 0.1, 3);
    else if (e.status === 'mark' || e.status === 'pin') num('secs', 0.1, 1);
    else fail(`${where}: unknown status effect`);
  } else if (e.visual !== undefined) {
    if (!['kinSparks', 'graveLamp'].includes(e.visual)) fail(`${where}: unknown visual effect`);
  } else if (e.perk !== undefined) {
    if (e.perk === 'evoLuck') num('pct', 0, 300);
    else if (e.perk === 'rush') { num('pct', 0, 300); num('secs', 1, 30); } else fail(`${where}: unknown perk`);
  } else if (e.weapon !== undefined) {
    const w = e.weapon;
    const tagOk = ['@summon', '@magic', '@all'].includes(w);
    if (!tagOk && !(data && own(data.weapons, w))) fail(`${where}: unknown weapon ${w}`);
    if (typeof e.stat !== 'string' || !ID_RE.test(e.stat)) fail(`${where}: bad stat`);
    const hasPct = e.pct !== undefined;
    const hasAdd = e.add !== undefined;
    if (hasPct === hasAdd) fail(`${where}: weapon effect needs exactly one of pct/add`);
    if (hasPct) num('pct', -90, 300); else num('add', -20, 20);
    const ids = tagOk ? Object.keys(data.weapons).filter((i) => w === '@all' || data.weapons[i].type === w.slice(1)) : [w];
    if (!ids.some((i) => own(data.weapons[i].stats, e.stat))) fail(`${where}: no matching weapon has stat ${e.stat}`);
  } else if (e.unlock !== undefined) {
    if (e.unlock === 'rerolls' || e.unlock === 'banishes') num('n', 1, 9);
    else if (e.unlock === 'autoAbility') num('hp', 0.05, 0.9);
    else if (UNLOCK_IDS.includes(e.unlock)) {
      if (typeof e.id !== 'string' || !ID_RE.test(e.id)) fail(`${where}: unlock needs an id`);
      if (e.unlock === 'weapon' && !(data && own(data.weapons, e.id))) fail(`${where}: unknown weapon`);
      if (e.unlock === 'evolution' && !(data && own(data.evolutions, e.id))) fail(`${where}: unknown evolution`);
      if (e.unlock === 'hero' && !(data && own(data.characters, e.id))) fail(`${where}: unknown hero`);
    } else fail(`${where}: unknown unlock kind`);
  } else fail(`${where}: unknown effect`);
}

// ---------------------------------------------------------------- costs
export function costFor(node, rank) {
  const g = node.cost.gold;
  const gold = g === 0 ? 0 : Math.max(10, Math.round((g * Math.pow(node.rankCost, rank - 1)) / 10) * 10);
  return { gold, shards: node.cost.shards };
}

export function spentOf(tree, def) {
  let gold = 0;
  let shards = 0;
  for (const id of def.list) {
    const r = Math.min(def.nodes[id].maxRank, Math.max(0, Math.floor(rankOf(tree, id))));
    for (let k = 1; k <= r; k++) { const c = costFor(def.nodes[id], k); gold += c.gold; shards += c.shards; }
  }
  return { gold, shards };
}

export function totalCost(def) {
  const full = {};
  for (const id of def.list) if (!def.nodes[id].teaser) full[id] = def.nodes[id].maxRank;
  return spentOf(full, def);
}

// ---------------------------------------------------------------- state
const rankOf = (tree, id) => (tree && own(tree, id) && fin(tree[id]) ? tree[id] : 0);
const stJoin = (a) => a.join(', ');

// First unowned gate among a node's ancestors, or null.
function lockedGate(def, tree, id) {
  for (const g of def.nodes[id].gateAnc || []) if (rankOf(tree, g) < 1) return g;
  return null;
}
// Weapon gates are visible by design; an evolution gate is never named.
function gateLockText(def, gid, data) {
  const e = def.nodes[gid].effects.find((x) => x && x.unlock === 'weapon');
  if (!e) return 'Locked.';
  return `Locked: unlock ${data && data.weapons && own(data.weapons, e.id) ? data.weapons[e.id].name : pretty(e.id)} first`;
}

// state: owned | available | locked (prerequisites) | condition | excluded | teaser
export function nodeStatus(def, save, id, data) {
  const n = def.nodes[id];
  const tree = save.tree || {};
  const rank = rankOf(tree, id);
  const out = { id, rank, max: n.maxRank, state: 'available', reason: null, cond: null, affordable: false, cost: null, next: null, buyable: false };
  if (n.unlock) out.cond = conditionProgress(n.unlock, save.stats, def, data);
  if (rank >= n.maxRank) { out.state = 'owned'; return out; }
  out.next = costFor(n, rank + 1);
  out.affordable = (save.gold || 0) >= out.next.gold && (save.shards || 0) >= out.next.shards;
  if (n.teaser) { out.state = 'teaser'; out.reason = 'Not yet discoverable.'; return out; }
  if (rank === 0) {
    const rival = n.excludes.find((x) => rankOf(tree, x) > 0);
    if (rival) { out.state = 'excluded'; out.reason = `Closed by ${def.nodes[rival].name}.`; return out; }
    const miss = n.requires.filter((r) => rankOf(tree, r) < 1);
    const anyMiss = n.requiresAny && !n.requiresAny.some((r) => rankOf(tree, r) >= 1);
    if (miss.length || anyMiss) {
      out.state = 'locked';
      const gm = lockedGate(def, tree, id);
      const parts = miss.map((m) => def.nodes[m].name);
      if (anyMiss) parts.push(`one of ${n.requiresAny.map((m) => def.nodes[m].name).join(' or ')}`);
      out.reason = gm ? gateLockText(def, gm, data) : `Requires ${stJoin(parts)}.`;
      return out;
    }
    if (out.cond && !out.cond.done) { out.state = 'condition'; out.reason = 'Unlock condition not met.'; return out; }
  }
  out.state = 'available';
  out.buyable = true;
  return out;
}

export function canBuy(save, id, def, data) {
  if (!def || typeof id !== 'string' || !own(def.nodes, id)) return { ok: false, reason: 'Unknown node.' };
  const s = nodeStatus(def, save, id, data);
  if (s.state === 'owned') return { ok: false, reason: 'Already fully owned.' };
  if (!s.buyable) return { ok: false, reason: s.reason || 'Not available.' };
  if (!s.affordable) return { ok: false, reason: 'Not enough gold or soul shards.' };
  return { ok: true, cost: s.next };
}

// Atomic: all checks first, then one mutation. Returns { ok, reason?, cost?, rank? }.
export function buy(save, id, def, data) {
  const c = canBuy(save, id, def, data);
  if (!c.ok) return c;
  if (!isObj(save.tree) || Object.getPrototypeOf(save.tree) !== Object.prototype) save.tree = {};
  const rank = rankOf(save.tree, id) + 1;
  save.gold -= c.cost.gold;
  save.shards -= c.cost.shards;
  save.tree[id] = rank;
  return { ok: true, cost: c.cost, rank };
}

// v1 respec: free and total. Refund = cost recomputed from the owned nodes (never a stored total).
export function respec(save, def) {
  // Unlock nodes (weapon/evolution/hero gates) are permanent: kept, never refunded.
  const kept = {};
  const refundable = {};
  if (isObj(save.tree)) {
    for (const id of def.list) {
      const r = rankOf(save.tree, id);
      if (r < 1) continue;
      if (def.nodes[id].permanent) kept[id] = r; else refundable[id] = r;
    }
  }
  const spent = spentOf(refundable, def);
  save.gold = Math.min(1e12, (save.gold || 0) + spent.gold);
  save.shards = Math.min(1e12, (save.shards || 0) + spent.shards);
  save.tree = kept;
  return spent;
}

// Strict repair of an untrusted tree map: unknown ids, bad ranks, broken prerequisites,
// rival (excluded) nodes, teasers and unmet unlock conditions are dropped. Parents are processed first.
// Optional `refund` ({gold, shards}) is filled for owned nodes dropped ONLY because their unlock gate is
// not owned (saves from before the gate-dependency rule): spent gold is never silently lost.
export function sanitizeTree(rawTree, stats, def, data, refund = null) {
  const clean = {};
  if (!def || !isObj(rawTree)) return clean;
  const refunded = new Set();
  for (const id of def.order) {
    if (!own(rawTree, id)) continue;
    const n = def.nodes[id];
    const rank = clampInt(rawTree[id], 0, n.maxRank);
    if (rank < 1 || n.teaser) continue;
    if (n.excludes.some((r) => own(clean, r))) continue;
    // Unlock conditions gate BUYING (canBuy / nodeStatus), not owning: a node already paid for is never dropped here when its condition
    // later gets stricter or a stat regresses (gates stay permanent; the cost was paid). Graph rules below still apply.
    const missing = n.requires.filter((r) => !own(clean, r));
    if (n.requiresAny && !n.requiresAny.some((r) => own(clean, r))) missing.push(...n.requiresAny); // at least one alternative must be owned
    if (missing.length) {
      // gate-only breakage: every missing prerequisite is an unowned gate node or a node refunded for that reason
      if (refund && missing.every((r) => refunded.has(r) || def.nodes[r].permanent)) {
        refunded.add(id);
        const c = spentOf({ [id]: rank }, def);
        refund.gold = (refund.gold || 0) + c.gold;
        refund.shards = (refund.shards || 0) + c.shards;
      }
      continue;
    }
    clean[id] = rank;
  }
  return clean;
}

// ---------------------------------------------------------------- effects
export function emptyEffects() {
  return {
    mods: Object.fromEntries(MOD_KEYS.map((k) => [k, 1])),
    meta: { rerolls: 0, banishes: 0 },
    player: { maxHp: 1, regen: 0, revive: 0, levelHeal: 0 },
    drops: { heart: 1, magnet: 1, heartHeal: 1 },
    ability: { dur: 1, autoHp: 0 },
    evoLuck: 1,
    rush: null,
    weaponBonus: {},
    unlocks: { weapons: [], evolutions: [], heroes: [], abilityUpgrades: [], modifiers: [] },
  };
}

// Sum a tree map's effects. Sim consumes this at run start.
export function aggregateMods(tree, def, data) {
  const out = emptyEffects();
  const pct = { };
  const add = (k, v) => { pct[k] = (pct[k] || 0) + v; };
  const bonus = (wid, stat, kind, v) => {
    if (!out.weaponBonus[wid]) out.weaponBonus[wid] = {};
    const b = out.weaponBonus[wid][stat] || (out.weaponBonus[wid][stat] = { add: 0, pct: 0 });
    b[kind] += v;
  };
  for (const id of def.order) {
    const r = rankOf(tree, id);
    if (r < 1) continue;
    const n = def.nodes[id];
    for (const e of n.effects) {
      if (e.mod) add(`mod:${e.mod}`, e.pct * r);
      else if (e.player === 'maxHp') add('maxHp', e.pct * r);
      else if (e.player === 'regen') out.player.regen += e.add * r;
      else if (e.player === 'levelHeal') out.player.levelHeal += e.pct * r;
      else if (e.player === 'revive') out.player.revive = Math.max(out.player.revive, e.frac);
      else if (e.drop) add(`drop:${e.drop}`, e.pct * r);
      else if (e.ability === 'dur') add('abilityDur', e.pct * r);
      else if (e.perk === 'evoLuck') add('evoLuck', e.pct * r);
      else if (e.perk === 'rush') out.rush = { pct: Math.max(out.rush ? out.rush.pct : 0, e.pct * r), secs: Math.max(out.rush ? out.rush.secs : 0, e.secs) };
      else if (e.weapon) {
        const ids = ['@summon', '@magic', '@all'].includes(e.weapon)
          ? Object.keys(data.weapons).filter((i) => e.weapon === '@all' || data.weapons[i].type === e.weapon.slice(1))
          : [e.weapon];
        for (const wid of ids) if (own(data.weapons[wid].stats, e.stat)) bonus(wid, e.stat, e.pct !== undefined ? 'pct' : 'add', (e.pct !== undefined ? e.pct : e.add) * r);
      } else if (e.unlock === 'rerolls') out.meta.rerolls += e.n * r;
      else if (e.unlock === 'banishes') out.meta.banishes += e.n * r;
      else if (e.unlock === 'autoAbility') out.ability.autoHp = Math.max(out.ability.autoHp, e.hp);
      else if (e.unlock === 'weapon') out.unlocks.weapons.push(e.id);
      else if (e.unlock === 'evolution') out.unlocks.evolutions.push(e.id);
      else if (e.unlock === 'hero') out.unlocks.heroes.push(e.id);
      else if (e.unlock === 'abilityUpgrade') out.unlocks.abilityUpgrades.push(e.id);
      else if (e.unlock === 'modifier') out.unlocks.modifiers.push(e.id);
    }
  }
  for (const k of MOD_KEYS) {
    const v = 1 + (pct[`mod:${k}`] || 0) / 100;
    out.mods[k] = k === 'cooldown' || k === 'abilityCd' ? Math.max(0.5, v) : Math.min(5, Math.max(0.1, v));
  }
  out.player.levelHeal = Math.min(50, out.player.levelHeal);
  out.player.maxHp = Math.min(5, Math.max(0.2, 1 + (pct.maxHp || 0) / 100));
  for (const k of ['heart', 'magnet', 'heartHeal']) out.drops[k] = Math.min(6, Math.max(0, 1 + (pct[`drop:${k}`] || 0) / 100));
  out.ability.dur = Math.min(4, 1 + (pct.abilityDur || 0) / 100);
  out.evoLuck = Math.min(4, 1 + (pct.evoLuck || 0) / 100);
  out.meta.rerolls = Math.min(9, out.meta.rerolls);
  out.meta.banishes = Math.min(9, out.meta.banishes);
  return out;
}

// Presets for balance probes: full (every non-teaser node at max rank; first rival wins) or a
// fraction of the total gold cost bought cheapest-first. Ignores unlock conditions on purpose.
export function presetTree(def, name, withGates = false) {
  const tree = {};
  const rivals = (id) => def.nodes[id].excludes.some((x) => own(tree, x));
  if (name === 'none' || !(name === 'half' || name === 'full' || Number.isFinite(Number(name)))) return tree;
  const frac = name === 'half' ? 0.5 : name === 'full' ? 1 : Number(name);
  const budget = Number.isFinite(frac) && frac < 1 ? totalCost(def).gold * Math.max(0, frac) : Infinity;
  let spent = 0;
  for (;;) {
    let best = null;
    for (const id of def.list) {
      const n = def.nodes[id];
      const r = rankOf(tree, id);
      if (n.teaser || (n.permanent && !withGates) || r >= n.maxRank || rivals(id) || n.requires.some((q) => rankOf(tree, q) < 1)) continue;
      const c = costFor(n, r + 1).gold;
      if (!best || c < best.c) best = { id, c };
    }
    if (!best || spent + best.c > budget) break;
    spent += best.c;
    tree[best.id] = rankOf(tree, best.id) + 1;
  }
  return tree;
}

// ---------------------------------------------------------------- accomplishment helpers
// Ids of non-teaser nodes whose unlock condition is satisfied.
export function metConditions(def, stats, data) {
  const out = new Set();
  for (const id of def.list) {
    const n = def.nodes[id];
    if (n.unlock && !n.teaser && conditionProgress(n.unlock, stats, def, data).done) out.add(id);
  }
  return out;
}

// Closest locked conditions by progress. Hidden nodes only appear once progress has begun.
export function closestUnlocks(def, save, data, count = 3) {
  const rows = [];
  for (const id of def.list) {
    const n = def.nodes[id];
    if (!n.unlock || n.teaser || rankOf(save.tree, id) > 0) continue;
    const p = conditionProgress(n.unlock, save.stats, def, data);
    if (p.done || p.frac <= 0) continue;
    // progress has begun (frac > 0): same reveal rule as describeNode
    const open = p.lines.filter((l) => !l.done).slice(0, 2);
    rows.push({ id, name: nodeTitle(def, id, data), gate: !!n.permanent, frac: p.frac, text: open.map((l) => `${l.text}: ${l.cur}/${l.goal}`).join(' + ') });
  }
  rows.sort((a, b) => b.frac - a.frac);
  return rows.slice(0, count);
}

// What the UI may show for a node (hidden nodes stay vague until progress begins).
export function describeNode(def, save, id, data) {
  const n = def.nodes[id];
  const s = nodeStatus(def, save, id, data);
  let masked = (n.hidden || n.teaser) && s.rank === 0 && !(s.cond && s.cond.frac > 0);
  // a node behind an evolution gate stays '???' until that gate is owned or has progress
  if (!masked && s.rank === 0) {
    for (const g of n.gateAnc || []) {
      const ge = def.nodes[g].effects.find((x) => x && x.unlock === 'evolution');
      if (!ge || rankOf(save.tree || {}, g) >= 1) continue;
      const gc = def.nodes[g].unlock ? conditionProgress(def.nodes[g].unlock, save.stats, def, data) : null;
      if (!gc || gc.frac <= 0) masked = true;
    }
  }
  const lines = masked ? [] : (s.cond ? s.cond.lines : []);
  return {
    ...s,
    masked,
    name: nodeTitle(def, id, data, masked),
    desc: masked ? 'Something stirs in the Hollow. Keep playing to find out what.' : n.desc,
    flavour: masked ? '' : n.flavour,
    condLines: masked ? [{ text: n.teaser ? 'Belongs to a part of the Hollow you have not reached.' : 'Conditions unknown.', cur: 0, goal: 1, done: false }] : lines,
    condMode: s.cond && s.cond.mode,
  };
}

// Ancestors of a node up to the hub (inclusive of the node): used for path highlighting.
export function pathToHub(def, id, tree = null) {
  const ids = new Set();
  const edges = new Set();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop();
    if (ids.has(cur)) continue;
    ids.add(cur);
    const nd = def.nodes[cur];
    let reqs = nd.requires;
    if (nd.requiresAny) reqs = reqs.concat([nd.requiresAny.find((r) => tree && rankOf(tree, r) >= 1) || nd.requiresAny[0]]); // shortest owned route, else the first alternative
    if (!reqs.length) edges.add(`hub>${cur}`);
    for (const r of reqs) { edges.add(`${r}>${cur}`); stack.push(r); }
  }
  return { ids, edges };
}

// Spatial query for virtualised rendering: ids of nodes whose centre lies inside the rectangle.
export function queryRect(def, x0, y0, x1, y1) {
  const out = [];
  const cx0 = Math.floor(x0 / def.cell);
  const cx1 = Math.floor(x1 / def.cell);
  const cy0 = Math.floor(y0 / def.cell);
  const cy1 = Math.floor(y1 / def.cell);
  for (let cx = cx0; cx <= cx1; cx++) {
    for (let cy = cy0; cy <= cy1; cy++) {
      const ids = def.cells.get(`${cx},${cy}`);
      if (!ids) continue;
      for (const id of ids) {
        const n = def.nodes[id];
        if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1) out.push(id);
      }
    }
  }
  return out;
}

export function sanitizeSeen(raw, def) {
  const out = {};
  if (!def || !isObj(raw)) return out;
  for (const id of def.list) if (own(raw, id) && raw[id] === true) out[id] = true;
  return out;
}
