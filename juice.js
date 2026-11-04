'use strict';
/* ============ ALL IN — table-night juice ============
   Roulette: a real wheel with a ball that orbits, drops, rattles over the frets and seats; chips on the felt; a history board.
   Blackjack: a felt table, cards dealt from the shoe, a hole card that flips, a dealer who draws one card at a time, stamped results.
   Dog track: the new greyhound art in trap jackets and muzzles, opening traps, a lure, dust, live commentary and a photo finish.
   Payouts are untouched: every settle below uses the same maths as minigames.js / arcade.js. */

/* ---------- sounds ---------- */
Object.assign(FOLEY,{
  ball(t){FX.click(t,4200+Math.random()*1400,9,.1,.022);},
  roll(t){FX.sweep(t,2400,1800,'bandpass',.035,.22,3);},
  drop(t){FX.click(t,2600,6,.2,.04);FX.click(t+.08,3400,8,.14,.03);FX.click(t+.17,3000,8,.09,.03);FX.thump(t,520,220,.06,.08);},
  flip(t){FX.slide(t,.2);FX.click(t+.05,1400,3,.08,.04);},
  stamp(t){FX.thump(t,150,50,.22,.2);FX.click(t,900,2,.14,.06);},
  traps(t){FX.thump(t,230,70,.22,.16);for(let i=0;i<6;i++)FX.click(t+i*.014,1300+i*90,4,.16,.06);},
  lure(t){FX.sweep(t,280,1700,'bandpass',.07,1.3,4);},
  shutter(t){FX.click(t,5200,6,.22,.03);FX.click(t+.07,3600,6,.16,.04);},
  paws(t){for(let i=0;i<4;i++)FX.thump(t+i*.028,95,45,.035,.05);}
});
const sndGap={};function sndEvery(n,ms){const now=performance.now();if(sndGap[n]&&now-sndGap[n]<ms)return;sndGap[n]=now;Snd.play(n);}

/* ---------- shared bits ---------- */
function countUp(el,to,ms,pre){if(!el)return;const t0=performance.now();
  const f=()=>{if(!el.isConnected)return;const k=Math.min(1,(performance.now()-t0)/ms),e=1-Math.pow(1-k,3);el.textContent=(pre||'')+fmt(Math.round(to*e));
    if(k<1){if(Math.random()<.35)sndEvery('chips',70);requestAnimationFrame(f);}};requestAnimationFrame(f);}
const CHIP_COL={10:'#2563eb',25:'#16a34a',50:'#dc2626',100:'#1f2937'};
function chipStackHTML(amt,cls,label){const out=[];let a=amt;for(const v of [100,50,25,10]){while(a>=v&&out.length<7){out.push(v);a-=v;}}if(!out.length)out.push(10);
  return `<div class="jstack ${cls||''}">${out.reverse().map((v,i)=>`<i class="jchip" style="--c:${CHIP_COL[v]};--i:${i}"></i>`).join('')}${label?`<b>${fmt(amt)}</b>`:''}</div>`;}
// longer look at the result for the two table games
finishMinigame=function(){if(!MG||MG.done)return;MG.done=true;renderMinigame();const m=MG,hold=(m.kind==='roulette'||m.kind==='blackjack')?3800:2600;
  setTimeout(()=>{if(MG===m&&MG.done)closeMinigame();},hold);};
// walking away mid-spin or mid-hand still settles the bet
{const _cm=closeMinigame;closeMinigame=function(){const m=MG;
  if(m&&m.kind==='roulette'&&m.state==='spin')rouSettle(true);
  if(m&&m.kind==='blackjack'&&['deal','play','wait','dealer'].includes(m.state))bjFinishNow(m);
  return _cm.apply(this,arguments);};}

/* =====================================================================
   ROULETTE
   ===================================================================== */
const ROU={base:Math.random()*TAU,lastI:-1,raf:0,fret:null,rollT:0};
const ROU_IDLE=.32,ROU_ORDER=['zero','red','black','low','odd','even','high'];
const rouCol=n=>n===0?'green':RED.has(n)?'red':'black';
function rouHist(){if(!G.rouHist){G.rouHist=[];for(let i=0;i<7;i++)G.rouHist.push(WHEEL[(Math.random()*37)|0]);}return G.rouHist;}
rouHTML=function(){const st=MG.state,h=rouHist(),done=st==='done';
  const hist=`<div class="rouhist"><small>Last spins</small>${h.slice(-10).map((n,i,a)=>`<b class="${rouCol(n)} ${done&&i===a.length-1?'new':''}">${n}</b>`).join('')}</div>`;
  const amt=st==='bet'?MG.bet:MG.paid;
  const board=`<div class="rougrid ${st!=='bet'||MG.done?'locked':''}">${ROU_ORDER.map(k=>{const [n,x]=ROU_BETS[k],on=MG.choice===k,res=done&&on?(MG.won?'win':'lose'):'';
    return `<button class="rb ${k} ${on?'on':''} ${res}" data-rb="${k}"><span>${n}</span><small>${x}×</small>${on&&amt?chipStackHTML(amt,'onbet')+(res==='win'?chipStackHTML(MG.wonAmt-MG.paid,'onbet pay'):''):''}</button>`;}).join('')}</div>`;
  let foot;
  if(st==='bet'&&!MG.done)foot=`${betRow(MG.bet)}<div class="mgrow"><button class="pb main" id="rouSpin" ${MG.choice&&G.me.chips>=MG.bet?'':'disabled'}>${MG.choice?'Spin '+MG.bet:'Pick a bet'}</button></div>`;
  else foot=`<div class="mgres rou">${st==='spin'?'<span class="nomore">No more bets…</span>':MG.res||''}</div>`;
  return `${hist}<canvas id="rouCv" width="760" height="760"></canvas>${st==='bet'&&!MG.done?'<p class="mglead rl">Zero pays 30 to 1 <em>and</em> a special prize.</p>':''}${board}${foot}`;};
rouWire=function(){const el=$('#mgPanel');el.querySelectorAll('[data-rb]').forEach(b=>b.addEventListener('click',()=>{if(MG.state!=='bet'||MG.done)return;MG.choice=b.dataset.rb;Snd.play('chips');renderMinigame();}));
  const s=$('#rouSpin');if(s)s.addEventListener('click',rouSpin);drawWheel();rouKick();};
function rouKick(){if(!ROU.raf)ROU.raf=requestAnimationFrame(rouLoop);}
function rouLoop(){ROU.raf=0;if(!MG||MG.kind!=='roulette'||!$('#rouCv'))return;rouStep();drawWheel();ROU.raf=requestAnimationFrame(rouLoop);}
rouSpin=function(){if(!MG||MG.state!=='bet'||!MG.choice)return;const bet=Math.min(MG.bet,G.me.chips);if(bet<=0){finishMinigame();return;}
  G.me.chips-=bet;gambleTally(-bet);MG.paid=bet;MG.state='spin';MG.result=WHEEL[(Math.random()*WHEEL.length)|0];
  const now=performance.now()/1000;MG.rw={t0:now,D:4.6,wa0:ROU.base+now*ROU_IDLE,A:TAU*(1.5+Math.random()*.5),K:6.5+Math.random()*1.5,resI:WHEEL.indexOf(MG.result),dropped:false};
  MG.t=Math.max(MG.t,6);ROU.fret=null;renderMinigame();Snd.play('chips');Snd.play('deal');rouKick();};
