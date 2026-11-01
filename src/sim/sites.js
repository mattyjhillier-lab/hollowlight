// Map events v1 "Hollow Places" (docs/design/map-events-v1.md; LOCKED 'MAP EVENTS PICKS' 2026-10-28):
//  - LAMP POSTS (rest): cold lamps in three wake groups (near / mid / far); each shows its reward glyph (xp / gold / heart) BEFORE you go;
//    walk into one to light it (instant). Rewards inside the sheet's well budget (1.5 L XP, 45 gold, 65% heal per run).
//  - LANTERN ROAD (route): three cold lanterns on a line; touch one to start a timer, light all three for the set prize.
//  - HOLLOW KNOT (risk): a still corruption source; wakes when you come near, sprouts Root Crawlers, a telegraphed root pulse; burn it out.
// Pure sim (no Phaser / DOM). Own RNG stream (siteRng = seed ^ SITE_SALT): drawn ONLY when the Sim runs with sites on, and every event foe
// takes that stream, so a run with sites off is byte-identical to a run on a build without this file. Bad data fails CLOSED (no sites).
export const SITE_SALT = 0x51735;
export const siteSeed = (seed) => ((seed ^ SITE_SALT) >>> 0);
export const LAMP_KINDS = ['xp', 'gold', 'heart'];
export const KNOT_TYPE = 'hollow_knot'; // not an enemies.json type: the knot is a still target built here (never in waves, codex or kill counts)
const TAU = Math.PI * 2;

const num = (v, lo, hi, what) => { if (!(Number.isFinite(v) && v >= lo && v <= hi)) throw new Error(`sites: bad ${what}`); return v; };
const band = (v, what) => { if (!Array.isArray(v) || v.length !== 2) throw new Error(`sites: bad ${what}`); num(v[0], 0, 4000, what); num(v[1], v[0], 4000, what); return [v[0], v[1]]; };
const obj = (v, what) => { if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error(`sites: bad ${what}`); return v; };

