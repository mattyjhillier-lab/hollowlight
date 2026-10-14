// Draws the simulation with Phaser. All art here is generated placeholder shapes,
// ready to be swapped for real sprite sheets later.
import Phaser from 'phaser';
import { app } from '../app.js';
import { createRng } from '../sim/rng.js';
import { Quality } from '../gfx/quality.js';
import { PerfOverlay } from '../gfx/perf.js';

const hex = (s) => parseInt(s.slice(1), 16);

function tex(scene, key, w, h, draw) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function makeTextures(scene) {
  tex(scene, 'ground', 64, 64, (g) => {
    g.fillStyle(0x1b2a1d, 1).fillRect(0, 0, 64, 64);
    for (let i = 0; i < 90; i++) {
      const c = [0x203222, 0x172419, 0x24382a, 0x1a281c][i % 4];
      g.fillStyle(c, 1).fillRect(Math.floor(Math.random() * 62), Math.floor(Math.random() * 62), 2, 2);
    }
    for (let i = 0; i < 7; i++) {
      const x = 4 + Math.floor(Math.random() * 56);
      const y = 6 + Math.floor(Math.random() * 54);
      g.fillStyle(0x2d4a30, 1).fillRect(x, y, 1, 3).fillRect(x + 2, y + 1, 1, 2);
    }
  });

  tex(scene, 'tree', 30, 42, (g) => {
    g.fillStyle(0x3a2616, 1).fillRect(12, 26, 6, 14);
    g.fillStyle(0x4b331f, 1).fillRect(12, 26, 2, 14);
    g.fillStyle(0x12281a, 1).fillCircle(15, 17, 12).fillCircle(8, 21, 8).fillCircle(22, 21, 8);
    g.fillStyle(0x1a3a24, 1).fillCircle(13, 14, 8).fillCircle(20, 18, 6);
    g.fillStyle(0x24502f, 1).fillCircle(11, 12, 4);
  });

  tex(scene, 'patch', 64, 64, (g) => {
    for (let i = 0; i < 8; i++) g.fillStyle(0x5a3a1a, 0.1).fillCircle(32, 32, 32 - i * 3.5);
    g.lineStyle(1, 0x6b4a2b, 0.7);
    for (let a = 0; a < 6; a++) {
      const ang = (a / 6) * Math.PI * 2;
      g.lineBetween(32, 32, 32 + Math.cos(ang) * 26, 32 + Math.sin(ang) * 20);
    }
  });

  const hero = (key, body, trim, hood) => tex(scene, key, 14, 18, (g) => {
    g.fillStyle(0x000000, 0.3).fillEllipse(7, 16, 11, 4);
    g.fillStyle(body, 1).fillRect(3, 7, 8, 9);
    g.fillStyle(trim, 1).fillRect(3, 12, 8, 1).fillRect(6, 7, 2, 9);
    g.fillStyle(hood, 1).fillCircle(7, 5, 5);
    g.fillStyle(0xf1d2b0, 1).fillRect(5, 4, 4, 3);
    g.fillStyle(0x1a1a1a, 1).fillRect(5, 5, 1, 1).fillRect(8, 5, 1, 1);
  });
  hero('hero_wren', 0x7a4b2a, 0xe8b86d, 0xb5783d);
  hero('hero_elias', 0xeeeeee, 0xffd24a, 0xdddddd);

  tex(scene, 'wolf', 18, 12, (g) => {
    g.fillStyle(0x000000, 0.28).fillEllipse(9, 10, 14, 4);
    g.fillStyle(0x6e645e, 1).fillEllipse(8, 6, 13, 7);
    g.fillStyle(0x857a73, 1).fillCircle(14, 5, 3.5);
    g.fillStyle(0x6e645e, 1).fillTriangle(12, 2, 13, -1, 15, 2).fillTriangle(15, 2, 16, -1, 17, 2);
    g.fillStyle(0x6e645e, 1).fillTriangle(1, 5, -2, 2, 3, 3);
    g.fillStyle(0xff4a3a, 1).fillRect(15, 4, 1, 1);
    g.fillStyle(0x4e4641, 1).fillRect(4, 9, 2, 3).fillRect(10, 9, 2, 3);
  });

  tex(scene, 'crow', 14, 10, (g) => {
    g.fillStyle(0x23232f, 1).fillEllipse(6, 5, 9, 5);
    g.fillStyle(0x30303f, 1).fillTriangle(3, 4, 6, -1, 9, 4);
    g.fillStyle(0x23232f, 1).fillCircle(10, 4, 2.5);
    g.fillStyle(0xe0b040, 1).fillTriangle(12, 4, 14, 5, 12, 6);
    g.fillStyle(0xff5050, 1).fillRect(10, 3, 1, 1);
  });

  tex(scene, 'root', 20, 20, (g) => {
    g.lineStyle(2, 0x4a3320, 1);
    for (let a = 0; a < 7; a++) {
      const ang = (a / 7) * Math.PI * 2;
      g.lineBetween(10, 10, 10 + Math.cos(ang) * 9, 10 + Math.sin(ang) * 9);
    }
    g.fillStyle(0x6b4a2b, 1).fillCircle(10, 10, 6);
    g.fillStyle(0x7d5a36, 1).fillCircle(8, 8, 3);
    g.fillStyle(0x9dff7a, 1).fillRect(7, 9, 2, 2).fillRect(11, 9, 2, 2);
  });

  tex(scene, 'treant', 64, 72, (g) => {
    g.fillStyle(0x000000, 0.3).fillEllipse(32, 66, 44, 10);
    g.fillStyle(0x4b331f, 1).fillRect(22, 28, 20, 38);
    g.fillStyle(0x5d4129, 1).fillRect(22, 28, 7, 38);
    g.lineStyle(4, 0x4b331f, 1);
    g.lineBetween(22, 40, 6, 52).lineBetween(42, 40, 58, 52).lineBetween(26, 66, 14, 70).lineBetween(38, 66, 50, 70);
    g.fillStyle(0x1f4a24, 1).fillCircle(32, 20, 20).fillCircle(14, 28, 11).fillCircle(50, 28, 11);
    g.fillStyle(0x2f6a34, 1).fillCircle(26, 14, 9).fillCircle(40, 18, 7);
    g.fillStyle(0xffa63a, 1).fillRect(25, 38, 4, 4).fillRect(35, 38, 4, 4);
    g.fillStyle(0x1a1109, 1).fillRect(27, 48, 10, 3);
  });

  tex(scene, 'wolfU', 18, 12, (g) => {
    g.fillStyle(0x9fd8ff, 0.18).fillEllipse(9, 6, 18, 11);
    g.fillStyle(0x9fd8ff, 0.9).fillEllipse(8, 6, 12, 6);
    g.fillStyle(0xcdeeff, 1).fillCircle(14, 5, 3);
    g.fillStyle(0x9fd8ff, 0.9).fillTriangle(12, 2, 13, -1, 15, 2).fillTriangle(15, 2, 16, -1, 17, 2).fillTriangle(1, 5, -2, 2, 3, 3);
    g.fillStyle(0xffffff, 1).fillRect(15, 4, 1, 1);
  });

  tex(scene, 'raven', 12, 10, (g) => {
    g.fillStyle(0x6a4fc8, 0.25).fillCircle(6, 5, 6);
    g.fillStyle(0x2c1f55, 1).fillEllipse(6, 5, 8, 4);
    g.fillStyle(0x4b3a8e, 1).fillTriangle(3, 4, 6, -1, 9, 4);
    g.fillStyle(0x2c1f55, 1).fillCircle(9, 4, 2);
    g.fillStyle(0xe0b040, 1).fillRect(11, 4, 1, 1);
  });

  tex(scene, 'orb', 12, 12, (g) => {
    g.fillStyle(0xffe08a, 0.25).fillCircle(6, 6, 6);
    g.fillStyle(0xffd24a, 1).fillCircle(6, 6, 3.5);
    g.fillStyle(0xffffff, 1).fillCircle(5, 5, 1.6);
  });

  tex(scene, 'gem', 8, 10, (g) => {
    g.fillStyle(0x2f7fd8, 1).fillTriangle(4, 0, 8, 5, 4, 10).fillTriangle(4, 0, 0, 5, 4, 10);
    g.fillStyle(0x9bd0ff, 1).fillTriangle(4, 1, 6, 5, 4, 5).fillTriangle(4, 1, 2, 5, 4, 5);
  });

  tex(scene, 'heart', 12, 11, (g) => {
    g.fillStyle(0xe0455a, 1).fillCircle(3.5, 3.5, 3.5).fillCircle(8.5, 3.5, 3.5).fillTriangle(0, 5, 12, 5, 6, 11);
    g.fillStyle(0xff9aa8, 1).fillCircle(3, 2.5, 1.2);
  });
  tex(scene, 'magnet', 12, 12, (g) => {
    g.fillStyle(0xd23b3b, 1).fillRect(1, 1, 3, 7).fillRect(8, 1, 3, 7);
    g.fillStyle(0xcfd6dd, 1).fillRect(1, 1, 3, 2).fillRect(8, 1, 3, 2);
    g.fillStyle(0xd23b3b, 1).fillRect(1, 8, 10, 3);
  });

  tex(scene, 'bolt', 10, 10, (g) => {
    g.fillStyle(0x7ff0ff, 0.3).fillCircle(5, 5, 5);
    g.fillStyle(0x7ff0ff, 1).fillCircle(5, 5, 3);
    g.fillStyle(0xffffff, 1).fillCircle(5, 5, 1.4);
  });

  tex(scene, 'dot', 2, 2, (g) => { g.fillStyle(0xffffff, 1).fillRect(0, 0, 2, 2); });
}

