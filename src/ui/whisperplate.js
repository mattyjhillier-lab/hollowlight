// FM1: the whisper plate (lantern glass, brass edge, cream line + italic whisper, a gold thread that burns down). DOM only, built with
// createElement + textContent (never innerHTML). Display-only: the Whispers director (whispers.js) decides what shows; this draws it.
// Fixed above the touch layer so a tap can hide it; never focusable (no focus theft mid-run); the screen reader hears each line once.

export class WhisperPlate {
  constructor(doc, { onHide } = {}) {
    this.doc = doc;
    const el = (tag, cls) => { const n = doc.createElement(tag); if (cls) n.className = cls; return n; };
    this.el = el;
    this.root = el('div', 'fm-plate');
    this.root.setAttribute('aria-hidden', 'true'); // the visible plate; the live region below carries the words for assistive tech
    this.line = el('div', 'fm-t');
    this.whisper = el('div', 'fm-w');
    this.skip = el('span', 'fm-skip');
    this.thread = el('i', 'fm-thread');
    const body = el('div', 'fm-body');
    body.append(this.line, this.whisper);
    this.root.append(body, this.skip, this.thread);
    this.sr = el('div', 'fm-sr');
    this.sr.setAttribute('role', 'status');
    this.sr.setAttribute('aria-live', 'polite');
    this.ghost = el('i', 'fm-ghost'); // touch: where the thumb goes (move plate)
    this.ghost.setAttribute('aria-hidden', 'true');
    this.root.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (onHide) onHide(); });
    doc.body.append(this.root, this.sr, this.ghost);
    this.cur = null;
    this.ringEls = [];
  }

  /** plate: from plateFor() or null. frac: thread left (1 -> 0). calm: fade only. */
  show(plate, frac, calm, rings = []) {
    const r = this.root;
    if (plate !== this.cur) {
      this.cur = plate;
      this.setRing(plate && plate.ring ? rings : []);
      if (!plate) { r.classList.remove('on'); this.ghost.classList.remove('on'); return; }
      this.line.replaceChildren();
      for (const p of plate.parts) {
        if (p.key) { const k = this.el('kbd', 'fm-kb'); k.textContent = p.key; this.line.append(k); } else this.line.append(this.doc.createTextNode(p.text));
      }
      this.whisper.textContent = plate.w;
      this.skip.textContent = plate.skip;
      r.className = `fm-plate fm-${plate.id}${calm ? ' calm' : ''}`;
      void r.offsetWidth;
      r.classList.add('on');
      this.ghost.classList.toggle('on', !!plate.ghost);
      this.sr.textContent = plate.sr; // once per plate (the live region announces the change)
    }
    if (plate) this.thread.style.transform = `scaleX(${Math.max(0, Math.min(1, frac)).toFixed(3)})`;
  }

  setRing(els) {
    for (const e of this.ringEls) e.classList.remove('fm-ring');
    this.ringEls = els.filter(Boolean);
    for (const e of this.ringEls) e.classList.add('fm-ring');
  }

  hide() { this.show(null, 0, false); }
}
