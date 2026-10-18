// Skill tree power budget, computed from the tree DATA (docs/design/skill-tree-v2.md section 8 and Appendix C.9).
// Pure JS. The ceiling is a RULE (core.budget), never a typed total: every effect maps to one category, each category has a
// soft cap C and a weight w, power-equivalents (PE) = soft total x w, and the sum of PE-at-cap must stay inside the ceiling.
// Raising the ceiling = editing the rule + its snapshot test + a LOCKED row, never a node.
import { STATUSES } from './status.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const soft = (S, C) => (S <= 0 ? 0 : C * (1 - Math.exp(-S / C)));
const EPS = 1e-9;

// One effect -> [{ cat, face, pool }]. pool: 'combat' | 'sustain' | 'util' | 'none'.
// Negative faces are not credited (conservative: the budget counts only what a node gives).
export function effectTerms(e, rule, ctx = {}) {
  const T = (cat, face, pool = 'combat') => ({ cat, face, pool });
  if (!isObj(e)) return [];
  if (e.weapon !== undefined) {
    if (e.weapon === '@summon') return [e.stat === 'power' ? T('tagS', e.pct ?? 0) : T('summonSpeed', e.pct ?? 0, 'util')];
    if (e.weapon === '@magic') return [e.stat === 'power' ? T('tagM', e.pct ?? 0) : T('magicSpeed', e.pct ?? 0, 'util')];
    if (e.weapon === '@all') return [T('dmg', e.pct ?? 0)];
    const face = e.pct !== undefined ? (e.stat === 'cooldown' ? Math.abs(e.pct) : e.pct) : rule.flatFace * Math.abs(e.add ?? 0);
    return [T(`wpn:${e.weapon}`, face)];
  }
  if (e.mod !== undefined) {
    if (e.mod === 'damage') return [T('dmg', e.pct)];
    if (e.mod === 'cooldown') return [T('cast', -e.pct)];
    if (e.mod === 'area') return [T('area', e.pct)];
    return [T(e.mod, e.mod === 'abilityCd' ? -e.pct : e.pct, 'util')];
  }
  if (e.player !== undefined) {
    if (e.player === 'maxHp') return [T('hp', e.pct)];
    if (e.player === 'levelHeal') return [T('heal', e.pct)];
    if (e.player === 'revive') return [T('revive', e.frac, 'sustain')];
    return [T(`player.${e.player}`, 0, 'none')];
  }
  if (e.drop !== undefined) {
    if (e.drop === 'heart') return [T('heartDrop', e.pct, 'sustain')];
    if (e.drop === 'heartHeal') return [T('heartHeal', e.pct, 'sustain')];
    return [T('magnet', e.pct, 'util')];
  }
  if (e.ability !== undefined) return [T(`ability.${e.ability}`, e.pct ?? e.secs ?? 0, 'util')];
  if (e.perk !== undefined) {
    if (e.perk === 'rush') return [T('tagS', e.pct * e.secs * rule.rushFace)];
    return [T(`perk.${e.perk}`, e.pct ?? 0, 'util')];
  }
  if (e.status !== undefined) return [T('status', e.pct !== undefined ? e.pct : e.secs * rule.markFace)];
  if (e.unlock !== undefined) {
    if (e.unlock === 'rerolls') return [T('reroll', e.n, 'sustain')];
    if (e.unlock === 'banishes') return [T('banish', e.n, 'sustain')];
    if (e.unlock === 'autoAbility') return [T('autoAbility', 0, 'util')];
    return [T(`unlock.${e.unlock}`, 0, 'none')];
  }
  if (e.visual !== undefined) return [T('visual', 0, 'none')];
  return [T('unknown', 0, 'none')];
}

// Categories and PE-at-cap implied by the RULE for W weapons (independent of node data).
export function ruleCaps(rule, W) {
  const cats = {};
  for (const [k, v] of Object.entries(rule.categories)) cats[k] = { C: v.cap, w: v.weight, count: 1 };
  cats.wpn = { C: rule.perWeapon.cap, w: (rule.perWeapon.weight * rule.perWeapon.refWeapons) / Math.max(1, W), count: W };
  let atCap = 0;
  for (const c of Object.values(cats)) atCap += c.C * c.w * c.count;
  return { cats, atCap };
}

const isExcl = (def, a, b) => def.nodes[a].excludes.includes(b);

