'use strict';
/* ============ ALL IN — secret bosses, hidden achievements, map easter eggs ============ */

/* ---------- secret guests ---------- */
Object.assign(ENEMIES,{
 lady:{name:'Lady Luck',hp:11,spd:50,armor:2,bite:20,dmg:40,rate:.8,r:18,gold:150,col:'#22c55e',boss:true,secret:true,moves:['coin','decoy'],
   movesDesc:'Flips a coin: heads she heals and dashes, tails she stuns every creature near her. Sends out decoys that look just like her.'},
 decoy:{name:'Lady Luck?',hp:1,spd:60,armor:0,bite:6,dmg:10,rate:1,r:14,gold:5,col:'#22c55e',decoy:true},
 banker:{name:'The Banker',hp:44,spd:34,armor:4,bite:45,dmg:80,rate:.55,r:23,gold:400,col:'#fbbf24',boss:true,secret:true,moves:['vault','bonds','payday'],
   movesDesc:'Locks himself in the vault (no damage gets through), calls in Bail Bondsmen, and charges interest on your chips. Bust him and he pays it all back double.'}});
Object.assign(ENEMIES,{gamstop:{name:'GamStop',hp:30,spd:36,armor:3,bite:30,dmg:60,rate:.6,r:21,gold:250,col:'#dc2626',boss:true,secret:true,moves:['stop','reality'],
   movesDesc:'Holds up its hand: every creature nearby stops dead. Gives you a reality check, shielding itself with every chip you lost gambling. While it is on the Strip, the arcade is closed.'}});
Object.assign(ENEMY_DESC,{gamstop:'It turns up when you have lost 1,000 chips gambling. It is here to help, whether you like it or not.',lady:'Nobody invites her. She turns up when a table is running too clean.',decoy:'One of Lady Luck\'s tricks. Pops like a soap bubble.',
  banker:'He only visits casinos with a Legend on the payroll. He has come to collect.'});
Object.assign(UNITS,{
 sec_luckystar:{name:'Lucky Star',role:'Good fortune',secret:true,bonus:true,hand:9,hp:950,dmg:46,rate:1.4,range:170,spd:96,r:12,armor:3,kind:'ranged',sp:{luck:.12},
   look:{b:'star',face:'beady',c1:'#facc15',c2:'#16a34a',shot:'card'},desc:'Lady Luck left her pet behind. While it\'s on the street, every hit from any of your creatures has a 12% chance to land double.'},
 sec_goose:{name:'Golden Goose',role:'Money maker',secret:true,bonus:true,hand:9,hp:2600,dmg:150,rate:.8,range:190,minR:30,spd:70,r:17,armor:6,kind:'artillery',sp:{splash:60,goose:4},
   look:{b:'goose',face:'beady',c1:'#fbbf24',c2:'#fff7ed'},desc:'The Banker\'s prize asset. Lays a golden egg worth 4 chips every 2 seconds of a round, and throws the cracked ones at the bad luck.'}});

function secretBossFor(w){
  if(w===15&&G.leakHist&&[11,12,13,14].every(i=>G.leakHist[i]===0))return {k:'lady',rep:'ogre',name:'Lady Luck',sub:'A secret guest: your table ran too clean'};
  if(w===30&&G.units.concat(G.ko.map(k=>k.u)).some(u=>(u.rank||0)>=3))return {k:'banker',rep:'boss',name:'The Banker',sub:'A secret guest: he heard you have a Legend'};
  return null;}
function applySecretBoss(w,c){c=applySecretBoss0(w,c);
  // GamStop: once you are 1,000 chips down on games of chance, it joins the next round
  if(G.gs&&G.gs.due&&!G.gs.sent){G.gs.sent=true;const sec={k:'gamstop',name:'GamStop',sub:'A secret guest: you have lost 1,000 chips gambling'};
    gameLog('GamStop has entered the casino. The arcade is closed until it is gone.','bad');c={...c,list:c.list.concat(['gamstop']),boss:true,secret:c.secret||sec,name:c.secret?c.name:'GamStop'};}
  return c;}
