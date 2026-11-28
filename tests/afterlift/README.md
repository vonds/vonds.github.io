# Afterlift tests

Automated playthroughs that drive the game in headless Chrome through `window.__quest` (a small test hook in `rpg.js`).
Each script prints `errors []` when it finishes cleanly.

| Script | What it plays |
|---|---|
| `play.py` | Act 1, start to the tether ending |
| `act2.py` / `act3.py` | Upstream, Corvin, the Sorter; the Rack, the Wipe and the console finale |
| `crew.py` | All ten Continuity Crew bosses |
| `arc.py` | All eight companion stories (`LAST=1` takes the second choice everywhere) |
| `ves.py` / `scn.py` | Corvin's kiosk, the four Ves scenes, the tether climb and Upstream arrival |
| `dgt.py` | Enters a dungeon from the Sprawl, throws the switches, clears the boss |
| `sprawl.py` | Walks out onto the Sprawl and rides the Packet |
| `mech.py` | A boss fight, logging statuses and boss mechanics |
| `validate.js` / `dungeons.js` | Static checks: every area reachable; every dungeon switch, cache and secret reachable |

Run everything: `sh tests/afterlift/run_all.sh`
