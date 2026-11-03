'use strict';
/* ============ ALL IN — Megaways: six reels, 2–7 symbols each, cascades with a climbing multiplier,
   and the bonus: land four BONUS chips to spin the Big Wheel, then free spins where the
   multiplier never resets, wild reels crash in, and you can gamble the lot on a card. ============ */

/* ---------- the maths (pure: no DOM, used by the sim in tools/) ---------- */
const MW_SYMS={ten:['10','#3b82f6',10],jack:['J','#10b981',10],queen:['Q','#ec4899',10],king:['K','#f59e0b',9],ace:['A','#ef4444',9],
  cherry:['cherry','#e11d48',6],bell:['bell','#f5b301',5],bar:['BAR','#1b1b22',4],seven:['7','#ef4444',2],wild:['WILD','#ff3d9a',3],bonus:['BONUS','#ffd34d',0]};
const MW_PAY={ten:[.04,.08,.16,.3],jack:[.04,.08,.16,.3],queen:[.05,.1,.2,.35],king:[.06,.12,.25,.45],ace:[.07,.14,.3,.55],
  cherry:[.1,.2,.4,.8],bell:[.15,.3,.6,1.2],bar:[.25,.5,1,2],seven:[.5,1,2.5,6]};
const MW_CFG={bet:20,scale:.16,scatW:2.5,fsWild:3,wildReel:.15,retrig:3,fsScale:.45,baseCap:150,bonusCap:300,bonusMin:5,threePay:1,gambleMax:3};
const MW_BET=MW_CFG.bet;
// the Big Wheel: twelve equal wedges. [free spins, starting multiplier, label, colour, wild reel every spin]
const MW_WHEEL=[[8,1,'8 SPINS','#7c3aed'],[10,2,'10 · ×2','#0ea5e9'],[8,3,'8 · ×3','#16a34a'],[12,1,'12 SPINS','#f59e0b'],[10,1,'10 SPINS','#db2777'],[8,5,'8 · ×5','#dc2626'],
  [15,1,'15 SPINS','#7c3aed'],[8,2,'8 · ×2','#0ea5e9'],[10,3,'10 · ×3','#16a34a'],[8,1,'8 SPINS','#f59e0b'],[12,2,'12 · ×2','#db2777'],[10,2,'WILD WILD','#111827',true]];

function mwPick(reel,rng,fs,noScat){let tot=0;const w=k=>k==='wild'?(reel>0?(fs?MW_CFG.fsWild:MW_SYMS.wild[2]):0):k==='bonus'?(noScat?0:MW_CFG.scatW):MW_SYMS[k][2];
  for(const k in MW_SYMS)tot+=w(k);let r=rng()*tot;for(const k in MW_SYMS){if((r-=w(k))<0)return k;}return 'ten';}
function mwFresh(rng,fs){return Array.from({length:6},(_,i)=>{const h=2+((rng()*6)|0);const col=[];let sc=false;for(let j=0;j<h;j++){const k=mwPick(i,rng,fs,sc);if(k==='bonus')sc=true;col.push(k);}return col;});}
function mwWays(g){return g.reduce((a,r)=>a*r.length,1);}
const mwScat=g=>g.reduce((a,r)=>a+(r.includes('bonus')?1:0),0);
// a symbol pays if it (or a wild) sits on reels 1..n in a row, n>=3; ways multiply
function mwWins(g){const out=[];for(const k of Object.keys(MW_PAY)){if(!g[0].includes(k))continue;let n=0,ways=1;const cells=[];
    for(let i=0;i<6;i++){const hits=[];g[i].forEach((s,j)=>{if(s===k||s==='wild')hits.push(j);});if(!hits.length)break;n++;ways*=hits.length;cells.push(hits);}
    if(n>=3)out.push({k,n,ways,cells,pay:MW_PAY[k][n-3]*ways*MW_CFG.scale});}
  return out;}
function mwCascade(g,wins,rng,fs){const kill=g.map(()=>new Set());for(const w of wins)w.cells.forEach((hits,i)=>hits.forEach(j=>kill[i].add(j)));
  return g.map((r,i)=>{const keep=r.filter((_,j)=>!kill[i].has(j));let sc=keep.includes('bonus');const add=[];while(keep.length+add.length<r.length){const k=mwPick(i,rng,fs,sc);if(k==='bonus')sc=true;add.push(k);}return add.concat(keep);});}
// one spin. opt.fs: in free spins (mult carries in and out, wild reels can land)
function mwSpin(rng,opt){opt=opt||{};const fs=!!opt.fs;let g=mwFresh(rng,fs),wildReel=-1;
  if(fs&&(opt.forceWild||rng()<MW_CFG.wildReel)){wildReel=1+((rng()*4)|0);g[wildReel]=g[wildReel].map(()=>'wild');}
  let mult=opt.mult||1,total=0,scat=mwScat(g);const scat0=scat;const steps=[{g,wins:[],mult}];
  for(let guard=0;guard<40;guard++){const wins=mwWins(g);if(!wins.length)break;const pay=wins.reduce((a,w)=>a+w.pay,0)*mult*(fs?MW_CFG.fsScale:1);total+=pay;
    const st=steps[steps.length-1];st.wins=wins;st.pay=pay;g=mwCascade(g,wins,rng,fs);mult++;scat=Math.max(scat,mwScat(g));steps.push({g,wins:[],mult});}
  return {steps,total,scat,scat0,wildReel,endMult:mult};}
// the whole bonus, decided up front: the wheel, then every free spin
function mwBonus(rng){const wi=(rng()*MW_WHEEL.length)|0,W=MW_WHEEL[wi];let left=W[0],mult=W[1],total=0,n=0;const spins=[];
  while(left>0&&n<40){left--;n++;const s=mwSpin(rng,{fs:true,mult,forceWild:!!W[4]});mult=s.endMult;let re=0;if(s.scat0>=3){re=MW_CFG.retrig;left+=re;}
    total+=s.total;spins.push({s,re,left,mult});if(total>=MW_CFG.bonusCap)break;}
  return {wi,spins,won:total,total:Math.max(MW_CFG.bonusMin,Math.min(MW_CFG.bonusCap,total))};}
// a base spin, settled: what it pays, and whether it opens the bonus
function mwPlay(rng){const s=mwSpin(rng);let total=Math.min(MW_CFG.baseCap,s.total);const trig=s.scat>=4;if(!trig&&s.scat===3)total+=MW_CFG.threePay;
  return {s,total,trig,bonus:trig?mwBonus(rng):null};}
