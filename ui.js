'use strict';
/* ============ ALL IN — UI, input, audio, loop ============ */
const $=s=>document.querySelector(s);
const SET=(()=>{const d={music:1,sfx:1,shake:true,bars:false,log:true};try{return Object.assign(d,JSON.parse(localStorage.getItem('allin-settings')||'{}'));}catch(e){return d;}})();
function saveSet(){try{localStorage.setItem('allin-settings',JSON.stringify(SET));}catch(e){}}
const Snd={ctx:null,muted:false,last:{},
  init(){try{if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=.2*SET.sfx;this.master.connect(this.ctx.destination);
    const n=this.ctx.sampleRate;this.nb=this.ctx.createBuffer(1,n,n);const d=this.nb.getChannelData(0);for(let i=0;i<n;i++)d[i]=rnd()*2-1;}if(this.ctx.state==='suspended')this.ctx.resume();if(typeof Music!=='undefined')Music.start();}catch(e){}},
  tone(f,dur,type='sine',vol=.3,slide=0,delay=0){const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+.02);},
  noise(dur,vol,freq,type='lowpass',delay=0){const c=this.ctx,t=c.currentTime+delay,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.nb;f.type=type;f.frequency.value=freq;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);s.connect(f);f.connect(g);g.connect(this.master);s.start(t,rnd()*.5);s.stop(t+dur+.02);},
  play(n){if(this.muted||!this.ctx||this.ctx.state!=='running')return;const now=performance.now(),gap={shoot:60,hit:50,pop:45,beam:80,zap:80,boom:80,magic:90,breath:120,thump:90,leak:80,coin:40}[n]||0;if(gap&&this.last[n]&&now-this.last[n]<gap)return;this.last[n]=now;
    switch(n){
      case 'chips':for(let i=0;i<3;i++){this.tone(2400+rnd()*600,.03,'square',.03,0,i*.04);this.noise(.03,.12,4000,'highpass',i*.04);}break;
      case 'deal':for(let i=0;i<5;i++)this.noise(.05,.25,3200,'highpass',i*.06);break;
      case 'card':this.noise(.05,.25,3500,'highpass');break;
      case 'fold':this.noise(.12,.15,1200);break;
      case 'click':this.tone(1200,.03,'square',.035);break;
      case 'coin':this.tone(1568,.06,'square',.035);this.tone(2093,.1,'square',.035,0,.05);break;
      case 'attack':this.tone(520,.08,'square',.05);this.tone(390,.1,'square',.05,0,.05);break;
      case 'shoot':this.tone(900+rnd()*300,.05,'square',.02,.5);break;
      case 'hit':this.noise(.05,.12,900);break;
      case 'pop':this.noise(.07,.1,1800);this.tone(600,.06,'sine',.04,1.8);break;
      case 'beam':this.tone(1400,.18,'sawtooth',.035,.3);break;
      case 'zap':this.noise(.12,.12,5000,'bandpass');this.tone(1800,.1,'square',.03,.4);break;
      case 'magic':this.tone(660,.2,'sine',.06,1.5);this.tone(990,.2,'sine',.04,1.5,.04);break;
      case 'breath':this.noise(.3,.14,900,'bandpass');break;
      case 'thump':this.tone(140,.12,'sine',.12,.6);break;
      case 'boom':this.noise(.35,.25,700);this.tone(100,.3,'sine',.1,.4);break;
      case 'jackpot':[1047,1319,1568,2093].forEach((f,i)=>this.tone(f,.15,'square',.05,0,i*.05));break;
      case 'leak':this.tone(220,.25,'sawtooth',.08,.5);break;
      case 'casinohit':this.tone(92,.32,'sine',.22,.55);this.noise(.16,.12,700);this.tone(660,.09,'square',.035,.8,.02);this.tone(520,.12,'square',.03,.8,.11);break;
      case 'bighand':this.tone(130.8,.9,'sawtooth',.06,1,0);this.tone(196,.9,'sawtooth',.05,1,0);[523,659,784,1047,1319].forEach((f,i)=>this.tone(f,.32,'triangle',.09,0,i*.055));this.noise(.5,.08,3500,'highpass',.05);break;
      case 'die':this.tone(330,.3,'triangle',.1,.4);break;
      case 'spawn':[523,784,1047].forEach((f,i)=>this.tone(f,.2,'triangle',.12,0,i*.06));break;
      case 'merge':[392,523,659,784,1047].forEach((f,i)=>this.tone(f,.25,'sine',.1,0,i*.05));break;
      case 'build':this.tone(700,.06,'triangle',.08);break;
      case 'sell':this.tone(988,.08,'triangle',.08);this.tone(740,.1,'triangle',.08,0,.05);break;
      case 'upgrade':[660,880,1320].forEach((f,i)=>this.tone(f,.15,'sine',.12,0,i*.06));break;
      case 'wave':this.tone(392,.25,'triangle',.13);this.tone(587,.35,'triangle',.13,0,.12);break;
      case 'boss':this.tone(110,1.1,'sawtooth',.16,.5);this.tone(116,1.1,'sawtooth',.12,.5);this.noise(.8,.14,400);break;
      case 'win':[523,659,784,1047].forEach((f,i)=>this.tone(f,.3,'triangle',.12,0,i*.08));break;
      case 'victory':[523,659,784,1047,784,1047,1319].forEach((f,i)=>this.tone(f,.4,'triangle',.12,0,i*.12));break;
      case 'bust':[440,415,392,370].forEach((f,i)=>this.tone(f,.35,'sawtooth',.06,0,i*.15));break;
      case 'lose':[392,330,262,196].forEach((f,i)=>this.tone(f,.5,'triangle',.14,0,i*.22));break;
      case 'siege':this.tone(160,.5,'sawtooth',.06,.6);this.noise(.4,.12,500,'lowpass',.2);this.tone(90,.25,'square',.08,1,.55);break;
      case 'unsiege':this.tone(90,.4,'sawtooth',.06,1.8);this.noise(.3,.1,600);break;
      case 'fan':[0,1,2,3,4].forEach(i=>this.noise(.05,.2,2600,'highpass',i*.05));break;
      case 'lock':this.tone(220,.12,'square',.08);this.tone(330,.25,'square',.06,0,.1);this.noise(.15,.15,900,'lowpass',.1);break;
      case 'slam':this.noise(.4,.3,300);this.tone(70,.4,'sine',.18,.5);break;
      case 'decree':[523,659,784,1047,1319].forEach((f,i)=>this.tone(f,.5,'triangle',.11,0,i*.08));break;
      case 'lullaby':[784,659,523,659,784].forEach((f,i)=>this.tone(f,.35,'sine',.07,0,i*.14));break;
      case 'aim':this.tone(1800,.7,'sine',.025,1.4);break;
      case 'snipe':this.noise(.25,.35,4000,'highpass');this.tone(140,.3,'sawtooth',.1,.3);break;
      case 'pounce':this.noise(.2,.15,1200,'bandpass');this.tone(300,.2,'triangle',.08,2);break;
      case 'rankup':[784,988,1175,1568].forEach((f,i)=>this.tone(f,.18,'square',.05,0,i*.06));break;
      case 'windup':this.tone(200,.8,'sawtooth',.06,2.5);break;
      case 'sel_robot':this.tone(140,.08,'square',.06);this.noise(.05,.12,1800,'bandpass',.02);this.tone(420,.05,'square',.03,0,.07);break;
      case 'sel_beast':this.tone(95,.22,'sawtooth',.07,1.6);this.noise(.18,.08,600,'lowpass');break;
      case 'sel_person':this.tone(660,.07,'sine',.07);this.tone(880,.09,'sine',.06,0,.06);break;
      case 'sel_token':for(let i=0;i<3;i++)this.noise(.025,.18,5200,'highpass',i*.035);this.tone(1200,.04,'triangle',.04,0,.1);break;
      case 'claw':this.noise(.09,.22,3800,'highpass');this.noise(.07,.18,2600,'bandpass',.04);break;
      case 'punch':this.tone(120,.12,'sine',.18,.5);this.noise(.06,.22,900,'lowpass');break;
      case 'slash':this.tone(2200,.12,'triangle',.05,1.6);this.noise(.08,.14,5000,'highpass');break;
      case 'thrust':this.tone(700,.08,'triangle',.06,.6);this.noise(.05,.14,2800,'bandpass');break;
      case 'ink':this.tone(420,.18,'sine',.1,.35);this.noise(.12,.1,700,'lowpass',.04);break;
      case 'error':this.tone(180,.14,'square',.07);this.tone(150,.16,'square',.07,0,.08);break;
    }}};

/* ---------- procedural synthwave soundtrack (original) ---------- */
const Music={on:true,step:0,next:0,timer:null,bus:null,mode:'lounge',
  CH:[[110,[220,261.63,329.63]],[87.31,[174.61,220,261.63]],[130.81,[261.63,329.63,392]],[98,[196,246.94,293.66]]],
  start(){if(!Snd.ctx||this.timer)return;const c=Snd.ctx;this.bus=c.createGain();this.bus.gain.value=.55*SET.music;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5200;this.bus.connect(lp);lp.connect(Snd.master);
    this.next=c.currentTime+.1;this.timer=setInterval(()=>this.tick(),40);},
  setOn(v){this.on=v;if(this.bus)this.bus.gain.setTargetAtTime(v?.55*SET.music:0,Snd.ctx.currentTime,.2);},
  note(f,t,d,type,vol,cut,det){const c=Snd.ctx,o=c.createOscillator(),g=c.createGain(),fl=c.createBiquadFilter();o.type=type;o.frequency.value=f;if(det)o.detune.value=det;fl.type='lowpass';fl.frequency.setValueAtTime(cut||2000,t);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(fl);fl.connect(g);g.connect(this.bus);o.start(t);o.stop(t+d+.05);},
  drum(kind,t,vol){const c=Snd.ctx;if(kind==='kick'){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.18);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g);g.connect(this.bus);o.start(t);o.stop(t+.3);return;}
    const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=Snd.nb;f.type=kind==='hat'?'highpass':'bandpass';f.frequency.value=kind==='hat'?7000:1800;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+(kind==='hat'?.04:.16));s.connect(f);f.connect(g);g.connect(this.bus);s.start(t,rnd()*.5);s.stop(t+.2);},
  tick(){const c=Snd.ctx;if(!c||c.state!=='running')return;
    const paused=!G||G.paused||G.over||!G.running;
    const mode=!G?'lounge':G.enemies.some(e=>e.def.boss||e.def.mini)?'boss':G.phase==='wave'?'wave':'lounge';this.mode=mode;
    const bpm=mode==='boss'?118:mode==='wave'?108:92,sx=60/bpm/4;
    while(this.next<c.currentTime+.18){const t=this.next,s=this.step%64,bar=Math.floor(s/16),b=s%16,[root,ch]=this.CH[bar];
      if(!paused&&this.on){
        if(b===0)for(const f of ch)this.note(f,t,sx*15,'sawtooth',.018,mode==='lounge'?900:1400,(rnd()-.5)*14);
        if(mode==='lounge'){if(b%4===0)this.note(root,t,sx*3,'triangle',.06,500);if(b%4===2)this.drum('hat',t,.025);if(b===10)this.note(ch[2]*2,t,sx*4,'sine',.02,2500);}
        else{if(b%2===0)this.note(root*(b%8===6?2:1),t,sx*1.6,'sawtooth',.05,700);
          const arp=[0,1,2,1,0,2,1,2];this.note(ch[arp[b%8]]*2,t,sx*1.2,'square',mode==='boss'?.018:.013,2600);
          if(b%4===0)this.drum('kick',t,.32);if(b===4||b===12)this.drum('snare',t,.14);this.drum('hat',t,b%2?.018:.03);
          if(mode==='boss'&&b%8===7)this.note(ch[0]*4,t,sx*2,'sawtooth',.012,3200,8);}
      }
      this.next+=sx;this.step++;}
  }};
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),1800);}
const SEEN={};function seen(k){try{return SEEN[k]||localStorage.getItem('allin-seen-'+k);}catch(e){return SEEN[k];}}
function markSeen(k){SEEN[k]=1;try{localStorage.setItem('allin-seen-'+k,'1');}catch(e){}}
function hintOnce(k,text){if(seen(k))return;markSeen(k);const h=$('#hint');h.innerHTML=text;h.classList.add('show');clearTimeout(hintOnce._t);hintOnce._t=setTimeout(()=>h.classList.remove('show'),6500);}
/* ---------- event moments ---------- */
function banner(h,p,cls){
  if(cls==='great')return neonSign(h,p);
  if(cls==='boss')return bossPlate(h,p);
  ribbon(h,p,cls==='round');
}
function ribbon(h,p,withFoes){
  const el=$('#ribbon');let foes='';
  if(withFoes&&G&&G.waveInfo){const cnt={};for(const k of G.waveInfo.list)cnt[k]=(cnt[k]||0)+1;foes=`<div class="foes">${Object.entries(cnt).map(([k,n])=>`<span data-ek="${k}"><canvas></canvas>${n}</span>`).join('')}</div>`;}
  const tr=withFoes&&G&&G.waveInfo&&G.waveInfo.traits?`<div class="traits">${G.waveInfo.traits.map(k=>`<i>${icon(TRAITS[k].icon)}${TRAITS[k].name}</i>`).join('')}</div>`:'';
  el.innerHTML=`<b>${h}</b>${p?`<small>${p}</small>`:''}${foes}${tr}`;el.querySelectorAll('[data-ek] canvas').forEach(c=>enemyPortrait(c,c.parentNode.dataset.ek,26));
  el.className='';void el.offsetWidth;el.className='show';
}
function neonSign(h,p){const el=$('#neonSign');el.innerHTML=`<span>${h}</span>${p?`<small>${p}</small>`:''}`;el.className='';void el.offsetWidth;el.className='show';}
function bossPlate(h,p){const el=$('#bossPlate');const k=h==='Repo Ogre'?'ogre':'boss';el.innerHTML=`<canvas></canvas><div><b>${h}</b><small>${p||''}</small></div>`;enemyPortrait(el.querySelector('canvas'),k,56);
  el.className='';void el.offsetWidth;el.className='show';const bw=$('#boardWrap');bw.classList.remove('alarm');void bw.offsetWidth;bw.classList.add('alarm');}
function potWin(n){if(G&&G.stats)G.stats.bigPot=Math.max(G.stats.bigPot||0,n);const pot=$('#pot').getBoundingClientRect(),me=$('#cards').getBoundingClientRect(),f=document.createElement('div');f.className='flychips';f.innerHTML=`${icon('chips')}+${n}`;
  document.body.appendChild(f);f.style.left=pot.left+pot.width/2+'px';f.style.top=pot.top+'px';requestAnimationFrame(()=>{f.style.transform=`translate(${me.left+me.width/2-pot.left-pot.width/2}px,${me.top-pot.top+10}px)`;f.style.opacity='0';});setTimeout(()=>f.remove(),1300);}
const LOG=[];let logSeq=0;
function gameLog(msg,cls,who){LOG.unshift({msg:String(msg),cls:cls||'',who,id:++logSeq});LOG.length=Math.min(LOG.length,60);renderLog();}
function renderLog(){const el=$('#logList');if(!el)return;const open=$('#logPanel').classList.contains('open'),list=LOG.slice(0,open?60:4).reverse();
  const have=new Set([...el.children].map(c=>+c.dataset.id));const want=new Set(list.map(l=>l.id));
  [...el.children].forEach(c=>{if(!want.has(+c.dataset.id))c.remove();});
  for(const l of list){if(have.has(l.id))continue;const d=document.createElement('div');d.dataset.id=l.id;d.className=l.cls;
    if(l.who){const b=document.createElement('b');b.textContent=l.who.name+': ';b.style.color=l.who.col;d.appendChild(b);d.appendChild(document.createTextNode(l.msg));}else d.textContent=l.msg;el.appendChild(d);}
  if(open)el.scrollTop=el.scrollHeight;$('#logCount').textContent='';}
