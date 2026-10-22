// Draws the simulation with Phaser. All art here is generated placeholder shapes,
// ready to be swapped for real sprite sheets later.
import Phaser from 'phaser';
import { app } from '../app.js';
import { createRng } from '../sim/rng.js';
import { Quality } from '../gfx/quality.js';
import { HeroRig } from '../gfx/herorig.js';
import { EliasRig } from '../gfx/eliasrig.js';
import { FEET, DU } from '../gfx/wrenart.js';
import { HitFx, HIT_RED, LIFT_Z, iframeFlick, FLICK_ALPHA } from '../gfx/hitfx.js'; // DR1 hit feedback state + invulnerability look
import { heroHaloAlpha } from '../gfx/rigmath.js';
import { PerfOverlay } from '../gfx/perf.js';
import { PAL, ROLE, gradeAt, ambientAt } from '../gfx/palette.js';
import { Lightmap } from '../gfx/lightmap.js';
import { NightLayer } from '../gfx/nightlayer.js';
import { vibTarget, vibLevel, restoredShare, R_SMOOTH } from '../gfx/vibrancy.js';
import { vibTintsFor } from '../gfx/vibatlas.js';
import { arcSample, makeArcOut, resolveBrightness, lanternTarget, bossLightRadius } from '../gfx/arc.js';
import { GroundBlend } from '../gfx/groundblend.js';
import { LifeMap } from '../world/lifemap.js';
import { zoneB } from '../world/zones.js';
import { Particles } from '../gfx/particles.js';
import { DamageNumbers, makeDigitFont } from '../gfx/dmgnums.js';
import { KIND, HitRef, FbWatch } from '../gfx/numpool.js';
import { STYLE, INV, inv, zoomFor } from '../gfx/style.js';
import { followStep } from '../gfx/camfollow.js';
import { makeStyleTextures, makeGroundLazy } from '../gfx/sprites.js';
import { makeAmbAtlas, ATLAS_KEY } from '../gfx/ambatlas.js';
import { SwayLayer } from '../gfx/swaylayer.js';
import { PropLayer } from '../gfx/proplayer.js';
import { PushField, pushBudget } from '../gfx/pushfield.js';
import { makePropAtlas, ATLAS_KEY as PROP_KEY } from '../gfx/propatlas.js';
import { START_CLEAR } from '../gfx/propfield.js';
import { RibbonSet, RibbonLayer, ribbonCaps, RIBBON_DEPTH } from '../gfx/ribbons.js';
import { AirLayer, makeEdgeTextures } from '../gfx/airlayer.js'; // W5 fog, fireflies/motes, edge wall (visual only)
import { DawnLayer } from '../gfx/dawnlayer.js'; // AL-6 dawn chorus (birds, petals, light shafts; visual only)
import { airN, DAWN_CAPS, REF as DAWN_REF } from '../gfx/dawn.js';
import { CritterLayer } from '../gfx/critterlayer.js'; // AL-5 sparrow / hare / moths (ambient only)
import { makeSummonAtlas, bakeWolfArt, SUM_ART, SUM_KEY } from '../gfx/summon/atlas.js'; // S0 summon atlas; S1 wolf art baked into it async
import { WOLF_WPD, WOLF_FOOT, WOLF_JITTER, OV_OFF, OV_OFF_LF, ALPHA_K } from '../gfx/summon/wolf.js';
import { wolfFrame, wolfLook, wolfSkin } from '../gfx/summon/wolfanim.js';
import { PawLayer } from '../gfx/summon/pawtrail.js'; // S2 Light Trails pawprint ribbon
import { makeCritterAtlas, ATLAS_KEY as CRIT_KEY } from '../gfx/critteratlas.js';
import { hash as visHash } from '../gfx/wind.js';
import { bakeHuskAtlas, HUSK_BAKE } from '../gfx/enemytex.js'; // EN0 Husk chapter atlas (baked at boot)
import { EnemyArt } from '../gfx/enemyrig.js'; // EN0-EN2 Husk animator + death beat (visual only)
import { HUSK_TYPES, HUSK_IDS } from '../gfx/husk/frames.js';
import { drawEnemyTells, drawThorns, drawBurstFx, drawWolfChevron, TELL_RO } from '../gfx/enemytells.js';
import { threatens, WolfBudget, TELE_FAINT } from '../gfx/telebudget.js'; // DR2 shared telegraph rule
import { Density, quietScale, enemyAlpha, depthOf, depthNear, FADE_R, heroOutTarget, skipSmallNumber, MUST_OUT_CAP, DEPTH_HERO_OUT } from '../gfx/crowdread.js'; // DR3 crowd readability rules
import { HeroLine, OL_RES } from '../gfx/heroline.js'; // OL1: hero outline rebuilt from the hero's own transformed parts
import { BossView, ADD_SCALE, ADD_ORIGIN } from '../gfx/boss/bossview.js'; // Elder Treant fight: arena, tells, boss art, victory flood
import { POD_KEY, SAP_KEY } from '../gfx/boss/bossart.js';
import { HeldKeys, bindHeldKeys } from '../input/keys.js'; // CTL1: own held-key tracker (window capture, cleared on blur/hidden)

const ADD = Phaser.BlendModes.ADD;
// Allocation-free pseudo-random in [-0.5, 0.5) for lightning jitter (same value for the glow and core passes).
const jit = (n) => { n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n & 255) / 255 - 0.5; };

// Depth layers: world < lightmap (multiply) < halos (additive) < lit sprites < particles < fx < vignette.
const D_GRADE = 5000;
const D_HALO = 55000;
const D_LIT = 60000;
const D_PART = 90000;
const D_FX = 100000;
const D_VIG = 120000;

// ?life=1 debug view of the life map (DOM canvas, bottom-left).
function makeLifeDebug(parent) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  cv.style.cssText = 'position:absolute;left:8px;bottom:8px;width:160px;height:160px;z-index:50;image-rendering:pixelated;border:1px solid #fff8;pointer-events:none;background:#000';
  parent.appendChild(cv);
  return { cv, g: cv.getContext('2d'), img: new ImageData(256, 256) };
}
function drawLifeDebug(d, life, p) {
  const px = d.img.data;
  for (let i = 0, j = 0; i < life.life.length; i++, j += 4) { const v = life.rgba[j]; px[j] = v; px[j + 1] = v * 0.8; px[j + 2] = v * 0.3; px[j + 3] = 255; }
  d.g.putImageData(d.img, 0, 0);
  d.g.fillStyle = '#0ff'; d.g.fillRect(p.x / life.cell - 2, p.y / life.cell - 2, 4, 4);
}

const hex = (s) => parseInt(s.slice(1), 16);
const WOLF_GLOW = 0x9fd8ff; // S1: wolf halo retinted to the locked wolf role colour
const WOLF_SELF = 0.65; // S1: additive self-light copy alpha, only while the High bloom is on (it halves a small sprite's value; this keeps the spirit lit)
const WOLF_HALO_K = 1.12, WOLF_HALO_A = 0.5; // S1: wolf halo size / alpha (a smaller, dimmer halo measured WORSE: the High bloom pulls a small body down toward its dark surroundings)

function makeTextures(scene) {
  makeStyleTextures(scene, STYLE);
  INV[PROP_KEY] = makePropAtlas(scene, (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }); // W4 prop atlas
  INV[ATLAS_KEY] = makeAmbAtlas(scene, (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }); // AL-1 sway atlas
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  INV[CRIT_KEY] = makeCritterAtlas(scene, mk); // AL-5 critter atlas
  const sa = makeSummonAtlas(scene, mk, { enabled: app.params.summons !== false }); // S0: ?summons=0 skips the bake
  if (sa) { INV[SUM_KEY] = sa.inv; scene.sumBakeMs = sa.ms; scene.sumAtlas = sa; }
  makeEdgeTextures(scene, mk); // W5 edge-wall fade ramps
}

