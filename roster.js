'use strict';
/* ============ ALL IN — every creature plays like itself ============
   Identity passes for creatures that overlapped, and new actives where a generic one diluted a good theme.
   Behaviour hooks: attack() for how a creature hits, unitPowers() for passives, hurtUnit() for defences,
   uStat() for timed buffs, doAbility() for the new actives. Everything is drawn over the street in drawRoster(). */

/* ---------- definitions ---------- */
Object.assign(ABIL,{
  clock:{name:'Stop the Clock',type:'area',cd:18,rad:120,icon:'clock',desc:'Freezes every enemy in the area for 2.5 seconds, adds 2 seconds to any stasis already running, and stops enemy shots dead in the air.'},
  tide:{name:'Tidal Surge',type:'area',cd:16,rad:150,icon:'waves',desc:'A wave that drags every enemy in the area into the nearest whirlpool (or opens one), slowing and hurting them.'},
  overcharge:{name:'Overcharge',type:'self',cd:14,icon:'zap',desc:'For 5 seconds the beam keeps its built-up power when it switches target, and builds twice as fast.'},
  blaze:{name:'Blaze',type:'self',cd:16,icon:'flame',desc:'For 4 seconds it fires 60% faster and every bolt leaves a wide pool of burning ground.'},
  overclock:{name:'Overclock',type:'self',cd:18,icon:'crosshair',desc:'Locks its aim and overclocks the coils: charges and fires two and a half times as fast for 5 seconds.'}});
if(typeof ICONS!=='undefined')Object.assign(ICONS,{
  clock:'<circle cx="12" cy="12" r="10" /> <polyline points="12 6 12 12 16 14" />',
  waves:'<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /> <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /> <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />',
  crosshair:'<circle cx="12" cy="12" r="10" /> <line x1="22" x2="18" y1="12" y2="12" /> <line x1="6" x2="2" y1="12" y2="12" /> <line x1="12" x2="12" y1="6" y2="2" /> <line x1="12" x2="12" y1="22" y2="18" />'});
if(typeof ABIL_KEY!=='undefined')Object.assign(ABIL_KEY,{clock:'T',tide:'R',overcharge:'X',blaze:'I',overclock:'D'});
const RE=(k,o)=>{if(UNITS[k])Object.assign(UNITS[k],o);};
RE('sf_hi',{ab:'clock',desc:'Deals lightning, and every few seconds stops the clock: everything nearby freezes in place. Can stop time on demand.'});
RE('m_leviathan',{ab:'tide'});RE('m_pitboss',{ab:'overcharge'});RE('m_empress',{ab:'blaze'});RE('m_gauss',{ab:'overclock'});
RE('q_lo',{desc:'Breathes four-leaf fire across a wide arc. Built to clear crowds.'});
RE('q_hi',{desc:'Breathes a narrow jet of jade fire. The longer it stays on one target, the hotter it burns: up to three times the damage.'});
RE('fh_lo',{desc:'Carries a whole house on its back and lobs dependable shells from the chimney, a long way off.'});
RE('fh_hi',{desc:'Heavy artillery with tentacles. Anything that gets too close is grabbed, crushed and flung back out.'});
RE('m_trooper',{sp:{cleave:20},desc:'Two mites became a soldier: chip armour, chip shield, sharp spear. Standing its ground, it braces behind the shield and takes 40% less damage.'});
RE('m_cerb',{sp:{bites:3},desc:'Three heads, three bites: every attack bites up to three enemies next to each other.'});
RE('m_rider',{sp:{},desc:'A chip mite with a lance, riding a chip hound. After a gallop, its first strike hits three times as hard and knocks the target flying.'});
RE('m_bandit',{desc:'A slot machine with one huge arm. Pulls hit four enemies at range; anything that gets close gets the arm: a slow wind-up, then a punch that knocks it away.'});
RE('m_sultan',{sp:{targets:4},desc:'Grants three wishes in turn, one every third volley: Fury (a volley at 2.5× damage), Protection (nearby creatures take half damage for 4s), then Payout (a golden blast and +6 chips). The next wish shows above it.'});
RE('m_phantom',{sp:{},desc:'A ghost of a card sharp. Its spectral aces pierce a whole line, then fly back along the same line for half damage: whatever is still standing on it gets hit twice.'});
RE('sec_thunderbird',{sp:{chains:4},desc:'Rides the storm the Dealer called up. Every few seconds it marks a spot, then streaks there, leaving a trail of lightning strikes behind it.'});
RE('sec_hexhound',{sp:{curse:1},desc:'A witch\'s hound. It latches onto one target and keeps it cursed for as long as both live: cursed bad luck takes 40% more damage.'});
RE('m_devil',{sp:{crit:1/4,critX:4},desc:'Every throw spreads a weak curse to the target and two of its neighbours: they take 20% more damage. One throw in four crits for four times the damage.'});
RE('sig_deadman',{sp:{shots:2,crit:.25,critX:4},desc:'Aces and eights. Every shot is followed half a second later by a ghostly echo that fires again for 60% damage.'});
RE('m_jugg',{desc:'Eight chip mites, one war machine. Each volley is a walking rocket barrage that marches up the street ahead of the bad luck.'});
RE('m_fortress',{rate:.95,sp:{splash:72},desc:'Eight dice sprites, one castle on legs. Its six turrets fire in order, one to six; every sixth shell is the Big Six: a huge blast for 2.6× damage.'});
RE('m_greyhound',{desc:'Top dog at the track, in the number one jacket and a winner\'s sash. Every few seconds the traps open and three racing greyhounds sprint out after the bad luck.'});
// description mismatches
RE('t_hi',{desc:'Three targets per wish. 1 in 8 wishes hits the jackpot: +10 chips on the spot.'});
RE('m_djinn',{desc:'Two Jinns in one lamp. Heals your hurt creatures and grants wishes: up to three creatures near it hit 30% harder for 6 seconds.'});
RE('m_engine',{desc:'A slot machine wired to the Time Croupier\'s storm. Fires a lightning lance through a whole line, then arcs it onward.'});
RE('m_bounty',{desc:'Long-range crossbow, deadly aim, and a cut of every kill: +2 chips each.'});
if(UNITS.sec_luckystar)RE('sec_luckystar',{desc:'Lady Luck\'s own star. While it lives, every hit from your army has a 12% chance to be a lucky double.'});

