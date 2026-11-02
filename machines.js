'use strict';
/* ============ ALL IN — bespoke machine bodies ============
   The slot robots and roulette tanks used to share one parts kit and looked alike.
   These give each one its own silhouette while keeping its robot/tank behaviour
   (sounds, shake, siege mode, rotating turrets). Picked by look.style. */

const MACH={};
const GOLDC='#e0b040',GOLDD='#8a6212',STEEL='#9aa3b5',GUN='#2b2f38',INK='#0b0612';
function bulbs(c,pts,t,r,on,off){pts.forEach(([x,y],k)=>{c.fillStyle=(Math.floor(t*8)+k)%3===0?(on||'#fff6c8'):(off||'#f59e0b');c.beginPath();c.arc(x,y,r,0,TAU);c.fill();});}
function treadBase(c,r,w,y,h,t){c.fillStyle='#1f2228';rr(c,-w/2,y,w,h,h/2);c.fill();c.fillStyle='#3a3f4b';const n=Math.max(3,Math.round(w/(h*.95)));
  for(let k=0;k<n;k++){const x=-w/2+h/2+k*(w-h)/(n-1);c.beginPath();c.arc(x,y+h/2,h*.3,0,TAU);c.fill();}
  c.strokeStyle='#14161b';c.lineWidth=1.2;for(let k=0;k<10;k++){const x=-w/2+h*.3+((k*w*.1+t*r*1.5)%(w-h*.6));c.beginPath();c.moveTo(x,y+1);c.lineTo(x,y+h*.16);c.stroke();}}
function reel(c,x,y,w,h,sym,spin,t){c.fillStyle='#fffdf3';rr(c,x-w/2,y-h/2,w,h,w*.18);c.fill();c.save();c.beginPath();c.rect(x-w/2,y-h/2,w,h);c.clip();
  const off=spin?((t*60)%h):0;for(const dy of spin?[-h,0,h]:[0]){const s=spin?['7','cherry','bar'][(Math.floor(t*12)+(dy>0?1:dy<0?2:0))%3]:sym;drawSym(c,x,y+dy+off,Math.min(w,h)*.8,s);}c.restore();
  c.fillStyle='rgba(0,0,0,.18)';c.fillRect(x-w/2,y-h/2,w,h*.18);c.fillRect(x-w/2,y+h/2-h*.18,w,h*.18);}
function drawSym(c,x,y,s,sym){
  if(sym==='7'){c.fillStyle='#dc2626';c.beginPath();c.moveTo(x-s*.36,y-s*.42);c.lineTo(x+s*.36,y-s*.42);c.lineTo(x+s*.36,y-s*.28);c.lineTo(x-s*.02,y+s*.46);c.lineTo(x-s*.26,y+s*.46);c.lineTo(x+s*.1,y-s*.24);c.lineTo(x-s*.36,y-s*.24);c.closePath();c.fill();}
  else if(sym==='cherry'){c.strokeStyle='#15803d';c.lineWidth=Math.max(1,s*.08);c.beginPath();c.moveTo(x-s*.2,y+s*.1);c.quadraticCurveTo(x,y-s*.4,x+s*.22,y-s*.42);c.moveTo(x+s*.18,y+s*.12);c.quadraticCurveTo(x+s*.1,y-s*.2,x+s*.22,y-s*.42);c.stroke();
    c.fillStyle='#dc2626';c.beginPath();c.arc(x-s*.2,y+s*.2,s*.2,0,TAU);c.arc(x+s*.2,y+s*.22,s*.2,0,TAU);c.fill();}
  else{c.fillStyle='#1f2937';rr(c,x-s*.42,y-s*.17,s*.84,s*.34,s*.06);c.fill();c.fillStyle='#fde68a';c.fillRect(x-s*.3,y-s*.05,s*.6,s*.1);}}

