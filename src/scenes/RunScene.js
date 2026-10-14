// Draws the simulation with Phaser. All art here is generated placeholder shapes,
// ready to be swapped for real sprite sheets later.
import Phaser from 'phaser';
import { app } from '../app.js';
import { createRng } from '../sim/rng.js';
import { Quality } from '../gfx/quality.js';
import { PerfOverlay } from '../gfx/perf.js';
import { PAL, gradeAt } from '../gfx/palette.js';
import { Particles } from '../gfx/particles.js';
import { DamageNumbers, makeDigitFont } from '../gfx/dmgnums.js';

const ADD = Phaser.BlendModes.ADD;
// Allocation-free pseudo-random in [-0.5, 0.5) for lightning jitter (same value for the glow and core passes).
const jit = (n) => { n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n & 255) / 255 - 0.5; };

// Depth layers: world < grade (multiply) < halos (additive) < lit sprites < particles < fx < vignette.
const D_GRADE = 5000;
const D_HALO = 55000;
const D_LIT = 60000;
const D_PART = 90000;
const D_FX = 100000;
const D_VIG = 120000;

const hex = (s) => parseInt(s.slice(1), 16);

function tex(scene, key, w, h, draw) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function rim(scene, key, col) {
  const src = scene.textures.get(key).getSourceImage();
  const w = src.width + 2;
  const h = src.height + 2;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  for (const d of [[0, 1], [2, 1], [1, 0], [1, 2]]) x.drawImage(src, d[0], d[1]);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = col;
  x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = 'source-over';
  x.drawImage(src, 1, 1);
  scene.textures.remove(key);
  scene.textures.addCanvas(key, c);
}

