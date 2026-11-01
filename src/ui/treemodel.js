// Skill tree screen model (T4, LOCKED look 'A Lantern Trails'). Pure JS: no DOM, no Phaser, so it is unit-tested in Node.
// Reads ONLY the compiled tree + the view regions (src/meta/treeview.js) + the save, and the real tree rules (src/meta/tree.js):
// no rule lives here. Five player states: lit, ready (can light now), open (not enough gold), challenge, notyet (+ fog for teasers).
import { describeNode, closestUnlocks, costFor } from '../meta/tree.js';

const own = (o, k) => o != null && Object.hasOwn(o, k);
export const SAY = { lit: 'Lit', ready: 'Can light now', open: 'Not enough gold', challenge: 'Challenge', notyet: 'Not yet reachable', fog: 'Beyond the fog' };
export const KIND_R = { knot: 7, ring: 8, hero: 9, verb: 9, kin: 10, status: 10, bead: 10, mastery: 12, socket: 15, key: 14, gate: 15, heart: 19, teaser: 9 };
export const KIND_LABEL = { knot: 'Lantern', ring: 'Lantern', hero: 'Hero lantern', verb: 'Lantern', kin: 'Kin lantern', status: 'Status lantern', bead: 'Lantern', mastery: 'Mastery', socket: 'Evolution seal', key: 'Keystone', gate: 'Night gate', heart: 'Spirit heart', teaser: 'Far lantern' };
const WAKE = new Set(['heart', 'socket', 'gate']);
const UNLOCK_KINDS = new Set(['heart', 'socket', 'gate', 'key']);
const VERB_KINDS = new Set(['bead', 'verb', 'hero', 'status', 'kin']);
const PIN_RE = /^[a-z0-9_]{1,40}$/;
export const MAX_PINS = 3;
export const fmtN = (n) => Math.round(Number(n) || 0).toLocaleString('en-GB');

// Untrusted pin list (localStorage) -> known, non-teaser ids only, at most 3.
export function sanitizePins(raw, def) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const x of raw.slice(0, 20)) {
    if (typeof x !== 'string' || !PIN_RE.test(x) || !own(def.nodes, x) || def.nodes[x].teaser || out.includes(x)) continue;
    out.push(x);
    if (out.length >= MAX_PINS) break;
  }
  return out;
}

export class TreeModel {
  constructor(def, data, view) {
    this.def = def;
    this.data = data;
    this.view = view;
    this.regionByKey = Object.create(null);
    for (const r of view.regions) this.regionByKey[r.key] = r;
    this.parents = new Map();
    for (const e of def.edges) { if (!this.parents.has(e.to)) this.parents.set(e.to, []); this.parents.get(e.to).push(e.from); }
    this.cache = Object.create(null);
    this.best = null;
    this.progress = 0;
    this.pins = [];
    this.save = null;
  }

  rank(id) { const t = (this.save && this.save.tree) || {}; return own(t, id) ? Math.max(0, Number(t[id]) || 0) : 0; }
  lit(id) { return this.rank(id) >= 1; }
  owned(id) { return this.rank(id) >= this.def.nodes[id].maxRank; }
  region(id) { return this.regionByKey[this.view.regionOf[id]] || null; }
  awake(r) { return !r || !r.heart || this.lit(r.heart); }
  isNew() { return (this.save.stats.runs || 0) === 0 && !Object.keys(this.save.tree || {}).length; }

  // Recompute every node's state from the real rules. Call after open, buy, respec and pin changes.
  recompute(save, pins = this.pins) {
    this.save = save;
    this.pins = pins;
    const { def, data } = this;
    const cache = Object.create(null);
    let litN = 0, total = 0;
    for (const id of def.list) {
      const n = def.nodes[id];
      const d = describeNode(def, save, id, data);
      let s, v;
      if (d.state === 'owned') { s = 'lit'; v = 'owned'; }
      else if (d.state === 'teaser') { s = 'fog'; v = 'fog'; }
      else if (d.state === 'excluded') { s = 'notyet'; v = 'closed'; }
      else if (d.state === 'available') { s = d.affordable ? 'ready' : 'open'; v = s; }
      else if (d.state === 'condition') { s = 'challenge'; v = 'cond'; }
      else { s = 'notyet'; v = 'unreached'; }
      // a part-lit multi-rank lantern draws as lit (its trail is lit); its next rank keeps the buy state for the ray crown
      cache[id] = { s, v, d, frac: d.cond ? d.cond.frac : 0, fresh: WAKE.has(n.kind) && d.state === 'available' && d.rank === 0 && !(save.seen && save.seen[id]) };
      if (!n.teaser) { total++; if (d.rank > 0) litN++; }
    }
    this.cache = cache;
    for (const r of this.view.regions) {
      r.lit = r.ids.filter((id) => this.lit(id)).length;
      r.light = r.ids.filter((id) => cache[id].s === 'ready').length;
      r.done = r.ids.length > 0 && r.ids.every((id) => this.owned(id));
    }
    this.progress = total ? litN / total : 0;
    this.best = this.bestNext();
    return this;
  }

