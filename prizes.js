'use strict';
/* ============ ALL IN — prizes and two new merges ============
   The first time in a run you hit something special at a table event, the prize is a creature of its own:
     Roulette zero        → Lady Zero       a roulette wheel turns on the street around her: red burns, black slows,
                                            green stops bad luck dead, and her next ball at it hits three times as hard
     Blackjack natural    → Card Counter    every shot deals him a card. On 17+ he stands and fires a hit that scales
                                            with the hand (21 is huge). He can see the next card; Hit me draws it
     Derby long shot win  → Steeplechaser   leaps over the pack, lands behind it, and kicks bad luck back up the road
     Sports parlay (3+)   → The Bookie      Lay Odds on one enemy: chips at odds that grow with its toughness. Kill it
                                            inside 10 seconds and you collect, and whoever lands the blow goes on a hot streak
   After the first time, the old random prizes come back.
   And two merges:
     One-Armed Bandit + Vault Mech → Claw Machine           Grab: lifts one enemy out of the street and drops it back
                                                             at the start of the road (heavies halfway; bosses slip out)
     Card Sharp + Jackpot Jinn     → The Great Vanishing Act Saw in Half: boxes one enemy, saws it for huge damage, and
                                                             anything that survives comes out as two weak, slow halves */

Object.assign(UNITS,{
 m_claw:{name:'Claw Machine',role:'Arcade cabinet',merge:true,tier:2,hp:2100,dmg:62,rate:1.05,range:150,spd:60,r:16,armor:6,kind:'ranged',sp:{targets:2},ab:'grab',
   look:{b:'clawcab',face:'led',c1:'#dc2626',c2:'#fde047',shot:'capsule'},desc:'A slot machine and a vault learned to play the claw. Lobs prize capsules at two targets, and on command grabs one enemy out of the street and drops it back at the start of the road (heavy ones only part of the way; bosses always slip out).'},
 m_vanish:{name:'The Great Vanishing Act',role:'Stage magician',merge:true,tier:1,hp:780,dmg:46,rate:1.2,range:190,spd:92,r:12,armor:2,kind:'ranged',sp:{targets:2},ab:'saw',
   look:{b:'magician',face:'sly',body:'#111827',coat:true,bowtie:'#dc2626',hat:'top',hatCol:'#111827',cape:'#991b1b',mustache:'#111827',skin:'#e8c9a4',weapon:'wand',shot:'card',mouth:'grin'},
   desc:'A card sharp with a genie for an assistant. Throws cards, and on command saws one enemy in half: it is boxed up for a moment, then takes huge damage, and if it survives it comes out as two weak, slow halves that bite half as hard.'},
 sec_zero:{name:'Lady Zero',role:'Wheel queen',secret:true,bonus:true,hand:9,hp:1450,dmg:44,rate:1.2,range:170,spd:84,r:13,armor:3,kind:'ranged',sp:{},how:'Hit zero on Roulette Night',
   look:{b:'ladyzero',face:'sly',body:'#111827',gown:true,sequins:'#fde68a',hair:'#111827',skin:'#e8c9a4',mouth:'grin',weapon:'ball',shot:'ball'},
   desc:'Zero came up and she stepped off the wheel. A roulette wheel turns on the street around her: bad luck on red burns, on black it slows, and on green it stops dead and her next ball at it hits three times as hard.'},
 sec_counter:{name:'Card Counter',role:'Blackjack pro',secret:true,bonus:true,hand:9,hp:950,dmg:52,rate:1.5,range:185,spd:92,r:12,armor:2,kind:'ranged',sp:{},ab:'hitme',how:'Hit a natural blackjack on Blackjack Night',
   look:{b:'counter',face:'sly',body:'#6d28d9',skin:'#e8c9a4',pants:'#1e293b',weapon:'cardfan',shot:'card',mouth:'flat'},
   desc:'Every shot deals him a card. On 17 or more he stands and fires a hit that grows with the hand: 21 is a big blast, a two-card blackjack is bigger. He can always see the next card coming; Hit me takes it. Over 21 and he busts, stunned for a moment.'},
 sec_steeple:{name:'Steeplechaser',role:'Jump jockey',secret:true,bonus:true,hand:9,hp:1700,dmg:72,rate:1,range:26,spd:160,r:15,armor:4,kind:'melee',sp:{},how:'Win on a long shot at Derby Night',
   look:{b:'steeple',face:'beady',c1:'#a8a29e',c2:'#f5f5f4',silk:'#15803d',silk2:'#f8fafc',num:'7'},
   desc:'The long shot that came in. Every few seconds it leaps clean over the pack and lands behind it, then kicks the bad luck it finds there back up the road.'},
 sec_bookie:{name:'The Bookie',role:'Odds maker',secret:true,bonus:true,hand:9,hp:1150,dmg:40,rate:1.3,range:185,spd:84,r:12,armor:2,kind:'ranged',sp:{targets:2},ab:'odds',how:'Win a 3-game parlay on Sports Night',
   look:{b:'bookie',face:'sly',body:'#57534e',vest:'#a16207',tie:'#7f1d1d',hat:'fedora',hatCol:'#3f3f46',skin:'#d6b08c',mouth:'grin',weapon:'slate',shot:'slip'},
   desc:'He took your parlay and wants a piece of the action. Lay Odds on one enemy: he stakes your chips at odds that grow with how tough it is. Kill it within 10 seconds and you collect, and whichever creature landed the blow goes on a hot streak.'}});
UNITS.m_vanish.detect=true;
MERGES.push(['m_bandit','tp_hi','m_claw'],['s_lo','t_hi','m_vanish']);
Object.assign(ABIL,{
  grab:{name:'Grab',type:'enemy',cd:16,icon:'grab',desc:'The claw drops on one enemy, lifts it out of the street and drops it back at the start of the road. Heavy bad luck only goes part of the way back. Bosses always slip out.'},
  saw:{name:'Saw in Half',type:'enemy',cd:18,icon:'saw',desc:'Boxes one enemy for a moment, then saws it for huge damage. If it survives it comes out as two weak, slow halves that bite half as hard.'},
  odds:{name:'Lay Odds',type:'enemy',cd:30,icon:'odds',desc:'Stake some chips that this enemy dies within 10 seconds, at odds that grow with how tough it is. Win and you collect, and the creature that landed the blow goes on a hot streak.'},
  hitme:{name:'Hit Me',type:'self',cd:5,icon:'hitme',desc:'Take the next card now (he can see it: it is shown above him). Use it to push a 17 to 21. Over 21 is a bust.'}});
Object.assign(ABIL_KEY,{grab:'N',saw:'D',odds:'U',hitme:'C'});
Object.assign(ICONS,{
  grab:'<path d="M12 2v7"/><path d="M7 9h10"/><path d="M9 9l-3 6 2.5 4"/><path d="M15 9l3 6-2.5 4"/><path d="M12 9v9"/>',
  saw:'<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
  odds:'<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
  hitme:'<rect x="5" y="3" width="13" height="18" rx="2"/><path d="M11.5 8v8M7.5 12h8"/>'});
{const _cr=castRange;castRange=function(u,abk){return abk==='grab'?260:abk==='saw'?230:abk==='odds'?340:_cr(u,abk);};}

