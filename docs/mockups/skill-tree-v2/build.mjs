// Builds the skill tree v2 mock-up pages (static HTML + inline SVG). node build.mjs && node shoot.mjs mock
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapSVG, defs, page, C, esc, NODES, worldPos, clusterCentre, nodeSVG, glyph, hubLantern, SAVE } from './lib.mjs';
import { CLUSTERS, EMBLEMS } from './inventory.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const W = (name, html) => { writeFileSync(join(HERE, name), html); console.log('wrote', name); };
const SIZES = { desk: [1280, 720], phl: [844, 390], php: [390, 844] };
const svg = (w, h, inner) => `<svg class="map" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${defs()}${inner}</svg>`;
const wallet = (sm) => `<div class="pill"${sm ? ' style="height:36px;font-size:16px;padding:0 10px"' : ''}><span class="coin"></span>${SAVE.gold.toLocaleString('en-GB')}</div><div class="pill"${sm ? ' style="height:36px;font-size:16px;padding:0 10px"' : ''}><span class="shard"></span>${SAVE.shards}</div>`;
const byId = (id) => NODES.find((n) => n.id === id);

// ---------------------------------------------------------------- 1. overview (Option A), all three sizes
const questCard = (compact) => `<div class="kick">Next lights</div>
  ${[['Raven Flock', 'Slay 4500 Carrion Crows', 3900, 4500, 'A new spirit'], ['The Alpha', 'Evolve Ghost Wolves 3 times', 4, 3, 'Evolution socket'], ['', 'Slay 10000 Forest Wolves', 5200, 10000, ''], ['Spirit Bolts', 'Slay 1500 Root Crawlers', 900, 1500, 'A new spirit']].slice(0, compact ? 2 : 4).map(([n, t, a, b, k]) => `${n ? `<div style="margin-top:8px;display:flex;justify-content:space-between;align-items:baseline"><span style="font-family:HLC;font-size:18px">${n}</span><span class="small mute">${k}</span></div>` : ''}<div class="cond small"><span>${t}</span><span>${Math.min(a, b).toLocaleString('en-GB')}/${b.toLocaleString('en-GB')}</span></div><div class="bar${a >= b ? ' done' : ''}"><i style="width:${Math.min(100, (a / b) * 100)}%"></i></div>`).join('')}`;
for (const [tag, [w, h]] of Object.entries(SIZES)) {
  const phone = tag !== 'desk';
  const s = tag === 'desk' ? 0.36 : tag === 'phl' ? 0.2 : 0.205;
  const cy = tag === 'php' ? 30 : tag === 'desk' ? 10 : 18;
  const cx = tag === 'desk' ? 190 : tag === 'phl' ? -150 : 0;
  const map = mapSVG({ w, h, cx, cy, s });
  const top = `<div class="top"><div class="btn"${phone ? ' style="padding:0 12px;font-size:17px"' : ''}>Back${phone ? '' : ' <span class="key">Esc</span>'}</div>${phone ? '' : '<div class="title" style="margin-left:6px">The Lantern Web</div>'}<div class="spacer"></div>${wallet(phone)}${phone ? '' : '<div class="btn" style="font-size:17px">Find <span class="key">F</span></div><div class="btn" style="font-size:17px">Respec</div>'}</div>`;
  const side = tag === 'desk' ? `<div class="glass panel" style="right:16px;top:76px;width:300px">${questCard(false)}<div class="thread"></div><div class="small mute">Tap a lantern to read it. The camera opens on the next light you can afford.</div></div>`
    : tag === 'phl' ? `<div class="glass panel" style="right:10px;top:62px;width:240px;padding:8px 12px"><div class="kick">Next light</div><div style="font-family:HLC;font-size:17px;margin-top:4px">Raven Flock</div><div class="cond small"><span>Slay 4500 crows</span><span>3,900/4,500</span></div><div class="bar"><i style="width:87%"></i></div><div class="small mute" style="margin-top:6px">+2 more &middot; tap to open</div></div>`
      : `<div class="glass panel" style="left:10px;right:10px;bottom:10px;padding:10px 14px">${questCard(true)}</div>`;
  const zoom = phone ? '' : `<div style="position:absolute;left:16px;top:84px;display:flex;flex-direction:column;gap:10px"><div class="btn round">+</div><div class="btn round">&minus;</div><div class="btn round" style="font-size:15px">&#9737;</div></div>`;
  const help = tag === 'desk' ? `<div class="help">Drag or WASD to move &middot; wheel or +/- to zoom &middot; Tab moves between lanterns &middot; Enter buys &middot; Home recentres</div>` : '';
  W(`st2-overview-${tag}.html`, page('Lantern Web overview', `<div class="stage">${svg(w, h, map)}${top}${zoom}${side}${help}</div>`));
}