/* ---------- a tiny scheduler on game time ---------- */
function rLater(sec,fn){(G.rq=G.rq||[]).push({at:G.time+sec,fn});}
function rTick(){if(!G.rq||!G.rq.length)return;const now=G.time,due=G.rq.filter(q=>q.at<=now);if(!due.length)return;G.rq=G.rq.filter(q=>q.at>now);for(const q of due){try{q.fn();}catch(e){}}}
const alive=e=>e&&!e.dead;
function knock(e,a,d){if(e.def.boss||e.def.mini)d*=.25;const nx=e.x+Math.cos(a)*d,ny=e.y+Math.sin(a)*d;if(walkable(nx,ny,e.r)){e.x=nx;e.y=ny;}}

/* ---------- curses: strong (Hex Hound, the generic curse) and weak (Lucky Devil) don't stack ---------- */
function weakCurse(e){if(e.curseT>0&&(e.curseK||.4)>=.2){e.curseT=Math.max(e.curseT,3);return;}e.curseT=3;e.curseK=.2;}

/* ---------- how they hit ---------- */
const R_ATK={
  // wide crowd-clearing cone
  q_lo(u,e,st){const a=Math.atan2(e.y-u.y,e.x-u.x);for(const o of G.enemies){if(o.dead)continue;const d=Math.hypot(o.x-u.x,o.y-u.y);if(d-o.r>st.range+10)continue;let da=Math.abs(Math.atan2(o.y-u.y,o.x-u.x)-a);if(da>Math.PI)da=TAU-da;if(da<.9||d<u.r+o.r+4)hitEnemy(o,st.dmg,u);}
    u.atk=1;u.aim=a;u.face=e.x>u.x?1:-1;const pal=breathPal(u.def.look),mx=u.x+u.face*u.r*1.15,my=u.y-u.r*.72;
    for(const da of [-.5,0,.5])G.fx.push({t:'breath',x:mx,y:my,a:a+da,r:st.range+12,pal,life:.36,max:.36,seed:Math.random()*99});
    for(let k=0;k<4&&G.parts.length<480;k++){const an=a+(Math.random()-.5)*1.6,v=90+Math.random()*80;G.parts.push({x:mx,y:my,vx:Math.cos(an)*v,vy:Math.sin(an)*v,life:.5,max:.5,col:k%2?'#4ade80':'#bbf7d0',size:3,leaf:true,rot:Math.random()*6});}
    Snd.play('breath');return true;},
  // a narrow jet that heats up on one target
  q_hi(u,e,st){u.jr=u.jetOn===e?Math.min(3,(u.jr||1)+.4):1;u.jetOn=e;const a=Math.atan2(e.y-u.y,e.x-u.x),L=st.range+14,mx=u.x+(e.x>u.x?1:-1)*u.r*1.1,my=u.y-u.r*.7;
    for(const o of G.enemies)if(!o.dead&&(o===e||segDist(o.x,o.y,mx,my,mx+Math.cos(a)*L,my+Math.sin(a)*L)<=o.r+5))hitEnemy(o,st.dmg*(o===e?u.jr:.5),u);
    u.atk=1;u.aim=a;u.face=e.x>u.x?1:-1;(G.rfx=G.rfx||[]).push({k:'jet',x:mx,y:my,a,L,heat:u.jr,t0:G.time,life:.32});
    for(let k=0;k<5&&G.parts.length<480;k++){const an=a+(Math.random()-.5)*.2,v=240+Math.random()*160;G.parts.push({x:mx,y:my,vx:Math.cos(an)*v,vy:Math.sin(an)*v,life:.28,max:.3,col:u.jr>2.2?'#fff7d6':k%2?'#34d399':'#fde68a',size:2.5+u.jr,flame:true});}
    if(u.jr>=3&&Math.random()<.3)floatText(e.x,e.y-e.r-8,'White hot','#fde68a',10);Snd.play('breath');return true;},
  // three heads: up to three neighbours bitten at once
  m_cerb(u,e,st){const vic=[e,...G.enemies.filter(o=>!o.dead&&o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<40+o.r).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y)).slice(0,2)];
    u.atk=1;u.aim=Math.atan2(e.y-u.y,e.x-u.x);u.face=e.x>u.x?1:-1;
    vic.forEach((o,i)=>{hitEnemy(o,st.dmg,u);G.fx.push({t:'slash',st:'claw',x:o.x,y:o.y,ux:u.x,uy:u.y,a:Math.atan2(o.y-u.y,o.x-u.x),r:Math.max(14,o.r+8),col:'#fecaca',life:.24,max:.24,seed:Math.random()*9});});
    if(vic.length>=3&&G.texts.length<40)floatText(u.x,u.y-u.r-12,'Triple bite','#fca5a5',10);Snd.play('claw');return true;},
  // the gallop: a long run turns the next strike into a lance charge
  m_rider(u,e,st){if((u.run||0)<90)return false;u.run=0;const a=Math.atan2(e.y-u.y,e.x-u.x);hitEnemy(e,st.dmg*3,u);knock(e,a,48);if(!e.def.boss)e.stun=Math.max(e.stun||0,.5);
    u.atk=1;u.aim=a;u.face=e.x>u.x?1:-1;G.fx.push({t:'slash',st:'thrust',x:e.x,y:e.y,ux:u.x,uy:u.y,a,r:Math.max(18,e.r+12),col:'#fde68a',life:.3,max:.3,seed:Math.random()*9});
    floatText(e.x,e.y-e.r-10,'Charge!','#fde68a',12);G.shake=Math.min(6,G.shake+1.5);Snd.play('thrust');return true;},
  // the wish cycle
  m_sultan(u,e,st){u.wishN=(u.wishN||0)+1;if(u.wishN%3)return false;const w=u.wishI||0;u.wishI=(w+1)%3;
    if(w===0){floatText(u.x,u.y-u.r-16,'Wish: Fury','#fca5a5',12);const s2=Object.assign({},st,{dmg:st.dmg*2.5});R_BASE(u,e,s2);G.fx.push({t:'ring',x:u.x,y:u.y,r0:8,r1:40,col:'#f87171',life:.4,max:.4,w:3});Snd.play('magic');return true;}
    if(w===1){const near=G.units.filter(o=>!o.dead&&Math.hypot(o.x-u.x,o.y-u.y)<200).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp).slice(0,4);for(const o of near){o.wardT=4;G.fx.push({t:'ring',x:o.x,y:o.y,r0:o.r+2,r1:o.r+14,col:'#93c5fd',life:.5,max:.5,w:2});}
      floatText(u.x,u.y-u.r-16,'Wish: Protection','#93c5fd',12);Snd.play('lock');return false;}
    splashAt(e.x,e.y,70,st.dmg*2,u,'#fde68a');G.me.chips+=6;G.stats.earned+=6;floatText(e.x,e.y-30,'Wish: Payout +6','#fde047',13);for(let k=0;k<14;k++)chipBit(e.x,e.y,180);Snd.play('jackpot');return false;},
  // the walking barrage marches up the street ahead of the bad luck
  m_jugg(u,e,st){const n=4,dir=Math.atan2(e.fy||0,e.fx||1),pd=predict(e,.6);u.atk=1;u.aim=Math.atan2(e.y-u.y,e.x-u.x);u.face=e.x>u.x?1:-1;
    for(let k=0;k<n;k++){const tx=pd[0]+Math.cos(dir)*k*34,ty=pd[1]+Math.sin(dir)*k*34;G.proj.push({shell:true,missile:true,sx:u.x,sy:u.y-u.r,x:u.x,y:u.y,tx,ty,T:.55+k*.13,el:0,h:0,dmg:st.dmg*.42,u,col:'#fbbf24',splash:52});}
    Snd.play('thump');return true;},
  // the six turrets in order; six is the Big Six
  m_fortress(u,e,st){u.six=((u.six||0)%6)+1;const big=u.six===6,pd=predict(e,.85);u.atk=1;u.aim=Math.atan2(e.y-u.y,e.x-u.x);u.face=e.x>u.x?1:-1;
    G.proj.push({shell:true,sx:u.x,sy:u.y-u.r,x:u.x,y:u.y,tx:pd[0],ty:pd[1],T:.85,el:0,dmg:st.dmg*(big?2.6:1),u,col:big?'#fde047':'#f8fafc',splash:big?110:72});
    floatText(u.x+(u.six-3.5)*5,u.y-u.r*2.2,big?'BIG SIX':String(u.six),big?'#fde047':'#fecaca',big?14:11);if(big){G.shake=Math.min(7,G.shake+2);Snd.play('boom');}else Snd.play('thump');return true;}};
