// Settings screen in the Lantern Glass, Lit look (U4). Pure DOM construction via the kit (createElement + textContent only, never innerHTML),
// so nothing read from a save or a file can become markup. Every setting that existed before is here with the same key and the same handler.
import { el, kitRoot, panel, button, toggle, tabs, slider } from './kit.js';
import { SET } from './u4copy.js';
import { ABOUT } from './aboutcopy.js';
import { SAFE, downloadText } from './savesafety.js';
import { TEXT_COPY } from './textsize.js';
import { UI_SCALE_COPY, cleanUiScale } from './uiscale.js';
import { buildKeyRemap } from './keysui.js';

const add = (p, ...kids) => { for (const k of kids) if (k) p.appendChild(k); return p; };
let sid = 0;
const nid = (p) => `u4-${p}-${++sid}`;
const labelOf = (b) => b.querySelector('.lg-btn__label');

/** Segmented choice (radiogroup): replaces a native select. Arrows/Home/End move and choose, like native radios. */
export function choice({ label: text, help, options, value, onChange }) {
  const row = el('div', 'u4-row u4-row--choice');
  const lid = nid('l'); const hid = nid('h');
  const g = el('div', 'u4-seg', null, { role: 'radiogroup', 'aria-labelledby': lid, 'aria-describedby': hid });
  const opts = options.map(([v, t]) => el('button', 'u4-seg__opt', t, { type: 'button', role: 'radio', 'data-v': v, 'aria-checked': 'false', tabindex: '-1' }));
  let cur = Math.max(0, options.findIndex(([v]) => v === value));
  const paint = () => opts.forEach((o, i) => {
    const on = i === cur;
    o.setAttribute('aria-checked', on ? 'true' : 'false');
    o.setAttribute('tabindex', on ? '0' : '-1');
    if (on) o.classList.add('is-on'); else o.classList.remove('is-on');
  });
  const pick = (i, focus) => { cur = (i + opts.length) % opts.length; paint(); if (focus) opts[cur].focus(); onChange(options[cur][0]); };
  opts.forEach((o, i) => {
    o.addEventListener('click', () => { if (i !== cur) pick(i, false); });
    o.addEventListener('keydown', (e) => {
      const k = e.key; let n = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = cur + 1; else if (k === 'ArrowLeft' || k === 'ArrowUp') n = cur - 1; else if (k === 'Home') n = 0; else if (k === 'End') n = opts.length - 1;
      if (n !== null) { e.preventDefault(); pick(n, true); }
    });
    g.appendChild(o);
  });
  paint();
  add(row, el('span', 'u4-row__label', text, { id: lid }), el('span', 'u4-row__help', help, { id: hid }), g);
  return row;
}

/** Thread slider with a plain description. Percent steps of 5, as before. */
function volume({ label: text, help, value, onInput }) {
  const row = el('div', 'u4-row u4-row--slider');
  const hid = nid('h');
  const s = slider({ label: text, min: 0, max: 100, step: 5, value: Math.round((Number(value) || 0) * 100), onInput: (v) => onInput(v / 100) });
  const inp = s.querySelector('input');
  if (inp) {
    inp.setAttribute('aria-describedby', hid);
    // The game's key capture (Phaser) swallows arrow keys, which stops a native range input stepping, so step it here (5% per arrow, 10% per PageUp/PageDown).
    inp.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 10, PageDown: -10 }[e.key];
      let v = Number(inp.value);
      if (step !== undefined) v += step; else if (e.key === 'Home') v = 0; else if (e.key === 'End') v = 100; else return;
      e.preventDefault();
      inp.value = String(Math.max(0, Math.min(100, v)));
      if (inp.dispatchEvent) inp.dispatchEvent(new globalThis.Event('input', { bubbles: true })); else inp.fire('input');
    });
  }
  add(row, s, el('span', 'u4-row__help', help, { id: hid }));
  return row;
}

/** Wick toggle with arrows: Right = on, Left = off (Space/Enter still flip it). */
function wickToggle({ label: text, help, checked, onChange }) {
  const t = toggle({ label: text, help, checked: !!checked, onChange });
  t.addEventListener('keydown', (e) => {
    const on = t.getAttribute('aria-checked') === 'true';
    if ((e.key === 'ArrowRight' && !on) || (e.key === 'ArrowLeft' && on)) { e.preventDefault(); t.click(); }
  });
  return t;
}

