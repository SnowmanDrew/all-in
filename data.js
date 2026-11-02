'use strict';
/* ============ ALL IN — data ============ */
const TILE=30,COLS=40,ROWS=20,W=COLS*TILE,H=ROWS*TILE,STEP=1/60;
const MAX_WAVE=40,ANTE=20,BET_SMALL=10,BET_BIG=20,MAX_RAISES=3;
const SUITS=['S','H','D','C'],SYM={S:'♠',H:'♥',D:'♦',C:'♣'};
const VN={11:'J',12:'Q',13:'K',14:'A'};const vn=v=>VN[v]||String(v);
const VP={2:'Twos',3:'Threes',4:'Fours',5:'Fives',6:'Sixes',7:'Sevens',8:'Eights',9:'Nines',10:'Tens',11:'Jacks',12:'Queens',13:'Kings',14:'Aces'};
const HANDS=['High Card','One Pair','Two Pair','Three of a Kind','Straight','Flush','Full House','Four of a Kind','Straight Flush','Royal Flush'];
/* a hand is "high" when its top scoring card reaches this value */
const HIGH_AT=[13,11,11,11,11,14,11,11,11,0];
const HAND_UNITS=[['hc_lo','hc_hi'],['p_lo','p_hi'],['tp_lo','tp_hi'],['t_lo','t_hi'],['s_lo','s_hi'],['f_lo','f_hi'],['fh_lo','fh_hi'],['q_lo','q_hi'],['sf_lo','sf_hi'],['rf','rf']];

/* ---------- player creatures ----------
 kind: melee | ranged | pierce | aoe | artillery | cone | chain
 sp: special flags */
