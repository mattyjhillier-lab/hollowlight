// A1-A3 fake DOM (same shape as tests/u4.test.mjs): textContent only, innerHTML throws.
export function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, _cls: new Set(), _text: '', listeners: {}, hidden: false, style: { setProperty() {} },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    appendChild(c) { this.children.push(c); return c; }, append(...cs) { cs.forEach((c) => this.children.push(c)); }, replaceChildren(...cs) { this.children = cs; this._text = ''; },
    querySelector(sel) { let f = null; const cls = sel.startsWith('.') ? sel.slice(1) : null; const w = (x) => { if (f) return; if (cls && x._cls.has(cls)) f = x; else if (!cls && x.tag === sel) f = x; x.children.forEach(w); }; n.children.forEach(w); return f; },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    fire(t, ev = {}) { (this.listeners[t] || []).forEach((f) => f({ preventDefault() {}, stopPropagation() {}, ...ev })); },
    remove() { n.removed = true; }, focus() { globalThis.document.activeElement = n; }, click() { if (n.disabled) return; n.fire('click'); } };
  n.classList = { add: (c) => n._cls.add(c), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c) };
  Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
  Object.defineProperty(n, 'textContent', { get: () => n._text + n.children.map((c) => c.textContent).join(''), set: (v) => { n._text = String(v); n.children = []; } });
  Object.defineProperty(n, 'innerHTML', { get() { throw new Error('innerHTML read'); }, set() { throw new Error('innerHTML write'); } });
  Object.defineProperty(n, 'outerHTML', { set() { throw new Error('outerHTML write'); } });
  return n;
}
export function installDom() { globalThis.document = { createElement: mkNode, createElementNS: (ns, t) => Object.assign(mkNode(t), { ns }), activeElement: null, documentElement: mkNode('html') }; }
export const walk = (n, f) => { f(n); n.children.forEach((c) => walk(c, f)); };
export const find = (r, p) => { const o = []; walk(r, (n) => { if (p(n)) o.push(n); }); return o; };
export const texts = (r) => { const o = []; walk(r, (n) => { if (n._text) o.push(n._text); }); return o.join(' | '); };
