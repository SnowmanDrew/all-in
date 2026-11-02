'use strict';
/* ============ ALL IN — the slot machine and the table-event nights ============ */
const MINIGAME={4:'roulette',9:'blackjack',12:'sports',14:'derby',19:'roulette',22:'sports',24:'blackjack',29:'derby',32:'sports',34:'roulette'};
const MINI_NAME={roulette:'Roulette Night',blackjack:'Blackjack Night',derby:'Derby Night',sports:'Sports Night'};
const MINI_TIME=40;
const miniAfter=w=>MINIGAME[w]||null;

/* ---------- special prizes for zero and natural blackjack ---------- */
function specialPrize(){const opts=['creature','rank','repair','chips'];const k=opts[(Math.random()*opts.length)|0];
  if(k==='creature'){const pool=['s_hi','f_hi','fh_lo','fh_hi','q_lo','sf_lo'];const u=pool[(Math.random()*pool.length)|0];const ev={rank:UNITS[u].hand,high:UNITS[u].hi};spawnHandUnits(u,ev);return `A free ${UNITS[u].name}`;}
  if(k==='rank'){const all=G.units.slice().sort((a,b)=>b.kills-a.kills);const u=all.find(o=>(o.rank||0)<3);if(u){u.kills=Math.max(u.kills,rankNeed(u.k,(u.rank||0)+1));checkRank(u);return `${u.def.name} ranks up`;}}
  if(k==='repair'){G.base.hp=G.base.maxHp;addWorker();return 'Full casino repair and a free croupier';}
  G.me.chips+=200;G.stats.earned+=200;return '200 bonus chips';}

/* ---------- shared panel ---------- */
let MG=null;
function betRow(sel){const opts=[10,25,50,100];return `<div class="mgbets">${opts.map(n=>`<button class="pb ${n===sel?'on':''}" data-bet="${n}" ${G.me.chips<n?'disabled':''}>${icon('chips')}${n}</button>`).join('')}</div>`;}
function openMinigame(kind,time,onDone){
  closeMinigame(true,true);MG={kind,t:time||MINI_TIME,onDone,bet:Math.min(25,Math.max(10,Math.floor(G.me.chips/10)*10)),state:'bet',done:false};
  const el=document.createElement('div');el.id='mgPanel';el.className='mg '+kind;document.body.appendChild(el);
  Snd.play('wave');renderMinigame();
  gameLog({roulette:'Roulette Night: one spin, big prizes for zero.',blackjack:'Blackjack Night: beat the dealer, a natural pays a special prize.',derby:'Derby Night: back a horse. Long shots that win pay a special prize.',sports:'Sports Night: the casinos play each other. Bet on the games; winners take a creature from the loser.'}[kind],'good');}
function closeMinigame(silent,noDone){const el=$('#mgPanel');if(el)el.remove();if(MG&&!noDone){const cb=MG.onDone;MG=null;if(cb)cb();}else MG=null;}
function finishMinigame(){if(!MG||MG.done)return;MG.done=true;renderMinigame();setTimeout(()=>{if(MG&&MG.done)closeMinigame();},2600);}
function tickMinigame(dt){const sc=$('#slChips');if(sc&&sc.dataset.v!=String(G.me.chips|0)){sc.dataset.v=G.me.chips|0;sc.innerHTML=icon('chips')+fmt(G.me.chips);}
  if(!MG)return;if(MG.kind==='sports'){const mc=$('#mgChips');if(mc&&mc.dataset.v!=String(G.me.chips|0)){mc.dataset.v=G.me.chips|0;mc.innerHTML=icon('chips')+fmt(G.me.chips);}sportsTick(dt);return;}const mc=$('#mgChips');if(mc&&mc.dataset.v!=String(G.me.chips|0)){mc.dataset.v=G.me.chips|0;mc.innerHTML=icon('chips')+fmt(G.me.chips);}MG.t-=dt;const tb=$('#mgTime');if(tb)tb.style.width=Math.max(0,MG.t/MINI_TIME*100)+'%';
  if(MG.t<=0&&!MG.done){if(MG.kind==='roulette'&&MG.choice&&MG.state==='bet')rouSpin();else if(MG.kind==='blackjack'&&MG.state==='play')bjStand();else if(MG.kind==='derby'&&MG.state==='race'){}else if(MG.kind==='derby'&&MG.state==='bet'&&MG.derby&&MG.derby.pick>=0&&G.me.chips>0)derbyGo();else finishMinigame();}
  if(MG&&MG.t<-4&&!(MG.kind==='derby'&&MG.state==='race'))closeMinigame();}
