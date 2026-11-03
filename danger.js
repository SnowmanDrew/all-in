'use strict';
/* ============ ALL IN — the middle of the run: the house adapts, and danger you can read ============
   1. Scouting: during each hand from round 8, the house looks at your army, finds what it is
      neglecting, and sends a counter-squad with the next round. You are told what and why in time
      to do something about it.
   2. Readable danger: Dice Bombers telegraph where they will land, boss moves say what they are and
      show their reach, the casino tells you who is biting it, and warnings clear when they no longer apply. */

const BOMB={range:250,rad:58,cd:4.4,wind:1.3,fly:.45};

/* ---------- the plan: set-piece rounds, announced a round ahead ---------- */
{const _sw=startWave;startWave=function(){_sw.apply(this,arguments);const P=wavePlan(G.wave);
  if(P)setTimeout(()=>{if(G&&G.phase==='wave')banner(P.name,'Punishes '+P.why,'boss');},1400);planUI();};}
{const _ew=endWave;endWave=function(){_ew.apply(this,arguments);planUI();};}
{const _sh=startHand;startHand=function(){_sh.apply(this,arguments);const P=wavePlan(G.wave+1);if(P){gameLog(`Next round is ${P.name}. It punishes ${P.why}.`,'bad');Snd.play('windup');}planUI();};}

/* ---------- the Dice Bomber at work ---------- */
function bomberThink(e,dt){if(e.dead||e.hidden)return false;
  if(e.bomb){if(e.stun>0)return true;e.bomb.wind-=dt;e.face=e.bomb.x>e.x?1:-1;e.atk=Math.max(e.atk||0,.4);
    if(e.bomb.wind<=0){G.bombs.push({x:e.bomb.x,y:e.bomb.y,sx:e.x,sy:e.y-e.r,t:0,T:BOMB.fly,dmg:e.def.dmg*waveDmgMult()});e.bomb=null;e.bcd=BOMB.cd*(.85+rnd()*.3);Snd.play('thump');}
    return true;}
  e.bcd=(e.bcd==null?1.5+rnd()*1.5:e.bcd)-dt;if(e.bcd>0||e.stun>0)return false;
  // aim at the busiest clump in reach; a lone creature is not worth a bomb
  let best=null,bn=1;for(const u of G.units){if(u.dead||u.jump||Math.hypot(u.x-e.x,u.y-e.y)>BOMB.range)continue;let k=0,sx=0,sy=0;
    for(const o of G.units)if(!o.dead&&Math.hypot(o.x-u.x,o.y-u.y)<BOMB.rad*.9){k++;sx+=o.x;sy+=o.y;}if(k>bn){bn=k;best={x:sx/k,y:sy/k};}}
  if(!best){e.bcd=.6;return false;}
  e.bomb={x:best.x,y:best.y,wind:BOMB.wind,T:BOMB.wind};if(!G.fihT||G.time-G.fihT>3){G.fihT=G.time;floatText(e.x,e.y-e.r-10,'Fire in the hole!','#fdba74',10);}return true;}
function updateBombs(dt){if(!G.bombs)G.bombs=[];for(const b of G.bombs){b.t+=dt;if(b.t<b.T)continue;b.dead=true;let n=0;
  for(const u of G.units)if(!u.dead&&!u.jump&&Math.hypot(u.x-b.x,u.y-b.y)<BOMB.rad+u.r*.5){hurtUnit(u,u.maxHp*.075+b.dmg*2.2);u.stunT=Math.max(u.stunT||0,.5);n++;}
  G.fx.push({t:'shock',x:b.x,y:b.y,r:BOMB.rad,life:.5,max:.5});for(let i=0;i<22;i++)spark(b.x,b.y,i%3?'#fb923c':'#fde68a',200,.6);G.shake=Math.min(8,G.shake+2.5+n);Snd.play('boom');
  if(n>=2)floatText(b.x,b.y-24,`${n} caught!`,'#fdba74',13);}
  G.bombs=G.bombs.filter(b=>!b.dead);}
{const _ue=updateEnemy;updateEnemy=function(e,dt){if(e.k==='bomber'){if(e.flash>0)e.flash-=dt;if(e.atk>0)e.atk-=dt*4;if(bomberThink(e,dt)){if(e.stun>0)e.stun-=dt;return;}}return _ue(e,dt);};}
{const _u=update;update=function(dt){_u(dt);if(G.phase==='wave'||(G.bombs&&G.bombs.length))updateBombs(dt);else G.bombs=[];casinoTicker(dt);};}

