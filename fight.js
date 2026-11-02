'use strict';
/* ============ ALL IN — live arena fights for Sports Night ============
   The host (or the solo player) runs every fight. Other players send orders and see a 20-per-second stream.
   Controls are the main game's: click, double-click, drag-box, shift, right-click, A, S, H, Q, E/D/G, 1–9. */
const FB={x:150,y:78,w:900,h:452};          // the pitch, in board coordinates
const AF_DT=1/30,AF_MAX=75,AF_PUB=50;       // sim step, time limit, ms between network frames
const KIDX=Object.keys(UNITS),KOF={};KIDX.forEach((k,i)=>KOF[k]=i);
const fb36=n=>Math.max(0,Math.round(n)).toString(36);

/* ---------- building a fight ---------- */
function afCreate(gi,g,rosA,rosB,seed,ctrl){
  const rng=mulberry(seed),A={gi,g,t:0,nid:1,U:[],P:[],Z:[],fx:[],ev:[],evId:1,done:false,win:null,decree:[0,0],ctrl:ctrl.slice(),rng,aiT:[0,0],endT:0};
  const tv=r=>r.slice(0,6).reduce((a,[id,k,rk])=>a+unitVal(k,rk||0),0)||1,VA=tv(rosA),VB=tv(rosB),M=Math.sqrt(VA*VB);
  const hc=[Math.pow(M/VA,AR_HANDICAP)*Math.exp((rng()-.5)*.7),Math.pow(M/VB,AR_HANDICAP)*Math.exp((rng()-.5)*.7)];
  [rosA,rosB].forEach((ros,side)=>{const list=ros.slice(0,6);list.forEach(([rid,k,rk],i)=>{const n=list.length,col=i%2,row=Math.floor(i/2),rows=Math.ceil(n/2);
    const x=side?FB.x+FB.w-70-col*46:FB.x+70+col*46,y=FB.y+FB.h/2+(row-(rows-1)/2)*80+(col?20:-20);afUnit(A,k,side,rk||0,x,y,hc[side],{rid});});});
  A.hc=hc;for(const u of A.U){const foe=afCentroid(A,1-u.side);u.order={t:'amove',x:foe.x,y:u.y};}
  return A;}
function afUnit(A,k,side,rk,x,y,hc,o){const d=UNITS[k],sp=d.sp||{},m=(1+.15*rk)*hc;
  const u={id:A.nid++,k,def:d,side,rank:rk,x,y,r:d.r,hp:d.hp*m,maxHp:d.hp*m,dmg:d.dmg*m,armor:d.armor||0,cds:{},order:{t:'idle'},anchor:{x,y},target:null,face:side?-1:1,
    cd:A.rng()*.5,atk:0,aim:side?Math.PI:0,walk:0,bob:A.rng()*6,stunT:0,slowT:0,slow:0,curseT:0,fanT:0,infT:0,lockT:0,siegeP:0,siegeTo:false,jh:0,spawnT:0,flash:0,sumCd:3,healCd:2,ramp:1,dealt:0};
  if(o)Object.assign(u,o);A.U.push(u);return u;}
const afFoes=(A,side)=>A.U.filter(u=>!u.dead&&u.side!==side);
const afById=(A,id)=>A.U.find(u=>u.id===id);
function afCentroid(A,side){const us=A.U.filter(u=>!u.dead&&u.side===side);if(!us.length)return {x:FB.x+FB.w/2,y:FB.y+FB.h/2};return {x:us.reduce((a,u)=>a+u.x,0)/us.length,y:us.reduce((a,u)=>a+u.y,0)/us.length};}

/* ---------- events: drawn locally and sent to everyone watching ---------- */
function afEv(A,e){e.life=e.life||e.T||.4;e.max=e.life;A.fx.push(e);if(A.net){e.i=A.evId++;A.ev.push(e);if(A.ev.length>40)A.ev.shift();}}

/* ---------- stats and damage ---------- */
function afStat(A,u){const sp=u.def.sp||{};let dmg=u.dmg,rate=u.def.rate||1,range=u.def.range||20;
  if(A.U.some(o=>!o.dead&&o.side===u.side&&o.def.sp&&o.def.sp.kingAura))dmg*=1.3;
  if(A.U.some(o=>!o.dead&&o!==u&&o.side===u.side&&o.def.sp&&o.def.sp.aura&&Math.hypot(o.x-u.x,o.y-u.y)<150))dmg*=1.2;
  if(u.fanT>0)rate*=3;if(u.infT>0){rate*=2;range+=40;}if(u.siegeP>=1){range+=110;dmg*=1.8;}if(A.decree[u.side]>0)dmg*=1.5;
  return {dmg,rate,range,armor:u.armor+(u.lockT>0?12:0)};}
function afHurt(A,t,dmg,src,opt){if(!t||t.dead)return;opt=opt||{};let crit=false;
  if(t.curseT>0)dmg*=1.4;
  if(src&&src.def){const sp=src.def.sp||{};const luck=A.U.filter(o=>!o.dead&&o.side===src.side&&o.def.sp&&o.def.sp.luck).length*.12;
    if(sp.crit&&A.rng()<sp.crit){dmg*=sp.critX||2;crit=true;}else if(luck&&A.rng()<luck){dmg*=2;crit=true;}
    if(sp.execute&&t.hp/t.maxHp<sp.execute&&!t.temp){dmg=t.hp+999;afEv(A,{t:'txt',x:t.x,y:t.y-t.r-10,s:'WANTED',c:'#fbbf24'});}
    if(sp.curse){t.curseT=4;}if(sp.slow){t.slow=Math.max(t.slow,sp.slow);t.slowT=2;}if(sp.stun&&A.rng()<sp.stun*.6)t.stunT=Math.max(t.stunT,.5);}
  const arm=t.armor+(t.lockT>0?12:0);if(!opt.pierce)dmg=Math.max(dmg*.25,dmg-arm*1.5);
  t.hp-=dmg;t.flash=.12;if(src)src.dealt+=dmg;if(crit)afEv(A,{t:'txt',x:t.x,y:t.y-t.r-6,s:Math.round(dmg)+'!',c:'#fb7185'});
  if(t.hp<=0){const sp=t.def.sp||{};if(sp.rebirth&&!t.reborn){t.reborn=true;t.hp=t.maxHp*.6;afEv(A,{t:'ring',x:t.x,y:t.y,r0:10,r1:80,c:'#f97316'});afEv(A,{t:'txt',x:t.x,y:t.y-t.r-14,s:'Reborn!',c:'#fdba74'});return;}
    t.dead=true;afEv(A,{t:'die',x:t.x,y:t.y,k:t.k,f:t.face,life:.6});}}
function afSplash(A,x,y,rad,dmg,src,col,opt){for(const e of afFoes(A,src.side)){const d=Math.hypot(e.x-x,e.y-y);if(d<=rad+e.r){if(opt&&opt.stun&&A.rng()<opt.stun)e.stunT=Math.max(e.stunT,.6);afHurt(A,e,dmg*(1-.4*clamp(d/rad,0,1)),src);}}
  afEv(A,{t:'boom',x,y,r:rad,c:col||'#ffb020',life:.4});}
function afNearest(A,u,rad){let best=null,bd=1e9,taunt=null,td=1e9;
  for(const e of A.U){if(e.dead||e.side===u.side||e.jh>4)continue;const d=Math.hypot(e.x-u.x,e.y-u.y)-e.r;
    const tr=(e.def.sp&&e.def.sp.taunt||0)+(e.lockT>0?180:0);if(tr&&d<tr&&d<td){td=d;taunt=e;}
    if(d<rad&&d<bd){bd=d;best=e;}}
  return taunt||best;}
const afInReach=(u,e,st)=>Math.hypot(e.x-u.x,e.y-u.y)-e.r<=st.range+2;
function afStep1(A,u,tx,ty,dt){const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy);if(d<2)return true;const sp=(u.def.spd||60)*(u.slowT>0?1-u.slow:1)*dt,m=Math.min(d,sp);u.x+=dx/d*m;u.y+=dy/d*m;u.walk+=m;u.face=dx>=0?1:-1;return d<=sp;}

