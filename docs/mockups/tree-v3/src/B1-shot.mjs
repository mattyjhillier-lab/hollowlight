// node B1-shot.mjs : renders B1-*.html to ../B1-*.png via headless Chrome
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const D = path.dirname(fileURLToPath(import.meta.url));
const CH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
for (const n of ['B1-wolves-option-a', 'B1-wolves-option-b', 'B1-wolves-option-c', 'B1-whole-web-with-branches']) {
  execFileSync(CH, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,720', '--force-device-scale-factor=1', '--virtual-time-budget=2000', `--screenshot=${path.join(D, '..', n + '.png')}`, pathToFileURL(path.join(D, n + '.html')).href]);
}
