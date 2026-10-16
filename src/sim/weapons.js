// Weapon behaviours. Each weapon exposes update(sim, w, dt).
// w = { id, ranks, evo, s (computed stats), rt (runtime scratch) }.
// Evolutions are handled inside each weapon by branching on w.evo.

import { BLEED_TIME } from './cards.js';

const TAU = Math.PI * 2;

// Evolution tuning lives in evolutions.json under "tune"; the second argument is the fallback.
const tune = (sim, w, key, dflt) => sim.data.evolutions[w.evo]?.tune?.[key] ?? dflt;

function syncUnits(sim, w, kind, count, props) {
  const list = w.rt.units || (w.rt.units = []);
  while (list.length > count) list.pop().dead = true;
  while (list.length < count) {
    const u = sim.makeUnit(w, kind, props(list.length));
    list.push(u);
    sim.units.push(u);
  }
  return list;
}

function moveToward(u, tx, ty, speed, dt) {
  const dx = tx - u.x;
  const dy = ty - u.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.001) return 0;
  const step = Math.min(d, speed * dt);
  u.x += (dx / d) * step;
  u.y += (dy / d) * step;
  if (Math.abs(dx) > 0.5) u.faceX = dx > 0 ? 1 : -1;
  return d;
}

// ---------------------------------------------------------------- Ghost Wolves
const ghostWolves = {
  update(sim, w, dt) {
    const { s, evo, rt } = w;
    const p = sim.player;
    let count = s.count;
    if (evo === 'howling_legion') count = Math.round(s.count * 1.4) + 1;
    if (evo === 'dire_alpha') count = 1;
    const units = syncUnits(sim, w, 'wolf', count, (i) => ({
      r: 4, atkCd: 0, target: null, retarget: 0, dash: 0, dashCd: 0.1 + i * 0.25, slot: i, hit: null, faceX: 1,
    }));

    const howl = sim.buffs.packHowl > 0 ? 2 : 1;
    let dmg = s.power * sim.dmgMult(w) * howl;
    let speed = s.speed * howl;
    let bleedDur = BLEED_TIME; // Rend (s.duration) is the potency; the time is fixed
    if (evo === 'phantom_stampede') { dmg *= tune(sim, w, 'dmg', 1.1); speed *= tune(sim, w, 'speed', 1.1); }
    if (evo === 'howling_legion') { bleedDur *= 1.3; dmg *= tune(sim, w, 'dmg', 1.25); }
    if (evo === 'dire_alpha') { dmg *= tune(sim, w, 'dmg', 3.2); bleedDur *= 1.5; }
    const bleedDps = dmg * s.duration; // Rend: share of a bite per second
    const biteGap = (evo === 'dire_alpha' ? tune(sim, w, 'biteGap', 0.45) : 0.6) / howl;

    if (evo === 'howling_legion') {
      rt.howlCd = (rt.howlCd ?? 4) - dt;
      if (rt.howlCd <= 0) {
        rt.howlCd = 6;
        sim.addSpeedBoost(1.2, 3);
        sim.pushEvent('howl');
      }
    }
    rt.ang = (rt.ang || 0) + 0.8 * dt;

    for (const u of units) {
      u.r = evo === 'dire_alpha' ? 11 : 4;
      u.atkCd -= dt;
      u.dashCd -= dt;
      u.retarget -= dt;

      if (u.leap) {
        const L = u.leap;
        L.t += dt;
        const k = Math.min(1, L.t / 0.28);
        u.x = L.sx + (L.tx - L.sx) * k;
        u.y = L.sy + (L.ty - L.sy) * k;
        u.faceX = L.tx >= L.sx ? 1 : -1;
        if (k >= 1) {
          u.leap = null;
          const t = L.target;
          if (t && !t.dead) {
            sim.hurt(t, dmg * tune(sim, w, 'leapHit', 1.8));
            sim.bleed(t, bleedDps, bleedDur);
            if (!t.boss) t.heldT = 1.0;
            u.maul = 1.0;
            u.maulCd = 0;
            u.target = t;
            sim.addFx({ kind: 'ring', x: t.x, y: t.y, r: 14, ttl: 0.15, color: '#9fd8ff' });
          }
        }
        continue;
      }
      if (u.maul > 0) {
        u.maul -= dt;
        const t = u.target;
        if (!t || t.dead) u.maul = 0;
        else {
          u.x = t.x + (u.slot % 2 ? 5 : -5);
          u.y = t.y + 2;
          u.faceX = u.slot % 2 ? -1 : 1;
          u.maulCd -= dt;
          if (u.maulCd <= 0) { u.maulCd = 0.2; sim.hurt(t, dmg * tune(sim, w, 'maul', 0.45)); }
          if (!t.boss) t.heldT = Math.max(t.heldT || 0, 0.15);
        }
        if (u.maul > 0) continue;
      }

      if (!u.target || u.target.dead || u.retarget <= 0) {
        // Hunt close to the player so loot and gems stay within reach.
        const taken = new Set();
        for (const o of units) if (o !== u && o.target && !o.target.dead) taken.add(o.target.id);
        const near = (e) => Math.hypot(e.x - p.x, e.y - p.y) < 150;
        u.target = sim.nearestEnemy(u.x, u.y, 170, (e) => near(e) && !taken.has(e.id)) || sim.nearestEnemy(u.x, u.y, 170, near);
        u.retarget = 0.4;
      }
      const t = u.target;
      if (t) {
        const dx = t.x - u.x;
        const dy = t.y - u.y;
        const d = Math.hypot(dx, dy) || 0.001;
        if (evo === 'phantom_stampede' && u.dashCd <= 0 && d > 12 && d < 110) {
          u.leap = { sx: u.x, sy: u.y, tx: t.x, ty: t.y, target: t, t: 0 };
          u.dashCd = tune(sim, w, 'leapCd', 1.8);
          continue;
        }
        if (d > t.r + u.r) {
          moveToward(u, t.x, t.y, speed, dt);
        } else if (u.atkCd <= 0) {
          u.atkCd = biteGap;
          if (evo === 'dire_alpha') {
            for (const e of sim.enemies) {
              if (e.dead) continue;
              if (Math.hypot(e.x - u.x, e.y - u.y) < e.r + tune(sim, w, 'cleave', 24)) {
                sim.hurt(e, dmg);
                sim.bleed(e, bleedDps, bleedDur);
              }
            }
            sim.addFx({ kind: 'ring', x: u.x, y: u.y, r: tune(sim, w, 'cleave', 24), ttl: 0.15, color: '#9fd8ff' });
          } else {
            sim.hurt(t, dmg);
            sim.bleed(t, bleedDps, bleedDur);
          }
        }
      } else {
        const a = rt.ang + (u.slot * TAU) / count;
        const rad = 24 + (evo === 'dire_alpha' ? 10 : 0);
        moveToward(u, p.x + Math.cos(a) * rad, p.y + Math.sin(a) * rad, Math.max(speed, 110) * 1.2, dt);
      }
    }
  },
};