// ---------------------------------------------------------------- 2. wolf constellation zoomed + detail panel (desktop)
{
  const [w, h] = SIZES.desk;
  const [ccx, ccy] = clusterCentre('ghost_wolves');
  const map = mapSVG({ w, h, cx: ccx + 120, cy: ccy - 10, s: 1.55 }, { lod: 'near', sel: 'gt_dire_alpha' });
  const panel = `<div class="glass panel" style="right:16px;top:76px;width:340px;bottom:16px;display:flex;flex-direction:column">
    <div class="kick">Evolution socket &middot; Ghost Wolves</div>
    <div class="h">The Alpha</div>
    <div class="whisper">One great wolf leads; the pack follows its bite.</div>
    <div class="thread"></div>
    <div class="eff">Unlocks a third way for your wolves to evolve. <b>The recipe stays hidden</b> until you find it in a run.</div>
    <div class="kick" style="margin-top:14px">To wake it</div>
    <div class="cond"><span>&#10003; Evolve Ghost Wolves 3 times</span><span>4/3</span></div><div class="bar done"><i style="width:100%"></i></div>
    <div class="cond"><span>Slay 10000 Forest Wolves</span><span>5,200/10,000</span></div><div class="bar"><i style="width:52%"></i></div>
    <div class="small mute" style="margin-top:6px">About 6 more runs at your pace.</div>
    <div class="spacer"></div>
    <div class="thread"></div>
    <div style="display:flex;align-items:center;gap:10px"><div class="pill"><span class="coin"></span>300</div><div class="btn" style="flex:1;justify-content:center;opacity:.55">Wake it <span class="key">Enter</span></div></div>
    <div class="small mute" style="margin-top:8px">Permanent: kept on respec.</div></div>`;
  const top = `<div class="top"><div class="btn">Back <span class="key">Esc</span></div><div class="title" style="margin-left:6px">Ghost Wolves</div><div class="whisper" style="margin-left:8px">Wren's pack. Light every star of the wolf.</div><div class="spacer"></div>${wallet()}</div>`;
  const legend = `<div class="glass panel" style="left:16px;bottom:16px;width:330px;padding:10px 14px"><div class="kick">On this constellation</div><div class="small" style="margin-top:6px;line-height:1.5">11 lanterns trace the wolf. Sockets sit at its <b>eyes</b> and <b>nose</b>: <span style="color:${C.gold}">gold seal</span> = evolution known, <span style="color:${C.teal}">teal arc</span> = progress to wake it. The <span style="color:#e5484d">red drop</span> marks a <b>Bleed</b> lantern (status, shared cap).</div></div>`;
  W('st2-wolf-desk.html', page('Wolf constellation', `<div class="stage">${svg(w, h, map)}${top}${panel}${legend}</div>`));
}

// ---------------------------------------------------------------- 3. locked cluster teaser (ravens) + unlock progress (desktop)
{
  const [w, h] = SIZES.desk;
  const [ccx, ccy] = clusterCentre('raven_flock');
  const map = mapSVG({ w, h, cx: ccx + 110, cy: ccy + 10, s: 1.45 }, { lod: 'near', sel: 'gt_raven_flock' });
  const panel = `<div class="glass panel" style="right:16px;top:76px;width:340px;display:flex;flex-direction:column">
    <div class="kick">A spirit not yet woken</div>
    <div class="h">Raven Flock</div>
    <div class="whisper">Something with black wings watches the crows you fell.</div>
    <div class="thread"></div>
    <div class="eff">Wake it to let ravens appear in your level-up cards. Its 11 lanterns and 3 sockets light up once it wakes.</div>
    <div class="kick" style="margin-top:14px">To wake it</div>
    <div class="cond"><span>Slay 4500 Carrion Crows</span><span>3,900/4,500</span></div><div class="bar"><i style="width:87%"></i></div>
    <div class="small mute" style="margin-top:6px">About 1 more run. Crows gather near the graves.</div>
    <div class="thread"></div>
    <div style="display:flex;align-items:center;gap:10px"><div class="pill"><span class="coin"></span>200</div><div class="btn" style="flex:1;justify-content:center;opacity:.55">Wake it</div></div></div>`;
  const top = `<div class="top"><div class="btn">Back <span class="key">Esc</span></div><div class="title" style="margin-left:6px">An unwoken spirit</div><div class="spacer"></div>${wallet()}</div>`;
  const note = `<div class="glass panel" style="left:16px;bottom:16px;width:360px;padding:10px 14px"><div class="kick">Teaser rules</div><div class="small" style="margin-top:6px;line-height:1.5">Before it wakes you see only the <b>grey silhouette</b> of the emblem, its dashed thread and locked lanterns. Names stay hidden; sockets show a lock. The heart shows the one condition and a teal progress arc. When it wakes: the thread draws itself in 0.6 s and colour returns to the emblem.</div></div>`;
  W('st2-teaser-desk.html', page('Locked constellation teaser', `<div class="stage">${svg(w, h, map)}${top}${panel}${note}</div>`));
}

