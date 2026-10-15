// Shared helpers for the mock-up generator (mock-ups only; not game code).
export const rnd = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };

const ICON = {
  wolf: { f: 'M10 38 L8 12 L18 20 L30 20 L40 12 L38 38 L24 45 Z', l: 'M17 29 L21 31 M31 29 L27 31 M24 36 V40' },
  raven: { f: 'M4 30 C13 28 19 20 24 6 C28 20 36 26 44 22 C37 32 31 34 27 42 L23 35 C16 35 9 34 4 30Z', l: 'M24 14 V30' },
  bolt: { f: 'M24 3 L33 24 L24 45 L15 24Z', l: 'M24 12 V36 M6 14 L13 18 M42 14 L35 18' },
  lightning: { f: 'M29 3 L11 27 H23 L18 45 L38 20 H26 Z', l: '' },
  orb: { f: 'M24 14 A10 10 0 1 0 24.01 14Z', l: 'M4 26 C4 14 44 14 44 26 C44 36 4 36 4 26 M40 10 a2.5 2.5 0 1 0 .01 0' },
  heart: { f: 'M24 42 C6 28 6 12 17 11 C21 11 23 13 24 16 C25 13 27 11 31 11 C42 12 42 28 24 42Z', l: '' },
  skull: { f: 'M10 22 C10 8 38 8 38 22 C38 28 34 30 33 33 V38 H15 V33 C14 30 10 28 10 22Z', l: 'M18 24 h4 M26 24 h4 M20 38 v-4 M28 38 v-4' },
  coin: { f: 'M24 6 A18 18 0 1 0 24.01 6Z', l: 'M24 14 V34 M18 20 H28 M18 28 H30' },
  clock: { f: 'M24 6 A18 18 0 1 0 24.01 6Z', l: 'M24 14 V25 L31 29' },
};
export function icon(name, size, color, mode = 'glow') {
  const i = ICON[name];
  const m = { glow: [2.5, 6, 0.22], engrave: [2, 1, 0.4], line: [1.6, 4, 0], solid: [1, 0, 1] }[mode];
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${m[0]}" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 ${m[1]}px ${color});overflow:visible;flex:none"><path d="${i.f}" fill="${color}" fill-opacity="${m[2]}"/>${i.l ? `<path d="${i.l}" stroke="${mode === 'solid' ? '#0a0a0a' : color}" stroke-width="${mode === 'solid' ? 2 : m[0]}"/>` : ''}</svg>`;
}

// Placeholder silhouettes, viewBox 120x200
export function figure(name, col, h = 200, id = 'f') {
  const w = Math.round(h * 0.6);
  const body = name === 'wren'
    ? `<path d="M60 62 C40 70 28 112 20 186 L100 186 C92 112 80 70 60 62Z" fill="url(#${id})"/>
       <path d="M42 54 C40 24 80 24 78 54 C72 42 48 42 42 54Z" fill="url(#${id})"/>
       <path d="M45 38 L40 14 L58 30Z M75 38 L80 14 L62 30Z" fill="${col}" fill-opacity=".8"/>
       <circle cx="60" cy="52" r="14" fill="#05070d"/><circle cx="54" cy="52" r="2.2" fill="#fff"/><circle cx="66" cy="52" r="2.2" fill="#fff"/>
       <path d="M30 150 q30 -14 60 0" stroke="${col}" stroke-width="2" fill="none" opacity=".8"/>`
    : `<path d="M60 58 C34 66 22 112 16 186 L104 186 C98 112 86 66 60 58Z" fill="url(#${id})"/>
       <circle cx="60" cy="44" r="15" fill="#05070d" stroke="${col}" stroke-width="2"/>
       <ellipse cx="60" cy="16" rx="20" ry="5" fill="none" stroke="${col}" stroke-width="3"/>
       <path d="M98 72 V190" stroke="${col}" stroke-width="3"/><circle cx="98" cy="64" r="10" fill="${col}" fill-opacity=".55" stroke="${col}" stroke-width="2"/>
       <path d="M40 100 q20 12 40 0" stroke="${col}" stroke-width="2" fill="none" opacity=".7"/>`;
  return `<svg viewBox="0 0 120 200" width="${w}" height="${h}" style="filter:drop-shadow(0 0 14px ${col});overflow:visible"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".75"/><stop offset="1" stop-color="${col}" stop-opacity=".06"/></linearGradient></defs><g stroke="${col}" stroke-width="2">${body}</g></svg>`;
}

const WOLF = 'M4 16 Q10 6 20 8 L30 6 L36 2 L35 10 L40 14 L34 15 L30 22 L26 16 L14 17 L10 24 L8 17 Z';
const RAVEN = 'M0 10 Q10 0 20 8 Q30 0 40 10 Q30 8 20 16 Q10 8 0 10Z';

// Forest scene, 1280x604. p = palette.
export function scene(p, { seed = 7, actors = false, id = 's', moon = false, grid = false } = {}) {
  const r = rnd(seed);
  let o = `<svg viewBox="0 0 1280 604" width="1280" height="604" style="position:absolute;left:0;top:0"><defs>
  <radialGradient id="bg${id}" cx="50%" cy="48%" r="75%"><stop offset="0" stop-color="${p.sky1}"/><stop offset=".6" stop-color="${p.sky2}"/><stop offset="1" stop-color="${p.sky3}"/></radialGradient>
  <radialGradient id="gl${id}"><stop offset="0" stop-color="${p.a}" stop-opacity=".55"/><stop offset="1" stop-color="${p.a}" stop-opacity="0"/></radialGradient>
  <radialGradient id="gb${id}"><stop offset="0" stop-color="${p.b}" stop-opacity=".5"/><stop offset="1" stop-color="${p.b}" stop-opacity="0"/></radialGradient>
  <filter id="bl${id}"><feGaussianBlur stdDeviation="18"/></filter></defs>
  <rect width="1280" height="604" fill="url(#bg${id})"/>`;
  if (moon) o += `<circle cx="${moon.x}" cy="${moon.y}" r="200" fill="url(#gb${id})"/><circle cx="${moon.x}" cy="${moon.y}" r="48" fill="${p.moon}" opacity=".9"/><circle cx="${moon.x}" cy="${moon.y}" r="64" fill="${p.moon}" opacity=".12"/>`;
  if (grid) {
    for (let x = 0; x <= 1280; x += 64) o += `<path d="M${x} 0V604" stroke="${p.a}" stroke-opacity=".05"/>`;
    for (let y = 0; y <= 604; y += 64) o += `<path d="M0 ${y}H1280" stroke="${p.a}" stroke-opacity=".05"/>`;
  }
  for (let i = 0; i < 16; i++) {
    const x = r() * 1280, y = 120 + r() * 480, s = 0.7 + r() * 0.9;
    o += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})"><ellipse cx="0" cy="62" rx="50" ry="10" fill="#000" opacity=".35"/><rect x="-7" y="10" width="14" height="52" rx="5" fill="${p.tree2}"/><circle cx="-24" cy="2" r="30" fill="${p.tree}"/><circle cx="22" cy="0" r="32" fill="${p.tree}"/><circle cx="0" cy="-18" r="36" fill="${p.tree}"/></g>`;
  }
  o += `<ellipse cx="300" cy="520" rx="420" ry="60" fill="${p.fog}" opacity=".35" filter="url(#bl${id})"/><ellipse cx="1000" cy="430" rx="360" ry="50" fill="${p.fog}" opacity=".3" filter="url(#bl${id})"/>`;
  for (let i = 0; i < 46; i++) {
    const x = r() * 1280, y = r() * 604, c = r() > 0.5 ? p.a : p.b;
    o += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="4" fill="${c}" opacity=".16"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="1.4" fill="${c}" opacity=".85"/>`;
  }
  if (actors) {
    const px = 640, py = 330;
    o += `<circle cx="${px}" cy="${py}" r="150" fill="url(#gl${id})"/>`;
    for (let i = 0; i < 26; i++) {
      const a = r() * 6.28, d = 90 + r() * 330, x = px + Math.cos(a) * d * 1.3, y = py + Math.sin(a) * d * 0.8;
      o += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><ellipse rx="13" ry="7" fill="${p.enemy}"/><circle cx="-4" cy="-1" r="1.6" fill="${p.eye}"/><circle cx="4" cy="-1" r="1.6" fill="${p.eye}"/></g>`;
    }
    for (let i = 0; i < 14; i++) {
      const x = 380 + r() * 520, y = 150 + r() * 340;
      o += `<path d="M${x.toFixed(0)} ${(y - 6).toFixed(0)} l5 6 l-5 6 l-5 -6Z" fill="${p.gem}" opacity=".9"/>`;
    }
    o += `<ellipse cx="${px}" cy="${py}" rx="84" ry="58" fill="none" stroke="${p.b}" stroke-opacity=".3"/>`;
    for (const [x, y] of [[724, 330], [598, 372], [592, 288]]) o += `<circle cx="${x}" cy="${y}" r="16" fill="${p.orb}" opacity=".3"/><circle cx="${x}" cy="${y}" r="7" fill="${p.orb}"/>`;
    o += `<g transform="translate(${px - 9} ${py - 22})"><ellipse cx="9" cy="40" rx="14" ry="5" fill="#000" opacity=".4"/><path d="M9 6 C-2 10 -4 30 -6 40 L24 40 C22 30 20 10 9 6Z" fill="#12182c" stroke="${p.a}" stroke-width="1.2"/><circle cx="9" cy="2" r="6" fill="#0a0e1c" stroke="${p.a}"/><circle cx="26" cy="22" r="5" fill="${p.warm}"/></g>`;
    for (const [x, y, s] of [[520, 300, 1.7], [760, 380, 1.5], [455, 410, 1.3]]) o += `<g transform="translate(${x} ${y}) scale(${s})" style="filter:drop-shadow(0 0 8px ${p.a})"><path d="${WOLF}" fill="${p.a}" fill-opacity=".8" stroke="#fff" stroke-opacity=".8" stroke-width=".8"/><circle cx="34" cy="8" r="1.4" fill="#fff"/></g>`;
    for (const [x, y, s] of [[600, 215, 1.4], [720, 250, 1.2]]) o += `<g transform="translate(${x} ${y}) scale(${s})" style="filter:drop-shadow(0 0 8px ${p.b})"><path d="${RAVEN}" fill="${p.b}" fill-opacity=".85" stroke="#fff" stroke-opacity=".6" stroke-width=".7"/></g>`;
    o += `<polyline points="740,270 790,215 770,205 835,150 815,172 870,190" fill="none" stroke="#fff" stroke-width="2.2" style="filter:drop-shadow(0 0 8px ${p.a})" stroke-linejoin="round"/>`;
    for (const [x, y, t] of [[640, 200, '22'], [560, 240, '16'], [700, 180, '30'], [480, 350, '18']]) o += `<text x="${x}" y="${y}" font-family="Segoe UI,Arial" font-weight="700" font-size="20" fill="#fff" fill-opacity=".65">${t}</text>`;
  }
  o += `</svg><div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 46%,transparent 35%,rgba(0,0,0,.72) 100%)"></div>`;
  return o;
}

