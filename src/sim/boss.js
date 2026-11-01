// ELDER TREANT boss fight (LOCKED 2026-10-20, docs/design/boss-treant-v1.md, all option A). Pure JS: no Phaser, no DOM, sim RNG only.
// The whole fight is data-driven from enemies.json <bossId>.fight (validated here; bad data throws at Sim construction, like tiers.json).
// Timeline: at chapter.bossAt (14:00) the waves stop, every living foe crumbles to ash (gems only), every gem flies to the hero, the Root Ring
// (arena) forms and the run clock holds at 14:00 (sim.clock); a 3 s arrival beat (with a 1.2 s sim freeze = the 'bossIntro' stage, so headless
// runs match the game) and a 2 s grace, then the boss picks moves by phase until it dies (victory) or the hero does (defeat). No timer.
// Every move is a TELL (pose + ground decal, published in sim.bossTells for the renderer and the bot) and a RELEASE (one hit test against the
// hero's position at that moment). Fixed damage (light/mid/heavy x tier enemyDmg), >= hitGap s between two boss hits landing, at most one move
// at a time (so <= 2 live tells: the move and its flying pods), phase changes stagger (immune) and shed one heart; never heals.

import { applyMark, MARKS } from './marks.js';

const TAU = Math.PI * 2;
const MOVE_IDS = ['slam', 'eruption', 'seeds', 'sweep', 'fan', 'nova', 'lanes'];
export const BOSS_MOVES = Object.freeze(MOVE_IDS.slice());
// DR4 recap kinds per move (the hurt 'kind' the results screen names)
export const MOVE_KIND = Object.freeze({ slam: 'slam', eruption: 'roots', seeds: 'contact', sweep: 'sweep', fan: 'thorn', nova: 'nova', lanes: 'lanes' });
const DMG_KEYS = ['light', 'mid', 'heavy'];
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const num = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;

