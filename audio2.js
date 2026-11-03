'use strict';
/* ============ ALL IN — audio pass ============
   Real-feeling card and chip foley, summon sounds that match the creature,
   and a soundtrack that changes with each act and swells when you hold a monster hand. */

/* ---------- foley helpers ---------- */
const FX={
  // a short, resonant tick: clay chips, card edges
  click(t,freq,q,vol,dur){const c=Snd.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=Snd.nb;f.type='bandpass';f.frequency.value=freq;f.Q.value=q;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0006,t+dur);s.connect(f);f.connect(g);g.connect(Snd.master);s.start(t,Math.random()*.8);s.stop(t+dur+.02);},
  // a card sliding off the deck: filtered noise sweeping down, then a soft landing
  slide(t,vol){const c=Snd.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=Snd.nb;f.type='bandpass';f.Q.value=1.4;
    f.frequency.setValueAtTime(5200,t);f.frequency.exponentialRampToValueAtTime(1500,t+.09);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0006,t+.11);
    s.connect(f);f.connect(g);g.connect(Snd.master);s.start(t,Math.random()*.8);s.stop(t+.14);FX.click(t+.085,900,2,vol*.5,.04);},
  // a chip landing on a stack
  chip(t,vol){const f=2600+Math.random()*1400;FX.click(t,f,6,vol*3.6,.05);FX.click(t+.004,f*1.47,8,vol*1.8,.035);FX.click(t,1100,2,vol*.9,.02);},
  thump(t,f0,f1,vol,dur){const c=Snd.ctx,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(Snd.master);o.start(t);o.stop(t+dur+.02);},
  sweep(t,f0,f1,type,vol,dur,q){const c=Snd.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=Snd.nb;f.type=type||'bandpass';f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+dur*.25);g.gain.exponentialRampToValueAtTime(.0006,t+dur);s.connect(f);f.connect(g);g.connect(Snd.master);s.start(t,Math.random()*.5);s.stop(t+dur+.05);}
};

/* what kind of creature is this, to the ear */
function summonVoice(k){const L=UNITS[k]&&UNITS[k].look||{};const b=L.b;
  if(b==='robot'||b==='tank')return 'machine';
  if(['hound','drake','hydra','wyrm','kraken','whale','crab','chimera','rider','horse','greyhound','goose'].includes(b))return 'beast';
  if(['chip','die','coin','seven','wheel','slot','card','star'].includes(b))return 'token';
  if(L.float||b==='dealer'||L.aura||L.weapon==='orb'||L.weapon==='staff')return 'magic';
  return 'person';}

const FOLEY={
  deal(t){for(let i=0;i<5;i++)FX.slide(t+i*.075+Math.random()*.012,.22);},
  card(t){FX.slide(t,.24);},
  shuffle(t){ // a riffle: a burst of tiny ticks that speeds up, then the bridge
    let x=t;for(let i=0;i<34;i++){FX.click(x,3200+Math.random()*1800,5,.08+.09*(i/34),.018);x+=.022-i*.0003;}
    FX.sweep(x+.03,6000,1400,'bandpass',.12,.22,.8);FX.click(x+.24,700,2,.12,.05);},
  chips(t){const n=3+((Math.random()*3)|0);for(let i=0;i<n;i++)FX.chip(t+i*(.035+Math.random()*.03),.16-i*.015);},
  potwin(t){for(let i=0;i<14;i++)FX.chip(t+i*.045+Math.random()*.02,.14);[523,659,784,1047].forEach((f,i)=>Snd.tone(f,.26,'triangle',.08,0,i*.07+.1));},
  fold(t){FX.slide(t,.14);FX.sweep(t+.03,2400,600,'lowpass',.08,.18);},
  spawn(t){const v=summonVoice(G&&G.lastUnitK);
    if(v==='machine'){FX.thump(t,180,60,.2,.18);FX.click(t+.02,1800,8,.18,.06);FX.click(t+.09,2400,10,.12,.05);Snd.tone(320,.32,'sawtooth',.035,2.2,.06);FX.click(t+.32,1500,6,.14,.05);}
    else if(v==='beast'){FX.sweep(t,300,140,'bandpass',.26,.45,3);Snd.tone(110,.45,'sawtooth',.06,.6);FX.thump(t,90,40,.18,.3);}
    else if(v==='token'){for(let i=0;i<9;i++)FX.click(t+i*.028,2800+i*220,5,.22,.03);[1047,1319,1568].forEach((f,i)=>Snd.tone(f,.16,'triangle',.09,0,.26+i*.05));}
    else if(v==='magic'){[784,988,1175,1568].forEach((f,i)=>Snd.tone(f,.5,'sine',.05,1.02,i*.06));FX.sweep(t,1800,7000,'bandpass',.08,.6,2);}
    else{FX.sweep(t,800,3200,'bandpass',.12,.25,1.2);[523,659,784].forEach((f,i)=>Snd.tone(f,.22,'triangle',.09,0,.12+i*.06));}}
};
{const base=Snd.play.bind(Snd);
  Snd.play=function(n){if(this.muted||!this.ctx||this.ctx.state!=='running')return;const fn=FOLEY[n];if(!fn)return base(n);
    const now=performance.now(),gap={chips:45,card:35,deal:120,shuffle:400}[n]||0;if(gap&&this.last[n]&&now-this.last[n]<gap)return;this.last[n]=now;
    try{fn(this.ctx.currentTime+.005);}catch(e){}};}

