'use strict';
/* ============ ALL IN — table social: rematch, table awards, open tables ============ */

/* ---------- the stats each player shares for the end-of-game awards ---------- */
function finalStats(){const s=G&&G.stats;if(!s)return null;
  return {k:s.kills|0,b:s.best==null?-1:s.best,p:s.bigPot|0,m:s.merges|0,l:s.leaks|0,c:s.clean|0,n:NET.name||'You'};}
function tablePeople(){
  const out=[];const mine=finalStats();if(mine)out.push({...mine,n:'You',me:true});
  for(const p of G.players){if(!p.remote)continue;const pr=presOf(p.pid),fs=pr&&pr.g&&pr.g.fs;if(fs)out.push({...fs,n:p.short||cleanName(fs.n)||'Player'});}
  return out;}
const AWARDS=[
  {id:'k',title:'Exterminator',icon:'kills',val:s=>s.k,fmt:v=>fmt(v)+' busted',best:'max'},
  {id:'b',title:'Card Shark',icon:'spade',val:s=>s.b,fmt:v=>v>=0?HANDS[v]:'',best:'max'},
  {id:'p',title:'High Roller',icon:'chips',val:s=>s.p,fmt:v=>'Pot of '+fmt(v),best:'max'},
  {id:'m',title:'Mad Scientist',icon:'merge',val:s=>s.m,fmt:v=>v+' merge'+(v===1?'':'s'),best:'max'},
  {id:'l',title:'Tight Ship',icon:'plate',val:s=>s.l,fmt:v=>v===0?'No leaks':v+' leak'+(v===1?'':'s'),best:'min'}];
function tableAwardsHTML(){
  if(!G||!G.mp)return '';const ppl=tablePeople();if(ppl.length<2)return '';
  const cards=[];for(const A of AWARDS){const vals=ppl.map(A.val);const pick=A.best==='max'?Math.max(...vals):Math.min(...vals);
    if(A.best==='max'&&pick<=0)continue;const winners=ppl.filter(s=>A.val(s)===pick);if(winners.length===ppl.length&&ppl.length>2)continue;
    cards.push(`<div class="award ${winners.some(w=>w.me)?'mine':''}"><span class="aic">${icon(A.icon)}</span><b>${A.title}</b><em>${winners.map(w=>esc(w.n)).join(' & ')}</em><small>${A.fmt(pick)}</small></div>`);}
  return cards.length?`<div class="awards"><h4>Table awards</h4><div class="arow">${cards.join('')}</div></div>`:'';}

/* ---------- rematch ---------- */
function rematchPeople(){ // everyone still in the room who played this game
  const gid=G&&G.mp&&G.mp.gid,ids=new Set(((NET.host?NET.R:NET.S&&NET.S.R)||[]).filter(e=>e.id).map(e=>e.id));
  return peersNow().filter(p=>ids.has(idOf(p))).map(p=>({id:idOf(p),n:p.isMe&&p.sameTab?'You':cleanName(p.presence.n)||'Player',ready:p.isMe&&p.sameTab?(NET.host||NET.rm===gid):p.presence.rm===gid,me:p.isMe&&p.sameTab}));}
function rematchNote(){const ppl=rematchPeople();if(!ppl.length)return '';
  return 'Rematch: '+ppl.map(p=>`<span class="${p.ready?'rdy':''}">${esc(p.n)}${p.ready?' ✓':''}</span>`).join(' · ');}
function setRematch(on){const gid=G&&G.mp&&G.mp.gid;NET.rm=on?gid:null;pres({rm:NET.rm});updateRematchUI();}
function hostRematch(){ // the host deals a fresh game, same settings, with everyone who said yes
  const ready=new Set(rematchPeople().filter(p=>p.ready||p.me).map(p=>p.id));
  NET.rm=null;pres({rm:null});hostCreateGame(ready);}