// the wheel spins one way, the ball the other; it orbits, drops past the diamonds, rattles over the frets and seats
function rouW(now){const r=MG&&MG.rw;if(!r)return ROU.base+now*ROU_IDLE;const k=Math.min(1,(now-r.t0)/r.D);return r.wa0+ROU_IDLE*(now-r.t0)+r.A*(1-(1-k)*(1-k));}
function rouBall(now){const r=MG&&MG.rw,W=rouW(now);
  if(!r){if(ROU.lastI<0)return null;return {a:W+(ROU.lastI+.5)/WHEEL.length*TAU,r:117,k:1};}
  const k=Math.min(1,(now-r.t0)/r.D),pa=(r.resI+.5)/WHEEL.length*TAU;let rel=r.K*TAU*Math.pow(1-k,2.4),rad;
  if(k<.58)rad=166-Math.sin(now*9)*.6;
  else if(k<.72){const q=(k-.58)/.14;rad=166-49*q*q;}
  else if(k<.92){const q=(k-.72)/.2;rad=117+15*Math.abs(Math.sin(q*Math.PI*3))*Math.pow(1-q,1.5);rel+=.24*Math.sin(q*Math.PI*3)*(1-q)*(1-q);}
  else rad=117;
  return {a:W+pa+rel,r:rad,k,rel};}
function rouStep(){const r=MG.rw;if(!r||MG.state!=='spin')return;const now=performance.now()/1000,b=rouBall(now),k=b.k;
  if(k<.58){if(now-ROU.rollT>.2){ROU.rollT=now;Snd.play('roll');}}
  else{if(!r.dropped&&k>=.72){r.dropped=true;Snd.play('drop');}
    const f=Math.floor(b.rel/(TAU/WHEEL.length));if(ROU.fret!==null&&f!==ROU.fret&&k<.95)sndEvery('ball',45);ROU.fret=f;}
  if(k>=1)rouSettle();}
rouSettle=function(quiet){const m=MG;if(!m||m.state!=='spin')return;const n=m.result,[name,x,test]=ROU_BETS[m.choice],col=rouCol(n);m.state='done';
  const h=rouHist();h.push(n);if(h.length>14)h.shift();
  if(m.rw){m.rw.st=performance.now()/1000;ROU.base=m.rw.wa0+m.rw.A-ROU_IDLE*m.rw.t0;ROU.lastI=m.rw.resI;}
  let win=0,extra='';
  if(test(n)){win=m.paid*x;G.me.chips+=win;gambleTally(win);G.stats.earned+=win-m.paid;m.won=true;m.wonAmt=win;
    if(n===0){extra=' · '+specialPrize();if(typeof Meta!=='undefined')Meta.ach('zero');if(!quiet){Snd.play('jackpot');for(let i=0;i<80;i++)confetti();}}else if(!quiet)Snd.play('potwin');
    m.res=`<b class="${col}">${n}</b> ${name} wins <span class="cup">+0</span>${extra?`<small>${extra.slice(3)}</small>`:''}`;gameLog(`Roulette: ${n} ${col}. You won ${fmt(win)} chips${extra}.`,'good');}
  else{m.res=`<b class="${col}">${n}</b> <span class="lost">${name} loses · −${fmt(m.paid)}</span>`;gameLog(`Roulette: ${n} ${col}. Your ${name} bet lost.`);if(!quiet)Snd.play('fold');}
  if(quiet)return;finishMinigame();if(win)countUp($('#mgPanel .mgres .cup'),win,900,'+');};
drawWheel=function(){const cv=$('#rouCv');if(!cv||!MG)return;const c=cv.getContext('2d');c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,380,380);
  const now=performance.now()/1000,N=WHEEL.length,W=rouW(now),ball=rouBall(now),st=MG.rw&&MG.rw.st,cx=190,cy=190;
  c.save();c.translate(cx,cy);
  // bowl: dark wood, a polished ball track, gold diamonds
  let g=c.createRadialGradient(0,0,140,0,0,188);g.addColorStop(0,'#6b3f1d');g.addColorStop(.55,'#4a2a12');g.addColorStop(1,'#1f1006');c.fillStyle=g;c.beginPath();c.arc(0,0,188,0,TAU);c.fill();
  c.strokeStyle='#d4a12a';c.lineWidth=2;c.beginPath();c.arc(0,0,186,0,TAU);c.stroke();
  g=c.createRadialGradient(-40,-60,20,0,0,178);g.addColorStop(0,'#8a5a32');g.addColorStop(1,'#3a210e');c.fillStyle=g;c.beginPath();c.arc(0,0,176,0,TAU);c.arc(0,0,152,0,TAU,true);c.fill();
  c.strokeStyle='rgba(255,230,180,.25)';c.lineWidth=1;c.beginPath();c.arc(0,0,172,Math.PI*1.05,Math.PI*1.6);c.stroke();
  for(let i=0;i<8;i++){const a=i/8*TAU+.2;c.save();c.rotate(a);c.translate(161,0);c.fillStyle='#f5d061';c.beginPath();c.moveTo(-5,0);c.lineTo(0,-2.6);c.lineTo(5,0);c.lineTo(0,2.6);c.closePath();c.fill();c.restore();}
  // rotor
  c.save();c.rotate(W);
  for(let i=0;i<N;i++){const a0=i/N*TAU,a1=(i+1)/N*TAU,n=WHEEL[i],col=n===0?'#15803d':RED.has(n)?'#b91c1c':'#111827';
    c.fillStyle=col;c.beginPath();c.arc(0,0,150,a0,a1);c.arc(0,0,128,a1,a0,true);c.closePath();c.fill();
    c.fillStyle=n===0?'#0f5a2b':RED.has(n)?'#7f1515':'#0b0f19';c.beginPath();c.arc(0,0,128,a0,a1);c.arc(0,0,106,a1,a0,true);c.closePath();c.fill();
    c.save();c.rotate((a0+a1)/2);c.translate(139,0);c.rotate(Math.PI/2);c.fillStyle='#fff';c.font='700 11px Barlow,Arial,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(n,0,.5);c.restore();}
  // frets between pockets, and the gold rings
  c.strokeStyle='#e9c46a';c.lineWidth=1.2;for(let i=0;i<N;i++){const a=i/N*TAU;c.beginPath();c.moveTo(Math.cos(a)*106,Math.sin(a)*106);c.lineTo(Math.cos(a)*150,Math.sin(a)*150);c.stroke();}
  c.lineWidth=2;for(const r of [150,128,106]){c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();}
  // the winning pocket glows once the ball has settled
  if(st&&MG.state==='done'){const i=MG.rw.resI,p=.55+.45*Math.sin((now-st)*7);c.save();c.globalCompositeOperation='lighter';c.fillStyle=`rgba(253,224,71,${.25+.3*p})`;c.beginPath();c.arc(0,0,151,i/N*TAU,(i+1)/N*TAU);c.arc(0,0,105,(i+1)/N*TAU,i/N*TAU,true);c.closePath();c.fill();c.restore();}
  // cone and turret
  g=c.createRadialGradient(-20,-24,6,0,0,106);g.addColorStop(0,'#9a6a3c');g.addColorStop(.6,'#5a3517');g.addColorStop(1,'#2e1a0a');c.fillStyle=g;c.beginPath();c.arc(0,0,104,0,TAU);c.fill();
  c.strokeStyle='rgba(233,196,106,.6)';c.lineWidth=1;c.beginPath();c.arc(0,0,64,0,TAU);c.stroke();
  for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2);g=c.createLinearGradient(0,-4,0,4);g.addColorStop(0,'#fff3c4');g.addColorStop(1,'#b8860b');c.fillStyle=g;c.beginPath();c.moveTo(14,-4);c.lineTo(58,-1.6);c.arc(60,0,3.2,-Math.PI/2,Math.PI/2);c.lineTo(14,4);c.closePath();c.fill();c.restore();}
  g=c.createRadialGradient(-5,-6,2,0,0,18);g.addColorStop(0,'#fff6d0');g.addColorStop(1,'#a8770c');c.fillStyle=g;c.beginPath();c.arc(0,0,16,0,TAU);c.fill();
  c.restore();
  // the ball: shadow, body, highlight
  if(ball){const bx=Math.cos(ball.a)*ball.r,by=Math.sin(ball.a)*ball.r;c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.arc(bx+1.5,by+2,6,0,TAU);c.fill();
    g=c.createRadialGradient(bx-2,by-2,1,bx,by,6.5);g.addColorStop(0,'#fff');g.addColorStop(.7,'#e5e7eb');g.addColorStop(1,'#9ca3af');c.fillStyle=g;c.beginPath();c.arc(bx,by,6,0,TAU);c.fill();}
  // the number pops up over the turret
  if(st&&MG.state==='done'){const n=MG.result,k=Math.min(1,(now-st)/.5),sc=k<1?1+Math.sin(k*Math.PI)*.35-(1-k)*.6:1+.03*Math.sin((now-st)*6);
    c.save();c.scale(Math.max(.01,sc),Math.max(.01,sc));c.shadowColor=n===0?'#4ade80':RED.has(n)?'#f87171':'#fde047';c.shadowBlur=22;
    c.fillStyle=n===0?'#15803d':RED.has(n)?'#b91c1c':'#111827';c.beginPath();c.arc(0,0,34,0,TAU);c.fill();c.shadowBlur=0;c.strokeStyle='#fde68a';c.lineWidth=3;c.stroke();
    c.fillStyle='#fff';c.font='400 34px "Bowlby One SC","Barlow",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(n,0,2);c.restore();}
  c.restore();};