/* ---------- one creature, one tick ---------- */
function afTickUnit(A,u,dt){const sp=u.def.sp||{};
  for(const k in u.cds)u.cds[k]-=dt;if(u.fanT>0)u.fanT-=dt;if(u.infT>0)u.infT-=dt;if(u.lockT>0)u.lockT-=dt;if(u.curseT>0)u.curseT-=dt;if(u.slowT>0)u.slowT-=dt;else u.slow=0;
  u.atk=Math.max(0,u.atk-dt*4);u.cd-=dt;if(u.flash>0)u.flash-=dt;
  if(u.temp&&A.t>u.expire){u.dead=true;afEv(A,{t:'die',x:u.x,y:u.y,k:u.k,f:u.face,life:.4});return;}
  if(u.stunT>0){u.stunT-=dt;return;}
  if(u.jump){const j=u.jump;j.t+=dt;const k=Math.min(1,j.t/j.T);u.x=j.sx+(j.tx-j.sx)*k;u.y=j.sy+(j.ty-j.sy)*k;u.jh=Math.sin(k*Math.PI)*42;
    if(k>=1){u.jump=null;u.jh=0;for(const e of afFoes(A,u.side))if(Math.hypot(e.x-u.x,e.y-u.y)<52+e.r){e.stunT=Math.max(e.stunT,.8);afHurt(A,e,j.dmg,u);}afEv(A,{t:'ring',x:u.x,y:u.y,r0:8,r1:52,c:'#fde68a'});u.anchor={x:u.x,y:u.y};}return;}
  // powers
  if(sp.heal){u.healCd-=dt;if(u.healCd<=0){u.healCd=2.5;let n=0;for(const o of A.U)if(!o.dead&&o.side===u.side&&o.hp<o.maxHp&&Math.hypot(o.x-u.x,o.y-u.y)<150){o.hp=Math.min(o.maxHp,o.hp+o.maxHp*.07);n++;}if(n)afEv(A,{t:'ring',x:u.x,y:u.y,r0:8,r1:150,c:'rgba(74,222,128,.8)'});}}
  if(sp.summon){u.sumCd-=dt;if(u.sumCd<=0&&afNearest(A,u,300)){u.sumCd=sp.sumCd||10;const SK=typeof sp.summon==='string'?sp.summon:'m_bouncer';for(let k=0;k<(sp.sumN||2);k++){const b=afUnit(A,SK,u.side,0,u.x+(A.rng()-.5)*40,u.y+(A.rng()-.5)*40,A.hc[u.side],{temp:true,expire:A.t+(sp.sumLife||12)});b.order={t:'amove',x:afCentroid(A,1-u.side).x,y:b.y};}
    afEv(A,{t:'txt',x:u.x,y:u.y-u.r-14,s:SK==='m_dog'?"And they're off!":'Bouncers!',c:'#fde68a'});}}
  // siege
  {const tp=u.siegeTo?1:0;if(u.siegeP!==tp){u.siegeP=clamp(u.siegeP+(tp?1:-1)*dt/1.1,0,1);return;}}
  const sieged=u.siegeP>=1,st=afStat(A,u),aggro=Math.max(st.range+60,130),o=u.order;
  if(sieged&&(o.t==='move'||o.t==='amove')){u.siegeTo=false;return;}
  let tgt=null;
  switch(o.t){
    case 'move':if(afStep1(A,u,o.x,o.y,dt)){u.order={t:'idle'};u.anchor={x:u.x,y:u.y};}return;
    case 'cast':{const e=o.e!=null?afById(A,o.e):null;if(o.e!=null&&(!e||e.dead)){u.order={t:'idle'};u.anchor={x:u.x,y:u.y};return;}const tx=e?e.x:o.x,ty=e?e.y:o.y,d=Math.hypot(tx-u.x,ty-u.y);
      const cr=o.ab==='pounce'?230:o.ab==='deadshot'?st.range+80:Math.max(160,st.range+40);
      if(d<=cr){u.face=tx>u.x?1:-1;u.aim=Math.atan2(ty-u.y,tx-u.x);afDoAbility(A,u,o.ab,{x:tx,y:ty,e});if(u.order===o){u.order={t:'idle'};u.anchor={x:u.x,y:u.y};}return;}
      if(sieged){u.order={t:'idle'};return;}afStep1(A,u,tx,ty,dt);return;}
    case 'attack':tgt=afById(A,o.e);if(!tgt||tgt.dead){u.order={t:'idle'};u.anchor={x:u.x,y:u.y};return;}break;
    case 'hold':tgt=(u.target&&!u.target.dead&&afInReach(u,u.target,st))?u.target:afNearest(A,u,st.range);if(!tgt||!afInReach(u,tgt,st))return;break;
    case 'amove':tgt=(u.target&&!u.target.dead&&Math.hypot(u.target.x-u.x,u.target.y-u.y)<aggro+40)?u.target:afNearest(A,u,aggro);
      if(!tgt){u.target=null;if(afStep1(A,u,o.x,o.y,dt)){u.order={t:'idle'};u.anchor={x:u.x,y:u.y};}return;}break;
    default:{if(sieged){tgt=afNearest(A,u,st.range);if(!tgt)return;break;}
      const leash=Math.hypot(u.x-u.anchor.x,u.y-u.anchor.y);tgt=(u.target&&!u.target.dead&&leash<220)?u.target:(leash<180?afNearest(A,u,aggro):null);
      if(!tgt){u.target=null;if(leash>6)afStep1(A,u,u.anchor.x,u.anchor.y,dt);return;}}
  }
  u.target=tgt;
  if(afInReach(u,tgt,st)){u.face=tgt.x>=u.x?1:-1;u.aim=Math.atan2(tgt.y-u.y,tgt.x-u.x);if(u.cd<=0){afAttack(A,u,tgt,st);u.cd=1/st.rate;}}
  else if(o.t!=='hold'&&!sieged)afStep1(A,u,tgt.x,tgt.y,dt);}

/* ---------- attacks, one style per kind ---------- */
function afShot(A,u,t,o){const p=Object.assign({sx:u.x,sy:u.y-u.r*.6,x:u.x,y:u.y-u.r*.6,tg:t.id,tx:t.x,ty:t.y,el:0,src:u},o);p.T=p.T||Math.max(.08,Math.hypot(t.x-u.x,t.y-u.y)/(p.spd||520));A.P.push(p);
  afEv(A,{t:'shot',sx:p.sx,sy:p.sy,tx:p.tx,ty:p.ty,T:p.T,st:p.st||'b',c:p.c||u.def.look.beam||u.def.look.c2||'#fde68a',lob:p.lob?1:0,life:p.T,dl:p.delay||0});}
function afAttack(A,u,t,st){const d=u.def,sp=d.sp||{},kind=d.kind,col=d.look.beam||(d.look.c2&&d.look.c2.length===7?d.look.c2:'#fde68a');u.atk=1;
  if(kind==='melee'){afHurt(A,t,st.dmg,u);if(sp.cleave)for(const e of afFoes(A,u.side))if(e!==t&&Math.hypot(e.x-t.x,e.y-t.y)<sp.cleave+e.r)afHurt(A,e,st.dmg*.6,u);
    if(sp.throw){t.stunT=Math.max(t.stunT,.8);t.x+=Math.cos(u.aim)*40;t.y+=Math.sin(u.aim)*40;}afEv(A,{t:'slash',x:t.x,y:t.y,a:u.aim,life:.2});return;}
  if(kind==='roll'){const a=u.aim,L=Math.min(st.range+30,Math.hypot(t.x-u.x,t.y-u.y)+45),ex=u.x+Math.cos(a)*L,ey=u.y+Math.sin(a)*L;
    for(const e of afFoes(A,u.side))if(segDist(e.x,e.y,u.x,u.y,ex,ey)<=e.r+16){afHurt(A,e,st.dmg,u);e.x+=Math.cos(a+1.2)*10;e.y+=Math.sin(a+1.2)*10;}
    u.rollAt=G.time;u.rollA=a;u.rollD=L;afEv(A,{t:'roll',id:u.id,a,d:L,life:.55});return;}
  if(kind==='chain'){const hit=new Set([t]),pts=[[u.x,u.y-u.r*.5],[t.x,t.y]];let cur=t,dm=st.dmg;afHurt(A,t,dm,u);
    for(let k=0;k<(sp.chains||3);k++){let nx=null,nd=120;for(const e of afFoes(A,u.side)){if(hit.has(e))continue;const dd=Math.hypot(e.x-cur.x,e.y-cur.y);if(dd<nd){nd=dd;nx=e;}}if(!nx)break;hit.add(nx);dm*=.85;afHurt(A,nx,dm,u);pts.push([nx.x,nx.y]);cur=nx;}
    afEv(A,{t:'chain',pts:pts.map(p=>[Math.round(p[0]),Math.round(p[1])]),c:col,life:.18});return;}
  if(kind==='beam'){u.ramp=u.beamOn===t.id?Math.min(4,u.ramp+.12):1;u.beamOn=t.id;afHurt(A,t,st.dmg*u.ramp,u);afEv(A,{t:'line',x1:u.x,y1:u.y-u.r*.9,x2:t.x,y2:t.y,c:u.ramp>3?'#ffffff':col,w:2+u.ramp,life:.13});return;}
  if(kind==='cone'){const a=u.aim;for(const e of afFoes(A,u.side)){const dx=e.x-u.x,dy=e.y-u.y,dd=Math.hypot(dx,dy);if(dd-e.r>st.range)continue;let da=Math.atan2(dy,dx)-a;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)<.55)afHurt(A,e,st.dmg,u);}
    afEv(A,{t:'cone',x:u.x,y:u.y-u.r*.4,a,r:st.range,c:col,life:.3});return;}
  if(kind==='pierce'){const a=u.aim,L=st.range+40,ex=u.x+Math.cos(a)*L,ey=u.y+Math.sin(a)*L;for(const e of afFoes(A,u.side))if(segDist(e.x,e.y,u.x,u.y,ex,ey)<=e.r+8)afHurt(A,e,st.dmg,u);
    afEv(A,{t:'line',x1:u.x,y1:u.y-u.r*.5,x2:ex,y2:ey,c:col,w:3,life:.18});return;}
  if(kind==='artillery'){const n=sp.shells||1;for(let k=0;k<n;k++){const a=A.rng()*TAU,dd=k?A.rng()*40:0;afShot(A,u,t,{lob:1,spd:300,T:.7+k*.06,tx:t.x+Math.cos(a)*dd,ty:t.y+Math.sin(a)*dd,splash:sp.splash||50,dmg:st.dmg,st:'shell',stun:sp.stun});}return;}
  if(kind==='aoe'){afShot(A,u,t,{spd:340,splash:sp.splash||40,dmg:st.dmg,st:'orb',stun:sp.stun});return;}
  // ranged: several shots and several targets
  const tg=[t];if(sp.targets>1){for(const e of afFoes(A,u.side).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))){if(tg.length>=sp.targets)break;if(e!==t&&Math.hypot(e.x-u.x,e.y-u.y)-e.r<=st.range)tg.push(e);}}
  for(const e of tg)for(let s=0;s<(sp.shots||1);s++)afShot(A,u,e,{dmg:st.dmg,home:1,st:'b',delay:s*.09});}

