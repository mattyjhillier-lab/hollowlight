// PARTS SHEET: every axis option on a tiny reference sprite / diorama. Mock-ups only.
import { begin, use, defsOut, addDef, wren, glow, lgU, mix, rnd, T, FONT, WREN_H } from './lab.mjs';
import { STYLES, tuft, flower, trunkTree, sparkle, blade } from './scene.mjs';
const mkStyle = (o) => ({ ...STYLES.S1, ...o, id: 'x', name: 'x' });
export function partsPage() {
  begin();
  const W = 1600, H = 980, LX = 200, CW = 345, RH = 176, Y0 = 84; let body = '';
  const rows = [
    ['LINE', 'edges (with H2, P1)', [['L1', 'thick dark outline'], ['L2', 'tinted outline (darker fill)'], ['L3', 'no outline, soft edge-light'], ['L4', 'hand-sketched wobbly ink']], (c) => mkStyle({ L: c, ...(c === 'L4' ? { ink: '#2b2233', lw: 0.9 } : c === 'L1' ? { ink: '#241420' } : {}) })],
    ['SHADING', 'form (with L2, P1)', [['H1', 'flat cel, one hard shadow'], ['H2', 'soft gradient + rim light'], ['H3', 'painterly brush / texture'], ['H4', 'glossy toy, specular']], (c) => mkStyle({ H: c })],
    ['PROPORTIONS', 'bodies (with L2, H2)', [['P1', 'chibi big-head'], ['P2', 'lean stylised-heroic'], ['P3', 'elongated storybook']], (c) => mkStyle({ P: c })],
    ['WORLD', 'ground, depth (L2)', [['W1', 'clean shapes'], ['W2', 'richly textured painted ground'], ['W3', 'layered depth, fog, foreground']], null],
    ['LIGHT', 'warmth (with L2, H2)', [['G1', 'soft lantern pool'], ['G2', 'strong back-light, long trails'], ['G3', 'warm bloom, sparkles, motes']], (c) => mkStyle({ G: c })],
  ];
  rows.forEach(([name, sub, opts, mk], ri) => {
    const y = Y0 + ri * RH;
    body += `<rect x="12" y="${y}" width="${W - 24}" height="${RH - 8}" rx="14" fill="#141b24" stroke="#3a4757"/>` + T(name, 28, y + 44, { s: 21, f: FONT.title, w: 900, c: '#ffd98a' }) + T(sub, 28, y + 66, { s: 11, c: '#aab4c2', w: 500 });
    opts.forEach(([code, label], ci) => {
      const x = LX + ci * CW, cx = x + CW / 2, by = y + RH - 40;
      body += `<rect x="${x + 6}" y="${y + 8}" width="${CW - 12}" height="${RH - 24}" rx="10" fill="#1c2430"/>`;
      if (mk) {
        const st = mk(code); use(st);
        let sprite = `<ellipse cx="${cx}" cy="${by + 2}" rx="46" ry="7" fill="#000" opacity=".4" filter="url(#b4)"/>`;
        if (name === 'LIGHT') sprite = (code === 'G1' ? glow(cx - 6, by - 6, 150, 40, '#ffc45a', 0.8) : code === 'G2' ? `<path d="M${cx + 120} ${y + 6} L${cx + 160} ${y + 6} L${cx - 60} ${by + 10} L${cx - 120} ${by + 10}Z" fill="#ffd890" opacity=".22" filter="url(#b4)" style="mix-blend-mode:screen"/>` + glow(cx + 10, by - 60, 110, 90, '#ffc45a', 0.7) : glow(cx, by - 50, 140, 70, '#ffc45a', 0.5)) + sprite;
        const k = 1.05;
        body += sprite + `<g transform="translate(${cx - 10},${by}) scale(${k})">${wren()}</g>`;
        if (name === 'LIGHT' && code === 'G3') { const r2 = rnd(3); for (let i = 0; i < 12; i++) { body += sparkle(x + 20 + r2() * (CW - 40), y + 20 + r2() * (RH - 60), 3 + r2() * 5); } }
        if (name === 'LIGHT' && code === 'G2') body += `<path d="M${cx + 60} ${by - 70} q60 -10 120 8" stroke="#ffb84a" stroke-width="12" fill="none" opacity=".3" filter="url(#b4)"/><path d="M${cx + 60} ${by - 70} q60 -10 120 8" stroke="#fff4d0" stroke-width="2.4" fill="none" opacity=".9"/>`;
        if (name === 'PROPORTIONS') body += `<line x1="${x + 18}" y1="${by}" x2="${x + 18}" y2="${by - WREN_H[code] * k}" stroke="#ffd98a" stroke-width="1.4"/>`;
      } else {
        const st = mkStyle({ W: code }); use(st);
        addDef(`<clipPath id="wc${ci}"><rect x="${x + 6}" y="${y + 8}" width="${CW - 12}" height="${RH - 24}" rx="10"/></clipPath>`);
        const r = rnd(ci + 5), p = st.pal, gy = y + 66; let g = '';
        if (code === 'W1') { g += `<rect x="${x}" y="${gy}" width="${CW}" height="${RH}" fill="${p.rg2}"/><rect x="${x}" y="${y}" width="${CW}" height="${gy - y}" fill="${p.skyB}"/><ellipse cx="${cx}" cy="${y + 140}" rx="200" ry="40" fill="${p.rg1}" opacity=".6"/><circle cx="${x + 60}" cy="${y + 48}" r="30" fill="${mix(p.bgG, p.fog, 0.3)}"/>`; for (let i = 0; i < 5; i++) g += tuft(x + 40 + i * 70, gy + 30 + (i % 2) * 34, 2.2, [p.rg1, p.rg3], r); for (let i = 0; i < 5; i++) g += flower(x + 70 + i * 60, gy + 52 - (i % 2) * 16, 1.8, p.fl[i % 4]); }
        if (code === 'W2') { g += `<rect x="${x}" y="${y}" width="${CW}" height="${gy - y}" fill="${p.skyB}"/><rect x="${x}" y="${gy - 10}" width="${CW}" height="${RH}" fill="url(#${lgU('wp', 0, gy, 0, y + RH, [[0, p.rg2], [1, p.rg3]])})"/><rect x="${x}" y="${gy - 10}" width="${CW}" height="${RH}" filter="url(#mottle)" opacity=".5"/>`; for (let i = 0; i < 24; i++) g += `<path d="M${x + r() * CW} ${gy + r() * 80} q20 -6 38 0" stroke="${r() > 0.5 ? p.rg1 : p.rg3}" stroke-width="6" stroke-linecap="round" fill="none" opacity=".3"/>`; for (let i = 0; i < 44; i++) g += tuft(x + r() * CW, gy + 6 + r() * 76, 0.9, [p.rg1, p.rg2, p.rg3], r); for (let i = 0; i < 18; i++) g += flower(x + r() * CW, gy + 10 + r() * 70, 1, p.fl[i % 4]); }
        if (code === 'W3') {
          let t = ''; for (let i = 0; i < 8; i++) t += trunkTree(x + 20 + i * 48, gy - 4, 60 + r() * 30, 7, mix(p.bgG, p.fog, 0.4), mix(p.bgR, p.fog, 0.4), r);
          g += `<rect x="${x}" y="${y}" width="${CW}" height="${RH}" fill="${mix(p.skyB, '#fff', 0.1)}"/><g filter="url(#b2)">${t}</g><rect x="${x}" y="${gy - 24}" width="${CW}" height="40" fill="url(#${lgU('wf', 0, gy - 24, 0, gy + 16, [[0, p.fog, 0], [0.6, p.fog, 0.7], [1, p.fog, 0.1]])})"/><rect x="${x}" y="${gy}" width="${CW}" height="${RH}" fill="url(#${lgU('wg3', 0, gy, 0, y + RH, [[0, p.rg1], [1, p.rg3]])})"/>`;
          for (let i = 0; i < 26; i++) { const yy = gy + 6 + r() * 76; g += tuft(x + r() * CW, yy, 0.5 + (yy - gy) / 70, [p.rg1, p.rg2, p.rg3], r); }
          let fgb = ''; for (let i = 0; i < 9; i++) fgb += `<path d="${blade(x + r() * CW, y + RH, 40 + r() * 30, (r() - 0.5) * 30, 8)}" fill="#1a2630"/>`; g += `<g filter="url(#b2)" opacity=".7">${fgb}</g>`;
        }
        body += `<g clip-path="url(#wc${ci})">${g}</g>`;
      }
      body += `<rect x="${x + 14}" y="${y + 14}" width="${26 + code.length * 2}" height="22" rx="6" fill="#07090d" opacity=".85"/>` + T(code, x + 21, y + 30, { s: 15, f: FONT.mono, w: 700, c: '#ffd98a' }) + T(label, x + 14, y + RH - 20, { s: 12.5, c: '#e8edf3', w: 600, st: '#07090d', sw: 3 });
    });
  });
  const head = `${T('STYLE LAB: PARTS (mix any one option per axis)', 24, 38, { s: 30, f: FONT.title, w: 900, c: '#fff' })}${T('Same sprite per option. A style code is one pick per axis: S3 = L1 + H4 + P1 + W1 + G2. "S2 lines with S5 shading" = S2 Line code + S5 Shade code.', 24, 62, { s: 14, c: '#aab4c2', w: 500 })}`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#0b1016}svg{display:block}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defsOut()}<rect width="${W}" height="${H}" fill="#0b1016"/>${head}${body}</svg></body></html>`;
}