function renderMinigame(){const el=$('#mgPanel');if(!el||!MG)return;
  const head=`<div class="mghead"><b>${MINI_NAME[MG.kind]}</b><span id="mgChips">${icon('chips')}${fmt(G.me.chips)}</span><button class="mgx" id="mgSkip" data-tip="Sit this one out">${MG.done?'Close':'Sit out'}</button></div><div class="mgtime"><i id="mgTime"></i></div>`;
  el.innerHTML=(MG.kind==='sports'?head.replace(/<button class="mgx" id="mgSkip"[^>]*>[^<]*<\/button>/,'<button class="mgx" id="mgSkip">Hide</button>'):head)+(MG.kind==='roulette'?rouHTML():MG.kind==='derby'?derbyHTML():MG.kind==='sports'?sportsHTML():bjHTML());
  $('#mgSkip').addEventListener('click',()=>{Snd.play('click');if(MG.kind==='sports'){$('#mgPanel').classList.toggle('mini');return;}if(!MG.done){MG.done=true;}closeMinigame();});
  el.querySelectorAll('[data-bet]').forEach(b=>b.addEventListener('click',()=>{MG.bet=+b.dataset.bet;Snd.play('chips');renderMinigame();}));
  if(MG.kind==='roulette')rouWire();else if(MG.kind==='derby')derbyWire();else if(MG.kind==='sports')sportsWire();else bjWire();}

/* ---------- roulette ---------- */
const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const WHEEL=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const ROU_BETS={red:['Red',2,n=>RED.has(n)],black:['Black',2,n=>n>0&&!RED.has(n)],odd:['Odd',2,n=>n>0&&n%2===1],even:['Even',2,n=>n>0&&n%2===0],low:['1–18',2,n=>n>=1&&n<=18],high:['19–36',2,n=>n>=19],zero:['Zero',30,n=>n===0]};
function rouHTML(){const st=MG.state;let body;
  if(st==='bet'&&!MG.done)body=`<p class="mglead">Pick a bet and spin. Zero pays 30 to 1 <em>and</em> a special prize.</p>${betRow(MG.bet)}
    <div class="rougrid">${Object.entries(ROU_BETS).map(([k,[n,x]])=>`<button class="rb ${k} ${MG.choice===k?'on':''}" data-rb="${k}">${n}<small>${x}×</small></button>`).join('')}</div>
    <div class="mgrow"><button class="pb main" id="rouSpin" ${MG.choice&&G.me.chips>=MG.bet?'':'disabled'}>Spin ${MG.bet}</button></div>`;
  else body=`<canvas id="rouCv" width="380" height="380"></canvas><div class="mgres">${MG.res||''}</div>`;
  return body;}
function rouWire(){const el=$('#mgPanel');el.querySelectorAll('[data-rb]').forEach(b=>b.addEventListener('click',()=>{MG.choice=b.dataset.rb;Snd.play('click');renderMinigame();}));
  const s=$('#rouSpin');if(s)s.addEventListener('click',rouSpin);if(MG.state!=='bet')drawWheel();}
function rouSpin(){if(!MG||MG.state!=='bet'||!MG.choice)return;const bet=Math.min(MG.bet,G.me.chips);if(bet<=0){finishMinigame();return;}
  G.me.chips-=bet;MG.paid=bet;MG.state='spin';MG.result=WHEEL[(Math.random()*WHEEL.length)|0];MG.spin0=performance.now();renderMinigame();Snd.play('deal');
  const tick=()=>{if(!MG||MG.state!=='spin')return;drawWheel();if(performance.now()-MG.spin0<3200){if(Math.random()<.25)Snd.play('click');requestAnimationFrame(tick);}else rouSettle();};requestAnimationFrame(tick);}