/* ---------- the prizes ---------- */
const PRIZE_OF={roulette:'sec_zero',blackjack:'sec_counter',derby:'sec_steeple',sports:'sec_bookie'};
function prizeCreature(kind){const k=PRIZE_OF[kind];if(!k||!G||(G.prizes=G.prizes||{})[kind])return null;G.prizes[kind]=1;
  const u=spawnBonus(k,'Prize!');u.popAt=G.time;if(G.rally)u.rallyAt=G.time+.5;return `${UNITS[k].name} joins your casino`;}
{const _sp=specialPrize;specialPrize=function(){const p=typeof MG!=='undefined'&&MG?prizeCreature(MG.kind):null;return p||_sp.apply(this,arguments);};}
{const _sb=sbApplyMine;sbApplyMine=function(SB){const r=_sb.apply(this,arguments);try{const L=sbLocal(SB),s=L&&L.slip;if(s&&s.right>=3&&s.right===s.picked){const p=prizeCreature('sports');if(p)gameLog(`Sports Night parlay: ${p}.`,'good');}}catch(e){}return r;};}

/* ---------- helpers ---------- */
// a point on the enemies' route: f=1 is the start of the road, .5 halfway to the casino
function routePoint(f){let c=SPAWN.c,r=SPAWN.r;if(!open(c,r))r=Math.floor(SPAWN.y/TILE);const F0=flow[gi(c,r)];if(!isFinite(F0)||f>=1)return {x:SPAWN.x+26,y:SPAWN.y+(rnd()-.5)*30};
  for(let i=0;i<300;i++){if(flow[gi(c,r)]<=F0*f)break;let bc=c,br=r,bv=flow[gi(c,r)];for(const [dc,dr] of NB){const nc=c+dc,nr=r+dr;if(!open(nc,nr))continue;const v=flow[gi(nc,nr)];if(v<bv){bv=v;bc=nc;br=nr;}}if(bc===c&&br===r)break;c=bc;r=br;}
  return {x:c*TILE+15,y:r*TILE+15};}
const isHeavy=e=>e.def.mini||e.def.hp>=3;
// how far along the road an enemy still has to go: 1 at the start, 0 at the casino
function routeFrac(e){let c=SPAWN.c,r=SPAWN.r;if(!open(c,r))r=Math.floor(SPAWN.y/TILE);const F0=flow[gi(c,r)],v=flow[gi(clamp(Math.floor(e.x/TILE),0,COLS-1),clamp(Math.floor(e.y/TILE),0,ROWS-1))];return isFinite(F0)&&isFinite(v)&&F0>0?clamp(v/F0,0,1):.5;}

/* ---------- the actives ---------- */
{const _da=doAbility;doAbility=function(u,abk,tgt){if(!['grab','saw','odds','hitme'].includes(abk))return _da(u,abk,tgt);
  const A=ABIL[abk],st=uStat(u),e=tgt&&tgt.e;u.cds[abk]=A.cd;u.atk=1;
  if(abk==='hitme'){ccHit(u,st);return;}
  if(!hlAlive(e)){u.cds[abk]=1;return;}
  if(abk==='grab'){e.clawT=1.05;e.clawAt=G.time;e.clawBoss=!!e.def.boss;e.stun=Math.max(e.stun||0,1.1);Snd.play('claw');
    rLater(.45,()=>{if(!hlAlive(e))return;if(e.def.boss){e.clawT=0;e.stun=Math.max(e.stun||0,.3);floatText(e.x,e.y-e.r*2-8,'So close!','#fde047',13);Snd.play('error');}else Snd.play('whoosh');});
    rLater(1.0,()=>{if(!hlAlive(e)||e.def.boss)return;const heavy=isHeavy(e),P=routePoint(heavy?Math.min(1,Math.max(.5,routeFrac(e)+.35)):1),ox=e.x,oy=e.y;e.x=P.x+(rnd()-.5)*16;e.y=P.y+(rnd()-.5)*16;
      if(!walkable(e.x,e.y,e.r)){e.x=P.x;e.y=P.y;}e.atCasino=false;e.clawT=0;e.dropAt=G.time;e.stun=Math.max(e.stun||0,.8);hfx({k:'drop',x:e.x,y:e.y,ox,oy,life:.6});
      floatText(e.x,e.y-e.r-12,heavy?'Sent back!':'Back of the line!','#fde047',12);G.fx.push({t:'ring',x:e.x,y:e.y,r0:4,r1:34,col:'#fde047',life:.45,max:.45,w:3});for(let j=0;j<12;j++)spark(e.x,e.y,j%2?'#f472b6':'#fde047',120,.5);Snd.play('thump');});}
  else if(abk==='saw'){const big=e.def.boss||e.def.mini;e.sawAt=G.time;e.sawT=1.5;e.stun=Math.max(e.stun||0,1.6);Snd.play('whoosh');floatText(e.x,e.y-e.r*2-10,'And for my next trick…','#f9a8d4',11);
    rLater(1.0,()=>{if(hlAlive(e))Snd.play('shuffle');});
    rLater(1.5,()=>{if(!hlAlive(e))return;e.sawT=0;const dmg=st.dmg*12+e.maxHp*(e.def.boss?.08:e.def.mini?.18:.3)+e.armor;hitEnemy(e,dmg,u);
      G.fx.push({t:'slash',st:'cut',x:e.x,y:e.y,ux:e.x-30,uy:e.y,a:0,r:Math.max(22,e.r+16),col:'#f8fafc',life:.3,max:.3,seed:rnd()*9});for(let j=0;j<18;j++)spark(e.x,e.y,j%2?'#fde047':'#f9a8d4',160,.6);
      floatText(e.x,e.y-e.r*2-10,'TA-DA!','#fde047',15);Snd.play('stamp');if(hlAlive(e)&&!big&&!e.half)sawSplit(e);});}
  else if(abk==='odds'){const tough=e.maxHp/Math.max(1,waveHp(G.wave));let odds=1.4+1.3*Math.sqrt(tough);if(e.def.boss)odds*=1.4;odds=clamp(Math.round(odds*2)/2,1.5,9);
    const stake=Math.floor(Math.min(G.me.chips,10+2*G.wave,90));if(stake<=0){toast('No chips to stake');Snd.play('error');u.cds.odds=1;return;}
    if(e.bet){toast('There is already a bet on that one');u.cds.odds=1;return;}
    G.me.chips-=stake;gambleTally(-stake);const B={e,u,stake,odds,t0:G.time,T:10};e.bet=B;(G.bets=G.bets||[]).push(B);
    floatText(e.x,e.y-e.r*2-14,`${oddsTxt(odds)} · ${stake} on it`,'#fde68a',12);Snd.play('stamp');gameLog(`The Bookie laid ${stake} chips at ${oddsTxt(odds)} that the ${e.def.name} goes down within 10 seconds.`,'');}};}
