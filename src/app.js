// Glue between the simulation, the Phaser scene and the DOM overlay.
import { Sim } from './sim/Sim.js';
import data, { treeInfo } from './data/index.js';
import { SaveStore } from './save/store.js';
import { MAX_SAVE_BYTES, setTreeDef } from './save/schema.js';
import { newlyLines } from './meta/gatewords.js';
import { abilityEmblem } from './ui/hudsvg.js';
import { resolveBrightness } from './gfx/arc.js';
import { touchEnabled } from './input/stick.js';
import { parseParams } from './params.js';
import { tierIndex } from './sim/tiers.js';
import { buildTreeView } from './meta/treeview.js';
import { compileTree, aggregateMods, presetTree, buy as buyNode, respec as respecTree, closestUnlocks } from './meta/tree.js';

// Validate the skill tree once at boot; the save validator needs it to sanitise owned nodes.
export const treeDef = compileTree(data.tree, data);
setTreeDef(treeDef, data);

export const app = {
  data,
  sim: null,
  ui: null,
  scene: null,
  paused: false,
  freeze: false, // hit-stop
  lastState: null,
  hudAcc: 0,
  params: parseParams(window.location.search),
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
      tier: p.tier || 'normal', // dev ?tier= (whitelisted in params.js); the map-select UI arrives with DT7
    });
    if (p.grant) this.applyGrants(sim, p.grant);
    if (p.bless) this.applyBless(sim, p.bless);
    this.sim = sim;
    this.paused = false;
    this.banked = false;
    this.endPending = false;
    this.lastState = 'running';
    this.ui.hideAll();
    this.ui.showHud();
    this.ui.updateHud(sim);
    if (this.scene) this.scene.bindSim(sim);
  },

  // Effects of the player's owned nodes (or a dev preset). Rebuilt from the sanitised save each run.
  treeEffects() {
    const owned = this.params.meta ? presetTree(treeDef, this.params.meta, true) /* previews include gate nodes */ : this.save.data.tree;
    return aggregateMods(owned, treeDef, data, { tier: tierIndex(this.params.tier) }); // tier-bought power applies only on the tiers that pay it
  },

  heroUnlocked(id) {
    const c = data.characters[id];
    return !c || !c.treeGate || aggregateMods(this.save.data.tree, treeDef, data).unlocks.heroes.includes(id);
  },

  treeApi() {
    return {
      def: treeDef,
      data,
      view: this.treeView || (this.treeView = buildTreeView(treeInfo, treeDef, data)),
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
      clearRegrowth: () => {
        if (this.save.data.notes && this.save.data.notes.regrowth) { delete this.save.data.notes.regrowth; this.save.saveNow(); }
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
    else if ((this.paused || sim.state !== 'running') && this.scene.drainAbilityKey) this.scene.drainAbilityKey(); // Space on a pause button, a level-up card or the end screen must not queue an ability for when play resumes

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
        // the Elder Treant victory beat plays in the world first (bossview.js: ~6 s, any key / tap after 1.5 s skips)
        if (this.scene.bossView && this.scene.bossView.endWait(sim) > 0) this.endPending = true;
        else this.ui.showEnd(sim, this.bankRun(sim));
      }
    }
    if (this.endPending && this.scene.bossView.endWait(sim) <= 0) { this.endPending = false; this.ui.showEnd(sim, this.bankRun(sim)); }

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
    if (this.scene.bossView && ev.type.startsWith('boss')) this.scene.bossView.onEvent(ev);
    if (ev.type === 'bossWake') { this.ui.hudView.bossBanner('The Elder Treant wakes', 'the oldest mask in the forest', !this.save.data.settings.reducedMotion); return; }
    if (ev.type === 'hurt') { this.scene.shake(); this.ui.hurt(); this.scene.hurtFx(ev); } // DR1: the edge flash + lantern dip are opacity-only, so they stay under Calm motion (shake does not)
    else if (ev.type === 'boss') {
      const b = this.sim && this.sim.boss;
      if (!(b && b.fight)) this.ui.bossIntro(b ? d.enemies[b.type].name : 'Boss', !this.save.data.settings.reducedMotion); // the fight has its own banner (bossWake)
      this.scene.bossIntro();
    } else if (ev.type === 'levelup') this.scene.levelBurst();
    else if (ev.type === 'swarm') this.ui.toast(ev.enemy === 'wolf' ? 'A wolf pack closes in' : 'A murder of crows descends');
    else if (ev.type === 'evolve') {
      const ev0 = this.save.data.stats.evolved; // E9: recipe shown only the first time this evolution is ever taken (recorded in stats.evolved at run end)
      this.ui.evolvePlate(ev.id, !(ev0 && Object.hasOwn(ev0, ev.id) && ev0[ev.id] > 0), !!this.save.data.settings.reducedMotion);
      this.scene.evolveMoment(ev.id);
    }
    else if (ev.type === 'heart') { this.ui.toast('Health restored'); this.scene.heartFx(); this.ui.hudView.flareHp(); }
    else if (ev.type === 'magnet') { this.ui.toast('Soul Magnet'); this.scene.magnetFx(); }
    else if (ev.type === 'rally') { this.ui.toast('Rally the Pack'); this.scene.rallyMoment(); }
    else if (ev.type === 'wheel') this.ui.toast('Candle Wheel');
    else if (ev.type === 'revive') this.ui.toast('Last Light: you rise again');
    else if (ev.type === 'bossDead') { if (!(this.sim && this.sim.fight)) this.ui.toast('The Elder Treant falls (+soul shards)'); }
    else if (ev.type === 'bossPhase') this.ui.toast(ev.phase === 1 ? 'The Elder Treant blights: Husks answer its call' : 'The Elder Treant rages: its heart glows');
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
    return !!(p.auto || p.meta || p.god || p.startTime || p.rerolls || p.banishes || p.grant || p.bless || p.debug || p.tier !== null || p.seed !== null);
  },

  bankRun(sim) {
    if (this.banked || this.isDebugRun()) return null;
    this.banked = true;
    const b = this.save.bankRun(sim.result(), { def: treeDef, data, unlockedTiers: aggregateMods(this.save.data.tree, treeDef, data).unlocks.tiers });
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
      loadNote: () => { const n = this.save.loadNote; if (n && !this.save.readOnly) this.save.loadNote = null; return n; }, // recovery message: once on the title screen (the newer-version lock stays)
      storageNote: () => (this.save.readOnly ? this.save.loadNote : this.save.persistent ? null : 'Browser storage is blocked or full: progress will not persist.'),
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
