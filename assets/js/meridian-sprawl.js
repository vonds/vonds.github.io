/* The Sprawl: the open country between Meridian's districts. Walk it, ride across it in the Packet, and find what the city left lying out here. */
(function () {
  var WD = window.MeridianWorld; if (!WD) return;
  var A = WD.areas, W = 120, H = 90;
  function hs(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
  function vn(x, y, s, seed) {   // smooth value noise
    var gx = x / s, gy = y / s, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
    function c(i, j) { return hs(i * 57.13 + j * 311.7 + seed * 91.3); }
    var u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return (c(x0, y0) * (1 - u) + c(x0 + 1, y0) * u) * (1 - v) + (c(x0, y0 + 1) * (1 - u) + c(x0 + 1, y0 + 1) * u) * v;
  }
  function fbm(x, y, seed) { return vn(x, y, 14, seed) * .55 + vn(x, y, 7, seed + 3) * .3 + vn(x, y, 3.5, seed + 7) * .15; }

  // where each district sits out in the country (top-left of its 2x2 marker). Islands need the Packet.
  var SITES = [
    { id: 'plaza', x: 59, y: 45 }, { id: 'commons', x: 49, y: 47 }, { id: 'halflight', x: 47, y: 38 }, { id: 'gardens', x: 60, y: 36 },
    { id: 'concourse', x: 37, y: 32 }, { id: 'undercroft', x: 60, y: 56 }, { id: 'line', x: 44, y: 55 }, { id: 'patchwork', x: 32, y: 59 },
    { id: 'waterworks', x: 33, y: 46 }, { id: 'upper', x: 64, y: 26, tall: 6 }, { id: 'observatory', x: 77, y: 19, kind: 'tower' }, { id: 'bastion', x: 72, y: 46 },
    { id: 'registry', x: 81, y: 54 }, { id: 'quiet', x: 86, y: 41 }, { id: 'terminal', x: 96, y: 39 }, { id: 'anchor', x: 104, y: 29, tall: 8 },
    { id: 'cold', x: 68, y: 66 }, { id: 'stacks', x: 77, y: 73 }, { id: 'ring0', x: 88, y: 78 }, { id: 'margin', x: 23, y: 63 },
    { id: 'unalloc', x: 19, y: 72 }, { id: 'deep', x: 51, y: 70 },
    { id: 'tether', x: 106, y: 9, island: 1, kind: 'tether' }, { id: 'firmware', x: 104, y: 84, island: 1, kind: 'chip' }
  ];
  var ROADS = [['plaza', 'commons'], ['plaza', 'gardens'], ['plaza', 'undercroft'], ['plaza', 'bastion'], ['commons', 'halflight'], ['commons', 'line'], ['halflight', 'gardens'],
    ['halflight', 'concourse'], ['gardens', 'upper'], ['upper', 'observatory'], ['line', 'patchwork'], ['commons', 'waterworks'], ['patchwork', 'margin'], ['margin', 'unalloc'],
    ['undercroft', 'cold'], ['undercroft', 'deep'], ['cold', 'stacks'], ['stacks', 'ring0'], ['bastion', 'registry'], ['bastion', 'quiet'], ['quiet', 'terminal'], ['terminal', 'anchor']];
  var EXTRA = WD.sprawlExtra = WD.sprawlExtra || { sites: [], roads: [], islands: [] };   // dungeons and camps add themselves here (see meridian-dungeons.js)

  var g = []; for (var y = 0; y < H; y++) { g.push([]); for (var x = 0; x < W; x++) g[y].push(','); }
  function set(x, y, c) { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; }
  function get(x, y) { return x >= 0 && y >= 0 && x < W && y < H ? g[y][x] : '~'; }
  // terrain: a ring of data sea, server ridges, circuit forests, corrupted wastes, still lakes
  for (var y1 = 0; y1 < H; y1++) for (var x1 = 0; x1 < W; x1++) {
    var cx = (x1 - 60) / 60, cy = (y1 - 46) / 45, d = Math.sqrt(cx * cx + cy * cy) + (fbm(x1, y1, 9) - .5) * .3;
    var n1 = fbm(x1, y1, 1), n2 = fbm(x1, y1, 2), n3 = fbm(x1, y1, 4), c = ',';
    if (d > .96) c = '~';
    else if (d < .05) c = '.';   // the city's own outskirts: paved and quiet
    else if (n3 > .74 && d > .3) c = '~';
    else if (n1 > .66) c = 'M';
    else if (n1 > .56 || (n2 > .64 && d < .6)) c = 'f';
    else if (d > .58 && n2 > .58) c = 'x';
    g[y1][x1] = c;
  }
  // two rivers of streaming data, running down to the sea
  [[56, 2, 1], [24, 8, -1]].forEach(function (rv, ri) {
    var x = rv[0], len = 0;
    for (var y = rv[1]; y < H && len < 140; y++, len++) {
      x += Math.round(Math.sin(y / 6 + ri * 2) * .9 + rv[2] * .35); x = Math.max(2, Math.min(W - 3, x));
      if (get(x, y) === '~' && y > 20) break;
      set(x, y, 'r'); if (ri === 1 || y % 3) set(x + 1, y, 'r');
    }
  });
  var ALL = SITES.concat(EXTRA.sites);
  var at = {}; ALL.forEach(function (s) { at[s.id] = s; });
  // land around every site; islands get a ring of shore and then sea
  ALL.forEach(function (s) {
    for (var dy = -3; dy <= 4; dy++) for (var dx = -3; dx <= 4; dx++) { var t = get(s.x + dx, s.y + dy), r = Math.abs(dx - .5) + Math.abs(dy - .5); if (r > 6) continue; if (s.island || t === 'M' || t === '~' || t === 'r' || t === 'x') set(s.x + dx, s.y + dy, r < 2.2 ? '.' : ','); }
    if (s.island) for (var a = 0; a < 64; a++) { var ang = a / 64 * Math.PI * 2; for (var rr = 6; rr <= 8; rr++) set(Math.round(s.x + .5 + Math.cos(ang) * rr), Math.round(s.y + .5 + Math.sin(ang) * rr), '~'); }
  });
  // roads, with bridges where they cross water and passes where they cross ridges
  function road(a, b) {
    var s = at[a], t = at[b]; if (!s || !t) return;
    var x = s.x, y = s.y + 2, x2 = t.x, y2 = t.y + 2, mid = (a.length + b.length) % 2;
    function lay(px, py) { var c = get(px, py); if (c === 'E') return; set(px, py, '='); }
    if (mid) { while (x !== x2) { lay(x, y); x += Math.sign(x2 - x); } while (y !== y2) { lay(x, y); y += Math.sign(y2 - y); } }
    else { while (y !== y2) { lay(x, y); y += Math.sign(y2 - y); } while (x !== x2) { lay(x, y); x += Math.sign(x2 - x); } }
    lay(x, y);
  }
  ROADS.concat(EXTRA.roads).forEach(function (r) { road(r[0], r[1]); });
  // the site markers themselves, and the step in front of each
  var exits = {}, sites = [];
  ALL.forEach(function (s) {
    for (var j = 0; j < 2; j++) for (var i = 0; i < 2; i++) set(s.x + i, s.y + j, 'E');
    if (get(s.x, s.y + 2) !== '=') set(s.x, s.y + 2, '.'); if (get(s.x + 1, s.y + 2) !== '=') set(s.x + 1, s.y + 2, '.');
    sites.push(s);
  });
  // secret islands out in the sea, only reachable by Packet
  var ISLES = [{ x: 8, y: 10, item: 'gb', n: 1, text: 'Half-buried in the sand of an island nobody mapped: a gigabyte of clean data, wrapped in an old flag.' }, { x: 112, y: 58, item: 'gb', n: 2, text: 'A message in a bottle. No message. Just two gigabytes and a note: FOR WHOEVER GETS THIS FAR.' },
    { x: 10, y: 44, item: 'mb', n: 4, text: 'A lighthouse that lights nothing. At its foot, a cache: four megabytes and a keeper’s log that just says WAITING.' }, { x: 60, y: 86, item: 'gb', n: 1, text: 'On a sandbar at the bottom of the world: a gigabyte, and someone’s initials scratched into a rock beside a heart.' }];
  var caches = {};
  ISLES.forEach(function (o) { for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) if (Math.abs(dx) + Math.abs(dy) <= 3) set(o.x + dx, o.y + dy, Math.abs(dx) + Math.abs(dy) <= 1 ? '.' : ','); set(o.x, o.y, 'c'); caches[o.x + ',' + o.y] = { item: o.item, n: o.n, text: o.text }; });
  // hidden caches out in the open country too, tucked in forests and behind ridges
  var LOOSE = [[30, 24, 'mb', 2], [70, 12, 'mb', 3], [92, 64, 'gb', 1], [14, 54, 'mb', 3], [46, 80, 'mb', 2], [100, 50, 'gb', 1], [40, 16, 'kb', 6], [84, 30, 'mb', 2]];
  LOOSE.forEach(function (c) { set(c[0], c[1], 'c'); set(c[0], c[1] + 1, get(c[0], c[1] + 1) === 'M' ? ',' : get(c[0], c[1] + 1)); caches[c[0] + ',' + c[1]] = { item: c[2], n: c[3] }; });

  // the harbor: where Vee gets the Packet
  var HARBOR = { x: 44, y: 64 };
  for (var hy = -2; hy <= 2; hy++) for (var hx = -3; hx <= 3; hx++) set(HARBOR.x + hx, HARBOR.y + hy, hy === 2 ? '~' : '.');
  for (var hr = 57; hr < HARBOR.y; hr++) set(45, hr, '=');

  var spawn = [at.plaza.x, at.plaza.y + 2];
  A.sprawl = {
    name: 'The Sprawl', sub: 'The country between districts. Bigger than anyone remembered.', theme: 'sprawl', tier: 1, lv: 1, lvMax: 3, open: 1,
    map: g.map(function (r) { return r.join(''); }),
    exits: exits, sites: sites, caches: caches, spawn: spawn, harbor: HARBOR,
    enc: { tiles: ',fx', rate: .075, foes: ['beetle', 'bytebug', 'worm', 'moth'], max: 4 },
    npcs: [
      { id: 'ada', p: { hair: 'beanie', body: 'coat', skin: '#4a2e1e', top: '#3a3a44', gray: 1 }, x: HARBOR.x - 2, y: HARBOR.y, name: 'Ada', look: 'echo', h: 13, solid: 1, still: 1 },
      { id: 'cartog', p: { hair: 'long', body: 'coat', glasses: 1, skin: '#c89a78', top: '#5a5a62' }, x: at.plaza.x + 3, y: at.plaza.y + 3, name: 'The Cartographer', look: 'echo', h: 13, solid: 1 },
      { id: 'pilgrim', p: { hair: 'hood', skin: '#6b4a32', top: '#2e2e36' }, x: 88, y: 46, name: 'Pilgrim', look: 'echo', h: 13 },
      { id: 'surveyor', p: { hair: 'cap', body: 'apron', skin: '#8a5a3c', top: '#4a5a62' }, x: 30, y: 66, name: 'Surveyor', look: 'echo', h: 13 }
    ],
    // bugs out here are as strong as the nearest district's, and stronger in the corrupted wastes
    zone: function (x, y, tileCh) {
      var best = null, bd = 1e9;
      SITES.forEach(function (s) { var a2 = A[s.id]; if (!a2 || !a2.enc || s.island) return; var dd = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y); if (dd < bd) { bd = dd; best = a2; } });
      if (!best) return null;
      var bump = tileCh === 'x' ? 3 : tileCh === 'f' ? 1 : 0;
      return { lv: best.lv + bump, lvMax: (best.lvMax || best.lv) + bump, foes: best.enc.foes, tier: best.tier || 1 };
    }
  };

  // every district gets a way out to the Sprawl, cut through its outer wall on the side that faces the country
  var BLOCK = 'TX~pdsocFlGMr';
  function gateFor(id, s) {
    var a = A[id]; if (!a || !a.map || !a.spawn) return;
    var rows = a.map.map(function (r) { return r.split(''); }), h = rows.length, w = rows[0].length;
    (a.blds || []).forEach(function (b) { if (!b.w) return; for (var yy = b.y; yy < b.y + b.h; yy++) for (var xx = b.x; xx < b.x + b.w; xx++) if (rows[yy]) rows[yy][xx] = 'X'; });
    var ex = a.exits || {}, seen = {}, q = [[a.spawn[0], a.spawn[1]]]; seen[a.spawn[0] + ',' + a.spawn[1]] = 1;
    var npc = {}; (a.npcs || []).forEach(function (n) { npc[n.x + ',' + n.y] = 1; });
    while (q.length) { var p = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (o) { var nx = p[0] + o[0], ny = p[1] + o[1], k = nx + ',' + ny; if (seen[k] || nx < 0 || ny < 0 || nx >= w || ny >= h) return; var c = rows[ny][nx]; if (BLOCK.indexOf(c) >= 0 || ex[k] || npc[k]) return; seen[k] = 1; q.push([nx, ny]); }); }
    var px0 = at.plaza.x, py0 = at.plaza.y, vx = s.x - px0, vy = s.y - py0; if (!vx && !vy) { vx = 1; vy = 1; }
    var best = null, bs = -1e9;
    for (var yy2 = 0; yy2 < h; yy2++) for (var xx2 = 0; xx2 < w; xx2++) {
      if (!(xx2 === 0 || yy2 === 0 || xx2 === w - 1 || yy2 === h - 1)) continue;
      if ((rows[yy2][xx2] !== 'T' && rows[yy2][xx2] !== '~') || ex[xx2 + ',' + yy2]) continue;
      var inX = xx2 === 0 ? 1 : xx2 === w - 1 ? w - 2 : xx2, inY = yy2 === 0 ? 1 : yy2 === h - 1 ? h - 2 : yy2;
      if ((xx2 === 0 || xx2 === w - 1) && (yy2 === 0 || yy2 === h - 1)) continue;
      if (!seen[inX + ',' + inY]) continue;
      var sc = ((xx2 - w / 2) / w) * vx + ((yy2 - h / 2) / h) * vy;
      if (sc > bs) { bs = sc; best = [xx2, yy2, inX, inY]; }
    }
    if (!best) for (var yy3 = 1; yy3 < h - 1; yy3++) for (var xx3 = 1; xx3 < w - 1; xx3++) {   // a platform over the void: open a gate in the void itself, beside the walkway
      if (rows[yy3][xx3] !== '~' || ex[xx3 + ',' + yy3]) continue;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (o) { var ix = xx3 + o[0], iy = yy3 + o[1]; if (!seen[ix + ',' + iy] || rows[iy][ix] === '=') return; var sc2 = ((xx3 - w / 2) / w) * vx + ((yy3 - h / 2) / h) * vy; if (sc2 > bs) { bs = sc2; best = [xx3, yy3, ix, iy]; } });
    }
    if (!best) return;
    rows = a.map.map(function (r) { return r.split(''); }); rows[best[1]][best[0]] = 'E'; a.map = rows.map(function (r) { return r.join(''); });
    a.exits = a.exits || {}; a.exits[best[0] + ',' + best[1]] = ['sprawl', s.x, s.y + 2];
    a.sprawlGate = [best[0], best[1]];
    for (var j = 0; j < 2; j++) for (var i = 0; i < 2; i++) exits[(s.x + i) + ',' + (s.y + j)] = [id, best[2], best[3], { site: id }];
  }
  ALL.forEach(function (s) { if (s.custom) { for (var j = 0; j < 2; j++) for (var i = 0; i < 2; i++) exits[(s.x + i) + ',' + (s.y + j)] = [s.id, s.to[0], s.to[1], { site: s.id }]; var da = A[s.id]; if (da && da.dungeonExit) da.exits[da.dungeonExit[0] + ',' + da.dungeonExit[1]] = ['sprawl', s.x, s.y + 2]; } else gateFor(s.id, s); });

  /* ---------- talking out in the country ---------- */
  WD.talk.ada = function (G) {
    if (G.f.packet) return G.say('Ada', ['She’s yours. Treat her gently and she’ll carry you anywhere there’s water.', 'Press A on open ground to board, and again on a shore to step off.']);
    if (G.save.lvl < 24) return G.say('Ada', ['This is the Harbor. Was, anyway. Nothing sails now.', 'I’ve got one hull left. The Packet. But the sea out there eats weak processes. Come back when you’re level 24, and I’ll hand you the tiller.']);
    G.say('Ada', ['Level ' + G.save.lvl + '. Good. You’ll survive the crossing.', 'This is the Packet. It doesn’t float on water, it floats on data: rides the stream like a message nobody can drop.', 'Islands out there nobody’s seen since the Lift. The tether rises out of the north sea. Something hums under the south one.', 'She’s yours.'], null, function () {
      G.f.packet = 1; G.note('Got the Packet.');
      G.say('', ['VEE GOT THE PACKET.', 'On the Sprawl, press A on open ground to board it. It crosses the data sea and the streams, twice as fast, and no bug can catch it. Press A again by a shore to step off.']);
    });
  };
  WD.talk.cartog = function (G) {
    var n = SITES.filter(function (s) { return G.save.seen[s.id]; }).length;
    G.say('The Cartographer', ['I’m mapping the Sprawl. All of it. Again.', 'The country out here is bigger than the city ever let on. Every district has a gate in its outer wall that opens onto it.', 'You’ve set foot in ' + n + ' of the ' + SITES.length + ' places I’ve marked. The ones you haven’t, their gates won’t open for you from out here. Find your way in from the city first.', 'Stay on the roads if you’re hurt. The bugs don’t like the roads.']);
  };
  WD.talk.pilgrim = function (G) { G.say('Pilgrim', ['I’m walking to the tether. Everyone who walks that way says they’ll climb it.', 'There’s sea between here and there. I keep walking anyway. Maybe it’ll dry up.']); };
  WD.talk.surveyor = function (G) { G.say('Surveyor', ['The wastes out west are corrupted. Bugs there are three levels meaner than you’d think.', 'The forests are worse than the plains, too. One level. Doesn’t sound like much until it is.']); };
  WD.sprawlSites = SITES; WD.sprawlAll = ALL;
})();
