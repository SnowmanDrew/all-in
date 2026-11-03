'use strict';
/* ============ ALL IN — game feel ============
   The moments that should land: your hand turning into creatures, a monster hand,
   bad luck biting your casino, and the start of a wave. */

const FEEL={pauseUntil:0,slowUntil:0,slowK:1,waveAt:-9,lastHurt:0};
function reduceMotion(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}}

/* simulation time scale: a brief freeze for a big hit, slow motion for a royal flush */
function feelScale(){const now=performance.now();if(now<FEEL.pauseUntil)return 0;if(now<FEEL.slowUntil)return FEEL.slowK;return 1;}
function hitPause(ms){if(reduceMotion())return;FEEL.pauseUntil=Math.max(FEEL.pauseUntil,performance.now()+ms);}
function slowMo(ms,k){if(reduceMotion())return;FEEL.slowUntil=performance.now()+ms;FEEL.slowK=k;}

function feelLayer(id,cls){let el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;el.className=cls||'';(document.getElementById('boardWrap')||document.body).appendChild(el);}return el;}
function screenFlash(col,strength){const el=feelLayer('feelFlash','feelflash');el.style.setProperty('--fc',col);el.style.setProperty('--fa',strength);el.classList.remove('go');void el.offsetWidth;el.classList.add('go');}

/* board coordinates -> page coordinates */
function boardToPage(x,y){const cvs=document.getElementById('cv')||document.querySelector('#boardWrap canvas');if(!cvs)return null;const r=cvs.getBoundingClientRect();return {x:r.left+x/W*r.width,y:r.top+y/H*r.height,s:r.width/W};}

/* your five cards fly from the hand onto the board and burst into the creatures they summon */
function flyHand(ev,units){
  const hand=document.getElementById('cards');if(!hand||!units.length||reduceMotion())return;
  const cards=[...hand.querySelectorAll('.card')];if(!cards.length)return;
  const scoring=new Set(ev&&ev.scoring||[]);
  cards.forEach((card,i)=>{const from=card.getBoundingClientRect();if(!from.width)return;const u=units[i%units.length],to=boardToPage(u.x,u.y);if(!to)return;
    const cl=card.cloneNode(true);cl.classList.remove('new','sel','dim');cl.classList.add('flycard');cl.style.cssText=`position:fixed;left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;margin:0;z-index:40;pointer-events:none`;
    document.body.appendChild(cl);const dx=to.x-from.left-from.width/2,dy=to.y-from.top-from.height/2,lift=-60-Math.random()*40,spin=(Math.random()-.5)*50;
    const delay=i*55+(scoring.has(i)?0:30),dur=520;
    const an=cl.animate([{transform:'translate(0,0) rotate(0) scale(1)',opacity:1},{transform:`translate(${dx*.45}px,${dy*.45+lift}px) rotate(${spin*.5}deg) scale(.8)`,opacity:1,offset:.45},
      {transform:`translate(${dx}px,${dy}px) rotate(${spin}deg) scale(.22)`,opacity:.9}],{duration:dur,delay,easing:'cubic-bezier(.45,.05,.55,.95)',fill:'forwards'});
    an.onfinish=()=>cl.remove();setTimeout(()=>cl.remove(),dur+delay+200);});
  // the creatures pop in as the cards land
  for(const u of units)u.spawnT=Math.max(u.spawnT||0,.55);
}

