'use strict';
/* ============ ALL IN — Megaways: six reels, 2–7 symbols each, cascades with a climbing multiplier,
   and the bonus: land four BONUS chips to spin the Big Wheel, then free spins where the
   multiplier never resets, wild reels crash in, and you can gamble the lot on a card. ============ */

/* ---------- the maths (pure: no DOM, used by the sim in tools/) ----------
   Like the Big Time Gaming originals: six reels of 2–7 (reels 2–5 show 2–6 plus one from the
   horizontal top reel, so 117,649 ways at most), wins from the left in ways, Reactions (cascades),
   wilds only on the top reel, BONUS scatters only on the main reels. The base game has no
   multiplier; in free spins it climbs +1 per Reaction and never resets. */
const MW_SYMS={ten:['10','#3b82f6',10],jack:['J','#10b981',10],queen:['Q','#ec4899',10],king:['K','#f59e0b',9],ace:['A','#ef4444',9],
  cherry:['cherry','#e11d48',6],bell:['bell','#f5b301',5],bar:['BAR','#1b1b22',4],seven:['7','#ef4444',2],wild:['WILD','#ff3d9a',0],bonus:['BONUS','#ffd34d',0]};
const MW_PAY={ten:[.04,.08,.16,.3],jack:[.04,.08,.16,.3],queen:[.05,.1,.2,.35],king:[.06,.12,.25,.45],ace:[.07,.14,.3,.55],
  cherry:[.1,.2,.4,.8],bell:[.15,.3,.6,1.2],bar:[.25,.5,1,2],seven:[.5,1,2.5,6]};
const MW_CFG={bet:20,scale:.36,scatW:3.8,fsScatW:2,topWild:9,fsTopWild:14,wildReel:.15,fsScale:.165,baseCap:150,bonusCap:300,bonusMin:5,threePay:1,gambleMax:3,extraSpins:4,retrig3:5,retrig4:10,buy:20};
const MW_BET=MW_CFG.bet;
// the Big Wheel: twelve equal wedges. [free spins, starting multiplier, label, colour, wild reel every spin]
const MW_WHEEL=[[8,1,'8 SPINS','#7c3aed'],[10,2,'10 · ×2','#0ea5e9'],[8,3,'8 · ×3','#16a34a'],[12,1,'12 SPINS','#f59e0b'],[10,1,'10 SPINS','#db2777'],[8,5,'8 · ×5','#dc2626'],
  [15,1,'15 SPINS','#7c3aed'],[8,2,'8 · ×2','#0ea5e9'],[10,3,'10 · ×3','#16a34a'],[8,1,'8 SPINS','#f59e0b'],[12,2,'12 · ×2','#db2777'],[10,2,'WILD WILD','#111827',true]];
const MW_REGULAR=Object.keys(MW_PAY);
function mwPickFrom(rng,ws){let tot=0;for(const k in ws)tot+=ws[k];let r=rng()*tot;for(const k in ws){if((r-=ws[k])<0)return k;}return 'ten';}
const MW_W_MAIN={},MW_W_MAINS={};for(const k of MW_REGULAR){MW_W_MAIN[k]=MW_SYMS[k][2];MW_W_MAINS[k]=MW_SYMS[k][2];}
function mwPickMain(rng,noScat,fs){const sw=fs?MW_CFG.fsScatW:MW_CFG.scatW;if(!noScat&&rng()<sw/(sw+91))return 'bonus';return mwPickFrom(rng,MW_W_MAIN);}
function mwPickTop(rng,fs){const wW=fs?MW_CFG.fsTopWild:MW_CFG.topWild;if(rng()<wW/(wW+91))return 'wild';return mwPickFrom(rng,MW_W_MAIN);}
// a grid is {m: six main reels (top to bottom), t: four top-reel cells over reels 2–5 (left to right)}
function mwFresh(rng,fs){const m=Array.from({length:6},(_,i)=>{const h=(i===0||i===5)?2+((rng()*6)|0):2+((rng()*5)|0);const col=[];let sc=false;for(let j=0;j<h;j++){const k=mwPickMain(rng,sc,fs);if(k==='bonus')sc=true;col.push(k);}return col;});
  return {m,t:Array.from({length:4},()=>mwPickTop(rng,fs))};}
// the columns that pay: reels 2–5 have their top-reel cell first
const mwCols=g=>g.m.map((col,i)=>i>=1&&i<=4?[g.t[i-1]].concat(col):col);
function mwWays(g){return mwCols(g).reduce((a,r)=>a*r.length,1);}
const mwScat=g=>g.m.reduce((a,r)=>a+(r.includes('bonus')?1:0),0);
function mwWins(g){const C=mwCols(g),out=[];for(const k of MW_REGULAR){if(!C[0].includes(k))continue;let n=0,ways=1;const cells=[];
    for(let i=0;i<6;i++){const hits=[];C[i].forEach((s,j)=>{if(s===k||s==='wild')hits.push(j);});if(!hits.length)break;n++;ways*=hits.length;cells.push(hits);}
    if(n>=3)out.push({k,n,ways,cells,pay:MW_PAY[k][n-3]*ways*MW_CFG.scale});}
  return out;}
// which cells won: per column (column indices, top cell first on reels 2–5)
function mwHits(g,wins){const C=mwCols(g),hit=C.map(()=>new Set());for(const w of wins)w.cells.forEach((h,i)=>h.forEach(j=>hit[i].add(j)));return hit;}
// Reactions: winners vanish; main reels drop from above, the top reel slides right-to-left
function mwCascade(g,wins,rng,fs){const hit=mwHits(g,wins);
  const m=g.m.map((col,i)=>{const off=i>=1&&i<=4?1:0;const keep=col.filter((_,j)=>!hit[i].has(j+off));let sc=keep.includes('bonus');const add=[];
    while(keep.length+add.length<col.length){const k=mwPickMain(rng,sc,fs);if(k==='bonus')sc=true;add.push(k);}return add.concat(keep);});
  const t=g.t.filter((_,j)=>!hit[j+1].has(0));while(t.length<4)t.push(mwPickTop(rng,fs));
  return {m,t};}
// one spin. opt.fs: free spins (multiplier carries in and out, wild reels can crash in)
function mwSpin(rng,opt){opt=opt||{};const fs=!!opt.fs;let g=mwFresh(rng,fs),wildReel=-1;
  if(fs&&(opt.forceWild||rng()<MW_CFG.wildReel)){wildReel=1+((rng()*4)|0);g.m[wildReel]=g.m[wildReel].map(()=>'wild');g.t[wildReel-1]='wild';}
  let mult=fs?(opt.mult||1):1,total=0,scat=mwScat(g);const scat0=scat;const steps=[{g,wins:[],mult}];
  for(let guard=0;guard<40;guard++){const wins=mwWins(g);if(!wins.length)break;const pay=wins.reduce((a,w)=>a+w.pay,0)*mult*(fs?MW_CFG.fsScale:1);total+=pay;
    const st=steps[steps.length-1];st.wins=wins;st.pay=pay;g=mwCascade(g,wins,rng,fs);if(fs)mult++;scat=Math.max(scat,mwScat(g));steps.push({g,wins:[],mult});}
  return {steps,total,scat,scat0,wildReel,endMult:mult};}
// the whole bonus, decided up front: the wheel, then every free spin. extra: spins from scatters beyond four
function mwBonus(rng,extra){const wi=(rng()*MW_WHEEL.length)|0,W=MW_WHEEL[wi];let left=W[0]+(extra||0),mult=W[1],total=0,n=0;const spins=[];
  while(left>0&&n<60){left--;n++;const s=mwSpin(rng,{fs:true,mult,forceWild:!!W[4]});mult=s.endMult;const re=s.scat0>=4?MW_CFG.retrig4:s.scat0>=3?MW_CFG.retrig3:0;left+=re;
    total+=s.total;spins.push({s,re,left,mult});if(total>=MW_CFG.bonusCap)break;}
  return {wi,extra:extra||0,spins,won:total,total:Math.max(MW_CFG.bonusMin,Math.min(MW_CFG.bonusCap,total))};}
