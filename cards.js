'use strict';
/* ============ ALL IN — playing card faces ============
   Aces and court cards are drawn as SVG so they stay crisp at hand size and up close.
   Court cards are double-ended (point-symmetric) like a real deck: one half is drawn,
   clipped along a diagonal, then turned 180° to make the other half. */

const SUIT_PATH={
  H:'M50 90C24 70 5 54 5 33C5 18 16 8 29 8C39 8 46 14 50 23C54 14 61 8 71 8C84 8 95 18 95 33C95 54 76 70 50 90Z',
  D:'M50 3C59 21 71 37 87 50C71 63 59 79 50 97C41 79 29 63 13 50C29 37 41 21 50 3Z',
  S:'M50 5C57 21 93 39 93 62C93 76 82 85 70 85C62 85 56 81 53 75C54 85 58 92 67 96H33C42 92 46 85 47 75C44 81 38 85 30 85C18 85 7 76 7 62C7 39 43 21 50 5Z',
  C:'M50 9A19 19 0 0 1 64.6 40.2A19 19 0 1 1 55 72C56 84 60 91 67 96H33C40 91 44 84 45 72A19 19 0 1 1 35.4 40.2A19 19 0 0 1 50 9Z'};
// a suit pip as an SVG fragment: centred on (x,y), w wide
function suitG(s,x,y,w,fill,extra){const k=w/100;return `<path d="${SUIT_PATH[s]}" transform="translate(${x-50*k} ${y-50*k}) scale(${k})" fill="${fill}" ${extra||''}/>`;}
function suitSVG(s,cls){return `<svg class="${cls||''}" viewBox="0 0 100 100">${suitG(s,50,50,100,'currentColor')}</svg>`;}

/* colours: red suits are crimson, black suits are ink; each suit has its own second colour */
const CARD_PAL={
  S:{ink:'#1a1c2b',robe:'#20253f',robe2:'#5b3aa8',trim:'#d6a330'},
  C:{ink:'#1a1c2b',robe:'#1d2b2a',robe2:'#0f7f7a',trim:'#d6a330'},
  H:{ink:'#c3122f',robe:'#c3122f',robe2:'#22409c',trim:'#d6a330'},
  D:{ink:'#c3122f',robe:'#b8142c',robe2:'#a3196f',trim:'#d6a330'}};
let CARD_UID=0;
const GOLD='#e0b040',GOLD_D='#8a6212',SKIN='#f5d6b3',SKIN_D='#c98f66',OUT='#241a14';

