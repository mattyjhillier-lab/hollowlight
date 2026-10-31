// DESKTOP D5: menu-only shortcuts (1-6 tabs, F full screen) go through the key map and never fire in a run, while typing, or where a screen owns the digits.
import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers.mjs';
import { deskKeyAction, isTyping, TAB_IDS, NUMBER_SCREENS } from '../src/ui/deskkeys.js';
import { setActiveKeymap, defaultKeymap, assignKey, ACTIONS, DEFAULT_KEYS, cleanKeymap } from '../src/input/keymap.js';

const key = (code, extra = {}) => ({ code, key: code, ...extra });
const menu = (active, extra = {}) => ({ menu: true, pause: false, active, blocked: false, ...extra });

test('default map: digits switch tabs on Home / Tree / Goals / Settings; the current tab does nothing', () => {
  setActiveKeymap(defaultKeymap());
  assert.deepEqual(deskKeyAction(key('Digit3'), menu('home')), { type: 'tab', id: 'tree' });
  assert.deepEqual(deskKeyAction(key('Numpad2'), menu('settings')), { type: 'tab', id: 'character' });
  assert.deepEqual(deskKeyAction(key('Digit6'), menu('tree')), { type: 'tab', id: 'settings' });
  assert.equal(deskKeyAction(key('Digit1'), menu('home')), null);
  assert.equal(deskKeyAction(key('Digit7'), menu('home')), null);
  assert.deepEqual(TAB_IDS, ['home', 'character', 'tree', 'goals', 'almanac', 'settings']);
});

test('digits are left alone where the screen owns them (Character page, Almanac, loadout pickers) and in a run', () => {
  setActiveKeymap(defaultKeymap());
  for (const a of ['character', 'almanac', null]) assert.equal(deskKeyAction(key('Digit3'), menu(a)), null, String(a));
  assert.ok(!NUMBER_SCREENS.includes('character') && !NUMBER_SCREENS.includes('almanac'));
  assert.equal(deskKeyAction(key('Digit3'), { menu: false, pause: false, active: null }), null, 'in a run');
  assert.equal(deskKeyAction(key('Digit3'), { menu: false, pause: true, active: null }), null, 'pause menu has no tabs');
});

test('F toggles full screen on menus and the pause menu, never in a run', () => {
  setActiveKeymap(defaultKeymap());
  assert.deepEqual(deskKeyAction(key('KeyF'), menu('character')), { type: 'fs' });
  assert.deepEqual(deskKeyAction(key('KeyF'), { menu: false, pause: true }), { type: 'fs' });
  assert.equal(deskKeyAction(key('KeyF'), { menu: false, pause: false }), null);
});

test('blocked / typing / repeat / modifier keys never trigger', () => {
  setActiveKeymap(defaultKeymap());
  assert.equal(deskKeyAction(key('KeyF'), menu('home', { blocked: true })), null);
  assert.equal(deskKeyAction(key('KeyF', { repeat: true }), menu('home')), null);
  assert.equal(deskKeyAction(key('KeyF', { ctrlKey: true }), menu('home')), null);
  assert.equal(deskKeyAction(key('KeyF', { target: { tagName: 'INPUT', type: 'text' } }), menu('home')), null);
  assert.equal(deskKeyAction(key('Digit3', { target: { tagName: 'TEXTAREA' } }), menu('home')), null);
  assert.equal(deskKeyAction(key('Digit3', { target: { tagName: 'INPUT', type: 'range' } }), menu('home')).type, 'tab', 'a slider is not typing');
  assert.equal(isTyping({ tagName: 'DIV', isContentEditable: true }), true);
  assert.equal(isTyping(null), false);
  assert.equal(deskKeyAction(null, menu('home')), null);
});

test('remapping is honoured: a moved key works, the old key stops', () => {
  const r = assignKey(defaultKeymap(), 'pick3', 0, 'KeyQ');
  assert.ok(r.ok);
  setActiveKeymap(r.map);
  assert.deepEqual(deskKeyAction(key('KeyQ'), menu('home')), { type: 'tab', id: 'tree' });
  assert.equal(deskKeyAction(key('Digit3'), menu('home')), null);
  const f = assignKey(r.map, 'fullscreen', 0, 'KeyG');
  setActiveKeymap(f.map);
  assert.deepEqual(deskKeyAction(key('KeyG'), menu('home')), { type: 'fs' });
  assert.equal(deskKeyAction(key('KeyF'), menu('home')), null);
  setActiveKeymap(defaultKeymap());
});

test('fullscreen action is part of the validated key map (default F, old saves without it get the default)', () => {
  assert.ok(ACTIONS.includes('fullscreen'));
  assert.deepEqual(DEFAULT_KEYS.fullscreen, ['KeyF', null]);
  const old = defaultKeymap(); delete old.fullscreen;
  assert.deepEqual(cleanKeymap(old).fullscreen, ['KeyF', null]);
  const taken = defaultKeymap(); delete taken.fullscreen; taken.reroll = ['KeyF', null];
  assert.deepEqual(cleanKeymap(taken).fullscreen, [null, null], 'a key the player already bound elsewhere is not stolen');
});
