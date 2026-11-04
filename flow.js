'use strict';
/* ============ ALL IN — rhythm and teaching ============
   Stragglers make a run for it instead of dragging a round out. The arcade shows that the round is
   still going while you play. A first-run coach introduces dealing, drawing, selecting, positioning,
   ropes, merging and abilities one at a time, each when it first matters. */

/* ---------- stragglers ---------- */
{const _u=update;update=function(dt){_u(dt);if(G.phase!=='wave'||G.spawnQ.length)return;
  const live=G.enemies.filter(e=>!e.dead);if(!live.length||live.length>3||live.some(e=>e.def.boss||e.def.mini)||G.waveT<G.waveSpread+10)return;
  for(const e of live){if(!e.straggle){e.straggle=true;if(!G.stragT||G.time-G.stragT>8){G.stragT=G.time;toast(live.length===1?'The last bad luck is making a run for it!':`The last ${live.length} are making a run for it!`);}}
    e.spdMul=Math.max(e.spdMul||1,1.6);if(e.def.stealth)e.revealT=Math.max(e.revealT||0,.5);}};}
function drawStragglers(c,t){if(!G||G.phase!=='wave')return;for(const e of G.enemies){if(!e.straggle||e.dead)continue;const p=(t*1.6)%1,R=e.r*VIS_E;
  c.save();c.strokeStyle=`rgba(255,207,122,${1-p})`;c.lineWidth=2;c.beginPath();c.arc(e.x,e.y,R+6+p*26,0,TAU);c.stroke();c.restore();}}
{const _t=drawTopWarn;drawTopWarn=function(c,t){_t(c,t);drawStragglers(c,t);};}

/* ---------- side activities: the round does not wait ---------- */
function arcadeLive(){const P=$('#slotPanel');if(!P||!G){return;}let el=$('#arcLive');
  const wave=G.phase==='wave',myTurn=HD&&(HD.phase==='bet1'||HD.phase==='bet2')&&HD.actor>=0&&HD.seats[HD.actor]&&HD.seats[HD.actor].p.human,draw=HD&&HD.phase==='draw'&&G.phase==='hand';
  if(!wave&&!myTurn&&!draw){if(el)el.remove();return;}
  if(!el){el=document.createElement('button');el.id='arcLive';el.onclick=()=>toggleArcade(false);const h=P.querySelector('.mghead');if(h)h.after(el);else P.prepend(el);}
  const left=G.enemies.filter(e=>!e.dead).length+G.spawnQ.length,hit=G.base.hitT>0;
  el.className=(hit?'hit ':'')+(myTurn||draw?'turn':'');
  el.innerHTML=wave?`${icon('kills')}<b>Round ${G.wave} is live</b><span>${left} bad luck left · casino ${Math.max(0,Math.round(G.base.hp))}/${G.base.maxHp}</span><em>Back to the street</em>`
    :`${icon('spade')}<b>${myTurn?'Your turn to bet':'Time to draw'}</b><span>The table is waiting for you</span><em>Back to the table</em>`;}
setInterval(()=>{try{arcadeLive();}catch(e){}},250);

