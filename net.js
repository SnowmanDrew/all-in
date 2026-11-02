'use strict';
/* ============ ALL IN — multiplayer rooms ============
   Transport: the artifact `room` capability, presence only (every viewer may set presence).
   The host (earliest-joined eligible player in the room) runs the shared poker table and the
   house rivals; every player defends their own casino locally and reports its state. */
const ART_URL='https://claude.ai/artifact/BPQrzQkvD1AVCStrfBZyAk';
const NV=1,MAX_SEATS=6,AWAY_MS=20000,HOST_GRACE=5000,WAVE_CAP=150;
const HUMAN_COLS=['#e9c46a','#22d3ee','#ff5fa2','#a3e635','#fb923c','#c084fc'];
const EMOTES=['Good luck!','Nice hand.','Bluffing?','Run it back!','My casino is fine. Totally fine.','GG'];
const CODE_ABC='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const cleanName=n=>String(n||'').replace(/[^\p{L}\p{N} _.'-]/gu,'').replace(/\s+/g,' ').trim().slice(0,14);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const encCards=cs=>(cs||[]).map(c=>c.v.toString(16)+c.s).join('');
const decCards=t=>{const o=[];for(let i=0;i+1<t.length;i+=2)o.push({v:parseInt(t[i],16),s:t[i+1]});return o;};
const r1=x=>Math.round(x*10)/10;
// a stable id for this browser tab, so a reload keeps your seat
const PID=(()=>{try{let v=sessionStorage.getItem('allin-pid');if(!v){v=Math.random().toString(36).slice(2,12);sessionStorage.setItem('allin-pid',v);}return v;}catch(e){return Math.random().toString(36).slice(2,12);}})();
const idOf=p=>p&&p.presence&&p.presence.pid||p&&p.peer;
/* ---- hidden cards: each player has an ECDH key; the host encrypts each player's cards with their shared key ---- */
const CRYPTO=!!(window.crypto&&crypto.subtle);
const b64=buf=>btoa(String.fromCharCode(...new Uint8Array(buf))),ub64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
const KEYS={kp:null,shared:new Map(),dec:new Map()};
async function cryptoInit(){if(!CRYPTO||KEYS.kp)return;try{KEYS.kp=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},false,['deriveKey']);NET.pkB64=b64(await crypto.subtle.exportKey('raw',KEYS.kp.publicKey));if(NET.on)pres({pk:NET.pkB64});}catch(e){KEYS.kp=null;}}
async function sharedKey(pkB64){if(!KEYS.kp||!pkB64)return null;let k=KEYS.shared.get(pkB64);if(k)return k;
  try{const pub=await crypto.subtle.importKey('raw',ub64(pkB64),{name:'ECDH',namedCurve:'P-256'},false,[]);k=await crypto.subtle.deriveKey({name:'ECDH',public:pub},KEYS.kp.privateKey,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);KEYS.shared.set(pkB64,k);return k;}catch(e){return null;}}
async function sealFor(pkB64,text){const k=await sharedKey(pkB64);if(!k)return null;const iv=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(text));const o=new Uint8Array(12+ct.byteLength);o.set(iv);o.set(new Uint8Array(ct),12);return b64(o);}
async function openFrom(pkB64,blob){const k=await sharedKey(pkB64);if(!k)return null;try{const raw=ub64(blob);const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:raw.slice(0,12)},k,raw.slice(12));return new TextDecoder().decode(pt);}catch(e){return null;}}
cryptoInit();

const NET={on:false,api:undefined,apiP:null,r:null,code:'',peer:null,t:0,name:'',host:false,
  peers:[],S:null,hostPeer:null,hostGoneT:0,lastPub:0,pubSig:'',gSig:'',lastG:0,
  // host
  gst:'lobby',gid:'',diff:'standard',ai:true,R:null,T:null,win:null,pl:null,why:'',
  // client
  enc:{},myCards:null,chatSeq:0,chatOut:[],chatSeen:{},lastChatT:0,lastSnap:0,
  ack:{h:-1,a:0},wonH:-1,spawnH:-1,disc:null,myIn:{h:-1},emoSeq:0,emoT:0,seenEmo:{},lastFrame:0,view:'',
  status:''};

/* ---------- transport ---------- */
function netApi(){
  if(NET.apiP)return NET.apiP;
  NET.apiP=(async()=>{try{NET.api=(window.claude&&window.claude.use)?await window.claude.use('room'):null;}catch(e){NET.api=null;}
    if(!NET.api&&window.ALLIN_ONLINE){try{NET.api=await window.ALLIN_ONLINE();NET.online=!!NET.api;}catch(e){console.warn(e);NET.api=null;}}return NET.api;})();
  return NET.apiP;
}
function lobbyChannel(api,code){ // fallback when named rooms are refused: share the lobby, filter by code
  const keys=new Set();const mine=ps=>ps.filter(p=>p.presence&&p.presence.rc===code);
  return {presence:patch=>{Object.keys(patch).forEach(k=>keys.add(k));return api.presence(patch);},
    peers:()=>mine(api.peers()),
    onPeers:fn=>api.onPeers(ch=>fn({peers:mine(ch.peers),left:ch.left,joined:mine(ch.joined),updated:mine(ch.updated)})),
    leave:()=>{const z={};keys.forEach(k=>z[k]=null);return api.presence(z);}};
}
async function netJoin(code,name){
  const api=await netApi();if(!api)throw new Error('unavailable');
  code=code.toUpperCase();let r=null;
  try{r=await api.join('allin-'+code.toLowerCase());}catch(e){r=null;}
  if(!r){if(!api.presence)throw new Error('unavailable');r=lobbyChannel(api,code);}
  if(r.setBudget)r.setBudget(40,false,120);
  Object.assign(NET,{on:true,r,code,name:cleanName(name)||'Player',t:9e15,joinT:Date.now(),settled:false,host:false,S:null,hostPeer:null,hostGoneT:0,peer:null,gst:'lobby',chatSeen:{},chatOut:[],specOk:false,myCards:null,enc:{},R:null,T:null,win:null,pl:null,pubSig:'',gSig:'',gid:''});
  NET.unsub=r.onPeers(ch=>{NET.peers=ch.peers.slice();netPeersChanged();},()=>{});
  await r.presence({v:NV,pid:PID,n:NET.name,t:NET.t,rc:code,S:null,g:null,ch:null,pk:NET.pkB64||null});
  NET.ar=null;if(r.join!==undefined||api.join){try{const ar=await api.join('allin-'+code.toLowerCase()+'-ar');if(ar.setBudget)ar.setBudget(45,true,100);await ar.presence({pid:PID});NET.ar=ar;}catch(e){NET.ar=null;}}
  for(let i=0;i<50&&!NET.peer;i++){const me=r.peers().find(p=>p.isMe&&p.sameTab);if(me)NET.peer=me.peer;else await new Promise(res=>setTimeout(res,100));}
  if(!NET.peer)NET.peer='local';
  try{history.replaceState(null,'','#join-'+code.toLowerCase());}catch(e){try{location.hash='join-'+code.toLowerCase();}catch(e2){}}
  netPeersChanged();
}
function netLeave(){
  if(!NET.on)return;NET.watch=null;if(typeof syncWatchUI==='function')syncWatchUI();try{NET.unsub&&NET.unsub();}catch(e){}try{NET.r.leave&&NET.r.leave();}catch(e){}
  try{NET.ar&&NET.ar.leave();}catch(e){}NET.ar=null;
  NET.on=false;NET.r=null;NET.host=false;NET.S=null;NET.view='';
  try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}
}
function pres(patch){if(NET.on&&NET.r)NET.r.presence(patch).catch(()=>{});}
function peersNow(){return (NET.r?NET.r.peers():NET.peers).filter(p=>p.presence&&p.presence.v===NV&&p.presence.n);}
function presOf(id){const p=peersNow().find(x=>idOf(x)===id);return p?p.presence:null;}
function lobbyPeople(){return peersNow().slice().sort((a,b)=>(a.presence.t-b.presence.t)||(idOf(a)<idOf(b)?-1:1));}

