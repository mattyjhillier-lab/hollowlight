// Per-map, per-tier records and the Dawnglass bounty (docs/design/difficulty-tiers-economy-v1.md sections 4.2, 5.2, 10). Pure JS.
// stats.tiers = { <chapterId>: { <tierId>: { runs, clears, best: {t, kills, level}, stars: 0..7 bitmask, heroes: { <heroId>: { clears, first } } } } }
// Everything read from a save or an import is untrusted: unknown chapter / tier / hero ids are DROPPED (and counted in `warn`), every number
// is clamped, `first` is a strict boolean. Records only ever go up; a first-dawn bounty is claimed exactly once per (chapter, tier, hero)
// because the claim flag lives in the save itself.
import { TIER_IDS, resolveTier } from '../sim/tiers.js';

const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const ID_KEY = /^[a-z0-9_]{1,40}$/;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const own = (o, k) => Object.hasOwn(o, k);
const num = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.floor(v))) : lo);

export const MAX_GLASS = 1e9;
export const TIER_CAPS = { chapters: 32, heroes: 16 };
export const STAR_BITS = { cleared: 1, bothHeroes: 2, brightDawn: 4 };

export const emptyTier = () => ({ runs: 0, clears: 0, best: { t: 0, kills: 0, level: 0 }, stars: 0, heroes: {} });

// -> clean stats.tiers. `data` = { chapters, characters } (the game data); without it everything fails closed to {}.
export function tierRecords(raw, data, warn = null) {
  const out = {};
  if (!isObj(raw) || !data || !isObj(data.chapters) || !isObj(data.characters)) return out;
  let nc = 0;
  for (const cid of Object.keys(raw)) {
    if (BAD_KEYS.has(cid) || !ID_KEY.test(cid) || !isObj(raw[cid])) continue;
    if (!own(data.chapters, cid)) { if (warn) warn.unknown++; continue; }
    if (nc >= TIER_CAPS.chapters) { if (warn) warn.capped++; continue; }
    const ch = {};
    for (const tid of Object.keys(raw[cid])) {
      if (BAD_KEYS.has(tid)) continue;
      if (!TIER_IDS.includes(tid) || !isObj(raw[cid][tid])) { if (warn) warn.unknown++; continue; }
      const t = raw[cid][tid];
      const rec = emptyTier();
      rec.runs = num(t.runs, 0, 1e9);
      rec.clears = Math.min(rec.runs, num(t.clears, 0, 1e9)); // you cannot have cleared more often than you played
      const b = isObj(t.best) ? t.best : {};
      rec.best = { t: num(b.t, 0, 1e7), kills: num(b.kills, 0, 1e9), level: num(b.level, 0, 1e6) };
      rec.stars = num(t.stars, 0, 7);
      if (isObj(t.heroes)) {
        let nh = 0;
        for (const hid of Object.keys(t.heroes)) {
          if (BAD_KEYS.has(hid) || !ID_KEY.test(hid) || !isObj(t.heroes[hid])) continue;
          if (!own(data.characters, hid)) { if (warn) warn.unknown++; continue; }
          if (nh >= TIER_CAPS.heroes) { if (warn) warn.capped++; continue; }
          const h = t.heroes[hid];
          rec.heroes[hid] = { clears: Math.min(rec.clears, num(h.clears, 0, 1e9)), first: h.first === true };
          nh++;
        }
      }
      ch[tid] = rec;
    }
    out[cid] = ch;
    nc++;
  }
  return out;
}

const heroesOf = (data) => Object.keys(data.characters).filter((h) => !data.characters[h].treeGate);

// Fold one finished run into the save's tier records and pay the first-dawn bounty. `r` is the sim's run result (trusted shape, still
// clamped here). `ctx` = { data, unlockedTiers?: ['chapter:tier'] }. A tier the save has not opened (gate not owned) is recorded as Twilight,
// so a forged or debug tier id can never mint Dawnglass. Returns { tier, glass, shards, firstDawn, stars }.
export function recordTierRun(save, r, ctx) {
  const data = ctx && ctx.data;
  const none = { tier: 'normal', glass: 0, shards: 0, firstDawn: false, stars: 0 };
  if (!data || !isObj(data.chapters) || !isObj(data.characters) || !isObj(save) || !isObj(save.stats) || !isObj(r)) return none;
  const cid = typeof r.chapter === 'string' && own(data.chapters, r.chapter) ? r.chapter : null;
  if (!cid) return none;
  let tid = typeof r.tier === 'string' && TIER_IDS.includes(r.tier) ? r.tier : 'normal';
  const open = Array.isArray(ctx.unlockedTiers) ? ctx.unlockedTiers : [];
  if (tid !== 'normal' && !open.includes(`${cid}:${tid}`)) tid = 'normal';
  const hid = typeof r.character === 'string' && own(data.characters, r.character) ? r.character : null;
  if (!isObj(save.stats.tiers)) save.stats.tiers = {};
  const chs = save.stats.tiers;
  const ch = own(chs, cid) && isObj(chs[cid]) ? chs[cid] : (chs[cid] = {});
  const rec = own(ch, tid) && isObj(ch[tid]) ? ch[tid] : (ch[tid] = emptyTier());
  const won = r.outcome === 'victory';
  rec.runs = num(rec.runs, 0, 1e9) + 1;
  const out = { tier: tid, glass: 0, shards: 0, firstDawn: false, stars: rec.stars | 0 };
  rec.best = isObj(rec.best) ? rec.best : { t: 0, kills: 0, level: 0 };
  rec.best.t = Math.max(num(rec.best.t, 0, 1e7), num(r.time, 0, 1e7));
  rec.best.kills = Math.max(num(rec.best.kills, 0, 1e9), num(r.kills, 0, 1e9));
  rec.best.level = Math.max(num(rec.best.level, 0, 1e6), num(r.level, 0, 1e6));
  if (won) {
    rec.clears = num(rec.clears, 0, 1e9) + 1;
    rec.stars = (rec.stars | 0) | STAR_BITS.cleared;
    if (!isObj(rec.heroes)) rec.heroes = {};
    if (hid) {
      const h = own(rec.heroes, hid) && isObj(rec.heroes[hid]) ? rec.heroes[hid] : (rec.heroes[hid] = { clears: 0, first: false });
      h.clears = num(h.clears, 0, 1e9) + 1;
      if (h.first !== true) {
        h.first = true; // the bounty is claimed here, exactly once per (chapter, tier, hero)
        out.firstDawn = true;
        const tdef = resolveTier(data.tiers, cid, tid);
        out.glass = Math.min(tdef.glass.first, Math.max(0, MAX_GLASS - num(save.dawnglass, 0, MAX_GLASS)));
        out.shards = tdef.firstShards;
        save.dawnglass = num(save.dawnglass, 0, MAX_GLASS) + out.glass;
        save.shards = Math.min(1e12, num(save.shards, 0, 1e12) + out.shards);
      }
    }
    const hs = heroesOf(data);
    if (hs.length > 1 && hs.every((h) => own(rec.heroes, h) && rec.heroes[h].clears > 0)) rec.stars |= STAR_BITS.bothHeroes;
    if (r.bright === true) rec.stars |= STAR_BITS.brightDawn; // Bright Dawn needs the Grey Alphas (EN7); until then the sim never sets it
    out.stars = rec.stars;
  }
  return out;
}