// ---------------------------------------------------------------- 4. states sheet: node ladder, sockets locked/ready/lit, status nodes, progress (desktop)
{
  const [w, h] = SIZES.desk;
  const z = 1.5;
  const items = [];
  const cell = (x, y, n, st, label, sub, prog) => { items.push(nodeSVG(n, x, y, z, st, { progress: prog })); items.push(`<text x="${x}" y="${y + 52}" text-anchor="middle" font-family="AS" font-weight="700" font-size="14" fill="${C.cream}">${esc(label)}</text><text x="${x}" y="${y + 70}" text-anchor="middle" font-family="AS" font-size="12.5" fill="${C.mute}">${esc(sub)}</text>`); };
  const wolfKnot = byId('wf_fang'), bleed = byId('wf_bleed'), mast = byId('wf_third'), sock = byId('gt_dire_alpha'), heart = byId('gt_raven_flock'), key = byId('su_key'), ring = byId('li_vigor'), hero = byId('ch_wren'), burn = byId('or_kindle'), mark = byId('rv_eye'), teaser = byId('tz_marsh');
  const row1 = 150, row2 = 360, row3 = 560;
  [[wolfKnot, 'Knot', 'stat 1-3%'], [ring, 'Ring lantern', 'global'], [bleed, 'Status bead', 'Bleed'], [burn, 'Status bead', 'Burn'], [mark, 'Status bead', 'Mark (+duration)'], [mast, 'Mastery', 'condition capstone'], [hero, 'Hero lantern', 'Wren / Elias'], [key, 'Keystone', 'exclusive pair'], [teaser, 'Fog teaser', 'future chapter']].forEach(([n, a, b], i) => cell(90 + i * 135, row1, n, 'lit', a, b));
  const knS = [['avail', 'Can buy', 'brass rim, dark glass'], ['lit', 'Owned', 'lit in the role colour'], ['cond', 'Condition', 'teal arc = progress'], ['dormant', 'Dormant', 'cluster asleep: grey']];
  knS.forEach(([st, a, b], i) => cell(90 + i * 135, row2, wolfKnot, st, a, b, 0.62));
  [['dormant', 'Socket: sealed', 'name hidden (???)', 0], ['cond', 'Socket: stirring', 'name shown, arc fills', 0.52], ['ready', 'Socket: ready', 'condition met: teal + NEW', 1], ['lit', 'Socket: lit', 'gold wax seal = known', 1]].forEach(([st, a, b, p], i) => cell(680 + i * 150, row2, sock, st, a, b, p));
  [['cond', 'Weapon heart: asleep', 'one condition + arc', 0.87], ['lit', 'Weapon heart: awake', 'emblem in role colour', 1]].forEach(([st, a, b, p], i) => cell(140 + i * 220, row3, heart, st, a, b, p));
  items.push(`<g transform="translate(990 ${row2 - 52})"><path d="M2 3H62L54 15L62 27H2Z" fill="${C.teal}" stroke="#1f5a52" stroke-width="2"/><text x="28" y="20" text-anchor="middle" font-family="AS" font-weight="700" font-size="12" fill="#14201e">NEW</text></g>`);
  const body = `<div class="stage"><svg class="map" viewBox="0 0 ${w} ${h}">${defs()}${items.join('')}</svg>
    <div class="cap" style="left:30px;top:22px">1 &middot; node ladder (size = importance; every target is 44 px or larger)</div>
    <div class="cap" style="left:30px;top:262px">2 &middot; node states</div><div class="cap" style="left:620px;top:262px">3 &middot; evolution socket states (Option A)</div>
    <div class="cap" style="left:30px;top:462px">4 &middot; weapon heart (cluster anchor)</div>
    <div class="glass panel" style="left:560px;top:470px;width:690px;padding:12px 16px"><div class="kick">5 &middot; unlock-progress display, three places</div>
      <div style="display:flex;gap:18px;margin-top:8px">
      <div style="flex:1"><div class="small mute">On the map</div><div class="small">teal arc around the lantern (no number until selected)</div></div>
      <div style="flex:1.2"><div class="small mute">Detail panel</div><div class="cond small"><span>Slay 10000 Forest Wolves</span><span>5,200/10,000</span></div><div class="bar"><i style="width:52%"></i></div><div class="small mute">About 6 more runs at your pace.</div></div>
      <div style="flex:1.2"><div class="small mute">Results screen + Next lights board</div><div class="small"><span class="flag">NEW</span> Raven Flock can wake</div><div class="small" style="margin-top:4px">Closest: The Alpha 76%</div></div></div></div></div>`;
  W('st2-states-desk.html', page('Node and socket states', body));
}

