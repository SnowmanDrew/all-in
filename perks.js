'use strict';
/* ============ ALL IN — house perks and estate sales ============
   After you beat the bosses on rounds 10, 20 and 30 the house offers three perks; pick one, it lasts the run.
   The last pick includes deck perks that change which cards you are dealt (your cards only).
   When a rival casino falls, its prize creature goes up for auction at the next hand. */

/* ---------- the perks ---------- */
const PERKS={
  rope5:{name:'Velvet Discount',tag:'Ropes',icon:'rope',desc:'Velvet ropes cost 5 chips instead of 10.'},
  carry5:{name:'Union Croupiers',tag:'Economy',icon:'croupier',desc:'Croupiers carry 5 chips a trip instead of 3.'},
  pay50:{name:'House Money',tag:'Economy',icon:'chips',desc:'The house pays 50% more at the end of every round.'},
  luck:{name:'Loaded Dice',tag:'Cards',icon:'sparkles',desc:'Every swap you make is drawn best of one extra try.'},
  pet:{name:"Dealer's Pet",tag:'Cards',icon:'heart',desc:'You are always dealt the best of one extra hand, before any tips.'},
  wind:{name:'Second Wind',tag:'Army',icon:'hp',desc:'Knocked-out creatures come back twice as fast.'},
  encore:{name:'Encore',tag:'Army',icon:'zap',desc:'Abilities recharge 30% faster.'},
  study:{name:'Quick Study',tag:'Army',icon:'crown',desc:'Creatures rank up to Veteran, Elite and Legend 40% sooner.'},
  stand:{name:'Last Stand',tag:'Army',icon:'dmg',desc:'While your casino is below 30% health, every creature deals 40% more damage.'},
  suite:{name:"Comp'd Suite",tag:'Casino',icon:'casino',desc:'+60 casino health, and it repairs itself between rounds.'},
  // deck perks: your cards only, offered at the last pick in single player
  noface:{name:'Commoners Only',tag:'Deck',icon:'spade',deck:c=>c.v<11||c.v===14,
    desc:'No jacks, queens or kings in your deck. Pairs and better come 86% of the time and three of a kind half as often again, but your creatures rarely come out high.'},
  black:{name:'Paint It Black',tag:'Deck',icon:'spade',deck:c=>c.s==='S'||c.s==='C',
    desc:'Only spades and clubs. Flushes come twenty times as often (about 1 hand in 16), but with two of each card, three of a kind or better is impossible.'},
  short:{name:'Short Deck',tag:'Deck',icon:'spade',deck:c=>c.v>=6,swap:-1,
    desc:'Only sixes and up. Two pair and three of a kind come nearly twice as often, but you can swap one card fewer.'}};
const PERK_ROUNDS=[10,20,30],GENERAL=Object.keys(PERKS).filter(k=>!PERKS[k].deck),DECKS=Object.keys(PERKS).filter(k=>PERKS[k].deck);
const hasPerk=k=>!!(G&&G.perks&&G.perks.includes(k));
const deckPerk=()=>G&&G.perks&&G.perks.map(k=>PERKS[k]).find(P=>P.deck);
function perkOffer(){const own=G.perks||[];const pool=GENERAL.filter(k=>!own.includes(k));const pick=(arr,n)=>shuffleArr(arr.slice()).slice(0,n);
  if(G.wave>=30&&!G.mp&&!own.some(k=>PERKS[k].deck))return pick(DECKS,2).concat(pick(pool,1));
  return pick(pool,3);}
{const _ew=endWave;endWave=function(){const w=G.wave;_ew.apply(this,arguments);if(PERK_ROUNDS.includes(w)&&!G.over&&!(G.perkDone||[]).includes(w)){G.perkPending={w,offer:perkOffer()};}};}
// the choice waits for you between rounds (in single player the next hand waits too)
{const _u=update;update=function(dt){_u(dt);
  if(G.perkPending&&!G.perkOpen&&(G.phase==='break'||(G.mp&&G.phase!=='wave'))&&!$('#overlay.show')){if(!G.mp)G.phase='perk';G.perkOpen=true;perkUI();}
  // perks that tick
  if(hasPerk('wind'))for(const k of G.ko)k.t-=dt;
  if(hasPerk('suite')&&G.phase!=='wave'&&G.base.hp<G.base.maxHp)G.base.hp=Math.min(G.base.maxHp,G.base.hp+1.5*dt);};}