/* ---------- abilities ---------- */
function afDoAbility(A,u,ab,tgt){const Ab=ABIL[ab],st=afStat(A,u);u.cds[ab]=Ab.cd;u.atk=1;
  const near=(x,y,r)=>afFoes(A,u.side).filter(e=>Math.hypot(e.x-x,e.y-y)<=r+e.r);
  switch(ab){
    case 'fan':u.fanT=3;afEv(A,{t:'ring',x:u.x,y:u.y,r0:6,r1:34,c:'#ffb020'});break;
    case 'inferno':u.infT=3;afEv(A,{t:'ring',x:u.x,y:u.y,r0:8,r1:50,c:'#fb923c'});break;
    case 'lockdown':u.lockT=5;afEv(A,{t:'ring',x:u.x,y:u.y,r0:u.r,r1:180,c:'#fbbf24',life:.6});break;
    case 'haymaker':{const R2=Ab.rad*(u.r>13?1.3:1);for(const e of near(u.x,u.y,R2)){e.stunT=Math.max(e.stunT,1.5);afHurt(A,e,st.dmg*2,u);}afEv(A,{t:'ring',x:u.x,y:u.y,r0:8,r1:R2,c:'#fde68a',life:.5});break;}
    case 'jackpot':{const e=afNearest(A,u,st.range+80),x=e?e.x:u.x+u.face*60,y=e?e.y:u.y;afSplash(A,x,y,95,st.dmg*8,u,'#fde68a');afEv(A,{t:'txt',x,y:y-30,s:'JACKPOT!',c:'#ffd27a'});break;}
    case 'fanknives':{const L=st.range+20;for(let k=0;k<10;k++){const a=k/10*TAU,ex=u.x+Math.cos(a)*L,ey=u.y+Math.sin(a)*L;for(const e of afFoes(A,u.side))if(segDist(e.x,e.y,u.x,u.y,ex,ey)<=e.r+6)afHurt(A,e,st.dmg,u);afEv(A,{t:'line',x1:u.x,y1:u.y,x2:ex,y2:ey,c:'#e2e8f0',w:2,life:.3});}break;}
    case 'decree':A.decree[u.side]=6;afEv(A,{t:'ring',x:u.x,y:u.y,r0:10,r1:420,c:'#fbbf24',life:1});break;
    case 'storm':case 'thunder':{const z={k:ab,x:tgt.x,y:tgt.y,r:Ab.rad,t:ab==='storm'?3:4,tick:0,dmg:st.dmg*(ab==='storm'?.55:.7),src:u};A.Z.push(z);afEv(A,{t:'zone',x:z.x,y:z.y,r:z.r,k:ab,life:z.t});break;}
    case 'lullaby':for(const e of near(tgt.x,tgt.y,Ab.rad))e.stunT=Math.max(e.stunT,2.5);afEv(A,{t:'ring',x:tgt.x,y:tgt.y,r0:10,r1:Ab.rad,c:'#f9a8d4',life:1});afEv(A,{t:'txt',x:tgt.x,y:tgt.y-20,s:'zzz',c:'#f9a8d4'});break;
    case 'barrage':case 'salvo':case 'frag':{const sm=ab==='frag';for(let k=0;k<Ab.n;k++){const a=A.rng()*TAU,d=Math.sqrt(A.rng())*Ab.rad;const p={sx:u.x,sy:u.y-u.r,x:u.x,y:u.y,tx:tgt.x+Math.cos(a)*d,ty:tgt.y+Math.sin(a)*d,T:.6+k*.05,el:0,lob:1,splash:sm?36:42,dmg:st.dmg*(sm?1.4:.9),src:u,st:'shell',delay:k*.12};A.P.push(p);
        afEv(A,{t:'shot',sx:p.sx,sy:p.sy,tx:p.tx,ty:p.ty,T:p.T,st:'shell',c:'#ffb020',lob:1,dl:p.delay,life:p.T});}break;}
    case 'deadshot':{const e=tgt.e;if(e){u.snipe={e:e.id,t:0};afEv(A,{t:'line',x1:u.x,y1:u.y,x2:e.x,y2:e.y,c:'rgba(255,59,90,.6)',w:1,life:.9});}break;}
    case 'pounce':{const e=tgt.e;u.jump={sx:u.x,sy:u.y,tx:e?e.x:tgt.x,ty:e?e.y:tgt.y,t:0,T:.45,dmg:st.dmg*3};u.order={t:'idle'};break;}
  }}
function afCast(A,ab,units,tgt){const Ab=ABIL[ab],c=units.filter(u=>!u.dead&&u.def.ab===ab&&!u.jump);if(!c.length)return false;
  if(Ab.type==='toggle'){const on=c.some(u=>!u.siegeTo);for(const u of c){u.siegeTo=on;u.order={t:'idle'};u.anchor={x:u.x,y:u.y};}return true;}
  const ready=c.filter(u=>!(u.cds[ab]>0));if(!ready.length)return false;
  if(Ab.type==='self'){for(const u of ready)afDoAbility(A,u,ab,null);return true;}
  let best=null,bd=1e9;for(const u of ready){const d=Math.hypot(u.x-tgt.x,u.y-tgt.y);if(d<bd){bd=d;best=u;}}
  best.order={t:'cast',ab,x:tgt.x,y:tgt.y,e:tgt.e!=null?tgt.e:null};return true;}

/* ---------- the computer's side ---------- */
function afAI(A,side){const mine=A.U.filter(u=>!u.dead&&u.side===side),foes=afFoes(A,side);if(!foes.length)return;
  for(const u of mine){if(u.jump||u.order.t==='cast')continue;
    const ab=u.def.ab;if(ab&&!(u.cds[ab]>0)){const Ab=ABIL[ab],st=afStat(A,u),near=afNearest(A,u,st.range+40);
      if(Ab.type==='toggle'){if(near&&!u.siegeTo&&Math.hypot(near.x-u.x,near.y-u.y)<st.range+100)u.siegeTo=true;else if(!afNearest(A,u,st.range+160)&&u.siegeTo)u.siegeTo=false;}
      else if(Ab.type==='self'){if(near)afDoAbility(A,u,ab,null);}
      else if(Ab.type==='area'){let best=null,bn=1;for(const e of foes){const n=foes.filter(o=>Math.hypot(o.x-e.x,o.y-e.y)<Ab.rad).length;if(n>bn&&Math.hypot(e.x-u.x,e.y-u.y)<300){bn=n;best=e;}}if(best)u.order={t:'cast',ab,x:best.x,y:best.y,e:null};}
      else if(Ab.type==='enemy'){const e=foes.filter(o=>Math.hypot(o.x-u.x,o.y-u.y)<320).sort((a,b)=>b.hp-a.hp)[0];if(e)u.order={t:'cast',ab,x:e.x,y:e.y,e:e.id};}}
    if(u.order.t==='idle'&&!afNearest(A,u,Math.max(afStat(A,u).range+60,130))&&!u.siegeTo){let n=null,nd=1e9;for(const e of foes){const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<nd){nd=d;n=e;}}if(n)u.order={t:'amove',x:n.x,y:n.y};}}}