function toggleLog(force){const p=$('#logPanel'),on=force!=null?force:!p.classList.contains('open');p.classList.toggle('open',on);$('#logMore').innerHTML=icon(on?'stop':'all');
  $('#logList').innerHTML='';renderLog();}

/* ---------- the poker table ---------- */
let traySig='',cardSig='',seatsBuilt=false;
function buildSeats(){
  const rivals=G.players.filter(p=>!p.human);
  $('#seats').innerHTML=rivals.map(p=>{const i=G.players.indexOf(p);return `<div class="seat" data-i="${i}"><div class="av" style="--c:${p.col}">${p.face}</div><div class="sinfo"><b>${esc(p.short||p.name)}</b><span>${icon('chips')}<em data-f="ch"></em><canvas class="lu" data-f="lu" width="36" height="36"></canvas></span></div><div class="sdmg" data-f="dmg"></div><canvas class="bld" width="56" height="44"></canvas><div class="dealer">D</div><div class="sact" data-f="act"></div><div class="scards" data-f="cards"></div><div class="stamp">BUSTED</div><div class="bubble" data-f="bub"></div></div>`;}).join('');
  $('#seats').querySelectorAll('.seat').forEach(el=>{const p=G.players[+el.dataset.i];el.classList.toggle('person',!!(p.remote||p.person));});
  seatsBuilt=true;
}
function drawMiniCasino(cv2,f,col){const c=cv2.getContext('2d');c.clearRect(0,0,56,44);c.save();c.scale(2,2);
  c.fillStyle='#0b0612';c.fillRect(4,6,20,15);c.fillStyle=f>0?'#2a1b3d':'#1a1420';c.fillRect(5,7,18,13);
  if(f>0){for(let i=0;i<3;i++)for(let j=0;j<2;j++){const lit=((i*3+j*5)%7)/7<f;c.fillStyle=lit?'#ffcf7a':'#241a2e';c.fillRect(7+i*5.5,10+j*4.5,3,2.5);}
    c.strokeStyle=col;c.lineWidth=1.2;c.shadowColor=col;c.shadowBlur=f>.4?4:0;c.beginPath();c.moveTo(6,7.5);c.lineTo(22,7.5);c.stroke();c.shadowBlur=0;
    if(f<.6){c.strokeStyle='#0b0612';c.lineWidth=.8;c.beginPath();c.moveTo(9,8);c.lineTo(12,13);c.lineTo(11,17);c.stroke();}
    if(f<.35){c.fillStyle='rgba(120,110,130,.6)';c.beginPath();c.arc(19,5,2.4,0,TAU);c.arc(21,2.5,1.8,0,TAU);c.fill();}}
  else{c.fillStyle='#3a3046';c.beginPath();c.moveTo(4,21);c.lineTo(9,13);c.lineTo(13,17);c.lineTo(18,11);c.lineTo(24,21);c.fill();}
  c.restore();}
function flyChips(from,to,n,col){if(!from||!to)return;const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();if(!a.width||!b.width)return;n=Math.min(6,n);
  for(let i=0;i<n;i++){const d=document.createElement('div');d.className='fchip';d.style.setProperty('--c',col||['#ff3d9a','#22d3ee','#fbbf24','#f5f5f5'][i%4]);document.body.appendChild(d);
    const x0=a.left+a.width/2+(Math.random()-.5)*16,y0=a.top+a.height/2,x1=b.left+b.width/2+(Math.random()-.5)*20,y1=b.top+b.height/2+(Math.random()-.5)*8,mx=(x0+x1)/2,my=Math.min(y0,y1)-30-Math.random()*20;
    const an=d.animate([{transform:`translate(${x0}px,${y0}px) scale(.6)`,opacity:0},{transform:`translate(${mx}px,${my}px) scale(1)`,opacity:1,offset:.45},{transform:`translate(${x1}px,${y1}px) scale(.8)`,opacity:.9}],{duration:520+i*60,delay:i*45,easing:'cubic-bezier(.3,.6,.4,1)',fill:'forwards'});
    an.onfinish=()=>d.remove();setTimeout(()=>d.remove(),1400);}}
const chipMem=new Map();let dealMemN=-1;
function flyCards(to,n,delay){const from=$('#pot');if(!from||!to)return;const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();if(!b.width)return;
  for(let i=0;i<n;i++){const d=document.createElement('div');d.className='fcard';document.body.appendChild(d);const x0=a.left+a.width/2,y0=a.top+a.height/2,x1=b.left+b.width/2+(i-(n-1)/2)*7,y1=b.top+b.height/2;
    const an=d.animate([{transform:`translate(${x0}px,${y0}px) rotate(0deg) scale(.7)`,opacity:0},{transform:`translate(${(x0+x1)/2}px,${Math.min(y0,y1)-18}px) rotate(${180+i*40}deg) scale(1)`,opacity:1,offset:.5},{transform:`translate(${x1}px,${y1}px) rotate(${360+(i-2)*8}deg) scale(.9)`,opacity:.95}],{duration:360,delay:delay+i*55,easing:'cubic-bezier(.3,.6,.4,1)',fill:'forwards'});
    an.onfinish=()=>setTimeout(()=>d.remove(),120);setTimeout(()=>d.remove(),2600);}}
function dealFx(){if(!HD||HD.phase==='tip'||HD.n===dealMemN)return;if(HD.phase!=='bet1'){dealMemN=HD.n;return;}dealMemN=HD.n;
  let k=0;for(const s of HD.seats){const el=s.p.human?$('#cards'):$(`#seats .seat[data-i="${G.players.indexOf(s.p)}"]`);flyCards(el,s.p.human?5:3,k*90);k++;}Snd.play('deal');}
function chipFx(){if(!HD)return;const pot=$('#pot');
  for(const s of HD.seats){const key=s.p.gi!=null?s.p.gi:G.players.indexOf(s.p),m=chipMem.get(key),cur={n:HD.n,c:s.contrib+s.tip,w:s.won||0,ph:HD.phase};
    if(m&&m.n===cur.n){const el=s.p.human?$('#cards'):$(`#seats .seat[data-i="${G.players.indexOf(s.p)}"]`);
      if(cur.c>m.c)flyChips(el,pot,Math.ceil((cur.c-m.c)/10));
      if(HD.phase==='showdown'&&!s.p.human&&HD.winners.includes(s)&&!m.paid){cur.paid=1;setTimeout(()=>flyChips(pot,el,5,'#fbbf24'),350);}else cur.paid=m.paid;}
    chipMem.set(key,cur);}}
function refreshTable(force){
  if(!G)return;if(!seatsBuilt)buildSeats();try{chipFx();dealFx();}catch(e){}
  const hs=humanSeat(),live=HD&&HD.phase!=='done';
  // seats
  $('#seats').querySelectorAll('.seat').forEach(el=>{const p=G.players[+el.dataset.i],s=seatOf(p),q=f=>el.querySelector(`[data-f=${f}]`);
    q('ch').textContent=fmt(p.chips);
    {const lu=q('lu');if(lu.dataset.k!==String(p.lastUnit||'')){lu.dataset.k=p.lastUnit||'';if(p.lastUnit&&UNITS[p.lastUnit]){portrait(lu,p.lastUnit,18);lu.style.visibility='visible';lu.dataset.tip='Last summoned|'+UNITS[p.lastUnit].name;}else lu.style.visibility='hidden';}}
    {const hp=Math.round(p.hp||0),prev=el.dataset.lhp!=null?+el.dataset.lhp:hp;if(hp<prev-0.5&&p.alive!==false){const dm=q('dmg');dm.textContent='−'+(prev-hp);dm.classList.remove('on');void dm.offsetWidth;dm.classList.add('on');}el.dataset.lhp=hp;}
    {const b=q('bub'),on=p.bark&&performance.now()<p.bark.until;if(on&&b.textContent!==p.bark.text)b.textContent=p.bark.text;b.classList.toggle('on',!!on);}
    const turn=!!(live&&HD.actor>=0&&HD.seats[HD.actor]&&HD.seats[HD.actor].p===p);el.classList.toggle('turn',turn);
    el.classList.toggle('won',!!(HD&&HD.phase==='showdown'&&HD.winners.some(w=>w.p===p)));el.classList.toggle('out',!p.alive);
    el.classList.toggle('person',!!(p.remote||p.person&&!p.left));el.classList.toggle('fav',!!(live&&s&&(HD.phase==='tip'?favouriteSeat()===s:s.fav&&HD.phase!=='showdown')));el.classList.toggle('watching',!!(NET.watch&&NET.watch.gi===p.gi));el.classList.toggle('folded',!!(live&&s&&s.folded));el.classList.toggle('isdealer',!!(live&&HD.seats[HD.dealer]&&HD.seats[HD.dealer].p===p));
    let act='';if(live){act=s?(s.folded?'Fold':(s.act==='Ante'?'':s.act)):'Sitting out';}q('act').textContent=act;q('act').classList.toggle('on',!!act);
    const f=p.alive?p.hp/p.maxHp:0,key=Math.round(f*20);if(el.dataset.hk!==String(key)){el.dataset.hk=key;drawMiniCasino(el.querySelector('.bld'),f,p.col);}
    el.dataset.tip=`${p.name}${p.remote||p.person&&!p.left?' (player)':p.left?' (house)':''}|Casino ${Math.ceil(p.hp)}/100|Army strength ${fmt(p.power)}${p.lastUnit?'|Last summoned: '+UNITS[p.lastUnit].name:''}${!p.alive?'|Busted on round '+p.outWave:''}${G.mp&&(p.remote||p.person&&!p.left)?'|Click to watch their casino live':''}`;
    const show=s&&s.shown&&HD&&HD.phase==='showdown',ck=show?s.cards.map(c=>c.v+c.s).join():'';const ce=q('cards');
    if(ce.dataset.k!==ck){ce.dataset.k=ck;const si=+el.dataset.i;ce.innerHTML=show?s.cards.map((c,i)=>`<i style="animation-delay:${(si-1)*.35+i*.06}s" class="${c.s==='H'||c.s==='D'?'r':''} ${c.v>=11?'fc':''} ${s.ev.scoring.includes(i)?'on':''}"><b>${vn(c.v)}</b>${suitSVG(c.s,'cs')}</i>`).join('')+`<em style="animation-delay:${(si-1)*.35+.35}s">${HANDS[s.ev.rank]}</em>`:'';if(show)setTimeout(()=>Snd.play('card'),(si-1)*350);}
    el.classList.toggle('showing',!!show);
  });
  // my cards
  const showCards=live&&hs&&HD.phase!=='tip'&&hs.cards.length;
  const cs=showCards?hs.cards.map(c=>c.v+c.s).join()+[...hs.disc].join()+HD.phase+hs.folded+(hs.changes||0):'back';
  if(cs!==cardSig){const fresh=cardSig==='back'&&showCards;cardSig=cs;
    $('#cards').innerHTML=showCards?hs.cards.map((c,i)=>cardHTML(c,i,(hs.ev.scoring.includes(i)&&!hs.disc.size?'score ':'')+(hs.disc.has(i)?'sel ':'')+(fresh?'new ':'')+(hs.folded?'dim ':''))).join(''):Array.from({length:5},()=>'<div class="card back"></div>').join('');
    if(fresh)$('#cards').querySelectorAll('.card').forEach((c,i)=>c.style.animationDelay=(i*.07)+'s');}
  $('#cards').classList.toggle('pickable',!!(live&&HD.phase==='draw'&&hs&&!hs.folded));
  // hand info
  if(showCards){const ev=hs.ev,d=UNITS[ev.unit];$('#hName').textContent=HANDS[ev.rank];$('#hDetail').textContent=ev.detail+(ev.rank<9?(ev.high?', high':', low'):'');
    const uk=ev.unit+(d.cnt||1);if($('#hUnit').dataset.k!==uk){$('#hUnit').dataset.k=uk;portrait($('#hUnit canvas'),ev.unit,40);}$('#hUnit span').textContent=(d.cnt>1?d.cnt+'× ':'')+d.name;$('#hUnit').style.visibility='visible';}
  else{$('#hName').textContent=live&&HD.phase==='tip'?'':'';$('#hDetail').textContent='';$('#hUnit').style.visibility='hidden';}
  $('#dealerMe').classList.toggle('on',!!(live&&hs&&HD.seats[HD.dealer]===hs));
  $('#potAmt').textContent=live?fmt(potTotal()):'0';{const eb=$('#evBadge'),ev=live&&HD.ev?TABLE_EVENTS[HD.ev]:null;eb.textContent=ev?ev.name:'';eb.dataset.tip=ev?ev.name+'|'+ev.desc:'';eb.style.display=ev?'':'none';}$('#pot').classList.toggle('dim',!live);
  // timer bar
  const timed=live&&(HD.phase==='tip'||HD.phase==='draw'||(HD.actor>=0&&HD.seats[HD.actor].p.human));
  const tmax=HD&&HD.phase==='tip'?12:HD&&HD.phase==='draw'?25:25;$('#tbar').style.width=timed?clamp(HD.t/tmax,0,1)*100+'%':'0%';
  // actions
  let sig='',html='';
  if(live){
    if(HD.phase==='tip'){if(hs){const ex=extraHands(hs),sl=swapLuckOf(ex),favNow=favouriteSeat()===hs;sig='tip'+hs.tip+ex+Math.min(hs.p.chips,99)+favNow;
        html=`<div class="tips3">${[10,25,50].map(n=>`<button class="pb" data-a="tip" data-n="${n}" ${hs.p.chips<n?'disabled':''} data-tip="Tip the dealer ${n}|Tips deal you the best of several hands, and your swap is drawn best of several too.|The biggest tip at the table makes you the dealer's favourite: swap one extra card.|Rivals' tips water yours down.">${icon('chips')}${n}</button>`).join('')}</div>
         ${ex||favNow?`<div class="tipfx">${ex?`<span data-tip="Better deal|You're dealt the best of ${ex+1} hands">Deal ×${ex+1}</span><span data-tip="Better swap|Your replacement cards are drawn ${sl} times and you keep the best set">Swap ×${sl}</span>`:''}${favNow?`<span class="fav" data-tip="Dealer's favourite|Biggest tip at the table. Swap one extra card this hand.">♛ +1 card</span>`:''}</div>`:''}
         ${hs.ready?`<button class="pb main" disabled>Waiting for the table</button>`:`<button class="pb main" data-a="deal" data-tip="${G.mp?'Ready (Enter)|Cards are dealt when every player is ready':'Deal (Enter)'}">${G.mp?'Ready':'Deal'}${ex?`<em>best of ${ex+1}</em>`:''}</button>`}`;sig+=hs.ready;}
      else{sig='tipno';html='<div class="pmsg">No ante, no cards</div>';}}
    else if(HD.phase==='bet1'||HD.phase==='bet2'){
      if(HD.actor>=0&&HD.seats[HD.actor].p.human&&G.mp&&!NET.host&&NET.myIn.h===HD.n&&NET.myIn.tu===HD.tu){sig='acted'+HD.tu;html='<div class="pmsg">…</div>';}
      else if(HD.actor>=0&&HD.seats[HD.actor].p.human){const call=toCall(hs),can=HD.raises<MAX_RAISES&&hs.p.chips>call;sig='act'+call+HD.raises+HD.curBet;
        html=`<div class="betrow"><button class="pb fold" data-a="fold" data-tip="Fold (X)">Fold</button><button class="pb" data-a="call" data-tip="${call?'Call':'Check'} (C)">${call?'Call '+Math.min(call,hs.p.chips):'Check'}</button></div><button class="pb main" data-a="raise" ${can?'':'disabled'} data-tip="${HD.curBet?'Raise':'Bet'} (R)|Limit ${HD.size} · raise ${HD.raises+1} of ${MAX_RAISES}">${HD.curBet?'Raise to '+(HD.curBet+HD.size):'Bet '+HD.size}</button>`;}
      else{const a=HD.actor>=0?HD.seats[HD.actor].p:null;sig='w'+(a?a.name:'')+(hs&&hs.folded);html=`<div class="pmsg">${hs&&hs.folded?'You folded':a?(a.short||a.name)+' to act':''}</div>`;}}
    else if(HD.phase==='draw'){if(hs&&!hs.folded&&hs.done){sig='drawdone';html='<div class="pmsg">Waiting for the table…</div>';}
      else if(hs&&!hs.folded){const n=hs.disc.size;sig='draw'+n;
        const cap=hs.maxSwap||HD.maxSwap||3;
        html=`<button class="pb main" data-a="swap" ${n?'':'disabled'} data-tip="Swap marked cards (Enter)|Up to ${cap} cards, once${hs.luck>1?'|Your tip draws the replacements best of '+hs.luck:''}${hs.fav?"|Dealer's favourite: one extra card":''}">Swap ${n||''}${hs.luck>1?`<em>best of ${hs.luck}</em>`:''}</button><button class="pb" data-a="stand">Stand pat</button>`;}
      else{sig='drawno';html='<div class="pmsg">Drawing…</div>';}}
    else if(HD.phase==='showdown'){sig='sd'+HD.result;const w=HD.winners[0];html=`<div class="pmsg res">${HD.result}</div>`;}
  }else if(G.spectate){sig='spec';html='<div class="pmsg">Spectating · you\'ll be dealt into the next game</div>';}
  else{const wn=G.phase==='wait'&&G.mp?waitNames():[];sig='idle'+G.phase+(G.phase==='wave'?G.enemies.length+G.spawnQ.length:'')+wn.join();
    html=G.phase==='wave'?`<div class="pmsg"><b>${G.enemies.length+G.spawnQ.length}</b> bad luck left</div>`:G.over&&G.mp?'<div class="pmsg">Watching the table</div>':(wn.length?`<div class="pmsg">Waiting on ${esc(wn.slice(0,3).join(', '))}${wn.length>3?'…':''}</div>`:G.phase==='mini'&&MG?`<div class="pmsg">${MINI_NAME[MG.kind]}</div>`:'<div class="pmsg">Shuffling</div>')+(G.over&&!G.mp?'':`<button class="pb slotb" data-slots>${icon('cherry')}Slots</button>`);}
  if(sig!==traySig){traySig=sig;$('#pActions').innerHTML=html;}
  if(live&&HD.phase==='tip'&&hs)hintOnce('tip','Tip the dealer to be dealt the best of several hands, or just <b>Deal</b>.');
  if(live&&HD.phase==='draw'&&hs&&!hs.folded)hintOnce('draw','Click up to <b>'+(hs.maxSwap||HD.maxSwap||3)+' cards</b> to mark them, then <b>Swap</b>. Your final hand summons a creature, even if you fold.');
}
$('#pActions').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!G||!HD)return;Snd.init();const a=b.dataset.a,hs=humanSeat();
  if(a==='tip')uiTip(+b.dataset.n);else if(a==='deal')uiDeal();
  else if(a==='swap')uiSwap();else if(a==='stand')uiStand();
  else uiAct(a);
  refreshTable(true);});