// ------------------------------------------------------------------ validation (shipped data, but never trusted blindly)
export function validateFight(F, enemies) {
  const bad = (m) => { throw new Error(`boss fight data: ${m}`); };
  if (!isObj(F)) bad('missing');
  const A = F.arena;
  if (!isObj(A) || !num(A.r, 120, 600) || !num(A.edge, A.r, 2000) || !num(A.ahead, 0, 200) || !num(A.rise, 40, 300) || !num(A.pull, 10, 1000)) bad('arena');
  const I = F.intro;
  if (!isObj(I) || !num(I.beat, 0.5, 10) || !num(I.freezeAt, 0, I.beat) || !num(I.freeze, 0, I.beat - I.freezeAt) || !num(I.grace, 0, 10)) bad('intro');
  if (!isObj(F.dmg) || !DMG_KEYS.every((k) => num(F.dmg[k], 0, 200))) bad('dmg');
  for (const k of ['hitGap', 'stagger', 'thornGap']) if (!num(F[k], 0, 5)) bad(k);
  if (!num(F.pushOut, 0, 100) || !num(F.scaleMin, 0, 60) || !num(F.addGems, 0, 1000) || !num(F.levelHold, 0, 10)) bad('misc');
  if (!Array.isArray(F.phases) || F.phases.length < 1 || F.phases.length > 6) bad('phases');
  let prev = 1.0001;
  F.phases.forEach((P, i) => {
    if (!isObj(P) || !num(P.hpAt, 0.01, 1) || P.hpAt >= prev || !num(P.gap, 0.5, 10) || !num(P.speed, 0, 200) || !isObj(P.moves)) bad(`phase ${i}`);
    prev = P.hpAt;
    for (const [m, w] of Object.entries(P.moves)) if (!MOVE_IDS.includes(m) || !num(w, 0, 100)) bad(`phase ${i} move ${m}`);
    if (P.call !== undefined) {
      if (!Array.isArray(P.call) || P.call.length > 6) bad(`phase ${i} call`);
      for (const c of P.call) if (!Array.isArray(c) || typeof c[0] !== 'string' || !Object.hasOwn(enemies, c[0]) || enemies[c[0]].boss || !Number.isInteger(c[1]) || c[1] < 0 || c[1] > 20) bad(`phase ${i} call entry`);
    }
  });
  if (F.phases[0].hpAt !== 1) bad('phase 0 must start at hpAt 1');
  const M = F.moves;
  if (!isObj(M)) bad('moves');
  for (const id of MOVE_IDS) {
    const m = M[id];
    if (!isObj(m) || !num(m.tell, 0.6, 5)) bad(`move ${id}: every tell must be >= 0.6 s`);
    if (m.dmg !== undefined && !DMG_KEYS.includes(m.dmg)) bad(`move ${id} dmg`);
  }
  const ok = (v, lo, hi) => num(v, lo, hi);
  if (!ok(M.slam.r, 10, 200) || !ok(M.slam.range, 0, 400) || !Number.isInteger(M.slam.spikes) || M.slam.spikes > 8 || !ok(M.slam.spikeR, 1, 40) || !ok(M.slam.spikeLife, 0, 10) || !Number.isInteger(M.slam.spikePhase)) bad('slam');
  if (!ok(M.eruption.r, 8, 80) || !Array.isArray(M.eruption.n) || !M.eruption.n.every((v) => Number.isInteger(v) && v >= 1 && v <= 8) || !ok(M.eruption.near, 0, 200) || !ok(M.eruption.far, M.eruption.near, 300)) bad('eruption');
  const S = M.seeds;
  if (!ok(S.fly, 0.2, 4) || !Array.isArray(S.pods) || !S.pods.every((v) => Number.isInteger(v) && v >= 0 && v <= 10) || !ok(S.hatch, 0.5, 20) || !ok(S.near, 0, 300) || !ok(S.far, S.near, 400) || !Object.hasOwn(enemies, S.pod) || !Object.hasOwn(enemies, S.sapling) || !Number.isInteger(S.cap) || S.cap > 40) bad('seeds');
  if (!ok(M.sweep.r, 20, 300) || !ok(M.sweep.arc, 0.2, 3.2) || !ok(M.sweep.range, 0, 400)) bad('sweep');
  for (const id of ['fan', 'nova']) if (!Number.isInteger(M[id].n) || M[id].n < 1 || M[id].n > 32 || !ok(M[id].speed, 20, 400) || !ok(M[id].shotR, 1, 10)) bad(id);
  if (!ok(M.fan.spread, 0.02, 0.6) || !Number.isInteger(M.nova.gaps) || M.nova.gaps < 1 || M.nova.gaps > 8) bad('fan/nova');
  if (!ok(M.lanes.w, 6, 60) || !Array.isArray(M.lanes.n) || !M.lanes.n.every((v) => Number.isInteger(v) && v >= 1 && v <= 4) || !ok(M.lanes.gap, M.lanes.w + 40, 300) || !ok(M.lanes.linger, 0, 10) || !ok(M.lanes.slow, 0.2, 1)) bad('lanes');
  const PR = F.pressure;
  if (!isObj(PR) || !ok(PR.every, 5, 300) || !ok(PR.gapMul, 0.5, 1) || !ok(PR.floor, 0.5, 1) || !Number.isInteger(PR.capAdd) || !Number.isInteger(PR.capMax) || PR.capMax < S.cap || PR.capMax > 40 || !ok(PR.lingerAdd, 0, 5) || !ok(PR.lingerMax, 0, 10)) bad('pressure');
  if (F.tiers !== undefined) {
    if (!isObj(F.tiers)) bad('tiers');
    for (const [t, r] of Object.entries(F.tiers)) {
      if (!['hard', 'expert'].includes(t) || !isObj(r)) bad(`tier ${t}`);
      for (const [k, v] of Object.entries(r)) {
        if (k === 'fanFrom') { if (!(Number.isInteger(v) && v >= 0 && v < F.phases.length)) bad('tier fanFrom'); }
        else if (k === 'novaGaps') { if (!(Number.isInteger(v) && v >= 1 && v <= M.nova.gaps)) bad('tier novaGaps'); }
        else if (k === 'fanN') { if (!(Number.isInteger(v) && v >= M.fan.n && v <= 9)) bad('tier fanN'); }
        else if (k === 'cross') { if (typeof v !== 'boolean') bad('tier cross'); }
        else if (k === 'saplingMark') { if (typeof v !== 'string' || !Object.hasOwn(MARKS, v)) bad('tier saplingMark'); }
        else bad(`tier key ${k}`);
      }
    }
  }
  return F;
}

