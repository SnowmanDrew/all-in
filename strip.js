'use strict';
/* ============ ALL IN — the Strip: buildings, street dressing and ambient life ============
   Static detail is baked into the background once (drawBuilding / dressStreet, called from buildBg).
   Living detail (neon that flickers, chase lights, pedestrians, searchlights, steam) is drawn
   every frame by drawStrip(), straight after the background. */

const STRIP={
  motel:{name:'MOTEL',awn:['#f59e0b','#fde68a'],wall:'#3a2a1c'},
  chapel:{name:'WEDDINGS',awn:['#ff3d9a','#fde2ef'],wall:'#3a2238'},
  arcade:{name:'ARCADE',awn:['#22e1ff','#1e3a8a'],wall:'#1c2340',bulbs:true},
  pawn:{name:'PAWN',awn:['#b45309','#fef3c7'],wall:'#33261c'},
  diner:{name:'DINER',awn:['#b6f84a','#14532d'],wall:'#1f2d24'},
  lounge:{name:'LOUNGE',awn:['#7c3aed','#ede9fe'],wall:'#2a1838'},
  hotel:{name:'HOTEL',awn:['#be123c','#fecdd3'],wall:'#3a1c26',bulbs:true},
  cinema:{name:'DRIVE-IN',awn:['#e5e7eb','#374151'],wall:'#24242c',bulbs:true}};
const FH=12; // facade depth facing the road

function bRect(o){const x=o.c*TILE,y=o.r*TILE,w=o.w*TILE,h=o.h*TILE,top=o.r===0;
  return {x,y,w,h,top,fy:top?y+h-FH:y,ry:top?y:y+FH,rh:h-FH,edge:top?y+h:y,dir:top?1:-1};}