/* @@ui */

/* ---------- sounds ---------- */
let MW_PITCH=0;
if(typeof FOLEY!=='undefined')Object.assign(FOLEY,{
  mwSpin(t){FX.sweep(t,300,2600,'bandpass',.1,.4,1.2);for(let i=0;i<6;i++)FX.click(t+i*.03,1600+i*200,4,.05,.03);},
  mwStop(t){FX.thump(t,150,55,.18,.1);FX.click(t,2200,5,.12,.03);},
  mwScat(t){const b=[1047,1319,1568,2093,2637][Math.min(4,MW_PITCH)];[b,b*1.5].forEach((f,i)=>Snd.tone(f,.35,'triangle',.08,0,i*.05));},
  mwTease(t){Snd.tone(196,1.3,'sawtooth',.03,2.6);Snd.tone(294,1.3,'sawtooth',.02,2.6);FX.sweep(t,500,5000,'bandpass',.05,1.3,2);},
  mwCasc(t){const b=440*Math.pow(2,Math.min(14,MW_PITCH)/12);[b,b*1.25,b*1.5].forEach((f,i)=>Snd.tone(f,.22,'square',.035,0,i*.045));FX.chip(t,.12);},
  mwPop(t){for(let i=0;i<5;i++)FX.click(t+i*.012,3000+Math.random()*2000,6,.1,.03);},
  mwWild(t){FX.sweep(t,6000,300,'bandpass',.2,.5,1.5);FX.thump(t+.05,120,40,.3,.35);Snd.tone(880,.4,'sawtooth',.04,.5,.02);},
  mwBonus(t){[523,659,784,1047,1319,1568,2093].forEach((f,i)=>Snd.tone(f,.4,'square',.045,0,i*.07));FX.thump(t,100,40,.3,.5);for(let i=0;i<20;i++)FX.chip(t+.3+i*.04,.12);},
  mwTick(t){FX.click(t,2600,8,.22,.025);},
  mwLand(t){[784,988,1175,1568].forEach((f,i)=>Snd.tone(f,.5,'triangle',.09,0,i*.09));},
  mwRetrig(t){[1175,1568,2093].forEach((f,i)=>Snd.tone(f,.3,'square',.05,0,i*.06));},
  mwBig(t){[392,523,659,784,1047].forEach((f,i)=>Snd.tone(f,.6,'sawtooth',.04,0,i*.11));for(let i=0;i<30;i++)FX.chip(t+.2+i*.05,.13);},
  mwFlip(t){FX.slide(t,.26);},
  mwBust(t){Snd.tone(330,.5,'sawtooth',.05,.4);Snd.tone(220,.6,'sawtooth',.04,.4,.1);}});

/* ---------- symbols ---------- */
const MW_SUIT={ten:'D',jack:'C',queen:'H',king:'S',ace:'H'};
function mwSym(k){const d=MW_SYMS[k];
  if(MW_SUIT[k])return `<span class="mws rk ${k}" style="--c:${d[1]}"><b>${d[0]}</b>${suitSVG(MW_SUIT[k],'ms')}</span>`;
  if(k==='wild')return `<span class="mws wild">${suitSVG('S','ms')}<b>WILD</b></span>`;
  if(k==='bonus')return `<span class="mws bonus"><i></i><b>BONUS</b></span>`;
  if(k==='bar')return `<span class="mws bar"><b>BAR</b></span>`;
  if(k==='seven')return `<span class="mws seven"><b>7</b></span>`;
  return `<span class="mws ${k}" style="--c:${d[1]}">${icon(k)}</span>`;}
const MW_TALL=['ten','jack','queen','king','ace','cherry','bell','bar','seven','wild'];

/* ---------- the panel ---------- */
const mwBuyPrice=()=>MW_CFG.buy*MW_BET;MW_CFG.buy=22;
const mwWait=ms=>new Promise(r=>setTimeout(r,ms*(ARC.mw&&ARC.mw.turbo?.5:1)));
function mwState(){return ARC.mw||(ARC.mw={g:mwFresh(Math.random),mult:1,busy:false,mode:'base',run:0,owed:0,turbo:false,win:0,fsInfo:null,
  last:'Six reels, up to 117,649 ways. Four <b class="gold">BONUS</b> chips spin the Big Wheel.'});}
function renderMW(){const B=$('#arcBody');if(!B)return;const M=mwState();
  const fs=M.mode==='fs'||M.mode==='fsend';
  $('#slotPanel').classList.toggle('mw-fs',fs);$('#slotPanel').classList.toggle('mw-bonus',M.mode!=='base');
  B.innerHTML=`<div class="mw">
    <div class="mwhud"><div class="mwways"><b id="mwWays">${fmt(mwWays(M.g))}</b><small>ways</small></div>
      <div class="mwfs" id="mwFs">${M.fsInfo?mwFsHTML(M):''}</div>
      <div class="mwmult" id="mwMult"><small>multiplier</small><b>×${M.mult}</b></div></div>
    <div class="mwstage"><div class="mwgrid" id="mwGrid">${M.g.map((r,i)=>`<div class="mwreel" data-r="${i}">${mwCells(r)}</div>`).join('')}</div><div class="mwover" id="mwOver"></div></div>
    <div class="mwbar"><div class="mwwin"><small>${fs?'bonus win':'win'}</small><b id="mwWin">${fmt(M.win)}</b></div><div class="mwmsg" id="mwMsg">${M.last}</div></div>
    <div class="mwctl"><button class="pb mwturbo ${M.turbo?'on':''}" id="mwTurbo" title="Faster spins">${icon('zap')}Turbo</button>
      <button class="pb main mwspin" id="mwSpin" ${M.busy||G.me.chips<MW_BET?'disabled':''}>Spin · ${MW_BET}</button>
      <button class="pb mwbuy" id="mwBuy" ${M.busy||G.me.chips<mwBuyPrice()?'disabled':''} title="Go straight to the Big Wheel">Buy bonus · ${fmt(mwBuyPrice())}</button></div></div>`;
  $('#mwSpin').addEventListener('click',()=>mwGo(false));
  $('#mwBuy').addEventListener('click',mwBuyClick);
  $('#mwTurbo').addEventListener('click',()=>{M.turbo=!M.turbo;Snd.play('click');$('#mwTurbo').classList.toggle('on',M.turbo);});
  if(M.overlay)M.overlay();}
