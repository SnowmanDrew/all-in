# Megaways maths

`node tools/megaways/rtp.js [spins] [key=value ...]` simulates the machine using the real engine from `megaways.js`
(everything above the `/* @@ui */` marker) and prints return-to-player, bonus frequency and the bought-bonus value.
Override any `MW_CFG` field on the command line, e.g. `node tools/megaways/rtp.js 300000 scatW=2.3`.

Tuned at 1M spins: ~93% RTP (base ~56%, bonus ~37%), bonus about 1 in 52 spins, average bonus ~19x bet
(5x minimum, 300x cap). Buying the bonus costs 22x for an average ~19x back (~87%). The red/black gamble is a fair 50/50.
Every arcade game returns less than it takes: slots ~74% plus a rare prize creature, dog track ~90%.
