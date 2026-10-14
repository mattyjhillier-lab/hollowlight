// node build.mjs [filter]  -> s1..s6 PNGs (+ parts / overview via build2). Local Chrome; Node built-ins only.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STYLES, page } from './scene.mjs';
import { renderAll } from './render2.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const only = process.argv[2] || '';
const jobs = [];
for (const s of Object.values(STYLES)) { if (only && !s.id.toLowerCase().includes(only)) continue; jobs.push([s.id.toLowerCase() + '-' + s.name.toLowerCase().replace(/ /g, '-'), page(s)]); }
await renderAll(jobs, here);
