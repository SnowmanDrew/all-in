# Playtest bots

Headless bots that play full games at full speed, each with a different strategy, to check balance.

    python3 -m http.server 8765        # from the repo root
    node tools/playtest/pt.js pro standard 5      # strategy, difficulty (casual|standard|high), runs [, stop at round]
    ./tools/playtest/ptrun.sh                       # all strategies; results in pt_results.jsonl
    python3 tools/playtest/ptan.py [-v]            # summary table

Strategies: pro, afk, station (calls everything), maniac, nit, hoarder (never spends), turtle (army at the door),
rusher (army at the portal), mazer (ropes only), gambler, nomerge. Needs Node + Playwright.
