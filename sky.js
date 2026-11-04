'use strict';
/* ============ ALL IN — the night wears on ============
   The run is one long night on the Strip: a violet dusk with the sun going down over the desert (west), deep
   night, the cold small hours with mist on the street, then a pink-gold dawn coming up behind the casino (east).
   The clock follows the round and drifts smoothly; the street is graded under the creatures, and a lighter pass
   over them keeps everything sitting in the same light. */

// clock hours (after midnight counts on past 24) at each round
const SKY_CLOCK=[[1,19.1],[6,20.6],[10,22.2],[15,23.6],[20,25.1],[25,26.4],[30,27.6],[34,28.6],[37,29.4],[40,30.6]];
// how the light looks at each hour. lift = screen (raises shadows), mul = multiply (tints and darkens),
// sun = a directional glow from one side, mist = drifting haze, vig = extra vignette, neon = how hard the neon reads
// how the light looks at each hour. Grading keeps contrast: multiply tints and darkens, soft-light shifts hue,
// and only the low sun itself adds light (a soft-light wash from its side and a bloom right at the edge).
const SKY_KEYS=[
  {h:19.0,mul:['#d9b8f2',.16],soft:['#a65cff',.24],sun:[-1,'#ff8a3d',.6],bloom:.2,mist:0,vig:.1,motes:0},
  {h:20.4,mul:['#c2b8f0',.16],soft:['#7a5cff',.26],sun:[-1,'#ff5f4a',.32],bloom:.06,mist:0,vig:.14,motes:0},
  {h:22.0,mul:['#e2e0f7',.06],soft:['#5b6cff',.12],sun:[-1,'#ff5f4a',0],bloom:0,mist:0,vig:.18,motes:0},
  {h:23.5,mul:['#ffffff',0],soft:['#808080',0],sun:[1,'#000000',0],bloom:0,mist:0,vig:.2,motes:0},
  {h:25.5,mul:['#8f9bd8',.2],soft:['#2b4bbd',.24],sun:[1,'#000000',0],bloom:0,mist:.1,vig:.28,motes:0},
  {h:27.2,mul:['#7d88c8',.3],soft:['#1e3a9e',.3],sun:[1,'#000000',0],bloom:0,mist:.16,vig:.32,motes:0},
  {h:28.6,mul:['#a197cc',.2],soft:['#c25ea8',.22],sun:[1,'#ff6fa3',.3],bloom:.04,mist:.14,vig:.26,motes:0},
  {h:29.5,mul:['#b8a8dc',.14],soft:['#ffa8c4',.2],lift:['#ffc2c8',.03],sun:[1,'#ffb070',.46],bloom:.13,mist:.08,vig:.18,motes:.5},
  {h:30.6,mul:['#b4bfe8',.1],soft:['#ffd29a',.2],lift:['#ffe2b8',.08],sun:[1,'#ffcf7a',.62],bloom:.26,mist:.03,vig:.1,motes:1}];
const SKY={h:19.1,lastT:0,mist:null};
function skyTargetHour(){if(!G||!G.wave)return 19.1;const w=Math.max(1,G.wave),C=SKY_CLOCK;
  for(let i=1;i<C.length;i++)if(w<=C[i][0]){const [w0,h0]=C[i-1],[w1,h1]=C[i];return h0+(h1-h0)*(w-w0)/(w1-w0);}return C[C.length-1][1];}
const hx2=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mixC=(a,b,k)=>{const A=hx2(a),B=hx2(b);return A.map((v,i)=>Math.round(v+(B[i]-v)*k));};
function skyLook(h){const K=SKY_KEYS;if(h<=K[0].h)h=K[0].h;if(h>=K[K.length-1].h)h=K[K.length-1].h;let i=1;while(i<K.length-1&&h>K[i].h)i++;
  const a=K[i-1],b=K[i],k0=(h-a.h)/(b.h-a.h),k=k0*k0*(3-2*k0);const L=(x,y)=>x+(y-x)*k;
  // colours fade through their own alpha so a key with alpha 0 never drags its (meaningless) colour in
  const col=(p,q)=>{const al=L(p[1],q[1]),den=p[1]*(1-k)+q[1]*k,w=den>0?q[1]*k/den:k;return [mixC(p[0],q[0],w),al];};
  const sunSide=a.sun[2]>b.sun[2]?a.sun[0]:b.sun[0];
  const z=['#000000',0];return {lift:col(a.lift||z,b.lift||z),mul:col(a.mul,b.mul),soft:col(a.soft,b.soft),sun:[sunSide,...col([a.sun[1],a.sun[2]],[b.sun[1],b.sun[2]])],bloom:L(a.bloom,b.bloom),mist:L(a.mist,b.mist),vig:L(a.vig,b.vig),motes:L(a.motes,b.motes)};}
function skyClockText(h){const hh=Math.floor(h)%24,mm=Math.floor((h%1)*60/5)*5;const ap=hh>=12?'PM':'AM',h12=hh%12||12;return `${h12}:${String(mm).padStart(2,'0')} ${ap}`;}
function skyMist(){if(SKY.mist)return SKY.mist;const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');
  for(let i=0;i<46;i++){const x=Math.random()*512,y=Math.random()*256,r=30+Math.random()*80,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(190,205,255,.1)');gr.addColorStop(1,'rgba(200,210,255,0)');
    for(const dx of [-512,0,512])for(const dy of [-256,0,256]){g.fillStyle=gr;g.save();g.translate(dx,dy);g.fillRect(x-r,y-r,r*2,r*2);g.restore();}}
  return SKY.mist=c;}
