'use strict';
/* ============ ALL IN — the last days of the dog track, and Red ============
   Race 2: a few protesters by the rail. Race 3: more. Race 4: a chanting crowd.
   Race 5: an MP walks onto the track, stops the race and bans greyhound racing on the Strip,
   then asks you to give Red, a retired red-fawn greyhound, a home. If you do, he moves onto your
   Strip. He isn't yours to command: he sleeps on his bed, and every so often he does zoomies. */

const RED_COAT='#b4532a';
const DOG_CROWD=[0,0,4,9,16,26]; // protesters on the stands, by race number
const DOG_SIGNS=['LET THEM RETIRE','DOGS NOT BETS','BAN THE TRACK','♥ GREYS','NO MORE RACES','SOFAS NOT TRAPS','RUN FREE','SHAME!'];
const DOG_RACE_LINES=['',"And they're off!",'A few protesters have turned up by the rail. And they\'re off!',
  'More protesters tonight, and the placards are getting bigger. And they\'re off!','It\'s a proper crowd now, and they\'re chanting. And they\'re off!',
  'The protest has taken over the stands. And they\'re off…'];
function dogStory(){if(!G)return {races:0,banned:false,red:null};return G.dogStory||(G.dogStory={races:0,banned:false,red:null});}

/* ---------- sounds ---------- */
if(typeof FOLEY!=='undefined')Object.assign(FOLEY,{
  bark(t){for(const d of [0,.17]){FX.sweep(t+d,900,380,'bandpass',.22,.1,3);Snd.tone(330,.08,'sawtooth',.06,.6,d);FX.thump(t+d,220,110,.12,.07);}},
  crowd(t){for(let i=0;i<5;i++)FX.sweep(t+i*.18,500+Math.random()*300,900+Math.random()*400,'bandpass',.07,.9,1.5);},
  chant(t){for(let k=0;k<2;k++)for(const d of [0,.32]){FX.sweep(t+k*.85+d,700,420,'bandpass',.16,.24,2.2);FX.sweep(t+k*.85+d,1400,700,'bandpass',.06,.2,3);}},
  whistle(t){for(let i=0;i<2;i++)Snd.tone(2900,.28,'sine',.07,1.04,i*.34);Snd.tone(2600,.6,'sine',.05,1.02,.7);},
  megaphone(t){for(let i=0;i<4;i++){Snd.tone(220+i*20,.09,'sawtooth',.035,1.1,i*.11);FX.sweep(t+i*.11,1800,900,'bandpass',.05,.09,4);}}});

/* ---------- the stands ---------- */
const DOG_SKIN=['#f1c9a5','#e0ac69','#c68642','#8d5524','#ffdbac','#a16e4b'],DOG_HAIR=['#2b1b12','#5a3825','#d9b26a','#9ca3af','#111','#7c2d12','#e5e7eb'];
const DOG_COATS=['#2563eb','#16a34a','#dc2626','#7c3aed','#f59e0b','#0891b2','#be185d','#4b5563','#65a30d'];
function dogCrowdFor(D,n){const want=DOG_CROWD[Math.min(5,n)]||0;D.crowd=D.crowd||[];
  while(D.crowd.length<want){const k=D.crowd.length;D.crowd.push({x:.04+((k*.383+Math.random()*.12)%1)*.92,row:k%3===2?1:0,skin:DOG_SKIN[(Math.random()*6)|0],hair:DOG_HAIR[(Math.random()*7)|0],
    coat:DOG_COATS[(Math.random()*9)|0],sign:Math.random()<.7?DOG_SIGNS[(Math.random()*DOG_SIGNS.length)|0]:null,sc:DOG_COATS[(Math.random()*9)|0],ph:Math.random()*TAU,hat:Math.random()<.25});}}
