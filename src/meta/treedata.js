// Skill tree data loader: composes the fragment files in src/data/tree/ into the raw trees that compileTree() reads.
// Pure JS (no fs, no DOM). All fragment text is data; nothing here executes it. Design: docs/design/skill-tree-v2.md Appendix C.
//
//   core.json                  rings, slots, namespaces, legacy/retired ids, budget RULE, ring nodes
//   emblems/<id>.json          silhouette, 11 outline slots, heart, 3 sockets
//   clusters/<weaponId>.json   one constellation per weapon (template instance)
//   heroes/<heroId>.json       one hero lantern triple
//   tools/<toolId>.json        one tool cluster on a far slot (Satchel, Card Fan, Almanac, Hearth-key, Night Gate): free-form lanterns at local offsets
//   chapters/<chapterId>.json  one fogged chapter band
//
// composeTree(files, data) returns { live, v2, info }:
//   live = what the game runs (T3a, 2026-10-18: the v2 "Lantern Web" tree): every node not marked `inert`, with template-derived
//          requires and computed positions. A node marked `inert: true` is a validated PENDING spec (never buyable, aggregated or
//          shown) for a chunk whose sim hook is not built yet.
//   v2   = the FULL tree (live + inert nodes) used by the budget, layout and reachability checks.
//   info = validated structures for tools (cores, clusters, emblems, heroes, chapters, positions).
import { STATUSES } from './status.js';

const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const ID_RE = /^[a-z0-9_]{1,40}$/;
const SLOT_RE = /^[a-zA-Z][a-zA-Z0-9]{0,11}$/;
const PREFIX_RE = /^[a-z][a-z0-9]{1,3}$/;
const TOKEN_RE = /^(role\.[a-zA-Z0-9]{1,24}|brass|ink|glass)$/;
const PATH_RE = /^[MLCQAZ0-9 .,-]*$/;
const NS_KINDS = ['ring', 'teaser', 'gate', 'cluster', 'hero', 'chapter', 'tool'];
const MAX_FILES = 600;
const MAX_FILE_NODES = 600;
const CLUSTER_OUTLINE = 11;
const TEMPLATE_KINDS = ['knot', 'knot', ['status', 'verb', 'bead'], 'knot', ['kin', 'bead'], 'mastery', 'knot', ['verb', 'bead'], 'knot', ['status', 'verb', 'kin', 'bead'], 'knot'];
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const checkAt = (at, id) => { if (!(Array.isArray(at) && at.length === 2 && at.every((v) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 400))) throw new Error(`tree data: ${id}: place.at must be [dx, dy] within 400 of the tool centre`); };
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const own = (o, k) => Object.hasOwn(o, k);
const r1 = (v) => Math.round(v * 10) / 10;

function fail(msg) { throw new Error(`tree data: ${msg}`); }
const ensure = (cond, msg) => { if (!cond) fail(msg); };
const num = (v, lo, hi, where) => ensure(fin(v) && v >= lo && v <= hi, `${where} must be a number ${lo}..${hi}`);

// ---------------------------------------------------------------- geometry
const polar = (r, deg) => { const a = (deg * Math.PI) / 180; return [r1(r * Math.cos(a)), r1(r * Math.sin(a))]; };

export function clusterCentre(core, slot) {
  let m = /^sky(\d+)$/.exec(slot);
  if (m) { const a = core.skySlots[slot]; ensure(a !== undefined, `unknown slot ${slot}`); return polar(core.rings.sky.r, a); }
  m = /^far(\d+)$/.exec(slot);
  if (m) {
    const k = Number(m[1]);
    const f = core.rings.far;
    ensure(k >= 1 && k <= f.slots, `unknown slot ${slot}`);
    return polar(f.r, f.ang0 + f.step * (k - 1));
  }
  m = /^band(\d+)\.(\d+)$/.exec(slot);
  if (m) {
    const k = Number(m[1]), j = Number(m[2]);
    const b = core.rings.bands;
    ensure(k >= 2 && k <= 99 && j >= 1 && j <= b.constellations, `unknown slot ${slot}`);
    return polar(b.r0 + b.width * (k - 2) + b.width / 2, 90 + (360 / b.constellations) * (j - 1));
  }
  return fail(`unknown slot ${slot}`);
}

function ringPos(core, place) {
  const ring = core.rings[place.ring];
  ensure(isObj(ring) && ring.r !== undefined, `unknown ring ${place.ring}`);
  if (place.ring === 'fog') { ensure(Number.isInteger(place.i) && place.i >= 0 && place.i < ring.angles.length, 'fog slot out of range'); return polar(ring.r, ring.angles[place.i]); }
  ensure(Number.isInteger(place.i) && place.i >= 0 && place.i < ring.slots, `${place.ring} slot out of range`);
  return polar(ring.r, -90 + (360 * place.i) / ring.slots);
}