function mwCells(col,o){o=o||{};return col.map((k,j)=>`<div class="mwc s-${k} ${o.hit&&o.hit.has(j)?'hit':''} ${o.hit&&!o.hit.has(j)?'dim':''} ${o.drop&&j<o.drop?'drop':''} ${o.land?'land':''} ${o.pop&&o.pop.has(j)?'pop':''}" style="--d:${(o.drop?(o.drop-j)*40:0)}ms">${mwSym(k)}</div>`).join('');}
function mwReel(i){return document.querySelector(`#mwGrid .mwreel[data-r="${i}"]`);}
function mwPaint(i,col,o){const el=mwReel(i);if(el){el.className='mwreel'+(o&&o.cls?' '+o.cls:'');el.innerHTML=mwCells(col,o);}}
function mwStrip(i){const el=mwReel(i);if(!el)return;const s=[];for(let k=0;k<14;k++)s.push(MW_TALL[(Math.random()*MW_TALL.length)|0]);
  el.className='mwreel spinning';el.innerHTML=`<div class="mwstrip" style="animation-delay:-${(Math.random()*.2).toFixed(2)}s">${s.concat(s).map(k=>`<div class="mwc">${mwSym(k)}</div>`).join('')}</div>`;}
function mwSet(id,html){const e=$('#'+id);if(e)e.innerHTML=html;}
function mwBump(id){const e=$('#'+id);if(e){e.classList.remove('bump');void e.offsetWidth;e.classList.add('bump');}}
function mwFsHTML(M){const f=M.fsInfo;return `<small>free spins</small><b>${f.left}</b><em>left</em>`;}
function mwShowWin(M,v){M.win=v;mwSet('mwWin',fmt(v));mwBump('mwWin');}
function mwShowMult(M,m){M.mult=m;mwSet('mwMult',`<small>multiplier</small><b>×${m}</b>`);mwBump('mwMult');}
function mwMsg(M,t){M.last=t;mwSet('mwMsg',t);}
function mwOver(M,fn){M.overlay=fn||null;document.querySelectorAll('#slotPanel .mwfloat').forEach(f=>f.remove());const o=$('#mwOver');if(!o)return;if(!fn){o.className='mwover';o.innerHTML='';return;}fn();}
function mwFloat(text,cls){const st=document.querySelector('#slotPanel .mwstage');if(!st)return;const d=document.createElement('div');d.className='mwfloat '+(cls||'');d.innerHTML=text;st.appendChild(d);setTimeout(()=>d.remove(),1400);}
function mwWinName(w){const d=MW_SYMS[w.k];const n=d[0]==='cherry'?'Cherries':d[0]==='bell'?'Bells':d[0]==='BAR'?'Bars':d[0]==='7'?'Sevens':d[0]==='10'?'Tens':{J:'Jacks',Q:'Queens',K:'Kings',A:'Aces'}[d[0]];return `${n} on ${w.n} reels · ${fmt(w.ways)} way${w.ways>1?'s':''}`;}
const mwTier=x=>x>=100?['LEGENDARY WIN','t4']:x>=50?['EPIC WIN','t3']:x>=25?['MEGA WIN','t2']:x>=10?['BIG WIN','t1']:null;

// a run is one paid spin (and its bonus); closing the panel settles anything still owed
function mwAlive(M,id){return ARC.mw===M&&M.run===id&&!!$('#mwGrid');}
function mwSettle(){const M=ARC.mw;if(!M||!M.busy)return;M.run++;if(M.owed>0){const v=Math.round(M.owed);G.me.chips+=v;G.stats.earned+=v;gameLog(`Megaways: ${fmt(v)} chips paid out.`,'good');}
  M.owed=0;M.busy=false;M.mode='base';M.fsInfo=null;M.overlay=null;M.mult=1;}
{const _tog=toggleArcade;toggleArcade=function(force,tab){const open=!!$('#slotPanel'),on=force!=null?force:!open;if(!on)mwSettle();return _tog(force,tab);};}

let MW_BUY_ARM=0;
function mwBuyClick(){const M=mwState();if(M.busy||G.me.chips<mwBuyPrice())return;const b=$('#mwBuy');
  if(Date.now()-MW_BUY_ARM>3000){MW_BUY_ARM=Date.now();b.textContent='Confirm · '+fmt(mwBuyPrice());b.classList.add('arm');Snd.play('click');setTimeout(()=>{const x=$('#mwBuy');if(x&&!M.busy){x.textContent='Buy bonus · '+fmt(mwBuyPrice());x.classList.remove('arm');}},3000);return;}
  MW_BUY_ARM=0;mwGo(true);}

async function mwGo(buy){const M=mwState();const cost=buy?mwBuyPrice():MW_BET;if(M.busy||G.me.chips<cost)return;
  G.me.chips-=cost;G.stats.mw=(G.stats.mw||0)+1;M.busy=true;const id=++M.run;M.mode='base';M.fsInfo=null;M.win=0;mwOver(M,null);
  const play=buy?{s:null,total:0,trig:true,bonus:mwBonus(Math.random)}:mwPlay(Math.random);
  M.owed=play.total*MW_BET+(play.bonus?play.bonus.total*MW_BET:0);
  renderMW();
  if(!buy){const base=await mwAnimSpin(M,id,play.s,false,MW_CFG.baseCap);if(base==null)return;
    let pay=Math.round(play.total*MW_BET);if(!play.trig&&play.s.scat===3){mwMsg(M,`Three <b class="gold">BONUS</b> chips · so close! +${MW_CFG.threePay*MW_BET}`);}
    if(pay){G.me.chips+=pay;G.stats.earned+=pay;M.owed-=pay;mwShowWin(M,pay);
      if(!play.trig){const t=mwTier(play.total);if(t){await mwBigWin(M,id,pay,t);if(!mwAlive(M,id))return;}
        if(play.total>=10){gameLog(`Megaways: a ${fmt(pay)}-chip win.`,'good');if(typeof Meta!=='undefined')Meta.ach('megaways');}
        if(play.s.scat!==3)mwMsg(M,`Total win: <b class="gold">${fmt(pay)}</b> chips${play.s.steps.length>2?' after '+(play.s.steps.length-1)+' cascades':''}`);}}
    else if(!play.trig&&play.s.scat!==3)mwMsg(M,'No win this time');
    if(!play.trig){M.busy=false;M.owed=0;renderMW();return;}}
  await mwBonusRun(M,id,play,buy);}