let R_BASE=null;
const R_AFTER={
  // the returning cards
  m_phantom(u,e,st){const a=Math.atan2(e.y-u.y,e.x-u.x),L=st.range+30,sx=u.x,sy=u.y,ex=sx+Math.cos(a)*L,ey=sy+Math.sin(a)*L,dmg=st.dmg*.5;
    rLater(.38,()=>{for(const o of G.enemies)if(!o.dead&&segDist(o.x,o.y,sx,sy,ex,ey)<=o.r+6)hitEnemy(o,dmg,u);G.fx.push({t:'beam',x1:ex,y1:ey,x2:sx,y2:sy,col:'#e0f2fe',life:.22,max:.22,w:1});});},
  // the ghostly echo
  sig_deadman(u,e,st){const dmg=st.dmg*.6;rLater(.45,()=>{if(u.dead)return;const t=alive(e)?e:nearestEnemy(u.x,u.y,st.range);if(!t)return;hitEnemy(t,dmg,u);
    G.fx.push({t:'beam',x1:u.x-u.face*6,y1:u.y-u.r*.6,x2:t.x,y2:t.y,col:'#c4b5fd',life:.2,max:.2,w:1});if(G.parts.length<470)for(let i=0;i<4;i++)spark(u.x-u.face*6,u.y-u.r*.6,'#ddd6fe',50,.4);});},
  // weak curses spread
  m_devil(u,e){const vic=[e,...G.enemies.filter(o=>!o.dead&&o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<75).slice(0,2)];for(const o of vic){weakCurse(o);if(G.parts.length<470)spark(o.x,o.y-o.r,'#c084fc',40,.4);}},
  // the hound's bite keeps its mark cursed
  sec_hexhound(u,e){u.mark=e;e.curseT=4;e.curseK=.4;}};
{const _at=attack;R_BASE=_at;attack=function(u,e,st){const H=R_ATK[u.k];if(H&&H(u,e,st)===true)return;_at(u,e,st);const A=R_AFTER[u.k];if(A)A(u,e,st);};}