$('#cards').addEventListener('click',e=>{const c=e.target.closest('.card');if(c&&c.dataset.i!=null){toggleDiscard(+c.dataset.i);const hs=humanSeat();if(G.mp&&hs&&HD)NET.disc={h:HD.n,d:[...hs.disc]};}});
/* table actions: local in solo or when hosting, sent to the host otherwise */
const asClient=()=>!!(G&&G.mp&&NET.on&&!NET.host);
function uiTip(n){if(asClient())return intentTip(n);tipDealer(n);}
function uiDeal(){if(!HD||HD.phase!=='tip'||!humanSeat())return;if(asClient())return intent({rd:1});dealNow();}
function uiAct(a){const hs=humanSeat();if(!HD||!hs||HD.actor!==HD.seats.indexOf(hs))return;if(asClient())return intent({tu:HD.tu,a});act(HD.actor,a);}
function uiSwap(){const hs=humanSeat();if(asClient()){if(HD&&HD.phase==='draw'&&hs&&!hs.folded&&hs.disc.size&&hs.changes>0)intent({dr:[...hs.disc]});return;}humanSwap();}
function uiStand(){if(asClient()){const hs=humanSeat();if(HD&&HD.phase==='draw'&&hs&&!hs.folded)intent({dr:'pat'});return;}standPat();}
function uiConfirmDraw(){const hs=humanSeat();if(hs&&hs.disc.size)uiSwap();else uiStand();}

/* ---------- selection pane ---------- */
let paneSig='';
function paneSignature(){if(!G)return '';if(G.inspect&&G.inspect.dead)G.inspect=null;if(G.inspect&&!G.sel.length)return 'E'+G.inspect.id;const s=G.sel;let k=s.map(u=>u.id).join(',');if(s.length===1)k+='|'+(s[0].rank||0)+'|'+recipesFor(s[0].k).map(r=>G.units.some(o=>o!==s[0]&&o.k===r.partner)?1:0).join('');if(!s.length)k+='c'+G.workers.length+G.workers.filter(w=>w.mode==='repair').length+G.base.tier+G.base.cannon+G.up.dmg+G.up.hp+G.barricades+G.base.plate;return k;}
function statHTML(ic,val,tip){return `<span class="st" data-tip="${tip}">${icon(ic)}<b>${val}</b></span>`;}
function enemyTraits(e){const d=e.def,out=[];
  {const MV={summon:'Summoner',dash:'Charger',shield:'Shield',edge:'Trickster',slam:'Ground slam'},m=d.mini?'slam':e.move||bossMove(e);if(d.moves)out.push(['crown','Secret boss',d.movesDesc]);else if(d.boss&&typeof bossInfo==='function'&&e.k==='boss'){const I=bossInfo();out.push(['crown','Boss · '+I.move,I.moveDesc]);}else if(d.boss||d.mini)out.push(['crown',(d.boss?'Boss':'Mini-boss')+' · '+MV[m],BOSS_MOVE_DESC[m]||'']);}
  if(d.dodge&&!d.fly)out.push(['next','Ignores creatures','Runs past your creatures for the casino']);
  if(d.fly)out.push(['sparkles','Flies','Crosses ropes and buildings in a straight line']);
  if(d.split)out.push(['armor','Shatters','Splits into '+d.split+' shards when broken']);
  if(d.ranged)out.push(['range','Ranged','Attacks creatures from '+d.ranged+' away']);
  if(d.armor>=2)out.push(['armor','Armored','Shrugs off small hits']);
  return out;}
function buildPane(){
  const box=$('#unitPane'),s=G.sel;
  if(G.inspect&&!s.length){const e=G.inspect,d=e.def,tr=enemyTraits(e);
    box.innerHTML=`<div class="ph"><canvas class="por big enemy" data-tip="${esc(e.name)}|${e.k==='boss'&&typeof bossInfo==='function'?bossInfo().desc:ENEMY_DESC[e.k]||''}"></canvas><div class="pmain"><div class="pname">${esc(e.name)}</div><div class="porig foe">Bad luck${d.boss?' · Boss':d.mini?' · Mini-boss':''}</div>
      <div class="hp foe"><i data-f="hp"></i></div><div class="hpt" data-f="hpt"></div>
      <div class="stats">${statHTML('armor',Math.round(e.armor),'Armor: flat damage soaked from every hit')}${statHTML('speed',Math.round(e.spd),'Speed')}${statHTML('casino',Math.round(d.bite*.6*10)/10,'Damage to your casino per bite')}${statHTML('dmg',d.dmg,'Damage to your creatures per hit')}${statHTML('chips',d.gold+Math.floor(G.wave/8),'Chips paid when busted')}</div></div></div>
      <div class="edesc">${e.k==='boss'&&typeof bossInfo==='function'?bossInfo().desc:ENEMY_DESC[e.k]||''}</div>${tr.length?`<div class="etraits">${tr.map(([ic,n,tp])=>`<span data-tip="${n}|${tp}">${icon(ic)}${n}</span>`).join('')}</div>`:''}`;
    enemyPortrait(box.querySelector('.por'),e.k,92);return;}
  if(!s.length){box.innerHTML=`<div class="ph"><canvas class="por big" id="casPor"></canvas><div class="pmain"><div class="pname">Your casino</div><div class="hp"><i data-f="hp"></i></div><div class="hpt" data-f="hpt"></div>
      <div class="stats">${statHTML('croupier',G.workers.filter(w=>w.mode!=='repair').length+'/'+G.workers.filter(w=>w.mode==='repair').length,'Croupiers gathering / repairing')}${statHTML('casino',CASINO_TIERS[G.base.tier].name.split(' ')[0],CASINO_TIERS[G.base.tier].name)}${statHTML('rope',G.barricades,'Velvet ropes laid')}${statHTML('dmg','+'+G.up.dmg*12+'%','Creature damage bonus')}${statHTML('hp','+'+G.up.hp*12+'%','Creature health bonus')}</div></div></div><div class="dmeter" data-f="dmeter"></div>`;
    const c=$('#casPor').getContext('2d');$('#casPor').width=184;$('#casPor').height=184;c.scale(2,2);c.fillStyle='#1d1229';c.fillRect(14,16,64,60);c.fillStyle='#38224f';c.fillRect(24,24,44,44);
    neonStroke(c,signShape(c,'spade',46,46,13),NEON.pink,2.2,10);for(let i=0;i<18;i++){c.fillStyle=i%3?'#ffd36b':'#8a5a18';c.beginPath();c.arc(16+i*3.5,18,1.1,0,TAU);c.arc(16+i*3.5,74,1.1,0,TAU);c.fill();}return;}
  if(s.length===1){const u=s[0],d=u.def,rec=recipesFor(u.k);
    box.innerHTML=`<div class="ph"><canvas class="por big" data-tip="${d.name}|${d.desc}|${d.merge?'Merge, tier '+d.tier:'From '+HANDS[d.hand]+(d.hand<9?(d.hi?', high':', low'):'')}"></canvas><div class="pmain"><div class="pname">${d.name}</div><div class="porig">${d.role||''}${d.tier?' <span class="stars">'+'★'.repeat(d.tier)+'</span>':''}${u.rank?' <span class="rank">'+RANK_NAME[u.rank]+'</span>':''}</div>
      <div class="hp"><i data-f="hp"></i></div><div class="hpt" data-f="hpt"></div>
      <div class="stats">${statHTML('dmg','<span data-f="dmg"></span>','Damage per hit')}${statHTML('rate',d.rate.toFixed(1),'Attacks per second')}${statHTML('range',d.range<30?'Melee':d.range,'Range')}${statHTML('armor',d.armor||0,'Armor')}${statHTML('kills','<span data-f="k"></span>',u.rank>=3?'Kills · Legend':'Kills · next rank at '+rankNeed(u.k,(u.rank||0)+1))}${statHTML('zap','<span data-f="dd"></span>','Damage dealt this game')}</div></div></div>
      ${d.detect?`<div class="etraits" style="margin-top:6px"><span data-tip="Sharp eyes|Spots invisible Card Cheats within 160" style="color:#d9f6ff;background:rgba(34,225,255,.1);box-shadow:inset 0 0 0 1px rgba(34,225,255,.4)">${icon('sparkles')}Sharp eyes</span></div>`:''}
      ${d.ab?`<div class="abchip" data-tip="${ABIL[d.ab].name} (E)|${ABIL[d.ab].desc}">${icon(ABIL[d.ab].icon)}<span>${ABIL[d.ab].name}</span><b data-f="abcd"></b></div>`:''}
      ${rec.length?`<div class="recipes${rec.length>=4?' many':''}">${rec.map(r=>{const n=G.units.filter(o=>o!==u&&o.k===r.partner).length;return `<button class="rcp" data-p="${r.partner}" ${n?'':'disabled'} data-tip="Merge with ${UNITS[r.partner].name}|Makes ${UNITS[r.out].name}${n?'':'|You have none yet'}"><canvas data-k="${r.partner}"></canvas>${icon('next')}<canvas data-k="${r.out}"></canvas></button>`;}).join('')}</div>`:''}`;
    {const pc=box.querySelector('.por');pc.style.setProperty('--ring',d.sig||d.secret||d.bonus?'#c084fc':d.merge?['#22e1ff','#ff3d9a','#e0b040'][Math.min(2,(d.tier||1)-1)]:'#7d8494');pc.classList.add('ring');}
    portrait(box.querySelector('.por'),u.k,92);box.querySelectorAll('.rcp canvas').forEach(c=>portrait(c,c.dataset.k,30));
    box.querySelectorAll('.rcp').forEach(b=>b.addEventListener('click',()=>{Snd.init();mergeNearest(u,b.dataset.p);refreshPane(true);}));
    return;}
  const groups={};for(const u of s)(groups[u.k]=groups[u.k]||[]).push(u);const two=s.length===2?mergeResult(s[0].k,s[1].k):null;
  box.innerHTML=`<div class="multi">${Object.entries(groups).map(([k,us])=>`<button class="mu" data-k="${k}" data-tip="${UNITS[k].name}|Click to select only these"><canvas></canvas><b>${us.length}</b></button>`).join('')}</div>${two?`<button class="pb main mergebig" data-a="merge">${icon('merge')} ${UNITS[two].name}</button>`:''}`;
  box.querySelectorAll('.mu').forEach(b=>{portrait(b.querySelector('canvas'),b.dataset.k,40);b.addEventListener('click',ev=>{G.sel=ev.shiftKey?G.sel.filter(u=>u.k!==b.dataset.k):G.sel.filter(u=>u.k===b.dataset.k);G.units.forEach(u=>u.sel=G.sel.includes(u));refreshPane(true);});});
  const mb=box.querySelector('[data-a=merge]');if(mb)mb.addEventListener('click',()=>{Snd.init();doMerge();});
}
function refreshPane(force){if(!G)return;const sig=paneSignature();if(sig!==paneSig||force){paneSig=sig;buildPane();}
  const box=$('#unitPane'),q=f=>box.querySelector(`[data-f=${f}]`);
  if(G.inspect&&!G.sel.length&&q('hp')){const e=G.inspect,f=clamp(e.hp/e.maxHp,0,1);q('hp').style.width=f*100+'%';q('hpt').textContent=`${Math.max(0,Math.ceil(e.hp))} / ${Math.round(e.maxHp)}${e.shield>0?' · shield '+Math.ceil(e.shield):''}${e.stun>0?' · stunned':e.slow>0?' · slowed':''}`;return;}
  if(!G.sel.length&&q('dmeter'))updateDmeter(q('dmeter'));
  if(!G.sel.length&&q('hp')){const f=clamp(G.base.hp/G.base.maxHp,0,1);q('hp').style.width=f*100+'%';q('hp').className=f>.5?'':f>.25?'mid':'low';q('hpt').textContent=`${Math.ceil(G.base.hp)} / ${G.base.maxHp}`;}
  if(G.sel.length===1&&q('hp')){const u=G.sel[0],f=clamp(u.hp/u.maxHp,0,1);q('hp').style.width=f*100+'%';q('hp').className=f>.5?'':f>.25?'mid':'low';q('hpt').textContent=`${Math.ceil(u.hp)} / ${Math.round(u.maxHp)}`;
    if(q('abcd')){const c2=u.cds[u.def.ab]||0;q('abcd').textContent=c2>0?Math.ceil(c2)+'s':(u.siegeTo?'deployed':'ready');}
    const sp=u.def.sp||{};q('dmg').textContent=Math.round(uStat(u).dmg)+(sp.shots?'×2':'')+(sp.targets?'×'+sp.targets:'');q('k').textContent=u.rank>=3?u.kills:u.kills+'/'+rankNeed(u.k,(u.rank||0)+1);if(q('dd'))q('dd').textContent=fmt(Math.round(u.dmgDone||0));}
}
function doMerge(){const s=G.sel;if(s.length===2&&mergeResult(s[0].k,s[1].k)){mergeUnits(s[0],s[1]);G.units.forEach(u=>u.sel=G.sel.includes(u));refreshPane(true);return;}
  if(s.length===1){const r=recipesFor(s[0].k).find(r=>G.units.some(o=>o!==s[0]&&o.k===r.partner));if(r){mergeNearest(s[0],r.partner);G.units.forEach(u=>u.sel=G.sel.includes(u));refreshPane(true);return;}}
  toast('Select two creatures that merge');Snd.play('error');}
