// PNG8 encoder fallback (median-cut, 15-bit histogram, no dither). Node built-ins only. Used only when 24-bit rounding cannot hit the size cap.
import { inflateSync, deflateSync, crc32 } from 'node:zlib';
export function decode(buf) {
  let p = 8, w, h, ct, idat = [];
  while (p < buf.length) { const len = buf.readUInt32BE(p), type = buf.toString('latin1', p + 4, p + 8); const d = buf.subarray(p + 8, p + 8 + len); if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; } if (type === 'IDAT') idat.push(d); p += 12 + len; }
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp, raw = inflateSync(Buffer.concat(idat)), img = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? img[dst + x - bpp] : 0, b = y ? img[dst - stride + x] : 0, c = x >= bpp && y ? img[dst - stride + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      img[dst + x] = v & 255;
    }
  }
  return { w, h, bpp, img };
}
export function toPng8(buf, ncol = 256) {
  const { w, h, bpp, img } = decode(buf);
  const hist = new Uint32Array(32768);
  for (let i = 0; i < w * h; i++) { const o = i * bpp; hist[((img[o] >> 3) << 10) | ((img[o + 1] >> 3) << 5) | (img[o + 2] >> 3)]++; }
  let boxes = [{ bins: [] }];
  for (let k = 0; k < 32768; k++) if (hist[k]) boxes[0].bins.push(k);
  const ch = (k, c) => (c === 0 ? (k >> 10) & 31 : c === 1 ? (k >> 5) & 31 : k & 31);
  const info = (b) => { let mn = [31, 31, 31], mx = [0, 0, 0], n = 0; for (const k of b.bins) { n += hist[k]; for (let c = 0; c < 3; c++) { const v = ch(k, c); if (v < mn[c]) mn[c] = v; if (v > mx[c]) mx[c] = v; } } const r = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]]; const ax = r[0] >= r[1] && r[0] >= r[2] ? 0 : r[1] >= r[2] ? 1 : 2; return { n, ax, rng: r[ax] * Math.sqrt(n) }; };
  while (boxes.length < ncol) {
    let best = -1, bs = 0;
    boxes.forEach((b, i) => { if (b.bins.length < 2) return; const s = info(b).rng; if (s > bs) { bs = s; best = i; } });
    if (best < 0) break;
    const b = boxes[best], { n, ax } = info(b);
    b.bins.sort((p, q) => ch(p, ax) - ch(q, ax));
    let acc = 0, cut = 1; for (let i = 0; i < b.bins.length; i++) { acc += hist[b.bins[i]]; if (acc >= n / 2) { cut = Math.max(1, Math.min(b.bins.length - 1, i + 1)); break; } }
    boxes.splice(best, 1, { bins: b.bins.slice(0, cut) }, { bins: b.bins.slice(cut) });
  }
  const pal = boxes.map((b) => { let r = 0, g = 0, bl = 0, n = 0; for (const k of b.bins) { const c = hist[k]; r += ((k >> 10) & 31) * c; g += ((k >> 5) & 31) * c; bl += (k & 31) * c; n += c; } return [Math.round((r / n) * 8 + 3.5), Math.round((g / n) * 8 + 3.5), Math.round((bl / n) * 8 + 3.5)]; });
  const lut = new Uint8Array(32768);
  boxes.forEach((b, i) => { for (const k of b.bins) lut[k] = i; });
  const idx = Buffer.alloc(h * w);
  for (let i = 0; i < w * h; i++) { const o = i * bpp; idx[i] = lut[((img[o] >> 3) << 10) | ((img[o + 1] >> 3) << 5) | (img[o + 2] >> 3)]; }
  const out = Buffer.alloc(h * (w + 1));
  for (let y = 0; y < h; y++) {
    let best = null, bf = 0;
    for (let f = 0; f < 5; f++) {
      const row = Buffer.alloc(w); let s = 0;
      for (let x = 0; x < w; x++) {
        const cur = idx[y * w + x], a = x ? idx[y * w + x - 1] : 0, b = y ? idx[(y - 1) * w + x] : 0, c = x && y ? idx[(y - 1) * w + x - 1] : 0;
        let pr = 0; if (f === 1) pr = a; else if (f === 2) pr = b; else if (f === 3) pr = (a + b) >> 1; else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
        const v = (cur - pr) & 255; row[x] = v; s += v < 128 ? v : 256 - v;
      }
      if (best === null || s < best.s) { best = { s, row }; bf = f; }
    }
    out[y * (w + 1)] = bf; best.row.copy(out, y * (w + 1) + 1);
  }
  const chunk = (t, d) => { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(t, 4, 'latin1'); d.copy(b, 8); b.writeUInt32BE(crc32(Buffer.concat([Buffer.from(t, 'latin1'), d])) >>> 0, 8 + d.length); return b; };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 3;
  const plte = Buffer.concat(pal.map((c) => Buffer.from(c.map((v) => Math.min(255, v)))));
  return Buffer.concat([buf.subarray(0, 8), chunk('IHDR', ihdr), chunk('PLTE', plte), chunk('IDAT', deflateSync(out, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
