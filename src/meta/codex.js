// CX1 the Almanac model (docs/design/codex-celebrations-v1.md; LOCKED 'CODEX + CELEBRATIONS'). Pure JS, no DOM: every entry is DERIVED from the
// stats the save already keeps (kills, boss kills, evolutions, heroes, tier records, marked kills) plus the tree; the only new save data are
// two small validated fields: `codex` {v, read, told} (bitsets over ENTRY_KEYS: NEW dots and celebrated-once) and `titles` {got, pick}.
// Recipes stay hidden until the evolution was taken (stats.evolved); a riddle naming ONE stat shows only when the Full Almanac lantern is owned.
import { conditionProgress, describeNode } from './tree.js';
import { TIER_IDS, MARK_IDS, resolveTier } from '../sim/tiers.js';
import { FOE, PAGE, PAGE_LABEL, MARK_LINE, LORE, RIDDLE, TITLES, UNMET } from '../ui/codexcopy.js';

const own = (o, k) => o !== null && typeof o === 'object' && Object.hasOwn(o, k);
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const n0 = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);

// APPEND-ONLY: bit i of the codex bitsets is ENTRY_KEYS[i]. Never reorder or remove (a retired key keeps its slot); new content appends.
// f: foe, fp: foe page, e: evolution, h: hero, n: night, l: lore page, c: a completion (weapon page / tab / book; celebrated, not a page).
export const ENTRY_KEYS = Object.freeze([
  'f:wolf', 'f:crow', 'f:root_crawler', 'f:stoat_piper', 'f:puffback_toad', 'f:bramble_hart', 'f:branch_mane', 'f:elder_treant', 'f:treant_pod', 'f:treant_sapling', 'f:marks',
  'fp:wolf:habits', 'fp:wolf:weakness', 'fp:wolf:tells', 'fp:crow:habits', 'fp:crow:weakness', 'fp:crow:tells',
  'fp:root_crawler:habits', 'fp:root_crawler:weakness', 'fp:root_crawler:tells', 'fp:elder_treant:habits', 'fp:elder_treant:weakness', 'fp:elder_treant:tells',
  'e:phantom_stampede', 'e:howling_legion', 'e:dire_alpha', 'e:murder_storm', 'e:dive_bombers', 'e:spearhead', 'e:spirit_tempest', 'e:soul_lance',
  'e:thunder_judgment', 'e:returning_pages', 'e:static_storm', 'e:storm_tether', 'e:vesper_tide', 'e:sanctum_halo', 'e:judgement_wheel',
  'h:wren', 'h:elias',
  'n:cursed_forest:normal', 'n:cursed_forest:hard', 'n:cursed_forest:expert',
  'l:1', 'l:2', 'l:3', 'l:4',
  'c:ghost_wolves', 'c:raven_flock', 'c:spirit_bolts', 'c:chain_lightning', 'c:holy_orbit', 'c:foes', 'c:spirits', 'c:nights', 'c:book',
]);
export const MAX_BITS_HEX = 64; // 256 entries before the field must grow (a save test checks the list fits)
const KEY_INDEX = new Map(ENTRY_KEYS.map((k, i) => [k, i]));
// TREE-GEN1: the list above is FROZEN for heroes (h:wren / h:elias keep bits 38 / 39 forever). Every later hero declares its own stable bit in
// characters.json (`codexBit`, ENTRY_KEYS.length .. 255, unique), registered here from the game data (setTreeDef at boot, almanac()).
const HERO_BIT = new Map(); // 'h:<id>' -> bit
const BIT_HERO = new Map(); // bit -> 'h:<id>'
const HERO_ID_RE = /^[a-z][a-z0-9_]{0,31}$/;
export function registerHeroBits(characters) {
  if (!isObj(characters)) return;
  for (const [hid, c] of Object.entries(characters)) {
    const key = `h:${hid}`;
    if (!HERO_ID_RE.test(hid) || KEY_INDEX.has(key) || HERO_BIT.has(key) || !isObj(c)) continue;
    const b = c.codexBit;
    if (!Number.isInteger(b) || b < ENTRY_KEYS.length || b >= MAX_BITS_HEX * 4 || BIT_HERO.has(b)) continue; // fail closed: an unregistered hero is never NEW or celebrated
    HERO_BIT.set(key, b); BIT_HERO.set(b, key);
  }
}
const keyIndex = (k) => (KEY_INDEX.has(k) ? KEY_INDEX.get(k) : HERO_BIT.get(k));
const keyAt = (i) => (i < ENTRY_KEYS.length ? ENTRY_KEYS[i] : BIT_HERO.get(i));
export const TITLE_IDS = Object.freeze(Object.keys(TITLES));

