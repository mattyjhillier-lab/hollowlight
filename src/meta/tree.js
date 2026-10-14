// Skill tree (meta-progression). Pure JS, no DOM, no Phaser. All save input is untrusted.
// Schema and rules: docs/design/skill-tree-v1.md. Data: src/data/tree.json.

const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const ID_RE = /^[a-z0-9_]{1,40}$/;
const MOD_KEYS = ['damage', 'area', 'cooldown', 'speed', 'pickup', 'xp', 'gold', 'abilityCd'];
const UNLOCK_IDS = ['weapon', 'hero', 'abilityUpgrade', 'modifier']; // id-style unlocks
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
  const list = [];
  for (const n of raw.nodes) {
    if (!isObj(n) || typeof n.id !== 'string' || !ID_RE.test(n.id) || BAD_KEYS.has(n.id) || n.id === 'hub') fail(`bad node id ${String(n && n.id)}`);
    if (nodes[n.id]) fail(`duplicate id ${n.id}`);
    const w = n.id;
    if (typeof n.name !== 'string' || !n.name || n.name.length > 40) fail(`${w}: bad name`);
    if (typeof n.desc !== 'string' || n.desc.length > 220) fail(`${w}: bad desc`);
    if (!own(branches, n.branch)) fail(`${w}: unknown branch`);
    if (!Number.isInteger(n.ring) || n.ring < 1 || n.ring > 60) fail(`${w}: ring must be an integer 1-60`);
    if (!fin(n.ang) || n.ang < -720 || n.ang > 720) fail(`${w}: bad angle`);
    const maxRank = n.maxRank === undefined ? 1 : n.maxRank;
    if (!Number.isInteger(maxRank) || maxRank < 1 || maxRank > 10) fail(`${w}: bad maxRank`);
    const cost = isObj(n.cost) ? n.cost : {};
    const gold = cost.gold === undefined ? 0 : cost.gold;
    const shards = cost.shards === undefined ? 0 : cost.shards;
    if (!Number.isInteger(gold) || gold < 0 || gold > 1e7 || !Number.isInteger(shards) || shards < 0 || shards > 1e5) fail(`${w}: bad cost`);
    const rankCost = n.rankCost === undefined ? 1 : n.rankCost;
    if (!fin(rankCost) || rankCost < 1 || rankCost > 5) fail(`${w}: bad rankCost`);
    for (const k of ['requires', 'excludes']) if (n[k] !== undefined && (!Array.isArray(n[k]) || n[k].length > 8 || n[k].some((x) => typeof x !== 'string'))) fail(`${w}: bad ${k}`);
    nodes[w] = {
      id: w, name: n.name, desc: n.desc, flavour: typeof n.flavour === 'string' ? n.flavour.slice(0, 120) : '', branch: n.branch,
      ring: n.ring, ang: n.ang, maxRank, cost: { gold, shards }, rankCost,
      requires: n.requires ? [...n.requires] : [], excludes: n.excludes ? [...n.excludes] : [],
      effects: Array.isArray(n.effects) ? n.effects : [], unlock: n.unlock || null,
      hidden: n.hidden === true, teaser: n.teaser === true, keystone: n.keystone === true,
      x: 0, y: 0,
    };
    list.push(w);
  }

  // references, symmetry of exclusion, effects, conditions
  for (const id of list) {
    const n = nodes[id];
    for (const r of n.requires) if (!nodes[r] || r === id) fail(`${id}: unknown prerequisite ${r}`);
    for (const r of n.excludes) if (!nodes[r] || r === id) fail(`${id}: unknown excludes ${r}`);
    if (n.teaser && (n.effects.length || !n.unlock)) fail(`${id}: teaser nodes need a condition and no effects`);
    if (!n.teaser && !n.effects.length) fail(`${id}: no effects`);
    if (n.effects.length > 6) fail(`${id}: too many effects`);
    for (const e of n.effects) checkEffect(e, data, id);
    if (n.unlock) checkCond(n.unlock, data, n.teaser, 0, { n: 0 }, id);
  }
  for (const id of list) for (const r of nodes[id].excludes) if (!nodes[r].excludes.includes(id)) nodes[r].excludes.push(id);
  for (const id of list) for (const r of nodes[id].requires) if (nodes[id].excludes.includes(r)) fail(`${id}: requires a node it excludes`);

  // cycle detection + topological order (parents first)
  const order = [];
  const state = Object.create(null);
  const visit = (id) => {
    if (state[id] === 2) return;
    if (state[id] === 1) fail(`cycle through ${id}`);
    state[id] = 1;
    for (const r of nodes[id].requires) visit(r);
    state[id] = 2;
    order.push(id);
  };
  for (const id of list) visit(id);

  // layout + overlap check + spatial index
  const cells = new Map();
  const placed = [];
  const edges = [];
  const evoWeapon = Object.create(null);
  if (data && data.evolutions) for (const [eid, e] of Object.entries(data.evolutions)) evoWeapon[eid] = e.weapon;
  for (const id of list) {
    const n = nodes[id];
    const rad = (n.ang * Math.PI) / 180;
    n.x = Math.round(Math.cos(rad) * n.ring * ringStep * 10) / 10;
    n.y = Math.round(Math.sin(rad) * n.ring * ringStep * 10) / 10;
    for (const p of placed) if (Math.hypot(p.x - n.x, p.y - n.y) < minGap) fail(`${id} overlaps ${p.id}`);
    placed.push(n);
    const key = `${Math.floor(n.x / CELL)},${Math.floor(n.y / CELL)}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(id);
    if (n.requires.length) for (const r of n.requires) edges.push({ from: r, to: id });
    else edges.push({ from: 'hub', to: id });
  }
  const children = Object.create(null);
  for (const id of list) children[id] = [];
  for (const id of list) for (const r of nodes[id].requires) children[r].push(id);
  return { version: 1, nodes, list, order, edges, branches, cells, children, evoWeapon, ringStep, minGap, cell: CELL };
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
    else fail(`${where}: unknown player effect`);
  } else if (e.drop !== undefined) {
    if (!['heart', 'magnet', 'heartHeal'].includes(e.drop)) fail(`${where}: unknown drop effect`);
    num('pct', -90, 500);
  } else if (e.ability !== undefined) {
    if (e.ability !== 'dur') fail(`${where}: unknown ability effect`);
    num('pct', 0, 300);
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
    if (miss.length) { out.state = 'locked'; out.reason = `Requires ${stJoin(miss.map((m) => def.nodes[m].name))}.`; return out; }
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
  const spent = spentOf(save.tree, def);
  save.gold = Math.min(1e12, (save.gold || 0) + spent.gold);
  save.shards = Math.min(1e12, (save.shards || 0) + spent.shards);
  save.tree = {};
  return spent;
}

// Strict repair of an untrusted tree map: unknown ids, bad ranks, broken prerequisites,
// rival (excluded) nodes, teasers and unmet unlock conditions are dropped. Parents are processed first.
export function sanitizeTree(rawTree, stats, def, data) {
  const clean = {};
  if (!def || !isObj(rawTree)) return clean;
  for (const id of def.order) {
    if (!own(rawTree, id)) continue;
    const n = def.nodes[id];
    const rank = clampInt(rawTree[id], 0, n.maxRank);
    if (rank < 1 || n.teaser) continue;
    if (n.requires.some((r) => !own(clean, r))) continue;
    if (n.excludes.some((r) => own(clean, r))) continue;
    if (n.unlock && !conditionProgress(n.unlock, stats, def, data).done) continue;
    clean[id] = rank;
  }
  return clean;
}

// ---------------------------------------------------------------- effects
export function emptyEffects() {
  return {
    mods: Object.fromEntries(MOD_KEYS.map((k) => [k, 1])),
    meta: { rerolls: 0, banishes: 0 },
    player: { maxHp: 1, regen: 0, revive: 0 },
    drops: { heart: 1, magnet: 1, heartHeal: 1 },
    ability: { dur: 1, autoHp: 0 },
    evoLuck: 1,
    rush: null,
    weaponBonus: {},
    unlocks: { weapons: [], heroes: [], abilityUpgrades: [], modifiers: [] },
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
      else if (e.unlock === 'hero') out.unlocks.heroes.push(e.id);
      else if (e.unlock === 'abilityUpgrade') out.unlocks.abilityUpgrades.push(e.id);
      else if (e.unlock === 'modifier') out.unlocks.modifiers.push(e.id);
    }
  }
  for (const k of MOD_KEYS) {
    const v = 1 + (pct[`mod:${k}`] || 0) / 100;
    out.mods[k] = k === 'cooldown' || k === 'abilityCd' ? Math.max(0.5, v) : Math.min(5, Math.max(0.1, v));
  }
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
export function presetTree(def, name) {
  const tree = {};
  const rivals = (id) => def.nodes[id].excludes.some((x) => own(tree, x));
  if (name === 'none') return tree;
  const budget = name === 'half' ? totalCost(def).gold * 0.5 : Infinity;
  let spent = 0;
  for (;;) {
    let best = null;
    for (const id of def.list) {
      const n = def.nodes[id];
      const r = rankOf(tree, id);
      if (n.teaser || r >= n.maxRank || rivals(id) || n.requires.some((q) => rankOf(tree, q) < 1)) continue;
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
    const open = p.lines.filter((l) => !l.done)[0];
    rows.push({ id, name: n.hidden && p.frac < 0.5 ? '???' : n.name, frac: p.frac, text: open ? `${open.text}: ${open.cur}/${open.goal}` : '' });
  }
  rows.sort((a, b) => b.frac - a.frac);
  return rows.slice(0, count);
}

// What the UI may show for a node (hidden nodes stay vague until progress begins).
export function describeNode(def, save, id, data) {
  const n = def.nodes[id];
  const s = nodeStatus(def, save, id, data);
  const masked = (n.hidden || n.teaser) && s.rank === 0 && !(s.cond && s.cond.frac > 0);
  const lines = masked ? [] : (s.cond ? s.cond.lines : []);
  return {
    ...s,
    masked,
    name: masked ? '???' : n.name,
    desc: masked ? 'Something stirs in the Hollow. Keep playing to find out what.' : n.desc,
    flavour: masked ? '' : n.flavour,
    condLines: masked ? [{ text: n.teaser ? 'Belongs to a part of the Hollow you have not reached.' : 'Conditions unknown.', cur: 0, goal: 1, done: false }] : lines,
    condMode: s.cond && s.cond.mode,
  };
}

// Ancestors of a node up to the hub (inclusive of the node): used for path highlighting.
export function pathToHub(def, id) {
  const ids = new Set();
  const edges = new Set();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop();
    if (ids.has(cur)) continue;
    ids.add(cur);
    const reqs = def.nodes[cur].requires;
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