// spin the reels, stop them left to right, then play out the cascades. resolves to the raw win (in bets) or null if cancelled
async function mwAnimSpin(M,id,s,fs,cap){MW_PITCH=0;mwShowMult(M,s.steps[0].mult);
  for(let i=0;i<6;i++)mwStrip(i);Snd.play('mwSpin');mwMsg(M,fs?'Free spin…':'Spinning…');
  const g0=s.steps[0].g;let scat=0,tease=false;await mwWait(fs?280:420);
  for(let i=0;i<6;i++){if(!mwAlive(M,id))return null;
    if(!fs&&!tease&&scat>=3&&i<6){tease=true;Snd.play('mwTease');for(let j=i;j<6;j++){const e=mwReel(j);if(e)e.classList.add('tease');}mwMsg(M,'<b class="gold">One more BONUS chip…</b>');}
    if(tease)await mwWait(700);
    const wr=s.wildReel===i;mwPaint(i,g0[i],{land:true,cls:wr?'wildreel':''});Snd.play(wr?'mwWild':'mwStop');
    if(wr)mwFloat('WILD REEL!','wildfl');
    if(g0[i].includes('bonus')){scat++;MW_PITCH=scat-1;Snd.play('mwScat');const e=mwReel(i);if(e)e.querySelectorAll('.mwc.s-bonus').forEach(c=>c.classList.add('glow'));}
    await mwWait(wr?420:fs?110:150);}
  mwSet('mwWays',fmt(mwWays(g0)));
  let raw=0,shown=M.win;const base=M.win;
  for(let k=0;k<s.steps.length;k++){const st=s.steps[k];if(!st.wins.length)break;if(!mwAlive(M,id))return null;
    const hit=st.g.map(()=>new Set());st.wins.forEach(w=>w.cells.forEach((h,i)=>h.forEach(j=>hit[i].add(j))));
    st.g.forEach((col,i)=>mwPaint(i,col,{hit:hit[i],cls:s.wildReel===i&&k===0?'wildreel':''}));
    raw+=st.pay;const amt=Math.round(Math.min(cap,raw)*MW_BET);MW_PITCH=k;Snd.play('mwCasc');
    mwFloat(`+${fmt(Math.round(st.pay*MW_BET))}${st.mult>1?`<small>×${st.mult}</small>`:''}`,'amt');
    mwMsg(M,st.wins.map(mwWinName).slice(0,2).join('<br>')+(st.wins.length>2?` <small>+${st.wins.length-2} more</small>`:''));
    mwShowWin(M,base+amt);await mwWait(760);if(!mwAlive(M,id))return null;
    st.g.forEach((col,i)=>mwPaint(i,col,{pop:hit[i]}));Snd.play('mwPop');await mwWait(230);if(!mwAlive(M,id))return null;
    const nx=s.steps[k+1];nx.g.forEach((col,i)=>mwPaint(i,col,{drop:hit[i].size}));mwSet('mwWays',fmt(mwWays(nx.g)));mwShowMult(M,nx.mult);
    if(nx.g.some((c,i)=>c.includes('bonus')&&!st.g[i].includes('bonus'))){Snd.play('mwScat');}
    await mwWait(420);}
  if(!mwAlive(M,id))return null;s.steps[s.steps.length-1].g.forEach((col,i)=>mwPaint(i,col,{}));
  if(!fs)M.g=s.steps[s.steps.length-1].g;return raw;}

async function mwBigWin(M,id,amount,t){const o=$('#mwOver');if(!o)return;Snd.play('mwBig');for(let i=0;i<70;i++)confetti();
  let skip=false;const draw=v=>`<div class="mwbig ${t[1]}"><div class="mwbigt">${t[0]}</div><div class="mwbign">${fmt(v)}</div><small>chips · tap to continue</small><div class="mwcoins">${Array.from({length:18},(_,i)=>`<i style="left:${(i*5.7+Math.random()*4)%100}%;animation-delay:${(Math.random()*1.2).toFixed(2)}s;animation-duration:${(1.1+Math.random()*.8).toFixed(2)}s"></i>`).join('')}</div></div>`;
  M.overlay=()=>{const x=$('#mwOver');if(x){x.className='mwover on';x.innerHTML=draw(amount);}};
  o.className='mwover on';o.innerHTML=draw(0);o.onclick=()=>skip=true;
  const t0=performance.now(),dur=1800;await new Promise(res=>{const step=()=>{if(!mwAlive(M,id))return res();const u=Math.min(1,(performance.now()-t0)/dur),v=skip?amount:Math.round(amount*(1-Math.pow(1-u,3)));const n=document.querySelector('#mwOver .mwbign');if(n)n.textContent=fmt(v);if(u<1&&!skip){if(Math.random()<.4)Snd.play('chips');requestAnimationFrame(step);}else res();};step();});
  const until=performance.now()+(skip?250:1400);while(performance.now()<until&&!skip&&mwAlive(M,id))await new Promise(r=>setTimeout(r,60));
  o.onclick=null;if(mwAlive(M,id))mwOver(M,null);}

