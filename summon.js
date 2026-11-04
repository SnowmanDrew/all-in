'use strict';
/* ============ ALL IN — summoning that pops ============
   Your hand lifts off the table; the cards that made the hand light up gold and the dead cards fall away. The
   scoring cards arc up over the street, fan, spin and collapse into a point of light — and a beam drops from the
   sky onto the spot, a flash, a shockwave and a spray of suits, and the creature slams down with a squash.
   Its name pops up over it (with NEW! the first time). Bigger hands: a taller, brighter beam in their colour. */

Object.assign(FOLEY,{
  whoosh(t){FX.sweep(t,500,2600,'bandpass',.1,.42,1.6);},
  slam(t){FX.thump(t,170,46,.26,.32);FX.click(t,1200,2,.12,.05);FX.sweep(t+.01,4000,600,'lowpass',.1,.3,.8);},
  sparkle(t){[1568,2093,2637,3136].forEach((f,i)=>Snd.tone(f,.18,'sine',.035,1.02,i*.045));}
});
const SUMMON_COL=r=>r>=9?['#fff3c4','#ff3d9a','#22e1ff']:r>=8?['#e9d5ff','#b46bff','#f0abfc']:r>=6?['#ffe9a8','#ff7ac6','#fbbf24']:r>=3?['#d9fbff','#22e1ff','#e9c46a']:['#fff7d6','#e9c46a','#fde68a'];
function summonBurst(units,rank,k){if(!G)return;const cols=SUMMON_COL(rank),big=rank>=6;
  for(const u of units){G.summonFx=G.summonFx||[];G.summonFx.push({x:u.x,y:u.y,t0:G.time,rank,cols});
    G.fx.push({t:'ring',x:u.x,y:u.y,r0:4,r1:40+rank*7,col:cols[1],life:.55,max:.55,w:3});G.fx.push({t:'ring',x:u.x,y:u.y+u.r*.8,r0:4,r1:26+rank*3,col:'#e5e7eb',life:.4,max:.4,w:2});
    const n=10+rank*3;for(let i=0;i<n&&G.parts.length<520;i++){const a=Math.random()*TAU,v=70+Math.random()*(110+rank*14);
      G.parts.push({x:u.x,y:u.y-6,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.7-40,life:.8+Math.random()*.6,max:1.3,col:cols[i%3],size:4,conf:true,rot:Math.random()*6,sym:['♠','♥','♦','♣'][i%4]});}
    for(let i=0;i<8;i++)spark(u.x,u.y+u.r*.7,'#d6c7a8',90,.5);
    u.popAt=G.time;}
  Snd.play('slam');if(rank>=3)Snd.play('sparkle');
  // the name pops up over the creature
  const u0=units[0],d=UNITS[k];if(u0&&d){const first=typeof Meta!=='undefined'&&Meta.data&&!Meta.data.seen[k];
    floatText(u0.x,u0.y-u0.r*2.4-14,(first?'NEW! ':'')+(units.length>1?units.length+'× ':'')+d.name,first?'#fde047':cols[0],first?15:13);
    if(first)for(let i=0;i<24;i++)chipBit(u0.x,u0.y-u0.r*2,200);}}
// the beam and flash, drawn over the street
function drawSummonFx(c,t){if(!G||!G.summonFx||!G.summonFx.length)return;c.save();c.globalCompositeOperation='lighter';
  for(const f of G.summonFx){const k=(G.time-f.t0)/(.7+f.rank*.05);if(k>1)continue;const a=1-k,w=(10+f.rank*2.4)*(1-k*.75),top=Math.max(0,f.y-180-f.rank*30);
    let g=c.createLinearGradient(0,top,0,f.y);g.addColorStop(0,`rgba(255,255,255,0)`);g.addColorStop(.6,hexA(f.cols[1],.32*a));g.addColorStop(1,hexA(f.cols[0],.85*a));
    c.fillStyle=g;c.beginPath();c.moveTo(f.x-w*.35,top);c.lineTo(f.x+w*.35,top);c.lineTo(f.x+w,f.y);c.lineTo(f.x-w,f.y);c.closePath();c.fill();
    const fr=18+f.rank*4+k*30;g=c.createRadialGradient(f.x,f.y,1,f.x,f.y,fr);g.addColorStop(0,hexA(f.cols[0],.9*a*a));g.addColorStop(.4,hexA(f.cols[1],.4*a));g.addColorStop(1,hexA(f.cols[1],0));c.fillStyle=g;c.fillRect(f.x-fr,f.y-fr,fr*2,fr*2);}
  c.restore();G.summonFx=G.summonFx.filter(f=>G.time-f.t0<1.4);}
{const _t=drawTopWarn;drawTopWarn=function(c,t){_t(c,t);drawSummonFx(c,t);};}