const UNITS={
 /* ---- hand creatures ---- */
 hc_lo:{name:'Chip Mite',role:'Critter',hand:0,hi:false,hp:75,dmg:8,rate:1.3,range:16,spd:100,r:6.5,cnt:1,kind:'melee',look:{b:'chip',face:'beady',c1:'#e94b5a',c2:'#fff'},desc:'A scrappy poker chip on legs. Weak alone, but stack two and see what happens.'},
 hc_hi:{name:'Chip Hound',role:'Beast',hand:0,hi:true,hp:130,dmg:12,rate:1.35,range:18,spd:112,r:8.5,cnt:1,kind:'melee',look:{b:'hound',face:'dog',c1:'#3b82f6',c2:'#fff'},desc:'A loyal chip-backed hound. Quick to the chase.'},
 p_lo:{name:'Dice Sprite',role:'Critter',hand:1,hi:false,hp:70,dmg:11,rate:1.1,range:110,spd:86,r:8,cnt:1,kind:'ranged',look:{b:'die',face:'pips',c1:'#f8f5ec',c2:'#1d1d1f',shot:'die'},desc:'A floating die that pelts enemies with pips. Merge them into soldiers.'},
 p_hi:{name:'Snake Eyes',role:'Gunslinger',hand:1,hi:true,hp:110,dmg:9,rate:1.2,range:126,spd:92,r:10,cnt:1,kind:'ranged',sp:{shots:2,crit:1/6,critX:4},look:{b:'human',face:'snake',head:'die',headCol:'#f8f5ec',hat:'cowboy',hatCol:'#4a2a14',hatBand:'#65a30d',body:'#7c2d12',poncho:'#f59e0b',weapon:'revolver',dual:true,shot:'slug'},desc:'Twin revolvers. Rolling doubles (1 in 6) deals 4× damage.'},
 tp_lo:{name:'The Bouncer',role:'Warrior',hand:2,hi:false,hp:430,dmg:16,rate:1,range:20,spd:72,r:12,cnt:1,armor:3,kind:'melee',sp:{stun:.15},look:{b:'human',face:'shades',bulk:1.42,body:'#18181b',tie:'#b91c3c',skin:'#c99a74',hat:'none',weapon:'knuckles',fold:true,earpiece:true,mouth:'frown'},desc:'Nobody gets past the door. Heavy hitter whose punches sometimes stun.'},
 tp_hi:{name:'Vault Mech',role:'Robot · Tank',hand:2,hi:true,hp:680,dmg:20,rate:.9,range:22,spd:62,r:14,cnt:1,armor:5,kind:'melee',sp:{taunt:90},look:{b:'robot',face:'led',torso:'safe',legs:'biped',arms:['claw','claw'],head:'none',c1:'#94a3b8',c2:'#475569'},desc:'A walking safe. Taunts everything nearby into hitting its steel hide.'},
 t_lo:{name:'Slotbot',role:'Robot',hand:3,hi:false,hp:180,dmg:13,rate:1.2,range:120,spd:78,r:11,cnt:1,kind:'ranged',sp:{targets:3},look:{b:'robot',face:'led',torso:'slot',legs:'treads',arms:['lever','cannon'],head:'dome',c1:'#b91c1c',c2:'#fbbf24',shot:'laser'},desc:'A slot machine on treads. Fires three lasers per pull.'},
 t_hi:{name:'Jackpot Jinn',role:'Genie',hand:3,hi:true,hp:220,dmg:18,rate:1.2,range:128,spd:84,r:12,cnt:1,kind:'ranged',sp:{targets:3,jackpot:1/8},look:{b:'human',face:'mystic',float:true,body:'#6d28d9',skin:'#a78bfa',hat:'turban',hatCol:'#fde68a',vest:'#fbbf24',weapon:'orb',orbCol:'#fde68a',shot:'orb'},desc:'Three targets per wish. 1 in 8 wishes hits the jackpot: a huge blast.'},
 s_lo:{name:'Card Sharp',role:'Assassin',hand:4,hi:false,hp:150,dmg:46,rate:.75,range:195,spd:96,r:10,cnt:1,kind:'pierce',look:{b:'human',face:'sly',hat:'eyeshade',body:'#14706a',vest:'#0b3b37',mustache:'#1c1917',mouth:'none',skin:'#e2bf98',weapon:'cards',beam:'#e2e8f0',shot:'card'},desc:'Throws razor-edged cards that slice through every enemy in a line.'},
 s_hi:{name:'Roulette Tank',role:'Tank',hand:4,hi:true,hp:460,dmg:70,rate:.7,range:212,spd:68,r:16,cnt:1,armor:3,kind:'pierce',look:{style:'feltTank',b:'tank',face:'pips',c1:'#3f6212',c2:'#b91c1c',beam:'#fde68a'},desc:'A tank with a spinning roulette turret. Its rail gun pierces whole lines.'},
 f_lo:{name:'Felt Witch',role:'Witch',hand:5,hi:false,hp:175,dmg:22,rate:.8,range:132,spd:80,r:10,cnt:1,kind:'aoe',sp:{splash:50,slow:.35},look:{b:'card',face:'sly',c1:'#166534',c2:'#86efac',hat:true,shot:'card'},desc:'Hexes a patch of ground, damaging and slowing everything there.'},
 f_hi:{name:'Velvet Siren',role:'Siren',hand:5,hi:true,hp:225,dmg:30,rate:.8,range:142,spd:82,r:11,cnt:1,kind:'aoe',sp:{splash:60,slow:.3,stun:.25},look:{b:'card',face:'lashes',c1:'#9d174d',c2:'#f9a8d4',siren:true,shot:'card'},desc:'Her song damages an area and sometimes stuns enemies in place.'},
 fh_lo:{name:'Mansion Crab',role:'Siege beast',hand:6,hi:false,hp:650,dmg:72,rate:.45,range:205,minR:40,spd:55,r:14,cnt:1,armor:3,kind:'artillery',sp:{splash:62},look:{b:'crab',face:'beady',c1:'#c2410c',c2:'#fde68a'},desc:'Carries a whole house on its back and lobs shells from the chimney.'},
 fh_hi:{name:'Casino Kraken',role:'Siege beast',hand:6,hi:true,hp:920,dmg:104,rate:.5,range:225,minR:40,spd:55,r:16,cnt:1,armor:4,kind:'artillery',sp:{splash:76},look:{b:'kraken',face:'angry',c1:'#4338ca',c2:'#fbbf24'},desc:'Heavy artillery with tentacles. Huge blast radius.'},
 q_lo:{name:'Clover Drake',role:'Dragon',hand:7,hi:false,hp:720,dmg:30,rate:2.2,range:82,spd:88,r:14,cnt:1,armor:2,kind:'cone',look:{b:'drake',face:'reptile',c1:'#16a34a',c2:'#bbf7d0'},desc:'Breathes four-leaf fire that burns everything in a cone.'},
 q_hi:{name:'Jade Dragon',role:'Dragon',hand:7,hi:true,hp:1050,dmg:43,rate:2.5,range:96,spd:92,r:16,cnt:1,armor:3,kind:'cone',look:{b:'drake',face:'reptile',c1:'#047857',c2:'#fde68a',jade:true},desc:'A bigger, hungrier dragon. Devastating at close range.'},
 sf_lo:{name:'Storm Dealer',role:'Sorcerer',hand:8,hi:false,hp:620,dmg:112,rate:1,range:172,spd:84,r:13,cnt:1,armor:2,kind:'chain',sp:{chains:5},look:{b:'dealer',face:'visor',c1:'#1e3a8a',c2:'#67e8f9',beard:'#e5e7eb'},desc:'Deals lightning instead of cards. It leaps between five enemies.'},
 sf_hi:{name:'Thunder Croupier',role:'Archmage',hand:8,hi:true,hp:820,dmg:152,rate:1.05,range:188,spd:86,r:14,cnt:1,armor:3,kind:'chain',sp:{chains:7},look:{b:'dealer',face:'visor',c1:'#581c87',c2:'#f0abfc',top:true},desc:'Lightning that leaps between seven enemies.'},
 rf:{name:'The Sovereign',role:'Monarch',hand:9,hi:true,hp:3200,dmg:330,rate:1.1,range:205,spd:80,r:19,cnt:1,armor:6,kind:'artillery',sp:{splash:82,chains:4,aura:.2},look:{b:'sovereign',face:'regal',c1:'#fbbf24',c2:'#fff7d6'},desc:'Royalty. Explosive shots that chain lightning, and nearby allies deal +20% damage.'},
 /* ---- chip line: Mite → Trooper → Colossus → Juggernaut ---- */
 m_trooper:{name:'Stack Trooper',role:'Warrior',merge:true,tier:1,hp:300,dmg:20,rate:1.2,range:24,spd:92,r:11,armor:2,kind:'melee',sp:{cleave:26},look:{b:'human',face:'beady',hat:'chiphelm',hatCol:'#e94b5a',body:'#7f1d1d',armor:'#f5f0e6',weapon:'spear',shield:'#e94b5a'},desc:'Two mites became a soldier: chip armor, chip shield, sharp spear. Sweeps the enemies in front of it.'},
 m_colossus:{name:'Chip Colossus',role:'Golem · Tank',merge:true,tier:2,hp:1150,dmg:48,rate:.9,range:26,spd:62,r:16,armor:5,kind:'melee',sp:{cleave:42,taunt:80},look:{b:'robot',face:'mystic',torso:'chips',legs:'biped',legCol:'#e94b5a',arms:['fist','fist'],head:'visor',c1:'#e94b5a',c2:'#f5f0e6'},desc:'A towering golem of stacked chips. Smashes groups and draws the crowd onto itself.'},
 m_jugg:{name:'Jackpot Juggernaut',role:'War machine',merge:true,tier:3,hp:3400,dmg:160,rate:.8,range:195,spd:55,r:21,armor:8,kind:'artillery',sp:{splash:82},look:{style:'juggernaut',b:'robot',face:'led',torso:'slot',legs:'biped',arms:['missile','cannon'],head:'dome',crown:true,c1:'#d4a12a',c2:'#7f1d1d',shot:'missile'},desc:'Eight chip mites, one war machine. Rains rockets across the Strip.'},
 /* ---- hound line ---- */
 m_cerb:{name:'Ante Cerberus',role:'Beast',merge:true,tier:1,hp:460,dmg:30,rate:1.4,range:22,spd:118,r:13,armor:2,kind:'melee',sp:{cleave:34},look:{b:'hound',face:'dog',c1:'#1e40af',c2:'#fbbf24',three:true},desc:'Three heads, three bites. Fast and vicious.'},
 m_chimera:{name:'Wild Card Chimera',role:'Monster',merge:true,tier:2,hp:1650,dmg:72,rate:1.5,range:28,spd:120,r:18,armor:4,kind:'melee',sp:{cleave:48,slow:.35},look:{b:'chimera',face:'angry',c1:'#6b21a8',c2:'#fbbf24'},desc:'Lion, goat and serpent, wearing a jester\'s collar. Its venom slows whatever survives the bite.'},
 m_rider:{name:'Mite Rider',role:'Cavalry',merge:true,tier:1,hp:380,dmg:26,rate:1.5,range:24,spd:138,r:12,armor:2,kind:'melee',sp:{cleave:24},look:{b:'rider',face:'dog',c1:'#3b82f6',c2:'#fff'},desc:'A chip mite with a lance, riding a chip hound. The fastest thing on the Strip.'},
 /* ---- dice line: Sprite → Trooper → Mech → Fortress ---- */
 m_dtroop:{name:'Dice Trooper',role:'Soldier',merge:true,tier:1,hp:260,dmg:18,rate:1.4,range:142,spd:88,r:11,armor:1,kind:'ranged',sp:{shots:2},look:{b:'human',face:'pips',head:'die',headCol:'#f8f5ec',hat:'helmet',hatCol:'#3f4a2a',body:'#4d5a2c',belt:true,weapon:'rifle',shot:'slug'},desc:'Two dice signed up. Fires double-tap bursts from long range.'},
 m_dmech:{name:'Dice Mech',role:'Robot',merge:true,tier:2,hp:820,dmg:46,rate:1,range:172,spd:70,r:15,armor:4,kind:'aoe',sp:{splash:58},look:{b:'robot',face:'led',torso:'dice',legs:'biped',arms:['missile','cannon'],head:'visor',c1:'#f8f5ec',c2:'#1d4ed8',shot:'missile'},desc:'A bipedal mech built around a giant die. Its missiles burst on impact.'},
 m_fortress:{name:'Big Six Fortress',role:'Walking fortress',merge:true,tier:3,hp:2600,dmg:190,rate:.6,range:240,spd:45,r:21,armor:7,kind:'artillery',sp:{splash:90,shells:2},look:{b:'robot',face:'led',torso:'dice',legs:'spider',arms:['cannon','cannon'],head:'castle',c1:'#f8f5ec',c2:'#b91c1c'},desc:'Eight dice sprites, one castle on legs. Fires two shells at a time.'},
 /* ---- other merges: each a new identity ---- */
 m_imp:{name:'Lucky Imp',role:'Trickster',merge:true,tier:1,hp:190,dmg:20,rate:1.45,range:105,spd:122,r:9,kind:'ranged',sp:{crit:1/6,critX:3},look:{b:'die',face:'sly',c1:'#fca5a5',c2:'#7f1d1d',imp:true,shot:'bdie'},desc:'A mischievous little gambler. Fast, with lucky crits.'},
 m_bounty:{name:'Bounty Hunter',role:'Sniper',merge:true,tier:1,hp:380,dmg:62,rate:1,range:210,spd:90,r:12,armor:2,kind:'ranged',sp:{crit:1/3,critX:4,bounty:2},look:{b:'human',face:'mask',hat:'cowboy',hatCol:'#1c1917',hatBand:'#b45309',body:'#3f2a17',poncho:'#9a7b4f',scarf:'#7f1d1d',weapon:'crossbow',bandolier:true,shot:'slug'},desc:'Long-range rifle, deadly aim, and a cut of every kill: +2 chips each.'},
 m_heavy:{name:'The Heavyweight',role:'Champion',merge:true,tier:1,hp:1300,dmg:60,rate:1.1,range:24,spd:80,r:15,armor:5,kind:'melee',sp:{cleave:30,stun:.3},look:{b:'human',face:'angry',bulk:1.5,body:'#b91c1c',skin:'#b07a52',hat:'none',weapon:'gloves',belt:'gold'},desc:'Two bouncers, one champion. Haymakers that hit everything nearby and often stun.'},
 m_knox:{name:'Fort Knox',role:'Robot · Fortress',merge:true,tier:1,hp:2400,dmg:30,rate:.9,range:26,spd:50,r:18,armor:10,kind:'melee',sp:{taunt:120},look:{style:'bank',b:'robot',face:'led',torso:'gold',legs:'treads',arms:['shield','claw'],head:'dome',c1:'#d4a12a',c2:'#475569'},desc:'An armored vault on treads. Pulls in everything nearby and barely notices.'},
 m_bandit:{name:'One-Armed Bandit',role:'Robot',merge:true,tier:1,hp:1000,dmg:36,rate:1.25,range:132,spd:72,r:16,armor:4,kind:'ranged',sp:{targets:4},look:{style:'bandit',b:'robot',face:'mask',torso:'slot',legs:'biped',arms:['none','lever'],head:'visor',c1:'#7f1d1d',c2:'#fbbf24',shot:'laser'},desc:'A slot machine with one huge arm. Hits four enemies per pull.'},
 m_sultan:{name:'Jackpot Sultan',role:'Genie lord',merge:true,tier:1,hp:700,dmg:44,rate:1.3,range:148,spd:84,r:15,kind:'ranged',sp:{targets:4,jackpot:1/6},look:{b:'human',face:'mystic',float:true,bulk:1.25,body:'#9d174d',skin:'#f0abfc',hat:'turban',hatCol:'#fbbf24',vest:'#fde68a',beard:true,weapon:'coin',shot:'coin'},desc:'Grants four wishes at a time. Jackpots come often.'},
 m_phantom:{name:'Phantom Ace',role:'Assassin',merge:true,tier:1,hp:420,dmg:130,rate:.85,range:248,spd:104,r:12,kind:'pierce',sp:{crit:1/5,critX:3},look:{b:'human',halfmask:true,hat:'hood',hatCol:'#155e75',body:'#0e7490',float:true,ghost:true,mouth:'none',weapon:'cards',spark:true,beam:'#a5f3fc'},desc:'A ghost of a card sharp. Its spectral aces pierce from very far away.'},
 m_dread:{name:'Roulette Dreadnought',role:'Heavy tank',merge:true,tier:1,hp:1500,dmg:120,rate:.8,range:236,spd:58,r:20,armor:6,kind:'pierce',sp:{shots:2},look:{style:'dreadTank',b:'tank',face:'pips',c1:'#1f2937',c2:'#b91c1c',twin:true,beam:'#fde68a'},desc:'Two roulette turrets on one hull. Fires two piercing rails at once.'},
 m_hex:{name:'Hex Dealer',role:'Warlock',merge:true,tier:1,hp:470,dmg:56,rate:.85,range:150,spd:82,r:12,kind:'aoe',sp:{splash:64,slow:.4,crit:1/6,critX:3},look:{b:'human',face:'sly',hat:'hood',hatCol:'#14532d',body:'#166534',coat:true,aura:'#22c55e',weapon:'staff',staffTop:'#86efac',shot:'card'},desc:'Curses an area, slowing enemies, with lucky critical hexes.'},
 m_casino:{name:'Grand Casino',role:'Siege titan',merge:true,tier:1,hp:2100,dmg:225,rate:.5,range:245,minR:40,spd:48,r:19,armor:6,kind:'artillery',sp:{splash:92},look:{b:'crab',face:'beady',c1:'#7c2d12',c2:'#fde68a',big:true},desc:'A crab carrying an entire casino. Massive siege blasts.'},
 m_tempest:{name:'Tempest Ace',role:'Stormcaller',merge:true,tier:1,hp:1250,dmg:205,rate:1.05,range:222,spd:88,r:15,armor:3,kind:'chain',sp:{chains:8},look:{b:'human',face:'sly',hat:'top',hatCol:'#111827',body:'#991b1b',vest:'#fbbf24',bowtie:'#111827',coat:true,cape:'#22d3ee',sequins:'#fde68a',weapon:'cards',spark:true},desc:'A showman whose cards crackle with lightning. Chains through eight enemies.'},
 m_elder:{name:'Elder Dragon',role:'Ancient dragon',merge:true,tier:1,hp:2300,dmg:78,rate:2.5,range:115,spd:90,r:19,armor:5,kind:'cone',look:{b:'drake',face:'reptile',c1:'#065f46',c2:'#fbbf24',jade:true,big:true},desc:'An ancient luck-dragon. Its breath melts whole waves.'},
 /* ---- every hand creature now merges ---- */
 m_rail:{name:'Rail Gunner',role:'Marksman',merge:true,tier:1,hp:320,dmg:34,rate:.85,range:215,spd:90,r:11,armor:1,kind:'pierce',look:{b:'human',hat:'helmet',hatCol:'#1f2937',goggles:'#22d3ee',body:'#334155',armor:'#64748b',bulk:1.15,pack:true,skin:'#d8b48c',mouth:'frown',weapon:'railcannon',beam:'#67e8f9'},desc:'Loads lucky dice into a rail rifle. Every shot punches through the whole line, so line the bad luck up for it.'},
 m_diva:{name:'Lounge Diva',role:'Headliner',merge:true,tier:1,hp:640,dmg:72,rate:.8,range:205,spd:84,r:12,armor:2,kind:'pierce',sp:{slow:.35},look:{b:'human',face:'lashes',body:'#9d174d',skin:'#e8c9a4',hair:'#2a1238',gown:true,weapon:'mic',beam:'#f9a8d4',sonic:true},desc:'Holds one long note that rolls down a whole line of bad luck, slowing everything it passes through.'},
 m_abyss:{name:'Abyssal Vault',role:'Armored kraken',merge:true,tier:2,hp:3000,dmg:150,rate:.55,range:235,minR:40,spd:46,r:19,armor:8,kind:'artillery',sp:{splash:80,taunt:100,slow:.3},look:{b:'kraken',face:'angry',c1:'#3f4a5c',c2:'#fbbf24',plated:true},desc:'A kraken bolted inside a bank vault. Lobs ink shells that slow, and pulls attackers onto its armor.'},
 m_wyrm:{name:'Golden Wyrm',role:'Treasure dragon',merge:true,tier:2,hp:2500,dmg:72,rate:2.5,range:118,spd:92,r:19,armor:5,kind:'cone',sp:{bounty:2},look:{b:'drake',face:'reptile',c1:'#b45309',c2:'#fde68a',jade:true,genie:true},desc:'The Jinn rides the Jade Dragon. Golden breath melts the bad luck, and every kill pays extra chips.'},
 m_engine:{name:'Storm Engine',role:'Lightning robot',merge:true,tier:2,hp:2000,dmg:240,rate:1,range:232,spd:70,r:17,armor:5,kind:'pierce',sp:{chains:4},look:{style:'tesla',b:'robot',face:'led',torso:'slot',legs:'treads',arms:['lever','cannon'],head:'visor',c1:'#581c87',c2:'#f0abfc',beam:'#e9d5ff'},desc:'A slot machine wired to the Thunder Croupier. Fires a lightning lance through a whole line, then arcs it onward.'},
 m_house:{name:'The House',role:'Walking empire',merge:true,tier:3,hp:5600,dmg:420,rate:1.05,range:225,spd:62,r:22,armor:10,kind:'artillery',sp:{splash:90,chains:5,aura:.25,taunt:120},look:{b:'robot',face:'regal',torso:'gold',legs:'biped',arms:['shield','missile'],head:'dome',crown:true,c1:'#fbbf24',c2:'#7c2d12'},desc:'The Sovereign on a throne of solid vault steel. The house always wins.'},
 /* ---- same-creature merges ---- */
 m_vtitan:{name:'Vault Titan',role:'Guardian giant',merge:true,tier:2,hp:2400,dmg:58,rate:.9,range:26,spd:56,r:18,armor:9,kind:'melee',sp:{taunt:110,stun:.25,cleave:30},look:{b:'robot',face:'led',torso:'safe',legs:'biped',arms:['fist','fist'],head:'castle',c1:'#475569',c2:'#fbbf24'},desc:'Two Vault Mechs bolted into one walking bank. Pulls the bad luck in, then stuns it with both fists.'},
 m_megaslot:{name:'Megaslot',role:'Spider robot',merge:true,tier:2,hp:950,dmg:30,rate:1.35,range:142,spd:80,r:15,armor:3,kind:'ranged',sp:{targets:5},look:{style:'cabinet',b:'robot',face:'led',torso:'slot',legs:'spider',arms:['lever','lever'],head:'dome',c1:'#dc2626',c2:'#fde68a',shot:'laser'},desc:'A slot machine on spider legs. Pulls both levers and lasers five targets at once.'},
 m_djinn:{name:'Twin Djinn',role:'Genie pair',merge:true,tier:2,hp:680,dmg:40,rate:1.35,range:152,spd:88,r:13,kind:'ranged',sp:{targets:4,jackpot:1/5},look:{b:'human',face:'mystic',float:true,body:'#0e7490',skin:'#67e8f9',hat:'turban',hatCol:'#fbbf24',weapon:'orb',orbCol:'#a5f3fc',dual:true,shot:'orb'},desc:'Two wishes, both bad for the bad luck. Four targets per volley and a big jackpot chance.'},
 m_strider:{name:'Wheel Strider',role:'Siege walker',merge:true,tier:2,hp:1900,dmg:135,rate:.75,range:248,spd:58,r:18,armor:6,kind:'pierce',sp:{shots:2},look:{b:'robot',face:'pips',torso:'dice',legs:'spider',arms:['cannon','cannon'],head:'visor',c1:'#7f1d1d',c2:'#fbbf24',beam:'#fca5a5'},desc:'Two Roulette Tanks rebuilt as a walking gun platform. Twin rail lances that skewer whole lines.'},
 m_coven:{name:'Felt Coven',role:'Witch circle',merge:true,tier:2,hp:540,dmg:52,rate:.85,range:152,spd:80,r:12,kind:'aoe',sp:{splash:72,slow:.45},look:{b:'card',face:'sly',c1:'#14532d',c2:'#bbf7d0',hat:true,coven:true,shot:'card'},desc:'A full circle of felt witches. Bigger hexes, heavier slows.'},
 m_chorus:{name:'Siren Chorus',role:'Choir',merge:true,tier:2,hp:660,dmg:66,rate:.85,range:162,spd:82,r:13,kind:'aoe',sp:{splash:74,slow:.3,stun:.35},look:{b:'card',face:'lashes',c1:'#831843',c2:'#fbcfe8',siren:true,coven:true,shot:'card'},desc:'Sirens in harmony. Their song stuns whole crowds of bad luck.'},
 m_leviathan:{name:'Leviathan',role:'Sea titan',merge:true,tier:2,hp:2700,dmg:150,rate:.55,range:252,minR:40,spd:50,r:19,armor:6,kind:'artillery',sp:{splash:84,shells:3},look:{b:'kraken',face:'angry',c1:'#1e3a8a',c2:'#22d3ee',crown:true},desc:'Two Casino Krakens became one ancient thing. Three ink shells per volley.'},
 m_empress:{name:'Jade Empress',role:'Dragon queen',merge:true,tier:2,hp:3000,dmg:96,rate:2.6,range:126,spd:94,r:20,armor:6,kind:'cone',sp:{slow:.25},look:{b:'drake',face:'reptile',c1:'#065f46',c2:'#fef3c7',jade:true,crown:true},desc:'The eldest Jade Dragon wears the crown. Her breath burns and slows.'},
 m_pitboss:{name:'Storm Pit Boss',role:'Storm lord',merge:true,tier:2,hp:1500,dmg:185,rate:1.05,range:212,spd:86,r:15,armor:3,kind:'chain',sp:{chains:9},look:{b:'dealer',face:'visor',c1:'#0f172a',c2:'#38bdf8',top:true},desc:'Runs the whole storm floor. Lightning jumps through nine targets.'},
 m_gauss:{name:'Gauss Sentinel',role:'Rail turret',merge:true,tier:2,hp:1100,dmg:80,rate:.85,range:252,spd:66,r:15,armor:4,kind:'pierce',sp:{shots:2},look:{b:'robot',face:'led',torso:'dice',legs:'treads',arms:['cannon','cannon'],head:'visor',c1:'#0f766e',c2:'#67e8f9',beam:'#67e8f9'},desc:'Two Rail Gunners welded into a tracked turret. Two piercing rail shots every volley.'},
 m_devil:{name:'Lucky Devil',role:'Trickster lord',merge:true,tier:2,hp:540,dmg:46,rate:1.6,range:128,spd:124,r:11,kind:'ranged',sp:{crit:1/4,critX:4},look:{b:'human',face:'sly',body:'#7f1d1d',skin:'#f87171',horns:true,cape:'#450a0a',weapon:'coin',shot:'bdie'},desc:'Two Lucky Imps sold their souls for better odds. One throw in four crits for four times the damage.'},
 m_marshal:{name:'The Marshal',role:'Lawman',merge:true,tier:2,hp:900,dmg:150,rate:.95,range:262,spd:90,r:13,armor:3,kind:'ranged',sp:{crit:1/3,critX:4,bounty:3},look:{b:'human',hat:'cowboy',hatCol:'#f5ecd8',hatBand:'#7c2d12',body:'#b08d5b',vest:'#1e3a5f',coat:true,belt:'gold',badge:true,mustache:'#e5e7eb',mouth:'none',skin:'#d6a97c',weapon:'rifle',scope:true,shot:'slug'},desc:'Two bounty hunters became the law. Huge shots, huge bounties.'},
 m_champ:{name:'Undisputed',role:'World champion',merge:true,tier:2,hp:3600,dmg:140,rate:1.15,range:26,spd:84,r:17,armor:7,kind:'melee',sp:{cleave:40,stun:.4},look:{b:'human',face:'angry',bulk:1.5,body:'#7f1d1d',skin:'#c99a6e',weapon:'gloves',belt:'gold'},desc:'Two Heavyweights, one belt. Stuns almost every other punch.'},
};
/* ---- redesigns: every creature should look and play like itself ---- */
const REDESIGN={
 m_elder:{name:'Hydra of Clubs',role:'Three-headed serpent',kind:'cone',hp:2500,dmg:62,rate:2.3,range:116,spd:84,r:20,armor:5,sp:{heads:3},look:{b:'hydra',face:'reptile',c1:'#15803d',c2:'#bbf7d0'},desc:'Two Clover Drakes knotted into one beast. Three heads breathe on three different targets.'},
 m_empress:{name:'Phoenix Ante',role:'Firebird',kind:'aoe',hp:2200,dmg:180,rate:1.1,range:190,spd:96,r:18,armor:4,sp:{splash:56,burn:1,rebirth:1},look:{b:'phoenix',face:'reptile',c1:'#dc2626',c2:'#fde047',shot:'fire'},desc:'Fire bolts leave the ground burning. Once a round, when it would be knocked out, it bursts back to life.'},
 m_wyrm:{name:'Golden Wyrm',role:'Treasure serpent',kind:'cone',hp:2400,dmg:70,rate:2.5,range:118,spd:92,r:19,armor:5,sp:{bounty:3},look:{b:'wyrm',face:'reptile',c1:'#d97706',c2:'#fde68a'},desc:'The Jinn wished for a dragon made of gold. Its breath turns every kill into extra chips.'},
 m_leviathan:{name:'Whirlpool Leviathan',role:'Sea titan',kind:'artillery',hp:2700,dmg:140,rate:.6,range:250,minR:40,spd:48,r:20,armor:6,sp:{splash:70,shells:2,vortex:1},look:{b:'whale',face:'beady',c1:'#1e40af',c2:'#bfdbfe',crown:true},desc:'Its water shells open whirlpools that drag bad luck together and hold it there for your splash.'},
 m_abyss:{look:{b:'robot',style:'abyss',face:'angry',torso:'safe',legs:'tentacles',arms:['claw','claw'],head:'visor',c1:'#3f4a5c',c2:'#fbbf24',inky:true},desc:'A bank vault with a kraken living inside. Lobs ink shells that slow, and pulls attackers onto its armor.'},
 m_casino:{sp:{splash:92,summon:1},look:{b:'crab',face:'beady',c1:'#7f1d1d',c2:'#fbbf24',big:true,tower:true},desc:'A walking casino resort. Shells the street, and sends House Bouncers out to brawl whenever bad luck comes close.'},
 m_coven:{name:'Hex Circle',role:'Trap witches',sp:{splash:66,slow:.45,trap:1},desc:'Draws hex circles on the street ahead of the bad luck. Anything that steps in is rooted and blasted.'},
 m_chorus:{sp:{splash:74,slow:.3,charm:.35},desc:'Their song lures bad luck to turn around and wander back the way it came.'},
 m_pitboss:{kind:'beam',rate:6,dmg:48,range:205,sp:{},look:{b:'dealer',face:'visor',c1:'#0f172a',c2:'#38bdf8',top:true,cloud:true},desc:'Holds one lightning beam on a target. The longer it holds, the harder it hits, up to four times over.'},
 sf_hi:{name:'Time Croupier',role:'Chronomancer',sp:{chains:6,stasis:1},look:{b:'dealer',face:'visor',c1:'#3b0764',c2:'#fde68a',top:true,clock:true},desc:'Deals lightning, and every few seconds stops the clock: everything nearby freezes in place.'},
 m_strider:{name:'Roulette Roller',role:'Rolling wheel',kind:'roll',hp:2000,dmg:150,rate:.7,range:150,spd:70,r:18,armor:6,sp:{},look:{b:'wheel',face:'pips',c1:'#b91c1c',c2:'#111827',roller:true},desc:'Two Roulette Tanks melted into one giant wheel. It rolls straight through the bad luck and back.'},
 m_gauss:{dmg:520,rate:.3,range:300,sp:{mega:1},desc:'Charges for three seconds, then fires a rail shot clean across the whole street.'},
 m_megaslot:{name:'Jackpot Machine',role:'Spider slot machine',sp:{targets:4,reels:1},desc:'Every pull spins the reels. 7-7-7 unleashes a laser barrage, cherries heal your creatures, BARs stun everything in range.'},
 m_djinn:{name:'Wish Granter',role:'Genie lamp',kind:'ranged',hp:900,dmg:30,rate:1,range:150,spd:70,r:13,sp:{targets:2,heal:1},look:{b:'lamp',c1:'#d4a12a',c2:'#5eead4',shot:'orb'},desc:'Two Jinns in one lamp. Heals your hurt creatures and grants wishes that make them hit harder.'},
 m_champ:{name:'The Main Event',role:'Masked wrestler',sp:{cleave:30,stun:.4,throw:1},look:{b:'human',face:'angry',bulk:1.5,body:'#1d4ed8',skin:'#c99a6e',luchador:'#facc15',cape:'#facc15',belt:'gold',weapon:'gloves'},desc:'Grabs bad luck and body-slams it into its friends.'},
 m_vtitan:{name:'Magnet Vault',role:'Magnet robot',sp:{taunt:110,magnet:1,cleave:24},look:{b:'robot',style:'magnet',face:'led',torso:'safe',legs:'biped',arms:['magnet','magnet'],head:'castle',c1:'#475569',c2:'#fbbf24'},desc:'Switches on its magnets to yank nearby bad luck into a pile, then stuns it.'},
 m_marshal:{sp:{crit:1/3,critX:4,bounty:3,execute:.3},desc:'Huge shots, huge bounties. Anything below a third of its health is wanted dead: one shot finishes it.'},
 m_devil:{sp:{crit:1/4,critX:4,curse:1},desc:'Every throw curses its target. Cursed bad luck takes 40% more damage from everything.'},
};
for(const k in REDESIGN)Object.assign(UNITS[k],REDESIGN[k]);
UNITS.m_bouncer={name:'House Bouncer',role:'Temporary help',merge:true,hidden:true,tier:0,hp:240,dmg:16,rate:1.2,range:20,spd:110,r:9,armor:2,kind:'melee',look:{b:'human',body:'#111827',band:'#facc15',bandText:'SECURITY',hat:'cap',hatCol:'#111827',skin:'#c99a6e',bulk:1.15,mouth:'frown'},desc:'Sent out by the Grand Casino. Clocks off after a short shift.'};
/* ---- secret merges: not in the guide, found by trying ---- */
Object.assign(UNITS,{
 sec_craps:{name:'Craps Cannon',role:'Dice artillery',merge:true,secret:true,tier:2,hp:1100,dmg:58,rate:1,range:175,spd:66,r:15,armor:4,kind:'aoe',sp:{splash:54,craps:1},look:{b:'robot',face:'pips',torso:'dice',legs:'treads',arms:['cannon','cannon'],head:'dome',c1:'#f8fafc',c2:'#dc2626',shot:'die'},desc:'Fires dice in pairs. Roll doubles and the shot explodes for four times the damage.'},
 sec_hexhound:{name:'Hex Hound',role:'Cursed beast',merge:true,secret:true,tier:1,hp:520,dmg:28,rate:1.5,range:20,spd:128,r:12,armor:2,kind:'melee',sp:{curse:1,cleave:22},look:{b:'hound',face:'dog',c1:'#14532d',c2:'#a855f7'},desc:'A witch\'s hound. Every bite curses: cursed bad luck takes 40% more damage from everything.'},
 sec_cooler:{name:'The Cooler',role:'Bad-luck enforcer',merge:true,secret:true,tier:1,hp:900,dmg:30,rate:1,range:22,spd:80,r:13,armor:5,kind:'melee',sp:{chill:.35,stun:.2},look:{b:'human',face:'shades',bulk:1.25,body:'#0c4a6e',coat:true,hat:'beanie',hatCol:'#bae6fd',aura:'#7dd3fc',frost:true,mouth:'frown',skin:'#d6b08c',weapon:'knuckles'},desc:'Casinos hire him to kill a hot streak. Everything near him moves 35% slower.'},
 sec_shelldragon:{name:'Shell Dragon',role:'Siege dragon',merge:true,secret:true,tier:2,hp:2000,dmg:110,rate:.7,range:220,minR:40,spd:62,r:18,armor:6,kind:'artillery',sp:{splash:64,burn:1},look:{b:'drake',face:'reptile',c1:'#c2410c',c2:'#fde68a',shell:true},desc:'A dragon that moved into a hermit-crab mansion. Lobs fireballs that leave the street burning.'},
 sec_thunderbird:{name:'Thunderbird',role:'Storm bird',merge:true,secret:true,tier:2,hp:1300,dmg:150,rate:1.05,range:200,spd:110,r:16,armor:3,kind:'chain',sp:{chains:7},look:{b:'phoenix',face:'reptile',c1:'#1e3a8a',c2:'#facc15',storm:true},desc:'Rides the storm the Dealer called up. Lightning leaps through seven targets.'},
 sec_miteking:{name:'The Mite King',role:'Tiny monarch',merge:true,secret:true,tier:3,hp:1200,dmg:60,rate:1.6,range:20,spd:120,r:11,armor:4,kind:'melee',sp:{kingAura:.3,cleave:20},look:{b:'chip',face:'beady',c1:'#e94b5a',c2:'#fbbf24',crown:true,cape:true},desc:'The Sovereign crowned a Chip Mite as a joke. Every creature you own hits 30% harder.'},
 /* ---- signature hands ---- */
 sig_underdog:{name:'The Underdog',role:'Scrappy chip',sig:'7-5-4-3-2, no flush',hand:0,hi:false,hp:160,dmg:14,rate:1.4,range:18,spd:120,r:9,cnt:1,kind:'melee',sp:{grow:.05},look:{b:'chip',face:'angry',c1:'#78716c',c2:'#fbbf24',band:true},desc:'The worst hand in poker. Grows 5% stronger with every kill, up to three times its strength.'},
 sig_deadman:{name:"Dead Man's Hand",role:'Ghost gunslinger',sig:'Aces and eights, two pair',hand:2,hi:true,hp:520,dmg:34,rate:1.25,range:170,spd:100,r:12,cnt:1,kind:'ranged',sp:{shots:2,crit:1/4,critX:4,execute:.25},look:{b:'human',skull:true,ghost:true,float:true,aura:'#22d3ee',hat:'cowboy',hatCol:'#111827',hatBand:'#0e7490',hatCards:true,body:'#1f2937',coat:true,weapon:'revolver',shot:'slug'},desc:'An old legend of the card table. Two shots at a time, and anything badly hurt drops dead.'},
 sig_sevens:{name:'Lucky Sevens',role:'Jackpot machine',sig:'Four sevens',hand:7,hi:true,hp:1600,dmg:60,rate:1.4,range:170,spd:76,r:16,armor:4,cnt:1,kind:'ranged',sp:{targets:3,jackpot:.3,bounty:7},look:{b:'seven',face:'beady',c1:'#fbbf24',c2:'#dc2626',shot:'coin'},desc:'Every kill pays seven chips, and nearly a third of its shots hit the jackpot.'},
 sig_broadway:{name:'Broadway Star',role:'Showstopper',sig:'Ace-high straight, no flush',hand:4,hi:true,hp:900,dmg:70,rate:.9,range:180,spd:90,r:13,armor:2,cnt:1,kind:'aoe',sp:{splash:70,stun:.6},look:{b:'human',body:'#b8860b',sequins:'#fff7d6',bowtie:'#dc2626',skin:'#e8c9a4',hat:'top',hatCol:'#111827',mouth:'grin',aura:'#fde68a',pants:'#111827',weapon:'cane',shot:'card'},desc:'Every number stops the show: big splash, and most of the bad luck it hits is stunned.'},
 sig_hearts:{name:'Queen of Hearts',role:'Healing monarch',sig:'Royal flush in hearts',hand:9,hi:true,hp:3600,dmg:300,rate:1.1,range:210,spd:80,r:19,armor:6,cnt:1,kind:'artillery',sp:{splash:82,heal:1,aura:.25},look:{b:'sovereign',face:'regal',c1:'#fb7185',c2:'#fecdd3',queen:true},desc:'The rarest hand in the deck. Heals your creatures, inspires them, and shells the street.'},
});
const SECRET_MERGES=[['p_lo','t_lo','sec_craps'],['hc_hi','f_lo','sec_hexhound'],['tp_lo','s_lo','sec_cooler'],['q_lo','fh_lo','sec_shelldragon'],['sf_lo','q_lo','sec_thunderbird'],['hc_lo','rf','sec_miteking']];
function signatureOf(cards,ev){const vs=cards.map(c=>c.v).sort((a,b)=>b-a).join(),flush=cards.every(c=>c.s===cards[0].s);
  if(ev.rank===9&&cards.every(c=>c.s==='H'))return 'sig_hearts';
  if(ev.rank===7&&ev.groups[0][0]===7)return 'sig_sevens';
  if(ev.rank===4&&ev.sh===14)return 'sig_broadway';
  if(ev.rank===2&&ev.groups[0][0]===14&&ev.groups[1][0]===8)return 'sig_deadman';
  if(vs==='7,5,4,3,2'&&!flush)return 'sig_underdog';
  return null;}
