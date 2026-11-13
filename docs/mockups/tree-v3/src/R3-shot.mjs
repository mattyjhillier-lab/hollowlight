// node R3-shot.mjs : renders R3-*.html to ../R3-*.png via headless Chrome
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const D = path.dirname(fileURLToPath(import.meta.url));
const CH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
for (const n of ['R3-bgA-misty-forest-dusk', 'R3-bgB-carved-stone-night', 'R3-hero-panel-variants', 'R3-scale-zoom-levels']) {
  execFileSync(CH, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,720', '--force-device-scale-factor=1', '--virtual-time-budget=2000', `--screenshot=${path.join(D, '..', n + '.png')}`, pathToFileURL(path.join(D, n + '.html')).href]);
}