/* who hosts: the earliest-joined eligible peer that is here */
function eligible(){
  const ppl=lobbyPeople();
  const S=NET.host?hostState():NET.S;
  if(S&&S.st!=='lobby'&&S.R){const ids=new Set(S.R.filter(e=>e.id&&!e.x).map(e=>e.id));return ppl.filter(p=>ids.has(idOf(p)));}
  return ppl;
}
function computeHost(){const e=eligible();return e.length?idOf(e[0]):null;}

function netPeersChanged(){
  if(!NET.on)return;readChat();
  // read state from whoever publishes it
  const pub=peersNow().filter(p=>p.presence.S&&!p.isMe);
  const want=computeHost();
  if(want===PID){if(!NET.host&&!NET.hostPeer&&NET.settled)becomeHost();}
  else{
    if(NET.host){NET.host=false;pres({S:null});}
    const src=pub.find(p=>idOf(p)===want)||pub.sort((a,b)=>a.presence.t-b.presence.t)[0];
    if(src){const id=idOf(src);if(NET.handover&&id!==NET.hostPeer&&G&&G.mp&&!G.over){const nm=cleanName(src.presence.n)||'Another player';toast(nm+' is hosting the table now');gameLog(nm+' is hosting the table now.','good');}
      NET.handover=false;NET.hostPeer=id;NET.hostGoneT=0;netApply(src.presence.S);}
  }
  if(NET.view==='lobby')renderLobby();
}

/* ---------- host ---------- */
function becomeHost(){
  const S=NET.S;NET.host=true;NET.handover=false;
  if(!S||S.st==='lobby'){NET.gst='lobby';if(S){NET.diff=S.d||NET.diff;NET.ai=S.ai!==false;}NET.R=null;}
  else{ // take over a running table
    NET.gst=S.st;NET.gid=S.gid;NET.diff=S.d;NET.ai=S.ai;NET.R=S.R.map(e=>({...e}));NET.win=S.win||null;NET.pl=S.pl||null;NET.why=S.why||'';
    NET.T={ph:S.ph,w:S.w,bt:S.bt||1,mt:S.mt||8,el:0,wt:[]};
    if(G&&G.mp&&G.mp.gid===S.gid){
      for(const p of G.players){if(p.human)continue;const e=NET.R[p.gi];if(e.id&&!e.x){p.remote=true;p.pid=e.id;p.awayT=0;}else{p.remote=false;}}
      G.outOrder=G.players.filter(p=>!p.alive).sort((a,b)=>(a.outWave||0)-(b.outWave||0));
      if(HD){const used=new Set();HD.seats.forEach(s=>s.cards.forEach(c=>used.add(c.v+c.s)));HD.deck=newDeck().filter(c=>!used.has(c.v+c.s));HD.muck=[];HD.aiT=.8;
        G.handNo=HD.n;G.dealerIdx=HD.dealer;
        if(['tip','bet1','draw','bet2'].includes(HD.phase)){ // the old host took the deck with them: call the hand off and refund everyone
          for(const s of HD.seats){s.won=s.paid;s.folded=true;if(s.p.human)G.me.chips+=s.paid;else if(!s.p.remote)s.p.chips+=s.paid;}
          HD.wl=[];HD.result='Hand called off: the host left. Bets returned.';HD.phase='showdown';HD.t=3;HD.winners=[];gameLog(HD.result,'bad');}}
    }
    if(S.ph==='mini'&&S.sb)NET.SB=sbRestore(S.sb);
    gameLog('You are now hosting the table.','good');toast('You are hosting the table now');
  }
  pres({S:hostState()});
  if(NET.view==='lobby')renderLobby();
}
/* a new host rebuilds Sports Night from what the old host last published; fights in progress are settled by the house */
function sbRestore(P){
  const SB={w:P.w,games:(P.games||[]).map(g=>({...g})),bye:P.bye,stage:P.stage,t:Math.max(3,P.t||0),res:P.res||null,ros:{},out:P.out||null,seed:P.seed||null};
  SB.aiRos={};for(const p of G.players)if(!p.human&&!p.remote&&p.alive)SB.aiRos[sbId(p)]=aiRoster(p,SB.w);
  if(P.ros)for(const id in P.ros)SB.ros[id]=P.ros[id];
  if(SB.stage!=='intro')for(const id of sbParticipants(SB))if(!SB.ros[id]||!SB.ros[id].length)SB.ros[id]=sbRosterOf(SB,id);
  if(SB.stage==='play'||(SB.stage!=='intro'&&SB.stage!=='bet')){SB.prot={};for(const id of sbParticipants(SB))SB.prot[id]=sbProtOf(SB,id);}
  if(SB.stage==='play'){ // the live fights left with the old host: let the house call them
    const seed=SB.seed||SB.games.map(()=>1+((Math.random()*1e9)|0));SB.seed=seed;
    SB.res=SB.games.map((g,i)=>arenaRun(SB.ros[g.a]||[],SB.ros[g.b]||[],seed[i]).win);
    SB.stage='steal';SB.t=SB_T.steal;if(typeof afExitView==='function')afExitView();
    gameLog('The host left mid-fight, so the house called the results.','bad');}
  return SB;}
