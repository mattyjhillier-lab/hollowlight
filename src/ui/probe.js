// C0: ?probe=1 viewport overlay (debug only, never saved). Shows what the browser reports so a screenshot from a real iPhone (installed to the
// Home Screen = standalone) can explain the dead band at the bottom of the Home screen. Everything is written with textContent.
import { bootLines } from './bootguard.js';
export function probeLines(win = window, doc = document) {
  const root = doc.documentElement, vv = win.visualViewport || null;
  const box = (id) => { const e = doc.getElementById(id); if (!e) return `${id}: none`; const r = e.getBoundingClientRect(); return `${id}: ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`; };
  const unit = (u) => { const t = doc.createElement('div'); t.style.cssText = `position:fixed;left:0;top:0;width:1px;height:100${u};visibility:hidden;pointer-events:none`; doc.body.appendChild(t); const h = t.getBoundingClientRect().height; t.remove(); return Math.round(h); };
  const sa = (() => { const t = doc.createElement('div'); t.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;padding:var(--sa-t,0px) var(--sa-r,0px) var(--sa-b,0px) var(--sa-l,0px)'; doc.body.appendChild(t); const c = win.getComputedStyle(t); const v = `T${c.paddingTop} R${c.paddingRight} B${c.paddingBottom} L${c.paddingLeft}`; t.remove(); return v; })();
  const mm = (q) => (win.matchMedia ? win.matchMedia(q).matches : false);
  const sc = win.screen || {};
  return [
    `inner ${win.innerWidth}x${win.innerHeight}  dpr ${win.devicePixelRatio}`,
    `visualViewport ${vv ? `${Math.round(vv.width)}x${Math.round(vv.height)} off ${Math.round(vv.offsetLeft)},${Math.round(vv.offsetTop)} scale ${vv.scale}` : 'n/a'}`,
    `screen ${sc.width}x${sc.height} avail ${sc.availWidth}x${sc.availHeight}`,
    `100vh ${unit('vh')}  100dvh ${unit('dvh')}  100svh ${unit('svh')}  100lvh ${unit('lvh')}`,
    `html.phone ${root.classList.contains('phone')}  html.standalone ${root.classList.contains('standalone')}  html.touch ${root.classList.contains('touch')}  coarse ${mm('(pointer: coarse)')}`,
    `display-mode standalone ${mm('(display-mode: standalone)')}  navigator.standalone ${!!(win.navigator && win.navigator.standalone)}  ${mm('(orientation: landscape)') ? 'landscape' : 'portrait'}`,
    `safe-area ${sa}  --app-h ${root.style.getPropertyValue('--app-h') || 'unset'}`,
    ...(win.__boot ? bootLines(win, win.__boot) : ['boot guard: none']),
    box('app'), box('stage'), box('ui'),
    ...[...doc.querySelectorAll('#ui > .overlay')].filter((e) => e.style.display !== 'none').map((e) => { const r = e.getBoundingClientRect(); return `${e.className.split(' ').slice(-1)[0]}: ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`; }),
  ];
}

export function initProbe(win = window, doc = document) {
  let on = false;
  try { on = new URLSearchParams(win.location.search).get('probe') === '1'; } catch (e) { on = false; }
  if (!on || !doc.body) return null;
  const el = doc.createElement('pre');
  el.id = 'probe';
  el.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99999;margin:0;padding:6px 8px;max-width:96vw;font:11px/1.35 ui-monospace,Menlo,Consolas,monospace;color:#0f0;background:#000c;border:1px solid #0f0;white-space:pre-wrap;pointer-events:none';
  doc.body.appendChild(el);
  // dashed frame at the fixed-inset-0 edge: a dead band shows as a gap between it and the real screen edge
  const fr = doc.createElement('div');
  fr.style.cssText = 'position:fixed;inset:0;z-index:99998;border:2px dashed #0f0;pointer-events:none;box-sizing:border-box';
  doc.body.appendChild(fr);
  const tick = () => { el.textContent = probeLines(win, doc).join('\n'); };
  tick();
  win.addEventListener('resize', tick);
  win.setInterval(tick, 1000);
  return el;
}
