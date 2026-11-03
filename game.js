'use strict';
/* ============ ALL IN — world, RTS, combat ============ */
let G=null;
const grid=new Uint8Array(COLS*ROWS);       // 0 open, 1 table, 2 barricade, 3 casino, 4 vault
const flow=new Float32Array(COLS*ROWS);
const gi=(c,r)=>r*COLS+c;
const BASE={c0:36,r0:8,w:4,h:5};BASE.x=(BASE.c0+BASE.w/2)*TILE;BASE.y=(BASE.r0+BASE.h/2)*TILE;
const VAULT={c0:35,r0:2,w:3,h:2};VAULT.x=(VAULT.c0+1.5)*TILE;VAULT.y=(VAULT.r0+1)*TILE;
BASE.fx=BASE.c0*TILE-26;
const SPAWN={x:6,y:10*TILE,c:0,r:9};
const OBST=[
  {c:4,r:0,w:5,h:3,k:'motel',name:'Starlite Motel'},{c:13,r:0,w:4,h:2,k:'chapel',name:'Little Neon Chapel'},{c:21,r:0,w:6,h:3,k:'arcade',name:'Penny Arcade'},{c:29,r:0,w:4,h:2,k:'pawn',name:'Pawn Shop'},
  {c:6,r:17,w:4,h:3,k:'diner',name:'All-Night Diner'},{c:14,r:18,w:5,h:2,k:'lounge',name:'Velvet Lounge'},{c:23,r:17,w:5,h:3,k:'hotel',name:'Desert Rose Hotel'},{c:31,r:18,w:3,h:2,k:'cinema',name:'Drive-In'},
  {c:10,r:8,w:2,h:3,k:'palms',name:'Palm island'},{c:18,r:8,w:3,h:4,k:'fountain',name:'Dancing fountain'},{c:28,r:9,w:2,h:3,k:'palms',name:'Palm island'}];
const NO_BUILD=new Set();
function setupMap(){
  grid.fill(0);
  for(const o of OBST)for(let c=o.c;c<o.c+o.w;c++)for(let r=o.r;r<o.r+o.h;r++)grid[gi(c,r)]=1;
  for(let c=BASE.c0;c<BASE.c0+BASE.w;c++)for(let r=BASE.r0;r<BASE.r0+BASE.h;r++)grid[gi(c,r)]=3;
  for(let c=VAULT.c0;c<VAULT.c0+VAULT.w;c++)for(let r=VAULT.r0;r<VAULT.r0+VAULT.h;r++)grid[gi(c,r)]=4;
  NO_BUILD.clear();for(let c=0;c<3;c++)for(let r=8;r<12;r++)NO_BUILD.add(gi(c,r));
  for(let c=BASE.c0-1;c<=BASE.c0+BASE.w;c++)for(let r=BASE.r0-1;r<=BASE.r0+BASE.h;r++)if(c>=0&&r>=0&&c<COLS&&r<ROWS)NO_BUILD.add(gi(c,r));
  computeFlow();
}
const open=(c,r)=>c>=0&&r>=0&&c<COLS&&r<ROWS&&grid[gi(c,r)]===0;
const NB=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
function computeFlow(){
  flow.fill(Infinity);const q=[];
  for(let c=BASE.c0-1;c<=BASE.c0+BASE.w;c++)for(let r=BASE.r0-1;r<=BASE.r0+BASE.h;r++)if(open(c,r)){flow[gi(c,r)]=0;q.push(gi(c,r));}
  // simple Dijkstra with bucket-ish array (grid is tiny)
  while(q.length){let bi=0;for(let i=1;i<q.length;i++)if(flow[q[i]]<flow[q[bi]])bi=i;const cur=q[bi];q[bi]=q[q.length-1];q.pop();
    const c=cur%COLS,r=(cur/COLS)|0,d=flow[cur];
    for(const [dc,dr,w] of NB){const nc=c+dc,nr=r+dr;if(!open(nc,nr))continue;if(dc&&dr&&(!open(c+dc,r)||!open(c,r+dr)))continue;
      const ni=gi(nc,nr);if(d+w<flow[ni]-1e-6){if(flow[ni]===Infinity)q.push(ni);flow[ni]=d+w;}}}
}
function canBarricade(c,r){
  if(!open(c,r)||NO_BUILD.has(gi(c,r)))return 'blocked';
  const x0=c*TILE,y0=r*TILE;
  for(const e of G.enemies)if(e.x>x0-6&&e.x<x0+TILE+6&&e.y>y0-6&&e.y<y0+TILE+6)return 'occupied';
  for(const u of G.units)if(u.x>x0-4&&u.x<x0+TILE+4&&u.y>y0-4&&u.y<y0+TILE+4)return 'occupied';
  grid[gi(c,r)]=2;computeFlow();
  let ok=flow[gi(SPAWN.c,SPAWN.r)]<Infinity&&flow[gi(SPAWN.c,SPAWN.r+1)]<Infinity;
  if(ok)for(const e of G.enemies){const ec=clamp(Math.floor(e.x/TILE),0,COLS-1),er=clamp(Math.floor(e.y/TILE),0,ROWS-1);if(grid[gi(ec,er)]===0&&flow[gi(ec,er)]===Infinity){ok=false;break;}}
  grid[gi(c,r)]=0;computeFlow();
  return ok?'':'seal';
}
function placeBarricade(c,r){
  if(G.me.chips<10){toast('A velvet rope costs 10 chips');Snd.play('error');return false;}
  const why=canBarricade(c,r);
  if(why){toast(why==='seal'?'You can\'t seal the path completely':why==='occupied'?'Something is standing there':'Can\'t build there');Snd.play('error');return false;}
  G.me.chips-=10;grid[gi(c,r)]=2;computeFlow();G.barricades++;Snd.play('build');
  for(let i=0;i<6;i++)spark(c*TILE+15,r*TILE+15,'#e9c46a',60,.4);return true;
}
function removeBarricade(c,r){if(grid[gi(c,r)]!==2)return false;grid[gi(c,r)]=0;computeFlow();G.me.chips+=5;G.barricades--;Snd.play('sell');floatText(c*TILE+15,r*TILE+8,'+5','#e9c46a',11);return true;}

/* ---------- A* for creatures ---------- */
function findPath(sx,sy,tx,ty){
  let sc=clamp(Math.floor(sx/TILE),0,COLS-1),sr=clamp(Math.floor(sy/TILE),0,ROWS-1);
  let tc=clamp(Math.floor(tx/TILE),0,COLS-1),tr=clamp(Math.floor(ty/TILE),0,ROWS-1);
  if(!open(tc,tr)){let best=null,bd=1e9;for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(open(c,r)){const d=(c-tc)**2+(r-tr)**2;if(d<bd){bd=d;best=[c,r];}}if(!best)return [];[tc,tr]=best;tx=tc*TILE+15;ty=tr*TILE+15;}
  if(!open(sc,sr)){for(const [dc,dr] of NB)if(open(sc+dc,sr+dr)){sc+=dc;sr+=dr;break;}}
  const N=COLS*ROWS,g=new Float32Array(N).fill(Infinity),from=new Int32Array(N).fill(-1),closed=new Uint8Array(N);
  const s=gi(sc,sr),t=gi(tc,tr);g[s]=0;const openL=[s];const hf=i=>{const c=i%COLS,r=(i/COLS)|0;return Math.hypot(c-tc,r-tr);};
  while(openL.length){let bi=0,bf=1e9;for(let i=0;i<openL.length;i++){const f=g[openL[i]]+hf(openL[i]);if(f<bf){bf=f;bi=i;}}
    const cur=openL[bi];openL[bi]=openL[openL.length-1];openL.pop();if(cur===t)break;if(closed[cur])continue;closed[cur]=1;
    const c=cur%COLS,r=(cur/COLS)|0;
    for(const [dc,dr,w] of NB){const nc=c+dc,nr=r+dr;if(!open(nc,nr))continue;if(dc&&dr&&(!open(c+dc,r)||!open(c,r+dr)))continue;const ni=gi(nc,nr);
      if(g[cur]+w<g[ni]){g[ni]=g[cur]+w;from[ni]=cur;openL.push(ni);}}}
  if(from[t]<0&&t!==s)return [[tx,ty]];
  const pts=[];let c=t;while(c!==s&&c>=0){pts.push([(c%COLS)*TILE+15,((c/COLS)|0)*TILE+15]);c=from[c];}
  pts.reverse();if(pts.length)pts[pts.length-1]=[tx,ty];else pts.push([tx,ty]);
  // string-pull
  const out=[];let ax=sx,ay=sy,i=0;
  while(i<pts.length){let j=pts.length-1;while(j>i&&!los(ax,ay,pts[j][0],pts[j][1]))j--;out.push(pts[j]);[ax,ay]=pts[j];i=j+1;}
  return out;
}
function los(x1,y1,x2,y2){const d=Math.hypot(x2-x1,y2-y1),n=Math.ceil(d/8);for(let k=1;k<=n;k++){const x=x1+(x2-x1)*k/n,y=y1+(y2-y1)*k/n;
  for(const [ox,oy] of [[-6,-6],[6,-6],[-6,6],[6,6]])if(!open(Math.floor((x+ox)/TILE),Math.floor((y+oy)/TILE)))return false;}return true;}
function walkable(x,y,r){r=r*.6;for(const [ox,oy] of [[-r,-r],[r,-r],[-r,r],[r,r]]){const c=Math.floor((x+ox)/TILE),rr=Math.floor((y+oy)/TILE);if(!open(c,rr))return false;}return x>2&&y>2&&x<W-2&&y<H-2;}
function stepToward(o,tx,ty,spd,dt){
  const ox=o.x,oy=o.y,res=stepToward0(o,tx,ty,spd,dt);if(o.walk!==undefined)o.walk+=Math.hypot(o.x-ox,o.y-oy);return res;}
function stepToward0(o,tx,ty,spd,dt){
  const dx=tx-o.x,dy=ty-o.y,d=Math.hypot(dx,dy);if(d<.5)return true;const mv=Math.min(d,spd*dt),nx=o.x+dx/d*mv,ny=o.y+dy/d*mv;
  if(Math.abs(dx)>1)o.face=dx>0?1:-1;
  if(walkable(nx,ny,o.r)){o.x=nx;o.y=ny;}else if(walkable(nx,o.y,o.r))o.x=nx;else if(walkable(o.x,ny,o.r))o.y=ny;else{o.stuck=(o.stuck||0)+dt;}
  return d<=mv+.5;
}

/* ---------- creatures ---------- */
function uStat(u){const d=u.def;let dm=d.dmg*(1+.12*G.up.dmg);if(G.units.some(o=>o.def.sp&&o.def.sp.kingAura))dm*=1.3;if(u.growth)dm*=1+u.growth;if(G.units.some(o=>o.def.sp&&o.def.sp.aura&&o!==u&&Math.hypot(o.x-u.x,o.y-u.y)<150))dm*=1.2;
  dm*=1+.15*(u.rank||0);if(G.decreeT>0)dm*=1.5;let rate=d.rate,range=d.range;if(u.fanT>0)rate*=3;if(u.infT>0){rate*=2;range+=40;}if(u.siegeP>=1){range+=110;dm*=1.8;}
  return {dmg:dm,rate,range,armor:(d.armor||0)+(u.lockT>0?12:0)};}
function tauntR(u){const sp=u.def.sp;let r=sp&&sp.taunt||0;if(u.lockT>0)r=Math.max(r,90)*2;return r;}
function maxHpOf(k,rank){return UNITS[k].hp*(1+.12*G.up.hp)*(1+.15*(rank||0));}
const RANK_AT=[0,8,25,60],RANK_NAME=['','Veteran','Elite','Legend'];
const RANK_MULT={};function rankMult(k){if(RANK_MULT[k])return RANK_MULT[k];const d=UNITS[k];let m=unitDps(k)/Math.max(1,d.dmg*d.rate);if(d.sp&&d.sp.shots)m/=d.sp.shots;if(d.sp&&d.sp.crit)m/=1+d.sp.crit*(d.sp.critX-1);return RANK_MULT[k]=clamp(Math.round(m*2)/2,1,4);}
function rankNeed(k,r){return Math.round(RANK_AT[r]*rankMult(k));}
function rankOf(u){const m=rankMult(u.k);return u.kills>=60*m?3:u.kills>=25*m?2:u.kills>=8*m?1:0;}
function checkRank(u,quiet){const r=rankOf(u);if(r<=(u.rank||0))return;if(r>=3&&typeof Meta!=='undefined'){Meta.ach('legend');if(u.k==='sig_underdog')Meta.ach('underdog');}const f=u.hp/u.maxHp;u.rank=r;u.maxHp=maxHpOf(u.k,r);u.hp=Math.min(u.maxHp,u.maxHp*f+u.maxHp*.25);
  if(quiet)return;G.fx.push({t:'ring',x:u.x,y:u.y,r0:6,r1:44,col:'#ffd27a',life:.6,max:.6,w:3});for(let i=0;i<16;i++)spark(u.x,u.y,'#ffd27a',120,.6);
  floatText(u.x,u.y-u.r-20,RANK_NAME[r]+'!','#ffd27a',14);gameLog(`${u.def.name} is now ${RANK_NAME[r].toLowerCase()==='elite'?'an':'a'} ${RANK_NAME[r]}.`,'good');Snd.play('rankup');}