/* called from spawnHandUnits for every hand you play */
function handFeel(k,ev,units){
  const rank=ev?ev.rank:0;flyHand(ev,units);
  const land=(fn,ms)=>setTimeout(fn,ms);
  if(rank>=9){ // royal flush
    land(()=>{slowMo(1400,.25);hitPause(160);screenFlash('#ffe9a8',.75);if(G){G.shake=Math.min(9,(G.shake||0)+7);for(const u of units)for(let j=0;j<40;j++)spark(u.x,u.y,['#ffe9a8','#ff3d9a','#22e1ff'][j%3],220,1.2);
      for(let j=0;j<5;j++)G.fx.push({t:'ring',x:units[0].x,y:units[0].y,r0:6,r1:90+j*40,col:j%2?'#ff3d9a':'#ffe9a8',life:.9+j*.15,max:.9+j*.15,w:4});}
      Snd.play('jackpot');Snd.play('bighand');},600);
  }else if(rank>=6){ // full house or better
    land(()=>{hitPause(rank>=8?140:95);screenFlash(rank>=8?'#b46bff':'#ffcf7a',rank>=7?.5:.35);if(G){G.shake=Math.min(8,(G.shake||0)+3+rank*.3);
      for(const u of units){G.fx.push({t:'ring',x:u.x,y:u.y,r0:6,r1:70,col:'#ffe9a8',life:.7,max:.7,w:4});for(let j=0;j<22;j++)spark(u.x,u.y,'#ffe9a8',160,.8);}}Snd.play('bighand');},600);
  }else if(rank>=3){land(()=>{if(G)for(const u of units)G.fx.push({t:'ring',x:u.x,y:u.y,r0:4,r1:46,col:'#e9c46a',life:.5,max:.5,w:3});},600);}
}

/* bad luck biting your casino */
function casinoHurt(dmg){
  const now=performance.now();const el=feelLayer('feelHurt','feelhurt');el.style.setProperty('--ha',Math.min(.85,.35+dmg*.03));el.classList.remove('go');void el.offsetWidth;el.classList.add('go');
  if(now-FEEL.lastHurt>380){FEEL.lastHurt=now;Snd.play('casinohit');}
  if(G&&G.base)G.base.signT=.35;
}

/* wave start: the portal flares and the route lights up once */
function waveFeel(){FEEL.waveAt=performance.now();}
function drawWaveFeel(c,t){
  const k=(performance.now()-FEEL.waveAt)/1000;if(k<0||k>1.8||!G||G.phase!=='wave')return;
  // portal flare
  const x=14,y=SPAWN.y,a=Math.max(0,1-k/1.1);if(a>0){c.save();c.globalCompositeOperation='lighter';const g=c.createRadialGradient(x,y,4,x,y,90+k*60);g.addColorStop(0,`rgba(255,61,154,${.55*a})`);g.addColorStop(1,'rgba(255,61,154,0)');c.fillStyle=g;c.fillRect(x-160,y-160,320,320);
    for(let i=0;i<3;i++){c.strokeStyle=`rgba(255,180,220,${a*(.8-i*.2)})`;c.lineWidth=3-i*.6;c.beginPath();c.ellipse(x,y,14+k*60+i*16,40+k*70+i*18,0,0,TAU);c.stroke();}c.restore();}
  // the route the bad luck will take, swept from the portal to your casino
  if(typeof routePoints!=='function')return;const pts=routePoints();if(!pts||pts.length<2)return;
  const head=Math.min(1,k/1.1),fade=k<1.1?1:Math.max(0,1-(k-1.1)/.7),n=Math.floor(pts.length*head);
  c.save();c.globalCompositeOperation='lighter';c.lineCap='round';c.lineJoin='round';
  c.strokeStyle=`rgba(255,61,154,${.22*fade})`;c.lineWidth=12;c.beginPath();for(let i=0;i<n;i++){const [px,py]=pts[i];i?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();
  c.strokeStyle=`rgba(255,200,230,${.55*fade})`;c.lineWidth=2.2;c.setLineDash([10,10]);c.lineDashOffset=-t*60;c.stroke();c.setLineDash([]);
  if(n>0&&k<1.1){const [hx,hy]=pts[Math.min(n,pts.length-1)];const g=c.createRadialGradient(hx,hy,1,hx,hy,22);g.addColorStop(0,'rgba(255,230,245,.9)');g.addColorStop(1,'rgba(255,61,154,0)');c.fillStyle=g;c.fillRect(hx-22,hy-22,44,44);}
  c.restore();
}
