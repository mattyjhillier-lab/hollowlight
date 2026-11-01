// A3 KEY REMAP: validation (untrusted save), conflicts (swap), Esc fixed on Pause, defaults unchanged, live hints, movement / cards / mute
// follow the map, and the Settings UI capture (Esc cancels, Backspace clears, swap message, reset). Fake DOM: textContent only.
import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers.mjs';
import { ACTIONS, DEFAULT_KEYS, defaultKeymap, cleanKeymap, assignKey, clearKey, codeOf, keyName, keyLabel, actionOf, setActiveKeymap, dirMap, isDefault, allowedCode } from '../src/input/keymap.js';
import { HeldKeys, moveCode } from '../src/input/keys.js';
import { isMuteKey } from '../src/audio/index.js';
import { sanitize, defaultSave, parseSave, serializeSave } from '../src/save/schema.js';
import { installDom, find, texts } from './a11ydom.mjs';

const used = (m) => ACTIONS.flatMap((a) => m[a].filter(Boolean));
const noDupes = (m) => { const u = used(m); assert.equal(new Set(u).size, u.length, 'no key on two actions'); };

test('A3 defaults are the old keys (WASD + arrows, Space, Esc, 1-6 + numpad, R, B, M) and a fresh / old save gets them', () => {
  const d = defaultKeymap();
  assert.deepEqual(d.up, ['KeyW', 'ArrowUp']); assert.deepEqual(d.left, ['KeyA', 'ArrowLeft']); assert.deepEqual(d.ability, ['Space', null]);
  assert.deepEqual(d.pause, ['Escape', null]); assert.deepEqual(d.pick1, ['Digit1', 'Numpad1']); assert.deepEqual(d.reroll, ['KeyR', null]);
  assert.deepEqual(defaultSave().settings.keys, d);
  assert.deepEqual(sanitize({ settings: {} }).settings.keys, d, 'a save from before A3');
  assert.ok(isDefault(d)); noDupes(d);
  assert.deepEqual(DEFAULT_KEYS.up, ['KeyW', 'ArrowUp']);
});

test('A3 validation: hostile / wrong-typed keymaps never throw, never duplicate, keep Esc on Pause, drop unknown actions and codes', () => {
  const evil = [null, 1, 'x', [], { up: 'KeyW' }, { up: [1, 2] }, { up: ['<img>', 'KeyQ'] }, JSON.parse('{"__proto__":{"up":["KeyZ"]},"constructor":["KeyX"]}'),
    { pause: ['KeyP', 'KeyO'] }, { up: ['KeyQ', 'KeyQ'], down: ['KeyQ'] }, { ability: ['Escape', 'Tab'] }, { ability: ['ControlLeft', 'F5'] }, { up: new Array(500).fill('KeyQ') },
    { fly: ['KeyF'] }, { up: ['KeyD'] }];
  for (const e of evil) {
    const m = cleanKeymap(e);
    assert.deepEqual(Object.keys(m), ACTIONS);
    assert.equal(m.pause[0], 'Escape');
    for (const a of ACTIONS) { assert.equal(m[a].length, 2); for (const c of m[a]) assert.ok(c === null || allowedCode(c) || (a === 'pause' && c === 'Escape'), `${a}:${c}`); }
    noDupes(m);
  }
  assert.deepEqual(cleanKeymap({ up: ['KeyQ', 'KeyQ'] }).up, ['KeyQ', null]);
  assert.deepEqual(cleanKeymap({ pause: ['KeyP', 'KeyO'] }).pause, ['Escape', 'KeyO'], 'slot 1 of Pause is always Esc');
  const m = cleanKeymap({ up: ['KeyD'] });
  assert.deepEqual(m.up, ['KeyD', null]); assert.deepEqual(m.right, [null, 'ArrowRight'], 'the default that is now taken is not doubled');
  assert.equal(({}).up, undefined);
  // round trip through a save file
  const s = sanitize({ ...defaultSave(), settings: { keys: { ability: ['KeyE', 'ShiftLeft'] } } });
  const back = parseSave(JSON.stringify(serializeSave(s)));
  assert.ok(back.ok); assert.deepEqual(back.save.settings.keys.ability, ['KeyE', 'ShiftLeft']);
});