// ---------------------------------------------------------------- bitsets (lower-case hex, nibble j holds bits 4j..4j+3)
export function cleanBits(v) {
  if (typeof v !== 'string' || v.length > MAX_BITS_HEX || !/^[0-9a-f]*$/.test(v)) return '';
  const set = bitsToSet(v, true);
  return setToBits(set);
}
export function bitsToSet(hex, raw = false) {
  const out = new Set();
  if (typeof hex !== 'string' || (!raw && !/^[0-9a-f]{0,64}$/.test(hex))) return out;
  for (let j = 0; j < hex.length && j < MAX_BITS_HEX; j++) {
    const d = parseInt(hex[j], 16);
    if (!(d >= 0)) return new Set();
    for (let b = 0; b < 4; b++) if (d & (1 << b)) { const k = keyAt(j * 4 + b); if (k) out.add(k); }
  }
  return out;
}
export function setToBits(keys) {
  const nib = [];
  for (const k of keys) {
    const i = keyIndex(k);
    if (i === undefined) continue;
    const j = i >> 2;
    while (nib.length <= j) nib.push(0);
    nib[j] |= 1 << (i & 3);
  }
  while (nib.length && nib[nib.length - 1] === 0) nib.pop();
  return nib.map((d) => d.toString(16)).join('');
}

// ---------------------------------------------------------------- save fields
export const defaultCodex = () => ({ v: 0, read: '', told: '' }); // v 0 = not adopted yet (adopt() marks what a save already had as seen + told)
export const defaultTitles = () => ({ got: [], pick: '' });
export function cleanCodex(o) {
  if (!isObj(o)) return defaultCodex();
  return { v: o.v === 1 ? 1 : 0, read: cleanBits(o.read), told: cleanBits(o.told) };
}
export function cleanTitles(o) {
  if (!isObj(o)) return defaultTitles();
  const got = [];
  if (Array.isArray(o.got)) for (const t of o.got.slice(0, 32)) if (typeof t === 'string' && TITLE_IDS.includes(t) && !got.includes(t)) got.push(t);
  got.sort((a, b) => TITLE_IDS.indexOf(a) - TITLE_IDS.indexOf(b));
  const pick = typeof o.pick === 'string' && got.includes(o.pick) ? o.pick : '';
  return { got, pick };
}

// ---------------------------------------------------------------- thresholds from the Almanac tree nodes (book and tree tell one story)
export const ALMANAC_NODES = Object.freeze({ wolf: 'bs_wolf', crow: 'bs_crow', root_crawler: 'bs_crawl', elder_treant: 'bs_treant' });
export const PAGES = Object.freeze(['habits', 'weakness', 'tells']);
export const WOLF_HABITS_DEFAULT = 1000; // bs_wolf1 is gold-only since T6; its page opens at the old T6 count (same as Grave Crow). Default, Matt may override.
export const FULL_ALMANAC = 'bs_page';

function nodeOf(def, id) { return def && def.nodes && own(def.nodes, id) ? def.nodes[id] : def && def.pending && own(def.pending, id) ? def.pending[id] : null; }
// -> [{page, node, at, live}] for one foe; `live` = the tree node is live (pending nodes keep their page out of the book until they are built)
export function pageSpec(def, foe) {
  const pre = ALMANAC_NODES[foe];
  if (!pre) return [];
  return PAGES.map((page, i) => {
    const id = `${pre}${i + 1}`;
    const n = nodeOf(def, id);
    const u = n && n.unlock;
    let at = u && (u.t === 'killEnemy' || u.t === 'bossKill') && u.id === foe ? n0(u.n) : 0;
    if (!at && foe === 'wolf' && page === 'habits') at = WOLF_HABITS_DEFAULT;
    return { page, node: id, name: n ? String(n.name || '') : '', at, live: !!(n && def.nodes && own(def.nodes, id)) && at > 0 };
  });
}

