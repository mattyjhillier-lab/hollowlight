// Tree screen PROTOTYPE builder (design-phase, not game code). Composes the REAL tree fragments (src/data/tree) with the real
// composer, bundles the real tree logic (src/meta/tree.js: compileTree, nodeStatus, buy, describeNode, closestUnlocks) with esbuild
// (already a Vite dependency, no new deps), and writes ONE self-contained page: tree-screen.html (fonts, data and code inlined).
//   node docs/mockups/tree-screen/build.mjs
// Inputs: src/data/*, src/data/tree/**, scripts/tree-synth.mjs (1000-node synthetic tree), presets.json (from
// `node scripts/tree-timeline.mjs --presets docs/mockups/tree-screen/presets.json`), app.src.html (the screen itself).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { readTreeFiles } from '../../../src/meta/treefs.mjs';
import { composeTree } from '../../../src/meta/treedata.js';
import { loadRealData, synthTree } from '../../../scripts/tree-synth.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');

// Role colours are DATA handed to the screen (the screen code never names a weapon, hero or chapter: C.1 grep rule).
// Values = the locked role colours used by the skill-tree-v2 mock-ups (inventory.mjs).
const ROLE = { ghost_wolves: '#9fe8ff', raven_flock: '#b9a2ff', spirit_bolts: '#7ff0ff', chain_lightning: '#d6ecff', holy_orbit: '#e2ccff' };
const SYN = ['#9fe8ff', '#b9a2ff', '#7ff0ff', '#d6ecff', '#e2ccff', '#ffd9b0', '#b8f0c8'];

function pack(files, data, label) {
  const c = composeTree(files, data);
  const toolByPrefix = {};
  for (const [tid, t] of Object.entries(c.info.tools)) toolByPrefix[t.prefix] = tid;
  const regionOf = {};
  for (const n of c.info.nodes) {
    if (n.cluster) regionOf[n.id] = `c:${n.cluster}`;
    else if (n.tool) regionOf[n.id] = `t:${n.tool}`;
    else if (toolByPrefix[n.frag]) regionOf[n.id] = `t:${toolByPrefix[n.frag]}`;
    else if (n.region === 'rings') regionOf[n.id] = 'r:rings';
    else regionOf[n.id] = `r:${n.frag}`;
  }
  const regions = [];
  let si = 0;
  for (const [wid, cl] of Object.entries(c.info.clusters)) {
    const em = c.info.emblems[cl.emblem];
    const [cx, cy] = c.info.centres[wid];
    const display = Object.values(cl.sockets).filter((s) => !s.gate).map((s) => { const k = Object.keys(cl.sockets).find((x) => cl.sockets[x] === s); const p = em.sockets[k]; return { x: cx + p[0], y: cy + p[1], name: data.evolutions[s.evo] ? data.evolutions[s.evo].name : s.evo, label: p[2] }; });
    regions.push({
      key: `c:${wid}`, kind: 'cluster', name: data.weapons[wid] ? data.weapons[wid].name : wid, x: cx, y: cy, r: 170,
      color: ROLE[wid] || SYN[si++ % SYN.length], silhouette: em.silhouette, heart: cl.heart, heartAt: [cx + em.heart[0], cy + em.heart[1]], display,
      title: `${data.weapons[wid] ? data.weapons[wid].name.split(' ').pop() : 'Spirit'}-warden`,
    });
  }
  for (const [tid, t] of Object.entries(c.info.tools)) {
    const [cx, cy] = c.info.toolCentres[tid];
    regions.push({ key: `t:${tid}`, kind: 'tool', name: t.name, blurb: t.blurb, x: cx, y: cy, r: 190, color: '#f3dcae' });
  }
  regions.push({ key: 'r:rings', kind: 'rings', name: 'Hearth and Wick', x: 0, y: 0, r: 330, color: '#ffd9a0' });
  const rings = c.info.core.rings;
  const usedFar = new Set([...Object.values(c.info.clusters), ...Object.values(c.info.tools)].map((x) => x.slot));
  const farFree = [];
  for (let k = 1; k <= rings.far.slots; k++) if (!usedFar.has(`far${k}`)) { const a = ((rings.far.ang0 + rings.far.step * (k - 1)) * Math.PI) / 180; farFree.push([Math.round(rings.far.r * Math.cos(a)), Math.round(rings.far.r * Math.sin(a))]); }
  let maxBand = 1;
  for (const cl of Object.values(c.info.clusters)) { const m = /^band(\d+)\./.exec(cl.slot); if (m) maxBand = Math.max(maxBand, Number(m[1])); }
  return {
    label, raw: c.v2, live: c.live.nodes.map((n) => n.id), regionOf, regions,
    rings: { hearth: rings.hearth.r, wick: rings.wick.r, dusk: rings.dusk.r, fog: rings.fog.r, far: rings.far.r, bandR0: rings.bands.r0, bandW: rings.bands.width, bands: Math.max(2, maxBand) },
    farFree,
  };
}

