// EN3-EN5: data-driven behaviours for the telegraph enemies (enemies.json `ai` block). Pure JS, no Phaser/DOM, seeded RNG only (sim.rng).
// Each kind is one small state machine on the enemy record: state 'run' | 'tele' (the tell) | kind-specific states; e.tele = true only
// while the tell shows (the renderer draws the red-orange decal from it), direction/position locked at tell start (e.dx/e.dy, e.ax/e.ay).
// Fairness rules shared by every kind (docs/design/enemies-v1.md F2/F5): a spawn grace (move only, no tell), a tell starts only while the
// enemy is inside the view (sim.view, fed by the scene; the bot uses the default), and at most ai.maxTells of one type tell at once.
// Control: fear (fearT) and pin (heldT) interrupt a tell (reset to 'run'); an enemy in its ai.immune state ignores both (Bramble Hart charge).

// Called by Sim.updateEnemies for enemies with e.ai, after the control checks. Returns [vx, vy] in out (no allocation).
export function aiStep(sim, e, dt, nx, ny, dist, out) {
  const A = e.ai;
  if (e.grace > 0) e.grace -= dt;
  if (A.kind === 'ranged') ranged(sim, e, A, dt, nx, ny, dist, out);
  else if (A.kind === 'fuse') fuse(sim, e, A, dt, nx, ny, dist, out);
  else if (A.kind === 'charger') charger(sim, e, A, dt, nx, ny, dist, out);
  else if (A.kind === 'alpha') alpha(sim, e, A, dt, nx, ny, dist, out);
  else { out[0] = nx * e.speed; out[1] = ny * e.speed; }
}

// Fear/pin cancel a tell (non-boss rule). The tell token is released by the per-frame recount.
export function aiInterrupt(e) {
  if (e.state === 'tele') { e.state = 'run'; e.stT = 0; }
  e.tele = false;
}

// true while e may START a tell this frame: grace over, inside the view (minus a margin), a free tell token of its type
export function canTell(sim, e, A) {
  if (e.grace > 0) return false;
  const p = sim.player, v = sim.view, m = 12;
  if (Math.abs(e.x - p.x) > v.hw - m || Math.abs(e.y - p.y) > v.hh - m) return false;
  return (sim.tells[e.type] || 0) < (A.maxTells ?? 3);
}

// ---- Stoat Piper (ranged): walks in to `keep` (and into the view), roots, every cd (+ random) tells, then spits ONE slow thorn along the
// direction locked at tell start; backs off if the player comes within `near`. Thorns hit the player only (sim.eshots), no friendly fire.
function ranged(sim, e, A, dt, nx, ny, dist, out) {
  out[0] = 0; out[1] = 0;
  e.aiCd -= dt;
  const p = sim.player, v = sim.view;
  const inView = Math.abs(e.x - p.x) < v.hw - 20 && Math.abs(e.y - p.y) < v.hh - 20;
  if (e.state === 'run') {
    if (dist < A.near) { out[0] = -nx * A.backSpeed; out[1] = -ny * A.backSpeed; }
    else if (dist > A.keep || !inView) { out[0] = nx * e.speed; out[1] = ny * e.speed; }
    else { e.state = 'root'; e.stT = A.root; }
  } else if (e.state === 'root') {
    e.stT -= dt;
    if (dist < A.near || dist > A.keepMax + 30 || !inView) { e.state = 'run'; return; }
    if (e.stT <= 0 && e.aiCd <= 0 && canTell(sim, e, A) && sim.eshots.length < A.shotCap) {
      e.state = 'tele'; e.tele = true; e.stT = A.tell; e.dx = nx; e.dy = ny; e.faceX = nx >= 0 ? 1 : -1; sim.tells[e.type] = (sim.tells[e.type] || 0) + 1;
    }
  } else if (e.state === 'tele') {
    e.tele = true;
    e.stT -= dt;
    if (e.stT <= 0) {
      e.tele = false;
      e.state = 'root'; e.stT = A.recoil; e.aiCd = A.cd + sim.rng.range(0, A.cdRand);
      const mx = e.x + e.dx * A.muzzle, my = e.y + e.dy * A.muzzle;
      sim.eshots.push({ id: sim.nextId++, src: e.type, from: e.id, x: mx, y: my, vx: e.dx * A.shotSpeed, vy: e.dy * A.shotSpeed, life: A.shotLife, age: 0, r: A.shotR, dmg: A.shotDmg * e.dmgMul, dead: false });
      sim.pushEvent('thorn');
    }
  }
}

