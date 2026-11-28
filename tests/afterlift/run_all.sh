#!/bin/sh
# Plays Afterlift end to end in headless Chrome and checks nothing breaks.
# Needs: python3, `pip install playwright && playwright install chromium`, node.
# Usage: sh tests/afterlift/run_all.sh   (from the repo root). Set CHROME=/path/to/chrome to use a system Chrome.
set -e
cd "$(dirname "$0")/../.."
(python3 -m http.server 8771 >/dev/null 2>&1 &) ; sleep 1
export OUT=${OUT:-/tmp}
node tests/afterlift/validate.js "$PWD/assets/js/meridian-world.js" | tail -1
node tests/afterlift/dungeons.js "$PWD/assets/js" | grep -v '^T' | head -12
for t in play act2 act3 crew arc ves scn dgt sprawl mech; do
  printf '%-8s ' "$t"; timeout 900 python3 "tests/afterlift/$t.py" 2>&1 | tail -1
done