// a base spin, settled: what it pays, and whether it opens the bonus
function mwPlay(rng){const s=mwSpin(rng);let total=Math.min(MW_CFG.baseCap,s.total);const trig=s.scat>=4;if(!trig&&s.scat===3)total+=MW_CFG.threePay;
  return {s,total,trig,bonus:trig?mwBonus(rng,(s.scat-4)*MW_CFG.extraSpins):null};}
/* @@ui */

/* ---------- sounds ---------- */
let MW_PITCH=0;
if(typeof FOLEY!=='undefined')Object.assign(FOLEY,{
  mwSpin(t){FX.sweep(t,300,2600,'bandpass',.1,.4,1.2);for(let i=0;i<6;i++)FX.click(t+i*.03,1600+i*200,4,.05,.03);},
  mwStop(t){FX.thump(t,150,55,.18,.1);FX.click(t,2200,5,.12,.03);},
  mwScat(t){const b=[1047,1319,1568,2093,2637][Math.min(4,MW_PITCH)];[b,b*1.5].forEach((f,i)=>Snd.tone(f,.35,'triangle',.08,0,i*.05));},
  mwTease(t){Snd.tone(196,1.3,'sawtooth',.03,2.6);Snd.tone(294,1.3,'sawtooth',.02,2.6);FX.sweep(t,500,5000,'bandpass',.05,1.3,2);},
  mwCasc(t){const b=440*Math.pow(2,Math.min(14,MW_PITCH)/12);[b,b*1.25,b*1.5].forEach((f,i)=>Snd.tone(f,.22,'square',.035,0,i*.045));FX.chip(t,.12);},
  mwPop(t){for(let i=0;i<5;i++)FX.click(t+i*.012,3000+Math.random()*2000,6,.1,.03);},
  mwWild(t){FX.sweep(t,6000,300,'bandpass',.2,.5,1.5);FX.thump(t+.05,120,40,.3,.35);Snd.tone(880,.4,'sawtooth',.04,.5,.02);},
  mwBonus(t){[523,659,784,1047,1319,1568,2093].forEach((f,i)=>Snd.tone(f,.4,'square',.045,0,i*.07));FX.thump(t,100,40,.3,.5);for(let i=0;i<20;i++)FX.chip(t+.3+i*.04,.12);},
  mwTick(t){FX.click(t,2600,8,.22,.025);},
  mwLand(t){[784,988,1175,1568].forEach((f,i)=>Snd.tone(f,.5,'triangle',.09,0,i*.09));},
  mwRetrig(t){[1175,1568,2093].forEach((f,i)=>Snd.tone(f,.3,'square',.05,0,i*.06));},
  mwBig(t){[392,523,659,784,1047].forEach((f,i)=>Snd.tone(f,.6,'sawtooth',.04,0,i*.11));for(let i=0;i<30;i++)FX.chip(t+.2+i*.05,.13);},
  mwFlip(t){FX.slide(t,.26);},
  mwBust(t){Snd.tone(330,.5,'sawtooth',.05,.4);Snd.tone(220,.6,'sawtooth',.04,.4,.1);}});

/* ---------- symbols: drawn as SVG so they fill whatever slot they land in ---------- */
const MW_SUIT={ten:'D',jack:'C',queen:'H',king:'S',ace:'H'};
const MW_RANKG={ten:['#bfdbfe','#3b82f6','#1e3a8a'],jack:['#a7f3d0','#10b981','#064e3b'],queen:['#fbcfe8','#ec4899','#831843'],king:['#fde68a','#f59e0b','#78350f'],ace:['#fecaca','#ef4444','#7f1d1d']};
(function(){const lg=(id,a,b,c)=>`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
  const defs=Object.entries(MW_RANKG).map(([k,c])=>lg('mwg-'+k,...c)).join('')+lg('mwg-gold','#fff3c4','#f5b301','#8a5a00')+lg('mwg-red','#ffb4b4','#ef4444','#7f1d1d')+lg('mwg-bar','#4b4b58','#1b1b22','#000')+lg('mwg-pink','#ffd0e8','#ff3d9a','#7a0a44')
    +`<radialGradient id="mwg-cherry" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ffb3c1"/><stop offset=".45" stop-color="#e11d48"/><stop offset="1" stop-color="#6b0420"/></radialGradient>`
    +`<radialGradient id="mwg-chip" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff3c4"/><stop offset=".55" stop-color="#e0b040"/><stop offset="1" stop-color="#8a5a00"/></radialGradient>`
    +`<radialGradient id="mwg-wildchip" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#6d2a8c"/><stop offset="1" stop-color="#1c0628"/></radialGradient>`;
  const el=document.createElement('div');el.style.cssText='position:absolute;width:0;height:0;overflow:hidden';el.innerHTML=`<svg width="0" height="0" aria-hidden="true"><defs>${defs}</defs></svg>`;
  (document.body||document.documentElement).appendChild(el);})();
const MW_SVG={};
function mwSym(k){if(MW_SVG[k])return MW_SVG[k];let b;const ol='stroke="#1a0b24" stroke-linejoin="round" paint-order="stroke"';
  if(MW_SUIT[k]){const t=MW_SYMS[k][0],suit=MW_SUIT[k],red=suit==='H'||suit==='D';
    b=`<text x="50" y="${t==='10'?64:68}" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-weight="900" font-size="${t==='10'?56:70}" ${t==='10'?'textLength="78" lengthAdjust="spacingAndGlyphs"':''} fill="url(#mwg-${k})" ${ol} stroke-width="8">${t}</text>
      <g transform="translate(39 72) scale(.22)"><path d="${SUIT_PATH[suit]}" fill="${red?'#e11d48':'#1b1b22'}" stroke="#fff8e8" stroke-width="12" paint-order="stroke"/></g>`;}
  else if(k==='cherry')b=`<path d="M38 62Q44 30 64 14M64 62Q62 36 64 14" stroke="#14532d" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M38 62Q44 30 64 14M64 62Q62 36 64 14" stroke="#4ade80" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M64 15Q80 6 90 18Q76 26 64 15Z" fill="#22c55e" stroke="#14532d" stroke-width="3"/><circle cx="35" cy="70" r="20" fill="url(#mwg-cherry)" stroke="#3b0412" stroke-width="4"/><circle cx="66" cy="70" r="20" fill="url(#mwg-cherry)" stroke="#3b0412" stroke-width="4"/>
      <ellipse cx="28" cy="63" rx="6" ry="4" fill="#fff" opacity=".7"/><ellipse cx="59" cy="63" rx="6" ry="4" fill="#fff" opacity=".7"/>`;
  else if(k==='bell')b=`<path d="M50 10Q55 10 55 16Q76 22 76 50Q76 66 88 76L12 76Q24 66 24 50Q24 22 45 16Q45 10 50 10Z" fill="url(#mwg-gold)" stroke="#5b3a06" stroke-width="5" stroke-linejoin="round"/>
      <rect x="10" y="74" width="80" height="9" rx="4" fill="#e0b040" stroke="#5b3a06" stroke-width="4"/><circle cx="50" cy="88" r="8" fill="url(#mwg-gold)" stroke="#5b3a06" stroke-width="4"/><path d="M36 30Q32 44 33 58" stroke="#fff8d0" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`;
  else if(k==='bar')b=`<rect x="6" y="28" width="88" height="44" rx="9" fill="url(#mwg-bar)" stroke="#e0b040" stroke-width="5"/><rect x="12" y="34" width="76" height="32" rx="5" fill="none" stroke="#ffd34d" stroke-width="1.5" opacity=".5"/>
      <text x="50" y="62" text-anchor="middle" font-family="Impact,'Arial Black',sans-serif" font-size="31" fill="url(#mwg-gold)" stroke="#3b2206" stroke-width="3" paint-order="stroke" letter-spacing="2">BAR</text>`;
  else if(k==='seven')b=`<text x="50" y="86" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="104" fill="none" stroke="#3b0a0a" stroke-width="14" stroke-linejoin="round">7</text><text x="50" y="86" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="104" fill="url(#mwg-red)" stroke="#ffd34d" stroke-width="5" stroke-linejoin="round" paint-order="stroke">7</text>`;
  else if(k==='wild')b=`<circle cx="50" cy="50" r="44" fill="url(#mwg-wildchip)" stroke="#ff3d9a" stroke-width="5"/><circle cx="50" cy="50" r="38" fill="none" stroke="#ff8cc6" stroke-width="5" stroke-dasharray="9 7" opacity=".8"/>
      <g transform="translate(29 14) scale(.42)"><path d="${SUIT_PATH.S}" fill="url(#mwg-pink)" stroke="#fff0f7" stroke-width="7" paint-order="stroke"/></g>
      <rect x="12" y="60" width="76" height="22" rx="6" fill="#ff3d9a" stroke="#4a0328" stroke-width="3"/><text x="50" y="77" text-anchor="middle" font-family="Impact,'Arial Black',sans-serif" font-size="19" fill="#fff" letter-spacing="1.5">WILD</text>`;
  else if(k==='bonus')b=`<circle cx="50" cy="50" r="45" fill="#b8860b" stroke="#5b3a06" stroke-width="4"/><circle cx="50" cy="50" r="40" fill="none" stroke="#fff3c4" stroke-width="9" stroke-dasharray="11 10"/>
      <circle cx="50" cy="50" r="31" fill="url(#mwg-chip)" stroke="#5b3a06" stroke-width="3"/><text x="50" y="57" text-anchor="middle" font-family="Impact,'Arial Black',sans-serif" font-size="19" fill="#3b2206" letter-spacing=".5">BONUS</text>`;
  return MW_SVG[k]=`<svg class="mws" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">${b}</svg>`;}
