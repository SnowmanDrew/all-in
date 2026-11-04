'use strict';
/* ============ ALL IN — redrawn creatures ============
   New bodies for creatures whose look undersold them, plus look tweaks for a few people. Each draws facing right,
   centred on the origin, feet near y = +r, in the same flat-shaded style; the sprite builder adds the outline. */

const BEAST={};
{const _dc=drawCreature;drawCreature=function(c,look,r,t,atk){const f=BEAST[look.b];if(f){CUR_FACE=look.face||'beady';c.save();f(c,r,look,t,atk||0);c.restore();return;}return _dc(c,look,r,t,atk);};}
const TW=TAU/SPP;

/* Whirlpool Leviathan: a coiled sea serpent rising out of its own whirlpool */
BEAST.leviathan=(c,s,L,t,atk)=>{const w=TW,c1=L.c1,c2=L.c2,dk=shade(c1,-.35),lt=shade(c1,.3);
  // the whirlpool
  c.save();c.translate(0,s*.72);for(let k=0;k<4;k++){const R=s*(1.55-k*.32);c.fillStyle=['#1e3a8a','#1d4ed8','#3b82f6','#93c5fd'][k];c.beginPath();c.ellipse(0,0,R,R*.32,0,0,TAU);c.fill();}
  c.strokeStyle='rgba(224,242,254,.85)';c.lineWidth=1.4;c.lineCap='round';for(let k=0;k<5;k++){const a0=t*w*1.5+k*TAU/5;c.beginPath();for(let i=0;i<=10;i++){const a=a0+i*.32,R=s*(1.4-i*.11);const x=Math.cos(a)*R,y=Math.sin(a)*R*.32;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}c.restore();
  // coils: humps breaking the surface, back to front
  const hump=(x,y,R,th)=>{c.lineCap='round';c.strokeStyle=dk;c.lineWidth=th+2;c.beginPath();c.arc(x,y,R,Math.PI*1.02,TAU*.99);c.stroke();c.strokeStyle=c1;c.lineWidth=th;c.stroke();
    c.strokeStyle=c2;c.lineWidth=th*.32;c.beginPath();c.arc(x,y+th*.2,R-th*.15,Math.PI*1.12,TAU*.9);c.stroke();
    c.fillStyle=lt;for(let k=1;k<4;k++){const a=Math.PI+k*Math.PI/4;c.beginPath();c.moveTo(x+Math.cos(a)*(R+th*.4),y+Math.sin(a)*(R+th*.4));c.lineTo(x+Math.cos(a-.12)*(R+th*1.1),y+Math.sin(a-.12)*(R+th*1.1));c.lineTo(x+Math.cos(a+.16)*(R+th*.4),y+Math.sin(a+.16)*(R+th*.4));c.fill();}};
  const bob=Math.sin(t*w)*s*.05;hump(-s*1.05,s*.7+bob,s*.38,s*.34);hump(-s*.2,s*.72-bob,s*.42,s*.38);
  // the neck rearing up out of the water
  c.lineCap='round';c.strokeStyle=dk;c.lineWidth=s*.56;c.beginPath();c.moveTo(s*.5,s*.75);c.quadraticCurveTo(s*.95,s*.05,s*.55,-s*.6+bob);c.stroke();c.strokeStyle=c1;c.lineWidth=s*.48;c.stroke();
  c.strokeStyle=c2;c.lineWidth=s*.18;c.beginPath();c.moveTo(s*.62,s*.75);c.quadraticCurveTo(s*1.05,s*.1,s*.7,-s*.5+bob);c.stroke();
  // fin crest down the neck
  c.fillStyle=lt;for(let k=0;k<4;k++){const q=k/4,x=s*(.38+.22*Math.sin(q*2.2)),y=-s*.55+q*s*1.1+bob;c.beginPath();c.moveTo(x,y);c.lineTo(x-s*.32,y-s*.08);c.lineTo(x,y+s*.2);c.fill();}
  // head: a heavy sea-dragon skull with an open jaw
  const hx=s*.75,hy=-s*.85+bob,op=.12+atk*.35;c.save();c.translate(hx,hy);
  c.fillStyle=dk;c.beginPath();c.moveTo(-s*.25,s*.1);c.lineTo(s*.75,s*.18+op*s);c.lineTo(s*.7,s*.3+op*s);c.lineTo(-s*.15,s*.32);c.closePath();c.fill();
  c.fillStyle=c1;c.beginPath();c.moveTo(-s*.4,-s*.05);c.quadraticCurveTo(-s*.2,-s*.45,s*.25,-s*.4);c.quadraticCurveTo(s*.75,-s*.3,s*.85,-s*.02);c.lineTo(s*.8,s*.14);c.lineTo(-s*.2,s*.2);c.closePath();c.fill();
  c.fillStyle='#fff';for(let k=0;k<4;k++){c.beginPath();c.moveTo(s*(.2+k*.15),s*.12);c.lineTo(s*(.25+k*.15),s*.24);c.lineTo(s*(.3+k*.15),s*.12);c.fill();}
  c.fillStyle=c2;c.beginPath();c.moveTo(-s*.3,-s*.25);c.lineTo(-s*.75,-s*.55);c.lineTo(-s*.15,-s*.38);c.fill();c.beginPath();c.moveTo(-s*.1,-s*.38);c.lineTo(-s*.4,-s*.78);c.lineTo(s*.08,-s*.42);c.fill();
  eye(c,s*.3,-s*.18,s*.14);c.fillStyle='#22d3ee';c.beginPath();c.arc(s*.78,-s*.08,s*.04,0,TAU);c.fill();
  if(L.crown)crown(c,s*.05,-s*.38,s*.24,'#fbbf24');c.restore();
  // spray
  c.fillStyle='rgba(224,242,254,.8)';for(let k=0;k<5;k++){const a=t*w*2+k*1.3,R=s*(1.2+.25*Math.sin(a*1.7));c.beginPath();c.arc(Math.cos(k*1.25)*R,s*.62-Math.abs(Math.sin(a))*s*.25,s*.05,0,TAU);c.fill();}};

/* The House: the royal card seated on a throne that is a walking vault */
BEAST.vaultthrone=(c,s,L,t,atk)=>{const w=TW,st=Math.sin(t*w*2),gold='#fbbf24',dg='#b45309',steel='#475569';
  // legs
  for(const [x,ph] of [[-s*.55,st],[s*.45,-st]]){c.fillStyle='#1e293b';c.fillRect(x-s*.17,s*.3,s*.34,s*.45+ph*s*.04);c.fillStyle=steel;c.fillRect(x-s*.24,s*.72+ph*s*.04,s*.5,s*.2);c.fillStyle=gold;c.fillRect(x-s*.17,s*.42,s*.34,s*.06);}
  // vault body
  c.fillStyle='#0f172a';c.fillRect(-s*1.05,-s*.45,s*2.1,s*.95);c.fillStyle='#64748b';c.fillRect(-s,-s*.4,s*2,s*.85);c.fillStyle='#94a3b8';c.fillRect(-s,-s*.4,s*2,s*.12);
  c.strokeStyle=gold;c.lineWidth=2;c.strokeRect(-s*.95,-s*.35,s*1.9,s*.75);c.fillStyle=gold;for(const x of [-.9,.9])for(const y of [-.3,.35]){c.beginPath();c.arc(x*s,y*s,s*.05,0,TAU);c.fill();}
  // dial and handle
  c.save();c.translate(s*.35,s*.02);c.fillStyle='#1e293b';c.beginPath();c.arc(0,0,s*.27,0,TAU);c.fill();c.fillStyle=gold;c.beginPath();c.arc(0,0,s*.22,0,TAU);c.fill();c.fillStyle=dg;c.beginPath();c.arc(0,0,s*.13,0,TAU);c.fill();
  c.rotate(t*w*.5);c.strokeStyle='#1e293b';c.lineWidth=1.2;for(let k=0;k<8;k++){c.rotate(TAU/8);c.beginPath();c.moveTo(0,-s*.22);c.lineTo(0,-s*.16);c.stroke();}c.restore();
  c.strokeStyle='#cbd5e1';c.lineWidth=s*.07;c.lineCap='round';c.beginPath();c.moveTo(-s*.45,-s*.05);c.lineTo(-s*.2,-s*.05);c.moveTo(-s*.45,-s*.05);c.lineTo(-s*.45,s*.18);c.stroke();
  // throne back with a casino roofline and marquee bulbs
  c.fillStyle='#7f1d1d';c.beginPath();c.moveTo(-s*.85,-s*.42);c.lineTo(-s*.85,-s*1.45);c.lineTo(-s*.55,-s*1.45);c.lineTo(-s*.55,-s*1.75);c.lineTo(-s*.2,-s*1.75);c.lineTo(0,-s*2.05);c.lineTo(s*.2,-s*1.75);c.lineTo(s*.55,-s*1.75);c.lineTo(s*.55,-s*1.45);c.lineTo(s*.85,-s*1.45);c.lineTo(s*.85,-s*.42);c.closePath();c.fill();
  c.strokeStyle=gold;c.lineWidth=2;c.stroke();
  for(let k=0;k<9;k++){const x=-s*.75+k*s*.19,on=(Math.floor(t*w*2)+k)%3===0;c.fillStyle=on?'#fff7d6':'#fbbf24';c.beginPath();c.arc(x,-s*1.38,s*.045,0,TAU);c.fill();}
  // the king: a playing card sitting on the throne
  c.save();c.translate(0,-s*1.0);c.fillStyle='#fbf6e8';c.beginPath();c.roundRect?c.roundRect(-s*.38,-s*.32,s*.76,s*.86,s*.08):c.rect(-s*.38,-s*.32,s*.76,s*.86);c.fill();c.strokeStyle='#b91c1c';c.lineWidth=1;c.stroke();
  c.fillStyle='#b91c1c';c.font=`700 ${s*.22}px Barlow,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('K',-s*.25,-s*.18);
  c.fillStyle='#e8c9a4';c.beginPath();c.arc(0,-s*.02,s*.2,0,TAU);c.fill();eye(c,-s*.07,-s*.05,s*.06);eye(c,s*.08,-s*.05,s*.06);c.fillStyle='#f5f5f4';c.beginPath();c.moveTo(-s*.16,s*.06);c.quadraticCurveTo(0,s*.32,s*.16,s*.06);c.fill();
  c.fillStyle='#1d4ed8';c.fillRect(-s*.3,s*.22,s*.6,s*.26);c.fillStyle=gold;c.fillRect(-s*.3,s*.22,s*.6,s*.05);
  crown(c,0,-s*.2,s*.3,gold);c.fillStyle='#e11d48';c.beginPath();c.arc(0,-s*.38,s*.05,0,TAU);c.fill();
  // sceptre raised when attacking
  c.save();c.translate(s*.32,s*.15);c.rotate(-.4-atk*.6);c.strokeStyle=gold;c.lineWidth=s*.06;c.beginPath();c.moveTo(0,0);c.lineTo(0,-s*.55);c.stroke();c.fillStyle='#fde047';c.beginPath();c.arc(0,-s*.6,s*.09,0,TAU);c.fill();c.restore();c.restore();
  // shield arm and missile pod
  c.fillStyle='#334155';c.beginPath();c.ellipse(-s*1.15,-s*.05,s*.22,s*.42,0,0,TAU);c.fill();c.fillStyle=gold;c.beginPath();c.ellipse(-s*1.15,-s*.05,s*.15,s*.34,0,0,TAU);c.fill();c.fillStyle='#7f1d1d';signShape(c,'spade',-s*1.15,-s*.05,s*.12)();c.fill();
  c.fillStyle='#334155';c.fillRect(s*1.0,-s*.35,s*.42,s*.5);c.fillStyle='#ef4444';for(let k=0;k<3;k++){c.beginPath();c.arc(s*1.32,-s*.25+k*s*.15,s*.05,0,TAU);c.fill();}};

/* Big Six Fortress: a fortress first, a die second; six firing ports where the pips go */
BEAST.fortress6=(c,s,L,t,atk)=>{const w=TW,st=Math.sin(t*w*2);
  // four stone legs, stomping
  for(const [x,ph] of [[-s*.95,st],[-s*.35,-st],[s*.35,st],[s*.95,-st]]){c.fillStyle='#57534e';c.fillRect(x-s*.17,s*.45,s*.34,s*.42+ph*s*.05);c.fillStyle='#44403c';c.fillRect(x-s*.24,s*.82+ph*s*.05,s*.48,s*.16);}
  // broad foundation
  c.fillStyle='#78716c';c.beginPath();c.moveTo(-s*1.35,s*.55);c.lineTo(-s*1.15,s*.12);c.lineTo(s*1.15,s*.12);c.lineTo(s*1.35,s*.55);c.closePath();c.fill();
  c.strokeStyle='#57534e';c.lineWidth=1;for(let r2=0;r2<2;r2++)for(let k=0;k<7;k++){const x=-s*1.25+k*s*.4+(r2?s*.2:0),y=s*.2+r2*s*.18;c.strokeRect(x,y,s*.38,s*.17);}
  // the die keep
  const W2=s*1.7,H2=s*1.35,x0=-W2/2,y0=s*.15-H2;c.fillStyle='#d6d3cc';c.fillRect(x0+s*.12,y0-s*.12,W2,H2);c.fillStyle=L.c1||'#f8f5ec';c.fillRect(x0,y0,W2,H2);
  c.strokeStyle='#c8c2b5';c.lineWidth=1.5;c.strokeRect(x0+s*.06,y0+s*.06,W2-s*.12,H2-s*.12);
  // six ports in the six-pip layout, each a dark muzzle that flares when it fires
  const P=[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]];P.forEach(([px,py],i)=>{const x=px*s*.42,y=y0+H2/2+py*s*.4;c.fillStyle='#1c1917';c.beginPath();c.arc(x,y,s*.15,0,TAU);c.fill();c.fillStyle=L.c2||'#b91c1c';c.beginPath();c.arc(x,y,s*.15,0,TAU);c.lineWidth=2;c.strokeStyle=L.c2||'#b91c1c';c.stroke();
    c.fillStyle='#0c0a09';c.beginPath();c.arc(x+s*.03,y,s*.09,0,TAU);c.fill();if(atk>.4&&i===Math.floor(t*w*3)%6){c.fillStyle='#fde047';c.beginPath();c.arc(x+s*.05,y,s*.12*atk,0,TAU);c.fill();}});
  // battlements and corner towers
  c.fillStyle='#a8a29e';for(let k=0;k<6;k++)c.fillRect(x0+k*W2/5.5,y0-s*.2,W2/9,s*.22);
  for(const sx of [-1,1]){const tx=sx*(W2/2+s*.05);c.fillStyle='#a8a29e';c.fillRect(tx-s*.16,y0-s*.45,s*.32,H2*.7);c.fillStyle='#78716c';for(let k=0;k<3;k++)c.fillRect(tx-s*.16+k*s*.12,y0-s*.58,s*.08,s*.14);c.fillStyle='#1c1917';c.fillRect(tx-s*.04,y0-s*.25,s*.08,s*.16);}
  // flag
  c.strokeStyle='#44403c';c.lineWidth=1.6;c.beginPath();c.moveTo(0,y0-s*.18);c.lineTo(0,y0-s*.95);c.stroke();c.fillStyle='#b91c1c';c.beginPath();c.moveTo(0,y0-s*.95);for(let i=0;i<=5;i++)c.lineTo(i*s*.11,y0-s*.95+Math.sin(t*w*2-i*.9)*s*.04*i/5);for(let i=5;i>=0;i--)c.lineTo(i*s*.11,y0-s*.68+Math.sin(t*w*2-i*.9)*s*.04*i/5);c.closePath();c.fill();
  c.fillStyle='#fff';c.font=`700 ${s*.17}px Barlow,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('6',s*.28,y0-s*.81);};

/* Gauss Sentinel: a rail gun first, with charging coils down a very long barrel */
BEAST.railgun=(c,s,L,t,atk)=>{const w=TW,c1=L.c1,c2=L.c2,glow=.5+.5*Math.sin(t*w*3);
  // treads
  c.fillStyle='#1c1917';c.beginPath();c.roundRect?c.roundRect(-s*1.05,s*.42,s*1.9,s*.48,s*.24):c.rect(-s*1.05,s*.42,s*1.9,s*.48);c.fill();c.fillStyle='#57534e';for(let k=0;k<5;k++){c.beginPath();c.arc(-s*.82+k*s*.36,s*.66,s*.13,0,TAU);c.fill();}
  c.strokeStyle='#292524';c.lineWidth=1;for(let k=0;k<9;k++){const x=-s*1+((k*s*.22+t*w*s*.3)%(s*1.9));c.beginPath();c.moveTo(x,s*.43);c.lineTo(x,s*.5);c.stroke();}
  // capacitor packs at the back
  for(let k=0;k<2;k++){c.fillStyle='#134e4a';c.fillRect(-s*1.0,-s*.25+k*s*.32,s*.35,s*.26);c.fillStyle=hexA(c2,.35+.5*glow);c.fillRect(-s*.95,-s*.21+k*s*.32,s*.25,s*.06);}
  // turret
  c.fillStyle=shade(c1,-.25);c.beginPath();c.moveTo(-s*.65,s*.45);c.lineTo(-s*.55,-s*.35);c.lineTo(s*.45,-s*.35);c.lineTo(s*.6,s*.45);c.closePath();c.fill();c.fillStyle=c1;c.fillRect(-s*.5,-s*.3,s*.95,s*.62);
  c.fillStyle='#0f172a';c.fillRect(-s*.15,-s*.62,s*.5,s*.32);c.fillStyle=c2;c.fillRect(-s*.08,-s*.53,s*.36,s*.1);
  // the barrel: long, with coils
  const bx=s*.35,by=-s*.12,BL=s*2.15;c.fillStyle='#334155';c.fillRect(bx,by-s*.1,BL,s*.2);c.fillStyle='#64748b';c.fillRect(bx,by-s*.1,BL,s*.06);
  c.fillStyle='#1e293b';c.fillRect(bx+BL-s*.08,by-s*.15,s*.14,s*.3);
  for(let k=0;k<5;k++){const x=bx+s*.25+k*s*.38,on=atk>.2||(Math.floor(t*w*4)%5===k);c.fillStyle='#0f172a';c.fillRect(x-s*.06,by-s*.2,s*.13,s*.4);c.fillStyle=on?'#ecfeff':hexA(c2,.55+.4*glow);c.fillRect(x-s*.035,by-s*.17,s*.07,s*.34);}
  if(atk>.3){c.fillStyle=hexA('#a5f3fc',atk*.9);c.beginPath();c.arc(bx+BL+s*.1,by,s*.2*atk,0,TAU);c.fill();}};

/* Craps Cannon: a squat mortar built from a pair of dice, with oversized dice for ammunition */
BEAST.mortar=(c,s,L,t,atk)=>{const w=TW,red=L.c2||'#dc2626',ivory=L.c1||'#f8fafc';
  c.fillStyle='#1c1917';c.beginPath();c.roundRect?c.roundRect(-s*.95,s*.5,s*1.7,s*.42,s*.2):c.rect(-s*.95,s*.5,s*1.7,s*.42);c.fill();c.fillStyle='#57534e';for(let k=0;k<4;k++){c.beginPath();c.arc(-s*.7+k*s*.42,s*.71,s*.12,0,TAU);c.fill();}
  // two dice: the base
  const die=(x,y,sz,col,pipc,n,rot)=>{c.save();c.translate(x,y);c.rotate(rot||0);c.fillStyle=shade(col,-.2);c.fillRect(-sz/2+sz*.08,-sz/2-sz*.08,sz,sz);c.fillStyle=col;c.beginPath();c.roundRect?c.roundRect(-sz/2,-sz/2,sz,sz,sz*.16):c.rect(-sz/2,-sz/2,sz,sz);c.fill();pips(c,sz,n,pipc);c.restore();};
  die(-s*.38,s*.18,s*.72,red,'#fff',5,-.06);die(s*.32,s*.2,s*.68,ivory,red,3,.05);
  // the mortar tube, wide and stubby, angled up
  c.save();c.translate(-s*.05,-s*.25);c.rotate(-.75-atk*.12);c.fillStyle='#292524';c.beginPath();c.roundRect?c.roundRect(-s*.32,-s*.95,s*.64,s*1.05,s*.1):c.rect(-s*.32,-s*.95,s*.64,s*1.05);c.fill();
  c.fillStyle='#57534e';c.fillRect(-s*.38,-s*1.02,s*.76,s*.18);c.fillStyle='#78716c';c.fillRect(-s*.32,-s*.5,s*.64,s*.08);c.fillStyle='#0c0a09';c.beginPath();c.ellipse(0,-s*.96,s*.26,s*.08,0,0,TAU);c.fill();
  if(atk>.3){c.fillStyle=hexA('#fde047',atk);c.beginPath();c.arc(0,-s*1.1,s*.2*atk,0,TAU);c.fill();}c.restore();
  // oversized dice ammo stacked beside it
  die(s*.85,s*.48,s*.38,ivory,red,6,.3);die(s*.72,s*.1,s*.32,red,'#fff',2,-.2);
  // a face on the front die
  CUR_FACE='pips';eye(c,s*.2,s*.12,s*.08);eye(c,s*.44,s*.12,s*.08);};

/* Wild Card Chimera: one dominant lion head, a goat head raised on its back, a snake for a tail */
BEAST.chimera2=(c,s,L,t,atk)=>{const w=TW,st=Math.sin(t*w*2),c1=L.c1||'#6b21a8',gold=L.c2||'#fbbf24',mane='#d97706';
  // snake tail behind
  c.lineCap='round';c.strokeStyle='#15803d';c.lineWidth=s*.22;c.beginPath();c.moveTo(-s*.7,-s*.05);c.bezierCurveTo(-s*1.4,-s*.1,-s*1.1,-s*.9+st*s*.08,-s*1.55,-s*.95);c.stroke();
  c.strokeStyle='#86efac';c.lineWidth=s*.08;c.stroke();c.fillStyle='#15803d';c.beginPath();c.ellipse(-s*1.6,-s*.98+st*s*.04,s*.2,s*.14,-.4,0,TAU);c.fill();
  c.fillStyle='#fff';c.beginPath();c.arc(-s*1.65,-s*1.03,s*.04,0,TAU);c.fill();c.strokeStyle='#e11d48';c.lineWidth=1.2;c.beginPath();c.moveTo(-s*1.78,-s*.92);c.lineTo(-s*1.92,-s*.86+st*s*.05);c.stroke();
  // legs
  for(const [x,ph] of [[-s*.55,st],[-s*.2,-st],[s*.35,st],[s*.65,-st]]){c.strokeStyle=shade(c1,-.3);c.lineWidth=s*.2;c.beginPath();c.moveTo(x,s*.25);c.lineTo(x+ph*s*.1,s*.82);c.stroke();c.fillStyle=shade(c1,-.4);c.beginPath();c.ellipse(x+ph*s*.1+s*.05,s*.86,s*.13,s*.07,0,0,TAU);c.fill();}
  // lion body
  c.fillStyle=c1;c.beginPath();c.ellipse(0,s*.15,s*.85,s*.42,0,0,TAU);c.fill();c.fillStyle=shade(c1,.18);c.beginPath();c.ellipse(-s*.05,s*.02,s*.6,s*.18,0,0,TAU);c.fill();
  // goat head, clearly raised on a neck from the back
  c.strokeStyle=shade(c1,-.1);c.lineWidth=s*.2;c.beginPath();c.moveTo(-s*.2,-s*.1);c.lineTo(-s*.32,-s*.72);c.stroke();
  c.fillStyle='#e7e5e4';c.beginPath();c.ellipse(-s*.3,-s*.85,s*.2,s*.16,-.2,0,TAU);c.fill();c.beginPath();c.ellipse(-s*.12,-s*.8,s*.12,s*.08,-.2,0,TAU);c.fill();
  c.strokeStyle='#78350f';c.lineWidth=s*.07;c.beginPath();c.arc(-s*.45,-s*1.0,s*.14,.3,Math.PI*1.6);c.stroke();c.beginPath();c.arc(-s*.22,-s*1.05,s*.12,.5,Math.PI*1.7);c.stroke();
  c.fillStyle='#e7e5e4';c.beginPath();c.moveTo(-s*.15,-s*.72);c.lineTo(-s*.2,-s*.55);c.lineTo(-s*.08,-s*.7);c.fill();eye(c,-s*.28,-s*.88,s*.06);
  // jester collar at the lion's neck
  for(let k=0;k<5;k++){const a=-1.2+k*.5,x=s*.62+Math.cos(a)*s*.35,y=-s*.05+Math.sin(a)*s*.35;c.fillStyle=k%2?gold:'#e11d48';c.beginPath();c.moveTo(x,y-s*.12);c.lineTo(x+s*.08,y);c.lineTo(x,y+s*.12);c.lineTo(x-s*.08,y);c.fill();}
  // the lion head: big mane, the dominant shape
  const hx=s*.82,hy=-s*.32;c.fillStyle=mane;for(let k=0;k<12;k++){const a=k/12*TAU;c.beginPath();c.moveTo(hx+Math.cos(a)*s*.3,hy+Math.sin(a)*s*.3);c.lineTo(hx+Math.cos(a+.25)*s*.58,hy+Math.sin(a+.25)*s*.58);c.lineTo(hx+Math.cos(a+.5)*s*.3,hy+Math.sin(a+.5)*s*.3);c.fill();}
  c.fillStyle='#b45309';c.beginPath();c.arc(hx,hy,s*.42,0,TAU);c.fill();c.fillStyle=gold;c.beginPath();c.arc(hx+s*.05,hy+s*.02,s*.3,0,TAU);c.fill();
  c.fillStyle='#fde68a';c.beginPath();c.ellipse(hx+s*.2,hy+s*.12,s*.16,s*.12,0,0,TAU);c.fill();c.fillStyle='#7c2d12';c.beginPath();c.moveTo(hx+s*.25,hy+s*.02);c.lineTo(hx+s*.36,hy+s*.02);c.lineTo(hx+s*.3,hy+s*.1);c.fill();
  CUR_FACE='angry';eye(c,hx-s*.03,hy-s*.08,s*.09);eye(c,hx+s*.2,hy-s*.08,s*.09);
  if(atk>.3){c.fillStyle='#7f1d1d';c.beginPath();c.ellipse(hx+s*.22,hy+s*.24,s*.12,s*.08*atk+s*.02,0,0,TAU);c.fill();c.fillStyle='#fff';c.fillRect(hx+s*.14,hy+s*.18,s*.04,s*.06);c.fillRect(hx+s*.27,hy+s*.18,s*.04,s*.06);}};

/* Phoenix Ante: flowing flame wings swept up and back, and a long trailing tail */
BEAST.firebird=(c,s,L,t,atk)=>{const w=TW,fl=Math.sin(t*w*2),c1=L.c1||'#dc2626',c2=L.c2||'#fde047',mid='#fb923c';c.translate(0,Math.sin(t*w)*s*.1-s*.15);
  {const g=c.createRadialGradient(0,-s*.2,s*.1,0,-s*.2,s*1.5);g.addColorStop(0,'rgba(249,115,22,.45)');g.addColorStop(1,'rgba(249,115,22,0)');c.fillStyle=g;c.beginPath();c.arc(0,-s*.2,s*1.5,0,TAU);c.fill();}
  // long trailing tail ribbons streaming behind and down
  for(let k=0;k<3;k++){const sw=Math.sin(t*w*2+k*1.3)*s*.15;c.fillStyle=[c1,mid,c2][k];c.beginPath();c.moveTo(-s*.2,s*.15);
    c.bezierCurveTo(-s*.8,s*.25+k*s*.15,-s*1.4+sw,s*.45+k*s*.2,-s*1.9+sw,s*(.35+k*.3));c.bezierCurveTo(-s*1.35+sw,s*.35+k*s*.15,-s*.8,s*.12+k*s*.1,-s*.15,s*.02);c.fill();}
  // far wing then near wing, each a swept flame with curling tips
  const wing=(sc,col,col2,rot)=>{c.save();c.translate(-s*.05,-s*.15);c.rotate(rot-fl*.25);c.scale(sc,sc);
    c.fillStyle=col;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-s*.2,-s*.6,-s*.6,-s*1.1,-s*1.05,-s*1.35);c.quadraticCurveTo(-s*.85,-s*1.0,-s*.95,-s*.95);c.quadraticCurveTo(-s*.65,-s*.75,-s*.85,-s*.62);c.quadraticCurveTo(-s*.45,-s*.45,-s*.6,-s*.3);c.quadraticCurveTo(-s*.25,-s*.2,0,s*.1);c.fill();
    c.fillStyle=col2;c.beginPath();c.moveTo(-s*.05,-s*.05);c.bezierCurveTo(-s*.2,-s*.45,-s*.45,-s*.8,-s*.75,-s*1.0);c.quadraticCurveTo(-s*.5,-s*.55,-s*.1,s*.02);c.fill();c.restore();};
  wing(.85,shade(c1,-.2),mid,.15);
  // body: slim, leaning forward
  c.save();c.rotate(-.25);c.fillStyle=c1;c.beginPath();c.ellipse(0,0,s*.45,s*.24,0,0,TAU);c.fill();c.fillStyle=c2;c.beginPath();c.ellipse(s*.08,s*.08,s*.3,s*.12,0,0,TAU);c.fill();c.restore();
  // head, crest of flame, small beak
  const hx=s*.48,hy=-s*.32;c.fillStyle=c1;c.beginPath();c.arc(hx,hy,s*.2,0,TAU);c.fill();
  for(let k=0;k<3;k++){c.fillStyle=[c2,mid,c1][k];c.beginPath();c.moveTo(hx-s*.05,hy-s*.15);c.quadraticCurveTo(hx-s*(.25+k*.12),hy-s*(.5+k*.05)+Math.sin(t*w*3+k)*s*.05,hx-s*(.45+k*.15),hy-s*(.35-k*.05));c.quadraticCurveTo(hx-s*.2,hy-s*.2,hx-s*.12,hy-s*.05);c.fill();}
  c.fillStyle='#fbbf24';c.beginPath();c.moveTo(hx+s*.16,hy-s*.04);c.lineTo(hx+s*.36,hy+s*.03);c.lineTo(hx+s*.16,hy+s*.08);c.fill();eye(c,hx+s*.06,hy-s*.05,s*.07);
  wing(1,c1,c2,-.1);};

