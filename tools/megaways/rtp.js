// Monte Carlo RTP for Megaways. usage: node tools/megaways/rtp.js [spins] [key=value ...]
const fs=require('fs'),path=require('path');const src=fs.readFileSync(path.join(__dirname,'../../megaways.js'),'utf8').split('/* @@ui */')[0];
const MW=new Function(src+';return {MW_CFG,mwPlay,MW_WHEEL,mwBonus};')();
for(const a of process.argv.slice(3)){const [k,v]=a.split('=');MW.MW_CFG[k]=+v;}
const N=+process.argv[2]||200000;let base=0,bon=0,trig=0,bonTot=[],big=0,hit=0;
for(let i=0;i<N;i++){const r=MW.mwPlay(Math.random);base+=r.total;if(r.total>0)hit++;if(r.trig){trig++;bon+=r.bonus.total;bonTot.push(r.bonus.total);}if(r.total+(r.bonus?r.bonus.total:0)>=10)big++;}
bonTot.sort((a,b)=>a-b);const q=p=>bonTot.length?bonTot[Math.floor(p*(bonTot.length-1))].toFixed(1):'-';
console.log(`spins ${N}  RTP ${((base+bon)/N*100).toFixed(2)}%  (base ${(base/N*100).toFixed(1)}%, bonus ${(bon/N*100).toFixed(1)}%)`);
console.log(`hit rate ${(hit/N*100).toFixed(1)}%  bonus 1 in ${(N/trig).toFixed(0)}  avg bonus ${(bon/trig).toFixed(1)}x  median ${q(.5)}x  p10 ${q(.1)}x  p90 ${q(.9)}x  max ${q(1)}x  10x+ wins ${(big/N*100).toFixed(2)}%`);
const M=+process.argv[2]>0?Math.round(N/5):40000;let bt=0;const per=Array(12).fill(0),cnt=Array(12).fill(0);
for(let i=0;i<M;i++){const b=MW.mwBonus(Math.random);bt+=b.total;per[b.wi]+=b.total;cnt[b.wi]++;}
console.log(`bought bonus: avg ${(bt/M).toFixed(2)}x over ${M}; by wedge: ${per.map((v,i)=>MW.MW_WHEEL[i][2]+' '+(v/cnt[i]).toFixed(1)).join(' | ')}`);
