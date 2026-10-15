// Tiny PNG re-encoder (Node built-ins): adaptive row filters + zlib level 9, optional channel rounding.
import { inflateSync, deflateSync, crc32 } from 'node:zlib';
export function recompress(buf, round = 1) {
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
  if (round > 1) for (let i = 0; i < img.length; i++) if (!(ct === 6 && i % 4 === 3)) img[i] = Math.min(255, Math.round(img[i] / round) * round);
  const out = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    let best = null, bf = 0;
    for (let f = 0; f < 5; f++) {
      const row = Buffer.alloc(stride); let s = 0;
      for (let x = 0; x < stride; x++) {
        const cur = img[y * stride + x], a = x >= bpp ? img[y * stride + x - bpp] : 0, b = y ? img[(y - 1) * stride + x] : 0, c = x >= bpp && y ? img[(y - 1) * stride + x - bpp] : 0;
        let pr = 0; if (f === 1) pr = a; else if (f === 2) pr = b; else if (f === 3) pr = (a + b) >> 1; else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
        const v = (cur - pr) & 255; row[x] = v; s += v < 128 ? v : 256 - v;
      }
      if (best === null || s < best.s) { best = { s, row }; bf = f; }
    }
    out[y * (stride + 1)] = bf; best.row.copy(out, y * (stride + 1) + 1);
  }
  const chunk = (t, d) => { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(t, 4, 'latin1'); d.copy(b, 8); b.writeUInt32BE(crc32(Buffer.concat([Buffer.from(t, 'latin1'), d])) >>> 0, 8 + d.length); return b; };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = ct;
  return Buffer.concat([buf.subarray(0, 8), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(out, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