function hostState(){
  const S={st:NET.gst,gid:NET.gid,d:NET.diff,ai:NET.ai,code:NET.code};
  if(NET.gst==='lobby'||!G||!G.mp)return S;
  const T=NET.T;S.R=NET.R;S.ph=T.ph;S.w=T.w;S.bt=r1(T.bt);S.wt=T.wt;if(T.ph==='mini')S.mt=r1(T.mt);if(T.ph==='mini'&&NET.SB){const B=NET.SB;S.sb={w:B.w,games:B.games,bye:B.bye,stage:B.stage,t:r1(B.t),res:B.res,ros:B.stage==='intro'||B.stage==='bet'?null:B.ros,out:B.out,seed:B.seed};}
  const P=[];for(const p of G.players){P[p.gi]=[Math.round(p.human?G.me.chips:p.chips),p.alive?1:0,Math.round(p.human?G.base.hp:p.hp||0),Math.round(p.human?armyPower():p.power||0),(p.human?G.lastUnitK:p.lastUnit)||'',p.outWave||0,
    p.bark&&performance.now()<p.bark.until?[p.bark.text,Math.round(p.bark.until-performance.now())]:0];}
  S.P=P;
  if(HD)S.H={n:HD.n,ph:HD.phase,ev:HD.ev||0,m:HD.mult||1,ms:HD.maxSwap||3,t:r1(HD.t),d:HD.dealer,a:HD.actor,tu:HD.tu,cb:HD.curBet,r:HD.raises,sz:HD.size,
    wl:HD.wl||[],win:(HD.winners||[]).map(s=>HD.seats.indexOf(s)),nd:[...(HD.need||[])],
    S:HD.seats.map(s=>[s.p.gi,cardsFor(s),(s.folded?1:0)|(s.allIn?2:0)|(s.shown?4:0)|(s.ready?8:0)|(s.done?16:0),s.bet,s.contrib,s.tip,s.extra||0,s.act||'',s.changes==null?-1:s.changes,s.drew||0,s.paid||0,s.won||0,s.maxSwap||0,s.luck||1,s.fav?1:0,s.luckUsed||0,sealedFor(s)])};
  if(NET.gst==='over'){S.win=NET.win;S.pl=NET.pl;S.why=NET.why;}
  return S;
}
function cardsFor(s){ // only revealed hands travel in the clear
  if(s.shown&&HD&&(HD.phase==='showdown'||HD.phase==='done'))return encCards(s.cards);
  if(s.p.remote&&!KEYS.kp)return encCards(s.cards); // no crypto here: fall back to the old behaviour
  if(s.p.remote){const pr=presOf(s.p.pid);if(!pr||!pr.pk)return encCards(s.cards);}
  return '';}
function sealedFor(s){if(!s.p.remote||!KEYS.kp||!HD)return 0;const pr=presOf(s.p.pid);if(!pr||!pr.pk)return 0;const plain=HD.n+':'+encCards(s.cards),c=NET.enc[s.p.gi];
  if(c&&c.plain===plain&&c.pk===pr.pk)return c.blob||0;
  if(!c||c.plain!==plain||c.pk!==pr.pk){const job={plain,pk:pr.pk,blob:null};NET.enc[s.p.gi]=job;sealFor(pr.pk,plain).then(b=>{job.blob=b;hostPublish(true);});}
  return 0;}
function armyPower(){let s=0;for(const u of G.units)s+=unitDps(u.k)*(1+UNITS[u.k].hp/900)*(1+.15*(u.rank||0));return s;}
function hostCreateGame(){
  const ppl=lobbyPeople().slice(0,MAX_SEATS);
  const used={};const R=ppl.map((p,i)=>{let n=cleanName(p.presence.n)||'Player';const base=n.slice(0,12);let k=1;while(used[n.toLowerCase()])n=base+' '+(++k);used[n.toLowerCase()]=1;return {id:idOf(p),n,c:i};});
  let nai=NET.ai?MAX_SEATS-R.length:0;if(R.length+nai<2)nai=1;
  const ri=shuffleArr(RIVALS.map((r,i)=>i)).slice(0,nai);
  // interleave the house rivals between people so the table feels mixed
  const out=[];let a=0;R.forEach((e,i)=>{out.push(e);if(a<ri.length&&i<R.length-1)out.push({ai:ri[a++]});});while(a<ri.length)out.push({ai:ri[a++]});
  // the host must sit at index 0 of its own rotation; any index works since rotation handles it
  NET.R=out;NET.gid=Math.random().toString(36).slice(2,8);NET.gst='game';NET.win=null;NET.pl=null;NET.why='';
  NET.T={ph:'break',w:0,bt:3,el:0,wt:[]};
  startMpGame(NET.R,NET.R.findIndex(e=>e.id===PID),NET.gid,NET.diff);
  pres({S:hostState()});
}
function hostToLobby(){NET.gst='lobby';NET.R=null;NET.T=null;pres({S:hostState(),g:null});showLobby();}

function mpPlayers(mp,d){
  const out=[],n=mp.R.length;
  for(let k=0;k<n;k++){const gi=(mp.me+k)%n,e=mp.R[gi];let p;
    if(e.ai!=null){const r=RIVALS[e.ai];p={...r,human:false,remote:false,chips:d.start,alive:true,hp:100,maxHp:100,power:12,lastUnit:null,lastDmg:0};}
    else{const nm=cleanName(e.n)||'Player';p={human:k===0,remote:k!==0,pid:e.id,name:k===0?'You':nm,short:nm,col:HUMAN_COLS[(e.c||0)%6],face:(nm[0]||'?').toUpperCase(),
      chips:d.start,alive:true,hp:100,maxHp:100,power:0,lastUnit:null,aggr:.45,bluff:.12,tip:.25,person:true};}
    p.gi=gi;out.push(p);}
  return out;
}
function byGi(gi){return G.players.find(p=>p.gi===gi);}