// ---------------------------------------------------------------- file checks
function checkEmblem(e, where) {
  ensure(isObj(e) && ID_RE.test(e.id || ''), `${where}: bad id`);
  const box = e.box;
  num(box, 50, 400, `${where}.box`);
  const pt = (p, n) => { ensure(Array.isArray(p) && p.length >= 2 && fin(p[0]) && fin(p[1]) && Math.abs(p[0]) <= box && Math.abs(p[1]) <= box, `${where}: ${n} outside the box`); };
  pt(e.heart, 'heart');
  ensure(Array.isArray(e.outline) && e.outline.length === CLUSTER_OUTLINE && e.outline.every((s) => typeof s === 'string' && SLOT_RE.test(s) && !BAD_KEYS.has(s)), `${where}: outline needs ${CLUSTER_OUTLINE} slot names`);
  ensure(new Set(e.outline).size === CLUSTER_OUTLINE, `${where}: outline slot names must be unique`);
  ensure(typeof e.closed === 'boolean', `${where}: closed must be a boolean`);
  ensure(e.outline.includes(e.apex), `${where}: apex must be an outline slot`);
  ensure(isObj(e.slots) && Object.keys(e.slots).length === CLUSTER_OUTLINE, `${where}: slots`);
  for (const s of e.outline) { ensure(own(e.slots, s), `${where}: slot ${s} has no point`); pt(e.slots[s], `slot ${s}`); }
  ensure(isObj(e.sockets) && ['a', 'b', 'c'].every((k) => own(e.sockets, k)) && Object.keys(e.sockets).length === 3, `${where}: exactly sockets a, b, c`);
  for (const k of ['a', 'b', 'c']) { pt(e.sockets[k], `socket ${k}`); ensure(typeof e.sockets[k][2] === 'string' && e.sockets[k][2].length <= 32, `${where}: socket ${k} needs a short label`); }
  ensure(typeof e.silhouette === 'string' && e.silhouette.length <= 600 && PATH_RE.test(e.silhouette), `${where}: silhouette path (<= 600 chars, charset MLCQAZ0-9 .,-)`);
  ensure(Array.isArray(e.medallion) && e.medallion.length <= 12, `${where}: medallion layers`);
  for (const l of e.medallion) {
    ensure(isObj(l) && typeof l.d === 'string' && l.d.length <= 600 && PATH_RE.test(l.d), `${where}: medallion path`);
    ensure(typeof l.fill === 'string' && TOKEN_RE.test(l.fill), `${where}: medallion fill must be a palette token`);
    ensure(l.stroke === undefined || (typeof l.stroke === 'string' && TOKEN_RE.test(l.stroke)), `${where}: medallion stroke must be a palette token`);
    if (l.w !== undefined) num(l.w, 0, 12, `${where}.medallion.w`);
  }
}