/* ---------- static: buildings ---------- */
function drawBuilding(b,o){
  const st=OBST_STYLE[o.k],S=STRIP[o.k]||{},R=bRect(o),{x,y,w,h,top,fy,ry,rh}=R;
  // drop shadow onto the street
  b.save();b.shadowColor='rgba(0,0,0,.75)';b.shadowBlur=18;b.shadowOffsetY=top?7:-7;b.fillStyle='#0d0a12';b.fillRect(x+1,y+1,w-2,h-2);b.restore();
  // roof: base, gravel speckle, parapet
  b.fillStyle=st.roof;b.fillRect(x+1,ry,w-2,rh);
  for(let i=0;i<w*rh/14;i++){b.fillStyle=srnd()<.5?'rgba(0,0,0,.16)':'rgba(255,255,255,.04)';b.fillRect(x+2+srnd()*(w-4),ry+srnd()*rh,1.2,1.2);}
  b.strokeStyle=shade(st.roof,.18);b.lineWidth=3;b.strokeRect(x+2.5,ry+1.5,w-5,rh-3);
  b.strokeStyle='rgba(0,0,0,.35)';b.lineWidth=1;b.strokeRect(x+4.5,ry+3.5,w-9,rh-7);
  ROOF[o.k]&&ROOF[o.k](b,o,R,st,S);
  // facade: wall, lit windows, a door with light pouring out
  b.fillStyle=S.wall||shade(st.roof,-.35);b.fillRect(x+1,fy,w-2,FH);
  b.fillStyle='rgba(0,0,0,.35)';b.fillRect(x+1,top?fy:fy+FH-2,w-2,2);
  const door=x+w*.84;const nWin=Math.floor((w-16)/11);
  for(let i=0;i<nWin;i++){const wx=x+8+i*11;if(Math.abs(wx+3-door)<9)continue;const lit=srnd()<.75;b.fillStyle=lit?(srnd()<.5?'#ffd27a':'#ffe9c2'):'#1a1420';b.fillRect(wx,fy+3,6,FH-6);
    if(lit){b.fillStyle='rgba(0,0,0,.3)';b.fillRect(wx+2.6,fy+3,.8,FH-6);}}
  b.fillStyle='#fff2c8';b.fillRect(door-5,fy+2,10,FH-4);b.fillStyle='rgba(120,70,20,.5)';b.fillRect(door-.5,fy+2,1,FH-4);
  // awning over the sidewalk: stripes and a scalloped edge
  const aw=Math.min(w-14,Math.max(40,w*.62)),ax=x+(w-aw)/2,ay=top?y+h:y-7,ah=7;
  for(let i=0;i<aw;i+=6){b.fillStyle=(i/6)%2?S.awn[1]:S.awn[0];b.fillRect(ax+i,ay,Math.min(6,aw-i),ah);}
  b.fillStyle='rgba(0,0,0,.25)';b.fillRect(ax,top?ay+ah-2:ay,aw,2);
  b.fillStyle=S.awn[0];for(let i=0;i<aw;i+=6){b.beginPath();b.arc(ax+i+3,top?ay+ah:ay,3,top?0:Math.PI,top?Math.PI:TAU);b.fill();}
  // door light spilling onto the pavement
  b.save();b.globalCompositeOperation='lighter';const gy=top?y+h+10:y-10,g=b.createRadialGradient(door,gy,2,door,gy,34);g.addColorStop(0,'rgba(255,214,140,.24)');g.addColorStop(1,'rgba(255,214,140,0)');b.fillStyle=g;b.fillRect(door-36,gy-36,72,72);b.restore();
  // neon tube along the facade edge
  b.strokeStyle=hexA(st.col,.55);b.lineWidth=1.5;b.beginPath();b.moveTo(x+4,top?y+h-1:y+1);b.lineTo(x+w-4,top?y+h-1:y+1);b.stroke();
}
const ROOF={
  motel(b,o,R){const {x,ry,w,rh}=R;const px=x+w-62,py=ry+rh-34,pw=46,ph=24;
    b.fillStyle='#d8d2c4';rr(b,px-4,py-4,pw+8,ph+8,6);b.fill();const g=b.createLinearGradient(px,py,px+pw,py+ph);g.addColorStop(0,'#5fe4ff');g.addColorStop(1,'#1677a8');b.fillStyle=g;rr(b,px,py,pw,ph,5);b.fill();
    b.strokeStyle='rgba(255,255,255,.45)';b.lineWidth=1;for(let k=0;k<3;k++){b.beginPath();b.moveTo(px+6+k*12,py+8+k*3);b.quadraticCurveTo(px+11+k*12,py+5+k*3,px+16+k*12,py+8+k*3);b.stroke();}
    for(let k=0;k<3;k++){b.fillStyle=['#f472b6','#fbbf24','#22d3ee'][k];b.fillRect(px-20,py+2+k*8,10,5);}
    b.fillStyle='#3b3546';b.fillRect(x+12,ry+rh-22,12,10);b.fillStyle='#22d3ee';b.fillRect(x+14,ry+rh-20,8,2);},
  chapel(b,o,R){const {x,ry,w,rh}=R;const cx=x+w*.28,cy=ry+rh*.42;
    b.fillStyle='#4a3a52';b.beginPath();b.moveTo(cx,cy-13);b.lineTo(cx+11,cy);b.lineTo(cx,cy+13);b.lineTo(cx-11,cy);b.closePath();b.fill();
    b.fillStyle='#f5f0e6';b.fillRect(cx-1.2,cy-8,2.4,16);b.fillRect(cx-5,cy-4,10,2.4);
    const hx=x+w*.68,hy=ry+rh*.45;b.fillStyle='#2a1530';b.beginPath();b.arc(hx,hy,11,0,TAU);b.fill();
    b.save();b.translate(hx-7,hy-7);b.scale(.14,.14);b.fillStyle='#ff6bb5';b.fill(new Path2D(SUIT_PATH.H));b.restore();
    b.strokeStyle='#ffd1e6';b.lineWidth=.8;b.beginPath();b.arc(hx,hy,11,0,TAU);b.stroke();},
  arcade(b,o,R){const {x,ry,w,rh}=R;for(let i=0;i<5;i++)for(let j=0;j<2;j++){const sx=x+16+i*(w-32)/4.4,sy=ry+12+j*24;b.fillStyle='#0e1430';b.fillRect(sx-1,sy-1,20,14);b.fillStyle=(i+j)%2?'rgba(34,225,255,.55)':'rgba(255,61,154,.5)';b.fillRect(sx,sy,18,12);
      b.strokeStyle='rgba(0,0,0,.5)';b.lineWidth=1;b.beginPath();b.moveTo(sx+9,sy);b.lineTo(sx+9,sy+12);b.stroke();}},
  pawn(b,o,R){const {x,ry,w,rh}=R;for(let i=0;i<2;i++){const sx=x+14+i*(w-48),sy=ry+10;b.fillStyle='#1a1410';b.fillRect(sx,sy,20,16);b.fillStyle='rgba(255,210,122,.35)';b.fillRect(sx+1,sy+1,18,14);
      b.strokeStyle='#3d3128';b.lineWidth=1.5;for(let k=1;k<5;k++){b.beginPath();b.moveTo(sx+k*4,sy);b.lineTo(sx+k*4,sy+16);b.stroke();}}
    b.fillStyle='#3b3546';b.fillRect(x+w*.5-8,ry+8,16,12);b.fillStyle='#2a2533';b.fillRect(x+w*.5-6,ry+10,12,8);},
  diner(b,o,R){const {x,ry,w,rh}=R;const g=b.createLinearGradient(0,ry,0,ry+rh);g.addColorStop(0,'#cfd6e2');g.addColorStop(.5,'#8d96a8');g.addColorStop(1,'#5b6474');
    b.fillStyle=g;rr(b,x+6,ry+5,w-12,rh-10,12);b.fill();b.strokeStyle='rgba(255,255,255,.35)';b.lineWidth=1;for(let k=0;k<6;k++){const yy=ry+10+k*(rh-20)/5;b.beginPath();b.moveTo(x+12,yy);b.lineTo(x+w-12,yy);b.stroke();}
    b.fillStyle='#14532d';b.fillRect(x+6,ry+rh*.46,w-12,4);b.fillStyle='#b6f84a';b.fillRect(x+6,ry+rh*.46+1,w-12,1.2);},
  lounge(b,o,R){const {x,ry,w,rh}=R;const cx=x+w*.78,cy=ry+rh*.5;b.fillStyle='#1c1028';b.beginPath();b.arc(cx,cy,14,0,TAU);b.fill();b.strokeStyle='#c4b5fd';b.lineWidth=1.5;b.beginPath();b.arc(cx,cy,14,0,TAU);b.stroke();
    b.fillStyle='#7c3aed';b.beginPath();b.arc(cx,cy,6,0,TAU);b.fill();for(let k=0;k<6;k++){const a=k/6*TAU;b.fillStyle='#e9d5ff';b.beginPath();b.arc(cx+Math.cos(a)*19,cy+Math.sin(a)*19,2.2,0,TAU);b.fill();}
    b.fillStyle='#3b3546';b.fillRect(x+16,ry+12,14,10);},
  hotel(b,o,R){const {x,ry,w,rh}=R;const hx=x+w*.22,hy=ry+rh*.5;b.fillStyle='#3a3a44';b.beginPath();b.arc(hx,hy,15,0,TAU);b.fill();b.strokeStyle='#fde68a';b.lineWidth=1.5;b.beginPath();b.arc(hx,hy,12,0,TAU);b.stroke();
    b.fillStyle='#fde68a';b.font='900 13px Bungee,Impact,sans-serif';b.textAlign='center';b.textBaseline='middle';b.fillText('H',hx,hy+1);
    b.fillStyle='#5b5560';b.beginPath();b.arc(x+w*.5,ry+rh*.32,8,0,TAU);b.fill();b.fillStyle='#45404d';b.beginPath();b.arc(x+w*.5,ry+rh*.32,5,0,TAU);b.fill();
    const px=x+w-48,py=ry+8,g=b.createLinearGradient(px,py,px+36,py+20);g.addColorStop(0,'#5fe4ff');g.addColorStop(1,'#1677a8');b.fillStyle='#e7e2d6';rr(b,px-3,py-3,42,26,5);b.fill();b.fillStyle=g;rr(b,px,py,36,20,4);b.fill();},
  cinema(b,o,R){const {x,ry,w,rh,top}=R;// drive-in: screen at the back, cars parked facing it
    const sy=top?ry+3:ry+rh-9;b.fillStyle='#e8e4dc';b.fillRect(x+8,sy,w-16,6);b.fillStyle='#4b4558';b.fillRect(x+8,top?sy+6:sy-2,w-16,2);
    const cols=['#dc2626','#2563eb','#f59e0b','#16a34a','#e5e7eb','#7c3aed'];let k=0;
    for(let j=0;j<2;j++)for(let i=0;i<4;i++){const cx=x+14+i*(w-28)/3,cy=top?ry+18+j*14:ry+rh-24-j*14;b.fillStyle='rgba(0,0,0,.4)';b.fillRect(cx-4,cy-2.5,9,7);b.fillStyle=cols[(k++)%cols.length];rr(b,cx-4.5,cy-3.5,9,7,2);b.fill();b.fillStyle='rgba(180,220,255,.6)';b.fillRect(cx-3,top?cy-2.5:cy+1,6,1.6);}}};

