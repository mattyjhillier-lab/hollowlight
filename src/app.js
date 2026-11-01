// Glue between the simulation, the Phaser scene and the DOM overlay.
import { showLoading } from './ui/loading.js';
import { Prebake } from './gfx/prebake.js'; // FIX4 run-start loading bar
import { shouldNudge } from './save/nudge.js';
import { downloadText, SAFE } from './ui/savesafety.js';
import { applyTextSize } from './ui/textsize.js';
import { setActiveKeymap, dirMap, keyLabel } from './input/keymap.js';
import { Sim } from './sim/Sim.js';
import data, { treeInfo } from './data/index.js';
import { SaveStore } from './save/store.js';
import { MAX_SAVE_BYTES, setTreeDef, parseSave, defaultSettings } from './save/schema.js';
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
import { cardFor, hasIntro, withIntro, introsForOffer, CARDS, INTRO_IDS, cleanIntros } from './ui/introcopy.js';
import { Whispers, DUR as WHISPER_DUR, startBits, resultTeach, TIPS_AGAIN } from './ui/whispers.js';
import { almanac, adopt, markRead, markTold, withTitles } from './meta/codex.js';
import { queue as celQueue, ledgerLine } from './meta/celebrate.js';
import { TITLES } from './ui/codexcopy.js';
import { SPIRIT_LINES } from './ui/titlecopy.js';
import { charsView, CHARS, bondCelebration, mergeBond } from './ui/charcopy.js';
// the title whisper under Characters: the nearest keepsake, else the default line
function charsLine(s, d) { try { const v = charsView(s, d, treeDef).find((x) => !x.awake && x.keep && x.keep.n > 0); return v ? v.keep.line : CHARS.openWhisper; } catch { return CHARS.openWhisper; } }
const SPIRIT_LINE_OF = (id) => (Object.hasOwn(SPIRIT_LINES, id) ? SPIRIT_LINES[id] : '');
import { startableWeapons, grantStarter, starterPool } from './meta/starter.js';
import { isAwake, bondLevel, keepsakeEligible } from './save/chars.js';
import { validateCosmTree, resolveCosm, cleanCosm } from './meta/cosmetics.js';
import { wearView } from './ui/wearcopy.js';
import { DARK } from './ui/darkui.js';
import { SITE_EVENTS, SITE_TOAST } from './ui/sitecopy.js'; // map events v1
import { createPad } from './ui/padmap.js';
// Validate the skill tree once at boot; the save validator needs it to sanitise owned nodes.
export const treeDef = compileTree(data.tree, data);
validateCosmTree(treeDef, data.cosmetics); // EXTRAS v1: every Wardrobe lantern names a real cosmetic and nothing else (throws at boot)
setTreeDef(treeDef, data);

const UNDO_MS = 60000;

