// Drives the REAL Sim (src/sim/Sim.js) headlessly for the spike: god mode, fixed 1/60 step, scripted path,
// optional enemy top-up so swarm sizes can be measured on demand. No rendering here.
import { Sim } from '../../src/sim/Sim.js';
import data from '../../src/data/index.js';

const MIX = ['wolf', 'crow', 'root_crawler', 'wolf', 'crow', 'wolf'];

export class Drive {
  constructor({ seed = 1, t = 300, n = 0 } = {}) {
    this.sim = new Sim({ data, characterId: 'wren', seed, startTime: t, godMode: true });
    const s = this.sim;
    s.debugGrant('ghost_wolves', { speed: 3, power: 3 });
    s.debugGrant('raven_flock', { power: 3 });
    s.debugGrant('spirit_bolts', { power: 3, pierce: 2 });
    s.debugGrant('holy_orbit', { power: 2 });
    this.target = n;
    this.acc = 0;
    this.k = 0;
    this.pathT = 0;
    this.cx = s.player.x;
    this.cy = s.player.y;
    this.vx = 0;
    this.vy = 0;
    this.simMs = 0;
  }

  topUp() {
    const s = this.sim;
    const p = s.player;
    while (s.enemies.length < this.target) {
      const a = (this.k * 2.399) % 6.2832;
      const d = 60 + ((this.k * 37) % 250);
      s.spawnEnemy(MIX[this.k % MIX.length], p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
      this.k++;
    }
  }

  input() {
    // slow lissajous around the world centre (amplitude 300 px) so the hero covers ground
    const s = this.sim;
    this.pathT += 1 / 60;
    const t = this.pathT * 0.11;
    const tx = this.cx + Math.sin(t * 1.3) * 300, ty = this.cy + Math.sin(t * 1.9 + 1) * 300;
    const dx = tx - s.player.x, dy = ty - s.player.y;
    const d = Math.hypot(dx, dy) || 1;
    return { x: dx / d, y: dy / d, ability: false };
  }

  // advance by real seconds (capped), at fixed 1/60
  advance(dtReal) {
    const s = this.sim;
    const t0 = performance.now();
    this.acc += Math.min(dtReal, 0.1);
    let steps = 0;
    while (this.acc >= 1 / 60 && steps < 4) {
      this.acc -= 1 / 60;
      steps++;
      if (s.state === 'levelup') { s.pickCard(s.offer.cards[0].key); continue; }
      this.topUp();
      const inp = this.input();
      const px = s.player.x, py = s.player.y;
      s.step(1 / 60, inp);
      this.vx = (s.player.x - px) * 60; this.vy = (s.player.y - py) * 60;
    }
    this.simMs = performance.now() - t0;
    return steps;
  }

  // run n simulated seconds with no rendering (fast-forward, used to pre-paint the life map)
  fastForward(secs, onStep) {
    const s = this.sim;
    for (let i = 0; i < secs * 60; i++) {
      if (s.state === 'levelup') { s.pickCard(s.offer.cards[0].key); continue; }
      this.topUp();
      s.step(1 / 60, this.input());
      if (onStep) onStep(1 / 60);
    }
  }
}