function makeUnit(k,x,y){
  const d=UNITS[k];const u={id:G.nid++,k,def:d,x,y,r:d.r,hp:maxHpOf(k),maxHp:maxHpOf(k),cd:rnd()*.4,order:{t:'idle'},path:[],anchor:{x,y},target:null,face:1,kills:0,lastHit:-9,born:G.time,bob:rnd()*6,atk:0,
    cds:{},dmgDone:0,rdmg:0,siegeP:0,siegeTo:false,walk:0,spawnT:.45,aim:0,fanT:0,infT:0,lockT:0,jump:null,jh:0};
  G.units.push(u);return u;
}
function spawnHandUnits(k,ev){
  const d=UNITS[k],made=[];
  for(let i=0;i<(d.cnt||1);i++){const a=-Math.PI/2+(rnd()-.5)*2.4;const u=makeUnit(k,BASE.fx-8+Math.cos(a+Math.PI/2)*12,BASE.y+(rnd()-.5)*60);made.push(u);
    u.anchor={x:u.x,y:u.y};G.fx.push({t:'ring',x:u.x,y:u.y,r0:4,r1:34,col:'#e9c46a',life:.6,max:.6,w:3});for(let j=0;j<14;j++)spark(u.x,u.y,'#e9c46a',100,.6);}
  if(ev&&Array.isArray(ev.scoring)&&typeof handFeel==='function')handFeel(k,ev,made);
  G.lastUnitK=k;if(typeof Meta!=='undefined'){Meta.seen(k);if(k==='rf')Meta.ach('royal');if(ev.rank===7)Meta.ach('quads');}G.stats.got[k]=(G.stats.got[k]||0)+(d.cnt||1);G.stats.best=Math.max(G.stats.best,ev.rank);
  gameLog(`${HANDS[ev.rank]}${ev.high?' (high)':''} → ${d.cnt>1?d.cnt+'× ':''}${d.name}`,'good');Snd.play('spawn');
  if(d.sig){banner('Signature hand!',d.sig+' · '+d.name,'great');Snd.play('jackpot');if(typeof Meta!=='undefined')Meta.ach('sig');}
  else if(ev.rank>=4)banner(HANDS[ev.rank],d.name,'great');
  return made;
}
function mergeUnits(a,b){
  if(a.temp||b.temp)return null;const out=mergeResult(a.k,b.k);if(!out)return null;
  const f=(a.hp/a.maxHp+b.hp/b.maxHp)/2,x=(a.x+b.x)/2,y=(a.y+b.y)/2;
  G.units=G.units.filter(u=>u!==a&&u!==b);
  const u=makeUnit(out,walkable(x,y,10)?x:a.x,walkable(x,y,10)?y:a.y);u.spawnT=0;u.popAt=G.time+.3;for(const o of [a,b])G.fx.push({t:'mghost',k:o.k,x0:o.x,y0:o.y,x1:u.x,y1:u.y,face:o.face||1,life:.32,max:.32});u.kills=a.kills+b.kills;u.dmgDone=(a.dmgDone||0)+(b.dmgDone||0);checkRank(u,true);u.hp=u.maxHp*Math.max(.5,f);
  G.sel=G.sel.filter(s=>s!==a&&s!==b);G.sel.push(u);
  for(const grp of G.groups)if(grp){const had=grp.includes(a)||grp.includes(b);for(let i=grp.length-1;i>=0;i--)if(grp[i]===a||grp[i]===b)grp.splice(i,1);if(had)grp.push(u);}
  G.fx.push({t:'ring',x:u.x,y:u.y,r0:40,r1:4,col:'#f0abfc',life:.5,max:.5,w:4});for(let j=0;j<30;j++)spark(u.x,u.y,j%2?'#f0abfc':'#e9c46a',150,.7);
  if(u.def.secret){const first=typeof Meta!=='undefined'&&!Meta.data.seen[u.k];banner(first?'Secret merge!':u.def.name,first?'You discovered '+u.def.name:'Secret merge','great');Snd.play('jackpot');for(let i=0;i<40;i++)spark(u.x,u.y,i%2?'#fde047':'#f0abfc',200,.8);if(typeof Meta!=='undefined'){Meta.ach('secretmerge');if(SECRET_MERGES.every(m=>Meta.data.seen[m[2]]||m[2]===u.k))Meta.ach('allsecret');}}
  G.stats.merges++;if(typeof Meta!=='undefined'){Meta.seen(u.k);Meta.ach('merge1');if(u.def.tier>=3)Meta.ach('summit');if(u.k==='m_house')Meta.ach('house');}Snd.play('merge');gameLog(`Merged into ${u.def.name}`,'good');return u;
}
function mergeNearest(u,partnerKey){
  let best=null,bd=1e9;for(const o of G.units)if(o!==u&&o.k===partnerKey){const d=Math.hypot(o.x-u.x,o.y-u.y);if(d<bd){bd=d;best=o;}}
  if(!best){toast('No '+UNITS[partnerKey].name+' on the field');Snd.play('error');return;}
  return mergeUnits(u,best);
}
/* orders */
function formation(n,x,y){const pts=[];const sp=20;let ring=0,i=0;pts.push([x,y]);while(pts.length<n){ring++;const cnt=ring*6;for(let k=0;k<cnt&&pts.length<n;k++){const a=k/cnt*Math.PI*2;pts.push([x+Math.cos(a)*ring*sp,y+Math.sin(a)*ring*sp]);}}return pts;}
function orderMove(units,x,y,amove){
  if(!units.length)return;const pts=formation(units.length,x,y);
  const sorted=units.slice().sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y));
  sorted.forEach((u,i)=>{let [px,py]=pts[i];if(!walkable(px,py,u.r)){px=x;py=y;}u.order={t:amove?'amove':'move',x:px,y:py};u.path=findPath(u.x,u.y,px,py);u.target=null;u.anchor={x:px,y:py};u.stuck=0;});
  G.marks.push({x,y,t:.6,col:amove?'#f87171':'#4ade80'});Snd.play(amove?'attack':'click');
}
function orderAttack(units,e){for(const u of units){u.order={t:'attack',e};u.target=e;u.path=[];}G.marks.push({x:e.x,y:e.y,t:.6,col:'#f87171',follow:e});Snd.play('attack');}
function orderStop(units){for(const u of units){u.order={t:'idle'};u.anchor={x:u.x,y:u.y};u.path=[];u.target=null;}}
function orderHold(units){for(const u of units){u.order={t:'hold'};u.anchor={x:u.x,y:u.y};u.path=[];u.target=null;}}
function nearestEnemy(x,y,rad,filter){let best=null,bd=rad;for(const e of G.enemies){if(e.dead||e.hidden)continue;const d=Math.hypot(e.x-x,e.y-y)-e.r;if(d<bd&&(!filter||filter(e))){bd=d;best=e;}}return best;}
function followPath(u,dt,spd){
  if(!u.path.length)return true;const [px,py]=u.path[0];
  if(stepToward(u,px,py,spd,dt)){u.path.shift();}
  if(u.stuck>.6){u.stuck=0;const last=u.path[u.path.length-1];if(last)u.path=findPath(u.x,u.y,last[0],last[1]);}
  return !u.path.length;
}
function chase(u,e,dt,spd){
  const d=Math.hypot(e.x-u.x,e.y-u.y);
  if(los(u.x,u.y,e.x,e.y)){u.path=[];stepToward(u,e.x,e.y,spd,dt);}
  else{u.repath=(u.repath||0)-dt;if(u.repath<=0||!u.path.length){u.path=findPath(u.x,u.y,e.x,e.y);u.repath=.6;}followPath(u,dt,spd);}
  return d;
}
function inReach(u,e,st){const d=Math.hypot(e.x-u.x,e.y-u.y)-e.r;return d<=st.range&&(!u.def.minR||d>=u.def.minR);}
function unitPowers(u,dt){const sp=u.def.sp||{};
  if(G.egg&&G.egg.clover&&!G.egg.cloverFound)cloverCheck(u);
  if(sp.goose&&G.phase==='wave'){u.gooseT=(u.gooseT==null?2:u.gooseT)-dt;if(u.gooseT<=0){u.gooseT=2;G.me.chips+=sp.goose;G.stats.earned+=sp.goose;if(G.texts.length<50)floatText(u.x,u.y-u.r-8,'+'+sp.goose,'#fde047',11);if(G.parts.length<460)G.parts.push({x:u.x,y:u.y+u.r*.5,vx:0,vy:20,life:.6,max:.6,col:'#fde047',size:5});}}
  if(u.temp&&G.time>u.expire){u.dead=true;u.noKO=true;for(let i=0;i<10;i++)spark(u.x,u.y,'#e11d48',90,.4);return;}
  if(u.wishT>0)u.wishT-=dt;
  if(sp.chill)for(const e of G.enemies){if(!e.dead&&Math.hypot(e.x-u.x,e.y-u.y)<140){e.slow=Math.max(e.slow,sp.chill*(e.def.boss?.5:1));e.slowT=Math.max(e.slowT||0,.25);}}
  if(sp.summon){u.sumCd=(u.sumCd==null?3:u.sumCd)-dt;if(u.sumCd<=0&&nearestEnemy(u.x,u.y,280)){const SK=typeof sp.summon==='string'?sp.summon:'m_bouncer',dogs=SK==='m_dog';u.sumCd=sp.sumCd||10;for(let k=0;k<(sp.sumN||2);k++){const a=rnd()*TAU,b=makeUnit(SK,u.x+Math.cos(a)*26,u.y+Math.sin(a)*20);b.temp=true;b.expire=G.time+(sp.sumLife||14);b.anchor={x:b.x,y:b.y};if(dogs)b.num=k+2;}
    G.fx.push({t:'ring',x:u.x,y:u.y,r0:8,r1:50,col:'#fbbf24',life:.4,max:.4,w:3});floatText(u.x,u.y-u.r-14,dogs?'And they\'re off!':'Bouncers!','#fde68a',12);Snd.play('spawn');}}
  if(sp.heal){u.healCd=(u.healCd==null?1:u.healCd)-dt;if(u.healCd<=0){u.healCd=1.1;let lo=null,lf=.97;for(const o of G.units){if(o===u||o.dead)continue;const f=o.hp/o.maxHp;if(f<lf&&Math.hypot(o.x-u.x,o.y-u.y)<180){lf=f;lo=o;}}
      if(lo){const amt=lo.maxHp*.07+u.def.dmg*1.5;lo.hp=Math.min(lo.maxHp,lo.hp+amt);G.fx.push({t:'beam',x1:u.x,y1:u.y-u.r,x2:lo.x,y2:lo.y,col:'#5eead4',life:.25,max:.25,w:1});for(let i=0;i<4;i++)spark(lo.x,lo.y,'#99f6e4',50,.4);}}
    u.wishCd=(u.wishCd==null?4:u.wishCd)-dt;if(u.wishCd<=0){u.wishCd=7;const near=G.units.filter(o=>o!==u&&!o.dead&&Math.hypot(o.x-u.x,o.y-u.y)<180).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y)).slice(0,3);
      for(const o of near){o.wishT=6;floatText(o.x,o.y-o.r-12,'Wish granted','#99f6e4',10);}if(near.length){Snd.play('magic');u.atk=1;}}}
  if(sp.magnet){u.magCd=(u.magCd==null?2:u.magCd)-dt;if(u.magCd<=0){const vic=G.enemies.filter(e=>!e.dead&&!e.hidden&&!e.def.fly&&Math.hypot(e.x-u.x,e.y-u.y)<165);if(vic.length>=2){u.magCd=5.5;u.atk=1;
      for(const e of vic){const d=Math.hypot(u.x-e.x,u.y-e.y)||1,pull=Math.min(d-u.r-e.r-4,75);if(pull>0&&!e.def.boss){const nx=e.x+(u.x-e.x)/d*pull,ny=e.y+(u.y-e.y)/d*pull;if(walkable(nx,ny,e.r)){e.x=nx;e.y=ny;}}e.stun=Math.max(e.stun||0,e.def.boss?.3:.9);}
      G.fx.push({t:'ring',x:u.x,y:u.y,r0:165,r1:12,col:'#ef4444',life:.45,max:.45,w:4});G.shake=Math.min(6,G.shake+2);Snd.play('slam');floatText(u.x,u.y-u.r-14,'Magnetised!','#fca5a5',12);}}}
  if(sp.stasis){u.stCd=(u.stCd==null?3:u.stCd)-dt;if(u.stCd<=0){const vic=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-u.x,e.y-u.y)<155);if(vic.length>=2){u.stCd=8;u.atk=1;
      for(const e of vic)e.stun=Math.max(e.stun||0,e.def.boss?.5:1.6);G.fx.push({t:'clock',x:u.x,y:u.y,r:155,life:1.6,max:1.6});Snd.play('lock');floatText(u.x,u.y-u.r-14,'Time stops','#fde68a',13);}}}
  if(sp.trap){u.trapCd=(u.trapCd==null?2:u.trapCd)-dt;if(u.trapCd<=0){const e=nearestEnemy(u.x,u.y,u.def.range+120,o=>!o.def.fly);if(e){u.trapCd=4.5;const [px,py]=predict(e,1.4);const mine=G.traps.filter(t=>t.u===u);if(mine.length>=4)G.traps.splice(G.traps.indexOf(mine[0]),1);
      G.traps.push({u,x:px,y:py,r:30,t:20,arm:.5,dmg:uStat(u).dmg*1.6});u.atk=1;Snd.play('magic');}}}
}
function updateUnit(u,dt){
  unitPowers(u,dt);if(u.dead)return;
  if(G.time-u.lastHit>4&&u.hp<u.maxHp)u.hp=Math.min(u.maxHp,u.hp+u.maxHp*.02*dt);
  u.cd-=dt;u.atk=Math.max(0,u.atk-dt*4);u.spawnT=Math.max(0,u.spawnT-dt);
  for(const k in u.cds)u.cds[k]-=dt;if(u.fanT>0)u.fanT-=dt;if(u.infT>0)u.infT-=dt;if(u.lockT>0)u.lockT-=dt;
  if(u.stunT>0){u.stunT-=dt;return;}
  if(u.jump){const j=u.jump;j.t+=dt;const k=Math.min(1,j.t/j.T);u.x=j.sx+(j.tx-j.sx)*k;u.y=j.sy+(j.ty-j.sy)*k;u.jh=Math.sin(k*Math.PI)*42;u.face=j.tx>=j.sx?1:-1;
    if(k>=1){u.jump=null;u.jh=0;if(!walkable(u.x,u.y,u.r)){u.x=j.sx;u.y=j.sy;}for(const e of G.enemies)if(!e.dead&&Math.hypot(e.x-u.x,e.y-u.y)<52+e.r){if(!e.def.boss)e.stun=Math.max(e.stun,.8);hitEnemy(e,j.dmg,u);}
      G.fx.push({t:'shock',x:u.x,y:u.y+u.r*.6,r:52,life:.45,max:.45});G.shake=Math.min(8,G.shake+3);Snd.play('slam');u.anchor={x:u.x,y:u.y};}
    return;}
  {const tp=u.siegeTo?1:0;if(u.siegeP!==tp){u.siegeP=clamp(u.siegeP+(tp?1:-1)*dt/1.1,0,1);u.path=[];return;}}
  const sieged=u.siegeP>=1;
  const st=uStat(u),spd=u.def.spd,aggro=Math.max(st.range+60,130),o=u.order;
  if(sieged&&(o.t==='move'||o.t==='amove')){u.siegeTo=false;return;}
  let tgt=null;
  const pick=(rad)=>nearestEnemy(u.x,u.y,rad,e=>!u.def.minR||Math.hypot(e.x-u.x,e.y-u.y)-e.r>=u.def.minR);
  switch(o.t){
    case 'move':if(followPath(u,dt,spd)){u.order={t:'idle'};u.anchor={x:u.x,y:u.y};}return;
    case 'cast':{const e=o.e;if(e&&e.dead){u.order={t:'idle'};u.anchor={x:u.x,y:u.y};return;}const tx=e?e.x:o.x,ty=e?e.y:o.y,d=Math.hypot(tx-u.x,ty-u.y);
      if(d<=castRange(u,o.ab)){u.face=tx>u.x?1:-1;u.aim=Math.atan2(ty-u.y,tx-u.x);doAbility(u,o.ab,{x:tx,y:ty,e});if(u.order===o){u.order={t:'idle'};u.anchor={x:u.x,y:u.y};}return;}
      if(sieged){u.order={t:'idle'};toast('Out of range while sieged');return;}
      if(los(u.x,u.y,tx,ty)){u.path=[];stepToward(u,tx,ty,spd,dt);}else{if(!u.path.length||u.repath<=0){u.path=findPath(u.x,u.y,tx,ty);u.repath=.6;}u.repath-=dt;followPath(u,dt,spd);}return;}
    case 'attack':if(!o.e||o.e.dead){u.order={t:'idle'};u.anchor={x:u.x,y:u.y};return;}tgt=o.e;if(sieged&&!inReach(u,tgt,st))return;break;
    case 'hold':tgt=(u.target&&!u.target.dead&&inReach(u,u.target,st))?u.target:pick(st.range);if(!tgt)return;if(!inReach(u,tgt,st))return;break;
    case 'amove':tgt=(u.target&&!u.target.dead&&Math.hypot(u.target.x-u.x,u.target.y-u.y)<aggro+40)?u.target:pick(aggro);
      if(!tgt){u.target=null;if(followPath(u,dt,spd)){u.order={t:'idle'};u.anchor={x:u.x,y:u.y};}return;}break;
    default:{
      if(sieged){tgt=(u.target&&!u.target.dead&&inReach(u,u.target,st))?u.target:pick(st.range);if(!tgt||!inReach(u,tgt,st))return;break;}
      const leash=Math.hypot(u.x-u.anchor.x,u.y-u.anchor.y);
      tgt=(u.target&&!u.target.dead&&leash<200)?u.target:(leash<170?pick(aggro):null);
      if(!tgt&&Math.hypot(u.anchor.x-BASE.x,u.anchor.y-BASE.y)<320){const a2=G.enemies.find(x=>!x.dead&&x.atCasino);if(a2)tgt=a2;}
      if(!tgt){u.target=null;if(leash>6){if(!u.path.length||u.repath<=0){u.path=findPath(u.x,u.y,u.anchor.x,u.anchor.y);u.repath=1;}u.repath-=dt;followPath(u,dt,spd);}return;}
    }
  }
  u.target=tgt;
  if(inReach(u,tgt,st)){u.path=[];u.face=tgt.x>u.x?1:-1;if(u.cd<=0){attack(u,tgt,st);u.cd=1/st.rate;}}
  else if(o.t!=='hold'&&!sieged)chase(u,tgt,dt,spd);
}
function throwEnemy(u,e,st){const a=u.aim,D=70;let nx=e.x+Math.cos(a)*D,ny=e.y+Math.sin(a)*D;if(!walkable(nx,ny,e.r)){nx=e.x+Math.cos(a)*D*.4;ny=e.y+Math.sin(a)*D*.4;if(!walkable(nx,ny,e.r)){nx=e.x;ny=e.y;}}
  hitEnemy(e,st.dmg,u);e.x=nx;e.y=ny;e.flyAt=G.time;e.stun=Math.max(e.stun||0,.9);
  setTimeout(()=>{if(!G)return;splashAt(nx,ny,48,st.dmg*.7,u,'#facc15');G.shake=Math.min(7,G.shake+2.5);Snd.play('slam');},300);
  floatText(e.x,e.y-e.r-12,'SLAM!','#facc15',13);G.fx.push({t:'slash',st:'punch',x:e.x,y:e.y,ux:u.x,uy:u.y,a,r:22,col:'#fde68a',life:.24,max:.24,seed:rnd()*9});Snd.play('punch');}
