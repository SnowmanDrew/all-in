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
  G.lineMark={x0,y0,x1,y1,t:.8};Snd.play('click');}
let rdrag=null;
cv.addEventListener('pointerdown',ev=>{if(ev.button!==2||!G||G.over||G.mode||!G.sel.length||(NET.watch&&NET.watch.full))return;
  const p=boardPos(ev);if(enemyAt(p.x,p.y))return; // right-click on an enemy is still an attack order
  ev.stopImmediatePropagation();Snd.init();rdrag={x0:p.x,y0:p.y,x1:p.x,y1:p.y,amove:false,shift:ev.shiftKey};cv.setPointerCapture(ev.pointerId);},{capture:true});
cv.addEventListener('pointermove',ev=>{if(!rdrag)return;const p=boardPos(ev);rdrag.x1=p.x;rdrag.y1=p.y;});
cv.addEventListener('pointerup',ev=>{if(!rdrag||ev.button!==2)return;const d=rdrag;rdrag=null;if(!G||!G.sel.length)return;
  QUEUE_SHIFT=d.shift||ev.shiftKey;const far=Math.hypot(d.x1-d.x0,d.y1-d.y0)>=22;
  // a line needs at least two creatures: one creature just goes where you let go
  if(!far)orderMove(G.sel,d.x0,d.y0,false);else if(G.sel.length<2)orderMove(G.sel,d.x1,d.y1,d.amove);else orderLine(G.sel,d.x0,d.y0,d.x1,d.y1,d.amove);QUEUE_SHIFT=false;},{capture:true});

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
  }
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
  const L=rdrag&&G.sel.length>=2&&Math.hypot(rdrag.x1-rdrag.x0,rdrag.y1-rdrag.y0)>=22?rdrag:G.lineMark;
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

/* ---------- shift-queued orders ----------
   Hold Shift when giving an order (right-click, right-drag a line, attack-move, attack) and it joins the end of each
   creature's queue instead of replacing what it is doing. Any order without Shift clears the queue. */
let QUEUE_SHIFT=false;
cv.addEventListener('pointerdown',ev=>{QUEUE_SHIFT=ev.shiftKey;setTimeout(()=>{QUEUE_SHIFT=false;},0);},{capture:true});
const busyUnit=u=>(u.order&&u.order.t!=='idle'&&u.order.t!=='hold')||(u.queue&&u.queue.length);
function queueWrap(fn){return function(units){if(!units||!units.length)return fn.apply(this,arguments);
  if(!QUEUE_SHIFT){for(const u of units)u.queue=[];return fn.apply(this,arguments);}
  const snap=new Map(units.filter(busyUnit).map(u=>[u,{order:u.order,path:u.path,anchor:u.anchor,target:u.target}]));
  const r=fn.apply(this,arguments);
  for(const [u,s] of snap){(u.queue=u.queue||[]).push(u.order);u.order=s.order;u.path=s.path;u.anchor=s.anchor;u.target=s.target;}
  return r;};}
orderMove=queueWrap(orderMove);orderAttack=queueWrap(orderAttack);orderLine=queueWrap(orderLine);
{const _os=orderStop;orderStop=function(units){for(const u of units)u.queue=[];return _os(units);};}
{const _oh=orderHold;orderHold=function(units){for(const u of units)u.queue=[];return _oh(units);};}
{const _u=update;update=function(dt){_u(dt);for(const u of G.units){if(!u.queue||!u.queue.length||u.order.t!=='idle'||u.dead)continue;
  const o=u.queue.shift();if(o.t==='attack'){if(!o.e||o.e.dead)continue;u.order=o;u.target=o.e;u.path=[];continue;}
  if(o.t==='move'||o.t==='amove'){u.order=o;u.path=findPath(u.x,u.y,o.x,o.y);u.anchor={x:o.x,y:o.y};u.target=null;u.stuck=0;}}};}