function rouSettle(){const n=MG.result,[name,x,test]=ROU_BETS[MG.choice];MG.state='done';const col=n===0?'green':RED.has(n)?'red':'black';
  if(test(n)){const win=MG.paid*x;G.me.chips+=win;G.stats.earned+=win-MG.paid;let extra='';
    if(n===0){extra=' · '+specialPrize();if(typeof Meta!=='undefined')Meta.ach('zero');Snd.play('jackpot');for(let i=0;i<80;i++)confetti();}else Snd.play('win');
    MG.res=`<b class="${col}">${n}</b> · ${name} wins ${fmt(win)} chips${extra}`;gameLog(`Roulette: ${n} ${col}. You won ${fmt(win)} chips${extra}.`,'good');}
  else{MG.res=`<b class="${col}">${n}</b> · ${name} loses`;gameLog(`Roulette: ${n} ${col}. Your ${name} bet lost.`);Snd.play('fold');}
  finishMinigame();drawWheel();}
function drawWheel(){const cv=$('#rouCv');if(!cv||!MG)return;const c=cv.getContext('2d'),R=170,cx=190,cy=190,N=WHEEL.length;c.clearRect(0,0,380,380);
  const el=performance.now()-(MG.spin0||0),k=Math.min(1,el/3200),ease=1-Math.pow(1-k,3);const resI=WHEEL.indexOf(MG.result);
  const wheelA=ease*TAU*3,ballA=-Math.PI/2-(ease*TAU*5)+0;const targetBall=-Math.PI/2;const finalWheel=targetBall-(resI+.5)/N*TAU;
  const wa=k<1?wheelA+finalWheel*ease:finalWheel;
  c.save();c.translate(cx,cy);c.fillStyle='#3b2412';c.beginPath();c.arc(0,0,R+8,0,TAU);c.fill();c.fillStyle='#d4a12a';c.beginPath();c.arc(0,0,R+3,0,TAU);c.fill();
  for(let i=0;i<N;i++){const a0=wa+i/N*TAU,a1=wa+(i+1)/N*TAU,n=WHEEL[i];c.fillStyle=n===0?'#15803d':RED.has(n)?'#b91c1c':'#111827';c.beginPath();c.moveTo(0,0);c.arc(0,0,R,a0,a1);c.closePath();c.fill();
    c.save();c.rotate((a0+a1)/2);c.fillStyle='#fff';c.font='bold 11px Barlow,sans-serif';c.textAlign='center';c.translate(R-14,0);c.rotate(Math.PI/2);c.fillText(n,0,4);c.restore();}
  c.fillStyle='#3b2412';c.beginPath();c.arc(0,0,R*.62,0,TAU);c.fill();c.fillStyle='#d4a12a';c.beginPath();c.arc(0,0,R*.18,0,TAU);c.fill();
  for(let i=0;i<4;i++){c.save();c.rotate(wa*1+i*Math.PI/2);c.fillStyle='#fde68a';c.fillRect(-3,-R*.55,6,R*.4);c.restore();}
  const ba=k<1?targetBall+(1-ease)*TAU*4:targetBall,br=k<1?R*(.92-.12*ease):R*.8;c.fillStyle='#fff';c.beginPath();c.arc(Math.cos(ba)*br,Math.sin(ba)*br,6,0,TAU);c.fill();c.restore();}

/* ---------- blackjack ---------- */
const bjVal=cs=>{let t=0,a=0;for(const c of cs){if(c.v===14){t+=11;a++;}else t+=Math.min(10,c.v);}while(t>21&&a){t-=10;a--;}return t;};
function bjHTML(){const st=MG.state;
  if(st==='bet'&&!MG.done)return `<p class="mglead">Beat the dealer to 21. A natural blackjack pays 2.5× <em>and</em> a special prize.</p>${betRow(MG.bet)}<div class="mgrow"><button class="pb main" id="bjDeal" ${G.me.chips>=MG.bet?'':'disabled'}>Deal ${MG.bet}</button></div>`;
  const hide=st==='play';
  return `<div class="bjrow"><small>Dealer ${hide?'':'· '+bjVal(MG.dh)}</small><div class="bjcards">${MG.dh.map((c,i)=>i===1&&hide?'<div class="card back"></div>':cardHTML(c,i,'')).join('')}</div></div>
    <div class="bjrow"><small>You · ${bjVal(MG.ph)}</small><div class="bjcards">${MG.ph.map((c,i)=>cardHTML(c,i,'')).join('')}</div></div>
    ${st==='play'?`<div class="mgrow"><button class="pb" id="bjHit">Hit</button><button class="pb main" id="bjStand">Stand</button>${MG.ph.length===2&&G.me.chips>=MG.paid?'<button class="pb" id="bjDbl">Double</button>':''}</div>`:`<div class="mgres">${MG.res||''}</div>`}`;}