const rank = (save, id) => (isObj(save.tree) && typeof save.tree[id] === 'number' ? save.tree[id] : 0);
export const ownsFullAlmanac = (save) => rank(save, FULL_ALMANAC) >= 1;
const split = (full) => { const s = String(full || ''); const i = s.indexOf(', '); return i < 0 ? { name: s, epithet: '' } : { name: s.slice(0, i), epithet: s.slice(i + 2) }; };
const gateFor = (def, kind, id) => {
  if (!def || !def.nodes) return null;
  for (const nid of def.list || Object.keys(def.nodes)) {
    const n = def.nodes[nid];
    if (n && Array.isArray(n.effects) && n.effects.some((e) => e && e.unlock === kind && e.id === id)) return nid;
  }
  return null;
};
const big = (t) => String(t).replace(/\b\d{4,}\b/g, (n) => Number(n).toLocaleString('en-GB'));
const condText = (lines) => lines.filter((l) => !l.done).slice(0, 2).map((l) => `${big(l.text.charAt(0).toLowerCase() + l.text.slice(1))} (${l.cur.toLocaleString('en-GB')})`).join(' and ');

// ---------------------------------------------------------------- the whole book
// opts.riddles: force riddles on (preview / tests); otherwise they follow the Full Almanac lantern.
export function almanac(save, data, def, opts = {}) {
  registerHeroBits(data && data.characters);
  const s = isObj(save) ? save : {};
  const st = isObj(s.stats) ? s.stats : {};
  const kills = isObj(st.killsByEnemy) ? st.killsByEnemy : {};
  const boss = isObj(st.bossKills) ? st.bossKills : {};
  const evolved = isObj(st.evolved) ? st.evolved : {};
  const used = isObj(st.weaponsUsed) ? st.weaponsUsed : {};
  const chars = isObj(st.charsUsed) ? st.charsUsed : {};
  const tierRec = isObj(st.tiers) ? st.tiers : {};
  const codex = s.codex ? cleanCodex(s.codex) : defaultCodex();
  const read = bitsToSet(codex.read);
  const unlocked = new Set();
  const live = new Set(); // every key that is a page right now (pending pages excluded)
  const riddles = opts.riddles === true || ownsFullAlmanac(s);
  const cid = Object.keys(data.chapters || {})[0] || 'cursed_forest';
  const chName = data.chapters && data.chapters[cid] ? data.chapters[cid].name : '';
  const isNew = (k) => unlocked.has(k) && !read.has(k);
  let gateOwned = (gid) => !gid || rank(s, gid) >= 1;

  // ---- foes
  const foes = [];
  for (const id of Object.keys(data.enemies || {})) {
    if (!own(FOE, id)) continue;
    const e = data.enemies[id];
    const count = Math.max(n0(kills[id]), e.boss ? n0(boss[id]) : 0);
    const key = `f:${id}`;
    const known = count > 0;
    live.add(key);
    if (known) unlocked.add(key);
    const pages = [];
    for (const p of pageSpec(def, id)) {
      if (!p.live) continue;
      const pk = `fp:${id}:${p.page}`;
      live.add(pk);
      const open = known && count >= p.at;
      if (open) unlocked.add(pk);
      pages.push({ key: pk, page: p.page, label: PAGE_LABEL[p.page], at: p.at, cur: count, open, text: open ? PAGE[id][p.page] : '', node: p.node, nodeName: p.name, boss: !!e.boss });
    }
    foes.push({ key, id, kind: 'foe', known, name: known ? e.name : '', count, boss: !!e.boss, mini: !!e.mini, where: chName, line: known ? FOE[id].line : '', hint: FOE[id].hint || UNMET, pages });
  }
  // Hollow marks: seen once a marked foe was slain; which kinds = the kinds the walked harder nights carry (stats keep no per-kind count)
  {
    const mk = Math.max(0, n0(st.markedKills));
    const seen = new Set();
    if (mk > 0) for (const tid of TIER_IDS) { const r = tierRec[cid] && tierRec[cid][tid]; if (r && n0(r.runs) > 0) { const t = resolveTier(data.tiers, cid, tid); for (const k of (t.marks && t.marks.kinds) || []) seen.add(k); } }
    live.add('f:marks');
    if (mk > 0) unlocked.add('f:marks');
    foes.push({ key: 'f:marks', id: 'marks', kind: 'marks', known: mk > 0, count: mk, seen: MARK_IDS.filter((k) => seen.has(k)), total: MARK_IDS.length,
      marks: MARK_IDS.map((k) => ({ id: k, seen: seen.has(k), line: seen.has(k) ? MARK_LINE[k] : '' })), pages: [] });
  }

  // ---- spirits (weapons x evolutions)
  const spirits = [];
  for (const wid of Object.keys(data.weapons || {})) {
    const w = data.weapons[wid];
    const wg = w.treeGate ? gateFor(def, 'weapon', wid) : null;
    const wKnown = !w.treeGate || gateOwned(wg) || n0(used[wid]) > 0;
    const evos = [];
    for (const eid of Object.keys(data.evolutions || {})) {
      const ev = data.evolutions[eid];
      if (ev.weapon !== wid) continue;
      const key = `e:${eid}`;
      live.add(key);
      const taken = n0(evolved[eid]);
      const gid = ev.treeGate ? gateFor(def, 'evolution', eid) : null;
      const awake = !ev.treeGate || gateOwned(gid) || taken > 0;
      let state = taken > 0 ? 'found' : awake && wKnown ? 'sealed' : 'sleeping';
      if (taken > 0) unlocked.add(key);
      const statName = (k) => (w.stats && w.stats[k] && w.stats[k].name) || k;
      const out = { key, id: eid, state, verb: state === 'sleeping' ? '???' : ev.verb, color: w.color || '#ffd27a' };
      if (state === 'found') Object.assign(out, { name: ev.name, codex: ev.codex, recipe: [statName(ev.pair[0]), statName(ev.pair[1])], taken });
      else if (state === 'sealed') { if (riddles && own(RIDDLE, eid)) out.riddle = RIDDLE[eid].line; }
      else {
        let text = '', frac = 0;
        const g = gid || wg;
        if (g && def && def.nodes && own(def.nodes, g)) {
          let d = null;
          try { d = describeNode(def, s, g, data); } catch { d = null; }
          if (d && !d.masked && d.cond) { text = condText(d.cond.lines || []); frac = d.cond.frac || 0; }
          else if (d && !d.masked && def.nodes[g].unlock) { const c = conditionProgress(def.nodes[g].unlock, st, def, data); text = condText(c.lines); frac = c.frac; }
        }
        Object.assign(out, { cond: text, frac: Math.max(0, Math.min(1, frac)) });
      }
      evos.push(out);
    }
    const RANK = { found: 0, sealed: 1, sleeping: 2 };
    evos.sort((a, b) => RANK[a.state] - RANK[b.state]); // found, then awake, then sleeping (the mock-up order)
    spirits.push({ id: wid, known: wKnown, name: wKnown ? w.name : '', color: w.color || '#ffd27a', found: evos.filter((x) => x.state === 'found').length, evos });
  }

  spirits.sort((a, b) => Number(b.known) - Number(a.known)); // known spirits first (stable: data order inside each group)

  // ---- heroes
  const heroes = [];
  for (const hid of Object.keys(data.characters || {})) {
    const c = data.characters[hid];
    const key = `h:${hid}`;
    live.add(key);
    const runs = n0(chars[hid]);
    let clears = 0;
    for (const tid of TIER_IDS) { const r = tierRec[cid] && tierRec[cid][tid]; const hr = r && r.heroes && r.heroes[hid]; if (hr) clears += n0(hr.clears); }
    const gid = c.treeGate ? gateFor(def, 'hero', hid) : null;
    if (runs > 0) unlocked.add(key);
    const nm = split(c.name);
    const awake = isObj(s.chars) && isObj(s.chars[hid]) && s.chars[hid].woke === true; // CHARACTER SYSTEM v2: heroes wake by the starter pick / keepsakes
    heroes.push({ key, id: hid, walked: runs > 0, open: awake || (!!c.treeGate && gateOwned(gid)), name: nm.name, epithet: nm.epithet, blurb: c.blurb || '', ability: c.ability ? c.ability.name : '', abilityText: c.ability ? c.ability.desc : '', runs, clears, weapon: data.weapons[c.kindred] ? data.weapons[c.kindred].name : '' }); // kindred spirit (suggested start, no stat link)
  }

  // ---- nights + lore
  const nights = [];
  const openT = Array.isArray(opts.openTiers) ? opts.openTiers : [];
  for (const tid of TIER_IDS) {
    const key = `n:${cid}:${tid}`;
    live.add(key);
    const r = (tierRec[cid] && tierRec[cid][tid]) || null;
    const runs = r ? n0(r.runs) : 0;
    if (runs > 0) unlocked.add(key);
    const t = resolveTier(data.tiers, cid, tid);
    const stars = r ? [1, 2, 4].filter((b) => (r.stars | 0) & b).length : 0;
    const first = !!(r && r.heroes && Object.values(r.heroes).some((h) => h && h.first === true));
    nights.push({ key, id: tid, chapter: chName, name: t.name, open: tid === 'normal' || openT.includes(`${cid}:${tid}`) || runs > 0, walked: runs > 0, runs, clears: r ? n0(r.clears) : 0, best: r && r.best ? n0(r.best.t) : 0, stars, first });
  }
  const clearsOf = (tid) => { const r = tierRec[cid] && tierRec[cid][tid]; return r ? n0(r.clears) : 0; };
  const loreOpen = [n0(st.runs) > 0, n0(st.wins) > 0, clearsOf('hard') > 0, clearsOf('expert') > 0];
  const lore = LORE.map((p, i) => { const key = `l:${i + 1}`; live.add(key); if (loreOpen[i]) unlocked.add(key); return { key, i: i + 1, open: loreOpen[i], title: loreOpen[i] ? p.title : '', text: loreOpen[i] ? p.text : '', cond: p.cond }; });

  // ---- counts + completions
  const foesFound = foes.filter((f) => f.known).length;
  const evoTotal = spirits.reduce((a, w) => a + w.evos.length, 0);
  const evoFound = spirits.reduce((a, w) => a + w.found, 0);
  const tabs = [
    { id: 'foes', found: foesFound, total: foes.length },
    { id: 'spirits', found: evoFound, total: evoTotal },
    { id: 'heroes', found: heroes.filter((h) => h.walked).length, total: heroes.length },
    { id: 'nights', found: nights.filter((n) => n.walked).length, total: nights.length },
  ];
  const complete = new Set();
  for (const w of spirits) if (w.evos.length && w.found === w.evos.length) complete.add(`c:${w.id}`);
  const foesWhole = foes.every((f) => f.known && f.pages.every((p) => p.open)) && foes.find((f) => f.kind === 'marks').seen.length === MARK_IDS.length;
  if (foesWhole) complete.add('c:foes');
  if (evoTotal > 0 && evoFound === evoTotal) complete.add('c:spirits');
  if (nights.every((n) => n.walked) && lore.every((l) => l.open)) complete.add('c:nights');
  const pageKeys = [...live];
  const pagesFound = pageKeys.filter((k) => unlocked.has(k)).length;
  if (pagesFound === pageKeys.length && pageKeys.length > 0) complete.add('c:book');
  for (const c of complete) unlocked.add(c);
  for (const t of tabs) t.fresh = [...unlocked].some((k) => isNew(k) && tabOfKey(k) === t.id);
  const earned = TITLE_IDS.filter((t) => { const d = TITLES[t]; return d.weapon ? complete.has(`c:${d.weapon}`) : d.tab ? complete.has(`c:${d.tab}`) : d.book ? complete.has('c:book') : false; });
  return { tabs, pages: { found: pagesFound, total: pageKeys.length }, foes, spirits, heroes, nights, lore, unlocked, complete, earned, riddles, read, isNew, chapter: chName };
}

