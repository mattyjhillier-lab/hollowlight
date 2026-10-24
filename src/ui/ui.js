// DOM overlay: menus, HUD, level-up cards, pause and end screens.
// Kept separate from Phaser so text stays crisp at any window size.

const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

import { TreeScreen } from './treescreen.js';
import './treescreen.css';
import { Hud } from './hud.js';
import { OfferView } from './cardsui.js';
import { orderOffer } from './cardview.js';
import '../cards.css';
import { mountInstallCard, fullscreenEntry, updateNotice } from '../pwa/card.js';
import './kit.css';
import { EvoPlate, plateModel } from './evoplate.js';
import './evoplate.css';
import './title.css';
import { buildTitle, buildHeroSelect, buildSpiritSelect } from './title.js';
import { buildLanternScreen } from './lanternsui.js';
import './lanterns.css';
import { buildNightSelect } from './nightsui.js';
import './nights.css';
import { heroView, LOADOUT, SPIRIT_LINES } from './titlecopy.js';
import { buildPause } from './pause.js';
import { buildSettings } from './settings.js';
import { pauseView } from './u4copy.js';
import { buildResults } from './results.js';
import { resultsView } from './resultscopy.js';
import './results.css';
import './u4.css';
import wrenPortrait from '../assets/heroes/wren.webp';
import eliasPortrait from '../assets/heroes/elias.webp';
const PORTRAITS = { wren: wrenPortrait, elias: eliasPortrait };
const SPIRIT_LINE = (id, data) => (SPIRIT_LINES[id] || (data.weapons[id] && typeof data.weapons[id].desc === 'string' ? data.weapons[id].desc.split('.')[0] : ''));
const HERO_NEXT = 'Next';
import { FIRST_RUN_HINT, NEW_CARD_TOAST, toastWeapons } from '../meta/gatewords.js';
import { WhisperPlate } from './whisperplate.js';
import './whispers.css';
import { cardModel } from './cardview.js';
import { buildAlmanac } from './codexui.js';
import './codex.css';
import { buildCelebration } from './celebrateui.js';
import './celebrate.css';

