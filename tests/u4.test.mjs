// U4: pause + settings. Copy, hostile strings inert, tab/keyboard behaviour, every setting key wired, save flows keep their confirmations + validation, CSS scoping.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';

const R = (p) => new URL('../' + p, import.meta.url);
function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, _cls: new Set(), _text: '', listeners: {}, hidden: false, style: { setProperty() {} },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    appendChild(c) { this.children.push(c); return c; }, append(...cs) { cs.forEach((c) => this.children.push(c)); }, replaceChildren(...cs) { this.children = cs; this._text = ''; },
    querySelector(sel) { let f = null; const cls = sel.startsWith('.') ? sel.slice(1) : null; const w = (x) => { if (f) return; if (cls && x._cls.has(cls)) f = x; else if (!cls && x.tag === sel) f = x; x.children.forEach(w); }; n.children.forEach(w); return f; },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    fire(t, ev = {}) { (this.listeners[t] || []).forEach((f) => f({ preventDefault() {}, stopPropagation() {}, ...ev })); },
    focus() { globalThis.document.activeElement = n; }, click() { if (n.disabled) return; n.fire('click'); } };
  n.classList = { add: (c) => n._cls.add(c), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c) };
  Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
  Object.defineProperty(n, 'textContent', { get: () => n._text + n.children.map((c) => c.textContent).join(''), set: (v) => { n._text = String(v); n.children = []; } });
  Object.defineProperty(n, 'innerHTML', { get() { throw new Error('innerHTML read'); }, set() { throw new Error('innerHTML write'); } });
  Object.defineProperty(n, 'outerHTML', { set() { throw new Error('outerHTML write'); } });
  return n;
}
globalThis.document = { createElement: mkNode, createElementNS: (ns, t) => Object.assign(mkNode(t), { ns }), activeElement: null };
const { buildSettings } = await import('../src/ui/settings.js');
const { buildPause } = await import('../src/ui/pause.js');
const C = await import('../src/ui/u4copy.js');
const walk = (n, f) => { f(n); n.children.forEach((c) => walk(c, f)); };
const find = (r, p) => { const o = []; walk(r, (n) => { if (p(n)) o.push(n); }); return o; };
const texts = (r) => { const o = []; walk(r, (n) => { if (n._text) o.push(n._text); }); return o.join(' | '); };
const key = (k) => ({ key: k, preventDefault() {} });

const defaults = { masterVol: 0.8, muted: false, musicVol: 0.7, sfxVol: 0.8, screenShake: true, reducedMotion: false, damageNumbers: true, quality: 'auto', brightness: 'auto', touchMode: 'auto', stickSize: 'medium' };
function api(log) {
  return { setSetting: (p) => log.push(['set', p]), exportSave: () => '{}', maxSaveBytes: 1000, checkImport: (t) => (t === 'good' ? { ok: true, save: { v: 1 } } : { ok: false, error: '<b>bad</b> save' }),
    applyImport: (s) => log.push(['import', s]), resetSave: () => log.push(['reset']) };
}
const mkSettings = (over = {}) => { const log = []; const s = buildSettings({ settings: defaults, api: api(log), onBack: () => log.push(['back']), onRebuild: (m, t) => log.push(['rebuild', m, t]), ...over }); return { s, log }; };

test('settings: every previous setting is present, grouped in four tabs, each with a plain description', () => {
  const { s } = mkSettings();
  const t = texts(s.root);
  for (const w of ['Settings', 'Sound', 'Picture', 'Controls', 'Saves', 'Master', 'Mute all', 'Music', 'Sound effects', 'Picture quality', 'Brightness', 'Screen shake', 'Calm motion', 'Damage numbers', 'Touch controls', 'Joystick size',
    'Export save', 'Import save', 'Reset save', 'Back']) assert.ok(t.includes(w), w);
  assert.deepEqual(find(s.root, (n) => n.attrs.role === 'tab').map((n) => n.attrs['data-id']), ['sound', 'picture', 'controls', 'saves']);
  assert.equal(find(s.root, (n) => n.tag === 'select' || (n.tag === 'input' && n.attrs.type === 'checkbox')).length, 0, 'no native selects/checkboxes');
  assert.equal(find(s.root, (n) => n.attrs.type === 'range').length, 3); // AU0: Master + Music + Sound effects
  assert.equal(find(s.root, (n) => n.attrs.role === 'switch').length, 6); // AU0: + Mute all; FM1 Tips + FM5 Vibration
  assert.equal(find(s.root, (n) => n.attrs.role === 'radiogroup').length, 4);
  for (const k of ['musicVol', 'sfxVol', 'quality', 'brightness', 'screenShake', 'reducedMotion', 'damageNumbers', 'touchMode', 'stickSize']) assert.ok(k in defaults);
  for (const g of find(s.root, (n) => n.attrs.role === 'radiogroup')) assert.ok(g.attrs['aria-describedby'] && g.attrs['aria-labelledby']);
  for (const sw of find(s.root, (n) => n.attrs.role === 'switch')) assert.ok(sw.attrs['aria-describedby']);
  for (const r of find(s.root, (n) => n.attrs.type === 'range')) assert.ok(r.attrs['aria-describedby']);
});

