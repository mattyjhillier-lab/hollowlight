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
      sim.eshots.push({ id: sim.nextId++, src: e.type, x: mx, y: my, vx: e.dx * A.shotSpeed, vy: e.dy * A.shotSpeed, life: A.shotLife, age: 0, r: A.shotR, dmg: A.shotDmg * e.dmgMul, dead: false });
      sim.pushEvent('thorn');
    }
  }
}

// Enemy projectiles (thorns): straight, slow, hit the player only (never enemies or summons), die on hit / life end / world edge.
export function updateEnemyShots(sim, dt) {
  const p = sim.player, size = sim.balance.worldSize;
  let any = false;
  for (const s of sim.eshots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; s.age += dt;
    const dx = p.x - s.x, dy = p.y - s.y, rr = p.r + s.r;
    if (dx * dx + dy * dy < rr * rr) { sim.damagePlayer(s.dmg, s.src); s.dead = true; }
    else if (s.life <= 0 || s.x < 0 || s.y < 0 || s.x > size || s.y > size) s.dead = true;
    if (s.dead) any = true;
    if (sim.state !== 'running') break;
  }
  if (any) sim.eshots = sim.eshots.filter((s) => !s.dead);
}
