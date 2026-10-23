// FD2/FD3 front door: copy + pure helpers for the title's lantern chip, purses, Continue whisper and the "Whose lantern?" screen
// (docs/design/front-door-v1.md option 1A Lantern Hall). No DOM here (Node-tested). Every string is later set with textContent only.
import { TIER_IDS, resolveTier } from '../sim/tiers.js';
import { STAR_BITS } from '../save/tiers.js';
import { nodeStatus } from '../meta/tree.js';

export const LANTERN = {
  switch: 'Switch lantern',
  newGame: 'New game',
  newWhisper: (free) => (free > 0 ? `Light a new lantern · ${free} of 3 free` : 'All 3 lanterns are lit · choose one to relight'),
  title: 'Whose lantern tonight?',
  whisper: 'Each lantern keeps its own tree, heroes and nights.',
  titleNew: 'Light a new lantern',
  whisperNew: 'A fresh start. The other lanterns are kept.',
  titleReplace: 'All three lanterns are lit',
  whisperReplace: 'Choose one to put out and light fresh. Export it first to keep a copy.',
  light: 'Light it',
  relight: 'Relight fresh',
  more: 'More',
  rename: 'Rename',
  export: 'Export',
  del: 'Delete',
  close: 'Close',
  cancel: 'Cancel',
  save: 'Save',
  back: 'Back',
  newCard: 'New lantern',
  newCardLine: 'Start fresh. Others are kept.',
  nameLabel: 'Name (optional)',
  renameLabel: 'Lantern name',
  namePlaceholder: (n) => `Lantern ${n}`,
  lightNew: 'Light it',
  foot: 'Lanterns live in this browser only. Use ··· > Export to keep a copy.',
  footTouch: 'Lanterns live in this browser only. Use ··· > Export to keep a copy.',
  delAsk: (name) => `Put out ${name}? Its tree, gold and nights are deleted from this browser.`,
  delAskNoUndo: (name) => `Put out ${name}? Its save could not be read, so this cannot be undone. Export keeps the file.`,
  replaceAsk: (name) => `Put out ${name} and light a fresh lantern in its place? Its tree, gold and nights are deleted from this browser.`,
  exportFirst: 'Export first',
  hold: 'Hold to put out',
  holdSr: (name) => `Hold to put out ${name}. Hold Enter or Space for 1.5 seconds, or press twice.`,
  holdArmed: 'Press again to put it out',
  holding: 'Keep holding…',
  deleted: (name) => `${name} was put out.`,
  undo: 'Undo',
  undone: (name) => `${name} is lit again.`,
  exported: (name) => `${name} exported. Keep the file somewhere safe.`,
  exportFail: 'Export failed in this browser.',
  locked: 'Lanterns cannot be changed right now.',
  newer: 'From a newer version',
  damaged: 'Save damaged',
  empty: 'Not lit yet',
  current: 'Current',
  treeFirst: 'Grows as you play',
  treeNothing: 'Nothing to spend yet',
};