/* ---------- the whole fight, one tick ---------- */
function afTick(A,dt){if(A.done){A.endT+=dt;afFxTick(A,dt);return;}A.t+=dt;
  for(let s=0;s<2;s++){if(A.decree[s]>0)A.decree[s]-=dt;if(A.ctrl[s]==='ai'){A.aiT[s]-=dt;if(A.aiT[s]<=0){A.aiT[s]=.45;afAI(A,s);}}}
  for(const u of A.U)if(!u.dead)afTickUnit(A,u,dt);
  // snipes
  for(const u of A.U){if(!u.snipe||u.dead)continue;u.snipe.t+=dt;if(u.snipe.t>=.9){const e=afById(A,u.snipe.e);if(e&&!e.dead){afHurt(A,e,afStat(A,u).dmg*6,u,{pierce:1});afEv(A,{t:'line',x1:u.x,y1:u.y-u.r*.6,x2:e.x,y2:e.y,c:'#fff',w:3,life:.2});}u.snipe=null;}}
  // projectiles
  for(const p of A.P){if(p.delay>0){p.delay-=dt;continue;}p.el+=dt;const t=p.home?afById(A,p.tg):null;if(t&&!t.dead){p.tx=t.x;p.ty=t.y;}
    if(p.el>=p.T){p.done=true;if(p.splash)afSplash(A,p.tx,p.ty,p.splash,p.dmg,p.src,p.st==='shell'?'#ffb020':null,{stun:p.stun});else if(t&&!t.dead)afHurt(A,t,p.dmg,p.src);}}
  A.P=A.P.filter(p=>!p.done);
  // zones
  for(const z of A.Z){z.t-=dt;z.tick-=dt;if(z.tick<=0){z.tick=z.k==='storm'?.25:.16;const ins=afFoes(A,z.src.side).filter(e=>Math.hypot(e.x-z.x,e.y-z.y)<=z.r+e.r);
      if(z.k==='storm')for(const e of ins){afHurt(A,e,z.dmg,z.src);e.slow=Math.max(e.slow,.25);e.slowT=.6;}
      else if(ins.length){const e=ins[(A.rng()*ins.length)|0];afHurt(A,e,z.dmg*1.6,z.src);afEv(A,{t:'line',x1:e.x+(A.rng()-.5)*20,y1:e.y-140,x2:e.x,y2:e.y,c:'#e0f2fe',w:2,life:.15});}}}
  A.Z=A.Z.filter(z=>z.t>0);
  // keep them apart and on the pitch
  const U=A.U;for(let i=0;i<U.length;i++){const a=U[i];if(a.dead||a.jump)continue;for(let j=i+1;j<U.length;j++){const b=U[j];if(b.dead||b.jump)continue;const dx=b.x-a.x,dy=b.y-a.y,min=(a.r+b.r)*.8,d2=dx*dx+dy*dy;
      if(d2<min*min&&d2>.01){const d=Math.sqrt(d2),ov=(min-d),wa=b.r*b.r/(a.r*a.r+b.r*b.r);a.x-=dx/d*ov*wa;a.y-=dy/d*ov*wa;b.x+=dx/d*ov*(1-wa);b.y+=dy/d*ov*(1-wa);}}
    a.x=clamp(a.x,FB.x+a.r,FB.x+FB.w-a.r);a.y=clamp(a.y,FB.y+a.r,FB.y+FB.h-a.r);}
  afFxTick(A,dt);
  const alive=s=>U.some(u=>!u.dead&&!u.temp&&u.side===s);const a0=alive(0),a1=alive(1);
  if(!a0||!a1||A.t>=AF_MAX){A.done=true;if(a0&&!a1)A.win=0;else if(a1&&!a0)A.win=1;else{const f=s=>U.filter(u=>u.side===s&&!u.temp).reduce((a,u)=>a+Math.max(0,u.hp)/u.maxHp,0);A.win=f(0)>=f(1)?0:1;}
    afEv(A,{t:'end',w:A.win,life:99});}}
function afFxTick(A,dt){for(const f of A.fx){if(f.dl>0){f.dl-=dt;continue;}f.life-=dt;}A.fx=A.fx.filter(f=>f.life>0);}
// a whole fight with the computer on both sides, for the odds
function afRun(rosA,rosB,seed){if(!rosA.length&&!rosB.length)return {win:seed%2,t:1};if(!rosA.length)return {win:1,t:1};if(!rosB.length)return {win:0,t:1};
  const A=afCreate(0,null,rosA,rosB,seed,['ai','ai']);let n=0;while(!A.done&&n++<AF_MAX*15)afTick(A,1/15);return {win:A.win,t:A.t};}
function afOdds(rosA,rosB){let wa=0;const N=12;for(let k=0;k<N;k++)if(afRun(rosA,rosB,9001+k*7919).win===0)wa++;const pa=clamp((wa+1)/(N+2),.1,.9);
  return {pa,oa:Math.max(1.05,Math.round(.92/pa*10)/10),ob:Math.max(1.05,Math.round(.92/(1-pa)*10)/10)};}

/* ---------- orders: the same verbs as the main game ---------- */
function afApply(A,side,o){if(!A||A.done)return;const us=(o.ids||[]).map(id=>afById(A,id)).filter(u=>u&&!u.dead&&u.side===side&&!u.jump);if(!us.length)return;
  if(o.t==='move'||o.t==='amove'){const pts=formation(us.length,o.x,o.y);us.slice().sort((a,b)=>Math.hypot(a.x-o.x,a.y-o.y)-Math.hypot(b.x-o.x,b.y-o.y)).forEach((u,i)=>{u.order={t:o.t,x:pts[i][0],y:pts[i][1]};u.anchor={x:pts[i][0],y:pts[i][1]};u.target=null;});}
  else if(o.t==='attack'){const e=afById(A,o.e);if(e&&!e.dead&&e.side!==side)for(const u of us){u.order={t:'attack',e:e.id};u.target=e;}}
  else if(o.t==='stop')for(const u of us){u.order={t:'idle'};u.anchor={x:u.x,y:u.y};u.target=null;}
  else if(o.t==='hold')for(const u of us){u.order={t:'hold'};u.anchor={x:u.x,y:u.y};u.target=null;}
  else if(o.t==='ab'){const e=o.e!=null?afById(A,o.e):null;afCast(A,o.ab,us,{x:e?e.x:o.x,y:e?e.y:o.y,e:e?e.id:null});}}

/* ======================= the local player's view and controls ======================= */
const AFV={on:false,gi:-1,side:0,sel:[],mode:null,groups:{},marks:[],drag:null,last:{t:0,k:null},inspect:null,seq:0,sent:[],pred:{},watch:-1};
function afArenas(){return !G.mp||NET.host?(AFH&&AFH.A):(AFC&&AFC.A);}
function afMyArena(){const L=afArenas();return L&&AFV.gi>=0?L[AFV.gi]:null;}
function afViewArena(){const L=afArenas();if(!L)return null;return AFV.watch>=0?L[AFV.watch]:afMyArena();}
function afMine(u){return AFV.gi>=0&&u.side===AFV.side&&AFV.watch<0;}
// orders from this player: applied at once by the authority, or sent to the host and predicted
function afSend(o){const A=afMyArena();if(!A)return;o.ids=o.ids||AFV.sel.map(u=>u.id);
  if(!G.mp||NET.host){afApply(A,AFV.side,o);return;}
  o.s=++AFV.seq;o.g=AFV.gi;AFV.sent.push(o);if(AFV.sent.length>12)AFV.sent.shift();afPubOrders();
  if(o.t==='move'||o.t==='amove'){const pts=formation(o.ids.length,o.x,o.y);o.ids.forEach((id,i)=>{AFV.pred[id]={x:pts[i][0],y:pts[i][1],until:performance.now()+450};});}
  else for(const id of o.ids)delete AFV.pred[id];}
function afPubOrders(){const R=NET.ar||NET.r;if(!R)return;const list=AFV.sent.map(o=>[o.s,o.g,o.t,o.ids.join('.'),Math.round(o.x||0),Math.round(o.y||0),o.e==null?'':o.e,o.ab||'']);R.presence({ao:{w:NET.SBS&&NET.SBS.w,l:list}}).catch(()=>{});}

