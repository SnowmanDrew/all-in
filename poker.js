'use strict';
/* ============ ALL IN — poker engine (fixed-limit five-card draw) ============ */
function eval5(cs){
  const counts=new Map();for(const c of cs)counts.set(c.v,(counts.get(c.v)||0)+1);
  const groups=[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
  const flush=cs.every(c=>c.s===cs[0].s);
  let sh=0;if(counts.size===5){const vs=[...counts.keys()].sort((a,b)=>b-a);if(vs[0]-vs[4]===4)sh=vs[0];else if(vs[0]===14&&vs[1]===5)sh=5;}
  let rank;
  if(sh&&flush)rank=sh===14?9:8;else if(groups[0][1]===4)rank=7;else if(groups[0][1]===3&&groups[1][1]===2)rank=6;
  else if(flush)rank=5;else if(sh)rank=4;else if(groups[0][1]===3)rank=3;else if(groups[0][1]===2&&groups[1][1]===2)rank=2;
  else if(groups[0][1]===2)rank=1;else rank=0;
  const all=[4,5,6,8,9].includes(rank);const sv=rank===2?[groups[0][0],groups[1][0]]:[groups[0][0]];
  const scoring=[];cs.forEach((c,i)=>{if(all||sv.includes(c.v))scoring.push(i);});
  let tb=0;if(rank===4||rank===8||rank===9)tb=sh*50625;else groups.forEach(([v],i)=>{tb+=v*Math.pow(15,4-i);});
  const top=(rank===4||rank===8)?sh:rank===9?14:all?Math.max(...cs.map(c=>c.v)):Math.max(...sv);
  const ev={rank,score:rank*1e7+tb,top,scoring,groups,sh};
  ev.high=rank===9||top>=HIGH_AT[rank];ev.unit=HAND_UNITS[rank][ev.high?1:0];ev.detail=detailOf(ev);
  {const sg=signatureOf(cs,ev);if(sg){ev.sig=sg;ev.unit=sg;}}
  return ev;
}
function detailOf(r){const g=r.groups;switch(r.rank){
  case 0:return vn(g[0][0])+' high';case 1:return 'Pair of '+VP[g[0][0]];case 2:return VP[g[0][0]]+' & '+VP[g[1][0]];
  case 3:return 'Three '+VP[g[0][0]];case 4:return vn(r.sh)+'-high';case 5:return vn(r.top)+'-high';
  case 6:return VP[g[0][0]]+' full of '+VP[g[1][0]];case 7:return 'Four '+VP[g[0][0]];case 8:return vn(r.sh)+'-high';case 9:return 'The nuts';}}
function newDeck(){const d=[];for(const s of SUITS)for(let v=2;v<=14;v++)d.push({v,s});return shuffleArr(d);}
function handStrength(seat,pre){
  const ev=seat.ev;let s=[.1,.33,.53,.65,.75,.81,.88,.95,.985,1][ev.rank]+(ev.top-8)*.008;
  if(pre&&ev.rank<4){const sc={};seat.cards.forEach(c=>sc[c.s]=(sc[c.s]||0)+1);if(Math.max(...Object.values(sc))===4)s+=.15;
    else if(straightDraw(seat.cards))s+=.08;}
  return clamp(s,0,1);
}
function straightDraw(cards){const u=[...new Set(cards.map(c=>c.v))];if(u.includes(14))u.push(1);
  for(let lo=1;lo<=10;lo++){let n=0;for(let v=lo;v<lo+5;v++)if(u.includes(v))n++;if(n>=4)return lo;}return 0;}
function aiDiscards(cards,ev,cap){cap=cap||HD&&HD.maxSwap||MAX_SWAP;const d=aiDiscardsRaw(cards,ev);if(d.length<=cap)return d;return d.sort((a,b)=>cards[a].v-cards[b].v).slice(0,cap);}
function aiDiscardsRaw(cards,ev){
  if(ev.rank>=4)return [];
  const sc={};cards.forEach(c=>sc[c.s]=(sc[c.s]||0)+1);const fs=Object.keys(sc).find(s=>sc[s]===4);
  if(fs&&ev.rank<=1)return cards.map((c,i)=>c.s!==fs?i:-1).filter(i=>i>=0);
  const lo=straightDraw(cards);
  if(lo&&ev.rank===0){const keep=new Set();cards.forEach((c,i)=>{const v=(c.v===14&&lo===1)?1:c.v;if(v>=lo&&v<lo+5&&![...keep].some(k=>cards[k].v===c.v))keep.add(i);});
    return [0,1,2,3,4].filter(i=>!keep.has(i));}
  if(ev.rank===0){const order=[0,1,2,3,4].sort((a,b)=>cards[b].v-cards[a].v);const keep=cards[order[0]].v>=11?order.slice(0,cards[order[1]].v>=11?2:1):[];return [0,1,2,3,4].filter(i=>!keep.includes(i));}
  return [0,1,2,3,4].filter(i=>!ev.scoring.includes(i));
}

/* ---------- hand state machine ---------- */
let HD=null;
function bark(pl,kind,chance){if(!pl||pl.human||pl.remote||!pl.alive&&kind!=='bust')return;if(chance!=null&&rnd()>chance)return;const L=BARKS[pl.short]&&BARKS[pl.short][kind];if(!L)return;
  if(pl.barkT&&G.time-pl.barkT<4&&kind!=='bust'&&kind!=='win')return;pl.barkT=G.time;pl.bark={text:L[(rnd()*L.length)|0],until:performance.now()+2800};}
function seatOf(p){return HD?HD.seats.find(s=>s.p===p):null;}
const humanSeat=()=>HD?HD.seats.find(s=>s.p.human):null;
const isPerson=p=>!!(p&&(p.human||p.remote));
const anyPerson=()=>HD.seats.some(s=>isPerson(s.p));
const activeSeats=()=>HD.seats.filter(s=>!s.folded);
const potTotal=()=>HD?HD.seats.reduce((a,s)=>a+s.contrib,0):0;
function pay(seat,amt){const a=Math.max(0,Math.min(amt,seat.p.chips));seat.p.chips-=a;seat.bet+=a;seat.contrib+=a;seat.paid+=a;if(seat.p.chips<=0)seat.allIn=true;return a;}
function startHand(){
  const players=G.players.filter(p=>p.alive);
  G.handNo=(G.handNo||0)+1;let ev=null;if(G.handNo>=3&&G.handNo%3===0){const ks=Object.keys(TABLE_EVENTS);ev=ks[(rnd()*ks.length)|0];}
  const mult=ev==='stakes'?2:1;
  const seats=[];
  for(const p of players){if(p.chips<ANTE*mult){if(p.human)gameLog('You can\'t cover the ante — no cards this round.','bad');continue;}
    const s={p,cards:[],ev:null,folded:false,allIn:false,bet:0,contrib:0,tip:0,extra:0,act:'',disc:new Set(),shown:false,paid:0,won:0,ready:false,done:false};
    pay(s,ANTE*mult);s.bet=0;s.act='Ante';seats.push(s);}
  G.dealerIdx=(G.dealerIdx+1)%Math.max(1,seats.length);
  HD={n:G.handNo,tu:0,phase:'tip',ev,mult,maxSwap:ev==='freeswap'?5:MAX_SWAP,t:seats.some(s=>isPerson(s.p))?12:.6,seats,deck:null,curBet:0,raises:0,need:new Set(),actor:-1,dealer:G.dealerIdx,size:BET_SMALL,aiT:0,result:'',winners:[]};
  for(const s of seats)if(!isPerson(s.p)&&s.p.chips>120&&rnd()<s.p.tip*G.diff.rival){const t=Math.min(s.p.chips-60,Math.round((10+rnd()*45)/5)*5);s.p.chips-=t;s.tip=t;s.paid+=t;s.act='Tipped '+t;}
  if(ev){banner(TABLE_EVENTS[ev].name,TABLE_EVENTS[ev].desc,'great');gameLog(TABLE_EVENTS[ev].name+': '+TABLE_EVENTS[ev].desc,'good');}
  for(const s of seats)if(s.tip)bark(s.p,'tip',.5);
  Snd.play('shuffle');setTimeout(()=>Snd.play('chips'),650);refreshTable(true);
}
function tipDealer(n,seat){const s=seat||humanSeat();if(!HD||HD.phase!=='tip'||!s)return;if(s.p.chips<n){if(!seat){toast('Not enough chips');Snd.play('error');}return;}
  s.p.chips-=n;s.tip+=n;s.paid+=n;if(s.p.human){G.stats.tipped=(G.stats.tipped||0)+n;if(G.stats.tipped>=200&&typeof Meta!=='undefined')Meta.ach('tipper');}s.act='Tipped '+s.tip;Snd.play('coin');refreshTable(true);}
function extraHands(seat){const gift=HD.ev==='gift'?1:0;const others=HD.seats.reduce((a,s)=>a+s.tip,0)-seat.tip;return Math.min(4,gift+Math.floor(6*seat.tip/(seat.tip+others+60)));}
/* tips also buy better swaps: replacements drawn best of N, and the top tipper may swap one extra card */
const swapLuckOf=extra=>1+Math.min(2,extra);
function favouriteSeat(){if(!HD)return null;let best=null,tie=false;for(const s of HD.seats){if(s.tip<10)continue;if(!best||s.tip>best.tip){best=s;tie=false;}else if(s.tip===best.tip)tie=true;}return tie?null:best;}
function dealCards(){
  HD.deck=newDeck();HD.muck=[];
  const order=shuffleArr(HD.seats.slice());
  for(const s of order){
    s.extra=extraHands(s);let best=null;const cands=[];
    for(let k=0;k<=s.extra&&HD.deck.length>=5;k++){const c=HD.deck.splice(0,5);cands.push(c);const e=eval5(c);if(!best||e.score>best.e.score)best={c,e};}
    for(const c of cands)if(c!==best.c)HD.deck.push(...c);
    shuffleArr(HD.deck);s.cards=best.c;s.ev=best.e;
    s.luck=swapLuckOf(s.extra);
  }
  const fav=favouriteSeat();for(const s of HD.seats){s.fav=s===fav;s.maxSwap=Math.min(5,(HD.maxSwap||MAX_SWAP)+(s.fav?1:0));}
  if(fav&&fav.p.human){G.stats.favs=(G.stats.favs||0)+1;if(G.stats.favs>=3&&typeof Meta!=='undefined')Meta.ach('pet');}
  if(fav){if(fav.p.human)gameLog("You're the dealer's favourite: swap up to "+fav.maxSwap+' cards.','good');bark(fav.p,'tip',.6);}
  HD.phase='bet1';Snd.play('deal');
  const hs=humanSeat();if(hs&&hs.extra)gameLog(`The dealer smiles on you: best of ${hs.extra+1} hands.`,'good');
  beginRound(BET_SMALL*(HD.mult||1));
}
function beginRound(size){
  HD.size=size;HD.curBet=0;HD.raises=0;for(const s of HD.seats){s.bet=0;if(!s.folded&&!s.allIn)s.act='';}
  HD.need=new Set(HD.seats.map((s,i)=>i).filter(i=>!HD.seats[i].folded&&!HD.seats[i].allIn));
  if(activeSeats().length<=1||HD.need.size<=1&&HD.seats.filter(s=>!s.folded&&!s.allIn).length<=1){advance();return;}
  HD.actor=nextActor(HD.dealer);HD.tu++;HD.aiT=.7;HD.t=25;refreshTable(true);
}
function nextActor(from){const n=HD.seats.length;for(let k=1;k<=n;k++){const i=(from+k)%n;if(HD.need.has(i))return i;}return -1;}
function toCall(s){return Math.max(0,HD.curBet-s.bet);}
function act(i,type){
  const s=HD.seats[i];if(!s||HD.actor!==i)return;
  const call=toCall(s);
  if(s.p.human&&(type==='call'||type==='check'))G.humanAggro=(G.humanAggro||0)*.97;
  if(type==='fold'){bark(s.p,'fold',.25);s.folded=true;s.act='Fold';HD.need.delete(i);Snd.play('fold');}
  else if(type==='check'||(type==='call'&&call===0)){s.act='Check';HD.need.delete(i);Snd.play('click');}
  else if(type==='call'){pay(s,call);s.act=s.allIn?'All in':'Call '+HD.curBet;HD.need.delete(i);Snd.play('chips');}
  else if(type==='raise'){if(s.p.human)G.humanAggro=(G.humanAggro||0)*.9+1;
    if(HD.raises>=MAX_RAISES){act(i,'call');return;}
    const target=HD.curBet+HD.size;pay(s,target-s.bet);HD.curBet=Math.max(HD.curBet,s.bet);HD.raises++;
    bark(s.p,s.allIn?'allin':'raise',s.allIn?1:.35);s.act=s.allIn?'All in':(call?'Raise '+HD.curBet:'Bet '+HD.curBet);
    HD.need=new Set(HD.seats.map((x,j)=>j).filter(j=>j!==i&&!HD.seats[j].folded&&!HD.seats[j].allIn));Snd.play('chips');
  }
  if(activeSeats().length<=1){settle();return;}
  HD.need.forEach(j=>{if(HD.seats[j].allIn)HD.need.delete(j);});
  if(!HD.need.size){HD.actor=-1;advance();return;}
  HD.actor=nextActor(i);HD.tu++;HD.aiT=.55+rnd()*.5;HD.t=25;refreshTable(true);
}
function aiAct(i){
  const s=HD.seats[i],p=s.p,call=toCall(s),pot=potTotal(),pre=HD.phase==='bet1';
  const opp=HD.seats.filter(o=>o!==s&&!o.folded),nOpp=Math.max(1,opp.length);
  const after=HD.seats.filter((o,j)=>!o.folded&&!o.allIn&&HD.need.has(j)&&j!==i).length; // players still to act behind me
  const late=after===0?1:after===1?.5:0;
  const aggr=p.aggr*G.diff.rival,base=handStrength(s,pre);
  // how strong I need to be shrinks against fewer opponents
  let eff=base-(nOpp-1)*.035+late*.05+(rnd()-.5)*.08;
  // after the draw, read the table: someone who stood pat is strong; someone who drew three is weak
  if(!pre){const fear=opp.reduce((a,o)=>a+(o.drew===0?.06:o.drew>=3?-.04:0),0);eff-=fear;}
  // remember who bluffs: players who raise a lot get called lighter
  const raiser=opp.find(o=>/^(Raise|Bet|All in)/.test(o.act));if(raiser&&raiser.p.human){const r=G.humanAggro||0;eff+=Math.min(.08,r*.02);}
  const odds=call/(pot+call||1);
  const draw=pre&&base<.45&&(straightDraw(s.cards)||Object.values(s.cards.reduce((m,c)=>(m[c.s]=(m[c.s]||0)+1,m),{})).some(n=>n===4));
  // monsters sometimes slow-play early to trap
  if(base>.9&&pre&&HD.raises===0&&rnd()<.35+p.bluff)return act(i,call?'call':'check');
  if(call>0){
    if(draw&&odds<.3)return act(i,rnd()<.25+aggr*.3&&HD.raises<MAX_RAISES?'raise':'call');           // semi-bluff or chase
    if(eff<odds+.1*(1-aggr)&&eff<.5){if(rnd()<p.bluff*.5*late&&nOpp<=2&&HD.raises<2)return act(i,'raise');return act(i,'fold');}
    if(eff>.74-aggr*.18&&HD.raises<MAX_RAISES&&rnd()<.35+aggr*.45)return act(i,'raise');
    return act(i,'call');}
  const bluff=rnd()<p.bluff*(late?1.4:.6)*(nOpp<=2?1.3:.7)&&base<.4;
  if((eff>.55-aggr*.18||bluff||draw&&rnd()<.3)&&HD.raises<MAX_RAISES&&rnd()<.35+aggr*.5)return act(i,'raise');
  return act(i,'check');
}
const MAX_CHANGES=1,MAX_SWAP=3;
function drawInto(s,idxs){
  const n=idxs.length;if(!n)return;const tries=Math.max(1,s.luck||1),sets=[];let best=null;
  for(let t=0;t<tries;t++){const set=[];
    for(let j=0;j<n;j++){if(!HD.deck.length){if(!HD.muck.length)break;HD.deck=shuffleArr(HD.muck);HD.muck=[];}set.push(HD.deck.pop());}
    if(set.length<n){HD.deck.push(...set);break;}sets.push(set);
    const cs=s.cards.slice();idxs.forEach((ix,j)=>cs[ix]=set[j]);const e=eval5(cs);if(!best||e.score>best.e.score)best={set,cs,e};}
  if(!best)return;
  for(const set of sets)if(set!==best.set)HD.deck.unshift(...set);
  for(const i of idxs)HD.muck.push(s.cards[i]);
  s.cards=best.cs;s.ev=best.e;s.drew+=n;s.luckUsed=sets.length;
}
function advance(){
  if(activeSeats().length<=1){settle();return;}
  if(HD.phase==='bet1'){
    HD.phase='draw';HD.actor=-1;for(const s of HD.seats){s.changes=MAX_CHANGES;s.drew=0;s.disc=new Set();}
    HD.t=HD.seats.some(s=>isPerson(s.p)&&!s.folded)?25:.6;refreshTable(true);
  }else if(HD.phase==='draw'){
    for(const s of HD.seats){if(s.folded||isPerson(s.p))continue;
      while(s.changes>0){const d=aiDiscards(s.cards,s.ev,s.maxSwap);if(!d.length)break;drawInto(s,d);s.changes--;}}
    for(const s of HD.seats)if(!s.folded){const used=MAX_CHANGES-s.changes;s.act=s.drew?`Swapped ${s.drew}`:'Stands pat';s.disc=new Set();}
    Snd.play('deal');HD.phase='bet2';beginRound(BET_BIG*(HD.mult||1));
  }else if(HD.phase==='bet2'){settle();}
}
function humanSwap(){
  const s=humanSeat();if(!HD||HD.phase!=='draw'||!s||s.folded||!s.disc.size||s.changes<=0)return;
  drawInto(s,[...s.disc]);s.disc=new Set();s.changes--;Snd.play('deal');if(s.luckUsed>1)toast(`The dealer drew your swap best of ${s.luckUsed}`);if(!G.mp)HD.t=20;
  if(s.changes<=0)drawDone(s);else refreshTable(true);
}
function drawDone(s){if(s)s.done=true;if(!G.mp||allDrawn())advance();else refreshTable(true);}
const allDrawn=()=>HD.seats.filter(s=>!s.folded&&isPerson(s.p)).every(s=>s.done||s.changes<=0);
const allReady=()=>HD.seats.filter(s=>isPerson(s.p)).every(s=>s.ready);
function dealNow(){if(!HD||HD.phase!=='tip')return;const s=humanSeat();if(!G.mp){dealCards();return;}if(s)s.ready=true;if(allReady())dealCards();else refreshTable(true);}
function confirmDraw(){if(!HD||HD.phase!=='draw')return;const s=humanSeat();if(s&&s.disc.size&&s.changes>0){humanSwap();return;}standPat();}
function standPat(){if(!HD||HD.phase!=='draw')return;const s=humanSeat();if(s){s.disc=new Set();drawDone(s);}else if(!G.mp)advance();}
function toggleDiscard(i){const s=humanSeat();if(!HD||HD.phase!=='draw'||!s||s.folded||s.changes<=0)return;const cap=s.maxSwap||HD.maxSwap||MAX_SWAP;if(!s.disc.has(i)&&s.disc.size>=cap){toast('You can swap up to '+cap+' cards'+(s.fav?'':'. The dealer\'s favourite gets one more.'));Snd.play('error');return;}s.disc.has(i)?s.disc.delete(i):s.disc.add(i);Snd.play('card');refreshTable(true);}
function hs0(){return humanSeat();}
function settle(){
  HD.actor=-1;const live=activeSeats();
  const winsBy=new Map();
  if(live.length===1){const w=live[0];const pot=potTotal();w.p.chips+=pot;w.won+=pot;winsBy.set(w,pot);}
  else{
    for(const s of live)s.shown=true;
    const levels=[...new Set(live.map(s=>s.contrib))].sort((a,b)=>a-b);let prev=0;
    for(const L of levels){
      let part=0;for(const s of HD.seats)part+=Math.max(0,Math.min(s.contrib,L)-prev);
      const elig=live.filter(s=>s.contrib>=L);const best=Math.max(...elig.map(s=>s.ev.score));const ws=elig.filter(s=>s.ev.score===best);
      const each=Math.floor(part/ws.length);ws.forEach((w,k)=>{const a=each+(k===0?part-each*ws.length:0);w.p.chips+=a;w.won+=a;winsBy.set(w,(winsBy.get(w)||0)+a);});prev=L;
    }
  }
  HD.winners=[...winsBy.keys()];
  for(const [w,amt] of winsBy)if(!isPerson(w.p))bark(w.p,'win',amt>=120?1:.6);
  if(hs0()&&winsBy.has(hs0())){const losers=live.filter(s=>!winsBy.has(s)&&!isPerson(s.p));if(losers.length)bark(losers[(rnd()*losers.length)|0].p,'lose',.9);}
  HD.wl=[...winsBy.entries()].map(([s,a])=>[HD.seats.indexOf(s),a,live.length>1?s.ev.rank:-1]);
  HD.result=resultText(HD);
  const hs=humanSeat();
  if(hs&&winsBy.has(hs)){Snd.play('potwin');gameLog(HD.result,'good');potWin(winsBy.get(hs));}
  else gameLog(HD.result);
  HD.phase='showdown';HD.t=anyPerson()?4.5:1.2;refreshTable(true);
}
function resultText(h){return (h.wl||[]).map(([i,a,r])=>{const p=h.seats[i]&&h.seats[i].p;if(!p)return '';return `${p.human?'You':p.short||p.name} win${p.human?'':'s'} ${a}${r>=0?' with '+HANDS[r]:''}`;}).join(' · ');}
function finishHand(){
  for(const s of HD.seats){
    const k=s.ev.unit;
    if(s.p.human){if(!G.over)spawnHandUnits(k,s.ev);}
    else if(s.p.remote){}
    else{s.p.power+=unitDps(k)*(1+UNITS[k].hp/900)*(.85+rnd()*.3);s.p.lastUnit=k;}
  }
  HD.phase='done';refreshTable(true);
}
function pokerUpdate(dt){
  if(!HD||HD.phase==='done')return;
  HD.t-=dt;
  if(HD.phase==='tip'){if(HD.t<=0||G.mp&&allReady())dealCards();return;}
  if(HD.phase==='bet1'||HD.phase==='bet2'){
    if(HD.actor<0)return;const s=HD.seats[HD.actor];
    if(isPerson(s.p)){if(HD.t<=0){act(HD.actor,toCall(s)?'fold':'check');if(s.p.human)gameLog('Time — auto '+(s.act||'').toLowerCase());}}
    else{HD.aiT-=dt;if(HD.aiT<=0)aiAct(HD.actor);}
    return;}
  if(HD.phase==='draw'){if(HD.t<=0||G.mp&&allDrawn())advance();return;}
  if(HD.phase==='showdown'){if(HD.t<=0){finishHand();if(G.mp)NET.hostStartWave();else startWave();}}
}
