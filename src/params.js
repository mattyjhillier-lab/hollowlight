// URL debug params: pure parser (no DOM). Every key accepts ONLY known values; anything else falls back to the default.
// URL input is untrusted: nothing here is ever saved, and all numbers are clamped integers.
import { parseTouchParam } from './input/stick.js';

const clampInt = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.floor(n))) : null; };
const SPEC_MAX = 300; // grant/bless spec length cap
const ID_RE = /^[a-z0-9_]{1,32}$/;

// Flags that default ON and are turned off with =0 (A/B perf switches). Only '0' and '1' are meaningful; other values keep the default.
export const FLAGS_ON = ['trails', 'props', 'push', 'sway', 'fog', 'motes', 'dawn', 'critters', 'edge', 'corr', 'bloom', 'arc', 'vib', 'night', 'lm', 'nums', 'husks'];
// Flags that default OFF and are turned on with =1.
export const FLAGS_OFF = ['god', 'debug', 'life'];
export const KNOWN_KEYS = ['auto', 'seed', 't', 'rr', 'ban', 'grant', 'bless', 'ground', 'bright', 'touch', 'meta', 'mem', 'style', 'specimen', 'kit', ...FLAGS_ON, ...FLAGS_OFF];

export function parseParams(search) {
  const q = new URLSearchParams(search || '');
  const on = (k) => q.get(k) !== '0'; // only '0' turns it off
  const off = (k) => q.get(k) === '1';
  const spec = (k) => { const v = q.get(k); return v && v.length <= SPEC_MAX && /^[a-z0-9_:;,=.-]+$/.test(v) ? v : null; };
  const auto = q.get('auto');
  const p = {
    auto: auto && ID_RE.test(auto) ? auto : null,
    seed: clampInt(q.get('seed'), 0, 2147483647) ?? null,
    startTime: clampInt(q.get('t'), 0, 1200) ?? 0,
    rerolls: clampInt(q.get('rr'), 0, 99) ?? 0,
    banishes: clampInt(q.get('ban'), 0, 99) ?? 0,
    grant: spec('grant'), // dev: "spirit_bolts:power=5,pierce=5:soul_lance;raven_flock"
    bless: spec('bless'), // dev: "wider_glow:2;kind_fortune:3" (validated again in the sim; disables banking)
    flat: q.get('ground') === 'flat', // dev: force the Low ground fallback (no shader)
    bright: ['normal', 'brighter', 'clear'].includes(q.get('bright')) ? q.get('bright') : null, // session-only brightness override (never saved)
    touch: parseTouchParam(q.get('touch')),
    meta: ['full', 'half'].includes(q.get('meta')) ? q.get('meta') : null,
  };
  if (q.get('seed') === null || q.get('seed') === '') p.seed = null;
  if (q.get('t') === '') p.startTime = 0;
  for (const k of FLAGS_OFF) p[k] = off(k);
  for (const k of FLAGS_ON) p[k] = on(k);
  return p;
}
