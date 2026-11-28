/* Dungeons out on the Sprawl: rooms and corridors, switches that open the way to the boss, a wall that isn't a wall, and something worth finding behind it. Loads before the Sprawl so their entrances get placed. */
(function () {
  var WD = window.MeridianWorld; if (!WD) return;
  var A = WD.areas, EXTRA = WD.sprawlExtra = WD.sprawlExtra || { sites: [], roads: [], islands: [] };
  function hs(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
  function rng(seed) { var s = seed; return function () { s += 1; return hs(s * 7.13 + seed); }; }

  function build(D) {
    var W = D.w, H = D.h, r = rng(D.seed), g = [];
    for (var y = 0; y < H; y++) { g.push([]); for (var x = 0; x < W; x++) g[y].push('T'); }
    function set(x, y, c) { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) g[y][x] = c; }
    function get(x, y) { return x >= 0 && y >= 0 && x < W && y < H ? g[y][x] : 'T'; }
    // rooms: the first sits at the bottom (the way in); the rest wherever they fit
    var rooms = [], tries = 0;
    rooms.push({ x: 2 + Math.floor(r() * (W - 12)), y: H - 7, w: 7, h: 5 });
    while (rooms.length < D.rooms - 2 && tries++ < 600) {
      var w = 5 + Math.floor(r() * 5), h = 4 + Math.floor(r() * 3), x0 = 2 + Math.floor(r() * (W - w - 4)), y0 = 2 + Math.floor(r() * (H - h - 10));
      if (rooms.some(function (o) { return x0 < o.x + o.w + 2 && x0 + w + 2 > o.x && y0 < o.y + o.h + 2 && y0 + h + 2 > o.y; })) continue;
      rooms.push({ x: x0, y: y0, w: w, h: h });
    }
    function cx(o) { return o.x + Math.floor(o.w / 2); } function cy(o) { return o.y + Math.floor(o.h / 2); }
    rooms.forEach(function (o, i) { for (var yy = o.y; yy < o.y + o.h; yy++) for (var xx = o.x; xx < o.x + o.w; xx++) set(xx, yy, i === 0 ? '.' : (r() < .35 ? ',' : '.')); });
    function corridor(a, b, ch, hidden) {
      var x = cx(a), y = cy(a), x2 = cx(b), y2 = cy(b), flip = r() < .5, path = [];
      if (flip) { while (x !== x2) { path.push([x, y]); x += Math.sign(x2 - x); } while (y !== y2) { path.push([x, y]); y += Math.sign(y2 - y); } }
      else { while (y !== y2) { path.push([x, y]); y += Math.sign(y2 - y); } while (x !== x2) { path.push([x, y]); x += Math.sign(x2 - x); } }
      path.forEach(function (p) { var c = get(p[0], p[1]); if (hidden) { if (c === 'T') set(p[0], p[1], 'h'); } else if (c === 'T' || c === 'h') set(p[0], p[1], ch); });
      return path;
    }
    var main = rooms;
    for (var i = 1; i < main.length; i++) { var best = 0, bd2 = 1e9; for (var j = 0; j < i; j++) { var dd2 = Math.abs(cx(main[i]) - cx(main[j])) + Math.abs(cy(main[i]) - cy(main[j])); if (dd2 < bd2) { bd2 = dd2; best = j; } } corridor(main[best], main[i], ','); }
    // rooms carved into untouched rock, so the only ways in are the ones we make: the boss room behind a gate, the secret room behind a wall
    function solid(x0, y0, w, h) { for (var yy = y0 - 1; yy <= y0 + h; yy++) for (var xx = x0 - 1; xx <= x0 + w; xx++) { if (xx < 1 || yy < 1 || xx > W - 2 || yy > H - 2 || get(xx, yy) !== 'T') return false; } return true; }
    function place(w, h, score) { var bestR = null, bs = -1e9; for (var y1 = 2; y1 < H - h - 2; y1++) for (var x1 = 2; x1 < W - w - 2; x1++) { if (!solid(x1, y1, w, h)) continue; var sc = score({ x: x1, y: y1, w: w, h: h }); if (sc > bs) { bs = sc; bestR = { x: x1, y: y1, w: w, h: h }; } } return bestR; }
    function nearest(o) { var n0 = main[0], d0 = 1e9; main.forEach(function (m) { var dd = Math.abs(cx(m) - cx(o)) + Math.abs(cy(m) - cy(o)); if (dd < d0) { d0 = dd; n0 = m; } }); return [n0, d0]; }
    var boss = place(8, 5, function (o) { return Math.abs(cx(o) - cx(main[0])) + Math.abs(cy(o) - cy(main[0])) - nearest(o)[1] * .6; }) || place(6, 4, function (o) { return Math.abs(cy(o) - cy(main[0])); });
    for (var by0 = boss.y; by0 < boss.y + boss.h; by0++) for (var bx0 = boss.x; bx0 < boss.x + boss.w; bx0++) set(bx0, by0, '.');
    var bp = corridor(nearest(boss)[0], boss, ','), gate = null;
    for (var q = 0; q < bp.length; q++) { var p0 = bp[q]; if (p0[0] >= boss.x && p0[0] < boss.x + boss.w && p0[1] >= boss.y && p0[1] < boss.y + boss.h) { gate = bp[Math.max(0, q - 1)]; break; } }
    if (!gate) gate = bp[bp.length - 1];
    set(gate[0], gate[1], 'G');
    var secret = place(5, 4, function (o) { var nd = nearest(o)[1]; return nd < 7 ? -100 + nd : -nd; });
    if (secret) { for (var sy = secret.y; sy < secret.y + secret.h; sy++) for (var sx = secret.x; sx < secret.x + secret.w; sx++) set(sx, sy, '.'); corridor(nearest(secret)[0], secret, '.', 1); }
    // the way in, from the bottom wall of the first room
    var ex = [cx(rooms[0]), H - 1]; for (var ey = rooms[0].y + rooms[0].h; ey < H - 1; ey++) set(ex[0], ey, '.'); g[H - 1][ex[0]] = 'E';
    // what's in the rooms
    var feats = { caches: {}, logs: {}, sw: [] };
    function spot(o, ch) { for (var t2 = 0; t2 < 60; t2++) { var fx = o.x + 1 + Math.floor(r() * Math.max(1, o.w - 2)), fy = o.y + 1 + Math.floor(r() * Math.max(1, o.h - 2)); if (get(fx, fy) === '.' || get(fx, fy) === ',') { if (ch) set(fx, fy, ch); return [fx, fy]; } } return null; }
    var order = main.slice(1).sort(function (a, b) { return (Math.abs(cx(b) - cx(rooms[0])) + Math.abs(cy(b) - cy(rooms[0]))) - (Math.abs(cx(a) - cx(rooms[0])) + Math.abs(cy(a) - cy(rooms[0]))); });
    for (var s2 = 0; s2 < D.switches && s2 < order.length; s2++) { var sp = spot(order[s2 * Math.max(1, Math.floor(order.length / D.switches)) % order.length], 's'); if (sp) feats.sw.push(sp); }
    D.loot.forEach(function (l, k) { var room = main[1 + (k * 2) % Math.max(1, main.length - 1)], cp = spot(room, 'c'); if (cp) feats.caches[cp[0] + ',' + cp[1]] = l; });
    D.records.forEach(function (rec, k) { var room = main[(k * 3 + 1) % main.length], lp = spot(room, 'o'); if (lp) { var id = D.id + '_r' + k; WD.logs[id] = rec; feats.logs[lp[0] + ',' + lp[1]] = id; } });
    if (secret) { var rp = spot(secret, 'c'); if (rp) feats.caches[rp[0] + ',' + rp[1]] = { relic: D.relic, item: 'gb', n: 1, text: D.relicText }; }
    return { map: g.map(function (row) { return row.join(''); }), exit: ex, boss: [cx(boss), cy(boss)], bossRoom: boss, gate: gate, feats: feats, spawn: [ex[0], H - 2] };
  }

  var DUNGEONS = [
    { id: 'index', name: 'The Sunken Index', sub: 'A search engine that flooded. It is still answering queries nobody asked.', theme: 'vault_w', w: 34, h: 26, rooms: 9, seed: 11, lv: 13, lvMax: 16, switches: 2,
      site: { x: 26, y: 50, kind: 'cave', glow: 1 }, road: 'waterworks', foes: ['worm', 'beetle', 'centipede', 'spider'],
      boss: { id: 'dg_indexer', kind: 'regexhydra', name: 'The Indexer', lv: 17, hp: 1600, atk: [28, 37], xp: 2600, move: 'ranks Vee below everything else', mech: { firewall: 1, summon: ['worm', 'worm'] } },
      intro: ['The water here is made of search results. Millions of them, unread, slowly drowning each other.', 'Something in the middle of the pool lifts its heads. Every head is a query. Every query is: WHO ARE YOU.'],
      win: ['The Indexer sinks back into its results. For the first time in a year, the pool is quiet enough to read.'],
      loot: [{ item: 'kb', n: 4 }, { item: 'av', n: 2 }, { item: 'mb', n: 1 }],
      records: [['A sign, waterlogged: SUNKEN INDEX. QUERIES ANSWERED WHILE YOU WAIT.', 'Underneath, in marker: WE WAITED.'], ['A crawler’s log: Day 300. I keep indexing the same pages. Nobody comes to search them. I index them anyway. That is the job.', 'Day 301. Something has started ranking the crawlers.'], ['A note on the switch housing: TWO VALVES. BOTH OPEN, OR THE INNER CHAMBER STAYS SEALED. — Maintenance']],
      relic: 'lantern', relicText: 'Behind a wall that was never a wall: a room the Indexer never ranked. On a pedestal, a lantern that lights only true things. THE SEARCHLIGHT, and a gigabyte.' },
    { id: 'deadletter', name: 'Dead Letter Office', sub: 'Where undeliverable mail goes to wait. All of it was for Meridian.', theme: 'vault_p', w: 36, h: 26, rooms: 10, seed: 23, lv: 22, lvMax: 26, switches: 3,
      site: { x: 92, y: 58, kind: 'ruin' }, road: 'registry', foes: ['trojan', 'virus', 'spider', 'scorpion'],
      boss: { id: 'dg_rts', kind: 'trojan', name: 'Return to Sender', lv: 27, hp: 2900, atk: [50, 64], xp: 6000, move: 'stamps Vee UNDELIVERABLE', mech: { counter: 3, phase: 1, status: ['sil'] } },
      intro: ['A sorting machine the size of a house. Its belts are still moving. Every letter it touches, it stamps and throws back into the dark.', 'It turns to Vee. It has a stamp ready. It has always had a stamp ready.'],
      win: ['The machine stops. The letters fall, all at once, like snow. Thousands of them. Vee picks one up. It’s addressed to someone in Halflight.', 'He’ll deliver it. He’ll deliver all of them, one day.'],
      loot: [{ item: 'mb', n: 2 }, { item: 'av', n: 3 }, { item: 'kb', n: 5 }, { item: 'mb', n: 2 }],
      records: [['An unopened letter: Dear Mom. They say there are seats left. I saved one for you. Come up as soon as you can.', 'Stamped: RECIPIENT NOT FOUND UPSTREAM.'], ['A postal clerk’s note: Three switches in three wings. Pull all three and the sorting floor opens. Pull none and it doesn’t. Simple. Like the old days.'], ['A letter in a child’s hand: Is the sky up there real? Juni says it isn’t. Please write back.']],
      relic: 'stamp', relicText: 'A sorting chute nobody ever used. At the bottom: a brass stamp that marks things DELIVERED. THE LAST STAMP, and a gigabyte.' },
    { id: 'renderfarm', name: 'The Render Farm', sub: 'Racks of machines that drew the city. Some of them are still drawing it, wrong.', theme: 'vault_r', w: 38, h: 28, rooms: 11, seed: 37, lv: 36, lvMax: 40, switches: 3,
      site: { x: 98, y: 46, kind: 'tower' }, road: 'terminal', foes: ['rootkit', 'kpanic', 'regexhydra', 'hashcoll'],
      boss: { id: 'dg_frame', kind: 'hashcoll', name: 'The Last Frame', lv: 41, hp: 4400, atk: [100, 122], xp: 22000, move: 'renders Vee one frame behind himself', mech: { firewall: 1, phase: 1, counter: 3, status: ['slow', 'daze'] } },
      intro: ['The heat in here is a sound. In the center, a render node has drawn itself a body out of every frame it ever made.', 'It is very beautiful. It is also trying to draw Vee out of the picture.'],
      win: ['The node shuts down mid-frame. Somewhere above, a street in Meridian finishes rendering for the first time in a year.'],
      loot: [{ item: 'mb', n: 4 }, { item: 'gb', n: 1 }, { item: 'av', n: 3 }, { item: 'mb', n: 3 }],
      records: [['A render log: FRAME 2,000,000,001. Subject: Meridian Plaza. Population: 2,000,000.', 'The numbers have not been updated since the Lift. It is still drawing everyone.'], ['A technician’s note: Each wing has a breaker. Throw all three and the core room powers down its shield.'], ['Scratched into a rack: IT DREW ME TWICE ONCE. I DIDN’T LIKE IT.']],
      relic: 'firstlens', relicText: 'Behind the racks, a sealed room still rendering one perfect frame: the Plaza on the day it opened. In the middle, the camera that took it. THE FIRST LENS, and a gigabyte.' },
    { id: 'coldboot', name: 'Cold Boot Vault', sub: 'An island vault where the city keeps the first copy of itself. Frozen. Waiting.', theme: 'vault_c', w: 34, h: 26, rooms: 9, seed: 53, lv: 64, lvMax: 68, switches: 2,
      site: { x: 12, y: 30, kind: 'cave', island: 1, glow: 1 }, foes: ['firmrot', 'eol', 'badblock', 'rogue_gc'],
      boss: { id: 'dg_coldboot', kind: 'eol', name: 'Cold Boot', lv: 70, hp: 5200, atk: [205, 238], xp: 120000, move: 'restarts the world without Vee in it', mech: { firewall: 1, phase: 1, counter: 2, summon: ['firmrot', 'badblock'], status: ['slow', 'sil', 'weak'] } },
      intro: ['In the deepest room, the city’s first boot image sleeps under ice. It wakes when it hears a process it doesn’t recognize.', 'It recognizes nothing. It was made before anyone.'],
      win: ['The vault thaws a little. The first image goes back to sleep, now with one more name in it: Vee.'],
      loot: [{ item: 'gb', n: 1 }, { item: 'gb', n: 1 }, { item: 'av', n: 4 }],
      records: [['Frost on the wall spells out a version number: MERIDIAN 0.0.1. Below it: IN CASE OF EVERYTHING.'], ['A keeper’s note: Two cold switches. Both, or the vault stays shut. Sorry. That’s the point of a vault.'], ['Frozen into the ice: a list of everyone who lived in the city on the first day. It is short. Mara is on it.']],
      relic: 'seed', relicText: 'Under the ice, a seed of the city: the smallest copy of Meridian that can still grow back. THE BOOT SEED, and a gigabyte.' }
  ];

  // relic gear for what's behind the hidden walls
  var G2 = WD.gear;
  G2.lantern = { slot: 'acc', name: 'The Searchlight', hp: 40, crit: .05, desc: 'A lantern that lights only true things. Found where the Indexer never looked.' };
  G2.stamp = { slot: 'weapon', name: 'The Last Stamp', atk: 46, crit: .06, desc: 'Marks things DELIVERED. Hits like a closing argument.' };
  G2.firstlens = { slot: 'armor', name: 'The First Lens', def: 40, hp: 120, desc: 'The camera that took the city’s first picture. Things aimed at you come out of focus.' };
  G2.seed = { slot: 'acc', name: 'The Boot Seed', hp: 300, crit: .08, desc: 'The smallest copy of Meridian that can still grow back. It hums when you’re close to home.' };

  DUNGEONS.forEach(function (D) {
    var B = build(D), sw = B.feats.sw, flag = function (i) { return 'dg_' + D.id + '_sw' + i; };
    var gates = {}; gates[B.gate[0] + ',' + B.gate[1]] = { need: function (G) { return sw.every(function (s, i) { return G.f[flag(i)]; }); }, shut: ['A sealed bulkhead. ' + sw.length + ' switches somewhere in here have to be thrown first.'] };
    A[D.id] = { name: D.name, sub: D.sub, theme: D.theme, tier: D.lv / 6, lv: D.lv, lvMax: D.lvMax, map: B.map, exits: {}, gates: gates, spawn: B.spawn, logs: B.feats.logs, caches: B.feats.caches,
      enc: { tiles: ',.', rate: .07, foes: D.foes, max: 4 }, npcs: [], open: 1, dungeon: 1 };
    sw.forEach(function (s, i) {
      WD.spots[D.id + ':' + s[0] + ',' + s[1]] = function (G) {
        if (G.f[flag(i)]) return G.say('', ['The switch is already thrown. ' + sw.filter(function (q, k) { return G.f[flag(k)]; }).length + ' of ' + sw.length + '.']);
        G.f[flag(i)] = 1; var n = sw.filter(function (q, k) { return G.f[flag(k)]; }).length;
        G.say('', ['Vee throws the switch. Somewhere deep in the ' + D.name.replace(/^The /, '') + ', something heavy moves.', n + ' of ' + sw.length + ' switches thrown.' + (n === sw.length ? ' The bulkhead is open.' : '')]);
      };
    });
    WD.bosses[D.boss.id] = { kind: D.boss.kind, name: D.boss.name, lv: D.boss.lv, hp: D.boss.hp, atk: D.boss.atk, xp: D.boss.xp, move: D.boss.move, sc: 4 };
    WD.bossMech = WD.bossMech || {}; WD.bossMech[D.boss.id] = D.boss.mech;
    var room = B.bossRoom, prev = WD.steps[D.id];
    WD.steps[D.id] = function (G, x, y) {
      if (!G.f['dg_' + D.id] && x >= room.x && x < room.x + room.w && y >= room.y && y < room.y + room.h) {
        return G.scene([{ shake: .5 }, { say: ['', D.intro] }, { flash: .4 }, { boss: D.boss.id }, { say: ['', D.win.concat(['The ' + D.name.replace(/^The /, '') + ' is cleared.'])] }], function () { G.f['dg_' + D.id] = 1; G.note(D.name + ' cleared.'); });
      }
      if (prev) return prev(G, x, y);
    };
    // the entrance out on the Sprawl
    EXTRA.sites.push({ id: D.id, x: D.site.x, y: D.site.y, kind: D.site.kind, glow: D.site.glow, island: D.site.island, custom: 1, to: [B.spawn[0], B.spawn[1]] });
    if (D.road) EXTRA.roads.push([D.road, D.id]);
    A[D.id].dungeonExit = B.exit;
  });
  WD.dungeons = DUNGEONS;
})();