/* one half of a court figure, drawn in a 72 x 82 box (the top half of a 72 x 164 frame) */
function courtHalf(v,s){
  const P=CARD_PAL[s],o=`stroke="${OUT}" stroke-width=".9" stroke-linejoin="round"`,o2=`stroke="${OUT}" stroke-width=".7" stroke-linejoin="round"`;
  const L=v===13?1:-1;               // which side holds the prop: king right, queen and jack left
  const hx=36+L*19,hy=64;            // the hand
  const ermine=(d,dots)=>`<path d="${d}" fill="#fbf8f1" ${o}/>`+dots.map(([x,y])=>`<path d="M${x} ${y}l-.8 1.9h1.6z" fill="${OUT}"/>`).join('');
  // body: each rank has its own outfit
  const shoulders='M5 84V60C5 50 13 46 23 45L49 45C59 46 67 50 67 60V84Z';
  let body;
  if(v===13){ // king: robe with a gold placket under an ermine-edged mantle
    body=`<path d="${shoulders}" fill="${P.robe2}" ${o}/>
      <path d="M23 47L49 47L46 84H26Z" fill="${P.robe}" ${o2}/>
      <path d="M31 48L33.6 84H38.4L41 48Z" fill="${GOLD}" ${o2}/>${[57,64,71,78].map(y=>suitG(s,36,y,4.4,P.robe,'')).join('')}
      ${[[29.2,62],[42.8,62],[29.6,75],[42.4,75]].map(([x,y])=>suitG(s,x,y,4.8,GOLD,`stroke="${GOLD_D}" stroke-width="7"`)).join('')}
      <path d="M21.4 47L25 84H20.4L17 48Z" fill="#fbf8f1" ${o2}/><path d="M50.6 47L47 84H51.6L55 48Z" fill="#fbf8f1" ${o2}/>
      ${[[20,54],[21,63],[21.8,72],[22.6,80],[52,54],[51,63],[50.2,72],[49.4,80]].map(([x,y])=>`<path d="M${x} ${y}l-.8 1.9h1.6z" fill="${OUT}"/>`).join('')}
      ${[[10.5,64],[61.5,64],[11,77],[61,77]].map(([x,y])=>suitG(s,x,y,5.2,GOLD,`stroke="${GOLD_D}" stroke-width="7"`)).join('')}`;
  }else if(v===12){ // queen: puffed sleeves, laced bodice, jewelled stomacher
    body=`<path d="${shoulders}" fill="${P.robe2}" ${o}/>
      <path d="M5 62Q9 52 18 51Q22 58 19 66Q11 68 5 66Z" fill="${P.robe2}" ${o2}/><path d="M67 62Q63 52 54 51Q50 58 53 66Q61 68 67 66Z" fill="${P.robe2}" ${o2}/>
      <path d="M8 58Q12 55 16 56M64 58Q60 55 56 56M7 63Q12 60 18 61M65 63Q60 60 54 61" stroke="${GOLD}" stroke-width=".8" fill="none"/>
      <path d="M20 47L52 47L44 84H28Z" fill="${P.robe}" ${o2}/>
      <path d="M26 50L46 50L40.4 84H31.6Z" fill="${GOLD}" ${o2}/>
      ${[55,61,67,73,79].map(y=>{const w=4.2-(y-55)*.05;return `<path d="M${36-w} ${y-2.4}L${36+w} ${y+2.4}M${36+w} ${y-2.4}L${36-w} ${y+2.4}" stroke="${GOLD_D}" stroke-width=".7"/><circle cx="${36-w-.6}" cy="${y-2.4}" r=".7" fill="${GOLD_D}"/><circle cx="${36+w+.6}" cy="${y-2.4}" r=".7" fill="${GOLD_D}"/>`;}).join('')}
      ${[[26,72],[46,72]].map(([x,y])=>suitG(s,x,y,5,GOLD,`stroke="${GOLD_D}" stroke-width="7"`)).join('')}
      ${[[10,74],[62,74]].map(([x,y])=>suitG(s,x,y,5.4,'none',`stroke="${GOLD}" stroke-width="9"`)).join('')}`;
  }else{ // jack: striped tunic, gold sash, belt
    body=`<path d="${shoulders}" fill="${P.robe}" ${o}/>
      ${[[12,'M9 50.6Q13 48 17 47L19 84H11Z'],[0,'M27 45.4H33L32 84H26Z'],[0,'M39 45.4H45L46 84H40Z'],[0,'M55 47Q59 48 63 50.6L61 84H53Z']].map(([_,d])=>`<path d="${d}" fill="${P.robe2}"/>`).join('')}
      <path d="${shoulders}" fill="none" ${o}/>
      <path d="M16 46L22 46L52 70L46 70Z" fill="${GOLD}" ${o2}/>${[[25.6,54.6],[33.2,60.8],[40.8,67]].map(([x,y])=>suitG(s,x,y,4.2,P.robe,'')).join('')}
      <path d="M5 68H67V72.4H5Z" fill="#5b3a1e" ${o2}/><path d="M32.4 67.2h7.2v6h-7.2z" fill="${GOLD}" ${o2}/><path d="M34.4 69.2h3.2v2h-3.2z" fill="${P.robe}"/>`;
  }
  // sleeve + hand on the prop side
  const sx=v===13?1:-1,S=(x)=>36+sx*(x-36);
  const sleeve=`<path d="M${S(56)} 47Q${S(66)} 50 ${S(65)} 61Q${S(64)} 67 ${S(57)} 67Q${S(54)} 60 ${S(51)} 52Z" fill="${P.robe2}" ${o}/>
    <path d="M${S(57.2)} 67Q${S(61)} 68.4 ${S(64.6)} 62.6L${S(65.4)} 65Q${S(61.4)} 70.6 ${S(56.6)} 69.4Z" fill="${GOLD}" ${o2}/>
    <ellipse cx="${S(57.4)}" cy="64" rx="3.6" ry="3.2" fill="${SKIN}" ${o}/><path d="M${S(55.6)} 62.4h${sx*3.4}M${S(55.4)} 64.2h${sx*3.6}" stroke="${SKIN_D}" stroke-width=".6"/>`;
  // head (shared)
  const face=(mouth)=>`<path d="M32.4 33h7.2v13h-7.2z" fill="${SKIN}" ${o}/><path d="M32.4 40q3.6 2 7.2 0" stroke="${SKIN_D}" stroke-width=".6" fill="none"/>
    <ellipse cx="36" cy="26" rx="9.4" ry="10.8" fill="${SKIN}" ${o}/>
    <path d="M30.6 23.6q2-1.3 3.8-.2M37.6 23.4q1.8-1.1 3.8.2" stroke="${OUT}" stroke-width=".9" fill="none" stroke-linecap="round"/>
    <path d="M31.2 26.4q1.6-1.2 3.2 0q-1.6 1-3.2 0zM37.6 26.4q1.6-1.2 3.2 0q-1.6 1-3.2 0z" fill="#fff" stroke="${OUT}" stroke-width=".55"/>
    <circle cx="32.8" cy="26.4" r=".95" fill="#2a3a6a"/><circle cx="39.2" cy="26.4" r=".95" fill="#2a3a6a"/>
    <path d="M36 27.4q-.4 2.6-1.4 3.6q1.2.6 2.4.1" stroke="${SKIN_D}" stroke-width=".75" fill="none" stroke-linecap="round"/>
    <ellipse cx="30.8" cy="30.4" rx="1.9" ry="1" fill="#ec9a86" opacity=".55"/><ellipse cx="41.2" cy="30.4" rx="1.9" ry="1" fill="#ec9a86" opacity=".55"/>${mouth}`;
  let back='',top='',prop='',front='';
  if(v===13){ // KING: crown, white hair and beard, ermine, sword
    back=`<path d="M25.4 22Q24 36 27 40L45 40Q48 36 46.6 22Z" fill="#ece6da" ${o}/>`;
    front=`<path d="M26.8 28Q27.6 41 36 43.6Q44.4 41 45.2 28Q42 33.4 36 33.6Q30 33.4 26.8 28Z" fill="#f1ece2" ${o}/>
      <path d="M31.6 31.6Q36 29.6 40.4 31.6Q38 33.2 36 32.6Q34 33.2 31.6 31.6Z" fill="#f1ece2" ${o2}/><path d="M34.4 34.6q1.6.8 3.2 0" stroke="#a5233a" stroke-width=".9" fill="none" stroke-linecap="round"/>
      <path d="M31 37.5q2 1 2.6 3M41 37.5q-2 1-2.6 3M36 36v4" stroke="#cfc6b5" stroke-width=".6" fill="none"/>`+
      ermine('M13 49Q36 57 59 49L59.6 53.6Q36 62 12.4 53.6Z',[[17,52.4],[24,55],[31,56.4],[41,56.4],[48,55],[55,52.4]]);
    top=`<path d="M25.6 19L23.4 3.6L29.6 10.4L32.4 1.6L36 9L39.6 1.6L42.4 10.4L48.6 3.6L46.4 19Z" fill="${GOLD}" ${o}/>
      <path d="M26.6 12.6Q36 15 45.4 12.6" stroke="${GOLD_D}" stroke-width=".7" fill="none"/>
      <path d="M25 15.4Q36 18 47 15.4L47.4 19.6Q36 22.4 24.6 19.6Z" fill="${P.robe2}" ${o}/>${[29,36,43].map(x=>`<circle cx="${x}" cy="${x===36?18.9:18.2}" r="1.15" fill="#fff6d6" ${o2}/>`).join('')}
      ${[[23.4,3.6],[32.4,1.6],[39.6,1.6],[48.6,3.6]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.5" fill="#fff6d6" ${o2}/>`).join('')}<path d="M36 6.4l1.8 2.6l-1.8 2.6l-1.8-2.6z" fill="${s==='H'||s==='D'?'#c3122f':'#2b6fd6'}" ${o2}/>`;
    prop=`<path d="M57.4 1L60 5V60.5H54.8V5Z" fill="#e6eaf2" ${o}/><path d="M57.4 5V59" stroke="#a3acbf" stroke-width=".9"/>
      <path d="M51 59.4h12.8l-.6 2.8H51.6Z" fill="${GOLD}" ${o2}/>`;
  }else if(v===12){ // QUEEN: long hair, tiara and veil, ruff, rose
    back=`<path d="M26 22Q20 40 23 52L49 52Q52 40 46 22Q44 12.6 36 12.6Q28 12.6 26 22Z" fill="#7d4219" ${o}/><path d="M27 34Q25 44 27.6 50M45 34Q47 44 44.4 50" stroke="#5c2e10" stroke-width=".7" fill="none"/>`;
    front=`<path d="M33.6 33.4Q36 35.2 38.4 33.4Q36 34.4 33.6 33.4Z" fill="#c42a46" stroke="#a0203a" stroke-width=".8" stroke-linejoin="round"/>
      <path d="M26.6 25Q27 15.6 36 15.4Q45 15.6 45.4 25Q43 18.8 37 19.2Q35 22.4 30 22Q28 23 26.6 25Z" fill="#8d4c1e" ${o}/>
      <path d="M17 49Q21 43 26 46.6Q30.6 42 36 46Q41.4 42 46 46.6Q51 43 55 49Q51 54.6 46 51.6Q41.4 56.6 36 52.6Q30.6 56.6 26 51.6Q21 54.6 17 49Z" fill="#fbf8f1" ${o}/>
      <path d="M26 46.6Q27 50 26 51.6M36 46Q37 49.4 36 52.6M46 46.6Q45 50 46 51.6" stroke="#cfc6b5" stroke-width=".6" fill="none"/>
      <path d="M31 55Q36 59.6 41 55" stroke="${GOLD}" stroke-width="1" fill="none"/>${suitG(s,36,59.4,4.6,s==='H'||s==='D'?'#c3122f':'#2b6fd6',`stroke="${GOLD}" stroke-width="8"`)}`;
    top=`<path d="M27 16.4Q36 9.6 45 16.4L43.6 18.8Q36 13.8 28.4 18.8Z" fill="${GOLD}" ${o}/>
      <path d="M30.2 13.2L31.4 7.2L33.8 11.2L36 4.2L38.2 11.2L40.6 7.2L41.8 13.2" fill="${GOLD}" ${o}/>
      <circle cx="36" cy="4.2" r="1.4" fill="#fff6d6" ${o2}/><circle cx="31.4" cy="7.2" r="1" fill="#fff6d6" ${o2}/><circle cx="40.6" cy="7.2" r="1" fill="#fff6d6" ${o2}/>
      <path d="M36 12l1.4 1.9l-1.4 1.9l-1.4-1.9z" fill="${s==='H'||s==='D'?'#c3122f':'#2b6fd6'}" ${o2}/>`;
    prop=`<path d="M14.4 64Q14.6 50 11.2 40" stroke="#2f7a3a" stroke-width="1.5" fill="none"/>
      <path d="M13.6 52.4q4.6-3.2 6.8-.4q-3.8 2.8-6.8.4zM12.4 46q-4.2-1.6-5.4.8q3.6 1.6 5.4-.8z" fill="#46a052" ${o2}/>
      <circle cx="10.6" cy="36.4" r="5.4" fill="#e0304f" ${o}/><path d="M7.6 35.4q3-3.2 6 0q-3 4-6 0zM10.6 33.2q2.2 1.6 0 3.8M8 38.6q2.6 1.6 5.2 0" stroke="#8f1630" stroke-width=".75" fill="none"/>`;
  }else{ // JACK: plumed cap, curls and moustache, collar, halberd
    back=`<path d="M26.4 22Q23.4 33 26.8 39L45.2 39Q48.6 33 45.6 22Z" fill="#5e3214" ${o}/>${[[27,35],[45,35],[26.6,29],[45.4,29]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.6" fill="#6b3a17" ${o2}/>`).join('')}`;
    front=`<path d="M32 32.6Q34 31 36 32.2Q38 31 40 32.6Q38 33.6 36 33Q34 33.6 32 32.6Z" fill="#5e3214" stroke="#4a260f" stroke-width=".5"/>
      <path d="M34.4 35.4q1.6.6 3.2 0" stroke="#a5233a" stroke-width=".9" fill="none" stroke-linecap="round"/>
      <path d="M26.6 24.4Q27 16.6 36 16.2Q45 16.6 45.4 24.4Q41 20.4 36 21Q31 20.4 26.6 24.4Z" fill="#6b3a17" ${o}/>
      <path d="M21 47.4L36 52L51 47.4L49.4 52.6L36 57.6L22.6 52.6Z" fill="#fbf8f1" ${o}/><path d="M36 52v5.6" stroke="#cfc6b5" stroke-width=".6"/>`;
    top=`<path d="M25 20.6Q24.4 8.6 36 8Q47.6 8.6 47 20.6Q36 16.2 25 20.6Z" fill="${P.robe2}" ${o}/>
      <path d="M24.6 18.6Q36 14.2 47.4 18.6L47.2 21.6Q36 17.2 24.8 21.6Z" fill="${GOLD}" ${o}/>
      <path d="M43.6 11.6Q50 1 59 2.4Q53 3.8 50.4 7.6Q57 5.6 60 8.6Q52.4 8.6 46.4 14Z" fill="#fbf8f1" ${o}/><path d="M45.4 12.4Q51 6 57.4 4.2" stroke="#cfc6b5" stroke-width=".6" fill="none"/>
      <circle cx="44.6" cy="13.4" r="1.7" fill="${GOLD}" ${o2}/>`;
    prop=`<path d="M13.2 8H15.2V84H13.2Z" fill="#8a5a2b" ${o}/>
      <path d="M14.2 0L16.6 8H11.8Z" fill="#e6eaf2" ${o}/><path d="M15.2 10Q23.4 9 24 17Q19.4 14.6 15.2 17.4Z" fill="#e6eaf2" ${o}/><path d="M13.2 10.6Q8.6 11.6 8.2 15Q10.6 14 13.2 15.4Z" fill="#e6eaf2" ${o}/>
      <path d="M12.6 18h3.2v2h-3.2z" fill="${GOLD}" ${o2}/>`;
  }
  const mouthless='';
  return `<g transform="translate(0 2)">${prop&&v!==13?'':''}${back}${body}${v===13?'':prop}${face(mouthless)}${front}${top}${v===13?prop:''}${sleeve}</g>`;
}

