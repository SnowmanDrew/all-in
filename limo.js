'use strict';
/* ============ ALL IN — the limo ============
   The first time your casino becomes the Sky Tower, a white stretch limo pulls up out front and stays.
   Valet: when a knocked-out creature gets back on its feet, the limo drives it back to its post (where it was
   standing when it went down) or to your rally flag, instead of leaving it to walk from the door.
   Floor It (casino card, L): pick a spot and the driver puts his foot down: the limo tears up the street in a
   straight line, ploughing through bad luck and throwing it aside, then reverses back to its spot. 25 seconds
   between runs. Nothing can hurt it. Single player only. */
HIDDEN_ACH.limo=['Valet Parking','Your casino became the Sky Tower and the limo pulled up.','casino','A casino that tall has a car to match.'];
ACH.limo=HIDDEN_ACH.limo.slice(0,3);
const LIMO_PARK={x:BASE.x-4,y:(BASE.r0+BASE.h)*TILE+26},LIMO_CD=25,LIMO_LEN=80,LIMO_WID=24;
Object.assign(ICONS,{limo:'<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>'});
CMD_DEF.limo={k:'limo',ic:'limo',key:'L',name:'Floor It',desc:'Pick a spot on the street: the limo tears up it in a straight line, ploughing through the bad luck and throwing it aside, then reverses back. Nothing can hurt it. 25 seconds between runs.'};

{const _ct=setCasinoTier;setCasinoTier=function(t,quiet){const r=_ct.apply(this,arguments);if(G&&!G.mp&&!G.limo&&t===CASINO_TIERS.length-1)limoArrive(quiet);return r;};}
function limoArrive(quiet){G.limo={x:W+70,y:LIMO_PARK.y,a:Math.PI,mode:'arrive',path:[[LIMO_PARK.x,LIMO_PARK.y]],spd:300,cd:0,v:0};
  if(!quiet){setTimeout(()=>{if(!G||!G.limo)return;banner('The limo is here','Valet parking for your creatures · Floor It (L) from the casino','great');Snd.play('whoosh');},900);
    gameLog('A white stretch limo pulls up outside the Sky Tower. It drives your creatures back to their posts when they get up, and with the casino selected it can Floor It (L).','good');}
  if(typeof Meta!=='undefined')Meta.ach('limo');if(typeof cmdCtx==='function'&&cmdCtx()==='base')buildCmd();}

/* ---------- driving ---------- */
function limoStep(L,dt){if(!L.path.length)return true;const [tx,ty]=L.path[0],dx=tx-L.x,dy=ty-L.y,d=Math.hypot(dx,dy);
  const last=L.path.length===1,want=last?Math.min(L.spd,40+d*3):L.spd;L.v+=(want-L.v)*Math.min(1,dt*4);const mv=Math.max(30,L.v)*dt;
  if(d<=mv){L.x=tx;L.y=ty;L.path.shift();return !L.path.length;}
  const ta=L.rev?Math.atan2(-dy,-dx):Math.atan2(dy,dx);let da=ta-L.a;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;L.a+=da*Math.min(1,dt*9);
  L.x+=dx/d*mv;L.y+=dy/d*mv;return false;}
{const _u=update;update=function(dt){_u(dt);const L=G&&G.limo;if(!L)return;if(L.cd>0)L.cd-=dt;
  if(L.mode==='arrive'){if(limoStep(L,dt)){L.mode='park';L.a=Math.PI;L.v=0;}}
  else if(L.mode==='valet'){L.tt=(L.tt||0)+dt;if(limoStep(L,dt)||L.tt>5)limoDrop(L);}
  else if(L.mode==='back'){if(limoStep(L,dt)){L.mode='park';L.rev=false;L.v=0;}}
  else if(L.mode==='floor')limoFloor(L,dt);
  else if(L.mode==='reverse'){if(limoStep(L,dt)){L.mode='park';L.rev=false;L.v=0;L.a=Math.PI;}}
  if(L.mode==='park'){let da=Math.PI-L.a;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;L.a+=da*Math.min(1,dt*3);}
  if(L.skid)L.skid=L.skid.filter(s=>G.time-s.t<2.5);
  L.ui=(L.ui||0)-dt;if(L.ui<=0){L.ui=.25;limoBtn();}};}

