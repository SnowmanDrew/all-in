'use strict';
/* ============ ALL IN — rendering (Neon Strip) ============ */
const cv=document.getElementById('board');let ctx=cv.getContext('2d');const MAINCTX=ctx;let RS=1,VIEWING=false;
const DPR=Math.min(2,window.devicePixelRatio||1);cv.width=W*DPR;cv.height=H*DPR;
const TAU=Math.PI*2;
let bg=null;
const NEON={pink:'#ff3d9a',cyan:'#22e1ff',amber:'#ffb020',lime:'#b6f84a',violet:'#b46bff',red:'#ff3b3b',white:'#fff4e0'};
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function hexA(h,a){if(h[0]!=='#')return h;const n=parseInt(h.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`;}
function shade(h,f){const n=parseInt(h.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;if(f<0){r*=1+f;g*=1+f;b*=1+f;}else{r+=(255-r)*f;g+=(255-g)*f;b+=(255-b)*f;}return `rgb(${r|0},${g|0},${b|0})`;}
function neonStroke(c,path,col,w,blur){c.save();c.lineJoin='round';c.lineCap='round';c.shadowColor=col;c.shadowBlur=blur==null?10:blur;c.strokeStyle=col;c.lineWidth=w||2.4;path();c.stroke();c.shadowBlur=0;c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=Math.max(.8,(w||2.4)*.35);path();c.stroke();c.restore();}
/* seeded random for stable map dressing */
let SEED=7;const srnd=()=>{SEED=(SEED*16807)%2147483647;return (SEED-1)/2147483646;};
/* ---------- neon sign shapes (no text) ---------- */
function signShape(c,kind,x,y,s){
  const P=(f)=>()=>{c.beginPath();f();};
  switch(kind){
    case 'star':return P(()=>{for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr2=i%2?s*.42:s;c.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2);}c.closePath();});
    case 'heart':return P(()=>{c.moveTo(x,y+s*.8);c.bezierCurveTo(x-s*1.3,y-s*.2,x-s*.6,y-s*1.1,x,y-s*.35);c.bezierCurveTo(x+s*.6,y-s*1.1,x+s*1.3,y-s*.2,x,y+s*.8);});
    case 'dice':return P(()=>{c.rect(x-s*.8,y-s*.8,s*1.6,s*1.6);c.moveTo(x-s*.3+1.2,y-s*.3);c.arc(x-s*.3,y-s*.3,1.2,0,TAU);c.moveTo(x+s*.3+1.2,y+s*.3);c.arc(x+s*.3,y+s*.3,1.2,0,TAU);});
    case 'balls':return P(()=>{for(const [dx,dy] of [[-.55,.25],[.55,.25],[0,-.55]]){c.moveTo(x+dx*s+s*.42,y+dy*s);c.arc(x+dx*s,y+dy*s,s*.42,0,TAU);}});
    case 'cup':return P(()=>{c.moveTo(x-s*.7,y-s*.5);c.lineTo(x-s*.55,y+s*.6);c.lineTo(x+s*.45,y+s*.6);c.lineTo(x+s*.6,y-s*.5);c.closePath();c.moveTo(x+s*.6,y-s*.2);c.arc(x+s*.75,y,s*.25,-Math.PI/2,Math.PI/2);c.moveTo(x-s*.2,y-s*.7);c.quadraticCurveTo(x-s*.35,y-s*1,x-s*.15,y-s*1.2);c.moveTo(x+s*.15,y-s*.7);c.quadraticCurveTo(x,y-s*1,x+s*.2,y-s*1.2);});
    case 'cocktail':return P(()=>{c.moveTo(x-s,y-s*.7);c.lineTo(x+s,y-s*.7);c.lineTo(x,y+s*.2);c.closePath();c.moveTo(x,y+s*.2);c.lineTo(x,y+s);c.moveTo(x-s*.45,y+s);c.lineTo(x+s*.45,y+s);c.moveTo(x+s*.5+2,y-s*.9);c.arc(x+s*.5,y-s*.9,2,0,TAU);});
    case 'rose':return P(()=>{c.moveTo(x+s*.55,y-s*.3);c.arc(x,y-s*.3,s*.55,0,TAU);c.moveTo(x+s*.25,y-s*.3);c.arc(x,y-s*.3,s*.25,0,TAU*.8);c.moveTo(x,y+s*.25);c.lineTo(x,y+s*1.1);c.moveTo(x,y+s*.7);c.quadraticCurveTo(x+s*.5,y+s*.4,x+s*.6,y+s*.7);});
    case 'reel':return P(()=>{c.moveTo(x+s,y);c.arc(x,y,s,0,TAU);for(let i=0;i<5;i++){const a=i*TAU/5;c.moveTo(x+Math.cos(a)*s*.55+s*.2,y+Math.sin(a)*s*.55);c.arc(x+Math.cos(a)*s*.55,y+Math.sin(a)*s*.55,s*.2,0,TAU);}});
    case 'arrow':return P(()=>{c.moveTo(x-s*1.2,y);c.lineTo(x+s*.9,y);c.moveTo(x+s*.4,y-s*.5);c.lineTo(x+s*.95,y);c.lineTo(x+s*.4,y+s*.5);});
    case 'spade':return P(()=>{c.moveTo(x,y-s);c.bezierCurveTo(x+s*.3,y-s*.6,x+s*1.1,y-s*.15,x+s*.85,y+s*.35);c.bezierCurveTo(x+s*.65,y+s*.75,x+s*.15,y+s*.6,x+s*.05,y+s*.35);c.lineTo(x+s*.3,y+s);c.lineTo(x-s*.3,y+s);c.lineTo(x-s*.05,y+s*.35);c.bezierCurveTo(x-s*.15,y+s*.6,x-s*.65,y+s*.75,x-s*.85,y+s*.35);c.bezierCurveTo(x-s*1.1,y-s*.15,x-s*.3,y-s*.6,x,y-s);});
  }
}
const OBST_STYLE={motel:{roof:'#2b2238',sign:['star','arrow'],col:NEON.amber},chapel:{roof:'#2a2333',sign:['heart'],col:NEON.pink},arcade:{roof:'#221b33',sign:['dice','reel'],col:NEON.cyan},
  pawn:{roof:'#2c2626',sign:['balls'],col:NEON.amber},diner:{roof:'#2a1f24',sign:['cup'],col:NEON.lime},lounge:{roof:'#2a1730',sign:['cocktail'],col:NEON.violet},hotel:{roof:'#2b1f2b',sign:['rose','star'],col:NEON.pink},cinema:{roof:'#20202a',sign:['star'],col:NEON.white}};
function drawBuilding(b,o){
  const x=o.c*TILE,y=o.r*TILE,w=o.w*TILE,h=o.h*TILE,st=OBST_STYLE[o.k],top=o.r===0,fh=11;
  b.save();b.shadowColor='rgba(0,0,0,.7)';b.shadowBlur=16;b.shadowOffsetY=top?6:-6;b.fillStyle='#0d0a12';b.fillRect(x+1,y+1,w-2,h-2);b.restore();
  // facade strip facing the road
  const fy=top?y+h-fh:y;b.fillStyle=shade(st.roof,-.35);b.fillRect(x+1,fy,w-2,fh);
  for(let i=0;i<Math.floor((w-10)/12);i++){const lit=srnd()<.7;b.fillStyle=lit?(srnd()<.5?'#ffd27a':'#ffe9c2'):'#1a1420';b.fillRect(x+7+i*12,fy+3,6,fh-6);}
  // roof
  const ry=top?y+1:y+fh,rh=h-fh-1;b.fillStyle=st.roof;b.fillRect(x+1,ry,w-2,rh);
  b.strokeStyle='rgba(255,255,255,.07)';b.lineWidth=2;b.strokeRect(x+3,ry+2,w-6,rh-4);
  for(let i=0;i<Math.max(1,o.w-2);i++){const ax=x+10+srnd()*(w-30),ay=ry+6+srnd()*(rh-20);b.fillStyle='#3b3546';b.fillRect(ax,ay,12,9);b.fillStyle='#2a2533';b.fillRect(ax+2,ay+2,8,5);}
  // neon sign along facade edge
  const sy=top?y+h-fh-12:y+fh+12;
  st.sign.forEach((k,i)=>{const sx=x+w*(st.sign.length===1?.5:(.3+.4*i));neonStroke(b,signShape(b,k,sx,sy,8),st.col,2.2,12);});
  b.strokeStyle=hexA(st.col,.55);b.lineWidth=1.5;b.beginPath();b.moveTo(x+4,top?y+h-1:y+1);b.lineTo(x+w-4,top?y+h-1:y+1);b.stroke();
}
function drawPalms(b,o){
  const x=o.c*TILE,y=o.r*TILE,w=o.w*TILE,h=o.h*TILE;
  b.fillStyle='#3a3546';rr(b,x+2,y+2,w-4,h-4,10);b.fill();b.fillStyle='#16251c';rr(b,x+5,y+5,w-10,h-10,8);b.fill();
  const g=b.createRadialGradient(x+w/2,y+h/2,4,x+w/2,y+h/2,70);g.addColorStop(0,'rgba(34,225,255,.18)');g.addColorStop(1,'rgba(34,225,255,0)');b.save();b.globalCompositeOperation='lighter';b.fillStyle=g;b.fillRect(x-60,y-60,w+120,h+120);b.restore();
  for(const [px,py] of [[x+w*.45,y+h*.3],[x+w*.55,y+h*.72]]){
    b.fillStyle='rgba(0,0,0,.45)';b.beginPath();b.ellipse(px+6,py+6,20,14,0,0,TAU);b.fill();
    for(let i=0;i<8;i++){const a=i/8*TAU+srnd()*.3,L=20+srnd()*5;b.save();b.translate(px,py);b.rotate(a);
      b.fillStyle=i%2?'#1f6b3a':'#2a8a4a';b.beginPath();b.moveTo(0,0);b.quadraticCurveTo(L*.5,-6,L,0);b.quadraticCurveTo(L*.5,5,0,0);b.fill();
      b.strokeStyle='#0d2a18';b.lineWidth=1;b.beginPath();b.moveTo(0,0);b.lineTo(L*.95,0);b.stroke();b.restore();}
    b.fillStyle='#6b4a2a';b.beginPath();b.arc(px,py,3.5,0,TAU);b.fill();}
}
function drawFountain(b,o){
  const x=o.c*TILE,y=o.r*TILE,w=o.w*TILE,h=o.h*TILE,cx=x+w/2,cy=y+h/2;
  b.fillStyle='rgba(0,0,0,.5)';b.beginPath();b.ellipse(cx+3,cy+5,w/2,h/2,0,0,TAU);b.fill();
  b.fillStyle='#4b4558';b.beginPath();b.ellipse(cx,cy,w/2-1,h/2-1,0,0,TAU);b.fill();
  const g=b.createRadialGradient(cx,cy,4,cx,cy,w/2);g.addColorStop(0,'#5fe4ff');g.addColorStop(.6,'#1677a8');g.addColorStop(1,'#0b3a5a');b.fillStyle=g;b.beginPath();b.ellipse(cx,cy,w/2-7,h/2-7,0,0,TAU);b.fill();
  b.strokeStyle='rgba(255,255,255,.35)';b.lineWidth=1;for(let k=1;k<4;k++){b.beginPath();b.ellipse(cx,cy,(w/2-8)*k/4,(h/2-8)*k/4,0,0,TAU);b.stroke();}
  b.fillStyle='#d8d2e6';b.beginPath();b.arc(cx,cy,7,0,TAU);b.fill();b.fillStyle='#9aa3b5';b.beginPath();b.arc(cx,cy,4,0,TAU);b.fill();
}
function drawTruck(b){
  const x=VAULT.c0*TILE,y=VAULT.r0*TILE,w=VAULT.w*TILE,h=VAULT.h*TILE;
  b.fillStyle='rgba(0,0,0,.55)';rr(b,x+4,y+8,w-4,h-6,8);b.fill();
  b.fillStyle='#5b6170';rr(b,x+16,y+8,w-22,h-16,5);b.fill();b.fillStyle='#4a505d';rr(b,x+22,y+12,w-40,h-24,3);b.fill();
  b.strokeStyle='#2c3039';b.lineWidth=1;for(let i=0;i<4;i++){b.beginPath();b.moveTo(x+28+i*11,y+12);b.lineTo(x+28+i*11,y+h-12);b.stroke();}
  b.fillStyle='#3d424d';rr(b,x+w-22,y+12,18,h-24,4);b.fill();b.fillStyle='#9fd6ff';b.fillRect(x+w-10,y+15,4,h-30);
  // open rear doors and spilled chips
  b.fillStyle='#6b7180';b.save();b.translate(x+16,y+8);b.rotate(-.9);b.fillRect(-2,0,4,18);b.restore();b.save();b.translate(x+16,y+h-8);b.rotate(.9);b.fillRect(-2,-18,4,18);b.restore();
  const cols=['#d4a937','#e94b5a','#3b82f6','#d4a937'];for(let i=0;i<7;i++){const cx=x+4+srnd()*16,cy=y+18+srnd()*(h-36);b.fillStyle=cols[i%4];b.beginPath();b.ellipse(cx,cy,4,2.2,0,0,TAU);b.fill();b.strokeStyle='rgba(0,0,0,.4)';b.stroke();}
  b.fillStyle='#ffb020';b.beginPath();b.arc(x+w-6,y+12,2,0,TAU);b.arc(x+w-6,y+h-12,2,0,TAU);b.fill();
}
function buildBg(){
  SEED=7;
  const c=document.createElement('canvas');c.width=W*DPR;c.height=H*DPR;const b=c.getContext('2d');b.scale(DPR,DPR);
  b.fillStyle='#16121d';b.fillRect(0,0,W,H);
  for(let i=0;i<26000;i++){b.fillStyle=srnd()<.5?'rgba(0,0,0,.18)':'rgba(255,255,255,.035)';b.fillRect(srnd()*W,srnd()*H,1+srnd(),1+srnd());}
  for(let i=0;i<40;i++){b.fillStyle='rgba(0,0,0,.12)';b.beginPath();b.ellipse(srnd()*W,srnd()*H,20+srnd()*50,8+srnd()*20,srnd()*3,0,TAU);b.fill();}
  // desert edge
  const dg=b.createLinearGradient(0,0,120,0);dg.addColorStop(0,'#3b2619');dg.addColorStop(.6,'rgba(59,38,25,.55)');dg.addColorStop(1,'rgba(59,38,25,0)');b.fillStyle=dg;b.fillRect(0,0,120,H);
  for(let i=0;i<3000;i++){b.fillStyle=`rgba(${180+srnd()*60|0},${120+srnd()*40|0},80,${.05+srnd()*.08})`;b.fillRect(srnd()*srnd()*110,srnd()*H,1,1);}
  for(const [cx,cy,s] of [[26,70,1],[58,175,.8],[22,450,1.1],[64,540,.85],[36,620,.7]]){if(cy>H)continue;b.save();b.translate(cx,cy);b.scale(s,s);b.fillStyle='rgba(0,0,0,.45)';b.beginPath();b.ellipse(4,6,9,5,0,0,TAU);b.fill();
    b.fillStyle='#2f5a3a';b.beginPath();b.arc(0,0,6,0,TAU);b.arc(-7,-2,3.5,0,TAU);b.arc(7,1,3.5,0,TAU);b.fill();b.strokeStyle='#183322';b.lineWidth=1;b.beginPath();b.arc(0,0,6,0,TAU);b.stroke();b.restore();}
  // highway into town
  b.strokeStyle='rgba(255,255,255,.18)';b.lineWidth=2;for(const yy of [8.4*TILE,11.6*TILE]){b.beginPath();b.moveTo(0,yy);b.lineTo(115,yy);b.stroke();}
  // sidewalks
  const walk=(x,y,w,h)=>{b.fillStyle='#262230';b.fillRect(x,y,w,h);b.strokeStyle='rgba(0,0,0,.35)';b.lineWidth=1;for(let xx=x;xx<x+w;xx+=TILE){b.beginPath();b.moveTo(xx+.5,y);b.lineTo(xx+.5,y+h);b.stroke();}for(let yy=y;yy<y+h;yy+=TILE/2){b.beginPath();b.moveTo(x,yy+.5);b.lineTo(x+w,yy+.5);b.stroke();}};
  walk(110,0,34*TILE-110,3.6*TILE);walk(110,16.4*TILE,34*TILE-110,H-16.4*TILE);
  b.fillStyle='#4a4457';b.fillRect(110,3.6*TILE-2,34*TILE-110,3);b.fillRect(110,16.4*TILE-1,34*TILE-110,3);
  // lane markings
  b.setLineDash([18,16]);b.strokeStyle='rgba(255,255,255,.16)';b.lineWidth=2;for(const yy of [6.5*TILE,13.5*TILE]){b.beginPath();b.moveTo(120,yy);b.lineTo(34.5*TILE,yy);b.stroke();}
  b.strokeStyle='rgba(255,196,0,.32)';b.setLineDash([22,14]);for(const yy of [10*TILE-3,10*TILE+3]){b.beginPath();b.moveTo(10,yy);b.lineTo(35*TILE,yy);b.stroke();}b.setLineDash([]);
  for(const xx of [15.5*TILE,25*TILE]){for(let yy=3.8*TILE;yy<16.2*TILE;yy+=13){b.fillStyle='rgba(255,255,255,.1)';b.fillRect(xx,yy,34,7);}}
  // lamp light pools & neon spill
  b.save();b.globalCompositeOperation='lighter';
  const pool=(x,y,r,col,a)=>{const g=b.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,hexA(col,a));g.addColorStop(1,hexA(col,0));b.fillStyle=g;b.fillRect(x-r,y-r,r*2,r*2);};
  for(let xx=170;xx<34*TILE;xx+=190){pool(xx,3.6*TILE+4,95,'#ffb86b',.11);pool(xx+95,16.4*TILE-4,95,'#ffb86b',.11);}
  for(const o of OBST){const st=OBST_STYLE[o.k];if(!st)continue;pool(o.c*TILE+o.w*TILE/2,o.r===0?(o.r+o.h)*TILE+14:o.r*TILE-14,120,st.col,.13);}
  pool(BASE.c0*TILE-40,BASE.y,170,NEON.pink,.16);pool(BASE.c0*TILE-30,BASE.y,90,NEON.amber,.12);
  b.restore();
  for(let xx=170;xx<34*TILE;xx+=190){for(const [lx,ly] of [[xx,3.6*TILE+4],[xx+95,16.4*TILE-4]]){b.fillStyle='#0c0a10';b.beginPath();b.arc(lx,ly,3.5,0,TAU);b.fill();b.fillStyle='#ffe2b0';b.beginPath();b.arc(lx,ly,1.6,0,TAU);b.fill();}}
  // objects
  for(const o of OBST){if(o.k==='palms')drawPalms(b,o);else if(o.k==='fountain')drawFountain(b,o);else drawBuilding(b,o);}
  drawTruck(b);
  // carpet runner the croupiers walk between the truck and the casino side door
  {const x1=VAULT.c0*TILE-10,y1=VAULT.y+4,x2=BASE.x-30,y2=BASE.r0*TILE-8;b.lineCap='round';b.strokeStyle='#4a0b1c';b.lineWidth=16;b.beginPath();b.moveTo(x1,y1);b.quadraticCurveTo(x1-6,y2-10,x2,y2);b.stroke();
   b.strokeStyle='rgba(233,196,106,.45)';b.lineWidth=13;b.setLineDash([2,5]);b.stroke();b.setLineDash([]);b.strokeStyle='#7a1430';b.lineWidth=10;b.stroke();}
  // red carpet to the casino
  const cy=BASE.y;b.fillStyle='#5a0f22';b.fillRect(BASE.c0*TILE-34,cy-15,36,30);b.fillStyle='#8f1736';b.fillRect(BASE.c0*TILE-34,cy-12,36,24);b.fillStyle='#e9c46a';b.fillRect(BASE.c0*TILE-34,cy-15,36,1.5);b.fillRect(BASE.c0*TILE-34,cy+13.5,36,1.5);
  const v=b.createRadialGradient(W/2,H/2,H*.5,W/2,H/2,W*.72);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');b.fillStyle=v;b.fillRect(0,0,W,H);
  bg=c;
}
/* ---------- creature art ---------- */
let CUR_FACE='beady';
function eye(c,x,y,s,col,look){
  const sg=x<0?-1:1;
  switch(CUR_FACE){
    case 'dog':c.fillStyle='#fff';c.beginPath();c.ellipse(x,y,s*.8,s*.9,0,0,TAU);c.fill();c.fillStyle='#2a1a10';c.beginPath();c.arc(x+s*.25,y+s*.1,s*.6,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(x+s*.4,y-s*.15,s*.2,0,TAU);c.fill();
      c.strokeStyle='#1a0f08';c.lineWidth=Math.max(1,s*.3);c.beginPath();c.moveTo(x-s*.8,y-s*1.1);c.lineTo(x+s*.7,y-s*1.25);c.stroke();break;
    case 'pips':c.fillStyle='#120c18';c.beginPath();c.arc(x,y,s*.62,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.arc(x+s*.22,y-s*.2,s*.18,0,TAU);c.fill();break;
    case 'led':c.fillStyle='#08130c';c.fillRect(x-s*.7,y-s*.6,s*1.4,s*1.2);c.fillStyle='#4ade80';c.fillRect(x-s*.45,y-s*.4,s*.9,s*.8);c.fillStyle='#d1fae5';c.fillRect(x-s*.45,y-s*.4,s*.35,s*.3);break;
    case 'mystic':c.fillStyle='#fde68a';c.beginPath();c.ellipse(x,y,s*.95,s*.45,sg*.25,0,TAU);c.fill();c.fillStyle='#4c1d95';c.beginPath();c.ellipse(x,y,s*.22,s*.42,0,0,TAU);c.fill();break;
    case 'cyclops':c.fillStyle='#fff';c.beginPath();c.arc(x,y,s*1.05,0,TAU);c.fill();c.fillStyle=col&&col!=='#111'?col:'#7c3aed';c.beginPath();c.arc(x+s*.1,y,s*.68,0,TAU);c.fill();c.fillStyle='#0b0612';c.beginPath();c.arc(x+s*.15,y,s*.34,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(x+s*.35,y-s*.3,s*.16,0,TAU);c.fill();break;
    case 'sly':c.fillStyle='#fff';c.beginPath();c.ellipse(x,y,s*.9,s*.75,0,0,TAU);c.fill();c.fillStyle=col||'#111';c.beginPath();c.arc(x+s*.3,y+s*.15,s*.45,0,TAU);c.fill();
      c.fillStyle='#24102e';c.beginPath();c.ellipse(x,y-s*.15,s*1,s*.62,0,Math.PI,TAU);c.fill();break;
    case 'lashes':c.strokeStyle='#3b0a24';c.lineWidth=Math.max(1,s*.28);c.lineCap='round';c.beginPath();c.arc(x,y-s*.2,s*.7,.2,Math.PI-.2);c.stroke();
      for(let k=0;k<3;k++){const a=.5+k*.55;c.beginPath();c.moveTo(x+Math.cos(a)*s*.7,y-s*.2+Math.sin(a)*s*.7);c.lineTo(x+Math.cos(a)*s*1.05,y-s*.2+Math.sin(a)*s*1.05);c.stroke();}break;
    case 'angry':c.fillStyle='#fff';c.beginPath();c.arc(x,y,s*.9,0,TAU);c.fill();c.fillStyle='#0b0612';c.beginPath();c.arc(x-sg*s*.15,y+s*.15,s*.45,0,TAU);c.fill();
      c.fillStyle='#1e1b4b';c.beginPath();c.moveTo(x-s*1.1,y-s*(sg>0?1.15:.55));c.lineTo(x+s*1.1,y-s*(sg>0?.55:1.15));c.lineTo(x+s*1.1,y-s*1.6);c.lineTo(x-s*1.1,y-s*1.6);c.fill();break;
    case 'reptile':c.fillStyle='#fde047';c.beginPath();c.arc(x,y,s*.85,0,TAU);c.fill();c.fillStyle='#0b0612';c.beginPath();c.ellipse(x+s*.1,y,s*.18,s*.7,0,0,TAU);c.fill();break;
    case 'visor':c.fillStyle='rgba(255,255,255,.8)';c.fillRect(x-s*.5,y-s*.15,s,s*.3);break;
    case 'regal':c.strokeStyle='#5b3a12';c.lineWidth=Math.max(1,s*.3);c.lineCap='round';c.beginPath();c.arc(x,y+s*.3,s*.7,Math.PI+.4,TAU-.4);c.stroke();c.fillStyle='rgba(251,113,133,.45)';c.beginPath();c.arc(x+sg*s*.6,y+s*.9,s*.45,0,TAU);c.fill();break;
    case 'shades':if(x<0){c.fillStyle='#0b0612';rr(c,x-s*.95,y-s*.55,s*3.2,s*.95,s*.3);c.fill();c.fillStyle='rgba(165,243,252,.6)';c.fillRect(x-s*.6,y-s*.4,s*.5,s*.18);}break;
    case 'mask':c.fillStyle='#fff';c.beginPath();c.ellipse(x,y,s*.85,s*.5,0,0,TAU);c.fill();c.fillStyle='#0b0612';c.beginPath();c.arc(x+s*.25,y,s*.36,0,TAU);c.fill();break;
    case 'snake':c.fillStyle='#ef4444';c.beginPath();c.arc(x,y,s*.75,0,TAU);c.fill();c.fillStyle='#0b0612';c.beginPath();c.ellipse(x,y,s*.15,s*.6,0,0,TAU);c.fill();break;
    default:c.fillStyle='#120c18';c.beginPath();c.arc(x,y,s*.5,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.arc(x+s*.16,y-s*.18,s*.15,0,TAU);c.fill();
  }
}
function legs(c,r,t,n,col,len){c.strokeStyle=col;c.lineWidth=Math.max(1.5,r*.18);c.lineCap='round';for(let i=0;i<n;i++){const x=-r*.6+i*(r*1.2/(n-1||1)),ph=Math.sin(t*14+i*2)*r*.18;c.beginPath();c.moveTo(x,r*.5);c.lineTo(x+ph,r*.5+(len||r*.55));c.stroke();}}
function chipDisc(c,r,c1,c2,y){c.fillStyle=c1;c.beginPath();c.arc(0,y||0,r,0,Math.PI*2);c.fill();c.fillStyle=c2;for(let k=0;k<6;k++){c.save();c.translate(0,y||0);c.rotate(k*Math.PI/3);c.fillRect(-r*.16,-r,r*.32,r*.3);c.restore();}
  c.fillStyle=shade(c1,-.2);c.beginPath();c.arc(0,y||0,r*.62,0,Math.PI*2);c.fill();c.strokeStyle=c2;c.lineWidth=1;c.setLineDash([2,2]);c.beginPath();c.arc(0,y||0,r*.62,0,Math.PI*2);c.stroke();c.setLineDash([]);}
function pips(c,s,n,col){const P={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]}[n];c.fillStyle=col;for(const [x,y] of P){c.beginPath();c.arc(x*s*.32,y*s*.32,s*.1,0,Math.PI*2);c.fill();}}
function crown(c,x,y,s,col){c.fillStyle=col||'#fbbf24';c.beginPath();c.moveTo(x-s,y);c.lineTo(x-s,y-s*.8);c.lineTo(x-s*.5,y-s*.35);c.lineTo(x,y-s*1.1);c.lineTo(x+s*.5,y-s*.35);c.lineTo(x+s,y-s*.8);c.lineTo(x+s,y);c.closePath();c.fill();c.fillStyle='#e11d48';c.beginPath();c.arc(x,y-s*.3,s*.18,0,Math.PI*2);c.fill();}
function drawCreature(c,look,r,t,atk){
  const L=look,c1=L.c1,c2=L.c2;CUR_FACE=L.face||'beady';
  switch(L.b){
  case 'human':human(c,r,L,t,atk);break;case 'robot':robot(c,r,L,t,atk);break;case 'tank':tank(c,r,L,t,atk);break;case 'chimera':chimera(c,r,L,t,atk);break;case 'rider':rider(c,r,L,t,atk);break;
  case 'chip':{if(L.cape){c.fillStyle='#b91c1c';c.beginPath();c.moveTo(-r*.6,-r*.3);c.quadraticCurveTo(-r*1.3,r*.4+Math.sin(t*4)*r*.1,-r*.9,r*.9);c.lineTo(r*.2,r*.6);c.closePath();c.fill();}
    legs(c,r,t,3,'#2a1a10');if(L.stack){for(let k=2;k>=1;k--){c.fillStyle=shade(k%2?c2:c1,-.3);c.beginPath();c.ellipse(0,-k*r*.35+r*.1,r,r*.45,0,0,Math.PI*2);c.fill();c.fillStyle=k%2?c2:c1;c.beginPath();c.ellipse(0,-k*r*.35,r,r*.45,0,0,Math.PI*2);c.fill();}}
    chipDisc(c,r*.95,c1,L.stack?'#fff':c2,L.stack?-r*.75:0);const ey=L.stack?-r*.8:-r*.05;eye(c,-r*.25,ey,r*.22);eye(c,r*.3,ey,r*.22);
    if(!L.stack&&CUR_FACE==='beady'){c.strokeStyle='#3b0a10';c.lineWidth=Math.max(1,r*.08);c.lineCap='round';c.beginPath();c.arc(r*.03,ey+r*.2,r*.17,.25,Math.PI-.25);c.stroke();c.fillStyle='#fff';c.beginPath();c.moveTo(r*.08,ey+r*.34);c.lineTo(r*.14,ey+r*.47);c.lineTo(r*.19,ey+r*.33);c.fill();}
    if(L.band){c.fillStyle='#dc2626';c.fillRect(-r*.9,-r*.45,r*1.8,r*.18);c.beginPath();c.moveTo(-r*.85,-r*.4);c.lineTo(-r*1.3,-r*.55+Math.sin(t*8)*r*.08);c.lineTo(-r*1.25,-r*.25);c.fill();}
    if(L.crown)crown(c,0,-r*.85,r*.42,'#fbbf24');break;}
  case 'hound':{legs(c,r,t,4,'#1e293b',r*.5);c.strokeStyle=c1;c.lineWidth=r*.2;c.beginPath();c.moveTo(-r*.9,0);c.quadraticCurveTo(-r*1.4,-r*.6-Math.sin(t*12)*r*.2,-r*1.2,-r*.9);c.stroke();
    c.save();c.scale(1.15,.8);chipDisc(c,r*.85,c1,c2);c.restore();
    const heads=L.three?[[-.15,-.95],[.55,-.7],[.95,-.2]]:[[.75,-.5]];
    for(const [hx,hy] of heads){const x=hx*r,y=hy*r,s=r*.5;c.fillStyle=c1;c.beginPath();c.arc(x,y,s,0,Math.PI*2);c.fill();c.fillStyle=shade(c1,-.3);c.beginPath();c.moveTo(x-s*.7,y-s*.5);c.lineTo(x-s*.3,y-s*1.3);c.lineTo(x,y-s*.6);c.fill();
      c.fillStyle=shade(c1,.5);c.beginPath();c.ellipse(x+s*.6,y+s*.25,s*.45,s*.32,0,0,Math.PI*2);c.fill();c.fillStyle='#111';c.beginPath();c.arc(x+s*1,y+s*.15,s*.14,0,Math.PI*2);c.fill();eye(c,x+s*.15,y-s*.15,s*.28);
      if(atk>.3){c.fillStyle='#fff';c.fillRect(x+s*.5,y+s*.45,s*.12,s*.2);c.fillRect(x+s*.8,y+s*.45,s*.12,s*.2);}}
    if(L.three)crown(c,0,-r*1.35,r*.3,'#fbbf24');break;}
  case 'die':{const fl=Math.sin(t*3)*r*.12;c.translate(0,fl-r*.15);
    c.fillStyle='rgba(0,0,0,.0)';
    const draw1=(ox,s,rot)=>{c.save();c.translate(ox,0);c.rotate(rot);c.fillStyle=shade(c1,-.25);rr(c,-s+2,-s+3,s*2,s*2,s*.35);c.fill();c.fillStyle=c1;rr(c,-s,-s,s*2,s*2,s*.35);c.fill();c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1;c.stroke();
      if(L.snake){c.fillStyle='#fff';c.beginPath();c.arc(-s*.38,-s*.15,s*.3,0,Math.PI*2);c.arc(s*.38,-s*.15,s*.3,0,Math.PI*2);c.fill();c.fillStyle=c2;c.beginPath();c.ellipse(-s*.38,-s*.15,s*.1,s*.24,0,0,Math.PI*2);c.ellipse(s*.38,-s*.15,s*.1,s*.24,0,0,Math.PI*2);c.fill();
        c.strokeStyle='#e11d48';c.lineWidth=1.4;c.beginPath();c.moveTo(0,s*.45);c.lineTo(0,s*.7+Math.sin(t*20)*s*.1);c.lineTo(-s*.12,s*.85);c.moveTo(0,s*.7);c.lineTo(s*.12,s*.85);c.stroke();}
      else{c.fillStyle='rgba(255,255,255,.55)';rr(c,-s*.8,-s*.92,s*1.6,s*.22,s*.1);c.fill();c.fillStyle=c2;for(const [px,py] of [[-.62,-.62],[.62,-.62],[-.62,.62],[.62,.62]]){c.beginPath();c.arc(px*s,py*s,s*.13,0,TAU);c.fill();}
        eye(c,-s*.3,-s*.08,s*.26);eye(c,s*.3,-s*.08,s*.26);c.strokeStyle=c2;c.lineWidth=Math.max(1,s*.1);c.lineCap='round';c.beginPath();if(atk>.5){c.fillStyle=c2;c.arc(0,s*.3,s*.16,0,Math.PI);c.fill();}else{c.arc(0,s*.22,s*.16,.3,Math.PI-.3);c.stroke();}
        c.fillStyle='rgba(251,113,133,.45)';c.beginPath();c.arc(-s*.55,s*.2,s*.1,0,TAU);c.arc(s*.55,s*.2,s*.1,0,TAU);c.fill();}c.restore();};
    if(!L.imp&&!L.snake&&!L.twin){const fw=Math.sin(t*TAU/SPP*4)*.5;c.fillStyle='rgba(186,230,253,.75)';for(const sd of [-1,1]){c.save();c.translate(sd*r*.5,-r*.65);c.rotate(sd*(-.5+fw*.35));c.beginPath();c.ellipse(sd*r*.38,-r*.05,r*.44,r*.2,0,0,TAU);c.fill();c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1;c.stroke();c.restore();}}
    if(L.twin){draw1(-r*.48,r*.62,-.15+Math.sin(t*2)*.05);draw1(r*.48,r*.62,.15-Math.sin(t*2)*.05);}else draw1(0,r*.85,Math.sin(t*2)*.08);
    if(L.imp){c.fillStyle='#7f1d1d';c.beginPath();c.moveTo(-r*.6,-r*.75);c.lineTo(-r*.45,-r*1.25);c.lineTo(-r*.25,-r*.8);c.moveTo(r*.25,-r*.8);c.lineTo(r*.45,-r*1.25);c.lineTo(r*.6,-r*.75);c.fill();
      c.strokeStyle='#7f1d1d';c.lineWidth=1.5;c.beginPath();c.moveTo(-r*.8,r*.4);c.quadraticCurveTo(-r*1.4,r*.6,-r*1.3,r*.1);c.stroke();}
    if(L.crown)crown(c,0,-r*.75,r*.4);
    break;}
  case 'coin':{const s=L.big?1.05:1;c.fillStyle=shade(c1,-.35);c.beginPath();c.arc(-r*.95,r*.15+Math.sin(t*6)*r*.05,r*.36,0,Math.PI*2);c.arc(r*.95,r*.15-Math.sin(t*6)*r*.05,r*.36,0,Math.PI*2);c.fill();
    legs(c,r,t,2,shade(c1,-.4),r*.45);
    c.fillStyle=shade(c1,-.3);c.beginPath();c.arc(0,0,r*.9*s,0,Math.PI*2);c.fill();c.fillStyle=c1;c.beginPath();c.arc(0,-r*.05,r*.85*s,0,Math.PI*2);c.fill();
    c.strokeStyle=c2;c.lineWidth=r*.1;c.beginPath();c.arc(0,-r*.05,r*.68*s,0,Math.PI*2);c.stroke();
    if(L.vault){c.strokeStyle=c2;c.lineWidth=1.5;c.beginPath();c.arc(0,r*.18,r*.3,0,Math.PI*2);c.stroke();for(let k=0;k<8;k++){const a=k*Math.PI/4+t;c.beginPath();c.moveTo(Math.cos(a)*r*.3,r*.18+Math.sin(a)*r*.3);c.lineTo(Math.cos(a)*r*.4,r*.18+Math.sin(a)*r*.4);c.stroke();}
      c.fillStyle=c2;for(const [bx,by] of [[-.55,-.45],[.55,-.45],[-.55,.45],[.55,.45]]){c.beginPath();c.arc(bx*r,by*r,r*.07,0,Math.PI*2);c.fill();}}
    else{c.fillStyle=c2;c.font=`800 ${r*.7}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText('¢',0,r*.25);}
    c.fillStyle='#111';c.fillRect(-r*.42,-r*.38,r*.28,r*.1);c.fillRect(r*.14,-r*.38,r*.28,r*.1);c.fillStyle='#fde68a';c.fillRect(-r*.36,-r*.36,r*.12,r*.07);c.fillRect(r*.2,-r*.36,r*.12,r*.07);
    if(L.bookie){c.fillStyle='#111';c.fillRect(-r*.5,-r*1.05,r,r*.12);rr(c,-r*.32,-r*1.6,r*.64,r*.6,2);c.fill();c.fillStyle='#b91c1c';c.fillRect(-r*.32,-r*1.13,r*.64,r*.1);c.strokeStyle='#fbbf24';c.lineWidth=1;c.beginPath();c.arc(r*.28,-r*.33,r*.16,0,Math.PI*2);c.stroke();}
    break;}
  case 'slot':{const w=r*1.5,h=r*1.85;
    if(L.jinn){const g=c.createLinearGradient(0,h*.3,0,h*.95);g.addColorStop(0,hexA(c1.length===7?c1:'#7c3aed',.8));g.addColorStop(1,'rgba(124,58,237,0)');c.fillStyle=g;c.beginPath();c.moveTo(-w*.4,h*.3);c.quadraticCurveTo(Math.sin(t*4)*w*.4,h*.8,w*.1,h*1.05);c.quadraticCurveTo(w*.2,h*.6,w*.4,h*.3);c.fill();}
    else legs(c,r,t,2,'#2a1a10',r*.5);
    c.fillStyle=shade(c1,-.35);rr(c,-w/2+2,-h/2+3,w,h*.8,r*.25);c.fill();c.fillStyle=c1;rr(c,-w/2,-h/2,w,h*.8,r*.25);c.fill();
    c.fillStyle=c2;rr(c,-w/2+2,-h/2+2,w-4,h*.18,r*.15);c.fill();
    for(let k=0;k<4;k++){c.fillStyle=(Math.floor(t*6)+k)%2?'#fff':'#fbbf24';c.beginPath();c.arc(-w/2+w*(k+.5)/4,-h/2+h*.11,r*.06,0,Math.PI*2);c.fill();}
    c.fillStyle='#fffdf3';rr(c,-w*.38,-h*.22,w*.76,h*.3,3);c.fill();
    c.font=`900 ${r*.42}px Georgia`;c.textAlign='center';c.textBaseline='middle';const syms=['7','♦','♣','★','7','$'];
    for(let k=0;k<3;k++){const sy=atk>.2?syms[(Math.floor(t*20)+k*2)%6]:'7';c.fillStyle=sy==='7'?'#b91c1c':'#111';c.fillText(sy,-w*.25+k*w*.25,-h*.07);}
    eye(c,-w*.18,h*.17,r*.17);eye(c,w*.18,h*.17,r*.17);
    c.strokeStyle='#cbd5e1';c.lineWidth=r*.12;c.beginPath();c.moveTo(w/2,-h*.05);c.lineTo(w/2+r*.3,-h*.05);c.lineTo(w/2+r*.3,-h*.42+(atk>.3?h*.3:0));c.stroke();c.fillStyle='#e11d48';c.beginPath();c.arc(w/2+r*.3,-h*.45+(atk>.3?h*.3:0),r*.16,0,Math.PI*2);c.fill();
    if(L.jinn){c.fillStyle='#fde68a';c.beginPath();c.ellipse(0,-h*.55,w*.3,r*.15,0,0,Math.PI*2);c.fill();c.fillStyle='#e11d48';c.beginPath();c.arc(0,-h*.62,r*.12,0,Math.PI*2);c.fill();}
    break;}
  case 'wheel':{const g=c.createLinearGradient(-r*2.2,0,0,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,L.storm?'rgba(103,232,249,.7)':'rgba(255,240,200,.6)');c.fillStyle=g;c.beginPath();c.moveTo(-r*.2,-r*.7);c.quadraticCurveTo(-r*1.6,-r*.3+Math.sin(t*5)*r*.3,-r*2.3,Math.sin(t*4)*r*.4);c.quadraticCurveTo(-r*1.6,r*.4,-r*.2,r*.7);c.fill();
    const fl=Math.sin(t*3)*r*.1;c.translate(0,fl);
    c.fillStyle='#7a4a1f';c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();
    c.save();c.rotate(t*(atk>.2?12:2));for(let k=0;k<12;k++){c.fillStyle=k===0?'#16a34a':k%2?c1:c2;c.beginPath();c.moveTo(0,0);c.arc(0,0,r*.85,k*Math.PI/6,(k+1)*Math.PI/6);c.closePath();c.fill();}c.restore();
    c.strokeStyle='#e9c46a';c.lineWidth=1.5;c.beginPath();c.arc(0,0,r*.86,0,Math.PI*2);c.stroke();
    c.fillStyle='#e9c46a';c.beginPath();c.arc(0,0,r*.42,0,Math.PI*2);c.fill();eye(c,0,0,r*.28,L.ace?'#0f766e':'#111');
    if(L.ace){c.fillStyle='#111';c.font=`800 ${r*.5}px Georgia`;c.textAlign='center';c.fillText('♠',0,-r*1.05);}
    if(L.storm&&Math.sin(t*9)>.3){c.strokeStyle='#a5f3fc';c.lineWidth=1.5;c.beginPath();c.moveTo(r*.9,-r*.4);c.lineTo(r*1.3,-r*.1);c.lineTo(r*1.05,0);c.lineTo(r*1.4,r*.4);c.stroke();}
    break;}
  case 'card':{const w=r*1.35,h=r*1.9,sw=Math.sin(t*2)*.06;
    if(L.coven){for(const sx of [-1,1]){c.save();c.translate(sx*w*.55,h*.08);c.rotate(sx*.32+Math.sin(t*2+sx)*.08);c.scale(.72,.72);c.fillStyle='rgba(0,0,0,.3)';rr(c,-w/2+2,-h/2+3,w,h,r*.2);c.fill();c.fillStyle='#efe6d2';rr(c,-w/2,-h/2,w,h,r*.2);c.fill();c.strokeStyle=c1;c.lineWidth=2;rr(c,-w/2+3,-h/2+3,w-6,h-6,r*.14);c.stroke();c.fillStyle=c1;c.font=`${r*.8}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText(L.siren?'♥':'♣',0,h*.12);eye(c,-w*.17,-h*.15,r*.16,c1);eye(c,w*.17,-h*.15,r*.16,c1);c.restore();}}
    c.rotate(sw);
    if(L.siren){c.strokeStyle=c2;c.lineWidth=r*.18;c.lineCap='round';for(let k=0;k<4;k++){c.beginPath();c.moveTo(-w*.3+k*w*.2,-h*.45);c.quadraticCurveTo(-w*.8+k*w*.2+Math.sin(t*3+k)*r*.3,0,-w*.6+k*w*.2,h*.45);c.stroke();}}
    c.fillStyle='rgba(0,0,0,.3)';rr(c,-w/2+2,-h/2+3,w,h,r*.2);c.fill();c.fillStyle='#fbf6e8';rr(c,-w/2,-h/2,w,h,r*.2);c.fill();c.strokeStyle=c1;c.lineWidth=2;rr(c,-w/2+3,-h/2+3,w-6,h-6,r*.14);c.stroke();
    c.fillStyle=c1;c.font=`${r*.9}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText(L.siren?'♥':'♣',0,h*.2);
    eye(c,-w*.17,-h*.1,r*.18,c1);eye(c,w*.17,-h*.1,r*.18,c1);
    if(L.hat){c.fillStyle=c1;c.beginPath();c.ellipse(0,-h/2+1,w*.75,r*.18,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(-w*.42,-h/2);c.quadraticCurveTo(-w*.1,-h*1.1,w*.35+Math.sin(t*3)*r*.15,-h*1.05);c.lineTo(w*.42,-h/2);c.fill();c.fillStyle=c2;c.fillRect(-w*.42,-h/2-r*.22,w*.84,r*.14);}
    if(atk>.2){c.fillStyle=hexA('#ffffff',atk*.6);c.beginPath();c.arc(w*.7,-h*.3,r*.3*atk,0,Math.PI*2);c.fill();}
    break;}
  case 'crab':{const s=r;legs(c,s*1.3,t*.7,4,shade(c1,-.4),s*.45);
    c.fillStyle=c1;for(const sx of [-1,1]){c.beginPath();c.arc(sx*s*1.15,s*.2,s*.32,0,Math.PI*2);c.fill();c.fillStyle=shade(c1,-.2);c.beginPath();c.moveTo(sx*s*1.15,s*.2);c.arc(sx*s*1.15,s*.2,s*.32,sx>0?-.6:Math.PI-.0,sx>0?.0:Math.PI+.6);c.fill();c.fillStyle=c1;}
    c.fillStyle=shade(c1,-.3);c.beginPath();c.ellipse(0,s*.25,s*1.05,s*.6,0,0,Math.PI*2);c.fill();c.fillStyle=c1;c.beginPath();c.ellipse(0,s*.15,s,s*.55,0,Math.PI,0);c.fill();c.fillRect(-s,s*.14,s*2,s*.2);
    // house
    const hw=L.big?s*1.25:s*.95,hh=s*.7;c.fillStyle=L.big?'#7f1d1d':'#fef3c7';c.fillRect(-hw/2,-hh-s*.2,hw,hh);c.fillStyle=c2;c.beginPath();c.moveTo(-hw/2-s*.12,-hh-s*.2);c.lineTo(0,-hh-s*.75);c.lineTo(hw/2+s*.12,-hh-s*.2);c.fill();
    c.fillStyle=Math.sin(t*3)>0?'#fde047':'#fbbf24';const nw=L.big?4:2;for(let k=0;k<nw;k++){c.fillRect(-hw/2+hw*(k+.5)/nw-s*.1,-hh*.85-s*.2,s*.2,s*.2);}
    if(L.tower){const tw=s*.42;c.fillStyle='#1f1235';c.fillRect(-tw/2,-hh-s*1.45,tw,s*1.0);c.fillStyle='#fbbf24';for(let k=0;k<4;k++){c.fillRect(-tw/2+s*.05,-hh-s*1.38+k*s*.22,tw-s*.1,s*.06);}
      c.fillStyle=(Math.floor(t*6)%2)?'#ff3d9a':'#22d3ee';c.beginPath();c.moveTo(-tw*.7,-hh-s*1.45);c.lineTo(0,-hh-s*1.85);c.lineTo(tw*.7,-hh-s*1.45);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(0,-hh-s*1.95,s*.06,0,TAU);c.fill();}
    if(L.big){c.save();c.strokeStyle='#ff3d9a';c.lineWidth=1.6;signShape(c,'spade',0,-s*.36,s*.13)();c.stroke();c.restore();}
    if(atk>.5){c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.arc(0,-hh-s*.85,s*.25*atk,0,Math.PI*2);c.fill();}
    for(const sx of [-.35,.35]){c.strokeStyle='#111';c.lineWidth=1.5;c.beginPath();c.moveTo(sx*s,s*.1);c.lineTo(sx*s,-s*.12);c.stroke();eye(c,sx*s,-s*.18,s*.14);}
    break;}
  case 'kraken':{const s=r;if(atk>.3){c.strokeStyle=c1;c.lineCap='round';c.lineWidth=s*.22;for(const sx of [-1,1]){c.beginPath();c.moveTo(sx*s*.55,-s*.2);c.quadraticCurveTo(sx*s*1.25,-s*.9,sx*s*.8,-s*1.45);c.stroke();c.fillStyle=c2;c.beginPath();c.arc(sx*s*.8,-s*1.45,s*.12,0,TAU);c.fill();}}c.strokeStyle=c1;c.lineCap='round';for(let k=0;k<6;k++){const x0=-s*.7+k*s*.28;c.lineWidth=s*.2;c.beginPath();c.moveTo(x0,s*.2);c.quadraticCurveTo(x0+Math.sin(t*4+k)*s*.4,s*.8,x0+Math.sin(t*3+k*2)*s*.3,s*1.1);c.stroke();}
    c.fillStyle=shade(c1,-.25);c.beginPath();c.ellipse(0,0,s*.95,s*.75,0,0,Math.PI*2);c.fill();c.fillStyle=c1;c.beginPath();c.ellipse(0,-s*.1,s*.9,s*.68,0,0,Math.PI*2);c.fill();
    c.fillStyle=c2;rr(c,-s*.6,-s*.85,s*1.2,s*.3,3);c.fill();for(let k=0;k<6;k++){c.fillStyle=(Math.floor(t*5)+k)%2?'#fff':'#e11d48';c.beginPath();c.arc(-s*.5+k*s*.2,-s*.7,s*.05,0,Math.PI*2);c.fill();}
    if(L.crown)crown(c,0,-s*.92,s*.36,'#fbbf24');
    if(L.plated){c.strokeStyle='#cbd5e1';c.lineWidth=s*.08;c.beginPath();c.ellipse(0,-s*.1,s*.9,s*.68,0,Math.PI*.1,Math.PI*.9);c.stroke();c.fillStyle='#e2e8f0';for(let k=0;k<5;k++){const a=Math.PI*(.15+k*.175);c.beginPath();c.arc(Math.cos(a)*s*.9,-s*.1+Math.sin(a)*s*.68,s*.06,0,TAU);c.fill();}
      c.strokeStyle=c2;c.lineWidth=1.5;c.beginPath();c.arc(0,s*.28,s*.2,0,TAU);c.stroke();for(let k=0;k<6;k++){const a=k*Math.PI/3+t*1.5;c.beginPath();c.moveTo(Math.cos(a)*s*.2,s*.28+Math.sin(a)*s*.2);c.lineTo(Math.cos(a)*s*.28,s*.28+Math.sin(a)*s*.28);c.stroke();}}
    eye(c,-s*.3,-s*.05,s*.2);eye(c,s*.3,-s*.05,s*.2);break;}
  case 'drake':{const s=r,w=TAU/SPP,fl=Math.sin(t*w*2),dk=shade(c1,-.35),lt=shade(c1,.25);
    const wing=(ox,oy,col,mem,sc)=>{c.save();c.translate(ox,oy);c.scale(sc,sc);c.rotate(-.15+fl*.22);
      c.fillStyle=mem;c.beginPath();c.moveTo(0,0);c.lineTo(-s*.35,-s*1.15);c.quadraticCurveTo(-s*.55,-s*.9,-s*.75,-s*.95);c.quadraticCurveTo(-s*.85,-s*.65,-s*1.1,-s*.62);c.quadraticCurveTo(-s*1.0,-s*.35,-s*1.2,-s*.22);c.quadraticCurveTo(-s*.6,-s*.15,-s*.3,s*.12);c.closePath();c.fill();
      c.strokeStyle=col;c.lineWidth=s*.09;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(0,0);c.lineTo(-s*.35,-s*1.15);c.stroke();c.lineWidth=s*.05;
      for(const [x,y] of [[-.75,-.95],[-1.1,-.62],[-1.2,-.22]]){c.beginPath();c.moveTo(-s*.3,-s*.95);c.lineTo(x*s,y*s);c.stroke();}
      c.fillStyle=col;c.beginPath();c.arc(-s*.35,-s*1.15,s*.07,0,TAU);c.fill();c.restore();};
    if(!L.shell)wing(-s*.05,-s*.25,dk,hexA(shade(c1,-.5),.95),.92);
    // tail with a spade tip
    {const tx=-s*1.55,ty=-s*.25+Math.sin(t*w)*s*.18;c.strokeStyle=c1;c.lineCap='round';c.lineWidth=s*.34;c.beginPath();c.moveTo(-s*.45,s*.12);c.quadraticCurveTo(-s*1.1,s*.45,tx+s*.12,ty+s*.08);c.stroke();c.lineWidth=s*.18;c.beginPath();c.moveTo(-s*1.1,s*.3);c.quadraticCurveTo(-s*1.35,s*.25,tx,ty);c.stroke();
      c.fillStyle=L.jade?'#fbbf24':c2;c.save();c.translate(tx,ty);c.rotate(-1.9);c.beginPath();c.moveTo(0,-s*.26);c.bezierCurveTo(s*.24,-s*.06,s*.18,s*.12,0,s*.04);c.bezierCurveTo(-s*.18,s*.12,-s*.24,-s*.06,0,-s*.26);c.fill();c.fillRect(-s*.025,0,s*.05,s*.12);c.restore();}
    // hind and fore legs
    for(const [lx,ph,col] of [[-.35,0,dk],[.35,Math.PI,dk],[-.2,Math.PI,c1],[.48,0,c1]]){const a=Math.sin(t*w*2+ph)*.35;c.save();c.translate(lx*s,s*.25);c.rotate(a);c.fillStyle=col;rr(c,-s*.12,0,s*.24,s*.5,s*.1);c.fill();c.fillStyle='#f8f5ec';for(let k=-1;k<=1;k++){c.beginPath();c.moveTo(k*s*.08+s*.04,s*.48);c.lineTo(k*s*.08+s*.12,s*.58);c.lineTo(k*s*.08,s*.52);c.fill();}c.restore();}
    // body
    {const g=c.createLinearGradient(0,-s*.5,0,s*.5);g.addColorStop(0,lt);g.addColorStop(1,c1);c.fillStyle=g;}c.beginPath();c.ellipse(0,s*.05,s*.78,s*.48,-.08,0,TAU);c.fill();
    c.fillStyle=c2;c.beginPath();c.ellipse(s*.08,s*.25,s*.55,s*.22,-.08,0,TAU);c.fill();c.strokeStyle=shade(c2,-.25);c.lineWidth=1;for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(s*.08+k*s*.18,s*.06);c.quadraticCurveTo(s*.1+k*s*.18,s*.25,s*.08+k*s*.18,s*.44);c.stroke();}
    // neck and head
    c.strokeStyle=c1;c.lineWidth=s*.36;c.beginPath();c.moveTo(s*.45,-s*.05);c.quadraticCurveTo(s*.75,-s*.25,s*.72,-s*.62);c.stroke();
    c.strokeStyle=c2;c.lineWidth=s*.14;c.beginPath();c.moveTo(s*.6,s*.05);c.quadraticCurveTo(s*.92,-s*.2,s*.88,-s*.55);c.stroke();
    const hx=s*.86,hy=-s*.78;
    c.fillStyle=L.jade?'#fbbf24':shade(c2,-.1);for(const [ox,oy,rot] of [[-.12,-.12,-.9],[.02,-.18,-.6]]){c.save();c.translate(hx+ox*s,hy+oy*s);c.rotate(rot);c.beginPath();c.moveTo(-s*.06,0);c.quadraticCurveTo(-s*.08,-s*.3,-s*.22,-s*.42);c.quadraticCurveTo(s*.02,-s*.3,s*.07,0);c.fill();c.restore();}
    c.fillStyle=c1;c.beginPath();c.ellipse(hx,hy,s*.3,s*.24,.15,0,TAU);c.fill();
    c.beginPath();c.moveTo(hx+s*.05,hy-s*.16);c.quadraticCurveTo(hx+s*.42,hy-s*.12,hx+s*.5,hy+s*.02);c.lineTo(hx+s*.48,hy+s*.08);c.lineTo(hx+s*.05,hy+s*.12);c.closePath();c.fill();
    const open=atk>.3?s*.12:0;c.fillStyle=lt;c.beginPath();c.moveTo(hx+s*.02,hy+s*.12);c.lineTo(hx+s*.46,hy+s*.1+open*.4);c.quadraticCurveTo(hx+s*.3,hy+s*.24+open,hx-s*.05,hy+s*.2);c.closePath();c.fill();
    if(open){c.fillStyle='#7f1d1d';c.beginPath();c.moveTo(hx+s*.1,hy+s*.11);c.lineTo(hx+s*.44,hy+s*.1);c.lineTo(hx+s*.3,hy+s*.18);c.closePath();c.fill();}
    c.fillStyle='#0b0612';c.beginPath();c.arc(hx+s*.42,hy-s*.04,s*.03,0,TAU);c.fill();
    c.fillStyle=dk;c.beginPath();c.moveTo(hx-s*.06,hy-s*.12);c.lineTo(hx+s*.2,hy-s*.16);c.lineTo(hx+s*.14,hy-s*.06);c.closePath();c.fill();
    eye(c,hx+s*.08,hy-s*.05,s*.1);
    // spikes down the back
    c.fillStyle=c2;for(let k=0;k<5;k++){const f=k/4,x=s*(.62-f*1.1),y=-s*(.62-f*.12)+(k<2?-s*.0:s*.18*f);c.beginPath();c.moveTo(x-s*.09,y+s*.08);c.lineTo(x,y-s*.14);c.lineTo(x+s*.09,y+s*.08);c.fill();}
    if(!L.jade&&!L.crown&&!L.genie&&!L.shell){c.fillStyle='#dcfce7';for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){c.beginPath();c.arc(-s*.28+dx*s*.08,-s*.02+dy*s*.08,s*.08,0,Math.PI*2);c.fill();}c.strokeStyle='#dcfce7';c.lineWidth=1.2;c.beginPath();c.moveTo(-s*.28,-s*.02);c.lineTo(-s*.2,s*.14);c.stroke();}
    if(L.jade){c.fillStyle='#fbbf24';c.beginPath();c.arc(s*.1,-s*.12,s*.09,0,TAU);c.fill();c.fillStyle='#fef3c7';c.beginPath();c.arc(s*.08,-s*.14,s*.03,0,TAU);c.fill();}
    if(!L.shell)wing(s*.1,-s*.22,lt,hexA(shade(c1,-.18),.96),1);
    if(L.shell){c.fillStyle='#fde68a';c.beginPath();c.arc(-s*.15,-s*.35,s*.45,0,TAU);c.fill();c.strokeStyle='#b45309';c.lineWidth=1.6;c.beginPath();for(let i=0;i<40;i++){const a2=i*.32,rr2=s*.42*(1-i/44);c.lineTo(-s*.15+Math.cos(a2)*rr2,-s*.35+Math.sin(a2)*rr2);}c.stroke();}
    if(L.crown)crown(c,s*.86,-s*1.02,s*.24,'#fbbf24');
    if(L.genie){c.save();c.translate(-s*.05,-s*.55);c.fillStyle='#6d28d9';c.beginPath();c.moveTo(-s*.22,s*.12);c.quadraticCurveTo(-s*.25,-s*.35,0,-s*.38);c.quadraticCurveTo(s*.25,-s*.35,s*.22,s*.12);c.closePath();c.fill();c.fillStyle='#a78bfa';c.beginPath();c.arc(0,-s*.5,s*.17,0,TAU);c.fill();eye(c,-s*.06,-s*.52,s*.06);eye(c,s*.07,-s*.52,s*.06);
      c.fillStyle='#fbbf24';c.beginPath();c.ellipse(0,-s*.66,s*.2,s*.1,0,0,TAU);c.fill();c.fillStyle='#e11d48';c.beginPath();c.arc(s*.04,-s*.66,s*.05,0,TAU);c.fill();c.fillStyle='#fde68a';c.beginPath();c.arc(s*.28,-s*.25,s*.09+(atk>.3?s*.05:0),0,TAU);c.fill();c.restore();}
    break;}
  case 'dealer':{const s=r,w=TAU/SPP,fl=Math.sin(t*w)*s*.07;c.translate(0,fl-s*.08);
    {const g=c.createRadialGradient(0,-s*.2,s*.1,0,-s*.2,s*1.3);g.addColorStop(0,hexA(c2,.4));g.addColorStop(1,hexA(c2,0));c.fillStyle=g;c.beginPath();c.arc(0,-s*.2,s*1.3,0,TAU);c.fill();}
    const SU=['♠','♥','♦'],card=(k,front)=>{const a=t*w+k*TAU/3,x=Math.cos(a)*s*1.02,y=-s*.15+Math.sin(a)*s*.32;if((Math.sin(a)>0)!==front)return;c.save();c.translate(x,y);c.rotate(Math.cos(a)*.4);const sc=front?1:.82;c.scale(sc,sc);c.fillStyle='#fbf6e8';rr(c,-s*.13,-s*.18,s*.26,s*.36,s*.04);c.fill();c.strokeStyle=hexA(c2,.9);c.lineWidth=1;c.stroke();c.fillStyle=k===0?'#111':'#c8102e';c.font=`700 ${s*.22}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText(SU[k],0,s*.01);c.restore();};
    for(let k=0;k<3;k++)card(k,false);
    // robe with a wavy hem
    {const g=c.createLinearGradient(-s*.6,0,s*.6,0);g.addColorStop(0,shade(c1,.18));g.addColorStop(.5,c1);g.addColorStop(1,shade(c1,-.3));c.fillStyle=g;}
    c.beginPath();c.moveTo(-s*.42,-s*.3);c.quadraticCurveTo(-s*.55,s*.3,-s*.7,s*.95);for(let k=0;k<=4;k++){const x=-s*.7+k*s*.35,y=s*.95+Math.sin(t*w*2+k*1.3)*s*.07+(k%2?s*.1:0);c.lineTo(x,y);}c.quadraticCurveTo(s*.55,s*.3,s*.42,-s*.3);c.closePath();c.fill();
    c.strokeStyle=hexA(c2,.7);c.lineWidth=1.2;c.beginPath();c.moveTo(-s*.62,s*.72);c.quadraticCurveTo(0,s*.62,s*.62,s*.72);c.stroke();
    // shirt, waistcoat and bow tie
    c.fillStyle='#f5f0e6';c.beginPath();c.moveTo(-s*.2,-s*.3);c.lineTo(0,s*.35);c.lineTo(s*.2,-s*.3);c.fill();
    c.fillStyle=shade(c1,-.45);c.beginPath();c.moveTo(-s*.2,-s*.3);c.lineTo(-s*.06,s*.35);c.lineTo(-s*.32,s*.3);c.lineTo(-s*.38,-s*.25);c.closePath();c.moveTo(s*.2,-s*.3);c.lineTo(s*.06,s*.35);c.lineTo(s*.32,s*.3);c.lineTo(s*.38,-s*.25);c.closePath();c.fill();
    c.fillStyle='#fbbf24';for(const by of [-.05,.12])c.fillRect(-s*.03,s*by,s*.06,s*.05);
    c.fillStyle='#b91c1c';c.beginPath();c.moveTo(0,-s*.24);c.lineTo(-s*.14,-s*.32);c.lineTo(-s*.14,-s*.16);c.closePath();c.moveTo(0,-s*.24);c.lineTo(s*.14,-s*.32);c.lineTo(s*.14,-s*.16);c.closePath();c.fill();
    // raised arms with glowing hands
    const lift=atk>.3?s*.2:Math.sin(t*w)*s*.05;
    for(const sx of [-1,1]){const hx=sx*s*.8,hy=-s*.5-lift*(sx>0?1:.5);
      c.fillStyle=shade(c1,sx<0?.1:-.12);c.beginPath();c.moveTo(sx*s*.3,-s*.32);c.quadraticCurveTo(sx*s*.55,-s*.38,hx-sx*s*.02,hy-s*.1);c.lineTo(hx+sx*s*.1,hy+s*.16);c.quadraticCurveTo(sx*s*.6,-s*.02,sx*s*.36,s*.02);c.closePath();c.fill();
      c.strokeStyle=c2;c.lineWidth=s*.07;c.beginPath();c.moveTo(hx-sx*s*.04,hy-s*.08);c.lineTo(hx+sx*s*.1,hy+s*.14);c.stroke();
      const g=c.createRadialGradient(hx,hy-s*.05,0,hx,hy-s*.05,s*.32);g.addColorStop(0,'#fff');g.addColorStop(.3,hexA(c2,.9));g.addColorStop(1,hexA(c2,0));c.fillStyle=g;c.beginPath();c.arc(hx,hy-s*.05,s*.32,0,TAU);c.fill();
      c.fillStyle='#e9d5b5';c.beginPath();c.arc(hx,hy,s*.1,0,TAU);c.fill();}
    if(atk>.3||Math.sin(t*w*3)>.75){c.strokeStyle=hexA(c2,.95);c.lineWidth=1.4;c.beginPath();let x=-s*.78,y=-s*.55;c.moveTo(x,y);for(let k=1;k<=6;k++){x=-s*.78+k*s*.26;y=-s*.55-Math.sin(k*2.3+t*30)*s*.12;c.lineTo(x,y);}c.stroke();}
    // head
    c.fillStyle='#e9d5b5';c.beginPath();c.arc(0,-s*.6,s*.34,0,Math.PI*2);c.fill();c.fillStyle='rgba(0,0,0,.12)';c.beginPath();c.arc(s*.1,-s*.55,s*.26,-.3,1.6);c.fill();
    const beard=()=>{if(!L.beard)return;c.fillStyle=L.beard;c.beginPath();c.moveTo(-s*.3,-s*.58);c.quadraticCurveTo(-s*.32,-s*.2,0,s*.12);c.quadraticCurveTo(s*.32,-s*.2,s*.3,-s*.58);c.quadraticCurveTo(s*.15,-s*.36,0,-s*.42);c.quadraticCurveTo(-s*.15,-s*.36,-s*.3,-s*.58);c.fill();c.fillStyle='rgba(0,0,0,.08)';c.beginPath();c.moveTo(0,-s*.3);c.lineTo(-s*.05,0);c.lineTo(s*.05,0);c.fill();};
    c.save();c.shadowColor=c2;c.shadowBlur=8;c.fillStyle=hexA(c2,.95);c.beginPath();c.moveTo(-s*.36,-s*.7);c.lineTo(s*.36,-s*.7);c.lineTo(s*.48,-s*.6);c.lineTo(-s*.22,-s*.6);c.closePath();c.fill();c.restore();
    c.fillStyle='#fff';for(const ex of [-.13,.14]){c.beginPath();c.ellipse(s*ex,-s*.55,s*.06,s*.035,0,0,TAU);c.fill();}
    if(L.beard)beard();else{c.strokeStyle='#5b3a2a';c.lineWidth=1;c.beginPath();c.arc(s*.01,-s*.44,s*.08,.3,Math.PI-.3);c.stroke();}
    if(L.top){c.fillStyle='#111';c.beginPath();c.ellipse(0,-s*.86,s*.42,s*.07,0,0,TAU);c.fill();rr(c,-s*.26,-s*1.32,s*.52,s*.46,2);c.fill();c.fillStyle=c2;c.fillRect(-s*.26,-s*.98,s*.52,s*.07);}
    else{c.fillStyle='#e5e7eb';c.beginPath();c.ellipse(-s*.3,-s*.75,s*.1,s*.14,-.4,0,TAU);c.ellipse(s*.3,-s*.75,s*.1,s*.14,.4,0,TAU);c.fill();}
    if(L.clock){const cy=-s*1.62;c.save();c.shadowColor='#fde68a';c.shadowBlur=10;c.fillStyle='#fef3c7';c.beginPath();c.arc(0,cy,s*.3,0,TAU);c.fill();c.restore();c.strokeStyle='#b45309';c.lineWidth=2;c.beginPath();c.arc(0,cy,s*.3,0,TAU);c.stroke();
      c.fillStyle='#3b0764';for(let k=0;k<12;k++){const a=k*TAU/12;c.fillRect(Math.cos(a)*s*.23-.6,cy+Math.sin(a)*s*.23-.6,1.2,1.2);}
      c.strokeStyle='#3b0764';c.lineWidth=1.4;c.beginPath();c.moveTo(0,cy);c.lineTo(Math.cos(t*4)*s*.2,cy+Math.sin(t*4)*s*.2);c.moveTo(0,cy);c.lineTo(Math.cos(t*.4)*s*.13,cy+Math.sin(t*.4)*s*.13);c.stroke();
      c.strokeStyle=hexA('#fde68a',.6);c.lineWidth=1;c.beginPath();c.arc(0,cy,s*.42,t*2,t*2+2);c.stroke();}
    if(L.cloud){const cy=-s*1.7;if(Math.sin(t*9)>.3){c.strokeStyle='#e0f2fe';c.lineWidth=1.8;c.beginPath();c.moveTo(s*.05,cy+s*.25);c.lineTo(-s*.1,cy+s*.5);c.lineTo(s*.06,cy+s*.55);c.lineTo(-s*.06,cy+s*.85);c.stroke();}
      c.strokeStyle='rgba(125,211,252,.6)';c.lineWidth=1;for(let k=0;k<5;k++){const x=(-.4+k*.2)*s,y=cy+s*.25+((t*3+k*.37)%1)*s*.5;c.beginPath();c.moveTo(x,y);c.lineTo(x-s*.03,y+s*.1);c.stroke();}
      c.fillStyle='#334155';for(const [x,y,rr2] of [[-.36,.05,.26],[0,-.08,.34],[.36,.04,.26],[.15,.12,.22],[-.18,.12,.22]]){c.beginPath();c.arc(s*x,cy+s*y,s*rr2,0,TAU);c.fill();}c.fillStyle='#64748b';c.beginPath();c.arc(-s*.05,cy-s*.15,s*.18,0,TAU);c.fill();}
    for(let k=0;k<3;k++)card(k,true);
    break;}
  case 'hydra':{const s=r,w=TAU/SPP,dk=shade(c1,-.35),lt=shade(c1,.25);
    for(const [lx,ph,col] of [[-.45,0,dk],[.35,Math.PI,dk],[-.25,Math.PI,c1],[.55,0,c1]]){const a=Math.sin(t*w*2+ph)*.3;c.save();c.translate(lx*s,s*.3);c.rotate(a);c.fillStyle=col;rr(c,-s*.13,0,s*.26,s*.5,s*.1);c.fill();c.fillStyle='#f8f5ec';for(let k=-1;k<=1;k++){c.beginPath();c.moveTo(k*s*.08+s*.04,s*.48);c.lineTo(k*s*.08+s*.12,s*.58);c.lineTo(k*s*.08,s*.52);c.fill();}c.restore();}
    c.strokeStyle=c1;c.lineWidth=s*.32;c.lineCap='round';c.beginPath();c.moveTo(-s*.6,s*.15);c.quadraticCurveTo(-s*1.3,s*.4,-s*1.45,-s*.05+Math.sin(t*w)*s*.15);c.stroke();
    // club-shaped tail tip
    {const tx=-s*1.48,ty=-s*.1+Math.sin(t*w)*s*.15;c.fillStyle='#14532d';for(const [dx,dy] of [[0,-1],[.9,.4],[-.9,.4]]){c.beginPath();c.arc(tx+dx*s*.12,ty+dy*s*.12,s*.13,0,TAU);c.fill();}}
    {const g=c.createLinearGradient(0,-s*.45,0,s*.6);g.addColorStop(0,lt);g.addColorStop(1,c1);c.fillStyle=g;}c.beginPath();c.ellipse(0,s*.1,s*.85,s*.55,0,0,TAU);c.fill();
    c.fillStyle=c2;c.beginPath();c.ellipse(s*.05,s*.3,s*.6,s*.24,0,0,TAU);c.fill();c.strokeStyle=shade(c2,-.25);c.lineWidth=1;for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(s*.05+k*s*.2,s*.1);c.quadraticCurveTo(s*.07+k*s*.2,s*.3,s*.05+k*s*.2,s*.5);c.stroke();}
    c.fillStyle=c2;for(let k=0;k<4;k++){const x=-s*.55+k*s*.3,y=-s*.4+Math.abs(k-1.5)*s*.06;c.beginPath();c.moveTo(x-s*.09,y+s*.08);c.lineTo(x,y-s*.14);c.lineTo(x+s*.09,y+s*.08);c.fill();}
    const heads=[[.4,-1.35,-.25],[1.25,-.55,.15],[.98,-1.08,-.05]];
    heads.forEach(([hx,hy,ph],i)=>{const sw=Math.sin(t*w+i*2.1)*s*.1,X=s*hx+sw,Y=s*hy;c.strokeStyle=i===2?lt:c1;c.lineWidth=s*.27;c.beginPath();c.moveTo(s*.35,-s*.15);c.quadraticCurveTo(s*(hx*.55),s*(hy*.35),X-s*.1,Y+s*.05);c.stroke();
      c.save();c.translate(X,Y);c.rotate(ph);
      c.fillStyle='#14532d';for(const [dx,dy] of [[0,-1],[.9,-.2],[-.9,-.2]]){c.beginPath();c.arc(-s*.05+dx*s*.09,-s*.24+dy*s*.09,s*.1,0,TAU);c.fill();}c.fillRect(-s*.07,-s*.25,s*.04,s*.12);
      c.fillStyle=i===2?lt:c1;c.beginPath();c.ellipse(0,0,s*.27,s*.2,0,0,TAU);c.fill();
      c.beginPath();c.moveTo(s*.05,-s*.14);c.quadraticCurveTo(s*.38,-s*.1,s*.44,s*.02);c.lineTo(s*.05,s*.12);c.closePath();c.fill();
      const op=atk>.3?s*.1:0;c.fillStyle=shade(c1,.4);c.beginPath();c.moveTo(s*.02,s*.1);c.lineTo(s*.4,s*.06+op*.3);c.quadraticCurveTo(s*.25,s*.2+op,-s*.05,s*.17);c.closePath();c.fill();
      if(op){c.fillStyle='#14532d';c.beginPath();c.moveTo(s*.08,s*.09);c.lineTo(s*.38,s*.07);c.lineTo(s*.25,s*.15);c.fill();c.fillStyle='rgba(134,239,172,.85)';c.beginPath();c.arc(s*.5,s*.08,s*.09,0,TAU);c.fill();}
      c.fillStyle='#0b0612';c.beginPath();c.arc(s*.36,-s*.04,s*.025,0,TAU);c.fill();eye(c,s*.06,-s*.06,s*.09);c.restore();});
    break;}
  case 'phoenix':{const s=r,w=TAU/SPP,fl=Math.sin(t*w*2),ST=!!L.storm,mid=ST?'#3b82f6':'#fb923c',hot=ST?'#e0f2fe':'#fef08a';c.translate(0,Math.sin(t*w)*s*.1-s*.2);
    {const g=c.createRadialGradient(0,-s*.1,s*.1,0,-s*.1,s*1.4);g.addColorStop(0,hexA(ST?'#60a5fa':'#f97316',.5));g.addColorStop(1,hexA(ST?'#60a5fa':'#f97316',0));c.fillStyle=g;c.beginPath();c.arc(0,-s*.1,s*1.4,0,TAU);c.fill();}
    // tail plumes streaming down
    for(let k=-2;k<=2;k++){const sw=Math.sin(t*w*2+k)*s*.12,len=s*(1.05-Math.abs(k)*.12);c.fillStyle=[c1,mid,c2,mid,c1][k+2];const tx=k*s*.38+sw,ty=s*.25+len;c.beginPath();c.moveTo(-s*.1,s*.25);c.quadraticCurveTo(k*s*.2-s*.2+sw*.5,s*.65,tx,ty);c.quadraticCurveTo(k*s*.2+s*.2+sw*.5,s*.65,s*.1,s*.25);c.fill();
      c.fillStyle=k%2?c2:hot;c.beginPath();c.moveTo(-s*.03,s*.35);c.quadraticCurveTo(k*s*.15-s*.06+sw*.5,s*.62,tx*.85,ty*.9);c.quadraticCurveTo(k*s*.15+s*.06+sw*.5,s*.62,s*.03,s*.35);c.fill();}
    // wings in a V, three feather layers each
    for(const sd of [-1,1]){c.save();c.scale(sd,1);c.rotate(-fl*.18);
      for(const [col,sc] of [[c1,1],[mid,.78],[c2,.55]]){c.fillStyle=col;c.beginPath();c.moveTo(s*.1,-s*.05);
        for(let f=0;f<=5;f++){const a=-.05-f*.27,R=s*1.35*sc*(1-f*.06);const x=s*.1+Math.cos(a)*R,y=-s*.05+Math.sin(a)*R*.95;c.lineTo(x,y);const a2=a-.12,R2=R*.8;c.lineTo(s*.1+Math.cos(a2)*R2,-s*.05+Math.sin(a2)*R2*.95);}
        c.lineTo(s*.12,-s*.35);c.closePath();c.fill();}
      c.restore();}
    // body
    c.fillStyle=c1;c.beginPath();c.ellipse(0,s*.08,s*.3,s*.42,0,0,TAU);c.fill();c.fillStyle=c2;c.beginPath();c.ellipse(0,s*.16,s*.18,s*.3,0,0,TAU);c.fill();
    // head and crest
    for(let k=-1;k<=1;k++){c.fillStyle=k?mid:c2;c.beginPath();c.moveTo(k*s*.06-s*.05,-s*.52);c.quadraticCurveTo(k*s*.22,-s*(.95+Math.sin(t*w*3+k)*.08),k*s*.3,-s*(.92+(k?0:.12)));c.quadraticCurveTo(k*s*.12,-s*.7,k*s*.06+s*.05,-s*.5);c.fill();}
    c.fillStyle=c1;c.beginPath();c.arc(0,-s*.42,s*.22,0,TAU);c.fill();
    c.fillStyle='#fbbf24';c.beginPath();c.moveTo(-s*.07,-s*.38);c.lineTo(0,-s*.18);c.lineTo(s*.07,-s*.38);c.fill();
    eye(c,-s*.09,-s*.46,s*.07);eye(c,s*.09,-s*.46,s*.07);
    if(ST&&Math.sin(t*w*3)>.2){c.strokeStyle='#fef9c3';c.lineWidth=1.5;for(const sd of [-1,1]){c.beginPath();c.moveTo(sd*s*.9,-s*.9);c.lineTo(sd*s*1.05,-s*.6);c.lineTo(sd*s*.92,-s*.58);c.lineTo(sd*s*1.08,-s*.25);c.stroke();}}
    break;}
  case 'wyrm':{const s=r,w=TAU/SPP;const seg=9;let px=0,py=0;const pts=[];for(let i=0;i<seg;i++){const u2=i/(seg-1);pts.push([-s*1.5+u2*s*2.3,Math.sin(t*w+u2*5)*s*.32-s*.15*u2]);}
    for(let i=0;i<seg;i++){const [x,y]=pts[i],rr2=s*(.18+.22*Math.sin(i/seg*Math.PI));c.fillStyle=i%2?c1:shade(c1,-.12);c.beginPath();c.arc(x,y,rr2,0,TAU);c.fill();c.fillStyle=c2;c.beginPath();c.arc(x,y+rr2*.45,rr2*.5,0,TAU);c.fill();}
    for(let i=1;i<seg-1;i+=2){const [x,y]=pts[i];c.fillStyle='#fef3c7';c.beginPath();c.moveTo(x,y-s*.3);c.lineTo(x+s*.08,y-s*.48);c.lineTo(x+s*.16,y-s*.3);c.fill();}
    const [hx,hy]=pts[seg-1];c.fillStyle=c1;c.beginPath();c.ellipse(hx+s*.2,hy-s*.05,s*.38,s*.27,.1,0,TAU);c.fill();c.fillStyle=shade(c1,.25);c.beginPath();c.ellipse(hx+s*.45,hy+s*.02,s*.18,s*.13,.1,0,TAU);c.fill();eye(c,hx+s*.18,hy-s*.14,s*.1);
    c.strokeStyle=c2;c.lineWidth=1.3;c.beginPath();c.moveTo(hx+s*.5,hy+s*.06);c.quadraticCurveTo(hx+s*.75,hy+s*.25,hx+s*.95,hy+s*.12+Math.sin(t*w*2)*s*.08);c.moveTo(hx+s*.45,hy+s*.1);c.quadraticCurveTo(hx+s*.6,hy+s*.35,hx+s*.8,hy+s*.38);c.stroke();
    c.strokeStyle='#fef3c7';c.lineWidth=2;c.beginPath();c.moveTo(hx+s*.05,hy-s*.22);c.lineTo(hx-s*.1,hy-s*.55);c.moveTo(hx+s*.22,hy-s*.25);c.lineTo(hx+s*.18,hy-s*.58);c.stroke();
    c.fillStyle='#fde047';for(let k=0;k<3;k++){const a=t*w+k*2.1;c.beginPath();c.arc(Math.cos(a)*s*1.2,s*.6+Math.sin(a)*s*.15,s*.08,0,TAU);c.fill();}break;}
  case 'whale':{const s=r,w=TAU/SPP,tl=Math.sin(t*w)*.35;c.save();c.translate(-s*1.05,-s*.05);c.rotate(tl);c.fillStyle=shade(c1,-.15);c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-s*.35,-s*.15,-s*.6,-s*.45);c.quadraticCurveTo(-s*.4,0,-s*.6,s*.4);c.quadraticCurveTo(-s*.35,s*.12,0,s*.05);c.fill();c.restore();
    c.fillStyle=c1;c.beginPath();c.moveTo(-s*1.1,0);c.quadraticCurveTo(-s*.9,-s*.75,s*.2,-s*.72);c.quadraticCurveTo(s*1.1,-s*.65,s*1.05,s*.05);c.quadraticCurveTo(s*.9,s*.6,0,s*.58);c.quadraticCurveTo(-s*.8,s*.5,-s*1.1,0);c.fill();
    c.fillStyle=c2;c.beginPath();c.moveTo(-s*.6,s*.32);c.quadraticCurveTo(s*.2,s*.62,s*.95,s*.18);c.quadraticCurveTo(s*.4,s*.38,-s*.6,s*.32);c.fill();c.strokeStyle=shade(c2,-.25);c.lineWidth=1;for(let k=0;k<4;k++){c.beginPath();c.moveTo(-s*.2+k*s*.25,s*.38);c.lineTo(-s*.12+k*s*.25,s*.5);c.stroke();}
    eye(c,s*.6,-s*.2,s*.12);c.fillStyle=shade(c1,-.2);c.beginPath();c.ellipse(s*.15,s*.2,s*.22,s*.09,.5,0,TAU);c.fill();
    const sp2=(Math.sin(t*w)+1)/2;c.strokeStyle='#bfdbfe';c.lineWidth=2;c.lineCap='round';for(const d of [-1,0,1]){c.beginPath();c.moveTo(s*.1,-s*.72);c.quadraticCurveTo(s*.1+d*s*.2,-s*(1.1+sp2*.3),s*.1+d*s*.42,-s*(.85+sp2*.2));c.stroke();}
    if(L.crown)crown(c,s*.35,-s*.78,s*.24,'#fbbf24');break;}
  case 'lamp':{const s=r,w=TAU/SPP,sm=Math.sin(t*w);c.fillStyle='rgba(94,234,212,.35)';for(let k=0;k<4;k++){c.beginPath();c.arc(s*.55+Math.sin(t*w+k)*s*.12,-s*(.1+k*.28),s*(.16+k*.06),0,TAU);c.fill();}
    c.fillStyle=c2;c.beginPath();c.moveTo(s*.35,-s*1.25);c.quadraticCurveTo(s*.05,-s*.85,s*.5,-s*.45);c.quadraticCurveTo(s*.85,-s*.85,s*.65,-s*1.25);c.closePath();c.fill();
    c.fillStyle=shade(c2,.25);c.beginPath();c.arc(s*.5,-s*1.45,s*.24,0,TAU);c.fill();eye(c,s*.43,-s*1.48,s*.06);eye(c,s*.58,-s*1.48,s*.06);c.fillStyle='#fbbf24';c.beginPath();c.ellipse(s*.5,-s*1.66,s*.24,s*.1,0,0,TAU);c.fill();c.fillStyle='#e11d48';c.beginPath();c.arc(s*.5,-s*1.66,s*.05,0,TAU);c.fill();
    c.strokeStyle=c2;c.lineWidth=s*.1;c.lineCap='round';c.beginPath();c.moveTo(s*.3,-s*1.05);c.lineTo(s*.12-(atk>.3?s*.15:0),-s*(1.2+(atk>.3?.25:0)));c.moveTo(s*.7,-s*1.05);c.lineTo(s*.88+(atk>.3?s*.15:0),-s*(1.2+(atk>.3?.25:0)));c.stroke();
    c.fillStyle=shade(c1,-.25);c.beginPath();c.ellipse(-s*.05,s*.42,s*.5,s*.12,0,0,TAU);c.fill();c.fillStyle=c1;c.beginPath();c.moveTo(-s*.75,s*.1);c.quadraticCurveTo(-s*.6,-s*.32,s*.05,-s*.28);c.quadraticCurveTo(s*.5,-s*.25,s*.55,-s*.05);c.lineTo(s*.95,-s*.3);c.lineTo(s*.8,s*.08);c.quadraticCurveTo(s*.4,s*.38,-s*.3,s*.36);c.closePath();c.fill();
    c.strokeStyle=c1;c.lineWidth=s*.09;c.beginPath();c.arc(-s*.82,s*.02,s*.2,Math.PI*.5,Math.PI*1.6);c.stroke();c.fillStyle=shade(c1,.35);c.beginPath();c.ellipse(-s*.1,-s*.1,s*.3,s*.08,-.1,0,TAU);c.fill();c.fillStyle=c1;c.beginPath();c.arc(-s*.05,-s*.34,s*.1,0,TAU);c.fill();break;}
  case 'horse':{const s=r,w=TAU/SPP,g=t*w*2,coat=c1,mane=c2,dk=shade(c1,-.3),bob=Math.sin(g*2)*s*.05;
    const leg=(x,ph,front,col)=>{const a=Math.sin(g+ph)*.55,b=front?-Math.max(0,Math.sin(g+ph+.6))*1.1:Math.max(0,-Math.sin(g+ph+.6))*1.1;c.save();c.translate(x,s*.15);c.rotate(a);c.strokeStyle=col;c.lineWidth=s*.13;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(0,s*.32);c.stroke();c.translate(0,s*.32);c.rotate(b);c.lineWidth=s*.1;c.beginPath();c.moveTo(0,0);c.lineTo(0,s*.3);c.stroke();c.fillStyle='#1c1917';c.fillRect(-s*.07,s*.26,s*.15,s*.08);c.restore();};
    c.translate(0,bob);
    leg(-s*.55,0,false,dk);leg(s*.45,Math.PI*.6,true,dk);
    // tail
    c.fillStyle=mane;c.beginPath();c.moveTo(-s*.8,-s*.15);c.quadraticCurveTo(-s*1.35,-s*.1+Math.sin(g)*s*.1,-s*1.3,s*.45);c.quadraticCurveTo(-s*1.05,s*.15,-s*.78,s*.02);c.fill();
    {const gr=c.createLinearGradient(0,-s*.4,0,s*.35);gr.addColorStop(0,shade(coat,.2));gr.addColorStop(1,coat);c.fillStyle=gr;}c.beginPath();c.ellipse(-s*.05,-s*.02,s*.85,s*.36,0,0,TAU);c.fill();
    leg(-s*.4,Math.PI,false,coat);leg(s*.55,Math.PI*1.6,true,coat);
    // neck and head
    c.fillStyle=coat;c.beginPath();c.moveTo(s*.45,-s*.25);c.quadraticCurveTo(s*.75,-s*.75,s*.95,-s*.85);c.lineTo(s*1.12,-s*.68);c.quadraticCurveTo(s*.85,-s*.35,s*.75,s*.1);c.closePath();c.fill();
    c.beginPath();c.ellipse(s*1.12,-s*.72,s*.32,s*.15,.55,0,TAU);c.fill();c.fillStyle=shade(coat,-.2);c.beginPath();c.arc(s*1.3,-s*.58,s*.07,0,TAU);c.fill();
    c.fillStyle=coat;c.beginPath();c.moveTo(s*.9,-s*.95);c.lineTo(s*.95,-s*1.12);c.lineTo(s*1.02,-s*.92);c.fill();
    c.fillStyle=mane;c.beginPath();c.moveTo(s*.5,-s*.35);c.quadraticCurveTo(s*.65,-s*.8,s*.92,-s*.95);c.lineTo(s*.8,-s*.7);c.quadraticCurveTo(s*.6,-s*.45,s*.55,-s*.2);c.fill();
    c.fillStyle='#fff';c.beginPath();c.moveTo(s*1.05,-s*.85);c.lineTo(s*1.32,-s*.62);c.lineTo(s*1.25,-s*.58);c.lineTo(s*1.02,-s*.76);c.fill();
    eye(c,s*1.0,-s*.82,s*.07);
    // saddle cloth with a number
    c.fillStyle=L.silk2||'#fff';rr(c,-s*.35,-s*.32,s*.5,s*.36,s*.05);c.fill();c.fillStyle='#111';c.font=`800 ${s*.24}px Barlow,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(L.num||'1',-s*.1,-s*.13);
    if(!L.nojockey){// jockey in silks
      c.fillStyle='#f8fafc';c.beginPath();c.ellipse(-s*.02,-s*.42,s*.12,s*.2,.3,0,TAU);c.fill();
      c.fillStyle=L.silk||'#dc2626';c.beginPath();c.ellipse(s*.05,-s*.68,s*.2,s*.26,.5,0,TAU);c.fill();c.fillStyle=L.silk2||'#fff';c.fillRect(s*.0,-s*.82,s*.16,s*.06);c.fillRect(-s*.03,-s*.66,s*.18,s*.06);
      c.strokeStyle=L.silk||'#dc2626';c.lineWidth=s*.08;c.lineCap='round';c.beginPath();c.moveTo(s*.15,-s*.7);c.lineTo(s*.45,-s*.55);c.stroke();
      c.fillStyle='#f1d3b5';c.beginPath();c.arc(s*.26,-s*.95,s*.13,0,TAU);c.fill();c.fillStyle=L.silk2||'#fff';c.beginPath();c.arc(s*.26,-s*.98,s*.14,Math.PI,TAU);c.fill();c.fillRect(s*.26,-s*1.0,s*.2,s*.04);
      if(atk>.3){c.strokeStyle='#78350f';c.lineWidth=1.2;c.beginPath();c.moveTo(s*.1,-s*.75);c.lineTo(-s*.35,-s*.95);c.stroke();}}
    if(L.crown){c.fillStyle='#e11d48';for(let k=0;k<6;k++){const a=k*TAU/6;c.beginPath();c.arc(s*.65+Math.cos(a)*s*.13,-s*.2+Math.sin(a)*s*.13,s*.08,0,TAU);c.fill();}c.fillStyle='#fde047';c.beginPath();c.arc(s*.65,-s*.2,s*.07,0,TAU);c.fill();}
    break;}
  case 'greyhound':{const s=r,w=TAU/SPP,g=t*w*2.5,coat=c1,dk=shade(c1,-.3),st=Math.sin(g);
    const leg=(x,ph,col)=>{const a=Math.sin(g+ph)*.8;c.save();c.translate(x,s*.05);c.rotate(a);c.strokeStyle=col;c.lineWidth=s*.09;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(0,s*.3);c.lineTo(s*.06,s*.55);c.stroke();c.restore();};
    leg(-s*.55,0,dk);leg(s*.4,Math.PI*.5,dk);
    c.strokeStyle=coat;c.lineWidth=s*.08;c.lineCap='round';c.beginPath();c.moveTo(-s*.75,-s*.05);c.quadraticCurveTo(-s*1.2,s*.05+st*s*.1,-s*1.25,-s*.35);c.stroke();
    c.save();c.scale(1+st*.06,1-st*.04);c.fillStyle=coat;c.beginPath();c.moveTo(-s*.8,-s*.1);c.quadraticCurveTo(-s*.75,-s*.38,-s*.2,-s*.32);c.quadraticCurveTo(s*.4,-s*.38,s*.55,-s*.15);c.quadraticCurveTo(s*.55,s*.28,s*.15,s*.22);c.quadraticCurveTo(-s*.3,s*.0,-s*.6,s*.12);c.closePath();c.fill();
      if(L.silk){c.fillStyle=L.silk;c.beginPath();c.moveTo(-s*.45,-s*.3);c.quadraticCurveTo(s*.1,-s*.38,s*.4,-s*.22);c.lineTo(s*.3,s*.12);c.quadraticCurveTo(-s*.1,s*.06,-s*.42,s*.06);c.closePath();c.fill();c.fillStyle='#fff';c.beginPath();c.arc(-s*.02,-s*.1,s*.13,0,TAU);c.fill();c.fillStyle='#111';c.font=`800 ${s*.2}px Barlow,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(L.num||'1',-s*.02,-s*.09);}
      c.restore();
    leg(-s*.4,Math.PI,coat);leg(s*.5,Math.PI*1.5,coat);
    c.fillStyle=coat;c.beginPath();c.moveTo(s*.45,-s*.2);c.quadraticCurveTo(s*.7,-s*.45,s*.78,-s*.55);c.lineTo(s*.92,-s*.45);c.quadraticCurveTo(s*.7,-s*.2,s*.55,s*.0);c.fill();
    c.beginPath();c.moveTo(s*.72,-s*.62);c.quadraticCurveTo(s*.95,-s*.66,s*1.28,-s*.48);c.lineTo(s*1.26,-s*.4);c.quadraticCurveTo(s*.95,-s*.38,s*.78,-s*.4);c.closePath();c.fill();
    c.fillStyle=dk;c.beginPath();c.moveTo(s*.78,-s*.62);c.lineTo(s*.66,-s*.72);c.lineTo(s*.84,-s*.66);c.fill();c.fillStyle='#111';c.beginPath();c.arc(s*1.27,-s*.46,s*.04,0,TAU);c.fill();
    eye(c,s*.88,-s*.56,s*.06);
    if(L.muzzle){c.strokeStyle='#d6d3d1';c.lineWidth=1;c.beginPath();c.moveTo(s*1.0,-s*.6);c.lineTo(s*1.0,-s*.38);c.moveTo(s*1.12,-s*.56);c.lineTo(s*1.12,-s*.4);c.stroke();}
    if(L.hare){c.save();c.translate(-s*.05,-s*.65);c.fillStyle='#e7e5e4';c.beginPath();c.ellipse(0,0,s*.16,s*.1,0,0,TAU);c.fill();c.beginPath();c.ellipse(s*.12,-s*.08,s*.05,s*.14,.3,0,TAU);c.fill();c.restore();}
    break;}
  case 'seven':{const s=r,w=TAU/SPP,bob=Math.abs(Math.sin(t*w*2))*s*.08;
    for(const [lx,ph] of [[-.2,0],[.25,Math.PI]]){const a=Math.sin(t*w*2+ph)*.35;c.save();c.translate(lx*s,s*.55);c.rotate(a);c.fillStyle='#7f1d1d';rr(c,-s*.08,0,s*.16,s*.38,s*.06);c.fill();c.fillStyle='#111';rr(c,-s*.1,s*.32,s*.26,s*.12,s*.05);c.fill();c.restore();}
    c.translate(0,-bob);
    const seven=()=>{c.beginPath();c.moveTo(-s*.7,-s*1.05);c.lineTo(s*.72,-s*1.05);c.lineTo(s*.72,-s*.72);c.quadraticCurveTo(s*.1,-s*.1,s*.02,s*.62);c.lineTo(-s*.42,s*.62);c.quadraticCurveTo(-s*.32,-s*.15,s*.22,-s*.7);c.lineTo(-s*.7,-s*.7);c.closePath();};
    c.save();c.shadowColor='#fde047';c.shadowBlur=12;c.fillStyle='#b91c1c';c.save();c.translate(s*.06,s*.06);seven();c.fill();c.restore();c.restore();
    {const g=c.createLinearGradient(0,-s*1.05,0,s*.62);g.addColorStop(0,'#fde68a');g.addColorStop(.5,c1);g.addColorStop(1,'#b45309');c.fillStyle=g;}seven();c.fill();c.strokeStyle='#dc2626';c.lineWidth=s*.07;c.lineJoin='round';c.stroke();
    c.fillStyle='rgba(255,255,255,.55)';c.fillRect(-s*.6,-s*1.0,s*1.1,s*.06);
    eye(c,-s*.22,-s*.88,s*.13);eye(c,s*.22,-s*.88,s*.13);c.strokeStyle='#7f1d1d';c.lineWidth=1.4;c.beginPath();c.arc(0,-s*.82,s*.1,.2,Math.PI-.2);c.stroke();
    crown(c,0,-s*1.12,s*.26,'#fbbf24');
    for(const sd of [-1,1]){const hx=sd*s*.75,hy=-s*.25+(sd>0&&atk>.3?-s*.2:0);c.strokeStyle='#b45309';c.lineWidth=s*.09;c.lineCap='round';c.beginPath();c.moveTo(sd>0?s*.5:-s*.3,-s*.55);c.lineTo(hx,hy);c.stroke();
      c.save();c.translate(hx,hy);c.rotate(t*2*sd);c.fillStyle='#f8f5ec';rr(c,-s*.13,-s*.13,s*.26,s*.26,s*.05);c.fill();c.fillStyle='#b91c1c';c.beginPath();c.arc(0,0,s*.045,0,TAU);c.fill();c.restore();}
    break;}
  case 'goose':{const s=r,w=TAU/SPP,wd=Math.sin(t*w*2);
    // golden egg
    c.save();c.shadowColor='#fde047';c.shadowBlur=10;c.fillStyle='#fbbf24';c.beginPath();c.ellipse(-s*.55,s*.62,s*.22,s*.28,-.2,0,TAU);c.fill();c.restore();c.fillStyle='#fef3c7';c.beginPath();c.ellipse(-s*.6,s*.52,s*.06,s*.09,-.2,0,TAU);c.fill();
    // legs
    c.strokeStyle='#f97316';c.lineWidth=s*.09;c.lineCap='round';for(const [lx,ph] of [[-.1,0],[.18,Math.PI]]){const a=Math.sin(t*w*2+ph)*s*.1;c.beginPath();c.moveTo(s*lx,s*.35);c.lineTo(s*lx+a,s*.78);c.lineTo(s*lx+a+s*.16,s*.82);c.stroke();}
    // body
    {const g=c.createLinearGradient(0,-s*.4,0,s*.5);g.addColorStop(0,'#fffbeb');g.addColorStop(1,c1);c.fillStyle=g;}
    c.beginPath();c.moveTo(-s*.85,-s*.1);c.quadraticCurveTo(-s*.75,-s*.42,-s*.2,-s*.32);c.quadraticCurveTo(s*.4,-s*.28,s*.5,s*.05);c.quadraticCurveTo(s*.45,s*.48,0,s*.48);c.quadraticCurveTo(-s*.55,s*.48,-s*.7,s*.12);c.closePath();c.fill();
    // wing
    c.fillStyle=shade(c1,-.1);c.save();c.translate(-s*.05,-s*.05);c.rotate(-.1+wd*.12);c.beginPath();c.moveTo(s*.25,-s*.1);c.quadraticCurveTo(-s*.2,-s*.3,-s*.7,-s*.05);c.quadraticCurveTo(-s*.45,s*.05,-s*.55,s*.15);c.quadraticCurveTo(-s*.1,s*.25,s*.25,-s*.1);c.fill();
      c.strokeStyle=shade(c1,-.35);c.lineWidth=1;for(let k=0;k<3;k++){c.beginPath();c.moveTo(s*.1-k*s*.15,-s*.06);c.lineTo(-s*.25-k*s*.12,s*.06+k*s*.03);c.stroke();}c.restore();
    // long neck and head
    c.strokeStyle='#fffbeb';c.lineWidth=s*.24;c.beginPath();c.moveTo(s*.3,-s*.08);c.quadraticCurveTo(s*.62,-s*.35,s*.42,-s*.72);c.quadraticCurveTo(s*.35,-s*.95,s*.52,-s*1.02);c.stroke();
    c.fillStyle='#fffbeb';c.beginPath();c.ellipse(s*.56,-s*1.02,s*.2,s*.16,.1,0,TAU);c.fill();
    c.fillStyle='#f97316';c.beginPath();c.moveTo(s*.68,-s*1.08);c.quadraticCurveTo(s*1.0,-s*1.04,s*1.02,-s*.96);c.quadraticCurveTo(s*.88,-s*.92,s*.68,-s*.94);c.closePath();c.fill();
    if(atk>.3){c.fillStyle='#7c2d12';c.beginPath();c.moveTo(s*.7,-s*.97);c.lineTo(s*.98,-s*.95);c.lineTo(s*.75,-s*.88);c.fill();}
    eye(c,s*.58,-s*1.06,s*.07);
    crown(c,s*.5,-s*1.17,s*.17,'#fbbf24');
    c.fillStyle='rgba(253,224,71,.9)';for(let k=0;k<3;k++){const a=t*3+k*2.1,x=Math.cos(a)*s*.9,y=-s*.3+Math.sin(a)*s*.5;c.beginPath();c.moveTo(x,y-s*.07);c.lineTo(x+s*.02,y);c.lineTo(x,y+s*.07);c.lineTo(x-s*.02,y);c.fill();}
    break;}
  case 'star':{const s=r,w=TAU/SPP,fl=Math.sin(t*w)*s*.08;c.translate(0,fl);
    for(let k=0;k<4;k++){const p=((t*.8+k*.25)%1);c.fillStyle=`rgba(253,224,71,${.6*(1-p)})`;c.beginPath();c.arc(-s*.4-p*s*.8,s*.3+p*s*.3+Math.sin(k*3)*s*.1,s*(.12-p*.08),0,TAU);c.fill();}
    {const g=c.createRadialGradient(0,0,s*.1,0,0,s*1.2);g.addColorStop(0,hexA('#fde047',.5));g.addColorStop(1,hexA('#fde047',0));c.fillStyle=g;c.beginPath();c.arc(0,0,s*1.2,0,TAU);c.fill();}
    c.save();c.rotate(Math.sin(t*w)*.12);const star=(R,col)=>{c.fillStyle=col;c.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,rad=k%2?R*.48:R;c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}c.closePath();c.fill();};
    star(s*.98,shade(c1,-.2));star(s*.9,c1);star(s*.55,'#fef9c3');
    eye(c,-s*.18,-s*.05,s*.12);eye(c,s*.18,-s*.05,s*.12);c.strokeStyle='#713f12';c.lineWidth=1.4;c.beginPath();c.arc(0,s*.1,s*.13,.3,Math.PI-.3);c.stroke();
    c.fillStyle='rgba(251,113,133,.5)';c.beginPath();c.arc(-s*.32,s*.12,s*.08,0,TAU);c.arc(s*.32,s*.12,s*.08,0,TAU);c.fill();c.restore();
    c.fillStyle='#22c55e';for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){c.beginPath();c.arc(s*.05+dx*s*.09,-s*1.02+dy*s*.09,s*.09,0,TAU);c.fill();}c.strokeStyle='#15803d';c.lineWidth=1.2;c.beginPath();c.moveTo(s*.05,-s*1.02);c.lineTo(0,-s*.85);c.stroke();
    break;}
  case 'sovereign':{const s=r,w=TAU/SPP,Q=!!L.queen,fl=Math.sin(t*w)*s*.05,gold='#fbbf24',robe=Q?'#be123c':'#7f1d1d';c.translate(0,fl);
    // rotating rays of light
    c.save();c.rotate(t*.6);for(let k=0;k<12;k++){c.rotate(TAU/12);const g=c.createLinearGradient(0,0,0,-s*1.45);g.addColorStop(0,hexA(c1,.55));g.addColorStop(1,hexA(c1,0));c.fillStyle=g;c.beginPath();c.moveTo(-s*.1,0);c.lineTo(0,-s*1.45);c.lineTo(s*.1,0);c.fill();}c.restore();
    // the great card behind
    c.save();c.rotate(-.08);c.fillStyle='#fbf6e8';rr(c,-s*.62,-s*1.05,s*1.24,s*1.6,s*.12);c.fill();c.strokeStyle=gold;c.lineWidth=s*.06;rr(c,-s*.54,-s*.97,s*1.08,s*1.44,s*.08);c.stroke();
      c.fillStyle=Q?'#e11d48':'#111';c.font=`700 ${s*.28}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText(Q?'Q':'K',-s*.38,-s*.78);c.fillText(Q?'♥':'♠',-s*.38,-s*.52);c.restore();
    // robe with ermine trim
    c.fillStyle=robe;c.beginPath();c.moveTo(-s*.38,-s*.1);c.quadraticCurveTo(-s*.85,s*.5,-s*.8,s*1.0);c.lineTo(s*.8,s*1.0);c.quadraticCurveTo(s*.85,s*.5,s*.38,-s*.1);c.closePath();c.fill();
    c.fillStyle=shade(robe,.25);c.beginPath();c.moveTo(-s*.1,-s*.05);c.lineTo(-s*.25,s*1.0);c.lineTo(s*.25,s*1.0);c.lineTo(s*.1,-s*.05);c.fill();
    c.fillStyle='#fff';c.fillRect(-s*.82,s*.9,s*1.64,s*.14);c.beginPath();c.ellipse(0,-s*.08,s*.46,s*.16,0,0,TAU);c.fill();
    c.fillStyle='#111';for(let k=0;k<6;k++){c.fillRect(-s*.7+k*s*.27,s*.94,s*.05,s*.07);}for(const x of [-.3,0,.3]){c.fillRect(s*x-s*.02,-s*.1,s*.04,s*.06);}
    // arms: scepter and orb
    c.fillStyle=robe;for(const sx of [-1,1]){c.beginPath();c.ellipse(sx*s*.48,s*.3,s*.16,s*.3,sx*.4,0,TAU);c.fill();}
    c.fillStyle='#f1d3b5';c.beginPath();c.arc(-s*.58,s*.52,s*.09,0,TAU);c.arc(s*.6,s*.5,s*.09,0,TAU);c.fill();
    c.fillStyle=gold;c.beginPath();c.arc(-s*.6,s*.38,s*.14,0,TAU);c.fill();c.fillStyle='#fde68a';c.fillRect(-s*.62,s*.16,s*.04,s*.12);c.fillRect(-s*.67,s*.2,s*.14,s*.04);
    c.save();c.translate(s*.62,s*.5);c.rotate(.15-(atk>.3?.5:0));c.strokeStyle=gold;c.lineWidth=s*.08;c.lineCap='round';c.beginPath();c.moveTo(0,s*.3);c.lineTo(0,-s*.95);c.stroke();
      const gr=s*.16+(atk>.3?s*.06:0);c.save();c.shadowColor=Q?'#fb7185':'#fde047';c.shadowBlur=10;c.fillStyle=Q?'#fb7185':'#fde68a';
      if(Q){c.beginPath();c.moveTo(0,-s*.9);c.bezierCurveTo(-gr*1.4,-s*.95-gr,-gr*.6,-s*1.25-gr*.2,0,-s*1.05-gr*.3);c.bezierCurveTo(gr*.6,-s*1.25-gr*.2,gr*1.4,-s*.95-gr,0,-s*.9);c.fill();}
      else{c.beginPath();c.arc(0,-s*1.05,gr,0,TAU);c.fill();}c.restore();c.restore();
    // head
    if(Q){c.fillStyle='#7c2d12';c.beginPath();c.ellipse(0,-s*.42,s*.36,s*.4,0,0,TAU);c.fill();c.beginPath();c.ellipse(-s*.3,-s*.18,s*.14,s*.24,.3,0,TAU);c.ellipse(s*.3,-s*.18,s*.14,s*.24,-.3,0,TAU);c.fill();}
    c.fillStyle='#f6dcc0';c.beginPath();c.arc(0,-s*.42,s*.28,0,TAU);c.fill();
    eye(c,-s*.11,-s*.45,s*.09);eye(c,s*.11,-s*.45,s*.09);
    if(!Q){c.fillStyle='#f8fafc';c.beginPath();c.moveTo(-s*.28,-s*.42);c.quadraticCurveTo(-s*.3,-s*.05,0,s*.08);c.quadraticCurveTo(s*.3,-s*.05,s*.28,-s*.42);c.quadraticCurveTo(s*.12,-s*.26,0,-s*.3);c.quadraticCurveTo(-s*.12,-s*.26,-s*.28,-s*.42);c.fill();
      c.beginPath();c.moveTo(0,-s*.33);c.quadraticCurveTo(-s*.14,-s*.36,-s*.2,-s*.27);c.quadraticCurveTo(-s*.08,-s*.3,0,-s*.29);c.quadraticCurveTo(s*.08,-s*.3,s*.2,-s*.27);c.quadraticCurveTo(s*.14,-s*.36,0,-s*.33);c.fill();}
    else{c.strokeStyle='#9f1239';c.lineWidth=1.4;c.beginPath();c.arc(0,-s*.36,s*.08,.3,Math.PI-.3);c.stroke();}
    crown(c,0,-s*.66,s*.3,gold);c.fillStyle=Q?'#fb7185':'#22d3ee';c.beginPath();c.arc(0,-s*.8,s*.05,0,TAU);c.fill();
    // orbiting suits
    for(let k=0;k<4;k++){const a=t*w*.5+k*TAU/4,x=Math.cos(a)*s*1.05,y=-s*.2+Math.sin(a)*s*.35;if(Math.sin(a)<-.2)continue;c.fillStyle=k%2?'#e11d48':'#f8fafc';c.font=`700 ${s*.3}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText(['♠','♥','♣','♦'][k],x,y);}
    break;}
  }
}
function drawEnemyRaw(c,k,r,col,t){const body='#1a1022',bob=Math.sin(t*9)*r*.08,e={k};
  switch(k){
    case 'getaway':{c.fillStyle='#14101c';rr(c,-r*1.2,-r*.35,r*2.4,r*.75,r*.25);c.fill();c.fillStyle='#1f1a2b';c.beginPath();c.moveTo(-r*.6,-r*.35);c.lineTo(-r*.35,-r*.75);c.lineTo(r*.45,-r*.75);c.lineTo(r*.75,-r*.35);c.closePath();c.fill();
      c.fillStyle='rgba(120,160,200,.55)';c.beginPath();c.moveTo(-r*.45,-r*.38);c.lineTo(-r*.28,-r*.66);c.lineTo(r*.38,-r*.66);c.lineTo(r*.6,-r*.38);c.closePath();c.fill();
      c.fillStyle='#ffe9a8';c.fillRect(r*1.05,-r*.22,r*.15,r*.16);c.fillStyle='#ff3b5a';c.fillRect(-r*1.2,-r*.22,r*.12,r*.16);
      for(const wx of [-.7,.7]){c.fillStyle='#0b0612';c.beginPath();c.arc(wx*r,r*.4,r*.28,0,Math.PI*2);c.fill();c.fillStyle='#6b7280';c.beginPath();c.arc(wx*r,r*.4,r*.12,0,Math.PI*2);c.fill();}
      c.strokeStyle='#d4d4d8';c.lineWidth=1;c.beginPath();c.moveTo(r*.1,-r*.66);c.lineTo(r*.1,-r*.45);c.stroke();c.fillStyle='#fff';c.fillRect(r*.04,-r*.46,r*.12,r*.12);
      c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1.5;for(let i=0;i<3;i++){c.beginPath();c.moveTo(-r*1.35-i*r*.25,-r*.1+i*r*.15);c.lineTo(-r*1.7-i*r*.3,-r*.1+i*r*.15);c.stroke();}break;}
    case 'shard':c.fillStyle='#cbd5e1';c.beginPath();c.moveTo(0,-r*1.1);c.lineTo(r*.8,r*.2);c.lineTo(-r*.2,r*.9);c.lineTo(-r*.8,-r*.1);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.moveTo(0,-r*.8);c.lineTo(r*.35,0);c.lineTo(-r*.3,-r*.1);c.fill();
      c.fillStyle='#ef4444';c.fillRect(-r*.35,-r*.1,r*.22,r*.12);c.fillRect(r*.1,-r*.1,r*.22,r*.12);break;
    case 'jinx':{const w=TAU/SPP;{const g=c.createLinearGradient(0,-r,0,r);g.addColorStop(0,'#6b21a8');g.addColorStop(1,'#2e1065');c.fillStyle=g;}
      c.beginPath();c.moveTo(-r,r*.5);for(let k=0;k<=6;k++){const x=-r+k*r/3,y=r*.55+(k%2?r*.32:0)+Math.sin(t*w*2+k)*r*.08;c.lineTo(x,y);}c.lineTo(r,r*.5);c.arc(0,0,r,0,Math.PI,true);c.fill();
      c.fillStyle=col;c.beginPath();c.moveTo(-r*.62,-r*.68);c.quadraticCurveTo(-r*.95,-r*1.05,-r*.82,-r*1.35);c.quadraticCurveTo(-r*.55,-r*1.0,-r*.22,-r*.92);c.moveTo(r*.62,-r*.68);c.quadraticCurveTo(r*.95,-r*1.05,r*.82,-r*1.35);c.quadraticCurveTo(r*.55,-r*1.0,r*.22,-r*.92);c.fill();
      c.fillStyle='rgba(255,255,255,.12)';c.beginPath();c.ellipse(-r*.35,-r*.55,r*.3,r*.16,-.5,0,TAU);c.fill();
      for(const ex of [-.32,.32]){c.fillStyle='#fde047';c.beginPath();c.ellipse(ex*r,-r*.12,r*.2,r*.16,ex*.8,0,TAU);c.fill();c.fillStyle='#0b0612';c.beginPath();c.ellipse(ex*r+r*.03,-r*.1,r*.06,r*.13,0,0,TAU);c.fill();}
      c.strokeStyle='#0b0612';c.lineWidth=r*.12;c.lineCap='round';for(const ex of [-1,1]){c.beginPath();c.moveTo(ex*r*.5,-r*.42);c.lineTo(ex*r*.15,-r*.3);c.stroke();}
      c.fillStyle='#0b0612';c.beginPath();c.moveTo(-r*.35,r*.18);c.quadraticCurveTo(0,r*.5,r*.38,r*.15);c.quadraticCurveTo(0,r*.3,-r*.35,r*.18);c.fill();c.fillStyle='#fff';c.beginPath();c.moveTo(r*.12,r*.25);c.lineTo(r*.18,r*.38);c.lineTo(r*.24,r*.24);c.fill();break;}
    case 'cat':c.fillStyle=body;c.beginPath();c.ellipse(-r*.1,r*.1+bob,r*.95,r*.55,0,0,Math.PI*2);c.fill();c.beginPath();c.arc(r*.75,-r*.35,r*.5,0,Math.PI*2);c.fill();
      c.beginPath();c.moveTo(r*.4,-r*.65);c.lineTo(r*.5,-r*1.15);c.lineTo(r*.75,-r*.8);c.lineTo(r*.95,-r*1.15);c.lineTo(r*1.1,-r*.6);c.fill();
      c.strokeStyle=body;c.lineWidth=r*.22;c.lineCap='round';c.beginPath();c.moveTo(-r*.95,0);c.quadraticCurveTo(-r*1.6,-r*.2,-r*1.4,-r*.9+Math.sin(t*8)*r*.2);c.stroke();
      c.strokeStyle=body;c.lineWidth=r*.18;for(let k=0;k<4;k++){c.beginPath();c.moveTo(-r*.6+k*r*.4,r*.4);c.lineTo(-r*.6+k*r*.4+Math.sin(t*16+k*2)*r*.25,r*.95);c.stroke();}
      c.fillStyle=col;c.beginPath();c.ellipse(r*.6,-r*.4,r*.1,r*.14,0,0,Math.PI*2);c.ellipse(r*.95,-r*.4,r*.1,r*.14,0,0,Math.PI*2);c.fill();break;
    case 'mirror':c.fillStyle='#94a3b8';c.beginPath();c.moveTo(0,-r*1.1);c.lineTo(r*.85,-r*.3);c.lineTo(r*.6,r*.8);c.lineTo(-r*.5,r*.9);c.lineTo(-r*.9,-r*.2);c.closePath();c.fill();
      c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.moveTo(-r*.3,-r*.6);c.lineTo(r*.2,-r*.8);c.lineTo(-r*.6,r*.1);c.fill();
      c.strokeStyle='#1e293b';c.lineWidth=1.3;c.beginPath();c.moveTo(0,-r*1.1);c.lineTo(-r*.1,-r*.2);c.lineTo(r*.4,r*.2);c.moveTo(-r*.1,-r*.2);c.lineTo(-r*.6,r*.4);c.stroke();
      c.fillStyle='#ef4444';c.fillRect(-r*.45,-r*.2,r*.3,r*.12);c.fillRect(r*.15,-r*.2,r*.3,r*.12);break;
    case 'hexer':{const w=TAU/SPP;      c.globalAlpha=.94;{const g=c.createLinearGradient(0,-r*1.2,0,r);g.addColorStop(0,'#155e75');g.addColorStop(1,'#082f49');c.fillStyle=g;}c.beginPath();c.moveTo(-r,r*.9);c.quadraticCurveTo(-r*1.1,-r*1.2,0,-r*1.3);c.quadraticCurveTo(r*1.1,-r*1.2,r,r*.9);for(let k=0;k<4;k++)c.lineTo(r-(k+1)*r*.5,r*(.9-(k%2?0:.3))+Math.sin(t*w*2+k)*r*.06);c.fill();c.globalAlpha=1;
      c.strokeStyle='#67e8f9';c.lineWidth=1;c.beginPath();c.moveTo(0,-r*.8);c.lineTo(0,r*.75);c.stroke();
      c.fillStyle='#0b1120';c.beginPath();c.ellipse(r*.05,-r*.32,r*.55,r*.45,0,0,Math.PI*2);c.fill();
      c.save();c.shadowColor=col;c.shadowBlur=8;c.fillStyle=col;c.beginPath();c.ellipse(-r*.14,-r*.32,r*.12,r*.06,.2,0,Math.PI*2);c.ellipse(r*.24,-r*.32,r*.12,r*.06,-.2,0,Math.PI*2);c.fill();c.restore();
      c.fillStyle='#cbd5e1';c.beginPath();c.arc(r*.6,r*.05,r*.12,0,TAU);c.fill();c.fillStyle='#a5f3fc';c.beginPath();c.arc(r*.72,-r*.12,r*.16+Math.sin(t*TAU/SPP*2)*r*.03,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(r*.68,-r*.16,r*.05,0,TAU);c.fill();break;}
    case 'gnat':{const f=Math.sin(t*30)*r*.8;c.fillStyle=body;c.beginPath();c.moveTo(0,0);c.lineTo(-r*1.3,-r*.3-f);c.lineTo(-r*.3,r*.2);c.moveTo(0,0);c.lineTo(r*1.3,-r*.3-f);c.lineTo(r*.3,r*.2);c.fill();
      c.beginPath();c.ellipse(0,0,r*.7,r*.55,0,0,Math.PI*2);c.fill();c.fillStyle=col;c.beginPath();c.arc(r*.3,-r*.1,r*.18,0,Math.PI*2);c.fill();c.fillStyle='#fbbf24';c.beginPath();c.moveTo(r*.6,0);c.lineTo(r*1,r*.1);c.lineTo(r*.6,r*.2);c.fill();break;}
    case 'chewer':{const w=TAU/SPP;c.fillStyle='#57534e';c.beginPath();c.ellipse(-r*.15,r*.1+bob,r*1,r*.62,0,0,TAU);c.fill();
      c.strokeStyle='#a8a29e';c.lineWidth=r*.16;c.lineCap='round';c.beginPath();c.moveTo(-r*1.05,r*.2);c.quadraticCurveTo(-r*1.7,-r*.1+Math.sin(t*w)*r*.3,-r*1.9,r*.35);c.stroke();
      c.fillStyle='#78716c';c.beginPath();c.ellipse(r*.75,-r*.15,r*.55,r*.45,.2,0,TAU);c.fill();c.fillStyle='#fda4af';c.beginPath();c.arc(r*.45,-r*.62,r*.22,0,TAU);c.fill();c.fillStyle='#57534e';c.beginPath();c.arc(r*.45,-r*.62,r*.13,0,TAU);c.fill();
      c.fillStyle='#fbbf24';c.fillRect(r*1.12,-r*.08,r*.12,r*.28);c.fillRect(r*1.25,-r*.08,r*.12,r*.28);c.fillStyle='#111';c.beginPath();c.arc(r*1.3,-r*.28,r*.1,0,TAU);c.fill();
      c.fillStyle='#f43f5e';c.beginPath();c.arc(r*.85,-r*.3,r*.11,0,TAU);c.fill();
      c.strokeStyle='#44403c';c.lineWidth=r*.14;for(let k=0;k<4;k++){c.beginPath();c.moveTo(-r*.6+k*r*.4,r*.5);c.lineTo(-r*.6+k*r*.4+Math.sin(t*w*2+k*1.7)*r*.2,r*.95);c.stroke();}break;}
    case 'charm':{const w=TAU/SPP,sp=Math.sin(t*w)*.15;c.save();c.rotate(sp);for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4;c.fillStyle=k%2?'#22c55e':'#16a34a';c.beginPath();c.arc(Math.cos(a)*r*.48,Math.sin(a)*r*.48,r*.52,0,TAU);c.fill();}
      c.strokeStyle='#15803d';c.lineWidth=r*.12;c.beginPath();c.moveTo(0,r*.3);c.quadraticCurveTo(r*.2,r*.9,r*.05,r*1.2);c.stroke();c.fillStyle='#bbf7d0';c.beginPath();c.arc(0,0,r*.32,0,TAU);c.fill();c.restore();
      c.fillStyle='#14532d';c.beginPath();c.arc(-r*.13,-r*.05,r*.08,0,TAU);c.arc(r*.13,-r*.05,r*.08,0,TAU);c.fill();c.strokeStyle='#14532d';c.lineWidth=1.2;c.beginPath();c.arc(0,r*.04,r*.13,.3,Math.PI-.3);c.stroke();
      c.fillStyle='rgba(187,247,208,.7)';for(let k=0;k<3;k++){const a=t*w+k*2.1;c.beginPath();c.arc(Math.cos(a)*r*1.15,Math.sin(a)*r*.6-r*.2,r*.1,0,TAU);c.fill();}break;}
    case 'bondsman':{const w=TAU/SPP,sw=Math.sin(t*w);c.fillStyle='#1e293b';c.beginPath();c.moveTo(-r*.6,r*.95);c.lineTo(-r*.5,-r*.25);c.lineTo(r*.5,-r*.25);c.lineTo(r*.6,r*.95);c.closePath();c.fill();
      c.fillStyle='#f8fafc';c.beginPath();c.moveTo(-r*.16,-r*.25);c.lineTo(0,r*.25);c.lineTo(r*.16,-r*.25);c.fill();c.fillStyle='#60a5fa';c.fillRect(-r*.05,-r*.2,r*.1,r*.4);
      c.fillStyle='#d6b08c';c.beginPath();c.arc(0,-r*.55,r*.36,0,TAU);c.fill();c.fillStyle='#1e293b';c.fillRect(-r*.42,-r*.95,r*.84,r*.14);rr(c,-r*.28,-r*1.2,r*.56,r*.3,2);c.fill();
      c.fillStyle='#111';c.fillRect(-r*.24,-r*.62,r*.18,r*.08);c.fillRect(r*.06,-r*.62,r*.18,r*.08);
      c.save();c.translate(r*.62,r*.25+sw*r*.06);c.fillStyle='#7c2d12';rr(c,-r*.05,0,r*.5,r*.36,2);c.fill();c.fillStyle='#fbbf24';c.fillRect(r*.15,-r*.05,r*.12,r*.07);c.fillRect(r*.15,r*.13,r*.12,r*.04);c.restore();
      c.strokeStyle='rgba(96,165,250,.7)';c.lineWidth=1.4;c.beginPath();c.arc(0,-r*.1,r*1.2+sw*r*.06,Math.PI*1.1,Math.PI*1.9);c.stroke();break;}
    case 'cheat':{const w=TAU/SPP,sw=Math.sin(t*w);c.fillStyle='#334155';c.beginPath();c.moveTo(-r*.55,r*.95);c.quadraticCurveTo(-r*.7,-r*.1,-r*.4,-r*.2);c.lineTo(r*.4,-r*.2);c.quadraticCurveTo(r*.7,-r*.1,r*.55,r*.95);c.closePath();c.fill();
      c.fillStyle='#b91c1c';c.fillRect(-r*.55,r*.05,r*1.1,r*.12);
      c.fillStyle='#e2c4a0';c.beginPath();c.arc(0,-r*.5,r*.32,0,TAU);c.fill();c.fillStyle='#0f172a';c.beginPath();c.ellipse(0,-r*.78,r*.62,r*.12,0,0,TAU);c.fill();rr(c,-r*.32,-r*1.12,r*.64,r*.38,3);c.fill();c.fillStyle='#b91c1c';c.fillRect(-r*.32,-r*.86,r*.64,r*.07);
      c.fillStyle='#111';c.beginPath();c.arc(-r*.12,-r*.5,r*.06,0,TAU);c.arc(r*.14,-r*.5,r*.06,0,TAU);c.fill();c.strokeStyle='#111';c.lineWidth=1;c.beginPath();c.moveTo(-r*.12,-r*.32);c.quadraticCurveTo(r*.05,-r*.26,r*.16,-r*.36);c.stroke();
      c.save();c.translate(r*.5,-r*.05+sw*r*.08);c.rotate(.4+sw*.2);c.fillStyle='#fbf6e8';c.fillRect(-r*.14,-r*.2,r*.28,r*.4);c.fillStyle='#b91c1c';c.font=`${r*.28}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText('♦',0,0);c.restore();break;}
    case 'ogre':{const w=TAU/SPP,sw=Math.sin(t*w),sk='#65a30d',dk='#3f6212';
      // tow chain and hook swinging
      c.save();c.translate(r*.9,-r*.05);c.rotate(sw*.5);c.strokeStyle='#9ca3af';c.lineWidth=r*.07;for(let k=0;k<5;k++){c.beginPath();c.ellipse(r*.05,r*(.12+k*.17),r*.06,r*.09,0,0,TAU);c.stroke();}
        c.lineWidth=r*.12;c.strokeStyle='#6b7280';c.lineCap='round';c.beginPath();c.moveTo(r*.05,r*.95);c.lineTo(r*.05,r*1.1);c.arc(r*.25,r*1.1,r*.2,Math.PI,Math.PI*.15,true);c.stroke();c.restore();
      for(const [lx,ph] of [[-.4,0],[.4,Math.PI]]){const a=Math.sin(t*w*2+ph)*r*.06;c.fillStyle='#1e3a8a';rr(c,lx*r-r*.2,r*.45+a,r*.4,r*.4,r*.1);c.fill();c.fillStyle='#292524';rr(c,lx*r-r*.26,r*.78+a,r*.52,r*.18,r*.08);c.fill();}
      c.save();c.scale(1,1+Math.sin(t*w*2)*.03);
      c.fillStyle=dk;c.beginPath();c.arc(-r*.92,-r*.05,r*.32,0,TAU);c.arc(r*.92,-r*.05,r*.32,0,TAU);c.fill();
      {const g=c.createLinearGradient(0,-r,0,r);g.addColorStop(0,'#84cc16');g.addColorStop(1,dk);c.fillStyle=g;}c.beginPath();c.ellipse(0,-r*.05,r*.95,r*.8,0,0,TAU);c.fill();
      // overalls with a REPO patch
      c.fillStyle='#1d4ed8';c.beginPath();c.moveTo(-r*.7,r*.05);c.lineTo(r*.7,r*.05);c.quadraticCurveTo(r*.75,r*.65,0,r*.72);c.quadraticCurveTo(-r*.75,r*.65,-r*.7,r*.05);c.fill();c.fillRect(-r*.55,-r*.35,r*.12,r*.45);c.fillRect(r*.43,-r*.35,r*.12,r*.45);
      c.fillStyle='#fbbf24';c.beginPath();c.arc(-r*.49,-r*.32,r*.06,0,TAU);c.arc(r*.49,-r*.32,r*.06,0,TAU);c.fill();
      c.fillStyle='#f8fafc';rr(c,-r*.3,r*.18,r*.6,r*.24,r*.04);c.fill();c.fillStyle='#b91c1c';c.font=`900 ${r*.2}px Barlow,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('REPO',0,r*.31);
      // little head
      c.fillStyle=sk;c.beginPath();c.ellipse(0,-r*.7,r*.42,r*.36,0,0,TAU);c.fill();c.fillStyle=dk;c.beginPath();c.arc(-r*.4,-r*.8,r*.1,0,TAU);c.arc(r*.4,-r*.8,r*.1,0,TAU);c.fill();
      c.fillStyle='#1a2e05';c.fillRect(-r*.3,-r*.9,r*.6,r*.07);
      c.fillStyle='#fef08a';c.beginPath();c.arc(-r*.15,-r*.75,r*.08,0,TAU);c.arc(r*.15,-r*.75,r*.08,0,TAU);c.fill();c.fillStyle='#111';c.beginPath();c.arc(-r*.13,-r*.74,r*.04,0,TAU);c.arc(r*.17,-r*.74,r*.04,0,TAU);c.fill();
      c.fillStyle='#1a2e05';c.beginPath();c.ellipse(0,-r*.55,r*.24,r*.08,0,0,TAU);c.fill();c.fillStyle='#fefce8';c.beginPath();c.moveTo(-r*.2,-r*.55);c.lineTo(-r*.14,-r*.72);c.lineTo(-r*.08,-r*.56);c.moveTo(r*.08,-r*.56);c.lineTo(r*.14,-r*.72);c.lineTo(r*.2,-r*.55);c.fill();
      c.restore();break;}
    case 'lady':case 'decoy':{const w=TAU/SPP,sw=Math.sin(t*w);
      c.fillStyle='#14532d';c.beginPath();c.moveTo(-r*.95,r*.95);c.quadraticCurveTo(-r*.5,r*.1,-r*.32,-r*.25);c.lineTo(r*.32,-r*.25);c.quadraticCurveTo(r*.5,r*.1,r*.95,r*.95);c.closePath();c.fill();
      c.fillStyle='#16a34a';c.beginPath();c.moveTo(-r*.7,r*.95);c.quadraticCurveTo(-r*.3,r*.2,-r*.2,-r*.2);c.lineTo(r*.2,-r*.2);c.quadraticCurveTo(r*.3,r*.2,r*.7,r*.95);c.closePath();c.fill();
      c.fillStyle='#fde047';for(let i=0;i<5;i++){c.beginPath();c.arc(-r*.55+i*r*.27,r*.8,r*.05,0,TAU);c.fill();}
      c.save();c.translate(r*.62,-r*.05+sw*r*.08);c.strokeStyle='#e9c7a4';c.lineWidth=r*.12;c.lineCap='round';c.beginPath();c.moveTo(-r*.3,0);c.lineTo(0,-r*.1);c.stroke();
      c.scale(Math.max(.15,Math.abs(Math.cos(t*w*2))),1);c.fillStyle='#fbbf24';c.beginPath();c.arc(0,-r*.32,r*.3,0,TAU);c.fill();c.fillStyle='#b45309';c.font=`800 ${r*.34}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText('L',0,-r*.3);c.restore();
      c.fillStyle='#7c2d12';c.beginPath();c.ellipse(0,-r*.48,r*.44,r*.42,0,0,TAU);c.fill();
      c.fillStyle='#f1d3b5';c.beginPath();c.arc(0,-r*.55,r*.3,0,TAU);c.fill();
      c.fillStyle='#111';c.beginPath();c.arc(-r*.11,-r*.58,r*.045,0,TAU);c.arc(r*.11,-r*.58,r*.045,0,TAU);c.fill();
      c.fillStyle='#e11d48';c.beginPath();c.ellipse(0,-r*.42,r*.08,r*.04,0,0,TAU);c.fill();
      c.fillStyle='#14532d';c.beginPath();c.ellipse(0,-r*.86,r*.5,r*.1,-.1,0,TAU);c.fill();rr(c,-r*.24,-r*1.15,r*.48,r*.3,3);c.fill();
      c.fillStyle='#4ade80';for(let k=0;k<4;k++){const a=k*Math.PI/2+.4+sw*.2;c.beginPath();c.arc(r*.3+Math.cos(a)*r*.09,-r*1.04+Math.sin(a)*r*.09,r*.08,0,TAU);c.fill();}
      break;}
    case 'banker':{const w=TAU/SPP,sw=Math.sin(t*w);
      c.save();c.translate(-r*.9,r*.25+sw*r*.06);c.fillStyle='#a16207';c.beginPath();c.arc(0,0,r*.32,0,TAU);c.fill();c.fillStyle='#78350f';c.fillRect(-r*.1,-r*.38,r*.2,r*.12);c.fillStyle='#fde047';c.font=`800 ${r*.36}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText('$',0,r*.02);c.restore();
      c.fillStyle='#1f2937';c.beginPath();c.ellipse(0,r*.15,r*.85,r*.8,0,0,TAU);c.fill();
      c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=1;for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(i*r*.2,-r*.5);c.lineTo(i*r*.22,r*.85);c.stroke();}
      c.fillStyle='#9ca3af';c.beginPath();c.arc(0,r*.25,r*.42,0,TAU);c.fill();c.fillStyle='#4b5563';c.beginPath();c.arc(0,r*.25,r*.32,0,TAU);c.fill();
      c.save();c.translate(0,r*.25);c.rotate(t*w*.5);c.strokeStyle='#fbbf24';c.lineWidth=r*.06;for(let k=0;k<3;k++){c.rotate(TAU/3);c.beginPath();c.moveTo(0,0);c.lineTo(r*.26,0);c.stroke();}c.restore();
      c.fillStyle='#fbbf24';c.beginPath();c.arc(0,r*.25,r*.07,0,TAU);c.fill();
      c.fillStyle='#e9c7a4';c.beginPath();c.arc(0,-r*.6,r*.36,0,TAU);c.fill();
      c.fillStyle='#d1d5db';c.beginPath();c.ellipse(0,-r*.42,r*.26,r*.08,0,0,TAU);c.fill();
      c.fillStyle='#111';c.beginPath();c.arc(-r*.13,-r*.64,r*.05,0,TAU);c.fill();c.strokeStyle='#fbbf24';c.lineWidth=1.4;c.beginPath();c.arc(r*.14,-r*.64,r*.1,0,TAU);c.stroke();c.fillStyle='#111';c.beginPath();c.arc(r*.14,-r*.64,r*.04,0,TAU);c.fill();
      c.fillStyle='#111';c.beginPath();c.ellipse(0,-r*.92,r*.5,r*.09,0,0,TAU);c.fill();rr(c,-r*.3,-r*1.5,r*.6,r*.6,3);c.fill();c.fillStyle='#fbbf24';c.fillRect(-r*.3,-r*1.02,r*.6,r*.09);
      c.fillStyle='#fbbf24';c.font=`800 ${r*.3}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText('$',0,-r*1.25);break;}
    case 'boss':{const w=TAU/SPP,sw=Math.sin(t*w);c.fillStyle='#0b0f1a';for(const sx of [-1,1]){c.beginPath();c.moveTo(sx*r*.55,r*.3);c.quadraticCurveTo(sx*r*(1.05+.12*sw*sx),r*.8,sx*r*(.9+.15*sw*sx),r*1.15);c.lineTo(sx*r*.45,r*.9);c.closePath();c.fill();}
      c.save();c.translate(r*.95,r*.05);c.rotate(-.25+sw*.35);c.strokeStyle='#0b0612';c.lineWidth=r*.13;c.lineCap='round';c.beginPath();c.moveTo(0,-r*.2);c.lineTo(0,r*.95);c.stroke();c.strokeStyle='#d4a12a';c.lineWidth=r*.08;c.stroke();c.fillStyle='#fde68a';c.beginPath();c.arc(0,-r*.24,r*.12,0,TAU);c.fill();c.restore();}
      c.fillStyle='#111827';c.beginPath();c.moveTo(-r,r*.9);c.lineTo(-r*.8,-r*.3);c.quadraticCurveTo(0,-r*1.1,r*.8,-r*.3);c.lineTo(r,r*.9);c.closePath();c.fill();
      c.fillStyle='#e5e7eb';c.beginPath();c.moveTo(-r*.25,-r*.45);c.lineTo(0,r*.3);c.lineTo(r*.25,-r*.45);c.fill();c.fillStyle=col;c.beginPath();c.moveTo(-r*.1,-r*.3);c.lineTo(0,r*.2);c.lineTo(r*.1,-r*.3);c.fill();
      c.fillStyle='#1f2937';c.beginPath();c.arc(0,-r*.7,r*.5,0,Math.PI*2);c.fill();
      c.fillStyle='#111';c.fillRect(-r*.55,-r*1.05,r*1.1,r*.12);rr(c,-r*.36,-r*1.6,r*.72,r*.58,3);c.fill();c.fillStyle=col;c.fillRect(-r*.36,-r*1.13,r*.72,r*.1);
      c.fillStyle=col;c.beginPath();c.arc(-r*.18,-r*.72,r*.1,0,Math.PI*2);c.arc(r*.2,-r*.72,r*.1,0,Math.PI*2);c.fill();
      c.strokeStyle='rgba(255,255,255,.08)';c.lineWidth=1;for(let k=-3;k<=3;k++){if(!k)continue;c.beginPath();c.moveTo(k*r*.24,-r*.3);c.lineTo(k*r*.27,r*.9);c.stroke();}
      c.strokeStyle='#fbbf24';c.lineWidth=r*.06;c.beginPath();c.arc(0,-r*.15,r*.45,.35,Math.PI-.35);c.stroke();c.fillStyle='#fbbf24';c.beginPath();c.arc(0,r*.27,r*.09,0,TAU);c.fill();
      c.fillStyle='#78350f';c.save();c.translate(r*.12,-r*.5);c.rotate(.25);c.fillRect(0,-r*.05,r*.45,r*.1);c.fillStyle='#f97316';c.fillRect(r*.43,-r*.05,r*.06,r*.1);c.restore();
      c.fillStyle='#fbbf24';c.font=`800 ${r*.5}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText('$',0,r*.6);break;
  }
}
/* ---------- archetype rigs ---------- */
function hat(c,r,o,hy){
  const col=o.hatCol||'#222';c.fillStyle=col;
  switch(o.hat){
    case 'cowboy':c.beginPath();c.ellipse(0,hy,r*.62,r*.12,0,0,TAU);c.fill();c.beginPath();c.moveTo(-r*.27,hy);c.quadraticCurveTo(-r*.3,hy-r*.42,-r*.08,hy-r*.38);c.lineTo(0,hy-r*.3);c.lineTo(r*.08,hy-r*.38);c.quadraticCurveTo(r*.3,hy-r*.42,r*.27,hy);c.closePath();c.fill();
      c.fillStyle=o.hatBand||'#b45309';c.fillRect(-r*.27,hy-r*.1,r*.54,r*.07);
      if(o.hatCards){for(let k=0;k<2;k++){c.save();c.translate(r*(.12+k*.1),hy-r*.16);c.rotate(.2+k*.25);c.fillStyle='#fbf6e8';c.fillRect(-r*.05,-r*.08,r*.1,r*.14);c.fillStyle=k?'#111':'#b91c1c';c.fillRect(-r*.02,-r*.03,r*.04,r*.04);c.restore();}}break;
    case 'top':c.beginPath();c.ellipse(0,hy,r*.42,r*.09,0,0,TAU);c.fill();rr(c,-r*.25,hy-r*.55,r*.5,r*.55,r*.04);c.fill();c.fillStyle='#b91c3c';c.fillRect(-r*.25,hy-r*.16,r*.5,r*.08);break;
    case 'helmet':c.beginPath();c.arc(0,hy+r*.12,r*.37,Math.PI,TAU);c.fill();c.fillRect(-r*.42,hy+r*.08,r*.84,r*.07);c.fillStyle='rgba(255,255,255,.15)';c.beginPath();c.arc(-r*.1,hy-r*.05,r*.12,0,TAU);c.fill();break;
    case 'chiphelm':c.beginPath();c.arc(0,hy+r*.12,r*.38,Math.PI,TAU);c.fill();c.fillStyle='#fff';for(let k=0;k<5;k++){const a=Math.PI+.25+k*.66;c.fillRect(Math.cos(a)*r*.33-r*.04,hy+r*.12+Math.sin(a)*r*.33-r*.04,r*.08,r*.08);}
      c.fillStyle=col;c.beginPath();c.moveTo(-r*.05,hy-r*.25);c.lineTo(r*.05,hy-r*.25);c.lineTo(0,hy-r*.55);c.fill();c.fillStyle='#fde68a';c.beginPath();c.moveTo(0,hy-r*.55);c.quadraticCurveTo(-r*.35,hy-r*.6,-r*.3,hy-r*.3);c.lineTo(-r*.05,hy-r*.3);c.fill();break;
    case 'hood':c.beginPath();c.moveTo(-r*.42,hy+r*.62);c.quadraticCurveTo(-r*.5,hy-r*.25,0,hy-r*.28);c.quadraticCurveTo(r*.5,hy-r*.25,r*.42,hy+r*.62);c.lineTo(r*.26,hy+r*.6);c.quadraticCurveTo(r*.3,hy+r*.05,0,hy+r*.02);c.quadraticCurveTo(-r*.3,hy+r*.05,-r*.26,hy+r*.6);c.closePath();c.fill();break;
    case 'cap':c.beginPath();c.arc(0,hy+r*.1,r*.35,Math.PI,TAU);c.fill();c.fillRect(-r*.35,hy+r*.06,r*.72,r*.06);c.beginPath();c.ellipse(r*.32,hy+r*.09,r*.2,r*.05,0,0,TAU);c.fill();c.fillStyle=o.capBadge||'#facc15';c.fillRect(-r*.08,hy-r*.12,r*.16,r*.1);break;
    case 'beanie':c.beginPath();c.arc(0,hy+r*.12,r*.37,Math.PI,TAU);c.fill();c.fillStyle=shade(col,-.2);c.fillRect(-r*.38,hy+r*.04,r*.76,r*.12);c.fillStyle='#fff';c.beginPath();c.arc(0,hy-r*.26,r*.09,0,TAU);c.fill();break;
    case 'eyeshade':c.fillStyle='#3f2a1a';c.beginPath();c.arc(0,hy+r*.1,r*.33,Math.PI*1.05,TAU-.05);c.fill();c.fillStyle='rgba(34,197,94,.85)';c.beginPath();c.moveTo(-r*.34,hy+r*.06);c.lineTo(r*.34,hy+r*.06);c.lineTo(r*.52,hy+r*.16);c.lineTo(-r*.12,hy+r*.16);c.closePath();c.fill();c.fillStyle='#14532d';c.fillRect(-r*.34,hy+r*.03,r*.68,r*.05);break;
    case 'turban':c.beginPath();c.ellipse(0,hy+r*.02,r*.4,r*.24,0,0,TAU);c.fill();c.fillStyle=shade(col,-.2);c.beginPath();c.ellipse(-r*.05,hy-r*.12,r*.3,r*.17,-.2,0,TAU);c.fill();
      c.fillStyle='#e11d48';c.beginPath();c.arc(r*.08,hy+r*.02,r*.07,0,TAU);c.fill();c.strokeStyle='#f0abfc';c.lineWidth=r*.05;c.beginPath();c.moveTo(r*.08,hy-r*.02);c.quadraticCurveTo(r*.2,hy-r*.4,r*.35,hy-r*.45);c.stroke();break;
  }
}
function headH(c,r,o,hx,hy){
  const s=r*.33;
  if(o.head==='die'){c.fillStyle=o.headCol||'#f8f5ec';rr(c,hx-s,hy-s,s*2,s*2,s*.35);c.fill();c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1;c.stroke();
    if(o.face!=='snake'){c.fillStyle=o.headCol==='#1d1d1f'?'#fff':'#1d1d1f';for(const [px,py] of [[-.55,.55],[.55,.55]]){c.beginPath();c.arc(hx+px*s,hy+py*s,s*.13,0,TAU);c.fill();}}}
  else{c.fillStyle=o.skin||'#e8c9a4';c.beginPath();c.arc(hx,hy,s,0,TAU);c.fill();c.fillStyle='rgba(0,0,0,.12)';c.beginPath();c.arc(hx+s*.25,hy+s*.2,s*.75,-.3,1.6);c.fill();}
  if(o.head!=='die'&&!o.skull){c.fillStyle=o.skin||'#e8c9a4';for(const ex of [-1,1]){c.beginPath();c.arc(hx+ex*s*.95,hy+s*.08,s*.2,0,TAU);c.fill();}
    if(o.mouth!=='none'&&o.face!=='mask'&&!o.scarf){c.strokeStyle='#3b1d12';c.lineWidth=Math.max(.8,s*.12);c.lineCap='round';c.beginPath();
      if(o.mouth==='grin'){c.fillStyle='#fff';c.arc(hx+s*.05,hy+s*.42,s*.3,0,Math.PI);c.closePath();c.fill();c.stroke();}
      else if(o.mouth==='frown'){c.arc(hx+s*.05,hy+s*.72,s*.22,Math.PI+.5,TAU-.5);c.stroke();}
      else{c.arc(hx+s*.05,hy+s*.36,s*.22,.4,Math.PI-.4);c.stroke();}}}
  if(o.skull){c.fillStyle='#e7e5e4';c.beginPath();c.arc(hx,hy,s,0,TAU);c.fill();return;}
  eye(c,hx-s*.38,hy-s*.05,s*.32,o.eyeCol);eye(c,hx+s*.38,hy-s*.05,s*.32,o.eyeCol);
  if(o.beard){c.fillStyle='#1f1235';c.beginPath();c.moveTo(hx-s*.6,hy+s*.4);c.quadraticCurveTo(hx,hy+s*2,hx+s*.6,hy+s*.4);c.fill();}
  if(o.scarf){c.fillStyle=o.scarf;c.fillRect(hx-s*.9,hy+s*.55,s*1.8,s*.5);}
}
function weapon(c,r,o,hx,hy,atk,front){
  const w=o.weapon;
  if(w==='revolver'){c.save();c.translate(hx,hy);c.rotate(-.1-atk*.4);c.fillStyle='#3f2a1a';c.fillRect(-r*.06,0,r*.12,r*.2);c.fillStyle='#9aa3b5';c.fillRect(-r*.04,-r*.07,r*.42,r*.1);c.beginPath();c.arc(r*.06,-r*.02,r*.08,0,TAU);c.fill();
    if(atk>.6){c.fillStyle='#ffe28a';c.beginPath();c.moveTo(r*.42,-r*.02);c.lineTo(r*.62,-r*.12);c.lineTo(r*.56,-r*.02);c.lineTo(r*.64,r*.08);c.closePath();c.fill();}c.restore();return;}
  if(!front)return;
  switch(w){
    case 'rifle':c.save();c.translate(hx,hy);c.rotate(-atk*.12);c.fillStyle='#5b3a1e';c.beginPath();c.moveTo(-r*.45,r*.05);c.lineTo(-r*.15,-r*.04);c.lineTo(-r*.1,r*.1);c.closePath();c.fill();
      c.fillStyle='#2b2f38';c.fillRect(-r*.2,-r*.07,r*1.05,r*.1);c.fillStyle='#4b5160';c.fillRect(r*.1,-r*.07,r*.3,r*.13);if(o.scope){c.fillStyle='#111';c.fillRect(-r*.05,-r*.2,r*.32,r*.09);c.fillStyle='#67e8f9';c.fillRect(r*.25,-r*.19,r*.03,r*.07);}
      if(o.coil){for(let k=0;k<4;k++){c.fillStyle=k%2?'#0e7490':'#22d3ee';c.fillRect(r*(.42+k*.09),-r*.11,r*.05,r*.18);}c.fillStyle=`rgba(103,232,249,${.4+.4*Math.sin(atk*9+1)})`;c.fillRect(r*.4,-r*.03,r*.4,r*.03);}
      if(atk>.6){c.fillStyle='#ffe28a';c.beginPath();c.moveTo(r*.85,-r*.02);c.lineTo(r*1.08,-r*.13);c.lineTo(r*1,-r*.02);c.lineTo(r*1.1,r*.08);c.closePath();c.fill();}c.restore();break;
    case 'cards':for(let k=-1;k<=1;k++){c.save();c.translate(hx,hy);c.rotate(k*.35-.3-atk*.5);c.fillStyle='#fbf6e8';c.fillRect(0,-r*.11,r*.2,r*.28);c.fillStyle=o.spark?'#22d3ee':'#c8102e';c.fillRect(r*.07,-r*.02,r*.06,r*.06);c.restore();}
      if(o.spark&&Math.sin(atk*9+hx)>-.5){c.strokeStyle='#a5f3fc';c.lineWidth=1.2;c.beginPath();c.moveTo(hx+r*.2,hy-r*.3);c.lineTo(hx+r*.3,hy-r*.15);c.lineTo(hx+r*.22,hy-r*.12);c.lineTo(hx+r*.34,hy+r*.05);c.stroke();}break;
    case 'knuckles':c.fillStyle='#d4a12a';c.fillRect(hx-r*.02,hy-r*.1,r*.08,r*.2);break;
    case 'gloves':for(const dy of [0,-r*.3]){c.fillStyle='#dc2626';c.beginPath();c.arc(hx+(dy?-.08*r:atk*r*.25),hy+dy,r*.2,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.arc(hx-r*.05+(dy?-.08*r:atk*r*.25),hy+dy-r*.07,r*.07,0,TAU);c.fill();}break;
    case 'spear':c.strokeStyle='#7c4a1e';c.lineWidth=r*.07;c.beginPath();c.moveTo(hx-r*.35,hy+r*.45);c.lineTo(hx+r*.55+atk*r*.25,hy-r*.75);c.stroke();c.fillStyle='#d6dbe4';c.beginPath();const tx=hx+r*.55+atk*r*.25,ty=hy-r*.75;c.moveTo(tx+r*.1,ty-r*.2);c.lineTo(tx-r*.08,ty+r*.02);c.lineTo(tx+r*.08,ty+r*.08);c.closePath();c.fill();break;
    case 'cane':c.save();c.translate(hx,hy);c.rotate(.25-atk*.6);c.strokeStyle='#0b0612';c.lineWidth=r*.07;c.lineCap='round';c.beginPath();c.moveTo(0,r*.55);c.lineTo(0,-r*.35);c.arc(-r*.1,-r*.35,r*.1,0,Math.PI,true);c.stroke();c.fillStyle='#f8fafc';c.fillRect(-r*.04,r*.48,r*.08,r*.1);c.restore();break;
    case 'staff':c.strokeStyle='#4c1d95';c.lineWidth=r*.08;c.beginPath();c.moveTo(hx,hy+r*.55);c.lineTo(hx+r*.05,hy-r*.75);c.stroke();c.fillStyle='#fbf6e8';rr(c,hx-r*.1,hy-r*.98,r*.3,r*.3,r*.06);c.fill();c.fillStyle=o.staffTop||'#7c3aed';c.beginPath();c.arc(hx+r*.05,hy-r*.83,r*.05,0,TAU);c.fill();break;
    case 'orb':c.fillStyle=o.orbCol||'#fde68a';c.beginPath();c.arc(hx+r*.05,hy-r*.12,r*.15+atk*r*.05,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.arc(hx,hy-r*.18,r*.05,0,TAU);c.fill();break;
    case 'mic':{c.save();c.translate(hx,hy);c.rotate(-.5-atk*.3);c.fillStyle='#1f2937';c.fillRect(-r*.04,-r*.02,r*.08,r*.3);c.fillStyle='#cbd5e1';c.beginPath();c.arc(0,-r*.08,r*.11,0,TAU);c.fill();c.strokeStyle='#64748b';c.lineWidth=.8;c.beginPath();c.moveTo(-r*.09,-r*.08);c.lineTo(r*.09,-r*.08);c.stroke();c.restore();
      if(atk>.3){c.strokeStyle='rgba(249,168,212,.85)';c.lineWidth=1.3;for(let k=1;k<=2;k++){c.beginPath();c.arc(hx+r*.1,hy-r*.2,r*.16*k+atk*r*.1,-1.1,.3);c.stroke();}}break;}
    case 'coin':c.fillStyle='#d4a12a';c.beginPath();c.arc(hx+r*.05,hy-r*.15,r*.24,0,TAU);c.fill();c.strokeStyle='#8a6a18';c.lineWidth=1.5;c.beginPath();c.arc(hx+r*.05,hy-r*.15,r*.17,0,TAU);c.stroke();break;
  }
}
function human(c,r,o,t,atk){c.save();c.scale(1.32,1.32);human0(c,r,o,t,atk);c.restore();}
function human0(c,r,o,t,atk){
  const body=o.body||'#334155',skin=o.skin||'#e8c9a4',bulk=o.bulk||1,tw=r*.74*bulk,ty=-r*.3,th=r*.7;
  if(o.aura){const g=c.createRadialGradient(0,-r*.2,r*.1,0,-r*.2,r*1.25);g.addColorStop(0,hexA(o.aura,.45));g.addColorStop(1,hexA(o.aura,0));c.fillStyle=g;c.beginPath();c.arc(0,-r*.2,r*1.25,0,TAU);c.fill();}
  if(o.ghost)c.globalAlpha=.85;
  if(o.float){const g=c.createLinearGradient(0,r*.2,0,r*1.1);g.addColorStop(0,body);g.addColorStop(1,hexA('#c084fc',0));c.fillStyle=g;c.beginPath();c.moveTo(-tw*.45,r*.3);c.quadraticCurveTo(Math.sin(t*4)*r*.4,r*.9,r*.1,r*1.15);c.quadraticCurveTo(r*.15,r*.7,tw*.45,r*.3);c.fill();}
  else for(const [sx,ph] of [[-.16,0],[.16,Math.PI]]){const a=Math.sin(t*10+ph)*.3;c.save();c.translate(sx*r*bulk,ty+th-r*.04);c.rotate(a);c.fillStyle=o.pants||shade(body,-.4);rr(c,-r*.11*bulk,0,r*.22*bulk,r*.5,r*.07);c.fill();c.fillStyle='#17121a';rr(c,-r*.12*bulk,r*.42,r*.3*bulk,r*.13,r*.05);c.fill();c.restore();}
  if(o.gown){c.fillStyle=shade(body,-.15);c.beginPath();c.moveTo(-tw*.42,ty+th*.55);c.quadraticCurveTo(-tw*.75,r*.8,-tw*.7+Math.sin(t*3)*r*.05,r*1.02);c.lineTo(tw*.7,r*1.02);c.quadraticCurveTo(tw*.75,r*.8,tw*.42,ty+th*.55);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.5)';for(let k=0;k<6;k++){c.beginPath();c.arc(-tw*.4+k*tw*.16,r*(.5+.08*Math.sin(k*2+t*4)),r*.03,0,TAU);c.fill();}}
  if(o.cape){c.fillStyle=o.cape;c.beginPath();c.moveTo(-tw*.4,ty+r*.05);c.quadraticCurveTo(-tw*.9-Math.sin(t*3)*r*.1,ty+th*.6,-tw*.7,ty+th+r*.2);c.lineTo(tw*.1,ty+th);c.closePath();c.fill();}
  // back arm
  const sh=ty+r*.14,dual=o.dual||o.weapon==='gloves';
  const bhx=dual?r*.42:-tw*.55,bhy=dual?sh+r*.18:sh+r*.42;
  if(!o.fold){c.strokeStyle=shade(body,-.25);c.lineWidth=r*.19*Math.sqrt(bulk);c.lineCap='round';c.beginPath();c.moveTo(-tw*.3,sh);c.lineTo(bhx,bhy);c.stroke();c.fillStyle=skin;c.beginPath();c.arc(bhx,bhy,r*.1*Math.sqrt(bulk),0,TAU);c.fill();}
  if(dual)weapon(c,r,o,bhx,bhy,atk,false);
  // torso
  {const g=c.createLinearGradient(-tw/2,0,tw/2,0);g.addColorStop(0,shade(body,.14));g.addColorStop(.45,body);g.addColorStop(1,shade(body,-.28));c.fillStyle=g;}
  rr(c,-tw/2,ty,tw,th,r*.16*bulk);c.fill();c.beginPath();c.ellipse(0,ty+r*.1,tw*.56,r*.15*bulk,0,Math.PI,TAU);c.fill();
  if(o.coat){c.fillStyle=shade(body,-.18);c.beginPath();c.moveTo(-tw/2,ty+th*.55);c.lineTo(-tw*.62,ty+th+r*.22);c.lineTo(tw*.62,ty+th+r*.22);c.lineTo(tw/2,ty+th*.55);c.closePath();c.fill();c.strokeStyle=shade(body,.25);c.lineWidth=1;c.beginPath();c.moveTo(0,ty+r*.05);c.lineTo(0,ty+th+r*.2);c.stroke();}
  if(o.poncho){c.fillStyle=o.poncho;c.beginPath();c.moveTo(-tw*.62,ty+th*.5);c.lineTo(0,ty-r*.02);c.lineTo(tw*.62,ty+th*.5);c.lineTo(0,ty+th*.82);c.closePath();c.fill();c.strokeStyle='#7c2d12';c.lineWidth=r*.05;for(const k of [.32,.52]){c.beginPath();c.moveTo(-tw*.5*(1-k*.4),ty+th*k);c.lineTo(tw*.5*(1-k*.4),ty+th*k);c.stroke();}}
  if(o.vest){c.fillStyle=o.vest;c.beginPath();c.moveTo(-tw/2,ty+r*.04);c.lineTo(-tw*.08,ty+th*.75);c.lineTo(-tw/2,ty+th*.75);c.closePath();c.moveTo(tw/2,ty+r*.04);c.lineTo(tw*.08,ty+th*.75);c.lineTo(tw/2,ty+th*.75);c.closePath();c.fill();}
  if(o.tie){c.fillStyle='#f5f0e6';c.beginPath();c.moveTo(-tw*.15,ty);c.lineTo(0,ty+th*.45);c.lineTo(tw*.15,ty);c.fill();c.fillStyle=o.tie;c.beginPath();c.moveTo(-r*.05,ty+r*.04);c.lineTo(r*.05,ty+r*.04);c.lineTo(r*.03,ty+th*.38);c.lineTo(0,ty+th*.45);c.lineTo(-r*.03,ty+th*.38);c.fill();}
  if(o.armor){c.fillStyle=o.armor;for(const sx of [-1,1]){c.beginPath();c.ellipse(sx*tw*.45,ty+r*.08,r*.17,r*.12,0,0,TAU);c.fill();}c.fillStyle=shade(o.armor,-.15);for(let k=0;k<3;k++)c.fillRect(-tw*.36,ty+r*.16+k*r*.15,tw*.72,r*.07);}
  if(o.belt){c.fillStyle=o.belt==='gold'?'#d4a12a':'#2a2016';c.fillRect(-tw/2,ty+th*.72,tw,r*.1);c.fillStyle=o.belt==='gold'?'#fde68a':'#9aa3b5';c.fillRect(-r*.08,ty+th*.7,r*.16,r*.14);}
  if(o.bandolier){c.strokeStyle='#3f2a1a';c.lineWidth=r*.1;c.beginPath();c.moveTo(-tw*.45,ty+r*.05);c.lineTo(tw*.42,ty+th*.8);c.stroke();c.fillStyle='#d4a12a';for(let k=1;k<5;k++){const f=k/5.5;c.fillRect(-tw*.45+tw*.87*f-r*.025,ty+r*.05+(th*.75)*f-r*.06,r*.05,r*.1);}}
  if(o.sequins){c.fillStyle=o.sequins;for(let k=0;k<14;k++){const sx=((k*37)%11)/11-.5,sy=((k*53)%9)/9;const tw2=Math.sin(t*8+k*1.7);if(tw2>-.2){c.globalAlpha=(o.ghost?.85:1)*(.4+.6*tw2);c.beginPath();c.arc(sx*tw*.9,ty+r*.06+sy*th*.9,r*.035,0,TAU);c.fill();}}c.globalAlpha=o.ghost?.85:1;}
  if(o.badge){const bx=-tw*.2,by=ty+th*.32,bs=r*.13;c.fillStyle='#fbbf24';c.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,rad=k%2?bs*.45:bs;c.lineTo(bx+Math.cos(a)*rad,by+Math.sin(a)*rad);}c.closePath();c.fill();c.fillStyle='#fff7d6';c.beginPath();c.arc(bx-bs*.25,by-bs*.3,bs*.15,0,TAU);c.fill();}
  if(o.bowtie){c.fillStyle=o.bowtie;const by=ty+r*.06;c.beginPath();c.moveTo(0,by);c.lineTo(-r*.14,by-r*.07);c.lineTo(-r*.14,by+r*.07);c.closePath();c.moveTo(0,by);c.lineTo(r*.14,by-r*.07);c.lineTo(r*.14,by+r*.07);c.closePath();c.fill();c.beginPath();c.arc(0,by,r*.04,0,TAU);c.fill();}
  if(o.band){c.fillStyle=o.band;c.fillRect(-tw/2,ty+th*.35,tw,r*.12);c.fillStyle='#0b0612';c.font=`900 ${r*.1}px Barlow,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(o.bandText||'STAFF',0,ty+th*.35+r*.065);}
  // head + hat
  const hx=r*.04,hy=ty-r*.28;
  c.fillStyle=shade(skin,-.25);c.fillRect(hx-r*.08,hy+r*.2,r*.16,r*.12);
  if(o.hat==='hood'){const keep=o.hatCol;hat(c,r,o,hy);}
  if(o.hair){c.fillStyle=o.hair;c.beginPath();c.ellipse(hx-r*.06,hy+r*.06,r*.38,r*.42,0,0,TAU);c.fill();}
  headH(c,r,o,hx,hy);
  if(o.luchador){const sz=r*.33;c.fillStyle=o.luchador;c.beginPath();c.arc(hx,hy,sz*1.04,Math.PI*1.05,Math.PI*-.05);c.lineTo(hx+sz,hy+sz*.6);c.lineTo(hx-sz,hy+sz*.6);c.closePath();c.fill();c.fillStyle='#fff';for(const ex of [-.38,.38]){c.beginPath();c.ellipse(hx+ex*sz,hy-sz*.08,sz*.3,sz*.2,ex*.6,0,TAU);c.fill();}
    eye(c,hx-sz*.38,hy-sz*.08,sz*.18);eye(c,hx+sz*.38,hy-sz*.08,sz*.18);c.strokeStyle='#dc2626';c.lineWidth=1.4;c.beginPath();c.moveTo(hx,hy-sz);c.lineTo(hx,hy-sz*.3);c.stroke();}
  if(o.horns){c.fillStyle='#1c0a0a';for(const sx of [-1,1]){c.beginPath();c.moveTo(hx+sx*r*.16,hy-r*.22);c.quadraticCurveTo(hx+sx*r*.42,hy-r*.42,hx+sx*r*.3,hy-r*.62);c.quadraticCurveTo(hx+sx*r*.28,hy-r*.38,hx+sx*r*.06,hy-r*.28);c.closePath();c.fill();}}
  if(o.hair){c.fillStyle=o.hair;c.beginPath();c.ellipse(hx+r*.02,hy-r*.22,r*.33,r*.14,-.15,0,TAU);c.fill();c.fillStyle='#f9a8d4';c.beginPath();c.arc(hx+r*.24,hy-r*.18,r*.07,0,TAU);c.fill();}
  if(o.face==='mask'){c.fillStyle=o.scarf||'#111827';c.fillRect(hx-r*.3,hy+r*.02,r*.6,r*.22);}
  if(o.mustache){c.fillStyle=o.mustache;c.beginPath();c.moveTo(hx,hy+r*.1);c.quadraticCurveTo(hx-r*.16,hy+r*.06,hx-r*.24,hy+r*.18);c.quadraticCurveTo(hx-r*.12,hy+r*.14,hx,hy+r*.15);c.quadraticCurveTo(hx+r*.12,hy+r*.14,hx+r*.24,hy+r*.18);c.quadraticCurveTo(hx+r*.16,hy+r*.06,hx,hy+r*.1);c.fill();}
  if(o.halfmask){c.fillStyle='#f8fafc';c.beginPath();c.moveTo(hx+r*.02,hy-r*.3);c.quadraticCurveTo(hx+r*.36,hy-r*.28,hx+r*.33,hy+r*.02);c.quadraticCurveTo(hx+r*.2,hy+r*.22,hx+r*.02,hy+r*.14);c.closePath();c.fill();c.fillStyle='#0b0612';c.beginPath();c.ellipse(hx+r*.14,hy-r*.03,r*.06,r*.04,0,0,TAU);c.fill();}
  if(o.goggles){c.fillStyle='#111827';c.fillRect(hx-r*.33,hy-r*.1,r*.66,r*.13);for(const gx of [-.14,.14]){c.fillStyle=o.goggles;c.beginPath();c.arc(hx+gx*r,hy-r*.035,r*.1,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.arc(hx+gx*r-r*.03,hy-r*.07,r*.03,0,TAU);c.fill();}}
  if(o.skull){c.fillStyle='#0b0612';for(const ex of [-.12,.13]){c.beginPath();c.ellipse(hx+ex*r,hy-r*.02,r*.08,r*.09,0,0,TAU);c.fill();}c.fillStyle=o.aura||'#22d3ee';for(const ex of [-.12,.13]){c.beginPath();c.arc(hx+ex*r,hy-r*.01,r*.03,0,TAU);c.fill();}
    c.fillStyle='#0b0612';c.beginPath();c.moveTo(hx,hy+r*.06);c.lineTo(hx-r*.04,hy+r*.12);c.lineTo(hx+r*.04,hy+r*.12);c.fill();c.strokeStyle='#0b0612';c.lineWidth=1;for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(hx+k*r*.05,hy+r*.17);c.lineTo(hx+k*r*.05,hy+r*.23);c.stroke();}}
  if(o.earpiece){c.strokeStyle='#cbd5e1';c.lineWidth=.9;c.beginPath();c.moveTo(hx-r*.32,hy);c.quadraticCurveTo(hx-r*.42,hy+r*.25,hx-r*.3,hy+r*.42);c.stroke();c.fillStyle='#0b0612';c.beginPath();c.arc(hx-r*.32,hy,r*.045,0,TAU);c.fill();}
  if(o.hat&&o.hat!=='none'&&o.hat!=='hood')hat(c,r,o,hy-r*.2);
  // front arm + weapon
  const fhx=o.weapon==='rifle'?r*.32:o.weapon==='gloves'?r*.48+atk*r*.2:o.weapon==='spear'?r*.3:r*.45,fhy=o.weapon==='rifle'?sh+r*.12:o.weapon==='staff'?sh+r*.3:sh+r*.22;
  if(o.shield){c.fillStyle='#0b0612';c.beginPath();c.arc(r*.22,sh+r*.32,r*.36,0,TAU);c.fill();chipDisc(c,r*.33,o.shield,'#fff',0);c.restore&&0;}
  if(o.fold&&atk<.3){const fy=ty+th*.48,lw=r*.2*Math.sqrt(bulk);c.lineCap='round';c.strokeStyle=shade(body,-.15);c.lineWidth=lw;c.beginPath();c.moveTo(-tw*.48,ty+r*.15);c.lineTo(-tw*.48,fy);c.lineTo(tw*.34,fy-r*.02);c.stroke();
    c.strokeStyle=shade(body,.08);c.beginPath();c.moveTo(tw*.48,ty+r*.15);c.lineTo(tw*.48,fy+r*.08);c.lineTo(-tw*.3,fy+r*.06);c.stroke();c.fillStyle=skin;c.beginPath();c.arc(tw*.36,fy-r*.03,lw*.5,0,TAU);c.arc(-tw*.32,fy+r*.06,lw*.5,0,TAU);c.fill();if(o.weapon==='knuckles'){c.fillStyle='#d4a12a';c.fillRect(-tw*.36,fy+r*.0,r*.06,r*.12);}}
  else{c.strokeStyle=body;c.lineWidth=r*.19*Math.sqrt(bulk);c.lineCap='round';c.beginPath();c.moveTo(tw*.25,sh);c.lineTo(fhx,fhy);c.stroke();c.fillStyle=skin;c.beginPath();c.arc(fhx,fhy,r*.1*Math.sqrt(bulk),0,TAU);c.fill();
  weapon(c,r,o,fhx,fhy,atk,true);}
  if(o.frost){for(let k=0;k<5;k++){const a=t*1.5+k*TAU/5,fx=Math.cos(a)*r*.85,fy=-r*.2+Math.sin(a)*r*.45;c.strokeStyle='rgba(224,242,254,.9)';c.lineWidth=.9;for(let j=0;j<3;j++){const b=j*Math.PI/3;c.beginPath();c.moveTo(fx-Math.cos(b)*r*.07,fy-Math.sin(b)*r*.07);c.lineTo(fx+Math.cos(b)*r*.07,fy+Math.sin(b)*r*.07);c.stroke();}}}
  c.globalAlpha=1;
}
function robot(c,r,o,t,atk){c.save();c.scale(1.14,1.14);robot0(c,r,o,t,atk);c.restore();}
function robot0(c,r,o,t,atk){
  const c1=o.c1,c2=o.c2,steel='#6b7280',dark='#2b2f38';
  // legs
  if(o.legs==='tentacles'){c.lineCap='round';for(let k=0;k<5;k++){const x0=-r*.55+k*r*.27,ph=t*7+k*1.3;c.strokeStyle=k%2?'#4c1d95':'#6d28d9';c.lineWidth=r*.17;c.beginPath();c.moveTo(x0,r*.2);c.quadraticCurveTo(x0+Math.sin(ph)*r*.35,r*.6,x0+Math.sin(ph+1)*r*.25,r*.95);c.stroke();}c.fillStyle='#c4b5fd';for(let k=0;k<5;k++){const x0=-r*.55+k*r*.27;c.beginPath();c.arc(x0+Math.sin(t*7+k*1.3)*r*.18,r*.62,r*.04,0,TAU);c.fill();}}
  else if(o.legs==='treads'){c.fillStyle=dark;rr(c,-r*.85,r*.38,r*1.7,r*.52,r*.25);c.fill();c.fillStyle='#4b5160';for(let k=0;k<5;k++){c.beginPath();c.arc(-r*.62+k*r*.31,r*.64,r*.12,0,TAU);c.fill();}
    c.strokeStyle='#14161b';c.lineWidth=1.5;for(let k=0;k<9;k++){const x=-r*.8+((k*r*.2+t*r*1.5)%(r*1.6));c.beginPath();c.moveTo(x,r*.4);c.lineTo(x,r*.46);c.stroke();}}
  else if(o.legs==='spider'){c.strokeStyle=dark;c.lineWidth=r*.13;c.lineCap='round';for(const [sx,ph] of [[-1,0],[-.4,1.5],[.4,3],[1,4.5]]){const lift=Math.max(0,Math.sin(t*6+ph))*r*.12;c.beginPath();c.moveTo(sx*r*.4,r*.25);c.lineTo(sx*r*.95,r*.45-lift);c.lineTo(sx*r*1.05,r*.95-lift*.5);c.stroke();}}
  else{for(const [sx,ph] of [[-.3,0],[.3,Math.PI]]){const a=Math.sin(t*8+ph)*.25;c.save();c.translate(sx*r,r*.25);c.rotate(a);c.fillStyle=o.legCol||steel;rr(c,-r*.13,0,r*.26,r*.42,r*.06);c.fill();c.fillStyle=dark;c.beginPath();c.arc(0,r*.42,r*.11,0,TAU);c.fill();c.fillStyle=o.legCol?shade(o.legCol,-.3):'#4b5160';rr(c,-r*.12,r*.45,r*.24,r*.22,r*.05);c.fill();rr(c,-r*.16,r*.62,r*.36,r*.1,r*.04);c.fill();c.restore();}}
  const arm=(kind,front)=>{const sx=front?r*.55:-r*.62,sy=-r*.1;c.save();c.translate(sx,sy);
    switch(kind){
      case 'claw':c.fillStyle=steel;rr(c,-r*.08,-r*.06,r*.4,r*.16,r*.05);c.fill();c.fillStyle=dark;c.beginPath();c.moveTo(r*.3,-r*.1);c.lineTo(r*.5,-r*.18+atk*r*.06);c.lineTo(r*.42,r*.0);c.closePath();c.moveTo(r*.3,r*.12);c.lineTo(r*.5,r*.2-atk*r*.06);c.lineTo(r*.42,r*.04);c.closePath();c.fill();break;
      case 'cannon':c.fillStyle=dark;rr(c,-r*.1,-r*.11,r*.62-atk*r*.1,r*.22,r*.06);c.fill();c.fillStyle=steel;c.fillRect(r*.4-atk*r*.1,-r*.13,r*.1,r*.26);break;
      case 'missile':c.translate(0,-r*.35);c.fillStyle=dark;rr(c,-r*.2,-r*.2,r*.46,r*.36,r*.05);c.fill();for(let k=0;k<3;k++){c.fillStyle='#ef4444';c.beginPath();c.arc(r*.24,-r*.12+k*r*.12,r*.045,0,TAU);c.fill();}break;
      case 'lever':c.fillStyle='#cbd5e1';c.fillRect(-r*.04,-r*.6+atk*r*.35,r*.09,r*.62-atk*r*.35);c.fillStyle='#e11d48';c.beginPath();c.arc(r*.005,-r*.64+atk*r*.35,r*.16,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.arc(-r*.04,-r*.69+atk*r*.35,r*.05,0,TAU);c.fill();break;
      case 'fist':c.fillStyle=shade(c1,-.2);rr(c,-r*.12,-r*.1,r*.3,r*.5,r*.08);c.fill();for(let k=0;k<3;k++){c.fillStyle=k%2?c2:c1;c.beginPath();c.ellipse(r*.12+atk*r*.15,r*.35+k*r*.12-r*.1,r*.2,r*.08,0,0,TAU);c.fill();}break;
      case 'magnet':{c.rotate(-.3-atk*.6);c.strokeStyle='#dc2626';c.lineWidth=r*.2;c.lineCap='butt';c.beginPath();c.arc(r*.42,0,r*.22,-Math.PI/2,Math.PI/2,true);c.stroke();c.fillStyle='#e5e7eb';c.fillRect(r*.36,-r*.33,r*.14,r*.12);c.fillRect(r*.36,r*.21,r*.14,r*.12);c.fillStyle='#6b7280';rr(c,-r*.08,-r*.07,r*.36,r*.14,r*.04);c.fill();
        if(atk>.3){c.strokeStyle='rgba(239,68,68,.6)';c.lineWidth=1.2;for(let k=1;k<=2;k++){c.beginPath();c.arc(r*.6,0,r*.18*k+atk*r*.1,-1,1);c.stroke();}}break;}
      case 'shield':c.fillStyle='#475569';rr(c,-r*.05,-r*.45,r*.24,r*.95,r*.06);c.fill();c.fillStyle='#d4a12a';c.fillRect(r*.02,-r*.3,r*.1,r*.6);break;
    }c.restore();};
  if(o.arms)arm(o.arms[0],false);
  // torso
  const tx=-r*.62,tyy=-r*.6,tw=r*1.24,th=r*.95;
  switch(o.torso){
    case 'safe':c.fillStyle=c1;rr(c,tx,tyy,tw,th,r*.12);c.fill();c.fillStyle=shade(c1,-.15);rr(c,tx+r*.08,tyy+r*.08,tw-r*.16,th-r*.16,r*.08);c.fill();
      c.strokeStyle=c2;c.lineWidth=1.5;c.beginPath();c.arc(-r*.05,tyy+th*.5,r*.25,0,TAU);c.stroke();for(let k=0;k<8;k++){const a=k*Math.PI/4+t;c.beginPath();c.moveTo(-r*.05+Math.cos(a)*r*.25,tyy+th*.5+Math.sin(a)*r*.25);c.lineTo(-r*.05+Math.cos(a)*r*.32,tyy+th*.5+Math.sin(a)*r*.32);c.stroke();}
      eye(c,-r*.05,tyy+th*.5,r*.14);c.fillStyle=c2;c.fillRect(r*.32,tyy+th*.35,r*.08,r*.3);break;
    case 'slot':c.fillStyle=c1;rr(c,tx,tyy,tw,th,r*.14);c.fill();c.fillStyle=c2;rr(c,tx+r*.06,tyy+r*.05,tw-r*.12,r*.2,r*.06);c.fill();
      for(let k=0;k<5;k++){c.fillStyle=(Math.floor(t*6)+k)%2?'#fff':'#fbbf24';c.beginPath();c.arc(tx+tw*(k+.5)/5,tyy+r*.15,r*.04,0,TAU);c.fill();}
      c.fillStyle='#fffdf3';rr(c,tx+r*.14,tyy+r*.32,tw-r*.28,r*.32,r*.04);c.fill();c.font=`900 ${r*.28}px Georgia`;c.textAlign='center';c.textBaseline='middle';for(let k=0;k<3;k++){c.fillStyle='#b91c1c';c.fillText(atk>.2?['7','$','★'][(Math.floor(t*20)+k)%3]:'7',tx+r*.33+k*(tw-r*.66)/2,tyy+r*.49);}break;
    case 'dice':c.fillStyle=shade(c1,-.25);c.beginPath();c.moveTo(tx,tyy+r*.15);c.lineTo(tx+r*.2,tyy);c.lineTo(tx+tw+r*.05,tyy);c.lineTo(tx+tw-r*.15,tyy+r*.15);c.closePath();c.fill();
      c.fillStyle=c1;rr(c,tx,tyy+r*.12,tw-r*.12,th-r*.1,r*.12);c.fill();c.fillStyle=c2;for(const [px,py] of [[-.6,-.55],[.6,-.55],[0,0],[-.6,.55],[.6,.55]]){c.beginPath();c.arc(tx+(tw-r*.12)/2+px*r*.36,tyy+r*.12+(th-r*.1)/2+py*r*.3,r*.08,0,TAU);c.fill();}break;
    case 'chips':for(let k=0;k<4;k++){const yy=tyy+th-r*.12-k*r*.24,col=k%2?c2:c1;c.fillStyle=shade(col,-.3);c.beginPath();c.ellipse(0,yy+r*.06,r*.66,r*.2,0,0,TAU);c.fill();c.fillStyle=col;c.beginPath();c.ellipse(0,yy,r*.66,r*.2,0,0,TAU);c.fill();
      c.fillStyle=k%2?c1:c2;for(let j=0;j<6;j++){const a=j/6*TAU;c.fillRect(Math.cos(a)*r*.55-r*.04,yy+Math.sin(a)*r*.15-r*.03,r*.08,r*.06);}}break;
    case 'gold':c.fillStyle=c2;rr(c,tx-r*.05,tyy,tw+r*.1,th,r*.12);c.fill();for(let j=0;j<3;j++)for(let k=0;k<3-j;k++){c.fillStyle=c1;c.beginPath();const bx=tx+r*.15+k*r*.34+j*r*.17,by=tyy+th-r*.2-j*r*.22;c.moveTo(bx,by);c.lineTo(bx+r*.3,by);c.lineTo(bx+r*.25,by-r*.16);c.lineTo(bx+r*.05,by-r*.16);c.closePath();c.fill();}break;
  }
  // head
  if(o.head==='dome'){c.fillStyle=dark;c.fillRect(-r*.2,tyy-r*.08,r*.4,r*.1);c.fillStyle='rgba(165,243,252,.55)';c.beginPath();c.arc(0,tyy-r*.08,r*.3,Math.PI,TAU);c.fill();eye(c,-r*.1,tyy-r*.2,r*.1);eye(c,r*.1,tyy-r*.2,r*.1);
    if(o.crown)crown(c,0,tyy-r*.4,r*.24,'#fbbf24');}
  else if(o.head==='visor'){c.fillStyle=shade(c1,-.3);rr(c,-r*.28,tyy-r*.4,r*.56,r*.4,r*.08);c.fill();c.fillStyle='#0b0612';c.fillRect(-r*.22,tyy-r*.28,r*.44,r*.14);eye(c,-r*.1,tyy-r*.21,r*.08);eye(c,r*.1,tyy-r*.21,r*.08);
    if(o.face==='mask'){c.fillStyle='#7f1d1d';c.fillRect(-r*.3,tyy-r*.14,r*.6,r*.12);}}
  else if(o.head==='castle'){c.fillStyle=shade(c1,-.12);for(let k=0;k<5;k++)c.fillRect(tx+k*tw/5+r*.02,tyy-r*.22,tw/5-r*.08,r*.24);c.fillStyle=c2;c.fillRect(r*.3,tyy-r*.8,r*.04,r*.6);c.beginPath();c.moveTo(r*.34,tyy-r*.8);c.lineTo(r*.62+Math.sin(t*6)*r*.05,tyy-r*.7);c.lineTo(r*.34,tyy-r*.6);c.fill();}
  if(o.arms)arm(o.arms[1],true);
}
let NO_TURRET=false;
function tankTurrets(o,r){return o.twin?[[-r*.42,-r*.12],[r*.38,-r*.12]]:[[-r*.05,-r*.12]];}
function tank(c,r,o,t,atk){
  const c1=o.c1,c2=o.c2;
  c.fillStyle='#1f2228';rr(c,-r*1.05,r*.2,r*2.1,r*.6,r*.3);c.fill();c.fillStyle='#3a3f4b';for(let k=0;k<6;k++){const x=-r*.82+k*r*.33;c.beginPath();c.arc(x,r*.5,r*.14,0,TAU);c.fill();c.strokeStyle='#14161b';c.lineWidth=1;c.save();c.translate(x,r*.5);c.rotate(t*6);c.beginPath();c.moveTo(-r*.1,0);c.lineTo(r*.1,0);c.stroke();c.restore();}
  c.fillStyle=c1;c.beginPath();c.moveTo(-r*1.0,r*.22);c.lineTo(-r*.8,-r*.12);c.lineTo(r*.85,-r*.12);c.lineTo(r*1.05,r*.22);c.closePath();c.fill();
  c.fillStyle=shade(c1,.2);c.fillRect(-r*.75,-r*.12,r*1.55,r*.06);
  // poker-chip side skirt
  c.fillStyle=shade(c1,-.3);rr(c,-r*.98,r*.08,r*1.98,r*.16,r*.05);c.fill();for(let k=0;k<9;k++){c.fillStyle=k%2?'#f8f5ec':c2;c.fillRect(-r*.9+k*r*.205,r*.1,r*.1,r*.12);}
  c.strokeStyle='#d4a12a';c.lineWidth=1.2;c.beginPath();c.moveTo(-r*.8,-r*.12);c.lineTo(r*.85,-r*.12);c.stroke();
  c.fillStyle='#fde68a';c.beginPath();c.arc(r*.96,r*.02,r*.06,0,TAU);c.fill();
  c.strokeStyle='#4b5160';c.lineWidth=1;c.beginPath();c.moveTo(-r*.78,-r*.12);c.lineTo(-r*.9,-r*.85);c.stroke();c.fillStyle='#dc2626';c.beginPath();c.moveTo(-r*.9,-r*.85);c.lineTo(-r*.9+r*(.32+Math.sin(t*9)*.05),-r*.77);c.lineTo(-r*.9,-r*.69);c.fill();
  const turrets=o.twin?[[-r*.42,-r*.12],[r*.38,-r*.12]]:[[-r*.05,-r*.12]];
  if(!NO_TURRET)for(const [x,y] of turrets){const rec=atk*r*.15;
    c.fillStyle='#2b2f38';rr(c,x+r*.1-rec,y-r*.3,r*(o.twin?.8:1.05),r*.12,r*.04);c.fill();c.fillStyle='#4b5160';c.fillRect(x+r*(o.twin?.82:1.07)-rec,y-r*.32,r*.1,r*.16);
    c.fillStyle=shade(c1,-.2);c.beginPath();c.arc(x,y,r*.42,Math.PI,TAU);c.fill();
    c.fillStyle='#3b2412';c.beginPath();c.arc(x,y-r*.18,r*.33,0,TAU);c.fill();
    c.save();c.translate(x,y-r*.18);c.rotate(t*(atk>.2?10:2));for(let k=0;k<12;k++){c.fillStyle=k===0?'#16a34a':k%2?c2:'#111';c.beginPath();c.moveTo(0,0);c.arc(0,0,r*.28,k*TAU/12,(k+1)*TAU/12);c.closePath();c.fill();}c.fillStyle='#3b2412';c.beginPath();c.arc(0,0,r*.13,0,TAU);c.fill();c.restore();
    c.strokeStyle='#d4a12a';c.lineWidth=1.5;c.beginPath();c.arc(x,y-r*.18,r*.3,0,TAU);c.stroke();c.fillStyle='#d4a12a';c.beginPath();c.arc(x,y-r*.18,r*.06,0,TAU);c.fill();
    const ba=-t*5;c.fillStyle='#fff';c.beginPath();c.arc(x+Math.cos(ba)*r*.21,y-r*.18+Math.sin(ba)*r*.21,r*.04,0,TAU);c.fill();}
  // commander: little die popping from the hatch
  const hx=o.twin?-r*.05:-r*.5,hy=-r*.2;c.fillStyle='#f8f5ec';rr(c,hx-r*.13,hy-r*.26,r*.26,r*.26,r*.06);c.fill();eye(c,hx-r*.05,hy-r*.14,r*.05);eye(c,hx+r*.06,hy-r*.14,r*.05);
}
function chimera(c,r,o,t,atk){
  const c1=o.c1,c2=o.c2;
  c.strokeStyle='#15803d';c.lineWidth=r*.16;c.lineCap='round';c.beginPath();c.moveTo(-r*.8,0);c.quadraticCurveTo(-r*1.4,-r*.2,-r*1.2,-r*.7+Math.sin(t*5)*r*.1);c.stroke();
  c.fillStyle='#15803d';c.beginPath();c.ellipse(-r*1.18,-r*.78+Math.sin(t*5)*r*.1,r*.16,r*.11,-.6,0,TAU);c.fill();c.fillStyle='#fde047';c.beginPath();c.arc(-r*1.14,-r*.82+Math.sin(t*5)*r*.1,r*.03,0,TAU);c.fill();
  for(const [sx,ph] of [[-.55,0],[-.3,Math.PI],[.35,Math.PI],[.6,0]]){const a=Math.sin(t*12+ph)*.35;c.save();c.translate(sx*r,r*.25);c.rotate(a);c.fillStyle=shade(c1,-.35);rr(c,-r*.08,0,r*.16,r*.5,r*.06);c.fill();c.restore();}
  c.fillStyle=c1;c.beginPath();c.ellipse(-r*.05,r*.1,r*.85,r*.42,0,0,TAU);c.fill();
  c.fillStyle=shade(c1,.25);c.beginPath();c.ellipse(0,r*.25,r*.55,r*.15,0,0,TAU);c.fill();
  // goat head on the back
  c.fillStyle='#d6d3d1';c.beginPath();c.arc(-r*.2,-r*.38,r*.2,0,TAU);c.fill();c.strokeStyle='#78716c';c.lineWidth=r*.07;c.beginPath();c.arc(-r*.32,-r*.52,r*.14,Math.PI*.2,Math.PI*1.4);c.stroke();
  c.fillStyle='#111';c.beginPath();c.arc(-r*.15,-r*.4,r*.04,0,TAU);c.fill();
  // lion head with a chip mane
  const hx=r*.72,hy=-r*.22;for(let k=0;k<12;k++){const a=k/12*TAU;c.fillStyle=k%2?c2:'#e94b5a';c.beginPath();c.arc(hx+Math.cos(a)*r*.38,hy+Math.sin(a)*r*.38,r*.13,0,TAU);c.fill();}
  c.fillStyle='#f59e0b';c.beginPath();c.arc(hx,hy,r*.32,0,TAU);c.fill();c.fillStyle='#fcd34d';c.beginPath();c.ellipse(hx+r*.15,hy+r*.12,r*.16,r*.11,0,0,TAU);c.fill();c.fillStyle='#111';c.beginPath();c.arc(hx+r*.28,hy+r*.06,r*.05,0,TAU);c.fill();
  eye(c,hx-r*.06,hy-r*.08,r*.09);eye(c,hx+r*.13,hy-r*.08,r*.09);
  if(atk>.3){c.fillStyle='#fff';c.fillRect(hx+r*.1,hy+r*.2,r*.05,r*.08);c.fillRect(hx+r*.2,hy+r*.2,r*.05,r*.08);}
  // jester collar
  for(let k=0;k<4;k++){c.fillStyle=k%2?c2:c1;c.beginPath();c.moveTo(hx-r*.3+k*r*.14,hy+r*.3);c.lineTo(hx-r*.23+k*r*.14,hy+r*.55);c.lineTo(hx-r*.16+k*r*.14,hy+r*.3);c.fill();c.fillStyle='#fde68a';c.beginPath();c.arc(hx-r*.23+k*r*.14,hy+r*.57,r*.04,0,TAU);c.fill();}
}
function rider(c,r,o,t,atk){
  drawCreature(c,{b:'hound',face:'dog',c1:o.c1,c2:o.c2},r*.92,t,atk);CUR_FACE='beady';
  c.save();c.translate(-r*.1,-r*.8);chipDisc(c,r*.34,'#e94b5a','#fff',0);eye(c,-r*.08,-r*.02,r*.09);eye(c,r*.12,-r*.02,r*.09);
  c.fillStyle='#9aa3b5';c.beginPath();c.arc(0,-r*.12,r*.3,Math.PI,TAU);c.fill();c.fillStyle='#e94b5a';c.beginPath();c.moveTo(-r*.05,-r*.42);c.lineTo(r*.05,-r*.42);c.lineTo(0,-r*.62);c.fill();
  c.strokeStyle='#7c4a1e';c.lineWidth=r*.07;c.beginPath();c.moveTo(-r*.1,r*.15);c.lineTo(r*1.1+atk*r*.3,-r*.05);c.stroke();c.fillStyle='#d6dbe4';c.beginPath();const lx=r*1.1+atk*r*.3;c.moveTo(lx+r*.2,-r*.08);c.lineTo(lx,-r*.14);c.lineTo(lx,r*.03);c.fill();
  c.fillStyle='#fbbf24';c.beginPath();c.moveTo(r*.45,r*.05);c.lineTo(r*.7,0);c.lineTo(r*.45,-r*.12);c.fill();c.restore();
}
/* ---------- sprite cache: outline + shared top-left light ---------- */
const SPR=new Map(),SPF=12,SPP=.9,VIS_U=1.22,VIS_E=1.15;
function buildSprite(draw,r,outline){
  const half=Math.ceil(r*2.7+8),S=half*2,sc=2;
  const a=document.createElement('canvas');a.width=a.height=S*sc;const ca=a.getContext('2d');ca.scale(sc,sc);ca.translate(half,half);draw(ca);
  const b=document.createElement('canvas');b.width=b.height=S*sc;const cb=b.getContext('2d');const o=2.6;
  for(let k=0;k<12;k++){const an=k/12*TAU;cb.drawImage(a,Math.cos(an)*o,Math.sin(an)*o);}
  cb.globalCompositeOperation='source-in';cb.fillStyle=outline||'#0b0612';cb.fillRect(0,0,b.width,b.height);
  cb.globalCompositeOperation='source-over';cb.drawImage(a,0,0);
  cb.globalCompositeOperation='source-atop';const g=cb.createLinearGradient(0,0,b.width,b.height);g.addColorStop(0,'rgba(255,255,255,.18)');g.addColorStop(.48,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.32)');cb.fillStyle=g;cb.fillRect(0,0,b.width,b.height);
  const s=document.createElement('canvas');s.width=s.height=S*sc;const cs=s.getContext('2d');cs.drawImage(b,0,0);cs.globalCompositeOperation='source-in';cs.fillStyle='#fff';cs.fillRect(0,0,s.width,s.height);
  return {img:b,sil:s,half,S};
}
function unitSprite(k,f,a){if(a)f=f-f%3;const id='u'+k+'|'+f+'|'+a;let s=SPR.get(id);if(!s){const d=UNITS[k];NO_TURRET=d.look.b==='tank';s=buildSprite(c=>drawCreature(c,d.look,d.r,f/SPF*SPP,a),d.r);NO_TURRET=false;SPR.set(id,s);}return s;}
const WALKERS=new Set(['horse','greyhound','seven','goose','human','robot','hound','chip','crab','rider','chimera','coin','tank','hydra']);
function enemySprite(k,r,f){const id='e'+k+'|'+f;let s=SPR.get(id);if(!s){const d=ENEMIES[k];s=buildSprite(c=>drawEnemyRaw(c,k,r,d.col,f/SPF*SPP),r,hexA(d.col,.95));SPR.set(id,s);}return s;}
function frameOf(t,off){return Math.floor(((t/SPP)*SPF+off*7)%SPF+SPF)%SPF;}
function blit(c,s,x,y,sx,sy,flash,rot){c.save();c.translate(x,y);if(rot)c.rotate(rot);c.scale(sx,sy);c.drawImage(s.img,-s.half,-s.half,s.S,s.S);if(flash>0){c.globalAlpha=Math.min(1,flash*10);c.drawImage(s.sil,-s.half,-s.half,s.S,s.S);}c.restore();}
function hpBar(c,x,y,w,f){c.fillStyle='rgba(8,5,12,.85)';c.fillRect(x-w/2-1,y-1,w+2,4);c.fillStyle=f>.5?'#4ade80':f>.25?'#fbbf24':'#f43f5e';c.fillRect(x-w/2,y,w*clamp(f,0,1),2);}
function drawUnit(c,u,t){
  const d=u.def,L=d.look,r=u.r*VIS_U;
  const sk=u.spawnT>0?u.spawnT/.45:0,drop=-60*sk*sk,lift=(u.jh||0)+(-drop);
  // ground shadow & rings
  const sh=1/(1+lift/60);c.fillStyle=`rgba(0,0,0,${.42*sh})`;c.beginPath();c.ellipse(u.x,u.y+r*.82,r*.95*sh,r*.32*sh,0,0,TAU);c.fill();
  if(u.siegeP>0){c.fillStyle=`rgba(0,0,0,${.35*u.siegeP})`;c.beginPath();c.ellipse(u.x,u.y+r*.7,r*1.5,r*.5,0,0,TAU);c.fill();}
  if(u.sel){c.strokeStyle='#5eead4';c.lineWidth=1.6;c.beginPath();c.ellipse(u.x,u.y+r*.82,r*1.12,r*.42,0,0,TAU);c.stroke();}
  if(d.sp&&d.sp.aura){c.strokeStyle='rgba(255,176,32,.35)';c.lineWidth=1;c.beginPath();c.arc(u.x,u.y,150,0,TAU);c.stroke();}
  if(u.lockT>0){c.strokeStyle=`rgba(251,191,36,${.5+.3*Math.sin(t*10)})`;c.lineWidth=2;c.beginPath();for(let k=0;k<6;k++){const a=k/6*TAU+t*.6;c.lineTo(u.x+Math.cos(a)*r*1.45,u.y-r*.1+Math.sin(a)*r*1.3);}c.closePath();c.stroke();}
  if(u.infT>0){for(let k=0;k<4;k++){const a=t*7+k*1.6;c.fillStyle=k%2?'rgba(251,146,60,.55)':'rgba(253,224,71,.5)';c.beginPath();c.ellipse(u.x+Math.cos(a)*r*.7,u.y+r*.6,r*.25,r*.12,0,0,TAU);c.fill();}}
  // body motion: walk cycle only while moving, lunge for melee, recoil for guns
  const walker=WALKERS.has(L.b)&&!L.float,f=walker?Math.floor(u.walk/5)%SPF:frameOf(t,u.bob);
  const a=u.atk||0,ax=Math.cos(u.aim||0),ay=Math.sin(u.aim||0),mel=d.kind==='melee'||d.kind==='cone';
  let wind=0;if(mel&&u.target&&!u.target.dead&&u.cd<.22&&u.cd>0){const tg=u.target;if(Math.hypot(tg.x-u.x,tg.y-u.y)-tg.r<=u.def.range+10)wind=clamp((.22-u.cd)/.22,0,1);}
  const off=mel?a*a*13-wind*5:-a*3.5,ox=ax*off,oy=ay*off*.6;
  const land=u.spawnT>0&&sk<.25?(1-sk/.25)*.18:0;
  const bob=walker&&u.order.t!=='idle'&&u.order.t!=='hold'?Math.abs(Math.sin(u.walk*.35))*-1.6:Math.sin(t*2.4+u.bob)*.7;
  const s=unitSprite(u.k,f,a>.45?1:0);
  // life: lean into movement, breathe when idle, squash when hit, pop when merged
  const dxm=u.x-(u._px==null?u.x:u._px);u._px=u.x;u._lean=(u._lean||0)*.86+clamp(dxm*.07,-.16,.16)*.14;
  const moving=Math.abs(dxm)>.15||walker&&u.order.t!=='idle'&&u.order.t!=='hold';
  const br=moving?0:Math.sin(t*2.6+u.bob)*.035,hq=(u.flash||0)>0?.1:0;
  const bk=u.bumpAt!=null&&G.time-u.bumpAt<.25?1-(G.time-u.bumpAt)/.25:0;
  const pk=u.popAt!=null?(G.time-u.popAt)/.45:1,pop=pk<1?Math.sin(pk*Math.PI)*.38*(1-pk*.4):0;
  const rot=u._lean+(walker&&moving?Math.sin(u.walk*.35)*.05:0)+(bk?Math.cos(u.bumpA||0)*.14*bk*u.face:0);
  const ms=mel?a*a*.14-wind*.06:0;
  let rox=0,roy=0,rspin=0;if(u.rollAt!=null&&G.time-u.rollAt<.55){const k=(G.time-u.rollAt)/.55,o2=Math.sin(k*Math.PI)*u.rollD;rox=Math.cos(u.rollA)*o2;roy=Math.sin(u.rollA)*o2*.8;rspin=L.b==='wheel'?k*TAU*2*(Math.cos(u.rollA)>=0?1:-1):0;}
  if(d.sp&&d.sp.mega&&u.cd>0&&u.cd<1.4&&u.target&&!u.target.dead){const k=1-u.cd/1.4;c.save();c.globalCompositeOperation='lighter';c.fillStyle=`rgba(103,232,249,${.25+.5*k})`;c.beginPath();c.arc(u.x+Math.cos(u.aim||0)*u.r*1.1,u.y-u.r*.35+Math.sin(u.aim||0)*u.r*.6,3+k*9,0,TAU);c.fill();c.restore();}
  blit(c,s,u.x+ox+rox,u.y+oy+bob-lift-wind*2+roy,u.face*VIS_U*(1+.1*a+land+hq-br*.6+pop+ms),VIS_U*(1-.08*a-land-hq+br+pop-ms+wind*.06),u.flash||0,rspin?rspin:L.b==='tank'||L.b==='kraken'||L.b==='whale'?u._lean*.3:rot);
  if(L.b==='tank')drawTurrets(c,u,t,lift);
  if(u.flash>0)u.flash-=1/60;
  if(u.fanT>0){for(let k=0;k<3;k++){const an=t*20+k*2.1;c.fillStyle='#ffe28a';c.fillRect(u.x+u.face*r*.7+Math.cos(an)*4-1,u.y-r*.1+Math.sin(an)*4-1,2,2);}}
  if(G.decreeT>0){c.fillStyle=`rgba(251,191,36,${.6+.3*Math.sin(t*6+u.bob)})`;crown(c,u.x,u.y-r-12-lift,4,'#fbbf24');}
  if(u.order.t==='cast'){c.strokeStyle='rgba(192,132,252,.7)';c.lineWidth=1.2;c.setLineDash([3,4]);c.beginPath();c.moveTo(u.x,u.y);const e=u.order.e;c.lineTo(e?e.x:u.order.x,e?e.y:u.order.y);c.stroke();c.setLineDash([]);}
  if(u.rank){const yy=u.y-r-12-lift-(L.b==='card'||L.b==='crab'||L.b==='dealer'||L.b==='human'?r*.75:0);c.strokeStyle='#0b0612';c.lineWidth=3.2;c.lineJoin='round';
    for(let k=0;k<u.rank;k++){const cy=yy-k*3.5;c.beginPath();c.moveTo(u.x-4,cy-2);c.lineTo(u.x,cy+1);c.lineTo(u.x+4,cy-2);c.stroke();}c.strokeStyle='#ffd27a';c.lineWidth=1.6;for(let k=0;k<u.rank;k++){const cy=yy-k*3.5;c.beginPath();c.moveTo(u.x-4,cy-2);c.lineTo(u.x,cy+1);c.lineTo(u.x+4,cy-2);c.stroke();}}
  if(u.stunT>0){for(let k=0;k<3;k++){const an=t*6+k*2.1;c.fillStyle='#ffe28a';c.beginPath();c.arc(u.x+Math.cos(an)*r*.8,u.y-r-lift+Math.sin(an)*2.5,1.8,0,TAU);c.fill();}}
  if(u.hp<u.maxHp-.5||u.sel||typeof SET!=='undefined'&&SET.bars)hpBar(c,u.x,u.y-r-6-lift-(L.b==='card'||L.b==='crab'||L.b==='dealer'||L.b==='human'?r*.75:0),Math.max(16,r*1.7),u.hp/u.maxHp);
  if(d.ab&&u.sel&&u.cds[d.ab]>0){const k2=1-u.cds[d.ab]/ABIL[d.ab].cd,y2=u.y-r-10-lift-(L.b==='human'?r*.75:0);c.fillStyle='rgba(8,5,12,.85)';c.fillRect(u.x-9,y2+3,18,2);c.fillStyle='#c084fc';c.fillRect(u.x-9,y2+3,18*k2,2);}
}
function drawTurrets(c,u,t,lift){
  const L=u.def.look,R0=u.def.r,V=VIS_U,k=u.siegeP||0,a0=u.target&&!u.target.dead?Math.atan2(u.target.y-u.y,u.target.x-u.x):(u.aim!=null?u.aim:(u.face>0?0:Math.PI));
  if(k>0){c.strokeStyle=`rgba(255,196,0,${.35*k})`;c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();c.ellipse(u.x,u.y+R0*.55*V,R0*1.6*V,R0*.55*V,0,0,TAU);c.stroke();c.setLineDash([]);c.strokeStyle='#0b0612';c.lineWidth=5;c.lineCap='round';for(const sx of [-1,1])for(const sy of [-.2,1]){const bx=u.x+sx*R0*.85*V,by=u.y+R0*.3*V;c.beginPath();c.moveTo(bx,by);c.lineTo(bx+sx*R0*.45*k*V,by+R0*(.1+.35*k*sy)*V);c.stroke();}
    c.fillStyle='#9aa3b5';for(const sx of [-1,1]){c.fillRect(u.x+sx*R0*(.85+.45*k)*V-4,u.y+R0*(.62)*V,8,4);}}
  for(const [tx,ty] of tankTurrets(L,R0)){const x=u.x+u.face*tx*V,y=u.y+ty*V-lift+(k*R0*.08);
    const rec=(u.atk||0)*R0*.25,len=R0*(L.twin?.85:1.1)*(1+.7*k)*V,th=R0*.12*(1+.4*k)*V;
    c.save();c.translate(x,y-R0*.14*V);c.rotate(a0);c.fillStyle='#0b0612';c.fillRect(-rec,-th/2-1,len+2,th+2);c.fillStyle='#2b2f38';c.fillRect(-rec,-th/2,len,th);c.fillStyle='#6b7280';c.fillRect(len-rec-R0*.16*V,-th/2-1.5,R0*.16*V,th+3);
    if(k>.5){c.fillStyle='#4b5160';c.fillRect(len*.45-rec,-th/2-1,3,th+2);}
    if((u.atk||0)>.7){c.fillStyle='#ffe28a';c.beginPath();c.moveTo(len-rec+2,0);c.lineTo(len-rec+12,-6);c.lineTo(len-rec+9,0);c.lineTo(len-rec+12,6);c.closePath();c.fill();}c.restore();
    c.fillStyle='#0b0612';c.beginPath();c.arc(x,y,R0*.46*V,Math.PI,TAU);c.fill();c.fillStyle=shade(L.c1,-.2);c.beginPath();c.arc(x,y,R0*.42*V,Math.PI,TAU);c.fill();
    const wy=y-R0*.18*V;c.fillStyle='#0b0612';c.beginPath();c.arc(x,wy,R0*.36*V,0,TAU);c.fill();c.fillStyle='#3b2412';c.beginPath();c.arc(x,wy,R0*.33*V,0,TAU);c.fill();
    c.save();c.translate(x,wy);c.rotate(t*((u.atk||0)>.2?12:2));for(let i=0;i<12;i++){c.fillStyle=i===0?'#16a34a':i%2?L.c2:'#111';c.beginPath();c.moveTo(0,0);c.arc(0,0,R0*.28*V,i*TAU/12,(i+1)*TAU/12);c.closePath();c.fill();}c.fillStyle='#3b2412';c.beginPath();c.arc(0,0,R0*.13*V,0,TAU);c.fill();c.restore();
    c.strokeStyle='#d4a12a';c.lineWidth=1.5;c.beginPath();c.arc(x,wy,R0*.3*V,0,TAU);c.stroke();c.fillStyle='#d4a12a';c.beginPath();c.arc(x,wy,R0*.06*V,0,TAU);c.fill();
    const ba=-t*5;c.fillStyle='#fff';c.beginPath();c.arc(x+Math.cos(ba)*R0*.21*V,wy+Math.sin(ba)*R0*.21*V,R0*.045*V,0,TAU);c.fill();}
}
function drawBossOrbit(c,e,R,t,fly){const n=4,spd=e.windup>0?5:1.4,rad=R+16+Math.sin(t*2)*3;c.save();c.font='bold 13px Georgia';c.textAlign='center';c.textBaseline='middle';
  for(let k=0;k<n;k++){const an=t*spd+k/n*TAU,x=e.x+Math.cos(an)*rad,y=e.y-R*.2+Math.sin(an)*rad*.38-(fly||0);const front=Math.sin(an)>0;c.globalAlpha=front?.95:.45;
    c.fillStyle='#0b0612';c.beginPath();c.arc(x,y,6.5,0,TAU);c.fill();c.fillStyle=k%2?'#ff3b5a':'#f5f5f5';c.fillText('♠♥♣♦'[k],x,y+.5);}c.restore();}
function drawPortal(c,t){const x=14,y=SPAWN.y;c.save();c.translate(x,y);
  for(let k=0;k<3;k++){c.strokeStyle=k===1?'rgba(255,61,154,.75)':'rgba(180,107,255,.6)';c.lineWidth=2.5-k*.5;c.beginPath();c.ellipse(0,0,10+k*5,34+k*6,0,t*(1.5+k)+k,t*(1.5+k)+k+Math.PI*1.3);c.stroke();}
  const g=c.createRadialGradient(0,0,2,0,0,34);g.addColorStop(0,'rgba(255,61,154,.45)');g.addColorStop(1,'rgba(255,61,154,0)');c.fillStyle=g;c.beginPath();c.ellipse(0,0,22,40,0,0,TAU);c.fill();c.restore();}
function drawEnemy(c,e,t){
  const r=e.r,R=r*VIS_E,fly=e.def.fly?14:0;
  c.fillStyle=fly?'rgba(0,0,0,.28)':'rgba(0,0,0,.45)';c.beginPath();c.ellipse(e.x,e.y+R*.8,R*.9,R*.32,0,0,TAU);c.fill();
  if(fly){c.save();c.translate(0,-fly);}
  if(e.windup>0){const k=1-e.windup/.9;c.strokeStyle=`rgba(255,59,90,${.4+.5*k})`;c.lineWidth=2+k*2;c.beginPath();c.arc(e.x,e.y,R+10+k*(e.move==='slam'?60:10),0,TAU);c.stroke();
    c.font='20px Bungee,Impact';c.textAlign='center';c.fillStyle='#ff3b5a';c.strokeStyle='#0b0612';c.lineWidth=4;c.strokeText('!',e.x,e.y-R-18);c.fillText('!',e.x,e.y-R-18);}
  if(e.shield>0){c.fillStyle=`rgba(167,139,250,${.18+.08*Math.sin(t*8)})`;c.strokeStyle='rgba(196,181,253,.85)';c.lineWidth=2;c.beginPath();c.arc(e.x,e.y,R+9,0,TAU);c.fill();c.stroke();}
  if(e.dashT>0){c.strokeStyle='rgba(252,165,165,.6)';c.lineWidth=2;for(let k=0;k<4;k++){c.beginPath();c.moveTo(e.x-(e.fx||1)*(R+6+k*7),e.y-8+k*5);c.lineTo(e.x-(e.fx||1)*(R+20+k*9),e.y-8+k*5);c.stroke();}}
  if((e.phase||1)>1){const p=.5+.5*Math.sin(t*(e.phase===3?14:9));c.fillStyle=`rgba(255,40,70,${.08+.1*p})`;c.beginPath();c.arc(e.x,e.y,R+14+p*6,0,TAU);c.fill();}
  if(e.invulnT>0){c.save();c.strokeStyle='rgba(253,224,71,.9)';c.lineWidth=3;c.shadowColor='#fde047';c.shadowBlur=12;c.beginPath();c.arc(e.x,e.y,R+12,0,TAU);c.stroke();c.fillStyle='rgba(253,224,71,.12)';c.fill();c.restore();}
  if(e.def.boss||e.def.mini){const p=.5+.5*Math.sin(t*4);c.strokeStyle=hexA(e.def.col,.35+.3*p);c.lineWidth=2;c.beginPath();c.arc(e.x,e.y,R+7+p*3,0,TAU);c.stroke();}
  let kbx=0,kby=0;if(e.kbAt!=null&&G.time-e.kbAt<.16){const k=1-(G.time-e.kbAt)/.16;kbx=Math.cos(e.kbA)*e.kbP*k;kby=Math.sin(e.kbA)*e.kbP*k*.6;}
  if(e===G.inspect&&!VIEWING){c.strokeStyle='#ff3b5a';c.lineWidth=1.8;c.setLineDash([4,3]);c.beginPath();c.ellipse(e.x,e.y+R*.8,R*1.15,R*.45,0,0,TAU);c.stroke();c.setLineDash([]);}
  const ea=Math.max(0,e.atk||0),mvd=Math.hypot(e.x-(e._px==null?e.x:e._px),e.y-(e._py==null?e.y:e._py));e._px=e.x;e._py=e.y;const mov=mvd>.12&&!(e.stun>0);
  let sxm=1,sym=1,rot=0,hop=0;const big=e.def.boss||e.def.mini;
  if(mov&&!fly&&e.k!=='getaway'){if(e.k==='jinx'||e.k==='shard'){const ph=Math.abs(Math.sin(t*9+e.wob));hop=-ph*R*.45;sym+=ph*.08-.04;sxm-=ph*.06-.03;}
    else rot=Math.sin(t*(big?5:10)+e.wob)*(big?.07:.12);}
  if(e.k==='getaway'&&mov)rot=Math.sin(t*30)*.02;
  if((e.flash||0)>0){sxm*=1.14;sym*=.88;}
  if(e.flyAt!=null&&G.time-e.flyAt<.32){const k=(G.time-e.flyAt)/.32;hop-=Math.sin(k*Math.PI)*30;rot+=k*TAU*(e.face||1);}
  if(e.bumpAt!=null&&G.time-e.bumpAt<.25){const k=1-(G.time-e.bumpAt)/.25;sxm*=1+.12*k;sym*=1-.1*k;rot+=Math.cos(e.bumpA||0)*.18*k*(e.face||1);}
  if(e.windup>0){const k=1-e.windup/.9;sxm*=1+.12*k;sym*=1-.16*k;}
  if(e._wu>0&&!(e.windup>0))e.relAt=t;e._wu=e.windup||0;
  if(e.relAt!=null){const k=(t-e.relAt)/.3;if(k<1){sym*=1+.22*Math.sin(k*Math.PI);sxm*=1-.1*Math.sin(k*Math.PI);}}
  if(big)sym*=1+Math.sin(t*2.2)*.025;
  if(e.def.boss&&!VIEWING||e.def.boss&&VIEWING)drawBossOrbit(c,e,R,t,fly);
  if(big&&mov&&G.running&&!G.paused&&!VIEWING){e._st=(e._st||0)+1;if(e._st%(e.def.boss?16:14)===0&&G.parts.length<470){for(let k=0;k<4;k++)G.parts.push({x:e.x+(rnd()-.5)*R,y:e.y+R*.8,vx:(rnd()-.5)*40,vy:-10-rnd()*14,life:.6,max:.6,col:'#6b5d7a',size:4+rnd()*3,smoke:true});if(e.def.mini)G.shake=Math.min(3,G.shake+.6);}}
  if(e.hidden){c.save();c.globalAlpha=.13+.07*Math.sin(t*6+e.wob);}
  blit(c,enemySprite(e.k,r,frameOf(t,e.wob)),e.x+(e.fx||0)*ea*ea*5+kbx,e.y+(e.fy||0)*ea*ea*3+hop+kby,e.face*VIS_E*(1+.08*ea)*sxm,VIS_E*(1-.06*ea)*sym,e.flash||0,rot);
  if(e.hidden){c.restore();if(fly)c.restore();return;}
  if(e.charmT>0){c.fillStyle='#f9a8d4';c.font='bold 11px Georgia';c.textAlign='center';c.fillText('♥',e.x+Math.sin(t*6)*4,e.y-R-8-Math.abs(Math.sin(t*4))*3);}
  if(e.curseT>0){c.save();c.globalAlpha=.75;c.fillStyle='#a855f7';for(let k=0;k<3;k++){const an=t*5+k*2.1;c.beginPath();c.arc(e.x+Math.cos(an)*R*.7,e.y-R*.2+Math.sin(an)*R*.3,1.8,0,TAU);c.fill();}c.restore();}
  if(e.slow>0){c.strokeStyle='rgba(182,248,74,.8)';c.lineWidth=1.2;c.beginPath();c.ellipse(e.x,e.y+R*.8,R,R*.36,0,0,TAU);c.stroke();}
  if(e.stun>0){for(let k=0;k<3;k++){const a=t*6+k*2.1;c.fillStyle='#ffe28a';c.beginPath();c.arc(e.x+Math.cos(a)*R*.8,e.y-R-4+Math.sin(a)*2.5,1.8,0,TAU);c.fill();}}
  if((e.hp<e.maxHp||e.def.mini||typeof SET!=='undefined'&&SET.bars)&&!e.def.boss)hpBar(c,e.x,e.y-R-6,e.def.mini?34:Math.max(14,R*1.8),e.hp/e.maxHp);
  if(fly)c.restore();
  if(e.k==='getaway'&&!e.dead){c.fillStyle='rgba(255,233,168,.12)';c.beginPath();c.moveTo(e.x+e.face*R*1.2,e.y-R*.1);c.lineTo(e.x+e.face*R*4,e.y-R*1.1);c.lineTo(e.x+e.face*R*4,e.y+R*.9);c.closePath();c.fill();}
}
function drawCasino(c,t){
  const X=BASE.c0*TILE,Y=BASE.r0*TILE,W0=BASE.w*TILE,H0=BASE.h*TILE,f=clamp(G.base.hp/G.base.maxHp,0,1),tier=G.base.tier||0;
  const ht=G.base.hitT>0?G.base.hitT/.22:0;c.save();if(ht)c.translate((rnd()-.5)*3*ht,(rnd()-.5)*2*ht);
  const flick=f<.45?(Math.sin(t*23)+Math.sin(t*7.3)>.6?.25:1):1;
  // footprint grows: the corner casino is a small parlour on its lot
  const ins=tier===0?14:0,x=X+ins,y=Y+ins+4,w=W0-ins*2+ (tier===0?ins:0),h=H0-ins*2-8+(tier===0?0:8);
  const shadowLen=[8,14,24,46][tier];
  c.save();c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.moveTo(x,y);c.lineTo(x-shadowLen,y+shadowLen*.5);c.lineTo(x-shadowLen,y+h+shadowLen*.5);c.lineTo(x+w-shadowLen*.2,y+h+shadowLen*.5);c.lineTo(x+w,y+h);c.closePath();c.fill();c.restore();
  if(tier===0){ // lot, sidewalk and parking lines
    c.fillStyle='#2a2433';c.fillRect(X+4,Y,W0-4,H0);c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=1;for(let k=0;k<4;k++){c.beginPath();c.moveTo(X+6,Y+H0-6-k*14);c.lineTo(X+12,Y+H0-6-k*14);c.stroke();}}
  // wings for the resort and tower
  if(tier>=2){const wc=tier>=3?'#3a2a12':'#22152f';for(const [wy,wh] of [[Y-26,24],[Y+H0+2,24]]){c.fillStyle='#0b0612';c.fillRect(X-2,wy-1,W0+2,wh+2);c.fillStyle=wc;c.fillRect(X,wy,W0,wh);
      for(let k=0;k<9;k++){const lit=(k*5+Math.floor(t*.5))%4!==0;c.fillStyle=lit?(tier>=3?'#fde68a':'#ffcf7a'):'#2a1d10';c.fillRect(X+6+k*12.5,wy+5,7,5);c.fillRect(X+6+k*12.5,wy+14,7,5);}}
    // rooftop pool on the south wing
    c.fillStyle='#0b0612';c.fillRect(X+W0-50,Y+H0+5,42,17);const pg=c.createLinearGradient(0,Y+H0+6,0,Y+H0+21);pg.addColorStop(0,'#67e8f9');pg.addColorStop(1,'#0891b2');c.fillStyle=pg;c.fillRect(X+W0-49,Y+H0+6,40,15);
    c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1;for(let k=0;k<3;k++){const wx=X+W0-46+((t*8+k*13)%36);c.beginPath();c.moveTo(wx,Y+H0+10+k*4);c.lineTo(wx+5,Y+H0+10+k*4);c.stroke();}
    if(tier>=3){c.fillStyle='#1f2937';c.beginPath();c.arc(X+30,Y-14,10,0,TAU);c.fill();c.strokeStyle='#fde68a';c.lineWidth=1.4;c.stroke();c.fillStyle='#fde68a';c.font='700 11px Barlow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('H',X+30,Y-13);}}
  // main body
  c.fillStyle='#0b0612';c.fillRect(x-1,y-1,w+2,h+2);
  if(tier>=3){const gg=c.createLinearGradient(x,y,x+w,y+h);gg.addColorStop(0,'#fde68a');gg.addColorStop(.35,'#b45309');gg.addColorStop(.6,'#f59e0b');gg.addColorStop(1,'#78350f');c.fillStyle=gg;c.fillRect(x,y,w,h);
    c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=1;for(let k=1;k<6;k++){c.beginPath();c.moveTo(x+k*w/6,y);c.lineTo(x+k*w/6,y+h);c.stroke();}for(let k=1;k<8;k++){c.beginPath();c.moveTo(x,y+k*h/8);c.lineTo(x+w,y+k*h/8);c.stroke();}
    const sh=(t*.25)%1.6-.3;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();const sg=c.createLinearGradient(x+w*sh-40,y,x+w*sh+40,y+h);sg.addColorStop(0,'rgba(255,255,255,0)');sg.addColorStop(.5,'rgba(255,255,255,.35)');sg.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=sg;c.fillRect(x,y,w,h);c.restore();
    c.fillStyle='#1d1229';c.fillRect(x+16,y+14,w-28,h-28);}
  else{c.fillStyle=tier===0?'#2b2030':'#1d1229';c.fillRect(x,y,w,h);c.fillStyle='#120a1a';c.fillRect(x,y,10,h);
    for(let i=0;i<Math.floor(h/19);i++){const wy=y+10+i*19;if(wy>BASE.y-22&&wy<BASE.y+14)continue;const lit=f>.3||((i*7+3)%5>1);c.fillStyle=lit?'#ffcf7a':'#2a1d10';c.fillRect(x+2,wy,6,10);}
    c.fillStyle=tier===0?'#3a2d40':'#2b1a3d';c.fillRect(x+16,y+10,w-24,h-20);c.fillStyle=tier===0?'#45364b':'#38224f';c.fillRect(x+28,y+24,w-48,h-48);}
  if(tier===0){ // humble roof: AC units, vents and a small sign
    for(const [ax,ay] of [[x+w-30,y+20],[x+w-30,y+h-36]]){c.fillStyle='#0b0612';c.fillRect(ax-1,ay-1,18,14);c.fillStyle='#6b7280';c.fillRect(ax,ay,16,12);c.save();c.translate(ax+8,ay+6);c.rotate(t*6);c.strokeStyle='#374151';c.lineWidth=1.5;c.beginPath();c.moveTo(-4,0);c.lineTo(4,0);c.moveTo(0,-4);c.lineTo(0,4);c.stroke();c.restore();}
    c.globalAlpha=flick;neonStroke(c,signShape(c,'spade',x+w/2-2,y+h*.45,13),NEON.pink,2.2,10);c.globalAlpha=1;
    c.fillStyle='#0b0612';rr(c,x+w/2-20,y+h-26,36,13,3);c.fill();c.fillStyle=Math.sin(t*3)>-.7?'#ff3b5a':'#5a1626';c.font='700 9px Barlow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('OPEN',x+w/2-2,y+h-19);}
  else{ // chaser bulbs and the big neon spade
    const per=[],bx0=x+16,by0=y+10,bw=w-24,bh=h-20;for(let i=0;i<=28;i++)per.push([bx0+bw*i/28,by0]);for(let i=1;i<=34;i++)per.push([bx0+bw,by0+bh*i/34]);for(let i=1;i<=28;i++)per.push([bx0+bw-bw*i/28,by0+bh]);for(let i=1;i<34;i++)per.push([bx0,by0+bh-bh*i/34]);
    const bulb=tier>=3?['#fff7d6','#b45309']:['#ffd36b','#8a5a18'];per.forEach(([bx,by],i)=>{const dead=((i*37)%100)/100>f+.15;const on=!dead&&(Math.floor(t*(tier>=2?12:8))+i)%4!==0;c.fillStyle=dead?'#3a2a12':on?bulb[0]:bulb[1];c.beginPath();c.arc(bx,by,1.7,0,TAU);c.fill();});
    c.globalAlpha=flick;const sz=tier>=2?26:22;neonStroke(c,signShape(c,'spade',x+w/2+4,y+h*.5,sz),tier>=3?NEON.amber:NEON.pink,3,16);
    neonStroke(c,()=>{c.beginPath();c.arc(x+w/2+4,y+h*.5,sz+10,Math.PI*.75+t*(tier>=2?.6:0),Math.PI*2.25+t*(tier>=2?.6:0));},tier>=3?NEON.white:NEON.cyan,2,10);c.globalAlpha=1;
    neonStroke(c,()=>{c.beginPath();c.rect(x+2,y+2,w-4,h-4);},tier>=3?NEON.amber:NEON.pink,1.6,10);
    // marquee across the top edge
    c.fillStyle='#2a1640';c.fillRect(x+12,y-14,w-16,16);c.fillStyle='#0b0612';c.fillRect(x+12,y-15,w-16,2);
    for(let i=0;i<13;i++){const on=(Math.floor(t*10)+i)%3!==0;c.fillStyle=on?(tier>=3?'#fde68a':'#ff3d9a'):'#5a1636';c.beginPath();c.arc(x+18+i*(w-28)/12,y-7,1.8,0,TAU);c.fill();}}
  // side door for the croupiers
  c.fillStyle='#0b0612';c.fillRect(BASE.x-40,Y-2,20,8);c.fillStyle='#ffd27a';c.fillRect(BASE.x-38,Y,16,5);
  neonStroke(c,()=>{c.beginPath();c.moveTo(BASE.x-42,Y-3);c.lineTo(BASE.x-18,Y-3);},NEON.cyan,1.6,6);
  // entrance: plain door, then an awning, then gold columns and a red carpet
  c.fillStyle='#ffe2a8';c.fillRect(x-2,BASE.y-12,5,24);
  neonStroke(c,()=>{c.beginPath();c.arc(x,BASE.y,tier?17:12,Math.PI*.5,Math.PI*1.5);},NEON.amber,2.2,10);
  if(tier>=1){c.fillStyle='#b91c1c';c.beginPath();c.moveTo(x-16,BASE.y-20);c.lineTo(x+2,BASE.y-24);c.lineTo(x+2,BASE.y+24);c.lineTo(x-16,BASE.y+20);c.closePath();c.fill();for(let i=0;i<5;i++){c.fillStyle=i%2?'#fff':'#dc2626';c.fillRect(x-16,BASE.y-20+i*8,4,8);}}
  if(tier>=2){for(const py of [BASE.y-36,BASE.y+22]){c.fillStyle='#0b0612';c.fillRect(x-9,py,10,15);c.fillStyle='#d4a12a';c.fillRect(x-8,py+1,8,13);c.fillStyle='#fde68a';c.fillRect(x-7,py+1,2,13);}}
  // the resort tower and the sky tower crown
  if(tier>=2){const tx=x+w/2+4,ty=y-14,th2=tier>=3?64:44;c.fillStyle='#0b0612';c.fillRect(tx-16,ty-th2-1,32,th2+1);c.fillStyle=tier>=3?'#92400e':'#1d1229';c.fillRect(tx-15,ty-th2,30,th2);c.fillStyle=tier>=3?'#fbbf24':'#38224f';c.fillRect(tx-11,ty-th2+4,22,th2-6);
    for(let r2=0;r2<Math.floor((th2-8)/8);r2++)for(let k=0;k<2;k++){c.fillStyle=(r2+k+Math.floor(t))%3?(tier>=3?'#fff7d6':'#ffcf7a'):'#2a1d10';c.fillRect(tx-8+k*10,ty-th2+7+r2*8,5,4);}
    neonStroke(c,()=>{c.beginPath();c.moveTo(tx-15,ty-th2);c.lineTo(tx+15,ty-th2);},tier>=3?NEON.amber:NEON.pink,2,10);
    const beams=tier>=3?[[-30,1.1],[34,-1.3]]:[[0,.8]];c.save();c.globalCompositeOperation='lighter';for(const [ox,sp] of beams){const sa=Math.sin(t*sp)*.8-Math.PI/2,bx=tx+ox*(tier>=3?1:0),by=tier>=3?y-4:ty-th2;const L2=tier>=3?220:170;const gr=c.createLinearGradient(bx,by,bx+Math.cos(sa)*L2,by+Math.sin(sa)*L2);gr.addColorStop(0,'rgba(255,240,200,.32)');gr.addColorStop(1,'rgba(255,240,200,0)');
      c.fillStyle=gr;c.beginPath();c.moveTo(bx,by);c.lineTo(bx+Math.cos(sa-.11)*L2,by+Math.sin(sa-.11)*L2);c.lineTo(bx+Math.cos(sa+.11)*L2,by+Math.sin(sa+.11)*L2);c.closePath();c.fill();}c.restore();
    if(tier>=3){const cy=ty-th2-2,pul=.5+.5*Math.sin(t*3);c.save();c.globalCompositeOperation='lighter';c.fillStyle=`rgba(251,191,36,${.2+.12*pul})`;c.beginPath();c.arc(tx,cy,24+pul*4,0,TAU);c.fill();c.restore();
      c.fillStyle='#fbbf24';c.beginPath();c.arc(tx,cy,15,Math.PI,TAU);c.fill();c.fillStyle='#fde68a';c.beginPath();c.arc(tx-5,cy-6,4,0,TAU);c.fill();c.strokeStyle='#92400e';c.lineWidth=1;for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(tx+k*5,cy);c.quadraticCurveTo(tx+k*3,cy-10,tx,cy-15);c.stroke();}
      c.fillStyle='#fbbf24';c.fillRect(tx-1,cy-26,2,11);c.fillStyle=Math.sin(t*4)>0?'#ff3b5a':'#7f1d1d';c.beginPath();c.arc(tx,cy-27,2.6,0,TAU);c.fill();}}
  // damage
  if(f<.75){c.strokeStyle='rgba(0,0,0,.65)';c.lineWidth=1.5;c.beginPath();c.moveTo(x+30,y+30);c.lineTo(x+44,y+46);c.lineTo(x+40,y+60);c.moveTo(x+w-30,y+h-40);c.lineTo(x+w-46,y+h-28);c.stroke();}
  if(f<.5){c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.ellipse(x+w*.35,y+h*.72,16,10,.4,0,TAU);c.ellipse(x+w*.7,y+h*.25,12,9,0,0,TAU);c.fill();
    if(G.running&&!G.paused&&rnd()<.25&&G.parts.length<480)G.parts.push({x:x+w*(.3+rnd()*.5),y:y+h*(.2+rnd()*.6),vx:-8-rnd()*10,vy:-18-rnd()*10,life:2.2,max:2.2,col:'#3b3444',size:5+rnd()*4,smoke:true});}
  if(f<.25){for(let k=0;k<3;k++){const fx=x+w*(.3+k*.2),fy=y+h*(.3+k*.18),s=6+Math.sin(t*14+k)*2;c.fillStyle=k%2?'#ff7a1a':'#ffd23a';c.beginPath();c.moveTo(fx-s,fy);c.quadraticCurveTo(fx,fy-s*2.4,fx+s,fy);c.closePath();c.fill();}}
  // gun turrets, one per shot the tier fires
  if(G.base.cannon){const nC=typeof CASINO_TIERS!=='undefined'?CASINO_TIERS[tier].shots:1;for(let ci=0;ci<nC;ci++){const [gx,gy]=casinoGun(ci,tier);const big=tier>=2?1.2:1;c.save();c.translate(gx,gy);c.scale(big,big);
      c.fillStyle='#0b0612';c.beginPath();c.arc(0,0,10,0,TAU);c.fill();c.fillStyle=tier>=3?'#b45309':'#4b5160';c.beginPath();c.arc(0,0,8.5,0,TAU);c.fill();c.fillStyle=tier>=3?'#fbbf24':'#b9c0cc';c.beginPath();c.arc(0,0,6.5,0,TAU);c.fill();
      c.rotate(G.base.cang);c.fillStyle='#0b0612';c.fillRect(2,-3.5,17,7);c.fillStyle=tier>=3?'#fde68a':'#d6dbe4';c.fillRect(3,-2.5,15,5);if(tier>=1){c.fillStyle='#0b0612';c.fillRect(2,-1,16,2);}c.restore();}
    for(let k=0;k<G.base.cannon;k++){c.fillStyle='#ffd36b';c.beginPath();c.arc(BASE.x-14+k*4,BASE.y+16,1.3,0,TAU);c.fill();}}
  if(ht){c.fillStyle=`rgba(255,40,70,${.28*ht})`;c.fillRect(x,y,w,h);}
  c.restore();
}
function drawWorker(c,w,t){
  const S=1.5,moving=w.st!==1&&w.st!==4,ph=w.walk*.45,step=moving?Math.sin(ph):0,lift=moving?Math.abs(Math.sin(ph))*1.2:0;
  c.save();c.translate(w.x,w.y-lift);c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(0,9*S+lift,6*S,2.2*S,0,0,TAU);c.fill();
  c.scale(S*(w.face<0?-1:1),S);
  // legs
  c.strokeStyle='#0b0612';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(-1.6,5);c.lineTo(-1.6+step*2.4,9);c.moveTo(1.6,5);c.lineTo(1.6-step*2.4,9);c.stroke();
  c.strokeStyle='#1f1a2b';c.lineWidth=1.8;c.beginPath();c.moveTo(-1.6,5);c.lineTo(-1.6+step*2.4,9);c.moveTo(1.6,5);c.lineTo(1.6-step*2.4,9);c.stroke();
  // body: black vest, white shirt, red bow tie
  c.fillStyle='#0b0612';rr(c,-4.6,-3.4,9.2,9.4,2.4);c.fill();c.fillStyle='#1f1a2b';rr(c,-3.8,-2.6,7.6,7.8,1.8);c.fill();c.fillStyle='#f5f0e6';c.beginPath();c.moveTo(-1.6,-2.6);c.lineTo(0,1.6);c.lineTo(1.6,-2.6);c.fill();c.fillStyle='#e11d48';c.fillRect(-1.6,-2.8,3.2,1.4);
  // head + green dealer visor
  c.fillStyle='#0b0612';c.beginPath();c.arc(.4,-6.6,3.9,0,TAU);c.fill();c.fillStyle='#e8c9a4';c.beginPath();c.arc(.4,-6.6,3.1,0,TAU);c.fill();
  c.fillStyle='#16a34a';c.beginPath();c.ellipse(1.6,-8.4,4.4,1.5,0,0,Math.PI);c.fill();c.fillStyle='#0b0612';c.beginPath();c.arc(1.6,-6.6,.6,0,TAU);c.fill();
  // arms + chips held in front
  const n=Math.round((w.st===1?w.load:w.carry?1:0)*4),cols=['#d4a12a','#e94b5a','#3b82f6','#d4a12a'];
  if(n>0){c.strokeStyle='#0b0612';c.lineWidth=2.6;c.beginPath();c.moveTo(-2,-1.5);c.lineTo(4.2,0);c.moveTo(2.4,-1.5);c.lineTo(5.2,-.6);c.stroke();
    for(let s=0;s<n;s++){c.fillStyle='#0b0612';c.beginPath();c.ellipse(6.2,-1-s*1.9,3.6,1.7,0,0,TAU);c.fill();c.fillStyle=cols[s];c.beginPath();c.ellipse(6.2,-1.4-s*1.9,3,1.25,0,0,TAU);c.fill();}}
  else if(w.mode==='repair'){const sw=w.st===4?Math.sin(t*12+w.bob)*.9:0;c.strokeStyle='#0b0612';c.lineWidth=2.6;c.beginPath();c.moveTo(-2.6,-1.5);c.lineTo(-3.4,3);c.stroke();
    c.save();c.translate(2.6,-1.5);c.rotate(-.6+sw);c.strokeStyle='#0b0612';c.lineWidth=2.6;c.beginPath();c.moveTo(0,0);c.lineTo(3.5,0);c.stroke();c.strokeStyle='#7c4a1e';c.lineWidth=1.4;c.beginPath();c.moveTo(3,0);c.lineTo(3,-6);c.stroke();c.fillStyle='#9aa3b5';c.fillRect(1,-8,4.5,2.6);c.restore();
    c.fillStyle='#fbbf24';c.beginPath();c.ellipse(.6,-9.4,4.2,1.6,0,Math.PI,TAU);c.fill();}
  else{c.strokeStyle='#0b0612';c.lineWidth=2.6;c.beginPath();c.moveTo(-2.6,-1.5);c.lineTo(-3.4+step*-1.5,3);c.moveTo(2.6,-1.5);c.lineTo(3.4+step*1.5,3);c.stroke();}
  c.restore();
}
function drawRopes(c){
  const posts=[];for(let r=0;r<ROWS;r++)for(let cc=0;cc<COLS;cc++)if(grid[gi(cc,r)]===2)posts.push([cc,r]);
  c.lineCap='round';
  for(const [cc,r] of posts){const x=cc*TILE+15,y=r*TILE+15;
    for(const [dc,dr] of [[1,0],[0,1]])if(cc+dc<COLS&&r+dr<ROWS&&grid[gi(cc+dc,r+dr)]===2){const x2=x+dc*TILE,y2=y+dr*TILE;
      c.strokeStyle='#2a0610';c.lineWidth=5;c.beginPath();c.moveTo(x,y-6);c.quadraticCurveTo((x+x2)/2,(y+y2)/2+(dc?5:0)-6,x2,y2-6);c.stroke();c.strokeStyle='#c0193f';c.lineWidth=3;c.stroke();}}
  for(const [cc,r] of posts){const x=cc*TILE+15,y=r*TILE+15;c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.ellipse(x+1,y+7,7,3,0,0,TAU);c.fill();
    c.fillStyle='#0b0612';c.beginPath();c.ellipse(x,y+5,6.5,3,0,0,TAU);c.fill();c.fillStyle='#aab2c0';c.beginPath();c.ellipse(x,y+4.6,5.5,2.3,0,0,TAU);c.fill();
    c.fillStyle='#0b0612';c.fillRect(x-2.2,y-9,4.4,14);c.fillStyle='#dfe4ec';c.fillRect(x-1.3,y-8,2.6,12);c.fillStyle='#0b0612';c.beginPath();c.arc(x,y-9,3.6,0,TAU);c.fill();c.fillStyle='#eef1f6';c.beginPath();c.arc(x,y-9,2.6,0,TAU);c.fill();}
}
function routePoints(){const pts=[];let c=SPAWN.c,r=SPAWN.r;for(let k=0;k<300;k++){let bc=c,br=r,bv=flow[gi(c,r)];for(const [dc,dr] of NB){const nc=c+dc,nr=r+dr;if(!open(nc,nr))continue;if(dc&&dr&&(!open(c+dc,r)||!open(c,r+dr)))continue;if(flow[gi(nc,nr)]<bv-.01){bv=flow[gi(nc,nr)];bc=nc;br=nr;}}if(bc===c&&br===r)break;c=bc;r=br;pts.push([c*TILE+15,r*TILE+15]);}return pts;}
function drawRoute(c){
  const pts=routePoints();c.fillStyle='rgba(255,255,255,.2)';
  for(let i=2;i<pts.length-1;i+=3){const [x1,y1]=pts[i-1],[x2,y2]=pts[i+1],a=Math.atan2(y2-y1,x2-x1);const [x,y]=pts[i];
    c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(7,0);c.lineTo(-2,-6);c.lineTo(-2,-2.4);c.lineTo(-8,-2.4);c.lineTo(-8,2.4);c.lineTo(-2,2.4);c.lineTo(-2,6);c.closePath();c.fill();c.restore();}
}
function drawProj(c,p,t){
  if(p.shell&&p.missile){const k=Math.min(1,p.el/p.T),px=p.x,py=p.y-p.h,a=Math.atan2((p.ty-p.sy)-Math.cos(k*Math.PI)*80*Math.PI,(p.tx-p.sx));
    c.fillStyle='rgba(180,170,190,.35)';c.beginPath();c.arc(px-Math.cos(a)*7,py+4,3,0,TAU);c.fill();c.save();c.translate(px,py);c.rotate(a);c.fillStyle='#0b0612';c.fillRect(-6,-2.6,12,5.2);c.fillStyle='#e5e7eb';c.fillRect(-5,-1.7,9,3.4);c.fillStyle='#ef4444';c.beginPath();c.moveTo(4,-1.7);c.lineTo(7,0);c.lineTo(4,1.7);c.fill();c.fillStyle='#ffb020';c.fillRect(-8,-1,3,2);c.restore();return;}
  if(p.shell&&p.die){const k=Math.min(1,p.el/p.T);c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(p.x,p.y,4,2,0,0,TAU);c.fill();c.save();c.translate(p.x,p.y-p.h);c.rotate(t*12+p.sx);c.fillStyle='#0b0612';c.fillRect(-5,-5,10,10);c.fillStyle='#f8f5ec';c.fillRect(-4,-4,8,8);c.fillStyle='#b91c1c';c.fillRect(-1.2,-1.2,2.4,2.4);c.restore();return;}
  if(p.shell&&p.ink){const py=p.y-p.h;c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(p.x,p.y,4,2,0,0,TAU);c.fill();c.fillStyle='rgba(91,33,182,.4)';c.beginPath();c.arc(p.x-(p.tx-p.sx)*.012,py+3,3,0,TAU);c.fill();c.fillStyle='#0b0612';c.beginPath();c.arc(p.x,py,6.2,0,TAU);c.fill();c.fillStyle='#4c1d95';c.beginPath();c.arc(p.x,py,5,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.arc(p.x-1.6,py-1.8,1.6,0,TAU);c.fill();return;}
  if(p.shell){c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(p.x,p.y,4,2,0,0,TAU);c.fill();c.fillStyle='#0b0612';c.beginPath();c.arc(p.x,p.y-p.h,6,0,TAU);c.fill();c.fillStyle='#3a3346';c.beginPath();c.arc(p.x,p.y-p.h,4.6,0,TAU);c.fill();c.fillStyle=p.col;c.fillRect(p.x-1,p.y-p.h-6,2,3);return;}
  const a=Math.atan2(p.ty-p.y,p.tx-p.x);c.save();c.translate(p.x,p.y);
  switch(p.st){
    case 'die':case 'bdie':c.rotate(t*14+p.sx);c.fillStyle='#0b0612';c.fillRect(-3.4,-3.4,6.8,6.8);c.fillStyle=p.st==='die'?'#f8f5ec':'#1d1d1f';c.fillRect(-2.6,-2.6,5.2,5.2);c.fillStyle=p.st==='die'?'#111':'#ef4444';c.fillRect(-.8,-.8,1.6,1.6);break;
    case 'shard':c.rotate(a);c.fillStyle='#0b0612';c.beginPath();c.moveTo(6,0);c.lineTo(0,-3);c.lineTo(-6,0);c.lineTo(0,3);c.fill();c.fillStyle='#ef4444';c.beginPath();c.moveTo(4.5,0);c.lineTo(0,-1.8);c.lineTo(-4.5,0);c.lineTo(0,1.8);c.fill();break;
    case 'coin':{const sx=Math.abs(Math.sin(t*16+p.sx));c.scale(Math.max(.2,sx),1);c.fillStyle='#0b0612';c.beginPath();c.arc(0,0,4.2,0,TAU);c.fill();c.fillStyle='#e9c46a';c.beginPath();c.arc(0,0,3.2,0,TAU);c.fill();break;}
    case 'fire':{c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(249,115,22,.7)';c.beginPath();c.arc(0,0,6,0,TAU);c.fill();c.fillStyle='#fde047';c.beginPath();c.arc(0,0,3.2,0,TAU);c.fill();c.fillStyle='rgba(239,68,68,.45)';c.beginPath();c.arc(-Math.cos(a)*7,-Math.sin(a)*7,4,0,TAU);c.fill();c.restore();break;}
    case 'card':c.rotate(t*10+p.sx);c.fillStyle='#0b0612';c.fillRect(-3.6,-5,7.2,10);c.fillStyle='#fbf6e8';c.fillRect(-2.8,-4.2,5.6,8.4);c.fillStyle=p.col;c.fillRect(-1,-1,2,2);break;
    case 'laser':c.rotate(a);c.strokeStyle='#ef4444';c.lineWidth=3;c.beginPath();c.moveTo(-9,0);c.lineTo(5,0);c.stroke();c.strokeStyle='#fff';c.lineWidth=1.2;c.stroke();break;
    case 'slug':c.rotate(a);c.strokeStyle='rgba(255,210,120,.45)';c.lineWidth=1.5;c.beginPath();c.moveTo(-12,0);c.lineTo(0,0);c.stroke();c.fillStyle='#0b0612';c.beginPath();c.ellipse(0,0,4.5,2.6,0,0,TAU);c.fill();c.fillStyle='#e0b24a';c.beginPath();c.ellipse(.3,0,3.5,1.7,0,0,TAU);c.fill();break;
    default:c.fillStyle='#0b0612';c.beginPath();c.arc(0,0,3.6,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(0,0,2.6,0,TAU);c.fill();c.strokeStyle=p.col;c.lineWidth=1;c.stroke();
  }
  c.restore();
}
function drawZone(c,z,t){
  const k=z.t/z.max,fade=Math.min(1,z.t*2,(z.max-z.t)*4);
  if(z.k==='storm'){c.save();c.globalAlpha=.55*fade;const g=c.createRadialGradient(z.x,z.y,4,z.x,z.y,z.r);g.addColorStop(0,'rgba(124,58,237,.5)');g.addColorStop(.75,'rgba(22,101,52,.35)');g.addColorStop(1,'rgba(22,101,52,0)');c.fillStyle=g;c.beginPath();c.arc(z.x,z.y,z.r,0,TAU);c.fill();
    c.globalAlpha=fade;c.strokeStyle='#b6f84a';c.lineWidth=1.5;for(let i=0;i<3;i++){c.beginPath();c.arc(z.x,z.y,z.r*(.35+i*.3),t*(2+i)+i,t*(2+i)+i+2.2);c.stroke();}
    c.fillStyle='#d9f99d';c.font='bold 12px Georgia';c.textAlign='center';c.textBaseline='middle';for(let i=0;i<7;i++){const a=t*3+i*TAU/7+z.seed,rr2=z.r*(.3+.6*((i*37%10)/10));c.fillText('♣',z.x+Math.cos(a)*rr2,z.y+Math.sin(a)*rr2);}c.restore();}
  if(z.k==='thunder'){c.save();c.globalAlpha=.6*fade;c.fillStyle='rgba(15,23,42,.55)';c.beginPath();c.ellipse(z.x,z.y,z.r,z.r*.8,0,0,TAU);c.fill();c.strokeStyle='rgba(103,232,249,.5)';c.lineWidth=1;c.setLineDash([4,6]);c.beginPath();c.ellipse(z.x,z.y,z.r,z.r*.8,0,0,TAU);c.stroke();c.setLineDash([]);c.restore();}
}
function drawFx(c,f,t){
  const a=f.life/f.max;
  if(f.t==='shock'){const R2=f.r*(1.1-a*.6);c.globalAlpha=a;c.strokeStyle='#fde68a';c.lineWidth=3;c.beginPath();c.ellipse(f.x,f.y,R2,R2*.45,0,0,TAU);c.stroke();c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=1.5;for(let k=0;k<7;k++){const an=k/7*TAU;c.beginPath();c.moveTo(f.x+Math.cos(an)*6,f.y+Math.sin(an)*3);c.lineTo(f.x+Math.cos(an)*R2*.7,f.y+Math.sin(an)*R2*.32);c.stroke();}c.globalAlpha=1;return;}
  if(f.t==='bolt'){c.globalAlpha=a;let s=f.seed;const path=()=>{c.beginPath();c.moveTo(f.x+((s=(s*9301+49297)%233280)/233280-.5)*30,f.y-140);for(let k=1;k<=7;k++){s=(s*9301+49297)%233280;c.lineTo(f.x+(s/233280-.5)*(k<7?22:0),f.y-140+k*20);}};
    c.strokeStyle='#22e1ff';c.lineWidth=4;c.shadowColor='#22e1ff';c.shadowBlur=12;path();c.stroke();c.shadowBlur=0;s=f.seed;c.strokeStyle='#fff';c.lineWidth=1.5;path();c.stroke();c.fillStyle='rgba(165,243,252,.6)';c.beginPath();c.ellipse(f.x,f.y+4,14*a,6*a,0,0,TAU);c.fill();c.globalAlpha=1;return;}
  if(f.t==='notes'){c.globalAlpha=Math.min(1,a*1.5);c.strokeStyle='rgba(249,168,212,.7)';c.lineWidth=2;c.beginPath();c.arc(f.x,f.y,f.r*(1.15-a*.3),0,TAU);c.stroke();c.fillStyle='#fbcfe8';c.font='bold 15px Georgia';c.textAlign='center';
    for(let k=0;k<9;k++){const an=k/9*TAU,rr2=f.r*(.4+.55*(k%3)/2);c.fillText(k%2?'♪':'♫',f.x+Math.cos(an)*rr2,f.y+Math.sin(an)*rr2-(1-a)*24);}c.globalAlpha=1;return;}
  if(f.t==='jackpot'){c.save();c.globalAlpha=Math.min(1,a*2);c.font='34px Monoton,Bungee,Impact';c.textAlign='center';c.fillStyle='#fff1c2';c.shadowColor='#ffb020';c.shadowBlur=18;c.fillText('777',f.x,f.y-30-(1-a)*20);c.restore();return;}
  if(f.t==='slash'){const k=1-a;c.save();c.globalAlpha=Math.min(1,a*1.6);c.lineCap='round';
    if(f.st==='blade'){const sp=2.1,st0=f.a-Math.PI/2-sp/2,cur=st0+sp*Math.min(1,k*2.2);c.strokeStyle=f.col;c.shadowColor=f.col;c.shadowBlur=8;c.lineWidth=5*a+1;c.beginPath();c.arc(f.x-Math.cos(f.a)*f.r*.4,f.y-Math.sin(f.a)*f.r*.4,f.r,Math.max(st0,cur-1.4),cur);c.stroke();c.shadowBlur=0;c.strokeStyle='#fff';c.lineWidth=1.5;c.stroke();}
    else if(f.st==='claw'){const px=-Math.sin(f.a),py=Math.cos(f.a),L2=f.r*1.1,d=Math.min(1,k*2.5);for(let i=-1;i<=1;i++){const ox=Math.cos(f.a)*i*5,oy=Math.sin(f.a)*i*5;c.strokeStyle=f.col;c.lineWidth=3*a+.8;c.beginPath();c.moveTo(f.x+ox-px*L2*.6,f.y+oy-py*L2*.6);c.quadraticCurveTo(f.x+ox+Math.cos(f.a)*5,f.y+oy+Math.sin(f.a)*5,f.x+ox-px*L2*.6+px*L2*1.2*d,f.y+oy-py*L2*.6+py*L2*1.2*d);c.stroke();}c.strokeStyle='rgba(255,60,90,.8)';c.lineWidth=1;c.stroke();}
    else if(f.st==='punch'){const R2=f.r*(.5+k*.9);c.fillStyle=hexA('#fde68a',.85*a);c.beginPath();for(let i=0;i<16;i++){const an=i/16*TAU+f.seed,rr2=i%2?R2*.45:R2;c.lineTo(f.x+Math.cos(an)*rr2,f.y+Math.sin(an)*rr2*.8);}c.closePath();c.fill();c.strokeStyle='#fff';c.lineWidth=2*a;c.beginPath();c.arc(f.x,f.y,R2*1.15,0,TAU);c.stroke();}
    else{const L2=f.r*1.6,d=Math.min(1,k*3);c.strokeStyle=f.col;c.lineWidth=4*a+1;c.beginPath();c.moveTo(f.x-Math.cos(f.a)*L2*.8,f.y-Math.sin(f.a)*L2*.8);c.lineTo(f.x+Math.cos(f.a)*L2*(d-.2),f.y+Math.sin(f.a)*L2*(d-.2));c.stroke();}
    c.restore();return;}
  if(f.t==='clock'){const k=1-a;c.save();c.globalAlpha=Math.min(1,a*2);c.strokeStyle='rgba(253,230,138,.85)';c.lineWidth=3;c.beginPath();c.arc(f.x,f.y,f.r,0,TAU);c.stroke();c.fillStyle='rgba(253,230,138,.08)';c.fill();
    for(let i=0;i<12;i++){const an=i/12*TAU;c.beginPath();c.moveTo(f.x+Math.cos(an)*f.r*.9,f.y+Math.sin(an)*f.r*.9);c.lineTo(f.x+Math.cos(an)*f.r,f.y+Math.sin(an)*f.r);c.stroke();}
    c.lineWidth=4;c.beginPath();c.moveTo(f.x,f.y);c.lineTo(f.x+Math.cos(-Math.PI/2+k*TAU)*f.r*.75,f.y+Math.sin(-Math.PI/2+k*TAU)*f.r*.75);c.moveTo(f.x,f.y);c.lineTo(f.x,f.y-f.r*.5);c.stroke();c.restore();return;}
  if(f.t==='breath'){const k=1-a,grow=Math.min(1,k/.22),len=f.r*grow,P=f.pal;c.save();c.globalCompositeOperation='lighter';
    for(const [w,al,stp] of [[.5,.55,1],[.24,.85,0]]){const gr=c.createRadialGradient(f.x,f.y,1,f.x,f.y,Math.max(4,len));gr.addColorStop(0,hexA(P[0],al*a));gr.addColorStop(.3,hexA(P[1],al*.9*a));gr.addColorStop(.75,hexA(P[2],al*.6*a));gr.addColorStop(1,hexA(P[2],0));
      c.fillStyle=gr;c.beginPath();c.moveTo(f.x,f.y);for(let i=0;i<=12;i++){const an=f.a-w+i*(2*w/12),rr2=len*(.78+.22*Math.sin(t*45+i*1.9+f.seed+stp));c.lineTo(f.x+Math.cos(an)*rr2,f.y+Math.sin(an)*rr2);}c.closePath();c.fill();}
    c.fillStyle=hexA(P[0],.9*a);c.beginPath();c.arc(f.x,f.y,4+3*a,0,TAU);c.fill();c.restore();return;}
  if(f.t==='sparkle'){const k=1-a,s2=4+k*7;c.save();c.translate(f.x,f.y);c.rotate(f.rot+k*2);c.globalAlpha=Math.min(1,a*1.6);c.fillStyle=f.col;c.beginPath();for(let i=0;i<8;i++){const rr2=i%2?s2*.28:s2;c.lineTo(Math.cos(i*Math.PI/4)*rr2,Math.sin(i*Math.PI/4)*rr2);}c.closePath();c.fill();c.fillStyle='#fff';c.beginPath();c.arc(0,0,1.6,0,TAU);c.fill();c.restore();return;}
  if(f.t==='crackle'){let s=f.seed;const R2=()=>((s=(s*9301+49297)%233280)/233280-.5);c.save();c.globalAlpha=a/f.max;c.strokeStyle=f.col;c.lineWidth=1.4;for(let k=0;k<3;k++){c.beginPath();let x=f.x,y=f.y;c.moveTo(x,y);for(let j=0;j<3;j++){x+=R2()*14;y+=R2()*14;c.lineTo(x,y);}c.stroke();}c.fillStyle='#fff';c.beginPath();c.arc(f.x,f.y,2.2,0,TAU);c.fill();c.restore();return;}
  if(f.t==='muzzle'){const s2=f.big?9:5;c.save();c.translate(f.x,f.y);c.rotate(f.a);c.globalAlpha=Math.min(1,a*1.4);c.fillStyle=f.laser?'#fecaca':'#fff6c2';c.beginPath();c.moveTo(0,-s2*.45);c.lineTo(s2*1.8,0);c.lineTo(0,s2*.45);c.closePath();c.fill();c.fillStyle=f.laser?'#ef4444':'#ffb020';c.beginPath();c.arc(0,0,s2*.5,0,TAU);c.fill();c.restore();return;}
  if(f.t==='die'){const s=f.u?unitSprite(f.k,0,0):enemySprite(f.k,f.r,0),k=1-a;c.save();c.globalAlpha=a;blit(c,s,f.x,f.y-k*10,f.face*(f.u?VIS_U:VIS_E)*(1+k*.5),(f.u?VIS_U:VIS_E)*(1+k*.5)*(1-k*.35),a>.7?1:0,f.spin*k);c.restore();return;}
  if(f.t==='mghost'){const k=1-a,e2=k*k,s=unitSprite(f.k,0,0);c.save();c.globalAlpha=.9;blit(c,s,f.x0+(f.x1-f.x0)*e2,f.y0+(f.y1-f.y0)*e2-Math.sin(k*Math.PI)*18,f.face*VIS_U*(1-.4*e2),VIS_U*(1-.4*e2),k>.6?1:k*1.5,0);c.restore();return;}
  if(f.t==='ko'){const s=unitSprite(f.k,0,0),k=1-a;c.save();if(k<.4){const q=k/.4,e2=q*q;c.globalAlpha=1;blit(c,s,f.x+f.face*e2*6,f.y+e2*4,f.face*VIS_U,VIS_U,q>.8?1:0,f.face*e2*1.45);}else{const q=(k-.4)/.6;c.globalAlpha=(1-q)*.7;blit(c,s,f.x,f.y-q*40,f.face*VIS_U*(1+q*.3),VIS_U*(1+q*.3),1);}c.restore();return;}
  if(f.t==='ring'){c.globalAlpha=a;c.strokeStyle=f.col;c.lineWidth=Math.max(1,f.w*a);c.beginPath();c.arc(f.x,f.y,Math.max(1,f.r0+(f.r1-f.r0)*(1-a)),0,TAU);c.stroke();}
  else if(f.t==='boom'){const R=f.r*(1-.55*a);c.globalAlpha=a;c.strokeStyle=f.col;c.lineWidth=2;c.beginPath();c.arc(f.x,f.y,R,0,TAU);c.stroke();
    c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=1.5;for(let k=0;k<8;k++){const an=k/8*TAU+f.seed;c.beginPath();c.moveTo(f.x+Math.cos(an)*R*.35,f.y+Math.sin(an)*R*.35);c.lineTo(f.x+Math.cos(an)*R*.75,f.y+Math.sin(an)*R*.75);c.stroke();}
    if(f.sig){c.fillStyle='#b6f84a';c.font='bold 11px Georgia';c.textAlign='center';c.textBaseline='middle';for(let k=0;k<6;k++){const an=k/6*TAU+f.seed+(1-a);c.fillText('♣',f.x+Math.cos(an)*R,f.y+Math.sin(an)*R);}}}
  else if(f.t==='beam'){c.globalAlpha=a;c.strokeStyle=f.col;c.lineWidth=3;c.beginPath();c.moveTo(f.x1,f.y1);c.lineTo(f.x2,f.y2);c.stroke();c.strokeStyle='#fff';c.lineWidth=1.2;c.stroke();}
  else if(f.t==='cone'){c.globalAlpha=a*.9;c.fillStyle=hexA(f.col.length===7?f.col:'#86efac',.16);c.strokeStyle=f.col;c.lineWidth=1.5;c.beginPath();c.moveTo(f.x,f.y);c.arc(f.x,f.y,f.r*(1.1-a*.3),f.a-.55,f.a+.55);c.closePath();c.fill();c.stroke();}
  else if(f.t==='chain'){c.globalAlpha=a;let s=f.seed;const path=()=>{c.beginPath();for(let i=0;i<f.pts.length-1;i++){const [x1,y1]=f.pts[i],[x2,y2]=f.pts[i+1];if(!i)c.moveTo(x1,y1);for(let k=1;k<=5;k++){const u=k/5;s=(s*9301+49297)%233280;const j=k<5?(s/233280-.5)*14:0;c.lineTo(x1+(x2-x1)*u+j,y1+(y2-y1)*u+j);}}};
    c.strokeStyle=f.col;c.lineWidth=3.5;path();c.stroke();s=f.seed;c.strokeStyle='#fff';c.lineWidth=1.3;path();c.stroke();}
  c.globalAlpha=1;
}
function render(){
  ctx.setTransform(DPR*RS,0,0,DPR*RS,0,0);if(!bg)buildBg();
  if(G&&G.shake>0&&!(typeof SET!=='undefined'&&!SET.shake))ctx.translate((rnd()-.5)*G.shake,(rnd()-.5)*G.shake);
  ctx.drawImage(bg,0,0,W,H);if(!G)return;
  const t=performance.now()/1000;
  if(G.mode==='rope'){ctx.fillStyle='rgba(255,255,255,.035)';for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(grid[gi(c,r)]===0&&!NO_BUILD.has(gi(c,r)))ctx.fillRect(c*TILE+1,r*TILE+1,TILE-2,TILE-2);
    ctx.fillStyle='rgba(244,63,94,.10)';for(const k of NO_BUILD){if(grid[k]===0)ctx.fillRect((k%COLS)*TILE+1,((k/COLS)|0)*TILE+1,TILE-2,TILE-2);}}
  if(G.mode==='rope'||G.showRoute)drawRoute(ctx);
  drawRopes(ctx);
  if(G.phase==='wave'||G.spawnQ&&G.spawnQ.length)drawPortal(ctx,t);
  if(typeof drawEggs==='function'&&!VIEWING)drawEggs(ctx,t);
  // fountain shimmer
  {const o=OBST.find(o=>o.k==='fountain');if(o){const cx=(o.c+o.w/2)*TILE,cy=(o.r+o.h/2)*TILE;for(let k=0;k<6;k++){const an=t*1.4+k*TAU/6,rad=10+((t*18+k*7)%22);ctx.fillStyle=`rgba(200,245,255,${.5-rad/50})`;ctx.beginPath();ctx.arc(cx+Math.cos(an)*rad,cy+Math.sin(an)*rad*.8,1.4,0,TAU);ctx.fill();}}}
  for(const z of G.zones)drawZone(ctx,z,t);
  for(const v of G.vortex||[]){const a=Math.min(1,v.t*2,(v.max-v.t)*4);ctx.save();ctx.translate(v.x,v.y);ctx.globalAlpha=a;for(let k=0;k<4;k++){ctx.strokeStyle=k%2?'rgba(147,197,253,.75)':'rgba(30,64,175,.7)';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=24;i++){const q=i/24,an=t*-5+k*Math.PI/2+q*4,rr2=v.r*(1-q*.9);ctx.lineTo(Math.cos(an)*rr2,Math.sin(an)*rr2*.55);}ctx.stroke();}ctx.restore();}
  for(const f of G.fires||[]){const a=Math.min(1,f.t*2);ctx.save();ctx.globalAlpha=a*.85;ctx.globalCompositeOperation='lighter';for(let k=0;k<7;k++){const an=k*.9+f.x,rx=f.x+Math.cos(an)*f.r*.55,ry=f.y+Math.sin(an)*f.r*.35,h=6+4*Math.sin(t*14+k*2);ctx.fillStyle=k%2?'rgba(249,115,22,.6)':'rgba(253,224,71,.55)';ctx.beginPath();ctx.moveTo(rx-5,ry);ctx.quadraticCurveTo(rx,ry-h*2.2,rx+5,ry);ctx.closePath();ctx.fill();}ctx.restore();
    ctx.fillStyle=`rgba(80,20,0,${.25*a})`;ctx.beginPath();ctx.ellipse(f.x,f.y,f.r,f.r*.5,0,0,TAU);ctx.fill();}
  for(const tr of G.traps||[]){const a=Math.min(1,tr.t),pul=.5+.5*Math.sin(t*5+tr.x);ctx.save();ctx.translate(tr.x,tr.y);ctx.globalAlpha=a*(tr.arm>0?.4:1);ctx.strokeStyle=`rgba(74,222,128,${.5+.4*pul})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,tr.r,tr.r*.5,0,0,TAU);ctx.stroke();
    ctx.beginPath();for(let k=0;k<6;k++){const an=k/6*TAU+t*.6;ctx.lineTo(Math.cos(an)*tr.r*.75,Math.sin(an)*tr.r*.38);}ctx.closePath();ctx.stroke();ctx.fillStyle='#bbf7d0';ctx.font='bold 12px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('♣',0,0);ctx.restore();}
  drawCasino(ctx,t);
  for(const w of G.workers)drawWorker(ctx,w,t);
  if(!VIEWING&&typeof hover!=='undefined'&&hover&&!drag&&G.units&&typeof unitAt==='function'){const hu=unitAt(hover.x,hover.y);if(hu&&!(G.sel.length===1&&G.sel[0]===hu)){ctx.strokeStyle='rgba(255,255,255,.22)';ctx.setLineDash([5,5]);ctx.lineWidth=1;ctx.beginPath();ctx.arc(hu.x,hu.y,hu.def.range+hu.r,0,TAU);ctx.stroke();ctx.setLineDash([]);}}
  if(!VIEWING&&G.ko&&G.ko.length){G.ko.slice(0,6).forEach((k,i)=>{const x=DOOR.x-60-i*26,y=DOOR.y-14,s=unitSprite(k.u.k,0,0);ctx.save();ctx.globalAlpha=.55;blit(ctx,s,x,y,.5*VIS_U,.5*VIS_U,0);ctx.restore();
    ctx.strokeStyle='rgba(11,6,18,.8)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,11,0,TAU);ctx.stroke();ctx.strokeStyle='#fbbf24';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(x,y,11,-Math.PI/2,-Math.PI/2+TAU*(1-k.t/k.max));ctx.stroke();
    ctx.font='10px Bungee,Impact,sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff4e0';ctx.strokeStyle='#0b0612';ctx.lineWidth=3;ctx.strokeText(Math.ceil(k.t),x,y+22);ctx.fillText(Math.ceil(k.t),x,y+22);});}
  if(G.sel.length===1){const u=G.sel[0];ctx.strokeStyle='rgba(94,234,212,.28)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(u.x,u.y,u.def.range+u.r,0,TAU);ctx.stroke();}
  const ents=[];for(const e of G.enemies)ents.push(e);for(const u of G.units)ents.push(u);ents.sort((a,b)=>a.y-b.y);
  for(const o of ents){if(o.def&&o.def.look)drawUnit(ctx,o,t);else drawEnemy(ctx,o,t);}
  for(const p of G.proj){if(!(p.delay>0))drawProj(ctx,p,t);}
  for(const p of G.eproj){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t*8);ctx.fillStyle='#0b0612';ctx.fillRect(-3.5,-3.5,7,7);ctx.fillStyle='#22e1ff';ctx.fillRect(-2.4,-2.4,4.8,4.8);ctx.restore();}
  for(const f of G.fx)drawFx(ctx,f,t);
  for(const s of G.snipes){if(!s.e||s.e.dead)continue;const k=s.t/s.T;ctx.strokeStyle=`rgba(255,59,90,${.3+.6*k})`;ctx.lineWidth=1+k;ctx.beginPath();ctx.moveTo(s.u.x,s.u.y-4);ctx.lineTo(s.e.x,s.e.y);ctx.stroke();
    ctx.strokeStyle='#ff3b5a';ctx.lineWidth=1.5;const R2=14-8*k;ctx.beginPath();ctx.arc(s.e.x,s.e.y,R2,0,TAU);ctx.moveTo(s.e.x-R2-4,s.e.y);ctx.lineTo(s.e.x-R2+3,s.e.y);ctx.moveTo(s.e.x+R2-3,s.e.y);ctx.lineTo(s.e.x+R2+4,s.e.y);ctx.stroke();}
  for(const p of G.parts){const a=clamp(p.life/p.max,0,1);ctx.globalAlpha=a;
    if(p.conf){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.col;ctx.font='14px Georgia';ctx.fillText(p.sym,-5,5);ctx.restore();}
    else if(p.chip){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot+=.2);ctx.fillStyle='#0b0612';ctx.beginPath();ctx.ellipse(0,0,3.4,2,0,0,TAU);ctx.fill();ctx.fillStyle=p.col;ctx.beginPath();ctx.ellipse(0,0,2.5,1.3,0,0,TAU);ctx.fill();ctx.restore();}
    else if(p.smoke){ctx.globalAlpha=a*.5;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size*(2-a),0,TAU);ctx.fill();}
    else if(p.flame){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a*.85;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size*(1+(1-a)*1.6),0,TAU);ctx.fill();ctx.restore();}
    else if(p.leaf){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot+=.15);ctx.fillStyle=p.col;ctx.beginPath();ctx.ellipse(0,0,3,1.6,0,0,TAU);ctx.fill();ctx.restore();}
    else{ctx.fillStyle=p.col;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}}
  ctx.globalAlpha=1;
  for(const m of G.marks){const x=m.follow&&!m.follow.dead?m.follow.x:m.x,y=m.follow&&!m.follow.dead?m.follow.y:m.y,k=m.t/.6,d=6+12*k;ctx.fillStyle=m.col;ctx.globalAlpha=Math.min(1,k*1.5);
    for(let i=0;i<4;i++){const an=i*Math.PI/2+Math.PI/4;ctx.save();ctx.translate(x+Math.cos(an)*d,y+Math.sin(an)*d*.6);ctx.rotate(an+Math.PI);ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(-3,-3.5);ctx.lineTo(-3,3.5);ctx.closePath();ctx.fill();ctx.restore();}}
  ctx.globalAlpha=1;ctx.textAlign='center';
  for(const tx of G.texts){ctx.globalAlpha=clamp(tx.life/tx.max*1.6,0,1);ctx.font=`${tx.size+2}px Bungee,Impact,sans-serif`;ctx.lineWidth=3.5;ctx.strokeStyle='#0b0612';ctx.strokeText(tx.txt,tx.x,tx.y);ctx.fillStyle=tx.col;ctx.fillText(tx.txt,tx.x,tx.y);}
  ctx.globalAlpha=1;
  // boss HUD plate
  const boss=G.enemies.find(e=>e.def.boss);
  if(boss){const w=320,x=W/2-w/2,y=10;ctx.fillStyle='rgba(11,6,18,.88)';rr(ctx,x,y,w,34,6);ctx.fill();ctx.strokeStyle='rgba(255,59,90,.7)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.font='13px Bungee,Impact,sans-serif';ctx.fillStyle='#ffd1dc';ctx.textAlign='left';ctx.fillText(boss.name,x+10,y+16);ctx.fillStyle='#2a1020';ctx.fillRect(x+10,y+22,w-20,6);ctx.fillStyle='#ff3b5a';ctx.fillRect(x+10,y+22,(w-20)*clamp(boss.hp/boss.maxHp,0,1),6);}
  if(VIEWING)return;
  if(drag&&drag.box){const x=Math.min(drag.x0,drag.x1),y=Math.min(drag.y0,drag.y1),w=Math.abs(drag.x1-drag.x0),h=Math.abs(drag.y1-drag.y0);ctx.fillStyle='rgba(94,234,212,.07)';ctx.strokeStyle='#5eead4';ctx.lineWidth=1;ctx.fillRect(x,y,w,h);ctx.strokeRect(x+.5,y+.5,w,h);}
  if(G.mode==='rope'&&hover){const c=Math.floor(hover.x/TILE),r=Math.floor(hover.y/TILE);const ok=open(c,r)&&!NO_BUILD.has(gi(c,r));const rem=grid[gi(c,r)]===2;ctx.strokeStyle=rem?'#ffb020':ok?'#5eead4':'#f43f5e';ctx.lineWidth=2;ctx.strokeRect(c*TILE+2,r*TILE+2,TILE-4,TILE-4);}
  if(G.mode&&G.mode.ab&&hover){const A=ABIL[G.mode.ab];ctx.strokeStyle='#c084fc';ctx.lineWidth=2;
    if(A.rad){ctx.fillStyle='rgba(192,132,252,.12)';ctx.beginPath();ctx.arc(hover.x,hover.y,A.rad,0,TAU);ctx.fill();ctx.stroke();}
    else{const e=enemyAt(hover.x,hover.y);const x=e?e.x:hover.x,y=e?e.y:hover.y;ctx.beginPath();ctx.arc(x,y,12,0,TAU);ctx.moveTo(x-17,y);ctx.lineTo(x-7,y);ctx.moveTo(x+7,y);ctx.lineTo(x+17,y);ctx.moveTo(x,y-17);ctx.lineTo(x,y-7);ctx.moveTo(x,y+7);ctx.lineTo(x,y+17);ctx.stroke();}}
  if(G.mode==='amove'&&hover){ctx.strokeStyle='#f43f5e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(hover.x,hover.y,9,0,TAU);ctx.moveTo(hover.x-13,hover.y);ctx.lineTo(hover.x+13,hover.y);ctx.moveTo(hover.x,hover.y-13);ctx.lineTo(hover.x,hover.y+13);ctx.stroke();}
  if(G.paused&&!G.over){ctx.fillStyle='rgba(6,3,10,.5)';ctx.fillRect(0,0,W,H);ctx.font='44px Bungee,Impact,sans-serif';ctx.fillStyle='#fff4e0';ctx.textAlign='center';ctx.fillText('PAUSED',W/2,H/2);}
}
function portrait(canvas,k,size){const c=canvas.getContext('2d');canvas.width=size*2;canvas.height=size*2;c.setTransform(2,0,0,2,0,0);const d=UNITS[k];const r=size*(d.look.b==='wheel'||d.look.b==='drake'||d.look.b==='hound'?.2:.25);
  const id='p'+k+'|'+size;let s=SPR.get(id);if(!s){s=buildSprite(cc=>drawCreature(cc,d.look,r,.3,0),r);SPR.set(id,s);}c.drawImage(s.img,size/2-s.half,size/2-s.half+r*.1,s.S,s.S);}
function enemyPortrait(canvas,k,size){const c=canvas.getContext('2d');canvas.width=size*2;canvas.height=size*2;c.setTransform(2,0,0,2,0,0);const r=Math.min(size*.3,ENEMIES[k].r*1.5);
  const id='pe'+k+'|'+size;let s=SPR.get(id);if(!s){s=buildSprite(cc=>drawEnemyRaw(cc,k,r,ENEMIES[k].col,.3),r,ENEMIES[k].col);SPR.set(id,s);}c.drawImage(s.img,size/2-s.half,size/2-s.half,s.S,s.S);}

/* draw another player's board (a lightweight copy rebuilt from their updates) into any canvas */
function renderView(c2,scale,GV,ropes){
  const sG=G,sctx=ctx,sRS=RS,save=grid.slice();
  try{for(let i=0;i<grid.length;i++)if(grid[i]===2)grid[i]=0;for(const i of ropes)if(grid[i]===0)grid[i]=2;
    G=GV;ctx=c2;RS=scale;VIEWING=true;render();}
  finally{G=sG;ctx=sctx;RS=sRS;VIEWING=false;grid.set(save);}
}
