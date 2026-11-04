'use strict';
/* ============ ALL IN — a soundtrack that follows the danger ============
   Between waves the lounge plays as before. During a wave the music reads the street: how much bad luck is out,
   how close it is to the casino, whether a boss is on the board, how hurt the casino is. That "heat" (0..1) drives
   four layers that crossfade smoothly:
     groove  the wave beat: kick, clap, hats, a syncopated bass, the arp through a tempo delay
     drive   four-on-the-floor, a pumping octave bass, open hats; pads duck on every kick
     hot     sixteenth hats, chord stabs, tom fills into each phrase, the arp doubles up and opens out
     alarm   a tremolo semitone cluster up high, a noise riser into every phrase and a crash on the one
   Casino low: a heartbeat under everything and the top end closes in. A drum fill brings each wave in, and a
   bright resolve plays it out when the street is clear. */

const MX={heat:0,hp:1,lastT:0,phase:null,cleared:false,L:null,dly:null,wlp:null,pump:null,fillAt:-1,boss:0};
function mxSmooth(a,b,x){const k=Math.min(1,Math.max(0,(x-a)/(b-a)));return k*k*(3-2*k);}
// how dangerous is the street right now
function mxTarget(){if(!G||G.phase!=='wave')return 0;let p=0;
  for(const e of G.enemies){if(e.dead||e.hidden)continue;const d=Math.hypot(e.x-BASE.x,e.y-BASE.y),near=Math.min(1,Math.max(0,1-(d-60)/950));
    const w=e.def.boss?7:e.def.mini?3.5:e.def.elite?1.8:1;p+=w*(.35+.65*near*near);}
  let h=1-Math.exp(-p/9);
  if(G.enemies.some(e=>!e.dead&&(e.def.boss||e.def.mini)))h=Math.max(h,.62)+(G.enemies.some(e=>!e.dead&&e.phase>=2)?.18:0);
  const hp=G.base.maxHp?G.base.hp/G.base.maxHp:1;if(hp<.35)h+=.25*(1-hp/.35);
  if(typeof FEEL!=='undefined'&&performance.now()-FEEL.lastHurt<1500)h+=.12;
  return Math.min(1,h);}
function mxBuses(){const c=Snd.ctx;if(MX.L&&MX.L.c===c)return;
  const mk=()=>{const g=c.createGain();g.gain.value=0;return g;};
  // wave layers share a filter (it closes when the casino is in trouble) and a pump (pads duck on the kick)
  // the wave layers bypass the lounge's dark lowpass so hats and stabs keep their sparkle; MX.out follows the music volume
  MX.out=c.createGain();MX.out.gain.value=Music.bus.gain.value;MX.out.connect(Snd.master);
  MX.wlp=c.createBiquadFilter();MX.wlp.type='lowpass';MX.wlp.frequency.value=11000;MX.wlp.Q.value=.7;MX.wlp.connect(MX.out);
  MX.pump=c.createGain();MX.pump.gain.value=1;MX.pump.connect(MX.wlp);
  MX.L={c,groove:mk(),drive:mk(),hot:mk(),alarm:mk(),beat:mk()};
  for(const k of ['groove','drive','hot','alarm'])MX.L[k].connect(MX.wlp);MX.L.beat.connect(MX.out);MX.L.beat.gain.value=1;
  MX.L.pad=c.createGain();MX.L.pad.gain.value=1;MX.L.pad.connect(MX.pump);
  // a tempo delay for the arp and leads, darkened in its feedback loop
  const d=c.createDelay(1.5),fb=c.createGain(),lp=c.createBiquadFilter(),wet=c.createGain();d.delayTime.value=.42;fb.gain.value=.32;lp.type='lowpass';lp.frequency.value=2600;wet.gain.value=.38;
  d.connect(lp);lp.connect(fb);fb.connect(d);lp.connect(wet);wet.connect(MX.wlp);MX.dly={d,inp:d};}
function mxNote(dest,f,t,d,type,vol,cut,det,send){const c=Snd.ctx,o=c.createOscillator(),g=c.createGain(),fl=c.createBiquadFilter();o.type=type;o.frequency.value=f;if(det)o.detune.value=det;
  fl.type='lowpass';fl.frequency.setValueAtTime(cut||2000,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0006,t+d);
  o.connect(fl);fl.connect(g);g.connect(dest);if(send)g.connect(MX.dly.inp);o.start(t);o.stop(t+d+.05);}
// a filter-swept stab: two detuned saws whose filter snaps open then shuts
function mxStab(dest,fs,t,d,vol,cut){const c=Snd.ctx,g=c.createGain(),fl=c.createBiquadFilter();fl.type='lowpass';fl.Q.value=4;fl.frequency.setValueAtTime(cut,t);fl.frequency.exponentialRampToValueAtTime(260,t+d);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.0006,t+d);fl.connect(g);g.connect(dest);
  for(const f of fs)for(const det of [-9,9]){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=det;o.connect(fl);o.start(t);o.stop(t+d+.05);}}