function reelSpin(u,st){const r=rnd(),x=u.x,y=u.y-u.r-16;
  if(r<.12){floatText(x,y,'7  7  7','#fde047',15);Snd.play('jackpot');const pool=G.enemies.filter(o=>!o.dead&&!o.hidden&&Math.hypot(o.x-u.x,o.y-u.y)-o.r<=st.range+40);
    for(let k=0;k<8&&pool.length;k++){const t=pool[(rnd()*pool.length)|0];G.proj.push({sx:u.x,sy:u.y-u.r*.4,x:u.x,y:u.y-u.r*.4,tg:t,tx:t.x,ty:t.y,spd:620,dmg:st.dmg*2,u,col:'#fde047',st:'laser',delay:k*.05,size:3});}G.fx.push({t:'jackpot',x:u.x,y:u.y,life:1,max:1});return true;}
  if(r<.32){floatText(x,y,'CHERRIES','#fb7185',12);for(const o of G.units)if(!o.dead&&Math.hypot(o.x-u.x,o.y-u.y)<140){o.hp=Math.min(o.maxHp,o.hp+o.maxHp*.12);for(let i=0;i<3;i++)spark(o.x,o.y,'#fb7185',50,.4);}Snd.play('coin');return false;}
  if(r<.52){floatText(x,y,'BAR  BAR  BAR','#e5e7eb',12);for(const o of G.enemies)if(!o.dead&&!o.def.boss&&Math.hypot(o.x-u.x,o.y-u.y)<st.range)o.stun=Math.max(o.stun||0,.8);G.fx.push({t:'ring',x:u.x,y:u.y,r0:10,r1:st.range,col:'#e5e7eb',life:.4,max:.4,w:3});Snd.play('slam');return false;}
  return false;}
/* attack flourishes that match the creature, not a one-size muzzle flash */
function breathPal(L){if(L.b==='wyrm')return ['#fffbeb','#fde047','#d97706'];if(L.genie)return ['#fff7ed','#fbbf24','#ea580c'];if(L.crown&&L.jade)return ['#ffffff','#a7f3d0','#059669'];if(L.big)return ['#fefce8','#fde047','#15803d'];if(L.jade)return ['#fffbeb','#fde68a','#0d9488'];return ['#f0fdf4','#86efac','#16a34a'];}
function attackStyle(u){const L=u.def.look,arms=L.arms||[];
  if(L.b==='tank'||L.b==='drake'||L.b==='hydra'||L.b==='wyrm'||L.b==='wheel'||L.sonic)return null;if(L.b==='kraken'||L.inky)return 'ink';if(L.b==='whale')return 'water';if(L.b==='crab')return 'lob';
  if(arms.includes('missile')||L.shot==='missile')return 'missile';
  if(L.shot==='laser')return 'laser';
  if(L.weapon==='rifle'||L.weapon==='revolver'||L.shot==='slug'||arms.includes('cannon'))return 'gun';
  if(u.def.kind==='chain'||L.b==='dealer')return 'zap';
  return 'magic';}
function attackFx(u){if(G.fx.length>170)return;const st=attackStyle(u);if(!st)return;const L=u.def.look,a=u.aim,c2=L.c2&&L.c2.length===7?L.c2:L.beam||'#fde68a';
  const hx=u.x+Math.cos(a)*u.r*1.15,hy=u.y-u.r*.35+Math.sin(a)*u.r*.6;
  if(st==='gun'||st==='laser')G.fx.push({t:'muzzle',x:hx,y:hy,a,big:u.def.kind==='pierce'||u.def.kind==='artillery',laser:st==='laser',life:.09,max:.09});
  else if(st==='missile'){const sx=u.x-u.face*u.r*.35,sy=u.y-u.r*1.15;G.fx.push({t:'ring',x:sx,y:sy,r0:3,r1:14,col:'rgba(220,220,230,.8)',life:.3,max:.3,w:2});for(let k=0;k<5&&G.parts.length<470;k++)G.parts.push({x:sx,y:sy,vx:(rnd()-.5)*50,vy:-20-rnd()*40,life:.6,max:.6,col:'#9ca3af',size:4+rnd()*3,smoke:true});}
  else if(st==='water'){const sx=u.x+u.r*.1,sy=u.y-u.r*.9;for(let k=0;k<10&&G.parts.length<470;k++){const an=-Math.PI/2+(rnd()-.5)*1.4,v=70+rnd()*80;G.parts.push({x:sx,y:sy,vx:Math.cos(an)*v,vy:Math.sin(an)*v,life:.5,max:.5,col:k%2?'#bfdbfe':'#60a5fa',size:2.5+rnd()*2});}}
  else if(st==='ink'){const sx=u.x,sy=u.y-u.r*.95;for(let k=0;k<9&&G.parts.length<470;k++){const an=-Math.PI/2+(rnd()-.5)*1.6,v=60+rnd()*70;G.parts.push({x:sx,y:sy,vx:Math.cos(an)*v,vy:Math.sin(an)*v,life:.45,max:.45,col:k%3?'#3b0764':'#7c3aed',size:2.5+rnd()*2});}G.fx.push({t:'ring',x:u.x,y:u.y+u.r*.7,r0:u.r*.6,r1:u.r*1.4,col:'rgba(124,58,237,.6)',life:.28,max:.28,w:2});}
  else if(st==='lob'){G.fx.push({t:'ring',x:u.x,y:u.y+u.r*.7,r0:u.r*.5,r1:u.r*1.5,col:'rgba(214,190,160,.7)',life:.3,max:.3,w:2.5});for(let k=0;k<4&&G.parts.length<470;k++)G.parts.push({x:u.x+(rnd()-.5)*u.r*2,y:u.y+u.r*.7,vx:(rnd()-.5)*40,vy:-12-rnd()*16,life:.5,max:.5,col:'#7a6a5a',size:4,smoke:true});}
  else if(st==='zap')G.fx.push({t:'crackle',x:hx,y:hy-4,col:c2,life:.16,max:.16,seed:rnd()*999});
  else G.fx.push({t:'sparkle',x:hx,y:hy,col:c2,life:.24,max:.24,rot:rnd()*3});}
