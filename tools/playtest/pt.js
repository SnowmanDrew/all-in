// Playtest harness: one strategy bot plays full games headless at full speed and reports what happened.
// usage: node pt.js <strategy> <difficulty> <runs>
const { chromium } = require('playwright');
const strat=process.argv[2]||'pro',diff=process.argv[3]||'standard',runs=+(process.argv[4]||2),MAXW=+(process.argv[5]||99);
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(500);
await p.evaluate(()=>{try{localStorage.clear();}catch(e){}});
const res=await p.evaluate(({strat,diff,runs,MAXW})=>{
  const S={ // the eleven players
    pro:     {poker:'pro',tip:'smart',disc:'smart',army:'rally',defend:1,ropes:1,ups:1,merge:1,repair:1},
    afk:     {poker:'afk',tip:'none',disc:'none',army:'idle',defend:0,ropes:0,ups:0,merge:0,repair:0},
    station: {poker:'call',tip:'none',disc:'none',army:'rally',defend:1,ropes:1,ups:1,merge:1,repair:1},
    maniac:  {poker:'maniac',tip:'max',disc:'random',army:'rally',defend:1,ropes:1,ups:1,merge:1,repair:1},
    nit:     {poker:'nit',tip:'none',disc:'smart',army:'rally',defend:1,ropes:1,ups:1,merge:1,repair:1},
    hoarder: {poker:'pro',tip:'none',disc:'smart',army:'rally',defend:1,ropes:0,ups:0,merge:1,repair:0},
    turtle:  {poker:'pro',tip:'smart',disc:'smart',army:'turtle',defend:1,ropes:0,ups:1,upOrder:['casino','hp','croupier','dmg'],merge:1,repair:1},
    rusher:  {poker:'pro',tip:'smart',disc:'smart',army:'rush',defend:0,ropes:0,ups:1,merge:1,repair:0},
    mazer:   {poker:'pro',tip:'none',disc:'smart',army:'rally',defend:1,ropes:2,ups:0,merge:0,repair:0},
    gambler: {poker:'pro',tip:'smart',disc:'smart',army:'rally',defend:1,ropes:1,ups:1,merge:1,repair:1,gamble:1},
    nomerge: {poker:'pro',tip:'smart',disc:'smart',army:'rally',defend:1,ropes:1,ups:1,merge:0,repair:1},
  }[strat];
  // a serpentine of velvet ropes across the road (the mazer builds twice as much)
  const ROPES=[];const cols=S.ropes===2?[9,13,17,21,25,29,32]:[13,23,32];cols.forEach((c,i)=>{if(i%2===0)for(let r=2;r<=14;r++)ROPES.push([c,r]);else for(let r=17;r>=5;r--)ROPES.push([c,r]);});
  const out=[];
  const gambleNow=()=>{ // slots and Megaways while there are chips to burn
    while(G.me.chips>60){
      if(Math.random()<.5){G.me.chips-=10;window.eval("if(!SL)SL={reels:['cherry','lemon','bell'],spin:false,stop:0,last:''};SL.final=[slotPick(),slotPick(),slotPick()];try{slotPay();}catch(e){}SL.spin=false;");G.stats.gSlots=(G.stats.gSlots||0)+1;}
      else{G.me.chips-=MW_BET;const r=mwPlay(Math.random);let won=Math.round((r.total+(r.bonus?r.bonus.total:0))*MW_BET);G.me.chips+=won;G.stats.gMw=(G.stats.gMw||0)+1;}
      if(Math.random()<.25)break;}};
  for(let run=0;run<runs;run++){
    newGame(diff);G.running=false;let guard=0,ropeI=0,lastW=0;const waves=[],hands=[];let gambled=0,gambleIn=0;
    while(!G.over&&guard++<600000&&!(G.wave>=MAXW&&G.phase==='break')){
      // ---- minigames ----
      if(G.phase==='mini'&&typeof MG!=='undefined'&&MG){
        if(S.gamble&&MG.kind==='roulette'&&MG.state==='bet'&&G.me.chips>20){const before=G.me.chips;MG.bet=Math.min(100,G.me.chips);MG.choice=['red','black','odd','high'][(Math.random()*4)|0];rouSpin();if(MG&&MG.state==='spin')rouSettle();gambled++;gambleIn+=G.me.chips-before;}
        else if(S.gamble&&MG.kind==='blackjack'&&MG.state==='bet'&&G.me.chips>20){const before=G.me.chips;MG.bet=Math.min(100,G.me.chips);bjDeal();if(typeof bjDealNow!=='undefined')bjDealNow(MG);while(MG&&MG.state==='play'&&bjVal(MG.ph)<17)bjHit();if(MG&&MG.state==='play')bjStand();gambled++;gambleIn+=G.me.chips-before;}
        if(MG)closeMinigame();}
      if(G.phase==='perk'&&G.perkPending){const o=G.perkPending.offer;perkChoose(o.find(k=>!PERKS[k].deck)||o[0]);}
      // ---- poker ----
      if(HD&&HD.phase==='tip'){const hs=humanSeat();if(hs){if(S.tip==='smart'&&hs.p.chips>140)tipDealer(25);else if(S.tip==='max'&&hs.p.chips>60)tipDealer(50);}dealCards();}
      if(HD&&(HD.phase==='bet1'||HD.phase==='bet2')&&HD.actor>=0&&HD.seats[HD.actor].p.human){
        const s=HD.seats[HD.actor],ev=s.ev,call=toCall(s);let a;
        if(S.poker==='pro')a=ev.rank>=3&&HD.raises<2?'raise':(ev.rank>=1||call===0||(HD.phase==='bet1'&&call<=10))?(call?'call':'check'):'fold';
        else if(S.poker==='afk')a=call?'fold':'check';
        else if(S.poker==='call')a=call?'call':'check';
        else if(S.poker==='maniac')a=HD.raises<3?'raise':(call?'call':'check');
        else if(S.poker==='nit')a=ev.rank>=2?(call?'call':'check'):(call?'fold':'check');
        act(HD.actor,a);}
      if(HD&&HD.phase==='draw'){const hs=humanSeat();if(hs&&!hs.folded){
          if(S.disc==='smart'){for(let k=0;k<3&&HD.phase==='draw';k++){const d=aiDiscards(hs.cards,hs.ev);if(!d.length)break;for(const i of d)toggleDiscard(i);humanSwap();}}
          else if(S.disc==='random'&&HD.phase==='draw'){const n=1+((Math.random()*3)|0);const idx=[0,1,2,3,4].sort(()=>Math.random()-.5).slice(0,n);for(const i of idx)toggleDiscard(i);humanSwap();}}
        if(HD&&HD.phase==='draw')standPat();}
      if(HD&&HD.phase==='showdown'&&HD.n!==hands.lastN){const hs=humanSeat();hands.lastN=HD.n;if(hs)hands.push(hs.folded?-1:hs.ev.rank);}
      // ---- army ----
      if(guard%30===0){
        if(S.merge){let merged=true,n=0;while(merged&&n++<20){merged=false;for(const u of G.units){const r=recipesFor(u.k).find(r=>G.units.some(o=>o!==u&&o.k===r.partner));if(r){mergeNearest(u,r.partner);merged=true;break;}}}}
        if(S.defend){const atk=G.enemies.filter(e=>!e.dead&&e.atCasino);if(atk.length){const near=G.units.slice().sort((a,b)=>Math.hypot(a.x-BASE.x,a.y-BASE.y)-Math.hypot(b.x-BASE.x,b.y-BASE.y)).slice(0,Math.ceil(G.units.length/3));for(const u of near)if(u.order.t!=='attack')orderAttack([u],atk[0]);}}
        const spot=S.army==='rally'?[27*TILE,11*TILE]:S.army==='turtle'?[BASE.fx-20,BASE.y]:S.army==='rush'?[4*TILE,10*TILE]:null;
        if(spot)for(const u of G.units)if(u.order.t==='idle'&&Math.hypot(u.x-spot[0],u.y-spot[1])>(S.army==='turtle'?50:90)&&!u.target)orderMove([u],spot[0]+(Math.random()-.5)*(S.army==='turtle'?40:60),spot[1]+(Math.random()-.5)*(S.army==='turtle'?70:90),true);
        // spending
        const reserve=S.gamble?20:70+G.wave*3;
        if(S.ropes&&guard%900===0)ropeI=0;
        if(S.ropes&&ropeI<ROPES.length&&G.me.chips>(S.ropes===2?12:(G.wave<8?35:reserve))+10){const [c,r]=ROPES[ropeI];if(grid[gi(c,r)]!==0||NO_BUILD.has(gi(c,r)))ropeI++;else if(canBarricade(c,r)===''){placeBarricade(c,r);ropeI++;}else ropeI++;}
        if(S.repair){const rep=G.workers.filter(w=>w.mode==='repair').length;if(G.base.hp<G.base.maxHp*.6&&rep<2)setDuty(1);else if(G.base.hp>=G.base.maxHp*.95&&rep>0)setDuty(-1);}
        if(S.ups){const order=S.upOrder||(G.base.hp<G.base.maxHp*.5&&G.base.tier<3?['casino']:[]).concat(G.workers.length<5?['croupier']:[],'dmg','hp','casino','dmg','hp');
          for(const k of order){const l=upLevel(k);if(l<UPGRADES[k].max&&G.me.chips-UPGRADES[k].cost(l)>reserve+60){buyUpgrade(k);break;}}}
        if(S.gamble&&G.phase==='break'&&guard%300===0){const before=G.me.chips;gambleNow();gambled++;gambleIn+=G.me.chips-before;}
      }
      update(STEP);
      if(G.wave!==lastW&&G.phase==='wave'){lastW=G.wave;}
      if((G.phase==='break'||G.phase==='mini'||G.over)&&waves.length<G.wave&&G.round){const R=G.round;waves.push({w:G.wave,hp:Math.round(G.base.hp),max:G.base.maxHp,ch:Math.round(G.me.chips),u:G.units.length,pw:Math.round(armyPower()),lk:R.leaks||0,lost:Math.round(R.hpLost||0),rv:G.players.filter(q=>!q.human&&q.alive).length});}
    }
    const killers={};for(const e of G.enemies)if(!e.dead&&e.atCasino)killers[e.k]=(killers[e.k]||0)+1;
    const hr={};for(const h of hands)hr[h<0?'fold':HANDS[h]]=(hr[h<0?'fold':HANDS[h]]||0)+1;
    out.push({strat,diff,won:!!G.won,why:G.won?(G.wave>=MAX_WAVE?'survived':'last standing'):'casino fell',wave:G.wave,place:G.place,mins:Math.round(G.time/60*10)/10,
      leaks:G.stats.leaks,kills:G.stats.kills,merges:G.stats.merges||0,best:G.stats.best>=0?HANDS[G.stats.best]:'-',units:G.units.length,tier:G.base.tier,ups:G.up,croup:G.workers.length,
      killers,hands:hr,gambled,gambleNet:gambleIn,firstHands:hands.slice(0,3).map(h=>h<0?'fold':HANDS[h]),rivalsOut:G.outOrder.map(q=>(q.short||q.name)+'@'+q.outWave).join(' '),waves});
  }
  return out;},{strat,diff,runs,MAXW});
for(const r of res)console.log('RESULT '+JSON.stringify(r));
console.log('ERRS',JSON.stringify(errs.slice(0,5)));await b.close();})();