function makeTextures(scene) {
  tex(scene, 'ground', 64, 64, (g) => {
    g.fillStyle(0x1d2b3a, 1).fillRect(0, 0, 64, 64);
    for (let i = 0; i < 90; i++) {
      const c = [0x223244, 0x182433, 0x12182b, 0x1a2a3a][i % 4];
      g.fillStyle(c, 1).fillRect(Math.floor(Math.random() * 62), Math.floor(Math.random() * 62), 2, 2);
    }
    for (let i = 0; i < 7; i++) {
      const x = 4 + Math.floor(Math.random() * 56);
      const y = 6 + Math.floor(Math.random() * 54);
      g.fillStyle(0x2f4a4a, 1).fillRect(x, y, 1, 3).fillRect(x + 2, y + 1, 1, 2);
    }
  });

  tex(scene, 'tree', 30, 42, (g) => {
    g.fillStyle(0x12182b, 1).fillRect(12, 26, 6, 14);
    g.fillStyle(0x1d2b3a, 1).fillRect(12, 26, 2, 14);
    g.fillStyle(0x0b1018, 1).fillCircle(15, 17, 12).fillCircle(8, 21, 8).fillCircle(22, 21, 8);
    g.fillStyle(0x12202c, 1).fillCircle(13, 14, 8).fillCircle(20, 18, 6);
    g.fillStyle(0x2f4a4a, 1).fillCircle(11, 12, 3);
  });

  tex(scene, 'patch', 64, 64, (g) => {
    for (let i = 0; i < 8; i++) g.fillStyle(0x2f4a4a, 0.1).fillCircle(32, 32, 32 - i * 3.5);
    g.lineStyle(1, 0x2f4a4a, 0.7);
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
    g.fillStyle(0xe8e0ff, 0.25).fillCircle(6, 6, 6);
    g.fillStyle(0xb8f2ff, 1).fillCircle(6, 6, 3.5);
    g.fillStyle(0xffffff, 1).fillCircle(5, 5, 1.6);
  });

  tex(scene, 'gem', 8, 10, (g) => {
    g.fillStyle(0x6fd3c5, 1).fillTriangle(4, 0, 8, 5, 4, 10).fillTriangle(4, 0, 0, 5, 4, 10);
    g.fillStyle(0xb8f2ff, 1).fillTriangle(4, 1, 6, 5, 4, 5).fillTriangle(4, 1, 2, 5, 4, 5);
  });

  tex(scene, 'heart', 12, 11, (g) => {
    g.fillStyle(0xe0455a, 1).fillCircle(3.5, 3.5, 3.5).fillCircle(8.5, 3.5, 3.5).fillTriangle(0, 5, 12, 5, 6, 11);
    g.fillStyle(0xff9aa8, 1).fillCircle(3, 2.5, 1.2);
  });
  tex(scene, 'magnet', 12, 12, (g) => {
    g.fillStyle(0x8a5cff, 1).fillRect(1, 1, 3, 7).fillRect(8, 1, 3, 7);
    g.fillStyle(0xe8e0ff, 1).fillRect(1, 1, 3, 2).fillRect(8, 1, 3, 2);
    g.fillStyle(0x8a5cff, 1).fillRect(1, 8, 10, 3);
  });

  tex(scene, 'bolt', 10, 10, (g) => {
    g.fillStyle(0x7ff0ff, 0.3).fillCircle(5, 5, 5);
    g.fillStyle(0x7ff0ff, 1).fillCircle(5, 5, 3);
    g.fillStyle(0xffffff, 1).fillCircle(5, 5, 1.4);
  });

  // Soft radial glow used for halos, particles and gem glow (all additive, one batch).
  tex(scene, 'glow', 32, 32, (g) => {
    for (let i = 0; i < 14; i++) g.fillStyle(0xffffff, 0.07).fillCircle(16, 16, 16 - i * 1.05);
  });

  // Soft vignette (canvas gradient, one full-screen image).
  if (!scene.textures.exists('vig')) {
    const t = scene.textures.createCanvas('vig', 320, 180);
    const c = t.getContext();
    const gr = c.createRadialGradient(160, 90, 40, 160, 90, 190);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.65, 'rgba(255,255,255,0.35)');
    gr.addColorStop(1, 'rgba(255,255,255,0.9)');
    c.fillStyle = gr;
    c.fillRect(0, 0, 320, 180);
    t.refresh();
  }

  // 1px rim-light on enemies (baked once: no extra draw calls) so they read against the dusk grade.
  for (const k of ['wolf', 'crow', 'root', 'treant']) rim(scene, k, '#d6a8c4');

  tex(scene, 'dot', 2, 2, (g) => { g.fillStyle(0xffffff, 1).fillRect(0, 0, 2, 2); });
}

class SpritePool {
  constructor(scene, key, init) {
    this.scene = scene;
    this.key = key;
    this.init = init;
    this.map = new Map();
    this.free = [];
    this.stamp = 0;
  }
  begin() { this.stamp++; }
  get(id) {
    let s = this.map.get(id);
    if (!s) {
      let img = this.free.pop();
      if (!img) {
        img = this.scene.add.image(0, 0, this.key);
        if (this.init) this.init(img);
      }
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
    this.fxG = this.add.graphics().setDepth(D_FX).setBlendMode(Phaser.BlendModes.ADD);

    // dusk-to-dawn grade (multiply rect on Med/High; plain tint on Low) + vignette
    this.grade = this.add.rectangle(320, 180, 760, 440, 0xffffff).setScrollFactor(0).setDepth(D_GRADE).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.vig = this.add.image(320, 180, 'vig').setScrollFactor(0).setDepth(D_VIG).setDisplaySize(656, 369).setTint(PAL.ink);
    this.vigLow = false;
    // warm pre-dawn glow: additive wash that grows over the last ~25% of the run (Med/High)
    this.dawn = this.add.rectangle(320, 180, 760, 440, 0xffa888).setScrollFactor(0).setDepth(D_VIG - 2).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.gradeCol = -1;
    this.gradeTint = -1;

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
      haloU: new SpritePool(this, 'glow', (i) => i.setBlendMode(ADD).setDepth(D_HALO)),
      haloG: new SpritePool(this, 'glow', (i) => i.setBlendMode(ADD).setDepth(D_HALO)),
    };
    makeDigitFont(this);
    this.parts = new Particles(this, D_PART);
    this.nums = new DamageNumbers(this, D_PART + 10);
    this.playerGlow = this.add.image(0, 0, 'glow').setBlendMode(ADD).setDepth(D_HALO).setTint(PAL.teal).setAlpha(0.2).setScale(6).setVisible(false);
    this.flashR = this.add.rectangle(320, 180, 760, 440, 0xffffff).setScrollFactor(0).setDepth(D_VIG - 1).setBlendMode(ADD).setVisible(false);
    this.flashT = 0; this.flashLife = 1; this.flashA = 0;
    this.rings = Array.from({ length: 10 }, () => ({ on: false, x: 0, y: 0, t: 0, life: 1, r0: 0, r1: 1, col: 0, w: 2 }));
    this.zoomT = 9; this.zoomAmp = 0; this.zoomDur = 1;
    this.hitStop = 0; this.hitCool = 0;
    this.trailAcc = 0; this.trailTick = 0; this.fxTick = 0;
    this.bloom = null;
    this.playerImg = this.add.image(0, 0, 'hero_wren').setVisible(false);
    this.followTarget = this.add.zone(0, 0, 1, 1);
    this.gradeNow = gradeAt(0);

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
    this.parts.clear();
    this.nums.clear();
    for (const r of this.rings) r.on = false;
    this.gradeTint = -1;
    this.gradeCol = -1;
    this.updateGrade(sim.time / app.data.balance.runSeconds);
    this.applyTier();
    for (const p of Object.values(this.pools)) p.clear();
  }

