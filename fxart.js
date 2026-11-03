'use strict';
/* ============ ALL IN — projectiles and impacts ============
   Every shot gets a trail and a little glow so it reads in motion, and every hit gets an impact. */

const SHOT_COL={card:'#fbf6e8',laser:'#ff4d6d',slug:'#ffd27a',die:'#f8f5ec',bdie:'#ef4444',coin:'#f5c542',fire:'#fb923c',shard:'#ef4444'};
function glowDot(c,x,y,r,col,a){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,hexA(col,a));g.addColorStop(1,hexA(col,0));c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}

drawProj=function(c,p,t){
  // lobbed shells: missiles, dice, ink and cannonballs
  if(p.shell){const k=Math.min(1,p.el/p.T),py=p.y-p.h;
    c.fillStyle=`rgba(0,0,0,${.18+.25*(1-p.h/80)})`;c.beginPath();c.ellipse(p.x,p.y,4+3*(1-p.h/80),2+1.4*(1-p.h/80),0,0,TAU);c.fill();
    if(p.missile){const a=Math.atan2((p.ty-p.sy)-Math.cos(k*Math.PI)*80*Math.PI,(p.tx-p.sx));
      for(let i=1;i<=5;i++){const bx=p.x-Math.cos(a)*i*6,by=py-Math.sin(a)*i*6+i*.8;c.fillStyle=`rgba(190,180,200,${.32-i*.05})`;c.beginPath();c.arc(bx,by,2+i*.9,0,TAU);c.fill();}
      c.save();c.globalCompositeOperation='lighter';glowDot(c,p.x-Math.cos(a)*7,py-Math.sin(a)*7,7,'#ffb020',.8);c.restore();
      c.save();c.translate(p.x,py);c.rotate(a);c.fillStyle=INK;c.fillRect(-7,-3,14,6);c.fillStyle='#e5e7eb';c.fillRect(-6,-2,11,4);c.fillStyle='#dc2626';c.beginPath();c.moveTo(5,-2);c.lineTo(8.5,0);c.lineTo(5,2);c.fill();
      c.fillStyle='#9ca3af';c.beginPath();c.moveTo(-6,-2);c.lineTo(-8,-4.5);c.lineTo(-4,-2);c.moveTo(-6,2);c.lineTo(-8,4.5);c.lineTo(-4,2);c.fill();c.restore();return;}
    if(p.die){c.save();c.translate(p.x,py);c.rotate(t*12+p.sx);c.fillStyle=INK;rr(c,-5.5,-5.5,11,11,2.4);c.fill();c.fillStyle='#f8f5ec';rr(c,-4.5,-4.5,9,9,2);c.fill();
      c.fillStyle='#b91c1c';for(const [dx,dy] of [[-2,-2],[2,2],[0,0]]){c.beginPath();c.arc(dx,dy,.9,0,TAU);c.fill();}c.restore();return;}
    if(p.ink){c.fillStyle='rgba(91,33,182,.35)';for(let i=1;i<=3;i++){c.beginPath();c.arc(p.x-(p.tx-p.sx)*.01*i,py+2+i*2,3-i*.5,0,TAU);c.fill();}
      c.fillStyle=INK;c.beginPath();c.arc(p.x,py,6.4,0,TAU);c.fill();c.fillStyle='#4c1d95';c.beginPath();c.arc(p.x,py,5.2,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.arc(p.x-1.6,py-1.8,1.6,0,TAU);c.fill();return;}
    c.fillStyle=INK;c.beginPath();c.arc(p.x,py,6.2,0,TAU);c.fill();c.fillStyle='#3a3346';c.beginPath();c.arc(p.x,py,4.8,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.arc(p.x-1.5,py-1.5,1.6,0,TAU);c.fill();
    c.save();c.globalCompositeOperation='lighter';glowDot(c,p.x+3,py-5,5,p.col||'#ffb020',.9);c.restore();return;}
  const a=Math.atan2(p.ty-p.y,p.tx-p.x),col=SHOT_COL[p.st]||p.col||'#fff',ca=Math.cos(a),sa=Math.sin(a);
  // trail
  c.save();c.globalCompositeOperation='lighter';
  if(p.st==='laser'){c.strokeStyle=hexA(col,.35);c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(p.x-ca*16,p.y-sa*16);c.lineTo(p.x+ca*5,p.y+sa*5);c.stroke();}
  else if(p.st==='slug'){const g=c.createLinearGradient(p.x-ca*22,p.y-sa*22,p.x,p.y);g.addColorStop(0,'rgba(255,210,120,0)');g.addColorStop(1,'rgba(255,225,160,.7)');c.strokeStyle=g;c.lineWidth=2.2;c.beginPath();c.moveTo(p.x-ca*22,p.y-sa*22);c.lineTo(p.x,p.y);c.stroke();}
  else if(p.st==='fire'){for(let i=1;i<=4;i++){const j=Math.sin(t*40+i*2+p.sx)*1.6;glowDot(c,p.x-ca*i*4.5-sa*j,p.y-sa*i*4.5+ca*j,6-i,i%2?'#ef4444':'#f97316',.55-i*.1);}}
  else{for(let i=1;i<=3;i++)glowDot(c,p.x-ca*i*5,p.y-sa*i*5,5-i,col,.28-i*.07);}
  c.restore();
  c.save();c.translate(p.x,p.y);
  switch(p.st){
    case 'die':case 'bdie':{c.rotate(t*14+p.sx);const w=p.st==='die';c.fillStyle=INK;rr(c,-4.4,-4.4,8.8,8.8,2);c.fill();c.fillStyle=w?'#f8f5ec':'#1d1d1f';rr(c,-3.5,-3.5,7,7,1.6);c.fill();
      c.fillStyle=w?'#111':'#ef4444';for(const [dx,dy] of [[-1.6,-1.6],[1.6,1.6],[0,0]]){c.beginPath();c.arc(dx,dy,.75,0,TAU);c.fill();}break;}
    case 'shard':c.rotate(a);c.fillStyle=INK;c.beginPath();c.moveTo(7,0);c.lineTo(0,-3.4);c.lineTo(-7,0);c.lineTo(0,3.4);c.fill();c.fillStyle='#ef4444';c.beginPath();c.moveTo(5.4,0);c.lineTo(0,-2);c.lineTo(-5.4,0);c.lineTo(0,2);c.fill();c.fillStyle='rgba(255,255,255,.6)';c.fillRect(-1,-.6,3,1.2);break;
    case 'coin':{const sx=Math.sin(t*16+p.sx);c.scale(Math.max(.18,Math.abs(sx)),1);c.fillStyle=INK;c.beginPath();c.arc(0,0,5,0,TAU);c.fill();c.fillStyle=sx>0?'#f5c542':'#d4a12a';c.beginPath();c.arc(0,0,4,0,TAU);c.fill();
      c.strokeStyle='#8a6212';c.lineWidth=.8;c.beginPath();c.arc(0,0,2.6,0,TAU);c.stroke();if(sx>.8){c.fillStyle='#fff';c.fillRect(-2.2,-2.4,1.4,1.4);}break;}
    case 'fire':{c.globalCompositeOperation='lighter';glowDot(c,0,0,8,'#f97316',.85);c.fillStyle='#fde047';c.beginPath();c.arc(0,0,3.4,0,TAU);c.fill();c.fillStyle='#fff7d6';c.beginPath();c.arc(0,0,1.6,0,TAU);c.fill();break;}
    case 'card':{c.rotate(t*10+p.sx);c.fillStyle=INK;rr(c,-4.4,-6,8.8,12,1.6);c.fill();c.fillStyle='#fbf6e8';rr(c,-3.6,-5.2,7.2,10.4,1.2);c.fill();
      const n=p.col&&p.col[0]==='#'?parseInt(p.col.slice(1,7),16):0,s=((n>>16)&255)>((n>>8)&255)+60?'H':'S';c.save();c.translate(-1.8,-1.9);c.scale(.036,.036);c.fillStyle=p.col||'#c8102e';c.fill(new Path2D(SUIT_PATH[s]));c.restore();break;}
    case 'laser':c.rotate(a);c.strokeStyle=col;c.lineWidth=3.4;c.lineCap='round';c.beginPath();c.moveTo(-11,0);c.lineTo(6,0);c.stroke();c.strokeStyle='#fff';c.lineWidth=1.3;c.stroke();
      c.globalCompositeOperation='lighter';glowDot(c,6,0,6,col,.7);break;
    case 'slug':c.rotate(a);c.fillStyle=INK;c.beginPath();c.ellipse(0,0,5,2.9,0,0,TAU);c.fill();c.fillStyle='#e0b24a';c.beginPath();c.ellipse(.4,0,4,2,0,0,TAU);c.fill();c.fillStyle='#fff3c4';c.fillRect(1.4,-.8,2,1);break;
    default:{const cl=p.col||'#fde68a';c.globalCompositeOperation='lighter';glowDot(c,0,0,9,cl,.75);c.globalCompositeOperation='source-over';c.fillStyle=INK;c.beginPath();c.arc(0,0,4,0,TAU);c.fill();
      c.fillStyle='#fff';c.beginPath();c.arc(0,0,3,0,TAU);c.fill();c.fillStyle=hexA(cl,.85);c.beginPath();c.arc(0,0,2.2,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(-.8,-.9,.9,0,TAU);c.fill();
      const sp=(t*9+p.sx)%1;c.fillStyle=hexA('#ffffff',.8*(1-sp));c.beginPath();c.arc(-ca*(6+sp*8)+Math.sin(p.sx)*2,-sa*(6+sp*8),1.1,0,TAU);c.fill();}
  }
  c.restore();
};

/* the moment a shot lands */
function impactFx(p){if(!G||!G.fx||G.fx.length>260)return;const col=SHOT_COL[p.st]||p.col||'#fff1c2';
  G.fx.push({t:'impact',x:p.tx,y:p.ty-2,col,big:!!p.aoe,a:Math.atan2(p.ty-p.y,p.tx-p.x)+Math.PI,life:.24,max:.24,seed:Math.random()*6});}
{const base=drawFx;drawFx=function(c,f,t){
  if(f.t!=='impact')return base(c,f,t);
  const k=1-f.life/f.max,R=(f.big?18:9)*(.35+k*.9);c.save();c.globalCompositeOperation='lighter';c.globalAlpha=1-k;
  glowDot(c,f.x,f.y,R*1.6,f.col,.9);c.strokeStyle=hexA(f.col,.9);c.lineWidth=1.6;c.beginPath();c.arc(f.x,f.y,R,0,TAU);c.stroke();
  c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=1.3;c.lineCap='round';for(let i=0;i<4;i++){const an=f.a+(i-1.5)*.55+Math.sin(f.seed+i)*.25,r0=R*.5,r1=R*(1.2+.4*((i*7)%3)/2);
    c.beginPath();c.moveTo(f.x+Math.cos(an)*r0,f.y+Math.sin(an)*r0);c.lineTo(f.x+Math.cos(an)*r1,f.y+Math.sin(an)*r1);c.stroke();}
  c.restore();c.globalAlpha=1;};}
