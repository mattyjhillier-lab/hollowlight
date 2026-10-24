// Glue between the simulation, the Phaser scene and the DOM overlay.
import { Sim } from './sim/Sim.js';
import data, { treeInfo } from './data/index.js';
import { SaveStore } from './save/store.js';
import { MAX_SAVE_BYTES, setTreeDef, parseSave } from './save/schema.js';
import { MAX_LANTERNS, cleanName } from './save/lanterns.js';
import { LANTERN, treeWhisperShort, purses, continueWhisper, treeAffordable, mostPlayedHero, lanternSummary, exportFileName } from './ui/lanterncopy.js';
import { splitName } from './ui/titlecopy.js';
import { newlyLines } from './meta/gatewords.js';
import { abilityEmblem } from './ui/hudsvg.js';
import { resolveBrightness } from './gfx/arc.js';
import { touchEnabled } from './input/stick.js';
import { parseParams } from './params.js';
import { tierIndex, TIER_IDS, resolveTier } from './sim/tiers.js';
import { hasNightChoice, defaultNight, mapView, rememberNight, pickRunTier } from './ui/nightcopy.js';
import { buildTreeView } from './meta/treeview.js';
import { compileTree, aggregateMods, presetTree, buy as buyNode, respec as respecTree, closestUnlocks, nodeStatus } from './meta/tree.js';
import { Whispers, DUR as WHISPER_DUR, startBits, resultTeach, TIPS_AGAIN } from './ui/whispers.js';
import { almanac, adopt, markRead, markTold, withTitles } from './meta/codex.js';
import { queue as celQueue, ledgerLine } from './meta/celebrate.js';
import { TITLES } from './ui/codexcopy.js';
// Validate the skill tree once at boot; the save validator needs it to sanitise owned nodes.
export const treeDef = compileTree(data.tree, data);
setTreeDef(treeDef, data);