  unbindSim() {
    this.sim = null;
    this.parts.clear();
    this.nums.clear();
    this.playerGlow.setVisible(false);
    this.flashR.setVisible(false);
    for (const r of this.rings) r.on = false;
    this.cameras.main.setZoom(1);
    app.freeze = false;
    this.clearDecor();
    this.playerImg.setVisible(false);
    for (const p of Object.values(this.pools)) p.clear();
    this.groundG.clear();
    this.fxG.clear();
    this.gradeTint = -1;
    this.gradeCol = -1;
    this.updateGrade(0);
    this.applyTier();
  }

  clearDecor() {
    for (const d of this.decor) d.destroy();
    this.decor = [];
  }

  shake(ms = 90, intensity = 0.004) {
    const st = app.save.data.settings;
    if (!st.screenShake || st.reducedMotion) return;
    this.cameras.main.shake(Math.min(ms, 320), Math.min(intensity, 0.01));
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
    info.particles = this.parts.count;
    info.tier = q.tier;
    info.mode = q.mode;
    this.perf.update(dt, this.workMs, info);
  }

  countSprites() {
    let n = 1;
    for (const pool of Object.values(this.pools)) n += pool.map.size;
    return n;
  }

  applyTier() {
    const c = this.quality.caps;
    this.grade.setVisible(c.grade);
    this.vig.setVisible(c.vignette);
    this.gradeCol = -1;
    this.gradeTint = -1;
    if (!c.grade) this.setGround(this.gradeNow);
    else this.setGround(0xffffff);
    this.parts.setCap(c.particles);
    this.nums.setCap(c.dmgNums);
    this.playerGlow.setVisible(c.grade && !!this.sim);
    // Built-in bloom: High tier only, WebGL only, feature-detected; fails silently.
    const cam = this.cameras.main;
    try {
      if (this.bloom && !c.bloom) { cam.postFX.remove(this.bloom); this.bloom = null; }
      if (c.bloom && !this.bloom && this.renderer.type === Phaser.WEBGL && cam.postFX && typeof cam.postFX.addBloom === 'function') {
        this.bloom = cam.postFX.addBloom(0xffffff, 1, 1, 1, 0.55, 2);
      }
    } catch (err) { this.bloom = null; }
  }

  reducedMotion() { return !!app.save.data.settings.reducedMotion; }

  addRing(x, y, r0, r1, life, col, w = 2, delay = 0) {
    for (const r of this.rings) {
      if (r.on) continue;
      r.on = true; r.x = x; r.y = y; r.r0 = r0; r.r1 = r1; r.life = life; r.col = col; r.w = w; r.t = -delay;
      return;
    }
  }