test('A3 conflicts: binding a used key swaps it; Esc / Tab / F-keys / Ctrl refused; clearing keeps one key; never mutates the input', () => {
  const d = defaultKeymap(); const frozen = JSON.stringify(d);
  let r = assignKey(d, 'ability', 0, 'KeyR');
  assert.ok(r.ok); assert.deepEqual(r.map.ability, ['KeyR', null]); assert.deepEqual(r.map.reroll, ['Space', null]); assert.deepEqual(r.swapped, { action: 'reroll', code: 'Space' });
  assert.equal(JSON.stringify(d), frozen);
  r = assignKey(d, 'ability', 1, 'KeyR'); // empty slot takes R: Reroll is left with nothing
  assert.deepEqual(r.map.ability, ['Space', 'KeyR']); assert.deepEqual(r.map.reroll, [null, null]); assert.equal(r.emptied, 'reroll');
  r = assignKey(d, 'up', 0, 'ArrowUp'); assert.deepEqual(r.map.up, ['ArrowUp', 'KeyW'], 'the two keys of one action trade places');
  for (const bad of ['Escape', 'Tab', 'Enter', 'F5', 'ControlLeft', 'MetaLeft', 'AltLeft', '', null, 7, '<b>']) assert.equal(assignKey(d, 'ability', 0, bad).ok, false, String(bad));
  assert.equal(assignKey(d, 'pause', 0, 'KeyP').ok, false, 'Esc stays');
  assert.equal(assignKey(d, 'pause', 1, 'KeyP').map.pause[1], 'KeyP');
  assert.equal(assignKey(d, 'nope', 0, 'KeyP').ok, false);
  assert.equal(clearKey(d, 'ability', 0).ok, false, 'last key cannot be cleared');
  assert.deepEqual(clearKey(d, 'up', 1).map.up, ['KeyW', null]);
  assert.deepEqual(clearKey(d, 'up', 0).map.up, ['ArrowUp', null]);
  assert.equal(clearKey(d, 'pause', 0).ok, false);
  for (let i = 0; i < 300; i++) { // random rebinding never produces a duplicate or loses Esc
    const a = ACTIONS[(i * 7) % ACTIONS.length]; const c = ['KeyQ', 'KeyW', 'Space', 'Digit1', 'ArrowLeft', 'KeyE', 'ShiftLeft'][(i * 3) % 7];
    r = assignKey(r.map, a, i % 2, c); noDupes(r.map); assert.equal(r.map.pause[0], 'Escape');
  }
});

test('A3 events: code first (layout-proof), key fallback, modifiers never trigger, names are readable', () => {
  assert.equal(codeOf({ code: 'KeyZ', key: 'w' }), 'KeyZ');
  assert.equal(codeOf({ key: 'r' }), 'KeyR'); assert.equal(codeOf({ key: '1' }), 'Digit1'); assert.equal(codeOf({ key: ' ' }), 'Space'); assert.equal(codeOf({ key: 'Up' }), 'ArrowUp');
  assert.equal(codeOf({ key: '!' }), ''); assert.equal(codeOf(null), '');
  setActiveKeymap(defaultKeymap());
  assert.equal(actionOf({ code: 'Space' }), 'ability'); assert.equal(actionOf({ code: 'KeyR', ctrlKey: true }), null);
  assert.equal(actionOf({ key: '3' }), 'pick3'); assert.equal(actionOf({ code: 'Numpad2' }), 'pick2'); assert.equal(actionOf({ code: 'KeyQ' }), null);
  assert.deepEqual(['KeyR', 'Digit1', 'Numpad4', 'Space', 'ArrowUp', 'ShiftLeft', 'Escape', 'Slash', 'Bogus'].map(keyName), ['R', '1', 'Num 4', 'Space', 'Up', 'Shift', 'Esc', '/', '']);
  assert.equal(keyLabel('ability'), 'Space'); assert.equal(keyLabel('nope'), '');
});