function checkCore(c) {
  ensure(isObj(c) && c.kind === 'core', 'core.json: kind');
  ensure(c.schema === 2, 'core.json: schema must be 2');
  ensure(Number.isInteger(c.version) && c.version >= 3 && c.version <= 99, 'core.json: version');
  ensure(isObj(c.layout) && isObj(c.branches) && Array.isArray(c.nodes), 'core.json: layout/branches/nodes');
  const R = c.rings;
  ensure(isObj(R), 'core.json: rings');
  const order = ['hearth', 'wick', 'heroes', 'sky', 'dusk', 'fog', 'far'];
  let last = 0;
  for (const k of order) { ensure(isObj(R[k]), `core.json: ring ${k}`); num(R[k].r, 1, 1e5, `rings.${k}.r`); ensure(R[k].r > last, 'core.json: ring radii must strictly increase'); last = R[k].r; }
  for (const k of ['hearth', 'wick', 'sky', 'dusk', 'far']) ensure(Number.isInteger(R[k].slots) && R[k].slots >= 1 && R[k].slots <= 200, `rings.${k}.slots`);
  ensure(Array.isArray(R.fog.angles) && R.fog.angles.length <= 24 && R.fog.angles.every(fin), 'rings.fog.angles');
  num(R.far.ang0, -360, 360, 'rings.far.ang0'); num(R.far.step, 1, 360, 'rings.far.step');
  const B = R.bands;
  ensure(isObj(B), 'rings.bands');
  num(B.r0, R.far.r, 1e5, 'rings.bands.r0'); num(B.width, 100, 5000, 'rings.bands.width');
  ensure(Number.isInteger(B.slots) && B.slots >= 1 && B.slots <= 200 && Number.isInteger(B.constellations) && B.constellations >= 0 && B.constellations <= 8, 'rings.bands counts');
  ensure(isObj(c.skySlots) && Object.keys(c.skySlots).length <= R.sky.slots, 'core.json: skySlots');
  for (const [k, a] of Object.entries(c.skySlots)) ensure(/^sky\d{1,2}$/.test(k) && fin(a), 'core.json: skySlots entry');
  ensure(isObj(c.namespaces), 'core.json: namespaces');
  for (const [p, ns] of Object.entries(c.namespaces)) {
    ensure(PREFIX_RE.test(p) && !BAD_KEYS.has(p) && p !== 'core', `namespace prefix "${p}"`);
    ensure(isObj(ns) && NS_KINDS.includes(ns.kind) && Array.isArray(ns.owners) && ns.owners.length >= 1 && ns.owners.length <= 16 && ns.owners.every((o) => o === '*' || o === 'core' || ID_RE.test(o)), `namespace ${p}`);
  }
  ensure(Array.isArray(c.legacyIds) && c.legacyIds.length <= 5000 && c.legacyIds.every((i) => typeof i === 'string' && ID_RE.test(i)), 'core.json: legacyIds');
  // TOMBSTONES: a removed node keeps its id AND its (fragment, idx) forever. Neither can ever be reused, and migration steps still see the id.
  ensure(Array.isArray(c.retired) && c.retired.length <= 5000, 'core.json: retired');
  for (const t of c.retired) ensure(isObj(t) && Object.keys(t).length === 3 && typeof t.id === 'string' && ID_RE.test(t.id) && !BAD_KEYS.has(t.id) && typeof t.frag === 'string' && PREFIX_RE.test(t.frag) && !BAD_KEYS.has(t.frag) && Number.isInteger(t.idx) && t.idx >= 0 && t.idx <= 65535, 'core.json: retired entries are tombstones {id, frag, idx}');
  const b = c.budget;
  ensure(isObj(b) && isObj(b.base) && isObj(b.perChapter) && isObj(b.categories) && isObj(b.sustain) && isObj(b.utility) && isObj(b.perWeapon), 'core.json: budget');
  for (const [k, v] of Object.entries({ ...b.base, ...b.perChapter, ...b.sustain, ...b.utility })) num(v, 0, 1e4, `budget.${k}`);
  if (b.loreShare !== undefined) num(b.loreShare, 0, 10, 'budget.loreShare');
  if (b.perTier !== undefined) {
    ensure(isObj(b.perTier), 'budget.perTier');
    for (const [k, v] of Object.entries(b.perTier)) { ensure(/^[1-9]$/.test(k) && isObj(v), `budget.perTier.${k}`); num(v.combat, 0, 100, `budget.perTier.${k}.combat`); num(v.sustain, 0, 100, `budget.perTier.${k}.sustain`); }
  }
  num(b.knotMax, 0, 100, 'budget.knotMax'); num(b.optionShareMin, 0, 1, 'budget.optionShareMin'); num(b.flatFace, 0, 10, 'budget.flatFace'); num(b.markFace, 0, 20, 'budget.markFace'); num(b.rushFace, 0, 1, 'budget.rushFace');
  num(b.perWeapon.cap, 0, 100, 'budget.perWeapon.cap'); num(b.perWeapon.weight, 0, 10, 'budget.perWeapon.weight'); num(b.perWeapon.refWeapons, 1, 100, 'budget.perWeapon.refWeapons');
  for (const [k, v] of Object.entries(b.categories)) { ensure(/^[a-zA-Z][a-zA-Z0-9_]{0,23}$/.test(k) && isObj(v), `budget category ${k}`); num(v.cap, 0, 1000, `budget.${k}.cap`); num(v.weight, 0, 10, `budget.${k}.weight`); }
}

const NODE_KEYS = new Set(['id', 'idx', 'kind', 'name', 'desc', 'flavour', 'branch', 'maxRank', 'rankCost', 'cost', 'requires', 'requiresAny', 'excludes', 'effects', 'unlock', 'hidden', 'teaser', 'keystone', 'inert', 'place', 'v2', 'scope']);
const V2_KEYS = new Set(['name', 'desc', 'effects', 'cost', 'maxRank', 'rankCost', 'unlock', 'requires', 'requiresAny', 'excludes', 'hidden']);