function attack(u,e,st){
  const sp=u.def.sp||{},kind=u.def.kind;u.atk=1;u.aim=Math.atan2(e.y-u.y,e.x-u.x);if(Math.abs(e.x-u.x)>2)u.face=e.x>u.x?1:-1;
  const col=u.def.look.c2==='#111'||u.def.look.c2==='#fff'?u.def.look.c1:u.def.look.c2;
  const mk=(tgt,mult,extra)=>({sx:u.x,sy:u.y-u.r*.4,x:u.x,y:u.y-u.r*.4,tg:tgt,tx:tgt.x,ty:tgt.y,spd:520,dmg:st.dmg*(mult||1),u,col,...extra});
  if(kind==='melee'&&sp.throw&&!e.def.boss&&!e.def.mini&&!e.def.fly){throwEnemy(u,e,st);return;}
  if(kind==='melee'){
    const tags=o=>{if(sp.curse)o.curseT=4;if(sp.stun&&rnd()<sp.stun&&!o.def.boss)o.stun=Math.max(o.stun,.5);if(sp.slow){o.slow=Math.max(o.slow,sp.slow*(o.def.boss?.5:1));o.slowT=1.6;}};
    if(sp.cleave){for(const o of G.enemies)if(!o.dead&&Math.hypot(o.x-e.x,o.y-e.y)<sp.cleave+o.r){tags(o);hitEnemy(o,st.dmg*(o===e?1:.6),u);}G.fx.push({t:'ring',x:e.x,y:e.y,r0:6,r1:sp.cleave,col:'#fde68a',life:.25,max:.25,w:2});}
    else{tags(e);hitEnemy(e,st.dmg,u);}
    {const L=u.def.look,arms=L.arms||[],st2=L.b==='hound'||L.b==='chimera'||L.b==='crab'?'claw':L.weapon==='gloves'||L.weapon==='knuckles'||arms.includes('fist')||L.bulk?'punch':L.weapon==='spear'||L.b==='rider'?'thrust':'blade';
     G.fx.push({t:'slash',st:st2,x:e.x,y:e.y,ux:u.x,uy:u.y,a:u.aim,r:Math.max(14,e.r+8)+(sp.cleave?8:0),col:st2==='claw'?'#fecaca':st2==='punch'?'#fde68a':'#e0f2fe',life:.24,max:.24,seed:rnd()*9});
     e.kbAt=G.time;e.kbA=u.aim;e.kbP=Math.min(9,3+st.dmg/12);if(st.dmg>=45||L.bulk||L.b==='robot')G.shake=Math.min(5,G.shake+.5);}
    spark(e.x,e.y,'#fff',60,.2);{const L=u.def.look;Snd.play(L.b==='hound'||L.b==='chimera'||L.b==='crab'?'claw':L.weapon==='gloves'||L.weapon==='knuckles'||(L.arms||[]).includes('fist')||L.bulk?'punch':L.weapon==='spear'||L.b==='rider'?'thrust':'slash');}return;}
  if(kind!=='melee'&&kind!=='cone')attackFx(u);
  if(kind==='ranged'){
    const tg=[e];if(sp.targets>1){const others=G.enemies.filter(o=>!o.dead&&o!==e&&Math.hypot(o.x-u.x,o.y-u.y)-o.r<=st.range).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y));tg.push(...others.slice(0,sp.targets-1));}
    const L=u.def.look,pst=L.shot?L.shot:L.b==='die'?(L.snake||L.c1==='#1d1d1f'?'bdie':'die'):L.b==='slot'?'shard':L.b==='coin'?'coin':'orb';
    if(sp.reels&&reelSpin(u,st))return;
    for(const t of tg)for(let s=0;s<(sp.shots||1);s++)G.proj.push(mk(t,1,{st:pst,delay:s*.09,size:3,crit:sp.crit,critX:sp.critX,jackpot:sp.jackpot,curse:sp.curse,execute:sp.execute}));
    Snd.play('shoot');return;}
  if(kind==='pierce'){
    const tg=[e];if(sp.shots>1){const o2=G.enemies.find(o=>!o.dead&&o!==e&&Math.hypot(o.x-u.x,o.y-u.y)-o.r<=st.range);tg.push(o2||e);}
    const bc=u.def.look.beam||col;if(sp.mega){G.shake=Math.min(8,G.shake+3);Snd.play('snipe');}
    tg.forEach((t2,i)=>{const oy=tg.length>1?(i?6:-6):0,a=Math.atan2(t2.y-u.y,t2.x-u.x),L=sp.mega?1500:st.range+30,sx=u.x,sy=u.y+oy,ex=sx+Math.cos(a)*L,ey=sy+Math.sin(a)*L;
      let far=null,fd=-1;for(const o of G.enemies)if(!o.dead&&segDist(o.x,o.y,sx,sy,ex,ey)<=o.r+6){if(sp.slow){o.slow=Math.max(o.slow,sp.slow*(o.def.boss?.5:1));o.slowT=2;}const dd=Math.hypot(o.x-sx,o.y-sy);if(dd>fd){fd=dd;far=o;}hitEnemy(o,st.dmg,u,{crit:sp.crit,critX:sp.critX});}
      if(sp.chains&&far){const n=G.enemies.filter(o=>!o.dead&&o!==far&&segDist(o.x,o.y,sx,sy,ex,ey)>o.r+6).sort((p,q)=>Math.hypot(p.x-far.x,p.y-far.y)-Math.hypot(q.x-far.x,q.y-far.y))[0];if(n&&Math.hypot(n.x-far.x,n.y-far.y)<140)chainHit(far,n,st.dmg*.55,sp.chains-1,bc);}
      if(u.def.look.sonic)for(let k=1;k<=3;k++)G.fx.push({t:'ring',x:sx+(ex-sx)*k/4,y:sy+(ey-sy)*k/4,r0:3,r1:16,col:bc,life:.3+k*.06,max:.3+k*.06,w:2});
      G.fx.push({t:'beam',x1:sx,y1:sy,x2:ex,y2:ey,col:bc,life:sp.mega?.5:.2,max:sp.mega?.5:.2,w:sp.mega?4:u.siegeP>=1?2:1});if(u.siegeP>=1)splashAt(t2.x,t2.y,44,st.dmg*.5,u,bc);});if(u.siegeP>=1){G.shake=Math.min(6,G.shake+1.2);Snd.play('boom');}else Snd.play('beam');return;}
  if(kind==='aoe'&&sp.craps){const dbl=rnd()<1/6;G.proj.push(mk(e,dbl?4:1,{st:'die',size:5,aoe:sp.splash*(dbl?1.6:1),spd:360}));G.proj.push(mk(e,dbl?0:.5,{st:'die',size:4,aoe:sp.splash*.6,spd:330,delay:.08}));if(dbl){floatText(u.x,u.y-u.r-14,'DOUBLES!','#fca5a5',13);Snd.play('jackpot');}else Snd.play('magic');return;}
  if(kind==='aoe'){G.proj.push(mk(e,1,{st:u.def.look.shot==='fire'?'fire':'card',size:5,aoe:sp.splash,slow:sp.slow,stun:sp.stun,crit:sp.crit,critX:sp.critX,spd:340,burn:sp.burn,charm:sp.charm}));Snd.play('magic');return;}
  if(kind==='artillery'){const tg=[e];if(sp.shells>1){const others=G.enemies.filter(o=>!o.dead&&o!==e&&Math.hypot(o.x-u.x,o.y-u.y)-o.r<=st.range&&Math.hypot(o.x-e.x,o.y-e.y)>60);if(others.length)tg.push(others[(rnd()*others.length)|0]);else tg.push(e);}
    const mis=u.def.look.shot==='missile';
    tg.forEach((t2,i)=>{const fl=mis?.6:.8,pd=predict(t2,fl+i*.12);G.proj.push({shell:true,missile:mis,sx:u.x,sy:u.y-u.r,x:u.x,y:u.y,tx:pd[0],ty:pd[1],T:fl+i*.12,el:0,dmg:st.dmg,u,col,splash:sp.splash,chains:sp.chains,slow:sp.slow,burn:sp.burn,ink:u.def.look.b==='kraken'||u.def.look.inky,vortex:sp.vortex,water:u.def.look.b==='whale'});});Snd.play('thump');return;}
  if(kind==='cone'){const a=Math.atan2(e.y-u.y,e.x-u.x);
    for(const o of G.enemies){if(o.dead)continue;const d=Math.hypot(o.x-u.x,o.y-u.y);if(d-o.r>st.range+8)continue;let da=Math.abs(Math.atan2(o.y-u.y,o.x-u.x)-a);if(da>Math.PI)da=2*Math.PI-da;if(da<.55||d<u.r+o.r+4)hitEnemy(o,st.dmg,u);}
    if(sp.heads>1){const others=G.enemies.filter(o=>!o.dead&&!o.hidden&&o!==e&&Math.hypot(o.x-u.x,o.y-u.y)-o.r<=st.range+8).sort(()=>rnd()-.5).slice(0,sp.heads-1);
      others.forEach((o,hi)=>{const a2=Math.atan2(o.y-u.y,o.x-u.x);for(const q of G.enemies){if(q.dead)continue;const d=Math.hypot(q.x-u.x,q.y-u.y);if(d-q.r>st.range+8)continue;let da=Math.abs(Math.atan2(q.y-u.y,q.x-u.x)-a2);if(da>Math.PI)da=2*Math.PI-da;if(da<.4)hitEnemy(q,st.dmg*.8,u);}
        const hx=u.x+u.face*u.r*(hi?.55:1.2),hy=u.y-u.r*(hi?1.3:.35);G.fx.push({t:'breath',x:hx,y:hy,a:Math.atan2(o.y-hy,o.x-hx),r:st.range+10,pal:breathPal(u.def.look),life:.34,max:.34,seed:rnd()*99});});}
    {const L=u.def.look,pal=breathPal(L),mx=u.x+u.face*u.r*1.15,my=u.y-u.r*.72,ba=Math.atan2(e.y-my,e.x-mx);
     G.fx.push({t:'breath',x:mx,y:my,a:ba,r:st.range+14,pal,life:.36,max:.36,seed:rnd()*99});
     for(let k=0;k<8&&G.parts.length<480;k++){const an=ba+(rnd()-.5)*.8,v=170+rnd()*170;G.parts.push({x:mx,y:my,vx:Math.cos(an)*v,vy:Math.sin(an)*v,life:.32+rnd()*.14,max:.46,col:pal[1+(k%2)],size:3+rnd()*3,flame:true});}
     if(!L.jade&&!L.genie)for(let k=0;k<2&&G.parts.length<480;k++){const an=ba+(rnd()-.5)*.9,v=90+rnd()*80;G.parts.push({x:mx,y:my,vx:Math.cos(an)*v,vy:Math.sin(an)*v,life:.5,max:.5,col:k%2?'#4ade80':'#bbf7d0',size:3,leaf:true,rot:rnd()*6});}}
    Snd.play('breath');return;}
  if(kind==='chain'){chainHit(u,e,st.dmg,sp.chains,col);Snd.play('zap');return;}
  if(kind==='beam'){u.ramp=u.beamOn===e?Math.min(4,(u.ramp||1)+.12):1;u.beamOn=e;hitEnemy(e,st.dmg*u.ramp,u);
    G.fx.push({t:'chain',pts:[[u.x,u.y-u.r*.9],[e.x,e.y]],col:u.ramp>3?'#ffffff':u.def.look.c2,life:.13,max:.13,seed:rnd()*999});if(rnd()<.35)Snd.play('zap');return;}
  if(kind==='roll'){const a=u.aim,L=Math.min(st.range+30,Math.hypot(e.x-u.x,e.y-u.y)+45),ex=u.x+Math.cos(a)*L,ey=u.y+Math.sin(a)*L;
    for(const o of G.enemies)if(!o.dead&&segDist(o.x,o.y,u.x,u.y,ex,ey)<=o.r+16){hitEnemy(o,st.dmg,u);o.kbAt=G.time;o.kbA=a+(Math.random()<.5?1.2:-1.2);o.kbP=8;}
    u.rollAt=G.time;u.rollA=a;u.rollD=L;G.shake=Math.min(5,G.shake+1.2);Snd.play('thump');return;}
}
function predict(e,t){const fx=e.fx||0,fy=e.fy||0;const s=e.spd*(1-e.slow)*(e.stun>0?0:1);return [e.x+fx*s*t,e.y+fy*s*t];}
function chainHit(u,first,dmg,n,col){
  const hit=new Set([first]),pts=[[u.x,u.y-u.r*.5],[first.x,first.y]];let cur=first;hitEnemy(first,dmg,u);
  for(let k=0;k<n;k++){let b=null,bd=120;for(const e of G.enemies){if(e.dead||hit.has(e))continue;const d=Math.hypot(e.x-cur.x,e.y-cur.y);if(d<bd){bd=d;b=e;}}if(!b)break;dmg*=.88;hit.add(b);pts.push([b.x,b.y]);hitEnemy(b,dmg,u);cur=b;}
  G.fx.push({t:'chain',pts,col,life:.22,max:.22,seed:rnd()*999});
}
function segDist(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy;let t=((px-x1)*dx+(py-y1)*dy)/l;t=clamp(t,0,1);return Math.hypot(px-(x1+t*dx),py-(y1+t*dy));}
function hitEnemy(e,dmg,u,opt){
  if(e.dead)return;let crit=false;if(e.invulnT>0){e.flash=.03;if(G.texts.length<40&&rnd()<.08)floatText(e.x,e.y-e.r-6,'Locked','#fde047',10);return;}if(e.curseT>0)dmg*=1.4;
  if(G._lkT!==G.time){G._lkT=G.time;G._luck=0;for(const o of G.units)if(o.def.sp&&o.def.sp.luck)G._luck+=o.def.sp.luck;}
  if(u&&u.def&&((G._luck&&rnd()<G._luck)||(u.lucky&&rnd()<.2))){dmg*=2;crit=true;}if(u&&u.wishT>0)dmg*=1.3;
  if(opt&&opt.curse){if(!(e.curseT>0)&&G.texts.length<50)floatText(e.x,e.y-e.r-8,'Cursed','#c084fc',10);e.curseT=4;}
  if(opt&&opt.execute&&!e.def.boss&&!e.def.mini&&e.hp/e.maxHp<opt.execute){floatText(e.x,e.y-e.r-10,'WANTED','#fbbf24',12);dmg=e.hp+e.armor+(e.shield||0)+1;}
  if(!crit&&opt&&opt.crit&&rnd()<opt.crit){dmg*=opt.critX;crit=true;}
  dmg=Math.max(dmg*.2,dmg-e.armor);if(e.shield>0){const ab=Math.min(e.shield,dmg);e.shield-=ab;dmg-=ab;if(dmg<=0){e.flash=.04;return;}}e.hp-=dmg;e.flash=.08;if(e.def.stealth)e.revealT=1.6;G.stats.dmg+=dmg;if(G.round)G.round.dmg+=dmg;if(u&&u.dmgDone!=null){u.dmgDone+=dmg;u.rdmg=(u.rdmg||0)+dmg;}
  if(crit&&G.texts.length<50)floatText(e.x,e.y-e.r-4,fmt(dmg)+'!','#fb7185',12);
  if(e.hp<=0)killEnemy(e,u);
}
function splashAt(x,y,rad,dmg,u,col,opt){
  for(const e of G.enemies){if(e.dead)continue;const d=Math.hypot(e.x-x,e.y-y);if(d<=rad+e.r){
    if(opt&&opt.slow){e.slow=Math.max(e.slow,opt.slow*(e.def.boss?.5:1));e.slowT=2;}
    if(opt&&opt.stun&&rnd()<opt.stun&&!e.def.boss){e.stun=.6;}
    hitEnemy(e,dmg*(1-.4*clamp(d/rad,0,1)),u,opt);}}
  G.fx.push({t:'boom',x,y,r:rad,col,life:.4,max:.4,sig:!!(opt&&opt.slow),seed:rnd()*9});for(let i=0;i<10;i++)chipBit(x,y,rad*2.4);
}
function killEnemy(e,u){
  if(e.dead)return;e.dead=true;G.stats.kills++;if(u&&u.def&&u.def.sp&&u.def.sp.grow)u.growth=Math.min(2,(u.growth||0)+u.def.sp.grow);if(G.round)G.round.kills++;if(G.fx.length<160)G.fx.push({t:'die',k:e.k,r:e.r,x:e.x,y:e.y,face:e.face||1,spin:(rnd()-.5)*1.6,life:e.def.boss||e.def.mini?.7:.32,max:e.def.boss||e.def.mini?.7:.32});if(u&&u.kills!=null){u.kills++;checkRank(u);}
  if(e.def.split){for(let k=0;k<e.def.split;k++){const a=k/e.def.split*TAU+rnd();const s=spawnEnemy('shard');s.x=e.x+Math.cos(a)*8;s.y=e.y+Math.sin(a)*8;s.d=e.d;}for(let i=0;i<10;i++)spark(e.x,e.y,'#e2e8f0',140,.4);}
  let g=e.def.gold+Math.floor(G.wave/8);if(u&&u.def.sp&&u.def.sp.bounty)g+=u.def.sp.bounty;
  G.me.chips+=g;G.stats.earned+=g;
  if(G.texts.length<60)floatText(e.x,e.y-6,'+'+g,'#e9c46a',e.def.boss||e.def.mini?16:10);
  const n=e.def.boss?60:e.def.mini?30:7;for(let i=0;i<n;i++)spark(e.x,e.y,e.def.col,e.def.boss?200:90,e.def.boss?1:.45);
  if(e.def.boss&&typeof Meta!=='undefined')Meta.ach('debt');
  if((e.def.secret||e.def.decoy)&&typeof secretBossDown==='function')secretBossDown(e);
  if(e.def.boss||e.def.mini){G.fx.push({t:'ring',x:e.x,y:e.y,r0:10,r1:120,col:e.def.col,life:.8,max:.8,w:5});banner(e.name+' busted','+'+g+' chips','info');Snd.play('victory');}
  else Snd.play('pop');
}

