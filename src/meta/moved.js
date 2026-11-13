// Q5b 'what moved' (docs/design/skill-tree-rework-v2.md section 10, v1 2.6): what a run changed on the Lantern Web, as plain data for the
// Next-lights component on results / death (and the nearest unlocks on pause). Pure JS, no DOM, no RNG.
//   snapshot(save)                    -> the few save fields the comparison needs (plain copy, taken BEFORE the run is banked)
//   whatMoved(before, after, run, ..) -> { chips, tiles, bars, nearest }   tiles = newly lit / newly unlocked / now affordable lanterns,
//                                        bars = locked lanterns whose condition progress grew (+kills, +wins), nearest = the 3 closest unlocks
//   cleanMoved(raw)                   -> the same shape, re-validated (ids and numbers coerced, strings clipped); anything odd is dropped
import { describeNode, conditionProgress, closestUnlocks } from './tree.js';

const own = (o, k) => o != null && typeof o === 'object' && Object.hasOwn(o, k);
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const whole = (v) => (fin(v) ? Math.max(0, Math.min(1e9, Math.floor(v))) : 0);
const unit = (v) => (fin(v) ? Math.max(0, Math.min(1, v)) : 0);
const clip = (s, n) => { s = String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').trim(); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };
const ID = /^[a-z0-9_]{1,40}$/;
export const MAX_TILES = 6, MAX_BARS = 3, MAX_NEAR = 3;

/** The save fields that change when a run is banked and that the lantern states depend on. A plain deep copy (structuredClone-free: JSON-safe by construction). */
export function snapshot(save) {
  const s = save && typeof save === 'object' ? save : {};
  const j = (v) => { try { return JSON.parse(JSON.stringify(v == null ? {} : v)); } catch { return {}; } };
  return { gold: whole(s.gold), shards: whole(s.shards), dawnglass: whole(s.dawnglass), tree: j(s.tree), stats: j(s.stats), creep: j(s.creep) };
}
const asSave = (live, snap) => ({ ...live, gold: snap.gold, shards: snap.shards, dawnglass: snap.dawnglass, tree: snap.tree, stats: snap.stats, creep: snap.creep });

/** Run record = sim.result() (or anything): only whole numbers are read. */
function chipsOf(run) {
  const r = run && typeof run === 'object' ? run : {};
  const out = [];
  if (whole(r.kills) > 0) out.push({ t: `${whole(r.kills).toLocaleString('en-GB')} slain` });
  if (whole(r.gold) > 0) out.push({ t: `+${whole(r.gold).toLocaleString('en-GB')} gold` });
  if (r.outcome === 'victory') out.push({ t: 'Dawn reached' });
  return out;
}

/** before / after = snapshot(); live = the current save object (for fields that do not change, e.g. seen/notes); run = the run record. */
export function whatMoved(before, after, live, run, def, data) {
  const out = { chips: chipsOf(run), tiles: [], bars: [], nearest: [] };
  if (!def || !data || !before || !after) return out;
  const sb = asSave(live || {}, before), sa = asSave(live || {}, after);
  const kindRank = { lit: 0, unlocked: 1, afford: 2 };
  const tiles = [], bars = [];
  for (const id of def.list) {
    const n = def.nodes[id];
    if (!n || n.teaser) continue;
    let a, b;
    try { a = describeNode(def, sa, id, data); b = describeNode(def, sb, id, data); } catch { continue; }
    if (a.masked) continue;
    let kind = null;
    if (a.state === 'owned' && b.state !== 'owned') kind = 'lit';
    else if (a.state === 'available' && b.state === 'condition') kind = 'unlocked';
    else if (a.state === 'available' && a.affordable && !(b.state === 'available' && b.affordable)) kind = 'afford';
    if (kind) tiles.push({ id, name: clip(a.name, 40), kind, cost: whole(a.next && a.next.gold), k: kindRank[kind] });
    if (n.unlock && a.rank === 0 && !a.masked) {
      const pa = conditionProgress(n.unlock, sa.stats, def, data, sa.tree), pb = conditionProgress(n.unlock, sb.stats, def, data, sb.tree);
      const d = pa.frac - pb.frac;
      if (!pa.done && d > 0.0005) {
        const i = pa.lines.findIndex((l, ix) => pb.lines[ix] && l.cur > pb.lines[ix].cur);
        const L = pa.lines[Math.max(0, i)], Lb = pb.lines[Math.max(0, i)];
        const gain = L && Lb ? whole(L.cur - Lb.cur) : 0;
        bars.push({ id, name: clip(a.name, 40), text: clip(L ? `${L.text}: ${whole(L.cur).toLocaleString('en-GB')} of ${whole(L.goal).toLocaleString('en-GB')}${gain > 0 ? ` (+${gain.toLocaleString('en-GB')})` : ''}` : '', 90), frac0: unit(pb.frac), frac1: unit(pa.frac), d });
      }
    }
  }
  tiles.sort((x, y) => x.k - y.k || y.cost - x.cost);
  bars.sort((x, y) => y.d - x.d);
  out.tiles = tiles.slice(0, MAX_TILES).map(({ id, name, kind, cost }) => ({ id, name, kind, cost }));
  out.bars = bars.slice(0, MAX_BARS).map(({ id, name, text, frac0, frac1 }) => ({ id, name, text, frac0, frac1 }));
  out.nearest = nearestOf(sa, def, data, new Set(out.bars.map((x) => x.id)));
  return out;
}

/** The 3 closest unlocks of a save (pause: read-only, no run). Rows already shown as a moved bar are skipped when `skip` is given. */
export function nearestOf(save, def, data, skip = null) {
  let rows = [];
  try { rows = closestUnlocks(def, save, data, MAX_NEAR + 4); } catch { rows = []; }
  return rows.filter((r) => !(skip && skip.has(r.id))).slice(0, MAX_NEAR).map((r) => ({ id: clip(r.id, 40), name: clip(r.name, 40), text: clip(r.text, 90), frac: unit(r.frac), gate: !!r.gate }));
}

/** Untrusted -> clean (the results view and the component never trust shapes). Unknown keys dropped, lists capped, strings clipped. */
export function cleanMoved(raw) {
  const out = { chips: [], tiles: [], bars: [], nearest: [] };
  if (!raw || typeof raw !== 'object') return out;
  const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
  const okId = (v) => typeof v === 'string' && ID.test(v) && v !== '__proto__' && v !== 'constructor' && v !== 'prototype';
  for (const c of list(raw.chips, 4)) if (c && typeof c.t === 'string' && c.t) out.chips.push({ t: clip(c.t, 40) });
  for (const t of list(raw.tiles, MAX_TILES)) if (t && okId(t.id)) out.tiles.push({ id: t.id, name: clip(t.name, 40), kind: ['lit', 'unlocked', 'afford'].includes(t.kind) ? t.kind : 'afford', cost: whole(t.cost) });
  for (const b of list(raw.bars, MAX_BARS)) if (b && okId(b.id)) out.bars.push({ id: b.id, name: clip(b.name, 40), text: clip(b.text, 90), frac0: unit(b.frac0), frac1: Math.max(unit(b.frac0), unit(b.frac1)) });
  for (const n of list(raw.nearest, MAX_NEAR)) if (n && okId(n.id)) out.nearest.push({ id: n.id, name: clip(n.name, 40), text: clip(n.text, 90), frac: unit(n.frac), gate: !!n.gate });
  return out;
}
export const movedCount = (m) => (m ? m.tiles.length + m.bars.length : 0);
export const movedIds = (m) => (m ? [...m.tiles.map((t) => t.id), ...m.bars.map((b) => b.id)] : []);
void own;
