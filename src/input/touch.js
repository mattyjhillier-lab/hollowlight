// Touch controls (TOUCH-1): floating stick, ability button, pause button. DOM only (no Phaser).
// Layout is PROVISIONAL: all positions live in the .touch-* CSS rules in style.css; this file only wires input.
// Safety: one finger owns the stick (by pointer id), the ability button has its own pointer id, everything is
// released on cancel / blur / hidden / orientation change / state change so nothing can stick.
import { Stick, stickRadius } from './stick.js';

const ZONE_FRAC = 0.55; // left share of the screen that can start the stick (CSS: .touch-zone width)

export class TouchControls {
  // hooks: { pause(), autoPause() }
  constructor(root, hooks) {
    this.hooks = hooks;
    this.stick = new Stick(stickRadius('medium'));
    this.enabled = false;
    this.live = false; // layer currently accepting input (a run is active, not paused)
    this.abilityQueued = false;
    this.abilityId = null;
    this.dirty = true;
    this.cache = { name: '', state: '', p: -1 };

    const mk = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls; if (text !== undefined) n.textContent = text; return n; };
    this.root = root;
    root.classList.add('touch-layer');
    root.style.display = 'none';
    this.zone = mk('div', 'touch-zone');
    this.base = mk('div', 'touch-base');
    this.knob = mk('div', 'touch-knob');
    this.base.append(this.knob);
    this.base.style.display = 'none';
    this.ab = mk('button', 'touch-ability');
    this.ab.type = 'button';
    this.ab.setAttribute('aria-label', 'Use ability');
    this.abName = mk('span', 'ta-name');
    this.abState = mk('span', 'ta-state');
    this.ab.append(this.abName, this.abState);
    this.pauseBtn = mk('button', 'touch-pause', 'II');
    this.pauseBtn.type = 'button';
    this.pauseBtn.setAttribute('aria-label', 'Pause');
    root.append(this.zone, this.base, this.ab, this.pauseBtn);

    const z = this.zone;
    z.addEventListener('pointerdown', (e) => {
      if (!this.live) return;
      e.preventDefault();
      if (!this.stick.down(e.pointerId, e.clientX, e.clientY)) return;
      try { z.setPointerCapture(e.pointerId); } catch { /* not supported / already gone */ }
      this.dirty = true;
    });
    z.addEventListener('pointermove', (e) => { if (this.stick.move(e.pointerId, e.clientX, e.clientY)) this.dirty = true; });
    const end = (e) => { if (this.stick.up(e.pointerId)) this.dirty = true; };
    z.addEventListener('pointerup', end);
    z.addEventListener('pointercancel', end);
    z.addEventListener('lostpointercapture', end);
    z.addEventListener('touchcancel', () => this.release());

    const ab = this.ab;
    ab.addEventListener('pointerdown', (e) => {
      if (!this.live) return;
      e.preventDefault();
      if (this.abilityId !== null) return;
      this.abilityId = e.pointerId;
      this.abilityQueued = true;
      ab.classList.add('down');
      try { ab.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    });
    const abEnd = (e) => { if (e.pointerId === this.abilityId) this.clearAbility(); };
    ab.addEventListener('pointerup', abEnd);
    ab.addEventListener('pointercancel', abEnd);
    ab.addEventListener('lostpointercapture', abEnd);
    ab.addEventListener('touchcancel', () => this.clearAbility());

    this.pauseBtn.addEventListener('click', (e) => { e.preventDefault(); if (this.live) this.hooks.pause(); });

    // Page-level safety nets and gesture blockers.
    root.addEventListener('contextmenu', (e) => e.preventDefault());
    const lose = () => { this.release(); if (this.enabled && this.hooks.autoPause) this.hooks.autoPause(); };
    window.addEventListener('blur', lose);
    document.addEventListener('visibilitychange', () => { if (document.hidden) lose(); });
    window.addEventListener('pagehide', () => this.release());
    // Orientation flips drop the stick; plain resizes (mobile URL bar) do not.
    let land = window.innerWidth >= window.innerHeight;
    const reshape = () => { const l = window.innerWidth >= window.innerHeight; if (l !== land) { land = l; this.release(); } };
    window.addEventListener('orientationchange', () => this.release());
    window.addEventListener('resize', reshape);
    document.addEventListener('contextmenu', (e) => { if (this.enabled) e.preventDefault(); });
    document.addEventListener('gesturestart', (e) => { if (this.enabled) e.preventDefault(); });
  }

  clearAbility() {
    this.abilityId = null;
    this.ab.classList.remove('down');
  }

  // Drop every held input. Safe to call any time.
  release() {
    this.stick.cancel();
    this.clearAbility();
    this.abilityQueued = false;
    this.dirty = true;
  }

  configure(enabled, sizeName) {
    this.enabled = !!enabled;
    this.stick.setRadius(stickRadius(sizeName));
    const d = `${this.stick.radius * 2}px`;
    this.base.style.width = d;
    this.base.style.height = d;
    this.knob.style.width = `${Math.round(this.stick.radius * 0.8)}px`;
    this.knob.style.height = `${Math.round(this.stick.radius * 0.8)}px`;
    document.documentElement.classList.toggle('touch', this.enabled);
    if (!this.enabled) this.release();
    this.sync(this.live);
  }

  // active = a run is in progress and not paused/overlaid. Called every frame; only acts on change.
  sync(active) {
    const on = !!active && this.enabled;
    if (on === this.live && (this.root.style.display !== 'none') === on) return;
    this.live = on;
    this.root.style.display = on ? 'block' : 'none';
    if (!on) this.release();
  }

  // Merge into the shared input object (reused every frame). Returns true if the stick is driving movement.
  read(out) {
    if (!this.live) return false;
    const s = this.stick;
    if (s.x === 0 && s.y === 0) return false;
    out.x = s.x;
    out.y = s.y;
    return true;
  }

  takeAbility() {
    if (!this.abilityQueued) return false;
    this.abilityQueued = false;
    return true;
  }

  setAbility(name, ready, frac, secs) {
    const c = this.cache;
    if (c.name !== name) { c.name = name; this.abName.textContent = name; }
    const st = ready ? 'READY' : `${secs}s`;
    if (c.state !== st) { c.state = st; this.abState.textContent = st; this.ab.classList.toggle('ready', ready); }
    const p = Math.round(Math.max(0, Math.min(1, frac)) * 100);
    if (c.p !== p) { c.p = p; this.ab.style.setProperty('--p', String(p)); }
  }

  // Draw the stick (only when something changed).
  render() {
    if (!this.dirty) return;
    this.dirty = false;
    const s = this.stick;
    if (!s.active) { this.base.style.display = 'none'; return; }
    const r = s.radius;
    this.base.style.display = 'block';
    this.base.style.transform = `translate(${s.ox - r}px, ${s.oy - r}px)`;
    const k = this.knob;
    const kr = (r * 0.8) / 2;
    k.style.transform = `translate(${s.px - s.ox + r - kr}px, ${s.py - s.oy + r - kr}px)`;
  }
}

export { ZONE_FRAC };