/* ---------- the bonus: splash, the Big Wheel, free spins, then double or nothing ---------- */
async function mwBonusRun(M,id,play,buy){const B=play.bonus,W=MW_WHEEL[B.wi];
  if(!buy){const e=$('#mwGrid');if(e)e.querySelectorAll('.mwc.s-bonus').forEach(c=>c.classList.add('glow','big'));}
  Snd.play('mwBonus');for(let i=0;i<90;i++)confetti();if(typeof Meta!=='undefined')Meta.ach('wildride');
  M.mode='wheel';$('#slotPanel').classList.add('mw-bonus');
  mwOver(M,()=>{const o=$('#mwOver');o.className='mwover on';o.innerHTML=`<div class="mwsplash"><b>BONUS!</b><small>${buy?'Bought your way in. Spin the Big Wheel.':'Four gold chips. Spin the Big Wheel.'}</small></div>`;});
  await mwWait(1700);if(!mwAlive(M,id))return;
  // the wheel
  let ang=0,spun=false;
  const wheel=()=>{const o=$('#mwOver');if(!o)return;o.className='mwover on wheel';o.innerHTML=`<div class="mwwheel"><canvas id="mwWheel" width="520" height="520"></canvas><i class="mwptr"></i>
      <button class="pb main" id="mwWheelGo" ${spun?'disabled':''}>${spun?'Spinning…':'Spin the wheel'}</button></div>`;
    mwDrawWheel(ang,-1,performance.now()/1000);const b=$('#mwWheelGo');if(b)b.onclick=()=>go&&go();};
  let go=null;const clicked=new Promise(res=>{go=()=>{if(spun)return;spun=true;res();};});
  mwOver(M,wheel);mwMsg(M,'Every wedge is a way into free spins. <b class="gold">WILD WILD</b> drops a wild reel on every spin.');
  const idle=()=>{if(!spun&&mwAlive(M,id)&&$('#mwWheel')){mwDrawWheel(ang,-1,performance.now()/1000);requestAnimationFrame(idle);}};idle();
  await clicked;if(!mwAlive(M,id))return;const btn=$('#mwWheelGo');if(btn){btn.disabled=true;btn.textContent='Spinning…';}
  const seg=TAU/MW_WHEEL.length,target=-(B.wi+.5)*seg+(Math.random()-.5)*seg*.7,turns=TAU*(5+Math.floor(Math.random()*2));
  const a0=ang,a1=a0-turns-(((a0-target)%TAU)+TAU)%TAU,dur=4600*(M.turbo?.6:1),t0=performance.now();let lastW=-1;
  await new Promise(res=>{const step=()=>{if(!mwAlive(M,id))return res();const u=Math.min(1,(performance.now()-t0)/dur),e=1-Math.pow(1-u,4);ang=a0+(a1-a0)*e;
    const w=((Math.floor((-ang)/seg)%MW_WHEEL.length)+MW_WHEEL.length)%MW_WHEEL.length;if(w!==lastW){lastW=w;Snd.play('mwTick');}
    if($('#mwWheel'))mwDrawWheel(ang,-1,performance.now()/1000);if(u<1)requestAnimationFrame(step);else res();};step();});
  if(!mwAlive(M,id))return;Snd.play('mwLand');
  const flash=()=>{if(mwAlive(M,id)&&$('#mwWheel')&&M.mode==='wheel'){mwDrawWheel(ang,B.wi,performance.now()/1000);requestAnimationFrame(flash);}};flash();
  const desc=W[4]?`${W[0]} free spins, a wild reel on every one, starting at ×${W[1]}`:`${W[0]} free spins starting at ×${W[1]}`;
  mwFloat(W[4]?'WILD WILD!':W[2],'wheelfl');mwMsg(M,`<b class="gold">${desc}</b>. The multiplier never resets.`);
  await mwWait(2200);if(!mwAlive(M,id))return;
  // free spins
  M.mode='fs';M.overlay=null;M.win=0;M.fsInfo={left:W[0]};M.mult=W[1];renderMW();
  mwMsg(M,`<b class="gold">FREE SPINS</b> · every cascade adds +1 to the multiplier, and it stays`);await mwWait(900);
  let raw=0;
  for(let j=0;j<B.spins.length;j++){if(!mwAlive(M,id))return;const sp=B.spins[j];M.fsInfo.left=(j===0?W[0]:B.spins[j-1].left)-1;mwSet('mwFs',mwFsHTML(M));mwBump('mwFs');
    M.win=Math.round(Math.min(MW_CFG.bonusCap,raw)*MW_BET);const r=await mwAnimSpin(M,id,sp.s,true,Math.max(0,MW_CFG.bonusCap-raw));if(r==null)return;raw+=r;
    mwShowWin(M,Math.round(Math.min(MW_CFG.bonusCap,raw)*MW_BET));
    if(sp.re){M.fsInfo.left+=sp.re;mwSet('mwFs',mwFsHTML(M));mwBump('mwFs');Snd.play('mwRetrig');mwFloat(`+${sp.re} FREE SPINS`,'wildfl');await mwWait(900);}
    if(raw>=MW_CFG.bonusCap){mwFloat('MAX WIN!','wheelfl');Snd.play('mwBig');await mwWait(1200);break;}
    await mwWait(r>0?450:250);}
  if(!mwAlive(M,id))return;
  const total=Math.round(B.total*MW_BET),topped=B.won<MW_CFG.bonusMin;M.mode='fsend';mwShowWin(M,total);
  mwMsg(M,`Free spins paid <b class="gold">${fmt(total)}</b> chips${topped?` (topped up to the ${MW_CFG.bonusMin}× minimum)`:''}`);
  const t=mwTier(B.total);if(t){await mwBigWin(M,id,total,t);if(!mwAlive(M,id))return;}
  await mwGamble(M,id,total);}

function mwDrawWheel(ang,hi,now){const cv=$('#mwWheel');if(!cv)return;const c=cv.getContext('2d'),S=cv.width,R=S/2-16,n=MW_WHEEL.length,seg=TAU/n;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,S,S);c.translate(S/2,S/2);
  c.fillStyle='#2a1708';c.beginPath();c.arc(0,0,R+14,0,TAU);c.fill();c.strokeStyle='#e0b040';c.lineWidth=6;c.stroke();
  for(let k=0;k<24;k++){const a=k/24*TAU,on=((Math.floor(now*8)+k)%3)===0;c.fillStyle=on?'#fff7cc':'#7a5a0e';c.beginPath();c.arc(Math.cos(a)*(R+7),Math.sin(a)*(R+7),4.5,0,TAU);c.fill();}
  c.save();c.rotate(ang-Math.PI/2);
  for(let i=0;i<n;i++){const W=MW_WHEEL[i],a=i*seg;c.fillStyle=W[3];c.beginPath();c.moveTo(0,0);c.arc(0,0,R,a,a+seg);c.closePath();c.fill();
    if(i===hi&&Math.floor(now*6)%2){c.fillStyle='rgba(255,255,255,.45)';c.fill();}
    c.strokeStyle='#e0b040';c.lineWidth=2.5;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*R,Math.sin(a)*R);c.stroke();
    c.save();c.rotate(a+seg/2);c.textAlign='right';c.textBaseline='middle';c.fillStyle='#fff';c.font=`400 ${W[4]?24:26}px Bungee, Impact, sans-serif`;c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=4;
    const [a1,b1]=W[2].split(' · ');if(b1){c.fillText(a1,R-14,-13);c.fillStyle='#fde68a';c.fillText(b1,R-14,15);}else{const p=W[2].split(' ');c.fillText(p[0],R-14,-13);c.fillStyle=W[4]?'#ff8cc6':'#fde68a';c.fillText(p.slice(1).join(' '),R-14,15);}c.restore();}
  c.restore();
  const g=c.createRadialGradient(-10,-10,4,0,0,62);g.addColorStop(0,'#fff3c4');g.addColorStop(1,'#b8860b');c.fillStyle=g;c.beginPath();c.arc(0,0,58,0,TAU);c.fill();c.strokeStyle='#5b3a06';c.lineWidth=4;c.stroke();
  c.fillStyle='#3b2206';c.font='400 26px Bungee, Impact, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('ALL',0,-12);c.fillText('IN',0,16);}