const MW_TALL=['ten','jack','queen','king','ace','cherry','bell','bar','seven'];

/* ---------- the panel ---------- */
const mwBuyPrice=()=>MW_CFG.buy*MW_BET;
const mwWait=ms=>new Promise(r=>setTimeout(r,ms*(ARC.mw&&ARC.mw.turbo?.5:1)));
function mwIdleGrid(){let g;do g=mwFresh(Math.random);while(mwScat(g)>2);return g;}
function mwState(){return ARC.mw||(ARC.mw={g:mwIdleGrid(),mult:1,busy:false,mode:'base',run:0,owed:0,turbo:false,win:0,fsInfo:null,
  last:'Wins pay left to right in ways, then explode for a Reaction. Four <b class="gold">BONUS</b> chips spin the Big Wheel.'});}
function renderMW(){const B=$('#arcBody');if(!B)return;const M=mwState();
  const fs=M.mode==='fs'||M.mode==='fsend';
  $('#slotPanel').classList.toggle('mw-fs',fs);$('#slotPanel').classList.toggle('mw-bonus',M.mode!=='base');
  B.innerHTML=`<div class="mw">
    <div class="mwhud"><div class="mwlogo"><b>MEGAWAYS</b><small>up to 117,649 ways</small></div><div class="mwfs" id="mwFs">${M.fsInfo?mwFsHTML(M):''}</div></div>
    <div class="mwstage"><div class="mwgrid" id="mwGrid">
      <div class="mwcorner l"><b id="mwWays">${mwFmtWays(mwWays(M.g))}</b><small>ways</small></div>
      <div class="mwtopreel" id="mwTopR">${mwTopCells(M.g.t)}</div>
      <div class="mwcorner r" id="mwMult">${mwMultHTML(M,fs)}</div>
      ${M.g.m.map((r,i)=>`<div class="mwreel" data-r="${i}">${mwCells(r)}</div>`).join('')}</div><div class="mwover" id="mwOver"></div></div>
    <div class="mwbar"><div class="mwwin"><small>${fs?'bonus win':'win'}</small><b id="mwWin">${fmt(M.win)}</b></div><div class="mwmsg" id="mwMsg">${M.last}</div></div>
    <div class="mwctl"><button class="pb mwturbo ${M.turbo?'on':''}" id="mwTurbo" title="Faster spins">${icon('zap')}Turbo</button>
      <button class="pb main mwspin" id="mwSpin" ${M.busy||G.me.chips<MW_BET?'disabled':''}>Spin · ${MW_BET}</button>
      <button class="pb mwbuy" id="mwBuy" ${M.busy||G.me.chips<mwBuyPrice()?'disabled':''} title="Go straight to the Big Wheel">Buy bonus · ${fmt(mwBuyPrice())}</button></div></div>`;
  $('#mwSpin').addEventListener('click',()=>mwGo(false));
  $('#mwBuy').addEventListener('click',mwBuyClick);
  $('#mwTurbo').addEventListener('click',()=>{M.turbo=!M.turbo;Snd.play('click');$('#mwTurbo').classList.toggle('on',M.turbo);});
  if(M.overlay)M.overlay();}
const mwFmtWays=n=>n.toLocaleString('en-GB');
const mwMultHTML=(M,fs)=>fs||M.mode==='gamble'?`<small>multiplier</small><b class="mm">×${M.mult}</b>`:`<small>bet</small><b>${MW_BET}</b>`;
// hits come per column (reels 2–5: index 0 is the top-reel cell); off shifts them onto the main reel
function mwCells(col,o,off){o=o||{};off=off||0;return col.map((k,j)=>{const h=o.hit&&o.hit.has(j+off),p=o.pop&&o.pop.has(j+off);
  return `<div class="mwc s-${k}${h?' hit':''}${o.hit&&!h?' dim':''}${o.drop&&j<o.drop?' drop':''}${o.land?' land':''}${p?' pop':''}" style="--d:${o.drop?(o.drop-j)*45:0}ms">${mwSym(k)}</div>`;}).join('');}
function mwTopCells(t,o){o=o||{};return t.map((k,j)=>{const h=o.hit&&o.hit[j+1]&&o.hit[j+1].has(0),p=o.pop&&o.pop[j+1]&&o.pop[j+1].has(0);
  return `<div class="mwc s-${k}${h?' hit':''}${o.hit&&!h?' dim':''}${p?' pop':''}${o.land?' land':''}${o.dx&&o.dx[j]?' slide':''}" style="--dx:${o.dx?o.dx[j]:0}">${mwSym(k)}</div>`;}).join('');}
function mwReel(i){return document.querySelector(`#mwGrid .mwreel[data-r="${i}"]`);}
function mwPaintReel(i,g,o){o=o||{};const el=mwReel(i);if(!el)return;el.className='mwreel'+(o.cls?' '+o.cls:'');el.innerHTML=mwCells(g.m[i],{hit:o.hit&&o.hit[i],pop:o.pop&&o.pop[i],drop:o.drop&&o.drop[i],land:o.land},i>=1&&i<=4?1:0);}
function mwPaintTop(g,o){o=o||{};const el=$('#mwTopR');if(!el)return;el.className='mwtopreel'+(o.cls?' '+o.cls:'');el.innerHTML=mwTopCells(g.t,o);}
function mwPaintAll(g,o){o=o||{};for(let i=0;i<6;i++)mwPaintReel(i,g,Object.assign({},o,{cls:o.wild===i?'wildreel':''}));mwPaintTop(g,o);}
function mwStrip(i){const el=mwReel(i);if(!el)return;const s=[];for(let k=0;k<12;k++)s.push(MW_TALL[(Math.random()*MW_TALL.length)|0]);
  el.className='mwreel spinning';el.innerHTML=`<div class="mwstrip" style="animation-delay:-${(Math.random()*.2).toFixed(2)}s">${s.concat(s).map(k=>`<div class="mwc">${mwSym(k)}</div>`).join('')}</div>`;}