function hostTick(dt){
  if(NET.gst==='lobby'||!G||!G.mp){hostPublish();return;}
  const T=NET.T;syncRemotes();
  if(NET.gst==='game'){
    if(HD)processIntents();
    if(T.ph==='break'){T.bt-=dt;if(T.bt<=0){T.ph='hand';if(G.phase==='wait'||G.phase==='break')G.phase='hand';startHand();}}
    else if(T.ph==='hand'){if(HD)pokerUpdate(dt);}
    else if(T.ph==='wave'){T.el+=dt;T.wt=waitList();if(!T.wt.length||T.el>WAVE_CAP)resolveWave();}
    else if(T.ph==='mini'&&NET.SB){mpMini(T.w,T.mt);sbTick(NET.SB,dt);if(AFH&&AFH.w===NET.SB.w&&NET.SB.stage==='play')afHostTick(dt);T.wt=[];if(NET.SB.stage==='over'){T.ph='break';T.bt=1.5;if(MG&&MG.kind==='sports')forceFinishMini();NET.SB=null;}}
    else if(T.ph==='mini'){T.mt-=dt;mpMini(T.w,T.mt);T.wt=miniWaitList();if(!T.wt.length||T.mt<=0){T.ph='break';T.bt=1.5;T.wt=[];if(MG&&!MG.done)forceFinishMini();}}
  }
  hostPublish();
}
function hostPublish(force){
  const now=performance.now();if(!force&&now-NET.lastPub<120)return;
  const S=hostState(),sig=JSON.stringify(S);if(sig===NET.pubSig&&now-NET.lastPub<3000)return;
  NET.pubSig=sig;NET.lastPub=now;pres({S});
}
function hostStartWave(){ // called when the showdown ends
  const T=NET.T;T.w++;rivalIncome(T.w);T.ph='wave';T.el=0;
  if(!G.over){G.wave=T.w-1;startWave();}
  if(HD)HD.phase='done';
}
function waitList(){
  const T=NET.T,out=[];
  if(!G.over&&G.phase==='wave'&&G.wave<=T.w)out.push(G.me.gi);
  for(const p of G.players){if(!p.remote||!p.alive)continue;const pr=presOf(p.pid),g=pr&&pr.g;if(!g||g.gid!==NET.gid)continue;if((g.wd||0)<T.w)out.push(p.gi);}
  return out;
}
function resolveWave(){
  const T=NET.T;rivalSim(T.w);refreshTable(true);
  T.ph='break';T.bt=2.5;T.wt=[];
  checkOver(true);
  if(NET.gst==='game'&&miniAfter(T.w)){T.ph='mini';T.mt=MINI_TIME+5;if(miniAfter(T.w)==='sports'){NET.SB=sbSetup(T.w);T.mt=999;}}
}
function miniWaitList(){
  const T=NET.T,out=[];
  if(!G.over&&!G.spectate&&(NET.md||0)<T.w)out.push(G.me.gi);
  for(const p of G.players){if(!p.remote||!p.alive||p.left)continue;const pr=presOf(p.pid),g=pr&&pr.g;if(!g||g.gid!==NET.gid)continue;if((g.md||0)<T.w)out.push(p.gi);}
  return out;
}
function checkOver(afterWave){
  if(NET.gst!=='game')return;const T=NET.T;
  const alive=G.players.filter(p=>p.alive);
  let win=null,why='';
  if(alive.length<=1){win=alive.length?alive:[G.outOrder[G.outOrder.length-1]].filter(Boolean);why='last';}
  else if(!alive.some(p=>p.human||p.remote)){win=alive;why='house';}
  else if(afterWave&&T.w>=MAX_WAVE){win=alive;why='survived';}
  if(!win)return;
  NET.gst='over';NET.why=why;NET.win=win.map(p=>p.gi);
  const pl=[];const ws=new Set(NET.win);let place=1;for(const gi of NET.win)pl[gi]=1;place=NET.win.length+1;
  const rest=G.players.filter(p=>!ws.has(p.gi)).sort((a,b)=>(b.outWave||0)-(a.outWave||0)||G.outOrder.indexOf(b)-G.outOrder.indexOf(a));
  for(const p of rest)pl[p.gi]=place++;NET.pl=pl;
  hostPublish(true);netEndLocal();
}
function syncRemotes(){
  const now=Date.now();
  for(const p of G.players){
    if(p.left&&p.pid){const pr=presOf(p.pid);if(pr&&pr.g&&pr.g.gid===NET.gid){p.left=false;p.remote=true;p.awayT=0;const e=NET.R[p.gi];if(e)e.x=0;gameLog(`${p.short} is back at the table.`,'good');toast(p.short+' is back');}}
    if(!p.remote)continue;const pr=presOf(p.pid);
    if(!pr){if(!p.awayT)p.awayT=now;if(now-p.awayT>AWAY_MS)houseTakeover(p);continue;}
    p.awayT=0;const g=pr.g;if(!g||g.gid!==NET.gid)continue;
    p.hp=g.hp;p.power=g.pw||0;p.lastUnit=g.lu||null;
    const s=seatOf(p),paid=s?s.paid:0,ack=g.ack&&HD&&g.ack[0]===HD.n?g.ack[1]:0;
    p.chips=Math.max(0,(g.ch||0)-Math.max(0,paid-ack));
    if(p.alive&&!g.al)playerBusted(p,NET.T.w);
  }
}
function playerBusted(p,w){p.alive=false;p.hp=0;p.outWave=w;if(!G.outOrder.includes(p))G.outOrder.push(p);
  banner(p.short+' is busted','','bust');gameLog(`${p.short}'s casino fell on round ${w}.`,'bad');Snd.play('bust');checkOver(false);}
function houseTakeover(p){
  p.remote=false;p.left=true;p.aggr=.45;p.bluff=.12;p.tip=.2;p.power=Math.max(12,p.power||0);p.hp=p.hp||60;
  const e=NET.R[p.gi];if(e)e.x=1;
  gameLog(`${p.short} left. The house runs their casino now.`,'bad');toast(p.short+' left the table');
}
function processIntents(){
  HD.seats.forEach((s,i)=>{if(!s.p.remote)return;const pr=presOf(s.p.pid),g=pr&&pr.g,inn=g&&g.in;if(!inn||inn.h!==HD.n)return;
    if(HD.phase==='tip'){if((inn.tip||0)>s.tip)tipDealer(Math.min(200,inn.tip-s.tip),s);if(inn.rd)s.ready=true;}
    else if((HD.phase==='bet1'||HD.phase==='bet2')&&HD.actor===i&&inn.tu===HD.tu&&['fold','check','call','raise'].includes(inn.a))act(i,inn.a);
    else if(HD.phase==='draw'&&!s.folded&&!s.done&&inn.dr!=null){
      if(Array.isArray(inn.dr)&&s.changes>0){const ix=[...new Set(inn.dr.filter(x=>Number.isInteger(x)&&x>=0&&x<5))].slice(0,s.maxSwap||HD.maxSwap||3);if(ix.length){drawInto(s,ix);s.changes--;}}
      s.done=true;
    }});
}

