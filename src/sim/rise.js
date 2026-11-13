// DM7 OPHIMBER'S RISE (Lucinda's ability, LOCKED 2026-11-01, docs/design/fire-weapon-lucinda-v2.md s5). Her pet Ophimber rises over 0.4 s, then breathes
// three rings of fire round the spot she stood on (radius 48 / 88 / 128, band 20 px) that ignite at 0.4 / 1.1 / 1.8 s and each burn 3 s. The centre stays
// fixed (rings never drag; she keeps moving); fire never hurts her or allies. SCORCH-OUT: offence only, no heal, no slow (Elias's Sanctuary Ring is the
// static healing disc). Per ring: an ignition hit (hit x B) on foes in the band as the breath sweeps clockwise, then ground ticks (tickK x ignition)
// every 0.5 s with ONE tick per foe per 0.5 s across all rings (the global lockout, so overlap never multiplies), Burn via the shared sim.burn (one
// instance per foe, strongest wins). Bosses take 0.5 x. B = base + perLevel x hero level (the Bond level, capped at levelCap): 14 .. 26.
// Deterministic: no RNG is drawn; foes are visited in list order. Every number is read from characters.json and clamped by RISE_HARD, so data can
// never lift a cap. Render reads `sim.rise` (never writes it).
export const RISE_HARD = Object.freeze({ rings: 3, minR: 16, maxR: 160, bandLo: 8, bandHi: 32, maxHits: 40, lockout: 0.5, levelCap: 20, burnLo: 0.5, burnHi: 6 });
const num = (v, lo, hi, d) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const okPt = (e) => e && Number.isFinite(e.x) && Number.isFinite(e.y);
const TAU = Math.PI * 2;
const DEF_RINGS = [{ r: 48, at: 0.4, sweep: 0.35 }, { r: 88, at: 1.1, sweep: 0.45 }, { r: 128, at: 1.8, sweep: 0.55 }];

// Clean, clamped ability numbers (a forged or missing field falls back to the locked value).
export function riseDef(d) {
  const o = d && typeof d === 'object' ? d : {};
  const src = Array.isArray(o.rings) && o.rings.length ? o.rings.slice(0, RISE_HARD.rings) : DEF_RINGS;
  const rings = src.map((q, i) => {
    const f = DEF_RINGS[i] || DEF_RINGS[2];
    return { r: num(q && q.r, RISE_HARD.minR, RISE_HARD.maxR, f.r), at: num(q && q.at, 0, 6, f.at), sweep: num(q && q.sweep, 0.1, 1.5, f.sweep) };
  });
  return {
    rise: num(o.rise, 0.1, 1.5, 0.4), rings,
    band: num(o.band, RISE_HARD.bandLo, RISE_HARD.bandHi, 20), burnSecs: num(o.burnSecs, 0.5, 4, 3),
    hit: num(o.hit, 0, 6, 2.2), tickK: num(o.tickK, 0, 2, 0.5), tick: num(o.tick, 0.25, 2, 0.5), bossK: num(o.bossK, 0.05, 1, 0.5),
    base: num(o.base, 0, 60, 14), perLevel: num(o.perLevel, 0, 3, 0.6), burnTime: num(o.burnTime, 0.5, 4, 2), burnRate: num(o.burnRate, 0, 0.5, 0.2),
    previewT: num(o.previewT, 0, 1, 0.25), settle: num(o.settle, 0.5, 6, 2.4),
  };
}