/* ---- casino tiers ---- */
const CASINO_TIERS=[
 {name:'Corner Casino',hp:100,cannon:1,plate:0,shots:1,desc:'Where it all began.'},
 {name:'Neon Palace',hp:170,cannon:2,plate:1,shots:1,cost:200,desc:'Neon marquee, a bigger cannon, gilded walls.'},
 {name:'Grand Resort',hp:260,cannon:3,plate:2,shots:2,cost:450,desc:'A spotlight tower and twin cannons.'},
 {name:'Sky Tower',hp:380,cannon:5,plate:3,shots:3,cost:850,desc:'A glowing dome, searchlights and three cannons.'}];
const MERGES=[
 ['hc_lo','hc_lo','m_trooper'],['m_trooper','m_trooper','m_colossus'],['m_colossus','m_colossus','m_jugg'],
 ['hc_hi','hc_hi','m_cerb'],['m_cerb','m_cerb','m_chimera'],['hc_lo','hc_hi','m_rider'],
 ['p_lo','p_lo','m_dtroop'],['m_dtroop','m_dtroop','m_dmech'],['m_dmech','m_dmech','m_fortress'],
 ['hc_lo','p_lo','m_imp'],['p_hi','p_hi','m_bounty'],['tp_lo','tp_lo','m_heavy'],['tp_hi','tp_lo','m_knox'],
 ['t_lo','tp_lo','m_bandit'],['t_hi','t_lo','m_sultan'],['s_lo','s_lo','m_phantom'],['s_hi','s_lo','m_dread'],
 ['f_lo','p_hi','m_hex'],['fh_lo','fh_lo','m_casino'],['sf_lo','s_lo','m_tempest'],['q_lo','q_lo','m_elder'],
 ['p_lo','p_hi','m_rail'],['f_hi','p_hi','m_diva'],['fh_hi','tp_hi','m_abyss'],['q_hi','t_hi','m_wyrm'],['sf_hi','t_lo','m_engine'],['rf','tp_hi','m_house'],
 ['tp_hi','tp_hi','m_vtitan'],['t_lo','t_lo','m_megaslot'],['t_hi','t_hi','m_djinn'],['s_hi','s_hi','m_strider'],['f_lo','f_lo','m_coven'],['f_hi','f_hi','m_chorus'],
 ['m_rider','m_rider','m_derby'],['m_cerb','m_rider','m_greyhound'],
 ['fh_hi','fh_hi','m_leviathan'],['q_hi','q_hi','m_empress'],['sf_lo','sf_lo','m_pitboss'],['m_rail','m_rail','m_gauss'],['m_imp','m_imp','m_devil'],['m_bounty','m_bounty','m_marshal'],['m_heavy','m_heavy','m_champ'],
];