class SpritePool {
  constructor(scene, key) {
    this.scene = scene;
    this.key = key;
    this.map = new Map();
    this.free = [];
    this.stamp = 0;
  }
  begin() { this.stamp++; }
  get(id) {
    let s = this.map.get(id);
    if (!s) {
      const img = this.free.pop() || this.scene.add.image(0, 0, this.key);
      img.setVisible(true);
      s = { img, stamp: 0 };
      this.map.set(id, s);
    }
    s.stamp = this.stamp;
    return s.img;
  }
  end() {
    for (const [id, s] of this.map) {
      if (s.stamp !== this.stamp) {
        s.img.setVisible(false);
        this.free.push(s.img);
        this.map.delete(id);
      }
    }
  }
  clear() {
    for (const s of this.map.values()) {
      s.img.setVisible(false);
      this.free.push(s.img);
    }
    this.map.clear();
  }
}

export class RunScene extends Phaser.Scene {
  constructor() {
    super('run');
    this.sim = null;
    this.decor = [];
  }

  create() {
    makeTextures(this);
    const size = app.data.balance.worldSize;
    this.ground = this.add.tileSprite(size / 2, size / 2, size, size, 'ground').setDepth(-1000);
    this.groundG = this.add.graphics().setDepth(-400);
    this.fxG = this.add.graphics().setDepth(100000);

    this.pools = {
      wolf: new SpritePool(this, 'wolf'),
      crow: new SpritePool(this, 'crow'),
      root_crawler: new SpritePool(this, 'root'),
      elder_treant: new SpritePool(this, 'treant'),
      uWolf: new SpritePool(this, 'wolfU'),
      uRaven: new SpritePool(this, 'raven'),
      uOrb: new SpritePool(this, 'orb'),
      gem: new SpritePool(this, 'gem'),
      heart: new SpritePool(this, 'heart'),
      magnet: new SpritePool(this, 'magnet'),
      bolt: new SpritePool(this, 'bolt'),
    };
    this.playerImg = this.add.image(0, 0, 'hero_wren').setVisible(false);
    this.followTarget = this.add.zone(0, 0, 1, 1);

    this.keys = this.input.keyboard.addKeys({
      W: 'W', A: 'A', S: 'S', D: 'D', UP: 'UP', DOWN: 'DOWN', LEFT: 'LEFT', RIGHT: 'RIGHT', SPACE: 'SPACE', ESC: 'ESC',
    });
    this.input.keyboard.addCapture('SPACE,UP,DOWN,LEFT,RIGHT');

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && app.sim && app.sim.state === 'running' && !app.paused) app.togglePause();
    });

    // quality tiers + frame measurement (docs/research/11)
    const cores = navigator.hardwareConcurrency || 4;
    this.quality = new Quality(cores <= 4 ? 'low' : 'med');
    this.qMode = null;
    this.perf = new PerfOverlay(document.getElementById('stage') || document.body);
    this.perf.hook(this.renderer);
    this.perf.toggle(app.params.debug);
    this.workT0 = 0;
    this.lastStep = 0;
    this.frameMs = 16.7;
    this.workMs = 0;
    this.perfInfo = { sprites: 0, particles: 0, tier: '', mode: '' };
    const ev = this.game.events;
    ev.on(Phaser.Core.Events.PRE_STEP, () => { this.workT0 = performance.now(); });
    ev.on(Phaser.Core.Events.POST_RENDER, () => {
      this.workMs = performance.now() - this.workT0;
      this.perf.frameEnd();
    });
    this.input.keyboard.on('keydown-F3', (e) => { e.preventDefault(); this.perf.toggle(); });

    app.scene = this;
    window.dispatchEvent(new Event('scene-ready'));
  }

  bindSim(sim) {
    this.sim = sim;
    const size = app.data.balance.worldSize;
    const cam = this.cameras.main;
    cam.setBounds(0, 0, size, size);
    cam.stopFollow();
    this.followTarget.setPosition(sim.player.x, sim.player.y);
    cam.startFollow(this.followTarget, true, 0.18, 0.18);
    cam.centerOn(sim.player.x, sim.player.y);

    this.clearDecor();
    const rng = createRng(sim.seed ^ 0x51ed);
    for (const pt of sim.patches) {
      const img = this.add.image(pt.x, pt.y, 'patch').setScale((pt.r * 2) / 64).setDepth(-500);
      this.decor.push(img);
    }
    for (let i = 0; i < 520; i++) {
      const x = rng.range(20, size - 20);
      const y = rng.range(30, size - 10);
      if (Math.hypot(x - sim.player.x, y - sim.player.y) < 90) continue;
      const img = this.add.image(x, y, 'tree').setOrigin(0.5, 0.92).setDepth(y);
      img.setScale(rng.range(0.85, 1.25));
      this.decor.push(img);
    }
    this.playerImg.setTexture(`hero_${sim.characterId}`).setVisible(true);
    for (const p of Object.values(this.pools)) p.clear();
  }

  unbindSim() {
    this.sim = null;
    this.clearDecor();
    this.playerImg.setVisible(false);
    for (const p of Object.values(this.pools)) p.clear();
    this.groundG.clear();
    this.fxG.clear();
  }

  clearDecor() {
    for (const d of this.decor) d.destroy();
    this.decor = [];
  }

  shake(ms = 90, intensity = 0.004) {
    const st = app.save.data.settings;
    if (!st.screenShake || st.reducedMotion) return;
    this.cameras.main.shake(ms, intensity);
  }

  readInput() {
    const k = this.keys;
    let x = 0;
    let y = 0;
    if (k.A.isDown || k.LEFT.isDown) x -= 1;
    if (k.D.isDown || k.RIGHT.isDown) x += 1;
    if (k.W.isDown || k.UP.isDown) y -= 1;
    if (k.S.isDown || k.DOWN.isDown) y += 1;
    return { x, y, ability: Phaser.Input.Keyboard.JustDown(k.SPACE) };
  }

  // Measure frame interval + CPU work; auto-tier decisions; refresh overlay.
  measure() {
    const now = performance.now();
    const dt = this.lastStep ? now - this.lastStep : 16.7;
    this.lastStep = now;
    this.frameMs = dt;
    const q = this.quality;
    const mode = app.save.data.settings.quality;
    if (mode !== this.qMode) {
      this.qMode = mode;
      q.setMode(mode);
      this.applyTier();
    }
    if (this.sim && this.sim.state === 'running' && !app.paused && q.sample(dt, this.workMs)) this.applyTier();
    const info = this.perfInfo;
    info.sprites = this.countSprites();
    info.particles = 0;
    info.tier = q.tier;
    info.mode = q.mode;
    this.perf.update(dt, this.workMs, info);
  }

  countSprites() {
    let n = 1;
    for (const pool of Object.values(this.pools)) n += pool.map.size;
    return n;
  }

  applyTier() {}

  update(time, delta) {
    this.measure();
    if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.ESC)) app.togglePause();
    app.frame(Math.min(delta, 100) / 1000);
    if (this.sim) this.draw();
  }

  draw() {
    const sim = this.sim;
    const p = sim.player;
    const pl = this.pools;
    for (const pool of Object.values(pl)) pool.begin();

    // player
    this.followTarget.setPosition(p.x, p.y);
    this.playerImg.setPosition(p.x, p.y).setDepth(p.y).setFlipX(p.faceX < 0);
    this.playerImg.setAlpha(p.iframes > 0 && Math.floor(sim.time * 24) % 2 ? 0.45 : 1);

    const g = this.groundG;
    const fx = this.fxG;
    g.clear();
    fx.clear();

    // zones
    for (const z of sim.zones) {
      const c = hex(z.color);
      const a = Math.min(1, z.ttl);
      g.fillStyle(c, 0.14 * a).fillCircle(z.x, z.y, z.r);
      g.lineStyle(1, c, 0.6 * a).strokeCircle(z.x, z.y, z.r);
    }

    // gems
    for (const gem of sim.gems) {
      const img = pl.gem.get(gem.id);
      img.setPosition(gem.x, gem.y).setDepth(-100).setScale(gem.v >= 10 ? 1.7 : gem.v >= 3 ? 1.25 : 1);
    }

    for (const k of sim.pickups) {
      const bob = Math.sin(sim.time * 5 + k.id) * 1.5;
      pl[k.type].get(k.id).setPosition(k.x, k.y + bob).setDepth(-90).setAlpha(k.ttl < 6 && Math.floor(k.ttl * 6) % 2 ? 0.35 : 1);
    }

    // enemies
    for (const e of sim.enemies) {
      const img = pl[e.type].get(e.id);
      img.setPosition(e.x, e.y).setDepth(e.y).setFlipX(e.faceX < 0);
      if (e.flash > 0) img.setTintFill(0xffffff);
      else if (e.bleedT > 0) img.setTint(0xff9a9a);
      else img.clearTint();
      if (e.tele) {
        if (e.boss) {
          g.fillStyle(0xd9534f, 0.2).fillCircle(e.x, e.y, 74);
          g.lineStyle(1, 0xd9534f, 0.9).strokeCircle(e.x, e.y, 74);
        } else {
          fx.lineStyle(1, 0xff5a4a, 0.6).lineBetween(e.x, e.y, e.x + e.dx * 55, e.y + e.dy * 55);
          fx.fillStyle(0xff3b2f, 1).fillTriangle(e.x, e.y - 18, e.x - 3, e.y - 11, e.x + 3, e.y - 11);
        }
      }
    }

    // summons
    for (const u of sim.units) {
      if (u.hidden) continue;
      if (u.kind === 'wolf') {
        pl.uWolf.get(u.id).setPosition(u.x, u.y).setDepth(u.y).setFlipX(u.faceX < 0).setScale(u.r / 4).setAlpha(0.92);
      } else if (u.kind === 'raven') {
        pl.uRaven.get(u.id).setPosition(u.x, u.y).setDepth(u.y + 30).setFlipX((u.faceX || 1) < 0);
      } else if (u.kind === 'orb') {
        pl.uOrb.get(u.id).setPosition(u.x, u.y).setDepth(u.y + 30);
      }
    }

    // projectiles
    for (const b of sim.projectiles) {
      pl.bolt.get(b.id).setPosition(b.x, b.y).setDepth(b.y + 40).setScale(b.r / 3);
    }

    // transient effects
    for (const f of sim.fx) {
      const c = hex(f.color);
      if (f.kind === 'ring') {
        const k = Math.max(0, f.ttl / 0.3);
        fx.lineStyle(2, c, Math.min(1, k + 0.2)).strokeCircle(f.x, f.y, f.r * (1.15 - 0.15 * k));
      } else if (f.kind === 'bolt') {
        fx.lineStyle(2, c, Math.min(1, f.ttl / 0.1));
        for (let i = 1; i < f.pts.length; i++) {
          const a = f.pts[i - 1];
          const b = f.pts[i];
          const dist = Math.hypot(b.x - a.x, b.y - a.y);
          const n = Math.max(2, Math.ceil(dist / 12));
          fx.beginPath();
          fx.moveTo(a.x, a.y);
          for (let s = 1; s < n; s++) {
            const t = s / n;
            const jx = (Math.random() - 0.5) * 6;
            const jy = (Math.random() - 0.5) * 6;
            fx.lineTo(a.x + (b.x - a.x) * t + jx, a.y + (b.y - a.y) * t + jy);
          }
          fx.lineTo(b.x, b.y);
          fx.strokePath();
        }
      }
    }

    for (const pool of Object.values(pl)) pool.end();
  }
}
