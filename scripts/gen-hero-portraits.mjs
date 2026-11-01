// Crops the two APPROVED hero sheets (docs/mockups/wren-v2, elias-v2) into small static portraits for the hero-select windows (U3).
// Usage: node scripts/gen-hero-portraits.mjs   (own headless Chrome on port 9374; kills only that PID). Output: src/assets/heroes/<id>.webp
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { launch } from './u3-lib.mjs';
const CROPS = { wren: { src: 'docs/mockups/wren-v2/wren-v2-sheet.png', x: 180, y: 168, w: 156, h: 204 }, elias: { src: 'docs/mockups/elias-v2/elias-v2-sheet.png', x: 196, y: 176, w: 150, h: 198 } };
const c = await launch(9374);
for (const [id, k] of Object.entries(CROPS)) {
  const b64 = readFileSync(k.src).toString('base64');
  const out = await c.ev(`(async()=>{const im=new Image();im.src='data:image/png;base64,${b64}';await im.decode();
    const cv=document.createElement('canvas');cv.width=${k.w};cv.height=${k.h};const g=cv.getContext('2d');g.drawImage(im,${k.x},${k.y},${k.w},${k.h},0,0,${k.w},${k.h});
    return cv.toDataURL('image/webp',0.82)})()`);
  const buf = Buffer.from(out.split(',')[1], 'base64');
  writeFileSync(`src/assets/heroes/${id}.webp`, buf);
  console.log(id, `${k.w}x${k.h}`, statSync(`src/assets/heroes/${id}.webp`).size, 'bytes');
}
c.close();