function gamstopCheck(){if(!G||G.gs||(G.gambleNet||0)>-1000)return;G.gs={due:true};gameLog('Somebody has noticed how much you have lost gambling…','bad');toast('Somebody has noticed how much you have lost gambling…');}
const gamstopHere=()=>!!(G&&G.enemies&&G.enemies.some(e=>e.k==='gamstop'&&!e.dead));
{const _tog=toggleArcade;toggleArcade=function(force,tab){const open=!!$('#slotPanel'),on=force!=null?force:!open;
  if(on&&gamstopHere()){toast('GamStop is on the Strip. The arcade is closed until it is gone.');Snd.play('error');return;}return _tog(force,tab);};}
function applySecretBoss0(w,c){const s=secretBossFor(w);if(!s||!c.list.includes(s.rep))return c;
  const out={...c,list:c.list.map(k=>k===s.rep?s.k:k),name:s.name,boss:true,mini:false,secret:s};gameLog(`${s.name} has entered the casino.`,'bad');return out;}

function spawnBonus(k,title){const d=UNITS[k];const u=makeUnit(k,BASE.fx-8,BASE.y+(rnd()-.5)*50);u.anchor={x:u.x,y:u.y};
  G.fx.push({t:'ring',x:u.x,y:u.y,r0:4,r1:60,col:'#fde047',life:.8,max:.8,w:4});for(let j=0;j<40;j++)spark(u.x,u.y,j%2?'#fde047':'#4ade80',160,.8);
  if(typeof Meta!=='undefined')Meta.seen(k);banner(title,d.name+' joins your casino','great');gameLog(`${title} ${d.name} joins your casino.`,'good');Snd.play('jackpot');return u;}

function secretBossDown(e){
  if(e.k==='lady'){if(typeof Meta!=='undefined')Meta.ach('lady');for(let i=0;i<90;i++)confetti();spawnBonus('sec_luckystar','Lady Luck is yours!');
    for(const o of G.enemies)if(o.k==='decoy'&&!o.dead){o.dead=true;for(let i=0;i<8;i++)spark(o.x,o.y,'#4ade80',90,.4);}}
  if(e.k==='banker'){if(typeof Meta!=='undefined')Meta.ach('banker');const back=(e.stolen||0)*2;if(back){G.me.chips+=back;G.stats.earned+=back;floatText(e.x,e.y-40,'+'+back+' refund','#fde047',16);}
    for(let i=0;i<120;i++)confetti();spawnBonus('sec_goose','Foreclosed!');}
  if(e.k==='gamstop'){if(typeof Meta!=='undefined')Meta.ach('gamstop');const lost=Math.max(0,-(G.gambleNet||0)),back=Math.round(lost*.25);
    if(back){G.me.chips+=back;G.stats.earned+=back;floatText(e.x,e.y-40,'+'+back+' back','#fde047',16);}for(let i=0;i<90;i++)confetti();
    banner('Self-excluded!',back?`GamStop hands back ${fmt(back)} of the ${fmt(lost)} chips you lost gambling. The arcade is open again`:'The arcade is open again','great');Snd.play('jackpot');
    gameLog(`You busted GamStop${back?` and got ${fmt(back)} chips back`:''}. The arcade is open again.`,'good');}
  if(e.k==='decoy'){floatText(e.x,e.y-e.r-6,'A decoy!','#86efac',12);for(let i=0;i<12;i++)spark(e.x,e.y,'#86efac',120,.4);}
}

