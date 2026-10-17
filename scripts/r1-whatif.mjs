// R1 what-if runner: copies src/ + scripts/ of a checkout to a scratch dir, patches data JSON, runs g1d-sweep (starter, 4 cells).
// Usage: node scripts/r1-whatif.mjs <srcCheckout> <label> <seeds> "file.dot.path=value" ...   (env ABILITY=off, GATES etc. pass through)
// Example: node scripts/r1-whatif.mjs . hp50 96 "balance.hpScale.linear=0.5" "characters.elias.traits.holyDamage=1.5"
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const [src, label, seeds, ...patches] = process.argv.slice(2);
const tmp = mkdtempSync(join(tmpdir(), 'r1-'));
for (const d of ['src', 'scripts']) cpSync(join(resolve(src), d), join(tmp, d), { recursive: true });
writeFileSync(join(tmp, 'package.json'), '{"type":"module"}');
for (const p of patches) {
  const [lhs, rhs] = p.split('=');
  const [file, ...path] = lhs.split('.');
  const fp = join(tmp, 'src', 'data', `${file}.json`);
  const j = JSON.parse(readFileSync(fp, 'utf8'));
  let o = j; for (const k of path.slice(0, -1)) o = o[k];
  const last = path[path.length - 1];
  if (!(last in o)) throw new Error(`no key ${lhs}`);
  o[last] = JSON.parse(rhs);
  writeFileSync(fp, JSON.stringify(j, null, 2));
}
const r = spawnSync('node', [join(tmp, 'scripts', 'g1d-sweep.mjs'), seeds, label], { env: process.env, encoding: 'utf8' });
process.stdout.write(r.stdout); if (r.status) process.stderr.write(r.stderr);