function selectAll(){G.units.forEach(u=>u.sel=true);G.sel=G.units.slice();refreshPane(true);}

/* ---------- command card ---------- */
const CMDS=[
  {k:'amove',ic:'amove',key:'A',name:'Attack-move',desc:'Move, fighting anything on the way'},{k:'stop',ic:'stop',key:'S',name:'Stop',desc:'Stop and guard this spot'},
  {k:'hold',ic:'hold',key:'H',name:'Hold position',desc:'Never move, only fire in range'},{k:'merge',ic:'merge',key:'M',name:'Merge',desc:'Fuse two selected creatures that make a recipe'},
  {k:'all',ic:'all',key:'Q',name:'Select army',desc:'Select every creature'},
  {k:'rope',ic:'rope',key:'V',name:'Velvet rope',desc:'Lay ropes to make a maze (10 chips each). Click a rope to take it back.'},
  {k:'casino',ic:'casino',up:1},{k:'crRepair',ic:'reinforce',key:'+',name:'Send a croupier to repair',desc:'A croupier stops fetching chips and patches up the casino: about 0.8 health a second each, for 1 chip per point of health.'},{k:'crGather',ic:'croupier',key:'−',name:'Send a croupier back to the truck',desc:'A repairing croupier goes back to fetching chips.'},{k:'croupier',ic:'croupier',up:1},{k:'dmg',ic:'dmg',up:1},{k:'hp',ic:'hp',up:1},{abSlot:0},{abSlot:1},{abSlot:2},
];
const AB_KEYS=['E','D','G'];
function selAbilities(){const out=[];for(const u of G.sel){const a=u.def.ab;if(a&&!out.includes(a))out.push(a);}return out.slice(0,3);}
function buildCmd(){$('#cmd').innerHTML=CMDS.map((c,i)=>{if(c.abSlot!=null)return `<button class="slot abs" data-abslot="${c.abSlot}"><span class="ii"></span><span class="key">${AB_KEYS[c.abSlot]}</span><span class="cdv"></span><span class="cdn"></span></button>`;if(!c.k)return '<div class="slot empty"></div>';
  if(c.up){const U=UPGRADES[c.k];return `<button class="slot up" data-c="${c.k}">${icon(c.ic)}<span class="cost">${icon('chips')}<em></em></span><span class="pips"></span></button>`;}
  return `<button class="slot" data-c="${c.k}" data-tip="${c.name} (${c.key})|${c.desc}">${icon(c.ic)}<span class="key">${c.key}</span></button>`;}).join('');
  $('#cmd').querySelectorAll('[data-c]').forEach(b=>b.addEventListener('click',()=>{Snd.init();cmd(b.dataset.c);}));
  $('#cmd').querySelectorAll('[data-abslot]').forEach(b=>b.addEventListener('click',()=>{Snd.init();useAbilitySlot(+b.dataset.abslot);}));}
function useAbilitySlot(i){if(!G||G.over)return;const ab=selAbilities()[i];if(!ab)return;const A=ABIL[ab];
  if(A.type==='self'||A.type==='toggle'){castAbility(ab,G.sel,null);refreshCmd();return;}
  const ready=G.sel.some(u=>u.def.ab===ab&&!(u.cds[ab]>0));if(!ready){toast(A.name+' is recharging');Snd.play('error');return;}
  setMode({ab});}
function cmd(k){if(!G||G.over)return;
  if(UPGRADES[k]){buyUpgrade(k);refreshCmd();return;}
  if(k==='amove'){if(G.sel.length)setMode('amove');}else if(k==='stop')orderStop(G.sel);else if(k==='hold')orderHold(G.sel);else if(k==='merge')doMerge();else if(k==='all')selectAll();else if(k==='rope')setMode(G.mode==='rope'?null:'rope');else if(k==='crRepair')setDuty(1);else if(k==='crGather')setDuty(-1);
  refreshCmd();}
function refreshCmd(){if(!G)return;refreshAbilitySlots();
  $('#cmd').querySelectorAll('[data-c]').forEach(b=>{const k=b.dataset.c;
    if(UPGRADES[k]){const U=UPGRADES[k],l=upLevel(k),max=l>=U.max;b.disabled=max||G.me.chips<U.cost(l)||G.over;b.querySelector('em').textContent=max?'MAX':U.cost(l);
      const pips=Math.min(U.max,10);b.querySelector('.pips').innerHTML=Array.from({length:pips},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('');
      b.dataset.tip=`${U.name}|${U.desc}|${k==='croupier'?G.workers.length+' hired':k==='casino'?'Now: '+CASINO_TIERS[G.base.tier].name:'Level '+l+' of '+U.max}${max?'':'|Cost '+U.cost(l)+' chips'}`;}
    else{b.classList.toggle('lit',(k==='rope'&&G.mode==='rope')||(k==='amove'&&G.mode==='amove'));
      if(k==='crRepair'||k==='crGather'){const rep=G.workers.filter(w=>w.mode==='repair').length;b.disabled=k==='crRepair'?rep>=G.workers.length:rep===0;b.querySelector('.key').textContent=k==='crRepair'?rep+'⚒':(G.workers.length-rep)+'$';return;}
      b.disabled=(['amove','stop','hold'].includes(k)&&!G.sel.length)||(k==='merge'&&!(G.sel.length===2&&mergeResult(G.sel[0].k,G.sel[1].k))&&!(G.sel.length===1&&recipesFor(G.sel[0].k).some(r=>G.units.some(o=>o!==G.sel[0]&&o.k===r.partner))));}});}
function setMode(m){G.mode=m;refreshCmd();}
function refreshAbilitySlots(){const abs=selAbilities();
  $('#cmd').querySelectorAll('[data-abslot]').forEach(b=>{const i=+b.dataset.abslot,ab=abs[i];
    if(!ab){if(b.dataset.ab){b.dataset.ab='';b.querySelector('.ii').innerHTML='';}b.classList.add('empty');b.disabled=true;b.removeAttribute('data-tip');b.style.setProperty('--p',0);b.querySelector('.cdn').textContent='';return;}
    const A=ABIL[ab];if(b.dataset.ab!==ab){b.dataset.ab=ab;b.querySelector('.ii').innerHTML=icon(A.icon);}
    b.classList.remove('empty');b.disabled=false;
    const us=G.sel.filter(u=>u.def.ab===ab);const cd=Math.min(...us.map(u=>Math.max(0,u.cds[ab]||0)));
    b.style.setProperty('--p',cd>0?cd/A.cd:0);b.querySelector('.cdn').textContent=cd>0?Math.ceil(cd):'';
    b.classList.toggle('lit',(A.type==='toggle'&&us.some(u=>u.siegeTo))||(G.mode&&G.mode.ab===ab));
    b.dataset.tip=`${A.name} (${AB_KEYS[i]})|${A.desc}|${A.type==='toggle'?'Toggle':'Recharge '+A.cd+'s'}${A.type==='area'?'|Click a spot on the Strip':A.type==='enemy'?'|Click an enemy':''}`;});}

/* ---------- resource bar ---------- */
let nextSig='';
function syncNext(){const w=G.wave+1,el=$('#rNext');if(w>MAX_WAVE&&!G.freeplay){el.style.display='none';return;}el.style.display='';
  const sig=w+'|'+G.phase;if(sig===nextSig)return;nextSig=sig;const c=waveComp(w),cnt={};for(const k of c.list)cnt[k]=(cnt[k]||0)+1;
  el.innerHTML=`${icon('next')}<span class="nl">${c.boss||c.mini?c.name:'Next: '+c.name}</span>${Object.keys(cnt).filter(k=>k!=='boss'&&k!=='ogre').slice(0,3).map(k=>`<canvas data-ek="${k}"></canvas>`).join('')}${(c.traits||[]).filter(t=>t!=='boss').map(t=>`<i class="tt">${icon(TRAITS[t].icon)}</i>`).join('')}`;
  el.querySelectorAll('canvas').forEach(cv2=>enemyPortrait(cv2,cv2.dataset.ek,22));
  el.dataset.tip=`Round ${w}: ${c.name}|${Object.entries(cnt).map(([k,n])=>n+' '+(k==='boss'?c.name:ENEMIES[k].name)).join(', ')}${(c.traits||[]).map(t=>'|'+TRAITS[t].name+': '+TRAITS[t].tip).join('')}`;}
function syncTop(){
  if(!G)return;syncNext();topTips();
  const f=clamp(G.base.hp/G.base.maxHp,0,1);$('#rHpBar').style.width=f*100+'%';$('#rHpBar').className=f>.5?'':f>.25?'mid':'low';$('#rHp').textContent=Math.ceil(G.base.hp);
  $('#rRound').innerHTML=`${G.wave}<small>/${MAX_WAVE}</small>`;$('#rRivals').textContent=G.players.filter(p=>!p.human&&p.alive).length;$('#rArmy').textContent=G.units.length;
}

/* ---------- tooltips ---------- */
const tipEl=$('#tip');let tipFor=null;
function showTip(text,x,y){const parts=String(text).split('|');tipEl.innerHTML=`<b>${parts[0]}</b>`+parts.slice(1).map(p=>`<div>${p}</div>`).join('');tipEl.classList.add('show');
  const r=tipEl.getBoundingClientRect();let tx=x+14,ty=y-r.height-12;if(tx+r.width>innerWidth-8)tx=x-r.width-14;if(ty<6)ty=y+18;tipEl.style.left=tx+'px';tipEl.style.top=ty+'px';}
function hideTip(){tipEl.classList.remove('show');tipFor=null;}
document.addEventListener('pointermove',e=>{const el=e.target.closest&&e.target.closest('[data-tip]');if(el){tipFor=el;showTip(el.dataset.tip,e.clientX,e.clientY);}else if(tipFor){hideTip();}});
function mapTip(p){
  const u=unitAt(p.x,p.y);if(u)return `${u.def.name}|${Math.ceil(u.hp)} / ${Math.round(u.maxHp)} health`;
  const wk=G.workers.find(w=>Math.hypot(w.x-p.x,w.y-p.y)<12);if(wk)return `Croupier|${wk.st===0?'Heading to the truck':wk.st===1?'Loading chips':'Carrying '+wk.carry+' chips to the casino'}`;
  const e=enemyAt(p.x,p.y);if(e)return `${e.name}|${fmt(Math.max(0,e.hp))} health`;
  const c=Math.floor(p.x/TILE),r=Math.floor(p.y/TILE);
  if(c>=BASE.c0&&c<BASE.c0+BASE.w&&r>=BASE.r0&&r<BASE.r0+BASE.h)return `Your casino|${Math.ceil(G.base.hp)} / ${G.base.maxHp}`;
  if(c>=VAULT.c0&&c<VAULT.c0+VAULT.w&&r>=VAULT.r0&&r<VAULT.r0+VAULT.h)return 'Armored truck|Your croupiers fetch chips from here';
  const o=OBST.find(o=>c>=o.c&&c<o.c+o.w&&r>=o.r&&r<o.r+o.h);if(o)return o.name;
  if(p.x<90)return 'Desert highway|Bad luck rolls into town here';
  if(grid[gi(c,r)]===2)return 'Velvet rope';
  return null;
}

function selSound(u){const b=u.def.look.b;return b==='robot'||b==='tank'?'sel_robot':['hound','chimera','drake','crab','kraken','rider'].includes(b)?'sel_beast':['chip','die','coin','slot','wheel'].includes(b)?'sel_token':'sel_person';}
/* ---------- input ---------- */
let drag=null,hover=null,lastClick={t:0,k:null},ropePaint=null;
function boardPos(ev){const r=cv.getBoundingClientRect();return {x:(ev.clientX-r.left)/r.width*W,y:(ev.clientY-r.top)/r.height*H};}
function unitAt(x,y){let best=null,bd=1e9;for(const u of G.units){const d=Math.hypot(u.x-x,u.y-y);if(d<u.r*1.2+6&&d<bd){bd=d;best=u;}}return best;}
function enemyAt(x,y){let best=null,bd=1e9;for(const e of G.enemies){if(e.hidden)continue;const d=Math.hypot(e.x-x,e.y-y);if(d<e.r*1.15+7&&d<bd){bd=d;best=e;}}return best;}
cv.addEventListener('pointerdown',ev=>{if(NET.watch&&NET.watch.full)return;
  Snd.init();hideTip();if(!G||G.over)return;const p=boardPos(ev);
  if(ev.button===2){if(G.mode){setMode(null);return;}if(!G.sel.length)return;const e=enemyAt(p.x,p.y);if(e)orderAttack(G.sel,e);else orderMove(G.sel,p.x,p.y,false);return;}
  if(ev.button!==0)return;
  if(G.mode==='rope'){const c=Math.floor(p.x/TILE),r=Math.floor(p.y/TILE);let kind;if(grid[gi(c,r)]===2){removeBarricade(c,r);kind='remove';}else{placeBarricade(c,r);kind='add';}ropePaint={kind,last:gi(c,r)};cv.setPointerCapture(ev.pointerId);return;}
  if(G.mode&&G.mode.ab){const ab=G.mode.ab,A=ABIL[ab],e=enemyAt(p.x,p.y);
    if(A.type==='enemy'&&!e){toast('Pick an enemy');Snd.play('error');return;}
    castAbility(ab,G.sel,{x:e&&A.type==='enemy'?e.x:p.x,y:e&&A.type==='enemy'?e.y:p.y,e:A.type==='enemy'?e:null});if(!ev.shiftKey)setMode(null);return;}
  if(G.mode==='amove'){const e=enemyAt(p.x,p.y);if(e)orderAttack(G.sel,e);else orderMove(G.sel,p.x,p.y,true);if(!ev.shiftKey)setMode(null);return;}
  drag={x0:p.x,y0:p.y,x1:p.x,y1:p.y,box:false,shift:ev.shiftKey};cv.setPointerCapture(ev.pointerId);
});
cv.addEventListener('pointermove',ev=>{if(!G)return;const p=boardPos(ev);hover=p;
  if(ropePaint){const c=Math.floor(p.x/TILE),r=Math.floor(p.y/TILE);if(c>=0&&r>=0&&c<COLS&&r<ROWS&&gi(c,r)!==ropePaint.last){ropePaint.last=gi(c,r);if(ropePaint.kind==='add'&&grid[gi(c,r)]===0&&!NO_BUILD.has(gi(c,r))&&G.me.chips>=10&&!canBarricade(c,r))placeBarricade(c,r);else if(ropePaint.kind==='remove')removeBarricade(c,r);}}
  if(drag){drag.x1=p.x;drag.y1=p.y;if(Math.hypot(drag.x1-drag.x0,drag.y1-drag.y0)>6)drag.box=true;}
  if(!drag&&!ropePaint&&!G.mode){const t=mapTip(p);if(t){showTip(t,ev.clientX,ev.clientY);tipFor=cv;}else if(tipFor===cv)hideTip();}else if(tipFor===cv)hideTip();
});
cv.addEventListener('pointerup',ev=>{if(NET.watch&&NET.watch.full)return;
  ropePaint=null;if(!drag||!G)return;const d=drag;drag=null;let picked=[];
  if(d.box){const x0=Math.min(d.x0,d.x1),x1=Math.max(d.x0,d.x1),y0=Math.min(d.y0,d.y1),y1=Math.max(d.y0,d.y1);picked=G.units.filter(u=>u.x>=x0-u.r&&u.x<=x1+u.r&&u.y>=y0-u.r&&u.y<=y1+u.r);}
  else{const u=unitAt(d.x0,d.y0);if(u){const now=performance.now();picked=now-lastClick.t<320&&lastClick.k===u.k?G.units.filter(o=>o.k===u.k):[u];lastClick={t:now,k:u.k};}
    else if(!d.shift){const e=enemyAt(d.x0,d.y0);if(e){G.inspect=e;G.sel=[];G.units.forEach(o=>o.sel=false);Snd.play('click');refreshPane(true);refreshCmd();return;}
      if(typeof mapClick==='function')mapClick(d.x0,d.y0);}}
  if(picked.length||!d.shift)G.inspect=null;
  if(d.shift){for(const u of picked){if(G.sel.includes(u)&&!d.box)G.sel=G.sel.filter(o=>o!==u);else if(!G.sel.includes(u))G.sel.push(u);}}else G.sel=picked;
  G.units.forEach(u=>u.sel=G.sel.includes(u));if(picked.length)Snd.play(selSound(picked[0]));refreshPane(true);refreshCmd();
});
$('#pActions').addEventListener('click',e=>{if(e.target.closest('[data-slots]')){Snd.play('click');toggleSlots(true);}});
$('#btnSlots').addEventListener('click',()=>{Snd.init();toggleSlots();});
cv.addEventListener('pointerleave',()=>{hover=null;if(tipFor===cv)hideTip();});
cv.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',ev=>{
  if(!G)return;if(ev.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName))return;const k=ev.key.toLowerCase();
  if($('#overlay').classList.contains('show')&&!G.paused)return;
  Snd.init();
  if(k===' '){ev.preventDefault();if(G.mp)toast('No pausing at a shared table');else togglePause();return;}
  if(k==='/'&&G.mp){ev.preventDefault();if(!SET.log){SET.log=true;saveSet();applySet();}$('#chatIn').focus();return;}
  if(k==='l'&&!ev.ctrlKey&&!ev.metaKey){toggleLog();return;}
  if(k==='j'&&!ev.ctrlKey&&!ev.metaKey){toggleSlots();return;}
  if(k==='escape'&&$('#slotPanel')){toggleSlots(false);return;}
  if(G.mp&&k==='t'&&!ev.ctrlKey&&!ev.metaKey){toggleEmotes();return;}
  if(G.mp&&$('#emotes').classList.contains('show')&&/^[1-6]$/.test(k)){sendEmote(+k-1);toggleEmotes(false);return;}
  if(G.paused||G.over)return;
  if(/^[1-9]$/.test(k)){const n=+k;if(ev.ctrlKey||ev.metaKey){ev.preventDefault();G.groups[n]=G.sel.slice();toast('Group '+n+' saved');}else if(G.groups[n]){G.sel=G.groups[n].filter(u=>!u.dead);G.units.forEach(u=>u.sel=G.sel.includes(u));refreshPane(true);}return;}
  if(ev.ctrlKey||ev.metaKey)return;
  const hs=humanSeat(),myTurn=HD&&(HD.phase==='bet1'||HD.phase==='bet2')&&hs&&HD.actor===HD.seats.indexOf(hs);
  if(k==='enter'){if(HD&&HD.phase==='tip'&&hs)uiDeal();else if(HD&&HD.phase==='draw')uiConfirmDraw();else if(myTurn)uiAct('call');refreshTable(true);return;}
  if(myTurn&&(k==='c'||k==='x'||k==='r')){uiAct(k==='c'?'call':k==='x'?'fold':'raise');refreshTable(true);return;}
  const ai={e:0,d:1,g:2}[k];if(ai!=null&&G.sel.length){useAbilitySlot(ai);return;}
  const map={a:'amove',s:'stop',h:'hold',m:'merge',q:'all',v:'rope'};
  if(map[k])cmd(map[k]);else if(k==='escape'){if(NET.watch)closeWatch();else if(G.inspect){G.inspect=null;refreshPane(true);}else if(G.mode)setMode(null);else{G.sel=[];G.units.forEach(u=>u.sel=false);refreshPane(true);refreshCmd();}}
  else if(k==='f'){if(!G.mp)setSpeed(G.speed%3+1);}else if(k==='p')toggleRoute();
});
function setSpeed(s){G.speed=s;$('#btnSpeed span').textContent=s+'×';}
function toggleRoute(){if(!G)return;G.showRoute=!G.showRoute;$('#btnRoute').classList.toggle('lit',G.showRoute);}
$('#btnSpeed').addEventListener('click',()=>{if(G)setSpeed(G.speed%3+1);});
$('#btnRoute').addEventListener('click',toggleRoute);
$('#btnPause').addEventListener('click',()=>togglePause());
$('#btnMute').addEventListener('click',()=>{Snd.init();Snd.muted=!Snd.muted;if(Snd.master)Snd.master.gain.setTargetAtTime(Snd.muted?0:.2*SET.sfx,Snd.ctx.currentTime,.05);$('#btnMute').innerHTML=icon(Snd.muted?'mute':'sound');});
$('#btnMusic').addEventListener('click',()=>{Snd.init();Music.setOn(!Music.on);$('#btnMusic').classList.toggle('lit',Music.on);});
$('#btnHelp').addEventListener('click',()=>{if(G&&G.mp&&G.running){showHow(()=>hideOverlay());return;}if(G&&!G.over&&!G.paused)togglePause(true);showHow(()=>showPause());});
function togglePause(force){if(!G||G.over)return;G.paused=force!=null?force:!G.paused;$('#btnPause').innerHTML=icon(G.paused?'play':'pause');if(G.paused)showPause();else hideOverlay();}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G&&!G.mp&&G.running&&!G.paused&&!G.over)togglePause(true);});
function fit(){const wrap=$('#boardWrap');const aw=wrap.clientWidth-16,ah=wrap.clientHeight-12;const s=Math.max(.3,Math.min(aw/W,ah/H));cv.style.width=W*s+'px';cv.style.height=H*s+'px';}
window.addEventListener('resize',fit);