export class UI {
  constructor(root, data) {
    this.root = root;
    this.data = data;
    this.layers = {};
    this.hudCache = {};
    this.handlers = {};
    this.toastTimer = null;
    this.toastedWeapons = new Set(); // per page session: first NEW gated-weapon card only
    this.tree = new TreeScreen(this);
    this.buildHud();
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  setHandlers(h) { this.handlers = h; }

  /** AU6: a UI / tree sound (no-op until the audio engine is set by main.js). */
  sound(id) { if (this.audio) this.audio.play(id); }

  layer(name) {
    if (!this.layers[name]) {
      const el = document.createElement('div');
      el.className = name === 'hud' ? 'hud' : `overlay layer-${name}`;
      el.style.display = 'none';
      this.root.appendChild(el);
      this.layers[name] = el;
    }
    return this.layers[name];
  }

  show(name) {
    const el = this.layer(name);
    el.style.display = name === 'hud' ? 'block' : 'flex';
    el.style.pointerEvents = name === 'hud' ? 'none' : 'auto';
    return el;
  }

  hide(name) {
    if (name === 'end' && this.endView) { this.endView.destroy(); this.endView = null; }
    if (this.layers[name]) this.layers[name].style.display = 'none';
  }

  // ------------------------------------------------------------------ HUD (HUD-1: src/ui/hud.js, display only)
  buildHud() {
    const hud = this.layer('hud');
    this.hudView = new Hud(document, hud, {
      onPause: () => { if (this.handlers.togglePause) this.handlers.togglePause(); },
      bossName: (type) => this.data.enemies[type].name,
    });
    this.hud = { toast: this.hudView.toast, bossIntro: this.hudView.bossIntro, flash: this.hudView.flash };
    this.evoPlate = null; // E9: one pooled evolution name plate, built on the first evolution (keeps the HUD DOM identical until then)
  }

  showHud() { this.show('hud'); this.hudCache = {}; this.hudView.reset(); }
  hideHud() { this.hide('hud'); }

  updateHud(sim) { this.hudView.update(sim, this.data); }
  // Touch: a tap that lands on the weapon strip wakes it (the touch layer covers it).
  hudTapAt(x, y) { this.hudView.tapAt(x, y); }

  // whisper: FM1 pickup line (once per lantern), drawn under the toast text in the whisper voice (textContent only)
  toast(text, whisper = '') {
    const t = this.hud.toast;
    t.textContent = text;
    t.classList.toggle('has-w', !!whisper);
    if (whisper) { const w = document.createElement('span'); w.className = 'fm-tw'; w.textContent = whisper; t.appendChild(w); }
    t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), whisper ? 4000 : 2600);
  }

  // FM1: is something already speaking at the top of the screen (toast, boss banner, evolution plate)? The next whisper waits.
  busy() {
    const on = (n, c) => !!(n && n.classList && n.classList.contains(c));
    return on(this.hud.toast, 'show') || on(this.hud.bossIntro, 'on') || !!(this.evoPlate && this.evoPlate.root && on(this.evoPlate.root, 'on'));
  }

  // FM1: draw (or hide) the whisper plate. rings: the ability button(s) that get one gold ring while the ability plate is up.
  whisper(plate, frac, calm, rings) {
    if (!this.wPlate) {
      if (!plate) return;
      this.wPlate = new WhisperPlate(document, { onHide: () => { if (this.handlers.hideWhisper) this.handlers.hideWhisper(); } });
    }
    this.wPlate.show(plate, frac, calm, rings);
  }
  whisperOn() { return !!(this.wPlate && this.wPlate.cur); }

  // E9: name + codex line (+ the recipe on the first ever take). Replaces the old 'Evolved: X' toast.
  evolvePlate(evoId, first, calm) {
    const m = plateModel(evoId, this.data, first);
    if (!m) return;
    if (!this.evoPlate) this.evoPlate = new EvoPlate(this.layer('hud'));
    this.evoPlate.show(m, calm);
  }

  bossIntro(name, animate) {
    const el = this.hud.bossIntro;
    el.textContent = String(name).toUpperCase();
    el.classList.remove('on');
    if (animate) { void el.offsetWidth; el.classList.add('on'); }
    else { el.style.opacity = '1'; clearTimeout(this.introTimer); this.introTimer = setTimeout(() => { el.style.opacity = ''; }, 2000); }
  }

  hurt() {
    const f = this.hud.flash;
    if (this.hudView && this.hudView.hurtDip) this.hudView.hurtDip();
    f.classList.add('on');
    requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('on')));
  }

  // ------------------------------------------------------------------ menus (U3: title and hero select are two screens)
  // Title: wordmark + Begin/Continue, Skill Tree, Settings. Begin opens hero select; Start there runs onPick(heroId).
  showStart(onPick) {
    this.onPick = onPick;
    const h = this.handlers;
    const fd = h.frontDoor ? h.frontDoor(this.lastHero) : null; // FD2: lantern chip, purses, Continue whisper, tree dot, New game
    const t = buildTitle({
      hasProgress: !!(h.hasProgress && h.hasProgress()),
      firstRun: !!(h.isFirstRun && h.isFirstRun()),
      bank: h.getBank ? h.getBank() : null,
      note: h.loadNote ? h.loadNote() : '',
      version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '',
      lantern: fd ? fd.lantern : null,
      purses: fd ? fd.purses : null,
      whisper: fd ? fd.whisper : '',
      treeDot: !!(fd && fd.treeDot),
      treeLine: fd ? fd.treeLine : null,
      newGame: fd ? fd.newGame : null,
      almanac: fd ? fd.almanac : null,
      bands: fd ? fd.bands : 0,
      onAlmanac: () => this.showAlmanac('title'),
      onBegin: () => this.beginLoadout(),
      onTree: () => h.openTree(),
      onSettings: () => h.openSettings(),
      onSwitch: () => this.showLanterns('pick'),
      onNew: () => this.showLanterns(fd && fd.newGame && fd.newGame.free > 0 ? 'new' : 'replace'),
    });
    const el = this.layer('start');
    el.className = 'overlay layer-start u3';
    el.replaceChildren(t.root);
    this.hide('hero');
    this.hide('lanterns');
    this.hide('nights');
    this.show('start');
    if (this.pwa) {
      mountInstallCard(document, this.pwa, t.side, t.menu);
      const link = t.side.querySelector('.pwa-link');
      if (link) t.foot.appendChild(link);
      t.side.append(updateNotice(document, this.pwa));
    }
    this.screen = { id: 'title', title: t };
    t.begin.focus({ preventScroll: true });
    if (h.titleCelebrations) { const q = h.titleCelebrations(); if (q && q.length) this.celebrate(q, { away: true, after: () => { if (this.screen && this.screen.id === 'title') this.screen.title.begin.focus({ preventScroll: true }); } }); } // CX5: big moments held back by a defeat
  }

  // FD3: "Whose lantern?" (mode pick | new | replace). The app supplies the cards and does every store change; this only draws and forwards.
  showLanterns(mode = 'pick', status = null) {
    const h = this.handlers;
    if (!h.lanternScreen) return;
    const m = h.lanternScreen();
    const back = () => this.showStart(this.onPick);
    const after = (r, msg) => { if (r && r.ok) this.showLanterns('pick', msg); return r; };
    const v = buildLanternScreen({
      mode, cards: m.cards, canCreate: m.canCreate, locked: m.locked, note: m.note, status, portraits: PORTRAITS,
      onLight: (id) => { const r = h.lightLantern(id); if (r && r.ok) back(); },
      onCreate: (name) => { const r = h.createLantern(name); if (r && r.ok) this.beginLoadout(); return r; },
      onRename: (id, name) => after(h.renameLantern(id, name)),
      onExport: (id) => { const r = h.exportLantern(id); this.showLanterns(mode === 'replace' ? 'replace' : 'pick', { text: r.message }); },
      onDelete: (id) => { const r = h.deleteLantern(id); return after(r, r && r.ok ? { text: r.message, undo: !!r.undo } : null); },
      onReplace: (id, name) => { const r = h.replaceLantern(id, name); if (r && r.ok) this.beginLoadout(); return r; },
      onUndo: () => { const r = h.undoDelete(); this.showLanterns('pick', { text: r.message }); },
      onBack: back,
    });
    const el = this.layer('lanterns');
    el.className = 'overlay layer-lanterns u3 fd';
    el.replaceChildren(v.root);
    this.hide('start');
    this.hide('hero');
    this.show('lanterns');
    this.screen = { id: 'lanterns', lanterns: v };
    v.focusFirst();
  }

  // CHARACTER SYSTEM v2 loadout (LOCKED 2026-10-24): THREE separate steps, map -> character -> starting spirit (the map step only once there is a
  // night choice, FD4 skip rule). A NEW profile first picks its starter set (one hero + one spirit from the data-driven offer), then walks straight in.
  beginLoadout() {
    const h = this.handlers;
    this.pickTier = null;
    if (h.needsStarter && h.needsStarter()) { this.showStarterHero(); return; }
    if (h.nightChoice && h.nightChoice()) this.showNights(this.lastHero); else this.showHeroSelect();
  }

  heroCards(ids) {
    const h = this.handlers;
    return ids.map((id) => {
      const c = this.data.characters[id];
      const w = this.data.weapons[c.kindred]; // the kindred spirit is only the suggested default (no stat link)
      const lvl = h.bondLevel ? h.bondLevel(id) : 0;
      return { ...heroView(id, c, w ? w.name : ''), weaponId: c.kindred, pips: null, badge: lvl > 0 ? LOADOUT.bond(lvl) : null };
    });
  }

  mountLoadout(view, name) {
    const el = this.layer('hero');
    this.hide('lanterns'); this.hide('nights'); this.hide('start');
    el.className = `overlay layer-hero u3${name ? ` ${name}` : ''}`;
    el.replaceChildren(view.root);
    this.show('hero');
    this.screen = { id: 'hero', hero: view };
    view.focusSelected();
  }

  // Step 2: the character (awake heroes only; Bond badge; same body so no Health / Speed pips).
  showHeroSelect() {
    const h = this.handlers;
    const ids = Object.keys(this.data.characters).filter((id) => !h.heroUnlocked || h.heroUnlocked(id));
    const choice = !!(h.nightChoice && h.nightChoice());
    const hs = buildHeroSelect({
      heroes: this.heroCards(ids), portraits: PORTRAITS, selected: this.lastHero || (h.lastLoadout && h.lastLoadout().hero), nextLabel: HERO_NEXT,
      copy: { title: LOADOUT.heroTitle, whisper: LOADOUT.heroWhisper },
      onStart: (id) => { this.lastHero = id; this.showSpiritSelect(id); },
      onBack: () => { if (choice) this.showNights(this.lastHero, this.pickTier); else this.showStart(this.onPick); },
    });
    this.mountLoadout(hs, 'ld-hero');
  }

  // Step 3: the starting spirit (any weapon awake in the Lantern Web; sleeping ones shown dim). Starts the run.
  showSpiritSelect(heroId) {
    const h = this.handlers;
    const c = this.data.characters[heroId];
    const spirits = h.spiritChoices ? h.spiritChoices(heroId) : [];
    const vs = buildSpiritSelect({
      spirits, heroName: heroView(heroId, c, '').name, selected: h.lastLoadout ? h.lastLoadout(heroId).weapon : c.kindred,
      onStart: (wid) => { if (this.onPick) this.onPick(heroId, this.pickTier || undefined, wid); },
      onBack: () => this.showHeroSelect(),
    });
    this.mountLoadout(vs, 'ld-spirit');
  }

  // New profile: the starter set (LOCKED: one hero + one weapon; everything else starts locked). The offer comes from balance.starter.
  showStarterHero() {
    const h = this.handlers;
    const pool = h.starterPool ? h.starterPool() : { heroes: Object.keys(this.data.characters), weapons: [] };
    const hs = buildHeroSelect({
      heroes: this.heroCards(pool.heroes), portraits: PORTRAITS, selected: this.starterHero, nextLabel: HERO_NEXT,
      copy: { kicker: LOADOUT.starterKicker, title: LOADOUT.starterHeroTitle, whisper: LOADOUT.starterHeroWhisper },
      onStart: (id) => { this.starterHero = id; this.showStarterSpirit(id); },
      onBack: () => this.showStart(this.onPick),
    });
    this.mountLoadout(hs, 'ld-hero ld-starter');
  }

  showStarterSpirit(heroId) {
    const h = this.handlers;
    const pool = h.starterPool ? h.starterPool() : { weapons: [] };
    const c = this.data.characters[heroId];
    const spirits = pool.weapons.map((id) => ({ id, name: this.data.weapons[id].name, line: SPIRIT_LINE(id, this.data), open: true, kindred: id === c.kindred }));
    const vs = buildSpiritSelect({
      spirits, heroName: heroView(heroId, c, '').name, selected: c.kindred,
      copy: { kicker: LOADOUT.starterKicker, title: LOADOUT.starterSpiritTitle, whisper: LOADOUT.starterSpiritWhisper, walk: LOADOUT.starterBegin },
      onStart: (wid) => { if (h.chooseStarter && h.chooseStarter(heroId, wid) && this.onPick) this.onPick(heroId, undefined, wid); },
      onBack: () => this.showStarterHero(),
    });
    this.mountLoadout(vs, 'ld-spirit ld-starter');
  }

  // Step 1 (FD4 = DT7): "Choose your night" (only once there is a night choice). Next goes on to the character step.
  showNights(heroId, tier = null) {
    const h = this.handlers;
    if (!h.nightView) { this.showHeroSelect(); return; }
    const v = buildNightSelect({
      view: h.nightView(heroId, tier),
      viewFor: (tid) => h.nightView(heroId, tid),
      purses: h.frontDoor ? (h.frontDoor(heroId) || {}).purses : null,
      onPick: (tid) => { if (h.pickNight) h.pickNight(tid); },
      onBegin: (tid) => { this.pickTier = tid; this.showHeroSelect(); },
      onBack: () => this.showStart(this.onPick),
      onTree: (gateId) => { if (h.openTree) h.openTree(gateId, () => this.showNights(heroId, this.screen && this.screen.nights ? this.screen.nights.current() : tier)); },
    });
    const el = this.layer('nights');
    el.className = 'overlay layer-nights u3 fd fdm';
    el.replaceChildren(v.root);
    this.hide('start'); this.hide('hero'); this.hide('lanterns');
    this.show('nights');
    this.screen = { id: 'nights', nights: v };
    v.focusSelected();
  }

  hideStart() { this.hide('start'); this.hide('hero'); this.hide('lanterns'); this.hide('nights'); this.screen = null; }

  // ------------------------------------------------------------------ level-up (HUD-2: src/ui/cardsui.js, presentation only)
  showLevelUp(sim) {
    const el = this.layer('levelup');
    if (!this.offerView) {
      this.offerView = new OfferView(document, el, {
        pick: (k) => this.handlers.pick(k),
        reroll: () => this.handlers.reroll(),
        banish: (k) => this.handlers.banish(k),
      });
    }
    // The 'Unlocked in the Skill Tree' hint is a whisper line inside this screen (a HUD toast sat hidden under the veil and collided with the title on phones).
    const all = sim.offer ? orderOffer(sim.offer).all : [];
    const fresh = toastWeapons(all, this.data, this.toastedWeapons);
    // FM2: one teaching line per level-up screen (kept across reroll / banish re-renders until the screen closes)
    if (this.luTeach === undefined) {
      let teach = null;
      if (this.handlers.offerTeach && sim.offer) {
        const mr = sim.balance.maxRank;
        const classes = all.map((c) => { try { return cardModel(c, this.data, mr).cls; } catch { return ''; } });
        teach = this.handlers.offerTeach({
          start: !!sim.offer.start, classes, weaponCard: all.some((c) => c && c.kind === 'weapon'),
          full: Array.isArray(sim.weapons) && sim.weapons.length >= (sim.weaponSlots | 0), rerolls: sim.rerollsLeft | 0, banishes: sim.banishesLeft | 0,
        });
      }
      this.luTeach = teach;
    }
    this.offerView.render(sim, this.data, fresh.length ? NEW_CARD_TOAST : '', this.luTeach);
    this.show('levelup');
    this.currentCards = this.offerView.cards;
    fresh.forEach((w) => this.toastedWeapons.add(w));
    if (this.layers.hud) this.layers.hud.inert = true; // Tab must not reach the HUD buttons under the offer
  }

  hideLevelUp() { this.hide('levelup'); this.currentCards = null; this.luTeach = undefined; if (this.layers.hud) this.layers.hud.inert = false; }

  // ------------------------------------------------------------------ pause / end
  // U4: lantern-glass pause panel over the frozen game (src/ui/pause.js; DOM built with the kit, textContent only).
  showPause(sim) {
    const h = this.handlers;
    const extras = [];
    if (this.pwa) {
      const fe = fullscreenEntry(document, this.pwa, 'btn');
      if (fe) extras.push(fe);
      extras.push(updateNotice(document, this.pwa));
    }
    this.pauseView = buildPause({
      view: sim ? pauseView(sim, this.data) : undefined,
      onResume: () => h.togglePause(),
      onSettings: () => h.openSettings(),
      onQuit: () => h.menu(),
      onAlmanac: h.almanacView ? () => this.showAlmanac('pause') : null,
      extras,
    });
    const el = this.layer('pause');
    el.className = 'overlay layer-pause u4 u4-pausescreen';
    el.replaceChildren(this.pauseView.root);
    this.show('pause');
    this.pauseView.focusResume();
  }

  hidePause() { this.hide('pause'); this.pauseView = null; }

  // U6: results in Lantern Glass, Lit (src/ui/results.js). One screen, no scrolling; Again R/Enter, Main menu Esc, Tree T. Keys are handled in onKey below.
  showEnd(sim, bank) {
    const h = this.handlers;
    this.endView?.destroy();
    const view = resultsView(sim.result(), bank, this.data);
    this.sound(sim.state === 'victory' ? 'results_win' : 'results_lose');
    const reduced = document.documentElement.classList.contains('reduced-motion') || !!(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const cel = bank && bank.cel ? bank.cel : null; // CX4: what this run wrote in the Almanac
    this.endView = buildResults({ view, reduced, ledger: cel ? cel.ledger : null, onAlmanac: cel && cel.any && h.almanacView ? () => this.showAlmanac('results') : null, onAgain: () => h.again(), onMenu: () => h.menu(), onTree: () => h.openTree() });
    const el = this.layer('end');
    el.className = `overlay layer-end u6 ${view.won ? 'u6-won' : 'u6-lost'}`;
    el.replaceChildren(this.endView.root);
    this.show('end');
    this.endView.mounted();
    if (cel && cel.cards && cel.cards.length) { const ev = this.endView; this.celebrate(cel.cards, { after: () => { if (this.endView === ev) { ev.setShownAt(performance.now()); const f = ev.again; if (f && f.focus) f.focus({ preventScroll: true }); } } }); }
  }

  // ------------------------------------------------------------------ settings
  // U4: tabs (Sound, Picture, Controls, Saves) of wick toggles, thread sliders and segmented choices (src/ui/settings.js). Values come from the sanitised save.
  showSettings(message, tab) {
    const h = this.handlers;
    const el = this.layer('settings');
    el.className = 'overlay layer-settings settings u4 u4-settingsscreen';
    if (!this.settingsOpen) this.settingsFrom = this.pauseView && this.layers.pause && this.layers.pause.style.display !== 'none' ? 'pause' : 'title';
    this.settingsOpen = true;
    for (const n of ['start', 'hero', 'pause', 'lanterns', 'nights']) if (this.layers[n]) this.layers[n].setAttribute('inert', ''); // keep Tab inside settings
    const s = buildSettings({
      settings: h.getSettings(), message: message || '', tab: tab || 'sound', pwa: this.pwa || null,
      storageNote: h.storageNote ? h.storageNote() : null,
      api: { setSetting: h.setSetting, exportSave: h.exportSave, maxSaveBytes: h.maxSaveBytes, checkImport: h.checkImport, applyImport: h.applyImport, resetSave: h.resetSave, hasAutoRule: h.hasAutoRule, resetTips: h.resetTips },
      onBack: () => this.hideSettings(),
      onRebuild: (m, t) => this.showSettings(m, t),
    });
    el.replaceChildren(s.root);
    this.show('settings');
    this.settingsView = s;
    if (message) s.buttons.reset.focus(); else s.focusFirst();
  }

  hideSettings() {
    if (!this.settingsOpen) return;
    this.settingsOpen = false;
    this.settingsView = null;
    this.hide('settings');
    for (const n of ['start', 'hero', 'pause', 'lanterns', 'nights']) if (this.layers[n]) this.layers[n].removeAttribute('inert');
    if (this.handlers.closeSettings) this.handlers.closeSettings(); // title: rebuilds the menu (Continue state may have changed)
    if (this.settingsFrom === 'pause' && this.pauseView) this.pauseView.focusSettings();
    else if (this.screen && this.screen.id === 'title') this.screen.title.settings.focus({ preventScroll: true });
  }

  hideEnd() { this.hide('end'); }

  hideAll() {
    for (const k of Object.keys(this.layers)) this.hide(k);
  }

  // ------------------------------------------------------------------ keys
  // The game captures Space (and arrows) with preventDefault, which stops a focused button, switch or radio from activating on Space. In the pause and
  // settings screens Space must work like on any web control, so activate it here and swallow the matching keyup so it cannot fire a second click.
  spaceActivate(e) {
    if (e.key !== ' ' || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return false;
    const a = document.activeElement;
    if (!a || !a.closest || !a.closest('.overlay.u4, .layer-levelup, .layer-end, .layer-lanterns, .layer-nights, .layer-codex') || !a.matches('button, [role="radio"], [role="switch"], [role="tab"], .layer-levelup .card[role="button"]')) return false;
    e.preventDefault();
    // only THIS press's keyup: if it never arrives (focus lost), the swallow must not linger and eat a later gameplay keyup (CTL1)
    const t0 = performance.now();
    const off = () => { window.removeEventListener('keyup', swallow, true); window.removeEventListener('blur', off); };
    const swallow = (k) => { if (k.key !== ' ') return; off(); if (performance.now() - t0 < 2000) k.preventDefault(); };
    window.addEventListener('keyup', swallow, true);
    window.addEventListener('blur', off);
    a.click();
    return true;
  }

  // ------------------------------------------------------------------ CX2/CX3 the Almanac (title J, pause read-only, results link, tree heart link)
  // Opens over the current screen; Esc / Back returns to it (front-door rule). The app supplies the view model and stores read marks / titles.
  showAlmanac(from = 'title', tab = null) {
    const h = this.handlers;
    if (!h.almanacView || this.codexView) return;
    const v = h.almanacView();
    if (!v) return;
    const prev = document.activeElement;
    const calm = !!(v.calm || document.documentElement.classList.contains('reduced-motion'));
    this.codexView = buildAlmanac({ book: v.book, from, tab, heroPortraits: PORTRAITS, calm, titles: v.titles,
      onRead: (keys) => { if (h.almanacRead) h.almanacRead(keys); },
      onPickTitle: (id) => { if (h.pickTitle) h.pickTitle(id); },
      onBack: () => this.hideAlmanac() });
    this.codexFrom = { from, prev };
    const el = this.layer('codex');
    el.className = 'overlay layer-codex';
    el.replaceChildren(this.codexView.root);
    for (const n of Object.keys(this.layers)) if (n !== 'codex' && n !== 'cel' && this.layers[n]) this.layers[n].setAttribute('inert', '');
    this.show('codex');
    this.sound('ui_step');
    this.codexView.focusFirst();
  }

  hideAlmanac() {
    if (!this.codexView) return;
    this.codexView = null;
    this.escAt = performance.now();
    this.hide('codex');
    if (this.layers.codex) this.layers.codex.replaceChildren();
    for (const n of Object.keys(this.layers)) if (this.layers[n] && !(n === 'start' && this.settingsOpen)) this.layers[n].removeAttribute('inert');
    const f = this.codexFrom;
    this.codexFrom = null;
    if (f && f.from === 'title' && this.handlers.closeAlmanac) this.handlers.closeAlmanac(); // title: the NEW dot / bands may have changed
    else if (f && f.prev && f.prev.isConnected && f.prev.focus) f.prev.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------------ CX4/CX5 celebrations: big -> medium cards, any key / tap continues, Esc skips all
  celebrate(items, { away = false, after = null } = {}) {
    if (!items || !items.length) return;
    if (this.celView && !this.celView.isDone()) this.celView.finish();
    const calm = document.documentElement.classList.contains('reduced-motion');
    const el = this.layer('cel');
    el.className = 'overlay layer-cel';
    const v = buildCelebration(items, { calm, away, sound: (id) => this.sound(id), onDone: () => { if (this.celView === v) { this.celView = null; this.hide('cel'); el.replaceChildren(); } if (after) after(); } });
    this.celView = v;
    el.replaceChildren(v.root);
    this.show('cel');
    v.start();
  }
  celActive() { return !!(this.celView && !this.celView.isDone()); }

  onKey(e) {
    if (this.celActive()) { this.celView.onKey(e); return; }
    if (this.codexView) { if (!this.spaceActivate(e)) this.codexView.onKey(e); return; }
    if (this.tree.isOpen) return; // the tree screen handles its own keys
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && !this.settingsOpen && this.whisperOn()) { e.preventDefault(); if (this.handlers.hideWhisper) this.handlers.hideWhisper(); return; } // FM1: Tab hides the whisper (only while one is up mid-run)
    if (this.spaceActivate(e)) return;
    if (this.settingsOpen) {
      if (e.key === 'Escape') { this.escAt = performance.now(); this.hideSettings(); }
      return;
    }
    if (this.endView && this.layers.end && this.layers.end.style.display !== 'none') { this.endView.onKey(e); return; }
    const pv = this.pauseView;
    if (pv && e.key === 'Escape' && this.layers.pause && this.layers.pause.style.display !== 'none' && pv.cancelConfirm()) { this.escAt = performance.now(); return; } // Esc backs out of "Leave this run?"
    if (pv && (e.key === 'j' || e.key === 'J') && pv.almanac && !pv.isConfirming() && this.layers.pause && this.layers.pause.style.display !== 'none' && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); pv.almanac.click(); return; } // CX3
    const sc = this.screen;
    if (sc) {
      const vis = (n) => this.layers[n] && this.layers[n].style.display !== 'none';
      if (sc.id === 'hero' && vis('hero')) { sc.hero.onKey(e); return; }
      if (sc.id === 'lanterns' && vis('lanterns')) { sc.lanterns.onKey(e); return; }
      if (sc.id === 'nights' && vis('nights')) { sc.nights.onKey(e); return; }
      if (sc.id === 'title' && vis('start') && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const a = document.activeElement;
        const onBtn = a && a.closest && a.closest('.lg-btn');
        const t = sc.title;
        if (e.key === 'Enter' && !onBtn) { e.preventDefault(); t.begin.click(); } else if ((e.key === 'j' || e.key === 'J') && t.almanac) { e.preventDefault(); t.almanac.click(); } else if (e.key === 't' || e.key === 'T') { e.preventDefault(); t.tree.click(); } else if (e.key === 's' || e.key === 'S') { e.preventDefault(); t.settings.click(); } else if ((e.key === 'n' || e.key === 'N') && t.newGame) { e.preventDefault(); t.newGame.click(); }
        return;
      }
    }
    const lu = this.layers.levelup;
    if (lu && lu.style.display !== 'none' && this.currentCards && this.offerView) this.offerView.onKey(e);
  }
}