function afBoardPos(ev){const r=cv.getBoundingClientRect();return {x:(ev.clientX-r.left)/r.width*W,y:(ev.clientY-r.top)/r.height*H};}
function afUnitAt(A,x,y,own){let best=null,bd=1e9;for(const u of A.U){if(u.dead)continue;if(own!=null&&(u.side===AFV.side)!==own)continue;const d=Math.hypot(u.x-x,u.y-(y+(u.jh||0)));if(d<u.r*1.25+6&&d<bd){bd=d;best=u;}}return best;}
function afSetSel(list){AFV.sel=list;AFV.inspect=null;afRefresh(true);}
function afMode(m){AFV.mode=m;afRefresh(true);}
function afPointerDown(ev){if(!afViewing())return;ev.stopImmediatePropagation();Snd.init();const A=afViewArena();if(!A)return;const p=afBoardPos(ev);
  if(AFV.watch>=0||A.done)return;
  if(ev.button===2){ev.preventDefault();if(AFV.mode){afMode(null);return;}if(!AFV.sel.length)return;const e=afUnitAt(A,p.x,p.y,false);if(e)afSend({t:'attack',e:e.id});else afSend({t:'move',x:p.x,y:p.y});
    AFV.marks.push({x:e?e.x:p.x,y:e?e.y:p.y,t:.6,col:e?'#f87171':'#4ade80'});Snd.play(e?'attack':'click');return;}
  if(ev.button!==0)return;
  if(AFV.mode&&AFV.mode.ab){const ab=AFV.mode.ab,Ab=ABIL[ab],e=afUnitAt(A,p.x,p.y,false);if(Ab.type==='enemy'&&!e){toast('Pick an enemy');Snd.play('error');return;}
    afSend({t:'ab',ab,x:e?e.x:p.x,y:e?e.y:p.y,e:Ab.type==='enemy'&&e?e.id:null});AFV.marks.push({x:p.x,y:p.y,t:.6,col:'#c084fc'});Snd.play('click');if(!ev.shiftKey)afMode(null);return;}
  if(AFV.mode==='amove'){const e=afUnitAt(A,p.x,p.y,false);if(e)afSend({t:'attack',e:e.id});else afSend({t:'amove',x:p.x,y:p.y});AFV.marks.push({x:p.x,y:p.y,t:.6,col:'#f87171'});Snd.play('attack');if(!ev.shiftKey)afMode(null);return;}
  AFV.drag={x0:p.x,y0:p.y,x1:p.x,y1:p.y,box:false,shift:ev.shiftKey};try{cv.setPointerCapture(ev.pointerId);}catch(e){}}
function afPointerMove(ev){if(!afViewing())return;ev.stopImmediatePropagation();const p=afBoardPos(ev);AFV.hover=p;const d=AFV.drag;if(d){d.x1=p.x;d.y1=p.y;if(Math.hypot(d.x1-d.x0,d.y1-d.y0)>6)d.box=true;}}
function afPointerUp(ev){if(!afViewing())return;ev.stopImmediatePropagation();const A=afViewArena(),d=AFV.drag;AFV.drag=null;if(!d||!A)return;let picked=[];
  const own=A.U.filter(u=>!u.dead&&u.side===AFV.side);
  if(d.box){const x0=Math.min(d.x0,d.x1),x1=Math.max(d.x0,d.x1),y0=Math.min(d.y0,d.y1),y1=Math.max(d.y0,d.y1);picked=own.filter(u=>u.x>=x0-u.r&&u.x<=x1+u.r&&u.y>=y0-u.r&&u.y<=y1+u.r);}
  else{const u=afUnitAt(A,d.x0,d.y0,true);if(u){const now=performance.now();picked=now-AFV.last.t<320&&AFV.last.k===u.k?own.filter(o=>o.k===u.k):[u];AFV.last={t:now,k:u.k};}
    else if(!d.shift){const e=afUnitAt(A,d.x0,d.y0,false);if(e){AFV.sel=[];AFV.inspect=e;Snd.play('click');afRefresh(true);return;}}}
  if(d.shift){const s=AFV.sel.slice();for(const u of picked){const i=s.indexOf(u);if(i>=0&&!d.box)s.splice(i,1);else if(i<0)s.push(u);}AFV.sel=s;}else AFV.sel=picked;
  AFV.inspect=null;if(picked.length)Snd.play(selSound(picked[0]));afRefresh(true);}
function afKey(ev){if(!afViewing())return;if(ev.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName))return;const k=ev.key.toLowerCase();
  const pass=['l','j','t','/','escape'];if(k==='escape'&&!AFV.mode&&!AFV.sel.length&&!AFV.inspect)return;
  if(pass.includes(k)&&k!=='escape')return;ev.stopImmediatePropagation();
  const A=afMyArena();if(!A||A.done)return;const own=A.U.filter(u=>!u.dead&&u.side===AFV.side);
  if(/^[1-9]$/.test(k)){const n=+k;if(ev.ctrlKey||ev.metaKey){ev.preventDefault();AFV.groups[n]=AFV.sel.map(u=>u.id);toast('Group '+n+' saved');}else if(AFV.groups[n]){afSetSel(own.filter(u=>AFV.groups[n].includes(u.id)));}return;}
  if(ev.ctrlKey||ev.metaKey)return;
  if(k==='escape'){if(AFV.mode)afMode(null);else if(AFV.inspect){AFV.inspect=null;afRefresh(true);}else afSetSel([]);return;}
  const ai={e:0,d:1,g:2}[k];if(ai!=null){afAbilitySlot(ai);return;}
  afCmd({a:'amove',s:'stop',h:'hold',q:'all'}[k]);}
function afCmd(c){const A=afMyArena();if(!c||!A||A.done)return;Snd.init();
  if(c==='all'){afSetSel(A.U.filter(u=>!u.dead&&u.side===AFV.side));if(AFV.sel.length)Snd.play(selSound(AFV.sel[0]));return;}
  if(!AFV.sel.length)return;
  if(c==='amove'){afMode(AFV.mode==='amove'?null:'amove');return;}
  if(c==='stop'||c==='hold'){afSend({t:c});Snd.play('click');}}
function afAbilities(){const out=[];for(const u of AFV.sel){const a=u.def.ab;if(a&&!out.includes(a))out.push(a);}return out.slice(0,3);}
function afAbilitySlot(i){const ab=afAbilities()[i];if(!ab)return;const Ab=ABIL[ab];
  if(Ab.type==='self'||Ab.type==='toggle'){afSend({t:'ab',ab});Snd.play(Ab.type==='toggle'?'siege':'click');afRefresh(true);return;}
  if(!AFV.sel.some(u=>u.def.ab===ab&&!(u.cds[ab]>0))){toast(Ab.name+' is recharging');Snd.play('error');return;}
  afMode({ab});}