  readyList() { return this.def.list.filter((id) => this.cache[id].s === 'ready'); }
  costOf(id) { const x = this.cache[id].d.next; return x ? x.gold || 0 : 0; }

  ancestors(id) {
    const out = new Set();
    const st = [id];
    while (st.length) {
      const x = st.pop();
      const n = this.def.nodes[x];
      for (const p of [...(this.parents.get(x) || []), ...(n.requiresAny || [])]) if (p !== 'hub' && own(this.def.nodes, p) && !out.has(p)) { out.add(p); st.push(p); }
    }
    return out;
  }

  // BEST NEXT (review finding 1, LOCKED 'best next' marker): first match in (0) on the path to a pinned goal, (1) new options: wakes a spirit,
  // opens an evolution or a night, keystones, unlock effects, then behaviour lanterns, (2) completes a nearly whole constellation, (3) stat lanterns.
  // Ties: cheapest first.
  tierOf(id, pinAnc) {
    const n = this.def.nodes[id];
    if (pinAnc.has(id)) return 0;
    if (UNLOCK_KINDS.has(n.kind) || (n.effects || []).some((e) => e && e.unlock)) return 1;
    if (VERB_KINDS.has(n.kind)) return 1.5;
    const r = this.region(id);
    if (r && r.kind !== 'rings' && r.ids.length && r.lit >= r.ids.length - 2) return 2;
    return 3;
  }

  bestNext() {
    const a = this.readyList();
    if (!a.length) return null;
    const pinAnc = new Set();
    for (const p of this.pins) if (own(this.def.nodes, p) && !this.owned(p)) { pinAnc.add(p); for (const x of this.ancestors(p)) pinAnc.add(x); }
    let bi = null, bt = 9, bc = Infinity;
    for (const id of a) { const t = this.tierOf(id, pinAnc), c = this.costOf(id); if (t < bt || (t === bt && c < bc)) { bi = id; bt = t; bc = c; } }
    return { id: bi, tier: bt, why: this.whyOf(bi, bt) };
  }

  whyOf(id, tier) {
    const n = this.def.nodes[id];
    const fx = n.effects || [];
    if (tier === 0) return 'On the way to your pinned goal';
    if (n.kind === 'heart' || fx.some((e) => e && e.unlock === 'weapon')) return 'Wakes a new spirit for your runs';
    if (n.kind === 'socket' || fx.some((e) => e && e.unlock === 'evolution')) return 'Opens a new evolution';
    if (n.kind === 'gate' || fx.some((e) => e && e.unlock === 'tier')) return 'Opens a harder night with better rewards';
    if (fx.some((e) => e && e.unlock === 'hero')) return 'Wakes a new hero';
    if (n.kind === 'key') return 'A keystone: changes how your runs play';
    if (fx.some((e) => e && e.unlock === 'rerolls')) return 'Lets you reroll level-up cards';
    if (fx.some((e) => e && e.unlock === 'banishes')) return 'Lets you banish a card you never want';
    if (fx.some((e) => e && e.unlock)) return 'Unlocks a new option';
    if (n.kind === 'hero') return 'A new trick for your hero';
    if (VERB_KINDS.has(n.kind)) return 'Changes what your spirits do';
    const r = this.region(id);
    if (tier === 2 && r) return `Nearly completes ${r.name}`;
    return 'The cheapest step forward';
  }

  // --------------------------------------------------------------- words (plain, short; all text goes through textContent)
  costText(id) {
    const x = this.cache[id].d.next;
    if (!x) return '';
    const p = [];
    if (x.gold) p.push(`${fmtN(x.gold)} gold`);
    if (x.shards) p.push(`${x.shards} shard${x.shards > 1 ? 's' : ''}`);
    if (x.glass) p.push(`${x.glass} Dawnglass`);
    return p.join(' + ');
  }

