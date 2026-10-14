// Glue between the simulation, the Phaser scene and the DOM overlay.
import { Sim } from './sim/Sim.js';
import data from './data/index.js';

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
    debug: q.get('debug') === '1',
  };
}

export const app = {
  data,
  sim: null,
  ui: null,
  scene: null,
  paused: false,
  lastState: null,
  hudAcc: 0,
  params: parseParams(),
  characterId: null,

  startRun(characterId) {
    const p = this.params;
    this.characterId = characterId;
    const sim = new Sim({
      data,
      characterId,
      seed: p.seed ?? ((Math.random() * 1e9) | 0),
      meta: { rerolls: p.rerolls, banishes: p.banishes },
      startTime: p.startTime,
      godMode: p.god,
    });
    if (p.grant) this.applyGrants(sim, p.grant);
    this.sim = sim;
    this.paused = false;
    this.lastState = 'running';
    this.ui.hideAll();
    this.ui.showHud();
    this.ui.updateHud(sim);
    if (this.scene) this.scene.bindSim(sim);
  },

  applyGrants(sim, spec) {
    for (const part of spec.split(';')) {
      const [id, stats, evo] = part.split(':');
      if (!id || !data.weapons[id]) continue;
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
    if (!sim) return;
    if (sim.state === 'running' && !this.paused) sim.step(dt, this.scene.readInput());

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
        this.ui.showEnd(sim);
      }
    }

    this.hudAcc += dt;
    if (this.hudAcc > 0.08) {
      this.hudAcc = 0;
      this.ui.updateHud(sim);
    }
  },

  onEvent(ev) {
    const d = this.data;
    if (ev.type === 'hurt') { this.scene.shake(); this.ui.hurt(); }
    else if (ev.type === 'boss') this.ui.toast('The Elder Treant awakens');
    else if (ev.type === 'swarm') this.ui.toast(ev.enemy === 'wolf' ? 'A wolf pack closes in' : 'A murder of crows descends');
    else if (ev.type === 'evolve') this.ui.toast(`Evolved: ${d.evolutions[ev.id].name}`);
    else if (ev.type === 'heart') this.ui.toast('Health restored');
    else if (ev.type === 'magnet') this.ui.toast('Soul Magnet');
    else if (ev.type === 'howl') this.ui.toast('Pack Howl');
    else if (ev.type === 'sanctuary') this.ui.toast('Sanctuary');
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

  togglePause() {
    const sim = this.sim;
    if (!sim || sim.state !== 'running') return;
    this.paused = !this.paused;
    if (this.paused) this.ui.showPause();
    else this.ui.hidePause();
  },

  again() {
    this.startRun(this.characterId);
  },
};
