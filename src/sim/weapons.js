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

// ---------------------------------------------------------------- Lightfoot Pack: Light Trails (W7b, id phantom_stampede)
// Each wolf drops a trail point every `space` px it moves; a point lives ttl = 1.2 + 0.22 x Wolf speed rank s and is half-width 5 + 0.8 x s px.
// A foe whose centre is nearer than its radius + half-width to any live point takes 0.24 x bite and Rend bleed (one instance, strongest wins),
// at most once per 0.4 s per foe (one gate shared by every point, so overlapping trails never stack). Control is never applied (bosses take damage only).
// Live points are capped (oldest dropped). Hit test: 24 px spatial hash rebuilt per step. No RNG is drawn; order follows array order, so it is deterministic.
const TRAIL_CELL = 24;
function trailUpdate(sim, w, units, dmg, bleedDps, bleedDur, dt) {
  const { rt, ranks } = w;
  const list = rt.trail || (rt.trail = []);
  const ttl = tune(sim, w, 'ttl0', 1.2) + tune(sim, w, 'ttlPer', 0.22) * (ranks.speed || 0);
  const hw = tune(sim, w, 'hw0', 5) + tune(sim, w, 'hwPer', 0.8) * (ranks.speed || 0);
  const space = tune(sim, w, 'space', 7);
  let k = 0;
  for (let i = 0; i < list.length; i++) { const q = list[i]; q.t -= dt; if (q.t > 0) list[k++] = q; }
  list.length = k;
  for (const u of units) {
    if (u.dead) continue;
    if (u.lx === undefined) { u.lx = u.x; u.ly = u.y; continue; }
    if (Math.hypot(u.x - u.lx, u.y - u.ly) >= space) { list.push({ x: u.x, y: u.y, t: ttl, l: ttl, hw, id: u.id }); u.lx = u.x; u.ly = u.y; }
  }
  const cap = tune(sim, w, 'cap', 360);
  if (list.length > cap) list.splice(0, list.length - cap);
  if (!list.length) return;
  const grid = new Map();
  for (const q of list) {
    const key = Math.floor(q.x / TRAIL_CELL) * 10007 + Math.floor(q.y / TRAIL_CELL);
    const b = grid.get(key);
    if (b) b.push(q); else grid.set(key, [q]);
  }
  // Flow v2 (E2): fewer wolves lay fewer, thinner trails, so Pack size still counts for Lightfoot Pack (full strength at max Pack size).
  const cs = sim.data.weapons[w.id].stats.count;
  const packK = Math.min(1, w.s.count / (cs.base + cs.perRank * sim.balance.maxRank)) ** tune(sim, w, 'trailPack', 1.5);
  const hit = dmg * tune(sim, w, 'trailHit', 0.16) * packK;
  const gate = tune(sim, w, 'gate', 0.4);
  for (const e of sim.enemies) {
    if (e.dead) continue;
    const cx = Math.floor(e.x / TRAIL_CELL);
    const cy = Math.floor(e.y / TRAIL_CELL);
    let on = false;
    for (let ix = cx - 1; ix <= cx + 1 && !on; ix++) for (let iy = cy - 1; iy <= cy + 1 && !on; iy++) {
      const cell = grid.get(ix * 10007 + iy);
      if (!cell) continue;
      for (const q of cell) { const rr = e.r + q.hw; if ((e.x - q.x) ** 2 + (e.y - q.y) ** 2 < rr * rr) { on = true; break; } }
    }
    if (on && sim.canHit(e, 'trail', gate)) { sim.hurt(e, hit); sim.bleed(e, bleedDps, bleedDur); }
  }
}

// Wolf target pick (spread rule, LOCKED: the pack hunts DIFFERENT foes). Candidates are foes within WOLF_LEASH of the hero (loot and gems stay
// in reach); each wolf takes the unclaimed one with the best score (distance from the wolf + half its distance from the hero, so near-hero foes win
// and a far rooted shooter or a tank across the field does not drag the pack away). Only when every foe in WOLF_LEASH is claimed does it widen to
// WOLF_WIDE; only when nothing at all is unclaimed does a wolf SHARE, and then it joins the least-claimed foe (pack spreads over few foes; a lone
// boss still takes the whole pack). A target that wanders past WOLF_DROP of the hero is dropped at once.
const WOLF_LEASH = 150, WOLF_WIDE = 185, WOLF_DROP = 200;
function wolfPick(sim, p, u, units, echoes) {
  const claims = new Map();
  for (const o of units) if (o !== u && o.target && !o.target.dead) claims.set(o.target.id, (claims.get(o.target.id) || 0) + 1);
  if (echoes) for (const o of echoes) if (o.target && !o.target.dead) claims.set(o.target.id, (claims.get(o.target.id) || 0) + 1);
  let best = null, bestS = Infinity, share = null, shareC = Infinity, shareS = Infinity;
  for (const e of sim.enemies) {
    if (e.dead) continue;
    const dp = Math.hypot(e.x - p.x, e.y - p.y);
    if (dp >= WOLF_WIDE) continue;
    const c = claims.get(e.id) || 0;
    const sc = Math.hypot(e.x - u.x, e.y - u.y) + 1.0 * dp + (dp >= WOLF_LEASH ? 400 : 0); // wide ring only after the whole leash is claimed
    if (c === 0) { if (sc < bestS) { bestS = sc; best = e; } }
    else if (c < shareC || (c === shareC && sc < shareS)) { shareC = c; shareS = sc; share = e; }
  }
  return best || share;
}