/* ---------- who is biting the casino ---------- */
{const _ac=updateAtCasino;updateAtCasino=function(e){const h0=G.base.hp;_ac(e);const d=h0-G.base.hp;if(d>0){if(G.round){const hb=G.round.hurtBy||(G.round.hurtBy={});hb[e.k]=(hb[e.k]||0)+d;}
  const T=G.hurtNow||(G.hurtNow={});T[e.k]=(T[e.k]||0)+d;G.hurtSeen=G.time;}};}
function casinoTicker(dt){if(!G.hurtNow)return;G.hurtT=(G.hurtT||0)+dt;if(G.hurtT<.9)return;G.hurtT=0;
  const ent=Object.entries(G.hurtNow).sort((a,b)=>b[1]-a[1]);G.hurtNow={};let y=BASE.r0*TILE-30;
  for(const [k,d] of ent.slice(0,2)){if(d<1)continue;floatText(BASE.x,y,`−${Math.round(d)} ${ENEMIES[k].name}`,'#ff8fa3',11);y-=14;}}
// the round card says what hurt you
{const _rs=roundSummary;roundSummary=function(r){const hb=G&&G.round&&G.round.hurtBy;_rs(r);if(!hb)return;const ent=Object.entries(hb).filter(x=>x[1]>=1).sort((a,b)=>b[1]-a[1]).slice(0,3);if(!ent.length)return;
  const el=$('#roundCard');const d=document.createElement('div');d.className='rhurt';d.innerHTML=`<small>Casino hit by</small>${ent.map(([k,v])=>`<span><canvas data-ek="${k}"></canvas>${esc(ENEMIES[k].name)} <b>−${Math.round(v)}</b></span>`).join('')}`;
  el.appendChild(d);d.querySelectorAll('canvas').forEach(c=>enemyPortrait(c,c.dataset.ek,18));
  gameLog(`Casino damage this round: ${ent.map(([k,v])=>`${ENEMIES[k].name} −${Math.round(v)}`).join(', ')}.`,'bad');};}

/* ---------- the plan card: what is coming, what it punishes, how to answer ---------- */
function planUI(){let el=$('#scout');if(!G||G.over){if(el)el.classList.remove('show');return;}
  const live=G.phase==='wave',w=live?G.wave:G.wave+1,P=wavePlan(w);
  if(!P){if(el)el.classList.remove('show');return;}
  if(!el){el=document.createElement('div');el.id='scout';$('#boardWrap').appendChild(el);}
  const c=waveComp(w),cnt={};for(const k of c.list)cnt[k]=(cnt[k]||0)+1;
  el.className='show'+(live?' live':'');
  el.innerHTML=`<div class="sh">${icon(P.icon)}<b>${live?'Now':'Next round'}: ${P.name}</b></div>
    <div class="sw">Punishes ${P.why}.</div>
    <div class="sn">${Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,n])=>`<span><canvas data-ek="${k}"></canvas>${n} ${esc(ENEMIES[k].name)}</span>`).join('')}</div>
    <div class="st">${P.answer}</div>`;
  el.querySelectorAll('canvas').forEach(cv2=>enemyPortrait(cv2,cv2.dataset.ek,20));}
{const _st=syncTop;syncTop=function(){_st.apply(this,arguments);if(!G)return;const sig=G.wave+'|'+G.phase+'|'+G.over;if(sig!==planUI.sig){planUI.sig=sig;planUI();}};}