// ---------------------------------------------------------------- Raven Flock
const ravenFlock = {
  update(sim, w, dt) {
    const { s, evo, rt } = w;
    const p = sim.player;
    let count = s.count;
    let range = s.range * sim.mods.area;
    let spin = s.speed;
    const dmg = s.power * sim.dmgMult(w);
    const fear = evo === 'murder_storm';
    if (fear) {
      count = Math.min(16, s.count * 2);
      range *= 1.8;
      spin *= 1.1;
    }
    const units = syncUnits(sim, w, 'raven', count, (i) => ({
      r: 4, st: 'orbit', diveCd: 1.5 + i * 0.35, target: null, faceX: 1,
    }));
    rt.ang = (rt.ang || 0) + spin * dt;

    units.forEach((u, i) => {
      const ring = fear && i % 2 ? range * 0.55 : range;
      const a = rt.ang * (fear && i % 2 ? -1 : 1) + (i * TAU) / count;
      const ox = p.x + Math.cos(a) * ring;
      const oy = p.y + Math.sin(a) * ring;

      if (evo === 'dive_bombers') {
        if (u.st === 'dive') {
          const t = u.target;
          if (!t || t.dead) {
            u.st = 'return';
          } else if (moveToward(u, t.x, t.y, 230, dt) < t.r + 5) {
            const big = dmg * 6;
            sim.hurt(t, big);
            for (const e of sim.enemies) {
              if (e.dead || e === t) continue;
              if (Math.hypot(e.x - t.x, e.y - t.y) < e.r + 18) sim.hurt(e, dmg * 2);
            }
            sim.addFx({ kind: 'ring', x: t.x, y: t.y, r: 18, ttl: 0.2, color: '#b79cff' });
            u.st = 'return';
          }
          return;
        }
        if (u.st === 'return') {
          if (moveToward(u, ox, oy, Math.max(240, range * spin * 1.4), dt) < 8) u.st = 'orbit';
          return;
        }
        u.diveCd -= dt;
        if (u.diveCd <= 0) {
          // W1a: claim set, ravens already diving keep their target; fall back to shared only when nothing unclaimed is in range.
          const claimed = new Set();
          for (const o of units) if (o !== u && o.st === 'dive' && o.target && !o.target.dead) claimed.add(o.target.id);
          const t = sim.toughestEnemy(p.x, p.y, 170, (e) => !claimed.has(e.id)) || sim.toughestEnemy(p.x, p.y, 170);
          if (t) {
            u.st = 'dive';
            u.target = t;
            u.diveCd = 2.4;
          } else {
            u.diveCd = 0.5;
          }
        }
      }

      u.x = ox;
      u.y = oy;
      for (const e of sim.enemies) {
        if (e.dead) continue;
        const dx = e.x - u.x;
        const dy = e.y - u.y;
        const rr = e.r + u.r + 1;
        if (dx * dx + dy * dy < rr * rr && sim.canHit(e, `raven${i}`, 0.55)) {
          sim.hurt(e, dmg);
          // W1a: bosses are never frightened; an enemy that was frightened cannot be re-frightened until 1.5 s after it recovers.
          if (fear && !e.boss) {
            const fdur = tune(sim, w, 'fear', 0.3);
            if (sim.canHit(e, 'stormFear', fdur + 1.5)) e.fearT = Math.max(e.fearT, fdur);
          }
        }
      }
    });
  },
};

