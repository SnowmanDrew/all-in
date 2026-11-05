'use strict';
/* ============ ALL IN — headliner nights ============
   Twice a run the Strip books a headliner: in the break before round 16 the All-Night Diner and the Dancing
   Fountain are both booking an act, and in the break before round 32 the Little Neon Chapel and the Starlite
   Motel. Each venue gives itself away (steam and a flashing fork, jets that leap, music drifting out of the
   doors, a motel sign that can't make its mind up). Click one to see the act. You can only afford one: book it
   and the other venue goes dark. Leave it and they both move on when the round starts.
   The four acts:
     All-You-Can-Eat   gulps small bad luck whole, swells while it digests, then belches a cone of it back
     Fountain Nymph    a water jet that soaks everything in a line, and a fountain show of telegraphed geysers
                       that throw the bad luck back up the road. Soaked bad luck takes +50% from lightning
     The King          plays to the beat: every bar the street freezes for a moment, every fourth bar an encore
                       stuns everything near him and fires up your creatures
     Vacancy           a motel sign that keeps changing its mind: VACANCY (creatures nearby attack faster),
                       NO VACANCY (throws bad luck back and slows it), CLOSED (shutters down: taunts and shrugs
                       off damage). The next word is always shown underneath.
   Shared helpers for the other new creatures live here too. */

/* ---------- shared helpers ---------- */
const hlAlive=e=>e&&!e.dead;
// the way back up the road for an enemy (against its walking direction)
function hlBack(e){const fx=e.fx||0,fy=e.fy||0;return (Math.abs(fx)+Math.abs(fy))>.05?Math.atan2(-fy,-fx):Math.PI;}
function hlShove(e,a,d){if(e.def.boss)d*=.2;else if(e.def.mini)d*=.45;for(let s=0;s<4;s++){const nx=e.x+Math.cos(a)*d,ny=e.y+Math.sin(a)*d;if(walkable(nx,ny,e.r)){e.x=nx;e.y=ny;e.atCasino=false;return true;}d*=.55;}return false;}
const hfx=f=>{(G.hfx=G.hfx||[]).push(Object.assign({t0:G.time},f));};
const hlNear=(x,y,r)=>G.enemies.filter(e=>!e.dead&&!e.hidden&&Math.hypot(e.x-x,e.y-y)<=r+e.r);
const hlUnits=k=>G.units.filter(u=>!u.dead&&u.k===k);
// creatures whose hits count as lightning for soaked bad luck
const HL_ZAP=new Set(['sf_lo','sf_hi','m_tempest','m_engine','m_pitboss','sec_thunderbird','m_gauss','m_rail','hl_vac']);
const hlZap=u=>!!(u&&u.def&&(HL_ZAP.has(u.k)||u.def.kind==='chain'||u.def.kind==='beam'||(u.def.sp&&u.def.sp.chains)));

/* ---------- the acts ---------- */
Object.assign(UNITS,{
 hl_eat:{name:'All-You-Can-Eat',role:'Bottomless appetite',secret:true,bonus:true,headliner:true,hand:9,hp:2900,dmg:62,rate:1,range:26,spd:66,r:17,armor:7,kind:'melee',sp:{taunt:110},
   look:{b:'glutton',face:'beady',c1:'#f97316',c2:'#fed7aa'},how:'Headliner night at the All-Night Diner',
   desc:'The diner\'s headliner. Gulps small or badly hurt bad luck whole. While it digests it swells up and shrugs off a quarter of the damage, then belches the meal back out in a cone.'},
 hl_nymph:{name:'Fountain Nymph',role:'Water show',secret:true,bonus:true,headliner:true,hand:9,hp:1500,dmg:48,rate:1.5,range:175,spd:74,r:15,armor:3,kind:'ranged',sp:{},
   look:{b:'nymph',face:'beady',c1:'#22d3ee',c2:'#e0f2fe'},how:'Headliner night at the Dancing Fountain',
   desc:'The fountain\'s headliner. Her jet soaks everything in a line, and every few seconds she puts on a show: rings of geysers that throw the bad luck back up the road. Soaked bad luck takes 50% more from lightning.'},
 hl_king:{name:'The King',role:'Lounge legend',secret:true,bonus:true,headliner:true,hand:9,hp:2600,dmg:82,rate:1.1,range:175,spd:78,r:14,armor:4,kind:'ranged',sp:{targets:2},
   look:{b:'king',face:'sly',body:'#f8fafc',pants:'#e5e7eb',sequins:'#fbbf24',cape:'#fde68a',belt:'gold',goggles:'#fbbf24',skin:'#e8c9a4',mouth:'grin',weapon:'mic',shot:'note'},how:'Headliner night at the Little Neon Chapel',
   desc:'The chapel\'s headliner plays to the beat of the music. Every bar, the bad luck near him freezes for a moment. Every fourth bar is an encore: a shockwave that stuns everything around him and makes your creatures nearby attack 35% faster.'},
 hl_vac:{name:'Vacancy',role:'Motel sign',secret:true,bonus:true,headliner:true,hand:9,hp:3400,dmg:64,rate:1,range:150,spd:58,r:16,armor:8,kind:'chain',sp:{chains:2},
   look:{b:'motelsign',face:'led',c1:'#0f766e',c2:'#fb7185',beam:'#86efac'},how:'Headliner night at the Starlite Motel',
   desc:'The motel\'s headliner can\'t make its mind up. VACANCY: creatures nearby attack 30% faster. NO VACANCY: throws nearby bad luck back and slows it. CLOSED: shutters down, it draws the bad luck in and takes 60% less damage. The next word is always shown underneath.'}});
for(const k of ['hl_king','hl_vac'])UNITS[k].detect=true;
const HL_NIGHTS={16:{acts:['diner','fountain'],cost:150},32:{acts:['chapel','motel'],cost:250}};
const HL_ACT={diner:'hl_eat',fountain:'hl_nymph',chapel:'hl_king',motel:'hl_vac'};
const HL_PITCH={
  diner:'“Tonight only at the All-Night Diner: an appetite that never closes. It eats bad luck. Then it gives it back.”',
  fountain:'“The Dancing Fountain proudly presents its star. Bring a towel. The bad luck should bring two.”',
  chapel:'“One night only at the Little Neon Chapel. He is the King. You will know it when the music starts.”',
  motel:'“The Starlite Motel\'s own sign has gone solo. It does three numbers and it never tells you which is next. Well. It does.”'};
HIDDEN_ACH.headliner=['Top of the Bill','Book a headliner on the Strip.','star','Some nights, a venue on the Strip is booking an act.'];
ACH.headliner=HIDDEN_ACH.headliner.slice(0,3);
const hlVenue=k=>OBST.find(o=>o.k===k);
function hlDoor(k){const o=hlVenue(k),x=(o.c+o.w/2)*TILE;if(o.r===0)return {x,y:(o.r+o.h)*TILE+12};if(o.r+o.h>=ROWS)return {x,y:o.r*TILE-12};return {x,y:(o.r+o.h)*TILE+14};}
const hlOpen=()=>{if(!G||G.phase==='wave'||!G.hl)return null;const N=G.hl[G.wave+1];return N&&N.state==='open'?N:null;};