/* from round 11, hexers hold their ground and shoot when a creature is in range: waiting for them is the mistake */
{const _ue=updateEnemy;updateEnemy=function(e,dt){if(e.k!=='hexer'||e.dead||e.atCasino||G.wave<=10)return _ue(e,dt);
  let near=1e9;for(const u of G.units)if(!u.dead){const d=Math.hypot(u.x-e.x,u.y-e.y);if(d<near)near=d;}
  if(near>e.def.ranged*.92||near<e.r+20)return _ue(e,dt);
  const s0=e.slow,t0=e.slowT||0;e.slow=1;_ue(e,dt);if(t0>0){e.slowT=t0-dt;e.slow=e.slowT>0?s0:0;}else{e.slow=s0;e.slowT=0;}};}

/* ---------- telegraphs: what is about to happen, and where ---------- */
const MOVE_NAME={summon:'SUMMONS',dash:'CHARGE',shield:'SHIELD',slam:'SLAM',coin:'COIN FLIP',decoy:'DECOYS',vault:'VAULT',bonds:'BAIL',payday:'INTEREST',stop:'STOP!',reality:'REALITY CHECK'};
const MOVE_REACH={slam:75,stop:150,coin:140};
function drawGroundWarn(c,t){if(!G)return;
  // where the dice will land
  for(const e of G.enemies){if(!e.bomb||e.dead)continue;const b=e.bomb,k=1-Math.max(0,b.wind)/b.T;
    c.save();c.fillStyle=`rgba(239,68,68,${.10+.22*k})`;c.beginPath();c.arc(b.x,b.y,BOMB.rad,0,TAU);c.fill();
    c.strokeStyle=`rgba(255,90,90,${.6+.4*Math.sin(t*14)})`;c.lineWidth=2;c.setLineDash([7,5]);c.lineDashOffset=-t*30;c.beginPath();c.arc(b.x,b.y,BOMB.rad,0,TAU);c.stroke();c.setLineDash([]);
    c.strokeStyle='#ff3b5a';c.lineWidth=3;c.beginPath();c.arc(b.x,b.y,BOMB.rad*.35,-Math.PI/2,-Math.PI/2+TAU*k);c.stroke();
    c.strokeStyle='rgba(255,140,90,.35)';c.lineWidth=1.2;c.beginPath();c.moveTo(e.x,e.y-e.r);c.quadraticCurveTo((e.x+b.x)/2,Math.min(e.y,b.y)-70,b.x,b.y);c.stroke();c.restore();}
  for(const b of G.bombs||[]){const k=b.t/b.T;c.save();c.fillStyle=`rgba(239,68,68,${.3+.2*k})`;c.beginPath();c.arc(b.x,b.y,BOMB.rad,0,TAU);c.fill();c.restore();}
  // boss reach while it winds up
  for(const e of G.enemies){if(!(e.windup>0)||e.dead)continue;const k=1-e.windup/.9,R=MOVE_REACH[e.move];
    if(R){c.save();c.fillStyle=`rgba(255,59,90,${.08+.18*k})`;c.strokeStyle='rgba(255,59,90,.85)';c.lineWidth=2;c.setLineDash([8,5]);c.beginPath();c.arc(e.x,e.y,R,0,TAU);c.fill();c.stroke();c.setLineDash([]);c.restore();}
    if(e.move==='dash'){const L=180,fx=e.fx||1,fy=e.fy||0,ex=e.x+fx*L,ey=e.y+fy*L;c.save();c.strokeStyle=`rgba(255,59,90,${.4+.5*k})`;c.lineWidth=e.r*1.4;c.lineCap='round';c.globalAlpha=.35;
      c.beginPath();c.moveTo(e.x,e.y);c.lineTo(ex,ey);c.stroke();c.globalAlpha=1;c.lineWidth=3;c.beginPath();const a=Math.atan2(fy,fx);c.moveTo(ex,ey);c.lineTo(ex-Math.cos(a-.5)*18,ey-Math.sin(a-.5)*18);c.moveTo(ex,ey);c.lineTo(ex-Math.cos(a+.5)*18,ey-Math.sin(a+.5)*18);c.stroke();c.restore();}}}