/* ---------- static: street dressing ---------- */
function dressStreet(b){
  const curbT=3.6*TILE,curbB=16.4*TILE,x0=130,x1=34*TILE-10;
  const blocked=(x,y,r)=>OBST.some(o=>x>o.c*TILE-r&&x<(o.c+o.w)*TILE+r&&y>o.r*TILE-r&&y<(o.r+o.h)*TILE+r)||x>(BASE.c0-1.5)*TILE;
  // oil stains and tyre marks
  for(let i=0;i<26;i++){const x=x0+srnd()*(x1-x0),y=curbT+20+srnd()*(curbB-curbT-40);if(blocked(x,y,16))continue;b.fillStyle=`rgba(0,0,0,${.12+srnd()*.12})`;b.beginPath();b.ellipse(x,y,6+srnd()*10,3+srnd()*5,srnd()*3,0,TAU);b.fill();}
  b.strokeStyle='rgba(0,0,0,.22)';b.lineWidth=2.2;for(const [sx,sy] of [[14.2*TILE,7.4*TILE],[24*TILE,12.6*TILE]]){for(const d of [0,7]){b.beginPath();b.moveTo(sx-40,sy+d);b.bezierCurveTo(sx-10,sy+d-4,sx+10,sy+d+6,sx+42,sy+d+2);b.stroke();}}
  // puddles catching the neon
  for(const [px,py,rx,col] of [[7.5*TILE,13.2*TILE,26,NEON.pink],[22.4*TILE,6.2*TILE,22,NEON.cyan],[31.5*TILE,14.6*TILE,18,NEON.amber],[13.6*TILE,15*TILE,16,NEON.violet]]){
    b.fillStyle='rgba(8,10,20,.55)';b.beginPath();b.ellipse(px,py,rx,rx*.42,0,0,TAU);b.fill();
    const g=b.createLinearGradient(px-rx,py,px+rx,py);g.addColorStop(0,hexA(col,0));g.addColorStop(.5,hexA(col,.35));g.addColorStop(1,hexA(col,0));b.fillStyle=g;b.beginPath();b.ellipse(px,py,rx*.85,rx*.3,0,0,TAU);b.fill();
    b.strokeStyle='rgba(255,255,255,.12)';b.lineWidth=1;b.beginPath();b.ellipse(px,py,rx,rx*.42,0,Math.PI*1.1,Math.PI*1.6);b.stroke();}
  // manhole covers
  for(const [mx,my] of STRIP_STEAM){b.fillStyle='#1c1a22';b.beginPath();b.arc(mx,my,8,0,TAU);b.fill();b.strokeStyle='#3a3644';b.lineWidth=1.2;b.beginPath();b.arc(mx,my,7,0,TAU);b.stroke();
    b.strokeStyle='#2c2934';b.lineWidth=1;for(let k=-2;k<=2;k++){b.beginPath();b.moveTo(mx-6,my+k*2.6);b.lineTo(mx+6,my+k*2.6);b.stroke();}}
  // storm drains and hydrants along both curbs
  for(let xx=200;xx<x1;xx+=230){for(const [cy,d] of [[curbT,1],[curbB,-1]]){if(blocked(xx,cy+d*6,4))continue;b.fillStyle='#121016';b.fillRect(xx-9,cy+d*2-(d<0?5:0),18,5);b.strokeStyle='#3a3644';b.lineWidth=1;for(let k=0;k<5;k++){b.beginPath();b.moveTo(xx-7+k*3.5,cy+d*2-(d<0?5:0));b.lineTo(xx-7+k*3.5,cy+d*2+(d>0?5:0));b.stroke();}}}
  for(let xx=255;xx<x1;xx+=310){for(const [cy,d] of [[curbT-5,1],[curbB+5,-1]]){if(blocked(xx,cy,3))continue;b.fillStyle='rgba(0,0,0,.45)';b.beginPath();b.ellipse(xx+2,cy+2,4,3,0,0,TAU);b.fill();b.fillStyle='#b91c1c';b.beginPath();b.arc(xx,cy,2.4,0,TAU);b.fill();b.fillStyle='#7f1d1d';b.fillRect(xx-3.4,cy-.7,6.8,1.4);b.fillStyle='#fca5a5';b.beginPath();b.arc(xx-.6,cy-.6,.8,0,TAU);b.fill();}}
  // painted parking bays in the gaps between buildings
  const gaps=[];for(const row of [0,1]){const bs=OBST.filter(o=>row?o.r>=17:o.r===0).sort((a,b)=>a.c-b.c);for(let i=0;i<bs.length-1;i++){const gx0=(bs[i].c+bs[i].w)*TILE,gx1=bs[i+1].c*TILE;if(gx1-gx0>=60)gaps.push([gx0,gx1,row]);}}
  for(const [g0,g1,row] of gaps){b.strokeStyle='rgba(255,255,255,.14)';b.lineWidth=1.5;const yA=row?16.6*TILE+4:4,yB=row?H-4:3.4*TILE-4;for(let xx=g0+8;xx<=g1-8;xx+=18){b.beginPath();b.moveTo(xx,row?yB-24:yA);b.lineTo(xx,row?yB:yA+24);b.stroke();}}
}
const STRIP_STEAM=[[9*TILE,5.2*TILE],[26.5*TILE,14.8*TILE],[16.4*TILE,13.6*TILE]];

