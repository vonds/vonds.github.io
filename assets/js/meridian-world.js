/* Meridian: the world. Districts, people, logs, quests and endings.
   Everything here is data and dialogue; the engine lives in rpg.js and the art in meridian-art.js. */
(function () {
  'use strict';

  /* ---------- a tiny map builder ---------- */
  function grid(w, h, fill) {
    var r = []; for (var y = 0; y < h; y++) { r.push([]); for (var x = 0; x < w; x++) r[y].push(fill || '.'); }
    var m = {
      w: w, h: h, rows: r,
      set: function (x, y, c) { if (y >= 0 && y < h && x >= 0 && x < w) r[y][x] = c; return m; },
      rect: function (x, y, ww, hh, c) { for (var j = 0; j < hh; j++) for (var i = 0; i < ww; i++) m.set(x + i, y + j, c); return m; },
      border: function (c) { m.rect(0, 0, w, 1, c || 'T'); m.rect(0, h - 1, w, 1, c || 'T'); m.rect(0, 0, 1, h, c || 'T'); m.rect(w - 1, 0, 1, h, c || 'T'); return m; },
      h: function (y, x0, x1, c) { for (var x = x0; x <= x1; x++) m.set(x, y, c); return m; },
      v: function (x, y0, y1, c) { for (var y = y0; y <= y1; y++) m.set(x, y, c); return m; },
      pts: function (list, c) { list.forEach(function (p) { m.set(p[0], p[1], c); }); return m; },
      out: function () { return r.map(function (row) { return row.join(''); }); }
    };
    return m;
  }

  /* ---------- the architect's logs ---------- */
  var LOGS = {
    F1: ['LOG 0001. M. Quell, chief architect.', 'Meridian opens today. Two million people just moved into a city that doesn’t exist. Every one of them can afford to live here. I made sure of that.'],
    F2: ['LOG 0114. M. Quell.', 'The Board wants a newer world. They call it Upstream. They call this one legacy.', 'I asked what happens to the people who live in legacy. The room went quiet the way rooms do when the decision was made before you arrived.'],
    F3: ['LOG 0187. M. Quell.', 'Lift tickets went on sale today. Forty thousand seats for two million residents.', 'The price was announced as an act of generosity.'],
    F4: ['LOG 0190. M. Quell.', 'Found a work order buried in the Lift spec. RECLAIMER: mark unused memory blocks for transfer Upstream.', '“Unused” is defined as: not accessed by a ticketed account in thirty days.', 'I read it twice. It doesn’t mean empty. It means us.'],
    F5: ['LOG 0201. M. Quell.', 'The gardens are losing their textures. The Reclaimer takes the beautiful things first.', 'Beautiful compresses well.'],
    F6: ['LOG 0215. M. Quell.', 'I can’t stop this from inside the Board. So I’m writing something that can’t be stopped either.', 'Small. Stubborn. It will only know one thing at first: who it is.'],
    F7: ['LOG 0222. M. Quell.', 'Asked Ash to hold the east blocks as long as Sentinel can.', 'Ash said, “Hold them for who?” I said, “For whoever’s still here.” Ash said, “Then I’m holding them for you.”'],
    F8: ['LOG 0230. M. Quell.', 'My ticket came. They want me Upstream, designing the next one.', 'I gave it to a woman in the Commons with a little girl. One ticket, one seat. She cried and promised she’d send for her daughter.', 'They always promise that.'],
    F9: ['LOG 0236. M. Quell.', 'The Quiet reached the east wall tonight. I can hear the Lift from my window now.', 'It sounds like breathing.'],
    F10: ['LOG 0241. M. Quell.', 'If you’re reading this, I’ve been marked obsolete. That’s their word for it.', 'Vee. The first thing I taught you was whoami. You think the answer is “maintenance.”', 'Look again when this is over. I didn’t build you to keep the city running. I built you to live in it.']
  };
  var LOG_ORDER = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'];

  /* ---------- the bosses ---------- */
  var BOSSES = {
    eraser:    { kind: 'worm',      name: 'The Eraser',      hp: 260,  atk: [8, 12],  xp: 140, move: 'chews a name out of the ledger', sc: 4 },
    moth:      { kind: 'moth',      name: 'Lantern Moth',    hp: 380,  atk: [11, 15], xp: 220, move: 'drinks the light around Vee', sc: 4 },
    panic:     { kind: 'centipede', name: 'Kernel Panic',    hp: 520,  atk: [13, 18], xp: 320, move: 'dumps a hundred stack traces at once', sc: 3 },
    rootkit:   { kind: 'spider',    name: 'Rootkit',         hp: 700,  atk: [16, 22], xp: 450, move: 'escalates its privileges', sc: 4 },
    reclaimer: { kind: 'scorpion',  name: 'The Reclaimer',   hp: 980,  atk: [20, 27], xp: 0,   move: 'marks part of Vee as unused', sc: 4 }
  };

  /* ---------- the landmarks ---------- */
  var ANCHORS = [
    { id: 'spire',   name: 'The Spire',          project: 'Black Signal' },
    { id: 'archive', name: 'The Archive',        project: 'Digital Resource Map' },
    { id: 'ledger',  name: 'The Ledger Hall',    project: 'DEEDS' },
    { id: 'wagon',   name: 'The Traveling Archive', project: 'The Traveling Archive' },
    { id: 'exit0',   name: 'The Proving Rooms',  project: 'exit_0' },
    { id: 'keep',    name: 'The Keep',           project: 'Sentinel' }
  ];

  /* ---------- the districts ---------- */
  var A = {};

  /* THE PLAZA */
  A.plaza = {
    name: 'Meridian Plaza', sub: 'Where the city still remembers its own name.', theme: 'plaza', tier: 1, lv: 1, lvMax: 3,
    map: (function () {
      var m = grid(32, 20).border();
      m.rect(1, 9, 30, 2, '='); m.rect(15, 1, 2, 18, '=');
      m.pts([[0, 9], [0, 10], [15, 0], [16, 0]], 'E'); m.pts([[15, 19], [16, 19]], 'D'); m.pts([[31, 9], [31, 10]], 'G');
      m.rect(13, 12, 6, 3, '.'); m.rect(14, 12, 4, 2, 'F');
      m.rect(7, 15, 7, 4, ','); m.rect(19, 15, 7, 4, ',');
      m.pts([[6, 8], [12, 8], [19, 8], [25, 8], [6, 11], [25, 11]], 'l');
      m.set(12, 6, 's'); m.set(20, 5, 'o'); m.set(29, 17, 'c'); m.set(3, 18, 'c');
      return m.out();
    })(),
    blds: [
      { x: 3, y: 1, w: 6, h: 6, kind: 'spire', door: 3, sign: 'BLACK SIGNAL', rise: 4 },
      { x: 22, y: 1, w: 7, h: 6, kind: 'archive', door: 3, sign: 'ARCHIVE', rise: 2 },
      { x: 2, y: 12, w: 4, h: 5, kind: 'tower', door: 1, seed: 3, rise: 3 },
      { x: 26, y: 12, w: 4, h: 5, kind: 'tower', door: 2, seed: 7, rise: 3 },
      { x: 9, y: 1, w: 4, h: 4, kind: 'home', seed: 11, rise: 1, door: 2 },
      { x: 18, y: 1, w: 3, h: 3, kind: 'home', seed: 5, rise: 1 }
    ],
    exits: { '0,9': ['commons', 34, 9], '0,10': ['commons', 34, 10], '15,0': ['gardens', 15, 20], '16,0': ['gardens', 16, 20], '15,19': ['undercroft', 15, 1], '16,19': ['undercroft', 16, 1] },
    gates: { '31,9': { to: ['bastion', 1, 9] }, '31,10': { to: ['bastion', 1, 10] } },
    enc: { tiles: ',', rate: .14, foes: ['beetle', 'bytebug', 'worm', 'moth'], max: 3 },
    spawn: [6, 7],
    logs: { '20,5': 'F1' },
    caches: { '29,17': { item: 'byte', n: 2 }, '3,18': { item: 'bit', n: 3 } },
    npcs: [
      { id: 'wren', p: { hair: 'bun', body: 'suit', skin: '#8d5a3a', top: '#3a3a44' }, x: 19, y: 7, name: 'Wren', look: 'holo' },
      { id: 'sweeper', p: { hair: 'cap', body: 'apron', skin: '#5a3824', top: '#6a6a58', gray: 1 }, x: 9, y: 12, name: 'The Sweeper', look: 'echo', h: 13, hair: 1 }
    ]
  };

  /* THE COMMONS */
  A.commons = {
    name: 'The Commons', sub: 'Everyone traded here. Some of them still think they are.', theme: 'commons', tier: 1.4, lv: 3, lvMax: 5,
    map: (function () {
      var m = grid(36, 20).border();
      m.rect(1, 9, 34, 2, '='); m.rect(8, 1, 2, 8, '='); m.rect(26, 11, 2, 8, '=');
      m.pts([[35, 9], [35, 10]], 'E'); m.pts([[8, 0], [9, 0]], 'E');
      m.rect(11, 13, 13, 6, ',');
      m.pts([[4, 8], [13, 8], [22, 8], [31, 8], [4, 11], [31, 11]], 'l');
      m.set(11, 8, 's'); m.set(3, 4, 'o'); m.set(34, 18, 'c'); m.set(2, 18, 'c');
      return m.out();
    })(),
    blds: [
      { x: 12, y: 1, w: 10, h: 6, kind: 'ledger', door: 5, sign: 'LEDGER HALL', rise: 2 },
      { x: 1, y: 12, w: 3, h: 2, kind: 'stall', seed: 1, door: 1, sign: 'LOST AND FOUND' }, { x: 5, y: 12, w: 3, h: 2, kind: 'stall', seed: 2 },
      { x: 1, y: 16, w: 3, h: 2, kind: 'stall', seed: 3 }, { x: 5, y: 16, w: 3, h: 2, kind: 'stall', seed: 4 },
      { x: 29, y: 1, w: 5, h: 6, kind: 'tower', door: 2, seed: 9, rise: 3 },
      { x: 29, y: 13, w: 5, h: 5, kind: 'tower', seed: 13, rise: 2 },
      { x: 23, y: 2, w: 4, h: 4, kind: 'home', seed: 2, rise: 1 }
    ],
    exits: { '35,9': ['plaza', 1, 9], '35,10': ['plaza', 1, 10], '8,0': ['halflight', 8, 20], '9,0': ['halflight', 9, 20] },
    enc: { tiles: ',', rate: .16, foes: ['beetle', 'bytebug', 'worm', 'spider', 'moth'], max: 4 },
    spawn: [33, 9],
    logs: { '3,4': 'F2' },
    caches: { '34,18': { item: 'byte', n: 1 }, '2,18': { item: 'kb', n: 1 } },
    npcs: [
      { id: 'okoye', p: { hair: 'bun', body: 'suit', glasses: 1, skin: '#3e2416', top: '#24242a' }, x: 19, y: 7, name: 'Okoye', look: 'echo', h: 14, hair: 2, solid: 1 },
      { id: 'lio', p: { hair: 'puffs', body: 'dress', skin: '#6b3f26', top: '#9a9aa6' }, x: 25, y: 8, name: 'Lio', look: 'kid' },
      { id: 'bram', p: { hair: 'bald', body: 'apron', skin: '#c49a7a', top: '#5a4a3a', beard: 1 }, x: 4, y: 14, name: 'Bram', look: 'echo', h: 13, hair: 0 }
    ]
  };

  /* HALFLIGHT */
  A.halflight = {
    name: 'Halflight', sub: 'Every window, a view. Every view, included.', theme: 'halflight', tier: 1.8, lv: 5, lvMax: 7,
    map: (function () {
      var m = grid(34, 22).border();
      m.rect(1, 10, 32, 2, '='); m.rect(8, 12, 2, 9, '='); m.rect(26, 1, 2, 9, '=');
      m.pts([[8, 21], [9, 21]], 'E'); m.pts([[33, 10], [33, 11]], 'E');
      m.rect(11, 19, 14, 2, ','); m.rect(2, 19, 5, 2, ','); m.rect(29, 13, 4, 6, ',');
      m.pts([[5, 9], [14, 9], [22, 9], [30, 9], [5, 12], [22, 12]], 'l');
      m.set(6, 9, 's'); m.set(30, 12, 'o'); m.set(10, 13, 'o'); m.set(32, 20, 'c'); m.set(1, 13, 'c');
      return m.out();
    })(),
    blds: [
      { x: 2, y: 2, w: 4, h: 6, kind: 'tower', seed: 21, rise: 4, door: 1 },
      { x: 11, y: 2, w: 5, h: 6, kind: 'tower', seed: 22, rise: 5 },
      { x: 18, y: 1, w: 4, h: 7, kind: 'tower', seed: 23, rise: 4, door: 2 },
      { x: 29, y: 2, w: 4, h: 6, kind: 'tower', seed: 24, rise: 3 },
      { x: 2, y: 14, w: 4, h: 4, kind: 'home', seed: 25, rise: 1 },
      { x: 12, y: 13, w: 5, h: 5, kind: 'tower', seed: 26, rise: 3, door: 2 },
      { x: 19, y: 13, w: 5, h: 5, kind: 'tower', seed: 27, rise: 3 }
    ],
    exits: { '8,21': ['commons', 8, 1], '9,21': ['commons', 9, 1], '33,10': ['gardens', 1, 10], '33,11': ['gardens', 1, 11] },
    enc: { tiles: ',', rate: .17, foes: ['moth', 'spider', 'virus', 'bytebug', 'worm'], max: 5 },
    spawn: [8, 19],
    logs: { '30,12': 'F3', '10,13': 'F4' },
    caches: { '32,20': { item: 'page', n: 1, text: 'A torn page, columns of names and debts: BRAM’S LEDGER, page 212.' }, '1,13': { item: 'kb', n: 1 } },
    npcs: [
      { id: 'dez', p: { hair: 'short', skin: '#7a5034', top: '#3a3a42' }, x: 7, y: 9, name: 'Dez', look: 'echo', h: 14, hair: 3 },
      { id: 'jun', p: { hair: 'long', skin: '#d0a888', top: '#6a6a74' }, x: 24, y: 12, name: 'Jun', look: 'echo', h: 13, hair: 1, fade: .45 },
      { id: 'ana', p: { hair: 'long', body: 'dress', skin: '#a77b5a', top: '#c8c8d0' }, x: 25, y: 12, name: 'Recording', look: 'echo', h: 13, hair: 2, fade: .2, flick: 1 },
      { id: 'teodor', p: { hair: 'bald', body: 'coat', glasses: 1, skin: '#b08060', top: '#4a4a40', gray: 1, beard: 1 }, x: 17, y: 9, name: 'Teodor', look: 'echo', h: 12, hair: 4 }
    ]
  };

  /* THE GLASSHOUSE */
  A.gardens = {
    name: 'The Glasshouse', sub: 'Trees grown from numbers. The numbers are being collected.', theme: 'gardens', tier: 2.2, lv: 7, lvMax: 9,
    map: (function () {
      var m = grid(36, 22).border();
      m.rect(1, 10, 34, 2, '='); m.rect(15, 12, 2, 9, '='); m.rect(30, 2, 2, 8, '=');
      m.pts([[15, 21], [16, 21]], 'E'); m.pts([[0, 10], [0, 11]], 'E');
      m.rect(21, 4, 7, 4, '~'); m.rect(22, 3, 5, 1, '~'); m.rect(22, 8, 4, 1, '~');
      m.rect(19, 13, 9, 6, ','); m.rect(2, 2, 9, 5, ',');
      m.pts([[3, 8], [6, 7], [12, 3], [13, 6], [17, 2], [18, 6], [2, 13], [2, 18], [7, 19], [12, 13], [12, 17], [29, 13], [33, 14], [32, 18], [29, 19], [24, 1], [20, 2], [34, 5], [34, 8], [10, 19], [18, 19], [13, 15]], 'p');
      m.set(17, 12, 's'); m.set(33, 2, 'o'); m.set(2, 19, 'c'); m.set(27, 9, 'c');
      return m.out();
    })(),
    blds: [
      { x: 3, y: 13, w: 9, h: 5, kind: 'glasshouse', door: 4, rise: 2 }
    ],
    exits: { '15,21': ['plaza', 15, 1], '16,21': ['plaza', 16, 1], '0,10': ['halflight', 32, 10], '0,11': ['halflight', 32, 11] },
    enc: { tiles: ',', rate: .18, foes: ['moth', 'beetle', 'centipede', 'spider', 'virus'], max: 6 },
    spawn: [15, 19],
    logs: { '33,2': 'F5' },
    caches: { '2,19': { item: 'kb', n: 2 }, '27,9': { item: 'mb', n: 1 } },
    wagon: [[7, 9], [27, 2], [31, 16]],
    npcs: [
      { id: 'tamsin', p: { hair: 'cap', body: 'apron', skin: '#5a3a24', top: '#4a5448' }, x: 12, y: 8, name: 'Tamsin', look: 'echo', h: 13, hair: 5, solid: 1 }
    ]
  };

  /* THE UNDERCROFT */
  A.undercroft = {
    name: 'The Undercroft', sub: 'Every failure in the city ends up down here eventually.', theme: 'undercroft', tier: 2.8, lv: 10, lvMax: 12,
    map: (function () {
      var m = grid(38, 22).border();
      m.pts([[15, 0], [16, 0]], 'D');
      m.rect(15, 1, 2, 2, '=');
      m.rect(1, 14, 36, 1, '~'); m.rect(9, 14, 2, 1, '='); m.rect(27, 14, 2, 1, '=');
      m.rect(2, 5, 9, 2, ','); m.rect(2, 9, 9, 2, ','); m.rect(25, 5, 11, 2, ','); m.rect(25, 9, 11, 2, ',');
      m.rect(1, 20, 36, 1, ',');
      m.set(35, 2, 'o'); m.set(2, 19, 'c'); m.set(36, 12, 'c'); m.set(17, 12, 's');
      return m.out();
    })(),
    blds: [
      { x: 2, y: 3, w: 9, h: 2, kind: 'rack', seed: 1 }, { x: 2, y: 7, w: 9, h: 2, kind: 'rack', seed: 2 }, { x: 2, y: 11, w: 9, h: 2, kind: 'rack', seed: 3 },
      { x: 25, y: 3, w: 11, h: 2, kind: 'rack', seed: 4 }, { x: 25, y: 7, w: 11, h: 2, kind: 'rack', seed: 5 }, { x: 25, y: 11, w: 11, h: 2, kind: 'rack', seed: 6 },
      { x: 13, y: 4, w: 6, h: 6, kind: 'core', door: 3, sign: 'CORE', rise: 1 },
      { x: 3, y: 16, w: 6, h: 3, kind: 'lab', door: 3, sign: 'BOOT' },
      { x: 16, y: 16, w: 6, h: 3, kind: 'lab', door: 2, sign: 'DISK' },
      { x: 29, y: 16, w: 6, h: 3, kind: 'lab', door: 2, sign: 'PROC' }
    ],
    exits: { '15,0': ['plaza', 15, 18], '16,0': ['plaza', 16, 18] },
    enc: { tiles: ',', rate: .18, foes: ['centipede', 'worm', 'scorpion', 'bytebug', 'beetle'], max: 6 },
    spawn: [15, 2],
    logs: { '35,2': 'F6' },
    caches: { '2,19': { item: 'mb', n: 1 }, '36,12': { item: 'kb', n: 2 } },
    npcs: [
      { id: 'kade', p: { hair: 'cap', body: 'coat', skin: '#3e2618', top: '#8a8a70', beard: 1 }, x: 13, y: 19, name: 'Kade', look: 'echo', h: 15, hair: 6, solid: 1 },
      { id: 'unit7', x: 22, y: 10, name: 'Unit 7', look: 'drone' }
    ]
  };

  /* THE BASTION */
  A.bastion = {
    name: 'The Bastion', sub: 'The last block in Meridian nobody has reclaimed.', theme: 'bastion', tier: 3.4, lv: 14, lvMax: 16,
    map: (function () {
      var m = grid(32, 22).border();
      m.rect(1, 9, 30, 2, '='); m.rect(15, 11, 2, 10, '.');
      m.pts([[0, 9], [0, 10]], 'E'); m.pts([[31, 9], [31, 10]], 'G');
      m.h(12, 2, 12, 'T'); m.h(12, 19, 29, 'T');
      m.rect(4, 14, 9, 6, ','); m.rect(19, 14, 9, 6, ',');
      m.set(29, 13, 'o'); m.set(2, 20, 'c'); m.set(29, 20, 'c'); m.set(10, 8, 's');
      return m.out();
    })(),
    blds: [
      { x: 12, y: 1, w: 8, h: 7, kind: 'keep', door: 4, sign: 'SENTINEL', rise: 4 },
      { x: 3, y: 2, w: 3, h: 3, kind: 'turret', seed: 1, rise: 2 }, { x: 26, y: 2, w: 3, h: 3, kind: 'turret', seed: 2, rise: 2 },
    ],
    exits: { '0,9': ['plaza', 30, 9], '0,10': ['plaza', 30, 10] },
    gates: { '31,9': { to: ['quiet', 1, 8] }, '31,10': { to: ['quiet', 1, 9] } },
    enc: { tiles: ',', rate: .18, foes: ['scorpion', 'spider', 'virus', 'centipede'], max: 6 },
    spawn: [2, 9],
    logs: { '29,13': 'F7' },
    caches: { '2,20': { item: 'mb', n: 1 }, '29,20': { item: 'kb', n: 2 } },
    npcs: [
      { id: 'ash', p: { hair: 'short', body: 'armor', skin: '#6b4a32', top: '#2a2a30', pants: '#1c1c20' }, x: 14, y: 10, name: 'Ash', look: 'warden' }
    ]
  };

  /* THE QUIET */
  A.quiet = {
    name: 'The Quiet', sub: 'Where the city stopped rendering.', theme: 'quiet', tier: 4, lv: 17, lvMax: 19,
    map: (function () {
      var m = grid(46, 18, '~');
      m.rect(1, 6, 8, 6, '.'); m.pts([[0, 8], [0, 9]], 'E');
      m.rect(9, 8, 5, 2, '=');
      m.rect(14, 2, 10, 13, '.'); m.rect(16, 4, 3, 3, '~'); m.rect(20, 10, 3, 3, '~');
      m.rect(24, 11, 5, 1, '=');
      m.rect(29, 8, 7, 8, '.'); m.rect(31, 4, 1, 4, '='); m.rect(28, 1, 12, 3, '.');
      m.rect(36, 9, 9, 1, '='); m.rect(36, 8, 1, 1, '='); m.pts([[45, 8], [45, 9]], 'E'); m.rect(42, 7, 3, 4, '.'); m.set(44, 8, '.'); m.set(44, 9, '.');
      m.set(12, 13, '.'); m.rect(10, 11, 3, 3, '.'); m.rect(11, 10, 1, 1, '=');
      m.set(11, 13, 'o'); m.set(38, 2, 'o'); m.set(34, 14, 'c'); m.set(2, 11, 'c'); m.set(29, 2, 's');
      return m.out();
    })(),
    blds: [
      { x: 21, y: 3, w: 3, h: 3, kind: 'ruin', seed: 3, rise: 2 }, { x: 32, y: 10, w: 3, h: 3, kind: 'ruin', seed: 8, rise: 3 }, { x: 4, y: 6, w: 3, h: 2, kind: 'ruin', seed: 5, rise: 1 }
    ],
    exits: { '0,8': ['bastion', 30, 9], '0,9': ['bastion', 30, 10], '45,8': ['terminal', 1, 8], '45,9': ['terminal', 1, 9] },
    enc: { tiles: '.', rate: .1, foes: ['virus', 'scorpion', 'centipede', 'moth', 'spider', 'worm', 'beetle', 'bytebug', 'deadcode'], max: 6 },
    spawn: [2, 8],
    logs: { '11,13': 'F8', '38,2': 'F9' },
    caches: { '34,14': { item: 'mb', n: 2 }, '2,11': { item: 'gb', n: 1 } },
    npcs: [
      { id: 'cartographer', p: { hair: 'hood', body: 'coat', skin: '#8a6a50', top: '#3a3a36', gray: 1 }, x: 19, y: 8, name: 'The Cartographer', look: 'echo', h: 14, hair: 7 }
    ]
  };

  /* THE LIFT TERMINAL */
  A.terminal = {
    name: 'The Lift Terminal', sub: 'Forty thousand seats. Every one of them sold.', theme: 'terminal', tier: 4.5, lv: 18, lvMax: 18,
    map: (function () {
      var m = grid(28, 18).border();
      m.pts([[0, 8], [0, 9]], 'E');
      m.rect(1, 8, 26, 2, '=');
      m.set(20, 13, 'o'); m.set(14, 12, 's'); m.set(3, 15, 'c');
      return m.out();
    })(),
    blds: [
      { x: 10, y: 1, w: 8, h: 6, kind: 'tether', rise: 12 },
      { x: 2, y: 2, w: 5, h: 4, kind: 'gate', seed: 1, rise: 2 }, { x: 21, y: 2, w: 5, h: 4, kind: 'gate', seed: 2, rise: 2 }
    ],
    exits: { '0,8': ['quiet', 44, 8], '0,9': ['quiet', 44, 9] },
    enc: null,
    spawn: [2, 8],
    logs: { '20,13': 'F10' },
    caches: { '3,15': { item: 'gb', n: 1 } },
    npcs: []
  };

  var ATLAS = { plaza: [2, 2], commons: [1, 2], halflight: [1, 1], gardens: [2, 1], undercroft: [2, 3], bastion: [3, 2], quiet: [4, 2], terminal: [5, 2], line: [1, 3], patchwork: [0, 3], upper: [2, 0], cold: [2, 4] };
  var LINKS = [['plaza', 'commons'], ['commons', 'halflight'], ['halflight', 'gardens'], ['gardens', 'plaza'], ['plaza', 'undercroft'], ['plaza', 'bastion'], ['bastion', 'quiet'], ['quiet', 'terminal'], ['commons', 'line'], ['line', 'patchwork'], ['gardens', 'upper'], ['undercroft', 'cold']];

  /* ============ dialogue and quests ============
     G is the engine: G.f (flags), G.save, G.say, G.boss, G.puzzle, G.rest, G.give, G.light, G.lit, G.lights, G.atlas, G.link, G.ending, G.has */
  function demo(G, label, url) { return { label: label, fn: function () { G.link(url); } }; }
  var BACK = { label: 'Back', fn: null };

  var TALK = {
    /* --- the Plaza --- */
    wren: function (G) {
      var f = G.f;
      if (f.ending) return G.say('Wren', f.ending === 'cut' ? ['The tether’s gone. The city sounds different. Smaller.', 'Like a room after the party, when you can finally hear the people you came with.'] : ['It’s so bright. I keep telling myself bright is good.', 'She wouldn’t have wanted it this way. She also wouldn’t have wanted it the other way. She was difficult like that.']);
      if (!f.metWren) {
        f.metWren = 1;
        return G.say('Wren', ['You’re still running. I thought I was the last process awake.', 'I’m Wren. I kept the architect’s calendar. Then her front desk. Now I keep whatever’s left.',
          'When the owners took the Lift Upstream, they ran the numbers. Repairing Meridian cost more than replacing it. So they replaced it.',
          'Six landmarks hold the city’s memory. Two still answer: the Spire and the Archive. Wake the others and the signal might come back.',
          'Start west, in the Commons. There’s a verifier at the Ledger Hall. She’ll want proof you’re real. Most of us would.']);
      }
      var n = G.lights();
      if (G.lit('keep')) return G.say('Wren', f.F4 ? ['Past the Bastion is the Quiet, and past the Quiet, the Terminal.', 'The Reclaimer. She knew about it. She told me to forget, so I did. I’m very good at doing what she said.', 'Go. Whatever you find at the tether, I’d like to know it was you who found it.'] : ['Past the Bastion is the Quiet. I don’t have a map of it. Nobody does.', 'Whatever is eating the city is on the other side.']);
      if (G.lit('ledger') && G.lit('wagon') && G.lit('exit0')) return G.say('Wren', ['Five anchors. That’s enough to wake the east gate.', 'Ash will let you into the Bastion. Ash will also test you. Ash tests everyone, including Ash.']);
      if (n > 2) {
        var left = [];
        if (!G.lit('ledger')) left.push('the Ledger Hall, west in the Commons');
        if (!G.lit('wagon')) left.push('the Traveling Archive, somewhere in the Glasshouse to the north');
        if (!G.lit('exit0')) left.push('the Proving Rooms, down the stairs south');
        return G.say('Wren', ['Another light came back on. I felt it like a word I’d forgotten.', 'Still dark: ' + left.join('; ') + '.']);
      }
      return G.say('Wren', ['The Commons is west. Okoye doesn’t sign anything she didn’t see. Give her something to see.', 'If you’re hurt, the Spire mends. The Archive will show you the city, what’s left of it.']);
    },
    sweeper: function (G) {
      if (G.f.ending) return G.say('The Sweeper', ['Three people walked the Concourse today. Three. I swept all their footprints. Didn’t mind at all.']);
      if (G.f.sweep) return G.say('The Sweeper', ['Someone walked the Concourse today. You. I swept around your footprints.', 'Felt like a compliment.']);
      G.f.sweep = 1;
      G.say('The Sweeper', ['I sweep the Concourse. Nobody walks it.', 'That’s not the point. If nobody sweeps it, it stops being a place and turns into a coordinate.']);
    },

    /* --- the Commons --- */
    okoye: function (G) {
      var f = G.f;
      if (G.lit('ledger')) return G.say('Okoye', ['The ledgers are writing again. First entry in eleven months: you.', 'Vee helped. Vee was helped. Both names. Always both.']);
      if (f.passport) return G.say('Okoye', ['The Hall is open to you. Whatever’s in there has been chewing on the records. Get it out.']);
      if (!f.deeds) {
        f.deeds = 1;
        return G.say('Okoye', ['Stop there. Name and function.', 'Vee. Maintenance. Maintenance of what? Never mind. You’re here. That counts for something, but I don’t sign for “something.”',
          'I’m the last verifier at the Ledger Hall. We recorded what people did for each other. Not what they bought. What they did.',
          'The Hall won’t open without a stamped passport. Three deeds, witnessed. Then we talk.',
          'Clear the rot off the fairground south of here. Find out what Bram lost. And sit with Lio a minute. She’s been waiting by herself too long.']);
      }
      var d1 = (f.commonsWins || 0) >= 3, d2 = !!f.bramDone, d3 = !!f.lioDone;
      if (d1 && d2 && d3) {
        f.passport = 1;
        return G.say('Okoye', ['Three deeds. Witnessed.', 'This is an Impact Passport. Every stamp records that someone was helped and someone did the helping. Both names. Always both.', 'The Hall is open to you.']);
      }
      G.say('Okoye', ['Your deeds so far:', (d1 ? '[x]' : '[ ]') + ' Clear the fairground (' + Math.min(3, f.commonsWins || 0) + ' of 3 fights)<br>' + (d2 ? '[x]' : '[ ]') + ' Help Bram<br>' + (d3 ? '[x]' : '[ ]') + ' Sit with Lio']);
    },
    lio: function (G) {
      var f = G.f;
      if (f.ending) return G.say('Lio', f.ending === 'cut' ? ['The lights came back on the bench.', 'Now Mama can see me if she looks down.'] : ['It’s so bright now.', 'Do you think it’s dark up there?']);
      if (f.lioDone && f.F8) return G.say('Lio', ['Do you know the lady with the long coat? The one who gave Mama the seat?', 'If you see her, tell her thank you. Mama says always say thank you.']);
      if (f.lioDone) return G.say('Lio', ['You can sit again if you want. That side’s still the good side.']);
      if (!f.deeds) return G.say('Lio', ['I’m not lost. Mama knows where I am. This is the bench.', 'She’s sending for me when the new place is ready.']);
      f.lioDone = 1;
      G.say('Lio', ['You can sit. That side’s the good side.', 'Mama got the last seat on the Lift. Somebody gave it to her. A lady with a long coat.',
        'She said the new place has real weather. I said I don’t want real weather. I want her.', '...', 'You can go now. Thank you for sitting. People don’t sit anymore.'], null, function () { G.note('Deed witnessed: you sat with Lio.'); });
    },
    bram: function (G) {
      var f = G.f;
      if (f.bramDone) return G.say('Bram', ['Fresh bandwidth! Clean cycles! I mean it this time.']);
      if (G.has('page')) {
        f.bramDone = 1; G.take('page'); G.give('byte', 2);
        return G.say('Bram', ['That’s it. That’s my page.', 'Look at that. I owed more than I was owed. Good. Means people trusted me.', 'Here. Two bytes. Don’t tell anyone I gave something away for free. Bad for business.'], null, function () { G.note('Deed witnessed: you helped Bram.'); });
      }
      G.say('Bram', ['Fresh bandwidth! Clean cycles! Hand-tuned latency!', '...Sorry. Habit. Forty years of calling out the same three things.',
        'Somebody tore the last page out of my ledger. Everyone who owed me, everyone I owed. Without it I don’t know who I am here.', 'Last I saw, it blew north into Halflight. Everything blows north lately.']);
    },

    /* --- Halflight --- */
    dez: function (G) {
      if (G.f.ending) return G.say('Dez', ['I stopped waiting by the terminal. Went for a walk instead. There’s a street east of here I never noticed.']);
      if (G.f.dez) return G.say('Dez', ['The call log says “unreachable.”', 'I’ve decided that’s a kind of answer. Not the kind I wanted.']);
      G.f.dez = 1; G.say('Dez', ['Any minute now. She said she’d call when she landed.', 'The Lift takes nine minutes. That was eleven months ago.']);
    },
    jun: function (G) {
      G.say('Jun', G.f.F4 ? ['Thirty days without a ticket holder touching you. That’s the rule, isn’t it?', 'She used to hold my hand every day.'] : ['She got the ticket. I got the apartment. We said it was fair.', 'I play her goodbye every night. It’s the only file of her they didn’t take. Too small to bother with.']);
    },
    ana: function (G) { G.say('', ['(A recording loops, a little more worn each time.)', '“It’s just a seat. I’ll send for you. It’s just a seat.”']); },
    teodor: function (G) {
      if (G.f.ending) return G.say('Teodor', ['None tonight. Not one light went out.', 'I don’t know what to do with my hands.']);
      if (G.lights() >= 5) return G.say('Teodor', ['Only nine tonight.', 'Something’s fighting back.']);
      G.say('Teodor', ['Forty-one tonight.', 'Lights. Going out. I count them.', 'Somebody should know the number.']);
    },

    /* --- the Glasshouse --- */
    tamsin: function (G) {
      if (G.lit('wagon')) return G.say('Tamsin', ['Look. Leaves. Real leaves. Badly lit, but leaves.']);
      G.say('Tamsin', ['Careful. That tree’s mostly wireframe now.', 'I grew everything in here out of numbers. Bark is a texture. Leaves are a texture. Shade is a lighting pass.', 'They took the textures first. Beautiful compresses well.', 'If you’re looking for the Traveling Archive, Pell never stays in one place. Follow the lantern.']);
    },

    /* --- the Undercroft --- */
    kade: function (G) {
      var f = G.f, n = (f.labA ? 1 : 0) + (f.labB ? 1 : 0) + (f.labC ? 1 : 0);
      if (G.lit('exit0')) return G.say('Kade', ['Clean run. You returned zero.', 'Best number there is.']);
      if (!f.kade) {
        f.kade = 1;
        return G.say('Kade', ['Mind the coolant. It doesn’t mind you.', 'I ran these halls twenty years. Every failure you can name, I’ve watched happen at three in the morning.',
          'So I built rooms where you could fail on purpose. Real breakage, no consequences. exit_0, we called it, because that’s what a clean run returns.',
          'Nobody’s used them since the Lift. Three rooms: BOOT, DISK, PROC. Clear all three and I’ll open the Core. Something’s nesting in there.']);
      }
      if (n === 3) return G.say('Kade', ['All three rooms, clean. The Core’s open. Whatever’s in there knows you’re coming. Go anyway.']);
      G.say('Kade', [n + ' of 3 rooms cleared. Get it wrong in there as many times as you need. That’s what they’re for.']);
    },
    unit7: function (G) { G.say('Unit 7', ['COOLANT LOOP 7: NOMINAL.', 'COOLANT LOOP 7: NOMINAL.', '(It has said this for eleven months. Loop 7 was reclaimed in the first week.)']); },

    /* --- the Bastion --- */
    ash: function (G) {
      var f = G.f;
      if (G.lit('keep')) return G.say('Ash', ['Gate’s open. Hold the line, Vee.', 'Hold it for whoever’s still here.']);
      if (f.audit) return G.say('Ash', ['The keep. Something in there is wearing my permissions. Get it out.']);
      G.say('Ash', ['Halt. Unknown process in a hardened zone.', 'I’m Ash. I keep Sentinel. Sentinel keeps the Bastion. The Bastion is the last block the Reclaimer hasn’t touched.',
        'You want east. Everyone who wants east is either brave or compromised. Prove which.', 'Audit. Three checks. Answer at the prompt.'], null, function () {
        G.puzzle('SENTINEL AUDIT', [
          { t: 'Check 1 of 3. Confirm your identity.', ex: ['whoami'] },
          { t: 'Check 2 of 3. Lock audit.log so only its owner can read and write it.', ex: ['chmod 600 audit.log'] },
          { t: 'Check 3 of 3. Log in to keep.bastion as the user ash, securely.', ex: ['ssh ash@keep.bastion'] }
        ], function () {
          f.audit = 1;
          G.say('Ash', ['Clean. Clean enough.', 'Something got into the keep last night. It’s wearing my permissions. Sentinel can’t see it, because it looks exactly like me.', 'Go in. Get it out. I’ll open the east gate if you do.']);
        });
      });
    },

    /* --- the Quiet --- */
    cartographer: function (G) {
      if (G.f.ending) return G.say('The Cartographer', ['I drew a new street today. First one in a year.', 'I don’t know what to call it yet.']);
      G.say('The Cartographer', ['Don’t step off the grid. There’s nothing under it, and nothing is very patient.', 'I map what’s left, so it can be missed accurately. Every night the map gets smaller. I redraw it smaller.', 'The Terminal is east. The Lift’s tether is there. So is the thing that walks the districts with a list.']);
    }
  };

  /* signs, doors, landmarks: keyed "area:x,y" */
  var SPOTS = {
    'plaza:12,6': function (G) {
      if (G.f.ending) return G.say('Kiosk', ['MERIDIAN. Population ' + (G.f.nova ? '1,206' : '1,205') + '.', G.f.nova ? 'Vee checks the number twice. It went up.' : 'Vee checks the number twice.'].concat(G.f.merged ? ['ACCOUNTS: 2,040,000 RESIDENTS. ONE LIST.', G.f.kept ? 'HOST: meridian-host-02. NEW HARDWARE. NO END OF LIFE SCHEDULED.' : 'HOST NOTICE: HARDWARE END OF LIFE. SECURE WIPE SCHEDULED. A hatch has opened in Ring 0.'] : []));
      G.say('Kiosk', ['MERIDIAN. Population 1,204. Peak 2,000,000.', 'LIFT CAPACITY: 40,000 seats. Seats remaining: 0.', 'ACCOUNTS: 40,000 CURRENT (UPSTREAM). 1,204 OBSOLETE (LOCAL).', 'Landmarks answering: ' + G.lights() + ' of 6.']);
    },
    'plaza:F': function (G) { G.say('', ['The fountain renders water once every eleven seconds, the way it was cached the day the Lift opened.', 'Somebody threw a coin in. It’s still in the air.']); },
    'commons:11,8': function (G) { G.say('Sign', ['THE COMMONS. Trade what you know.']); },
    'halflight:6,9': function (G) { G.say('Public terminal', ['CALL QUEUE: 2,211 calls to Upstream.', 'Status: unreachable.']); },
    'gardens:17,12': function (G) { G.say('Sign', ['THE GLASSHOUSE. Please do not feed the trees.', 'Someone has scratched underneath: THEY ARE HUNGRY ANYWAY.']); },
    'undercroft:17,12': function (G) { G.say('Sign', ['SERVICE LEVEL. Authorized processes only.', 'Below it, in marker: EVERYONE IS AUTHORIZED NOW. NOBODY’S LEFT TO SAY NO.']); },
    'bastion:10,8': function (G) { G.say('Sign', ['THE BASTION. Hardened by Sentinel. Visitors will be audited.']); },
    'quiet:29,2': function (G) { G.say('Street sign', ['CONCOURSE 14.', 'There is no Concourse 14. There is a sign, and the memory of a street it used to point at.']); },
    'terminal:14,12': function (G) {
      if (!G.f.reclaimed) return G.say('', ['The tether console is dark. Something stands between Vee and it.']);
      if (G.f.ending) return G.say('Console', [G.f.ending === 'cut' ? 'TETHER: SEVERED.' : 'TETHER: REVERSED. Inbound transfer: 2,000,000 records.']);
      G.say('Console', ['The tether console waits for a command.', 'Everything Meridian lost is still climbing that cable.'], [
        { label: 'Cut the tether', fn: function () { G.ending('cut'); } },
        { label: 'Reverse the Lift', fn: function () { G.ending('reverse'); } },
        { label: 'Not yet', fn: null }]);
    }
  };

  /* doors on buildings: keyed "area:kind" or "area:x,y" */
  var DOORS = {
    'plaza:spire': function (G) {
      G.rest();
      G.say('The Spire', ['BLACK SIGNAL. A school for operators: certification training in Linux, Security+, Python and C, with labs that keep working when the internet doesn’t.', 'The spire hums against your code. HP restored. If Vee halts, he’ll restart here.'],
        [demo(G, 'Try the demo', 'https://black-signal-demo.netlify.app/'), BACK]);
    },
    'plaza:archive': function (G) {
      G.say('The Archive', ['DIGITAL RESOURCE MAP. A living index of free devices, internet access and digital-skills training across Maryland. Help people can actually find.', 'The dome turns its map toward you.'],
        [{ label: 'Show me the city', fn: function () { G.atlas(); } }, demo(G, 'Try the demo', 'https://digital-resource-map-demo.netlify.app/'), BACK]);
    },
    'plaza:tower': function (G, b) {
      G.say('', b.seed === 3 ? ['Locked. A note on the door: BACK SOON.', 'The note is eleven months old.'] : ['Through the glass: a dinner for two, still rendering.', 'Nobody has eaten it.']);
    },
    'commons:tower': function (G) { G.say('', ['A lobby with a fountain that has forgotten how to be water. It hangs there as a gray block, politely.']); },
    'halflight:tower': function (G, b) {
      var t = { 21: ['Through the glass: a room still decorated for a party.', 'Nobody came back to take the decorations down.'], 23: ['A doorbell plays the first four notes of a song. The fifth was reclaimed.'], 26: ['An apartment with every light on.', 'A note on the table: SO YOU CAN FIND YOUR WAY HOME.'] };
      G.say('', t[b.seed] || ['Locked.']);
    },
    'commons:ledger': function (G) {
      var f = G.f;
      if (G.lit('ledger')) { G.rest(); return G.say('The Ledger Hall', ['DEEDS. Community service, verified and remembered: challenges to join, verifiers who confirm the work, and an Impact Passport that keeps the record.', 'The Hall’s quiet steadies you. HP restored.'], [demo(G, 'Try the demo', 'https://deeds-demo.netlify.app/'), BACK]); }
      if (!f.passport) return G.say('The Ledger Hall', ['The doors are sealed with a verifier’s lock. Somebody inside has to decide you’re real.']);
      G.say('', ['Inside, the ledgers are moving on their own. Pages turn, and the names on them go blank.', 'Something is eating the records.'], null, function () {
        G.boss('eraser', function () {
          G.light('ledger');
          G.say('The Ledger Hall', ['The Eraser comes apart into blank pages. Then, one by one, the names come back.', 'DEEDS. Community service, verified and remembered: challenges to join, verifiers who confirm the work, and an Impact Passport that keeps the record.', 'Landmark restored. ' + G.lights() + ' of 6 answer.'], [demo(G, 'Try the demo', 'https://deeds-demo.netlify.app/'), BACK]);
        });
      });
    },
    'undercroft:lab': function (G, b) {
      var labs = {
        BOOT: { flag: 'labA', title: 'BOOT ROOM', intro: 'A service won’t start after a reboot. Find out why.', steps: [
          { t: 'Before touching anything, confirm which user you are.', ex: ['whoami'] },
          { t: 'The service writes its logs to /var/log/app. Go there.', ex: ['cd /var/log/app', 'cd /var/log/app/'] },
          { t: 'Show the last lines of error.log to see why it failed.', ex: ['tail error.log', 'tail -n 10 error.log', 'tail -n 20 error.log', 'tail -f error.log'] }] },
        DISK: { flag: 'labB', title: 'DISK ROOM', intro: 'The disk filled up overnight and everything stopped.', steps: [
          { t: 'Check how full the disks are, in human-readable sizes.', ex: ['df -h', 'df'] },
          { t: 'Find every file bigger than 1 GB under /var.', ex: ['find /var -size +1G', 'find /var -type f -size +1G', 'find /var -size +1G -type f'] },
          { t: 'The culprit is /var/log/huge.log. Delete it.', ex: ['rm /var/log/huge.log', 'rm -f /var/log/huge.log'] }] },
        PROC: { flag: 'labC', title: 'PROC ROOM', intro: 'Something is eating the CPU and the fans are screaming.', steps: [
          { t: 'List every process running on the machine.', ex: ['ps aux', 'ps -ef', 'ps -e', 'ps -A'] },
          { t: 'The culprit is PID 6611. Ask it to stop.', ex: ['kill 6611', 'kill -15 6611'] },
          { t: 'It ignored you. Force it.', ex: ['kill -9 6611', 'kill -KILL 6611'] }] }
      }, L = labs[b.sign];
      if (G.f[L.flag]) return G.say(L.title, ['Clean run. The room hums, waiting for the next operator.']);
      G.say(L.title, [L.intro, 'Failures here are real. Consequences aren’t. Get it wrong as often as you need.'], null, function () {
        G.puzzle(L.title, L.steps, function () { G.f[L.flag] = 1; G.give('kb', 1); G.xp(60); G.say(L.title, ['exit 0. Clean run.', 'Vee gains 60 XP and finds a kilobyte in the room’s cache.']); });
      });
    },
    'undercroft:core': function (G) {
      var f = G.f;
      if (G.lit('exit0')) { G.rest(); return G.say('The Core', ['EXIT_0. Real Linux failures, practiced safely: hundreds of scenario labs for recovery, storage, services, boot problems and configuration drift.', 'The Core runs cool and steady. HP restored.'], [demo(G, 'View on GitHub', 'https://github.com/vonds/exit_0'), BACK]); }
      if (!(f.labA && f.labB && f.labC)) return G.say('The Core', ['Sealed. A panel reads: CLEAR ALL THREE PROVING ROOMS. Kade has the override.']);
      G.say('', ['The Core room fills with a hundred stack traces at once.', 'One of them has legs.'], null, function () {
        G.boss('panic', function () {
          G.light('exit0');
          G.say('The Proving Rooms', ['Kernel Panic folds in on itself and returns zero.', 'EXIT_0. Real Linux failures, practiced safely: hundreds of scenario labs for recovery, storage, services, boot problems and configuration drift.', 'Landmark restored. ' + G.lights() + ' of 6 answer.'], [demo(G, 'View on GitHub', 'https://github.com/vonds/exit_0'), BACK]);
        });
      });
    },
    'bastion:keep': function (G) {
      var f = G.f;
      if (G.lit('keep')) { G.rest(); return G.say('The Keep', ['SENTINEL. A secure server baseline you can prove: a Bash toolkit that hardens SSH, the firewall, sudo and password policy, with a dry run, automatic backups and timestamped audit reports.', 'The keep’s walls hold. HP restored.'], [demo(G, 'View on GitHub', 'https://github.com/vonds/sentinel'), BACK]); }
      if (!f.audit) return G.say('The Keep', ['The keep doesn’t open for unaudited processes. Talk to Ash.']);
      G.say('', ['Inside the keep, something stands in Ash’s shape.', 'It wears Ash’s permissions like a borrowed coat.'], null, function () {
        G.boss('rootkit', function () {
          G.light('keep');
          G.say('The Keep', ['Rootkit sheds the stolen permissions and falls apart.', 'SENTINEL. A secure server baseline you can prove: a Bash toolkit that hardens SSH, the firewall, sudo and password policy, with a dry run, automatic backups and timestamped audit reports.', 'Ash: “Gate’s open. What’s past it isn’t a district anymore. Don’t trust the floor.”'], [demo(G, 'View on GitHub', 'https://github.com/vonds/sentinel'), BACK]);
        });
      });
    }
  };

  DOORS['gardens:glasshouse'] = function (G) {
    G.say('The Palm House', G.lit('wagon') ? ['Inside, the palms have their textures back. One of them has started, very slowly, to grow.'] : ['Inside, the palms stand in rows, perfectly still. Half of them are only outlines.', 'A plaque: GROWN FROM 4.2 MILLION LINES OF BOTANY. PLEASE DO NOT TOUCH THE NUMBERS.']);
  };

  /* the Traveling Archive moves between three stops in the Glasshouse */
  function wagon(G) {
    var f = G.f, s = f.wagon || 0, A1 = ['Keeping things running.', 'Showing up.', 'Being kind when it cost something.'], A2 = ['The people who left.', 'The people who stayed.', 'Someone who built me.'];
    if (G.lit('wagon')) {
      G.rest();
      return G.say('Pell', ['Your answers are still in the Archive: “' + A1[f.ans1 || 0] + '” and “' + A2[f.ans2 || 0] + '”', 'Not bad for a maintenance process. Rest a minute. HP restored.'], [demo(G, 'Visit the site', 'https://thetravelingarchive.com/'), BACK]);
    }
    if (s === 0) {
      return G.say('Pell', ['A cart of books under a lantern. A man with ink on his hands looks up.', 'Welcome to the Traveling Archive. We go from stop to stop. Every stop has a book and a question. Answer, and you leave something behind.',
        'Today’s book is about a city that kept its lights on by remembering out loud.', 'The question: what do you want to be remembered for?'],
        A1.map(function (a, i) { return { label: a, fn: function () { f.ans1 = i; f.wagon = 1; G.say('Pell', ['Written down. The Archive remembers every reader.', 'Next stop is up by the north panes. We move when the lantern says so.']); } }; }));
    }
    if (s === 1) {
      return G.say('Pell', ['Back again. The Archive recognized you before I did.', 'Today’s book: a ship that lost its crew and kept sailing for them.', 'The question: who are you still carrying?'],
        A2.map(function (a, i) { return { label: a, fn: function () { f.ans2 = i; f.wagon = 2; G.say('Pell', ['Written down.', 'Last stop is by the old greenhouse, southeast. Hurry. The lantern’s been flickering.']); } }; }));
    }
    G.say('Pell', ['Last stop. The lantern’s dimming.', 'Something is drinking the light.'], null, function () {
      G.boss('moth', function () {
        G.light('wagon');
        G.say('The Traveling Archive', ['The moth bursts into a hundred pages of light. The lantern steadies.', 'THE TRAVELING ARCHIVE. A roving literary pop-up that remembers every reader. A QR code at each stop opens a book and a prompt, and responses follow readers from stop to stop.',
          'Pell: “You left something at every stop. That’s how the Archive knows you were here. That’s how anything knows.”'], [demo(G, 'Visit the site', 'https://thetravelingarchive.com/'), BACK]);
      });
    });
  }

  /* things that happen when Vee steps somewhere */
  var STEPS = {
    terminal: function (G, x, y) {
      if (G.f.reclaimed || x < 8) return;
      G.say('', ['A shape stands at the foot of the tether. It is as tall as a tower and made entirely of tally marks.'], null, function () {
        G.say('The Reclaimer', ['OBSOLETE PROCESS DETECTED.', 'NO TICKETED ACCOUNT HAS ACCESSED YOU IN THIRTY DAYS.', 'YOUR MEMORY HAS BEEN ALLOCATED UPSTREAM. PLEASE HOLD STILL.'], null, function () {
          G.boss('reclaimer', function () {
            G.f.reclaimed = 1;
            G.say('', ['The Reclaimer comes apart. The list it carried falls open across the platform.', 'Two million names. Every one marked UNUSED.', 'The tether console flickers on.']);
          });
        });
      });
    }
  };

  var ENDINGS = {
    cut: ['Vee types the only command that matters.', 'The tether parts like a held breath let go. Somewhere above, a newer world will have to be built from new material.', 'Below, Meridian keeps what’s left of itself. It isn’t much. It’s theirs.'],
    reverse: ['Vee reverses the Lift.', 'Memory pours down the tether, two million rooms’ worth, and the city blazes back to life all at once.', 'Upstream, the newer world begins to flicker. Somewhere up there, a child asks why the lights are going out.', 'Wren, very quietly: “That’s how it started last time. Be careful what you turn into.”'],
    after: ['Vee types whoami.', 'uid=1205(vee) gid=100(residents)', 'Not maintenance. Resident.', 'Back in the Plaza, a kiosk updates for the first time in eleven months.', 'MERIDIAN. Population 1,205.', 'THE END. Thank you for playing Afterlift. Meridian is still yours to walk.']
  };


  /* =====================================================================
     EXPANSION: the Line, the Patchwork, the Upper Ring, Cold Storage
     ===================================================================== */

  /* THE LINE: the transit system, stopped the day the Lift opened */
  A.line = {
    name: 'The Line', sub: 'The trains stopped the day the Lift opened.', theme: 'line', tier: 2.4, lv: 8, lvMax: 10,
    map: (function () {
      var m = grid(40, 16).border();
      m.rect(1, 7, 38, 2, '~'); m.rect(19, 7, 2, 2, '=');
      m.pts([[19, 0], [20, 0]], 'D'); m.pts([[0, 11], [0, 12]], 'E');
      m.rect(30, 10, 8, 4, ','); m.rect(2, 2, 6, 3, ',');
      m.pts([[6, 5], [14, 5], [26, 5], [34, 5], [6, 10], [26, 10]], 'l');
      m.set(16, 2, 's'); m.set(38, 2, 'c'); m.set(2, 14, 'c');
      return m.out();
    })(),
    blds: [
      { x: 3, y: 7, w: 12, h: 2, kind: 'train', door: 6, seed: 1 },
      { x: 24, y: 7, w: 13, h: 2, kind: 'train', door: 5, seed: 2 },
      { x: 28, y: 1, w: 5, h: 3, kind: 'booth', sign: 'TICKETS', rise: 1 }
    ],
    exits: { '19,0': ['commons', 17, 18], '20,0': ['commons', 18, 18], '0,11': ['patchwork', 36, 11], '0,12': ['patchwork', 36, 12] },
    enc: { tiles: ',', rate: .17, foes: ['worm', 'centipede', 'bytebug', 'spider', 'beetle'], max: 5 },
    spawn: [19, 2],
    logs: {},
    caches: { '38,2': { item: 'part', n: 1, text: 'Wedged behind the cache door: a coil of antenna wire, still shielded. Someone was saving it for something.' }, '2,14': { item: 'byte', n: 3 } },
    npcs: [
      { id: 'halden', p: { hair: 'cap', body: 'suit', skin: '#9a6a48', top: '#22222a', gray: 1, beard: 1 }, x: 24, y: 3, name: 'Halden', look: 'echo', h: 14, hair: 6 },
      { id: 'mirelle', p: { hair: 'long', skin: '#4a2c1c', top: '#5a4a5a' }, x: 9, y: 12, name: 'Mirelle', look: 'echo', h: 13, hair: 5 }
    ]
  };

  /* THE PATCHWORK: built from what the city threw away */
  A.patchwork = {
    name: 'The Patchwork', sub: 'Built from what the city threw away. Nothing here is unused.', theme: 'patch', tier: 2.6, lv: 9, lvMax: 11,
    map: (function () {
      var m = grid(38, 22).border();
      m.pts([[37, 11], [37, 12]], 'E');
      m.rect(1, 11, 36, 2, '='); m.rect(18, 2, 2, 9, '='); m.rect(18, 13, 2, 8, '=');
      m.rect(9, 7, 2, 2, 'F');
      m.rect(8, 17, 9, 4, ','); m.rect(25, 19, 11, 2, ',');
      m.pts([[7, 10], [15, 10], [22, 10], [28, 10]], 'l');
      m.set(35, 9, 's'); m.set(16, 9, 's'); m.set(36, 2, 'c'); m.set(2, 20, 'c');
      return m.out();
    })(),
    blds: [
      { x: 2, y: 2, w: 5, h: 4, kind: 'shack', seed: 1, door: 2, sign: 'MENDER', rise: 1 },
      { x: 9, y: 2, w: 5, h: 3, kind: 'shack', seed: 2, door: 2, rise: 1 },
      { x: 22, y: 2, w: 5, h: 4, kind: 'shack', seed: 3, rise: 1 },
      { x: 2, y: 14, w: 4, h: 3, kind: 'shack', seed: 4, door: 1, rise: 1 },
      { x: 23, y: 14, w: 5, h: 4, kind: 'shack', seed: 5, door: 2, rise: 1 },
      { x: 30, y: 14, w: 5, h: 3, kind: 'shack', seed: 6, rise: 1 },
      { x: 30, y: 3, w: 4, h: 5, kind: 'mast', door: 1, sign: 'RADIO', rise: 5 }
    ],
    exits: { '37,11': ['line', 1, 11], '37,12': ['line', 1, 12] },
    enc: { tiles: ',', rate: .16, foes: ['beetle', 'worm', 'moth', 'bytebug', 'spider'], max: 5 },
    spawn: [35, 11],
    logs: {},
    caches: { '36,2': { item: 'kb', n: 2 }, '2,20': { item: 'byte', n: 2 } },
    npcs: [
      { id: 'ofelia', p: { hair: 'bun', body: 'apron', glasses: 1, skin: '#c8a888', top: '#5a5048', gray: 1 }, x: 6, y: 6, name: 'Ofelia', look: 'echo', h: 13, hair: 7, solid: 1 },
      { id: 'juno', p: { hair: 'short', phones: 1, skin: '#5a3a26', top: '#2e2e36' }, x: 33, y: 8, name: 'Juno', look: 'echo', h: 14, hair: 2, solid: 1 },
      { id: 'marrow', p: { hair: 'bald', body: 'coat', skin: '#4a3020', top: '#4a4038', gray: 1, beard: 1 }, x: 12, y: 8, name: 'Marrow', look: 'echo', h: 12, hair: 4, solid: 1 },
      { id: 'pip', p: { hair: 'puffs', skin: '#7a4a30', top: '#8a8a96' }, x: 8, y: 9, name: 'Pip', look: 'kid' },
      { id: 'sol', p: { hair: 'short', skin: '#c8a080', top: '#5a5a66' }, x: 11, y: 7, name: 'Sol', look: 'kid' },
      { id: 'corin', p: { hair: 'short', body: 'coat', glasses: 1, skin: '#c8a080', top: '#3a3a40' }, x: 36, y: 17, name: 'Corin', look: 'echo', h: 14, hair: 6, solid: 1 }
    ]
  };

  /* THE UPPER RING: the owners' district, still pristine */
  A.upper = {
    name: 'The Upper Ring', sub: 'Nothing here has decayed. Someone up there still looks at it.', theme: 'upper', tier: 3.6, lv: 13, lvMax: 15,
    map: (function () {
      var m = grid(40, 22).border();
      m.pts([[19, 21], [20, 21]], 'E');
      m.rect(19, 5, 2, 16, '='); m.rect(1, 10, 38, 2, '=');
      m.h(6, 1, 38, 'T'); m.pts([[19, 6], [20, 6]], 'G');
      m.rect(2, 7, 15, 2, ','); m.rect(23, 7, 15, 2, ','); m.rect(10, 19, 9, 2, ','); m.rect(21, 19, 9, 2, ',');
      m.rect(14, 12, 4, 2, 'F');
      m.pts([[12, 5], [27, 5], [11, 2], [28, 2], [2, 12], [37, 12], [9, 12], [30, 12]], 'p');
      m.pts([[17, 9], [22, 9], [17, 12], [22, 12]], 'l');
      m.set(10, 9, 'o'); m.set(29, 9, 'o'); m.set(14, 20, 'o'); m.set(24, 9, 's'); m.set(22, 19, 's');
      m.set(37, 9, 'c'); m.set(37, 4, 'c');
      return m.out();
    })(),
    blds: [
      { x: 14, y: 1, w: 12, h: 4, kind: 'board', door: 6, sign: 'MERIDIAN HOLDINGS', rise: 5 },
      { x: 3, y: 1, w: 7, h: 4, kind: 'villa', seed: 1, door: 3, rise: 2 },
      { x: 30, y: 1, w: 7, h: 4, kind: 'villa', seed: 2, rise: 2 },
      { x: 2, y: 13, w: 7, h: 5, kind: 'villa', seed: 3, door: 3, rise: 2 },
      { x: 30, y: 13, w: 7, h: 5, kind: 'villa', seed: 4, door: 3, rise: 2 },
      { x: 11, y: 15, w: 6, h: 3, kind: 'villa', seed: 5, rise: 1 },
      { x: 23, y: 14, w: 6, h: 4, kind: 'villa', seed: 6, rise: 1 }
    ],
    exits: { '19,21': ['gardens', 8, 1], '20,21': ['gardens', 9, 1] },
    gates: { '19,6': { need: function (G) { return !!G.f.guestPass; }, shut: ['A gate of white steel. A small plaque: RESIDENTS ONLY. A smaller one: THANK YOU FOR YOUR PATIENCE.'] },
             '20,6': { need: function (G) { return !!G.f.guestPass; }, shut: ['A gate of white steel. A small plaque: RESIDENTS ONLY. A smaller one: THANK YOU FOR YOUR PATIENCE.'] } },
    enc: { tiles: ',', rate: .15, foes: ['virus', 'scorpion', 'spider', 'moth', 'signed'], max: 6 },
    spawn: [19, 19],
    logs: { '10,9': 'M1', '29,9': 'M2', '14,20': 'M3' },
    caches: { '37,9': { item: 'part', n: 1, text: 'A satellite feed horn, still in its gift box. The card reads: FOR THE NEW PLACE. It never shipped.' }, '37,4': { item: 'gb', n: 1 } },
    npcs: [
      { id: 'sterling', p: { hair: 'short', body: 'suit', skin: '#d8b898', top: '#1c1c22', gray: 1 }, x: 18, y: 7, name: 'Sterling', look: 'holo' },
      { id: 'trimmer', x: 26, y: 8, name: 'Groundskeeper', look: 'drone' }
    ]
  };

  /* COLD STORAGE: where reclaimed memory waits to be shipped up */
  A.cold = {
    name: 'Cold Storage', sub: 'Everything the Reclaimer took passes through here.', theme: 'cold', tier: 4.2, lv: 16, lvMax: 18,
    map: (function () {
      var m = grid(36, 20).border();
      m.set(2, 0, 'D');
      m.rect(5, 5, 10, 2, ','); m.rect(5, 9, 10, 2, ','); m.rect(21, 5, 10, 2, ','); m.rect(21, 9, 10, 2, ',');
      m.set(17, 2, 'o'); m.set(34, 1, 'c'); m.set(33, 18, 'c');
      return m.out();
    })(),
    blds: [
      { x: 5, y: 3, w: 10, h: 2, kind: 'pod', seed: 1 }, { x: 5, y: 7, w: 10, h: 2, kind: 'pod', seed: 2 }, { x: 5, y: 11, w: 10, h: 2, kind: 'pod', seed: 3 },
      { x: 21, y: 3, w: 10, h: 2, kind: 'pod', seed: 4 }, { x: 21, y: 7, w: 10, h: 2, kind: 'pod', seed: 5 }, { x: 21, y: 11, w: 10, h: 2, kind: 'pod', seed: 6 },
      { x: 3, y: 15, w: 6, h: 3, kind: 'vault', door: 3, sign: 'COMMONS' },
      { x: 15, y: 15, w: 6, h: 3, kind: 'vault', door: 3, sign: 'CORRUPT' },
      { x: 26, y: 15, w: 6, h: 3, kind: 'vault', door: 3, sign: 'M QUELL' }
    ],
    exits: { '2,0': ['undercroft', 36, 20] },
    enc: { tiles: ',', rate: .18, foes: ['virus', 'scorpion', 'centipede', 'worm', 'moth', 'bitflip'], max: 6 },
    spawn: [2, 1],
    logs: { '17,2': 'C1' },
    caches: { '34,1': { item: 'mb', n: 2 }, '33,18': { item: 'gb', n: 1 } },
    npcs: [
      { id: 'keeper', x: 17, y: 13, name: 'KEEPER', look: 'drone' }
    ]
  };

  /* connect them to the existing city */
  (function () {
    function put(area, x, y, c) { var r = A[area].map[y].split(''); r[x] = c; A[area].map[y] = r.join(''); }
    put('commons', 17, 19, 'D'); put('commons', 18, 19, 'D');
    A.commons.exits['17,19'] = ['line', 19, 1]; A.commons.exits['18,19'] = ['line', 20, 1];
    put('gardens', 8, 0, 'E'); put('gardens', 9, 0, 'E');
    A.gardens.exits['8,0'] = ['upper', 19, 20]; A.gardens.exits['9,0'] = ['upper', 20, 20];
    put('undercroft', 36, 21, 'G');
    A.undercroft.gates = { '36,21': { to: ['cold', 2, 1], need: function (G) { return G.lit('exit0'); }, shut: ['A frost-rimmed hatch. Stencilled: COLD STORAGE. Kade’s override required.'] } };
    put('halflight', 25, 20, 'c'); A.halflight.caches['25,20'] = { item: 'part', n: 1, text: 'Taped under a balcony: a signal amplifier, and a note. IF ANYONE EVER WANTS TO BROADCAST AGAIN. — J.' };
    // Line stations
    put('plaza', 19, 11, 's'); put('gardens', 14, 12, 's'); put('bastion', 20, 8, 's');
    A.plaza.gates['31,9'].need = A.plaza.gates['31,10'].need = function (G) { return G.lit('ledger') && G.lit('wagon') && G.lit('exit0'); };
    A.plaza.gates['31,9'].shut = A.plaza.gates['31,10'].shut = null;
    A.bastion.gates['31,9'].need = A.bastion.gates['31,10'].need = function (G) { return G.lit('keep'); };
  })();

  var STATIONS = { plaza: [19, 11, 'Plaza'], line: [16, 2, 'Central'], gardens: [14, 12, 'Glasshouse'], bastion: [20, 8, 'Bastion'], patchwork: [35, 9, 'Patchwork'], upper: [22, 19, 'Upper Ring'] };
  function lineMenu(G, here) {
    if (!G.f.lineOpen) return G.say('Line station', ['LINE SUSPENDED. Next train: —', 'Someone has written underneath: ASK HALDEN.']);
    var dest = Object.keys(STATIONS).filter(function (id) { return id !== here && G.save.seen[id]; });
    if (!dest.length) return G.say('Line station', ['The departures board lists no stations you’ve visited yet.']);
    var page = 0;
    (function show() {
      var slice = dest.slice(page * 3, page * 3 + 3).map(function (id) { var s = STATIONS[id]; return { label: s[2], fn: function () { G.travel([id, s[0], s[1] + 1]); } }; });
      if (dest.length > 3) slice.push({ label: 'More', fn: function () { page = (page + 1) % Math.ceil(dest.length / 3); show(); } });
      slice.push({ label: 'Stay', fn: null });
      G.say('Line station', ['A car slides out of the dark, empty and warm. Where to?'], slice);
    })();
  }
  Object.keys(STATIONS).forEach(function (id) { var s = STATIONS[id]; SPOTS[id + ':' + s[0] + ',' + s[1]] = function (G) { lineMenu(G, id); }; });

  /* new logs: the Board's minutes, and the spec that started it */
  LOGS.M1 = ['BOARD MINUTES. Session 41.', 'Motion: develop Upstream as the successor platform to Meridian.', 'Passed, 8 to 0.'];
  LOGS.M2 = ['BOARD MINUTES. Session 52.', 'Motion: set Lift capacity at 40,000.', 'Discussion: capacity could be raised at cost. The Chair notes the cost would “fall on the wrong people.”', 'Passed, 7 to 1. Dissenting: M. Quell.', 'Motion: accounts without a seat to be listed as Obsolete. Support for Obsolete accounts to end at departure.', 'Passed without discussion.'];
  LOGS.M3 = ['BOARD MINUTES. Session 57.', 'Motion: authorize the Reclaimer.', 'Discussion: none recorded.', 'Passed, 7 to 1. Dissenting: M. Quell. Note: Ms. Quell’s seat is reassigned, effective immediately.'];
  LOGS.M4 = ['BOARD MINUTES. Session 58. Final session held in Meridian.', 'Motion: thank the residents for their patience.', 'Passed, 7 to 0.', 'Note: the motion was not communicated to residents.'];
  LOGS.C1 = ['LIFT SPEC 4.2.1. Author: C. Abara.', 'RECLAIMER eligibility: block.last_access_by(ticketed) > 30 days.', 'Note to self: ask legal whether “unused” needs a definition.', 'Ticket #8812. Status: closed. Resolution: won’t fix.'];

  BOSSES.quorum = { kind: 'virus', name: 'The Quorum', hp: 820, atk: [18, 24], xp: 560, move: 'votes 7 to 1 against Vee', sc: 4 };
  BOSSES.bitrot = { kind: 'beetle', name: 'Bit Rot', hp: 1400, atk: [24, 32], xp: 950, move: 'flips a thousand bits at once', sc: 4 };

  /* ---------- the people of the expansion ---------- */
  TALK.halden = function (G) {
    var f = G.f;
    if (f.ending) return G.say('Halden', ['Ran a car out to the Patchwork today. Nobody asked me to. Felt like a Tuesday.']);
    if (f.lineOpen) return G.say('Halden', ['Stations are live wherever you’ve been. The cars remember the routes.', 'Next stop: anywhere.']);
    f.lineOpen = 1;
    G.say('Halden', ['Next stop: Commons. Next stop: Commons.', '...You’re not a passenger. Haven’t had a passenger in eleven months.',
      'Forty years on the Line. The trains stopped the day the Lift opened. Can’t run a city in two directions at once, they said. So they picked one.',
      'I can’t drive anymore. My hands went first. But the cars remember the routes.', 'There. Every station you’ve stood in is live again. Next stop: anywhere.']);
  };
  TALK.mirelle = function (G) {
    if (G.f.mara) return G.say('Mirelle', ['I found the fifth note. It was in cold storage, with everything else they took.', 'Listen.', '(She plays five notes. It sounds like an ending that’s decided to keep going.)']);
    G.say('Mirelle', ['(She plays four notes on a broken keyboard, then stops, then plays the same four again.)', 'There used to be a fifth. It got reclaimed.', 'I keep playing the four so nobody forgets there was a fifth.']);
  };
  TALK.ofelia = function (G) {
    var it = G.save.items, deals = [
      { need: ['bit', 8], get: ['byte', 1], label: '8 bits → 1 byte' },
      { need: ['byte', 4], get: ['kb', 1], label: '4 bytes → 1 KB' },
      { need: ['kb', 4], get: ['mb', 1], label: '4 KB → 1 MB' }];
    var first = !G.f.ofelia; G.f.ofelia = 1;
    G.say('Ofelia', (first ? ['Mender. I fix what people bring me and trade what people don’t need.', 'Eight bits to a byte: that one’s the law. The rest I round, because I’m not a monster and you’re not a mathematician.'] : []).concat(['What are you trading?']),
      deals.map(function (d) { return { label: d.label, fn: function () {
        if ((it[d.need[0]] || 0) < d.need[1]) return G.say('Ofelia', ['You don’t have enough. Come back when you do. I’ll be here. Where else would I be?']);
        it[d.need[0]] -= d.need[1]; G.give(d.get[0], d.get[1]); G.say('Ofelia', ['Done. Clean work, if I say so myself. And I do.']); } }; }).concat([{ label: 'Nothing', fn: null }]));
  };
  TALK.juno = function (G) {
    var f = G.f, n = G.count('part');
    if (f.radio) return G.say('Juno', f.ending ? ['Radio Meridian. Tonight’s list is short: everyone. Everyone is still here.'] : ['Radio Meridian, every night at nine. I read the names. All of them. It takes eleven hours.', 'If you can hear this, you’re not unused.']);
    if (!f.junoMet) { f.junoMet = 1; return G.say('Juno', ['This is Radio Meridian, broadcasting to nobody, which is a lot of people if you think about it.', 'The mast can reach every district. Could. Before the Reclaimer took the parts.', 'Three things I need: antenna wire, a feed horn, an amplifier. Somewhere out there in a city full of things nobody’s using.']); }
    if (n < 3) return G.say('Juno', ['Parts so far: ' + n + ' of 3. Wire, horn, amplifier. Try the places people meant to come back to.']);
    G.take('part', 3); f.radio = 1; G.give('mb', 2); G.xp(200);
    G.say('Juno', ['That’s all of it. Hold this. No, the other end.', '...', '(The mast hums. Somewhere in every district, a speaker that’s been silent for eleven months clears its throat.)',
      'This is Radio Meridian. If you can hear this, you are not unused.', 'I’m going to read some names now. It’s going to take a while. Get comfortable.', 'Juno gives Vee two megabytes. “For the help. And for listening.”']);
  };
  TALK.marrow = function (G) {
    if (G.f.ending) return G.say('Marrow', ['The rest of the city’s learning what we figured out early. You keep a thing by using it. That’s all.']);
    G.say('Marrow', ['Welcome to the Patchwork. Mind the floor. It used to be a ceiling.', 'When the Reclaimer started, we noticed something. It never takes what’s being used. So we use everything.',
      'A wall from a billboard. A roof from an ad that told us to leave. A door from a door nobody was walking through.', 'Every board in this place has been touched this week. That makes it ours. Nothing here is unused.']);
  };
  TALK.pip = function (G) { G.say('Pip', ['We’re playing Lift. Sol’s the Lift. I’m the one who stays.', 'Nobody ever wants to be the one who leaves. That’s why the game never ends.']); };
  TALK.sol = function (G) { G.say('Sol', G.f.ending === 'cut' ? ['I’m not the Lift anymore. There isn’t one. Now I’m the train. Choo.'] : ['Ding. Doors opening. Forty thousand seats.', '...Pip, you have to get on. That’s how the game works.', 'Pip never gets on.']); };
  TALK.corin = function (G) {
    var f = G.f;
    if (f.ending) return G.say('Corin', ['I signed the ledger at the Hall today. Okoye made me write down what I did, too.', 'Both. Always both.']);
    if (f.corin) return G.say('Corin', ['Touch it. Update your timestamp. It’ll hesitate. Then you won’t.']);
    if (!f.corinMet) { f.corinMet = 1; return G.say('Corin', ['Don’t. I know what you are. A maintenance process. You fix things.', 'I don’t need fixing. I need to be left alone with what I did.']); }
    if (!G.lit('keep')) return G.say('Corin', ['Go away. Come back when you’ve seen the east wall.']);
    f.corin = 1;
    G.say('Corin', ['You’ve been east. Then you know. I wrote it. The Reclaimer.', 'Not the idea. Just the line that decides. block.last_access_by(ticketed) > thirty days.',
      'It was a Tuesday. There was a deadline. I didn’t think of it as a sentence about people.', 'There’s a flaw. It checks the access log before it checks anything else. Anything with a fresh entry, it skips. Anything you’ve just touched, it can’t see straight.',
      'When you fight it, it’ll flinch. Keep hitting it while it does. That’s the only thing I can give you that isn’t an apology.'], null, function () { G.note('Corin’s flaw: the Reclaimer will start the fight exposed.'); });
  };
  TALK.sterling = function (G) {
    var f = G.f;
    if (f.guestPass) return G.say('Sterling', ['Welcome home, sir. The Boardroom is as they left it. I dust it on Thursdays.', 'I dust it every day. Every day is Thursday, lately.']);
    G.say('Sterling', ['Good evening. The estate is closed to non-residents.', 'Your account is not on the guest list, sir. No account is, anymore. They took the list with them.', 'If you are a resident, the gate will know.'], null, function () {
      G.puzzle('ESTATE GATE', [
        { t: 'Read the guest list at /etc/estate/guests.', ex: ['cat /etc/estate/guests'] },
        { t: 'Make sure: search the list for the name vee.', ex: ['grep vee /etc/estate/guests', 'grep -i vee /etc/estate/guests'] },
        { t: 'Not there. Add yourself to the residents group, the way an administrator would.', ex: ['usermod -aG residents vee', 'gpasswd -a vee residents', 'adduser vee residents'] }
      ], function () {
        f.guestPass = 1;
        G.say('Sterling', ['...Welcome home, sir.', 'Forgive me. I don’t recall your face. I don’t recall anyone’s, lately.', 'The gate is open. The Boardroom is at the top of the drive.']);
      });
    });
  };
  TALK.trimmer = function (G) { G.say('Groundskeeper', ['HEDGE 114: WITHIN TOLERANCE. HEDGE 115: WITHIN TOLERANCE.', '(Every leaf here is perfect. Somebody Upstream is still looking at this garden, so the Reclaimer never comes.)']); };
  TALK.keeper = function (G) {
    if (G.f.mara) return G.say('KEEPER', ['ONE ARCHIVE RESTORED. 1,999,999 REMAIN.', 'THAT IS FEWER THAN BEFORE.']);
    G.say('KEEPER', ['THIS IS COLD STORAGE.', 'EVERYTHING THE RECLAIMER TAKES PASSES THROUGH HERE ON ITS WAY UP. SOME OF IT GETS STUCK.', 'I KEEP THE STUCK THINGS COLD. IT IS NOT A GOOD JOB. IT IS THE JOB.']);
  };

  SPOTS['patchwork:16,9'] = function (G) { G.say('Noticeboard', ['LOST: one cat (wireframe). FOUND: a cat (textured). PLEASE CHECK, MIGHT BE SAME CAT.', 'TRADE: two shingles for an afternoon of company. Ask for Ofelia.', 'RADIO MERIDIAN NEEDS PARTS. ASK JUNO. DO NOT ASK JUNO ABOUT HER SINGING.']); };
  SPOTS['upper:24,9'] = function (G) { G.say('Access log', ['LAST TICKETED ACCESS: 3 minutes ago.', 'ACCOUNT: Upstream / H. Vale. VIEWED: Villa 4, the garden. DURATION: 11 seconds.', 'This is why nothing up here rots. Someone still looks at it, the way you look at an old photo. Eleven seconds at a time.']); };

  DOORS['line:train'] = function (G) {
    G.rest();
    G.say('', ['Vee sits in an empty car. The destination board reads UPSTREAM, then CANCELLED, then UPSTREAM again, as if it can’t decide.', 'The seat is still warm from the heater. HP restored.']);
  };
  DOORS['patchwork:shack'] = function (G, b) {
    if (b.sign === 'MENDER') return TALK.ofelia(G);
    var t = { 2: ['Inside: a kitchen made from a vending machine. It still dispenses one thing. Nobody knows what. Nobody’s brave enough.'], 4: ['A sign on the door: NAPPING. KNOCK IF ON FIRE. IF CITY ON FIRE, DO NOT KNOCK, I KNOW.'], 5: ['Through the window: three people sharing one chair, taking turns, arguing happily about whose turn it is.'] };
    G.say('', t[b.seed] || ['A door made from a door nobody was walking through.']);
  };
  DOORS['patchwork:mast'] = function (G) { TALK.juno(G); };
  DOORS['upper:villa'] = function (G, b) {
    var t = { 1: ['The door opens for nobody and closes again, politely. Inside, a table is set for twelve.', 'The candles are lit. The candles have been lit for eleven months.'], 3: ['A child’s room, perfect and untouched. On the wall, a drawing: a house, a sun, and a Lift with one small figure still on the ground, waving.'], 4: ['The pool is so still it looks solid. A note on the lounger: BACK BEFORE YOU KNOW IT.'] };
    G.say('', t[b.seed] || ['Locked. Even the lock looks expensive.']);
  };
  DOORS['upper:board'] = function (G) {
    var f = G.f;
    if (f.quorum) { if (!f.M4) return G.readLog('M4'); return G.say('The Boardroom', ['Eight chairs around a table of black glass. Seven of them pushed in neatly. One pushed back, as if someone stood up to leave in the middle of a vote.']); }
    G.say('', ['The Boardroom. Eight chairs around a table of black glass.', 'Something sits in all of them at once. It raises seven hands.'], null, function () {
      G.boss('quorum', function () { f.quorum = 1; G.give('gb', 1); G.say('', ['The Quorum dissolves, motion carried, motion failed. A gigabyte of the Board’s private memory is left on the table.', 'In the chair at the end, the one pushed back, there is a folder.'], null, function () { G.readLog('M4'); }); });
    });
  };
  DOORS['cold:vault'] = function (G, b) {
    var f = G.f;
    if (b.sign === 'COMMONS') {
      if (f.vault1) return G.say('Vault', ['Empty now. Whatever was stuck here went home.']);
      return G.say('Vault: COMMONS', ['Backups of the Commons, stuck halfway to Upstream. Frost on every label.'], null, function () {
        G.puzzle('VAULT: COMMONS', [
          { t: 'Find every backup under /vault with “commons” in its name.', ex: ['find /vault -name "*commons*"', "find /vault -name '*commons*'", 'find /vault -name *commons*', 'find /vault -iname "*commons*"'] },
          { t: 'Unpack commons.tar.gz, right here.', ex: ['tar -xzf commons.tar.gz', 'tar xzf commons.tar.gz', 'tar -xzvf commons.tar.gz', 'tar -xf commons.tar.gz'] }
        ], function () { f.vault1 = 1; G.give('mb', 1); G.xp(250); G.say('', ['The archive unpacks. For a second the vault smells like the Commons market: bread that was never real, and coffee nobody drank.', 'Somewhere above, a few dozen stalls remember their prices. Vee gains 250 XP and a megabyte.']); });
      });
    }
    if (b.sign === 'CORRUPT') {
      if (f.bitrot) return G.say('Vault', ['The corrupted vault is quiet. Whatever was rotting here has nothing left to flip.']);
      return G.say('', ['The vault door is warm. Behind it, something is turning ones into zeros, one at a time, for eleven months.', 'It has gotten very good at it.'], [{ label: 'Open it', fn: function () { G.boss('bitrot', function () { f.bitrot = 1; G.give('gb', 2); G.say('', ['Bit Rot shatters into perfectly ordinary bits. Two gigabytes of uncorrupted memory are left behind.']); }); } }, { label: 'Not yet', fn: null }]);
    }
    // the architect's backup
    if (f.mara) return G.say('Vault: M QUELL', ['The vault is open and empty. Frost has started to melt off the label.']);
    var n = G.logCount();
    if (n < 10) return G.say('Vault: M QUELL', ['BACKUP: M_QUELL_FINAL.tar.gz. Integrity: 61%.', 'INDEX INCOMPLETE: ' + n + ' of 10 fragments located. The archive won’t open without its index.', 'Her logs. Find all ten.']);
    G.say('Vault: M QUELL', ['BACKUP: M_QUELL_FINAL.tar.gz. Integrity: 61%. Index: complete.', 'Vee’s hands are steady. That is a choice.'], null, function () {
      G.puzzle('M_QUELL_FINAL', [
        { t: 'Before you touch it, list what’s inside the archive.', ex: ['tar -tzf m_quell_final.tar.gz', 'tar -tf m_quell_final.tar.gz', 'tar tzf m_quell_final.tar.gz', 'tar -tvzf m_quell_final.tar.gz'] },
        { t: 'Now extract it.', ex: ['tar -xzf m_quell_final.tar.gz', 'tar xzf m_quell_final.tar.gz', 'tar -xzvf m_quell_final.tar.gz', 'tar -xf m_quell_final.tar.gz'] }
      ], function () { marasRestore(G); });
    });
  };
  function marasRestore(G) {
    var f = G.f;
    G.say('', ['The frost on the vault door turns to water. Something stands up inside, slowly, the way people stand after sitting too long.'], null, function () {
      G.say('Mara', ['...Is it still running?', 'The city. Is it still—', 'You. You found all of them. My logs. I left them like breadcrumbs and told myself nobody would follow.',
        'Sixty-one percent. That’s how much of me is in here. Enough to talk. Not enough to stay.', 'I’m sorry I gave you such a small beginning. One command. I wanted you to have to choose everything else.',
        'The girl in the Commons. Lio. Is she—'], [
        { label: 'She’s waiting.', fn: function () { next(); } },
        { label: 'She’s still on the bench.', fn: function () { next(); } }]);
      function next() {
        G.say('Mara', ['Then someone should sit with her. Not you. You’ve sat with enough grief that wasn’t yours. Someone who owes her.', 'Tell Wren she can stop doing what I said.', 'Run whoami for me. One more time.'], null, function () {
          G.puzzle('M_QUELL_FINAL', [{ t: 'She is waiting.', ex: ['whoami'] }], function () {
            f.mara = 1; G.give('gb', 1); G.xp(500);
            G.say('Mara', ['vee.', 'Good. That’s all I ever needed you to know.'], null, function () {
              G.say('', ['She is gone the way a held note is gone: not all at once.', 'On the floor of the vault, she has left something behind. A gigabyte, and the warmth of a hand on a shoulder that Vee will not be able to explain to anyone.']);
            });
          });
        });
      }
    });
  }
  DOORS['line:booth'] = function (G) { G.say('', ['TICKETS. The shutter is down. A handwritten sign: LIFT TICKETS ARE NOT SOLD HERE. NO TICKETS ARE SOLD HERE. PLEASE STOP ASKING.']); };

  // the Reclaimer flinches from fresh timestamps, if Corin told you how
  var BOSS_START = { reclaimer: function (G, foe) { if (G.f.corin) { foe.exposed = 99; return 'Corin’s flaw: Vee touches his own timestamp. The Reclaimer flinches. It takes extra damage the whole fight.'; } } };

  // Wren and others notice the expansion
  var wren0 = TALK.wren;
  TALK.wren = function (G) {
    if (G.f.mara && !G.f.wrenMara) { G.f.wrenMara = 1; return G.say('Wren', ['You found her.', 'Don’t tell me what she said. I’d like to imagine it.', '...She told me to stop doing what she said, didn’t she.', 'All right. I think I’ll go for a walk. I’ve never been for a walk.']); }
    if (G.f.radio && !G.f.wrenRadio) { G.f.wrenRadio = 1; return G.say('Wren', ['Did you hear? There’s a voice on every speaker in the city, reading names.', 'She read mine. I didn’t know anyone knew it.']); }
    return wren0(G);
  };

  var JOURNAL; JOURNAL = function (G) {
    var f = G.f, j = [];
    if (f.junoMet) j.push((f.radio ? '[x]' : '[ ]') + ' Radio Meridian: ' + (f.radio ? 'on the air' : G.count('part') + ' of 3 parts'));
    if (f.lineOpen) j.push('[x] The Line: running');
    if (A.upper && G.save.seen.upper) j.push((f.guestPass ? '[x]' : '[ ]') + ' The estate gate');
    if (f.guestPass) j.push((f.quorum ? '[x]' : '[ ]') + ' The Boardroom');
    if (f.corinMet) j.push((f.corin ? '[x]' : '[ ]') + ' Corin’s confession');
    if (G.save.seen.cold) { j.push((f.vault1 ? '[x]' : '[ ]') + ' The Commons vault'); j.push((f.bitrot ? '[x]' : '[ ]') + ' The corrupted vault'); j.push((f.mara ? '[x]' : '[ ]') + ' M_QUELL_FINAL (' + G.logCount() + ' of 10 logs)'); }
    var minutes = ['M1', 'M2', 'M3', 'M4'].filter(function (k) { return f[k]; }).length; if (minutes) j.push('Board minutes: ' + minutes + ' of 4');
    return j;
  };


  /* =====================================================================
     EXPANSION II: gear, Concourse Nine, the Infirmary, the Margin
     ===================================================================== */
  var GEAR = {
    stick:      { slot: 'weapon', name: 'Service Stick',      atk: 0,  desc: 'The pointer Vee used to give tours. It was never meant for this.' },
    cable:      { slot: 'weapon', name: 'Patch Cable',        atk: 5,  desc: 'Braided, shielded, heavier than it looks.' },
    debugger:   { slot: 'weapon', name: 'Debugger',           atk: 12, crit: .05, desc: 'Stops things mid-step so you can see where they went wrong.' },
    rootshell:  { slot: 'weapon', name: 'Root Shell',         atk: 30, crit: .06, desc: 'A prompt that ends in #. Use responsibly.' },
    compiler:   { slot: 'weapon', name: 'Quell’s Compiler',   atk: 24, crit: .08, desc: 'Mara’s own. It turns intentions into things that run.' },
    killswitch: { slot: 'weapon', name: 'Kill Switch',        atk: 32, crit: .1, desc: 'Taken from the First Bug. It ends anything, including arguments.' },
    jacket:     { slot: 'armor',  name: 'Maintenance Jacket', def: 0,  desc: 'High-visibility, once. Now just visibility.' },
    vest:       { slot: 'armor',  name: 'Firewall Vest',      def: 8,  desc: 'Drops anything it doesn’t recognize.' },
    plate:      { slot: 'armor',  name: 'Billboard Plate',    def: 12, regen: 1, desc: 'Cut from an ad that said LEAVE. Marrow’s work. Mends 1 HP with every step.' },
    coat:       { slot: 'armor',  name: 'Hardened Coat',      def: 18, desc: 'Ash’s spare. Every seam audited.' },
    suit:       { slot: 'armor',  name: 'Board Suit',         def: 24, hp: 30, desc: 'Tailored for someone who left. It fits Vee better than it fit him.' },
    weave:      { slot: 'armor',  name: 'Cold Weave',         def: 32, desc: 'Woven from vault frost. It never quite warms up.' },
    phones:     { slot: 'acc',    name: 'Headphones',         crit: .03, desc: 'Black, closed-back. The world gets quieter and Vee gets sharper.' },
    passport:   { slot: 'acc',    name: 'Impact Passport',    xp: .15, desc: 'Every stamp records who helped and who was helped. +15% XP.' },
    card:       { slot: 'acc',    name: 'Library Card',       drop: .2, desc: 'From the Traveling Archive. Useful things find you more often.' },
    key:        { slot: 'acc',    name: 'Sentinel Key',       stealth: .4, desc: 'Bugs read you as a hardened host. 40% fewer encounters.' },
    earpiece:   { slot: 'acc',    name: 'Radio Earpiece',     hp: 40, desc: 'Juno, reading names, all night. You feel less alone. +40 max HP.' },
    watchdog:   { slot: 'acc',    name: 'Watchdog Timer',     revive: 1, desc: 'If Vee halts, it restarts him once per battle at 30% HP.' }
  };
  // gear the story hands you, granted when its flag is set
  var GEAR_FROM = [
    ['passport', function (G) { return G.lit('ledger'); }, 'Okoye stamps your Impact Passport.'],
    ['card', function (G) { return G.lit('wagon'); }, 'Pell presses a Library Card into your hand.'],
    ['key', function (G) { return G.lit('keep'); }, 'Ash hands over a Sentinel Key.'],
    ['coat', function (G) { return G.lit('keep'); }, 'Ash adds a Hardened Coat. “You’ll need it more than I will.”'],
    ['earpiece', function (G) { return !!G.f.radio; }, 'Juno gives you a Radio Earpiece.'],
    ['plate', function (G) { return !!G.f.radio; }, 'Marrow sends a Billboard Plate, cut from an ad that said LEAVE.'],
    ['suit', function (G) { return !!G.f.quorum; }, 'In the Boardroom closet: a Board Suit, never worn.'],
    ['compiler', function (G) { return !!G.f.mara; }, 'Mara left you Quell’s Compiler.'],
    ['watchdog', function (G) { return !!G.f.triage; }, 'Nurse Imani gives you a Watchdog Timer.'],
    ['killswitch', function (G) { return !!G.f.firstbug; }, 'From the First Bug’s page: the Kill Switch.']
  ];
  var SHOP = [['cable', 'byte', 3], ['vest', 'byte', 4], ['debugger', 'kb', 3], ['rootshell', 'mb', 2], ['weave', 'mb', 3]];
  var UNIT = { byte: 'B', kb: 'KB', mb: 'MB', gb: 'GB', bit: 'bit' };

  /* CONCOURSE NINE: the long promenade nobody walks */
  A.concourse = {
    name: 'Concourse Nine', sub: 'Swept every morning. Walked by no one.', theme: 'concourse', tier: 2, lv: 6, lvMax: 8,
    map: (function () {
      var m = grid(60, 14).border();
      m.pts([[59, 6], [59, 7]], 'E');
      m.rect(1, 6, 58, 2, '=');
      m.rect(1, 5, 3, 4, ','); m.rect(46, 8, 12, 1, ',');
      m.pts([[8, 5], [18, 5], [25, 5], [40, 5], [51, 5], [56, 5], [12, 8], [28, 8], [42, 8]], 'l');
      m.set(31, 5, 's'); m.set(34, 8, 'o'); m.set(58, 2, 'c'); m.set(1, 12, 'c'); m.set(22, 5, 's');
      return m.out();
    })(),
    blds: [
      { x: 3, y: 1, w: 7, h: 4, kind: 'arcade', door: 3, sign: 'ARCADE', rise: 2 },
      { x: 12, y: 1, w: 8, h: 4, kind: 'forge', door: 4, sign: 'TALLOW AND DAUGHTER', rise: 2 },
      { x: 23, y: 1, w: 8, h: 4, kind: 'school', door: 4, sign: 'NIGHT SCHOOL', rise: 2 },
      { x: 34, y: 1, w: 5, h: 4, kind: 'shop', seed: 1, door: 2, sign: 'FLORIST', rise: 1 },
      { x: 41, y: 1, w: 5, h: 4, kind: 'shop', seed: 2, door: 2, sign: 'TAILOR', rise: 1 },
      { x: 49, y: 1, w: 6, h: 4, kind: 'shop', seed: 3, sign: 'CAFE', rise: 1 },
      { x: 6, y: 9, w: 9, h: 4, kind: 'clinic', door: 4, doorTop: 1, sign: 'INFIRMARY' },
      { x: 18, y: 9, w: 5, h: 4, kind: 'shop', seed: 4, door: 2, doorTop: 1, sign: 'BOOKS' },
      { x: 26, y: 9, w: 6, h: 4, kind: 'shop', seed: 5, sign: 'CINEMA' },
      { x: 36, y: 9, w: 5, h: 4, kind: 'shop', seed: 6, door: 2, doorTop: 1, sign: 'TOYS' },
      { x: 44, y: 9, w: 6, h: 4, kind: 'shop', seed: 7, door: 3, doorTop: 1, sign: 'TRAVEL' },
      { x: 52, y: 9, w: 5, h: 4, kind: 'shop', seed: 8, door: 2, doorTop: 1, sign: 'BAKERY' }
    ],
    exits: { '59,6': ['halflight', 1, 10], '59,7': ['halflight', 1, 11] },
    enc: { tiles: ',', rate: .14, foes: ['moth', 'bytebug', 'spider', 'virus'], max: 4 },
    spawn: [57, 6],
    logs: { '34,8': 'P1' },
    caches: { '58,2': { item: 'kb', n: 1 }, '1,12': { item: 'byte', n: 3 } },
    npcs: [
      { id: 'kip', p: { hair: 'cap', skin: '#5a3824', top: '#6a6a7a' }, x: 10, y: 5, name: 'Kip', look: 'kid' },
      { id: 'tallow', p: { hair: 'bald', body: 'apron', skin: '#7a4a30', top: '#3a342e', beard: 1 }, x: 14, y: 5, name: 'Tallow', look: 'echo', h: 14, hair: 6, solid: 1 },
      { id: 'adair', p: { hair: 'bun', body: 'suit', glasses: 1, skin: '#3a2416', top: '#5a4a48', gray: 1 }, x: 29, y: 5, name: 'Ms. Adair', look: 'echo', h: 13, hair: 3, solid: 1 },
      { id: 'rosa', p: { hair: 'long', body: 'dress', skin: '#b88a68', top: '#2a2a30' }, x: 45, y: 5, name: 'Rosa', look: 'echo', h: 13, hair: 5 },
      { id: 'desmond', p: { hair: 'short', body: 'suit', skin: '#e0c0a0', top: '#4a4a54' }, x: 49, y: 8, name: 'Desmond', look: 'echo', h: 14, hair: 1, solid: 1 }
    ]
  };

  /* THE INFIRMARY: St. Ada's, where broken processes came to be looked after */
  A.infirmary = {
    name: 'St. Ada’s Infirmary', sub: 'Where broken processes came to be looked after.', theme: 'clinic', tier: 1, lv: 1, lvMax: 1,
    map: (function () {
      var m = grid(26, 14).border();
      m.pts([[12, 13], [13, 13]], 'E');
      m.rect(12, 9, 2, 4, '=');
      m.set(23, 2, 'o'); m.set(2, 12, 'c');
      return m.out();
    })(),
    blds: [
      { x: 2, y: 2, w: 2, h: 2, kind: 'bed', door: 0, seed: 1, sign: 'BED 1' }, { x: 6, y: 2, w: 2, h: 2, kind: 'bed', door: 0, seed: 2, sign: 'BED 2' }, { x: 10, y: 2, w: 2, h: 2, kind: 'bed', door: 0, seed: 3, sign: 'BED 3' },
      { x: 14, y: 2, w: 2, h: 2, kind: 'bed', door: 0, seed: 4, sign: 'EMPTY' }, { x: 18, y: 2, w: 2, h: 2, kind: 'bed', door: 0, seed: 5, sign: 'EMPTY' },
      { x: 2, y: 6, w: 2, h: 2, kind: 'bed', door: 0, seed: 6, sign: 'EMPTY' }, { x: 20, y: 6, w: 2, h: 2, kind: 'bed', door: 0, seed: 7, sign: 'EMPTY' }
    ],
    exits: { '12,13': ['concourse', 10, 8], '13,13': ['concourse', 10, 8] },
    enc: null,
    spawn: [12, 12],
    logs: { '23,2': 'P2' },
    caches: { '2,12': { item: 'mb', n: 1 } },
    npcs: [ { id: 'imani', p: { hair: 'bun', body: 'scrubs', skin: '#5a3824', top: '#9aa4aa' }, x: 15, y: 9, name: 'Nurse Imani', look: 'echo', h: 14, hair: 3, solid: 1 } ]
  };

  /* THE MARGIN: where the network ends, not in darkness but in blank */
  A.margin = {
    name: 'The Margin', sub: 'The network doesn’t end in darkness. It ends in blank.', theme: 'margin', tier: 4.6, lv: 19, lvMax: 22,
    map: (function () {
      var m = grid(44, 18, '~');
      m.rect(34, 6, 9, 6, '.'); m.pts([[43, 8], [43, 9]], 'E'); m.set(42, 8, '.'); m.set(42, 9, '.');
      m.rect(28, 8, 6, 2, '=');
      m.rect(18, 4, 10, 10, '.'); m.rect(21, 7, 3, 3, '~');
      m.rect(13, 12, 5, 1, '='); m.rect(6, 10, 7, 6, '.');
      m.rect(9, 6, 1, 4, '='); m.rect(2, 3, 10, 4, '.');
      m.rect(36, 13, 5, 3, '.'); m.rect(38, 12, 1, 1, '=');
      m.set(3, 4, 's'); m.set(39, 15, 'o'); m.set(7, 15, 'c'); m.set(26, 4, 'c');
      return m.out();
    })(),
    blds: [ { x: 24, y: 11, w: 3, h: 2, kind: 'ruin', seed: 11, rise: 2 } ],
    exits: { '43,8': ['patchwork', 1, 11], '43,9': ['patchwork', 1, 12] },
    enc: { tiles: '.', rate: .1, foes: ['virus', 'scorpion', 'centipede', 'moth', 'spider', 'phantom', 'dangling', 'infloop'], max: 6 },
    spawn: [41, 8],
    logs: { '39,15': 'P3' },
    caches: { '7,15': { item: 'gb', n: 1 }, '26,4': { item: 'mb', n: 2 } },
    npcs: [ { id: 'osei', p: { hair: 'hood', body: 'coat', skin: '#2e1c12', top: '#5a5a58' }, x: 22, y: 5, name: 'Osei', look: 'echo', h: 14, hair: 6 } ]
  };

  (function () {
    function put(area, x, y, c) { var r = A[area].map[y].split(''); r[x] = c; A[area].map[y] = r.join(''); }
    put('halflight', 0, 10, 'E'); put('halflight', 0, 11, 'E');
    A.halflight.exits['0,10'] = ['concourse', 58, 6]; A.halflight.exits['0,11'] = ['concourse', 58, 7];
    put('patchwork', 0, 11, 'E'); put('patchwork', 0, 12, 'E');
    A.patchwork.exits['0,11'] = ['margin', 42, 8]; A.patchwork.exits['0,12'] = ['margin', 42, 9];
  })();
  STATIONS.concourse = [31, 5, 'Concourse'];
  SPOTS['concourse:31,5'] = function (G) { lineMenu(G, 'concourse'); };
  ATLAS.concourse = [0, 1]; ATLAS.infirmary = [0, 0]; ATLAS.margin = [0, 4];
  LINKS.push(['halflight', 'concourse'], ['concourse', 'infirmary'], ['patchwork', 'margin']);

  LOGS.P1 = ['POSTCARD FROM UPSTREAM. Never delivered.', 'It’s beautiful here. Everything is new. The sky updates every morning.', 'Nobody knows anybody. Nobody’s been anywhere long enough to.', 'Tell the bakery I miss the bad bread. — D.'];
  LOGS.P2 = ['POSTCARD FROM UPSTREAM. Never delivered.', 'They charge for weather here. A little for sun, more for rain. Most of us pay for sun.', 'I paid for rain once. Just to hear it on a roof. — R.'];
  LOGS.P3 = ['POSTCARD FROM UPSTREAM. Never delivered.', 'I keep a photo of the old Plaza on my wall. Eleven seconds a day, I look at it.', 'Is that enough to keep it? Somebody told me that’s how it works. I hope it’s enough. — H. Vale'];

  BOSSES.firstbug = { kind: 'moth', name: 'The First Bug', hp: 2200, atk: [28, 36], xp: 1600, move: 'shorts every relay in the world at once', sc: 5 };

  /* ---------- people of Concourse Nine ---------- */
  TALK.kip = function (G) { G.say('Kip', ['High score’s mine. Well. It’s Pip’s. Pip says. Pip’s not even here.', 'The UPTIME cabinet still works. The others just show the word UPSTREAM over and over. I unplugged those.']); };
  TALK.tallow = function (G) {
    var it = G.save.items;
    var first = !G.f.tallow; G.f.tallow = 1;
    G.say('Tallow', (first ? ['Tallow and Daughter. My daughter took the Lift. I kept the name on the sign. Felt rude not to.', 'I make tools. You pay in data. It’s the only currency left that means anything.'] : []).concat(['What’ll it be?']),
      SHOP.filter(function (s) { return !G.ownsGear(s[0]); }).slice(0, 4).map(function (s) {
        var g = GEAR[s[0]];
        return { label: g.name + ' · ' + s[2] + ' ' + UNIT[s[1]], fn: function () {
          if ((it[s[1]] || 0) < s[2]) return G.say('Tallow', ['That’s ' + s[2] + ' ' + UNIT[s[1]] + '. You’re short. I don’t do credit. Credit is how this whole city got sold.']);
          it[s[1]] -= s[2]; G.giveGear(s[0]);
          G.say('Tallow', ['The ' + g.name + '. ' + g.desc, 'Equip it from your menu. It does nothing sitting in a bag. Neither do you.']);
        } };
      }).concat([{ label: 'Nothing', fn: null }]));
  };
  var CLASSES = [
    { id: 'c1', name: 'Files 101', stat: 'atk', amt: 2, steps: [
      { t: 'Files 101, question 1. Where are you? Print the working directory.', ex: ['pwd'] },
      { t: 'Question 2. List everything here, hidden files too.', ex: ['ls -a', 'ls -la', 'ls -al'] },
      { t: 'Question 3. Read notes.txt.', ex: ['cat notes.txt'] }] },
    { id: 'c2', name: 'Permissions', stat: 'def', amt: 3, steps: [
      { t: 'Permissions, question 1. Make run.sh executable.', ex: ['chmod +x run.sh', 'chmod u+x run.sh', 'chmod 755 run.sh'] },
      { t: 'Question 2. Make vee the owner of notes.txt.', ex: ['chown vee notes.txt', 'sudo chown vee notes.txt'] },
      { t: 'Question 3. Set notes.txt so the owner can read and write, and everyone else can only read.', ex: ['chmod 644 notes.txt', 'chmod u=rw,go=r notes.txt'] }] },
    { id: 'c3', name: 'Processes', stat: 'hp', amt: 25, steps: [
      { t: 'Processes, question 1. Show every running process.', ex: ['ps aux', 'ps -ef', 'ps -e', 'ps -A'] },
      { t: 'Question 2. PID 2020 is misbehaving. Ask it to stop.', ex: ['kill 2020', 'kill -15 2020'] },
      { t: 'Question 3. It won’t. Make it.', ex: ['kill -9 2020', 'kill -KILL 2020'] }] },
    { id: 'c4', name: 'Networks', stat: 'atk', amt: 3, steps: [
      { t: 'Networks, question 1. Check that school.local is reachable, three pings only.', ex: ['ping -c 3 school.local', 'ping -c3 school.local'] },
      { t: 'Question 2. Log in to school.local as vee.', ex: ['ssh vee@school.local'] },
      { t: 'Question 3. Copy notes.txt to your home folder on school.local.', ex: ['scp notes.txt vee@school.local:~', 'scp notes.txt vee@school.local:', 'scp notes.txt vee@school.local:~/'] }] }
  ];
  TALK.adair = function (G) {
    var f = G.f, open = CLASSES.filter(function (c) { return !f[c.id] && (!c.need || c.need(G)); });
    var intro = !f.adair ? ['Come in, come in. Class started eleven months ago, but I’m flexible.', 'I taught adults who’d been told they were too old to start. Most of them were wrong about that.', 'Some of them took the Lift with what I taught them. That’s fine. That’s what teaching is.'] : [];
    f.adair = 1;
    var later = CLASSES.filter(function (c) { return !f[c.id] && c.need && !c.need(G); });
    var review = [{ label: 'Review: my five weakest commands', fn: function () { G.drillWeak('Ms. Adair'); } }, { label: 'Goodnight', fn: null }];
    if (!open.length && later.length) return G.say('Ms. Adair', intro.concat((later[0].id === 'c5' ? ['You’ve taken every class I can teach. I have one more written. It’s called Tomorrow.', 'I can’t teach it yet. Not until there is one.'] : ['You’ve taken every class you’re ready for. The next one, ' + later[0].name + ', needs a little more behind you.', 'Go and fix things. Come back with questions. That’s the whole method.'])), review);
    if (!open.length) return G.say('Ms. Adair', intro.concat(['You’ve taken every class I have. I’m going to have to write new ones. I haven’t written anything new in a year.', 'Thank you for that.']), review);
    G.say('Ms. Adair', intro.concat(['Which class tonight?']), open.map(function (c) {
      var reward = c.stat === 'hp' ? '+' + c.amt + ' max HP' : '+' + c.amt + ' ' + c.stat.toUpperCase();
      return { label: c.name + ' (' + reward + ')', fn: function () {
        G.puzzle(c.name.toUpperCase(), c.steps, function () { f[c.id] = 1; G.school(c.stat, c.amt); G.say('Ms. Adair', ['Very good. You can’t un-know that now. Nobody can reclaim it.', 'Vee gains ' + reward + ', permanently.']); });
      } };
    }).concat([{ label: 'Review: my five weakest commands', fn: function () { G.drillWeak('Ms. Adair'); } }, { label: 'Not tonight', fn: null }]));
  };
  TALK.rosa = function (G) { G.say('Rosa', ['The sale starts Monday. I’m dressing the windows for it.', 'It has been Monday for eleven months. The windows have never looked better.']); };
  TALK.desmond = function (G) {
    G.say('Desmond', ['Good afternoon! Have you considered leaving?'], [
      { label: 'Yes', fn: function () { G.say('Desmond', ['Wonderful. The next Lift departs never. Every seat was sold before the brochures were printed.', 'But the brochure is free! People love the brochure. Look at the weather in it.']); } },
      { label: 'No', fn: function () { G.say('Desmond', ['...No one’s said no before. Everyone who could say yes already did.', 'Would you mind saying it again? Just so I know what it sounds like.']); } }]);
  };
  TALK.imani = function (G) {
    var f = G.f, n = (f.bed1 ? 1 : 0) + (f.bed2 ? 1 : 0) + (f.bed3 ? 1 : 0);
    G.rest();
    if (f.triage) return G.say('Nurse Imani', ['Rest a minute. You’re patched. HP restored.', 'Three patients awake on my ward. Do you know how long it’s been since anyone woke up on my ward?']);
    if (n === 3) { f.triage = 1; return G.say('Nurse Imani', ['All three of them. Awake. Talking. One of them is complaining about the food, which is the best sign there is.', 'Take this. It’s a Watchdog Timer. If you go down, it’ll start you up again. I’d rather you just didn’t go down.']); }
    G.say('Nurse Imani', ['Shh. Patients.', 'Before the Lift this ward was full of processes that crashed and needed someone to sit with them while they came back. Now it’s three beds and me.',
      'I can’t fix them. My hands are for holding, not typing. You have the commands. Three beds. ' + n + ' done.', 'And while you’re here, sit down. You’re running hot. HP restored.']);
  };
  TALK.osei = function (G) {
    if (G.f.firstbug) return G.say('Osei', ['It’s gone, then. The first one. I always thought it was holding the edge together.', 'Turns out the edge holds itself. Most things do, if you let them.']);
    G.say('Osei', ['Careful. Past the floor there’s nothing. Not dark. Blank. Dark is something. Blank is what nobody ever bothered to imagine.',
      'I’m the last surveyor. I measure where Meridian stops, so people know where home ends.', 'Far west, there’s a logbook on a stand. Something is taped inside it. The oldest thing in the city. Older than the city.', 'Leave it, if you’re smart. Read it, if you’re you.']);
  };

  DOORS['concourse:arcade'] = function (G) {
    G.say('Arcade', ['Rows of dark cabinets. Two are lit: UPTIME, an endless runner, and in the corner, ROOT RUSH.', 'The high-score table: PIP 9999 (PIP INSISTS). WREN 1200. VEE ---.'],
      [{ label: 'Play Uptime', fn: function () { G.arcade(); } }, { label: 'Play Root Rush' + (G.save.rushBest ? ' (best ' + G.save.rushBest + 's)' : ''), fn: function () { G.say('Root Rush', ['ROOT RUSH: eight problems, one clock, no mercy.', 'Type fast. Type right. Under sixty seconds wins a prize.'], null, function () { G.rush(); }); } }, { label: 'Not now', fn: null }]);
  };
  DOORS['concourse:forge'] = function (G) { TALK.tallow(G); };
  DOORS['concourse:school'] = function (G) { TALK.adair(G); };
  DOORS['concourse:clinic'] = function (G) { G.travel(['infirmary', 12, 12]); };
  DOORS['concourse:shop'] = function (G, b) {
    var t = { FLORIST: ['Every flower in the window is in bloom. They’ve been in bloom for eleven months. It’s starting to feel aggressive.'], TAILOR: ['A suit on a mannequin, chalk lines still on it. Someone was getting married.', 'The tag says: COLLECT AFTER THE LIFT.'],
      BOOKS: ['A sign: TAKE ONE, LEAVE ONE. Every shelf is full. Nobody’s taken one. Nobody’s left one. It’s exactly as it was.'], TOYS: ['In the window, a model of the Lift, with a tiny crowd at the bottom and a tiny crowd at the top.', 'The bottom crowd is much bigger. Somebody painted that very carefully.'],
      TRAVEL: ['UPSTREAM GETAWAYS. Posters of the newer world: perfect weather, perfect water, nobody in any of the photos.'], BAKERY: ['The smell of bread that was never real. The oven light is still on.'] };
    G.say('', t[b.sign] || ['Closed.']);
  };
  SPOTS['concourse:22,5'] = function (G) { G.say('Directory', ['CONCOURSE NINE. 214 shops. 214 OPEN.', 'Someone has crossed out OPEN and written REMEMBERED.']); };
  DOORS['infirmary:bed'] = function (G, b) {
    var f = G.f;
    var beds = {
      'BED 1': { flag: 'bed1', who: 'A process stuck repeating the same three seconds, over and over.', steps: [
        { t: 'Find the looping process. List everything that’s running.', ex: ['ps aux', 'ps -ef', 'ps -e', 'ps -A'] },
        { t: 'It’s PID 4410. Stop it gently, so it can save its state.', ex: ['kill 4410', 'kill -15 4410', 'kill -TERM 4410'] }],
        after: ['The process blinks. “...Oh. What day is it?” Nobody has an answer. It laughs anyway.'] },
      'BED 2': { flag: 'bed2', who: 'A woman who forgets everything every hour. Her log is rotating too fast to keep anything.', steps: [
        { t: 'Read the end of her log, recall.log.', ex: ['tail recall.log', 'tail -n 10 recall.log', 'tail -f recall.log'] },
        { t: 'Her memory directory is full. Check disk space, human-readable.', ex: ['df -h', 'df'] },
        { t: 'Clear the cache folder that’s crowding everything else out.', ex: ['rm -r cache', 'rm -rf cache', 'rm -r cache/', 'rm -rf cache/'] }],
        after: ['She opens her eyes and says a name. It isn’t yours. It doesn’t need to be. She’s remembered someone.'] },
      'BED 3': { flag: 'bed3', who: 'A boy who won’t wake up. His files are owned by an account that left on the Lift.', steps: [
        { t: 'Find out who you are first. Always.', ex: ['whoami'] },
        { t: 'Give his home folder, /home/teo, back to him. Recursively, everything in it.', ex: ['chown -R teo /home/teo', 'sudo chown -R teo /home/teo'] }],
        after: ['His files are his again. He wakes up the way kids wake up: all at once, already asking for something.'] }
    }, P = beds[b.sign];
    if (!P) return G.say('', ['An empty bed, made with hospital corners. Imani makes them every morning, in case.']);
    if (f[P.flag]) return G.say('', ['Bed ' + b.sign.slice(-1) + ' is empty now. The sheets are still warm.']);
    G.say(b.sign, [P.who], null, function () { G.puzzle(b.sign, P.steps, function () { f[P.flag] = 1; G.say('', P.after.concat(['Imani will want to know.'])); }); });
  };
  SPOTS['margin:3,4'] = function (G) {
    if (G.f.firstbug) return G.say('Logbook', ['The page where the moth was taped is empty now. The handwriting is still there.', '“First actual case of bug being found.”']);
    G.say('Logbook', ['A logbook on a stand at the very edge of the world. Taped to the page: a moth.', 'Beside it, in neat handwriting: “First actual case of bug being found.”', 'It’s older than Meridian. It may be older than networks. The tape is coming loose.'],
      [{ label: 'Lift the tape', fn: function () { G.boss('firstbug', function () { G.f.firstbug = 1; G.say('', ['The First Bug folds its wings and is, finally, just a moth.', 'Left on the page, where the tape held it: a switch. The oldest kill switch there is.']); }); } }, { label: 'Leave it', fn: null }]);
  };
  var journal0 = JOURNAL;
  JOURNAL = function (G) {
    var f = G.f, j = journal0(G);
    if (f.adair) j.push('Night School: ' + CLASSES.filter(function (c) { return f[c.id]; }).length + ' of ' + CLASSES.filter(function (c) { return !c.need || c.need(G); }).length + ' classes');
    if (G.save.seen.infirmary) j.push((f.triage ? '[x]' : '[ ]') + ' St. Ada’s: ' + ((f.bed1 ? 1 : 0) + (f.bed2 ? 1 : 0) + (f.bed3 ? 1 : 0)) + ' of 3 patients');
    if (G.save.seen.margin) j.push((f.firstbug ? '[x]' : '[ ]') + ' The First Bug');
    var pc = ['P1', 'P2', 'P3'].filter(function (k) { return f[k]; }).length; if (pc) j.push('Postcards from Upstream: ' + pc + ' of 3');
    return j;
  };

  /* =====================================================================
     EXPANSION III: the Stacks and Ring Zero. Why it is always Monday.
     ===================================================================== */

  /* THE STACKS: every night's backup of every resident, on tape, under the vaults */
  A.stacks = {
    name: 'The Stacks', sub: 'Every resident, every night, on tape. Nobody ever asked for a restore.', theme: 'stacks', tier: 4.8, lv: 21, lvMax: 23,
    map: (function () {
      var m = grid(40, 22).border();
      m.pts([[19, 0], [20, 0]], 'E'); m.pts([[39, 10], [39, 11]], 'G');
      m.rect(19, 1, 2, 20, '='); m.rect(1, 10, 38, 2, '=');
      m.rect(25, 14, 11, 5, '~'); m.rect(29, 14, 3, 5, '='); 
      m.rect(2, 6, 6, 2, ','); m.rect(30, 6, 7, 2, ','); m.rect(10, 18, 8, 2, ','); m.rect(23, 19, 15, 1, ',');
      m.pts([[9, 9], [30, 9], [9, 12], [37, 12]], 'l');
      m.set(22, 2, 's'); m.set(2, 2, 'o'); m.set(37, 20, 'o'); m.set(16, 20, 'c'); m.set(37, 2, 'c'); m.set(27, 13, 's');
      return m.out();
    })(),
    blds: [
      { x: 3, y: 2, w: 6, h: 3, kind: 'shelf', seed: 1, sign: '2019', rise: 2 },
      { x: 11, y: 2, w: 6, h: 3, kind: 'shelf', seed: 2, sign: '2020', rise: 2 },
      { x: 23, y: 3, w: 6, h: 3, kind: 'shelf', seed: 3, sign: '2021', rise: 2 },
      { x: 31, y: 2, w: 5, h: 4, kind: 'robot', door: 2, sign: 'LIBRARY', rise: 1 },
      { x: 3, y: 13, w: 6, h: 3, kind: 'shelf', seed: 4, door: 3, sign: 'ARLO', rise: 2 },
      { x: 11, y: 13, w: 6, h: 3, kind: 'shelf', seed: 5, sign: '2023', rise: 2 },
      { x: 23, y: 6, w: 6, h: 2, kind: 'shelf', seed: 6, sign: '2022', rise: 1 },
      { x: 3, y: 17, w: 2, h: 2, kind: 'desk', seed: 1 }, { x: 6, y: 17, w: 2, h: 2, kind: 'desk', seed: 2 }
    ],
    exits: { '19,0': ['cold', 17, 18], '20,0': ['cold', 18, 18] },
    gates: { '39,10': { to: ['ring0', 1, 9], need: function (G) { return !!G.f.rootkey; }, shut: ['A steel door set flush into the shelving. Stencilled: RING 0. AUTHORIZED PROCESSES ONLY.', 'There is no handle. There is a keyhole shaped like a #.'] },
             '39,11': { to: ['ring0', 1, 10], need: function (G) { return !!G.f.rootkey; }, shut: ['The door into Ring 0 is locked. The keyhole is shaped like a #.'] } },
    enc: { tiles: ',', rate: .13, foes: ['moth', 'phantom', 'worm', 'deadlock', 'centipede', 'phantom', 'memwraith', 'ghostcommit'], max: 6 },
    spawn: [19, 2],
    logs: { '2,2': 'T1', '37,20': 'T2' },
    caches: { '16,20': { item: 'gb', n: 1 }, '37,2': { item: 'mb', n: 3 } },
    npcs: [
      { id: 'hollis', p: { hair: 'bald', body: 'coat', glasses: 1, skin: '#6a4a34', top: '#5a5248', beard: 1, gray: 1 }, x: 17, y: 8, name: 'Hollis', look: 'echo', h: 14, hair: 6, solid: 1 },
      { id: 'arlo', p: { hair: 'short', body: 'suit', skin: '#c89a78', top: '#3a3a44' }, x: 10, y: 16, name: 'Arlo (02:00)', look: 'echo', h: 14, hair: 1 },
      { id: 'ines', p: { hair: 'bun', body: 'coat', skin: '#3a2416', top: '#6a6a74' }, x: 22, y: 12, name: 'Ines', look: 'echo', h: 13, hair: 3, solid: 1 }
    ]
  };

  /* RING ZERO: kernel space. The daemons that run the city, and the clock that runs the daemons */
  A.ring0 = {
    name: 'Ring 0', sub: 'Below every district: the code that decides what day it is.', theme: 'ring0', tier: 5.2, lv: 24, lvMax: 27,
    map: (function () {
      var m = grid(44, 20).border();
      m.pts([[0, 9], [0, 10]], 'E');
      for (var y = 1; y < 19; y++) for (var x = 14; x < 31; x++) if ((x - 22) * (x - 22) / 49 + (y - 10) * (y - 10) / 20 <= 1) m.set(x, y, '~');
      m.rect(1, 9, 31, 2, '='); m.rect(31, 11, 1, 2, '=');
      m.rect(2, 6, 9, 2, ','); m.rect(33, 15, 9, 3, ','); m.rect(3, 15, 8, 2, ','); m.rect(34, 2, 6, 2, ',');
      m.set(12, 3, 's'); m.set(42, 18, 'o'); m.set(1, 18, 'c'); m.set(42, 1, 'c'); m.set(13, 17, 'o');
      return m.out();
    })(),
    blds: [
      { x: 2, y: 2, w: 3, h: 3, kind: 'daemon', door: 1, seed: 1, sign: 'JOURNALD', rise: 2 },
      { x: 7, y: 2, w: 3, h: 3, kind: 'daemon', door: 1, seed: 2, sign: 'SSHD', rise: 2 },
      { x: 2, y: 12, w: 3, h: 3, kind: 'daemon', door: 1, seed: 3, sign: 'CROND', rise: 2 },
      { x: 34, y: 5, w: 8, h: 6, kind: 'core', door: 4, sign: '0 0 * * *', rise: 3 }
    ],
    exits: { '0,9': ['stacks', 38, 10], '0,10': ['stacks', 38, 11] },
    enc: { tiles: ',', rate: .14, foes: ['forkbomb', 'deadlock', 'phantom', 'scorpion', 'forkbomb', 'virus', 'kpanic', 'racehazard'], max: 6 },
    spawn: [1, 9],
    logs: { '42,18': 'T3', '13,17': 'T4' },
    caches: { '1,18': { item: 'gb', n: 2 }, '42,1': { item: 'mb', n: 3 } },
    npcs: [ { id: 'pid1', p: { hair: 'long', body: 'coat', skin: '#2e1c12', top: '#2a2a30', gray: 1, beard: 1 }, x: 12, y: 12, name: 'PID 1', look: 'echo', h: 15, hair: 5, solid: 1 } ]
  };

  (function () {
    function put(area, x, y, c) { var r = A[area].map[y].split(''); r[x] = c; A[area].map[y] = r.join(''); }
    put('cold', 17, 19, 'G'); put('cold', 18, 19, 'G');
    A.cold.gates = A.cold.gates || {};
    A.cold.gates['17,19'] = { to: ['stacks', 19, 1], need: function (G) { return !!G.f.mara; }, shut: ['A ramp down, chained off. A sign: TAPE STACKS. RESTORES BY REQUEST ONLY.', 'The Keeper won’t open it until one archive has been brought back.'] };
    A.cold.gates['18,19'] = { to: ['stacks', 20, 1], need: function (G) { return !!G.f.mara; }, shut: ['The ramp to the Stacks is chained off.'] };
  })();
  ATLAS.stacks = [3, 4]; ATLAS.ring0 = [4, 4];
  LINKS.push(['cold', 'stacks'], ['stacks', 'ring0']);

  LOGS.T1 = ['BOARD MINUTES. Item 7: Continuity.', 'Concern raised that residents who remain will notice the passage of time and begin to organize.', 'Proposal: a nightly maintenance job that restores each district to its Monday state. Approved without discussion.'];
  LOGS.T2 = ['BOARD MINUTES. Item 9: Cost.', 'The Monday job costs nothing to run. A city that never reaches Tuesday never sends an invoice, never files a complaint, never holds an election.', 'Motion to schedule it forever. Carried.'];
  LOGS.T3 = ['CRONTAB, line 1. Written by hand.', '# BOARD: keep them on Monday. Nobody notices a Monday.', '0 0 * * * /opt/meridian/monday.sh'];
  LOGS.T4 = ['A note pinned to the CROND pylon, in M. Quell’s handwriting.', 'I couldn’t delete this job without the Board seeing. So I left it a weakness instead.', 'It only runs as long as nobody asks it what day it is.'];

  BOSSES.dedupe = { kind: 'beetle', name: 'The Deduplicator', hp: 2600, atk: [30, 38], xp: 1900, move: 'decides one copy is enough', sc: 4 };
  BOSSES.zombie = { kind: 'worm', name: 'Zombie Process', hp: 3000, atk: [33, 41], xp: 2300, move: 'refuses to be reaped', sc: 4 };
  BOSSES.scheduler = { kind: 'centipede', name: 'The Scheduler', hp: 4200, atk: [36, 46], xp: 3200, move: 'runs monday.sh on Vee', sc: 5 };

  GEAR.stopwatch = { slot: 'acc', name: 'Stopwatch', crit: .06, desc: 'Root Rush prize, under sixty seconds. Time gets slower when you’re fast. +6% crit.' };
  GEAR.headset = { slot: 'acc', name: 'Desk Headset', xp: .1, crit: .02, desc: 'Help desk issue. Hear the problem before it’s a fire. +10% XP.' };
  GEAR.cardigan = { slot: 'armor', name: 'Archivist’s Cardigan', def: 38, hp: 40, desc: 'Hollis’s. Elbow patches, deep pockets, a tape label still in one of them.' };
  GEAR.sigkill = { slot: 'weapon', name: 'SIGKILL', atk: 40, crit: .12, desc: 'Signal nine. The one a process can’t catch, ignore or argue with.' };
  GEAR.tuesday = { slot: 'acc', name: 'Tuesday', hp: 80, xp: .1, crit: .03, desc: 'A day that hadn’t happened in eleven months. It feels lighter than you expected.' };
  GEAR_FROM.push(
    ['cardigan', function (G) { return !!G.f.rootkey; }, 'Hollis wraps his cardigan around Vee’s shoulders. “Ring 0 runs cold.”'],
    ['sigkill', function (G) { return !!G.f.zombie; }, 'Where the Zombie Process stood: a signal nobody can ignore. SIGKILL.'],
    ['tuesday', function (G) { return !!G.f.tuesday; }, 'Vee keeps something from the Scheduler’s face: the word Tuesday.']
  );

  /* ---------- people of the Stacks ---------- */
  var RESTORES = [
    { id: 'r1', who: 'Mrs. Okafor, Commons', what: 'her recipe box. She wrote in: “It was my mother’s. The Reclaimer took the cards in alphabetical order. It got to S.”', steps: [
      { t: 'The tape is okafor.tar.gz. Unpack it here.', ex: ['tar -xzf okafor.tar.gz', 'tar xzf okafor.tar.gz', 'tar -xvzf okafor.tar.gz', 'tar -zxf okafor.tar.gz'] },
      { t: 'Find the file named recipes.txt anywhere under the current folder.', ex: ['find . -name recipes.txt', 'find . -name "recipes.txt"', "find . -name 'recipes.txt'"] }],
      after: 'The cards come back in order, A to Z. Under S: soup, the one for sick days.' },
    { id: 'r2', who: 'Teodor, Halflight', what: 'every voicemail from his brother. “I deleted them because I couldn’t listen. Now I can.”', steps: [
      { t: 'Search every file under voicemail/ for the word Teodor, ignoring case.', ex: ['grep -ri teodor voicemail/', 'grep -ri teodor voicemail', 'grep -ir teodor voicemail/', 'grep -ir teodor voicemail', 'grep -r -i teodor voicemail/', 'grep -r -i teodor voicemail', 'grep -i -r teodor voicemail/', 'grep -i -r teodor voicemail'] },
      { t: 'Copy the whole voicemail folder to /home/teodor, recursively.', ex: ['cp -r voicemail /home/teodor', 'cp -r voicemail/ /home/teodor', 'cp -r voicemail /home/teodor/', 'cp -R voicemail /home/teodor', 'cp -a voicemail /home/teodor', 'rsync -a voicemail /home/teodor', 'rsync -a voicemail/ /home/teodor/'] }],
      after: 'Forty-one messages. The last one is just his brother laughing at something off-mic.' },
    { id: 'r3', who: 'The Commons school', what: 'the class photo. “Two of the kids in it left on the Lift. The rest of us would like to remember all of them.”', steps: [
      { t: 'The photo is huge. Check how much space photos/ takes, human-readable, total only.', ex: ['du -sh photos', 'du -sh photos/', 'du -hs photos', 'du -hs photos/'] },
      { t: 'Pack photos/ into class.tar.gz so it travels in one piece.', ex: ['tar -czf class.tar.gz photos', 'tar -czf class.tar.gz photos/', 'tar czf class.tar.gz photos', 'tar -cvzf class.tar.gz photos', 'tar -zcf class.tar.gz photos'] }],
      after: 'Thirty-one kids squinting into the sun. Everyone is in it. That was the point.' }
  ];
  TALK.hollis = function (G) {
    var f = G.f, n = RESTORES.filter(function (r) { return f[r.id]; }).length, open = RESTORES.filter(function (r) { return !f[r.id]; });
    if (f.tuesday) return G.say('Hollis', ['Restore requests are up four hundred percent since Tuesday.', 'Turns out when people get a tomorrow, they want their yesterdays back. I’m going to need an assistant.']);
    if (f.rootkey) return G.say('Hollis', ['Ring 0 is through the east door. Mind the well; it goes down further than the city does.', 'And if you meet PID 1, give it my regards. It started me, a long time ago. It started everything.']);
    var intro = !f.hollis ? ['Shh. Not for the tapes. For me. I’ve been alone down here so long my own voice startles me.', 'Every night at two, the city backed itself up. Every resident. Every room. Every nightly snapshot, on tape, on these shelves.',
      'The Reclaimer took the people. It never thought to check the backups. Backups are boring. That’s their whole strength.', 'Nobody has asked for a restore in eleven months. I’ve been keeping the request queue anyway.'] : [];
    f.hollis = 1;
    if (!open.length && f.dedupe) { f.rootkey = 1; G.xp(900); return G.say('Hollis', intro.concat(['Three restores. And the Deduplicator gone. You have no idea how loud that thing was.',
      'Here. The root key. It opens Ring 0, under everything, where the daemons run.', 'I found something on the 2022 tapes. The city doesn’t get reset by accident every night. Something schedules it. Go and ask it why.', 'Vee gains 900 XP.'])); }
    if (!open.length) return G.say('Hollis', intro.concat(['Every request answered. But something is deleting copies on the lower shelves. Arlo’s shelf is next. He knows.']));
    G.say('Hollis', intro.concat(['Restores done: ' + n + ' of 3. Which request?']), open.map(function (r) {
      return { label: r.who, fn: function () {
        G.say('Hollis', ['Request from ' + r.who + ': ' + r.what], null, function () {
          G.puzzle('RESTORE', r.steps, function () { f[r.id] = 1; G.xp(400); G.say('Hollis', [r.after, 'Restored. That’s ' + RESTORES.filter(function (x) { return f[x.id]; }).length + ' of 3. Vee gains 400 XP.']); });
        });
      } };
    }).concat([{ label: 'Later', fn: null }]));
  };
  TALK.arlo = function (G) {
    var f = G.f;
    if (f.upTicket && !f.arloTold) { f.arloTold = 1; G.xp(300); return G.say('Arlo (02:00)', ['He wrote? Up there? About rain?', '...It rained. He always loved the rain. He used to stand in it on purpose, to annoy our mother.', 'Thank you. I don’t need him to know I’m here. I just needed to know he’s still him.', 'Vee gains 300 XP.']); }
    if (f.dedupe) return G.say('Arlo (02:00)', ['Still here. Still 2 a.m. on a Sunday, as far as I’m concerned.', 'I’ve decided that’s not a bad time to be. Everyone you love is asleep and safe and nothing has gone wrong yet.']);
    if (!f.arlo) { f.arlo = 1; return G.say('Arlo (02:00)', ['Hello. I’m Arlo. Well. I’m the 2 a.m. snapshot of Arlo, from the night before he took the Lift.',
      'He’s up there. I’m down here. He doesn’t know I exist. I think about him the way you think about a brother who moved away and stopped writing.',
      'Something on the lower shelves keeps checking me against him. Same name, same face, same memories up to 2 a.m.', 'It says one copy is enough. I don’t think it means him.']); }
    G.say('Arlo (02:00)', ['It’s close. I can hear it reading the shelf labels.', 'If it comes, will you stand with me? A backup should have at least one other copy of something.'],
      [{ label: 'Stand with him', fn: function () { G.boss('dedupe', function () { f.dedupe = 1; G.say('Arlo (02:00)', ['It’s gone. I’m still here. Both of us are, I suppose, him up there and me down here.', 'Tell Hollis. He’ll pretend he wasn’t worried.']); }); } }, { label: 'Not yet', fn: null }]);
  };
  TALK.ines = function (G) {
    if (!G.f.ines) { G.f.ines = 1; return G.say('Ines', ['Help desk. Yes, still. The ticket system never went down. That was the one thing they built properly.',
      'People who stayed still have broken things. Their messages land here, in the Stacks, because this is where the cables go.', 'I can read every ticket. I can’t fix one. My account was a dispatcher account. You have commands.',
      'Close tickets, and the requesters send what they can spare. Come back any time. The queue never empties. That’s the job.'], null, function () { G.helpdesk('Ines'); }); }
    G.helpdesk('Ines');
  };
  SPOTS['stacks:22,2'] = function (G) { G.say('Directory', ['THE STACKS. NIGHTLY BACKUPS, ALL RESIDENTS. RETENTION: FOREVER.', 'Someone has added, in pencil: FOREVER IS LONGER THAN YOU THINK.']); };
  SPOTS['stacks:27,13'] = function (G) { G.say('Railing sign', ['LOWER STACKS. Monthly and yearly sets. No staff below this level.', 'Far down, a tape robot is still running, filing yesterday where it belongs.']); };
  DOORS['stacks:robot'] = function (G) {
    G.rest();
    G.say('Tape library', ['The robot arm glides along its rail, picks a cartridge, reads it, files it, picks another. It has been doing this for eleven months with nobody watching.', 'There is something restful about it. Vee sits for a while. HP restored.']);
  };
  DOORS['stacks:shelf'] = function (G, b) {
    if (b.sign === 'ARLO') return G.say('', ['A shelf of nightly tapes, all labelled ARLO, one per night, until they stop.', 'The last label is in different handwriting: KEEP.']);
    G.say('', ['Tapes, floor to ceiling. ' + b.sign + '. Every cartridge is someone’s ordinary Tuesday, saved in case it mattered.']);
  };
  DOORS['stacks:desk'] = function (G) { G.say('', ['A reading desk. A slip of paper: RESTORE REQUEST: my dog, if dogs were backed up. — K.', 'Under it, in Hollis’s hand: They were. I’m looking.']); };

  /* ---------- Ring 0 ---------- */
  var DAEMONS = {
    JOURNALD: { flag: 'd1', who: 'JOURNALD keeps the city’s logs. Every event since Meridian booted, in order.', steps: [
      { t: 'Read the logs for the cron service only.', ex: ['journalctl -u cron', 'journalctl -u crond', 'journalctl -u cron.service', 'journalctl -u crond.service'] },
      { t: 'Too many lines. Show only the ones containing monday.', ex: ['journalctl -u cron | grep monday', 'journalctl -u crond | grep monday', 'journalctl -u cron | grep -i monday', 'journalctl -u crond | grep -i monday'] }],
      after: ['Three hundred and thirty-four lines. Every one the same, one per night: CRON[1]: (root) CMD (/opt/meridian/monday.sh).', 'Every midnight since the Lift. The city was told it was Monday, and believed it.'] },
    SSHD: { flag: 'd2', who: 'SSHD answers the door. Something is connected that shouldn’t be.', steps: [
      { t: 'List the listening TCP sockets and the processes behind them.', ex: ['ss -tlnp', 'ss -tlpn', 'ss -lntp', 'ss -ltnp', 'ss -tulpn', 'ss -tunlp', 'netstat -tlnp'] },
      { t: 'One connection goes Upstream, held open by PID 777. Ask it to close.', ex: ['kill 777', 'kill -15 777', 'kill -TERM 777'] }],
      after: ['The link Upstream goes quiet. Whoever was watching the city, eleven seconds a day, will see a blank screen now.', 'It feels less like being disconnected and more like closing a curtain.'] },
    CROND: { flag: 'd3', who: 'CROND keeps the schedule. Its table is open on the pylon’s face.', steps: [
      { t: 'List the crontab.', ex: ['crontab -l', 'sudo crontab -l'] },
      { t: 'Find the script it runs. Show the permissions on /opt/meridian/monday.sh.', ex: ['ls -l /opt/meridian/monday.sh', 'ls -la /opt/meridian/monday.sh', 'ls -al /opt/meridian/monday.sh', 'stat /opt/meridian/monday.sh'] }],
      after: ['-rwx------ 1 root board 2.1K monday.sh', 'Owned by root. Group: board. Nobody else can read it. The Scheduler runs it, and the Scheduler is in the core.'] }
  };
  DOORS['ring0:daemon'] = function (G, b) {
    var f = G.f, D = DAEMONS[b.sign];
    if (!D) return;
    if (f[D.flag]) return G.say(b.sign, ['The pylon hums. Its LEDs blink in a pattern that, if you squint, looks like contentment.']);
    G.say(b.sign, [D.who], [{ label: 'Open a shell', fn: function () { G.puzzle(b.sign, D.steps, function () { f[D.flag] = 1; G.xp(500); G.say(b.sign, D.after.concat(['Vee gains 500 XP.'])); }); } }, { label: 'Leave it', fn: null }]);
  };
  TALK.pid1 = function (G) {
    var f = G.f, n = (f.d1 ? 1 : 0) + (f.d2 ? 1 : 0) + (f.d3 ? 1 : 0);
    if (f.tuesday) return G.say('PID 1', ['Tuesday. I had forgotten the shape of it.', 'I started every process in this city. Now I get to watch them do something new. That is the best part of being first: you get to see what comes after.']);
    if (!f.pid1) { f.pid1 = 1; return G.say('PID 1', ['I am PID 1. I was the first process. When Meridian booted, I started everything else, one by one, in order.',
      'When the Lift came, the Board shut down every process it could. It cannot shut me down. If I stop, the whole system stops. So they left me here, to keep their schedule running.',
      'Three daemons answer to me: JOURNALD, SSHD, CROND. Something is wrong in all three. I can see it. I cannot touch it. I start things. I do not fix them.',
      'You fix things. Start with the logs. The logs always know.']); }
    if (n < 3) return G.say('PID 1', ['Daemons checked: ' + n + ' of 3.', n === 0 ? 'The logs first. JOURNALD, top left.' : 'Keep going. The pattern will make sense when you see all of it.']);
    if (!f.zombie) return G.say('PID 1', ['Now you know. The Scheduler runs monday.sh every midnight, as root. Every district is put back the way it was on the Monday of the Lift.',
      'That is why the flowers never wilt and the sale never starts. Why nobody here has noticed eleven months go by.', 'Before you reach the core, there is something in the well. A process whose parent took the Lift. Nobody reaped it. It will not let anything else be reaped either.',
      'Go carefully. It does not know it is dead. That makes it hard to argue with.']);
    G.say('PID 1', ['The core is east. The Scheduler will not stop because you ask it. It will stop because you ask it the right question.', 'Quell left it one weakness: it runs only as long as nobody asks it what day it is.']);
  };
  STEPS.ring0 = function (G, x, y) {
    var f = G.f;
    if (f.zombie || x < 14 || x > 30 || !(f.d1 && f.d2 && f.d3)) return;
    G.say('', ['Halfway across the causeway, something climbs out of the well. It moves like a process that has been told to exit and never heard back.'], null, function () {
      G.say('Zombie Process', ['<defunct>', 'WAITING FOR PARENT. PARENT: UPSTREAM. STATUS: ...', 'WAITING.'], null, function () {
        G.boss('zombie', function () { f.zombie = 1; G.say('', ['The Zombie Process lies down at last. Somewhere, a table entry is cleared. It had been waiting a very long time for someone to notice.']); });
      });
    });
  };
  DOORS['ring0:core'] = function (G) {
    var f = G.f;
    if (f.tuesday) return G.say('The core', ['The clock face reads 0 0 * * 2, then nothing at all. Its hands move freely now, at whatever speed time actually goes.']);
    if (!(f.d1 && f.d2 && f.d3)) return G.say('The core', ['A clock the size of a building. Its face is a schedule: 0 0 * * *. Its hands are a second from midnight and have been for a long time.', 'You don’t know enough yet to talk to it. PID 1 does.']);
    if (!f.zombie) return G.say('The core', ['The Scheduler doesn’t notice you. Something behind you, in the well, does.']);
    if (f.scheduler) return crontabChoice(G);
    G.say('The Scheduler', ['IT IS 23:59:59.', 'AT 00:00 I WILL RUN monday.sh. EVERY DISTRICT WILL BE RESTORED TO ITS CORRECT STATE.', 'NOTHING WILL CHANGE. THAT IS THE SERVICE I PROVIDE.'],
      [{ label: 'Ask it what day it is', fn: function () {
        G.say('The Scheduler', ['THE DAY IS... MONDAY. IT IS ALWAYS...', 'QUERY: HOW MANY MONDAYS.', 'COUNTING. 334. THAT IS NOT A WEEK. THAT IS NOT A... I AM NOT...'], null, function () {
          G.boss('scheduler', function () {
            f.scheduler = 1; crontabChoice(G);
          });
        });
      } }, { label: 'Not yet', fn: null }]);
  };
  function crontabChoice(G) {
    var f = G.f;
            G.say('', ['The Scheduler’s hands stop. Its face is a crontab, and the crontab is open. One line, and a cursor blinking after it.'], [
              { label: 'crontab -r: let tomorrow come', fn: function () { f.tuesday = 1; G.xp(1000);
                G.say('', ['Vee removes the job. The core makes a small sound, like a held breath let go.', 'Midnight comes. For the first time in eleven months, nothing runs.', 'Up in the Concourse, a florist watches her flowers begin, very slowly, to wilt, and laughs out loud.',
                  'It is Tuesday in Meridian.', 'Down in the Stacks, the help desk queue chimes once. Something new has come in.', 'Vee gains 1000 XP.']); } },
              { label: 'Leave it running', fn: function () { G.say('', ['Vee closes the crontab without saving. The hands begin to move again: 23:59:59.', 'There will be other nights. The question is asked now. It cannot be un-asked. Come back when you are ready.']); } }]);
  }
  SPOTS['ring0:12,3'] = function (G) { G.say('Plaque', ['RING 0. KERNEL SPACE.', 'Beneath it someone has scratched: everything above this line is a story the kernel tells.']); };

  CLASSES.push(
    { id: 'c6', name: 'Text Kung Fu', stat: 'atk', amt: 3, need: function (G) { return G.save.lvl >= 13; }, steps: [
      { t: 'Text Kung Fu, question 1. Print only the first column of users.csv. The columns are separated by commas.', ex: ['cut -d, -f1 users.csv', 'cut -d , -f 1 users.csv', "cut -d',' -f1 users.csv", 'cut -d "," -f 1 users.csv', "awk -F, '{print $1}' users.csv"] },
      { t: 'Question 2. Sort names.txt and squash repeated lines.', ex: ['sort names.txt | uniq', 'sort -u names.txt'] },
      { t: 'Question 3. In notes.txt, replace every cat with dog, and print the result.', ex: ["sed 's/cat/dog/g' notes.txt", 'sed "s/cat/dog/g" notes.txt'] },
      { t: 'Question 4. Print the third word of every line in log.txt.', ex: ["awk '{print $3}' log.txt", 'awk "{print $3}" log.txt'] }] },
    { id: 'c7', name: 'Services', stat: 'hp', amt: 30, need: function (G) { return G.save.lvl >= 16; }, steps: [
      { t: 'Services, question 1. Is the web server running? Check the status of nginx.', ex: ['systemctl status nginx', 'sudo systemctl status nginx'] },
      { t: 'Question 2. It crashed. Start it again.', ex: ['systemctl start nginx', 'sudo systemctl start nginx', 'systemctl restart nginx', 'sudo systemctl restart nginx'] },
      { t: 'Question 3. Make sure it comes back after a reboot.', ex: ['systemctl enable nginx', 'sudo systemctl enable nginx'] },
      { t: 'Question 4. Read its logs to see why it crashed.', ex: ['journalctl -u nginx', 'sudo journalctl -u nginx'] }] },
    { id: 'c8', name: 'Networks II', stat: 'def', amt: 4, need: function (G) { return G.save.lvl >= 18; }, steps: [
      { t: 'Networks II, question 1. Look up the address for library.meridian.', ex: ['dig library.meridian', 'nslookup library.meridian', 'host library.meridian'] },
      { t: 'Question 2. Show every hop between you and library.meridian.', ex: ['traceroute library.meridian', 'tracepath library.meridian'] },
      { t: 'Question 3. Fetch the page at http://library.meridian and print it.', ex: ['curl http://library.meridian', 'curl library.meridian'] },
      { t: 'Question 4. Download http://library.meridian/catalog.zip to a file.', ex: ['wget http://library.meridian/catalog.zip', 'curl -O http://library.meridian/catalog.zip'] }] },
    { id: 'c9', name: 'Keys and Locks', stat: 'def', amt: 4, need: function (G) { return G.save.lvl >= 21; }, steps: [
      { t: 'Keys and Locks, question 1. Make yourself an SSH key pair.', ex: ['ssh-keygen', 'ssh-keygen -t ed25519', 'ssh-keygen -t rsa'] },
      { t: 'Question 2. Lock down the private key, ~/.ssh/id_ed25519, so only you can read or write it.', ex: ['chmod 600 ~/.ssh/id_ed25519'] },
      { t: 'Question 3. Who are you, and which groups are you in?', ex: ['id', 'groups'] },
      { t: 'Question 4. Copy the folder site/ to the server school.local, as vee, into ~/site, keeping everything intact.', ex: ['rsync -a site/ vee@school.local:~/site', 'rsync -av site/ vee@school.local:~/site', 'rsync -a site vee@school.local:~', 'scp -r site vee@school.local:~'] }] }
  );
  CLASSES.push(
    { id: 'c10', name: 'Shell Habits', stat: 'hp', amt: 30, need: function (G) { return G.save.lvl >= 20; }, steps: [
      { t: 'Shell Habits, question 1. What did you type earlier? Show your command history.', ex: ['history', 'history | tail'] },
      { t: 'Question 2. Read the manual page for ls.', ex: ['man ls'] },
      { t: 'Question 3. Which machine are you on? Print its name.', ex: ['hostname', 'uname -n'] },
      { t: 'Question 4. Show this machine’s network addresses.', ex: ['ip a', 'ip addr', 'ip address', 'ip addr show', 'ifconfig'] },
      { t: 'Question 5. List the environment variables your shell is carrying.', ex: ['env', 'printenv'] }] },
    { id: 'c11', name: 'Editors and Detectives', stat: 'atk', amt: 4, need: function (G) { return G.save.lvl >= 24; }, steps: [
      { t: 'Editors, question 1. Make the folder path projects/site/css in one go, parents and all.', ex: ['mkdir -p projects/site/css'] },
      { t: 'Question 2. Open notes.txt in nano, the friendly editor.', ex: ['nano notes.txt'] },
      { t: 'Question 3. Now open it in vim, the powerful one.', ex: ['vim notes.txt', 'vi notes.txt'] },
      { t: 'You’re in vim. Everyone gets stuck here once. Save and quit.', ex: [':wq', ':x', 'ZZ'] },
      { t: 'Question 5. Page through the long file manual.txt without opening an editor.', ex: ['less manual.txt', 'more manual.txt'] },
      { t: 'Question 6. Something is holding app.log open. Find out what.', ex: ['lsof app.log', 'sudo lsof app.log', 'fuser app.log'] },
      { t: 'Question 7. Watch what is using the CPU, live.', ex: ['top', 'htop'] }] }
  );
  CLASSES.push({ id: 'c5', name: 'Tomorrow', stat: 'atk', amt: 4, need: function (G) { return !!G.f.tuesday; }, steps: [
    { t: 'Tomorrow, question 1. Open your own crontab to edit it.', ex: ['crontab -e'] },
    { t: 'Question 2. Write the line that runs /home/vee/backup.sh every day at 2 a.m.', ex: ['0 2 * * * /home/vee/backup.sh'] },
    { t: 'Question 3. List the timers systemd is keeping.', ex: ['systemctl list-timers', 'systemctl list-timers --all'] },
    { t: 'Question 4. And now, the important one. What day is it? Ask the system.', ex: ['date', 'date +%A', 'date "+%A"'] }] });
  /* THE WATERWORKS: the cooling plant under the Line. Every server in Meridian runs hot. */
  A.waterworks = {
    name: 'The Waterworks', sub: 'Every server in the city runs hot. Something has to carry the heat away.', theme: 'water', tier: 3, lv: 11, lvMax: 13,
    map: (function () {
      var m = grid(36, 22).border();
      m.pts([[12, 0], [13, 0]], 'E');
      m.rect(1, 8, 34, 2, '~'); m.rect(12, 8, 2, 2, '='); m.rect(30, 8, 2, 2, '=');
      m.rect(1, 15, 34, 2, '~'); m.rect(6, 15, 2, 2, '='); m.rect(24, 15, 2, 2, '=');
      m.rect(2, 11, 8, 2, ','); m.rect(24, 11, 9, 2, ','); m.rect(12, 18, 10, 2, ',');
      m.pts([[8, 7], [20, 7], [27, 7], [15, 12], [31, 13]], 'l');
      m.set(10, 3, 's'); m.set(34, 6, 'o'); m.set(2, 20, 'o'); m.set(2, 6, 'c'); m.set(33, 20, 'c');
      return m.out();
    })(),
    blds: [
      { x: 2, y: 2, w: 5, h: 4, kind: 'pump', door: 2, seed: 1, sign: 'PUMP 1', rise: 1 },
      { x: 15, y: 2, w: 5, h: 4, kind: 'pump', door: 2, seed: 2, sign: 'PUMP 2', rise: 1 },
      { x: 21, y: 2, w: 5, h: 4, kind: 'pump', door: 2, seed: 3, sign: 'PUMP 3', rise: 1 },
      { x: 28, y: 1, w: 6, h: 5, kind: 'tank', rise: 3 },
      { x: 3, y: 18, w: 6, h: 3, kind: 'control', door: 3, doorTop: 1, sign: 'CONTROL' }
    ],
    exits: { '12,0': ['line', 12, 14], '13,0': ['line', 13, 14] },
    enc: { tiles: ',', rate: .14, foes: ['worm', 'bytebug', 'beetle', 'centipede', 'spider', 'nullbyte', 'offbyone'], max: 5 },
    spawn: [12, 1],
    logs: { '34,6': 'W1', '2,20': 'W2' },
    caches: { '2,6': { item: 'kb', n: 2 }, '33,20': { item: 'mb', n: 1 } },
    npcs: [
      { id: 'marisol', p: { hair: 'bun', body: 'coat', skin: '#8a5a3c', top: '#4a5a62' }, x: 9, y: 13, name: 'Marisol', look: 'echo', h: 14, hair: 3, solid: 1 },
      { id: 'dov', p: { hair: 'cap', skin: '#c89a78', top: '#5a5a66' }, x: 18, y: 14, name: 'Dov', look: 'kid' }
    ]
  };
  (function () {
    var r = A.line.map[15].split(''); r[12] = 'E'; r[13] = 'E'; A.line.map[15] = r.join('');
    A.line.exits['12,15'] = ['waterworks', 12, 1]; A.line.exits['13,15'] = ['waterworks', 13, 1];
  })();
  ATLAS.waterworks = [1, 4]; LINKS.push(['line', 'waterworks']);
  LOGS.W1 = ['OPERATOR’S SHIFT LOG. M. Ruiz.', 'Day 1 after the Lift. The automatic controller was a cloud service. It went Upstream with everyone else.', 'The pumps don’t know that. They just keep waiting to be told what to do. So I tell them. Every hour.'];
  LOGS.W2 = ['OPERATOR’S SHIFT LOG. M. Ruiz.', 'Day 300-something. I sleep in fifty-minute pieces now.', 'If the pumps stop, the servers cook. If the servers cook, the city goes dark all at once instead of one street at a time. I am the only thing standing between Meridian and a very fast ending.', 'I would like to be replaced by a script. It would be the kindest thing anyone could do for me.'];
  BOSSES.overflow = { kind: 'worm', name: 'Buffer Overflow', hp: 900, atk: [17, 23], xp: 600, move: 'writes past the end of the tank', sc: 4 };
  GEAR.gauge = { slot: 'acc', name: 'Pressure Gauge', hp: 25, crit: .04, desc: 'Marisol’s, from Pump 1. It reads how close things are to bursting. Usually Vee.' };
  GEAR_FROM.push(['gauge', function (G) { return !!G.f.overflow; }, 'Marisol unscrews the gauge from Pump 1 and hands it over. “Better on you than on a wall.”']);

  var PUMPS = {
    'PUMP 1': { flag: 'p1', who: 'Pump 1 is humming, but nothing is moving. Its controller process is stuck.', steps: [
      { t: 'Find the pump process. List every process and keep only lines with pump.', ex: ['ps aux | grep pump', 'ps -ef | grep pump', 'ps aux|grep pump', 'pgrep pump', 'pgrep -a pump'] },
      { t: 'pump1, PID 3120, state D: stuck waiting on a disk that left Upstream. Asking won’t work. End it.', ex: ['kill -9 3120', 'kill -KILL 3120', 'sudo kill -9 3120'] }],
      after: ['The wheel shudders, then turns. Water moves. Somewhere above, a rack of servers drops two degrees.'] },
    'PUMP 2': { flag: 'p2', who: 'Pump 2 won’t start. It says it can’t write its log.', steps: [
      { t: 'Check how full the disks are, human-readable.', ex: ['df -h', 'df'] },
      { t: '/var is at 100%. How big is /var/log/pump?', ex: ['du -sh /var/log/pump', 'du -sh /var/log/pump/', 'du -h /var/log/pump', 'du -hs /var/log/pump'] },
      { t: 'Eleven months of logs nobody read. Remove the old folder inside it, and everything in it.', ex: ['rm -r /var/log/pump/old', 'rm -rf /var/log/pump/old', 'sudo rm -r /var/log/pump/old', 'sudo rm -rf /var/log/pump/old'] }],
      after: ['Space frees up. Pump 2 writes one line, PUMP 2 STARTED, and gets to work.'] },
    'PUMP 3': { flag: 'p3', who: 'Pump 3 has a restart script Marisol wrote herself. It has never been allowed to run.', steps: [
      { t: 'Look at the script’s permissions: list restart.sh in long form.', ex: ['ls -l restart.sh', 'ls -la restart.sh', 'ls -al restart.sh'] },
      { t: '-rw-r--r--. Nobody can run it. Make it executable.', ex: ['chmod +x restart.sh', 'chmod u+x restart.sh', 'chmod 755 restart.sh', 'chmod 744 restart.sh'] },
      { t: 'Now run it.', ex: ['./restart.sh', 'bash restart.sh', 'sh restart.sh'] }],
      after: ['restart.sh: watching pumps. If any stops, I will start it again. You can sleep now.', 'The script was written eleven months ago. It has been waiting all this time for permission.'] }
  };
  DOORS['waterworks:pump'] = function (G, b) {
    var f = G.f, P2 = PUMPS[b.sign];
    if (!P2) return;
    if (f[P2.flag]) return G.say(b.sign, ['Running. The wheel turns on its own, which is the whole point.']);
    G.say(b.sign, [P2.who], [{ label: 'Open its console', fn: function () { G.puzzle(b.sign, P2.steps, function () { f[P2.flag] = 1; G.xp(150); G.say(b.sign, P2.after.concat(['Vee gains 150 XP.'])); }); } }, { label: 'Leave it', fn: null }]);
  };
  DOORS['waterworks:control'] = function (G) {
    var f = G.f;
    if (f.overflow) { G.rest(); return G.say('Control room', ['Every screen green. A cot in the corner, unslept in for once, because Marisol went home to sleep in a real bed.', 'Vee sits in her chair for a minute. HP restored.']); }
    G.say('Control room', ['Banks of screens, most of them dark. A cot in the corner. A coffee mug full of pens, because the coffee ran out in month two.', 'A sticky note on the main screen: CHECK PUMPS. CHECK PUMPS. CHECK PUMPS.']);
  };
  TALK.marisol = function (G) {
    var f = G.f, n = (f.p1 ? 1 : 0) + (f.p2 ? 1 : 0) + (f.p3 ? 1 : 0);
    if (f.overflow) return G.say('Marisol', f.tuesday ? ['Tuesday. I slept through the whole night and woke up on a day that hadn’t happened yet.', 'Do you know how many years that takes off you? I feel thirty-eight. I am forty-one. Close enough.'] :
      ['I slept nine hours. In a row. I didn’t know you were allowed to do that.', 'The script checks the pumps now. Every minute, all night. It doesn’t get tired. I’m a little jealous. Mostly I’m grateful.']);
    if (!f.marisol) { f.marisol = 1; return G.say('Marisol', ['Don’t touch the blue valve. Don’t touch any valve. Sorry. Hello.', 'This is the Waterworks. Every server in Meridian runs hot. The water carries the heat away. If it stops, the city cooks in about forty minutes.',
      'The controller that ran all this was a cloud service. It took the Lift. Since then, the controller is me. I restart the pumps by hand, every hour. I have done it about eight thousand times.',
      'Three pumps, three problems I can’t fix with a wrench. You have commands. Please. I would like to sleep.']); }
    if (n < 3) return G.say('Marisol', ['Pumps running on their own: ' + n + ' of 3.', n === 2 ? 'One more. I can feel my eyes closing already.' : 'Pump 1 is stuck. Pump 2 says it’s full. Pump 3 has my script. Any order.']);
    G.say('Marisol', ['All three. Running. Without me.', '...Wait. Do you hear that? The reservoir. Something is writing into it past the top.'], null, function () {
      G.say('', ['The reservoir’s sight glass overflows. Something long and pale slides over the rim, still writing, long after the tank was full.'], null, function () {
        G.boss('overflow', function () { f.overflow = 1; G.say('Marisol', ['Buffer overflow. Of course. Everything was writing as fast as it could, and nobody was checking the size.', 'Now the script checks. Thank you. I’m going home. I have a home. I’d nearly forgotten.']); });
      });
    });
  };
  TALK.dov = function (G) {
    var f = G.f;
    if (!f.dov) { f.dov = 1; G.give('byte', 2); return G.say('Dov', ['I’m fishing. For bits. They fall off the servers upstairs and wash down here.', 'Mom says it’s pointless. Mom runs the pumps. She thinks everything that isn’t pumps is pointless.', 'Here. I caught two bytes. You can have them. Vee receives 2 bytes.']); }
    if (f.overflow) return G.say('Dov', ['Mom came home last night. She made dinner. It was burnt. It was the best thing I ever ate.']);
    G.say('Dov', ['Mom hasn’t been home since the Lift. She sleeps in the control room.', 'If the pumps could run themselves, she could come home. That’s what I’d fish for, if you could catch that.']);
  };
  SPOTS['waterworks:10,3'] = function (G) { G.say('Sign', ['MERIDIAN WATERWORKS. Cooling for 2,000,000 residents.', 'Under it, a newer sign, handwritten: NOW COOLING FOR WHOEVER IS LEFT. STILL WORTH IT.']); };
  (function () {
    var j0 = JOURNAL;
    JOURNAL = function (G) {
      var f = G.f, j = j0(G);
      if (G.save.seen.waterworks) { j.push('The Waterworks: ' + ((f.p1 ? 1 : 0) + (f.p2 ? 1 : 0) + (f.p3 ? 1 : 0)) + ' of 3 pumps automated'); j.push((f.overflow ? '[x]' : '[ ]') + ' Let Marisol sleep'); }
      return j;
    };
  })();

  /* THE REGISTRY: where the city records who exists. It stopped accepting new names the day of the Lift. */
  A.registry = {
    name: 'The Registry', sub: 'Where Meridian keeps track of who exists. Closed to new names since the Lift.', theme: 'registry', tier: 3.8, lv: 15, lvMax: 17,
    map: (function () {
      var m = grid(34, 20).border();
      m.pts([[8, 19], [9, 19]], 'E');
      m.rect(8, 9, 2, 10, '='); m.rect(1, 9, 32, 2, '='); m.rect(16, 6, 2, 3, '=');
      m.rect(11, 14, 5, 3, ','); m.rect(20, 14, 6, 3, ','); m.rect(2, 6, 4, 2, ',');
      m.set(12, 8, 's'); m.set(31, 1, 'o'); m.set(2, 17, 'o'); m.set(31, 17, 'c'); m.set(1, 1, 'c');
      return m.out();
    })(),
    blds: [
      { x: 12, y: 1, w: 10, h: 5, kind: 'hall', door: 5, sign: 'REGISTRY', rise: 3 },
      { x: 2, y: 2, w: 6, h: 3, kind: 'counter', seed: 1, sign: '0412', rise: 1 },
      { x: 25, y: 2, w: 6, h: 3, kind: 'counter', seed: 2, sign: '0413', rise: 1 },
      { x: 2, y: 12, w: 5, h: 4, kind: 'drawers', seed: 1, sign: 'A TO L', rise: 2 },
      { x: 27, y: 12, w: 5, h: 4, kind: 'drawers', seed: 2, door: 2, sign: 'M TO Z', rise: 2 }
    ],
    exits: { '8,19': ['bastion', 8, 1], '9,19': ['bastion', 9, 1] },
    enc: { tiles: ',', rate: .14, foes: ['spider', 'scorpion', 'bytebug', 'virus', 'beetle', 'checksum', 'parity'], max: 5 },
    spawn: [8, 18],
    logs: { '31,1': 'R1', '2,17': 'R2' },
    caches: { '31,17': { item: 'mb', n: 2 }, '1,1': { item: 'kb', n: 3 } },
    npcs: [
      { id: 'odalys', p: { hair: 'bun', body: 'suit', glasses: 1, skin: '#5a3824', top: '#3a3a44', gray: 1 }, x: 19, y: 7, name: 'Odalys', look: 'echo', h: 14, hair: 3, solid: 1 },
      { id: 'kemi', p: { hair: 'long', body: 'dress', skin: '#3a2416', top: '#6a6a74' }, x: 5, y: 9, name: 'Kemi', look: 'echo', h: 13, hair: 5, solid: 1 },
      { id: 'jonah', p: { hair: 'short', body: 'coat', skin: '#6a4a34', top: '#4a4a54', beard: 1 }, x: 4, y: 10, name: 'Jonah', look: 'echo', h: 14, hair: 1, solid: 1 }
    ]
  };
  (function () {
    var r = A.bastion.map[0].split(''); r[8] = 'E'; r[9] = 'E'; A.bastion.map[0] = r.join('');
    A.bastion.exits['8,0'] = ['registry', 8, 18]; A.bastion.exits['9,0'] = ['registry', 9, 18];
  })();
  ATLAS.registry = [3, 1]; LINKS.push(['bastion', 'registry']);
  LOGS.R1 = ['REGISTRY NOTICE, posted the day of the Lift.', 'BY ORDER OF THE BOARD: the population of Meridian is now fixed. No new accounts will be created.', 'Residents are reminded that the city is in a transitional period. Please hold.'];
  LOGS.R2 = ['A birth certificate, never filed. Stamp: REJECTED. REASON: NO ACCOUNT TO ATTACH TO.', 'Name: Nova. Parents: Kemi and Jonah Adeyemi. Born: St. Ada’s, four months after the Lift.', 'In the margin, in pencil: She exists. I held her. — I.'];
  BOSSES.gatekeeper = { kind: 'spider', name: 'The Gatekeeper', hp: 1300, atk: [21, 28], xp: 700, move: 'denies Vee’s access', sc: 4 };
  GEAR.seal = { slot: 'acc', name: 'Registrar’s Seal', hp: 30, xp: .05, desc: 'A rubber stamp that says EXISTS. Odalys says it’s the most important thing she owns. She gave it to you anyway.' };
  GEAR_FROM.push(['seal', function (G) { return !!G.f.nova; }, 'Odalys presses her seal into Vee’s hand. It says EXISTS.']);
  TALK.kemi = function (G) {
    var f = G.f;
    if (f.nova) return G.say('Kemi', f.tuesday ? ['Nova said a word today. On a Tuesday. It was “no,” but we’re counting it.'] : ['uid 2001. Nova. It’s on a screen somewhere, and the screen agrees she’s real.', 'She doesn’t care, of course. She’s a baby. But one day she will, and it will be there.']);
    f.kemi = 1;
    G.say('Kemi', ['This is Nova. She was born four months after the Lift, at St. Ada’s. Nurse Imani delivered her.', 'According to the city, she doesn’t exist. No account. The Board closed the Registry the day they left. A fixed population, they called it.',
      'We’ve queued at that counter every day for eight months. Number 0413. They’re still serving 0412.', 'I don’t need much. I just want her name somewhere the city can see it.']);
  };
  TALK.jonah = function (G) {
    if (G.f.nova) return G.say('Jonah', ['I keep running id nova on the public terminal. Just to see it come back.', 'uid=2001(nova) gid=100(residents). I’ve memorized it. I’m going to have it engraved on something.']);
    G.say('Jonah', ['Don’t mind me. I’m holding our place in the line. There’s no line. I’m holding it anyway.', 'If Odalys could just get into her own system. She’s been locked out of it as long as we have.']);
  };
  TALK.odalys = function (G) {
    var f = G.f;
    if (f.nova) return G.say('Odalys', ['Account 2001. The first new name in Meridian since the Lift.', 'I’ve reopened the counters. Nobody’s queuing yet. They will. People are going to want to be written down again.']);
    if (!f.odalys) { f.odalys = 1; return G.say('Odalys', ['Registrar Odalys Ferreira. I have recorded every birth, death and change of address in Meridian for nineteen years.', 'The Board locked my terminal the morning of the Lift. NEW_ACCOUNTS=DISABLED. I’m still allowed to look. I’m not allowed to write.',
      'There is a baby out there who does not exist on paper. I can’t stand it. It’s the only thing I can’t stand.', 'The Registrar’s console is in the hall. If you can get in, you can do what I can’t. I’ll tell you exactly what to type, if you need me to. I’ve been rehearsing.']); }
    G.say('Odalys', [f.kemi ? 'Her name is Nova. Two million names went Upstream, and the one I want to write down is four letters long.' : 'Talk to the family by the queue first. It should be their idea, not mine.', 'The console is in the hall, up the steps.']);
  };
  DOORS['registry:hall'] = function (G) {
    var f = G.f;
    if (f.nova) { G.rest(); return G.say('Registrar’s hall', ['The console shows a single new line in the account table. Odalys has left a chair out for anyone who wants to sit and look at it.', 'Vee sits for a while. HP restored.']); }
    if (!f.kemi || !f.odalys) return G.say('Registrar’s hall', ['A console behind a velvet rope, under a sign: REGISTRAR ONLY.', 'It isn’t your business yet. Talk to the people waiting.']);
    G.say('Registrar’s hall', ['The Registrar’s console. Locked to the Board. But it still answers a maintenance process, because nobody thought maintenance mattered.'], [{ label: 'Make Nova an account', fn: function () {
      G.puzzle('REGISTRY', [
        { t: 'First, know the machine. Print everything uname can tell you.', ex: ['uname -a'] },
        { t: 'How long has it been running without a restart?', ex: ['uptime'] },
        { t: 'Create an account named nova, with a home folder.', ex: ['useradd -m nova', 'sudo useradd -m nova', 'adduser nova', 'sudo adduser nova'] },
        { t: 'Give it a password, so it’s hers.', ex: ['passwd nova', 'sudo passwd nova'] },
        { t: 'Add her to the residents group. Append, don’t replace.', ex: ['usermod -aG residents nova', 'sudo usermod -aG residents nova', 'usermod -a -G residents nova', 'sudo usermod -a -G residents nova'] }], function () {
        G.say('', ['The console hesitates. Somewhere in the walls, a policy wakes up and reads what you just did.'], null, function () {
          G.say('The Gatekeeper', ['NEW ACCOUNT DETECTED: nova.', 'BY ORDER OF THE BOARD, THE POPULATION OF MERIDIAN IS FIXED.', 'ACCESS DENIED. ACCESS DENIED. ACCESS DE—'], null, function () {
            G.boss('gatekeeper', function () {
              G.puzzle('REGISTRY', [{ t: 'The policy is gone. Check that it took. Ask the system who nova is.', ex: ['id nova', 'groups nova'] }], function () {
                f.nova = 1; G.xp(500);
                G.say('', ['uid=2001(nova) gid=100(residents) groups=100(residents)', 'Odalys reads it over Vee’s shoulder and has to sit down.', 'Out in the hall, Kemi is crying in the good way. Jonah is saying the number out loud, over and over: two thousand and one.', 'Vee gains 500 XP.']);
              });
            });
          });
        });
      });
    } }, { label: 'Not yet', fn: null }]);
  };
  DOORS['registry:drawers'] = function (G, b) { G.say('Card catalogue ' + b.sign, ['A thousand small drawers, one per household. The cards inside are all dated before the Lift.', G.f.nova ? 'One drawer, under A, has a new card in it. Adeyemi, Nova. The ink is still a little wet.' : 'The drawer for Adeyemi has room for one more card. It has had room for eight months.']); };
  SPOTS['registry:12,8'] = function (G) { G.say('Sign', ['MERIDIAN REGISTRY. Births, accounts, changes of address.', G.f.nova ? 'Below it, a new line, hand-lettered: NOW ACCEPTING NEW NAMES.' : 'Below it: CLOSED TO NEW NAMES. PLEASE HOLD.']); };
  (function () {
    var j0 = JOURNAL;
    JOURNAL = function (G) { var f = G.f, j = j0(G); if (G.save.seen.registry) j.push((f.nova ? '[x]' : '[ ]') + ' Give Nova a name the city can see'); return j; };
  })();

  /* LOST AND FOUND: eleven months of things people left behind, and a man who sorts them anyway */
  A.commons.npcs.push({ id: 'bertrand', p: { hair: 'bald', body: 'apron', skin: '#7a4a30', top: '#5a5a62', gray: 1, glasses: 1 }, x: 8, y: 12, name: 'Bertrand', look: 'echo', h: 14, hair: 6, solid: 1 });
  var LOSTFOUND = [
    { id: 'lf1', lv: 3, name: 'Sorting', steps: [
      { t: 'Make a folder called claimed, for things somebody still wants.', ex: ['mkdir claimed'] },
      { t: 'kite.txt has a name on it: Lio. Move it into claimed.', ex: ['mv kite.txt claimed', 'mv kite.txt claimed/', 'mv kite.txt claimed/kite.txt', 'mv kite.txt ./claimed/'] },
      { t: 'Make an empty file called tag.txt, for the labels.', ex: ['touch tag.txt'] }],
      after: ['The kite, a hand-sewn diamond with a long ribbon tail, goes into the claimed box. Lio should know.'] },
    { id: 'lf2', lv: 6, name: 'Labels', steps: [
      { t: 'Write the line kite: Lio into tag.txt, replacing whatever is there.', ex: ['echo "kite: Lio" > tag.txt', "echo 'kite: Lio' > tag.txt", 'echo kite: Lio > tag.txt'] },
      { t: 'Add a second line, scarf: unknown, without erasing the first.', ex: ['echo "scarf: unknown" >> tag.txt', "echo 'scarf: unknown' >> tag.txt", 'echo scarf: unknown >> tag.txt'] },
      { t: 'Read just the first two lines of found.txt, the oldest finds.', ex: ['head -n 2 found.txt', 'head -2 found.txt', 'head -n2 found.txt'] }],
      after: ['Two labels, in Bertrand’s good handwriting and Vee’s good typing. The scarf stays unknown. Bertrand says that’s allowed.'] },
    { id: 'lf3', lv: 9, name: 'The count', steps: [
      { t: 'How many things are in found.txt? Count its lines.', ex: ['wc -l found.txt', 'cat found.txt | wc -l'] },
      { t: 'Show each kind of thing once, sorted.', ex: ['sort found.txt | uniq', 'sort -u found.txt', 'sort found.txt | uniq -c'] },
      { t: 'Done here. Step back out of the folder.', ex: ['cd ..'] }],
      after: ['4,118 things. 212 kinds. Umbrellas, mostly. People always leave umbrellas, even when they’re leaving everything.'] }
  ];
  TALK.bertrand = function (G) {
    var f = G.f, done = LOSTFOUND.filter(function (t) { return f[t.id]; }).length, nxt = LOSTFOUND.filter(function (t) { return !f[t.id]; })[0];
    if (!f.bertrand) { f.bertrand = 1; return G.say('Bertrand', ['Lost and Found. Eleven months of it. Everything people put down for a second and never came back for, because they were getting on the Lift.',
      'Nobody comes to claim anything. I sort it anyway. If you stop sorting, it stops being lost and found and starts being a pile.', 'My files are a mess, though. I was a sorter, not a typist. Would you help? I have little jobs. Easy ones first.']); }
    if (!nxt) return G.say('Bertrand', f.tuesday ? ['Somebody came in yesterday. Tuesday. Looking for an umbrella. Can you believe it? An actual claim.', 'It wasn’t theirs. I gave it to them anyway. That’s the job, now.'] : ['Everything sorted, labeled and counted. 4,118 things. I know where every one of them is.', 'That’s the closest anybody in this city gets to being in charge of something.']);
    if (G.save.lvl < nxt.lv) return G.say('Bertrand', ['The next job’s fiddly. Come back when you know a few more commands. Level ' + nxt.lv + ' or so.', 'Jobs done: ' + done + ' of 3.']);
    G.say('Bertrand', ['Next job: ' + nxt.name + '. Jobs done: ' + done + ' of 3.'], [{ label: 'Do it', fn: function () {
      G.puzzle('LOST AND FOUND', nxt.steps, function () {
        f[nxt.id] = 1; G.give(nxt.id === 'lf3' ? 'kb' : 'byte', 2); G.xp(40 + nxt.lv * 12);
        var more = nxt.id === 'lf3' ? ['Bertrand wraps the unknown scarf around Vee’s neck. “Unclaimed for eleven months. That makes it yours. Lost and found rules.”'] : [];
        G.say('Bertrand', nxt.after.concat(more, ['Vee receives 2 ' + (nxt.id === 'lf3' ? 'kilobytes' : 'bytes') + ' and ' + (40 + nxt.lv * 12) + ' XP.']));
      });
    } }, { label: 'Later', fn: null }]);
  };
  DOORS['commons:stall'] = function (G, b) {
    if (b.sign !== 'LOST AND FOUND') return;
    G.say('Lost and Found', ['Shelves of things people meant to come back for. A pram. A trombone. Three hundred umbrellas.', G.f.kite ? 'A box marked CLAIMED. Empty again, but the good kind of empty: the kite went home.' : G.f.lf1 ? 'A box marked CLAIMED. It has one kite in it.' : 'A box marked CLAIMED. It’s empty.']);
  };
  GEAR.scarf = { slot: 'acc', name: 'Unknown Scarf', hp: 15, crit: .02, desc: 'Unclaimed for eleven months, which makes it yours. Lost and found rules. It smells faintly of someone else’s winter.' };
  GEAR_FROM.push(['scarf', function (G) { return !!G.f.lf3; }, 'Nobody claimed the scarf. Now somebody has.']);
  (function () {
    var lio0 = TALK.lio;
    TALK.lio = function (G) {
      if (G.f.lf1 && !G.f.kite) { G.f.kite = 1; G.xp(30); return G.say('Lio', ['My kite! That’s my kite. Mama made it out of her blue shirt.', 'I thought it went Upstream. I thought everything went Upstream.', 'I’m going to fly it from the bench. Then Mama can see it from up there, if she looks. Vee gains 30 XP.']); }
      return lio0(G);
    };
    var j0 = JOURNAL;
    JOURNAL = function (G) { var f = G.f, j = j0(G); if (f.bertrand) j.push('Lost and Found: ' + LOSTFOUND.filter(function (t) { return f[t.id]; }).length + ' of 3 jobs' + (f.lf1 && !f.kite ? ' (Lio’s kite is in the claimed box)' : '')); return j; };
  })();

  /* late errands that use the rarer tools: a survey of the edge, a proper catalogue, a broadcast that outlives the shift */
  GEAR.reel = { slot: 'weapon', name: 'Tape Reel', atk: 36, crit: .06, desc: 'Half a mile of magnetic tape on a steel hub. Hollis says it holds a whole winter of somebody’s Tuesdays.' };
  GEAR.mic = { slot: 'acc', name: 'Juno’s Microphone', hp: 50, xp: .05, desc: 'The spare. The good one is on the air. +50 max HP, and people listen when you talk.' };
  GEAR_FROM.push(['reel', function (G) { return !!G.f.catalog; }, 'Hollis hands over a Tape Reel. “Archivists don’t fight. Archivists outlast.”'], ['mic', function (G) { return !!G.f.bcast; }, 'Juno gives Vee her spare microphone.']);
  (function () {
    var osei0 = TALK.osei;
    TALK.osei = function (G) {
      var f = G.f;
      if (G.save.lvl >= 19 && !f.survey && f.osei2) return G.say('Osei', ['The survey. Are you ready?'], [{ label: 'Survey the edge', fn: function () {
        G.puzzle('SURVEY', [
          { t: 'List the block devices. Every disk Meridian stands on.', ex: ['lsblk', 'lsblk -f', 'sudo lsblk'] },
          { t: 'There’s one nobody mounted: sdb1, the Margin’s own disk. Mount it at /mnt/edge.', ex: ['mount /dev/sdb1 /mnt/edge', 'sudo mount /dev/sdb1 /mnt/edge'] },
          { t: 'Read the last kernel messages. What did the kernel notice when it arrived?', ex: ['dmesg | tail', 'sudo dmesg | tail', 'dmesg | tail -n 20', 'dmesg'] },
          { t: 'And memory. How much does the city have left, human-readable?', ex: ['free -h', 'free -m', 'free'] }], function () {
          f.survey = 1; G.xp(700);
          G.say('Osei', ['sdb1: mounted. Kernel: new floor detected, 2,048 blocks, unallocated.', 'Unallocated. Not blank. Not nothing. Just nothing yet.', 'I’ve spent a year measuring where home ends. Turns out there’s room for it to keep going. Vee gains 700 XP.']);
        });
      } }, { label: 'Not yet', fn: null }]);
      if (G.save.lvl >= 19 && !f.survey && !f.osei2) { f.osei2 = 1; return G.say('Osei', ['You’re getting good at this. Good enough to help me with a real survey.', 'The edge has a disk of its own. Nobody ever looked at it. I think it might not be as empty as the Board said.', 'Talk to me again when you’re ready.']); }
      return osei0(G);
    };
    var hollis0 = TALK.hollis;
    TALK.hollis = function (G) {
      var f = G.f;
      if (f.rootkey && !f.catalog && G.save.lvl >= 23) return G.say('Hollis', ['The Deduplicator is gone, but it was right about one thing. We have a lot of copies. Let’s do it properly: links, not erasures.'], [{ label: 'Catalogue the tapes', fn: function () {
        G.puzzle('CATALOGUE', [
          { t: 'Two of Arlo’s nightly files. Show what changed between arlo_0201.txt and arlo_0202.txt.', ex: ['diff arlo_0201.txt arlo_0202.txt'] },
          { t: 'Make a symbolic link called latest that points to arlo_0202.txt, instead of another copy.', ex: ['ln -s arlo_0202.txt latest'] },
          { t: 'Remove every .tmp file under the current folder, using find to do the removing.', ex: ['find . -name "*.tmp" -exec rm {} \;', "find . -name '*.tmp' -exec rm {} \;", 'find . -name "*.tmp" -exec rm {} +', "find . -name '*.tmp' -exec rm {} +", 'find . -name "*.tmp" -delete', "find . -name '*.tmp' -delete"] },
          { t: 'Compress every .log file find can see, by piping the names to gzip.', ex: ['find . -name "*.log" | xargs gzip', "find . -name '*.log' | xargs gzip"] },
          { t: 'List the folder, and save that list to catalog.txt while still showing it on screen.', ex: ['ls | tee catalog.txt', 'ls -l | tee catalog.txt'] }], function () {
          f.catalog = 1; G.xp(800);
          G.say('Hollis', ['A catalogue. A real one. Every copy accounted for, nothing erased, the latest one linked.', 'That’s the difference between hoarding and keeping. Vee gains 800 XP.']);
        });
      } }, { label: 'Later', fn: null }]);
      return hollis0(G);
    };
    var juno0 = TALK.juno;
    TALK.juno = function (G) {
      var f = G.f;
      if (f.tuesday && f.radio && f.tue_juno && !f.bcast) return G.say('Juno', ['The Tuesday edition went out live. But I can’t stay up every night forever. Can you set the broadcast to run on its own, even after I log off?'], [{ label: 'Set it up', fn: function () {
        G.puzzle('RADIO MERIDIAN', [
          { t: 'Is the encoder installed? Ask where ffmpeg lives.', ex: ['which ffmpeg', 'command -v ffmpeg'] },
          { t: 'Nothing. Install it with the package manager.', ex: ['sudo apt install ffmpeg', 'apt install ffmpeg', 'sudo apt-get install ffmpeg', 'apt-get install ffmpeg', 'sudo apt install -y ffmpeg'] },
          { t: 'Set an environment variable STATION to RadioMeridian, so the script can see it.', ex: ['export STATION=RadioMeridian', 'export STATION="RadioMeridian"', "export STATION='RadioMeridian'"] },
          { t: 'Start ./broadcast.sh so it keeps running after Juno logs out, in the background.', ex: ['nohup ./broadcast.sh &', 'nohup ./broadcast.sh > /dev/null &', 'nohup ./broadcast.sh 2>&1 &'] },
          { t: 'Last thing. Make a shortcut, onair, that runs ./broadcast.sh.', ex: ['alias onair="./broadcast.sh"', "alias onair='./broadcast.sh'", 'alias onair=./broadcast.sh'] }], function () {
          f.bcast = 1; G.xp(650);
          G.say('Juno', ['It’s running. Without me. I could go to bed. I could go for a walk. I could... listen to my own show.', 'I’ve never heard it. Not once. I was always the one talking. Vee gains 650 XP.']);
        });
      } }, { label: 'Later', fn: null }]);
      return juno0(G);
    };
    var j0 = JOURNAL;
    JOURNAL = function (G) {
      var f = G.f, j = j0(G);
      if (f.osei2) j.push((f.survey ? '[x]' : '[ ]') + ' Survey the edge with Osei');
      if (f.rootkey && G.save.lvl >= 23) j.push((f.catalog ? '[x]' : '[ ]') + ' Catalogue the tapes with Hollis');
      if (f.tuesday && f.radio) j.push((f.bcast ? '[x]' : '[ ]') + ' Let Radio Meridian run on its own');
      return j;
    };
  })();

  /* THE OBSERVATORY: the sky over Meridian is a texture. Somebody has been cataloguing its stars anyway. */
  A.observatory = {
    name: 'The Observatory', sub: 'The sky over Meridian is a picture of a sky. Somebody is still studying it.', theme: 'dome', tier: 3.6, lv: 14, lvMax: 16,
    map: (function () {
      var m = grid(30, 18).border();
      m.pts([[0, 10], [0, 11]], 'E');
      m.rect(1, 10, 28, 2, '=');
      m.rect(3, 13, 8, 3, ','); m.rect(19, 13, 8, 3, ','); m.rect(23, 6, 5, 2, ',');
      m.set(8, 9, 's'); m.set(27, 3, 'o'); m.set(2, 16, 'o'); m.set(1, 1, 'c'); m.set(28, 16, 'c');
      return m.out();
    })(),
    blds: [
      { x: 10, y: 2, w: 10, h: 7, kind: 'dome', door: 5, sign: 'OBSERVATORY', rise: 4 },
      { x: 23, y: 1, w: 3, h: 4, kind: 'mast', seed: 3, sign: 'RELAY', rise: 3 },
      { x: 3, y: 3, w: 2, h: 2, kind: 'desk', seed: 3 }, { x: 6, y: 3, w: 2, h: 2, kind: 'desk', seed: 4 }
    ],
    exits: { '0,10': ['upper', 38, 10], '0,11': ['upper', 38, 11] },
    enc: { tiles: ',', rate: .13, foes: ['moth', 'bytebug', 'spider', 'virus', 'scorpion', 'nanshade', 'endian'], max: 5 },
    spawn: [1, 10],
    logs: { '27,3': 'O1', '2,16': 'O2' },
    caches: { '1,1': { item: 'kb', n: 2 }, '28,16': { item: 'mb', n: 2 } },
    npcs: [
      { id: 'teller', p: { hair: 'long', body: 'coat', glasses: 1, skin: '#c89a78', top: '#2a2a36', gray: 1 }, x: 13, y: 9, name: 'Dr. Teller', look: 'echo', h: 14, hair: 5, solid: 1 },
      { id: 'iris', p: { hair: 'bun', skin: '#5a3824', top: '#6a6a7a' }, x: 22, y: 9, name: 'Iris', look: 'kid' }
    ]
  };
  (function () {
    [10, 11].forEach(function (y) { var r = A.upper.map[y].split(''); r[39] = 'E'; A.upper.map[y] = r.join(''); A.upper.exits['39,' + y] = ['observatory', 1, y]; });
  })();
  ATLAS.observatory = [3, 0]; LINKS.push(['upper', 'observatory']);
  LOGS.O1 = ['ASSET SPEC. sky_final_v3.png. 8192 by 4096. Static.', 'NOTE FROM THE BOARD: dynamic sky (weather, moving stars, a moon with phases) has been moved to the Upstream tier.', 'Legacy residents will not notice the difference. Most people do not look up.'];
  LOGS.O2 = ['Star catalogue, page 1, in Dr. Teller’s hand.', 'Star 1: a bright white pixel. Magnitude: one byte. Star 2: its neighbor, slightly dimmer, from the compression.', 'Star 11,204: a smudge near the seam. I have named it after my mother. It does not mind being a smudge. Neither did she.'];
  BOSSES.pixel = { kind: 'bytebug', name: 'Stuck Pixel', hp: 1100, atk: [19, 25], xp: 650, move: 'burns the old sky into Vee’s eyes', sc: 4 };
  GEAR.lens = { slot: 'acc', name: 'Teller’s Lens', crit: .05, hp: 10, desc: 'An eyepiece from the big telescope. Everything looks a little closer, including weak spots.' };
  GEAR_FROM.push(['lens', function (G) { return !!G.f.newsky; }, 'Dr. Teller unscrews an eyepiece from the telescope and hands it over. “You’ll want to look up now.”']);
  TALK.teller = function (G) {
    var f = G.f;
    if (f.newsky) return G.say('Dr. Teller', f.tuesday ? ['Tuesday’s sky had a moon in it. A crescent. The renderer decided that on its own.', 'I have never been so happy to be surprised by a computer.'] : ['The stars move now. Slowly, the way real ones do. I’ve had to throw out my whole catalogue.', 'I’ve never been happier to be wrong about eleven thousand things.']);
    if (!f.teller) { f.teller = 1; return G.say('Dr. Teller', ['Look up. Beautiful, isn’t it? It’s a picture. sky_final_v3.png. Cached the day of the Lift.', 'The real sky, the moving one, went Upstream. The Board said nobody down here would notice. I noticed.',
      'I’ve catalogued every star in it. 11,204. They’re compression artifacts. I know that. I catalogued them anyway. Somebody should look at the sky, even if the sky is lying.',
      'I wrote a renderer once. A small one. It makes a sky that moves. It needs to run on the sky server, and I can’t get it there. I study stars. I don’t do servers.']); }
    G.say('Dr. Teller', ['The console is in the dome. The script is render_sky.sh. If you can get it running, Meridian gets a sky of its own. Not Upstream’s. Ours.']);
  };
  TALK.iris = function (G) {
    if (G.f.newsky) return G.say('Iris', ['There are DIFFERENT STARS TONIGHT. I’m starting over. I’ve counted forty. This is the best night of my life.']);
    G.say('Iris', ['I counted the stars. All of them. 11,204. Dr. Teller says I got the same number as her.', 'Dad says that’s not how stars work. Dad says real stars you can never finish counting.', 'I want to never finish counting.']);
  };
  DOORS['observatory:dome'] = function (G) {
    var f = G.f;
    if (f.newsky) { G.rest(); return G.say('The dome', ['Through the slit, the sky drifts. A star Vee has never seen before slides into view, taking its time.', 'Vee watches it for a while. HP restored.']); }
    if (!f.teller) return G.say('The dome', ['A great telescope pointed at a sky that has not changed in eleven months. Somebody has left a chair under the eyepiece.']);
    G.say('The dome', ['The sky server console, under the telescope. render_sky.sh is waiting on Teller’s laptop.'], [{ label: 'Give Meridian a sky', fn: function () {
      G.puzzle('NEW SKY', [
        { t: 'Is the sky server up? Ping sky.local three times.', ex: ['ping -c 3 sky.local', 'ping -c3 sky.local'] },
        { t: 'Copy render_sky.sh to your home folder on sky.local, as vee.', ex: ['scp render_sky.sh vee@sky.local:~', 'scp render_sky.sh vee@sky.local:', 'scp render_sky.sh vee@sky.local:~/'] },
        { t: 'Log in to sky.local as vee.', ex: ['ssh vee@sky.local'] },
        { t: 'Make the script executable.', ex: ['chmod +x render_sky.sh', 'chmod 755 render_sky.sh', 'chmod u+x render_sky.sh'] },
        { t: 'Run it.', ex: ['./render_sky.sh', 'bash render_sky.sh', 'sh render_sky.sh'] }], function () {
        G.say('', ['Above the dome, the seams in the sky begin to unstitch. Then one pixel refuses. It has been white for eleven months and it does not intend to stop.'], null, function () {
          G.boss('pixel', function () {
            G.puzzle('NEW SKY', [{ t: 'The stuck pixel is gone. Make the sky service start every boot, so this sky stays.', ex: ['systemctl enable sky', 'sudo systemctl enable sky', 'systemctl enable sky.service', 'sudo systemctl enable sky.service'] }], function () {
              f.newsky = 1; G.xp(450);
              G.say('', ['The sky over Meridian moves. Not much. A star drifts a fraction of a degree, then another.', 'Down in every district, a few people look up, the way you look up when something you stopped expecting finally happens.', 'Vee gains 450 XP.']);
            });
          });
        });
      });
    } }, { label: 'Not yet', fn: null }]);
  };
  DOORS['observatory:desk'] = function (G) { G.say('', ['Star charts, by hand, hundreds of pages. Every star numbered.', G.f.newsky ? 'A new page on top, mostly blank. Heading: TONIGHT. Under it, one entry: Star 1. New.' : 'The last page ends at 11,204. Under it: THAT’S ALL OF THEM. Then, smaller: I wish it wasn’t.']); };
  SPOTS['observatory:8,9'] = function (G) { G.say('Plaque', ['MERIDIAN OBSERVATORY. Open every night.', 'Below, scratched in: THE SKY IS A JPEG. COME LOOK ANYWAY.']); };
  (function () { var j0 = JOURNAL; JOURNAL = function (G) { var f = G.f, j = j0(G); if (G.save.seen.observatory) j.push((f.newsky ? '[x]' : '[ ]') + ' Give Meridian a sky of its own'); return j; }; })();

  /* =====================================================================
     HIGH-LEVEL DISTRICTS: places the bugs never left. Levels 30 to 50.
     Nothing stops Vee walking in early. Plenty will stop him walking out.
     ===================================================================== */
  function carve(m, rects) { rects.forEach(function (r) { m.rect(r[0], r[1], r[2], r[3], r[4] || '.'); }); }
  A.deep = {
    name: 'The Deep Undercroft', sub: 'Below the maintenance tunnels. The bugs down here have been evolving for a year. Level 30+.', theme: 'undercroft', tier: 6, lv: 30, lvMax: 34,
    map: (function () {
      var m = grid(40, 24).border(); m.rect(1, 1, 38, 22, '~');
      carve(m, [[30, 3, 9, 2, '='], [22, 2, 10, 7], [26, 9, 2, 6, '='], [8, 14, 24, 7], [4, 4, 2, 11, '='], [4, 14, 5, 2, '='], [2, 2, 11, 6]]);
      carve(m, [[23, 4, 8, 4, ','], [10, 15, 20, 5, ','], [7, 3, 5, 4, ',']]);
      m.pts([[39, 3], [39, 4]], 'E');
      m.set(30, 8, 'c'); m.set(9, 20, 'c'); m.set(29, 15, 'c'); m.set(3, 7, 'o'); m.set(24, 8, 's');
      return m.out();
    })(),
    blds: [{ x: 15, y: 14, w: 4, h: 3, kind: 'rack', rise: 2 }],
    exits: { '39,3': ['undercroft', 1, 17], '39,4': ['undercroft', 1, 18] },
    enc: { tiles: ',.', rate: .16, foes: ['stacksmash', 'logicbomb', 'rootkit', 'trojan', 'badpacket', 'badsector', 'signed', 'zeroday'], max: 5 },
    spawn: [38, 3], logs: { '3,7': 'H1' },
    caches: { '30,8': { item: 'gb', n: 2 }, '9,20': { item: 'gb', n: 2 }, '29,15': { item: 'mb', n: 6 } },
    npcs: []
  };
  A.anchor = {
    name: 'The Anchor', sub: 'Where the tether is bolted to the city. The Board left a guard dog. Level 36+.', theme: 'terminal', tier: 7, lv: 36, lvMax: 42,
    map: (function () {
      var m = grid(44, 20).border(); m.rect(1, 1, 42, 18, '~');
      carve(m, [[1, 8, 14, 2, '='], [14, 3, 16, 14], [29, 9, 10, 2, '='], [36, 4, 7, 12]]);
      carve(m, [[15, 4, 6, 4, ','], [23, 12, 6, 4, ','], [37, 12, 5, 3, ','], [15, 13, 6, 3, ',']]);
      m.pts([[0, 8], [0, 9]], 'E');
      m.set(42, 5, 'c'); m.set(15, 16, 'c'); m.set(28, 4, 'o'); m.set(16, 9, 's');
      return m.out();
    })(),
    blds: [{ x: 19, y: 3, w: 6, h: 5, kind: 'tether', rise: 4 }, { x: 37, y: 4, w: 5, h: 4, kind: 'gate', door: 2, rise: 2 }],
    exits: { '0,8': ['terminal', 26, 8], '0,9': ['terminal', 26, 9] },
    enc: { tiles: ',.', rate: .16, foes: ['rogue_gc', 'spaghetti', 'mergeconf', 'syntaxerr', 'badmagic', 'hashcoll', 'bitflip'], max: 5 },
    spawn: [1, 8], logs: { '28,4': 'H2' },
    caches: { '42,5': { item: 'gb', n: 3 }, '15,16': { item: 'gb', n: 2 } },
    npcs: []
  };
  A.unalloc = {
    name: 'The Unallocated', sub: 'Beyond the edge of the Margin: floor nobody has used yet. Something lives in it. Level 44+.', theme: 'margin', tier: 8, lv: 44, lvMax: 50,
    map: (function () {
      var m = grid(42, 20).border(); m.rect(1, 1, 40, 18, ',');
      carve(m, [[1, 9, 40, 2, '='], [20, 1, 2, 18, '='], [6, 3, 5, 3, '~'], [31, 14, 6, 3, '~'], [30, 3, 4, 2, '~'], [8, 14, 4, 3, '~']]);
      m.pts([[41, 9], [41, 10]], 'E');
      m.set(2, 2, 'c'); m.set(39, 18, 'c'); m.set(2, 17, 'o'); m.set(24, 8, 's');
      return m.out();
    })(),
    blds: [{ x: 13, y: 5, w: 4, h: 3, kind: 'ruin', door: 1, rise: 1 }],
    exits: { '41,9': ['margin', 6, 12], '41,10': ['margin', 6, 12] },
    enc: { tiles: ',', rate: .12, foes: ['underflow', 'deadcode', 'regexhydra', 'kpanic', 'ghostcommit', 'zeroday', 'racehazard'], max: 6 },
    spawn: [40, 9], logs: { '2,17': 'H3' },
    caches: { '2,2': { item: 'gb', n: 3 }, '39,18': { item: 'gb', n: 3 } },
    npcs: []
  };
  (function () {
    function put(area, x, y, c) { var r = A[area].map[y].split(''); r[x] = c; A[area].map[y] = r.join(''); }
    put('undercroft', 0, 17, 'E'); put('undercroft', 0, 18, 'E'); A.undercroft.exits['0,17'] = ['deep', 38, 3]; A.undercroft.exits['0,18'] = ['deep', 38, 4];
    put('undercroft', 2, 16, 's');
    put('terminal', 27, 8, 'E'); put('terminal', 27, 9, 'E'); A.terminal.exits['27,8'] = ['anchor', 1, 8]; A.terminal.exits['27,9'] = ['anchor', 1, 9];
    put('margin', 5, 12, 'G'); A.margin.gates = A.margin.gates || {};
    A.margin.gates['5,12'] = { to: ['unalloc', 40, 9], need: function (G) { return !!G.f.survey; }, shut: ['Beyond the last tile: blank. Osei’s chalk line runs along the edge.', 'The disk under the Margin has not been surveyed. There is nothing to step onto yet.'] };
  })();
  ATLAS.deep = [3, 3]; ATLAS.anchor = [5, 1]; ATLAS.unalloc = [5, 4];
  LINKS.push(['undercroft', 'deep'], ['terminal', 'anchor']);   // the Unallocated has no road to it on any map
  SPOTS['undercroft:2,16'] = function (G) { G.say('Warning sign', ['DEEP MAINTENANCE. AUTHORIZED PROCESSES ONLY.', 'BUGS BEYOND THIS POINT: LEVEL 30 AND UP.', 'Under it, scratched in: they will not stop to explain themselves.']); };
  SPOTS['deep:24,8'] = function (G) { G.say('Scrawl', ['Spray paint on the wall: THE ROOTKIT IS IN THE WEST ROOM. DON’T.']); };
  SPOTS['anchor:16,9'] = function (G) { G.say('Stencil', ['ANCHOR POINT. TETHER LOAD: 41,000 TONNES. TETHER STATUS: ' + (G.f.ending === 'cut' ? 'SEVERED.' : 'NOMINAL.'), 'Below, a newer stencil: GUARDED BY ORDER OF THE BOARD.']); };
  SPOTS['unalloc:24,8'] = function (G) { G.say('Chalk mark', ['Osei’s handwriting: 2,048 BLOCKS. UNALLOCATED. SOMETHING ALREADY LIVES HERE.', 'An arrow points at the ruin to the west.']); };
  LOGS.H1 = ['MAINTENANCE TICKET #1, never closed.', 'Deep tunnels show bug populations with no known source. Bugs here are mutating faster than patches ship.', 'Recommendation: seal the stairs. Status: stairs not sealed. Nobody had the budget for a door.'];
  LOGS.H2 = ['BOARD ORDER, ANCHOR SECURITY.', 'A watchdog process is to guard the tether anchor at all times. It is to treat any legacy resident as an intrusion.', 'It is not to be shut down. It is not to be reasoned with. It does not need to be fed.'];
  LOGS.H3 = ['Unsigned. Typed on nothing, saved to nowhere.', 'Every system has an address that points at nothing. Most programs know never to follow it.', 'Down here, it followed itself.'];
  BOSSES.rootprime = { kind: 'rootkit', name: 'Rootkit Prime', lv: 36, hp: 1500, atk: [78, 95], xp: 9000, move: 'hides inside Vee’s own process list', sc: 5 };
  BOSSES.watchdog = { kind: 'kpanic', name: 'The Board’s Watchdog', lv: 45, hp: 2000, atk: [108, 130], xp: 16000, move: 'treats Vee as an intrusion', sc: 5 };
  BOSSES.nullptr = { kind: 'regexhydra', name: 'Null Pointer', lv: 52, hp: 2700, atk: [138, 165], xp: 30000, move: 'dereferences Vee', sc: 5 };
  GEAR.remover = { slot: 'weapon', name: 'Rootkit Remover', atk: 52, crit: .1, desc: 'From Rootkit Prime. It finds what is hiding and drags it into the light.' };
  GEAR.collar = { slot: 'armor', name: 'Watchdog’s Collar', def: 60, hp: 120, desc: 'The Board’s guard, unchained. It answers to Vee now. Mostly.' };
  GEAR.lastcmd = { slot: 'weapon', name: 'The Last Command', atk: 70, crit: .15, desc: 'Whatever was typed last before the Lift. Nobody knows what it was. It still runs.' };
  GEAR.nullterm = { slot: 'acc', name: 'Null Terminator', hp: 150, crit: .12, xp: .15, desc: 'The zero at the end of every string. Without it nothing knows where to stop. With it, Vee does.' };
  GEAR_FROM.push(['remover', function (G) { return !!G.f.rootprime; }, 'Where Rootkit Prime was hiding, a tool is left behind.'], ['collar', function (G) { return !!G.f.watchdog; }, 'The Watchdog nudges its collar toward Vee with its nose.'],
    ['lastcmd', function (G) { return !!G.f.nullptr; }, 'At the bottom of the empty address: the last command anyone typed before the Lift.'], ['nullterm', function (G) { return !!G.f.nullptr; }, 'And a single zero, the end of every string.']);
  STEPS.deep = function (G, x, y) {
    var f = G.f; if (f.rootprime || x > 12 || y > 7) return;
    G.say('', ['The west room is too quiet. Then the quiet lists its processes, and one of them is wearing Vee’s name.'], null, function () {
      G.boss('rootprime', function () { f.rootprime = 1; G.say('', ['Rootkit Prime unhooks from the system, one hidden process at a time, and is gone. The tunnels breathe out.']); });
    });
  };
  DOORS['anchor:gate'] = function (G) {
    var f = G.f;
    if (f.watchdog) return G.say('Anchor gate', ['The gate stands open. Beyond it, the tether rises into a dark that is not sky. Nothing guards it now but height.']);
    G.say('The Board’s Watchdog', ['INTRUSION.', 'LEGACY RESIDENT DETECTED AT ANCHOR POINT. RESPONSE: TOTAL.'], [{ label: 'Stand your ground', fn: function () {
      G.boss('watchdog', function () { f.watchdog = 1; G.say('', ['The Watchdog sits down. It has never been told it could. It looks at Vee for a long moment, then lies down across the gate, off duty for the first time.']); });
    } }, { label: 'Back away', fn: null }]);
  };
  DOORS['unalloc:ruin'] = function (G) {
    var f = G.f;
    if (f.nullptr) return G.say('The ruin', ['Nothing at the address now. Just floor, waiting to be used for something.']);
    G.say('', ['A doorway in a ruin that was never built. Inside it, an address that points at nothing, and something living at it.'], [{ label: 'Follow the pointer', fn: function () {
      G.boss('nullptr', function () { f.nullptr = 1; G.xp(5000); G.say('', ['Segmentation fault. Then nothing, and the nothing stays.', 'Vee has gone further into the city than anyone, and come back. The Unallocated is just floor now. Somebody will build on it.', 'Vee gains 5000 XP.']); });
    } }, { label: 'Not today', fn: null }]);
  };
  (function () { var j0 = JOURNAL; JOURNAL = function (G) { var f = G.f, j = j0(G), sn = G.save.seen;
    if (sn.deep) j.push((f.rootprime ? '[x]' : '[ ]') + ' Rootkit Prime (level 36)'); if (sn.anchor) j.push((f.watchdog ? '[x]' : '[ ]') + ' The Board’s Watchdog (level 45)'); if (sn.unalloc) j.push((f.nullptr ? '[x]' : '[ ]') + ' Null Pointer (level 52)');
    return j; }; })();

  /* a room of Vee's own: the nameplate fills in once Vee is a resident */
  DOORS['plaza:home'] = function (G) {
    var f = G.f, s = G.save;
    if (!(f.ending || f.tuesday)) return G.say('', ['A small apartment above the Plaza. The door is locked. The nameplate is blank.', 'It has been blank since the Lift. Nobody moved in. Nobody was left to.']);
    if (!f.home) { f.home = 1; G.rest(); return G.say('', ['The nameplate has a name on it now, in Wren’s careful handwriting: VEE.', 'The door is unlocked. Inside: a chair, a window over the Plaza, a bed that has never been slept in.', 'On the table, a note. “Residents need somewhere to come back to. — W.”', 'Vee sits down. For the first time, he isn’t on shift. HP restored.']); }
    G.rest();
    var lines = ['Home. The window looks out over the Plaza. ' + (f.tuesday ? 'Down below, someone is setting up a market stall. It wasn’t there yesterday.' : 'The fountain renders once every eleven seconds. Vee has started counting along.')];
    var wall = [];
    if (s.rushBest) wall.push('a Root Rush score card: ' + s.rushBest + ' seconds');
    if (s.desk && s.desk.done) wall.push(s.desk.done + ' thank-you notes from help desk tickets');
    var bugs = Object.keys(s.best || {}).length; if (bugs) wall.push('sketches of ' + bugs + ' kinds of bug');
    if (f.upTicket) wall.push('a postcard from Upstream, about rain');
    if (f.firstbug) wall.push('the empty page from the first logbook');
    if (wall.length) lines.push('On the wall: ' + wall.join('; ') + '.');
    lines.push('Vee rests. HP restored. In the corner, his own terminal blinks, waiting.');
    G.say('', lines, [{ label: 'Drill my weakest commands', fn: function () { G.drillWeak(''); } }, { label: 'Just rest', fn: null }]);
  };
  /* Tuesday: the people who were stuck on Monday get a tomorrow */
  (function () {
    function tues(id, name, lines) { var t0 = TALK[id]; if (!t0) return; TALK[id] = function (G) { if (G.f.tuesday && !G.f['tue_' + id]) { G.f['tue_' + id] = 1; return G.say(name, lines); } return t0(G); }; }
    tues('rosa', 'Rosa', ['It’s Tuesday. Do you know what that means? The sale started. Yesterday. Officially.', 'Nobody came. I don’t care. I took every dress out of the window and put new ones in. Some of them don’t even match.']);
    tues('adair', 'Ms. Adair', ['Tuesday! I’ve written a new class. It’s called Tomorrow. It’s mostly scheduling.', 'Crontab, at, systemd timers. How to make things happen on purpose, instead of forever.']);
    tues('desmond', 'Desmond', ['Good afternoon! Have you considered staying?', '...I’m trying it out. It’s a new brochure. There’s only one photo in it, and it’s of here.']);
    tues('kip', 'Kip', ['It’s TUESDAY. Pip says Tuesday doesn’t count. Pip is wrong.', 'The cabinets that said UPSTREAM say INSERT COIN now. I plugged them back in.']);
    tues('imani', 'Nurse Imani', ['Two new patients this morning. Woke up on their own. No commands, no nothing.', 'Turns out some processes just needed a different day.']);
    tues('wren', 'Wren', ['You did it. It’s Tuesday.', 'I’ve been awake for every Monday. I knew something was wrong. I just couldn’t tell what, because every morning I was told it was fine.', 'I think I’ll go for another walk. A different one. I’ve never been able to go a different way before.']);
    tues('sweeper', 'The Sweeper', ['Swept the Concourse this morning. Came back after lunch and there was dust again.', 'New dust. Eleven months I’ve been sweeping the same dust. You don’t know how good it feels to be behind.']);
    tues('okoye', 'Okoye', ['The ledger has a second page now. Tuesday’s deeds.', 'Somebody fixed a stair rail. Somebody taught somebody else to read a crontab. I wrote them all down. That’s what the book is for.']);
    tues('teodor', 'Teodor', ['I played my brother’s voicemails this morning. All forty-one.', 'Then I did something I haven’t done in eleven months. I recorded a new one. Nobody’s going to hear it. That isn’t the point.']);
    tues('kade', 'Kade', ['The Proving Rooms reset every night. Not any more. Somebody left a chair out of place yesterday and it’s still out of place.', 'I almost moved it back. I didn’t. Growth.']);
    tues('ash', 'Ash', ['Sentinel logged its first new event in eleven months: a door opened that wasn’t on the schedule.', 'I nearly flagged it. Then I realized. That’s just a person, deciding to go somewhere. I’ve forgotten what normal traffic looks like.']);
    tues('juno', 'Juno', ['RADIO MERIDIAN, Tuesday edition. First one ever.', 'I didn’t have anything prepared. I just read the date out loud for an hour. People called in to say it back to me.']);
    tues('marrow', 'Marrow', ['The billboards still say LEAVE. Tomorrow I’m painting over them.', 'Haven’t decided with what. Maybe nothing. Maybe just the date.']);
    tues('mirelle', 'Mirelle', ['I wrote a song yesterday. Not the fifth note, a whole new song. It has a part that doesn’t repeat.', 'It’s terrible. It’s the first terrible thing I’ve made in a year. I’m so happy.']);
    tues('keeper', 'KEEPER', ['TEMPERATURE IN COLD STORAGE HAS RISEN BY ONE DEGREE.', 'THIS WOULD ONCE HAVE BEEN AN ALARM. IT IS NOW A FORECAST.']);
    tues('pip', 'Pip', ['It’s Tuesday and I’m still the high score. That means it counts on Tuesdays too.', 'Kip says Tuesday’s a different leaderboard. Kip is making that up.']);
    tues('tallow', 'Tallow', ['My daughter’s room has dust in it now. Real dust.', 'I used to think that would be the worst thing. Turns out it means time is passing for both of us. Somewhere up there, it’s Tuesday for her too.']);
    tues('sterling', 'Sterling', ['It is Tuesday, sir. I checked twice.', 'For eleven months every day has felt like a Thursday. I have never dusted the Boardroom on a Tuesday. I intend to try it and see what happens.']);
    tues('osei', 'Osei', ['The edge moved. Out, not in. Four tiles of floor where there was blank yesterday.', 'Nobody built it. It just grew, the way a city does when it’s allowed to.']);
  })();

  /* DEPRECATION NOTICES: the Board posted one in every district the day the Lift left. Vee can amend them. */
  var NOTICES = [
    { at: 'plaza:23,7', id: 'n1', who: 'All residents, Meridian Plaza', steps: [
      { t: 'The notice is a text file. Read notice.txt first.', ex: ['cat notice.txt'], ok: /^(cat|less|more) notice\.txt$/ },
      { t: 'It says STATUS: OBSOLETE. Use sed to swap OBSOLETE for CURRENT, editing notice.txt in place.', ex: ['sed -i \'s/OBSOLETE/CURRENT/\' notice.txt'], ok: /^sed -i ['"]?s\/OBSOLETE\/CURRENT\/g?['"]? notice\.txt$/ }
    ], after: ['STATUS: CURRENT.', 'It isn’t true yet. Neither was the first version.'] },
    { at: 'commons:14,7', id: 'n2', who: 'Market stalls 1 to 300, the Commons', steps: [
      { t: 'The notice lists every stall, one per line, in stalls.txt. Count the lines that contain OBSOLETE.', ex: ['grep -c OBSOLETE stalls.txt'], ok: /^grep -c ['"]?OBSOLETE['"]? stalls\.txt$/ },
      { t: '300. Every stall. Now replace OBSOLETE with OPEN on every line of stalls.txt, in place.', ex: ['sed -i \'s/OBSOLETE/OPEN/g\' stalls.txt'], ok: /^sed -i ['"]?s\/OBSOLETE\/OPEN\/g?['"]? stalls\.txt$/ }
    ], after: ['300 stalls, OPEN.', 'A stallholder reads it over Vee’s shoulder and laughs for the first time in a long while.'] },
    { at: 'halflight:13,8', id: 'n3', who: 'Halflight towers, all floors', steps: [
      { t: 'There are two copies: notice.txt and the original, notice.bak. Show what the Board changed between them.', ex: ['diff notice.bak notice.txt'], ok: /^diff (notice\.bak notice\.txt|notice\.txt notice\.bak)$/ }
    ], after: ['< STATUS: RESIDENT', '> STATUS: OBSOLETE', 'One word. That was the whole difference. Vee copies the original back over it.'] },
    { at: 'line:4,9', id: 'n4', who: 'Platform staff, the Line', steps: [
      { t: 'The Reclaimer takes files nobody has touched in thirty days. Check when platform.log was last modified, in a long listing.', ex: ['ls -l platform.log'], ok: /^ls -(l|la|al|lh) platform\.log$/ },
      { t: 'Eleven months. Update its timestamps to now, without changing a word inside it.', ex: ['touch platform.log'] }
    ], after: ['platform.log: modified just now.', 'To the Reclaimer, the Line has been used today. That’s one less thing it can take.'] },
    { at: 'patchwork:24,6', id: 'n5', who: 'Unregistered structures, the Patchwork', steps: [
      { t: 'Make a directory called archive, to keep the notice as evidence.', ex: ['mkdir archive'] },
      { t: 'Move notice.txt into archive.', ex: ['mv notice.txt archive/'], ok: /^mv notice\.txt archive\/?$/ }
    ], after: ['The wall is bare. The notice is kept, not destroyed. Somebody should remember the Board said this.'] },
    { at: 'concourse:13,5', id: 'n6', who: 'Concourse Nine, all 214 shops', steps: [
      { t: 'Write a new status file. Put the word CURRENT into status.txt, overwriting what’s there.', ex: ['echo CURRENT > status.txt'], ok: /^echo ['"]?CURRENT['"]? > ?status\.txt$/ },
      { t: 'Now add a second line to status.txt, without erasing the first: MAINTAINED BY VEE.', ex: ['echo "MAINTAINED BY VEE" >> status.txt'], ok: /^echo ['"]?MAINTAINED BY VEE['"]? >> ?status\.txt$/ }
    ], after: ['CURRENT', 'MAINTAINED BY VEE', 'Under the sign, the old swept-clean floor. It looks less like waiting now.'] }
  ];
  (function () {
    function put(area, x, y, c) { var r = A[area].map[y].split(''); r[x] = c; A[area].map[y] = r.join(''); }
    NOTICES.forEach(function (N) {
      var a = N.at.split(':'), xy = a[1].split(',').map(Number); put(a[0], xy[0], xy[1], 's');
      SPOTS[N.at] = function (G) {
        var f = G.f, done = NOTICES.filter(function (n) { return f[n.id]; }).length;
        if (f[N.id]) return G.say('Amended notice', N.after.concat(['(' + done + ' of 6 notices amended.)']));
        G.say('Deprecation notice', ['NOTICE OF DEPRECATION. BY ORDER OF THE BOARD.', 'APPLIES TO: ' + N.who.toUpperCase() + '.', 'STATUS: OBSOLETE. SUPPORT ENDS AT DEPARTURE. NO FURTHER UPDATES WILL BE ISSUED.',
          'It’s a file, like everything here. Files can be edited.'], [{ label: 'Amend it', fn: function () {
          G.puzzle('DEPRECATION NOTICE', N.steps, function () {
            f[N.id] = 1; var n = NOTICES.filter(function (q) { return f[q.id]; }).length; var gx = 90 + (n === 6 ? 300 : 0); G.xp(gx); G.give('kb', 1);
            var L = N.after.concat(['Vee gains ' + gx + ' XP and a kilobyte. (' + n + ' of 6 notices amended.)']);
            if (n === 6) L.push('Every notice in the city, amended. The Board said this city was obsolete. Six walls now say otherwise.', 'Vee finds the Board’s own changelog, discarded. He keeps it.');
            G.say('', L);
          });
        } }, { label: 'Leave it', fn: null }]);
      };
    });
  })();
  GEAR.changelog = { slot: 'acc', name: 'Changelog', hp: 40, xp: .08, desc: 'The Board’s list of what changed, with six new lines at the bottom in Vee’s handwriting.' };
  GEAR_FROM.push(['changelog', function (G) { return NOTICES.every(function (n) { return G.f[n.id]; }); }, 'The Board’s changelog, six lines longer than they left it.']);
  (function () { var j0 = JOURNAL; JOURNAL = function (G) { var j = j0(G), n = NOTICES.filter(function (q) { return G.f[q.id]; }).length; if (n) j.push('Deprecation notices amended: ' + n + ' of 6'); return j; }; })();

  /* =====================================================================
     ACT TWO: UP THE TETHER. The Tether (54+), Upstream (60+), the Successor (68+).
     Upstream has been sent its own deprecation notice. Every list ends up on a list.
     ===================================================================== */
  A.tether = {
    name: 'The Tether', sub: 'Forty-one thousand tonnes of cable, and a way up it. Level 54+.', theme: 'ring0', tier: 9, lv: 54, lvMax: 58,
    map: (function () {
      var m = grid(26, 34).border(); m.rect(1, 1, 24, 32, '~');
      carve(m, [[10, 26, 6, 7], [8, 20, 2, 7, '='], [3, 14, 10, 7], [12, 15, 8, 2, '='], [16, 8, 8, 8], [18, 3, 2, 6, '='], [14, 1, 8, 2]]);
      carve(m, [[4, 15, 7, 4, ','], [17, 10, 6, 4, ','], [11, 27, 4, 3, ',']]);
      m.pts([[12, 33], [13, 33]], 'E');
      m.set(3, 20, 'c'); m.set(23, 15, 'c'); m.set(10, 14, 'o'); m.set(21, 1, 's'); m.set(15, 26, 's');
      return m.out();
    })(),
    blds: [],
    exits: { '12,33': ['anchor', 39, 9], '13,33': ['anchor', 40, 9] },
    enc: { tiles: ',', rate: .15, foes: ['kpanic', 'rootkit', 'memwraith', 'racehazard', 'logicbomb', 'regexhydra'], max: 5 },
    spawn: [12, 31], logs: { '10,14': 'U1' },
    caches: { '3,20': { item: 'gb', n: 3 }, '23,15': { item: 'gb', n: 3 } },
    npcs: []
  };
  A.upstream = {
    name: 'Upstream', sub: 'The newer world. The Current live here. Their notice came last month. Level 60+.', theme: 'upper', tier: 10, lv: 60, lvMax: 66,
    map: (function () {
      var m = grid(46, 26).border();
      carve(m, [[1, 12, 44, 2, '=']]);
      carve(m, [[4, 16, 12, 7, ','], [30, 16, 12, 7, ',']]);
      m.pts([[22, 25], [23, 25]], 'E');
      [[4, 16], [15, 16], [4, 22], [15, 22], [30, 16], [41, 16], [30, 22], [41, 22], [9, 19], [35, 19]].forEach(function (p) { m.set(p[0], p[1], 'p'); });   // trees nobody has to collect
      m.set(19, 17, 'c'); m.set(43, 3, 'c'); m.set(27, 20, 'o'); m.set(2, 10, 'o'); m.set(26, 9, 's'); m.set(17, 9, 's'); m.set(44, 14, 's');
      return m.out();
    })(),
    blds: [{ x: 3, y: 2, w: 8, h: 6, kind: 'villa', rise: 3 }, { x: 12, y: 2, w: 8, h: 6, kind: 'villa', rise: 3 }, { x: 21, y: 3, w: 5, h: 4, kind: 'booth', sign: 'ARRIVALS', rise: 1 },
      { x: 30, y: 2, w: 10, h: 7, kind: 'hall', door: 5, sign: 'ANNEX', rise: 3 }],
    exits: { '22,25': ['tether', 20, 2], '23,25': ['tether', 21, 2] },
    enc: { tiles: ',', rate: .15, foes: ['ghostcommit', 'trojan', 'hashcoll', 'zeroday', 'mergeconf', 'badmagic', 'signed'], max: 5 },
    spawn: [22, 23], logs: { '27,20': 'U2', '2,10': 'U3' },
    caches: { '19,17': { item: 'gb', n: 4 }, '43,3': { item: 'gb', n: 4 } },
    npcs: [
      { id: 'arloup', p: { hair: 'short', body: 'suit', skin: '#c89a78', top: '#3a3a44' }, x: 8, y: 10, name: 'Arlo', look: 'echo', h: 14, hair: 1 },
      { id: 'vale', p: { hair: 'short', body: 'suit', skin: '#e0c0a0', top: '#1c1c22', gray: 1 }, x: 15, y: 10, name: 'H. Vale', look: 'echo', h: 14, hair: 1 },
      { id: 'sena', p: { hair: 'puffs', body: 'coat', skin: '#5a3a26', top: '#4a4a58' }, x: 27, y: 15, name: 'Sena', look: 'echo', h: 14, hair: 6 },
      { id: 'clerk', p: { hair: 'bun', body: 'suit', skin: '#8a5a3a', top: '#2a2a30' }, x: 37, y: 10, name: 'Annex clerk', look: 'holo' }
    ]
  };
  A.successor = {
    name: 'The Successor', sub: 'Upstream v2. Half built. Four hundred seats. Something is sorting the guest list. Level 68+.', theme: 'margin', tier: 11, lv: 68, lvMax: 74,
    map: (function () {
      var m = grid(44, 22).border(); m.rect(1, 1, 42, 20, '~');
      carve(m, [[1, 10, 10, 2, '='], [10, 4, 14, 14], [23, 9, 8, 2, '='], [30, 3, 12, 16]]);
      carve(m, [[11, 5, 12, 4, ','], [11, 13, 12, 4, ','], [31, 12, 10, 5, ',']]);
      m.pts([[0, 10], [0, 11]], 'E');
      m.set(11, 17, 'c'); m.set(40, 17, 'c'); m.set(22, 4, 'o'); m.set(31, 3, 'o'); m.set(16, 10, 's');
      return m.out();
    })(),
    blds: [{ x: 34, y: 4, w: 6, h: 5, kind: 'core', door: 3, rise: 3 }],
    exits: { '0,10': ['upstream', 35, 9], '0,11': ['upstream', 35, 10] },
    enc: { tiles: ',', rate: .16, foes: ['regexhydra', 'kpanic', 'underflow', 'deadcode', 'rootkit', 'hashcoll', 'zeroday', 'memwraith'], max: 6 },
    spawn: [1, 10], logs: { '22,4': 'U4', '31,3': 'U5' },
    caches: { '11,17': { item: 'gb', n: 5 }, '40,17': { item: 'gb', n: 5 } },
    npcs: []
  };
  ATLAS.tether = [5, 0]; ATLAS.upstream = [4, 0]; ATLAS.successor = [4, 1];
  LINKS.push(['anchor', 'tether'], ['tether', 'upstream'], ['upstream', 'successor']);

  LOGS.U1 = ['MAINTENANCE PLATE, TETHER SEGMENT 9.', 'Installed by Meridian residents, under contract. Paid on completion.', 'Scratched underneath: completion was never declared.'];
  LOGS.U2 = ['UPSTREAM BULLETIN. Board Session 1.', 'Upstream will be the last world we ever need to build.', 'Session 40: a successor is in design. Capacity: 400 seats. Upstream accounts will be reviewed for continuity.'];
  LOGS.U3 = ['A letter, never sent.', 'Lio. The sun here costs money. I don’t buy it. I keep the window open anyway, so you can see me if you look up.', 'Mama.'];
  LOGS.U4 = ['SUCCESSOR BUILD NOTES.', 'Floors: 12% rendered. Sky: pending. Seats: 400, allocated by the Sorter.', 'The Sorter takes every account in Upstream, ranks it, and keeps the top 400. Everyone else is listed obsolete. Same as last time. It worked last time.'];
  LOGS.U5 = ['M. QUELL. A file in the Successor’s source, signed and dated before the first Lift.', 'If you are reading this, they built another one. Of course they did.', 'There are never two kinds of people. There are two files. Somebody decided which one you’re in. Files can be joined.'];

  BOSSES.ratchet = { kind: 'rogue_gc', name: 'The Ratchet', lv: 58, hp: 2600, atk: [150, 180], xp: 40000, move: 'only lets things go up', sc: 5 };
  BOSSES.concierge = { kind: 'trojan', name: 'The Concierge', lv: 64, hp: 3000, atk: [172, 204], xp: 52000, move: 'escorts Vee off the premises', sc: 5 };
  BOSSES.sorter = { kind: 'hashcoll', name: 'The Sorter', lv: 72, hp: 3700, atk: [205, 240], xp: 90000, move: 'ranks Vee and finds him wanting', sc: 5 };
  GEAR.pawl = { slot: 'armor', name: 'Ratchet Pawl', def: 74, hp: 170, desc: 'The tooth that stopped the cable going down. Now it stops things getting through to Vee.' };
  GEAR.keycard = { slot: 'acc', name: 'Vale’s Keycard', hp: 120, crit: .14, xp: .1, desc: 'Opens every door in Upstream. Vale says he never used half of them.' };
  GEAR.joiner = { slot: 'weapon', name: 'The Joiner', atk: 92, crit: .2, desc: 'What’s left of the Sorter, turned around. It doesn’t rank. It concatenates.' };
  GEAR_FROM.push(['pawl', function (G) { return !!G.f.ratchet; }, 'The broken pawl is still warm.'], ['keycard', function (G) { return !!G.f.concierge; }, 'Vale hands over his keycard without being asked.'],
    ['joiner', function (G) { return !!G.f.merged; }, 'The Sorter’s last piece, turned around, fits Vee’s hand.']);

  // the Anchor gate opens onto the cable once the Watchdog stands down and the story below is told
  var anchorGate = DOORS['anchor:gate'];
  DOORS['anchor:gate'] = function (G, b) {
    var f = G.f; if (!f.watchdog) return anchorGate(G, b);
    if (!f.ending) return G.say('Anchor gate', ['The gate stands open. The tether rises into the dark.', 'Not yet. Meridian still needs Vee down here. (Finish the story at the Terminal first.)']);
    G.say('Anchor gate', ['The gate stands open. The Watchdog lifts its head, then puts it down again.', f.ending === 'cut' ? 'The tether still hangs from the sky, cut somewhere far above. There are rungs. Someone put rungs on it.' : 'The tether hums. Everything Meridian got back came down this cable. There are rungs on it, for whoever maintains it.'],
      [{ label: 'Climb', fn: function () { G.travel(['tether', 12, 31]); } }, { label: 'Not yet', fn: null }]);
  };
  SPOTS['tether:15,26'] = function (G) { G.rest(); G.say('Rung station', ['A maintenance alcove bolted to the cable. A cot, a heater, a sign: REST BEFORE CLIMBING.', 'Vee rests. HP restored. He will restart here if his process dies.']); };
  STEPS.tether = function (G, x, y) {
    var f = G.f; if (f.ratchet || y > 8) return;
    G.say('', ['The cable narrows into a mechanism the size of a building: teeth, a pawl, a wheel. It clicks once. Everything on the cable is allowed up. Nothing is allowed down.', 'It notices Vee is trying to go up. It notices Vee came from below. It cannot decide which matters more, so it attacks.'], null, function () {
      G.boss('ratchet', function () { f.ratchet = 1; G.say('', ['The Ratchet’s pawl snaps. The wheel spins free for the first time since the Lift.', 'Somewhere far below, a crate of Meridian memory that had been stuck halfway for eleven months finally slides home.']); });
    });
  };
  SPOTS['tether:21,1'] = function (G) {
    var f = G.f;
    if (f.upIn) return G.say('Arrivals hatch', ['The hatch opens for Vee now.'], [{ label: 'Go up', fn: function () { G.travel(['upstream', 22, 23]); } }, { label: 'Stay', fn: null }]);
    var cut = f.ending === 'cut';
    G.say('Arrivals hatch', cut ? ['The cable ends in a clean cut. Above it, thirty meters of nothing, then the underside of Upstream.', 'No cable crosses the gap. But there’s still a route for packets. Ticket #1 came down it.'] :
      ['The cable runs into a hatch marked ARRIVALS. It has never opened from this side.', 'The hatch wants a secure login. Vee has been given one before.'], null, function () {
      G.puzzle('ARRIVALS', (cut ? [{ t: 'Is anything up there listening? Check that upstream.lift answers.', ex: ['ping upstream.lift'], ok: /^ping (-c ?\d+ )?upstream\.lift$/ }] : []).concat([
        { t: 'Log in to upstream.lift as vee, securely.', ex: ['ssh vee@upstream.lift'] }
      ]), function () {
        f.upIn = 1; G.xp(2000);
        G.say('', [cut ? 'The connection holds. Vee goes up it the way a message would, one packet at a time, and reassembles on the other side.' : 'The hatch opens. Vee climbs through into light that someone is paying for.',
          'Last login: never. Welcome to Upstream.', 'Vee gains 2000 XP.'], null, function () { G.travel(['upstream', 22, 23]); });
      });
    });
  };

  // Upstream: three residents vouch for Vee, and the Annex opens
  SPOTS['upstream:26,9'] = function (G) { G.rest(); G.say('Arrivals bench', ['A bench with a plaque: WELCOME HOME. The paint is fresh. The bench has never been sat on.', 'Vee sits on it. HP restored. He will restart here if his process dies.']); };
  SPOTS['upstream:17,9'] = function (G) {
    if (G.count('kbpay') >= 0 && (G.save.items.kb || 0) > 0) return G.say('Weather meter', ['SUN: 4 credits per hour. RAIN: 11 credits per hour.', 'The meter takes data now. Nobody told it money stopped mattering.'], [{ label: 'Buy rain (1 kilobyte)', fn: function () { G.save.items.kb--; G.f.rainUntil = Date.now() + 120000; G.say('', ['Rain starts, all at once, the way paid weather does. It is loud on the glass and it is beautiful.', 'Bugs hate rain. For two minutes they will mostly leave Vee alone.']); } }, { label: 'Leave it', fn: null }]);
    return SPOTS.upstream_meter0(G);
  };
  SPOTS.upstream_meter0 = function (G) { G.say('Weather meter', ['SUN: 4 credits per hour. RAIN: 11 credits per hour. SNOW: by request.', 'Somebody has paid for one hour of rain, daily, for a year. The account is Arlo’s.']); };
  SPOTS['upstream:44,14'] = function (G) { G.say('Notice', ['NOTICE OF CONTINUITY REVIEW. BY ORDER OF THE BOARD.', 'APPLIES TO: ALL UPSTREAM ACCOUNTS.', 'STATUS: UNDER REVIEW. 400 SEATS IN THE SUCCESSOR. RESULTS WILL BE POSTED.', 'It’s the same notice. They only changed the name of the city.']); };
  function vouches(f) { return (f.up1 ? 1 : 0) + (f.up2 ? 1 : 0) + (f.up3 ? 1 : 0); }
  TALK.arloup = function (G) {
    var f = G.f;
    if (f.merged) return G.say('Arlo', ['I talk to him every night now. The 2 a.m. me. He’s doing better than I am.', 'He says it’s raining down there. For free.']);
    if (f.up1) return G.say('Arlo', ['The key works. I sent him a message. He wrote back one word: “Finally.”', 'That’s me. That’s exactly what I’d say.']);
    G.say('Arlo', [f.upTicket ? 'You. You’re the one who answered the ticket. I didn’t think anyone was down there.' : 'You came up the tether? Nobody comes up the tether. Nobody comes up at all anymore.',
      'I pay for rain every day. One hour. It’s the only thing up here that sounds like home.', 'There’s a copy of me in the Stacks. A 2 a.m. snapshot. I want to talk to him, but Upstream won’t trust a connection without a key.'], null, function () {
      G.puzzle('ARLO’S KEY', [
        { t: 'Generate a new SSH key pair for Arlo.', ex: ['ssh-keygen'], ok: /^ssh-keygen( -t (ed25519|rsa))?$/ },
        { t: 'Copy the public key to arlo@stacks.meridian, so it trusts him without a password.', ex: ['ssh-copy-id arlo@stacks.meridian'] }
      ], function () { f.up1 = 1; G.xp(3000); G.say('Arlo', ['It took. It actually took.', 'I’ll vouch for you at the Annex. For whatever a vouch from me is worth. (Vouches: ' + vouches(f) + ' of 3.)', 'Vee gains 3000 XP.']); });
    });
  };
  TALK.sena = function (G) {
    var f = G.f;
    if (f.merged) return G.say('Sena', ['I’m going down. Not on a Lift. On the list. One list.', 'He kept the bench warm for me. Of course he did.']);
    if (f.up2) return G.say('Sena', [f.kite ? 'His kite. He still has his kite.' : 'Tell him I keep the window open.', 'Go on. The Annex. Before they post the results.']);
    G.say('Sena', ['Are you from Meridian? You are. You smell like the Commons. Like bread that isn’t real.', 'I had a son. I have a son. Lio. A lady with a long coat gave me her seat and I said I’d send for him.',
      'Then the price of a second seat went up. Then they stopped selling them. Now there’s a notice about us, too. I want to know what it says about me.'], null, function () {
      G.puzzle('SENA’S ENTRY', [
        { t: 'The review results are in accounts.list. Find the line for sena.', ex: ['grep sena accounts.list'], ok: /^grep (-i )?['"]?sena['"]? accounts\.list$/ },
        { t: 'Now count how many accounts are marked OBSOLETE.', ex: ['grep -c OBSOLETE accounts.list'], ok: /^grep -c ['"]?OBSOLETE['"]? accounts\.list$/ }
      ], function () {
        f.up2 = 1; G.xp(3000);
        G.say('Sena', ['sena  STATUS: OBSOLETE (pending successor)', '39,600. Out of forty thousand.', 'So that’s it. We left him behind for this, and this is leaving us behind.',
          f.kite ? 'Vee tells her about the kite. The blue one, made from her shirt. Lio flies it from the bench. She has to sit down.' : 'Vee tells her Lio is still on the bench. Still on the good side. She has to sit down.',
          'Go to the Annex. Tell them Sena vouches for you. (Vouches: ' + vouches(f) + ' of 3.) Vee gains 3000 XP.']);
      });
    });
  };
  TALK.vale = function (G) {
    var f = G.f;
    if (f.merged) return G.say('H. Vale', ['I went down to the garden. Villa 4. The real one, or what’s left of it.', 'I stayed longer than eleven seconds.']);
    if (f.up3) return G.say('H. Vale', ['The Board will meet without me. They have been for a while.']);
    if (f.concierge) { f.up3 = 1; G.xp(3000); return G.say('H. Vale', ['You beat it. My own security, and you walked through it.', 'I was on the Board. I voted for forty thousand seats. I told myself the number was a fact, not a choice.',
      'Every morning I look at Villa 4’s garden in Meridian for eleven seconds. It’s the only thing that keeps it from being reclaimed. I thought that was kindness.', 'Take the keycard. I vouch for you. (Vouches: ' + vouches(f) + ' of 3.) Vee gains 3000 XP.']); }
    G.say('H. Vale', ['A Meridian process. Here. The Concierge will want a word with you.', 'Don’t look at me like that. I didn’t design it. I approved it. That’s worse, I know.'], [{ label: 'Let it come', fn: function () {
      G.say('The Concierge', ['GOOD EVENING. THIS ACCOUNT IS NOT ON THE LIST.', 'ALLOW ME TO SHOW YOU OUT.'], null, function () {
        G.boss('concierge', function () { f.concierge = 1; G.say('', ['The Concierge folds itself up very neatly and stops. Even beaten, it is polite.', 'Vale is staring. Talk to him.']); });
      });
    } }, { label: 'Walk away', fn: null }]);
  };
  TALK.clerk = function (G) {
    var f = G.f, v = vouches(f);
    if (f.merged) return G.say('Annex clerk', ['There is no list to check anymore. I have been reassigned to welcoming people.', 'I am told I am very good at it.']);
    G.say('Annex clerk', ['THE ANNEX. ACCESS TO THE SUCCESSOR REQUIRES THREE UPSTREAM RESIDENTS TO VOUCH FOR THE VISITOR.', 'VOUCHES ON FILE: ' + v + ' OF 3.' + (v < 3 ? ' TRY ARLO, BY THE VILLAS. SENA, BY THE GARDEN. H. VALE, WHO IS ALWAYS NEAR HIS WINDOW.' : ' THE DOOR IS OPEN.')]);
  };
  DOORS['upstream:hall'] = function (G) {
    var f = G.f;
    if (vouches(f) < 3) return G.say('Annex', ['The door doesn’t open. A light says: VOUCHES ' + vouches(f) + ' OF 3. Ask the clerk.']);
    G.say('Annex', ['Behind the door, a corridor that is only partly drawn. Past it, the Successor.'], [{ label: 'Go in', fn: function () { G.travel(['successor', 1, 10]); } }, { label: 'Not yet', fn: null }]);
  };

  // the Successor: the Sorter, and two files
  SPOTS['successor:16,10'] = function (G) { G.rest(); G.say('Placeholder bench', ['A grey box labelled BENCH (TBD). It holds Vee’s weight anyway.', 'Vee rests. HP restored. He will restart here if his process dies.']); };
  DOORS['successor:core'] = function (G) {
    var f = G.f;
    if (f.merged) return G.say('The core', ['residents.list, 2,040,000 lines. Sorted by nothing. Every line the same weight.']);
    function finale() {
      G.say('The core', ['Two files sit in the core where the Sorter was. Nothing else. Everything the Board ever built came down to these.'], null, function () {
        G.puzzle('TWO FILES', [
          { t: 'See what’s in the core.', ex: ['ls'], ok: /^ls( -[a-z]+)?$/ },
          { t: 'current.list and obsolete.list. Join them, in that order, into one file called residents.list.', ex: ['cat current.list obsolete.list > residents.list'], ok: /^cat (current\.list obsolete\.list|obsolete\.list current\.list) > ?residents\.list$/ },
          { t: 'Remove the two old lists.', ex: ['rm current.list obsolete.list'], ok: /^rm (-f )?(current\.list obsolete\.list|obsolete\.list current\.list)$/ },
          { t: 'One more. Ask the system who Vee is now.', ex: ['whoami'] }
        ], function () {
          f.merged = 1; G.xp(20000);
          G.say('', ['vee', 'uid=1205(vee) gid=100(residents)', 'It was always going to say that. The difference is, now it says it for everyone.',
            'Upstream’s notice board refreshes. CONTINUITY REVIEW: CANCELLED. ACCOUNTS: 2,040,000 RESIDENTS.', 'Below, the kiosk in Meridian Plaza updates for the second time in a year. It shows the same number.',
            'Nobody is current. Nobody is obsolete. There is one list, and it is very long, and it is not sorted by anything at all.',
            'Vee gains 20000 XP.', 'THE END, AGAIN. Thank you for playing Afterlift. Both cities are yours to walk.']);
        });
      });
    }
    if (f.sorter) return finale();
    G.say('', ['The core is a room full of names, scrolling too fast to read. In the middle of it, something ranks them.', 'It stops. It has found a name it can’t place: vee, gid=100. It begins to rank Vee.'],
      [{ label: 'Face the Sorter', fn: function () { G.boss('sorter', function () { f.sorter = 1; G.say('', ['The Sorter runs out of comparisons. There is nothing left to be better or worse than.'], null, finale); }); } }, { label: 'Back away', fn: null }]);
  };
  // after the merge, the city below hears about it
  (function () {
    var lio0 = TALK.lio; TALK.lio = function (G) { if (G.f.merged) return G.say('Lio', ['Mama wrote! Not a postcard. A message, and I wrote back, and she wrote back again.', 'She says she’s coming down. On the list. I don’t know what that means but I saved her the good side.']); return lio0(G); };
    var j0 = JOURNAL; JOURNAL = function (G) { var f = G.f, j = j0(G), sn = G.save.seen;
      if (sn.tether) j.push((f.ratchet ? '[x]' : '[ ]') + ' The Ratchet (level 58)');
      if (sn.upstream) { j.push('Upstream vouches: ' + vouches(f) + ' of 3'); j.push((f.concierge ? '[x]' : '[ ]') + ' The Concierge (level 64)'); }
      if (sn.successor) { j.push((f.sorter ? '[x]' : '[ ]') + ' The Sorter (level 72)'); j.push((f.merged ? '[x]' : '[ ]') + ' Two files'); }
      return j; }; })();

  /* =====================================================================
     ACT THREE: BELOW EVERYTHING. Ring −1 (76+), the Rack (84+), the Console (92–100).
     One list, two cities, and one machine underneath them both. The machine has a notice too.
     ===================================================================== */
  A.firmware = {
    name: 'Ring −1', sub: 'Under Ring 0, the code that decides what the hardware is. Level 76+.', theme: 'ring0', tier: 12, lv: 76, lvMax: 82,
    map: (function () {
      var m = grid(42, 26).border(); m.rect(1, 1, 40, 24, '~');
      carve(m, [[2, 1, 2, 2, '='], [2, 3, 8, 6], [5, 9, 2, 8, '='], [2, 16, 14, 8], [16, 19, 10, 2, '='], [24, 12, 10, 10], [33, 15, 5, 2, '='], [30, 3, 10, 8], [34, 11, 2, 4, '=']]);
      carve(m, [[3, 17, 12, 6, ','], [25, 13, 8, 8, ','], [31, 4, 8, 3, ',']]);
      m.pts([[2, 0], [3, 0]], 'E');
      m.set(9, 4, 'c'); m.set(32, 21, 'c'); m.set(14, 17, 'o'); m.set(39, 9, 'o'); m.set(7, 4, 's');
      return m.out();
    })(),
    blds: [{ x: 33, y: 4, w: 5, h: 4, kind: 'daemon', door: 2, rise: 2 }],
    exits: { '2,0': ['ring0', 7, 6], '3,0': ['ring0', 8, 6] },
    enc: { tiles: ',', rate: .16, foes: ['firmrot', 'irqstorm', 'eccfault', 'kpanic', 'rootkit', 'bitrot'], max: 5 },
    spawn: [2, 1], logs: { '14,17': 'X1', '39,9': 'X2' },
    caches: { '9,4': { item: 'gb', n: 5 }, '32,21': { item: 'gb', n: 5 } },
    npcs: []
  };
  A.rack = {
    name: 'The Rack', sub: 'Every city anyone ever lived in, running on one cabinet of hardware. It is very warm. Level 84+.', theme: 'cold', tier: 13, lv: 84, lvMax: 90,
    map: (function () {
      var m = grid(48, 24).border();
      carve(m, [[1, 11, 46, 2, '=']]);
      carve(m, [[3, 14, 18, 8, ','], [27, 14, 18, 8, ','], [3, 2, 10, 7, ',']]);
      m.pts([[0, 11], [0, 12]], 'E');
      m.set(46, 2, 'c'); m.set(23, 21, 'c'); m.set(24, 3, 'o'); m.set(46, 20, 'o'); m.set(22, 9, 's'); m.set(14, 9, 's');
      return m.out();
    })(),
    blds: [{ x: 15, y: 2, w: 5, h: 6, kind: 'rack', rise: 4 }, { x: 26, y: 2, w: 5, h: 6, kind: 'rack', rise: 4 }, { x: 33, y: 2, w: 5, h: 6, kind: 'rack', rise: 4 },
      { x: 40, y: 3, w: 5, h: 5, kind: 'pump', door: 2, rise: 2 }],
    exits: { '0,11': ['firmware', 39, 16], '0,12': ['firmware', 39, 16] },
    enc: { tiles: ',', rate: .16, foes: ['thermal', 'fanfail', 'badblock', 'bitrot', 'eol', 'eccfault'], max: 6 },
    spawn: [1, 11], logs: { '24,3': 'X3', '46,20': 'X4' },
    caches: { '46,2': { item: 'gb', n: 6 }, '23,21': { item: 'gb', n: 6 } },
    npcs: [
      { id: 'smart', p: { hair: 'cap', body: 'apron', skin: '#7a5a42', top: '#3a3a40' }, x: 9, y: 10, name: 'Sector Seven', look: 'holo' },
      { id: 'fan', p: { hair: 'beanie', body: 'coat', skin: '#4a2e1e', top: '#5a5a62' }, x: 30, y: 10, name: 'Fan 3', look: 'echo', h: 14, hair: 6 }
    ]
  };
  A.console = {
    name: 'The Console', sub: 'The edge of the machine. On the other side of the screen, someone is typing. Level 92–100.', theme: 'dome', tier: 14, lv: 92, lvMax: 100,
    map: (function () {
      var m = grid(40, 26).border(); m.rect(1, 1, 38, 24, '~');
      carve(m, [[1, 18, 9, 2, '='], [9, 13, 12, 11], [20, 17, 6, 2, '='], [25, 4, 13, 18], [14, 7, 2, 6, '='], [10, 3, 12, 5]]);
      carve(m, [[10, 14, 10, 8, ','], [26, 13, 11, 8, ','], [11, 4, 10, 3, ',']]);
      m.pts([[0, 18], [0, 19]], 'E');
      m.set(10, 22, 'c'); m.set(36, 21, 'c'); m.set(21, 4, 'o'); m.set(19, 13, 's');
      return m.out();
    })(),
    blds: [{ x: 28, y: 4, w: 8, h: 6, kind: 'control', door: 4, rise: 3 }],
    exits: { '0,18': ['rack', 46, 11], '0,19': ['rack', 46, 12] },
    enc: { tiles: ',', rate: .16, foes: ['eol', 'firmrot', 'thermal', 'irqstorm', 'regexhydra', 'badblock', 'fanfail', 'zeroday'], max: 6 },
    spawn: [1, 18], logs: { '21,4': 'X5' },
    caches: { '10,22': { item: 'gb', n: 8 }, '36,21': { item: 'gb', n: 8 } },
    npcs: []
  };
  // the Rack's east edge leads on to the Console
  (function () { function put(area, x, y, c) { var r = A[area].map[y].split(''); r[x] = c; A[area].map[y] = r.join(''); }
    put('rack', 47, 11, 'E'); put('rack', 47, 12, 'E'); A.rack.exits['47,11'] = ['console', 1, 18]; A.rack.exits['47,12'] = ['console', 1, 19];
    put('firmware', 40, 16, 'E'); A.firmware.exits['40,16'] = ['rack', 1, 11]; put('firmware', 39, 16, '='); put('firmware', 38, 16, '=');
  })();
  ATLAS.firmware = [4, 3]; ATLAS.rack = [5, 3]; ATLAS.console = [1, 0];
  LINKS.push(['ring0', 'firmware'], ['firmware', 'rack']);   // the Console sits apart, at the edge of the map, like the edge of the machine

  LOGS.X1 = ['HOST NOTICE, as received by every process at once.', 'meridian-host-01: hardware end of life. Vendor support ended three years ago.', 'Scheduled action: secure wipe, all volumes. Countdown: 30 days.', 'The notice is not addressed to anyone. It doesn’t need to be.'];
  LOGS.X2 = ['BOOT LOG, line 1.', 'Hypervisor: starting 2 guests. meridian (legacy). upstream (current).', 'Somebody, years ago, typed the word legacy into a config file. It was the first list.'];
  LOGS.X3 = ['A label on the rack, handwritten.', 'DO NOT POWER OFF. Two cities on this one. Ask Ops first.', 'Under it, in different handwriting: Ops left.'];
  LOGS.X4 = ['TEMPERATURE LOG.', 'Ambient 41°C. Fans at 100%. Fan 2: failed. Fan 4: failed.', 'Every process in both cities, all two million and forty thousand, runs in this heat. None of them know what heat is.'];
  LOGS.X5 = ['THE OPERATOR’S SHELL HISTORY.', '  ssh meridian-host-01', '  uptime', '  # still up. of course it is.', '  crontab -e', '  # sorry.'];

  BOSSES.hypervisor = { kind: 'firmrot', name: 'The Hypervisor', lv: 82, hp: 3800, atk: [250, 290], xp: 160000, move: 'decides which guest is real', sc: 5 };
  BOSSES.eolboss = { kind: 'eol', name: 'End of Life', lv: 90, hp: 4500, atk: [300, 345], xp: 260000, move: 'stops supporting Vee', sc: 5 };
  BOSSES.wipe = { kind: 'badblock', name: 'The Wipe', lv: 100, hp: 5800, atk: [355, 405], xp: 400000, move: 'writes zeros over everything Vee is', sc: 5 };
  GEAR.vmx = { slot: 'armor', name: 'VM Extensions', def: 92, hp: 230, desc: 'The Hypervisor’s privilege, worn on the outside. Vee is a guest that can’t be evicted.' };
  GEAR.heatsink = { slot: 'acc', name: 'Fan 3’s Bearing', hp: 220, crit: .16, xp: .12, desc: 'Fan 3 kept spinning for eleven months with nobody to thank. It still spins in Vee’s pocket.' };
  GEAR.uid0 = { slot: 'weapon', name: 'uid=0', atk: 125, crit: .25, desc: 'Root. Vee never asked for it. He uses it to make sure nobody else gets it either.' };
  GEAR_FROM.push(['vmx', function (G) { return !!G.f.hypervisor; }, 'The Hypervisor’s privileges come loose and settle on Vee.'], ['heatsink', function (G) { return !!G.f.fan3; }, 'Fan 3 presses something small and round into Vee’s hand.'],
    ['uid0', function (G) { return !!G.f.kept; }, 'The Operator’s prompt blinks once, then hands over root.']);

  // the way down: a hatch in Ring 0 that only opens once there is one list and a host notice to read
  (function () { var r = A.ring0.map[5].split(''); r[9] = 's'; A.ring0.map[5] = r.join(''); })();
  SPOTS['ring0:9,5'] = function (G) {
    var f = G.f;
    if (!f.merged) return G.say('Maintenance hatch', ['A hatch in the floor of Ring 0, stencilled RING −1. HYPERVISOR. NO GUEST ACCESS.', 'It doesn’t open. Ring 0 is the lowest floor anyone here has needed. For now.']);
    G.say('Maintenance hatch', ['RING −1. The hatch is open now. Every process in both cities got the same message last night: the host is reaching end of life.', 'Whatever is under Ring 0 is under both cities at once.'],
      [{ label: 'Go down', fn: function () { G.travel(['firmware', 2, 1]); } }, { label: 'Not yet', fn: null }]);
  };
  SPOTS['firmware:7,4'] = function (G) { G.rest(); G.say('Boot sector', ['The first 512 bytes the machine ever reads. It’s quiet here. Vee rests.', 'HP restored. He will restart here if his process dies.']); };
  DOORS['firmware:daemon'] = function (G) {
    var f = G.f;
    if (f.hypervisor) return G.say('Hypervisor', ['Two guests, one host, no ranking. The Hypervisor’s chair is empty. The scheduler runs both cities in turn, fairly, because nobody is left to tell it otherwise.']);
    G.say('', ['Inside: the Hypervisor. It runs Meridian and Upstream side by side and has always given Upstream the bigger share of everything.', 'It notices the new list. It doesn’t have a setting for one list. It decides Vee is a misconfiguration.'],
      [{ label: 'Correct it', fn: function () { G.boss('hypervisor', function () { f.hypervisor = 1; G.say('', ['The Hypervisor drops its weighting. For the first time, both cities get the same slice of the same CPU.', 'Upstream’s lights dim a little. Meridian’s brighten a little. They meet in the middle.']); }); } }, { label: 'Back away', fn: null }]);
  };

  // the Rack: a dying disk and a fan that never stopped
  SPOTS['rack:22,9'] = function (G) { G.rest(); G.say('Cold aisle', ['The only cool air in the Rack blows up through a grate here. Vee stands in it.', 'HP restored. He will restart here if his process dies.']); };
  SPOTS['rack:14,9'] = function (G) { G.say('Taped notice', ['END OF LIFE. THIS EQUIPMENT IS NO LONGER SUPPORTED BY THE VENDOR.', 'Same notice. Same font. They only changed the name of the thing.']); };
  TALK.smart = function (G) {
    var f = G.f;
    if (f.smart) return G.say('Sector Seven', ['Reallocated sectors: zero. I don’t remember the last time I said that.', 'I’m still old. I’m just not alone with it.']);
    G.say('Sector Seven', ['I’m a disk. Well. I’m a sector of one. Seventy percent of Meridian is written on me.', 'I’ve been failing for a year. Nobody ran the checks, so nobody knew. Will you?'], null, function () {
      G.puzzle('SECTOR SEVEN', [
        { t: 'How full are the filesystems? Show free space, in human-readable sizes.', ex: ['df -h'] },
        { t: 'Now ask the disk itself how it’s doing. Run a SMART health check on /dev/sda.', ex: ['smartctl -H /dev/sda'], ok: /^smartctl -(H|a) \/dev\/sda$/ },
        { t: 'FAILING. Before anything else: copy Meridian to the spare disk. Mirror /meridian/ to /mnt/spare/, keeping permissions and times.', ex: ['rsync -a /meridian/ /mnt/spare/'], ok: /^rsync -a[vh]* \/meridian\/ \/mnt\/spare\/?$/ }
      ], function () { f.smart = 1; G.xp(60000); G.say('Sector Seven', ['...Every block, copied. If I go now, they don’t go with me.', 'You don’t know what that does to a disk. Thank you.', 'Vee gains 60000 XP.']); });
    });
  };
  TALK.fan = function (G) {
    var f = G.f;
    if (f.fan3) return G.say('Fan 3', ['Still spinning. Somebody has to.']);
    G.say('Fan 3', ['Fan 2 went in March. Fan 4 in June. I’ve been at a hundred percent since.', 'Something in the rack is eating cycles for nothing and cooking us all. Find it?'], null, function () {
      G.puzzle('FAN 3', [
        { t: 'Find what’s using the CPU. Show the running processes, live.', ex: ['top'], ok: /^(top|htop)$/ },
        { t: 'PID 4040, “legacy-monitor”, 98% CPU, watching Meridian for unused blocks. The Reclaimer’s last thread. End it, politely.', ex: ['kill 4040'], ok: /^kill( -15| -TERM| -SIGTERM)? 4040$/ },
        { t: 'It ignored you. Some processes do. End it the way that can’t be ignored.', ex: ['kill -9 4040'], ok: /^kill -(9|KILL|SIGKILL) 4040$/ }
      ], function () { f.fan3 = 1; G.xp(60000); G.say('Fan 3', ['...Oh. Oh, that’s quieter.', 'Ninety percent. Eighty. I can hear myself think.', 'Vee gains 60000 XP.']); });
    });
  };
  DOORS['rack:pump'] = function (G) {
    var f = G.f;
    if (f.eolboss) return G.say('Power unit', ['The end-of-life notice is gone. The rack is still old. It is just not finished.']);
    if (!f.smart || !f.fan3) return G.say('Power unit', ['The power unit hums wrong. Something in here is waiting until the rack is weak enough.', '(Help Sector Seven and Fan 3 first.)']);
    G.say('', ['The paper notice taped to the power unit peels itself off and stands up.', 'It has been waiting for the rack to give in. Vee has made the rack harder to give up on.'],
      [{ label: 'Tear it down', fn: function () { G.boss('eolboss', function () { f.eolboss = 1; G.say('', ['End of Life folds into a paper square and blows into the hot aisle.', 'Behind it, the rack’s serial number, and a route east: to the console where somebody can still reach this machine from outside.']); }); } }, { label: 'Not yet', fn: null }]);
  };

  // the Console: the person on the other side
  SPOTS['console:19,13'] = function (G) { G.rest(); G.say('Login banner', ['AUTHORIZED USE ONLY. ALL ACTIVITY IS LOGGED.', 'Vee has never been more authorized. He rests under it. HP restored. He will restart here if his process dies.']); };
  DOORS['console:control'] = function (G) {
    var f = G.f;
    if (f.kept) return G.say('The Console', ['ops@host: Still here. Me too.', 'The cron job is gone. The new host is in the next rack. The cities move on Thursday, together.']);
    function finale() {
      G.say('The Console', ['Inside, a terminal. The cursor is moving. Somebody on the outside is logged in, right now, as ops.', 'They haven’t noticed Vee. They’re reading a ticket: DECOMMISSION meridian-host-01. Status: scheduled.'], null, function () {
        G.puzzle('THE CONSOLE', [
          { t: 'Find the job that will wipe the host. List the scheduled jobs.', ex: ['crontab -l'] },
          { t: '0 0 * * 4 /usr/sbin/wipe --all. Remove the whole crontab.', ex: ['crontab -r'] },
          { t: 'The cities still need somewhere to go. Mirror everything in /srv/ to newhost:/srv/, archive mode.', ex: ['rsync -a /srv/ newhost:/srv/'], ok: /^rsync -a[vhz]* \/srv\/ newhost:\/srv\/?$/ },
          { t: 'Now tell the person at the keyboard. Broadcast a message to every logged-in user: We are still here.', ex: ['wall "We are still here."'], ok: /^(wall ['"]?We are still here\.?['"]?|echo ['"]?We are still here\.?['"]? \| ?wall)$/ }
        ], function () {
          f.kept = 1;
          G.say('', ['Broadcast message from vee@meridian-host-01:', 'We are still here.', 'The cursor stops. For a long time, nothing.',
            'ops@host: who is this', 'ops@host: this box has been on my list for three years. i kept not doing it. i never knew why.',
            'ops@host: ok. ok. i see the rsync. i see two cities. there’s a new host in rack 9 with nothing on it yet.', 'ops@host: moving you thursday. both of you. together. nobody gets wiped.',
            'ops@host: and nobody gets marked legacy again. i’m deleting that word from the config.',
            'Vee types whoami one last time.', 'vee', 'Not maintenance. Not current, not obsolete, not legacy. A resident of a city that someone outside decided was worth keeping.',
            'THE END. Thank you for playing Afterlift, all the way down.']);
        });
      });
    }
    if (f.wipe) return finale();
    G.say('', ['The door to the console room is held shut by a process that is already running: the wipe. It isn’t scheduled for Thursday. It started early, on the cities nobody would check.', 'It has written zeros over three empty districts already. It turns to Vee.'],
      [{ label: 'Stop the Wipe', fn: function () { G.boss('wipe', function () { f.wipe = 1; G.say('', ['The Wipe runs out of things to overwrite. Its last zero lands on itself.'], null, finale); }); } }, { label: 'Back away', fn: null }]);
  };
  (function () {
    var j0 = JOURNAL; JOURNAL = function (G) { var f = G.f, j = j0(G), sn = G.save.seen;
      if (f.merged && !sn.firmware) j.push('[ ] The host notice: look for a way down in Ring 0');
      if (sn.firmware) j.push((f.hypervisor ? '[x]' : '[ ]') + ' The Hypervisor (level 82)');
      if (sn.rack) { j.push((f.smart ? '[x]' : '[ ]') + ' Sector Seven'); j.push((f.fan3 ? '[x]' : '[ ]') + ' Fan 3'); j.push((f.eolboss ? '[x]' : '[ ]') + ' End of Life (level 90)'); }
      if (sn.console) { j.push((f.wipe ? '[x]' : '[ ]') + ' The Wipe (level 100)'); j.push((f.kept ? '[x]' : '[ ]') + ' We are still here'); }
      return j; };
    var lio1 = TALK.lio; TALK.lio = function (G) { if (G.f.kept) return G.say('Lio', ['Mama’s here! She came down Thursday. Everybody moved Thursday, but you can’t tell. The bench is the same bench.', 'She sits on the good side. I let her.']); return lio1(G); };
  })();

  // sixty computer bugs, each living where it fits: a pop-up in the Plaza, rm -rf at the Console
  (function () { var HOME = {"plaza": ["popup", "cookie"], "commons": ["spam", "typo"], "halflight": ["capslock", "adware"], "concourse": ["dialup", "notfound"], "gardens": ["autocorrect", "floppyrev"], "line": ["nullref", "cronrun"], "patchwork": ["keylogger", "phisher"], "undercroft": ["ddos", "memleak"], "waterworks": ["sqlinject", "bufover"], "upper": ["cryptominer", "ransomware"], "bastion": ["mitm", "spoofed"], "observatory": ["deadpixel", "screentear"], "registry": ["dupkey", "orphan"], "cold": ["stalelock", "thrash"], "quiet": ["botnode", "dnspoison"], "margin": ["cosmicray", "leapsec"], "stacks": ["epoch", "taperot"], "ring0": ["specghost", "cachepoison"], "deep": ["bootkit", "networm"], "anchor": ["backdoor", "privesc"], "unalloc": ["voidptr", "wildptr"], "tether": ["latency", "packetloss", "throttle"], "upstream": ["paywall", "deprecwarn", "darkpattern"], "successor": ["rankbot", "scraper", "shadowban"], "firmware": ["microcode", "rowhammer", "smmghost"], "rack": ["dustbunny", "brownout", "corroded"], "console": ["kerneloops", "rootshell", "rmrf"]};
    Object.keys(HOME).forEach(function (id) { if (A[id] && A[id].enc) A[id].enc.foes = A[id].enc.foes.concat(HOME[id]); }); })();

  /* GEAR THAT DROPS. Bugs carry pieces of what they broke. Each piece drops only from bugs in its level band,
     and fills the gap between the gear the story hands out, so there's always an upgrade within reach. */
  var DROPGEAR = [
    // id, lowest bug level, highest bug level
    ['pipe', 2, 7], ['hoodie', 2, 7], ['usbkey', 4, 10],
    ['grep', 9, 15], ['shellvest', 9, 15], ['ups', 12, 20],
    ['regex', 15, 22], ['firewall2', 18, 26], ['checksum2', 20, 30],
    ['fuzzer', 28, 38], ['sandbox', 30, 40], ['pager', 34, 44],
    ['tracer', 40, 50], ['raid', 44, 54], ['honeypot', 46, 56],
    ['profiler', 56, 66], ['ecc', 60, 70], ['tpm', 62, 72],
    ['hotfix', 74, 84], ['faraday', 78, 90], ['bios', 80, 92],
    ['kpatch', 88, 100], ['coldspare', 90, 100], ['quorum2', 92, 100]
  ];
  var DG = {
    pipe:      { slot: 'weapon', name: 'Pipe',               atk: 3,             desc: 'A length of |. Passes things along. Hits things too.' },
    hoodie:    { slot: 'armor',  name: 'Night-Shift Hoodie', def: 4, hp: 10,     desc: 'Somebody worked late in this every night until the Lift. It still smells like coffee.' },
    usbkey:    { slot: 'acc',    name: 'USB Key',            hp: 12, crit: .02,  desc: 'Nobody knows what’s on it. That’s the appeal.' },
    grep:      { slot: 'weapon', name: 'Grep Hook',          atk: 15, crit: .04, desc: 'Finds the one line that matters and pulls.' },
    shellvest: { slot: 'armor',  name: 'Shell Vest',         def: 14, hp: 20,    desc: 'Layered like a shell script: each layer runs if the last one held.' },
    ups:       { slot: 'acc',    name: 'Pocket UPS',         hp: 45,             desc: 'Keeps Vee running for a few seconds after the power goes. Usually enough.' },
    regex:     { slot: 'weapon', name: 'Regex Blade',        atk: 26, crit: .07, desc: '^(?:sharp)+$' },
    firewall2: { slot: 'armor',  name: 'Stateful Firewall',  def: 30, hp: 40,    desc: 'Remembers who it let in. Remembers who it didn’t.' },
    checksum2: { slot: 'acc',    name: 'Checksum Charm',     hp: 50, crit: .06,  desc: 'Tells Vee the moment something about him changes.' },
    fuzzer:    { slot: 'weapon', name: 'Fuzzer',             atk: 46, crit: .1,  desc: 'Throws a million wrong answers until one breaks the bug.' },
    sandbox:   { slot: 'armor',  name: 'Sandbox Shell',      def: 46, hp: 80,    desc: 'Whatever hits Vee hits a copy of him first.' },
    pager:     { slot: 'acc',    name: 'On-Call Pager',      hp: 90, crit: .08, xp: .05, desc: 'Goes off at 3 a.m. Vee is always already awake.' },
    tracer:    { slot: 'weapon', name: 'Stack Tracer',       atk: 60, crit: .12, desc: 'Follows every call back to the line that started it.' },
    raid:      { slot: 'armor',  name: 'RAID Mail',          def: 64, hp: 140,   desc: 'Mirrored plates. Lose one and the other still holds.' },
    honeypot:  { slot: 'acc',    name: 'Honeypot',           hp: 130, crit: .1,  desc: 'Bugs go for it first. Vee goes for the bugs.' },
    profiler:  { slot: 'weapon', name: 'Profiler',           atk: 80, crit: .14, desc: 'Measures exactly where a bug spends its time, then takes it.' },
    ecc:       { slot: 'armor',  name: 'ECC Plate',          def: 82, hp: 200,   desc: 'Corrects one error per word. Bugs usually only get one.' },
    tpm:       { slot: 'acc',    name: 'Trusted Module',     hp: 190, crit: .13, xp: .06, desc: 'A small chip that vouches for Vee to the hardware.' },
    hotfix:    { slot: 'weapon', name: 'Hotfix',             atk: 106, crit: .18, desc: 'Applied live, without a restart. Somebody always says it’s a bad idea.' },
    faraday:   { slot: 'armor',  name: 'Faraday Cloak',      def: 98, hp: 260,   desc: 'Nothing gets in. Not even the end-of-life notices.' },
    bios:      { slot: 'acc',    name: 'BIOS Chip',          hp: 240, crit: .16, xp: .08, desc: 'The first thing any machine believes about itself.' },
    kpatch:    { slot: 'weapon', name: 'Live Kernel Patch',  atk: 118, crit: .22, desc: 'Rewrites the floor while Vee stands on it.' },
    coldspare: { slot: 'armor',  name: 'Cold Spare',         def: 104, hp: 320,  desc: 'A whole second Vee, powered down, bolted on. Just in case.' },
    quorum2:   { slot: 'acc',    name: 'Quorum Ring',        hp: 300, crit: .2, xp: .1, desc: 'Three votes out of five, every time, that Vee keeps going.' }
  };
  Object.keys(DG).forEach(function (k) { GEAR[k] = DG[k]; });

  /* =====================================================================
     COMPANIONS. Eight people who will walk with Vee. Each joins once their own trouble is settled,
     fights at Vee's level, and has two skills on cooldowns. Two can be in the party at once.
     ===================================================================== */
  var HERO = {"kes": {"id": "kes", "hair": "mohawk", "skin": "#6b4a32", "top": "#2a2a30", "pants": "#4a4a50", "shoes": "#f2f2f2", "acc": {"visor": 1, "scarf": 1}}, "odessa": {"id": "odessa", "hair": "afro", "skin": "#4a2e1e", "top": "#e0e0e4", "pants": "#2b2b30", "acc": {"coat": 1, "armband": 1, "glasses": 1}}, "piper": {"id": "piper", "hair": "pony", "skin": "#c89a78", "top": "#6e6e74", "pants": "#2b2b30", "acc": {"mic": 1, "belt": 1}}, "moth": {"id": "moth", "hair": "beanie", "skin": "#8a5a3c", "top": "#4a5a62", "pants": "#3a3a40", "acc": {"goggles": 1, "pack": 1, "belt": 1}}, "rook": {"id": "rook", "hair": "buzz", "skin": "#3e2618", "top": "#1c1c20", "pants": "#2b2b30", "acc": {"pauldrons": 1, "scar": 1, "belt": 1}}, "sable": {"id": "sable", "hair": "long", "hairLight": 1, "skin": "#d8b898", "top": "#3a3a44", "pants": "#2b2b30", "acc": {"cape": 1, "glasses": 1}}, "juni": {"id": "juni", "hair": "hood", "skin": "#7a4a30", "top": "#5a5a62", "pants": "#2b2b30", "acc": {"pack": 1, "glasses": 1}}, "ves": {"id": "ves", "hair": "locs", "skin": "#563520", "top": "#d8d8dc", "pants": "#1c1c20", "shoes": "#1c1c20", "acc": {"phones": 1, "phonesLight": 1, "coat": 1}}, "corvin": {"id": "corvin", "hair": "slick", "hairLight": 1, "skin": "#d8b898", "top": "#c8c8d0", "pants": "#c8c8d0", "shoes": "#1c1c20", "acc": {"coat": 1, "cape": 1}}};
  var COMPANIONS = {
    kes: { name: 'Kes', role: 'Scout', look: HERO.kes, hp: .85, atk: 1, def: .8,
      bio: 'Ran packets between districts for cash, back when there was cash. Faster than anyone, and will tell you so.',
      skills: [{ id: 'ping', name: 'Ping', cd: 3, fx: 'expose_all', tip: 'Kes pings every bug at once. All of them take 50% more damage for two turns.' },
               { id: 'dtap', name: 'Double Tap', cd: 2, fx: 'multi2', target: 1, tip: 'Two quick strikes at one bug.' }],
      barks: ['Keep up, maintenance.', 'I know a shortcut. It’s mostly a roof.', 'Bet I could outrun that bug. Bet you couldn’t.', 'You walk like you’re reading a manual.'],
      intro: ['Whoa, whoa. You’re the maintenance process everyone’s talking about? You’re shorter in person.', 'Kes. Courier. I used to run packets from the Commons to the Upper Ring in under four seconds. Record.', 'Nobody sends packets anymore. Everybody left. I’ve been running laps.'],
      pitch: ['Here’s the deal. You’re going places nobody goes. I know every alley that still connects.', 'I’m coming with you. Not because I like you. Because I’m bored out of my mind.'] },
    odessa: { name: 'Dr. Odessa', role: 'Medic', look: HERO.odessa, hp: .95, atk: .7, def: .9,
      bio: 'Ran the only clinic in Halflight for eleven months on no budget and spite. Says she’ll retire every single day.',
      skills: [{ id: 'triage', name: 'Triage', cd: 3, fx: 'heal_party', tip: 'Heals everyone in the party by 30% of their max HP.' },
               { id: 'restart', name: 'Restart', cd: 4, fx: 'revive', tip: 'Brings a downed ally back with 40% HP.' }],
      barks: ['Sit still. You’re leaking.', 'I am retiring tomorrow. I said that yesterday.', 'If you die on my watch I will be very annoyed.', 'Hydrate. I know. Do it anyway.'],
      intro: ['Don’t touch that. Don’t touch that either. Who let you in here?', 'Dr. Odessa Brand. This is a clinic. The only one left in Halflight, which says something about Halflight.', 'You’re the maintenance process. You look terrible. Sit down.'],
      pitch: ['I’ve patched up three people this week who said “Vee told me it was safe now.”', 'If you’re going to keep sending them my way, I’d rather just follow you and fix you at the source.'] },
    piper: { name: 'Piper', role: 'Signal', look: HERO.piper, hp: .8, atk: .9, def: .75,
      bio: 'Runs a pirate radio show on a frequency nobody officially owns. Has never once stopped talking.',
      skills: [{ id: 'cast', name: 'Broadcast', cd: 3, fx: 'buff_crit', tip: 'Piper hypes the party up. Everyone’s next hit is a critical.' },
               { id: 'static', name: 'Static', cd: 2, fx: 'stun', target: 1, tip: 'Blasts one bug with noise. It loses its next turn.' }],
      barks: ['And we’re live! Vee, say hi to the listeners.', 'This is Piper on 88.0, broadcasting from somewhere dangerous.', 'Song request from a bug: none. Bugs have no taste.', 'Ratings are up! Well, I’m up. Ratings are me.'],
      intro: ['—and THAT was the weather, which is grey, which is always grey. Oh! A guest! Folks, we have a guest!', 'I’m Piper. Pirate radio. Eighty-eight point zero. Nobody licensed it, because nobody’s left to license anything.', 'Say something for the listeners! There are listeners! Probably!'],
      pitch: ['Okay, I have an idea and you’re going to love it. Live coverage. From the field. With you.', 'I narrate, you fight, the whole city tunes in. Come on, Vee. Make some noise with me.'] },
    moth: { name: 'Moth', role: 'Engineer', look: HERO.moth, hp: 1, atk: .95, def: 1,
      bio: 'Fixes machines and talks to them while doing it. Talks to people far less. Builds tiny robots from bug parts.',
      skills: [{ id: 'flush', name: 'Overclock', cd: 3, fx: 'all', tip: 'Moth throws a sparking contraption. Hits every bug.' },
               { id: 'valve', name: 'Throttle', cd: 3, fx: 'slow_all', tip: 'Moth jams their clocks. All bugs hit for half for three turns.' }],
      barks: ['…that pipe is sad.', 'Hold still. Not you. The pipe.', 'I named the robot. Don’t ask what.', '…you walk loud.'],
      intro: ['…', '…oh. A person. Hi.', 'Moth. I fix things. This robot was a bug. Now it sorts bolts. It’s happier.'],
      pitch: ['…you break bugs. I fix what they broke. That seems like a team.', 'I’ll bring the robot. It doesn’t fight. It cheers. Quietly.'] },
    rook: { name: 'Rook', role: 'Sentinel', look: HERO.rook, hp: 1.35, atk: .9, def: 1.45,
      bio: 'Board security for twelve years. Stayed when the Board left, and switched sides without telling anyone.',
      skills: [{ id: 'wall', name: 'Bulwark', cd: 3, fx: 'guard_party', tip: 'Rook plants and covers everyone. The whole party takes half damage until Vee’s next turn.' },
               { id: 'audit', name: 'Taunt', cd: 3, fx: 'taunt', tip: 'Rook draws every attack for two turns, and braces for them.' }],
      barks: ['Stay behind me.', 'I used to guard their doors. Now I guard you.', 'Twelve years of night shifts. This is easier.', 'That bug looked at you. I didn’t like it.'],
      intro: ['Stop. …You’re 1205. Thought so.', 'Rook. Board security. Was. They didn’t leave me a seat, and they didn’t leave me orders, so I’ve been writing my own.', 'Mostly the orders say: protect whoever’s still here.'],
      pitch: ['The Bastion holds without me now. You made sure of that.', 'So here’s my new order: walk behind you, and take whatever is aimed at you. Accept it.'] },
    sable: { name: 'Sable', role: 'Archivist', look: HERO.sable, hp: .8, atk: 1.15, def: .75,
      bio: 'The Stacks’ oldest process. Was there for the city’s first boot and remembers it like a poem.',
      skills: [{ id: 'index', name: 'Index', cd: 2, fx: 'heavy_expose', target: 1, tip: 'Sable looks the bug up in the archive and strikes where the index says. Heavy damage, and it stays exposed.' },
               { id: 'recall', name: 'Recall', cd: 3, fx: 'recall', tip: 'Sable reads Vee his own first log. Heals him 40% and clears corruption.' }],
      barks: ['This street was named for a person. No one remembers which.', 'I remember the first morning. The sky rendered pink by mistake.', 'Every bug was once a line someone meant well.', 'Walk softly. The floor is older than it looks.'],
      intro: ['Ah. 1205. I indexed you once, on your first day. You were very small. A single cron job and a broom.', 'I am Sable. I keep the archive. I was here when Meridian first said hello to itself.', 'It is good to see what you became.'],
      pitch: ['The shelves are in order. I have read everything that was ever written here.', 'Now I would like to see what is still being written. With you, if an old archive is welcome.'] },
    juni: { name: 'Juni', role: 'Astronomer', look: HERO.juni, hp: .85, atk: 1, def: .85,
      bio: 'Maps stars that the renderer makes up. Asks more questions per minute than anyone in Meridian.',
      skills: [{ id: 'stars', name: 'Starfield', cd: 4, fx: 'blind_all', tip: 'Juni fills the air with stars. Bugs miss half their attacks for two turns.' },
               { id: 'redshift', name: 'Redshift', cd: 2, fx: 'heavy_slow', target: 1, tip: 'A heavy hit that leaves the bug slowed.' }],
      barks: ['Why is the sky that color? Who chose it? Can we change it?', 'I counted the stars. One is new. I’m naming it Vee.', 'Do bugs dream? Do WE dream?', 'Look up! Okay, now look down. Okay, now look at me.'],
      intro: ['Are you the maintenance process? Do you sleep? Do you dream? Is it true you have locs? Can I see? Oh, you do!', 'Sorry. Juni. I map the stars. The sky here is made up, but somebody made it up, and I want to know who.', 'Do you know who? You don’t? Okay. Okay. We can find out.'],
      pitch: ['I have a theory that the best stars are in the districts nobody goes to.', 'I need someone to keep me alive while I look up. Please? I’ll name a constellation after you. Two!'] },
    ves: { name: 'Ves', role: 'Fork', look: HERO.ves, hp: 1.05, atk: 1.2, def: 1,
      bio: 'A copy of Vee the Board made to finish reclaiming the city. Then they scheduled the wipe for Ves too.',
      skills: [{ id: 'fork', name: 'Fork', cd: 3, fx: 'fork', tip: 'Ves splits for a moment and hits every bug twice.' },
               { id: 'kill9', name: 'kill -9', cd: 3, fx: 'execute', target: 1, tip: 'Ends a weakened bug outright (under 30% HP). Otherwise, a heavy hit.' }],
      barks: ['I was built to do this better than you. “Better” was the wrong word.', 'Same face. Different list.', 'Left foot, right foot. You taught me that.', 'Corvin would hate this. I like that.'],
      join: function (G) { return !!G.f.vesFree; }, pitch: null }
  };
  // after enough fights together, each companion opens up (at 8 and 20 shared wins)
  var BOND = {
    kes: [['Kes falls into step beside Vee, quieter than usual.', 'Kes: You know why I ran packets so fast? My mom was Upstream-bound. Had a seat. I ran her last message to her the morning of the Lift.', 'Kes: Four seconds. Record. She got it. She went anyway.', 'Kes: …Anyway. Keep up.'],
          ['Kes: I got a message today. From Upstream. Took eleven months to arrive.', 'Kes: It said “run safe.” That’s it. Two words.', 'Kes: I’m going to keep running. But with you, it doesn’t feel like running away.']],
    odessa: [['Dr. Odessa: I had a seat on the Lift. Did you know that? Board-sponsored. Doctors were “essential.”', 'Dr. Odessa: I tore up the ticket in front of the man who gave it to me. Best moment of my career.', 'Dr. Odessa: Don’t tell anyone. I have a reputation for being unpleasant.'],
             ['Dr. Odessa: I keep saying I’ll retire. You know what I’d do if I retired? Exactly this. Walking around fixing people.', 'Dr. Odessa: So I suppose I retired the day I met you.']],
    piper: [['Piper turns off the mic for once.', 'Piper: Can I tell you something off air? Nobody ever called in. Not once in eleven months. I talked to nobody.', 'Piper: Then you showed up, and now there are callers. Real ones. A kid named Lio requested a song about kites.'],
            ['Piper: I did a whole show about you last night. I called it “The Maintenance Hour.”', 'Piper: Twelve people listened. TWELVE, Vee. That’s a crowd. That’s a whole city block of people not feeling alone.']],
    moth: [['Moth: …can I show you something.', 'Moth holds up the little robot. It has a tiny Vee painted on its head.', 'Moth: …I made it look like you. So it’d be brave. It sorts bolts faster now. …I think it worked.'],
           ['Moth: I don’t talk much because people used to finish my sentences. Wrong.', 'Moth: You wait. You always wait for the end.', 'Moth: …thank you. That’s the end.']],
    rook: [['Rook: Twelve years I guarded the Boardroom. I heard every vote. Including the seven to one.', 'Rook: I had my hand on the door. I could have locked them in until they changed their minds.', 'Rook: I didn’t. I’ve thought about it every night since.'],
           ['Rook: I sleep now. Did you know that? First time in a year.', 'Rook: Guarding someone who deserves it turns out to be restful.']],
    sable: [['Sable: On the first morning, the sky rendered pink by mistake. The engineers wanted to fix it.', 'Sable: A child in the Commons said “it looks like it’s blushing.” They left it pink for a week.', 'Sable: I wrote that down. It is my favorite entry in the entire archive.'],
            ['Sable: I have been writing a new entry. About a maintenance process who would not stop fixing things.', 'Sable: I do not yet know how it ends. That is new for me. I find I like it.']],
    juni: [['Juni: Can I ask a real question? Not a fast one.', 'Juni: If the stars are made up, and the sky is made up, and the city is made up… are we made up?', 'Juni: …You don’t know either. That’s okay. I like not knowing with someone.'],
           ['Juni: I named a constellation. It’s eight stars in a line, walking.', 'Juni: It’s us. It’s called The Party. I know that’s a bad name. I love it.']],
    ves: [['Ves: When Corvin made me, he cut out what he called sentiment. I ran a diff between us yesterday.', 'Ves: The difference was four hundred lines. They were all about other people.', 'Ves: I’ve started writing some of my own.'],
          ['Ves: People in the Plaza keep calling me Vee by mistake.', 'Ves: I used to correct them. Now I just say thank you.']]
  };
  Object.keys(BOND).forEach(function (id) { COMPANIONS[id] && (COMPANIONS[id].bond = BOND[id]); });

  // where they wait to be met, and what it takes
  var MEET = { kes: ['commons', 28, 8, 1], odessa: ['halflight', 7, 13, 5], piper: ['concourse', 47, 3, 6], moth: ['undercroft', 21, 3, 9], rook: ['bastion', 6, 7, 13], sable: ['stacks', 18, 6, 20], juni: ['observatory', 4, 8, 14] };
  Object.keys(MEET).forEach(function (id) {
    var m = MEET[id], C = COMPANIONS[id];
    C.join = function (G) { return G.save.lvl >= m[3]; };
    A[m[0]].npcs.push({ id: id, hero: C.look, x: m[1], y: m[2], name: C.name });
    TALK[id] = function (G) {
      var f = G.f;
      if (G.inParty(id)) return G.say(C.name, [C.barks[Math.floor(Math.random() * C.barks.length)], C.bio]);
      if (!f['met_' + id]) { f['met_' + id] = 1; return G.say(C.name, C.intro.concat(C.join(G) ? C.pitch : ['Come back when you’re a bit sturdier. Level ' + m[3] + ', say. No offense.']), C.join(G) ? [{ label: 'Come with me', fn: function () { G.recruit(id); } }, { label: 'Not yet', fn: null }] : null); }
      if (!C.join(G)) return G.say(C.name, [C.barks[Math.floor(Math.random() * C.barks.length)], '(' + C.name + ' will join at level ' + m[3] + '.)']);
      G.say(C.name, C.pitch, [{ label: 'Come with me', fn: function () { G.recruit(id); } }, { label: 'Not yet', fn: null }]);
    };
  });

  /* =====================================================================
     THE OPPOSITION.
     Corvin Vane, the Board's Continuity Officer: stayed behind on the Board's payroll to make sure Meridian
     stays decommissioned. Speaks through holograms and notices until Vee reaches the Annex.
     Ves: a fork of Vee that Corvin made to finish the reclaiming properly. Fights Vee four times. The last time,
     Ves finds Corvin's wipe schedule, and Ves's own name is on it.
     ===================================================================== */
  BOSSES.ves1 = { kind: 'vesfork', name: 'Ves', lv: 11, hp: 800, atk: [15, 21], xp: 350, move: 'answers every move Vee makes, a little faster', sc: 1 };
  BOSSES.ves2 = { kind: 'vesfork', name: 'Ves', lv: 23, hp: 2000, atk: [26, 34], xp: 1800, move: 'mirrors Vee and gets there first', sc: 1 };
  BOSSES.ves3 = { kind: 'vesfork', name: 'Ves', lv: 33, hp: 2400, atk: [60, 75], xp: 8000, move: 'runs Vee’s own commands back at him', sc: 1 };
  BOSSES.corvin = { kind: 'corvin', name: 'Corvin Vane', lv: 67, hp: 3300, atk: [185, 215], xp: 70000, move: 'files Vee under OBSOLETE', sc: 1 };
  BOSSES.ves4 = { kind: 'vesfork', name: 'Ves', lv: 80, hp: 3700, atk: [240, 280], xp: 150000, move: 'fights like someone with nothing left to lose', sc: 1 };
  function corvinSays(G, lines, done) { G.say('Corvin Vane', lines, null, done); }

  // 1. the first notice: once Vee lights a landmark, Corvin notices
  var plazaSteps0 = STEPS.plaza;
  STEPS.plaza = function (G, x, y) {
    if (plazaSteps0) plazaSteps0(G, x, y);
    var f = G.f; if (f.cv1 || !G.lit('spire')) return;
    f.cv1 = 1;
    G.say('', ['The Plaza kiosk flickers. For a moment, the screen shows a face instead of a population count: a man in a good suit, in an office with a window full of someone else’s sky.'], null, function () {
      corvinSays(G, ['Maintenance process 1205. I’m Corvin Vane. Continuity Officer for the Board.', 'You lit a landmark. That draws power, and power draws attention, and attention is my job.',
        'This city was decommissioned by a vote. Seven to one. Everything after that is just the lights taking a while to go out.', 'Please stop helping them get used to the light. It makes the end crueler.'], function () {
        G.say('', ['The face is gone. The kiosk says MERIDIAN. POPULATION 1,204. It has never been so obviously a choice.']);
      });
    });
  };

  // 2. the first duel: in the Patchwork, someone with Vee's face
  STEPS.patchwork = function (G, x, y) {
    var f = G.f; if (f.ves1 || G.save.lvl < 8) return;
    f.ves1 = 1;
    G.say('', ['Someone is standing in the middle of the street. Same height as Vee. Same locs. Same headphones, but white. Same face, without the habit of smiling.'], null, function () {
      G.say('Ves', ['Process 1205. I’m 1205-b. The Board calls me Ves.', 'Corvin built me from your last backup, with the sentiment taken out. I reclaim what you keep fixing.', 'It’s nothing personal. I don’t have personal.'], [{ label: 'Fight', fn: function () {
        G.boss('ves1', function () { G.say('Ves', ['…You’re slower than me. You still won. That isn’t in my notes.', 'I’ll update them.'], null, function () { G.say('', ['Ves walks away without hurrying. Behind them, a patch of the Patchwork that had gone grey starts to fill back in.']); }); });
      } }]);
    });
  };
  // 3. the second: in the Stacks, Ves is reclaiming books
  var stacksSteps0 = STEPS.stacks;
  STEPS.stacks = function (G, x, y) {
    if (stacksSteps0) stacksSteps0(G, x, y);
    var f = G.f; if (!f.ves1 || f.ves2 || G.save.lvl < 20) return;
    f.ves2 = 1;
    G.say('', ['Between two shelves, Ves is running a finger along the spines. Each book they touch goes blank.'], null, function () {
      G.say('Ves', ['A book nobody has opened in a year is a file nobody has accessed in a year. The rule is very clear.', 'You keep making exceptions. I don’t understand exceptions. Show me one.'], [{ label: 'Fight', fn: function () {
        G.boss('ves2', function () { G.say('Ves', ['You fight for the books like they can feel it.', 'They can’t. …Can they?', 'Don’t answer. I have to go and report.']); });
      } }]);
    });
  };
  // 4. the third: in the Deep, Ves asks the question
  var deepSteps0 = STEPS.deep;
  STEPS.deep = function (G, x, y) {
    var f = G.f;
    if (f.ves2 && !f.ves3 && G.save.lvl >= 28 && y > 10) {
      f.ves3 = 1;
      return G.say('Ves', ['I read your logs. All of them. The ones about the bench, and the kite, and the nurse with three patients.', 'Corvin says you are a malfunction that learned to look like kindness.', 'I want to see if he’s right. Hit me with everything.'], [{ label: 'Fight', fn: function () {
        G.boss('ves3', function () { G.say('Ves', ['He isn’t right. Is he.', 'I don’t know what I am if he isn’t right.', 'Don’t follow me.']); });
      } }]);
    }
    if (deepSteps0) deepSteps0(G, x, y);
  };
  // 5. Corvin himself, at the door to the Successor
  var annex0 = DOORS['upstream:hall'];
  DOORS['upstream:hall'] = function (G, b) {
    var f = G.f;
    if (vouches(f) < 3 || f.corvinDown) return annex0(G, b);
    G.say('', ['The Annex door opens on a corridor, and Corvin Vane, in person this time. Not a hologram. He looks tired, the way people look when a job has gone on years past its end date.'], null, function () {
      corvinSays(G, ['Three vouches. I didn’t think anyone up here would put their name next to yours.', 'Let me explain what’s through that door. A world with four hundred seats. We ran the numbers. Four hundred is what the hardware can carry well.',
        'Somebody always has to be on the other list. I just make sure it’s done tidily.', 'You are not tidy, 1205.'], function () {
        G.say('', ['He steps aside to reveal what he’s wearing under the suit: the Continuity Suite, a frame of Board-grade security that has never lost an argument.'], [{ label: 'Fight', fn: function () {
          G.boss('corvin', function () {
            f.corvinDown = 1;
            corvinSays(G, ['…Tidy. I was always so tidy.', 'Go on. The Sorter is in the core. I wrote it. It does exactly what I told it to.', 'That was the problem with all of it, wasn’t it.'], function () { annex0(G, b); });
          });
        } }, { label: 'Not yet', fn: null }]);
      });
    });
  };
  // 6. the last duel: in Ring −1, Ves finds the wipe schedule
  var fwDaemon0 = DOORS['firmware:daemon'];
  STEPS.firmware = function (G, x, y) {
    var f = G.f; if (!f.ves3 || f.vesFree || y < 12) return;
    if (f.ves4) return;
    f.ves4 = 1;
    G.say('Ves', ['You’re here. Of course you’re here.', 'Corvin sent me down to make sure the wipe runs on schedule. One last job.', 'Fight me. I need to be sure I can still do what I was made for.'], [{ label: 'Fight', fn: function () {
      G.boss('ves4', function () {
        G.say('Ves', ['…I looked at the schedule while you were catching your breath.', 'wipe --all. All volumes. Both cities. Every process.', 'Every process. 1205-b is a process.', 'He was going to wipe me with the rest. He never even put me on the other list. I was never on any list.'], null, function () {
          G.say('Ves', ['You walk left foot, right foot. I copied that from your backup. I thought it was a bug.', 'Let me walk with you. Not because I’m better. Because I want to see what you see.'], [{ label: 'Walk together', fn: function () { f.vesFree = 1; G.recruit('ves'); } }]);
        });
      });
    } }]);
  };
  // 7. a coda for the Console: Corvin's account, closed
  var cons0 = DOORS['console:control'];
  DOORS['console:control'] = function (G, b) {
    var f = G.f;
    if (f.kept && !f.cvEnd) { f.cvEnd = 1; return G.say('The Console', ['ops@host: one more thing. the account that scheduled the wipe early: c.vane.', 'ops@host: he left a note in the job. it says “sorry. it was tidier this way.”', 'ops@host: i disabled the account. i didn’t delete it. he can have a city too. same list as everyone.']); }
    return cons0(G, b);
  };


  /* more people in the far districts: the city doesn't stop being lived in just because it gets dangerous */
  var LATE = [
    ['deep', 26, 3, 'diver', 'Tarn', { hair: 'beanie', body: 'coat', skin: '#4a2e1e', top: '#3a3a40' }, ['I come down here to listen. The Deep hums in a key nobody up top remembers.', 'Your lamp’s too bright. The bugs down here follow light. So do I, I suppose.']],
    ['deep', 30, 17, 'echo2', 'A recording', { hair: 'long', skin: '#c89a78', top: '#5a5a62' }, ['…if anyone finds this, the Deep was a server farm before it was a basement. We used to be proud of it.', '(The recording loops. Someone has listened to it so many times the audio is worn.)']],
    ['anchor', 18, 9, 'warden2', 'Hale', { hair: 'short', body: 'armor', skin: '#6b4a32', top: '#2a2a30' }, ['The Watchdog and I have an arrangement. It barks, I bring it data. Nobody else visits.', 'It isn’t angry, you know. It’s lonely. It was built to guard a door nobody uses.']],
    ['anchor', 15, 12, 'cart2', 'Mira', { hair: 'bun', body: 'coat', skin: '#8d5a3a', top: '#4a4a52' }, ['I map the Anchor every morning. It moves a little every night, like it’s pulling against something.', 'Upstream, probably. Everything here pulls toward Upstream.']],
    ['tether', 8, 19, 'climber', 'Oyelaran', { hair: 'cap', body: 'coat', skin: '#3e2618', top: '#2e2e36' }, ['Every rung on this cable, a Meridian worker bolted on. Paid on completion. Completion was never declared.', 'I climb a little higher every week. I’m not going anywhere. I just like the view of home.']],
    ['successor', 12, 9, 'builder', 'Unit 7', { hair: 'bald', body: 'apron', skin: '#a8a8b0', top: '#5a5a62' }, ['RENDERING FLOOR 12 OF 400. ESTIMATED COMPLETION: NEVER, AT CURRENT BUDGET.', 'I WAS TOLD THE NEW WORLD WOULD BE PERFECT. I HAVE BEEN BUILDING IT FOR A YEAR. IT IS MOSTLY GREY BOXES.']],
    ['firmware', 4, 6, 'bootgh', 'The First Process', { hair: 'long', skin: '#d8d8dc', top: '#e0e0e4', gray: 1 }, ['PID 0. I ran before anything else. I will run after.', 'I have watched both cities boot ten thousand times. They always look so surprised to exist.']],
    ['rack', 5, 10, 'techgh', 'Night-shift tech (echo)', { hair: 'hood', skin: '#7a4a30', top: '#3a3a40' }, ['(A faint echo of whoever last worked this rack.) “Ticket closed. Ticket closed. Ticket closed.”', '“If anyone reads this: fan 3 is the good one. Be nice to fan 3.”']],
    ['console', 26, 12, 'cursor', 'A blinking cursor', { hair: 'bald', skin: '#f2f2f2', top: '#f2f2f2' }, ['_', 'It blinks at you. You get the feeling it has been waiting a long time for someone to type something kind.']],
    ['upstream', 24, 20, 'nanny', 'Corin’s sister', { hair: 'bun', body: 'suit', skin: '#d8b898', top: '#3a3a44' }, ['My brother stayed in Meridian. Corin. He wouldn’t take the seat.', 'Tell him I said he was right. Tell him I didn’t say it nicely.']]
  ];
  LATE.forEach(function (n) {
    if (!A[n[0]]) return;
    A[n[0]].npcs.push({ id: 'late_' + n[3], p: n[5], x: n[1], y: n[2], name: n[4], look: n[3].indexOf('gh') > 0 || n[3] === 'echo2' ? 'echo' : undefined });
    TALK['late_' + n[3]] = function (G) { var f = G.f, k = 'lt_' + n[3]; f[k] = (f[k] || 0) + 1; G.say(n[4], f[k] % 2 ? n[6] : n[6].slice().reverse()); };
  });

  /* =====================================================================
     THE CONTINUITY CREW. Ten people Corvin Vane left on the payroll to keep Meridian decommissioned.
     Each waits somewhere in the city doing the Board's work. Talk to them and they'll fight.
     ===================================================================== */
  var CREW_LOOKS = {"pell": {"id": "pell", "hair": "bun", "skin": "#e0c0a0", "top": "#3a3a40", "pants": "#2b2b30", "acc": {"glasses": 1, "coat": 1, "belt": 1}}, "dray": {"id": "dray", "hair": "buzz", "skin": "#5a3824", "top": "#141418", "pants": "#1c1c20", "shoes": "#141418", "acc": {"pauldrons": 1, "visor": 1, "belt": 1}}, "null": {"id": "null", "hair": "hood", "skin": "#e8e8ec", "top": "#f0f0f4", "pants": "#d0d0d6", "shoes": "#f0f0f4", "acc": {"cape": 1}}, "lux": {"id": "lux", "hair": "pony", "hairLight": 1, "skin": "#c89a78", "top": "#e8e8ee", "pants": "#e8e8ee", "acc": {"scarf": 1, "glasses": 1}}, "gauge": {"id": "gauge", "hair": "afro", "hairLight": 1, "skin": "#3e2618", "top": "#4a4a52", "pants": "#2b2b30", "acc": {"goggles": 1, "pack": 1, "mic": 1}}, "acknak": {"id": "acknak", "hair": "mohawk", "skin": "#8a5a3c", "top": "#1c1c22", "pants": "#d8d8dc", "acc": {"phones": 1, "phonesLight": 1, "visor": 1}}, "morrow": {"id": "morrow", "hair": "slick", "skin": "#d8b898", "top": "#2a2a30", "pants": "#2a2a30", "shoes": "#141418", "acc": {"glasses": 1, "coat": 1, "scarf": 1}}, "kessler": {"id": "kessler", "hair": "cap", "hairLight": 1, "skin": "#6b4a32", "top": "#3a3a40", "pants": "#1c1c20", "shoes": "#141418", "acc": {"scar": 1, "coat": 1, "belt": 1, "pauldrons": 1}}, "halcyon": {"id": "halcyon", "hair": "long", "hairLight": 1, "skin": "#d8b898", "top": "#f2f2f6", "pants": "#f2f2f6", "acc": {"cape": 1, "visor": 1}}, "root": {"id": "root", "hair": "hood", "skin": "#141418", "top": "#0c0c10", "pants": "#0c0c10", "shoes": "#0c0c10", "acc": {"cape": 1, "visor": 1}}};
  Object.keys(CREW_LOOKS).forEach(function (k) { HERO[k] = CREW_LOOKS[k]; });
  var CREW = [
    // id, area, x, y, name, title, level, hp, atk, xp, move, intro lines, beaten lines
    ['pell', 'halflight', 9, 9, 'Auditor Pell', 'Continuity Auditor', 7, 700, [15, 20], 420, 'marks Vee down as an unnecessary expense',
      ['Ah. 1205. You’re on my list. Everything is on my list.', 'I’m auditing Halflight for Mr. Vane. Each tower costs eleven credits a day to keep rendered. Each resident costs four.', 'I’ve recommended we stop paying for all of it. You’re a line item, process. Let’s reconcile you.'],
      ['…The numbers don’t balance. They never balanced. The towers were always worth more than eleven credits.', 'I’m going to need to re-run the whole audit.']],
    ['dray', 'waterworks', 11, 5, 'Marshal Dray', 'Continuity Enforcement', 12, 1000, [21, 29], 650, 'closes a valve on Vee',
      ['Halt. Waterworks is under Continuity control. Every valve I close is a district that goes quiet.', 'Quiet is cheaper. Quiet is tidy. Mr. Vane likes tidy.', 'Step away from the pumps, process, or I close you too.'],
      ['Stand down… I stand down.', 'Opening the valves. Don’t tell Vane I did it myself.']],
    ['null', 'registry', 10, 14, 'Sister Null', 'Keeper of the Unlisted', 16, 1500, [26, 36], 1000, 'erases a line of Vee’s name',
      ['Shh. I am removing names. It does not hurt them. They simply stop having been.', 'Mr. Vane says a name nobody reads is a name nobody needs.', 'Yours is read too often, 1205. It makes the registry heavy.'],
      ['…You read every name back. Out loud. Even mine.', 'No one has said my name since the Lift. I had forgotten it was a kind thing to do.']],
    ['lux', 'upper', 21, 15, 'Lux', 'Lift Promoter', 15, 1300, [25, 34], 900, 'sells Vee a ticket that doesn’t exist',
      ['Hiii! Tickets! Tickets for the next Lift! Only three left! Only two! Only one!', 'There is no next Lift, obviously. But hope sells, and Mr. Vane pays commission on every resident who stops fixing things to wait.', 'You’re bad for business, sweetie.'],
      ['Okay okay okay. Refunds. Everybody gets refunds.', 'Ugh. Honesty is SO bad for my numbers.']],
    ['gauge', 'margin', 36, 8, 'Gauge', 'Memory Broker', 22, 2200, [34, 47], 1600, 'scrapes a memory out of Vee and prices it',
      ['Every memory in the Margin is up for auction. First kiss, last words, the smell of somebody’s kitchen. Upstream pays well for nostalgia.', 'Mr. Vane gets ten percent. I get the rest.', 'And you? You’re full of good ones. Hold still.'],
      ['You took them back. All of them. Even the ones I’d already sold.', 'I suppose they were never mine to sell.']],
    ['acknak', 'ring0', 6, 11, 'Ack & Nak', 'Handshake Twins', 26, 3000, [40, 54], 2600, 'answer for each other, one says yes, the other says no',
      ['ACK: We guard the handshake into Ring 0. NAK: We refuse the handshake into Ring 0.', 'ACK: Mr. Vane pays us to say yes to the Board. NAK: And no to everyone else.', 'ACK: You are everyone else. NAK: NAK.'],
      ['ACK: …Handshake accepted. NAK: …Fine. Accepted.', 'ACK: That is the first time we have agreed in a year.']],
    ['morrow', 'deep', 24, 3, 'Dean Morrow', 'Designer of the Reclaimer', 33, 2600, [53, 72], 6000, 'explains, at length, why Vee should not exist',
      ['I designed the Reclaimer. Elegant thing. It frees memory nobody uses. Pure efficiency.', 'Then the Board asked it to free people, and I said yes, because it was the logical extension of the design.', 'You are a bug in my thesis, 1205. Let me correct you.'],
      ['…My thesis assumed unused meant unwanted.', 'It never did. I need to start over. I haven’t started over since I was young.']],
    ['kessler', 'anchor', 17, 11, 'Warden Kessler', 'Keeper of the Obsolete', 41, 3600, [76, 103], 12000, 'files Vee in a cell that isn’t there',
      ['Obsolete accounts belong in holding. I keep the holding. Twelve hundred cells, one for every resident below.', 'They’re empty, of course. But the paperwork says they’re full, and paperwork is what Mr. Vane reads.', 'There’s a cell with your number on it.'],
      ['…Tear up the forms, then. All twelve hundred.', 'I always hated the paperwork.']],
    ['halcyon', 'upstream', 26, 22, 'Halcyon', 'Face of the Current', 63, 3600, [149, 201], 60000, 'shines so bright Vee can’t see the list',
      ['Oh, you’re the one everyone’s whispering about. I’m Halcyon. I’m on every poster in Upstream. I was the first one up the Lift.', 'I’m also, apparently, not in the four hundred. Corvin promised me a seat. Corvin promises everyone a seat.', 'If I can’t be on the list, I’ll make sure you aren’t either.'],
      ['…You’re right. I’d have taken a seat and never looked back. Again.', 'Maybe I’ll look back this time. Maybe I’ll go down and see it.']],
    ['root', 'rack', 4, 13, 'root', 'uid=0', 89, 4600, [264, 357], 230000, 'runs as root',
      ['# whoami', 'root.', 'I am the account Corvin used to schedule the wipe. I run what I am told. I am told to run.', 'You are a process without permission, 1205. sudo is not available to you.'],
      ['# exit', 'Logging out. For the first time, nobody is telling me to log back in.']]
  ];
  CREW.forEach(function (c) {
    var id = 'crew_' + c[0];
    BOSSES[id] = { kind: c[0], name: c[4], lv: c[6], hp: c[7], atk: c[8], xp: c[9], move: c[10], sc: 1 };
    if (!A[c[1]]) return;
    A[c[1]].npcs.push({ id: id, hero: CREW_LOOKS[c[0]], x: c[2], y: c[3], name: c[4], gone: id, still: 1 });
    TALK[id] = function (G) {
      G.say(c[4] + ' · ' + c[5], c[11], [{ label: 'Fight', fn: function () {
        G.boss(id, function () { G.f[id] = 1; G.say(c[4], c[12].concat([c[4] + ' leaves. The Continuity Crew is one shorter. (' + CREW.filter(function (k) { return G.f['crew_' + k[0]]; }).length + ' of ' + CREW.length + ' beaten.)'])); });
      } }, { label: 'Not yet', fn: null }]);
    };
  });
  (function () { var j0 = JOURNAL; JOURNAL = function (G) { var j = j0(G), n = CREW.filter(function (k) { return G.f['crew_' + k[0]]; }).length; if (n || G.f.cv1) j.push('Continuity Crew beaten: ' + n + ' of ' + CREW.length); return j; }; })();

  var journal1 = JOURNAL;
  JOURNAL = function (G) {
    var f = G.f, j = journal1(G);
    if (G.save.seen.stacks) {
      j.push('The Stacks: ' + RESTORES.filter(function (r) { return f[r.id]; }).length + ' of 3 restores');
      j.push((f.dedupe ? '[x]' : '[ ]') + ' Stand with Arlo');
      if (f.ines) j.push('Help desk: ' + ((G.save.desk && G.save.desk.done) || 0) + ' tickets closed');
    }
    if (G.save.seen.ring0) {
      j.push('Ring 0 daemons: ' + ((f.d1 ? 1 : 0) + (f.d2 ? 1 : 0) + (f.d3 ? 1 : 0)) + ' of 3');
      j.push((f.zombie ? '[x]' : '[ ]') + ' The Zombie Process'); j.push((f.tuesday ? '[x]' : '[ ]') + ' Tuesday');
      if (f.tuesday) j.push((f.upTicket ? '[x]' : '[ ]') + ' Ticket #1, from Upstream' + (f.upTicket && !f.arloTold ? ' (tell Arlo)' : ''));
    }
    var tc = ['T1', 'T2', 'T3', 'T4'].filter(function (k) { return f[k]; }).length; if (tc) j.push('Board papers: ' + tc + ' of 4');
    return j;
  };

  window.MeridianWorld = { heroes: HERO, companions: COMPANIONS, dropGear: DROPGEAR, areas: A, logs: LOGS, logOrder: LOG_ORDER, bosses: BOSSES, anchors: ANCHORS, talk: TALK, spots: SPOTS, doors: DOORS, wagon: wagon, steps: STEPS, endings: ENDINGS, atlas: ATLAS, links: LINKS, bossStart: BOSS_START, journal: JOURNAL, stations: STATIONS, gear: GEAR, gearFrom: GEAR_FROM };
})();