test('settings tabs: roving tabindex, arrows switch, only one pane visible, panes labelled by their tab', () => {
  const { s } = mkSettings();
  assert.deepEqual(Object.entries(s.panes).map(([k, p]) => [k, !!p.hidden]), [['sound', false], ['picture', true], ['controls', true], ['saves', true]]);
  const tabs = find(s.root, (n) => n.attrs.role === 'tab');
  assert.deepEqual(tabs.map((x) => x.attrs.tabindex), ['0', '-1', '-1', '-1']);
  tabs[0].fire('keydown', key('ArrowRight'));
  assert.equal(s.panes.picture.hidden, false);
  assert.equal(s.panes.sound.hidden, true);
  tabs[1].fire('keydown', key('End'));
  assert.equal(s.panes.saves.hidden, false);
  for (const [k, p] of Object.entries(s.panes)) { assert.equal(p.attrs.role, 'tabpanel'); assert.equal(p.attrs['aria-labelledby'], `u4-tab-${k}`); }
  assert.equal(mkSettings({ tab: 'saves' }).s.panes.saves.hidden, false);
  assert.equal(mkSettings({ tab: '<script>' }).s.panes.sound.hidden, false, 'unknown tab falls back to Sound');
});

test('settings: sliders, wick toggles and segmented choices call setSetting with the same keys and value ranges as before', () => {
  const { s, log } = mkSettings();
  const ranges = find(s.root, (n) => n.attrs.type === 'range');
  ranges[0].value = '50'; ranges[0].fire('input');
  ranges[1].value = '35'; ranges[1].fire('input');
  ranges[2].value = '100'; ranges[2].fire('input');
  const sw = find(s.root, (n) => n.attrs.role === 'switch');
  sw[0].click(); sw[1].click(); sw[2].click(); sw[3].click();
  const groups = find(s.root, (n) => n.attrs.role === 'radiogroup');
  const radios = (g) => g.children;
  radios(groups[0])[2].click(); // quality -> Medium
  radios(groups[1])[1].click(); // brightness -> Brighter (WL6a)
  radios(groups[2])[1].click(); // touch -> On
  radios(groups[3])[2].click(); // stick -> Large
  assert.deepEqual(log, [['set', { masterVol: 0.5 }], ['set', { musicVol: 0.35 }], ['set', { sfxVol: 1 }], ['set', { muted: true }], ['set', { screenShake: false }], ['set', { reducedMotion: true }], ['set', { damageNumbers: false }],
    ['set', { quality: 'med' }], ['set', { brightness: 'brighter' }], ['set', { touchMode: 'on' }], ['set', { stickSize: 'large' }]]);
});

test('choice + toggle keyboard: arrows move and choose (wraps), Home/End; Right/Left set a switch on/off', () => {
  const { s, log } = mkSettings();
  const g = find(s.root, (n) => n.attrs.role === 'radiogroup')[0];
  const o = g.children;
  assert.deepEqual(o.map((x) => x.attrs['aria-checked']), ['true', 'false', 'false', 'false']);
  assert.deepEqual(o.map((x) => x.attrs.tabindex), ['0', '-1', '-1', '-1']);
  o[0].fire('keydown', key('ArrowLeft'));
  assert.equal(o[3].attrs['aria-checked'], 'true');
  assert.equal(globalThis.document.activeElement, o[3]);
  o[3].fire('keydown', key('Home'));
  assert.equal(o[0].attrs['aria-checked'], 'true');
  assert.deepEqual(log.at(-1), ['set', { quality: 'auto' }]);
  const sw = find(s.root, (n) => n.attrs.role === 'switch')[2]; // Calm motion, off (after Mute all, Screen shake)
  sw.fire('keydown', key('ArrowLeft'));
  assert.equal(sw.attrs['aria-checked'], 'false');
  sw.fire('keydown', key('ArrowRight'));
  assert.equal(sw.attrs['aria-checked'], 'true');
  assert.deepEqual(log.at(-1), ['set', { reducedMotion: true }]);
});