// ------------------------------------------------------------------ geometry shared by the sim, the renderer (DR2 threatens) and the bot
// Will a released tell hit a circle (px, py, pr)? t = a bossTells entry.
export function tellHits(t, px, py, pr) {
  const dx = px - t.x, dy = py - t.y;
  if (t.shape === 'disc') { const R = t.r + pr; return dx * dx + dy * dy < R * R; }
  if (t.shape === 'cone') {
    const d = Math.hypot(dx, dy);
    if (d >= t.r + pr) return false;
    if (d <= pr + 2) return true;
    let a = Math.atan2(dy, dx) - Math.atan2(t.ay, t.ax);
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return Math.abs(a) < t.arc / 2 + Math.asin(Math.min(1, pr / d));
  }
  if (t.shape === 'lane') { // segment (x,y) -> (x + ax*len, y + ay*len), half width w/2
    const along = dx * t.ax + dy * t.ay;
    if (along < -pr || along > t.len + pr) return false;
    const perp = Math.abs(dx * -t.ay + dy * t.ax);
    return perp < t.w / 2 + pr;
  }
  return false; // 'pod' landing rings, 'fan', 'nova' (their thorns hit in flight) and pose-only tells never hit on release
}

// ------------------------------------------------------------------ the fight
const TELL_POOL = 12;
function newTell() { return { move: '', shape: '', x: 0, y: 0, r: 0, ax: 1, ay: 0, arc: 0, len: 0, w: 0, n: 0, gaps: 0, rot: 0, t0: 0, t1: 0, harm: true }; }

export class BossFight {
  constructor(sim, def, t0) {
    this.sim = sim;
    this.def = def;
    this.t0 = t0; // sim time of the arrival
    this.stage = 'intro'; // intro | fight | over
    this.introT = 0;
    this.fightT = 0; // seconds since the fight proper began (pressure clock, DR4 'N into the fight')
    this.phase = 0;
    this.move = null; // { id, t, tell, ... } while a move tells / flies
    this.lastMove = '';
    this.gapT = def.intro.grace;
    this.lastHitT = -99;
    this.thornT = -99;
    this.holdT = 0;
    this.addGems = 0;
    this.brush = []; // slowing root brush: { kind: 'disc'|'lane', x, y, r, ax, ay, len, w, ttl }
    this.ash = []; // crumbled foes for the renderer: { x, y, type, t }
    this.lanesCast = 0;
    this.moves = 0;
    this.dmgBoss = 0; this.dmgAdds = 0; // damage dealt inside the fight (counters only: adds <= 30% gate)
    this.byMove = {}; // hits taken per move (counters only)
    this.tellPool = Array.from({ length: TELL_POOL }, newTell);
    this.tells = []; // live tells (objects from the pool; rebuilt when a move starts / ends)
    this.boss = null;
    const rules = (def.tiers && Object.hasOwn(def.tiers, sim.tier.id) && def.tiers[sim.tier.id]) || {};
    this.rules = { fanFrom: rules.fanFrom ?? 1, novaGaps: rules.novaGaps ?? def.moves.nova.gaps, fanN: rules.fanN ?? def.moves.fan.n, cross: !!rules.cross, saplingMark: rules.saplingMark || null };
    this.arena = { cx: 0, cy: 0, r: def.arena.r, bx: 0, by: 0 };
  }

  get P() { return this.def.phases[this.phase]; }
  get pressureK() { return Math.floor(this.fightT / this.def.pressure.every); }
  get gapMul() { const PR = this.def.pressure; return Math.max(PR.floor, PR.gapMul ** this.pressureK); }
  get saplingCap() { const PR = this.def.pressure; return Math.min(PR.capMax, this.def.moves.seeds.cap + PR.capAdd * this.pressureK); }
  linger(base) { const PR = this.def.pressure; return Math.max(base, Math.min(PR.lingerMax, base + PR.lingerAdd * this.pressureK)); } // spikes / lane roots linger +1 s per 30 s, never past lingerMax
  get live() { return this.stage !== 'over'; }
  get frozen() { const I = this.def.intro; return this.stage === 'intro' && this.introT >= I.freezeAt && this.introT < I.freezeAt + I.freeze; }

