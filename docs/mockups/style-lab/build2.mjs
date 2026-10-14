// node build2.mjs [parts|overview] -> parts.png + style-lab-overview.png (run after build.mjs)
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
import { STYLES } from './scene.mjs';
import { partsPage } from './parts.mjs';
import { renderAll } from './render2.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const only = process.argv[2] || '';
const files = readdirSync(here).filter((f) => /^s\d-.*\.png$/.test(f)).sort();
const tiles = Object.values(STYLES).map((s, i) => `<div class="t" style="left:${(i % 3) * 640}px;top:${Math.floor(i / 3) * 540}px"><img src="${files[i]}"><div class="l"><b>${s.id} ${s.name}</b><span>${s.L} + ${s.H} + ${s.P} + ${s.W} + ${s.G}</span></div></div>`).join('');
const ov = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#0b1016;width:1920px;height:1080px;overflow:hidden;font-family:Segoe UI,Arial,sans-serif}.t{position:absolute;width:640px;height:540px}img{width:640px;height:360px;display:block}.l{position:absolute;top:366px;left:0;width:640px;height:150px;color:#fff}.l b{display:block;font:900 26px Georgia,serif;padding:6px 12px}.l span{display:block;font:700 18px Consolas,monospace;color:#ffd98a;padding:0 12px}</style></head><body>${tiles}</body></html>`;
const jobs = [];
if (!only || only === 'parts') jobs.push(['parts', partsPage(), 1600, 980]);
if (!only || only === 'overview') jobs.push(['style-lab-overview', ov, 1920, 1080, 800]);
await renderAll(jobs, here, 340);