test('saves: export/import/reset exist; reset needs two presses plus a confirm; Cancel returns focus; import runs validation first', async () => {
  const { s, log } = mkSettings();
  const { reset } = s.buttons;
  const lab = () => reset.querySelector('.lg-btn__label').textContent;
  reset.click();
  assert.equal(lab(), 'Really reset? Press again');
  assert.equal(s.confirmBox.hidden, true);
  assert.equal(log.length, 0);
  reset.click();
  assert.equal(s.confirmBox.hidden, false);
  assert.ok(texts(s.confirmBox).includes('cannot be undone'));
  assert.equal(log.length, 0, 'nothing erased yet');
  const [cancel, yes] = find(s.confirmBox, (n) => n.tag === 'button');
  assert.equal(globalThis.document.activeElement, cancel, 'safe choice focused');
  cancel.click();
  assert.equal(globalThis.document.activeElement, reset);
  reset.click(); reset.click();
  find(s.confirmBox, (n) => n.tag === 'button')[1].click();
  assert.deepEqual(log, [['reset'], ['rebuild', 'Save reset.', 'saves']]);
  void yes;
  // import: bad text is rejected with its error as plain text; good text asks first
  const f = (text, size) => ({ size: size ?? text.length, text: async () => text });
  s.file.files = [f('nope')]; s.file.fire('change'); await new Promise((r) => setTimeout(r, 0));
  assert.equal(s.msg.textContent, '<b>bad</b> save');
  assert.equal(find(s.msg, (n) => n.tag === 'b').length, 0);
  s.file.files = [f('x', 5000)]; s.file.fire('change'); await new Promise((r) => setTimeout(r, 0));
  assert.equal(s.msg.textContent, 'Save file is too large.');
  log.length = 0;
  s.file.files = [f('good')]; s.file.fire('change'); await new Promise((r) => setTimeout(r, 0));
  assert.equal(s.confirmBox.hidden, false);
  assert.equal(log.length, 0, 'import is not applied before the confirm');
  find(s.confirmBox, (n) => n.tag === 'button')[1].click();
  assert.deepEqual(log, [['import', { v: 1 }], ['rebuild', 'Save imported.', 'saves']]);
});

test('hostile strings (storage note, message, import error, hero/weapon names) are inert text; no innerHTML anywhere', () => {
  const evil = '<img src=x onerror=alert(1)>"><script>1</script>';
  const { s } = mkSettings({ message: evil, storageNote: evil });
  assert.ok(texts(s.root).includes('<img'));
  assert.equal(find(s.root, (n) => n.tag === 'script' || n.tag === 'img').length, 0);
  const sim = { time: 1e9, level: evil, balance: { maxRank: 5 }, characterId: 'x', weapons: [{ id: evil, evo: evil, ranks: { a: evil, b: 3 } }] };
  const view = C.pauseView(sim, { weapons: { [evil]: { name: evil } }, evolutions: { [evil]: { name: evil } }, characters: { x: { name: evil + ', ' + evil } } });
  assert.equal(typeof view.weapons[0].name, 'string');
  assert.equal(view.level, 1);
  const p = buildPause({ view });
  assert.ok(texts(p.root).includes('<img'));
  assert.equal(find(p.root, (n) => n.tag === 'script' || n.tag === 'img').length, 0);
  const src = ['settings.js', 'pause.js', 'u4copy.js'].map((f) => readFileSync(R('src/ui/' + f), 'utf8')).join('\n').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/innerHTML|insertAdjacentHTML|outerHTML|document\.write/.test(src));
  const ui = readFileSync(R('src/ui/ui.js'), 'utf8');
  const part = ui.slice(ui.indexOf('// ------------------------------------------------------------------ pause / end'), ui.indexOf('showEnd('));
  assert.ok(!/innerHTML|html\)/.test(part), 'pause code in ui.js');
  const st = ui.slice(ui.indexOf('showSettings('), ui.indexOf('hideEnd()'));
  assert.ok(!/innerHTML/.test(st), 'settings code in ui.js');
});

test('pause: copy, summary from the run, Resume first, Tab order, Quit goes through a confirm', () => {
  const sim = { time: 462, level: 9, balance: { maxRank: 5 }, characterId: 'wren', weapons: [{ id: 'ghost_wolves', evo: null, ranks: { a: 2, b: 1 } }, { id: 'holy_orbit', evo: Object.keys(data.evolutions)[0], ranks: {} }] };
  const view = C.pauseView(sim, data);
  assert.equal(view.time, '7:42');
  assert.equal(view.level, 9);
  assert.equal(view.hero, 'Wren');
  assert.equal(view.weapons[0].name, 'Ghost Wolves');
  assert.equal(view.weapons[1].pips, 5, 'evolved weapon shows all pips');
  assert.ok(C.PAUSE.whispers.includes(view.whisper));
  assert.equal(C.pauseWhisper(0), C.pauseWhisper(59));
  const log = [];
  const p = buildPause({ view, onResume: () => log.push('resume'), onSettings: () => log.push('settings'), onQuit: () => log.push('quit') });
  const t = texts(p.root);
  for (const w of ['Paused', '7:42 walked', 'Level 9', 'Ghost Wolves', 'Resume', 'Settings', 'Sound, motion, saves', 'Quit to menu', 'this run is lost']) assert.ok(t.includes(w), w);
  const order = find(p.root, (n) => n.tag === 'button').map((b) => b.textContent.slice(0, 6));
  assert.deepEqual(order, ['Resume', 'Settin', 'Quit t', 'StayEs', 'Leave ']);
  assert.equal(p.confirmBox.hidden, true);
  p.resume.click(); p.settings.click();
  assert.deepEqual(log, ['resume', 'settings']);
  p.quit.click();
  assert.equal(log.includes('quit'), false, 'quit never fires without the confirm');
  assert.equal(p.menu.hidden, true);
  assert.equal(p.confirmBox.hidden, false);
  assert.equal(globalThis.document.activeElement, p.stay, 'safe choice focused');
  assert.equal(p.cancelConfirm(), true);
  assert.equal(p.menu.hidden, false);
  assert.equal(globalThis.document.activeElement, p.quit);
  assert.equal(p.cancelConfirm(), false);
  p.quit.click(); p.leave.click();
  assert.deepEqual(log.at(-1), 'quit');
});

