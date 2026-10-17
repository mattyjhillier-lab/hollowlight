// Weapon behaviours. Each weapon exposes update(sim, w, dt).
// w = { id, ranks, evo, s (computed stats), rt (runtime scratch) }.
// Evolutions are handled inside each weapon by branching on w.evo.

import { BLEED_TIME, rateMult } from './cards.js';

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

// ---------------------------------------------------------------- Howling Legion: Echo Pack (W6)
// Prey the pack fells (wolf-tagged kills incl. bleed kills, never a boss, never an echo's own kill) rises as a pale echo
// wolf for Rend time x1.25. Echoes bite at 0.7x, never bleed, share the wolves' target claims, and are capped at Pack size.
// No RNG is drawn. Echoes are plain units (kind 'echo'); nothing else in the wolf code touches them.
function echoUpdate(sim, w, wolves, dmg, speed, biteGap, dt) {
  const { rt, s } = w;
  const list = rt.echoes || (rt.echoes = []);
  for (let i = list.length - 1; i >= 0; i--) if (list[i].dead) list.splice(i, 1);
  const life = BLEED_TIME * tune(sim, w, 'echoLife', 1.25);
  const cap = Math.max(1, s.count);
  for (const f of sim.fallen) {
    if (list.length >= cap) break;
    const u = sim.makeUnit(w, 'echo', { x: f.x, y: f.y, r: 4, rise: 0.35, life, maxLife: life, atkCd: 0, target: null, retarget: 0, faceX: 1, slot: list.length });
    list.push(u);
    sim.units.push(u);
    sim.pushEvent('echo');
  }
  sim.fallen.length = 0;
  const p = sim.player;
  const edmg = dmg * tune(sim, w, 'echoDmg', 0.7);
  for (const u of list) {
    u.life -= dt;
    if (u.life <= 0) { u.dead = true; continue; }
    if (u.rise > 0) { u.rise -= dt; continue; }
    u.atkCd -= dt;
    u.retarget -= dt;
    if (!u.target || u.target.dead || u.retarget <= 0) {
      const taken = new Set();
      for (const o of wolves) if (o.target && !o.target.dead) taken.add(o.target.id);
      for (const o of list) if (o !== u && o.target && !o.target.dead) taken.add(o.target.id);
      const near = (e) => Math.hypot(e.x - p.x, e.y - p.y) < 150;
      u.target = sim.nearestEnemy(u.x, u.y, 170, (e) => near(e) && !taken.has(e.id)) || sim.nearestEnemy(u.x, u.y, 170, near);
      u.retarget = 0.4;
    }
    const t = u.target;
    if (t) {
      const d = Math.hypot(t.x - u.x, t.y - u.y);
      if (d > t.r + u.r) moveToward(u, t.x, t.y, speed, dt);
      else if (u.atkCd <= 0) {
        u.atkCd = biteGap;
        const alive = !t.dead;
        sim.hurt(t, edmg);
        if (alive && t.dead) t.echoKill = true;
      }
    } else {
      moveToward(u, p.x + Math.cos((sim.time || 0) * 0.8 + u.slot * 2.1) * 30, p.y + Math.sin((sim.time || 0) * 0.8 + u.slot * 2.1) * 30, Math.max(speed, 110) * 1.2, dt);
    }
  }
  return list;
}

