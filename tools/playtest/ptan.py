import json,collections,statistics as st,sys
rows=[json.loads(l[7:]) for l in open('pt_results.jsonl') if l.startswith('RESULT ')]
by=collections.defaultdict(list)
for r in rows: by[(r['strat'],r['diff'])].append(r)
order=['pro','nomerge','gambler','turtle','mazer','station','nit','maniac','hoarder','rusher','afk']
print(f"{'strategy':10} {'diff':10} n  win  rounds(min-med-max)  why                      leaks  merges  mins  first leak  hp<50%@")
for d in ['casual','standard','high']:
  for s in order:
    R=by.get((s,d));
    if not R: continue
    ws=[r['wave'] for r in R];wins=sum(r['won'] for r in R)
    why=collections.Counter(r['why'] for r in R).most_common()
    fl=[next((w['w'] for w in r['waves'] if w['lk']>0),None) for r in R]
    half=[next((w['w'] for w in r['waves'] if w['hp']<w['max']*.5),None) for r in R]
    print(f"{s:10} {d:10} {len(R)}  {wins}/{len(R)}  {min(ws):>3}-{int(st.median(ws)):>3}-{max(ws):>3}        {', '.join(f'{k}×{v}' for k,v in why):24} {int(st.mean(r['leaks'] for r in R)):>5}  {int(st.mean(r['merges'] for r in R)):>6}  {st.mean(r['mins'] for r in R):>4.1f}  {str(fl):12} {half}")
  print()
if '-v' in sys.argv:
  for k,R in sorted(by.items()):
    for r in R: print(k, r['wave'], r['why'], 'rivals out:', r['rivalsOut'], '| killers', r['killers'], '| hands', r['hands'], '| gamble', r['gambled'], r['gambleNet'])