/* ---- Jackpot Juggernaut: walking war mech, missile pods on both shoulders, marquee chest ---- */
MACH.juggernaut=(c,r,o,t,atk)=>{
  const c1=o.c1,c2=o.c2;
  // heavy legs: thigh, knee, shin, wide foot
  for(const [sx,ph] of [[-1,0],[1,Math.PI]]){const sw=Math.sin(t*5+ph);c.save();c.translate(sx*r*.3,r*.04);c.rotate(sw*.08);
    c.fillStyle=GUN;rr(c,-r*.14,0,r*.28,r*.4,r*.07);c.fill();c.fillStyle=c1;c.fillRect(-r*.14,r*.06,r*.28,r*.05);
    c.translate(0,r*.4);c.fillStyle=shade(c1,-.35);c.beginPath();c.arc(0,0,r*.13,0,TAU);c.fill();c.rotate(-sw*.12);
    c.fillStyle=shade(c2,-.05);rr(c,-r*.15,r*.02,r*.3,r*.36,r*.06);c.fill();c.fillStyle=GOLDC;c.fillRect(-r*.15,r*.14,r*.3,r*.04);
    c.fillStyle=GUN;c.beginPath();c.moveTo(-r*.24,r*.5);c.lineTo(-r*.18,r*.36);c.lineTo(r*.2,r*.36);c.lineTo(r*.28,r*.5);c.closePath();c.fill();c.restore();}
  c.fillStyle=GUN;rr(c,-r*.46,-r*.04,r*.92,r*.2,r*.07);c.fill();
  // rocket pods raised on the shoulders, tips pointing up
  const pod=(sx)=>{c.save();c.translate(sx*r*.56,-r*.92);c.fillStyle=GUN;c.fillRect(-r*.05,r*.12,r*.1,r*.12);
    c.fillStyle=shade(c2,-.2);rr(c,-r*.25,-r*.12,r*.5,r*.28,r*.06);c.fill();c.fillStyle=GOLDC;c.fillRect(-r*.25,r*.1,r*.5,r*.05);
    for(let i=0;i<3;i++){const x=-r*.15+i*r*.15,gone=atk>.3&&i===1;if(gone)continue;c.fillStyle='#f8f5ec';c.fillRect(x-r*.05,-r*.18,r*.1,r*.12);
      c.fillStyle='#dc2626';c.beginPath();c.moveTo(x-r*.05,-r*.18);c.lineTo(x,-r*.3);c.lineTo(x+r*.05,-r*.18);c.closePath();c.fill();}
    c.restore();};
  pod(-1);pod(1);
  // chest
  c.fillStyle=c2;c.beginPath();c.moveTo(-r*.56,-r*.8);c.lineTo(r*.56,-r*.8);c.lineTo(r*.42,r*.02);c.lineTo(-r*.42,r*.02);c.closePath();c.fill();
  c.strokeStyle=GOLDC;c.lineWidth=Math.max(1.2,r*.06);c.stroke();
  // shoulder pauldrons
  for(const sx of [-1,1]){c.fillStyle=c1;c.beginPath();c.ellipse(sx*r*.54,-r*.72,r*.2,r*.13,sx*.3,0,TAU);c.fill();c.fillStyle=GOLDD;c.beginPath();c.arc(sx*r*.54,-r*.72,r*.04,0,TAU);c.fill();}
  // marquee
  const mx=-r*.34,my=-r*.62,mw=r*.68,mh=r*.34;c.fillStyle=INK;rr(c,mx,my,mw,mh,r*.06);c.fill();
  const pts=[];for(let k=0;k<6;k++){pts.push([mx+mw*k/5,my-r*.02]);pts.push([mx+mw*k/5,my+mh+r*.02]);}bulbs(c,pts,t,r*.032);
  for(let k=0;k<3;k++)drawSym(c,mx+mw*(k+.5)/3,my+mh/2,r*.26,atk>.2?['7','cherry','bar'][(Math.floor(t*14)+k)%3]:'7');
  c.fillStyle=GOLDC;rr(c,-r*.2,-r*.16,r*.4,r*.1,r*.04);c.fill();
  // head
  c.fillStyle=shade(c2,-.2);rr(c,-r*.2,-r*1.06,r*.4,r*.28,r*.08);c.fill();c.fillStyle='#22d3ee';rr(c,-r*.15,-r*.98,r*.3,r*.09,r*.04);c.fill();
  eye(c,-r*.07,-r*.935,r*.055);eye(c,r*.07,-r*.935,r*.055);crown(c,0,-r*1.06,r*.18,GOLDC);
  // gatling arm, forward
  c.save();c.translate(r*.6,-r*.5);c.fillStyle=c1;c.beginPath();c.arc(0,0,r*.15,0,TAU);c.fill();c.fillStyle=GUN;rr(c,-r*.04,-r*.02,r*.26,r*.34,r*.06);c.fill();
  c.translate(r*.1,r*.3);c.fillStyle=shade(c2,-.1);rr(c,-r*.1,-r*.1,r*.34,r*.2,r*.05);c.fill();
  const rec=atk*r*.08;for(let k=0;k<3;k++){c.fillStyle=k===1?'#6b7280':'#4b5160';c.fillRect(r*.22-rec,-r*.08+k*r*.06,r*.36,r*.045);}
  c.fillStyle=GOLDC;c.fillRect(r*.36-rec,-r*.1,r*.04,r*.2);
  if(atk>.5){c.fillStyle='#ffe28a';c.beginPath();c.moveTo(r*.6,0);c.lineTo(r*.76,-r*.08);c.lineTo(r*.72,0);c.lineTo(r*.76,r*.08);c.closePath();c.fill();}c.restore();
};