/* ---------- bad luck ---------- */
const earlyBump=w=>w<=1?.25:w===2?.5:w===3?.7:w<=8?1:Math.max(0,(11-w)/3);
const earlyMul=w=>1+(G.diff.early||0)*Math.max(0,(10-w)/9);
function spawnEnemy(k){
  const d=ENEMIES[k],w=G.wave;let hp=waveHp(w)*d.hp*G.diff.hp*earlyMul(w);if(d.boss)hp*=1+w/30;
  const e={id:G.nid++,k,def:d,x:SPAWN.x,y:SPAWN.y+(rnd()-.5)*40,hp,maxHp:hp,armor:d.armor*(1+w*.35),spd:d.spd*(1+Math.min(.3,w*.006)),r:d.r,slow:0,slowT:0,stun:0,cd:0,flash:0,fx:1,fy:0,face:1,wob:rnd()*6,
    name:d.boss?G.waveInfo.name:d.name};
  G.enemies.push(e);
  if(d.boss)Snd.play('boss');
  return e;
}
function enemyTargetUnit(e){
  if(e.def.dodge)return null;
  let best=null,bd=1e9;
  for(const u of G.units){const tr=tauntR(u);if(tr&&!u.jump){const d=Math.hypot(u.x-e.x,u.y-e.y);if(d<tr&&d<bd){bd=d;best=u;}}}
  if(best)return best;
  for(const u of G.units){const d=Math.hypot(u.x-e.x,u.y-e.y);if(d<e.r+u.r+5&&d<bd){bd=d;best=u;}}
  return best;
}
function hurtUnit(u,dmg){if(u.jump)return;dmg=Math.max(dmg*.25,dmg-((u.def.armor||0)+(u.lockT>0?12:0))*1.5);u.hp-=dmg;u.lastHit=G.time;u.flash=.1;
  if(u.hp<=0&&u.def.sp&&u.def.sp.rebirth&&!u.reborn){u.reborn=true;u.hp=u.maxHp*.6;G.fires.push({x:u.x,y:u.y,r:60,t:2.2,max:2.2,dps:u.def.dmg*.6,u});G.fx.push({t:'ring',x:u.x,y:u.y,r0:10,r1:90,col:'#f97316',life:.6,max:.6,w:5});for(let i=0;i<30;i++)spark(u.x,u.y,i%2?'#f97316':'#fde047',180,.7);floatText(u.x,u.y-u.r-14,'Reborn!','#fdba74',14);Snd.play('boom');return;}
  if(u.hp<=0&&u.temp&&!u.dead){u.dead=true;for(let i=0;i<10;i++)spark(u.x,u.y,'#e11d48',90,.4);return;}
  if(u.hp<=0&&!u.dead){u.dead=true;for(let i=0;i<16;i++)spark(u.x,u.y,u.def.look.c1,110,.6);
  G.stats.kos=(G.stats.kos||0)+1;const t=10+Math.min(20,UNITS[u.k].hp/80);G.ko.push({u,t,max:t});G.fx.push({t:'ko',k:u.k,x:u.x,y:u.y,face:u.face,life:1.1,max:1.1});u.siegeP=0;u.siegeTo=false;u.fanT=u.infT=u.lockT=0;gameLog(`${u.def.name} was knocked out · back in ${Math.round(t)}s`,'bad');Snd.play('die');}}
function updateKO(dt){for(const k of G.ko){k.t-=dt;if(k.t<=0){const u=k.u;u.dead=false;u.hp=u.maxHp;u.x=BASE.fx-10+(rnd()-.5)*20;u.y=BASE.y+(rnd()-.5)*60;u.order={t:'idle'};u.anchor={x:u.x,y:u.y};u.path=[];u.target=null;u.sel=false;u.spawnT=.45;G.units.push(u);
  G.fx.push({t:'ring',x:u.x,y:u.y,r0:4,r1:30,col:'#4ade80',life:.5,max:.5,w:3});}}G.ko=G.ko.filter(k=>k.t>0);}
const BOSS_MOVES=['summon','dash','shield','edge'];
function bossMove(e){if(e.def.moves)return e.def.moves[(e.mi||0)%e.def.moves.length];return e.def.mini?'slam':BOSS_MOVES[Math.max(0,Math.floor(G.wave/10)-1)%4];}
/* ---------- special bad luck ---------- */
function enemySpecials(e,dt){const k=e.k;
  if(k==='chewer'){
    if(e.chewT>0){e.chewT-=dt;e.atk=.6;const i=e.chewTile;if(grid[i]!==2){e.chewT=0;return false;}
      if(e.chewT<=0){grid[i]=0;G.barricades=Math.max(0,G.barricades-1);computeFlow();e.chewed=(e.chewed||0)+1;const x=(i%COLS)*TILE+15,y=((i/COLS)|0)*TILE+15;
        for(let j=0;j<14;j++)spark(x,y,j%2?'#c0193f':'#e5e7eb',120,.5);floatText(x,y-14,'Snip!','#fda4af',13);Snd.play('sell');
        if(!G.ratWarn){G.ratWarn=1;toast('A Rope Rat chewed through a velvet rope!');}gameLog('A Rope Rat chewed through one of your velvet ropes.','bad');}
      return true;}
    if((e.chewed||0)<2){e.chewChk=(e.chewChk||0)-dt;if(e.chewChk<=0){e.chewChk=.3;const c=Math.floor(e.x/TILE),r=Math.floor(e.y/TILE);
      for(const [dc,dr] of NB){const cc=c+dc,rr=r+dr;if(cc<0||rr<0||cc>=COLS||rr>=ROWS)continue;const i=gi(cc,rr);if(grid[i]===2){e.chewT=1.7;e.chewTile=i;e.face=(cc*TILE+15)>e.x?1:-1;return true;}}}}
    return false;}
  if(k==='charm'){e.healCd=(e.healCd==null?1.5:e.healCd)-dt;if(e.healCd<=0){e.healCd=2.6;let n=0;
      for(const o of G.enemies){if(o.dead||o.hp>=o.maxHp)continue;if(Math.hypot(o.x-e.x,o.y-e.y)<95){o.hp=Math.min(o.maxHp,o.hp+o.maxHp*(o.def.boss?.03:.14));n++;if(G.parts.length<470)G.parts.push({x:o.x,y:o.y-o.r,vx:0,vy:-30,life:.6,max:.6,col:'#4ade80',size:3});}}
      if(n){G.fx.push({t:'ring',x:e.x,y:e.y,r0:10,r1:95,col:'rgba(74,222,128,.75)',life:.5,max:.5,w:3});e.atk=1;}}return false;}
  if(k==='bondsman'){e.shCd=(e.shCd==null?2:e.shCd)-dt;if(e.shCd<=0){e.shCd=4.5;let n=0;
      for(const o of G.enemies){if(o.dead||o===e||n>=5)continue;if(Math.hypot(o.x-e.x,o.y-e.y)<105){o.shield=Math.max(o.shield||0,o.maxHp*(o.def.boss?.05:.35));o.shieldT=Math.max(o.shieldT||0,4);n++;}}
      if(n){G.fx.push({t:'ring',x:e.x,y:e.y,r0:10,r1:105,col:'rgba(96,165,250,.8)',life:.5,max:.5,w:3});e.atk=1;}}return false;}
  return false;}
function updateStealth(dt){
  let any=false;for(const e of G.enemies){if(!e.def.stealth||e.dead)continue;any=true;if(e.revealT>0)e.revealT-=dt;
    let seen=e.revealT>0||Math.hypot(e.x-BASE.x,e.y-BASE.y)<190||e.atCasino;
    if(!seen)for(const u of G.units){if(u.def.detect&&Math.hypot(u.x-e.x,u.y-e.y)<160){seen=true;break;}}
    if(e.hidden&&seen&&!e.spotted){e.spotted=1;floatText(e.x,e.y-e.r-8,'Spotted!','#e2e8f0',11);}
    e.hidden=!seen;}
  return any;}
/* ---------- bosses: phases at half and quarter health ---------- */
function bossPhase(e){const f=e.hp/e.maxHp;const ph=e.def.mini?(f<.5?2:1):(f<.25?3:f<.5?2:1);
  if(ph>(e.phase||1)){e.phase=ph;e.spdMul=ph===3?1.3:1.15;e.abT=Math.min(e.abT==null?1:e.abT,.6);
    const txt=e.def.mini?'The Repo Ogre is enraged!':ph===2?e.name+' is furious!':e.name+' is desperate!';banner(txt,ph===3?'Everything it has, all at once':'Faster, and its moves come quicker','boss');
    G.fx.push({t:'ring',x:e.x,y:e.y,r0:10,r1:150,col:'#ff3b5a',life:.7,max:.7,w:6});G.shake=Math.min(9,G.shake+5);Snd.play('boss');for(let i=0;i<30;i++)spark(e.x,e.y,'#ff3b5a',220,.7);gameLog(txt,'bad');}}