function secretBossAct(e,m){
  if(m==='coin'){const heads=rnd()<.5;floatText(e.x,e.y-e.r-16,heads?'Heads!':'Tails!','#fde047',15);Snd.play('coin');
    if(heads){e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.06);e.dashT=1.1;for(let i=0;i<16;i++)spark(e.x,e.y,'#4ade80',120,.6);}
    else{let n=0;for(const u of G.units)if(Math.hypot(u.x-e.x,u.y-e.y)<140+u.r){u.stunT=1.4;n++;}G.fx.push({t:'ring',x:e.x,y:e.y,r0:10,r1:140,col:'#fde047',life:.6,max:.6,w:4});if(n)G.shake=Math.min(8,G.shake+3);}
    e.abT=6;return true;}
  if(m==='decoy'){for(let k=0;k<2;k++){const s=spawnEnemy('decoy');const a=k*Math.PI+rnd();s.x=e.x+Math.cos(a)*30;s.y=e.y+Math.sin(a)*30;s.d=e.d;s.hp=s.maxHp=e.maxHp*.07;s.name='Lady Luck?';}
    floatText(e.x,e.y-e.r-16,'Which one is me?','#86efac',13);G.fx.push({t:'ring',x:e.x,y:e.y,r0:6,r1:70,col:'#86efac',life:.5,max:.5,w:3});e.abT=9;return true;}
  if(m==='stop'){let n=0;for(const u of G.units)if(Math.hypot(u.x-e.x,u.y-e.y)<150+u.r){u.stunT=1.6;n++;floatText(u.x,u.y-u.r-8,'stopped','#fca5a5',9);}
    e.palmT=1.2;floatText(e.x,e.y-e.r-22,'STOP!','#fff',17);G.fx.push({t:'ring',x:e.x,y:e.y,r0:10,r1:150,col:'#ef4444',life:.6,max:.6,w:5});if(n)G.shake=Math.min(8,G.shake+3);Snd.play('lock');e.abT=7;return true;}
  if(m==='reality'){const lost=Math.max(0,-(G.gambleNet||0));e.shield=(e.shield||0)+Math.min(900,Math.round(lost*.4));e.shieldT=6;
    floatText(e.x,e.y-e.r-22,'Reality check!','#fff',14);floatText(e.x,e.y-e.r-6,`You've lost ${fmt(lost)} gambling`,'#fca5a5',11);for(let i=0;i<14;i++)spark(e.x,e.y,'#ef4444',140,.6);Snd.play('chips');e.abT=9;return true;}
  if(m==='vault'){e.invulnT=2.6;floatText(e.x,e.y-e.r-16,'Vault locked!','#fde047',14);Snd.play('lock');e.abT=9;return true;}
  if(m==='bonds'){for(let k=0;k<2;k++){const s=spawnEnemy('bondsman');const a=k*Math.PI+rnd();s.x=e.x+Math.cos(a)*30;s.y=e.y+Math.sin(a)*30;s.d=e.d;}
    floatText(e.x,e.y-e.r-16,'Post my bail!','#93c5fd',13);e.abT=10;return true;}
  if(m==='payday'){const take=Math.min(40,Math.floor(G.me.chips*.08));if(take>0){G.me.chips-=take;e.stolen=(e.stolen||0)+take;}
    e.shield=(e.shield||0)+Math.max(take,10)*8;e.shieldT=5;floatText(e.x,e.y-e.r-16,take?'Interest! −'+take:'Interest!','#fbbf24',14);if(take)gameLog(`The Banker charged you ${take} chips of interest. Bust him to get it back double.`,'bad');
    for(let i=0;i<14;i++)spark(e.x,e.y,'#fbbf24',140,.6);Snd.play('chips');e.abT=8;return true;}
  return false;}