function mwStripTop(){const el=$('#mwTopR');if(!el)return;const s=[];for(let k=0;k<8;k++)s.push(MW_TALL.concat(['wild'])[(Math.random()*10)|0]);
  el.className='mwtopreel spinning';el.innerHTML=`<div class="mwstrip">${s.concat(s).map(k=>`<div class="mwc">${mwSym(k)}</div>`).join('')}</div>`;}
function mwSet(id,html){const e=$('#'+id);if(e)e.innerHTML=html;}
function mwBump(id){const e=$('#'+id);if(e){e.classList.remove('bump');void e.offsetWidth;e.classList.add('bump');}}
function mwFsHTML(M){const f=M.fsInfo;return `<small>free spins</small><b>${f.left}</b><em>left</em>`;}
function mwShowWin(M,v){M.win=v;mwSet('mwWin',fmt(v));mwBump('mwWin');}
function mwShowMult(M,m){M.mult=m;const fs=M.mode==='fs';mwSet('mwMult',mwMultHTML(M,fs));if(fs)mwBump('mwMult');}
function mwMsg(M,t){M.last=t;mwSet('mwMsg',t);}
function mwOver(M,fn){M.overlay=fn||null;document.querySelectorAll('#slotPanel .mwfloat').forEach(f=>f.remove());const o=$('#mwOver');if(!o)return;if(!fn){o.className='mwover';o.innerHTML='';return;}fn();}
function mwFloat(text,cls){const st=document.querySelector('#slotPanel .mwstage');if(!st)return;const d=document.createElement('div');d.className='mwfloat '+(cls||'');d.innerHTML=text;st.appendChild(d);setTimeout(()=>d.remove(),1400);}
function mwWinName(w){const d=MW_SYMS[w.k];const n=d[0]==='cherry'?'Cherries':d[0]==='bell'?'Bells':d[0]==='BAR'?'Bars':d[0]==='7'?'Sevens':d[0]==='10'?'Tens':{J:'Jacks',Q:'Queens',K:'Kings',A:'Aces'}[d[0]];return `${n} on ${w.n} reels · ${fmt(w.ways)} way${w.ways>1?'s':''}`;}
const mwTier=x=>x>=100?['LEGENDARY WIN','t4']:x>=50?['EPIC WIN','t3']:x>=25?['MEGA WIN','t2']:x>=10?['BIG WIN','t1']:null;

// a run is one paid spin (and its bonus); closing the panel settles anything still owed
function mwAlive(M,id){return ARC.mw===M&&M.run===id&&!!$('#mwGrid');}
function mwSettle(){const M=ARC.mw;if(!M||!M.busy)return;M.run++;if(M.owed>0){const v=Math.round(M.owed);G.me.chips+=v;gambleTally(v);G.stats.earned+=v;gameLog(`Megaways: ${fmt(v)} chips paid out.`,'good');}
  M.owed=0;M.busy=false;M.mode='base';M.fsInfo=null;M.overlay=null;M.mult=1;}
{const _tog=toggleArcade;toggleArcade=function(force,tab){const open=!!$('#slotPanel'),on=force!=null?force:!open;if(!on)mwSettle();return _tog(force,tab);};}

let MW_BUY_ARM=0;
function mwBuyClick(){const M=mwState();if(M.busy||G.me.chips<mwBuyPrice())return;const b=$('#mwBuy');
  if(Date.now()-MW_BUY_ARM>3000){MW_BUY_ARM=Date.now();b.textContent='Confirm · '+fmt(mwBuyPrice());b.classList.add('arm');Snd.play('click');setTimeout(()=>{const x=$('#mwBuy');if(x&&!M.busy){x.textContent='Buy bonus · '+fmt(mwBuyPrice());x.classList.remove('arm');}},3000);return;}
  MW_BUY_ARM=0;mwGo(true);}

async function mwGo(buy){const M=mwState();const cost=buy?mwBuyPrice():MW_BET;if(M.busy||G.me.chips<cost)return;
  G.me.chips-=cost;gambleTally(-cost);G.stats.mw=(G.stats.mw||0)+1;M.busy=true;const id=++M.run;M.mode='base';M.fsInfo=null;M.win=0;M.mult=1;mwOver(M,null);
  const play=buy?{s:null,total:0,trig:true,bonus:mwBonus(Math.random,0)}:mwPlay(Math.random);
  M.owed=play.total*MW_BET+(play.bonus?play.bonus.total*MW_BET:0);
  renderMW();
  if(!buy){const base=await mwAnimSpin(M,id,play.s,false,MW_CFG.baseCap);if(base==null)return;
    let pay=Math.round(play.total*MW_BET);if(!play.trig&&play.s.scat===3){mwMsg(M,`Three <b class="gold">BONUS</b> chips · so close! +${MW_CFG.threePay*MW_BET}`);}
    if(pay){G.me.chips+=pay;gambleTally(pay);G.stats.earned+=pay;M.owed-=pay;mwShowWin(M,pay);
      if(!play.trig){const t=mwTier(play.total);if(t){await mwBigWin(M,id,pay,t);if(!mwAlive(M,id))return;}
        if(play.total>=10){gameLog(`Megaways: a ${fmt(pay)}-chip win.`,'good');if(typeof Meta!=='undefined')Meta.ach('megaways');}
        if(play.s.scat!==3)mwMsg(M,`Total win: <b class="gold">${fmt(pay)}</b> chips${play.s.steps.length>2?` after ${play.s.steps.length-1} Reactions`:''}`);}}
    else if(!play.trig&&play.s.scat!==3)mwMsg(M,'No win this time');
    if(!play.trig){M.busy=false;M.owed=0;renderMW();return;}}
  await mwBonusRun(M,id,play,buy);}

