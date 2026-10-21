// Skill tree screen: a pannable, zoomable node web. Plain styling on purpose (the art identity is not chosen yet).
// Lines are drawn on one canvas; nodes are DOM buttons created only while near the viewport (virtualised),
// so 500+ nodes stay smooth. Every string from data is inserted with textContent, never innerHTML.
import { gateTag, PERMANENT_NOTE, GATE_KEY_TEXT, RESPEC_ARMED, RESPEC_DONE_SUFFIX } from '../meta/gatewords.js';
import { describeNode, nodeStatus, pathToHub, queryRect, spentOf } from '../meta/tree.js';

const NODE = 46; // node diameter in world units
const MIN_Z = 0.35;
const MAX_Z = 2.2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const mk = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

export class TreeScreen {
  // host: UI instance (provides layer/show/hide). api: see app.treeApi().
  constructor(host) {
    this.host = host;
    this.open_ = false;
    this.els = new Map(); // id -> element (only visible nodes exist)
    this.status = new Map();
    this.cam = { x: 0, y: 0, z: 0.8 };
    this.sel = null;
    this.pointers = new Map();
    this.dragged = false;
    this.raf = 0;
    this.armed = null;
    this.keyHandler = (e) => this.onKey(e);
  }

  get isOpen() { return this.open_; }