/* ---------- hidden achievements ---------- */
const HIDDEN_ACH={
 secretmerge:['Off the Menu','Merge a secret recipe.','sparkles','Some recipes aren\'t written down. Try odd couples.'],
 allsecret:['Secret Recipe Book','Discover every secret merge.','sparkles','All of them. Every last odd couple.'],
 sig:['Signature Move','Summon a signature hand.','crown','Some hands are famous enough to have their own creature.'],
 three7:['Triple Seven','Hit 7-7-7 on the slots.','cherry','The Penny Arcade has a lever. Keep pulling.'],
 zero:['Green Zero','Win on zero at Roulette Night.','round','Bet on the colour nobody picks.'],
 natural:['Natural','Hit blackjack at Blackjack Night.','spade','Two cards, twenty-one.'],
 gamstop:['Self-Excluded','Bust GamStop.','zap','Lose 1,000 chips at games of chance.'],
 lady:['Lady Luck','Bust Lady Luck.','heart','Run a perfectly clean table in the rounds before 15.'],
 banker:['Foreclosure','Bust The Banker.','casino','Bring a Legend to round 30.'],
 fountain:['Make a Wish','Make a wish at the fountain.','sparkles','Coins in the water. Seven is lucky.'],
 honk:['Road Rage','Honk the armored truck ten times.','route','The truck has a horn.'],
 chapel:['Just Married','Ring the chapel bells.','heart','Little Neon Chapel takes walk-ins. Knock a few times.'],
 clover:['Four-Leaf','Find the lucky clover.','sparkles','Something green grows in the cracks of the street.'],
 coconut:['Coconut Bonk','Bonk the bad luck with a coconut.','zap','Palm trees can be shaken. Aim is everything.'],
 megaways:['Cascade','Win ten times your bet on Megaways.','sparkles','The arcade has more than one machine.'],
 forever:['Forever Home','Give Red a home.','heart','The dog track won\'t be open forever.'],
 wildride:['Wild Ride','Spin the Big Wheel on Megaways.','sparkles','Four gold chips, one wheel.'],
 doubleup:['Double Double Double','Win three gambles in a row after a Megaways bonus.','crown','Red or black? Three times.'],
 longshot:['Long Shot','Win Derby Night on an 8.0 outsider.','crown','Back the horse nobody fancies.'],
 parlay:['Parlay','Get three or more picks right on a Sports Night slip.','crown','Back more than one winner.'],
 poach:['Poacher','Take a creature from another casino.','army','Win your game on the right night.'],
 underdog:['Rags to Riches','Rank The Underdog up to Legend.','crown','Even a seven-high can go all the way.']};
for(const [k,a] of Object.entries(HIDDEN_ACH))ACH[k]=a.slice(0,3);

/* ---------- map easter eggs ---------- */
const QUIPS={
 pawn:['Pawn Shop: "We\'ll give you 5 chips for that Hydra. Final offer."','Pawn Shop: closed for inventory. Mostly lucky rabbit feet.','Pawn Shop: "No, we don\'t buy bad luck. We\'re full."'],
 diner:['All-Night Diner: the coffee is free if you won. Nobody has won.','All-Night Diner: today\'s special is the Full House breakfast.','All-Night Diner: the cook swears the pie is lucky.'],
 lounge:['Velvet Lounge: the singer is taking requests. She only knows one song.','Velvet Lounge: members only. The members are all cats.','Velvet Lounge: two-drink minimum, one-drink maximum.'],
 hotel:['Desert Rose Hotel: checkout is at noon. Nobody checks out.','Desert Rose Hotel: the minibar costs more than your casino.','Desert Rose Hotel: room 7 is always booked.'],
 cinema:['Drive-In: tonight\'s feature is "The Big Bluff". Again.','Drive-In: the projector runs on croupier tips.','Drive-In: double feature, both about poker.']};
function eggState(){if(!G.egg)G.egg={};const E=G.egg;
  if(E.clover==null){let tries=0;while(tries++<400){const c=4+((rnd()*30)|0),r=1+((rnd()*18)|0);const i=gi(c,r);if(grid[i]===0&&!NO_BUILD.has(i)){E.clover={x:c*TILE+TILE/2,y:r*TILE+TILE/2};break;}}if(!E.clover)E.clover=false;}
  return E;}
