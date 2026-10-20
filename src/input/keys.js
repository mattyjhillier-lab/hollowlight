// Movement keys held right now (CTL1). Pure state + a thin DOM binding; no Phaser.
// Why our own tracker: Phaser's keyboard drops any event a page handler already preventDefault-ed (the UI listener runs before it),
// keeps keys down across a hidden tab or a native menu that eats the keyup, and resolves opposite keys to a standstill. Here:
// - window CAPTURE listeners see every keydown/keyup first, whatever the overlays or focused controls do with them later;
// - keys are physical (e.code: WASD stays WASD on any layout; e.key is only a fallback);
// - everything is dropped when the page can miss a keyup (window blur, tab hidden, page hide, native context menu);
// - opposite keys: the one pressed LAST wins (A held, tap D = go right; release D = left again), never a dead stop.

const DIR = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
const KEY_FALLBACK = { w: 'KeyW', W: 'KeyW', a: 'KeyA', A: 'KeyA', s: 'KeyS', S: 'KeyS', d: 'KeyD', D: 'KeyD', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', Up: 'ArrowUp', Down: 'ArrowDown', Left: 'ArrowLeft', Right: 'ArrowRight' };
const MAX_HELD = 8;

// Movement code for a KeyboardEvent-like {code, key}, or '' (untrusted input: only whitelisted strings map).
export function moveCode(e) {
  if (!e) return '';
  const c = typeof e.code === 'string' ? e.code : '';
  if (Object.hasOwn(DIR, c)) return c;
  const k = typeof e.key === 'string' ? e.key : '';
  return !c && Object.hasOwn(KEY_FALLBACK, k) ? KEY_FALLBACK[k] : '';
}

export class HeldKeys {
  constructor() { this.codes = []; this.seq = []; this.n = 0; this.tick = 0; this.lastClear = ''; }

  // returns true if it is a movement key
  press(code) {
    if (!Object.hasOwn(DIR, code)) return false;
    for (let i = 0; i < this.n; i++) if (this.codes[i] === code) return true; // autorepeat: keeps its original order
    if (this.n >= MAX_HELD) return true;
    this.codes[this.n] = code; this.seq[this.n] = ++this.tick; this.n++;
    return true;
  }

  release(code) {
    for (let i = 0; i < this.n; i++) {
      if (this.codes[i] !== code) continue;
      for (let j = i; j < this.n - 1; j++) { this.codes[j] = this.codes[j + 1]; this.seq[j] = this.seq[j + 1]; }
      this.n--;
      return true;
    }
    return false;
  }

  clear(why = '') { this.n = 0; if (why) this.lastClear = why; }
  get size() { return this.n; }
  list() { return this.codes.slice(0, this.n); }

  // Writes the move axis into out {x, y} (each -1, 0 or 1); per axis the most recently pressed held direction wins.
  axis(out) {
    let sx = 0, tx = -1, sy = 0, ty = -1;
    for (let i = 0; i < this.n; i++) {
      const d = DIR[this.codes[i]], t = this.seq[i];
      if (d === 'l' || d === 'r') { if (t > tx) { tx = t; sx = d === 'l' ? -1 : 1; } } else if (t > ty) { ty = t; sy = d === 'u' ? -1 : 1; }
    }
    out.x = sx; out.y = sy;
    return out;
  }

  // Short debug text: held codes and the resulting direction.
  describe() {
    const o = this.axis({ x: 0, y: 0 });
    const arrow = (o.y < 0 ? 'N' : o.y > 0 ? 'S' : '') + (o.x < 0 ? 'W' : o.x > 0 ? 'E' : '') || '-';
    return `keys ${this.n ? this.list().map((c) => c.replace(/^Key|^Arrow/, '')).join('+') : 'none'} dir ${arrow}${this.lastClear ? ` (cleared: ${this.lastClear})` : ''}`;
  }
}

// Wire a HeldKeys to the page. win/doc injectable for tests. Returns an unbind function.
export function bindHeldKeys(held, win, doc) {
  const kd = (e) => { if (!e.ctrlKey && !e.metaKey && !e.altKey) held.press(moveCode(e)); };
  const ku = (e) => { held.release(moveCode(e)); }; // a keyup always releases, modifiers or not, prevented or not
  const blur = () => held.clear('blur');
  const vis = () => { if (doc.hidden) held.clear('hidden'); };
  const hide = () => held.clear('pagehide');
  const menu = () => held.clear('menu');
  win.addEventListener('keydown', kd, true);
  win.addEventListener('keyup', ku, true);
  win.addEventListener('blur', blur);
  win.addEventListener('pagehide', hide);
  win.addEventListener('contextmenu', menu, true);
  doc.addEventListener('visibilitychange', vis);
  return () => {
    win.removeEventListener('keydown', kd, true); win.removeEventListener('keyup', ku, true); win.removeEventListener('blur', blur);
    win.removeEventListener('pagehide', hide); win.removeEventListener('contextmenu', menu, true); doc.removeEventListener('visibilitychange', vis);
  };
}