const oddsTxt=o=>{const p=o-1;return Number.isInteger(p)?`${p}/1`:`${Math.round(p*2)}/2`;};
// saw in half: two weak, slow halves (40% of what was left each, half the bite, half the gold, never split again)
function sawSplit(e){const rem=e.hp,a=Math.atan2(e.fy||0,e.fx||1)+Math.PI/2;e.dead=true;
  const d=Object.assign(Object.create(e.def),{gold:Math.max(1,Math.floor(e.def.gold/2)),bite:e.def.bite/2,split:0,dmg:e.def.dmg*.6});
  const halves=[];for(const s of [-1,1]){const h=spawnEnemy(e.k);h.def=d;h.hp=h.maxHp=Math.max(1,rem*.4);h.x=e.x+Math.cos(a)*s*9;h.y=e.y+Math.sin(a)*s*9;if(!walkable(h.x,h.y,h.r)){h.x=e.x;h.y=e.y;}
    h.spdMul=.7;h.half=s;h.scale=.74;h.r=e.r*.78;h.armor=e.armor*.5;h.stun=.5;h.d=e.d;h.fx=e.fx;h.fy=e.fy;h.face=e.face;h.revealT=e.revealT;halves.push(h);}
  if(e.bet){const B=e.bet;B.e=halves[0];halves[0].bet=B;}floatText(e.x,e.y+e.r+10,'In two halves!','#f9a8d4',11);}
// the bets
{const _ke=killEnemy;killEnemy=function(e,u){if(e&&!e.dead){e.killedBy=u||null;e.killedAt=G.time;}return _ke(e,u);};}
{const _u=update;update=function(dt){_u(dt);if(!G||!G.bets||!G.bets.length)return;
  for(const B of G.bets){if(B.done)continue;const e=B.e,left=B.T-(G.time-B.t0);
    if(e.dead&&e.killedAt!=null&&e.killedAt-B.t0<=B.T){B.done=true;const pay=Math.round(B.stake*B.odds);G.me.chips+=pay;gambleTally(pay);G.stats.earned+=pay-B.stake;
      const k=e.killedBy;if(k&&!k.dead&&k.def){k.hotT=6;floatText(k.x,k.y-k.r*2-6,'Hot streak!','#fb923c',12);}
      floatText(e.x,e.y-e.r-18,`PAID ${oddsTxt(B.odds)} · +${pay}`,'#fde047',15);for(let i=0;i<24;i++)chipBit(e.x,e.y,220);Snd.play('potwin');gameLog(`The Bookie pays out: +${pay} chips.`,'good');}
    else if(e.dead||left<=0){B.done=true;floatText(e.x,e.y-e.r-18,'Lost the bet','#94a3b8',12);Snd.play('lose');}
    if(B.done)e.bet=null;}
  G.bets=G.bets.filter(B=>!B.done);};}
{const _us=uStat;uStat=function(u){const s=_us(u);if(u.hotT>0){s.dmg*=1.4;s.rate*=1.25;}return s;};}

/* ---------- Card Counter ---------- */
const CC_CARD=()=>{const r=1+((rnd()*13)|0);return r===1?11:Math.min(10,r);};
const ccBJ=u=>u.bj||(u.bj={tot:0,soft:0,cards:[],next:CC_CARD()});
function ccAdd(u){const b=ccBJ(u),v=b.next;b.next=CC_CARD();b.cards.push(v);b.tot+=v;if(v===11)b.soft++;while(b.tot>21&&b.soft>0){b.tot-=10;b.soft--;}return v;}
function ccWould(u){const b=ccBJ(u);let t=b.tot+b.next,s=b.soft+(b.next===11?1:0);while(t>21&&s>0){t-=10;s--;}return t;}
function ccStand(u,w){u.standT=w;u.standAt=G.time;}
function ccHit(u,st){const b=ccBJ(u);if(u.stunT>0)return;ccAdd(u);u.atk=1;Snd.play('deal');
  if(b.tot>21){floatText(u.x,u.y-u.r*2.4,'BUST!','#f87171',15);u.stunT=1.2;u.standT=0;u.bj=null;Snd.play('bust');G.fx.push({t:'ring',x:u.x,y:u.y,r0:u.r,r1:30,col:'#f87171',life:.4,max:.4,w:3});return;}
  if(b.tot===21)ccStand(u,.2);else if(b.tot>=17)ccStand(u,.9);}
function ccFire(u){const b=ccBJ(u),st=uStat(u);let e=u.target&&!u.target.dead?u.target:nearestEnemy(u.x,u.y,st.range+40);if(!e){u.standT=.1;return;}
  const nat=b.cards.length===2&&b.tot===21,M={17:1.6,18:2,19:2.5,20:3.2,21:5}[b.tot]||1.2;u.atk=1;u.face=e.x>u.x?1:-1;u.aim=Math.atan2(e.y-u.y,e.x-u.x);
  if(b.tot===21){splashAt(e.x,e.y,nat?90:70,st.dmg*(nat?7:M),u,'#fde047');floatText(e.x,e.y-e.r-16,nat?'BLACKJACK!':'21!','#fde047',nat?17:15);for(let i=0;i<20;i++)spark(e.x,e.y,i%2?'#fde047':'#fff',170,.6);Snd.play(nat?'jackpot':'potwin');G.shake=Math.min(6,G.shake+2.5);}
  else{hitEnemy(e,st.dmg*M,u);floatText(e.x,e.y-e.r-12,`${b.tot}`,b.tot>=19?'#fde68a':'#e2e8f0',12);Snd.play('card');}
  hfx({k:'ccshot',x:u.x+u.face*u.r*.5,y:u.y-u.r*.6,x1:e.x,y1:e.y,n:b.tot,life:.3});u.bj={tot:0,soft:0,cards:[],next:b.next};u.standT=0;}

/* ---------- passives ---------- */
{const _up=unitPowers;unitPowers=function(u,dt){_up(u,dt);if(u.dead||!G)return;if(u.hotT>0)u.hotT-=dt;const k=u.k,wave=G.phase==='wave';
  if(k==='sec_counter'&&u.standT>0){u.standT-=dt;if(u.standT<=0)ccFire(u);}
  if(k==='sec_steeple'){if(u.kickT>0)u.kickT-=dt;if(wave){u.leapCd=(u.leapCd==null?2:u.leapCd)-dt;if(u.leapCd<=0&&!u.jump&&u.order.t!=='move'&&!(u.stunT>0))steepleLeap(u);}}
  if(k==='sec_zero'){u.wa=((u.wa||0)+dt*.9)%TAU;if(wave)zeroWheel(u,dt);}};}
function steepleLeap(u){const near=hlNear(u.x,u.y,230);if(near.length<2){u.leapCd=.5;return;}
  // the pack: enemies close to the nearest one. Land just behind the one furthest from the casino
  const n0=near.reduce((a,b)=>Math.hypot(b.x-u.x,b.y-u.y)<Math.hypot(a.x-u.x,a.y-u.y)?b:a),pack=near.filter(e=>Math.hypot(e.x-n0.x,e.y-n0.y)<120);if(pack.length<2){u.leapCd=.5;return;}
  const fv=e=>{const c=clamp(Math.floor(e.x/TILE),0,COLS-1),r=clamp(Math.floor(e.y/TILE),0,ROWS-1),v=flow[gi(c,r)];return isFinite(v)?v:-1;},rear=pack.reduce((a,b)=>fv(b)>fv(a)?b:a),ba=hlBack(rear);
  let tx=rear.x,ty=rear.y,ok=false;for(const d of [44,30,18,60]){const x=rear.x+Math.cos(ba)*d,y=rear.y+Math.sin(ba)*d;if(walkable(x,y,u.r)){tx=x;ty=y;ok=true;break;}}if(!ok||Math.hypot(tx-u.x,ty-u.y)<50){u.leapCd=.6;return;}
  const st=uStat(u);u.jump={sx:u.x,sy:u.y,tx,ty,t:0,T:.62,dmg:st.dmg*2};u.order={t:'idle'};u.path=[];u.target=null;u.leapCd=7;u.kickT=5.5;
  hfx({k:'hurdle',x:(u.x+tx)/2,y:(u.y+ty)/2+6,a:Math.atan2(ty-u.y,tx-u.x),life:.9});Snd.play('pounce');floatText(u.x,u.y-u.r*2,'Hup!','#bbf7d0',12);
  rLater(.66,()=>{if(!u.dead){u.anchor={x:u.x,y:u.y};u.order={t:'idle'};}});}
