#!/bin/bash
# runs strategy batches two at a time and appends results
out=pt_results.jsonl; : > $out
jobs_list=()
for s in pro afk station maniac nit hoarder turtle rusher mazer gambler nomerge; do jobs_list+=("$s standard 5"); done
for s in pro afk nit station; do jobs_list+=("$s casual 4" "$s highroller 4"); done
run(){ timeout 900 node pt.js $1 $2 $3 2>&1 | grep -E "^RESULT|^ERRS" | sed "s/^ERRS/ERRS $1 $2/" >> $out; }
i=0; for j in "${jobs_list[@]}"; do run $j & i=$((i+1)); if (( i % 2 == 0 )); then wait; fi; done; wait
echo done >> $out