function honk(){const E=eggState();E.honk=(E.honk||0)+1;
  if(Snd.ctx&&!Snd.muted&&Snd.ctx.state==='running'){Snd.tone(392,.28,'square',.14);Snd.tone(311,.28,'square',.12);}
  floatText(VAULT.x,VAULT.y-24,'HONK','#fde047',14);for(const w of G.workers)w.bob=(w.bob||0)+3;
  if(E.honk===10){toast('The croupiers would like you to stop honking.');if(typeof Meta!=='undefined')Meta.ach('honk');}return true;}
function easterClick(o,x,y){const E=eggState();
  if(o.k==='fountain'){E.fn=(E.fn||0)+1;Snd.play('coin');G.fx.push({t:'ring',x,y,r0:2,r1:22,col:'rgba(160,240,255,.8)',life:.5,max:.5,w:2});floatText(x,y-10,'plink','#a5f3fc',10);
    if(E.fn===7&&!E.wish){E.wish=1;G.me.chips+=7;G.stats.earned+=7;toast('Your wish is granted. +7 chips');for(let i=0;i<30;i++)spark(x,y,i%2?'#a5f3fc':'#fde047',140,.8);Snd.play('jackpot');if(typeof Meta!=='undefined')Meta.ach('fountain');}
    return true;}
  if(o.k==='chapel'){E.ch=(E.ch||0)+1;for(let i=0;i<10;i++)G.parts.push({x:x+(rnd()-.5)*30,y,vx:(rnd()-.5)*40,vy:-40-rnd()*40,life:1.2,max:1.2,col:'#ff3d9a',size:4,conf:true,sym:'♥',rot:0});Snd.play('click');
    if(E.ch===3){toast('Ding-dong! Two croupiers just got married.');Snd.play('win');for(let i=0;i<50;i++)G.parts.push({x:x+(rnd()-.5)*60,y:y+(rnd()-.5)*20,vx:(rnd()-.5)*90,vy:-60-rnd()*80,life:1.8,max:1.8,col:i%2?'#ff3d9a':'#fff',size:4,conf:true,sym:'♥',rot:rnd()*6});if(typeof Meta!=='undefined')Meta.ach('chapel');}
    return true;}
  if(o.k==='motel'){E.noVac=!E.noVac;Snd.play('click');return true;}
  if(o.k==='palms'){const key=o.c+','+o.r;E.palm=E.palm||{};if((E.palm[key]||0)>G.time){floatText(x,y-10,'No more coconuts yet','#a3e635',10);return true;}
    E.palm[key]=G.time+8;const cx=(o.c+o.w/2)*TILE,cy=(o.r+o.h/2)*TILE;let tg=null,bd=230;for(const e of G.enemies){if(e.dead||e.hidden)continue;const d=Math.hypot(e.x-cx,e.y-cy);if(d<bd){bd=d;tg=e;}}
    const tx=tg?tg.x:cx+(rnd()-.5)*60,ty=tg?tg.y:cy+o.h*TILE*.6;(G.cocos=G.cocos||[]).push({x0:cx,y0:cy-10,x1:tx,y1:ty,t:0,max:.55,e:tg});Snd.play('pop');return true;}
  if(QUIPS[o.k]){const q=QUIPS[o.k];E.q=E.q||{};const i=E.q[o.k]=((E.q[o.k]||0)+1)%q.length;toast(q[i]);Snd.play('click');return true;}
  return false;}