  shortText(id) {
    const x = this.cache[id].d.next;
    if (!x) return '';
    const s = this.save;
    const p = [];
    if (x.gold > (s.gold || 0)) p.push(`${fmtN(x.gold - (s.gold || 0))} gold`);
    if (x.shards > (s.shards || 0)) p.push(`${x.shards - (s.shards || 0)} shard${x.shards - (s.shards || 0) > 1 ? 's' : ''}`);
    if (x.glass > (s.dawnglass || 0)) p.push(`${x.glass - (s.dawnglass || 0)} Dawnglass`);
    return p.length ? `${p.join(' + ')} short` : '';
  }

  nameOf(id) { return this.cache[id] ? this.cache[id].d.name : this.def.nodes[id].name; }

  // One-line state for the detail panel (and the screen-reader line).
  stateText(id) {
    const ce = this.cache[id];
    const n = this.def.nodes[id];
    const r = this.rank(id);
    if (ce.v === 'closed') return 'Closed: its rival keystone is lit';
    if (ce.v === 'unreached') return this.reachText(id);
    let st = SAY[ce.s];
    if (ce.s === 'open') st = `Not enough yet: ${this.shortText(id) || 'more needed'}`;
    if (ce.s === 'challenge') st = `Challenge: ${Math.round(ce.frac * 100)}% done`;
    if (ce.s === 'lit' && n.maxRank > 1) st = `Lit ${r}/${n.maxRank}`;
    if (ce.s !== 'lit' && n.maxRank > 1 && r > 0) st += ` · rank ${r}/${n.maxRank}`;
    return st;
  }

  // Why a lantern is not reachable, in plain words (connected-unlock rule: it opens when a lantern linked to it is lit).
  reachText(id) {
    const n = this.def.nodes[id];
    if ((n.gateAnc || []).some((g) => !this.lit(g))) return 'Not yet reachable: wake its spirit first';
    const h = n.cluster && this.def.hearts ? this.def.hearts[n.cluster] : null;
    if (h && h !== id && !this.lit(h)) return 'Not yet reachable: wake its spirit first';
    return 'Not yet reachable: needs the lantern next to it';
  }

  neighbours(id) {
    const n = this.def.nodes[id];
    const out = [];
    for (const x of [...n.requires, ...(n.requiresAny || []), ...(this.def.children[id] || [])]) if (!out.includes(x) && own(this.def.nodes, x) && !this.def.nodes[x].teaser) out.push(x);
    return out;
  }

  // ONE numbered checklist (review finding 7b): what is still needed, in order. [{t, done, bar?}]
  steps(id) {
    const ce = this.cache[id];
    const n = this.def.nodes[id];
    const d = ce.d;
    const out = [];
    if (ce.s === 'lit' || ce.s === 'fog') return out;
    if (ce.v === 'closed') { out.push({ t: d.reason || 'Its rival keystone is lit.', done: false }); return out; }
    for (const g of n.gateAnc || []) if (!this.lit(g)) out.push({ t: this.cache[g] && this.cache[g].d.masked ? 'Open its hidden seal first' : `Wake ${this.nameOf(g)}`, done: false });
    const h = n.cluster && this.def.hearts ? this.def.hearts[n.cluster] : null;
    if (h && h !== id && !(n.gateAnc || []).includes(h)) out.push({ t: `Wake ${this.nameOf(h)}`, done: this.lit(h) });
    if (d.rank === 0 && (n.requires.length || n.requiresAny)) {
      const nb = this.neighbours(id);
      const litNb = nb.filter((x) => this.lit(x));
      const names = nb.slice(0, 3).map((x) => this.nameOf(x));
      const more = nb.length > 3 ? ' or another lantern next to it' : '';
      if (litNb.length) out.push({ t: `Next to a lit lantern (${this.nameOf(litNb[0])})`, done: true });
      else out.push({ t: nb.length === 1 ? `Light the lantern next to it: ${names[0]}` : `Light a lantern next to it: ${names.join(' or ')}${more}`, done: false });
    }
    if (d.rank === 0) for (const L of d.condLines || []) out.push({ t: d.masked ? L.text : `${L.text}: ${fmtN(L.cur)} / ${fmtN(L.goal)}`, done: !!L.done, bar: d.masked || L.done ? null : Math.min(1, L.goal > 0 ? L.cur / L.goal : 0) });
    if (d.next && (d.next.gold || d.next.shards || d.next.glass)) out.push({ t: `Have ${this.costText(id)}`, done: !!d.affordable });
    return out;
  }