/* ---------- live layer ---------- */
const STRIP_PEDS=Array.from({length:12},(_,i)=>{const top=i%2===0;return {top,x0:150+((i*137)%900),span:120+((i*71)%260),spd:9+((i*13)%9),ph:i*1.7,
  col:['#e11d48','#2563eb','#f59e0b','#10b981','#a855f7','#f5f5f4','#0ea5e9','#f97316'][i%8],hair:['#1f1308','#5b3a1e','#f5d0a9','#111'][i%4],y:top?3.6*TILE-8-(i%3)*1.5:16.4*TILE+8+(i%3)*1.5};});
// keep strollers on the pavement: it ends before the armoured truck and the casino
for(const p of STRIP_PEDS){const end=34*TILE-16;if(p.x0>end-80)p.x0=end-80-((p.x0*7)%300);p.span=Math.min(p.span,end-p.x0);}
let SIGN_SPR=null;
function buildSigns(){
  if(document.fonts&&document.fonts.check&&!document.fonts.check('14px Bungee'))return null;
  const out=[];
  for(const o of OBST){const S=STRIP[o.k],st=OBST_STYLE[o.k];if(!S)continue;const R=bRect(o);
    const fs=o.w>=5?14:o.w>=4?12:11,pad=9;const m=document.createElement('canvas').getContext('2d');m.font=`400 ${fs}px Bungee,Impact,sans-serif`;
    const tw=Math.ceil(m.measureText(S.name).width)+16,th=fs+10,cw=tw+pad*2,ch=th+pad*2;
    const mk=on=>{const cv=document.createElement('canvas');cv.width=cw*2;cv.height=ch*2;const c=cv.getContext('2d');c.scale(2,2);
      c.fillStyle='rgba(10,6,16,.92)';rr(c,pad,pad,tw,th,4);c.fill();c.strokeStyle=hexA(st.col,on?.9:.35);c.lineWidth=1.2;rr(c,pad,pad,tw,th,4);c.stroke();
      c.font=`400 ${fs}px Bungee,Impact,sans-serif`;c.textAlign='center';c.textBaseline='middle';
      if(on){c.shadowColor=st.col;c.shadowBlur=9;c.fillStyle=st.col;c.fillText(S.name,cw/2,ch/2+1);c.shadowBlur=3;c.fillStyle='#fff7ee';c.globalAlpha=.75;c.fillText(S.name,cw/2,ch/2+1);}
      else{c.fillStyle=hexA(st.col,.28);c.fillText(S.name,cw/2,ch/2+1);}return cv;};
    const sx=R.x+R.w*({motel:.36,lounge:.4,hotel:.56}[o.k]||.5),sy=R.fy+FH/2+(R.top?2:-2);
    out.push({o,on:mk(true),off:mk(false),x:sx-cw/2,y:sy-ch/2,w:cw,h:ch,seed:o.c*7.3+o.r});}
  return out;}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{SIGN_SPR=null;bg=null;});

