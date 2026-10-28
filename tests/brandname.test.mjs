// Brand rename (Hollowlight -> Wispwick): nothing a player reads may say Hollowlight. Storage keys, the internal font family and the repo URL path stay.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ALLOW = [/hollowlight[:.]/gi /* storage keys hollowlight:save, hollowlight.installCard.v1 */, /hollowlight-(chancery|\$)/gi, /Hollowlight Chancery/g, /\/hollowlight\//g, /Hollowlighters?/g /* hero-class term, naming decision pending in docs/QUEUE.md */, /hollowlight-' \+/g];
function files(dir) { return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : [p]; }); }

test('no user-visible string in src/ says Hollowlight (allow list: storage keys, internal font family, hero-class term)', () => {
  const bad = [];
  for (const f of files('src').filter((p) => /\.(js|css)$/.test(p))) {
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
      const code = line.replace(/\/\/.*$/, '');
      let s = code; for (const a of ALLOW) s = s.replace(a, '');
      if (/hollowlight/i.test(s)) bad.push(`${f}:${i + 1}: ${line.trim().slice(0, 90)}`);
    });
  }
  assert.deepEqual(bad, []);
});

test('index.html, manifest and package.json say Wispwick', () => {
  const html = readFileSync('index.html', 'utf8');
  assert.match(html, /<title>Wispwick: Spirits of the Dusk<\/title>/);
  assert.ok(!/hollowlight/i.test(html));
  const man = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
  assert.equal(man.name, 'Wispwick: Spirits of the Dusk'); assert.equal(man.short_name, 'Wispwick');
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.name, 'wispwick'); assert.match(pkg.description, /Wispwick/);
});

test('storage keys are unchanged so existing saves still load', async () => {
  const s = await import('../src/save/store.js'); const l = await import('../src/save/lanterns.js');
  assert.equal(s.SAVE_KEY, 'hollowlight:save'); assert.equal(s.BACKUP_KEY, 'hollowlight:save:backup'); assert.equal(s.DAMAGED_KEY, 'hollowlight:save:damaged');
  assert.equal(l.INDEX_KEY, 'hollowlight:lanterns');
});

test('an old save written under the hollowlight: key still loads after the rename', async () => {
  const { SaveStore } = await import('../src/save/store.js'); const { sanitize } = await import('../src/save/schema.js');
  const { setTreeDef } = await import('../src/save/schema.js'); const { data, treeDef } = await import('./helpers.mjs');
  setTreeDef(treeDef, data);
  const m = new Map(); const st = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  const a = new SaveStore(st); a.load(); a.data = sanitize({ ...a.data, gold: 321 }); a.saveNow();
  assert.ok(m.has('hollowlight:save'));
  assert.equal(new SaveStore(st).load().gold, 321);
});

test('icons and share image exist, are referenced, and the share meta has no invented absolute URL', async () => {
  const { existsSync } = await import('node:fs');
  for (const f of ['favicon-32.png', 'favicon-64.png', 'icon-128.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'share.png']) assert.ok(existsSync('public/' + f), f);
  const man = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
  for (const s of ['32x32', '64x64', '128x128', '192x192', '512x512']) assert.ok(man.icons.some((i) => i.sizes === s), s);
  assert.ok(man.icons.some((i) => i.purpose === 'maskable'));
  const html = readFileSync('index.html', 'utf8');
  assert.match(html, /og:image" content="\.\/share\.png"/); assert.match(html, /twitter:card" content="summary_large_image"/); assert.match(html, /TODO Matt: set absolute URL/);
  assert.ok(!/content="https?:\/\//.test(html));
  const png = readFileSync('public/share.png'); assert.equal(png.readUInt32BE(16), 1200); assert.equal(png.readUInt32BE(20), 630);
});

test('About copy never says Hollowlight', async () => {
  const { ABOUT } = await import('../src/ui/aboutcopy.js');
  assert.ok(!/hollowlight/i.test(JSON.stringify(ABOUT)));
});
