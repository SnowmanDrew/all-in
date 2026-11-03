'use strict';
/* ============ ALL IN — the four bosses, each with their own look ============
   Same 'boss' enemy underneath (stats, abilities, secret-boss swaps all unchanged);
   which one you see depends on the boss round: 10 Debt Collector, 20 Loan Shark,
   30 Bad Beat, 40 House Edge. */

let BOSS_FORCE=null; // set while drawing a specific one (roster sheets, previews)
function bossVariant(){
  if(BOSS_FORCE!=null)return BOSS_FORCE;
  try{const n=G&&G.waveInfo&&G.waveInfo.name,i=BOSS_NAMES.indexOf(n);if(i>=0)return i;return Math.max(0,Math.min(3,Math.round((G&&G.wave||10)/10)-1));}catch(e){return 0;}}

function bossArt(c,r,col,t,v){
  const w=TAU/SPP,sw=Math.sin(t*w),glow=col;
  const legs=(cl,len,wd,gap)=>{for(const sx of [-1,1]){const s=sx*sw*.18;c.save();c.translate(sx*r*gap,r*.35);c.rotate(s);c.fillStyle=cl;rr(c,-r*wd/2,0,r*wd,r*len,r*.06);c.fill();c.fillStyle='#0b0612';rr(c,-r*wd*.75,r*len-r*.08,r*wd*1.5,r*.14,r*.05);c.fill();c.restore();}};
  if(v===0){ // ---- The Debt Collector: gaunt, trench coat, fedora, a ledger of everything you owe ----
    legs('#1f2430',.78,.18,.24);
    c.fillStyle='#4b5160';c.beginPath();c.moveTo(-r*.5,-r*.42);c.lineTo(r*.5,-r*.42);c.lineTo(r*.78,r*.98);c.lineTo(-r*.78,r*.98);c.closePath();c.fill();
    c.fillStyle='#3a3f4b';c.beginPath();c.moveTo(-r*.08,-r*.4);c.lineTo(r*.08,-r*.4);c.lineTo(r*.14,r*.98);c.lineTo(-r*.14,r*.98);c.closePath();c.fill();
    c.fillStyle='#5f6676';for(const sx of [-1,1]){c.beginPath();c.moveTo(sx*r*.06,-r*.42);c.lineTo(sx*r*.42,-r*.42);c.lineTo(sx*r*.2,r*.15);c.closePath();c.fill();}
    c.fillStyle='#22252e';c.fillRect(-r*.64,r*.32,r*1.28,r*.12);c.fillStyle='#c9a227';c.fillRect(-r*.08,r*.3,r*.16,r*.16);
    // pocket watch on a chain, swinging
    c.strokeStyle='#d4a12a';c.lineWidth=r*.04;c.beginPath();c.moveTo(-r*.24,-r*.05);c.quadraticCurveTo(-r*.3+sw*r*.05,r*.15,-r*.36+sw*r*.08,r*.24);c.stroke();
    c.fillStyle='#e5c76b';c.beginPath();c.arc(-r*.36+sw*r*.08,r*.3,r*.1,0,TAU);c.fill();c.fillStyle='#fff8e1';c.beginPath();c.arc(-r*.36+sw*r*.08,r*.3,r*.07,0,TAU);c.fill();
    c.strokeStyle='#111';c.lineWidth=r*.02;c.beginPath();c.moveTo(-r*.36+sw*r*.08,r*.3);c.lineTo(-r*.36+sw*r*.08+Math.cos(t*2)*r*.05,r*.3+Math.sin(t*2)*r*.05);c.stroke();
    // the ledger under his arm
    c.save();c.translate(r*.62,r*.05);c.rotate(.18+sw*.06);c.fillStyle='#5b2a12';rr(c,-r*.32,-r*.4,r*.64,r*.78,r*.05);c.fill();c.fillStyle='#f3ead4';rr(c,-r*.27,-r*.35,r*.54,r*.68,r*.03);c.fill();
    c.strokeStyle='#b91c1c';c.lineWidth=r*.028;c.lineCap='round';for(let j=0;j<4;j++){const y=-r*.24+j*r*.15,x0=-r*.2;for(let k=0;k<4;k++){c.beginPath();c.moveTo(x0+k*r*.07,y-r*.05);c.lineTo(x0+k*r*.07,y+r*.05);c.stroke();}c.beginPath();c.moveTo(x0-r*.03,y+r*.05);c.lineTo(x0+r*.24,y-r*.05);c.stroke();}c.strokeStyle='rgba(60,40,30,.35)';c.lineWidth=1;for(let j=0;j<5;j++){c.beginPath();c.moveTo(-r*.24,-r*.31+j*r*.15);c.lineTo(r*.24,-r*.31+j*r*.15);c.stroke();}c.fillStyle='#c9a227';c.fillRect(-r*.34,-r*.4,r*.05,r*.78);c.restore();
    c.fillStyle='#4b5160';c.beginPath();c.ellipse(r*.44,-r*.18,r*.13,r*.3,-.4,0,TAU);c.fill();c.fillStyle='#cfc2ad';for(let k=0;k<3;k++){c.beginPath();c.ellipse(r*.36+k*r*.06,r*.16+k*r*.01,r*.035,r*.06,.3,0,TAU);c.fill();}c.fillStyle='#5f6676';for(const sx of [-1,1]){c.beginPath();c.moveTo(sx*r*.12,-r*.42);c.lineTo(sx*r*.42,-r*.48);c.lineTo(sx*r*.36,-r*.72);c.closePath();c.fill();}
    // gaunt face under a fedora, eyes burning
    c.fillStyle='#d9cdb8';c.beginPath();c.moveTo(-r*.27,-r*.86);c.quadraticCurveTo(-r*.3,-r*.5,0,-r*.36);c.quadraticCurveTo(r*.3,-r*.5,r*.27,-r*.86);c.quadraticCurveTo(0,-r*1.08,-r*.27,-r*.86);c.fill();c.fillStyle='rgba(70,50,60,.35)';for(const sx of [-1,1]){c.beginPath();c.ellipse(sx*r*.17,-r*.58,r*.06,r*.1,sx*.3,0,TAU);c.fill();}
    c.fillStyle='#0b0612';for(const sx of [-1,1]){c.beginPath();c.ellipse(sx*r*.13,-r*.74,r*.09,r*.07,0,0,TAU);c.fill();}
    c.fillStyle=glow;for(const sx of [-1,1]){c.beginPath();c.arc(sx*r*.13,-r*.74,r*.045,0,TAU);c.fill();}
    c.strokeStyle='#3b2a1e';c.lineWidth=r*.03;c.beginPath();c.moveTo(-r*.1,-r*.49);c.lineTo(r*.1,-r*.5);c.stroke();c.fillStyle='rgba(60,40,30,.5)';c.beginPath();c.moveTo(0,-r*.7);c.lineTo(-r*.04,-r*.6);c.lineTo(r*.03,-r*.6);c.fill();
    c.fillStyle='#2a2d36';c.beginPath();c.ellipse(0,-r*1.0,r*.62,r*.12,0,0,TAU);c.fill();rr(c,-r*.34,-r*1.42,r*.68,r*.46,r*.12);c.fill();
    c.fillStyle='#14161b';c.fillRect(-r*.34,-r*1.1,r*.68,r*.1);c.fillStyle='#2a2d36';c.beginPath();c.moveTo(-r*.2,-r*1.42);c.lineTo(0,-r*1.32);c.lineTo(r*.2,-r*1.42);c.fill();
    return;}
  if(v===1){ // ---- The Loan Shark: a shark in a pinstripe suit ----
    // tail out of the back of the jacket
    c.save();c.translate(r*.5,r*.45);c.rotate(.15+sw*.25);c.fillStyle='#6b7f99';c.beginPath();c.moveTo(-r*.1,-r*.15);c.quadraticCurveTo(r*.35,-r*.05,r*.55,r*.05);c.lineTo(r*.95,-r*.4);c.quadraticCurveTo(r*.85,r*.1,r*.8,r*.2);c.lineTo(r*.9,r*.5);c.quadraticCurveTo(r*.6,r*.3,r*.45,r*.22);c.quadraticCurveTo(r*.1,r*.2,-r*.1,r*.15);c.closePath();c.fill();c.restore();
    legs('#1e2a44',.5,.24,.24);
    c.fillStyle='#1e2a44';c.beginPath();c.moveTo(-r*.72,-r*.3);c.quadraticCurveTo(0,-r*.6,r*.72,-r*.3);c.lineTo(r*.66,r*.55);c.quadraticCurveTo(0,r*.68,-r*.66,r*.55);c.closePath();c.fill();
    c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=1;for(let k=-4;k<=4;k++){c.beginPath();c.moveTo(k*r*.15,-r*.42);c.lineTo(k*r*.16,r*.6);c.stroke();}
    c.fillStyle='#f8fafc';c.beginPath();c.moveTo(-r*.2,-r*.44);c.lineTo(0,r*.1);c.lineTo(r*.2,-r*.44);c.fill();c.fillStyle='#be123c';c.beginPath();c.moveTo(-r*.07,-r*.3);c.lineTo(0,r*.05);c.lineTo(r*.07,-r*.3);c.fill();
    c.strokeStyle='#e0b040';c.lineWidth=r*.06;c.beginPath();c.arc(0,-r*.42,r*.36,.25,Math.PI-.25);c.stroke();c.fillStyle='#e0b040';c.beginPath();c.arc(0,-r*.02,r*.12,0,TAU);c.fill();c.fillStyle='#7a5a0e';c.font=`900 ${r*.17}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText('$',0,-r*.01);
    // briefcase of cash
    c.save();c.translate(-r*.82,r*.28+sw*r*.04);c.fillStyle='#3b2412';rr(c,-r*.3,-r*.2,r*.6,r*.42,r*.05);c.fill();c.fillStyle='#16a34a';for(let k=0;k<3;k++)c.fillRect(-r*.24+k*r*.16,-r*.3-k*r*.02,r*.12,r*.14);c.fillStyle='#e0b040';c.fillRect(-r*.06,-r*.26,r*.12,r*.06);c.restore();
    // the shark's head: snout forward, fin on top, grin full of teeth
    c.fillStyle='#6b7f99';c.beginPath();c.moveTo(-r*.5,-r*.5);c.quadraticCurveTo(-r*.55,-r*1.25,r*.2,-r*1.22);c.quadraticCurveTo(r*.95,-r*1.12,r*1.02,-r*.72);c.quadraticCurveTo(r*.6,-r*.42,-r*.5,-r*.5);c.fill();
    c.fillStyle='#e7edf5';c.beginPath();c.moveTo(-r*.3,-r*.55);c.quadraticCurveTo(r*.4,-r*.42,r*1.0,-r*.72);c.quadraticCurveTo(r*.5,-r*.62,-r*.3,-r*.66);c.fill();
    c.fillStyle='#4f6078';c.beginPath();c.moveTo(-r*.22,-r*1.18);c.quadraticCurveTo(-r*.05,-r*1.7,r*.18,-r*1.66);c.quadraticCurveTo(r*.05,-r*1.42,r*.16,-r*1.2);c.fill();
    c.fillStyle='#fff';for(let k=0;k<7;k++){const x=-r*.1+k*r*.15;c.beginPath();c.moveTo(x,-r*.66+k*r*.004);c.lineTo(x+r*.065,-r*.55+k*r*.01);c.lineTo(x+r*.13,-r*.66+k*r*.006);c.fill();}
    c.strokeStyle='#2a3646';c.lineWidth=r*.035;c.beginPath();c.moveTo(-r*.15,-r*.67);c.quadraticCurveTo(r*.45,-r*.6,r*.98,-r*.73);c.stroke();
    for(let k=0;k<3;k++){c.strokeStyle='#4f6078';c.lineWidth=r*.03;c.beginPath();c.moveTo(-r*.3+k*r*.09,-r*.96);c.lineTo(-r*.34+k*r*.09,-r*.78);c.stroke();}
    c.fillStyle='#0b0612';rr(c,r*.08,-r*1.02,r*.56,r*.16,r*.07);c.fill();c.fillStyle='#e0b040';c.fillRect(r*.08,-r*1.0,r*.56,r*.025);c.fillStyle='rgba(120,200,255,.45)';c.fillRect(r*.14,-r*.98,r*.2,r*.05);
    c.save();c.translate(r*.86,-r*.6);c.rotate(.25);c.fillStyle='#78350f';c.fillRect(0,-r*.045,r*.38,r*.09);c.fillStyle='#f97316';c.fillRect(r*.36,-r*.045,r*.05,r*.09);c.fillStyle='rgba(200,190,210,.5)';c.beginPath();c.arc(r*.46+Math.sin(t*3)*r*.03,-r*.14,r*.07,0,TAU);c.fill();c.restore();
    return;}
  if(v===2){ // ---- The Bad Beat: a golem made of the worst hand in poker ----
    const card=(x,y,rot,w2,h2,rank,suit,red)=>{c.save();c.translate(x,y);c.rotate(rot);c.fillStyle='#0b0612';rr(c,-w2/2-1.2,-h2/2-1.2,w2+2.4,h2+2.4,r*.06);c.fill();c.fillStyle='#fbf6ea';rr(c,-w2/2,-h2/2,w2,h2,r*.05);c.fill();
      c.fillStyle=red?'#c3122f':'#1a1c2b';c.font=`800 ${h2*.22}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText(rank,-w2*.28,-h2*.32);
      c.save();c.translate(0,h2*.04);const k=w2*.4/100;c.translate(-50*k,-50*k);c.scale(k,k);c.fill(new Path2D(SUIT_PATH[suit]));c.restore();c.restore();};
    // chip-stack legs
    for(const sx of [-1,1]){const s=sx*sw*.12;c.save();c.translate(sx*r*.3,r*.45);c.rotate(s);for(let k=0;k<4;k++){const cl=k%2?'#f8f5ec':'#be123c';c.fillStyle=shade(cl,-.35);c.beginPath();c.ellipse(0,r*.5-k*r*.14+r*.04,r*.2,r*.08,0,0,TAU);c.fill();c.fillStyle=cl;c.beginPath();c.ellipse(0,r*.5-k*r*.14,r*.2,r*.08,0,0,TAU);c.fill();}c.restore();}
    // fanned card arms
    for(const sx of [-1,1])for(let k=0;k<3;k++){const a=sx*(.7+k*.32)+sx*sw*.12;card(sx*(r*.62+k*r*.14),-r*.15+k*r*.14,a,r*.34,r*.48,['9','4','J'][k],['H','S','D'][k],k!==1);}
    // the body: seven of clubs, the head: two of diamonds, cracked down the middle
    card(0,r*.05,-.06+sw*.04,r*.92,r*1.12,'7','C',false);
    c.save();c.translate(0,-r*.9);c.rotate(.08-sw*.05);card(0,0,0,r*.74,r*.88,'2','D',true);
    c.strokeStyle='#0b0612';c.lineWidth=r*.04;c.beginPath();c.moveTo(r*.05,-r*.44);c.lineTo(-r*.04,-r*.2);c.lineTo(r*.06,-r*.02);c.lineTo(-r*.05,r*.2);c.lineTo(r*.03,r*.44);c.stroke();
    for(const sx of [-1,1]){c.fillStyle='#0b0612';c.beginPath();c.moveTo(sx*r*.08,-r*.12);c.lineTo(sx*r*.28,-r*.2);c.lineTo(sx*r*.24,-r*.04);c.closePath();c.fill();c.fillStyle=hexA(glow,.35);c.beginPath();c.arc(sx*r*.18,-r*.11,r*.1,0,TAU);c.fill();c.fillStyle='#fde68a';c.beginPath();c.arc(sx*r*.18,-r*.11,r*.045,0,TAU);c.fill();}
    c.fillStyle='#0b0612';c.beginPath();c.moveTo(-r*.22,r*.2);for(let k=0;k<=6;k++)c.lineTo(-r*.22+k*r*.073,r*.2+(k%2?r*.08:0));c.lineTo(r*.22,r*.3);c.lineTo(-r*.22,r*.3);c.closePath();c.fill();c.restore();
    // shattered chips at its feet
    for(let k=0;k<4;k++){const a=t*1.2+k*TAU/4,x=Math.cos(a)*r*.95,y=r*1.05+Math.sin(a)*r*.12;c.fillStyle=k%2?'#be123c':'#22d3ee';c.beginPath();c.moveTo(x,y-r*.07);c.lineTo(x+r*.08,y);c.lineTo(x-r*.02,y+r*.06);c.closePath();c.fill();}
    return;}
  // ---- The House Edge: a four-armed croupier god with a roulette wheel for a halo ----
  c.save();c.translate(0,-r*.95);c.rotate(t*.6);c.fillStyle='#3b2412';c.beginPath();c.arc(0,0,r*.95,0,TAU);c.fill();
  for(let k=0;k<18;k++){c.fillStyle=k===0?'#16a34a':k%2?'#c3122f':'#111';c.beginPath();c.moveTo(0,0);c.arc(0,0,r*.88,k*TAU/18,(k+1)*TAU/18);c.closePath();c.fill();}
  c.fillStyle='#3b2412';c.beginPath();c.arc(0,0,r*.55,0,TAU);c.fill();c.strokeStyle='#e0b040';c.lineWidth=r*.07;c.beginPath();c.arc(0,0,r*.92,0,TAU);c.stroke();c.lineWidth=r*.04;c.beginPath();c.arc(0,0,r*.55,0,TAU);c.stroke();
  for(let k=0;k<4;k++){c.save();c.rotate(k*Math.PI/2);c.fillStyle='#e0b040';c.fillRect(-r*.03,-r*.55,r*.06,r*.3);c.restore();}c.restore();
  // robe flaring to the floor, green felt with gold trim
  c.fillStyle='#14532d';c.beginPath();c.moveTo(-r*.42,-r*.42);c.lineTo(r*.42,-r*.42);c.quadraticCurveTo(r*.7,r*.4,r*.95,r*1.1);c.lineTo(-r*.95,r*1.1);c.quadraticCurveTo(-r*.7,r*.4,-r*.42,-r*.42);c.fill();
  c.strokeStyle='#e0b040';c.lineWidth=r*.06;c.beginPath();c.moveTo(-r*.95,r*1.08);c.lineTo(r*.95,r*1.08);c.stroke();c.lineWidth=r*.04;c.beginPath();c.moveTo(0,-r*.3);c.lineTo(0,r*1.06);c.stroke();
  c.fillStyle='#111827';c.beginPath();c.moveTo(-r*.42,-r*.44);c.lineTo(r*.42,-r*.44);c.lineTo(r*.3,r*.2);c.lineTo(-r*.3,r*.2);c.closePath();c.fill();
  c.fillStyle='#f8fafc';c.beginPath();c.moveTo(-r*.14,-r*.44);c.lineTo(0,r*.1);c.lineTo(r*.14,-r*.44);c.fill();c.fillStyle='#e0b040';c.beginPath();c.moveTo(-r*.16,-r*.4);c.lineTo(0,-r*.32);c.lineTo(r*.16,-r*.4);c.lineTo(r*.16,-r*.24);c.lineTo(0,-r*.32);c.lineTo(-r*.16,-r*.24);c.closePath();c.fill();
  // four arms
  const arm=(sx,sy,ang,len)=>{c.save();c.translate(sx,sy);c.rotate(ang);c.strokeStyle='#111827';c.lineWidth=r*.17;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(len,0);c.stroke();c.strokeStyle='#e0b040';c.lineWidth=r*.05;c.beginPath();c.moveTo(len*.7,0);c.lineTo(len*.78,0);c.stroke();
    c.fillStyle='#f1d9b0';c.beginPath();c.arc(len,0,r*.09,0,TAU);c.fill();c.restore();return [sx+Math.cos(ang)*len,sy+Math.sin(ang)*len];};
  const ul=arm(-r*.38,-r*.32,-2.5+sw*.12,r*.62),ur=arm(r*.38,-r*.32,-.64-sw*.12,r*.62),ll=arm(-r*.32,-r*.05,2.6-sw*.1,r*.6),lr=arm(r*.32,-r*.05,.5+sw*.1,r*.62);
  // dice, a card, a rake and a chip stack
  c.save();c.translate(ul[0],ul[1]-r*.1);c.rotate(t*2);c.fillStyle='#f8f5ec';rr(c,-r*.12,-r*.12,r*.24,r*.24,r*.05);c.fill();c.fillStyle='#c3122f';for(const [dx,dy] of [[-.05,-.05],[.05,.05],[0,0]]){c.beginPath();c.arc(dx*r,dy*r,r*.025,0,TAU);c.fill();}c.restore();
  c.save();c.translate(ur[0],ur[1]-r*.12);c.rotate(.3);c.fillStyle='#fbf6ea';rr(c,-r*.11,-r*.16,r*.22,r*.3,r*.03);c.fill();c.fillStyle='#1a1c2b';c.save();c.translate(-r*.065,-r*.06);c.scale(r*.0013,r*.0013);c.fill(new Path2D(SUIT_PATH.S));c.restore();c.restore();
  c.save();c.translate(ll[0],ll[1]);c.strokeStyle='#7c4a1e';c.lineWidth=r*.05;c.beginPath();c.moveTo(r*.2,-r*.3);c.lineTo(-r*.3,r*.45);c.stroke();c.strokeStyle='#e0b040';c.lineWidth=r*.07;c.beginPath();c.moveTo(-r*.46,r*.36);c.lineTo(-r*.14,r*.56);c.stroke();c.restore();
  c.save();c.translate(lr[0],lr[1]);for(let k=0;k<4;k++){const cl=['#e0b040','#111','#c3122f','#e0b040'][k];c.fillStyle=shade(cl,-.35);c.beginPath();c.ellipse(0,-k*r*.07+r*.03,r*.14,r*.06,0,0,TAU);c.fill();c.fillStyle=cl;c.beginPath();c.ellipse(0,-k*r*.07,r*.14,r*.06,0,0,TAU);c.fill();}c.restore();
  // golden mask with burning eyes, and a visor crown
  c.fillStyle='#e0b040';c.beginPath();c.ellipse(0,-r*.82,r*.3,r*.36,0,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(-r*.1,-r*.95,r*.08,r*.14,-.3,0,TAU);c.fill();
  c.fillStyle='#0b0612';for(const sx of [-1,1]){c.beginPath();c.moveTo(sx*r*.04,-r*.86);c.lineTo(sx*r*.22,-r*.92);c.lineTo(sx*r*.2,-r*.78);c.closePath();c.fill();}
  c.fillStyle=glow;for(const sx of [-1,1]){c.beginPath();c.arc(sx*r*.14,-r*.85,r*.04,0,TAU);c.fill();}
  c.strokeStyle='#8a6212';c.lineWidth=r*.035;c.beginPath();c.moveTo(-r*.1,-r*.62);c.quadraticCurveTo(0,-r*.58,r*.1,-r*.62);c.stroke();
  c.fillStyle='#14532d';c.beginPath();c.moveTo(-r*.34,-r*1.08);c.quadraticCurveTo(0,-r*1.36,r*.34,-r*1.08);c.lineTo(r*.3,-r*1.0);c.quadraticCurveTo(0,-r*1.2,-r*.3,-r*1.0);c.closePath();c.fill();
  c.strokeStyle='#e0b040';c.lineWidth=r*.035;c.stroke();
}