Object.assign(UNITS,{
 m_derby:{name:'Derby Champion',role:'Racehorse',merge:true,tier:2,hp:1500,dmg:95,rate:.85,range:70,spd:150,r:15,armor:4,kind:'roll',sp:{},look:{b:'horse',face:'beady',c1:'#7c2d12',c2:'#1c1917',silk:'#dc2626',silk2:'#fde047',num:'1',crown:true},desc:'A champion racehorse and its jockey. Gallops straight through the bad luck, trampling everything in a line.'},
 m_greyhound:{name:'Trap One',role:'Track star',merge:true,tier:2,hp:1100,dmg:48,rate:1.7,range:20,spd:175,r:12,armor:3,kind:'melee',sp:{cleave:20,summon:'m_dog',sumN:3,sumLife:8,sumCd:8},look:{b:'greyhound',face:'beady',c1:'#9ca3af',silk:'#dc2626',num:'1',muzzle:true},desc:'Top dog at the track. Every few seconds the traps open and three racing greyhounds sprint out after the bad luck.'},
 m_dog:{name:'Racing Greyhound',role:'Temporary help',merge:true,hidden:true,tier:0,hp:220,dmg:24,rate:1.7,range:18,spd:215,r:8,armor:1,kind:'melee',look:{b:'greyhound',face:'beady',c1:'#a8a29e',silk:'#2563eb',num:'3',muzzle:true},desc:'Out of the traps and after the bad luck. Heads back to the kennel after a few seconds.'}});
