// node glbinfo.mjs file.glb : print mesh/skin/animation summary (parsed as data only).
import { readFileSync } from 'node:fs';
const b = readFileSync(process.argv[2]);
const jl = b.readUInt32LE(12);
const j = JSON.parse(b.subarray(20, 20 + jl).toString());
console.log('meshes', j.meshes.map((m) => m.name + ':' + m.primitives.length).join(' '), 'skins', j.skins?.map((s) => s.joints.length), 'images', j.images?.length);
console.log('anims', j.animations?.map((a) => a.name).join(','));
let tris = 0;
for (const m of j.meshes) for (const p of m.primitives) tris += j.accessors[p.indices].count / 3;
console.log('tris', tris, 'accessors', j.accessors.length);
