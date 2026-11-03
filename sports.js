'use strict';
/* ============ ALL IN — Sports Night: casinos play each other, everyone bets, winners take a creature ============ */
const SPORTS_AT={12:1,22:1,32:1};
const SB_T={intro:3,bet:25,play:12,steal:16,done:7};
const SPORTS=['Street Brawl','Chip Hockey','Dice Derby','Card Toss','Bumper Cars','Neon Dodgeball'];
const sbId=p=>p.gi!=null?p.gi:G.players.indexOf(p);
const sbP=id=>G.mp&&G.byGi?G.byGi[id]:G.players[id];
const sbMe=()=>G.mp?G.me.gi:0;
function unitVal(k,rank){return unitDps(k)*(1+UNITS[k].hp/900)*(1+.15*(rank||0));}
function sbStrength(p){if(p.human)return Math.max(5,armyPower()*.45);if(p.remote)return Math.max(5,(p.power||0)*.45);return Math.max(5,p.power||0);}
function myRoster(){return G.units.filter(u=>!u.temp&&!u.def.hidden).sort((a,b)=>unitVal(b.k,b.rank)-unitVal(a.k,a.rank)).slice(0,16).map(u=>[u.id,u.k,u.rank||0]);}
function aiRoster(p,w){const pool=Object.keys(UNITS).filter(k=>{const d=UNITS[k];return !(d.hidden||d.secret||d.sig||d.bonus);});
  const target=Math.max(40,(p.power||40)/.45),per=target/6,out=[];let id=-1000-sbId(p)*20;
  if(p.lastUnit&&UNITS[p.lastUnit]&&!UNITS[p.lastUnit].hidden&&unitVal(p.lastUnit,0)<per*2.2)out.push([id--,p.lastUnit,0]);
  const near=pool.map(k=>[k,Math.abs(Math.log(unitVal(k,0)/per))]).sort((a,b)=>a[1]-b[1]).slice(0,10);
  while(out.length<6){const k=near[(Math.random()*near.length)|0][0];out.push([id--,k,Math.random()<.25?1:0]);}return out;}

/* ---------- the arena: a tiny deterministic fight between two line-ups ---------- */
const AR_W=440,AR_H=140,AR_DT=1/30,AR_MAX=30,AR_SPEED=1.7;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const AR_HANDICAP=.32;
function arenaInit(rosA,rosB,seed){const rng=mulberry(seed),U=[];const tv=r=>r.slice(0,6).reduce((a,[id,k,rk])=>a+unitVal(k,rk||0),0)||1,VA=tv(rosA),VB=tv(rosB),M=Math.sqrt(VA*VB),hcap=[Math.pow(M/VA,AR_HANDICAP)*Math.exp((rng()-.5)*1.1),Math.pow(M/VB,AR_HANDICAP)*Math.exp((rng()-.5)*1.1)];
  const add=(ros,side)=>{const list=ros.slice(0,6);list.forEach(([id,k,rk],i)=>{const d=UNITS[k],sp=d.sp||{};const hp=d.hp*(1+.15*(rk||0))*hcap[side];const dps=unitDps(k)*(1+.15*(rk||0))*hcap[side];
    const melee=d.kind==='melee'||d.kind==='roll'||(d.range||0)<40;
    U.push({id,k,side,rk:rk||0,hp,max:hp,dps,rate:Math.max(.4,d.rate||1),cd:rng()*.6,range:melee?Math.max(16,(d.range||16)*.6):Math.min(150,Math.max(60,(d.range||100)*.55)),melee,spd:Math.min(80,Math.max(28,(d.spd||60)*.5)),
      splash:sp.splash?sp.splash*.45:0,x:side?AR_W-36-rng()*20:36+rng()*20,y:16+(i+.5)*(AR_H-26)/Math.max(1,list.length)+(rng()-.5)*6,face:side?-1:1,atk:0,dead:false,walk:0});});};
  add(rosA,0);add(rosB,1);return {U,rng,t:0,shots:[],fx:[],done:false,win:null};}