/* the command card and the info pane, in the main game's style */
let afPaneSig='';
function afRefresh(force){const A=afMyArena();if(!A||!afViewing())return;AFV.sel=AFV.sel.filter(u=>!u.dead&&A.U.includes(u));
  const cmdEl=$('#afCmd');if(cmdEl){const abs=afAbilities();const slots=[['amove','amove','A','Attack-move','Move, fighting anything on the way'],['stop','stop','S','Stop','Stop and guard this spot'],['hold','hold','H','Hold position','Never move, only fire in range'],null,['all','all','Q','Select army','Select every creature'],null,null,null,null,null,'ab0','ab1','ab2',null,null];
    const sig=JSON.stringify([abs,AFV.sel.length,AFV.mode&&(AFV.mode.ab||AFV.mode),abs.map(ab=>{const us=AFV.sel.filter(u=>u.def.ab===ab);return Math.ceil(Math.min(...us.map(u=>Math.max(0,u.cds[ab]||0))));}),AFV.sel.some(u=>u.siegeTo)]);
    if(force||cmdEl.dataset.sig!==sig){cmdEl.dataset.sig=sig;
      cmdEl.innerHTML=slots.map(s=>{if(!s)return '<div class="slot empty"></div>';
        if(typeof s==='string'){const i=+s[2],ab=abs[i];if(!ab)return `<button class="slot abs empty" disabled><span class="ii"></span><span class="key">${AB_KEYS[i]}</span></button>`;const Ab=ABIL[ab],us=AFV.sel.filter(u=>u.def.ab===ab),cd=Math.min(...us.map(u=>Math.max(0,u.cds[ab]||0))),p=cd>0?cd/Ab.cd:0;
          return `<button class="slot abs ${AFV.mode&&AFV.mode.ab===ab?'lit':''} ${Ab.type==='toggle'&&us.some(u=>u.siegeTo)?'lit':''}" data-afab="${i}" data-tip="${Ab.name} (${AB_KEYS[i]})|${Ab.desc}" style="--p:${p}"><span class="ii">${icon(Ab.icon)}</span><span class="key">${AB_KEYS[i]}</span><span class="cdv"></span><span class="cdn">${cd>0?Math.ceil(cd):''}</span></button>`;}
        const [k,ic,key,name,desc]=s;return `<button class="slot ${AFV.mode===k?'lit':''}" data-afc="${k}" data-tip="${name} (${key})|${desc}" ${k!=='all'&&!AFV.sel.length?'disabled':''}>${icon(ic)}<span class="key">${key}</span></button>`;}).join('');
      cmdEl.querySelectorAll('[data-afc]').forEach(b=>b.addEventListener('click',()=>afCmd(b.dataset.afc)));cmdEl.querySelectorAll('[data-afab]').forEach(b=>b.addEventListener('click',()=>afAbilitySlot(+b.dataset.afab)));
      cmdEl.querySelectorAll('[data-tip]').forEach(n=>{n.addEventListener('pointerenter',e=>showTip(n.dataset.tip,e.clientX,e.clientY));n.addEventListener('pointerleave',hideTip);});}}
  const pane=$('#afPane');if(!pane)return;const s=AFV.sel,ins=AFV.inspect&&!AFV.inspect.dead?AFV.inspect:null;
  const sig=(ins?'i'+ins.id:'')+'|'+s.map(u=>u.id).join(',');
  if(force||sig!==afPaneSig){afPaneSig=sig;
    if(ins||s.length===1){const u=ins||s[0],d=u.def,foe=u.side!==AFV.side;
      pane.innerHTML=`<div class="ph"><canvas class="por big" data-k="${u.k}"></canvas><div class="pmain"><div class="pname">${esc(d.name)}${u.rank?' · '+RANK_NAME[u.rank]:''}</div><div class="porig ${foe?'foe':''}">${foe?esc(sbName(A.g[u.side?'b':'a']))+"'s team":'Your team'}${u.temp?' · temporary':''}</div>
        <div class="hp ${foe?'foe':''}"><i data-f="hp"></i></div><div class="hpt" data-f="hpt"></div>
        <div class="stats">${statHTML('dmg',Math.round(u.dmg),'Damage per hit')}${statHTML('rate',(d.rate||1).toFixed(2),'Attacks per second')}${statHTML('range',d.range,'Range')}${statHTML('armor',u.armor,'Armor')}${d.ab?statHTML('zap',ABIL[d.ab].name,ABIL[d.ab].desc):''}</div></div></div><div class="edesc">${esc(d.desc||'')}</div>`;
      portrait(pane.querySelector('canvas'),u.k,92);}
    else if(s.length>1){pane.innerHTML=`<div class="afgrid">${s.map(u=>`<button data-afu="${u.id}" data-tip="${esc(u.def.name)}"><canvas data-k="${u.k}"></canvas><i><b data-afhp="${u.id}"></b></i></button>`).join('')}</div>`;
      pane.querySelectorAll('canvas').forEach(c=>portrait(c,c.dataset.k,38));pane.querySelectorAll('[data-afu]').forEach(b=>b.addEventListener('click',e=>{const u=s.find(x=>x.id===+b.dataset.afu);if(!u)return;if(e.shiftKey)afSetSel(s.filter(x=>x!==u));else afSetSel([u]);}));}
    else pane.innerHTML=`<div class="afscore"></div>`;}
  // live bits
  const one=ins||(s.length===1?s[0]:null);if(one){const f=pane.querySelector('[data-f="hp"]');if(f)f.style.width=Math.max(0,one.hp/one.maxHp*100)+'%';const t=pane.querySelector('[data-f="hpt"]');if(t)t.textContent=`${Math.max(0,Math.ceil(one.hp))} / ${Math.round(one.maxHp)}`;}
  pane.querySelectorAll('[data-afhp]').forEach(b=>{const u=s.find(x=>x.id===+b.dataset.afhp);if(u)b.style.width=Math.max(0,u.hp/u.maxHp*100)+'%';});
  const sc=pane.querySelector('.afscore');if(sc){const tot=side=>{const us=A.U.filter(u=>u.side===side&&!u.temp);return [us.filter(u=>!u.dead).length,us.length,us.reduce((a,u)=>a+Math.max(0,u.hp),0)/Math.max(1,us.reduce((a,u)=>a+u.maxHp,0))];};
    const me=tot(AFV.side),them=tot(1-AFV.side),opp=AFV.side?A.g.a:A.g.b;
    sc.innerHTML=`<div class="afrow"><b>You</b><span>${me[0]} of ${me[1]} standing</span><i><em style="width:${me[2]*100}%"></em></i></div><div class="afrow foe"><b>${esc(sbName(opp))}</b><span>${them[0]} of ${them[1]} standing</span><i><em style="width:${them[2]*100}%"></em></i></div><p>Drag to select, right-click to move or attack. Same keys as the street: A, S, H, Q and E for abilities.</p>`;}}

/* ---------- drawing a fight ---------- */
function drawPitch(c,t){c.fillStyle='#0b0612';c.fillRect(0,0,W,H);
  // stands with a flickering crowd
  c.fillStyle='#1a1224';c.fillRect(0,0,W,FB.y-6);c.fillRect(0,FB.y+FB.h+6,W,H-FB.y-FB.h-6);c.fillRect(0,0,FB.x-6,H);c.fillRect(FB.x+FB.w+6,0,W-FB.x-FB.w-6,H);
  for(let i=0;i<260;i++){const x=(i*97)%W,y=(i*53)%H;if(x>FB.x-12&&x<FB.x+FB.w+12&&y>FB.y-12&&y<FB.y+FB.h+12)continue;const on=Math.sin(t*3+i)>.2;c.fillStyle=['#ff3d9a','#22e1ff','#ffb020','#b46bff','#f8fafc'][i%5];c.globalAlpha=on?.8:.35;c.beginPath();c.arc(x,y+(on?-1:0),2.4,0,TAU);c.fill();}c.globalAlpha=1;
  c.fillStyle='#14532d';c.fillRect(FB.x,FB.y,FB.w,FB.h);c.fillStyle='#166534';for(let k=0;k<10;k++)if(k%2)c.fillRect(FB.x+k*FB.w/10,FB.y,FB.w/10,FB.h);
  c.fillStyle='rgba(96,165,250,.12)';c.fillRect(FB.x,FB.y,110,FB.h);c.fillStyle='rgba(248,113,113,.12)';c.fillRect(FB.x+FB.w-110,FB.y,110,FB.h);
  c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=2;c.strokeRect(FB.x,FB.y,FB.w,FB.h);c.beginPath();c.moveTo(FB.x+FB.w/2,FB.y);c.lineTo(FB.x+FB.w/2,FB.y+FB.h);c.stroke();c.beginPath();c.arc(FB.x+FB.w/2,FB.y+FB.h/2,60,0,TAU);c.stroke();
  neonStroke(c,()=>{c.beginPath();c.rect(FB.x-4,FB.y-4,FB.w+8,FB.h+8);},NEON.pink,2,12);}
