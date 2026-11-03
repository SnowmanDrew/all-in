'use strict';
/* ============ ALL IN — the Penny Arcade: slots, Megaways, the dog track; and Derby Night ============ */

/* Megaways lives in megaways.js */

/* ---------- racing: shared engine for the dog track and Derby Night ---------- */
// pick a winner by probability, then give every runner a finishing time so the winner is first
function raceFinish(n,p,rng){let r=rng(),win=0;for(let i=0;i<n;i++){if((r-=p[i])<0){win=i;break;}}
  const order=[win].concat([...Array(n).keys()].filter(i=>i!==win).sort(()=>rng()-.5));const T=[];order.forEach((i,k)=>{T[i]=1+k*.035+rng()*.02;});return {win,T};}
function racePos(i,u,R){const T=R.T[i],x=Math.min(1,u/T),wob=Math.sin(u*9+i*2.1)*.035*x*(1-x)+Math.sin(u*3.3+i)*.05*x*(1-x);return Math.min(1,Math.max(0,x+wob));}
function oddsFrom(strengths,edge){const tot=strengths.reduce((a,b)=>a+b,0);const p=strengths.map(s=>s/tot);return {p,odds:p.map(q=>Math.max(1.2,Math.round(edge/q*10)/10))};}

const DOG_NAMES=['Bluebell Bolt','Snake Eyes Sam','Lucky Lou','Rusty Rocket','Velvet Dash','Chip Shot','Midnight Ante','Neon Nellie','Pocket Aces','Wild Card Willy','Double Down','Pit Stop Pete'];
const HORSE_NAMES=['Royal Flush','Dealer\'s Choice','Midnight Marquee','Busted Flush','Jackpot Jenny','Velvet Thunder','Last Chance Lil','Snake Oil','Silver Ante','Long Odds Larry','House Money','Golden Goose Egg'];
const SILKS=[['#dc2626','#fff'],['#2563eb','#fde047'],['#16a34a','#fff'],['#f59e0b','#111'],['#7c3aed','#f0abfc'],['#f8fafc','#dc2626']];
const COATS=['#7c2d12','#1c1917','#a16207','#78716c','#451a03','#d6d3d1'];
function newField(kind){const names=(kind==='dog'?DOG_NAMES:HORSE_NAMES).slice().sort(()=>Math.random()-.5).slice(0,6);
  const str=names.map((_,i)=>kind==='dog'?.6+Math.random()*1.4:Math.pow(Math.random(),1.6)*2.5+.25);const {p,odds}=oddsFrom(str,kind==='dog'?.9:.92);
  return names.map((nm,i)=>({name:nm,p:p[i],odds:odds[i],silk:SILKS[i],coat:kind==='dog'?['#9ca3af','#d6d3d1','#57534e','#a8a29e','#e7e5e4','#78716c'][i]:COATS[i]}));}