// draw the queue for the selection: a chain from the current goal through every queued step
{const _g=drawCommandGround;drawCommandGround=function(c,t){_g(c,t);if(!G||!G.sel.length||G.sel.length>16)return;c.save();c.lineWidth=1.2;c.setLineDash([3,4]);
  for(const u of G.sel){if(!u.queue||!u.queue.length)continue;const o=u.order;let px=o.t==='move'||o.t==='amove'?o.x:o.t==='attack'&&o.e&&!o.e.dead?o.e.x:u.x,py=o.t==='move'||o.t==='amove'?o.y:o.t==='attack'&&o.e&&!o.e.dead?o.e.y:u.y;
    u.queue.forEach((q,i)=>{const qx=q.t==='attack'?(q.e&&!q.e.dead?q.e.x:null):q.x,qy=q.t==='attack'?(q.e&&!q.e.dead?q.e.y:null):q.y;if(qx==null)return;
      c.strokeStyle=q.t==='attack'||q.t==='amove'?'rgba(248,113,113,.5)':'rgba(94,234,212,.45)';c.beginPath();c.moveTo(px,py);c.lineTo(qx,qy);c.stroke();
      c.setLineDash([]);c.fillStyle='#0b0612';c.beginPath();c.arc(qx,qy,5.5,0,TAU);c.fill();c.strokeStyle=q.t==='move'?'#5eead4':'#f87171';c.lineWidth=1.4;c.stroke();
      c.fillStyle='#fff';c.font='bold 7px Barlow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),qx,qy+.5);c.setLineDash([3,4]);c.lineWidth=1.2;px=qx;py=qy;});}
  c.restore();};}

/* ---------- control groups ----------
   1–9 selects a group. Shift+number adds the selection to a group (making it if it's empty); Ctrl/Cmd/Alt+number
   replaces it, where the browser lets those keys through. The bar along the bottom of the board shows each group
   and does the same with the mouse: click to select, Shift-click to add, right-click to replace. Recalling a group
   pings its creatures so you can see where they are. */
function groupSet(n,mode){if(!G||!G.sel.length)return;const g=G.groups[n]&&mode==='add'?G.groups[n]:[];
  for(const u of G.sel)if(!g.includes(u))g.push(u);G.groups[n]=g;Snd.play('click');toast(`${mode==='add'?'Added to':'Saved as'} group ${n}`);groupBar(true);}
function groupRecall(n,add){const g=G&&G.groups[n]&&G.groups[n].filter(u=>!u.dead);if(!g||!g.length)return;
  G.sel=add?[...new Set(G.sel.concat(g))]:g.slice();G.units.forEach(u=>u.sel=G.sel.includes(u));G.inspect=null;
  for(const u of g)G.fx.push({t:'ring',x:u.x,y:u.y,r0:u.r+2,r1:u.r+16,col:'#5eead4',life:.35,max:.35,w:2});
  Snd.play(selSound(g[0]));refreshPane(true);refreshCmd();groupBar(true);}
window.addEventListener('keydown',ev=>{if(!G||G.paused||G.over)return;if(typeof afViewing==='function'&&afViewing())return;if(ev.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName))return;
  if($('#overlay').classList.contains('show'))return;if(G.mp&&$('#emotes')&&$('#emotes').classList.contains('show'))return;
  const m=/^Digit([1-9])$/.exec(ev.code||'');if(!m)return;const n=+m[1];
  if(ev.shiftKey){ev.preventDefault();ev.stopImmediatePropagation();groupSet(n,'add');}
  else if(ev.altKey||ev.ctrlKey||ev.metaKey){ev.preventDefault();ev.stopImmediatePropagation();groupSet(n,'set');}
  else{ev.preventDefault();ev.stopImmediatePropagation();groupRecall(n,false);}},true);
let GB_SIG='';
function groupBar(force){const wrap=$('#boardWrap'),cv2=$('#board');if(!wrap||!cv2)return;let el=$('#groupBar');
  if(!el){el=document.createElement('div');el.id='groupBar';wrap.appendChild(el);
    el.addEventListener('click',e=>{const b=e.target.closest('[data-g]');if(!b||!G)return;const n=+b.dataset.g;if(b.classList.contains('new'))groupSet(n,'set');else groupRecall(n,e.shiftKey);});
    el.addEventListener('contextmenu',e=>{e.preventDefault();const b=e.target.closest('[data-g]');if(b&&G&&G.sel.length)groupSet(+b.dataset.g,'set');});}
  if(!G||G.over){el.innerHTML='';GB_SIG='';return;}
  const groups=[];for(let n=1;n<=9;n++){const g=G.groups[n]&&G.groups[n].filter(u=>!u.dead);if(g&&g.length)groups.push([n,g]);}
  const free=[1,2,3,4,5,6,7,8,9].find(n=>!(G.groups[n]&&G.groups[n].some(u=>!u.dead)));
  const showNew=G.sel.length>0&&free&&!groups.some(([n,g])=>g.length===G.sel.length&&g.every(u=>u.sel));
  const sig=groups.map(([n,g])=>n+':'+g.map(u=>u.id).join('.')+(g.length===G.sel.length&&g.every(u=>u.sel)?'*':'')+(g.some(u=>u.def.ab&&!(u.cds[u.def.ab]>0))?'!':'')).join('|')+'/'+(showNew?free:'');
  const r=cv2.getBoundingClientRect(),wr=wrap.getBoundingClientRect();el.style.right=(wr.right-r.right+8)+'px';el.style.bottom=(wr.bottom-r.bottom+8)+'px';
  if(sig===GB_SIG&&!force)return;GB_SIG=sig;
  const top=g=>{const c={};for(const u of g)c[u.k]=(c[u.k]||0)+(u.def.tier||1)+1;return Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0];};
  el.innerHTML=groups.map(([n,g])=>{const on=g.length===G.sel.length&&g.every(u=>u.sel),ab=g.some(u=>u.def.ab&&!(u.cds[u.def.ab]>0));
      return `<button class="gchip ${on?'on':''}" data-g="${n}" data-tip="Group ${n}|${g.length} creature${g.length>1?'s':''}. Press ${n} or click to select. Shift-click adds them to your selection; right-click replaces the group with your selection."><i>${n}</i><canvas data-k="${top(g)}"></canvas><b>${g.length}</b>${ab?'<em></em>':''}</button>`;}).join('')
    +(showNew?`<button class="gchip new" data-g="${free}" data-tip="Save a control group|Saves your selection as group ${free}. Shortcut: Shift+${free}. Then press ${free} to select them again."><i>${free}</i><span>+ Group</span></button>`:'');
  el.querySelectorAll('canvas').forEach(c=>portrait(c,c.dataset.k,26));}
setInterval(()=>{try{groupBar(false);}catch(e){}},200);
{const st=document.createElement('style');st.textContent=`
#groupBar{position:absolute;display:flex;gap:5px;z-index:5;pointer-events:none}
#groupBar .gchip{pointer-events:auto;position:relative;display:flex;align-items:center;gap:3px;height:34px;padding:0 8px 0 4px;border:0;border-radius:9px;cursor:pointer;background:rgba(14,9,20,.88);box-shadow:0 0 0 1px #000,inset 0 0 0 1px #3a3346,0 4px 12px rgba(0,0,0,.45);color:#e9e2f5;transition:transform .12s,box-shadow .15s}
#groupBar .gchip:hover{transform:translateY(-2px);box-shadow:0 0 0 1px #000,inset 0 0 0 1px #5eead4,0 6px 14px rgba(0,0,0,.5)}
#groupBar .gchip.on{box-shadow:0 0 0 1px #000,inset 0 0 0 1.5px #5eead4,0 0 12px rgba(94,234,212,.45)}
#groupBar .gchip i{font:400 11px var(--head);font-style:normal;color:#5eead4;min-width:14px;height:16px;line-height:16px;text-align:center;border-radius:4px;background:rgba(94,234,212,.12)}
#groupBar .gchip canvas{width:26px;height:26px}
#groupBar .gchip b{font:700 12px var(--body)}
#groupBar .gchip em{position:absolute;top:3px;right:3px;width:6px;height:6px;border-radius:50%;background:#c084fc;box-shadow:0 0 6px #c084fc}
#groupBar .gchip.new{padding:0 9px 0 4px;background:rgba(14,9,20,.7);box-shadow:0 0 0 1px #000,inset 0 0 0 1px rgba(94,234,212,.35)}
#groupBar .gchip.new span{font:400 11px var(--head);color:#a7f3d0;letter-spacing:.03em}
#groupBar .gchip.new i{color:#a7f3d0}`;document.head.appendChild(st);}

/* ---------- rally point ----------
   With nothing selected, right-click the street to plant a rally flag: newly summoned creatures attack-move
   there as soon as they land. Right-click the flag again to take it down. */
function setRally(p){if(!G||G.over)return;
  if(G.rally&&Math.hypot(p.x-G.rally.x,p.y-G.rally.y)<20){G.rally=null;Snd.play('sell');toast('Rally point cleared: new creatures wait by the casino');return;}
  if(!walkable(p.x,p.y,8)){Snd.play('error');return;}
  const first=!G.rally;G.rally={x:p.x,y:p.y,t:G.time};Snd.play('click');G.fx.push({t:'ring',x:p.x,y:p.y,r0:4,r1:26,col:'#fbbf24',life:.45,max:.45,w:2});
  if(first)toast('Rally point set: new creatures head here. Click the flag with the casino selected to clear it.');}
{const _sh=spawnHandUnits;spawnHandUnits=function(){const before=new Set(G.units);const r=_sh.apply(this,arguments);
  if(G.rally){for(const u of G.units)if(!before.has(u))u.rallyAt=G.time+.5;}return r;};}
{const _u=update;update=function(dt){_u(dt);if(!G||!G.rally)return;const go=G.units.filter(u=>u.rallyAt&&G.time>=u.rallyAt&&!u.dead);
  if(go.length){for(const u of go)u.rallyAt=0;const q=QUEUE_SHIFT;QUEUE_SHIFT=false;orderMove(go,G.rally.x,G.rally.y,true);QUEUE_SHIFT=q;}};}
function drawRally(c,t){const R=G&&G.rally;if(!R||!(G.selBase||G.mode==='rally'))return;const x=R.x,y=R.y,age=G.time-(R.t||0),pop=age<.35?1+Math.sin(age/.35*Math.PI)*.35:1;
  // a faint dotted path from the casino door, the base ring, then a gold pennant that flutters
  c.save();c.globalAlpha=.6;c.strokeStyle='#fbbf24';c.lineWidth=1.3;c.setLineDash([2,6]);c.lineDashOffset=-t*18;c.beginPath();c.moveTo(BASE.fx-8,BASE.y);c.lineTo(x,y);c.stroke();c.restore();
  c.save();c.translate(x,y);c.scale(pop*1.25,pop*1.25);c.fillStyle="rgba(0,0,0,.4)";c.beginPath();c.ellipse(1,1.5,7,2.6,0,0,TAU);c.fill();
  c.strokeStyle=`rgba(251,191,36,${.35+.2*Math.sin(t*3)})`;c.lineWidth=1.2;c.beginPath();c.ellipse(0,0,9+Math.sin(t*3),3.4,0,0,TAU);c.stroke();
  c.strokeStyle='#3b2f1a';c.lineWidth=1.6;c.beginPath();c.moveTo(0,0);c.lineTo(0,-22);c.stroke();c.fillStyle='#fde68a';c.beginPath();c.arc(0,-22.5,1.4,0,TAU);c.fill();
  c.fillStyle='#f59e0b';c.beginPath();c.moveTo(0,-21);for(let i=0;i<=6;i++){const fx=i*2.2,fy=-21+Math.sin(t*7-i*.8)*1.2*(i/6);c.lineTo(fx,fy);}for(let i=6;i>=0;i--){const fx=i*2.2,fy=-14.5+Math.sin(t*7-i*.8)*1.2*(i/6)-(i/6)*2.4;c.lineTo(fx,fy);}c.closePath();c.fill();
  c.fillStyle='#fff7d6';c.font='700 5px Barlow,Arial,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('♠',5.5,-18.2+Math.sin(t*7-2)*.6);c.restore();}
// the casino, when it is selected
function drawBaseSel(c,t){if(!G||!G.selBase)return;const x=BASE.c0*TILE-3,y=BASE.r0*TILE-3,w=BASE.w*TILE+6,h=BASE.h*TILE+6,p=.5+.5*Math.sin(t*6);
  c.save();c.strokeStyle=`rgba(94,234,212,${.55+.3*p})`;c.lineWidth=2;c.shadowColor='#5eead4';c.shadowBlur=10;rr(c,x,y,w,h,8);c.stroke();c.restore();}
{const _g=drawCommandGround;drawCommandGround=function(c,t){_g(c,t);drawRally(c,t);drawBaseSel(c,t);};}
