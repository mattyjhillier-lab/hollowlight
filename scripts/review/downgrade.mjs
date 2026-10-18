// Downgrade / "future save" probe. Writes a real v3 save with the CURRENT build, then boots an OLDER build's SaveStore
// (extracted with `git archive <ref> src` into a fresh os.tmpdir() folder, nothing else touched) against the same storage
// and lets it autosave twice (as the game does after a run / a settings change). Then checks whether the v3 progress survives.
// Also runs the same experiment against the CURRENT build with a forged "v4" save (what happens on the next envelope bump).
// Usage: node scripts/review/downgrade.mjs [ref=origin/main]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { data, treeDef } from '../../tests/helpers.mjs';
import { SaveStore, SAVE_KEY, BACKUP_KEY } from '../../src/save/store.js';
import { sanitize, defaultSave } from '../../src/save/schema.js';
import { presetTree } from '../../src/meta/tree.js';
import { ROOT, memStorage, BIG_STATS } from './lib.mjs';

void data;
const ref = process.argv[2] || 'origin/main';
const dir = mkdtempSync(join(tmpdir(), 'hl-downgrade-'));
let failures = 0;
try {
  // 1. a v3 save with real progress, written twice so main + backup are both v3
  const mem = memStorage();
  const cur = new SaveStore(mem);
  cur.data = sanitize({ ...defaultSave(), gold: 12345, shards: 7, stats: BIG_STATS, tree: presetTree(treeDef, 'half', true) });
  cur.saveNow(); cur.saveNow();
  const ownedBefore = Object.keys(cur.data.tree).length;
  console.log(`v3 save written: gold ${cur.data.gold}, ${ownedBefore} owned nodes; main v${JSON.parse(mem.getItem(SAVE_KEY)).version}, backup v${JSON.parse(mem.getItem(BACKUP_KEY)).version}`);

  // 2. the older build boots on the same storage
  const tar = join(dir, 'src.tar');
  execFileSync('git', ['-C', ROOT, 'archive', '-o', tar, ref, 'src', 'package.json'], { stdio: 'pipe' });
  execFileSync('tar', ['-xf', 'src.tar'], { cwd: dir, stdio: 'pipe' });
  const oldStoreMod = await import(pathToFileURL(join(dir, 'src', 'save', 'store.js')).href);
  const oldSchema = await import(pathToFileURL(join(dir, 'src', 'save', 'schema.js')).href);
  const old = new oldStoreMod.SaveStore(mem);
  old.load();
  console.log(`old build (${ref}, SAVE_VERSION ${oldSchema.SAVE_VERSION}) load: gold ${old.data.gold}, note "${old.loadNote}"`);
  old.saveNow(); // e.g. settings change
  old.saveNow(); // e.g. a run banked
  const main = JSON.parse(mem.getItem(SAVE_KEY));
  const bak = JSON.parse(mem.getItem(BACKUP_KEY));
  console.log(`after two old-build autosaves: main v${main.version} gold ${main.gold}; backup v${bak.version} gold ${bak.gold}`);
  const survived = [main, bak].some((s) => s.gold === 12345);
  console.log(survived ? 'OK: v3 progress still somewhere in storage' : 'LOST: no copy of the v3 progress is left in storage (gold, tree, stats)');
  if (!survived) failures++;

  // 3. current build meets a newer envelope (v4) save
  const mem2 = memStorage();
  const future = { ...JSON.parse(mem.getItem(SAVE_KEY)), version: 4, gold: 999 };
  mem2.setItem(SAVE_KEY, JSON.stringify(future)); mem2.setItem(BACKUP_KEY, JSON.stringify(future));
  const s2 = new SaveStore(mem2);
  s2.load();
  console.log(`current build on a v4 save: load note "${s2.loadNote}", gold ${s2.data.gold}`);
  s2.saveNow(); s2.saveNow();
  const left = [mem2.getItem(SAVE_KEY), mem2.getItem(BACKUP_KEY)].map((t) => JSON.parse(t));
  const kept = left.some((s) => s.version === 4);
  console.log(kept ? 'OK: the newer save is preserved' : 'LOST: the current build overwrote the newer save (main and backup)');
  if (!kept) failures++;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
process.exitCode = failures ? 1 : 0;