function drawStrip(c,t){
  const wave=G&&G.phase==='wave';
  // searchlights sweeping the street
  c.save();c.globalCompositeOperation='lighter';
  for(let k=0;k<2;k++){const x=W*(.5+.42*Math.sin(t*.11+k*2.4)),y=H*(.5+.3*Math.sin(t*.17+k*1.3));const g=c.createRadialGradient(x,y,4,x,y,120);g.addColorStop(0,`rgba(${k?'190,230,255':'255,210,240'},.07)`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-120,y-120,240,240);}
  // shimmering pools on the motel and hotel roofs
  for(const o of OBST){if(o.k!=='motel'&&o.k!=='hotel')continue;const R=bRect(o);const px=o.k==='motel'?R.x+R.w-62:R.x+R.w-48,py=o.k==='motel'?R.ry+R.rh-34:R.ry+8,pw=o.k==='motel'?46:36;
    c.fillStyle=`rgba(200,250,255,${.08+.06*Math.sin(t*2.2+o.c)})`;c.fillRect(px+4+((t*9)%(pw-14)),py+3,8,2);}
  c.restore();
  // drive-in screen playing something
  {const o=OBST.find(o=>o.k==='cinema');if(o){const R=bRect(o),sy=R.top?R.ry+3:R.ry+R.rh-9,hue=(t*40)%360,fl=.6+.4*Math.abs(Math.sin(t*3.1))*Math.abs(Math.sin(t*1.7));
    c.fillStyle=`hsla(${hue},70%,${55+fl*20}%,.85)`;c.fillRect(R.x+10,sy+1,R.w-20,4);c.save();c.globalCompositeOperation='lighter';const g=c.createLinearGradient(0,sy,0,sy+(R.top?30:-30));g.addColorStop(0,`hsla(${hue},80%,70%,${.18*fl})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(R.x+8,R.top?sy+6:sy-30,R.w-16,30);c.restore();}}
  // neon name signs, each with its own occasional flicker
  if(!SIGN_SPR)SIGN_SPR=buildSigns();
  if(SIGN_SPR)for(const s of SIGN_SPR){const n=Math.sin(t*1.3+s.seed)*Math.sin(t*3.7+s.seed*2.1),fl=n>.93?(Math.sin(t*60)>0?0:1):1;c.drawImage(fl?s.on:s.off,s.x,s.y,s.w,s.h);}
  // chase lights along marquee facades
  for(const o of OBST){const S=STRIP[o.k];if(!S||!S.bulbs)continue;const R=bRect(o),yy=R.top?R.y+R.h-1.5:R.y+1.5,n=Math.floor((R.w-10)/7);
    for(let i=0;i<n;i++){const on=(i+Math.floor(t*6))%3===0;c.fillStyle=on?'#fff1c2':'rgba(255,190,90,.35)';c.beginPath();c.arc(R.x+6+i*7,yy,on?1.6:1.2,0,TAU);c.fill();}}
  // steam from the manholes
  for(const [mx,my] of STRIP_STEAM)for(let k=0;k<3;k++){const ph=(t*.35+k/3+mx*.01)%1;c.fillStyle=`rgba(210,205,225,${.16*(1-ph)})`;c.beginPath();c.arc(mx+Math.sin(t+k)*4+ph*8,my-ph*26,5+ph*9,0,TAU);c.fill();}
  // pedestrians strolling the sidewalks (they step back from the action during a wave)
  c.save();c.globalAlpha=wave?.38:.9;
  for(const p of STRIP_PEDS){const u=((t*p.spd/p.span)+p.ph)%2,f=u<1?u:2-u,x=p.x0+f*p.span,dir=u<1?1:-1,step=Math.sin(t*8+p.ph)*1.2;
    c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(x+2,p.y+4,5.5,2.6,0,0,TAU);c.fill();
    c.fillStyle='#1c1a22';c.fillRect(x-2.4+step*dir*.7,p.y+1.5,2,4);c.fillRect(x+.6-step*dir*.7,p.y+1.5,2,4);
    c.fillStyle=p.col;rr(c,x-4.4,p.y-3,8.8,5.6,2.4);c.fill();c.fillStyle='rgba(255,255,255,.18)';c.fillRect(x-3.6,p.y-2.4,7.2,1.4);
    c.fillStyle='#e8c9a4';c.beginPath();c.arc(x+dir*.5,p.y-3.6,2.4,0,TAU);c.fill();c.fillStyle=p.hair;c.beginPath();c.arc(x+dir*.1,p.y-4.4,2.4,Math.PI*1.05,Math.PI*1.95);c.fill();}
  c.restore();
}