// ---------------------------------------------------------------- Spirit Bolts
const spiritBolts = {
  update(sim, w, dt) {
    const { s, evo, rt } = w;
    const p = sim.player;
    rt.cd = (rt.cd ?? 0.3) - dt;
    if (rt.cd > 0) return;

    let count = s.count;
    let cd = 1.1;
    let speed = s.speed;
    let dmg = s.power * sim.dmgMult(w);
    let pierce = s.pierce;
    let r = 3;
    let homing = true;
    let explode = false;
    let life = 2.4;
    if (evo === 'spirit_tempest') { count = 8; cd = tune(sim, w, 'cd', 0.8); speed *= 1.4; explode = true; dmg *= tune(sim, w, 'dmg', 1); }
    if (evo === 'soul_lance') { count = 1; dmg *= tune(sim, w, 'dmg', 8); pierce = Infinity; speed *= 1.3; r = tune(sim, w, 'r', 12); homing = false; cd = tune(sim, w, 'cd', 1.1); life = 1.6; }

    const targets = sim.nearestEnemies(p.x, p.y, 210, Math.max(1, count));
    if (!targets.length) { rt.cd = 0.15; return; }
    rt.spin = (rt.spin || 0) + 0.4;
    for (let i = 0; i < count; i++) {
      const tgt = targets[i % targets.length];
      let ang = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      if (evo === 'spirit_tempest') ang = rt.spin + (i * TAU) / 8;
      else if (i >= targets.length) ang += (i - targets.length + 1) * 0.18 * (i % 2 ? 1 : -1);
      sim.spawnBolt({
        x: p.x, y: p.y, ang, speed, dmg, pierce, r, homing, explode, life, target: homing ? tgt : null,
        color: evo === 'soul_lance' ? '#d6f7ff' : '#7ff0ff',
      });
    }
    rt.cd = cd * sim.mods.cooldown;
  },
};

// ---------------------------------------------------------------- Chain Lightning
function strikeChain(sim, w, first, chains, dmg, area) {
  const p = sim.player;
  const hit = new Set();
  const pts = [{ x: p.x, y: p.y }];
  let cur = first;
  for (let i = 0; i < chains && cur; i++) {
    hit.add(cur.id);
    pts.push({ x: cur.x, y: cur.y });
    sim.hurt(cur, dmg * Math.max(0.5, 1 - 0.05 * i));
    cur = sim.nearestEnemy(cur.x, cur.y, area, (e) => !hit.has(e.id));
  }
  sim.addFx({ kind: 'bolt', pts, ttl: 0.16, color: '#b8f2ff' });
}