function bjWire(){const d=$('#bjDeal');if(d)d.addEventListener('click',bjDeal);const h=$('#bjHit');if(h)h.addEventListener('click',bjHit);const s=$('#bjStand');if(s)s.addEventListener('click',bjStand);const x=$('#bjDbl');if(x)x.addEventListener('click',bjDouble);}
function bjDeal(){if(!MG||MG.state!=='bet')return;const bet=Math.min(MG.bet,G.me.chips);if(bet<=0)return;G.me.chips-=bet;MG.paid=bet;MG.deck=newDeck();
  MG.ph=[MG.deck.pop(),MG.deck.pop()];MG.dh=[MG.deck.pop(),MG.deck.pop()];MG.state='play';Snd.play('deal');
  if(bjVal(MG.ph)===21){bjSettle(true);return;}renderMinigame();}
function bjHit(){if(!MG||MG.state!=='play')return;MG.ph.push(MG.deck.pop());Snd.play('card');if(bjVal(MG.ph)>21){bjSettle();return;}if(bjVal(MG.ph)===21){bjStand();return;}renderMinigame();}
function bjDouble(){if(!MG||MG.state!=='play')return;const add=Math.min(MG.paid,G.me.chips);G.me.chips-=add;MG.paid+=add;MG.ph.push(MG.deck.pop());Snd.play('chips');if(bjVal(MG.ph)>21){bjSettle();return;}bjStand();}
function bjStand(){if(!MG||MG.state!=='play')return;while(bjVal(MG.dh)<17)MG.dh.push(MG.deck.pop());bjSettle();}
function bjSettle(natural){MG.state='done';const p=bjVal(MG.ph),d=bjVal(MG.dh);let win=0,txt,extra='';
  const dNat=MG.dh.length===2&&d===21;
  if(natural&&!dNat){win=Math.round(MG.paid*2.5);extra=' · '+specialPrize();txt='Blackjack!';if(typeof Meta!=='undefined')Meta.ach('natural');Snd.play('jackpot');for(let i=0;i<80;i++)confetti();}
  else if(natural&&dNat){win=MG.paid;txt='Both blackjack: push';}
  else if(p>21){txt='Bust';}
  else if(d>21||p>d){win=MG.paid*2;txt=d>21?'Dealer busts, you win':'You win';Snd.play('win');}
  else if(p===d){win=MG.paid;txt='Push';}
  else{txt='Dealer wins';Snd.play('fold');}
  if(win){G.me.chips+=win;G.stats.earned+=win-MG.paid;}
  MG.res=`${txt}${win?' · '+fmt(win)+' chips':''}${extra}`;gameLog(`Blackjack: you ${p}, dealer ${d}. ${txt}${win?', '+fmt(win)+' chips':''}${extra}.`,win>MG.paid?'good':'');
  finishMinigame();}

/* ---------- the slot machine ---------- */
const SLOT_SYMS=[['cherry',6,'#e11d48'],['lemon',6,'#facc15'],['bell',4,'#fbbf24'],['bar',3,'#e5e7eb'],['spade',2,'#ff3d9a'],['seven',1,'#ef4444']];
const SLOT_TOTAL=SLOT_SYMS.reduce((a,s)=>a+s[1],0);
const slotPick=()=>{let r=Math.random()*SLOT_TOTAL;for(const s of SLOT_SYMS){if((r-=s[1])<0)return s[0];}return 'cherry';};
let SL=null;
function slotGlyph(k){const s=SLOT_SYMS.find(x=>x[0]===k);const ic={cherry:'cherry',lemon:'citrus',bell:'bell',spade:'spade'}[k];
  return `<span class="sg ${k}" style="color:${s[2]}">${ic?icon(ic):k==='bar'?'BAR':'7'}</span>`;}
function toggleSlots(force){toggleArcade(force,force?'slots':null);}
function renderSlots(){const el=$('#arcBody');if(!el||!SL||ARC.tab!=='slots')return;
  el.innerHTML=`<div class="reels">${SL.reels.map((k,i)=>`<div class="reel ${SL.spin&&SL.stop<=i?'spin':''}">${slotGlyph(k)}</div>`).join('')}</div>
   <div class="slres">${SL.last}</div><div class="mgrow"><button class="pb main" id="slPull" ${SL.spin||G.me.chips<10?'disabled':''}>Pull · 10</button></div>
   <div class="paytab"><span>${slotGlyph('seven')}×3 300 + a creature</span><span>${slotGlyph('spade')}×3 a free creature</span><span>${slotGlyph('bar')}×3 120</span><span>${slotGlyph('bell')}×3 80</span><span>${slotGlyph('cherry')}×3 60 · ×2 15 · ×1 5</span><span>${slotGlyph('lemon')}×3 40</span></div>`;
  $('#slPull').addEventListener('click',slotPull);}
