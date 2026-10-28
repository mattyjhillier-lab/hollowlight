// DOM for the install / full-screen card, the pause/settings Fullscreen entry and the update notice.
// createElement + textContent only. Used by menus only (title, pause, settings), never during a run.

const SVGNS = 'http://www.w3.org/2000/svg';

function mk(doc, tag, cls, text) {
  const n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
function btn(doc, cls, text, onClick) {
  const b = mk(doc, 'button', cls, text);
  b.setAttribute('type', 'button');
  b.addEventListener('click', onClick);
  return b;
}
function svgEl(doc, tag, attrs) {
  const n = doc.createElementNS(SVGNS, tag);
  for (const k of Object.keys(attrs)) n.setAttribute(k, attrs[k]);
  return n;
}
function icon(doc, kind) {
  const s = svgEl(doc, 'svg', { viewBox: '0 0 32 32', width: '32', height: '32', 'aria-hidden': 'true', class: 'pwa-ico' });
  const st = { fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  if (kind === 'share') {
    s.append(svgEl(doc, 'path', { ...st, d: 'M9 14v11h14V14M16 20V5M11 10l5-5 5 5' }));
  } else if (kind === 'add') {
    s.append(svgEl(doc, 'rect', { ...st, x: '5', y: '5', width: '22', height: '22', rx: '4' }), svgEl(doc, 'path', { ...st, d: 'M16 11v10M11 16h10' }));
  } else {
    s.append(svgEl(doc, 'path', { ...st, d: 'M12 10c0-5 8-5 8 0M10 11h12l2 3H8zM9 14h14c1 4 1 8 0 12H9c-1-4-1-8 0-12zM9 26h14' }), svgEl(doc, 'path', { fill: 'currentColor', d: 'M16 15c3 3 4 5 3 7s-6 2-6 0 2-4 3-7z' }));
  }
  return s;
}

function iosGuide(doc, p) {
  const box = mk(doc, 'div', 'pwa-steps');
  const steps = [['share', 'Tap Share, the square with an arrow.'], ['add', 'Choose Add to Home Screen.'], ['lantern', 'Open Wispwick from the new icon.']];
  steps.forEach(([k, t], i) => {
    const s = mk(doc, 'div', 'pwa-step');
    s.append(icon(doc, k), mk(doc, 'span', 'pwa-num', String(i + 1)), mk(doc, 'span', '', t));
    box.append(s);
  });
  if (!p.iosSafari) box.append(mk(doc, 'div', 'pwa-note', 'Open this page in Safari first.'));
  box.append(mk(doc, 'div', 'pwa-note', 'The installed app has its own save. Before installing, use Settings > Export save here, then Import in the app.'));
  return box;
}

// Title-screen card + quiet footer link. `after` is the node to insert the card slot after.
export function mountInstallCard(doc, pwa, parent, after) {
  const slot = mk(doc, 'div', 'pwa-slot');
  if (after && after.parentNode === parent) parent.insertBefore(slot, after.nextSibling); else parent.append(slot);
  const link = btn(doc, 'pwa-link', 'Install / Full screen', () => { forced = !forced; render(); });
  parent.append(link);
  let forced = false;
  let unsub = null;
  function render() {
    if (!slot.isConnected) { if (unsub) unsub(); return; }
    link.style.display = pwa.showFooterLink() ? '' : 'none';
    slot.replaceChildren();
    if (!(forced ? pwa.showFooterLink() : pwa.shouldShowCard())) return;
    const card = mk(doc, 'div', 'pwa-card');
    card.append(mk(doc, 'div', 'pwa-title', 'Play full screen'), mk(doc, 'div', 'pwa-text', 'Install Wispwick for the best experience: full screen, no browser bars, works offline.'));
    if (pwa.state().iosSteps) card.append(iosGuide(doc, pwa.platform));
    const row = mk(doc, 'div', 'pwa-row');
    if (pwa.canInstall()) row.append(btn(doc, 'btn', 'Install', () => { pwa.install(); }));
    if (pwa.canFullscreen()) row.append(btn(doc, 'btn', pwa.isFullscreen() ? 'Exit full screen' : 'Full screen', () => { pwa.toggleFullscreen(); }));
    row.append(btn(doc, 'btn pwa-no', 'Not now', () => { forced = false; pwa.dismiss(); render(); }));
    card.append(row);
    slot.append(card);
  }
  unsub = pwa.subscribe(render);
  render();
  return slot;
}

// Pause / Settings entry. Fullscreen toggle where the API exists; on iPhone Safari the install steps hint instead.
export function fullscreenEntry(doc, pwa, cls = 'btn') {
  const wrap = mk(doc, 'div', 'pwa-entry');
  let unsub = null;
  let live = false;
  const render = () => {
    if (live && !wrap.isConnected) { if (unsub) unsub(); return; }
    wrap.replaceChildren();
    if (pwa.canFullscreen()) {
      wrap.append(btn(doc, cls, pwa.isFullscreen() ? 'Exit full screen' : 'Full screen', () => { pwa.toggleFullscreen(); }));
    } else if (pwa.state().iosSteps) {
      wrap.append(mk(doc, 'div', 'note', 'Full screen on iPhone: tap Share, then Add to Home Screen, then open Wispwick from the new icon.'));
    }
  };
  render();
  if (!wrap.childNodes.length) return null;
  unsub = pwa.subscribe(render);
  // Connected by the caller right after this returns; from then on a disconnected entry unsubscribes itself.
  Promise.resolve().then(() => { live = true; });
  return wrap;
}

// "New version ready: Reload" for title and pause menus. Hidden until a new service worker is waiting.
export function updateNotice(doc, pwa) {
  const box = mk(doc, 'div', 'pwa-update');
  box.append(mk(doc, 'span', '', 'New version ready'), btn(doc, 'btn', 'Reload', () => pwa.applyUpdate()));
  let unsub = null;
  let live = false;
  const render = () => {
    if (live && !box.isConnected) { if (unsub) unsub(); return; }
    box.style.display = pwa.updateReady() ? '' : 'none';
  };
  unsub = pwa.subscribe(render);
  render();
  Promise.resolve().then(() => { live = true; });
  return box;
}