const data = loadRealData();
const real = pack(readTreeFiles(), data, 'Launch tree (real data)');
const syn = synthTree(data, 1000);
const big = pack(syn.files, syn.data, '1000-node growth test (synthetic)');
// PROPOSAL view (not the locked rule): the same synthetic tree with band constellation slots staggered (6 per band, offset 30 deg on odd
// bands) instead of the rule's 2 per band at 90/270 deg, to show what the growth layout would look like (critique item; Matt decides).
function stagger(pk) {
  const out = JSON.parse(JSON.stringify(pk)); out.label = '1000-node test, staggered bands (proposal)';
  const R = out.rings; let k = 0;
  const syn = out.regions.filter((r) => r.kind === 'cluster' && Math.hypot(r.x, r.y) >= R.bandR0 - 1);
  const shift = new Map();
  for (const r of syn) {
    const band = 2 + Math.floor(k / 6), j = k % 6; k++;
    const a = ((90 + 60 * j + (band % 2 ? 30 : 0)) * Math.PI) / 180; const rad = R.bandR0 + R.bandW * (band - 2) + R.bandW / 2;
    const nx = Math.round(rad * Math.cos(a)), ny = Math.round(rad * Math.sin(a));
    shift.set(r.key, [nx - r.x, ny - r.y]);
    r.heartAt = [r.heartAt[0] + nx - r.x, r.heartAt[1] + ny - r.y]; r.x = nx; r.y = ny;
  }
  R.bands = 2 + Math.ceil(syn.length / 6);
  for (const n of out.raw.nodes) { const d = shift.get(out.regionOf[n.id]); if (d && n.pos) n.pos = [n.pos[0] + d[0], n.pos[1] + d[1]]; }
  return out;
}
const pick = (d) => Object.fromEntries(['weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((k) => [k, d[k]]));
let presets = [];
try { presets = JSON.parse(readFileSync(join(HERE, 'presets.json'), 'utf8')); } catch { console.warn('presets.json missing: run scripts/tree-timeline.mjs --presets first'); }

const bundle = await build({
  stdin: { contents: "export { compileTree, nodeStatus, buy, describeNode, conditionProgress, closestUnlocks, costFor } from './src/meta/tree.js';", resolveDir: ROOT, loader: 'js' },
  bundle: true, format: 'iife', globalName: 'HLT', write: false, minify: true, legalComments: 'none', platform: 'browser',
});
const font = (f) => readFileSync(join(ROOT, 'src', 'assets', 'fonts', f)).toString('base64');
const fonts = `@font-face{font-family:HLC;src:url(data:font/woff2;base64,${font('hollowlight-chancery.woff2')}) format('woff2')}
@font-face{font-family:AS;src:url(data:font/woff2;base64,${font('alegreya-sans-400.woff2')}) format('woff2');font-weight:400}
@font-face{font-family:AS;src:url(data:font/woff2;base64,${font('alegreya-sans-700.woff2')}) format('woff2');font-weight:700}`;
// JSON inside <script type="application/json">: escape '<' so no data can close the tag
const j = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const payload = { trees: [real, big, stagger(big)], data: [pick(data), pick(syn.data), pick(syn.data)], presets };
const html = readFileSync(join(HERE, 'app.src.html'), 'utf8')
  .replace('/*FONTS*/', () => fonts)
  .replace('/*DATA*/', () => j(payload))
  .replace('/*TREELIB*/', () => bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script'));
writeFileSync(join(HERE, 'tree-screen.html'), html);
console.log(`tree-screen.html ${(html.length / 1024).toFixed(0)} KB: ${real.raw.nodes.length} real nodes, ${big.raw.nodes.length} synthetic-test nodes, ${presets.length} presets`);