test('A3 live map: movement (HeldKeys), mute, cards, hints and the HUD pill follow a remap; reset gives the old behaviour back', async () => {
  const m = assignKey(assignKey(assignKey(defaultKeymap(), 'up', 0, 'KeyI').map, 'ability', 0, 'KeyE').map, 'mute', 0, 'KeyN').map;
  setActiveKeymap(m);
  const h = new HeldKeys(); h.setDirs(dirMap(m));
  assert.equal(h.press('KeyI'), true); assert.deepEqual(h.axis({}), { x: 0, y: -1 });
  assert.equal(h.press('KeyW'), false, 'W no longer walks'); assert.equal(h.press('ArrowUp'), true, 'arrows stay');
  assert.equal(moveCode({ code: 'KeyI' }, dirMap(m)), 'KeyI'); assert.equal(moveCode({ key: 'w' }, dirMap(m)), '');
  h.setDirs({ '<x>': 'u', KeyJ: 'up', KeyK: 'l' }); assert.equal(h.press('KeyK'), true); assert.equal(h.press('<x>'), false); // validated
  h.setDirs(null); assert.equal(h.press('KeyW'), true, 'bad map -> default WASD');
  assert.equal(isMuteKey({ code: 'KeyN' }), true); assert.equal(isMuteKey({ code: 'KeyM' }), false);
  assert.equal(isMuteKey({ code: 'KeyN', target: { tagName: 'input' } }), false, 'never while typing a name');
  const { plateFor, rerollTitle } = await import('../src/ui/whispers.js');
  assert.match(plateFor('ability', 'kb', { ability: 'Pack Howl' }).sr, /Press E: Pack Howl/);
  assert.match(plateFor('move', 'kb').sr, /^I A S D or arrows to walk/);
  setActiveKeymap(assignKey(m, 'reroll', 0, 'KeyT').map);
  assert.equal(rerollTitle({ rerolls: 1, banishes: 1 }, 'kb'), 'T: new cards  ·  B then a number: banish');
  installDom();
  const { Hud } = await import('../src/ui/hud.js').catch(() => ({}));
  if (Hud) { /* the HUD needs a fuller DOM; its pill text is covered by the source check below */ }
  setActiveKeymap(defaultKeymap());
  assert.equal(plateFor('move', 'kb').sr.startsWith('W A S D or arrows'), true);
  assert.equal(rerollTitle({ rerolls: 1, banishes: 1 }, 'kb'), 'R: new cards  ·  B then a number: banish');
  const { readFileSync } = await import('node:fs');
  const hud = readFileSync(new URL('../src/ui/hud.js', import.meta.url), 'utf8');
  assert.ok(/refreshKeys\(\) \{ this\.abKey\.textContent = \(keyLabel\('ability'\)/.test(hud));
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.ok(/setActiveKeymap\(s\.keys\)/.test(app) && /held\.setDirs\(dirMap\(km\)\)/.test(app) && /refreshKeys\(\)/.test(app), 'applySettings wires the map');
});

test('A3 card keys: picks / reroll / banish use the live map, the card badges show the remapped key', async () => {
  installDom();
  const { OfferView } = await import('../src/ui/cardsui.js');
  const log = [];
  const v = Object.create(OfferView.prototype);
  Object.assign(v, { cards: [{}, {}, {}], h: { reroll: () => log.push('reroll') }, activate: (i) => log.push(`pick${i + 1}`), toggleBanish: () => log.push('banish'), setSel() {}, sel: 0 });
  const ev = (o) => ({ preventDefault() {}, ...o });
  setActiveKeymap(assignKey(assignKey(defaultKeymap(), 'pick1', 0, 'KeyQ').map, 'reroll', 0, 'KeyG').map);
  v.onKey(ev({ code: 'KeyQ', key: 'q' })); v.onKey(ev({ code: 'Digit1', key: '1' })); v.onKey(ev({ code: 'Numpad1', key: '1' })); v.onKey(ev({ code: 'KeyG', key: 'g' })); v.onKey(ev({ code: 'KeyR', key: 'r' })); v.onKey(ev({ code: 'KeyB', key: 'b' })); v.onKey(ev({ code: 'Digit3', key: '3' })); v.onKey(ev({ code: 'Digit5', key: '5' }));
  assert.deepEqual(log, ['pick1', 'pick1', 'reroll', 'banish', 'pick3'], 'Q picks card 1 (Digit1 went unbound), Numpad1 still picks, G rerolls, R does nothing, 5 > card count');
  assert.equal(keyLabel('pick1'), 'Q');
  const src = (await import('node:fs')).readFileSync(new URL('../src/ui/cardsui.js', import.meta.url), 'utf8');
  assert.ok(src.includes("keyLabel(`pick${i + 1}`)") && src.includes("keyLabel('reroll')") && src.includes("keyLabel('banish')"));
  setActiveKeymap(defaultKeymap());
});

test('A3 Settings UI: one-shot capture, Esc cancels, Backspace clears, swap is announced, reset restores; inert text; listener removed', async () => {
  installDom();
  const { buildKeyRemap } = await import('../src/ui/keysui.js');
  const L = {}; const win = { addEventListener: (t, f) => { (L[t] ||= []).push(f); }, removeEventListener: (t, f) => { L[t] = (L[t] || []).filter((x) => x !== f); } };
  const saved = [];
  const r = buildKeyRemap({ keys: { ability: ['<img src=x>', null] }, onChange: (m) => saved.push(m), win });
  const press = (code, extra = {}) => { const e = { code, key: '', preventDefault() {}, stopImmediatePropagation() { e.stopped = true; }, ...extra }; (L.keydown || []).slice().forEach((f) => f(e)); return e; };
  assert.equal(r.buttons.ability[0].textContent, 'Space', 'hostile save value replaced by the default');
  assert.equal(r.buttons.pause[0].disabled, true); assert.equal(r.buttons.pause[0].textContent, 'Esc');
  assert.equal(r.reset.disabled, true);
  r.buttons.ability[0].click(); assert.equal(r.buttons.ability[0].textContent, 'Press a key…'); assert.equal((L.keydown || []).length, 1);
  const e1 = press('Escape'); assert.equal(e1.stopped, true); assert.equal(r.buttons.ability[0].textContent, 'Space'); assert.equal(saved.length, 0); assert.equal(L.keydown.length, 0, 'listener removed');
  r.buttons.ability[0].click(); press('ControlLeft', { ctrlKey: true }); assert.equal(L.keydown.length, 1, 'a lone modifier keeps waiting');
  press('KeyR'); assert.equal(saved.length, 1); assert.deepEqual(saved[0].ability, ['KeyR', null]); assert.deepEqual(saved[0].reroll, ['Space', null]);
  assert.match(r.msg.textContent, /Ability: R\. Reroll now uses Space\./);
  assert.equal(r.buttons.reroll[0].textContent, 'Space'); assert.equal(r.reset.disabled, false);
  r.buttons.up[1].click(); press('Backspace'); assert.deepEqual(saved[saved.length - 1].up, ['KeyW', null]); assert.equal(r.buttons.up[1].textContent, '—');
  r.buttons.up[0].click(); press('F5'); assert.match(r.msg.textContent, /cannot be used/); assert.deepEqual(r.map().up, ['KeyW', null]);
  r.reset.click(); assert.ok(isDefault(saved[saved.length - 1])); assert.match(r.msg.textContent, /reset/);
  r.buttons.mute[0].click(); r.stop(false); assert.equal(L.keydown.length, 0, 'closing Settings stops a capture');
  assert.ok(!texts(r.root).includes('<img'));
  assert.equal(find(r.root, (n) => n.tag === 'button' && n.attrs['aria-label'] && /Press to change|Esc always pauses/.test(n.attrs['aria-label'])).length, ACTIONS.length * 2);
  const { buildSettings } = await import('../src/ui/settings.js');
  const s = buildSettings({ settings: { keys: defaultKeymap() }, api: { setSetting: (p) => saved.push(p), exportSave: () => '{}', maxSaveBytes: 1, checkImport: () => ({ ok: false }), applyImport() {}, resetSave() {} }, onBack() {}, onRebuild() {} });
  assert.ok(s.remap && texts(s.panes.controls).includes('Reset keys'));
});