/* Thunderbird: angular zig-zag wings, a hooked beak and a forceful diving posture */
BEAST.stormbird=(c,s,L,t,atk)=>{const w=TW,fl=Math.sin(t*w*2),c1=L.c1||'#1e3a8a',c2=L.c2||'#facc15',mid='#3b82f6';c.translate(0,Math.sin(t*w)*s*.08-s*.2);
  {const g=c.createRadialGradient(0,-s*.1,s*.1,0,-s*.1,s*1.5);g.addColorStop(0,'rgba(96,165,250,.4)');g.addColorStop(1,'rgba(96,165,250,0)');c.fillStyle=g;c.beginPath();c.arc(0,-s*.1,s*1.5,0,TAU);c.fill();}
  // wide angular wings, spread forward and down like a dive
  const wing=(sd,col,col2)=>{c.save();c.translate(-s*.1,-s*.1);c.scale(1,sd);c.rotate(-fl*.12*sd);c.fillStyle=col;c.beginPath();c.moveTo(0,0);c.lineTo(-s*.45,-s*.75);c.lineTo(-s*.3,-s*.72);c.lineTo(-s*.95,-s*1.15);c.lineTo(-s*.7,-s*.98);c.lineTo(-s*1.5,-s*1.05);c.lineTo(-s*1.05,-s*.65);c.lineTo(-s*1.35,-s*.45);c.lineTo(-s*.7,-s*.3);c.lineTo(-s*.25,s*.1);c.closePath();c.fill();
    c.strokeStyle=col2;c.lineWidth=s*.07;c.lineJoin='miter';c.beginPath();c.moveTo(-s*.1,-s*.1);c.lineTo(-s*.55,-s*.55);c.lineTo(-s*.42,-s*.6);c.lineTo(-s*1.05,-s*.85);c.stroke();c.restore();};
  wing(1,shade(c1,-.2),'#93c5fd');
  // tail: short, squared, in sharp vanes
  c.fillStyle=c1;c.beginPath();c.moveTo(-s*.45,s*.05);c.lineTo(-s*1.15,s*.15);c.lineTo(-s*1.0,s*.32);c.lineTo(-s*1.2,s*.45);c.lineTo(-s*.4,s*.25);c.closePath();c.fill();c.fillStyle=c2;c.beginPath();c.moveTo(-s*.5,s*.15);c.lineTo(-s*1.0,s*.22);c.lineTo(-s*.45,s*.24);c.fill();
  // body angled into the dive
  c.save();c.rotate(.18);c.fillStyle=c1;c.beginPath();c.moveTo(-s*.55,s*.05);c.quadraticCurveTo(-s*.1,-s*.35,s*.45,-s*.18);c.quadraticCurveTo(s*.55,s*.12,s*.1,s*.28);c.quadraticCurveTo(-s*.3,s*.3,-s*.55,s*.05);c.fill();
  c.fillStyle=mid;c.beginPath();c.moveTo(-s*.35,s*.12);c.quadraticCurveTo(s*.05,s*.0,s*.35,s*.05);c.quadraticCurveTo(s*.1,s*.22,-s*.35,s*.12);c.fill();c.restore();
  // head with a heavy hooked beak and a glare
  const hx=s*.55,hy=-s*.25;c.fillStyle=c1;c.beginPath();c.moveTo(hx-s*.25,hy+s*.12);c.lineTo(hx-s*.18,hy-s*.2);c.lineTo(hx+s*.15,hy-s*.22);c.lineTo(hx+s*.25,hy+s*.05);c.closePath();c.fill();
  c.fillStyle=c2;c.beginPath();c.moveTo(hx+s*.15,hy-s*.15);c.quadraticCurveTo(hx+s*.48,hy-s*.15,hx+s*.45,hy+s*.12);c.lineTo(hx+s*.35,hy+s*.05);c.lineTo(hx+s*.2,hy+s*.08);c.closePath();c.fill();
  c.fillStyle='#fef9c3';c.beginPath();c.moveTo(hx-s*.05,hy-s*.12);c.lineTo(hx+s*.1,hy-s*.1);c.lineTo(hx+s*.02,hy-s*.03);c.fill();c.fillStyle='#0b0612';c.beginPath();c.arc(hx+s*.04,hy-s*.08,s*.03,0,TAU);c.fill();
  c.fillStyle='#93c5fd';c.beginPath();c.moveTo(hx-s*.15,hy-s*.18);c.lineTo(hx-s*.4,hy-s*.42);c.lineTo(hx-s*.05,hy-s*.22);c.fill();
  wing(-1,c1,c2);
  // lightning crackles off the wingtips
  if(Math.sin(t*w*3)>.1||atk>.3){c.strokeStyle='#fef9c3';c.lineWidth=1.5;c.beginPath();c.moveTo(-s*1.5,-s*1.15);c.lineTo(-s*1.7,-s*.85);c.lineTo(-s*1.55,-s*.82);c.lineTo(-s*1.78,-s*.5);c.stroke();}};