function tickEggs(dt){if(!G.egg||G.egg.clover==null)eggState();if(!G.cocos||!G.cocos.length)return;
  for(const c of G.cocos){c.t+=dt;if(c.t>=c.max&&!c.done){c.done=true;const e=c.e;
    if(e&&!e.dead&&Math.hypot(e.x-c.x1,e.y-c.y1)<40){hitEnemy(e,40+G.wave*8,null);if(!e.def.boss)e.stun=Math.max(e.stun||0,1);floatText(e.x,e.y-e.r-10,'BONK!','#a3e635',15);Snd.play('thump');if(typeof Meta!=='undefined')Meta.ach('coconut');}
    else{floatText(c.x1,c.y1-8,'thud','#a3e635',10);Snd.play('thump');}for(let i=0;i<8;i++)spark(c.x1,c.y1,'#78350f',90,.4);}}
  G.cocos=G.cocos.filter(c=>!c.done);}
function cloverCheck(u){const E=G.egg;if(!E||!E.clover||E.cloverFound)return;if(Math.abs(u.x-E.clover.x)<13&&Math.abs(u.y-E.clover.y)<13){E.cloverFound=1;u.lucky=true;
  floatText(u.x,u.y-u.r-14,'Four-leaf clover!','#4ade80',14);for(let i=0;i<30;i++)spark(u.x,u.y,i%2?'#4ade80':'#fde047',150,.7);Snd.play('rankup');
  gameLog(`${u.def.name} found a four-leaf clover: 20% of its hits now land double.`,'good');if(typeof Meta!=='undefined')Meta.ach('clover');}}
function drawEggs(c,t){const E=G.egg;if(!E)return;
  // motel sign
  {const o=OBST.find(o=>o.k==='motel');if(o){const x=(o.c+o.w/2)*TILE,y=o.r*TILE+22,on=Math.sin(t*3)>-.85;c.save();c.font='700 9px Barlow,sans-serif';c.textAlign='center';c.textBaseline='middle';
    const txt=E.noVac?'NO VACANCY':'VACANCY',col=E.noVac?'#ff3b5a':'#4ade80';c.shadowColor=col;c.shadowBlur=on?8:0;c.fillStyle=on?col:hexA(col,.35);c.fillText(txt,x,y);c.restore();}}
  // the clover
  if(E.clover&&!E.cloverFound){const {x,y}=E.clover,g=.35+.25*Math.max(0,Math.sin(t*1.3));c.save();c.globalAlpha=g;c.fillStyle='#22c55e';for(let k=0;k<4;k++){const a=k*Math.PI/2+.4;c.beginPath();c.arc(x+Math.cos(a)*2.6,y+Math.sin(a)*2.6,2.4,0,TAU);c.fill();}
    c.strokeStyle='#15803d';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x+2,y+5);c.stroke();if(Math.sin(t*1.3)>.97){c.globalAlpha=.9;c.fillStyle='#fff';c.fillRect(x-.5,y-6,1,4);c.fillRect(x-2,y-4.5,4,1);}c.restore();}
  // coconuts in flight
  if(G.cocos)for(const k of G.cocos){const f=Math.min(1,k.t/k.max),x=k.x0+(k.x1-k.x0)*f,y=k.y0+(k.y1-k.y0)*f-Math.sin(f*Math.PI)*50;c.fillStyle='#78350f';c.beginPath();c.arc(x,y,5,0,TAU);c.fill();c.fillStyle='#a16207';c.beginPath();c.arc(x-1.5,y-1.5,1.6,0,TAU);c.fill();}
}

