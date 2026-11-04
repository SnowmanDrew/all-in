'use strict';
/* ============ ALL IN — the street is clear ============
   When a round ends, the army celebrates: every creature that isn't busy hops a couple of times (staggered, so
   it ripples down the line), some throw up a little emote and a pop of chips, and the croupiers hop and wave.
   A clean round gets a bigger party. */
const CHEER={until:0,big:false};
const CHEER_EMO=['★','♥','♪','$','✦','♠','♦'],CHEER_COL=['#fde047','#fb7185','#a5f3fc','#86efac','#fdba74','#e9d5ff','#f0abfc'];
{const _le=localEndWave;localEndWave=function(w){const clean=!G.waveDmg&&G.enemies.length===0;_le.apply(this,arguments);if(!G||G.over)return;
  const now=G.time;CHEER.until=now+2.8;CHEER.big=clean;
  G.units.forEach((u,i)=>{const d=Math.min(.7,Math.abs(u.x-BASE.x)/1400)+Math.random()*.18;u.cheer={t0:now+.35+d,hops:clean?3:2,h:10+Math.min(10,u.r*.6)+Math.random()*4,emo:Math.random()<(clean?.6:.35),done:false};});
  for(const wk of G.workers)wk.cheer={t0:now+.3+Math.random()*.3,hops:clean?3:2};};}
// height of a staggered double/triple hop at time now
function cheerHop(c,now,h){if(!c)return 0;const T=.34,k=(now-c.t0)/T;if(k<0||k>=c.hops)return 0;const f=k%1;return Math.sin(f*Math.PI)*h*(1-.22*Math.floor(k));}
{const _u=update;update=function(dt){_u(dt);if(!G||!G.units)return;const now=G.time;
  if(now>CHEER.until+.5)return;
  for(const u of G.units){const c=u.cheer;if(!c||u.dead||u.jump)continue;const busy=u.order&&(u.order.t==='move'||u.order.t==='amove'||u.order.t==='attack');
    if(busy||G.phase==='wave'){if(!u.jump)u.jh=0;u.cheer=null;continue;}
    u.jh=cheerHop(c,now,c.h);
    if(c.emo&&!c.done&&now>=c.t0+.17){c.done=true;const i=(Math.random()*CHEER_EMO.length)|0;floatText(u.x,u.y-u.r*2-14,CHEER_EMO[i],CHEER_COL[i],13);for(let k=0;k<5;k++)chipBit(u.x,u.y-u.r-6,90);}
    if(now>c.t0+c.hops*.34+.05){u.jh=0;u.cheer=null;}}};}
// croupiers: a hop, and a wave when their hands are free
function cheerLift(w){return G&&w.cheer?cheerHop(w.cheer,G.time,4):0;}
function cheerWave(w,t){return G&&w.cheer&&G.time>=w.cheer.t0&&G.time<w.cheer.t0+w.cheer.hops*.34+.6?Math.sin(t*14+w.lane)*.6:null;}