const ZERO_R=115,ZERO_N=14;
function zeroSector(u,e){let a=Math.atan2(e.y-u.y,e.x-u.x)-(u.wa||0);a=((a%TAU)+TAU)%TAU;const i=Math.floor(a/(TAU/ZERO_N));return i<2?'g':i%2?'b':'r';}
function zeroWheel(u,dt){const st=uStat(u);for(const e of hlNear(u.x,u.y,ZERO_R)){if(Math.hypot(e.x-u.x,e.y-u.y)<u.r*.8)continue;const s=zeroSector(u,e);e.zs=s;e.zsT=G.time;
  if(s==='r'){e.zBurn=(e.zBurn||0)+st.dmg*.8*dt;if(e.zBurn>=st.dmg*.4){hitEnemy(e,e.zBurn,u);e.zBurn=0;if(G.fx.length<150&&rnd()<.3)spark(e.x,e.y,'#f87171',70,.35);}}
  else if(s==='b'){e.slow=Math.max(e.slow,e.def.boss?.2:.4);e.slowT=Math.max(e.slowT||0,.25);}
  else if(!(e.zeroCd>G.time)){e.zeroCd=G.time+3;e.zeroAt=G.time;e.stun=Math.max(e.stun||0,e.def.boss?.3:e.def.mini?.6:1);floatText(e.x,e.y-e.r-8,'0','#4ade80',13);Snd.play('roll');}}}

/* ---------- how they hit ---------- */
{const _at=attack;attack=function(u,e,st){const k=u.k;
  if(k==='sec_steeple'&&u.kickT>0){u.atk=1;u.face=e.x>u.x?-1:1;hitEnemy(e,st.dmg*1.3,u);if(!e.dead){hlShove(e,hlBack(e),58);if(!e.def.boss)e.stun=Math.max(e.stun||0,.25);}
    G.fx.push({t:'slash',st:'punch',x:e.x,y:e.y,ux:u.x,uy:u.y,a:Math.atan2(e.y-u.y,e.x-u.x),r:Math.max(18,e.r+12),col:'#bbf7d0',life:.25,max:.25,seed:rnd()*9});if(rnd()<.35)floatText(e.x,e.y-e.r-10,'KICK!','#bbf7d0',11);Snd.play('punch');return;}
  if(k==='sec_zero'){const z=G.enemies.find(o=>!o.dead&&!o.hidden&&o.zeroAt!=null&&G.time-o.zeroAt<1.6&&!o.zeroHit&&Math.hypot(o.x-u.x,o.y-u.y)-o.r<=st.range);
    if(z){z.zeroHit=1;setTimeout(()=>{z.zeroHit=0;},1700);floatText(z.x,z.y-z.r-14,'ZERO!','#4ade80',14);return _at(u,z,Object.assign({},st,{dmg:st.dmg*3}));}}
  _at(u,e,st);
  if(k==='sec_counter'&&!(u.standT>0)&&!(u.stunT>0)){const b=ccBJ(u);if(b.tot>=12&&ccWould(u)>21){ccStand(u,.35);floatText(u.x,u.y-u.r*2.4,`Stand on ${b.tot}`,'#cbd5e1',10);}
    else{ccAdd(u);if(b.tot===21)ccStand(u,.2);else if(b.tot>=17)ccStand(u,.9);}}};}
// grabbed enemies can't be hurt while they dangle; boxed ones can
{const _he=hitEnemy;hitEnemy=function(e,dmg,u,opt){if(e&&e.clawT>0&&G.time-e.clawAt>.45&&!e.clawBoss)return;return _he(e,dmg,u,opt);};}
{const _ue=updateEnemy;updateEnemy=function(e,dt){if(e.clawT>0){e.clawT-=dt;return;}return _ue(e,dt);};}