/* ---------- the night ---------- */
{const _sh=startHand;startHand=function(){_sh.apply(this,arguments);if(!G||G.mp||G.over)return;const w=G.wave+1,N=HL_NIGHTS[w];if(!N||(G.hl||{})[w])return;
  (G.hl=G.hl||{})[w]={w,acts:N.acts.slice(),cost:N.cost,state:'open'};
  const [a,b]=N.acts.map(k=>hlVenue(k).name);
  gameLog(`Headliner night: the ${a} and the ${b} are both booking an act. Only one can play your Strip. Click a venue to see who.`,'good');Snd.play('windup');};}
{const _mc=mapClick;mapClick=function(x,y){const N=hlOpen();if(N){const c=Math.floor(x/TILE),r=Math.floor(y/TILE),o=OBST.find(o=>c>=o.c&&c<o.c+o.w&&r>=o.r&&r<o.r+o.h);
    if(o&&N.acts.includes(o.k)){hlCard(N,o.k);return true;}}return _mc(x,y);};}
function hlCard(N,v){let el=$('#headliner');if(!el){el=document.createElement('div');el.id='headliner';$('#boardWrap').appendChild(el);}
  const k=HL_ACT[v],d=UNITS[k],o=hlVenue(v),other=hlVenue(N.acts.find(a=>a!==v)),can=G.me.chips>=N.cost;
  el.innerHTML=`<div class="dl"><button class="hlx" id="hlX">×</button><div class="dlh"><canvas id="hlPor"></canvas><div><small>Tonight at the ${o.name}</small><h4>${d.name}<em>${d.role}</em></h4></div></div>
    <p class="hlp">${HL_PITCH[v]}</p><p class="hld">${d.desc}</p>
    <div class="dlb"><button class="pb main" id="hlYes" ${can?'':'disabled'}>Book it · ${N.cost} chips</button></div><small class="dln">${can?`Book this act and the ${other.name} goes dark tonight.`:`You need ${N.cost} chips. Decide before the round starts.`}</small></div>`;
  el.classList.add('show');portrait($('#hlPor'),k,30);Snd.play('click');
  $('#hlX').onclick=()=>{el.classList.remove('show');};$('#hlYes').onclick=()=>hlBook(N,v);}
function hlBook(N,v){if(N.state!=='open'||G.me.chips<N.cost){Snd.play('error');return;}
  G.me.chips-=N.cost;N.state='booked';N.v=v;const k=HL_ACT[v],d=UNITS[k],p=hlDoor(v),u=makeUnit(k,p.x,p.y);u.spawnT=.45;u.popAt=G.time;u.anchor={x:u.x,y:u.y};
  G.fx.push({t:'ring',x:u.x,y:u.y,r0:4,r1:70,col:'#fde047',life:.8,max:.8,w:4});for(let j=0;j<50;j++)spark(u.x,u.y,j%3?'#fde047':'#f472b6',170,.9);for(let i=0;i<40;i++)confetti();
  if(typeof Meta!=='undefined'){Meta.seen(k);Meta.ach('headliner');}
  banner('Headliner!',`${d.name} is playing your Strip`,'great');gameLog(`You booked ${d.name} from the ${hlVenue(v).name}. The ${hlVenue(N.acts.find(a=>a!==v)).name} goes dark.`,'good');Snd.play('jackpot');
  const dx=G.rally?G.rally.x:BASE.fx-40,dy=G.rally?G.rally.y:BASE.y+(rnd()-.5)*60;setTimeout(()=>{if(G&&!u.dead)orderMove([u],dx,dy,true);},700);
  $('#headliner')&&$('#headliner').classList.remove('show');}
{const _sw=startWave;startWave=function(){const N=G&&G.hl&&G.hl[G.wave+1];if(N&&N.state==='open'){N.state='lapsed';gameLog('Nobody booked a headliner. The acts have moved on to another strip.','');}
  const el=$('#headliner');if(el)el.classList.remove('show');return _sw.apply(this,arguments);};}