function courtSVG(v,s){
  const P=CARD_PAL[s],id='cc'+(++CARD_UID);
  const half=courtHalf(v,s);
  return `<svg class="court" viewBox="0 0 72 164">
    <defs><clipPath id="${id}"><path d="M0 0H72V74L0 90Z"/></clipPath>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f1e5cc"/></linearGradient>
      <pattern id="${id}p" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H8M0 0V8" stroke="${GOLD}" stroke-width=".5" opacity=".45"/></pattern></defs>
    <rect x=".7" y=".7" width="70.6" height="162.6" rx="3" fill="url(#${id}g)"/><rect x=".7" y=".7" width="70.6" height="162.6" rx="3" fill="url(#${id}p)"/>
    <g clip-path="url(#${id})">${half}</g>
    <g transform="rotate(180 36 82)"><g clip-path="url(#${id})">${half}</g></g>
    <path d="M0 90L72 74" stroke="${GOLD_D}" stroke-width="2.6"/><path d="M0 90L72 74" stroke="${GOLD}" stroke-width="1.2"/>
    <rect x=".7" y=".7" width="70.6" height="162.6" rx="3" fill="none" stroke="${P.ink}" stroke-width="1.4"/>
    <rect x="2.6" y="2.6" width="66.8" height="158.8" rx="2" fill="none" stroke="${GOLD}" stroke-width=".8" opacity=".9"/></svg>`;
}

