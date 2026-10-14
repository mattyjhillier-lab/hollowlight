// Pooled additive particles. Fixed pool, no allocation after warm-up, capped by quality tier.
import Phaser from 'phaser';
import { inv } from './style.js';

const MAX = 300;

export class Particles {
  constructor(scene, depth) {
    this.scene = scene;
    this.depth = depth;
    this.free = [];
    this.live = [];
    this.cap = 100;
    this.made = 0;
    this.gi = inv('glow');
  }

  setCap(n) {
    this.cap = Math.min(MAX, n);
    while (this.live.length > this.cap) this.kill(this.live.length - 1);
  }

  get count() { return this.live.length; }

  // tint: packed colour. Returns false when the pool is full (caller just skips).
  emit(x, y, vx, vy, life, s0, s1, tint, a0) {
    if (this.live.length >= this.cap) return false;
    let p = this.free.pop();
    if (!p) {
      if (this.made >= MAX) return false;
      this.made++;
      p = { img: this.scene.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(this.depth), vx: 0, vy: 0, t: 0, life: 1, s0: 1, s1: 0, a0: 1 };
    }
    p.vx = vx; p.vy = vy; p.t = 0; p.life = life; p.s0 = s0; p.s1 = s1; p.a0 = a0;
    p.img.setPosition(x, y).setTint(tint).setScale(s0 * this.gi).setAlpha(a0).setVisible(true);
    this.live.push(p);
    return true;
  }

  kill(i) {
    const p = this.live[i];
    p.img.setVisible(false);
    this.free.push(p);
    const last = this.live.pop();
    if (last !== p) this.live[i] = last;
  }

  update(dt) {
    const L = this.live;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.t += dt;
      if (p.t >= p.life) { this.kill(i); continue; }
      const k = p.t / p.life;
      const img = p.img;
      img.x += p.vx * dt;
      img.y += p.vy * dt;
      img.setScale((p.s0 + (p.s1 - p.s0) * k) * this.gi);
      img.setAlpha(p.a0 * (1 - k));
    }
  }

  clear() {
    for (let i = this.live.length - 1; i >= 0; i--) this.kill(i);
  }
}
