// Compact on-disk form of the owned-node map and the "seen" map (docs/design/skill-tree-v2.md Appendix C.13).
//   tree: { v: <treeVersion>, o: { <fragment key>: "<base64url bitset by idx>" }, r: { <id>: rank } }   (r only for ranks above 1)
//   seen: { o: { <fragment key>: "<base64url bitset>" } }
// In memory the game keeps { id: rank } and { id: true } (that is what the UI and sim read). This module converts between the two.
// Every decode treats the input as hostile: strict charset, length caps, unknown keys dropped, ids come ONLY from the compiled
// tree (never from the input), ranks clamped, no loop is unbounded.

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const B64_RE = /^[A-Za-z0-9_-]*$/;
const MAX_FRAG_CHARS = 4096; // 3 KB of bits = 24k indices per fragment, far above any real fragment
const MAX_KEYS = 4096;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const own = (o, k) => Object.hasOwn(o, k);
const fin = (v) => typeof v === 'number' && Number.isFinite(v);

export function b64urlEncode(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1] ?? 0, c = bytes[i + 2] ?? 0;
    const n = (a << 16) | (b << 8) | c;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    if (i + 1 < bytes.length) out += B64[(n >> 6) & 63];
    if (i + 2 < bytes.length) out += B64[n & 63];
  }
  return out;
}

// Strict: returns null for anything that is not a well-formed unpadded base64url string.
export function b64urlDecode(str) {
  if (typeof str !== 'string' || str.length > MAX_FRAG_CHARS || !B64_RE.test(str) || str.length % 4 === 1) return null;
  const bytes = new Uint8Array(Math.floor((str.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < str.length; i += 4) {
    const v = [0, 1, 2, 3].map((k) => (i + k < str.length ? B64.indexOf(str[i + k]) : 0));
    const n = (v[0] << 18) | (v[1] << 12) | (v[2] << 6) | v[3];
    if (o < bytes.length) bytes[o++] = (n >> 16) & 255;
    if (o < bytes.length) bytes[o++] = (n >> 8) & 255;
    if (o < bytes.length) bytes[o++] = n & 255;
  }
  return bytes;
}

function packFrag(f, has) {
  const bytes = new Uint8Array(Math.ceil((f.max + 1) / 8));
  let any = false;
  for (let i = 0; i <= f.max; i++) {
    const id = f.ids[i];
    if (id !== undefined && has(id)) { bytes[i >> 3] |= 1 << (i & 7); any = true; }
  }
  return any ? b64urlEncode(bytes) : null;
}

function unpackFrag(f, str, push) {
  const bytes = b64urlDecode(str);
  if (!bytes) return;
  const limit = Math.min(f.max + 1, bytes.length * 8); // bits beyond the fragment's last idx are ignored
  for (let i = 0; i < limit; i++) {
    if (bytes[i >> 3] & (1 << (i & 7))) { const id = f.ids[i]; if (id !== undefined) push(id); }
  }
}

// tree: { id: rank } (object form). def: compiled tree with def.frags. -> compact form.
export function encodeTree(tree, def, version) {
  const o = {};
  const r = {};
  if (isObj(tree) && def && def.frags) {
    for (const key of Object.keys(def.frags)) {
      const s = packFrag(def.frags[key], (id) => own(tree, id) && fin(tree[id]) && tree[id] >= 1 && own(def.nodes, id));
      if (s) o[key] = s;
    }
    for (const id of def.list) {
      const rank = own(tree, id) ? tree[id] : 0;
      if (fin(rank) && rank > 1) r[id] = Math.min(def.nodes[id].maxRank, Math.floor(rank));
    }
  }
  return { v: version, o, r };
}

// compact -> { tree: { id: rank }, v } ; never throws. Unknown shapes decode to an empty tree.
export function decodeTree(c, def) {
  const tree = {};
  if (!isObj(c) || !def || !def.frags) return { tree, v: null };
  const v = Number.isInteger(c.v) ? c.v : null;
  if (isObj(c.o)) {
    let n = 0;
    for (const key of Object.keys(c.o)) {
      if (++n > MAX_KEYS) break;
      if (!own(def.frags, key)) continue;
      const f = def.frags[key];
      unpackFrag(f, c.o[key], (id) => { if (own(def.nodes, id)) tree[id] = 1; });
    }
  }
  if (isObj(c.r)) {
    let n = 0;
    for (const id of Object.keys(c.r)) {
      if (++n > MAX_KEYS) break;
      if (!own(tree, id) || !own(def.nodes, id)) continue; // a rank only counts for a node whose bit is set
      const x = c.r[id];
      if (fin(x)) tree[id] = Math.min(def.nodes[id].maxRank, Math.max(1, Math.floor(x)));
    }
  }
  return { tree, v };
}

export function encodeSeen(seen, def) {
  const o = {};
  if (isObj(seen) && def && def.frags) {
    for (const key of Object.keys(def.frags)) {
      const s = packFrag(def.frags[key], (id) => own(seen, id) && seen[id] === true && own(def.nodes, id));
      if (s) o[key] = s;
    }
  }
  return { o };
}

export function decodeSeen(c, def) {
  const out = {};
  if (!isObj(c) || !def || !def.frags || !isObj(c.o)) return out;
  let n = 0;
  for (const key of Object.keys(c.o)) {
    if (++n > MAX_KEYS) break;
    if (!own(def.frags, key)) continue;
    unpackFrag(def.frags[key], c.o[key], (id) => { if (own(def.nodes, id)) out[id] = true; });
  }
  return out;
}

// A compact map always carries the `o` key; an object-form map keyed by node ids never can (no node id is "o").
export const isCompact = (v) => isObj(v) && own(v, 'o') && isObj(v.o);