/* ---------- what the venues look like on a headliner night ---------- */
function drawHlTells(c,t){const N=G.hl&&G.hl[G.wave+1];if(!N||G.phase==='wave'){G.motelTxt=null;return;}
  const live=N.state==='open';
  G.motelTxt=null;
  for(const v of N.acts){const o=hlVenue(v),x0=o.c*TILE,y0=o.r*TILE,w=o.w*TILE,h=o.h*TILE,cx=x0+w/2;
    if(!live){if(N.state==='booked'&&N.v!==v){c.save();c.fillStyle='rgba(5,3,10,.45)';c.fillRect(x0+2,y0+2,w-4,h-4);c.restore();}continue;}
    // a gold star marquee over the door: TONIGHT
    {const d=hlDoor(v),bx=cx+(v==='fountain'?0:w*.3),by=v==='fountain'?d.y+6:o.r===0?d.y+4:d.y-2,p=.5+.5*Math.sin(t*5+o.c);c.save();c.translate(bx,by);
      c.strokeStyle='#3f2a17';c.lineWidth=1.6;c.beginPath();c.moveTo(-9,4);c.lineTo(-11,10);c.moveTo(9,4);c.lineTo(11,10);c.stroke();
      c.fillStyle='#1a0f1f';rr(c,-17,-7,34,12,2);c.fill();c.strokeStyle=`rgba(253,224,71,${.6+.4*p})`;c.lineWidth=1.2;c.shadowColor='#fde047';c.shadowBlur=4+p*6;c.stroke();
      c.font='700 6.5px Bungee,Impact,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle=`rgba(253,224,71,${.75+.25*p})`;c.fillText('TONIGHT',0,-.6);c.restore();}
    if(v==='diner'){ // steam off the grill and a fork & knife that flashes
      for(let k=0;k<5;k++){const q=((t*.5+k/5)%1),sx=x0+w*.25+k*w*.12+Math.sin(t*2+k)*4,sy=y0-2-q*30;c.fillStyle=`rgba(241,245,249,${.35*(1-q)})`;c.beginPath();c.arc(sx,sy,3+q*6,0,TAU);c.fill();}
      const on=Math.sin(t*7)>-.3;c.save();c.translate(cx,y0+h*.42);c.shadowColor='#fb923c';c.shadowBlur=on?10:0;c.strokeStyle=on?'#fdba74':'rgba(253,186,116,.3)';c.lineWidth=2.2;c.lineCap='round';
      c.beginPath();c.moveTo(-6,-8);c.lineTo(-6,8);c.moveTo(-9,-8);c.lineTo(-9,-3);c.moveTo(-3,-8);c.lineTo(-3,-3);c.moveTo(-9,-3);c.quadraticCurveTo(-6,0,-3,-3);c.moveTo(5,-8);c.quadraticCurveTo(10,-3,5,1);c.lineTo(5,8);c.stroke();c.restore();}
    if(v==='fountain'){const fx=cx,fy=y0+h/2;c.save();c.globalCompositeOperation='lighter';
      for(let k=0;k<6;k++){const a=k/6*TAU+t*.4,hh=22+10*Math.sin(t*3+k*1.7),bx=fx+Math.cos(a)*16,by=fy+Math.sin(a)*12;
        const g=c.createLinearGradient(bx,by,bx,by-hh);g.addColorStop(0,'rgba(103,232,249,.55)');g.addColorStop(1,'rgba(224,242,254,0)');c.strokeStyle=g;c.lineWidth=3;c.beginPath();c.moveTo(bx,by);c.quadraticCurveTo(bx+Math.cos(a)*6,by-hh,bx+Math.cos(a)*12,by-hh*.4);c.stroke();}
      for(let k=0;k<8;k++){const q=(t*.8+k/8)%1;glowDot(c,fx+Math.cos(k*2.4)*22*q,fy-28*Math.sin(q*Math.PI),2.5,'#fde047',.7*(1-q));}c.restore();}
    if(v==='chapel'){const d=hlDoor('chapel');for(let k=0;k<4;k++){const q=(t*.32+k/4)%1,nx=d.x-10+Math.sin(t*1.3+k*2)*14+q*18,ny=d.y-6-q*40;
        c.save();c.globalAlpha=Math.sin(q*Math.PI);c.fillStyle=k%2?'#f9a8d4':'#fde68a';c.shadowColor=c.fillStyle;c.shadowBlur=6;c.font='bold 13px serif';c.textAlign='center';c.fillText(k%2?'♫':'♪',nx,ny);c.restore();}
      const g=c.createRadialGradient(d.x,d.y-8,2,d.x,d.y-8,30);g.addColorStop(0,'rgba(244,114,182,.3)');g.addColorStop(1,'rgba(244,114,182,0)');c.fillStyle=g;c.fillRect(d.x-30,d.y-38,60,60);}
    if(v==='motel'){const ph=Math.floor(t*5.3),stut=(ph*7919)%11<3;const words=['VACANCY','NO VACANCY','CLOSED'],cols=['#4ade80','#ff3b5a','#fbbf24'];const i=stut?(ph%3):Math.floor(t*.9)%3;G.motelTxt=words[i];G.motelCol=cols[i];}}}
{const _g=drawGroundWarn;drawGroundWarn=function(c,t){_g(c,t);if(!G)return;try{drawHlTells(c,t);drawHlGround(c,t);}catch(e){}};}

/* ---------- how they play ---------- */
{const _up=unitPowers;unitPowers=function(u,dt){_up(u,dt);if(u.dead||!G)return;const k=u.k;if(u.kingT>0)u.kingT-=dt;if(u.vacT>0)u.vacT-=dt;if(k[0]!=='h'||k[2]!=='_')return;const st=uStat(u),wave=G.phase==='wave';
  // All-You-Can-Eat: gulp, swell, belch
  if(k==='hl_eat'){if(u.dig>0){u.dig-=dt;if(u.dig<=0)eatBelch(u,st);}
    else{u.eatCd=(u.eatCd==null?1:u.eatCd)-dt;if(u.eatCd<=0&&wave){const e=G.enemies.find(o=>!o.dead&&!o.hidden&&!o.def.boss&&!o.def.mini&&!(o.clawT>0)&&Math.hypot(o.x-u.x,o.y-u.y)<u.r+o.r+28&&(o.def.hp<=1.6||o.hp<o.maxHp*.35));
      if(e)eatGulp(u,e);else u.eatCd=.25;}}}
  // Fountain Nymph: the fountain show
  if(k==='hl_nymph'&&wave){u.showCd=(u.showCd==null?3:u.showCd)-dt;if(u.showCd<=0){const near=hlNear(u.x,u.y,240);if(near.length){u.showCd=7;nymphShow(u,st,near);}else u.showCd=.5;}}
  // Vacancy: three words, five seconds each
  if(k==='hl_vac'){if(!wave){u.vs=0;u.vsT=5;}else{u.vsT=(u.vsT==null?5:u.vsT)-dt;if(u.vsT<=0){u.vs=((u.vs||0)+1)%3;u.vsT=5;vacSwitch(u,st);}}
    const s=u.vs||0;
    if(s===0)for(const o of G.units)if(!o.dead&&Math.hypot(o.x-u.x,o.y-u.y)<160)o.vacT=.25;
    if(s===1&&wave)for(const e of hlNear(u.x,u.y,150)){e.slow=Math.max(e.slow,e.def.boss?.15:.3);e.slowT=Math.max(e.slowT||0,.3);}
    if(s===2&&wave)for(const e of hlNear(u.x,u.y,u.r+30)){if(!e.def.boss)hlShove(e,Math.atan2(e.y-u.y,e.x-u.x),28*dt);}}};}
{const _us=uStat;uStat=function(u){const s=_us(u);if(u.kingT>0)s.rate*=1.35;if(u.vacT>0)s.rate*=1.3;return s;};}
{const _hu=hurtUnit;hurtUnit=function(u,dmg){if(u){if(u.k==='hl_eat'&&u.dig>0)dmg*=.75;else if(u.k==='hl_vac'&&u.vs===2)dmg*=.4;}return _hu(u,dmg);};}
{const _tr=tauntR;tauntR=function(u){const r=_tr(u);return u.k==='hl_vac'&&u.vs===2&&G&&G.phase==='wave'?Math.max(r,170):r;};}

function eatGulp(u,e){u.meal=e.maxHp;u.dig=3.2;u.eatCd=0;u.atk=1;u.face=e.x>u.x?1:-1;const mx=u.x+u.face*u.r*.7,my=u.y-u.r*.25;
  hfx({k:'gulp',ek:e.k,er:e.r,x0:e.x,y0:e.y,u,life:.3});e.x=mx;e.y=my;killEnemy(e,u);u.hp=Math.min(u.maxHp,u.hp+u.maxHp*.06);
  floatText(u.x,u.y-u.r*2-6,'GULP!','#fdba74',14);Snd.play('pop');G.shake=Math.min(5,G.shake+1);}
function eatBelch(u,st){const e=nearestEnemy(u.x,u.y,170),a=e?Math.atan2(e.y-u.y,e.x-u.x):(u.face>0?0:Math.PI),R=140;u.face=Math.cos(a)>=0?1:-1;u.atk=1;u.eatCd=1.1;
  const dmg=st.dmg*2.5+Math.min(u.meal||0,st.dmg*20)*.25;
  for(const o of hlNear(u.x,u.y,R)){let da=Math.abs(Math.atan2(o.y-u.y,o.x-u.x)-a);if(da>Math.PI)da=TAU-da;if(da>.6&&Math.hypot(o.x-u.x,o.y-u.y)>u.r+o.r+6)continue;
    hitEnemy(o,dmg,u);if(!o.dead){hlShove(o,a,40);o.slow=Math.max(o.slow,.4);o.slowT=2;}}
  hfx({k:'belch',x:u.x+Math.cos(a)*u.r*.6,y:u.y-u.r*.25,a,R,life:.7});floatText(u.x,u.y-u.r*2-6,'BURP!','#bef264',15);Snd.play('ink');G.shake=Math.min(6,G.shake+2);u.meal=0;}
function nymphShow(u,st,near){const n=(u.showN=(u.showN||0)+1)%3,pts=[];
  if(n===1){const e=near.reduce((a,b)=>Math.hypot(b.x-u.x,b.y-u.y)<Math.hypot(a.x-u.x,a.y-u.y)?b:a),a=Math.atan2(e.y-u.y,e.x-u.x);for(let i=0;i<5;i++)pts.push([u.x+Math.cos(a)*(48+i*38),u.y+Math.sin(a)*(48+i*38)]);}
  else if(n===2){for(let i=0;i<7;i++){const a=u.showA=(u.showA||0)+.95,d=50+i*20;pts.push([u.x+Math.cos(a)*d,u.y+Math.sin(a)*d]);}}
  else{const a0=G.time;for(let i=0;i<6;i++){const a=a0+i/6*TAU;pts.push([u.x+Math.cos(a)*92,u.y+Math.sin(a)*92]);}}
  pts.forEach(([x,y],i)=>{const d=.7+i*.08;hfx({k:'geyser',x,y,d,life:d+.55});rLater(d,()=>{if(!G)return;for(const o of hlNear(x,y,34)){hitEnemy(o,st.dmg*2,u);if(!o.dead){nymphSoak(o);hlShove(o,hlBack(o),58);o.stun=Math.max(o.stun||0,.25);}}
    G.fx.push({t:'ring',x,y,r0:6,r1:38,col:'#a5f3fc',life:.4,max:.4,w:3});for(let j=0;j<8;j++)spark(x,y,j%2?'#e0f2fe':'#22d3ee',140,.45);if(i%2===0)Snd.play('drop');});});
  floatText(u.x,u.y-u.r*2.2,['Ring of jets','Straight up the road','The spiral'][n],'#a5f3fc',11);}
function nymphSoak(e){if(!(e.soakT>0)&&G.texts.length<50&&rnd()<.4)floatText(e.x,e.y-e.r-8,'Soaked','#7dd3fc',9);e.soakT=4;}
function vacSwitch(u,st){u.atk=1;
  if(u.vs===1){for(const e of hlNear(u.x,u.y,150)){hitEnemy(e,st.dmg*1.5,u);if(!e.dead){hlShove(e,Math.atan2(e.y-u.y,e.x-u.x),70);e.slow=Math.max(e.slow,.4);e.slowT=3;}}
    G.fx.push({t:'ring',x:u.x,y:u.y,r0:u.r,r1:150,col:'#ff3b5a',life:.5,max:.5,w:4});G.shake=Math.min(6,G.shake+2);Snd.play('zap');}
  else if(u.vs===2){G.fx.push({t:'ring',x:u.x,y:u.y,r0:u.r*2,r1:u.r,col:'#fbbf24',life:.35,max:.35,w:4});Snd.play('shutter');}
  else{G.fx.push({t:'ring',x:u.x,y:u.y,r0:u.r,r1:160,col:'#4ade80',life:.5,max:.5,w:2});Snd.play('click');}}
// Nymph's water jet: everything in a line gets wet
{const _at=attack;attack=function(u,e,st){if(u.k!=='hl_nymph')return _at(u,e,st);
  const a=Math.atan2(e.y-u.y,e.x-u.x),L=st.range+24,x1=u.x+Math.cos(a)*L,y1=u.y+Math.sin(a)*L;u.atk=1;u.aim=a;u.face=e.x>u.x?1:-1;
  for(const o of G.enemies){if(o.dead||o.hidden)continue;if(segDist(o.x,o.y,u.x,u.y,x1,y1)<=o.r+9){hitEnemy(o,st.dmg,u);if(!o.dead)nymphSoak(o);}}
  hfx({k:'jet',x:u.x+u.face*u.r*.5,y:u.y-u.r*.9,x1,y1,life:.28});if(rnd()<.5)Snd.play('drop');};}
// soaked: slower, and lightning goes straight through
{const _ue=updateEnemy;updateEnemy=function(e,dt){if(e.soakT>0){e.soakT-=dt;e.slow=Math.max(e.slow,e.def.boss?.08:.15);if(!(e.slowT>.1))e.slowT=.1;}return _ue(e,dt);};}
{const _he=hitEnemy;hitEnemy=function(e,dmg,u,opt){if(e&&e.soakT>0&&hlZap(u)){dmg*=1.5;if(G.fx.length<150&&rnd()<.25)G.fx.push({t:'chain',pts:[[e.x-8,e.y-10],[e.x+3,e.y-2],[e.x-2,e.y+6],[e.x+7,e.y+10]],col:'#a5f3fc',life:.16,max:.16,seed:rnd()*99});}return _he(e,dmg,u,opt);};}

/* ---------- The King's beat ---------- */
const KING_BAR=2.2;
{const _u=update;update=function(dt){_u(dt);if(!G||G.phase!=='wave')return;const ks=hlUnits('hl_king');if(!ks.length){G.kbBar=null;return;}
  let fire=false;const live=typeof Music!=='undefined'&&Music.on&&Music.timer&&Snd.ctx&&Snd.ctx.state==='running'&&G.speed===1;
  if(live){const b=Math.floor(Music.step/16);if(G.kbBar==null)G.kbBar=b;else if(b!==G.kbBar){G.kbBar=b;fire=true;}G.kbT=0;}
  else{G.kbBar=null;G.kbT=(G.kbT||0)+dt;if(G.kbT>=KING_BAR){G.kbT-=KING_BAR;fire=true;}}
  if(fire&&G.time-(G.kbLast||-9)>1.2){G.kbLast=G.time;for(const u of ks)kingBar(u);}};}
function kingBar(u){const st=uStat(u);u.bar=((u.bar||0)+1)%4;u.atk=1;
  if(u.bar===0){const R=210;for(const e of hlNear(u.x,u.y,R)){e.stun=Math.max(e.stun||0,e.def.boss?.4:e.def.mini?.8:1.5);hitEnemy(e,st.dmg*3,u);}
    for(const o of G.units)if(!o.dead&&Math.hypot(o.x-u.x,o.y-u.y)<R)o.kingT=6;
    G.fx.push({t:'ring',x:u.x,y:u.y,r0:u.r,r1:R,col:'#fde047',life:.6,max:.6,w:5});G.fx.push({t:'notes',x:u.x,y:u.y,r:R*.8,life:1.2,max:1.2});
    floatText(u.x,u.y-u.r*2.6,'ENCORE!','#fde047',16);G.shake=Math.min(7,G.shake+3);Snd.play('crowd');for(let i=0;i<24;i++)spark(u.x,u.y-u.r,i%2?'#fde047':'#f472b6',180,.7);}
  else{for(const e of hlNear(u.x,u.y,150))e.stun=Math.max(e.stun||0,e.def.boss?.08:.35);G.fx.push({t:'ring',x:u.x,y:u.y+u.r*.6,r0:u.r,r1:150,col:'#f472b6',life:.35,max:.35,w:2});}}

/* ---------- what you see: ground ---------- */
function drawHlGround(c,t){const now=G.time;
  if(G.hfx&&G.hfx.length){G.hfx=G.hfx.filter(f=>now-f.t0<f.life);for(const f of G.hfx){const k=(now-f.t0)/f.life,a=1-k;
    if(f.k==='geyser'){const p=Math.min(1,(now-f.t0)/f.d);if(now-f.t0<f.d){c.save();c.strokeStyle=`rgba(165,243,252,${.35+.5*p})`;c.lineWidth=1.5;c.setLineDash([3,3]);c.beginPath();c.arc(f.x,f.y,34,0,TAU);c.stroke();c.setLineDash([]);
        c.fillStyle=`rgba(34,211,238,${.12+.18*p})`;c.beginPath();c.arc(f.x,f.y,34*p,0,TAU);c.fill();c.restore();}
      else{const q=(now-f.t0-f.d)/.55,hh=70*Math.sin(Math.min(1,q)*Math.PI);c.save();c.globalCompositeOperation='lighter';const g=c.createLinearGradient(f.x,f.y,f.x,f.y-hh);g.addColorStop(0,'rgba(34,211,238,.8)');g.addColorStop(1,'rgba(240,249,255,.1)');
        c.fillStyle=g;c.beginPath();c.moveTo(f.x-9,f.y);c.quadraticCurveTo(f.x-5,f.y-hh*.6,f.x,f.y-hh);c.quadraticCurveTo(f.x+5,f.y-hh*.6,f.x+9,f.y);c.fill();
        for(let j=0;j<5;j++){const aa=j/5*TAU+f.x;glowDot(c,f.x+Math.cos(aa)*14*q,f.y-hh*.8+q*30*Math.abs(Math.sin(aa)),3,'#e0f2fe',.7*(1-q));}c.restore();}}
    else if(f.k==='jet'){c.save();c.globalCompositeOperation='lighter';c.lineCap='round';const g=c.createLinearGradient(f.x,f.y,f.x1,f.y1);g.addColorStop(0,`rgba(240,249,255,${.95*a})`);g.addColorStop(.6,`rgba(34,211,238,${.75*a})`);g.addColorStop(1,`rgba(14,165,233,${.25*a})`);
      c.strokeStyle=g;c.lineWidth=9*a+2;c.globalAlpha=.35;c.beginPath();c.moveTo(f.x,f.y);c.lineTo(f.x1,f.y1);c.stroke();c.globalAlpha=1;c.lineWidth=3;c.stroke();
      for(let j=0;j<4;j++){const q=(j+k*2)/5%1;glowDot(c,f.x+(f.x1-f.x)*q,f.y+(f.y1-f.y)*q+Math.sin(j*3)*4,4,'#e0f2fe',.6*a);}c.restore();}
    else if(f.k==='belch'){c.save();c.globalCompositeOperation='lighter';for(let j=0;j<12;j++){const q=Math.min(1,k*1.4),aa=f.a+(((j*37)%13)/13-.5)*1.1,d=f.R*q*(.4+((j*53)%7)/10);
        glowDot(c,f.x+Math.cos(aa)*d,f.y+Math.sin(aa)*d,10+q*10,j%3?'#bef264':'#fde047',.45*a);}c.restore();}
    else if(f.k==='gulp'){const u=f.u,q=Math.min(1,k*1.3),x=f.x0+(u.x+u.face*u.r*.7-f.x0)*q,y=f.y0+(u.y-u.r*.25-f.y0)*q;try{const s=enemySprite(f.ek,f.er,0);blit(c,s,x,y,VIS_E*(1-q*.8),VIS_E*(1-q*.8),0,q*6);}catch(e){}}}}
  // Vacancy: the word it is showing, lit on the ground as an aura
  for(const u of G.units){if(u.dead)continue;
    if(u.k==='hl_vac'&&G.phase==='wave'){const s=u.vs||0,col=['#4ade80','#ff3b5a','#fbbf24'][s],R=[160,150,170][s];c.save();c.strokeStyle=hexA(col,.3+.15*Math.sin(t*4));c.lineWidth=1.5;c.setLineDash(s===2?[8,5]:[2,6]);c.beginPath();c.arc(u.x,u.y,R,0,TAU);c.stroke();c.setLineDash([]);c.restore();}
    if(u.k==='hl_king'&&G.phase==='wave'){const age=G.time-(G.kbLast||-9),p=Math.max(0,1-age/.45);if(p>0){c.save();c.strokeStyle=`rgba(244,114,182,${.5*p})`;c.lineWidth=2;c.beginPath();c.ellipse(u.x,u.y+u.r*.85,u.r*(1.4+1.2*(1-p)),u.r*.5*(1.4+1.2*(1-p)),0,0,TAU);c.stroke();c.restore();}}
    if(u.kingT>0){c.save();c.globalCompositeOperation='lighter';c.fillStyle=`rgba(253,224,71,${.5+.3*Math.sin(t*9+u.bob)})`;c.font='bold 8px serif';c.textAlign='center';c.fillText('♪',u.x+u.r*.9,u.y-u.r*1.4-Math.abs(Math.sin(t*4+u.bob))*4);c.restore();}}}

/* ---------- what you see: over the top ---------- */
function drawHlTop(c,t){for(const u of G.units){if(u.dead)continue;
  // Vacancy: the word in neon and the next one underneath
  if(u.k==='hl_vac'){const s=u.vs||0,words=['VACANCY','NO VACANCY','CLOSED'],cols=['#4ade80','#ff3b5a','#fbbf24'],x=u.x-u.r*.05,y=u.y-u.r*2.25-(u.jh||0);

    {c.save();c.font=`700 ${s===1?7:8}px Bungee,Impact,sans-serif`;const tw=c.measureText(words[s]).width+8;c.fillStyle='rgba(11,6,18,.8)';rr(c,x-tw/2,y-6,tw,12,4);c.fill();c.restore();}
    const flick=G.phase==='wave'&&u.vsT<.6&&Math.sin(t*40)>0;c.save();c.textAlign='center';c.textBaseline='middle';c.font=`700 ${s===1?7:8}px Bungee,Impact,sans-serif`;
    c.shadowColor=cols[s];c.shadowBlur=flick?0:8;c.fillStyle=flick?hexA(cols[s],.35):cols[s];c.fillText(words[s],x,y);c.shadowBlur=0;
    if(G.phase==='wave'){const n=(s+1)%3,pr=1-(u.vsT||0)/5;c.font='600 7px Barlow,sans-serif';c.fillStyle='rgba(11,6,18,.75)';const tw=c.measureText('next: '+words[n]).width+10;rr(c,x-tw/2,u.y+u.r*1.05,tw,9,3);c.fill();
      c.fillStyle=hexA(cols[n],.9);c.fillText('next: '+words[n],x,u.y+u.r*1.05+4.8);c.fillStyle=cols[n];c.fillRect(x-tw/2+2,u.y+u.r*1.05+8,(tw-4)*pr,1.2);}c.restore();}
  // The King: four pips for the four bars, the last one gold
  if(u.k==='hl_king'&&G.phase==='wave'){const x=u.x,y=u.y+u.r*1.25,b=u.bar||0,age=G.time-(G.kbLast||-9),p=Math.max(0,1-age/.4);c.save();
    for(let i=0;i<4;i++){const on=i<b||(b===0&&p>0),last=i===3,px=x-9+i*6;c.fillStyle=on?(last?'#fde047':'#f472b6'):'rgba(255,255,255,.22)';c.beginPath();c.arc(px,y,last?2.2:1.7,0,TAU);c.fill();}
    if(b===3){c.strokeStyle=`rgba(253,224,71,${.5+.5*Math.sin(t*10)})`;c.lineWidth=1;c.beginPath();c.arc(x+9,y,3.6,0,TAU);c.stroke();}c.restore();}}}
{const _t=drawTopWarn;drawTopWarn=function(c,t){_t(c,t);if(!G)return;try{drawHlTop(c,t);}catch(e){}};}
// a sign doesn't turn round: Vacancy never mirrors, so MOTEL always reads the right way
{const _du=drawUnit;drawUnit=function(c,u,t){if(u.k!=='hl_vac')return _du(c,u,t);const f=u.face;u.face=1;try{_du(c,u,t);}finally{u.face=f;}};}
// All-You-Can-Eat swells up while it digests
{const _du=drawUnit;drawUnit=function(c,u,t){if(u.k==='hl_eat'&&u.dig>0){const k=Math.min(1,(3.2-u.dig)/.25,u.dig/.3),s=1+.24*k+.03*Math.sin(t*9)*k,fy=u.y+u.r*VIS_U*.82;
    c.save();c.translate(u.x,fy);c.scale(s,s);c.translate(-u.x,-fy);_du(c,u,t);c.restore();return;}return _du(c,u,t);};}
// soaked bad luck drips
{const _de=drawEnemy;drawEnemy=function(c,e,t){_de(c,e,t);if(e.soakT>0){const R=e.r*VIS_E;c.save();c.fillStyle='rgba(125,211,252,.85)';for(let k=0;k<2;k++){const q=(t*1.6+k*.5+e.wob)%1;c.beginPath();c.ellipse(e.x-R*.4+k*R*.8,e.y-R*.2+q*R*1.1,1.1,1.7,0,0,TAU);c.fill();}
    c.strokeStyle='rgba(125,211,252,.35)';c.lineWidth=1;c.beginPath();c.ellipse(e.x,e.y+R*.8,R*.9,R*.3,0,0,TAU);c.stroke();c.restore();}};}

/* ---------- bodies ---------- */
// All-You-Can-Eat: a round, ravenous diner regular in a gingham bib, knife and fork at the ready
BEAST.glutton=(c,s,L,t,atk)=>{const w=TW,st=Math.sin(t*w*2),c1=L.c1,c2=L.c2,dk=shade(c1,-.35),open=.15+atk*.55;
  // stubby legs in sneakers
  for(const [x,ph] of [[-s*.42,st],[s*.38,-st]]){c.fillStyle=dk;rr(c,x-s*.14,s*.45+ph*s*.03,s*.28,s*.38,s*.1);c.fill();c.fillStyle='#f8fafc';rr(c,x-s*.22,s*.76+ph*s*.03,s*.46,s*.16,s*.07);c.fill();c.fillStyle='#dc2626';c.fillRect(x-s*.2,s*.84+ph*s*.03,s*.42,s*.05);}
  // back arm with the fork
  c.strokeStyle=dk;c.lineWidth=s*.2;c.lineCap='round';c.beginPath();c.moveTo(-s*.7,-s*.05);c.lineTo(-s*1.05,-s*.35-atk*s*.2);c.stroke();
  c.save();c.translate(-s*1.08,-s*.42-atk*s*.2);c.rotate(-.25);c.fillStyle='#cbd5e1';c.fillRect(-s*.03,-s*.05,s*.06,s*.5);c.fillRect(-s*.14,-s*.38,s*.28,s*.06);for(let k=0;k<4;k++)c.fillRect(-s*.14+k*s*.08,-s*.6,s*.04,s*.24);c.restore();
  // the body: one big belly
  {const g=c.createRadialGradient(-s*.3,-s*.4,s*.1,0,0,s*1.15);g.addColorStop(0,shade(c1,.3));g.addColorStop(.7,c1);g.addColorStop(1,dk);c.fillStyle=g;}
  c.beginPath();c.ellipse(0,-s*.02,s*1.0,s*.9,0,0,TAU);c.fill();c.fillStyle=c2;c.beginPath();c.ellipse(s*.12,s*.25,s*.62,s*.5,0,0,TAU);c.fill();
  // gingham bib tucked in under the chin
  c.save();c.beginPath();c.moveTo(-s*.42,-s*.05);c.lineTo(s*.62,-s*.05);c.lineTo(s*.48,s*.58);c.quadraticCurveTo(s*.1,s*.72,-s*.3,s*.58);c.closePath();c.fillStyle='#f8fafc';c.fill();c.clip();
  c.fillStyle='rgba(220,38,38,.55)';for(let i=-4;i<6;i++){c.fillRect(-s*.5+i*s*.14,-s*.1,s*.07,s*.9);c.fillRect(-s*.5,-s*.08+i*s*.14,s*1.2,s*.07);}c.restore();
  c.fillStyle='#f8fafc';c.beginPath();c.moveTo(-s*.42,-s*.05);c.lineTo(-s*.6,-s*.18);c.lineTo(-s*.3,-s*.08);c.fill();c.beginPath();c.moveTo(s*.62,-s*.05);c.lineTo(s*.8,-s*.2);c.lineTo(s*.5,-s*.08);c.fill();
  // the mouth: wide, toothy, opening on every bite
  c.fillStyle='#450a0a';c.beginPath();c.moveTo(-s*.15,-s*.28);c.quadraticCurveTo(s*.35,-s*.3,s*.85,-s*.32);c.quadraticCurveTo(s*.6,-s*.28+open*s*.6,s*.2,-s*.22+open*s*.45);c.quadraticCurveTo(-s*.05,-s*.22+open*s*.2,-s*.15,-s*.28);c.fill();
  c.fillStyle='#fb7185';c.beginPath();c.ellipse(s*.38,-s*.25+open*s*.32,s*.18,s*.07,0,0,TAU);c.fill();
  c.fillStyle='#fff';for(let k=0;k<5;k++){const x=s*(.0+k*.17),y=-s*.3+k*-.004*s;c.beginPath();c.moveTo(x,y);c.lineTo(x+s*.06,y+s*.09);c.lineTo(x+s*.12,y);c.fill();}
  for(let k=0;k<3;k++){const x=s*(.15+k*.2),y=-s*.24+open*s*.4;c.beginPath();c.moveTo(x,y);c.lineTo(x+s*.06,y-s*.08);c.lineTo(x+s*.12,y);c.fill();}
  // drool
  c.fillStyle='rgba(186,230,253,.9)';c.beginPath();c.ellipse(s*.78,-s*.18+Math.abs(Math.sin(t*w))*s*.12,s*.04,s*.08,0,0,TAU);c.fill();
  // eyes: big and hungry, and a little paper hat from the counter
  eye(c,s*.05,-s*.62,s*.17);eye(c,s*.45,-s*.62,s*.15);c.strokeStyle=dk;c.lineWidth=s*.06;c.beginPath();c.moveTo(-s*.1,-s*.86);c.lineTo(s*.18,-s*.8);c.moveTo(s*.32,-s*.8);c.lineTo(s*.58,-s*.86);c.stroke();
  c.fillStyle='#f8fafc';c.beginPath();c.moveTo(-s*.35,-s*.8);c.lineTo(s*.45,-s*.84);c.lineTo(s*.28,-s*1.12);c.lineTo(-s*.22,-s*1.1);c.closePath();c.fill();c.fillStyle='#dc2626';c.fillRect(-s*.3,-s*.92,s*.68,s*.06);
  // front arm with the knife
  c.strokeStyle=c1;c.lineWidth=s*.2;c.beginPath();c.moveTo(s*.6,s*.15);c.lineTo(s*1.0,-s*.12-atk*s*.25);c.stroke();c.fillStyle=c2;c.beginPath();c.arc(s*1.0,-s*.12-atk*s*.25,s*.12,0,TAU);c.fill();
  c.save();c.translate(s*1.02,-s*.18-atk*s*.25);c.rotate(.3);c.fillStyle='#78350f';c.fillRect(-s*.04,0,s*.08,s*.2);c.fillStyle='#e2e8f0';c.beginPath();c.moveTo(-s*.04,0);c.lineTo(-s*.04,-s*.5);c.quadraticCurveTo(s*.1,-s*.4,s*.06,0);c.closePath();c.fill();c.restore();};

// Fountain Nymph: rising out of her own two-tier fountain, water for hair
BEAST.nymph=(c,s,L,t,atk)=>{const w=TW,bob=Math.sin(t*w)*s*.04,skin='#a5f3fc',hair='#0e7490',hl='#ecfeff';
  // the lower basin, its water rippling
  c.fillStyle='#475569';c.beginPath();c.ellipse(0,s*.8,s*1.2,s*.3,0,0,TAU);c.fill();c.fillStyle='#cbd5e1';c.beginPath();c.ellipse(0,s*.72,s*1.17,s*.27,0,0,TAU);c.fill();
  c.fillStyle='#0284c7';c.beginPath();c.ellipse(0,s*.68,s*1.02,s*.2,0,0,TAU);c.fill();c.strokeStyle='rgba(224,242,254,.8)';c.lineWidth=1;for(let k=0;k<3;k++){const R=s*(.35+.6*((t*w*.5/TAU+k/3)%1));c.beginPath();c.ellipse(0,s*.68,R,R*.2,0,0,TAU);c.stroke();}
  // little jets round the rim, arcing outwards
  for(let k=0;k<6;k++){const a=k/6*TAU+.3,x=Math.cos(a)*s*.95,y=s*.68+Math.sin(a)*s*.2,dir=Math.sign(Math.cos(a))||1,hh=s*(.28+.1*Math.sin(t*w*2+k));c.strokeStyle='rgba(186,230,253,.8)';c.lineWidth=1.4;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+dir*s*.1,y-hh,x+dir*s*.22,y-hh*.2);c.stroke();}
  // her hair: water pouring down her back into the basin
  {const g=c.createLinearGradient(0,-s*1.1,0,s*.7);g.addColorStop(0,hair);g.addColorStop(1,'rgba(14,116,144,.55)');c.fillStyle=g;}
  c.beginPath();c.moveTo(-s*.12,-s*1.02+bob);c.quadraticCurveTo(-s*.62,-s*.8+bob,-s*.55,-s*.2);c.quadraticCurveTo(-s*.62+Math.sin(t*w)*s*.06,s*.3,-s*.78,s*.64);c.lineTo(-s*.35,s*.64);c.quadraticCurveTo(-s*.3,0,-s*.05,-s*.6+bob);c.closePath();c.fill();
  c.strokeStyle='rgba(236,254,255,.7)';c.lineWidth=1;for(let k=0;k<3;k++){c.beginPath();c.moveTo(-s*(.2+k*.12),-s*.9+bob);c.quadraticCurveTo(-s*(.55+k*.04),-s*.2,-s*(.5+k*.08),s*.6);c.stroke();}
  // body rising out of the water
  {const g=c.createLinearGradient(0,-s*.6,0,s*.65);g.addColorStop(0,skin);g.addColorStop(.6,'#22d3ee');g.addColorStop(1,'#0284c7');c.fillStyle=g;}
  c.beginPath();c.moveTo(-s*.42,s*.66);c.quadraticCurveTo(-s*.32,s*.1,-s*.2,-s*.12+bob);c.quadraticCurveTo(-s*.26,-s*.36+bob,-s*.14,-s*.5+bob);c.lineTo(s*.16,-s*.5+bob);c.quadraticCurveTo(s*.28,-s*.36+bob,s*.2,-s*.12+bob);c.quadraticCurveTo(s*.32,s*.1,s*.42,s*.66);c.closePath();c.fill();
  // a dress of falling water, scalloped like a fountain tier
  c.fillStyle='rgba(236,254,255,.55)';for(let k=0;k<5;k++){const x=-s*.36+k*s*.18;c.beginPath();c.ellipse(x,s*.22+Math.sin(t*w*2+k)*s*.02,s*.1,s*.05,0,0,Math.PI);c.fill();}
  // arms: one raised, one sweeping out, a stream from the raised hand
  const lift=atk*s*.22;c.strokeStyle=skin;c.lineWidth=s*.12;c.lineCap='round';c.beginPath();c.moveTo(s*.14,-s*.42+bob);c.quadraticCurveTo(s*.45,-s*.62+bob,s*.5,-s*.98-lift+bob);c.stroke();
  c.beginPath();c.moveTo(-s*.14,-s*.4+bob);c.quadraticCurveTo(-s*.4,-s*.25+bob,-s*.55,-s*.38+bob);c.stroke();
  c.strokeStyle='rgba(165,243,252,.9)';c.lineWidth=s*.08;c.beginPath();c.moveTo(s*.52,-s*1.04-lift+bob);c.quadraticCurveTo(s*.95,-s*1.4-lift,s*1.05,-s*.2);c.stroke();
  c.fillStyle=hl;for(let k=0;k<3;k++){const q=((t*w/TAU)*2+k/3)%1;c.beginPath();c.arc(s*(.6+.45*q),-s*1.15-lift+q*q*s*1.1,s*.045,0,TAU);c.fill();}
  // head
  c.fillStyle=skin;c.beginPath();c.arc(0,-s*.76+bob,s*.25,0,TAU);c.fill();
  c.fillStyle=hair;c.beginPath();c.moveTo(-s*.26,-s*.78+bob);c.quadraticCurveTo(-s*.18,-s*1.08+bob,s*.14,-s*1.04+bob);c.quadraticCurveTo(s*.3,-s*.98+bob,s*.27,-s*.82+bob);c.quadraticCurveTo(s*.05,-s*.95+bob,-s*.12,-s*.82+bob);c.closePath();c.fill();
  c.fillStyle='rgba(236,254,255,.7)';c.beginPath();c.ellipse(-s*.02,-s*.98+bob,s*.1,s*.03,-.3,0,TAU);c.fill();
  eye(c,s*.0,-s*.76+bob,s*.075);eye(c,s*.14,-s*.76+bob,s*.075);c.strokeStyle='#0e7490';c.lineWidth=1;c.beginPath();c.arc(s*.07,-s*.67+bob,s*.06,.3,Math.PI-.3);c.stroke();
  c.fillStyle='#f9a8d4';c.globalAlpha=.6;c.beginPath();c.arc(-s*.08,-s*.68+bob,s*.04,0,TAU);c.arc(s*.22,-s*.68+bob,s*.04,0,TAU);c.fill();c.globalAlpha=1;
  // shell crown
  for(let k=0;k<3;k++){const x=-s*.12+k*s*.13;c.fillStyle=k===1?'#fbcfe8':'#fde68a';c.beginPath();c.moveTo(x-s*.06,-s*.98+bob);c.lineTo(x,-s*1.13+bob);c.lineTo(x+s*.06,-s*.98+bob);c.fill();}
  c.fillStyle='#fff';c.beginPath();c.arc(s*.01,-s*1.0+bob,s*.03,0,TAU);c.fill();};