// ---- Puffback Toad (area denial): waddles in; within `trigger` it PLANTS, a ground ring fills over `fuse` s, then the blister BURSTS: area
// damage to the player only if inside burstR, and the toad is spent (dies; XP gem only, no kill credit/gold/drops). Killed during the fuse it
// only FIZZLES (no burst; normal kill + XP). Fear/pin cancel the fuse (it re-plants later). The ring never hurts enemies or summons.
function fuse(sim, e, A, dt, nx, ny, dist, out) {
  out[0] = 0; out[1] = 0;
  if (e.state === 'run') {
    out[0] = nx * e.speed; out[1] = ny * e.speed;
    if (dist < A.trigger && canTell(sim, e, A)) { e.state = 'tele'; e.tele = true; e.stT = A.fuse; sim.tells[e.type] = (sim.tells[e.type] || 0) + 1; }
  } else if (e.state === 'tele') {
    e.tele = true;
    e.stT -= dt;
    if (e.stT <= 0) {
      e.tele = false;
      const p = sim.player;
      if (Math.hypot(p.x - e.x, p.y - e.y) < A.burstR + p.r) sim.damagePlayer(A.burstDmg * e.dmgMul, e.type, { kind: 'burst', id: e.id, x: e.x, y: e.y });
      e.burst = true; e.dead = true; e.hp = 0;
      if (sim.fx.length < 48) sim.addFx({ kind: 'burst', x: e.x, y: e.y, r: A.burstR, ttl: 0.45, color: '#c9d2c4' });
      sim.pushEvent('burst');
    }
  }
}

// ---- Bramble Hart (charger): stalks you; inside `range` (and the view) it lowers its crown for `tell` s (direction locked), then charges in a
// long STRAIGHT line (speed x chargeMul for `charge` s, contact damage chargeDmg) through the crowd; during the charge it is immune to fear/pin
// (ai.immune = 'charge', handled in Sim.updateEnemies); afterwards it staggers (`stagger` s, still, vulnerable: fear/pin apply) and stalks again.
function charger(sim, e, A, dt, nx, ny, dist, out) {
  out[0] = 0; out[1] = 0;
  if (e.state === 'run') {
    out[0] = nx * e.speed; out[1] = ny * e.speed;
    e.aiCd -= dt;
    if (e.aiCd <= 0 && dist < A.range && canTell(sim, e, A)) { e.state = 'tele'; e.tele = true; e.stT = A.tell; e.dx = nx; e.dy = ny; e.faceX = nx >= 0 ? 1 : -1; sim.tells[e.type] = (sim.tells[e.type] || 0) + 1; }
  } else if (e.state === 'tele') {
    e.tele = true;
    e.stT -= dt;
    if (e.stT <= 0) { e.tele = false; e.state = 'charge'; e.stT = A.charge; sim.pushEvent('charge'); }
  } else if (e.state === 'charge') {
    out[0] = e.dx * e.speed * A.chargeMul; out[1] = e.dy * e.speed * A.chargeMul;
    e.stT -= dt;
    if (e.stT <= 0) { e.state = 'stagger'; e.stT = A.stagger; }
  } else if (e.state === 'stagger') {
    e.stT -= dt;
    if (e.stT <= 0) { e.state = 'run'; e.aiCd = A.cd + sim.rng.range(0, A.cdRand); }
  }
}

