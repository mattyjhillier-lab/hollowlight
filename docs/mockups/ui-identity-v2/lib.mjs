// Shared drawing helpers for UI identity round 2 mock-ups (static proofs, NOT game code).
// Everything is code-drawn SVG/CSS; the only rasters are the live game frames (frames/) and the approved hero sheets (crops).
let uid = 0;
const u = (p) => `${p}${++uid}`;

// ---------- filters (inline SVG defs, one per page) ----------
export const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<filter id="wob" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="wob2" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="ol1" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="w"/><feMorphology in="w" operator="dilate" radius="1.6" result="d"/><feFlood flood-color="#3a2412"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="w"/></feMerge></filter>
<filter id="olfelt" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" result="w"/><feMorphology in="w" operator="dilate" radius="1.8" result="d"/><feFlood flood-color="#141c2b"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="w"/></feMerge></filter>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="glow2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter>
</defs></svg>`;

// tiny tiling textures as data URIs (no rasters)
const enc = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
export const GRAIN = enc(`<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 .92 0 0 0 0 .8 0 0 0 .09 0'/></filter><rect width='160' height='160' filter='url(#n)'/></svg>`);
export const STREAK = enc(`<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.004 .09' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .10 0'/></filter><rect width='240' height='240' filter='url(#n)'/></svg>`);
export const FELT = enc(`<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.55' numOctaves='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .85 0 0 0 0 .9 0 0 0 0 1 0 0 0 .22 0'/></filter><rect width='180' height='180' filter='url(#n)'/></svg>`);
export const FELTDK = enc(`<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 .02 0 0 0 0 .05 0 0 0 .35 0'/></filter><rect width='180' height='180' filter='url(#n)'/></svg>`);

// ---------- painted icons (Style v1: tinted outline L2 + soft gradient + rim light H2) ----------
const IC = {
  wolf: { c: ['#fff4dc', '#f1c27e'], o: '#8a5a2b', d: 'M9 41 L7 9 L18 19 Q24 15.5 30 19 L41 9 L39 41 Q24 50 9 41Z', x: '<path d="M14 30 l5 2.5 M34 30 l-5 2.5" stroke="#5a3a1c" stroke-width="2.6" stroke-linecap="round"/><path d="M20 39 Q24 43 28 39 Q24 36 20 39Z" fill="#5a3a1c"/><circle cx="17.5" cy="31" r="1.4" fill="#ffb84a"/><circle cx="30.5" cy="31" r="1.4" fill="#ffb84a"/>' },
  orbit: { c: ['#ffffff', '#cfc3ff'], o: '#5b4a9a', d: 'M24 13 C30 19 31 24 28 29 C26 32 22 32 20 29 C17 24 19 19 24 13Z', x: '<ellipse cx="24" cy="30" rx="19" ry="7.5" fill="none" stroke="#5b4a9a" stroke-width="4.2"/><ellipse cx="24" cy="30" rx="19" ry="7.5" fill="none" stroke="#e8e0ff" stroke-width="2"/><circle cx="7" cy="31" r="4" fill="#efe9ff" stroke="#5b4a9a" stroke-width="2"/><circle cx="41" cy="29" r="4" fill="#efe9ff" stroke="#5b4a9a" stroke-width="2"/>' },
  bolt: { c: ['#fffbe8', '#9fe6ff'], o: '#2f5f7a', d: 'M27 4 L11 27 L22 27 L18 44 L37 19 L26 19 L31 4Z', x: '' },
  raven: { c: ['#9aa4c4', '#3e4766'], o: '#1d2236', d: 'M6 30 Q14 16 26 18 Q33 12 40 14 L44 17 L38 19 Q38 28 30 33 L36 42 L26 36 Q14 38 6 30Z', x: '<circle cx="35" cy="17" r="1.6" fill="#ffb84a"/>' },
  boots: { c: ['#e9b47a', '#9a6436'], o: '#4e2e15', d: 'M15 6 H28 V27 Q38 28 41 35 V41 H11 Q9 36 13 31Z', x: '<path d="M11 41 H41" stroke="#ffd36b" stroke-width="3"/><path d="M14 12 H29" stroke="#4e2e15" stroke-width="2"/>' },
  flame: { c: ['#fff1c9', '#ff9a2e'], o: '#8a3f10', d: 'M24 4 C34 16 39 23 38 31 C37 40 31 45 24 45 C17 45 11 40 10 31 C9 23 16 18 19 10 C21 16 22 19 25 20 C27 15 26 10 24 4Z', x: '<path d="M24 26 C29 31 29 37 24 40 C19 37 19 31 24 26Z" fill="#fffbe8"/>' },
  coin: { c: ['#fff0b0', '#d29a2c'], o: '#6b4512', d: 'M24 5 A19 19 0 1 1 23.9 5Z', x: '<circle cx="24" cy="24" r="12" fill="none" stroke="#a8741e" stroke-width="2.2"/><path d="M24 17 V31 M20 21 H28" stroke="#a8741e" stroke-width="2.4" stroke-linecap="round"/>' },
  shard: { c: ['#f3eeff', '#9c86e8'], o: '#43327e', d: 'M24 3 L38 18 L31 45 L17 45 L10 18Z', x: '<path d="M24 3 L22 24 L17 45 M22 24 L38 18 M22 24 L10 18" stroke="#6d58b8" stroke-width="1.3" fill="none"/>' },
  heart: { c: ['#ffe3c4', '#ff9a5a'], o: '#7c3218', d: 'M24 42 C10 32 5 24 8 15 C11 8 20 8 24 15 C28 8 37 8 40 15 C43 24 38 32 24 42Z', x: '' },
  lock: { c: ['#c9cfdb', '#6f7a90'], o: '#2a3142', d: 'M12 22 H36 V42 H12Z', x: '<path d="M16 22 V15 A8 8 0 0 1 32 15 V22" fill="none" stroke="#2a3142" stroke-width="5"/><path d="M16 22 V15 A8 8 0 0 1 32 15 V22" fill="none" stroke="#aab3c4" stroke-width="2.4"/>' },
};
export function icon(name, size = 40, extra = '') {
  const i = IC[name]; const g = u('ig');
  return `<svg class="pic ${extra}" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${i.c[0]}"/><stop offset="1" stop-color="${i.c[1]}"/></linearGradient></defs>
<path d="${i.d}" fill="${i.o}" stroke="${i.o}" stroke-width="5" stroke-linejoin="round"/><path d="${i.d}" fill="url(#${g})"/>${i.x}
<path d="${i.d}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4" stroke-dasharray="10 400" stroke-dashoffset="-2" stroke-linecap="round"/></svg>`;
}

// painted lantern (results + kits)
export function lantern(w = 120, lit = 0.7, tone = 'brass') {
  const g = u('lg'), f = u('lf'), b = u('lb');
  const m = tone === 'felt' ? ['#f5e6c8', '#c9a46a', '#4b3418'] : ['#ffe7a6', '#c08a3e', '#3a2412'];
  return `<svg class="lantern" width="${w}" height="${w * 1.5}" viewBox="0 0 100 150" aria-hidden="true"><defs>
<linearGradient id="${g}" x1="0" x2="1"><stop offset="0" stop-color="${m[1]}"/><stop offset=".35" stop-color="${m[0]}"/><stop offset="1" stop-color="#7a5524"/></linearGradient>
<radialGradient id="${f}" cx=".5" cy=".62" r=".6"><stop offset="0" stop-color="#fff6d8" stop-opacity="${lit}"/><stop offset=".35" stop-color="#ffb347" stop-opacity="${lit * 0.8}"/><stop offset="1" stop-color="#3b4a63" stop-opacity=".55"/></radialGradient>
<radialGradient id="${b}"><stop offset="0" stop-color="#ffb347" stop-opacity="${lit * 0.55}"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs>
<circle cx="50" cy="88" r="60" fill="url(#${b})"/>
<path d="M50 4 a8 8 0 1 1 -0.1 0" fill="none" stroke="${m[2]}" stroke-width="7"/><path d="M50 4 a8 8 0 1 1 -0.1 0" fill="none" stroke="url(#${g})" stroke-width="3.4"/>
<path d="M22 40 Q50 12 78 40Z" fill="url(#${g})" stroke="${m[2]}" stroke-width="3.5" stroke-linejoin="round"/>
<rect x="24" y="40" width="52" height="78" rx="14" fill="url(#${f})" stroke="${m[2]}" stroke-width="4"/>
<path d="M36 44 V114 M64 44 V114" stroke="${m[2]}" stroke-width="3" opacity=".75"/>
<path d="M50 70 C58 80 60 88 57 96 C55 102 45 102 43 96 C40 88 42 80 50 70Z" fill="#ffb347" opacity="${0.3 + lit * 0.7}"/><path d="M50 82 C54 88 54 93 50 97 C46 93 46 88 50 82Z" fill="#fff6d8" opacity="${lit}"/>
<path d="M30 50 Q29 80 31 108" stroke="#fff" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M18 118 H82 L76 132 H24Z" fill="url(#${g})" stroke="${m[2]}" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M24 23 Q50 8 76 23" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/></svg>`;
}

export function flame(s = 16, lit = 1) {
  return `<svg class="fl" width="${s}" height="${s * 1.3}" viewBox="0 0 20 26" aria-hidden="true"><path d="M10 1 C15 8 18 12 17 17 C16 22 13 25 10 25 C7 25 4 22 3 17 C2 12 6 9 8 5 C9 9 10 10 11 10 C12 7 11 4 10 1Z" fill="${lit ? '#ffab3a' : '#5a4636'}" stroke="${lit ? '#8a3f10' : '#2a1d14'}" stroke-width="1.6" stroke-linejoin="round"/>${lit ? '<path d="M10 13 C13 16 13 20 10 22 C7 20 7 16 10 13Z" fill="#fff4d0"/>' : ''}</svg>`;
}

// ---------- custom wordmark: 7 code-drawn letter skeletons (H O L W I G T), 100-unit cap height ----------
const SK = {
  H: { w: 70, d: 'M10 2 V98 M60 2 V98 M10 52 H60' },
  O: { w: 80, d: 'M40 2 C62 2 74 24 74 50 C74 76 62 98 40 98 C18 98 6 76 6 50 C6 24 18 2 40 2Z' },
  L: { w: 62, d: 'M10 2 V98 H58' },
  W: { w: 96, d: 'M4 2 L24 98 L48 34 L72 98 L92 2' },
  I: { w: 22, d: 'M11 2 V98' },
  G: { w: 82, d: 'M72 20 C64 7 52 2 42 2 C20 2 6 24 6 50 C6 76 20 98 42 98 C58 98 72 88 74 62 H46' },
  T: { w: 78, d: 'M4 4 Q39 -2 74 4 M39 4 V98' },
};
const WORD = 'HOLLOWLIGHT';
export function wordmark(take, width = 760) {
  const gap = 10; let x = 0; const pos = [];
  for (const ch of WORD) { pos.push([ch, x]); x += SK[ch].w + gap; }
  const W = x - gap + 24, H = 160;
  const id = u('wm');
  let body = '';
  if (take === 't1') {
    const sw = 15;
    for (const [ch, px] of pos) {
      const t = `translate(${px + 12} 30)`;
      if (ch === 'O') {
        body += `<g transform="${t}"><path d="M28 -8 Q40 -20 52 -8" fill="none" stroke="#3a2412" stroke-width="7"/><path d="M28 -8 Q40 -20 52 -8" fill="none" stroke="url(#${id}b)" stroke-width="3"/>
<rect x="6" y="2" width="68" height="96" rx="30" fill="#3a2412"/><rect x="11" y="7" width="58" height="86" rx="25" fill="url(#${id}g)"/>
<circle cx="40" cy="58" r="34" fill="url(#${id}f)"/><path d="M40 34 C50 46 53 54 50 64 C48 71 32 71 30 64 C27 54 30 46 40 34Z" fill="#ffab3a"/><path d="M40 50 C45 56 45 61 40 66 C35 61 35 56 40 50Z" fill="#fff6d8"/>
<path d="M40 7 V93" stroke="#3a2412" stroke-width="3" opacity=".5"/><rect x="11" y="7" width="58" height="86" rx="25" fill="none" stroke="url(#${id}b)" stroke-width="6"/>
<path d="M18 30 Q17 50 19 72" stroke="#fff" stroke-opacity=".55" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
      } else {
        const d = SK[ch].d;
        body += `<g transform="${t}"><path d="${d}" fill="none" stroke="#3a2412" stroke-width="${sw + 7}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="url(#${id}b)" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff8e0" stroke-opacity=".7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(-3 -3)" mask="url(#${id}m${ch})"/>${ch === 'I' ? `<g transform="translate(11 -14)"><circle r="16" fill="#ffab3a" opacity=".35" filter="url(#glow)"/><path d="M0 -14 C6 -6 8 -2 6 4 C4 9 -4 9 -6 4 C-8 -2 -6 -6 0 -14Z" fill="#ffab3a" stroke="#8a3f10" stroke-width="2"/><path d="M0 -4 C3 0 3 3 0 6 C-3 3 -3 0 0 -4Z" fill="#fff6d8"/></g>` : ''}</g>`;
      }
    }
    const masks = [...new Set(WORD)].filter((c) => c !== 'O').map((c) => `<mask id="${id}m${c}" maskUnits="userSpaceOnUse" x="-30" y="-30" width="160" height="170"><path d="${SK[c].d}" fill="none" stroke="#fff" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/></mask>`).join('');
    return `<svg class="wm" viewBox="0 0 ${W} ${H}" width="${width}" role="img" aria-label="Hollowlight"><defs>
<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c4"/><stop offset=".45" stop-color="#e2b866"/><stop offset="1" stop-color="#9b6a2c"/></linearGradient>
<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b4b66"/><stop offset="1" stop-color="#1e2738"/></linearGradient>
<radialGradient id="${id}f"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset=".6" stop-color="#ff9a2e" stop-opacity=".35"/><stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/></radialGradient>${masks}</defs>
<g filter="url(#wob)">${body}</g>
<path d="M${W * 0.18} 150 Q${W / 2} 138 ${W * 0.82} 150" fill="none" stroke="#ffe0a0" stroke-width="2" stroke-dasharray="7 5" opacity=".85"/><circle cx="${W / 2}" cy="144" r="4.5" fill="#ffd36b" stroke="#6b4512" stroke-width="1.5"/></svg>`;
  }
  if (take === 't2') {
    const sw = 20;
    pos.forEach(([ch, px], i) => {
      const k = i / (WORD.length - 1); // colour returns left -> right
      const d = SK[ch].d;
      body += `<g transform="translate(${px + 12} 26)"><path d="${d}" fill="none" stroke="#14151c" stroke-width="${sw + 9}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="url(#${id}g${i})" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="translate(-3 -3)"/><path d="${d}" fill="none" stroke="#14151c" stroke-width="${sw + 1}" stroke-dasharray="3 ${34 + (i % 3) * 6}" stroke-dashoffset="${-8 - i * 3}"/>${ch === 'I' ? '<circle cx="11" cy="-16" r="11" fill="#14151c"/><circle cx="11" cy="-16" r="7" fill="#ffd36b"/>' : ''}</g>`;
      const lit = ['#7e8ba0', '#9aa3b2'], col = [['#9fb6d6', '#5f7aa3'], ['#a9dccb', '#4f9c86'], ['#ffd27a', '#e08a2a'], ['#ffe9a8', '#ffab3a']][Math.min(3, Math.floor(k * 4))];
      const c = k < 0.18 ? lit : col;
      body = `<linearGradient id="${id}g${i}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient>` + body;
    });
    return `<svg class="wm" viewBox="0 0 ${W} ${H}" width="${width}" role="img" aria-label="Hollowlight"><defs><radialGradient id="${id}r" cx=".7" cy=".5" r=".6"><stop offset="0" stop-color="#ffb347" stop-opacity=".35"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs><ellipse cx="${W * 0.64}" cy="80" rx="${W * 0.3}" ry="60" fill="url(#${id}r)"/>${body}
<path d="M14 148 H${W - 14}" stroke="#14151c" stroke-width="7" stroke-linecap="round"/><path d="M14 148 H${W - 14}" stroke="#4a4f60" stroke-width="2.5"/></svg>`;
  }
  // t3 stitched felt appliqué
  const sw = 24;
  pos.forEach(([ch, px], i) => {
    const d = SK[ch].d, r = [-2, 1.5, -1, 2, -1.5, 1, -2, 2, -1, 1.5, -1][i];
    body += `<g transform="translate(${px + 12} 28) rotate(${r} 40 50)"><g filter="url(#olfelt)"><path d="${d}" fill="none" stroke="${i === 7 ? '#ffcf86' : '#efe2c6'}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></g><path d="${d}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="${sw - 6}" stroke-linecap="round" stroke-linejoin="round" transform="translate(2 3)" style="mix-blend-mode:multiply"/><path d="${d}" fill="none" stroke="#ffab3a" stroke-width="2.6" stroke-dasharray="6 5" stroke-linecap="round" stroke-linejoin="round"/>${ch === 'I' ? `<g transform="translate(11 -16)"><circle r="11" fill="#c08a3e" stroke="#4b3418" stroke-width="2.5"/><circle r="7" fill="none" stroke="#ffe7a6" stroke-width="1.2"/><circle cx="-2.5" cy="-2.5" r="1.6" fill="#4b3418"/><circle cx="2.5" cy="2.5" r="1.6" fill="#4b3418"/><circle cx="2.5" cy="-2.5" r="1.6" fill="#4b3418"/><circle cx="-2.5" cy="2.5" r="1.6" fill="#4b3418"/></g>` : ''}</g>`;
  });
  return `<svg class="wm" viewBox="0 0 ${W} ${H}" width="${width}" role="img" aria-label="Hollowlight">${body}
<path d="M20 150 Q${W / 2} 160 ${W - 20} 150" fill="none" stroke="#ffab3a" stroke-width="2.5" stroke-dasharray="8 6" stroke-linecap="round"/></svg>`;
}

// hero portrait crops from the APPROVED sheets (placeholder for the live rig)
export const HERO = {
  wren: { src: '../wren-v2/wren-v2-sheet.png', x: 168, y: 168, w: 150, h: 204 },
  elias: { src: '../elias-v2/elias-v2-sheet.png', x: 196, y: 176, w: 150, h: 198 },
};
export function portrait(h) {
  const c = HERO[h];
  return `<div class="por" style="--x:${c.x};--y:${c.y};--w:${c.w};--h:${c.h};background-image:url(${c.src})"></div>`;
}
export const POR_CSS = `.por{--s:1;width:calc(var(--w)*var(--s)*1px);height:calc(var(--h)*var(--s)*1px);background-repeat:no-repeat;background-size:calc(1280px*var(--s)) auto;background-position:calc(var(--x)*var(--s)*-1px) calc(var(--y)*var(--s)*-1px);flex:none}`;
