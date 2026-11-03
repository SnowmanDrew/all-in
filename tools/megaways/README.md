# Megaways maths

`node tools/megaways/rtp.js [spins] [key=value ...]` simulates the machine using the real engine from `megaways.js`
(everything above the `/* @@ui */` marker) and prints return-to-player, bonus frequency and the bought-bonus value.
Override any `MW_CFG` field on the command line, e.g. `node tools/megaways/rtp.js 300000 scatW=3.5`.

Rules follow the Big Time Gaming originals (Bonanza, Extra Chilli): six reels of 2–7 symbols, a four-cell
horizontal top reel over reels 2–5 (so 117,649 ways at most), ways pay from the left, Reactions (winners explode,
main reels drop from above, the top reel slides right-to-left), wilds only on the top reel, BONUS scatters only on
the main reels (one per reel). No multiplier in the base game; in free spins it's +1 per Reaction and never resets.
Four BONUS chips trigger (each extra chip +4 spins); in free spins 3 chips +5, 4+ chips +10.
Our own twists: the Big Wheel decides the spins and starting multiplier, wild reels can crash in during free spins,
and a red/black double-or-nothing gamble at the end.

Tuned at 1M spins: ~93% RTP (base ~57%, bonus ~37%), bonus about 1 in 52 spins, average bonus ~19x bet
(5x minimum, 300x cap). Buying the bonus costs 20x for ~17.5x back (~88%). The gamble is a fair 50/50.
Every arcade game returns less than it takes: slots ~74% plus a rare prize creature, dog track ~90%.