// spin the reels, stop them left to right, then play out the Reactions. resolves to the raw win (in bets) or null if cancelled
async function mwAnimSpin(M,id,s,fs,cap){MW_PITCH=0;mwShowMult(M,s.steps[0].mult);
  for(let i=0;i<6;i++)mwStrip(i);mwStripTop();Snd.play('mwSpin');mwMsg(M,fs?'Free spin…':'Spinning…');mwSet('mwWays','?');
  const g0=s.steps[0].g;let scat=0,tease=false;await mwWait(fs?260:380);if(!mwAlive(M,id))return null;
  mwPaintTop(g0,{land:true});Snd.play('mwStop');await mwWait(fs?90:120);
  for(let i=0;i<6;i++){if(!mwAlive(M,id))return null;
    if(!fs&&!tease&&scat>=3&&i<6){tease=true;Snd.play('mwTease');for(let j=i;j<6;j++){const e=mwReel(j);if(e)e.classList.add('tease');}mwMsg(M,'<b class="gold">One more BONUS chip…</b>');}
    if(tease)await mwWait(700);if(!mwAlive(M,id))return null;
    const wr=s.wildReel===i;mwPaintReel(i,g0,{land:true,cls:wr?'wildreel':''});Snd.play(wr?'mwWild':'mwStop');
    if(wr)mwFloat('WILD REEL!','wildfl');
    if(g0.m[i].includes('bonus')){scat++;MW_PITCH=scat-1;Snd.play('mwScat');const e=mwReel(i);if(e)e.querySelectorAll('.mwc.s-bonus').forEach(c=>c.classList.add('glow'));}
    await mwWait(wr?420:fs?110:150);}
  mwSet('mwWays',mwFmtWays(mwWays(g0)));mwBump('mwWays');
  let raw=0;const base=M.win;
  for(let k=0;k<s.steps.length;k++){const st=s.steps[k];if(!st.wins.length)break;if(!mwAlive(M,id))return null;
    const hit=mwHits(st.g,st.wins);mwPaintAll(st.g,{hit,wild:k===0?s.wildReel:-1});
    raw+=st.pay;const amt=Math.round(Math.min(cap,raw)*MW_BET);MW_PITCH=k;Snd.play('mwCasc');
    mwFloat(`+${fmt(Math.round(st.pay*MW_BET))}${st.mult>1?`<small>×${st.mult}</small>`:''}`,'amt');
    mwMsg(M,st.wins.map(mwWinName).slice(0,2).join('<br>')+(st.wins.length>2?` <small>+${st.wins.length-2} more</small>`:''));
    mwShowWin(M,base+amt);await mwWait(760);if(!mwAlive(M,id))return null;
    mwPaintAll(st.g,{pop:hit,wild:k===0?s.wildReel:-1});Snd.play('mwPop');await mwWait(230);if(!mwAlive(M,id))return null;
    // the next grid: main reels drop in from above, the top reel slides in from the right
    const nx=s.steps[k+1],drop=st.g.m.map((_,i)=>{const off=i>=1&&i<=4?1:0;let n=0;hit[i].forEach(j=>{if(j>=off)n++;});return n;});
    const dx=[];let gone=0;for(let j=0;j<4;j++){if(hit[j+1].has(0))gone++;}{let removedLeft=0,slot=0;for(let j=0;j<4;j++){if(hit[j+1].has(0)){removedLeft++;continue;}dx[slot++]=removedLeft;}for(;slot<4;slot++)dx[slot]=gone;}
    for(let i=0;i<6;i++)mwPaintReel(i,nx.g,{drop});mwPaintTop(nx.g,{dx});
    mwSet('mwWays',mwFmtWays(mwWays(nx.g)));if(fs)mwShowMult(M,nx.mult);
    if(nx.g.m.some((c,i)=>c.includes('bonus')&&!st.g.m[i].includes('bonus'))){Snd.play('mwScat');}
    await mwWait(440);}
  if(!mwAlive(M,id))return null;const last=s.steps[s.steps.length-1].g;mwPaintAll(last,{});
  if(!fs)M.g=last;return raw;}

async function mwBigWin(M,id,amount,t){const o=$('#mwOver');if(!o)return;Snd.play('mwBig');for(let i=0;i<70;i++)confetti();
  let skip=false;const draw=v=>`<div class="mwbig ${t[1]}"><div class="mwbigt">${t[0]}</div><div class="mwbign">${fmt(v)}</div><small>chips · tap to continue</small><div class="mwcoins">${Array.from({length:18},(_,i)=>`<i style="left:${(i*5.7+Math.random()*4)%100}%;animation-delay:${(Math.random()*1.2).toFixed(2)}s;animation-duration:${(1.1+Math.random()*.8).toFixed(2)}s"></i>`).join('')}</div></div>`;
  M.overlay=()=>{const x=$('#mwOver');if(x){x.className='mwover on';x.innerHTML=draw(amount);}};
  o.className='mwover on';o.innerHTML=draw(0);o.onclick=()=>skip=true;
  const t0=performance.now(),dur=1800;await new Promise(res=>{const step=()=>{if(!mwAlive(M,id))return res();const u=Math.min(1,(performance.now()-t0)/dur),v=skip?amount:Math.round(amount*(1-Math.pow(1-u,3)));const n=document.querySelector('#mwOver .mwbign');if(n)n.textContent=fmt(v);if(u<1&&!skip){if(Math.random()<.4)Snd.play('chips');requestAnimationFrame(step);}else res();};step();});
  const until=performance.now()+(skip?250:1400);while(performance.now()<until&&!skip&&mwAlive(M,id))await new Promise(r=>setTimeout(r,60));
  o.onclick=null;if(mwAlive(M,id))mwOver(M,null);}

/* ---------- the bonus: splash, the Big Wheel, free spins, then double or nothing ---------- */
async function mwBonusRun(M,id,play,buy){const B=play.bonus,W=MW_WHEEL[B.wi];
  if(!buy){const e=$('#mwGrid');if(e)e.querySelectorAll('.mwc.s-bonus').forEach(c=>c.classList.add('glow','big'));}
  Snd.play('mwBonus');for(let i=0;i<90;i++)confetti();if(typeof Meta!=='undefined')Meta.ach('wildride');
  M.mode='wheel';$('#slotPanel').classList.add('mw-bonus');
  mwOver(M,()=>{const o=$('#mwOver');o.className='mwover on';o.innerHTML=`<div class="mwsplash"><b>BONUS!</b><small>${buy?'Bought your way in. Spin the Big Wheel.':(B.extra?(4+B.extra/MW_CFG.extraSpins)+' BONUS chips: +'+B.extra+' extra spins. ':'Four BONUS chips. ')+'Spin the Big Wheel.'}</small></div>`;});
  await mwWait(1700);if(!mwAlive(M,id))return;
  // the wheel
  let ang=0,spun=false;
  const wheel=()=>{const o=$('#mwOver');if(!o)return;o.className='mwover on wheel';o.innerHTML=`<div class="mwwheel"><canvas id="mwWheel" width="520" height="520"></canvas><i class="mwptr"></i>
      <button class="pb main" id="mwWheelGo" ${spun?'disabled':''}>${spun?'Spinning…':'Spin the wheel'}</button></div>`;
    mwDrawWheel(ang,-1,performance.now()/1000);const b=$('#mwWheelGo');if(b)b.onclick=()=>go&&go();};
  let go=null;const clicked=new Promise(res=>{go=()=>{if(spun)return;spun=true;res();};});
  mwOver(M,wheel);mwMsg(M,'Every wedge is a way into free spins. <b class="gold">WILD WILD</b> drops a wild reel on every spin.');
  const idle=()=>{if(!spun&&mwAlive(M,id)&&$('#mwWheel')){mwDrawWheel(ang,-1,performance.now()/1000);requestAnimationFrame(idle);}};idle();
  await clicked;if(!mwAlive(M,id))return;const btn=$('#mwWheelGo');if(btn){btn.disabled=true;btn.textContent='Spinning…';}
  const seg=TAU/MW_WHEEL.length,target=-(B.wi+.5)*seg+(Math.random()-.5)*seg*.7,turns=TAU*(5+Math.floor(Math.random()*2));
  const a0=ang,a1=a0-turns-(((a0-target)%TAU)+TAU)%TAU,dur=4600*(M.turbo?.6:1),t0=performance.now();let lastW=-1;
  await new Promise(res=>{const step=()=>{if(!mwAlive(M,id))return res();const u=Math.min(1,(performance.now()-t0)/dur),e=1-Math.pow(1-u,4);ang=a0+(a1-a0)*e;
    const w=((Math.floor((-ang)/seg)%MW_WHEEL.length)+MW_WHEEL.length)%MW_WHEEL.length;if(w!==lastW){lastW=w;Snd.play('mwTick');}
    if($('#mwWheel'))mwDrawWheel(ang,-1,performance.now()/1000);if(u<1)requestAnimationFrame(step);else res();};step();});
  if(!mwAlive(M,id))return;Snd.play('mwLand');
  const flash=()=>{if(mwAlive(M,id)&&$('#mwWheel')&&M.mode==='wheel'){mwDrawWheel(ang,B.wi,performance.now()/1000);requestAnimationFrame(flash);}};flash();
  const desc=W[4]?`${W[0]} free spins, a wild reel on every one, starting at ×${W[1]}`:`${W[0]} free spins starting at ×${W[1]}`;
  mwFloat(W[4]?'WILD WILD!':W[2],'wheelfl');mwMsg(M,`<b class="gold">${desc}</b>${B.extra?`, plus ${B.extra} more for the extra BONUS chips`:''}. The multiplier never resets.`);
  await mwWait(2200);if(!mwAlive(M,id))return;
  // free spins
  M.mode='fs';M.overlay=null;M.win=0;M.fsInfo={left:W[0]+B.extra};M.mult=W[1];renderMW();
  mwMsg(M,`<b class="gold">FREE SPINS</b> · every Reaction adds +1 to the multiplier, and it never resets. 3 BONUS chips: +5 spins`);await mwWait(900);
  let raw=0;
  for(let j=0;j<B.spins.length;j++){if(!mwAlive(M,id))return;const sp=B.spins[j];M.fsInfo.left=(j===0?W[0]+B.extra:B.spins[j-1].left)-1;mwSet('mwFs',mwFsHTML(M));mwBump('mwFs');
    M.win=Math.round(Math.min(MW_CFG.bonusCap,raw)*MW_BET);const r=await mwAnimSpin(M,id,sp.s,true,Math.max(0,MW_CFG.bonusCap-raw));if(r==null)return;raw+=r;
    mwShowWin(M,Math.round(Math.min(MW_CFG.bonusCap,raw)*MW_BET));
    if(sp.re){M.fsInfo.left+=sp.re;mwSet('mwFs',mwFsHTML(M));mwBump('mwFs');Snd.play('mwRetrig');mwFloat(`+${sp.re} FREE SPINS`,'wildfl');mwMsg(M,`${sp.s.scat0} BONUS chips · <b class="gold">+${sp.re} free spins</b>`);await mwWait(900);}
    if(raw>=MW_CFG.bonusCap){mwFloat('MAX WIN!','wheelfl');Snd.play('mwBig');await mwWait(1200);break;}
    await mwWait(r>0?450:250);}
  if(!mwAlive(M,id))return;
  const total=Math.round(B.total*MW_BET),topped=B.won<MW_CFG.bonusMin;M.mode='fsend';mwShowWin(M,total);
  mwMsg(M,`Free spins paid <b class="gold">${fmt(total)}</b> chips${topped?` (topped up to the ${MW_CFG.bonusMin}× minimum)`:''}`);
  const t=mwTier(B.total);if(t){await mwBigWin(M,id,total,t);if(!mwAlive(M,id))return;}
  await mwGamble(M,id,total);}

