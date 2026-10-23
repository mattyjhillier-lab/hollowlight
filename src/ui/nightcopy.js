// FD4 (= DT7) map + night select: copy + the pure view model (docs/design/front-door-v1.md option 2A, difficulty-tiers-economy-v1.md 7.2).
// No DOM here (Node-tested). Everything shown is REAL: tier data from tiers.json (resolveTier), records from save.stats.tiers, gates from the
// compiled tree, the nudge from closestUnlocks. Rewards that are not live yet (per-run Dawnglass drops, tier boss shards, Hollow marks: DT2/DT3)
// are NOT promised. Every string is set with textContent later.
import { TIER_IDS, resolveTier } from '../sim/tiers.js';
import { STAR_BITS } from '../save/tiers.js';
import { nodeStatus } from '../meta/tree.js';

export const PLANNED_CHAPTERS = 8;
export const MARKS_LIVE = false; // Hollow marks (DT2) are data only: the "what changes" list names them once the sim spawns them

export const NIGHT = {
  title: 'Choose your night',
  chapter: (n) => `Chapter ${n}`,
  harder: 'harder night',
  first: 'first night',
  headline: { normal: 'The Hollow as you first met it', hard: 'The Hollow presses closer', expert: 'The longest dark' },
  same: { normal: 'Foes, the Elder Treant and hearts as you know them', glassNone: 'No Dawnglass on Twilight' },
  sameHarder: 'Blessings and your tree work as on Twilight',
  earn: 'You earn',
  toolsHere: 'Night tools here',
  toolsRest: 'Night tools rest on Twilight',
  next: 'Next light:',
  back: 'Back',
  tree: 'Skill Tree',
  begin: (hero) => `Begin with ${hero}`,
  isNew: 'NEW',
  recommended: 'Recommended next',
  cleared: (n) => `cleared ${n}x`,
  notCleared: 'not cleared yet',
  gateReady: 'Open it in the Lantern Web',
  openInTree: 'Open in tree',
  gateSide: (name) => `Light “${name}” in the Lantern Web to open this night.`,
  lockedSide: 'Locked for now.',
  noGate: 'Its Night Gate is not lit yet',
  best: 'Best',
  clears: 'Clears',
  noRuns: 'No runs yet',
  fog: (n, prev) => `Chapter ${n} sleeps in the fog. Clear ${prev} to see it.`,
  locked: 'locked',
  chapters: 'Chapters',
  nights: 'Night',
};