function perkUI(){const P=G.perkPending;let el=$('#perkPick');if(!el){el=document.createElement('div');el.id='perkPick';$('#boardWrap').appendChild(el);}
  el.innerHTML=`<div class="pk"><div class="pkh"><b>The house is impressed</b><small>You beat round ${P.w}. Pick one perk: it lasts the rest of the run.</small></div>
    <div class="pkc">${P.offer.map(k=>{const D=PERKS[k];return `<button class="pkcard ${D.deck?'deck':''}" data-k="${k}"><span class="pkt">${D.tag}</span>${icon(D.icon)}<b>${D.name}</b><p>${D.desc}</p></button>`;}).join('')}</div>
    ${P.offer.some(k=>PERKS[k].deck)?'<div class="pkn">Deck perks change only the cards you are dealt and draw. Your rivals play the normal deck.</div>':''}</div>`;
  el.classList.add('show');Snd.play('jackpot');
  el.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>perkChoose(b.dataset.k));}
function perkChoose(k){const P=G.perkPending;if(!P)return;(G.perks=G.perks||[]).push(k);(G.perkDone=G.perkDone||[]).push(P.w);G.perkPending=null;G.perkOpen=false;
  const el=$('#perkPick');if(el)el.classList.remove('show');
  if(k==='suite'){G.base.maxHp+=60;G.base.hp+=60;}
  if(G.phase==='perk'){G.phase='break';G.breakT=1.2;}
  banner(PERKS[k].name,PERKS[k].desc.split('. ')[0],'great');gameLog(`House perk: ${PERKS[k].name}. ${PERKS[k].desc}`,'good');Snd.play('upgrade');refreshPane(true);}
