// CTL1: movement keys can never stick, opposite keys never dead-stop, overlays and focused controls cannot eat a keyup,
// and a Space press that works a pause/card button never queues an ability.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HeldKeys, bindHeldKeys, moveCode } from '../src/input/keys.js';

class Target {
  constructor() { this.l = {}; this.hidden = false; }
  addEventListener(t, f, cap) { (this.l[t] ||= []).push({ f, cap: !!cap }); }
  removeEventListener(t, f, cap) { this.l[t] = (this.l[t] || []).filter((x) => !(x.f === f && x.cap === !!cap)); }
  fire(t, e = {}) { for (const x of (this.l[t] || []).slice()) x.f(e); }
}
const ev = (code, extra = {}) => ({ code, key: '', defaultPrevented: false, ...extra });
const setup = () => { const h = new HeldKeys(), win = new Target(), doc = new Target(); const off = bindHeldKeys(h, win, doc); return { h, win, doc, off, dir: () => h.axis({ x: 9, y: 9 }) }; };

test('CTL1 axis: single keys, diagonals, WASD and arrows alike', () => {
  const { win, dir } = setup();
  assert.deepEqual(dir(), { x: 0, y: 0 });
  win.fire('keydown', ev('KeyD')); assert.deepEqual(dir(), { x: 1, y: 0 });
  win.fire('keydown', ev('ArrowUp')); assert.deepEqual(dir(), { x: 1, y: -1 });
  win.fire('keyup', ev('KeyD')); win.fire('keyup', ev('ArrowUp')); assert.deepEqual(dir(), { x: 0, y: 0 });
});

test('CTL1 rollover: opposite keys = last pressed wins, releasing it returns to the other (never a dead stop)', () => {
  const { win, dir } = setup();
  win.fire('keydown', ev('KeyA')); assert.equal(dir().x, -1);
  win.fire('keydown', ev('KeyD')); assert.equal(dir().x, 1);
  win.fire('keydown', ev('KeyA', { repeat: true })); assert.equal(dir().x, 1, 'autorepeat keeps the original press order');
  win.fire('keyup', ev('KeyD')); assert.equal(dir().x, -1);
  win.fire('keyup', ev('KeyA')); assert.equal(dir().x, 0);
  win.fire('keydown', ev('KeyW')); win.fire('keydown', ev('ArrowDown')); assert.equal(dir().y, 1);
  win.fire('keyup', ev('ArrowDown')); assert.equal(dir().y, -1);
});

test('CTL1 a keyup always releases: prevented by an overlay, with modifiers, while a level-up/pause screen is up', () => {
  const { win, dir } = setup();
  win.fire('keydown', ev('KeyD'));
  win.fire('keyup', ev('KeyD', { defaultPrevented: true, shiftKey: true, ctrlKey: true }));
  assert.deepEqual(dir(), { x: 0, y: 0 });
  // held through a level-up: the overlay preventDefaults arrows for card selection; the hero follows the physical keys
  win.fire('keydown', ev('ArrowRight', { defaultPrevented: true }));
  assert.equal(dir().x, 1);
  win.fire('keyup', ev('ArrowRight', { defaultPrevented: true }));
  assert.equal(dir().x, 0);
});

test('CTL1 everything is dropped when a keyup can be missed: blur, hidden tab, page hide, native context menu', () => {
  for (const [what, fire] of [
    ['blur', (s) => s.win.fire('blur')],
    ['hidden', (s) => { s.doc.hidden = true; s.doc.fire('visibilitychange'); }],
    ['pagehide', (s) => s.win.fire('pagehide')],
    ['menu', (s) => s.win.fire('contextmenu')],
  ]) {
    const s = setup();
    s.win.fire('keydown', ev('KeyD')); s.win.fire('keydown', ev('KeyW'));
    fire(s);
    assert.deepEqual(s.dir(), { x: 0, y: 0 }, what);
    assert.equal(s.h.lastClear, what);
    // the lost keyups arriving late are harmless; a fresh press works at once
    s.win.fire('keyup', ev('KeyD')); s.win.fire('keydown', ev('KeyA')); assert.equal(s.dir().x, -1);
  }
  const s = setup(); s.win.fire('keydown', ev('KeyD')); s.doc.hidden = false; s.doc.fire('visibilitychange'); assert.equal(s.dir().x, 1, 'becoming visible keeps keys');
});

test('CTL1 shortcuts and junk never move the hero; listeners are capture-phase and unbind cleanly', () => {
  const { h, win, off } = setup();
  win.fire('keydown', ev('KeyD', { ctrlKey: true })); win.fire('keydown', ev('KeyW', { altKey: true })); win.fire('keydown', ev('KeyS', { metaKey: true }));
  win.fire('keydown', ev('KeyQ')); win.fire('keydown', ev('__proto__')); win.fire('keydown', { code: 7, key: {} }); win.fire('keydown', null || {});
  assert.equal(h.size, 0);
  assert.ok(win.l.keydown.every((x) => x.cap) && win.l.keyup.every((x) => x.cap), 'capture: seen before any overlay handler');
  for (let i = 0; i < 20; i++) win.fire('keydown', ev(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'][i % 8]));
  assert.ok(h.size <= 8);
  off();
  assert.equal(win.l.keydown.length + win.l.keyup.length + win.l.blur.length, 0);
});

test('CTL1 moveCode: physical code first, key only as a fallback when code is missing', () => {
  assert.equal(moveCode({ code: 'KeyW', key: 'z' }), 'KeyW'); // AZERTY: the physical W position still means up
  assert.equal(moveCode({ code: '', key: 'ArrowLeft' }), 'ArrowLeft');
  assert.equal(moveCode({ code: 'KeyZ', key: 'w' }), '');
  assert.equal(moveCode({ code: 'hasOwnProperty' }), '');
  assert.equal(moveCode(null), '');
});

test('CTL1 debug line names the held keys, direction and the last clear', () => {
  const { h, win } = setup();
  assert.match(h.describe(), /keys none dir -/);
  win.fire('keydown', ev('KeyW')); win.fire('keydown', ev('ArrowRight'));
  assert.match(h.describe(), /keys W\+Right dir NE/);
  win.fire('blur'); assert.match(h.describe(), /cleared: blur/);
});

test('CTL1 scene wiring: movement from the tracker, Space queued only while the run is live, drained otherwise; Space swallow cannot linger', () => {
  const sc = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
  assert.ok(/this\.held\.axis\(o\)/.test(sc));
  assert.ok(!/k\.[ADWS]\.isDown|k\.(LEFT|RIGHT|UP|DOWN)\.isDown/.test(sc), 'no Phaser key state for movement');
  assert.ok(/bindHeldKeys\(this\.held, window, document\)/.test(sc));
  assert.ok(/s\.state === 'running' && !app\.paused && !\(app\.ui && app\.ui\.settingsOpen\)\) this\.abilityQ = true/.test(sc));
  assert.ok(/drainAbilityKey\(\) \{[^}]*this\.abilityQ = false/.test(sc));
  const ui = readFileSync(new URL('../src/ui/ui.js', import.meta.url), 'utf8');
  assert.ok(/window\.addEventListener\('blur', off\)/.test(ui) && /performance\.now\(\) - t0 < 2000/.test(ui));
});
