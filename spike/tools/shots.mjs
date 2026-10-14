// Takes all spike screenshots sequentially (calls measure.mjs shot). node spike/tools/shots.mjs [filter]
import { spawnSync } from 'node:child_process';
const D = 'spike/screens/';
const list = [
  ['a-desktop', 'mode=a&q=high&n=120&pre=90', 1280, 720, 1],
  ['a-phone', 'mode=a&q=high&n=100&pre=90', 390, 844, 2],
  ['a-swarm', 'mode=a&q=high&n=300&pre=90', 1280, 720, 1],
  ['a-boss-or-big', 'mode=a&q=high&n=40&boss=1&pre=90', 1280, 720, 1],
  ['b-desktop', 'mode=b&q=high&n=120&pre=90', 1280, 720, 1],
  ['b-phone', 'mode=b&q=high&n=100&pre=90', 390, 844, 2],
  ['b-swarm', 'mode=b&q=high&n=300&pre=90', 1280, 720, 1],
  ['a-life-early', 'mode=a&q=high&n=60&pre=0&t=60', 1280, 720, 1],
  ['a-life-late', 'mode=a&q=high&n=60&pre=300&t=60', 1280, 720, 1],
  ['b-life-early', 'mode=b&q=high&n=60&pre=0&t=60', 1280, 720, 1],
  ['b-life-late', 'mode=b&q=high&n=60&pre=300&t=60', 1280, 720, 1],
];
const only = process.argv[2];
for (const [name, q, w, h, dpr] of list) {
  if (only && !name.includes(only)) continue;
  const r = spawnSync('node', ['spike/tools/measure.mjs', 'shot', q, D + name + '.png', w, h, dpr, '5000'], { encoding: 'utf8' });
  console.log((r.stdout || '').trim(), (r.stderr || '').split('\n').filter((l) => l && !l.includes('favicon')).slice(0, 3).join(' | '));
}