// ---------------------------------------------------------------- Ghost Wolves
const ghostWolves = {
  update(sim, w, dt) {
    const { s, evo, rt } = w;
    const p = sim.player;
    let count = s.count;
    if (evo === 'dire_alpha') count = 1;
    const units = syncUnits(sim, w, 'wolf', count, (i) => ({
      r: 4, atkCd: 0, target: null, retarget: 0, dash: 0, dashCd: 0.1 + i * 0.25, slot: i, hit: null, faceX: 1,
    }));

    const howl = sim.buffs.packHowl > 0 ? 2 : 1;
    let dmg = s.power * sim.dmgMult(w) * howl;
    let speed = s.speed * howl;
    let bleedDur = BLEED_TIME; // Rend (s.duration) is the potency; the time is fixed
    if (evo === 'phantom_stampede') { dmg *= tune(sim, w, 'dmg', 1.1); speed *= tune(sim, w, 'speed', 1.1); }
    if (evo === 'howling_legion') { bleedDur *= 1.3; dmg *= tune(sim, w, 'dmg', 1.4); } // W6 Echo Pack: no extra live wolves, the pack bites x1.4 (Alt A)
    if (evo === 'dire_alpha') { dmg *= tune(sim, w, 'dmg', 3.2); bleedDur *= 1.5; }
    const bleedDps = dmg * s.duration; // Rend: share of a bite per second
    const rate = rateMult(sim.data.weapons.ghost_wolves, 'speed', w.ranks.speed || 0); // W7rem: +4% bite rate per Wolf speed rank
    const biteGap = (evo === 'dire_alpha' ? tune(sim, w, 'biteGap', 0.45) : 0.6) / howl / rate;

    const echoes = evo === 'howling_legion' ? echoUpdate(sim, w, units, dmg, speed, biteGap, dt) : null;
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
        if (echoes) for (const o of echoes) if (o.target && !o.target.dead) taken.add(o.target.id);
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

// ---------------------------------------------------------------- Raven Flock (W8a: scouts)
// Each raven perches near the player, rests (Wingbeat), then swoops at a foe it spots within Watch of the player, pecks it
// PECKS times and flies back. Targets are claimed one raven per foe; when none is unclaimed the flock shares (a lone foe or
// the boss takes the whole flock). States: perch -> dive (swoop out) -> peck -> return -> perch. Wingbeat: swoops come
// 1.6 s / wingbeat apart and the flight speed rises 260 -> 320 px/s. No RNG is drawn.
const RAVEN_REST = 1.6;
const RAVEN_PECKS = 3;
const RAVEN_PECK_GAP = 0.15;
// Talon Mark (dive_bombers, W9): scouts pick the TOUGHEST unclaimed foe in Watch, climb above it for a 0.4 s shadow tell, drop once for
// `dive` x a peck (~4x) and MARK it (Sim.mark: +15% damage taken from all sources for 3 s, refresh only, shared x1.75 amp cap). No splash.
const raven = {
  claimed(units, self) {
    const c = new Set();
    for (const o of units) if (o !== self && (o.st === 'dive' || o.st === 'peck') && o.target && !o.target.dead) c.add(o.target.id);
    return c;
  },
  pick(sim, w, u, units, watch) {
    const p = sim.player;
    const claimed = raven.claimed(units, u);
    const toughest = w.evo === 'dive_bombers';
    if (toughest) return sim.toughestEnemy(p.x, p.y, watch, (e) => !claimed.has(e.id)) || sim.toughestEnemy(p.x, p.y, watch);
    return sim.nearestEnemy(p.x, p.y, watch, (e) => !claimed.has(e.id)) || sim.nearestEnemy(p.x, p.y, watch);
  },
};

const ravenFlock = {
  update(sim, w, dt) {
    const { s, evo, rt } = w;
    const p = sim.player;
    const dmg = s.power * sim.dmgMult(w);
    const watch = s.range * sim.mods.area;
    const wing = Math.max(0.2, s.speed);
    const rest = RAVEN_REST / wing;
    const flight = Math.min(320, 260 + 80 * (wing - 1));
    const units = syncUnits(sim, w, 'raven', s.count, (i) => ({
      r: 4, st: 'perch', rest: 0.3 + i * 0.35, target: null, pecks: 0, pt: 0, slot: i, faceX: 1,
    }));
    rt.ang = (rt.ang || 0) + 1.3 * dt;
    const n = units.length;

    units.forEach((u, i) => {
      u.slot = i;
      const a = rt.ang + (i * TAU) / n;
      const bob = Math.sin(sim.time * 5 + i * 1.7) * 2.5;
      const px = p.x + Math.cos(a) * 24;
      const py = p.y + Math.sin(a) * 18 - 8 + bob;

      if (u.st === 'perch') {
        u.x = px;
        u.y = py;
        u.rest -= dt;
        if (u.rest > 0) return;
        const t = raven.pick(sim, w, u, units, watch);
        if (!t) { u.rest = 0.25; return; }
        u.target = t;
        u.st = 'dive';
        u.tell = 0;
        return;
      }
      if (u.st === 'return') {
        if (moveToward(u, px, py, flight * 1.15, dt) < 6) { u.st = 'perch'; u.rest = rest; u.target = null; }
        return;
      }
      // dive / peck need a live target inside the (slightly stretched) watch; otherwise look for another or go home
      let t = u.target;
      if (!t || t.dead || Math.hypot(t.x - p.x, t.y - p.y) > watch * 1.35 + t.r) {
        t = raven.pick(sim, w, u, units, watch);
        if (t && Math.hypot(t.x - u.x, t.y - u.y) > 70 + t.r) t = null;
        u.target = t;
        if (!t) { u.st = 'return'; return; }
      }
      if (u.st === 'dive') {
        if (evo === 'dive_bombers') {
          const tell = tune(sim, w, 'tell', 0.4);
          u.tell = (u.tell || 0) + dt;
          u.tellK = Math.min(1, u.tell / tell); // renderer: the growing violet shadow on the target
          if (u.tell < tell) { moveToward(u, t.x, t.y - 22, flight, dt); return; } // climb above the foe
          if (moveToward(u, t.x, t.y, flight * tune(sim, w, 'strike', 1.6), dt) < t.r + u.r + 1) {
            sim.hurt(t, dmg * tune(sim, w, 'dive', 8));
            sim.mark(t);
            sim.addFx({ kind: 'ring', x: t.x, y: t.y, r: 16, ttl: 0.2, color: '#b79cff' });
            u.tellK = 0;
            u.st = 'return';
          }
          return;
        }
        if (moveToward(u, t.x, t.y, flight, dt) < t.r + u.r + 1) {
          u.st = 'peck';
          u.pecks = RAVEN_PECKS;
          u.pt = 0;
        }
        return;
      }
      // peck
      u.x += (t.x - u.x) * Math.min(1, 14 * dt);
      u.y += (t.y - 2 - u.y) * Math.min(1, 14 * dt);
      u.pt -= dt;
      if (u.pt > 0) return;
      u.pt = RAVEN_PECK_GAP;
      sim.hurt(t, dmg);
      u.pecks--;
      if (u.pecks <= 0) u.st = 'return';
    });

    if (evo === 'murder_storm') ravenWall(sim, w, dmg, dt);
    if (evo === 'spearhead') ravenWedge(sim, w, dmg, dt);
  },
};

// Wall of Wings (murder_storm, W9): the scout flock is unchanged; on top of it min(count, 12 - count) ring ravens (flock x2, cap 12)
// fly TWO counter-rotating rings around you: an inner ring at Watch x0.55 and an outer wall at Watch x0.7. Ring ravens peck what they
// touch at 0.7x; a non-boss foe they touch is frightened for 0.6 s (+0.04 s per Wingbeat rank, 0.6-0.8 s) and then cannot be frightened
// again for 1.5 s (W1a rules; never a boss). All tuning in evolutions.json; no RNG is drawn.
function ravenWall(sim, w, dmg, dt) {
  const { s, rt } = w;
  const p = sim.player;
  const ranks = w.ranks || {};
  const watch = s.range * sim.mods.area;
  const rIn = watch * tune(sim, w, 'inner', 0.55);
  const rOut = watch * tune(sim, w, 'outer', 0.7);
  const count = Math.max(0, Math.min(s.count, tune(sim, w, 'cap', 12) - s.count));
  const nIn = Math.ceil(count / 2);
  const list = rt.wall || (rt.wall = []);
  while (list.length > count) list.pop().dead = true;
  while (list.length < count) {
    const u = sim.makeUnit(w, 'raven', { r: 4, st: 'orbit', target: null, faceX: 1, wall: true, ring: 0 });
    list.push(u);
    sim.units.push(u);
  }
  const spin = tune(sim, w, 'spin', 2.4) * Math.max(0.2, s.speed);
  rt.wang = (rt.wang || 0) + spin * dt;
  rt.wallR = [rIn, rOut];
  const hit = dmg * tune(sim, w, 'peck', 0.7);
  const fdur = tune(sim, w, 'fear', 0.6) + tune(sim, w, 'fearPer', 0.04) * (ranks.speed || 0);
  const immune = tune(sim, w, 'immune', 1.5);
  const nOut = count - nIn;
  list.forEach((u, i) => {
    const outer = i >= nIn;
    const k = outer ? i - nIn : i;
    const a = (outer ? -rt.wang : rt.wang) + (k * TAU) / Math.max(1, outer ? nOut : nIn);
    const ring = outer ? rOut : rIn;
    u.ring = outer ? 1 : 0;
    u.x = p.x + Math.cos(a) * ring;
    u.y = p.y + Math.sin(a) * ring;
    u.faceX = Math.sin(a) * (outer ? -1 : 1) > 0 ? -1 : 1;
    for (const e of sim.enemies) {
      if (e.dead) continue;
      const dx = e.x - u.x;
      const dy = e.y - u.y;
      const rr = e.r + u.r + 1;
      if (dx * dx + dy * dy < rr * rr && sim.canHit(e, `wall${i}`, 0.55)) {
        sim.hurt(e, hit);
        if (!e.boss && !e.dead && sim.canHit(e, 'stormFear', fdur + immune)) e.fearT = Math.max(e.fearT, fdur);
      }
    }
  });
}

// Spearhead (spearhead, W9): the scout flock is UNCHANGED; ceil(count / 2) extra ravens (max 4) fly a wedge at the thickest crowd near you
// (centroid of the 10 nearest foes inside Watch + 60 px; needs 3+ foes, otherwise they ride beside your hero ring) and clear a lane by
// contact: 0.7x a peck, 5 px + foe radius, 0.8 s per-foe gate, no control, no targeting by toughness. Watch = how far they look and lead,
// Wingbeat = how fast the wedge sweeps side to side, Flock size = more wedge ravens, Peck power = lane damage. No RNG is drawn.
function ravenWedge(sim, w, dmg, dt) {
  const { s, rt } = w;
  const p = sim.player;
  const watch = s.range * sim.mods.area;
  const n = Math.min(tune(sim, w, 'max', 4), Math.ceil(s.count * tune(sim, w, 'extraK', 0.5)));
  const list = rt.wedge || (rt.wedge = []);
  while (list.length > n) list.pop().dead = true;
  while (list.length < n) {
    const u = sim.makeUnit(w, 'raven', { r: 4, st: 'wedge', target: null, faceX: 1, wedge: true });
    list.push(u);
    sim.units.push(u);
  }
  if (rt.hx === undefined) { rt.hx = 1; rt.hy = 0; rt.ph = 0; }
  const near = sim.nearestEnemies(p.x, p.y, watch + tune(sim, w, 'crowdPad', 60), tune(sim, w, 'crowdN', 10));
  let on = false;
  if (near.length >= tune(sim, w, 'crowdMin', 3)) {
    let cx = 0, cy = 0;
    for (const e of near) { cx += e.x; cy += e.y; }
    cx = cx / near.length - p.x;
    cy = cy / near.length - p.y;
    const d = Math.hypot(cx, cy);
    if (d > 12) {
      const k = Math.min(1, dt * 8);
      rt.hx += (cx / d - rt.hx) * k;
      rt.hy += (cy / d - rt.hy) * k;
      const m = Math.hypot(rt.hx, rt.hy) || 1;
      rt.hx /= m;
      rt.hy /= m;
      on = true;
    }
  }
  rt.wedgeOn = on;
  const lead = tune(sim, w, 'lead', 40) + tune(sim, w, 'leadK', 0.6) * watch;
  const spread = tune(sim, w, 'spread', 12) + tune(sim, w, 'spreadK', 0.06) * watch;
  rt.ph += Math.max(0.2, s.speed) * dt;
  const sweep = Math.sin(rt.ph) * tune(sim, w, 'sweep', 22);
  const nx = -rt.hy;
  const ny = rt.hx;
  const hit = dmg * tune(sim, w, 'dmg', 0.7);
  const gate = tune(sim, w, 'gate', 0.8);
  const cr = tune(sim, w, 'cr', 5);
  list.forEach((u, i) => {
    const row = Math.ceil(i / 2);
    const side = i === 0 ? 0 : i % 2 ? 1 : -1;
    let tx, ty;
    if (on) {
      tx = p.x + rt.hx * (lead - row * spread * 0.8) + nx * (side * row * spread + sweep);
      ty = p.y + rt.hy * (lead - row * spread * 0.8) + ny * (side * row * spread + sweep);
    } else {
      const a = (rt.ang || 0) + (i * TAU) / Math.max(1, n);
      tx = p.x + Math.cos(a) * 44;
      ty = p.y + Math.sin(a) * 44;
    }
    moveToward(u, tx, ty, on ? 360 : 300, dt);
    if (!on) return;
    for (const e of sim.enemies) {
      if (e.dead) continue;
      const rr = e.r + cr;
      const dx = e.x - u.x;
      const dy = e.y - u.y;
      if (dx * dx + dy * dy < rr * rr && sim.canHit(e, `vg${i}`, gate)) sim.hurt(e, hit);
    }
  });
}

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
// W4 guard contraction: when a foe's EDGE distance to Elias stays < 8 px for 0.2 s the ring closes to 14 px (0.25 s), holds
// >= 0.8 s once closed, then opens over 0.4 s. The Candle Wheel wins while it stands (no contraction). orbitRadius() is the
// one place the ring radius is decided, so Sanctum Halo and Judgement Wheel inherit it.
export const GUARD = { edge: 8, touch: 0.2, to: 14, close: 0.25, hold: 0.8, open: 0.4, dmg: 0.3 }; // dmg: contracted-ring hit damage x (scaled in by the closing), plus one foe per light per gap
const smooth = (k) => k * k * (3 - 2 * k);
export function orbitRadius(sim, rt, dt, radius, suppressed) {
  const p = sim.player;
  let touching = false;
  if (!suppressed) {
    for (const e of sim.enemies) {
      if (e.dead) continue;
      const lim = e.r + p.r + GUARD.edge;
      const dx = e.x - p.x, dy = e.y - p.y;
      if (dx * dx + dy * dy < lim * lim) { touching = true; break; }
    }
  }
  rt.gTouch = touching ? (rt.gTouch || 0) + dt : 0;
  const was = rt.gHold > 0;
  if (suppressed) rt.gHold = 0;
  else if (rt.gTouch >= GUARD.touch) rt.gHold = GUARD.close + GUARD.hold; // re-armed while the foe stays
  else if (rt.gHold > 0) rt.gHold = Math.max(0, rt.gHold - dt);
  if (!was && rt.gHold > 0) sim.addFx({ kind: 'ring', x: p.x, y: p.y, r: 22, ttl: 0.2, color: '#e8e0ff' });
  const k0 = rt.gK || 0;
  rt.gK = rt.gHold > 0 ? Math.min(1, k0 + dt / GUARD.close) : Math.max(0, k0 - dt / GUARD.open);
  return radius + (Math.min(radius, GUARD.to) - radius) * smooth(rt.gK);
}

// Holy Orbit hit gap per light per foe: 0.5 s, shortened by the Orbit speed rate (+5% hits per rank).
export const ORBIT_GAP = 0.5;

const holyOrbit = {
  update(sim, w, dt) {
    const { s, evo, rt } = w;
    const p = sim.player;
    let count = s.count;
    let radius = s.radius * sim.mods.area;
    let spin = s.speed;
    const dmg = s.power * sim.dmgMult(w);
    let contact = 1;
    if (evo === 'sanctum_halo') { // W5 Consecrated Ring: lights x2 (cap 12), ring = Orbit size x1.5, soft contact; the ground inside burns
      count = Math.min(12, s.count * 2);
      radius *= tune(sim, w, 'ring', 1.5);
      contact = tune(sim, w, 'contact', 0.6);
    }
    if (evo === 'judgement_wheel') spin *= tune(sim, w, 'spin', 1.8);
    const units = syncUnits(sim, w, 'orb', count, () => ({ r: 4, disabledT: 0, hidden: false }));
    rt.ang = (rt.ang || 0) + spin * dt;

    // Candle Wheel (Elias's ability): while a wheel stands the orb lights glide out and lock into sockets on its ring,
    // then glide back as it fades. Locked lights keep burning what touches them (but never apply Burn: the ability stays modest).
    const wheel = sim.zones.find((z) => z.wheel);
    let lock = 0;
    if (wheel) { const k = Math.min(1, wheel.age / 0.5, Math.max(0, wheel.ttl) / 0.5); lock = k * k * (3 - 2 * k); }
    rt.lock = lock;
    radius = orbitRadius(sim, rt, dt, radius, !!wheel);
    const gap = ORBIT_GAP / rateMult(sim.data.weapons.holy_orbit, 'speed', w.ranks.speed || 0);
    const burnOk = !wheel;
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
      u.guardCd = Math.max(0, (u.guardCd || 0) - dt);
      if (u.guardCd > 0 && rt.gK > 0) return;
      for (const e of sim.enemies) {
        if (e.dead) continue;
        const dx = e.x - u.x;
        const dy = e.y - u.y;
        const rr = e.r + u.r + 1;
        if (dx * dx + dy * dy >= rr * rr) continue;
        if (evo === 'judgement_wheel') {
          // W6 Bursting Lights: blast 34 px + 3 px per Orbit size rank, one blast per foe per 0.1 s, applies Burn (never from the Candle Wheel lock)
          const br = tune(sim, w, 'blast', 34) + tune(sim, w, 'blastPer', 3) * (w.ranks.radius || 0);
          // 'boss' = blast damage x on bosses (Alt 1, locked); 'maxHits' foes per blast, nearest first (off, probe only)
          const maxHits = tune(sim, w, 'maxHits', 0), bossX = tune(sim, w, 'boss', 1.7);
          let hit = sim.enemies.filter((o) => !o.dead && Math.hypot(o.x - u.x, o.y - u.y) < o.r + br);
          if (maxHits > 0 && hit.length > maxHits) hit = hit.sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y)).slice(0, maxHits);
          for (const o of hit) {
            if (!sim.canHit(o, 'wheelblast', 0.1)) continue;
            const dealt = sim.hurt(o, dmg * tune(sim, w, 'dmg', 1.0) * (o.boss ? bossX : 1));
            if (burnOk) sim.burn(o, dealt);
          }
          sim.addFx({ kind: 'ring', x: u.x, y: u.y, r: br, ttl: 0.2, color: '#c79bff' });
          sim.addFx({ kind: 'ring', x: u.x, y: u.y, r: br + 3, ttl: 0.14, color: '#ffd98a' }); // gold rim on the blast only
          u.disabledT = tune(sim, w, 'rest', 1.3);
          break;
        }
        if (sim.canHit(e, `orb${i}`, gap)) {
          const dealt = sim.hurt(e, dmg * contact * (1 - (1 - GUARD.dmg) * (rt.gK || 0))); // contracted ring is a guard, not a grinder
          if (burnOk) sim.burn(e, dealt);
          if (rt.gK > 0) { u.guardCd = gap; break; } // contracted: one foe per light per gap (a guard, not a crowd grinder)
        }
      }
    });

    // Sanctum Halo ground: the disc inside the ring (it contracts WITH the ring, foes' bodies count) sets up to 20 foes alight
    // every tick. Burn INSTEAD of separate zone damage (no double DoT) and no heal until W5b. Not while the Candle Wheel stands.
    if (evo === 'sanctum_halo') {
      rt.ground = wheel ? null : { r: radius };
      rt.zCd = (rt.zCd ?? 0) - dt;
      if (rt.zCd <= 0 && !wheel) {
        rt.zCd = tune(sim, w, 'tick', 0.5);
        const hit = dmg * tune(sim, w, 'ground', 3);
        let n = 0;
        const cap = tune(sim, w, 'max', 20);
        for (const e of sim.enemies) {
          if (e.dead) continue;
          const dx = e.x - p.x, dy = e.y - p.y, rr = radius + e.r;
          if (dx * dx + dy * dy >= rr * rr) continue;
          sim.burn(e, hit);
          if (++n >= cap) break;
        }
      }
    } else rt.ground = null;
  },
};

export const WEAPON_BEHAVIOURS = {
  ghost_wolves: ghostWolves,
  raven_flock: ravenFlock,
  spirit_bolts: spiritBolts,
  chain_lightning: chainLightning,
  holy_orbit: holyOrbit,
};