// Returns a clean copy of the chapter's sites block, or null (fail closed) on any missing / out-of-range / unknown field.
export function validateSites(raw, enemies) {
  try {
    obj(raw, 'block');
    const d = {
      sleepAt: num(raw.sleepAt, 1, 1e5, 'sleepAt'),
      edge: num(raw.edge, 0, 1000, 'edge'), gap: num(raw.gap, 0, 2000, 'gap'), lampGap: num(raw.lampGap, 0, 2000, 'lampGap'),
      bands: {}, lamps: null, roads: null, knots: null, tiers: {},
    };
    const B = obj(raw.bands, 'bands');
    for (const k of ['near', 'mid', 'far']) d.bands[k] = band(B[k], `band ${k}`);
    const bandOf = (k) => { if (!Object.hasOwn(d.bands, k)) throw new Error('sites: bad band id'); return k; };
    const L = obj(raw.lamps, 'lamps');
    d.lamps = { r: num(L.r, 4, 80, 'lamp r'), groups: [] };
    if (!Array.isArray(L.groups) || L.groups.length < 1 || L.groups.length > 6) throw new Error('sites: bad lamp groups');
    for (const g of L.groups) {
      obj(g, 'lamp group');
      if (!Array.isArray(g.kinds) || g.kinds.length < 1 || g.kinds.length > 8 || !g.kinds.every((k) => LAMP_KINDS.includes(k))) throw new Error('sites: bad lamp kinds');
      d.lamps.groups.push({ t: num(g.t, 0, 1e5, 'lamp t'), band: bandOf(g.band), kinds: g.kinds.slice(), xp: num(g.xp, 0, 2, 'lamp xp'), gold: num(g.gold, 0, 500, 'lamp gold'), heal: num(g.heal, 0, 1, 'lamp heal') });
    }
    const R = obj(raw.roads, 'roads');
    d.roads = { r: num(R.r, 4, 80, 'road r'), cand: Math.floor(num(R.cand, 1, 6, 'road cand')), pickAt: num(R.pickAt, 0, 4000, 'road pickAt'), list: [] };
    if (!Array.isArray(R.list) || R.list.length > 4) throw new Error('sites: bad roads');
    for (const r of R.list) {
      obj(r, 'road'); const each = obj(r.each, 'road each'), set = obj(r.set, 'road set');
      d.roads.list.push({
        t: num(r.t, 0, 1e5, 'road t'), band: bandOf(r.band), spacing: num(r.spacing, 100, 1500, 'road spacing'), timer: num(r.timer, 5, 600, 'road timer'), atWake: r.atWake === true,
        each: { xp: num(each.xp, 0, 2, 'road each xp'), gold: num(each.gold, 0, 500, 'road each gold') },
        set: { xp: num(set.xp ?? 0, 0, 2, 'road set xp'), gold: num(set.gold ?? 0, 0, 500, 'road set gold'), magnet: set.magnet === true, bless: set.bless === true },
      });
    }
    const K = obj(raw.knots, 'knots'), P = obj(K.pulse, 'pulse');
    if (typeof K.born !== 'string' || !enemies || !Object.hasOwn(enemies, K.born)) throw new Error('sites: bad knot born');
    if (!Array.isArray(K.cells) || !K.cells.every((c) => Array.isArray(c) && c.length === 2 && c.every((v) => Number.isInteger(v) && v >= 0 && v <= 2))) throw new Error('sites: bad knot cells');
    d.knots = {
      r: num(K.r, 4, 80, 'knot r'), born: K.born, cells: K.cells.map((c) => [c[0], c[1]]), cand: Math.floor(num(K.cand, 1, 6, 'knot cand')), pickAt: num(K.pickAt, 0, 4000, 'knot pickAt'),
      wake: num(K.wake, 20, 2000, 'knot wake'), leash: num(K.leash, 20, 3000, 'knot leash'), regen: num(K.regen, 0.5, 120, 'knot regen'),
      every: num(K.every, 0.5, 60, 'knot every'), per: num(K.per, 0, 10, 'knot per'), cap: Math.floor(num(K.cap, 0, 60, 'knot cap')), busy: Math.floor(num(K.busy, 0, 1000, 'knot busy')),
      pulse: { every: num(P.every, 1, 60, 'pulse every'), tell: num(P.tell, 0.2, 5, 'pulse tell'), r: num(P.r, 10, 400, 'pulse r'), dmg: num(P.dmg, 0, 200, 'pulse dmg') },
      list: [],
    };
    if (d.knots.leash <= d.knots.wake) throw new Error('sites: leash must exceed wake');
    if (!Array.isArray(K.list) || K.list.length > 4) throw new Error('sites: bad knots');
    for (const k of K.list) {
      obj(k, 'knot'); const rw = obj(k.reward, 'knot reward');
      d.knots.list.push({
        t: num(k.t, 0, 1e5, 'knot t'), band: bandOf(k.band), hp: num(k.hp, 1, 1e6, 'knot hp'), atWake: k.atWake === true,
        reward: { xp: num(rw.xp ?? 0, 0, 2, 'knot xp'), gold: num(rw.gold ?? 0, 0, 500, 'knot gold'), heart: rw.heart === true, bless: rw.bless === true, shard: Math.floor(num(rw.shard ?? 0, 0, 1, 'knot shard')) },
      });
    }
    if (raw.tiers !== undefined) {
      obj(raw.tiers, 'tiers');
      for (const id of Object.keys(raw.tiers)) {
        if (!/^[a-z]{1,16}$/.test(id)) throw new Error('sites: bad tier id');
        const T = obj(raw.tiers[id], 'tier');
        d.tiers[id] = { pulseEvery: T.pulseEvery === undefined ? null : num(T.pulseEvery, 1, 60, 'tier pulseEvery'), spawnMul: num(T.spawnMul ?? 1, 0, 4, 'tier spawnMul'), healMul: num(T.healMul ?? 1, 0, 2, 'tier healMul') };
      }
    }
    return d;
  } catch {
    return null;
  }
}