  flash(col, a, life) {
    if (this.reducedMotion()) return;
    this.flashR.setFillStyle(col, 1).setVisible(true);
    this.flashA = a; this.flashLife = life; this.flashT = 0;
  }

  zoomPunch(amp, dur) {
    if (this.reducedMotion()) return;
    this.zoomT = 0; this.zoomAmp = amp; this.zoomDur = dur;
  }

  burst(x, y, n, tint, speed, life, size) {
    const k = Math.max(1, Math.round(n * (this.quality.tier === 'low' ? 0.4 : 1)));
    for (let i = 0; i < k; i++) {
      const a = Math.random() * 6.2832;
      const v = speed * (0.4 + Math.random() * 0.6);
      if (!this.parts.emit(x, y, Math.cos(a) * v, Math.sin(a) * v, life * (0.6 + Math.random() * 0.4), size, 0.05, tint, 0.9)) break;
    }
  }

  // ---- event hooks (called from app.onEvent) ----
  levelBurst() {
    const p = this.sim.player;
    this.addRing(p.x, p.y, 8, 110, 0.55, PAL.ice, 2);
    this.burst(p.x, p.y, 16, PAL.ice, 110, 0.7, 0.5);
    this.zoomPunch(0.025, 0.4);
  }

  evolveMoment() {
    const p = this.sim.player;
    this.flash(PAL.gold, 0.32, 0.6);
    this.addRing(p.x, p.y, 8, 220, 1.0, PAL.gold, 3);
    this.addRing(p.x, p.y, 8, 150, 0.8, PAL.lavender, 2, 0.15);
    this.burst(p.x, p.y, 34, PAL.gold, 150, 1.0, 0.7);
    this.zoomPunch(0.07, 1.0);
    this.stop(0.06);
    this.shake(220, 0.006);
  }

  bossIntro() {
    const b = this.sim.boss;
    this.flash(PAL.lavender, 0.35, 0.6);
    this.shake(320, 0.007);
    if (b) this.addRing(b.x, b.y, 10, 160, 0.9, PAL.violet, 3);
  }

  stop(sec) {
    if (this.reducedMotion() || this.hitCool > 0) return;
    this.hitStop = Math.min(0.06, sec);
    this.hitCool = 0.6;
  }

  // Tint ground + trees (Low tier cheap grade, and reset when leaving it).
  setGround(col) {
    if (col === this.gradeTint) return;
    this.gradeTint = col;
    this.ground.setTint(col);
    for (const d of this.decor) d.setTint(col);
  }

  // Colour-grade for the current point in the run. Quantised so we only touch objects when it changes.
  updateGrade(f) {
    const col = gradeAt(Math.round(f * 150) / 150);
    this.gradeNow = col;
    const dw = f > 0.7 ? Math.min(1, (f - 0.7) / 0.3) * 0.36 : 0;
    if (dw > 0 && this.quality.caps.grade) this.dawn.setVisible(true).setAlpha(dw);
    else if (this.dawn.visible) this.dawn.setVisible(false);
    if (this.quality.caps.grade) {
      if (col !== this.gradeCol) { this.gradeCol = col; this.grade.setFillStyle(col, 1); }
    } else this.setGround(col);
  }

