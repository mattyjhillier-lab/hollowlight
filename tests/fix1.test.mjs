// fix1 (Matt playtest): persistent menu tab bar, close-button size/contrast, About placeholders gone, text-fit audit tool present, dawn clock ease.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const R = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, listeners: {}, dataset: {}, style: {}, textContent: '', className: '', classList: { toggle() {} },
    setAttribute(k, v) { this.attrs[k] = String(v); }, removeAttribute(k) { delete this.attrs[k]; }, appendChild(c) { this.children.push(c); return c; },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }, click() { (this.listeners.click || []).forEach((f) => f({})); } };
  n.classList = { s: new Set(), toggle(c, on) { if (on) this.s.add(c); else this.s.delete(c); } };
  return n;
}
const doc = { createElement: mkNode };

test('menu tab bar: five tabs in the locked order, each reports its id, only the active one is current, hidden when told', async () => {
  const { buildMenuNav, NAV_TABS } = await import('../src/ui/menunav.js');
  assert.deepEqual(NAV_TABS.map((t) => t.label), ['Character', 'Tree', 'Goals', 'Almanac', 'Settings']);
  const got = [];
  const nav = buildMenuNav(doc, (id) => got.push(id));
  assert.equal(nav.root.children.length, 5);
  nav.root.children.forEach((b) => b.click());
  assert.deepEqual(got, ['character', 'tree', 'goals', 'almanac', 'settings']);
  nav.set(true, 'goals');
  assert.equal(nav.root.style.display, 'flex');
  assert.equal(nav.root.children.filter((b) => b.attrs['aria-current'] === 'page').length, 1);
  assert.equal(nav.root.children[2].attrs['aria-current'], 'page');
  nav.set(false, null);
  assert.equal(nav.root.style.display, 'none');
});

test('close button: at least 44 px, high-contrast cream on dark with a gold ring (one style)', () => {
  const css = R('src/ui/treescreen.css');
  const rule = css.split('\n').find((l) => l.startsWith('.ts-close {'));
  assert.ok(rule, 'rule exists');
  assert.match(rule, /width: 44px/); assert.match(rule, /height: 44px/);
  assert.match(rule, /border: 2px solid #ffd98a/); assert.match(rule, /color: #fff3d6/);
  const nav = R('src/ui/menunav.css');
  assert.match(nav, /min-height: 44px/);
});

test('About: no feedback row, no TODO or draft placeholder; the honest one-developer note and the madeBy line stay', async () => {
  const { ABOUT } = await import('../src/ui/aboutcopy.js');
  const all = JSON.stringify(ABOUT);
  assert.ok(!/TODO|Draft for|Feedback|feedback/.test(all));
  assert.equal(ABOUT.madeBy, 'Made by Matt Hillier, with the heavy lifting done by Claude.');
  assert.match(ABOUT.ai, /one developer working with an AI coding assistant/);
});

test('text-fit audit tool ships (debug only) and the forest floor starts painting early', () => {
  const a = R('src/ui/fitaudit.js');
  assert.match(a, /__fitAudit/); assert.match(a, /__fitSweep/);
  assert.match(a, /debug=1/);
  const rs = R('src/scenes/RunScene.js');
  assert.match(rs, /b\.t > 0\.4/);
  assert.match(rs, /DAWN_EASE/);
});