function bossUpdate(e,dt){
  bossPhase(e);
  if(e.shieldT>0){e.shieldT-=dt;if(e.shieldT<=0)e.shield=0;}
  if(e.dashT>0)e.dashT-=dt;
  if(e.invulnT>0)e.invulnT-=dt;
  if(e.windup>0){e.windup-=dt;if(e.windup<=0)bossAct(e);return;}
  e.abT=(e.abT==null?5:e.abT)-dt*(e.phase===3?1.8:e.phase===2?1.35:1);if(e.abT<=0){e.windup=e.phase===3?.65:.9;if(e.phase===3&&e.def.boss&&rnd()<.4){e.move='slam';e.windup=.75;Snd.play('windup');return;}e.move=bossMove(e);e.mi=(e.mi||0)+1;if(e.move==='edge')e.move=(e.edgeN=(e.edgeN||0)+1)%2?'summon':'shield';Snd.play('windup');}
}
function bossAct(e){
  const m=e.move;
  if(typeof secretBossAct==='function'&&secretBossAct(e,m))return;
  if(m==='summon'){const kind=G.wave>=40?'hexer':'jinx';for(let k=0;k<(e.def.boss?4:2);k++){const s=spawnEnemy(kind);const a=k/4*TAU;s.x=e.x+Math.cos(a)*24;s.y=e.y+Math.sin(a)*24;s.hp=s.maxHp=s.maxHp*.7;}
    G.fx.push({t:'ring',x:e.x,y:e.y,r0:10,r1:60,col:'#a855f7',life:.5,max:.5,w:3});floatText(e.x,e.y-e.r-14,'Collecting!','#f0abfc',13);e.abT=7;}
  else if(m==='dash'){e.dashT=1.3;e.abT=8;floatText(e.x,e.y-e.r-14,'Charge!','#fca5a5',13);G.shake=Math.min(8,G.shake+2);}
  else if(m==='shield'){e.shield=e.maxHp*.12;e.shieldT=4;e.abT=10;floatText(e.x,e.y-e.r-14,'Bad beat!','#c4b5fd',13);}
  else if(m==='slam'){for(const u of G.units)if(Math.hypot(u.x-e.x,u.y-e.y)<75+u.r){u.stunT=1.3;hurtUnit(u,e.def.dmg*waveDmgMult()*.6);}G.fx.push({t:'shock',x:e.x,y:e.y+e.r*.6,r:75,life:.5,max:.5});G.shake=Math.min(8,G.shake+4);Snd.play('slam');e.abT=9;}
}
function updateEnemy(e,dt){
  if(e.def.boss||e.def.mini)bossUpdate(e,dt);
  if(e.flash>0)e.flash-=dt;e.cd-=dt;if(e.atk>0)e.atk-=dt*4;
  if(e.slowT>0){e.slowT-=dt;if(e.slowT<=0)e.slow=0;}
  if(e.stun>0){e.stun-=dt;return;}
  if(e.curseT>0)e.curseT-=dt;
  if(e.charmT>0){e.charmT-=dt;const nx=e.x-e.spd*.55*dt;if(walkable(nx,e.y,e.r)){e.x=nx;e.face=-1;}return;}
  if(!e.def.boss&&!e.def.mini&&e.shieldT>0){e.shieldT-=dt;if(e.shieldT<=0)e.shield=0;}
  if(enemySpecials(e,dt))return;
  const spd=e.spd*(e.spdMul||1)*(1-e.slow)*(e.dashT>0?4:1)*(e.windup>0&&e.move==='slam'?0:1);
  const tu=e.dashT>0?null:enemyTargetUnit(e);
  if(e.dashT>0)for(const u of G.units)if(!u.jump&&Math.hypot(u.x-e.x,u.y-e.y)<e.r+u.r+4){hurtUnit(u,e.def.dmg*waveDmgMult()*dt*2);const a=Math.atan2(u.y-e.y,u.x-e.x);if(walkable(u.x+Math.cos(a)*3,u.y+Math.sin(a)*3,u.r)){u.x+=Math.cos(a)*3;u.y+=Math.sin(a)*3;}}
  if(tu){const d=Math.hypot(tu.x-e.x,tu.y-e.y);
    if(d<=e.r+tu.r+6){if(e.cd<=0){hurtUnit(tu,e.def.dmg*waveDmgMult());e.cd=1/e.def.rate;e.bite=.15;}e.fx=(tu.x-e.x)/d;e.fy=(tu.y-e.y)/d;return;}
    stepToward(e,tu.x,tu.y,spd,dt);return;}
  if(e.def.ranged&&e.cd<=0){let t=null,bd=e.def.ranged;for(const u of G.units){const d=Math.hypot(u.x-e.x,u.y-e.y);if(d<bd){bd=d;t=u;}}
    if(t){e.cd=1/e.def.rate;G.eproj.push({x:e.x,y:e.y,tg:t,spd:260,dmg:e.def.dmg*waveDmgMult()});}}
  if(nearCasino(e)){updateAtCasino(e);return;}
  if(e.def.fly){const dx=BASE.x-e.x,dy=BASE.y-e.y,dd=Math.hypot(dx,dy)||1;e.fx=dx/dd;e.fy=dy/dd;if(Math.abs(dx)>1)e.face=dx>0?1:-1;
    e.x+=e.fx*spd*dt+Math.sin(G.time*3+e.wob)*12*dt;e.y+=e.fy*spd*dt+Math.cos(G.time*2.3+e.wob)*12*dt;}
  else{
  // flow field
  const c=clamp(Math.floor(e.x/TILE),0,COLS-1),r=clamp(Math.floor(e.y/TILE),0,ROWS-1);
  let bc=c,br=r,bv=grid[gi(c,r)]===0?flow[gi(c,r)]:Infinity;
  for(const [dc,dr] of NB){const nc=c+dc,nr=r+dr;if(!open(nc,nr))continue;if(dc&&dr&&(!open(c+dc,r)||!open(c,r+dr)))continue;const v=flow[gi(nc,nr)];if(v<bv-.01){bv=v;bc=nc;br=nr;}}
  let tx=bc*TILE+15,ty=br*TILE+15;
  if(bc===c&&br===r){tx=BASE.x;ty=BASE.y;}
  const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy)||1;e.fx=dx/d;e.fy=dy/d;if(Math.abs(dx)>1)e.face=dx>0?1:-1;
  const mv=spd*dt;let nx=e.x+e.fx*mv,ny=e.y+e.fy*mv;
  const nc2=Math.floor(nx/TILE),nr2=Math.floor(ny/TILE);const g2=nc2>=0&&nr2>=0&&nc2<COLS&&nr2<ROWS?grid[gi(nc2,nr2)]:1;
  if(g2===0||g2===3||(bc===c&&br===r)){e.x=nx;e.y=ny;}else{e.x+=e.fx*mv*.3;e.y+=e.fy*mv*.3;}
  }
  if(nearCasino(e))updateAtCasino(e);else e.atCasino=false;
}
function nearCasino(e){return e.x>BASE.c0*TILE-e.r-6&&e.x<(BASE.c0+BASE.w)*TILE+e.r+6&&e.y>BASE.r0*TILE-e.r-6&&e.y<(BASE.r0+BASE.h)*TILE+e.r+6;}
function updateAtCasino(e){
  if(!e.atCasino){e.atCasino=true;G.stats.leaks++;if(G.round)G.round.leaks++;if(!G.alarmT||G.time-G.alarmT>6){G.alarmT=G.time;toast('Your casino is under attack!');}if(typeof hintOnce==='function')hintOnce('leak','Bad luck that reaches your casino <b>keeps biting</b> until it\'s killed, and early rounds bite hardest. <b>Velvet ropes</b> (V) make it walk the long way past your creatures.');}
  // never stand inside the building
  if(e.x>BASE.c0*TILE&&e.x<(BASE.c0+BASE.w)*TILE&&e.y>BASE.r0*TILE&&e.y<(BASE.r0+BASE.h)*TILE)e.x=BASE.c0*TILE-e.r-2;
  if(Math.abs(BASE.x-e.x)>1)e.face=BASE.x>e.x?1:-1;
  if(e.cd<=0){const dmg=e.def.bite*.6*(1-.1*G.base.plate)*(1+(G.diff.earlyBite||0)*earlyBump(G.wave));G.base.hp-=dmg;G.base.hitT=.22;if(typeof casinoHurt==='function')casinoHurt(dmg);if(G.round)G.round.hpLost+=dmg;G.waveDmg=(G.waveDmg||0)+dmg;e.cd=2/(e.def.rate||1);e.atk=1;e.fx=Math.sign(BASE.x-e.x)||1;e.fy=0;
    for(let i=0;i<4;i++)spark(e.x+(BASE.x>e.x?e.r:-e.r),e.y,'#ffcf7a',70,.3);G.shake=Math.min(6,G.shake+.6+dmg*.08);Snd.play('leak');
    if(dmg>=4||rnd()<.3)floatText(e.x,e.y-e.r-6,'-'+Math.round(dmg),'#f87171',11);
    if(G.base.hp<=0&&!G.over)defeat();}
}
const waveDmgMult=()=>(1.5+G.wave*.1)*(G.diff.unitDmg||1);

/* ---------- casino (base), croupiers ---------- */
const UPGRADES={
  casino:{name:'Upgrade the Casino',get desc(){const n=CASINO_TIERS[(G?G.base.tier:0)+1];return n?`Become the ${n.name}: ${n.hp} health, ${n.desc.toLowerCase()} Bites do ${n.plate*10}% less.`:'Your casino is as grand as it gets.';},max:3,cost:l=>CASINO_TIERS[l+1]?CASINO_TIERS[l+1].cost:0},
  croupier:{name:'Hire Croupier',desc:'Runs chips from the armored truck to the casino, 3 per trip',max:10,cost:l=>90+45*l},
  dmg:{name:'Sharpened Odds',desc:'+12% damage for all creatures',max:10,cost:l=>90+70*l},
  hp:{name:'Thick Felt',desc:'+12% health for all creatures',max:10,cost:l=>90+70*l},
};
function upLevel(k){return k==='casino'?G.base.tier:k==='croupier'?G.workers.length-2:G.up[k];}
function setCasinoTier(t,quiet){const T=CASINO_TIERS[t],b=G.base,gain=T.hp-b.maxHp;b.tier=t;b.maxHp=T.hp;b.hp=Math.min(b.maxHp,b.hp+Math.max(0,gain));b.plate=T.plate;b.cannon=T.cannon;
  if(quiet)return;banner(T.name,'Your casino grows: '+T.hp+' health','great');G.shake=Math.min(8,G.shake+4);for(let i=0;i<60;i++)chipBit(BASE.x,BASE.y-20,260);
  G.fx.push({t:'ring',x:BASE.x,y:BASE.y,r0:20,r1:160,col:'#fbbf24',life:.8,max:.8,w:5});gameLog(`Your casino is now the ${T.name}.`,'good');}
function buyUpgrade(k){
  const U=UPGRADES[k],l=upLevel(k);if(l>=U.max)return;const c=U.cost(l);
  if(G.me.chips<c){toast('Not enough chips');Snd.play('error');return;}
  G.me.chips-=c;Snd.play('upgrade');
  if(k==='casino'){setCasinoTier(G.base.tier+1);}
  else if(k==='croupier')addWorker();
  else if(k==='hp'){G.up.hp++;for(const u of G.units){const f=u.hp/u.maxHp;u.maxHp=maxHpOf(u.k,u.rank);u.hp=u.maxHp*f;}}
  else G.up[k]++;
  G.fx.push({t:'ring',x:BASE.x,y:BASE.y,r0:20,r1:70,col:'#e9c46a',life:.5,max:.5,w:3});
  refreshSide(true);
}
const DOOR={x:BASE.x-30,y:BASE.r0*TILE-8};
const LOADPT={x:VAULT.c0*TILE-10,y:VAULT.y+4};
function addWorker(){const n=G.workers.length;G.workers.push({x:DOOR.x,y:DOOR.y,st:0,t:rnd()*.6,wait:n*1.3,carry:0,load:0,bob:rnd()*6,face:-1,walk:0,lane:((n%5)-2)*6});}
function walkTo(w,tx,ty,spd,dt){const dx=tx-w.x,dy=ty-w.y,d=Math.hypot(dx,dy);if(d<.5)return true;const mv=Math.min(d,spd*dt);w.x+=dx/d*mv;w.y+=dy/d*mv;if(Math.abs(dx)>.5)w.face=dx>0?1:-1;return d<=mv+.5;}
function setDuty(n){const rep=G.workers.filter(w=>w.mode==='repair');if(n>0){const w=G.workers.find(w=>w.mode!=='repair');if(!w){toast('Every croupier is already repairing');return;}w.mode='repair';w.st=3;w.carry=0;}
  else{const w=rep[rep.length-1];if(!w){toast('No croupiers are repairing');return;}w.mode='gather';w.st=0;}Snd.play('click');if(typeof refreshSide==='function')refreshSide(true);}
function updateWorkers(dt){
  for(const w of G.workers){const ox=w.x,oy=w.y;
    if(w.wait>0){w.wait-=dt;continue;}
    if(w.mode==='repair'){const i=G.workers.filter(o=>o.mode==='repair').indexOf(w),tx=BASE.c0*TILE-12,ty=BASE.r0*TILE+30+((i*37)%(BASE.h*TILE-50));
      if(walkTo(w,tx,ty,80,dt)){w.face=1;w.st=4;if(G.base.hp<G.base.maxHp&&!G.over){G.base.hp=Math.min(G.base.maxHp,G.base.hp+.8*dt);w.load=(w.load||0)+dt;if(w.load>.35){w.load=0;spark(tx+12,ty-6,'#fde68a',70,.3);}}}else w.st=3;
      w.walk+=Math.hypot(w.x-ox,w.y-oy);continue;}
    if(w.st===0){if(walkTo(w,LOADPT.x+w.lane*.4,LOADPT.y+w.lane,78,dt)){w.st=1;w.t=1.1;w.load=0;}}
    else if(w.st===1){w.t-=dt;w.load=Math.min(1,1-w.t/1.1);w.face=1;if(w.t<=0){w.st=2;w.carry=3;w.load=1;}}
    else{if(walkTo(w,DOOR.x+w.lane,DOOR.y,70,dt)){w.st=0;G.me.chips+=w.carry;G.stats.earned+=w.carry;G.stats.croup=(G.stats.croup||0)+w.carry;
      if(G.texts.length<60)floatText(DOOR.x+w.lane,DOOR.y-16,'+'+w.carry,'#ffd27a',13);for(let i=0;i<5;i++)chipBit(DOOR.x+w.lane,DOOR.y-4,60);w.carry=0;w.load=0;}}
    w.walk+=Math.hypot(w.x-ox,w.y-oy);
  }
}
function casinoGun(i,tier){const P=tier>=2?[[0,-46],[-26,40],[26,40]]:[[0,-38]];const q=P[i%P.length];return [BASE.x+q[0],BASE.y+q[1]];}
function updateCannon(dt){
  const l=G.base.cannon;if(!l)return;G.base.ccd-=dt;
  if(G.base.ccd<=0){const e=G.enemies.find(x=>!x.dead&&x.atCasino)||nearestEnemy(BASE.x,BASE.y,175+G.base.tier*15);if(e){G.base.ccd=1/1.5;G.base.cang=Math.atan2(e.y-(BASE.y-38),e.x-BASE.x);
    const shots=CASINO_TIERS[G.base.tier].shots,tg=[e].concat(G.enemies.filter(o=>!o.dead&&!o.hidden&&o!==e&&Math.hypot(o.x-BASE.x,o.y-BASE.y)<190+G.base.tier*15).slice(0,shots-1));
    tg.forEach((t2,i)=>{const [sx,sy]=casinoGun(i,G.base.tier);G.proj.push({st:'slug',aoe:26,sx,sy,x:sx,y:sy,tg:t2,tx:t2.x,ty:t2.y,spd:560,dmg:18*Math.pow(1.55,l-1)*(1+G.wave*.04),u:null,col:'#fde68a',size:4,delay:i*.08});});Snd.play('shoot');}}
}