/* =====================================================================
   BLACKJACK
   ===================================================================== */
function bjSoft(cs){let t=0,a=0;for(const c of cs){if(c.v===14){t+=11;a++;}else t+=Math.min(10,c.v);}while(t>21&&a){t-=10;a--;}return {t,soft:a>0&&t<=21};}
function bjTot(cs,done,lone){if(!cs||!cs.length)return '';const {t,soft}=bjSoft(cs);
  const cls=t>21?'bust':cs.length===2&&t===21&&!lone?'bj':t===21?'t21':'';const txt=t>21?'Bust · '+t:cls==='bj'?'Blackjack':soft&&!done&&t<21?`${t-10} / ${t}`:t;
  return `<span class="bjtot ${cls}" data-k="${cs.length}-${t}">${txt}</span>`;}
function bjCardsHTML(cs,who){const seen=(MG.seen&&MG.seen[who])||0;
  return cs.map((c,i)=>{const fly=i>=seen,style=fly?`style="--fx:${384-i*64}px;--fy:${who==='d'?-4:-148}px"`:'';
    if(who==='d'&&i===1){const open=MG.holeOpen;return `<div class="hole ${open?'open':''} ${open&&MG.flipAnim?'flip':''} ${fly?'fly':''}" ${style}>${cardHTML(c,i,'')}<div class="card back"></div></div>`;}
    const card=cardHTML(c,i,fly?'fly':'').replace('class="card',`${style} class="card`);
    return who==='p'&&MG.dbl&&i===cs.length-1?`<div class="dblw">${card}</div>`:card;}).join('');}
bjHTML=function(){const st=MG.state,done=st==='done';const dh=MG.dh||[],ph=MG.ph||[];
  const dShow=MG.holeOpen?dh:dh.slice(0,1);
  const amt=st==='bet'?MG.bet:MG.paid;const spot=amt?chipStackHTML(amt,'spot '+(done?MG.outcome||'':''),true)+(done&&MG.outcome==='win'?chipStackHTML(MG.winAmt-MG.paid,'spot pay',false):''):'';
  const stamp=done&&MG.stamp?`<div class="bjstamp ${MG.outcome==='win'&&MG.stampK==='bj'?'bj':MG.stampK}">${MG.stamp}</div>`:'';
  const felt=`<div class="bjfelt ${st}"><div class="bjshoe"></div>
    <div class="bjhand dealer"><div class="bjcards">${dh.length?bjCardsHTML(dh,'d'):'<div class="bjghost"></div><div class="bjghost"></div>'}</div>${bjTot(dShow,done,!MG.holeOpen)}</div>
    <div class="bjarc">Blackjack pays 3 to 2 · Dealer stands on 17</div>
    <div class="bjmid"><div class="bjspot">${spot}</div></div>
    <div class="bjhand you ${bjSoft(ph).t>21?'bust':''}"><div class="bjcards">${ph.length?bjCardsHTML(ph,'p'):'<div class="bjghost"></div><div class="bjghost"></div>'}</div>${bjTot(ph,done)}</div>${stamp}</div>`;
  let foot;
  if(st==='bet'&&!MG.done)foot=`<p class="mglead bjl">A natural blackjack pays 2.5× <em>and</em> a special prize.</p>${betRow(MG.bet)}<div class="mgrow"><button class="pb main" id="bjDeal" ${G.me.chips>=MG.bet?'':'disabled'}>Deal ${MG.bet}</button></div>`;
  else if(st==='play')foot=`<div class="mgrow bjbtns"><button class="pb" id="bjHit">Hit</button><button class="pb main" id="bjStand">Stand</button>${ph.length===2&&G.me.chips>=MG.paid?'<button class="pb" id="bjDbl">Double</button>':''}</div>`;
  else foot=`<div class="mgres bj">${done?MG.res||'':st==='dealer'?'<span class="nomore">Dealer plays…</span>':'<span class="nomore">&nbsp;</span>'}</div>`;
  return felt+foot;};
bjWire=function(){const d=$('#bjDeal');if(d)d.addEventListener('click',bjDeal);const h=$('#bjHit');if(h)h.addEventListener('click',bjHit);const s=$('#bjStand');if(s)s.addEventListener('click',bjStand);const x=$('#bjDbl');if(x)x.addEventListener('click',bjDouble);
  if(MG&&MG.ph){MG.seen={p:MG.ph.length,d:MG.dh.length};MG.flipAnim=false;}};