  // ---- arrival: waves stop, foes crumble, free magnet, the ring forms around the hero
  arrive() {
    const sim = this.sim, p = sim.player, A = this.def.arena, size = sim.balance.worldSize;
    sim.spawnHalt = true;
    for (const e of sim.enemies) {
      if (e.dead) continue;
      if (this.ash.length < 400) this.ash.push({ x: e.x, y: e.y, type: e.type, id: e.id, t: 0 });
      sim.addGem(e.x, e.y, e.xp); // XP as gems; no kill credit, gold or drops; Almanac counts untouched
      sim.alive[e.type] -= 1;
    }
    sim.enemies.length = 0;
    sim.mini = null; // a Branch-Mane still alive at 14:00 crumbles with the rest (no chest)
    sim.eshots.length = 0;
    for (const g of sim.gems) g.mag = true; // one free magnet for every gem on the map
    const a = sim.rng.range(0, TAU), ux = Math.cos(a), uy = Math.sin(a);
    const cx = Math.min(size - A.edge, Math.max(A.edge, p.x + ux * A.ahead)), cy = Math.min(size - A.edge, Math.max(A.edge, p.y + uy * A.ahead));
    const R = this.arena;
    R.cx = cx; R.cy = cy;
    R.bx = cx + ux * (A.rise - A.ahead); R.by = cy + uy * (A.rise - A.ahead);
    R.ux = ux; R.uy = uy;
    // pickups outside the ring are banked at once (a heart heals now; a magnet is already spent by the free magnet)
    const keep = [];
    for (const k of sim.pickups) {
      if (Math.hypot(k.x - cx, k.y - cy) < R.r - 12) { keep.push(k); continue; }
      if (k.type === 'chest') { const d = Math.hypot(k.x - cx, k.y - cy) || 1; k.x = cx + ((k.x - cx) / d) * (R.r - 30); k.y = cy + ((k.y - cy) / d) * (R.r - 30); keep.push(k); continue; } // EN8: an unopened Reliquary is carried inside the ring

      if (k.type === 'heart') { sim.healPlayer(p.maxHp * sim.balance.drops.heartHeal * sim.tfx.heartHeal); sim.pushEvent('heart'); }
    }
    sim.pickups = keep;
    // the ring floor is the Treant's own: the map's slowing root patches inside it go quiet (every escape check assumes full speed)
    for (const pt of sim.patches) if (Math.hypot(pt.x - cx, pt.y - cy) < R.r + pt.r) pt.off = true;
    sim.pushEvent('bossWake', { x: R.bx, y: R.by, cx, cy, r: R.r });
  }

  // point on the ring wall (adds come out of the roots)
  arenaPoint(angle, inset = 20) { const R = this.arena; return { x: R.cx + Math.cos(angle) * (R.r - inset), y: R.cy + Math.sin(angle) * (R.r - inset) }; }

  // clamp a point inside the ring (radius minus a margin)
  clampIn(o, m) {
    const R = this.arena, dx = o.x - R.cx, dy = o.y - R.cy, d = Math.hypot(dx, dy), lim = R.r - m;
    if (d > lim) { o.x = R.cx + (dx / d) * lim; o.y = R.cy + (dy / d) * lim; return true; }
    return false;
  }

  // ---- per frame (Sim.step calls this first; returns true while the sim is frozen for the beat)
  pre(dt) {
    if (this.stage === 'intro') {
      const I = this.def.intro;
      const was = this.introT;
      this.introT += dt;
      if (was < I.freezeAt && this.introT >= I.freezeAt) this.spawnBoss();
      if (this.introT >= I.beat) { this.stage = 'fight'; if (this.boss) this.boss.immuneT = 0; this.gapT = I.grace; this.sim.pushEvent('bossFight'); }
    } else if (this.stage === 'fight') this.fightT += dt;
    for (const a of this.ash) a.t += dt;
    if (this.ash.length && this.ash[0].t > 2) this.ash = this.ash.filter((a) => a.t <= 2);
    if (this.brush.length) { for (const b of this.brush) b.ttl -= dt; if (this.brush.some((b) => b.ttl <= 0)) this.brush = this.brush.filter((b) => b.ttl > 0); }
    return this.frozen;
  }

