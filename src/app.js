// Glue between the simulation, the Phaser scene and the DOM overlay.
import { Sim } from './sim/Sim.js';
import data from './data/index.js';
import { SaveStore } from './save/store.js';
import { MAX_SAVE_BYTES, setTreeDef } from './save/schema.js';
import { newlyLines } from './meta/gatewords.js';
import { abilityEmblem } from './ui/hudsvg.js';
import { resolveBrightness } from './gfx/arc.js';
import { parseTouchParam, touchEnabled } from './input/stick.js';
import { compileTree, aggregateMods, presetTree, buy as buyNode, respec as respecTree, closestUnlocks } from './meta/tree.js';

// Validate the skill tree once at boot; the save validator needs it to sanitise owned nodes.
export const treeDef = compileTree(data.tree, data);
setTreeDef(treeDef, data);

function parseParams() {
  const q = new URLSearchParams(window.location.search);
  const num = (k, d) => (q.has(k) ? Number(q.get(k)) : d);
  return {
    auto: q.get('auto'),
    seed: q.has('seed') ? num('seed') : null,
    startTime: num('t', 0),
    god: q.get('god') === '1',
    rerolls: num('rr', 0),
    banishes: num('ban', 0),
    grant: q.get('grant'), // dev: "spirit_bolts:power=5,pierce=5:soul_lance;raven_flock"
    bless: q.get('bless'), // dev: "wider_glow:2;kind_fortune:3" (validated; disables banking)
    debug: q.get('debug') === '1',
    life: q.get('life') === '1', // dev: show the life map
    flat: q.get('ground') === 'flat', // dev: force the Low ground fallback (no shader)
    trails: q.get('trails') !== '0', // dev: ?trails=0 turns the W2 ribbon trails off (A/B perf)
    props: q.get('props') !== '0', // dev: ?props=0 turns the W4 props layer off (A/B perf)
    push: q.get('push') !== '0', // dev: ?push=0 turns the AL-4 creature-reactive foliage off (A/B perf)
    sway: q.get('sway') !== '0', // dev: ?sway=0 turns the AL-1 grass sway layer off (A/B perf)
    fog: q.get('fog') !== '0', // dev: ?fog=0 turns the W5 fog banks off (A/B perf)
    motes: q.get('motes') !== '0', // dev: ?motes=0 turns the W5 fireflies + motes off (A/B perf)
    dawn: q.get('dawn') !== '0', // dev: ?dawn=0 turns the AL-6 dawn chorus off (A/B perf). Preview the moments with ?auto=wren&t=520 (first light), t=590 (hush), t=860 (flood), t=890 (14:50)
    critters: q.get('critters') !== '0', // dev: ?critters=0 turns the AL-5 critters off (A/B perf)
    edge: q.get('edge') !== '0', // dev: ?edge=0 turns the W5 edge-wall fade off (A/B perf)
    corr: q.get('corr') !== '0', // dev: ?corr=0 stops enemies staining the ground (A/B perf)
    bloom: q.get('bloom') !== '0', // dev: ?bloom=0 turns the High-tier bloom post effect off (A/B perf)
    arc: q.get('arc') !== '0', // dev: ?arc=0 restores the pre-WL6 lighting (A/B perf and screenshots)
    vib: q.get('vib') !== '0', // dev: ?vib=0 turns the WL6c restored-world vibrancy off (same-spot A/B, perf)
    night: q.get('night') !== '0', // dev: ?night=0 turns the WL6b enemy night look off (A/B perf)
    bright: ['normal', 'brighter', 'clear'].includes(q.get('bright')) ? q.get('bright') : null, // dev: session-only brightness override (never saved)
    lm: q.get('lm') !== '0', // dev: ?lm=0 turns the lightmap (and with it the ground shader) off (A/B perf)
    nums: q.get('nums') !== '0', // dev: ?nums=0 turns damage numbers off (A/B perf)
    touch: parseTouchParam(q.get('touch')), // '1' force touch controls on, '0' off (session only; never touches saves)
    meta: ['full', 'half'].includes(q.get('meta')) ? q.get('meta') : null, // dev: preview a preset skill tree
  };
}