const bjLive=m=>MG===m&&!!$('#mgPanel');
function bjLater(m,ms,fn){m.t=Math.max(m.t,3);setTimeout(()=>{if(MG===m&&m.state!=='done')fn();},ms);}
bjDeal=function(){if(!MG||MG.state!=='bet')return;const bet=Math.min(MG.bet,G.me.chips);if(bet<=0)return;const m=MG;
  G.me.chips-=bet;gambleTally(-bet);m.paid=bet;m.deck=newDeck();m.ph=[];m.dh=[];m.seen={p:0,d:0};m.holeOpen=false;m.dbl=false;m.state='deal';Snd.play('chips');
  const seq=['ph','dh','ph','dh'];let k=0;
  const next=()=>{if(m.state!=='deal'||k>=seq.length)return;m[seq[k]].push(m.deck.pop());k++;Snd.play('card');renderMinigame();
    if(k<seq.length)bjLater(m,260,next);
    else bjLater(m,380,()=>{if(m.state!=='deal')return;if(bjVal(m.ph)===21){m.holeOpen=true;m.flipAnim=true;Snd.play('flip');m.state='wait';renderMinigame();bjLater(m,650,()=>bjSettle(true));}else{m.state='play';renderMinigame();}});};
  bjLater(m,60,next);};
bjHit=function(){if(!MG||MG.state!=='play')return;const m=MG;m.ph.push(m.deck.pop());Snd.play('card');const v=bjVal(m.ph);
  if(v>21){m.state='wait';renderMinigame();bjLater(m,420,()=>{m.holeOpen=true;m.flipAnim=true;Snd.play('flip');bjSettle();});return;}
  if(v===21){m.state='wait';renderMinigame();bjLater(m,420,bjStand);return;}renderMinigame();};
bjDouble=function(){if(!MG||MG.state!=='play')return;const m=MG,add=Math.min(m.paid,G.me.chips);G.me.chips-=add;gambleTally(-add);m.paid+=add;m.dbl=true;m.ph.push(m.deck.pop());Snd.play('chips');Snd.play('card');
  m.state='wait';renderMinigame();bjLater(m,480,()=>{if(bjVal(m.ph)>21){m.holeOpen=true;m.flipAnim=true;Snd.play('flip');bjSettle();}else bjStand();});};
bjStand=function(){if(!MG||!['play','wait'].includes(MG.state))return;const m=MG;m.state='dealer';m.holeOpen=true;m.flipAnim=true;Snd.play('flip');renderMinigame();
  const draw=()=>{if(bjVal(m.dh)<17){m.dh.push(m.deck.pop());Snd.play('card');renderMinigame();bjLater(m,620,draw);}else bjSettle();};bjLater(m,700,draw);};
// finish the deal at once (bots and tests)
function bjDealNow(m){if(!m||m.state!=='deal')return;while(m.ph.length<2||m.dh.length<2){if(m.ph.length<=m.dh.length)m.ph.push(m.deck.pop());else m.dh.push(m.deck.pop());}
  if(bjVal(m.ph)===21)bjSettle(true);else{m.state='play';if(bjLive(m))renderMinigame();}}
// the panel closed mid-hand: play it out instantly with the same rules
function bjFinishNow(m){if(!m.deck)return;while(m.ph.length<2)m.ph.push(m.deck.pop());while(m.dh.length<2)m.dh.push(m.deck.pop());
  const p=bjVal(m.ph);if(m.ph.length===2&&p===21&&!m.dbl)return bjSettle(true,true,m);if(p<=21)while(bjVal(m.dh)<17)m.dh.push(m.deck.pop());bjSettle(false,true,m);}
bjSettle=function(natural,quiet,mm){const m=mm||MG;if(!m||m.state==='done')return;m.state='done';m.holeOpen=true;const p=bjVal(m.ph),d=bjVal(m.dh);let win=0,txt,extra='',k;
  const dNat=m.dh.length===2&&d===21;
  if(natural&&!dNat){win=Math.round(m.paid*2.5);extra=' · '+specialPrize();txt='Blackjack!';k='bj';if(typeof Meta!=='undefined')Meta.ach('natural');if(!quiet){Snd.play('jackpot');for(let i=0;i<80;i++)confetti();}}
  else if(natural&&dNat){win=m.paid;txt='Both blackjack: push';k='push';}
  else if(p>21){txt='Bust';k='bust';}
  else if(d>21||p>d){win=m.paid*2;txt=d>21?'Dealer busts, you win':'You win';k='win';if(!quiet)Snd.play('potwin');}
  else if(p===d){win=m.paid;txt='Push';k='push';}
  else{txt='Dealer wins';k='lose';if(!quiet)Snd.play('fold');}
  if(win){G.me.chips+=win;gambleTally(win);G.stats.earned+=win-m.paid;}
  m.winAmt=win;m.outcome=win>m.paid?'win':win===m.paid&&win?'push':'lose';m.stampK=k;
  m.stamp={bj:'Blackjack!',win:d>21?'Dealer bust!':'You win',bust:'Bust',push:'Push',lose:'Dealer wins'}[k];
  m.res=win>m.paid?`${txt} <span class="cup">+0</span>${extra?`<small>${extra.slice(3)}</small>`:''}`:win?`${txt} · your ${fmt(win)} back`:`<span class="lost">${txt} · −${fmt(m.paid)}</span>`;
  gameLog(`Blackjack: you ${p}, dealer ${d}. ${txt}${win?', '+fmt(win)+' chips':''}${extra}.`,win>m.paid?'good':'');
  if(quiet||!bjLive(m))return;Snd.play('stamp');finishMinigame();if(win>m.paid)countUp($('#mgPanel .mgres .cup'),win,900,'+');};

/* =====================================================================
   DOG TRACK
   ===================================================================== */
// proper trap colours: 1 red, 2 blue, 3 white, 4 black, 5 orange, 6 black-and-white stripes
const TRAP_JACKETS=[['#d4202a','#fff'],['#1f4fd1','#fff'],['#f3f4f6','#111'],['#18181b','#fff'],['#f26a12','#111'],['#18181b','#dc2626']];
const GREY_COATS=['#2b2724','#d2b48c','#7d808a','#ece6da','#8a6646','#a8a29e','#57483c','#c9b8a0'];
{const _nf=newField;newField=function(kind){const f=_nf(kind);if(kind==='dog'){const coats=GREY_COATS.slice().sort(()=>Math.random()-.5);f.forEach((d,i)=>{d.silk=TRAP_JACKETS[i];d.coat=coats[i];});}return f;};}
function greyPal(f,i){if(f._pal&&f._pal.c===f.coat)return f._pal;const red=f.red||f.coat===RED_COAT,light=f.coat==='#ece6da';
  return f._pal={c:f.coat,d:shade(f.coat,light?-.18:-.3),b:red?RED_BELLY:light?'#fffaf0':shade(f.coat,.45),jacket:f.silk[0],jt:f.silk[1],stripe:i===5,num:String(i+1),muzzle:true};}
