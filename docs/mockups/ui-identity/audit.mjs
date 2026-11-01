// UI audit screenshots of the CURRENT live build (own headless Chrome, port 9361). Usage: node audit.mjs [baseUrl]
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const base = process.argv[2] || 'http://localhost:5199';
const PORT = 9361; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'hl-aud-'))}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
const shot = async (n) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(HERE, 'audit', n + '.png'), Buffer.from(r.data, 'base64')); console.log('shot', n); };
async function load(w, h, mobile, q) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + '/' + q });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app&&window.__app.ui)')) break; } catch {} }
  await sleep(1200);
}
const STAGE = `(()=>{const a=window.__app,s=a.sim,d=s.data||a.data;const st=(w,stat,rank,x={})=>({key:'s:'+w+':'+stat,kind:'stat',weaponId:w,stat,rank,nextRank:rank+1,maxRank:5,title:'',desc:'',color:'#fff',...x});
const evo=(w,e)=>({key:'e:'+e,kind:'evolution',weaponId:w,evoId:e,title:d.evolutions[e].name,desc:d.evolutions[e].desc,badge:'EVOLVE',from:d.weapons[w].name});
const wpn=(id)=>({key:'w:'+id,kind:'weapon',weaponId:id,title:d.weapons[id].name,desc:d.weapons[id].desc,badge:'NEW'});
const bl=(id,r)=>{const b=d.blessings.items[id];return{key:'b:'+id,kind:'blessing',blessId:id,effect:b.effect,title:b.name,desc:b.desc,rank:r,nextRank:r+1,maxRank:b.ranks,color:'#e8d9a8'}};
s.pending=1;s.xp=0;if(s.state!=='levelup')s.beginLevelUp();s.offer={gold:[evo('ghost_wolves','phantom_stampede')],cards:[st('holy_orbit','radius',2,{stirs:true}),wpn('spirit_bolts'),bl('dawnlit_soles',0),bl('wrapped_warmth',1)]};a.ui.showLevelUp(s);return 1})()`;
const sizes = [['desk', 1280, 720, false], ['land', 844, 390, true], ['port', 390, 844, true]];
for (const [tag, w, h, m] of sizes) {
  const t = m ? '&touch=1' : '';
  await load(w, h, m, '?meta=half'); await shot(`title-${tag}`);
  await load(w, h, m, '?auto=wren&seed=1&god=1&rr=2&ban=1' + t);
  await ev(STAGE); await sleep(900); await shot(`levelup-${tag}`);
  await ev('window.__app.ui.hideAll&&window.__app.ui.hideAll();window.__app.togglePause();1'); await sleep(500); await shot(`pause-${tag}`);
  await ev('window.__app.ui.showSettings();1'); await sleep(500); await shot(`settings-${tag}`);
  await load(w, h, m, '?meta=half'); await ev('window.__app.openTree();1'); await sleep(1200); await shot(`tree-${tag}`);
  await load(w, h, m, '?auto=wren&seed=1&god=1&t=60' + t);
  try { await ev(`(()=>{const a=window.__app,s=a.sim;s.state='dead';const b={gold:120,shards:3,newly:[],closest:[]};a.ui.showEnd(s,a.save.bankRun?{gold:120,shards:3,newly:[],closest:[]}:b);return 1})()`); await sleep(700); await shot(`results-${tag}`); } catch (e) { console.log('results fail', e.message); }
}
ws.close(); proc.kill();