/* ---------- client ---------- */
function startMpGame(R,me,gid,dk){
  const spec=me<0;newGame(dk,{R,me:spec?0:me,gid});G.mp.code=NET.code;G.phase='hand';G.running=!spec;G.byGi={};for(const p of G.players)G.byGi[p.gi]=p;
  if(spec){G.spectate=true;for(const p of G.players){p.human=false;if(p.pid){p.remote=true;p.name=p.short;}}G.me={name:'You',chips:0,alive:false,gi:-1,dummy:true};}
  NET.watch=null;NET.knownWatch=new Set();NET.bdOn=false;NET.ack={h:-1,a:0};NET.wonH=-1;NET.spawnH=-1;NET.disc=null;NET.myIn={h:-1};NET.seenEmo={};NET.overShown=false;NET.md=0;NET.miniW=null;
  resetGameUI();NET.view='game';hideOverlay();document.body.classList.toggle('spectate',!!G.spectate);
  // came back after a reload? restore this browser tab's board for the same game
  const snap=readMpSnap();if(!spec&&snap&&snap.gid===gid){applyBoard(snap.board);NET.ack=snap.ack;NET.wonH=snap.wonH;NET.spawnH=snap.spawnH;NET.myCards=snap.myCards||null;NET.md=snap.md||0;NET.miniW=snap.md||null;G.phase='wait';G.lastUnitK=snap.lu||null;
    toast('Welcome back. Your casino is as you left it.');gameLog('Reconnected: your casino was restored.','good');}
  if(spec){banner('Spectating','Room '+NET.code+' · you\'ll be dealt into the next game','round');const first=G.players.find(p=>p.pid&&p.alive);if(first)setTimeout(()=>openWatch(first.gi,true),400);}
  else banner('Room '+NET.code,R.filter(e=>e.id).length+' players · '+DIFFS[dk].name,'round');
}
function netApply(S){
  if(!S)return;const prev=NET.S;NET.S=S;
  if(S.st==='lobby'){
    if(NET.view!=='lobby'&&(!G||!G.mp||G.over||NET.view==='game'&&prev&&prev.st!=='lobby'))showLobby();
    else if(NET.view==='lobby')renderLobby();
    return;}
  const me=S.R?S.R.findIndex(e=>e.id===PID):-1;
  if(me<0&&S.st==='over'){if(NET.view!=='lobby')showLobby();else renderLobby();return;}
  if(!G||!G.mp||G.mp.gid!==S.gid){if(S.st==='over')return;if(me<0&&NET.view==='lobby'&&!NET.specOk){renderLobby();return;}startMpGame(S.R,me,S.gid,S.d);}
  clientSync(S);
}
function clientSync(S){
  // other players
  S.P.forEach((a,gi)=>{const p=G.byGi[gi];if(!a||!p||p.human)return;
    p.chips=a[0];p.hp=a[2];p.power=a[3];p.lastUnit=a[4]||null;p.outWave=a[5];
    const e=S.R[gi];if(e&&e.x&&!p.left){p.left=true;gameLog(`${p.short} left. The house runs their casino now.`,'bad');}else if(e&&!e.x&&p.left){p.left=false;gameLog(`${p.short} is back at the table.`,'good');}
    if(p.alive&&!a[1]){p.alive=false;banner((p.short||p.name)+' is busted','','bust');gameLog(`${p.short||p.name}'s casino fell on round ${a[5]}.`,'bad');Snd.play('bust');}
    p.alive=!!a[1];
    if(a[6]){const until=performance.now()+a[6][1];if(!p.bark||p.bark.text!==a[6][0]||Math.abs(p.bark.until-until)>900)p.bark={text:a[6][0],until};}});
  // hand
  const prevHD=HD;
  if(S.H)HD=decodeHD(S.H);
  if(HD)handFx(prevHD,HD);
  // waves
  if(G.spectate){G.wave=S.w;G.phase=S.ph==='wave'?'wave':'hand';G.tableWait=S.wt||[];if(S.st==='over')netEndLocal();return;}
  if(S.ph==='wave'&&S.w>G.wave&&!G.over){
    const hs=HD&&humanSeat();
    if(hs&&hs.ev&&NET.spawnH!==HD.n){NET.spawnH=HD.n;G.lastUnitK=hs.ev.unit;spawnHandUnits(hs.ev.unit,hs.ev);}
    G.wave=S.w-1;startWave();}
  else if((S.ph==='hand'||S.ph==='break')&&(G.phase==='wait'||G.phase==='break'))G.phase='hand';
  if(S.ph==='mini'&&S.sb){if(!NET.SBS||NET.SBS.w!==S.sb.w||NET.SBS.stage!==S.sb.stage)NET.SBS=Object.assign({},S.sb);else Object.assign(NET.SBS,{res:S.sb.res,ros:S.sb.ros||NET.SBS.ros,out:S.sb.out,games:S.sb.games,seed:S.sb.seed||NET.SBS.seed});}
  if(S.ph==='mini')mpMini(S.w,S.mt);else if(MG&&!MG.done)forceFinishMini();
  G.tableWait=S.wt||[];
  if(S.st==='over')netEndLocal();
}
function decodeHD(h){
  const seats=h.S.map(a=>{const p=G.byGi[a[0]];let cards=decCards(a[1]);
    if(p&&p.human&&!cards.length){if(NET.myCards&&NET.myCards.n===h.n)cards=NET.myCards.cards;if(a[16])unsealMine(a[16],h.n);}
    return {p,cards,ev:cards.length===5?eval5(cards):null,folded:!!(a[2]&1),allIn:!!(a[2]&2),shown:!!(a[2]&4),ready:!!(a[2]&8),done:!!(a[2]&16),
      bet:a[3],contrib:a[4],tip:a[5],extra:a[6],act:a[7],changes:a[8]<0?undefined:a[8],drew:a[9],paid:a[10],won:a[11],maxSwap:a[12]||0,luck:a[13]||1,fav:!!a[14],luckUsed:a[15]||0,disc:new Set()};});
  const o={n:h.n,phase:h.ph,ev:h.ev||null,mult:h.m,maxSwap:h.ms,t:h.t,dealer:h.d,actor:h.a,tu:h.tu,curBet:h.cb,raises:h.r,size:h.sz,wl:h.wl,
    seats,winners:h.win.map(i=>seats[i]).filter(Boolean),need:new Set(h.nd),aiT:.8,deck:null,muck:[]};
  o.result=resultText(o);
  const hs=seats.find(s=>s.p&&s.p.human);
  if(hs){ // my own pending choices survive the next snapshot
    if(NET.disc&&NET.disc.h===o.n&&o.phase==='draw'&&!hs.done)hs.disc=new Set(NET.disc.d);
    const mi=NET.myIn;if(mi.h===o.n){if(mi.rd)hs.ready=true;if(mi.dr!=null&&o.phase==='draw')hs.done=true;}
    // chips leave my stack as the table takes them, and come back when I win
    if(NET.ack.h!==o.n)NET.ack={h:o.n,a:0};
    const d=hs.paid-NET.ack.a;if(d>0){G.me.chips=Math.max(0,G.me.chips-d);NET.ack.a=hs.paid;}
    if(hs.won>0&&NET.wonH!==o.n&&(o.phase==='showdown'||o.phase==='done')){NET.wonH=o.n;G.me.chips+=hs.won;G.stats.earned+=hs.won;}
  }
  return o;
}
function unsealMine(blob,n){if(NET.unsealing===blob)return;NET.unsealing=blob;const hp=NET.hostPeer&&presOf(NET.hostPeer);if(!hp||!hp.pk)return;
  openFrom(hp.pk,blob).then(t=>{if(!t)return;const i=t.indexOf(':'),hn=+t.slice(0,i);const cards=decCards(t.slice(i+1));const prev=NET.myCards;NET.myCards={n:hn,cards};
    if(NET.S&&(!prev||prev.n!==hn||encCards(prev.cards)!==encCards(cards)))clientSync(NET.S);});}
