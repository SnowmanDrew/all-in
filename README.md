# All In — Poker Defense

A neon-Vegas tower defense where poker hands summon your army. Play five-card draw against rival casinos, turn your hand into creatures, merge them into bigger ones, rope off the street and outlast the bad luck. Play solo or with friends.

## Playing locally

It's a static site with no build step. Serve the folder with anything, for example:

```
python3 -m http.server 8000
```

then open http://localhost:8000.

## Multiplayer

Online rooms use [Supabase Realtime](https://supabase.com/docs/guides/realtime) (Presence to see who is here, Broadcast to share state). Settings live in `config.js`: the project URL and its publishable key, which is designed to be public. No database tables are used.

The networking layer (`online.js`) offers the same small room API the game uses everywhere (`join`, `presence`, `peers`, `onPeers`, `leave`), and keeps its message rate inside the free plan's limits. When the game runs inside a Claude artifact it uses the artifact's own room instead.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page, styles and layout |
| `data.js` | Creatures, merges, enemies, waves |
| `poker.js` | The table: dealing, betting, AI rivals |
| `game.js` | The street: units, enemies, combat, waves |
| `render.js` | All drawing |
| `net.js` | Multiplayer game logic (host, sync, watching) |
| `online.js`, `config.js` | Supabase rooms for the public site |
| `minigames.js`, `arcade.js` | Table nights, slots, Megaways, dog track, Derby Night |
| `sports.js`, `fight.js` | Sports Night betting and the live arena fights |
| `secrets.js` | Secret bosses, hidden achievements, easter eggs |
| `ui.js` | Menus, controls, panels |
| `vendor/supabase.js` | supabase-js 2.118.0 (MIT) |

Icons are from [Lucide](https://lucide.dev) (ISC).