/* GamStop: an octagonal stop sign for a head, a hi-vis vest, one white glove up, a padlock in the other */
function gamstopArt(c,r,col,t,palm){const w=TAU/SPP,sw=Math.sin(t*w);
  for(const sx of [-1,1]){const s2=sx*sw*.2;c.save();c.translate(sx*r*.24,r*.42);c.rotate(s2);c.fillStyle='#1f2937';rr(c,-r*.1,0,r*.2,r*.6,r*.05);c.fill();c.fillStyle='#0b0612';rr(c,-r*.16,r*.54,r*.32,r*.13,r*.05);c.fill();c.restore();}
  c.fillStyle='#facc15';c.beginPath();c.moveTo(-r*.5,-r*.26);c.lineTo(r*.5,-r*.26);c.lineTo(r*.56,r*.5);c.lineTo(-r*.56,r*.5);c.closePath();c.fill();
  c.fillStyle='#e5e7eb';c.fillRect(-r*.54,r*.06,r*1.08,r*.1);c.fillRect(-r*.55,r*.3,r*1.1,r*.1);c.fillStyle='#a3a3a3';c.fillRect(-r*.18,-r*.26,r*.08,r*.76);c.fillRect(r*.1,-r*.26,r*.08,r*.76);
  c.fillStyle='#3f3f46';c.fillRect(-r*.06,-r*.4,r*.12,r*.2);
  // the hand: up and out when it says stop
  const up=palm?1:.55+sw*.08;c.save();c.translate(r*.46,-r*.16);c.rotate(-up*1.3);c.strokeStyle='#facc15';c.lineWidth=r*.16;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(r*.46,0);c.stroke();
    c.translate(r*.58,0);c.rotate(up*1.3-.2);c.fillStyle='#f8fafc';c.beginPath();c.ellipse(0,0,r*.16,r*.2,0,0,TAU);c.fill();for(let k=0;k<4;k++){c.beginPath();c.ellipse(-r*.1+k*r*.067,-r*.22,r*.035,r*.09,0,0,TAU);c.fill();}
    c.beginPath();c.ellipse(r*.15,-r*.03,r*.04,r*.08,-.8,0,TAU);c.fill();c.restore();
  c.save();c.translate(-r*.5,-r*.1);c.rotate(.5+sw*.1);c.strokeStyle='#facc15';c.lineWidth=r*.16;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(-r*.18,r*.38);c.stroke();
    c.translate(-r*.2,r*.5);c.rotate(-.5);c.strokeStyle='#9ca3af';c.lineWidth=r*.07;c.beginPath();c.arc(0,-r*.12,r*.12,Math.PI,0);c.stroke();c.fillStyle='#fbbf24';rr(c,-r*.18,-r*.12,r*.36,r*.28,r*.05);c.fill();c.fillStyle='#78350f';c.beginPath();c.arc(0,0,r*.04,0,TAU);c.fill();c.fillRect(-r*.015,0,r*.03,r*.08);c.restore();
  // the sign
  c.save();c.translate(0,-r*.86);const R=r*.62;const oct=(rad)=>{c.beginPath();for(let k=0;k<8;k++){const a=Math.PI/8+k*Math.PI/4;c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}c.closePath();};
  c.fillStyle='#f8fafc';oct(R);c.fill();c.fillStyle='#dc2626';oct(R*.86);c.fill();c.fillStyle='rgba(255,255,255,.14)';c.beginPath();c.ellipse(-R*.25,-R*.42,R*.42,R*.16,-.3,0,TAU);c.fill();
  c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.font=`900 ${R*.36}px Impact,'Arial Black',sans-serif`;c.fillText('GAM',0,R*.08);c.font=`900 ${R*.44}px Impact,'Arial Black',sans-serif`;c.fillText('STOP',0,R*.46);
  for(const sx of [-1,1]){c.fillStyle='#fff';c.beginPath();c.ellipse(sx*R*.25,-R*.36,R*.13,R*.1,0,0,TAU);c.fill();c.fillStyle='#111';c.beginPath();c.arc(sx*R*.23,-R*.34,R*.055,0,TAU);c.fill();
    c.strokeStyle='#fff';c.lineWidth=R*.07;c.lineCap='round';c.beginPath();c.moveTo(sx*R*.42,-R*.56);c.lineTo(sx*R*.1,-R*.48);c.stroke();}
  c.restore();}
// if the arcade is open when GamStop walks in, it gets shut
{const _sp=spawnEnemy;spawnEnemy=function(k){const e=_sp.apply(this,arguments);if(k==='gamstop'&&$('#slotPanel')){toggleArcade(false);toast('GamStop has closed the arcade.');}return e;};}
