// FREEZE-1 phone heat: Phaser 3.90 draws into every DynamicTexture through ONE shared capture target (renderer.renderTarget), resized to the
// texture being drawn. The hero outline (288 x 288) and the Med/High lightmap (~half the canvas) are both drawn every frame, so the shared target
// was deleted and re-created twice a frame: a new GL texture + framebuffer (+ a checkFramebufferStatus sync) 120 times a second on a phone.
// A texture flagged `ownCapture` gets its own capture target of its own size instead (made once, kept), so nothing is re-allocated per frame.
// Same draw path and same pixels (same RenderTarget class and options as the shared one); render only. Opt-in per texture.
let installed = false;

/** Patch DynamicTexture once (idempotent). `DT` = Phaser.Textures.DynamicTexture. Returns true when the patch is in place. */
export function installOwnCapture(DT) {
  if (installed) return true;
  const P = DT && DT.prototype;
  if (!P || typeof P.beginDraw !== 'function' || typeof P.endDraw !== 'function') return false;
  const begin = P.beginDraw, end = P.endDraw, destroy = P.destroy;
  P.beginDraw = function () {
    const r = this.renderer, rt = this.renderTarget;
    if (!this.ownCapture || this.isDrawing || !rt || !r || !r.renderTarget) return begin.call(this);
    try {
      if (!this.capRT) this.capRT = new r.renderTarget.constructor(r, rt.width, rt.height, 1, 0, true, true);
    } catch (e) { this.ownCapture = false; return begin.call(this); } // cannot make one: the shared path, as before
    this.capPrev = r.renderTarget;
    r.renderTarget = this.capRT;
    try { return begin.call(this); } catch (e) { r.renderTarget = this.capPrev; this.capPrev = null; throw e; }
  };
  P.endDraw = function (erase) {
    try { return end.call(this, erase); } finally {
      if (this.capPrev) { this.renderer.renderTarget = this.capPrev; this.capPrev = null; }
    }
  };
  if (typeof destroy === 'function') {
    P.destroy = function (...a) {
      if (this.capRT) { try { this.capRT.destroy(); } catch (e) { /* already gone with the context */ } this.capRT = null; }
      return destroy.apply(this, a);
    };
  }
  installed = true;
  return true;
}