export const app = {
  data,
  sim: null,
  ui: null,
  scene: null,
  paused: false,
  freeze: false, // hit-stop
  introQ: [], // FIX3 new-feature cards waiting / open (src/ui/introcopy.js)
  introOpen: false,
  introMem: 0,
  introOfferRef: null,
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
  // FIX4: the run begins only when the pre-bake is done (no bake work after t=0). Already done (Again, later runs) or a scripted ?auto= run = start at once.
  // Otherwise the front-door bake is brought to the front behind a truthful loading bar (always shown for the first run of a session: the build and a ~45 frame warm-up hold sit behind it).
  startRun(characterId, tier = 'normal', weaponId = null) {
    let pb = this.scene && this.scene.prebake;
    const sc = this.scene, bs = sc && sc.bState;
    // The forest floor must be ready before the run begins for ANY reason (mode switched off by the guard, Low tier, no pre-bake): then a ground-only bake runs behind the loading bar, unguarded.
    if (!pb && sc && !(this.params.auto && !this.params.perf) && bs && !sc.flatGround && bs.ready < 1 && !(bs.lazy && bs.lazy.done)) {
      pb = sc.prebake = new Prebake(sc, () => this.ownedWeapons(), 'ground'); pb.noGuard = true;
    }
    if (!pb || (pb.done && pb.audioDone) || (this.params.auto && !this.params.perf) || this.loadingRun) return this.loadingRun ? undefined : this.startRunNow(characterId, tier, weaponId);
    this.loadingRun = true;
    const ld = showLoading(); ld.set(pb.p, pb.label);
    pb.finish(this.audio, (pr, label) => ld.set(pr, label)).catch(() => {}).then(() => {
      // The run is built behind the bar and held frozen for ~45 rendered frames, so the first-draw costs (lightmap build, first sprite/shader use) land here, not in the first second of play.
      let released = false, n = 0;
      const release = () => { if (released) return; released = true; this.warmHold = false; this.loadingRun = false; ld.close(); };
      try { this.startRunNow(characterId, tier, weaponId); } catch (e) { release(); throw e; }
      this.warmHold = true; ld.set(0.99, 'Lighting the lantern');
      const tick = () => { if (released) return; if (++n < (pb.hold || 45)) requestAnimationFrame(tick); else release(); };
      requestAnimationFrame(tick); setTimeout(release, 8000); // (a hidden tab never ticks: the timer is the safety net)
    });
  },

  // FIX4b: weapon ids this lantern can be offered (tree-gated ones need their heart); the pre-bake only makes art for these. Render-side, reads the save only.
  ownedWeapons() { return startableWeapons(data, treeDef, this.save.data.tree); },

  startRunNow(characterId, tier = 'normal', weaponId = null) {
    const p = this.params;
    this.ensureStarter();
    const s0 = this.save.data;
    // CHARACTER SYSTEM v2: only an awake hero and a tree-unlocked starting spirit can be played (anything else falls back); the pick is remembered
    if (!(typeof characterId === 'string' && Object.hasOwn(data.characters, characterId) && (p.auto || isAwake(s0, characterId)))) characterId = (s0.notes.loadout || s0.notes.starter || { hero: 'wren' }).hero;
    const startable = startableWeapons(data, treeDef, s0.tree);
    const want = [weaponId, s0.notes.loadout && s0.notes.loadout.hero === characterId ? s0.notes.loadout.weapon : null, s0.notes.loadout && s0.notes.loadout.weapon]; // never the hero's built-in (kindred) weapon: heroes are not tied to a spirit
    const startWeapon = want.find((w) => typeof w === 'string' && startable.includes(w)) || startable[0] || data.characters[characterId].kindred;
    if (!p.auto && !this.save.readOnly && !this.isDebugRun()) { s0.notes.loadout = { hero: characterId, weapon: startWeapon }; }
    this.characterId = characterId;
    this.startWeaponId = startWeapon;
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
      startWeapon,
      bond: this.isDebugRun() ? 0 : bondLevel(s0, data, characterId), // Bond is banked between runs and read once here
      keepsakes: this.isDebugRun() ? [] : keepsakeEligible(s0, data, treeDef),
      assist: p.assist === true || (!p.tier && this.save.data.settings.gentleLight === true), // EXTRAS v1 Gentle Light (the Sim keeps it on Twilight only; ?assist=1 is a debug run)
      sites: p.sites !== false, // map events v1 'Hollow Places': on in every real run (every night); ?sites=0 turns them off (a debug run)
    });
    if (p.grant) this.applyGrants(sim, p.grant);
    if (p.bless) this.applyBless(sim, p.bless);
    this.sim = sim;
    this.introClear(); this.introOfferRef = null;
    this.paused = false;
    this.banked = false;
    this.endPending = false;
    this.lastState = 'running';
    this.ui.hideAll();
    this.ui.showHud();
    this.ui.updateHud(sim);
    if (this.scene) this.scene.bindSim(sim);
    this.applyCosm(sim);
    this.startWhispers(sim);
  },

  // EXTRAS v1 Wear drawer: only owned, known ids are kept (wearView re-checks ownership; cleanCosm drops unknown ids); one save write.
  setWear(heroId, sel) {
    if (!(typeof heroId === 'string' && Object.hasOwn(data.characters, heroId)) || !sel || typeof sel !== 'object') return false;
    const v = wearView(this.save.data, data, treeDef, heroId, { flame: sel.flame, trail: sel.trail, look: sel.look });
    const s = this.save.data;
    const cur = cleanCosm(s.cosm, data).worn;
    s.cosm = cleanCosm({ worn: { flame: v.sel.flame, trail: v.sel.trail, look: { ...cur.look, ...(v.sel.look ? { [heroId]: v.sel.look } : {}) } } }, data);
    if (!this.save.readOnly && !this.isDebugRun()) this.save.saveNow();
    return true;
  },

  // EXTRAS v1: what this run wears (render only). Defaults -> null (the scene keeps its old paths); a bad save can only fall back to defaults.
  applyCosm(sim) {
    let v = null;
    try { v = resolveCosm(this.save.data, data, treeDef, sim.characterId); } catch { v = null; }
    const plain = !v || (v.flame.isDefault && v.trail.isDefault && (!v.look || v.look.isDefault));
    if (this.scene && this.scene.setCosm) this.scene.setCosm(plain ? null : v);
    if (this.ui.hudView && this.ui.hudView.setFlame) this.ui.hudView.setFlame(v && !v.flame.isDefault ? v.flame.css : null, v && !v.flame.isDefault ? v.flame.cssCore : null);
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
    const root = win.document && win.document.documentElement; // DESKTOP D5: html.inp-kb while the keyboard was the last input (shows key badges on the menu tabs)
    win.addEventListener('keydown', (e) => { this.setInput('kb'); if (root && e.key !== 'F5') root.classList.add('inp-kb'); }, true);
    win.addEventListener('pointerdown', () => { if (root) root.classList.remove('inp-kb'); }, true);
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
    this.introKeep(0);
    if (this.whispers) this.whispers.bits = TIPS_AGAIN;
  },
  // ------------------------------------------------------------------ FIX3 new-feature cards (first time only; the sim is frozen while one is up)
  // On for real runs of a writable lantern with Tips on. Debug / ?auto= / bot runs never show or block on a card unless ?intros=1 (then 'seen' stays in memory only).
  introsOn() { return this.save.data.settings.tips !== false && (!this.isDebugRun() || this.params.intros === true); },
  introBits() { return this.isDebugRun() ? (this.introMem | 0) : this.save.data.intros; },
  introKeep(bits) { bits = cleanIntros(bits); if (this.isDebugRun()) this.introMem = bits; else if (!this.save.readOnly) this.save.setIntros(bits); else this.save.data.intros = bits; },
  introCtx() {
    const sim = this.sim;
    return { abilityName: sim && sim.ability ? sim.ability.name : '', key: (keyLabel('ability') || 'Space').toUpperCase(), touch: this.inputKind() === 'touch' };
  },
  introAsk(id) {
    if (!this.sim || !this.introsOn() || !INTRO_IDS.includes(id) || hasIntro(this.introBits(), id) || this.introQ.includes(id)) return false;
    this.introQ.push(id);
    this.introNext();
    return true;
  },
  introNext() {
    if (this.introOpen || !this.introQ.length) return;
    const id = this.introQ.shift();
    const card = cardFor(id, this.introCtx());
    this.introKeep(withIntro(this.introBits(), id)); // seen the moment it opens: a closed tab never replays it
    if (!card) { this.introNext(); return; }
    this.introOpen = true;
    if (this.touch) this.touch.sync(false);
    this.ui.showIntro(card, { onDone: () => this.introDone() });
  },
  introDone() {
    this.introOpen = false;
    this.ui.hideIntro();
    if (this.introQ.length) this.introNext();
  },
  introClear() { this.introQ = []; this.introOpen = false; if (this.ui.hideIntro) this.ui.hideIntro(); },
  /** Almanac > How things work: every card again, one after the other (works anywhere; does not touch the seen bits). */
  introReplay() {
    if (this.ui.introActive()) return;
    const ids = INTRO_IDS.filter((id) => CARDS[id]);
    const ctx = this.introCtx();
    const at = (i) => {
      if (i >= ids.length) { this.ui.hideIntro(); return; }
      this.ui.showIntro(cardFor(ids[i], ctx), { pos: { n: i + 1, total: ids.length }, onDone: () => at(i + 1) });
    };
    at(0);
  },
  // called every frame before the whispers: the ability card (the first time the ability is ready) and the offer cards (Blessing, Evolution, Soul Shard)
  tickIntros(sim) {
    if (!this.introsOn()) return;
    if (sim.state === 'levelup' && sim.offer && sim.offer !== this.introOfferRef) {
      this.introOfferRef = sim.offer;
      for (const id of introsForOffer(sim.offer)) this.introAsk(id);
    }
    if (sim.state === 'running' && !this.paused && sim.ability && sim.ability.cdLeft <= 0 && sim.time >= 2 && !hasIntro(this.introBits(), 'ability')) {
      const w = this.whispers;
      // the first-minute ladder already taught it (plate seen or on screen): count the card as seen instead of saying it twice
      if (w && (w.bits >>> 3 & 1 || (w.cur && w.cur.id === 'ability'))) this.introKeep(withIntro(this.introBits(), 'ability'));
      else { if (w && w.on()) { w.bits |= 1 << 3; w.dirty = true; } this.introAsk('ability'); }
    }
  },
  tickWhispers(sim, dt) {
    const w = this.whispers;
    if (!w) return;
    const st = this.save.data.settings;
    w.tips = this.tipsOn();
    const v = this.wv, p = sim.player;
    v.live = sim.state === 'running' && !this.paused && !this.introOpen && !this.ui.settingsOpen;
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

  // CHARACTER SYSTEM v2: a hero is playable once awake (starter pick, keepsakes, or a pre-v2 save). Unknown ids are not playable.
  heroUnlocked(id) {
    if (!Object.hasOwn(data.characters, id)) return false;
    if (this.isDebugRun()) return true; // debug / screenshot runs: every hero (they never touch the save)
    return isAwake(this.save.data, id);
  },

  // A new profile picks one hero + one weapon as its starter set (LOCKED 2026-10-24) on the starter-pick screen (ui.showStarterHero).
  // needsStarter: no pick yet (a writable, non-debug lantern). chooseStarter validates against the data-driven offer, grants and saves.
  needsStarter() {
    const s = this.save.data;
    return !this.isDebugRun() && !this.save.readOnly && !(s.notes && s.notes.starter);
  },
  chooseStarter(heroId, weaponId) {
    const pool = starterPool(data);
    if (!this.needsStarter() || !pool.heroes.includes(heroId) || !pool.weapons.includes(weaponId)) return false;
    if (!grantStarter(this.save.data, data, treeInfo, treeDef, heroId, weaponId)) return false;
    this.save.saveNow();
    return true;
  },
  // The starting-spirit step: every weapon, awake (heart owned) or asleep (dim, with its heart's unlock line).
  spiritChoices(heroId) {
    const s = this.save.data;
    const open = startableWeapons(data, treeDef, s.tree);
    return Object.keys(data.weapons).map((id) => {
      const heart = treeDef.hearts && treeDef.hearts[id];
      let note = '';
      if (!open.includes(id) && heart) { try { const st = nodeStatus(treeDef, s, heart, data); const L = st && st.cond && st.cond.lines && st.cond.lines[0]; note = L ? `Wake it in the Lantern Web · ${String(L.text).slice(0, 48)} ${L.cur}/${L.goal}` : 'Wake it in the Lantern Web'; } catch { note = ''; } }
      return { id, name: data.weapons[id].name, line: '', open: open.includes(id), note };
    }).map((x) => ({ ...x, line: x.open ? SPIRIT_LINE_OF(x.id) : '' }));
  },
  lastLoadout(heroId = null) {
    const n = this.save.data.notes || {};
    const lo = n.loadout || n.starter || {};
    if (heroId && lo.hero !== heroId) return { hero: heroId, weapon: null };
    return { hero: lo.hero || null, weapon: lo.weapon || null };
  },
  // Safety net only (a run started with no starter pick, e.g. an old flow): grant the kindred default. Never on read-only or debug lanterns.
  ensureStarter() {
    const s = this.save.data;
    if (s.notes && s.notes.starter) return;
    if (this.save.readOnly || this.isDebugRun()) return;
    if (grantStarter(s, data, treeInfo, treeDef, 'wren', data.characters.wren.kindred)) this.save.saveNow();
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
    this.introClear();
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
    if (this.sim && this.sim.endless && !this.banked) this.bankRun(this.sim); // EXTRAS v1: leaving the dark keeps the dawn (and the dark so far)
    if (this.ui.hideDarkChoice) this.ui.hideDarkChoice();
    this.sim = null;
    this.introClear();
    this.paused = false;
    this.ui.hideAll();
    this.ui.showStart((id, tier, weapon) => this.startRun(id, tier, weapon));
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
      chars: s.chars && Object.values(s.chars).some((c) => c && c.woke) ? { line: charsLine(s, data) } : null, // CH5: the Characters page, once a hero is awake
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

  // FD6 controller stub: while no run is being played (menus, pause, level-up, results) a pad drives the screens like the keyboard. Never moves the hero.
  padTick(sim, dt) {
    const nav = globalThis.navigator;
    if (!nav || !nav.getGamepads) return;
    const playing = !!sim && sim.state === 'running' && !this.paused && !this.ui.settingsOpen;
    const pad = this.pad || (this.pad = createPad());
    if (playing) { pad.reset(); return; }
    let pads; try { pads = Array.from(nav.getGamepads() || []); } catch { return; }
    for (const key of pad.step(pads, dt)) this.padKey(key);
  },
  padKey(key) {
    const doc = globalThis.document;
    if (!doc) return;
    const a = doc.activeElement;
    if (key === 'Enter' && a && a.classList && a.classList.contains('lg-btn') && a.click) { this.setInput('kb'); a.click(); return; } // a synthetic Enter does not press a focused button
    const ev = new globalThis.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    globalThis.dispatchEvent(ev);
    if (!ev.defaultPrevented && key.startsWith('Arrow')) { // a screen with no arrow handling: walk its buttons
      const list = Array.from(doc.querySelectorAll('.lg-btn')).filter((b) => b.offsetParent !== null && !b.disabled);
      if (!list.length) return;
      const i = list.indexOf(a), fwd = key === 'ArrowDown' || key === 'ArrowRight';
      list[i < 0 ? 0 : (i + (fwd ? 1 : list.length - 1)) % list.length].focus();
    }
  },

  // Called every rendered frame by the scene.
  frame(dt) {
    const sim = this.sim;
    this.padTick(sim, dt);
    if (this.touch) this.touch.sync(!!sim && sim.state === 'running' && !this.paused && !this.introOpen && !this.ui.settingsOpen);
    if (this.audio) this.audio.frame(this.audioView(sim), sim, dt);
    if (!sim) { if (this.ui.whisperOn && this.ui.whisperOn()) this.ui.whisper(null); return; }
    if (sim.state === 'running' && !this.paused && !this.freeze && !this.introOpen && !this.warmHold) sim.step(dt, this.scene.readInput());
    else if ((this.paused || this.introOpen || sim.state !== 'running') && this.scene.drainAbilityKey) this.scene.drainAbilityKey(); // Space on a pause button, a level-up card or the end screen must not queue an ability for when play resumes

    this.bossSoonCheck(sim);
    if (sim.events.length) {
      for (const ev of sim.events) this.onEvent(ev);
      sim.events.length = 0;
    }
    this.tickFeel(sim);
    this.tickIntros(sim);
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
        else this.finishRun(sim);
      }
    }
    if (this.endPending && this.scene.bossView.endWait(sim) <= 0) { this.endPending = false; this.finishRun(sim); }

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

  // EXTRAS v1 Endless Dusk (C1-A): after a dawn won at the boss, offer 'Stay in the dark' (not in ?auto= bot / screenshot runs);
  // otherwise (and on 'See the dawn') the results come exactly as before.
  finishRun(sim) {
    if (sim.state === 'victory' && sim.endlessDef && !sim.endless && sim.bossKilled && sim.fightDef && !this.params.auto && this.ui.showDarkChoice) {
      this.ui.showDarkChoice({ onDawn: () => { this.ui.hideDarkChoice(); this.ui.showEnd(sim, this.bankRun(sim)); }, onStay: () => this.stayInDark(sim) });
      return;
    }
    this.ui.showEnd(sim, this.bankRun(sim));
  },
  stayInDark(sim) {
    if (this.sim !== sim || !sim.stayInDark()) return false;
    this.ui.hideDarkChoice();
    this.lastState = 'running';
    if (this.scene && this.scene.enterDark) this.scene.enterDark(sim);
    this.ui.toast(DARK.toast);
    return true;
  },

  // Boss sheet arrival warning (render/audio only, the sim is untouched): 5 s before the Elder Treant a soft ground tremor + 'Something old wakes'.
  bossSoonCheck(sim) {
    const at = sim.chapter && sim.chapter.bossAt, bd = sim.chapter && this.data.enemies[sim.chapter.bossId];
    const was = this.soonT, now = sim.time; this.soonT = now;
    if (!(at > 5) || !bd || !bd.fight || sim.fight || sim.state !== 'running' || this.soonSim !== sim) { this.soonSim = sim; return; }
    if (was < at - 5 && now >= at - 5) this.onEvent({ type: 'bossSoon' });
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
    if (ev.type === 'siteWake' && (ev.kind === 'lamp' || ev.kind === 'road' || ev.kind === 'knot')) this.introAsk(ev.kind);
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
    else if (SITE_EVENTS.has(ev.type)) this.siteEvent(ev);
    else if (ev.type === 'swarm') this.ui.toast(ev.enemy === 'wolf' ? 'A wolf pack closes in' : 'A murder of crows descends');
    else if (ev.type === 'evolve') {
      const ev0 = this.save.data.stats.evolved; // E9: recipe shown only the first time this evolution is ever taken (recorded in stats.evolved at run end)
      this.ui.evolvePlate(ev.id, !(ev0 && Object.hasOwn(ev0, ev.id) && ev0[ev.id] > 0), !!this.save.data.settings.reducedMotion);
      this.scene.evolveMoment(ev.id);
      this.buzz('evolve');
    }
    else if (ev.type === 'heart') { this.ui.toast('Health restored', this.pickupWhisper('heart')); this.scene.heartFx(); this.ui.hudView.flareHp(); }
    else if (ev.type === 'magnet') { this.ui.toast('Soul Magnet', this.pickupWhisper('magnet')); this.scene.magnetFx(); }
    else if (ev.type === 'dash') { this.ui.toast('Pelt Dash'); this.scene.dashMoment(ev); }
    else if (ev.type === 'sanctuary') this.ui.toast('Sanctuary Ring');
    else if (ev.type === 'revive') this.ui.toast('Last Light: you rise again');
    else if (ev.type === 'bossDead') { this.buzz('boss'); if (!(this.sim && this.sim.fight)) this.ui.toast('The Elder Treant falls (+soul shards)'); }
    else if (ev.type === 'bossSoon') { this.ui.toast('Something old wakes'); this.scene.shake(400, 0.003); }
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
  // map events v1: the scene's site layer + one short toast (textContent only, via ui.toast)
  siteEvent(ev) {
    if (this.scene && this.scene.siteView) this.scene.siteView.onEvent(ev);
    const t = SITE_TOAST[ev.type];
    const line = typeof t === 'function' ? t(ev) : t;
    if (line) this.ui.toast(line);
    if (ev.type === 'siteDone' || ev.type === 'lampLit') { if (ev.kind === 'knot' || ev.reward === 'heart') this.ui.hudView.flareHp(); }
  },

  isDebugRun() {
    const p = this.params;
    return !!(p.auto || p.meta || p.god || p.startTime || p.rerolls || p.banishes || p.grant || p.bless || p.debug || p.tier !== null || p.seed !== null || p.assist || p.sites === false);
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
    // CH6: the Bond beat (Bond level, keepsake, a hero waking) joins the celebration queue at results
    { const bc = b.bond ? bondCelebration(b.bond, data) : []; if (bc.length) { const c = b.cel || { cards: [], ledger: null, any: false }; b.cel = { ...c, cards: mergeBond(c.cards, bc) }; } }
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
    // BLANK-FIX: each step is guarded. A step that throws on a stored value puts that setting back to its default (saved),
    // tries once more and leaves a one-time note for the title; it never stops the boot or a menu.
    const reset = [];
    const step = (name, keys, fn) => {
      try { fn(this.save.data.settings); return; } catch (e) {
        try { if (globalThis.__boot && globalThis.__boot.errors.length < 8) globalThis.__boot.errors.push('settings ' + name + ': ' + String((e && e.message) || e).slice(0, 160)); } catch { /* ignore */ }
      }
      if (!keys.length) return;
      try {
        const d = defaultSettings(), patch = {};
        for (const k of keys) patch[k] = d[k];
        this.save.setSettings(patch); reset.push(name);
        fn(this.save.data.settings);
      } catch { /* the default failed too: leave this part off for the session */ }
    };
    step('motion', ['reducedMotion'], (s) => document.documentElement.classList.toggle('reduced-motion', !!s.reducedMotion));
    step('text size', ['textSize'], (s) => applyTextSize(document.documentElement, s.textSize)); // A2
    step('menu size', ['uiScale'], (s) => { if (this.desktop) this.desktop.setPref(s.uiScale); }); // DESKTOP D1: Menu size
    step('keys', ['keys'], (s) => { // A3: remapped keys (validated); movement, hints and the HUD pill follow
      const km = setActiveKeymap(s.keys);
      if (this.scene && this.scene.held) this.scene.held.setDirs(dirMap(km));
      if (this.ui && this.ui.hudView && this.ui.hudView.refreshKeys) this.ui.hudView.refreshKeys();
    });
    step('sound', ['masterVol', 'musicVol', 'sfxVol', 'muted'], (s) => { if (this.audio) this.audio.configure(s); });
    step('touch', ['touchMode', 'stickSize'], (s) => {
      if (!this.touch) return;
      const coarse = typeof matchMedia === 'function' && (matchMedia('(pointer: coarse)').matches || matchMedia('(hover: none)').matches);
      this.touch.configure(touchEnabled(s.touchMode, this.params.touch, coarse, 'ontouchstart' in window), s.stickSize);
    });
    if (reset.length && this.save && !this.save.loadNote) this.save.loadNote = 'Some settings could not be used and were put back to their defaults: ' + reset.join(', ') + '.';
  },

  settingsHandlers() {
    return {
      getSettings: () => ({ ...this.save.data.settings }),
      resolvedBrightness: (stored) => resolveBrightness(stored, this.isPhone()),
      setSetting: (patch) => { this.save.setSettings(patch); this.applySettings(); if (this.audio && patch && 'sfxVol' in patch) this.audio.play('gem'); if (this.sim) this.sim.setAutoRule(this.save.data.settings.autoRule); },
      hasAutoRule: () => !!aggregateMods(this.save.data.tree, treeDef, data).perks.autoRule, // 'Chosen Moment' owned: show the auto-fire choice
      exportSave: () => { const raw = this.save.keptRaw === null; const t = this.save.exportText(); if (raw) this.save.markBackup(); return t; }, // A1: an export restarts the backup reminder
      damagedText: () => this.save.damagedText(),
      backupNudge: () => shouldNudge(this.save.data, { readOnly: this.save.readOnly || !this.save.persistent }),
      exportBackup: () => { const ok = downloadText(this.save.exportText(), SAFE.file); if (ok) this.save.markBackup(); return ok; },
      dismissNudge: () => this.save.markBackup(),
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
      needsStarter: () => this.needsStarter(),
      chooseStarter: (h, w) => this.chooseStarter(h, w),
      starterPool: () => starterPool(data),
      spiritChoices: (h) => this.spiritChoices(h),
      lastLoadout: (h) => this.lastLoadout(h),
      bondLevel: (h) => bondLevel(this.save.data, data, h),
      charsView: () => charsView(this.save.data, data, treeDef),
      wearView: (h, sel) => wearView(this.save.data, data, treeDef, h, sel), // EXTRAS v1 Wear drawer
      setWear: (h, sel) => this.setWear(h, sel),
      closeSettings: () => { if (!this.sim) this.showMenu(); },
      resetTips: () => this.resetTips(),
      introReplay: () => this.introReplay(),
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
    if (this.introOpen) return;
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
    this.startRun(this.characterId, this.runTier || 'normal', this.startWeaponId); // Again = same hero + spirit + map + night
  },
};