const deskOnly = (row) => { row.classList.add('u4-row--desk'); return row; };

function fullscreenRow(pwa) {
  if (!pwa) return null;
  const row = el('div', 'u4-row u4-row--fs');
  const draw = () => {
    row.replaceChildren();
    if (pwa.canFullscreen()) {
      const on = pwa.isFullscreen();
      add(row, el('span', 'u4-row__label', SET.fullscreen.label), el('span', 'u4-row__help', SET.fullscreen.help),
        button({ label: on ? SET.fullscreen.off : SET.fullscreen.on, variant: 'secondary', inline: true, onClick: () => { pwa.toggleFullscreen(); } }));
    } else if (pwa.state().iosSteps) {
      add(row, el('span', 'u4-row__label', SET.fullscreen.label), el('p', 'u4-note', 'On iPhone: tap Share, then Add to Home Screen, then open Wispwick from the new icon.'));
    }
  };
  draw();
  if (!row.children.length) return null;
  let unsub = null;
  let live = false;
  Promise.resolve().then(() => { live = true; });
  unsub = pwa.subscribe(() => { if (live && row.isConnected === false) { if (unsub) unsub(); return; } draw(); });
  return row;
}

/** Build the settings screen. api: the same handlers app.js always provided. onBack closes; onRebuild(message, tab) re-renders (after import/reset). */
export function buildSettings({ settings = {}, tab = 'sound', message = '', api, pwa = null, storageNote = null, onBack, onRebuild } = {}) {
  const st = settings;
  const set = (patch) => api.setSetting(patch);
  const root = kitRoot();
  root.classList.add('u4-wrap');
  const group = (name, ...rows) => add(el('div', 'u4-grid', null, { role: 'group', 'aria-label': name }), ...rows);

  // ---- Sound / Picture / Controls ----
  const sound = group(SET.tabs[0].label,
    volume({ ...SET.masterVol, value: st.masterVol ?? 0.8, onInput: (v) => set({ masterVol: v }) }),
    volume({ ...SET.musicVol, value: st.musicVol, onInput: (v) => set({ musicVol: v }) }),
    volume({ ...SET.sfxVol, value: st.sfxVol, onInput: (v) => set({ sfxVol: v }) }),
    wickToggle({ ...SET.muted, checked: st.muted, onChange: (v) => set({ muted: v }) }));
  const picture = group(SET.tabs[1].label,
    choice({ ...SET.quality, options: SET.quality.opts, value: st.quality, onChange: (v) => set({ quality: v }) }),
    choice({ ...SET.brightness, options: SET.brightness.opts, value: api.resolvedBrightness ? api.resolvedBrightness(st.brightness) : (st.brightness === 'auto' ? 'normal' : st.brightness), onChange: (v) => set({ brightness: v }) }),
    choice({ ...TEXT_COPY, options: TEXT_COPY.opts, value: st.textSize || 'normal', onChange: (v) => set({ textSize: v }) }), // A2
    deskOnly(choice({ ...UI_SCALE_COPY, options: UI_SCALE_COPY.opts, value: cleanUiScale(st.uiScale), onChange: (v) => set({ uiScale: v }) })), // DESKTOP D1 (hidden on phones, which always use 1x)
    wickToggle({ ...SET.screenShake, checked: st.screenShake, onChange: (v) => set({ screenShake: v }) }),
    wickToggle({ ...SET.reducedMotion, checked: st.reducedMotion, onChange: (v) => set({ reducedMotion: v }) }),
    wickToggle({ ...SET.damageNumbers, checked: st.damageNumbers, onChange: (v) => set({ damageNumbers: v }) }));
  const remap = buildKeyRemap({ keys: st.keys, onChange: (map) => set({ keys: map }) }); // A3 (replaces the fixed key list)
  const keys = add(el('div', 'u4-row u4-row--keys'), remap.root);
  // FM1: Tips toggle + 'Show tips again' (resets this lantern's whispers); FM5: Vibration (device setting)
  const tipsMsg = el('span', 'u4-row__help', '', { role: 'status', 'aria-live': 'polite' });
  const tipsAgain = api.resetTips ? add(el('div', 'u4-row u4-row--tipsagain'), button({ label: SET.tips.again, variant: 'secondary', inline: true, onClick: () => { api.resetTips(); tipsMsg.textContent = SET.tips.againDone; } }), tipsMsg) : null;
  const controls = group(SET.tabs[2].label,
    choice({ ...SET.touchMode, options: SET.touchMode.opts, value: st.touchMode, onChange: (v) => set({ touchMode: v }) }),
    choice({ ...SET.stickSize, options: SET.stickSize.opts, value: st.stickSize, onChange: (v) => set({ stickSize: v }) }),
    api.hasAutoRule && api.hasAutoRule() ? choice({ ...SET.autoRule, options: SET.autoRule.opts, value: st.autoRule, onChange: (v) => set({ autoRule: v }) }) : null,
    wickToggle({ ...SET.tips, checked: st.tips !== false, onChange: (v) => set({ tips: v }) }), tipsAgain,
    wickToggle({ ...SET.vibration, checked: st.vibration !== false, onChange: (v) => set({ vibration: v }) }),
    wickToggle({ ...SET.gentleLight, checked: st.gentleLight === true, onChange: (v) => set({ gentleLight: v === true }) }), // EXTRAS v1 (same switch as the Twilight side card)
    fullscreenRow(pwa), keys);

  // ---- Saves: export / import / reset, each with its old confirmation ----
  const msg = el('p', 'u4-msg', message, { role: 'status', 'aria-live': 'polite' });
  const say = (t, bad) => { msg.textContent = t; if (bad) msg.classList.add('bad'); else msg.classList.remove('bad'); };
  const confirmBox = el('div', 'u4-confirm', null, { role: 'group', 'aria-label': 'Confirm' });
  confirmBox.hidden = true;
  const clearConfirm = () => { confirmBox.replaceChildren(); confirmBox.hidden = true; };
  const ask = (text, yesLabel, onYes, from) => {
    clearConfirm(); confirmBox.hidden = false;
    const cancel = button({ label: SET.cancel, variant: 'primary', inline: true, onClick: () => { clearConfirm(); say(''); if (from && from.focus) from.focus(); } });
    const yes = button({ label: yesLabel, variant: 'danger', inline: true, onClick: () => { clearConfirm(); onYes(); } });
    add(confirmBox, el('p', 'u4-confirm__t', text), add(el('div', 'u4-confirm__row'), cancel, yes));
    cancel.focus();
  };
  const bExp = button({ label: SET.export.label, whisper: SET.export.whisper, onClick: () => {
    try {
      const d = globalThis.document;
      const url = URL.createObjectURL(new Blob([api.exportSave()], { type: 'application/json' }));
      const a = d.createElement('a');
      a.href = url; a.download = 'wispwick-save.json';
      d.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      say(SET.msg.exported);
    } catch { say(SET.msg.exportFail, true); }
  } });
  const file = el('input', 'u4-file', null, { type: 'file', hidden: '', tabindex: '-1', 'aria-hidden': 'true' });
  file.accept = '.json,application/json';
  const bImp = button({ label: SET.import.label, whisper: SET.import.whisper, onClick: () => { clearConfirm(); file.value = ''; file.click(); } });
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    if (!f) return;
    if (f.size > api.maxSaveBytes) { say(SET.msg.tooBig, true); return; }
    let text;
    try { text = await f.text(); } catch { say(SET.msg.unreadable, true); return; }
    const res = api.checkImport(text);
    if (!res.ok) { say(String(res.error), true); return; }
    say('');
    ask(SET.confirmImport.text, SET.confirmImport.yes, () => { api.applyImport(res.save); onRebuild(SET.msg.imported, 'saves'); }, bImp);
  });
  let armed = false; let armTimer = null;
  const bRes = button({ label: SET.reset.label, whisper: SET.reset.whisper, variant: 'danger', onClick: () => {
    const l = labelOf(bRes);
    if (!armed) {
      armed = true; l.textContent = SET.reset.arm;
      armTimer = setTimeout(() => { armed = false; l.textContent = SET.reset.label; }, 4000);
      return;
    }
    clearTimeout(armTimer); armed = false; l.textContent = SET.reset.label;
    ask(SET.confirmReset.text, SET.confirmReset.yes, () => { api.resetSave(); onRebuild(SET.msg.reset, 'saves'); }, bRes);
  } });
  // A1: the kept copy of an unreadable save can be downloaded (it may be repairable); the backup reminder can be switched off (device setting).
  const dmg = api.damagedText ? api.damagedText() : null;
  const bDmg = dmg ? button({ label: SAFE.damaged.label, whisper: SAFE.damaged.whisper, variant: 'quiet', onClick: () => { say(downloadText(dmg, SAFE.damagedFile, 'text/plain') ? SAFE.damagedDone : SET.msg.exportFail, false); } }) : null;
  const nudgeT = wickToggle({ ...SAFE.reminder, checked: st.backupNudge !== false, onChange: (v) => set({ backupNudge: v === true }) });
  const saves = group(SET.tabs[3].label, add(el('div', 'u4-saverow'), bExp, bImp, bRes, bDmg), confirmBox, msg, file, storageNote ? el('p', 'u4-note u4-note--warn', storageNote) : null, nudgeT);

  // ---- About: blurb, how to play, credits, version, maker, AI-use note (textContent only) ----
  let ver = typeof __APP_VERSION__ !== 'undefined' ? String(__APP_VERSION__).slice(0, 24) : 'dev';
  // Build time (from __BUILD_ID__ = version-base36 ms) so an update can be checked by eye; never throws.
  try {
    const ms = parseInt(String(typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : '').split('-').pop(), 36);
    if (Number.isFinite(ms) && ms > 1.7e12) ver += ' · built ' + new Date(ms).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { /* version only */ }
  const list = (items) => add(el('ul', 'u4-about__list'), ...items.map((t) => el('li', null, t)));
  const about = add(el('div', 'u4-grid u4-about', null, { role: 'group', 'aria-label': ABOUT.tab }),
    el('p', 'u4-note', ABOUT.blurb), el('h3', 'u4-about__h', ABOUT.howTitle), list(ABOUT.how),
    el('h3', 'u4-about__h', ABOUT.creditsTitle), list(ABOUT.credits),
    el('p', 'u4-note', ABOUT.madeBy), el('p', 'u4-note', `${ABOUT.versionLabel} ${ver}`),
    el('h3', 'u4-about__h', ABOUT.aiTitle), el('p', 'u4-note', ABOUT.ai));
  // ---- tabs ----
  const panes = { sound, picture, controls, saves, about };
  const tl = tabs({ label: SET.tabsLabel, items: SET.tabs.map((t) => ({ id: t.id, label: t.label })), selected: tab in panes ? tab : 'sound', onSelect: (id) => {
    for (const [k, p] of Object.entries(panes)) p.hidden = k !== id;
  } });
  for (const b of tl.children) { const id = b.getAttribute('data-id'); b.setAttribute('id', `u4-tab-${id}`); b.setAttribute('aria-controls', `u4-pane-${id}`); }
  for (const [k, p] of Object.entries(panes)) { p.setAttribute('id', `u4-pane-${k}`); p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', `u4-tab-${k}`); p.classList.add('u4-pane'); }
  const back = button({ label: SET.back, hint: 'Esc', variant: 'primary', onClick: () => { if (onBack) onBack(); } });
  const body = add(el('div', 'u4-body'), tl, add(el('div', 'u4-panes'), sound, picture, controls, saves, about), add(el('div', 'u4-foot'), back));
  add(root, panel({ title: SET.title, whisper: SET.whisper, body: [body] }));
  return {
    root, tabs: tl, back, panes, say, msg, confirmBox, file, buttons: { export: bExp, import: bImp, reset: bRes, damaged: bDmg, nudge: nudgeT }, remap, select: (id) => tl.select(id),
    focusFirst: () => { const t = [...tl.children].find((b) => b.getAttribute('aria-selected') === 'true'); if (t) t.focus(); },
  };
}
