// Benchmark matrix: A/B x quality x enemy count x (desktop | phone+4x CPU throttle). Writes spike/bench-results.json
//   node spike/tools/bench.mjs [desktop|phone]
import { spawnSync } from 'node:child_process';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
const which = process.argv[2];
const setups = { desktop: [1280, 720, 1, 1], phone: [390, 844, 2, 4] };
const OUT = 'spike/bench-results.json';
const res = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];
for (const [dev, [w, h, dpr, th]] of Object.entries(setups)) {
  if (which && which !== dev) continue;
  for (const mode of ['a', 'b']) for (const q of ['high', 'low']) for (const n of [100, 200, 300]) {
    const r = spawnSync('node', ['spike/tools/measure.mjs', 'bench', `mode=${mode}&q=${q}&n=${n}&sync=1&t=300`, w, h, dpr, th, 8, 4000], { encoding: 'utf8', env: { ...process.env, UNCAP: '1' } });
    const line = (r.stdout || '').trim().split('\n').pop();
    try {
      const j = JSON.parse(line);
      res.push({ dev, mode, q, n, throttle: th, fps: j.fps, rafP50: j.rafMs.p50, rafP95: j.rafMs.p95, workAvg: j.workMs.avg, workP95: j.workMs.p95, simMs: j.simMs.avg, lifeMs: j.lifeMs.avg, calls: j.calls, tris: j.tris, enemies: j.enemies, gpu: j.info?.gpu });
      console.log(dev, mode, q, n, JSON.stringify(res[res.length - 1]));
    } catch { console.log('FAIL', dev, mode, q, n, (r.stderr || '').slice(0, 200), line.slice(0, 200)); }
    writeFileSync(OUT, JSON.stringify(res, null, 1));
  }
}