  tickFx(dt) {
    const sim = this.sim;
    const cam = this.cameras.main;
    const st = app.save.data.settings;
    this.nums.enabled = !!st.damageNumbers;
    this.parts.update(dt);
    this.nums.update(dt);
    // zoom punch: quick rise, smooth fall
    if (this.zoomT < this.zoomDur) {
      this.zoomT += dt;
      const k = Math.min(1, this.zoomT / this.zoomDur);
      const e = k < 0.12 ? k / 0.12 : (1 - k) * (1 - k) * 1.2;
      cam.setZoom(1 + this.zoomAmp * Math.min(1, e));
    } else if (cam.zoom !== 1) cam.setZoom(1);
    if (this.flashR.visible) {
      this.flashT += dt;
      const k = this.flashT / this.flashLife;
      if (k >= 1) this.flashR.setVisible(false);
      else this.flashR.setAlpha(this.flashA * (1 - k));
    }
    // vignette: pulses red at low HP
    const p = sim.player;
    const low = p.hp > 0 && p.hp / p.maxHp < 0.3 && sim.state === 'running';
    if (this.vig.visible) {
      if (low) {
        if (!this.vigLow) { this.vigLow = true; this.vig.setTint(PAL.danger); }
        this.vig.setAlpha(0.6 + 0.3 * Math.sin(sim.time * 6));
      } else {
        if (this.vigLow) { this.vigLow = false; this.vig.setTint(PAL.ink); }
        this.vig.setAlpha(1);
      }
    }
  }