function slotPull(){if(!SL||SL.spin||G.me.chips<10)return;G.me.chips-=10;G.stats.slots=(G.stats.slots||0)+1;SL.spin=true;SL.stop=0;SL.final=[slotPick(),slotPick(),slotPick()];Snd.play('deal');
  const t0=performance.now();const roll=()=>{if(!SL)return;const e=performance.now()-t0;for(let i=0;i<3;i++){if(e<600+i*350)SL.reels[i]=SLOT_SYMS[(Math.random()*SLOT_SYMS.length)|0][0];else{SL.reels[i]=SL.final[i];if(SL.stop<=i){SL.stop=i+1;Snd.play('click');}}}
    renderSlots();if(e<600+2*350+30)setTimeout(roll,70);else slotPay();};roll();}
function slotPay(){const [a,b,c]=SL.final;let win=0,txt='No luck',extra='';const cherries=SL.final.filter(x=>x==='cherry').length;
  if(a===b&&b===c){if(a==='seven'){win=300;extra=spawnPrize(['q_lo','q_hi','fh_hi']);txt='JACKPOT! 7-7-7';if(typeof Meta!=='undefined')Meta.ach('three7');for(let i=0;i<120;i++)confetti();Snd.play('jackpot');}
    else if(a==='spade'){extra=spawnPrize(['s_lo','s_hi','f_lo','f_hi','fh_lo']);txt='Three spades!';Snd.play('jackpot');}
    else{win={bar:120,bell:80,cherry:60,lemon:40}[a];txt='Three of a kind';Snd.play('win');}}
  else if(cherries===2){win=15;txt='Two cherries';Snd.play('coin');}else if(cherries===1){win=5;txt='A cherry';Snd.play('coin');}
  if(win){G.me.chips+=win;G.stats.earned+=win;}SL.spin=false;SL.last=`${txt}${win?' · +'+win:''}${extra?' · '+extra:''}`;if(win>=40||extra)gameLog(`Slots: ${SL.last}.`,'good');renderSlots();}
function spawnPrize(pool){const u=pool[(Math.random()*pool.length)|0];spawnHandUnits(u,{rank:UNITS[u].hand,high:UNITS[u].hi});return 'a free '+UNITS[u].name;}

/* force-settle anything in flight (the host moved on) */
function forceFinishMini(){if(!MG)return;if(MG.kind==='sports'){const SB=sbNow();if(SB&&SB.out)sbApplyMine(SB);closeMinigame();return;}if(MG.kind==='derby'&&MG.state==='race'){MG.derby.u=1.1;derbySettle();}if(MG.kind==='roulette'&&MG.state==='spin')rouSettle();else if(MG.kind==='blackjack'&&MG.state==='play')bjStand();closeMinigame();}

/* multiplayer: everyone plays at once, the host waits for all or the clock */
function mpMini(w,time){if(!G||G.spectate||G.over||!NET.on)return;if(NET.miniW===w)return;NET.miniW=w;const k=miniAfter(w);if(!k)return;if(k==='sports'){const SB=NET.host?NET.SB:NET.SBS;if(SB)openSports(SB);else NET.miniW=null;return;}
  openMinigame(k,Math.min(MINI_TIME,time||MINI_TIME),()=>{NET.md=w;publishG(true);});}

/* clicking the map */
function mapClick(x,y){const c=Math.floor(x/TILE),r=Math.floor(y/TILE);
  if(c>=VAULT.c0-1&&c<VAULT.c0+VAULT.w+1&&r>=VAULT.r0-1&&r<VAULT.r0+VAULT.h+1&&typeof honk==='function')return honk();const o=OBST.find(o=>c>=o.c&&c<o.c+o.w&&r>=o.r&&r<o.r+o.h);if(!o)return false;
  if(o.k==='arcade'){toggleSlots(true);return true;}
  return typeof easterClick==='function'?easterClick(o,x,y):false;}