  // "About N more runs at your pace" for a challenge (needs 3+ runs of history).
  paceHint(id) {
    const d = this.cache[id].d;
    const runs = this.save.stats.runs || 0;
    if (runs < 3 || !d.condLines || d.masked) return '';
    let worst = 0;
    for (const L of d.condLines) { if (L.done) continue; const per = L.cur / runs; if (per <= 0) return ''; worst = Math.max(worst, (L.goal - L.cur) / per); }
    if (!worst) return '';
    return worst > 60 ? 'A long road at your pace.' : `About ${Math.max(1, Math.ceil(worst))} more run${Math.ceil(worst) > 1 ? 's' : ''} at your pace.`;
  }

  rewardText(id) { const k = this.whyOf(id, 9); return k === 'The cheapest step forward' ? this.cache[id].d.desc : k; }

  // Rising price (LOCKED 'Tree economy'): the shown price is the price paid; say why it is higher than the base.
  priceNote(id) {
    const n = this.def.nodes[id];
    const d = this.cache[id].d;
    if (!d.next || !this.def.creep || !(this.def.cgroup && this.def.cgroup[id])) return '';
    const base = costFor(n, d.rank + 1, 0, 0);
    if (base.gold && d.next.gold > base.gold) return `Price has risen from ${fmtN(base.gold)}: each lantern you light in this group adds ${Math.round(this.def.creep * 100)}%.`;
    return `Each lantern you light in this group adds ${Math.round(this.def.creep * 100)}% to its other prices.`;
  }

  // --------------------------------------------------------------- goals: pinned first, then 1 gold goal (best next / nearest buy), then challenges by progress
  goalRows() {
    if (this.isNew()) return [];
    const rows = [];
    const have = new Set();
    for (const id of this.pins) if (own(this.def.nodes, id) && !this.owned(id)) { rows.push({ id, pin: true }); have.add(id); }
    const gold = this.best ? this.best.id : this.def.list.filter((id) => this.cache[id].s === 'open').sort((a, b) => this.costOf(a) - this.costOf(b))[0];
    if (gold && !have.has(gold) && rows.length < MAX_PINS) { rows.push({ id: gold }); have.add(gold); }
    const conds = closestUnlocks(this.def, this.save, this.data, 12).map((c) => c.id).filter((id) => this.cache[id] && this.cache[id].v === 'cond' && !have.has(id));
    for (const id of conds) { if (rows.length >= MAX_PINS) break; rows.push({ id }); have.add(id); }
    return rows;
  }

  goalInfo(row) {
    const ce = this.cache[row.id];
    const d = ce.d;
    let frac = 0, txt = '', gold = false;
    if (ce.v === 'cond') {
      frac = ce.frac;
      const open = (d.condLines || []).filter((l) => !l.done);
      txt = d.masked ? 'Keep playing to find out' : open.map((l) => `${l.text}: ${fmtN(l.cur)}/${fmtN(l.goal)}`).join(' + ');
      const pc = this.paceHint(row.id);
      if (pc) txt += ` · ${pc}`;
    } else if (ce.s === 'open' || ce.s === 'ready') {
      gold = true;
      frac = Math.min(1, (this.save.gold || 0) / Math.max(1, this.costOf(row.id)));
      txt = ce.s === 'ready' ? `You can light it now (${this.costText(row.id)})` : this.shortText(row.id);
    } else txt = this.stateText(row.id);
    return { name: d.name, reward: this.rewardText(row.id), txt, frac, gold, pin: !!row.pin };
  }

  // The calm Next-step bar.
  stepText() {
    if (this.isNew()) return { h: 'Finish a run to earn gold', s: 'Then come back here and light your first lantern.', id: null };
    if (this.best) return { h: `Light ${this.nameOf(this.best.id)}`, s: `${this.best.why} · ${this.costText(this.best.id)}`, id: this.best.id };
    const sh = this.def.list.filter((id) => this.cache[id].s === 'open').sort((a, b) => this.costOf(a) - this.costOf(b))[0];
    if (sh) return { h: `Next: ${this.nameOf(sh)}`, s: `${this.shortText(sh)}. Play a run to earn it.`, id: sh };
    return { h: 'Play to wake more spirits', s: 'Your goals show what is closest.', id: null, goals: true };
  }

  // Region listing for the index sheet: rings first, then constellations, then groups, each by angle.
  regionOrder() {
    const K = { rings: 0, cluster: 1, tool: 2 };
    return this.view.regions.filter((r) => r.ids.length).sort((a, b) => (K[a.kind] - K[b.kind]) || (Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x)));
  }
}
