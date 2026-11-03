'use strict';
/* ============ ALL IN — bad luck that makes you move ============
   Back-Alley Thugs climb out of manholes near the casino (behind your lines), after a warning glow.
   The Cooler halves the attack speed of every creature near it.
   The Debt Bulldozer flattens velvet ropes and shoves creatures out of its lane; stuns barely slow it. */

/* ---------- the manholes by the casino ---------- */
const MANHOLES=[[27.5,4.4],[26.5,14.8],[32.2,4.5],[31.6,15.3]].map(([c,r])=>{let x=c*TILE,y=r*TILE;
  if(typeof walkable==='function'&&!walkable(x,y,10)){for(let d=6;d<90;d+=6){let f=false;for(const [dx,dy] of [[0,d],[0,-d],[d,0],[-d,0]])if(walkable(x+dx,y+dy,10)){x+=dx;y+=dy;f=true;break;}if(f)break;}}
  return [x,y];});
// the thugs of a round come out of the manholes in a fixed order, so every game plays the same
{const _sw=startWave;startWave=function(){_sw.apply(this,arguments);let n=0;G.mhQ=[];for(const q of G.spawnQ)if(q.k==='thug'){q.mh=n%MANHOLES.length;G.mhQ.push(q.mh);n++;}};}
{const _sp=spawnEnemy;spawnEnemy=function(k){const e=_sp.apply(this,arguments);
  if(k==='thug'){const i=G.mhQ&&G.mhQ.length?G.mhQ.shift():(Math.random()*MANHOLES.length)|0,[x,y]=MANHOLES[i];e.x=x+(rnd()-.5)*6;e.y=y+(rnd()-.5)*6;e.face=-1;
    G.fx.push({t:'ring',x,y,r0:4,r1:34,col:'#fb923c',life:.5,max:.5,w:3});for(let j=0;j<10&&G.parts.length<470;j++)G.parts.push({x,y,vx:(rnd()-.5)*40,vy:-20-rnd()*40,life:.8,max:.8,col:'#a8a29e',size:4+rnd()*3,smoke:true});
    if(!G.ambushT||G.time-G.ambushT>6){G.ambushT=G.time;floatText(x,y-22,'Ambush!','#fb923c',13);Snd.play('slam');}}
  return e;};}

/* ---------- the Cooler's chill, and the Bulldozer's push ---------- */
const COOL_R=125;
{const _us=uStat;uStat=function(u){const s=_us(u);if(u.coolT>0)s.rate*=.5;return s;};}
{const _ue=updateEnemy;updateEnemy=function(e,dt){
  if(e.k==='dozer'&&!e.dead){if(e.stun>.15)e.stun=.15;e.slow=Math.min(e.slow||0,.25);_ue(e,dt);if(e.dead)return;dozerWork(e,dt);return;}
  return _ue(e,dt);};}
function dozerWork(e,dt){
  // flatten any velvet rope it touches
  const c=Math.floor(e.x/TILE),r=Math.floor(e.y/TILE);let crunched=0;
  for(let dc=-1;dc<=1;dc++)for(let dr=-1;dr<=1;dr++){const cc=c+dc,rr=r+dr;if(cc<0||rr<0||cc>=COLS||rr>=ROWS)continue;const i=gi(cc,rr);if(grid[i]!==2)continue;
    const tx=cc*TILE+15,ty=rr*TILE+15;if(Math.hypot(tx-e.x,ty-e.y)>e.r+TILE*.75)continue;grid[i]=0;G.barricades=Math.max(0,G.barricades-1);crunched++;
    for(let j=0;j<10;j++)spark(tx,ty,j%2?'#c0193f':'#facc15',140,.5);}
  if(crunched){computeFlow();floatText(e.x,e.y-e.r-12,'CRUNCH','#facc15',13);G.shake=Math.min(6,G.shake+2);Snd.play('slam');
    if(!G.dozerWarn){G.dozerWarn=1;gameLog('A Debt Bulldozer is flattening your velvet ropes.','bad');}}
  // shove creatures out of its lane
  const fx=e.fx||1,fy=e.fy||0;
  for(const u of G.units){if(u.dead||u.jump)continue;const dx=u.x-e.x,dy=u.y-e.y,d=Math.hypot(dx,dy);if(d>e.r+u.r+8)continue;
    const side=(dx*fy-dy*fx)>=0?1:-1,px=-fy*side,py=fx*side,mv=150*dt;
    if(walkable(u.x+px*mv,u.y+py*mv,u.r)){u.x+=px*mv;u.y+=py*mv;}else if(walkable(u.x+fx*mv,u.y+fy*mv,u.r)){u.x+=fx*mv;u.y+=fy*mv;}
    hurtUnit(u,e.def.dmg*waveDmgMult()*dt*1.5);if(!(u.stunT>0)){u.stunT=.35;if(!u.shovedT||G.time-u.shovedT>1.5){u.shovedT=G.time;floatText(u.x,u.y-u.r-10,'shoved','#fde68a',9);}}}}
{const _u=update;update=function(dt){_u(dt);
  for(const u of G.units)if(u.coolT>0)u.coolT-=dt;
  for(const e of G.enemies){if(e.k!=='cooler'||e.dead||e.stun>0)continue;for(const u of G.units)if(!u.dead&&Math.hypot(u.x-e.x,u.y-e.y)<COOL_R+u.r)u.coolT=.3;}};}
{const _ts=targetScore;targetScore=function(e,x,y){return _ts(e,x,y)-(e.k==='cooler'?55:e.k==='thug'&&Math.hypot(e.x-BASE.x,e.y-BASE.y)<260?35:0);};}