// ---------------------------------------------------------------- 5. phone views with detail sheet
{
  const [w, h] = SIZES.php;
  const [ccx, ccy] = clusterCentre('ghost_wolves');
  const map = mapSVG({ w, h, cx: ccx, cy: ccy + 215, s: 0.8 }, { lod: 'near', sel: 'wf_rend' });
  const sheet = `<div class="glass" style="position:absolute;left:6px;right:6px;bottom:6px;padding:8px 16px 14px;border-radius:22px 22px 16px 16px">
    <div style="width:44px;height:5px;border-radius:3px;background:#c99a4e;margin:2px auto 8px"></div>
    <div style="display:flex;align-items:center;gap:10px"><div><div class="kick">Bleed &middot; Ghost Wolves</div><div class="h" style="font-size:24px">Red Thread</div></div><div class="spacer"></div><div class="big">+2%</div></div>
    <div class="eff" style="font-size:15px">Rend bleeds 2% harder. Shares the status cap with Burn.</div>
    <div class="cond small"><span>Slay 2500 Forest Wolves</span><span>2,250/2,500</span></div><div class="bar"><i style="width:90%"></i></div>
    <div style="display:flex;gap:10px;margin-top:12px"><div class="pill" style="height:48px"><span class="coin"></span>570</div><div class="btn primary" style="flex:1;height:48px;justify-content:center;opacity:.6">Light it</div></div></div>`;
  const top = `<div class="top" style="left:8px;right:8px;top:8px;height:44px"><div class="btn" style="padding:0 12px;font-size:17px">Back</div><div class="spacer"></div>${wallet(true)}</div>
    <div style="position:absolute;right:8px;top:64px;display:flex;flex-direction:column;gap:8px"><div class="btn round">+</div><div class="btn round">&minus;</div></div>
    <div class="whisper" style="position:absolute;left:12px;top:64px;font-size:14px">Pinch to zoom &middot; drag to move</div>`;
  W('st2-phone-php.html', page('Phone portrait', `<div class="stage">${svg(w, h, map)}${top}${sheet}</div>`));
}
{
  const [w, h] = SIZES.phl;
  const [ccx, ccy] = clusterCentre('holy_orbit');
  const map = mapSVG({ w, h, cx: ccx + 225, cy: ccy - 14, s: 0.72 }, { lod: 'near', sel: 'gt_vesper_tide' });
  const sheet = `<div class="glass" style="position:absolute;right:6px;top:6px;bottom:6px;width:320px;padding:12px 16px;display:flex;flex-direction:column">
    <div class="kick">Evolution socket &middot; Holy Orbit</div><div class="h" style="font-size:24px">Vesper Tide</div>
    <div class="eff" style="font-size:14.5px">A third way for the orbit to evolve. Recipe stays hidden.</div>
    <div class="cond small"><span>Evolve Holy Orbit 3 times</span><span>2/3</span></div><div class="bar"><i style="width:66%"></i></div>
    <div class="cond small"><span>Play 8 runs as Elias</span><span>3/8</span></div><div class="bar"><i style="width:38%"></i></div>
    <div class="spacer"></div>
    <div style="display:flex;gap:10px"><div class="pill" style="height:44px"><span class="coin"></span>600</div><div class="btn" style="flex:1;justify-content:center;opacity:.55">Wake it</div></div></div>`;
  const top = `<div class="top" style="left:8px;right:340px;top:6px;height:44px"><div class="btn" style="padding:0 12px;font-size:17px">Back</div><div class="spacer"></div>${wallet(true)}</div>`;
  W('st2-phone-phl.html', page('Phone landscape', `<div class="stage">${svg(w, h, map)}${top}${sheet}</div>`));
}