function mwDrawWheel(ang,hi,now){const cv=$('#mwWheel');if(!cv)return;const c=cv.getContext('2d'),S=cv.width,R=S/2-16,n=MW_WHEEL.length,seg=TAU/n;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,S,S);c.translate(S/2,S/2);
  c.fillStyle='#2a1708';c.beginPath();c.arc(0,0,R+14,0,TAU);c.fill();c.strokeStyle='#e0b040';c.lineWidth=6;c.stroke();
  for(let k=0;k<24;k++){const a=k/24*TAU,on=((Math.floor(now*8)+k)%3)===0;c.fillStyle=on?'#fff7cc':'#7a5a0e';c.beginPath();c.arc(Math.cos(a)*(R+7),Math.sin(a)*(R+7),4.5,0,TAU);c.fill();}
  c.save();c.rotate(ang-Math.PI/2);
  for(let i=0;i<n;i++){const W=MW_WHEEL[i],a=i*seg;c.fillStyle=W[3];c.beginPath();c.moveTo(0,0);c.arc(0,0,R,a,a+seg);c.closePath();c.fill();
    if(i===hi&&Math.floor(now*6)%2){c.fillStyle='rgba(255,255,255,.45)';c.fill();}
    c.strokeStyle='#e0b040';c.lineWidth=2.5;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*R,Math.sin(a)*R);c.stroke();
    c.save();c.rotate(a+seg/2);c.textAlign='right';c.textBaseline='middle';c.fillStyle='#fff';c.font=`400 ${W[4]?24:26}px Bungee, Impact, sans-serif`;c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=4;
    const [a1,b1]=W[2].split(' · ');if(b1){c.fillText(a1,R-14,-13);c.fillStyle='#fde68a';c.fillText(b1,R-14,15);}else{const p=W[2].split(' ');c.fillText(p[0],R-14,-13);c.fillStyle=W[4]?'#ff8cc6':'#fde68a';c.fillText(p.slice(1).join(' '),R-14,15);}c.restore();}
  c.restore();
  const g=c.createRadialGradient(-10,-10,4,0,0,62);g.addColorStop(0,'#fff3c4');g.addColorStop(1,'#b8860b');c.fillStyle=g;c.beginPath();c.arc(0,0,58,0,TAU);c.fill();c.strokeStyle='#5b3a06';c.lineWidth=4;c.stroke();
  c.fillStyle='#3b2206';c.font='400 26px Bungee, Impact, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('ALL',0,-12);c.fillText('IN',0,16);}

const MW_SUITS='SHDC';
async function mwGamble(M,id,amount){let owed=amount,round=0;const cap=MW_CFG.bonusCap*MW_BET;M.mode='gamble';M.owed=owed;
  let card=null,res=null,result='';
  const draw=()=>{const o=$('#mwOver');if(!o)return;o.className='mwover on gamble';
    const can=round<MW_CFG.gambleMax&&owed>0&&owed*2<=cap&&res!=='busy';
    o.innerHTML=`<div class="mwgam"><div class="mwgamt">${owed>0?'Double or nothing?':'Bust!'}</div>
      <div class="mwgamc ${card?'flip':''}">${card?cardHTML(card,0,'big'):'<div class="card back big"></div>'}</div>
      <div class="mwgamr">${result||`Pick a colour. Right doubles it: <b class="gold">${fmt(owed*2)}</b>`}</div>
      <div class="mwgamb">${owed>0?`<button class="pb red" id="mwRed" ${can?'':'disabled'}>Red</button><button class="pb main" id="mwCol">Collect ${fmt(owed)}</button><button class="pb blk" id="mwBlk" ${can?'':'disabled'}>Black</button>`:`<button class="pb main" id="mwCol">Back to the reels</button>`}</div>
      <small>${owed>0?`Gamble ${round}/${MW_CFG.gambleMax} · a fair 50/50`:''}</small></div>`;
    const r=$('#mwRed'),b=$('#mwBlk'),c=$('#mwCol');if(r)r.onclick=()=>pick('red');if(b)b.onclick=()=>pick('black');if(c)c.onclick=collect;};
  const pick=async col=>{if(res==='busy'||owed<=0)return;res='busy';card=null;result='…';draw();Snd.play('mwFlip');await mwWait(450);if(!mwAlive(M,id))return;
    card={v:2+((Math.random()*13)|0),s:MW_SUITS[(Math.random()*4)|0]};const red=card.s==='H'||card.s==='D';round++;
    if((col==='red')===red){owed*=2;M.owed=owed;result=`<b class="gold">Doubled!</b> ${fmt(owed)} chips`;Snd.play('win');mwShowWin(M,owed);if(round>=MW_CFG.gambleMax&&typeof Meta!=='undefined')Meta.ach('doubleup');}
    else{owed=0;M.owed=0;result='The house takes it.';Snd.play('mwBust');mwShowWin(M,0);}
    res=null;draw();mwMsg(M,owed>0?`Take <b class="gold">${fmt(owed)}</b>, or go again for ${fmt(owed*2)}.`:'Bust. Better luck on the reels.');if(owed>0&&(round>=MW_CFG.gambleMax||owed*2>cap)){await mwWait(900);if(mwAlive(M,id))collect();}};
  const collect=()=>{if(!mwAlive(M,id)||res==='busy')return;if(owed>0){G.me.chips+=owed;gambleTally(owed);G.stats.earned+=owed;Snd.play('potwin');gameLog(`Megaways bonus: ${fmt(owed)} chips.`,'good');if(owed>=MW_BET*10&&typeof Meta!=='undefined')Meta.ach('megaways');}
    M.owed=0;M.busy=false;M.mode='base';M.fsInfo=null;M.overlay=null;M.mult=1;
    M.last=owed>0?`Bonus total: <b class="gold">${fmt(owed)}</b> chips`:'The wheel giveth, the card taketh away.';M.win=owed;renderMW();};
  M.overlay=draw;draw();mwMsg(M,`Take <b class="gold">${fmt(owed)}</b>, or gamble it on the colour of the next card.`);}