/* ---------- valet ---------- */
{const _ko=updateKO;updateKO=function(dt){const L=G&&G.limo,due=L?G.ko.filter(k=>k.t-dt<=0).map(k=>({u:k.u,ax:k.u.anchor?k.u.anchor.x:null,ay:k.u.anchor?k.u.anchor.y:null})):[];_ko(dt);
  if(!L||L.mode!=='park'||!due.length)return;const riders=[];
  for(const d of due){const u=d.u;if(u.dead||!G.units.includes(u))continue;let dest=G.rally?{x:G.rally.x,y:G.rally.y}:d.ax!=null?{x:d.ax,y:d.ay}:null;
    if(!dest||Math.hypot(dest.x-BASE.fx,dest.y-BASE.y)<90||!walkable(dest.x,dest.y,8))continue;riders.push({u,dest});}
  if(!riders.length)return;const dest=riders[0].dest;
  for(const r of riders){const i=G.units.indexOf(r.u);if(i>=0)G.units.splice(i,1);r.u.sel=false;G.sel=G.sel.filter(o=>o!==r.u);}
  L.riders=riders;L.dest=dest;L.mode='valet';L.tt=0;L.rev=false;L.spd=380;L.path=findPath(L.x,L.y,dest.x,dest.y).map(p=>[p[0],p[1]]);if(!L.path.length)L.path=[[dest.x,dest.y]];
  floatText(L.x,L.y-18,riders.length>1?`Valet: ${riders.length} back to their posts`:'Valet!','#fde68a',11);Snd.play('whoosh');};}
function limoDrop(L){for(const [i,r] of (L.riders||[]).entries()){const u=r.u,a=i*2.4,d=i?14:0;let x=r.dest.x+Math.cos(a)*d,y=r.dest.y+Math.sin(a)*d;if(!walkable(x,y,u.r)){x=L.x;y=L.y;}
    u.x=x;u.y=y;u.anchor={x,y};u.order={t:'idle'};u.path=[];u.target=null;u.spawnT=.2;u.popAt=G.time;if(!G.units.includes(u))G.units.push(u);G.fx.push({t:'ring',x,y,r0:4,r1:26,col:'#fde68a',life:.4,max:.4,w:2});}
  L.riders=[];L.mode='back';L.spd=330;L.path=findPath(L.x,L.y,LIMO_PARK.x,LIMO_PARK.y).map(p=>[p[0],p[1]]);L.path.push([LIMO_PARK.x,LIMO_PARK.y]);Snd.play('click');}

/* ---------- Floor It ---------- */
function floorIt(p){const L=G&&G.limo;if(!L)return;if(L.mode!=='park'){toast('The limo is out');Snd.play('error');return;}if(L.cd>0){toast(`Floor It is ready in ${Math.ceil(L.cd)}s`);Snd.play('error');return;}
  const a=Math.atan2(p.y-L.y,p.x-L.x),max=Math.min(520,Math.hypot(p.x-L.x,p.y-L.y)+40);let d=0;
  while(d<max){const x=L.x+Math.cos(a)*(d+10),y=L.y+Math.sin(a)*(d+10);if(!walkable(x,y,14)&&d>24)break;d+=10;}
  if(d<60){toast('No room to floor it that way');Snd.play('error');return;}
  L.mode='floor';L.fa=a;L.fd=d;L.fs=0;L.sx=L.x;L.sy=L.y;L.hit=new Set();L.cd=LIMO_CD;L.v=200;L.a=a;L.dmg=waveHp(G.wave)*1.2;
  if(Snd.ctx&&!Snd.muted&&Snd.ctx.state==='running'){Snd.tone(330,.22,'square',.12);Snd.tone(262,.22,'square',.1);}Snd.play('whoosh');floatText(L.x,L.y-20,'FLOOR IT!','#fde047',15);
  (L.skid=L.skid||[]).push({x:L.x,y:L.y,a,t:G.time});}
function limoFloor(L,dt){L.v=Math.min(780,L.v+1400*dt);L.fs+=L.v*dt;const k=Math.min(L.fs,L.fd);L.x=L.sx+Math.cos(L.fa)*k;L.y=L.sy+Math.sin(L.fa)*k;L.a=L.fa;
  const ca=Math.cos(L.fa),sa=Math.sin(L.fa);
  for(const e of G.enemies){if(e.dead||L.hit.has(e))continue;const dx=e.x-L.x,dy=e.y-L.y,along=dx*ca+dy*sa,side=-dx*sa+dy*ca;if(Math.abs(along)>LIMO_LEN*.5+e.r||Math.abs(side)>LIMO_WID*.5+e.r+4)continue;
    L.hit.add(e);hitEnemy(e,L.dmg,null);if(!e.dead){const s=side>=0?1:-1;hlShove(e,L.fa+s*Math.PI/2,52);if(!e.def.boss)e.stun=Math.max(e.stun||0,.7);}
    for(let i=0;i<8;i++)spark(e.x,e.y,i%2?'#fde047':'#f8fafc',160,.4);G.shake=Math.min(7,G.shake+1.4);Snd.play('thump');if(G.texts.length<40&&rnd()<.4)floatText(e.x,e.y-e.r-8,'BUMP!','#fde047',11);}
  if(G.parts.length<400&&rnd()<.6)spark(L.x-ca*LIMO_LEN*.5,L.y-sa*LIMO_LEN*.5,'#9ca3af',60,.4);
  if(L.fs>=L.fd){L.mode='reverse';L.rev=true;L.spd=320;L.v=0;L.path=[[L.sx,L.sy]];(L.skid=L.skid||[]).push({x:L.x,y:L.y,a:L.fa,t:G.time});Snd.play('roll');}}