// the hooks
{const _pb=placeBarricade;placeBarricade=function(c,r){const b=G.me.chips,ok=_pb(c,r);if(ok!==false&&hasPerk('rope5')&&G.me.chips<b)G.me.chips+=5;return ok;};}
{const _uw=updateWorkers;updateWorkers=function(dt){_uw(dt);if(hasPerk('carry5'))for(const w of G.workers)if(w.st===2&&w.carry===3)w.carry=5;};}
{const _le=localEndWave;localEndWave=function(w){_le(w);if(hasPerk('pay50')){const x=Math.round((20+2.5*w)*.5);G.me.chips+=x;G.stats.earned+=x;floatText(BASE.x,BASE.r0*TILE-30,'+'+x+' house money','#e9c46a',13);}};}
{const _di=drawInto;drawInto=function(s,idxs){const D=s&&s.p&&s.p.human?deckPerk():null,lk=s&&s.p&&s.p.human&&hasPerk('luck');if(lk)s.luck=(s.luck||1)+1;
  if(!D){_di(s,idxs);if(lk)s.luck--;return;}
  const keep=HD.deck.filter(D.deck),rest=HD.deck.filter(c=>!D.deck(c)),mk=HD.muck.filter(D.deck),mr=HD.muck.filter(c=>!D.deck(c));
  HD.deck=keep;HD.muck=mk;_di(s,idxs);HD.deck=HD.deck.concat(rest);HD.muck=HD.muck.concat(mr);if(lk)s.luck--;};}
{const _xh=extraHands;extraHands=function(seat){const n=_xh(seat);return seat.p.human&&hasPerk('pet')?Math.min(5,n+1):n;};}
{const _dc=dealCards;dealCards=function(){_dc.apply(this,arguments);const s=humanSeat(),D=deckPerk();if(!s||!D)return;
  // re-deal your hand from your own deck: the same number of tries, from the cards you are allowed
  HD.deck.push(...s.cards);const ok=shuffleArr(HD.deck.filter(D.deck)),rest=HD.deck.filter(c=>!D.deck(c));let best=null;const tried=[];
  for(let k=0;k<=s.extra&&ok.length>=5;k++){const c=ok.splice(0,5);tried.push(c);const e=eval5(c);if(!best||e.score>best.e.score)best={c,e};}
  for(const c of tried)if(c!==best.c)ok.push(...c);HD.deck=shuffleArr(ok.concat(rest));s.cards=best.c;s.ev=best.e;
  if(D.swap)s.maxSwap=Math.max(1,(s.maxSwap||MAX_SWAP)+D.swap);refreshTable(true);};}
{const _da=doAbility;doAbility=function(u,abk,tgt){_da(u,abk,tgt);if(hasPerk('encore')&&u.cds[abk]>0)u.cds[abk]*=.7;};}
{const _rn=rankNeed;rankNeed=function(k,r){const n=_rn(k,r);return hasPerk('study')?Math.round(n*.6):n;};}
{const _us=uStat;uStat=function(u){const s=_us(u);if(hasPerk('stand')&&G.base.hp<G.base.maxHp*.3)s.dmg*=1.4;return s;};}
{const _sc=setCasinoTier;setCasinoTier=function(t,quiet){_sc(t,quiet);if(hasPerk('suite')){G.base.maxHp+=60;G.base.hp=Math.min(G.base.maxHp,G.base.hp+60);}};}
// the casino pane lists your perks
{const _bp=buildPane;buildPane=function(){_bp();if(!G||G.sel.length||G.inspect||!(G.perks&&G.perks.length))return;const box=$('#unitPane');
  const d=document.createElement('div');d.className='perkrow';d.innerHTML=G.perks.map(k=>`<span data-tip="${PERKS[k].name}|${PERKS[k].desc}">${icon(PERKS[k].icon)}${PERKS[k].name}</span>`).join('');box.appendChild(d);};}

/* ---------- estate sales ---------- */
const unitRank=k=>{for(let r=9;r>=0;r--)if(HAND_UNITS[r].includes(k))return r;return (UNITS[k]&&UNITS[k].hand)||5;};
{const _fh=finishHand;finishHand=function(){if(HD)for(const s of HD.seats){if(s.p.human||s.p.remote||!s.ev)continue;const k=s.ev.unit;if(!s.p.best||unitDps(k)*(1+UNITS[k].hp/900)>unitDps(s.p.best)*(1+UNITS[s.p.best].hp/900))s.p.best=k;}_fh.apply(this,arguments);};}
{const _rs=rivalSim;rivalSim=function(w){const before=new Set(G.outOrder);_rs(w);if(G.mp)return;
  for(const p of G.outOrder)if(!before.has(p)&&p.best&&G.players.some(o=>!o.human&&o.alive))(G.estateQ=G.estateQ||[]).push({p,k:p.best});};}
{const _sh=startHand;startHand=function(){_sh.apply(this,arguments);if(G.estateQ&&G.estateQ.length&&!G.auction&&HD&&HD.phase==='tip'&&humanSeat())auctionStart(G.estateQ.shift());};}
function auctionStart(E){const r=unitRank(E.k),start=40+25*r,inc=10+5*(r>>1);
  const bidders=G.players.filter(p=>!p.human&&p.alive).map(p=>({p,max:Math.min(p.chips-60,Math.round(start*(1.05+rnd()*1.35)/5)*5)}));
  G.auction={E,price:start,inc,lead:null,t:0,last:0,out:false,bidders,start};gameLog(`Estate sale: ${E.p.name}'s ${UNITS[E.k].name} is up for auction, starting at ${start}.`,'good');Snd.play('coin');auctionUI();}