// The King: white jumpsuit, gold, cape, collar up, the quiff
BEAST.king=(c,s,L,t,atk)=>{human(c,s,L,t,atk);c.save();c.scale(1.32,1.32);const ty=-s*.3,hx=s*.04,hy=ty-s*.28;
  // collar up
  c.fillStyle='#f8fafc';for(const sx of [-1,1]){c.beginPath();c.moveTo(hx+sx*s*.08,hy+s*.3);c.lineTo(hx+sx*s*.32,hy+s*.12);c.lineTo(hx+sx*s*.26,hy+s*.36);c.closePath();c.fill();c.strokeStyle='#fbbf24';c.lineWidth=.8;c.stroke();}
  // the quiff and sideburns
  c.fillStyle='#111827';c.beginPath();c.moveTo(hx-s*.3,hy-s*.02);c.quadraticCurveTo(hx-s*.34,hy-s*.42,hx+s*.02,hy-s*.44);c.quadraticCurveTo(hx+s*.42,hy-s*.5,hx+s*.46,hy-s*.3);c.quadraticCurveTo(hx+s*.3,hy-s*.3,hx+s*.22,hy-s*.24);c.quadraticCurveTo(hx,hy-s*.3,hx-s*.18,hy-s*.12);c.lineTo(hx-s*.22,hy+s*.12);c.closePath();c.fill();
  c.fillStyle='rgba(148,163,184,.55)';c.beginPath();c.ellipse(hx+s*.1,hy-s*.42,s*.16,s*.04,-.15,0,TAU);c.fill();
  c.fillStyle='#111827';c.fillRect(hx+s*.2,hy-s*.05,s*.06,s*.2);
  // rhinestone eagle on the chest
  c.fillStyle='#fde047';c.beginPath();c.moveTo(-s*.18,ty+s*.25);c.quadraticCurveTo(0,ty+s*.12,s*.18,ty+s*.25);c.lineTo(0,ty+s*.36);c.closePath();c.fill();c.restore();};