// a racing jacket: follows the topline from the withers to the loin, drapes down the ribs with a curved hem,
// light along the spine and darker at the hem, with a contrasting trim and a big number on the flank
function greyJacket(c,P,chestX,hipX,backY,arch){const mx=(hipX+chestX)/2,x0=hipX+1.2,x1=chestX+.6,tm=backY-2.2+arch;
  // top: exactly on the dog's topline; front: slopes back behind the elbow; hem: deepest at the ribs, rising to the loin
  const top=()=>{c.moveTo(x0,backY+1.7);c.quadraticCurveTo(mx,tm,x1,backY+.4);},
    edge=()=>{c.quadraticCurveTo(x1+.4,-3,chestX-3.2,2.5);c.quadraticCurveTo(mx-1,2.6+arch*.2,hipX+3.4,-1.4);c.quadraticCurveTo(x0-.6,-3,x0,backY+1.7);};
  const J=JACKET_LOOK[P.num]||JACKET_LOOK['1'];
  c.save();c.beginPath();top();edge();c.closePath();const g=c.createLinearGradient(0,backY-1.5,0,2.8);g.addColorStop(0,J.hi);g.addColorStop(.5,J.base);g.addColorStop(1,J.lo);c.fillStyle=g;c.fill();
  c.clip();if(J.stripe){c.fillStyle='#f4f4f5';for(let x=x0-1;x<x1+2;x+=3.2)c.fillRect(x,backY-4,1.6,16);c.fillStyle='rgba(0,0,0,.2)';c.fillRect(x0-2,-.5,x1-x0+4,4);}
  c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=.8;c.beginPath();c.moveTo(x0+1.5,backY+1.6);c.quadraticCurveTo(mx,tm+.9,x1-1.2,backY+1.3);c.stroke();c.restore();
  // trim on the edges and hem only, so it reads as cloth on the dog rather than a sticker
  c.beginPath();c.moveTo(x1,backY+.4);edge();c.strokeStyle=J.trim;c.lineWidth=.7;c.stroke();
  const nx=mx+1.6,ny=backY+5.2+arch*.3;c.font='900 7px Barlow,Arial,sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
  if(J.disc){c.fillStyle=J.disc;c.beginPath();c.arc(nx,ny,3.2,0,TAU);c.fill();}
  c.lineWidth=1.2;c.strokeStyle=J.out;c.strokeText(P.num,nx,ny+.3);c.fillStyle=J.num;c.fillText(P.num,nx,ny+.3);}
// the real trap colours, given some cloth: 1 red, 2 blue, 3 white, 4 black, 5 orange, 6 black-and-white stripes
const JACKET_LOOK={
  '1':{base:'#d4202a',hi:'#f0444c',lo:'#8f1018',trim:'#fff',num:'#fff',out:'rgba(80,0,0,.55)'},
  '2':{base:'#1f4fd1',hi:'#4f7cf0',lo:'#122f86',trim:'#fff',num:'#fff',out:'rgba(0,10,60,.55)'},
  '3':{base:'#f3f4f6',hi:'#ffffff',lo:'#c9ccd3',trim:'#1f2937',num:'#111',out:'rgba(255,255,255,.7)'},
  '4':{base:'#18181b',hi:'#3a3a42',lo:'#09090b',trim:'#f4f4f5',num:'#fff',out:'rgba(0,0,0,.6)'},
  '5':{base:'#f26a12',hi:'#ff9440',lo:'#b0470a',trim:'#111',num:'#111',out:'rgba(255,220,180,.5)'},
  '6':{base:'#18181b',hi:'#2e2e33',lo:'#09090b',trim:'#f4f4f5',num:'#dc2626',out:'#fff',stripe:true,disc:'#fff'}};
function greyMuzzle(c,hx,hy){c.save();c.strokeStyle='rgba(150,150,160,.9)';c.lineWidth=.45;c.beginPath();c.moveTo(hx+2.4,hy-2.4);c.lineTo(hx+10.2,hy+.3);c.lineTo(hx+9.7,hy+2.9);c.lineTo(hx+2.4,hy+3.5);c.closePath();c.stroke();
  c.beginPath();c.moveTo(hx+5.2,hy-1.5);c.lineTo(hx+5.2,hy+3.3);c.moveTo(hx+7.7,hy-.7);c.lineTo(hx+7.7,hy+3.1);c.stroke();c.strokeStyle='rgba(60,60,66,.8)';c.lineWidth=.55;c.beginPath();c.moveTo(hx+2.4,hy-1.6);c.lineTo(hx-2.6,hy-1.2);c.stroke();c.restore();}
const DOG_S=.8,ORD=['1st','2nd','3rd','4th','5th','6th'],ORD_COL=['#fbbf24','#e5e7eb','#d97706','#4b5563','#4b5563','#4b5563'];
function sandPat(c,cv){if(cv._sand)return cv._sand;const p=document.createElement('canvas');p.width=96;p.height=48;const g=p.getContext('2d');g.fillStyle='#c48a45';g.fillRect(0,0,96,48);
  for(let i=0;i<300;i++){g.fillStyle=Math.random()<.5?'rgba(255,232,190,.2)':'rgba(90,50,10,.16)';g.fillRect(Math.random()*96,Math.random()*48,1+Math.random()*1.5,1);}
  for(let y=3;y<48;y+=6){g.fillStyle='rgba(120,70,20,.1)';g.fillRect(0,y,96,1);}return cv._sand=c.createPattern(p,'repeat');}