const rgba=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
// pass 'ground' runs under the creatures, 'top' over them at a third of the strength
function drawSky(c,t,pass){if(!G)return;const now=performance.now()/1000,dt=Math.min(.1,now-(SKY.lastT||now));if(pass==='ground'){SKY.lastT=now;const tg=SKY.forceH!=null?SKY.forceH:skyTargetHour();SKY.h+=(tg-SKY.h)*Math.min(1,dt*.35);if(Math.abs(tg-SKY.h)>3)SKY.h=tg;}
  const S=skyLook(SKY.h),k=pass==='top'?.33:1;c.save();
  if(S.mul[1]>.001){c.globalCompositeOperation='multiply';c.fillStyle=rgba(S.mul[0],S.mul[1]*k);c.fillRect(0,0,W,H);}
  if(S.lift[1]>.001){c.globalCompositeOperation='screen';c.fillStyle=rgba(S.lift[0],S.lift[1]*k);c.fillRect(0,0,W,H);}
  if(S.soft[1]>.001){c.globalCompositeOperation='soft-light';c.fillStyle=rgba(S.soft[0],S.soft[1]*k);c.fillRect(0,0,W,H);}
  // the low sun: a soft-light wash from its side of the board, a bloom at the edge, slow light shafts at dawn
  if(S.sun[2]>.003){const side=S.sun[0],sx=side<0?-W*.1:W*1.1,sy=H*.45;
    let g=c.createLinearGradient(side<0?0:W,0,side<0?W:0,0);g.addColorStop(0,rgba(S.sun[1],S.sun[2]*k));g.addColorStop(.55,rgba(S.sun[1],S.sun[2]*.35*k));g.addColorStop(1,rgba(S.sun[1],0));
    c.globalCompositeOperation='soft-light';c.fillStyle=g;c.fillRect(0,0,W,H);
    if(S.bloom>.005){g=c.createRadialGradient(sx,sy,10,sx,sy,W*.42);g.addColorStop(0,rgba(S.sun[1],S.bloom*k));g.addColorStop(.5,rgba(S.sun[1],S.bloom*.35*k));g.addColorStop(1,rgba(S.sun[1],0));c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(0,0,W,H);}
    if(pass==='ground'&&side>0&&S.bloom>.1){c.globalCompositeOperation='lighter';for(let i=0;i<5;i++){const ph=t*.03+i*.21,x0=W*(.2+((ph*1.3+i*.37)%1)*.85),a=S.bloom*.16*(.6+.4*Math.sin(t*.4+i*2));
        c.save();c.translate(x0,0);c.transform(1,0,-.55,1,0,0);const sg=c.createLinearGradient(-40,0,40,0);sg.addColorStop(0,rgba(S.sun[1],0));sg.addColorStop(.5,rgba(S.sun[1],a));sg.addColorStop(1,rgba(S.sun[1],0));c.fillStyle=sg;c.fillRect(-40,0,80+i*14,H);c.restore();}}}
  // mist on the street in the small hours, drifting east
  if(pass==='ground'&&S.mist>.01){const m=skyMist(),ox=(t*9)%512,oy=Math.sin(t*.05)*20;c.globalCompositeOperation='screen';c.globalAlpha=Math.min(1,S.mist);
    for(let x=-ox-512;x<W;x+=512)for(let y=-256+oy;y<H;y+=256)c.drawImage(m,x,y,512,256);
    c.globalAlpha=Math.min(1,S.mist*.6);const ox2=(t*5)%512;for(let x=-ox2-512;x<W;x+=512)for(let y=-128-oy;y<H;y+=256)c.drawImage(m,x,y,512,256);c.globalAlpha=1;}
  // dust motes catching the dawn light
  if(pass==='top'&&S.motes>.02){c.globalCompositeOperation='lighter';for(let i=0;i<46;i++){const x=(i*157.3+t*(6+i%5))%W,y=(i*89.7+Math.sin(t*.3+i)*30+H)%H,tw=.5+.5*Math.sin(t*1.7+i*1.3);
      c.fillStyle=rgba(S.sun[1],.35*S.motes*tw);c.beginPath();c.arc(x,y,.8+(i%3)*.5,0,TAU);c.fill();}}
  if(pass==='top'&&S.vig>.01){c.globalCompositeOperation='source-over';const v=c.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,W*.7);v.addColorStop(0,'rgba(6,4,14,0)');v.addColorStop(1,`rgba(6,4,14,${S.vig})`);c.fillStyle=v;c.fillRect(0,0,W,H);}
  c.restore();}
// a small clock beside the round counter
setInterval(()=>{try{const el=document.getElementById('skyClock');if(!G){if(el)el.remove();return;}let e=el;
  if(!e){const host=document.querySelector('#hudWave')||document.querySelector('[data-tip^="Round"]');if(!host)return;e=document.createElement('span');e.id='skyClock';host.insertAdjacentElement('afterend',e);}
  const txt=skyClockText(SKY.h);if(e.textContent!==txt){e.textContent=txt;e.dataset.tip=SKY.h<22?'Dusk on the Strip':SKY.h<25.4?'Night on the Strip':SKY.h<28.8?'The small hours':'Dawn is coming';}}catch(err){}},500);
{const st=document.createElement('style');st.textContent=`#skyClock{font:400 12px var(--head);color:#c4b5fd;margin-left:8px;opacity:.85;letter-spacing:.04em;white-space:nowrap}`;document.head.appendChild(st);}