/* ---------- overlays ---------- */
let menuDiff='standard';
function buildLabel(){const B=window.ALLIN_BUILD||{};return 'Build '+(B.sha||'dev')+(B.date?' · '+B.date:'');}
function showBuildTag(on){let el=document.getElementById('buildTag');if(!el){el=document.createElement('div');el.id='buildTag';el.className='buildtag';el.title='Mention this when you report a bug';document.body.appendChild(el);}el.textContent=buildLabel();el.style.display=on?'':'none';}
function showOverlay(h,cls){hideTip();if(typeof OPEN!=='undefined'&&OPEN.browse&&NET.view!=='multi')openBrowse(false);if(cls!=='menu title')showBuildTag(false);$('#overlay').classList.toggle('title',cls==='menu title');$('#modal').className='modal '+(cls||'');$('#modal').innerHTML=h;$('#overlay').classList.add('show');}
function titleBulbs(){const b=document.querySelector('.ttl .sign .bulbs');if(!b)return;const nx=40,ny=14,pts=[];
  for(let i=0;i<nx;i++)pts.push([i/nx,0]);for(let i=0;i<ny;i++)pts.push([1,i/ny]);for(let i=0;i<nx;i++)pts.push([1-i/nx,1]);for(let i=0;i<ny;i++)pts.push([0,1-i/ny]);
  b.innerHTML=pts.map(([x,y],i)=>`<i class="${i%2?'b':''}" style="left:calc(9px + (100% - 18px)*${x.toFixed(4)});top:calc(9px + (100% - 18px)*${y.toFixed(4)})"></i>`).join('');}
