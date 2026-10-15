// DOM overlay: menus, HUD, level-up cards, pause and end screens.
// Kept separate from Phaser so text stays crisp at any window size.

const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

import { TreeScreen } from './treescreen.js';
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

  // ------------------------------------------------------------------ HUD
  buildHud() {
    const hud = this.layer('hud');
    hud.innerHTML = `
      <div class="bars">
        <div class="bar hp"><i></i><span class="hptext"></span></div>
        <div class="bar xp"><i></i><span class="xptext"></span></div>
      </div>
      <div class="timer">00:00</div>
      <div class="stats"><div>Kills <b class="kills">0</b></div><div>Gold <b class="gold">0</b></div></div>
      <div class="boss"><div class="bossname"></div><div class="bar"><i></i></div></div>
      <div class="toast"></div>
      <div class="bossintro"></div>
      <div class="slots"></div>
      <div class="ability"><div class="t"><span class="abname"></span><span class="k">[Space]</span></div><div class="cd"><i></i></div></div>
      <div class="hurtflash"></div>`;
    this.hud = {
      hpFill: hud.querySelector('.bar.hp i'),
      hpText: hud.querySelector('.hptext'),
      xpFill: hud.querySelector('.bar.xp i'),
      xpText: hud.querySelector('.xptext'),
      timer: hud.querySelector('.timer'),
      kills: hud.querySelector('.kills'),
      gold: hud.querySelector('.gold'),
      boss: hud.querySelector('.boss'),
      bossName: hud.querySelector('.bossname'),
      bossFill: hud.querySelector('.boss .bar i'),
      toast: hud.querySelector('.toast'),
      bossIntro: hud.querySelector('.bossintro'),
      slots: hud.querySelector('.slots'),
      ability: hud.querySelector('.ability'),
      abName: hud.querySelector('.abname'),
      abFill: hud.querySelector('.ability .cd i'),
      flash: hud.querySelector('.hurtflash'),
    };
  }

  showHud() { this.show('hud'); this.hudCache = {}; }
  hideHud() { this.hide('hud'); }

  setText(key, el, value) {
    if (this.hudCache[key] !== value) {
      this.hudCache[key] = value;
      el.textContent = value;
    }
  }

  updateHud(sim) {
    const h = this.hud;
    const p = sim.player;
    h.hpFill.style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
    this.setText('hp', h.hpText, `${Math.ceil(p.hp)} / ${p.maxHp}`);
    h.xpFill.style.width = `${Math.min(100, (sim.xp / sim.xpNeeded) * 100)}%`;
    this.setText('xp', h.xpText, `Level ${sim.level}`);
    this.setText('time', h.timer, fmtTime(Math.max(0, sim.balance.runSeconds - sim.time)));
    this.setText('kills', h.kills, String(sim.kills));
    this.setText('gold', h.gold, String(Math.floor(sim.gold)));

    const boss = sim.boss && !sim.boss.dead ? sim.boss : null;
    if (boss) {
      h.boss.style.display = 'block';
      this.setText('bossname', h.bossName, this.data.enemies[boss.type].name);
      h.bossFill.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
    } else if (h.boss.style.display !== 'none') {
      h.boss.style.display = 'none';
    }

    const key = sim.weapons.map((w) => `${w.id}:${w.evo || ''}:${Object.values(w.ranks).join('')}`).join('|');
    if (this.hudCache.slotKey !== key) {
      this.hudCache.slotKey = key;
      const max = sim.balance.maxRank * 4;
      const slots = [];
      for (let i = 0; i < sim.balance.weaponSlots; i++) {
        const w = sim.weapons[i];
        if (!w) { slots.push('<div class="slot empty"><div class="n">empty slot</div><div class="r"><i style="width:0"></i></div></div>'); continue; }
        const def = this.data.weapons[w.id];
        const total = Object.values(w.ranks).reduce((a, b) => a + b, 0);
        const name = w.evo ? this.data.evolutions[w.evo].name : def.name;
        slots.push(`<div class="slot ${w.evo ? 'evolved' : ''}" style="--c:${def.color}"><div class="n">${name}</div><div class="r"><i style="width:${w.evo ? 100 : (total / max) * 100}%"></i></div></div>`);
      }
      h.slots.innerHTML = slots.join('');
    }

    const a = sim.ability;
    this.setText('abname', h.abName, a.name);
    const ready = a.cdLeft <= 0;
    h.abFill.style.width = `${ready ? 100 : (1 - a.cdLeft / sim.abilityCooldown) * 100}%`;
    h.ability.classList.toggle('ready', ready);
  }

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

  // ------------------------------------------------------------------ menus
  showStart(onPick) {
    const chars = Object.entries(this.data.characters).filter(([id]) => !this.handlers.heroUnlocked || this.handlers.heroUnlocked(id));
    const cards = chars.map(([id, c]) => `
      <div class="charcard" data-id="${id}" tabindex="0" role="button">
        <h3><span class="swatch" style="background:${c.color};color:${c.color}"></span>${c.name}</h3>
        <div class="blurb">${c.blurb}</div>
        <dl>
          <dt>Health</dt><dd>${c.hp}</dd>
          <dt>Speed</dt><dd>${c.speed}</dd>
          <dt>Trait</dt><dd>${c.traitText}</dd>
          <dt>Weapon</dt><dd>${this.data.weapons[c.weapon].name}</dd>
          <dt>Ability</dt><dd>${c.ability.name} (${c.ability.cooldown}s)</dd>
        </dl>
      </div>`).join('');
    const el = this.show('start', `
      <h1>Hollowlight</h1>
      <div class="sub">Spirits of the Dusk · Chapter 1: Cursed Forest · prototype</div>
      <div class="bankline"></div>
      <div class="firstrun" style="display:none"><span class="frtext"></span> <button class="btn" data-act="frtree">See the Skill Tree</button></div>
      <div class="row">${cards}</div>
      <div class="keys"><b>W</b><b>A</b><b>S</b><b>D</b> or arrows to move · weapons fire on their own · <b>Space</b> ability · <b>Esc</b> pause · <b>1</b>-<b>4</b> pick cards</div>
      <p>Survive 15 minutes. The Elder Treant wakes at 10:00.</p>
      <div class="row"><button class="btn" data-act="tree">Skill Tree</button><button class="btn" data-act="settings">Settings</button></div>
      <div class="vlabel"></div>`);
    el.querySelector('[data-act="tree"]').addEventListener('click', () => this.handlers.openTree());
    el.querySelector('.vlabel').textContent = typeof __APP_VERSION__ !== 'undefined' ? `v${__APP_VERSION__}` : '';
    const bank = this.handlers.getBank ? this.handlers.getBank() : null;
    if (bank) el.querySelector('.bankline').textContent = `Bank: ${bank.gold} gold · ${bank.shards} soul shards`;
    el.querySelector('[data-act="settings"]').addEventListener('click', () => this.handlers.openSettings());
    if (this.handlers.isFirstRun && this.handlers.isFirstRun()) {
      el.querySelector('.firstrun').style.display = '';
      el.querySelector('.frtext').textContent = FIRST_RUN_HINT;
      el.querySelector('[data-act="frtree"]').addEventListener('click', () => this.handlers.openTree());
    }
    el.querySelectorAll('.charcard').forEach((c) => {
      c.addEventListener('click', () => onPick(c.dataset.id));
      c.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onPick(c.dataset.id); } });
    });
    const firstCard = el.querySelector('.charcard');
    if (firstCard) firstCard.focus({ preventScroll: true });
  }

  hideStart() { this.hide('start'); }

  // ------------------------------------------------------------------ level-up
  showLevelUp(sim) {
    const offer = sim.offer;
    const all = offer.gold.concat(offer.cards);
    const maxRank = sim.balance.maxRank;
    const cardHtml = (c, i) => {
      const gold = c.kind === 'evolution';
      let pips = '';
      if (c.kind === 'stat' || c.kind === 'blessing') {
        pips = '<div class="pips">' + Array.from({ length: c.maxRank || maxRank }, (_, k) => `<i class="${k < c.rank ? 'on' : k === c.rank ? 'next' : ''}"></i>`).join('') + '</div>';
      }
      const ban = sim.banishesLeft > 0 && !gold ? `<button class="btn ban" data-ban="${c.key}">Banish</button>` : '';
      return `
        <div class="card k-${c.kind} ${gold ? 'gold' : ''}" data-key="${c.key}" style="--i:${i}" tabindex="0" role="button">
          ${c.badge ? `<div class="badge">${c.badge}</div>` : ''}
          <div class="key">${i + 1}</div>
          <h4>${c.title}</h4>
          <div class="desc">${c.kind === 'evolution' ? `<i>${c.from} evolves.</i><br>` : ''}${c.desc}</div>
          ${pips}${ban}
        </div>`;
    };
    const actions = [];
    if (sim.rerollsLeft > 0) actions.push(`<button class="btn" data-act="reroll">Reroll (R) · ${sim.rerollsLeft} left</button>`);
    if (sim.banishesLeft > 0) actions.push(`<span class="lu-sub" style="margin:0;align-self:center">Banishes left: ${sim.banishesLeft}</span>`);
    const el = this.show('levelup', `
      <div class="lu-title">Level ${sim.level}${sim.pending > 1 ? ` (+${sim.pending - 1} more)` : ''}</div>
      <div class="lu-sub">Choose one</div>
      <div class="cards">${all.map(cardHtml).join('')}</div>
      <div class="lu-actions">${actions.join('')}</div>`);
    const fresh = toastWeapons(all, this.data, this.toastedWeapons);
    if (fresh.length) { fresh.forEach((w) => this.toastedWeapons.add(w)); this.toast(NEW_CARD_TOAST); }
    this.currentCards = all;
    this.cardEls = Array.from(el.querySelectorAll('.card'));
    this.setSel(0);
    this.cardEls.forEach((ce, i) => ce.addEventListener('mouseenter', () => this.setSel(i)));
    el.querySelectorAll('.card').forEach((c) => c.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-ban]')) return;
      this.handlers.pick(c.dataset.key);
    }));
    el.querySelectorAll('[data-ban]').forEach((b) => b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      this.handlers.banish(b.dataset.ban);
    }));
    const rr = el.querySelector('[data-act="reroll"]');
    if (rr) rr.addEventListener('click', () => this.handlers.reroll());
  }

  // Keyboard-first selection: arrows move, Enter picks, 1-4 pick directly.
  setSel(i) {
    const els = this.cardEls || [];
    if (!els.length) return;
    this.selIdx = Math.max(0, Math.min(els.length - 1, i));
    els.forEach((e, k) => e.classList.toggle('sel', k === this.selIdx));
  }

  hideLevelUp() { this.hide('levelup'); this.currentCards = null; this.cardEls = null; }

  // ------------------------------------------------------------------ pause / end
  showPause() {
    const el = this.show('pause', `
      <h2>Paused</h2>
      <div class="row"><button class="btn big" data-act="resume">Resume (Esc)</button><button class="btn big" data-act="settings">Settings</button><button class="btn big" data-act="menu">Quit to menu</button></div>`);
    el.querySelector('[data-act="settings"]').addEventListener('click', () => this.handlers.openSettings());
    el.querySelector('[data-act="resume"]').addEventListener('click', () => this.handlers.togglePause());
    el.querySelector('[data-act="menu"]').addEventListener('click', () => this.handlers.menu());
  }

  hidePause() { this.hide('pause'); }

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
  // Built with DOM APIs and textContent only. Values come from the sanitised save.
  showSettings(message) {
    const h = this.handlers;
    const st = h.getSettings();
    const el = this.layer('settings');
    el.classList.add('settings');
    el.replaceChildren();
    this.settingsOpen = true;
    const mk = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
    const grid = mk('div', 'setgrid');
    const row = (label, ctl) => { grid.append(mk('label', '', label), ctl); };
    const slider = (key) => {
      const i = mk('input');
      i.type = 'range'; i.min = '0'; i.max = '100'; i.step = '5'; i.value = String(Math.round(st[key] * 100));
      i.addEventListener('input', () => h.setSetting({ [key]: Number(i.value) / 100 }));
      return i;
    };
    const check = (key) => {
      const i = mk('input');
      i.type = 'checkbox'; i.checked = !!st[key];
      i.addEventListener('change', () => h.setSetting({ [key]: i.checked }));
      return i;
    };
    row('Music volume', slider('musicVol'));
    row('Sound effects volume', slider('sfxVol'));
    row('Screen shake', check('screenShake'));
    row('Reduced motion', check('reducedMotion'));
    row('Damage numbers', check('damageNumbers'));
    const sel = mk('select');
    for (const [v, t] of [['auto', 'Auto'], ['low', 'Low'], ['med', 'Medium'], ['high', 'High']]) {
      const o = mk('option', '', t);
      o.value = v;
      if (st.quality === v) o.selected = true;
      sel.append(o);
    }
    sel.addEventListener('change', () => h.setSetting({ quality: sel.value }));
    row('Quality', sel);

    const msg = mk('div', 'setmsg', message || '');
    const say = (t, bad) => { msg.textContent = t; msg.classList.toggle('bad', !!bad); };
    const actions = mk('div', 'row');
    const bExp = mk('button', 'btn', 'Export save');
    const bImp = mk('button', 'btn', 'Import save');
    const bRes = mk('button', 'btn', 'Reset save');
    const bClose = mk('button', 'btn big', 'Back (Esc)');
    const file = mk('input');
    file.type = 'file'; file.accept = '.json,application/json'; file.style.display = 'none';
    const confirmBox = mk('div', 'setconfirm');
    const clearConfirm = () => { confirmBox.replaceChildren(); };
    const ask = (text, yesLabel, onYes) => {
      clearConfirm();
      const y = mk('button', 'btn', yesLabel);
      const n = mk('button', 'btn', 'Cancel');
      y.addEventListener('click', () => { clearConfirm(); onYes(); });
      n.addEventListener('click', () => { clearConfirm(); say(''); });
      confirmBox.append(mk('span', '', text), y, n);
    };
    bExp.addEventListener('click', () => {
      try {
        const url = URL.createObjectURL(new Blob([h.exportSave()], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hollowlight-save.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        say('Save exported.');
      } catch { say('Could not export the save.', true); }
    });
    bImp.addEventListener('click', () => { clearConfirm(); file.value = ''; file.click(); });
    file.addEventListener('change', async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      if (f.size > h.maxSaveBytes) { say('Save file is too large.', true); return; }
      let text;
      try { text = await f.text(); } catch { say('Could not read that file.', true); return; }
      const res = h.checkImport(text);
      if (!res.ok) { say(res.error, true); return; }
      say('');
      ask('Replace your current save with this file?', 'Replace save', () => { h.applyImport(res.save); this.showSettings('Save imported.'); });
    });
    let armed = false;
    let armTimer = null;
    bRes.addEventListener('click', () => {
      if (!armed) {
        armed = true;
        bRes.textContent = 'Really reset? Click again';
        armTimer = setTimeout(() => { armed = false; bRes.textContent = 'Reset save'; }, 4000);
        return;
      }
      clearTimeout(armTimer);
      armed = false;
      bRes.textContent = 'Reset save';
      ask('This erases all gold, shards and stats. It cannot be undone.', 'Erase everything', () => { h.resetSave(); this.showSettings('Save reset.'); });
    });
    bClose.addEventListener('click', () => this.hideSettings());
    actions.append(bExp, bImp, bRes);
    const back = mk('div', 'row');
    back.append(bClose);
    el.append(mk('h2', '', 'Settings'), grid, actions, confirmBox, msg, back, file);
    const note = h.storageNote ? h.storageNote() : null;
    if (note) el.append(mk('div', 'note', note));
    this.show('settings');
    bClose.focus();
  }

  hideSettings() {
    if (!this.settingsOpen) return;
    this.settingsOpen = false;
    this.hide('settings');
    if (this.handlers.closeSettings) this.handlers.closeSettings();
  }

  hideEnd() { this.hide('end'); }

  hideAll() {
    for (const k of Object.keys(this.layers)) this.hide(k);
  }

  // ------------------------------------------------------------------ keys
  onKey(e) {
    if (this.tree.isOpen) return; // the tree screen handles its own keys
    if (this.settingsOpen) {
      if (e.key === 'Escape') { this.escAt = performance.now(); this.hideSettings(); }
      return;
    }
    const lu = this.layers.levelup;
    if (lu && lu.style.display !== 'none' && this.currentCards) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= this.currentCards.length) {
        e.preventDefault();
        this.handlers.pick(this.currentCards[n - 1].key);
      } else if (e.key === 'r' || e.key === 'R') {
        this.handlers.reroll();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault(); this.setSel((this.selIdx || 0) - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault(); this.setSel((this.selIdx || 0) + 1);
      } else if (e.key === 'Enter' && !(e.target && e.target.closest && e.target.closest('button'))) {
        e.preventDefault();
        const c = this.currentCards[this.selIdx || 0];
        if (c) this.handlers.pick(c.key);
      }
    }
  }
}