test('pause keyboard: Up/Down walk Resume, Settings, Quit (wraps)', () => {
  const p = buildPause({ view: C.pauseView({ time: 0, level: 1, balance: {}, characterId: 'wren', weapons: [] }, data) });
  p.resume.focus();
  p.menu.fire('keydown', key('ArrowDown')); assert.equal(globalThis.document.activeElement, p.settings);
  p.menu.fire('keydown', key('ArrowDown')); assert.equal(globalThis.document.activeElement, p.quit);
  p.menu.fire('keydown', key('ArrowDown')); assert.equal(globalThis.document.activeElement, p.resume);
  p.menu.fire('keydown', key('ArrowUp')); assert.equal(globalThis.document.activeElement, p.quit);
});

test('time and numbers never throw on garbage', () => {
  assert.equal(C.fmtWalked(NaN), '0:00');
  assert.equal(C.fmtWalked(-5), '0:00');
  assert.equal(C.fmtWalked('abc'), '0:00');
  assert.equal(C.fmtWalked(3605), '60:05');
  assert.equal(C.pauseView(null, data).level, 1);
});

test('CSS: every rule scoped to .u4 (or the inert hider); no external URLs; no backdrop-filter; settings tab focus not removed', () => {
  const css = readFileSync(R('src/ui/u4.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/url\(\s*['"]?https?:/.test(css) && !/backdrop-filter/.test(css));
  const sels = [...css.matchAll(/(?:^|[};{])\s*([^{};@]+)\{/g)].map((m) => m[1].trim()).filter((x) => x && !/^\d|^from|^to|^\(/.test(x));
  for (const sel of sels) for (const part of sel.split(',')) assert.ok(/\.u4\b/.test(part) || /\[inert\]/.test(part), 'unscoped: ' + part.trim());
  assert.ok(!/outline:\s*(none|0)/.test(css));
  assert.ok(/prefers-reduced-motion/.test(css));
});

test('touch target and text-size floors are declared (min 44 px controls, no sub-12px type)', () => {
  const css = readFileSync(R('src/ui/u4.css'), 'utf8');
  assert.ok(/\.u4-seg__opt \{[^}]*min-height: var\(--lg-tap\)/.test(css));
  assert.ok(/\.lg-range \{ height: var\(--lg-tap\)/.test(css));
  for (const m of css.matchAll(/font-size:\s*(\d+)px/g)) assert.ok(Number(m[1]) >= 12, m[0]);
});

test('FM1/FM5 settings: Tips and Vibration switches (on by default) set their keys; Show tips again calls the reset once and says so', () => {
  const log = [];
  const a = { ...api(log), resetTips: () => log.push(['tips-again']) };
  const s = buildSettings({ settings: defaults, api: a, onBack() {}, onRebuild() {} });
  const sw = (label) => find(s.root, (n) => n.attrs.role === 'switch' && texts(n).includes(label))[0];
  for (const [label, k] of [['Tips', 'tips'], ['Vibration', 'vibration']]) {
    const t = sw(label);
    assert.ok(t, label); assert.equal(t.attrs['aria-checked'], 'true');
    t.click(); assert.deepEqual(log.pop(), ['set', { [k]: false }]);
  }
  const b = find(s.root, (n) => n.tag === 'button' && texts(n).includes('Show tips again'))[0];
  b.click();
  assert.deepEqual(log.pop(), ['tips-again']);
  assert.ok(texts(s.root).includes('Tips will show again on your next run.'));
  const none = buildSettings({ settings: defaults, api: api([]), onBack() {}, onRebuild() {} });
  assert.equal(find(none.root, (n) => n.tag === 'button' && texts(n).includes('Show tips again')).length, 0, 'no handler: no button');
});
