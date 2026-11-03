'use strict';
/* ============ ALL IN — online rooms for the public site ============
   The same small room API the game uses inside Claude (join, presence, peers, onPeers, leave),
   built on Supabase Realtime: Presence says who is here, Broadcast carries everyone's state.
   Sends are rate-limited so a whole table stays well inside the free plan's message budget. */
window.ALLIN_ONLINE=(function(){
  const CFG=window.ALLIN_CFG||{};
  const ME='p'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
  let client=null,loading=null;
  function load(){
    if(window.supabase&&window.supabase.createClient)return Promise.resolve();
    if(loading)return loading;
    loading=new Promise((res,rej)=>{const s=document.createElement('script');s.src='vendor/supabase.js';s.onload=res;s.onerror=()=>rej(new Error('could not load the realtime client'));document.head.appendChild(s);});
    return loading;}
  const clone=o=>JSON.parse(JSON.stringify(o));

  function makeRoom(name){
    const ch=client.channel(name,{config:{broadcast:{self:false,ack:false},presence:{key:ME}}});
    const R={mine:{},peers:new Map(),listeners:[],dirty:new Set(),lastSend:0,lastFull:0,timer:null,alive:true,joinedOnce:false,
      budget:40,solo:false,minMs:120,pend:{joined:new Set(),left:new Set(),updated:new Set()},notifyT:null,cache:null,connected:false};
    const others=()=>R.peers.size;
    const interval=()=>{const N=others()+1;const perSec=R.solo?R.budget/N:R.budget/(N*N);return Math.max(R.minMs,1000/perSec);};
    function snapshot(){
      if(R.cache)return R.cache;
      const list=[{peer:ME,presence:Object.freeze(clone(R.mine)),isMe:true,sameTab:true,kind:'viewer',guest:false,by:null,updatedAt:Date.now()}];
      for(const [peer,p] of R.peers)list.push({peer,presence:p.presence,isMe:false,sameTab:false,kind:'viewer',guest:false,by:null,updatedAt:p.updatedAt});
      return R.cache=Object.freeze(list);}
    function notify(){R.cache=null;if(R.notifyT)return;R.notifyT=setTimeout(()=>{R.notifyT=null;const peers=snapshot();
        const pick=set=>peers.filter(p=>set.has(p.peer));
        const ch2={peers,joined:pick(R.pend.joined),updated:pick(R.pend.updated),left:[...R.pend.left].map(peer=>({peer,presence:{},isMe:false,sameTab:false}))};
        R.pend={joined:new Set(),left:new Set(),updated:new Set()};
        for(const fn of R.listeners){try{fn(ch2);}catch(e){console.error(e);}}},0);}
    function send(full){if(!R.alive||!R.connected)return;
      if(!others()){R.dirty.clear();return;}  // nobody to tell: free
      const d={};if(full)Object.assign(d,R.mine);else for(const k of R.dirty)d[k]=k in R.mine?R.mine[k]:null;
      R.dirty.clear();R.lastSend=Date.now();if(full)R.lastFull=R.lastSend;
      ch.send({type:'broadcast',event:'st',payload:{f:ME,full:full?1:0,d}}).catch(()=>{});}
    // one full copy shortly after anyone arrives (hello and presence both trigger it; they share one send)
    function fullSoon(){if(R.fullT)return;R.fullT=setTimeout(()=>{R.fullT=null;send(true);},60+Math.random()*200);}
    function flush(){R.timer=null;if(!R.dirty.size)return;const wait=interval()-(Date.now()-R.lastSend);if(wait>0){R.timer=setTimeout(flush,wait);return;}send(false);}
    function schedule(){if(R.timer)return;const wait=interval()-(Date.now()-R.lastSend);R.timer=setTimeout(flush,Math.max(0,wait));}
    // a full copy every few seconds keeps everyone honest if a message was lost
    const beat=setInterval(()=>{if(R.alive&&R.connected&&others()&&Date.now()-R.lastFull>8000&&Date.now()-R.lastSend>interval())send(true);},2000);

    ch.on('presence',{event:'sync'},()=>{const st=ch.presenceState(),here=new Set(Object.keys(st));const now=Date.now();
      let fresh=false;
      for(const k of here){if(k===ME)continue;let p=R.peers.get(k);if(!p){p={presence:Object.freeze({}),updatedAt:now,seen:true};R.peers.set(k,p);R.pend.joined.add(k);fresh=true;}else p.seen=true;}
      if(fresh)fullSoon();
      for(const [k,p] of [...R.peers]){if(here.has(k))continue;if(p.seen||now-p.updatedAt>8000){R.peers.delete(k);R.pend.left.add(k);R.pend.joined.delete(k);}}
      notify();});
    ch.on('broadcast',{event:'st'},({payload})=>{if(!payload||payload.f===ME)return;const f=payload.f;let p=R.peers.get(f);
      if(!p){p={presence:Object.freeze({}),updatedAt:0,seen:false};R.peers.set(f,p);R.pend.joined.add(f);}
      const next=payload.full?{}:Object.assign({},p.presence);const d=payload.d||{};for(const k in d){if(d[k]===null||d[k]===undefined)delete next[k];else next[k]=d[k];}
      p.presence=Object.freeze(next);p.updatedAt=Date.now();if(!R.pend.joined.has(f))R.pend.updated.add(f);notify();});
    // someone new says hello: they are here even if Presence hasn't told us yet, so greet them with our full state
    ch.on('broadcast',{event:'hi'},({payload})=>{if(!payload||payload.f===ME)return;const f=payload.f;
      if(!R.peers.has(f)){R.peers.set(f,{presence:Object.freeze({}),updatedAt:Date.now(),seen:false});R.pend.joined.add(f);notify();}
      fullSoon();});

    const room={
      presence(patch){if(!R.alive)return Promise.reject(new Error('left'));for(const k in patch){if(patch[k]===null)delete R.mine[k];else R.mine[k]=patch[k];R.dirty.add(k);}
        notify();schedule();return Promise.resolve();},
      peers:()=>snapshot(),
      onPeers(fn){R.listeners.push(fn);setTimeout(()=>{if(!R.listeners.includes(fn))return;const peers=snapshot();fn({peers,joined:peers,updated:[],left:[]});},0);
        return ()=>{R.listeners=R.listeners.filter(x=>x!==fn);};},
      connected:()=>R.connected,
      setBudget(perSec,solo,minMs){R.budget=perSec;R.solo=!!solo;if(minMs!=null)R.minMs=minMs;},
      leave(){if(!R.alive)return Promise.resolve();R.alive=false;clearInterval(beat);clearTimeout(R.timer);clearTimeout(R.fullT);R.listeners=[];
        return ch.untrack().catch(()=>{}).then(()=>client.removeChannel(ch)).catch(()=>{});},
      name};
    return new Promise((resolve,reject)=>{let done=false;
      const to=setTimeout(()=>{if(!done){done=true;reject(new Error('timed out joining '+name));}},12000);
      ch.subscribe(async status=>{
        if(status==='SUBSCRIBED'){R.connected=true;try{await ch.track({t:Date.now()});}catch(e){}
          ch.send({type:'broadcast',event:'hi',payload:{f:ME}}).catch(()=>{});if(Object.keys(R.mine).length)setTimeout(()=>send(true),200);
          if(!done){done=true;clearTimeout(to);resolve(room);}}
        else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){R.connected=false;if(!done&&status!=='CLOSED'){/* the client retries on its own */}}});});
  }

  let api=null;
  return async function(){
    if(api)return api;
    if(!CFG.url||!CFG.key)return null;
    await load();
    client=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:30}}});
    const rooms=new Map();
    api={join:async name=>{if(rooms.has(name))return rooms.get(name);const p=makeRoom(name);rooms.set(name,p);try{const room=await p;const lv=room.leave;room.leave=()=>{if(rooms.get(name)===p)rooms.delete(name);return lv();};return room;}catch(e){rooms.delete(name);throw e;}}};
    return api;};
})();