function dogPerson(c,p,x,base,s,now,heat){const bob=Math.sin(now*(2.4+heat*2)+p.ph)*(1+heat*1.5)*s;
  c.save();c.translate(x,base);
  if(p.sign){const sy=-44*s+bob,w=Math.max(30,p.sign.length*4.6)*s;c.strokeStyle='#6b4423';c.lineWidth=2*s;c.beginPath();c.moveTo(0,-14*s);c.lineTo(0,sy+6*s);c.stroke();
    c.fillStyle='#fffdf5';c.strokeStyle=p.sc;c.lineWidth=1.6*s;c.beginPath();c.rect(-w/2,sy-7*s,w,13*s);c.fill();c.stroke();
    c.fillStyle=p.sc==='#f59e0b'?'#9a3412':p.sc;c.font=`900 ${6.2*s}px Barlow,Arial,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(p.sign,0,sy-.5*s);}
  c.fillStyle=p.coat;c.beginPath();c.moveTo(-7*s,0);c.lineTo(-6*s,-13*s);c.quadraticCurveTo(0,-17*s,6*s,-13*s);c.lineTo(7*s,0);c.closePath();c.fill();
  c.strokeStyle=p.coat;c.lineWidth=2.6*s;c.lineCap='round';c.beginPath();c.moveTo(-5*s,-12*s);c.lineTo(p.sign?-1.5*s:-8*s,p.sign?-16*s+bob*.6:-5*s);c.moveTo(5*s,-12*s);c.lineTo(p.sign?1.5*s:9*s,p.sign?-16*s+bob*.6:(heat>0?-22*s+bob*2:-5*s));c.stroke();
  c.fillStyle=p.skin;c.beginPath();c.arc(0,-19*s+bob*.3,5*s,0,TAU);c.fill();
  c.fillStyle=p.hair;c.beginPath();if(p.hat){c.fillStyle='#e11d48';c.arc(0,-21*s+bob*.3,5.3*s,Math.PI,0);c.fill();c.fillRect(-6.5*s,-21.4*s+bob*.3,13*s,1.6*s);}else{c.arc(0,-20*s+bob*.3,5.2*s,Math.PI*1.05,-.05);c.fill();}
  c.restore();}
// the MP: navy suit, green rosette, blonde hair, a red megaphone
function dogDrawMP(c,x,y,s,now,talking){c.save();c.translate(x,y);
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,0,10*s,3*s,0,0,TAU);c.fill();
  const step=talking?0:Math.sin(now*9)*3*s;
  c.strokeStyle='#1e1b4b';c.lineWidth=3*s;c.lineCap='round';c.beginPath();c.moveTo(-3*s,-12*s);c.lineTo(-3*s+step,0);c.moveTo(3*s,-12*s);c.lineTo(3*s-step,0);c.stroke();
  c.fillStyle='#1e2a5a';c.beginPath();c.moveTo(-8*s,-11*s);c.lineTo(-7*s,-30*s);c.quadraticCurveTo(0,-34*s,7*s,-30*s);c.lineTo(8*s,-11*s);c.closePath();c.fill();
  c.fillStyle='#fff';c.beginPath();c.moveTo(-2.5*s,-31*s);c.lineTo(0,-22*s);c.lineTo(2.5*s,-31*s);c.fill();
  c.fillStyle='#16a34a';c.beginPath();c.arc(-4.5*s,-26*s,3*s,0,TAU);c.fill();c.fillStyle='#bbf7d0';c.beginPath();c.arc(-4.5*s,-26*s,1.3*s,0,TAU);c.fill();c.fillStyle='#16a34a';c.fillRect(-5.5*s,-23.5*s,2*s,4*s);
  c.strokeStyle='#e5e7eb';c.lineWidth=.8*s;c.beginPath();c.moveTo(-2*s,-31*s);c.lineTo(1*s,-19*s);c.stroke();c.fillStyle='#e5e7eb';c.fillRect(-.5*s,-19.5*s,3.5*s,2.5*s);
  // megaphone arm, raised when talking
  const ang=talking?-.5+Math.sin(now*5)*.05:.9;c.save();c.translate(6*s,-28*s);c.rotate(ang);c.strokeStyle='#1e2a5a';c.lineWidth=3*s;c.beginPath();c.moveTo(0,0);c.lineTo(7*s,0);c.stroke();
    c.fillStyle='#dc2626';c.beginPath();c.moveTo(6*s,-2*s);c.lineTo(15*s,-5.5*s);c.lineTo(15*s,5.5*s);c.lineTo(6*s,2*s);c.closePath();c.fill();c.fillStyle='#fca5a5';c.fillRect(14*s,-5.5*s,1.5*s,11*s);c.restore();
  c.strokeStyle='#1e2a5a';c.lineWidth=3*s;c.beginPath();c.moveTo(-6*s,-28*s);c.lineTo(-9*s,-18*s);c.stroke();
  c.fillStyle='#e8c46a';c.beginPath();c.moveTo(-6.6*s,-38*s);c.quadraticCurveTo(-8*s,-30*s,-6.8*s,-29.5*s);c.lineTo(6.8*s,-29.5*s);c.quadraticCurveTo(8*s,-30*s,6.6*s,-38*s);c.closePath();c.fill();
  c.fillStyle='#f1c9a5';c.beginPath();c.arc(0,-37*s,5.5*s,0,TAU);c.fill();
  c.fillStyle='#f2d27e';c.beginPath();c.moveTo(-6.6*s,-36*s);c.quadraticCurveTo(-7.4*s,-44.5*s,0,-44*s);c.quadraticCurveTo(7.4*s,-44.5*s,6.6*s,-36*s);c.quadraticCurveTo(4*s,-41.5*s,-1*s,-40.5*s);c.quadraticCurveTo(-4.5*s,-40*s,-6.6*s,-36*s);c.fill();
  c.fillStyle='#c9a043';c.fillRect(-.4*s,-43.6*s,.8*s,3*s);
  c.fillStyle='#1b1b22';c.beginPath();c.arc(-2*s,-37*s,.8*s,0,TAU);c.arc(2*s,-37*s,.8*s,0,TAU);c.fill();
  c.restore();}
function dogBubble(c,x,y,txt,s){c.font=`900 ${8*s}px Barlow,Arial,sans-serif`;const w=c.measureText(txt).width+10*s,h=14*s;c.fillStyle='#fffdf5';c.strokeStyle='#1b1b22';c.lineWidth=1.4*s;
  c.beginPath();c.roundRect?c.roundRect(x-w/2,y-h,w,h,5*s):c.rect(x-w/2,y-h,w,h);c.fill();c.stroke();c.beginPath();c.moveTo(x-3*s,y);c.lineTo(x,y+5*s);c.lineTo(x+3*s,y);c.fill();
  c.fillStyle='#b91c1c';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,x,y-h/2);}
let DOG_RAF=0;
function dogOverlay(){const D=ARC.dog,cv=$('#dogCrowd'),tr=$('#dogCv');if(!D||!cv||!tr){DOG_RAF=0;return;}
  const wrap=cv.parentElement,W2=wrap.clientWidth,H2=wrap.clientHeight,th=tr.clientHeight,sh=H2-th;if(!W2||!H2){DOG_RAF=requestAnimationFrame(dogOverlay);return;}
  if(cv.width!==W2*2||cv.height!==H2*2){cv.width=W2*2;cv.height=H2*2;}
  const c=cv.getContext('2d');c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,W2,H2);const now=performance.now()/1000,S=dogStory(),heat=S.races>=4?1:0;
  if(sh>4){const g=c.createLinearGradient(0,th,0,H2);g.addColorStop(0,'#2a2236');g.addColorStop(1,'#120c19');c.fillStyle=g;c.fillRect(0,th,W2,sh);
    c.fillStyle='#e5e7eb';c.fillRect(0,th+2,W2,2);for(let x=6;x<W2;x+=18)c.fillRect(x,th+2,2,9);}
  const crowd=(D.crowd||[]).slice().sort((a,b)=>a.row-b.row);
  for(const p of crowd){const back=p.row===1;dogPerson(c,p,p.x*W2,th+(back?sh*.55:sh+4),back?.78:.95,now,heat);}
  if(heat&&crowd.length&&!D.mp){const k=Math.floor(now/1.4)%crowd.length,p=crowd[k],ph=(now/1.4)%1;if(ph<.7)dogBubble(c,p.x*W2,th+sh*.2-ph*6,S.banned?((Math.floor(now/1.4)%2)?'HOORAY!':'WELL DONE!'):(Math.floor(now/1.4)%2)?'BAN IT!':'LET THEM RETIRE!',.9);}
  if(D.mp){const M=D.mp,u=Math.min(1,(now-M.t0)/1.9),x=W2*(.86-.36*u),y=th+sh*.7-(th*.48+sh*.7)*Math.min(1,u*1.1);
    dogDrawMP(c,x,y,1.05,now,u>=1);if(u>=1&&M.say)dogBubble(c,x,y-52,M.say,1);}
  if(S.banned&&!D.mp){c.save();c.translate(W2/2,th/2);c.rotate(-.12);for(const [dy,txt] of [[-14,'CLOSED · BANNED · CLOSED · BANNED · CLOSED'],[16,'BANNED · CLOSED · BANNED · CLOSED · BANNED']]){
      c.fillStyle='#facc15';c.fillRect(-W2*.7,dy-9,W2*1.4,18);c.fillStyle='#111';c.font='900 11px Barlow,Arial,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,0,dy+.5);}c.restore();}
  DOG_RAF=requestAnimationFrame(dogOverlay);}

/* ---------- the dog track panel, with the story ---------- */
function dogEnsureRed(D){if(D.field.some(f=>f.red))return;const i=(Math.random()*6)|0;Object.assign(D.field[i],{name:'Red',coat:RED_COAT,red:true});}
function dogResetIfNewGame(){if(ARC.dog&&ARC.dog.g!==G)ARC.dog=null;}
const _renderDog=renderDog;
renderDog=function(){dogResetIfNewGame();const B=$('#arcBody');if(!B)return;const S=dogStory();
  if(!ARC.dog){_renderDog();ARC.dog.g=G;}
  const D=ARC.dog;if(S.races>=4&&!S.banned&&!D.running)dogEnsureRed(D);
  if(D.mp)return dogMPView(B,D);
  if(S.banned)return dogClosed(B,D,S);
  _renderDog();
  dogFrame(B,D,S);};
function dogFrame(B,D,S){const cv=$('#dogCv');if(!cv||cv.parentElement.classList.contains('dogwrap'))return;
  const w=document.createElement('div');w.className='dogwrap'+((D.crowd&&D.crowd.length)||D.mp||S.banned?' stands':'');cv.parentElement.insertBefore(w,cv);w.appendChild(cv);
  const o=document.createElement('canvas');o.id='dogCrowd';w.appendChild(o);if(!DOG_RAF)DOG_RAF=requestAnimationFrame(dogOverlay);
  if(S.races>=4&&!S.banned&&!D.running&&!D.mp){const r=B.querySelector('.runner i');const red=D.field.findIndex(f=>f.red);const b=B.querySelector(`[data-dog="${red}"]`);if(b)b.classList.add('redrun');}}
function dogClosed(B,D,S){
  B.innerHTML=`<div class="dogwrap stands"><canvas id="dogCv" width="360" height="190"></canvas><canvas id="dogCrowd"></canvas></div>
    ${S.red==null?`<div class="redoffer"><canvas id="redPic" width="240" height="150"></canvas><div><b>Red</b><small>Retired greyhound · four years old · red fawn</small>
      <p>He won't fight for you and he won't take orders. He'll mostly sleep, and every so often he'll do a lap of the Strip at full speed.</p>
      <div class="mgrow"><button class="pb main" id="redYes">Give Red a home</button><button class="pb" id="redNo">Not for me</button></div></div></div>`
    :`<div class="slres">${S.red?'Red lives on your Strip now. '+(G.red&&G.red.state==='sleep'?'He\'s asleep on his bed.':'He\'s doing zoomies.'):'Red went to a rescue centre. Someone will find him a sofa.'}</div>
      <p class="dogban">Greyhound racing is banned on the Strip, by order of Parliament.</p>`}`;
  dogDrawClosed($('#dogCv'));if(!DOG_RAF)DOG_RAF=requestAnimationFrame(dogOverlay);
  const pic=$('#redPic');if(pic){const c=pic.getContext('2d');const g=c.createRadialGradient(120,80,10,120,80,130);g.addColorStop(0,'#4a2a5e');g.addColorStop(1,'#1a0f24');c.fillStyle=g;c.fillRect(0,0,240,150);c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(120,128,80,10,0,0,TAU);c.fill();c.translate(118,90);drawGreyhound(c,'stand',0,3.6);}
  const y=$('#redYes'),n=$('#redNo');
  if(y)y.onclick=()=>{dogAdopt();renderDog();};
  if(n)n.onclick=()=>{S.red=false;Snd.play('click');gameLog('Red went to a rescue centre.','');renderDog();};}
function dogDrawClosed(cv){if(!cv)return;const c=cv.getContext('2d'),W2=cv.width,H2=cv.height,lanes=6,lh=(H2-24)/lanes;
  c.fillStyle='#7c5310';c.fillRect(0,0,W2,H2);c.fillStyle='#8a5d14';for(let i=0;i<lanes;i++)if(i%2)c.fillRect(0,12+i*lh,W2,lh);
  c.fillStyle='rgba(248,250,252,.6)';c.fillRect(0,10,W2,2);c.fillRect(0,H2-12,W2,2);const fl=W2-30;for(let k=0;k<lanes*2;k++){c.fillStyle=k%2?'#111':'#ddd';c.fillRect(fl,12+k*lh/2,6,lh/2);}
  c.fillStyle='rgba(10,6,16,.35)';c.fillRect(0,0,W2,H2);}

dogGo=function(){const D=ARC.dog,S=dogStory();if(!D||D.running||S.banned||G.me.chips<D.bet)return;
  S.races++;const n=S.races;if(n>=5)dogEnsureRed(D);dogCrowdFor(D,n);
  G.me.chips-=D.bet;gambleTally(-D.bet);D.paid=D.bet;D.running=true;D.R=raceFinish(6,D.field.map(f=>f.p),Math.random);D.u=0;D.last=DOG_RACE_LINES[Math.min(5,n)]||"And they're off!";
  Snd.play('wave');if(n>=2)Snd.play('crowd');if(n>=4)setTimeout(()=>Snd.play('chant'),400);renderDog();
  const t0=performance.now(),dur=6000;let halt=null;
  const step=()=>{if(ARC.dog!==D)return;const now=performance.now();
    if(n>=5&&!halt&&D.u>=.5){halt={t:now,u:D.u};Snd.play('whistle');D.last='<b>A whistle!</b> Someone is walking out onto the track…';const r=$('#arcBody .slres');if(r)r.innerHTML=D.last;}
    if(halt){const k=Math.min(1,(now-halt.t)/650);D.u=halt.u+.05*(1-(1-k)*(1-k));if(k>=1){D.R.stop=true;const cv=$('#dogCv');if(cv)drawTrack(cv,'dog',D.field,D.R,D.u);dogMP(D);return;}}
    else D.u=Math.min(1.12,(now-t0)/dur*1.12);
    const cv=$('#dogCv');if(cv)drawTrack(cv,'dog',D.field,D.R,D.u);
    if(halt||D.u<1.12)requestAnimationFrame(step);else{D.running=false;const w=D.R.win,f=D.field[w];
      if(w===D.pick){const amt=Math.round(D.paid*f.odds);G.me.chips+=amt;gambleTally(amt);G.stats.earned+=amt-D.paid;D.last=`${esc(f.name)} wins! You collect ${fmt(amt)} chips.`;Snd.play('win');
        if(f.odds>=6){for(let i=0;i<40;i++)confetti();gameLog(`Dog track: ${f.name} came in at ${f.odds.toFixed(1)}. +${fmt(amt)} chips.`,'good');}}
      else{D.last=`${esc(f.name)} wins. Your dog finished down the field.`;Snd.play('fold');}
      if(n===4)D.last+=' <b>The crowd won\'t be ignored much longer.</b>';
      setTimeout(()=>{if(ARC.dog===D&&!D.running){D.field=newField('dog');D.R=null;D.u=0;if(ARC.tab==='dog'&&$('#slotPanel'))renderDog();}},2600);renderDog();}};
  requestAnimationFrame(step);};

const DOG_MP_LINES=[
  {say:'STOP THE RACE!',text:'<b>“Stop the race!”</b> An MP has marched straight onto the track.'},
  {say:"IT'S BANNED!",text:'<b>“As of tonight, greyhound racing on the Strip is banned.</b> Every dog on this track is retiring, and all bets are refunded.”',ban:true},
  {say:'MEET RED',text:'<b>“This lad\'s called Red.</b> He\'s run his last race, and what he needs now is a sofa. Will you give him a home?”'}];
// the MP walks on, then each line waits for you to click on
function dogMP(D){D.mp={t0:performance.now()/1000,step:-1,say:''};D.last='<b>A whistle!</b> Someone is walking out onto the track…';
  setTimeout(()=>{if(ARC.dog===D&&D.mp&&D.mp.step<0)dogMPNext(D);},1900);if(ARC.tab==='dog'&&$('#slotPanel'))renderDog();}
function dogMPNext(D){const M=D.mp;if(!M)return;M.step++;
  if(M.step>=DOG_MP_LINES.length){D.mp=null;D.running=false;if(ARC.tab==='dog'&&$('#slotPanel'))renderDog();return;}
  const L=DOG_MP_LINES[M.step];M.say=L.say;D.last=L.text;Snd.play('megaphone');if(L.ban)dogSettleBan(D);if(ARC.tab==='dog'&&$('#slotPanel'))renderDog();}
function dogMPView(B,D){const M=D.mp,L=M.step>=0?DOG_MP_LINES[M.step]:null;
  B.innerHTML=`<div class="dogwrap stands"><canvas id="dogCv" width="360" height="190"></canvas><canvas id="dogCrowd"></canvas></div>
    <div class="dogtalk">${L?`<small>The MP · ${M.step+1} of ${DOG_MP_LINES.length}</small><p>${L.text}</p><div class="mgrow"><button class="pb main" id="dogNext">${M.step===DOG_MP_LINES.length-1?'Meet Red':'Continue'}</button></div>`
      :`<p>${D.last}</p>`}</div>`;
  drawTrack($('#dogCv'),'dog',D.field,D.R,D.u);if(!DOG_RAF)DOG_RAF=requestAnimationFrame(dogOverlay);
  const b=$('#dogNext');if(b)b.onclick=()=>{Snd.play('click');dogMPNext(D);};}
// the ban holds even if the panel is closed mid-speech
function dogSettleBan(D){const S=dogStory();if(S.banned)return;S.banned=true;if(D.paid){G.me.chips+=D.paid;gambleTally(D.paid);D.paid=0;}
  gameLog(`An MP has shut down the dog track. Greyhound racing is banned on the Strip.`,'');for(const p of D.crowd||[])p.sign=p.sign||DOG_SIGNS[0];}
// closing the arcade mid-scene just pauses it: the MP is still there when you come back
{const _tog=toggleArcade;toggleArcade=function(force,tab){const D=ARC.dog;if(D&&D.mp&&(force==null||force)&&!$('#slotPanel'))tab='dog';return _tog(force,tab);};}

/* ---------- Red on your Strip ---------- */
const RED_HOME={x:15*TILE,y:2.75*TILE},RED_LOOP={x:19.5*TILE,y:10*TILE,rx:255,ry:168};
function dogAdopt(){const S=dogStory();if(S.red)return;S.red=true;
  G.red={isRed:true,x:RED_HOME.x,y:RED_HOME.y,hx:RED_HOME.x,hy:RED_HOME.y,state:'sleep',t:7+Math.random()*4,face:1,run:0};
  Snd.play('bark');for(let i=0;i<40;i++)confetti();toast('Red has moved onto your Strip. He mostly sleeps.');gameLog('You gave Red a home. He\'s asleep on the pavement outside the chapel.','good');
  if(typeof Meta!=='undefined')Meta.ach('forever');}
/* ---------- Red, drawn as a proper greyhound ----------
   Side view, facing right, at one scale for every pose. ph is the gallop phase (0..1): a double-suspension
   gallop that stretches out fully in flight, then gathers all four legs under a flexed spine. */
const RED_DK=shade(RED_COAT,-.3),RED_LT=shade(RED_COAT,.38),RED_BELLY='#f2dcc8';
function greyLeg(c,x,y,a1,a2,L1,L2,w,col,paw){c.save();c.translate(x,y);c.rotate(a1);c.strokeStyle=col;c.lineCap='round';c.lineJoin='round';c.lineWidth=w;
  c.beginPath();c.moveTo(0,0);c.lineTo(0,L1);c.translate(0,L1);c.rotate(a2);c.lineTo(0,L2);c.stroke();c.fillStyle=col;c.beginPath();c.ellipse(paw*1.2,L2,w*.85,w*.55,0,0,TAU);c.fill();c.restore();}
function drawGreyhound(c,pose,ph,s){s=s||1;c.save();c.scale(s,s);
  const run=pose==='run',S=run?Math.sin(ph*TAU):0,C=run?Math.cos(ph*TAU):0;
  // flight is highest when fully stretched or fully gathered; the body stretches and flexes through the stride
  const lift=run?-2.2*Math.abs(S)-.6:0,stretch=run?1+.07*S:1,arch=run?-1.8*S:0;c.translate(0,lift);
  const chestX=9*stretch,hipX=-12*stretch,backY=-9+arch*.4;
  // far legs first (darker), then the body, then the near legs
  const legs=(far)=>{const col=far?RED_DK:RED_COAT,off=far?.08:0,p2=ph+off,s2=run?Math.sin(p2*TAU):0,c2=run?Math.cos(p2*TAU):0;
    if(run){// front: reach forward in flight, fold back under when gathered
      greyLeg(c,chestX-1,-2,-1.05*s2-.1,s2>0?-.1*s2:1.15*(-s2)+.15,8.2,8.4,far?1.8:2.1,col,1);
      // hind: drive back in flight, swing forward under the belly when gathered
      greyLeg(c,hipX+1,-4,1.0*s2+.05,s2>0?.55*s2:-.6*(-s2)-.1,8.6,9.2,far?2:2.4,col,1);}
    else if(pose==='stand'){greyLeg(c,chestX-1+(far?1.5:0),-2,-.04,.05,8.2,8.3,far?1.8:2.1,col,1);greyLeg(c,hipX+1+(far?1.5:0),-4,.32,-.5,8.6,9.4,far?2:2.4,col,1);}};
  legs(true);
  // tail: long, thin, a low sweep with a hook at the end
  c.strokeStyle=RED_COAT;c.lineWidth=1.5;c.lineCap='round';c.beginPath();const tw=run?3*C:0;c.moveTo(hipX-3,-5);c.quadraticCurveTo(hipX-10,2+tw,hipX-16,0+tw*.7);c.quadraticCurveTo(hipX-19,-1+tw*.5,hipX-19.5,-3.5+tw*.4);c.stroke();
  // body: deep chest, tucked waist, arched loin, rounded rump
  c.fillStyle=RED_COAT;c.beginPath();c.moveTo(chestX+3,-6);c.quadraticCurveTo(chestX+5.5,-1,chestX+2,3.2);c.quadraticCurveTo(chestX-4,5,chestX-8,1.6);
  c.quadraticCurveTo(-2,-2.6+arch*.3,hipX+3,-1.5);c.quadraticCurveTo(hipX-1,1.2,hipX-4,-2.5);c.quadraticCurveTo(hipX-5,-7,hipX+1,backY+1.5);c.quadraticCurveTo((hipX+chestX)/2,backY-2.2+arch,chestX-1,backY+.6);c.quadraticCurveTo(chestX+2.5,-9,chestX+3,-6);c.fill();
  c.fillStyle=RED_BELLY;c.beginPath();c.moveTo(chestX+3.6,-3);c.quadraticCurveTo(chestX+3,2.4,chestX-1,3);c.quadraticCurveTo(chestX+1.2,0,chestX+3.6,-3);c.fill();
  c.fillStyle=RED_DK;c.globalAlpha=.35;c.beginPath();c.ellipse((hipX+chestX)/2,backY+1.4,9*stretch,1.3,0,0,TAU);c.fill();c.globalAlpha=1;
  // neck and head: long neck, wedge head, long snout, folded rose ear
  const hb=run?.9*S:0,hx=chestX+(run?11+1.5*S:7.5),hy=(run?-12.5:-16.5)+hb;
  c.fillStyle=RED_COAT;c.beginPath();c.moveTo(chestX-2.5,-7.8);c.quadraticCurveTo(chestX+(run?4:2.5),hy-(run?1.5:2.5),hx-2.5,hy-1.6);c.lineTo(hx+.5,hy+2.4);c.quadraticCurveTo(chestX+(run?5.5:4.5),hy+4,chestX+3.6,-4.5);c.closePath();c.fill();
  c.beginPath();c.moveTo(hx-3.5,hy-1);c.quadraticCurveTo(hx-1,hy-4.2,hx+2.6,hy-2.6);c.lineTo(hx+9.5,hy+.6);c.quadraticCurveTo(hx+10.2,hy+1.8,hx+9,hy+2.3);c.lineTo(hx+1,hy+3.3);c.quadraticCurveTo(hx-3,hy+3,hx-3.5,hy-1);c.fill();
  c.fillStyle=RED_BELLY;c.beginPath();c.moveTo(hx+3,hy+2.6);c.lineTo(hx+9,hy+2.2);c.lineTo(hx+4,hy+3.3);c.closePath();c.fill();
  c.fillStyle='#1b1b22';c.beginPath();c.arc(hx+9.6,hy+1,1,0,TAU);c.fill();c.beginPath();c.arc(hx+2.2,hy-.8,.9,0,TAU);c.fill();
  c.fillStyle=RED_DK;c.beginPath();c.moveTo(hx-1.2,hy-2.4);c.quadraticCurveTo(hx-4.5,hy-4.6,hx-6,hy-2.2);c.quadraticCurveTo(hx-3.5,hy-1.6,hx-1,hy-1);c.closePath();c.fill();
  legs(false);
  c.restore();}
// curled up asleep: legs tucked, head on the paws, tail wrapped round, at the same scale as the running dog
function drawGreySleep(c,t,s){s=s||1;c.save();c.scale(s,s);const br=Math.sin(t*1.6)*.03;
  c.strokeStyle=RED_COAT;c.lineWidth=1.5;c.lineCap='round';c.beginPath();c.moveTo(-10,1);c.quadraticCurveTo(-13,6,-4,6.4);c.quadraticCurveTo(4,6.8,8,5);c.stroke();
  c.save();c.scale(1+br,1+br*1.5);c.fillStyle=RED_COAT;c.beginPath();c.ellipse(0,-1,11,5,0,0,TAU);c.fill();
    c.fillStyle=shade(RED_COAT,-.12);c.beginPath();c.ellipse(-6.5,-.5,5.4,4.6,0,0,TAU);c.fill();c.strokeStyle=RED_DK;c.lineWidth=.7;c.beginPath();c.arc(-6.5,0,3.4,-2.2,.7);c.stroke();
    c.fillStyle=RED_DK;c.globalAlpha=.4;c.beginPath();c.ellipse(-.5,-4.2,8,1.6,0,Math.PI,0);c.fill();c.globalAlpha=1;c.restore();
  c.fillStyle=RED_LT;c.beginPath();c.ellipse(9,4.2,4.4,1.4,0,0,TAU);c.fill();c.beginPath();c.ellipse(6,4.8,3.6,1.2,0,0,TAU);c.fill();
  c.save();c.translate(9,.5);c.rotate(.12);c.fillStyle=RED_COAT;c.beginPath();c.moveTo(-4,-1);c.quadraticCurveTo(-1.5,-4,2,-3);c.lineTo(9,0);c.quadraticCurveTo(9.6,1.2,8.6,1.7);c.lineTo(1,2.6);c.quadraticCurveTo(-3.5,2.4,-4,-1);c.fill();
    c.fillStyle=RED_BELLY;c.beginPath();c.moveTo(2.5,2.1);c.lineTo(8.4,1.6);c.lineTo(3.5,2.7);c.closePath();c.fill();c.fillStyle='#1b1b22';c.beginPath();c.arc(9.1,.5,.9,0,TAU);c.fill();
    c.strokeStyle='#1b1b22';c.lineWidth=.8;c.beginPath();c.arc(1.4,-.9,1.1,.2,Math.PI-.2);c.stroke();
    c.fillStyle=RED_DK;c.beginPath();c.moveTo(-1.6,-2.2);c.quadraticCurveTo(-4.6,-4.4,-6,-2);c.quadraticCurveTo(-3.6,-1.4,-1.4,-1);c.closePath();c.fill();c.restore();
  c.restore();}

const redCalm=()=>G.phase!=='wave'&&!G.enemies.some(e=>!e.dead);
function redTick(dt){const R=G&&G.red;if(!R)return;R.t-=dt;R.id='red';
  const toward=(tx,ty,spd)=>{const dx=tx-R.x,dy=ty-R.y,d=Math.hypot(dx,dy),st=spd*dt;if(Math.abs(dx)>.5)R.face=dx>0?1:-1;R.ph=((R.ph||0)+Math.min(d,st)/46)%1;if(d<=st){R.x=tx;R.y=ty;return true;}R.x+=dx/d*st;R.y+=dy/d*st;return false;};
  const fight=!redCalm();
  if(R.state==='sleep'){if(R.t<=0){if(fight){R.t=2;return;}R.state='wake';R.t=1.1;Snd.play('bark');floatText(R.x,R.y-26,'woof!','#fdba74',11);}}
  else if(R.state==='wake'){if(fight){R.state='settle';R.t=.6;return;}if(R.t<=0){R.state='out';R.dir=Math.random()<.5?1:-1;R.a0=Math.atan2((R.hy-RED_LOOP.y)/RED_LOOP.ry,(R.hx-RED_LOOP.x)/RED_LOOP.rx);R.lap=0;R.laps=(R.laps||0)+1;}}
  else if(R.state==='out'){if(fight){R.state='back';return;}if(toward(RED_LOOP.x+Math.cos(R.a0)*RED_LOOP.rx,RED_LOOP.y+Math.sin(R.a0)*RED_LOOP.ry,240))R.state='lap';}
  else if(R.state==='lap'){if(fight){R.state='back';return;}const step=330*dt;R.lap+=step/((RED_LOOP.rx+RED_LOOP.ry)/2);R.ph=((R.ph||0)+step/46)%1;const a=R.a0+R.dir*R.lap,nx=RED_LOOP.x+Math.cos(a)*RED_LOOP.rx,ny=RED_LOOP.y+Math.sin(a)*RED_LOOP.ry;
    if(Math.abs(nx-R.x)>.3)R.face=nx>R.x?1:-1;R.x=nx;R.y=ny;if(Math.random()<dt*14)spark(R.x-R.face*10,R.y+14,'rgba(214,190,150,.8)',40,.4);if(R.lap>=TAU*1.25)R.state='back';}
  else if(R.state==='back'){if(toward(R.hx,R.hy,fight?260:200)){R.state='settle';R.t=1.2;}}
  else if(R.state==='settle'){if(R.t<=0){R.state='sleep';R.t=24+Math.random()*22;R.naps=(R.naps||0)+1;}}}
{const _upd=update;update=function(dt){_upd(dt);try{redTick(dt);}catch(e){}};}
const RED_S=1.05;
function drawRed(c,R,t){const bx=R.hx,by=R.hy,sel=G.inspect===R;
  // his bed, at the same scale as he is
  c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(bx,by+6,17,5,0,0,TAU);c.fill();
  c.fillStyle='#3b1d5e';c.beginPath();c.ellipse(bx,by+3,16,6.8,0,0,TAU);c.fill();c.strokeStyle='#a78bfa';c.lineWidth=2.4;c.stroke();
  c.fillStyle='#6d28d9';c.beginPath();c.ellipse(bx,by+2.5,11.5,4.4,0,0,TAU);c.fill();
  if(R.state==='sleep'){if(sel)redRing(c,bx,by+3,t);c.save();c.translate(bx,by-1.5);drawGreySleep(c,t,RED_S);c.restore();
    for(let k=0;k<3;k++){const ph=(t*.45+k/3)%1;c.globalAlpha=1-ph;c.fillStyle='#c4b5fd';c.font=`700 ${7+ph*5}px Barlow,sans-serif`;c.textAlign='center';c.fillText('z',bx+12+ph*9,by-9-ph*15);}c.globalAlpha=1;return;}
  const moving=R.state==='out'||R.state==='lap'||R.state==='back';
  c.save();c.translate(R.x,R.y);c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(0,15.5,16,4,0,0,TAU);c.fill();
  if(sel)redRing(c,0,15,t);c.scale(R.face,1);if(R.state==='wake'||R.state==='settle')c.rotate(Math.sin(t*6)*.03);
  drawGreyhound(c,moving?'run':'stand',R.ph||0,RED_S);c.restore();}
function redRing(c,x,y,t){c.save();c.strokeStyle='#fdba74';c.lineWidth=1.8;c.setLineDash([4,3]);c.lineDashOffset=-t*10;c.beginPath();c.ellipse(x,y,22,7.5,0,0,TAU);c.stroke();c.restore();}
const redSpot=R=>R.state==='sleep'?[R.hx,R.hy]:[R.x,R.y];
// click him to see how he is, like you would a bad luck creature (but nobody can attack him)
let RED_PICK=false;
cv.addEventListener('pointerup',ev=>{RED_PICK=ev.button===0;},{capture:true});
cv.addEventListener('pointerup',()=>{RED_PICK=false;});
{const _ea=enemyAt;enemyAt=function(x,y){const e=_ea(x,y);if(e||!RED_PICK||!G||!G.red)return e;const [rx,ry]=redSpot(G.red);return Math.hypot(x-rx,y-ry)<22?G.red:null;};}
{const _mt=mapTip;mapTip=function(p){const R=G&&G.red;if(R){const [rx,ry]=redSpot(R);if(Math.hypot(p.x-rx,p.y-ry)<22)return `Red|Retired greyhound · ${redStatus(R)}`;}return _mt(p);};}
const redStatus=R=>R.state==='sleep'?'fast asleep':R.state==='wake'?'stretching':R.state==='settle'?'turning round three times':(redCalm()?'doing zoomies':'heading back to bed');
{const _ps=paneSignature;paneSignature=function(){if(G&&G.inspect&&G.inspect.isRed&&!G.sel.length)return 'RED'+G.inspect.state;return _ps();};}
{const _bp=buildPane;buildPane=function(){const R=G&&G.inspect;if(!R||!R.isRed||G.sel.length)return _bp();const box=$('#unitPane');
  box.innerHTML=`<div class="ph"><canvas class="por big" id="redPor"></canvas><div class="pmain"><div class="pname">Red</div><div class="porig">Retired greyhound · your dog</div>
    <div class="hpt">${redStatus(R)[0].toUpperCase()+redStatus(R).slice(1)}</div>
    <div class="stats">${statHTML('heart','Good boy','Very good boy')}${statHTML('speed',R.laps||0,'Laps of the Strip')}${statHTML('hold',R.naps||0,'Naps taken')}</div></div></div>
    <div class="edesc">Red doesn't take orders. He sleeps on his bed outside the chapel, and when the street is quiet he does a lap at full speed.</div>`;
  const cv2=$('#redPor');const c=cv2.getContext('2d');const sz=92;cv2.width=sz*2;cv2.height=sz*2;c.setTransform(2,0,0,2,0,0);c.translate(sz/2-1,sz/2+4);
  if(R.state==='sleep'){c.translate(0,6);drawGreySleep(c,performance.now()/1000,2.4);}else drawGreyhound(c,'stand',0,1.8);};}
