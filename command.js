'use strict';
/* ============ ALL IN — commanding the army ============
   Right-drag a line to form up along it (front line in front, shooters behind). A plain move keeps the
   group's shape. Creatures pick sensible targets on their own (bombers winding up, healers and shields
   first, anything biting the casino if they are nearby). Focused targets stay marked. Abilities say what
   they did when they finish. */

/* ---------- formations ---------- */
const isFront=u=>(u.def.range||0)<90||(u.def.sp&&u.def.sp.taunt);
// keep the group's shape when it is compact enough; otherwise fall back to rings
{const _om=orderMove;orderMove=function(units,x,y,amove){if(!units.length)return;
  const cx=units.reduce((a,u)=>a+u.x,0)/units.length,cy=units.reduce((a,u)=>a+u.y,0)/units.length,spread=Math.max(...units.map(u=>Math.hypot(u.x-cx,u.y-cy)));
  if(units.length<2||spread>150)return _om(units,x,y,amove);
  const k=spread<28?1.35:1;let ok=true;const pts=units.map(u=>{const px=x+(u.x-cx)*k,py=y+(u.y-cy)*k;if(!walkable(px,py,u.r))ok=false;return [px,py];});
  if(!ok)return _om(units,x,y,amove);
  units.forEach((u,i)=>{const [px,py]=pts[i];u.order={t:amove?'amove':'move',x:px,y:py};u.path=findPath(u.x,u.y,px,py);u.target=null;u.anchor={x:px,y:py};u.stuck=0;});
  G.marks.push({x,y,t:.6,col:amove?'#f87171':'#4ade80'});Snd.play(amove?'attack':'click');};}
function lineSlots(units,x0,y0,x1,y1){const L=Math.hypot(x1-x0,y1-y0)||1,dx=(x1-x0)/L,dy=(y1-y0)/L;let nx=-dy,ny=dx;
  // "behind" is the side facing the casino
  const mx=(x0+x1)/2,my=(y0+y1)/2;if((BASE.x-mx)*nx+(BASE.y-my)*ny<0){nx=-nx;ny=-ny;}
  const front=units.filter(isFront),back=units.filter(u=>!isFront(u));const rows=front.length&&back.length?[[front,0],[back,30]]:[[units,0]];const out=[];
  for(const [grp,off] of rows){const n=grp.length,proj=u=>(u.x-x0)*dx+(u.y-y0)*dy;const sorted=grp.slice().sort((a,b)=>proj(a)-proj(b));
    sorted.forEach((u,i)=>{const f=n===1?.5:i/(n-1),px=x0+dx*L*f+nx*off,py=y0+dy*L*f+ny*off;out.push([u,px,py]);});}
  return out;}
function orderLine(units,x0,y0,x1,y1,amove){const slots=lineSlots(units,x0,y0,x1,y1);
  for(const [u,px0,py0] of slots){let px=px0,py=py0;if(!walkable(px,py,u.r)){px=(x0+x1)/2;py=(y0+y1)/2;}
    u.order={t:amove?'amove':'move',x:px,y:py};u.path=findPath(u.x,u.y,px,py);u.target=null;u.anchor={x:px,y:py};u.stuck=0;}
  G.lineMark={x0,y0,x1,y1,t:.8};Snd.play('click');gameLog(`Formed a line of ${units.length}.`,'');}
let rdrag=null;
cv.addEventListener('pointerdown',ev=>{if(ev.button!==2||!G||G.over||G.mode||!G.sel.length||(NET.watch&&NET.watch.full))return;
  const p=boardPos(ev);if(enemyAt(p.x,p.y))return; // right-click on an enemy is still an attack order
  ev.stopImmediatePropagation();Snd.init();rdrag={x0:p.x,y0:p.y,x1:p.x,y1:p.y,amove:ev.shiftKey};cv.setPointerCapture(ev.pointerId);},{capture:true});
cv.addEventListener('pointermove',ev=>{if(!rdrag)return;const p=boardPos(ev);rdrag.x1=p.x;rdrag.y1=p.y;});
cv.addEventListener('pointerup',ev=>{if(!rdrag||ev.button!==2)return;const d=rdrag;rdrag=null;if(!G||!G.sel.length)return;
  if(Math.hypot(d.x1-d.x0,d.y1-d.y0)<22)orderMove(G.sel,d.x0,d.y0,false);else orderLine(G.sel,d.x0,d.y0,d.x1,d.y1,d.amove);},{capture:true});