/* ---- Fort Knox: a columned bank on treads, vault door inside, gold on the roof ---- */
MACH.bank=(c,r,o,t,atk)=>{
  const stone='#ece6d8',stoneD='#c9c0ac';
  treadBase(c,r,r*1.9,r*.5,r*.42,t);
  // steps
  c.fillStyle=stoneD;c.fillRect(-r*.92,r*.38,r*1.84,r*.14);c.fillStyle=stone;c.fillRect(-r*.84,r*.27,r*1.68,r*.13);
  // dark interior + vault door
  c.fillStyle='#2a2f3b';c.fillRect(-r*.74,-r*.42,r*1.48,r*.7);
  const dx=0,dy=-r*.07,dr=r*.3;c.fillStyle='#6b7280';c.beginPath();c.arc(dx,dy,dr,0,TAU);c.fill();c.fillStyle='#9aa3b5';c.beginPath();c.arc(dx,dy,dr*.82,0,TAU);c.fill();
  c.strokeStyle='#4b5563';c.lineWidth=1;for(let k=0;k<12;k++){const a=k/12*TAU;c.beginPath();c.arc(dx+Math.cos(a)*dr*.91,dy+Math.sin(a)*dr*.91,dr*.05,0,TAU);c.stroke();}
  c.save();c.translate(dx,dy);c.rotate(t*.6+atk*2);c.strokeStyle='#3f4652';c.lineWidth=Math.max(1.2,r*.05);for(let k=0;k<4;k++){c.rotate(Math.PI/4);c.beginPath();c.moveTo(-dr*.5,0);c.lineTo(dr*.5,0);c.stroke();}
  c.fillStyle=GOLDC;c.beginPath();c.arc(0,0,dr*.16,0,TAU);c.fill();c.restore();
  // columns
  for(let k=0;k<4;k++){const x=-r*.66+k*r*.44;c.fillStyle=stone;c.fillRect(x-r*.07,-r*.42,r*.14,r*.7);c.fillStyle=stoneD;c.fillRect(x-r*.07,-r*.42,r*.03,r*.7);c.fillRect(x+r*.04,-r*.42,r*.02,r*.7);
    c.fillStyle=stone;c.fillRect(x-r*.1,-r*.46,r*.2,r*.06);c.fillRect(x-r*.1,r*.24,r*.2,r*.05);}
  // entablature + pediment
  c.fillStyle=stone;c.fillRect(-r*.86,-r*.58,r*1.72,r*.14);c.fillStyle=GOLDC;c.fillRect(-r*.86,-r*.47,r*1.72,r*.03);
  c.fillStyle=stone;c.beginPath();c.moveTo(-r*.92,-r*.58);c.lineTo(0,-r*.98);c.lineTo(r*.92,-r*.58);c.closePath();c.fill();c.strokeStyle=stoneD;c.lineWidth=1;c.stroke();
  // eyes in the pediment
  eye(c,-r*.13,-r*.71,r*.08);eye(c,r*.13,-r*.71,r*.08);
  // gold bars stacked on the roof
  const bar=(x,y)=>{c.fillStyle=GOLDD;c.beginPath();c.moveTo(x-r*.15,y);c.lineTo(x+r*.15,y);c.lineTo(x+r*.11,y-r*.1);c.lineTo(x-r*.11,y-r*.1);c.closePath();c.fill();
    c.fillStyle=GOLDC;c.beginPath();c.moveTo(x-r*.13,y-r*.01);c.lineTo(x+r*.13,y-r*.01);c.lineTo(x+r*.1,y-r*.09);c.lineTo(x-r*.1,y-r*.09);c.closePath();c.fill();};
  bar(-r*.15,-r*.94);bar(r*.15,-r*.94);bar(0,-r*1.04);
  c.fillStyle='#fff8d6';c.beginPath();c.arc(-r*.2+Math.sin(t*3)*r*.02,-r*1.0,r*.025,0,TAU);c.fill();
};