// ---------------------------------------------------------------- 6. emblem constellations: all five + how future weapons fit (desktop)
{
  const [w, h] = SIZES.desk;
  const g = [];
  const order = ['ghost_wolves', 'raven_flock', 'spirit_bolts', 'chain_lightning', 'holy_orbit'];
  const allOpen = { ...SAVE, clusterOpen: Object.fromEntries(order.map((k) => [k, true])), owned: new Set([...SAVE.owned]) };
  order.forEach((wid, i) => {
    const [ccx, ccy] = clusterCentre(wid);
    const px = 130 + i * 255, py = 300;
    // draw each cluster with its own view into a nested svg
    g.push(`<svg x="${px - 125}" y="${py - 175}" width="250" height="350" viewBox="0 0 250 350">${mapSVG({ w: 250, h: 350, cx: ccx, cy: ccy + 10, s: 0.6 }, { lod: 'mid', save: allOpen, names: false, labels: false }).replace(/<circle cx="[^"]*" cy="[^"]*" r="[0-9.]+" fill="#cfd8ff"[^>]*\/>/g, '')}</svg>`);
    const c = CLUSTERS[wid];
    const sockets = NODES.filter((n) => n.cluster === wid && n.kind === 'socket');
    g.push(`<text x="${px}" y="${py + 170}" text-anchor="middle" font-family="HLC" font-size="22" fill="${c.col}">${c.name}</text>`);
    g.push(`<text x="${px}" y="${py + 192}" text-anchor="middle" font-family="AS" font-size="13" fill="${C.dim}">${esc(sockets.map((s) => s.point).join(' / '))}</text>`);
  });
  const fut = [['Lantern Wisps', 'flame'], ['Frost Bell', 'bell'], ['Grave Hand', 'hand']];
  const bell = 'M0 -24 C14 -24 18 -10 18 6 L24 16 H-24 L-18 6 C-18 -10 -14 -24 0 -24Z M-5 18 A5 5 0 0 0 5 18';
  const hand = 'M-14 24 L-16 0 L-20 -12 L-14 -14 L-10 -2 L-10 -22 L-4 -22 L-3 -4 L-1 -26 L5 -26 L5 -4 L8 -22 L14 -21 L12 0 L18 -8 L22 -4 L12 14 L10 24Z';
  const flame = 'M0 -26 C14 -10 18 0 15 10 C12 20 6 24 0 24 C-6 24 -12 20 -15 10 C-18 0 -8 -8 -3 -16 C-1 -8 2 -6 5 -6 C5 -14 3 -20 0 -26Z';
  fut.forEach(([n, k], i) => { const d = { flame, bell, hand }[k]; g.push(`<g transform="translate(${470 + i * 170} 620) scale(1.4)"><path d="${d}" fill="#8e9ab8" fill-opacity=".06" stroke="#8e9ab8" stroke-opacity=".5" stroke-dasharray="3 4" stroke-width="1.4"/></g><text x="${470 + i * 170}" y="680" text-anchor="middle" font-family="AS" font-size="13" fill="${C.mute}">${n} (after v1)</text>`); });
  const body = `<div class="stage">${svg(w, h, g.join(''))}<div class="cap" style="left:30px;top:22px">Emblem constellations: 11 lanterns trace each spirit's emblem; three sockets at its meaningful points; heart = the weapon gate</div>
  <div class="glass panel" style="left:24px;top:574px;width:330px;padding:10px 14px"><div class="kick">Future weapons</div><div class="small" style="margin-top:6px">Each new spirit brings its own emblem (same 11 + 3 + 1 template) and takes the next free place on the outer sky band. Shown here only as a design rule; nothing after v1 is in the tree.</div></div></div>`;
  W('st2-emblems-desk.html', page('Emblem constellations', body));
}
console.log('done');
