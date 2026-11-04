'use strict';
/* ============ ALL IN — the word we can't say ============
   Type "pokermon" during a run: the neon sign flashes it, then a lawyer sprints across the Strip waving a cease and
   desist, and everyone pretends it never happened. And the first time two of the same creature merge, someone
   gets a little over-excited about what to call it. Shh. */
HIDDEN_ACH.pokermon=['Gotta Deal \'Em All','Say the word we can\'t say.','sparkles','Some words get you a letter from a lawyer. Try typing one.'];
ACH.pokermon=HIDDEN_ACH.pokermon.slice(0,3);

let PKM_BUF='';
window.addEventListener('keydown',ev=>{if(ev.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName))return;if(ev.key.length!==1)return;
  PKM_BUF=(PKM_BUF+ev.key.toLowerCase()).slice(-8);if(PKM_BUF==='pokermon'){PKM_BUF='';pokermon();}},true);
function pokermon(){
  if(!G||!G.running||G.over){toast('Shh. Not here. Not ever.');return;}
  if(G.lawyer&&G.time-G.lawyer.t0<4)return;
  banner('POKéRMON','Gotta deal \'em all!','great');Snd.play('jackpot');
  for(const u of G.units)if(!u.dead&&Math.random()<.6)floatText(u.x,u.y-u.r*2-12,'!','#fde047',14);
  setTimeout(()=>{if(!G)return;G.lawyer={t0:G.time,y:BASE.y-60+Math.random()*120};Snd.play('whistle');
    setTimeout(()=>{const ns=document.getElementById('neonSign');if(ns)ns.innerHTML='<span>ALL IN</span><small>Nothing to see here</small>';},250);
    setTimeout(()=>{if(!G)return;
      toast('Shh. We never said that. Our lawyers would like a word.');for(const u of G.units)if(!u.dead&&Math.random()<.5)floatText(u.x,u.y-u.r*2-12,'…','#e5e7eb',13);
      if(typeof Meta!=='undefined')Meta.ach('pokermon');gameLog('Nothing happened just now. Please carry on.','');},1500);},1300);}
// the lawyer: grey suit, red tie, briefcase in one hand and the letter held high in the other
function drawLawyer(c,t){const L=G&&G.lawyer;if(!L)return;const k=G.time-L.t0,x=-30+k*300,y=L.y;if(x>W+40){G.lawyer=null;return;}
  const step=Math.sin(k*28),s=1.6;c.save();c.translate(x,y);c.scale(s,s);
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,10,7,2.4,0,0,TAU);c.fill();
  c.strokeStyle='#1f2937';c.lineWidth=2.4;c.lineCap='round';c.beginPath();c.moveTo(-1.5,3);c.lineTo(-1.5-step*4,9.5);c.moveTo(1.5,3);c.lineTo(1.5+step*4,9.5);c.stroke();
  c.fillStyle='#4b5563';c.beginPath();c.roundRect?c.roundRect(-4,-5,8,9,2):c.rect(-4,-5,8,9);c.fill();c.fillStyle='#f5f5f4';c.beginPath();c.moveTo(-1.5,-5);c.lineTo(0,-1);c.lineTo(1.5,-5);c.fill();c.fillStyle='#dc2626';c.fillRect(-.6,-4.2,1.2,4);
  c.fillStyle='#e8c9a4';c.beginPath();c.arc(.5,-8.5,3.4,0,TAU);c.fill();c.fillStyle='#374151';c.beginPath();c.ellipse(.2,-11,3.4,1.5,0,Math.PI,0);c.fill();
  c.fillStyle='#0b0612';c.beginPath();c.arc(1.8,-8.8,.6,0,TAU);c.fill();c.strokeStyle='#0b0612';c.lineWidth=.6;c.beginPath();c.arc(1.6,-6.8,1,.2,Math.PI-.2,true);c.stroke();
  // briefcase
  c.strokeStyle='#4b5563';c.lineWidth=1.8;c.beginPath();c.moveTo(-3.5,-3);c.lineTo(-5,2+step);c.stroke();c.fillStyle='#78350f';c.fillRect(-8,2+step,6,4.5);c.fillStyle='#fbbf24';c.fillRect(-5.5,2.8+step,1,1);
  // the letter, waved overhead
  c.strokeStyle='#4b5563';c.beginPath();c.moveTo(3.5,-3);c.lineTo(6,-11);c.stroke();c.save();c.translate(6.5,-15+Math.sin(k*20)*.8);c.rotate(.15+Math.sin(k*20)*.12);
  c.fillStyle='#fefce8';c.fillRect(-5,-4,10,7);c.strokeStyle='#a8a29e';c.lineWidth=.4;c.strokeRect(-5,-4,10,7);c.fillStyle='#b91c1c';c.font='bold 2.6px Barlow,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('CEASE &',0,-1.6);c.fillText('DESIST',0,1.2);c.restore();
  c.restore();
  if(k<1.6){c.save();c.font='bold 13px Bungee,Impact,sans-serif';c.textAlign='center';c.fillStyle='#fde68a';c.strokeStyle='#0b0612';c.lineWidth=3;c.strokeText('OBJECTION!',x,y-48);c.fillText('OBJECTION!',x,y-48);c.restore();}}
{const _t=drawTopWarn;drawTopWarn=function(c,t){_t(c,t);drawLawyer(c,t);};}

// "What? CHIP MITE is evolving!" ...it's merging. It's called merging.
{const _mu=mergeUnits;mergeUnits=function(a,b){const same=a&&b&&a.k===b.k,name=a&&UNITS[a.k]?UNITS[a.k].name:'',seen=typeof Meta!=='undefined'&&Meta.data&&Meta.data.pkmEvo;
  const u=_mu.apply(this,arguments);
  if(u&&same&&(!seen||Math.random()<.1)){if(typeof Meta!=='undefined'&&Meta.data){Meta.data.pkmEvo=1;try{localStorage.setItem('allin-meta',JSON.stringify(Meta.data));}catch(e){}}
    floatText(u.x,u.y-u.r*2.6-20,`What? ${name.toUpperCase()} is evolving!`,'#fde047',13);
    setTimeout(()=>{if(G&&!u.dead)floatText(u.x,u.y-u.r*2.6-6,'…merging. It\'s called merging.','#e5e7eb',11);},1300);}
  return u;};}