  spawnBoss() {
    const sim = this.sim, R = this.arena;
    const e = sim.spawnEnemy(sim.chapter.bossId, R.bx, R.by);
    e.fight = true;
    e.immuneT = 1e9; // rising out of the soil: no damage until the fight starts (cleared by pre() at the beat end)
    e.speed = this.P.speed;
    e.floorHp = this.floorFor(0, e);
    e.ph = 0; e.pose = ''; e.poseK = 0;
    this.boss = e;
    sim.boss = e;
    sim.bossSpawned = true;
    sim.pushEvent('boss');
  }

  floorFor(ph, e) { const next = this.def.phases[ph + 1]; return next ? e.maxHp * next.hpAt : 0; }

  damage(key) { return this.def.dmg[key] * this.sim.tier.enemyDmg; }

  // one boss hit on the hero (>= hitGap s between two boss hits landing)
  hitHero(amount, kind, x, y, dx = 0, dy = 0) {
    const sim = this.sim;
    if (sim.time - this.lastHitT < this.def.hitGap || sim.player.iframes > 0) return false;
    this.lastHitT = sim.time;
    this.byMove[kind] = (this.byMove[kind] || 0) + 1;
    sim.damagePlayer(amount, sim.chapter.bossId, { kind, id: this.boss ? this.boss.id : -1, x, y, dx, dy });
    return true;
  }