/* ---------- the first-run coach ---------- */
const COACH={st:(()=>{try{return JSON.parse(localStorage.getItem('allin-coach')||'{}');}catch(e){return {};}})(),cur:null,flag:{}};
COACH.save=()=>{try{localStorage.setItem('allin-coach',JSON.stringify(COACH.st));}catch(e){}};
const hsHuman=()=>{try{return humanSeat();}catch(e){return null;}};
const COACH_STEPS=[
  {id:'deal',when:()=>HD&&HD.phase==='tip'&&hsHuman(),done:()=>!HD||HD.phase!=='tip',at:'#pActions',
    text:'<b>Your first hand.</b> Press <b>Deal</b>. Tipping the dealer gets you the best of several hands. Try it once you have chips to spare.'},
  {id:'swap',when:()=>HD&&HD.phase==='draw'&&hsHuman()&&!hsHuman().folded,done:()=>!HD||HD.phase!=='draw'||(hsHuman()&&hsHuman().drew>0),at:'#cards',
    text:'Click the cards you don\'t want, then <b>Swap</b>. <b>Your final hand summons a creature</b>: pairs and better make stronger ones.'},
  {id:'select',when:()=>G.phase==='wave'&&G.units.length>0&&!G.sel.length,done:()=>G.sel.length>0,at:'#boardWrap',
    text:'Your creature is on the street. <b>Drag a box</b> around it to select it.'},
  {id:'move',when:()=>G.sel.length>0&&G.phase!=='mini',done:()=>COACH.flag.moved,at:'#boardWrap',
    text:'<b>Right-click</b> a spot to send it there. With a few creatures, <b>right-drag</b> to spread them along a line. Hold <b>Shift</b> to queue orders.'},
  {id:'rope',when:()=>G.wave>=2&&G.phase==='hand'&&G.me.chips>=40,done:()=>G.barricades>0,at:'[data-c="rope"]',
    text:'With your casino selected, <b>Velvet ropes</b> (V): paint them across the street. Bad luck has to walk around, which buys your army time to hit it.'},
  {id:'merge',when:()=>G.units.some(u=>recipesFor(u.k).some(r=>G.units.some(o=>o!==u&&o.k===r.partner))),done:()=>(G.stats.merges||0)>0,at:'[data-c="merge"]',
    text:'Two of your creatures can <b>merge</b> into something stronger. Select one, then press <b>Merge</b> (M) or its recipe button.'},
  {id:'ability',when:()=>G.phase==='wave'&&G.units.some(u=>u.def.ab&&ABIL[u.def.ab].type!=='toggle'),done:()=>COACH.flag.cast,at:'#boardWrap',
    text:'One of your creatures has an <b>ability</b>: a purple marker shows when it\'s ready. Select it and press its key (shown on its button), ideally when the bad luck bunches up. With several selected, they all cast it.'},
  {id:'groups',when:()=>G.wave>=4&&G.units.length>=5&&G.sel.length>=2&&!G.groups.some(g=>g&&g.length),done:()=>G.groups.some(g=>g&&g.length),at:'#boardWrap',
    text:'<b>Control groups</b>: press <b>Shift+1</b> to save this selection as group 1, then press <b>1</b> any time to grab them again. The <b>+ Group</b> button does the same.'},
  {id:'rally',when:()=>G.wave>=3&&G.phase==='hand'&&!G.rally&&!G.sel.length&&G.units.length>=3,done:()=>!!G.rally,at:'#boardWrap',
    text:'<b>Rally point</b>: click your <b>casino</b> to select it, then <b>right-click</b> the street to plant a flag (or use the flag button). New creatures head straight there when they land.'},
  {id:'plan',when:()=>{const e=$('#scout');return e&&e.classList.contains('show')&&!e.classList.contains('live');},done:()=>G.phase==='wave',at:'#scout',
    text:'From round 11 some rounds are <b>set pieces</b> built to punish one approach. This card says what is coming, and how to answer it.'}];
{const _ol=orderLine;orderLine=function(){COACH.flag.moved=true;return _ol.apply(this,arguments);};}
{const _om=orderMove;orderMove=function(){COACH.flag.moved=true;return _om.apply(this,arguments);};}
{const _ca=castAbility;castAbility=function(){const r=_ca.apply(this,arguments);if(r)COACH.flag.cast=true;return r;};}
// the coach covers what these one-off hints used to say
{const _h=hintOnce;hintOnce=function(k,text){if(!COACH.st.off&&['tip','draw','army','ability','merge'].includes(k))return;return _h(k,text);};}
function coachTick(){let el=$('#coach');
  const hide=()=>{if(el)el.classList.remove('show');document.querySelectorAll('.coach-hl').forEach(x=>x.classList.remove('coach-hl'));COACH.cur=null;};
  if(!G||G.over||G.mp&&G.mp.watch||COACH.st.off||!document.body.contains($('#boardWrap'))||$('#overlay.show')){return hide();}
  const done=COACH.st.done||(COACH.st.done=[]);
  // finish whatever is showing once it has been done
  if(COACH.cur){const s=COACH.cur;if(s.done()){done.push(s.id);COACH.save();Snd.play('coin');hide();return;}if(!s.when())return hide();}
  if(!COACH.cur){const s=COACH_STEPS.find(s=>!done.includes(s.id)&&s.when());if(!s)return hide();COACH.cur=s;}
  const s=COACH.cur,tg=document.querySelector(s.at);if(!tg)return;
  if(!el){el=document.createElement('div');el.id='coach';document.body.appendChild(el);
    el.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;if(b.dataset.k==='ok'&&COACH.cur){done.push(COACH.cur.id);COACH.save();}if(b.dataset.k==='off'){COACH.st.off=true;COACH.save();toast('Tips are off. Turn them back on in Settings.');}hide();});}
  if(el.dataset.id!==s.id){el.dataset.id=s.id;const n=done.length+1;
    el.innerHTML=`<div class="ct">${s.text}</div><div class="cb"><small>Tip ${n} of ${COACH_STEPS.length}</small><button data-k="off">Skip tips</button><button data-k="ok">Got it</button></div><i class="ca"></i>`;}
  document.querySelectorAll('.coach-hl').forEach(x=>{if(x!==tg)x.classList.remove('coach-hl');});if(s.at!=='#boardWrap')tg.classList.add('coach-hl');
  const r=tg.getBoundingClientRect(),cw=el.offsetWidth||300,ch=el.offsetHeight||90;let x,y,below=false;
  if(s.at==='#boardWrap'){x=r.left+r.width/2-cw/2;y=r.top+14;el.classList.add('flat');}
  else{el.classList.remove('flat');x=Math.max(10,Math.min(innerWidth-cw-10,r.left+r.width/2-cw/2));y=r.top-ch-14;if(y<56){y=r.bottom+14;below=true;}
    el.style.setProperty('--ax',Math.max(14,Math.min(cw-14,r.left+r.width/2-x))+'px');}
  el.classList.toggle('below',below);el.style.left=Math.round(x)+'px';el.style.top=Math.round(y)+'px';el.classList.add('show');}
