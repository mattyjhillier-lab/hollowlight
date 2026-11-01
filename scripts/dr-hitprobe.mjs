// Damage-readability probe (docs only): per hit on the hero, record source, attacker state, crowding and clutter.
// Usage: node scripts/dr-hitprobe.mjs <hero> <seeds> <seedFrom> > out.json   (DODGE=0 etc. as bot.mjs)
import { Sim } from '../src/sim/Sim.js';
import { playRun } from './bot.mjs';
const hero = process.argv[2] || 'wren', n = Number(process.argv[3] || 24), s0 = Number(process.argv[4] || 1);
const SW = [60, 150, 240, 300, 360, 450, 540, 600, 660];
const hits = []; const deaths = []; let runs = 0, wins = 0;
const ring = []; // recent enemy-hit positions (non-silent hurt) for clutter
const oHurt = Sim.prototype.hurt;
Sim.prototype.hurt = function (e, amount, opts = {}) { if (!opts.silent) { ring.push(this.time, e.x, e.y); if (ring.length > 3000) ring.splice(0, 1500); } return oHurt.call(this, e, amount, opts); };
const oDmg = Sim.prototype.damagePlayer;
Sim.prototype.damagePlayer = function (amount, src = 'contact') {
  const p = this.player;
  if (p.iframes > 0 || this.state !== 'running') return oDmg.call(this, amount, src);
  const v = this.view || { hw: 266, hh: 150 };
  let over = 0, n40 = 0, n80 = 0, n120 = 0, inView = 0, att = null, bestDm = -1;
  for (const e of this.enemies) {
    if (e.dead) continue;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
    const rr = p.r + e.r * 0.85;
    if (d < rr) { over++; const dm = e.cdmg && e.state === 'charge' ? e.cdmg : e.dmg; if (dm > bestDm) { bestDm = dm; att = e; } }
    if (d < 40) n40++; if (d < 80) n80++; if (d < 120) n120++;
    if (Math.abs(dx) < v.hw && Math.abs(dy) < v.hh) inView++;
  }
  let kind = 'contact', ax = att?.x, ay = att?.y, extra = {};
  if (src === 'stoat_piper' && !(att && att.type === 'stoat_piper')) {
    kind = 'thorn';
    const s = this.eshots.find((s) => !s.dead && Math.hypot(p.x - s.x, p.y - s.y) < p.r + s.r + 1);
    if (s) { const ox = s.x - s.vx * s.age, oy = s.y - s.vy * s.age; extra.originOff = Math.abs(ox - p.x) > v.hw || Math.abs(oy - p.y) > v.hh; extra.flight = s.age; extra.originD = Math.hypot(ox - p.x, oy - p.y); ax = ox; ay = oy;
      extra.shooterAlive = this.enemies.some((e) => !e.dead && e.type === 'stoat_piper' && Math.hypot(e.x - ox, e.y - oy) < 30); }
  } else if (src === 'puffback_toad') kind = 'burst';
  else if (src === 'elder_treant' && !(att && att.type === 'elder_treant')) kind = 'slam';
  else if (att && att.type === 'bramble_hart' && att.state === 'charge') kind = 'charge';
  let clut = 0; for (let i = 0; i < ring.length; i += 3) if (this.time - ring[i] < 0.4 && Math.hypot(ring[i + 1] - p.x, ring[i + 2] - p.y) < 80) clut++;
  const sameType = att ? this.enemies.filter((e) => !e.dead && e.type === att.type && Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r * 0.85).length : 0;
  const swarm = SW.some((t) => this.time >= t && this.time < t + 25);
  const r = oDmg.call(this, amount, src);
  hits.push({ ast: att ? att.state : null, t: this.time, src, kind, amt: amount, over, sameType, n40, n80, n120, inView, clut, swarm, hp: p.hp / p.maxHp, dist: ax != null ? Math.hypot(ax - p.x, ay - p.y) : 0, ...extra });
  return r;
};
for (let sd = s0; sd < s0 + n; sd++) {
  const before = hits.length; ring.length = 0;
  const r = playRun(hero, sd);
  runs++; if (r.outcome === 'victory') wins++;
  for (let i = before; i < hits.length; i++) hits[i].seed = sd;
  if (r.outcome !== 'victory' && hits.length > before) deaths.push({ seed: sd, t: hits[hits.length - 1].t, src: hits[hits.length - 1].src, kind: hits[hits.length - 1].kind, last5: hits.slice(Math.max(before, hits.length - 5)).map((h) => h.kind === 'contact' ? h.src : h.kind) });
}
process.stdout.write(JSON.stringify({ hero, runs, wins, hits, deaths }));