function dogX(i,u,R,G0){const raw=u/R.T[i];if(raw<=1)return {x:G0.sx+(G0.ex-G0.sx)*racePos(i,u,R),spd:1,raw};const o=raw-1;return {x:G0.ex+22*(1-Math.exp(-o*14)),spd:Math.exp(-o*14),raw};}
function drawDogTrack(cv,field,R,u){if(cv.width<700){cv.width=720;cv.height=380;cv._sand=null;}const c=cv.getContext('2d');c.setTransform(2,0,0,2,0,0);
  const W2=360,H2=190,now=performance.now()/1000,lanes=field.length,top=16,bot=H2-22,lh=(bot-top)/lanes,fl=W2-30,G0={sx:31,ex:fl-25};
  const D=ARC.dog,pick=D&&D.field===field?D.pick:-1,running=R&&!R.stop;
  if(R){if(!R.gp){R.gp=field.map(()=>Math.random());R.lt=now;R.cross=[];R.call='';R.cs=0;}}
  const dt=R?Math.min(.05,Math.max(0,now-R.lt)):0;if(R)R.lt=now;
  if(running&&!R.started){R.started=true;Snd.play('traps');Snd.play('lure');}
  // grandstand lights, outer rail
  c.fillStyle='#10241a';c.fillRect(0,0,W2,top);for(let x=5;x<W2;x+=10){const on=(Math.floor(now*(running?8:2)+x/10)%3)===0;c.fillStyle=on?'#fde68a':'#4a3d22';c.beginPath();c.arc(x,5.5,1.5,0,TAU);c.fill();}
  c.fillStyle=sandPat(c,cv);c.fillRect(0,top,W2,bot-top);
  c.fillStyle='rgba(255,255,255,.07)';for(let i=1;i<lanes;i++)c.fillRect(54,top+i*lh,fl-54,1);
  c.fillStyle='#f8fafc';c.fillRect(0,top-3,W2,2);for(let x=4;x<W2;x+=16)c.fillRect(x,top-4,1.5,4);
  // inside rail and the lure rail
  c.fillStyle='#163322';c.fillRect(0,bot,W2,H2-bot);c.fillStyle='#f8fafc';c.fillRect(0,bot,W2,2);c.fillStyle='#94a3b8';c.fillRect(0,bot+13,W2,2);
  // the player's lane
  if(pick>=0){c.fillStyle=`rgba(255,196,60,${.12+.05*Math.sin(now*4)})`;c.fillRect(0,top+pick*lh,W2,lh);}
  // finish line, chequer and judge's post
  c.fillStyle='rgba(255,255,255,.9)';c.fillRect(fl,top,2,bot-top);for(let k=0;k*4<bot-top;k++){c.fillStyle=k%2?'#111':'#fff';c.fillRect(fl+2,top+k*4,4,4);c.fillStyle=k%2?'#fff':'#111';c.fillRect(fl+6,top+k*4,4,4);}
  c.fillStyle='#dc2626';c.fillRect(fl-4,0,12,9);c.fillStyle='#fff';c.fillRect(fl-2,2,8,4);
  // traps: the boxes behind the dogs; the doors and number plates go on after
  const open=R?Math.min(1,u/.025):0;
  for(let i=0;i<lanes;i++){const y0=top+i*lh;c.fillStyle='#262a31';c.fillRect(0,y0+1,56,lh-2);c.fillStyle='#14161a';c.fillRect(2,y0+3,52,lh-6);}
  // the runners, top lane first so the nearer dogs overlap
  const pos=field.map((f,i)=>R?dogX(i,u,R,G0):{x:G0.sx,spd:0,raw:0});
  field.forEach((f,i)=>{const y=top+i*lh+lh*.56,P=greyPal(f,i),p=pos[i];let x=p.x;const moving=running&&p.spd>.18;
    if(R&&moving)R.gp[i]=(R.gp[i]+dt*(3.2+.25*Math.sin(i*1.7))*Math.max(.45,p.spd))%1;
    // dust kicked up behind
    if(moving)for(let k=0;k<4;k++){const ph=(now*3+i*.37+k*.25)%1;c.fillStyle=`rgba(236,200,150,${(.32-.07*k)*(1-ph)*p.spd})`;c.beginPath();c.arc(x-15-k*5-ph*8,y+9-ph*3,1.6+k*.8+ph*2,0,TAU);c.fill();}
    c.fillStyle='rgba(60,30,0,.32)';c.beginPath();c.ellipse(x+2,y+10.6,moving?16:14,2.4,0,0,TAU);c.fill();
    // the winner glows after the line
    if(R&&R.cross[i]!=null&&i===R.win){c.save();c.globalCompositeOperation='lighter';const a=.25+.15*Math.sin(now*6);const g=c.createRadialGradient(x,y,2,x,y,30);g.addColorStop(0,`rgba(253,224,71,${a})`);g.addColorStop(1,'rgba(253,224,71,0)');c.fillStyle=g;c.fillRect(x-30,y-30,60,60);c.restore();}
    c.save();c.translate(x,y+(moving?0:Math.sin(now*2+i)*.25));drawGreyhound(c,moving?'run':'stand',moving?gaitPhase(R.gp[i]):0,DOG_S,P);c.restore();
    if(i===pick){const by=y-22+Math.sin(now*5)*1.5;c.fillStyle='#fbbf24';c.beginPath();c.moveTo(x+6,by+6);c.lineTo(x+1.5,by);c.lineTo(x+10.5,by);c.closePath();c.fill();c.font='800 7px Barlow,Arial,sans-serif';c.textAlign='center';c.fillText('YOU',x+6,by-4);}
    if(R&&p.raw>=1&&R.cross[i]==null)R.cross[i]=now;});
  // trap doors lift as the lure passes: a grille you can see the dog through, then the trap's number plate
  for(let i=0;i<lanes;i++){const y0=top+i*lh,h=(lh-2)*(1-open);
    if(h>.5){c.save();c.beginPath();c.rect(12,y0+1,44,h);c.clip();c.fillStyle='rgba(20,22,26,.35)';c.fillRect(12,y0+1,44,h);c.fillStyle='#9ca3af';
      for(let x=14;x<56;x+=4)c.fillRect(x,y0+1,1.2,lh);c.fillRect(12,y0+1+h-2,44,2);c.fillRect(54,y0+1,2,h);c.restore();}
    const J=field[i].silk;c.fillStyle=i===5?'#111':J[0];c.fillRect(1,y0+2,11,lh-4);if(i===5){c.fillStyle='#f8fafc';for(let x=2;x<12;x+=4)c.fillRect(x,y0+2,2,lh-4);c.fillRect(2.5,y0+lh/2-6,8,12);}
    c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=.8;c.strokeRect(1.4,y0+2.4,10.2,lh-4.8);c.fillStyle=i===5?'#dc2626':J[1];c.font='800 11px Barlow,Arial,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(i+1,6.5,y0+lh/2+.5);}
  // the lure, always just ahead of the pack
  if(R){const lead=Math.max(...pos.map(p=>p.x)),ov=Math.max(0,...pos.map(p=>p.raw))-1,lx=lead+34+Math.max(0,ov)*900;if(lx<W2+20){const ly=bot+9;
    c.strokeStyle='#cbd5e1';c.lineWidth=1.5;c.beginPath();c.moveTo(lx-6,bot+14);c.lineTo(lx,ly);c.stroke();c.fillStyle='#f5f5f4';c.beginPath();c.ellipse(lx,ly-1,6,3.6,0,0,TAU);c.fill();c.beginPath();c.ellipse(lx+4.5,ly-5,1.6,4,.35,0,TAU);c.fill();
    if(running){c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1;for(let k=0;k<3;k++){c.beginPath();c.moveTo(lx-10-k*4,ly-3+k*2);c.lineTo(lx-18-k*6,ly-3+k*2);c.stroke();}}}}
  // places pop up by the traps as each dog crosses
  if(R){const order=field.map((_,i)=>i).sort((a,b)=>R.T[a]-R.T[b]);const over=!running&&u>=1.2;order.forEach((i,k)=>{if(R.cross[i]==null){if(!over)return;R.cross[i]=now;}const age=now-R.cross[i],s=age<.3?.6+age/.3*.5:age<.45?1.1-(age-.3)/.15*.1:1,y=top+i*lh+lh/2;
    c.save();c.translate(70,y);c.scale(s,s);c.fillStyle=ORD_COL[k];c.beginPath();c.roundRect?c.roundRect(-14,-7,28,14,7):c.rect(-14,-7,28,14);c.fill();c.fillStyle=k<3?'#1b1b22':'#e5e7eb';c.font='800 9px Barlow,Arial,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(ORD[k],0,.5);c.restore();});}
  // the photo flash
  if(R&&R.flash){const a=Math.max(0,1-(now-R.flash)/.35);if(a>0){c.fillStyle=`rgba(255,255,255,${a*.7})`;c.fillRect(0,0,W2,H2);}}
  if(R&&running)dogCommentary(R,field,pos,u);
  if(R&&R.cross[R.win]!=null&&!R.photo){R.flash=now;Snd.play('shutter');try{const pc=document.createElement('canvas');pc.width=200;pc.height=(bot-top)*2;
      pc.getContext('2d').drawImage(cv,(fl-80)*2,top*2,200,(bot-top)*2,0,0,200,(bot-top)*2);R.photo=pc.toDataURL('image/jpeg',.8);}catch(e){R.photo='x';}}}
{const _dt=drawTrack;drawTrack=function(cv,kind,field,R,u){if(kind!=='dog'||!cv)return _dt.apply(this,arguments);drawDogTrack(cv,field,R,u);};}
// a race caller: who broke best, who leads, who's closing, who got it on the line
function dogCommentary(R,field,pos,u){const order=pos.map((p,i)=>[i,p.x]).sort((a,b)=>b[1]-a[1]).map(a=>a[0]),nm=i=>`<b style="color:${i===2?'#e5e7eb':i===3||i===5?'#cbd5e1':field[i].silk[0]}">${esc(field[i].name)}</b>`;
  const lead=order[0],sec=order[1],third=order[2];let call=null;
  if(R.cs===0&&u>.06){R.cs=1;call=`The traps fly open! ${nm(lead)} breaks best.`;}
  else if(R.cs===1&&u>.3){R.cs=2;call=`${nm(lead)} leads at the first bend, ${nm(sec)} on the rail.`;}
  else if(R.cs===2&&u>.58){R.cs=3;call=`Down the back straight: ${nm(lead)} from ${nm(sec)}, ${nm(third)} chasing.`;}
  else if(R.cs===3&&u>.82){R.cs=4;call=`Into the home straight… ${nm(lead)} and ${nm(sec)} neck and neck!`;Snd.play('crowd');}
  else if(R.cs===4&&R.cross[R.win]!=null){R.cs=5;const gap=Math.min(...R.T.filter((_,i)=>i!==R.win))-R.T[R.win];call=`${nm(R.win)} wins it${gap<.045?' by a short head!':'!'}`;}
  if(call){R.call=call;const el=$('#dogCall');if(el){el.innerHTML=call;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');}}}
// paws drum while the race is on
{let lastPaw=0;const drum=()=>{const D=ARC.dog;if(D&&D.running&&D.R&&!D.R.stop&&$('#dogCv')){const n=performance.now();if(n-lastPaw>120){lastPaw=n;Snd.play('paws');}}requestAnimationFrame(drum);};requestAnimationFrame(drum);}
// the panel around the canvas: caller line, trap-coloured badges, the photo finish, and a gentle idle loop between races
let DOG_IDLE=0;
function dogJuiceDom(){const D=ARC.dog,B=$('#arcBody');if(!D||!B||D.mp||dogStory().banned||!$('#dogCv'))return;
  B.querySelectorAll('.runner i').forEach((el,i)=>{const J=TRAP_JACKETS[i];if(!J)return;el.style.color=i===5?'#dc2626':J[1];el.style.background=i===5?'repeating-linear-gradient(90deg,#111 0 3px,#f8fafc 3px 6px)':J[0];if(i===2)el.style.boxShadow='inset 0 0 0 1px #94a3b8';});
  const cv=$('#dogCv'),host=cv.parentElement.classList.contains('dogwrap')?cv.parentElement:cv;
  if(!$('#dogCall'))host.insertAdjacentHTML('afterend',`<div class="dogcall" id="dogCall">${D.R&&D.R.call?D.R.call:'Six traps · 480 metres · the hare is running'}</div>`);
  const res=B.querySelector('.slres');
  if(res&&D.R&&!D.running&&D.R.photo&&D.R.photo!=='x'){res.classList.add('withphoto');res.insertAdjacentHTML('afterbegin',`<figure class="dogphoto"><img src="${D.R.photo}" alt=""><figcaption>Photo finish</figcaption></figure>`);
    if(D.R.win===D.pick)res.classList.add('won');}
  if(!DOG_IDLE)DOG_IDLE=requestAnimationFrame(dogIdle);}
function dogIdle(){DOG_IDLE=0;const D=ARC.dog,cv=$('#dogCv');if(!D||!cv||ARC.tab!=='dog'||D.mp||dogStory().banned)return;
  if(!D.running)drawTrack(cv,'dog',D.field,D.R,D.u);DOG_IDLE=setTimeout(()=>{DOG_IDLE=requestAnimationFrame(dogIdle);},40);}
{const _rd=renderDog;renderDog=function(){const r=_rd.apply(this,arguments);try{dogJuiceDom();}catch(e){console.error(e);}return r;};}

/* ---------- styles ---------- */
{const st=document.createElement('style');st.textContent=`
#rouCv{width:250px;height:250px;margin:2px auto 6px;filter:drop-shadow(0 8px 18px rgba(0,0,0,.55))}
.rouhist{display:flex;gap:3px;align-items:center;justify-content:center;margin:0 0 4px;min-height:20px}
.rouhist small{color:var(--muted);font:400 11px var(--head);margin-right:4px}
.rouhist b{min-width:20px;height:20px;border-radius:10px;font:700 11px/20px var(--body);text-align:center;color:#fff;padding:0 4px}
.rouhist b.red{background:#b91c1c}.rouhist b.black{background:#111827;box-shadow:inset 0 0 0 1px #4b5563}.rouhist b.green{background:#15803d}
.rouhist b.new{animation:jPop .6s cubic-bezier(.2,1.6,.4,1);box-shadow:0 0 0 2px #fde047,0 0 10px rgba(253,224,71,.7)}
.mglead.rl,.mglead.bjl{text-align:center;font-size:12px;margin:0 0 6px}
.mg.roulette .rougrid{grid-template-columns:.7fr 1fr 1fr 1fr;padding:7px;border-radius:12px;background:radial-gradient(ellipse at 50% 20%,#1f6b3f,#0d3520);box-shadow:inset 0 0 0 2px #c9a227,inset 0 0 0 4px #0a2414,0 6px 16px rgba(0,0,0,.4);margin-bottom:8px}
.mg.roulette .rb{position:relative;height:40px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.3);transition:filter .15s,opacity .2s,transform .12s}
.mg.roulette .rb:active{transform:scale(.97)}
.mg.roulette .rb.zero{grid-row:span 2;height:auto}
.mg.roulette .rb.on{box-shadow:inset 0 0 0 2px var(--amber),0 0 14px rgba(255,176,32,.5)}
.rougrid.locked .rb{pointer-events:none}.rougrid.locked .rb:not(.on){opacity:.45;filter:saturate(.6)}
.mg.roulette .rb.win{box-shadow:inset 0 0 0 2px #fde047,0 0 22px rgba(253,224,71,.8);animation:jGlow .5s ease-in-out 4 alternate}
.mg.roulette .rb.lose .jstack{animation:jSweep .55s .35s ease-in both}
.rb .jstack{position:absolute;right:5px;top:50%;margin-top:-12px;transform:scale(.62);transform-origin:right center}
.rb .jstack.pay{right:24px;animation:jPay .5s .25s cubic-bezier(.2,1.3,.4,1) both}
.jstack{position:relative;width:30px;height:30px;flex:none}
.jchip{position:absolute;left:0;bottom:calc(var(--i)*3px);width:30px;height:30px;border-radius:50%;background:radial-gradient(circle,var(--c) 0 40%,#f8fafc 41% 45%,var(--c) 46% 60%,transparent 61%),repeating-conic-gradient(var(--c) 0 22deg,#f8fafc 22deg 34deg);box-shadow:0 2px 0 rgba(0,0,0,.5),inset 0 0 0 1px rgba(0,0,0,.35)}
.jstack b{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:4px;font:700 11px var(--body);color:#fde68a;white-space:nowrap;text-shadow:0 1px 2px #000}
.mgres.rou{min-height:86px}.mgres.bj{min-height:44px}.mgres.rou,.mgres.bj{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;font-size:17px}
.mgres b{animation:jPop .5s cubic-bezier(.2,1.6,.4,1)}
.mgres .cup{color:#fde047;font-size:22px;text-shadow:0 0 12px rgba(253,224,71,.6)}
.mgres small{flex-basis:100%;text-align:center;color:#c4b5fd;font:400 13px var(--head)}
.mgres .lost{color:#a8a2b6}.mgres .nomore{color:#a8a2b6;font-size:14px;letter-spacing:.06em;animation:jBlink 1s ease-in-out infinite alternate}
@keyframes jPop{from{transform:scale(.3);opacity:0}}
@keyframes jGlow{to{filter:brightness(1.35)}}
@keyframes jSweep{to{transform:translate(-60px,-40px) scale(.3);opacity:0}}
@keyframes jPay{from{transform:translateY(-40px) scale(.62);opacity:0}to{transform:scale(.62)}}
@keyframes jBlink{from{opacity:.45}}
.mg.blackjack{width:460px}
.bjfelt{position:relative;border-radius:16px 16px 120px 120px/16px 16px 46px 46px;padding:10px 14px 18px;background:radial-gradient(ellipse at 50% 0%,#24804f,#0e3a22 78%);box-shadow:inset 0 0 0 2px #c9a227,inset 0 0 0 5px #0a2414,inset 0 0 40px rgba(0,0,0,.5),0 8px 20px rgba(0,0,0,.4);margin-bottom:6px}
.bjshoe{position:absolute;right:12px;top:12px;width:48px;height:30px;border-radius:4px 12px 4px 4px;background:linear-gradient(#4a3420,#20150c);box-shadow:0 0 0 1px #000,inset 0 0 0 2px #7a5530,0 4px 8px rgba(0,0,0,.5)}
.bjshoe:before{content:'';position:absolute;left:7px;top:-5px;width:30px;height:10px;border-radius:2px;background:var(--cardback) center/100% 100% no-repeat,#2a0b3d;transform:skewX(-24deg);box-shadow:0 0 0 1px #000}
.bjhand{display:flex;align-items:center;gap:10px;min-height:86px}
.bjhand .bjcards{min-height:84px;margin:0}
.bjghost{width:58px;height:84px;border-radius:7px;box-shadow:inset 0 0 0 1.5px rgba(253,230,138,.25);flex:none}
.bjtot{font:700 14px var(--body);min-width:30px;height:26px;border-radius:13px;padding:0 10px;display:grid;place-items:center;background:rgba(0,0,0,.6);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);animation:jPop .3s .2s cubic-bezier(.2,1.6,.4,1) both;white-space:nowrap}
.bjtot.bust{background:#b91c1c}.bjtot.bj,.bjtot.t21{background:linear-gradient(#fde047,#f59e0b);color:#1b1b22;box-shadow:0 0 14px rgba(253,224,71,.6)}
.bjarc{text-align:center;font:400 10px var(--head);letter-spacing:.16em;text-transform:uppercase;color:rgba(253,230,138,.7);margin:4px 0 2px}
.bjmid{display:flex;justify-content:center;margin:2px 0 10px}
.bjspot{position:relative;width:50px;height:50px;border-radius:50%;box-shadow:inset 0 0 0 2px rgba(253,230,138,.5);display:grid;place-items:center}
.bjspot .jstack.spot{transform:scale(.9)}.bjspot .jstack.pay{position:absolute;left:24px;top:6px;animation:jPay2 .55s .2s cubic-bezier(.2,1.3,.4,1) both}
.bjspot .jstack.lose{animation:jLose .6s .35s ease-in both}
.bjspot .jstack.win{filter:drop-shadow(0 0 8px rgba(253,224,71,.8))}
@keyframes jPay2{from{transform:translate(120px,-90px) scale(.6);opacity:0}to{transform:scale(.9)}}
@keyframes jLose{to{transform:translate(110px,-110px) scale(.4);opacity:0}}
.card.fly,.hole.fly{animation:bjFly .34s cubic-bezier(.2,.9,.3,1.05) both}
@keyframes bjFly{from{transform:translate(var(--fx),var(--fy)) rotate(-28deg) scale(.7);opacity:.3}to{transform:none;opacity:1}}
.dblw{transform:rotate(90deg);margin:0 13px;flex:none}
.hole{position:relative;flex:none}.hole .card{margin:0}.hole .card.back{position:absolute;inset:0}
.hole:not(.open)>.card:not(.back){visibility:hidden}.hole.open>.card.back{display:none}
.hole.flip>.card.back{display:block;animation:flipA .15s ease-in both}.hole.flip>.card:not(.back){animation:flipB .15s .15s ease-out both}
@keyframes flipA{to{transform:scaleX(0)}}@keyframes flipB{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.bjhand.bust .bjcards{animation:bjShake .45s}
@keyframes bjShake{20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
.bjstamp{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-8deg);font:400 30px var(--head);padding:4px 18px;border-radius:10px;border:3px solid;pointer-events:none;animation:stampIn .42s cubic-bezier(.2,1.5,.4,1) both;white-space:nowrap;background:rgba(10,6,16,.72);text-transform:uppercase;letter-spacing:.04em}
.bjstamp.win{color:#86efac;border-color:#86efac;text-shadow:0 0 12px rgba(134,239,172,.7)}
.bjstamp.bj{color:#fde047;border-color:#fde047;text-shadow:0 0 14px rgba(253,224,71,.9);font-size:38px;box-shadow:0 0 30px rgba(253,224,71,.5)}
.bjstamp.lose,.bjstamp.bust{color:#fca5a5;border-color:#f87171}.bjstamp.push{color:#e5e7eb;border-color:#9ca3af}
@keyframes stampIn{from{transform:translate(-50%,-50%) rotate(-8deg) scale(2.4);opacity:0}to{transform:translate(-50%,-50%) rotate(-8deg) scale(1);opacity:1}}
.bjbtns .pb{min-width:84px}
.dogcall{min-height:18px;margin:-2px 0 8px;padding:5px 9px;border-radius:7px;background:#14101c;box-shadow:inset 0 0 0 1px #3a3346;font:400 12.5px/1.3 var(--head);color:#e9e2f5}
.dogcall b{font-weight:400}.dogcall.pop{animation:callIn .35s ease-out}
@keyframes callIn{from{transform:translateY(4px);opacity:.2}}
.slres.withphoto{display:flex;align-items:center;gap:10px;text-align:left}
.dogphoto{margin:0;flex:none;padding:3px 3px 0;background:#f5f0e6;border-radius:2px;transform:rotate(-3deg);box-shadow:0 4px 10px rgba(0,0,0,.5);animation:photoIn .5s cubic-bezier(.2,1.4,.4,1)}
.dogphoto img{display:block;width:62px;height:auto;filter:sepia(.75) contrast(1.15) brightness(1.05)}
.dogphoto figcaption{font:700 7px/12px var(--body);color:#57534e;text-align:center;letter-spacing:.08em;text-transform:uppercase}
.slres.won{color:#fde047;text-shadow:0 0 10px rgba(253,224,71,.5)}
@keyframes photoIn{from{transform:rotate(-14deg) scale(.4);opacity:0}}
`;document.head.appendChild(st);}