function hideOverlay(){showBuildTag(false);$('#overlay').classList.remove('show');}
function bestOf(k){try{return localStorage.getItem('allin-best-'+k)||'';}catch(e){return '';}}
function saveBest(){try{const k='allin-best-'+G.diffKey,prev=localStorage.getItem(k)||'';const cur=G.won?'Won':'Round '+G.wave;if(!prev||cur==='Won'||(prev!=='Won'&&G.wave>parseInt(prev.replace(/\D/g,'')||0)))localStorage.setItem(k,cur);}catch(e){}}
function showMenu(){
  if(NET.on)netLeave();document.body.classList.remove('mp','spectate');if(G&&G.mp){newGame(menuDiff);resetGameUI();}
  if(G)G.running=false;
  // poker chips drawn as short cylinders: a side band with edge spots for each chip, and the top face on the last one
  const shadeHex=(h,f)=>{const n=parseInt(h.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;const m=f<0?1+f:1;const a=f>0?f:0;r=r*m+(255-r)*a;g=g*m+(255-g)*a;b=b*m+(255-b)*a;return `rgb(${r|0},${g|0},${b|0})`;};
  const chipSVG=(stacks,W,H)=>{const RX=26,RY=9,T=8;let out='';
    for(const st of stacks){const [x0,cols,n,lean]=st;let tops=[];
      for(let k=0;k<n;k++){const c=cols[k%cols.length],jx=x0+((k*37)%5-2)*(k?1:0),cy=H-RY-2-k*T,spot=c==='#f5f0e6'||c==='#f8f5ec'?'#c3122f':'#fff';
        out+=`<path d="M${jx-RX} ${cy-T}v${T}a${RX} ${RY} 0 0 0 ${RX*2} 0v${-T}" fill="${shadeHex(c,-.28)}" stroke="#0b0612" stroke-width="1.6"/>`;
        for(let q=0;q<5;q++){const a=Math.PI*(.12+q*.19),sx=jx-Math.cos(a)*RX*.94,w=Math.max(2,Math.sin(a)*8.5);out+=`<rect x="${(sx-w/2).toFixed(1)}" y="${(cy-T+Math.sin(a)*RY*.9+1).toFixed(1)}" width="${w.toFixed(1)}" height="${T-2}" fill="${spot}" opacity=".92"/>`;}
        tops=[jx,cy-T,c,spot];}
      const [tx,ty,c,spot]=tops;
      out+=`<ellipse cx="${tx}" cy="${ty}" rx="${RX}" ry="${RY}" fill="${c}" stroke="#0b0612" stroke-width="1.6"/><ellipse cx="${tx}" cy="${ty}" rx="${RX-3}" ry="${RY-1.2}" fill="none" stroke="${spot}" stroke-width="3.2" stroke-dasharray="6 6.5" opacity=".95"/>`
        +`<ellipse cx="${tx}" cy="${ty}" rx="${RX*.56}" ry="${RY*.56}" fill="${shadeHex(c,.18)}" stroke="${shadeHex(c,-.35)}" stroke-width="1"/><ellipse cx="${tx-4}" cy="${ty-2}" rx="${RX*.22}" ry="${RY*.18}" fill="#fff" opacity=".35"/>`;}
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${out}</svg>`;};
  const chipStack=(side)=>side==='l'?`<div class="stk l">${chipSVG([[30,['#ff3d9a','#f5f0e6','#22e1ff'],7],[76,['#22e1ff','#f5f0e6'],4]],106,96)}</div>`
    :`<div class="stk r">${chipSVG([[30,['#1d1d28','#e0b040'],5],[74,['#e0b040','#ff3d9a','#1d1d28'],3]],104,96)}</div>`;
  showOverlay(`<div class="ttl"><div class="fan">${[10,11,12,13,14].map((v,i)=>cardHTML({v,s:'S'},i,'').replace('class="card','style="--a:'+((i-2)*15)+'deg;--d:'+(i*.09)+'s" class="card')).join('')}</div>
   <div class="sign"><div class="bulbs"></div><div class="logo big">ALL IN</div><div class="tagl">Poker · Defense</div>${chipStack('l')}${chipStack('r')}</div></div>
   <div class="diffs">${Object.entries(DIFFS).map(([k,d])=>`<button class="diff ${k===menuDiff?'on':''}" data-d="${k}"><b>${d.name}</b><span>${d.desc}</span>${bestOf(k)?`<em>${bestOf(k)}</em>`:''}</button>`).join('')}</div>
   ${(()=>{const d=savedRun();return d?`<div class="mrow" style="margin-top:-8px"><button class="pb main" id="mCont">Continue · ${DIFFS[d.dk].name}, round ${d.wave+1}</button></div>`:'';})()}
   <div class="mrow"><button class="pb" id="mHow">How to play</button><button class="pb" id="mCol">${icon('army')} Collection</button><button class="pb" id="mSet">${icon('settings')} Settings</button><button class="pb" id="mMulti">${icon('users')} Play with friends</button><button class="pb main" id="mStart">Deal me in</button></div>`,'menu title');titleBulbs();showBuildTag(true);
  $('#mMulti').addEventListener('click',()=>{Snd.init();showMulti('');});$('#mSet').addEventListener('click',()=>showSettings(showMenu));
  document.querySelectorAll('.diff').forEach(b=>b.addEventListener('click',()=>{menuDiff=b.dataset.d;Snd.init();Snd.play('click');document.querySelectorAll('.diff').forEach(x=>x.classList.toggle('on',x===b));}));
  $('#mHow').addEventListener('click',()=>showHow(showMenu));$('#mCol').addEventListener('click',()=>{Snd.init();showCollection(showMenu);});{const c=$('#mCont');if(c)c.addEventListener('click',()=>{Snd.init();resumeRun();});}$('#mStart').addEventListener('click',()=>{Snd.init();startGame(menuDiff);});
}
function showHow(back){
  const bestiary=Object.entries(UNITS).filter(([k,u])=>!u.merge).map(([k,u])=>`<div class="bx" data-tip="${u.name}|${u.desc}"><canvas data-k="${k}"></canvas><div><b>${u.name}</b><small>${HANDS[u.hand]}${u.hand<9?(u.hi?', high':', low'):''}</small></div></div>`).join('');
  const chains=[['hc_lo','m_trooper','m_colossus','m_jugg'],['p_lo','m_dtroop','m_dmech','m_fortress'],['hc_hi','m_cerb','m_chimera']].map(ch=>`<div class="chain">${ch.map((k,i)=>`${i?icon('next'):''}<span data-tip="${UNITS[k].name}|${UNITS[k].desc}"><canvas data-k="${k}"></canvas><b>${i?'2× ':''}${UNITS[k].name}</b></span>`).join('')}</div>`).join('');
  const merges=MERGES.filter(([a,b,o])=>!['m_trooper','m_colossus','m_jugg','m_dtroop','m_dmech','m_fortress','m_cerb','m_chimera'].includes(o)).map(([a,b,o])=>`<div class="mx" data-tip="${UNITS[o].name}|${UNITS[o].desc}"><canvas data-k="${a}"></canvas><span>+</span><canvas data-k="${b}"></canvas>${icon('next')}<canvas data-k="${o}"></canvas><b>${UNITS[o].name}</b></div>`).join('');
  showOverlay(`<h2>How to play</h2>
   <div class="howto">
    <div><b>Ante and tip</b>Each hand costs 20 chips. A tip before the deal gets you the best of several hands, and your swap is drawn best of several too. The biggest tipper is the dealer's favourite and may swap one extra card. Rivals' tips water yours down.</div>
    <div><b>Bet, swap, bet</b>Five-card draw with fixed limits: 10 before the swap, 20 after, three raises at most. You may swap up to 3 cards once.</div>
    <div><b>Summon</b>Your final hand summons a creature, folded or not. Jacks or better make the high version; for a flush it takes an ace.</div>
    <div><b>Command</b>Drag to select. Right-click to move or attack. Velvet ropes reroute the bad luck. A few elite creatures, like the tanks, have an ability on E.</div>
    <div><b>Merge</b>The right pairs fuse into something new. Chip Mites and Dice Sprites can merge three times over. Select both and press M.</div>
    <div><b>Outlast</b>Rival casinos face the same waves. The last casino standing wins. So does surviving round 40.</div>
   </div>
   <h3>Hand creatures</h3><div class="bestiary">${bestiary}</div>
   <h3>Bad cards add up</h3><p class="lead">The weakest creatures merge again and again. Two of a kind make the next step up.</p><div class="chains">${chains}</div>
   <h3>Other merges</h3><div class="mergelist">${merges}</div>
   <div class="mrow"><button class="pb main" id="mBack">Back</button></div>`,'how');
  document.querySelectorAll('.bx canvas').forEach(c=>portrait(c,c.dataset.k,40));document.querySelectorAll('.chain canvas').forEach(c=>portrait(c,c.dataset.k,46));document.querySelectorAll('.mx canvas').forEach(c=>portrait(c,c.dataset.k,26));document.querySelectorAll('.sigs canvas').forEach(c=>portrait(c,c.dataset.k,40));
  $('#mBack').addEventListener('click',()=>{Snd.init();back();});
}
function showPause(){showOverlay(`<h2>Paused</h2><div class="mrow"><button class="pb main" id="pRes">Resume</button><button class="pb" id="pHow">How to play</button><button class="pb" id="pSet">Settings</button><button class="pb" id="pRestart">Restart</button><button class="pb fold" id="pQuit">Leave table</button></div>`,'small');showBuildTag(true);
  $('#pRes').addEventListener('click',()=>togglePause(false));$('#pSet').addEventListener('click',()=>showSettings(showPause));$('#pHow').addEventListener('click',()=>showHow(showPause));
  $('#pRestart').addEventListener('click',()=>startGame(G.diffKey));$('#pQuit').addEventListener('click',()=>{G.paused=false;showMenu();});}
function mvpHTML(){const all=G.units.concat(G.ko.map(k=>k.u));if(!all.length)return '';const m=all.reduce((a,b)=>b.kills>a.kills?b:a);if(!m.kills)return '';
  return `<div class="mvp"><canvas data-k="${m.k}"></canvas><div><small>Most valuable creature</small><b>${m.def.name}</b><span>${m.kills} kills${m.rank?', '+RANK_NAME[m.rank]:''}</span></div></div>`;}
function showEnd(won,why){
  recordRun(won);
  if(!G.mp)saveBest();const s=G.stats,mins=Math.floor(G.time/60),secs=Math.floor(G.time%60);
  const got=Object.entries(s.got).sort((a,b)=>UNITS[b[0]].hand-UNITS[a[0]].hand).map(([k,n])=>`<span data-tip="${UNITS[k].name}"><canvas data-k="${k}"></canvas>${n}</span>`).join('');
  const ord=['','1st','2nd','3rd','4th','5th','6th'][G.place];
  showOverlay(`<div class="logo ${won?'':'dead'}">${won?'HOUSE WINS':'BUSTED'}</div>
   <p class="endline">${won?(why==='survived'?'You survived all 40 rounds.':G.mp?'Every other casino fell before yours.':'Every rival casino fell before yours.'):G.base.hp>0?`The table closed on round ${G.wave}. You finished ${ord} of ${G.players.length}.`:`Your casino fell on round ${G.wave}. You finished ${ord} of ${G.players.length}.`}</p>
   <div class="statsgrid"><div><small>Place</small><b>${ord}</b></div><div><small>Round</small><b>${G.wave}</b></div><div><small>Bad luck busted</small><b>${fmt(s.kills)}</b></div><div><small>Best hand</small><b class="sm">${s.best>=0?HANDS[s.best]:'None'}</b></div><div><small>Clean rounds</small><b>${s.clean||0}</b></div><div><small>Time</small><b>${mins}:${String(secs).padStart(2,'0')}</b></div></div>
   ${G.mp&&typeof tableAwardsHTML==='function'?tableAwardsHTML():''}${hpGraphHTML()}${mvpHTML()}<div class="got">${got}</div>
   <div class="mrow">${G.mp?mpEndButtons():`${won&&why==='last'&&G.wave<MAX_WAVE?'<button class="pb" id="eOn">Play on to round 40</button>':''}<button class="pb main" id="eAgain">Deal again</button><button class="pb" id="eMenu">Main menu</button>`}</div>${G.mp?`<p class="mpnote" id="eNote">${mpEndNote()}</p>`:''}`,'end');
  if(G.mp){wireMpEnd();return;}
  document.querySelectorAll('.got canvas').forEach(c=>portrait(c,c.dataset.k,34));document.querySelectorAll('.mvp canvas').forEach(c=>portrait(c,c.dataset.k,64));
  const on=$('#eOn');if(on)on.addEventListener('click',()=>{G.over=false;G.freeplay=true;hideOverlay();});
  $('#eAgain').addEventListener('click',()=>startGame(G.diffKey));$('#eMenu').addEventListener('click',showMenu);
}
function startGame(dk){if(NET.on)netLeave();clearRun();newGame(dk);resetGameUI();hideOverlay();}
function resetGameUI(){nextSig='';LOG.length=0;chipDisp=null;dmSig='';$('#logList').innerHTML='';renderLog();chipMem.clear();dealMemN=-1;seatsBuilt=false;traySig='';cardSig='';paneSig='';buildCmd();setSpeed(1);$('#btnPause').innerHTML=icon('pause');
  document.body.classList.toggle('mp',!!G.mp);$('#rRoom').innerHTML=G.mp?icon('users')+`<b>${esc(NET.code)}</b>`:'';$('#rRoom').dataset.tip=G.mp?'Room '+NET.code+'|Click to copy the invite link':'';
  G.showRoute=true;$('#btnRoute').classList.add('lit');refreshTable(true);refreshPane(true);refreshCmd();syncTop();}
/* ---------- multiplayer screens ---------- */
function savedName(){try{return localStorage.getItem('allin-name')||'';}catch(e){return '';}}
function saveName(n){try{localStorage.setItem('allin-name',n);}catch(e){}}
function newCode(){let c='';for(let i=0;i<4;i++)c+=CODE_ABC[(Math.random()*CODE_ABC.length)|0];return c;}
function showMulti(code){
  if(G&&!G.mp)G.running=false;NET.view='multi';
  showOverlay(`<h2>Play with friends</h2>
   <div class="fld"><label for="mpName">Your name at the table</label><input id="mpName" maxlength="14" autocomplete="off" value="${esc(savedName())}" placeholder="Name"></div>
   <div class="mpbox">
    <div class="card2"><h4>Start a room</h4><p>Get a code and an invite link. Up to 6 players, with house rivals in any empty seats.</p><button class="pb main" id="mpCreate">Create room</button></div>
    <div class="card2"><h4>Join a room</h4><p>Type the code a friend sent you.</p><input class="codein" id="mpCode" maxlength="6" autocomplete="off" value="${esc(code||'')}" placeholder="CODE"><button class="pb" id="mpJoin">Join room</button></div>
   </div>
   <div class="mperr" id="mpErr"></div>
   <div class="otwrap"><h4>Open tables</h4><div id="openTables"><p class="mpnote">Looking for open tables…</p></div></div>
   <p class="mpnote">Everyone defends their own casino against the same waves and plays at one shared poker table. ${window.claude&&window.claude.use?'Friends need to be signed in to Claude and able to open this game.':'Share the room code or the invite link: friends just open it in their browser, no sign-up needed.'}</p>
   <div class="mrow"><button class="pb" id="mpBack">Back</button></div>`,'menu');
  if(typeof openBrowse==='function')openBrowse(true);
  const go=async c=>{const err=$('#mpErr'),nm=cleanName($('#mpName').value);if(!nm){err.textContent='Pick a name first.';$('#mpName').focus();return;}
    if(!/^[A-Z0-9]{4,6}$/.test(c)){err.textContent='Room codes are 4 letters or numbers.';$('#mpCode').focus();return;}
    saveName(nm);Snd.init();err.style.color='var(--muted)';err.textContent='Connecting to the room…';document.querySelectorAll('#modal button').forEach(b=>b.disabled=true);
    const api=await netApi();
    if(!api){err.style.color='';err.textContent="Multiplayer can't connect from here. Open the game on claude.ai while signed in.";document.querySelectorAll('#modal button').forEach(b=>b.disabled=false);return;}
    try{await netJoin(c,nm);showLobby();}catch(e){err.style.color='';err.textContent="Couldn't open that room. Try again in a moment.";document.querySelectorAll('#modal button').forEach(b=>b.disabled=false);}};
  $('#mpCreate').addEventListener('click',()=>go(newCode()));
  $('#mpJoin').addEventListener('click',()=>go(($('#mpCode').value||'').toUpperCase().trim()));
  $('#mpCode').addEventListener('keydown',e=>{if(e.key==='Enter')go(($('#mpCode').value||'').toUpperCase().trim());});
  $('#mpBack').addEventListener('click',()=>{try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}showMenu();});
  if(code&&savedName())go(code);else if(code)$('#mpName').focus();
}
let lobbySig='';
function showLobby(){NET.view='lobby';lobbySig='';showOverlay('<div id="lobby"></div><div class="lbchat"><div id="lbChat"></div><form id="lbChatF" autocomplete="off"><input id="lbChatIn" maxlength="120" placeholder="Say hi to the room…"></form></div>','menu lobbym');renderLobby();renderLobbyChat();
  $('#lbChatF').addEventListener('submit',e=>{e.preventDefault();const i=$('#lbChatIn');if(sendChat(i.value))i.value='';});}
function renderLobbyChat(){const el=$('#lbChat');if(!el)return;const msgs=LOG.filter(l=>l.who).slice(0,30).reverse();el.innerHTML='';
  for(const l of msgs){const d=document.createElement('div');const b=document.createElement('b');b.textContent=l.who.name+': ';b.style.color=l.who.col;d.appendChild(b);d.appendChild(document.createTextNode(l.msg));el.appendChild(d);}
  if(!msgs.length){el.innerHTML='<div class="sys">Chat with the room while you wait.</div>';}el.scrollTop=el.scrollHeight;}
const inviteLink=()=>(NET.online?location.origin+location.pathname:ART_URL)+'#join-'+NET.code.toLowerCase();
function copyInvite(){const link=inviteLink();
  const ok=()=>{toast('Invite link copied');Snd.play('coin');},fail=()=>{const i=$('#inviteTxt');if(i){i.focus();i.select();}toast('Press Ctrl+C to copy the link');};
  try{navigator.clipboard.writeText(link).then(ok,fail);}catch(e){fail();}}
function renderLobby(){
  const el=$('#lobby');if(!el||!NET.on)return;
  const S=NET.host?hostState():NET.S,ppl=lobbyPeople(),hostId=computeHost(),hostP=ppl.find(p=>idOf(p)===hostId);
  const running=S&&S.st!=='lobby'&&!(S.R||[]).some(e=>e.id===PID);
  const ai=S?S.ai!==false:true,diff=S&&S.d||NET.diff;
  const seats=ppl.slice(0,MAX_SEATS).map((p,i)=>{const n=cleanName(p.presence.n)||'Player';return `<div><i style="--c:${HUMAN_COLS[i%6]}">${esc((n[0]||'?').toUpperCase())}</i><b>${esc(n)}</b><small>${[idOf(p)===hostId?'host':'',p.isMe&&p.sameTab?'you':''].filter(Boolean).join(' · ')}</small></div>`;});
  for(let i=seats.length;i<MAX_SEATS;i++)seats.push(ai?`<div class="ai"><i style="--c:#6b6380">${icon('casino')}</i><b>House rival</b></div>`:'<div class="empty">Open seat</div>');
  const extra=ppl.length>MAX_SEATS?`<p class="mpnote">${ppl.length-MAX_SEATS} more waiting for a seat.</p>`:'';
  let ctl;
  if(!NET.settled)ctl='<p class="mpnote">Finding the table…</p>';
  else if(running)ctl='<p class="mpnote">A game is already running in this room. You\'ll be dealt into the next one.</p><div class="mrow" style="margin-top:8px"><button class="pb main" id="lbWatch">Watch this game</button></div>';
  else if(NET.host)ctl=`<div class="hostset"><div class="seg">${Object.entries(DIFFS).map(([k,d])=>`<button data-d="${k}" class="${k===diff?'on':''}" data-tip="${d.name}|${d.desc}">${d.name}</button>`).join('')}</div>
      <label class="tog"><input type="checkbox" id="lbAi" ${ai?'checked':''}>House rivals in empty seats</label><label class="tog" data-tip="Open tables|Anyone browsing Play with friends can see this room and join it."><input type="checkbox" id="lbPub" ${NET.pub?'checked':''}>List this room on Open tables</label></div>`;
  else ctl=`<p class="mpnote">Waiting for ${esc(hostP?cleanName(hostP.presence.n):'the host')} to deal you in · ${esc(DIFFS[diff].name)}${ai?' · house rivals on':''}</p>`;
  const html=`<h2>Room</h2><div class="roomcode">${esc(NET.code)}</div>
    <div class="invite"><input id="inviteTxt" readonly value="${esc(inviteLink())}"><button class="pb" id="lbCopy">${icon('link')} Copy invite link</button></div>
    <div class="plist">${seats.join('')}</div>${extra}${ctl}
    <div class="mrow"><button class="pb" id="lbLeave">${icon('log-out')} Leave</button>${NET.host&&!running?`<button class="pb main" id="lbStart" ${NET.settled?'':'disabled'}>Deal everyone in</button>`:''}</div>`;
  if(html===lobbySig)return;lobbySig=html;el.innerHTML=html;
  {const w=$('#lbWatch');if(w)w.addEventListener('click',()=>{NET.specOk=true;Snd.play('click');netApply(NET.S);});}
  $('#lbCopy').addEventListener('click',copyInvite);
  $('#lbLeave').addEventListener('click',()=>{netLeave();showMenu();});
  el.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{NET.diff=b.dataset.d;Snd.play('click');hostPublish(true);renderLobby();}));
  const t=$('#lbAi');if(t)t.addEventListener('change',()=>{NET.ai=t.checked;hostPublish(true);renderLobby();});
  const pb=$('#lbPub');if(pb)pb.addEventListener('change',()=>{NET.pub=pb.checked;Snd.play('click');openSync();});
  if(typeof openSync==='function')openSync();
  const st=$('#lbStart');if(st)st.addEventListener('click',()=>{Snd.init();Snd.play('deal');hostCreateGame();});
}
function mpOver(){const S=NET.host?hostState():NET.S;return !!(S&&S.st==='over');}
function mpEndButtons(){
  const over=mpOver();let b='';
  if(!over){b+='<button class="pb main" id="eWatch">Watch the table</button>';for(const p of G.players)if(p.alive&&!p.human&&(p.remote||p.person&&!p.left))b+=`<button class="pb" data-watch="${p.gi}">Watch ${esc(p.short)}</button>`;}
  if(over){b+=`<button class="pb main" id="eRematch">Rematch</button>`;if(NET.host)b+='<button class="pb" id="eNew">Change settings</button>';}
  b+=`<button class="pb" id="eLeave">${icon('log-out')} Leave room</button>`;return b;}
function mpEndNote(){return mpOver()?`<span id="eRm"></span>`:'Your seat stays in the room. The game ends when one casino is left.';}
function wireMpEnd(){
  document.querySelectorAll('.got canvas').forEach(c=>portrait(c,c.dataset.k,34));document.querySelectorAll('.mvp canvas').forEach(c=>portrait(c,c.dataset.k,64));
  const w=$('#eWatch');if(w)w.addEventListener('click',hideOverlay);
  document.querySelectorAll('[data-watch]').forEach(b=>b.addEventListener('click',()=>{hideOverlay();openWatch(+b.dataset.watch,true);}));
  const n=$('#eNew');if(n)n.addEventListener('click',()=>{Snd.play('click');hostToLobby();});
  const rmb=$('#eRematch');if(rmb){rmb.addEventListener('click',()=>{Snd.play('click');if(NET.host)hostRematch();else setRematch(NET.rm!==G.mp.gid);});updateRematchUI();}
  $('#eLeave').addEventListener('click',()=>{netLeave();showMenu();});
}
function toggleEmotes(force){const el=$('#emotes'),on=force!=null?force:!el.classList.contains('show');
  if(on){el.innerHTML=EMOTES.map((t,i)=>`<button data-e="${i}"><kbd>${i+1}</kbd>${esc(t)}</button>`).join('');const r=$('#btnEmote').getBoundingClientRect();el.style.top=(r.bottom+6)+'px';el.style.left=Math.max(8,r.right-260)+'px';}
  el.classList.toggle('show',on);}
$('#emotes').addEventListener('click',e=>{const b=e.target.closest('button');if(b){sendEmote(+b.dataset.e);toggleEmotes(false);}});
$('#btnEmote').addEventListener('click',e=>{e.stopPropagation();toggleEmotes();});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#emotes')&&!e.target.closest('#btnEmote'))toggleEmotes(false);});
$('#rRoom').addEventListener('click',()=>{if(!G||!G.mp)return;showOverlay(`<h2>Room ${esc(NET.code)}</h2>
   <div class="invite"><input id="inviteTxt" readonly value="${esc(inviteLink())}"><button class="pb" id="lbCopy">${icon('link')} Copy invite link</button></div>
   <p class="mpnote">The game keeps running while this is open.</p>
   <div class="mrow"><button class="pb main" id="rmBack">Back to the table</button><button class="pb fold" id="rmLeave">${icon('log-out')} Leave room</button></div>`,'small');
  $('#lbCopy').addEventListener('click',copyInvite);$('#rmBack').addEventListener('click',hideOverlay);$('#rmLeave').addEventListener('click',()=>{netLeave();showMenu();});});

/* watching a friend */
const pkCv=$('#pkCv'),pkCtx=pkCv.getContext('2d');let pkScale=0;
function sizePeek(){const bw=cv.getBoundingClientRect().width||900,w=Math.round(Math.max(260,Math.min(440,bw*.36))),h=Math.round(w*H/W);
  pkCv.style.width=w+'px';pkCv.style.height=h+'px';pkCv.width=Math.round(w*DPR);pkCv.height=Math.round(h*DPR);pkScale=w/W;
  const cr=cv.getBoundingClientRect(),wr=$('#boardWrap').getBoundingClientRect(),pk=$('#peek');pk.style.left=Math.round(cr.left-wr.left+10)+'px';pk.style.top=Math.round(cr.top-wr.top+10)+'px';pk.style.right='auto';}
function syncWatchUI(){const Wt=NET.watch,full=!!(Wt&&Wt.full);hideTip();
  $('#peek').classList.toggle('show',!!Wt&&!full);$('#watchBar').classList.toggle('show',full);document.body.classList.toggle('watchfull',full);
  if(Wt){$('#pkName').textContent=Wt.name;$('#wbName').textContent='Watching '+Wt.name;if(!full)sizePeek();}
  $('#wbBack').textContent=G&&G.spectate?'Stop watching':'Back to my casino';
  if(G&&G.mp)refreshTable(true);}
$('#pkBig').innerHTML=icon('all');$('#pkX').innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
$('#pkBig').addEventListener('click',()=>setWatchFull(true));pkCv.addEventListener('click',()=>setWatchFull(true));$('#pkX').addEventListener('click',closeWatch);
$('#wbBack').addEventListener('click',closeWatch);$('#wbSmall').addEventListener('click',()=>setWatchFull(false));
$('#seats').addEventListener('click',e=>{const el=e.target.closest('.seat');if(!el||!G||!G.mp)return;const p=G.players[+el.dataset.i];if(!p)return;
  if(NET.watch&&NET.watch.gi===p.gi){closeWatch();return;}openWatch(p.gi,G.over);});
window.addEventListener('resize',()=>{if(NET.watch&&!NET.watch.full)sizePeek();});

/* ---------- settings ---------- */
function showSettings(back){
  showOverlay(`<h2>Settings</h2><div class="setgrid">
    <label for="sMus">Music volume</label><input type="range" id="sMus" min="0" max="1" step=".05" value="${SET.music}">
    <label for="sSfx">Effects volume</label><input type="range" id="sSfx" min="0" max="1" step=".05" value="${SET.sfx}">
    <label for="sShake">Screen shake<small>Big hits and stomps jolt the board</small></label><input type="checkbox" id="sShake" ${SET.shake?'checked':''}>
    <label for="sBars">Always show health bars<small>Otherwise only when damaged or selected</small></label><input type="checkbox" id="sBars" ${SET.bars?'checked':''}>
    <label for="sLog">Show the table log<small>Toggle any time with L</small></label><input type="checkbox" id="sLog" ${SET.log?'checked':''}>
    <label>Tips<small>Show the first-time hints again</small></label><button class="pb" id="sTips">Reset tips</button>
   </div><div class="mrow"><button class="pb main" id="sBack">Done</button></div>`,'small');showBuildTag(true);
  const upd=()=>{SET.music=+$('#sMus').value;SET.sfx=+$('#sSfx').value;SET.shake=$('#sShake').checked;SET.bars=$('#sBars').checked;SET.log=$('#sLog').checked;saveSet();applySet();};
  ['sMus','sSfx','sShake','sBars','sLog'].forEach(id=>$('#'+id).addEventListener('input',upd));
  $('#sSfx').addEventListener('change',()=>{Snd.init();Snd.play('coin');});
  $('#sTips').addEventListener('click',()=>{for(const k in SEEN)delete SEEN[k];try{Object.keys(localStorage).filter(k=>k.startsWith('allin-seen-')).forEach(k=>localStorage.removeItem(k));}catch(e){}if(typeof coachReset==='function')coachReset();toast('Tips will show again');});
  $('#sBack').addEventListener('click',()=>{if(back)back();else hideOverlay();});
}
$('#btnSet').addEventListener('click',()=>{if(G&&!G.mp&&G.running&&!G.over&&!G.paused){togglePause(true);showSettings(showPause);}else showSettings(G&&G.running&&!$('#overlay').classList.contains('show')?null:null);});
$('#btnLog').addEventListener('click',()=>{if(!SET.log){SET.log=true;saveSet();applySet();}toggleLog();});
$('#logMore').addEventListener('click',()=>toggleLog());
function applySet(){if(Snd.master&&!Snd.muted)Snd.master.gain.setTargetAtTime(.2*SET.sfx,Snd.ctx.currentTime,.05);if(Music.bus&&Music.on)Music.bus.gain.setTargetAtTime(.55*SET.music,Snd.ctx.currentTime,.1);
  $('#logPanel').classList.toggle('off',!SET.log);$('#btnLog').classList.toggle('lit',SET.log);}

/* ---------- round summary ---------- */
function roundSummary(r){const el=$('#roundCard');const bad=r.hpLost>=1;
  el.className=bad?'bad':'';el.innerHTML=`<div><h4>Round ${r.w} ${bad?'survived':'cleared'}</h4></div><div class="rs"><span>${fmt(Math.round(r.dmg))}<small>DAMAGE</small></span><span>${r.kills}<small>BUSTED</small></span><span>${r.leaks}<small>LEAKS</small></span>${bad?`<span style="color:#ff8fa3">−${Math.round(r.hpLost)}<small>CASINO</small></span>`:''}<span style="color:#ffd27a">+${fmt(r.earned)}<small>CHIPS</small></span></div>`+
    (r.mvp?`<div class="mv"><canvas></canvas><div><b>${UNITS[r.mvp.k].name}</b><small>MVP · ${fmt(Math.round(r.mvp.dmg))} dmg</small></div></div>`:'');
  if(r.mvp)portrait(el.querySelector('canvas'),r.mvp.k,34);
  el.classList.add('show');clearTimeout(roundSummary._t);roundSummary._t=setTimeout(()=>el.classList.remove('show'),4800);
  gameLog(`Round ${r.w}: ${fmt(Math.round(r.dmg))} damage, ${r.kills} busted, ${r.leaks} leaks, +${fmt(r.earned)} chips${r.mvp?', MVP '+UNITS[r.mvp.k].name:''}.`,bad?'':'good');}

/* ---------- damage meter ---------- */
let dmSig='';
function updateDmeter(el){const all=G.units.concat(G.ko.map(k=>k.u)).filter(u=>u.dmgDone>0).sort((a,b)=>b.dmgDone-a.dmgDone).slice(0,4);
  if(!all.length){if(dmSig!=='none'){dmSig='none';el.innerHTML='';}return;}
  const sig=all.map(u=>u.id).join();if(sig!==dmSig||!el.children.length){dmSig=sig;el.innerHTML='<h5>TOP DAMAGE</h5>'+all.map(u=>`<div data-u="${u.id}"><canvas data-k="${u.k}"></canvas><i></i><em></em></div>`).join('');el.querySelectorAll('canvas').forEach(c=>portrait(c,c.dataset.k,20));}
  const top=all[0].dmgDone;all.forEach((u,i)=>{const row=el.children[i+1];if(!row)return;row.querySelector('i').style.width=Math.max(4,u.dmgDone/top*100)+'%';row.querySelector('em').textContent=fmt(Math.round(u.dmgDone));row.dataset.tip=`${u.def.name}|${fmt(Math.round(u.dmgDone))} damage · ${u.kills} kills`;});}

/* ---------- chip counter ---------- */
let chipDisp=null,chipFlashT=0;
function rollChips(dt){if(!G)return;const tgt=G.me.chips;if(chipDisp==null)chipDisp=tgt;const d=tgt-chipDisp;
  if(Math.abs(d)>=4&&performance.now()>chipFlashT){const el=$('#rChips');el.classList.remove('gain','spend');el.classList.add(d>0?'gain':'spend');chipFlashT=performance.now()+120;clearTimeout(rollChips._t);rollChips._t=setTimeout(()=>el.classList.remove('gain','spend'),420);}
  chipDisp=Math.abs(d)<.6?tgt:chipDisp+d*Math.min(1,dt*9);$('#rChips').textContent=fmt(Math.round(chipDisp));}

/* ---------- top-bar breakdowns ---------- */
function topTips(){const R=G.round,w=G.wave,cr=G.workers.length;const pay=Math.round(20+2.5*Math.max(1,w));
  const set=(sel,t)=>{const el=$(sel);if(el&&el.dataset.tip!==t)el.dataset.tip=t;};
  set('#rChips',`Chips: ${fmt(G.me.chips)}|Croupiers: ${cr} on the floor, 3 chips a trip${R?' · +'+((G.stats.croup||0)-R.croup0)+' this round':''}|The house pays +${pay} when a round ends|Clean round bonus: +${Math.min(40,10+5*(G.streak||0))}${G.streak?' (streak '+G.streak+')':''}|Earned this game: ${fmt(G.stats.earned)}`);
  set('#rHp',`Your casino: ${Math.ceil(G.base.hp)} / ${G.base.maxHp}|Armor plating level ${G.base.plate}: bites do ${G.base.plate*10}% less|${R&&G.phase==='wave'?'This round: '+R.leaks+' leaks, −'+Math.round(R.hpLost)+' health|':''}Bad luck that reaches it keeps biting until killed`);
  {const c=waveComp(Math.max(1,w));set('#rRound',`Round ${w} of ${MAX_WAVE}|${w?c.name+(c.traits&&c.traits.length?' · '+c.traits.map(t=>TRAITS[t].name).join(', '):''):'Starting soon'}`);}
  set('#rRivals',`Casinos still open|`+G.players.filter(p=>!p.human).map(p=>`${p.short||p.name}: ${p.alive?'casino '+Math.ceil(p.hp||0)+' · army '+fmt(Math.round(p.power||0)):'busted round '+p.outWave}`).join('|'));
  {const ko=G.ko.length,best=G.units.concat(G.ko.map(k=>k.u)).reduce((a,b)=>(b.dmgDone||0)>(a&&a.dmgDone||0)?b:a,null);
   set('#rArmy',`Your creatures|${G.units.length} on the board${ko?', '+ko+' knocked out':''}|Army strength ${fmt(Math.round(typeof armyPower==='function'?armyPower():0))}${best&&best.dmgDone?'|Top damage: '+best.def.name+' ('+fmt(Math.round(best.dmgDone))+')':''}`);}}

/* ---------- casino health graph ---------- */
function hpGraphHTML(){const h=(G.hpHist||[]).slice();if(h.length<2)return '';const W2=600,H2=110,n=h.length,mx=Math.max(100,...h);
  const X=i=>8+i/(n-1)*(W2-16),Y=v=>H2-8-v/mx*(H2-20);const pts=h.map((v,i)=>`${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  let marks='';for(let i=0;i<n;i++)if((i+1)%10===0)marks+=`<line x1="${X(i)}" x2="${X(i)}" y1="6" y2="${H2-6}" stroke="rgba(255,59,90,.25)" stroke-dasharray="3 3"/>`;
  const outs=G.players.filter(p=>!p.human&&!p.alive&&p.outWave).map(p=>{const i=Math.min(n-1,p.outWave-1);return `<circle cx="${X(i)}" cy="${H2-6}" r="3" fill="${p.col}"><title>${esc(p.short||p.name)} busted, round ${p.outWave}</title></circle>`;}).join('');
  return `<div class="hpgraph"><small>Your casino's health, round by round${outs?' · dots mark rival busts':''}</small><svg viewBox="0 0 ${W2} ${H2}"><defs><linearGradient id="hpg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#39d98a" stop-opacity=".45"/><stop offset="1" stop-color="#39d98a" stop-opacity="0"/></linearGradient></defs>
    <line x1="8" x2="${W2-8}" y1="${Y(100)}" y2="${Y(100)}" stroke="rgba(255,255,255,.12)"/>${marks}<polygon points="${X(0)},${H2-8} ${pts} ${X(n-1)},${H2-8}" fill="url(#hpg)"/><polyline points="${pts}" fill="none" stroke="#39d98a" stroke-width="2.4" stroke-linejoin="round"/>${outs}</svg></div>`;}

/* ---------- meta: collection, achievements, run history ---------- */
const ACH={merge1:['Better Together','Make your first merge.','merge'],summit:['Top of the Stack','Make a third-tier merge.','crown'],house:['The House Always Wins','Merge The House.','casino'],
  royal:['Royal Treatment','Summon The Sovereign with a royal flush.','crown'],quads:['Four of a Kind','Summon a dragon from four of a kind.','flame'],legend:['Legendary','Rank a creature up to Legend.','sparkles'],
  spotless:['Spotless','Clear five rounds in a row without a scratch.','plate'],velvet:['Velvet Fortress','Reach round 10 without a single leak.','rope'],debt:['Debt Settled','Bust a boss.','kills'],
  tipper:['Big Tipper','Tip the dealer 200 chips in one game.','chips'],pet:["Teacher's Pet","Be the dealer's favourite three times in one game.",'heart'],
  win_casual:['Casual Winner','Win on Casual.','round'],win_standard:['House Rules','Win on Standard.','round'],win_high:['High Roller','Win on High Roller.','round'],
  lastcall:['Last Call','Survive all 40 rounds.','next'],table:['Table Champion','Win a multiplayer game.','users'],
  coll15:['Collector','Discover 15 creatures.','army'],coll35:['Curator','Discover 35 creatures.','army'],collall:['Full House','Discover every creature.','army']};
const Meta=(()=>{let m;try{m=JSON.parse(localStorage.getItem('allin-meta')||'{}');}catch(e){m={};}m.seen=m.seen||{};m.ach=m.ach||{};m.runs=m.runs||[];
  const save=()=>{try{localStorage.setItem('allin-meta',JSON.stringify(m));}catch(e){}};
  const api={data:m,
    seen(k){if(!UNITS[k])return;const first=!m.seen[k];m.seen[k]=(m.seen[k]||0)+1;save();const n=Object.keys(m.seen).length;if(n>=15)api.ach('coll15');if(n>=35)api.ach('coll35');if(n>=Object.keys(UNITS).filter(k=>!UNITS[k].hidden).length)api.ach('collall');
      if(first&&G&&G.wave>0)gameLog(`New creature for your collection: ${UNITS[k].name}.`,'good');},
    ach(id){if(!ACH[id]||m.ach[id])return;m.ach[id]=Date.now();save();const a=ACH[id];achToast(a);gameLog('Achievement unlocked: '+a[0],'good');},
    run(r){m.runs.unshift(r);m.runs.length=Math.min(m.runs.length,20);save();}};
  return api;})();
function achToast(a){const el=document.createElement('div');el.className='achpop';const hid=typeof HIDDEN_ACH!=='undefined'&&Object.values(HIDDEN_ACH).some(h=>h[0]===a[0]);if(hid)el.classList.add('secret');el.innerHTML=`${icon(a[2])}<div><small>${hid?'SECRET ACHIEVEMENT':'ACHIEVEMENT'}</small><b>${a[0]}</b><span>${a[1]}</span></div>`;const n=document.querySelectorAll('.achpop').length;el.style.top=(64+n*78)+'px';document.body.appendChild(el);
  Snd.play('rankup');setTimeout(()=>el.classList.add('show'),30);setTimeout(()=>el.classList.remove('show'),4200);setTimeout(()=>el.remove(),4800);}
function recordRun(won){if(!G||G.recorded)return;G.recorded=true;const all=G.units.concat(G.ko.map(k=>k.u));const mvp=all.reduce((a,b)=>(b.dmgDone||0)>(a&&a.dmgDone||0)?b:a,null);
  Meta.run({t:Date.now(),dk:G.diffKey,mp:!!G.mp,won:!!won,place:G.place,round:G.wave,best:G.stats.best,mvp:mvp&&mvp.dmgDone?mvp.k:null,kills:G.stats.kills,secs:Math.round(G.time)});}
function showCollection(back,tab){tab=tab||'cre';const m=Meta.data,ks=Object.keys(UNITS).filter(k=>!UNITS[k].hidden),seenN=ks.filter(k=>m.seen[k]).length,achN=Object.keys(ACH).filter(k=>m.ach[k]).length;
  let body='';
  if(tab==='cre')body=`<p class="lead">${seenN} of ${ks.length} creatures discovered. Summon or merge one to add it.</p><div class="coll">${ks.map(k=>m.seen[k]?`<div data-tip="${UNITS[k].name}|${UNITS[k].desc}|${UNITS[k].merge?'Merge':'From '+HANDS[UNITS[k].hand]}|Summoned or merged ${m.seen[k]}×"><canvas data-k="${k}"></canvas><b>${UNITS[k].name}</b></div>`:`<div class="un" data-tip="Undiscovered|${UNITS[k].secret?'A secret merge':UNITS[k].sig?'Signature hand: '+UNITS[k].sig:UNITS[k].merge?'A merge you have not made yet':'From '+HANDS[UNITS[k].hand]}"><span>?</span><b>???</b></div>`).join('')}</div>`;
  else if(tab==='ach')body=`<p class="lead">${achN} of ${Object.keys(ACH).length} unlocked.</p><div class="achs">${Object.entries(ACH).map(([k,a])=>{const hid=typeof HIDDEN_ACH!=='undefined'&&HIDDEN_ACH[k];if(hid&&!m.ach[k])return `<div class="secret">${icon('help')}<div><b>???</b><span>${hid[3]}</span></div></div>`;return `<div class="${m.ach[k]?'on':''}${hid?' secret':''}">${icon(a[2])}<div><b>${a[0]}</b><span>${a[1]}</span></div>${m.ach[k]?`<em>${new Date(m.ach[k]).toLocaleDateString()}</em>`:''}</div>`;}).join('')}</div>`;
  else body=m.runs.length?`<table class="hist"><tr><th>Date</th><th>Mode</th><th>Result</th><th>Round</th><th>Best hand</th><th>MVP</th></tr>${m.runs.map(r=>`<tr><td>${new Date(r.t).toLocaleDateString()}</td><td>${DIFFS[r.dk]?DIFFS[r.dk].name:r.dk}${r.mp?' · MP':''}</td><td class="${r.won?'w':'l'}">${r.won?'Won':['','1st','2nd','3rd','4th','5th','6th'][r.place]||'Lost'}</td><td>${r.round}</td><td>${r.best>=0?HANDS[r.best]:'None'}</td><td>${r.mvp&&UNITS[r.mvp]?UNITS[r.mvp].name:'—'}</td></tr>`).join('')}</table>`:'<p class="lead">No finished games yet.</p>';
  showOverlay(`<h2>Collection</h2><div class="tabs"><button data-t="cre" class="${tab==='cre'?'on':''}">Creatures ${seenN}/${ks.length}</button><button data-t="ach" class="${tab==='ach'?'on':''}">Achievements ${achN}/${Object.keys(ACH).length}</button><button data-t="his" class="${tab==='his'?'on':''}">History</button></div>${body}<div class="mrow"><button class="pb main" id="cBack">Back</button></div>`,'how');
  document.querySelectorAll('.coll canvas').forEach(c=>portrait(c,c.dataset.k,46));
  document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{Snd.play('click');showCollection(back,b.dataset.t);}));
  $('#cBack').addEventListener('click',()=>back());}

/* ---------- save & resume (solo) ---------- */
function buildSnap(){const g=G;
  const units=g.units.concat(g.ko.map(k=>k.u)).filter(u=>!u.temp).map(u=>({k:u.k,x:Math.round(u.dead?BASE.fx-10:u.x),y:Math.round(u.dead?BASE.y:u.y),hp:Math.round(u.dead?u.maxHp:u.hp),kills:u.kills,dd:Math.round(u.dmgDone||0)}));
  const ropes=[];for(let i=0;i<grid.length;i++)if(grid[i]===2)ropes.push(i);
  const d={v:1,dk:g.diffKey,wave:g.wave,time:g.time,handNo:g.handNo||0,dealerIdx:g.dealerIdx,streak:g.streak||0,stats:g.stats,up:g.up,base:{hp:g.base.hp,tier:g.base.tier||0},duty:g.workers.map(w=>w.mode==='repair'?1:0),
    hpHist:g.hpHist||[],leakHist:g.leakHist||[],aggro:g.humanAggro||0,chips:g.me.chips,workers:g.workers.length,ropes,units,freeplay:g.freeplay,
    players:g.players.slice(1).map(p=>({chips:p.chips,hp:p.hp,power:p.power,alive:p.alive,lastUnit:p.lastUnit,outWave:p.outWave||0})),out:g.outOrder.map(p=>g.players.indexOf(p)),saved:Date.now()};
  return d;}
function applyBoard(d){const g=G;
  Object.assign(g,{wave:d.wave,time:d.time,streak:d.streak,stats:Object.assign(g.stats,d.stats),up:d.up,hpHist:d.hpHist,leakHist:d.leakHist||[],humanAggro:d.aggro});
  setCasinoTier(d.base.tier||0,true);g.base.hp=Math.min(g.base.maxHp,d.base.hp);g.me.chips=d.chips;
  for(let i=0;i<grid.length;i++)if(grid[i]===2)grid[i]=0;for(const i of d.ropes)if(grid[i]===0)grid[i]=2;g.barricades=d.ropes.length;computeFlow();
  for(let k=g.workers.length;k<d.workers;k++)addWorker();(d.duty||[]).forEach((m,i)=>{if(m&&g.workers[i]){g.workers[i].mode='repair';g.workers[i].st=3;}});
  for(const q of d.units){const u2=makeUnit(q.k,q.x,q.y);u2.kills=q.kills;u2.dmgDone=q.dd||0;checkRank(u2,true);u2.hp=Math.min(u2.maxHp,q.hp);u2.spawnT=0;u2.anchor={x:q.x,y:q.y};}}
function saveRun(){if(!G||G.mp||G.over)return;try{localStorage.setItem('allin-run',JSON.stringify(buildSnap()));}catch(e){}}
function savedRun(){try{const d=JSON.parse(localStorage.getItem('allin-run')||'null');return d&&d.v===1&&DIFFS[d.dk]?d:null;}catch(e){return null;}}
function clearRun(){try{localStorage.removeItem('allin-run');}catch(e){}}
function resumeRun(){const d=savedRun();if(!d)return;if(NET.on)netLeave();newGame(d.dk);const g=G;
  applyBoard(d);Object.assign(g,{handNo:d.handNo,dealerIdx:d.dealerIdx,freeplay:!!d.freeplay});d.players.forEach((q,i)=>Object.assign(g.players[i+1],q));
  g.outOrder=d.out.map(i=>g.players[i]).filter(Boolean);g.phase='break';g.breakT=2.5;g.running=true;
  resetGameUI();hideOverlay();toast(`Run resumed · round ${g.wave+1} up next`);gameLog(`Resumed your ${DIFFS[d.dk].name} run at round ${g.wave}.`,'good');}

$('#chatForm').addEventListener('submit',e=>{e.preventDefault();const i=$('#chatIn');if(sendChat(i.value))i.value='';i.blur();});
$('#chatIn').addEventListener('keydown',e=>{if(e.key==='Escape'){e.target.value='';e.target.blur();}});

/* compatibility shims used by game/poker */
function refreshSide(){refreshPane(true);refreshCmd();}

/* ---------- loop ---------- */
let last=performance.now(),acc=0,uiT=0;
function frame(now){
  const rdt=Math.min(1,(now-last)/1000),dt=Math.min(.1,rdt);last=now;NET.lastFrame=performance.now();NET.bgLast=NET.lastFrame;
  if(NET.on)netTick(rdt);rollChips(rdt);if(G&&!G.paused)tickMinigame(rdt);
  if(G&&G.running&&!G.paused&&!G.over){acc+=dt*G.speed*(typeof feelScale==='function'?feelScale():1);let n=0;while(acc>=STEP&&n<15){update(STEP);acc-=STEP;n++;if(G.over)break;}if(n>=15)acc=0;}
  else if(G&&G.over)stepParticles(dt);
  if(NET.watch&&NET.watch.full)renderView(MAINCTX,1,NET.watch.GV,NET.watch.ropes);else render();
  if(NET.watch&&!NET.watch.full&&pkScale)renderView(pkCtx,pkScale,NET.watch.GV,NET.watch.ropes);
  uiT-=dt;if(tipFor&&tipFor!==cv&&!document.body.contains(tipFor))hideTip();if(uiT<=0&&G){uiT=.1;if(NET.watch){const i=watchInfo();$('#pkInfo').textContent=i;$('#wbInfo').textContent=i;}
    if(G.mp&&G.players.some(p=>p.remote))hintOnce('watch','Click a friend\'s seat at the table to <b>watch their casino live</b>.');syncTop();refreshTable();refreshPane();refreshCmd();
    if(G.phase==='wave'&&G.wave===1&&G.units.length)hintOnce('army','Drag a box to select creatures, then <b>right-click</b> to move them. <b>Velvet ropes</b> (V) make the bad luck take the long way.');
    $('#boardWrap').classList.toggle('alarm',!!(G.running&&!G.over&&!(NET.watch&&NET.watch.full)&&G.enemies.some(e=>e.atCasino&&!e.dead)));
    if(G.sel.some(u=>u.def.ab))hintOnce('ability','This creature has an <b>ability</b>. Press <b>E</b> or use the purple button on the command card.');
    if(G.units.some(u=>recipesFor(u.k).some(r=>G.units.some(o=>o!==u&&o.k===r.partner))))hintOnce('merge','Two of your creatures can <b>merge</b>. Select one and use the recipe button.');}
  requestAnimationFrame(frame);
}
['btnSlots','btnLog','btnEmote','btnRoute','btnSpeed','btnPause','btnMusic','btnMute','btnSet','btnHelp'].forEach((id,i)=>{$('#'+id).innerHTML=icon(['cherry','scroll-text','message-circle','route','speed','pause','music','sound','settings','help'][i])+(id==='btnSpeed'?'<span>1×</span>':'');});
document.querySelectorAll('[data-icon]').forEach(el=>{el.insertAdjacentHTML('afterbegin',icon(el.dataset.icon));});
window.ALLIN={NET,defeat,victory,get G(){return G;},get HD(){return HD;},uiAct,uiDeal,uiTip,uiSwap,uiStand,dealNow,newGame,update,startGame,act,dealCards,tipDealer,confirmDraw,toggleDiscard,humanSeat,humanSwap,standPat,toCall,orderMove,orderStop,orderHold,mergeUnits,mergeResult,recipesFor,placeBarricade,removeBarricade,canBarricade,buyUpgrade,upLevel,UPGRADES,UNITS,grid,flow,gi,showEnd,banner,get MG(){return MG;},openMinigame,toggleSlots,slotPull,endWave,rouSpin,bjDeal,bjStand,bjHit,miniAfter,mapClick};
fit();newGame('standard');G.running=false;buildCmd();refreshTable(true);refreshPane(true);refreshCmd();syncTop();
applySet();renderLog();
{const m=/^#join-([a-z0-9]{4,6})$/i.exec(location.hash||'');if(m)showMulti(m[1].toUpperCase());else showMenu();}netApi();
/* phones and touch-only tablets: the game needs a mouse and keyboard, so say so kindly and offer to send the link on */
function touchOnly(){try{return matchMedia('(hover: none) and (pointer: coarse)').matches||Math.min(innerWidth,innerHeight)<500&&!matchMedia('(any-pointer: fine)').matches;}catch(e){return false;}}
function showDeviceGate(){
  try{if(sessionStorage.getItem('allin-gate'))return;}catch(e){}
  const link=location.href,joining=/#join-/i.test(location.hash||'');
  const g=document.createElement('div');g.id='gate';
  g.innerHTML=`<div class="gbox"><div class="gsign"><div class="logo">ALL IN</div></div>
    <h2>Best played on a computer</h2>
    <p>All In is a strategy game built for a mouse and keyboard: drag to select, right-click to order, hotkeys for everything. Open this link on a laptop or desktop to ${joining?'join your friends':'play'}.</p>
    <div class="gbtns">${navigator.share?'<button class="pb main" id="gShare">Send the link to myself</button>':''}<button class="pb ${navigator.share?'':'main'}" id="gCopy">Copy link</button></div>
    <button class="glook" id="gLook">Look around anyway</button></div>`;
  document.body.appendChild(g);
  const done=()=>{try{sessionStorage.setItem('allin-gate','1');}catch(e){}g.remove();};
  const sh=g.querySelector('#gShare');if(sh)sh.addEventListener('click',()=>{navigator.share({title:'All In: Poker Defense',text:'Play this on a computer',url:link}).catch(()=>{});});
  g.querySelector('#gCopy').addEventListener('click',()=>{const ok=()=>{const b=g.querySelector('#gCopy');b.textContent='Link copied';setTimeout(()=>b.textContent='Copy link',1800);};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(link).then(ok,()=>prompt('Copy this link',link));else prompt('Copy this link',link);});
  g.querySelector('#gLook').addEventListener('click',done);
}
if(touchOnly())showDeviceGate();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{fit();});
requestAnimationFrame(frame);