// the cards: lift, sort the live ones from the dead, arc over the street and collapse into the creature
flyHand=function(ev,units){
  const hand=document.getElementById('cards');if(!hand||!units.length||reduceMotion())return;
  const cards=[...hand.querySelectorAll('.card')];if(!cards.length)return;
  const scoring=new Set(ev&&ev.scoring||[]);const live=cards.map((_,i)=>scoring.size?scoring.has(i):true);
  const target=units[0],to=boardToPage(target.x,target.y-target.r*1.2);if(!to)return;
  const LAND=560,nLive=live.filter(Boolean).length;let li=0;Snd.play('whoosh');
  cards.forEach((card,i)=>{const from=card.getBoundingClientRect();if(!from.width)return;
    const cl=card.cloneNode(true);cl.classList.remove('new','sel','dim','fly');cl.classList.add('flycard',live[i]?'live':'dead');
    cl.style.cssText=`position:fixed;left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;margin:0;z-index:40;pointer-events:none`;document.body.appendChild(cl);
    let an;
    if(!live[i]){an=cl.animate([{transform:'translate(0,0) rotate(0)',opacity:1,filter:'none'},{transform:'translate(0,-14px) rotate(0)',opacity:.9,filter:'grayscale(1) brightness(.7)',offset:.25},
      {transform:`translate(${(Math.random()-.5)*40}px,70px) rotate(${(Math.random()-.5)*50}deg)`,opacity:0,filter:'grayscale(1) brightness(.5)'}],{duration:520,easing:'cubic-bezier(.5,0,.8,.6)',fill:'forwards'});}
    else{const j=li++,fan=(j-(nLive-1)/2)*16,dx=to.x-from.left-from.width/2,dy=to.y-from.top-from.height/2,peak=-90-Math.abs(fan)*.6;
      an=cl.animate([
        {transform:'translate(0,0) rotate(0) scale(1)',offset:0},
        {transform:'translate(0,-22px) rotate(0) scale(1.12)',offset:.18},
        {transform:`translate(${dx*.5+fan*2}px,${dy*.5+peak}px) rotate(${fan*1.5}deg) scale(.78)`,offset:.6},
        {transform:`translate(${dx+fan*.6}px,${dy-24}px) rotate(${fan*3+180}deg) scale(.42)`,offset:.86},
        {transform:`translate(${dx}px,${dy}px) rotate(${360+fan*4}deg) scale(.06)`,opacity:.4,offset:1}],{duration:LAND,delay:j*24,easing:'cubic-bezier(.4,0,.3,1)',fill:'forwards'});}
    an.onfinish=()=>cl.remove();setTimeout(()=>cl.remove(),LAND+1500);});
  // a flare where the cards collapse, then the beam and the slam
  setTimeout(()=>{const fl=document.createElement('div');fl.className='sumflare';fl.style.left=to.x+'px';fl.style.top=to.y+'px';document.body.appendChild(fl);setTimeout(()=>fl.remove(),520);},LAND-40);
  for(const u of units)u.spawnT=Math.max(u.spawnT||0,.6);};
{const _hf=handFeel;handFeel=function(k,ev,units){_hf.apply(this,arguments);const rank=ev?ev.rank:0;
  const delay=reduceMotion()?0:600;setTimeout(()=>{if(G)summonBurst(units.filter(u=>!u.dead),rank,k);},delay);};}
{const st=document.createElement('style');st.textContent=`
.flycard.live{box-shadow:0 0 0 2px #fde047,0 0 18px rgba(253,224,71,.85),0 0 40px rgba(255,61,154,.45)!important}
.sumflare{position:fixed;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;z-index:41;pointer-events:none;background:radial-gradient(circle,#fff 0 30%,rgba(253,224,71,.8) 45%,rgba(255,61,154,0) 72%);animation:sumFl .5s ease-out forwards}
@keyframes sumFl{0%{transform:scale(.4);opacity:1}40%{transform:scale(4.2);opacity:.95}100%{transform:scale(6);opacity:0}}`;document.head.appendChild(st);}
// the first time you make a merged creature, its reveal gets a moment too
{const _mu=mergeUnits;mergeUnits=function(a,b){const out=a&&b?mergeResult(a.k,b.k):null,first=!!out&&typeof Meta!=='undefined'&&Meta.data&&!Meta.data.seen[out];
  const u=_mu.apply(this,arguments);
  if(u&&first&&!u.def.secret){setTimeout(()=>{if(!G||u.dead)return;floatText(u.x,u.y-u.r*2.4-14,'NEW! '+u.def.name,'#fde047',15);for(let i=0;i<24;i++)chipBit(u.x,u.y-u.r*2,200);
      G.fx.push({t:'ring',x:u.x,y:u.y,r0:6,r1:60,col:'#fde047',life:.6,max:.6,w:3});Snd.play('sparkle');},320);}
  return u;};}