export function startRise(sim, d) {
  const D = riseDef(d), p = sim.player;
  if (!okPt(p)) return null;
  const durMul = num(sim.tfx && sim.tfx.abilityDur, 1, 3, 1); // the generic ability-duration node lengthens how long each ring burns
  const burn = num(D.burnSecs * durMul, RISE_HARD.burnLo, RISE_HARD.burnHi, 3);
  const lvl = Math.min(RISE_HARD.levelCap, Math.max(0, Number.isInteger(sim.bondLevel) ? sim.bondLevel : 0));
  const rings = D.rings.map((q) => ({ r: q.r, at: q.at, sweep: q.sweep, end: q.at + q.sweep + burn, lit: false, hit: new Set(), tickT: q.at, born: -1 })); // each ring burns `burn` s once its sweep is complete (ring 3 ends ~5.3 s)
  const last = rings.reduce((m, q) => Math.max(m, q.end), 0);
  sim.rise = { x: p.x, y: p.y, t: 0, D, B: D.base + D.perLevel * lvl, rings, lock: new Map(), burn, last, done: last + 0.7, n: 0 };
  sim.pushEvent('rise', { x: p.x, y: p.y });
  return sim.rise;
}

// Clockwise angle (0 = straight up) of a point round the centre, 0..TAU.
const clock = (dx, dy) => { const a = Math.atan2(dx, -dy); return a < 0 ? a + TAU : a; };

export function updateRise(sim, dt) {
  const R = sim.rise;
  if (!R) return;
  if (!(dt > 0)) return;
  R.t += dt;
  if (R.t >= R.done) { sim.rise = null; return; }
  const D = R.D, E = sim.enemies, lock = R.lock, half = D.band / 2;
  const prevSrc = sim._src;
  sim._src = 'ophimbers_rise';
  for (let k = 0; k < R.rings.length; k++) {
    const q = R.rings[k];
    if (R.t < q.at || R.t > q.end) continue;
    if (!q.lit) { q.lit = true; q.born = R.t; sim.pushEvent('riseRing', { i: k, x: R.x, y: R.y, r: q.r }); }
    const prog = Math.min(1, (R.t - q.at) / q.sweep), lim = prog * TAU, swept = prog >= 1;
    // ignition: foes in the band that the breath has reached, once each
    if (!swept || q.hit.size < RISE_HARD.maxHits) for (let i = 0; i < E.length; i++) {
      const e = E[i];
      if (e.dead || !okPt(e) || q.hit.has(e)) continue;
      const dx = e.x - R.x, dy = e.y - R.y, d = Math.hypot(dx, dy), er = Number.isFinite(e.r) ? e.r : 0;
      if (Math.abs(d - q.r) > half + er) continue;
      if (!swept && clock(dx, dy) > lim) continue;
      if (q.hit.size >= RISE_HARD.maxHits) break;
      q.hit.add(e);
      const h = R.B * D.hit * (e.boss ? D.bossK : 1);
      lock.set(e, sim.time);
      if (sim.hurt(e, h) > 0) sim.burn(e, h, D.burnTime, D.burnRate);
    }
    // ground ticks across the swept part of the band
    q.tickT -= dt;
    if (q.tickT <= 0) {
      q.tickT += D.tick;
      let n = 0;
      for (let i = 0; i < E.length && n < RISE_HARD.maxHits; i++) {
        const e = E[i];
        if (e.dead || !okPt(e)) continue;
        const dx = e.x - R.x, dy = e.y - R.y, d = Math.hypot(dx, dy), er = Number.isFinite(e.r) ? e.r : 0;
        if (Math.abs(d - q.r) > half + er) continue;
        if (!swept && clock(dx, dy) > lim) continue;
        n++;
        const last = lock.get(e);
        if (last !== undefined && sim.time - last < RISE_HARD.lockout - 1e-6) continue; // one tick per foe per 0.5 s across every ring
        lock.set(e, sim.time);
        const h = R.B * D.hit * D.tickK * (e.boss ? D.bossK : 1);
        if (sim.hurt(e, h, { silent: true }) > 0) sim.burn(e, h, D.burnTime, D.burnRate);
      }
    }
  }
  sim._src = prevSrc;
  if (lock.size > 96) for (const [e, tm] of lock) if (e.dead || sim.time - tm > 2) lock.delete(e);
}