const MW_SUITS='SHDC';
async function mwGamble(M,id,amount){let owed=amount,round=0;const cap=MW_CFG.bonusCap*MW_BET;M.mode='gamble';M.owed=owed;
  let card=null,res=null,result='';
  const draw=()=>{const o=$('#mwOver');if(!o)return;o.className='mwover on gamble';
    const can=round<MW_CFG.gambleMax&&owed>0&&owed*2<=cap&&res!=='busy';
    o.innerHTML=`<div class="mwgam"><div class="mwgamt">${owed>0?'Double or nothing?':'Bust!'}</div>
      <div class="mwgamc ${card?'flip':''}">${card?cardHTML(card,0,'big'):'<div class="card back big"></div>'}</div>
      <div class="mwgamr">${result||`Pick a colour. Right doubles it: <b class="gold">${fmt(owed*2)}</b>`}</div>
      <div class="mwgamb">${owed>0?`<button class="pb red" id="mwRed" ${can?'':'disabled'}>Red</button><button class="pb main" id="mwCol">Collect ${fmt(owed)}</button><button class="pb blk" id="mwBlk" ${can?'':'disabled'}>Black</button>`:`<button class="pb main" id="mwCol">Back to the reels</button>`}</div>
      <small>${owed>0?`Gamble ${round}/${MW_CFG.gambleMax} · a fair 50/50`:''}</small></div>`;
    const r=$('#mwRed'),b=$('#mwBlk'),c=$('#mwCol');if(r)r.onclick=()=>pick('red');if(b)b.onclick=()=>pick('black');if(c)c.onclick=collect;};
  const pick=async col=>{if(res==='busy'||owed<=0)return;res='busy';card=null;result='…';draw();Snd.play('mwFlip');await mwWait(450);if(!mwAlive(M,id))return;
    card={v:2+((Math.random()*13)|0),s:MW_SUITS[(Math.random()*4)|0]};const red=card.s==='H'||card.s==='D';round++;
    if((col==='red')===red){owed*=2;M.owed=owed;result=`<b class="gold">Doubled!</b> ${fmt(owed)} chips`;Snd.play('win');mwShowWin(M,owed);if(round>=MW_CFG.gambleMax&&typeof Meta!=='undefined')Meta.ach('doubleup');}
    else{owed=0;M.owed=0;result='The house takes it.';Snd.play('mwBust');mwShowWin(M,0);}
    res=null;draw();mwMsg(M,owed>0?`Take <b class="gold">${fmt(owed)}</b>, or go again for ${fmt(owed*2)}.`:'Bust. Better luck on the reels.');if(owed>0&&(round>=MW_CFG.gambleMax||owed*2>cap)){await mwWait(900);if(mwAlive(M,id))collect();}};
  const collect=()=>{if(!mwAlive(M,id)||res==='busy')return;if(owed>0){G.me.chips+=owed;G.stats.earned+=owed;Snd.play('potwin');gameLog(`Megaways bonus: ${fmt(owed)} chips.`,'good');if(owed>=MW_BET*10&&typeof Meta!=='undefined')Meta.ach('megaways');}
    M.owed=0;M.busy=false;M.mode='base';M.fsInfo=null;M.overlay=null;M.mult=1;
    M.last=owed>0?`Bonus total: <b class="gold">${fmt(owed)}</b> chips`:'The wheel giveth, the card taketh away.';M.win=owed;renderMW();};
  M.overlay=draw;draw();mwMsg(M,`Take <b class="gold">${fmt(owed)}</b>, or gamble it on the colour of the next card.`);}