// The run's sites: placed at construction from siteRng; stepped by the Sim; published as plain objects for the renderer and the bots.
export class Sites {
  constructor(sim, def) {
    this.sim = sim; this.def = def; this.rng = sim.siteRng;
    const T = def.tiers[sim.tier.id] || {};
    this.tk = { pulseEvery: T.pulseEvery || def.knots.pulse.every, spawnMul: T.spawnMul ?? 1, healMul: T.healMul ?? 1 };
    this.list = []; // every site (lamps, roads, knots); render / bot read only
    this.slept = false;
    this.paid = { xpL: 0, gold: 0, heal: 0, bless: 0, shard: 0, magnet: 0 }; // per-run totals (results / bot readout)
    this.nid = 1;
    const size = sim.balance.worldSize, c = size / 2;
    this.size = size; this.c = c;
    const taken = []; // { x, y, gap } placed points (every candidate counts, so no two places overlap whichever candidate wakes)
    const okAt = (x, y, gap, cells) => {
      if (x < def.edge || y < def.edge || x > size - def.edge || y > size - def.edge) return false;
      if (cells) { const i = Math.min(2, Math.floor((x / size) * 3)), j = Math.min(2, Math.floor((y / size) * 3)); if (!cells.some((q) => q[0] === i && q[1] === j)) return false; }
      for (const pt of sim.patches) if (Math.hypot(x - pt.x, y - pt.y) < pt.r + 40) return false;
      if (Math.hypot(x - c, y - c) < 300) return false; // never on the start glade
      for (const q of taken) if (Math.hypot(x - q.x, y - q.y) < Math.min(gap, q.gap)) return false; // big-big keep `gap`; anything near a lamp keeps `lampGap`
      return true;
    };
    const inBand = (b, gap, cells) => {
      const [lo, hi] = def.bands[b];
      for (let i = 0; i < 400; i++) {
        const a = this.rng.range(0, TAU), d = this.rng.range(lo, hi), x = c + Math.cos(a) * d, y = c + Math.sin(a) * d;
        if (okAt(x, y, gap, cells)) return { x, y };
      }
      return null;
    };
    // knots first (they need a corner B zone), then roads, then lamps
    for (const K of def.knots.list) {
      const cands = [];
      for (let n = 0; n < (K.atWake ? def.knots.cand : 1); n++) { const q = inBand(K.band, def.gap, def.knots.cells); if (q) { taken.push({ x: q.x, y: q.y, gap: def.gap }); cands.push(q); } }
      if (cands.length) this.list.push({ id: this.nid++, kind: 'knot', t: K.t, band: K.band, def: K, cands, x: cands[0].x, y: cands[0].y, state: 'sleep', foe: null, hp: 1, maxHp: 1, spawnT: def.knots.every, acc: 0, pulseT: this.tk.pulseEvery, tell: 0, near: false });
    }
    // roads: a straight line of three lanterns (middle one in the band); `cand` candidates when the road is picked at wake
    for (const R of def.roads.list) {
      const cands = [];
      for (let n = 0; n < (R.atWake ? def.roads.cand : 1); n++) {
        for (let i = 0; i < 200; i++) {
          const m = inBand(R.band, def.gap);
          if (!m) break;
          const a = this.rng.range(0, TAU), ux = Math.cos(a) * R.spacing, uy = Math.sin(a) * R.spacing;
          const pts = [{ x: m.x - ux, y: m.y - uy }, m, { x: m.x + ux, y: m.y + uy }];
          if (!okAt(pts[0].x, pts[0].y, def.gap, null) || !okAt(pts[2].x, pts[2].y, def.gap, null) || Math.hypot(pts[0].x - pts[2].x, pts[0].y - pts[2].y) < 1) continue;
          for (const q of pts) taken.push({ x: q.x, y: q.y, gap: def.gap });
          cands.push(pts);
          break;
        }
      }
      if (cands.length) this.list.push({ id: this.nid++, kind: 'road', t: R.t, band: R.band, def: R, cands, lanterns: cands[0].map((q) => ({ x: q.x, y: q.y, lit: false })), x: cands[0][1].x, y: cands[0][1].y, state: 'sleep', left: R.timer, timer: R.timer, lit: 0 });
    }
    for (const G of def.lamps.groups) {
      const kinds = this.rng.shuffle(G.kinds);
      for (const kind of kinds) {
        const q = inBand(G.band, def.lampGap);
        if (!q) continue;
        taken.push({ x: q.x, y: q.y, gap: def.lampGap });
        const amt = kind === 'xp' ? G.xp : kind === 'gold' ? G.gold : G.heal;
        this.list.push({ id: this.nid++, kind: 'lamp', t: G.t, band: G.band, reward: kind, amt, x: q.x, y: q.y, state: 'sleep' });
      }
    }
    this.list.sort((a, b) => a.t - b.t || a.id - b.id);
  }

