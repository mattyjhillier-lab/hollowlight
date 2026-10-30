// fix1 (Matt playtest): persistent menu tab bar, close-button size/contrast, About placeholders gone, text-fit audit tool present, dawn clock ease.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const R = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, listeners: {}, dataset: {}, style: {}, textContent: '', className: '', classList: { toggle() {} },
    setAttribute(k, v) { this.attrs[k] = String(v); }, removeAttribute(k) { delete this.attrs[k]; }, appendChild(c) { this.children.push(c); return c; }, replaceChildren(...c) { this.children = c; },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }, click() { (this.listeners.click || []).forEach((f) => f({})); } };
  n.classList = { s: new Set(), toggle(c, on) { if (on) this.s.add(c); else this.s.delete(c); } };
  return n;
}
const doc = { createElement: mkNode, createElementNS: (ns, t) => mkNode(t) };

test('menu tab row: Home + five tabs in the locked order, each reports its id and has an accessible name, only the active one is current, hidden when told', async () => {
  const { buildMenuNav, NAV_TABS, NAV_GLYPHS } = await import('../src/ui/menunav.js');
  assert.deepEqual(NAV_TABS.map((t) => t.label), ['Home', 'Character', 'Tree', 'Goals', 'Almanac', 'Settings']);
  assert.deepEqual(Object.keys(NAV_GLYPHS), NAV_TABS.map((t) => t.id), 'one code-drawn glyph per tab');
  const got = [];
  const nav = buildMenuNav(doc, (id) => got.push(id));
  const btns = NAV_TABS.map((t) => nav.tabs[t.id]);
  assert.equal(btns.length, 6);
  btns.forEach((b) => b.click());
  assert.deepEqual(got, ['home', 'character', 'tree', 'goals', 'almanac', 'settings']);
  NAV_TABS.forEach((t, i) => assert.equal(btns[i].attrs['aria-label'], t.label));
  assert.equal(nav.set(true, 'goals'), false, 'no purse handed over: no strip');
  assert.equal(nav.root.style.display, 'flex');
  assert.equal(btns.filter((b) => b.attrs['aria-current'] === 'page').length, 1);
  assert.equal(btns[3].attrs['aria-current'], 'page');
  nav.setPurse(mkNode('div'));
  assert.equal(nav.set(true, 'tree'), true, 'tree with a purse shows the purse slot');
  assert.equal(nav.set(true, 'settings'), false, 'purse only on tree / goals');
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

test('C1 menu tab row: one stylesheet for phone and desktop (container query, not html.phone), 44px hit area, Larger text goes icon-only, ts-short is phone-landscape sized', () => {
  const css = R('src/ui/menunav.css');
  assert.ok(!/html\.phone/.test(css), 'no phone-only branch');
  assert.match(css, /@container \(max-width: 640px\)/);
  assert.match(css, /@container \(min-width: 900px\)/);
  assert.match(css, /\.mnav__tab \{[^}]*min-height: 44px/);
  assert.match(css, /:root\[data-text="larger"\] \.mnav__tab:not\(\.is-on\) \.mnav__lbl/);
  assert.match(css, /\.mnav\.has-purse \.mnav__slot \{ flex: 1 1 100%; height: 30px/);
  assert.match(R('src/ui/treescreen.js'), /'ts-short', this\.H <= 520 && this\.W > this\.H && this\.W <= 1000/);
  assert.match(R('src/ui/ui.js'), /dest === 'home'/);
});