/* aces: one big embossed pip in an engraved ring; the ace of spades is the house card */
function aceSVG(s){
  const P=CARD_PAL[s],big=s==='S',red=s==='H'||s==='D',id='ac'+(++CARD_UID),cy=big?47:50;
  const pip=big?56:54,R=big?44:39;
  const g0=red?'#e8344f':'#454a6e',g1=red?'#a50d27':'#11131d';
  let deco=`<circle cx="50" cy="${cy}" r="${R}" fill="none" stroke="${GOLD}" stroke-width="1.3"/><circle cx="50" cy="${cy}" r="${R-2.6}" fill="none" stroke="${GOLD}" stroke-width=".5"/>`;
  if(big){
    deco+=Array.from({length:32},(_,i)=>{const a=i/32*Math.PI*2,x=50+Math.cos(a)*R,y=cy+Math.sin(a)*R;return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i%2?0.8:1.5}" fill="${GOLD}"/>`;}).join('');
  }else{
    deco+=[0,1,2,3].map(i=>{const a=i*Math.PI/2+Math.PI/4,x=50+Math.cos(a)*R,y=cy+Math.sin(a)*R;return `<circle cx="${x}" cy="${y}" r="4.6" fill="#fbf6ea" stroke="${GOLD}" stroke-width=".8"/>`+suitG(s,x,y,5.4,P.ink);}).join('');
  }
  const pipG=`<path d="${SUIT_PATH[s]}" transform="translate(${50-pip/2} ${cy-pip/2}) scale(${pip/100})" fill="url(#${id})" stroke="${g1}" stroke-width="${100/pip*.8}"/>`;
  const engrave=suitG(s,50,cy+(s==='S'?-2:s==='C'?-1.5:0),pip*.64,'none',`stroke="${GOLD}" stroke-width="${100/(pip*.64)*.9}" opacity=".95"`);
  const shine=`<path d="M${50-pip*.3} ${cy-pip*.12}Q${50-pip*.24} ${cy-pip*.3} ${50-pip*.08} ${cy-pip*.34}" stroke="#fff" stroke-opacity=".35" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  let crown='',ribbon='';
  if(big){
    crown=`<path d="M41 ${cy-30}L39.4 ${cy-38.6}L44.6 ${cy-34.4}L50 ${cy-41.4}L55.4 ${cy-34.4}L60.6 ${cy-38.6}L59 ${cy-30}Z" fill="${GOLD}" stroke="${GOLD_D}" stroke-width=".8" stroke-linejoin="round"/>
      <circle cx="50" cy="${cy-41.4}" r="1.4" fill="#fff6d6" stroke="${GOLD_D}" stroke-width=".6"/>`;
    ribbon=`<path d="M24 ${cy+37}L30 ${cy+33.4}H70L76 ${cy+37}L70 ${cy+40.6}H30Z" fill="${P.ink}" stroke="${GOLD}" stroke-width="1"/>
      <text x="50" y="${cy+39.6}" text-anchor="middle" font-family="Bungee,Impact,sans-serif" font-size="7.4" fill="${GOLD}" letter-spacing=".6">ALL IN</text>`;
  }
  return `<svg class="ace" viewBox="0 0 100 100"><defs><linearGradient id="${id}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${g0}"/><stop offset="1" stop-color="${g1}"/></linearGradient></defs>
    ${deco}${pipG}${engrave}${shine}${crown}${ribbon}</svg>`;
}

/* number cards: the traditional pip layouts, lower-half pips turned upside down */
const PIP_LAYOUT=(()=>{const L=6.6,C=17,R=27.4,T=7.4,B=64.6,M=36,q=(B-T)/3;
  const corners=[[L,T],[R,T],[L,B],[R,B]],sides=[[L,M],[R,M]],four=y=>[[L,y],[R,y]];
  const cols=[...four(T),...four(T+q),...four(T+2*q),...four(B)];
  return {2:[[C,T],[C,B]],3:[[C,T],[C,M],[C,B]],4:corners,5:[...corners,[C,M]],6:[...corners,...sides],
    7:[...corners,...sides,[C,(T+M)/2]],8:[...corners,...sides,[C,(T+M)/2],[C,(M+B)/2]],
    9:[...cols,[C,M]],10:[...cols,[C,T+q/2],[C,B-q/2]]};})();
function numSVG(v,s){
  const red=s==='H'||s==='D',id='np'+(++CARD_UID),w=v>=9?10.6:v>=7?11.6:12.4;
  const g0=red?'#e3324d':'#3c4060',g1=red?'#a50d27':'#11131d';
  const pips=PIP_LAYOUT[v].map(([x,y])=>{const flip=y>36.5,k=w/100;
    return `<path d="${SUIT_PATH[s]}" transform="translate(${x} ${y})${flip?' rotate(180)':''} translate(${-w/2} ${-w/2}) scale(${k})" fill="url(#${id})"/>`;}).join('');
  return `<svg class="pips" viewBox="0 0 34 72"><defs><linearGradient id="${id}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${g0}"/><stop offset="1" stop-color="${g1}"/></linearGradient></defs>${pips}</svg>`;
}

function cardHTML(c,i,cls){const red=c.s==='H'||c.s==='D',face=c.v>=11&&c.v<=13,ace=c.v===14;
  const idx=`${vn(c.v)}${suitSVG(c.s,'cs')}`;
  return `<div class="card ${red?'red':''} ${c.v===10?'ten':''} ${face?'face':''} ${ace?'acec':''} ${cls||''}" data-i="${i}"><div class="ci tl">${idx}</div>${face?courtSVG(c.v,c.s):ace?aceSVG(c.s):PIP_LAYOUT[c.v]?numSVG(c.v,c.s):`<div class="pip">${SYM[c.s]}</div>`}<div class="ci br">${idx}</div></div>`;}