function mergeResult(a,b){for(const [x,y,z] of MERGES.concat(SECRET_MERGES))if((x===a&&y===b)||(x===b&&y===a))return z;return null;}
function secretFound(out){try{return typeof Meta!=='undefined'&&!!Meta.data.seen[out];}catch(e){return false;}}
function recipesFor(k){return MERGES.concat(SECRET_MERGES.filter(m=>secretFound(m[2]))).filter(m=>m[0]===k||m[1]===k).map(m=>({partner:m[0]===k?m[1]:m[0],out:m[2]}));}
function unitDps(k){const d=UNITS[k],sp=d.sp||{};let m=(sp.targets||1)*(sp.shots||1);if(sp.crit)m*=1+sp.crit*(sp.critX-1);if(sp.jackpot)m*=1+sp.jackpot*3;
  if(d.kind==='pierce')m*=1.8*(1+(sp.chains||0)*.35);if(d.kind==='beam')m*=2.2;if(d.kind==='roll')m*=2;if(sp.heads)m*=sp.heads*.75;if(d.kind==='aoe')m*=2;if(d.kind==='artillery')m*=2.4*(sp.shells||1);if(d.kind==='cone')m*=2.4;if(d.kind==='chain')m*=1+(sp.chains||0)*.6;if(sp.cleave)m*=1.6;
  return d.dmg*d.rate*m*(d.cnt||1);}