function drawTrack(cv,kind,field,R,u){const c=cv.getContext('2d'),W2=cv.width,H2=cv.height,lanes=field.length,lh=(H2-24)/lanes;c.clearRect(0,0,W2,H2);
  // ground
  c.fillStyle=kind==='dog'?'#a16207':'#14532d';c.fillRect(0,0,W2,H2);c.fillStyle=kind==='dog'?'#ca8a04':'#166534';for(let i=0;i<lanes;i++)if(i%2)c.fillRect(0,12+i*lh,W2,lh);
  c.fillStyle='#f8fafc';c.fillRect(0,10,W2,2);c.fillRect(0,H2-12,W2,2);
  const sx=46,ex=W2-44,fl=ex+14;c.fillStyle='#fff';for(let k=0;k<lanes*2;k++){c.fillStyle=k%2?'#111':'#fff';c.fillRect(fl,12+k*lh/2,6,lh/2);}
  // rail posts scroll for a sense of speed
  c.fillStyle='rgba(255,255,255,.5)';const off=(u||0)*600%60;for(let x=-off;x<W2;x+=60)c.fillRect(x,3,3,7);
  field.forEach((f,i)=>{const y=12+i*lh+lh*.62,pos=R?racePos(i,u,R):0,x=sx+(ex-sx)*pos;
    c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(x,y+lh*.25,lh*.45,lh*.08,0,0,TAU);c.fill();
    c.save();c.translate(x,y);const s=lh*.52;const tt=R?performance.now()/1000+i*.13:0;
    if(kind==='dog')drawCreature(c,{b:'greyhound',face:'beady',c1:f.coat,silk:f.silk[0],num:String(i+1),muzzle:true},s,R&&pos<1?tt:0,0);
    else drawCreature(c,{b:'horse',face:'beady',c1:f.coat,c2:'#1c1917',silk:f.silk[0],silk2:f.silk[1],num:String(i+1)},s*.85,R&&pos<1?tt:0,0);
    c.restore();
    c.fillStyle='rgba(0,0,0,.55)';c.fillRect(2,12+i*lh+2,16,14);c.fillStyle=f.silk[0];c.fillRect(3,12+i*lh+3,14,12);c.fillStyle=f.silk[0]==='#f8fafc'?'#dc2626':f.silk[1]==='#111'?'#111':'#fff';c.font='700 10px Barlow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(i+1,10,12+i*lh+9.5);});
  if(kind==='dog'&&R){const lead=Math.max(...field.map((_,i)=>racePos(i,u,R)));const hx=sx+(ex-sx)*Math.min(1.08,lead+.06);c.fillStyle='#f5f5f4';c.beginPath();c.ellipse(hx,H2-18,7,4,0,0,TAU);c.fill();c.beginPath();c.ellipse(hx+5,H2-23,2,5,.3,0,TAU);c.fill();}
}

/* ---------- the arcade panel ---------- */
const ARC={tab:'slots',dog:null,mw:null};
function toggleArcade(force,tab){const open=!!$('#slotPanel');const on=force!=null?force:!open;
  if(!on){if(open)$('#slotPanel').remove();SL=null;return;}
  if(tab)ARC.tab=tab;if(!open){const el=document.createElement('div');el.id='slotPanel';document.body.appendChild(el);if(!SL)SL={reels:['seven','seven','seven'],spin:false,last:'Pull for 10 chips'};Snd.play('coin');}
  renderArcade();}
function renderArcade(){const el=$('#slotPanel');if(!el)return;
  el.className='arc-'+ARC.tab;
  el.innerHTML=`<div class="mghead"><b>Penny Arcade</b><span id="slChips">${icon('chips')}${fmt(G.me.chips)}</span><button class="mgx" id="slX">Close</button></div>
    <div class="arctabs">${[['slots','Slots'],['mw','Megaways'],['dog','Dog Track']].map(([k,n])=>`<button data-arc="${k}" class="${ARC.tab===k?'on':''}">${n}</button>`).join('')}</div><div id="arcBody"></div>`;
  $('#slX').addEventListener('click',()=>toggleArcade(false));
  el.querySelectorAll('[data-arc]').forEach(b=>b.addEventListener('click',()=>{if(arcBusy())return;ARC.tab=b.dataset.arc;Snd.play('click');renderArcade();}));
  if(ARC.tab==='slots')renderSlots();else if(ARC.tab==='mw')renderMW();else renderDog();}
const arcBusy=()=>(SL&&SL.spin)||(ARC.mw&&ARC.mw.busy)||(ARC.dog&&ARC.dog.running);

/* Dog track UI */
function renderDog(){const B=$('#arcBody');if(!B)return;const D=ARC.dog||(ARC.dog={field:newField('dog'),pick:0,bet:10,running:false,R:null,u:0,last:'Pick a dog and place a bet. The race takes six seconds.'});
  B.innerHTML=`<canvas id="dogCv" width="360" height="190"></canvas>
    <div class="runners">${D.field.map((f,i)=>`<button class="runner ${D.pick===i?'on':''}" data-dog="${i}" ${D.running?'disabled':''}><i style="background:${f.silk[0]}">${i+1}</i>${esc(f.name)}<b>${f.odds.toFixed(1)}</b></button>`).join('')}</div>
    ${betRowArc(D.bet,[10,25,50])}<div class="slres">${D.last}</div><div class="mgrow"><button class="pb main" id="dogGo" ${D.running||G.me.chips<D.bet?'disabled':''}>Race · ${D.bet}</button></div>`;
  B.querySelectorAll('[data-dog]').forEach(b=>b.addEventListener('click',()=>{D.pick=+b.dataset.dog;Snd.play('click');renderDog();}));
  B.querySelectorAll('[data-abet]').forEach(b=>b.addEventListener('click',()=>{D.bet=+b.dataset.abet;Snd.play('chips');renderDog();}));
  const g=$('#dogGo');if(g)g.addEventListener('click',dogGo);drawTrack($('#dogCv'),'dog',D.field,D.R,D.u);}
function betRowArc(sel,opts){return `<div class="mgbets">${opts.map(n=>`<button class="pb ${n===sel?'on':''}" data-abet="${n}" ${G.me.chips<n?'disabled':''}>${icon('chips')}${n}</button>`).join('')}</div>`;}
function dogGo(){const D=ARC.dog;if(!D||D.running||G.me.chips<D.bet)return;G.me.chips-=D.bet;D.paid=D.bet;D.running=true;D.R=raceFinish(6,D.field.map(f=>f.p),Math.random);D.u=0;D.last='And they\'re off!';Snd.play('wave');renderDog();
  const t0=performance.now(),dur=6000;const step=()=>{if(ARC.dog!==D)return;D.u=Math.min(1.12,(performance.now()-t0)/dur*1.12);const cv=$('#dogCv');if(cv)drawTrack(cv,'dog',D.field,D.R,D.u);
    if(D.u<1.12)requestAnimationFrame(step);else{D.running=false;const w=D.R.win,f=D.field[w];if(w===D.pick){const amt=Math.round(D.paid*f.odds);G.me.chips+=amt;G.stats.earned+=amt-D.paid;D.last=`${f.name} wins! You collect ${fmt(amt)} chips.`;Snd.play('win');if(f.odds>=6){for(let i=0;i<40;i++)confetti();gameLog(`Dog track: ${f.name} came in at ${f.odds.toFixed(1)}. +${fmt(amt)} chips.`,'good');}}
      else{D.last=`${f.name} wins. Your dog finished down the field.`;Snd.play('fold');}
      setTimeout(()=>{if(ARC.dog===D&&!D.running){D.field=newField('dog');D.R=null;D.u=0;if(ARC.tab==='dog')renderDog();}},2600);renderDog();}};requestAnimationFrame(step);}

/* ---------- Derby Night: a table event with a real long-shot payout ---------- */
function derbyHTML(){const D=MG.derby||(MG.derby={field:newField('horse'),pick:-1,R:null,u:0});const st=MG.state;
  const list=`<div class="runners">${D.field.map((f,i)=>`<button class="runner ${D.pick===i?'on':''}" data-horse="${i}" ${st!=='bet'||MG.done?'disabled':''}><i style="background:${f.silk[0]};color:${f.silk[1]}">${i+1}</i>${esc(f.name)}<b>${f.odds.toFixed(1)}</b></button>`).join('')}</div>`;
  return `<canvas id="derbyCv" width="408" height="210"></canvas>${st==='bet'&&!MG.done?`<p class="mglead">Pick a horse. Anything at 8.0 or longer that wins pays its odds <em>and</em> a special prize.</p>${list}${betRow(MG.bet)}<div class="mgrow"><button class="pb main" id="derbyGo" ${D.pick>=0&&G.me.chips>=MG.bet?'':'disabled'}>Bet ${MG.bet} and race</button></div>`:`<div class="mgres">${MG.res||D.call||''}</div>`}`;}
function derbyWire(){const D=MG.derby;const el=$('#mgPanel');el.querySelectorAll('[data-horse]').forEach(b=>b.addEventListener('click',()=>{D.pick=+b.dataset.horse;Snd.play('click');renderMinigame();}));
  const g=$('#derbyGo');if(g)g.addEventListener('click',derbyGo);drawTrack($('#derbyCv'),'horse',D.field,D.R,D.u);}
function derbyGo(){const D=MG&&MG.derby;if(!D||MG.state!=='bet'||D.pick<0)return;const bet=Math.min(MG.bet,G.me.chips);if(bet<=0)return;G.me.chips-=bet;MG.paid=bet;MG.state='race';D.R=raceFinish(6,D.field.map(f=>f.p),Math.random);D.u=0;Snd.play('wave');
  const lines=[];renderMinigame();const t0=performance.now(),dur=9000;let lastCall=0;
  const step=()=>{if(!MG||MG.derby!==D)return;D.u=Math.min(1.1,(performance.now()-t0)/dur*1.1);const cv=$('#derbyCv');if(cv)drawTrack(cv,'horse',D.field,D.R,D.u);
    if(performance.now()-lastCall>1800&&D.u<1){lastCall=performance.now();const pos=D.field.map((_,i)=>[i,racePos(i,D.u,D.R)]).sort((a,b)=>b[1]-a[1]);const lead=D.field[pos[0][0]].name,second=D.field[pos[1][0]].name;
      D.call=D.u<.25?`They're away! ${lead} breaks well.`:D.u<.6?`${lead} leads, ${second} on the rail.`:D.u<.85?`Into the straight: ${lead} from ${second}!`:`${lead} and ${second}, neck and neck!`;const r=$('.mgres');if(r)r.textContent=D.call;}
    if(D.u<1.1)requestAnimationFrame(step);else derbySettle();};requestAnimationFrame(step);}
function derbySettle(){const D=MG.derby,w=D.R.win,f=D.field[w];MG.state='done';let extra='';
  if(w===D.pick){const amt=Math.round(MG.paid*f.odds);G.me.chips+=amt;G.stats.earned+=amt-MG.paid;if(f.odds>=8){extra=' · '+specialPrize();if(typeof Meta!=='undefined')Meta.ach('longshot');Snd.play('jackpot');for(let i=0;i<90;i++)confetti();}else Snd.play('win');
    MG.res=`${f.name} wins at ${f.odds.toFixed(1)}! +${fmt(amt)} chips${extra}`;gameLog(`Derby Night: ${f.name} won. You collected ${fmt(amt)} chips${extra}.`,'good');}
  else{MG.res=`${f.name} wins at ${f.odds.toFixed(1)}. Your horse ran down the field.`;Snd.play('fold');gameLog(`Derby Night: ${f.name} won at ${f.odds.toFixed(1)}.`);}
  finishMinigame();}