/* ---------- what you see ---------- */
function drawPrizeGround(c,t){
  for(const u of G.units){if(u.dead)continue;
    // Lady Zero's wheel
    if(u.k==='sec_zero'){const R=ZERO_R,a0=u.wa||0,sg=TAU/ZERO_N,on=G.phase==='wave';c.save();c.translate(u.x,u.y+u.r*.5);c.scale(1,.92);
      for(let i=0;i<ZERO_N;i++){const col=i<2?'34,197,94':i%2?'15,15,20':'220,38,38';c.fillStyle=`rgba(${col},${on?(i<2?.28:.15):.08})`;c.beginPath();c.moveTo(0,0);c.arc(0,0,R,a0+i*sg,a0+(i+1)*sg);c.closePath();c.fill();}
      c.strokeStyle=`rgba(251,191,36,${on?.55:.25})`;c.lineWidth=2;c.beginPath();c.arc(0,0,R,0,TAU);c.stroke();c.lineWidth=1;c.beginPath();c.arc(0,0,R*.86,0,TAU);c.stroke();
      c.strokeStyle='rgba(251,191,36,.25)';for(let i=0;i<ZERO_N;i++){const a=a0+i*sg;c.beginPath();c.moveTo(Math.cos(a)*R*.3,Math.sin(a)*R*.3);c.lineTo(Math.cos(a)*R,Math.sin(a)*R);c.stroke();}
      // green glows; the ball runs the other way round the rim
      c.save();c.globalCompositeOperation='lighter';const ga=a0+sg;glowDot(c,Math.cos(ga)*R*.78,Math.sin(ga)*R*.78,16,'#4ade80',on?.35:.15);c.restore();
      const ba=-t*2.3;c.fillStyle='#f8fafc';c.beginPath();c.arc(Math.cos(ba)*R*.93,Math.sin(ba)*R*.93,2.4,0,TAU);c.fill();c.restore();}}
  if(G.hfx)for(const f of G.hfx){const k=(G.time-f.t0)/f.life,a=1-k;if(k>1)continue;
    if(f.k==='hurdle'){c.save();c.translate(f.x,f.y);c.globalAlpha=Math.min(1,a*1.6);c.rotate(f.a+Math.PI/2);c.fillStyle='#f8fafc';c.fillRect(-18,-2,36,3);c.fillRect(-18,4,36,3);c.fillStyle='#15803d';for(const x of [-18,-6,6,18])c.fillRect(x-1.5,-6,3,16);
      c.fillStyle='#166534';for(let i=0;i<7;i++){c.beginPath();c.arc(-15+i*5,-3,3,0,TAU);c.fill();}c.restore();}
    else if(f.k==='drop'){c.save();c.strokeStyle=`rgba(253,224,71,${.7*a})`;c.setLineDash([3,4]);c.lineWidth=1.2;c.beginPath();c.moveTo(f.x,f.y-90*a);c.lineTo(f.x,f.y);c.stroke();c.setLineDash([]);c.restore();}
    else if(f.k==='ccshot'){c.save();c.globalCompositeOperation='lighter';c.strokeStyle=f.n===21?`rgba(253,224,71,${a})`:`rgba(226,232,240,${.8*a})`;c.lineWidth=f.n===21?4:2;c.beginPath();c.moveTo(f.x,f.y);c.lineTo(f.x1,f.y1);c.stroke();c.restore();}}}
{const _g=drawGroundWarn;drawGroundWarn=function(c,t){_g(c,t);if(!G)return;try{drawPrizeGround(c,t);}catch(e){}};}
function miniCard(c,x,y,v,face,hot){c.fillStyle='#0b0612';rr(c,x-3.6,y-5,7.2,10,1.4);c.fill();c.fillStyle=face?'#fbf6e8':'#1d4ed8';rr(c,x-3,y-4.4,6,8.8,1.1);c.fill();
  if(face){c.fillStyle=hot?'#dc2626':'#111827';c.font='700 5.5px Barlow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(v===11?'A':v===10?'K':String(v),x,y+.3);}else{c.strokeStyle='#93c5fd';c.lineWidth=.6;c.strokeRect(x-2,y-3.3,4,6.6);}}
function drawPrizeTop(c,t){
  // the claw and the magician's box over their targets; a betting slip over a backed enemy
  for(const e of G.enemies){if(e.dead)continue;const R=e.r*VIS_E;
    if(e.clawT>0){const k=G.time-e.clawAt,down=Math.min(1,k/.45),lift=k>.45&&!e.clawBoss?Math.min(1,(k-.45)/.45):0,cy=e.y-R-60+60*down-lift*44;c.save();
      c.strokeStyle='#cbd5e1';c.lineWidth=1.4;c.beginPath();c.moveTo(e.x,cy-200);c.lineTo(e.x,cy-6);c.stroke();c.fillStyle='#64748b';rr(c,e.x-6,cy-9,12,6,2);c.fill();
      const op=k<.45?.9:.25;c.strokeStyle='#e2e8f0';c.lineWidth=2.2;c.lineCap='round';for(const s of [-1,0,1]){c.beginPath();c.moveTo(e.x+s*3,cy-3);c.quadraticCurveTo(e.x+s*(9*op+4),cy+4,e.x+s*(6*op+2),cy+11);c.stroke();}c.restore();}
    if(e.sawT>0){const k=1-e.sawT/1.5,bw=R*2.6,bh=R*1.8,x=e.x-bw/2,y=e.y-bh*.65;c.save();c.fillStyle='rgba(30,10,40,.88)';rr(c,x,y,bw,bh,3);c.fill();c.strokeStyle='#fbbf24';c.lineWidth=1.5;c.stroke();
      c.fillStyle='#fde047';for(let i=0;i<5;i++){const sx=x+4+((i*29)%(bw-8)),sy=y+4+((i*17)%(bh-8));c.beginPath();for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,rr2=j%2?1.1:2.6;c.lineTo(sx+Math.cos(a)*rr2,sy+Math.sin(a)*rr2);}c.closePath();c.fill();}
      c.fillStyle='#e8c9a4';c.beginPath();c.arc(x-2,y+bh*.4,3,0,TAU);c.fill();c.fillStyle='#111827';c.fillRect(x+bw,y+bh*.55,4,3);
      if(k>.6){const q=(k-.6)/.4,sx=x-10+q*(bw+20);c.fillStyle='#e5e7eb';c.beginPath();c.moveTo(sx-12,y+bh*.48);c.lineTo(sx+12,y+bh*.48);c.lineTo(sx+12,y+bh*.56);c.lineTo(sx-12,y+bh*.6);c.closePath();c.fill();
        c.fillStyle='#78350f';c.fillRect(sx+12,y+bh*.44,6,6);c.strokeStyle='#9ca3af';c.lineWidth=.6;for(let i=0;i<6;i++){c.beginPath();c.moveTo(sx-11+i*4,y+bh*.56);c.lineTo(sx-9+i*4,y+bh*.62);c.stroke();}}
      c.restore();}
    if(e.bet){const B=e.bet,left=Math.max(0,B.T-(G.time-B.t0)),x=e.x,y=e.y-R-22;c.save();c.fillStyle='#fef3c7';c.strokeStyle='#0b0612';c.lineWidth=1.2;rr(c,x-15,y-6,30,12,2);c.fill();c.stroke();
      c.fillStyle='#7c2d12';c.font='700 7.5px Barlow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(oddsTxt(B.odds),x-3,y+.5);
      c.strokeStyle=left<3?'#ef4444':'#a16207';c.lineWidth=1.6;c.beginPath();c.arc(x+10,y,3.4,-Math.PI/2,-Math.PI/2+TAU*left/B.T);c.stroke();c.restore();}}
  // Card Counter: the hand, the total, and the card he can see coming
  for(const u of G.units){if(u.dead||u.k!=='sec_counter')continue;const b=ccBJ(u),x=u.x,y=u.y-u.r*2.7-(u.jh||0)-4,n=b.cards.length,standing=u.standT>0;c.save();
    for(let i=0;i<n;i++)miniCard(c,x-((n-1)*4.5)/2+i*4.5-6,y,b.cards[i],true,b.cards[i]>=10);
    if(n){c.font='700 8px Bungee,Impact,sans-serif';c.textAlign='left';c.textBaseline='middle';c.fillStyle=b.tot===21?'#fde047':b.tot>=17?'#fde68a':'#e2e8f0';c.strokeStyle='#0b0612';c.lineWidth=2.4;
      const tx=x-((n-1)*4.5)/2+(n-1)*4.5-6+6;c.strokeText(String(b.tot),tx,y+.5);c.fillText(String(b.tot),tx,y+.5);}
    const nx=x+15,ny=y-1;c.globalAlpha=.85;miniCard(c,nx,ny,b.next,true,ccWould(u)>21);c.globalAlpha=1;c.fillStyle='rgba(148,163,184,.9)';c.font='600 5px Barlow,sans-serif';c.textAlign='center';c.fillText('next',nx,ny-7.5);
    if(standing&&b.tot<21&&b.tot>=17){const p=1-u.standT/.9;c.strokeStyle='#fde68a';c.lineWidth=1.2;c.beginPath();c.arc(nx,ny,7,-Math.PI/2,-Math.PI/2+TAU*(1-p));c.stroke();}
    c.restore();}}
{const _t=drawTopWarn;drawTopWarn=function(c,t){_t(c,t);if(!G)return;try{drawPrizeTop(c,t);}catch(e){}};}
// grabbed enemies rise; halves are smaller
{const _de=drawEnemy;drawEnemy=function(c,e,t){let lift=0;if(e.clawT>0&&!e.clawBoss){const k=G.time-e.clawAt;lift=k>.45?Math.min(1,(k-.45)/.45)*44:0;}
  else if(e.dropAt!=null&&G.time-e.dropAt<.3){lift=(1-(G.time-e.dropAt)/.3)*70;}
  const s=e.scale||1;if(!lift&&s===1)return _de(c,e,t);c.save();c.translate(e.x,e.y-lift);c.scale(s,s);c.translate(-e.x,-e.y);_de(c,e,t);c.restore();};}

/* ---------- shots ---------- */
{const _dp=drawProj;drawProj=function(c,p,t){const st=p.st;if(st!=='capsule'&&st!=='note'&&st!=='slip'&&st!=='ball')return _dp(c,p,t);
  if(p.delay>0)return;c.save();c.translate(p.x,p.y);const a=Math.atan2(p.ty-p.y,p.tx-p.x);
  if(st==='capsule'){c.rotate(t*9+p.sx);c.fillStyle='#0b0612';c.beginPath();c.arc(0,0,5.4,0,TAU);c.fill();c.fillStyle=['#f472b6','#60a5fa','#4ade80','#fbbf24'][(p.sx|0)%4];c.beginPath();c.arc(0,0,4.4,Math.PI,TAU);c.fill();
    c.fillStyle='rgba(240,249,255,.9)';c.beginPath();c.arc(0,0,4.4,0,Math.PI);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(-1.6,-2,1,0,TAU);c.fill();}
  else if(st==='note'){c.globalCompositeOperation='lighter';glowDot(c,0,0,9,'#f472b6',.6);c.globalCompositeOperation='source-over';c.rotate(Math.sin(t*12+p.sx)*.3);c.fillStyle='#0b0612';c.font='bold 13px serif';c.textAlign='center';c.textBaseline='middle';c.fillText('♪',0,0);
    c.fillStyle='#fde047';c.font='bold 11px serif';c.fillText('♪',0,0);}
  else if(st==='slip'){c.rotate(a+Math.sin(t*20+p.sx)*.4);c.fillStyle='#0b0612';c.fillRect(-5,-3.6,10,7.2);c.fillStyle='#fef3c7';c.fillRect(-4.2,-2.8,8.4,5.6);c.fillStyle='#b45309';c.fillRect(-3,-1.4,6,.8);c.fillRect(-3,.4,4,.8);}
  else{c.globalCompositeOperation='lighter';glowDot(c,0,0,8,'#4ade80',.5);c.globalCompositeOperation='source-over';c.fillStyle='#0b0612';c.beginPath();c.arc(0,0,3.6,0,TAU);c.fill();c.fillStyle='#f8fafc';c.beginPath();c.arc(0,0,2.8,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(-.8,-.9,.9,0,TAU);c.fill();}
  c.restore();};}

/* ---------- bodies ---------- */
// Claw Machine: a glass prize cabinet on stubby legs, the claw hanging inside, a marquee on top
BEAST.clawcab=(c,s,L,t,atk)=>{const w=TW,st=Math.sin(t*w*2),c1=L.c1,c2=L.c2,dk=shade(c1,-.4);
  for(const [x,ph] of [[-s*.45,st],[s*.4,-st]]){c.fillStyle='#334155';rr(c,x-s*.13,s*.5,s*.26,s*.32+ph*s*.04,s*.06);c.fill();c.fillStyle='#1e293b';rr(c,x-s*.22,s*.78+ph*s*.04,s*.44,s*.14,s*.06);c.fill();}
  // base cabinet with the prize chute and coin slot
  c.fillStyle=dk;rr(c,-s*.82,-s*.05,s*1.64,s*.62,s*.08);c.fill();c.fillStyle=c1;rr(c,-s*.76,0,s*1.52,s*.52,s*.06);c.fill();
  c.fillStyle='#111827';rr(c,-s*.6,s*.12,s*.5,s*.3,s*.05);c.fill();c.fillStyle='#374151';c.fillRect(-s*.56,s*.16,s*.42,s*.08);
  c.fillStyle=c2;c.fillRect(s*.28,s*.14,s*.08,s*.22);c.fillStyle='#111827';c.fillRect(s*.3,s*.18,s*.04,s*.14);
  // joystick and button on the ledge
  c.fillStyle='#111827';c.fillRect(-s*.84,-s*.12,s*1.68,s*.1);c.strokeStyle='#111827';c.lineWidth=s*.06;c.beginPath();c.moveTo(-s*.2,-s*.1);c.lineTo(-s*.2+st*s*.06,-s*.32);c.stroke();c.fillStyle='#dc2626';c.beginPath();c.arc(-s*.2+st*s*.06,-s*.34,s*.08,0,TAU);c.fill();
  c.fillStyle='#22c55e';c.beginPath();c.arc(s*.22,-s*.16,s*.06,0,TAU);c.fill();
  // glass box with plush prizes piled up
  c.fillStyle='rgba(125,211,252,.28)';c.fillRect(-s*.76,-s*1.16,s*1.52,s*1.04);c.strokeStyle='#cbd5e1';c.lineWidth=s*.07;c.strokeRect(-s*.76,-s*1.16,s*1.52,s*1.04);
  const plush=[['#f472b6',-.5,-.3],['#60a5fa',-.18,-.26],['#facc15',.14,-.3],['#4ade80',.45,-.27],['#a78bfa',-.34,-.5],['#fb923c',.3,-.5]];
  for(const [col,x,y] of plush){c.fillStyle=col;c.beginPath();c.arc(x*s,y*s,s*.17,0,TAU);c.fill();c.fillStyle='#0b0612';c.beginPath();c.arc(x*s-s*.05,y*s-s*.03,s*.025,0,TAU);c.arc(x*s+s*.05,y*s-s*.03,s*.025,0,TAU);c.fill();
    c.fillStyle=col;c.beginPath();c.arc(x*s-s*.12,y*s-s*.13,s*.06,0,TAU);c.arc(x*s+s*.12,y*s-s*.13,s*.06,0,TAU);c.fill();}
  // the claw on its gantry, dropping when it shoots
  const cx=Math.sin(t*w)*s*.3,cy=-s*.95+atk*s*.32;c.strokeStyle='#94a3b8';c.lineWidth=s*.05;c.beginPath();c.moveTo(-s*.7,-s*1.06);c.lineTo(s*.7,-s*1.06);c.stroke();c.lineWidth=1;c.beginPath();c.moveTo(cx,-s*1.06);c.lineTo(cx,cy);c.stroke();
  c.fillStyle='#64748b';rr(c,cx-s*.1,cy-s*.04,s*.2,s*.1,s*.03);c.fill();c.strokeStyle='#e2e8f0';c.lineWidth=s*.05;c.lineCap='round';const op=.6-atk*.4;
  for(const k of [-1,0,1]){c.beginPath();c.moveTo(cx+k*s*.05,cy+s*.06);c.quadraticCurveTo(cx+k*s*(.15*op+.05),cy+s*.14,cx+k*s*(.1*op+.03),cy+s*.24);c.stroke();}
  c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.moveTo(-s*.68,-s*1.1);c.lineTo(-s*.5,-s*1.1);c.lineTo(-s*.68,-s*.6);c.closePath();c.fill();
  // marquee with chaser bulbs and LED eyes
  c.fillStyle='#111827';rr(c,-s*.86,-s*1.52,s*1.72,s*.4,s*.1);c.fill();c.fillStyle=c2;rr(c,-s*.8,-s*1.47,s*1.6,s*.3,s*.08);c.fill();
  c.fillStyle=c1;for(let k=0;k<3;k++){const x=-s*.3+k*s*.25,y=-s*1.32;c.beginPath();for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,R=j%2?s*.045:s*.1;c.lineTo(x+Math.cos(a)*R,y+Math.sin(a)*R);}c.closePath();c.fill();}
  c.fillStyle='#22d3ee';c.beginPath();c.arc(s*.55,-s*1.33,s*.06,0,TAU);c.arc(-s*.62,-s*1.33,s*.06,0,TAU);c.fill();
  for(let k=0;k<8;k++){const on=(k+Math.floor(t*w*2))%2===0;c.fillStyle=on?'#fff7d6':'#a16207';c.beginPath();c.arc(-s*.75+k*s*.215,-s*1.52,s*.04,0,TAU);c.fill();}};
// The Great Vanishing Act: the magician, cards in the air, his genie assistant curling out of the hat
BEAST.magician=(c,s,L,t,atk)=>{const w=TW;
  // the genie assistant rising out of an upturned hat at his feet
  c.save();c.translate(-s*.95,s*.55);c.fillStyle='#111827';rr(c,-s*.24,-s*.06,s*.48,s*.3,s*.04);c.fill();c.fillRect(-s*.32,s*.2,s*.64,s*.06);
  const g=c.createLinearGradient(0,0,0,-s*1.1);g.addColorStop(0,'rgba(45,212,191,.9)');g.addColorStop(1,'rgba(103,232,249,.95)');c.fillStyle=g;c.beginPath();c.moveTo(-s*.12,0);c.quadraticCurveTo(-s*.3+Math.sin(t*w)*s*.08,-s*.4,-s*.05,-s*.7);c.quadraticCurveTo(s*.2,-s*.4,s*.12,0);c.closePath();c.fill();
  c.fillStyle='#5eead4';c.beginPath();c.arc(-s*.03,-s*.82,s*.17,0,TAU);c.fill();c.fillStyle='#0b0612';c.beginPath();c.arc(-s*.08,-s*.84,s*.025,0,TAU);c.arc(s*.03,-s*.84,s*.025,0,TAU);c.fill();
  c.fillStyle='#fde047';c.beginPath();c.arc(-s*.03,-s*.99,s*.05,0,TAU);c.fill();c.restore();
  human(c,s,L,t,atk);
  // two cards turning in the air above his wand hand
  for(let k=0;k<2;k++){const a=t*w+k*Math.PI,x=s*.85+Math.cos(a)*s*.22,y=-s*1.05+Math.sin(a)*s*.12;c.save();c.translate(x,y);c.scale(Math.max(.2,Math.abs(Math.cos(a*1.5))),1);c.fillStyle='#fbf6e8';rr(c,-s*.1,-s*.14,s*.2,s*.28,s*.03);c.fill();
    c.fillStyle=k?'#dc2626':'#111827';c.font=`700 ${s*.16}px Barlow,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(k?'♥':'♠',0,0);c.restore();}};
// Lady Zero: green gown, a roulette ball held high, a little wheel for a tiara
BEAST.ladyzero=(c,s,L,t,atk)=>{human(c,s,L,t,atk);c.save();c.scale(1.32,1.32);const tw=s*.74,ty=-s*.3,hy=-s*.58;
  // her skirt is the wheel: red and black panels, zero green down the front, a gold hem
  const y0=s*.28,y1=s*1.02,n=7,sway=Math.sin(t*TW)*s*.03;c.save();c.beginPath();c.moveTo(-tw*.46,y0);c.lineTo(tw*.46,y0);c.lineTo(tw*.8+sway,y1);c.lineTo(-tw*.8+sway,y1);c.closePath();c.clip();
  for(let i=0;i<n;i++){const a=-tw*.46+i*tw*.92/n,b=a+tw*.92/n,A=-tw*.8+i*tw*1.6/n+sway,B=A+tw*1.6/n;c.fillStyle=i===3?'#16a34a':i%2?'#111827':'#dc2626';c.beginPath();c.moveTo(a,y0);c.lineTo(b,y0);c.lineTo(B,y1);c.lineTo(A,y1);c.closePath();c.fill();}
  c.fillStyle='#fde68a';for(let i=0;i<n;i++){const x=-tw*.8+(i+.5)*tw*1.6/n+sway;c.beginPath();c.arc(x,y1-s*.08,s*.03,0,TAU);c.fill();}c.restore();
  c.fillStyle='#d4a12a';c.beginPath();c.moveTo(-tw*.8+sway,y1);c.lineTo(tw*.8+sway,y1);c.lineTo(tw*.82+sway,y1+s*.05);c.lineTo(-tw*.82+sway,y1+s*.05);c.closePath();c.fill();
  c.fillStyle='#d4a12a';c.fillRect(-tw*.48,y0-s*.04,tw*.96,s*.06);
  // a roulette wheel for a tiara
  c.translate(s*.04,hy-s*.42);c.fillStyle='#b45309';c.beginPath();c.arc(0,0,s*.2,0,TAU);c.fill();
  for(let i=0;i<10;i++){c.fillStyle=i===0?'#16a34a':i%2?'#111827':'#dc2626';c.beginPath();c.moveTo(0,0);c.arc(0,0,s*.165,i*TAU/10+t*TW*.5,(i+1)*TAU/10+t*TW*.5);c.closePath();c.fill();}
  c.fillStyle='#fde68a';c.beginPath();c.arc(0,0,s*.05,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(Math.cos(-t*TW)*s*.13,Math.sin(-t*TW)*s*.13,s*.025,0,TAU);c.fill();c.restore();};
// Card Counter: hood up, shades on, shoe in hand
BEAST.counter=(c,s,L,t,atk)=>{
  // hood down, bunched behind the neck
  c.save();c.scale(1.32,1.32);c.fillStyle=shade(L.body,-.2);c.beginPath();c.ellipse(-s*.1,-s*.36,s*.3,s*.16,-.2,0,TAU);c.fill();c.restore();
  human(c,s,L,t,atk);c.save();c.scale(1.32,1.32);const hy=-s*.58,hx=s*.04,ty=-s*.3;
  // an ace of spades printed big on the hoodie, drawstrings
  c.fillStyle='#f8fafc';rr(c,-s*.17,ty+s*.14,s*.3,s*.38,s*.04);c.fill();c.fillStyle='#0b0612';signShape(c,'spade',-s*.02,ty+s*.31,s*.1)();c.fill();
  c.strokeStyle='#e5e7eb';c.lineWidth=.6;c.beginPath();c.moveTo(-s*.08,ty+s*.02);c.lineTo(-s*.1,ty+s*.14);c.moveTo(s*.06,ty+s*.02);c.lineTo(s*.07,ty+s*.14);c.stroke();
  // earbud, and the shades catch the light
  c.beginPath();c.moveTo(hx-s*.26,hy+s*.06);c.quadraticCurveTo(hx-s*.3,hy+s*.4,hx-s*.12,hy+s*.55);c.stroke();c.fillStyle='#f8fafc';c.beginPath();c.arc(hx-s*.26,hy+s*.05,s*.04,0,TAU);c.fill();
  // short messy hair and proper shades: two lenses and a bridge
  c.fillStyle='#3f2a17';c.beginPath();c.ellipse(hx-s*.02,hy-s*.22,s*.33,s*.15,-.1,Math.PI,TAU);c.fill();for(let k=0;k<4;k++){c.beginPath();c.moveTo(hx-s*.28+k*s*.16,hy-s*.26);c.lineTo(hx-s*.2+k*s*.16,hy-s*.4);c.lineTo(hx-s*.14+k*s*.16,hy-s*.26);c.fill();}
  c.fillStyle='#0b0612';rr(c,hx-s*.25,hy-s*.12,s*.21,s*.13,s*.05);c.fill();rr(c,hx+s*.03,hy-s*.12,s*.21,s*.13,s*.05);c.fill();c.fillRect(hx-s*.05,hy-s*.1,s*.09,s*.03);
  c.fillStyle='rgba(125,211,252,.85)';c.fillRect(hx-s*.21,hy-s*.1,s*.07,s*.025);c.fillRect(hx+s*.07,hy-s*.1,s*.07,s*.025);c.restore();};
// The Bookie: fedora, braces, a stub of pencil behind the ear and a cigar
BEAST.bookie=(c,s,L,t,atk)=>{human(c,s,L,t,atk);c.save();c.scale(1.32,1.32);const hy=-s*.58,hx=s*.04;
  c.fillStyle='#fde68a';c.save();c.translate(hx-s*.24,hy-s*.06);c.rotate(-.6);c.fillRect(-s*.02,-s*.12,s*.04,s*.22);c.fillStyle='#f472b6';c.fillRect(-s*.02,-s*.14,s*.04,s*.04);c.restore();
  c.fillStyle='#78350f';c.fillRect(hx+s*.2,hy+s*.12,s*.2,s*.05);c.fillStyle='#f97316';c.fillRect(hx+s*.38,hy+s*.12,s*.03,s*.05);
  c.fillStyle='rgba(226,232,240,.5)';const q=(t*TW/TAU)%1;c.beginPath();c.arc(hx+s*.45+q*s*.1,hy+s*.05-q*s*.3,s*(.03+q*.05),0,TAU);c.fill();c.restore();};
// Steeplechaser: the horse in green-and-white silks, with an ear bonnet and a breastplate
BEAST.steeple=(c,s,L,t,atk)=>{const ph=(t/SPP)%1,hop=Math.max(0,Math.sin(ph*TAU));
  // a jump jockey's horse: always up on its toes, rearing into the next fence
  c.save();c.translate(0,-hop*s*.16);c.rotate(-.18-.14*hop);drawCreature(c,Object.assign({},L,{b:'horse'}),s,t,atk);
  // dapples on the grey coat
  c.fillStyle='rgba(71,85,105,.38)';for(const [x,y,r] of [[-.62,.05,.09],[-.45,.18,.07],[-.3,.02,.08],[-.15,.2,.06],[.05,.12,.08],[.25,.2,.06],[-.7,-.12,.06]]){c.beginPath();c.arc(x*s,y*s,r*s,0,TAU);c.fill();}
  // sheepskin noseband, plaited mane bobbles
  c.fillStyle='#f8fafc';c.save();c.translate(s*1.2,-s*.68);c.rotate(.55);c.beginPath();c.ellipse(0,0,s*.09,s*.16,0,0,TAU);c.fill();c.restore();
  c.fillStyle=L.silk;for(let k=0;k<4;k++){const q=k/4;c.beginPath();c.arc(s*(.55+q*.36),-s*(.36+q*.55),s*.045,0,TAU);c.fill();}
  // the tail tied up short for the fences
  c.fillStyle=L.silk;c.fillRect(-s*.9,-s*.15,s*.08,s*.1);
  c.restore();};
for(const b of ['clawcab','steeple'])WALKERS.add(b);
// wand, roulette ball, card shoe, odds slate; fedora
{const _wp=weapon;weapon=function(c,r,o,hx,hy,atk,front){const wp=o.weapon;
  if(wp==='wand'){c.save();c.translate(hx,hy);c.rotate(-.7-atk*.8);c.fillStyle='#111827';c.fillRect(-r*.03,-r*.5,r*.06,r*.5);c.fillStyle='#f8fafc';c.fillRect(-r*.03,-r*.56,r*.06,r*.1);c.restore();
    if(atk>.2){c.save();c.globalCompositeOperation='lighter';glowDot(c,hx+r*.35,hy-r*.35,r*.3,'#fde047',.6*atk);c.restore();}return;}
  if(wp==='ball'){const y=hy-r*.18-atk*r*.15;c.save();c.globalCompositeOperation='lighter';glowDot(c,hx,y,r*.28,'#4ade80',.5);c.restore();c.fillStyle='#f8fafc';c.beginPath();c.arc(hx,y,r*.1,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(hx-r*.03,y-r*.03,r*.03,0,TAU);c.fill();return;}
  if(wp==='shoe'){c.save();c.translate(hx,hy);c.rotate(-.15);c.fillStyle='#14532d';rr(c,-r*.1,-r*.14,r*.38,r*.24,r*.04);c.fill();c.fillStyle='#166534';c.beginPath();c.moveTo(r*.28,-r*.14);c.lineTo(r*.36,-r*.04);c.lineTo(r*.28,r*.1);c.fill();
    c.fillStyle='#fbf6e8';c.fillRect(r*.12,-r*.2-atk*r*.15,r*.16,r*.12);c.restore();return;}
  if(wp==='cardfan'){c.save();c.translate(hx,hy);c.rotate(-.5-atk*.5);for(const [k,a,col,txt] of [[0,-.35,'#111827','A'],[1,.1,'#dc2626','K']]){c.save();c.rotate(a);c.fillStyle='#0b0612';rr(c,-r*.02,-r*.36,r*.24,r*.34,r*.04);c.fill();c.fillStyle='#fbf6e8';rr(c,0,-r*.34,r*.2,r*.3,r*.03);c.fill();
      c.fillStyle=col;signShape(c,k?'heart':'spade',r*.1,-r*.19,r*.07)();c.fill();c.restore();}c.restore();return;}
  if(wp==='slate'){c.save();c.translate(hx,hy);c.rotate(-.12);c.fillStyle='#78350f';c.fillRect(-r*.05,-r*.42,r*.5,r*.38);c.fillStyle='#1f2937';c.fillRect(-r*.02,-r*.39,r*.44,r*.32);
    c.strokeStyle='#e5e7eb';c.lineWidth=r*.025;for(let k=0;k<3;k++){const y=-r*.32+k*r*.09;c.beginPath();c.moveTo(r*.04,y);c.lineTo(r*.18,y);c.moveTo(r*.24,y);c.lineTo(r*.36,y-r*.02);c.stroke();}c.restore();return;}
  return _wp(c,r,o,hx,hy,atk,front);};}
{const _h=hat;hat=function(c,r,o,hy){if(o.hat!=='fedora')return _h(c,r,o,hy);const col=o.hatCol||'#3f3f46';c.fillStyle=col;c.beginPath();c.ellipse(0,hy,r*.5,r*.1,-.05,0,TAU);c.fill();
  c.beginPath();c.moveTo(-r*.26,hy);c.quadraticCurveTo(-r*.28,hy-r*.34,-r*.04,hy-r*.32);c.lineTo(0,hy-r*.24);c.lineTo(r*.05,hy-r*.32);c.quadraticCurveTo(r*.28,hy-r*.34,r*.26,hy);c.closePath();c.fill();
  c.fillStyle='#a16207';c.fillRect(-r*.26,hy-r*.08,r*.52,r*.06);c.fillStyle='#fef3c7';c.fillRect(r*.08,hy-r*.18,r*.08,r*.1);};}