/* ---- One-Armed Bandit: outlaw slot machine, hat, bandana, boots, one giant lever ---- */
MACH.bandit=(c,r,o,t,atk)=>{
  const wood='#6b3a1e',woodD='#4a2612',brass='#d4a12a';
  // boots
  for(const [sx,ph] of [[-1,0],[1,Math.PI]]){const sw=Math.sin(t*8+ph)*r*.07;c.fillStyle='#3a2312';rr(c,sx*r*.26-r*.1+sw,r*.3,r*.2,r*.42,r*.05);c.fill();
    c.fillStyle='#2a1a0c';rr(c,sx*r*.26-r*.12+sw,r*.62,r*.32,r*.13,r*.05);c.fill();c.fillStyle='#cbd5e1';c.beginPath();c.arc(sx*r*.26-r*.13+sw,r*.68,r*.05,0,TAU);c.fill();}
  // the one huge arm: a lever taller than the bandit
  const pull=atk;c.save();c.translate(r*.62,-r*.25);c.fillStyle=brass;rr(c,-r*.06,-r*.1,r*.2,r*.3,r*.05);c.fill();
  c.fillStyle='#d6dbe4';c.save();c.rotate(pull*1.1);c.fillRect(r*.02,-r*1.02,r*.11,r*1.02);c.fillStyle='#dc2626';c.beginPath();c.arc(r*.075,-r*1.08,r*.2,0,TAU);c.fill();
  c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.arc(r*.01,-r*1.14,r*.06,0,TAU);c.fill();c.restore();c.restore();
  // cabinet
  c.fillStyle=woodD;rr(c,-r*.58,-r*.78,r*1.16,r*1.12,r*.12);c.fill();c.fillStyle=wood;rr(c,-r*.52,-r*.72,r*1.04,r*1.0,r*.1);c.fill();
  c.strokeStyle=brass;c.lineWidth=Math.max(1,r*.05);rr(c,-r*.52,-r*.72,r*1.04,r*1.0,r*.1);c.stroke();
  // eyes + mean brows
  eye(c,-r*.17,-r*.5,r*.11);eye(c,r*.17,-r*.5,r*.11);c.strokeStyle=INK;c.lineWidth=Math.max(1.2,r*.07);c.lineCap='round';
  c.beginPath();c.moveTo(-r*.3,-r*.66);c.lineTo(-r*.06,-r*.6);c.moveTo(r*.3,-r*.66);c.lineTo(r*.06,-r*.6);c.stroke();
  // bandana over the lower face, knot flapping
  c.fillStyle='#b91c1c';c.beginPath();c.moveTo(-r*.54,-r*.38);c.lineTo(r*.54,-r*.38);c.lineTo(r*.46,-r*.24);c.lineTo(0,-r*.06);c.lineTo(-r*.46,-r*.24);c.closePath();c.fill();
  c.fillStyle='#fde68a';for(const [x,y] of [[-r*.25,-r*.28],[r*.25,-r*.28],[0,-r*.18]]){c.beginPath();c.arc(x,y,r*.03,0,TAU);c.fill();}
  c.fillStyle='#991b1b';c.beginPath();c.moveTo(-r*.54,-r*.36);c.lineTo(-r*.82,-r*.42+Math.sin(t*9)*r*.06);c.lineTo(-r*.78,-r*.26+Math.sin(t*9+1)*r*.05);c.closePath();c.fill();
  // reels on the chest
  for(let k=0;k<3;k++)reel(c,-r*.28+k*r*.28,r*.04,r*.22,r*.3,['7','bar','cherry'][k],atk>.2,t+k*.13);
  // gun belt
  c.fillStyle='#2a1a0c';c.fillRect(-r*.58,r*.22,r*1.16,r*.1);c.fillStyle=brass;for(let k=0;k<6;k++)c.fillRect(-r*.48+k*r*.17,r*.235,r*.05,r*.07);
  // cowboy hat
  c.fillStyle='#3f2a17';c.beginPath();c.ellipse(0,-r*.8,r*.82,r*.13,0,0,TAU);c.fill();
  c.fillStyle='#54381e';c.beginPath();c.moveTo(-r*.4,-r*.82);c.quadraticCurveTo(-r*.42,-r*1.22,-r*.12,-r*1.18);c.quadraticCurveTo(0,-r*1.08,r*.12,-r*1.18);c.quadraticCurveTo(r*.42,-r*1.22,r*.4,-r*.82);c.closePath();c.fill();
  c.fillStyle='#b91c1c';c.fillRect(-r*.4,-r*.92,r*.8,r*.08);
};

