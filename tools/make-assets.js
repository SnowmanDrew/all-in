const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
  // favicons from the SVG
  for(const [s,f] of [[32,'favicon-32.png'],[180,'apple-touch-icon.png']]){const p=await b.newPage({viewport:{width:s,height:s}});
    await p.setContent(`<html><body style="margin:0;background:transparent"><img src="http://localhost:8765/favicon.svg" style="width:${s}px;height:${s}px;display:block"></body></html>`);await p.waitForTimeout(300);
    await p.screenshot({path:'/home/claude/all-in/'+f,omitBackground:true});await p.close();}
  // preview card, composed from the game's own art
  const p=await b.newPage({viewport:{width:1200,height:630},deviceScaleFactor:2});p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(1500);
  await p.evaluate(()=>{
    const fan=[10,11,12,13,14].map((v,i)=>cardHTML({v,s:'S'},i,'').replace('class="card','style="--a:'+((i-2)*15)+'deg;--d:0s" class="card')).join('');
    const stk=(cols,n,cls)=>`<div class="stk ${cls}">${Array.from({length:n},(_,i)=>`<i style="--c:${cols[i%cols.length]}"></i>`).join('')}</div>`;
    const crew=['m_house','q_hi','sig_hearts','m_chimera','m_leviathan','m_empress','m_casino','fh_hi'];
    const card=document.createElement('div');card.id='og';
    card.innerHTML=`<div class="ogbg"></div><div class="ttl" style="margin:0"><div class="fan">${fan}</div><div class="sign"><div class="bulbs"></div><div class="logo big">ALL IN</div><div class="tagl">Poker · Defense</div></div></div>
      <div class="crew">${crew.map(k=>`<canvas data-k="${k}"></canvas>`).join('')}</div>
      <div class="ogline">Your hand summons the army. Defend your casino.</div>`;
    const st=document.createElement('style');st.textContent=`#og{position:fixed;inset:0;z-index:99999;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;overflow:hidden;background:radial-gradient(ellipse 75% 70% at 50% 34%,#5a1a7a,#0b0412 78%)}
      #og .ogbg{position:absolute;inset:0;background:conic-gradient(from 168deg at 22% -10%,transparent 0deg,rgba(255,61,154,.16) 10deg,transparent 24deg),conic-gradient(from 168deg at 78% -10%,transparent 0deg,rgba(34,225,255,.13) 10deg,transparent 24deg)}
      #og .ttl{transform:scale(1.1);margin-top:14px!important}#og .ttl .fan .card{animation:none}
      #og .crew{display:flex;gap:2px;margin-top:22px;position:relative}#og .crew canvas{width:128px;height:128px}
      #og .ogline{font:400 21px Bungee,sans-serif;color:#ffcf7a;letter-spacing:.04em;margin-top:2px;text-shadow:0 0 12px rgba(255,176,32,.55);position:relative}`;
    document.head.appendChild(st);document.body.appendChild(card);
    card.querySelectorAll('canvas[data-k]').forEach(c=>portrait(c,c.dataset.k,128));
    {const b=card.querySelector('.bulbs'),nx=40,ny=14,pts=[];for(let i=0;i<nx;i++)pts.push([i/nx,0]);for(let i=0;i<ny;i++)pts.push([1,i/ny]);for(let i=0;i<nx;i++)pts.push([1-i/nx,1]);for(let i=0;i<ny;i++)pts.push([0,1-i/ny]);
     b.innerHTML=pts.map(([x,y],i)=>`<i class="${i%2?'b':''}" style="animation:none;opacity:${i%2?.35:1};left:calc(9px + (100% - 18px)*${x.toFixed(4)});top:calc(9px + (100% - 18px)*${y.toFixed(4)})"></i>`).join('');}});
  await p.waitForTimeout(600);await p.screenshot({path:'/home/claude/test/og2x.png'});console.log(errs);await b.close();})();