/* ---------- passives ---------- */
{const _up=unitPowers;unitPowers=function(u,dt){_up(u,dt);if(u.dead||!G)return;const k=u.k;
  // distance travelled (the rider's gallop) and standing still (the trooper's brace)
  const mv=u._ox==null?0:Math.hypot(u.x-u._ox,u.y-u._oy);u._ox=u.x;u._oy=u.y;if(mv>.2){u.still=0;u.run=(u.run||0)+mv;}else{u.still=(u.still||0)+dt;}
  if(u.wardT>0)u.wardT-=dt;if(u.ovT>0)u.ovT-=dt;if(u.blazeT>0)u.blazeT-=dt;if(u.ocT>0)u.ocT-=dt;
  // Casino Kraken: grab one enemy that gets too close
  if(k==='fh_hi'){u.grabCd=(u.grabCd==null?2:u.grabCd)-dt;if(u.grabCd<=0){const e=G.enemies.find(o=>!o.dead&&!o.hidden&&!o.def.fly&&!o.def.boss&&!o.def.mini&&Math.hypot(o.x-u.x,o.y-u.y)<u.r+o.r+48);
    if(e){u.grabCd=6;u.atk=1;const st=uStat(u),a=Math.atan2(e.y-u.y,e.x-u.x);e.stun=Math.max(e.stun||0,.9);hitEnemy(e,st.dmg*1.6,u);(G.rfx=G.rfx||[]).push({k:'tent',u,e,t0:G.time,life:.7});
      rLater(.35,()=>{if(alive(e))knock(e,a,80);});floatText(u.x,u.y-u.r-14,'Grabbed!','#c7d2fe',12);Snd.play('slam');}}}
  // One-Armed Bandit: a wound-up punch for anything that gets close
  if(k==='m_bandit'){u.punchCd=(u.punchCd==null?1:u.punchCd)-dt;
    if(u.punchW>0){u.punchW-=dt;u.cd=Math.max(u.cd,.15);if(u.punchW<=0){const e=u.punchE;if(alive(e)&&Math.hypot(e.x-u.x,e.y-u.y)<u.r+e.r+44){const st=uStat(u),a=Math.atan2(e.y-u.y,e.x-u.x);hitEnemy(e,st.dmg*3.2,u);knock(e,a,64);if(!e.def.boss)e.stun=Math.max(e.stun||0,.7);
          G.fx.push({t:'slash',st:'punch',x:e.x,y:e.y,ux:u.x,uy:u.y,a,r:Math.max(20,e.r+14),col:'#fde68a',life:.3,max:.3,seed:Math.random()*9});floatText(e.x,e.y-e.r-10,'POW!','#fde047',15);G.shake=Math.min(7,G.shake+2.5);Snd.play('punch');}u.punchE=null;}}
    else if(u.punchCd<=0){const e=G.enemies.find(o=>!o.dead&&!o.hidden&&Math.hypot(o.x-u.x,o.y-u.y)<u.r+o.r+30);if(e){u.punchCd=5;u.punchW=.6;u.punchE=e;u.face=e.x>u.x?1:-1;u.atk=1;Snd.play('aim');}}}
  // Thunderbird: mark a spot, then streak there leaving lightning behind
  if(k==='sec_thunderbird'&&G.phase==='wave'){u.tbCd=(u.tbCd==null?4:u.tbCd)-dt;
    if(u.tbDest){if(G.time>=u.tbDest.go){const D=u.tbDest;u.tbDest=null;const sx=u.x,sy=u.y,st=uStat(u);u.x=D.x;u.y=D.y;u.anchor={x:D.x,y:D.y};u.path=[];u.order={t:'idle'};
        for(let i=1;i<=5;i++){const px=sx+(D.x-sx)*i/5,py=sy+(D.y-sy)*i/5;rLater(.08*i,()=>{splashAt(px,py,40,st.dmg*.9,u,'#93c5fd');G.fx.push({t:'chain',pts:[[px+(Math.random()-.5)*10,py-160],[px+(Math.random()-.5)*12,py-80],[px,py]],col:'#bfdbfe',life:.22,max:.22,seed:Math.random()*999});if(i%2)Snd.play('zap');});}
        (G.rfx=G.rfx||[]).push({k:'streak',x1:sx,y1:sy,x2:D.x,y2:D.y,t0:G.time,life:.35});G.shake=Math.min(6,G.shake+1.5);}}
    else if(u.tbCd<=0&&!u.jump&&u.order.t!=='move'){const near=G.enemies.filter(o=>!o.dead&&!o.hidden&&Math.hypot(o.x-u.x,o.y-u.y)<240);if(near.length>=2){
        const cx=near.reduce((s,o)=>s+o.x,0)/near.length,cy=near.reduce((s,o)=>s+o.y,0)/near.length,a=Math.atan2(cy-u.y,cx-u.x),d=Math.min(170,Math.hypot(cx-u.x,cy-u.y)+40);
        let tx=u.x+Math.cos(a)*d,ty=u.y+Math.sin(a)*d;for(let s=0;s<6&&!walkable(tx,ty,u.r);s++){tx=u.x+(tx-u.x)*.8;ty=u.y+(ty-u.y)*.8;}
        if(walkable(tx,ty,u.r)){u.tbCd=7;u.tbDest={x:tx,y:ty,go:G.time+.75,t0:G.time};Snd.play('aim');}}}}
  // Hex Hound: keeps its mark cursed and keeps going after it
  if(k==='sec_hexhound'&&alive(u.mark)){u.mark.curseT=Math.max(u.mark.curseT||0,.6);u.mark.curseK=.4;
    if((u.order.t==='idle'||u.order.t==='amove')&&Math.hypot(u.mark.x-u.x,u.mark.y-u.y)<260)u.target=u.mark;}
  else if(k==='sec_hexhound')u.mark=null;};}
{const _u=update;update=function(dt){_u(dt);if(!G)return;try{rTick();if(G.rfx)G.rfx=G.rfx.filter(f=>G.time-f.t0<f.life);}catch(e){}};}
// defences
{const _hu=hurtUnit;hurtUnit=function(u,dmg){if(u&&u.k==='m_trooper'&&(u.still||0)>.25)dmg*=.6;if(u&&u.wardT>0)dmg*=.5;return _hu(u,dmg);};}
// timed buffs
{const _us=uStat;uStat=function(u){const s=_us(u);if(u.blazeT>0)s.rate*=1.6;if(u.ocT>0)s.rate*=2.5;return s;};}
// overcharge: the beam keeps its power through a target switch, and builds faster
{const _at=attack;attack=function(u,e,st){
  if(u.ovT>0&&u.def.kind==='beam'){const keep=u.ramp||1;u.beamOn=e;_at(u,e,st);u.ramp=Math.min(4,Math.max(u.ramp,keep)+.12);return;}
  _at(u,e,st);if(u.blazeT>0&&u.def.sp&&u.def.sp.burn)G.fires.push({x:e.x,y:e.y,r:70,t:2.4,max:2.4,dps:st.dmg*.5,u});};}