// ---------------------------------------------------------------- compose
export function composeTree(files, data = null) {
  ensure(Array.isArray(files) && files.length >= 1 && files.length <= MAX_FILES, 'bad file list');
  const sorted = files.map((f) => {
    ensure(isObj(f) && typeof f.path === 'string' && /^[a-z0-9_/]+\.json$/.test(f.path) && !f.path.includes('..') && !f.path.includes('//'), 'bad fragment path');
    return f;
  }).sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const seenPath = new Set();
  let core = null;
  const emblems = Object.create(null), clusters = Object.create(null), heroes = Object.create(null), chapters = Object.create(null), tools = Object.create(null);
  for (const f of sorted) {
    ensure(!seenPath.has(f.path), `duplicate fragment ${f.path}`);
    seenPath.add(f.path);
    const j = f.json;
    ensure(isObj(j) && typeof j.kind === 'string', `${f.path}: kind`);
    const stem = f.path.split('/').pop().replace(/\.json$/, '');
    if (f.path === 'core.json') { ensure(j.kind === 'core', 'core.json kind'); checkCore(j); core = j; continue; }
    const dir = f.path.split('/')[0];
    ensure(f.path.split('/').length === 2 && ID_RE.test(stem), `${f.path}: unexpected location`);
    const table = { emblems: [emblems, 'emblem', 'id'], clusters: [clusters, 'cluster', 'weapon'], heroes: [heroes, 'hero', 'hero'], chapters: [chapters, 'chapter', 'chapter'], tools: [tools, 'tool', 'tool'] }[dir];
    ensure(table, `${f.path}: unknown fragment directory`);
    const [map, kind, idKey] = table;
    ensure(j.kind === kind, `${f.path}: kind must be ${kind}`);
    ensure(j[idKey] === stem || (kind === 'emblem' && j.id === stem), `${f.path}: id must match the file name`);
    ensure(!own(map, stem), `duplicate ${kind} ${stem}`);
    map[stem] = j;
  }
  ensure(core, 'core.json missing');
  for (const [id, e] of Object.entries(emblems)) checkEmblem(e, `emblems/${id}`);
  const ns = core.namespaces;
  const legacy = new Set(core.legacyIds);
  const retired = new Set(core.retired.map((t) => t.id));
  const tombIdx = new Set(core.retired.map((t) => `${t.frag}:${t.idx}`));
  ensure(tombIdx.size === core.retired.length && retired.size === core.retired.length, 'core.json: duplicate tombstone');

  // fragment save keys = prefixes (short keys keep a 2000-node save small); unique across fragments
  const fragKeys = new Map([['core', 'core']]);
  const usedKeys = new Set(['core']);
  const claimKey = (owner, prefix, kindName) => {
    ensure(typeof prefix === 'string' && PREFIX_RE.test(prefix) && prefix !== 'core', `${kindName} ${owner}: bad prefix`);
    ensure(!usedKeys.has(prefix), `${kindName} ${owner}: prefix "${prefix}" already used by another fragment`);
    usedKeys.add(prefix);
    fragKeys.set(`${kindName}:${owner}`, prefix);
    return prefix;
  };

  const weapons = data && data.weapons;
  const evolutions = data && data.evolutions;
  const allNodes = []; // { spec, frag(save key), owner, ownerKind, cluster?, region, order }
  const seenIds = new Map();
  const idxUsed = new Map();

  const addSpec = (spec, ctx) => {
    const w = isObj(spec) && typeof spec.id === 'string' ? spec.id : '?';
    ensure(isObj(spec) && ID_RE.test(spec.id) && !BAD_KEYS.has(spec.id) && spec.id !== 'hub', `bad node id ${w}`);
    for (const k of Object.keys(spec)) ensure(NODE_KEYS.has(k), `${w}: unknown field ${k}`);
    ensure(!seenIds.has(spec.id), `duplicate id ${spec.id} (in ${ctx.owner} and ${seenIds.get(spec.id)})`);
    ensure(!retired.has(spec.id), `${w}: id is on the retired list and can never be reused`);
    seenIds.set(spec.id, ctx.owner);
    if (!legacy.has(spec.id)) {
      const us = spec.id.indexOf('_');
      ensure(us > 0 && us < spec.id.length - 1, `${w}: ids look like <prefix>_<name>`);
      const p = spec.id.slice(0, us);
      ensure(own(ns, p), `${w}: prefix "${p}" is not registered in core.namespaces`);
      const n = ns[p];
      ensure(n.owners.includes('*') || n.owners.includes(ctx.owner), `${w}: prefix "${p}" is not owned by ${ctx.owner}`);
      const okKind = n.kind === 'gate' ? ['cluster', 'hero', 'tool'].includes(ctx.ownerKind) : n.kind === ctx.ownerKind || (n.kind === 'ring' && ctx.ownerKind === 'core') || (n.kind === 'teaser' && ctx.ownerKind === 'core');
      ensure(okKind, `${w}: prefix "${p}" (${n.kind}) cannot be used inside a ${ctx.ownerKind} fragment`);
    }
    ensure(Number.isInteger(spec.idx) && spec.idx >= 0 && spec.idx <= 65535, `${w}: idx must be an integer 0..65535`);
    ensure(!tombIdx.has(`${ctx.frag}:${spec.idx}`), `${w}: idx ${spec.idx} of ${ctx.frag} belongs to a retired node and can never be reused`);
    const used = idxUsed.get(ctx.frag) || new Set();
    ensure(!used.has(spec.idx), `${w}: idx ${spec.idx} already used inside ${ctx.frag}`);
    used.add(spec.idx);
    idxUsed.set(ctx.frag, used);
    ensure(spec.inert === undefined || typeof spec.inert === 'boolean', `${w}: inert must be a boolean`);
    if (spec.v2 !== undefined) {
      ensure(isObj(spec.v2), `${w}: v2 block`);
      for (const k of Object.keys(spec.v2)) ensure(V2_KEYS.has(k), `${w}: unknown v2 field ${k}`);
    }
    if (spec.effects !== undefined) ensure(Array.isArray(spec.effects), `${w}: effects`);
    allNodes.push({ spec, ...ctx });
  };

  // ---- core ring nodes
  ensure(core.nodes.length <= MAX_FILE_NODES, 'core.json: too many nodes');
  const ringSlotUse = new Set();
  for (const s of core.nodes) {
    if (isObj(s.place) && s.place.tool !== undefined) {
      // a global lantern that lives in a tool cluster (the id and idx stay in the core fragment: ids are permanent)
      ensure(typeof s.place.tool === 'string' && own(tools, s.place.tool), `${s.id}: place.tool must name a tool cluster`);
      checkAt(s.place.at, s.id);
      addSpec(s, { frag: 'core', owner: 'core', ownerKind: 'core', region: 'rings', tool: s.place.tool });
      continue;
    }
    ensure(isObj(s.place) && typeof s.place.ring === 'string' && own(core.rings, s.place.ring) && !['heroes', 'sky', 'far', 'bands'].includes(s.place.ring), `${s.id}: ring node needs place {ring, i}`);
    const k = `${s.place.ring}:${s.place.i}`;
    ensure(!ringSlotUse.has(k), `${s.id}: ring slot ${k} already used`);
    ringSlotUse.add(k);
    ringPos(core, s.place);
    addSpec(s, { frag: 'core', owner: 'core', ownerKind: 'core', region: 'rings' });
  }

  // ---- clusters
  const slotUse = new Map();
  const clusterInfo = Object.create(null);
  for (const [wid, c] of Object.entries(clusters)) {
    const frag = claimKey(wid, c.prefix, 'cluster');
    ensure(own(ns, c.prefix) && ns[c.prefix].kind === 'cluster' && ns[c.prefix].owners.includes(wid), `cluster ${wid}: prefix "${c.prefix}" must be a registered cluster namespace owned by ${wid}`);
    ensure(own(emblems, c.emblem), `cluster ${wid}: unknown emblem`);
    clusterCentre(core, c.slot);
    ensure(!slotUse.has(c.slot), `cluster ${wid}: slot ${c.slot} already used by ${slotUse.get(c.slot)}`);
    slotUse.set(c.slot, wid);
    ensure(typeof c.chapter === 'string' && ID_RE.test(c.chapter) && typeof c.region === 'string' && ID_RE.test(c.region), `cluster ${wid}: chapter/region`);
    if (weapons) ensure(own(weapons, wid), `cluster ${wid}: unknown weapon`);
    ensure(c.hero === null || (typeof c.hero === 'string' && ID_RE.test(c.hero)), `cluster ${wid}: hero`);
    if (c.hero && data && data.characters) ensure(own(data.characters, c.hero), `cluster ${wid}: unknown hero ${c.hero}`);
    ensure(isObj(c.sockets) && ['a', 'b', 'c'].every((k) => isObj(c.sockets[k])) && Object.keys(c.sockets).length === 3, `cluster ${wid}: exactly 3 sockets`);
    ensure(Array.isArray(c.gates) && c.gates.length <= 8 && Array.isArray(c.outline) && c.outline.length === CLUSTER_OUTLINE, `cluster ${wid}: ${CLUSTER_OUTLINE} outline nodes`);
    const gateIds = new Set(c.gates.map((g) => g && g.id));
    const socketEvos = [];
    for (const k of ['a', 'b', 'c']) {
      const s = c.sockets[k];
      ensure(typeof s.evo === 'string' && ID_RE.test(s.evo), `cluster ${wid}: socket ${k} evo`);
      ensure(s.gate === null || (typeof s.gate === 'string' && gateIds.has(s.gate)), `cluster ${wid}: socket ${k} gate must be one of the cluster's gate nodes (or null for a starter evolution)`);
      socketEvos.push(s.evo);
    }
    ensure(new Set(socketEvos).size === 3, `cluster ${wid}: socket evolutions must differ`);
    if (evolutions) {
      const own3 = Object.keys(evolutions).filter((e) => evolutions[e].weapon === wid).sort();
      ensure(JSON.stringify(own3) === JSON.stringify([...socketEvos].sort()), `cluster ${wid}: sockets must be exactly the weapon's evolutions (${own3.join(', ')})`);
    }
    const heartGate = c.heart;
    ensure(heartGate === null || (typeof heartGate === 'string' && gateIds.has(heartGate)), `cluster ${wid}: heart must be one of its gate nodes or null (starter)`);
    if (weapons) {
      const gated = !!weapons[wid].treeGate;
      ensure(gated === (heartGate !== null), `cluster ${wid}: a gated weapon needs its unlock node as heart; a starter weapon has none`);
    }
    for (const k of ['a', 'b', 'c']) {
      const s = c.sockets[k];
      const gnode = s.gate ? c.gates.find((g) => g && g.id === s.gate) : null;
      const e = gnode && Array.isArray(gnode.effects) ? gnode.effects.find((x) => isObj(x) && x.unlock === 'evolution') : null;
      ensure(!s.gate || (e && e.id === s.evo), `cluster ${wid}: socket ${k} gate ${s.gate} does not match the heart/sockets (it unlocks a different evolution)`);
    }
    for (const g of c.gates) {
      const eff = isObj(g) && Array.isArray(g.effects) ? g.effects.find((e) => isObj(e) && (e.unlock === 'weapon' || e.unlock === 'evolution')) : null;
      ensure(eff, `cluster ${wid}: gate ${g && g.id} must unlock a weapon or evolution`);
      ensure(g.id === `gt_${eff.id}`, `cluster ${wid}: gate ids are gt_<unlocked id> (${g.id})`);
      const isHeart = g.id === heartGate;
      ensure(isHeart ? eff.unlock === 'weapon' && eff.id === wid : eff.unlock === 'evolution' && socketEvos.includes(eff.id) && Object.values(c.sockets).some((s) => s.gate === g.id), `cluster ${wid}: gate ${g.id} does not match the heart/sockets`);
    }
    c.gates.forEach((g) => addSpec(g, { frag, owner: wid, ownerKind: 'cluster', cluster: wid, region: c.region, role: g.id === heartGate ? 'heart' : 'socket' }));
    c.outline.forEach((s, i) => addSpec(s, { frag, owner: wid, ownerKind: 'cluster', cluster: wid, region: c.region, role: 'outline', slotIndex: i }));
    // template kinds + option share for any region but the grandfathered launch constellations
    if (c.region !== 'launch') {
      c.outline.forEach((s, i) => {
        const want = TEMPLATE_KINDS[i];
        ensure(Array.isArray(want) ? want.includes(s.kind) : s.kind === want, `cluster ${wid}: outline ${i} (${s.id}) must be kind ${Array.isArray(want) ? want.join('|') : want}`);
      });
    }
    clusterInfo[wid] = { ...c, fragKey: frag };
  }

  // ---- tool clusters (far slots, free-form lanterns at local offsets)
  const toolInfo = Object.create(null);
  for (const [tid, t] of Object.entries(tools)) {
    const frag = claimKey(tid, t.prefix, 'tool');
    ensure(own(ns, t.prefix) && ns[t.prefix].kind === 'tool' && ns[t.prefix].owners.includes(tid), `tool ${tid}: prefix "${t.prefix}" must be a registered tool namespace owned by ${tid}`);
    ensure(typeof t.slot === 'string' && /^far\d+$/.test(t.slot), `tool ${tid}: slot must be a far slot`);
    clusterCentre(core, t.slot);
    ensure(!slotUse.has(t.slot), `tool ${tid}: slot ${t.slot} already used by ${slotUse.get(t.slot)}`);
    slotUse.set(t.slot, tid);
    ensure(typeof t.name === 'string' && t.name.length >= 1 && t.name.length <= 30 && typeof t.blurb === 'string' && t.blurb.length <= 160, `tool ${tid}: name / blurb`);
    ensure(Array.isArray(t.nodes) && t.nodes.length >= 1 && t.nodes.length <= MAX_FILE_NODES, `tool ${tid}: nodes`);
    t.nodes.forEach((s, i) => {
      ensure(isObj(s.place) && Object.keys(s.place).length === 1, `${s && s.id}: tool nodes use place {at: [dx, dy]}`);
      checkAt(s.place.at, s.id);
      const eff = Array.isArray(s.effects) ? s.effects.find((e) => isObj(e) && e.unlock === 'tier') : null;
      if (eff) ensure(s.id === `gt_${eff.chapter}_${eff.tier}` && s.kind === 'gate', `${s.id}: a tier gate is a gate node named gt_<chapter>_<tier>`);
      addSpec(s, { frag, owner: tid, ownerKind: 'tool', region: 'tools', role: 'tool', tool: tid, slotIndex: i });
    });
    toolInfo[tid] = { ...t, fragKey: frag };
  }

  // ---- heroes
  const heroInfo = Object.create(null);
  for (const [hid, h] of Object.entries(heroes)) {
    const frag = claimKey(hid, h.prefix, 'hero');
    ensure(own(ns, h.prefix) && ns[h.prefix].kind === 'hero' && ns[h.prefix].owners.includes(hid), `hero ${hid}: prefix "${h.prefix}" must be a registered hero namespace owned by ${hid}`);
    if (data && data.characters) ensure(own(data.characters, hid), `hero ${hid}: unknown character`);
    ensure(own(clusterInfo, h.signature), `hero ${hid}: unknown signature cluster ${h.signature}`);
    ensure(Array.isArray(h.lanterns) && h.lanterns.length === 3, `hero ${hid}: exactly 3 lanterns`);
    h.lanterns.forEach((s, i) => addSpec(s, { frag, owner: hid, ownerKind: 'hero', cluster: h.signature, region: 'heroes', role: 'hero', slotIndex: i }));
    heroInfo[hid] = { ...h, fragKey: frag };
  }

  // ---- chapters
  const chapterInfo = Object.create(null);
  const orders = new Set();
  for (const [cid, ch] of Object.entries(chapters)) {
    const frag = claimKey(cid, ch.prefix, 'chapter');
    ensure(own(ns, ch.prefix) && ns[ch.prefix].kind === 'chapter' && ns[ch.prefix].owners.includes(cid), `chapter ${cid}: prefix`);
    ensure(Number.isInteger(ch.order) && ch.order >= 1 && ch.order <= 99 && !orders.has(ch.order), `chapter ${cid}: order`);
    orders.add(ch.order);
    if (data && data.chapters && ch.future !== true) ensure(own(data.chapters, cid), `chapter ${cid}: unknown chapter (mark future:true for teasers only)`);
    ensure(Array.isArray(ch.nodes) && ch.nodes.length <= MAX_FILE_NODES, `chapter ${cid}: nodes`);
    const used = new Set();
    for (const s of ch.nodes) {
      ensure(isObj(s.place) && Number.isInteger(s.place.band) && s.place.band >= 0 && s.place.band < core.rings.bands.slots && !used.has(s.place.band), `${s.id}: band slot`);
      used.add(s.place.band);
      ensure(ch.order >= 2, `${s.id}: chapter 1 has no band nodes`);
      ensure(isObj(s.scope) && s.scope.minChapter === ch.order, `${s.id}: band nodes carry scope {minChapter: ${ch.order}}`);
      addSpec(s, { frag, owner: cid, ownerKind: 'chapter', region: cid, role: 'band', chapterOrder: ch.order });
    }
    chapterInfo[cid] = { ...ch, fragKey: frag };
  }

  // ---- gate suffixes must name what they unlock (data-aware)
  if (data) {
    for (const a of allNodes) {
      if (a.ownerKind !== 'cluster' || !(a.role === 'heart' || a.role === 'socket')) continue;
      const eff = a.spec.effects.find((e) => isObj(e) && e.unlock);
      if (eff && eff.id && own(eff, 'id')) ensure(a.spec.id === `gt_${eff.id}`, `${a.spec.id}: gate id must be gt_${eff.id}`);
    }
  }

  // ---- positions
  const positions = Object.create(null); // id -> [x, y] (v2 view)
  const centreOf = Object.create(null);
  for (const [wid, c] of Object.entries(clusterInfo)) centreOf[wid] = clusterCentre(core, c.slot);
  const toolCentres = Object.create(null);
  for (const [tid, t] of Object.entries(toolInfo)) toolCentres[tid] = clusterCentre(core, t.slot);
  const slotAngle = (wid) => {
    const m = /^sky\d+$/.test(clusterInfo[wid].slot) ? core.skySlots[clusterInfo[wid].slot] : null;
    if (m !== null) return m;
    const [cx, cy] = centreOf[wid];
    return (Math.atan2(cy, cx) * 180) / Math.PI;
  };
  for (const a of allNodes) {
    const s = a.spec;
    let p;
    if (a.ownerKind === 'core' && s.place.tool) { const [cx, cy] = clusterCentre(core, tools[s.place.tool].slot); p = [r1(cx + s.place.at[0]), r1(cy + s.place.at[1])]; }
    else if (a.ownerKind === 'core') p = ringPos(core, s.place);
    else if (a.ownerKind === 'tool') { const [cx, cy] = clusterCentre(core, tools[a.tool].slot); p = [r1(cx + s.place.at[0]), r1(cy + s.place.at[1])]; }
    else if (a.ownerKind === 'cluster') {
      const c = clusterInfo[a.cluster];
      const em = emblems[c.emblem];
      const [cx, cy] = centreOf[a.cluster];
      let local;
      if (a.role === 'outline') local = em.slots[em.outline[a.slotIndex]];
      else if (a.role === 'heart') local = em.heart;
      else { const k = Object.keys(c.sockets).find((x) => c.sockets[x].gate === s.id); local = em.sockets[k]; }
      p = [r1(cx + local[0]), r1(cy + local[1])];
    } else if (a.ownerKind === 'hero') p = polar(core.rings.heroes.r, slotAngle(a.cluster) + (a.slotIndex - 1) * 8);
    else {
      const b = core.rings.bands;
      p = polar(b.r0 + b.width * (a.chapterOrder - 2) + 40, ((s.place.band + 0.5) * 360) / b.slots);
    }
    positions[s.id] = p;
  }

  const common = (a) => {
    const o = {};
    if (a.spec.kind !== undefined) o.kind = a.spec.kind;
    o.idx = a.spec.idx; o.frag = a.frag;
    if (a.cluster) o.cluster = a.cluster;
    o.region = a.region;
    if (a.spec.scope) o.scope = a.spec.scope;
    return o;
  };

  // ---- V2 raw: every node, v2 values, template requires, computed positions
  const tagBranch = (wid) => {
    const t = weapons && own(weapons, wid) ? weapons[wid].type : 'summon';
    return t === 'magic' ? 'magic' : 'summoner';
  };
  const idsByRole = new Map(allNodes.map((a) => [a.spec.id, a]));
  const v2Nodes = allNodes.map((a) => {
    const s = a.spec;
    const m = { ...s, ...(s.v2 || {}) };
    const o = { id: s.id, name: m.name, desc: m.desc, cost: m.cost, effects: m.effects, ...common(a), pos: positions[s.id] };
    if (m.flavour) o.flavour = m.flavour;
    if (m.maxRank) o.maxRank = m.maxRank;
    if (m.rankCost) o.rankCost = m.rankCost;
    if (m.unlock) o.unlock = m.unlock;
    if (m.hidden) o.hidden = true;
    if (m.teaser) o.teaser = true;
    if (m.keystone) o.keystone = true;
    if (m.excludes) o.excludes = m.excludes;
    if (a.ownerKind === 'cluster') {
      o.branch = tagBranch(a.cluster);
      const c = clusterInfo[a.cluster];
      const em = emblems[c.emblem];
      if (a.role === 'outline') {
        const ap = em.outline.indexOf(em.apex);
        const i = a.slotIndex;
        const prev = c.outline[i - 1] && c.outline[i - 1].id, next = c.outline[i + 1] && c.outline[i + 1].id;
        const heart = c.heart ? [c.heart] : [];
        if (i === ap) { o.requires = []; o.requiresAny = [prev, next]; } else if (i === 0 || i === CLUSTER_OUTLINE - 1) o.requires = heart;
        else o.requires = [i < ap ? prev : next];
      } else o.requires = m.requires || [];
    } else if (a.ownerKind === 'hero') {
      o.branch = tagBranch(a.cluster);
      o.requires = m.requires || (clusterInfo[a.cluster].heart ? [clusterInfo[a.cluster].heart] : []); // dormant until the signature weapon is unlocked
    } else if (a.ownerKind === 'chapter' || a.ownerKind === 'tool') {
      o.branch = s.branch || 'spirit';
      o.requires = m.requires || [];
    } else {
      o.branch = s.branch || 'spirit';
      o.requires = (m.requires || []).filter((r) => idsByRole.has(r) && idsByRole.get(r).ownerKind === 'core');
    }
    if (o.requires && !o.requires.length) delete o.requires;
    if (m.requiresAny && !o.requiresAny) o.requiresAny = m.requiresAny;
    return o;
  });
  const layout = { ...core.layout, minGap: core.layout.v2MinGap ?? core.layout.minGap };
  const v2 = { version: 2, treeVersion: core.version, retired: core.retired, layout, branches: core.branches, budget: core.budget, nodes: v2Nodes };
  // LIVE = every non-inert node (v2 values) + the inert specs as pending data. Same compile rules as v2; inert nodes carry no prerequisites.
  const inertIds = new Set(allNodes.filter((a) => a.spec.inert === true).map((a) => a.spec.id));
  const live = {
    version: 1, treeVersion: core.version, retired: core.retired, layout, branches: core.branches, budget: core.budget,
    nodes: [
      ...v2Nodes.filter((n) => !inertIds.has(n.id)),
      ...v2Nodes.filter((n) => inertIds.has(n.id)).map((n) => {
        const o = { id: n.id, name: n.name, desc: n.desc, cost: n.cost, effects: n.effects, inert: true, kind: n.kind, idx: n.idx, frag: n.frag, region: n.region };
        for (const k of ['cluster', 'scope', 'flavour', 'maxRank', 'rankCost', 'unlock']) if (n[k] !== undefined) o[k] = n[k];
        return o;
      }),
    ],
  };

  return {
    live, v2,
    info: { core, emblems, clusters: clusterInfo, heroes: heroInfo, chapters: chapterInfo, tools: toolInfo, positions, centres: centreOf, toolCentres, nodes: allNodes.map((a) => ({ id: a.spec.id, frag: a.frag, idx: a.spec.idx, kind: a.spec.kind, role: a.role, cluster: a.cluster, tool: a.tool, region: a.region, inert: !!a.spec.inert })) },
  };
}

// Convenience for the game bundle: Vite's import.meta.glob result ({ './core.json': {...}, './clusters/x.json': {...} }).
export function filesFromGlob(mods) {
  return Object.entries(mods).map(([p, json]) => ({ path: p.replace(/^\.\//, ''), json }));
}

export { STATUSES };