/* ---------- the casino card ---------- */
{const _bc=buildCmd;buildCmd=function(){CMD_SETS.base[9]=G&&G.limo?'limo':null;return _bc.apply(this,arguments);};}
{const _cm=cmd;cmd=function(k){if(k!=='limo')return _cm.apply(this,arguments);if(!G||G.over||!G.limo)return;const L=G.limo;
  if(G.mode==='limo'){setMode(null);return;}if(L.cd>0){toast(`Floor It is ready in ${Math.ceil(L.cd)}s`);Snd.play('error');return;}if(L.mode!=='park'){toast('The limo is out');Snd.play('error');return;}setMode('limo');Snd.play('click');};}
function limoBtn(){const b=document.querySelector('#cmd [data-c="limo"]');if(!b){if(G&&G.limo&&typeof cmdCtx==='function'&&cmdCtx()==='base'&&CMD_SETS.base[9]!=='limo')buildCmd();return;}const L=G.limo;if(!L)return;
  const cd=Math.max(0,L.cd||0);b.classList.toggle('lit',G.mode==='limo');b.style.opacity=cd>0||L.mode!=='park'?.5:1;const k=b.querySelector('.key');if(k)k.textContent=cd>0?Math.ceil(cd)+'s':'L';}
document.addEventListener('keydown',ev=>{if(!G||G.over||G.paused||!G.limo)return;const tg=ev.target&&ev.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA'||ev.ctrlKey||ev.metaKey||ev.altKey)return;
  if(ev.key.toLowerCase()==='l'&&!G.sel.length&&G.selBase){cmd('limo');refreshCmd();}});
{const bw=document.getElementById('boardWrap');if(bw)bw.addEventListener('pointerdown',ev=>{if(!G||G.mode!=='limo'||ev.button!==0)return;if(ev.target&&ev.target.closest&&!ev.target.closest('canvas'))return;
  ev.stopPropagation();ev.preventDefault();const p=boardPos(ev);setMode(null);floorIt(p);refreshCmd();},true);}

/* ---------- what you see ---------- */
function drawLimoCar(c,L,t){const moving=L.mode!=='park';c.save();c.translate(L.x,L.y);c.rotate(L.a);const l=LIMO_LEN,w=LIMO_WID,h=l/2,q=w/2;
  c.fillStyle='rgba(0,0,0,.38)';rr(c,-h+3,-q+4,l,w,8);c.fill();
  // headlight beams when it's going somewhere
  if(moving&&!L.rev){c.save();c.globalCompositeOperation='lighter';const g=c.createLinearGradient(h,0,h+70,0);g.addColorStop(0,'rgba(254,249,195,.35)');g.addColorStop(1,'rgba(254,249,195,0)');c.fillStyle=g;c.beginPath();c.moveTo(h,-q+3);c.lineTo(h+70,-q-14);c.lineTo(h+70,q+14);c.lineTo(h,q-3);c.closePath();c.fill();c.restore();}
  // tyres: two pairs, and a middle pair for the stretch
  c.fillStyle='#0b0c10';for(const x of [-h+10,-4,h-16])for(const y of [-q-2,q-4]){rr(c,x,y,13,6,2.5);c.fill();}
  // the body: pearl white, gold pinstripe
  let g=c.createLinearGradient(0,-q,0,q);g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#e7e9ee');g.addColorStop(1,'#b8bcc6');c.fillStyle=g;rr(c,-h,-q,l,w,7);c.fill();
  c.strokeStyle='#d4a937';c.lineWidth=1;rr(c,-h+3,-q+3,l-6,w-6,5);c.stroke();
  // windows: windscreen, a long run of tinted glass down each side, the back window
  c.fillStyle='#111827';rr(c,h-22,-q+3,9,w-6,3);c.fill();rr(c,-h+6,-q+4,8,w-8,3);c.fill();c.fillRect(-h+18,-q+2.5,l-46,3.4);c.fillRect(-h+18,q-5.9,l-46,3.4);
  c.fillStyle='rgba(147,197,253,.35)';c.fillRect(h-20,-q+4,2,w-8);c.fillRect(-h+20,-q+3,l-50,1);
  // roof with a sunroof and a gold star
  c.fillStyle='#f8fafc';rr(c,-h+16,-q+6.5,l-44,w-13,3);c.fill();c.fillStyle='#1f2937';rr(c,-6,-4,14,8,2);c.fill();c.save();c.translate(1,0);c.fillStyle='#fbbf24';c.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,R=k%2?1.4:3.2;c.lineTo(Math.cos(a)*R,Math.sin(a)*R);}c.closePath();c.fill();c.restore();
  // bonnet ornament, chrome bumpers, lights
  c.fillStyle='#cbd5e1';c.fillRect(h-2,-q+2,2.5,w-4);c.fillRect(-h-.5,-q+2,2.5,w-4);c.fillStyle='#d4a937';c.beginPath();c.arc(h-6,0,1.8,0,TAU);c.fill();
  c.fillStyle=moving&&!L.rev?'#fef9c3':'#fde68a';c.fillRect(h-2.5,-q+3,3,4);c.fillRect(h-2.5,q-7,3,4);c.fillStyle=L.rev||L.mode==='park'?'#ef4444':'#991b1b';c.fillRect(-h,-q+3,2.5,4);c.fillRect(-h,q-7,2.5,4);
  if(L.rev){c.fillStyle='#f8fafc';c.fillRect(-h,-1.5,2,3);}
  c.restore();}