/* ---------- the new actives ---------- */
{const _da=doAbility;doAbility=function(u,abk,tgt){const A=ABIL[abk];if(!['clock','tide','overcharge','blaze','overclock'].includes(abk))return _da(u,abk,tgt);
  const st=uStat(u);u.cds[abk]=A.cd;u.atk=1;
  if(abk==='clock'){for(const e of G.enemies){if(e.dead||Math.hypot(e.x-tgt.x,e.y-tgt.y)>A.rad+e.r)continue;e.stun=Math.max(e.stun>0?e.stun+2:0,e.def.boss?1:2.5);}
    G.eproj=G.eproj.filter(p=>Math.hypot(p.x-tgt.x,p.y-tgt.y)>A.rad);G.fx.push({t:'clock',x:tgt.x,y:tgt.y,r:A.rad,life:2,max:2});floatText(tgt.x,tgt.y-A.rad*.5,'Time stops','#fde68a',14);Snd.play('lock');}
  else if(abk==='tide'){let v=(G.vortex||[]).filter(o=>Math.hypot(o.x-tgt.x,o.y-tgt.y)<220).sort((a,b)=>Math.hypot(a.x-tgt.x,a.y-tgt.y)-Math.hypot(b.x-tgt.x,b.y-tgt.y))[0];
    if(!v){v={x:tgt.x,y:tgt.y,r:72,t:3,max:3,dps:st.dmg*.25,u};(G.vortex=G.vortex||[]).push(v);}else v.t=Math.max(v.t,2.5);
    for(const e of G.enemies){if(e.dead||Math.hypot(e.x-tgt.x,e.y-tgt.y)>A.rad+e.r)continue;const d=Math.hypot(v.x-e.x,v.y-e.y)||1,pull=Math.min(d-10,e.def.boss?30:110);if(pull>0){const nx=e.x+(v.x-e.x)/d*pull,ny=e.y+(v.y-e.y)/d*pull;if(walkable(nx,ny,e.r)){e.x=nx;e.y=ny;}}
      e.slow=Math.max(e.slow,.5);e.slowT=2;hitEnemy(e,st.dmg*.8,u);}
    for(let i=0;i<4;i++)G.fx.push({t:'ring',x:v.x,y:v.y,r0:A.rad-i*25,r1:10,col:'#93c5fd',life:.5+i*.08,max:.5+i*.08,w:3});Snd.play('ink');G.shake=Math.min(6,G.shake+2);}
  else if(abk==='overcharge'){u.ovT=5;G.fx.push({t:'ring',x:u.x,y:u.y,r0:8,r1:46,col:'#38bdf8',life:.45,max:.45,w:3});floatText(u.x,u.y-u.r-14,'Overcharge','#7dd3fc',12);Snd.play('zap');}
  else if(abk==='blaze'){u.blazeT=4;G.fx.push({t:'ring',x:u.x,y:u.y,r0:8,r1:56,col:'#fb923c',life:.5,max:.5,w:3});Snd.play('breath');}
  else if(abk==='overclock'){u.ocT=5;G.fx.push({t:'ring',x:u.x,y:u.y,r0:8,r1:46,col:'#67e8f9',life:.45,max:.45,w:3});floatText(u.x,u.y-u.r-14,'Aim locked','#67e8f9',12);Snd.play('aim');}};}