function arenaStep(A){if(A.done)return;A.t+=AR_DT;const U=A.U;
  for(const u of U){if(u.dead)continue;u.atk=Math.max(0,u.atk-AR_DT*4);u.cd-=AR_DT;
    let tg=null,bd=1e9;for(const o of U){if(o.dead||o.side===u.side)continue;const dx=o.x-u.x,dy=o.y-u.y,d=Math.sqrt(dx*dx+dy*dy);if(d<bd){bd=d;tg=o;}}
    if(!tg)continue;u.face=tg.x>=u.x?1:-1;
    if(bd>u.range){const dx=tg.x-u.x,dy=tg.y-u.y;u.x+=dx/bd*u.spd*AR_DT;u.y+=dy/bd*u.spd*AR_DT;u.walk+=u.spd*AR_DT;}
    else if(u.cd<=0){u.cd=1/u.rate;u.atk=1;const roll=A.rng(),dmg=u.dps/u.rate*(roll<.12?0:roll>.9?2.2:.6+A.rng()*.8);if(roll<.12)A.fx.push({t:'miss',x:tg.x,y:tg.y,life:.4});
      const hit=o=>{o.hp-=dmg*(o===tg?1:.6);if(o.hp<=0&&!o.dead){o.dead=true;A.fx.push({t:'die',x:o.x,y:o.y,life:.6});}};
      hit(tg);if(u.splash)for(const o of U)if(!o.dead&&o!==tg&&o.side!==u.side){const dx=o.x-tg.x,dy=o.y-tg.y;if(dx*dx+dy*dy<u.splash*u.splash)hit(o);}
      if(u.melee)A.fx.push({t:'slash',x:tg.x,y:tg.y,life:.18});else A.shots.push({x:u.x,y:u.y-6,tx:tg.x,ty:tg.y-4,life:.2,max:.2,side:u.side});}}
  // light separation so they don't stack
  for(let i=0;i<U.length;i++){const a=U[i];if(a.dead)continue;for(let j=i+1;j<U.length;j++){const b=U[j];if(b.dead)continue;const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;if(d2<196&&d2>0){const d=Math.sqrt(d2),push=(14-d)/2;a.x-=dx/d*push;a.y-=dy/d*push;b.x+=dx/d*push;b.y+=dy/d*push;}}a.y=Math.max(12,Math.min(AR_H-8,a.y));a.x=Math.max(10,Math.min(AR_W-10,a.x));}
  A.shots=A.shots.filter(s=>(s.life-=AR_DT)>0);A.fx=A.fx.filter(f=>(f.life-=AR_DT)>0);
  const aliveA=U.some(u=>!u.dead&&u.side===0),aliveB=U.some(u=>!u.dead&&u.side===1);
  if(!aliveA||!aliveB||A.t>=AR_MAX){A.done=true;if(aliveA&&!aliveB)A.win=0;else if(aliveB&&!aliveA)A.win=1;else{const f=s=>U.filter(u=>u.side===s).reduce((a,u)=>a+Math.max(0,u.hp)/u.max,0);A.win=f(0)>=f(1)?0:1;}}}
function arenaRun(rosA,rosB,seed){if(!rosA.length&&!rosB.length)return {win:seed%2,t:1};if(!rosA.length)return {win:1,t:1};if(!rosB.length)return {win:0,t:1};
  const A=arenaInit(rosA,rosB,seed);let g=0;while(!A.done&&g++<AR_MAX/AR_DT+5)arenaStep(A);return {win:A.win,t:A.t};}
function arenaOdds(rosA,rosB){let wa=0;const N=20;for(let k=0;k<N;k++){if(arenaRun(rosA,rosB,9001+k*7919).win===0)wa++;}const pa=clamp((wa+1)/(N+2),.1,.9);
  return {pa,oa:Math.max(1.05,Math.round(.92/pa*10)/10),ob:Math.max(1.05,Math.round(.92/(1-pa)*10)/10)};}