// ---------------------------------------------------------------- Ghost Wolves
const ghostWolves = {
  update(sim, w, dt) {
    const { s, evo, rt } = w;
    const p = sim.player;
    let count = s.count;
    if (evo === 'dire_alpha') count = 1 + Math.max(0, Math.round(tune(sim, w, 'shades', 2))); // Shades: unit 0 is the Alpha, the rest are small ghost shades // The Alpha: one great wolf; Pack size makes it BIGGER (size + sweep), not more bodies
    const packRank = w.ranks.count || 0;
    const units = syncUnits(sim, w, 'wolf', count, (i) => ({
      r: 4, atkCd: 0, target: null, retarget: 0, slot: i, hit: null, faceX: 1,
    }));

    let dmg = s.power * sim.dmgMult(w);
    let speed = s.speed;
    let bleedDur = BLEED_TIME; // Rend (s.duration) is the potency; the time is fixed
    if (evo === 'phantom_stampede') speed *= tune(sim, w, 'speed', 1.1); // Light Trails: fast wolves, bite code unchanged
    if (evo === 'howling_legion') { bleedDur *= 1.3; dmg *= tune(sim, w, 'dmg', 1.4); } // W6 Echo Pack: no extra live wolves, the pack bites x1.4 (Alt A)
    if (evo === 'dire_alpha') bleedDur *= 1.5;
    // The Alpha (W7c): primary bite on its prey 'dmg' x bite, lighter cleave 'side' x bite on everything else within reach; Rend bleeds each hit at that hit's own damage
    // packPow: the alpha is the pack gathered into one: its bites grow with Pack size as (count / max count)^packPow (1.0 at max Pack size, weaker while the pack is small)
    const cs = sim.data.weapons.ghost_wolves.stats.count;
    const packF = evo === 'dire_alpha' ? (s.count / (cs.base + cs.perRank * sim.balance.maxRank)) ** tune(sim, w, 'packPow', 1.25) : 1;
    const alphaHit = evo === 'dire_alpha' ? dmg * tune(sim, w, 'dmg', 3.4) * packF : 0;
    const alphaSide = evo === 'dire_alpha' ? dmg * tune(sim, w, 'side', 0.6) * packF : 0;
    const bleedDps = dmg * s.duration; // Rend: share of a bite per second
    const rate = rateMult(sim.data.weapons.ghost_wolves, 'speed', w.ranks.speed || 0); // W7rem: +4% bite rate per Wolf speed rank
    const biteGap = (evo === 'dire_alpha' ? tune(sim, w, 'biteGap', 0.45) : 0.6) / rate;

    const echoes = evo === 'howling_legion' ? echoUpdate(sim, w, units, dmg, speed, biteGap, dt) : null;
    rt.ang = (rt.ang || 0) + 0.8 * dt;

    for (const u of units) {
      u.shade = evo === 'dire_alpha' && u.slot > 0;
      u.r = evo === 'dire_alpha' && !u.shade ? 11 + tune(sim, w, 'sizePer', 1) * packRank : 4;
      u.atkCd -= dt;
      u.retarget -= dt;

      if (!u.target || u.target.dead || u.retarget <= 0 || Math.hypot(u.target.x - p.x, u.target.y - p.y) > WOLF_DROP) {
        u.target = wolfPick(sim, p, u, units, echoes);
        u.retarget = 0.4;
      }
      const t = u.target;
      if (t) {
        const dx = t.x - u.x;
        const dy = t.y - u.y;
        const d = Math.hypot(dx, dy) || 0.001;
        if (d > t.r + u.r) {
          moveToward(u, t.x, t.y, speed, dt);
        } else if (u.atkCd <= 0) {
          u.atkCd = biteGap;
          if (u.shade) { // a shade: one lighter bite on the prey it keeps hunting
            const sh = dmg * tune(sim, w, 'shade', 2.0) * packF;
            sim.hurt(t, sh);
            sim.bleed(t, sh * s.duration, bleedDur);
          } else if (evo === 'dire_alpha') {
            const reach = tune(sim, w, 'cleave', 22) + tune(sim, w, 'cleavePer', 2) * packRank;
            sim.hurt(t, alphaHit);
            sim.bleed(t, alphaHit * s.duration, bleedDur);
            for (const e of sim.enemies) {
              if (e.dead || e === t) continue;
              if (Math.hypot(e.x - u.x, e.y - u.y) < e.r + reach) {
                sim.hurt(e, alphaSide);
                sim.bleed(e, alphaSide * s.duration, bleedDur);
              }
            }
            sim.addFx({ kind: 'alphaarc', x: u.x, y: u.y, r: u.r + reach, a: Math.atan2(dy, dx), ttl: 0.18, color: '#9fd8ff' });
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
    if (evo === 'phantom_stampede') trailUpdate(sim, w, units, dmg, bleedDps, bleedDur, dt);
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
// W10b Spirit Tempest ('Burst and Seek'): a ring of glyphs blooms from the hero, then each one is given its OWN prey (claim set per volley;
// the set is only shared when there are fewer foes than glyphs). Called by Sim.updateProjectiles when a glyph's burst timer runs out.
export function boltSeek(sim, b) {
  const v = b.vol;
  if (!v) { b.homing = true; return; }
  if (!v.assign) {
    v.assign = new Map();
    const p = sim.player;
    const cands = sim.nearestEnemies(p.x, p.y, v.range, Math.max(8, v.bolts.length));
    let claimed = new Set();
    for (const g of v.bolts) {
      if (g.dead || !cands.length) continue;
      if (claimed.size >= cands.length) claimed = new Set(); // fewer foes than glyphs: share, evenly
      let best = null, bd = Infinity;
      for (const e of cands) {
        if (e.dead || claimed.has(e.id)) continue;
        const d = (e.x - g.x) ** 2 + (e.y - g.y) ** 2;
        if (d < bd) { bd = d; best = e; }
      }
      if (best) { claimed.add(best.id); v.assign.set(g.id, best); }
    }
  }
  b.target = v.assign.get(b.id) || null;
  b.homing = true;
}
// A seeking glyph whose prey died takes the nearest foe that no other glyph of its volley is chasing (else the nearest).
export function boltRetarget(sim, b) {
  const v = b.vol;
  if (v) {
    const taken = new Set();
    for (const g of v.bolts) if (!g.dead && g !== b && g.target && !g.target.dead) taken.add(g.target.id);
    const e = sim.nearestEnemy(b.x, b.y, 180, (x) => !taken.has(x.id));
    if (e) return e;
  }
  return sim.nearestEnemy(b.x, b.y, 180);
}

// W10c Soul Lance ('Lances of Light'): one pale lance (1 + floor(Bolt count / 2), max 3, in a 12 degree fan) is thrown through the DENSEST line of foes
// among the nearest 5; Bolt count raises the lance damage (3.5x + 0.6x per count rank), Pierce widens the lance (+2 px per rank), Swiftness quickens
// the volley (like the base) and the lance leaves a glowing script line that burns what stands on it (0.25x of the lance per second for 1.2 s).
function lanceLines(sim, w, dt) {
  const L = w.rt.lines;
  if (!L || !L.length) return;
  const T = 0.25;
  let tick = false;
  for (const ln of L) {
    if (ln.len < ln.max) ln.len = Math.min(ln.max, ln.len + ln.v * dt); else ln.age += dt;
    ln.tick -= dt;
    if (ln.tick <= 0) tick = true;
  }
  if (tick) { // one burn per foe per tick, whatever number of lines it stands on (the strongest line counts: lines never stack)
    const burn = new Map();
    for (const ln of L) {
      ln.tick = ln.tick <= 0 ? T : ln.tick;
      const dx = Math.cos(ln.ang), dy = Math.sin(ln.ang);
      for (const e of sim.enemies) {
        if (e.dead) continue;
        const rx = e.x - ln.x, ry = e.y - ln.y;
        const along = rx * dx + ry * dy;
        if (along < -e.r || along > ln.len + e.r || Math.abs(rx * dy - ry * dx) > ln.w + e.r) continue;
        if (!(burn.get(e) >= ln.dps)) burn.set(e, ln.dps);
      }
    }
    for (const [e, dps] of burn) sim.hurt(e, dps * T, { silent: true });
  }
  w.rt.lines = L.filter((ln) => ln.age < ln.ttl);
}
function lanceFire(sim, w, rs) {
  const { s, rt } = w;
  const p = sim.player;
  const sdef = sim.data.weapons.spirit_bolts;
  const range = tune(sim, w, 'range', 300);
  const width = tune(sim, w, 'r', 1) + tune(sim, w, 'rPer', 2) * (w.ranks.pierce || 0);
  const cand = sim.nearestEnemies(p.x, p.y, 210, tune(sim, w, 'cand', 5));
  if (!cand.length) { rt.cd = 0.15; return; }
  // densest line: for each candidate direction count the foes the lance would cross; ties go to the nearer candidate
  let bestAng = 0, bestScore = -1;
  for (const c of cand) {
    const a = Math.atan2(c.y - p.y, c.x - p.x), dx = Math.cos(a), dy = Math.sin(a);
    let score = 0;
    for (const e of sim.enemies) {
      if (e.dead) continue;
      const rx = e.x - p.x, ry = e.y - p.y, along = rx * dx + ry * dy;
      if (along > 0 && along < range && Math.abs(rx * dy - ry * dx) < width + e.r) score++;
    }
    if (score > bestScore) { bestScore = score; bestAng = a; }
  }
  const n = Math.min(tune(sim, w, 'max', 3), 1 + Math.floor((w.ranks.count || 0) / 2)); // lances = 1 + floor(Bolt count rank / 2): 1 at rank 0-1, 2 at 2-3, 3 at 4-5
  const fan = (tune(sim, w, 'fan', 12) * Math.PI) / 180;
  const dmg = s.power * sim.dmgMult(w) * (tune(sim, w, 'dmg', 2.0) + tune(sim, w, 'dmgPer', 0.07) * (w.ranks.count || 0));
  const speed = s.speed * tune(sim, w, 'speedK', 1.3);
  rt.lines = rt.lines || [];
  for (let i = 0; i < n; i++) {
    const ang = bestAng + (n > 1 ? (i - (n - 1) / 2) * (fan / (n - 1)) : 0);
    sim.spawnBolt({ x: p.x, y: p.y, ang, speed, dmg, pierce: Infinity, r: width, homing: false, explode: false, life: range / speed, turn: 0, target: null, color: '#d6f7ff', evo: 'soul_lance', lance: true });
    if (rt.lines.length < 12) rt.lines.push({ x: p.x, y: p.y, ang, len: 0, max: range, v: speed, age: 0, ttl: tune(sim, w, 'lineTime', 1.2), w: width, dps: dmg * tune(sim, w, 'line', 0.25), tick: 0.25 });
  }
  rt.cd = (tune(sim, w, 'cd', 0.8) / rateMult(sdef, 'speed', rs)) * sim.mods.cooldown;
}

// W10d Returning Pages: a glyph flies OUT through a line of foes (steering lightly until its first hit), turns at the end of its flight (130 px + 0.7 px per
// Swiftness speed point, or when its pierce is spent), then flies HOME to the hero through FRESH foes (a foe is hit at most once per throw) and is caught.
// Called by Sim.updateProjectiles for every glyph flagged `pages`.
export function pagesStep(sim, b, dt) {
  const p = sim.player;
  b.life -= dt;
  if (b.life <= 0) { b.dead = true; return; }
  const v = b.speed;
  if (b.back) {
    const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy);
    if (d < b.catchR) { b.dead = true; if (sim.fx.length < 48) sim.addFx({ kind: 'ring', x: p.x, y: p.y, r: 9, ttl: 0.15, color: '#e8f4ff' }); return; } // caught: a small page-flick sparkle
    const st = Math.min(d, v * dt);
    b.x += (dx / d) * st; b.y += (dy / d) * st; b.ang = Math.atan2(dy, dx);
  } else {
    if (b.target && !b.target.dead && b.hit.size === 0) {
      let df = Math.atan2(b.target.y - b.y, b.target.x - b.x) - b.ang;
      while (df > Math.PI) df -= TAU;
      while (df < -Math.PI) df += TAU;
      b.ang += Math.max(-b.steer * dt, Math.min(b.steer * dt, df));
    }
    b.x += Math.cos(b.ang) * v * dt; b.y += Math.sin(b.ang) * v * dt; b.go += v * dt;
    if (b.go >= b.outLen || b.left <= 0) { b.back = true; b.left = b.per; }
  }
  if (b.left <= 0) return;
  sim._src = b.src || null;
  for (const e of sim.enemies) {
    if (e.dead || b.hit.has(e.id)) continue;
    const dx = e.x - b.x, dy = e.y - b.y, rr = e.r + b.r;
    if (dx * dx + dy * dy < rr * rr) { sim.hurt(e, b.dmg); b.hit.add(e.id); if (--b.left <= 0) break; }
  }
  sim._src = null;
}

const spiritBolts = {
  update(sim, w, dt) {
    const { s, evo, rt } = w;
    const p = sim.player;
    if (evo === 'soul_lance') lanceLines(sim, w, dt);
    rt.cd = (rt.cd ?? 0.3) - dt;
    if (rt.cd > 0) return;
    if (evo === 'soul_lance') return lanceFire(sim, w, w.ranks.speed || 0);

    // W10a: Swiftness = bolt speed + turn rate + a slightly shorter volley gap (1.1 s -> 1.0 s at rank 5)
    const sdef = sim.data.weapons.spirit_bolts;
    const rs = w.ranks.speed || 0;
    const turn = (sdef.stats.speed.turn0 ?? 5) + (sdef.stats.speed.turnPer ?? 0.6) * rs;
    let count = s.count;
    let cd = 1.1 / rateMult(sdef, 'speed', rs);
    let speed = s.speed;
    let dmg = s.power * sim.dmgMult(w);
    let pierce = s.pierce;
    let r = 3;
    let homing = true;
    let explode = false;
    let life = 2.4;
    if (evo === 'returning_pages') {
      // glyphs out and home again: 1 + Pierce foes per leg, 1.75x a bolt per hit, volley gap as the base (Swiftness shortens it)
      dmg *= tune(sim, w, 'dmg', 1.75);
    }
    if (evo === 'spirit_tempest') {
      // Burst and Seek: eight glyphs (ring), each re-homes to its own foe; blast only on a hit; Swiftness shortens the gap 0.02 s per rank
      count = 8; cd = tune(sim, w, 'cd', 0.85) + tune(sim, w, 'cdPer', 0.02) * (sim.data.balance.maxRank - rs);
      speed *= tune(sim, w, 'speedK', 1.4); explode = true; dmg *= tune(sim, w, 'dmg', 1);
    }

    const targets = sim.nearestEnemies(p.x, p.y, 210, Math.max(1, count));
    if (!targets.length) { rt.cd = 0.15; return; }
    rt.spin = (rt.spin || 0) + 0.4;
    const vol = evo === 'spirit_tempest' ? { bolts: [], assign: null, range: 240 } : null;
    if (vol && sim.fx.length < 48) sim.addFx({ kind: 'ring', x: p.x, y: p.y, r: 46, ttl: 0.24, color: '#7ff0ff' }); // the ring blooms from the hero
    for (let i = 0; i < count; i++) {
      const tgt = targets[i % targets.length];
      let ang = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      if (evo === 'spirit_tempest') ang = rt.spin + (i * TAU) / 8;
      else if (i >= targets.length) ang += (i - targets.length + 1) * 0.18 * (i % 2 ? 1 : -1);
      if (evo === 'returning_pages') {
        sim.spawnBolt({
          x: p.x, y: p.y, ang, speed: speed * tune(sim, w, 'speedK', 1.3), dmg, pierce: 0, r: tune(sim, w, 'hr', 9), homing: false, explode: false, life: tune(sim, w, 'life', 4), turn, target: tgt, color: '#7ff0ff',
          evo, pages: true, back: false, go: 0, steer: tune(sim, w, 'steer', 3), per: 1 + s.pierce, left: 1 + s.pierce,
          outLen: tune(sim, w, 'out0', 130) + tune(sim, w, 'outK', 0.7) * (s.speed - 150), catchR: tune(sim, w, 'catch', 8),
        });
        continue;
      }
      sim.spawnBolt({
        x: p.x, y: p.y, ang, speed, dmg, pierce, r, homing: vol ? false : homing, explode, life, turn, target: homing && !vol ? tgt : null,
        color: '#7ff0ff',
        ...(vol ? { vol, seek: tune(sim, w, 'burst', 0.22), evo, blast: tune(sim, w, 'blast', 0.12), blastR: tune(sim, w, 'blastR', 22), blastEach: tune(sim, w, 'each', 1) === 1 } : {}),
      });
      if (vol) vol.bolts.push(sim.projectiles[sim.projectiles.length - 1]);
    }
    rt.cd = cd * sim.mods.cooldown;
  },
};

// ---------------------------------------------------------------- Chain Lightning
// W11a: the first foe takes 1.5x; every jump after it loses 5% less per Arc rank (5% at rank 0, 0% at rank 5), floor 0.5x.
export function chainDecay(sim, w) {
  const a = sim.data.weapons.chain_lightning.stats.area;
  return Math.max(0, (a.decay0 ?? 0.05) - (a.decayPer ?? 0.01) * (w.ranks.area || 0));
}
// RT2 (boss threat pass): lightning grounds through a boss's trunk: every Chain strike on a boss (any form) deals area.boss x (trash clear unchanged).
const chainBoss = (sim, e) => (e.boss ? sim.data.weapons.chain_lightning.stats.area.boss ?? 1 : 1);
function strikeChain(sim, w, first, chains, dmg, area) {
  const p = sim.player;
  const decay = chainDecay(sim, w), firstMult = sim.data.weapons.chain_lightning.stats.area.first ?? 1.5;
  const hit = new Set();
  const pts = [{ x: p.x, y: p.y }];
  let cur = first;
  for (let i = 0; i < chains && cur; i++) {
    hit.add(cur.id);
    pts.push({ x: cur.x, y: cur.y });
    sim.hurt(cur, dmg * (i === 0 ? firstMult : Math.max(0.5, 1 - decay * i)) * chainBoss(sim, cur));
    cur = sim.nearestEnemy(cur.x, cur.y, area, (e) => !hit.has(e.id));
  }
  sim.addFx({ kind: 'bolt', pts, ttl: 0.16, color: '#b8f2ff' });
}

export const JUDGE_R = 180; // Thunder Judgment smite radius (px); fits inside the 640x360 view (half-height 180)
const chainLightning = {
  update(sim, w, dt) {
    const { s, evo, rt } = w;
    const p = sim.player;
    const dmg = s.power * sim.dmgMult(w);
    const area = s.area * sim.mods.area;

    if (evo === 'static_storm') {
      // W11c Living Field: a tick of 3 + floor(Chains / 2) strikes (max 5) at 0.42x on foes inside 110 + 0.8 x Arc, preferring foes
      // not struck in the last 0.5 s (a repeat only when nothing fresh is left). Tick floor 0.1 s AFTER tree cooldown mods (B5).
      const radius = 110 + area * 0.8;
      rt.fieldR = radius;
      rt.cd = (rt.cd ?? 0.2) - dt;
      if (rt.cd > 0) return;
      rt.cd = Math.max(0.1, 0.3 * (s.cooldown / 1.6) * sim.mods.cooldown);
      const strikes = Math.min(tune(sim, w, 'cap', 5), tune(sim, w, 'strikes', 3) + Math.floor(s.chains / 2));
      const gap = tune(sim, w, 'gap', 0.5);
      const fresh = [], stale = [];
      for (const e of sim.enemies) {
        if (e.dead || Math.hypot(e.x - p.x, e.y - p.y) >= radius) continue;
        (sim.time - (e.stormAt ?? -9) >= gap ? fresh : stale).push(e);
      }
      for (let k = 0; k < strikes && (fresh.length || stale.length); k++) {
        const list = fresh.length ? fresh : stale;
        const e = list.splice(sim.rng.int(list.length), 1)[0];
        e.stormAt = sim.time;
        sim.hurt(e, dmg * tune(sim, w, 'dmg', 0.47) * chainBoss(sim, e));
        sim.addFx({ kind: 'bolt', field: true, pts: [{ x: e.x + sim.rng.range(-8, 8), y: e.y - 70 }, { x: e.x, y: e.y }], ttl: 0.12, color: '#b8f2ff' });
      }
      return;
    }

    if (evo === 'storm_tether') {
      // W11d Storm Tether: ceil(Chains / 2) arcs (max 4) HOLD on the nearest foes inside 120 + 0.6 x Arc and burn them every tick
      // (0.45x power, tick 0.25 s x Cooldown / 1.6, floor 0.1 s AFTER tree mods); each arc forks once at 0.2x to a foe within Arc of its
      // target. An arc keeps its foe until it dies or leaves the reach, then re-locks at once. One arc per foe: a lone foe only
      // ever gets one arc (no doubling), and a fork never lands on a foe that holds an arc.
      const reach = tune(sim, w, 'reach', 120) + tune(sim, w, 'reachK', 0.6) * area;
      const n = Math.min(tune(sim, w, 'cap', 4), Math.ceil(s.chains / 2));
      const T = (rt.tethers ||= []);
      for (let i = T.length - 1; i >= 0; i--) {
        const e = T[i].e;
        if (e.dead || Math.hypot(e.x - p.x, e.y - p.y) > reach || i >= n) T.splice(i, 1);
      }
      while (T.length < n) {
        const e = sim.nearestEnemy(p.x, p.y, reach, (q) => !T.some((t) => t.e === q));
        if (!e) break;
        T.push({ e, f: null });
        sim.addFx({ kind: 'ring', x: e.x, y: e.y, r: 12, ttl: 0.18, color: '#b8f2ff' }); // one crack on lock
      }
      rt.cd = (rt.cd ?? 0.2) - dt;
      if (rt.cd > 0) return;
      rt.cd = Math.max(0.1, tune(sim, w, 'tick', 0.25) * (s.cooldown / 1.6) * sim.mods.cooldown);
      const k = tune(sim, w, 'k', 0.45), fk = tune(sim, w, 'fork', 0.2);
      for (const t of T) {
        if (t.e.dead) continue;
        sim.hurt(t.e, dmg * k * chainBoss(sim, t.e));
        t.f = null;
        const f = sim.nearestEnemy(t.e.x, t.e.y, area, (q) => q !== t.e && !T.some((o) => o.e === q));
        if (f) { t.f = f; sim.hurt(f, dmg * k * fk * chainBoss(sim, f)); }
      }
      return;
    }

    if (evo === 'thunder_judgment') {
      rt.jCd = (rt.jCd ?? 1.5) - dt;
      // W11b: 0.3 s sky-darkening tell (visual only; the render hook decides what to draw per tier / reduced motion)
      if (rt.jCd <= 0.3 && rt.jCd > 0 && !rt.jTold) { rt.jTold = true; sim.addFx({ kind: 'judgetell', ttl: 0.3, life: 0.3, x: p.x, y: p.y, r: JUDGE_R }); }
      if (rt.jCd <= 0) {
        rt.jCd = tune(sim, w, 'cd', 3);
        rt.jTold = false;
        let n = 0;
        // Flow v2 (E2): the smite reaches `cap` foes at full Chains rank and fewer below it, so a rank in Chains still counts for the evolution.
        const cdef = sim.data.weapons[w.id].stats.chains;
        const cap = Math.max(1, Math.round(tune(sim, w, 'cap', 30) * Math.min(1, s.chains / (cdef.base + cdef.perRank * sim.balance.maxRank))));
        // Nearest first, inside radius 180 (a circle that sits wholly inside the 640x360 view, so nothing is struck off screen).
        const near = [];
        for (const e of sim.enemies) {
          if (e.dead) continue;
          const dd = Math.hypot(e.x - p.x, e.y - p.y);
          if (dd <= JUDGE_R) near.push({ e, dd });
        }
        near.sort((a, b) => a.dd - b.dd || a.e.id - b.e.id);
        rt.jLast = [];
        for (const { e } of near) {
          if (n >= cap) break;
          n++;
          rt.jLast.push(e.id);
          sim.hurt(e, dmg * tune(sim, w, 'dmg', 0.72) * chainBoss(sim, e));
          sim.addFx({ kind: 'bolt', pillar: 'judgment', pts: [{ x: e.x, y: e.y - 260 }, { x: e.x, y: e.y }], ttl: 0.22, color: '#b8f2ff' });
        }
        if (n) sim.addFx({ kind: 'judgeflash', ttl: 0.14, life: 0.14, x: p.x, y: p.y, r: JUDGE_R });
      }
    }

    rt.cd = (rt.cd ?? 0.4) - dt;
    if (rt.cd > 0) return;
    // RT2 (Matt, RETUNE PLAN DECISIONS 2026-10-25): the first strike prefers a live boss inside the same 220 u reach; the jumps still go to adds.
    const boss = sim.boss && !sim.boss.dead && !(sim.boss.immuneT > 0) && Math.hypot(sim.boss.x - p.x, sim.boss.y - p.y) <= 220 ? sim.boss : null;
    const first = boss || sim.nearestEnemy(p.x, p.y, 220);
    if (!first) { rt.cd = 0.15; return; }
    const chains = evo === 'thunder_judgment' ? Math.min(tune(sim, w, 'chains', 9), s.chains + tune(sim, w, 'chainsBonus', 2)) : s.chains; // Judgment adds two links to the base chain (9 at full Chains rank, as before)
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
    const tide = evo === 'vesper_tide';
    const units = syncUnits(sim, w, 'orb', count, () => ({ r: 4, disabledT: 0, hidden: false }));
    rt.ang = (rt.ang || 0) + spin * dt;

    rt.lock = 0; // (the retired Candle Wheel socket trick; the renderer still reads it)
    // W12 Vesper Tide 'Swell and Draw': the ring radius breathes 14 px <-> tide x Orbit size at phase x Orbit speed rad/s (cosine,
    // eases at both ends). Hits made while the ring pushes OUT (sin phi > 0) deal x crest. The guard contraction WINS: it takes the
    // breathing radius as input and closes it to 14 px, and a closing/closed ring never gets the crest.
    rt.crest = 1; rt.tide = null;
    let swelling = false;
    if (tide) {
      rt.ph = (rt.ph || 0) + spin * tune(sim, w, 'phase', 1.5) * dt;
      const k = 0.5 - 0.5 * Math.cos(rt.ph);
      const rmin = Math.min(radius, tune(sim, w, 'rmin', 14));
      radius = rmin + (radius * tune(sim, w, 'tide', 1.7) - rmin) * k;
      swelling = Math.sin(rt.ph) > 0;
    }
    radius = orbitRadius(sim, rt, dt, radius, false);
    if (tide) {
      swelling = swelling && !(rt.gK > 0);
      rt.crest = swelling ? tune(sim, w, 'crest', 2) : 1;
      rt.tide = { r: radius, out: swelling };
    }
    const gap = ORBIT_GAP / rateMult(sim.data.weapons.holy_orbit, 'speed', w.ranks.speed || 0);
    const bossReach = sim.data.weapons.holy_orbit.stats.radius.bossReach ?? 0, bossHit = sim.data.weapons.holy_orbit.stats.radius.bossX ?? 1;
    units.forEach((u, i) => {
      const a = rt.ang + (i * TAU) / count;
      u.x = p.x + Math.cos(a) * radius;
      u.y = p.y + Math.sin(a) * radius;
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
        const rr = e.r + u.r + 1 + (e.boss ? bossReach : 0); // RT2: lights touch a boss's wide crown a little sooner (weapons.json radius.bossReach)
        if (dx * dx + dy * dy >= rr * rr) continue;
        if (evo === 'judgement_wheel') {
          // W6 Bursting Lights: blast 34 px + 3 px per Orbit size rank, one blast per foe per 0.1 s, applies Burn (never from the Candle Wheel lock)
          const br = tune(sim, w, 'blast', 34) + tune(sim, w, 'blastPer', 3) * (w.ranks.radius || 0);
          // 'boss' = blast damage x on bosses (Alt 1, locked); 'maxHits' foes per blast, nearest first (off, probe only)
          const maxHits = tune(sim, w, 'maxHits', 0), bossX = tune(sim, w, 'boss', 2.0);
          let hit = sim.enemies.filter((o) => !o.dead && Math.hypot(o.x - u.x, o.y - u.y) < o.r + br);
          if (maxHits > 0 && hit.length > maxHits) hit = hit.sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y)).slice(0, maxHits);
          for (const o of hit) {
            if (!sim.canHit(o, 'wheelblast', 0.1)) continue;
            const dealt = sim.hurt(o, dmg * tune(sim, w, 'dmg', 0.85) * (o.boss ? bossX * bossHit : 1)); // x bossHit: RT2 boss-contact rule, so the Wheel keeps its ratio over the base ring
            sim.burn(o, dealt);
          }
          sim.addFx({ kind: 'ring', x: u.x, y: u.y, r: br, ttl: 0.2, color: '#c79bff' });
          sim.addFx({ kind: 'ring', x: u.x, y: u.y, r: br + 3, ttl: 0.14, color: '#ffd98a' }); // gold rim on the blast only
          u.disabledT = tune(sim, w, 'rest', 1.3);
          break;
        }
        if (sim.canHit(e, `orb${i}`, gap)) {
          // RT2 boss-contact rule: a candle light pressed to a boss's trunk burns it radius.bossX harder (the burn follows the hit)
          const dealt = sim.hurt(e, dmg * contact * rt.crest * (e.boss ? bossHit : 1) * (1 - (1 - GUARD.dmg) * (rt.gK || 0))); // contracted ring is a guard, not a grinder
          sim.burn(e, dealt);
          if (rt.gK > 0) { u.guardCd = gap; break; } // contracted: one foe per light per gap (a guard, not a crowd grinder)
        }
      }
    });

    // Sanctum Halo ground: the disc inside the ring (it contracts WITH the ring, foes' bodies count) sets up to 20 foes alight
    // every tick. Burn INSTEAD of separate zone damage (no double DoT) and no heal until W5b. Not while the Candle Wheel stands.
    if (evo === 'sanctum_halo') {
      rt.ground = { r: radius };
      rt.zCd = (rt.zCd ?? 0) - dt;
      if (rt.zCd <= 0) {
        rt.zCd = tune(sim, w, 'tick', 0.5);
        const hit = dmg * tune(sim, w, 'ground', 3);
        let n = 0;
        const cap = tune(sim, w, 'max', 20);
        for (const e of sim.enemies) {
          if (e.dead) continue;
          const dx = e.x - p.x, dy = e.y - p.y, rr = radius + e.r;
          if (dx * dx + dy * dy >= rr * rr) continue;
          sim.burn(e, hit * (e.boss ? bossHit : 1)); // RT2 boss-contact rule holds for every Orbit form
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