const own = (o, k) => !!o && typeof o === 'object' && Object.hasOwn(o, k);
const num = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0; };
const clip = (v, n) => String(v == null ? '' : v).slice(0, n);
const fmt = (v) => String(num(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const clock = (s) => { const t = num(s); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const mulText = (m) => `x${String(Math.round(m * 100) / 100)}`;

const firstChapter = (data) => Object.keys((data && data.chapters) || {})[0] || null;
export const tierDef = (data, cid, tid) => { try { return resolveTier(data.tiers, cid, tid); } catch { return resolveTier(null, cid, 'normal'); } };
const recOf = (save, cid, tid) => {
  const t = save && save.stats && save.stats.tiers;
  return own(t, cid) && own(t[cid], tid) ? t[cid][tid] : null;
};
const starCount = (bits) => [STAR_BITS.cleared, STAR_BITS.bothHeroes, STAR_BITS.brightDawn].filter((b) => (bits | 0) & b).length;

/** Remembered pick + NEW flags (save.notes.night, sanitised in schema.js). */
export function nightNote(save) {
  const n = save && save.notes && save.notes.night;
  return { map: n && typeof n.map === 'string' ? n.map : null, tier: n && TIER_IDS.includes(n.tier) ? n.tier : null, seen: n && Array.isArray(n.seen) ? n.seen.filter((t) => TIER_IDS.includes(t)) : [] };
}
export function rememberNight(save, cid, tid, seenAdd = []) {
  if (!save || typeof save !== 'object') return;
  if (!save.notes || typeof save.notes !== 'object') save.notes = {};
  const n = nightNote(save);
  const seen = [...new Set([...n.seen, ...seenAdd.filter((t) => TIER_IDS.includes(t))])];
  save.notes.night = { map: typeof cid === 'string' ? cid : n.map, tier: TIER_IDS.includes(tid) ? tid : n.tier || 'normal', seen };
}

/** The live Night Gate lantern that opens (chapter, tier), or null (inert gates are not in the compiled tree). */
export function gateFor(def, cid, tid) {
  if (!def || !def.nodes) return null;
  for (const id of def.list || Object.keys(def.nodes)) {
    const n = def.nodes[id];
    if (n && Array.isArray(n.effects) && n.effects.some((e) => e && e.unlock === 'tier' && e.chapter === cid && e.tier === tid)) return id;
  }
  return null;
}

/** One chip's state. -> { id, name, idx, state: open|gate|locked, cleared, stars, isNew, line, progress: {cur, goal}|null, gateId } */
export function chipState(save, data, def, openTiers, cid, tid, status = nodeStatus) {
  const t = tierDef(data, cid, tid);
  const open = tid === 'normal' || (Array.isArray(openTiers) && openTiers.includes(`${cid}:${tid}`));
  const rec = recOf(save, cid, tid);
  const out = { id: tid, name: clip(t.name || tid, 24), idx: TIER_IDS.indexOf(tid), state: open ? 'open' : 'locked', cleared: num(rec && rec.clears), stars: starCount(rec && rec.stars), isNew: false, line: '', progress: null, gateId: null };
  if (open) {
    out.isNew = tid !== 'normal' && !nightNote(save).seen.includes(tid);
    out.line = out.isNew ? NIGHT.recommended : out.cleared ? NIGHT.cleared(out.cleared) : NIGHT.notCleared;
    return out;
  }
  const gid = gateFor(def, cid, tid);
  if (gid) {
    out.gateId = gid;
    let st = null;
    try { st = status(def, save, gid, data); } catch { st = null; }
    if (!st) { out.line = NIGHT.noGate; return out; } // unreadable gate: stays locked (never offers a jump that cannot work)
    const cond = st.cond;
    if (st.rank > 0) { out.line = NIGHT.noGate; return out; } // owned but not open would be a data bug: fail closed
    if (!cond || cond.done) { out.state = 'gate'; out.line = NIGHT.gateReady; return out; }
    const l = (cond.lines || []).find((x) => !x.done) || (cond.lines || [])[0];
    out.line = l ? clip(l.text, 60) : NIGHT.lockedSide;
    out.progress = l ? { cur: Math.min(num(l.cur), num(l.goal)), goal: Math.max(1, num(l.goal)) } : null;
    return out;
  }
  // no live gate: the design's condition (clear the night below once), with its real progress
  const below = TIER_IDS[out.idx - 1];
  const done = num(recOf(save, cid, below) && recOf(save, cid, below).clears) > 0;
  out.line = done ? NIGHT.noGate : `Clear ${tierDef(data, cid, below).name} once`;
  out.progress = { cur: done ? 1 : 0, goal: 1 };
  return out;
}

/** Skip rule: the map screen exists only once there is a night choice (a harder night open, or its gate ready to buy). */
export function hasNightChoice(save, data, def, openTiers) {
  const cid = firstChapter(data);
  if (!cid) return false;
  if (Object.keys(data.chapters).length > 1) return true;
  return TIER_IDS.slice(1).some((tid) => chipState(save, data, def, openTiers, cid, tid).state !== 'locked');
}

/** The night a run starts on with no extra input: the remembered pick (if still open), else a fresh unlock, else the first uncleared open night, else the hardest open. */
export function defaultNight(save, data, def, openTiers) {
  const cid = firstChapter(data);
  if (!cid) return 'normal';
  const chips = TIER_IDS.map((tid) => chipState(save, data, def, openTiers, cid, tid)).filter((c) => c.state === 'open');
  const rem = nightNote(save).tier;
  if (rem && chips.some((c) => c.id === rem)) return rem;
  const fresh = chips.filter((c) => c.isNew).pop();
  if (fresh) return fresh.id;
  const unc = chips.find((c) => !c.cleared);
  return (unc || chips[chips.length - 1]).id;
}

/** What changes on a night (max 4 plain lines, most important first), from the resolved tier data. */
export function changeLines(data, cid, tid) {
  const t = tierDef(data, cid, tid);
  if (tid === 'normal') return [NIGHT.same.normal, NIGHT.same.glassNone];
  const chap = own(data.chapters, cid) ? data.chapters[cid] : null;
  const en = (id) => (id && own(data.enemies, id) ? clip(data.enemies[id].name, 30) : '');
  const out = [];
  const hp = t.enemyHp, dm = t.enemyDmg;
  if (hp > 1 || dm > 1) out.push(`Foes are ${hp >= 1.8 ? 'twice as tough' : hp >= 1.3 ? 'much tougher' : hp > 1 ? 'a little tougher' : 'as tough'} and hit ${dm >= 1.25 ? 'much harder' : dm > 1 ? 'harder' : 'as hard'}`);
  if (t.bossHp > 1 && chap) out.push(`The ${en(chap.bossId) || 'boss'} is ${t.bossHp >= 1.8 ? 'twice as strong' : 'stronger'}`);
  if (MARKS_LIVE && t.marks && t.marks.share > 0) out.push(`From ${clock(t.marks.from)} some foes bear a Hollow mark`);
  if (t.heartPity > 1) out.push('Hearts come more slowly');
  const mini = Object.keys(data.enemies || {}).find((k) => data.enemies[k].mini);
  if (t.miniHowl > 0 && mini) out.push(`The ${en(mini)}'s howl calls more wolves${t.miniExtra.length ? `, and it comes again at ${clock(t.miniExtra[0])}` : ''}`);
  if (t.chestLarge > 0) out.push('Large chests are more likely');
  return [...out.slice(0, 3), NIGHT.sameHarder]; // the reassurance line always stays (landscape phones show the first two)
}

/** "You earn" pills: only rewards the game pays today (gold multiplier at banking, the boss's shards, Dawnglass for the boss and the dawn, the first-dawn bounty per hero). */
export function earnPills(save, data, cid, tid, heroId) {
  const t = tierDef(data, cid, tid);
  const chap = own(data.chapters, cid) ? data.chapters[cid] : null;
  const pills = [{ kind: 'gold', text: `gold ${mulText(t.goldMul || 1)}` }];
  if (chap && num(chap.bossShards)) pills.push({ kind: 'shard', text: `${num(chap.bossShards)} from the boss` });
  if (t.glass && (t.glass.boss > 0 || t.glass.dawn > 0)) pills.push({ kind: 'glass', text: `boss +${t.glass.boss} · dawn +${t.glass.dawn}` });
  const rec = recOf(save, cid, tid);
  const claimed = !!(rec && heroId && own(rec.heroes, heroId) && rec.heroes[heroId].first === true);
  if (t.glass && t.glass.first > 0 && !claimed) pills.push({ kind: 'glass', text: `first dawn +${t.glass.first}${t.firstShards ? ` · +${t.firstShards} shard` : ''}`, teal: true });
  return pills;
}

/** Owned tier-scoped tools (Fourth Card, Fifth Hook, Long Night keystones): only shown when one is owned. */
export function toolsLine(save, def, tid) {
  if (!def || !def.nodes || !save || !save.tree) return '';
  const idx = TIER_IDS.indexOf(tid);
  const owned = Object.keys(save.tree).filter((id) => own(def.nodes, id) && def.nodes[id].scope && def.nodes[id].scope.minTier > 0);
  if (!owned.length) return '';
  if (idx <= 0) return NIGHT.toolsRest;
  const here = owned.filter((id) => def.nodes[id].scope.minTier <= idx).map((id) => clip(def.nodes[id].name, 30));
  return here.length ? `${NIGHT.toolsHere}: ${here.join(' · ')}` : '';
}

/**
 * The whole screen. o = { save, data, def, openTiers, heroId, heroName, tier, closest }.
 * -> { chapter: {id, name, n}, fog: [{n, label}], crumb: [hero, chapter, night], chips: [...], sel, side: {...}, canBegin, begin, nudge }
 */
export function mapView(o) {
  const { save, data, def, openTiers = [], heroId = null, heroName = '', closest = [], status = nodeStatus } = o || {};
  const cid = firstChapter(data);
  const chapIds = Object.keys(data.chapters || {});
  const chap = data.chapters[cid];
  const chips = TIER_IDS.map((tid) => chipState(save, data, def, openTiers, cid, tid, status));
  const sel = chips.find((c) => c.id === o.tier) ? o.tier : defaultNight(save, data, def, openTiers);
  const c = chips.find((x) => x.id === sel);
  const t = tierDef(data, cid, sel);
  const rec = recOf(save, cid, sel);
  const side = {
    id: sel, state: c.state,
    kicker: `${c.name} · ${c.idx ? NIGHT.harder : NIGHT.first}`,
    headline: NIGHT.headline[sel] || c.name,
    changes: changeLines(data, cid, sel),
    earn: earnPills(save, data, cid, sel, heroId),
    tools: toolsLine(save, def, sel),
    records: rec && num(rec.runs) ? `${NIGHT.best} ${clock(rec.best && rec.best.t)} · ${NIGHT.clears} ${fmt(rec.clears)}` : NIGHT.noRuns,
    stars: c.stars,
    gate: c.state === 'gate' && def.nodes[c.gateId] ? { id: c.gateId, name: clip(def.nodes[c.gateId].name, 40), line: NIGHT.gateSide(clip(def.nodes[c.gateId].name, 40)) } : null,
    locked: c.state === 'locked' ? `${c.line}${c.progress ? ` · ${c.progress.cur}/${c.progress.goal}` : ''}` : '',
    glassFirst: t.glass ? t.glass.first : 0,
  };
  const n0 = (Array.isArray(closest) ? closest : []).find((x) => x && typeof x.name === 'string');
  const prevName = chap ? clip(chap.name, 30) : '';
  return {
    chapter: { id: cid, name: chap ? clip(chap.name, 40) : '', n: Math.max(1, chapIds.indexOf(cid) + 1) },
    fog: Array.from({ length: Math.max(0, PLANNED_CHAPTERS - chapIds.length) }, (_, i) => ({ n: chapIds.length + i + 1, label: NIGHT.fog(chapIds.length + i + 1, prevName) })),
    crumb: [clip(heroName, 24), chap ? clip(chap.name, 40) : '', c.name],
    chips, sel, side,
    canBegin: c.state === 'open',
    begin: NIGHT.begin(clip(heroName, 24) || 'hero'),
    nudge: n0 ? `${clip(n0.name, 40)}: ${clip(n0.text, 80)}` : '',
  };
}

/** Screen-reader description of a chip (state + condition; colour never alone). */
export function chipSr(c) {
  if (c.state === 'open') return `${c.line}. ${c.stars} of 3 stars.`;
  if (c.state === 'gate') return `${NIGHT.locked}. ${NIGHT.gateReady}.`;
  return `${NIGHT.locked}. ${c.line}${c.progress ? `, ${c.progress.cur} of ${c.progress.goal}` : ''}.`;
}

/** The tier a run may start on: 'normal', or a harder night this lantern has opened; anything else (unknown, forged, not open) -> 'normal'. */
export function pickRunTier(tier, openTiers, cid) {
  return typeof tier === 'string' && TIER_IDS.includes(tier) && (tier === 'normal' || (Array.isArray(openTiers) && openTiers.includes(`${cid}:${tier}`))) ? tier : 'normal';
}