function drawArena(cv,A,g){const c=cv.getContext('2d');c.setTransform(cv.width/AR_W,0,0,cv.height/AR_H,0,0);
  c.fillStyle='#14301f';c.fillRect(0,0,AR_W,AR_H);c.fillStyle='#173a25';for(let k=0;k<8;k++)if(k%2)c.fillRect(k*AR_W/8,0,AR_W/8,AR_H);
  c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1.5;c.strokeRect(4,4,AR_W-8,AR_H-8);c.beginPath();c.moveTo(AR_W/2,4);c.lineTo(AR_W/2,AR_H-4);c.stroke();c.beginPath();c.arc(AR_W/2,AR_H/2,18,0,TAU);c.stroke();
  if(!A)return;const t=A.t;
  const list=A.U.slice().sort((a,b)=>a.y-b.y);
  for(const u of list){if(u.dead)continue;const s=unitSprite(u.k,frameOf(u.walk/30+t,u.id%7),u.atk>.5?1:0),sc=.9*Math.min(1,13/UNITS[u.k].r);
    c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(u.x,u.y+6,8,3,0,0,TAU);c.fill();
    blit(c,s,u.x+(u.atk>.6&&u.melee?u.face*3:0),u.y-4,sc*u.face,sc);
    const f=Math.max(0,u.hp/u.max);c.fillStyle='rgba(0,0,0,.7)';c.fillRect(u.x-10,u.y-24,20,3);c.fillStyle=u.side?'#f87171':'#60a5fa';c.fillRect(u.x-10,u.y-24,20*f,3);}
  for(const sh of A.shots){const k=1-sh.life/sh.max;c.fillStyle=sh.side?'#fca5a5':'#93c5fd';c.beginPath();c.arc(sh.x+(sh.tx-sh.x)*k,sh.y+(sh.ty-sh.y)*k,2.2,0,TAU);c.fill();}
  for(const f of A.fx){if(f.t==='miss'){c.fillStyle=`rgba(255,255,255,${f.life*2})`;c.font='700 9px Barlow,sans-serif';c.textAlign='center';c.fillText('miss',f.x,f.y-14-(.4-f.life)*20);}else if(f.t==='slash'){c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=1.5;c.beginPath();c.arc(f.x,f.y-4,7,-.8,.8);c.stroke();}else{c.fillStyle=`rgba(255,200,120,${f.life})`;c.beginPath();c.arc(f.x,f.y-4,10*(1-f.life),0,TAU);c.fill();}}
  if(A.done){c.fillStyle='rgba(0,0,0,.45)';c.fillRect(0,AR_H/2-14,AR_W,28);c.fillStyle='#fde68a';c.font='700 16px Barlow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(`FULL TIME · ${sbName(A.win?g.b:g.a)} win${sbName(A.win?g.b:g.a)==='You'?'':'s'}`,AR_W/2,AR_H/2);}}

/* ---------- the table: who plays whom (host or solo only) ---------- */
function sbSetup(w){const ps=G.players.filter(p=>p.alive).sort(()=>Math.random()-.5);
  const games=[];for(let i=0;i+1<ps.length;i+=2){const A=ps[i],B=ps[i+1],sa=Math.pow(sbStrength(A),1.4),sb=Math.pow(sbStrength(B),1.4);const pa=clamp(sa/(sa+sb),.08,.92);
    games.push({a:sbId(A),b:sbId(B),pa,oa:Math.max(1.05,Math.round(.92/pa*10)/10),ob:Math.max(1.05,Math.round(.92/(1-pa)*10)/10),sp:SPORTS[(Math.random()*SPORTS.length)|0],pre:1});}
  const bye=ps.length%2?sbId(ps[ps.length-1]):null;
  return {w,games,bye,stage:'intro',t:SB_T.intro,res:null,ros:{},out:null,seed:null};}
function sbParticipants(SB){const s=new Set();for(const g of SB.games){s.add(g.a);s.add(g.b);}return s;}
function sbGameOf(SB,id){return SB.games.findIndex(g=>g.a===id||g.b===id);}

/* ---------- local player state for the slip ---------- */
let SBL=null; // {w,picks:[],stake,lock,prot,take,applied}
function sbLocal(SB){if(!SBL||SBL.w!==SB.w){const ros=myRoster();SBL={w:SB.w,picks:SB.games.map(()=>-1),stake:25,lock:false,prot:ros.length?ros[0][0]:null,take:null,applied:false,paid:0};}return SBL;}
function sbPublish(){if(G.mp&&typeof publishG==='function'){NET.sbOut=SBL?{w:SBL.w,lock:SBL.lock?1:0,prot:SBL.prot,ros:myRoster(),take:SBL.take}:null;publishG(true);}}

/* ---------- stage machine (solo, or the host in multiplayer) ---------- */
function sbAuthority(){return !G.mp||NET.host;}
function sbRemote(id){const p=sbP(id);if(!p||!p.pid||typeof presOf!=='function')return null;const pr=presOf(p.pid);const g=pr&&pr.g;return g&&g.sb&&g.sb.w===NET.T.w?g.sb:null;}
function sbRosterOf(SB,id){const p=sbP(id);if(!p)return [];if(p.human)return myRoster();if(p.remote){const r=sbRemote(id);return r&&r.ros?r.ros:[];}return SB.aiRos&&SB.aiRos[id]||[];}
function sbProtOf(SB,id){const p=sbP(id);if(!p)return null;if(p.human)return SBL?SBL.prot:null;if(p.remote){const r=sbRemote(id);return r?r.prot:null;}const ros=SB.ros[id]||[];return ros.length?ros[(Math.random()*ros.length)|0][0]:null;}
function sbTakeOf(SB,i,id){const p=sbP(id);if(!p)return null;if(p.human)return SBL&&SBL.take!=null?SBL.take:null;if(p.remote){const r=sbRemote(id);return r&&r.take!=null?r.take:null;}return null;}
function sbTick(SB,dt){
  SB.t-=dt;
  if(SB.stage==='intro'){if(!SB.aiRos){SB.aiRos={};for(const p of G.players)if(!p.human&&!p.remote&&p.alive)SB.aiRos[sbId(p)]=aiRoster(p,SB.w);}
    if(SB.t<=0){for(const id of sbParticipants(SB))SB.ros[id]=sbRosterOf(SB,id);
      SB.games.forEach(g=>{Object.assign(g,afOdds(SB.ros[g.a]||[],SB.ros[g.b]||[]));delete g.pre;});SB.stage='bet';SB.t=SB_T.bet;}}
  else if(SB.stage==='bet'){
    const humans=[...sbParticipants(SB)].concat(SB.bye!=null?[SB.bye]:[]).filter(id=>{const p=sbP(id);return p&&(p.human||p.remote&&!p.left);});
    const allLocked=humans.length&&humans.every(id=>{const p=sbP(id);if(p.human)return SBL&&SBL.lock;const r=sbRemote(id);return r&&r.lock;});
    if(SB.t<=0||allLocked&&SB.t<SB_T.bet-2){SB.stage='play';SB.seed=SB.games.map(()=>1+((Math.random()*1e9)|0));let longest=0;
      SB.res=null;SB.res0=SB.games.map((g,i)=>(SB.ros[g.a]||[]).length&&(SB.ros[g.b]||[]).length?null:arenaRun(SB.ros[g.a]||[],SB.ros[g.b]||[],SB.seed[i]).win);SB.t=AF_MAX+6;SB.playT=SB.t;afStart(SB);
      SB.prot={};for(const id of sbParticipants(SB))SB.prot[id]=sbProtOf(SB,id);}}
  else if(SB.stage==='play'){if(AFH&&AFH.w===SB.w&&!G.mp)afHostTick(dt);
    if(SB.t<=0||afAllDone()){SB.res=SB.games.map((g,i)=>{const A=AFH&&AFH.A[i];if(A){if(!A.done){const f=s=>A.U.filter(u=>u.side===s&&!u.temp).reduce((a,u)=>a+Math.max(0,u.hp)/u.maxHp,0);A.win=f(0)>=f(1)?0:1;A.done=true;}return A.win;}return SB.res0[i]!=null?SB.res0[i]:0;});
      SB.stage='steal';SB.t=SB_T.steal;afExitView();}}
  else if(SB.stage==='steal'){const pending=SB.games.some((g,i)=>{const W=SB.res[i]?g.b:g.a,L=SB.res[i]?g.a:g.b,p=sbP(W);if(!p||!(p.human||p.remote&&!p.left))return false;if(!(SB.ros[L]||[]).length)return false;return sbTakeOf(SB,i,W)==null;});
    if(SB.t<=0||!pending){SB.out=SB.games.map((g,i)=>{const W=SB.res[i]?g.b:g.a,L=SB.res[i]?g.a:g.b,ros=SB.ros[L]||[];if(!ros.length)return {t:-1,b:0};
        let t=sbTakeOf(SB,i,W);if(t==null||t<0||t>=ros.length)t=(Math.random()*ros.length)|0;const blocked=ros[t][0]===SB.prot[L];return {t,b:blocked?1:0,k:ros[t][1],r:ros[t][2],pid:SB.prot[L]};});
      SB.stage='done';SB.t=SB_T.done;sbAiApply(SB);}}
  else if(SB.stage==='done'){if(SB.t<=0)SB.stage='over';}
}
function sbAiApply(SB){SB.games.forEach((g,i)=>{const o=SB.out[i];if(!o||o.t<0||o.b)return;const W=sbP(SB.res[i]?g.b:g.a),L=sbP(SB.res[i]?g.a:g.b),v=unitVal(o.k,o.r)*.45;
  if(W&&!W.human&&!W.remote){W.power=(W.power||0)+v;W.lastUnit=o.k;}if(L&&!L.human&&!L.remote)L.power=Math.max(5,(L.power||0)-v);});}

/* ---------- applying the result on this client ---------- */
function sbApplyMine(SB){const L=sbLocal(SB);if(L.applied||!SB.out)return;L.applied=true;const me=sbMe();
  // the bet slip
  const picked=SB.games.map((g,i)=>L.picks[i]).filter(x=>x>=0).length;let ret=0,right=0,sumOdds=0;
  if(L.paid&&picked){SB.games.forEach((g,i)=>{const pk=L.picks[i];if(pk<0)return;if(pk===SB.res[i]){right++;sumOdds+=pk?g.ob:g.oa;}});
    const mult=[0,1,1.3,1.8,2.5,3.2][right]||3.2;ret=Math.round(L.paid*sumOdds/picked*mult);if(ret){G.me.chips+=ret;gambleTally(ret);G.stats.earned+=ret;}
    if(right>=3&&right===picked&&typeof Meta!=='undefined')Meta.ach('parlay');}
  L.slip={picked,right,ret};
  // creatures change hands
  SB.games.forEach((g,i)=>{const o=SB.out[i];if(!o||o.t<0)return;const W=SB.res[i]?g.b:g.a,Ls=SB.res[i]?g.a:g.b;const wn=sbP(W),ln=sbP(Ls);
    if(Ls===me){if(o.b){gameLog(`${wn.short||wn.name} picked your protected ${UNITS[o.k].name}. You keep everything.`,'good');}
      else{const u=G.units.find(u=>u.id===(SB.ros[Ls][o.t]||[])[0]);if(u){u.dead=true;u.noKO=true;G.units=G.units.filter(x=>x!==u);G.sel=G.sel.filter(x=>x!==u);for(let k=0;k<20;k++)spark(u.x,u.y,'#f43f5e',120,.6);}
        gameLog(`${wn.short||wn.name} took your ${UNITS[o.k].name}.`,'bad');banner('Creature lost',`${wn.short||wn.name} took your ${UNITS[o.k].name}`,'bust');}}
    if(W===me){if(o.b){gameLog(`You picked ${ln.short||ln.name}'s protected creature. Nothing changes hands.`,'bad');}
      else{const u=makeUnit(o.k,BASE.fx-10,BASE.y+(rnd()-.5)*60);u.anchor={x:u.x,y:u.y};if(o.r){u.kills=rankNeed(o.k,o.r);checkRank(u,true);}G.fx.push({t:'ring',x:u.x,y:u.y,r0:4,r1:50,col:'#4ade80',life:.7,max:.7,w:4});
        if(typeof Meta!=='undefined'){Meta.seen(o.k);Meta.ach('poach');}gameLog(`You took ${ln.short||ln.name}'s ${UNITS[o.k].name}!`,'good');banner('Creature won',UNITS[o.k].name+' joins your casino','great');Snd.play('jackpot');}}});
  if(ret)gameLog(`Sports Night slip: ${right} of ${picked} right, paid ${fmt(ret)} chips.`,'good');else if(L.paid&&picked)gameLog(`Sports Night slip: ${right} of ${picked} right. No return.`);
}

/* ---------- the panel ---------- */
function sbNow(){return !G.mp?MG&&MG.sb:NET.host?NET.SB:NET.SBS;}
function openSports(SB){if(MG&&MG.kind==='sports')return;openMinigame('sports',999,G.mp?()=>{}:()=>{if(G.phase==='mini'){G.phase='break';G.breakT=1.2;}});if(!G.mp)MG.sb=SB;sbLocal(SB);sbPublish();renderMinigame();}
function sportsTick(dt){const SB=sbNow();if(!SB)return;if(!G.mp)sbTick(SB,dt);else if(!NET.host)SB.t-=dt;
  if(G.mp&&!NET.host){if(SB.stage==='play'&&(!AFV.on||AFV.w!==SB.w)){AFV.w=SB.w;afEnterView(SB);}else if(SB.stage!=='play'&&AFV.on)afExitView();}
  afFrame(dt);
  {const L=sbLocal(SB);if(SB.stage!=='bet'&&SB.stage!=='intro'&&!L.lock){L.lock=true;if(L.picks.some(x=>x>=0)){const s=Math.min(L.stake,G.me.chips);G.me.chips-=s;gambleTally(-s);L.paid=s;}}}
  const sig=SB.stage+'|'+(SB.stage==='bet'?Math.ceil(SB.t):'');if(MG&&MG.sbSig!==sig){if(!MG.sbSig||MG.sbSig.split('|')[0]!==SB.stage)MG.stT=Math.max(1,SB.t);MG.sbSig=sig;if(SB.stage==='done')sbApplyMine(SB);renderMinigame();}
  const tb=$('#mgTime');if(tb)tb.style.width=Math.max(0,Math.min(1,SB.t/(MG.stT||SB_T[SB.stage]||1))*100)+'%';
  if(SB.stage==='over'&&!G.mp)closeMinigame();}
function sbName(id){const p=sbP(id);return p?(p.human?'You':p.short||p.name):'?';}
function sbFace(id){const p=sbP(id);return p?`<i class="sbface" style="background:${p.col||'#888'}">${esc(p.face||'?')}</i>`:'';}
function sportsHTML(){const SB=sbNow();if(!SB)return '<p class="mglead">Setting up the games…</p>';const L=sbLocal(SB),me=sbMe(),gi=sbGameOf(SB,me);
  const gameRow=(g,i)=>{const res=SB.res&&SB.stage!=='bet'?SB.res[i]:null,show=SB.stage==='steal'||SB.stage==='done'||SB.stage==='over';
    const side=(id,odds,s)=>`<button class="sbside ${L.picks[i]===s?'on':''} ${show&&res===s?'win':''} ${show&&res!==s?'lose':''}" data-pick="${i},${s}" ${SB.stage!=='bet'||L.lock?'disabled':''}>${sbFace(id)}<span>${esc(sbName(id))}</span><b>${g.pre?'…':odds.toFixed(2)}</b></button>`;
    return `<div class="sbgame ${i===gi?'mine':''}"><small>${esc(g.sp)}</small><div class="sbrow">${side(g.a,g.oa,0)}<em>vs</em>${side(g.b,g.ob,1)}</div></div>`;};
  const order=SB.games.map((g,i)=>i).sort((x,y)=>(y===gi)-(x===gi));let body=`<div class="sbgames">${order.map(i=>gameRow(SB.games[i],i)).join('')}</div>${SB.bye!=null?`<p class="mglead small">${esc(sbName(SB.bye))} sits this one out.</p>`:''}`;
  if(SB.stage==='intro')body=`<p class="mglead">The teams are walking out. Each casino sends its six best creatures into the arena. Odds coming up…</p>`+body;
  else if(SB.stage==='bet'){const ros=myRoster();
    body=`<p class="mglead">Pick a winner in any of the games. Each right pick pays its odds. Get 2 right and the slip pays ×1.3, 3 right ×1.8.</p>`+body+
      `<div class="mgbets">${[10,25,50,100].map(n=>`<button class="pb ${n===L.stake?'on':''}" data-sbs="${n}" ${G.me.chips<n||L.lock?'disabled':''}>${icon('chips')}${n}</button>`).join('')}</div>`+
      (gi>=0&&ros.length?`<p class="mglead small">If you lose your game, the winner takes one of your creatures. <b>Protect one</b>; they won't know which.</p><div class="sbros">${ros.map(([id,k,rk])=>`<button class="sbu ${L.prot===id?'prot':''}" data-prot="${id}" ${L.lock?'disabled':''} data-tip="${UNITS[k].name}${rk?' · '+RANK_NAME[rk]:''}"><canvas data-k="${k}"></canvas>${L.prot===id?icon('plate'):''}</button>`).join('')}</div>`:'')+
      `<div class="mgrow"><button class="pb main" id="sbLock" ${L.lock?'disabled':''}>${L.lock?'Locked in · waiting':L.picks.some(x=>x>=0)?'Lock in slip · '+L.stake:'Lock in (no bet)'}</button></div>`;}
  else if(SB.stage==='play')body=`<p class="mglead">The games are on, live on the main screen. ${gi>=0?'Command your team with the usual controls.':'Use ← → to switch games.'}</p>`+body;
  else if(SB.stage==='steal'||SB.stage==='done'||SB.stage==='over'){let extra='';const i=gi;
    if(i>=0&&SB.res){const g=SB.games[i],W=SB.res[i]?g.b:g.a,Lo=SB.res[i]?g.a:g.b,ros=SB.ros[Lo]||[];
      if(SB.stage==='steal'){if(W===me&&ros.length)extra=`<p class="mglead"><b>You won your game!</b> Take one of ${esc(sbName(Lo))}'s creatures. One of them is protected.</p><div class="sbros">${ros.map(([id,k,rk],j)=>`<button class="sbu ${L.take===j?'on':''}" data-take="${j}" ${L.take!=null?'disabled':''} data-tip="${UNITS[k].name}${rk?' · '+RANK_NAME[rk]:''}"><canvas data-k="${k}"></canvas></button>`).join('')}</div>`;
        else if(Lo===me)extra=`<p class="mglead">You lost your game. ${esc(sbName(W))} is choosing one of your creatures…</p>`;}
      else if(SB.out){const o=SB.out[i];if(o&&o.t>=0)extra=`<p class="mglead">${W===me?(o.b?`You picked their protected ${UNITS[o.k].name}. Nothing changes hands.`:`You took ${esc(sbName(Lo))}'s <b>${UNITS[o.k].name}</b>!`):Lo===me?(o.b?`${esc(sbName(W))} picked your protected creature. You keep everything.`:`${esc(sbName(W))} took your <b>${UNITS[o.k].name}</b>.`):''}</p>`;}}
    const sl=L.slip;if(SB.stage!=='steal'&&sl&&sl.picked)extra+=`<div class="mgres">Your slip: ${sl.right} of ${sl.picked} right${sl.ret?` · +${fmt(sl.ret)} chips`:''}</div>`;
    body=body+extra;}
  return body;}
function sportsWire(){const el=$('#mgPanel');const SB=sbNow();if(!SB)return;const L=sbLocal(SB);
  el.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>{const [i,s]=b.dataset.pick.split(',').map(Number);L.picks[i]=L.picks[i]===s?-1:s;Snd.play('click');renderMinigame();}));
  el.querySelectorAll('[data-sbs]').forEach(b=>b.addEventListener('click',()=>{L.stake=+b.dataset.sbs;Snd.play('chips');renderMinigame();}));
  el.querySelectorAll('[data-prot]').forEach(b=>b.addEventListener('click',()=>{L.prot=+b.dataset.prot;Snd.play('lock');sbPublish();renderMinigame();}));
  el.querySelectorAll('[data-take]').forEach(b=>b.addEventListener('click',()=>{if(L.take!=null)return;L.take=+b.dataset.take;Snd.play('click');sbPublish();renderMinigame();}));
  const lk=$('#sbLock');if(lk)lk.addEventListener('click',()=>{if(L.lock)return;if(L.picks.some(x=>x>=0)){const s=Math.min(L.stake,G.me.chips);G.me.chips-=s;gambleTally(-s);L.paid=s;}L.lock=true;Snd.play('chips');sbPublish();renderMinigame();});
  el.querySelectorAll('.sbu canvas').forEach(c=>portrait(c,c.dataset.k,34));
  el.querySelectorAll('[data-tip]').forEach(n=>{n.addEventListener('pointerenter',e=>showTip(n.dataset.tip,e.clientX,e.clientY));n.addEventListener('pointerleave',hideTip);});}
let ARN=null; // live arenas on this client
function sbAnim(SB,dt){if(!SB.seed||!SB.ros)return;if(!ARN||ARN.w!==SB.w||ARN.seed!==SB.seed.join()){ARN={w:SB.w,seed:SB.seed.join(),A:SB.games.map((g,i)=>(SB.ros[g.a]||[]).length&&(SB.ros[g.b]||[]).length?arenaInit(SB.ros[g.a],SB.ros[g.b],SB.seed[i]):null),acc:0};}
  ARN.acc+=dt*AR_SPEED;let n=0;while(ARN.acc>=AR_DT&&n++<40){ARN.acc-=AR_DT;for(const A of ARN.A)if(A)arenaStep(A);}
  SB.games.forEach((g,i)=>{const cv=$('#sbArena'+i);if(cv)drawArena(cv,ARN.A[i],g);});}