/* ---------- soundtrack: a progression per act, variations, and a strong-hand layer ---------- */
const mf=m=>440*Math.pow(2,(m-69)/12);
const chord=(root,minor)=>[mf(root-12-12),[mf(root),mf(root+(minor?3:4)),mf(root+7)]];
const ACTS=[ // [bass root, triad]: Am F C G · Dm Bb F A · Em C G D · F#m D A E
  {CH:[chord(57,1),chord(53,0),chord(60,0),chord(55,0)],bpm:0},
  {CH:[chord(62,1),chord(58,0),chord(53,0),chord(57,0)],bpm:3},
  {CH:[chord(64,1),chord(60,0),chord(55,0),chord(62,0)],bpm:5},
  {CH:[chord(66,1),chord(62,0),chord(57,0),chord(64,0)],bpm:8}];
function musicAct(){return G&&G.wave?Math.min(3,Math.floor((G.wave-1)/10)):0;}
function heldRank(){try{if(!HD||!['bet1','draw','bet2','showdown'].includes(HD.phase))return -1;const s=humanSeat();return s&&!s.folded&&s.ev?s.ev.rank:-1;}catch(e){return -1;}}
Music.tick=function(){const c=Snd.ctx;if(!c||c.state!=='running')return;
  const paused=!G||G.paused||G.over||!G.running;
  const mode=!G?'lounge':G.enemies.some(e=>e.def.boss||e.def.mini)?'boss':G.phase==='wave'?'wave':'lounge';this.mode=mode;
  const A=ACTS[musicAct()],bpm=(mode==='boss'?118:mode==='wave'?108:92)+A.bpm,sx=60/bpm/4,hr=heldRank();
  while(this.next<c.currentTime+.18){const t=this.next,s=this.step%64,cyc=Math.floor(this.step/64),alt=cyc%2===1,bar=Math.floor(s/16),b=s%16;
    const order=alt?[0,2,1,3]:[0,1,2,3],[root,ch]=A.CH[order[bar]];
    if(!paused&&this.on){
      if(b===0)for(const f of ch)this.note(f,t,sx*15,'sawtooth',.018,mode==='lounge'?900:1400,(Math.random()-.5)*14);
      if(mode==='lounge'){
        if(b%4===0)this.note(root,t,sx*3,'triangle',.06,500);if(b%4===2)this.drum('hat',t,.025);if(b===10)this.note(ch[2]*2,t,sx*4,'sine',.02,2500);
        // the B-section adds a soft lead line on top
        if(alt&&[0,3,6,10,12].includes(b)){const tone=[ch[0],ch[1],ch[2],ch[1]*2,ch[0]*2][[0,3,6,10,12].indexOf(b)];this.note(tone*2,t,sx*2.6,'sine',.022,3000);}
        if(cyc%4===3&&b===14)this.drum('snare',t,.05);}
      else{
        if(b%2===0)this.note(root*(b%8===6?2:1),t,sx*1.6,'sawtooth',.05,700);
        const arp=alt?[0,2,1,2,0,1,2,1]:[0,1,2,1,0,2,1,2];this.note(ch[arp[b%8]]*2,t,sx*1.2,'square',mode==='boss'?.018:.013,2600);
        if(b%4===0)this.drum('kick',t,.32);if(b===4||b===12)this.drum('snare',t,.14);this.drum('hat',t,b%2?.018:.03);
        if(mode==='boss'&&b%8===7)this.note(ch[0]*4,t,sx*2,'sawtooth',.012,3200,8);
        if(alt&&b===14)this.drum('snare',t,.08);}
      // holding something good: a pad swells in, and from a flush up, a heartbeat
      if(hr>=3){if(b===0||b===8)for(const f of ch)this.note(f*2,t,sx*8.5,'triangle',.006*(hr-1),3800,(Math.random()-.5)*8);
        if(hr>=5&&mode==='lounge'&&(b===0||b===3||b===8||b===11))this.drum('kick',t,b%8===0?.22:.13);
        if(hr>=7&&b%2===1)this.note(ch[(b>>1)%3]*4,t,sx*.9,'sine',.012,5000);}
    }
    this.next+=sx;this.step++;}
};
