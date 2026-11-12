// Skill tree screen, T4 (LOCKED look 'A Lantern Trails', docs/mockups/tree-screen-v2/option-a.html, docs/design/tree-screen-review.md).
// One canvas draws the web (plain sky warming as the tree fills, trails only between lit lanterns, a spark toward each open lantern,
// constellation outline when complete, five lantern states, one best-next pin). DOM on top: toolbar, detail/goals panel (side panel,
// bottom sheet on phone portrait), calm Next-step bar, legend, index, first-visit tip, and a pooled, hidden-looking focus list of
// lantern buttons (role tree, at most 120 at once) for keyboard and screen readers.
// Rules: the screen reads ONLY the compiled tree + view regions + the real tree rules (no weapon/hero/chapter id here; grep test);
// every string from data goes through textContent / setAttribute, never innerHTML.
import { TreeModel, SAY, KIND_LABEL, sanitizePins, fmtN, MAX_PINS } from './treemodel.js';
import { computeTierSizes, screenDiameter, tierShown, TIER_SIZE } from '../meta/treetier.js';
import { TreeBackdrop, ringProgress, LOOK } from '../gfx/treebg.js';
import { MedallionAtlas, emblemFor, safeTint, mix } from '../gfx/medallions.js';
import { probe } from '../gfx/probe.js';
import { TOUR } from './whispers.js';
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
const idHash = (id) => { let h = 2166136261; const t = String(id); for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }; // stable 0..1 per lantern id
const hubFade = (A, B) => { const d = Math.min(Math.hypot(A.x, A.y), Math.hypot(B.x, B.y)); return clamp((d - 350) / 600, 0.05, 1); }; // threads near the hub run almost straight (they fan out), bows grow with distance
const lodFar = (z, L) => clamp(0.78 + (z - L.far) / 0.5, 0.78, 1); // label size factor: 0.78 at the FAR limit and below, 1 from about 0.31 up

// DESKTOP D3: the tree's keys, shown as a quiet hint strip while the keyboard was the last input (these keys are fixed in onKey)
const TREE_KEYS = [['Arrows', 'pan'], ['+ -', 'zoom'], ['N', 'next lantern'], ['G', 'goals'], ['Enter', 'light'], ['Esc', 'back']];
export class TreeScreen {
  // host: UI instance (layer/show/hide). api: app.treeApi() = { def, data, view, save(), buy(id), respec(), markSeen(id), onClose(), clearRegrowth?() }.
  // portraitOf(heroId, redraw): a loaded hero portrait image (built into the bundle, loaded by ui.js) or null; only used for the hub medallion,
  // an unknown hero falls back to a drawn head. The screen never builds an image path itself.
  constructor(host, portraitOf, enemyPortrait) {
    this.host = host;
    this.enemyPortrait = typeof enemyPortrait === 'function' ? enemyPortrait : () => null; // a foe's code-drawn portrait url (ui.js), never built from tree strings
    this.portraitOf = typeof portraitOf === 'function' ? portraitOf : () => null;
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
    this.hoverFocus = null; this.focus = null; this.threads = []; this.adj = new Map(); this.veil = new Set(); this.fogs = []; this.unfurl = new Map(); this.sealPrev = null; this.forkSeal = new Map(); this.chipBoxes = [];
    this.buildThreads(); // the geometry of the web, once (states are read per frame)
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
    this.tiers = computeTierSizes(this.def); // Q1a: node tier + medallion draw diameter (display only)
    this.bg = new TreeBackdrop((w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }); // baked once, see gfx/treebg.js
    this.atlas = new MedallionAtlas((w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }); // R2: medallion pictures, each baked once, max 4 per frame
    this.ringFrac = []; this.ringBloom = []; this.ringPrev = []; this.tints = []; this.lblSprites = new Map(); this.mwCache = new Map(); this.toolLm = null;
    this.perf = { n: 0, sum: 0, max: 0 };
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
    this.resetNotice();
    this.pulseStart(api.pulseIds);
    if (!this.tourStart() && !(this.pulseSet && this.pulseSet.size)) this.showTip(false); // coming back from a run: the moved lanterns are the message, no welcome card
    if (!this.tourOpen) this.mapEl.focus({ preventScroll: true }); // the tour's Next button keeps the focus while the tour is up (keyboard users press Enter)
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
    if (this.noticeShown) this.dismissNotice();
    if (this.tourOpen) this.tourEnd();
    clearTimeout(this.pulseT); this.pulseSet = new Set();
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
    this.pTile = el('div', 'ts-ctile'); this.pChips = el('div', 'ts-chips'); // condition tile + path chips (banner)
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
    detail.append(this.pKick, this.pName, this.pState, this.pChips, this.pWhy, this.pEvo, this.pDesc, this.pFlav, this.pTile, this.pSteps, this.pMeta, this.pCost, this.pMsg, actions);
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
    this.noticeEl = el('div', 'ts-notice'); // the one-time 'the web was rewoven' notice (S1 restart); filled by resetNotice()
    this.noticeEl.setAttribute('role', 'status');
    this.sumEl = el('div', 'ts-sr'); // the state of the web in one line for screen readers (re-read only when it changes)
    this.sumEl.setAttribute('role', 'status'); this.sumEl.setAttribute('aria-live', 'polite');
    this.srEl = el('div', 'ts-sr');
    this.srEl.setAttribute('aria-live', 'polite');

    // DESKTOP D3: mouse hover preview (name, state, one line) and a key hint strip; both are hidden on touch / phone screens by CSS
    this.hoverEl = el('div', 'ts-hover'); this.hoverEl.setAttribute('aria-hidden', 'true');
    this.hoverName = el('div', 'ts-hover__n'); this.hoverState = el('div', 'ts-hover__s'); this.hoverDesc = el('div', 'ts-hover__d');
    this.hoverEl.append(this.hoverName, this.hoverState, this.hoverDesc);
    const keys = el('div', 'ts-keyhint'); keys.setAttribute('aria-hidden', 'true');
    for (const [k, t] of TREE_KEYS) { const b = el('span', 'ts-keyhint__i'); b.append(el('kbd', null, k), document.createTextNode(` ${t}`)); keys.append(b); }
    this.tourEl = el('div', 'ts-tour'); // first-visit tour card (4 short steps)
    this.tourEl.setAttribute('role', 'dialog'); this.tourEl.setAttribute('aria-label', 'A quick tour of the Lantern Web');
    this.tourH = el('div', 'ts-tourh'); this.tourP = el('p', 'ts-tourp'); this.tourDots = el('span', 'ts-tourd');
    this.tourNext = btn('ts-primary ts-tournext', 'Next'); this.tourNext.addEventListener('click', () => { this.tourI++; this.tourStep(); });
    const tskip = btn('ts-btn ts-tourskip', 'Skip tour'); tskip.addEventListener('click', () => this.tourEnd());
    const trow = el('div', 'ts-tourrow'); trow.append(this.tourDots, tskip, this.tourNext);
    this.tourEl.append(this.tourH, this.tourP, trow);
    this.nextEl = el('div', 'ts-next');
    this.nextEl.setAttribute('aria-label', 'Next lights');
    const nl = el('div', 'ts-nl'); nl.append(el('span', null, 'Next'), el('span', null, 'lights'));
    this.nextList = el('div', 'ts-nlist');
    this.nextEl.append(nl, this.nextList);
    this.playBtn = btn('ts-primary ts-playbtn', 'Play'); // phones and narrow windows have no hero panel: Play is a pill at the top left (same loadout flow)
    this.playBtn.addEventListener('click', () => { if (this.host.sound) this.host.sound('ui_step'); this.host.navTo('play'); });
    root.append(this.buildHeroPanel(), this.playBtn);
    root.append(map, panel, this.nextEl, step, this.edge, zoom, this.scrim, idxSheet, helpSheet, tip, this.toastEl, this.noticeEl, this.tourEl, this.sumEl, this.srEl, this.hoverEl, keys);
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
    this.starter = this.starterInfo(s);
    this.veilState();
    this.backdropState();
    this.setFocus();
    this.updateAll();
  }

  // Tree look port: what the backdrop shows (recomputed on state change only, never per frame): the progress of each distance ring (owned real
  // lanterns in the tier / all real lanterns in it; a ring that has just reached 100% blooms once) and a colour wash per woken region.
  backdropState() {
    const m = this.model;
    const nR = this.view.ringTiers.length;
    const fr = ringProgress(this.def, this.view.ringOf, nR, (id) => !!(m.cache[id] && m.cache[id].s === 'lit'));
    const now = performance.now();
    fr.forEach((f, k) => { if (this.ringPrev[k] !== undefined && this.ringPrev[k] < 1 && f >= 1) this.ringBloom[k] = now; this.ringPrev[k] = f; });
    this.ringFrac = fr;
    this.tints = this.view.regions.filter((r) => r.ids.length).map((r) => {
      const col = r.kind === 'cluster' ? r.color : '#ffd9a0';
      const f = r.kind === 'rings' ? 0 : r.lit / r.ids.length;
      const awake = r.kind === 'cluster' ? m.awake(r) : r.lit > 0;
      return { x: r.x, y: r.y, r: Math.max(r.r * 2.1, 260), frac: awake ? 0.45 + 0.55 * f : 0, color0: hexA(col, 0.5), color1: hexA(col, 0) }; // a woken region is tinted at once and saturates as it fills
    });
  }

  updateAll() {
    const s = this.api.save();
    this.goldEl.v.textContent = fmtN(s.gold);
    this.shardEl.v.textContent = fmtN(s.shards);
    this.glassEl.v.textContent = fmtN(s.dawnglass || 0);
    this.glassEl.p.style.display = (s.dawnglass || 0) > 0 ? '' : 'none';
    const a = this.model.readyList().length;
    this.lightN.textContent = String(a);
    this.sumLine(a);
    this.lightN.classList.toggle('zero', !a);
    this.nextBtn.setAttribute('aria-label', `${a} lantern${a === 1 ? '' : 's'} you can light now. Show the best one`);
    this.respecBtn.disabled = !Object.keys(s.tree || {}).some((id) => this.def.nodes[id] && !this.def.nodes[id].permanent);
    this.renderGoals();
    this.renderStep();
    this.renderHero();
    this.renderNext();
    if (this.selected) this.renderPanel();
    this.itemSig = '';
    this.dirty();
  }

  /** 'N lanterns lit of T, M can light now': one polite line, only re-announced when the numbers change. */
  sumLine(ready) {
    const m = this.model; let lit = 0, tot = 0;
    for (const id of this.def.list) { if (this.def.nodes[id].teaser) continue; tot++; if (m.lit(id)) lit++; }
    const txt = `${fmtN(lit)} of ${fmtN(tot)} lanterns lit, ${fmtN(ready)} can light now.`;
    if (txt !== this.sumTxt) { this.sumTxt = txt; this.sumEl.textContent = txt; }
    this.mapEl.setAttribute('aria-describedby', 'ts-sum-line'); this.sumEl.id = 'ts-sum-line';
  }

