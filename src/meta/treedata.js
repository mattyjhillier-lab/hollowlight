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
import { tierOf } from './treetier.js';
import { placeRegions, gardenLayout, gardenFoot, roadPoints, relaxGrid, crossLinks, ringBands, ringOf, tierRadius } from './treeatlas.js';

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

// R1 GAP RELAXATION: inside one constellation, push apart any two lanterns closer than the gap of their tiers (core.layout.gapLandmark /
// gapDiamond / gapDot; a mixed pair needs the mean). Small emblems (the Bolt, the Raven) pack their landmarks tighter than any one scale can fix, so
// the cheap tier (dots) gives way first: share of a push = mobility / (sum of both mobilities). Deterministic: fixed pair order, fixed pass count.
const MOBILITY = { landmark: 1, diamond: 2, dot: 3 };
export function relaxGaps(items, gaps) {
  const need = (a, b) => (a === b ? gaps[a] : (gaps[a] + gaps[b]) / 2);
  for (let pass = 0; pass < 400; pass++) {
    let moved = false;
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      let dx = b.p[0] - a.p[0], dy = b.p[1] - a.p[1], d = Math.hypot(dx, dy);
      const req = need(a.t, b.t);
      if (d >= req) continue;
      if (d < 1e-6) { dx = 1; dy = 0; d = 1; }
      const push = (req - d) * 1.02 + 0.05, ma = MOBILITY[a.t], mb = MOBILITY[b.t];
      const sa = ma / (ma + mb), sb = mb / (ma + mb);
      a.p = [a.p[0] - (dx / d) * push * sa, a.p[1] - (dy / d) * push * sa];
      b.p = [b.p[0] + (dx / d) * push * sb, b.p[1] + (dy / d) * push * sb];
      moved = true;
    }
    if (!moved) break;
  }
  return items;
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
  // R1 layout keys (all optional; a missing key keeps the pre-R1 geometry): constellation / tool-cluster scale, landmark / diamond / dot gaps,
  // hero spacing in degrees, and the rings that get an engraved runic circle on the stone backdrop
  const L = c.layout;
  for (const [k, lo, hi] of [['clusterScale', 0.5, 6], ['toolScale', 0.5, 6], ['gapLandmark', 0, 1000], ['gapDiamond', 0, 1000], ['gapDot', 0, 1000], ['linkFar', 50, 2000], ['heroStep', 1, 90], ['heroSibling', 1, 180]]) if (L[k] !== undefined) num(L[k], lo, hi, `layout.${k}`);
  const R = c.rings;
  ensure(isObj(R), 'core.json: rings');
  if (L.runeRings !== undefined) ensure(Array.isArray(L.runeRings) && L.runeRings.length <= 12 && L.runeRings.every((k) => typeof k === 'string' && isObj(R[k]) && fin(R[k].r)), 'layout.runeRings must name rings');
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
  checkAtlas(c.atlas);
  const b = c.budget;
  ensure(isObj(b) && isObj(b.base) && isObj(b.perChapter) && isObj(b.categories) && isObj(b.sustain) && isObj(b.utility) && isObj(b.perWeapon), 'core.json: budget');
  for (const [k, v] of Object.entries({ ...b.base, ...b.perChapter, ...b.sustain, ...b.utility })) num(v, 0, 1e4, `budget.${k}`);
  if (b.loreShare !== undefined) num(b.loreShare, 0, 10, 'budget.loreShare');
  if (b.perTier !== undefined) {
    ensure(isObj(b.perTier), 'budget.perTier');
    for (const [k, v] of Object.entries(b.perTier)) { ensure(/^[1-9]$/.test(k) && isObj(v), `budget.perTier.${k}`); num(v.combat, 0, 100, `budget.perTier.${k}.combat`); num(v.sustain, 0, 100, `budget.perTier.${k}.sustain`); }
  }
  num(b.knotMax, 0, 100, 'budget.knotMax'); num(b.optionShareMin, 0, 1, 'budget.optionShareMin'); num(b.flatFace, 0, 10, 'budget.flatFace'); num(b.markFace, 0, 20, 'budget.markFace'); num(b.rushFace, 0, 1, 'budget.rushFace');
  if (c.price !== undefined) ensure(isObj(c.price) && Object.keys(c.price).every((k) => k === 'creep') && fin(c.price.creep) && c.price.creep >= 0 && c.price.creep <= 0.3, 'core.json: price.creep must be 0..0.3');
  num(b.perWeapon.cap, 0, 100, 'budget.perWeapon.cap'); num(b.perWeapon.weight, 0, 10, 'budget.perWeapon.weight'); num(b.perWeapon.refWeapons, 1, 100, 'budget.perWeapon.refWeapons');
  for (const [k, v] of Object.entries(b.categories)) { ensure(/^[a-zA-Z][a-zA-Z0-9_]{0,23}$/.test(k) && isObj(v), `budget category ${k}`); num(v.cap, 0, 1000, `budget.${k}.cap`); num(v.weight, 0, 10, `budget.${k}.weight`); }
}