function drawValet(c,x,y,t){c.save();c.translate(x,y);c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,9,5,1.8,0,0,TAU);c.fill();c.fillStyle='#111827';c.fillRect(-2.6,2,2,7);c.fillRect(.6,2,2,7);
  c.fillStyle='#b91c1c';rr(c,-3.6,-5,7.2,8,1.6);c.fill();c.fillStyle='#fbbf24';c.fillRect(-.4,-4.6,.8,7);c.fillStyle='#e8c9a4';c.beginPath();c.arc(0,-7.6,2.6,0,TAU);c.fill();
  c.fillStyle='#b91c1c';c.fillRect(-2.8,-10.6,5.6,1.8);c.fillStyle='#111827';c.fillRect(-1.8,-11,3.6,.8);
  const wave=Math.sin(t*3)>.6;c.strokeStyle='#b91c1c';c.lineWidth=1.6;c.lineCap='round';c.beginPath();c.moveTo(3,-3.5);c.lineTo(5.5,wave?-9:-1);c.stroke();c.restore();}
function drawLimoGround(c,t){const L=G.limo;if(!L)return;
  for(const s of L.skid||[]){const a=1-(G.time-s.t)/2.5;c.save();c.translate(s.x,s.y);c.rotate(s.a);c.strokeStyle=`rgba(20,20,24,${.45*a})`;c.lineWidth=3;for(const y of [-9,9]){c.beginPath();c.moveTo(-40,y);c.lineTo(-4,y+Math.sin(s.t)*2);c.stroke();}c.restore();}
  if(L.mode!=='park')return;
  // red carpet up to the casino, a valet at the kerb
  const top=(BASE.r0+BASE.h)*TILE-2,x=LIMO_PARK.x-6;c.save();c.fillStyle='#7f1d1d';c.fillRect(x-7,top,14,L.y-top-10);c.fillStyle='#b91c1c';c.fillRect(x-5.5,top,11,L.y-top-10);
  c.fillStyle='#fbbf24';for(const sx of [-7,7]){c.fillRect(x+sx-.6,top+2,1.2,L.y-top-14);}c.restore();
  drawLimoCar(c,L,t);drawValet(c,L.x+LIMO_LEN*.5+10,L.y-6,t);}
{const _g=drawGroundWarn;drawGroundWarn=function(c,t){_g(c,t);if(!G)return;try{drawLimoGround(c,t);}catch(e){}};}
{const _t=drawTopWarn;drawTopWarn=function(c,t){_t(c,t);if(!G||!G.limo)return;const L=G.limo;try{if(L.mode!=='park')drawLimoCar(c,L,t);
  if(G.mode==='limo'&&typeof hover!=='undefined'&&hover){const a=Math.atan2(hover.y-L.y,hover.x-L.x),d=Math.min(520,Math.hypot(hover.x-L.x,hover.y-L.y)+40);c.save();c.translate(L.x,L.y);c.rotate(a);
    c.fillStyle='rgba(253,224,71,.12)';c.fillRect(0,-LIMO_WID/2-4,d,LIMO_WID+8);c.strokeStyle='rgba(253,224,71,.7)';c.lineWidth=1.5;c.setLineDash([6,5]);c.lineDashOffset=-t*40;c.strokeRect(0,-LIMO_WID/2-4,d,LIMO_WID+8);c.setLineDash([]);
    c.fillStyle='#fde047';c.beginPath();c.moveTo(d+10,0);c.lineTo(d-4,-9);c.lineTo(d-4,9);c.closePath();c.fill();c.restore();}}catch(e){}};}