/* ---------- target priority ---------- */
function targetScore(e,x,y){let b=0;
  if(e.k==='bomber')b+=e.bomb?110:55;else if(e.k==='charm')b+=60;else if(e.k==='bondsman')b+=45;else if(e.k==='hexer')b+=20;
  if(e.atCasino&&Math.hypot(x-BASE.x,y-BASE.y)<300)b+=50;if(e.hp<e.maxHp*.2)b+=15;
  return Math.hypot(e.x-x,e.y-y)-e.r-b;}
function priorityEnemy(x,y,rad,filter){let best=null,bs=1e9;for(const e of G.enemies){if(e.dead||e.hidden)continue;const d=Math.hypot(e.x-x,e.y-y)-e.r;if(d>=rad||(filter&&!filter(e)))continue;const s=targetScore(e,x,y);if(s<bs){bs=s;best=e;}}return best;}

/* ---------- abilities that say what they did ---------- */
const AB_WIN={fan:3,inferno:3,lockdown:5,haymaker:.25,jackpot:.35,fanknives:.35,decree:6,storm:3.2,thunder:4.2,lullaby:.1,barrage:2.4,salvo:1.7,frag:1.3,deadshot:1.15,pounce:.8};
{const _da=doAbility;doAbility=function(u,abk,tgt){const st0={};if(abk==='lullaby')for(const e of G.enemies)st0[e.id]=e.stun||0;
  const T={u,abk,dmg:0,kills:0,hit:new Set(),until:G.time+(AB_WIN[abk]||1),target:tgt&&tgt.e,hp0:tgt&&tgt.e?tgt.e.hp:0};
  if(abk==='lockdown')T.taunt=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-u.x,e.y-u.y)<180).length;
  if(AB_WIN[abk]){u.abTally=T;if(abk==='decree')G.decreeTally=T;(G.abTallies=G.abTallies||[]).push(T);}
  _da(u,abk,tgt);
  if(abk==='lullaby'){T.stun=G.enemies.filter(e=>(e.stun||0)>(st0[e.id]||0)+.5).length;}};}
{const _he=hitEnemy;hitEnemy=function(e,dmg,u,opt){if(!e||e.dead)return _he(e,dmg,u,opt);const h0=e.hp+(e.shield||0);_he(e,dmg,u,opt);const d=Math.max(0,h0-Math.max(0,e.hp)-(e.shield||0));
  const T=u&&u.abTally;if(T&&G.time<=T.until){T.dmg+=d;T.hit.add(e.id);if(e.dead||e.hp<=0)T.kills++;}
  const D=G.decreeTally;if(D&&D!==T&&G.decreeT>0&&u&&u.def)D.dmg+=d/3;};}
function abilityResults(){if(!G.abTallies||!G.abTallies.length)return;
  for(const T of G.abTallies){if(G.time<=T.until)continue;T.done=true;const u=T.u,A=ABIL[T.abk];if(u.abTally===T)u.abTally=null;if(G.decreeTally===T)G.decreeTally=null;
    if(T.abk==='deadshot'&&T.target){T.dmg=Math.max(T.dmg,T.hp0-Math.max(0,T.target.hp));if(T.target.dead||T.target.hp<=0)T.kills=Math.max(T.kills,1);T.hit.add(T.target.id);}
    const bits=[];if(T.stun)bits.push(`${T.stun} asleep`);if(T.taunt)bits.push(`taunting ${T.taunt}`);
    if(T.hit.size&&T.abk!=='decree')bits.push(`${T.hit.size} hit`);if(T.kills)bits.push(`${T.kills} busted`);if(T.dmg>=1)bits.push(fmt(Math.round(T.dmg))+(T.abk==='decree'?' bonus':''));
    if(!bits.length){if(!u.dead)floatText(u.x,u.y-u.r-26,A.name+': missed','#a1a1aa',11);continue;}
    const big=T.kills>=3||T.hit.size>=6||T.stun>=4;
    if(!u.dead)floatText(u.x,u.y-u.r-28,`${A.name}: ${bits.join(' · ')}`,big?'#f0abfc':'#d8b4fe',big?14:12);
    if(big){if(typeof hitPause==='function')hitPause(60);G.shake=Math.min(8,G.shake+2);Snd.play('rankup');}
    gameLog(`${u.def.name} · ${A.name}: ${bits.join(', ')}.`,big?'good':'');}
  G.abTallies=G.abTallies.filter(T=>!T.done);}
{const _u=update;update=function(dt){_u(dt);try{abilityResults();if(G.lineMark){G.lineMark.t-=dt;if(G.lineMark.t<=0)G.lineMark=null;}}catch(e){}};}