/* ---------- what you see ---------- */
function drawRoster(c,t){if(!G)return;const now=G.time;
  for(const f of G.rfx||[]){const k=(now-f.t0)/f.life;if(k>1)continue;const a=1-k;
    if(f.k==='jet'){c.save();c.globalCompositeOperation='lighter';const ex=f.x+Math.cos(f.a)*f.L,ey=f.y+Math.sin(f.a)*f.L,w=2.5+f.heat*1.6;
      const g=c.createLinearGradient(f.x,f.y,ex,ey);g.addColorStop(0,`rgba(255,247,214,${.9*a})`);g.addColorStop(.5,`rgba(52,211,153,${.75*a})`);g.addColorStop(1,`rgba(253,230,138,${.3*a})`);
      c.strokeStyle=g;c.lineCap='round';c.lineWidth=w*2.2;c.globalAlpha=.35;c.beginPath();c.moveTo(f.x,f.y);c.lineTo(ex,ey);c.stroke();c.globalAlpha=1;c.lineWidth=w;c.stroke();c.restore();}
    else if(f.k==='tent'&&alive(f.e)&&!f.u.dead){const u=f.u,e=f.e,mx=(u.x+e.x)/2,my=(u.y+e.y)/2-24;c.save();c.strokeStyle=`rgba(129,140,248,${a})`;c.lineCap='round';
      for(const [w,col] of [[7,'#312e81'],[4.5,'#6366f1']]){c.strokeStyle=col;c.globalAlpha=a;c.lineWidth=w;c.beginPath();c.moveTo(u.x+u.face*u.r*.6,u.y);c.quadraticCurveTo(mx,my,e.x,e.y);c.stroke();}
      c.fillStyle='#c7d2fe';for(let i=1;i<5;i++){const q=i/5,x=(1-q)*(1-q)*(u.x+u.face*u.r*.6)+2*(1-q)*q*mx+q*q*e.x,y=(1-q)*(1-q)*u.y+2*(1-q)*q*my+q*q*e.y;c.beginPath();c.arc(x,y,1.3,0,TAU);c.fill();}c.restore();}
    else if(f.k==='streak'){c.save();c.globalCompositeOperation='lighter';c.strokeStyle=`rgba(191,219,254,${a})`;c.lineWidth=10*a+2;c.lineCap='round';c.beginPath();c.moveTo(f.x1,f.y1);c.lineTo(f.x2,f.y2);c.stroke();c.lineWidth=2;c.strokeStyle='#fff';c.stroke();c.restore();}}
  for(const u of G.units){if(u.dead)continue;
    // Thunderbird's destination marker
    if(u.tbDest){const D=u.tbDest,p=Math.min(1,(now-D.t0)/.75);c.save();c.strokeStyle=`rgba(147,197,253,${.5+.5*p})`;c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();c.moveTo(u.x,u.y);c.lineTo(D.x,D.y);c.stroke();c.setLineDash([]);
      c.beginPath();c.arc(D.x,D.y,18-8*p,0,TAU);c.stroke();c.fillStyle=`rgba(191,219,254,${.25*p})`;c.fill();c.restore();}
    // One-Armed Bandit winding up
    if(u.punchW>0){const p=1-u.punchW/.6;c.save();c.strokeStyle=`rgba(253,224,71,${.4+.6*p})`;c.lineWidth=2+p*2;c.beginPath();c.arc(u.x+u.face*u.r,u.y-u.r*.4,6+p*10,0,TAU);c.stroke();
      c.fillStyle='#fde047';c.font='bold 13px Bungee,Impact,sans-serif';c.textAlign='center';c.fillText('!',u.x+u.face*u.r,u.y-u.r*1.9-p*4);c.restore();}
    // Jackpot Sultan: the next wish, and how close it is
    if(u.k==='m_sultan'){const w=u.wishI||0,n=(u.wishN||0)%3,x=u.x,y=u.y-u.r*2.6-10,col=['#f87171','#93c5fd','#fde047'][w],sym=['⚔','⛨','$'][w];
      c.save();c.fillStyle='rgba(11,6,18,.75)';c.beginPath();c.arc(x,y,7,0,TAU);c.fill();c.strokeStyle=col;c.lineWidth=1.4;c.stroke();c.fillStyle=col;c.font='bold 9px Barlow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(sym,x,y+.5);
      for(let i=0;i<2;i++){c.fillStyle=i<n?col:'rgba(255,255,255,.25)';c.beginPath();c.arc(x-3+i*6,y+11,1.6,0,TAU);c.fill();}c.restore();}
    // protection from a wish
    if(u.wardT>0){c.save();c.strokeStyle=`rgba(147,197,253,${.35+.2*Math.sin(t*6)})`;c.lineWidth=1.5;c.beginPath();c.arc(u.x,u.y-u.r*.3,u.r*1.5,0,TAU);c.stroke();c.restore();}
    // Stack Trooper braced
    if(u.k==='m_trooper'&&(u.still||0)>.25){c.save();c.strokeStyle='rgba(253,230,138,.55)';c.lineWidth=2;c.beginPath();c.arc(u.x,u.y-u.r*.3,u.r*1.45,u.face>0?-.9:Math.PI-.9,u.face>0?.9:Math.PI+.9);c.stroke();c.restore();}
    // Mite Rider at full gallop
    if(u.k==='m_rider'&&(u.run||0)>=90){c.save();c.globalCompositeOperation='lighter';const p=.5+.5*Math.sin(t*12);c.fillStyle=`rgba(253,230,138,${.35+.35*p})`;c.beginPath();c.arc(u.x+u.face*u.r*1.5,u.y-u.r*.5,3+p*2,0,TAU);c.fill();c.restore();}
    // Hex Hound's mark
    if(u.k==='sec_hexhound'&&alive(u.mark)){const e=u.mark;c.save();c.strokeStyle=`rgba(192,132,252,${.5+.3*Math.sin(t*5)})`;c.lineWidth=1.6;c.beginPath();c.arc(e.x,e.y,e.r*VIS_E+6,0,TAU);c.stroke();
      c.fillStyle='#c084fc';c.font='bold 9px Barlow,sans-serif';c.textAlign='center';c.fillText('☠',e.x,e.y-e.r*VIS_E-8);c.restore();}
    // timed buffs glow
    if(u.ovT>0||u.blazeT>0||u.ocT>0){const col=u.ovT>0?'#38bdf8':u.blazeT>0?'#fb923c':'#67e8f9';c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.35+.2*Math.sin(t*8);c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.ellipse(u.x,u.y+u.r*.8,u.r*1.3,u.r*.5,0,0,TAU);c.stroke();c.restore();}}}
{const _g=drawGroundWarn;drawGroundWarn=function(c,t){_g(c,t);drawRoster(c,t);};}
