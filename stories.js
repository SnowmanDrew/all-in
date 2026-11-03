'use strict';
/* ============ ALL IN — little stories on the Strip ============
   Red hears thugs in the sewers before they climb out, and lets you know.
   After a lap he sometimes brings something back.
   The stranger at the Starlite Motel offers a deal twice a run: twice the bad luck, triple the pay. */

/* ---------- Red: a good boy with good ears ---------- */
{const _rt=redTick;redTick=function(dt){const R=G&&G.red;if(!R)return _rt(dt);
  if(R.state==='alert'){R.t-=dt;if(R.t<=0){R.state=Math.hypot(R.x-R.hx,R.y-R.hy)>4?'back':'settle';R.t=.8;}return;}
  // something is coming up a manhole in the next few seconds: Red hears it first
  if(G.phase==='wave'&&R.state!=='alert'){const q=G.spawnQ.find(q=>q.k==='thug'&&q.mh!=null&&q.t-G.time<3.6&&q.t-G.time>0&&!q.heard);
    if(q){for(const o of G.spawnQ)if(o.k==='thug'&&o.mh===q.mh&&o.t-q.t<2.5)o.heard=true;const [mx,my]=MANHOLES[q.mh];
      R.state='alert';R.t=3;R.alertAt=[mx,my];R.face=mx>R.x?1:-1;Snd.play('bark');setTimeout(()=>{if(G&&G.red)Snd.play('bark');},380);
      floatText(R.x,R.y-28,'WOOF! WOOF!','#fdba74',13);if(!G.redWarned){G.redWarned=1;toast('Red is barking at a manhole: something is coming up!');}
      else if(!G.redWarnT||G.time-G.redWarnT>20){G.redWarnT=G.time;toast('Red hears something in the sewers!');}
      return;}}
  const was=R.state;_rt(dt);
  // back from a lap: sometimes he has found something
  if(was==='back'&&R.state==='settle'&&redCalm()&&rnd()<.3){const finds=[['a dropped chip pouch',12+((rnd()*14)|0)],['a lucky chip from under a palm tree',5+((rnd()*6)|0)],['a winning scratch card',20]];
    const [what,n]=finds[(rnd()*finds.length)|0];G.me.chips+=n;G.stats.earned+=n;floatText(R.x,R.y-26,`+${n}`,'#fde047',13);for(let i=0;i<10;i++)chipBit(R.x,R.y-10,120);gameLog(`Red came back with ${what}: +${n} chips.`,'good');}};}
// alert pose: standing, facing the manhole, with a line to it
{const _dr=drawRed;drawRed=function(c,R,t){if(R.state!=='alert')return _dr(c,R,t);const s=R.state;R.state='wake';_dr(c,R,t);R.state=s;
  const [mx,my]=R.alertAt||[R.x,R.y];c.save();c.strokeStyle='rgba(253,186,116,.6)';c.lineWidth=1.5;c.setLineDash([3,5]);c.lineDashOffset=-t*30;c.beginPath();c.moveTo(R.x+R.face*14,R.y-6);c.lineTo(mx,my-6);c.stroke();c.setLineDash([]);
  const p=.5+.5*Math.sin(t*14);c.fillStyle=`rgba(251,146,60,${.5+.5*p})`;c.font='12px Bungee,Impact';c.textAlign='center';c.fillText('!',R.x+R.face*6,R.y-26-p*2);c.restore();};}
{const _st=redStatus;redStatus=function(R){return R.state==='alert'?'barking at a manhole':_st(R);};}

/* ---------- the stranger at the Starlite Motel ---------- */
const DEAL_ROUNDS=[13,27];
const dealPay=w=>Math.round((20+2.5*w)*2)+100;
{const _sh=startHand;startHand=function(){_sh.apply(this,arguments);const w=G.wave+1;if(!DEAL_ROUNDS.includes(w)||G.over||(G.deals||{})[w])return;
  (G.deals=G.deals||{})[w]={w,state:'offer'};gameLog('A stranger in the doorway of the Starlite Motel would like a word.','good');Snd.play('windup');dealUI();};}
