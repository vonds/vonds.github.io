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
    F10: ['LOG 0241. M. Quell.', 'If you’re reading this, I’ve been marked unused. That’s their word for it.', 'Vee. The first thing I taught you was whoami. You think the answer is “maintenance.”', 'Look again when this is over. I didn’t build you to keep the city running. I built you to live in it.']
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
    name: 'Meridian Plaza', sub: 'Where the city still remembers its own name.', theme: 'plaza', tier: 1,
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
      { x: 9, y: 1, w: 4, h: 4, kind: 'home', seed: 11, rise: 1 },
      { x: 18, y: 1, w: 3, h: 3, kind: 'home', seed: 5, rise: 1 }
    ],
    exits: { '0,9': ['commons', 34, 9], '0,10': ['commons', 34, 10], '15,0': ['gardens', 15, 20], '16,0': ['gardens', 16, 20], '15,19': ['undercroft', 15, 1], '16,19': ['undercroft', 16, 1] },
    gates: { '31,9': { to: ['bastion', 1, 9] }, '31,10': { to: ['bastion', 1, 10] } },
    enc: { tiles: ',', rate: .14, foes: ['beetle', 'bytebug', 'worm', 'moth'], max: 3 },
    spawn: [6, 7],
    logs: { '20,5': 'F1' },
    caches: { '29,17': { item: 'byte', n: 2 }, '3,18': { item: 'bit', n: 3 } },
    npcs: [
      { id: 'wren', x: 19, y: 7, name: 'Wren', look: 'holo' },
      { id: 'sweeper', x: 9, y: 12, name: 'The Sweeper', look: 'echo', h: 13, hair: 1 }
    ]
  };

  /* THE COMMONS */
  A.commons = {
    name: 'The Commons', sub: 'Everyone traded here. Some of them still think they are.', theme: 'commons', tier: 1.4,
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
      { x: 1, y: 12, w: 3, h: 2, kind: 'stall', seed: 1 }, { x: 5, y: 12, w: 3, h: 2, kind: 'stall', seed: 2 },
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
      { id: 'okoye', x: 19, y: 7, name: 'Okoye', look: 'echo', h: 14, hair: 2, solid: 1 },
      { id: 'lio', x: 25, y: 8, name: 'Lio', look: 'kid' },
      { id: 'bram', x: 4, y: 14, name: 'Bram', look: 'echo', h: 13, hair: 0 }
    ]
  };

  /* HALFLIGHT */
  A.halflight = {
    name: 'Halflight', sub: 'Every window, a view. Every view, included.', theme: 'halflight', tier: 1.8,
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
      { id: 'dez', x: 7, y: 9, name: 'Dez', look: 'echo', h: 14, hair: 3 },
      { id: 'jun', x: 24, y: 12, name: 'Jun', look: 'echo', h: 13, hair: 1, fade: .45 },
      { id: 'ana', x: 25, y: 12, name: 'Recording', look: 'echo', h: 13, hair: 2, fade: .2, flick: 1 },
      { id: 'teodor', x: 17, y: 9, name: 'Teodor', look: 'echo', h: 12, hair: 4 }
    ]
  };

  /* THE GLASSHOUSE */
  A.gardens = {
    name: 'The Glasshouse', sub: 'Trees grown from numbers. The numbers are being collected.', theme: 'gardens', tier: 2.2,
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
      { id: 'tamsin', x: 12, y: 8, name: 'Tamsin', look: 'echo', h: 13, hair: 5, solid: 1 }
    ]
  };

  /* THE UNDERCROFT */
  A.undercroft = {
    name: 'The Undercroft', sub: 'Every failure in the city ends up down here eventually.', theme: 'undercroft', tier: 2.8,
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
      { id: 'kade', x: 13, y: 19, name: 'Kade', look: 'echo', h: 15, hair: 6, solid: 1 },
      { id: 'unit7', x: 22, y: 10, name: 'Unit 7', look: 'drone' }
    ]
  };

  /* THE BASTION */
  A.bastion = {
    name: 'The Bastion', sub: 'The last block in Meridian nobody has reclaimed.', theme: 'bastion', tier: 3.4,
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
      { id: 'ash', x: 14, y: 10, name: 'Ash', look: 'warden' }
    ]
  };

  /* THE QUIET */
  A.quiet = {
    name: 'The Quiet', sub: 'Where the city stopped rendering.', theme: 'quiet', tier: 4,
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
    enc: { tiles: '.', rate: .1, foes: ['virus', 'scorpion', 'centipede', 'moth', 'spider', 'worm', 'beetle', 'bytebug'], max: 6 },
    spawn: [2, 8],
    logs: { '11,13': 'F8', '38,2': 'F9' },
    caches: { '34,14': { item: 'mb', n: 2 }, '2,11': { item: 'gb', n: 1 } },
    npcs: [
      { id: 'cartographer', x: 19, y: 8, name: 'The Cartographer', look: 'echo', h: 14, hair: 7 }
    ]
  };

  /* THE LIFT TERMINAL */
  A.terminal = {
    name: 'The Lift Terminal', sub: 'Forty thousand seats. Every one of them sold.', theme: 'terminal', tier: 4.5,
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

  var ATLAS = { plaza: [2, 2], commons: [1, 2], halflight: [1, 1], gardens: [2, 1], undercroft: [2, 3], bastion: [3, 2], quiet: [4, 2], terminal: [5, 2] };
  var LINKS = [['plaza', 'commons'], ['commons', 'halflight'], ['halflight', 'gardens'], ['gardens', 'plaza'], ['plaza', 'undercroft'], ['plaza', 'bastion'], ['bastion', 'quiet'], ['quiet', 'terminal']];

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
      if (G.f.ending) return G.say('Kiosk', ['MERIDIAN. Population 1,205.', 'Vee checks the number twice.']);
      G.say('Kiosk', ['MERIDIAN. Population 1,204. Peak 2,000,000.', 'LIFT CAPACITY: 40,000 seats. Seats remaining: 0.', 'Landmarks answering: ' + G.lights() + ' of 6.']);
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
        G.say('The Reclaimer', ['UNUSED PROCESS DETECTED.', 'NO TICKETED ACCOUNT HAS ACCESSED YOU IN THIRTY DAYS.', 'YOUR MEMORY HAS BEEN ALLOCATED UPSTREAM. PLEASE HOLD STILL.'], null, function () {
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
    after: ['Vee types whoami.', 'uid=1205(vee) gid=100(residents)', 'Not maintenance. Resident.', 'Back in the Plaza, a kiosk updates for the first time in eleven months.', 'MERIDIAN. Population 1,205.', 'THE END. Thank you for playing Meridian. The city is still yours to walk.']
  };

  window.MeridianWorld = { areas: A, logs: LOGS, logOrder: LOG_ORDER, bosses: BOSSES, anchors: ANCHORS, talk: TALK, spots: SPOTS, doors: DOORS, wagon: wagon, steps: STEPS, endings: ENDINGS, atlas: ATLAS, links: LINKS };
})();
