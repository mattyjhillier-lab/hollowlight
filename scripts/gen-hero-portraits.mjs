// Crops the APPROVED hero sheets (docs/mockups/wren-v2, elias-v2; Lucinda: the locked A1 close-up from the look sandbox, docs/mockups/lucinda-v3) into small static portraits for the hero-select windows (U3).
// Usage: node scripts/gen-hero-portraits.mjs   (own headless Chrome on port 9374; kills only that PID). Output: src/assets/heroes/<id>.webp
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { launch } from './u3-lib.mjs';
const CROPS = { wren: { src: 'docs/mockups/wren-v2/wren-v2-sheet.png', x: 180, y: 168, w: 156, h: 204 }, elias: { src: 'docs/mockups/elias-v2/elias-v2-sheet.png', x: 196, y: 176, w: 150, h: 198 }, hearthwarden: { /* key: the sandbox's flat slate backdrop is keyed to the dark night of the other two portraits */ src: 'docs/mockups/lucinda-v3/lucinda-a1-close.png', x: 24, y: 24, w: 560, h: 732, ow: 156, oh: 204, key: true } };
const ONLY = process.argv[2] ? process.argv[2].split(',') : null; // e.g. `node scripts/gen-hero-portraits.mjs hearthwarden` regenerates one portrait only
const c = await launch(9374);
for (const [id, k] of Object.entries(CROPS)) {
  if (ONLY && !ONLY.includes(id)) continue;
  const ow = k.ow || k.w, oh = k.oh || k.h;
  const b64 = readFileSync(k.src).toString('base64');
  const out = await c.ev(`(async()=>{const im=new Image();im.src='data:image/png;base64,${b64}';await im.decode();
    const cv=document.createElement('canvas');cv.width=${ow};cv.height=${oh};const g=cv.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(im,${k.x},${k.y},${k.w},${k.h},0,0,${ow},${oh});${k.key ? `const D=g.getImageData(0,0,${ow},${oh}),d=D.data,r0=d[0],g0=d[1],b0=d[2];for(let i=0;i<d.length;i+=4){const y=(i/4/${ow})|0,dd=Math.abs(d[i]-r0)+Math.abs(d[i+1]-g0)+Math.abs(d[i+2]-b0);if(dd<55){const t=y/${oh},a=Math.min(1,(1-dd/55)*1.6);d[i]=d[i]*(1-a)+(18+14*t)*a;d[i+1]=d[i+1]*(1-a)+(24+18*t)*a;d[i+2]=d[i+2]*(1-a)+(40+26*t)*a;}}g.putImageData(D,0,0);` : ''}
    return cv.toDataURL('image/webp',0.82)})()`);
  const buf = Buffer.from(out.split(',')[1], 'base64');
  writeFileSync(`src/assets/heroes/${id}.webp`, buf);
  console.log(id, `${ow}x${oh}`, statSync(`src/assets/heroes/${id}.webp`).size, 'bytes');
}
c.close();