/* ---------- rounds & rivals ---------- */
function startWave(){
  G.wave++;const w=G.wave;let c=waveComp(w);if(typeof applySecretBoss==='function')c=applySecretBoss(w,c);G.waveInfo=c;
  const n=c.list.length,spread=c.spread||Math.min(16,4+n*.45);
  c.list.forEach((k,i)=>G.spawnQ.push({t:G.time+.5+i*(spread/n),k}));
  G.phase='wave';G.waveT=0;G.waveSpread=spread;G.waveDmg=0;G.round={w,dmg:0,kills:0,leaks:0,hpLost:0,earned0:G.stats.earned,croup0:G.stats.croup||0};for(const u of G.units){u.rdmg=0;u.reborn=false;}for(const k of G.ko){k.u.rdmg=0;k.u.reborn=false;}
  if(typeof miniAfter==='function'&&miniAfter(w))gameLog(`After this round: ${MINI_NAME[miniAfter(w)]} for everyone.`,'good');
  if(c.secret){banner(c.name,c.secret.sub,'boss');Snd.play('boss');G.shake=Math.min(9,G.shake+5);}
  else if(c.boss){banner(c.name,'Round '+w,'boss');Snd.play('boss');}
  else if(c.mini){banner('Repo Ogre','Round '+w,'boss');Snd.play('wave');}
  else{banner('Round '+w,c.name,'round');Snd.play('wave');}
  if(typeof waveFeel==='function')waveFeel();
  if(!G.mp)rivalIncome(w);
  refreshTable(true);
}
function rivalIncome(w){for(const p of G.players)if(!p.human&&!p.remote&&p.alive)p.chips+=Math.round((18+w*2.2)*G.diff.rival);}
function rivalSim(w){
  G.rivalRep=[];
  const c=waveComp(w),threat=waveThreat(w)*rivalHpScale(w)/10/G.diff.rival;
  for(const p of G.players){if(p.human||p.remote||!p.alive)continue;
    p.power*=1.015;
    const ratio=p.power/threat;let dmg=0;
    if(ratio<1)dmg=(1-ratio)*44*(c.boss?1.25:c.mini?1.1:1)*(.5+rnd());else if(rnd()<.08)dmg=rnd()*6;
    p.hp-=dmg;p.lastDmg=dmg;
    if(p.chips>110){const spend=Math.round((p.chips-80)*.42);p.chips-=spend;p.power+=spend/4.5*(1+w*.03);}
    if(dmg>=1)(G.rivalRep=G.rivalRep||[]).push(`${p.short||p.name} −${Math.round(dmg)}`);
    if(p.hp<=0){p.hp=0;bark(p,'bust');p.alive=false;p.outWave=w;G.outOrder.push(p);banner(p.name+' is busted','','bust');p.bustT=G.time;gameLog(`${p.name}'s casino fell on round ${w}.`,'bad');Snd.play('bust');}
  }
  gameLog(G.rivalRep.length?'Rival casinos hit: '+G.rivalRep.join(' · '):'Every rival casino held this round.',G.rivalRep.length?'':'good');
}
function endWave(){
  const w=G.wave;
  if(G.mp){localEndWave(w);G.phase='wait';refreshTable(true);return;}
  rivalSim(w);localEndWave(w);
  refreshTable(true);
  if(!G.players.some(p=>!p.human&&p.alive)&&!G.freeplay){victory('last');return;}
  if(w>=MAX_WAVE){victory('survived');return;}
  G.phase='break';G.breakT=2.5;
  if(typeof saveRun==='function')saveRun();
  const mk=typeof miniAfter==='function'&&miniAfter(w);
  if(mk==='sports'&&!G.noMini){G.phase='mini';openSports(sbSetup(w));}
  else if(mk&&!G.noMini){G.phase='mini';openMinigame(mk,MINI_TIME,()=>{if(G.phase==='mini'){G.phase='break';G.breakT=1.2;}});}
}
function localEndWave(w){
  (G.hpHist=G.hpHist||[]).push(Math.max(0,Math.round(G.base.hp)));if(G.round)(G.leakHist=G.leakHist||[])[w]=G.round.leaks||0;
  if(w===10&&!G.stats.leaks&&typeof Meta!=='undefined')Meta.ach('velvet');
  if(G.round&&typeof roundSummary==='function'){const R=G.round,all=G.units.concat(G.ko.map(k=>k.u));const mvp=all.reduce((a,b)=>(b.rdmg||0)>(a&&a.rdmg||0)?b:a,null);
    setTimeout(()=>roundSummary({w,dmg:R.dmg,kills:R.kills,leaks:R.leaks,hpLost:R.hpLost,earned:G.stats.earned-R.earned0,mvp:mvp&&mvp.rdmg>0?{k:mvp.k,dmg:mvp.rdmg}:null}),900);}
  const pay=Math.round(20+2.5*w);G.me.chips+=pay;floatText(BASE.x,BASE.r0*TILE-12,'+'+pay,'#e9c46a',16);for(let i=0;i<14;i++)chipBit(BASE.x,BASE.r0*TILE+10,160);G.stats.earned+=pay;gameLog(`Round ${w} cleared. The house pays ${pay} chips.`,'good');
  if(!G.waveDmg&&G.enemies.length===0){G.streak=(G.streak||0)+1;const bonus=Math.min(40,10+5*(G.streak-1));G.me.chips+=bonus;G.stats.earned+=bonus;G.stats.clean=(G.stats.clean||0)+1;G.stats.bestStreak=Math.max(G.stats.bestStreak||0,G.streak);
    if(G.streak>=5&&typeof Meta!=='undefined')Meta.ach('spotless');
    banner('Clean round',`+${bonus} chips${G.streak>1?', streak '+G.streak:''}`,'info');for(let i=0;i<30;i++)chipBit(BASE.x-20,BASE.r0*TILE+20,240);Snd.play('coin');}
  else G.streak=0;
}
function newGame(dk,mp){
  const d=DIFFS[dk];setupMap();
  G={diffKey:dk,diff:d,time:0,wave:0,phase:'break',breakT:1.2,waveT:0,spawnQ:[],enemies:[],units:[],proj:[],eproj:[],fx:[],parts:[],texts:[],marks:[],workers:[],
     sel:[],groups:Array(10).fill(null),mode:null,nid:1,speed:1,paused:false,over:false,running:true,freeplay:false,shake:0,barricades:0,dealerIdx:-1,
     ko:[],zones:[],snipes:[],traps:[],fires:[],vortex:[],decreeT:0,base:{hp:100,maxHp:100,tier:0,reinf:0,plate:0,cannon:1,ccd:0,cang:-Math.PI/2},up:{dmg:0,hp:0},outOrder:[],
     stats:{kills:0,dmg:0,earned:0,leaks:0,merges:0,got:{},best:-1},
     players:[{human:true,name:'You',col:'#e9c46a',chips:d.start,alive:true,face:'★',hp:100,maxHp:100,power:0}].concat(RIVALS.map(r=>({...r,human:false,chips:d.start,alive:true,hp:100,maxHp:100,power:12,lastUnit:null,lastDmg:0})))};
  if(mp){G.mp=mp;G.players=mpPlayers(mp,d);}
  G.me=G.players[0];HD=null;
  addWorker();addWorker();
  bg=null;
}
function victory(why){if(G.over)return;G.over=true;G.won=true;G.place=1;if(typeof Meta!=='undefined'){Meta.ach('win_'+G.diffKey);if(why==='survived')Meta.ach('lastcall');if(G.mp)Meta.ach('table');}if(typeof clearRun==='function')clearRun();Snd.play('victory');for(let i=0;i<160;i++)confetti();setTimeout(()=>showEnd(true,why),1300);}
function defeat(){if(G.over)return;if(typeof clearRun==='function'&&!G.mp)clearRun();(G.hpHist=G.hpHist||[]).push(0);G.base.hp=0;G.over=true;G.won=false;G.me.alive=false;G.place=1+G.players.filter(p=>!p.human&&p.alive).length;if(G.mp)NET.onBust();Snd.play('lose');setTimeout(()=>showEnd(false),900);}

function updateZones2(dt){
  for(const v of G.vortex){v.t-=dt;for(const e of G.enemies){if(e.dead||e.def.fly)continue;const dx=v.x-e.x,dy=v.y-e.y,d=Math.hypot(dx,dy);if(d>v.r+e.r)continue;
      if(!e.def.boss&&d>6){const pull=Math.min(d-4,(e.def.mini?20:55)*dt);const nx=e.x+dx/d*pull,ny=e.y+dy/d*pull;if(walkable(nx,ny,e.r)){e.x=nx;e.y=ny;}}
      e.slow=Math.max(e.slow,.45);e.slowT=Math.max(e.slowT||0,.3);hitEnemy(e,v.dps*dt,v.u);}}
  G.vortex=G.vortex.filter(v=>v.t>0);
  for(const f of G.fires){f.t-=dt;for(const e of G.enemies){if(e.dead||e.def.fly)continue;if(Math.hypot(f.x-e.x,f.y-e.y)<f.r+e.r)hitEnemy(e,f.dps*dt,f.u);}}
  G.fires=G.fires.filter(f=>f.t>0);
  for(const t of G.traps){t.t-=dt;if(t.arm>0){t.arm-=dt;continue;}const hit=G.enemies.find(e=>!e.dead&&!e.def.fly&&Math.hypot(e.x-t.x,e.y-t.y)<t.r+e.r);
    if(hit){t.t=0;for(const e of G.enemies)if(!e.dead&&!e.def.fly&&Math.hypot(e.x-t.x,e.y-t.y)<t.r+30+e.r){e.stun=Math.max(e.stun||0,e.def.boss?.4:1.4);hitEnemy(e,t.dmg,t.u);}
      G.fx.push({t:'ring',x:t.x,y:t.y,r0:6,r1:t.r+34,col:'#4ade80',life:.45,max:.45,w:4});for(let i=0;i<16;i++)spark(t.x,t.y,i%2?'#4ade80':'#bbf7d0',140,.5);Snd.play('magic');}}
  G.traps=G.traps.filter(t=>t.t>0);
}
/* ---------- collision: everything has weight ---------- */
function bodyMass(o,isUnit){let m=o.r*o.r*(1+(o.def.armor||0)*.12);
  if(isUnit){const t=o.order&&o.order.t;if(t==='hold'||o.siegeP>0||t==='cast')m*=4;else if(o.target&&!o.target.dead&&Math.hypot(o.target.x-o.x,o.target.y-o.y)-o.target.r<=o.def.range+6)m*=2.6;}
  else{if(o.def.boss)m*=6;else if(o.def.mini)m*=3.5;if(o.dashT>0)m*=4;}return m;}
function shove(o,dx,dy,isUnit){const x=o.x+dx,y=o.y+dy;if(walkable(x,y,o.r)){o.x=x;o.y=y;return true;}
  if(walkable(o.x+dx,o.y,o.r)){o.x+=dx;return true;}if(walkable(o.x,o.y+dy,o.r)){o.y+=dy;return true;}return false;}
function collide(){
  const bodies=[],CS=48,cells=new Map();
  for(const u of G.units)if(!u.dead&&!u.jump)bodies.push({o:u,u:true,m:bodyMass(u,true),fly:false});
  for(const e of G.enemies)if(!e.dead)bodies.push({o:e,u:false,m:bodyMass(e,false),fly:!!e.def.fly});
  const n=bodies.length;
  for(let it=0;it<2;it++){cells.clear();
    for(let i=0;i<n;i++){const o=bodies[i].o,key=((o.x/CS)|0)*1000+((o.y/CS)|0);let c=cells.get(key);if(!c)cells.set(key,c=[]);c.push(i);}
    for(let i=0;i<n;i++){const A=bodies[i],a=A.o,cx=(a.x/CS)|0,cy=(a.y/CS)|0;
      for(let gx=cx-1;gx<=cx+1;gx++)for(let gy=cy-1;gy<=cy+1;gy++){const c=cells.get(gx*1000+gy);if(!c)continue;
        for(const j of c){if(j<=i)continue;const B=bodies[j],b=B.o;
          if(A.fly!==B.fly&&(A.u||B.u))continue;
          const mix=A.u!==B.u,rad=(a.r+b.r)*(mix?.92:A.u?.95:.82),dx=b.x-a.x;if(dx>rad||dx<-rad)continue;const dy=b.y-a.y;if(dy>rad||dy<-rad)continue;
          const d2=dx*dx+dy*dy;if(d2>=rad*rad)continue;let d=Math.sqrt(d2),nx,ny;if(d<.01){const an=(a.id||0)*2.39;nx=Math.cos(an);ny=Math.sin(an);d=0;}else{nx=dx/d;ny=dy/d;}
          const over=(rad-d)*(A.u&&B.u?.6:.5),wa=B.m/(A.m+B.m),wb=1-wa;
          shove(a,-nx*over*wa,-ny*over*wa,A.u);shove(b,nx*over*wb,ny*over*wb,B.u);
          if(mix&&it===0&&over>1.6){const lite=A.m<B.m?a:b,heavy=lite===a?b:a;if((A.m<B.m?B.m/A.m:A.m/B.m)>2.5&&(!lite.bumpAt||G.time-lite.bumpAt>.35)){lite.bumpAt=G.time;lite.bumpA=Math.atan2(lite.y-heavy.y,lite.x-heavy.x);if(G.parts.length<460)for(let k=0;k<2;k++)G.parts.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2+4,vx:(rnd()-.5)*30,vy:-8-rnd()*10,life:.4,max:.4,col:'#6b5d7a',size:3,smoke:true});}}
        }}}}
}

