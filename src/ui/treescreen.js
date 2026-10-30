// Skill tree screen, T4 (LOCKED look 'A Lantern Trails', docs/mockups/tree-screen-v2/option-a.html, docs/design/tree-screen-review.md).
// One canvas draws the web (plain sky warming as the tree fills, trails only between lit lanterns, a spark toward each open lantern,
// constellation outline when complete, five lantern states, one best-next pin). DOM on top: toolbar, detail/goals panel (side panel,
// bottom sheet on phone portrait), calm Next-step bar, legend, index, first-visit tip, and a pooled, hidden-looking focus list of
// lantern buttons (role tree, at most 120 at once) for keyboard and screen readers.
// Rules: the screen reads ONLY the compiled tree + view regions + the real tree rules (no weapon/hero/chapter id here; grep test);
// every string from data goes through textContent / setAttribute, never innerHTML.
import { TreeModel, SAY, KIND_R, KIND_LABEL, sanitizePins, fmtN, MAX_PINS } from './treemodel.js';
import { RESPEC_DONE_SUFFIX } from '../meta/gatewords.js';
import { CEL } from './codexcopy.js';

const PIN_KEY = 'hollowlight:tree:pins';
const TIP_KEY = 'hollowlight:tree:tip';
const MAX_ITEMS = 120; // live focus buttons (C.12 budget)
const FONT_UI = '"Alegreya Sans", system-ui, sans-serif';
const FONT_HEAD = '"Hollowlight Chancery", Georgia, serif';
const store = {
  get(k) { try { return JSON.parse(globalThis.localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { globalThis.localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode / blocked storage */ } },
};
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = String(text);
  return e;
};
const btn = (cls, text, label) => {
  const b = el('button', cls, text);
  b.type = 'button';
  if (label) b.setAttribute('aria-label', label);
  return b;
};
const SVG_NS = 'http://www.w3.org/2000/svg';
// C3: small code-drawn line glyph for the tool rail (static paths, no data in it)
const glyph = (parts) => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('class', 'ts-ico'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  for (const [tag, attrs] of parts) { const n = document.createElementNS(SVG_NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v)); svg.appendChild(n); }
  return svg;
};
const ICON_WEB = [['circle', { cx: 12, cy: 12, r: 3.2 }], ['path', { d: 'M12 2.5v3.2M12 18.3v3.2M2.5 12h3.2M18.3 12h3.2M5.3 5.3l2.3 2.3M16.4 16.4l2.3 2.3M18.7 5.3l-2.3 2.3M7.6 16.4l-2.3 2.3' }]];
const ICON_SPIRITS = [['path', { d: 'M5 17l5-8 4 5 5-9' }], ['circle', { cx: 5, cy: 17, r: 1.8 }], ['circle', { cx: 10, cy: 9, r: 1.8 }], ['circle', { cx: 14, cy: 14, r: 1.8 }], ['circle', { cx: 19, cy: 5, r: 1.8 }]];
const ICON_MORE = [['path', { d: 'M6 15l6-6 6 6' }]];
const hexA = (hex, a) => { const v = parseInt(String(hex).slice(1), 16) || 0; return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class TreeScreen {
  // host: UI instance (layer/show/hide). api: app.treeApi() = { def, data, view, save(), buy(id), respec(), markSeen(id), onClose(), clearRegrowth?() }.
  constructor(host) {
    this.host = host;
    this.open_ = false;
    this.cam = { x: 0, y: 0, z: 0.6 };
    this.keyHandler = (e) => this.onKey(e);
    this.raf = 0;
  }

  get isOpen() { return this.open_; }

  // ------------------------------------------------------------------ open / close
  open(api) {
    this.api = api;
    this.def = api.def;
    this.data = api.data;
    this.view = api.view;
    this.model = new TreeModel(this.def, this.data, this.view);
    this.pins = sanitizePins(store.get(PIN_KEY), this.def);
    this.selected = null;
    this.panelMode = null; // null | 'detail' | 'goals'
    this.onlyLight = false;
    this.confirmT = 0;
    this.armed = null;
    this.anims = [];
    this.fly = null;
    this.ptrs = new Map();
    this.drag = null;
    this.pinch = null;
    this.lastTap = 0;
    this.items = new Map(); // id -> pooled focus button
    this.pool = [];
    this.lastRB = [];
    this.camSig = '';
    this.open_ = true;
    this.celN = 0;
    this.paths = new Map();
    for (const r of this.view.regions) if (r.silhouette) { try { this.paths.set(r.key, new Path2D(r.silhouette)); } catch { /* bad path: no emblem */ } }
    const root = this.host.layer('tree');
    root.replaceChildren();
    this.layer = root;
    this.build(root);
    this.host.show('tree');
    this.mq = globalThis.matchMedia ? globalThis.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this.mqH = () => { this.updateReduced(); this.dirty(); };
    if (this.mq && this.mq.addEventListener) this.mq.addEventListener('change', this.mqH);
    this.updateReduced();
    this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { this.resize(); }) : null;
    if (this.ro) this.ro.observe(this.root);
    this.visH = () => this.dirty();
    document.addEventListener('visibilitychange', this.visH);
    window.addEventListener('keydown', this.keyHandler);
    this.resize();
    this.recompute();
    this.focusStart();
    if (typeof api.focusId === 'string' && this.def.nodes[api.focusId]) this.select(api.focusId, true); // FD4 'Open in tree': fly to the Night Gate lantern
    this.regrowthNote();
    this.showTip(false);
    this.mapEl.focus({ preventScroll: true });
  }

  close() {
    if (!this.open_) return;
    this.open_ = false;
    window.removeEventListener('keydown', this.keyHandler);
    document.removeEventListener('visibilitychange', this.visH);
    if (this.mq && this.mq.removeEventListener) this.mq.removeEventListener('change', this.mqH);
    if (this.ro) this.ro.disconnect();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    clearTimeout(this.tipT); clearTimeout(this.toastT); clearTimeout(this.itemT);
    this.host.hide('tree');
    if (this.layer) this.layer.replaceChildren();
    this.items.clear();
    this.pool = [];
    if (this.api && this.api.onClose) this.api.onClose();
  }

  updateReduced() {
    const s = this.api.save();
    this.reduced = !!(this.mq && this.mq.matches) || !!(s && s.settings && s.settings.reducedMotion);
    if (this.root) this.root.classList.toggle('ts-calm', this.reduced);
  }

  // ------------------------------------------------------------------ DOM
  build(layer) {
    const root = el('div', 'ts');
    this.root = root;
    this.canvas = el('canvas', 'ts-map');
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    // the map element: takes pointer input and keyboard panning; the pooled lantern buttons live inside it (role tree)
    const map = el('div', 'ts-mapwrap');
    map.tabIndex = 0;
    map.setAttribute('role', 'tree');
    map.setAttribute('aria-label', 'Lantern Web. Arrow keys or W A S D move, plus and minus zoom, N shows the best next lantern, question mark explains the lanterns.');
    this.mapEl = map;
    this.itemsEl = el('div', 'ts-items');
    map.append(this.canvas, this.itemsEl);

    // C3: no second header. Back / title / Goals are gone (the tab row has Home, Tree and Goals); the purse lives in the tab row; the tools sit in the right rail (built below).
    const purse = el('div', 'ts-purse');
    purse.setAttribute('aria-label', 'Your purse');
    const pill = (icon, label) => { const p = el('span', 'ts-pill'); p.setAttribute('title', label); const i = el('i', icon); i.setAttribute('aria-hidden', 'true'); const v = el('span'); const sr = el('span', 'ts-sr', ` ${label}`); p.append(i, v, sr); purse.append(p); return { p, v }; };
    this.goldEl = pill('ts-i-gold', 'gold');
    this.shardEl = pill('ts-i-shard', 'soul shards');
    this.glassEl = pill('ts-i-glass', 'Dawnglass');
    if (this.host.nav && this.host.nav.setPurse) this.host.nav.setPurse(purse); // C1: the purse lives in the menu tab row (strip under it on narrow screens)
    this.nextBtn = btn('ts-btn ts-lightable');
    this.nextBtn.setAttribute('title', 'Show the best lantern to light next (N)');
    this.lightN = el('span', 'ts-badge', '0');
    this.nextBtn.append(this.lightN, el('span', 'ts-lt', 'can light'));
    this.nextBtn.addEventListener('click', () => this.nextAfford());
    const idx = btn('ts-btn ts-round', null, 'All spirits and groups');
    idx.setAttribute('title', 'All spirits and groups');
    idx.append(glyph(ICON_SPIRITS));
    idx.addEventListener('click', () => this.openSheet('idx'));
    const help = btn('ts-btn ts-round', '?', 'What the lanterns mean');
    help.setAttribute('title', 'What the lanterns mean (?)');
    help.addEventListener('click', () => this.openSheet('help'));
    this.barEl = null;

    // side panel / bottom sheet: Lantern details + Goals tab
    const panel = el('aside', 'ts-panel');
    panel.setAttribute('aria-label', 'Lantern details');
    const handle = el('div', 'ts-handle');
    handle.addEventListener('click', () => { if (this.small && this.panelMode !== 'goals') this.setExpanded(!this.panelEl.classList.contains('exp')); }); // only the handle toggles the sheet: the map keeps its own pan/pinch
    const tabs = el('div', 'ts-tabs');
    tabs.setAttribute('role', 'tablist');
    this.tabD = btn('ts-tab', 'Lantern');
    this.tabG = btn('ts-tab', 'Goals');
    for (const t of [this.tabD, this.tabG]) t.setAttribute('role', 'tab');
    this.tabD.addEventListener('click', () => { if (this.selected) { this.panelMode = 'detail'; this.syncPanel(); this.renderPanel(); } });
    this.tabG.addEventListener('click', () => { this.panelMode = 'goals'; this.syncPanel(); this.renderGoals(); });
    tabs.append(this.tabD, this.tabG);
    const closeB = btn('ts-close', '×', 'Close');
    closeB.addEventListener('click', () => { this.select(null); this.panelMode = null; this.syncPanel(); });
    const detail = el('div', 'ts-detail');
    detail.setAttribute('aria-live', 'polite');
    this.pKick = el('div', 'ts-kick');
    this.pName = el('h2', 'ts-name'); this.pName.dataset.clamp = 'more'; // compact strip: ellipsis by design, the More chevron shows it all
    this.pState = el('div', 'ts-state');
    this.pWhy = el('div', 'ts-why');
    this.pDesc = el('div', 'ts-desc'); this.pDesc.dataset.clamp = 'more';
    this.pEvo = el('div', 'ts-desc ts-evo'); // what the unlocked evolution does (same text as the pick card + Almanac: data.evolutions[id].desc)
    this.pFlav = el('div', 'ts-flav');
    this.pSteps = el('ol', 'ts-steps');
    this.pMeta = el('div', 'ts-meta');
    this.pCost = el('div', 'ts-cost');
    const actions = el('div', 'ts-actions');
    this.buyBtn = btn('ts-primary', 'Light it');
    this.buyBtn.addEventListener('click', () => this.doBuy());
    this.pinBtn = btn('ts-btn', 'Pin goal');
    this.pinBtn.addEventListener('click', () => this.togglePin());
    this.almBtn = btn('ts-btn ts-almbtn', 'Open the Almanac'); // CX3: the Almanac cluster's lanterns link to the book (same kill counts)
    this.almBtn.hidden = true;
    this.almBtn.addEventListener('click', () => { if (this.host.showAlmanac) this.host.showAlmanac('tree', 'foes'); });
    this.moreBtn = btn('ts-btn ts-more', null, 'More about this lantern');
    this.moreBtn.setAttribute('aria-expanded', 'false');
    this.moreBtn.append(glyph(ICON_MORE));
    this.moreBtn.addEventListener('click', () => this.setExpanded(!this.panelEl.classList.contains('exp')));
    actions.append(this.buyBtn, this.pinBtn, this.moreBtn, this.almBtn);
    this.pMsg = el('div', 'ts-msg');
    this.pMsg.setAttribute('role', 'status');
    detail.append(this.pKick, this.pName, this.pState, this.pWhy, this.pEvo, this.pDesc, this.pFlav, this.pSteps, this.pMeta, this.pCost, this.pMsg, actions);
    this.detailEl = detail;
    const goalPane = el('div', 'ts-goalpane');
    this.goalList = el('div', 'ts-goallist');
    goalPane.append(this.goalList, el('div', 'ts-meta', `Pin up to ${MAX_PINS} goals from any lantern. Suggestions fill the rest: the best buy first, then what is closest to waking.`));
    this.goalPane = goalPane;
    panel.append(handle, tabs, closeB, detail, goalPane);
    this.panelEl = panel;

    // calm Next-step bar
    const step = el('div', 'ts-step');
    step.setAttribute('role', 'status');
    this.stepText = el('div', 'ts-steptext');
    this.stepBtn = btn('ts-btn', 'Show me');
    this.stepBtn.addEventListener('click', () => { const s = this.stepNow; if (!s) return; if (this.host.sound) this.host.sound('ui_step'); if (s.goals) this.toggleGoals(true); else if (s.id) this.select(s.id, true); });
    step.append(this.stepText, this.stepBtn);
    this.stepEl = step;

    // off-screen arrow toward the best-next lantern
    this.edge = btn('ts-edge', null, 'Go to the best next lantern');
    this.edgeArrow = el('i', null, '➤');
    this.edgeArrow.setAttribute('aria-hidden', 'true');
    this.edge.append(this.edgeArrow, el('span', null, 'Best next'));
    this.edge.addEventListener('click', () => { if (this.model.best) this.select(this.model.best.id, true); });

    const zoom = el('div', 'ts-zoom ts-rail');
    zoom.setAttribute('role', 'toolbar');
    zoom.setAttribute('aria-label', 'Lantern Web tools');
    const zin = btn('ts-btn ts-round ts-zx', '+', 'Zoom in');
    const zout = btn('ts-btn ts-round ts-zx', '−', 'Zoom out');
    const zhome = btn('ts-btn ts-round', null, 'Whole web');
    zhome.append(glyph(ICON_WEB));
    zin.addEventListener('click', () => this.zoomAt(this.W / 2, this.H / 2, 1.4));
    zout.addEventListener('click', () => this.zoomAt(this.W / 2, this.H / 2, 1 / 1.4));
    zhome.addEventListener('click', () => this.home());
    zoom.append(this.nextBtn, zin, zout, zhome, idx, help);
    this.zoomEl = zoom;

    // sheets: index + help/legend
    this.scrim = el('div', 'ts-scrim');
    this.scrim.addEventListener('click', () => this.closeSheets());
    const idxSheet = el('section', 'ts-sheet');
    idxSheet.setAttribute('role', 'dialog');
    idxSheet.setAttribute('aria-label', 'Spirits and groups');
    this.idxList = el('div');
    idxSheet.append(el('h3', 'ts-h3', 'Spirits and groups'), this.idxList, this.sheetClose());
    const helpSheet = el('section', 'ts-sheet');
    helpSheet.setAttribute('role', 'dialog');
    helpSheet.setAttribute('aria-label', 'What the lanterns mean');
    this.legendEl = el('div', 'ts-legend');
    const row = el('div', 'ts-row');
    this.onlyBtn = btn('ts-btn', 'Show only what I can light');
    this.onlyBtn.setAttribute('aria-pressed', 'false');
    this.onlyBtn.addEventListener('click', () => { this.onlyLight = !this.onlyLight; this.onlyBtn.classList.toggle('on', this.onlyLight); this.onlyBtn.setAttribute('aria-pressed', String(this.onlyLight)); this.dirty(); });
    const tipB = btn('ts-btn', 'Show the tip again');
    tipB.addEventListener('click', () => { this.closeSheets(); this.showTip(true); });
    this.respecBtn = btn('ts-btn', 'Refund my lanterns (free)');
    this.respecBtn.addEventListener('click', () => this.onRespec());
    row.append(this.onlyBtn, tipB, this.respecBtn);
    this.helpMsg = el('div', 'ts-meta');
    this.helpMsg.setAttribute('role', 'status');
    helpSheet.append(el('h3', 'ts-h3', 'What the lanterns mean'), this.legendEl, row, this.helpMsg, this.sheetClose());
    this.sheets = { idx: idxSheet, help: helpSheet };

    // first-visit tip (fades), toast, screen-reader line
    const tip = el('div', 'ts-tip');
    tip.setAttribute('role', 'dialog');
    tip.setAttribute('aria-label', 'Tip');
    this.tipH = el('div', 'ts-tiph');
    this.tipP = el('div', 'ts-tipp');
    const ok = btn('ts-btn', 'Got it');
    ok.addEventListener('click', () => this.dismissTip());
    const tr = el('div', 'ts-row ts-end');
    tr.append(ok);
    tip.append(this.tipH, this.tipP, tr);
    this.tipEl = tip;
    this.toastEl = el('div', 'ts-toast');
    this.toastEl.setAttribute('role', 'status');
    this.srEl = el('div', 'ts-sr');
    this.srEl.setAttribute('aria-live', 'polite');

    root.append(map, panel, step, this.edge, zoom, this.scrim, idxSheet, helpSheet, tip, this.toastEl, this.srEl);
    layer.append(root);
    this.bindInput(map);
  }

  sheetClose() {
    const r = el('div', 'ts-row ts-end');
    const b = btn('ts-btn', 'Close');
    b.addEventListener('click', () => this.closeSheets());
    r.append(b);
    return r;
  }

  // ------------------------------------------------------------------ state
  recompute() {
    const s = this.api.save();
    this.model.recompute(s, this.pins);
    this.mapEl.style.background = this.skyFor(this.model.progress);
    this.updateAll();
  }

  updateAll() {
    const s = this.api.save();
    this.goldEl.v.textContent = fmtN(s.gold);
    this.shardEl.v.textContent = fmtN(s.shards);
    this.glassEl.v.textContent = fmtN(s.dawnglass || 0);
    this.glassEl.p.style.display = (s.dawnglass || 0) > 0 ? '' : 'none';
    const a = this.model.readyList().length;
    this.lightN.textContent = String(a);
    this.lightN.classList.toggle('zero', !a);
    this.nextBtn.setAttribute('aria-label', `${a} lantern${a === 1 ? '' : 's'} you can light now. Show the best one`);
    this.respecBtn.disabled = !Object.keys(s.tree || {}).some((id) => this.def.nodes[id] && !this.def.nodes[id].permanent);
    this.renderGoals();
    this.renderStep();
    if (this.selected) this.renderPanel();
    this.itemSig = '';
    this.dirty();
  }

  // ------------------------------------------------------------------ camera
  resize() {
    if (!this.open_) return;
    const r = this.root.getBoundingClientRect();
    this.W = Math.max(1, r.width);
    this.H = Math.max(1, r.height);
    this.root.classList.toggle('ts-port', this.W <= 600 && this.H > this.W);
    this.small = this.W <= 640 || this.H <= 520;
    this.root.classList.toggle('ts-small', this.small);
    this.root.classList.toggle('ts-short', this.H <= 520 && this.W > this.H && this.W <= 1000); // phone-landscape sized only: a wide short desktop window keeps the roomy layout
    this.DPR = Math.min(this.def.list.length > 400 ? 1.5 : 2, window.devicePixelRatio || 1); // big webs: fewer canvas pixels on phones
    this.canvas.width = Math.round(this.W * this.DPR);
    this.canvas.height = Math.round(this.H * this.DPR);
    this.camSig = '';
    this.fr = null;
    this.dirty();
  }

  toS(x, y) { const c = this.cam; return [(x - c.x) * c.z + this.W / 2, (y - c.y) * c.z + this.H / 2]; }
  toW(sx, sy) { const c = this.cam; return [(sx - this.W / 2) / c.z + c.x, (sy - this.H / 2) / c.z + c.y]; }
  clampZ(z) { return clamp(z, 0.03, 2.6); }
  limit() { const R = this.view.webR + 400; this.cam.x = clamp(this.cam.x, -R, R); this.cam.y = clamp(this.cam.y, -R, R); }
  rel(e) { const r = this.root.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  box(elm) {
    if (!elm || getComputedStyle(elm).display === 'none') return null;
    const r = elm.getBoundingClientRect(); const o = this.root.getBoundingClientRect();
    return { left: r.left - o.left, top: r.top - o.top, right: r.right - o.left, bottom: r.bottom - o.top, width: r.width, height: r.height };
  }

  // the part of the screen the map really has (not under the toolbar, panel or step bar)
  freeRect() {
    if (this.fr) return this.fr; // cached: reading layout every frame would force a reflow (cleared when the panel, bar or size change)
    let x0 = 0, x1 = this.W, y1 = this.H;
    const b = this.box(this.barEl);
    const y0 = b ? b.bottom : 0;
    const p = this.panelEl.classList.contains('open') ? this.box(this.panelEl) : null;
    if (p) { if (p.width > this.W * 0.8) y1 = Math.min(y1, p.top); else if (p.left > this.W / 2) x1 = Math.min(x1, p.left); else x0 = Math.max(x0, p.right); }
    const s = this.box(this.stepEl);
    if (s) y1 = Math.min(y1, s.top);
    this.fr = [x0, y0, x1, y1];
    return this.fr;
  }

  flyTo(x, y, z) {
    const [x0, y0, x1, y1] = this.freeRect();
    const fx = (x0 + x1) / 2, fy = (y0 + y1) / 2;
    const tz = this.clampZ(z == null ? this.cam.z : z);
    const tx = x - (fx - this.W / 2) / tz, ty = y - (fy - this.H / 2) / tz;
    if (this.reduced) { Object.assign(this.cam, { x: tx, y: ty, z: tz }); this.fly = null; this.dirty(); return; }
    this.fly = { t0: performance.now(), from: { ...this.cam }, to: { x: tx, y: ty, z: tz } };
    this.dirty();
  }

  fitBox(b, pad = 1.08, zmax = 1.4) {
    const [x0, y0, x1, y1] = this.freeRect();
    const z = Math.min(zmax, Math.min((x1 - x0) / ((b[2] - b[0]) * pad), (y1 - y0) / ((b[3] - b[1]) * pad)));
    this.flyTo((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, z);
  }

  home() { this.select(null); const r = this.view.webR; this.fitBox([-r, -r, r, r], 1.02, 2); }

  focusStart() {
    const [x0, y0, x1, y1] = this.freeRect();
    const best = this.model.best;
    const c = this.cam;
    if (best) {
      const n = this.def.nodes[best.id];
      c.z = Math.max(0.55, Math.min(x1 - x0, y1 - y0) / 900);
      c.x = n.x - ((x0 + x1) / 2 - this.W / 2) / c.z;
      c.y = n.y - ((y0 + y1) / 2 - this.H / 2) / c.z;
    } else {
      c.z = Math.min(x1 - x0, y1 - y0) / 1100;
      c.x = -((x0 + x1) / 2 - this.W / 2) / c.z;
      c.y = -((y0 + y1) / 2 - this.H / 2) / c.z;
    }
    this.dirty();
  }

  zoomAt(sx, sy, f) {
    const [wx, wy] = this.toW(sx, sy);
    this.fly = null;
    this.cam.z = this.clampZ(this.cam.z * f);
    this.cam.x = wx - (sx - this.W / 2) / this.cam.z;
    this.cam.y = wy - (sy - this.H / 2) / this.cam.z;
    this.limit();
    this.dirty();
  }

  pan(dx, dy) { this.fly = null; this.cam.x += dx; this.cam.y += dy; this.limit(); this.dirty(); }

  // ------------------------------------------------------------------ frame loop
  dirty() { if (!this.raf && this.open_) this.raf = requestAnimationFrame((t) => this.frame(t)); }

  frame(t) {
    this.raf = 0;
    if (!this.open_) return;
    const f = this.fly;
    if (f) {
      const k = Math.min(1, (t - f.t0) / 420);
      const e = 1 - Math.pow(1 - k, 3);
      this.cam.x = f.from.x + (f.to.x - f.from.x) * e;
      this.cam.y = f.from.y + (f.to.y - f.from.y) * e;
      this.cam.z = Math.exp(Math.log(f.from.z) + (Math.log(f.to.z) - Math.log(f.from.z)) * e);
      if (k >= 1) this.fly = null;
    }
    this.animNeeded = false;
    this.draw(t);
    // the focus buttons follow the map only when it settles (no 120 DOM writes per frame while dragging or flying)
    const sig = `${this.cam.x},${this.cam.y},${this.cam.z},${this.W},${this.H}`;
    if (sig !== this.moveSig) {
      this.moveSig = sig;
      if (this.items.size) this.itemsEl.style.opacity = '0';
      clearTimeout(this.itemT);
      this.itemT = setTimeout(() => { if (!this.open_) return; this.itemsEl.style.opacity = ''; this.syncItems(); }, 160);
    } else this.syncItems();
    this.placeEdge();
    const visible = document.visibilityState !== 'hidden';
    if (this.fly || this.anims.length || (!this.reduced && visible && this.animNeeded)) this.raf = requestAnimationFrame((tt) => this.frame(tt));
  }

  lod() { const z = this.cam.z; const L = this.view.lod; return z < L.far ? 'far' : z < L.near ? 'mid' : 'near'; }
  colorOf(id) { const r = this.model.region(id); return r && r.kind === 'cluster' ? r.color : '#ffd9a0'; }
  radiusOf(n, lod) { return Math.max(lod === 'far' ? 2.2 : 4.5, (KIND_R[n.kind] || 8) * this.cam.z * 1.15); }

  draw(t) {
    const c = this.ctx;
    if (!c) return;
    const { W, H, cam } = this;
    const m = this.model;
    c.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
    const p = Math.min(1, m.progress + (1 - m.progress) * 0.25 * Math.max(0, Math.min(1, Number(this.api.bookFrac) || 0))); // CX6: the Almanac's book total adds a little light (never dims)
    const z = cam.z;
    const lod = this.lodNow = this.lod();
    // the plain dusk sky is the map element's CSS background (skyFor), so a frame only clears the canvas
    c.clearRect(0, 0, W, H);
    const pulse = this.reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t / 420);
    const [hx, hy] = this.toS(0, 0);
    const R = (240 + 260 * p) * z + 20;
    const pool = c.createRadialGradient(hx, hy, 0, hx, hy, R);
    const ga = this.small ? 0.6 : 1; // C3: the hub wash is calmer on small screens
    pool.addColorStop(0, `rgba(255,179,90,${(0.16 + 0.26 * p) * ga})`);
    pool.addColorStop(1, 'rgba(255,154,58,0)');
    c.fillStyle = pool;
    c.beginPath(); c.arc(hx, hy, R, 0, 7); c.fill();
    this.drawFarSlots(lod);
    this.drawRegions();
    const vx0 = cam.x - W / 2 / z - 80, vx1 = cam.x + W / 2 / z + 80, vy0 = cam.y - H / 2 / z - 80, vy1 = cam.y + H / 2 / z + 80;
    const inV = (n) => n.x >= vx0 && n.x <= vx1 && n.y >= vy0 && n.y <= vy1;
    this.drawLinks(lod, inV);
    if (this.selected) this.drawChain(this.selected);
    for (const r of this.view.regions) for (const s of r.display || []) { const [sx, sy] = this.toS(s.x, s.y); if (sx > -40 && sx < W + 40 && sy > -40 && sy < H + 40) this.seal(c, sx, sy, Math.max(lod === 'far' ? 2.5 : 6, 15 * z), 'gold'); }
    // lanterns (culled through the spatial index; at far zoom every lantern is a dot, batched into one path per colour, halos too)
    const labels = [];
    const best = m.best;
    const far = lod === 'far';
    const batches = new Map();
    const hw = W / 2, hh = H / 2, cx0 = cam.x, cy0 = cam.y;
    const selR = this.selected ? m.region(this.selected) : null; // C3: while a lantern is selected, other constellations step back
    const DIMA = [1, 0.2, 0.35, 0.55];
    const dot = (style, dim, x, y, r) => { const k = dim ? `D${dim}${style}` : style; let pa = batches.get(k); if (!pa) { pa = new Path2D(); batches.set(k, pa); } pa.moveTo(x + r, y); pa.arc(x, y, r, 0, 6.2832); };
    const ids = this.idsIn(vx0, vy0, vx1, vy1);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const n = this.def.nodes[id];
      const sx = (n.x - cx0) * z + hw, sy = (n.y - cy0) * z + hh;
      if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) continue;
      const ce = m.cache[id];
      const s = ce.s;
      if (s === 'fog' && lod !== 'near') continue;
      const dim = this.onlyLight && s !== 'ready' ? 1 : selR && s !== 'ready' && m.region(id) !== selR ? 2 : far && !this.selected && s === 'notyet' ? 3 : 0;
      if (far) {
        if (s === 'notyet') dot('rgba(150,160,190,.30)', dim, sx, sy, 1.4);
        else if (s === 'challenge') dot('#6fd3c5', dim, sx, sy, 2.4);
        else {
          const r = this.radiusOf(n, lod);
          if (s === 'lit') dot(n.kind === 'socket' ? '#ffcf5a' : this.colorOf(id), dim, sx, sy, r);
          else if (s === 'ready') { dot('rgba(255,179,90,.22)', false, sx, sy, r + 6 + 6 * pulse); dot('#fff6e0', false, sx, sy, r); this.animNeeded = true; }
          else if (s === 'open') dot('#d8b26a', dim, sx, sy, r * 0.8);
        }
        continue;
      }
      const r = this.radiusOf(n, lod);
      c.globalAlpha = DIMA[dim];
      if (s === 'ready') { this.affordMark(c, sx, sy, r, pulse, false, best && best.id === id); this.animNeeded = true; }
      this.nodeShape(c, n, sx, sy, r, s, ce, id, lod);
      if (ce.fresh) this.newFlag(c, sx, sy - r - 9);
      if (this.selected === id) { c.strokeStyle = '#6fd3c5'; c.lineWidth = 2; c.setLineDash([4, 3]); c.beginPath(); c.arc(sx, sy, r + 10, 0, 7); c.stroke(); c.setLineDash([]); }
      c.globalAlpha = 1;
      labels.push({ id, x: sx, y: sy, r, s });
    }
    if (far) {
      const halo = batches.get('rgba(255,179,90,.22)'); // halos first, under the dots
      if (halo) { c.fillStyle = 'rgba(255,179,90,.22)'; c.fill(halo); batches.delete('rgba(255,179,90,.22)'); }
      for (const [k, pa] of batches) { const d = k[0] === 'D'; c.globalAlpha = d ? DIMA[Number(k[1])] : 1; c.fillStyle = d ? k.slice(2) : k; c.fill(pa); }
      c.globalAlpha = 1;
      if (this.selected) { const n = this.def.nodes[this.selected]; const [sx, sy] = this.toS(n.x, n.y); c.strokeStyle = '#6fd3c5'; c.lineWidth = 2; c.beginPath(); c.arc(sx, sy, 8, 0, 7); c.stroke(); }
    }
    this.drawLabels(labels, lod);
    this.drawRegionNames(lod);
    // hub lantern: brightens with total progress
    const lr = Math.max(8, 26 * z);
    const hl = c.createRadialGradient(hx, hy - lr * 0.2, 0, hx, hy, lr * 1.8);
    hl.addColorStop(0, `rgba(255,244,208,${(0.6 + 0.4 * p) * (this.small ? 0.8 : 1)})`);
    hl.addColorStop(0.5, `rgba(255,199,102,${(0.35 + 0.5 * p) * ga})`);
    hl.addColorStop(1, 'rgba(255,154,46,0)');
    c.fillStyle = hl;
    c.beginPath(); c.arc(hx, hy, lr * 1.8, 0, 7); c.fill();
    c.strokeStyle = '#d8b26a'; c.lineWidth = Math.max(1.5, 3 * z);
    c.beginPath(); c.arc(hx, hy, lr * 0.75, 0, 7); c.stroke();
    if (lod === 'far') {
      const ty = hy + (this.view.nearHub - 10) * z;
      if (!this.lastRB.some((b) => b.x0 < hx + 90 && b.x1 > hx - 90 && b.y0 < ty + 16 && b.y1 > ty)) {
        c.font = `13px ${FONT_UI}`; c.fillStyle = 'rgba(255,217,160,.9)'; c.textAlign = 'center'; c.textBaseline = 'top';
        c.fillText(`The Hollow remembers: ${Math.round(p * 100)}%`, hx, ty);
      }
    }
    if (best) this.drawBestMarker(c, t, lod);
    const now = performance.now();
    this.anims = this.anims.filter((a) => now - a.t0 < 650);
    for (const a of this.anims) {
      const k = (now - a.t0) / 650; const [sx, sy] = this.toS(a.x, a.y);
      c.strokeStyle = `rgba(255,246,224,${1 - k})`; c.lineWidth = 3;
      c.beginPath(); c.arc(sx, sy, 10 + 50 * k, 0, 7); c.stroke();
    }
  }

  // ids whose grid cell touches the rectangle; when the view covers more cells than there are lanterns, just walk the list
  idsIn(x0, y0, x1, y1) {
    const C = this.def.cell;
    const a = Math.floor(x0 / C), b = Math.floor(x1 / C), cc = Math.floor(y0 / C), d = Math.floor(y1 / C);
    if ((b - a + 1) * (d - cc + 1) > this.def.list.length) return this.def.list;
    const out = [];
    for (let i = a; i <= b; i++) for (let j = cc; j <= d; j++) { const ids = this.def.cells.get(`${i},${j}`); if (ids) for (const id of ids) out.push(id); }
    return out;
  }

  // the plain dusk sky, warmer as the tree fills (The Hollow remembers): no guide rings, no grid
  skyFor(p) {
    const a = `rgb(${Math.round(18 + 14 * p)},${Math.round(24 + 10 * p)},${Math.round(38 + 4 * p)})`;
    const b = `rgb(${Math.round(8 + 6 * p)},${Math.round(11 + 5 * p)},${Math.round(19 + 3 * p)})`;
    return `radial-gradient(circle at 50% 50%, ${a} 0%, ${b} 75%)`;
  }

  *cellsIn(x0, y0, x1, y1) {
    const C = this.def.cell;
    const a = Math.floor(x0 / C), b = Math.floor(x1 / C), cc = Math.floor(y0 / C), d = Math.floor(y1 / C);
    for (let i = a; i <= b; i++) for (let j = cc; j <= d; j++) yield [i, j];
  }

  // reserved far slots: a soft mist with one "?" (more to find); at far zoom one line about the unreached bands
  drawFarSlots(lod) {
    const c = this.ctx; const z = this.cam.z;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const [x, y] of this.view.farFree) {
      const [sx, sy] = this.toS(x, y); const r = Math.max(16, 90 * z);
      if (sx < -r || sx > this.W + r || sy < -r || sy > this.H + r) continue;
      const m = c.createRadialGradient(sx, sy, 0, sx, sy, r);
      m.addColorStop(0, 'rgba(163,172,194,.10)'); m.addColorStop(1, 'rgba(163,172,194,0)');
      c.fillStyle = m; c.beginPath(); c.arc(sx, sy, r, 0, 7); c.fill();
      c.fillStyle = 'rgba(179,187,207,.55)'; c.font = `${Math.max(13, 34 * z)}px ${FONT_HEAD}`; c.fillText('?', sx, sy);
    }
    if (lod === 'far') {
      const [lx, ly] = this.toS(0, -this.view.beyondR);
      if (ly > 70 && ly < this.H - 20) { c.font = `14px ${FONT_UI}`; c.fillStyle = 'rgba(179,187,207,.85)'; c.fillText('Beyond: parts of the Hollow you have not reached', lx, ly); }
    }
  }

  // emblems: a soft watermark that fills with colour as lanterns are lit; the outline appears only when the constellation is complete
  drawRegions() {
    const c = this.ctx; const z = this.cam.z;
    for (const r of this.view.regions) {
      const [sx, sy] = this.toS(r.x, r.y);
      if (sx < -r.r * z * 2 || sx > this.W + r.r * z * 2 || sy < -r.r * z * 2 || sy > this.H + r.r * z * 2) continue;
      const frac = r.ids.length ? r.lit / r.ids.length : 0;
      const awake = this.model.awake(r);
      const path = this.paths.get(r.key);
      if (r.r * z < 14 && !r.done) continue; // an emblem smaller than a fingertip adds nothing the dots do not show
      if (path) {
        c.save(); c.translate(sx, sy); c.scale(z, z);
        c.fillStyle = r.done ? hexA(r.color, 0.30) : awake ? hexA(r.color, 0.05 + 0.16 * frac) : 'rgba(120,128,150,.06)';
        c.fill(path);
        if (r.done) { c.lineWidth = 2 / z; c.strokeStyle = hexA(r.color, 0.9); if (!this.reduced) { c.shadowColor = r.color; c.shadowBlur = 18; } c.stroke(path); c.shadowBlur = 0; }
        c.restore();
      } else if (r.kind === 'tool') {
        const RR = r.r * z; const m = c.createRadialGradient(sx, sy, 0, sx, sy, RR);
        m.addColorStop(0, `rgba(243,220,174,${0.04 + 0.08 * frac})`); m.addColorStop(1, 'rgba(243,220,174,0)');
        c.fillStyle = m; c.beginPath(); c.arc(sx, sy, RR, 0, 7); c.fill();
      }
    }
  }

  // LINKS: lit trails only between lit lanterns + a short fading spark from a lit lantern toward each open one (links work from either side);
  // lanterns around the hub get a ray from the hub; far links are never drawn (the dotted path shows them on select).
  drawLinks(lod, inV) {
    if (lod === 'far') return;
    const c = this.ctx; const z = this.cam.z; const m = this.model; const V = this.view;
    c.lineCap = 'round';
    const nearHub = (n) => Math.hypot(n.x, n.y) <= V.nearHub;
    const OPEN = { ready: 'rgba(255,246,224,.85)', open: 'rgba(216,178,106,.7)', challenge: 'rgba(111,211,197,.7)' };
    for (const e of this.def.edges) {
      const b = this.def.nodes[e.to];
      const sb = m.cache[e.to].s;
      let a, aLit, sa = null;
      if (e.from === 'hub') {
        const r = m.region(e.to);
        if (r && r.kind === 'cluster' && r.heartAt) { if (r.heart === e.to) continue; a = { x: r.heartAt[0], y: r.heartAt[1] }; aLit = m.awake(r); }
        else if (r && r.kind === 'tool') { a = { x: r.x, y: r.y }; aLit = true; }
        else if (nearHub(b)) continue; // hub rays below
        else continue;
      } else { a = this.def.nodes[e.from]; aLit = m.lit(e.from); sa = m.cache[e.from].s; }
      if (!inV(a) && !inV(b)) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) > V.linkFar) continue;
      if (e.from !== 'hub' && nearHub(a) && nearHub(b)) continue; // hub area: radial rays instead of criss-cross threads
      const [ax, ay] = this.toS(a.x, a.y), [bx, by] = this.toS(b.x, b.y);
      const bLit = m.lit(e.to);
      if (aLit && bLit) this.trail(c, ax, ay, bx, by, this.colorOf(e.to), z);
      else if (aLit && OPEN[sb]) this.spark(c, ax, ay, bx, by, OPEN[sb], z);
      else if (bLit && sa && OPEN[sa]) this.spark(c, bx, by, ax, ay, OPEN[sa], z);
    }
    const [hx, hy] = this.toS(0, 0);
    for (const r of V.regions) {
      if (r.kind !== 'rings') continue;
      for (const id of r.ids) {
        const n = this.def.nodes[id]; if (!nearHub(n)) continue;
        const s = m.cache[id].s; if (s !== 'lit' && s !== 'ready' && s !== 'open') continue;
        const [bx, by] = this.toS(n.x, n.y); const k = (30 * z) / Math.max(1, Math.hypot(bx - hx, by - hy));
        const ax = hx + (bx - hx) * k, ay = hy + (by - hy) * k;
        if (s === 'lit' || m.lit(id)) this.trail(c, ax, ay, bx, by, '#ffd9a0', z); else this.spark(c, ax, ay, bx, by, s === 'ready' ? 'rgba(255,246,224,.7)' : 'rgba(216,178,106,.55)', z);
      }
    }
  }

  curve(c, ax, ay, bx, by) { const mx = (ax + bx) / 2, my = (ay + by) / 2; const dx = bx - ax, dy = by - ay; c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx - dy * 0.12, my + dx * 0.12, bx, by); }
  trail(c, ax, ay, bx, by, col, z) {
    c.strokeStyle = hexA(col, 0.35); c.lineWidth = Math.max(3, 7 * z);
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
    c.strokeStyle = 'rgba(255,240,205,.92)'; c.lineWidth = Math.max(1.4, 2.2 * z); c.stroke();
  }
  spark(c, ax, ay, bx, by, col, z) { // a short lit stub that fades out: "the light reaches toward this one"
    const ex = ax + (bx - ax) * 0.62, ey = ay + (by - ay) * 0.62;
    const g = c.createLinearGradient(ax, ay, ex, ey); g.addColorStop(0, col); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
    c.strokeStyle = g; c.lineWidth = Math.max(1.4, 2 * z); c.beginPath(); c.moveTo(ax, ay); c.lineTo(ex, ey); c.stroke();
  }
  // on select: the route from what you own to this lantern as a dotted brass path, including far prerequisites
  drawChain(id) {
    const c = this.ctx; const seen = new Set(); const st = [id]; let k = 0;
    c.setLineDash([2, 5]); c.lineWidth = 2; c.strokeStyle = 'rgba(245,223,174,.85)';
    while (st.length && k++ < 40) {
      const x = st.pop(); if (seen.has(x)) continue; seen.add(x);
      const nx = this.def.nodes[x];
      const ps = [...(this.model.parents.get(x) || []), ...(nx.requiresAny || [])].filter((q) => q !== 'hub');
      if (!this.model.lit(x) && ps.some((q) => this.model.lit(q))) { // one lit neighbour is enough: show only that link
        const q = ps.find((y) => this.model.lit(y)); const a = this.def.nodes[q]; const [ax, ay] = this.toS(a.x, a.y), [bx, by] = this.toS(nx.x, nx.y); this.curve(c, ax, ay, bx, by); c.stroke(); continue;
      }
      for (const pid of ps) {
        const a = this.def.nodes[pid]; const [ax, ay] = this.toS(a.x, a.y), [bx, by] = this.toS(nx.x, nx.y);
        this.curve(c, ax, ay, bx, by); c.stroke();
        if (!this.model.lit(pid)) st.push(pid);
      }
    }
    c.setLineDash([]);
  }
  // CAN LIGHT NOW (locked): candle-white ring + 8 rays on every affordable lantern; the warm halo is for the ONE best-next lantern
  affordMark(c, x, y, r, pulse, far, isBest) {
    if (isBest || far) {
      const RR = r + (far ? 6 : 12); const h = c.createRadialGradient(x, y, r * 0.6, x, y, RR + 8 * pulse);
      h.addColorStop(0, 'rgba(255,179,90,.6)'); h.addColorStop(1, 'rgba(255,179,90,0)');
      c.fillStyle = h; c.beginPath(); c.arc(x, y, RR + 8 * pulse, 0, 7); c.fill();
    }
    if (far) return;
    c.strokeStyle = '#fff6e0'; c.lineWidth = 2;
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; const r0 = r + 4, r1 = r + 8 + 2 * pulse; c.beginPath(); c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); c.stroke(); }
  }
  newFlag(c, x, y) {
    c.font = `bold 11px ${FONT_UI}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#6fd3c5';
    c.beginPath(); c.moveTo(x - 17, y - 7); c.lineTo(x + 17, y - 7); c.lineTo(x + 12, y); c.lineTo(x + 17, y + 7); c.lineTo(x - 17, y + 7); c.closePath(); c.fill(); // a flag shape, not colour alone
    c.fillStyle = '#0c1220'; c.fillText('NEW', x - 2, y + 0.5);
  }
  seal(c, x, y, r, mode) {
    c.beginPath();
    for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; const rr = r * (i % 2 ? 0.9 : 1); c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath();
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r);
    if (mode === 'gold') { g.addColorStop(0, '#fff2b8'); g.addColorStop(0.55, '#ffcf5a'); g.addColorStop(1, '#b47c1e'); c.fillStyle = g; c.fill(); c.fillStyle = '#7a4f12'; this.star(c, x, y, r * 0.45, 5); c.fill(); }
    else { g.addColorStop(0, '#6e768b'); g.addColorStop(1, '#2e3342'); c.fillStyle = g; c.fill(); }
  }
  star(c, x, y, r, k) { c.beginPath(); for (let i = 0; i < k * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / k; const rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
  bodyPath(c, n, x, y, r) {
    c.beginPath();
    if (n.kind === 'mastery') this.star(c, x, y, r * 1.15, 5);
    else if (n.kind === 'key') { c.moveTo(x, y - r * 1.2); c.quadraticCurveTo(x + r, y - r * 0.1, x, y + r); c.quadraticCurveTo(x - r, y - r * 0.1, x, y - r * 1.2); }
    else if (n.kind === 'gate') { for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); }
    else c.arc(x, y, r, 0, 7);
  }
  progressArc(c, x, y, r, f) {
    c.strokeStyle = 'rgba(111,211,197,.22)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
    if (f > 0) { c.strokeStyle = '#6fd3c5'; c.lineWidth = 2.6; c.beginPath(); c.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); c.stroke(); }
  }
  // NODE SHAPES: the silhouette is the kind; the state is told by fill, ring, rays, progress arc and size (never colour alone)
  nodeShape(c, n, x, y, r, s, ce, id, lod) {
    const col = id ? this.colorOf(id) : '#ffd9a0'; const small = r < 8; // small lanterns: flat fill, no gradient (phone speed)
    if (s === 'fog') { this.bodyPath(c, n, x, y, r * 0.8); c.fillStyle = 'rgba(20,26,40,.6)'; c.fill(); c.fillStyle = 'rgba(179,187,207,.85)'; c.font = `${Math.max(11, r)}px ${FONT_HEAD}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', x, y + 1); return; }
    if (n.kind === 'socket') {
      if (s === 'lit') { this.seal(c, x, y, r, 'gold'); return; }
      this.seal(c, x, y, s === 'notyet' ? r * 0.75 : r, 'wax');
      if (s === 'notyet') return;
      if (s === 'challenge') { this.progressArc(c, x, y, r + 3, ce.frac); if (ce.d.masked && r > 8) { c.fillStyle = '#c8cee0'; c.font = `bold ${Math.max(10, r * 0.7)}px ${FONT_UI}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', x, y + 1); } }
      else { c.strokeStyle = s === 'ready' ? '#fff6e0' : '#d8b26a'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, r + 2, 0, 7); c.stroke(); }
      return;
    }
    if (s === 'lit') {
      this.bodyPath(c, n, x, y, r);
      if (small) c.fillStyle = col; else { const g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r * 1.2); g.addColorStop(0, '#fffaf0'); g.addColorStop(0.5, col); g.addColorStop(1, hexA(col, 0.7)); c.fillStyle = g; }
      if (!this.reduced && lod === 'near') { c.shadowColor = col; c.shadowBlur = 12; }
      c.fill(); c.shadowBlur = 0;
      c.strokeStyle = '#fff3dc'; c.lineWidth = 1.2; c.stroke();
      this.ranks(c, n, id, x, y, r);
      return;
    }
    if (s === 'challenge') { // connected, waiting on a condition: full size, teal progress ring (pinnable goal)
      this.bodyPath(c, n, x, y, r); c.fillStyle = '#16252c'; c.fill(); c.strokeStyle = 'rgba(111,211,197,.55)'; c.lineWidth = 1.2; c.stroke();
      this.progressArc(c, x, y, r + 3, ce.frac);
      if (n.kind === 'heart') { c.strokeStyle = hexA(col, 0.6); c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, r * 0.62, 0, 7); c.stroke(); }
      this.ranks(c, n, id, x, y, r);
      return;
    }
    if (s === 'notyet') { // a small quiet bead (no padlock)
      const rr = Math.max(3, r * 0.6);
      this.bodyPath(c, n, x, y, rr); c.fillStyle = '#1a2131'; c.fill(); c.strokeStyle = 'rgba(130,140,165,.6)'; c.lineWidth = 1; c.stroke();
      return;
    }
    // ready / open: dark glass body; ready = candle-white ring (+ rays drawn before), open = brass ring
    this.bodyPath(c, n, x, y, r);
    if (small) c.fillStyle = '#222b3e'; else { const g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r); g.addColorStop(0, '#3a4866'); g.addColorStop(1, '#141a28'); c.fillStyle = g; }
    c.fill();
    c.strokeStyle = s === 'ready' ? '#fff6e0' : '#d8b26a'; c.lineWidth = s === 'ready' ? 2.6 : 1.8; c.stroke();
    if (n.kind === 'heart') { c.strokeStyle = hexA(col, 0.7); c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, r * 0.62, 0, 7); c.stroke(); }
    this.ranks(c, n, id, x, y, r);
  }
  ranks(c, n, id, x, y, r) {
    if (!id || n.maxRank <= 1 || this.cam.z <= 0.5) return;
    const rk = this.model.rank(id);
    for (let i = 0; i < n.maxRank; i++) { const a = -Math.PI / 2 + (i - (n.maxRank - 1) / 2) * 0.5; c.fillStyle = i < rk ? '#fff3dc' : 'rgba(163,172,194,.5)'; c.beginPath(); c.arc(x + Math.cos(a) * (r + 5), y + Math.sin(a) * (r + 5), 2, 0, 7); c.fill(); }
  }
  // BEST NEXT: a lantern pin hovering over the one lantern we suggest
  pinShape(c, x, py) {
    c.fillStyle = '#fff6e0'; c.beginPath(); c.moveTo(x, py + 12); c.quadraticCurveTo(x - 10, py, x - 9, py - 6); c.arc(x, py - 6, 9, Math.PI, 0); c.quadraticCurveTo(x + 10, py, x, py + 12); c.fill();
    c.fillStyle = '#e3842a'; c.beginPath(); c.moveTo(x, py - 12); c.quadraticCurveTo(x + 5, py - 5, x, py - 1); c.quadraticCurveTo(x - 5, py - 5, x, py - 12); c.fill();
  }
  drawBestMarker(c, t, lod) {
    const n = this.def.nodes[this.model.best.id]; const [x, y] = this.toS(n.x, n.y);
    if (x < 0 || x > this.W || y < 0 || y > this.H) return;
    this.animNeeded = true;
    const r = this.radiusOf(n, lod);
    const bob = this.reduced ? 0 : Math.sin(t / 380) * 3;
    this.pinShape(c, x, y - r - 16 + bob);
  }

  // LABELS: far = no lantern names; mid = only the selected, best-next and can-light lanterns; near = all but not-yet beads;
  // a collision pass keeps names off other names and lanterns (64 px screen grid: linear cost at 1000+ nodes).
  drawLabels(list, lod) {
    if (lod === 'far') return;
    const c = this.ctx; const m = this.model; const best = m.best;
    let pick = lod === 'near' ? list.filter((L) => L.s !== 'notyet' || L.id === this.selected) : list.filter((L) => L.id === this.selected || (best && L.id === best.id) || L.s === 'ready');
    if (this.onlyLight) pick = pick.filter((L) => L.s === 'ready' || L.id === this.selected);
    const pri = (L) => (L.id === this.selected ? 0 : best && L.id === best.id ? 1 : L.s === 'ready' ? 2 : L.s === 'open' ? 3 : L.s === 'challenge' ? 4 : L.s === 'lit' ? 5 : 6);
    pick.sort((a, b) => pri(a) - pri(b));
    const G = new Map();
    const cells = (b) => { const o = []; for (let i = Math.floor(b.x0 / 64); i <= Math.floor(b.x1 / 64); i++) for (let j = Math.floor(b.y0 / 64); j <= Math.floor(b.y1 / 64); j++) o.push(`${i},${j}`); return o; };
    const addBox = (b) => { for (const k of cells(b)) { if (!G.has(k)) G.set(k, []); G.get(k).push(b); } };
    const hits = (bx, id) => cells(bx).some((k) => (G.get(k) || []).some((b) => b.id !== id && b.x0 < bx.x1 && b.x1 > bx.x0 && b.y0 < bx.y1 && b.y1 > bx.y0));
    for (const L of list) addBox({ x0: L.x - L.r - 3, x1: L.x + L.r + 3, y0: L.y - L.r - 3, y1: L.y + L.r + 3, id: L.id });
    c.font = `13px ${FONT_UI}`; c.textAlign = 'center'; c.textBaseline = 'top';
    for (const L of pick) {
      const txt = m.cache[L.id].d.name; const w = c.measureText(txt).width + 8;
      const y0 = L.y + L.r + (L.s === 'ready' ? 10 : 5);
      const bx = { x0: L.x - w / 2, x1: L.x + w / 2, y0, y1: y0 + 17 };
      if (hits(bx, L.id)) continue;
      addBox(bx);
      c.fillStyle = 'rgba(10,14,24,.78)'; c.fillRect(bx.x0, bx.y0, w, 17);
      c.fillStyle = L.s === 'ready' ? '#fff6e0' : L.s === 'lit' ? '#fff3dc' : L.s === 'open' ? '#f5dfae' : L.s === 'challenge' ? '#9fe6dc' : '#b3bbcf';
      c.fillText(txt, L.x, y0 + 1);
    }
  }
  drawRegionNames(lod) {
    const c = this.ctx; const z = this.cam.z; const m = this.model;
    const rboxes = this.lastRB = [];
    if (lod === 'near') return;
    c.textBaseline = 'middle';
    const byNear = [...this.view.regions].sort((a, b) => Math.hypot(a.x - this.cam.x, a.y - this.cam.y) - Math.hypot(b.x - this.cam.x, b.y - this.cam.y));
    for (const r of byNear) {
      if (r.kind === 'rings' || !r.ids.length) continue; // the hub needs no name: it is the lantern
      if (r.r * z < 26) continue; // too small on screen: no name, zoom in to read
      let [sx, sy] = this.toS(r.x, r.y - (r.kind === 'cluster' ? r.r + 26 : lod === 'far' ? r.r * 0.8 : 0));
      const [fx0, fy0, fx1, fy1] = this.freeRect();
      if (sx < fx0 || sx > fx1 || sy < fy0 || sy > fy1) continue; // only the constellations in view
      const fs = Math.max(11, Math.min(this.small ? 13 : 18, 70 * z));
      c.font = `${fs}px ${FONT_HEAD}`; c.textAlign = 'center';
      const name = r.done ? `${r.name} ✓` : r.name; const nw = c.measureText(name).width;
      const badge = r.light > 0; const bw = badge ? 24 : 0;
      sx = clamp(sx, fx0 + nw / 2 + 8, Math.max(fx0 + nw / 2 + 8, fx1 - nw / 2 - bw - 8 - (this.small ? 54 : 0))); // a name is never cut off by the edge or hidden under the tools
      sy = clamp(sy, fy0 + fs / 2 + 6, Math.max(fy0 + fs / 2 + 6, fy1 - fs / 2 - 6));
      const rb = { x0: sx - nw / 2 - 6, x1: sx + nw / 2 + 6 + bw, y0: sy - fs / 2 - 3, y1: sy + fs / 2 + 3 };
      if (rboxes.some((b) => b.x0 < rb.x1 && b.x1 > rb.x0 && b.y0 < rb.y1 && b.y1 > rb.y0)) continue;
      rboxes.push(rb);
      const awake = r.kind !== 'cluster' || m.awake(r);
      c.fillStyle = r.done ? '#ffe39a' : awake ? 'rgba(255,243,220,.95)' : 'rgba(179,187,207,.85)';
      c.fillText(name, sx, sy);
      if (badge) { const bx = sx + nw / 2 + 14; c.fillStyle = '#fff6e0'; c.beginPath(); c.arc(bx, sy, 10, 0, 7); c.fill(); c.fillStyle = '#3a2412'; c.font = `bold 12px ${FONT_UI}`; c.fillText(String(r.light), bx, sy + 1); }
    }
  }

  // ------------------------------------------------------------------ pooled focus list (keyboard + screen readers; at most 120 buttons)
  itemLabel(id) {
    const m = this.model; const ce = m.cache[id];
    const best = m.best && m.best.id === id ? ', best next' : '';
    return `${ce.d.name}, ${m.stateText(id)}${best}`;
  }

  syncItems() {
    const lod = this.lodNow || this.lod();
    const sig = `${this.cam.x.toFixed(1)},${this.cam.y.toFixed(1)},${this.cam.z.toFixed(4)},${this.W},${this.H},${this.selected},${this.itemSig}`;
    if (sig === this.camSig) return;
    this.camSig = sig;
    const vis = [];
    const [wx0, wy0] = this.toW(-20, -20), [wx1, wy1] = this.toW(this.W + 20, this.H + 20);
    for (const id of this.idsIn(wx0, wy0, wx1, wy1)) {
      const n = this.def.nodes[id];
      if (n.x < wx0 || n.x > wx1 || n.y < wy0 || n.y > wy1) continue;
      const [x, y] = this.toS(n.x, n.y);
      vis.push({ id, x, y, s: this.model.cache[id].s });
    }
    const pri = { ready: 0, challenge: 1, open: 2, lit: 3, notyet: 4, fog: 9 };
    let want = vis.filter((v) => v.s !== 'fog' && v.x > -20 && v.x < this.W + 20 && v.y > -20 && v.y < this.H + 20);
    if (want.length > MAX_ITEMS) want = want.sort((a, b) => (pri[a.s] - pri[b.s])).slice(0, MAX_ITEMS);
    const ids = new Set(want.map((v) => v.id));
    if (this.selected) ids.add(this.selected);
    const active = document.activeElement;
    for (const [id, b] of this.items) {
      if (!ids.has(id) && b !== active) { b.remove(); this.items.delete(id); this.pool.push(b); }
    }
    // stable reading order: top to bottom, left to right
    const order = [...ids].map((id) => { const n = this.def.nodes[id]; return { id, n }; }).sort((a, b) => (a.n.y - b.n.y) || (a.n.x - b.n.x));
    let tabbed = this.selected && ids.has(this.selected) ? this.selected : (this.model.best && ids.has(this.model.best.id) ? this.model.best.id : (order[0] && order[0].id));
    for (const { id, n } of order) {
      let b = this.items.get(id);
      if (!b) {
        b = this.pool.pop() || this.makeItem();
        b.dataset.id = id;
        b._lab = b._sel = null;
        this.items.set(id, b);
        this.itemsEl.append(b);
      }
      const [sx, sy] = this.toS(n.x, n.y);
      const r = Math.max(22, this.radiusOf(n, lod) + 4);
      const tr = `translate(${(sx - r).toFixed(1)}px,${(sy - r).toFixed(1)}px)`;
      if (b._tr !== tr) { b._tr = tr; b.style.transform = tr; }
      const sz = `${(r * 2).toFixed(0)}px`;
      if (b._sz !== sz) { b._sz = sz; b.style.width = b.style.height = sz; }
      const lab = this.itemLabel(id);
      if (b._lab !== lab) { b._lab = lab; b.setAttribute('aria-label', lab); }
      const sel = String(this.selected === id);
      if (b._sel !== sel) { b._sel = sel; b.setAttribute('aria-selected', sel); }
      const ti = id === tabbed ? 0 : -1;
      if (b.tabIndex !== ti) b.tabIndex = ti;
    }
    this.mapEl.tabIndex = this.items.size ? -1 : 0; // roving focus: Tab lands on one lantern; the map itself only when none is on screen
  }

  makeItem() {
    const b = el('button', 'ts-item');
    b.type = 'button';
    b.setAttribute('role', 'treeitem');
    b.addEventListener('focus', () => { const id = b.dataset.id; if (id && this.selected !== id && this.def.nodes[id]) this.select(id, 'keep'); });
    b.addEventListener('click', (e) => { e.preventDefault(); }); // clicks reach the map (canvas hit test); Enter/Space are handled in onKey
    return b;
  }

  focusItem(id) {
    this.camSig = '';
    this.syncItems();
    const b = this.items.get(id);
    if (b) b.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------------ edge arrow toward the best-next lantern when it is off screen
  placeEdge() {
    const edge = this.edge; const best = this.model.best;
    if (!best || this.selected || this.model.isNew()) { edge.classList.remove('show'); return; }
    const n = this.def.nodes[best.id]; const [x, y] = this.toS(n.x, n.y);
    const [x0, y0, x1, y1] = this.freeRect();
    if (x > x0 + 20 && x < x1 - 20 && y > y0 + 20 && y < y1 - 20) { edge.classList.remove('show'); return; }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; const dx = x - cx, dy = y - cy;
    const s = Math.min(Math.abs(((x1 - x0) / 2 - 70) / (dx || 1e-6)), Math.abs(((y1 - y0) / 2 - 30) / (dy || 1e-6)));
    edge.style.left = `${Math.round(cx + dx * s)}px`;
    edge.style.top = `${Math.round(cy + dy * s)}px`;
    this.edgeArrow.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    edge.classList.add('show');
  }

  // ------------------------------------------------------------------ panel + selection
  syncPanel() {
    const open = !!this.panelMode;
    this.panelEl.classList.toggle('open', open);
    this.root.classList.toggle('ts-sel', open);
    this.detailEl.style.display = this.panelMode === 'goals' ? 'none' : '';
    this.goalPane.style.display = this.panelMode === 'goals' ? '' : 'none';
    this.tabD.setAttribute('aria-selected', String(this.panelMode !== 'goals'));
    this.tabG.setAttribute('aria-selected', String(this.panelMode === 'goals'));
    this.tabD.disabled = !this.selected;
    this.panelEl.classList.toggle('goals', this.panelMode === 'goals');
    this.setExpanded(this.panelMode === 'goals'); // the goals list is a list: always the full sheet
    this.camSig = '';
    this.fr = null;
    this.dirty();
  }

  /** C3: the node sheet is a compact strip on small screens and opens to the full sheet (steps, why, flavour) here; desktop always shows the full docked card. */
  setExpanded(on) {
    if (!this.panelEl) return;
    this.panelEl.classList.toggle('exp', !!on);
    this.moreBtn.setAttribute('aria-expanded', String(!!on));
    this.moreBtn.setAttribute('aria-label', on ? 'Less about this lantern' : 'More about this lantern');
    this.moreBtn.classList.toggle('open', !!on);
    this.fr = null; this.camSig = '';
    this.dirty();
  }

  // fly: true = centre it, 'keep' = only if it is off the free part of the screen, false = stay
  select(id, fly = false) {
    const was = this.selected;
    this.selected = id && this.def.nodes[id] ? id : null;
    this.confirmT = 0;
    if (this.selected && this.selected !== was && this.panelEl) this.setExpanded(false); // a new lantern starts as the compact strip
    this.panelMode = this.selected ? 'detail' : this.panelMode === 'goals' ? 'goals' : null;
    this.syncPanel();
    if (this.selected) {
      const s = this.api.save();
      if (!(s.seen && s.seen[id]) && this.api.markSeen) this.api.markSeen(id);
      this.model.cache[id].fresh = false; // the NEW flag goes once you have looked at it
      this.renderPanel();
      this.pMsg.textContent = '';
      const n = this.def.nodes[id];
      if (fly === true) this.flyTo(n.x, n.y, Math.max(this.cam.z, 0.9));
      else if (fly === 'keep') {
        const [x, y] = this.toS(n.x, n.y); const [x0, y0, x1, y1] = this.freeRect();
        if (x < x0 + 30 || x > x1 - 30 || y < y0 + 30 || y > y1 - 30) this.flyTo(n.x, n.y, Math.max(this.cam.z, this.view.lod.far + 0.1));
      }
      this.srEl.textContent = `${this.itemLabel(id)}. ${this.model.cache[id].d.desc}`;
      this.dismissTip();
    }
    this.dirty();
  }

  renderPanel() {
    const id = this.selected; if (!id) return;
    const m = this.model; const n = this.def.nodes[id]; const ce = m.cache[id]; const d = ce.d; const s = ce.s;
    const r = m.region(id);
    this.pKick.textContent = `${KIND_LABEL[n.kind] || 'Lantern'}${r ? ` · ${r.name}` : ''}`;
    this.pName.textContent = d.name;
    this.pState.className = `ts-state ts-st-${s}`;
    this.pState.textContent = m.stateText(id);
    const isBest = m.best && m.best.id === id;
    this.pWhy.textContent = isBest ? `Best next: ${m.best.why}` : '';
    this.pWhy.style.display = isBest ? '' : 'none';
    this.pDesc.textContent = d.desc;
    const fxE = (n.effects || []).find((e) => e && e.unlock === 'evolution' && typeof e.id === 'string' && Object.hasOwn(this.data.evolutions || {}, e.id));
    const evoTxt = fxE && !d.masked ? String(this.data.evolutions[fxE.id].desc || '') : ''; // not while the lantern is still veiled
    this.pEvo.textContent = evoTxt; this.pEvo.style.display = evoTxt ? '' : 'none';
    this.pFlav.textContent = d.flavour || '';
    this.pFlav.style.display = d.flavour ? '' : 'none';
    this.pSteps.replaceChildren();
    m.steps(id).forEach((S, i) => {
      const li = el('li', S.done ? 'done' : '');
      li.append(el('b', null, S.done ? '✓' : String(i + 1)));
      const sp = el('span', null, S.t);
      if (S.done) sp.append(el('span', 'ts-sr', ' (done)'));
      if (S.bar != null) { const b = el('div', 'ts-bar2'); const ib = el('b'); ib.style.width = `${Math.round(S.bar * 100)}%`; b.append(ib); sp.append(b); }
      li.append(sp);
      this.pSteps.append(li);
    });
    const meta = [];
    const pace = s === 'challenge' ? m.paceHint(id) : '';
    if (pace) meta.push(pace);
    if (s !== 'lit' && s !== 'fog') { const pn = m.priceNote(id); if (pn) meta.push(pn); }
    if (n.permanent) meta.push('Permanent: kept when you refund.');
    const far = (m.parents.get(id) || []).filter((p) => p !== 'hub' && Math.hypot(this.def.nodes[p].x - n.x, this.def.nodes[p].y - n.y) > this.view.linkFar);
    if (far.length && s !== 'lit') meta.push(`Follows on from ${far.map((p) => m.nameOf(p)).join(', ')} (the dotted path shows the way).`);
    this.pMeta.textContent = meta.join(' ');
    this.pCost.replaceChildren();
    if (d.next && s !== 'lit' && s !== 'fog') {
      const sv = this.api.save();
      const add = (cls, val, have, label) => { const p = el('span', `ts-pill${have < val ? ' short' : ''}`); const i = el('i', cls); i.setAttribute('aria-hidden', 'true'); p.append(i, el('span', null, fmtN(val)), el('span', 'ts-sr', ` ${label}${have < val ? ', not enough yet' : ''}`)); this.pCost.append(p); };
      if (d.next.gold) add('ts-i-gold', d.next.gold, sv.gold || 0, 'gold');
      if (d.next.shards) add('ts-i-shard', d.next.shards, sv.shards || 0, 'soul shards');
      if (d.next.glass) add('ts-i-glass', d.next.glass, sv.dawnglass || 0, 'Dawnglass');
    }
    const verb = n.kind === 'heart' || n.kind === 'socket' || n.kind === 'gate' ? 'Wake it' : 'Light it';
    const b = this.buyBtn;
    b.disabled = s !== 'ready';
    b.classList.remove('confirm');
    b.textContent = s === 'lit' ? 'Lit' : s === 'ready' ? `${verb} · ${m.costText(id)}` : s === 'open' ? 'Not enough gold yet' : 'Not yet';
    this.pinBtn.textContent = this.pins.includes(id) ? 'Unpin' : 'Pin goal';
    if (this.almBtn) this.almBtn.hidden = !(this.host.handlers && this.host.handlers.almanacView && (id === 'br_almanac' || /^bs_/.test(id)));
    this.pinBtn.disabled = s === 'lit' || s === 'fog';
  }

  doBuy() {
    const id = this.selected;
    if (!id || this.model.cache[id].s !== 'ready') return;
    const now = performance.now();
    if (!this.confirmT || now - this.confirmT > 3000) {
      this.confirmT = now;
      this.buyBtn.classList.add('confirm');
      this.buyBtn.textContent = `Tap again to confirm · ${this.model.costText(id)}`;
      this.srEl.textContent = 'Press again to confirm.';
      return;
    }
    this.confirmT = 0;
    const before = new Map(this.view.regions.map((r) => [r.key, r.done]));
    const res = this.api.buy(id);
    if (!res || !res.ok) { this.pMsg.textContent = (res && res.reason) || 'Could not light it.'; this.renderPanel(); return; }
    const n = this.def.nodes[id];
    if (!this.reduced) this.anims.push({ x: n.x, y: n.y, t0: performance.now() });
    if (this.model.rank(id) >= n.maxRank && this.pins.includes(id)) { this.pins = this.pins.filter((p) => p !== id); store.set(PIN_KEY, this.pins); }
    const why = this.model.whyOf(id, 1);
    this.recompute();
    this.pMsg.textContent = `${n.name} is lit.`;
    let done = null;
    for (const r of this.view.regions) if (r.done && !before.get(r.key)) done = r;
    if (this.host.sound) this.host.sound(done ? 'tree_whole' : 'tree_light'); // AU6: a lantern catches / a constellation is whole
    // CX5 tree:wake: the full celebration on the same event (max 3 per visit; the sound above already played, so the cards carry no cue)
    const canCel = this.host.celebrate && (this.celN || 0) < 3;
    if (done) { if (canCel) { this.celN = (this.celN || 0) + 1; const wid = this.data.weapons && Object.hasOwn(this.data.weapons, done.key) ? done.key : null; this.host.celebrate([{ size: 'big', kind: 'whole', title: CEL.constWhole(done.name), line: wid ? CEL.wholeLine[wid] : '', pills: [], weapon: wid, color: done.color || '#ffd27a', cue: '', sr: CEL.constWhole(done.name) }], { after: () => this.mapEl && this.mapEl.focus({ preventScroll: true }) }); } else this.toast(`${done.name} is whole again`); }
    else if (n.kind === 'heart' || n.kind === 'socket' || n.kind === 'gate' || n.kind === 'key') {
      if (canCel && n.kind !== 'key') { this.celN = (this.celN || 0) + 1; this.host.celebrate([{ size: 'medium', kind: n.kind, title: this.model.nameOf(id), line: '', sub: why, weapon: null, cue: '', sr: `${this.model.nameOf(id)}: ${why}` }], { after: () => this.mapEl && this.mapEl.focus({ preventScroll: true }) }); }
      else this.toast(`${this.model.nameOf(id)}: ${why}`);
    }
    this.srEl.textContent = `${n.name} is lit.`;
  }

  togglePin() {
    const id = this.selected; if (!id) return;
    if (this.pins.includes(id)) this.pins = this.pins.filter((p) => p !== id);
    else { this.pins.push(id); if (this.pins.length > MAX_PINS) this.pins.shift(); }
    store.set(PIN_KEY, this.pins);
    this.recompute();
    this.srEl.textContent = this.pins.includes(id) ? 'Pinned as a goal.' : 'Unpinned.';
  }

  onRespec() {
    if (this.armed !== 'respec') {
      this.armed = 'respec';
      this.respecBtn.textContent = 'Refund all? Gates stay lit. Press again';
      clearTimeout(this.armT);
      this.armT = setTimeout(() => { this.armed = null; this.respecBtn.textContent = 'Refund my lanterns (free)'; }, 4000);
      return;
    }
    clearTimeout(this.armT);
    this.armed = null;
    this.respecBtn.textContent = 'Refund my lanterns (free)';
    const spent = this.api.respec();
    this.select(null);
    this.recompute();
    this.helpMsg.textContent = `Refunded ${fmtN(spent.gold)} gold and ${fmtN(spent.shards)} shards.${RESPEC_DONE_SUFFIX}`;
  }

  toast(msg) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('open');
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => this.toastEl.classList.remove('open'), 3200);
  }

  // ------------------------------------------------------------------ goals, step bar, tip, sheets
  goalButton(row) {
    const g = this.model.goalInfo(row);
    const b = btn('ts-goal');
    const top = el('div', 'ts-gt');
    top.append(el('span', null, g.name), el('span', `ts-tag${g.pin ? ' pin' : ''}`, g.pin ? '★ pinned' : g.gold ? 'gold' : 'by playing'));
    const bar = el('div', `ts-bar2${g.gold ? ' gold' : ''}`); const i = el('b'); i.style.width = `${Math.round(g.frac * 100)}%`; bar.append(i);
    b.append(top, el('div', 'ts-rw', g.reward), el('div', 'ts-gs', g.txt), bar);
    b.addEventListener('click', () => this.select(row.id, true));
    return b;
  }

  renderGoals() {
    const rows = this.model.goalRows();
    this.goalList.replaceChildren();
    if (!rows.length) this.goalList.append(el('div', 'ts-empty', this.model.isNew() ? 'Finish your first run to earn gold. Your goals will appear here.' : 'Everything in reach is lit. Play to wake more.'));
    for (const r of rows) this.goalList.append(this.goalButton(r));
  }

  toggleGoals(forceOpen) {
    if (this.panelMode === 'goals' && !forceOpen) this.panelMode = this.selected ? 'detail' : null;
    else this.panelMode = 'goals';
    this.syncPanel();
    this.renderGoals();
    if (this.panelMode === 'goals') this.tabG.focus({ preventScroll: true });
  }

  renderStep() {
    const s = this.stepNow = this.model.stepText();
    this.stepText.replaceChildren(el('b', null, s.h), el('small', null, s.s));
    this.stepBtn.style.display = s.id || s.goals ? '' : 'none';
    this.stepBtn.textContent = s.goals ? 'Goals' : 'Show me';
    this.fr = null;
  }

  showTip(force) {
    if (!force && store.get(TIP_KEY)) return;
    if (!force && this.small) return; // C3: one message at a time on small screens: the Next-step bar already says it
    const isNew = this.model.isNew();
    this.tipH.textContent = isNew ? 'Welcome to the Lantern Web' : 'The Lantern Web'; // FM3: copy aligned with the first-death lesson
    this.tipP.textContent = isNew
      ? 'Lanterns are lit with gold you bring back from runs. Finish your first run, then come back to light one.'
      : 'Light a lantern with gold. Bright ones are ready now; the pin shows the best next. The ? button explains every look.';
    this.tipEl.classList.remove('fade');
    this.tipEl.classList.add('open');
    clearTimeout(this.tipT);
    this.tipT = setTimeout(() => this.dismissTip(), 9000);
  }

  dismissTip() {
    const t = this.tipEl;
    if (!t || !t.classList.contains('open')) return;
    store.set(TIP_KEY, 1);
    clearTimeout(this.tipT);
    if (this.reduced) { t.classList.remove('open'); return; }
    t.classList.add('fade');
    this.tipT = setTimeout(() => t.classList.remove('open', 'fade'), 800);
  }

  // one-time notice after the save v3 'Regrowth' refund (skill-tree-v2.md 7b): shown once, then cleared
  regrowthNote() {
    const s = this.api.save();
    const g = s && s.notes && s.notes.regrowth;
    if (!g || !(g.nodes > 0)) return;
    this.toast(`The Lantern Web was rewoven: ${fmtN(g.nodes)} lanterns returned ${fmtN(g.gold)} gold${g.shards ? ` and ${fmtN(g.shards)} shards` : ''}.`);
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => this.toastEl.classList.remove('open'), 7000);
    if (this.api.clearRegrowth) this.api.clearRegrowth();
  }

  openSheet(which) {
    this.closeSheets();
    const sh = this.sheets[which];
    if (which === 'idx') this.renderIndex();
    if (which === 'help') this.renderLegend();
    sh.classList.add('open');
    this.scrim.classList.add('open');
    this.sheetOpen = which;
    this.dismissTip();
    const f = sh.querySelector('button');
    if (f) f.focus({ preventScroll: true });
  }

  closeSheets() {
    for (const s of Object.values(this.sheets)) s.classList.remove('open');
    this.scrim.classList.remove('open');
    if (this.sheetOpen) { this.sheetOpen = null; this.mapEl.focus({ preventScroll: true }); }
  }

  renderIndex() {
    this.idxList.replaceChildren();
    for (const r of this.model.regionOrder()) {
      const b = btn('ts-idx');
      const sw = el('span', 'ts-sw'); sw.style.background = r.kind === 'cluster' && !this.model.awake(r) ? '#59627a' : r.color;
      sw.setAttribute('aria-hidden', 'true');
      b.append(sw, el('span', 'ts-nm', r.done ? `${r.name} ✓` : r.name));
      if (r.light) { const bd = el('span', 'ts-badge', String(r.light)); bd.setAttribute('aria-label', `${r.light} can light`); b.append(bd); }
      b.append(el('span', 'ts-ct', `${r.lit}/${r.ids.length} lit`));
      b.addEventListener('click', () => { this.closeSheets(); this.select(null); this.fitBox(r.box, 1.15, 1.2); });
      this.idxList.append(b);
    }
  }

  renderLegend() {
    const L = this.legendEl; L.replaceChildren();
    const items = [
      ['ready', SAY.ready, 'Rays around it: you have the gold. Tap it, then Light it.'],
      ['open', SAY.open, 'A brass ring: open to you, but you need more gold (or shards).'],
      ['challenge', SAY.challenge, 'Next to your lanterns, but asks you to do something in a run first. The teal ring fills as you go. Pin it as a goal.'],
      ['notyet', SAY.notyet, 'A small quiet bead: light a lantern next to it first.'],
      ['lit', SAY.lit, 'Yours. It glows in its spirit\'s colour and lights the trail.'],
      ['best', 'Best next', 'The pin: the one we suggest lighting next.'],
    ];
    const proto = { kind: 'ring', maxRank: 1 };
    for (const [v, h, s] of items) {
      const cv = el('canvas'); cv.width = 88; cv.height = 88; cv.setAttribute('aria-hidden', 'true');
      const k = cv.getContext('2d');
      if (k) {
        k.scale(2, 2); k.fillStyle = '#0c1220'; k.fillRect(0, 0, 44, 44);
        const ce = { frac: 0.6, d: { masked: false } };
        if (v === 'best') { this.affordMark(k, 22, 28, 7, 0.5, false, true); this.nodeShape(k, proto, 22, 28, 7, 'ready', ce, null, 'near'); this.pinShape(k, 22, 13); }
        else { if (v === 'ready') this.affordMark(k, 22, 22, 8, 0.5, false, false); this.nodeShape(k, proto, 22, 22, 8, v, ce, null, 'near'); }
      }
      const t = el('div', null, h); t.append(el('small', null, s));
      L.append(cv, t);
    }
  }

  nextAfford() {
    const best = this.model.best;
    if (!best) { this.toast('Nothing to light yet. Your goals show what is closest.'); return; }
    this.select(best.id, true);
    this.focusItem(best.id);
  }

  // ------------------------------------------------------------------ input
  bindInput(map) {
    map.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button > 0) return;
      try { map.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
      const [x, y] = this.rel(e);
      this.ptrs.set(e.pointerId, { x, y });
      this.fly = null;
      if (this.ptrs.size === 1) this.drag = { x, y, cx: this.cam.x, cy: this.cam.y, t: performance.now(), moved: false };
      if (this.ptrs.size === 2) { const [a, b] = [...this.ptrs.values()]; this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.cam.z, w: this.toW((a.x + b.x) / 2, (a.y + b.y) / 2) }; this.drag = null; }
    });
    map.addEventListener('pointermove', (e) => {
      if (!this.ptrs.has(e.pointerId)) return;
      const [x, y] = this.rel(e);
      this.ptrs.set(e.pointerId, { x, y });
      if (this.pinch && this.ptrs.size >= 2) {
        const [a, b] = [...this.ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
        this.cam.z = this.clampZ(this.pinch.z * d / Math.max(1, this.pinch.d));
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        this.cam.x = this.pinch.w[0] - (mx - this.W / 2) / this.cam.z; this.cam.y = this.pinch.w[1] - (my - this.H / 2) / this.cam.z;
        this.limit(); this.dirty(); return;
      }
      const dr = this.drag;
      if (dr) {
        const dx = x - dr.x, dy = y - dr.y;
        if (!dr.moved && Math.hypot(dx, dy) > 8) { dr.moved = true; this.root.classList.add('ts-pan'); this.fr = null; }
        if (dr.moved) { this.cam.x = dr.cx - dx / this.cam.z; this.cam.y = dr.cy - dy / this.cam.z; this.limit(); this.dirty(); }
      }
    });
    const up = (e) => {
      if (!this.ptrs.has(e.pointerId)) return;
      this.ptrs.delete(e.pointerId);
      const [x, y] = this.rel(e);
      if (e.type === 'pointerup' && this.drag && !this.drag.moved && performance.now() - this.drag.t < 500) this.tap(x, y);
      if (this.ptrs.size < 2) this.pinch = null;
      if (!this.ptrs.size) { this.drag = null; if (this.root.classList.contains('ts-pan')) { this.root.classList.remove('ts-pan'); this.fr = null; } }
    };
    map.addEventListener('pointerup', up);
    map.addEventListener('pointercancel', up);
    map.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = this.rel(e); this.zoomAt(x, y, Math.exp(-clamp(e.deltaY, -300, 300) * 0.0015)); }, { passive: false });
  }

  hitNode(sx, sy) {
    const [wx, wy] = this.toW(sx, sy);
    const reach = 60 / this.cam.z;
    let bestId = null, bd = Infinity;
    for (const [cx, cy] of this.cellsIn(wx - reach, wy - reach, wx + reach, wy + reach)) {
      for (const id of this.def.cells.get(`${cx},${cy}`) || []) {
        const n = this.def.nodes[id]; const d = Math.hypot(n.x - wx, n.y - wy) * this.cam.z;
        if (d < bd) { bd = d; bestId = id; }
      }
    }
    if (!bestId) return null;
    const hit = Math.max(22, (KIND_R[this.def.nodes[bestId].kind] || 8) * this.cam.z * 1.3); // 44 px touch target at least
    return bd <= hit ? bestId : null;
  }

  tap(sx, sy) {
    const now = performance.now();
    this.dismissTip();
    const [wx, wy] = this.toW(sx, sy);
    if (this.cam.z < this.view.lod.far) { // far: tap a group to fly into it
      let br = null, bd = Infinity;
      for (const r of this.view.regions) { if (!r.ids.length) continue; const d = Math.hypot(r.x - wx, r.y - wy); if (d < r.r * 1.3 && d < bd) { bd = d; br = r; } }
      if (br) { this.select(null); this.fitBox(br.box, 1.15, 1.2); return; }
    }
    // two lanterns inside one finger: zoom in on them instead of guessing (review finding 10)
    const near = [];
    const reach = 22 / this.cam.z;
    for (const [cx, cy] of this.cellsIn(wx - reach, wy - reach, wx + reach, wy + reach)) for (const id of this.def.cells.get(`${cx},${cy}`) || []) { const n = this.def.nodes[id]; if (Math.hypot(n.x - wx, n.y - wy) * this.cam.z <= 22) near.push(id); }
    if (near.length >= 2 && this.cam.z < 1.2) { const n0 = this.def.nodes[near[0]], n1 = this.def.nodes[near[1]]; if (Math.hypot(n0.x - n1.x, n0.y - n1.y) * this.cam.z < 26) { this.flyTo(wx, wy, Math.min(2.2, this.cam.z * 2)); return; } }
    const id = this.hitNode(sx, sy);
    if (id) this.select(id, false);
    else if (now - this.lastTap < 300) this.zoomAt(sx, sy, 1.8);
    else { this.select(null); this.panelMode = null; this.syncPanel(); } // tap on empty map closes the side panel (Goals too)
    this.lastTap = now;
  }

  // arrow keys on a focused lantern: move to the nearest lantern in that direction
  moveFocus(dx, dy) {
    const cur = this.def.nodes[this.selected];
    let bestId = null, bs = Infinity;
    for (const id of this.def.list) {
      if (id === this.selected) continue;
      const ce = this.model.cache[id]; if (ce.s === 'fog') continue;
      const n = this.def.nodes[id]; const vx = n.x - cur.x, vy = n.y - cur.y;
      const along = vx * dx + vy * dy; if (along <= 1) continue;
      const side = Math.abs(vx * dy - vy * dx);
      const score = along + side * 2.5;
      if (score < bs) { bs = score; bestId = id; }
    }
    if (bestId) { this.select(bestId, 'keep'); this.focusItem(bestId); }
  }

  onKey(e) {
    if (!this.open_) return;
    if (this.host.codexView || (this.host.celActive && this.host.celActive())) return; // CX3/CX5: the Almanac / a celebration is over the web
    const k = e.key;
    if (k === 'Escape') {
      e.preventDefault();
      this.host.escAt = performance.now();
      if (this.sheetOpen) { this.closeSheets(); return; }
      if (this.armed) { this.armed = null; this.respecBtn.textContent = 'Refund my lanterns (free)'; return; }
      if (this.selected || this.panelMode) { const was = this.selected; this.select(null); this.panelMode = null; this.syncPanel(); if (was) this.mapEl.focus({ preventScroll: true }); return; }
      this.close();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    const onItem = t && t.classList && t.classList.contains('ts-item');
    const onCtl = t && t.closest && t.closest('button, [role="tab"]') && !onItem;
    if (this.sheetOpen) return; // sheets: normal button keys only
    const step = 80 / this.cam.z;
    const arrow = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
    const wasd = { a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1] }[k.toLowerCase ? k.toLowerCase() : k];
    if (arrow && onItem && this.selected) { e.preventDefault(); this.moveFocus(arrow[0], arrow[1]); return; }
    if (arrow && !onCtl) { e.preventDefault(); this.pan(arrow[0] * step, arrow[1] * step); return; }
    if (wasd && k.length === 1) { e.preventDefault(); this.pan(wasd[0] * step, wasd[1] * step); return; }
    if (k === '+' || k === '=') { e.preventDefault(); this.zoomAt(this.W / 2, this.H / 2, 1.3); return; }
    if (k === '-' || k === '_') { e.preventDefault(); this.zoomAt(this.W / 2, this.H / 2, 1 / 1.3); return; }
    if (k === 'Home' || k === '0') { e.preventDefault(); this.home(); return; }
    if (k === 'n' || k === 'N') { e.preventDefault(); this.nextAfford(); return; }
    if (k === 'g' || k === 'G') { e.preventDefault(); this.toggleGoals(); return; }
    if (k === '?' || k === '/') { e.preventDefault(); this.openSheet('help'); return; }
    if ((k === 'Enter' || k === ' ') && onItem) { e.preventDefault(); if (this.selected && this.model.cache[this.selected].s === 'ready') this.doBuy(); else if (this.selected) { this.panelMode = 'detail'; this.syncPanel(); } return; }
    if (k === 'Enter' && this.selected && !onCtl) { e.preventDefault(); this.doBuy(); }
  }
}