const num = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0; };
/** 2410 -> "2,410" (no locale surprises). */
export const fmt = (v) => String(num(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many}`;

/** "today" / "yesterday" / "N days ago" / "N weeks ago"; future or bad stamps read "today". */
export function lastLit(ts, now = Date.now()) {
  const t = Number(ts);
  if (!Number.isFinite(t) || t <= 0) return 'never';
  const day = (x) => Math.floor((x - new Date(x).getTimezoneOffset() * 60000) / 86400000);
  const d = Math.max(0, day(now) - day(t));
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 14) return `${d} days ago`;
  if (d < 70) return `${Math.floor(d / 7)} weeks ago`;
  return 'a long time ago';
}

/** The hero played most (stats.charsUsed), only heroes that exist in the data; ties -> data order. */
export function mostPlayedHero(stats, data) {
  const used = stats && stats.charsUsed && typeof stats.charsUsed === 'object' ? stats.charsUsed : {};
  let best = null; let n = 0;
  for (const id of Object.keys((data && data.characters) || {})) {
    const c = Object.hasOwn(used, id) ? num(used[id]) : 0;
    if (c > n) { best = id; n = c; }
  }
  return best;
}

const firstChapter = (data) => Object.keys((data && data.chapters) || {})[0] || null;
const tierName = (data, cid, tid) => { try { return resolveTier(data.tiers, cid, tid).name || tid; } catch { return tid; } };

/** Tier rows for a lantern card: Twilight always; harder nights once opened or played. -> [{id, name, stars: 0..3, open, played}] */
export function nightRows(save, data, unlockedTiers = []) {
  const cid = firstChapter(data);
  if (!cid) return [];
  const recs = save && save.stats && save.stats.tiers && Object.hasOwn(save.stats.tiers, cid) ? save.stats.tiers[cid] : {};
  const open = Array.isArray(unlockedTiers) ? unlockedTiers : [];
  const out = [];
  for (const tid of TIER_IDS) {
    const rec = recs && Object.hasOwn(recs, tid) ? recs[tid] : null;
    const isOpen = tid === 'normal' || open.includes(`${cid}:${tid}`);
    const played = !!(rec && rec.runs > 0);
    if (!isOpen && !played) continue;
    const bits = rec ? rec.stars | 0 : 0;
    const stars = [STAR_BITS.cleared, STAR_BITS.bothHeroes, STAR_BITS.brightDawn].filter((b) => bits & b).length;
    out.push({ id: tid, name: tierName(data, cid, tid), stars, open: isOpen, played });
  }
  return out;
}

/** Dawnglass purse shows once Deep Dusk has been seen: glass owned, a harder night opened/played, or a dawn reached (the map then shows Deep Dusk). */
export function showGlass(save, unlockedTiers = []) {
  if (!save) return false;
  if (num(save.dawnglass) > 0) return true;
  if (Array.isArray(unlockedTiers) && unlockedTiers.some((t) => typeof t === 'string' && !t.endsWith(':normal'))) return true;
  const st = save.stats || {};
  if (num(st.wins) > 0) return true;
  for (const ch of Object.values(st.tiers || {})) for (const [tid, r] of Object.entries(ch || {})) if (r && (num(r.clears) > 0 || (tid !== 'normal' && num(r.runs) > 0))) return true;
  return false;
}

/** Purse values for the title (Dawnglass null = hidden). */
export function purses(save, unlockedTiers = []) {
  return { gold: num(save && save.gold), shards: num(save && save.shards), glass: showGlass(save, unlockedTiers) ? num(save.dawnglass) : null };
}

/** Teal dot on Skill Tree: some lantern in the tree can be bought right now (same rule as the tree's "ready" highlight). */
export function treeAffordable(def, save, data) {
  if (!def || !def.nodes || !save) return false;
  for (const id of Object.keys(def.nodes)) {
    try { const s = nodeStatus(def, save, id, data); if (s.buyable && s.affordable) return true; } catch { /* a bad node never breaks the title */ }
  }
  return false;
}

/** The night the next run starts on: the first playable night not yet cleared, else the hardest playable. `playable` = tier ids the run can start on. */
export function nextNight(save, data, unlockedTiers = [], playable = ['normal']) {
  const cid = firstChapter(data);
  if (!cid) return null;
  const rows = nightRows(save, data, unlockedTiers).filter((r) => r.open && playable.includes(r.id));
  if (!rows.length) return { id: 'normal', name: tierName(data, cid, 'normal') };
  const recs = (save && save.stats && save.stats.tiers && save.stats.tiers[cid]) || {};
  const fresh = rows.find((r) => !(recs[r.id] && num(recs[r.id].clears) > 0));
  const r = fresh || rows[rows.length - 1];
  return { id: r.id, name: r.name };
}

/** Compact Skill Tree whisper for the half-width title button: "2,410 gold · 6 shards" / "2,410 gold to spend"; null = use the U3 copy. */
export function treeWhisperShort(gold, shards) {
  const g = num(gold); const sh = num(shards);
  if (g && sh) return `${fmt(g)} gold · ${plural(sh, 'shard', 'shards')}`;
  if (g) return `${fmt(g)} gold to spend`;
  if (sh) return `${plural(sh, 'shard', 'shards')} to spend`;
  return null;
}

/** Continue whisper: "<hero> · <night> is waiting"; no hero yet -> "<night> is waiting". */
export function continueWhisper(heroName, night) {
  const n = night && typeof night.name === 'string' ? night.name : 'Twilight';
  const h = typeof heroName === 'string' && heroName ? heroName.slice(0, 24) : '';
  return h ? `${h} · ${n} is waiting` : `${n} is waiting`;
}

/** One lantern card's text. `peek` = Lanterns.peek() result (or { status:'ok', save } for the active lantern). */
export function lanternSummary(entry, peek, data, unlockedTiers = [], now = Date.now()) {
  const name = entry && typeof entry.name === 'string' ? entry.name : 'Lantern';
  const base = { id: entry && entry.id, name, hero: null, lines: [], nights: [], status: (peek && peek.status) || 'empty', canExport: !!(peek && peek.text) };
  if (!peek || !peek.save) {
    base.lines = [peek && peek.status === 'newer' ? LANTERN.newer : peek && peek.status === 'damaged' ? LANTERN.damaged : LANTERN.empty];
    base.nights = peek && peek.status === 'empty' ? nightRows(null, data, []) : [];
    return base;
  }
  const s = peek.save;
  const runs = num(s.stats && s.stats.runs);
  base.hero = mostPlayedHero(s.stats, data);
  base.lines = [runs ? `${plural(runs, 'night', 'nights')} · last lit ${lastLit(s.updatedAt, now)}` : LANTERN.empty];
  const money = [num(s.gold) && `${fmt(s.gold)} gold`, num(s.shards) && plural(num(s.shards), 'shard', 'shards')].filter(Boolean).join(' · ');
  if (money) base.lines.push(money);
  base.nights = nightRows(s, data, unlockedTiers);
  return base;
}

/** Screen-reader label for a card's Light button. */
export function lightLabel(sum, verb = LANTERN.light) {
  if (sum.active) verb = `${verb} (${LANTERN.current.toLowerCase()})`;
  const nights = sum.nights.map((n) => `${n.name} ${n.played || n.id === 'normal' ? `${n.stars} of 3 stars` : 'open'}`).join(', ');
  return `${verb}: ${sum.name}. ${sum.lines.join('. ')}${nights ? `. ${nights}` : ''}`;
}

/** Export file name from a (whitelisted) lantern name: letters/digits/hyphen only. */
export function exportFileName(name) {
  const s = String(name || '').normalize('NFKD').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+/, '').slice(0, 24).replace(/-+$/, '').toLowerCase();
  return `hollowlight-${s || 'lantern'}.json`;
}

/** Hold-to-confirm state (pure; the DOM drives it with timestamps). 1.5 s hold, or two activations within 5 s (keyboard / screen reader). */
export function holdState(ms = 1500, armMs = 5000) {
  let start = null; let armedAt = null; let done = false;
  return {
    press(t) { if (!done && start === null) start = t; },
    release() { start = null; },
    progress(t) { return done ? 1 : start === null ? 0 : Math.min(1, Math.max(0, (t - start) / ms)); },
    tick(t) { if (!done && start !== null && t - start >= ms) done = true; return done; },
    activate(t) { if (done) return true; if (armedAt !== null && t - armedAt <= armMs) { done = true; return true; } armedAt = t; return false; },
    get armed() { return armedAt !== null && !done; },
    get done() { return done; },
  };
}
