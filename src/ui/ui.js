// DOM overlay: menus, HUD, level-up cards, pause and end screens.
// Kept separate from Phaser so text stays crisp at any window size.

const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

import { TreeScreen } from './treescreen.js';
import { Hud } from './hud.js';
import { OfferView } from './cardsui.js';
import { orderOffer } from './cardview.js';
import '../cards.css';
import { mountInstallCard, fullscreenEntry, updateNotice } from '../pwa/card.js';
import './kit.css';
import './title.css';
import { buildTitle, buildHeroSelect } from './title.js';
import { heroView } from './titlecopy.js';
import { buildPause } from './pause.js';
import { buildSettings } from './settings.js';
import { pauseView } from './u4copy.js';
import './u4.css';
import wrenPortrait from '../assets/heroes/wren.webp';
import eliasPortrait from '../assets/heroes/elias.webp';
const PORTRAITS = { wren: wrenPortrait, elias: eliasPortrait };
import { FIRST_RUN_HINT, NEW_CARD_TOAST, toastWeapons } from '../meta/gatewords.js';

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

  show(name, html) {
    const el = this.layer(name);
    if (html !== undefined) el.innerHTML = html;
    el.style.display = name === 'hud' ? 'block' : 'flex';
    el.style.pointerEvents = name === 'hud' ? 'none' : 'auto';
    return el;
  }

  hide(name) {
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
  }

  showHud() { this.show('hud'); this.hudCache = {}; this.hudView.reset(); }
  hideHud() { this.hide('hud'); }

  updateHud(sim) { this.hudView.update(sim, this.data); }
  // Touch: a tap that lands on the weapon strip wakes it (the touch layer covers it).
  hudTapAt(x, y) { this.hudView.tapAt(x, y); }

  toast(text) {
    const t = this.hud.toast;
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
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
    f.classList.add('on');
    requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('on')));
  }

  // ------------------------------------------------------------------ menus (U3: title and hero select are two screens)
  // Title: wordmark + Begin/Continue, Skill Tree, Settings. Begin opens hero select; Start there runs onPick(heroId).
  showStart(onPick) {
    this.onPick = onPick;
    const h = this.handlers;
    const t = buildTitle({
      hasProgress: !!(h.hasProgress && h.hasProgress()),
      firstRun: !!(h.isFirstRun && h.isFirstRun()),
      bank: h.getBank ? h.getBank() : null,
      version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '',
      onBegin: () => this.showHeroSelect(),
      onTree: () => h.openTree(),
      onSettings: () => h.openSettings(),
    });
    const el = this.layer('start');
    el.className = 'overlay layer-start u3';
    el.replaceChildren(t.root);
    this.hide('hero');
    this.show('start');
    if (this.pwa) {
      mountInstallCard(document, this.pwa, t.side, t.menu);
      const link = t.side.querySelector('.pwa-link');
      if (link) t.foot.appendChild(link);
      t.side.append(updateNotice(document, this.pwa));
    }
    this.screen = { id: 'title', title: t };
    t.begin.focus({ preventScroll: true });
  }

  showHeroSelect() {
    const h = this.handlers;
    const ids = Object.keys(this.data.characters).filter((id) => !h.heroUnlocked || h.heroUnlocked(id));
    const heroes = ids.map((id) => {
      const c = this.data.characters[id];
      const w = this.data.weapons[c.weapon];
      return { ...heroView(id, c, w ? w.name : ''), weaponId: c.weapon };
    });
    const hs = buildHeroSelect({
      heroes, portraits: PORTRAITS, selected: this.lastHero,
      onStart: (id) => { this.lastHero = id; if (this.onPick) this.onPick(id); },
      onBack: () => this.showStart(this.onPick),
    });
    const el = this.layer('hero');
    el.className = 'overlay layer-hero u3';
    el.replaceChildren(hs.root);
    this.hide('start');
    this.show('hero');
    this.screen = { id: 'hero', hero: hs };
    hs.focusSelected();
  }

  hideStart() { this.hide('start'); this.hide('hero'); this.screen = null; }

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
    const fresh = toastWeapons(sim.offer ? orderOffer(sim.offer).all : [], this.data, this.toastedWeapons);
    this.offerView.render(sim, this.data, fresh.length ? NEW_CARD_TOAST : '');
    this.show('levelup');
    this.currentCards = this.offerView.cards;
    fresh.forEach((w) => this.toastedWeapons.add(w));
    if (this.layers.hud) this.layers.hud.inert = true; // Tab must not reach the HUD buttons under the offer
  }

  hideLevelUp() { this.hide('levelup'); this.currentCards = null; if (this.layers.hud) this.layers.hud.inert = false; }

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
      extras,
    });
    const el = this.layer('pause');
    el.className = 'overlay layer-pause u4 u4-pausescreen';
    el.replaceChildren(this.pauseView.root);
    this.show('pause');
    this.pauseView.focusResume();
  }

  hidePause() { this.hide('pause'); this.pauseView = null; }

  showEnd(sim, bank) {
    const r = sim.result();
    const d = this.data;
    const won = r.outcome === 'victory';
    const evos = r.weapons.filter((w) => w.evo).map((w) => d.evolutions[w.evo].name);
    const el = this.show('end', `
      <h2 style="color:${won ? 'var(--good)' : 'var(--hp)'}">${won ? 'You survived the night' : 'You were overrun'}</h2>
      <div class="newbest"></div>
      <dl class="endstats">
        <dt>Time survived</dt><dd>${fmtTime(r.time)}</dd>
        <dt>Level reached</dt><dd>${r.level}</dd>
        <dt>Enemies slain</dt><dd>${r.kills}</dd>
        <dt>Gold earned</dt><dd class="g"></dd>
        <dt>Soul shards</dt><dd class="sh"></dd>
        <dt>Best time</dt><dd class="bt"></dd>
        <dt>Evolutions</dt><dd>${evos.length ? evos.join(', ') : 'none this run'}</dd>
      </dl>
      <div class="note warn"></div>
      <div class="endtree"></div>
      <div class="row"><button class="btn big" data-act="again">Play again</button><button class="btn big" data-act="tree">Spend gold</button><button class="btn big" data-act="menu">Main menu</button></div>`);
    el.querySelector('[data-act="tree"]').addEventListener('click', () => this.handlers.openTree());
    this.fillEndTree(el.querySelector('.endtree'), bank);
    const set = (sel, t) => { el.querySelector(sel).textContent = t; };
    if (bank) {
      set('.g', `+${r.gold} (bank ${bank.gold})`);
      set('.sh', `+${r.shards} (bank ${bank.shards})${r.bossKilled ? ' · Elder Treant slain' : ''}`);
      set('.bt', fmtTime(bank.bestTime));
      if (bank.newBest) set('.newbest', 'New best!');
      if (bank.note) set('.warn', bank.note);
    } else {
      set('.g', String(r.gold));
      set('.sh', String(r.shards));
      set('.bt', '-');
      set('.warn', 'Debug run: not saved.');
    }
    el.querySelector('[data-act="again"]').addEventListener('click', () => this.handlers.again());
    el.querySelector('[data-act="menu"]').addEventListener('click', () => this.handlers.menu());
  }

  // Accomplishment feedback: newly unlocked nodes and the closest locked ones (textContent only).
  fillEndTree(box, bank) {
    if (!bank) return;
    const mkEl = (cls, text) => { const n = document.createElement('div'); n.className = cls; n.textContent = text; return n; };
    if (bank.newly && bank.newly.length) {
      box.append(mkEl('et-head good', 'New in the Skill Tree'));
      for (const line of bank.newly.slice(0, 6)) box.append(mkEl('et-row', line));
    }
    if (bank.closest && bank.closest.length) {
      box.append(mkEl('et-head', 'Closest unlocks'));
      for (const c of bank.closest) box.append(mkEl('et-row', `${c.gate ? 'Gate: ' : ''}${c.name} · ${c.text} (${Math.floor(c.frac * 100)}%)`));
    }
  }

  // ------------------------------------------------------------------ settings
  // U4: tabs (Sound, Picture, Controls, Saves) of wick toggles, thread sliders and segmented choices (src/ui/settings.js). Values come from the sanitised save.
  showSettings(message, tab) {
    const h = this.handlers;
    const el = this.layer('settings');
    el.className = 'overlay layer-settings settings u4 u4-settingsscreen';
    if (!this.settingsOpen) this.settingsFrom = this.pauseView && this.layers.pause && this.layers.pause.style.display !== 'none' ? 'pause' : 'title';
    this.settingsOpen = true;
    for (const n of ['start', 'hero', 'pause']) if (this.layers[n]) this.layers[n].setAttribute('inert', ''); // keep Tab inside settings
    const s = buildSettings({
      settings: h.getSettings(), message: message || '', tab: tab || 'sound', pwa: this.pwa || null,
      storageNote: h.storageNote ? h.storageNote() : null,
      api: { setSetting: h.setSetting, exportSave: h.exportSave, maxSaveBytes: h.maxSaveBytes, checkImport: h.checkImport, applyImport: h.applyImport, resetSave: h.resetSave },
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
    for (const n of ['start', 'hero', 'pause']) if (this.layers[n]) this.layers[n].removeAttribute('inert');
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
    if (!a || !a.closest || !a.closest('.overlay.u4, .layer-levelup') || !a.matches('button, [role="radio"], [role="switch"], [role="tab"], .layer-levelup .card[role="button"]')) return false;
    e.preventDefault();
    const swallow = (k) => { if (k.key === ' ') { k.preventDefault(); window.removeEventListener('keyup', swallow, true); } };
    window.addEventListener('keyup', swallow, true);
    a.click();
    return true;
  }

  onKey(e) {
    if (this.tree.isOpen) return; // the tree screen handles its own keys
    if (this.spaceActivate(e)) return;
    if (this.settingsOpen) {
      if (e.key === 'Escape') { this.escAt = performance.now(); this.hideSettings(); }
      return;
    }
    const pv = this.pauseView;
    if (pv && e.key === 'Escape' && this.layers.pause && this.layers.pause.style.display !== 'none' && pv.cancelConfirm()) { this.escAt = performance.now(); return; } // Esc backs out of "Leave this run?"
    const sc = this.screen;
    if (sc) {
      const vis = (n) => this.layers[n] && this.layers[n].style.display !== 'none';
      if (sc.id === 'hero' && vis('hero')) { sc.hero.onKey(e); return; }
      if (sc.id === 'title' && vis('start') && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const a = document.activeElement;
        const onBtn = a && a.closest && a.closest('.lg-btn');
        const t = sc.title;
        if (e.key === 'Enter' && !onBtn) { e.preventDefault(); t.begin.click(); } else if (e.key === 't' || e.key === 'T') { e.preventDefault(); t.tree.click(); } else if (e.key === 's' || e.key === 'S') { e.preventDefault(); t.settings.click(); }
        return;
      }
    }
    const lu = this.layers.levelup;
    if (lu && lu.style.display !== 'none' && this.currentCards && this.offerView) this.offerView.onKey(e);
  }
}