function mxDrum(dest,kind,t,vol,x){const c=Snd.ctx;
  if(kind==='kick'){const o=c.createOscillator(),g=c.createGain(),o2=c.createOscillator(),g2=c.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(44,t+.16);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);g.connect(dest);o.start(t);o.stop(t+.32);
    o2.type='triangle';o2.frequency.setValueAtTime(1800,t);o2.frequency.exponentialRampToValueAtTime(200,t+.02);g2.gain.setValueAtTime(vol*.25,t);g2.gain.exponentialRampToValueAtTime(.001,t+.025);o2.connect(g2);g2.connect(dest);o2.start(t);o2.stop(t+.04);return;}
  if(kind==='tom'){const o=c.createOscillator(),g=c.createGain(),f0=x||160;o.frequency.setValueAtTime(f0*1.6,t);o.frequency.exponentialRampToValueAtTime(f0,t+.08);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.32);o.connect(g);g.connect(dest);o.start(t);o.stop(t+.35);return;}
  if(kind==='heart'){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(70,t);o.frequency.exponentialRampToValueAtTime(38,t+.12);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);g.connect(dest);o.start(t);o.stop(t+.22);return;}
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=Snd.nb;
  const P={hat:['highpass',7500,.035],ohat:['highpass',6500,.2],clap:['bandpass',1500,.14],snare:['bandpass',1900,.16],crash:['highpass',4200,1.6],shaker:['bandpass',9000,.05]}[kind];
  f.type=P[0];f.frequency.value=P[1];if(kind==='clap'){f.Q.value=1.2;g.gain.setValueAtTime(0,t);for(let i=0;i<3;i++){g.gain.setValueAtTime(vol,t+i*.011);g.gain.exponentialRampToValueAtTime(vol*.2,t+i*.011+.009);}g.gain.setValueAtTime(vol*.8,t+.033);g.gain.exponentialRampToValueAtTime(.001,t+P[2]);}
  else{g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+P[2]);}
  s.loop=true;s.connect(f);f.connect(g);g.connect(dest);s.start(t,Math.random()*.5);s.stop(t+P[2]+.05);}
function mxRiser(dest,t,d,vol){const c=Snd.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=Snd.nb;s.loop=true;f.type='bandpass';f.Q.value=3;
  f.frequency.setValueAtTime(400,t);f.frequency.exponentialRampToValueAtTime(7000,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+d*.95);g.gain.linearRampToValueAtTime(0,t+d+.02);
  s.connect(f);f.connect(g);g.connect(dest);s.start(t);s.stop(t+d+.05);}
// the pads breathe with the kick
function mxPump(t,depth){const g=MX.pump.gain;g.cancelScheduledValues(t);g.setValueAtTime(1-depth,t);g.linearRampToValueAtTime(1,t+.22);}

