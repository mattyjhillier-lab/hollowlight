// node C5-shot.mjs [names...] : renders C5-*.html to ../C5-*.png via headless Chrome
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const D = path.dirname(fileURLToPath(import.meta.url));
const CH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const all = { 'C5-first-open': [1280, 720], 'C5-midgame': [1280, 720], 'C5-banner-hover': [1280, 720], 'C5-far-overview': [1280, 720], 'C5-phone-390x844': [390, 844] };
const want = process.argv.slice(2);
for (const [n, [w, h]] of Object.entries(all)) {
  if (want.length && !want.some((x) => n.includes(x))) continue;
  execFileSync(CH, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${w},${h}`, '--force-device-scale-factor=1', '--virtual-time-budget=3000', `--screenshot=${path.join(D, '..', n + '.png')}`, pathToFileURL(path.join(D, n + '.html')).href]);
}