function drawFight(c,A,t,opts){opts=opts||{};drawPitch(c,t);if(!A)return;const g=A.g,mySide=opts.side;
  // zones
  for(const f of A.fx)if(f.t==='zone'){const k=f.life/f.max;c.fillStyle=f.k==='storm'?`rgba(167,139,250,${.18+.1*Math.sin(t*12)})`:`rgba(186,230,253,${.14+.1*Math.sin(t*20)})`;c.beginPath();c.arc(f.x,f.y,f.r,0,TAU);c.fill();c.strokeStyle=f.k==='storm'?'#c4b5fd':'#e0f2fe';c.lineWidth=1.5;c.setLineDash([5,5]);c.stroke();c.setLineDash([]);}
  // team rings under the creatures
  const us=A.U.filter(u=>!u.dead).sort((a,b)=>a.y-b.y);
  for(const u of us){const r=u.r*VIS_U;c.strokeStyle=(mySide==null?u.side===0:u.side===mySide)?'rgba(96,165,250,.85)':'rgba(248,113,113,.85)';c.lineWidth=1.6;c.beginPath();c.ellipse(u.x,u.y+r*.82,r*1.0,r*.36,0,0,TAU);c.stroke();}
  for(const u of us){const sel=u.sel;u.sel=opts.sel&&opts.sel.includes(u);if(!u.order)u.order={t:'idle'};drawUnit(c,u,t);u.sel=sel;if(AFV.inspect===u){c.strokeStyle='#ff3b5a';c.lineWidth=1.8;c.setLineDash([4,3]);c.beginPath();c.ellipse(u.x,u.y+u.r*.9,u.r*1.4,u.r*.55,0,0,TAU);c.stroke();c.setLineDash([]);}}
  // effects
  for(const f of A.fx){if(f.dl>0)continue;const k=1-f.life/f.max;
    if(f.t==='shot'){const kk=clamp(1-f.life/f.max,0,1);const x=f.sx+(f.tx-f.sx)*kk,y=f.sy+(f.ty-f.sy)*kk-(f.lob?Math.sin(kk*Math.PI)*60:0);c.fillStyle=f.c;c.beginPath();c.arc(x,y,f.st==='shell'?4:f.st==='orb'?4.5:2.6,0,TAU);c.fill();}
    else if(f.t==='line'){c.strokeStyle=f.c;c.globalAlpha=f.life/f.max;c.lineWidth=f.w||2;c.beginPath();c.moveTo(f.x1,f.y1);c.lineTo(f.x2,f.y2);c.stroke();c.globalAlpha=1;}
    else if(f.t==='chain'){c.strokeStyle=f.c;c.lineWidth=2;c.beginPath();f.pts.forEach(([x,y],i)=>{const jx=i?(Math.sin(t*90+i)*4):0;i?c.lineTo(x+jx,y):c.moveTo(x,y);});c.stroke();}
    else if(f.t==='ring'){c.strokeStyle=f.c;c.globalAlpha=1-k;c.lineWidth=3;c.beginPath();c.arc(f.x,f.y,f.r0+(f.r1-f.r0)*k,0,TAU);c.stroke();c.globalAlpha=1;}
    else if(f.t==='boom'){c.fillStyle=f.c;c.globalAlpha=(1-k)*.55;c.beginPath();c.arc(f.x,f.y,f.r*(.5+.5*k),0,TAU);c.fill();c.globalAlpha=1;}
    else if(f.t==='slash'){c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=2;c.beginPath();c.arc(f.x,f.y-4,10+k*6,(f.a||0)-1,(f.a||0)+1);c.stroke();}
    else if(f.t==='cone'){c.fillStyle=f.c;c.globalAlpha=(1-k)*.45;c.beginPath();c.moveTo(f.x,f.y);c.arc(f.x,f.y,f.r,f.a-.55,f.a+.55);c.closePath();c.fill();c.globalAlpha=1;}
    else if(f.t==='txt'){c.fillStyle=f.c;c.globalAlpha=1-k*.6;c.font='700 12px Barlow,sans-serif';c.textAlign='center';c.fillText(f.s,f.x,f.y-k*18);c.globalAlpha=1;}
    else if(f.t==='die'){const s=unitSprite(f.k,0,0);c.globalAlpha=1-k;blit(c,s,f.x,f.y+k*6,(f.f||1)*VIS_U*(1-k*.3),VIS_U*(1-k*.6),0,(f.f||1)*k*1.2);c.globalAlpha=1;}}
  // scoreboard
  const left=sbName(g.a),right=sbName(g.b),alive=s=>A.U.filter(u=>!u.dead&&!u.temp&&u.side===s).length;
  c.fillStyle='rgba(11,6,18,.88)';rr(c,W/2-210,8,420,40,10);c.fill();c.strokeStyle='#3a3346';c.lineWidth=1;c.stroke();
  const bs=mySide==null?0:mySide;c.font='700 15px Barlow,sans-serif';c.textBaseline='middle';c.textAlign='right';c.fillStyle=bs===0?'#93c5fd':'#fca5a5';c.fillText(`${left}  ${alive(0)}`,W/2-46,28);c.textAlign='left';c.fillStyle=bs===1?'#93c5fd':'#fca5a5';c.fillText(`${alive(1)}  ${right}`,W/2+46,28);
  const tl=Math.max(0,AF_MAX-A.t);c.textAlign='center';c.fillStyle='#fde68a';c.fillText(`${Math.floor(tl/60)}:${String(Math.floor(tl%60)).padStart(2,'0')}`,W/2,28);
  c.font='400 10px Barlow,sans-serif';c.fillStyle='#a79fb8';c.fillText(g.sp.toUpperCase(),W/2,58);
  if(A.done){c.fillStyle='rgba(0,0,0,.55)';c.fillRect(0,H/2-36,W,72);c.font='700 34px Barlow,sans-serif';c.fillStyle='#fde68a';c.fillText(`FULL TIME · ${sbName(A.win?g.b:g.a)} win${sbName(A.win?g.b:g.a)==='You'?'':'s'}`,W/2,H/2);}}
function drawFightMini(cv,A,t){const c=cv.getContext('2d');c.setTransform(cv.width/W,0,0,cv.height/H,0,0);drawFight(c,A,t,{});}