// S1 ATLAS (core.atlas): ring tiers (names + radii), garden geometry, region spacing and the display-only / reserved region records.
const REGION_KINDS = ['night', 'reserved', 'chapter', 'far'];
const NAME_RE = /^[A-Za-z0-9 .,'\-]{1,40}$/;
function checkOrbit(o, where) {
  ensure(isObj(o) && Object.keys(o).every((k) => k === 'tier' || k === 'angle') && Number.isInteger(o.tier) && o.tier >= 1 && o.tier <= 40 && fin(o.angle) && o.angle >= -360 && o.angle <= 720, `${where}: orbit must be {tier: 1..40, angle: degrees}`);
}
function checkAtlas(A) {
  ensure(isObj(A), 'core.json: atlas');
  ensure(Array.isArray(A.tiers) && A.tiers.length >= 2 && A.tiers.length <= 12, 'atlas.tiers');
  let last = -1;
  for (const t of A.tiers) { ensure(isObj(t) && ID_RE.test(t.id || '') && typeof t.name === 'string' && NAME_RE.test(t.name) && fin(t.r) && t.r > last && t.r <= 1e5, 'atlas.tiers entries {id, name, r} with increasing r'); last = t.r; }
  num(A.tierStep, 100, 5000, 'atlas.tierStep'); num(A.regionGap, 0, 1000, 'atlas.regionGap'); num(A.autoStep, 3, 90, 'atlas.autoStep');
  const G = A.garden;
  ensure(isObj(G) && Array.isArray(G.spoke) && G.spoke.length >= 1 && G.spoke.length <= 6 && Array.isArray(G.fork) && G.fork.length >= 1 && G.fork.length <= 5 && [...G.spoke, ...G.fork, G.lead, G.seal, G.forkSpread, G.wave].every((v) => fin(v) && v >= 0 && v <= 2000), 'atlas.garden');
  ensure(G.spoke.every((v, i) => i === 0 || v > G.spoke[i - 1]) && G.lead > G.spoke[G.spoke.length - 1] && G.seal > G.lead && G.fork.every((v, i) => i === 0 || v > G.fork[i - 1]), 'atlas.garden radii must increase outward');
  ensure(Array.isArray(A.regions) && A.regions.length <= 64, 'atlas.regions');
  const seen = new Set();
  for (const r of A.regions) {
    ensure(isObj(r) && ID_RE.test(r.id || '') && !seen.has(r.id) && REGION_KINDS.includes(r.kind), 'atlas.regions entries need a unique id and a kind');
    seen.add(r.id);
    for (const k of Object.keys(r)) ensure(['id', 'kind', 'name', 'orbit', 'weapon', 'lit', 'reserved', 'medallion', 'foot'].includes(k), `atlas region ${r.id}: unknown field ${k}`);
    ensure(r.name === undefined || (typeof r.name === 'string' && NAME_RE.test(r.name)), `atlas region ${r.id}: name`);
    ensure(r.weapon === undefined || (typeof r.weapon === 'string' && ID_RE.test(r.weapon)), `atlas region ${r.id}: weapon`);
    ensure(r.medallion === undefined || (typeof r.medallion === 'string' && ID_RE.test(r.medallion)), `atlas region ${r.id}: medallion`);
    ensure(r.lit === undefined || typeof r.lit === 'boolean', `atlas region ${r.id}: lit`);
    ensure(r.reserved === undefined || typeof r.reserved === 'boolean', `atlas region ${r.id}: reserved`);
    if (r.foot !== undefined) num(r.foot, 20, 1000, `atlas region ${r.id}: foot`);
    if (r.orbit !== undefined) checkOrbit(r.orbit, `atlas region ${r.id}`);
  }
  ensure(A.heroes === undefined || (isObj(A.heroes) && Object.keys(A.heroes).length <= 64), 'atlas.heroes');
  for (const [h, o] of Object.entries(A.heroes || {})) { ensure(ID_RE.test(h) && !BAD_KEYS.has(h), 'atlas.heroes key'); checkOrbit(o, `atlas hero ${h}`); }
  if (A.links !== undefined) num(A.links, 0, 400, 'atlas.links');
}

// S1 ROADS: a fragment's bought path chains. road = { from: node id, to: node id, nodes: [specs] }: nodes[0] requires `from`, each next one the
// previous, and `to` requires the last (its own typed requires are replaced). The road's nodes belong to no constellation or tool group (so they
// never wait for a heart), carry generic effects only, and are laid out between the two ends.
function checkRoads(list, where) {
  if (list === undefined) return [];
  ensure(Array.isArray(list) && list.length <= 16, `${where}: roads`);
  for (const r of list) ensure(isObj(r) && Object.keys(r).every((k) => ['from', 'to', 'nodes'].includes(k)) && ID_RE.test(r.from || '') && ID_RE.test(r.to || '') && r.from !== r.to && Array.isArray(r.nodes) && r.nodes.length >= 1 && r.nodes.length <= 24, `${where}: road needs {from, to, nodes[1..24]}`);
  return list;
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
  // namespaces: core.json registers the core / ring / tool / chapter prefixes; a weapon or hero fragment's own prefix registers itself (TREE-GEN1:
  // a new hero or weapon is its fragment + its game data, no core.json edit). A prefix already registered keeps its kind and owners.
  const ns = Object.assign(Object.create(null), core.namespaces);
  const selfNs = (prefix, kind, owner) => { if (typeof prefix === 'string' && PREFIX_RE.test(prefix) && !BAD_KEYS.has(prefix) && !own(ns, prefix)) ns[prefix] = { kind, owners: [owner] }; };
  for (const [wid, c] of Object.entries(clusters)) if (isObj(c)) selfNs(c.prefix, 'cluster', wid); // all first, so any fragment's ids see every prefix
  for (const [hid, h] of Object.entries(heroes)) if (isObj(h)) selfNs(h.prefix, 'hero', hid);
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
      // a shared hero prefix (owners '*', e.g. ch_ for each hero's first lantern) names only its own hero: ch_<heroId>
      if (n.kind === 'hero' && n.owners.includes('*') && ctx.ownerKind === 'hero') ensure(spec.id === `${p}_${ctx.owner}`, `${w}: the shared hero prefix "${p}" is only for ${p}_${ctx.owner}`);
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
    if (isObj(s.place) && s.place.entry !== undefined) {
      // S1: a tool group's gold-only way in (a bridge lantern), placed on the group's rim facing where its road comes from
      ensure(Object.keys(s.place).length === 1 && typeof s.place.entry === 'string' && own(tools, s.place.entry), `${s.id}: place.entry must name a tool cluster`);
      addSpec(s, { frag: 'core', owner: 'core', ownerKind: 'core', region: 'rings', tool: s.place.entry, entry: true });
      continue;
    }
    if (isObj(s.place) && s.place.tool !== undefined) {
      // a global lantern that lives in a tool cluster (the id and idx stay in the core fragment: ids are permanent)
      ensure(typeof s.place.tool === 'string' && own(tools, s.place.tool), `${s.id}: place.tool must name a tool cluster`);
      checkAt(s.place.at, s.id);
      addSpec(s, { frag: 'core', owner: 'core', ownerKind: 'core', region: 'rings', tool: s.place.tool });
      continue;
    }
    if (isObj(s.place) && s.place.near !== undefined) {
      // a lantern placed beside its parent (connected-unlock rule, 2026-10-21): {near: <core node id>, at: [dx, dy]}, resolved after every ring slot
      ensure(Object.keys(s.place).length === 2 && typeof s.place.near === 'string' && ID_RE.test(s.place.near) && s.place.near !== s.id && core.nodes.some((o) => o && o.id === s.place.near), `${s && s.id}: place.near must name another core lantern`);
      checkAt(s.place.at, s.id);
      addSpec(s, { frag: 'core', owner: 'core', ownerKind: 'core', region: 'rings', near: s.place.near });
      continue;
    }
    ensure(isObj(s.place) && typeof s.place.ring === 'string' && own(core.rings, s.place.ring) && !['heroes', 'sky', 'far', 'bands'].includes(s.place.ring), `${s.id}: ring node needs place {ring, i}`);
    const k = `${s.place.ring}:${s.place.i}`;
    ensure(!ringSlotUse.has(k), `${s.id}: ring slot ${k} already used`);
    ringSlotUse.add(k);
    ringPos(core, s.place);
    addSpec(s, { frag: 'core', owner: 'core', ownerKind: 'core', region: 'rings' });
  }

  // ---- clusters: OUTLINE constellations (the 11-slot emblem template: Ghost Wolves, Raven Flock, synthetic) and GARDENS (S1 magic weapons:
  // one branch template per evolution = lead dots -> lead diamond -> seal -> forks; counts come from `branches`, never hard-coded)
  const clusterInfo = Object.create(null);
  const roadSrc = []; // { owner, ownerKind, frag, list }
  const SOCKET_RE = /^[a-z]$/;
  for (const [wid, c] of Object.entries(clusters)) {
    const frag = claimKey(wid, c.prefix, 'cluster');
    ensure(own(ns, c.prefix) && ns[c.prefix].kind === 'cluster' && ns[c.prefix].owners.includes(wid), `cluster ${wid}: prefix "${c.prefix}" must be a registered cluster namespace owned by ${wid}`);
    ensure(own(emblems, c.emblem), `cluster ${wid}: unknown emblem`);
    ensure(c.slot === undefined || (typeof c.slot === 'string' && c.slot.length <= 16), `cluster ${wid}: slot`); // pre-S1 field, ignored (orbit / auto-slot place it)
    if (c.orbit !== undefined) checkOrbit(c.orbit, `cluster ${wid}`);
    ensure(typeof c.chapter === 'string' && ID_RE.test(c.chapter) && typeof c.region === 'string' && ID_RE.test(c.region), `cluster ${wid}: chapter/region`);
    if (weapons) ensure(own(weapons, wid), `cluster ${wid}: unknown weapon`);
    // `hero` is optional and informational only (a weapon fragment never needs to name a hero: hero fragments name their signature weapon)
    ensure(c.hero === undefined || c.hero === null || (typeof c.hero === 'string' && ID_RE.test(c.hero)), `cluster ${wid}: hero`);
    if (c.hero && data && data.characters) ensure(own(data.characters, c.hero), `cluster ${wid}: unknown hero ${c.hero}`);
    const garden = c.branches !== undefined;
    ensure(isObj(c.sockets) && Object.keys(c.sockets).length >= 1 && Object.keys(c.sockets).length <= 6 && Object.keys(c.sockets).every((k) => SOCKET_RE.test(k) && isObj(c.sockets[k])), `cluster ${wid}: sockets`);
    if (!garden) ensure(['a', 'b', 'c'].every((k) => isObj(c.sockets[k])) && Object.keys(c.sockets).length === 3, `cluster ${wid}: exactly 3 sockets`);
    ensure(Array.isArray(c.gates) && c.gates.length <= 8, `cluster ${wid}: gates`);
    if (!garden) ensure(Array.isArray(c.outline) && c.outline.length === CLUSTER_OUTLINE, `cluster ${wid}: ${CLUSTER_OUTLINE} outline nodes`);
    const gateIds = new Set(c.gates.map((g) => g && g.id));
    const socketEvos = [];
    for (const k of Object.keys(c.sockets)) {
      const s = c.sockets[k];
      ensure(typeof s.evo === 'string' && ID_RE.test(s.evo), `cluster ${wid}: socket ${k} evo`);
      ensure(s.gate === null || (typeof s.gate === 'string' && gateIds.has(s.gate)), `cluster ${wid}: socket ${k} gate must be one of the cluster's gate nodes (or null for a starter evolution)`);
      socketEvos.push(s.evo);
    }
    ensure(new Set(socketEvos).size === socketEvos.length, `cluster ${wid}: socket evolutions must differ`);
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
    for (const k of Object.keys(c.sockets)) {
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
    let branchInfo = null;
    if (garden) {
      ensure(c.outline === undefined || (Array.isArray(c.outline) && c.outline.length === 0), `cluster ${wid}: a garden has branches, not an outline`);
      ensure(Array.isArray(c.nodes) && c.nodes.length <= 200, `cluster ${wid}: nodes`);
      ensure(Array.isArray(c.branches) && c.branches.length === Object.keys(c.sockets).length, `cluster ${wid}: one branch per socket`);
      const specs = new Map([...c.gates, ...c.nodes].map((s) => [isObj(s) ? s.id : null, s]));
      const used = new Set(heartGate ? [heartGate] : []);
      const take = (id, want, what) => {
        ensure(typeof id === 'string' && specs.has(id) && !used.has(id), `cluster ${wid}: ${what} ${id} must be one of its nodes, used once`);
        used.add(id);
        const t = tierOf(specs.get(id));
        ensure(t === want, `cluster ${wid}: ${what} ${id} must be a ${want} (kind ${specs.get(id).kind})`);
        return id;
      };
      const seenSock = new Set();
      branchInfo = c.branches.map((b, bi) => {
        ensure(isObj(b) && Object.keys(b).every((k) => ['socket', 'seal', 'lead', 'diamond', 'forks'].includes(k)) && typeof b.socket === 'string' && own(c.sockets, b.socket) && !seenSock.has(b.socket), `cluster ${wid}: branch ${bi} socket`);
        seenSock.add(b.socket);
        const sk = c.sockets[b.socket];
        ensure(Array.isArray(b.lead) && b.lead.length >= 1 && b.lead.length <= 6 && Array.isArray(b.forks) && b.forks.length >= 1 && b.forks.length <= 3 && b.forks.every((f) => Array.isArray(f) && f.length >= 1 && f.length <= 5), `cluster ${wid}: branch ${b.socket} needs lead[1..6] and forks[1..3] of [1..5]`);
        const lead = b.lead.map((id) => take(id, 'dot', 'lead-in'));
        const diamond = take(b.diamond, 'diamond', 'lead-in diamond');
        const seal = take(b.seal, 'landmark', 'seal');
        if (sk.gate) ensure(seal === sk.gate, `cluster ${wid}: branch ${b.socket} seal must be its socket gate ${sk.gate}`);
        else {
          const sp = specs.get(seal);
          ensure(!gateIds.has(seal) && Array.isArray(sp.effects) && sp.effects.length === 1 && isObj(sp.effects[0]) && sp.effects[0].echo === sk.evo, `cluster ${wid}: the seal of the starter evolution ${sk.evo} is a zero-power landmark ({echo: "${sk.evo}"})`);
        }
        const forks = b.forks.map((f, fi) => f.map((id, k) => take(id, k === f.length - 1 ? 'diamond' : 'dot', `fork ${fi + 1}`)));
        return { socket: b.socket, evo: sk.evo, lead, diamond, seal, forks };
      });
      for (const id of specs.keys()) ensure(used.has(id), `cluster ${wid}: node ${id} is in no branch`);
    }
    const roleOf = Object.create(null);
    if (branchInfo) for (const b of branchInfo) {
      b.lead.forEach((id, k) => { roleOf[id] = { role: 'lead', socket: b.socket, step: k }; });
      roleOf[b.diamond] = { role: 'diamond', socket: b.socket };
      roleOf[b.seal] = { role: 'seal', socket: b.socket };
      b.forks.forEach((f, fi) => f.forEach((id, k) => { roleOf[id] = { role: 'fork', socket: b.socket, fork: fi, step: k, leaf: k === f.length - 1 }; }));
    }
    c.gates.forEach((g) => addSpec(g, { frag, owner: wid, ownerKind: 'cluster', cluster: wid, region: c.region, role: g.id === heartGate ? 'heart' : branchInfo ? 'seal' : 'socket', ...(roleOf[g.id] ? { garden: roleOf[g.id] } : {}) }));
    if (garden) c.nodes.forEach((s) => addSpec(s, { frag, owner: wid, ownerKind: 'cluster', cluster: wid, region: c.region, role: roleOf[s.id] ? roleOf[s.id].role : 'node', garden: roleOf[s.id] }));
    else c.outline.forEach((s, i) => addSpec(s, { frag, owner: wid, ownerKind: 'cluster', cluster: wid, region: c.region, role: 'outline', slotIndex: i }));
    // template kinds + option share for any region but the grandfathered launch constellations
    if (!garden && c.region !== 'launch') {
      c.outline.forEach((s, i) => {
        const want = TEMPLATE_KINDS[i];
        ensure(Array.isArray(want) ? want.includes(s.kind) : s.kind === want, `cluster ${wid}: outline ${i} (${s.id}) must be kind ${Array.isArray(want) ? want.join('|') : want}`);
      });
    }
    roadSrc.push({ owner: wid, ownerKind: 'cluster', frag, list: checkRoads(c.roads, `cluster ${wid}`) });
    clusterInfo[wid] = { ...c, fragKey: frag, garden, branchInfo };
  }

  // ---- tool clusters (free-form lanterns at local offsets round the group's centre; `anchors` give single lanterns their own place on the
  // map (S1: the night gates are scattered), and `place: {near: id, at}` hangs a lantern beside another lantern of the group)
  const toolInfo = Object.create(null);
  for (const [tid, t] of Object.entries(tools)) {
    const frag = claimKey(tid, t.prefix, 'tool');
    ensure(own(ns, t.prefix) && ns[t.prefix].kind === 'tool' && ns[t.prefix].owners.includes(tid), `tool ${tid}: prefix "${t.prefix}" must be a registered tool namespace owned by ${tid}`);
    ensure(t.slot === undefined || (typeof t.slot === 'string' && t.slot.length <= 16), `tool ${tid}: slot`); // pre-S1 field, ignored
    if (t.orbit !== undefined) checkOrbit(t.orbit, `tool ${tid}`);
    ensure(typeof t.name === 'string' && t.name.length >= 1 && t.name.length <= 30 && typeof t.blurb === 'string' && t.blurb.length <= 160, `tool ${tid}: name / blurb`);
    ensure(Array.isArray(t.nodes) && t.nodes.length >= 1 && t.nodes.length <= MAX_FILE_NODES, `tool ${tid}: nodes`);
    ensure(t.anchors === undefined || (isObj(t.anchors) && Object.keys(t.anchors).length <= 8), `tool ${tid}: anchors`);
    const ids = new Set(t.nodes.map((s) => isObj(s) && s.id));
    for (const [aid, o] of Object.entries(t.anchors || {})) {
      ensure(ids.has(aid), `tool ${tid}: anchor ${aid} is not one of its lanterns`);
      ensure(isObj(o) && Object.keys(o).every((k) => k === 'orbit' || k === 'name'), `tool ${tid}: anchor ${aid}`);
      if (o.orbit !== undefined) checkOrbit(o.orbit, `tool ${tid} anchor ${aid}`);
      ensure(o.name === undefined || (typeof o.name === 'string' && NAME_RE.test(o.name)), `tool ${tid}: anchor ${aid} name`);
    }
    t.nodes.forEach((s, i) => {
      const anchored = !!(t.anchors && own(t.anchors, s.id));
      if (anchored) ensure(s.place === undefined, `${s && s.id}: an anchored lantern has no place`);
      else if (isObj(s.place) && s.place.near !== undefined) { ensure(Object.keys(s.place).length === 2 && ids.has(s.place.near) && s.place.near !== s.id, `${s && s.id}: place.near must name another lantern of the group`); checkAt(s.place.at, s.id); }
      else { ensure(isObj(s.place) && Object.keys(s.place).length === 1, `${s && s.id}: tool nodes use place {at: [dx, dy]}`); checkAt(s.place.at, s.id); }
      const eff = Array.isArray(s.effects) ? s.effects.find((e) => isObj(e) && e.unlock === 'tier') : null;
      if (eff) ensure(s.id === `gt_${eff.chapter}_${eff.tier}` && s.kind === 'gate', `${s.id}: a tier gate is a gate node named gt_<chapter>_<tier>`);
      addSpec(s, { frag, owner: tid, ownerKind: 'tool', region: 'tools', role: 'tool', tool: tid, slotIndex: i, ...(anchored ? { anchor: true } : {}), ...(isObj(s.place) && s.place.near ? { toolNear: s.place.near } : {}) });
    });
    roadSrc.push({ owner: tid, ownerKind: 'tool', frag, list: checkRoads(t.roads, `tool ${tid}`) });
    toolInfo[tid] = { ...t, fragKey: frag };
  }
  roadSrc.push({ owner: 'core', ownerKind: 'core', frag: 'core', list: checkRoads(core.roads, 'core.json') });

  // ---- roads (after every fragment, so ends may name any node; the road nodes themselves are added here)
  const roadOf = Object.create(null); // road node id -> { road index, step }
  const roads = [];
  for (const src of roadSrc) for (const r of src.list) {
    const k = roads.length;
    r.nodes.forEach((s, i) => {
      ensure(isObj(s) && (s.place === undefined), `${s && s.id}: road lanterns are laid out by the road (no place)`);
      addSpec(s, { frag: src.frag, owner: src.owner, ownerKind: src.ownerKind, region: 'paths', role: 'road', road: k, step: i });
      roadOf[s.id] = { road: k, step: i };
    });
    roads.push({ k, owner: src.owner, from: r.from, to: r.to, ids: r.nodes.map((s) => s.id) });
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
      if (a.ownerKind !== 'cluster' || !(a.role === 'heart' || a.role === 'socket' || a.role === 'seal')) continue;
      const eff = a.spec.effects.find((e) => isObj(e) && e.unlock);
      if (eff && eff.id && own(eff, 'id')) ensure(a.spec.id === `gt_${eff.id}`, `${a.spec.id}: gate id must be gt_${eff.id}`);
    }
  }
  // ---- road ends: both must exist; a node is the end of at most one road; a road never ends on a fork (forks are leaves)
  const roadTo = Object.create(null);
  for (const r of roads) {
    ensure(seenIds.has(r.from), `road to ${r.to}: unknown start ${r.from}`);
    ensure(seenIds.has(r.to) && !own(roadOf, r.to), `road from ${r.from}: unknown end ${r.to}`);
    ensure(!own(roadTo, r.to), `${r.to}: more than one road ends here`);
    const fa = idsOf(r.from), ta = idsOf(r.to);
    ensure(!(fa.garden && fa.garden.role === 'fork') && !(ta.garden && ta.garden.role === 'fork'), `road ${r.from} -> ${r.to}: forks are leaves (no road starts or ends on one)`);
    roadTo[r.to] = r;
  }
  function idsOf(id) { return allNodes.find((a) => a.spec.id === id); }

  // ---- positions (S1 ATLAS: src/meta/treeatlas.js). Positions are never saved and never in the released fingerprints.
  const positions = Object.create(null); // id -> [x, y]
  const lay = core.layout, AT = core.atlas, G = AT.garden;
  const SC = fin(lay.clusterScale) ? lay.clusterScale : 1; // outline constellations: the emblem points are spread by this factor
  const TS = fin(lay.toolScale) ? lay.toolScale : 1; // tool groups: so are the local offsets
  const gaps = { landmark: lay.gapLandmark, diamond: lay.gapDiamond, dot: lay.gapDot ?? lay.v2MinGap };
  // 1. the hub web: hearth + wick ring lanterns and the lanterns hung beside them
  const fogNodes = [];
  for (const a of allNodes) {
    if (a.ownerKind !== 'core' || a.near || a.tool) continue;
    if (a.spec.place.ring === 'fog') { fogNodes.push(a); continue; }
    positions[a.spec.id] = ringPos(core, a.spec.place);
  }
  // lanterns hung beside another lantern: placed as soon as the parent has a place; strict = whatever is left must be placeable
  const resolveNear = (list, parentOf, at, strict = true) => {
    let wait = list;
    while (wait.length) {
      const next = wait.filter((a) => !own(positions, parentOf(a)));
      if (next.length === wait.length) { ensure(!strict, `place.near cannot be resolved for ${next.map((a) => a.spec.id).join(', ')}`); return next; }
      for (const a of wait) if (own(positions, parentOf(a))) { const [px, py] = positions[parentOf(a)]; const d = at(a); positions[a.spec.id] = [r1(px + d[0]), r1(py + d[1])]; }
      wait = next;
    }
    return [];
  };
  resolveNear(allNodes.filter((a) => a.near), (a) => a.near, (a) => a.spec.place.at, false);
  let hubR = 0;
  for (const id of Object.keys(positions)) hubR = Math.max(hubR, Math.hypot(positions[id][0], positions[id][1]));
  hubR += 30;
  // 2. region records -> centres (orbit {tier, angle}; a region without one auto-slots)
  const outlineFoot = (c) => { const em = emblems[c.emblem]; let m = 0; for (const p of [em.heart, ...Object.values(em.slots), ...Object.values(em.sockets)]) m = Math.max(m, Math.hypot(p[0], p[1])); return m * SC + 40; };
  const toolFoot = (t) => { let m = 0; for (const s of t.nodes) if (isObj(s.place) && Array.isArray(s.place.at) && s.place.near === undefined) m = Math.max(m, Math.hypot(s.place.at[0], s.place.at[1])); return m * TS + 90; };
  const placeList = [];
  for (const [wid, c] of Object.entries(clusterInfo)) {
    const nf = c.garden ? Math.max(...c.branchInfo.map((b) => b.forks.length)) : 0;
    placeList.push({ id: `c:${wid}`, foot: c.garden ? gardenFoot(G, nf) : outlineFoot(c), orbit: c.orbit, minTier: 1 });
  }
  for (const [tid, t] of Object.entries(toolInfo)) {
    placeList.push({ id: `t:${tid}`, foot: toolFoot(t), orbit: t.orbit, minTier: 1 });
    for (const [aid, o] of Object.entries(t.anchors || {})) placeList.push({ id: `a:${aid}`, foot: 110, orbit: o.orbit, minTier: 1 });
  }
  const heroIds = data && isObj(data.characters) ? Object.keys(data.characters) : [];
  for (const h of heroIds) {
    const kin = data.characters[h].kindred;
    placeList.push({ id: `h:${h}`, foot: 80, orbit: AT.heroes && own(AT.heroes, h) ? AT.heroes[h] : undefined, near: typeof kin === 'string' && own(clusterInfo, kin) ? `c:${kin}` : undefined, minTier: 2 });
  }
  for (const r of AT.regions) placeList.push({ id: `r:${r.id}`, foot: r.foot || (r.kind === 'reserved' ? gardenFoot(G, 2) : 90), orbit: r.orbit, minTier: 2 });
  const fogTier = AT.fogTier || 3;
  for (const a of fogNodes) { const ang = core.rings.fog.angles[a.spec.place.i]; placeList.push({ id: `n:${a.spec.id}`, foot: 70, orbit: { tier: fogTier, angle: ang }, minTier: fogTier }); }
  const placed = placeRegions(placeList, AT, hubR);
  const centreOf = Object.create(null), toolCentres = Object.create(null);
  for (const wid of Object.keys(clusterInfo)) centreOf[wid] = placed[`c:${wid}`].centre;
  for (const tid of Object.keys(toolInfo)) toolCentres[tid] = placed[`t:${tid}`].centre;
  for (const a of fogNodes) positions[a.spec.id] = placed[`n:${a.spec.id}`].centre;
  const dirTo = (from, to) => (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
  // 3. constellations
  const sealPos = Object.create(null);
  const spokesOf = Object.create(null);
  for (const [wid, c] of Object.entries(clusterInfo)) {
    const ctr = centreOf[wid];
    sealPos[wid] = Object.create(null);
    if (c.garden) {
      const heart = c.heart || `heart:${wid}`;
      const avoid = [dirTo(ctr, [0, 0])];
      const r = c.heart && roadTo[c.heart];
      if (r && own(positions, r.from)) avoid.push(dirTo(ctr, positions[r.from]));
      const g = gardenLayout(ctr, heart, c.branchInfo, avoid, G);
      for (const [id, p] of Object.entries(g.pos)) if (id === c.heart || !id.startsWith('heart:')) positions[id] = p;
      spokesOf[wid] = g.spokes;
      for (const b of c.branchInfo) sealPos[wid][b.socket] = positions[b.seal];
      continue;
    }
    const em = emblems[c.emblem];
    const items = [];
    for (const a of allNodes) {
      if (a.ownerKind !== 'cluster' || a.cluster !== wid) continue;
      let local;
      if (a.role === 'outline') local = em.slots[em.outline[a.slotIndex]];
      else if (a.role === 'heart') local = em.heart;
      else { const k = Object.keys(c.sockets).find((x) => c.sockets[x].gate === a.spec.id); local = em.sockets[k]; }
      items.push({ id: a.spec.id, t: tierOf(a.spec), p: [ctr[0] + local[0] * SC, ctr[1] + local[1] * SC] });
    }
    const seals = [];
    for (const [k, sk] of Object.entries(c.sockets)) if (!sk.gate) { const it = { id: `seal:${k}`, t: 'landmark', p: [ctr[0] + em.sockets[k][0] * SC, ctr[1] + em.sockets[k][1] * SC] }; seals.push([k, it]); items.push(it); }
    if (Object.values(gaps).every(fin)) relaxGaps(items, gaps);
    for (const it of items) if (!it.id.startsWith('seal:')) positions[it.id] = [r1(it.p[0]), r1(it.p[1])];
    for (const [k, it] of seals) sealPos[wid][k] = [r1(it.p[0]), r1(it.p[1])];
    for (const [k, sk] of Object.entries(c.sockets)) if (sk.gate) sealPos[wid][k] = positions[sk.gate];
  }
  // 4. tool groups (+ anchored lanterns on their own spot, lanterns hung beside another one, core lanterns placed in a group)
  for (const a of allNodes) {
    if (a.ownerKind === 'tool' && a.role === 'tool' && !a.toolNear && !a.anchor) { const c = toolCentres[a.tool]; positions[a.spec.id] = [r1(c[0] + a.spec.place.at[0] * TS), r1(c[1] + a.spec.place.at[1] * TS)]; }
    else if (a.ownerKind === 'tool' && a.anchor) positions[a.spec.id] = placed[`a:${a.spec.id}`].centre;
    else if (a.ownerKind === 'core' && a.tool && !a.entry) { const c = toolCentres[a.tool]; positions[a.spec.id] = [r1(c[0] + a.spec.place.at[0] * TS), r1(c[1] + a.spec.place.at[1] * TS)]; }
  }
  resolveNear(allNodes.filter((a) => a.toolNear), (a) => a.toolNear, (a) => a.spec.place.at);
  resolveNear(allNodes.filter((a) => a.near && !own(positions, a.spec.id)), (a) => a.near, (a) => a.spec.place.at);
  // the gold-only way into a tool group sits on its rim, facing where its road comes from (or the hub)
  for (const a of allNodes) {
    if (!a.entry) continue;
    const c = toolCentres[a.tool], t = toolInfo[a.tool];
    const r = roadTo[a.spec.id];
    const toward = r && own(positions, r.from) ? positions[r.from] : [0, 0];
    const ang = (dirTo(c, toward) * Math.PI) / 180, R = toolFoot(t) - 40;
    positions[a.spec.id] = [r1(c[0] + Math.cos(ang) * R), r1(c[1] + Math.sin(ang) * R)];
  }
  // 5. hero lanterns (hero fragments, test-only today): an arc just outside their signature constellation, on the side away from the hub
  { const n = Object.create(null);
    for (const a of allNodes) {
      if (a.ownerKind !== 'hero') continue;
      const hc = clusterInfo[a.cluster].heart, ctr = hc && own(positions, hc) ? positions[hc] : centreOf[a.cluster], out = (dirTo([0, 0], centreOf[a.cluster]) * Math.PI) / 180, rank = n[a.owner] === undefined ? (n[a.owner] = Object.keys(n).length - 1) : n[a.owner];
      const R = Math.min(placeList.find((x) => x.id === `c:${a.cluster}`).foot + 50 + rank * 70, (fin(lay.linkFar) ? lay.linkFar : 440) - 60); // never a far link to its heart
      const ang = out + (a.slotIndex - 1) * (130 / R);
      positions[a.spec.id] = [r1(ctr[0] + Math.cos(ang) * R), r1(ctr[1] + Math.sin(ang) * R)];
    } }
  // 6. chapter bands (future chapters): beyond every tier
  for (const a of allNodes) if (a.ownerKind === 'chapter') { const R = tierRadius(AT, AT.tiers.length + a.chapterOrder); positions[a.spec.id] = polar(R, ((a.spec.place.band + 0.5) * 360) / core.rings.bands.slots); }
  // 7. roads, in order of resolvable ends
  { let wait = roads.slice();
    while (wait.length) {
      const next = wait.filter((r) => !(own(positions, r.from) && own(positions, r.to)));
      ensure(next.length < wait.length, `road ends cannot be placed: ${next.map((r) => `${r.from} -> ${r.to}`).join(', ')}`);
      for (const r of wait) { if (next.includes(r)) continue; roadPoints(positions[r.from], positions[r.to], r.ids.length, `${r.from}>${r.to}`).forEach((p, i) => { positions[r.ids[i]] = p; }); }
      wait = next;
    } }
  for (const a of allNodes) ensure(own(positions, a.spec.id), `${a.spec.id}: no position`);
  // 8. one gap relaxation over the whole web (cheap tiers give way first)
  if (Object.values(gaps).every(fin)) {
    const items = allNodes.map((a) => ({ id: a.spec.id, t: tierOf(a.spec), p: positions[a.spec.id] }));
    relaxGrid(items, gaps);
    for (const it of items) positions[it.id] = it.p;
    for (const [wid, c] of Object.entries(clusterInfo)) for (const [k, sk] of Object.entries(c.sockets)) { if (sk.gate) sealPos[wid][k] = positions[sk.gate]; else if (c.garden) sealPos[wid][k] = positions[c.branchInfo.find((b) => b.socket === k).seal]; }
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
  // garden requires: lead[0] <- heart, each lead <- the previous, diamond <- last lead, seal <- diamond, fork[0] <- seal, each fork step <- the previous
  const gardenReq = Object.create(null);
  for (const c of Object.values(clusterInfo)) if (c.garden) for (const b of c.branchInfo) {
    b.lead.forEach((id, k) => { gardenReq[id] = k ? [b.lead[k - 1]] : (c.heart ? [c.heart] : []); });
    gardenReq[b.diamond] = [b.lead[b.lead.length - 1]];
    gardenReq[b.seal] = [b.diamond];
    for (const f of b.forks) f.forEach((id, k) => { gardenReq[id] = [k ? f[k - 1] : b.seal]; });
  }
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
    if (a.role === 'road') {
      o.branch = s.branch || (a.ownerKind === 'cluster' ? tagBranch(a.owner) : 'spirit');
      const r = roads[a.road];
      o.requires = [a.step ? r.ids[a.step - 1] : r.from];
    } else if (a.ownerKind === 'cluster') {
      o.branch = tagBranch(a.cluster);
      const c = clusterInfo[a.cluster];
      if (c.garden && own(gardenReq, s.id)) o.requires = gardenReq[s.id];
      else if (a.role === 'outline') {
        const em = emblems[c.emblem];
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
    if (own(roadTo, s.id)) { const r = roadTo[s.id]; o.requires = [r.ids[r.ids.length - 1]]; delete o.requiresAny; } // a road's end is reached by its road
    if (o.requires && !o.requires.length) delete o.requires;
    if (m.requiresAny && !o.requiresAny && !own(roadTo, s.id)) o.requiresAny = m.requiresAny;
    return o;
  });
  const layout = { ...core.layout, minGap: core.layout.v2MinGap ?? core.layout.minGap };
  const price = core.price || null; // rising price (LOCKED 2026-10-21): compileTree reads price.creep
  const v2 = { version: 2, treeVersion: core.version, retired: core.retired, layout, branches: core.branches, budget: core.budget, price, nodes: v2Nodes };
  // LIVE = every non-inert node (v2 values) + the inert specs as pending data. Same compile rules as v2; inert nodes carry no prerequisites.
  const inertIds = new Set(allNodes.filter((a) => a.spec.inert === true).map((a) => a.spec.id));
  const live = {
    version: 1, treeVersion: core.version, retired: core.retired, layout, branches: core.branches, budget: core.budget, price,
    nodes: [
      ...v2Nodes.filter((n) => !inertIds.has(n.id)),
      ...v2Nodes.filter((n) => inertIds.has(n.id)).map((n) => {
        const o = { id: n.id, name: n.name, desc: n.desc, cost: n.cost, effects: n.effects, inert: true, kind: n.kind, idx: n.idx, frag: n.frag, region: n.region };
        for (const k of ['cluster', 'scope', 'flavour', 'maxRank', 'rankCost', 'unlock']) if (n[k] !== undefined) o[k] = n[k];
        return o;
      }),
    ],
  };

  // REGION RECORDS (data only): the hub, each constellation / tool group / anchored lantern (with its orbit), the display-only hero medallions
  // (keepsake hunt, no ids, never bought), the night / reserved / chapter / far records of core.atlas. Derived, so a new fragment gets its region
  // automatically. accent = a key of core.branches; thread = the backbone line from the hub rim to the region's near edge.
  const regions = [{ id: 'hub', kind: 'hub', name: 'The Hearth', centre: [0, 0], r: Math.round(hubR), accent: 'light', thread: null, tier: 0 }];
  const threadTo = (c, r) => { const d = Math.hypot(c[0], c[1]) || 1; return { from: [0, 0], to: [r1(c[0] * (1 - r / d)), r1(c[1] * (1 - r / d))] }; };
  const orbitOf = (key) => ({ tier: placed[key].tier, angle: Math.round(placed[key].angle * 10) / 10, auto: placed[key].auto });
  const footOf = (key) => Math.round(placeList.find((x) => x.id === key).foot);
  for (const [wid] of Object.entries(clusterInfo)) {
    const key = `c:${wid}`;
    regions.push({ id: key, kind: 'weapon', name: weapons && own(weapons, wid) && weapons[wid].name ? weapons[wid].name : wid, centre: centreOf[wid], r: footOf(key), accent: tagBranch(wid), thread: threadTo(centreOf[wid], footOf(key)), orbit: orbitOf(key), garden: !!clusterInfo[wid].garden, heart: clusterInfo[wid].heart || null });
  }
  for (const [tid, t] of Object.entries(toolInfo)) {
    const key = `t:${tid}`;
    const ns = allNodes.filter((a) => a.tool === tid);
    const br = ns.length && ns[0].spec.branch;
    regions.push({ id: key, kind: 'tool', name: t.name, centre: toolCentres[tid], r: footOf(key), accent: br && own(core.branches, br) ? br : 'light', thread: threadTo(toolCentres[tid], footOf(key)), orbit: orbitOf(key) });
    for (const [aid, o] of Object.entries(t.anchors || {})) regions.push({ id: `a:${aid}`, kind: 'anchor', name: o.name || aid, node: aid, tool: tid, centre: placed[`a:${aid}`].centre, r: footOf(`a:${aid}`), accent: 'spirit', thread: null, orbit: orbitOf(`a:${aid}`) });
  }
  for (const h of heroIds) {
    const key = `h:${h}`;
    regions.push({ id: key, kind: 'hero', hero: h, display: true, name: typeof data.characters[h].name === 'string' ? data.characters[h].name.split(',')[0].slice(0, 30) : h, centre: placed[key].centre, r: footOf(key), accent: 'spirit', thread: null, orbit: orbitOf(key) });
  }
  for (const r of AT.regions) {
    const key = `r:${r.id}`;
    const wname = r.weapon && weapons && own(weapons, r.weapon) ? weapons[r.weapon].name : null;
    regions.push({ id: key, kind: r.kind, name: r.name || wname || r.id, display: true, reserved: !!r.reserved || r.kind === 'reserved', lit: !!r.lit, ...(r.weapon ? { weapon: r.weapon } : {}), ...(r.medallion ? { medallion: r.medallion } : {}), centre: placed[key].centre, r: footOf(key), accent: 'spirit', thread: null, orbit: orbitOf(key) });
  }
  const bands = ringBands(AT);
  const ringOfId = Object.create(null);
  for (const a of allNodes) ringOfId[a.spec.id] = ringOf(bands, positions[a.spec.id]);
  // region key of each node (render-only cross-links run between different regions)
  const regionKey = Object.create(null);
  for (const a of allNodes) regionKey[a.spec.id] = a.role === 'road' ? `p:${a.road}` : a.cluster ? `c:${a.cluster}` : a.anchor ? `a:${a.spec.id}` : a.tool ? `t:${a.tool}` : a.ownerKind === 'core' ? (a.spec.place && a.spec.place.ring === 'fog' ? `n:${a.spec.id}` : 'hub') : `x:${a.frag}`;
  for (const a of allNodes) if (a.toolNear && regionKey[a.toolNear] && regionKey[a.toolNear].startsWith('a:')) regionKey[a.spec.id] = regionKey[a.toolNear];
  const edges = [];
  for (const n of v2Nodes) if (!n.teaser) for (const r of [...(n.requires || []), ...(n.requiresAny || [])]) edges.push([r, n.id]);
  const links = crossLinks(allNodes.filter((a) => !inertIds.has(a.spec.id) && !a.spec.teaser).map((a) => ({ id: a.spec.id, p: positions[a.spec.id], region: regionKey[a.spec.id], t: tierOf(a.spec), fork: !!(a.garden && a.garden.role === 'fork') })), edges, fin(AT.links) ? AT.links : 40);

  return {
    live, v2,
    info: {
      core, regions, scale: SC, toolScale: TS, sealPos, spokes: spokesOf, emblems, clusters: clusterInfo, heroes: heroInfo, chapters: chapterInfo, tools: toolInfo, positions, centres: centreOf, toolCentres,
      hubR: Math.round(hubR), ringTiers: bands, ringOf: ringOfId, regionKey, links, roads: roads.map((r) => ({ from: r.from, to: r.to, ids: [...r.ids] })),
      nodes: allNodes.map((a) => ({ id: a.spec.id, frag: a.frag, idx: a.spec.idx, kind: a.spec.kind, role: a.role, cluster: a.cluster, tool: a.tool, region: a.region, inert: !!a.spec.inert, ...(a.garden ? { garden: { ...a.garden } } : {}), ...(a.role === 'road' ? { road: a.road } : {}) })),
    },
  };
}

// Convenience for the game bundle: Vite's import.meta.glob result ({ './core.json': {...}, './clusters/x.json': {...} }).
export function filesFromGlob(mods) {
  return Object.entries(mods).map(([p, json]) => ({ path: p.replace(/^\.\//, ''), json }));
}

export { STATUSES };