function updateRematchUI(){
  const note=document.getElementById('eRm');if(!note)return;note.innerHTML=rematchNote();
  const ppl=rematchPeople(),me=ppl.find(p=>p.me),b=document.getElementById('eRematch');
  if(b&&!NET.host){b.classList.toggle('main',!(me&&me.ready));b.textContent=me&&me.ready?'Ready for a rematch ✓':'Rematch';}
  if(b&&NET.host){const n=ppl.filter(p=>p.ready||p.me).length;b.textContent=ppl.length>1?`Rematch (${n}/${ppl.length} ready)`:'Rematch';}
  // everyone said yes: the host deals straight away
  if(NET.host&&ppl.length>1&&ppl.every(p=>p.ready||p.me)&&!NET.rmT){NET.rmT=setTimeout(()=>{NET.rmT=null;if(mpOver())hostRematch();},1500);}
}
setInterval(()=>{if(document.getElementById('eRm'))updateRematchUI();},600);

/* ---------- open tables: an opt-in list of rooms looking for players ---------- */
const OPEN={r:null,joining:null,browse:false,list:[]};
async function openRoom(){
  if(OPEN.r)return OPEN.r;if(OPEN.joining)return OPEN.joining;
  OPEN.joining=(async()=>{const api=await netApi();if(!api||!api.join)return null;
    try{const r=await api.join('allin-open-tables');if(r.setBudget)r.setBudget(6,false,1500);r.onPeers(()=>openRefresh());OPEN.r=r;return r;}catch(e){return null;}finally{OPEN.joining=null;}})();
  return OPEN.joining;}
function openRefresh(){if(!OPEN.r)return;
  OPEN.list=OPEN.r.peers().filter(p=>!(p.isMe&&p.sameTab)&&p.presence&&p.presence.ot&&p.presence.ot.c).map(p=>p.presence.ot)
    .filter((t,i,a)=>a.findIndex(x=>x.c===t.c)===i&&t.c!==NET.code).sort((a,b)=>(b.n||0)-(a.n||0));
  renderOpenTables();}
function openWanted(){return NET.on&&NET.host&&NET.pub&&NET.gst==='lobby'&&NET.settled;}
async function openSync(){ // keep this room's listing (or its absence) up to date
  const want=openWanted();if(!want&&!OPEN.r)return;if(!want&&!OPEN.browse){if(OPEN.r){const r=OPEN.r;OPEN.r=null;r.leave&&r.leave();}return;}
  const r=await openRoom();if(!r)return;
  const ot=want?{c:NET.code,h:NET.name,n:lobbyPeople().length,d:NET.diff,ai:NET.ai?1:0}:null,sig=JSON.stringify(ot);
  if(sig!==OPEN.sig){OPEN.sig=sig;r.presence({ot});}}
async function openBrowse(on){OPEN.browse=on;if(on){const r=await openRoom();if(r)openRefresh();else renderOpenTables(true);}else openSync();}
function renderOpenTables(failed){
  const el=document.getElementById('openTables');if(!el)return;
  if(failed){el.innerHTML='<p class="mpnote">Open tables are not available right now.</p>';return;}
  if(!OPEN.r){el.innerHTML='<p class="mpnote">Looking for open tables…</p>';return;}
  el.innerHTML=OPEN.list.length?OPEN.list.map(t=>`<div class="otab"><b>${esc(cleanName(t.h)||'Someone')}'s table</b><small>${Math.min(t.n||1,MAX_SEATS)}/${MAX_SEATS} players · ${esc((DIFFS[t.d]||DIFFS.standard).name)}${t.ai?' · house rivals':''}</small><button class="pb" data-ot="${esc(t.c)}">Join</button></div>`).join('')
    :'<p class="mpnote">No open tables right now. Start a room and tick <b>List this room</b> to open yours.</p>';
  el.querySelectorAll('[data-ot]').forEach(b=>b.addEventListener('click',()=>{const c=$('#mpCode');if(c)c.value=b.dataset.ot;const j=$('#mpJoin');if(j)j.click();}));}
setInterval(()=>{if(OPEN.r||openWanted())openSync();},4000);