// def = a compiled tree (every node live). rule = core.budget. W = number of weapon constellations.
export function budgetOf(def, rule, W, opts = {}) {
  const violations = [];
  const { cats: capCats, atCap } = ruleCaps(rule, W);
  const ids = def.list.filter((id) => !def.nodes[id].teaser);

  // exclusive groups (keystone pairs): count the larger side once
  const groupOf = new Map();
  const groups = [];
  for (const id of ids) {
    if (!def.nodes[id].excludes.length || groupOf.has(id)) continue;
    const g = [];
    const stack = [id];
    while (stack.length) { const c = stack.pop(); if (groupOf.has(c)) continue; groupOf.set(c, groups.length); g.push(c); for (const x of def.nodes[c].excludes) stack.push(x); }
    groups.push(g);
  }
  const termsOf = (id) => {
    const n = def.nodes[id];
    const ts = [];
    for (const e of n.effects) for (const t of effectTerms(e, rule)) ts.push({ ...t, face: t.face * n.maxRank });
    return ts;
  };
  const termCache = new Map(ids.map((id) => [id, termsOf(id)]));

  const evaluate = (chosen, chapter) => {
    const S = Object.create(null);
    const sus = { reroll: 0, banish: 0, revive: 0, heartDrop: 0, heartHeal: 0 };
    const util = Object.create(null);
    const reviveFracs = [];
    for (const id of chosen) {
      const n = def.nodes[id];
      const k = n.scope ? n.scope.minChapter : 1;
      if (k !== chapter) continue;
      for (const t of termCache.get(id)) {
        if (t.pool === 'combat') S[t.cat] = (S[t.cat] || 0) + Math.max(0, t.face);
        else if (t.pool === 'sustain') {
          if (t.cat === 'revive') { sus.revive += 1; reviveFracs.push(t.face); } else sus[t.cat] += Math.max(0, t.face);
        } else if (t.pool === 'util') util[t.cat] = (util[t.cat] || 0) + t.face;
      }
    }
    // soft totals
    const rows = {};
    let pe = 0;
    for (const [cat, s] of Object.entries(S)) {
      const wp = cat.startsWith('wpn:');
      const c = wp ? capCats.wpn : capCats[cat];
      if (!c) { rows[cat] = { S: s, C: 0, w: 0, soft: 0, pe: 0, peCap: 0, unknown: true }; continue; }
      const sf = soft(s, c.C);
      rows[cat] = { S: s, C: c.C, w: c.w, soft: sf, pe: sf * c.w, peCap: c.C * c.w };
      pe += sf * c.w;
    }
    const susPE = (sus.revive ? rule.sustain.revive : 0) + sus.reroll * rule.sustain.perReroll + sus.banish * rule.sustain.perBanish + sus.heartDrop * rule.sustain.heartDrop + sus.heartHeal * rule.sustain.heartHeal;
    return { rows, pe, sus, susPE, util, reviveFracs };
  };

  // choose the best member of each exclusive group (or none) for the base (chapter 1) evaluation
  const fixed = ids.filter((id) => !groupOf.has(id));
  let best = null;
  const pick = (gi, acc) => {
    if (gi === groups.length) {
      const ev = evaluate(acc, 1);
      const score = ev.pe + ev.susPE;
      if (!best || score > best.score) best = { score, ev, chosen: acc };
      return;
    }
    pick(gi + 1, acc);
    for (const m of groups[gi]) pick(gi + 1, acc.concat(m));
  };
  if (groups.length <= 8) pick(0, fixed);
  else best = (() => { const ev = evaluate(fixed.concat(groups.map((g) => g[0])), 1); return { score: ev.pe + ev.susPE, ev, chosen: fixed }; })();
  const ev = best.ev;

  // per-node and verb rules
  const knotMax = rule.knotMax;
  for (const id of ids) {
    const n = def.nodes[id];
    for (const t of termCache.get(id)) {
      if (t.pool === 'combat' && !n.keystone && (n.maxRank === 1 ? t.face : t.face / n.maxRank) > knotMax + EPS) violations.push(`${id}: ${t.cat} +${t.face} is above the ${knotMax}% knot limit`);
      if (t.cat === 'unknown') violations.push(`${id}: effect has no budget category`);
    }
    if (n.cluster && n.kind !== undefined && ['knot', 'bead', 'mastery', 'status', 'verb', 'kin'].includes(n.kind) && n.region !== 'heroes') {
      for (const t of termCache.get(id)) {
        const ok = t.cat === `wpn:${n.cluster}` || (t.cat === 'status' && statusOwnedBy(n, n.cluster)) || t.pool === 'none';
        if (!ok) violations.push(`${id}: a cluster node may only add to its own weapon pool or its own status (adds ${t.cat})`);
      }
    }
  }
  for (const [cat, row] of Object.entries(ev.rows)) if (row.unknown) violations.push(`category ${cat} is not in the budget rule`);

  // exact verb limits
  if (ev.sus.reroll > rule.sustain.rerollMax + EPS) violations.push(`rerolls ${ev.sus.reroll} above ${rule.sustain.rerollMax}`);
  if (ev.sus.banish > rule.sustain.banishMax + EPS) violations.push(`banishes ${ev.sus.banish} above ${rule.sustain.banishMax}`);
  if (ev.sus.revive > rule.sustain.reviveMax) violations.push(`revive nodes ${ev.sus.revive} above ${rule.sustain.reviveMax}`);
  if (ev.reviveFracs.some((f) => f > rule.sustain.reviveMaxFrac + EPS)) violations.push(`revive health above ${rule.sustain.reviveMaxFrac * 100}%`);
  for (const [k, lim] of [['speed', rule.utility.speed], ['pickup', rule.utility.pickup], ['xp', rule.utility.xp], ['gold', rule.utility.gold], ['abilityCd', rule.utility.abilityCdMax]]) {
    if ((ev.util[k] || 0) > lim + EPS) violations.push(`${k} total ${ev.util[k]} above ${lim}`);
  }

  // ceilings (chapter 1) and chapter scopes
  const ceilCombat = rule.base.combat, ceilSustain = rule.base.sustain;
  if (atCap > ceilCombat + EPS) violations.push(`combat PE-at-cap ${atCap.toFixed(2)} is above the ceiling ${ceilCombat}`);
  if (ev.susPE > ceilSustain + EPS) violations.push(`sustain ${ev.susPE.toFixed(2)} is above the ceiling ${ceilSustain}`);
  const chapters = {};
  const maxK = Math.max(1, ...ids.map((i) => (def.nodes[i].scope ? def.nodes[i].scope.minChapter : 1)));
  for (let k = 2; k <= maxK; k++) {
    const e2 = evaluate(best.chosen, k);
    let faceCombat = 0;
    for (const [cat, row] of Object.entries(e2.rows)) {
      const wp = cat.startsWith('wpn:');
      const c = wp ? capCats.wpn : capCats[cat];
      faceCombat += row.S * (c ? c.w : 0);
    }
    chapters[k] = { combat: faceCombat, sustain: e2.susPE };
    if (faceCombat > rule.perChapter.combat + EPS) violations.push(`chapter ${k} combat ${faceCombat.toFixed(2)} is above the per-chapter allowance ${rule.perChapter.combat}`);
    if (e2.susPE > rule.perChapter.sustain + EPS) violations.push(`chapter ${k} sustain ${e2.susPE.toFixed(2)} is above the per-chapter allowance ${rule.perChapter.sustain}`);
  }

  // option share per non-launch constellation (60% of its nodes are not plain knots)
  const byCluster = new Map();
  for (const id of ids) {
    const n = def.nodes[id];
    if (!n.cluster || n.region === 'launch' || n.region === 'heroes') continue;
    const c = byCluster.get(n.cluster) || { total: 0, knots: 0 };
    c.total += 1; if (n.kind === 'knot') c.knots += 1;
    byCluster.set(n.cluster, c);
  }
  for (const [cl, c] of byCluster) if ((c.total - c.knots) / c.total < rule.optionShareMin - EPS) violations.push(`cluster ${cl}: only ${(((c.total - c.knots) / c.total) * 100).toFixed(0)}% options/verbs (needs ${rule.optionShareMin * 100}%)`);

  return { rows: ev.rows, combatPE: ev.pe, combatAtCap: atCap, sustainPE: ev.susPE, util: ev.util, chapters, violations, groups, W };
}

