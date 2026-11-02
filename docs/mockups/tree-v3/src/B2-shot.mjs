// node B2-shot.mjs [name...] : renders B2-*.html to ../B2-*.png via headless Chrome, in parallel
import { execFile } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import os from 'node:os';
const D = path.dirname(fileURLToPath(import.meta.url));
const CH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const all = ['B2-wolves-shape-1', 'B2-wolves-shape-2', 'B2-wolves-shape-3', 'B2-whole-web-shapes'];
const names = process.argv.length > 2 ? process.argv.slice(2) : all;
await Promise.all(names.map((n) => new Promise((res, rej) => execFile(CH, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${path.join(os.tmpdir(), 'b2chrome-' + n)}`, '--window-size=1280,720', '--force-device-scale-factor=1', '--virtual-time-budget=2000', `--screenshot=${path.join(D, '..', n + '.png')}`, pathToFileURL(path.join(D, n + '.html')).href], (e) => (e ? rej(e) : res())))));
console.log('shots done');