/* ---------- styles ---------- */
(function(){const css=`
.dogwrap{position:relative;margin-bottom:8px}.dogwrap #dogCv{margin-bottom:0}
.dogwrap.stands{padding-bottom:46px}
#dogCrowd{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;border-radius:8px}
.runner.redrun{box-shadow:inset 0 0 0 1.5px ${RED_COAT};color:#fdba74}
.redoffer{display:grid;grid-template-columns:104px 1fr;gap:10px;align-items:start;padding:10px;border-radius:10px;background:#1d1626;box-shadow:inset 0 0 0 1px ${RED_COAT},0 0 18px rgba(180,83,42,.25)}
.redoffer canvas{width:104px;height:65px;border-radius:8px}
.redoffer b{font:400 18px var(--head);color:#fdba74}.redoffer small{display:block;color:var(--muted);font-size:11px;margin:2px 0 4px}
.redoffer p{font-size:12.5px;line-height:1.35;margin:0 0 8px;color:#e9e1f5}.redoffer .mgrow{justify-content:flex-start;gap:6px;margin:0}.redoffer .pb{height:28px;margin:0;padding:0 10px;font-size:11.5px}
.dogtalk{padding:10px 12px;border-radius:10px;background:#1d1626;box-shadow:inset 0 0 0 1px #16a34a,0 0 16px rgba(22,163,74,.2)}.dogtalk small{font:400 10px var(--head);color:#86efac;letter-spacing:.06em;text-transform:uppercase}
.dogtalk p{margin:4px 0 8px;font-size:13px;line-height:1.4;color:#f3e8ff}.dogtalk .mgrow{margin:0;justify-content:flex-end}.dogtalk .pb{height:30px;margin:0}
.dogban{text-align:center;font-size:12px;color:var(--muted);margin:6px 0 0}`;
const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);})();
