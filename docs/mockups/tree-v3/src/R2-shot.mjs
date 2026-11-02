// node R2-shot.mjs : renders R2-*.html to ../R2-*.png via headless Chrome
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const D = path.dirname(fileURLToPath(import.meta.url));
const CH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
for (const [n, w, h] of [['R2-web-zoomed-first-open',1280,720],['R2-web-zoomed-midgame',1280,720],['R2-banner-hover',1280,720],['R2-phone-390x844',390,844]]) {
  execFileSync(CH, ['--headless=new','--disable-gpu','--hide-scrollbars',`--window-size=${w},${h}`,'--force-device-scale-factor=1','--virtual-time-budget=2000',`--screenshot=${path.join(D,'..',n+'.png')}`, pathToFileURL(path.join(D,n+'.html')).href]);
}