/* ---------- enemies: "bad luck" ---------- */
const ENEMIES={
 jinx:{name:'Jinx',hp:1,spd:58,armor:0,bite:2,dmg:5,rate:1,r:8,gold:2,col:'#a855f7'},
 cat:{name:'Black Cat',hp:.5,spd:138,armor:0,bite:2,dmg:4,rate:1.2,r:7.5,gold:2,col:'#facc15',dodge:true,trait:'fast'},
 getaway:{name:'Getaway Car',hp:2.4,spd:150,armor:.5,bite:4,dmg:0,rate:1,r:12,gold:6,col:'#f43f5e',dodge:true,trait:'fast'},
 mirror:{name:'Broken Mirror',hp:2.4,spd:42,armor:3,bite:3,dmg:11,rate:.9,r:10,gold:4,col:'#cbd5e1',split:3,trait:'armored'},
 shard:{name:'Mirror Shard',hp:.3,spd:90,armor:0,bite:1,dmg:3,rate:1.3,r:5.5,gold:1,col:'#e2e8f0'},
 hexer:{name:'Hexer',hp:1.1,spd:56,armor:0,bite:2,dmg:9,rate:.9,r:8,gold:3,col:'#22d3ee',ranged:115,trait:'ranged'},
 gnat:{name:'Bad Omen',hp:.2,spd:96,armor:0,bite:1,dmg:2,rate:1.4,r:5.5,gold:1,col:'#f87171',fly:true,dodge:true,trait:'swarm'},
 chewer:{name:'Rope Rat',hp:.8,spd:72,armor:0,bite:2,dmg:4,rate:1.2,r:7,gold:3,col:'#d97706',trait:'chewer'},
 charm:{name:'Lucky Charm',hp:1.3,spd:50,armor:0,bite:2,dmg:4,rate:1,r:8,gold:5,col:'#4ade80',trait:'healer'},
 bondsman:{name:'Bail Bondsman',hp:2.2,spd:46,armor:1,bite:3,dmg:8,rate:.9,r:10,gold:6,col:'#60a5fa',trait:'shield'},
 cheat:{name:'Card Cheat',hp:1.1,spd:64,armor:0,bite:3,dmg:7,rate:1.1,r:8,gold:5,col:'#cbd5e1',trait:'stealth',stealth:true},
 ogre:{name:'Repo Ogre',hp:12,spd:42,armor:2,bite:12,dmg:34,rate:.7,r:16,gold:70,col:'#84cc16',mini:true},
 boss:{name:'Boss',hp:36,spd:38,armor:3,bite:35,dmg:70,rate:.6,r:21,gold:220,col:'#f43f5e',boss:true},
};
const ENEMY_DESC={
 jinx:'Everyday bad luck. Slow, soft and everywhere.',
 cat:'Crosses your path at a sprint. Ignores your creatures and runs for the casino.',
 getaway:'A stolen car full of bad luck. Fast, tough, and it will not stop for anyone.',
 mirror:'Armored glass. Shatters into three Mirror Shards when broken.',
 shard:'A sliver of broken mirror. Weak, quick and sharp.',
 hexer:'Throws curses at your creatures from range.',
 gnat:'A bad omen on wings. Flies straight over ropes and buildings.',
 ogre:'Comes to repossess your casino. Its ground slam stuns nearby creatures.',
 boss:'A loan shark of the worst kind. Each one brings a signature move, and gets meaner as it takes damage.',
 chewer:'Gnaws through your velvet ropes. Kill it before it opens a shortcut.',
 charm:'Every few seconds it heals all the bad luck around it. Take it out first.',
 bondsman:'Posts bail for its friends: shields the bad luck around it.',
 cheat:'Invisible until it gets near your casino or a sharp-eyed creature spots it.'};