function handFx(a,b){
  const hs=b.seats.find(s=>s.p&&s.p.human);
  if(!a||a.n!==b.n){if(b.ev){banner(TABLE_EVENTS[b.ev].name,TABLE_EVENTS[b.ev].desc,'great');}Snd.play('chips');refreshTable(true);return;}
  if(a.phase!==b.phase){
    if(b.phase==='bet1'){Snd.play('deal');if(hs&&hs.extra)gameLog(`The dealer smiles on you: best of ${hs.extra+1} hands.`,'good');}
    else if(b.phase==='bet2')Snd.play('deal');
    else if(b.phase==='showdown'){gameLog(b.result,hs&&hs.won?'good':'');if(hs&&hs.won>0){Snd.play('win');potWin(hs.won);}}
    if(b.phase==='bet2'&&hs&&hs.luckUsed>1&&hs.drew)toast(`The dealer drew your swap best of ${hs.luckUsed}`);
    if(b.phase==='bet1'&&hs&&hs.fav)gameLog("You're the dealer's favourite: swap up to "+hs.maxSwap+' cards.','good');
  }
  b.seats.forEach((s,i)=>{const o=a.seats[i];if(!o||o.act===s.act||!s.act)return;
    if(s.act==='Fold')Snd.play('fold');else if(s.act==='Check')Snd.play('click');else if(/^(Call|Raise|Bet|All in|Tipped)/.test(s.act))Snd.play(s.act.startsWith('Tipped')?'coin':'chips');});
  if(a.actor!==b.actor||a.phase!==b.phase)refreshTable(true);
}
function intent(patch){
  if(!HD)return;if(NET.myIn.h!==HD.n)NET.myIn={h:HD.n};Object.assign(NET.myIn,patch);
  const hs=humanSeat();if(hs){if(patch.rd)hs.ready=true;if(patch.dr!=null)hs.done=true;}
  publishG(true);refreshTable(true);
}
function intentTip(n){const hs=humanSeat();if(!HD||HD.phase!=='tip'||!hs)return;const cur=Math.max(hs.tip,NET.myIn.h===HD.n&&NET.myIn.tip||0);
  if(G.me.chips-(cur-hs.tip)<n){toast('Not enough chips');Snd.play('error');return;}intent({tip:cur+n});Snd.play('coin');}
function publishG(force){
  if(!NET.on||!G||!G.mp)return;const now=performance.now();if(!force&&now-NET.lastG<200)return;
  if(G.spectate){const g={gid:G.mp.gid,spec:1,wt:NET.watch?NET.watch.gi:-1};const sig=JSON.stringify(g);if(sig!==NET.gSig){NET.gSig=sig;NET.lastG=now;pres({g});}return;}
  if(now-NET.lastSnap>3000||force&&G.phase==="wait"){NET.lastSnap=now;writeMpSnap();}
  const g={gid:G.mp.gid,hp:Math.round(G.base.hp),al:G.over&&!G.won?0:1,ch:Math.round(G.me.chips),pw:Math.round(armyPower()),lu:G.lastUnitK||'',
    wd:G.phase==='wave'?G.wave-1:G.wave,ack:[NET.ack.h,NET.ack.a],in:NET.myIn,emo:NET.emo||0,md:NET.md||0,sb:NET.sbOut||null,wt:NET.watch?NET.watch.gi:-1};
  const sig=JSON.stringify(g);if(sig===NET.gSig&&!force&&now-NET.lastG<3000)return;NET.gSig=sig;NET.lastG=now;pres({g});
}
function readEmotes(){
  for(const p of G.players){if(!p.pid||p.human)continue;const pr=presOf(p.pid);if(!pr||!pr.g||pr.g.gid!==G.mp.gid)continue;const e=pr.g.emo;
    if(NET.seenEmo[p.pid]===undefined){NET.seenEmo[p.pid]=e?e[0]:0;continue;}if(!e)continue;
    if(NET.seenEmo[p.pid]!==e[0]){NET.seenEmo[p.pid]=e[0];if(EMOTES[e[1]]){p.bark={text:EMOTES[e[1]],until:performance.now()+3200};Snd.play('click');}}}
}
function sendEmote(i){const now=performance.now();if(now-NET.emoT<1800)return;NET.emoT=now;NET.emoSeq++;NET.emo=[NET.emoSeq,i];
  const b=$('#myBubble');b.textContent=EMOTES[i];b.classList.remove('on');void b.offsetWidth;b.classList.add('on');clearTimeout(sendEmote._t);sendEmote._t=setTimeout(()=>b.classList.remove('on'),3000);publishG(true);}
function netEndLocal(){
  const S=NET.host?hostState():NET.S;if(!S||S.st!=='over'||NET.overShown||!G||!G.mp)return;NET.overShown=true;
  if(G.spectate){const ws=(S.win||[]).map(gi=>{const p=byGi(gi);return p?p.short||p.name:'?';});banner('Game over',(ws.length?ws.join(' & ')+' take'+(ws.length>1?'':'s')+' the Strip':'')+' · next game soon','round');gameLog('Game over. '+ws.join(' & ')+' won.','good');return;}
  const gi=G.me.gi;G.place=(S.pl&&S.pl[gi])||G.place;
  if(S.win&&S.win.includes(gi)&&!G.over)victory(S.why==='survived'?'survived':'last');
  else if(!G.over){G.over=true;G.won=false;showEnd(false);}
  else showEnd(G.won,S.why);
}
function onBust(){
  publishG(true);
  if(NET.host){G.me.outWave=NET.T?NET.T.w:G.wave;if(!G.outOrder.includes(G.me))G.outOrder.push(G.me);checkOver(false);}
}
function netTick(dt){
  if(!NET.on)return;
  // host gone? hand over after a grace period
  if(!NET.settled&&Date.now()-NET.joinT>2500){ // take a seniority stamp later than everyone already here
    NET.settled=true;const ts=peersNow().filter(p=>!p.isMe&&p.presence.t<9e15).map(p=>p.presence.t);NET.t=Math.max(Date.now(),ts.length?Math.max(...ts)+1:0);pres({t:NET.t});}
  if(!NET.host&&NET.hostPeer){const here=peersNow().some(p=>idOf(p)===NET.hostPeer);
    if(!here){if(!NET.hostGoneT){NET.hostGoneT=Date.now();if(G&&G.mp&&!G.over){toast('The host dropped out. Handing the table over…');gameLog('The host dropped out. Handing the table to the next player…','bad');}}
      else if(Date.now()-NET.hostGoneT>HOST_GRACE){NET.hostPeer=null;NET.handover=true;netPeersChanged();}}else NET.hostGoneT=0;}
  else if(!NET.host&&!NET.hostPeer&&NET.settled&&computeHost()===PID)becomeHost();
  if(NET.host)hostTick(dt);
  else if(HD&&HD.phase!=='done'&&HD.t>0)HD.t-=dt;
  if(G&&G.mp){publishG();readEmotes();publishBoard();if(NET.watch)stepWatch(dt);}
}
function waitNames(){return (G.tableWait||[]).map(gi=>{const p=byGi(gi);return p&&!p.human?p.short||p.name:null;}).filter(Boolean);}
// keep the table alive when the tab is in the background (requestAnimationFrame pauses there)
setInterval(()=>{if(!NET.on)return;const now=performance.now();if(now-NET.lastFrame<400)return;const dt=Math.min(1,(now-(NET.bgLast||now))/1000);NET.bgLast=now;
  if(G&&G.mp&&G.running&&!G.over){let n=Math.min(60,Math.round(dt/STEP));while(n-->0){update(STEP);if(G.over)break;}}
  netTick(dt);},250);