// ---- Branch-Mane (EN6 miniboss, Grey Alpha role; enemies-v1.md 2.7 A): a CHASER on the run clock. HOWL every howl.every s (the first howl.first s
// after it arrives): stands still for howl.pose s (mane up), then calls howl.calls Fell Wolves from the view edge (howl.callsP2 after the phase
// change; at most howl.cap called wolves alive). LINE CHARGE like the hart (tell, direction locked, lane drawn) at x chargeMul for `charge` s,
// chargeDmg contact, cd `cd`; after the phase change (hp below phaseAt) each charge repeats ONCE (re-aimed, a fresh tell). Control immune in every
// state (ai.immune 'all', Sim.updateEnemies), takes bleed/burn/mark. Leash: more than `leash` u from the hero it lopes back at x leashMul (never despawns).
function alpha(sim, e, A, dt, nx, ny, dist, out) {
  out[0] = 0; out[1] = 0;
  const H = A.howl;
  if (!e.phase2 && e.hp < e.maxHp * A.phaseAt) { e.phase2 = true; sim.pushEvent('miniPhase', { id: e.id, x: e.x, y: e.y }); }
  e.howlCd -= dt;
  if (e.state === 'run') {
    const sp = dist > A.leash ? e.speed * A.leashMul : e.speed;
    out[0] = nx * sp; out[1] = ny * sp;
    e.aiCd -= dt;
    if (e.howlCd <= 0 && e.grace <= 0) {
      e.state = 'howl'; e.stT = H.pose; sim.pushEvent('howl', { id: e.id, x: e.x, y: e.y });
      if (sim.fx.length < 48) sim.addFx({ kind: 'howl', x: e.x, y: e.y, r: 70, ttl: 1.2, color: '#6a58a0' }); // the ring of veins spreads through the pose (visual)
    }
    else if (e.aiCd <= 0 && dist < A.range && canTell(sim, e, A)) startTell(sim, e, A, nx, ny);
  } else if (e.state === 'howl') {
    e.stT -= dt;
    if (e.stT <= 0) { e.state = 'run'; e.howlCd = H.every; callPack(sim, e, H); }
  } else if (e.state === 'tele') {
    e.tele = true;
    e.stT -= dt;
    if (e.stT <= 0) { e.tele = false; e.state = 'charge'; e.stT = A.charge; sim.pushEvent('charge'); }
  } else if (e.state === 'charge') {
    out[0] = e.dx * e.speed * A.chargeMul; out[1] = e.dy * e.speed * A.chargeMul;
    e.stT -= dt;
    if (e.stT <= 0) {
      if (e.phase2 && !e.rep) { e.rep = true; e.state = 'run'; e.aiCd = 0; } // phase 2: the charge repeats once (a fresh tell as soon as a token is free)
      else { e.rep = false; e.state = 'run'; e.aiCd = A.cd + sim.rng.range(0, A.cdRand || 0); }
    }
  }
}
function startTell(sim, e, A, nx, ny) {
  e.state = 'tele'; e.tele = true; e.stT = A.tell; e.dx = nx; e.dy = ny; e.faceX = nx >= 0 ? 1 : -1;
  sim.tells[e.type] = (sim.tells[e.type] || 0) + 1;
}
// the howl's pack: Fell Wolves from the view edge (the normal spawn ring), at most H.cap of this alpha's called wolves alive, never over maxEnemies
function callPack(sim, e, H) {
  let alive = 0;
  for (const o of sim.enemies) if (o.calledBy === e.id && !o.dead) alive++;
  const want = (e.phase2 ? H.callsP2 : H.calls) + (sim.tier.miniHowl || 0);
  const n = Math.min(want, H.cap - alive, sim.balance.maxEnemies - sim.enemies.length);
  const base = sim.rng.range(0, 6.2832);
  for (let i = 0; i < n; i++) {
    const pt = sim.ringPoint(base + sim.rng.range(-0.9, 0.9), sim.rng.range(0, 30));
    const w = sim.spawnEnemy(H.enemy, pt.x, pt.y);
    w.calledBy = e.id;
  }
}

// Enemy projectiles (thorns): straight, slow, hit the player only (never enemies or summons), die on hit / life end / world edge.
export function updateEnemyShots(sim, dt) {
  const p = sim.player, size = sim.balance.worldSize;
  let any = false;
  for (const s of sim.eshots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; s.age += dt;
    const dx = p.x - s.x, dy = p.y - s.y, rr = p.r + s.r;
    if (dx * dx + dy * dy < rr * rr) {
      // boss thorns (boss.js): through the fight's hit gate (>= hitGap between boss hits; a gated thorn flies on), kind thorn | nova for DR4
      if (s.boss) { if (sim.fight && sim.fight.hitHero(s.dmg, s.kind, s.x, s.y, s.vx, s.vy)) s.dead = true; }
      else { sim.damagePlayer(s.dmg, s.src, { kind: 'thorn', id: s.from ?? -1, x: s.x, y: s.y, dx: s.vx, dy: s.vy }); s.dead = true; }
    }
    else if (s.life <= 0 || s.x < 0 || s.y < 0 || s.x > size || s.y > size) s.dead = true;
    if (s.dead) any = true;
    if (sim.state !== 'running') break;
  }
  if (any) sim.eshots = sim.eshots.filter((s) => !s.dead);
}