const BOSS_MOVE_DESC={summon:'Calls in a crowd of extra bad luck.',dash:'Charges through your line at speed.',shield:'Throws up a shield that soaks damage.',edge:'Alternates between its tricks.',slam:'Slams the ground, stunning creatures nearby.'};
const TRAITS={
 fast:{name:'Fast',icon:'next',tip:'Runs straight past your creatures for the casino. Guard the casino and slow them on the way.'},
 swarm:{name:'Flying swarm',icon:'sparkles',tip:'Dozens of weak fliers that cross ropes and buildings in a straight line. Splash, chains and numbers win.'},
 armored:{name:'Armored',icon:'armor',tip:'Weak hits barely scratch them, and they shatter into shards. Bring big hits: tanks, snipers, artillery.'},
 ranged:{name:'Ranged',icon:'range',tip:'Shoots your creatures from a distance. Melee walls take a beating; out-range them.'},
 boss:{name:'Boss',icon:'kills',tip:'One huge enemy. Focus everything on it. It gets angrier at half and quarter health.'},
 chewer:{name:'Rope chewers',icon:'rope',tip:'Rope Rats chew through velvet ropes. Guard your maze or rebuild it between rounds.'},
 healer:{name:'Healers',icon:'heart',tip:'Lucky Charms heal the bad luck around them. Focus them down first.'},
 shield:{name:'Shields',icon:'plate',tip:'Bail Bondsmen shield nearby bad luck. Kill the bondsman or bring burst damage.'},
 stealth:{name:'Invisible',icon:'sparkles',tip:'Card Cheats are invisible until near your casino or a sharp-eyed creature: Snake Eyes, Card Sharp, the Jinn, snipers and storm casters.'},
};
for(const k of ['p_hi','s_lo','t_hi','m_bounty','m_marshal','m_phantom','m_djinn','m_sultan','m_rail','m_gauss','sf_lo','sf_hi','m_pitboss','m_tempest','m_engine','m_diva'])if(UNITS[k])UNITS[k].detect=true;
const BOSS_NAMES=['The Debt Collector','The Loan Shark','The Bad Beat','The House Edge'];
function waveHp(w){return (24*Math.pow(1.172,w-1)+5*w);}
function rivalHpScale(w){return (24*Math.pow(1.135,w-1)+5*w)/waveHp(w);}
function waveComp(w){
  const L=[],add=(t,n)=>{for(let i=0;i<n;i++)L.push(t);},s=Math.floor(w/5),late=w>10;
  let name,spread;
  if(w%10===0){add('jinx',6);add('hexer',4);if(w>=20){add('charm',2);add('bondsman',1);}L.push('boss');return {name:BOSS_NAMES[w/10-1],list:L,boss:true,traits:w>=20?['boss','healer','shield']:['boss']};}
  if(w%5===0){add('jinx',5);add('mirror',3);if(w>=15){add('bondsman',1);add('charm',1);}L.push('ogre');return {name:'Repo Ogre',list:L,mini:true,traits:w>=15?['boss','armored','shield','healer']:['boss','armored']};}
  switch(w%10){
    case 1:add('jinx',13+s);if(late){add('hexer',2+(s>>1));add('charm',1);}name='Jinxes';break;
    case 2:add('cat',w<10?8:10+s*2);if(w>=12){add('getaway',1+(s>>1));add('chewer',2);}name='Black cat stampede';spread=6;break;
    case 3:add('mirror',5+s);if(late)add('jinx',5);if(w>=13)add('bondsman',1+(s>>1));name='Broken mirrors';break;
    case 4:add('gnat',w<10?22:34+s*6);name='Bad omens';spread=7;break;
    case 6:add('hexer',8+s);add('jinx',5);add('cheat',2+s);name='Hexers and cheats';break;
    case 7:add('cat',10+s*2);add('getaway',2+(s>>1));add('chewer',2+(s>>1));name='Getaway and rope rats';spread=8;break;
    case 8:add('gnat',w<10?18:26+s*5);add('mirror',3+(s>>1));if(w>=18)add('bondsman',1);name='Omens and mirrors';spread=9;break;
    case 9:add('jinx',6);add('cat',6+s);add('mirror',2+(s>>1));add('hexer',3);add('gnat',12+s*2);add('charm',1+(s>>1));if(w>=19)add('cheat',2);name='Full crew';break;
  }
  shuffleArr(L);const tr=[...new Set(L.map(k=>ENEMIES[k].trait).filter(Boolean))];
  return {name,list:L,traits:tr,spread};
}
function waveThreat(w){const c=waveComp(w);let t=0;for(const k of c.list){let h=ENEMIES[k].hp*waveHp(w);if(k==='boss')h*=1+w/30;t+=h;}return t;}