class SpritePool {
  constructor(scene, key, init) {
    this.scene = scene;
    this.key = key;
    this.inv = inv(key); // world units per texel: multiply any setScale by this
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
        img.setScale(this.inv);
        if (this.init) this.init(img);
      }
      img.setVisible(true);
      s = { img, stamp: 0, id };
      this.map.set(id, s);
    }
    s.stamp = this.stamp;
    return s.img;
  }
  end() {
    for (const s of this.map.values()) {
      if (s.stamp !== this.stamp) {
        s.img.setVisible(false);
        this.free.push(s.img);
        this.map.delete(s.id);
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

const PROPS_OFF = { props: { live: 0, density: 1, sway: false }, ambient: { petals: 0 } };
const LOW_GROUND_K = 0.62; // Low-tier ground-only grade factor (W1 tiles are daylight bright; the lightmap normally does this)
const mulTint = (c, k) => (k === 1 ? c : (Math.min(255, (c >> 16 & 255) * k) << 16) | (Math.min(255, (c >> 8 & 255) * k) << 8) | Math.min(255, (c & 255) * k)); // clamped per channel
const dimTint = (c, k) => (((c >> 16 & 255) * k | 0) << 16) | (((c >> 8 & 255) * k | 0) << 8) | ((c & 255) * k | 0);

export class RunScene extends Phaser.Scene {
  constructor() {
    super('run');
    this.sim = null;
    this.decor = [];
  }

  create() {
    // Perf: Phaser re-sorts the whole display list (~1000 objects) with a merge sort every frame because enemies change depth
    // (y-sorted). Between frames the list is almost sorted, so a stable insertion sort is O(n) there and gives the identical order.
    // Falls back to Phaser's own sort if a frame reshuffles a lot (first frame, big spawn bursts).
    const dl = this.sys.displayList;
    const phaserSort = dl.depthSort;
    dl.depthSort = function () {
      if (!this.sortChildrenFlag) return;
      const a = this.list;
      let moves = 0;
      const cap = a.length * 24 + 2000;
      for (let i = 1; i < a.length; i++) {
        const x = a[i];
        const d = x._depth;
        let j = i - 1;
        while (j >= 0 && a[j]._depth > d) { a[j + 1] = a[j]; j--; moves++; }
        a[j + 1] = x;
        if (moves > cap) { phaserSort.call(this); return; }
      }
      this.sortChildrenFlag = false;
    };
    makeTextures(this);
    const size = app.data.balance.worldSize;
    this.ground = this.add.tileSprite(size / 2, size / 2, size, size, 'ground').setDepth(-1000).setTileScale(inv('ground'));
    this.groundG = this.add.graphics().setDepth(-400);
    // W0 life map (visual only): hero + spirits paint life, it fades in ~25 s; the ground shader (Med/High) or warm pool sprites (Low) show it
    this.life = new LifeMap({ n: 256, world: size, decay: 25, zone: (x, y) => zoneB(x, y, size) });
    this.gb = new GroundBlend(this);
    this.sway = new SwayLayer(this, { zone: (x, y) => zoneB(x, y, size), world: size, glow: { key: 'glow', inv: inv('glow'), blend: ADD } }); // AL-1 grass/flower sway (visual only)
    this.push = new PushField(); // AL-4 creature-reactive foliage sources (visual only: reads creatures, never the sim RNG)
    this.props = new PropLayer(this, { zone: (x, y) => zoneB(x, y, size), world: size }); // W4 props + AL-3 crown sway/petals (visual only)
    this.air = new AirLayer(this, { world: size, glowKey: 'glow', blendAdd: ADD }); // W5 fog + fireflies/motes + edge wall (visual only, own hash stream)
    this.critters = new CritterLayer(this, { world: size, glowKey: 'glow' }); // AL-5 critters (visual only, never touches the sim)
    this.dawnFx = new DawnLayer(this, { glowKey: 'glow', blendAdd: ADD }); // AL-6 dawn chorus (visual only, own hash stream, never the sim RNG)
    this.dawnSt = { calm: false, phone: false, victory: false, hx: 0, hy: 0, bright: 'normal' };
    this.dawnBud = { birds: 0, petals: 0, shafts: 0 };
    this.ribSet = new RibbonSet(1000, 12, 64); // W2 trails (+ W7b Lightfoot trail segments) (visual only)
    this.ribLayer = new RibbonLayer(this, 'glow', inv('glow'), ADD, 1000);
    this.pawLayer = this.sumAtlas ? new PawLayer(this, SUM_KEY, RIBBON_DEPTH + 1, 300) : null; // S2: pawprints over the soft trail ribbon, under every creature/halo/pickup/number
    this.ribSrc = Array.from({ length: 48 }, () => ({ id: 0, x: 0, y: 0, col: 0, life: 0, fast: false }));
    this.ribHero = { lx: 0, ly: 0, sx: 0, sy: 0 };
    this.ribKey = '';
    this.ribCaps = null;
    this.swayPhone = Math.min(window.innerWidth, window.innerHeight) < 500;
    this.airView = { x0: 0, y0: 0, x1: 0, y1: 0 }; // reused each frame (no allocation)
    this.airSt = { caps: null, phone: false, reduced: false, fog: true, motes: true, edge: true };
    this.critSt = { on: false, cap: 0, phone: false, reduced: false };
    this.gbOn = false;
    this.lifeLast = null;
    this.lifeFrames = 0;
    this.lifeDbg = app.params.life ? makeLifeDebug(document.getElementById('stage') || document.body) : null;
    this.lowPool = Array.from({ length: 14 }, () => this.add.image(0, 0, 'glow').setBlendMode(ADD).setDepth(-450).setTint(ROLE.lantern).setScale(5.5 * inv('glow')).setAlpha(0).setVisible(false));
    this.lowPoolI = 0;
    // W3 Low fallback: a few soft dark ink blobs (no cracks) under the densest enemy groups; Med/High use the ground shader instead
    this.corrBlobs = Array.from({ length: 10 }, () => this.add.image(0, 0, 'glow').setDepth(-380).setTint(0x080914).setScale(12 * inv('glow')).setAlpha(0).setVisible(false));
    this.corrBin = new Map();
    this.lowPoolT = 0;
    this.fxG = this.add.graphics().setDepth(D_FX).setBlendMode(Phaser.BlendModes.ADD);

    // dusk-to-dawn: lightmap (Med/High, half-res multiply layer) or plain tint of ground + trees (Low / fallback) + vignette
    this.lm = new Lightmap(this, D_GRADE);
    this.lmOn = false;
    this.ambient = 0x33406c;
    this.dfl = Array.from({ length: 10 }, () => ({ x: 0, y: 0, t: 9 }));
    this.dflI = 0;
    this.lanR = 150;
    this.vib = { R: 0, s: 1, level: -1, t: 9, built: false }; // WL6c: restored share of the view (smoothed), current saturation, quantised level, sampling timer
    this.arc = makeArcOut(); // WL6a: current arc sample (ambient, Low tint, lantern radius, enemy tint/eye/rim values, dawn wash)
    this.arcKey = -1;
    this.nl = new NightLayer(this, D_VIG + 1); // WL6b: eyes / rims / boss eyes, above the vignette
    this.nlc = { tier: 'med', calm: false, time: 0, hx: 0, hy: 0, arc: this.arc, vx0: 0, vy0: 0, vx1: 0, vy1: 0, depthBase: D_LIT, art: null, bloom: false };
    this.nlOn = false;
    this.teleG = this.add.graphics().setDepth(D_VIG + 3); // telegraphs (charge line, boss ring) sit above the vignette so the screen edge never hides a threat
    this.phone = false;
    this.vig = this.add.image(0, 0, 'vig').setScrollFactor(0).setDepth(D_VIG).setDisplaySize(656, 369).setTint(PAL.ink);
    this.vigLow = false;
    // warm pre-dawn glow: additive wash that grows over the last ~25% of the run (Med/High)
    this.dawn = this.add.rectangle(0, 0, 760, 440, 0xffa888).setScrollFactor(0).setDepth(D_VIG - 2).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.gradeTint = -1;

    this.bossView = new BossView(this, { lit: D_LIT, ground: -395, tele: D_VIG + 3 });
    INV[POD_KEY] = INV[SAP_KEY] = ADD_SCALE;
    this.pools = {
      wolf: new SpritePool(this, 'wolf'),
      crow: new SpritePool(this, 'crow'),
      root_crawler: new SpritePool(this, 'root'),
      stoat_piper: new SpritePool(this, 'piper'),
      puffback_toad: new SpritePool(this, 'toad'),
      bramble_hart: new SpritePool(this, 'hart'),
      elder_treant: new SpritePool(this, 'treant'),
      treant_pod: new SpritePool(this, POD_KEY, (i) => i.setOrigin(ADD_ORIGIN[0], ADD_ORIGIN[1])),
      treant_sapling: new SpritePool(this, SAP_KEY, (i) => i.setOrigin(ADD_ORIGIN[0], ADD_ORIGIN[1])),
      uWolf: new SpritePool(this, 'wolfU'),
      uEcho: new SpritePool(this, 'wolfU'), // W6: separate pool so the pale tint never leaks onto real wolves
      uWolfA: new SpritePool(this, SUM_KEY), // S1 Lantern-Heart wolves (sum_atlas frames)
      uWolfOv: new SpritePool(this, SUM_KEY), // S1 pack-variety overlays (notched ear / chest tuft / curl tail)
      uWolfL: new SpritePool(this, SUM_KEY, (i) => i.setBlendMode(ADD)), // S1 self-light: an additive copy of the wolf frame while the bloom is on
      uRaven: new SpritePool(this, 'raven'),
      uOrb: new SpritePool(this, 'orb'),
      gem: new SpritePool(this, 'gem'),
      heart: new SpritePool(this, 'heart'),
      magnet: new SpritePool(this, 'magnet'),
      bolt: new SpritePool(this, 'bolt'),
      haloU: new SpritePool(this, 'glow', (i) => i.setBlendMode(ADD).setDepth(D_HALO)),
      haloG: new SpritePool(this, 'glow', (i) => i.setBlendMode(ADD).setDepth(D_HALO)),
      haloC: new SpritePool(this, 'glow', (i) => i.setBlendMode(ADD).setDepth(D_HALO - 2).setTint(0x6a78d8)), // W3: faint cold glow under enemies standing on corruption
    };
    makeDigitFont(this);
    this.parts = new Particles(this, D_PART);
    this.nums = new DamageNumbers(this, D_PART + 10);
    this.hitRef = new HitRef();
    this.watch = new FbWatch(); // pickup / heal / damage-taken feedback from sim value changes (display-only)
    this.fbPing = { gem: -9, magnet: -9, aoe: -9 };
    this.playerGlow = this.add.image(0, 0, 'glow').setBlendMode(ADD).setDepth(D_HALO).setTint(ROLE.lantern).setAlpha(0.2).setScale(10 * inv('glow')).setVisible(false);
    this.heroLine = new HeroLine(this, 'hero_line', ROLE.lanternCore); // OL1: one ring texture per frame from the hero's own parts (cream; the hit outline tints it red)
    this.olParts = [];
    this.heroOut = this.add.image(0, 0, 'hero_line').setDepth(D_LIT + DEPTH_HERO_OUT).setScale(1 / OL_RES).setVisible(false);
    this.heroOutA = 0;
    // DR1 hit feedback (display only): hero outline in light red ABOVE the crowd, a crescent on the side the hit came from, the attacker lifted + outlined
    this.hitFx = new HitFx();
    this.heroHit = this.add.image(0, 0, 'hero_line').setDepth(D_LIT + DEPTH_HERO_OUT + 1).setScale(1 / OL_RES).setTintFill(HIT_RED).setVisible(false);
    this.hitG = this.add.graphics().setDepth(D_LIT + DEPTH_HERO_OUT + 2);
    this.dens = new Density(); this.mrOut = []; this.mrN = 0; this.mustOf = {}; // DR3: crowd density (smoothed), cream outline images for the must-react types, which types they are
    for (const id in app.data.enemies) if (app.data.enemies[id].mustReact === true) this.mustOf[id] = true;
    this.hitGOn = false;
    this.wolfBudget = new WolfBudget(96); this.wolfE = new Array(96).fill(null); // DR2 wolf chevron budget (no per-frame allocation)
    this.liftD = null; this.liftR = null; this.liftId = -2; // attacker rim images (dark + light red), made on first use
    // A1b hero readability: warm ground pool (additive, lantern colour, off on Low) + soft dark backing so the pale hood separates from pale wolves/ground
    this.heroHalo = this.add.image(0, 0, 'glow').setBlendMode(ADD).setDepth(D_HALO + 0.5).setTint(ROLE.lantern).setScale(2.6 * inv('glow'), 1.05 * inv('glow')).setVisible(false);
    this.heroBack = this.add.image(0, 0, 'glow').setDepth(D_LIT).setTint(0x0a1022).setScale(1.15 * inv('glow'), 1.5 * inv('glow')).setAlpha(0.34).setVisible(false);
    this.ring = this.add.image(0, 0, 'ring').setBlendMode(ADD).setDepth(D_HALO + 1).setScale(inv('ring')).setVisible(false);
    this.flashR = this.add.rectangle(0, 0, 760, 440, 0xffffff).setScrollFactor(0).setDepth(D_VIG - 1).setBlendMode(ADD).setVisible(false);
    this.flashT = 0; this.flashLife = 1; this.flashA = 0;
    this.skyR = this.add.rectangle(0, 0, 760, 440, 0x070b1e).setScrollFactor(0).setDepth(D_VIG - 1).setVisible(false); // W11b Thunder Judgment sky-darkening tell (Med/High, not in reduced motion)
    this.rings = Array.from({ length: 10 }, () => ({ on: false, x: 0, y: 0, t: 0, life: 1, r0: 0, r1: 1, col: 0, w: 2 }));
    this.zoomT = 9; this.zoomAmp = 0; this.zoomDur = 1;
    this.hitStop = 0; this.hitCool = 0;
    this.evoBeat = null;
    this.trailAcc = 0; this.trailTick = 0; this.fxTick = 0;
    this.bloom = null;
    this.playerImg = this.add.image(0, 0, 'hero_wren').setVisible(false);
    const rigOpts = { depth: D_LIT, glowKey: 'glow', glowInv: inv('glow'), blendAdd: ADD, flat: this.playerImg };
    this.rigs = [new HeroRig(this, rigOpts), new EliasRig(this, rigOpts)]; // Wren v2 + pup (A1), Elias v2 (A2); both share the flat sprite
    this.rig = this.rigs[0];
    this.camF = { cx: 0, cy: 0, sx: 0, sy: 0, ok: false };
    this.gradeNow = gradeAt(0);

    this.keys = this.input.keyboard.addKeys({
      W: 'W', A: 'A', S: 'S', D: 'D', UP: 'UP', DOWN: 'DOWN', LEFT: 'LEFT', RIGHT: 'RIGHT', SPACE: 'SPACE', ESC: 'ESC',
    });
    this.input.keyboard.addCapture('SPACE,UP,DOWN,LEFT,RIGHT');
    this.inputOut = { x: 0, y: 0, ability: false };
    // CTL1: movement comes from our own tracker (sees every key first, drops everything when a keyup can be missed); the ability is a
    // queued Space press made while the run is live (never one that activated a pause/card button), so neither can stick.
    this.held = new HeldKeys();
    this.abilityQ = false;
    bindHeldKeys(this.held, window, document);
    window.addEventListener('keydown', (e) => {
      if ((e.code !== 'Space' && e.key !== ' ') || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
      const s = app.sim;
      if (s && s.state === 'running' && !app.paused && !(app.ui && app.ui.settingsOpen)) this.abilityQ = true;
    }, true);

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
    this.sec = new Float64Array(10);
    this.secT = new Float64Array(10);
    this.secH = new Float64Array(10);
    this.secA = new Float64Array(10); // bytes allocated per section (only with ?debug=1 on Chrome)
    this.secMem = !!(new URLSearchParams(location.search).get('mem') === '1' && typeof performance !== 'undefined' && performance.memory);
    this.perfInfo = { sprites: 0, particles: 0, tier: '', mode: '' };
    const ev = this.game.events;
    ev.on(Phaser.Core.Events.PRE_STEP, () => { this.workT0 = performance.now(); });
    ev.on(Phaser.Core.Events.POST_RENDER, () => {
      this.workMs = performance.now() - this.workT0;
      this.perf.frameEnd();
    });
    this.input.keyboard.on('keydown-F3', (e) => { e.preventDefault(); this.perf.toggle(); });

    this.baseZoom = 1;
    this.buildAmbient();
    this.fit();
    this.scale.on('resize', () => this.fit());

    app.scene = this;
    // EN0: the Husk atlas bakes in a few async slices; the title/auto-run waits for it (max 4 s, then the flat sprites are used until it lands)
    this.enArt = new EnemyArt(this);
    this.enArt.bake = HUSK_BAKE; // readout (tests / harness)
    const ready = () => window.dispatchEvent(new Event('scene-ready'));
    const wolfBake = this.sumAtlas ? bakeWolfArt(this.sumAtlas) : Promise.resolve(false); // S1: wolf art (until it lands, today's wolf sprite)
    this.sumArt = SUM_ART; // readout (tests / harness)
    if (STYLE === 'a' && app.params.husks) {
      const bake = Promise.all([bakeHuskAtlas(this).then((ok) => { this.enArt.enable(ok); }), wolfBake]);
      if (app.params.auto) Promise.race([bake, new Promise((r) => setTimeout(r, 4000))]).then(ready); // dev/harness auto-runs start on the Husks
      else ready(); // the title shows at once; the bake (~0.3-1 s) finishes long before anyone starts a run (flat sprites until then)
    } else ready();
  }

  // Native-resolution rendering: the canvas is window size x DPR; zoom comes from the short side (zoomFor).
  // Screen-space layers (scrollFactor 0) sit at the canvas centre and are sized to the visible world area + margin.
  fit() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.baseZoom = zoomFor(W, H);
    this.phone = app.isPhone();
    this.cameras.main.setZoom(this.baseZoom);
    const vw = (W / this.baseZoom) * 1.06;
    const vh = (H / this.baseZoom) * 1.06;
    for (const o of [this.dawn, this.flashR, this.skyR]) o.setPosition(W / 2, H / 2).setSize(vw, vh);
    this.vig.setPosition(W / 2, H / 2).setDisplaySize(vw, vh);
    this.lm.destroy(); // rebuilt at the new size by applyTier
    this.applyTier();
  }

  buildAmbient() {} // W5: fog / fireflies / motes / edge live in AirLayer, critters in CritterLayer (built in create)

  // W5 air + AL-5 critters (visual only; hero + enemies are only READ). Fog Med/High, fireflies/motes Med/High, critters need the restored-ground look (ground shader).
  tickAmbient(sim) {
    const caps = this.quality.caps;
    const wv = this.cameras.main.worldView;
    const dt = Math.min(this.game.loop.delta, 100) / 1000;
    const reduced = this.reducedMotion();
    const view = this.airView;
    view.x0 = wv.x; view.y0 = wv.y; view.x1 = wv.right; view.y1 = wv.bottom;
    const live = sim.state !== 'dead';
    const P = app.params;
    this.airSt.dim = this.dens.k; this.dawnSt.dim = this.dens.k;
    this.airSt.caps = caps; this.airSt.phone = this.swayPhone; this.airSt.reduced = reduced;
    this.airSt.fog = P.fog && live; this.airSt.motes = P.motes && live; this.airSt.edge = P.edge;
    // AL-6 dawn chorus: multipliers first (fireflies rise/fade, motes slow, fog thins, critters hush/return), then the pooled birds/petals/shafts
    const dw = this.dawnFx;
    const dm = app.params.dawn ? dw.field.mod : null;
    this.airSt.mod = dm;
    this.air.update(dt, sim.time, view, this.life, this.airSt);
    const cs = this.critSt;
    cs.on = !!(P.critters && this.gbOn && live && caps.ambient.critters > 0); cs.cap = caps.ambient.critters; cs.phone = this.swayPhone; cs.reduced = reduced;
    this.critters.setTint(this.lmOn ? 0xffffff : this.gradeNow);
    this.tickVibrancy(dt, view);
    this.critters.field.ext = !!(dm && dm.hush); this.critters.field.eager = !!(dm && dm.eager);
    this.critters.update(dt, sim.time, view, sim.player, this.life, sim.enemies, sim.enemies.length, cs);
    this.tickDawn(sim, dt, view, caps, reduced);
  }

  // AL-6: run seconds on the 900 s reference clock; birds (CAPS ambient.birds 12/8/4), petals + shafts (DAWN_CAPS), Calm motion = nothing moves, ?dawn=0 off.
  tickDawn(sim, dt, view, caps, reduced) {
    const dw = this.dawnFx;
    const on = app.params.dawn && sim.state !== 'dead';
    const st = this.dawnSt; const bud = this.dawnBud; const ph = this.swayPhone;
    const dc = DAWN_CAPS[this.quality.tier] || DAWN_CAPS.low;
    bud.birds = on ? airN(caps.ambient.birds, ph, 12) : 0; bud.petals = on ? airN(dc.petals, ph, 10) : 0; bud.shafts = on ? airN(dc.shafts, ph, 3) : 0;
    st.calm = reduced; st.phone = ph; st.victory = on && sim.state === 'victory' && (!sim.fight || this.bossView.floodOn()); st.hx = sim.player.x; st.hy = sim.player.y; st.bright = this.arc.mode || 'normal'; // boss fight: the victory flush waits for the flood
    dw.setTint(this.lmOn ? 0xffffff : this.gradeNow);
    if (!on) { dw.field.mod.flush = 0; dw.field.mod.rise = dw.field.mod.fade = dw.field.mod.slow = dw.field.mod.thin = 0; dw.field.mod.hush = dw.field.mod.eager = false; if (dw.count) dw.hideAll(); return; }
    dw.update(dt, (this.showClock(sim) / app.data.balance.runSeconds) * DAWN_REF, view, st, bud);
  }

  // WL6c: restored-world vibrancy (visual only). vib = arc saturation x (0.85 + 0.15 x restored share of the view); the ground shader gets it every frame
  // (smoothed), the restored sprites (tufts, flowers, props, petals, critters, fireflies) get a quantised level re-checked at 2 Hz, so no per-frame work or allocation.
  // Never read by enemies, heroes, UI, pickups, numbers or telegraphs. Low: no ground shader, so tint-only on the (<= 40) props; sway/critters/fireflies are off there.
  tickVibrancy(dt, view) {
    const v = this.vib;
    const on = !!(app.params.vib && app.params.arc);
    if (!on) {
      if (v.level !== -1 || v.s !== 1) { v.level = -1; v.s = 1; this.gb.setSat(1); this.sway.setVib(-1); this.props.setVib(-1); this.critters.setVib(-1); this.air.setVib(-1); }
      return;
    }
    if (!v.built) { // one atlas readback each, the first time vibrancy is on
      v.built = true;
      this.sway.vibT = vibTintsFor(this, ATLAS_KEY); this.props.vibT = vibTintsFor(this, PROP_KEY); this.critters.vibT = vibTintsFor(this, CRIT_KEY);
    }
    v.t += dt;
    let k = Math.min(1, dt / R_SMOOTH);
    if (v.t >= 0.5 || v.rTarget === undefined) {
      v.t = 0;
      if (v.rTarget === undefined) { v.R = restoredShare(this.life, view.x0, view.y0, view.x1, view.y1); v.s = vibTarget(this.arc.sat, v.R); k = 0; } // first tick: snap (no fade-in at run start)
      v.rTarget = restoredShare(this.life, view.x0, view.y0, view.x1, view.y1);
    }
    v.R += ((v.rTarget || 0) - v.R) * k;
    const target = vibTarget(this.arc.sat, v.R) + (app.params.dawn ? this.dawnFx.field.mod.flush : 0); // AL-6: soft colour flush on the restored layers
    v.s += (target - v.s) * k;
    if (this.gbOn) this.gb.setSat(v.s);
    const L = vibLevel(v.s);
    if (L !== v.level) {
      v.level = L;
      this.sway.setVib(L); this.props.setVib(L); this.critters.setVib(L); this.air.setVib(L);
    }
  }

  hideAmbient() {
    this.air.hideAll();
    this.critters.hideAll();
    this.dawnFx.hideAll();
  }

  // AL-1b: a small seeded restored patch around the spawn so the run starts with some colour and sway (visual only: life map floor, never decays;
  // a few soft blobs, not a disc, so the world is still the grey Hollow a few steps away). Own hash from the run seed; the sim RNG is untouched.
  starterGlade(sim) {
    const sd = (sim.seed | 0) ^ 0x61ade;
    const px = sim.player.x; const py = sim.player.y;
    this.life.stampFloor(px, py, 95, 0.7);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4 + 0.15 * visHash(sd + k * 7)) * Math.PI * 2 + visHash(sd) * 1.2;
      const d = 85 + 55 * visHash(sd + k * 13 + 1);
      this.life.stampFloor(px + Math.cos(a) * d, py + Math.sin(a) * d * 0.8, 70 + 40 * visHash(sd + k * 29 + 2), 0.85);
    }
  }

  bindSim(sim) {
    this.sim = sim;
    this.warmMs = 0;
    this.life.clearFloor();
    this.starterGlade(sim);
    this.life.reset();
    this.ribSet.reset(); this.ribLayer.clear(); if (this.pawLayer) this.pawLayer.clear(); if (this.wolfSt) this.wolfSt.clear();
    this.sway.reset(((sim.seed | 0) ^ 0xa11ce) | 0); // visual seed derived from the run seed; the sim RNG is never touched
    this.air.reset(((sim.seed | 0) ^ 0xa1f10) | 0); // W5 fog / fireflies / motes (own hash stream)
    this.critters.reset(((sim.seed | 0) ^ 0xc41773) | 0); // AL-5 critters (own hash stream)
    this.dawnFx.reset(((sim.seed | 0) ^ 0xda3c5) | 0); // AL-6 dawn chorus (own hash stream)
    this.bossView.reset(sim);
    this.lifeLast = null;
    for (const im of this.lowPool) { im.setAlpha(0); im.dropAt = undefined; }
    const size = app.data.balance.worldSize;
    const cam = this.cameras.main;
    cam.setBounds(0, 0, size, size);
    cam.stopFollow();
    this.camF.ok = false; // own follow (camfollow.js): float, frame-rate independent, device-pixel snapped; no Phaser roundPixels
    cam.centerOn(sim.player.x, sim.player.y);

    this.clearDecor();
    const rng = createRng(sim.seed ^ 0x51ed);
    for (const pt of sim.patches) {
      const img = this.add.image(pt.x, pt.y, 'patch').setScale(((pt.r * 2) / 64) * inv('patch')).setDepth(-500);
      this.decor.push(img);
    }
    this.props.reset(((sim.seed | 0) ^ 0x9e0b5) | 0, [{ x: sim.player.x, y: sim.player.y, tall: START_CLEAR.tall, low: START_CLEAR.low }]); // W4: visual seed from the run seed, sim RNG untouched
    this.playerImg.setTexture(`hero_${sim.characterId}`).setScale(inv(`hero_${sim.characterId}`)).setOrigin(0.5, 0.5).setVisible(true);
    this.heroHit.setVisible(false);
    this.hitFx.reset(); this.hitG.clear(); this.hitGOn = false; this.dens.reset();
    for (const r of this.rigs) r.bind(sim);
    this.rig = this.rigs.find((r) => r.active) || this.rigs[0];
    this.olParts = this.rig.active ? [...this.rig.parts, this.rig.flat] : [this.playerImg]; // OL1: whatever of these is visible this frame gets outlined
    if (this.rig.active) { this.heroBack.setScale((this.rig.backScale ? this.rig.backScale[0] : 1.15) * inv('glow'), (this.rig.backScale ? this.rig.backScale[1] : 1.5) * inv('glow')); }
    this.heroOutA = 0;
    this.parts.clear();
    this.nums.clear();
    this.hitRef = new HitRef();
    this.watch.reset(sim);
    this.fbPing.gem = this.fbPing.magnet = this.fbPing.aoe = -9;
    for (const r of this.rings) r.on = false;
    this.evoBeat = null;
    this.gradeTint = -1;
    this.updateGrade(this.showClock(sim) / app.data.balance.runSeconds);
    this.applyTier();
    for (const p of Object.values(this.pools)) p.clear();
  }

  unbindSim() {
    this.sim = null;
    this.parts.clear();
    this.nums.clear();
    this.playerGlow.setVisible(false);
    this.heroHalo.setVisible(false);
    this.heroBack.setVisible(false);
    this.ring.setVisible(false);
    this.flashR.setVisible(false);
    this.skyR.setVisible(false);
    for (const r of this.rings) r.on = false;
    this.evoBeat = null;
    this.cameras.main.setZoom(this.baseZoom);
    app.freeze = false;
    this.clearDecor();
    this.playerImg.setVisible(false);
    this.heroOut.setVisible(false);
    for (const r of this.rigs) r.hide();
    if (this.enArt) this.enArt.clear();
    this.hideAmbient();
    this.sway.clear();
    this.ribSet.reset(); this.ribLayer.clear(); if (this.pawLayer) this.pawLayer.clear(); if (this.wolfSt) this.wolfSt.clear();
    for (const p of Object.values(this.pools)) p.clear();
    this.groundG.clear();
    this.fxG.clear();
    this.gradeTint = -1;
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
    const o = this.inputOut;
    this.held.axis(o); // CTL1: physical keys held now; opposite keys = the one pressed last wins
    if (app.touch) app.touch.read(o); // analogue stick overrides keys while a finger is down
    if (k && k.SPACE) Phaser.Input.Keyboard.JustDown(k.SPACE); // keep Phaser's own Space flag drained (no longer used for the ability)
    const q = this.abilityQ;
    this.abilityQ = false;
    o.ability = q || (app.touch ? app.touch.takeAbility() : false);
    return o;
  }

  // Swallow any pending Space press while paused (stops it queuing an ability on resume).
  drainAbilityKey() {
    const k = this.keys;
    this.abilityQ = false;
    if (k && k.SPACE) Phaser.Input.Keyboard.JustDown(k.SPACE);
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
    // Auto-tier ignores the first 8 s of a run and the lazy ground-tile build: one-off start-up work (shader/texture uploads, tile slices)
    // looked like a slow device and dropped a capable PC to the Low look for 15 s+.
    const lz = this.bState && this.bState.lazy && !this.bState.lazy.done;
    if (this.sim && this.sim.state === 'running' && !app.paused && dt < 250) this.warmMs = (this.warmMs || 0) + dt;
    if (this.sim && this.sim.state === 'running' && !app.paused && (this.warmMs || 0) > 8000 && !lz && q.sample(dt, this.workMs)) this.applyTier();
    const info = this.perfInfo;
    info.sprites = this.countSprites();
    info.particles = this.parts.count;
    info.tier = q.tier;
    info.mode = q.mode;
    if (this.perf.on) info.input = this.held.describe(); // CTL1 ?debug=1 line: held keys + direction (+ why they were last cleared)
    this.perf.update(dt, this.workMs, info);
  }

  countSprites() {
    if (!this.poolList) this.poolList = Object.values(this.pools);
    let n = 1 + (this.sim ? this.air.count + this.critters.count + this.sway.count : 0);
    for (const pool of this.poolList) n += pool.map.size;
    return n;
  }

  applyTier() {
    const c = this.quality.caps;
    // Lightmap on Med/High if WebGL accepts it; otherwise the Low look (tinted ground + trees, halo pools).
    if (c.lightmap && app.params.lm && !this.lm.rt) this.lm.build(this.scale.width, this.scale.height, this.baseZoom);
    this.lmOn = !!(c.lightmap && app.params.lm && this.lm.ok);
    this.lm.setVisible(this.lmOn);
    // ground blend shader on Med/High when WebGL accepts it; otherwise flat Hollow tile + warm pool sprites
    const wantGb = !!(c.lightmap && app.params.lm && !app.params.flat);
    if (wantGb && !this.gb.sh) this.gb.build(app.data.balance.worldSize, this.life);
    this.gbOn = !!(wantGb && this.gb.ok);
    this.gb.setVisible(this.gbOn);
    this.ground.setVisible(!this.gbOn);
    this.vig.setVisible(c.vignette);
    this.gradeTint = -1;
    if (this.lmOn) this.setGround(0xffffff);
    else this.setGround(this.gradeNow);
    this.gb.setTint(this.lmOn ? 0xffffff : this.gradeNow);
    for (const im of this.lowPool) im.setVisible(false);
    this.parts.setCap(c.particles);
    this.nums.setCap(c.dmgNums);
    this.playerGlow.setVisible(!!this.sim);
    this.heroHalo.setVisible(!!this.sim);
    this.heroBack.setVisible(!!this.sim);
    this.ring.setVisible(!!this.sim);
    // Built-in bloom: High tier only, WebGL only, feature-detected; fails silently.
    const cam = this.cameras.main;
    try {
      if (this.bloom && !(c.bloom && app.params.bloom)) { cam.postFX.remove(this.bloom); this.bloom = null; }
      if (c.bloom && app.params.bloom && !this.bloom && this.renderer.type === Phaser.WEBGL && cam.postFX && typeof cam.postFX.addBloom === 'function') {
        this.bloom = cam.postFX.addBloom(0xffffff, 1, 1, 1, 0.55, 2);
      }
    } catch (err) { this.bloom = null; }
  }

  reducedMotion() { return !!app.save.data.settings.reducedMotion; }

  // S1 Ghost Wolf A (Lantern-Heart Pack): one image + an optional variety overlay per wolf, pose from the sim state (render only, reads the unit).
  // S2: the evolution skin (wolfSkin: gold-rimmed pack, Light Trails streamers, 1.7x Alpha, hollow Echo) picks the frame and size. Feet sit
  // WOLF_FOOT below the sim position. A wolf drawn in front of the hero and overlapping her box drops to 0.55 alpha (DR3 occluders).
  // aMul / rise: the Echo's own fade and rise (world units it still sits below its feet while rising out of the fallen foe).
  drawWolfA(u, p, dt, low, evo = null, aMul = 1, rise = 0) {
    const pl = this.pools, st = this.wolfSt || (this.wolfSt = new Map());
    let s = st.get(u.id);
    if (!s) { s = {}; st.set(u.id, s); }
    s.seen = this.fxTick;
    const fi = low ? 0 : wolfFrame(s, u, dt, this.reducedMotion());
    const sk = wolfSkin(evo, u, low, fi, ALPHA_K);
    const look = wolfLook(u.id, WOLF_JITTER), big = sk.size;
    const k = WOLF_WPD * (big > 1 ? 1 : look.k) * big, dir = u.faceX < 0 ? -1 : 1, fy = u.y + WOLF_FOOT * big + rise;
    // DR3 rule shared with the crowd: within FADE_R of the hero a wolf draws just under her; beyond it, one whose box still overlaps her box
    // from the front drops to 0.55 alpha (never an opaque occluder)
    const near = Math.hypot(u.x - p.x, u.y - p.y) < FADE_R, dy = near ? Math.min(u.y, depthNear(p.y)) : u.y;
    const hl = 8.5 * k / WOLF_WPD; // half the wolf's length (world units)
    const front = !near && u.y > p.y && Math.abs(u.x - p.x) < 12 + hl && fy - 15 * k / WOLF_WPD < p.y + 6 && fy > p.y - 30;
    const a = (u.shade ? 0.5 : front ? 0.55 : 1) * aMul;
    const img = pl.uWolfA.get(u.id);
    img.setFrame(sk.fr).setOrigin(sk.ax, 90 / 96).setPosition(u.x, fy).setDepth(D_LIT + dy).setFlipX(dir < 0).setScale(k / sk.texel).setAlpha(a);
    if (this.bloom && WOLF_SELF > 0 && u.kind !== 'echo') pl.uWolfL.get(u.id).setFrame(sk.fr).setOrigin(sk.ax, 90 / 96).setPosition(u.x, fy).setDepth(D_LIT + dy + 0.0005).setFlipX(dir < 0).setScale(k / sk.texel).setAlpha(a * WOLF_SELF);
    if (sk.ov && look.ov >= 0) {
      const o = (sk.ov === 'lf' ? OV_OFF_LF : OV_OFF)[fi][look.ov];
      pl.uWolfOv.get(u.id).setFrame('wolf_ov' + look.ov).setOrigin(0.5, 90 / 96).setPosition(u.x + o[0] * k * dir, fy + o[1] * k).setDepth(D_LIT + dy + 0.001).setFlipX(dir < 0).setScale(k).setAlpha(a);
    }
    if ((this.fxTick & 127) === 0 && st.size > 64) for (const [id, v] of st) if (this.fxTick - v.seen > 60) st.delete(id);
  }

  // Candle Wheel (Elias): a ring of cream light with a patch of restored colour inside, opening from the centre and
  // fading at the end. Existing primitives only (no new art). Low tier: one disc + one ring. Reduced motion: no opening/pulse.
  drawWheel(g, z, lm, caps, time) {
    const rm = this.reducedMotion();
    const open = rm ? 1 : Math.min(1, z.age / 0.4);
    const e = open * open * (3 - 2 * open);
    const fade = Math.min(1, Math.max(0, z.ttl) / 0.6);
    const R = z.r * e;
    if (R < 1) return;
    const pulse = rm ? 1 : 0.9 + 0.1 * Math.sin(time * 3);
    const warm = hex(z.color);
    if (caps.lights > 0) g.fillStyle(0xbcd88a, 0.16 * fade).fillCircle(z.x, z.y, R * 0.92); // colour returns: restored grass patch
    g.fillStyle(warm, 0.13 * fade * pulse).fillCircle(z.x, z.y, R);
    g.lineStyle(3, warm, 0.22 * fade).strokeCircle(z.x, z.y, R + 1);
    g.lineStyle(1.5, PAL.cream, 0.85 * fade).strokeCircle(z.x, z.y, R);
    if (caps.lights > 0) {
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 2;
        const x = z.x + Math.cos(a) * R, y = z.y + Math.sin(a) * R;
        g.lineStyle(1, warm, 0.18 * fade).lineBetween(z.x, z.y, x, y);
        g.fillStyle(0xffc766, 0.9 * fade).fillCircle(x, y, 2);
      }
    }
    if (lm) lm.add(z.x, z.y, R, warm, 0.55 * fade);
  }

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
    this.addRing(p.x, p.y, 8, 110, 0.55, PAL.thread, 2); // soft warm ring (thread cream, not evolution gold)
    this.burst(p.x, p.y, 16, PAL.thread, 110, 0.7, 0.5);
    this.zoomPunch(0.025, 0.4);
  }

  // Pickup feedback (display-only). Low tier: rings only, no sparkles. All pooled (rings + particles).
  heartFx() {
    const p = this.sim.player;
    this.addRing(p.x, p.y, 6, 34, 0.5, ROLE.heart, 2);
    if (this.quality.tier !== 'low') this.burst(p.x, p.y - 6, 8, ROLE.heart, 60, 0.55, 0.45);
  }

  magnetFx() {
    const p = this.sim.player;
    this.addRing(p.x, p.y, 150, 12, 0.6, ROLE.magnet, 2); // violet pull: contracts toward the hero
    this.addRing(p.x, p.y, 110, 10, 0.5, ROLE.magnet, 1, 0.12);
  }

  // Per frame: numbers for damage taken / healing and gem sparkle. Reads the watcher's rate-limited flags.
  feedback(sim, p) {
    const f = this.watch.step(sim);
    const hud = app.ui && app.ui.hudView;
    if (f.hurt > 0) { // DR1: '-N' above the head on a dark plate, a layer above the weapon numbers
      const fb = this.rig.active ? this.rig.flatBox : null;
      this.nums.spawn(p.x, fb ? p.y + FEET + fb.y0 * DU - 3 : p.y - 18, f.hurt, -1, KIND.HURT, 0, false);
    }
    if (f.heal > 0) this.nums.spawn(p.x - 24, p.y - 20, f.heal, -2, KIND.HEAL, 0, false);
    if (f.gem) {
      if (hud) hud.pulseThread();
      if (this.quality.tier !== 'low') this.burst(p.x, p.y - 4, 3, PAL.teal, 40, 0.35, 0.3);
    }
    if (f.gold && hud) hud.tickCoin();
  }

  // DR1: the sim 'hurt' event (attacker id, kind, position). Starts the light-red outline, the attacker lift and the crescent (render time).
  hurtFx(ev) {
    const sim = this.sim;
    if (!sim) return;
    const p = sim.player;
    this.hitFx.trigger(ev, p.x, p.y);
    const hf = this.hitFx;
    if (hf.kind === 'thorn' && hf.id >= 0) { // the thorn is gone: find the Piper that shot it (if it still lives) and aim the crescent at it
      for (const e of sim.enemies) if (e.id === hf.id && !e.dead) { hf.ax = e.x; hf.ay = e.y; hf.shooter = true; break; }
    }
  }

  // Per frame cues of the latest hit (render dt). `lift` = the attacker's image/enemy if it was drawn this frame.
  tickHit(sim, p, rig, lift, liftE, wv) {
    const hf = this.hitFx;
    const ra = hf.rimA();
    this.heroHit.setVisible(ra > 0.02).setAlpha(ra); // OL1: placed with the cream outline (same per-frame ring texture)
    const aa = hf.arcA();
    const g = this.hitG;
    if (aa > 0.02) {
      const live = lift && liftE && hf.kind !== 'thorn';
      const ang = hf.angle(live ? liftE.x : hf.ax, live ? liftE.y : hf.ay);
      const cx = p.x, cy = p.y + 2;
      g.clear();
      g.lineStyle(5, 0x1a1020, 0.72 * aa).beginPath().arc(cx, cy, 25, ang - 1.05, ang + 1.05).strokePath();
      g.lineStyle(2.6, HIT_RED, aa).beginPath().arc(cx, cy, 25, ang - 1.05, ang + 1.05).strokePath();
      // a thorn whose shooter is off screen (or gone): a small chevron on the view edge, in its direction
      if (hf.kind === 'thorn' && !(hf.shooter && lift)) {
        const ux = Math.cos(ang), uy = Math.sin(ang);
        const tx = Math.abs(ux) > 1e-3 ? ((ux > 0 ? wv.right : wv.x) - 14 - p.x) / ux : 1e9, ty = Math.abs(uy) > 1e-3 ? ((uy > 0 ? wv.bottom : wv.y) - 14 - p.y) / uy : 1e9;
        const d = Math.max(30, Math.min(tx, ty)), qx = p.x + ux * d, qy = p.y + uy * d, nx = -uy, ny = ux;
        g.fillStyle(0x1a1020, 0.8 * aa).fillTriangle(qx + ux * 7, qy + uy * 7, qx - ux * 5 + nx * 7, qy - uy * 5 + ny * 7, qx - ux * 5 - nx * 7, qy - uy * 5 - ny * 7);
        g.fillStyle(HIT_RED, aa).fillTriangle(qx + ux * 5, qy + uy * 5, qx - ux * 3 + nx * 5, qy - uy * 3 + ny * 5, qx - ux * 3 - nx * 5, qy - uy * 3 - ny * 5);
      }
      this.hitGOn = true;
    } else if (this.hitGOn) { g.clear(); this.hitGOn = false; }
    // attacker: lifted above the crowd with a dark rim + light-red rim for 0.3 s (Husk atlas outline frame; flat sprites just lift)
    const la = hf.liftA();
    const art = this.enArt;
    if (la > 0.02 && lift && liftE && art.on && HUSK_TYPES[liftE.type]) {
      if (!this.liftD) {
        this.liftD = this.add.image(0, 0, art.atlas, art.rimName(liftE.type, 0)).setTintFill(0x1a1020);
        this.liftR = this.add.image(0, 0, art.atlas, art.rimName(liftE.type, 0)).setTintFill(HIT_RED);
        this.liftD.rn = this.liftR.rn = '';
      }
      const rn = art.rimName(liftE.type, lift.frn >= 0 ? lift.frn : 0);
      const k = lift.js * art.rimInvT[liftE.type];
      const y = liftE.y + art.foot[liftE.type];
      for (const im of [this.liftD, this.liftR]) {
        if (im.rn !== rn) { im.rn = rn; im.setFrame(rn); }
        im.setScale(k * (im === this.liftD ? 1.35 : 1)).setPosition(liftE.x, y).setFlipX(liftE.faceX < 0).setDepth(D_LIT + LIFT_Z - (im === this.liftD ? 1 : 0.5)).setAlpha(la).setVisible(true);
      }
    } else if (this.liftD && this.liftD.visible) { this.liftD.setVisible(false); this.liftR.setVisible(false); }
  }

  // Rally the Pack: warm amber ring from the lantern, a small flare where the pup sits, an ember puff (no gold: gold is for evolutions).
  rallyMoment() {
    const p = this.sim.player;
    this.addRing(p.x, p.y, 8, 100, 0.5, ROLE.lantern, 2);
    this.addRing(p.x - 8 * p.faceX, p.y + 4, 3, 22, 0.4, ROLE.lanternCore, 2, 0.1); // pup howl
    if (!this.reducedMotion()) this.burst(p.x, p.y - 4, 10, ROLE.lantern, 80, 0.6, 0.45);
  }

  // E9 evolution pick beat (render-only, ~0.55 s): a soft pulse ring from the hero in the weapon's role colour, a faint gold flash, and a thin gold
  // rim on the evolved weapon's units (drawn in draw(), never on enemies). Calm motion: no ring, flash, particles or rim (the HUD plate carries it).
  evolveMoment(evoId) {
    const p = this.sim.player;
    const evo = evoId && app.data.evolutions[evoId];
    const wdef = evo && app.data.weapons[evo.weapon];
    const col = wdef && /^#[0-9a-f]{6}$/i.test(wdef.color) ? hex(wdef.color) : PAL.gold;
    if (this.reducedMotion()) { this.evoBeat = null; return; }
    this.flash(PAL.gold, 0.12, 0.35);
    this.addRing(p.x, p.y, 8, 150, 0.55, col, 3);
    this.addRing(p.x, p.y, 8, 100, 0.45, ROLE.evo, 1, 0.08);
    if (this.quality.tier !== 'low') this.burst(p.x, p.y, 14, col, 110, 0.6, 0.6);
    this.zoomPunch(0.03, 0.5);
    this.evoBeat = { w: evo ? evo.weapon : '', t: 0, life: 0.55 };
  }

  // display clock for the arc light + AL-6: holds at 14:00 in the boss fight, runs to dawn across the victory flood (bossview.js)
  showClock(sim) { return this.bossView ? this.bossView.clock(sim) : sim.time; }

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
    this.ground.setTint(this.lmOn ? col : dimTint(col, LOW_GROUND_K)); // W1: the flat tile is authored at daylight brightness, so Low darkens it a little more than the trees
    this.gb.setTint(col);
    for (const d of this.decor) d.setTint(col);
    this.props.setTint(this.lmOn ? 0xffffff : col);
  }

  // Colour-grade for the current point in the run. Quantised so we only touch objects when it changes.
  updateGrade(f) {
    let col, dw;
    if (app.params.arc) {
      const q = Math.round(f * 900) / 900; // WL6a: 1 s steps so the sky never visibly steps
      // WL6a arc: brightness setting (Normal / Brighter / Clear; 'auto' = Brighter on phones), quantised to 1 s steps, resampled only when something changed
      const st = app.save.data.settings;
      const mode = app.params.bright || resolveBrightness(st.brightness, this.phone);
      const calm = !!st.reducedMotion;
      const key = Math.round(q * 900) * 8 + (mode === 'brighter' ? 1 : mode === 'clear' ? 2 : 0) * 2 + (calm ? 1 : 0);
      if (key !== this.arcKey) { this.arcKey = key; arcSample(q * 900, mode, calm, this.arc); this.arcVer = (this.arcVer | 0) + 1; }
      col = this.arc.low;
      this.ambient = this.arc.amb;
      dw = this.arc.dawn;
    } else {
      const q = Math.round(f * 150) / 150;
      col = gradeAt(q);
      this.ambient = ambientAt(q);
      dw = f > 0.7 ? Math.min(1, (f - 0.7) / 0.3) * 0.36 : 0;
    }
    this.gradeNow = col;
    if (dw > 0 && this.lmOn) this.dawn.setVisible(true).setAlpha(dw);
    else if (this.dawn.visible) this.dawn.setVisible(false);
    if (!this.lmOn) this.setGround(col);
  }

  tickFx(dt) {
    const sim = this.sim;
    const cam = this.cameras.main;
    const st = app.save.data.settings;
    this.nums.enabled = !!st.damageNumbers && app.params.nums;
    this.nums.reduced = !!st.reducedMotion;
    this.parts.update(dt);
    this.nums.update(dt);
    this.hitFx.update(dt);
    // zoom punch: quick rise, smooth fall
    if (this.zoomT < this.zoomDur) {
      this.zoomT += dt;
      const k = Math.min(1, this.zoomT / this.zoomDur);
      const e = k < 0.12 ? k / 0.12 : (1 - k) * (1 - k) * 1.2;
      cam.setZoom(this.baseZoom * this.bossView.zoomK() * (1 + this.zoomAmp * Math.min(1, e)));
    } else if (cam.zoom !== this.baseZoom * this.bossView.zoomK()) cam.setZoom(this.baseZoom * this.bossView.zoomK()); // boss fight: -8% (portrait: its own zoom), eased
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

  // Debug section timers (ms per frame, indexed by SEC_*); cheap performance.now pairs, read by scripts/pace.mjs.
  sec0(i) { this.secT[i] = performance.now(); if (this.secMem) this.secH[i] = performance.memory.usedJSHeapSize; }
  sec1(i) { this.sec[i] = performance.now() - this.secT[i]; if (this.secMem) { const d = performance.memory.usedJSHeapSize - this.secH[i]; if (d > 0) this.secA[i] += d; } }

  update(time, delta) {
    this.measure();
    if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.ESC)) app.togglePause();
    const dt = Math.min(delta, 100) / 1000;
    this.hitCool = Math.max(0, this.hitCool - dt);
    app.freeze = this.hitStop > 0;
    if (this.hitStop > 0) this.hitStop -= dt;
    this.sec0(0);
    app.frame(dt);
    this.sec1(0);
    // W1b: paint the Deep Forest Floor tiles on the title / menus (idle frames), so a run normally starts with them done
    if (!this.sim) { const b = this.bState; if (b && b.ready < 1 && STYLE === 'a') { if (!b.lazy) b.lazy = makeGroundLazy(this); if (!b.lazy.done && b.lazy.step(4)) b.fade = 0; } }
    if (this.sim) {
      this.sec0(1);
      this.draw();
      this.sec1(1);
      this.sec0(7);
      this.tickFx(dt);
      this.sec1(7);
    }
  }

  draw() {
    const sim = this.sim;
    const p = sim.player;
    const pl = this.pools;
    const caps = this.quality.caps;
    if (!this.poolList) this.poolList = Object.values(pl);
    for (const pool of this.poolList) pool.begin();
    this.fxTick = (sim.time * 30) | 0;

    const wv = this.cameras.main.worldView;
    const vx0 = wv.x - 40;
    const vy0 = wv.y - 40;
    const vx1 = wv.right + 40;
    const vy1 = wv.bottom + 40;
    sim.view.hw = wv.width / 2; sim.view.hh = wv.height / 2; // EN3-EN5: telegraph enemies only start a tell inside the real camera view
    let halos = 0;

    this.updateGrade(this.showClock(sim) / app.data.balance.runSeconds);
    this.sec0(8); this.tickAmbient(sim); this.sec1(8);
    const lm = this.lm;
    const lit = this.lmOn;
    if (lit) lm.begin(wv.centerX, wv.centerY, this.cameras.main.zoom, caps.lights);

    // player: lantern pool + ground ring (readability) + lantern light
    { const cam = this.cameras.main, ct = this.bossView.camTarget(p.x, p.y, cam.width / cam.zoom / 2, cam.height / cam.zoom / 2); followStep(this.camF, ct[0], ct[1], Math.min(this.game.loop.delta, 100) / 1000, cam.zoom, cam.width, cam.height); cam.setScroll(this.camF.sx, this.camF.sy); }
    this.sec0(2); this.tickLife(sim, p); this.sec1(2);
    this.sec0(3); this.tickSway(sim, p, caps); this.sec1(3);
    this.sec0(4); this.tickProps(sim, p, caps); this.sec1(4);
    const rig = this.rig.active;
    if (rig) this.rig.update(sim, this.quality.tier, this.reducedMotion(), Math.min(this.game.loop.delta, 100) / 1000, caps, this.parts);
    else {
      this.playerImg.setPosition(p.x, p.y).setDepth(D_LIT + p.y).setFlipX(p.faceX < 0);
      this.playerImg.setAlpha(iframeFlick(p.iframes, sim.time, sim.state === 'defeat') ? FLICK_ALPHA : 1);
    }
    const lx = rig ? this.rig.emberX : p.x; // the ember is her lantern light
    const ly = rig ? this.rig.emberY : p.y - 4;
    const lowHp = p.hp > 0 && p.hp / p.maxHp < 0.3;
    if (this.playerGlow.visible) this.playerGlow.setPosition(lx, ly).setAlpha((lit ? 0.3 : 0.3) + 0.03 * Math.sin(sim.time * 2.5));
    if (this.sim) {
      const ha = rig ? heroHaloAlpha(this.quality.tier, this.reducedMotion(), lowHp, sim.time) : 0;
      this.heroHalo.setVisible(ha > 0).setPosition(p.x, p.y + 9).setAlpha(ha);
      this.heroBack.setVisible(rig).setPosition(p.x, p.y + (this.rig.backY ?? -6)).setDepth(D_LIT + p.y - 0.5);
    }
    if (this.ring.visible) {
      const pulse = 0.5 + 0.5 * Math.sin(sim.time * (lowHp ? 18.85 : 6.283));
      this.ring.setPosition(p.x, p.y + 10).setTint(lowHp ? PAL.danger : ROLE.lantern).setAlpha(0.45 + 0.2 * pulse);
    }
    {
      const target = app.params.arc ? lanternTarget(this.arc.lan, lowHp, this.arc.y) : (lowHp ? 90 : 130);
      this.lanR += (target - this.lanR) * Math.min(1, this.game.loop.delta / 400);
    }
    if (lit) {
      const fl = 1 + 0.03 * (Math.sin(sim.time * 44) + Math.sin(sim.time * 69)) * 0.5; // 7 Hz + 11 Hz
      lm.add(lx, ly, this.lanR * fl, ROLE.lantern, 0.9);
      if (rig && this.rig.hasPup) lm.add(this.rig.pupX, this.rig.pupY - 5, 24, ROLE.lantern, 0.5); // the pup's own small warm light
    }

    const g = this.groundG;
    const fx = this.fxG;
    g.clear();
    fx.clear();
    this.teleG.clear();
    const nl = this.nl;
    const nlOn = !!(app.params.arc && app.params.night);
    if (nlOn) nl.prepare(sim, lx, ly, this.lanR, this.quality.tier, this.arc, this.enArt.on);
    else if (this.nlOn) nl.hide();
    this.nlOn = nlOn;

    // drain hit/kill records into numbers + puffs + hit-stop
    const art = this.enArt;
    if (!art.on && HUSK_BAKE.ready) art.enable(true);
    const nh = sim.hitN;
    sim.hitN = 0;
    let nd = 0, top1 = 0, top2 = 0;
    for (let i = 0; i < nh; i++) { const h = sim.hitBuf[i]; if (h.kill) continue; nd++; if (h.a > top1) { top2 = top1; top1 = h.a; } else if (h.a > top2) top2 = h.a; }
    const aoe = nd > 5, aoeMin = top2;
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
          if (art.on) { // EN1/EN2 death beat: mask pops off, the freed body sinks, a warm mote rises (the enemy's image is still in its pool this frame)
            let ty = null, ent = null;
            for (let hi = 0; hi < HUSK_IDS.length && !ent; hi++) { ty = HUSK_IDS[hi]; ent = pl[ty].map.get(h.id); }
            if (ent && ent.img.aid === h.id) art.kill(ent.img, ty, this.quality.tier, this.swayPhone, this.reducedMotion(), D_LIT, 'glow', inv('glow'), ADD);
          }
        }
        continue;
      }
      const big = h.boss ? h.a >= h.mx * 0.01 : h.a >= 20 && h.a >= h.mx * 0.5;
      this.hitRef.add(h.a);
      if (skipSmallNumber(this.dens.k, h.a, this.hitRef.ref, Math.hypot(h.x - p.x, h.y - p.y))) continue; // DR3: small numbers near the hero wait while the crowd is thick
      // AoE (> 5 non-kill hits in one frame): only the 2 biggest get a number, plus one soft ring (research 28 s3)
      if (aoe && h.a < aoeMin) continue;
      this.nums.spawn(h.x, h.y, h.a, h.id, KIND.DMG, big ? 0 : this.hitRef.ref, big);
      if (h.boss ? h.a >= h.mx * 0.03 : big && h.a >= 40) this.stop(0.05);
    }
    if (aoe && sim.time - this.fbPing.aoe > 0.3) { this.fbPing.aoe = sim.time; this.addRing(p.x, p.y, 6, 70, 0.35, PAL.cream, 1); }
    this.feedback(sim, p);

    // zones
    for (const z of sim.zones) {
      if (z.wheel) { this.drawWheel(g, z, lit ? lm : null, caps, sim.time); continue; }
      const c = hex(z.color);
      const a = Math.min(1, z.ttl);
      g.fillStyle(c, 0.14 * a).fillCircle(z.x, z.y, z.r);
      g.lineStyle(1, c, 0.6 * a).strokeCircle(z.x, z.y, z.r);
      if (lit) lm.add(z.x, z.y, z.r, c, 0.55 * a);
    }
    // W5 Sanctum Halo: faint ember glow on the burning ground inside the candle ring, thin gold rim on the ring only (never on enemies); still, no flicker
    const hw = sim.weapons.find((w) => w.evo === 'sanctum_halo');
    if (hw && hw.rt.ground) {
      const hr = hw.rt.ground.r;
      g.fillStyle(0xffb35c, 0.07).fillCircle(p.x, p.y, hr);
      g.fillStyle(ROLE.burn, 0.05).fillCircle(p.x, p.y, hr * 0.62);
      g.lineStyle(1, 0xffd27a, 0.32).strokeCircle(p.x, p.y, hr);
      if (lit) lm.add(p.x, p.y, hr, 0xffb35c, 0.35);
    }

    // W12 Vesper Tide (render only, reads rt.tide): a thin gold rim on the EVOLVED ring only (never on enemies), a soft lilac halo that swells
    // with the ring, and a fading ripple left at the crest as the ring draws back. Calm motion: rim only (no halo growth, no ripple). Low: rim + faint halo, no ripple.
    const tw = sim.weapons.find((w2) => w2.evo === 'vesper_tide');
    if (tw && tw.rt.tide) {
      const T = tw.rt.tide, calm = this.reducedMotion(), grow = Math.max(0, Math.min(1, (T.r - 14) / 100));
      g.lineStyle(1, 0xffd27a, T.out ? 0.5 : 0.28).strokeCircle(p.x, p.y, T.r);
      if (!calm) {
        g.fillStyle(ROLE.spiritC, (T.out ? 0.05 : 0.025) + 0.07 * grow).fillCircle(p.x, p.y, T.r);
        if (this.tideWas && !T.out && caps.drips > 0 && T.r > 30) this.tideRip = { r: T.r, t0: sim.time };
        const rip = this.tideRip;
        if (rip && caps.drips > 0) {
          const k = (sim.time - rip.t0) / 0.5;
          if (k >= 1) this.tideRip = null;
          else g.lineStyle(2, ROLE.spiritC, 0.45 * (1 - k)).strokeCircle(p.x, p.y, Math.max(8, rip.r - 28 * k));
        }
      }
      this.tideWas = T.out;
      if (lit) lm.add(p.x, p.y, T.r + 14, ROLE.spiritC, 0.25 + 0.2 * grow);
    } else { this.tideWas = false; this.tideRip = null; }

    // gems: culled to the view, gently pulsing with a soft halo (Med/High)
    let gemGlow = 0;
    for (const gem of sim.gems) {
      if (gem.x < vx0 || gem.x > vx1 || gem.y < vy0 || gem.y > vy1) continue;
      const big = gem.v >= 10 ? 1.7 : gem.v >= 3 ? 1.25 : 1;
      const pulse = 1 + 0.1 * Math.sin(sim.time * 5 + gem.id);
      pl.gem.get(gem.id).setPosition(gem.x, gem.y).setDepth(D_LIT - 100).setScale(big * pulse * pl.gem.inv);
      if (gemGlow < caps.gemGlow) {
        gemGlow++;
        pl.haloG.get(gem.id).setPosition(gem.x, gem.y).setTint(ROLE.pickup).setScale(0.7 * big * pulse * pl.haloG.inv).setAlpha(0.5 + 0.15 * Math.sin(sim.time * 5 + gem.id));
      }
    }

    for (const k of sim.pickups) {
      const bob = Math.sin(sim.time * 5 + k.id) * 1.5;
      pl[k.type].get(k.id).setPosition(k.x, k.y + bob).setDepth(D_LIT - 90).setAlpha(k.ttl < 6 && Math.floor(k.ttl * 6) % 2 ? 0.35 : 1);
      if (caps.gemGlow) pl.haloG.get(k.id).setPosition(k.x, k.y + bob).setTint(k.type === 'magnet' ? ROLE.magnet : ROLE.heart).setScale(0.9 * pl.haloG.inv).setAlpha(0.4 + 0.15 * Math.sin(sim.time * 4));
    }

    // enemies (culled to the view; boss always drawn)
    let crowd = 0;
    let cold = 0;
    let dripN = 0, bleedNums = 0;
    const dripCap = this.reducedMotion() ? 0 : caps.drips;
    const coldCap = this.gbOn ? (caps.halos >= 160 ? 80 : 40) : 0;
    const life = this.life;
    let ei = -1;
    let liftImg = null, liftE = null;
    const NEAR2 = FADE_R * FADE_R; const dk = this.dens.k * quietScale(this.arc.bodyK), mustOf = this.mustOf, mrCap = MUST_OUT_CAP[this.quality.tier] ?? 0; let near120 = 0, inView = 0, mrN = 0;
    const wb = this.wolfBudget; wb.reset();
    const wolfE = this.wolfE;
    const hitId = this.hitFx.liftA() > 0.02 ? this.hitFx.id : -2;
    const lowT = this.quality.tier === 'low';
    art.update(Math.min(0.1, this.game.loop.delta / 1000));
    for (const e of sim.enemies) {
      ei++;
      if (ei < 512) art.fi[ei] = 255;
      if (!e.boss && (e.x < vx0 || e.x > vx1 || e.y < vy0 || e.y > vy1)) continue;
      const img = pl[e.type].get(e.id);
      const mr = mustOf[e.type] === true;
      const d2n = (e.x - p.x) * (e.x - p.x) + (e.y - p.y) * (e.y - p.y);
      img.setPosition(e.x, e.y).setDepth(D_LIT + (d2n < NEAR2 ? depthNear(p.y) : depthOf(e.y, mr))).setFlipX(e.faceX < 0); // DR3: must-react types sort above the common swarm; anything piled on the hero draws under her
      inView++;
      if (e.id === hitId) { liftImg = img; liftE = e; img.setDepth(D_LIT + LIFT_Z); } // DR1: the enemy that hit is lifted above the crowd for 0.3 s
      const husk = art.on && HUSK_TYPES[e.type] !== undefined;
      if (husk) art.apply(img, e, ei, sim.time, lowT);
      if (cold < coldCap) { // W3 cold enemy glow: only on ink-dark ground, soft, steady (no flicker); helps dark enemies separate from the ink
        const cc = life.sampleCorr(e.x, e.y) * (1 - Math.min(1, life.sample(e.x, e.y) * 1.5));
        if (cc > 0.25) { cold++; pl.haloC.get(e.id).setPosition(e.x, e.y + 2).setScale((e.boss ? 3 : 1.1) * pl.haloC.inv).setAlpha(Math.min(0.3, (cc - 0.2) * 0.45)); }
      }
      // lit state: white flash > bleed > distance tint (min 0.62, 16 steps so setTint only runs on change)
      let tq;
      const ddx = e.x - p.x;
      const ddy = e.y - p.y;
      const d2 = ddx * ddx + ddy * ddy;
      if (!e.boss) {
        if (d2 < 256) crowd++;
        if (d2 < 14400) near120++;
        img.setAlpha(enemyAlpha(d2 < 1936 ? Math.sqrt(d2) : 1e9, dk, mr)); // DR3: common swarm quieter in a thick crowd; anything over the hero fades (she and her hits show)
      }
      if (e.flash > 0) tq = 100;
      else if (e.bleedT > 0) tq = 101;
      else if (e.markT > 0 && !e.boss) tq = 102; // W8b Mark: light violet body tint (all tiers, static; boss only gets the omen)
      else if (nlOn && !e.boss && ei < 512) tq = 200 + nl.tq[ei]; // WL6b: cool far tint from the arc, blended by how lit the enemy is (boss: never tinted)
      else if (lit && !e.boss) {
        tq = d2 >= 28900 ? 10 : Math.round((0.62 + 0.38 * (1 - Math.sqrt(d2) / 170)) * 16);
      } else tq = 0;
      if (img.tq !== tq || (tq >= 200 && img.tv !== nl.ver)) {
        img.tq = tq;
        img.tv = nl.ver;
        const jv = husk ? img.jv * (this.arc.bodyK < 1 ? HUSK_TYPES[e.type].dayK : 1) : 1; // EN1/EN2: per-instance body value jitter so a pack is not clones (visual only, from the id); dayK = daylight body darkening per type (WL6d G2)
        if (tq >= 200) img.setTint(img.lastTint = mulTint(nl.tab[tq - 200], jv));
        else if (tq === 100) img.setTintFill(0xffffff);
        else if (tq === 102) img.setTint(ROLE.markTint);
        else if (tq === 101) img.setTint(ROLE.bleedTint); // blood red (Matt 2026-10-16), shared with bleed numbers and drips
        else if (tq === 0) { if (jv === 1) img.clearTint(); else img.setTint(img.lastTint = mulTint(0xffffff, jv)); }
        else { const v = Math.min(255, tq * 16 - 1); img.setTint(img.lastTint = mulTint((v << 16) | (v << 8) | v, jv)); }
      }
      if (mr && mrN < mrCap && husk) { // DR3: cream outline on the must-react types (shape cue, not colour alone), Husk atlas outline frame
        let om = this.mrOut[mrN];
        if (!om) { om = this.mrOut[mrN] = this.add.image(0, 0, art.atlas, art.rimName(e.type, 0)).setTintFill(ROLE.lanternCore); om.rn = ''; }
        const rn = art.rimName(e.type, img.frn >= 0 ? img.frn : 0);
        if (om.rn !== rn) { om.rn = rn; om.setFrame(rn); }
        om.setScale(img.js * art.rimInvT[e.type] * 1.12).setPosition(e.x, e.y + art.foot[e.type]).setFlipX(e.faceX < 0).setDepth(img.depth - 0.4).setAlpha(0.85 * img.alpha).setVisible(true);
        mrN++;
      }
      if (lit && e.boss) lm.add(e.x, e.y - 10, app.params.arc ? bossLightRadius(this.arc.y) : 90, ROLE.bossEye, 0.8);
      // bleed readout (visual only; reads the sim's running bleedTot): ~2 small pale-blue numbers a second per bleeding enemy
      // (batched, never per tick), plus drips of wolf light while it bleeds (not on Low, not with reduced motion)
      if (img.bid !== e.id) { img.bid = e.id; img.bLast = e.bleedTot; img.bNext = sim.time + 0.5; }
      if (e.bleedT > 0) {
        if (dripN < dripCap) {
          dripN++;
          const ph = (sim.time * 1.6 + e.id * 0.37) % 1;
          const dx0 = ((e.id * 7) % 9) - 4;
          fx.fillStyle(ROLE.bleed, 0.85 * (1 - ph)).fillRect(Math.round(e.x + dx0), Math.round(e.y - 4 + ph * 12), 1, 2);
        }
        if (sim.time >= img.bNext && bleedNums < 6) { // at most 6 per frame; the pool caps the rest and drops these first
          const d = e.bleedTot - img.bLast;
          if (d >= 1) { img.bLast = e.bleedTot; img.bNext = sim.time + 0.5; bleedNums++; this.nums.spawn(e.x, e.y - e.r - 2, d, e.id + 0.5, KIND.BLEED, 0, false); }
          else img.bNext = sim.time + 0.25;
        }
      } else if (img.bLast !== e.bleedTot) {
        const d = e.bleedTot - img.bLast; img.bLast = e.bleedTot; // the last short tail after the bleed ends
        if (d >= 1 && bleedNums < 6) { bleedNums++; this.nums.spawn(e.x, e.y - e.r - 2, d, e.id + 0.5, KIND.BLEED, 0, false); }
      }
      // burn readout (Elias; visual only, reads burnT / burnTot): 1-2 lilac flame licks rising off the foe (share the drip tier cap,
      // none with reduced motion, Low = none) plus ~2 small lilac numbers a second (batched)
      if (img.uid !== e.id) { img.uid = e.id; img.uLast = e.burnTot; img.uNext = sim.time + 0.5; }
      if (e.burnT > 0) {
        if (dripN < dripCap) {
          dripN++;
          const ph = (sim.time * 2.2 + e.id * 0.31) % 1;
          const lx = Math.round(e.x + ((e.id * 5) % 7) - 3);
          const ly = Math.round(e.y - e.r * 0.4 - ph * 9);
          fx.fillStyle(ROLE.burn, 0.9 * (1 - ph)).fillRect(lx, ly, 2, 3);
          fx.fillStyle(ROLE.burnHot, 0.8 * (1 - ph)).fillRect(lx, ly + 1, 1, 1);
        }
        if (sim.time >= img.uNext && bleedNums < 6) {
          const d = e.burnTot - img.uLast;
          if (d >= 1) { img.uLast = e.burnTot; img.uNext = sim.time + 0.5; bleedNums++; this.nums.spawn(e.x, e.y - e.r - 6, d, e.id + 0.25, KIND.BURN, 0, false); }
          else img.uNext = sim.time + 0.25;
        }
      } else if (img.uLast !== e.burnTot) {
        const d = e.burnTot - img.uLast; img.uLast = e.burnTot;
        if (d >= 1 && bleedNums < 6) { bleedNums++; this.nums.spawn(e.x, e.y - e.r - 6, d, e.id + 0.25, KIND.BURN, 0, false); }
      }
      // W8b Mark omen (reads markT only): a small violet chevron hovering over the head; blinks in its last 0.6 s. Shares the drip tier cap
      // (none on Low, which keeps just the tint) and is not drawn under reduced motion (static tint stays).
      if (e.markT > 0 && dripN < dripCap) {
        dripN++;
        const bob = Math.sin(sim.time * 6 + e.id) * 1.2;
        const a = e.markT < 0.6 ? (Math.floor(sim.time * 12) % 2 ? 0.25 : 0.9) : 0.9;
        const mx = Math.round(e.x), my = Math.round(e.y - e.r - (e.boss ? 14 : 9) + bob), k = e.boss ? 2 : 1;
        fx.fillStyle(0x2a1d3a, a * 0.85).fillTriangle(mx - 5 * k, my - 4 * k, mx + 5 * k, my - 4 * k, mx, my + 3 * k); // dark outline so it reads on grass and on pale foes
        fx.fillStyle(ROLE.mark, a).fillTriangle(mx - 4 * k, my - 3 * k, mx + 4 * k, my - 3 * k, mx, my + 1.5 * k);
      }
      // W9 Wall of Wings fear tell (reads fearT; never on a boss): two pale feathers drifting off the foe (share the drip cap, none with
      // reduced motion / Low) and wide pale eye-points that blink slowly (static under reduced motion)
      if (e.fearT > 0 && !e.boss) {
        if (dripN < dripCap) {
          dripN++;
          for (let fi2 = 0; fi2 < 2; fi2++) {
            const ph = (sim.time * 1.8 + e.id * 0.29 + fi2 * 0.5) % 1;
            const fx0 = Math.round(e.x + (fi2 ? 1 : -1) * (3 + ph * 6)), fy0 = Math.round(e.y - e.r - ph * 8);
            fx.fillStyle(ROLE.spiritB2, 0.85 * (1 - ph)).fillTriangle(fx0, fy0 - 2, fx0 + 2, fy0, fx0, fy0 + 2);
          }
        }
        if (this.reducedMotion() || Math.floor(sim.time * 5 + e.id) % 2 === 0) {
          const ey = Math.round(e.y - e.r * 0.35);
          fx.fillStyle(0xf2ecff, 0.9).fillRect(Math.round(e.x) - 3, ey, 1, 1).fillRect(Math.round(e.x) + 2, ey, 1, 1);
        }
      }
      if (e.tele) {
        const thr = threatens(e, p); // DR2: only a warning that will actually reach the hero is bright
        if (e.boss) {
          const bf = thr ? 1 : TELE_FAINT;
          g.fillStyle(TELL_RO, 0.2 * bf).fillCircle(e.x, e.y, 74);
          this.teleG.lineStyle(1, TELL_RO, 0.9 * bf).strokeCircle(e.x, e.y, 74);
        } else if (e.ai) drawEnemyTells(this.teleG, e, this.reducedMotion(), thr);
        else { const wi = wb.add(d2, thr); if (wi >= 0) { wolfE[wi] = e; } } // Fell Wolf lunge: budgeted chevrons, drawn after the loop
      }
    }

    for (let oi = mrN; oi < this.mrN; oi++) if (this.mrOut[oi]) this.mrOut[oi].setVisible(false);
    this.mrN = mrN;
    this.dens.update(near120, inView, Math.min(this.game.loop.delta, 100) / 1000);
    wb.plan();
    for (let wi = 0; wi < wb.n; wi++) { const md = wb.mode[wi]; if (md) drawWolfChevron(this.teleG, wolfE[wi], md); wolfE[wi] = null; }

    if (sim.eshots.length) drawThorns(this.teleG, sim.eshots, vx0, vy0, vx1, vy1, this.quality.tier === 'low');
    // Elder Treant fight (gfx/boss/bossview.js): ring, roots, brush, the boss art, its tells (DR2 shared style, above the vignette), the victory flood
    this.bossView.update(sim, Math.min(this.game.loop.delta, 100) / 1000, this.quality.tier, this.reducedMotion(), lit ? lm : null, this.life, wv);
    if (sim.fight) this.bossView.drawTells(this.teleG, sim, this.reducedMotion());
    if (this.bossView.usingArt && sim.boss) { const bs = pl.elder_treant.map.get(sim.boss.id); if (bs) bs.img.setVisible(false); } // the baked First Husk replaces the flat placeholder

    if (nlOn) {
      const nc = this.nlc;
      nc.tier = this.quality.tier; nc.calm = this.reducedMotion(); nc.time = sim.time; nc.hx = p.x; nc.hy = p.y;
      nc.vx0 = vx0; nc.vy0 = vy0; nc.vx1 = vx1; nc.vy1 = vy1; nc.art = art.on ? art : null; nc.bloom = !!this.bloom; // socket eyes: hot glow frame under the High bloom
      nl.draw(sim, nc);
    }

    // silhouette pass: when 3+ enemies crowd the hero, a baked outline fades in above everyone
    const oa = this.heroOutA + (heroOutTarget(crowd >= 3) - this.heroOutA) * Math.min(1, this.game.loop.delta / 120); // DR3: always on, stronger when crowded
    this.heroOutA = oa;
    this.tickHit(sim, p, rig, liftImg, liftE, wv);
    if (oa > 0.02 || this.heroHit.visible) { // OL1: rebuilt from the parts exactly as drawn this frame (facing, lean, bob, squash, limbs, ember)
      const c = this.heroLine.build(this.olParts, this.olParts.length, p.x, rig ? p.y + FEET : p.y);
      this.heroOut.setPosition(c.x, c.y);
      this.heroHit.setPosition(c.x, c.y);
    }
    this.heroOut.setVisible(oa > 0.02).setAlpha(oa);

    // spirit trails tick at ~30 Hz
    const trailOn = caps.trails > 0 && this.parts.count < this.parts.cap * 0.75 && !this.reducedMotion();
    let trailBudget = 0;
    if (trailOn && this.fxTick !== this.trailTick) {
      this.trailTick = this.fxTick;
      if (caps.trails === 2 || (this.fxTick & 1) === 0) trailBudget = caps.trails === 2 ? 16 : 7;
    }
    const ribOn = !!(app.params.trails && this.ribCaps && this.ribCaps.segs > 0 && this.ribCaps.spirits.n > 0);
    let nSrc = 0;
    const ribAdd = (u, col, life, fast) => { if (!ribOn || nSrc >= this.ribSrc.length) return; const r = this.ribSrc[nSrc++]; r.id = u.id; r.x = u.x; r.y = u.y + 1; r.col = col; r.life = life; r.fast = !!fast; };
    const trail = (x, y, col, s) => {
      if (trailBudget <= 0) return;
      trailBudget--;
      this.parts.emit(x, y, 0, 0, 0.32, s, 0.05, col, 0.5);
    };

    // W9 raven evolutions (visual only, reads the sim): thin gold rim on the EVOLVED flock only; Wall of Wings draws its two counter-rotating
    // violet rings (dashed arcs on Med/High, still circles on Low and with reduced motion)
    const rvw = sim.weapons.find((w2) => w2.id === 'raven_flock');
    const rvEvo = rvw ? rvw.evo : null;
    if (rvEvo === 'murder_storm' && rvw.rt.wallR) {
      const spin = rvw.rt.wang || 0, still = this.reducedMotion() || caps.drips === 0;
      for (let ri = 0; ri < 2; ri++) {
        const rr = rvw.rt.wallR[ri];
        if (still) { fx.lineStyle(1, ROLE.spiritB, 0.2).strokeCircle(p.x, p.y, rr); continue; }
        fx.lineStyle(1, ROLE.spiritB, 0.32);
        const a0 = (ri ? -spin : spin) * 0.5;
        for (let k = 0; k < 8; k++) { const s0 = a0 + (k * Math.PI) / 4; fx.beginPath(); fx.arc(p.x, p.y, rr, s0, s0 + 0.42); fx.strokePath(); }
      }
    }

    // summons: bright (above the grade) + additive halo
    let echoN = 0;
    const wolfArt = SUM_ART.wolf && !!this.sumAtlas; // S1 Lantern-Heart wolves once the art is baked (?summons=0: never)
    const lowWolf = this.quality.tier === 'low';
    const wdt = Math.max(0, Math.min(0.1, sim.time - (this.wolfT ?? sim.time))); this.wolfT = sim.time;
    const wwv = sim.weapons.find((w) => w.id === 'ghost_wolves');
    const wEvo = wwv ? wwv.evo : null;
    if (wEvo === 'phantom_stampede' && caps.trail && caps.trail.dots > 0 && wwv.rt.trail) { // Low tier: faint paw dots instead of ribbons (hit zone unchanged)
      const tr = wwv.rt.trail;
      for (let i = tr.length - 1, k = 0; i >= 0 && k < caps.trail.dots; i -= 3, k++) fx.fillStyle(ROLE.spiritA, 0.3 * (tr[i].t / (tr[i].l || 1))).fillCircle(tr[i].x, tr[i].y, 2);
    }
    for (const u of sim.units) {
      if (u.hidden) { if (u.kind === 'orb') g.fillStyle(ROLE.burn, 0.35).fillCircle(u.x, u.y, 1.6); continue; } // W6: a resting Judgement Wheel light shows as a tiny lilac ember until it re-forms
      if (u.x < vx0 || u.x > vx1 || u.y < vy0 || u.y > vy1) continue;
      if (u.kind === 'wolf') {
        if (wolfArt) this.drawWolfA(u, p, wdt, lowWolf, wEvo);
        else pl.uWolf.get(u.id).setPosition(u.x, u.y).setDepth(D_LIT + u.y).setFlipX(u.faceX < 0).setScale((u.r / 4) * 0.88 * pl.uWolf.inv).setAlpha(u.shade ? 0.5 : u.r > 6 ? 0.78 : 0.85); // A1b: render-only 12% smaller / dimmer so Wren is the focal point (hitbox u.r unchanged)
        if (wolfArt ? !lowWolf && halos++ < caps.halos : halos++ < caps.halos) pl.haloU.get(u.id).setPosition(u.x, u.y - (wolfArt ? 1 : 0)).setTint(wolfArt ? WOLF_GLOW : ROLE.spiritA).setScale((u.r > 6 ? 5 : u.r / 4 * (wolfArt ? WOLF_HALO_K : 1.12)) * pl.haloU.inv).setAlpha(u.r > 6 ? 0.45 : wolfArt ? WOLF_HALO_A : 0.62); // the great wolf keeps a modest halo so its body still reads (S1: Low flats have the glow baked in, no halo)
        if (wolfArt) { /* S2: gold rim, frost mane and streamers are baked into the evolved frames (wolfSkin) */ } else if (wEvo === 'phantom_stampede') fx.lineStyle(1, 0xffd27a, 0.45).strokeCircle(u.x, u.y, 5.5); // evolved wolves only: thin gold rim (never on enemies)
        else if (wEvo === 'dire_alpha' && !u.shade) { // The Alpha: gold rim on the great wolf only (the ghost shades stay plain), pale-blue frost mane along its back
          fx.lineStyle(1, 0xffd27a, 0.5).strokeCircle(u.x, u.y, u.r * 1.3);
          const dir = u.faceX < 0 ? -1 : 1; // static strokes (no shimmer), so reduced motion is unchanged
          for (let m = 0; m < 4; m++) { const sx = u.x - dir * u.r * (0.05 + 0.25 * m), sy = u.y - u.r * 0.72; fx.lineStyle(2, 0xcfeaff, 0.6).lineBetween(sx, sy, sx - dir * u.r * 0.3, sy - u.r * 0.42); }
        }
        if (wolfArt && wEvo === 'phantom_stampede') { /* S2: the pawprint trail is this pack's ribbon; no extra spirit streaks (they drew the web of long straight lines) */ } else if (ribOn) ribAdd(u, ROLE.spiritA, this.ribCaps.spirits.life * 1.15, true); else trail(u.x, u.y + 1, ROLE.spiritA, 0.4);
        if (lit) lm.add(u.x, u.y, 40, ROLE.spiritA, 0.8);
      } else if (u.kind === 'echo') {
        // W6 Howling Legion echo: pale-blue translucent wolf, no gold rim; rises from the fallen foe, fades at the end. Nearest `caps.echoes` only.
        if (echoN++ >= caps.echoes) continue;
        const rm = this.reducedMotion();
        const rise = u.rise > 0 ? 1 - u.rise / 0.35 : 1;
        const fade = Math.min(1, u.life / 0.8);
        const a = 0.5 * fade * (rm ? 1 : 0.35 + 0.65 * rise);
        if (wolfArt) { // S2 Echo Pack: the hollow outline wolf rises out of the fallen foe (4 u below its feet -> standing) with pale motes
          const born = !(this.wolfSt && this.wolfSt.has(u.id));
          this.drawWolfA(u, p, wdt, lowWolf, wEvo, Math.min(1, a * 1.8), rm ? 0 : (1 - rise) * 4);
          if (born && !rm && caps.trails > 0 && this.parts.count < this.parts.cap * 0.75) for (let m = 0; m < 4; m++) this.parts.emit(u.x + (m - 1.5) * 2.5, u.y - 1 - m, (m - 1.5) * 4, -20 - m * 3, 0.6, 0.55, 0.1, 0xe6f6ff, 0.7);
        } else pl.uEcho.get(u.id).setPosition(u.x, u.y - (rm ? 0 : (1 - rise) * -3)).setDepth(D_LIT + u.y).setFlipX(u.faceX < 0).setScale((u.r / 4) * 0.88 * pl.uEcho.inv).setTint(0xbfe6ff).setAlpha(a);
        if (caps.trails > 0 && !rm && trailBudget > 0 && ((sim.time * 60 + u.id) | 0) % 5 === 0) { trailBudget--; this.parts.emit(u.x, u.y - 3, 0, -16, 0.55, 0.5, 0.05, 0x9fe8ff, 0.5); } // blue wisp rising from the body
        if (caps.halos > 40 && halos++ < caps.halos) pl.haloU.get(u.id).setPosition(u.x, u.y).setTint(ROLE.spiritA).setScale(u.r / 4 * 0.9 * pl.haloU.inv).setAlpha(0.3 * fade);
      } else if (u.kind === 'raven') {
        pl.uRaven.get(u.id).setPosition(u.x, u.y).setDepth(D_LIT + u.y + 30).setFlipX((u.faceX || 1) < 0);
        if (halos++ < caps.halos) pl.haloU.get(u.id).setPosition(u.x, u.y).setTint(ROLE.spiritB).setScale(0.85 * pl.haloU.inv).setAlpha(0.55);
        if (rvEvo) fx.lineStyle(1, 0xffd27a, 0.45).strokeCircle(u.x, u.y, 5.5); // evolved flock only: thin gold rim (never on enemies)
        if (u.wedge && rvw.rt.wedgeOn && caps.drips > 0) { // W9 Spearhead: short violet wake behind each wedge raven while the wedge flies (none on Low)
          fx.lineStyle(2, ROLE.spiritB, 0.16).lineBetween(u.x, u.y, u.x - rvw.rt.hx * 16, u.y - rvw.rt.hy * 16);
          fx.lineStyle(1, ROLE.spiritB2, 0.5).lineBetween(u.x, u.y, u.x - rvw.rt.hx * 12, u.y - rvw.rt.hy * 12);
        }
        if (u.tellK > 0 && u.target && !u.target.dead) { // W9 Talon Mark tell: a violet shadow grows under the foe for 0.4 s (full size, still, under reduced motion)
          const k = this.reducedMotion() ? 1 : u.tellK, tr = u.target.r * (u.target.boss ? 0.8 : 1);
          const sx = u.target.x, sy = u.target.y + tr * 0.55, sw = 8 + (tr * 2 + 6) * k, sh = 3 + (tr + 2) * 0.55 * k;
          fx.fillStyle(ROLE.spiritB, 0.1 + 0.22 * k).fillEllipse(sx, sy, sw, sh);
          fx.lineStyle(1, ROLE.spiritB2, 0.55 * k).strokeEllipse(sx, sy, sw, sh);
        }
        if (ribOn) ribAdd(u, ROLE.spiritB, this.ribCaps.spirits.life); else trail(u.x, u.y, ROLE.spiritB, 0.3);
        if (lit) lm.add(u.x, u.y, 40, ROLE.spiritB, 0.8);
      } else if (u.kind === 'orb') {
        // A2: with Elias the flame ring is render-only smaller / dimmer (hit radius unchanged) so he stays the focal point
        const eo = this.rig.id === 'elias' && this.rig.active;
        pl.uOrb.get(u.id).setPosition(u.x, u.y).setDepth(D_LIT + u.y + 30).setScale((eo ? 0.8 : 1) * pl.uOrb.inv);
        if (halos++ < caps.halos) pl.haloU.get(u.id).setPosition(u.x, u.y).setTint(ROLE.spiritC).setScale((eo ? 0.8 : 1.1) * pl.haloU.inv).setAlpha(eo ? 0.4 : 0.55);
        if (tw && tw.rt.tide && tw.rt.tide.out && caps.drips > 0 && !this.reducedMotion()) { // Vesper Tide swell: each light stretches into a short bright streak back toward Elias
          const sd = Math.hypot(u.x - p.x, u.y - p.y) || 1;
          fx.lineStyle(2, 0xf3eaff, 0.6).lineBetween(u.x, u.y, u.x - ((u.x - p.x) / sd) * 7, u.y - ((u.y - p.y) / sd) * 7);
        }
        if (ribOn) ribAdd(u, PAL.lavender, Math.min(0.35, this.ribCaps.spirits.life)); else trail(u.x, u.y, PAL.lavender, eo ? 0.2 : 0.3);
        if (lit) lm.add(u.x, u.y, eo ? 32 : 40, ROLE.spiritC, eo ? 0.55 : 0.8);
      }
    }

    this.sec0(5); this.tickRibbons(sim, p, lx, ly, nSrc); this.sec1(5);

    // projectiles. W10 Spirit Bolts evolutions (visual only, reads the sim): a thin gold rim on the EVOLVED glyph only (never on enemies, nearest caps.halos);
    // Spirit Tempest draws a short thread from each seeking glyph to its own prey (cap halos/5, none under reduced motion).
    let rimN = 0, thrN = 0;
    const thrCap = Math.round(caps.halos / 5), still = this.reducedMotion();
    // Soul Lance script lines: a thin glowing line along each lance's path that fades over 1.2 s (cores + faint ink ticks on Med/High; the core only on Low)
    const lw = sim.weapons.find((w2) => w2.id === 'spirit_bolts');
    if (lw && lw.evo === 'soul_lance' && lw.rt.lines) {
      for (const ln of lw.rt.lines) {
        const fade = ln.len < ln.max ? 1 : Math.max(0, 1 - ln.age / ln.ttl), cx = Math.cos(ln.ang), cy = Math.sin(ln.ang);
        const ex = ln.x + cx * ln.len, ey = ln.y + cy * ln.len;
        if (Math.max(ln.x, ex) < vx0 || Math.min(ln.x, ex) > vx1 || Math.max(ln.y, ey) < vy0 || Math.min(ln.y, ey) > vy1) continue;
        fx.lineStyle(Math.max(4, ln.w * 1.4), ROLE.bolt, 0.1 * fade).lineBetween(ln.x, ln.y, ex, ey);
        fx.lineStyle(1.5, 0xd6f7ff, 0.5 * fade).lineBetween(ln.x, ln.y, ex, ey);
        if (caps.drips > 0) for (let d = 18, k = 0; d < ln.len && k < 16; d += 22, k++) { // script: short ink ticks across the line
          const tl = k % 2 ? 3.5 : 2.2, tx = ln.x + cx * d, ty = ln.y + cy * d;
          fx.lineStyle(1, 0xd6f7ff, 0.4 * fade).lineBetween(tx - cy * tl, ty + cx * tl, tx + cy * tl, ty - cx * tl);
        }
      }
    }
    for (const b of sim.projectiles) {
      if (b.x < vx0 || b.x > vx1 || b.y < vy0 || b.y > vy1) continue;
      const rv = b.lance ? 3.5 : b.pages ? 3.2 : b.r; // a lance is drawn as a long pale capsule below, its sprite stays small
      pl.bolt.get(b.id).setPosition(b.x, b.y).setDepth(D_LIT + b.y + 40).setScale((rv / 3) * pl.bolt.inv).setTint(b.back ? 0xe2f1ff : 0xffffff); // Returning Pages: the way home is a paler glyph
      if (halos++ < caps.halos) pl.haloU.get(b.id).setPosition(b.x, b.y).setTint(ROLE.bolt).setScale((rv / 3) * 0.9 * pl.haloU.inv).setAlpha(0.6);
      trail(b.x, b.y, PAL.ice, 0.28);
      if (lit) lm.add(b.x, b.y, 24, ROLE.bolt, 0.8);
      if (b.lance) { // pale lance: wide soft body, bright core, thin gold rim along both edges (evolved bolts only)
        const lx = Math.cos(b.ang), ly = Math.sin(b.ang), ox = b.x - lx * 34, oy = b.y - ly * 34, hw = Math.max(1.5, b.r * 0.5);
        fx.lineStyle(Math.max(3, b.r * 0.9), 0xd6f7ff, 0.2).lineBetween(ox, oy, b.x, b.y);
        fx.lineStyle(2, 0xffffff, 0.85).lineBetween(ox, oy, b.x, b.y);
        fx.fillStyle(0xffffff, 0.9).fillCircle(b.x, b.y, 2.5);
        if (rimN++ < caps.halos) fx.lineStyle(1, 0xffd27a, 0.5).lineBetween(ox - ly * hw, oy + lx * hw, b.x - ly * hw, b.y + lx * hw).lineBetween(ox + ly * hw, oy - lx * hw, b.x + ly * hw, b.y - lx * hw);
      }
      if (b.pages) { // Returning Pages: gold rim; a short ink line trails the glyph out, a faint reversed curl points home on the way back (none under reduced motion)
        if (rimN++ < caps.halos) fx.lineStyle(1, 0xffd27a, 0.5).strokeCircle(b.x, b.y, 4.5);
        if (!still && thrN++ < thrCap) {
          const ca = Math.cos(b.ang), sa = Math.sin(b.ang);
          if (!b.back) fx.lineStyle(1.5, ROLE.bolt, 0.45).lineBetween(b.x, b.y, b.x - ca * 12, b.y - sa * 12);
          else fx.lineStyle(1, 0xe2f1ff, 0.3).lineBetween(b.x, b.y, b.x + ca * 14, b.y + sa * 14);
        }
      }
      if (b.evo === 'spirit_tempest') {
        if (rimN++ < caps.halos) fx.lineStyle(1, 0xffd27a, 0.5).strokeCircle(b.x, b.y, 4.5);
        if (!(b.seek > 0) && b.target && !b.target.dead && !still && thrN++ < thrCap) { // short thread (<= 34 px) pointing at its prey
          const tx = b.target.x - b.x, ty = b.target.y - b.y, tk = Math.min(1, 34 / (Math.hypot(tx, ty) || 1));
          fx.lineStyle(1, ROLE.bolt, 0.4).lineBetween(b.x, b.y, b.x + tx * tk, b.y + ty * tk);
        }
      }
    }

    // Rally the Pack: thin amber thread from each rallying wolf to the rallied enemy
    const ry = sim.rally;
    if (ry && ry.target && !ry.target.dead && sim.buffs.rally > 0) {
      const rt = ry.target;
      const calm = this.reducedMotion();
      const pulse = calm ? 0.7 : 0.55 + 0.25 * Math.sin(sim.time * 9);
      let nl = 0;
      for (const u of sim.units) {
        if (u.kind !== 'wolf' || u.hidden) continue;
        if (this.quality.tier === 'low' && nl++ >= 6) break;
        fx.lineStyle(1, ROLE.lantern, pulse).lineBetween(u.x, u.y, rt.x, rt.y);
      }
      fx.lineStyle(1, ROLE.lantern, pulse).strokeCircle(rt.x, rt.y, rt.r + 5);
    }

    // transient effects (additive: glow comes for free)
    let fi = 0, pil = 0, skyA = 0, fld = 0;
    const stW = sim.weapons.find((x) => x.id === 'chain_lightning' && x.evo === 'static_storm');
    if (stW && stW.rt.fieldR) { // W11c Static Storm: a faint cyan field ring (gold hairline inside = evolved effect), static in reduced motion
      const pr = sim.player, pulse = this.reducedMotion() ? 0 : 0.04 * Math.sin(sim.time * 2.2);
      fx.lineStyle(1, PAL.ice, 0.13 + pulse).strokeCircle(pr.x, pr.y, stW.rt.fieldR);
      fx.lineStyle(1, PAL.gold, 0.09 + pulse * 0.5).strokeCircle(pr.x, pr.y, stW.rt.fieldR - 3);
    }
    const rmFx = this.reducedMotion(), tierFx = this.quality.tier;
    const tthW = sim.weapons.find((x) => x.id === 'chain_lightning' && x.evo === 'storm_tether');
    if (tthW && tthW.rt.tethers && tthW.rt.tethers.length) { // W11d Storm Tether: steady arcs hero -> foe (+ one short fork); Low = straight lines, reduced motion = no flicker
      const pr = sim.player, flick = !rmFx && tierFx !== 'low', seed0 = Math.floor(sim.time * 20) * 7919;
      const arc = (x0, y0, x1, y1, wpx, a, sd) => {
        const n = flick ? Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 14)) : 1;
        for (let pass = 0; pass < 3; pass++) {
          if (pass === 0) fx.lineStyle(wpx + 3, PAL.violet, 0.22 * a);
          else if (pass === 1) fx.lineStyle(wpx, PAL.ice, 0.85 * a);
          else fx.lineStyle(1, PAL.gold, 0.5 * a); // gold core hairline (evolved effect)
          fx.beginPath().moveTo(x0, y0);
          for (let k = 1; k < n; k++) { const t = k / n, q = seed0 + sd * 131 + k * 17; fx.lineTo(x0 + (x1 - x0) * t + jit(q) * 4, y0 + (y1 - y0) * t + jit(q + 5003) * 4); }
          fx.lineTo(x1, y1).strokePath();
        }
      };
      let ai = 0;
      for (const t of tthW.rt.tethers) {
        if (t.e.dead) continue;
        arc(pr.x, pr.y - 10, t.e.x, t.e.y - 4, 2, 1, ++ai);
        if (t.f && !t.f.dead) { arc(t.e.x, t.e.y - 4, t.f.x, t.f.y - 4, 1, 0.6, ai + 40); fx.fillStyle(0xffffff, 0.8).fillRect(Math.round(t.f.x) - 1, Math.round(t.f.y) - 5, 2, 2); }
        if (lit) lm.add(t.e.x, t.e.y, 40, ROLE.lightning, 0.7);
      }
    }
    for (const f of sim.fx) {
      fi++;
      if (f.kind === 'judgetell' || f.kind === 'judgeflash') { // W11b Thunder Judgment: tell = a faint cyan radius ring (all tiers) + sky darkening (Med/High, not in reduced motion)
        if (f.kind === 'judgetell') {
          const k = 1 - f.ttl / f.life;
          fx.lineStyle(1, PAL.ice, 0.18 + 0.3 * k).strokeCircle(f.x, f.y, f.r);
          if (!rmFx && tierFx !== 'low') skyA = Math.max(skyA, 0.34 * k);
        } else if (!rmFx && tierFx !== 'low') skyA = Math.max(skyA, 0.34 * (f.ttl / f.life));
      } else if (f.kind === 'bolt' && f.pillar) { // a sky pillar on one struck foe: pale core, soft cyan column, gold rim (evolved effect only), tier-capped
        if (pil++ >= (tierFx === 'low' ? 10 : tierFx === 'med' ? 20 : 30)) continue;
        const a = Math.min(1, f.ttl / 0.14), x = Math.round(f.pts[1].x), y0 = f.pts[0].y, y1 = f.pts[1].y;
        if (tierFx !== 'low') fx.fillStyle(PAL.ice, 0.2 * a).fillRect(x - 5, y0, 10, y1 - y0);
        fx.fillStyle(0xffffff, 0.85 * a).fillRect(x - 1, y0, 2, y1 - y0);
        fx.fillStyle(PAL.gold, 0.7 * a).fillRect(x - 6, y0, 1, y1 - y0).fillRect(x + 5, y0, 1, y1 - y0);
        fx.lineStyle(1, PAL.ice, a).strokeCircle(x, y1, 9 - 3 * a);
        if (lit) lm.add(x, y1, 50, ROLE.lightning, 0.9 * a);
      } else if (f.kind === 'burst' || f.kind === 'fizzle') { drawBurstFx(fx, f, this.reducedMotion());
      } else if (f.kind === 'ring') {
        const k = Math.max(0, f.ttl / 0.3);
        if (f.color === '#7a4a1b') { // DR2: the Treant's slam landing is the tell resolving: tell red-orange on a dark rim, above the vignette (was a low-contrast brown)
          const rr = f.r * (1.15 - 0.15 * k), a = Math.min(1, k + 0.2);
          this.teleG.lineStyle(5, 0x1a1020, 0.7 * a).strokeCircle(f.x, f.y, rr);
          this.teleG.lineStyle(3, TELL_RO, a).strokeCircle(f.x, f.y, rr);
        } else fx.lineStyle(2, hex(f.color), Math.min(1, k + 0.2)).strokeCircle(f.x, f.y, f.r * (1.15 - 0.15 * k));
      } else if (f.kind === 'alphaarc') { // The Alpha bite: a pale-blue sweep arc across the bite direction (not a ring), fades in ~0.18 s
        const k = Math.max(0, f.ttl / 0.18);
        fx.lineStyle(3, hex(f.color), 0.7 * k).beginPath().arc(f.x, f.y, f.r * (1.05 - 0.1 * k), f.a - 1.0, f.a + 1.0).strokePath();
        fx.lineStyle(1, 0xffffff, 0.8 * k).beginPath().arc(f.x, f.y, f.r * (1.05 - 0.1 * k), f.a - 0.8, f.a + 0.8).strokePath();
      } else if (f.kind === 'bolt') {
        if (f.field && fld++ >= (tierFx === 'low' ? 6 : tierFx === 'med' ? 12 : 20)) continue; // Static Storm strikes are tier-capped
        const a = Math.min(1, f.ttl / 0.1);
        if (lit && f.pts.length) lm.add(f.pts[f.pts.length - 1].x, f.pts[f.pts.length - 1].y, 60, ROLE.lightning, 0.9 * a);
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

    if (skyA > 0) this.skyR.setVisible(true).setAlpha(skyA); else if (this.skyR.visible) this.skyR.setVisible(false);
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
    const eb = this.evoBeat; // E9: gold rim on the evolved weapon's units (pooled graphics, no allocation)
    if (eb) {
      eb.t += dt;
      if (eb.t >= eb.life) this.evoBeat = null;
      else {
        const ga = 0.9 * (1 - eb.t / eb.life);
        let n = 0;
        for (const u of sim.units) {
          if (u.owner !== eb.w || u.hidden || u.dead) continue;
          if (n++ >= 40) break;
          fx.lineStyle(3, ROLE.evo, ga * 0.35).strokeCircle(u.x, u.y, u.r * 1.4 + 2);
          fx.lineStyle(1, ROLE.evoHot, ga).strokeCircle(u.x, u.y, u.r * 1.4 + 2);
        }
      }
    }

    if (lit) {
      for (const d of this.dfl) {
        if (d.t >= 0.2) continue;
        d.t += dt;
        lm.add(d.x, d.y, 30, ROLE.enemyRim, 0.8 * Math.max(0, 1 - d.t / 0.2));
      }
      this.sec0(6); lm.flush(this.ambient); this.sec1(6);
      if (!lm.ok) this.applyTier(); // lightmap failed at runtime: fall back to the Low look
    }
    this.haloCount = halos;
    for (const pool of this.poolList) pool.end();
  }

  // W0 life map: hero lantern paints a ribbon, spirits paint small blooms (10 Hz); decay + GPU upload at 10 Hz. Visual only.
  // W1b: Deep Forest Floor (B) tiles are painted in ~3 ms slices once the hero nears a B zone, or 2.5 s after the run starts,
  // then fade in via the shader's uBReady (until then the shader uses the Meadow tile, so there is no pop). Visual only.
  tickGround(p, dt) {
    const b = this.bState;
    if (!b || b.ready >= 1 || !this.gbOn) return;
    if (!b.lazy) {
      b.t += dt;
      let near = b.t > 2.5;
      if (!near) for (let k = 0; k < 8 && !near; k++) { const a = k * 0.7854; near = zoneB(p.x + Math.cos(a) * 1000, p.y + Math.sin(a) * 1000, app.data.balance.worldSize) > 0.004; }
      if (!near) return;
      b.lazy = makeGroundLazy(this);
    }
    if (!b.lazy.done) { b.lazy.step(this.workMs > 9 ? 1.2 : 3); if (!b.lazy.done) return; b.fade = 0; }
    b.fade += dt;
    b.ready = Math.min(1, b.fade / 0.8);
    this.gb.setBReady(b.ready);
  }

  // AL-1: grass/flower sway on restored ground only (Med/High with the ground shader; Low keeps the baked still tufts).
  // W2: glowing ribbon trails (hero lantern + scarf wisp + friendly spirits), additive, under every creature. Visual only.
  tickRibbons(sim, p, lx, ly, nSrc) {
    const q = this.quality;
    const reduced = this.reducedMotion();
    const key = q.tier + (reduced ? 'r' : '') + (this.swayPhone ? 'p' : '');
    if (key !== this.ribKey || !this.ribCaps) { this.ribKey = key; this.ribCaps = ribbonCaps(q.caps.ribbon, { phone: this.swayPhone, reduced }); }
    const caps = this.ribCaps;
    if (!app.params.trails || caps.segs <= 0 || sim.state === 'dead') { if (this.ribLayer.shown) this.ribLayer.clear(); if (this.pawLayer && this.pawLayer.shown) this.pawLayer.clear(); return; }
    const h = this.ribHero;
    h.lx = lx; h.ly = ly;
    if (this.rig && this.rig.active) { h.sx = this.rig.scarfX; h.sy = this.rig.scarfY; } else { h.sx = p.x - (p.faceX < 0 ? -1 : 1) * 5; h.sy = p.y - 13; }
    const elias = this.rig.id === 'elias';
    this.ribSet.update(sim.time, caps, h, this.ribSrc, nSrc);
    let n = this.ribSet.emit(sim.time, caps, ROLE.lantern, elias ? ROLE.eliasTrim : 0xbff3e6);
    // W7b Lightfoot Pack: the evolved wolves' trail, pale wolf blue with a warm lantern core; tier-capped (Low draws dots instead), under every creature
    const ww = sim.weapons.find((w) => w.evo === 'phantom_stampede');
    if (ww && ww.rt.trail && ww.rt.trail.length) {
      const tc = q.caps.trail || { body: 0, core: 0 };
      const ph = this.swayPhone ? 0.85 : 1; // the trail is the evolution's whole look: phones keep most of it
      const bodyN = Math.floor(tc.body * ph);
      if (this.pawLayer && SUM_ART.wolf) { // S2: pawprints on the trail points over a soft ribbon (no long straight streaks), same point caps
        const nh = this.trailHero || (this.trailHero = { x: 0, y: 0, r: 0 });
        nh.x = p.x; nh.y = p.y; nh.r = 0.2 * this.cameras.main.worldView.height;
        n = this.ribSet.addTrailSoft(ww.rt.trail, { body: bodyN }, ROLE.spiritA, nh);
        this.pawLayer.render(ww.rt.trail, bodyN, this.dens.k);
      } else n = this.ribSet.addTrail(ww.rt.trail, { body: bodyN, core: Math.floor(tc.core * ph) }, ROLE.spiritA, 0xfff1c8);
    } else if (this.pawLayer && this.pawLayer.shown) this.pawLayer.clear();
    this.ribLayer.render(this.ribSet, n);
  }

  // W4 props + AL-3 crowns/petals: decor under every creature; Low = static props (no sway, no petals), fewer.
  tickProps(sim, p, caps) {
    const ok = app.params.props && sim.state !== 'dead';
    const wv = this.cameras.main.worldView;
    this.props.update(Math.min(this.game.loop.delta, 100) / 1000, sim.time, wv, this.life, ok ? caps : PROPS_OFF, { phone: this.swayPhone, reduced: this.reducedMotion(), hero: p, creatures: sim.enemies, nCreat: sim.enemies.length, push: this.push });
  }

  tickSway(sim, p, caps) {
    const on = !!(app.params.sway && this.gbOn && caps.ambient.sway > 0);
    this.sway.setTint(this.lmOn ? 0xffffff : this.gradeNow);
    const reduced = this.reducedMotion();
    const dt = Math.min(this.game.loop.delta, 100) / 1000;
    const wv = this.cameras.main.worldView;
    // AL-4 creature-reactive foliage: only while sway or props sway is on (Med/High), hero + capped enemies, calm in reduced motion
    const pb = app.params.push && sim.state !== 'dead' && (on || (app.params.props && caps.props.sway)) ? pushBudget(caps.ambient.push, { phone: this.swayPhone, reduced }) : 0;
    this.push.setBudget(pb);
    if (pb > 0) this.push.update(dt, p, sim.enemies, sim.enemies.length, { x0: wv.x, y0: wv.y, x1: wv.right, y1: wv.bottom }, reduced); else if (this.push.n) this.push.reset();
    this.sway.update(dt, sim.time, wv, p, this.life, { on, cap: caps.ambient.sway, bloom: caps.ambient.bloom, phone: this.swayPhone, reduced, push: pb > 0 ? this.push : null });
    if (this.gbOn) this.gb.setHero(p.x, p.y);
  }

  tickLife(sim, p) {
    this.tickGround(p, this.game.loop.delta / 1000);
    const life = this.life;
    const last = this.lifeLast;
    if (last && Math.abs(p.x - last.x) + Math.abs(p.y - last.y) < 400) life.stampLine(last.x, last.y, p.x, p.y, 70, 1);
    else life.stamp(p.x, p.y, 70, 1);
    if (!last) this.lifeLast = { x: p.x, y: p.y };
    else { last.x = p.x; last.y = p.y; }
    const us = sim.units;
    if (this.lifeAcc === undefined || this.lifeAcc >= 0.1) { this.lifeAcc = 0; for (let i = 0, n = Math.min(us.length, 30); i < n; i++) { const u = us[i]; if (!u.dead) life.stamp(u.x, u.y, 36, 0.9); } }
    if (this.lifeAcc === 0) { // W7b: the evolved pack's trail also warms the ground it crosses (every 4th live point, newest 24)
      const wl = sim.weapons.find((w) => w.evo === 'phantom_stampede');
      const tr = wl && wl.rt.trail;
      if (tr) for (let i = tr.length - 1, k = 0; i >= 0 && k < 24; i -= 4, k++) life.stamp(tr[i].x, tr[i].y, 22, 0.8);
    }
    this.lifeAcc += this.game.loop.delta / 1000;
    if (this.corrAcc === undefined || this.corrAcc >= 0.1) { this.corrAcc = 0; if (app.params.corr) this.tickCorruption(sim); }
    this.corrAcc += this.game.loop.delta / 1000;
    if (!life.update(this.game.loop.delta / 1000)) return;
    if (this.gbOn) this.gb.upload(life);
    if (this.lifeDbg) drawLifeDebug(this.lifeDbg, life, p);
    if (++this.lifeFrames === 8 && this.gbOn) { // one-time GL error check after the first uploads
      const gl = this.renderer.gl;
      if (gl && gl.getError() !== gl.NO_ERROR) { this.gb.fail(); this.applyTier(); }
    }
    if (!this.gbOn) {
      this.lowPoolT += 0.1;
      if (this.lowPoolT >= 0.6) { // Low look: a warm pool dropped behind the hero every 0.6 s, alpha follows the life map
        this.lowPoolT = 0;
        const im = this.lowPool[this.lowPoolI];
        this.lowPoolI = (this.lowPoolI + 1) % this.lowPool.length;
        im.setPosition(p.x, p.y + 8);
        im.dropAt = sim.time;
      }
      for (const im of this.lowPool) {
        const v = im.dropAt === undefined ? 0 : life.sample(im.x, im.y);
        im.setVisible(v > 0.02).setAlpha(0.3 * v);
      }
    }
  }

  // W3 corruption (visual only): enemies slowly stain the ground around them (10 Hz), bosses much wider. Low draws soft dark blobs instead.
  tickCorruption(sim) {
    if (!this.life || sim.state === 'dead') return;
    const es = sim.enemies;
    const bin = this.corrBin;
    const low = !this.gbOn;
    if (low) bin.clear();
    for (let i = 0, n = Math.min(es.length, 400); i < n; i++) {
      const e = es[i];
      if (e.dead || e.hp <= 0) continue;
      if (e.boss) this.life.stampCorr(e.x, e.y, e.fight ? 70 : 130, e.fight ? 0.01 : 0.03); else this.life.stampCorr(e.x, e.y, 42, 0.011); // the fight boss stays ~90 s: a smaller, slower stain (no black hole under it)
      if (low) { const k = ((e.x / 180) | 0) * 64 + ((e.y / 180) | 0); const b = bin.get(k); if (b) { b.n++; b.x += e.x; b.y += e.y; } else bin.set(k, { n: 1, x: e.x, y: e.y }); }
    }
    if (!low) { for (const b of this.corrBlobs) if (b.visible) b.setVisible(false); return; }
    // Low: keep up to 10 blobs; a blob sits where a group of 4+ gathered, its alpha follows the corruption map and it frees itself when that fades
    const bl = this.corrBlobs;
    for (const b of bl) if (b.visible) { const c = this.life.sampleCorr(b.x, b.y); const a = Math.min(1, c * 1.8); b.setAlpha(a); if (c < 0.04) b.setVisible(false); }
    for (const g of bin.values()) {
      if (g.n < 4) continue;
      const gx = g.x / g.n; const gy = g.y / g.n;
      let near = false;
      let free = null;
      for (const b of bl) { if (!b.visible) { free = free || b; continue; } if (Math.abs(b.x - gx) + Math.abs(b.y - gy) < 130) near = true; }
      if (!near && free) free.setPosition(gx, gy).setVisible(true).setAlpha(0);
    }
  }

  // Enemy death: a few rising spirit wisps (pooled, additive).
  deathPuff(x, y) {
    const f = this.dfl[this.dflI];
    this.dflI = (this.dflI + 1) % this.dfl.length;
    f.x = x; f.y = y; f.t = 0;
    const n = this.quality.tier === 'low' ? 2 : this.quality.tier === 'med' ? 4 : 6;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.2832;
      const v = 14 + Math.random() * 22;
      if (!this.parts.emit(x, y, Math.cos(a) * v, Math.sin(a) * v - 22, 0.45 + Math.random() * 0.3, 0.45, 0.08, i & 1 ? PAL.teal : PAL.violet, 0.8)) break;
    }
  }
}