/* ---------- drawing: focus marks, orders for the selection, the line being drawn, abilities ready ---------- */
function drawCommandGround(c,t){if(!G)return;
  // where the selection is headed, and who it is shooting
  if(G.sel.length&&G.sel.length<=16){c.save();c.lineWidth=1.3;for(const u of G.sel){const o=u.order;
      if((o.t==='move'||o.t==='amove')&&Math.hypot(o.x-u.x,o.y-u.y)>14){c.strokeStyle=o.t==='amove'?'rgba(248,113,113,.55)':'rgba(94,234,212,.5)';c.setLineDash([4,4]);c.beginPath();c.moveTo(u.x,u.y);c.lineTo(o.x,o.y);c.stroke();c.setLineDash([]);
        c.fillStyle=o.t==='amove'?'rgba(248,113,113,.7)':'rgba(94,234,212,.7)';c.beginPath();c.arc(o.x,o.y,2.6,0,TAU);c.fill();}
      else if(u.target&&!u.target.dead&&!u.target.hidden){c.strokeStyle='rgba(255,59,90,.35)';c.beginPath();c.moveTo(u.x,u.y);c.lineTo(u.target.x,u.target.y);c.stroke();}}c.restore();}
  // the line being drawn, with where each creature will stand
  const L=rdrag&&Math.hypot(rdrag.x1-rdrag.x0,rdrag.y1-rdrag.y0)>=22?rdrag:G.lineMark;
  if(L){c.save();c.globalAlpha=L===G.lineMark?Math.min(1,G.lineMark.t*1.5):1;c.strokeStyle=L.amove?'#f87171':'#5eead4';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(L.x0,L.y0);c.lineTo(L.x1,L.y1);c.stroke();
    if(L===rdrag)for(const [u,px,py] of lineSlots(G.sel,L.x0,L.y0,L.x1,L.y1)){c.fillStyle=isFront(u)?'rgba(94,234,212,.85)':'rgba(167,243,208,.55)';c.beginPath();c.arc(px,py,isFront(u)?4.5:3.5,0,TAU);c.fill();}
    c.restore();}}
function drawCommandTop(c,t){if(!G)return;
  // a crosshair on anything your army has been told to focus
  const focus=new Set();for(const u of G.units)if(u.order&&u.order.t==='attack'&&u.order.e&&!u.order.e.dead)focus.add(u.order.e);
  for(const e of focus){const R=e.r*VIS_E+8,a=t*2;c.save();c.translate(e.x,e.y);c.rotate(a);c.strokeStyle='#ff3b5a';c.lineWidth=2;
    for(let k=0;k<4;k++){c.beginPath();c.arc(0,0,R,k*Math.PI/2+.25,k*Math.PI/2+1.3);c.stroke();}c.restore();}
  // creatures whose ability is ready while there is something to use it on
  if(G.phase==='wave')for(const u of G.units){const ab=u.def.ab;if(!ab||u.dead||ABIL[ab].type==='toggle'||u.cds[ab]>0||u.jump)continue;
    if(!nearestEnemy(u.x,u.y,castRange(u,ab)+40))continue;const p=.5+.5*Math.sin(t*5+u.id),y=u.y-u.r*2.2-14-(u.sel?10:0);
    c.save();c.globalAlpha=.55+.45*p;c.fillStyle='#c084fc';c.strokeStyle='#0b0612';c.lineWidth=1.4;c.beginPath();c.moveTo(u.x,y-5);c.lineTo(u.x+4,y);c.lineTo(u.x,y+5);c.lineTo(u.x-4,y);c.closePath();c.fill();c.stroke();c.restore();}}
{const _g=drawGroundWarn;drawGroundWarn=function(c,t){_g(c,t);drawCommandGround(c,t);};}
{const _t=drawTopWarn;drawTopWarn=function(c,t){_t(c,t);drawCommandTop(c,t);};}