/* ---------- reconnect snapshots (per browser tab) ---------- */
function writeMpSnap(){if(!G||!G.mp||G.spectate||G.over)return;try{sessionStorage.setItem('allin-mp',JSON.stringify({gid:G.mp.gid,board:buildSnap(),ack:NET.ack,wonH:NET.wonH,spawnH:NET.spawnH,myCards:NET.myCards,lu:G.lastUnitK||null,md:NET.md||0}));}catch(e){}}
function readMpSnap(){try{return JSON.parse(sessionStorage.getItem('allin-mp')||'null');}catch(e){return null;}}
/* ---------- chat ---------- */
function sendChat(text){text=String(text||'').replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,'').replace(/\s+/g,' ').trim().slice(0,120);
  if(!text||!NET.on)return false;const now=performance.now();if(now-NET.lastChatT<900){toast('Easy, one message a second');return false;}NET.lastChatT=now;
  NET.chatSeq++;NET.chatOut.push([NET.chatSeq,text]);if(NET.chatOut.length>3)NET.chatOut.shift();pres({ch:NET.chatOut.slice()});
  showChat(PID,NET.name,text,true);return true;}
function chatColour(id){if(G&&G.mp&&G.mp.R){const i=G.mp.R.findIndex(e=>e.id===id);if(i>=0&&G.mp.R[i].c!=null)return HUMAN_COLS[G.mp.R[i].c%6];}const i=lobbyPeople().findIndex(p=>idOf(p)===id);return HUMAN_COLS[(i<0?0:i)%6];}
function showChat(id,name,text,mine){gameLog(text,'chat',{name:mine?'You':cleanName(name)||'Player',col:chatColour(id)});
  if(G&&G.mp){const p=G.players.find(x=>x.pid===id&&!x.human);if(p)p.bark={text:text.length>48?text.slice(0,46)+'…':text,until:performance.now()+4200};if(!mine)Snd.play('click');}
  if(NET.view==='lobby'&&typeof renderLobbyChat==='function')renderLobbyChat();}
function readChat(){for(const p of peersNow()){if(p.isMe&&p.sameTab)continue;const id=idOf(p),ch=p.presence.ch;if(!Array.isArray(ch)){if(NET.chatSeen[id]===undefined)NET.chatSeen[id]=0;continue;}
  const seen=NET.chatSeen[id];if(seen===undefined){NET.chatSeen[id]=ch.length?ch[ch.length-1][0]:0;continue;}
  for(const m of ch){if(!Array.isArray(m)||typeof m[0]!=='number'||m[0]<=NET.chatSeen[id])continue;NET.chatSeen[id]=m[0];const t=String(m[1]||'').slice(0,120);if(t)showChat(id,p.presence.n,t,false);}}}
Object.assign(NET,{sendChat,hostStartWave,onBust,intent,intentTip,sendEmote,hostCreateGame,hostToLobby,join:netJoin,leave:netLeave,tick:netTick,waitNames,presOf,peersNow,lobbyPeople,computeHost});

/* ---------- watching a friend's casino ----------
   A player streams a compact copy of their board only while someone is watching them. */
const UK=Object.keys(UNITS),EK=Object.keys(ENEMIES);
const PCOLS=['#fde68a','#22e1ff','#ff3d9a','#b6f84a','#c084fc','#fb923c','#f5f5f5','#ff3b3b'];
const b36=(n,w)=>Math.max(0,Math.min(Math.pow(36,w)-1,n|0)).toString(36).padStart(w,'0');
const u36=(s,i,w)=>parseInt(s.substr(i,w),36);
function pcol(c){if(!c||c[0]!=='#'||c.length<7)return 0;const n=parseInt(c.slice(1,7),16),r=n>>16,g=(n>>8)&255,b=n&255;let best=0,bd=1e9;
  PCOLS.forEach((p,i)=>{const m=parseInt(p.slice(1),16),d=((m>>16)-r)**2+(((m>>8)&255)-g)**2+((m&255)-b)**2;if(d<bd){bd=d;best=i;}});return best;}