const chainLightning = {
  update(sim, w, dt) {
    const { s, evo, rt } = w;
    const p = sim.player;
    const dmg = s.power * sim.dmgMult(w);
    const area = s.area * sim.mods.area;

    if (evo === 'static_storm') {
      rt.cd = (rt.cd ?? 0.2) - dt;
      if (rt.cd > 0) return;
      rt.cd = Math.max(0.1, 0.3 * (s.cooldown / 1.6) * sim.mods.cooldown); // floor after tree cooldown mods (B5)
      const strikes = tune(sim, w, 'strikes', 4);
      const radius = 110 + area * 0.8;
      const pool = sim.enemies.filter((e) => !e.dead && Math.hypot(e.x - p.x, e.y - p.y) < radius);
      for (let k = 0; k < strikes && pool.length; k++) {
        const e = pool.splice(sim.rng.int(pool.length), 1)[0];
        sim.hurt(e, dmg * tune(sim, w, 'dmg', 0.5));
        sim.addFx({ kind: 'bolt', pts: [{ x: e.x + sim.rng.range(-8, 8), y: e.y - 70 }, { x: e.x, y: e.y }], ttl: 0.12, color: '#b8f2ff' });
      }
      return;
    }

    if (evo === 'thunder_judgment') {
      rt.jCd = (rt.jCd ?? 1.5) - dt;
      if (rt.jCd <= 0) {
        rt.jCd = tune(sim, w, 'cd', 3);
        let n = 0;
        const cap = tune(sim, w, 'cap', 30);
        // Nearest first, on screen only (view half-height 180): never a far, off-screen enemy while a near one is skipped (B4).
        const near = [];
        for (const e of sim.enemies) {
          if (e.dead) continue;
          const dd = Math.hypot(e.x - p.x, e.y - p.y);
          if (dd <= 180) near.push({ e, dd });
        }
        near.sort((a, b) => a.dd - b.dd || a.e.id - b.e.id);
        for (const { e } of near) {
          if (n >= cap) break;
          n++;
          sim.hurt(e, dmg * tune(sim, w, 'dmg', 0.9));
          sim.addFx({ kind: 'bolt', pts: [{ x: e.x, y: e.y - 80 }, { x: e.x, y: e.y }], ttl: 0.2, color: '#b8f2ff' });
        }
      }
    }

    rt.cd = (rt.cd ?? 0.4) - dt;
    if (rt.cd > 0) return;
    const first = sim.nearestEnemy(p.x, p.y, 220);
    if (!first) { rt.cd = 0.15; return; }
    const chains = evo === 'thunder_judgment' ? tune(sim, w, 'chains', 9) : s.chains;
    strikeChain(sim, w, first, chains, dmg, area);
    rt.cd = Math.max(0.2, s.cooldown) * sim.mods.cooldown;
  },
};

// ---------------------------------------------------------------- Holy Orbit
const holyOrbit = {
  update(sim, w, dt) {
    const { s, evo, rt } = w;
    const p = sim.player;
    let count = s.count;
    let radius = s.radius * sim.mods.area;
    let spin = s.speed;
    const dmg = s.power * sim.dmgMult(w);
    if (evo === 'sanctum_halo') { count = Math.min(14, s.count * 2); radius *= 1.6; }
    if (evo === 'judgement_wheel') spin *= 1.8;
    const units = syncUnits(sim, w, 'orb', count, () => ({ r: 4, disabledT: 0, hidden: false }));
    rt.ang = (rt.ang || 0) + spin * dt;

    // Candle Wheel (Elias's ability): while a wheel stands the orb lights glide out and lock into sockets on its ring,
    // then glide back as it fades. Locked lights keep burning what touches them.
    const wheel = sim.zones.find((z) => z.wheel);
    let lock = 0;
    if (wheel) { const k = Math.min(1, wheel.age / 0.5, Math.max(0, wheel.ttl) / 0.5); lock = k * k * (3 - 2 * k); }
    rt.lock = lock;
    units.forEach((u, i) => {
      const a = rt.ang + (i * TAU) / count;
      u.x = p.x + Math.cos(a) * radius;
      u.y = p.y + Math.sin(a) * radius;
      if (lock > 0) {
        const sa = (i * TAU) / count - Math.PI / 2;
        u.x += (wheel.x + Math.cos(sa) * wheel.r - u.x) * lock;
        u.y += (wheel.y + Math.sin(sa) * wheel.r - u.y) * lock;
      }
      if (u.disabledT > 0) {
        u.disabledT -= dt;
        u.hidden = true;
        return;
      }
      u.hidden = false;
      for (const e of sim.enemies) {
        if (e.dead) continue;
        const dx = e.x - u.x;
        const dy = e.y - u.y;
        const rr = e.r + u.r + 1;
        if (dx * dx + dy * dy >= rr * rr) continue;
        if (evo === 'judgement_wheel') {
          for (const o of sim.enemies) {
            if (o.dead) continue;
            if (Math.hypot(o.x - u.x, o.y - u.y) < o.r + 34 && sim.canHit(o, 'wheelblast', 0.1)) sim.hurt(o, dmg * tune(sim, w, 'dmg', 1.8));
          }
          sim.addFx({ kind: 'ring', x: u.x, y: u.y, r: 34, ttl: 0.2, color: '#e8e0ff' });
          u.disabledT = tune(sim, w, 'rest', 1.0);
          break;
        }
        if (sim.canHit(e, `orb${i}`, 0.5)) sim.hurt(e, dmg);
      }
    });

    if (evo === 'sanctum_halo' && units.length) {
      rt.zCd = (rt.zCd ?? 1) - dt;
      if (rt.zCd <= 0) {
        rt.zCd = 1.5;
        const u = units[sim.rng.int(units.length)];
        sim.spawnZone({ x: u.x, y: u.y, r: 22, ttl: 4, dps: dmg, heal: 0.8, color: '#e8e0ff' });
      }
    }
  },
};

export const WEAPON_BEHAVIOURS = {
  ghost_wolves: ghostWolves,
  raven_flock: ravenFlock,
  spirit_bolts: spiritBolts,
  chain_lightning: chainLightning,
  holy_orbit: holyOrbit,
};