  // ------------------------------------------------------------------ camera
  resize() {
    if (!this.open_) return;
    const r = this.root.getBoundingClientRect();
    this.W = Math.max(1, r.width);
    this.H = Math.max(1, r.height);
    this.root.classList.toggle('ts-port', this.W <= 600 && this.H > this.W);
    this.small = this.W <= 640 || this.H <= 520;
    this.root.classList.toggle('ts-hero-on', !this.small && this.W >= 860); // the hero panel and Next lights are the desktop tree home
    this.root.classList.toggle('ts-small', this.small);
    this.root.classList.toggle('ts-short', this.H <= 520 && this.W > this.H && this.W <= 1000); // phone-landscape sized only: a wide short desktop window keeps the roomy layout
    this.DPR = Math.min(this.def.list.length > 400 ? 1.5 : 2, window.devicePixelRatio || 1); // big webs: fewer canvas pixels on phones
    this.canvas.width = Math.round(this.W * this.DPR);
    this.canvas.height = Math.round(this.H * this.DPR);
    if (this.bg) { this.bg.ensureSky(this.small); this.bg.ensureScreen(this.W, this.H, this.small); } // no-ops unless the size class changed
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
    const hp = this.box(this.heroEl); if (hp) x0 = Math.max(x0, hp.right);
    const b = this.box(this.barEl);
    const y0 = b ? b.bottom : 0;
    const p = this.panelEl.classList.contains('open') ? this.box(this.panelEl) : null;
    if (p) { if (p.width > this.W * 0.8) y1 = Math.min(y1, p.top); else if (p.left > this.W / 2) x1 = Math.min(x1, p.left); else x0 = Math.max(x0, p.right); }
    const s = this.box(this.stepEl) || this.box(this.nextEl);
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
    const c = this.cam;
    // R2: the tree opens on the OVERVIEW (the hearth in the middle, every spirit's medallion round it), like docs/mockups/tree-v3/R2-web-zoomed-*.png;
    // the best-next pin and the edge arrow still point at what to light. Zoom in to see the constellations.
    c.z = this.clampZ(Math.min((y1 - y0) / 2500, (x1 - x0) / 2150, 0.42));
    c.x = -((x0 + x1) / 2 - this.W / 2) / c.z;
    c.y = -((y0 + y1) / 2 - this.H / 2) / c.z;
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
    const sig = `${this.cam.x},${this.cam.y},${this.cam.z},${this.W},${this.H},${this.uk || 1}`;
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
  /** DESKTOP polish: Menu size (--uik, the CSS zoom of #ui) does not scale canvas pixels, so lanterns, labels and hit areas multiply by it here. 1 on phones. */
  ukNow() { const v = Number(document.documentElement.style.getPropertyValue('--uik')); return v >= 1 && v <= 1.6 ? v : 1; }
  /** Q1a: on-screen radius of a lantern = half its tier diameter (scaled to its neighbours, see meta/treetier.js) x zoom, never under the tier floor. */
  radiusOf(id, lod) {
    const t = this.tiers.tier[id] || 'dot';
    if (t === 'landmark') return this.landmarkD(id) / 2; // ONE rule: a landmark's size depends on its KIND and the zoom only, never on its neighbours (layout gives every landmark room)
    const d = this.tiers.d[id];
    return screenDiameter(t, Number.isFinite(d) ? d : TIER_SIZE[t], this.cam.z, this.uk || 1) / 2;
  }
  /** Landmark medallion diameter in px: base by kind (heart 1, key / socket / gate / hero / kin 0.74, teaser 0.54) x a gentle zoom factor, same everywhere on the map. */
  landmarkD(id) { return this.presence(id) * (this.uk || 1) * LOOK.medSize * clamp(0.8 + 0.45 * this.cam.z, 0.9, 1.12); }
  presence(id) { const k = this.def.nodes[id].kind; return (this.small ? 62 : 92) * (k === 'heart' ? 1 : k === 'teaser' ? 0.54 : 0.74); }
  boost() { return clamp((this.view.lod.near - this.cam.z) / (this.view.lod.near - 0.3), 0, 1); }
  /** FAR only: greedy collapse of landmarks that would overlap on screen. Returns Map id -> leader id (leaders map to themselves); this.farCount = leader -> how many hidden behind it. */
  collapseFar(ids) {
    const pri = { ready: 0, open: 1, challenge: 2, lit: 3, notyet: 4, fog: 5 };
    const kr = { heart: 0, gate: 1, key: 2, socket: 3 }; // R2: a spirit's heart keeps its coin before its seals do
    const best = this.model.best && this.model.best.id;
    const L = [];
    for (const id of ids) {
      if (this.tierOfId(id) !== 'landmark') continue;
      const s = this.model.cache[id].s;
      if (s === 'fog') continue;
      const n = this.def.nodes[id]; const [x, y] = this.toS(n.x, n.y);
      if (x < -30 || x > this.W + 30 || y < -30 || y > this.H + 30) continue;
      L.push({ id, x, y, r: this.radiusOf(id, 'far'), k: id === this.selected ? -2 : id === best ? -1 : (kr[n.kind] ?? 4) * 10 + (pri[s] ?? 6) });
    }
    L.sort((a, b) => a.k - b.k || (a.id < b.id ? -1 : 1));
    const map = new Map(); this.farCount = new Map(); const leaders = [];
    for (const a of L) {
      const lead = leaders.find((b) => Math.hypot(a.x - b.x, a.y - b.y) < (a.r + b.r) * 1.12 + 10);
      if (lead) { map.set(a.id, lead.id); this.farCount.set(lead.id, (this.farCount.get(lead.id) || 0) + 1); } else { map.set(a.id, a.id); leaders.push(a); this.farCount.set(a.id, 0); }
    }
    return map;
  }
  countBadge(c, x, y, n) {
    c.fillStyle = '#fff6e0'; c.beginPath(); c.arc(x, y, 8 * (this.uk || 1), 0, 7); c.fill();
    c.fillStyle = '#3a2412'; c.font = `bold ${10 * (this.uk || 1)}px ${FONT_UI}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(`+${n}`, x, y + 0.5);
  }
  tierOfId(id) { return this.tiers.tier[id] || 'dot'; }
  /** Drawn (and tappable) at this zoom? FAR = landmarks, plus any lantern you can light now (a small glowing dot). */
  shownAt(id, lod) { if (this.veil.has(id)) return false; if (lod !== 'near' && this.farMerged && this.farMerged.has(id) && this.farMerged.get(id) !== id && id !== this.selected) return false; return tierShown(this.tierOfId(id), lod) || this.model.cache[id].s === 'ready' || id === this.selected; }

  draw(t) {
    const c = this.ctx;
    if (!c) return;
    const t0 = performance.now();
    this.drawFrame(t);
    const ms = performance.now() - t0; // Q1a perf probe: draw ms of the tree frame (?perf=1 shows it as window.__treePerf and tags the long-frame list)
    const P = this.perf; P.n++; P.sum += ms; if (ms > P.max) P.max = ms;
    if (probe.on) { globalThis.__treePerf = P; if (ms > 12) probe.tag('tree:draw', ms); }
  }

  drawFrame(t) {
    const c = this.ctx;
    const { W, H, cam } = this;
    this.uk = this.ukNow();
    const m = this.model;
    c.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
    const p = Math.min(1, m.progress + (1 - m.progress) * 0.25 * Math.max(0, Math.min(1, Number(this.api.bookFrac) || 0))); // CX6: the Almanac's book total adds a little light (never dims)
    const z = cam.z;
    const lod = this.lodNow = this.lod();
    // the plain dusk sky is the map element's CSS background (skyFor), so a frame only clears the canvas
    c.clearRect(0, 0, W, H);
    if (this.bg) { // night sky (baked) + moon and vignette (baked) + colour washes + the rune rings
      this.bg.drawSky(c, cam, W, H); this.bg.drawScreen(c, W, H); this.bg.drawTints(c, cam, W, H, this.tints);
      const nowMs = performance.now();
      const rings = this.view.ringTiers.map((q, k) => { const bl = !this.reduced && this.ringBloom[k] ? clamp(1 - (nowMs - this.ringBloom[k]) / 1800, 0, 1) : 0; if (bl > 0) this.animNeeded = true; return { r: q.r, name: q.name, frac: this.ringFrac[k] || 0, bloom: bl }; });
      if (!this.reduced && this.ringFrac.some((f) => f > 0)) this.animNeeded = true; // the gold of the rings shimmers slowly (still with Calm motion)
      this.bg.drawRings(c, cam, W, H, rings, FONT_HEAD, this.reduced ? 0 : t);
    }
    const pulse = this.reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t / 420);
    const [hx, hy] = this.toS(0, 0);
    const R = (1100 + 700 * p) * z + 40;
    const pool = c.createRadialGradient(hx, hy, 0, hx, hy, R);
    const ga = this.small ? 0.6 : 1; // C3: the hub wash is calmer on small screens
    pool.addColorStop(0, `rgba(255,179,90,${(0.14 + 0.3 * p) * ga * 0.4})`); // R3: the hearth's warm pool is wide, so colour returns across the screen as the Hollow is restored
    pool.addColorStop(1, 'rgba(255,154,58,0)');
    c.fillStyle = pool;
    c.beginPath(); c.arc(hx, hy, R, 0, 7); c.fill();
    this.atlas.beginFrame();
    this.hubR = clamp(150 * z * 1.0, 15, 50) * this.uk;
    this.drawFarSlots(lod);
    this.drawRegions();
    this.drawToolCoins(lod);
    this.drawWeb(t);
    this.drawFog(t);
    this.drawPetals(t);
    const vx0 = cam.x - W / 2 / z - 80, vx1 = cam.x + W / 2 / z + 80, vy0 = cam.y - H / 2 / z - 80, vy1 = cam.y + H / 2 / z + 80;
    for (const r of this.view.regions) for (const s of r.display || []) { const [sx, sy] = this.toS(s.x, s.y); if (sx > -40 && sx < W + 40 && sy > -40 && sy < H + 40) this.seal(c, sx, sy, Math.max(lod === 'far' ? 2.5 : 6, 15 * z), 'gold'); }
    // lanterns (culled through the spatial index; at far zoom every lantern is a dot, batched into one path per colour, halos too)
    const labels = [];
    const best = m.best;
    const far = lod === 'far';
    const batches = new Map();
    const coins = [];
    const hw = W / 2, hh = H / 2, cx0 = cam.x, cy0 = cam.y;
    const foc = this.focus; // while a lantern is hovered or selected, everything off its path from your lit lanterns steps back
    const DIMA = [1, 0.2, 0.35, 0.55, 0.4];
    const dot = (style, dim, x, y, r) => { const k = dim ? `D${dim}${style}` : style; let pa = batches.get(k); if (!pa) { pa = new Path2D(); batches.set(k, pa); } pa.moveTo(x + r, y); pa.arc(x, y, r, 0, 6.2832); };
    const ids = this.idsIn(vx0, vy0, vx1, vy1);
    const merged = this.farMerged = lod !== 'near' ? this.collapseFar(ids) : new Map(); // FAR and MID: landmarks closer than their drawn size collapse into one badge with a count
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const n = this.def.nodes[id];
      const sx = (n.x - cx0) * z + hw, sy = (n.y - cy0) * z + hh;
      if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) continue;
      const ce = m.cache[id];
      const s = ce.s;
      if (s === 'fog' && lod === 'far') continue;
      if (this.veil.has(id)) continue; // forks behind an unlit seal are fog, not lanterns
      const dim = this.onlyLight && s !== 'ready' ? 1 : foc && !foc.nodes.has(id) ? 4 : far && !foc && s === 'notyet' ? 3 : 0;
      const tier = this.tierOfId(id);
      if (lod !== 'near' && merged.has(id) && merged.get(id) !== id) continue;
      if (far && tier !== 'landmark') { // FAR shows landmarks only; a lantern you can light now is a small glowing dot (batched)
        if (s === 'ready') { const r = 3 * this.uk; dot('rgba(255,179,90,.14)', false, sx, sy, r + 5 + 5 * pulse); dot('#fff6e0', false, sx, sy, r); this.animNeeded = true; }
        continue;
      }
      const r = this.radiusOf(id, lod);
      if (tier === 'landmark') { coins.push({ id, n, x: sx, y: sy, r, s, ce, dim, tier }); labels.push({ id, x: sx, y: sy, r, s }); continue; } // R2: medallions are drawn after the small lanterns, on top of their threads
      c.globalAlpha = DIMA[dim] * this.unfurlA(id);
      if (s === 'ready') { this.affordMark(c, sx, sy, r, pulse, false, best && best.id === id); this.animNeeded = true; }
      this.nodeShape(c, n, sx, sy, r, s, ce, id, lod);
      if (ce.fresh) this.newFlag(c, sx, sy - r - 9);
      if (this.selected === id) { c.strokeStyle = '#6fd3c5'; c.lineWidth = 2; c.setLineDash([4, 3]); c.beginPath(); c.arc(sx, sy, r + 10, 0, 7); c.stroke(); c.setLineDash([]); }
      c.globalAlpha = 1;
      labels.push({ id, x: sx, y: sy, r, s });
    }
    this.drawDisplay(c, lod);
    for (const q of coins) { // R2: medallions (landmark tier): picture coin + gold rim + progress ring + glow; the can-light rays and the NEW flag stay
      c.globalAlpha = DIMA[q.dim];
      if (q.s === 'ready') { this.affordMark(c, q.x, q.y, q.r, pulse, false, best && best.id === q.id); this.animNeeded = true; }
      if (this.starter && q.id === this.starter.heart) this.spiritHalo(c, q, pulse);
      this.drawCoin(c, q, best && best.id === q.id);
      if (this.starter && q.id === this.starter.heart) this.spiritTag(c, q);
      if (lod !== 'near' && merged.get(q.id) === q.id && this.farCount.get(q.id) > 0) this.countBadge(c, q.x + q.r * 0.78, q.y + q.r * 0.7, this.farCount.get(q.id));
      if (q.ce.fresh) this.newFlag(c, q.x, q.y - q.r - 9);
      if (this.selected === q.id) { c.strokeStyle = '#6fd3c5'; c.lineWidth = 2; c.setLineDash([4, 3]); c.beginPath(); c.arc(q.x, q.y, q.r + 12, 0, 7); c.stroke(); c.setLineDash([]); }
      c.globalAlpha = 1;
    }
    if (far) {
      const halo = batches.get('rgba(255,179,90,.14)'); // halos first, under the dots
      if (halo) { c.fillStyle = 'rgba(255,179,90,.14)'; c.fill(halo); batches.delete('rgba(255,179,90,.14)'); }
      for (const [k, pa] of batches) { const d = k[0] === 'D'; c.globalAlpha = d ? DIMA[Number(k[1])] : 1; c.fillStyle = d ? k.slice(2) : k; c.fill(pa); }
      c.globalAlpha = 1;
      if (this.selected && this.tierOfId(this.selected) !== 'landmark') { const n = this.def.nodes[this.selected]; const [sx, sy] = this.toS(n.x, n.y); c.strokeStyle = '#6fd3c5'; c.lineWidth = 2; c.beginPath(); c.arc(sx, sy, 8, 0, 7); c.stroke(); }
    }
    c.fillStyle = `rgba(4,7,18,${clamp((1 - LOOK.bright) * 0.6, 0, 0.7).toFixed(3)})`; c.fillRect(0, 0, W, H); // the locked 'bright' level: one flat veil under the names
    this.hubBoxes = this.hubCaptionBoxes(hx, hy, this.hubR);
    this.drawPulse(t);
    this.drawLabels(labels, lod);
    this.drawRegionNames(lod);
    // hub lantern (R2): a gold-rimmed lantern-glass coin with the hearth lantern inside; its glow grows with total progress
    const hr = this.hubR;
    const hl = c.createRadialGradient(hx, hy, hr * 0.7, hx, hy, hr * 2.6);
    hl.addColorStop(0, `rgba(255,214,140,${(0.3 + 0.4 * p) * (this.small ? 0.8 : 1)})`);
    hl.addColorStop(1, 'rgba(255,154,46,0)');
    c.fillStyle = hl;
    c.beginPath(); c.arc(hx, hy, hr * 2.6, 0, 7); c.fill();
    this.drawHub(c, hx, hy, hr);
    this.hubCaption(c, hx, hy, hr);
    if (lod === 'far') {
      const ty = 10 * (this.uk || 1); // docked at the top of the map, never among the landmarks
      if (!this.lastRB.concat(this.lblBoxes || []).some((b) => b.x0 < W / 2 + 100 && b.x1 > W / 2 - 100 && b.y0 < ty + 18 && b.y1 > ty)) {
        c.font = `${13 * (this.uk || 1)}px ${FONT_UI}`; c.fillStyle = 'rgba(255,217,160,.9)'; c.textAlign = 'center'; c.textBaseline = 'top';
        const rt = `The Hollow remembers: ${Math.round(p * 100)}%`, rw = c.measureText(rt).width + 16; // on a plate: it sits over the ring names at the far zoom
        c.fillStyle = 'rgba(8,11,26,.72)'; c.beginPath(); c.roundRect(W / 2 - rw / 2, ty - 3, rw, 21 * (this.uk || 1), 10); c.fill();
        c.fillStyle = 'rgba(255,217,160,.95)'; c.fillText(rt, W / 2, ty);
      }
    }
    if (best) this.drawBestMarker(c, t, lod);
    if (this.atlas.pending) this.dirty(); // over the 4-bakes-per-frame budget: the rest comes next frame
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
      if (ly > 70 && ly < this.H - 20) { c.font = `14px ${FONT_UI}`; const bt = 'Beyond: parts of the Hollow you have not reached', bw = c.measureText(bt).width + 16; c.fillStyle = 'rgba(8,11,26,.72)'; c.beginPath(); c.roundRect(lx - bw / 2, ly - 11, bw, 22, 11); c.fill(); c.fillStyle = 'rgba(190,198,218,.92)'; c.fillText(bt, lx, ly); }
    }
  }


  // ------------------------------------------------------------------ R2 medallions: coin (baked picture) + per-frame rim, progress ring, padlock, glow
  coinBody(c, art, tint, variant, x, y, r) {
    const sp = this.atlas.get(art, tint, variant);
    if (sp) { c.imageSmoothingEnabled = true; c.drawImage(sp, x - r, y - r, 2 * r, 2 * r); return; }
    c.fillStyle = '#1a2040'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); // over the bake budget this frame: a plain glass coin, the picture follows next frame
  }
  /** Gold rim: lit = bright double ring, open = brass, dim = dashed grey (state is shape + brightness, not colour alone). */
  rim(c, x, y, r, state) {
    const lw = Math.max(2, r * 0.06);
    if (state === 'dim') { c.strokeStyle = 'rgba(165,175,206,.7)'; c.lineWidth = lw; c.setLineDash([Math.max(3, r * 0.1), Math.max(3, r * 0.08)]); c.beginPath(); c.arc(x, y, r + 2, 0, 7); c.stroke(); c.setLineDash([]); return; }
    c.strokeStyle = state === 'lit' ? '#f4cd62' : '#c9a55f'; c.lineWidth = lw; c.beginPath(); c.arc(x, y, r + 2, 0, 7); c.stroke();
    c.strokeStyle = state === 'lit' ? 'rgba(244,205,98,.5)' : 'rgba(201,165,95,.4)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r + 6 + lw * 0.5, 0, 7); c.stroke();
  }
  coinProgress(c, x, y, rr, f, col) {
    c.lineCap = 'round'; c.lineWidth = 3.2;
    c.strokeStyle = 'rgba(120,130,165,.32)'; c.beginPath(); c.arc(x, y, rr, 0, 7); c.stroke();
    if (f > 0) { c.strokeStyle = col; c.beginPath(); c.arc(x, y, rr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, f)); c.stroke(); }
    c.lineCap = 'butt';
  }
  padlock(c, x, y, r) {
    const u = Math.max(5, r * 0.2);
    c.fillStyle = 'rgba(14,18,38,.92)'; c.beginPath(); c.arc(x, y, u * 1.45, 0, 7); c.fill();
    c.strokeStyle = '#d8c08a'; c.lineWidth = Math.max(1.4, u * 0.28); c.beginPath(); c.arc(x, y - u * 0.25, u * 0.52, Math.PI, 0); c.stroke();
    c.fillStyle = '#d8c08a'; c.fillRect(x - u * 0.8, y - u * 0.1, u * 1.6, u * 1.05);
  }
  drawCoin(c, q, isBest) {
    const { id, n, x, y, r, s, ce } = q; const m = this.model; const reg = m.region(id);
    const masked = !!ce.d.masked;
    const art = emblemFor(n, masked, reg && reg.art);
    const base = n.kind === 'gate' ? '#cdd8ff' : n.kind === 'teaser' ? '#aab4d8' : reg && reg.kind === 'cluster' ? reg.color : '#ffd9a0';
    const tint = safeTint(base);
    const lit = s === 'lit';
    const state = lit ? 'lit' : (s === 'ready' || s === 'open') && !masked ? 'open' : 'dim';
    const ga = c.globalAlpha;
    if (s === 'fog') c.globalAlpha = ga * 0.6;
    if (lit || s === 'ready' || isBest) { // glow: the brightest things are goals, lit hearts and the best next
      const warm = lit ? tint : '#ffd78a';
      const g = c.createRadialGradient(x, y, r * 0.85, x, y, r * (lit ? 1.9 : 2.1));
      g.addColorStop(0, hexA(warm, (lit ? (n.kind === 'heart' ? 0.42 : 0.3) : 0.34) * LOOK.glow)); g.addColorStop(1, hexA(warm, 0));
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r * (lit ? 1.9 : 2.1), 0, 7); c.fill();
    }
    this.coinBody(c, art, tint, state, x, y, r);
    this.rim(c, x, y, r, state);
    let f = -1, col = '#6fd3c5';
    if (n.kind === 'heart' && reg && m.awake(reg) && reg.ids.length) { f = reg.lit / reg.ids.length; col = lit ? mix(tint, '#fff3c0', 0.35) : tint; }
    else if (s === 'challenge' && !masked) f = ce.frac;
    if (f >= 0 && r >= 16) this.coinProgress(c, x, y, r + 10, f, col);
    if (state === 'dim' && !masked && s !== 'fog' && r >= 18) this.padlock(c, x + r * 0.72, y - r * 0.72, r);
    c.globalAlpha = ga;
  }
  // ------------------------------------------------------------------ the hub shows who you are (tree look port: 'STARTER HANDLING IN THE TREE')
  /** { hero, weapon, heart, seal, caption, color, art } from the save's validated starter notes, or null. Names come from the game data. */
  starterInfo(save) {
    const st = this.view.starterOf ? this.view.starterOf(save && save.notes) : null;
    if (!st) return null;
    const ch = this.data && this.data.characters ? this.data.characters[st.hero] : null, w = this.data && this.data.weapons ? this.data.weapons[st.weapon] : null;
    const hn = ch && typeof ch.name === 'string' ? ch.name.split(',')[0].slice(0, 24) : '', wn = w && typeof w.name === 'string' ? w.name.slice(0, 32) : '';
    const reg = this.view.regions.find((r) => r.kind === 'cluster' && r.heart === st.heart);
    return { ...st, caption: hn && wn ? `${hn} · ${wn}` : hn || wn, color: reg ? reg.color : '#ffd9a0', art: reg ? reg.art : '' };
  }
  portraitImg(hero) {
    const im = this.portraitOf(hero, () => { this.dirty(); if (this.open_) this.renderHero(); });
    return im && im.complete && im.naturalWidth > 0 ? im : null;
  }
  /** The hub coin: the chosen hero's portrait with the starter spirit's emblem as a small badge; the plain hearth lantern when no starter is known. */
  drawHub(c, x, y, r) {
    const st = this.starter;
    if (!st) { this.coinBody(c, 'hub', '#ffd27a', 'lit', x, y, r); this.rim(c, x, y, r, 'lit'); return; }
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.4, 0, x, y, r); g.addColorStop(0, '#3b4a86'); g.addColorStop(1, '#171c3a');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    const im = this.portraitImg(st.hero);
    if (im) {
      c.save(); c.beginPath(); c.arc(x, y, r - 1, 0, 7); c.clip();
      const k = (2 * r) / Math.min(im.naturalWidth, im.naturalHeight * 0.78); // cover the coin with the head and shoulders
      const w = im.naturalWidth * k, h = im.naturalHeight * k;
      c.imageSmoothingEnabled = true; c.drawImage(im, x - w / 2, y - r - h * 0.04, w, h);
      c.restore();
    } else this.coinBody(c, 'hero', '#ffd9a0', 'lit', x, y, r);
    this.rim(c, x, y, r, 'lit');
    const br = r * 0.42, bx = x + r * 0.7, by = y + r * 0.68; // the starter spirit's emblem
    c.fillStyle = '#10152e'; c.beginPath(); c.arc(bx, by, br + 2, 0, 7); c.fill();
    this.coinBody(c, emblemFor({ kind: 'heart' }, false, st.art), st.color, 'lit', bx, by, br);
    c.strokeStyle = safeTint(st.color); c.lineWidth = Math.max(1.5, br * 0.12); c.beginPath(); c.arc(bx, by, br + 1, 0, 7); c.stroke();
  }
  hubCaptionBoxes(hx, hy, hr) {
    const uk = this.uk || 1;
    const out = [{ x0: hx - hr - 4, x1: hx + hr + 4, y0: hy - hr - 4, y1: hy + hr + 4, id: 'hub', lm: true }];
    if (this.starter && this.starter.caption) { const w = this.mw(this.ctx, `${13 * uk}px ${FONT_UI}`, this.starter.caption) + 12; out.push({ x0: hx - w / 2, x1: hx + w / 2, y0: hy + hr + 4, y1: hy + hr + 4 + 20 * uk, id: 'hub', lm: true }); }
    return out;
  }
  /** Caption under the hub: 'Wren . Chain Lightning'. */
  hubCaption(c, hx, hy, hr) {
    if (!this.starter || !this.starter.caption) return;
    const uk = this.uk || 1; c.font = `${13 * uk}px ${FONT_UI}`; c.textAlign = 'center'; c.textBaseline = 'top'; c.lineJoin = 'round';
    const y = hy + hr + 8;
    c.lineWidth = 4; c.strokeStyle = 'rgba(5,8,20,.9)'; c.strokeText(this.starter.caption, hx, y); c.fillStyle = '#fff1cf'; c.fillText(this.starter.caption, hx, y);
  }
  /** The starter spirit's heart: a halo in its own colour that breathes (still with Calm motion). */
  spiritHalo(c, q, pulse) {
    const col = safeTint(this.starter.color), rad = Math.max(110 * this.cam.z, 70) * (this.uk || 1);
    const g = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, rad); g.addColorStop(0, hexA(col, 1)); g.addColorStop(0.25, hexA(col, 0.45)); g.addColorStop(0.6, hexA(col, 0.12)); g.addColorStop(1, hexA(col, 0));
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.4 + 0.2 * pulse) * Math.min(1, LOOK.glow + 0.2); c.fillStyle = g; c.beginPath(); c.arc(q.x, q.y, rad, 0, 7); c.fill(); c.restore();
    c.strokeStyle = hexA(col, 0.5 + 0.2 * pulse); c.lineWidth = 2; c.beginPath(); c.arc(q.x, q.y, q.r * 1.55, 0, 7); c.stroke();
  }
  spiritTag(c, q) {
    const uk = this.uk || 1; const txt = 'Your spirit'; c.font = `700 ${13 * uk}px ${FONT_UI}`;
    const w = this.mw(c, c.font, txt) + 22 * uk, h = 22 * uk, x = q.x - w / 2, y = q.y - q.r * 1.55 - 8 - h;
    if (x + w < 0 || x > this.W || y + h < 0 || y > this.H) return;
    const col = safeTint(this.starter.color);
    c.beginPath(); c.roundRect(x, y, w, h, h / 2); c.fillStyle = 'rgba(14,18,40,.92)'; c.fill(); c.strokeStyle = col; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = mix(col, '#fff8e6', 0.6); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, q.x, y + h / 2 + 1);
  }
  /** Tool groups with no landmark of their own (Almanac, Satchel, ...) show their picture coin behind their lanterns while zoomed out. */
  drawToolCoins(lod) {
    this.toolBoxes = [];
    const bo = this.boost(); if (bo <= 0.05) return;
    const c = this.ctx;
    if (!this.toolLm) this.toolLm = new Map();
    for (const r of this.view.regions) {
      if (r.kind !== 'tool' || !r.ids.length) continue;
      if (!this.toolLm.has(r.key)) this.toolLm.set(r.key, r.ids.some((id) => this.tierOfId(id) === 'landmark'));
      if (this.toolLm.get(r.key)) continue;
      const R = this.toolR(bo);
      const [x, y] = this.toS(r.x, r.y);
      if (x < -R - 40 || x > this.W + R + 40 || y < -R - 40 || y > this.H + R + 40) continue;
      const lit = r.lit > 0;
      this.toolBoxes.push({ x, y, r: R + 12 });
      c.globalAlpha = Math.min(1, bo * 1.7);
      if (lit) { const g = c.createRadialGradient(x, y, R * 0.8, x, y, R * 1.9); g.addColorStop(0, 'rgba(243,220,174,.28)'); g.addColorStop(1, 'rgba(243,220,174,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, R * 1.9, 0, 7); c.fill(); }
      this.coinBody(c, r.art, '#f3dcae', lit ? 'lit' : 'open', x, y, R);
      this.rim(c, x, y, R, lit ? 'lit' : 'open');
      this.coinProgress(c, x, y, R + 9, r.lit / r.ids.length, '#f3dcae');
      c.globalAlpha = 1;
    }
    if (this.atlas.pending) this.dirty();
  }
  toolR(bo) { return (this.small ? 24 : 38) * (this.uk || 1) * (0.6 + 0.4 * bo); }
  costText(nx) {
    if (!nx) return '';
    const p = [];
    if (nx.gold) p.push(`${fmtN(nx.gold)} gold`);
    if (nx.shards) p.push(`${fmtN(nx.shards)} shards`);
    if (nx.glass) p.push(`${fmtN(nx.glass)} Dawnglass`);
    return p.join(' + ');
  }
  /** One status line and an optional 'To wake' pill for a landmark label. Existing text only (state, cost, condition line); a veiled seal gets neither. */
  statusOf(id) {
    const m = this.model; const ce = m.cache[id]; const n = this.def.nodes[id]; const r = m.region(id); const d = ce.d;
    if (d.masked) return { line: '', pill: '' };
    if (ce.s === 'lit') return { line: n.kind === 'heart' && r ? (r.lit <= 1 ? 'Awake' : `${r.lit} of ${r.ids.length} lit`) : n.kind === 'gate' ? 'Night awake' : n.kind === 'socket' ? 'Evolution awake' : 'Lit', pill: '' };
    if (ce.s === 'ready' || ce.s === 'open') return { line: `${n.kind === 'heart' || n.kind === 'gate' ? 'Wake' : 'Light'}: ${this.costText(d.next)}`, pill: '' };
    if (ce.s === 'challenge') {
      const L = (d.condLines || [])[0];
      const t = L && L.text ? `${L.text}${L.goal > 1 && !L.done ? ` ${fmtN(L.cur)}/${fmtN(L.goal)}` : ''}` : '';
      return { line: n.kind === 'socket' ? 'Evolution' : 'Asleep', pill: t ? `To wake: ${t}` : '' };
    }
    return { line: '', pill: '' };
  }
  /** Text width with a small cache (measureText per label per frame was the biggest part of the label cost). */
  mw(c, font, text) {
    if (!this.mwCache) this.mwCache = new Map();
    const k = `${font}|${text}`; let w = this.mwCache.get(k);
    if (w === undefined) { c.font = font; w = c.measureText(text).width; if (this.mwCache.size > 600) this.mwCache.clear(); this.mwCache.set(k, w); }
    return w;
  }
  landmarkLabel(c, L, uk, hits, addBox) {
    const m = this.model; const ce = m.cache[L.id]; if (ce.d.masked || L.s === 'fog') return;
    const { line, pill } = this.statusOf(L.id);
    const fz = lodFar(this.cam.z, this.view.lod); // R2: names shrink a little when the whole web is in view, so neighbours do not run together
    const fs = Math.round((this.small ? 15 : 21) * uk * fz), sf = Math.round(12.5 * uk * Math.max(fz, 0.9)), pf = Math.round(12 * uk * Math.max(fz, 0.9));
    const nm = this.def.nodes[L.id].kind === 'socket' ? ce.d.name.replace(/\s*\([^)]*\)\s*$/, '') : ce.d.name; const nw = this.mw(c, `${fs}px ${FONT_HEAD}`, nm);
    const lw = line ? this.mw(c, `${sf}px ${FONT_UI}`, line) : 0;
    const pt = pill.length > 40 ? `${pill.slice(0, 39)}…` : pill;
    const pw = pt ? this.mw(c, `${pf}px ${FONT_UI}`, pt) + 18 * uk : 0;
    const y0 = L.y + L.r + (L.s === 'ready' ? 13 : 6);
    const rows = [[fs + 2, nw + 8], [sf + 3, lw + 6], [pf + 12, pw]];
    const wAll = Math.max(rows[0][1], rows[1][1], rows[2][1]);
    const fx0 = this.freeRect()[0]; // the left edge of the map that is really visible (the hero panel covers the rest)
    if (L.x + wAll / 2 < fx0 + 4) return;
    const cx = clamp(L.x, fx0 + wAll / 2 + 6, Math.max(fx0 + wAll / 2 + 6, this.W - wAll / 2 - 6)); // a name and its pill are never cut off by the screen edge or hidden under the panel
    const make = (k) => { let h = 0, w = 0; for (let i = 0; i < k; i++) { h += rows[i][0]; w = Math.max(w, rows[i][1]); } return { x0: cx - w / 2, x1: cx + w / 2, y0, y1: y0 + h, id: L.id }; };
    let k = pt ? 3 : line ? 2 : 1;
    for (; k > 1; k--) if (!hits(make(k), L.id)) break;
    const bx = make(k); if (k === 1 && hits(bx, L.id)) return;
    bx.lm = true; addBox(bx); this.lblBoxes.push(bx);
    // the finished label is painted once into a small sprite and drawn as one image per frame (text stroking every frame was the biggest cost of the overview)
    const pad = 5, w2 = Math.ceil(bx.x1 - bx.x0) + pad * 2, h2 = Math.ceil(bx.y1 - bx.y0) + pad * 2;
    if (!this.lblSprites) this.lblSprites = new Map();
    const key = `${this.DPR}|${w2}|${fs}|${sf}|${pf}|${nm}|${k >= 2 ? line : ''}|${k >= 3 ? pt : ''}|${L.s}`;
    let sp = this.lblSprites.get(key);
    if (!sp) {
      sp = document.createElement('canvas'); sp.width = Math.ceil(w2 * this.DPR); sp.height = Math.ceil(h2 * this.DPR);
      const g = sp.getContext('2d');
      if (g) { g.scale(this.DPR, this.DPR); this.paintLabel(g, w2 / 2, pad, { fs, sf, pf, nm, line: k >= 2 ? line : '', pt: k >= 3 ? pt : '', pw, s: L.s }); }
      if (this.lblSprites.size > 80) this.lblSprites.clear();
      this.lblSprites.set(key, sp);
    }
    c.drawImage(sp, cx - w2 / 2, y0 - pad, w2, h2);
  }
  paintLabel(g, cx, y0, p) {
    const { fs, sf, pf, nm, line, pt, pw } = p;
    g.textAlign = 'center'; g.textBaseline = 'top'; g.lineJoin = 'round';
    const dimmed = p.s === 'notyet' || p.s === 'challenge';
    g.font = `${fs}px ${FONT_HEAD}`; g.lineWidth = 4; g.strokeStyle = 'rgba(8,10,24,.92)'; g.strokeText(nm, cx, y0); g.fillStyle = dimmed ? '#d4daf0' : p.s === 'lit' ? '#fff0c8' : '#fff6e0'; g.fillText(nm, cx, y0);
    let y = y0 + fs + 2;
    if (line) {
      g.font = `${sf}px ${FONT_UI}`; g.lineWidth = 3; g.strokeStyle = 'rgba(8,10,24,.9)'; g.strokeText(line, cx, y);
      g.fillStyle = p.s === 'lit' ? '#ffe39a' : p.s === 'ready' ? '#ffe08a' : p.s === 'open' ? '#f5dfae' : '#b9c2dc'; g.fillText(line, cx, y); y += sf + 3;
    }
    if (pt) {
      const h = pf + 9; g.fillStyle = 'rgba(14,18,40,.9)'; g.strokeStyle = 'rgba(190,200,230,.35)'; g.lineWidth = 1;
      g.beginPath(); g.roundRect(cx - pw / 2, y + 1, pw, h, h / 2); g.fill(); g.stroke();
      g.font = `${pf}px ${FONT_UI}`; g.fillStyle = '#e4e9fb'; g.textBaseline = 'middle'; g.fillText(pt, cx, y + 1 + h / 2 + 0.5); g.textBaseline = 'top';
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
        const zs = z * (r.scale || 1); // R1: the emblem is spread by the constellation scale (core.layout.clusterScale)
        c.save(); c.translate(sx, sy); c.scale(zs, zs);
        c.fillStyle = r.done ? hexA(r.color, 0.20) : awake ? hexA(r.color, 0.04 + 0.10 * frac) : 'rgba(120,128,150,.06)';
        c.fill(path);
        if (r.done) { c.lineWidth = 2 / zs; c.strokeStyle = hexA(r.color, 0.9); if (!this.reduced) { c.shadowColor = r.color; c.shadowBlur = 8; } c.stroke(path); c.shadowBlur = 0; }
        c.restore();
      } else if (r.kind === 'tool') {
        const RR = r.r * z; const m = c.createRadialGradient(sx, sy, 0, sx, sy, RR);
        m.addColorStop(0, `rgba(243,220,174,${0.04 + 0.08 * frac})`); m.addColorStop(1, 'rgba(243,220,174,0)');
        c.fillStyle = m; c.beginPath(); c.arc(sx, sy, RR, 0, 7); c.fill();
      }
    }
  }

  // ------------------------------------------------------------------ the web of threads (tree look port, LOCKED from the sandbox)
  // Every drawn thread is a real link between two real lanterns (a requirement edge, or a render-only cross link between neighbouring regions).
  // Three states: LIT (both ends lit: bright, glowing, in the spirit's colour), AVAILABLE (one end lit: medium) and LOCKED (neither: faint).
  // The geometry is built once on open (buildThreads); the state of each thread is read from the model every frame, batched into one path per style.
  buildThreads() {
    const def = this.def, V = this.view, m = this.model;
    const out = [], seen = new Set();
    const P = (id) => (id === 'hub' ? { x: 0, y: 0 } : def.nodes[id]);
    const add = (a, b, cross) => {
      if (a === b) return;
      const k = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (seen.has(k)) return;
      const A = P(a), B = P(b);
      if (!A || !B || (a !== 'hub' && A.teaser) || B.teaser) return; // teasers are fog, not threads
      if (!cross && Math.hypot(A.x - B.x, A.y - B.y) > V.linkFar) return; // a requirement longer than a thread can be is shown by the focus path, never across the web (cross links were already picked by distance by the atlas)
      seen.add(k);
      const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, off = (cross ? 0.18 : 0.1) * L * (idHash(k) < 0.5 ? 1 : -1) * hubFade(A, B); // a gentle bow, side picked per thread (like the sandbox)
      const knot = Math.max(Math.hypot(A.x, A.y), Math.hypot(B.x, B.y)) < (V.ringTiers[0] ? V.ringTiers[0].r * 1.2 : 360);
      const hubz = Math.max(Math.hypot(A.x, A.y), Math.hypot(B.x, B.y)) < 440;
      out.push({ a, b, knot, hubz, ax: A.x, ay: A.y, bx: B.x, by: B.y, cx: (A.x + B.x) / 2 - (dy / L) * off, cy: (A.y + B.y) / 2 + (dx / L) * off, cross, col: this.colorOf(cross ? a : b) });
    };
    for (const e of def.edges) {
      let from = e.from;
      if (from === 'hub') { const r = m.region(e.to); if (r && r.kind === 'cluster' && r.heart && r.heart !== e.to) from = r.heart; } // a far seal hangs from its spirit's heart, not from the hub
      add(from, e.to, false);
    }
    for (const l of V.links) { const a = def.nodes[l[0]], b = def.nodes[l[1]]; if (a && b && Math.min(Math.hypot(a.x, a.y), Math.hypot(b.x, b.y)) > V.nearHub * 2) add(l[0], l[1], true); } // no cross links round the hub: the fan stays clean
    this.threads = out;
    this.forkSeal = new Map(); // fork lantern -> its seal (veil, petals, unfurl)
    for (const g of V.gardens || []) for (const f of g.forks) for (const id of f) if (def.nodes[id]) this.forkSeal.set(id, g.seal);
    // display-only medallions (a hero's keepsake coin, the Twilight night, reserved and far slots): drawn quietly, never tapped, never counted as progress
    const KIND_ART = { hero: 'hero', night: 'moon_dusk', reserved: 'fog', chapter: 'forest', far: 'fog' };
    this.display = (V.regionRecords || []).filter((r) => r && r.display && Array.isArray(r.centre) && r.centre.every(Number.isFinite) && Object.hasOwn(KIND_ART, r.kind))
      .map((r) => ({ x: r.centre[0], y: r.centre[1], name: String(r.name || '').slice(0, 32), kind: r.kind, hero: r.kind === 'hero' && typeof r.hero === 'string' ? r.hero : '', art: KIND_ART[r.kind], lit: !!r.lit, reserved: !!r.reserved }));
    this.adj = new Map();
    out.forEach((th, i) => { if (th.cross) return; for (const [x, y] of [[th.a, th.b], [th.b, th.a]]) { if (!this.adj.has(x)) this.adj.set(x, []); this.adj.get(x).push({ to: y, ti: i }); } });
  }

  /** Focus = the lantern under the pointer, else the selected one: the shortest chain of real threads from the nearest lit lantern (or the hub) to it. */
  setFocus() {
    const id = this.hoverFocus || this.selected;
    if (!id || !this.model || !this.adj || !this.def.nodes[id]) { this.focus = null; return; }
    const m = this.model; const isLit = (n) => n === 'hub' || m.lit(n);
    const nodes = new Set([id]), edges = new Set();
    if (!isLit(id)) {
      const prev = new Map(), pe = new Map(), q = [];
      for (const n of this.adj.keys()) if (isLit(n)) { prev.set(n, null); q.push(n); }
      for (let h = 0; h < q.length && !prev.has(id); h++) { const u = q[h]; for (const { to, ti } of this.adj.get(u) || []) { if (prev.has(to)) continue; prev.set(to, u); pe.set(to, ti); q.push(to); } }
      let u = id;
      while (prev.has(u) && prev.get(u) !== null) { const p = prev.get(u); edges.add(pe.get(u)); nodes.add(p); u = p; }
      if (prev.has(u) && prev.get(u) === null) nodes.add(u);
    }
    this.focus = { id, nodes, edges };
  }

  /** Display-only medallions of the atlas. A hero shows its portrait (lit once that hero is awake), Twilight is lit, reserved and far slots are dim dashed coins. */
  drawDisplay(c, lod) {
    if (!this.display || !this.display.length) return;
    const z = this.cam.z, uk = this.uk || 1, s = this.api.save();
    const r = clamp(34 * z, 19, 80) * LOOK.medSize * uk;
    for (const d of this.display) {
      const [x, y] = this.toS(d.x, d.y);
      if (x < -r - 60 || x > this.W + r + 60 || y < -r - 40 || y > this.H + r + 60) continue;
      const awake = d.kind === 'hero' ? !!(s && s.chars && Object.hasOwn(s.chars, d.hero) && s.chars[d.hero] && s.chars[d.hero].woke) : d.lit;
      c.globalAlpha = this.focus ? 0.4 : 1;
      if (awake) { const g = c.createRadialGradient(x, y, r * 0.85, x, y, r * 1.8); g.addColorStop(0, hexA('#ffd9a0', 0.3 * LOOK.glow)); g.addColorStop(1, hexA('#ffd9a0', 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 1.8, 0, 7); c.fill(); }
      const im = d.hero ? this.portraitImg(d.hero) : null;
      if (im) {
        c.fillStyle = '#1a2040'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
        c.save(); c.beginPath(); c.arc(x, y, r - 1, 0, 7); c.clip(); c.globalAlpha *= awake ? 1 : 0.55;
        const k = (2 * r) / Math.min(im.naturalWidth, im.naturalHeight * 0.78); c.drawImage(im, x - (im.naturalWidth * k) / 2, y - r - im.naturalHeight * k * 0.04, im.naturalWidth * k, im.naturalHeight * k);
        c.restore();
      } else this.coinBody(c, d.art, '#ffd9a0', awake ? 'lit' : 'dim', x, y, r);
      c.globalAlpha = this.focus ? 0.4 : 1;
      this.rim(c, x, y, r, awake ? 'lit' : 'dim');
      if (!awake && !d.reserved) this.padlock(c, x + r * 0.72, y - r * 0.72, r);
      if (lod !== 'far' && d.name && x - 40 > this.freeRect()[0]) {
        const fs = Math.round((this.small ? 15 : 19) * uk); c.font = `${fs}px ${FONT_HEAD}`; c.textAlign = 'center'; c.textBaseline = 'top'; c.lineJoin = 'round';
        c.lineWidth = 4; c.strokeStyle = 'rgba(8,10,24,.92)'; c.strokeText(d.name, x, y + r + 6); c.fillStyle = awake ? '#fff0c8' : '#d4daf0'; c.fillText(d.name, x, y + r + 6);
      }
      c.globalAlpha = 1;
    }
  }

  // ------------------------------------------------------------------ gardens: veiled forks, petals, unfurl, route chips
  /** Forks behind an unlit seal are veiled (not drawn: a soft fog stands where they will grow); a seal that has just been lit unfurls its forks. */
  veilState() {
    const m = this.model, V = this.view;
    const veil = new Set(), fogs = [];
    const litSeals = new Set();
    for (const g of V.gardens || []) {
      if (!this.def.nodes[g.seal]) continue;
      if (m.lit(g.seal)) { litSeals.add(g.seal); continue; }
      const pts = [];
      for (const f of g.forks) for (const id of f) { if (this.def.nodes[id]) { veil.add(id); pts.push(this.def.nodes[id]); } }
      if (pts.length) { const x = pts.reduce((a, p) => a + p.x, 0) / pts.length, y = pts.reduce((a, p) => a + p.y, 0) / pts.length; fogs.push({ x, y, r: Math.max(...pts.map((p) => Math.hypot(p.x - x, p.y - y))) + 40, seal: g.seal }); }
    }
    if (this.sealPrev && !this.reduced) { const now = performance.now(); for (const sl of litSeals) if (!this.sealPrev.has(sl)) this.unfurl.set(sl, now); }
    this.sealPrev = litSeals;
    this.veil = veil; this.fogs = fogs;
  }
  /** 0..1: how far a fork has unfurled (1 once it is done, or when it is not a fork). */
  unfurlA(id) {
    if (!this.unfurl.size) return 1;
    const sl = this.forkSeal.get(id); const t0 = sl ? this.unfurl.get(sl) : undefined;
    if (t0 === undefined) return 1;
    const k = (performance.now() - t0) / 600;
    if (k >= 1) return 1;
    this.animNeeded = true; this.dirty();
    return k <= 0 ? 0 : 1 - Math.pow(1 - k, 3);
  }
  drawFog(t) {
    const c = this.ctx, z = this.cam.z;
    if (!this.fogs.length || z < 0.25) return;
    for (const f of this.fogs) {
      const [x, y] = this.toS(f.x, f.y); const R = f.r * z * 1.15;
      if (x < -R || x > this.W + R || y < -R || y > this.H + R) continue;
      const g = c.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, 'rgba(150,162,205,.16)'); g.addColorStop(1, 'rgba(150,162,205,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, 7); c.fill();
    }
  }
  /** Petals: once a seal is lit, each fork chain fills a soft leaf shape in the spirit's colour (more as its lanterns light). */
  drawPetals(t) {
    const z = this.cam.z, c = this.ctx, m = this.model;
    if (z < 0.5) return;
    const k = clamp((z - 0.5) / 0.2, 0, 1) * LOOK.bright;
    for (const g of this.view.gardens || []) {
      const sd = this.def.nodes[g.seal]; if (!sd || !m.lit(g.seal)) continue;
      const col = this.colorOf(g.seal);
      for (const f of g.forks) {
        const tip = this.def.nodes[f[f.length - 1]]; if (!tip) continue;
        const u = this.unfurlA(f[f.length - 1]); if (u <= 0) continue;
        let ow = 0; for (const id of f) if (m.lit(id)) ow++;
        const [ax, ay] = this.toS(sd.x, sd.y), [bx, by] = this.toS(tip.x, tip.y); const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, px = (-dy / L) * L * 0.24, py = (dx / L) * L * 0.24;
        if (Math.max(ax, bx) < -60 || Math.min(ax, bx) > this.W + 60 || Math.max(ay, by) < -60 || Math.min(ay, by) > this.H + 60) continue;
        c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo((ax + bx) / 2 + px, (ay + by) / 2 + py, bx, by); c.quadraticCurveTo((ax + bx) / 2 - px, (ay + by) / 2 - py, ax, ay);
        c.globalAlpha = u * (0.05 + (0.1 * ow) / f.length) * k; c.fillStyle = col; c.fill();
      }
    }
    c.globalAlpha = 1;
  }
  /** Route chips ('5 of 12 to Spirit Bolts'): only for roads on the hovered / selected path, or else the one started road nearest the middle of the map. At most 3, never on a label. */
  drawChips(c) {
    const z = this.cam.z, m = this.model, foc = this.focus;
    if (z <= 0.3 || !this.view.roads || !this.view.roads.length) return;
    const [fx0, fy0, fx1, fy1] = this.freeRect(); const mx = (fx0 + fx1) / 2, my = (fy0 + fy1) / 2;
    const cand = [];
    for (const r of this.view.roads) {
      const n = r.ids.length; if (!n) continue;
      let k = 0; for (const id of r.ids) if (m.lit(id)) k++;
      const to = this.def.nodes[r.to]; if (!to || k >= n || m.lit(r.to)) continue;
      if (!(k > 0 || r.from === 'hub' || m.lit(r.from))) continue;
      const midId = r.ids[Math.min(n - 1, Math.floor((n - 1) / 2))], mid = this.def.nodes[midId]; if (!mid) continue;
      const [x, y] = this.toS(mid.x, mid.y);
      if (x < fx0 + 30 || x > fx1 - 30 || y < fy0 + 20 || y > fy1 - 20) continue;
      if (foc && !(r.ids.some((id) => foc.nodes.has(id)) || foc.nodes.has(r.to))) continue;
      cand.push({ r, k, n, x, y, d: Math.hypot(x - mx, y - my) });
    }
    if (!cand.length) return;
    cand.sort((p, q) => p.d - q.d);
    const take = foc ? cand.slice(0, 3) : cand.slice(0, 1);
    const boxes = (this.allBoxes || []).slice();
    c.textBaseline = 'middle'; c.textAlign = 'center';
    const uk = this.uk || 1;
    for (const q of take) {
      const ce = m.cache[q.r.to]; const nm = ce && !ce.d.masked ? ce.d.name : 'a far lantern';
      const txt = `${q.k} of ${q.n} to ${nm}`; c.font = `600 ${13 * uk}px ${FONT_UI}`;
      const w = this.mw(c, c.font, txt) + 18 * uk, h = 22 * uk, bx = q.x - w / 2;
      let placed = false;
      for (const dy of [-30, 30, -54, 54]) { // try above the road, then below
        const by = q.y + dy * uk - h / 2;
        if (bx < fx0 + 4 || bx + w > fx1 || by < fy0 || by + h > fy1 || boxes.some((b) => b.x0 < bx + w && b.x1 > bx && b.y0 < by + h && b.y1 > by)) continue;
        boxes.push({ x0: bx, x1: bx + w, y0: by, y1: by + h });
        c.globalAlpha = clamp((z - 0.3) / 0.1, 0, 1) * 0.95;
        c.beginPath(); c.roundRect(bx, by, w, h, h / 2); c.fillStyle = 'rgba(12,17,38,.92)'; c.fill(); c.strokeStyle = 'rgba(255,210,122,.6)'; c.lineWidth = 1; c.stroke();
        c.fillStyle = '#ffe6ae'; c.fillText(txt, q.x, by + h / 2 + 1); placed = true; break;
      }
      void placed;
    }
    c.globalAlpha = 1;
  }

  /** Left panel: the last-played hero (portrait, a glow spot where the companion will stand), swap row, Play / Almanac / Goals / Back, purse. */
  buildHeroPanel() {
    const p = el('aside', 'ts-hero');
    p.setAttribute('aria-label', 'Your hero');
    this.heroEl = p;
    this.heroLabel = el('div', 'ts-hl', 'Your hero');
    this.heroCv = el('canvas', 'ts-hcv'); this.heroCv.width = 400; this.heroCv.height = 430; this.heroCv.setAttribute('aria-hidden', 'true');
    this.heroSwap = el('div', 'ts-swap'); this.heroSwap.setAttribute('role', 'group'); this.heroSwap.setAttribute('aria-label', 'Choose your hero');
    this.heroName = el('div', 'ts-hname');
    this.heroSub = el('div', 'ts-hsub');
    const play = btn('ts-hbtn ts-hplay', 'Play');
    play.addEventListener('click', () => { if (this.host.sound) this.host.sound('ui_step'); this.host.navTo('play'); });
    const alm = this.heroAlm = btn('ts-hbtn', 'Almanac'); alm.addEventListener('click', () => { if (this.host.showAlmanac) this.host.showAlmanac('tree'); }); // opens over the tree: Back returns to it
    this.heroGoals = btn('ts-hbtn', 'Goals'); this.heroGoals.addEventListener('click', () => this.toggleGoals(false));
    const back = btn('ts-hbtn', 'Back'); back.addEventListener('click', () => this.close());
    this.heroBond = el('div', 'ts-hbond'); // bond pips (display only)
    const card = this.heroCard = el('div', 'ts-hcard'); // loadout summary: spirit, ability, how much of the web is lit
    this.heroRows = {};
    for (const [k, lab] of [['spirit', 'Spirit'], ['ability', 'Ability'], ['lit', 'Lit'], ['ready', 'Can light']]) { const r = el('div', 'ts-hrow'); const v = el('span', 'ts-hv'); this.heroRows[k] = v; r.append(el('span', 'ts-hk', lab), v); card.append(r); }
    const pair = el('div', 'ts-hpair'); pair.append(alm, this.heroGoals);
    this.heroGold = el('span'); this.heroShard = el('span');
    const coins = el('div', 'ts-hcoins');
    const mk = (icon, v) => { const w = el('span', 'ts-hc'); const i = el('i', icon); i.setAttribute('aria-hidden', 'true'); w.append(i, v); return w; };
    coins.append(mk('ts-i-gold', this.heroGold), mk('ts-i-shard', this.heroShard));
    p.append(this.heroLabel, this.heroCv, this.heroSwap, this.heroName, this.heroSub, this.heroBond, card, play, pair, back, coins);
    return p;
  }
  /** Paint one portrait into a canvas (cover crop on the face) or a plain initial when there is no picture. */
  paintPortrait(cv, hero, name, awake, soft = false) {
    const g = cv.getContext('2d'); if (!g) return;
    const w = cv.width, h = cv.height; g.clearRect(0, 0, w, h);
    const im = this.portraitImg(hero);
    if (im) { const k = Math.min(w / im.naturalWidth, h / im.naturalHeight); g.globalAlpha = awake ? 1 : 0.45; if (!awake) g.filter = 'grayscale(1) brightness(.6)'; g.drawImage(im, (w - im.naturalWidth * k) / 2, h - im.naturalHeight * k, im.naturalWidth * k, im.naturalHeight * k); g.filter = 'none'; g.globalAlpha = 1; if (soft) { // cut-out look: the picture's own backdrop fades out softly into the panel (an oval feather inside the picture's rectangle)
        const iw = im.naturalWidth * k, ih = im.naturalHeight * k;
        g.save(); g.globalCompositeOperation = 'destination-in'; g.translate(w / 2, h - ih / 2); g.scale(1, ih / iw); const mk = g.createRadialGradient(0, 0, iw * 0.2, 0, 0, iw * 0.5); mk.addColorStop(0, 'rgba(0,0,0,1)'); mk.addColorStop(0.5, 'rgba(0,0,0,.85)'); mk.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = mk; g.fillRect(-w, -h * 2, 2 * w, 4 * h); g.restore(); } }
    else { g.fillStyle = awake ? '#fff1cf' : '#8e97b8'; g.font = `${Math.round(h * 0.5)}px ${FONT_HEAD}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(name || '?').slice(0, 1), w / 2, h / 2); }
  }
  renderHero() {
    if (!this.heroEl || !this.api.heroes) return;
    const H = this.api.heroes(); const s = this.api.save();
    const cur = H.list.find((h) => h.id === H.hero) || H.list[0];
    if (!cur) return;
    this.heroName.textContent = cur.name;
    this.heroSub.textContent = cur.awake ? `Bond level ${cur.bond}` : `Keepsakes ${cur.keep} of ${cur.need}`;
    const g = this.heroCv.getContext('2d');
    if (g) g.clearRect(0, 0, 400, 430);
    this.paintPortrait(this.heroCv, cur.id, cur.name, cur.awake, true);
    if (g) { // the glow spot: where the companion will stand beside the hero
      g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(100, 360, 0, 100, 360, 120); gr.addColorStop(0, 'rgba(255,210,122,.4)'); gr.addColorStop(1, 'rgba(255,210,122,0)'); g.fillStyle = gr; g.fillRect(0, 0, 400, 430); g.restore();
    }
    this.heroSwap.replaceChildren();
    for (const h of H.list) {
      const b = btn(`ts-swapb${h.id === cur.id ? ' on' : ''}${h.awake ? '' : ' asleep'}`, null, h.awake ? `Play as ${h.name}` : `${h.name}, asleep. Keepsakes ${h.keep} of ${h.need}`);
      b.setAttribute('title', h.awake ? h.name : `${h.name}: keepsakes ${h.keep} of ${h.need}`);
      b.setAttribute('aria-pressed', h.id === cur.id ? 'true' : 'false');
      const cv = el('canvas'); cv.width = 80; cv.height = 80; this.paintPortrait(cv, h.id, h.name, h.awake); b.append(cv);
      if (h.awake) b.addEventListener('click', () => { if (this.api.setHero && this.api.setHero(h.id)) this.renderHero(); });
      else b.setAttribute('aria-disabled', 'true');
      this.heroSwap.append(b);
    }
    this.heroGold.textContent = fmtN(s.gold); this.heroShard.textContent = fmtN(s.shards);
    this.heroGoals.textContent = 'Goals';
    this.heroBond.replaceChildren();
    if (cur.awake) for (let i = 0; i < 5; i++) { const pip = el('i', i < Math.min(5, cur.bond) ? 'on' : ''); pip.setAttribute('aria-hidden', 'true'); this.heroBond.append(pip); }
    this.heroBond.style.display = cur.awake ? '' : 'none';
    const ab = this.data && this.data.characters && this.data.characters[cur.id] && this.data.characters[cur.id].ability;
    const sp = this.starter && this.starter.caption ? String(this.starter.caption).split(' · ').slice(1).join(' · ') : '';
    let lit = 0, tot = 0; for (const id of this.def.list) { if (this.def.nodes[id].teaser) continue; tot++; if (this.model.lit(id)) lit++; }
    this.heroRows.spirit.textContent = sp || 'None yet';
    this.heroRows.ability.textContent = ab && typeof ab.name === 'string' ? ab.name.slice(0, 24) : '-';
    this.heroRows.lit.textContent = `${fmtN(lit)} of ${fmtN(tot)}`;
    this.heroRows.ready.textContent = fmtN(this.model.readyList().length);
  }

  /** 'Next lights': up to three goals. First the evolution seals on the starter spirit's own branches, then the nearest other landmarks, each with the lanterns to go and the gold. */
  nextLights() {
    const m = this.model, def = this.def, V = this.view;
    const dist = new Map(), prev = new Map(), q = [];
    for (const n of this.adj.keys()) if (n === 'hub' || m.lit(n)) { dist.set(n, 0); q.push(n); }
    for (let h = 0; h < q.length; h++) { const u = q[h]; for (const { to } of this.adj.get(u) || []) { if (dist.has(to) || this.veil.has(to)) continue; dist.set(to, dist.get(u) + 1); prev.set(to, u); q.push(to); } }
    const chain = (id) => { const out = []; let u = id; while (u && !(u === 'hub' || m.lit(u)) && out.length < 80) { out.push(u); u = prev.get(u); } return out.reverse(); }; // first lantern to light .. the goal
    const row = (id) => {
      const ce = m.cache[id]; if (!ce || ce.s === 'fog' || this.veil.has(id) || !dist.has(id) || m.lit(id)) return null;
      const steps = chain(id); if (!steps.length) return null;
      let gold = 0; for (const x of steps) gold += m.costOf(x);
      return { id, first: steps[0], n: steps.length, gold, name: ce.d.masked ? 'A seal of your spirit' : ce.d.name };
    };
    const out = [], seen = new Set();
    const reg = this.starter ? V.regions.find((r) => r.kind === 'cluster' && r.heart === this.starter.heart) : null;
    if (reg) { let ix = 0; for (const g of V.gardens || []) { if (m.region(g.seal) !== reg) continue; ix++; const r = row(g.seal); if (r && out.length < 2) { if (m.cache[g.seal].d.masked) r.name = `${r.name} (${ix})`; out.push(r); seen.add(r.id); } } }
    const lm = def.list.filter((id) => this.tierOfId(id) === 'landmark' && !seen.has(id) && !def.nodes[id].teaser).map(row).filter(Boolean).sort((a, b) => a.n - b.n || a.gold - b.gold);
    for (const r of lm) { if (out.length >= 3) break; out.push(r); }
    return out;
  }
  renderNext() {
    if (!this.nextEl) return;
    const rows = this.nextLights();
    this.nextList.replaceChildren();
    if (!rows.length) { this.nextList.append(el('div', 'ts-nc ts-nc0', 'Everything reachable is lit.')); return; }
    const total = Math.max(1, ...rows.map((r) => r.gold));
    for (const r of rows) {
      const b = btn('ts-nc', null); b.setAttribute('aria-label', `${r.name}: ${r.n} to go, about ${fmtN(r.gold)} gold. Show the first lantern`);
      const have = this.api.save().gold; const bar = el('i'); bar.style.width = `${Math.round(100 * Math.min(1, have / Math.max(1, r.gold)))}%`;
      const nb = el('div', 'ts-nb'); nb.append(bar);
      b.append(el('b', null, r.name), el('span', null, `${r.n} to go · ~${fmtN(r.gold)} gold`), nb);
      b.addEventListener('click', () => this.select(r.first, true));
      this.nextList.append(b);
    }
    void total;
  }

  // ------------------------------------------------------------------ banner extras: condition tile + path chips
  /** Leaf conditions of a node's unlock in the same order as describeNode's condLines (all/any trees are walked depth first). */
  condLeaves(c, out = [], depth = 0) {
    if (!c || typeof c !== 'object' || depth > 5) return out;
    if ((c.t === 'all' || c.t === 'any') && Array.isArray(c.of)) { for (const k of c.of) this.condLeaves(k, out, depth + 1); return out; }
    out.push(c); return out;
  }
  /** Lanterns still to light (in order) on the shortest chain of real threads from your lit lanterns to `id`, and their gold. Empty when it is lit or unreachable. */
  pathInfo(id) {
    const m = this.model;
    if (!id || !this.adj || m.lit(id)) return { steps: [], gold: 0 };
    const isLit = (n) => n === 'hub' || m.lit(n);
    const prev = new Map(), q = [];
    for (const n of this.adj.keys()) if (isLit(n)) { prev.set(n, null); q.push(n); }
    for (let h = 0; h < q.length && !prev.has(id); h++) { const u = q[h]; for (const { to } of this.adj.get(u) || []) { if (prev.has(to) || this.veil.has(to)) continue; prev.set(to, u); q.push(to); } }
    if (!prev.has(id)) return { steps: [], gold: 0 };
    const steps = []; let u = id; while (u && !isLit(u) && steps.length < 80) { steps.push(u); u = prev.get(u); }
    steps.reverse();
    let gold = 0; for (const x of steps) gold += m.costOf(x);
    return { steps, gold };
  }
  /** The condition tile of a locked lantern: one row per leaf condition with its picture (a foe's own portrait), progress ('37 of 50 crows'), a bar and a link into the Almanac. */
  renderTile(id) {
    const m = this.model, n = this.def.nodes[id], ce = m.cache[id], d = ce.d, T = this.pTile;
    T.replaceChildren(); this.tileLink = false;
    const lines = !d.masked && ce.s !== 'lit' && ce.s !== 'fog' && d.rank === 0 ? d.condLines || [] : [];
    T.style.display = lines.length ? '' : 'none';
    if (!lines.length) return;
    const leaves = this.condLeaves(n.unlock);
    const E = (this.data && this.data.enemies) || {};
    lines.forEach((L, i) => {
      const leaf = leaves[i]; const foe = leaf && (leaf.t === 'killEnemy' || leaf.t === 'bossKill') && typeof leaf.id === 'string' && Object.hasOwn(E, leaf.id) ? leaf.id : null;
      const row = el('div', `ts-crow${L.done ? ' done' : ''}`);
      const pic = el('span', 'ts-cpic'); pic.setAttribute('aria-hidden', 'true');
      const url = foe ? this.enemyPortrait(foe) : null;
      if (url) { const im = el('img'); im.setAttribute('src', url); im.setAttribute('alt', ''); im.draggable = false; pic.append(im); }
      else { // no foe: the medallion picture of what is asked (a pine for a chapter, a diamond for an evolution, a head for a hero ...)
        const art = leaf && /^(clearChapter|surviveTime|clearTier|clearTierHeroes|stars)$/.test(leaf.t) ? 'forest' : leaf && leaf.t === 'evolveWeapon' ? 'evolution' : leaf && leaf.t === 'useCharacter' ? 'hero' : leaf && leaf.t === 'startWeapon' ? 'orbit' : 'key';
        const sp = this.atlas.get(art, '#ffd9a0', 'open');
        if (sp) { const cv = el('canvas'); cv.width = 92; cv.height = 92; const g = cv.getContext('2d'); if (g) g.drawImage(sp, 0, 0, 92, 92); pic.append(cv); } else pic.append(el('i', 'ts-cdot'));
      }
      const tx = el('div', 'ts-ctext');
      const nm = foe ? String(E[foe].name || foe).toLowerCase() : '';
      const prog = foe && leaf.t === 'killEnemy' ? `${fmtN(L.cur)} of ${fmtN(L.goal)} ${nm}${L.goal > 1 && !nm.endsWith('s') ? 's' : ''}` : L.goal > 1 ? `${fmtN(L.cur)} of ${fmtN(L.goal)}` : L.done ? 'Done' : 'Not yet';
      tx.append(el('b', null, L.text), el('span', null, L.done ? `${prog} ✓` : prog));
      if (L.goal > 1) { const b = el('div', 'ts-bar2'); const ib = el('b'); ib.style.width = `${Math.round(100 * Math.min(1, L.goal > 0 ? L.cur / L.goal : 0))}%`; b.append(ib); tx.append(b); }
      row.append(pic, tx);
      if (foe && this.host.showAlmanac && this.host.handlers && this.host.handlers.almanacView) {
        const a = btn('ts-btn ts-clink', 'In the Almanac'); a.setAttribute('aria-label', `Open ${E[foe].name || foe} in the Almanac`);
        a.addEventListener('click', () => this.host.showAlmanac('tree', 'foes', `f:${foe}`));
        row.append(a); this.tileLink = true;
      }
      T.append(row);
    });
  }
  /** Path progress chips in the banner: the road the lantern sits on ('5 of 12 to Spirit Bolts') and the way from your light ('4 to go, about 600 gold'). */
  renderChips(id) {
    const m = this.model, C = this.pChips; C.replaceChildren();
    const ce = m.cache[id];
    const road = (this.view.roads || []).find((r) => r.ids.includes(id) || r.to === id);
    if (road && ce.s !== 'fog') {
      let k = 0; for (const x of road.ids) if (m.lit(x)) k++;
      const tc = m.cache[road.to];
      if (this.def.nodes[road.to] && k < road.ids.length && !m.lit(road.to)) C.append(el('span', 'ts-chip', `${k} of ${road.ids.length} to ${tc && !tc.d.masked ? tc.d.name : 'a far lantern'}`));
    }
    if (ce.s !== 'lit' && ce.s !== 'fog' && !(ce.d.masked)) {
      const P = this.pathInfo(id);
      if (P.steps.length > 1) C.append(el('span', 'ts-chip', `${P.steps.length} to go · ~${fmtN(P.gold)} gold`));
    }
    C.style.display = C.childNodes.length ? '' : 'none';
  }

  // ------------------------------------------------------------------ first-visit tour (whispers.js TOUR; due only for a lantern with no finished run)
  tourStart() {
    if (!this.api.tourDue || !this.api.tourDue()) return false;
    this.tourI = 0; this.tourOpen = true;
    this.tourEl.classList.add('open');
    this.tourStep();
    return true;
  }
  tourStep() {
    const S = TOUR[this.tourI]; if (!S) return this.tourEnd();
    for (const e of this.root.querySelectorAll('.ts-tourhl')) e.classList.remove('ts-tourhl');
    this.tourH.textContent = S.t; this.tourP.textContent = S.p;
    this.tourDots.textContent = `${this.tourI + 1} of ${TOUR.length}`;
    this.tourNext.textContent = this.tourI === TOUR.length - 1 ? 'Done' : 'Next';
    let hl = null;
    if (S.at === 'start' && this.starter && this.def.nodes[this.starter.heart]) { const n = this.def.nodes[this.starter.heart]; this.flyTo(n.x, n.y, Math.max(this.cam.z, 0.5)); }
    else if (S.at === 'ready' && this.model.best && this.def.nodes[this.model.best.id]) { const n = this.def.nodes[this.model.best.id]; this.flyTo(n.x, n.y, Math.max(this.cam.z, 0.7)); }
    else if (S.at === 'next') hl = this.root.classList.contains('ts-hero-on') ? this.nextEl : this.stepEl;
    else if (S.at === 'almanac') hl = this.root.classList.contains('ts-hero-on') ? this.heroAlm : null;
    if (hl) hl.classList.add('ts-tourhl');
    this.tourNext.focus({ preventScroll: true });
    this.dirty();
  }
  tourEnd() {
    if (!this.tourOpen) return;
    this.tourOpen = false;
    this.tourEl.classList.remove('open');
    for (const e of this.root.querySelectorAll('.ts-tourhl')) e.classList.remove('ts-tourhl');
    if (this.api.tourSeen) this.api.tourSeen();
    if (this.mapEl) this.mapEl.focus({ preventScroll: true });
  }

  /** Continue from results: fly to what moved and ring those lanterns for a few seconds (a steady ring, no travel, with Calm motion). */
  pulseStart(ids) {
    this.pulseSet = new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === 'string' && this.def.nodes[id]) : []);
    if (!this.pulseSet.size) return;
    this.pulseT0 = performance.now(); this.pulseUntil = this.pulseT0 + 6000;
    const first = [...this.pulseSet][0], n = this.def.nodes[first]; // fly to the first one that moved (tiles come first); every one of them is ringed
    this.flyTo(n.x, n.y, Math.max(this.cam.z, 0.6));
    clearTimeout(this.pulseT); this.pulseT = setTimeout(() => { this.pulseSet = new Set(); this.dirty(); }, 6100);
  }
  drawPulse(t) {
    if (!this.pulseSet || !this.pulseSet.size || performance.now() > this.pulseUntil) return;
    const c = this.ctx, k = this.reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t / 260);
    for (const id of this.pulseSet) {
      const n = this.def.nodes[id]; if (!n || this.veil.has(id)) continue;
      const [x, y] = this.toS(n.x, n.y); if (x < -60 || x > this.W + 60 || y < -60 || y > this.H + 60) continue;
      const r = this.radiusOf(id, this.lodNow || this.lod());
      c.strokeStyle = `rgba(255,246,224,${(0.55 + 0.4 * k).toFixed(2)})`; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r + 8 + (this.reduced ? 0 : 6 * k), 0, 7); c.stroke();
      c.strokeStyle = 'rgba(255,179,90,.45)'; c.lineWidth = 8; c.beginPath(); c.arc(x, y, r + 8 + (this.reduced ? 0 : 6 * k), 0, 7); c.stroke();
    }
    if (!this.reduced) this.animNeeded = true;
  }

  drawWeb(t) {
    const c = this.ctx, z = this.cam.z, cam = this.cam, m = this.model, W = this.W, H = this.H, foc = this.focus;
    const sm = (x, a, b) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
    const lockA = sm(z, 0.1, 0.2), crossA = sm(z, 0.5, 0.66);
    const bright = 0.55 + 0.45 * LOOK.bright;
    const buckets = new Map();
    const th = this.threads || [];
    for (let i = 0; i < th.length; i++) {
      const e = th[i];
      if (this.veil.has(e.a) || this.veil.has(e.b)) continue;
      const ax = (e.ax - cam.x) * z + W / 2, ay = (e.ay - cam.y) * z + H / 2, bx = (e.bx - cam.x) * z + W / 2, by = (e.by - cam.y) * z + H / 2;
      if ((ax < -40 && bx < -40) || (ax > W + 40 && bx > W + 40) || (ay < -40 && by < -40) || (ay > H + 40 && by > H + 40)) continue;
      const ao = e.a === 'hub' || m.lit(e.a), bo = m.lit(e.b);
      const st = ao && bo ? 2 : e.cross ? 0 : ao || bo ? 1 : 0;
      let al = (st > 0 ? 1 : e.cross ? crossA : lockA) * Math.min(this.unfurlA(e.a), this.unfurlA(e.b));
      if (e.hubz && st === 0 && !(foc && foc.edges.has(i))) al *= 0.22; // inside the hub web only the lit threads, the ones next to a lit lantern and the focus path speak; locked requirement lines are a whisper
      if (al < 0.02) continue;
      const fm = foc ? (foc.edges.has(i) ? 1 : 0.4) : 1;
      const col = st === 0 ? '#8592c4' : e.col;
      const soft = e.knot ? 1 : 0; // inside the Hearth ring: thinner and softer, so the cluster reads as a glow with readable lanterns
      const key = `${st}|${col}|${e.cross ? 1 : 0}|${(al * fm).toFixed(2)}|${soft}`;
      let bk = buckets.get(key); if (!bk) { bk = { st, col, a: al * fm, cross: e.cross, soft, path: new Path2D() }; buckets.set(key, bk); }
      bk.path.moveTo(ax, ay); bk.path.quadraticCurveTo((e.cx - cam.x) * z + W / 2, (e.cy - cam.y) * z + H / 2, bx, by);
    }
    c.lineCap = 'round';
    for (const bk of [...buckets.values()].sort((p, q) => p.st - q.st)) {
      if (bk.st === 2) {
        const k = bk.soft ? 0.5 : 1;
        c.globalAlpha = bk.a * (bk.soft ? 0.5 : 1); c.strokeStyle = hexA(bk.col, 0.2 * LOOK.glow); c.lineWidth = (5 * Math.min(z, 1.2) + 3) * k; c.stroke(bk.path);
        c.globalAlpha = bk.a * LOOK.thrLit * bright * (bk.soft ? 0.55 : 1); c.strokeStyle = mix(bk.col, '#fff6e0', 0.35); c.lineWidth = Math.max(bk.soft ? 1 : 1.5, (2 * z + 0.5) * k); c.stroke(bk.path);
      } else if (bk.st === 1) {
        c.globalAlpha = bk.a * LOOK.thrAvail * bright * (bk.soft ? 0.6 : 1); c.strokeStyle = bk.col; c.lineWidth = Math.max(bk.soft ? 0.9 : 1.2, (1.5 * z + 0.4) * (bk.soft ? 0.7 : 1)); c.stroke(bk.path);
      } else {
        c.globalAlpha = bk.a * LOOK.thrLocked * (bk.cross ? 0.8 : 1) * (bk.soft ? 0.7 : 1); c.strokeStyle = bk.col; c.lineWidth = bk.cross ? Math.max(0.8, 0.8 * z) : Math.max(0.9, z); c.stroke(bk.path);
      }
    }
    c.globalAlpha = 1;
    if (foc && foc.edges.size) { // the path from your nearest lit lantern, dashed and bright (it moves unless Calm motion is on)
      c.save(); c.setLineDash([11, 8]); c.lineDashOffset = this.reduced ? 0 : -t / 45; c.lineWidth = Math.max(2.2, 2.6 * z); c.strokeStyle = '#fff1c4'; c.globalAlpha = 0.96;
      c.beginPath();
      for (const i of foc.edges) { const e = th[i]; const [ax, ay] = this.toS(e.ax, e.ay), [bx, by] = this.toS(e.bx, e.by), [qx, qy] = this.toS(e.cx, e.cy); c.moveTo(ax, ay); c.quadraticCurveTo(qx, qy, bx, by); }
      c.stroke(); c.restore();
      if (!this.reduced) this.animNeeded = true;
    }
  }

  // CAN LIGHT NOW (locked): candle-white ring + 8 rays on every affordable lantern; the warm halo is for the ONE best-next lantern
  affordMark(c, x, y, r, pulse, far, isBest) {
    if (isBest || far) {
      const RR = r + (far ? 6 : 12); const h = c.createRadialGradient(x, y, r * 0.6, x, y, RR + 8 * pulse);
      h.addColorStop(0, 'rgba(255,179,90,.32)'); h.addColorStop(1, 'rgba(255,179,90,0)');
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
      if (!this.reduced && lod === 'near') { c.shadowColor = col; c.shadowBlur = 5; }
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
    const r = this.radiusOf(this.model.best.id, lod);
    const bob = this.reduced ? 0 : Math.sin(t / 380) * 3;
    this.pinShape(c, x, y - r - 16 + bob);
  }

  // LABELS: far = no lantern names; mid = only the selected, best-next and can-light lanterns; near = all but not-yet beads;
  // a collision pass keeps names off other names and lanterns (64 px screen grid: linear cost at 1000+ nodes).
  drawLabels(list, lod) {
    const c = this.ctx; const m = this.model; const best = m.best;
    const tr = (L) => this.tierOfId(L.id);
    const quiet = (L) => L.id === this.selected || (best && L.id === best.id) || L.s === 'ready';
    // Q1a names: FAR = landmarks that are lit or next (lit / can light / open); MID = landmark and diamond names; NEAR = every name but beads that are not yet
    // reachable; dots are named at NEAR only
    let pick = lod === 'far' ? list.filter((L) => quiet(L) || (tr(L) === 'landmark' && (L.s === 'lit' || L.s === 'open')))
      : lod === 'mid' ? list.filter((L) => quiet(L) || (tr(L) !== 'dot' && L.s !== 'notyet'))
        : list.filter((L) => L.s !== 'notyet' || L.id === this.selected); // NEAR as before (the sheet's tier table says dots carry no name; its zoom table says NEAR shows all names: kept readable)
    if (this.onlyLight) pick = pick.filter((L) => L.s === 'ready' || L.id === this.selected);
    const fid = this.focus ? this.focus.id : null;
    pick = pick.filter((L) => quiet(L) || L.id === fid || idHash(L.id) < LOOK.labelDensity); // the locked label density: small names show for a share of lanterns, the ones that matter always
    const lms = list.filter((L) => tr(L) === 'landmark' && !(this.farMerged && this.farMerged.has(L.id) && this.farMerged.get(L.id) !== L.id && L.id !== this.selected) && (lod !== 'far' || L.s !== 'notyet') && (!this.onlyLight || L.s === 'ready' || L.id === this.selected));
    pick = pick.filter((L) => tr(L) !== 'landmark');
    const pri = (L) => (L.id === this.selected ? 0 : best && L.id === best.id ? 1 : L.s === 'ready' ? 2 : L.s === 'open' ? 3 : L.s === 'challenge' ? 4 : L.s === 'lit' ? 5 : 6);
    pick.sort((a, b) => pri(a) - pri(b));
    const G = new Map();
    const cells = (b) => { const o = []; for (let i = Math.floor(b.x0 / 64); i <= Math.floor(b.x1 / 64); i++) for (let j = Math.floor(b.y0 / 64); j <= Math.floor(b.y1 / 64); j++) o.push(`${i},${j}`); return o; };
    this.allBoxes = [];
    const addBox = (b) => { this.allBoxes.push(b); for (const k of cells(b)) { if (!G.has(k)) G.set(k, []); G.get(k).push(b); } };
    const hits = (bx, id) => cells(bx).some((k) => (G.get(k) || []).some((b) => b.id !== id && b.x0 < bx.x1 && b.x1 > bx.x0 && b.y0 < bx.y1 && b.y1 > bx.y0));
    for (const L of list) addBox({ x0: L.x - L.r - 3, x1: L.x + L.r + 3, y0: L.y - L.r - 3, y1: L.y + L.r + 3, id: L.id, lm: tr(L) === 'landmark' });
    for (const t of this.toolBoxes || []) addBox({ x0: t.x - t.r, x1: t.x + t.r, y0: t.y - t.r, y1: t.y + t.r, id: 'tool' }); // names keep off the tool coins
    for (const b of this.hubBoxes || []) addBox(b); // and off the hub coin and its caption
    const hitsLm = (bx, id) => cells(bx).some((k) => (G.get(k) || []).some((b) => b.lm && b.id !== id && b.x0 < bx.x1 && b.x1 > bx.x0 && b.y0 < bx.y1 && b.y1 > bx.y0)); // a medallion name only yields to other medallions and their names
    this.lblBoxes = [];
    const uk = this.uk || 1; const lh = Math.round(17 * uk);
    c.font = `${13 * uk}px ${FONT_UI}`; c.textAlign = 'center'; c.textBaseline = 'top';
    const rank = (L) => (L.id === this.selected ? 0 : best && L.id === best.id ? 1 : this.def.nodes[L.id].kind === 'heart' ? 2 : 3);
    for (const L of lms.sort((a, b) => rank(a) - rank(b))) { c.globalAlpha = this.focus && !this.focus.nodes.has(L.id) ? 0.45 : 1; this.landmarkLabel(c, L, uk, hitsLm, addBox); }
    c.globalAlpha = 1;
    c.font = `${13 * uk}px ${FONT_UI}`; c.textAlign = 'center'; c.textBaseline = 'top';
    for (const L of pick) {
      const txt = m.cache[L.id].d.name; const w = this.mw(c, `${13 * uk}px ${FONT_UI}`, txt) + 8;
      const y0 = L.y + L.r + (L.s === 'ready' ? 10 : 5);
      const bx = { x0: L.x - w / 2, x1: L.x + w / 2, y0, y1: y0 + lh };
      if (hits(bx, L.id) || bx.x0 < this.freeRect()[0] + 2) continue;
      addBox(bx);
      c.globalAlpha = this.focus && !this.focus.nodes.has(L.id) ? 0.45 : 1;
      c.fillStyle = 'rgba(10,14,28,.55)'; c.fillRect(bx.x0 + 2, bx.y0 + 1, w - 4, lh - 2); // R2: a light plate (outlined text for every small name cost too much per frame)
      c.fillStyle = L.s === 'ready' ? '#fff6e0' : L.s === 'lit' ? '#fff3dc' : L.s === 'open' ? '#f5dfae' : L.s === 'challenge' ? '#9fe6dc' : '#b3bbcf';
      c.fillText(txt, L.x, y0 + 1);
    }
    c.globalAlpha = 1;
    this.drawChips(c);
  }
  drawRegionNames(lod) {
    const c = this.ctx; const z = this.cam.z; const m = this.model;
    const rboxes = this.lastRB = [];
    if (lod === 'near') return;
    c.textBaseline = 'middle';
    const byNear = [...this.view.regions].sort((a, b) => Math.hypot(a.x - this.cam.x, a.y - this.cam.y) - Math.hypot(b.x - this.cam.x, b.y - this.cam.y));
    for (const r of byNear) {
      if (r.kind === 'rings' || !r.ids.length) continue; // the hub needs no name: it is the lantern
      if (r.kind === 'cluster') continue; // R2: a spirit's name is the label of its heart medallion (landmarkLabel), not a second title above the constellation
      const coinTool = r.kind === 'tool' && this.toolLm && this.toolLm.get(r.key) === false; // a tool group shown as a picture coin: its name sits under the coin
      if (r.kind === 'tool' && !coinTool) continue; // tool groups whose own landmarks carry the names
      let [sx, sy] = this.toS(r.x, r.y);
      if (coinTool) sy += this.toolR(this.boost()) + 20 * (this.uk || 1);
      const [fx0, fy0, fx1, fy1] = this.freeRect();
      if (sx < fx0 || sx > fx1 || sy < fy0 || sy > fy1) continue; // only the constellations in view
      const uk = this.uk || 1; const fs = Math.max(11, Math.min(this.small ? 13 : 18, 70 * z)) * uk;
      c.font = `${fs}px ${FONT_HEAD}`; c.textAlign = 'center';
      const name = r.done ? `${r.name} ✓` : r.name; const nw = c.measureText(name).width;
      const badge = r.light > 0; const bw = badge ? 24 * uk : 0;
      sx = clamp(sx, fx0 + nw / 2 + 8, Math.max(fx0 + nw / 2 + 8, fx1 - nw / 2 - bw - 8 - (this.small ? 54 : 0))); // a name is never cut off by the edge or hidden under the tools
      sy = clamp(sy, fy0 + fs / 2 + 6, Math.max(fy0 + fs / 2 + 6, fy1 - fs / 2 - 6));
      const rb = { x0: sx - nw / 2 - 6, x1: sx + nw / 2 + 6 + bw, y0: sy - fs / 2 - 3, y1: sy + fs / 2 + 3 };
      if (rboxes.some((b) => b.x0 < rb.x1 && b.x1 > rb.x0 && b.y0 < rb.y1 && b.y1 > rb.y0)) continue;
      rboxes.push(rb);
      const awake = r.kind !== 'cluster' || m.awake(r);
      c.fillStyle = r.done ? '#ffe39a' : awake ? 'rgba(255,243,220,.95)' : 'rgba(179,187,207,.85)';
      c.fillText(name, sx, sy);
      if (badge) { const bx = sx + nw / 2 + 14 * uk; c.fillStyle = '#fff6e0'; c.beginPath(); c.arc(bx, sy, 10 * uk, 0, 7); c.fill(); c.fillStyle = '#3a2412'; c.font = `bold ${12 * uk}px ${FONT_UI}`; c.fillText(String(r.light), bx, sy + 1); }
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
    const sig = `${this.cam.x.toFixed(1)},${this.cam.y.toFixed(1)},${this.cam.z.toFixed(4)},${this.W},${this.H},${this.uk || 1},${this.selected},${this.itemSig}`;
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
      const r = Math.max(22, this.radiusOf(id, lod) + 4);
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
    this.setFocus();
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
    this.renderTile(id); this.renderChips(id);
    this.pSteps.replaceChildren();
    const tileOn = this.pTile.style.display !== 'none';
    const condText = new Set(tileOn ? (d.condLines || []).map((L) => `${L.text}: ${fmtN(L.cur)} / ${fmtN(L.goal)}`) : []); // the tile already shows these
    m.steps(id).filter((S) => !condText.has(S.t)).forEach((S, i) => {
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
    if (this.almBtn) this.almBtn.hidden = !(this.host.handlers && this.host.handlers.almanacView && (id === 'br_almanac' || /^bs_/.test(id)) && !this.tileLink); // the tile's own link goes to the foe's entry
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
  // One-time notice after the v5 restart (notes.treeResetNotice): every lit lantern was returned in full. Numbers are re-validated here, text only via
  // textContent, dismissable; it is cleared from the save when dismissed or when the tree is closed (so it shows once).
  resetNotice() {
    const s = this.api.save();
    const n = s && s.notes && s.notes.treeResetNotice;
    if (!n || typeof n !== 'object') return;
    const q = (v) => { const x = Math.floor(Number(v)); return Number.isFinite(x) && x > 0 ? Math.min(x, 1e9) : 0; };
    const nodes = q(n.nodes), gold = q(n.gold), shards = q(n.shards), glass = q(n.glass);
    if (!nodes) { if (this.api.clearResetNotice) this.api.clearResetNotice(); return; }
    const back = [`${fmtN(gold)} gold`]; if (shards) back.push(`${fmtN(shards)} shards`); if (glass) back.push(`${fmtN(glass)} Dawnglass`);
    const h = el('div', 'ts-noticeh', 'The Lantern Web was rewoven');
    const p = el('p', 'ts-noticep', `All ${fmtN(nodes)} of your lit lanterns were put out and paid back in full: ${back.join(', ')}. Your own spirit is still lit. Spend it again as you like.`);
    const b = btn('ts-btn', 'Got it');
    b.addEventListener('click', () => this.dismissNotice());
    this.noticeEl.replaceChildren(h, p, b);
    this.noticeEl.classList.add('open');
    this.noticeShown = true;
  }
  dismissNotice() {
    this.noticeEl.classList.remove('open');
    if (this.noticeShown && this.api && this.api.clearResetNotice) this.api.clearResetNotice();
    this.noticeShown = false;
  }

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
      if (!this.ptrs.has(e.pointerId)) { this.hover(e); return; }
      if (this.hoverEl) this.hoverEl.classList.remove('on');
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
    map.addEventListener('pointerleave', () => { if (this.hoverEl) { this.hoverEl.classList.remove('on'); this.hoverId = null; } });
    map.addEventListener('pointerup', up);
    map.addEventListener('pointercancel', up);
    map.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = this.rel(e); this.zoomAt(x, y, Math.exp(-clamp(e.deltaY, -300, 300) * 0.0015)); }, { passive: false });
  }

  /** DESKTOP D3: hover preview. Mouse only; text comes from the model, set as plain text. Positions are real pixels, the layer may be zoomed (Menu size), so divide by --uik. */
  hover(e) {
    if (!this.hoverEl) return;
    const off = () => { this.hoverEl.classList.remove('on'); this.hoverId = null; if (this.hoverFocus) { this.hoverFocus = null; this.setFocus(); this.dirty(); } if (this.mapEl) this.mapEl.style.cursor = ''; };
    if (e.pointerType !== 'mouse' || this.ptrs.size || this.sheetOpen || this.cam.z < this.view.lod.far) { off(); return; }
    const [x, y] = this.rel(e);
    const id = this.hitNode(x, y);
    if (!id) { off(); return; }
    if (this.mapEl) this.mapEl.style.cursor = 'pointer';
    if (id !== this.hoverId) {
      const ce = this.model.cache[id]; const d = ce.d;
      this.hoverId = id;
      this.hoverFocus = id; this.setFocus(); this.dirty(); // the path from your nearest lit lantern lights up, the rest steps back
      this.hoverName.textContent = d.name;
      this.hoverState.textContent = this.model.stateText(id);
      this.hoverState.className = `ts-hover__s ts-st-${ce.s}`;
      const t = String(d.desc || '');
      this.hoverDesc.textContent = t.length > 110 ? `${t.slice(0, 107)}...` : t;
    }
    const k = Number(document.documentElement.style.getPropertyValue('--uik')) || 1;
    const w = this.hoverEl.offsetWidth * k || 240, h = this.hoverEl.offsetHeight * k || 90;
    const px = Math.min(Math.max(8, x + 18), this.W - w - 8), py = y + 22 + h > this.H - 8 ? y - h - 14 : y + 22;
    this.hoverEl.style.left = `${Math.round(px / k)}px`; this.hoverEl.style.top = `${Math.round(Math.max(8, py) / k)}px`;
    this.hoverEl.classList.add('on');
  }

  hitNode(sx, sy) {
    const [wx, wy] = this.toW(sx, sy);
    const reach = 60 / this.cam.z;
    let bestId = null, bd = Infinity;
    const lodH = this.lodNow || this.lod();
    for (const [cx, cy] of this.cellsIn(wx - reach, wy - reach, wx + reach, wy + reach)) {
      for (const id of this.def.cells.get(`${cx},${cy}`) || []) {
        if (!this.shownAt(id, lodH)) continue; // a lantern that is not drawn at this zoom cannot be hit by accident
        const n = this.def.nodes[id]; const d = Math.hypot(n.x - wx, n.y - wy) * this.cam.z;
        if (d < bd) { bd = d; bestId = id; }
      }
    }
    if (!bestId) return null;
    const hit = Math.max(22 * (this.uk || 1), this.radiusOf(bestId, lodH) * 1.15); // 44 px touch target at least (invisible padding around small medallions)
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
    if (this.tourOpen && k === 'Escape') { e.preventDefault(); this.tourEnd(); return; } // Esc skips the tour first
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