/* main board takeover */
function afViewing(){return AFV.on&&!!afViewArena();}
const _render=render;render=function(){if(afViewing()){const A=afViewArena(),t=performance.now()/1000;const c=MAINCTX;c.setTransform(DPR*RS,0,0,DPR*RS,0,0);
    drawFight(c,A,t,{side:AFV.watch>=0?null:AFV.side,sel:AFV.sel});
    // selection box, marks and the attack-move cursor
    const d=AFV.drag;if(d&&d.box){c.strokeStyle='#5eead4';c.lineWidth=1;c.fillStyle='rgba(94,234,212,.08)';c.fillRect(Math.min(d.x0,d.x1),Math.min(d.y0,d.y1),Math.abs(d.x1-d.x0),Math.abs(d.y1-d.y0));c.strokeRect(Math.min(d.x0,d.x1),Math.min(d.y0,d.y1),Math.abs(d.x1-d.x0),Math.abs(d.y1-d.y0));}
    for(const m of AFV.marks){m.t-=1/60;c.strokeStyle=m.col;c.globalAlpha=Math.max(0,m.t/.6);c.lineWidth=2;c.beginPath();c.arc(m.x,m.y,6+(.6-m.t)*14,0,TAU);c.stroke();c.globalAlpha=1;}AFV.marks=AFV.marks.filter(m=>m.t>0);
    if(AFV.mode&&AFV.hover){const ab=AFV.mode.ab;c.strokeStyle=ab?'#c084fc':'#f87171';c.lineWidth=1.5;c.beginPath();c.arc(AFV.hover.x,AFV.hover.y,ab&&ABIL[ab].rad?ABIL[ab].rad:10,0,TAU);c.stroke();}
    if(AFV.watch>=0){c.fillStyle='rgba(11,6,18,.85)';rr(c,W/2-150,H-40,300,30,8);c.fill();c.fillStyle='#e9e1f5';c.font='400 12px Barlow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('Watching · press ← → for the other games',W/2,H-25);}
    return;}
  _render();};
cv.addEventListener('pointerdown',afPointerDown,true);cv.addEventListener('pointermove',afPointerMove,true);cv.addEventListener('pointerup',afPointerUp,true);
cv.addEventListener('contextmenu',e=>{if(afViewing())e.preventDefault();},true);
document.addEventListener('keydown',ev=>{if(!afViewing())return;const k=ev.key;if((k==='ArrowLeft'||k==='ArrowRight')&&(AFV.gi<0||(afMyArena()&&afMyArena().done))){const L=afArenas();if(!L)return;let i=AFV.watch<0?AFV.gi:AFV.watch;for(let n=0;n<L.length;n++){i=(i+(k==='ArrowRight'?1:-1)+L.length)%L.length;if(L[i])break;}AFV.watch=i===AFV.gi?-1:i;ev.preventDefault();return;}afKey(ev);},true);

/* ======================= running Sports Night fights ======================= */
let AFH=null; // authority: {w,A:[arena],lastPub,acc,seen:{gi:seq}}
let AFC=null; // client replica: {w,A:[arena-like],n}
function afStart(SB){const me=sbMe();AFH={w:SB.w,acc:0,lastPub:0,seen:{},A:SB.games.map((g,i)=>{const ra=SB.ros[g.a]||[],rb=SB.ros[g.b]||[];if(!ra.length||!rb.length)return null;
    const ctrl=[g.a,g.b].map(id=>{const p=sbP(id);return p&&(p.human||p.remote&&!p.left)?'human':'ai';});const A=afCreate(i,g,ra,rb,SB.seed[i],ctrl);A.net=!!G.mp;return A;})};
  afEnterView(SB);}
function afEnterView(SB){const me=sbMe(),gi=SB.games.findIndex(g=>g.a===me||g.b===me);AFV.on=true;AFV.gi=gi;AFV.side=gi>=0?(SB.games[gi].a===me?0:1):0;AFV.watch=gi>=0?-1:(SB.games.findIndex((g,i)=>afArenas()&&afArenas()[i]));AFV.sel=[];AFV.mode=null;AFV.inspect=null;AFV.groups={};AFV.pred={};AFV.sent=[];
  if(AFV.watch<0&&gi<0)AFV.watch=0;document.body.classList.add('fighting');if(NET.watch&&typeof closeWatch==='function')closeWatch();if(MG)$('#mgPanel')&&$('#mgPanel').classList.add('mini');afRefresh(true);
  if(gi>=0){banner('Kick-off!','Drag to select, right-click to move','great');Snd.play('wave');}}
function afExitView(){AFV.on=false;AFV.sel=[];document.body.classList.remove('fighting');const p=$('#mgPanel');if(p)p.classList.remove('mini');}
// authority tick: fixed steps, read remote orders, publish frames
function afHostTick(dt){if(!AFH)return;AFH.acc+=dt;let n=0;
  if(G.mp)afReadOrders();
  while(AFH.acc>=AF_DT&&n++<8){AFH.acc-=AF_DT;for(const A of AFH.A)if(A)afTick(A,AF_DT);}
  if(G.mp){const now=performance.now();if(now-AFH.lastPub>=AF_PUB){AFH.lastPub=now;afPublish();}}}
function afAllDone(){return AFH&&AFH.A.every(A=>!A||A.done&&A.endT>2.5);}
function afReadOrders(){const R=NET.ar||NET.r;if(!R)return;for(const peer of R.peers()){const P=peer.presence;if(!P||!P.ao||!P.pid||P.ao.w!==AFH.w)continue;const pl=G.players.find(p=>p.pid===P.pid);if(!pl)continue;
    const seen=AFH.seen[pl.gi]||0;let top=seen;for(const r of P.ao.l||[]){const [s,g,t,ids,x,y,e,ab]=r;if(s<=seen)continue;top=Math.max(top,s);const A=AFH.A[g];if(!A)continue;const side=A.g.a===pl.gi?0:A.g.b===pl.gi?1:-1;if(side<0)continue;
      afApply(A,side,{t,ids:String(ids).split('.').map(Number),x,y,e:e===''?null:+e,ab});}AFH.seen[pl.gi]=top;}
  // a player who left: the computer takes their team
  for(const A of AFH.A){if(!A)continue;[A.g.a,A.g.b].forEach((id,s)=>{const p=sbP(id);if(p&&p.remote&&p.left)A.ctrl[s]='ai';});}}
function afEncode(A){const us=A.U.filter(u=>!u.dead).map(u=>[fb36(u.id),fb36(KOF[u.k]),u.side,u.rank||0,fb36(u.x),fb36(u.y),fb36(clamp(u.hp/u.maxHp*100,0,100)),
    fb36((u.atk>.45?1:0)|(u.face<0?2:0)|(u.stunT>0?4:0)|(u.lockT>0?8:0)|(u.infT>0?16:0)|(u.fanT>0?32:0)|(u.siegeP>=1?64:0)|(u.temp?128:0)),fb36(((u.aim%TAU)+TAU)%TAU*10),fb36(u.jh||0),fb36(u.cds[u.def.ab]>0?u.cds[u.def.ab]*10:0),u.siegeTo?1:0].join('.')).join(',');
  const ev=A.ev.slice(-16).map(e=>{const o={};for(const k in e)if(!['life','max','dl0'].includes(k))o[k]=typeof e[k]==='number'?Math.round(e[k]*10)/10:e[k];return o;});
  return {u:us,e:ev,t:Math.round(A.t*10)/10,d:A.done?1:0,w:A.win};}
function afPublish(){const R=NET.ar||NET.r;if(!R||!AFH)return;const F={w:AFH.w,n:(AFH.n=(AFH.n||0)+1),g:AFH.A.map(A=>A?afEncode(A):null),ack:AFH.seen};
  // stay inside the room's 4 KB presence budget: trim effects first, then all of them
  const lim=R===NET.r?1500:3700;for(const keep of [8,4,0]){if(JSON.stringify(F).length<=lim)break;for(const g of F.g)if(g)g.e=g.e.slice(-keep);}
  R.presence({ar:F}).catch(()=>{});}
// client: rebuild the fights from the host's frames
function afClientFrame(F){if(!F||!NET.SBS||F.w!==NET.SBS.w)return;if(!AFC||AFC.w!==F.w){AFC={w:F.w,A:[],n:0,seenEv:new Set()};}if(F.n<=AFC.n)return;AFC.n=F.n;const SB=NET.SBS;
  F.g.forEach((fg,i)=>{if(!fg){AFC.A[i]=null;return;}let A=AFC.A[i];if(!A){A=AFC.A[i]={gi:i,g:SB.games[i],t:0,U:[],fx:[],done:false,win:null,byId:{}};}
    A.t=fg.t;A.done=!!fg.d;A.win=fg.w;A.g=SB.games[i];const live=new Set();
    for(const s of fg.u.split(',')){if(!s)continue;const [id,ki,side,rk,x,y,hp,fl,aim,jh,cd,stg]=s.split('.');const nid=parseInt(id,36);live.add(nid);let u=A.byId[nid];
      if(!u){const k=KIDX[parseInt(ki,36)];u=A.byId[nid]={id:nid,k,def:UNITS[k],side:+side,rank:+rk,r:UNITS[k].r,x:parseInt(x,36),y:parseInt(y,36),sx:0,sy:0,maxHp:100,hp:100,cds:{},order:{t:'idle'},walk:0,bob:nid*1.7,spawnT:0,siegeP:0,jh:0,flash:0,face:1,atk:0,aim:0,dmg:UNITS[k].dmg,armor:UNITS[k].armor||0};A.U.push(u);}
      const f=parseInt(fl,36),nx=parseInt(x,36),ny=parseInt(y,36),now=performance.now();if(u.ft){const dtf=clamp((now-u.ft)/1000,.04,.6);u.vx=(nx-u.sx)/dtf;u.vy=(ny-u.sy)/dtf;const sp=Math.hypot(u.vx,u.vy),cap=(UNITS[u.k].spd||80)*1.6;if(sp>cap){u.vx*=cap/sp;u.vy*=cap/sp;}}u.ft=now;u.sx=nx;u.sy=ny;const nhp=parseInt(hp,36);if(nhp<u.hp)u.flash=.1;u.hp=nhp;u.atk=f&1?1:Math.max(0,u.atk-.3);u.face=f&2?-1:1;u.stunT=f&4?1:0;u.lockT=f&8?1:0;u.infT=f&16?1:0;u.fanT=f&32?1:0;u.siegeP=f&64?1:0;u.temp=!!(f&128);
      u.aim=parseInt(aim,36)/10;u.jh=parseInt(jh,36);if(u.def.ab)u.cds[u.def.ab]=parseInt(cd,36)/10;u.siegeTo=stg==='1';}
    for(const u of A.U)if(!live.has(u.id)&&!u.dead){u.dead=true;}
    for(const e of fg.e||[]){if(AFC.seenEv.has(i+':'+e.i))continue;AFC.seenEv.add(i+':'+e.i);const f=Object.assign({},e);f.life=f.t==='shot'?f.T:f.t==='zone'?(f.life||3):f.t==='end'?99:f.t==='die'?.6:f.t==='roll'?.55:.4;if(f.t==='zone')f.life=f.k==='storm'?3:4;f.max=f.life;
      if(f.t==='roll'){const u=A.byId[f.id];if(u){u.rollAt=G.time;u.rollA=f.a;u.rollD=f.d;}continue;}if(f.t==='end')continue;A.fx.push(f);}});
  // my orders the host has now seen: stop predicting them
  const ack=F.ack&&F.ack[G.me.gi]||0;AFV.sent=AFV.sent.filter(o=>o.s>ack);}
function afClientTick(dt){if(!AFC)return;const now=performance.now();
  for(const A of AFC.A){if(!A)continue;for(const u of A.U){if(u.dead)continue;const p=AFV.pred[u.id];
      if(p&&now<p.until&&A.gi===AFV.gi){const dx=p.x-u.x,dy=p.y-u.y,d=Math.hypot(dx,dy),s=(u.def.spd||60)*dt;if(d>2){u.x+=dx/d*Math.min(d,s);u.y+=dy/d*Math.min(d,s);u.walk+=s;u.face=dx>=0?1:-1;}}
      else{if(p)delete AFV.pred[u.id];const age=Math.min(.3,(now-(u.ft||now))/1000),tx=u.sx+(u.vx||0)*age,ty=u.sy+(u.vy||0)*age;const k=1-Math.exp(-dt*16);const ox=u.x,oy=u.y;u.x+=(tx-u.x)*k;u.y+=(ty-u.y)*k;u.walk+=Math.hypot(u.x-ox,u.y-oy);}
      if(u.flash>0)u.flash-=dt;}
    A.U=A.U.filter(u=>!u.dead||false);for(const f of A.fx){if(f.dl>0){f.dl-=dt;continue;}f.life-=dt;}A.fx=A.fx.filter(f=>f.life>0);}}
function afReadFrames(){const R=NET.ar||NET.r;if(!R||!NET.hostPeer)return;for(const peer of R.peers()){const P=peer.presence;if(P&&P.pid===NET.hostPeer&&P.ar){if(P.ar!==AFC_last){AFC_last=P.ar;afClientFrame(P.ar);}break;}}}
let AFC_last=null;
// the whole frame loop for fights, called every animation frame
function afFrame(dt){if(!AFV.on)return;if(G.mp&&!NET.host){afReadFrames();afClientTick(dt);}
  // selections follow the live objects on clients
  if(G.mp&&!NET.host&&AFC){const A=AFC.A[AFV.gi];if(A)AFV.sel=AFV.sel.map(u=>A.byId[u.id]).filter(u=>u&&!u.dead);}
  afRefresh(false);}
