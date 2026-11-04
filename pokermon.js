'use strict';
/* ============ ALL IN — the collector outside the pawn shop ============
   Three times a run (before rounds 8, 17 and 25) a collector in a loud shirt waits by the pawn shop door with a
   binder under his arm and offers a creature trade. The first time he lets slip a word he really shouldn't, and a
   lawyer comes sprinting down the pavement; he bolts, calling back to look after his old creature, he'll be back.
   He is. He's more careful. Mostly. And the first time two of the same creature merge, someone gets a little
   over-excited about what to call it. Shh. */
HIDDEN_ACH.pokermon=['Gotta Trade \'Em All','Meet the collector outside the pawn shop.','sparkles','Someone by the pawn shop collects creatures. He is not supposed to call them that.'];
ACH.pokermon=HIDDEN_ACH.pokermon.slice(0,3);
const TRADE_ROUNDS=[8,17,25];
const pkmSave=()=>{try{localStorage.setItem('allin-meta',JSON.stringify(Meta.data));}catch(e){}};
function traderSpot(){const o=OBST.find(o=>o.k==='pawn');return {x:(o.c+1.2)*TILE,y:(o.r+o.h)*TILE+12};}
const tradeName=k=>UNITS[k]?UNITS[k].name.replace(/^The /,''):'?';
const handRank=u=>u.def.merge?Math.min(8,4+(u.def.tier||1)*2):(u.def.hand||0);
// what he asks for (one of your humbler creatures) and what he offers (something a couple of hands better, ideally one you've never had)
function tradeOffer(){const mine=G.units.filter(u=>!u.dead&&!u.temp&&!u.def.hidden&&!u.def.sig&&!u.def.secret&&!u.def.bonus);if(!mine.length)return null;
  mine.sort((a,b)=>handRank(a)-handRank(b));const give=mine[Math.floor(Math.random()*Math.min(3,mine.length))],r0=handRank(give);
  const pool=Object.keys(UNITS).filter(k=>{const d=UNITS[k];return !d.merge&&!d.hidden&&!d.sig&&!d.secret&&!d.bonus&&k!=='rf'&&d.hand>=Math.min(7,r0+2)&&d.hand<=Math.min(8,r0+3)&&k!==give.k;});
  if(!pool.length)return null;const fresh=pool.filter(k=>!(Meta.data&&Meta.data.seen&&Meta.data.seen[k]));const list=fresh.length?fresh:pool;
  return {give:give.id,giveK:give.k,get:list[Math.floor(Math.random()*list.length)]};}
const TRADE_LINES=[
  o=>`“Psst. Over here. Collector. Your <b>${tradeName(o.giveK)}</b> for my <b>${tradeName(o.get)}</b>? Mint condition. Rarest Pokér— …rarest <i>creature</i> on the Strip.”`,
  o=>`“Is he gone? …Right. Your <b>${tradeName(o.giveK)}</b> for my <b>${tradeName(o.get)}</b>. And I said <i>creature</i>. Everybody heard me say creature.”`,
  o=>`“Last trade, I promise. Gotta trade 'em a— no. Just this one. Your <b>${tradeName(o.giveK)}</b> for my <b>${tradeName(o.get)}</b>.”`];
{const _sh=startHand;startHand=function(){_sh.apply(this,arguments);if(!G||G.mp||G.over)return;const w=G.wave+1,i=TRADE_ROUNDS.indexOf(w);if(i<0||(G.trades||{})[w])return;
  const o=tradeOffer();(G.trades=G.trades||{})[w]={w,i,state:o?'offer':'gone',...(o||{})};
  if(!o)return;const sp=traderSpot();G.trader={x:sp.x,y:sp.y,mode:'wait',t0:G.time,i};
  gameLog(i?'The collector is back outside the pawn shop, looking over his shoulder.':'A collector with a binder is waiting outside the pawn shop.','good');Snd.play('windup');tradeUI();};}
