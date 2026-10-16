// Take-agnostic layout for all screens at 1280x720 (desktop), 844x390 (landscape phone), 390x844 (portrait phone).
// Materials/colours live in t1/t2/t3.mjs. Phones: key hints hidden (touch), 44px+ targets, text >= 12px.
import { POR_CSS } from './lib.mjs';
export const BASE = `
*{box-sizing:border-box;margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:#141a26}
button{font:inherit;color:inherit;background:none;border:0;text-align:left;cursor:pointer}a{color:inherit}
.scr{position:relative;width:100vw;height:100vh;overflow:hidden;color:var(--ink);font-family:var(--body);font-size:16px;line-height:1.3}
.bg{position:absolute;inset:0;background:url(frames/bg-1280x720.jpg) center/cover;filter:brightness(.82)}
.bg.soft{filter:blur(1.5px) brightness(.6) saturate(.85)}.bg.dim{filter:blur(2.5px) brightness(.5) saturate(.75)}
.veil{position:absolute;inset:0;background:radial-gradient(ellipse 70% 70% at 50% 45%,rgba(12,16,28,.05),rgba(10,13,22,.72))}
.veil.dim{background:radial-gradient(ellipse 80% 80% at 50% 45%,rgba(12,16,28,.35),rgba(8,10,18,.82))}
.frame{position:absolute;inset:0;pointer-events:none;border-radius:inherit}
${POR_CSS}
.kick{font:700 13px/1.2 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--kick)}
.h1{font-family:var(--display);font-weight:var(--dw);font-size:44px;line-height:1.05;color:var(--ink);text-wrap:balance}
.h2{font-family:var(--display);font-weight:var(--dw);font-size:28px;line-height:1.1}
.lead,.wh,.stir,.tag,.ep,.gift{font-family:var(--whisper);font-style:var(--wst)}
.lead{font-size:19px;color:var(--ink2);margin-top:6px}
kbd{font:700 12px/1 var(--body);padding:5px 7px;border-radius:7px;flex:none}
.pips{display:inline-flex;align-items:center;gap:6px;position:relative;flex:none}.pips>i{flex:none}
.btn{position:relative;display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 16px 8px 14px;width:100%}
.btn .bt{display:flex;flex-direction:column;flex:1;min-width:0}.btn .lbl{font-family:var(--display);font-weight:var(--dw);font-size:22px;line-height:1.1}
.btn .wh{font-size:15px;line-height:1.2;opacity:.92}.btn kbd{margin-left:auto}
/* title */
.lay-title{position:absolute;inset:0;display:grid;grid-template-rows:auto 1fr auto;justify-items:center;padding:46px 24px 16px}
.brand{text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}.brand .wm{width:min(780px,86vw);height:auto}
.tag{font-size:26px;color:var(--ink2);margin-top:-4px}
.menu{display:flex;flex-direction:column;gap:14px;width:410px;align-self:center}
.foot{display:flex;gap:18px;font-size:13px;color:var(--ink3);width:100%;justify-content:space-between;padding:0 8px}.foot a{text-decoration:underline;text-underline-offset:3px}
/* hero */
.lay-hero{position:absolute;inset:0;display:grid;grid-template-rows:auto 1fr auto;padding:26px 48px 22px;gap:10px}
.sh{text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.heroes{display:flex;gap:40px;justify-content:center;align-items:center}
.hcard{position:relative;width:540px;padding:26px 24px 20px}.hwrap{display:flex;gap:18px;align-items:center}
.hcard .por{--s:1.32}.hinfo{flex:1;display:flex;flex-direction:column;gap:7px;min-width:0}
.hcard .nm{font-family:var(--display);font-weight:var(--dw);font-size:40px;line-height:1}.ep{font-size:19px;color:var(--ink2);margin-top:-4px}
.hcard .desc{font-size:15px;color:var(--ink2)}.stat{display:flex;align-items:center;gap:12px;font:700 13px var(--body);letter-spacing:.1em;text-transform:uppercase;color:var(--kick)}.stat span{width:58px}
.kit{display:flex;flex-direction:column;gap:4px;font-size:15px}.kit span{display:flex;align-items:center;gap:8px}.gift{font-size:16px;color:var(--accent)}
.wickst{display:flex;align-items:center;gap:6px;font:700 12px var(--body);letter-spacing:.12em;text-transform:uppercase;color:var(--kick)}
.bar{display:flex;justify-content:center;gap:18px}.bar .btn{width:260px}.bar .btn.primary{width:340px}
/* level-up */
.lay-lvl{position:absolute;inset:0;display:grid;grid-template-rows:auto 1fr auto auto;justify-items:center;padding:22px 24px 18px;gap:10px}
.sub{font:700 14px var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--kick);margin-top:4px}
.cards{display:flex;gap:30px;align-items:stretch;justify-content:center;padding-top:40px}
.card{position:relative;width:262px;display:flex;flex-direction:column;align-items:center;text-align:center;padding:30px 18px 18px}
.medal{width:84px;height:84px;border-radius:50%;display:grid;place-items:center;flex:none;position:relative}
.cbody{display:flex;flex-direction:column;align-items:center;gap:3px;margin-top:8px}
.ctype{font:700 12px var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--kick)}
.card .nm{font-family:var(--display);font-weight:var(--dw);font-size:27px;line-height:1.05}
.big{font:800 46px/1 var(--num);letter-spacing:-.01em;margin-top:2px}.unit{font-size:14px;color:var(--ink2);margin-bottom:5px}
.card .desc{font-size:15px;margin-top:7px;color:var(--ink)}.stir{font-size:16px;color:var(--gold);margin-top:3px}.from{font-size:13px;color:var(--ink3);margin-top:3px}
.ck{position:absolute;top:10px;right:12px}
.blessrow{width:min(860px,94vw);display:flex;flex-direction:column;gap:8px}.bls{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.bless{position:relative;display:flex;align-items:center;gap:12px;min-height:58px;padding:8px 14px}.bless .bt{display:flex;flex-direction:column;flex:1}
.bn{font-family:var(--display);font-weight:var(--dw);font-size:20px}.bl{font-size:14px;color:var(--ink2)}
.pills{display:flex;gap:16px}.pill{position:relative;display:flex;align-items:center;gap:8px;min-height:46px;padding:6px 16px;font:700 14px var(--body);letter-spacing:.1em;text-transform:uppercase}
/* pause */
.lay-pause{position:absolute;inset:0;display:grid;place-items:center;padding:20px}
.pp{width:560px}.pp .pin{padding:44px 40px 30px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px}
.runline{display:flex;gap:20px;align-items:center;font-size:15px;color:var(--ink2);margin:6px 0 10px}.runline b{color:var(--ink);font-family:var(--num);font-size:18px}.rl-w{display:flex;align-items:center;gap:6px}
.pbtns{display:flex;flex-direction:column;gap:12px;width:100%}
/* results (locked one-screen layout) */
.lay-res{position:absolute;inset:0;display:grid;grid-template-columns:480px 1fr;grid-template-rows:1fr auto;gap:14px 26px;padding:20px 40px 16px}
.rleft{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px}.rleft .lantern{height:auto}
.rt{font-size:56px}.rleft .lead{font-size:20px;max-width:420px}
.rp .pin{padding:20px 26px;display:flex;flex-direction:column;gap:10px}
.rtime{display:flex;align-items:baseline;gap:14px}.rtime b{font:800 66px/0.9 var(--num)}.rtime span{font:700 14px var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--kick)}
.rnear{font-size:17px}.rnear b{font-family:var(--num)}
.arc{position:relative;height:12px;border-radius:8px}.arcfill{position:absolute;left:0;top:0;bottom:0;border-radius:8px}.arc i{position:absolute;top:50%;transform:translate(-50%,-50%)}
.arcl{display:flex;justify-content:space-between;font-size:13px;color:var(--ink3);margin-top:-4px}
.chips,.bank{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.bank{grid-template-columns:1fr 1fr}
.chip{position:relative;padding:8px 14px;display:flex;flex-direction:column;gap:2px}.chip span{font:700 12px var(--body);letter-spacing:.12em;text-transform:uppercase;color:var(--kick)}
.chip b{font:800 30px/1.05 var(--num);display:flex;align-items:center;gap:8px}.chip b.none{font-family:var(--display);font-weight:var(--dw);font-size:26px;color:var(--ink2)}.chip small{font-size:13px;color:var(--ink3)}
.share{display:flex;flex-direction:column;gap:6px}.sr{display:grid;grid-template-columns:26px 160px 1fr 48px;align-items:center;gap:10px;font-size:16px}.sr i,.unl i{height:9px;border-radius:6px;position:relative;overflow:hidden;display:block}.sr u,.unl u{position:absolute;inset:0 auto 0 0;border-radius:6px}.sr em{font-style:normal;text-align:right;font-family:var(--num)}
.unl{display:flex;flex-direction:column;gap:6px;font-size:16px}
.rp{align-self:center}.rbar .dot .lbl::after{content:"";display:inline-block;margin-left:10px;width:11px;height:11px;border-radius:50%;background:var(--new,#6fd3c5);box-shadow:0 0 10px var(--new,#6fd3c5);vertical-align:middle}
.rbar{grid-column:1/3;display:flex;justify-content:center;gap:20px}.rbar .btn{width:250px}.rbar .btn.primary{width:420px}
/* kit sheet */
.lay-kit{position:absolute;inset:0;padding:16px 28px;display:flex;flex-direction:column;gap:6px}
.k-head{display:flex;justify-content:space-between;align-items:center;gap:20px}.k-head .lead{font-size:16px;max-width:560px}.k-head .h1{font-size:38px}
.k-grid{display:grid;grid-template-columns:330px 380px 1fr;gap:26px;flex:1;min-height:0}.k-col{display:flex;flex-direction:column;gap:10px;min-width:0}
.k-lab{font:700 12px var(--body);letter-spacing:.12em;text-transform:uppercase;color:var(--kick)}.k-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.cap{font-size:13px;color:var(--ink2)}
.k-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.kp{margin-top:22px}.kp .pin{padding:30px 22px 18px;display:flex;flex-direction:column;gap:8px}.kp .desc{font-size:14px;color:var(--ink2)}
.k-cards{flex-direction:row;gap:18px;align-items:flex-start;padding-top:22px}.k-cards .card{width:236px}.k-cards .card .desc{font-size:14px}
.btn.dis{opacity:.45;filter:grayscale(.7)}

/* ---------- landscape phone 844x390 ---------- */
@media (max-height:460px){
 .bg{background-image:url(frames/bg-844x390.jpg)} kbd{display:none}
 .h1{font-size:28px}.lead{font-size:15px}.kick{font-size:12px}
 .btn{min-height:46px;padding:5px 12px}.btn .lbl{font-size:18px}.btn .wh{font-size:13px}
 .lay-title{grid-template-columns:1.15fr 1fr;grid-template-rows:1fr auto;align-items:center;padding:14px 28px 8px;gap:0 26px}
 .brand .wm{width:100%}.brand{width:100%}.tag{font-size:19px}.menu{width:100%;gap:9px}.foot{grid-column:1/3;font-size:12px}
 .lay-hero{padding:8px 26px 10px;gap:4px}.sh .kick,.sh .div{display:none}.heroes{gap:18px}
 .hcard{width:380px;padding:14px 14px 10px}.hcard .por{--s:.78}.hwrap{gap:10px}.hinfo{gap:3px}.hcard .nm{font-size:26px}.ep{font-size:15px}
 .hcard .desc,.gift{display:none}.stat{font-size:12px}.kit{font-size:13px}.kit .pic{width:20px;height:20px}
 .bar .btn{width:200px}.bar .btn.primary{width:260px}
 .lay-lvl{padding:8px 16px 8px;gap:5px}.sub{font-size:12px;margin-top:0}.sh{gap:0}
 .cards{gap:14px;padding-top:12px}.card{width:244px;padding:14px 12px 10px}.medal{width:54px;height:54px}.medal .pic{width:34px;height:34px}
 .cbody{margin-top:2px;gap:1px}.card .nm{font-size:19px}.big{font-size:28px}.unit{font-size:12px;margin-bottom:2px}.card .desc,.from{display:none}.stir{font-size:13px}
 .blessrow{gap:3px}.bhead{display:none}.bls{gap:12px}.bless{min-height:44px;padding:4px 12px}.bn{font-size:16px}.bl{font-size:12px}.bless .pic{width:24px;height:24px}
 .pill{min-height:44px;padding:4px 14px;font-size:12px}
 .pp{width:640px}.pp .pin{padding:20px 26px 14px;gap:2px}.pp .lead{margin-top:0}.runline{margin:2px 0 6px;gap:14px;font-size:13px}.pbtns{flex-direction:row;gap:10px}.pbtns .wh{display:none}
 .lay-res{grid-template-columns:250px 1fr;padding:8px 18px 8px;gap:6px 14px}.rleft{gap:2px}.rleft .lantern{width:52px}.rt{font-size:27px}.rleft .lead{font-size:14px}
 .rp .pin{padding:10px 16px;gap:5px}.rtime b{font-size:38px}.rtime span{font-size:12px}.rnear{font-size:14px}.arc{height:9px}.arcl,.s3,.chip small{display:none}
 .chips,.bank{gap:8px}.chip{padding:4px 10px}.chip b{font-size:21px}.chip b.none{font-size:19px}.chip b .pic{width:20px;height:20px}
 .sr{grid-template-columns:20px 120px 1fr 40px;font-size:13px;gap:8px}.sr .pic{width:18px;height:18px}.share{gap:3px}.unl{font-size:13px;gap:3px}
 .rbar{gap:12px}.rbar .btn{width:200px}.rbar .btn.primary{width:290px}
}
/* ---------- portrait phone 390x844 ---------- */
@media (max-aspect-ratio:3/4){
 .bg{background-image:url(frames/bg-390x844.jpg)} kbd{display:none}
 .h1{font-size:32px}.lead{font-size:16px}
 .btn{min-height:54px}.btn .lbl{font-size:20px}.btn .wh{font-size:14px}
 .lay-title{padding:70px 16px 14px;grid-template-rows:auto 1fr auto}.brand .wm{width:100%}.tag{font-size:21px}.menu{width:100%;align-self:end;margin-bottom:22px}.foot{font-size:12px}
 .lay-hero{padding:16px 16px 14px;gap:8px}.heroes{flex-direction:column;gap:16px}.hcard{width:100%;padding:16px 14px 12px}.hcard .por{--s:.84}
 .hcard .nm{font-size:30px}.ep{font-size:16px}.hcard .desc{font-size:14px}.gift{font-size:14px}.kit{font-size:14px}.kit .pic{width:22px;height:22px}
 .hcard .desc{display:none}.bar .btn .lbl{font-size:18px;white-space:nowrap}.bar{gap:10px}.bar .btn{width:auto;flex:1}.bar .btn.primary{width:auto;flex:2}
 .lay-lvl{padding:16px 14px 14px;gap:10px;grid-template-rows:auto auto auto auto;align-content:start}
 .cards{flex-direction:column;gap:12px;padding-top:6px;width:100%}
 .card{width:100%;display:grid;grid-template-columns:70px 1fr;align-items:center;text-align:left;padding:14px 14px 12px 14px;column-gap:12px}
 .medal{width:64px;height:64px}.medal .pic{width:38px;height:38px}.cbody{align-items:flex-start;margin-top:0;gap:1px}
 .card .nm{font-size:22px}.big{font-size:26px;margin-top:0}.unit{font-size:13px;margin-bottom:2px}.card .desc{font-size:14px;margin-top:3px}.stir{font-size:14px}.from{font-size:12px}
 .ctype{font-size:12px}.blessrow{width:100%}.bhead{display:none}.bls{grid-template-columns:1fr;gap:8px}.bless{min-height:52px}.bn{font-size:18px}
 .pp{width:100%}.pp .pin{padding:40px 20px 22px}.runline{flex-wrap:wrap;justify-content:center;gap:10px 16px}
 .lay-res{grid-template-columns:1fr;grid-template-rows:auto auto 1fr;padding:16px 14px 14px;gap:10px}
 .rleft{flex-direction:row;text-align:left;gap:10px;align-items:center}.rleft .lantern{width:66px}.rtx{display:flex;flex-direction:column;gap:2px}.rt{font-size:32px}.rleft .lead{font-size:15px}
 .rp .pin{padding:16px 16px;gap:9px}.rtime b{font-size:52px}.chips{gap:8px}.bank{gap:8px}.chip{padding:6px 10px}.chip b{font-size:24px}.chip b.none{font-size:22px}
 .sr{grid-template-columns:22px 118px 1fr 40px;font-size:15px}.s3{display:none}.arcl{font-size:12px}
 .rbar{grid-column:1;display:grid;grid-template-columns:1fr 1fr;gap:10px;align-self:end}.rbar .btn{width:auto}.rbar .btn.primary{grid-column:1/3;grid-row:1;width:auto}
}`;