  // counts for the results line / bots: { lamp: [done, total], road: [...], knot: [...] }
  summary() {
    const out = { lamp: [0, 0], road: [0, 0], knot: [0, 0], paid: { ...this.paid } };
    for (const s of this.list) { out[s.kind][1] += 1; if (s.state === 'done') out[s.kind][0] += 1; }
    return out;
  }

  // the site the player is busy with (road running / knot fight), else null
  get active() { for (const s of this.list) if (s.state === 'active' || s.state === 'fight') return s; return null; }

  // XP in level units, paid as gems that hang in the light for a beat then fly in (chest style)
  payXp(L, x, y, n = 3) {
    if (!(L > 0)) return;
    const s = this.sim, xp = Math.ceil(s.xpNeeded * L);
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; s.addGem(x + Math.cos(a) * 12, y - 8 + Math.sin(a) * 6, xp / n); const g = s.gems[s.gems.length - 1]; g.mag = true; g.hold = 0.45 + i * 0.05; }
    this.paid.xpL += L;
  }
  payGold(v) { if (v > 0) { this.sim.gold += v; this.paid.gold += v; } }
  payHeal(f) { if (f > 0) { const p = this.sim.player, h = p.maxHp * f * this.tk.healMul; this.paid.heal += Math.min(h, p.maxHp - p.hp); this.sim.healPlayer(h); } }
  // a Blessing choice (1 of 3, the chest's pool and caps); if none can be offered the chest floor pays instead (0.5 L + 25 gold)
  payBless(x, y) {
    const s = this.sim;
    if (s.blessDef) { s.startQueue.push('siteBless'); if (s.nextStartOffer()) { this.paid.bless += 1; return; } }
    this.payXp(0.5, x, y); this.payGold(25);
  }

  wake(site) {
    const p = this.sim.player;
    if (site.cands && site.cands.length > 1) { // picked now: the candidate whose distance from the hero is closest to pickAt (a real trip, never across the whole map)
      const want = site.kind === 'road' ? this.def.roads.pickAt : this.def.knots.pickAt;
      let best = 0, bd = Infinity;
      site.cands.forEach((c, i) => { const q = site.kind === 'road' ? c[1] : c; const d = Math.abs(Math.hypot(q.x - p.x, q.y - p.y) - want); if (d < bd) { bd = d; best = i; } });
      const q = site.cands[best];
      if (site.kind === 'road') { site.lanterns = q.map((v) => ({ x: v.x, y: v.y, lit: false })); site.x = q[1].x; site.y = q[1].y; } else { site.x = q.x; site.y = q.y; }
    }
    site.state = 'awake';
    this.sim.pushEvent('siteWake', { id: site.id, kind: site.kind, x: site.x, y: site.y });
  }

  sleepAll() {
    if (this.slept) return;
    this.slept = true;
    let any = false;
    for (const s of this.list) {
      if (s.state === 'sleep') { s.state = 'gone'; continue; }
      if (s.state === 'awake' || s.state === 'active' || s.state === 'fight' || s.state === 'calm') { any = true; if (s.foe && !s.foe.dead) s.foe.dead = true; s.foe = null; s.state = 'gone'; }
    }
    if (any) this.sim.pushEvent('sitesSleep', {});
  }

  step(dt) {
    const s = this.sim;
    if (this.slept || s.state !== 'running') return;
    if (s.time >= this.def.sleepAt || s.spawnHalt || s.endless || s.fight) { this.sleepAll(); return; }
    const p = s.player, t = s.time;
    for (const site of this.list) {
      if (site.state === 'sleep') { if (t < site.t) continue; this.wake(site); }
      if (site.kind === 'lamp') this.stepLamp(site, p);
      else if (site.kind === 'road') this.stepRoad(site, p, dt);
      else this.stepKnot(site, p, dt);
      if (s.state !== 'running') return; // a Blessing choice opened, or a pulse ended the run
    }
  }

  stepLamp(site, p) {
    if (site.state !== 'awake') return;
    const rr = this.def.lamps.r + p.r;
    if ((p.x - site.x) ** 2 + (p.y - site.y) ** 2 > rr * rr) return;
    site.state = 'done';
    if (site.reward === 'xp') this.payXp(site.amt, site.x, site.y);
    else if (site.reward === 'gold') this.payGold(site.amt);
    else this.payHeal(site.amt);
    this.sim.pushEvent('lampLit', { id: site.id, kind: 'lamp', reward: site.reward, amt: site.amt, x: site.x, y: site.y });
  }

  stepRoad(site, p, dt) {
    if (site.state !== 'awake' && site.state !== 'active') return;
    const R = site.def, rr = this.def.roads.r + p.r;
    for (const L of site.lanterns) {
      if (L.lit || (p.x - L.x) ** 2 + (p.y - L.y) ** 2 > rr * rr) continue;
      L.lit = true; site.lit += 1;
      if (site.state === 'awake') { site.state = 'active'; site.left = R.timer; }
      this.payXp(R.each.xp, L.x, L.y, 2); this.payGold(R.each.gold);
      this.sim.pushEvent('roadLit', { id: site.id, n: site.lit, x: L.x, y: L.y, gold: R.each.gold });
    }
    if (site.state !== 'active') return;
    if (site.lit >= site.lanterns.length) {
      site.state = 'done';
      const S = R.set, last = site.lanterns.find((L) => L.lit) || site;
      this.payGold(S.gold); this.payXp(S.xp, p.x, p.y);
      if (S.magnet) { for (const g of this.sim.gems) g.mag = true; this.paid.magnet += 1; }
      this.sim.pushEvent('siteDone', { id: site.id, kind: 'road', magnet: S.magnet, bless: S.bless, gold: S.gold, x: last.x, y: last.y });
      if (S.bless) this.payBless(p.x, p.y);
      return;
    }
    site.left -= dt;
    if (site.left <= 0) { site.left = 0; site.state = 'failed'; this.sim.pushEvent('roadFail', { id: site.id, n: site.lit }); }
  }

  // the knot: a still, high-HP target in sim.enemies (weapons hit it like any foe); it never moves, deals no contact damage, is never
  // recycled, marked or shoved, gives no kill / gem / gold / drop (vanish) - its prize is paid here.
  spawnKnot(site) {
    const s = this.sim, K = this.def.knots, hp = site.def.hp * s.tier.enemyHp;
    const e = {
      id: s.nextId++, type: KNOT_TYPE, knot: site.id, x: site.x, y: site.y, r: K.r, hp, maxHp: hp, speed: 0, dmg: 0, xp: 0, gold: 0, mass: 1e6, boss: false,
      state: 'run', stT: 0, dx: 0, dy: 0, tele: false, chargeCd: 1e9, slamCd: 1e9, phase: 0, cd: {},
      markT: 0, markSrc: null, bleedT: 0, bleedDps: 0, bleedTot: 0, burnT: 0, burnDps: 0, burnTot: 0, burnSrc: null, fearT: 0, flash: 0, dead: false, faceX: 1, vanish: true,
    };
    s.alive[KNOT_TYPE] = (s.alive[KNOT_TYPE] || 0) + 1;
    s.enemies.push(e);
    site.foe = e; site.hp = hp; site.maxHp = hp;
    site.spawnT = K.every; site.pulseT = this.tk.pulseEvery; site.tell = 0; site.acc = 0;
    return e;
  }

  stepKnot(site, p, dt) {
    const s = this.sim, K = this.def.knots;
    if (site.state === 'done' || site.state === 'gone') return;
    const d = Math.hypot(p.x - site.x, p.y - site.y);
    if (site.state === 'awake') { if (d < K.wake) { this.spawnKnot(site); site.state = 'fight'; s.pushEvent('knotWake', { id: site.id, x: site.x, y: site.y }); } return; }
    const e = site.foe;
    if (!e || e.dead) { // burnt out
      site.state = 'done'; site.foe = null; site.hp = 0; site.tell = 0;
      const W = site.def.reward;
      this.payXp(W.xp, site.x, site.y, 4); this.payGold(W.gold);
      if (W.heart) s.addPickup('heart', site.x + 14, site.y + 6);
      if (W.shard > 0 && this.paid.shard < 1) { s.shards += 1; this.paid.shard += 1; } // at most one soul shard per run from sites, any night
      s.pushEvent('siteDone', { id: site.id, kind: 'knot', gold: W.gold, shard: W.shard > 0, bless: W.bless, x: site.x, y: site.y });
      if (W.bless) this.payBless(site.x, site.y);
      return;
    }
    site.hp = e.hp; e.x = site.x; e.y = site.y; // pinned (separation nudges a huge mass by a hair; the knot never moves)
    if (d > K.leash) { // walked away: no spawns or pulses; it heals back to full over `regen` s, then sleeps again (no penalty, retry any time)
      site.state = 'calm'; site.tell = 0;
      e.hp = Math.min(e.maxHp, e.hp + (e.maxHp / K.regen) * dt);
      if (e.hp >= e.maxHp) { e.dead = true; site.foe = null; site.state = 'awake'; }
      return;
    }
    site.state = 'fight';
    // root pulse: a tell of `tell` s (render + bot read site.tell), then one hit to anyone inside r
    if (site.tell > 0) {
      site.tell -= dt;
      if (site.tell <= 0) {
        site.tell = 0;
        if (d < K.pulse.r + p.r) s.damagePlayer(K.pulse.dmg * (1 + s.balance.dmgScale.linear * s.minutes) * s.tier.enemyDmg, 'knot', { kind: 'pulse', id: e.id, x: site.x, y: site.y });
        s.pushEvent('knotPulse', { id: site.id, x: site.x, y: site.y });
        if (s.state !== 'running') return;
      }
    } else if ((site.pulseT -= dt) <= 0) { site.pulseT = this.tk.pulseEvery; site.tell = K.pulse.tell; }
    // knot-born Root Crawlers (own stream): paused while the map is crowded or in the second a swarm arrives
    if ((site.spawnT -= dt) <= 0) {
      site.spawnT = K.every;
      if (s.enemies.length > K.busy || s.chapter.events.some((ev) => s.time >= ev.t && s.time < ev.t + 1)) return;
      let alive = 0;
      for (const f of s.enemies) if (f.knotBorn === site.id && !f.dead) alive += 1;
      site.acc += K.per * this.tk.spawnMul;
      while (site.acc >= 1) {
        site.acc -= 1;
        if (alive >= K.cap) continue;
        const a = this.rng.range(0, TAU), r = K.r + this.rng.range(6, 18);
        const f = s.spawnEnemy(K.born, site.x + Math.cos(a) * r, site.y + Math.sin(a) * r, this.rng);
        f.knotBorn = site.id; alive += 1;
      }
    }
  }
}