function encodeBoard(){
  let u='';for(const x of G.units.slice(0,60))u+=b36(UK.indexOf(x.k),2)+b36(x.id%1296,2)+b36(x.x/2,2)+b36(x.y/2,2)+b36(x.hp/x.maxHp*35,1)
    +b36((x.face>0?1:0)|((x.atk||0)>.45?2:0)|((x.siegeP||0)>.5?4:0)|((x.rank||0)<<3),2)+b36((((x.aim||0)/TAU*36)%36+36)%36,1);
  let e='';for(const x of G.enemies){if(x.dead)continue;if(e.length>=9*90)break;e+=b36(EK.indexOf(x.k),1)+b36(x.id%1296,2)+b36(x.x/2,2)+b36(x.y/2,2)+b36(x.hp/x.maxHp*35,1)
    +b36((x.face>0?1:0)|(x.windup>0?2:0)|(x.shield>0?4:0)|(x.stun>0?8:0)|((x.atk||0)>.3?16:0),1);}
  let k='';for(const x of G.workers)k+=b36(x.x/2,2)+b36(x.y/2,2)+b36((x.carry?1:0)|(x.face>0?2:0)|(x.st===1?0:4),1);
  let r='';for(let i=0;i<grid.length;i++)if(grid[i]===2)r+=b36(i,2);
  let p='';for(const x of G.proj){if(p.length>=5*40)break;if(x.delay>0)continue;p+=b36(x.x/2,2)+b36((x.y-(x.h||0))/2,2)+b36(pcol(x.col),1);}
  const boss=G.enemies.find(x=>x.def.boss&&!x.dead);
  return {w:G.wave,ph:G.over?'x':G.phase[0],hp:Math.round(G.base.hp),ti:G.base.tier||0,mh:G.base.maxHp,cn:G.base.cannon,ca:Math.round(G.base.cang*100)/100,n:G.enemies.length+G.spawnQ.length,u,e,k,r,p,bn:boss?boss.name:0};
}
function watchedBy(){if(!G||!G.mp)return [];return peersNow().filter(p=>!p.isMe&&p.presence.g&&p.presence.g.gid===G.mp.gid&&p.presence.g.wt===G.me.gi);}
function publishBoard(){
  const ws=watchedBy();
  for(const p of ws){const id=idOf(p),pl=G.players.find(x=>x.pid===id);if(!NET.knownWatch.has(id)){NET.knownWatch.add(id);toast((pl?pl.short:cleanName(p.presence.n)||'A friend')+' is watching your casino');}}
  NET.knownWatch=new Set([...NET.knownWatch].filter(id=>ws.some(p=>idOf(p)===id)));
  if(!ws.length){if(NET.bdOn){NET.bdOn=false;pres({bd:null});}return;}
  const now=performance.now();if(now-NET.lastBd<200)return;NET.lastBd=now;NET.bdOn=true;pres({bd:encodeBoard()});
}
/* viewer side */
function openWatch(gi,full){
  const p=byGi(gi);if(!p||p.human||!p.pid||p.left){if(p&&!p.human)toast(p.left?p.short+' left. Their casino is run by the house now.':'House rivals have no board to watch');return;}
  NET.watch={gi,pid:p.pid,name:p.short||p.name,full:!!full,bd:null,gotT:0,openT:performance.now(),units:new Map(),enemies:new Map(),workers:[],ropes:[],proj:[],
    GV:{base:{hp:100,maxHp:100,cannon:1,cang:-Math.PI/2,ccd:0},units:[],enemies:[],workers:[],proj:[],eproj:[],fx:[],parts:[],texts:[],marks:[],zones:[],snipes:[],sel:[],
      mode:null,showRoute:false,decreeT:0,running:true,paused:false,over:false,shake:0,time:0}};
  publishG(true);syncWatchUI();Snd.play('click');
}
function closeWatch(){if(!NET.watch)return;NET.watch=null;publishG(true);syncWatchUI();}
function setWatchFull(v){if(!NET.watch)return;NET.watch.full=v;syncWatchUI();}
function ingestBoard(W,bd){
  const now=performance.now();W.gotT=now;W.bd=bd;const GV=W.GV;
  GV.base.hp=bd.hp;GV.base.tier=bd.ti||0;GV.base.maxHp=bd.mh||100;GV.base.cannon=bd.cn;GV.base.cang=bd.ca;
  // creatures
  const seen=new Set();for(let i=0;i+12<=bd.u.length;i+=12){const k=UK[u36(bd.u,i,2)];if(!k)continue;const id=u36(bd.u,i+2,2),x=u36(bd.u,i+4,2)*2,y=u36(bd.u,i+6,2)*2,hf=u36(bd.u,i+8,1)/35,fl=u36(bd.u,i+9,2),aim=u36(bd.u,i+11,1)/36*TAU;
    seen.add(id);let o=W.units.get(id);const d=UNITS[k];
    if(!o||o.k!==k){o={id,k,def:d,x,y,r:d.r,hp:1,maxHp:1,face:1,atk:0,aim,walk:0,spawnT:o?0:.45,siegeP:0,order:{t:'idle'},bob:id%6,flash:0,jh:0,lockT:0,infT:0,fanT:0,stunT:0,target:null,cds:{},rank:0};W.units.set(id,o);}
    o.tx=x;o.ty=y;if(hf<o.hp/o.maxHp-.02)o.flash=.1;o.hp=hf;o.maxHp=1;o.face=fl&1?1:-1;if(fl&2)o.atk=1;o.siegeP=fl&4?1:0;o.rank=fl>>3;o.aim=aim;}
  for(const id of [...W.units.keys()])if(!seen.has(id))W.units.delete(id);
  // bad luck
  const se=new Set();for(let i=0;i+9<=bd.e.length;i+=9){const k=EK[u36(bd.e,i,1)];if(!k)continue;const id=u36(bd.e,i+1,2),x=u36(bd.e,i+3,2)*2,y=u36(bd.e,i+5,2)*2,hf=u36(bd.e,i+7,1)/35,fl=u36(bd.e,i+8,1);
    se.add(id);let o=W.enemies.get(id);const d=ENEMIES[k];
    if(!o||o.k!==k){o={id,k,def:d,x,y,r:d.r,hp:1,maxHp:1,face:1,wob:id%6,atk:0,fx:1,fy:0,slow:0,stun:0,windup:0,shield:0,dashT:0,flash:0,name:d.boss&&bd.bn||d.name};W.enemies.set(id,o);}
    o.tx=x;o.ty=y;if(hf<o.hp-.02)o.flash=.1;o.hp=hf;o.face=fl&1?1:-1;o.windup=fl&2?.5:0;o.shield=fl&4?1:0;o.stun=fl&8?1:0;if(fl&16)o.atk=1;}
  for(const [id,o] of W.enemies)if(!se.has(id)){W.enemies.delete(id);for(let j=0;j<10;j++)GV.parts.push({x:o.x,y:o.y,vx:(Math.random()-.5)*160,vy:(Math.random()-.5)*160,life:.45,max:.45,col:o.def.col,size:2.5});}
  // croupiers, ropes, shots
  const ws=[];for(let i=0,n=0;i+5<=bd.k.length;i+=5,n++){const x=u36(bd.k,i,2)*2,y=u36(bd.k,i+2,2)*2,fl=u36(bd.k,i+4,1);const o=W.workers[n]||{x,y,walk:0,bob:n*1.7,load:0};
    o.tx=x;o.ty=y;o.carry=fl&1?3:0;o.face=fl&2?1:-1;o.st=fl&4?0:1;ws.push(o);}
  W.workers=ws;
  W.ropes=[];for(let i=0;i+2<=bd.r.length;i+=2)W.ropes.push(u36(bd.r,i,2));
  for(let i=0;i+5<=bd.p.length;i+=5)GV.parts.push({x:u36(bd.p,i,2)*2,y:u36(bd.p,i+2,2)*2,vx:0,vy:0,life:.22,max:.22,col:PCOLS[u36(bd.p,i+4,1)]||PCOLS[0],size:4});
}
function stepWatch(dt){
  const W=NET.watch;if(!W)return;const pr=presOf(W.pid);
  if(pr&&pr.bd&&pr.bd!==W.bd)ingestBoard(W,pr.bd);
  const GV=W.GV,a=Math.min(1,dt*9);GV.time+=dt;
  for(const o of W.units.values()){const dx=o.tx-o.x,dy=o.ty-o.y,d=Math.hypot(dx,dy);o.x+=dx*a;o.y+=dy*a;const mv=d>1.2;o.order.t=mv?'move':'idle';if(mv)o.walk+=Math.min(6,d*a)*1.2;o.atk=Math.max(0,o.atk-dt*4);o.spawnT=Math.max(0,o.spawnT-dt);if(o.flash>0)o.flash-=dt;}
  for(const o of W.enemies.values()){const dx=o.tx-o.x,dy=o.ty-o.y;o.x+=dx*a;o.y+=dy*a;o.atk=Math.max(0,o.atk-dt*4);if(o.flash>0)o.flash-=dt;}
  for(const o of W.workers){const dx=o.tx-o.x,dy=o.ty-o.y,d=Math.hypot(dx,dy);o.x+=dx*a;o.y+=dy*a;if(d>.8)o.walk+=d*a;}
  GV.units=[...W.units.values()];GV.enemies=[...W.enemies.values()];GV.workers=W.workers;
  for(const p of GV.parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.92;p.vy*=.92;}GV.parts=GV.parts.filter(p=>p.life>0);if(GV.parts.length>400)GV.parts.splice(0,GV.parts.length-400);
  const p=byGi(W.gi);if(!p||p.left){closeWatch();toast('They left the table');}
}
function watchInfo(){
  const W=NET.watch;if(!W)return '';const p=byGi(W.gi),bd=W.bd;
  if(!bd)return performance.now()-W.openT>4000?'No signal yet':'Tuning in…';
  if(p&&!p.alive)return `Busted on round ${p.outWave||bd.w}`;
  const stale=performance.now()-W.gotT>4000?' · signal lost':'';
  return `Casino ${bd.hp} · Round ${bd.w} · ${bd.ph==='w'?bd.n+' bad luck left':bd.ph==='a'?'wave cleared':'at the table'}${stale}`;
}
Object.assign(NET,{knownWatch:new Set(),lastBd:0,bdOn:false,watch:null,openWatch,closeWatch,setWatchFull,stepWatch,publishBoard});