export const app = {
  data,
  sim: null,
  ui: null,
  scene: null,
  paused: false,
  freeze: false, // hit-stop
  lastState: null,
  hudAcc: 0,
  params: parseParams(),
  characterId: null,
  save: new SaveStore(),
  banked: false,
  touch: null, // TouchControls, created in main.js

  startRun(characterId) {
    const p = this.params;
    this.characterId = characterId;
    const sim = new Sim({
      data,
      characterId,
      seed: p.seed ?? ((Math.random() * 1e9) | 0),
      meta: { rerolls: p.rerolls, banishes: p.banishes },
      tree: this.treeEffects(),
      startTime: p.startTime,
      godMode: p.god,
    });
    if (p.grant) this.applyGrants(sim, p.grant);
    if (p.bless) this.applyBless(sim, p.bless);
    this.sim = sim;
    this.paused = false;
    this.banked = false;
    this.lastState = 'running';
    this.ui.hideAll();
    this.ui.showHud();
    this.ui.updateHud(sim);
    if (this.scene) this.scene.bindSim(sim);
  },

  // Effects of the player's owned nodes (or a dev preset). Rebuilt from the sanitised save each run.
  treeEffects() {
    const owned = this.params.meta ? presetTree(treeDef, this.params.meta, true) /* previews include gate nodes */ : this.save.data.tree;
    return aggregateMods(owned, treeDef, data);
  },

  heroUnlocked(id) {
    const c = data.characters[id];
    return !c || !c.treeGate || aggregateMods(this.save.data.tree, treeDef, data).unlocks.heroes.includes(id);
  },

  treeApi() {
    return {
      def: treeDef,
      data,
      save: () => this.save.data,
      markSeen: (id) => this.save.markSeen(id),
      buy: (id) => {
        const r = buyNode(this.save.data, id, treeDef, data);
        if (r.ok) this.save.saveNow();
        return r;
      },
      respec: () => {
        const r = respecTree(this.save.data, treeDef);
        this.save.saveNow();
        return r;
      },
      onClose: () => this.showMenu(),
    };
  },

  openTree() {
    this.sim = null;
    this.ui.hideAll();
    this.ui.tree.open(this.treeApi());
  },

  applyBless(sim, spec) {
    for (const part of String(spec).slice(0, 300).split(';')) {
      const [id, r] = part.split(':');
      if (id && /^[a-z0-9_]{1,32}$/.test(id)) sim.debugBless(id, Number(r)); // unknown ids / bad ranks are ignored inside
    }
  },

  applyGrants(sim, spec) {
    for (const part of spec.split(';')) {
      const [id, stats, evo] = part.split(':');
      if (!id || !Object.hasOwn(data.weapons, id)) continue;
      const ranks = {};
      if (stats) for (const kv of stats.split(',')) { const [k, v] = kv.split('='); ranks[k] = Number(v); }
      sim.debugGrant(id, ranks, evo || null);
    }
  },

  showMenu() {
    this.sim = null;
    this.paused = false;
    this.ui.hideAll();
    this.ui.showStart((id) => this.startRun(id));
    if (this.scene) this.scene.unbindSim();
  },

  // Called every rendered frame by the scene.
  frame(dt) {
    const sim = this.sim;
    if (this.touch) this.touch.sync(!!sim && sim.state === 'running' && !this.paused && !this.ui.settingsOpen);
    if (!sim) return;
    if (sim.state === 'running' && !this.paused && !this.freeze) sim.step(dt, this.scene.readInput());
    else if (this.paused && this.scene.drainAbilityKey) this.scene.drainAbilityKey(); // Space on a pause button must not fire the ability on resume

    if (sim.events.length) {
      for (const ev of sim.events) this.onEvent(ev);
      sim.events.length = 0;
    }

    if (sim.state !== this.lastState) {
      const prev = this.lastState;
      this.lastState = sim.state;
      if (sim.state === 'levelup') this.ui.showLevelUp(sim);
      else if (prev === 'levelup') this.ui.hideLevelUp();
      if (sim.state === 'victory' || sim.state === 'defeat') {
        this.ui.hidePause();
        this.ui.showEnd(sim, this.bankRun(sim));
      }
    }

    this.hudAcc += dt;
    if (this.hudAcc > 0.08) {
      this.hudAcc = 0;
      this.ui.updateHud(sim);
      if (this.touch) {
        const a = sim.ability;
        const cd = sim.abilityCooldown;
        this.touch.setAbility(a.name, a.cdLeft <= 0, a.cdLeft <= 0 ? 1 : 1 - a.cdLeft / cd, Math.ceil(a.cdLeft));
      }
    }
    if (this.touch) this.touch.render();
  },

  onEvent(ev) {
    const d = this.data;
    if (ev.type === 'hurt') { this.scene.shake(); if (!this.save.data.settings.reducedMotion) this.ui.hurt(); }
    else if (ev.type === 'boss') {
      const b = this.sim && this.sim.boss;
      this.ui.bossIntro(b ? d.enemies[b.type].name : 'Boss', !this.save.data.settings.reducedMotion);
      this.scene.bossIntro();
    } else if (ev.type === 'levelup') this.scene.levelBurst();
    else if (ev.type === 'swarm') this.ui.toast(ev.enemy === 'wolf' ? 'A wolf pack closes in' : 'A murder of crows descends');
    else if (ev.type === 'evolve') { this.ui.toast(`Evolved: ${d.evolutions[ev.id].name}`); this.scene.evolveMoment(); }
    else if (ev.type === 'heart') { this.ui.toast('Health restored'); this.scene.heartFx(); this.ui.hudView.flareHp(); }
    else if (ev.type === 'magnet') { this.ui.toast('Soul Magnet'); this.scene.magnetFx(); }
    else if (ev.type === 'howl') this.ui.toast('Pack Howl');
    else if (ev.type === 'wheel') this.ui.toast('Candle Wheel');
    else if (ev.type === 'revive') this.ui.toast('Last Light: you rise again');
    else if (ev.type === 'bossDead') this.ui.toast('The Elder Treant falls (+soul shards)');
    else if (ev.type === 'slam') this.scene.shake(160, 0.008);
  },

  pick(key) {
    const sim = this.sim;
    if (!sim || sim.state !== 'levelup') return;
    if (!sim.pickCard(key)) return;
    this.lastState = sim.state;
    if (sim.state === 'levelup') this.ui.showLevelUp(sim);
    else this.ui.hideLevelUp();
  },

  reroll() {
    if (this.sim && this.sim.reroll()) this.ui.showLevelUp(this.sim);
  },

  banish(key) {
    if (this.sim && this.sim.banish(key)) this.ui.showLevelUp(this.sim);
  },

  // Debug URL params never touch the real save.
  isDebugRun() {
    const p = this.params;
    return !!(p.auto || p.meta || p.god || p.startTime || p.rerolls || p.banishes || p.grant || p.bless || p.debug || p.seed !== null);
  },

  bankRun(sim) {
    if (this.banked || this.isDebugRun()) return null;
    this.banked = true;
    const b = this.save.bankRun(sim.result(), { def: treeDef, data });
    b.newly = newlyLines(treeDef, b.newlyMet, data);
    b.closest = closestUnlocks(treeDef, this.save.data, data, 3);
    if (!this.save.persistent) b.note = 'Browser storage unavailable: progress is kept only until you close this tab. Use Settings > Export save.';
    return b;
  },

  // Phone-sized or touch-first device (drives the Brighter default of the Brightness setting).
  isPhone() {
    try {
      const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
      return !!(coarse || Math.min(window.innerWidth, window.innerHeight) <= 600);
    } catch (err) { return false; }
  },

  applySettings() {
    const s = this.save.data.settings;
    document.documentElement.classList.toggle('reduced-motion', !!s.reducedMotion);
    if (this.touch) {
      const coarse = typeof matchMedia === 'function' && (matchMedia('(pointer: coarse)').matches || matchMedia('(hover: none)').matches);
      this.touch.configure(touchEnabled(s.touchMode, this.params.touch, coarse, 'ontouchstart' in window), s.stickSize);
    }
  },

  settingsHandlers() {
    return {
      getSettings: () => ({ ...this.save.data.settings }),
      resolvedBrightness: (stored) => resolveBrightness(stored, this.isPhone()),
      setSetting: (patch) => { this.save.setSettings(patch); this.applySettings(); },
      exportSave: () => this.save.exportText(),
      maxSaveBytes: MAX_SAVE_BYTES,
      checkImport: (t) => this.save.checkImport(t),
      applyImport: (s) => { this.save.applyImport(s); this.applySettings(); },
      resetSave: () => { this.save.reset(); this.applySettings(); },
      storageNote: () => (this.save.persistent ? null : 'Browser storage is blocked or full: progress will not persist.'),
      isFirstRun: () => (this.save.data.stats.runs || 0) === 0 && Object.keys(this.save.data.tree).length === 0,
      hasProgress: () => (this.save.data.stats.runs || 0) > 0 || Object.keys(this.save.data.tree).length > 0 || this.save.data.gold > 0 || this.save.data.shards > 0,
      getBank: () => ({ gold: this.save.data.gold, shards: this.save.data.shards }),
      openSettings: () => this.ui.showSettings(),
      openTree: () => this.openTree(),
      heroUnlocked: (id) => this.heroUnlocked(id),
      closeSettings: () => { if (!this.sim) this.showMenu(); },
    };
  },

  togglePause() {
    if (this.ui.settingsOpen || performance.now() - (this.ui.escAt || -1e9) < 250) return;
    const sim = this.sim;
    if (!sim || sim.state !== 'running') return;
    this.paused = !this.paused;
    if (this.paused) this.ui.showPause(sim);
    else this.ui.hidePause();
  },

  // Focus lost / tab hidden: pause a running game (touch players get interrupted a lot).
  autoPause() {
    const sim = this.sim;
    if (sim && sim.state === 'running' && !this.paused) this.togglePause();
  },

  again() {
    this.startRun(this.characterId);
  },
};