/* ---- Storm Engine: Tesla-coil tower on treads, crackling arcs ---- */
MACH.tesla=(c,r,o,t,atk)=>{
  const c1=o.c1,cu='#c2703d',cuL='#e3a06c';
  treadBase(c,r,r*1.7,r*.42,r*.44,t);
  // drum body with plasma window
  c.fillStyle=shade(c1,-.1);rr(c,-r*.56,-r*.4,r*1.12,r*.86,r*.16);c.fill();
  for(const y of [-r*.32,r*.32]){c.fillStyle=cu;c.fillRect(-r*.56,y-r*.04,r*1.12,r*.08);}
  const g=c.createRadialGradient(0,r*.02,1,0,r*.02,r*.3);g.addColorStop(0,'#fdf4ff');g.addColorStop(.5,o.c2);g.addColorStop(1,shade(c1,-.3));c.fillStyle=g;
  rr(c,-r*.3,-r*.2,r*.6,r*.42,r*.1);c.fill();c.strokeStyle='#e9d5ff';c.lineWidth=1;c.beginPath();for(let k=0;k<6;k++){const x=-r*.24+k*r*.096,y=r*.02+Math.sin(t*20+k*2)*r*.12;k?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
  eye(c,-r*.4,-r*.08,r*.07);eye(c,r*.4,-r*.08,r*.07);
  // insulator arms
  for(const sx of [-1,1]){for(let k=0;k<3;k++){c.fillStyle=k%2?'#e7e5e4':'#f5f5f4';c.beginPath();c.ellipse(sx*(r*.68+k*r*.1),-r*.18-k*r*.08,r*.07,r*.05,0,0,TAU);c.fill();}}
  // coil tower
  c.fillStyle=GUN;c.fillRect(-r*.12,-r*.98,r*.24,r*.6);
  for(let k=0;k<7;k++){const y=-r*.44-k*r*.08,w=r*(.34-k*.025);c.fillStyle=k%2?cu:cuL;rr(c,-w,y-r*.035,w*2,r*.07,r*.03);c.fill();}
  // top sphere
  const sy=-r*1.1;const sg=c.createRadialGradient(-r*.06,sy-r*.06,1,0,sy,r*.22);sg.addColorStop(0,'#fff');sg.addColorStop(1,'#9aa3b5');c.fillStyle=sg;c.beginPath();c.arc(0,sy,r*.2,0,TAU);c.fill();
  // arcs
  const n=atk>.2?5:2;c.strokeStyle=o.beam||'#e9d5ff';c.lineWidth=atk>.2?1.8:1.1;c.shadowColor=o.c2;c.shadowBlur=6;
  for(let k=0;k<n;k++){const a=-Math.PI/2+Math.sin(t*3+k*2.1)*1.3,len=r*(.38+((t*7+k)%1)*.3);let x=Math.cos(a)*r*.2,y=sy+Math.sin(a)*r*.2;c.beginPath();c.moveTo(x,y);
    for(let j=1;j<=4;j++){const f=j/4;x=Math.cos(a)*(r*.2+len*f)+Math.sin(t*40+k*5+j*3)*r*.06;y=sy+Math.sin(a)*(r*.2+len*f)+Math.cos(t*37+k*3+j*2)*r*.06;c.lineTo(x,y);}c.stroke();}
  c.shadowBlur=0;
};

/* ---- Jackpot Machine: tall casino cabinet, chase-light marquee, spider legs, two levers ---- */
MACH.cabinet=(c,r,o,t,atk)=>{
  const c1=o.c1,c2=o.c2;
  // six spindly chrome legs
  c.lineCap='round';for(const [sx,ph] of [[-1,0],[-.55,2],[-.15,4],[.15,1],[.55,3],[1,5]]){const lift=Math.max(0,Math.sin(t*7+ph))*r*.12;c.strokeStyle=sx<0?'#7b8494':'#a5adbd';c.lineWidth=Math.max(1.3,r*.07);
    c.beginPath();c.moveTo(sx*r*.36,r*.32);c.lineTo(sx*r*.86,r*.38-lift);c.lineTo(sx*r*1.0,r*.92-lift*.4);c.stroke();}
  // levers both sides
  for(const sx of [-1,1]){c.save();c.translate(sx*r*.5,-r*.1);c.fillStyle='#cbd5e1';const p=atk*r*.4;c.fillRect(sx*r*.04-r*.03,-r*.62+p,r*.06,r*.62-p);c.fillStyle='#dc2626';c.beginPath();c.arc(sx*r*.04,-r*.66+p,r*.11,0,TAU);c.fill();c.restore();}
  // tall cabinet
  c.fillStyle=shade(c1,-.3);rr(c,-r*.46,-r*1.0,r*.92,r*1.42,r*.1);c.fill();c.fillStyle=c1;rr(c,-r*.42,-r*.96,r*.84,r*1.34,r*.08);c.fill();
  // arched marquee
  c.fillStyle=INK;c.beginPath();c.moveTo(-r*.38,-r*.62);c.lineTo(-r*.38,-r*.84);c.quadraticCurveTo(0,-r*1.16,r*.38,-r*.84);c.lineTo(r*.38,-r*.62);c.closePath();c.fill();
  const pts=[];for(let k=0;k<=8;k++){const a=Math.PI+k/8*Math.PI;pts.push([Math.cos(a)*r*.36,-r*.82+Math.sin(a)*r*.22]);}bulbs(c,pts,t,r*.04);
  eye(c,-r*.12,-r*.76,r*.08);eye(c,r*.12,-r*.76,r*.08);
  // big reel window
  c.fillStyle=c2;rr(c,-r*.38,-r*.56,r*.76,r*.46,r*.06);c.fill();
  for(let k=0;k<3;k++)reel(c,-r*.24+k*r*.24,-r*.33,r*.2,r*.36,['7','7','7'][k],atk>.2,t+k*.17);
  c.strokeStyle='#dc2626';c.lineWidth=1;c.beginPath();c.moveTo(-r*.38,-r*.33);c.lineTo(r*.38,-r*.33);c.stroke();
  // pay panel + coin tray with spilling coins
  c.fillStyle=shade(c1,-.15);rr(c,-r*.34,-r*.04,r*.68,r*.2,r*.04);c.fill();c.fillStyle='#fde68a';c.fillRect(-r*.24,r*.03,r*.48,r*.05);
  c.fillStyle=STEEL;rr(c,-r*.32,r*.2,r*.64,r*.16,r*.05);c.fill();c.fillStyle=INK;rr(c,-r*.26,r*.23,r*.52,r*.08,r*.03);c.fill();
  c.fillStyle=GOLDC;for(let k=0;k<4;k++){c.beginPath();c.ellipse(-r*.16+k*r*.11,r*.27,r*.05,r*.025,0,0,TAU);c.fill();}
};

/* ---- tanks ---- */
function rouletteTurret(c,x,y,r,c1,c2,t,atk,twin){
  const rec=atk*r*.15;c.fillStyle=GUN;rr(c,x+r*.1-rec,y-r*.3,r*(twin?.8:1.05),r*.12,r*.04);c.fill();c.fillStyle='#4b5160';c.fillRect(x+r*(twin?.82:1.07)-rec,y-r*.32,r*.1,r*.16);
  c.fillStyle=shade(c1,-.2);c.beginPath();c.arc(x,y,r*.42,Math.PI,TAU);c.fill();c.fillStyle='#3b2412';c.beginPath();c.arc(x,y-r*.18,r*.33,0,TAU);c.fill();
  c.save();c.translate(x,y-r*.18);c.rotate(t*(atk>.2?10:2));for(let k=0;k<12;k++){c.fillStyle=k===0?'#16a34a':k%2?c2:'#111';c.beginPath();c.moveTo(0,0);c.arc(0,0,r*.28,k*TAU/12,(k+1)*TAU/12);c.closePath();c.fill();}
  c.fillStyle='#3b2412';c.beginPath();c.arc(0,0,r*.13,0,TAU);c.fill();c.restore();c.strokeStyle='#d4a12a';c.lineWidth=1.5;c.beginPath();c.arc(x,y-r*.18,r*.3,0,TAU);c.stroke();}

/* Roulette Tank: compact, tall hull with a green felt deck and a betting-grid skirt */
MACH.feltTank=(c,r,o,t,atk)=>{
  const c1=o.c1,c2=o.c2;
  treadBase(c,r,r*1.75,r*.22,r*.56,t);
  // hull
  c.fillStyle=shade(c1,-.25);c.beginPath();c.moveTo(-r*.86,r*.24);c.lineTo(-r*.72,-r*.22);c.lineTo(r*.62,-r*.22);c.lineTo(r*.92,r*.24);c.closePath();c.fill();
  // felt deck with a betting grid
  c.fillStyle='#15803d';c.beginPath();c.moveTo(-r*.7,-r*.14);c.lineTo(r*.6,-r*.14);c.lineTo(r*.74,r*.12);c.lineTo(-r*.8,r*.12);c.closePath();c.fill();
  c.fillStyle='#16a34a';c.fillRect(-r*.66,-r*.1,r*.14,r*.18);
  for(let k=0;k<8;k++){c.fillStyle=k%2?'#111':'#b91c1c';c.fillRect(-r*.48+k*r*.14,-r*.1,r*.12,r*.09);c.fillStyle=k%2?'#b91c1c':'#111';c.fillRect(-r*.48+k*r*.14,0,r*.12,r*.08);}
  c.strokeStyle='#f8f5ec';c.lineWidth=.8;c.strokeRect(-r*.66,-r*.1,r*1.3,r*.18);
  c.strokeStyle=GOLDC;c.lineWidth=1.4;c.beginPath();c.moveTo(-r*.72,-r*.22);c.lineTo(r*.62,-r*.22);c.stroke();
  // headlight + stubby antenna with a chip
  c.fillStyle='#fde68a';c.beginPath();c.arc(r*.86,r*.12,r*.06,0,TAU);c.fill();
  c.strokeStyle='#4b5160';c.lineWidth=1;c.beginPath();c.moveTo(-r*.6,-r*.22);c.lineTo(-r*.7,-r*.7);c.stroke();
  c.save();c.translate(-r*.7,-r*.72);chipDisc(c,r*.1,'#dc2626','#fff',0);c.restore();
  if(!NO_TURRET)rouletteTurret(c,r*.02,-r*.22,r,c1,c2,t,atk,false);
  // commander die
  const hx=-r*.42,hy=-r*.26;c.fillStyle='#f8f5ec';rr(c,hx-r*.12,hy-r*.24,r*.24,r*.24,r*.06);c.fill();eye(c,hx-r*.05,hy-r*.13,r*.05);eye(c,hx+r*.05,hy-r*.13,r*.05);
};

/* Roulette Dreadnought: long ironclad, raised rear turret on a bridge, smokestacks, ram bow */
MACH.dreadTank=(c,r,o,t,atk)=>{
  const c1=o.c1,c2=o.c2;
  // two track bogies
  for(const sx of [-1,1]){c.save();c.translate(sx*r*.62,0);treadBase(c,r,r*.98,r*.36,r*.44,t);c.restore();}
  // armoured hull with a ram bow
  c.fillStyle=c1;c.beginPath();c.moveTo(-r*1.22,r*.4);c.lineTo(-r*1.12,-r*.06);c.lineTo(r*.96,-r*.06);c.lineTo(r*1.32,r*.12);c.lineTo(r*1.08,r*.4);c.closePath();c.fill();
  c.fillStyle=c2;c.fillRect(-r*1.16,r*.16,r*2.28,r*.07);
  c.fillStyle=shade(c1,.25);for(let k=0;k<10;k++){c.beginPath();c.arc(-r*1.0+k*r*.22,r*.03,r*.03,0,TAU);c.fill();}
  // chip-emblem armour plates
  for(const x of [-r*.7,r*.5]){c.save();c.translate(x,r*.3);chipDisc(c,r*.1,'#111',c2,0);c.restore();}
  c.strokeStyle=GOLDC;c.lineWidth=1.5;c.beginPath();c.moveTo(-r*1.12,-r*.06);c.lineTo(r*.96,-r*.06);c.stroke();
  // bridge superstructure (rear) with windows
  c.fillStyle=shade(c1,-.15);rr(c,-r*.82,-r*.38,r*.62,r*.34,r*.05);c.fill();c.fillStyle='#fde68a';for(let k=0;k<4;k++)c.fillRect(-r*.76+k*r*.14,-r*.3,r*.08,r*.06);
  eye(c,-r*.66,-r*.16,r*.05);eye(c,-r*.52,-r*.16,r*.05);
  // smokestacks with puffs
  for(const [x,h] of [[-r*.02,r*.46],[r*.18,r*.38]]){c.fillStyle='#374151';c.fillRect(x-r*.07,-r*.06-h,r*.14,h);c.fillStyle=c2;c.fillRect(x-r*.07,-r*.06-h,r*.14,r*.05);
    for(let k=0;k<2;k++){const ph=(t*.8+k*.5+x)%1;c.fillStyle=`rgba(120,110,130,${.5*(1-ph)})`;c.beginPath();c.arc(x-ph*r*.3,-r*.06-h-ph*r*.4,r*(.06+ph*.08),0,TAU);c.fill();}}
  // flag
  c.strokeStyle='#4b5160';c.lineWidth=1;c.beginPath();c.moveTo(-r*1.0,-r*.06);c.lineTo(-r*1.06,-r*.86);c.stroke();c.fillStyle=c2;c.beginPath();c.moveTo(-r*1.06,-r*.86);c.lineTo(-r*1.06+r*(.32+Math.sin(t*9)*.05),-r*.78);c.lineTo(-r*1.06,-r*.7);c.fill();
  if(!NO_TURRET){const T=tankTurrets(o,r);for(const [x,y] of T)rouletteTurret(c,x,y,r,c1,c2,t,atk,true);}
};