/* ---------- styles ---------- */
(function(){const css=`
#slotPanel.arc-mw{width:476px}
#slotPanel.mw-bonus{box-shadow:0 0 0 1px #000,0 0 0 2px #ffd34d,0 0 40px rgba(255,211,77,.45),0 20px 60px rgba(0,0,0,.7)}
#slotPanel.mw-fs{background:linear-gradient(180deg,#2a0f3a,#12061c);animation:slIn .3s ease-out,mwFsGlow 1.6s linear infinite}
@keyframes mwFsGlow{0%{box-shadow:0 0 0 1px #000,0 0 0 2px #ff3d9a,0 0 44px rgba(255,61,154,.55),0 20px 60px rgba(0,0,0,.7)}33%{box-shadow:0 0 0 1px #000,0 0 0 2px #ffd34d,0 0 44px rgba(255,211,77,.55),0 20px 60px rgba(0,0,0,.7)}66%{box-shadow:0 0 0 1px #000,0 0 0 2px #22e1ff,0 0 44px rgba(34,225,255,.55),0 20px 60px rgba(0,0,0,.7)}100%{box-shadow:0 0 0 1px #000,0 0 0 2px #ff3d9a,0 0 44px rgba(255,61,154,.55),0 20px 60px rgba(0,0,0,.7)}}
.mw .gold,.mwgam .gold{color:#ffd34d}
.mwhud{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;height:34px}
.mwlogo{display:flex;flex-direction:column;line-height:1}.mwlogo b{font:400 17px var(--head);letter-spacing:.06em;background:linear-gradient(180deg,#fff3c4,#ffd34d 50%,#e08a00);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 6px rgba(255,176,32,.55))}
.mwlogo small{font:400 9.5px var(--head);color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-top:2px}
.mwfs{display:flex;align-items:baseline;gap:5px;padding:0 12px;height:32px;border-radius:16px;background:linear-gradient(180deg,#ff8cc6,#ff3d9a);color:#2a0016;box-shadow:0 0 18px rgba(255,61,154,.6)}
.mwfs:empty{display:none}.mwfs small{font:400 9.5px var(--head);color:#4a0328;letter-spacing:.06em;text-transform:uppercase}.mwfs b{font:400 21px/32px var(--head)}.mwfs em{font:400 11px var(--head);font-style:normal}
.bump{animation:mwBump .35s ease-out}@keyframes mwBump{40%{transform:scale(1.22)}}
.mwstage{position:relative}
.mwgrid{display:grid;grid-template-columns:repeat(6,1fr);grid-template-rows:46px 1fr;gap:5px 4px;height:318px;padding:7px;border-radius:12px;
  background:radial-gradient(130% 80% at 50% 0%,#2b1940,#0c0614 70%);box-shadow:inset 0 0 0 2px #e0b040,inset 0 0 0 4px #3b2206,inset 0 12px 28px rgba(0,0,0,.8),0 0 0 2px #000,0 0 26px rgba(224,176,64,.18)}
.mw-fs .mwgrid{background:radial-gradient(130% 80% at 50% 0%,#61184b,#14051e 72%);box-shadow:inset 0 0 0 2px #ffd34d,inset 0 0 0 4px #5b1846,inset 0 12px 28px rgba(0,0,0,.7),0 0 0 2px #000,0 0 30px rgba(255,61,154,.35)}
.mwcorner{display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;border-radius:8px;background:#0a0510;box-shadow:inset 0 0 0 1px rgba(224,176,64,.35)}
.mwcorner b{font:400 15px var(--head);color:#fff;font-variant-numeric:tabular-nums}.mwcorner b.mm{color:#ffd34d;font-size:19px;text-shadow:0 0 10px rgba(255,211,77,.7)}
.mwcorner small{font:400 8.5px var(--head);color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-top:2px}.mwcorner.r small{order:-1;margin:0 0 2px}
.mwtopreel{grid-column:2/6;position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:3px;border-radius:9px;overflow:hidden;
  background:linear-gradient(180deg,#3b2206,#1c0f03);box-shadow:inset 0 0 0 1.5px #e0b040,0 3px 8px rgba(0,0,0,.6)}
.mwtopreel .mwc{background:linear-gradient(180deg,#24153a,#140a22);border-radius:6px;box-shadow:inset 0 0 0 1px rgba(255,211,77,.25)}
.mwtopreel .mwc .mws{width:auto;height:100%}
.mwtopreel.spinning{display:block}.mwtopreel.spinning .mwstrip{position:absolute;left:3px;top:3px;bottom:3px;display:flex;gap:4px;width:calc(200% - 6px);animation:mwRollX .3s linear infinite;filter:blur(1.4px)}
.mwtopreel.spinning .mwc{flex:1 1 0;height:100%}
@keyframes mwRollX{from{transform:translateX(-50%)}to{transform:translateX(0)}}
.mwtopreel .mwc.slide{animation:mwSlide .4s cubic-bezier(.3,1.25,.5,1) backwards}@keyframes mwSlide{from{transform:translateX(calc(var(--dx) * (100% + 4px)))}}
.mwreel{position:relative;display:flex;flex-direction:column;gap:0;border-radius:8px;overflow:hidden;
  background:linear-gradient(180deg,#1a0f28,#2a1a3e 50%,#1a0f28);box-shadow:inset 0 0 0 1px rgba(255,211,77,.22),inset 0 0 14px rgba(0,0,0,.6)}
.mwreel::after{content:'';position:absolute;inset:0;pointer-events:none;border-radius:8px;background:linear-gradient(180deg,rgba(0,0,0,.45),transparent 12%,transparent 88%,rgba(0,0,0,.45)),linear-gradient(90deg,rgba(255,255,255,.05),transparent 30%,transparent 70%,rgba(255,255,255,.04))}
.mwreel.spinning .mwstrip{display:flex;flex-direction:column;animation:mwRoll .2s linear infinite;filter:blur(1.6px) brightness(.9)}
.mwreel.spinning .mwc{flex:none;height:44px}
@keyframes mwRoll{from{transform:translateY(-50%)}to{transform:translateY(0)}}
.mwreel.tease{box-shadow:inset 0 0 0 2px #ffd34d,0 0 18px #ffd34d;animation:mwTease .3s ease-in-out infinite alternate}@keyframes mwTease{to{box-shadow:inset 0 0 0 2px #fff3c4,0 0 30px #ffd34d}}
.mwreel.wildreel{background:linear-gradient(180deg,#4a0328,#7a0a44 50%,#4a0328);box-shadow:inset 0 0 0 2px #ff3d9a,0 0 20px #ff3d9a}
.mwc{position:relative;flex:1 1 0;display:flex;align-items:center;justify-content:center;min-height:0;min-width:0;padding:2px;transition:opacity .2s,filter .2s}
.mws{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 2px 2px rgba(0,0,0,.55))}
.mwc.land{animation:mwLandA .3s cubic-bezier(.3,1.6,.5,1)}@keyframes mwLandA{from{transform:translateY(-30%)}}
.mwc.drop{animation:mwDrop .4s cubic-bezier(.3,1.35,.5,1) backwards;animation-delay:var(--d)}@keyframes mwDrop{from{transform:translateY(-140%);opacity:0}}
.mwc.hit{z-index:1}
.mwc.hit::before{content:'';position:absolute;inset:1px;border-radius:7px;background:radial-gradient(circle,rgba(255,211,77,.55),rgba(255,61,154,.12) 70%,transparent);box-shadow:inset 0 0 0 1.5px rgba(255,211,77,.9);animation:mwHitBg .38s ease-in-out infinite alternate}
.mwc.hit .mws{position:relative;animation:mwHit .38s ease-in-out infinite alternate}
@keyframes mwHit{to{transform:scale(1.1);filter:drop-shadow(0 0 6px #ffd34d) brightness(1.15)}}@keyframes mwHitBg{to{opacity:.6}}
.mwc.dim{opacity:.3;filter:saturate(.4)}.mwc.s-bonus.dim{opacity:1;filter:none}
.mwc.pop{animation:mwPopA .23s ease-in forwards}@keyframes mwPopA{to{transform:scale(1.55);opacity:0;filter:brightness(3)}}
.mwc.s-bonus.glow .mws{animation:mwGlow .5s ease-in-out infinite alternate}@keyframes mwGlow{to{transform:scale(1.12);filter:drop-shadow(0 0 8px #ffd34d) brightness(1.25)}}
.mwc.s-bonus.big .mws{animation:mwGlowBig .35s ease-in-out infinite alternate}@keyframes mwGlowBig{to{transform:scale(1.25) rotate(10deg);filter:drop-shadow(0 0 12px #ffd34d) brightness(1.4)}}
.mwover{position:absolute;inset:0;display:none;align-items:center;justify-content:center;border-radius:12px;z-index:5}
.mwover.on{display:flex;background:rgba(8,3,14,.72);backdrop-filter:blur(1.5px)}
.mwfloat{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);pointer-events:none;z-index:6;font:400 30px var(--head);color:#fff3c4;text-shadow:0 0 6px #ffb020,0 0 18px #ff3d9a,0 3px 0 #7a3b00;animation:mwFl 1.3s ease-out forwards;white-space:nowrap}
.mwfloat small{font-size:16px;margin-left:6px;color:#ffd34d}
.mwfloat.wildfl{color:#ffd0e8;text-shadow:0 0 8px #ff3d9a,0 0 22px #ff3d9a,0 3px 0 #4a0328;font-size:34px}
.mwfloat.wheelfl{font-size:38px;top:40%}
@keyframes mwFl{0%{transform:translate(-50%,-20%) scale(.5);opacity:0}18%{transform:translate(-50%,-50%) scale(1.15);opacity:1}70%{opacity:1}100%{transform:translate(-50%,-110%) scale(1);opacity:0}}
.mwbar{display:grid;grid-template-columns:96px 1fr;gap:10px;align-items:center;margin:8px 0 6px;min-height:44px}
.mwwin small{font:400 9.5px var(--head);color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}.mwwin{display:flex;flex-direction:column;align-items:center;justify-content:center;height:44px;border-radius:10px;background:#07040b;box-shadow:inset 0 0 0 1px #3a3346;line-height:1}
.mwwin b{font:400 20px var(--head);color:#ffd34d;text-shadow:0 0 10px rgba(255,211,77,.5);font-variant-numeric:tabular-nums}
.mwmsg{font:400 12.5px/1.35 var(--body,Barlow),sans-serif;color:#ffe9b0;text-align:left}.mwmsg small{color:var(--muted)}
.mwctl{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center}
.mwctl .pb{height:34px;margin:0}.mwspin{font-size:15px}
.mwturbo{display:flex;align-items:center;gap:4px;padding:0 10px}.mwturbo .ic{width:14px;height:14px}.mwturbo.on{color:#1d0f00;background:linear-gradient(180deg,#ffe08a,#ffb020)}
.mwbuy{padding:0 10px;font-size:11.5px;color:#ffd34d;box-shadow:inset 0 0 0 1.5px #b8860b}.mwbuy.arm{background:#ffd34d;color:#2a1708}
.mwsplash{display:flex;flex-direction:column;align-items:center;gap:6px;animation:mwSpl .5s cubic-bezier(.3,1.6,.5,1)}
.mwsplash b{font:400 64px/1 var(--head);color:#fff3c4;text-shadow:0 0 10px #ffb020,0 0 30px #ff3d9a,0 5px 0 #7a3b00;animation:mwWob .5s ease-in-out infinite alternate}
.mwsplash small{font:400 14px var(--head);color:#ffd34d}
@keyframes mwSpl{from{transform:scale(.2) rotate(-12deg);opacity:0}}@keyframes mwWob{to{transform:scale(1.07) rotate(2deg)}}
.mwwheel{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;animation:mwSpl .5s cubic-bezier(.3,1.4,.5,1)}
.mwwheel canvas{width:222px;height:222px;filter:drop-shadow(0 6px 16px rgba(0,0,0,.6))}
.mwptr{position:absolute;top:-8px;left:50%;margin-left:-11px;width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-top:22px solid #fff3c4;filter:drop-shadow(0 0 6px #ffb020) drop-shadow(0 2px 0 #7a3b00)}
.mwwheel .pb{height:30px;margin:0}
.mwbig{position:relative;display:flex;flex-direction:column;align-items:center;overflow:hidden;width:100%;height:100%;justify-content:center}
.mwbigt{font:400 40px/1 var(--head);color:#fff3c4;text-shadow:0 0 10px #ffb020,0 0 28px #ff3d9a,0 4px 0 #7a3b00;animation:mwSpl .5s cubic-bezier(.3,1.6,.5,1),mwWob .45s .5s ease-in-out infinite alternate}
.mwbig.t2 .mwbigt{color:#ffd0e8;text-shadow:0 0 10px #ff3d9a,0 0 30px #ff3d9a,0 4px 0 #4a0328}.mwbig.t3 .mwbigt{color:#cffafe;text-shadow:0 0 10px #22e1ff,0 0 30px #22e1ff,0 4px 0 #083344;font-size:46px}
.mwbig.t4 .mwbigt{font-size:42px;background:linear-gradient(90deg,#ff3d9a,#ffd34d,#22e1ff,#a78bfa,#ff3d9a);background-size:200%;-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 0 10px #fff);animation:mwRain 1s linear infinite}
@keyframes mwRain{to{background-position:200%}}
.mwbign{font:400 44px/1.1 var(--head);color:#ffd34d;font-variant-numeric:tabular-nums;text-shadow:0 0 14px rgba(255,211,77,.7),0 3px 0 #7a3b00}
.mwbig small{font:400 11px var(--head);color:var(--muted);margin-top:4px}
.mwcoins{position:absolute;inset:0;pointer-events:none}.mwcoins i{position:absolute;top:-24px;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3c4,#e0b040 55%,#a16207);box-shadow:0 0 0 1.5px #5b3a06;animation:mwCoin 1.4s linear infinite}
@keyframes mwCoin{to{transform:translateY(300px) rotateY(720deg)}}
.mwgam{display:flex;flex-direction:column;align-items:center;gap:7px;animation:mwSpl .4s ease-out}
.mwgamt{font:400 22px var(--head);color:#fff3c4;text-shadow:0 0 10px #ff3d9a}
.mwgamc{perspective:400px}.mwgamc .card.big{width:74px;height:106px}.mwgamc.flip .card{animation:mwFlipA .35s ease-out}@keyframes mwFlipA{from{transform:rotateY(90deg)}}
.mwgamr{font:400 12.5px var(--body,Barlow),sans-serif;color:#ffe9b0;min-height:17px}
.mwgamb{display:flex;gap:6px}.mwgamb .pb{height:32px;margin:0;padding:0 14px}
.mwgamb .pb.red{background:linear-gradient(180deg,#f87171,#dc2626);color:#fff}.mwgamb .pb.blk{background:linear-gradient(180deg,#4b5563,#111827);color:#fff}
.mwgam small{font:400 10px var(--head);color:var(--muted)}
@media (prefers-reduced-motion:reduce){.mwreel.spinning .mwstrip,.mwc.hit,.mwc.s-bonus.glow,.mwc.s-bonus.big,.mwsplash b,.mwbigt{animation:none}}`;
const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);})();