function tradeUI(){let el=$('#trade');const T=G&&G.trades&&Object.values(G.trades).find(d=>d.state==='offer'&&d.w===G.wave+1&&G.phase!=='wave');
  if(!T){if(el)el.classList.remove('show');return;}
  if(!el){el=document.createElement('div');el.id='trade';$('#boardWrap').appendChild(el);}
  const give=G.units.find(u=>u.id===T.give&&!u.dead);if(!give){const o=tradeOffer();if(!o){T.state='gone';traderLeave(false);el.classList.remove('show');return;}Object.assign(T,o);}
  el.innerHTML=`<div class="dl"><div class="dlh"><canvas id="trPor" width="88" height="88"></canvas><div><small>The collector outside the pawn shop</small><p>${TRADE_LINES[T.i](T)}</p></div></div>
    <div class="trs"><span><canvas data-k="${T.giveK}"></canvas>${tradeName(T.giveK)}</span><b>⇄</b><span><canvas data-k="${T.get}"></canvas>${tradeName(T.get)}</span></div>
    <div class="dlb"><button class="pb main" id="trYes">Trade</button><button class="pb" id="trNo">No thanks</button></div><small class="dln">Decide before the round starts.</small></div>`;
  el.classList.add('show');traderPortrait($('#trPor'));el.querySelectorAll('.trs canvas').forEach(c=>portrait(c,c.dataset.k,26));
  $('#trYes').onclick=()=>tradeDo(T,true);$('#trNo').onclick=()=>tradeDo(T,false);}
function tradeDo(T,yes){if(T.state!=='offer')return;T.state=yes?'traded':'declined';
  if(yes){const u=G.units.find(o=>o.id===T.give&&!o.dead);if(u){u.dead=true;u.noKO=true;for(let i=0;i<10;i++)spark(u.x,u.y,'#fde68a',80,.4);
      const sp=traderSpot(),n=makeUnit(T.get,sp.x+14,sp.y+18);n.spawnT=.3;n.popAt=G.time;G.fx.push({t:'ring',x:n.x,y:n.y,r0:4,r1:40,col:'#fde68a',life:.5,max:.5,w:3});
      if(typeof Meta!=='undefined')Meta.seen(T.get);Snd.play('coin');gameLog(`You traded your ${tradeName(T.giveK)} for the collector's ${tradeName(T.get)}.`,'good');}}
  else{Snd.play('click');gameLog('You turned the collector down. He tucks the binder back under his arm.','');}
  traderLeave(T.i!==1,T.i);$('#trade')&&$('#trade').classList.remove('show');}
// he goes; on his first and last visits, the lawyer is already on his way
function traderLeave(chased,i){const tr=G.trader;if(!tr||tr.mode!=='wait')return;tr.mode='leave';tr.t0=G.time;tr.say=['Look after him! I\'ll be back!','Look after him.','Worth it!'][i||0];
  if(chased){G.lawyer={t0:G.time-.25,y:tr.y+6,chase:true};Snd.play('whistle');
    setTimeout(()=>{if(G&&G.lawyer)floatText(tr.x-50,tr.y+34,'OBJECTION!','#fde68a',14);},350);
    if(typeof Meta!=='undefined'&&Meta.data&&!Meta.data.ach.pokermon){setTimeout(()=>{if(typeof Meta!=='undefined')Meta.ach('pokermon');},2200);}}
  floatText(tr.x+20,tr.y+24,tr.say,'#fde047',12);}
{const _sw=startWave;startWave=function(){const T=G.trades&&G.trades[G.wave+1];if(T&&T.state==='offer'){T.state='declined';traderLeave(T.i!==1,T.i);}_sw.apply(this,arguments);tradeUI();};}
{const _st=syncTop;syncTop=function(){_st.apply(this,arguments);if(!G)return;const sig=G.wave+'|'+G.phase+'|'+JSON.stringify(G.trades||{});if(sig!==tradeUI.sig){tradeUI.sig=sig;tradeUI();}};}