/* ---------- styles ---------- */
(function(){const css=`
#slotPanel.arc-mw{width:476px}
#slotPanel.mw-bonus{box-shadow:0 0 0 1px #000,0 0 0 2px #ffd34d,0 0 40px rgba(255,211,77,.45),0 20px 60px rgba(0,0,0,.7)}
#slotPanel.mw-fs{background:linear-gradient(180deg,#2a0f3a,#12061c);animation:slIn .3s ease-out,mwFsGlow 1.6s linear infinite}
@keyframes mwFsGlow{0%{box-shadow:0 0 0 1px #000,0 0 0 2px #ff3d9a,0 0 44px rgba(255,61,154,.55),0 20px 60px rgba(0,0,0,.7)}33%{box-shadow:0 0 0 1px #000,0 0 0 2px #ffd34d,0 0 44px rgba(255,211,77,.55),0 20px 60px rgba(0,0,0,.7)}66%{box-shadow:0 0 0 1px #000,0 0 0 2px #22e1ff,0 0 44px rgba(34,225,255,.55),0 20px 60px rgba(0,0,0,.7)}100%{box-shadow:0 0 0 1px #000,0 0 0 2px #ff3d9a,0 0 44px rgba(255,61,154,.55),0 20px 60px rgba(0,0,0,.7)}}
.mw .gold,.mwgam .gold{color:#ffd34d}
.mwhud{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin-bottom:6px;min-height:38px}
.mwways,.mwmult{display:flex;flex-direction:column;line-height:1}.mwmult{align-items:flex-end}
.mwways b,.mwmult b{font:400 19px var(--head);color:#fff;font-variant-numeric:tabular-nums}.mwmult b{color:var(--amber);text-shadow:0 0 10px rgba(255,176,32,.6)}
.mwways small,.mwmult small,.mwwin small,.mwfs small{font:400 9.5px var(--head);color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}
.mwmult small{order:-1}
.mwfs{display:flex;align-items:baseline;gap:5px;padding:0 12px;height:34px;border-radius:17px;background:linear-gradient(180deg,#ff8cc6,#ff3d9a);color:#2a0016;box-shadow:0 0 18px rgba(255,61,154,.6)}
.mwfs:empty{visibility:hidden}.mwfs small{color:#4a0328}.mwfs b{font:400 22px/34px var(--head)}.mwfs em{font:400 11px var(--head);font-style:normal}
.bump{animation:mwBump .35s ease-out}@keyframes mwBump{40%{transform:scale(1.25)}}
.mwstage{position:relative}
.mwgrid{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;height:262px;padding:6px;background:radial-gradient(120% 90% at 50% 0%,#241634,#07040b);border-radius:12px;box-shadow:inset 0 0 0 2px #4a3d5c,inset 0 10px 24px rgba(0,0,0,.85),0 0 0 3px #120a1a}
.mw-fs .mwgrid{background:radial-gradient(120% 90% at 50% 0%,#5b1846,#14051e);box-shadow:inset 0 0 0 2px #ffd34d,inset 0 10px 24px rgba(0,0,0,.7),0 0 0 3px #120a1a,0 0 22px rgba(255,211,77,.35)}
.mwreel{position:relative;display:flex;flex-direction:column;gap:2px;background:linear-gradient(180deg,#bfb4cc,#fffdf8 18%,#fffdf8 82%,#bfb4cc);border-radius:6px;padding:2px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)}
.mwreel::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.28),transparent 14%,transparent 86%,rgba(0,0,0,.28))}
.mwreel.spinning .mwstrip{display:flex;flex-direction:column;gap:2px;animation:mwRoll .22s linear infinite;filter:blur(1.4px)}
.mwreel.spinning .mwc{flex:none;height:50px}
@keyframes mwRoll{from{transform:translateY(-50%)}to{transform:translateY(0)}}
.mwreel.tease{box-shadow:0 0 0 2px #ffd34d,0 0 18px #ffd34d;animation:mwTease .3s ease-in-out infinite alternate}@keyframes mwTease{to{box-shadow:0 0 0 2px #fff3c4,0 0 30px #ffd34d}}
.mwreel.land{}
.mwreel.wildreel{background:linear-gradient(180deg,#ff3d9a,#ffd0e8 20%,#ffd0e8 80%,#ff3d9a);box-shadow:0 0 0 2px #ff3d9a,0 0 20px #ff3d9a}
.mwc{position:relative;flex:1;display:flex;align-items:center;justify-content:center;border-radius:5px;min-height:0;transition:opacity .2s,filter .2s}
.mwc.land{animation:mwLandA .28s cubic-bezier(.3,1.6,.5,1)}@keyframes mwLandA{from{transform:translateY(-35%)}}
.mwc.drop{animation:mwDrop .38s cubic-bezier(.3,1.4,.5,1) backwards;animation-delay:var(--d)}@keyframes mwDrop{from{transform:translateY(-120%);opacity:0}}
.mwc.hit{background:radial-gradient(circle,rgba(255,211,77,.85),rgba(255,61,154,.45));box-shadow:0 0 0 2px #ffd34d,0 0 14px #ffb020;animation:mwHit .38s ease-in-out infinite alternate;z-index:1}
@keyframes mwHit{to{background:radial-gradient(circle,rgba(255,255,255,.9),rgba(255,176,32,.6));transform:scale(1.05)}}
.mwc.dim{opacity:.32;filter:grayscale(.6)}.mwc.s-bonus.dim{opacity:1;filter:none}
.mwc.pop{animation:mwPopA .23s ease-in forwards}@keyframes mwPopA{to{transform:scale(1.5);opacity:0;filter:brightness(3)}}
.mwc.s-bonus.glow{background:radial-gradient(circle,rgba(255,211,77,.9),rgba(255,211,77,0) 75%);animation:mwGlow .5s ease-in-out infinite alternate}@keyframes mwGlow{to{transform:scale(1.12);filter:brightness(1.3)}}
.mwc.s-bonus.big{animation:mwGlowBig .35s ease-in-out infinite alternate}@keyframes mwGlowBig{to{transform:scale(1.25) rotate(8deg);filter:brightness(1.5)}}
.mws{display:flex;align-items:center;justify-content:center;line-height:1;font:400 17px var(--head);max-height:100%}
.mws svg.ms{width:11px;height:11px;fill:currentColor}
.mws.rk{position:relative;flex-direction:column;color:var(--c);font-family:Georgia,'Times New Roman',serif;font-weight:900;text-shadow:0 1px 0 rgba(0,0,0,.15)}
.mws.rk b{font-size:21px;letter-spacing:-.04em}.mws.rk.ten b{font-size:18px}
.mws.rk svg.ms{margin-top:-1px}
.mws.king,.mws.ace{filter:drop-shadow(0 0 0 #000)}.mws.king b,.mws.ace b{font-size:23px}
.mws .ic{width:24px;height:24px;stroke-width:2.4;color:var(--c);filter:drop-shadow(0 1px 0 rgba(0,0,0,.2))}
.mws.cherry .ic{fill:rgba(225,29,72,.35)}.mws.bell .ic{fill:rgba(245,179,1,.35)}
.mws.bar b{font:400 10px var(--head);color:#fff;background:linear-gradient(180deg,#3a3a46,#111);padding:3px 4px;border-radius:3px;box-shadow:0 0 0 1.5px #e0b040,0 2px 0 #000}
.mws.seven b{font:900 30px/1 Georgia,serif;color:#ef4444;-webkit-text-stroke:1.5px #7f1d1d;text-shadow:0 0 0 #000,0 2px 0 #fbbf24,0 3px 0 #7f1d1d}
.mws.wild{flex-direction:column;color:#ff3d9a;width:92%;height:88%;border-radius:5px;background:linear-gradient(160deg,#2a0b3d,#5b1846);box-shadow:inset 0 0 0 1.5px #ff3d9a,0 0 8px rgba(255,61,154,.5)}
.mws.wild svg.ms{width:17px;height:17px;filter:drop-shadow(0 0 4px #ff3d9a)}.mws.wild b{font:400 9px var(--head);color:#ffd0e8;margin-top:1px}
.mws.bonus{position:relative;width:38px;height:38px;max-width:92%;aspect-ratio:1;border-radius:50%;background:repeating-conic-gradient(#ffd34d 0 15deg,#b8860b 15deg 30deg);box-shadow:0 0 0 2px #5b3a06,0 0 10px rgba(255,211,77,.7)}
.mws.bonus i{position:absolute;inset:16%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3c4,#e0b040 60%,#a16207);box-shadow:inset 0 0 0 1.5px #5b3a06}
.mws.bonus b{position:relative;font:400 7.5px var(--head);color:#3b2206;letter-spacing:.02em}
.mwreel .mwc:only-child .mws,.mwreel .mwc:nth-last-child(2):first-child .mws{transform:scale(1.25)}
.mwover{position:absolute;inset:0;display:none;align-items:center;justify-content:center;border-radius:12px;z-index:5}
.mwover.on{display:flex;background:rgba(8,3,14,.72);backdrop-filter:blur(1.5px)}
.mwfloat{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);pointer-events:none;z-index:6;font:400 30px var(--head);color:#fff3c4;text-shadow:0 0 6px #ffb020,0 0 18px #ff3d9a,0 3px 0 #7a3b00;animation:mwFl 1.3s ease-out forwards;white-space:nowrap}
.mwfloat small{font-size:16px;margin-left:6px;color:#ffd34d}
.mwfloat.wildfl{color:#ffd0e8;text-shadow:0 0 8px #ff3d9a,0 0 22px #ff3d9a,0 3px 0 #4a0328;font-size:34px}
.mwfloat.wheelfl{font-size:38px;top:40%}
@keyframes mwFl{0%{transform:translate(-50%,-20%) scale(.5);opacity:0}18%{transform:translate(-50%,-50%) scale(1.15);opacity:1}70%{opacity:1}100%{transform:translate(-50%,-110%) scale(1);opacity:0}}
.mwbar{display:grid;grid-template-columns:96px 1fr;gap:10px;align-items:center;margin:8px 0 6px;min-height:44px}
.mwwin{display:flex;flex-direction:column;align-items:center;justify-content:center;height:44px;border-radius:10px;background:#07040b;box-shadow:inset 0 0 0 1px #3a3346;line-height:1}
.mwwin b{font:400 20px var(--head);color:#ffd34d;text-shadow:0 0 10px rgba(255,211,77,.5);font-variant-numeric:tabular-nums}
.mwmsg{font:400 12.5px/1.35 var(--body,Barlow),sans-serif;color:#ffe9b0;text-align:left}.mwmsg small{color:var(--muted)}
.mwctl{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center}
.mwctl .pb{height:34px;margin:0}.mwspin{font-size:15px}
.mwturbo{display:flex;align-items:center;gap:4px;padding:0 10px}.mwturbo .ic{width:14px;height:14px}.mwturbo.on{color:#1d0f00;background:linear-gradient(180deg,#ffe08a,#ffb020)}
.mwbuy{padding:0 10px;font-size:11.5px;color:#ffd34d;box-shadow:inset 0 0 0 1.5px #b8860b}.mwbuy.arm{background:#ffd34d;color:#2a1708}
.mwsplash{display:flex;flex-direction:column;align-items:center;gap:6px;animation:mwSpl .5s cubic-bezier(.3,1.6,.5,1)}
.mwsplash b{font:400 64px/1 var(--head);color:#fff3c4;text-shadow:0 0 10px #ffb020,0 0 30px #ff3d9a,0 5px 0 #7a3b00;animation:mwWob .5s ease-in-out infinite alternate}
.mwsplash small{font:400 14px var(--head);color:#ffd34d}
@keyframes mwSpl{from{transform:scale(.2) rotate(-12deg);opacity:0}}@keyframes mwWob{to{transform:scale(1.07) rotate(2deg)}}
.mwwheel{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;animation:mwSpl .5s cubic-bezier(.3,1.4,.5,1)}
.mwwheel canvas{width:222px;height:222px;filter:drop-shadow(0 6px 16px rgba(0,0,0,.6))}
.mwptr{position:absolute;top:-8px;left:50%;margin-left:-11px;width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-top:22px solid #fff3c4;filter:drop-shadow(0 0 6px #ffb020) drop-shadow(0 2px 0 #7a3b00)}
.mwwheel .pb{height:30px;margin:0}
.mwbig{position:relative;display:flex;flex-direction:column;align-items:center;overflow:hidden;width:100%;height:100%;justify-content:center}
.mwbigt{font:400 40px/1 var(--head);color:#fff3c4;text-shadow:0 0 10px #ffb020,0 0 28px #ff3d9a,0 4px 0 #7a3b00;animation:mwSpl .5s cubic-bezier(.3,1.6,.5,1),mwWob .45s .5s ease-in-out infinite alternate}
.mwbig.t2 .mwbigt{color:#ffd0e8;text-shadow:0 0 10px #ff3d9a,0 0 30px #ff3d9a,0 4px 0 #4a0328}.mwbig.t3 .mwbigt{color:#cffafe;text-shadow:0 0 10px #22e1ff,0 0 30px #22e1ff,0 4px 0 #083344;font-size:46px}
.mwbig.t4 .mwbigt{font-size:42px;background:linear-gradient(90deg,#ff3d9a,#ffd34d,#22e1ff,#a78bfa,#ff3d9a);background-size:200%;-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 0 10px #fff);animation:mwRain 1s linear infinite}
@keyframes mwRain{to{background-position:200%}}
.mwbign{font:400 44px/1.1 var(--head);color:#ffd34d;font-variant-numeric:tabular-nums;text-shadow:0 0 14px rgba(255,211,77,.7),0 3px 0 #7a3b00}
.mwbig small{font:400 11px var(--head);color:var(--muted);margin-top:4px}
.mwcoins{position:absolute;inset:0;pointer-events:none}.mwcoins i{position:absolute;top:-24px;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3c4,#e0b040 55%,#a16207);box-shadow:0 0 0 1.5px #5b3a06;animation:mwCoin 1.4s linear infinite}
@keyframes mwCoin{to{transform:translateY(300px) rotateY(720deg)}}
.mwgam{display:flex;flex-direction:column;align-items:center;gap:7px;animation:mwSpl .4s ease-out}
.mwgamt{font:400 22px var(--head);color:#fff3c4;text-shadow:0 0 10px #ff3d9a}
.mwgamc{perspective:400px}.mwgamc .card.big{width:74px;height:106px}.mwgamc.flip .card{animation:mwFlipA .35s ease-out}@keyframes mwFlipA{from{transform:rotateY(90deg)}}
.mwgamr{font:400 12.5px var(--body,Barlow),sans-serif;color:#ffe9b0;min-height:17px}
.mwgamb{display:flex;gap:6px}.mwgamb .pb{height:32px;margin:0;padding:0 14px}
.mwgamb .pb.red{background:linear-gradient(180deg,#f87171,#dc2626);color:#fff}.mwgamb .pb.blk{background:linear-gradient(180deg,#4b5563,#111827);color:#fff}
.mwgam small{font:400 10px var(--head);color:var(--muted)}
@media (prefers-reduced-motion:reduce){.mwreel.spinning .mwstrip,.mwc.hit,.mwc.s-bonus.glow,.mwc.s-bonus.big,.mwsplash b,.mwbigt{animation:none}}`;
const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);})();