  // ---- the boss itself (called from Sim.updateEnemies; returns velocity in out)
  step(e, dt, out) {
    out[0] = 0; out[1] = 0;
    const sim = this.sim, p = sim.player;
    if (e.immuneT > 0) e.immuneT = Math.max(0, e.immuneT - dt);
    e.heldT = 0; e.fearT = 0; // control immunity (locked status ruleset: bosses ignore fear / pin / shove)
    if (this.stage !== 'fight') return;
    // phase change (the hit that crosses the threshold is floored there by Sim.hurt, so a phase is never skipped)
    if (e.floorHp > 0 && e.hp <= e.floorHp + 1e-6 && this.phase < this.def.phases.length - 1) { this.nextPhase(e); return; }
    if (e.staggerT > 0) { e.staggerT = Math.max(0, e.staggerT - dt); return; } // clamp: a tiny negative left over used to block every later move (B7 bug)
    const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy) || 0.001;
    if (this.move) { this.stepMove(e, dt, dist); return; }
    e.pose = '';
    if (dist > 40) { out[0] = (dx / dist) * e.speed; out[1] = (dy / dist) * e.speed; }
    this.gapT -= dt;
    if (this.gapT <= 0 && !(e.staggerT > 0)) this.startMove(e, dist);
  }

  nextPhase(e) {
    const sim = this.sim;
    this.phase += 1;
    e.ph = this.phase;
    e.speed = this.P.speed;
    e.floorHp = this.floorFor(this.phase, e);
    e.staggerT = this.def.stagger;
    e.immuneT = Math.max(e.immuneT, this.def.stagger);
    e.pose = 'stagger';
    this.cancelMove();
    this.gapT = this.P.gap * this.gapMul;
    sim.addPickup('heart', e.x, e.y + e.r + 6); // ONE heart per phase change, every tier
    // Husk Call: the called foes run in from the root wall (frozen run-minute scaling, no hearts/magnets)
    const calls = this.P.call || [];
    let k = 0, n = 0;
    for (const [, c] of calls) n += c;
    const base = sim.rng.range(0, TAU);
    for (const [id, c] of calls) for (let i = 0; i < c; i++, k++) {
      const pt = this.arenaPoint(base + (k / Math.max(1, n)) * TAU + sim.rng.range(-0.15, 0.15));
      this.addFoe(id, pt.x, pt.y);
    }
    sim.pushEvent('bossPhase', { phase: this.phase, id: this.P.id });
  }

  addFoe(id, x, y) {
    const e = this.sim.spawnEnemy(id, x, y);
    e.bossAdd = true;
    if (e.grace !== undefined) e.grace = Math.max(e.grace, 0.8);
    return e;
  }

  // ---- moves
  pickMove(e, dist) {
    const sim = this.sim, M = this.def.moves, W = this.P.moves;
    const ids = [], ws = [];
    const wheel = sim.zones.some((z) => z.wheel && Math.hypot(sim.player.x - z.x, sim.player.y - z.y) < z.r);
    let tot = 0;
    for (const id of MOVE_IDS) {
      let w = W[id] || 0;
      if (id === 'fan' && !w && this.phase >= this.rules.fanFrom && this.phase < 2) w = 2; // Deep Dusk 'Thorned': the fan from P1
      if (!w) continue;
      if (id === this.lastMove && id !== 'eruption') continue;
      if (M[id].range && dist > M[id].range) continue;
      if (wheel && (id === 'eruption' || id === 'lanes')) w *= 2; // a planted Candle Wheel draws the ground moves
      ids.push(id); ws.push(w); tot += w;
    }
    if (!ids.length) return 'eruption';
    let r = sim.rng.next() * tot;
    for (let i = 0; i < ids.length; i++) { r -= ws[i]; if (r <= 0) return ids[i]; }
    return ids[ids.length - 1];
  }

  tell() { const t = this.tellPool[this.tells.length] || newTell(); this.tells.push(t); return t; }

  startMove(e, dist, force = null) { // force: tests only (a known move id)
    const sim = this.sim, p = sim.player, M = this.def.moves, id = force && MOVE_IDS.includes(force) ? force : this.pickMove(e, dist), m = M[id], now = sim.time;
    this.move = { id, t: 0, tell: m.tell, stage: 'tell' };
    this.lastMove = id;
    this.moves += 1;
    this.tells.length = 0;
    e.pose = id; e.poseK = 0;
    const aim = Math.atan2(p.y - e.y, p.x - e.x), ax = Math.cos(aim), ay = Math.sin(aim);
    const T = (shape) => { const t = this.tell(); t.move = id; t.shape = shape; t.t0 = now; t.t1 = now + m.tell; t.harm = true; t.ax = ax; t.ay = ay; t.follow = false; t.r = 0; t.len = 0; t.w = 0; t.n = 0; t.arc = 0; return t; }; // pooled: reset every field a move may set
    if (id === 'slam') { const t = T('disc'); t.x = e.x; t.y = e.y; t.r = m.r; t.follow = true; }
    else if (id === 'eruption') {
      const n = m.n[Math.min(this.phase, m.n.length - 1)];
      for (let i = 0; i < n; i++) {
        const t = T('disc'); t.r = m.r;
        if (i === 0) { t.x = p.x; t.y = p.y; } else { const a = sim.rng.range(0, TAU), d = sim.rng.range(m.near, m.far); t.x = p.x + Math.cos(a) * d; t.y = p.y + Math.sin(a) * d; }
        this.clampIn(t, m.r * 0.5);
      }
    } else if (id === 'sweep') { const t = T('cone'); t.x = e.x; t.y = e.y; t.r = m.r; t.arc = m.arc; }
    else if (id === 'fan') { const t = T('fan'); t.x = e.x; t.y = e.y; t.n = this.rules.fanN; t.arc = m.spread; t.harm = false; }
    else if (id === 'nova') { const t = T('nova'); t.x = e.x; t.y = e.y; t.n = m.n; t.gaps = this.rules.novaGaps; t.rot = sim.rng.range(0, TAU); t.harm = false; }
    else if (id === 'lanes') {
      const n = m.n[Math.min(this.lanesCast, m.n.length - 1)];
      const a = sim.rng.range(0, Math.PI), lx = Math.cos(a), ly = Math.sin(a), nx = -ly, ny = lx;
      const offs = [0, m.gap, -m.gap, 2 * m.gap];
      for (let i = 0; i < n; i++) {
        const cross = this.rules.cross && i === n - 1 && n >= 3; // Long Night 'Old Growth': the last lane crosses the others, >= 40 u clear of the hero's spot
        const dx = cross ? nx : lx, dy = cross ? ny : ly;
        const ox = cross ? p.x + lx * (m.gap - 10) : p.x + nx * offs[i], oy = cross ? p.y + ly * (m.gap - 10) : p.y + ny * offs[i];
        this.chord(T('lane'), ox, oy, dx, dy, m.w);
      }
      this.lanesCast += 1;
    } else if (id === 'seeds') {
      const n = m.pods[Math.min(this.phase, m.pods.length - 1)];
      for (let i = 0; i < n; i++) {
        const t = T('pod'); t.harm = false; t.r = 10; t.t1 = now + m.tell + m.fly;
        const a = sim.rng.range(0, TAU), d = sim.rng.range(m.near, m.far);
        t.x = p.x + Math.cos(a) * d; t.y = p.y + Math.sin(a) * d; this.clampIn(t, 24);
      }
      this.move.tell = m.tell + m.fly;
    }
    sim.pushEvent('bossTell', { move: id });
  }

  // a lane = the chord of the ring through (ox, oy) along (dx, dy)
  chord(t, ox, oy, dx, dy, w) {
    const R = this.arena, fx = ox - R.cx, fy = oy - R.cy, b = fx * dx + fy * dy, c = fx * fx + fy * fy - R.r * R.r, disc = Math.max(0, b * b - c), s = Math.sqrt(disc);
    const s0 = -b - s, s1 = -b + s;
    t.x = ox + dx * s0; t.y = oy + dy * s0; t.ax = dx; t.ay = dy; t.len = Math.max(0, s1 - s0); t.w = w;
  }

  stepMove(e, dt, dist) {
    const sim = this.sim, mv = this.move, m = this.def.moves[mv.id];
    mv.t += dt;
    e.poseK = Math.min(1, mv.t / m.tell);
    for (const t of this.tells) if (t.follow) { t.x = e.x; t.y = e.y; }
    if (mv.stage === 'tell' && mv.t >= m.tell) { mv.stage = 'act'; this.release(e, mv.id, m); }
    if (mv.t >= mv.tell) this.endMove();
  }

  release(e, id, m) {
    const sim = this.sim, p = sim.player;
    const kind = MOVE_KIND[id];
    if (id === 'slam' || id === 'eruption' || id === 'sweep' || id === 'lanes') {
      let hit = false;
      for (const t of this.tells) if (t.harm && tellHits(t, p.x, p.y, p.r)) { hit = true; break; }
      if (hit) this.hitHero(this.damage(m.dmg), kind, e.x, e.y);
      if (id === 'slam' && this.phase >= m.spikePhase) for (let i = 0; i < m.spikes; i++) {
        const a = (i / m.spikes) * TAU + sim.rng.range(-0.3, 0.3), d = m.r * sim.rng.range(0.55, 0.9);
        this.brush.push({ kind: 'disc', x: e.x + Math.cos(a) * d, y: e.y + Math.sin(a) * d, r: m.spikeR, ttl: this.linger(m.spikeLife), max: this.linger(m.spikeLife), slow: this.def.moves.lanes.slow });
      }
      if (id === 'lanes') for (const t of this.tells) this.brush.push({ kind: 'lane', x: t.x, y: t.y, ax: t.ax, ay: t.ay, len: t.len, w: t.w, ttl: this.linger(m.linger), max: this.linger(m.linger), slow: m.slow });
      if (id === 'slam' || id === 'lanes') { this.tells.length = 0; }
      else this.tells.length = 0;
    } else if (id === 'fan') {
      const t = this.tells[0], n = t.n, half = (n - 1) / 2, a0 = Math.atan2(t.ay, t.ax);
      for (let i = 0; i < n; i++) this.thorn(e, a0 + (i - half) * m.spread, m, 'thorn');
      this.tells.length = 0;
    } else if (id === 'nova') {
      const t = this.tells[0], slots = t.n + 2 * t.gaps, step = TAU / slots, per = slots / t.gaps;
      for (let s = 0; s < slots; s++) {
        const inGap = ((s % per) + per) % per < 2 - 1e-9; // each gap = 2 empty slots, spread evenly round the ring
        if (!inGap) this.thorn(e, t.rot + s * step, m, 'nova');
      }
      this.tells.length = 0;
    } else if (id === 'seeds') {
      // the pods are in the air: the tells stay up until they land (stepMove -> endMove spawns them)
      return;
    }
    sim.pushEvent('bossHit', { move: id, x: e.x, y: e.y });
  }

  thorn(e, a, m, kind) {
    const sim = this.sim, R = this.arena, dx = Math.cos(a), dy = Math.sin(a);
    const x = e.x + dx * (e.r * 0.6), y = e.y + dy * (e.r * 0.6); // ground plane (the renderer lifts the thorn sprite to chest height)
    // life = time to reach the root wall (thorns stop at it)
    const fx = x - R.cx, fy = y - R.cy, b = fx * dx + fy * dy, c = fx * fx + fy * fy - R.r * R.r, s = -b + Math.sqrt(Math.max(0, b * b - c));
    sim.eshots.push({ id: sim.nextId++, src: sim.chapter.bossId, from: e.id, x, y, vx: dx * m.speed, vy: dy * m.speed, life: Math.max(0.05, s / m.speed), age: 0, r: m.shotR, dmg: this.damage(m.dmg), dead: false, boss: true, kind });
  }

  endMove() {
    const sim = this.sim, mv = this.move;
    if (mv && mv.id === 'seeds') {
      const S = this.def.moves.seeds;
      for (const t of this.tells) if (t.shape === 'pod') { const e = this.addFoe(S.pod, t.x, t.y); e.hatchT = S.hatch; }
      sim.pushEvent('bossHit', { move: 'seeds', x: this.boss ? this.boss.x : 0, y: this.boss ? this.boss.y : 0 });
    }
    this.cancelMove();
    this.gapT = this.P.gap * this.gapMul;
  }

  cancelMove() { this.move = null; this.tells.length = 0; if (this.boss) { this.boss.pose = this.boss.staggerT > 0 ? 'stagger' : ''; this.boss.poseK = 0; } }

  // pods hatch into Sapling Husks (cap rises with the pressure); called by Sim.updateEnemies for pods
  podStep(e, dt) {
    e.hatchT -= dt;
    if (e.hatchT > 0) return;
    const S = this.def.moves.seeds, sim = this.sim;
    e.dead = true; e.vanish = true; // the pod itself leaves no kill, gem or gold
    if ((sim.alive[S.sapling] || 0) >= this.saplingCap) return;
    const sp = this.addFoe(S.sapling, e.x, e.y);
    // Long Night 'Old Growth' (boss sheet (g) A): every sapling carries the tier's fixed mark (Ironbark). A boss RULE, not a roll: no RNG is
    // drawn (the DT2 random marks still never touch boss adds), and it never counts as a marked kill (no Dawnglass / Hunter's Eye farm: no timer).
    if (this.rules.saplingMark && applyMark(sp, this.rules.saplingMark)) sim.pushEvent('marked', { id: sp.id, k: this.rules.saplingMark });
  }

  // slowing brush under the hero? (lane roots, slam spikes)
  slowAt(x, y, r) {
    for (const b of this.brush) {
      if (b.kind === 'disc') { const R = b.r + r; if ((x - b.x) ** 2 + (y - b.y) ** 2 < R * R) return b.slow; }
      else if (tellHits({ shape: 'lane', x: b.x, y: b.y, ax: b.ax, ay: b.ay, len: b.len, w: b.w }, x, y, 0)) return b.slow;
    }
    return 1;
  }

  // the level-up offer waits while a boss tell is live (max levelHold s) and during the arrival beat
  holdLevel(dt) {
    if (this.stage === 'intro') return true;
    if (this.stage !== 'fight' || !this.move) { this.holdT = 0; return false; }
    this.holdT += dt;
    return this.holdT < this.def.levelHold;
  }

  // the killing blow: every add crumbles, the fight is over
  over() {
    const sim = this.sim;
    this.stage = 'over';
    this.cancelMove();
    for (const e of sim.enemies) {
      if (e.dead || e.boss) continue;
      if (this.ash.length < 400) this.ash.push({ x: e.x, y: e.y, type: e.type, id: e.id, t: 0 });
      e.dead = true; e.vanish = true; e.counted = true; sim.alive[e.type] -= 1;
    }
    sim.eshots.length = 0;
    this.brush.length = 0;
  }
}
