global.window = {}; require(process.argv[2]);
const WD = window.MeridianWorld; let bad = 0, total = 0;
for (const [id, A] of Object.entries(WD.areas)) {
  const rows = A.map.map(r => r.split('')), h = rows.length, w = rows[0].length;
  rows.forEach((r, y) => { if (r.length !== w) { console.log(id, 'row', y, 'len', r.length); bad++; } });
  (A.blds || []).forEach(b => { if (!b.w) return; for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) { if (rows[y][x] !== '.' && rows[y][x] !== ',' && !(b.kind === 'train' && rows[y][x] === '~')) { console.log(id, 'bld', b.kind, 'overlaps', rows[y][x], 'at', x, y); bad++; } rows[y][x] = 'X'; } if (b.door != null) rows[b.doorTop ? b.y : b.y + b.h - 1][b.x + b.door] = 'd'; });
  total += w * h;
  const npcs = new Set((A.npcs || []).map(n => n.x + ',' + n.y));
  const wag = new Set(); (A.wagon || []).forEach(s => { wag.add(s[0] + ',' + s[1]); wag.add((s[0] + 1) + ',' + s[1]); });
  const solid = (x, y) => { const t = (rows[y] || [])[x]; return t === undefined || 'TX~pdsocFl'.includes(t) || npcs.has(x + ',' + y); };
  const sp = A.spawn, seen = new Set([sp.join(',')]), q = [sp];
  if (solid(sp[0], sp[1])) { console.log(id, 'spawn solid'); bad++; }
  while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (seen.has(k) || solid(nx, ny)) continue; seen.add(k); q.push([nx, ny]); } }
  const reach = (x, y) => [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
  const need = [];
  Object.keys(A.exits || {}).forEach(k => need.push(['exit', k, true]));
  Object.keys(A.gates || {}).forEach(k => need.push(['gate', k, false]));
  Object.keys(A.logs || {}).forEach(k => need.push(['log', k, false]));
  Object.keys(A.caches || {}).forEach(k => need.push(['cache', k, false]));
  (A.npcs || []).forEach(n => need.push(['npc ' + n.id, n.x + ',' + n.y, false]));
  (A.wagon || []).forEach((s, i) => need.push(['wagon' + i, s.join(','), false]));
  (A.blds || []).forEach(b => { if (b.door != null) need.push(['door ' + b.kind, (b.x + b.door) + ',' + (b.doorTop ? b.y : b.y + b.h - 1), false]); });
  rows.forEach((r, y) => r.forEach((t, x) => { if (t === 's') need.push(['sign', x + ',' + y, false]); }));
  need.forEach(([what, k, walk]) => { const [x, y] = k.split(',').map(Number); const ok = walk ? seen.has(k) : reach(x, y); if (!ok) { console.log(id, 'UNREACHABLE', what, k); bad++; } });
  // exits must land on walkable tiles of the target area
  Object.entries(A.exits || {}).concat(Object.entries(A.gates || {}).filter(([k, g]) => g.to).map(([k, g]) => [k, g.to])).forEach(([k, to]) => { const T = WD.areas[to[0]]; const t = T.map[to[2]][to[1]]; if (!'.=,ED'.includes(t)) { console.log(id, k, '->', to.join(','), 'lands on', t); bad++; } });
  console.log(id.padEnd(11), w + 'x' + h, 'reachable', seen.size);
}
console.log('total tiles', total, '(was 220, x' + (total / 220).toFixed(1) + ')', bad ? bad + ' PROBLEMS' : 'all good');