export const pips = (n, max, on, off, cls = 'pip') => Array.from({ length: max }, (_, i) => `<i class="${cls}" style="background:${i < n ? on : off}"></i>`).join('');

export function page(d) {
  const sw = d.palette.map(([h]) => `<i style="background:${h}"></i>`).join('');
  const hexes = d.palette.map(([h, n]) => `${n} ${h}`).join('  /  ');
  const screens = d.screens.map((s, i) => `<div class="stage" id="${s.id}" style="${d.vars};${i ? 'display:none' : ''}">
<div class="banner"><div class="bn"><b>${d.label}</b><span>${d.line}</span><code>${d.legend}</code></div><div class="sw">${sw}</div></div>
<div class="mock" style="background:${d.bg}">${s.html}</div>
<div class="cap"><b>${s.cap}</b><span>${hexes}</span></div></div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${d.label}</title><style>
*{box-sizing:border-box;margin:0;padding:0}html,body{background:#000;width:1280px;height:720px;overflow:hidden}
.stage{position:relative;width:1280px;height:720px;background:#06070c;overflow:hidden;font-family:var(--bf);color:var(--text)}
.banner{position:absolute;left:0;top:0;width:1280px;height:80px;background:#04050a;display:flex;align-items:center;gap:22px;padding:0 18px;border-bottom:2px solid ${d.pal0};z-index:50;font-family:"Segoe UI",Arial,sans-serif}
.bn{display:flex;flex-direction:column;gap:1px}.bn b{font-size:27px;font-weight:900;letter-spacing:1px;color:#fff;line-height:1.1;text-shadow:0 0 14px ${d.pal0};white-space:nowrap}
.bn span{font-size:13px;color:#c9d0e4}.bn code{font-family:Consolas,monospace;font-size:12px;color:${d.pal0};white-space:nowrap}.sw{margin-left:auto;display:flex;gap:7px}.sw i{width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.7)}
.mock{position:absolute;left:0;top:80px;width:1280px;height:604px;overflow:hidden}
.cap{position:absolute;left:0;top:684px;width:1280px;height:36px;background:#04050a;display:flex;align-items:center;gap:20px;padding:0 18px;color:#e6e9f5;font-size:15px;border-top:1px solid #222;font-family:"Segoe UI",Arial,sans-serif}
.cap b{font-size:16px;color:#fff;white-space:nowrap}.cap span{font-size:11px;color:#9aa3bd;white-space:nowrap;overflow:hidden}
.abs{position:absolute}.hf{font-family:var(--hf)}
${d.css}</style></head><body>${screens}<script>const s=new URLSearchParams(location.search).get('s');if(s){document.querySelectorAll('.stage').forEach(e=>e.style.display=e.id===s?'block':'none')}</script></body></html>`;
}