/* Grand Casino: a crab carrying a whole resort: hotel tower, wide frontage, a neon sign and a lit entrance */
BEAST.resort=(c,s,L,t,atk)=>{const w=TW,c1=L.c1||'#7f1d1d';legs(c,s*1.4,t*.7,4,shade(c1,-.4),s*.5);
  c.fillStyle=c1;for(const sx of [-1,1]){c.beginPath();c.arc(sx*s*1.3,s*.25,s*.34,0,TAU);c.fill();c.fillStyle=shade(c1,-.2);c.beginPath();c.moveTo(sx*s*1.3,s*.25);c.arc(sx*s*1.3,s*.25,s*.34,sx>0?-.6:Math.PI,sx>0?0:Math.PI+.6);c.fill();c.fillStyle=c1;}
  c.fillStyle=shade(c1,-.3);c.beginPath();c.ellipse(0,s*.32,s*1.2,s*.6,0,0,TAU);c.fill();c.fillStyle=c1;c.beginPath();c.ellipse(0,s*.22,s*1.15,s*.52,0,Math.PI,0);c.fill();
  // hotel tower behind
  const tx=-s*.35,tw=s*.62,ty=-s*1.85;c.fillStyle='#1f1235';c.fillRect(tx,ty,tw,s*1.75);c.fillStyle='#2e1a4a';c.fillRect(tx,ty,tw*.3,s*1.75);
  for(let r2=0;r2<7;r2++)for(let k=0;k<3;k++){const on=((r2*3+k)*7+Math.floor(t*w))%5!==0;c.fillStyle=on?'#fde68a':'#3b2a55';c.fillRect(tx+s*.08+k*s*.18,ty+s*.12+r2*s*.22,s*.1,s*.12);}
  c.fillStyle='#fbbf24';c.fillRect(tx-s*.04,ty-s*.08,tw+s*.08,s*.1);
  // wide frontage
  const fx=-s*1.0,fw=s*2.0,fy=-s*.7;c.fillStyle='#fef3c7';c.fillRect(fx,fy,fw,s*.72);c.fillStyle='#fde68a';c.fillRect(fx,fy,fw,s*.1);
  for(let k=0;k<6;k++){c.fillStyle='#7c2d12';c.fillRect(fx+s*.12+k*s*.3,fy+s*.18,s*.18,s*.22);}
  // entrance: lit doors, a canopy and a red carpet down to the street, where the bouncers come out
  c.fillStyle='#7f1d1d';c.beginPath();c.moveTo(-s*.35,fy+s*.42);c.lineTo(s*.35,fy+s*.42);c.lineTo(s*.42,fy+s*.52);c.lineTo(-s*.42,fy+s*.52);c.fill();
  const g=c.createLinearGradient(0,fy+s*.5,0,fy+s*.72);g.addColorStop(0,'#fff7d6');g.addColorStop(1,'#fbbf24');c.fillStyle=g;c.fillRect(-s*.22,fy+s*.5,s*.44,s*.22);
  c.fillStyle='#b91c1c';c.beginPath();c.moveTo(-s*.18,fy+s*.72);c.lineTo(s*.18,fy+s*.72);c.lineTo(s*.32,fy+s*1.0);c.lineTo(-s*.32,fy+s*1.0);c.fill();
  // the neon sign across the top
  const sy2=fy-s*.32,blink=Math.floor(t*w*2)%2;c.fillStyle='#0b0612';c.fillRect(-s*.95,sy2,s*1.9,s*.3);c.strokeStyle=blink?'#ff3d9a':'#22d3ee';c.lineWidth=1.5;c.strokeRect(-s*.95,sy2,s*1.9,s*.3);
  c.fillStyle=blink?'#ffd1e8':'#cffafe';c.font=`400 ${s*.24}px Bungee,Impact,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('CASINO',0,sy2+s*.16);
  for(let k=0;k<10;k++){c.fillStyle=(k+Math.floor(t*w*3))%2?'#fde047':'#7c2d12';c.beginPath();c.arc(-s*.9+k*s*.2,sy2-s*.05,s*.035,0,TAU);c.fill();}
  // eyes on stalks
  for(const sx of [-.55,.55]){c.strokeStyle='#111';c.lineWidth=1.5;c.beginPath();c.moveTo(sx*s,s*.12);c.lineTo(sx*s,-s*.05);c.stroke();eye(c,sx*s,-s*.1,s*.13);}
  if(atk>.5){c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.arc(tx+tw/2,ty-s*.2,s*.25*atk,0,TAU);c.fill();}};

/* Jade Dragon: a long serpentine eastern dragon, no wings, whiskers and antlers */
BEAST.lung=(c,s,L,t,atk)=>{const w=TW,c1=L.c1||'#047857',c2=L.c2||'#fde68a',lt=shade(c1,.3),seg=12,pts=[];
  for(let i=0;i<seg;i++){const q=i/(seg-1);pts.push([-s*1.45+q*s*2.15,Math.sin(t*w*1.5+q*6)*s*.28-s*.2-q*s*.25+s*.2]);}
  // little legs under the body
  for(const i of [3,8]){const [x,y]=pts[i];c.strokeStyle=shade(c1,-.3);c.lineWidth=s*.12;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x+s*.08,y+s*.45);c.stroke();c.strokeStyle=c2;c.lineWidth=1.2;for(let k=-1;k<=1;k++){c.beginPath();c.moveTo(x+s*.08,y+s*.45);c.lineTo(x+s*(.08+k*.08),y+s*.55);c.stroke();}}
  // body segments, belly scutes and a mane crest down the back
  for(let i=0;i<seg;i++){const [x,y]=pts[i],R=s*(.12+.2*Math.sin(Math.min(1,i/(seg-1)*1.15)*Math.PI*.9+.15));c.fillStyle=i%2?c1:shade(c1,-.1);c.beginPath();c.arc(x,y,R,0,TAU);c.fill();c.fillStyle=c2;c.beginPath();c.ellipse(x,y+R*.5,R*.6,R*.35,0,0,TAU);c.fill();
    if(i%2&&i<seg-1){c.fillStyle='#ef4444';c.beginPath();c.moveTo(x-R*.3,y-R*.8);c.quadraticCurveTo(x-R*.1,y-R*1.7+Math.sin(t*w*2+i)*R*.2,x+R*.4,y-R*.85);c.fill();}}
  // tail tuft
  {const [x,y]=pts[0];c.fillStyle='#ef4444';c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-s*.4,y-s*.3,x-s*.5,y+s*.05);c.quadraticCurveTo(x-s*.3,y+s*.05,x,y+s*.08);c.fill();}
  // the head: long snout, antlers, whiskers, beard
  const [hx,hy]=pts[seg-1];c.save();c.translate(hx+s*.1,hy-s*.05);
  c.strokeStyle='#fef3c7';c.lineWidth=s*.06;c.lineCap='round';c.beginPath();c.moveTo(-s*.05,-s*.2);c.lineTo(-s*.25,-s*.62);c.moveTo(-s*.17,-s*.45);c.lineTo(-s*.38,-s*.5);c.moveTo(s*.1,-s*.22);c.lineTo(s*.02,-s*.64);c.moveTo(s*.05,-s*.48);c.lineTo(-s*.08,-s*.56);c.stroke();
  c.fillStyle=c1;c.beginPath();c.moveTo(-s*.3,s*.05);c.quadraticCurveTo(-s*.2,-s*.3,s*.15,-s*.25);c.lineTo(s*.62,-s*.1);c.quadraticCurveTo(s*.72,s*.04,s*.6,s*.12);c.lineTo(-s*.1,s*.22);c.closePath();c.fill();
  c.fillStyle=lt;c.beginPath();c.ellipse(s*.48,-s*.06,s*.14,s*.08,0,0,TAU);c.fill();c.fillStyle='#0b0612';c.beginPath();c.arc(s*.6,-s*.06,s*.03,0,TAU);c.fill();
  c.fillStyle=shade(c1,-.3);c.beginPath();c.moveTo(-s*.05,s*.16);c.lineTo(s*.55,s*.12+atk*s*.12);c.lineTo(s*.45,s*.24+atk*s*.12);c.lineTo(-s*.1,s*.24);c.fill();
  eye(c,s*.12,-s*.12,s*.09);
  c.strokeStyle=c2;c.lineWidth=1.2;const wv=Math.sin(t*w*2)*s*.08;c.beginPath();c.moveTo(s*.55,-s*.02);c.quadraticCurveTo(s*.85,-s*.2+wv,s*1.05,-s*.05+wv);c.moveTo(s*.52,s*.06);c.quadraticCurveTo(s*.8,s*.25-wv,s*1.0,s*.15-wv);c.stroke();
  c.fillStyle='#fef3c7';c.beginPath();c.moveTo(-s*.05,s*.22);c.lineTo(s*.05,s*.45);c.lineTo(s*.15,s*.2);c.fill();c.restore();
  // a pearl it chases
  c.fillStyle='rgba(253,230,138,.9)';c.beginPath();c.arc(hx+s*.95,hy-s*.45+Math.sin(t*w*2)*s*.08,s*.1,0,TAU);c.fill();};

/* racing greyhounds use Red's proper greyhound art; Trap One wears the number one jacket and a winner's sash */
BEAST.racer=(c,s,L,t,atk)=>{if(typeof drawGreyhound!=='function')return;const P={c:L.c1||'#9ca3af',d:shade(L.c1||'#9ca3af',-.3),b:shade(L.c1||'#9ca3af',.45),jacket:L.silk||'#d4202a',jt:'#fff',num:L.num||'1',muzzle:true};
  const sc=s/20;c.translate(-s*.15,s*.35);drawGreyhound(c,'run',(t/SPP)%1,sc,P);
  if(L.sash){c.save();c.scale(sc,sc);c.strokeStyle='#fde047';c.lineWidth=2.4;c.beginPath();c.moveTo(-6,-10);c.quadraticCurveTo(2,-3,8,2);c.stroke();c.strokeStyle='#b45309';c.lineWidth=.6;c.stroke();
    c.fillStyle='#fde047';c.beginPath();c.arc(8,2.5,2.4,0,TAU);c.fill();c.fillStyle='#b45309';c.font='700 3px Barlow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('1',8,2.6);c.restore();}};

// weapons for people: a fan of hexed cards, and open grappling hands
{const _wp=weapon;weapon=function(c,r,o,hx,hy,atk,front){
  if(o.weapon==='hexfan'){for(let k=-2;k<=2;k++){c.save();c.translate(hx,hy);c.rotate(k*.28-.25-atk*.4);c.fillStyle='#0b0612';c.fillRect(-r*.01,-r*.34,r*.22,r*.32);c.fillStyle='#ecfccb';c.fillRect(0,-r*.33,r*.2,r*.3);
      c.fillStyle='#16a34a';c.beginPath();c.arc(r*.1,-r*.18,r*.06,0,TAU);c.fill();c.restore();}
    c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(74,222,128,.35)';c.beginPath();c.arc(hx+r*.05,hy-r*.2,r*.28,0,TAU);c.fill();c.restore();return;}
  if(o.weapon==='grapple'){c.fillStyle=o.skin||'#c99a6e';c.save();c.translate(hx,hy);c.rotate(front?-.4-atk*.6:.3);c.beginPath();c.ellipse(0,0,r*.13,r*.1,0,0,TAU);c.fill();
    c.strokeStyle=o.skin||'#c99a6e';c.lineWidth=r*.05;c.lineCap='round';for(let k=0;k<4;k++){c.beginPath();c.moveTo(r*.06,-r*.06+k*r*.04);c.lineTo(r*.2,-r*.1+k*r*.06);c.stroke();}c.beginPath();c.moveTo(-r*.02,-r*.08);c.lineTo(r*.04,-r*.2);c.stroke();c.restore();return;}
  return _wp(c,r,o,hx,hy,atk,front);};}

/* ---------- who gets which look ---------- */
const LOOKS={
  m_leviathan:{b:'leviathan',face:'angry',c1:'#1e3a8a',c2:'#bfdbfe',crown:true},
  m_house:{b:'vaultthrone',face:'regal'},
  m_fortress:{b:'fortress6',face:'led',c1:'#f8f5ec',c2:'#b91c1c'},
  m_gauss:{b:'railgun',face:'led',c1:'#0f766e',c2:'#67e8f9',beam:'#67e8f9'},
  sec_craps:{b:'mortar',face:'pips',c1:'#f8fafc',c2:'#dc2626',shot:'die'},
  m_chimera:{b:'chimera2',face:'angry',c1:'#6b21a8',c2:'#fbbf24'},
  m_empress:{b:'firebird',face:'reptile',c1:'#dc2626',c2:'#fde047',shot:'fire'},
  sec_thunderbird:{b:'stormbird',face:'reptile',c1:'#1e3a8a',c2:'#facc15'},
  m_casino:{b:'resort',face:'beady',c1:'#7f1d1d',c2:'#fbbf24'},
  q_hi:{b:'lung',face:'reptile',c1:'#047857',c2:'#fde68a'},
  m_greyhound:{b:'racer',c1:'#9ca3af',silk:'#d4202a',num:'1',sash:true},
  m_dog:{b:'racer',c1:'#a8a29e',silk:'#1f4fd1',num:'2'},
  m_champ:{b:'human',face:'angry',bulk:1.5,body:'#c99a6e',skin:'#c99a6e',pants:'#1d4ed8',luchador:'#dc2626',belt:'gold',weapon:'grapple',dual:true},
  sec_cooler:{b:'human',face:'sly',bulk:1.15,body:'#334155',coat:true,tie:'#bae6fd',hat:'eyeshade',hatCol:'#38bdf8',aura:'#7dd3fc',frost:true,mouth:'frown',skin:'#cbb59a',weapon:'none'},
  m_hex:{b:'human',face:'sly',hat:'hood',hatCol:'#14532d',body:'#166534',coat:true,aura:'#22c55e',weapon:'hexfan',shot:'card'},
  m_bounty:{b:'human',face:'mask',hat:'cowboy',hatCol:'#1c1917',hatBand:'#b45309',body:'#3f2a17',poncho:'#9a7b4f',scarf:'#7f1d1d',weapon:'crossbow',bandolier:true,shot:'slug'}};
for(const k in LOOKS)if(UNITS[k])UNITS[k].look=Object.assign({},LOOKS[k]);
for(const b of ['vaultthrone','fortress6','chimera2','resort','racer'])WALKERS.add(b);