export function tabOfKey(k) {
  if (k.startsWith('f:') || k.startsWith('fp:')) return 'foes';
  if (k.startsWith('e:')) return 'spirits';
  if (k.startsWith('h:')) return 'heroes';
  if (k.startsWith('n:') || k.startsWith('l:')) return 'nights';
  return '';
}

// Old saves (no codex field yet): everything they already hold counts as read and told, so the first visit is not a flood of NEW dots or cards.
export function adopt(codex, book) {
  const c = cleanCodex(codex);
  if (c.v === 1) return c;
  const all = setToBits(book.unlocked);
  return { v: 1, read: all, told: all };
}
// Mark keys read (NEW dots go out); returns the new codex (unchanged object when nothing changed).
export function markRead(codex, keys) {
  const c = cleanCodex(codex);
  const set = bitsToSet(c.read);
  let changed = false;
  for (const k of keys) if (keyIndex(k) !== undefined && !set.has(k)) { set.add(k); changed = true; }
  return changed ? { ...c, read: setToBits(set) } : c;
}
export function markTold(codex, keys) {
  const c = cleanCodex(codex);
  const set = bitsToSet(c.told);
  let changed = false;
  for (const k of keys) if (keyIndex(k) !== undefined && !set.has(k)) { set.add(k); changed = true; }
  return changed ? { ...c, told: setToBits(set) } : c;
}
// Titles: earned ids join `got` (never removed); the picked one defaults to the newest earned until the player picks.
export function withTitles(titles, earned) {
  const t = cleanTitles(titles);
  const got = [...t.got];
  let added = null;
  for (const id of earned) if (TITLE_IDS.includes(id) && !got.includes(id)) { got.push(id); added = id; }
  return cleanTitles({ got, pick: t.pick || added || '' });
}
