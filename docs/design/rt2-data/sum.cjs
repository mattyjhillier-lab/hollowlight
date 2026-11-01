const fs=require('fs');const seen=new Set();const L=fs.readFileSync(process.argv[2],'utf8').split('\n').filter(Boolean).map(JSON.parse).filter(o=>{const id=o.key+'#'+o.seed;if(seen.has(id))return false;seen.add(id);return true});
const g={};for(const o of L){(g[o.key]??=[]).push(o)}
const med=a=>a.length?[...a].sort((x,y)=>x-y)[a.length>>1]:'-';
const wil=(k,n)=>{const z=1.96,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return Math.round(100*(c-h))+'-'+Math.round(100*(c+h))};
const row=(k,rs)=>{const n=rs.length,w=rs.filter(r=>r.win).length,reach=rs.filter(r=>r.win||r.t>=840).length,d=rs.filter(r=>!r.win),bd=d.filter(r=>r.t>=840).length,e=d.filter(r=>r.t<300).length;
console.log('|'+[k,n,Math.round(100*w/n)+' ('+wil(w,n)+')',reach,reach?Math.round(100*w/reach)+' ('+wil(w,reach)+')':'-',d.length?Math.round(100*bd/d.length):'-',med(rs.filter(r=>r.win&&r.bossKill).map(r=>r.bossKill-840)),Math.round(100*e/n)].join('|')+'|')};
console.log('|cell|n|win (CI)|reach|win given reach (CI)|boss % of defeats|fight med s|dead<5:00 %|');
for(const k of Object.keys(g).sort())row(k.replace('|normal|b0|random',''),g[k]);
for(const t of ['none','half']){row('POOL '+t,L.filter(o=>o.key.includes('|'+t+'|')))}
row('POOL all',L);
for(const [nm,re] of [['Wolves/Ravens/Bolts',/wolves|raven|bolts/],['Chain',/chain/],['Orbit',/orbit/]])row('POOL '+nm,L.filter(o=>re.test(o.key)));