  open(api) {
    this.api = api;
    this.def = api.def;
    this.data = api.data;
    this.open_ = true;
    this.els.clear();
    this.sel = null;
    const root = this.host.layer('tree');
    root.replaceChildren();
    this.root = root;

    const top = mk('div', 'tree-top');
    const back = mk('button', 'btn', 'Back (Esc)');
    back.addEventListener('click', () => this.close());
    this.bankEl = mk('span', 'tree-bank');
    this.respecBtn = mk('button', 'btn', 'Respec (free)');
    this.respecBtn.addEventListener('click', () => this.onRespec());
    const zin = mk('button', 'btn tree-zoom', '+');
    const zout = mk('button', 'btn tree-zoom', '-');
    const home = mk('button', 'btn tree-zoom', 'Hub');
    zin.setAttribute('aria-label', 'Zoom in');
    zout.setAttribute('aria-label', 'Zoom out');
    home.setAttribute('aria-label', 'Centre on the hub');
    zin.addEventListener('click', () => this.zoomBy(1.25));
    zout.addEventListener('click', () => this.zoomBy(0.8));
    home.addEventListener('click', () => { this.cam.x = 0; this.cam.y = 0; this.schedule(); });
    top.append(back, this.bankEl, zout, zin, home, this.respecBtn);

    this.view = mk('div', 'tree-view');
    this.view.tabIndex = 0;
    this.canvas = mk('canvas', 'tree-lines');
    this.world = mk('div', 'tree-world');
    this.view.append(this.canvas, this.world, mk('div', 'tree-gatekey', GATE_KEY_TEXT));
    this.buildStatic();

    this.panel = mk('div', 'tree-panel');
    const help = mk('div', 'tree-help', 'Drag or WASD/arrows to move · wheel, pinch or +/- to zoom · click a node for details');
    root.append(top, this.view, this.panel, help);
    this.host.show('tree');

    this.bindInput();
    this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.resize()) : null;
    if (this.ro) this.ro.observe(this.view);
    window.addEventListener('keydown', this.keyHandler);
    this.resize();
    const s = this.view.getBoundingClientRect();
    this.cam.z = clamp(Math.min(s.width, s.height) / (2 * 3.4 * this.def.ringStep), 0.66, 1);
    this.cam.x = 0;
    this.cam.y = 0;
    this.refresh();
    this.renderPanel();
    this.view.focus({ preventScroll: true });
  }

  close() {
    if (!this.open_) return;
    this.open_ = false;
    window.removeEventListener('keydown', this.keyHandler);
    if (this.ro) this.ro.disconnect();
    cancelAnimationFrame(this.raf);
    this.host.hide('tree');
    if (this.root) this.root.replaceChildren();
    this.els.clear();
    if (this.api && this.api.onClose) this.api.onClose();
  }

  // Hub and branch labels (a handful of static elements).
  buildStatic() {
    const hub = mk('div', 'tree-hub', 'Hollowlight');
    hub.style.left = '0px';
    hub.style.top = '0px';
    this.world.append(hub);
    for (const b of Object.values(this.def.branches)) {
      const rad = (b.angle * Math.PI) / 180;
      const lab = mk('div', 'tree-branch', b.name);
      lab.style.left = `${Math.cos(rad) * this.def.ringStep * 0.62}px`;
      lab.style.top = `${Math.sin(rad) * this.def.ringStep * 0.62 + (Math.abs(Math.cos(rad)) > 0.5 ? 24 : 0)}px`;
      if (b.color) lab.style.color = b.color;
      this.world.append(lab);
    }
  }

  // ---------------------------------------------------------------- camera
  resize() {
    const r = this.view.getBoundingClientRect();
    this.vw = Math.max(1, r.width);
    this.vh = Math.max(1, r.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.vw * dpr);
    this.canvas.height = Math.round(this.vh * dpr);
    this.dpr = dpr;
    this.schedule();
  }

  zoomAt(factor, sx, sy) {
    const c = this.cam;
    const z2 = clamp(c.z * factor, MIN_Z, MAX_Z);
    const wx = c.x + sx / c.z;
    const wy = c.y + sy / c.z;
    c.z = z2;
    c.x = wx - sx / z2;
    c.y = wy - sy / z2;
    this.limit();
    this.schedule();
  }

  zoomBy(f) { this.zoomAt(f, 0, 0); }

  limit() {
    // Keep the hub-centred web reachable but never let the camera fly away.
    const R = this.def.ringStep * 62;
    this.cam.x = clamp(this.cam.x, -R, R);
    this.cam.y = clamp(this.cam.y, -R, R);
  }

  schedule() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; if (this.open_) this.draw(); });
  }

  // ---------------------------------------------------------------- input
  bindInput() {
    const v = this.view;
    v.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = v.getBoundingClientRect();
      this.zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left - this.vw / 2, e.clientY - r.top - this.vh / 2);
    }, { passive: false });
    v.addEventListener('pointerdown', (e) => {
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
      this.dragged = false;
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: this.cam.z };
      }
    });
    v.addEventListener('pointermove', (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      if (this.pointers.size === 1) {
        const dx = e.clientX - p.x;
        const dy = e.clientY - p.y;
        if (!this.dragged && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 6) {
          this.dragged = true;
          try { v.setPointerCapture(e.pointerId); } catch { /* not supported */ }
        }
        if (this.dragged) {
          this.cam.x -= dx / this.cam.z;
          this.cam.y -= dy / this.cam.z;
          this.limit();
          this.schedule();
        }
        p.x = e.clientX;
        p.y = e.clientY;
      } else if (this.pointers.size === 2 && this.pinch) {
        p.x = e.clientX;
        p.y = e.clientY;
        this.dragged = true;
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const r = v.getBoundingClientRect();
        const target = clamp(this.pinch.z * (d / this.pinch.d), MIN_Z, MAX_Z);
        this.zoomAt(target / this.cam.z, (a.x + b.x) / 2 - r.left - this.vw / 2, (a.y + b.y) / 2 - r.top - this.vh / 2);
      }
    });
    const up = (e) => { this.pointers.delete(e.pointerId); if (this.pointers.size < 2) this.pinch = null; };
    v.addEventListener('pointerup', up);
    v.addEventListener('pointercancel', up);
    this.world.addEventListener('click', (e) => {
      const el = e.target.closest ? e.target.closest('.tree-node') : null;
      if (!el || this.dragged) return;
      this.select(el.dataset.id);
    });
  }

  onKey(e) {
    if (!this.open_) return;
    const k = e.key;
    const step = 90 / this.cam.z;
    if (k === 'Escape') {
      e.preventDefault();
      if (this.armed) { this.disarm(); return; }
      this.host.escAt = performance.now();
      this.close();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    const onNode = t && t.classList && t.classList.contains('tree-node');
    const move = (dx, dy) => { e.preventDefault(); this.cam.x += dx; this.cam.y += dy; this.limit(); this.schedule(); };
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') move(-step, 0);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') move(step, 0);
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') move(0, -step);
    else if (k === 'ArrowDown' || k === 's' || k === 'S') move(0, step);
    else if (k === '+' || k === '=') { e.preventDefault(); this.zoomBy(1.2); }
    else if (k === '-' || k === '_') { e.preventDefault(); this.zoomBy(1 / 1.2); }
    else if (k === '0' || k === 'Home') { e.preventDefault(); this.cam.x = 0; this.cam.y = 0; this.schedule(); }
    else if (k === 'Enter' && this.sel && !onNode && !(t.closest && t.closest('button'))) { e.preventDefault(); this.onBuy(); }
  }

  // ---------------------------------------------------------------- state
  refresh() {
    const save = this.api.save();
    this.status.clear();
    for (const id of this.def.list) this.status.set(id, nodeStatus(this.def, save, id, this.data));
    this.bankEl.textContent = `${save.gold} gold · ${save.shards} soul shards`;
    this.respecBtn.disabled = !Object.keys(save.tree).some((id) => this.def.nodes[id] && !this.def.nodes[id].permanent);
    for (const [id, el] of this.els) this.styleNode(id, el);
    this.schedule();
  }

  styleNode(id, el) {
    const n = this.def.nodes[id];
    const s = this.status.get(id);
    const save = this.api.save();
    const cls = ['tree-node', `st-${s.state}`];
    if (s.rank > 0 && s.state !== 'owned') cls.push('partial');
    if (s.state === 'available' && s.affordable) cls.push('afford');
    if (n.keystone) cls.push('key');
    if (n.permanent) cls.push('gate');
    if (n.hidden || n.teaser) cls.push('mystery');
    if (s.state === 'available' && n.unlock && !save.seen[id]) cls.push('new');
    if (this.sel === id) cls.push('sel');
    if (this.pathIds && this.pathIds.has(id)) cls.push('path');
    el.className = cls.join(' ');
    el.style.setProperty('--c', this.def.branches[n.branch].color || '#9fb3c8');
    const d = describeNode(this.def, save, id, this.data);
    el.setAttribute('aria-label', `${d.name}, ${s.state}${n.maxRank > 1 ? `, rank ${s.rank} of ${n.maxRank}` : ''}`);
    const lab = el.querySelector('.tn-label');
    lab.textContent = d.name;
    el.querySelector('.tn-rank').textContent = gateTag(this.def, id) || (d.masked ? '?' : (n.maxRank > 1 ? `${s.rank}/${n.maxRank}` : ''));
    el.style.setProperty('--p', String(s.cond && !s.cond.done && !d.masked ? Math.round(s.cond.frac * 100) : (s.state === 'owned' ? 100 : 0)));
  }

  makeNode(id) {
    const n = this.def.nodes[id];
    const el = mk('button', 'tree-node');
    el.type = 'button';
    el.dataset.id = id;
    el.style.left = `${n.x}px`;
    el.style.top = `${n.y}px`;
    el.append(mk('span', 'tn-ring'), mk('span', 'tn-rank'), mk('span', 'tn-label'));
    el.addEventListener('focus', () => { if (this.sel !== id) this.select(id, true); });
    this.styleNode(id, el);
    return el;
  }

  select(id, fromFocus) {
    this.sel = id;
    this.pathIds = id ? pathToHub(this.def, id).ids : null;
    this.disarm();
    if (id) this.api.markSeen(id);
    for (const [nid, el] of this.els) this.styleNode(nid, el);
    this.renderPanel();
    if (!fromFocus && this.els.get(id)) this.els.get(id).focus({ preventScroll: true });
    this.schedule();
  }

  // ---------------------------------------------------------------- drawing
  draw() {
    const { cam, vw, vh } = this;
    const z = cam.z;
    this.world.style.transform = `translate(${vw / 2 - cam.x * z}px, ${vh / 2 - cam.y * z}px) scale(${z})`;
    this.world.classList.toggle('far', z < 0.62);

    // virtualise nodes
    const m = 70;
    const x0 = cam.x - vw / 2 / z - m;
    const x1 = cam.x + vw / 2 / z + m;
    const y0 = cam.y - vh / 2 / z - m;
    const y1 = cam.y + vh / 2 / z + m;
    const want = new Set(queryRect(this.def, x0, y0, x1, y1));
    if (this.sel) want.add(this.sel);
    for (const [id, el] of this.els) {
      if (!want.has(id) && document.activeElement !== el) { el.remove(); this.els.delete(id); }
    }
    for (const id of want) {
      if (!this.els.has(id)) { const el = this.makeNode(id); this.els.set(id, el); this.world.append(el); }
    }

    // lines
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    const sx = (x) => (x - cam.x) * z + vw / 2;
    const sy = (y) => (y - cam.y) * z + vh / 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(159,179,200,0.10)';
    ctx.lineWidth = 1;
    for (let r = 1; r <= 8; r++) { ctx.beginPath(); ctx.arc(sx(0), sy(0), r * this.def.ringStep * z, 0, Math.PI * 2); ctx.stroke(); }
    const pathEdges = this.sel ? pathToHub(this.def, this.sel).edges : null;
    const pos = (id) => (id === 'hub' ? { x: 0, y: 0 } : this.def.nodes[id]);
    const drawEdges = (pass) => {
      for (const e of this.def.edges) {
        const a = pos(e.from);
        const b = pos(e.to);
        const ax = sx(a.x), ay = sy(a.y), bx = sx(b.x), by = sy(b.y);
        if ((ax < -40 && bx < -40) || (ay < -40 && by < -40) || (ax > vw + 40 && bx > vw + 40) || (ay > vh + 40 && by > vh + 40)) continue;
        const key = `${e.from}>${e.to}`;
        const onPath = pathEdges && pathEdges.has(key);
        const sFrom = e.from === 'hub' ? { rank: 1 } : this.status.get(e.from);
        const lit = sFrom && sFrom.rank > 0 && (this.status.get(e.to).rank > 0);
        const kind = onPath ? 2 : lit ? 1 : 0;
        if (kind !== pass) continue;
        const col = this.def.branches[this.def.nodes[e.to].branch].color || '#9fb3c8';
        ctx.strokeStyle = kind === 2 ? '#ffffff' : kind === 1 ? col : 'rgba(159,179,200,0.28)';
        ctx.globalAlpha = kind === 2 ? 0.95 : kind === 1 ? 0.85 : 1;
        ctx.lineWidth = (kind === 2 ? 3.2 : kind === 1 ? 2.2 : 1.2) * Math.min(1.2, Math.max(0.7, z));
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    drawEdges(0); drawEdges(1); drawEdges(2);
  }

  // ---------------------------------------------------------------- detail panel + actions
  renderPanel() {
    const p = this.panel;
    p.replaceChildren();
    if (!this.sel) {
      const save = this.api.save();
      p.append(mk('div', 'tp-title', 'The Hollow remembers'));
      const spent = spentOf(save.tree, this.def, save.creep); // what was actually paid (rising price)
      p.append(mk('div', 'tp-line', `Nodes owned: ${Object.keys(save.tree).length} of ${this.def.list.filter((i) => !this.def.nodes[i].teaser).length} · spent ${spent.gold} gold, ${spent.shards} shards`));
      p.append(mk('div', 'tp-line', 'Select a node to see its cost, effect and what unlocks it.'));
      return;
    }
    const save = this.api.save();
    const n = this.def.nodes[this.sel];
    const d = describeNode(this.def, save, this.sel, this.data);
    const br = this.def.branches[n.branch];
    p.append(mk('div', 'tp-title', d.name));
    const meta = `${gateTag(this.def, this.sel) ? 'GATE · ' : ''}${br.name} · tier ${n.ring}${n.maxRank > 1 ? ` · rank ${d.rank}/${n.maxRank}` : ''}${n.keystone ? ' · KEYSTONE' : ''}`;
    p.append(mk('div', 'tp-meta', d.masked ? `${gateTag(this.def, this.sel) ? 'GATE · ' : ''}${br.name} · tier ${n.ring}` : meta));
    p.append(mk('div', 'tp-desc', d.desc));
    if (d.flavour) p.append(mk('div', 'tp-flavour', d.flavour));
    if (n.permanent) p.append(mk('div', 'tp-line perm', PERMANENT_NOTE));
    if (d.state === 'owned') p.append(mk('div', 'tp-line ok', 'Owned.'));
    else if (d.reason && d.state !== 'condition') p.append(mk('div', 'tp-line warn', d.reason));
    if (d.condLines.length && d.state !== 'owned' && d.rank === 0) {
      const box = mk('div', 'tp-cond');
      box.append(mk('div', 'tp-line', d.condMode === 'any' ? 'Unlock (any one):' : 'Unlock condition:'));
      for (const l of d.condLines) {
        const row = mk('div', `tp-prog${l.done ? ' done' : ''}`);
        row.append(mk('span', '', l.done ? `${l.text} (done)` : `${l.text}${l.goal > 1 ? ` — ${l.cur}/${l.goal}` : ''}`));
        const bar = mk('div', 'tp-bar');
        const fill = mk('i');
        fill.style.width = `${Math.round((l.goal > 0 ? l.cur / l.goal : 1) * 100)}%`;
        bar.append(fill);
        row.append(bar);
        box.append(row);
      }
      p.append(box);
    }
    if (d.state !== 'owned' && d.next && d.state !== 'teaser') {
      const c = d.next;
      p.append(mk('div', 'tp-line', `Cost: ${c.gold} gold${c.shards ? ` + ${c.shards} soul shards` : ''}${d.affordable ? '' : ' (not enough yet)'}`));
    }
    this.buyBtn = mk('button', 'btn tp-buy', d.state === 'owned' ? 'Owned' : 'Buy');
    this.buyBtn.disabled = !(d.buyable && d.affordable);
    this.buyBtn.addEventListener('click', () => this.onBuy());
    p.append(this.buyBtn);
    this.msg = mk('div', 'tp-msg');
    p.append(this.msg);
  }

  disarm() {
    this.armed = null;
    clearTimeout(this.armTimer);
    if (this.buyBtn && this.buyBtn.isConnected) this.renderPanel();
  }

  onBuy() {
    if (!this.sel) return;
    const save = this.api.save();
    const d = describeNode(this.def, save, this.sel, this.data);
    if (!d.buyable || !d.affordable) return;
    if (this.armed !== `buy:${this.sel}`) {
      this.armed = `buy:${this.sel}`;
      this.buyBtn.textContent = `Confirm: ${d.next.gold} gold${d.next.shards ? ` + ${d.next.shards} shards` : ''}`;
      this.buyBtn.classList.add('armed');
      clearTimeout(this.armTimer);
      this.armTimer = setTimeout(() => this.disarm(), 4000);
      return;
    }
    clearTimeout(this.armTimer);
    this.armed = null;
    const id = this.sel;
    const res = this.api.buy(id);
    this.refresh();
    this.renderPanel();
    if (this.msg) this.msg.textContent = res.ok ? `${this.def.nodes[id].name} awakened.` : res.reason;
  }

  onRespec() {
    if (this.armed !== 'respec') {
      this.armed = 'respec';
      this.respecBtn.textContent = RESPEC_ARMED;
      clearTimeout(this.armTimer);
      this.armTimer = setTimeout(() => { this.armed = null; this.respecBtn.textContent = 'Respec (free)'; }, 4000);
      return;
    }
    clearTimeout(this.armTimer);
    this.armed = null;
    this.respecBtn.textContent = 'Respec (free)';
    const spent = this.api.respec();
    this.refresh();
    this.renderPanel();
    if (this.msg) this.msg.textContent = `Refunded ${spent.gold} gold and ${spent.shards} shards.${RESPEC_DONE_SUFFIX}`;
  }
}