function statusOwnedBy(n, cluster) {
  for (const e of n.effects) if (isObj(e) && e.status !== undefined && STATUSES[e.status] && STATUSES[e.status].owner !== cluster) return false;
  return true;
}

// Plain-text table in the layout of the design sheet (section 8).
export function formatBudget(b) {
  const out = ['| Category | Cap C | Weight | Face sum S | Soft total | PE at total | PE at cap |', '|---|---|---|---|---|---|---|'];
  const wp = { S: 0, soft: 0, pe: 0 };
  const rows = [];
  for (const [cat, r] of Object.entries(b.rows)) {
    if (cat.startsWith('wpn:')) { wp.S += r.S; wp.soft += r.soft; wp.pe += r.pe; continue; }
    rows.push(`| ${cat} | ${r.C} | ${r.w} | ${r.S.toFixed(1)} | ${r.soft.toFixed(2)} | ${r.pe.toFixed(2)} | ${r.peCap.toFixed(2)} |`);
  }
  rows.push(`| per-weapon pool (${b.W} weapons) | 8 each | ${(0.4 / b.W).toFixed(3)} | ${wp.S.toFixed(1)} | ${wp.soft.toFixed(1)} | ${wp.pe.toFixed(2)} | ${(8 * 0.4).toFixed(2)} |`);
  out.push(...rows);
  out.push(`| **Combat total** | | | | | **${b.combatPE.toFixed(2)}** | **${b.combatAtCap.toFixed(2)}** |`);
  out.push(`| Sustain/verb | | | | | **${b.sustainPE.toFixed(2)}** | ceiling 5 |`);
  return out.join('\n');
}
