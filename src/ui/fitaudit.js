// Text-fit audit (debug / regression aid, never used by the game itself). Finds text that does not fit inside its box or the screen.
// Browser: open the game with ?debug=1, then in the console run  __fitAudit()  on any screen. It returns [{sel, text, why, over}].
// A finding is: (a) text clipped by an ancestor with overflow hidden/clip/auto, (b) text sticking out past its nearest bordered / filled box
// (bubble, card, button, panel), or (c) text outside the viewport. Reads layout only; never changes the page.
const SKIP = new Set(['SCRIPT', 'STYLE', 'CANVAS', 'SVG', 'PATH', 'INPUT', 'TEXTAREA']);
const filled = (cs) => (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') || cs.backgroundImage !== 'none'
  || ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none');
const sel = (el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : ''}`;

export function fitAudit(doc = document, win = window, tol = 1.5) {
  const out = [];
  const W = win.innerWidth, H = win.innerHeight;
  const seen = new Set();
  const all = doc.querySelectorAll('#ui *, .pwa-card, .fm-plate, .tip, [role="tooltip"]');
  for (const el of all) {
    if (SKIP.has(el.tagName.toUpperCase()) || seen.has(el)) continue;
    const cs = win.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
    let txt = '';
    for (const n of el.childNodes) if (n.nodeType === 3) txt += n.nodeValue;
    txt = txt.trim();
    if (!txt) continue;
    // hidden by an ancestor?
    let hid = false;
    for (let a = el.parentElement; a && a !== doc.body; a = a.parentElement) { const c = win.getComputedStyle(a); if (c.display === 'none' || c.visibility === 'hidden') { hid = true; break; } }
    if (hid || !el.getClientRects().length) continue;
    if (cs.clip !== 'auto' && cs.clip !== '' || cs.clipPath !== 'none') continue; // visually hidden (screen-reader) text
    const eb = el.getBoundingClientRect();
    if (eb.width <= 2 || eb.height <= 2) continue; // screen-reader-only text (1px clip box)
    const r = doc.createRange();
    r.selectNodeContents(el);
    const rects = [...r.getClientRects()].filter((q) => q.width > 0 && q.height > 0);
    if (!rects.length) continue;
    const tr = { l: Math.min(...rects.map((q) => q.left)), t: Math.min(...rects.map((q) => q.top)), r: Math.max(...rects.map((q) => q.right)), b: Math.max(...rects.map((q) => q.bottom)) };
    if (tr.r - tr.l < 2) continue;
    const add = (why, over) => { seen.add(el); out.push({ sel: sel(el), text: txt.slice(0, 48), why, over: Math.round(over) }); };
    // (c) viewport (text inside a horizontal scroller is reachable by scrolling)
    let inSX = false;
    for (let a = el; a && a !== doc.body; a = a.parentElement) { const c = win.getComputedStyle(a); if (c.overflowX === 'auto' || c.overflowX === 'scroll') { inSX = true; break; } }
    if (!inSX && (tr.l < -tol || tr.r > W + tol)) { add('outside the screen (sideways)', Math.max(-tr.l, tr.r - W)); continue; }
    // (a) clipped by an ancestor (or itself)
    let clipped = false, scrX = false, scrY = false; // once inside a scroller, off-box text on that axis is reachable by scrolling, not lost
    for (let a = el; a && a !== doc.body; a = a.parentElement) {
      const c = win.getComputedStyle(a);
      if (c.overflowX === 'visible' && c.overflowY === 'visible') continue;
      const b = a.getBoundingClientRect();
      const isSX = c.overflowX === 'auto' || c.overflowX === 'scroll', isSY = c.overflowY === 'auto' || c.overflowY === 'scroll';
      const ox = (c.overflowX !== 'visible' && !isSX && !scrX) ? Math.max(b.left - tr.l, tr.r - b.right) : 0;
      const oy = (c.overflowY !== 'visible' && !isSY && !scrY) ? Math.max(b.top - tr.t, tr.b - b.bottom) : 0;
      if (ox > tol || oy > tol) { add(`clipped by ${sel(a)} (${c.overflowX}/${c.overflowY})`, Math.max(ox, oy)); clipped = true; break; }
      if (isSX) scrX = true;
      if (isSY) scrY = true;
      if (c.textOverflow === 'ellipsis' && a.scrollWidth > a.clientWidth + tol) { add(`ellipsis-truncated in ${sel(a)}`, a.scrollWidth - a.clientWidth); clipped = true; break; }
    }
    if (clipped) continue;
    // (b) sticks out of its nearest filled / bordered box
    for (let a = el; a && a !== doc.body; a = a.parentElement) {
      const c = win.getComputedStyle(a);
      if (!filled(c) || a.id === 'ui' || /overlay|layer-/.test(typeof a.className === 'string' ? a.className : '')) continue;
      const b = a.getBoundingClientRect();
      if (b.width < 8 || b.height < 8) continue;
      const over = scrY ? Math.max(b.left - tr.l, tr.r - b.right) : Math.max(b.left - tr.l, tr.r - b.right, b.top - tr.t, tr.b - b.bottom); // inside a vertical scroller the edge cut is just scrolling
      if (over > tol) add(`sticks out of ${sel(a)}`, over);
      break;
    }
  }
  return out;
}


// PHONE-A layout audit (debug / regression aid): things the text-fit check cannot see.
//  (1) dead gutters: on a phone-shaped screen (html.phone) #stage must fill the viewport (>= 98% each way);
//  (2) scroll panels with no visible cue: a menu panel that scrolls must carry data-sc (edge fade, src/ui/phone.js) while content lies beyond an edge;
//  (3) controls hidden by a clipping ancestor: a visible button / tab / input cut off by an overflow:hidden|clip box (not reachable by scrolling);
//  (4) controls inside the safe-area insets (notch, rounded corners, gesture bar), read from the --sa-* frame.
export function layoutAudit(doc = document, win = window, tol = 2) {
  const out = [];
  const root = doc.documentElement, W = win.innerWidth, H = win.innerHeight, phone = root.classList.contains('phone');
  const add = (sel_, text, why, over) => out.push({ sel: sel_, text: String(text || '').slice(0, 48), why, over: Math.round(over) });
  const stage = doc.getElementById('stage');
  if (phone && stage) {
    const b = stage.getBoundingClientRect();
    if (b.width < W * 0.98 - tol) add('#stage', '', `dead gutters: stage ${Math.round(b.width)}px of ${W}px wide`, W - b.width);
    if (b.height < H * 0.98 - tol) add('#stage', '', `dead gutters: stage ${Math.round(b.height)}px of ${H}px high`, H - b.height);
  }
  const vis = (el, cs) => cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) !== 0 && el.getClientRects().length > 0 && !el.closest('[hidden],[inert],.fm-sr');
  if (phone) {
    for (const el of doc.querySelectorAll('#ui .overlay, #ui .overlay *')) {
      const cs = win.getComputedStyle(el);
      if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') continue;
      if (!vis(el, cs) || el.clientHeight < 8) continue;
      if (el.scrollHeight > el.clientHeight + tol && !el.dataset.sc) {
        const atTop = el.scrollTop <= tol, atBot = el.scrollTop + el.clientHeight >= el.scrollHeight - tol;
        if (!(atTop && atBot)) add(sel(el), '', 'scrolls but shows no scroll cue (data-sc missing)', el.scrollHeight - el.clientHeight);
      }
    }
  }
  const probe = doc.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;padding:var(--sa-t,0px) var(--sa-r,0px) var(--sa-b,0px) var(--sa-l,0px)';
  doc.body.appendChild(probe);
  const pcs = win.getComputedStyle(probe), sa = { t: parseFloat(pcs.paddingTop) || 0, r: parseFloat(pcs.paddingRight) || 0, b: parseFloat(pcs.paddingBottom) || 0, l: parseFloat(pcs.paddingLeft) || 0 };
  probe.remove();
  for (const el of doc.querySelectorAll('#ui button, #ui [role=tab], #ui input, #ui select')) {
    const cs = win.getComputedStyle(el);
    if (!vis(el, cs)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (el.classList.contains('ts-item') || el.closest('.sr, .sr-only') || /(^|\s)(sr|ts-sr)(\s|$)/.test(typeof el.className === 'string' ? el.className : '')) continue;
    const label = (el.textContent || el.getAttribute('aria-label') || el.type || '').trim();
    // (3) cut off by a clipping ancestor that does not scroll
    let scrX = false, scrY = false; // once inside a scroller on an axis, being past its edge on that axis is reachable by scrolling
    for (let a = el.parentElement; a && a !== doc.body; a = a.parentElement) {
      const c = win.getComputedStyle(a);
      const sx = c.overflowX === 'auto' || c.overflowX === 'scroll', sy = c.overflowY === 'auto' || c.overflowY === 'scroll';
      if (c.overflowX === 'visible' && c.overflowY === 'visible') continue;
      const b = a.getBoundingClientRect();
      if (b.width >= 8 && b.height >= 8) {
        const ox = (sx || scrX) ? 0 : Math.max(b.left - r.left, r.right - b.right), oy = (sy || scrY) ? 0 : Math.max(b.top - r.top, r.bottom - b.bottom);
        if ((c.overflowX !== 'visible' && ox > tol + 2) || (c.overflowY !== 'visible' && oy > tol + 2)) { add(sel(el), label, `control cut off by ${sel(a)} (${c.overflowX}/${c.overflowY})`, Math.max(ox, oy)); break; }
      }
      if (sx) scrX = true;
      if (sy) scrY = true;
    }
    // (4) safe-area frame (only meaningful when there are insets)
    if (sa.l + sa.r + sa.t + sa.b > 0 && (r.left < sa.l - tol || r.right > W - sa.r + tol || r.top < sa.t - tol || r.bottom > H - sa.b + tol) && !el.closest('.overlay.u3, .mnav, #game')) add(sel(el), label, 'control inside the safe-area inset', 0);
  }
  return out;
}

// Walk every menu screen at the three text sizes and report what does not fit (debug only). Run in the console: await __fitSweep()
export async function fitSweep(app, doc = document, win = window, sizes = ['normal', 'large', 'larger']) {
  const ui = app.ui, wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const screens = {
    front: () => { ui.hideAll(); ui.showStart(ui.onPick); },
    chars: () => ui.navTo('character'), tree: () => ui.navTo('tree'), goals: () => ui.navTo('goals'), almanac: () => ui.navTo('almanac'), settings: () => ui.navTo('settings'),
    hero: () => { ui.hideAll(); ui.showStart(ui.onPick); ui.showHeroSelect(); }, lanterns: () => { ui.hideAll(); ui.showLanterns('pick'); },
  };
  const tabs = { settings: '.layer-settings [role=tab]', almanac: '.layer-codex [role=tab]' };
  const rep = {};
  const root = doc.documentElement;
  for (const sz of sizes) {
    if (sz === 'normal') delete root.dataset.text; else root.dataset.text = sz;
    await wait(150);
    for (const [name, open] of Object.entries(screens)) {
      open(); await wait(450);
      const variants = [[name, null]];
      if (tabs[name]) doc.querySelectorAll(tabs[name]).forEach((t, i) => { if (i) variants.push([`${name}:${(t.textContent || '').trim().slice(0, 10)}`, t]); });
      for (const [vn, t] of variants) {
        if (t) { t.click(); await wait(300); }
        const f = fitAudit(doc, win).concat(layoutAudit(doc, win));
        const small = [...doc.querySelectorAll('#ui button, #ui [role=tab]')].filter((b) => b.offsetParent && (b.getBoundingClientRect().width < 40 || b.getBoundingClientRect().height < 40) && !/sr$/.test(typeof b.className === 'string' ? b.className : '')).map((b) => `${b.className}|${Math.round(b.getBoundingClientRect().width)}x${Math.round(b.getBoundingClientRect().height)}`);
        const hs = doc.documentElement.scrollWidth > win.innerWidth + 1;
        if (f.length || small.length || hs) rep[`${sz}/${vn}`] = `${f.length} ${[...new Set(f.map((x) => `${x.sel}[${x.over}]:${x.text.slice(0, 16)} <${x.why.slice(0, 60)}>`))].join(' ; ')}${small.length ? ` SMALL ${small.slice(0, 4).join(' ; ')}` : ''}${hs ? ' HSCROLL' : ''}`;
      }
    }
  }
  delete root.dataset.text;
  return { viewport: `${win.innerWidth}x${win.innerHeight}`, problems: Object.keys(rep).length, rep };
}

// In-run screens (open the game with ?debug=1&auto=wren&seed=1&t=200&god=1): HUD, event toast, pause, level-up cards, results. Console: await __fitSweepRun()
export async function fitSweepRun(app, doc = document, win = window, sizes = ['normal', 'large', 'larger']) {
  const ui = app.ui, wait = (ms) => new Promise((r) => setTimeout(r, ms)), root = doc.documentElement, rep = {};
  const note = (k, f) => { if (f.length) rep[k] = `${f.length} ${[...new Set(f.map((x) => `${x.sel}[${x.over}]:${x.text.slice(0, 16)} <${x.why.slice(0, 60)}>`))].join(' ; ')}`; };
  for (const sz of sizes) {
    if (sz === 'normal') delete root.dataset.text; else root.dataset.text = sz;
    await wait(1200);
    note(`${sz}/hud`, fitAudit(doc, win).concat(layoutAudit(doc, win)));
    if (ui.toast) { ui.toast('A long event label to test wrapping: The Hollow Knot wakes, burn it out'); await wait(400); note(`${sz}/toast`, fitAudit(doc, win)); }
    app.togglePause(); await wait(600); note(`${sz}/pause`, fitAudit(doc, win).concat(layoutAudit(doc, win))); app.togglePause(); await wait(300);
    const sim = app.sim;
    if (sim && sim.state === 'running') { sim.beginLevelUp(); ui.showLevelUp(sim); await wait(900); note(`${sz}/levelup`, fitAudit(doc, win).concat(layoutAudit(doc, win))); ui.hideLevelUp(); sim.state = 'running'; }
    if (ui.wPlate) { // whisper bubble: a long two-line plate must fit the screen at every text size
      ui.wPlate.show({ id: 'move', parts: [{ text: 'Walk with ' }, { key: 'WASD' }, { text: ' or the arrow keys, the spirits follow your light' }], w: 'Take it slow. The dark will wait for you a little while.', skip: 'tap to hide' }, 1, false, []);
      await wait(600); note(`${sz}/whisper`, fitAudit(doc, win).concat(layoutAudit(doc, win))); ui.wPlate.show(null, 0, false, []);
    }
    for (const id of ['lamp', 'road', 'knot', 'blessing', 'evolution', 'shard', 'ability']) { // FIX3 new-feature cards: fit + the big button is >= 44 px
      app.introReplay(); const want = ['lamp', 'road', 'knot', 'blessing', 'evolution', 'shard', 'ability'].indexOf(id);
      for (let i = 0; i < want; i++) { await wait(450); if (ui.introView) ui.introView.finish(); }
      await wait(450); note(`${sz}/intro-${id}`, fitAudit(doc, win));
      const b = doc.querySelector('.fx3-btn'); if (!b || b.getBoundingClientRect().height < 44) rep[`${sz}/intro-${id}-btn`] = 'button < 44px or missing';
      ui.hideIntro();
    }
    if (sim) { const st = sim.state; sim.state = 'dead'; try { ui.showEnd(sim, app.bankRun(sim)); await wait(1800); note(`${sz}/results`, fitAudit(doc, win).concat(layoutAudit(doc, win))); } catch (e) { rep[`${sz}/results`] = `ERR ${e.message}`; } ui.hideEnd(); sim.state = st; }
  }
  delete root.dataset.text;
  return { viewport: `${win.innerWidth}x${win.innerHeight}`, problems: Object.keys(rep).length, rep };
}

if (typeof window !== 'undefined' && /[?&]debug=1/.test(window.location.search)) { window.__fitAudit = () => fitAudit().concat(layoutAudit()); window.__layoutAudit = () => layoutAudit(); window.__fitSweep = (sizes) => fitSweep(window.__app, document, window, sizes); window.__fitSweepRun = (sizes) => fitSweepRun(window.__app, document, window, sizes); }