setInterval(()=>{try{coachTick();}catch(e){}},200);
// Settings can bring the tips back
function coachReset(){COACH.st={done:[],off:false};COACH.save();COACH.cur=null;toast('Tips will show again from the start.');}

/* ---------- styles ---------- */
(function(){const css=`
#arcLive{display:flex;align-items:center;flex-wrap:wrap;gap:2px 8px;width:100%;margin:0 0 10px;padding:7px 10px;border:0;border-radius:9px;cursor:pointer;text-align:left;
  background:linear-gradient(90deg,#3b0a16,#24101e);box-shadow:inset 0 0 0 1.5px #ff3b5a;color:#ffd1dc;font:400 12px var(--body,Barlow),sans-serif}
#arcLive .ic{width:15px;height:15px;color:#ff8fa3}#arcLive b{font:400 12px var(--head);color:#fff}#arcLive span{color:#ffd1dc}#arcLive em{margin-left:auto;font:400 10px var(--head);font-style:normal;color:#ff8fa3}
#arcLive.hit{animation:arcHit .35s ease-out}@keyframes arcHit{from{background:#7f1d1d}}
#arcLive.turn{background:linear-gradient(90deg,#3b2a06,#1d1626);box-shadow:inset 0 0 0 1.5px #ffb020}#arcLive.turn .ic,#arcLive.turn em{color:#ffd27a}
#coach{position:fixed;z-index:90;width:300px;padding:11px 13px 9px;border-radius:12px;background:linear-gradient(180deg,#22113a,#140a22);color:#f3e8ff;
  box-shadow:0 0 0 1.5px #c084fc,0 0 26px rgba(192,132,252,.35),0 14px 34px rgba(0,0,0,.6);font:400 13px/1.4 var(--body,Barlow),sans-serif;
  opacity:0;pointer-events:none;transform:translateY(6px);transition:opacity .25s,transform .25s}
#coach.show{opacity:1;pointer-events:auto;transform:none}#coach b{color:#fff}
#coach .cb{display:flex;align-items:center;gap:6px;margin-top:8px}#coach .cb small{margin-right:auto;font:400 10px var(--head);color:#a78bfa;letter-spacing:.06em}
#coach button{height:24px;padding:0 10px;border:0;border-radius:12px;font:400 11px var(--head);cursor:pointer;background:#2e1d45;color:#d8b4fe}
#coach button[data-k="ok"]{background:linear-gradient(180deg,#d8b4fe,#a855f7);color:#1d0f2e}
#coach .ca{position:absolute;left:var(--ax,50%);bottom:-7px;width:12px;height:12px;margin-left:-6px;background:#140a22;transform:rotate(45deg);box-shadow:1.5px 1.5px 0 0 #c084fc}
#coach.below .ca{bottom:auto;top:-7px;background:#22113a;box-shadow:-1.5px -1.5px 0 0 #c084fc}#coach.flat .ca{display:none}
.coach-hl{position:relative;z-index:5;animation:coachHl 1.1s ease-in-out infinite;border-radius:10px}
@keyframes coachHl{0%,100%{box-shadow:0 0 0 2px rgba(192,132,252,.9),0 0 12px rgba(192,132,252,.5)}50%{box-shadow:0 0 0 4px rgba(192,132,252,.5),0 0 26px rgba(192,132,252,.8)}}`;
const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);})();