/* ---------- the collector and the lawyer ---------- */
function drawCollector(c,x,y,t,s,run){c.save();c.translate(x,y);c.scale(s,s);const st=run?Math.sin(t*26):0;
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,15,8,2.6,0,0,TAU);c.fill();
  c.fillStyle='#d6c7a1';c.fillRect(-3.4+st*2,4,2.6,11);c.fillRect(.9-st*2,4,2.6,11);c.fillStyle='#3f2a17';c.fillRect(-3.8+st*2,14,3.4,1.6);c.fillRect(.6-st*2,14,3.4,1.6);
  // a loud shirt
  c.fillStyle='#0d9488';c.beginPath();c.moveTo(-6.5,6);c.lineTo(-6,-6);c.quadraticCurveTo(0,-8.5,6,-6);c.lineTo(6.5,6);c.closePath();c.fill();
  c.fillStyle='#fde047';for(const [fx,fy] of [[-3.5,-3],[2.5,-4],[-1,1],[3.5,2],[-4,4]]){c.beginPath();c.arc(fx,fy,1.1,0,TAU);c.fill();}c.fillStyle='#f472b6';for(const [fx,fy] of [[0,-4.6],[-3,2.4],[4.4,-1]]){c.beginPath();c.arc(fx,fy,.8,0,TAU);c.fill();}
  // the binder under his arm
  c.fillStyle='#1d4ed8';c.fillRect(4,-3,4.4,6.4);c.fillStyle='#93c5fd';c.fillRect(4.6,-2.4,3.2,1.2);c.fillStyle='#fde047';c.fillRect(4.6,-.6,1.4,1.8);c.fillRect(6.4,-.6,1.4,1.8);
  // head: sunglasses on his forehead, a twitchy grin
  c.fillStyle='#e8c9a4';c.beginPath();c.arc(0,-10.5,3.6,0,TAU);c.fill();c.fillStyle='#6b4423';c.beginPath();c.ellipse(-.4,-13,3.6,1.6,0,Math.PI,0);c.fill();
  c.fillStyle='#111827';c.fillRect(-3,-13.4,2.4,1.1);c.fillRect(.6,-13.4,2.4,1.1);c.fillRect(-.6,-13.1,1.2,.5);
  c.fillStyle='#0b0612';c.beginPath();c.arc(-1.3,-10.6,.55,0,TAU);c.arc(1.5,-10.6,.55,0,TAU);c.fill();c.strokeStyle='#0b0612';c.lineWidth=.6;c.beginPath();c.arc(.2,-9,1.4,.2,Math.PI-.2);c.stroke();
  if(run){c.fillStyle='rgba(255,255,255,.7)';for(let k=0;k<3;k++){c.fillRect(-10-k*4,-6+k*3,3,.8);}}
  c.restore();}
function traderPortrait(cv){if(!cv)return;const c=cv.getContext('2d');c.clearRect(0,0,88,88);const g=c.createRadialGradient(44,40,4,44,44,60);g.addColorStop(0,'#183a3a');g.addColorStop(1,'#120c19');c.fillStyle=g;c.fillRect(0,0,88,88);drawCollector(c,44,54,performance.now()/1000,3,false);}
function drawLawyer(c,x,y,k,s){const step=Math.sin(k*28);c.save();c.translate(x,y);c.scale(s,s);
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,10,7,2.4,0,0,TAU);c.fill();
  c.strokeStyle='#1f2937';c.lineWidth=2.4;c.lineCap='round';c.beginPath();c.moveTo(-1.5,3);c.lineTo(-1.5-step*4,9.5);c.moveTo(1.5,3);c.lineTo(1.5+step*4,9.5);c.stroke();
  c.fillStyle='#4b5563';c.beginPath();c.roundRect?c.roundRect(-4,-5,8,9,2):c.rect(-4,-5,8,9);c.fill();c.fillStyle='#f5f5f4';c.beginPath();c.moveTo(-1.5,-5);c.lineTo(0,-1);c.lineTo(1.5,-5);c.fill();c.fillStyle='#dc2626';c.fillRect(-.6,-4.2,1.2,4);
  c.fillStyle='#e8c9a4';c.beginPath();c.arc(.5,-8.5,3.4,0,TAU);c.fill();c.fillStyle='#374151';c.beginPath();c.ellipse(.2,-11,3.4,1.5,0,Math.PI,0);c.fill();
  c.fillStyle='#0b0612';c.beginPath();c.arc(1.8,-8.8,.6,0,TAU);c.fill();
  c.strokeStyle='#4b5563';c.lineWidth=1.8;c.beginPath();c.moveTo(-3.5,-3);c.lineTo(-5,2+step);c.stroke();c.fillStyle='#78350f';c.fillRect(-8,2+step,6,4.5);c.fillStyle='#fbbf24';c.fillRect(-5.5,2.8+step,1,1);
  c.strokeStyle='#4b5563';c.beginPath();c.moveTo(3.5,-3);c.lineTo(6,-11);c.stroke();c.save();c.translate(6.5,-15+Math.sin(k*20)*.8);c.rotate(.15+Math.sin(k*20)*.12);
  c.fillStyle='#fefce8';c.fillRect(-5,-4,10,7);c.strokeStyle='#a8a29e';c.lineWidth=.4;c.strokeRect(-5,-4,10,7);c.fillStyle='#b91c1c';c.font='bold 2.6px Barlow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('CEASE &',0,-1.6);c.fillText('DESIST',0,1.2);c.restore();
  c.restore();}
{const _g=drawGroundWarn;drawGroundWarn=function(c,t){_g(c,t);if(!G)return;const tr=G.trader;
  if(tr){if(tr.mode==='wait'){drawCollector(c,tr.x,tr.y,t,1.2,false);const p=.5+.5*Math.sin(t*4);c.save();c.fillStyle=`rgba(253,224,71,${.12+.1*p})`;c.beginPath();c.ellipse(tr.x,tr.y+17,13,4.5,0,0,TAU);c.fill();c.restore();}
    else{const k=G.time-tr.t0,x=tr.x+k*230;if(x>W+40)G.trader=null;else drawCollector(c,x,tr.y,t,1.2,true);}}
  const L=G.lawyer;if(L){const k=G.time-L.t0,sp=traderSpot(),x=sp.x-260+k*250;if(x>W+40)G.lawyer=null;else drawLawyer(c,x,L.y,k,1.5);}};}