  update(time, delta) {
    this.measure();
    if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.ESC)) app.togglePause();
    const dt = Math.min(delta, 100) / 1000;
    this.hitCool = Math.max(0, this.hitCool - dt);
    app.freeze = this.hitStop > 0;
    if (this.hitStop > 0) this.hitStop -= dt;
    app.frame(dt);
    if (this.sim) {
      this.draw();
      this.tickFx(dt);
    }
  }

  draw() {
    const sim = this.sim;
    const p = sim.player;
    const pl = this.pools;
    const caps = this.quality.caps;
    for (const pool of Object.values(pl)) pool.begin();
    this.fxTick = (sim.time * 30) | 0;

    const wv = this.cameras.main.worldView;
    const vx0 = wv.x - 40;
    const vy0 = wv.y - 40;
    const vx1 = wv.right + 40;
    const vy1 = wv.bottom + 40;
    let halos = 0;

    this.updateGrade(sim.time / app.data.balance.runSeconds);

    // player
    this.followTarget.setPosition(p.x, p.y);
    this.playerImg.setPosition(p.x, p.y).setDepth(D_LIT + p.y).setFlipX(p.faceX < 0);
    this.playerImg.setAlpha(p.iframes > 0 && Math.floor(sim.time * 24) % 2 ? 0.45 : 1);
    if (this.playerGlow.visible) this.playerGlow.setPosition(p.x, p.y - 4).setAlpha(0.17 + 0.03 * Math.sin(sim.time * 2.5));

    const g = this.groundG;
    const fx = this.fxG;
    g.clear();
    fx.clear();

    // drain hit/kill records into numbers + puffs + hit-stop
    const nh = sim.hitN;
    sim.hitN = 0;
    for (let i = 0; i < nh; i++) {
      const h = sim.hitBuf[i];
      if (h.kill) {
        if (h.boss) {
          this.burst(h.x, h.y, 40, PAL.lavender, 130, 1.0, 0.9);
          this.addRing(h.x, h.y, 10, 200, 1.0, PAL.ice, 3);
          this.shake(300, 0.008);
          this.stop(0.06);
        } else if (h.x > vx0 && h.x < vx1 && h.y > vy0 && h.y < vy1) {
          this.deathPuff(h.x, h.y);
        }
        continue;
      }
      const big = h.boss ? h.a >= h.mx * 0.01 : h.a >= 20 && h.a >= h.mx * 0.5;
      this.nums.spawn(h.x, h.y, h.a, h.id, big, big ? PAL.ice : PAL.lavender);
      if (h.boss ? h.a >= h.mx * 0.03 : big && h.a >= 40) this.stop(0.05);
    }

    // zones
    for (const z of sim.zones) {
      const c = hex(z.color);
      const a = Math.min(1, z.ttl);
      g.fillStyle(c, 0.14 * a).fillCircle(z.x, z.y, z.r);
      g.lineStyle(1, c, 0.6 * a).strokeCircle(z.x, z.y, z.r);
    }

    // gems: culled to the view, gently pulsing with a soft halo (Med/High)
    let gemGlow = 0;
    for (const gem of sim.gems) {
      if (gem.x < vx0 || gem.x > vx1 || gem.y < vy0 || gem.y > vy1) continue;
      const big = gem.v >= 10 ? 1.7 : gem.v >= 3 ? 1.25 : 1;
      const pulse = 1 + 0.1 * Math.sin(sim.time * 5 + gem.id);
      pl.gem.get(gem.id).setPosition(gem.x, gem.y).setDepth(D_LIT - 100).setScale(big * pulse);
      if (gemGlow < caps.gemGlow) {
        gemGlow++;
        pl.haloG.get(gem.id).setPosition(gem.x, gem.y).setTint(PAL.teal).setScale(0.55 * big * pulse).setAlpha(0.35 + 0.15 * Math.sin(sim.time * 5 + gem.id));
      }
    }

    for (const k of sim.pickups) {
      const bob = Math.sin(sim.time * 5 + k.id) * 1.5;
      pl[k.type].get(k.id).setPosition(k.x, k.y + bob).setDepth(D_LIT - 90).setAlpha(k.ttl < 6 && Math.floor(k.ttl * 6) % 2 ? 0.35 : 1);
      if (caps.gemGlow) pl.haloG.get(k.id).setPosition(k.x, k.y + bob).setTint(k.type === 'magnet' ? PAL.violet : PAL.lavender).setScale(0.9).setAlpha(0.4 + 0.15 * Math.sin(sim.time * 4));
    }

    // enemies (culled to the view; boss always drawn)
    for (const e of sim.enemies) {
      if (!e.boss && (e.x < vx0 || e.x > vx1 || e.y < vy0 || e.y > vy1)) continue;
      const img = pl[e.type].get(e.id);
      img.setPosition(e.x, e.y).setDepth(D_LIT + e.y).setFlipX(e.faceX < 0);
      if (e.flash > 0) img.setTintFill(0xffffff);
      else if (e.bleedT > 0) img.setTint(0xff9a9a);
      else img.clearTint();
      if (e.tele) {
        if (e.boss) {
          g.fillStyle(PAL.danger, 0.2).fillCircle(e.x, e.y, 74);
          g.lineStyle(1, PAL.danger, 0.9).strokeCircle(e.x, e.y, 74);
        } else {
          fx.lineStyle(1, 0xff5a4a, 0.6).lineBetween(e.x, e.y, e.x + e.dx * 55, e.y + e.dy * 55);
          fx.fillStyle(0xff3b2f, 1).fillTriangle(e.x, e.y - 18, e.x - 3, e.y - 11, e.x + 3, e.y - 11);
        }
      }
    }

    // spirit trails tick at ~30 Hz
    const trailOn = caps.trails > 0 && this.parts.count < this.parts.cap * 0.75 && !this.reducedMotion();
    let trailBudget = 0;
    if (trailOn && this.fxTick !== this.trailTick) {
      this.trailTick = this.fxTick;
      if (caps.trails === 2 || (this.fxTick & 1) === 0) trailBudget = caps.trails === 2 ? 16 : 7;
    }
    const trail = (x, y, col, s) => {
      if (trailBudget <= 0) return;
      trailBudget--;
      this.parts.emit(x, y, 0, 0, 0.32, s, 0.05, col, 0.5);
    };

    // summons: bright (above the grade) + additive halo
    for (const u of sim.units) {
      if (u.hidden) continue;
      if (u.x < vx0 || u.x > vx1 || u.y < vy0 || u.y > vy1) continue;
      if (u.kind === 'wolf') {
        pl.uWolf.get(u.id).setPosition(u.x, u.y).setDepth(D_LIT + u.y).setFlipX(u.faceX < 0).setScale(u.r / 4).setAlpha(0.92);
        if (halos++ < caps.halos) pl.haloU.get(u.id).setPosition(u.x, u.y).setTint(PAL.teal).setScale(u.r / 4 * 1.15).setAlpha(0.45);
        trail(u.x, u.y + 1, PAL.teal, 0.4);
      } else if (u.kind === 'raven') {
        pl.uRaven.get(u.id).setPosition(u.x, u.y).setDepth(D_LIT + u.y + 30).setFlipX((u.faceX || 1) < 0);
        if (halos++ < caps.halos) pl.haloU.get(u.id).setPosition(u.x, u.y).setTint(PAL.violet).setScale(0.85).setAlpha(0.55);
        trail(u.x, u.y, PAL.violet, 0.3);
      } else if (u.kind === 'orb') {
        pl.uOrb.get(u.id).setPosition(u.x, u.y).setDepth(D_LIT + u.y + 30);
        if (halos++ < caps.halos) pl.haloU.get(u.id).setPosition(u.x, u.y).setTint(PAL.ice).setScale(1.1).setAlpha(0.55);
        trail(u.x, u.y, PAL.lavender, 0.3);
      }
    }

    // projectiles
    for (const b of sim.projectiles) {
      if (b.x < vx0 || b.x > vx1 || b.y < vy0 || b.y > vy1) continue;
      pl.bolt.get(b.id).setPosition(b.x, b.y).setDepth(D_LIT + b.y + 40).setScale(b.r / 3);
      if (halos++ < caps.halos) pl.haloU.get(b.id).setPosition(b.x, b.y).setTint(PAL.teal).setScale((b.r / 3) * 0.9).setAlpha(0.6);
      trail(b.x, b.y, PAL.ice, 0.28);
    }

    // transient effects (additive: glow comes for free)
    let fi = 0;
    for (const f of sim.fx) {
      fi++;
      if (f.kind === 'ring') {
        const c = hex(f.color);
        const k = Math.max(0, f.ttl / 0.3);
        fx.lineStyle(2, c, Math.min(1, k + 0.2)).strokeCircle(f.x, f.y, f.r * (1.15 - 0.15 * k));
      } else if (f.kind === 'bolt') {
        const a = Math.min(1, f.ttl / 0.1);
        for (let pass = 0; pass < 2; pass++) {
          if (pass === 0) fx.lineStyle(5, PAL.violet, 0.3 * a);
          else fx.lineStyle(2, PAL.ice, a);
          for (let i = 1; i < f.pts.length; i++) {
            const pa = f.pts[i - 1];
            const pb = f.pts[i];
            const dist = Math.hypot(pb.x - pa.x, pb.y - pa.y);
            const n = Math.max(2, Math.ceil(dist / 12));
            fx.beginPath();
            fx.moveTo(pa.x, pa.y);
            for (let s2 = 1; s2 < n; s2++) {
              const t = s2 / n;
              const sd = this.fxTick * 7919 + fi * 131 + i * 31 + s2 * 17;
              fx.lineTo(pa.x + (pb.x - pa.x) * t + jit(sd) * 8, pa.y + (pb.y - pa.y) * t + jit(sd + 5003) * 8);
            }
            fx.lineTo(pb.x, pb.y);
            fx.strokePath();
          }
        }
      }
    }

    // scene-local rings (level-up, evolution, boss)
    const dt = this.game.loop.delta / 1000;
    for (const r of this.rings) {
      if (!r.on) continue;
      r.t += dt;
      if (r.t < 0) continue;
      const k = r.t / r.life;
      if (k >= 1) { r.on = false; continue; }
      const e = 1 - (1 - k) * (1 - k);
      fx.lineStyle(r.w, r.col, 0.9 * (1 - k)).strokeCircle(r.x, r.y, r.r0 + (r.r1 - r.r0) * e);
    }

    this.haloCount = halos;
    for (const pool of Object.values(pl)) pool.end();
  }

  // Enemy death: a few rising spirit wisps (pooled, additive).
  deathPuff(x, y) {
    const n = this.quality.tier === 'low' ? 2 : this.quality.tier === 'med' ? 4 : 6;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.2832;
      const v = 14 + Math.random() * 22;
      if (!this.parts.emit(x, y, Math.cos(a) * v, Math.sin(a) * v - 22, 0.45 + Math.random() * 0.3, 0.45, 0.08, i & 1 ? PAL.teal : PAL.violet, 0.8)) break;
    }
  }
}