/* ---------- telegraphs ---------- */
function drawEnemyGround(c,t){if(!G)return;
  // manhole covers, and a glow when something is about to climb out
  const soon=new Map();if(G.phase==='wave')for(const q of G.spawnQ){if(q.k!=='thug'||q.mh==null)continue;const dt2=q.t-G.time;if(dt2<2.4&&!soon.has(q.mh))soon.set(q.mh,dt2);}
  MANHOLES.forEach(([x,y],i)=>{const w=soon.get(i);c.save();
    if(w!=null){const k=1-w/2.4,p=.5+.5*Math.sin(t*12);c.fillStyle=`rgba(251,146,60,${.15+.25*k})`;c.beginPath();c.arc(x,y,16+k*14,0,TAU);c.fill();c.strokeStyle=`rgba(251,146,60,${.5+.5*p})`;c.lineWidth=2.5;c.beginPath();c.arc(x,y,12+k*16,0,TAU);c.stroke();}
    c.fillStyle='#1c1a22';c.beginPath();c.ellipse(x,y-(w!=null?2+Math.sin(t*20)*1.5:0),9,6,0,0,TAU);c.fill();c.strokeStyle='#3a3644';c.lineWidth=1.2;c.stroke();
    c.strokeStyle='#2c2934';c.lineWidth=1;for(let k=-1;k<=1;k++){c.beginPath();c.moveTo(x-6,y+k*2.4);c.lineTo(x+6,y+k*2.4);c.stroke();}
    if(w!=null){c.font='14px Bungee,Impact';c.textAlign='center';c.fillStyle='#fb923c';c.strokeStyle='#0b0612';c.lineWidth=3.5;c.strokeText('!',x,y-16);c.fillText('!',x,y-16);}
    c.restore();});
  // the Cooler's chill
  for(const e of G.enemies){if(e.k!=='cooler'||e.dead||e.hidden)continue;c.save();const g=c.createRadialGradient(e.x,e.y,10,e.x,e.y,COOL_R);g.addColorStop(0,'rgba(125,211,252,.18)');g.addColorStop(1,'rgba(125,211,252,0)');
    c.fillStyle=g;c.beginPath();c.arc(e.x,e.y,COOL_R,0,TAU);c.fill();c.strokeStyle='rgba(186,230,253,.55)';c.lineWidth=1.5;c.setLineDash([3,6]);c.lineDashOffset=t*12;c.beginPath();c.arc(e.x,e.y,COOL_R,0,TAU);c.stroke();c.restore();}
  // where the bulldozer is headed
  for(const e of G.enemies){if(e.k!=='dozer'||e.dead)continue;const fx=e.fx||1,fy=e.fy||0;c.save();c.globalAlpha=.25+.15*Math.sin(t*4);c.fillStyle='#facc15';
    c.beginPath();c.moveTo(e.x+fx*(e.r+10)-fy*e.r,e.y+fy*(e.r+10)+fx*e.r);c.lineTo(e.x+fx*(e.r+70),e.y+fy*(e.r+70));c.lineTo(e.x+fx*(e.r+10)+fy*e.r,e.y+fy*(e.r+10)-fx*e.r);c.closePath();c.fill();c.restore();}}
function drawEnemyTop(c,t){if(!G)return;
  // a snowflake over every chilled creature
  for(const u of G.units){if(!(u.coolT>0)||u.dead)continue;const y=u.y-u.r*2.3-6;c.save();c.strokeStyle='#bae6fd';c.lineWidth=1.4;c.translate(u.x+u.r,y);c.rotate(t);
    for(let k=0;k<3;k++){c.rotate(Math.PI/3);c.beginPath();c.moveTo(-4,0);c.lineTo(4,0);c.stroke();}c.restore();}}
{const _g=drawGroundWarn;drawGroundWarn=function(c,t){_g(c,t);drawEnemyGround(c,t);};}
{const _t=drawTopWarn;drawTopWarn=function(c,t){_t(c,t);drawEnemyTop(c,t);};}
