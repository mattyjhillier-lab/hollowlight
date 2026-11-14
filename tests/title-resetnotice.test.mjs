// The one-time tree-refund card on the title: validates numbers, text only, Got it clears and removes.
import test from 'node:test';
import assert from 'node:assert/strict';

function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, _cls: new Set(), _text: '', listeners: {}, style: { setProperty() {} }, removed: false,
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    appendChild(c) { this.children.push(c); return c; }, append(...cs) { cs.forEach((c) => this.children.push(c)); }, replaceChildren(...cs) { this.children = cs; this._text = ''; },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }, remove() { this.removed = true; } };
  n.classList = { add: (...c) => c.forEach((x) => n._cls.add(x)), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c) };
  Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
  Object.defineProperty(n, 'textContent', { get: () => n._text + n.children.map((c) => c.textContent).join(''), set: (v) => { n._text = String(v); n.children = []; } });
  Object.defineProperty(n, 'innerHTML', { get() { throw new Error('innerHTML read'); }, set() { throw new Error('innerHTML write'); } });
  return n;
}
globalThis.document = { createElement: mkNode, createElementNS: (ns, t) => Object.assign(mkNode(t), { ns }), activeElement: null };
const { buildResetNotice } = await import('../src/ui/savesafety.js');

test('shows the refund once, text only, and Got it clears it', () => {
  let done = 0;
  const v = buildResetNotice({ gold: 24010, shards: 2, glass: 0, nodes: 26 }, { onDone: () => { done++; } });
  assert.match(v.root.textContent, /26 of your lit lanterns/);
  assert.match(v.root.textContent, /24,010 gold, 2 shards/);
  v.ok.listeners.click[0]();
  assert.equal(done, 1); assert.ok(v.root.removed);
});
test('hostile or empty notes show nothing and never markup', () => {
  assert.equal(buildResetNotice(null), null);
  assert.equal(buildResetNotice({ nodes: 0, gold: 5 }), null);
  assert.equal(buildResetNotice({ nodes: '<img onerror=1>', gold: 1 }), null);
  const v = buildResetNotice({ nodes: 1e99, gold: '<b>x</b>', shards: -4, glass: {} });
  assert.ok(!/[<>]/.test(v.root.textContent));
});
