import { readFileSync, writeFileSync } from 'node:fs';
import { launch } from './u3-lib.mjs';
const [src, x, y, w, h, out] = process.argv.slice(2);
const c = await launch(9376);
const b64 = readFileSync(src).toString('base64');
const d = await c.ev(`(async()=>{const im=new Image();im.src='data:image/png;base64,${b64}';await im.decode();const cv=document.createElement('canvas');cv.width=${w}*4;cv.height=${h}*4;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,${x},${y},${w},${h},0,0,${w}*4,${h}*4);return cv.toDataURL('image/png')})()`);
writeFileSync(out, Buffer.from(d.split(',')[1], 'base64'));
c.close();
