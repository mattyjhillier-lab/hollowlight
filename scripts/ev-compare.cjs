const fs=require('fs');const rd=f=>fs.readFileSync(f,'utf8').trim().split('\n').map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean);
const off=rd(process.argv[2]), on=rd(process.argv[3]);
const W={ghost_wolves:'Wolves',raven_flock:'Ravens',spirit_bolts:'Bolts',chain_lightning:'Chain',holy_orbit:'Orbit'};
const grp=(rs,f)=>{const m=new Map();for(const r of rs){const k=f(r);if(!m.has(k))m.set(k,[]);m.get(k).push(r)}return m};
const st=rs=>{const n=rs.length,w=rs.filter(r=>r.win).length,e=rs.filter(r=>!r.win&&r.t<300).length;return {n,win:Math.round(100*w/n),early:Math.round(100*e/n),evo:(()=>{const a=rs.map(r=>r.evo).filter(x=>x!=null).sort((a,b)=>a-b);return a.length?a[a.length>>1]:null})(),gold:Math.round(rs.reduce((a,r)=>a+r.gold,0)/n)}};
const S48=r=>r.seed<=48;
const tree=k=>k.split('|')[2];
console.log('| cell | OFF win (n) | ON win paired<=48 | ON win all (n) | delta (all-OFF) | dead<5:00 OFF/ON | first evo OFF/ON | gold OFF/ON |');
console.log('|---|---|---|---|---|---|---|---|');
const keys=[...new Set(off.map(r=>r.key))].sort((a,b)=>['none','half','full'].indexOf(tree(a))-['none','half','full'].indexOf(tree(b))||a.localeCompare(b));
const fmt=s=>s==null?'-':`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
for(const k of keys){const a=st(off.filter(r=>r.key===k&&S48(r))),bp=st(on.filter(r=>r.key===k&&S48(r))),b=st(on.filter(r=>r.key===k));const [h,w,t]=k.split('|');console.log(`| ${h} ${W[w]} ${t} | ${a.win} (${a.n}) | ${bp.win} (${bp.n}) | ${b.win} (${b.n}) | ${b.win-a.win>0?'+':''}${b.win-a.win} | ${a.early}/${b.early} | ${fmt(a.evo)}/${fmt(b.evo)} | ${a.gold}/${b.gold} |`)}
console.log('\nPooled by tree state:');
for(const t of ['none','half','full']){const a=st(off.filter(r=>tree(r.key)===t&&S48(r))),bp=st(on.filter(r=>tree(r.key)===t&&S48(r))),b=st(on.filter(r=>tree(r.key)===t));console.log(`${t}: OFF ${a.win}% (n${a.n}, early ${a.early}%) | ON paired ${bp.win}% (n${bp.n}) | ON all ${b.win}% (n${b.n}, early ${b.early}%) | gold ${a.gold}->${b.gold}`)}
for(const h of ['wren','elias']) for(const t of ['none']){const a=st(off.filter(r=>r.key.startsWith(h)&&tree(r.key)===t&&S48(r))),b=st(on.filter(r=>r.key.startsWith(h)&&tree(r.key)===t));console.log(`${h} fresh: OFF ${a.win} ON ${b.win}`)}
const sum=(f)=>on.filter(r=>r.st).reduce((a,r)=>a+f(r.st),0)/on.filter(r=>r.st).length;
console.log(`\nON per run: lamps ${sum(s=>s.l).toFixed(1)}/12 roads ${sum(s=>s.r).toFixed(2)}/2 knots ${sum(s=>s.k).toFixed(2)}/2 xpL ${sum(s=>s.xp).toFixed(2)} gold ${sum(s=>s.g).toFixed(0)} bless ${sum(s=>s.b).toFixed(2)} shard ${sum(s=>s.sh).toFixed(2)} knotDmg ${(on.reduce((a,r)=>a+(r.kd||0),0)/on.length).toFixed(1)}`);