// Vacancy: a motel arrow sign on two posts, bulbs chasing round the board
BEAST.motelsign=(c,s,L,t,atk)=>{const w=TW,st=Math.sin(t*w*2),c1=L.c1,c2=L.c2;
  // two posts for legs
  for(const [x,ph] of [[-s*.38,st],[s*.32,-st]]){c.fillStyle='#475569';c.fillRect(x-s*.08,s*.15,s*.16,s*.65+ph*s*.04);c.fillStyle='#1e293b';rr(c,x-s*.2,s*.76+ph*s*.04,s*.4,s*.14,s*.05);c.fill();}
  // a googie board: tall, leaning, rounded at the top
  c.fillStyle='#0b3b36';c.beginPath();c.moveTo(-s*.8,s*.24);c.lineTo(-s*.76,-s*.95);c.quadraticCurveTo(-s*.7,-s*1.32,-s*.25,-s*1.3);c.lineTo(s*.62,-s*1.12);c.quadraticCurveTo(s*.72,-s*1.08,s*.7,-s*.95);c.lineTo(s*.66,s*.24);c.closePath();c.fill();
  c.fillStyle=c1;c.beginPath();c.moveTo(-s*.73,s*.18);c.lineTo(-s*.7,-s*.93);c.quadraticCurveTo(-s*.65,-s*1.24,-s*.25,-s*1.23);c.lineTo(s*.58,-s*1.06);c.quadraticCurveTo(s*.65,-s*1.03,s*.63,-s*.93);c.lineTo(s*.6,s*.18);c.closePath();c.fill();
  // the name band (the lettering is lit over the top in neon), then a row of rooms with their lights on
  c.fillStyle='#3b0a1e';rr(c,-s*.62,-s*1.0,s*1.16,s*.34,s*.08);c.fill();c.strokeStyle=c2;c.lineWidth=1.2;rr(c,-s*.62,-s*1.0,s*1.16,s*.34,s*.08);c.stroke();
  c.fillStyle='#fda4af';c.font=`900 ${s*.27}px Barlow,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('MOTEL',-s*.04,-s*.82);
  c.fillStyle='#134e4a';c.fillRect(-s*.62,-s*.5,s*1.16,s*.5);c.fillStyle='#0f766e';c.fillRect(-s*.62,-s*.56,s*1.16,s*.07);
  for(let k=0;k<4;k++){const x=-s*.55+k*s*.28,lit=(k+Math.floor(t*w*.5))%4!==1;c.fillStyle='#7c2d12';c.fillRect(x,-s*.38,s*.11,s*.36);c.fillStyle=lit?'#fde68a':'#1e293b';c.fillRect(x+s*.13,-s*.36,s*.1,s*.12);c.fillStyle='#fbbf24';c.beginPath();c.arc(x+s*.08,-s*.2,s*.015,0,TAU);c.fill();}
  // chaser bulbs down both edges
  for(let k=0;k<7;k++){const on=(k+Math.floor(t*w*1.5))%3===0;c.fillStyle=on?'#fff7d6':'#a16207';c.beginPath();c.arc(-s*.68,-s*.85+k*s*.16,s*.04,0,TAU);c.arc(s*.59,-s*.85+k*s*.16,s*.04,0,TAU);c.fill();}
  // the big arrow swooping round, pointing at the door
  c.save();c.translate(s*.6,-s*.35);c.fillStyle='#be123c';c.beginPath();c.moveTo(-s*.1,-s*.95);c.quadraticCurveTo(s*.45,-s*.85,s*.4,-s*.05);c.lineTo(s*.58,-s*.05);c.lineTo(s*.3,s*.3);c.lineTo(s*.02,-s*.05);c.lineTo(s*.2,-s*.05);c.quadraticCurveTo(s*.22,-s*.68,-s*.1,-s*.75);c.closePath();c.fill();
  for(let k=0;k<5;k++){const on=(k+Math.floor(t*w*2))%2===0,q=k/5;c.fillStyle=on?'#fde68a':'#7f1d1d';c.beginPath();c.arc(s*(-.02+.36*Math.sin(q*1.5)),-s*(.85-q*.75),s*.035,0,TAU);c.fill();}c.restore();
  // a starburst on top
  c.save();c.translate(-s*.45,-s*1.38);c.rotate(t*w*.5);c.strokeStyle='#fde047';c.lineWidth=s*.05;for(let k=0;k<8;k++){c.rotate(TAU/8);c.beginPath();c.moveTo(0,s*.04);c.lineTo(0,s*(k%2?.16:.26));c.stroke();}c.fillStyle='#fde047';c.beginPath();c.arc(0,0,s*.07,0,TAU);c.fill();c.restore();
  // an arm that swings out when it zaps
  c.strokeStyle='#475569';c.lineWidth=s*.1;c.lineCap='round';c.beginPath();c.moveTo(-s*.72,-s*.2);c.lineTo(-s*1.02,-s*.42-atk*s*.3);c.stroke();c.fillStyle='#86efac';c.beginPath();c.arc(-s*1.05,-s*.45-atk*s*.3,s*.09+atk*s*.05,0,TAU);c.fill();};
for(const b of ['glutton','motelsign'])WALKERS.add(b);
// The King's microphone
{const _wp=weapon;weapon=function(c,r,o,hx,hy,atk,front){if(o.weapon!=='mic')return _wp(c,r,o,hx,hy,atk,front);
  c.save();c.translate(hx,hy);c.rotate(-.5-atk*.5);c.fillStyle='#111827';c.fillRect(-r*.03,-r*.02,r*.06,r*.2);c.fillStyle='#94a3b8';c.beginPath();c.arc(0,-r*.06,r*.065,0,TAU);c.fill();
  c.fillStyle='#e2e8f0';c.beginPath();c.arc(-r*.02,-r*.08,r*.025,0,TAU);c.fill();c.restore();};}

{const st=document.createElement('style');st.textContent=`
#headliner{position:absolute;left:50%;bottom:14px;z-index:9;width:420px;margin-left:-210px;opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s;pointer-events:none}
#headliner.show{opacity:1;transform:none;pointer-events:auto}
#headliner .dl{position:relative;padding:12px 14px;border-radius:12px;background:linear-gradient(180deg,rgba(32,14,30,.97),rgba(14,8,20,.97));box-shadow:0 0 0 1.5px #fbbf24,0 0 26px rgba(251,191,36,.35),0 10px 30px rgba(0,0,0,.6);color:#fdf4e7;font:400 12.5px/1.4 var(--body,Barlow),sans-serif}
#headliner .dlh{display:flex;gap:10px;align-items:center}#headliner #hlPor{width:60px;height:60px;border-radius:10px;flex:none;background:radial-gradient(circle at 50% 40%,#3b1d3a,#120c19)}
#headliner small{font:400 10px var(--head);color:#fbbf24;letter-spacing:.05em;text-transform:uppercase}#headliner h4{margin:2px 0 0;font:400 17px var(--head);color:#fff;letter-spacing:.02em}
#headliner h4 em{display:block;font:italic 400 11px var(--body,Barlow),sans-serif;color:#f9a8d4;letter-spacing:0}
#headliner .hlp{margin:8px 0 4px;color:#fde68a;font-style:italic}#headliner .hld{margin:0;color:#e2e8f0;font-size:12px}
#headliner .dlb{display:flex;gap:6px;margin-top:10px}#headliner .pb{height:30px;margin:0;flex:1}#headliner .pb[disabled]{opacity:.45}
#headliner .dln{display:block;font:400 11px var(--body,Barlow),sans-serif;margin-top:5px;text-align:center;color:#94a3b8;text-transform:none;letter-spacing:0}
#headliner .hlx{position:absolute;top:6px;right:8px;background:none;border:0;color:#94a3b8;font-size:17px;cursor:pointer;line-height:1}#headliner .hlx:hover{color:#fff}`;
document.head.appendChild(st);}