/* ---------- rivals ---------- */
const RIVALS=[
 {name:'Lucky Lou',short:'Lou',col:'#f59e0b',aggr:.65,bluff:.12,tip:.35,face:'L'},
 {name:'Madame Vega',short:'Vega',col:'#a78bfa',aggr:.4,bluff:.06,tip:.5,face:'V'},
 {name:'Ivory Jack',short:'Jack',col:'#e2e8f0',aggr:.25,bluff:.03,tip:.15,face:'J'},
 {name:'Duchess Dora',short:'Dora',col:'#f472b6',aggr:.55,bluff:.1,tip:.3,face:'D'},
 {name:'Two-Bit Tess',short:'Tess',col:'#34d399',aggr:.8,bluff:.2,tip:.2,face:'T'},
];
const DIFFS={
 casual:{name:'Casual',hp:.75,rival:.8,start:260,desc:'Weaker waves, looser rivals.'},
 standard:{name:'Standard',hp:1.2,rival:1.06,early:.2,earlyBite:2.45,start:220,desc:'The game as designed.'},
 high:{name:'High Roller',hp:1.45,rival:1.12,early:.1,earlyBite:1.4,start:200,desc:'Tougher waves, sharper rivals.'},
};
const rnd=Math.random;
function shuffleArr(a){for(let i=a.length-1;i>0;i--){const j=(rnd()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]];}return a;}
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const fmt=n=>{n=Math.round(n);return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(n>=1e5?0:1)+'k':n.toLocaleString('en-US');};

/* ---------- active abilities ---------- */
const ABIL={
 siege:{name:'Siege Mode',type:'toggle',cd:1.5,icon:'anchor',desc:'Deploy: cannot move, but range +110 and the rail hits 80% harder with a blast. Press again to pack up.'},
 deadshot:{name:'Dead Shot',type:'enemy',cd:20,icon:'amove',desc:'Take aim at one enemy for a moment, then fire a shot for 6× damage that ignores armor.'},
 fan:{name:'Fan the Hammer',type:'self',cd:15,icon:'zap',desc:'Fire three times as fast for 3 seconds.'},
 storm:{name:'Hex Storm',type:'area',cd:18,rad:62,icon:'cloud',desc:'A swirling hex that shreds everything inside it for 3 seconds.'},
 lullaby:{name:'Lullaby',type:'area',cd:20,rad:78,icon:'music',desc:'Puts every enemy in the area to sleep for 2.5 seconds.'},
 thunder:{name:'Thunderstorm',type:'area',cd:22,rad:95,icon:'cloud-lightning',desc:'Lightning strikes random enemies in the area for 4 seconds.'},
 barrage:{name:'Bombardment',type:'area',cd:20,rad:85,n:6,icon:'bomb',desc:'Shells rain across the target area.'},
 salvo:{name:'Rocket Salvo',type:'area',cd:20,rad:95,n:10,icon:'rocket',desc:'A swarm of rockets saturates the target area.'},
 frag:{name:'Frag Dice',type:'area',cd:12,rad:50,n:3,icon:'bomb',desc:'Lob three exploding dice.'},
 inferno:{name:'Inferno',type:'self',cd:18,icon:'flame',desc:'Breathe twice as fast and 40 farther for 3 seconds.'},
 haymaker:{name:'Haymaker',type:'self',cd:14,rad:60,icon:'hand-fist',desc:'Slam the ground: damages and stuns everything nearby.'},
 lockdown:{name:'Lockdown',type:'self',cd:20,icon:'lock',desc:'Seal up for 5 seconds: +12 armor and taunts everything in a wide radius.'},
 jackpot:{name:'Hit the Jackpot',type:'self',cd:16,icon:'sparkles',desc:'Pay out at once: a huge blast on the nearest enemy, and +10 chips.'},
 fanknives:{name:'Fan of Cards',type:'self',cd:12,icon:'spade',desc:'Throw piercing cards in every direction.'},
 pounce:{name:'Pounce',type:'enemy',cd:10,icon:'move-up-right',desc:'Leap onto an enemy, damaging and stunning everything where it lands.'},
 decree:{name:'Royal Decree',type:'self',cd:30,icon:'crown',desc:'Every creature deals 50% more damage for 6 seconds.'},
};
const AB_OF={
 s_hi:'siege',m_dread:'siege',            // tanks
 sf_hi:'thunder',m_tempest:'thunder',     // top casters
 rf:'decree',                             // royal flush
 m_bounty:'deadshot',m_hex:'storm',m_knox:'lockdown',m_casino:'barrage',m_elder:'inferno', // elite merges
 m_chimera:'pounce',m_jugg:'salvo',m_fortress:'barrage', // ends of the bad-card chains
 m_diva:'lullaby',m_abyss:'lockdown',m_wyrm:'inferno',m_engine:'thunder',m_house:'decree', // new elite merges
 m_strider:'jackpot',m_chorus:'lullaby',m_leviathan:'barrage',m_empress:'inferno',m_pitboss:'storm',m_gauss:'deadshot',m_marshal:'deadshot',m_champ:'haymaker',
};
for(const k in AB_OF)UNITS[k].ab=AB_OF[k];
UNITS.tp_hi.role='Guardian robot';UNITS.m_colossus.role='Golem';UNITS.m_knox.role='Armored vault';UNITS.m_fortress.role='Walking fortress';UNITS.s_hi.role='Tank';UNITS.m_dread.role='Heavy tank';

/* ---------- rival banter (original lines) ---------- */
const BARKS={
 Lou:{raise:['Feeling lucky.','Let it ride!','Too rich for ya?'],fold:['Eh, next one.','Not worth my time.'],win:['Read \'em and weep!','Lou lands on his feet!'],lose:['Rigged, I tell ya.','Beginner\'s luck.'],bust:['My beautiful casino!'],tip:['Treat me right, dealer.'],allin:['All of it. Every chip!']},
 Vega:{raise:['The cards have spoken.','I foresaw this.'],fold:['Not my moment.','The omens are poor.'],win:['Fate is kind tonight.','As the cards foretold.'],lose:['The stars lied to me.','A cloud over my vision.'],bust:['I saw this coming...'],tip:['A gift for the spirits.'],allin:['Destiny calls.']},
 Jack:{raise:['Raise.','You\'re bluffing.'],fold:['Fold.','Pass.'],win:['As expected.','Thank you.'],lose:['Hm.','Noted.'],bust:['Well played.'],tip:['...'],allin:['All in.']},
 Dora:{raise:['Shall we make it interesting?','Do keep up, darling.'],fold:['How tedious.','I\'ll sit this one out.'],win:['Delightful.','Put it on my tab.'],lose:['How vulgar.','Positively common.'],bust:['Daddy will hear of this!'],tip:['For your trouble, dear.'],allin:['Everything, darling.']},
 Tess:{raise:['All the way, baby!','Come at me!'],fold:['Pfft. Fine.','Whatever.'],win:['Ha! Pay up!','That\'s how it\'s done!'],lose:['Lucky break, that\'s all.','Next one\'s mine.'],bust:['I\'ll be back with more chips!'],tip:['Here, buy yourself somethin\'.'],allin:['Shove it all in!']},
};
const TABLE_EVENTS={
 stakes:{name:'High Stakes',desc:'Antes and bets are doubled this hand.'},
 freeswap:{name:'Free Swap',desc:'Swap up to all five cards this hand.'},
 gift:{name:'Dealer\'s Gift',desc:'Everyone is dealt the best of two hands, free.'},
};
