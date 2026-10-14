// Offline helper: keep only chosen animation clips in a .glb and drop unreferenced data (size reduction).
// Reads the file as DATA only (JSON + byte copy); nothing inside is executed.
// node glbstrip.mjs in.glb out.glb Clip1,Clip2
import { readFileSync, writeFileSync } from 'node:fs';
const [inp, out, clipsArg] = process.argv.slice(2);
const keep = new Set(clipsArg.split(','));
const b = readFileSync(inp);
const jl = b.readUInt32LE(12);
const j = JSON.parse(b.subarray(20, 20 + jl).toString());
const binOff = 20 + jl + 8;
const bin = b.subarray(binOff, binOff + b.readUInt32LE(20 + jl));
if (j.accessors.some((a) => a.sparse)) throw new Error('sparse accessors unsupported');

j.animations = (j.animations || []).filter((a) => keep.has(a.name));
const accUsed = new Set();
const useAcc = (i) => { if (i !== undefined) accUsed.add(i); };
for (const m of j.meshes) for (const p of m.primitives) { Object.values(p.attributes).forEach(useAcc); useAcc(p.indices); (p.targets || []).forEach((t) => Object.values(t).forEach(useAcc)); }
for (const s of j.skins || []) useAcc(s.inverseBindMatrices);
for (const a of j.animations) for (const s of a.samplers) { useAcc(s.input); useAcc(s.output); }
const accOrder = [...accUsed].sort((x, y) => x - y);
const accMap = new Map(accOrder.map((o, n) => [o, n]));
const bvUsed = new Set(accOrder.map((i) => j.accessors[i].bufferView));
for (const im of j.images || []) if (im.bufferView !== undefined) bvUsed.add(im.bufferView);
const bvOrder = [...bvUsed].sort((x, y) => x - y);
const bvMap = new Map(bvOrder.map((o, n) => [o, n]));

const chunks = [];
let off = 0;
const newBVs = bvOrder.map((o) => {
  const v = j.bufferViews[o];
  const data = bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
  const pad = (4 - (off % 4)) % 4;
  if (pad) { chunks.push(Buffer.alloc(pad)); off += pad; }
  chunks.push(data);
  const nv = { ...v, buffer: 0, byteOffset: off };
  off += data.length;
  return nv;
});
const newAccs = accOrder.map((o) => ({ ...j.accessors[o], bufferView: bvMap.get(j.accessors[o].bufferView) }));
for (const m of j.meshes) for (const p of m.primitives) {
  for (const k of Object.keys(p.attributes)) p.attributes[k] = accMap.get(p.attributes[k]);
  if (p.indices !== undefined) p.indices = accMap.get(p.indices);
}
for (const s of j.skins || []) s.inverseBindMatrices = accMap.get(s.inverseBindMatrices);
for (const a of j.animations) for (const s of a.samplers) { s.input = accMap.get(s.input); s.output = accMap.get(s.output); }
for (const im of j.images || []) if (im.bufferView !== undefined) im.bufferView = bvMap.get(im.bufferView);
j.accessors = newAccs;
j.bufferViews = newBVs;
const nb = Buffer.concat(chunks);
const nbp = Buffer.concat([nb, Buffer.alloc((4 - (nb.length % 4)) % 4)]);
j.buffers = [{ byteLength: nbp.length }];
let js = Buffer.from(JSON.stringify(j));
js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
const hdr = Buffer.alloc(12 + 8);
hdr.writeUInt32LE(0x46546c67, 0); hdr.writeUInt32LE(2, 4);
hdr.writeUInt32LE(12 + 8 + js.length + 8 + nbp.length, 8);
hdr.writeUInt32LE(js.length, 12); hdr.writeUInt32LE(0x4e4f534a, 16);
const bh = Buffer.alloc(8); bh.writeUInt32LE(nbp.length, 0); bh.writeUInt32LE(0x004e4942, 4);
writeFileSync(out, Buffer.concat([hdr, js, bh, nbp]));
console.log(out, 'bytes', 12 + 8 + js.length + 8 + nbp.length, 'anims', j.animations.map((a) => a.name).join(','));