const UNDO_MS = 60000;

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
  audio: null, // AudioEngine (src/audio), created in main.js; render/audio only

  // FD4: tier = the night picked on the map screen. Only 'normal' or a night this lantern has opened is accepted (anything else -> Twilight),
  // and banking re-checks the gate (recordTierRun), so no path can play or pay a night that is not open. Twilight runs are unchanged.
  startRun(characterId, tier = 'normal') {
    const p = this.params;
    this.characterId = characterId;
    const cid = this.firstChapter();
    const open = this.openTiers(this.save.data);
    this.runTier = pickRunTier(tier, open, cid);
    if (!p.auto && hasNightChoice(this.save.data, data, treeDef, open) && !this.save.readOnly) { // remember the pick; the open nights' NEW flags have now been seen
      rememberNight(this.save.data, cid, this.runTier, TIER_IDS.filter((t) => t === 'normal' || open.includes(`${cid}:${t}`)));
      this.save.saveNow();
    }
    const sim = new Sim({
      data,
      characterId,
      seed: p.seed ?? ((Math.random() * 1e9) | 0),
      meta: { rerolls: p.rerolls, banishes: p.banishes },
      tree: this.treeEffects(),
      startTime: p.startTime,
      godMode: p.god,
      tier: p.tier || this.runTier, // dev ?tier= (whitelisted in params.js; a debug run) or the night picked on the map screen (FD4)
      autoRule: this.save.data.settings.autoRule, // used only if 'Chosen Moment' is owned (sanitised whitelist; the Sim whitelists again)
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
    this.startWhispers(sim);
  },

  // ------------------------------------------------------------------ FM1-FM5 first minute: whispers + feel (read sim state only; never the RNG)
  // Bits persist only for real runs of a writable lantern (debug / ?seed= runs keep them in memory, so screenshots never touch the save).
  tipsOn() { return this.save.data.settings.tips !== false && (!this.params.auto || this.params.tips === true); }, // bot / screenshot ?auto= runs stay clean unless ?tips=1
  canKeepHints() { return !this.isDebugRun() && !this.save.readOnly; },
  startWhispers(sim) {
    const s = this.save.data;
    const bits = startBits(s.hints, s.stats.runs);
    if (bits !== s.hints && this.canKeepHints()) this.save.setHints(bits);
    this.whispers = new Whispers({ bits, tips: this.tipsOn(), input: this.inputKind(), hero: { id: sim.characterId, ability: sim.ability ? sim.ability.name : '' } });
    this.wv = { live: false, t: 0, moving: false, gemNear: false, gems: 0, ready: false, uses: 0, hp: 1, busy: false };
    this.wPos = { x: sim.player.x, y: sim.player.y };
    this.feelPrev = { uses: sim.abilityUses | 0, mini: '' };
    if (this.ui.whisper) this.ui.whisper(null);
  },
  inputKind() {
    if (this.lastInput) return this.lastInput;
    return this.touch && this.touch.enabled ? 'touch' : 'kb';
  },
  // Copy follows the CURRENT input (last used), not the screen size.
  trackInput(win) {
    win.addEventListener('keydown', () => this.setInput('kb'), true);
    win.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch' || e.pointerType === 'pen') this.setInput('touch'); }, true);
  },
  setInput(kind) {
    if (this.lastInput === kind) return;
    this.lastInput = kind;
    if (this.whispers) this.whispers.setInput(kind);
  },
  hideWhisper() { if (this.whispers && this.whispers.hide()) this.ui.whisper(null); },
  resetTips() {
    if (this.save.readOnly) return;
    this.save.setHints(TIPS_AGAIN);
    if (this.whispers) this.whispers.bits = TIPS_AGAIN;
  },
  tickWhispers(sim, dt) {
    const w = this.whispers;
    if (!w) return;
    const st = this.save.data.settings;
    w.tips = this.tipsOn();
    const v = this.wv, p = sim.player;
    v.live = sim.state === 'running' && !this.paused && !this.ui.settingsOpen;
    v.t = sim.time;
    const dx = p.x - this.wPos.x, dy = p.y - this.wPos.y;
    v.moving = dx * dx + dy * dy > 1e-4; this.wPos.x = p.x; this.wPos.y = p.y;
    v.gems = sim.gemsTaken | 0; v.uses = sim.abilityUses | 0;
    v.ready = !!(sim.ability && sim.ability.cdLeft <= 0);
    v.hp = p.maxHp > 0 ? p.hp / p.maxHp : 1;
    v.busy = this.ui.busy ? this.ui.busy() : false;
    v.gemNear = false;
    if (w.want('gems')) { const hw = sim.view.hw, hh = sim.view.hh; for (const g of sim.gems) if (Math.abs(g.x - p.x) < hw && Math.abs(g.y - p.y) < hh) { v.gemNear = true; break; } }
    const plate = w.update(dt, v);
    const frac = plate && w.cur ? 1 - w.cur.age / (WHISPER_DUR[w.cur.id] || 6) : 0;
    this.ui.whisper(v.live ? plate : null, frac, !!st.reducedMotion, [this.ui.hudView && this.ui.hudView.ability, this.touch && this.touch.ab]);
    if (w.dirty) { w.dirty = false; if (this.canKeepHints()) this.save.setHints(w.bits); }
  },
  offerTeach(o) {
    const w = this.whispers;
    if (!w) return null;
    w.tips = this.tipsOn();
    const t = w.offer(o);
    if (w.dirty) { w.dirty = false; if (this.canKeepHints()) this.save.setHints(w.bits); }
    return t;
  },
  pickupWhisper(kind) {
    const w = this.whispers;
    if (!w) return '';
    const line = w.pickup(kind);
    if (w.dirty) { w.dirty = false; if (this.canKeepHints()) this.save.setHints(w.bits); }
    return line;
  },
  // FM5: ability camera kick + Branch-Mane lunge landing (read from the sim's counters / the live miniboss state; never written)
  tickFeel(sim) {
    const f = this.feelPrev;
    if (!f || !this.scene) return;
    const u = sim.abilityUses | 0;
    if (u > f.uses) this.scene.abilityKick();
    f.uses = u;
    const m = sim.mini;
    const ms = m && !m.dead ? m.state : '';
    if (f.mini === 'charge' && ms !== 'charge' && m) { const p = sim.player; if (Math.abs(m.x - p.x) < sim.view.hw && Math.abs(m.y - p.y) < sim.view.hh) this.scene.shake(80, 0.003); }
    f.mini = ms;
  },
  buzz(kind) { if (this.vibe) this.vibe.buzz(kind, performance.now() / 1000); },
  // FM3: the cheapest lantern this save can light right now (results teaching after the second death); null when none.
  cheapestLantern() {
    let best = null;
    for (const id of Object.keys(treeDef.nodes)) {
      try {
        const s = nodeStatus(treeDef, this.save.data, id, data);
        const g = s.next && Number.isFinite(s.next.gold) ? s.next.gold : null;
        if (s.buyable && s.affordable && g !== null && (!best || g < best.gold)) best = { id, gold: g, name: String(treeDef.nodes[id].name || '') };
      } catch { /* a bad node never breaks the results card */ }
    }
    return best && best.name ? best : null;
  },

  // Effects of the player's owned nodes (or a dev preset). Rebuilt from the sanitised save each run.
  treeEffects() {
    const owned = this.params.meta ? presetTree(treeDef, this.params.meta, true) /* previews include gate nodes */ : this.save.data.tree;
    return aggregateMods(owned, treeDef, data, { tier: tierIndex(this.params.tier || this.runTier || 'normal') }); // tier-bought power applies only on the tiers that pay it
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
      bookFrac: (() => { try { const b = this.book(); return b.pages.total ? b.pages.found / b.pages.total : 0; } catch { return 0; } })(),
      clearRegrowth: () => {
        if (this.save.data.notes && this.save.data.notes.regrowth) { delete this.save.data.notes.regrowth; this.save.saveNow(); }
      },
      onClose: () => this.showMenu(),
    };
  },

  // focusId: a lantern to select on open (FD4 'Open in tree' on a ready Night Gate); back: where Back returns (the map screen), else the title.
  openTree(focusId = null, back = null) {
    this.sim = null;
    this.ui.hideAll();
    const api = this.treeApi();
    if (typeof focusId === 'string' && Object.hasOwn(treeDef.nodes, focusId)) api.focusId = focusId;
    if (typeof back === 'function') api.onClose = back;
    this.ui.tree.open(api);
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
    this.ui.showStart((id, tier) => this.startRun(id, tier));
    // FD3: with 2+ lanterns on this device, the first menu of the session asks whose lantern it is (one lantern: never asked).
    if (!this.lanternAsked && this.lanterns && this.lanterns.list().length > 1) { this.lanternAsked = true; this.ui.showLanterns('pick'); }
    if (this.scene) this.scene.unbindSim();
  },

  // ------------------------------------------------------------------ FD2/FD3 front door: lanterns (profiles)
  openTiers(save) { try { return aggregateMods(save.tree || {}, treeDef, data).unlocks.tiers; } catch { return []; } },
  firstChapter() { return Object.keys(data.chapters)[0]; },

  // ------------------------------------------------------------------ FD4 map + night select
  nightChoice() { return hasNightChoice(this.save.data, data, treeDef, this.openTiers(this.save.data)); },
  // The night the next run starts on (the Continue whisper names it): Twilight until there is a choice, then the remembered / recommended night.
  nextNightId(save = this.save.data) { const open = this.openTiers(save); return hasNightChoice(save, data, treeDef, open) ? defaultNight(save, data, treeDef, open) : 'normal'; },
  nightView(heroId, tier) {
    const s = this.save.data;
    const hid = typeof heroId === 'string' && Object.hasOwn(data.characters, heroId) ? heroId : null;
    let closest = [];
    try { closest = closestUnlocks(treeDef, s, data, 1); } catch { closest = []; }
    return mapView({ save: s, data, def: treeDef, openTiers: this.openTiers(s), heroId: hid, heroName: hid ? splitName(data.characters[hid].name).name : '', tier: TIER_IDS.includes(tier) ? tier : null, closest });
  },

  hasProgress() { const d = this.save.data; return (d.stats.runs || 0) > 0 || Object.keys(d.tree).length > 0 || d.gold > 0 || d.shards > 0; },

  frontDoor(lastHero) {
    const L = this.lanterns;
    if (!L) return null;
    const s = this.save.data;
    const tiers = this.openTiers(s);
    const entry = L.list().find((x) => x.id === L.active) || { id: 'l1', name: 'Lantern 1' };
    const heroId = typeof lastHero === 'string' && Object.hasOwn(data.characters, lastHero) ? lastHero : mostPlayedHero(s.stats, data);
    const heroName = heroId ? splitName(data.characters[heroId].name).name : '';
    const canNew = this.hasProgress() && !L.locked && !L.legacyMode;
    return {
      lantern: { id: entry.id, name: entry.name, title: s.titles && s.titles.pick && TITLES[s.titles.pick] ? TITLES[s.titles.pick].name : '' },
      almanac: this.almanacEntry(),
      bands: (s.titles && s.titles.got ? s.titles.got.length : 0),
      purses: purses(s, tiers),
      whisper: continueWhisper(heroName, { id: this.nextNightId(s), name: resolveTier(data.tiers, this.firstChapter(), this.nextNightId(s)).name }),
      treeDot: treeAffordable(treeDef, s, data),
      treeLine: treeWhisperShort(s.gold, s.shards) || (this.hasProgress() ? LANTERN.treeNothing : LANTERN.treeFirst),
      newGame: canNew ? { free: MAX_LANTERNS - L.list().length } : null,
    };
  },

  lanternScreen() {
    const L = this.lanterns;
    const cards = L.list().map((e) => {
      const act = e.id === L.active;
      const pk = act && !this.save.readOnly ? { status: 'ok', save: this.save.data, text: 'active' } : L.peek(e.id);
      const sum = lanternSummary(e, pk, data, pk && pk.save ? this.openTiers(pk.save) : []);
      sum.active = act;
      return sum;
    });
    return { cards, canCreate: L.canCreate(), locked: L.locked || L.legacyMode, note: L.locked || L.legacyMode ? L.note : '' };
  },

  // Open the active lantern's save. Settings are per device (LOCKED): the ones in use carry over to the lantern being opened.
  reopenSave() {
    const prev = { ...this.save.data.settings };
    this.save.flush();
    this.save = this.lanterns.openActive();
    this.save.load();
    if (!this.save.readOnly && JSON.stringify(this.save.data.settings) !== JSON.stringify(prev)) this.save.setSettings(prev);
    if (this.ui) this.ui.lastHero = null;
    this.applySettings();
  },

  lightLantern(id) {
    if (id === this.lanterns.active) return { ok: true };
    const r = this.lanterns.setActive(id);
    if (r.ok) this.reopenSave();
    return r;
  },

  createLantern(name) {
    const r = this.lanterns.create(typeof name === 'string' ? name.trim() : '');
    if (!r.ok) return r;
    return this.lightLantern(r.id);
  },

  renameLantern(id, name) { return this.lanterns.rename(id, name); },

  lanternText(id) {
    if (id === this.lanterns.active && !this.save.readOnly) return this.save.exportText();
    const pk = this.lanterns.peek(id);
    return pk && pk.text ? pk.text : null;
  },

  exportLantern(id) {
    const e = this.lanterns.list().find((x) => x.id === id);
    const text = e ? this.lanternText(id) : null;
    if (!text) return { ok: false, message: 'Nothing to export yet: this lantern has not been played.' };
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = exportFileName(e.name);
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return { ok: true, message: LANTERN.exported(e.name) };
    } catch { return { ok: false, message: LANTERN.exportFail }; }
  },

  // Delete = the card's hold-to-confirm. The deleted save is kept in memory for one minute so Undo can light it again (as a new lantern).
  deleteLantern(id) {
    const L = this.lanterns;
    const e = L.list().find((x) => x.id === id);
    if (!e) return { ok: false, error: 'No such lantern.' };
    const text = this.lanternText(id);
    const undoable = !!(text && parseSave(text).ok);
    const wasActive = id === L.active;
    if (wasActive) this.save.flush();
    const r = L.remove(id);
    if (!r.ok) return r;
    if (wasActive) this.reopenSave();
    this.undoBuf = undoable ? { text, name: e.name, at: Date.now() } : null;
    return { ok: true, undo: undoable, message: LANTERN.deleted(e.name) };
  },

  undoDelete() {
    const u = this.undoBuf;
    this.undoBuf = null;
    if (!u || Date.now() - u.at > UNDO_MS) return { ok: false, message: 'Too late to undo: the lantern is gone.' };
    const r = this.lanterns.importNew(u.text, u.name);
    return r.ok ? { ok: true, message: LANTERN.undone(u.name) } : { ok: false, message: r.error || 'Could not undo.' };
  },

  // Replace mode (all 3 lit): put the chosen lantern out and light a fresh one in its place, then pick a hero.
  replaceLantern(id, name) {
    const nm = typeof name === 'string' ? name.trim() : '';
    if (nm) { const n = cleanName(nm); if (!n.ok) return { ok: false, error: n.error }; }
    if (id === this.lanterns.active) this.save.flush();
    const r = this.lanterns.remove(id);
    if (!r.ok) return r;
    this.undoBuf = null;
    const c = this.lanterns.create(nm);
    if (!c.ok) { this.reopenSave(); return c; }
    this.lanterns.setActive(c.id);
    this.reopenSave();
    return { ok: true };
  },

  // Called every rendered frame by the scene.
  frame(dt) {
    const sim = this.sim;
    if (this.touch) this.touch.sync(!!sim && sim.state === 'running' && !this.paused && !this.ui.settingsOpen);
    if (this.audio) this.audio.frame(this.audioView(sim), sim, dt);
    if (!sim) { if (this.ui.whisperOn && this.ui.whisperOn()) this.ui.whisper(null); return; }
    if (sim.state === 'running' && !this.paused && !this.freeze) sim.step(dt, this.scene.readInput());
    else if ((this.paused || sim.state !== 'running') && this.scene.drainAbilityKey) this.scene.drainAbilityKey(); // Space on a pause button, a level-up card or the end screen must not queue an ability for when play resumes

    if (sim.events.length) {
      for (const ev of sim.events) this.onEvent(ev);
      sim.events.length = 0;
    }
    this.tickFeel(sim);
    this.tickWhispers(sim, dt);

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

  // AU4: what the music reads each frame (read-only from the sim snapshot + the display clock; one reused object, never written back).
  audioView(sim) {
    const v = this.auView || (this.auView = { where: 'menu', t: 0, fight: 0, phase: 0, end: '', calm: false, low: false, paused: false, running: false, hp: 1 });
    v.calm = !!this.save.data.settings.reducedMotion; v.low = !!(this.scene && this.scene.quality && this.scene.quality.tier === 'low');
    if (!sim) { v.where = 'menu'; v.end = ''; v.fight = 0; v.running = false; v.paused = false; v.hp = 1; return v; }
    const f = sim.fight, p = sim.player;
    v.where = 'run'; v.t = this.scene && this.scene.showClock ? this.scene.showClock(sim) : sim.time;
    v.end = sim.state === 'victory' || sim.state === 'defeat' ? sim.state : '';
    v.fight = f && (f.stage !== 'over' || sim.state === 'victory') ? 1 : 0; v.phase = f ? f.phase | 0 : 0;
    v.paused = !!this.paused; v.running = sim.state === 'running' && !this.paused; v.hp = p && p.maxHp > 0 ? p.hp / p.maxHp : 1;
    return v;
  },

  onEvent(ev) {
    const d = this.data;
    if (this.audio) this.audio.event(ev); // AU4-AU6: every sim event's cue (render/audio only)
    if (this.scene.bossView && ev.type.startsWith('boss')) this.scene.bossView.onEvent(ev);
    if (ev.type === 'bossWake') { this.ui.hudView.bossBanner('The Elder Treant wakes', 'the oldest mask in the forest', !this.save.data.settings.reducedMotion); return; }
    if (ev.type === 'hurt') { this.scene.shake(); this.ui.hurt(); this.scene.hurtFx(ev); this.buzz('hurt'); const p = this.sim && this.sim.player; if (p && p.maxHp > 0 && p.hp > 0 && p.hp / p.maxHp < 0.3) this.scene.stop(0.03); } // FM5: a hit under 30% HP gets the existing hit-stop (cap, cooldown, Calm off) // DR1: the edge flash + lantern dip are opacity-only, so they stay under Calm motion (shake does not)
    else if (ev.type === 'boss') {
      const b = this.sim && this.sim.boss;
      if (!(b && b.fight)) this.ui.bossIntro(b ? d.enemies[b.type].name : 'Boss', !this.save.data.settings.reducedMotion); // the fight has its own banner (bossWake)
      this.scene.bossIntro();
    } else if (ev.type === 'levelup') { this.scene.levelBurst(); this.buzz('level'); }
    else if (ev.type === 'mini') { this.ui.hudView.bossBanner(`The ${d.enemies[ev.enemy] ? d.enemies[ev.enemy].name : 'old alpha'} howls`, 'the old leader of the rival pack', !this.save.data.settings.reducedMotion); if (this.scene.miniView) this.scene.miniView.onEvent(ev); } // EN7 arrival banner
    else if (ev.type === 'howl' || ev.type === 'miniDead' || ev.type === 'chestDrop' || ev.type === 'miniPhase') { if (this.scene.miniView) this.scene.miniView.onEvent(ev); if (ev.type === 'miniDead') { this.ui.toast('The Branch-Mane falls: a Lantern Reliquary'); this.scene.stop(0.05); } }
    else if (ev.type === 'chest') { if (this.scene.miniView) this.scene.miniView.onEvent(ev); this.ui.hudView.flareHp(); this.scene.chestFx(); if (ev.tier === 0) this.ui.toast('Lantern Reliquary: light, warmth and coin', this.pickupWhisper('chest')); } // EN8: Medium/Large open the choice screen
    else if (ev.type === 'swarm') this.ui.toast(ev.enemy === 'wolf' ? 'A wolf pack closes in' : 'A murder of crows descends');
    else if (ev.type === 'evolve') {
      const ev0 = this.save.data.stats.evolved; // E9: recipe shown only the first time this evolution is ever taken (recorded in stats.evolved at run end)
      this.ui.evolvePlate(ev.id, !(ev0 && Object.hasOwn(ev0, ev.id) && ev0[ev.id] > 0), !!this.save.data.settings.reducedMotion);
      this.scene.evolveMoment(ev.id);
      this.buzz('evolve');
    }
    else if (ev.type === 'heart') { this.ui.toast('Health restored', this.pickupWhisper('heart')); this.scene.heartFx(); this.ui.hudView.flareHp(); }
    else if (ev.type === 'magnet') { this.ui.toast('Soul Magnet', this.pickupWhisper('magnet')); this.scene.magnetFx(); }
    else if (ev.type === 'rally') { this.ui.toast('Rally the Pack'); this.scene.rallyMoment(); }
    else if (ev.type === 'wheel') this.ui.toast('Candle Wheel');
    else if (ev.type === 'revive') this.ui.toast('Last Light: you rise again');
    else if (ev.type === 'bossDead') { this.buzz('boss'); if (!(this.sim && this.sim.fight)) this.ui.toast('The Elder Treant falls (+soul shards)'); }
    else if (ev.type === 'bossPhase') this.ui.toast(ev.phase === 1 ? 'The Elder Treant blights: Husks answer its call' : 'The Elder Treant rages: its heart glows');
    else if (ev.type === 'slam') this.scene.shake(160, 0.008);
  },

  pick(key) {
    const sim = this.sim;
    if (!sim || sim.state !== 'levelup') return;
    if (!sim.pickCard(key)) return;
    if (this.audio) this.audio.play('ui_pick');
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

  // ------------------------------------------------------------------ CX1-CX6 the Almanac + celebrations (derived from the save; two small fields)
  // Reads / tells / titles persist only for a writable lantern outside debug runs (screenshots and ?auto= runs never touch the save).
  canKeepCodex() { return !this.isDebugRun() && !this.save.readOnly; },
  book(save = this.save.data) { return almanac(save, data, treeDef, { openTiers: this.openTiers(save) }); },
  // An old save (codex v 0): what it already holds is read + told, so the first visit is calm. Run before any banking.
  adoptCodex() {
    const s = this.save.data;
    if (s.codex && s.codex.v === 1) return;
    const c = adopt(s.codex, this.book(s));
    if (this.canKeepCodex()) this.save.setCodex(c); else s.codex = c;
  },
  almanacEntry() {
    this.adoptCodex();
    const b = this.book();
    if (!b.unlocked.size && !this.hasProgress()) return null; // a brand-new lantern: nothing written yet
    const fresh = [...b.unlocked].some((k) => b.isNew(k));
    return { fresh, line: `${b.pages.found} / ${b.pages.total} pages` };
  },
  almanacView() {
    this.adoptCodex();
    const s = this.save.data;
    return { book: this.book(s), titles: s.titles, calm: !!s.settings.reducedMotion };
  },
  almanacRead(keys) {
    const c = markRead(this.save.data.codex, Array.isArray(keys) ? keys : []);
    if (this.canKeepCodex()) this.save.setCodex(c); else this.save.data.codex = c;
  },
  pickTitle(id) {
    const t = this.save.data.titles;
    if (!t || !t.got.includes(id)) return;
    const n = { got: t.got, pick: id };
    if (this.canKeepCodex()) this.save.setTitles(n); else this.save.data.titles = n;
  },
  // After banking: what this run wrote (CX4). Bigs on a win (max 1), mediums (max 3), smalls fold into the ledger line; told once, saved.
  runCelebrations(won) {
    try {
      const s = this.save.data;
      const b = this.book(s);
      const q = celQueue(b, s.codex, data, { won });
      const titles = withTitles(s.titles, b.earned);
      if (this.canKeepCodex()) { this.save.setCodex(markTold(s.codex, q.tell)); this.save.setTitles(titles); this.save.saveNow(); }
      return { cards: [...q.big, ...q.medium], ledger: ledgerLine(q), any: q.tell.length > 0 || [...b.unlocked].some((k) => b.isNew(k)) };
    } catch { return null; } // a bad entry never breaks the results card
  },
  // CX5: big moments a defeat held back play on the next title visit ("While you were away"), one per visit.
  titleCelebrations() {
    if (!this.canKeepCodex()) return [];
    try {
      this.adoptCodex();
      const s = this.save.data;
      const b = this.book(s);
      const q = celQueue(b, s.codex, data, { place: 'title' });
      if (!q.big.length) return [];
      this.save.setCodex(markTold(s.codex, q.tell));
      this.save.setTitles(withTitles(s.titles, b.earned));
      return q.big;
    } catch { return []; }
  },

  // Debug URL params never touch the real save.
  isDebugRun() {
    const p = this.params;
    return !!(p.auto || p.meta || p.god || p.startTime || p.rerolls || p.banishes || p.grant || p.bless || p.debug || p.tier !== null || p.seed !== null);
  },

  bankRun(sim) {
    if (this.banked || this.isDebugRun()) return null;
    this.banked = true;
    this.adoptCodex(); // CX1: an old save's progress counts as told BEFORE this run is banked
    const b = this.save.bankRun(sim.result(), { def: treeDef, data, unlockedTiers: this.openTiers(this.save.data) });
    b.newly = newlyLines(treeDef, b.newlyMet, data);
    b.closest = closestUnlocks(treeDef, this.save.data, data, 3);
    b.night = this.nightResult(b.tier, sim.result());
    { const s = this.save.data; let ch = null; try { ch = sim.state === 'victory' ? null : this.cheapestLantern(); } catch { ch = null; } b.teach = resultTeach({ won: sim.state === 'victory', stats: s.stats, treeOwned: Object.keys(s.tree || {}).length > 0, cheapest: ch, gold: s.gold }); }
    b.cel = this.runCelebrations(sim.state === 'victory');
    if (!this.save.persistent) b.note = 'Browser storage unavailable: progress is kept only until you close this tab. Use Settings > Export save.';
    return b;
  },

  // FD5: what the results card says about the night (badge, Again label, heroes whose first dawn on this night is still waiting).
  nightResult(tier, r) {
    const cid = r && typeof r.chapter === 'string' && Object.hasOwn(data.chapters, r.chapter) ? r.chapter : this.firstChapter();
    const tid = tier && TIER_IDS.includes(tier.tier) ? tier.tier : 'normal';
    const t = resolveTier(data.tiers, cid, tid);
    const rec = ((this.save.data.stats.tiers || {})[cid] || {})[tid] || null;
    const heroes = Object.keys(data.characters).filter((h) => this.heroUnlocked(h));
    const waiting = t.glass.first > 0 ? heroes.filter((h) => !(rec && rec.heroes && rec.heroes[h] && rec.heroes[h].first === true)).map((h) => splitName(data.characters[h].name).name) : [];
    return { id: tid, name: t.name, choice: this.nightChoice(), goldMul: t.goldMul, firstGlass: t.glass.first, firstShards: t.firstShards, waiting };
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
    if (this.audio) this.audio.configure(s);
    if (this.touch) {
      const coarse = typeof matchMedia === 'function' && (matchMedia('(pointer: coarse)').matches || matchMedia('(hover: none)').matches);
      this.touch.configure(touchEnabled(s.touchMode, this.params.touch, coarse, 'ontouchstart' in window), s.stickSize);
    }
  },

  settingsHandlers() {
    return {
      getSettings: () => ({ ...this.save.data.settings }),
      resolvedBrightness: (stored) => resolveBrightness(stored, this.isPhone()),
      setSetting: (patch) => { this.save.setSettings(patch); this.applySettings(); if (this.audio && patch && 'sfxVol' in patch) this.audio.play('gem'); if (this.sim) this.sim.setAutoRule(this.save.data.settings.autoRule); },
      hasAutoRule: () => !!aggregateMods(this.save.data.tree, treeDef, data).perks.autoRule, // 'Chosen Moment' owned: show the auto-fire choice
      exportSave: () => this.save.exportText(),
      maxSaveBytes: MAX_SAVE_BYTES,
      checkImport: (t) => this.save.checkImport(t),
      applyImport: (s) => { this.save.applyImport(s); this.applySettings(); },
      resetSave: () => { this.save.reset(); this.applySettings(); },
      loadNote: () => { const n = this.save.loadNote; if (n && !this.save.readOnly) this.save.loadNote = null; return n; }, // recovery message: once on the title screen (the newer-version lock stays)
      storageNote: () => (this.save.readOnly ? this.save.loadNote : this.save.persistent ? null : 'Browser storage is blocked or full: progress will not persist.'),
      isFirstRun: () => (this.save.data.stats.runs || 0) === 0 && Object.keys(this.save.data.tree).length === 0,
      hasProgress: () => this.hasProgress(),
      frontDoor: (lastHero) => this.frontDoor(lastHero),
      lanternScreen: () => this.lanternScreen(),
      lightLantern: (id) => this.lightLantern(id),
      createLantern: (name) => this.createLantern(name),
      renameLantern: (id, name) => this.renameLantern(id, name),
      exportLantern: (id) => this.exportLantern(id),
      deleteLantern: (id) => this.deleteLantern(id),
      undoDelete: () => this.undoDelete(),
      replaceLantern: (id, name) => this.replaceLantern(id, name),
      getBank: () => ({ gold: this.save.data.gold, shards: this.save.data.shards }),
      openSettings: () => this.ui.showSettings(),
      openTree: (focusId, back) => this.openTree(focusId, back),
      nightChoice: () => this.nightChoice(),
      nightView: (heroId, tier) => this.nightView(heroId, tier),
      heroUnlocked: (id) => this.heroUnlocked(id),
      closeSettings: () => { if (!this.sim) this.showMenu(); },
      resetTips: () => this.resetTips(),
      hideWhisper: () => this.hideWhisper(),
      offerTeach: (o) => this.offerTeach(o),
      almanacView: () => this.almanacView(),
      almanacRead: (keys) => this.almanacRead(keys),
      pickTitle: (id) => this.pickTitle(id),
      titleCelebrations: () => this.titleCelebrations(),
      closeAlmanac: () => { if (!this.sim && !this.ui.tree.isOpen) { this.ui.showStart(this.ui.onPick); const t = this.ui.screen && this.ui.screen.title; if (t && t.almanac) t.almanac.focus({ preventScroll: true }); } },
    };
  },

  togglePause() {
    if (this.ui.settingsOpen || this.ui.codexView || (this.ui.celActive && this.ui.celActive()) || performance.now() - (this.ui.escAt || -1e9) < 250) return;
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
    this.startRun(this.characterId, this.runTier || 'normal'); // Again = same hero + map + night
  },
};