/* ---------- main update ---------- */
function update(dt){
  G.time+=dt;
  if(typeof tickEggs==='function')tickEggs(dt);
  if(G.phase==='break'){if(!G.mp){G.breakT-=dt;if(G.breakT<=0){G.phase='hand';startHand();}}}
  else if(G.phase==='hand'){if(!G.mp)pokerUpdate(dt);}
  else if(G.phase==='wave'){
    G.waveT+=dt;
    while(G.spawnQ.length&&G.spawnQ[0].t<=G.time)spawnEnemy(G.spawnQ.shift().k);
    if(!G.spawnQ.length&&(G.enemies.length===0||(G.waveT>G.waveSpread+40&&G.wave<MAX_WAVE)))endWave();
  }
  for(const u of G.units)updateUnit(u,dt);
  // bodies: weighted, solid collisions resolved after everyone has moved
  for(const e of G.enemies)if(!e.dead)updateEnemy(e,dt);
  updateStealth(dt);
  collide();
  updateZones2(dt);
  updateWorkers(dt);updateCannon(dt);updateKO(dt);updateAbilities(dt);
  // projectiles
  for(const p of G.proj){
    if(p.delay>0){p.delay-=dt;continue;}
    if(p.shell){p.el+=dt;const t=Math.min(1,p.el/p.T);p.x=p.sx+(p.tx-p.sx)*t;p.y=p.sy+(p.ty-p.sy)*t;p.h=Math.sin(t*Math.PI)*80;
      if(t>=1){p.dead=true;if(p.ink||p.water)Snd.play('ink');if(p.burn)G.fires.push({x:p.tx,y:p.ty,r:p.splash*.8,t:2.6,max:2.6,dps:p.dmg*.4,u:p.u});if(p.vortex)G.vortex.push({x:p.tx,y:p.ty,r:72,t:2.6,max:2.6,dps:p.dmg*.25,u:p.u});splashAt(p.tx,p.ty,p.splash,p.dmg,p.u,p.col,p.slow?{slow:p.slow}:undefined);Snd.play('boom');G.shake=Math.min(6,G.shake+1.5);
        if(p.chains){const n=nearestEnemy(p.tx,p.ty,140);if(n)chainHit(p.u||{x:p.tx,y:p.ty+10,r:0},n,p.dmg*.5,p.chains,'#fff1c2');}}continue;}
    if(p.tg&&!p.tg.dead){p.tx=p.tg.x;p.ty=p.tg.y;}
    const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),mv=p.spd*dt;
    if(d<=mv+4){p.dead=true;
      if(p.aoe){splashAt(p.tx,p.ty,p.aoe,p.dmg,p.u,p.col,{slow:p.slow,stun:p.stun,crit:p.crit,critX:p.critX});
        if(p.burn)G.fires.push({x:p.tx,y:p.ty,r:p.aoe*.8,t:2.6,max:2.6,dps:p.dmg*.4,u:p.u});
        if(p.charm)for(const o of G.enemies)if(!o.dead&&!o.def.boss&&!o.def.mini&&Math.hypot(o.x-p.tx,o.y-p.ty)<p.aoe+o.r&&rnd()<p.charm){o.charmT=2.6;}}
      else if(p.tg&&!p.tg.dead){
        if(p.jackpot&&rnd()<p.jackpot){splashAt(p.tx,p.ty,72,p.dmg*5,p.u,'#fde68a');floatText(p.tx,p.ty-14,'JACKPOT!','#fde68a',14);Snd.play('jackpot');}
        else hitEnemy(p.tg,p.dmg,p.u,{crit:p.crit,critX:p.critX,curse:p.curse,execute:p.execute});}
    }else{p.x+=dx/d*mv;p.y+=dy/d*mv;}
  }
  G.proj=G.proj.filter(p=>!p.dead);
  for(const p of G.eproj){if(p.tg.dead){p.dead=true;continue;}const dx=p.tg.x-p.x,dy=p.tg.y-p.y,d=Math.hypot(dx,dy),mv=p.spd*dt;if(d<=mv+3){p.dead=true;hurtUnit(p.tg,p.dmg);}else{p.x+=dx/d*mv;p.y+=dy/d*mv;}}
  G.eproj=G.eproj.filter(p=>!p.dead);
  G.enemies=G.enemies.filter(e=>!e.dead);
  if(G.units.some(u=>u.dead)){G.units=G.units.filter(u=>!u.dead);G.sel=G.sel.filter(u=>!u.dead);for(const g of G.groups)if(g)for(let i=g.length-1;i>=0;i--)if(g[i].dead)g.splice(i,1);}
  for(const f of G.fx)f.life-=dt;G.fx=G.fx.filter(f=>f.life>0);
  for(const m of G.marks)m.t-=dt;G.marks=G.marks.filter(m=>m.t>0);
  stepParticles(dt);
  G.shake=Math.max(0,G.shake-dt*20);if(G.base.hitT>0)G.base.hitT-=dt;if(G.base.signT>0)G.base.signT-=dt;
}
function stepParticles(dt){for(const p of G.parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.conf)p.rot+=dt*4;else{p.vx*=.92;p.vy*=.92;}}G.parts=G.parts.filter(p=>p.life>0);
  for(const t of G.texts){t.life-=dt;t.y-=26*dt;}G.texts=G.texts.filter(t=>t.life>0);}
function chipBit(x,y,spd){if(G.parts.length>500)return;const cols=['#ff3d9a','#22d3ee','#fbbf24','#f5f5f5','#a3e635'];const a=rnd()*Math.PI*2,v=spd*(.3+rnd()*.7);G.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.5+rnd()*.3,max:.8,col:cols[(rnd()*5)|0],size:3,chip:true,rot:rnd()*6});}
function spark(x,y,col,spd,life){if(G.parts.length>500)return;const a=rnd()*Math.PI*2,v=spd*(.3+rnd()*.7);G.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:life*(.6+rnd()*.6),max:life,col,size:1.5+rnd()*2});}
function confetti(){const cols=['#a78bfa','#fb7185','#fbbf24','#67e8f9'];G.parts.push({x:rnd()*W,y:-10-rnd()*80,vx:(rnd()-.5)*60,vy:80+rnd()*120,life:2.8,max:2.8,col:cols[(rnd()*4)|0],size:4,conf:true,rot:rnd()*6,sym:SYM[SUITS[(rnd()*4)|0]]});}
function floatText(x,y,txt,col,size){G.texts.push({x,y,txt,col,size:size||12,life:1,max:1});}

/* ---------- active abilities ---------- */
function castRange(u,abk){const st=uStat(u);return abk==='pounce'?230:abk==='deadshot'?st.range+80:Math.max(160,st.range+40);}
function castAbility(abk,units,tgt){
  const A=ABIL[abk],cands=units.filter(u=>u.def.ab===abk&&!u.jump);if(!cands.length)return false;
  if(A.type==='toggle'){const on=cands.some(u=>!u.siegeTo);for(const u of cands){u.siegeTo=on;u.path=[];u.order={t:'idle'};u.anchor={x:u.x,y:u.y};}Snd.play(on?'siege':'unsiege');return true;}
  const ready=cands.filter(u=>!(u.cds[abk]>0));
  if(!ready.length){toast(A.name+' is recharging');Snd.play('error');return false;}
  if(A.type==='self'){for(const u of ready)doAbility(u,abk,null);return true;}
  let best=null,bd=1e9;for(const u of ready){const d=Math.hypot(u.x-tgt.x,u.y-tgt.y);if(d<bd){bd=d;best=u;}}
  best.order={t:'cast',ab:abk,x:tgt.x,y:tgt.y,e:tgt.e||null};best.path=[];best.target=null;
  G.marks.push({x:tgt.x,y:tgt.y,t:.6,col:'#c084fc',follow:tgt.e||null});Snd.play('click');return true;
}
function doAbility(u,abk,tgt){
  const A=ABIL[abk],st=uStat(u);u.cds[abk]=A.cd;u.atk=1;
  const near=(x,y,r)=>G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-x,e.y-y)<=r+e.r);
  switch(abk){
    case 'fan':u.fanT=3;G.fx.push({t:'ring',x:u.x,y:u.y,r0:6,r1:34,col:'#ffb020',life:.4,max:.4,w:2});Snd.play('fan');break;
    case 'inferno':u.infT=3;G.fx.push({t:'ring',x:u.x,y:u.y,r0:8,r1:50,col:'#fb923c',life:.5,max:.5,w:3});Snd.play('breath');break;
    case 'lockdown':u.lockT=5;G.fx.push({t:'ring',x:u.x,y:u.y,r0:u.r,r1:180,col:'#fbbf24',life:.6,max:.6,w:3});Snd.play('lock');break;
    case 'haymaker':{const R2=A.rad*(u.r>13?1.3:1);for(const e of near(u.x,u.y,R2)){if(!e.def.boss)e.stun=Math.max(e.stun,1.5);hitEnemy(e,st.dmg*2,u);}
      G.fx.push({t:'shock',x:u.x,y:u.y+u.r*.6,r:R2,life:.5,max:.5});G.shake=Math.min(8,G.shake+4);Snd.play('slam');break;}
    case 'jackpot':{const e=nearestEnemy(u.x,u.y,st.range+80),x=e?e.x:u.x+u.face*60,y=e?e.y:u.y;splashAt(x,y,95,st.dmg*8,u,'#fde68a');G.fx.push({t:'jackpot',x,y,life:1.3,max:1.3});
      G.me.chips+=10;G.stats.earned+=10;floatText(x,y-34,'JACKPOT +10','#ffd27a',16);for(let k=0;k<26;k++)chipBit(x,y,220);Snd.play('jackpot');break;}
    case 'fanknives':{const L=st.range+20;for(let k=0;k<10;k++){const a=k/10*TAU+u.bob,ex=u.x+Math.cos(a)*L,ey=u.y+Math.sin(a)*L;for(const e of G.enemies)if(!e.dead&&segDist(e.x,e.y,u.x,u.y,ex,ey)<=e.r+6)hitEnemy(e,st.dmg,u);
      G.fx.push({t:'beam',x1:u.x,y1:u.y,x2:ex,y2:ey,col:u.def.look.beam||'#e2e8f0',life:.3,max:.3});}Snd.play('beam');break;}
    case 'decree':G.decreeT=6;G.fx.push({t:'ring',x:u.x,y:u.y,r0:10,r1:420,col:'#fbbf24',life:1,max:1,w:6});Snd.play('decree');break;
    case 'storm':G.zones.push({k:'storm',x:tgt.x,y:tgt.y,r:A.rad,t:3,max:3,tick:0,dmg:st.dmg*.55,u,seed:rnd()*9});Snd.play('magic');break;
    case 'thunder':G.zones.push({k:'thunder',x:tgt.x,y:tgt.y,r:A.rad,t:4,max:4,tick:0,dmg:st.dmg*.7,u,seed:rnd()*9});Snd.play('zap');break;
    case 'lullaby':for(const e of near(tgt.x,tgt.y,A.rad))e.stun=Math.max(e.stun,e.def.boss?1:2.5);G.fx.push({t:'notes',x:tgt.x,y:tgt.y,r:A.rad,life:1.3,max:1.3});Snd.play('lullaby');break;
    case 'barrage':case 'salvo':case 'frag':{const mis=abk==='salvo',sm=abk==='frag',sp=u.def.sp||{};
      for(let k=0;k<A.n;k++){const a=rnd()*TAU,d=Math.sqrt(rnd())*A.rad;G.proj.push({shell:true,missile:mis,die:sm,delay:k*(mis?.08:.17),sx:u.x,sy:u.y-u.r,x:u.x,y:u.y,tx:tgt.x+Math.cos(a)*d,ty:tgt.y+Math.sin(a)*d,T:mis?.55:sm?.6:.8,el:0,dmg:st.dmg*(sm?1.4:.9),u,col:'#ffb020',splash:sm?36:Math.max(42,(sp.splash||55)*.75)});}
      Snd.play('thump');break;}
    case 'deadshot':G.snipes.push({u,e:tgt.e,t:0,T:.9});Snd.play('aim');break;
    case 'pounce':{const e=tgt.e;u.jump={sx:u.x,sy:u.y,tx:e?e.x:tgt.x,ty:e?e.y:tgt.y,t:0,T:.45,dmg:st.dmg*3};u.order={t:'idle'};Snd.play('pounce');break;}
  }
}
function updateAbilities(dt){
  if(G.decreeT>0)G.decreeT-=dt;
  for(const z of G.zones){z.t-=dt;z.tick-=dt;
    if(z.k==='storm'&&z.tick<=0){z.tick=.25;for(const e of G.enemies)if(!e.dead&&Math.hypot(e.x-z.x,e.y-z.y)<=z.r+e.r){hitEnemy(e,z.dmg,z.u);e.slow=Math.max(e.slow,.25);e.slowT=.6;}}
    if(z.k==='thunder'&&z.tick<=0){z.tick=.16;const ins=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-z.x,e.y-z.y)<=z.r+e.r);let bx,by;
      if(ins.length){const e=ins[(rnd()*ins.length)|0];hitEnemy(e,z.dmg,z.u);bx=e.x;by=e.y;}else{const a=rnd()*TAU,d=rnd()*z.r;bx=z.x+Math.cos(a)*d;by=z.y+Math.sin(a)*d;}
      G.fx.push({t:'bolt',x:bx,y:by,life:.22,max:.22,seed:rnd()*999});if(rnd()<.4)Snd.play('zap');}}
  G.zones=G.zones.filter(z=>z.t>0);
  for(const s of G.snipes){s.t+=dt;if(s.u.dead||!s.e||s.e.dead){s.done=true;continue;}
    if(s.t>=s.T){s.done=true;const u=s.u,e=s.e,dmg=uStat(u).dmg*6;e.hp-=dmg;e.flash=.15;G.stats.dmg+=dmg;u.atk=1;
      G.fx.push({t:'beam',x1:u.x,y1:u.y-4,x2:e.x,y2:e.y,col:'#ff3b5a',life:.35,max:.35,w:3});G.fx.push({t:'ring',x:e.x,y:e.y,r0:4,r1:36,col:'#ff3b5a',life:.4,max:.4,w:3});
      floatText(e.x,e.y-e.r-8,fmt(dmg)+'!','#ff8fa3',16);G.shake=Math.min(8,G.shake+3);Snd.play('snipe');if(e.hp<=0)killEnemy(e,u);}}
  G.snipes=G.snipes.filter(s=>!s.done);
}