function auctionTick(dt){const A=G.auction;if(!A)return;A.t+=dt;if(HD&&HD.phase==='tip')HD.t=Math.max(HD.t,4);
  // rivals bid after a beat, if it is still worth it to them
  if(A.t-A.last>(A.lead&&A.lead.human?.9+rnd()*.6:1.4)){const want=A.bidders.filter(b=>b.p!==A.lead&&b.max>=(A.lead?A.price+A.inc:A.price)).sort((a,b)=>b.max-a.max);
    if(want.length&&rnd()<.75){const b=want[0];if(A.lead)A.price+=A.inc;A.lead=b.p;A.last=A.t;bark(b.p,'raise',.5);Snd.play('chips');auctionUI();}}
  const quiet=A.t-A.last;
  if((A.lead&&quiet>3.2)||(!A.lead&&A.t>5)||(A.out&&!A.bidders.some(b=>b.p!==A.lead&&b.max>=A.price+A.inc)&&quiet>1))auctionEnd();}
function auctionBid(){const A=G.auction;if(!A||A.out)return;const price=A.lead?A.price+A.inc:A.price;if(G.me.chips<price){toast('Not enough chips');Snd.play('error');return;}
  A.price=price;A.lead=G.me;A.last=A.t;Snd.play('chips');auctionUI();}
function auctionPass(){const A=G.auction;if(!A)return;A.out=true;A.last=A.t;if(A.lead===G.me)A.lead=null;auctionUI();}
function auctionEnd(){const A=G.auction;G.auction=null;const k=A.E.k,el=$('#auction');
  if(A.lead===G.me){G.me.chips-=A.price;spawnBonus(k,'Estate sale!');gameLog(`You bought ${A.E.p.name}'s ${UNITS[k].name} for ${A.price} chips.`,'good');}
  else if(A.lead){A.lead.chips-=A.price;A.lead.power+=unitDps(k)*(1+UNITS[k].hp/900);gameLog(`${A.lead.name} bought ${A.E.p.name}'s ${UNITS[k].name} for ${A.price} chips.`,'');toast(`${A.lead.short||A.lead.name} won the auction`);}
  else gameLog(`Nobody bid on ${A.E.p.name}'s ${UNITS[k].name}.`,'');
  if(el){el.innerHTML=`<div class="au done"><b>${A.lead===G.me?'Sold to you!':A.lead?`Sold to ${esc(A.lead.short||A.lead.name)}`:'No sale'}</b><small>${A.lead?A.price+' chips':''}</small></div>`;setTimeout(()=>el.classList.remove('show'),1600);}}
function auctionUI(){const A=G.auction;let el=$('#auction');if(!A)return;if(!el){el=document.createElement('div');el.id='auction';$('#boardWrap').appendChild(el);}
  const next=A.lead?A.price+A.inc:A.price,mine=A.lead===G.me;
  el.innerHTML=`<div class="au"><div class="auh">${icon('casino')}<b>Estate sale</b><small>${esc(A.E.p.name)}'s casino is being sold off</small></div>
    <div class="aum"><canvas id="auPor"></canvas><div><b>${UNITS[A.E.k].name}</b><small>${HANDS[unitRank(A.E.k)]||'Prize creature'}</small>
      <div class="aup">${A.lead?`${mine?'You lead':esc(A.lead.short||A.lead.name)+' leads'} at <b>${A.price}</b>`:`Opening at <b>${A.price}</b>`}</div></div></div>
    <div class="aub">${A.out?'<span class="aud">You passed</span>':`<button class="pb main" id="auBid" ${mine||G.me.chips<next?'disabled':''}>${mine?'Your bid':'Bid '+next}</button><button class="pb" id="auPass">Pass</button>`}</div></div>`;
  el.classList.add('show');portrait($('#auPor'),A.E.k,44);
  const b=$('#auBid'),p=$('#auPass');if(b)b.onclick=auctionBid;if(p)p.onclick=auctionPass;}
{const _u=update;update=function(dt){_u(dt);if(G.auction)auctionTick(dt);};}