// "What? CHIP MITE is evolving!" ...it's merging. It's called merging. Once, ever.
{const _mu=mergeUnits;mergeUnits=function(a,b){const same=a&&b&&a.k===b.k,name=a&&UNITS[a.k]?UNITS[a.k].name:'',seen=typeof Meta!=='undefined'&&Meta.data&&Meta.data.pkmEvo;
  const u=_mu.apply(this,arguments);
  if(u&&same&&!seen){if(typeof Meta!=='undefined'&&Meta.data){Meta.data.pkmEvo=1;pkmSave();}
    floatText(u.x,u.y-u.r*2.6-20,`What? ${name.toUpperCase()} is evolving!`,'#fde047',13);
    setTimeout(()=>{if(G&&!u.dead)floatText(u.x,u.y-u.r*2.6-6,'…merging. It\'s called merging.','#e5e7eb',11);},1300);}
  return u;};}

{const st=document.createElement('style');st.textContent=`
#trade{position:absolute;left:50%;bottom:14px;z-index:8;width:410px;margin-left:-205px;opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s;pointer-events:none}
#trade.show{opacity:1;transform:none;pointer-events:auto}
#trade .dl{padding:11px 13px;border-radius:12px;background:rgba(10,20,22,.95);box-shadow:0 0 0 1.5px #0d9488,0 0 22px rgba(13,148,136,.35),0 10px 30px rgba(0,0,0,.6);color:#e7f5f2;font:400 12.5px/1.4 var(--body,Barlow),sans-serif}
#trade .dlh{display:flex;gap:10px;align-items:center}#trade #trPor{width:52px;height:52px;border-radius:9px;flex:none}#trade small{font:400 10px var(--head);color:#5eead4;letter-spacing:.05em;text-transform:uppercase}
#trade p{margin:3px 0 0}#trade p b{color:#fde68a}#trade .dlb{display:flex;gap:6px;margin-top:9px}#trade .pb{height:28px;margin:0;flex:1}#trade .dln{display:block;margin-top:5px;text-align:center;color:#94a3b8;text-transform:none;letter-spacing:0}
#trade .trs{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:8px;font-size:12px;color:#cbd5e1}#trade .trs span{display:flex;align-items:center;gap:4px}#trade .trs canvas{width:26px;height:26px}#trade .trs b{color:#5eead4;font-size:15px}`;
document.head.appendChild(st);}