const _mxBaseTick=Music.tick;
Music.tick=function(){const c=Snd.ctx;if(!c||(c.state!=='running'&&MX.fakeNow==null))return;
  const paused=!G||G.paused||G.over||!G.running,inWave=!!G&&G.phase==='wave'&&!paused;
  if(!inWave){if(MX.L)for(const k of ['groove','drive','hot','alarm'])MX.L[k].gain.setTargetAtTime(0,c.currentTime,.35);
    // the wave just ended with the street clear: play it out bright
    if(G&&MX.phase==='wave'&&G.phase!=='wave'&&!G.over&&MX.L)mxResolve(c.currentTime+.05);
    MX.phase=G&&G.phase;MX.heat*=.9;return _mxBaseTick.call(this);}
  mxBuses();const now=MX.fakeNow!=null?MX.fakeNow:c.currentTime;MX.out.gain.setTargetAtTime(Music.bus.gain.value,now,.1);const dt=Math.min(.2,Math.max(0,now-(MX.lastT||now)));MX.lastT=now;
  if(MX.phase!=='wave'){MX.phase='wave';MX.fillAt=this.next;MX.heat=Math.max(MX.heat,.15);}
  const tgt=MX.forceHeat!=null?MX.forceHeat:mxTarget();MX.heat+=(tgt-MX.heat)*Math.min(1,dt*(tgt>MX.heat?1.6:.35));const H=MX.heat;
  const hp=G.base.maxHp?G.base.hp/G.base.maxHp:1;MX.hp=hp;
  const boss=G.enemies.some(e=>!e.dead&&(e.def.boss||e.def.mini));
  // layer levels
  const lv={groove:1,drive:mxSmooth(.22,.45,H),hot:mxSmooth(.5,.72,H),alarm:mxSmooth(.78,.95,H)};
  for(const k in lv)MX.L[k].gain.setTargetAtTime(lv[k]*(this.on?1:0),now,.6);
  MX.wlp.frequency.setTargetAtTime(hp<.3?900+hp*7000:11000,now,.4);
  const A=ACTS[musicAct()],bpm=(boss?120:108+Math.round(H*6))+A.bpm,sx=60/bpm/4,hr=heldRank();
  MX.dly.d.delayTime.setTargetAtTime(sx*3,now,.1);
  while(this.next<now+.18){const t=this.next,s=this.step%64,cyc=Math.floor(this.step/64),alt=cyc%2===1,bar=Math.floor(s/16),b=s%16,beat=b>>2;
    const order=alt?[0,2,1,3]:[0,1,2,3],[root,ch]=A.CH[order[bar]];const L=MX.L;
    if(this.on){
      // the fill that brings the wave in, then each phrase
      if(MX.fillAt>=0&&t>=MX.fillAt){const f0=t;for(let i=0;i<6;i++)mxDrum(L.beat,'tom',f0+i*sx,.16+i*.02,220-i*26);mxRiser(L.beat,f0,sx*6,.05);mxDrum(L.beat,'crash',f0+sx*6,.08);MX.fillAt=-1;}
      // pad: the chord, held, ducking on the kick
      if(b===0)for(const f of ch)mxNote(L.pad,f,t,sx*15.5,'sawtooth',.016,1100+H*900,(Math.random()-.5)*16);
      // GROOVE
      const kick=b===0||b===8||(alt&&b===10)||(b===14&&bar===3);
      if(kick){mxDrum(L.groove,'kick',t,.3);mxPump(t,.35+.35*lv.drive);}
      if(b===4||b===12)mxDrum(L.groove,'clap',t,.12);
      if(b%2===0)mxDrum(L.groove,'hat',t,b%4===0?.022:.032);
      if([0,3,6,8,11,14].includes(b))mxNote(L.groove,root*(b===14?2:1),t,sx*1.7,'sawtooth',.05,520+H*500);
      const arp=alt?[0,2,1,2,0,1,2,1]:[0,1,2,1,0,2,1,2];
      if(b%2===0)mxNote(L.groove,ch[arp[(b>>1)%8]]*2,t,sx*1.3,'square',boss?.016:.012,1500+H*2600,0,true);
      // DRIVE
      if(lv.drive>.01){if((b===4||b===12)&&!kick){mxDrum(L.drive,'kick',t,.26);mxPump(t,.55);}
        if(b%4===2)mxDrum(L.drive,'ohat',t,.03);
        if(b%2===1)mxNote(L.drive,root*2,t,sx*.8,'sawtooth',.04,700+H*900);
        if(b%4===0&&!kick)mxNote(L.drive,root,t,sx*.9,'square',.03,500);}
      // HOT
      if(lv.hot>.01){if(b%2===1)mxDrum(L.hot,'hat',t,.02);if(b%4===3)mxDrum(L.hot,'shaker',t,.03);
        if(b===3||b===11||(alt&&b===6))mxStab(L.hot,ch.map(f=>f*2),t,sx*1.6,.026,3200+H*1800);
        if(b%2===1)mxNote(L.hot,ch[arp[(b>>1)%8]]*4,t,sx*.9,'square',.007,4200,0,true);
        if(bar===3&&b>=12){mxDrum(L.hot,'tom',t,.13,[210,180,150,120][b-12]);}}
      // ALARM
      if(lv.alarm>.01){if(b%2===0){const tr=b%4===0?1:.55;mxNote(L.alarm,ch[0]*8,t,sx*2.2,'triangle',.006*tr,6000);mxNote(L.alarm,ch[0]*8*1.0595,t+sx*.5,sx*2.2,'triangle',.006*tr,6000);}
        if(bar===3&&b===0)mxRiser(L.alarm,t,sx*16,.07);if(bar===0&&b===0)mxDrum(L.alarm,'crash',t,.07);
        if(b===0||b===8)mxNote(L.alarm,root,t,sx*7,'sawtooth',.026,320,0);}
      if(boss&&b%8===7)mxNote(L.groove,ch[0]*4,t,sx*2,'sawtooth',.011,3200,8,true);
      // the casino's heart, when it's in trouble
      if(hp<.35&&(b===0||b===8)){const v=.22*(1-hp/.35)+.08;mxDrum(L.beat,'heart',t,v);mxDrum(L.beat,'heart',t+sx*1.1,v*.7);}
      // holding something good still swells in over the top
      if(hr>=3&&(b===0||b===8))for(const f of ch)mxNote(L.pad,f*2,t,sx*8.5,'triangle',.006*(hr-1),3800,(Math.random()-.5)*8);
    }
    this.next+=sx;this.step++;}};
// the street is clear: a bright chord, a little run up, a crash
function mxResolve(t){const c=Snd.ctx;if(!c||!Music.on||!MX.L)return;const A=ACTS[musicAct()],[root,ch]=A.CH[0],maj=[root*2,root*2*1.26,root*2*1.498,root*4];
  const O=MX.out||Music.bus;for(const f of maj){mxNote(O,f,t,2.4,'triangle',.022,3600,(Math.random()-.5)*10);mxNote(O,f*2,t,1.6,'sine',.01,5000);}
  [1,1.26,1.498,2,2.52].forEach((k,i)=>mxNote(O,root*4*k,t+.06*i,.5,'square',.01,4200,0,true));mxDrum(O,'crash',t,.06);}