/* ---------- styles ---------- */
(function(){const css=`
#perkPick{position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(6,3,10,.6);backdrop-filter:blur(2px)}
#perkPick.show{display:flex}
#perkPick .pk{width:min(760px,92%);padding:16px 18px 14px;border-radius:16px;background:linear-gradient(180deg,#22113a,#100818);box-shadow:0 0 0 2px #e0b040,0 0 40px rgba(224,176,64,.35),0 20px 60px rgba(0,0,0,.7)}
#perkPick .pkh{text-align:center;margin-bottom:12px}#perkPick .pkh b{display:block;font:400 22px var(--head);color:#ffd27a;text-shadow:0 0 12px rgba(255,176,32,.5)}#perkPick .pkh small{color:var(--muted);font-size:12.5px}
#perkPick .pkc{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
#perkPick .pkcard{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 12px 14px;border:0;border-radius:12px;cursor:pointer;text-align:center;color:#f3e8ff;
  background:linear-gradient(180deg,#2e1d45,#1a1028);box-shadow:inset 0 0 0 1.5px #4c3a66;transition:transform .15s,box-shadow .15s;font:400 12.5px/1.4 var(--body,Barlow),sans-serif}
#perkPick .pkcard:hover{transform:translateY(-3px);box-shadow:inset 0 0 0 2px #ffd27a,0 0 22px rgba(255,210,122,.35)}
#perkPick .pkcard .ic{width:30px;height:30px;color:#ffd27a}#perkPick .pkcard b{font:400 15px var(--head);color:#fff}#perkPick .pkcard p{margin:0;color:#e9d5ff}
#perkPick .pkcard.deck{background:linear-gradient(180deg,#123528,#0b1d17);box-shadow:inset 0 0 0 1.5px #22c55e}#perkPick .pkcard.deck .ic{color:#86efac}#perkPick .pkcard.deck:hover{box-shadow:inset 0 0 0 2px #86efac,0 0 22px rgba(134,239,172,.35)}
#perkPick .pkt{position:absolute;top:8px;left:10px;font:400 9.5px var(--head);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
#perkPick .pkn{margin-top:10px;text-align:center;font-size:11.5px;color:#86efac}
.perkrow{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}.perkrow span{display:flex;align-items:center;gap:3px;padding:2px 7px;border-radius:9px;background:#2a1a3e;color:#ffd27a;font:400 10px var(--head)}.perkrow .ic{width:11px;height:11px}
#auction{position:absolute;right:12px;top:12px;z-index:7;width:260px;opacity:0;transform:translateY(-6px);transition:opacity .25s,transform .25s;pointer-events:none}
#auction.show{opacity:1;transform:none;pointer-events:auto}
#auction .au{padding:10px 12px;border-radius:12px;background:rgba(18,10,26,.95);box-shadow:0 0 0 1.5px #e0b040,0 0 22px rgba(224,176,64,.3),0 10px 30px rgba(0,0,0,.6);color:#f3e8ff;font:400 12px var(--body,Barlow),sans-serif}
#auction .auh{display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px}#auction .auh .ic{width:14px;height:14px;color:#ffd27a}#auction .auh b{font:400 13px var(--head);color:#ffd27a}#auction .auh small{width:100%;color:var(--muted)}
#auction .aum{display:flex;gap:8px;align-items:center;margin:8px 0}#auction canvas{width:44px;height:44px;border-radius:8px;background:radial-gradient(#2a2236,#120c19)}#auction .aum b{font:400 13px var(--head);color:#fff}#auction .aum small{display:block;color:var(--muted)}
#auction .aup{margin-top:3px;color:#ffe9b0}#auction .aup b{color:#ffd27a}
#auction .aub{display:flex;gap:6px}#auction .pb{height:28px;margin:0;flex:1}#auction .aud{color:var(--muted)}
#auction .au.done{text-align:center}#auction .au.done b{display:block;font:400 15px var(--head);color:#ffd27a}`;
const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);})();
