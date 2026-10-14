// DOM overlay: menus, HUD, level-up cards, pause and end screens.
// Kept separate from Phaser so text stays crisp at any window size.

const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export class UI {
  constructor(root, data) {
    this.root = root;
    this.data = data;
    this.layers = {};
    this.hudCache = {};
    this.handlers = {};
    this.toastTimer = null;
    this.buildHud();
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  setHandlers(h) { this.handlers = h; }

  layer(name) {
    if (!this.layers[name]) {
      const el = document.createElement('div');
      el.className = name === 'hud' ? 'hud' : 'overlay';
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
        slots.push(`<div class="slot ${w.evo ? 'evolved' : ''}" style="border-left-color:${def.color}"><div class="n">${name}</div><div class="r"><i style="width:${w.evo ? 100 : (total / max) * 100}%"></i></div></div>`);
      }
      h.slots.innerHTML = slots.join('');
    }

    const a = sim.ability;
    this.setText('abname', h.abName, a.name);
    const ready = a.cdLeft <= 0;
    h.abFill.style.width = `${ready ? 100 : (1 - a.cdLeft / (a.cooldown * sim.mods.abilityCd)) * 100}%`;
    h.ability.classList.toggle('ready', ready);
  }

  toast(text) {
    const t = this.hud.toast;
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  hurt() {
    const f = this.hud.flash;
    f.classList.add('on');
    requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('on')));
  }

  // ------------------------------------------------------------------ menus
  showStart(onPick) {
    const chars = Object.entries(this.data.characters);
    const cards = chars.map(([id, c]) => `
      <div class="charcard" data-id="${id}">
        <h3><span class="swatch" style="background:${c.color}"></span>${c.name}</h3>
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
      <h1>Cursed Forest</h1>
      <div class="sub">Prototype · stage 1 · placeholder art</div>
      <div class="row">${cards}</div>
      <div class="keys"><b>W</b><b>A</b><b>S</b><b>D</b> or arrows to move · weapons fire on their own · <b>Space</b> ability · <b>Esc</b> pause · <b>1</b>-<b>4</b> pick cards</div>
      <p>Survive 15 minutes. The Elder Treant wakes at 10:00. Gold and the skill tree arrive in a later stage, so nothing is saved yet.</p>`);
    el.querySelectorAll('.charcard').forEach((c) => c.addEventListener('click', () => onPick(c.dataset.id)));
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
      if (c.kind === 'stat') {
        pips = '<div class="pips">' + Array.from({ length: maxRank }, (_, k) => `<i class="${k < c.rank ? 'on' : k === c.rank ? 'next' : ''}"></i>`).join('') + '</div>';
      }
      const ban = sim.banishesLeft > 0 && !gold ? `<button class="btn ban" data-ban="${c.key}">Banish</button>` : '';
      return `
        <div class="card ${gold ? 'gold' : ''}" data-key="${c.key}" style="border-top-color:${c.color}">
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
    this.currentCards = all;
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

  hideLevelUp() { this.hide('levelup'); this.currentCards = null; }

  // ------------------------------------------------------------------ pause / end
  showPause() {
    const el = this.show('pause', `
      <h2>Paused</h2>
      <div class="row"><button class="btn big" data-act="resume">Resume (Esc)</button><button class="btn big" data-act="menu">Quit to menu</button></div>`);
    el.querySelector('[data-act="resume"]').addEventListener('click', () => this.handlers.togglePause());
    el.querySelector('[data-act="menu"]').addEventListener('click', () => this.handlers.menu());
  }

  hidePause() { this.hide('pause'); }

  showEnd(sim) {
    const r = sim.result();
    const d = this.data;
    const won = r.outcome === 'victory';
    const evos = r.weapons.filter((w) => w.evo).map((w) => d.evolutions[w.evo].name);
    const el = this.show('end', `
      <h2 style="color:${won ? 'var(--good)' : 'var(--hp)'}">${won ? 'You survived the night' : 'You were overrun'}</h2>
      <dl class="endstats">
        <dt>Time survived</dt><dd>${fmtTime(r.time)}</dd>
        <dt>Level reached</dt><dd>${r.level}</dd>
        <dt>Enemies slain</dt><dd>${r.kills}</dd>
        <dt>Gold earned</dt><dd>${r.gold}</dd>
        <dt>Soul shards</dt><dd>${r.shards}${r.bossKilled ? ' (Elder Treant slain)' : ''}</dd>
        <dt>Weapons</dt><dd>${r.weapons.map((w) => (w.evo ? d.evolutions[w.evo].name : d.weapons[w.id].name)).join(', ')}</dd>
        <dt>Evolutions</dt><dd>${evos.length ? evos.join(', ') : 'none this run'}</dd>
      </dl>
      <div class="row"><button class="btn big" data-act="again">Play again</button><button class="btn big" data-act="menu">Character select</button></div>
      <div class="note">Gold and shards are not banked yet. The skill tree comes in a later stage.</div>`);
    el.querySelector('[data-act="again"]').addEventListener('click', () => this.handlers.again());
    el.querySelector('[data-act="menu"]').addEventListener('click', () => this.handlers.menu());
  }

  hideEnd() { this.hide('end'); }

  hideAll() {
    for (const k of Object.keys(this.layers)) this.hide(k);
  }

  // ------------------------------------------------------------------ keys
  onKey(e) {
    const lu = this.layers.levelup;
    if (lu && lu.style.display !== 'none' && this.currentCards) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= this.currentCards.length) {
        e.preventDefault();
        this.handlers.pick(this.currentCards[n - 1].key);
      } else if (e.key === 'r' || e.key === 'R') {
        this.handlers.reroll();
      }
    }
  }
}
