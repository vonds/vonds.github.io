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


  /* =====================================================================
     EXPANSION: the Line, the Patchwork, the Upper Ring, Cold Storage
     ===================================================================== */

  /* THE LINE: the transit system, stopped the day the Lift opened */
  A.line = {
    name: 'The Line', sub: 'The trains stopped the day the Lift opened.', theme: 'line', tier: 2.4,
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
      { id: 'halden', x: 24, y: 3, name: 'Halden', look: 'echo', h: 14, hair: 6 },
      { id: 'mirelle', x: 9, y: 12, name: 'Mirelle', look: 'echo', h: 13, hair: 5 }
    ]
  };

  /* THE PATCHWORK: built from what the city threw away */
  A.patchwork = {
    name: 'The Patchwork', sub: 'Built from what the city threw away. Nothing here is unused.', theme: 'patch', tier: 2.6,
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
      { id: 'ofelia', x: 6, y: 6, name: 'Ofelia', look: 'echo', h: 13, hair: 7, solid: 1 },
      { id: 'juno', x: 33, y: 8, name: 'Juno', look: 'echo', h: 14, hair: 2, solid: 1 },
      { id: 'marrow', x: 12, y: 8, name: 'Marrow', look: 'echo', h: 12, hair: 4, solid: 1 },
      { id: 'pip', x: 8, y: 9, name: 'Pip', look: 'kid' },
      { id: 'sol', x: 11, y: 7, name: 'Sol', look: 'kid' },
      { id: 'corin', x: 36, y: 17, name: 'Corin', look: 'echo', h: 14, hair: 6, solid: 1 }
    ]
  };

  /* THE UPPER RING: the owners' district, still pristine */
  A.upper = {
    name: 'The Upper Ring', sub: 'Nothing here has decayed. Someone up there still looks at it.', theme: 'upper', tier: 3.6,
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
    enc: { tiles: ',', rate: .15, foes: ['virus', 'scorpion', 'spider', 'moth'], max: 6 },
    spawn: [19, 19],
    logs: { '10,9': 'M1', '29,9': 'M2', '14,20': 'M3' },
    caches: { '37,9': { item: 'part', n: 1, text: 'A satellite feed horn, still in its gift box. The card reads: FOR THE NEW PLACE. It never shipped.' }, '37,4': { item: 'gb', n: 1 } },
    npcs: [
      { id: 'sterling', x: 18, y: 7, name: 'Sterling', look: 'holo' },
      { id: 'trimmer', x: 26, y: 8, name: 'Groundskeeper', look: 'drone' }
    ]
  };

  /* COLD STORAGE: where reclaimed memory waits to be shipped up */
  A.cold = {
    name: 'Cold Storage', sub: 'Everything the Reclaimer took passes through here.', theme: 'cold', tier: 4.2,
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
    enc: { tiles: ',', rate: .18, foes: ['virus', 'scorpion', 'centipede', 'worm', 'moth'], max: 6 },
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
  LOGS.M2 = ['BOARD MINUTES. Session 52.', 'Motion: set Lift capacity at 40,000.', 'Discussion: capacity could be raised at cost. The Chair notes the cost would “fall on the wrong people.”', 'Passed, 7 to 1. Dissenting: M. Quell.'];
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

  var JOURNAL = function (G) {
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

  window.MeridianWorld = { areas: A, logs: LOGS, logOrder: LOG_ORDER, bosses: BOSSES, anchors: ANCHORS, talk: TALK, spots: SPOTS, doors: DOORS, wagon: wagon, steps: STEPS, endings: ENDINGS, atlas: ATLAS, links: LINKS, bossStart: BOSS_START, journal: JOURNAL, stations: STATIONS };
})();