function dealUI(){let el=$('#deal');const D=G.deals&&Object.values(G.deals).find(d=>d.state==='offer'&&d.w===G.wave+1&&G.phase!=='wave');
  if(!D){if(el)el.classList.remove('show');return;}
  if(!el){el=document.createElement('div');el.id='deal';$('#boardWrap').appendChild(el);}
  el.innerHTML=`<div class="dl"><div class="dlh"><canvas id="dlPor" width="88" height="88"></canvas><div><small>The stranger at the Starlite Motel</small>
    <p>“Fancy making round ${D.w} interesting? <b>Twice the bad luck</b>. Clear it and I'll pay you <b>${dealPay(D.w)} chips</b> on top of the house.”</p></div></div>
    <div class="dlb"><button class="pb main" id="dlYes">Take the deal</button><button class="pb" id="dlNo">Not tonight</button></div><small class="dln">Decide before the round starts.</small></div>`;
  el.classList.add('show');strangerPortrait($('#dlPor'));
  $('#dlYes').onclick=()=>{D.state='taken';Snd.play('coin');gameLog(`You took the stranger's deal: twice the bad luck in round ${D.w}, ${dealPay(D.w)} chips if you clear it.`,'bad');toast('Deal. Round '+D.w+' just got interesting.');dealUI();};
  $('#dlNo').onclick=()=>{D.state='declined';Snd.play('click');gameLog('You turned the stranger down. He shrugs and lights another cigarette.','');dealUI();};}
// a deal not answered by the start of the round is a no
{const _sw=startWave;startWave=function(){const D=G.deals&&G.deals[G.wave+1];if(D&&D.state==='offer')D.state='declined';_sw.apply(this,arguments);
  if(D&&D.state==='taken')setTimeout(()=>{if(G&&G.phase==='wave')banner('Double or nothing',`Twice the bad luck. ${dealPay(D.w)} chips if you clear it`,'boss');},2600);dealUI();};}
{const _app=applySecretBoss;applySecretBoss=function(w,c){c=_app(w,c);const D=G.deals&&G.deals[w];if(!D||D.state!=='taken')return c;
  return {...c,list:seededShuffle(c.list.concat(c.list),w*31+7),spread:(c.spread||Math.min(16,4+c.list.length*.45))*1.5,name:c.name+' × 2'};};}
{const _le=localEndWave;localEndWave=function(w){_le(w);const D=G.deals&&G.deals[w];if(!D||D.state!=='taken'||G.over)return;D.state='paid';const n=dealPay(w);
  G.me.chips+=n;G.stats.earned+=n;banner('The stranger pays up',`+${n} chips`,'great');for(let i=0;i<40;i++)chipBit(BASE.x,BASE.r0*TILE,240);Snd.play('jackpot');gameLog(`The stranger kept his word: +${n} chips.`,'good');
  if(typeof Meta!=='undefined'&&w===27)Meta.ach('stranger');};}
{const _st2=syncTop;syncTop=function(){_st2.apply(this,arguments);if(!G)return;const sig=G.wave+'|'+G.phase+'|'+JSON.stringify(G.deals||{});if(sig!==dealUI.sig){dealUI.sig=sig;dealUI();}};}
// he waits in the motel doorway while the offer stands
function drawStranger(c,x,y,t,s){c.save();c.translate(x,y);c.scale(s,s);
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,15,9,3,0,0,TAU);c.fill();
  c.fillStyle='#1f1a17';c.fillRect(-3.5,4,2.6,11);c.fillRect(1,4,2.6,11);
  c.fillStyle='#57503f';c.beginPath();c.moveTo(-7,9);c.lineTo(-6,-6);c.quadraticCurveTo(0,-9,6,-6);c.lineTo(7,9);c.closePath();c.fill();
  c.strokeStyle='#3b352a';c.lineWidth=1;c.beginPath();c.moveTo(0,-7);c.lineTo(0,9);c.stroke();c.fillStyle='#3b352a';c.fillRect(-6.4,1,12.8,1.6);
  c.fillStyle='#d9b99b';c.beginPath();c.arc(0,-11,3.6,0,TAU);c.fill();
  c.fillStyle='#1f1a17';c.beginPath();c.ellipse(0,-13.4,7,1.8,0,0,TAU);c.fill();c.fillRect(-3.8,-18,7.6,4.6);c.fillStyle='#7f1d1d';c.fillRect(-3.8,-14.6,7.6,1);
  c.fillStyle='#0b0612';c.fillRect(-2.2,-11.6,1.4,.9);c.fillRect(.8,-11.6,1.4,.9);
  const p=.6+.4*Math.sin(t*3);c.strokeStyle='#e5e7eb';c.lineWidth=.9;c.beginPath();c.moveTo(2,-9);c.lineTo(5.5,-9.5);c.stroke();c.fillStyle=`rgba(249,115,22,${p})`;c.beginPath();c.arc(5.8,-9.6,.9,0,TAU);c.fill();
  for(let k=0;k<3;k++){const ph=(t*.4+k/3)%1;c.fillStyle=`rgba(200,200,210,${.35*(1-ph)})`;c.beginPath();c.arc(6+ph*4,-11-ph*10,1+ph*2.5,0,TAU);c.fill();}
  c.restore();}
