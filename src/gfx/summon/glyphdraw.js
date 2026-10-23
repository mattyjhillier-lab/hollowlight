// S5 Ink Glyph Orb: draws one Spirit Bolt projectile in the new look (render only: reads the sim projectile, never writes it). Called by RunScene
// for every on-screen bolt once the glyph art is baked (boltReady); ?summons=0 never gets here (no atlas). Pools (sum_atlas images) are passed in.
//   base glyph      orb (upright, one of 5 glyphs by id) + ink tail turned to the heading (curls toward the turn; straight under Calm; none on Low)
//   Spirit Tempest  the same orb + gold rim overlay (capped) ; the torn page at the burst is drawn by drawTornPages
//   Soul Lance      the written-line capsule with gold edges (head at the lance tip), stretched up to 1.6x across for wide lances
//   Returning Pages folded page (cream out with the ink tail; pale cool page home with a dotted curl behind it)
import { glyphLook, GLYPH_WPD, GLYPH_K, GLYPH_BOX, LANCE_BOX, LANCE_LEN, LANCE_U, TAIL_BOX, GLYPH_CAPS } from './glyph.js';
import { frameReady } from './atlas.js';

export const ORB_U = GLYPH_BOX[2] * GLYPH_WPD; // world units across a glyph frame at 1.0x
export const LANCE_WPD = LANCE_U / (LANCE_LEN + 6); // capsule tail end (x 0) to head tip (x 166) = LANCE_U world units
export const PAGE_K = 1.1;

// o: { pools: { glyph, tail, rim, self? }, selfA, low, calm, k, dt, depth, counts: { tails, rims }, caps, st (Map) , fxg (Graphics) }
export function drawGlyph(b, o) {
  const P = o.pools, k = o.k ?? GLYPH_K;
  let s = o.st.get(b.id);
  if (!s) { s = {}; o.st.set(b.id, s); }
  s.seen = o.tick;
  const look = glyphLook(s, b, o.dt, o.calm);
  if (b.lance && frameReady('lance_0')) {
    const sc = LANCE_WPD * (LANCE_BOX[2] / 144), across = Math.max(1, Math.min(1.6, (b.r || 1) / 2.5));
    P.glyph.get(b.id).setFrame('lance_0').setOrigin(172 / 176, 0.5).setPosition(b.x, b.y).setRotation(look.rot).setFlip(false, Math.cos(look.rot) < 0).setScale(sc, sc * across).setDepth(o.depth).setAlpha(1);
    return 'lance';
  }
  const page = b.pages && frameReady('page_0');
  const fr = page ? (b.back ? 'page_1' : 'page_0') : o.low ? 'flat_glyph' : look.fr;
  const tex = 48, sc = (ORB_U * k * (page ? PAGE_K : 1)) / tex;
  P.glyph.get(b.id).setFrame(fr).setOrigin(0.5, 0.5).setPosition(b.x, b.y).setRotation(0).setFlip(false, false).setScale(sc).setDepth(o.depth).setAlpha(1);
  if (P.self && o.selfA > 0) P.self.get(b.id).setFrame(fr).setOrigin(0.5, 0.5).setPosition(b.x, b.y).setRotation(0).setFlip(false, false).setScale(sc).setDepth(o.depth + 0.0005).setAlpha(o.selfA); // High bloom only: additive self-light copy (as wolves / ravens)
  const cap = GLYPH_CAPS[o.tier] || GLYPH_CAPS.high;
  if (!o.low && !(page && b.back) && o.counts.tails < Math.round(cap.tails * (o.phone ? 0.85 : 1))) {
    o.counts.tails++;
    const ts = (TAIL_BOX[2] * GLYPH_WPD * k) / 74; // tail frames are 74 texels for the 46 du box (same du scale as the orb)
    P.tail.get(b.id).setFrame(look.tail).setOrigin(44 / 46, 0.5).setPosition(b.x, b.y).setRotation(look.rot).setFlip(false, look.flipY).setScale(ts).setDepth(o.depth - 0.001).setAlpha(1);
  }
  if (page && b.back && o.fxg && !o.low) { // dotted curl home: 5 dots curving away behind the page (static shape, so Calm is unchanged)
    const ca = Math.cos(look.rot), sa = Math.sin(look.rot), u = GLYPH_WPD * k;
    for (let i = 1; i <= 5; i++) {
      const t = i / 5, bx = -(6 + 30 * t) * u, by = -(12 * t * t) * u;
      o.fxg.fillStyle(0x7ff0ff, 0.75 - t * 0.35).fillCircle(b.x + ca * bx - sa * by, b.y + sa * bx + ca * by, 0.55);
    }
  }
  if (b.evo === 'spirit_tempest' && !page && frameReady('glyph_rim') && o.counts.rims < cap.rims) {
    o.counts.rims++;
    P.rim.get(b.id).setFrame('glyph_rim').setOrigin(0.5, 0.5).setPosition(b.x, b.y).setScale(sc).setDepth(o.depth + 0.001).setAlpha(1);
  }
  return page ? 'page' : 'orb';
}

// Spirit Tempest: a torn page at the volley's burst ring (the sim's 0.24 s cyan ring of r 46 at the hero), fading out; fades only (Calm-safe).
export function drawTornPages(fxList, pool, depth, k = GLYPH_K) {
  let n = 0;
  if (!frameReady('gtorn')) return 0;
  for (const f of fxList) {
    if (f.kind !== 'ring' || f.color !== '#7ff0ff' || !(f.r >= 40)) continue;
    const a = Math.max(0, Math.min(1, f.ttl / 0.24));
    pool.get('t' + n).setFrame('gtorn').setPosition(f.x, f.y - 4).setScale((12 * k) / 48 * (1.15 - 0.15 * a)).setDepth(depth).setAlpha(a);
    if (++n >= 3) break;
  }
  return n;
}
