// HUD-1: the in-run frame, Direction A "Lantern & Thread" (docs/mockups/hud-sheet). DOM + inline SVG built with
// createElementNS / textContent only (no innerHTML, no data in markup). Display-only: reads the sim, never writes it.
// All layout lives in style.css (.h-*); this file builds the nodes and updates them when a value changes.
import { mk, defs, emblem, lantern, moonArc, bakeFrost, EMBLEM_OF, ROLE_COL } from './hudsvg.js';
import {
  hpFrac, flameScale, isEmber, frostAmount, xpFrac, litNotches, rankPips, ringFrac, moonT, arcGeom, moonPoint,
  newFade, fadeWake, fadeLevel, clamp01,
} from './hudmath.js';

const fmtTime = (s) => {
  s = Number.isFinite(s) && s > 0 ? s : 0;
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};
const ARC = arcGeom(190, 26);
const whole = (v, fn) => (Number.isFinite(v) ? fn(v) : 0); // never print NaN / Infinity

export class Hud {
  // doc: document (or a test double). host: the .hud element. opts: { onPause, bossName(type) }
  constructor(doc, host, opts = {}) {
    this.doc = doc;
    this.host = host;
    this.opts = opts;
    this.cache = {};
    this.fade = newFade();
    this.peak = [];
    this.prev = { level: -1, key: '', cd: 0, boss: false };
    this.frostSrc = null;
    const d = doc;
    const el = (tag, cls, text) => { const n = d.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
    this.el = el;
    host.appendChild(defs(d));

    this.frost = el('div', 'h-frost');
    // --- lantern plate: flame = HP, thread = XP, knot = level
    this.lamp = lantern(d);
    const lampBox = el('div', 'h-lamp'); lampBox.appendChild(this.lamp.svg);
    this.hpNum = el('b', 'h-num h-hpnum', '0');
    this.hpMax = el('span', 'h-hpmax', '/ 0');
    const hp = el('div', 'h-hp'); hp.append(this.hpNum, this.hpMax);
    this.threadFill = el('i', 'h-tfill');
    this.bead = el('i', 'h-bead');
    const rail = el('div', 'h-rail'); rail.append(this.threadFill, el('i', 'h-notches'), this.bead);
    this.thread = el('div', 'h-thread'); this.thread.appendChild(rail);
    this.knotNum = el('b', 'h-num h-knotnum', '1');
    this.knot = el('div', 'h-knot'); this.knot.appendChild(this.knotNum);
    this.lantern = el('div', 'h-lantern');
    this.lantern.append(el('div', 'h-plate'), lampBox, hp, this.thread, this.knot);

    // --- weapon strip
    this.strip = el('div', 'h-strip');
    this.strip.setAttribute('aria-label', 'Weapons');

    // --- moon arc timer (+ phone-portrait track) and boss bar
    this.moonSvg = moonArc(d, ARC.w, ARC.rise, ARC);
    const arcBox = el('div', 'h-arc'); arcBox.appendChild(this.moonSvg.svg);
    this.time = el('b', 'h-num h-timetxt', '00:00');
    this.track = el('i', 'h-track'); this.trackDot = el('i', 'h-trackdot'); this.track.append(this.trackDot, el('i', 'h-tracksun'));
    const tp = el('div', 'h-timeplate'); tp.append(this.time, this.track);
    this.moon = el('div', 'h-moon'); this.moon.append(arcBox, tp);
    this.bossName = el('div', 'h-bossname');
    this.bossFill = el('i', 'h-bfill');
    const bbar = el('div', 'h-bbar'); bbar.append(this.bossFill, el('i', 'h-bnotch n1'), el('i', 'h-bnotch n2'));
    this.boss = el('div', 'h-boss'); this.boss.append(this.bossName, bbar);

    // --- currency pill + pause
    const coin = el('span', 'h-coinicon'); const cs = mk(d, 'svg', { viewBox: '-24 -24 48 48', 'aria-hidden': 'true' }, [emblem(d, 'coin', 48)]); coin.appendChild(cs);
    this.goldNum = el('b', 'h-num h-goldnum', '0');
    this.coin = el('div', 'h-coin'); this.coin.append(coin, this.goldNum);
    this.pause = el('button', 'h-pause'); this.pause.type = 'button'; this.pause.setAttribute('aria-label', 'Pause');
    this.pause.addEventListener('click', (e) => { e.preventDefault(); if (opts.onPause) opts.onPause(); });

    // --- ability button
    this.abRing = mk(d, 'circle', { cx: 0, cy: 0, r: 37, fill: 'none', stroke: '#ffb55a', 'stroke-width': 5, pathLength: 100, 'stroke-dasharray': '100 0', 'stroke-linecap': 'round', transform: 'rotate(-90)' });
    this.abIcon = mk(d, 'g');
    const abSvg = mk(d, 'svg', { viewBox: '-46 -46 92 92', 'aria-hidden': 'true' }, [
      mk(d, 'circle', { r: 42, fill: 'url(#hlPlate)', 'fill-opacity': 0.9, stroke: '#8d6c34', 'stroke-width': 2 }),
      mk(d, 'circle', { r: 37, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.07, 'stroke-width': 5 }), this.abRing, this.abIcon]);
    this.abSec = el('b', 'h-num h-absec', '');
    this.abKey = el('span', 'h-abkey', 'SPACE');
    this.ability = el('div', 'h-ability'); this.ability.append(abSvg, this.abSec, this.abKey);

    this.toast = el('div', 'toast');
    this.bossIntro = el('div', 'bossintro');
    this.flash = el('div', 'hurtflash');
    host.append(this.frost, this.lantern, this.strip, this.moon, this.boss, this.coin, this.pause, this.ability, this.toast, this.bossIntro, this.flash);

    this.strip.addEventListener('pointerenter', () => this.wake());
    this.strip.addEventListener('pointerdown', () => this.wake());
    this.reset();
  }

  now() { return this.t; }
  wake() { fadeWake(this.fade, this.t || 0); this.applyFade(this.t || 0); }

  // Fresh run: forget everything cached so the first update paints all values.
  reset() {
    this.cache = {};
    this.peak = [];
    this.prev = { level: -1, key: '', cd: 0, boss: false };
    this.t = 0;
    this.fresh = true; // first update of a run wakes the strip at the run's own clock
    this.fade = newFade();
    this.abKind = '';
    this.activeUntil = 0; this.activeDur = 1;
    this.boss.classList.remove('on', 'enter');
    this.strip.classList.remove('low');
    this.strip.replaceChildren();
  }

  // HUD-3 feedback pings: restart a one-shot CSS animation (class toggle + reflow). CSS turns them off under reduced motion.
  ping(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }
  pulseThread() { this.ping(this.thread, 'pulse'); } // a gem landed
  flareHp() { this.ping(this.lamp.svg.parentNode, 'flare'); } // a heart landed
  tickCoin() { this.ping(this.coin, 'tick'); } // gold came in

  set(key, node, value) { if (this.cache[key] !== value) { this.cache[key] = value; node.textContent = value; return true; } return false; }
  attr(key, node, name, value) { if (this.cache[key] !== value) { this.cache[key] = value; node.setAttribute(name, value); } }
  sty(key, node, name, value) { if (this.cache[key] !== value) { this.cache[key] = value; node.style[name] = value; } }

  applyFade(now) {
    const low = fadeLevel(this.fade, now) === 'low';
    if (this.cache.low !== low) { this.cache.low = low; this.strip.classList.toggle('low', low); }
  }

  // Touch: tap inside the strip's box wakes it (the touch zone sits above the strip so a real hit never reaches it).
  tapAt(x, y) {
    const r = this.strip.getBoundingClientRect ? this.strip.getBoundingClientRect() : null;
    if (r && x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 8 && y <= r.bottom + 8) this.wake();
  }

  update(sim, data) {
    const p = sim.player, t = sim.time;
    this.t = t;
    if (this.fresh) { this.fresh = false; fadeWake(this.fade, t); }
    const hf = hpFrac(p.hp, p.maxHp);
    this.set('hp', this.hpNum, String(Math.max(0, whole(p.hp, Math.ceil))));
    this.set('hpmax', this.hpMax, `/ ${Math.max(0, whole(p.maxHp, Math.round))}`);
    const ember = isEmber(hf);
    const sc = flameScale(hf).toFixed(2);
    this.attr('flame', this.lamp.flame, 'transform', `translate(0,13) scale(${sc})`);
    this.attr('ember', this.lamp.flameBody, 'fill', ember ? 'url(#hlEmber)' : 'url(#hlFlame)');
    this.attr('glow', this.lamp.glow, 'opacity', ember ? '0.5' : '0.9');
    if (this.cache.lowc !== ember) { this.cache.lowc = ember; this.lantern.classList.toggle('low', ember); }
    const fa = frostAmount(hf);
    if (fa > 0 && this.frostSrc === null) {
      this.frostSrc = bakeFrost(this.doc);
      if (this.frostSrc) this.frost.style.backgroundImage = `url(${this.frostSrc})`;
    }
    this.sty('frost', this.frost, 'opacity', fa.toFixed(2));
    this.frost.classList.toggle('on', fa > 0);

    const xf = xpFrac(sim.xp, sim.xpNeeded);
    this.sty('xp', this.threadFill, 'width', `${(xf * 100).toFixed(1)}%`);
    this.sty('bead', this.bead, 'left', `${(xf * 100).toFixed(1)}%`);
    this.attr('notch', this.thread, 'data-lit', String(litNotches(xf)));
    this.set('lvl', this.knotNum, String(whole(sim.level, Math.floor)));
    if (this.prev.level !== sim.level) {
      if (this.prev.level >= 0) { this.knot.classList.remove('flare'); void this.knot.offsetWidth; this.knot.classList.add('flare'); this.wake(); }
      this.prev.level = sim.level;
    }

    // moon arc + timer
    const run = sim.balance.runSeconds;
    const tf = moonT(t, run);
    const mp = moonPoint(tf, ARC);
    this.attr('moon', this.moonSvg.moon, 'transform', `translate(${mp.x.toFixed(1)},${mp.y.toFixed(1)})`);
    this.attr('lit', this.moonSvg.lit, 'stroke-dasharray', `${(tf * 100).toFixed(1)} 100`);
    this.sty('trackdot', this.trackDot, 'left', `${(tf * 100).toFixed(1)}%`);
    this.set('time', this.time, fmtTime(Math.max(0, run - t)));

    // boss bar
    const b = sim.boss && !sim.boss.dead ? sim.boss : null;
    if (b) {
      if (!this.prev.boss) { this.prev.boss = true; this.boss.classList.add('on'); this.ping(this.boss, 'enter'); }
      this.set('bossname', this.bossName, this.opts.bossName ? this.opts.bossName(b.type) : 'Boss');
      this.sty('bossfill', this.bossFill, 'width', `${(hpFrac(b.hp, b.maxHp) * 100).toFixed(1)}%`);
    } else if (this.prev.boss) { this.prev.boss = false; this.boss.classList.remove('on'); }

    this.set('gold', this.goldNum, String(Math.max(0, whole(sim.gold, Math.floor))));

    // weapon strip (rebuilt only when ownership / ranks / evolution change)
    const key = sim.weapons.map((w) => `${w.id}:${w.evo || ''}:${Object.values(w.ranks).join('')}`).join('|');
    if (this.prev.key !== key) {
      if (this.prev.key !== '') this.wake(); // weapon gained / ranked up / evolved
      this.prev.key = key;
      this.buildStrip(sim, data);
    }
    for (let i = 0; i < sim.weapons.length; i++) {
      const rt = sim.weapons[i].rt, ring = this.rings && this.rings[i];
      if (!ring) continue;
      const cd = rt && Number.isFinite(rt.cd) ? rt.cd : null;
      if (cd === null) continue;
      if (!(this.peak[i] >= cd)) this.peak[i] = cd;
      const f = ringFrac(cd, this.peak[i]);
      this.attr(`ring${i}`, ring, 'stroke-dasharray', `${(f * 100).toFixed(0)} 100`);
    }

    // ability
    const a = sim.ability;
    if (this.abKind !== a.id) {
      this.abKind = a.id;
      this.abIcon.replaceChildren(emblem(this.doc, EMBLEM_OF[a.id] || 'sanctuary', 56));
    }
    const ready = a.cdLeft <= 0;
    const cdTotal = sim.abilityCooldown;
    if (a.cdLeft > this.prev.cd + 1) { // just used: the ring drains over the effect's duration, then refills as it cools
      const m = sim.tfx && Number.isFinite(sim.tfx.abilityDur) ? sim.tfx.abilityDur : 1;
      this.activeDur = Math.max(0.5, 6 * m); this.activeUntil = t + this.activeDur;
    }
    const active = t < this.activeUntil && !ready;
    if (this.cache.abactive !== active) { this.cache.abactive = active; this.ability.classList.toggle('active', active); }
    const ringF = active ? clamp01((this.activeUntil - t) / this.activeDur) : ready ? 1 : clamp01(1 - a.cdLeft / cdTotal);
    this.attr('abring', this.abRing, 'stroke-dasharray', `${(ringF * 100).toFixed(0)} 100`);
    this.set('absec', this.abSec, ready ? '' : `${Math.max(0, whole(a.cdLeft, Math.ceil))}s`);
    if (this.cache.abready !== ready) {
      const was = this.cache.abready;
      this.cache.abready = ready; this.ability.classList.toggle('ready', ready);
      if (ready && was === false) this.ping(this.ability, 'ping'); // became ready: one gentle ring pulse
    }
    if (a.cdLeft > this.prev.cd + 1) this.wake(); // ability used
    this.prev.cd = a.cdLeft;

    this.applyFade(t);
  }

  buildStrip(sim, data) {
    const d = this.doc, slots = sim.balance.weaponSlots, max = sim.balance.maxRank * 4;
    this.strip.replaceChildren();
    this.rings = [];
    for (let i = 0; i < slots; i++) {
      const w = sim.weapons[i];
      const tile = this.el('div', w ? `h-tile${w.evo ? ' evo' : ''}` : 'h-tile empty');
      if (w) {
        const kind = EMBLEM_OF[w.id] || 'orb';
        const name = w.evo ? data.evolutions[w.evo].name : data.weapons[w.id].name;
        tile.setAttribute('role', 'img'); tile.setAttribute('aria-label', name);
        const total = Object.values(w.ranks).reduce((a, b) => a + b, 0);
        const lit = rankPips(total, max, 5, !!w.evo);
        const ring = mk(d, 'rect', { x: -2, y: -2, width: 60, height: 60, rx: 17, fill: 'none', stroke: ROLE_COL[kind] || '#fff', 'stroke-width': 3, pathLength: 100, 'stroke-dasharray': '0 100', 'stroke-linecap': 'round', opacity: 0.9 });
        const pips = [];
        for (let k = 0; k < 5; k++) pips.push(mk(d, 'circle', { cx: 28 + (k - 2) * 7.6, cy: 48, r: 2.5, fill: k < lit ? (w.evo ? '#ffd36b' : '#fff3dc') : '#0c0908', stroke: w.evo ? '#8a5a12' : '#8d6c34', 'stroke-width': 1 }));
        const svg = mk(d, 'svg', { viewBox: '-4 -4 64 64', 'aria-hidden': 'true' }, [
          mk(d, 'circle', { cx: 28, cy: 26, r: 23, fill: ROLE_COL[kind] || '#fff', opacity: 0.16 }),
          mk(d, 'g', { transform: 'translate(28,25)' }, [emblem(d, kind, 33)]),
          ...pips, ring]);
        tile.appendChild(svg);
        this.rings[i] = ring; // stays empty (0 length) for weapons that do not fire on a timer
      }
      this.strip.appendChild(tile);
    }
  }
}