function strangerPortrait(cv){if(!cv)return;const c=cv.getContext('2d');c.clearRect(0,0,88,88);const g=c.createRadialGradient(44,40,4,44,44,60);g.addColorStop(0,'#3a2e22');g.addColorStop(1,'#120c19');c.fillStyle=g;c.fillRect(0,0,88,88);drawStranger(c,44,52,performance.now()/1000,3);}
{const _g=drawGroundWarn;drawGroundWarn=function(c,t){_g(c,t);if(!G||!G.deals)return;const D=Object.values(G.deals).find(d=>d.state==='offer');if(!D)return;
  const o=OBST.find(o=>o.k==='motel'),x=(o.c+o.w/2)*TILE+18,y=(o.r+o.h)*TILE+10;drawStranger(c,x,y,t,1.25);
  const p=.5+.5*Math.sin(t*4);c.save();c.fillStyle=`rgba(253,224,71,${.12+.1*p})`;c.beginPath();c.ellipse(x,y+16,14,5,0,0,TAU);c.fill();c.restore();};}
{const A=['Double or Nothing','Take the stranger\'s deal on round 27, and clear it.','casino','A stranger at the motel deals twice a run.'];if(typeof HIDDEN_ACH!=='undefined')HIDDEN_ACH.stranger=A;if(typeof ACH!=='undefined')ACH.stranger=A.slice(0,3);}

/* ---------- styles ---------- */
(function(){const css=`
#deal{position:absolute;left:50%;bottom:14px;z-index:8;width:400px;margin-left:-200px;opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s;pointer-events:none}
#deal.show{opacity:1;transform:none;pointer-events:auto}
#deal .dl{padding:11px 13px;border-radius:12px;background:rgba(20,13,10,.95);box-shadow:0 0 0 1.5px #a16207,0 0 22px rgba(161,98,7,.35),0 10px 30px rgba(0,0,0,.6);color:#f5ede0;font:400 12.5px/1.4 var(--body,Barlow),sans-serif}
#deal .dlh{display:flex;gap:10px;align-items:center}#deal canvas{width:52px;height:52px;border-radius:9px;flex:none}#deal small{font:400 10px var(--head);color:#fbbf24;letter-spacing:.05em;text-transform:uppercase}
#deal p{margin:3px 0 0}#deal p b{color:#fde68a}#deal .dlb{display:flex;gap:6px;margin-top:9px}#deal .pb{height:28px;margin:0;flex:1}#deal .dln{display:block;margin-top:5px;text-align:center;color:#a8a29e;text-transform:none;letter-spacing:0}`;
const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);})();