function drawTopWarn(c,t){if(!G)return;
  for(const e of G.enemies){if(!(e.windup>0)||e.dead||!MOVE_NAME[e.move])continue;const R=e.r*VIS_E,y=e.y-R-34-(e.def.fly?14:0);
    c.save();c.font='12px Bungee,Impact,sans-serif';c.textAlign='center';c.textBaseline='middle';const w=c.measureText(MOVE_NAME[e.move]).width+12;
    c.fillStyle='rgba(11,6,18,.85)';rr(c,e.x-w/2,y-9,w,18,5);c.fill();c.strokeStyle='#ff3b5a';c.lineWidth=1.5;c.stroke();c.fillStyle='#ffd1dc';c.fillText(MOVE_NAME[e.move],e.x,y+.5);c.restore();}
  // the casino flags who is at the door, only while they are there
  const at=G.enemies.filter(e=>!e.dead&&e.atCasino&&!e.hidden);
  if(at.length){const p=.5+.5*Math.sin(t*8);c.save();c.strokeStyle=`rgba(255,59,90,${.45+.4*p})`;c.lineWidth=3;rr(c,BASE.c0*TILE-6,BASE.r0*TILE-6,BASE.w*TILE+12,BASE.h*TILE+12,10);c.stroke();
    const cnt={};for(const e of at)cnt[e.def.name]=(cnt[e.def.name]||0)+1;const txt=Object.entries(cnt).map(([n,k])=>k>1?`${k}× ${n}`:n).slice(0,2).join(' · ');
    c.font='11px Bungee,Impact,sans-serif';c.textAlign='center';const w=c.measureText(txt).width+16,x=BASE.x,y=(BASE.r0+BASE.h)*TILE+16;
    c.fillStyle='rgba(60,6,18,.92)';rr(c,x-w/2,y-9,w,18,9);c.fill();c.fillStyle='#ffd1dc';c.textBaseline='middle';c.fillText(txt,x,y+.5);c.restore();}}

/* ---------- styles ---------- */
(function(){const css=`
#scout{position:absolute;left:12px;top:12px;z-index:6;width:270px;padding:9px 11px 10px;border-radius:10px;background:rgba(16,8,22,.92);box-shadow:0 0 0 1.5px #ff3b5a,0 0 22px rgba(255,59,90,.35),0 10px 30px rgba(0,0,0,.6);
  color:#f3e8ff;font:400 12px/1.35 var(--body,Barlow),sans-serif;pointer-events:none;opacity:0;transform:translateY(-6px);transition:opacity .3s,transform .3s}
#scout.show{opacity:1;transform:none}
#scout .sh{display:flex;align-items:center;gap:6px;font:400 12px var(--head);color:#ff8fa3;letter-spacing:.04em;text-transform:uppercase}#scout .sh .ic{width:15px;height:15px}
#scout .sw{margin:4px 0 5px;color:#fff}
#scout .sn{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;font-weight:600}#scout .sn span{display:flex;align-items:center;gap:3px}#scout .sn canvas{width:20px;height:20px}
#scout .sn em{margin-left:auto;font:400 10px var(--head);font-style:normal;color:#ff8fa3}
#scout .st{margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.12);color:#ffe9b0}
#scout.live{width:240px;box-shadow:0 0 0 1.5px #ff3b5a,0 0 14px rgba(255,59,90,.25)}#scout.live .sw{display:none}
#roundCard .rhurt{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.1);font-size:11.5px;color:#ffd1dc}
#roundCard .rhurt small{font:400 9.5px var(--head);color:#ff8fa3;letter-spacing:.06em;text-transform:uppercase;width:100%}
#roundCard .rhurt span{display:flex;align-items:center;gap:3px}#roundCard .rhurt canvas{width:18px;height:18px}#roundCard .rhurt b{color:#ff8fa3}`;
const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);})();
