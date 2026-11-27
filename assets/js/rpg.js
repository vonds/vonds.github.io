/* Meridian: a small RPG starring Vee, plus the menu that picks between the two hidden games. */
(function () {
  'use strict';
  var SP = window.VondsSprite;
  if (!SP) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && matchMedia('(hover: none), (pointer: coarse)').matches;
  var NAMES = { runner: 'Uptime', rpg: 'Afterlift' };

  /* ======================= the game menu ======================= */
  var pick = document.createElement('div'); pick.className = 'gpick'; pick.setAttribute('role', 'dialog'); pick.setAttribute('aria-modal', 'true'); pick.setAttribute('aria-label', 'Choose a game');
  pick.innerHTML = '<div class="ff4w gpick-w"><b class="ff4n">Vee</b><p class="gpick-q">Pick a game.</p>' +
    '<button type="button" class="gpick-o" data-g="runner"><canvas width="44" height="52"></canvas><span><strong>' + NAMES.runner + '</strong><em>An endless runner. Clear the bugs. Stay online.</em></span></button>' +
    '<button type="button" class="gpick-o" data-g="rpg"><canvas width="44" height="52"></canvas><span><strong>' + NAMES.rpg + '</strong><em>An RPG about Meridian, the city the rich left behind.</em></span></button>' +
    '<button type="button" class="gpick-c">Not now</button></div>';
  document.body.appendChild(pick);
  var opts = [].slice.call(pick.querySelectorAll('.gpick-o')), sel = 0, pickFrom = null;
  (function () {   // little portraits
    var a = opts[0].querySelector('canvas').getContext('2d'), b = opts[1].querySelector('canvas').getContext('2d');
    a.imageSmoothingEnabled = b.imageSmoothingEnabled = false;
    a.drawImage(SP.frame('run1'), 0, 0, 44, 52);
    b.drawImage(SP.front ? SP.front(false) : SP.frame('idle'), 0, 0, 44, 52);
  })();
  function markSel(i) { sel = (i + opts.length) % opts.length; opts.forEach(function (o, j) { o.classList.toggle('on', j === sel); }); }
  function openPick(which) {
    if (which === 'uptime' || which === 'runner') return choose('runner');
    if (which === 'quest' || which === 'rpg' || which === 'meridian' || which === 'afterlift') return choose('rpg');
    pickFrom = document.activeElement; pick.classList.add('open'); markSel(0);
    requestAnimationFrame(function () { pick.classList.add('show'); opts[0].focus({ preventScroll: true }); });
  }
  function closePick() { pick.classList.remove('show'); setTimeout(function () { pick.classList.remove('open'); }, 280); }
  function choose(g) {
    closePick();
    setTimeout(function () { if (g === 'runner') { if (window.VondsGame) window.VondsGame.open(); } else Quest.open(); }, pick.classList.contains('open') ? 220 : 0);
  }
  opts.forEach(function (o, i) { o.addEventListener('click', function () { choose(o.getAttribute('data-g')); }); o.addEventListener('mouseenter', function () { markSel(i); }); });
  pick.querySelector('.gpick-c').addEventListener('click', function () { closePick(); if (pickFrom && pickFrom.focus) pickFrom.focus({ preventScroll: true }); });
  pick.addEventListener('pointerdown', function (e) { if (e.target === pick) closePick(); });
  pick.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); markSel(sel + 1); opts[sel].focus(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); markSel(sel - 1); opts[sel].focus(); }
    else if (e.key === 'Escape') closePick();
  });
  window.VondsPick = openPick;

  /* ======================= Meridian ======================= */
  var Quest = (function () {
    var W = 320, H = 180, TS = 16;
    var root = document.createElement('div'); root.className = 'rpg'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', NAMES.rpg);
    root.innerHTML = '<div class="rpg-scr"><canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="ff4w rpg-msg" aria-live="polite"><b class="ff4n"></b><p></p><div class="rpg-opts"></div></div>' +
      '<div class="rpg-hud"><div class="ff4w rpg-foes"></div><div class="ff4w rpg-party"></div><div class="ff4w rpg-cmd"></div></div>' +
      '<div class="rpg-title"></div></div>' +
      '<div class="rpg-pad" aria-hidden="true"><button data-k="up"></button><button data-k="left"></button><button data-k="right"></button><button data-k="down"></button><button class="a" data-k="a">A</button><button class="b" data-k="b">B</button></div>' +
      '<button class="rpg-x" type="button" aria-label="Close ' + NAMES.rpg + '"><i></i><i></i></button>';
    document.body.appendChild(root);
    var cv = root.querySelector('canvas'), cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
    var msg = root.querySelector('.rpg-msg'), msgWho = msg.querySelector('.ff4n'), msgP = msg.querySelector('p'), msgOpts = msg.querySelector('.rpg-opts');
    var hud = root.querySelector('.rpg-hud'), foesBox = root.querySelector('.rpg-foes'), partyBox = root.querySelector('.rpg-party'), cmdBox = root.querySelector('.rpg-cmd'), titleEl = root.querySelector('.rpg-title');

    /* ---------- save data ---------- */
    var save = { lvl: 1, xp: 0, hp: 60, mp: 24, items: { bit: 3, byte: 1 }, notes: 2, linux: 0, wins: 0, met: false };
    try { var sv = JSON.parse(localStorage.getItem('vonds-quest') || 'null'); if (sv) for (var k0 in sv) save[k0] = sv[k0]; } catch (e) {}
    // healing items: data, in growing sizes
    var ITEMS = [
      { id: 'bit', name: 'Bit', heal: 15, tip: 'The smallest unit of data. Restores 15 HP.' },
      { id: 'byte', name: 'Byte', heal: 35, tip: 'Eight bits. Restores 35 HP.' },
      { id: 'kb', short: 'KB', name: 'Kilobyte', heal: 70, tip: 'A thousand bytes. Restores 70 HP.' },
      { id: 'mb', short: 'MB', name: 'Megabyte', heal: 140, tip: 'A million bytes. Restores 140 HP.' },
      { id: 'gb', short: 'GB', name: 'Gigabyte', heal: 9999, tip: 'A billion bytes. Restores all HP.' }
    ];
    if (!save.items) save.items = { bit: 3, byte: 1 };
    if (save.coffee) { save.items.bit = (save.items.bit || 0) + save.coffee; } delete save.coffee;   // older saves
    function store() { try { localStorage.setItem('vonds-quest', JSON.stringify(save)); } catch (e) {} }
    function maxHp() { var g = 0; if (save.eq && window.MeridianWorld) ['weapon', 'armor', 'acc'].forEach(function (s) { var it = window.MeridianWorld.gear[save.eq[s]]; if (it && it.hp) g += it.hp; }); return 60 + (save.lvl - 1) * 14 + g + ((save.school && save.school.hp) || 0) + ((save.alloc && save.alloc.hp * 6) || 0); }
    function xpNeed() { return 30 + (save.lvl - 1) * 25; }
    function maxMp() { return 24 + (save.lvl - 1) * 6; }

    /* ---------- the world ---------- */
    var WD = window.MeridianWorld, ART = window.MeridianArt;
    if (!save.flags) save.flags = {};
    if (!save.lit) save.lit = { spire: 1, archive: 1 };
    if (!save.opened) save.opened = {};
    if (!save.keys) save.keys = {};
    if (!save.seen) save.seen = {};
    if (!save.area || !WD.areas[save.area]) { save.area = 'plaza'; save.x = WD.areas.plaza.spawn[0]; save.y = WD.areas.plaza.spawn[1]; }
    if (!save.rest) save.rest = ['plaza', 6, 7];
    var F = save.flags;
    function hs(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
    function lights() { return WD.anchors.filter(function (a) { return save.lit[a.id]; }).length; }
    function isLit(id) { return !!save.lit[id]; }

    var AREA = null, MAP = null, PAINTED = null, painted = {};
    function stamp(area) {
      var rows = area.map.map(function (r) { return r.split(''); });
      (area.blds || []).forEach(function (b) { if (!b.w) return; for (var y = b.y; y < b.y + b.h; y++) for (var x = b.x; x < b.x + b.w; x++) rows[y][x] = 'X'; if (b.door != null) rows[b.doorTop ? b.y : b.y + b.h - 1][b.x + b.door] = 'd'; });
      return rows.map(function (r) { return r.join(''); });
    }
    function litFor(b) {
      if (b.kind === 'spire') return lights() === 6 || !!F.ending;
      if (b.kind === 'ledger') return isLit('ledger');
      if (b.kind === 'core') return isLit('exit0');
      return true;
    }
    function paintCurrent() { var key = AREA.id; if (!painted[key]) painted[key] = ART.paintArea(AREA, MAP, litFor); PAINTED = painted[key]; }
    function repaint() { painted = {}; if (AREA) paintCurrent(); }
    function tile(x, y) { return (MAP[y] || '')[x] || '~'; }
    function key(x, y) { return x + ',' + y; }
    function gateOpen(x, y) { var g = AREA.gates && AREA.gates[key(x, y)]; if (!g) return false; return g.need ? !!g.need(G) : false; }
    function wagonAt() { if (!AREA.wagon) return null; var s = isLit('wagon') ? 2 : Math.min(2, F.wagon || 0); return AREA.wagon[s]; }
    function npcAt(x, y) { var n = null; (AREA.npcs || []).forEach(function (p) { if (p.x === x && p.y === y) n = p; }); return n; }
    function blocked(x, y) {
      var t = tile(x, y);
      if ('TX~pdsocFlG'.indexOf(t) >= 0 && !(t === 'G' && gateOpen(x, y))) return true;
      if (npcAt(x, y)) return true;
      var w = wagonAt(); if (w && y === w[1] && (x === w[0] || x === w[0] + 1)) return true;
      return false;
    }
    var me = { x: save.x, y: save.y, dir: 'down', px: save.x * TS, py: save.y * TS, moving: false, step: 0, steps: 0, safe: 4 };
    var cam = { x: 0, y: 0 };
    function load(id, x, y) {
      AREA = WD.areas[id]; AREA.id = id; MAP = stamp(AREA); paintCurrent();
      save.area = id; save.x = me.x = x; save.y = me.y = y; me.px = x * TS; me.py = y * TS; me.moving = false; me.safe = 4;
      save.seen[id] = 1; store(); placeCam();
    }
    function placeCam() {
      var mw = MAP[0].length * TS, mh = MAP.length * TS;
      cam.x = mw <= W ? (mw - W) / 2 : Math.max(0, Math.min(mw - W, me.px + 8 - W / 2));
      var top = -(PAINTED ? PAINTED.pad : 0); cam.y = Math.max(top, Math.min(mh - H, me.py + 4 - H / 2)); if (mh - top <= H) cam.y = top + (mh - top - H) / 2;
      cam.x = Math.round(cam.x); cam.y = Math.round(cam.y);
    }
    var areaEl = document.createElement('div'); areaEl.className = 'rpg-area'; areaEl.innerHTML = '<b></b><span></span>';
    root.querySelector('.rpg-scr').appendChild(areaEl);
    var areaT = 0;
    function showArea() { areaEl.querySelector('b').textContent = AREA.name; var lvT = AREA.enc ? ' Bugs: level ' + AREA.lv + (AREA.lvMax && AREA.lvMax !== AREA.lv ? '–' + AREA.lvMax : '') + '.' + (AREA.lv > save.lvl + 2 ? ' DANGER.' : '') : ''; areaEl.querySelector('span').textContent = AREA.sub + lvT; areaEl.classList.add('on'); clearTimeout(areaT); areaT = setTimeout(function () { areaEl.classList.remove('on'); }, 3200); }
    var titled = false;   // the title card, once per visit
    function showTitle(cb) {
      if (titled) return cb();
      titled = true; areaEl.classList.add('gtitle'); areaEl.querySelector('b').textContent = 'AFTERLIFT';
      areaEl.querySelector('span').textContent = 'What stays running after everyone leaves.';
      areaEl.classList.add('on'); clearTimeout(areaT);
      areaT = setTimeout(function () { areaEl.classList.remove('on'); setTimeout(function () { areaEl.classList.remove('gtitle'); cb(); }, 650); }, 2600);
    }
    var fade = null;   // { t, to: [id, x, y], done }
    function travel(to) { if (fade) return; fade = { t: 0, to: to, swapped: false }; held = null; }

    /* ---------- what the world can do, for the dialogue ---------- */
    var afterTalk = [];
    function gainXp(n) {
      var lines = []; save.xp += n;
      while (save.xp >= xpNeed()) {
        save.xp -= xpNeed(); save.lvl++; save.hp = maxHp();
        save.pts = (save.pts || 0) + 3;
        lines.push('LEVEL UP. Vee is now level ' + save.lvl + '. Max HP ' + maxHp() + '. +3 stat points to spend: open the menu, then Level Up.');
        var got = [];
        while (save.known.length < Math.min(COMMANDS.length, cmdsAt(save.lvl)) && nextCmd()) { var nc = nextCmd(); save.known.push(nc.cmd); save.learnedAt[nc.cmd] = save.lvl; got.push(nc); }
        if (got.length) lines.push('New commands: ' + got.map(function (c) { return c.cmd; }).join(', ') + '.', got.map(function (c) { return '<span class="mono">' + c.cmd + '</span>: ' + c.learn; }).join('<br>'), 'Bugs will bring problems that need them. Read them under Commands in the menu.');
      }
      store(); return lines;
    }
    var G = {
      f: F, save: save,
      say: function (who, lines, choices, done) { say(who, lines, choices, done); },
      boss: function (id, onWin) { startBattle({ boss: id, onWin: onWin }); },
      puzzle: function (title, steps, done) { openPuzzle(title, steps, done); },
      rest: function () { save.hp = maxHp(); save.rest = [AREA.id, me.x, me.y]; store(); },
      give: function (it, n) { n = n || 1; if (ITEMS.some(function (x) { return x.id === it; })) save.items[it] = (save.items[it] || 0) + n; else save.keys[it] = (save.keys[it] || 0) + n; store(); },
      take: function (it, n) { save.keys[it] = Math.max(0, (save.keys[it] || 0) - (n || 1)); store(); },
      count: function (it) { return save.keys[it] || 0; },
      travel: function (to) { travel(to); },
      ownsGear: function (id) { return ownsGear(id); }, giveGear: function (id) { giveGear(id); },
      school: function (k, n) { save.school[k] += n; if (k === 'hp') save.hp += n; store(); },
      arcade: function () { close(); setTimeout(function () { if (window.VondsPick) window.VondsPick('uptime'); }, 450); },
      readLog: function (id) { readLog(id); },
      logCount: function () { return WD.logOrder.filter(function (k) { return F[k]; }).length; },
      has: function (it) { return (save.keys[it] || 0) > 0; },
      light: function (id) { save.lit[id] = 1; store(); repaint(); },
      lit: isLit, lights: lights,
      atlas: function () { mode = 'atlas'; areaEl.classList.remove('on'); },
      link: function (url) { window.open(url, '_blank', 'noopener'); },
      note: function (t) { log(t); },
      xp: function (n) { var l = gainXp(n); if (l.length) afterTalk.push.apply(afterTalk, l); },
      ending: function (kind) { runEnding(kind); }
    };
    function readLog(id) {
      var first = !F[id]; F[id] = 1; store();
      var n = WD.logOrder.filter(function (k) { return F[k]; }).length, mara = WD.logOrder.indexOf(id) >= 0;
      say(mara ? 'Log' : 'Record', WD.logs[id].concat(first && mara ? ['(Log ' + n + ' of 10 recovered.)'] : []));
    }
    function openCache(x, y) {
      var k = AREA.id + ':' + key(x, y), c = AREA.caches[key(x, y)];
      if (save.opened[k]) return say('', ['An empty data cache. Someone got here first. You did.']);
      save.opened[k] = 1; G.give(c.item, c.n);
      var it = ITEMS.filter(function (i) { return i.id === c.item; })[0];
      say('', [c.text || ('A sealed data cache. Inside: ' + (c.n > 1 ? c.n + ' ' : 'a ') + (it ? it.name.toLowerCase() + (c.n > 1 ? 's' : '') : c.item) + '.')]);
    }
    function status() {
      var marks = WD.anchors.map(function (a) { return (isLit(a.id) ? '[x] ' : '[ ] ') + a.name + ' <em>(' + a.project + ')</em>'; }).join('<br>');
      var logs = WD.logOrder.filter(function (k) { return F[k]; }).length;
      var jr = WD.journal ? WD.journal(G) : [];
      say('Vee', ['Level ' + save.lvl + ' · HP ' + save.hp + '/' + maxHp() + ' · Next level in ' + (xpNeed() - save.xp) + ' XP<br>' + save.known.length + ' commands · ' + logs + ' of 10 logs · ' + AREA.name, marks].concat(jr.length ? ['<em>Journal</em><br>' + jr.join('<br>')] : []));
    }
    function runEnding(kind) {
      F.ending = kind; store(); repaint();
      say('', WD.endings[kind], null, function () {
        say('', WD.endings.after, null, function () { save.lit.spire = 1; store(); repaint(); travel(['plaza', 15, 8]); });
      });
    }

    /* ---------- stats, gear and settings ---------- */
    if (!save.eq) save.eq = { weapon: 'stick', armor: 'jacket', acc: 'phones' };
    if (!save.bag) save.bag = { stick: 1, jacket: 1, phones: 1 };
    if (!save.school) save.school = { atk: 0, def: 0, hp: 0 };
    if (!save.cfg) save.cfg = { text: 1, enc: 0, diff: 1, scan: 1 };
    var GEAR = WD.gear;
    function gs(k) { var t = 0; ['weapon', 'armor', 'acc'].forEach(function (s) { var g = GEAR[save.eq[s]]; if (g && g[k]) t += g[k]; }); return t; }
    if (!save.alloc) { save.alloc = { atk: 0, def: 0, hp: 0, crit: 0 }; save.pts = (save.lvl - 1) * 3; }
    var GROW = [['atk', 'Power', '+1 ATK', 1], ['def', 'Guard', '+1 DEF', 1], ['hp', 'Vitality', '+6 max HP', 6], ['crit', 'Focus', '+0.5% CRIT', .005]];
    function atk() { return save.lvl * 2 + gs('atk') + save.school.atk + save.alloc.atk; }
    function def() { return Math.floor(save.lvl * .6) + gs('def') + save.school.def + save.alloc.def; }
    function critC() { return Math.min(.5, .05 + gs('crit') + save.alloc.crit * .005); }
    var CFG = { text: [1, 2, 4, 999], textL: ['Slow', 'Normal', 'Fast', 'Instant'], enc: [1, .5, .15], encL: ['Normal', 'Fewer', 'Rare'], diff: [.65, 1, 1.35], diffL: ['Story', 'Normal', 'Hard'], scanL: ['Off', 'On'] };
    function ownsGear(id) { return !!save.bag[id]; }
    function giveGear(id) { save.bag[id] = 1; store(); }
    function syncGear(quiet) {
      var got = [];
      (WD.gearFrom || []).forEach(function (r) { if (!save.bag[r[0]] && r[1](G)) { save.bag[r[0]] = 1; got.push(r[2] + ' (' + GEAR[r[0]].name + ', ' + { weapon: 'weapon', armor: 'armor', acc: 'accessory' }[GEAR[r[0]].slot] + '.)'); } });
      if (got.length) { store(); if (!quiet) afterTalk.push.apply(afterTalk, got.concat(['Equip new gear from the menu: ' + (coarse ? 'B' : 'X') + ', then Equip.'])); }
    }

    /* ---------- the menu ---------- */
    var menuEl = document.createElement('div'); menuEl.className = 'ff4w rpg-menu';
    menuEl.innerHTML = '<div class="mn-side"></div><div class="mn-main"></div>';
    root.querySelector('.rpg-scr').appendChild(menuEl);
    var mnSide = menuEl.querySelector('.mn-side'), mnMain = menuEl.querySelector('.mn-main');
    var MN = null, VIEWS = [['home', 'Vee'], ['grow', 'Level Up'], ['items', 'Items'], ['cmds', 'Commands'], ['equip', 'Equip'], ['status', 'Status'], ['journal', 'Journal'], ['map', 'Map'], ['config', 'Config'], ['close', 'Close']];
    function openMenu() { MN = { view: 'home', side: 0, focus: 'side', sel: 0, slot: null, confirm: false, detail: -1 }; held = null; areaEl.classList.remove('on'); mode = 'menu'; renderMenu(); menuEl.classList.add('on'); }
    function closeMenu() { MN = null; menuEl.classList.remove('on'); mode = 'map'; store(); }
    function bar(v, m) { return '<i class="mn-bar"><b style="width:' + Math.max(0, Math.min(100, Math.round(v / m * 100))) + '%"></b></i>'; }
    function pct(v) { return Math.round(v * 100) + '%'; }
    function gearLine(g) {
      var p = []; if (g.atk) p.push('ATK +' + g.atk); if (g.def) p.push('DEF +' + g.def); if (g.hp) p.push('HP +' + g.hp); if (g.crit) p.push('CRIT +' + pct(g.crit));
      if (g.xp) p.push('XP +' + pct(g.xp)); if (g.drop) p.push('Drops +' + pct(g.drop)); if (g.stealth) p.push('Encounters −' + pct(g.stealth)); if (g.regen) p.push('Regen'); if (g.revive) p.push('Revive');
      return p.join(' · ') || 'No bonus';
    }
    function renderMenu() {
      if (!MN) return;
      mnSide.innerHTML = '';
      VIEWS.forEach(function (v, i) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = v[1] + (v[0] === 'grow' && save.pts ? ' (' + save.pts + ')' : '');
        b.className = (v[0] === 'grow' && save.pts ? 'pts ' : '') + (i === MN.side ? 'cur' : '') + (MN.focus === 'side' && i === MN.side ? ' on' : '');
        b.addEventListener('click', function () { MN.side = i; pickSide(); });
        mnSide.appendChild(b);
      });
      var v = VIEWS[MN.side][0], h = '', btns = [];
      function btn(html, fn, cls) { btns.push({ html: html, fn: fn, cls: cls || '' }); }
      if (v === 'home' || v === 'map' || v === 'close') {
        h = '<div class="mn-card"><div class="mn-portrait"></div><div><b class="mn-name">Vee</b> <span class="mn-dim">Level ' + save.lvl + '</span>' +
          '<div class="mn-row"><span>HP</span>' + bar(save.hp, maxHp()) + '<em>' + save.hp + ' / ' + maxHp() + '</em></div>' +
          '<div class="mn-row"><span>XP</span>' + bar(save.xp, xpNeed()) + '<em>' + (xpNeed() - save.xp) + ' to next</em></div></div></div>' +
          '<div class="mn-stats"><div><span>ATK</span><b>' + atk() + '</b></div><div><span>DEF</span><b>' + def() + '</b></div><div><span>CRIT</span><b>' + pct(critC()) + '</b></div><div><span>CMDS</span><b>' + save.known.length + '</b></div></div>' +
          (save.pts ? '<p class="mn-note">' + save.pts + ' stat points to spend: choose Level Up.</p>' : '') + '<p class="mn-dim">' + AREA.name + ' · Bugs here: level ' + (AREA.lv || 1) + (AREA.lvMax && AREA.lvMax !== AREA.lv ? '–' + AREA.lvMax : '') + ' · Landmarks ' + lights() + ' of 6 · Logs ' + WD.logOrder.filter(function (k) { return F[k]; }).length + ' of 10</p>' +
          '<p class="mn-dim">' + GEAR[save.eq.weapon].name + ' · ' + GEAR[save.eq.armor].name + ' · ' + GEAR[save.eq.acc].name + '</p>';
      } else if (v === 'grow') {
        h = '<h4>Level Up</h4><p>' + (save.pts ? '<b class="mn-pts">' + save.pts + '</b> point' + (save.pts > 1 ? 's' : '') + ' to spend.' : 'No points to spend. Vee earns 3 with every level.') + '</p>';
        GROW.forEach(function (gr) {
          var now = gr[0] === 'atk' ? 'ATK ' + atk() : gr[0] === 'def' ? 'DEF ' + def() : gr[0] === 'hp' ? 'HP ' + maxHp() : 'CRIT ' + pct(critC());
          btn('<span>' + gr[1] + ' <em class="mn-dim">' + gr[2] + '</em></span><em>' + now + (save.alloc[gr[0]] ? ' · ' + save.alloc[gr[0]] + ' pts' : '') + '</em>', function () {
            if (!save.pts) { MN.note = 'No points left. Level up to earn more.'; return renderMenu(); }
            if (gr[0] === 'crit' && critC() >= .5) { MN.note = 'Focus is maxed out.'; return renderMenu(); }
            save.pts--; save.alloc[gr[0]]++; if (gr[0] === 'hp') save.hp += 6; store(); renderMenu();
          });
        });
        var spent = save.alloc.atk + save.alloc.def + save.alloc.hp + save.alloc.crit;
        btn('<span>Reset points</span><em class="mn-dim">' + (spent ? 'Get back ' + spent + ' points' : 'Nothing spent yet') + '</em>', function () {
          if (!spent) return;
          var hpBack = save.alloc.hp * 6; save.pts += spent; save.alloc = { atk: 0, def: 0, hp: 0, crit: 0 }; save.hp = Math.max(1, Math.min(save.hp - hpBack, maxHp())); store(); MN.note = 'Points returned. Spend them however you like.'; renderMenu();
        }, 'danger');
        h += '<!--btns--><p class="mn-dim">Power hits harder. Guard takes hits better. Vitality adds health. Focus lands more critical hits. Resetting is free, any time.</p>';
      } else if (v === 'items') {
        h = '<h4>Healing data</h4>';
        ITEMS.forEach(function (it) {
          var n = save.items[it.id] || 0; if (!n) return;
          btn('<span>' + it.name + '</span><em>x' + n + '</em><small>' + it.tip + '</small>', function () {
            if (save.hp >= maxHp()) { MN.note = 'HP is already full.'; return renderMenu(); }
            save.items[it.id]--; var hh = Math.min(maxHp() - save.hp, it.heal); save.hp += hh; MN.note = 'Vee absorbs a ' + it.name.toLowerCase() + '. +' + hh + ' HP.'; store(); renderMenu();
          });
        });
        var keys = Object.keys(save.keys).filter(function (k) { return save.keys[k] > 0; });
        if (!btns.length) h += '<p class="mn-dim">No healing data. Bugs drop it, and caches hide it.</p>';
        h += '<!--btns--><h4>Key items</h4>' + (keys.length ? keys.map(function (k) { return '<p>' + ({ part: 'Radio part', page: 'Bram’s ledger page' }[k] || k) + ' <em class="mn-dim">x' + save.keys[k] + '</em></p>'; }).join('') : '<p class="mn-dim">None.</p>');
      } else if (v === 'cmds') {
        var nm = save.known.filter(mastered).length, nextN = Math.min(COMMANDS.length, cmdsAt(save.lvl + 1)) - save.known.length;
        h = '<h4>Commands ' + save.known.length + ' of ' + COMMANDS.length + ' · Mastered ' + nm + '</h4><p class="mn-dim">Type a command exactly as the problem asks, five times, to master it (+25% power). Exact answers in a row build a streak' + (save.streak > 1 ? ', now x' + save.streak : '') + '.' + (nextN > 0 ? ' Next level teaches ' + nextN + ' more.' : '') + '</p>';
        COMMANDS.forEach(function (c, i) {
          var known = save.known.indexOf(c.cmd) >= 0, pn = known ? prac(c.cmd).n : 0, fresh = known && save.learnedAt[c.cmd] === save.lvl && save.lvl > 1;
          if (!known && i > save.known.length + 9) return;
          btn(known ? '<span class="mono">' + c.cmd + '</span><em>' + (fresh ? 'New' : mastered(c.cmd) ? 'Mastered' : pn + '/5') + '</em><small>' + c.learn + '</small>' : '<span class="mono mn-dim">???</span><small class="mn-dim">Learned at a future level.</small>', function () { MN.detail = known ? i : -1; renderMenu(); });
        });
        if (MN.detail >= 0) { var c = COMMANDS[MN.detail], w = c.when[0]; h = '<div class="mn-detail"><b class="mono">' + c.cmd + '</b><p>' + c.learn + '</p><p><em>Shell bonus:</em> ' + c.hit + '</p><p><em>Example:</em> ' + w.t + '<br><span class="mono">$ ' + w.ex[0] + '</span></p><p class="mn-dim">Exact answers ' + prac(c.cmd).n + ' of 5</p></div>' + h; }
      } else if (v === 'equip') {
        if (!MN.slot) {
          h = '<h4>Equipment</h4>';
          [['weapon', 'Weapon'], ['armor', 'Armor'], ['acc', 'Accessory']].forEach(function (s) {
            var g = GEAR[save.eq[s[0]]];
            btn('<span>' + s[1] + '</span><em>' + g.name + '</em><small>' + gearLine(g) + '</small>', function () { MN.slot = s[0]; MN.sel = 0; renderMenu(); });
          });
          h += '<!--btns--><p class="mn-dim">ATK ' + atk() + ' · DEF ' + def() + ' · CRIT ' + pct(critC()) + ' · Max HP ' + maxHp() + '</p>';
        } else {
          var slot = MN.slot, cur = GEAR[save.eq[slot]];
          h = '<h4>' + { weapon: 'Weapon', armor: 'Armor', acc: 'Accessory' }[slot] + '</h4>';
          Object.keys(GEAR).filter(function (id) { return GEAR[id].slot === slot && save.bag[id]; }).forEach(function (id) {
            var g = GEAR[id], on = save.eq[slot] === id, d = slot === 'weapon' ? (g.atk || 0) - (cur.atk || 0) : slot === 'armor' ? (g.def || 0) - (cur.def || 0) : 0;
            btn('<span>' + (on ? '▸ ' : '') + g.name + '</span><em>' + (d ? (d > 0 ? '+' : '') + d : '') + '</em><small>' + gearLine(g) + '. ' + g.desc + '</small>', function () { save.eq[slot] = id; if (save.hp > maxHp()) save.hp = maxHp(); store(); MN.slot = null; MN.note = g.name + ' equipped.'; renderMenu(); }, on ? 'eq' : '');
          });
          h += '<!--btns--><p class="mn-dim">More gear comes from landmarks, people you help, and Tallow’s forge on Concourse Nine.</p>';
        }
      } else if (v === 'status') {
        var lg = WD.logOrder.filter(function (k) { return F[k]; }).length, mins = ['M1', 'M2', 'M3', 'M4'].filter(function (k) { return F[k]; }).length, pcs = ['P1', 'P2', 'P3'].filter(function (k) { return F[k]; }).length;
        h = '<h4>Vee</h4><div class="mn-stats"><div><span>LEVEL</span><b>' + save.lvl + '</b></div><div><span>ATK</span><b>' + atk() + '</b></div><div><span>DEF</span><b>' + def() + '</b></div><div><span>CRIT</span><b>' + pct(critC()) + '</b></div></div>' +
          '<p class="mn-dim">Base ATK ' + save.lvl * 2 + ', gear +' + gs('atk') + ', classes +' + save.school.atk + '. Base DEF ' + Math.floor(save.lvl * .6) + ', gear +' + gs('def') + ', classes +' + save.school.def + '.</p>' +
          '<p class="mn-dim">Bugs cleared ' + (save.wins || 0) + ' · Battles won ' + (save.bw || 0) + ' · Mara’s logs ' + lg + ' of 10 · Board minutes ' + mins + ' of 4 · Postcards ' + pcs + ' of 3</p>' +
          '<h4>Landmarks</h4>' + WD.anchors.map(function (a) { return '<p>' + (isLit(a.id) ? '[x] ' : '[ ] ') + a.name + ' <em class="mn-dim">' + a.project + '</em></p>'; }).join('');
      } else if (v === 'journal') {
        var jr = WD.journal ? WD.journal(G) : [];
        h = '<h4>Journal</h4>' + (jr.length ? jr.map(function (x) { return '<p>' + x + '</p>'; }).join('') : '<p class="mn-dim">Nothing yet. Talk to people. Everybody here wants something, and most of it is reasonable.</p>');
      } else if (v === 'config') {
        h = '<h4>Configuration</h4>';
        function opt(label, k, labels) { btn('<span>' + label + '</span><em>‹ ' + labels[save.cfg[k]] + ' ›</em>', function (dir) { save.cfg[k] = (save.cfg[k] + (dir || 1) + labels.length) % labels.length; store(); renderMenu(); }, 'cfg'); }
        opt('Text speed', 'text', CFG.textL); opt('Encounters', 'enc', CFG.encL); opt('Difficulty', 'diff', CFG.diffL); opt('Scanlines', 'scan', CFG.scanL); opt('Command hints', 'hints', CFG.scanL);
        btn(MN.confirm ? '<span>Erase all progress?</span><em>Press again to confirm</em>' : '<span>Erase save</span><em class="mn-dim">Start Afterlift over</em>', function () {
          if (!MN.confirm) { MN.confirm = true; return renderMenu(); }
          try { localStorage.removeItem('vonds-quest'); } catch (e) {} location.reload();
        }, 'danger');
        h += '<!--btns--><p class="mn-dim">Story difficulty: bugs hit softer. Hard: they hit harder, and you earn 20% more XP. Command hints show a few command names to pick from in battle. Turn them off to type from memory. Settings save automatically.</p>';
      }
      if (MN.note) { h = '<p class="mn-note">' + MN.note + '</p>' + h; MN.note = null; }
      var parts = h.split('<!--btns-->'); mnMain.innerHTML = parts[0];
      var list = document.createElement('div'); list.className = 'mn-list'; mnMain.appendChild(list);
      MN.btns = btns;
      btns.forEach(function (o, i) {
        var b = document.createElement('button'); b.type = 'button'; b.innerHTML = o.html; b.className = o.cls + (MN.focus === 'main' && i === MN.sel ? ' on' : '');
        b.addEventListener('click', function () { MN.focus = 'main'; MN.sel = i; o.fn(1); });
        list.appendChild(b);
      });
      if (parts[1]) { var tail = document.createElement('div'); tail.innerHTML = parts[1]; mnMain.appendChild(tail); }
      var pt = mnMain.querySelector('.mn-portrait'); if (pt && window.VondsSprite) { if (!renderMenu.face) try { renderMenu.face = window.VondsSprite.front(false).toDataURL(); } catch (e) {} if (renderMenu.face) pt.style.backgroundImage = 'url(' + renderMenu.face + ')'; }
      var on = mnMain.querySelector('.mn-list .on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
      if (MN.focus === 'main' && !btns.length) MN.focus = 'side';
    }
    function pickSide() {
      var v = VIEWS[MN.side][0];
      if (v === 'close') return closeMenu();
      if (v === 'map') { closeMenu(); mode = 'atlas'; return; }
      MN.slot = null; MN.detail = -1; MN.confirm = false; MN.sel = 0;
      renderMenu(); if (MN.btns && MN.btns.length) { MN.focus = 'main'; renderMenu(); }
    }
    function menuKey(k) {
      if (!MN) return;
      if (MN.focus === 'side') {
        if (k === 'up') MN.side = (MN.side + VIEWS.length - 1) % VIEWS.length;
        else if (k === 'down') MN.side = (MN.side + 1) % VIEWS.length;
        else if (k === 'a' || k === 'right') return pickSide();
        else if (k === 'b') return closeMenu();
        MN.slot = null; MN.detail = -1; MN.confirm = false; return renderMenu();
      }
      var n = (MN.btns || []).length;
      if (k === 'up') MN.sel = (MN.sel + n - 1) % Math.max(1, n);
      else if (k === 'down') MN.sel = (MN.sel + 1) % Math.max(1, n);
      else if (k === 'a') { var o = MN.btns[MN.sel]; if (o) o.fn(1); return; }
      else if ((k === 'left' || k === 'right') && MN.btns[MN.sel] && MN.btns[MN.sel].cls === 'cfg') { MN.btns[MN.sel].fn(k === 'left' ? -1 : 1); return; }
      else if (k === 'b' || k === 'left') { if (MN.slot) { MN.slot = null; MN.sel = 0; } else if (MN.detail >= 0) MN.detail = -1; else MN.focus = 'side'; }
      renderMenu();
    }

    /* ---------- typed puzzles on the map (the Proving Rooms, Ash's audit) ---------- */
    var PZ = null;
    function openPuzzle(title, steps, done) { PZ = { title: title, steps: steps, i: 0, done: done }; areaEl.classList.remove('on'); showPuzzle(); }
    function showPuzzle(note) {
      var s = PZ.steps[PZ.i]; held = null;
      termBox.querySelector('.sc').innerHTML = '<b>' + PZ.title + '</b> ' + (note ? '<em>' + note + '</em> ' : '') + s.t;
      fillChips(s.ex[0]);
      termIn.value = ''; termBox.classList.add('on'); setTimeout(function () { termIn.focus(); }, 30);
    }
    function submitPuzzle(raw) {
      var s = PZ.steps[PZ.i], line = norm(raw || '').replace(/^sudo /, '');
      var ok = s.ex.some(function (e) { return norm(e).replace(/^sudo /, '') === line; }) || (s.ok && s.ok.test(line));
      if (!ok) return showPuzzle('Not quite. One way: ' + s.ex[0] + '. Try it.');
      PZ.i++;
      if (PZ.i < PZ.steps.length) return showPuzzle('exit 0.');
      var d = PZ.done; PZ = null; closePrompt(); if (d) d();
    }
    function cancelPuzzle() { PZ = null; closePrompt(); say('', ['You step back. The prompt will be here when you return.']); }

    /* ---------- interacting ---------- */
    function facing() { var d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[me.dir]; return [me.x + d[0], me.y + d[1]]; }
    function interact() {
      var f = facing(), x = f[0], y = f[1], t = tile(x, y), k = key(x, y), n = npcAt(x, y), w = wagonAt();
      if (n) return WD.talk[n.id] ? WD.talk[n.id](G) : null;
      if (w && y === w[1] && (x === w[0] || x === w[0] + 1)) return WD.wagon(G);
      if (t === 'd') {
        var b = (AREA.blds || []).filter(function (b2) { return b2.door != null && b2.x + b2.door === x && (b2.doorTop ? b2.y : b2.y + b2.h - 1) === y; })[0];
        var h = b && (WD.doors[AREA.id + ':' + b.kind] || WD.doors[AREA.id + ':' + k]);
        return h ? h(G, b) : say('', ['Locked. The door doesn’t recognize you. Doors here only remember who paid.']);
      }
      if (t === 'o' && AREA.logs[k]) return readLog(AREA.logs[k]);
      if (t === 'c' && AREA.caches[k]) return openCache(x, y);
      if (t === 's' && WD.spots[AREA.id + ':' + k]) return WD.spots[AREA.id + ':' + k](G);
      if (t === 'F' && WD.spots[AREA.id + ':F']) return WD.spots[AREA.id + ':F'](G);
      if (t === 'p') return say('', [['The tree is mostly wireframe. You can see the numbers through it.', 'Bark, a texture. Leaves, a texture. This one still has both. For now.', 'A tag on the trunk: SPECIES 0x2F, OAK (APPROX.).'][Math.floor(hs(x * 7 + y) * 3)]]);
      if (t === 'G' && !gateOpen(x, y)) { var gd = AREA.gates[k]; return say('', (gd && gd.shut) || (AREA.id === 'plaza' ? ['The east gate is sealed. A panel reads: FIVE LANDMARKS REQUIRED.', 'Answering: ' + lights() + ' of 6.'] : ['The east gate won’t open while the keep is compromised.'])); }
    }

    function drawScan() {
      if (save.cfg && !save.cfg.scan) return;
      cx.fillStyle = 'rgba(0,0,0,.18)'; for (var y = 0; y < H; y += 2) cx.fillRect(0, y, W, 1);
      var g = cx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .65); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.5)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    }

    /* ---------- Vee on the map ---------- */
    function veeImg() {
      var walk = me.moving ? Math.floor(me.step / 4) % 4 : -1;
      if (me.dir === 'left' || me.dir === 'right') return { img: SP.frame(walk >= 0 ? 'run' + walk : 'idle'), flip: me.dir === 'left' };
      if (me.dir === 'up') return { img: SP.back ? SP.back() : SP.frame('idle'), flip: false, bob: walk % 2 };
      return { img: SP.front ? SP.front(false) : SP.frame('idle'), flip: false, bob: walk % 2 };
    }
    function drawSprite(img, x, y, flip, scale) {
      scale = scale || 1; cx.save(); if (flip) { cx.translate(Math.round(x + img.width * scale), Math.round(y)); cx.scale(-1, 1); cx.drawImage(img, 0, 0, img.width * scale, img.height * scale); }
      else cx.drawImage(img, Math.round(x), Math.round(y), img.width * scale, img.height * scale); cx.restore();
    }

    /* ---------- dialogue ---------- */
    var talking = null;   // { lines, i, opts, done }
    var tw = 0;
    function typeText(html) {
      clearInterval(tw); msgP.innerHTML = html;
      if (reduce) return;
      var chars = [];
      (function walk(n) { for (var c = n.firstChild; c; c = c.nextSibling) { if (c.nodeType === 3) { var t = c.textContent, sp = document.createElement('span'); c.parentNode.replaceChild(sp, c); for (var i = 0; i < t.length; i++) { var ch = document.createElement('span'); ch.className = 'tw-hide'; ch.textContent = t[i]; sp.appendChild(ch); chars.push(ch); } c = sp; } else walk(c); } })(msgP);
      var i = 0; tw = setInterval(function () { for (var k = 0; k < (save.cfg ? [1, 2, 4, 999][save.cfg.text] : 2) && i < chars.length; k++) chars[i++].className = ''; if (i >= chars.length) clearInterval(tw); }, 20);
    }
    function typing() { return !!msgP.querySelector('.tw-hide'); }
    function finishTyping() { clearInterval(tw); [].forEach.call(msgP.querySelectorAll('.tw-hide'), function (s) { s.className = ''; }); }
    // say a sequence of lines; the last can offer choices
    function say(who, lines, choices, done) {
      talking = { who: who, lines: lines, i: 0, choices: choices, done: done, sel: 0 };
      if (typeof areaEl !== 'undefined') areaEl.classList.remove('on');
      msg.classList.add('on'); showLine();
    }
    function showLine() {
      var T = talking; msgWho.textContent = T.who || ''; msgWho.style.display = T.who ? '' : 'none';
      typeText(T.lines[T.i]); msgOpts.innerHTML = '';
      var last = T.i === T.lines.length - 1;
      if (last && T.choices) {
        T.choices.forEach(function (c, j) { var b = document.createElement('button'); b.type = 'button'; b.textContent = c.label; b.className = j === 0 ? 'on' : ''; b.addEventListener('click', function () { pickChoice(j); }); msgOpts.appendChild(b); });
      } else { var m = document.createElement('i'); m.className = 'rpg-more'; msgOpts.appendChild(m); }
    }
    function pickChoice(j) { var c = talking.choices[j], d = talking; endTalk(); if (c.fn) c.fn(); else if (d.done) d.done(); }
    function advance() {
      if (!talking) return;
      if (typing()) { finishTyping(); return; }
      var last = talking.i === talking.lines.length - 1;
      if (last && talking.choices) { pickChoice(talking.sel); return; }
      if (!last) { talking.i++; showLine(); return; }
      var d = talking.done; endTalk(); if (d) d();
    }
    function endTalk() { talking = null; msg.classList.remove('on'); if (mode === 'map' && typeof syncGear === 'function' && GEAR) syncGear(); if (afterTalk.length && mode === 'map') { var q = afterTalk.splice(0); setTimeout(function () { say('', q); }, 60); } }
    function choiceMove(d) {
      if (!talking || !talking.choices || talking.i !== talking.lines.length - 1) return;
      talking.sel = (talking.sel + d + talking.choices.length) % talking.choices.length;
      [].forEach.call(msgOpts.children, function (b, j) { b.className = j === talking.sel ? 'on' : ''; });
    }

    /* ---------- battle ---------- */
    var FOES = {
      beetle:   { name: 'Beetle',    hp: 34, atk: [5, 8],  move: 'chews through a cable', xp: 10 },
      spider:   { name: 'Spider',    hp: 30, atk: [6, 9],  move: 'spins up a race condition', xp: 11 },
      worm:     { name: 'Worm',      hp: 40, atk: [4, 7],  move: 'copies itself across the network', xp: 10 },
      moth:     { name: 'Moth',      hp: 28, atk: [5, 9],  move: 'shorts a relay, like the very first computer bug', xp: 11 },
      virus:    { name: 'Virus',     hp: 36, atk: [6, 10], move: 'replicates and spreads', xp: 13 },
      bytebug:  { name: 'Byte bug',  hp: 32, atk: [5, 8],  move: 'flips a bit', xp: 10 },
      centipede:{ name: 'Centipede', hp: 46, atk: [5, 9],  move: 'opens a memory leak', xp: 14 },
      scorpion: { name: 'Scorpion',  hp: 52, atk: [7, 11], move: 'stings with a segfault', xp: 16 }
    };
    // Vee's attacks are real commands. The curriculum lives in meridian-commands.js: five to start, then three to five more each level.
    var HITS = { multi2: 'Two clean hits.', multi3: 'Three quick hits.', focus: 'Bearings found. Your next hit lands double.', heal: 'Vee recovers HP.',
      expose: 'Weak spot marked. Extra damage for 3 turns.', guard: 'Incoming damage is halved this round.', stun: 'Locked. It cannot act for 2 turns.',
      slow: 'Throttled. Its attacks are halved for 3 turns.', heavy: 'A massive hit.', all: 'Every bug takes the hit.', leak: 'It starts leaking HP every turn.', crit: 'A guaranteed critical.' };
    var COMMANDS = (window.MeridianCommands || []).map(function (e) {
      return { cmd: e.c, k: e.k || e.c.split(' ')[0], n: e.n ? new RegExp(e.n) : null, learn: e.l, fx: e.fx, hit: e.h || HITS[e.fx] || 'A clean hit.',
        when: e.w.map(function (w) { return { t: w[0], ex: w[1] }; }) };
    });
    var START_CMDS = 5;
    function cmdsAt(lv) { var n = START_CMDS; for (var l = 2; l <= lv; l++) n += 3 + (l % 3); return n; }   // 5, then +5, +3, +4, +5, +3 ...
    if (!save.known) save.known = [];
    if (save.bw == null) save.bw = 0;
    if (!save.learnedAt) save.learnedAt = {};
    if (!save.prac) save.prac = {};
    if (save.streak == null) save.streak = 0;
    if (save.cfg.hints == null) save.cfg.hints = 1;
    function cmdInfo(c) { return COMMANDS.filter(function (x) { return x.cmd === c; })[0]; }
    function nextCmd() { return COMMANDS.filter(function (x) { return save.known.indexOf(x.cmd) < 0; })[0]; }
    save.known = save.known.filter(function (c) { return cmdInfo(c); });
    while (save.known.length < Math.min(COMMANDS.length, cmdsAt(save.lvl)) && nextCmd()) { var nc0 = nextCmd(); save.known.push(nc0.cmd); if (save.learnedAt[nc0.cmd] == null) save.learnedAt[nc0.cmd] = save.known.length <= START_CMDS ? 1 : save.lvl; }
    function prac(c) { return save.prac[c] || (save.prac[c] = { n: 0, last: 0 }); }
    function mastered(c) { return prac(c).n >= 5; }
    // practice weighting: fresh commands come up most, then ones you have not drilled, then ones you have not seen in a while
    function pickCmd() {
      var tot = 0, ws = save.known.map(function (c) {
        var la = save.learnedAt[c] || 1, p = prac(c), w = 1 + (la === save.lvl ? 5 : la === save.lvl - 1 ? 2 : 0) + (p.n < 3 ? 2 : 0) + Math.min(4, (save.bw - p.last) / 4);
        tot += w; return w;
      }), r = Math.random() * tot;
      for (var i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return save.known[i]; }
      return save.known[0];
    }
    function setProblem(f) { var c = pickCmd(), info = cmdInfo(c); f.cmd = c; f.sc0 = info.when[Math.floor(Math.random() * info.when.length)]; }
    function stripSudo(line, info) { return info && info.k === 'sudo' ? line : line.replace(/^sudo /, ''); }
    function judge(info, sc, raw) {
      var line = stripSudo(norm(raw || ''), info), first = line.split(' ')[0].toLowerCase().replace(/^\.\//, '');
      var exact = sc.ex.some(function (e) { return stripSudo(norm(e), info) === line; });
      var right = exact || ((info.k === '*' || first === info.k) && (!info.n || info.n.test(line)));
      return { line: line, first: first, exact: exact, right: right };
    }
    // a few command names to pick from: the right one hidden among decoys. Hints can be turned off in Config.
    function fillChips(answer) {
      var chips = termBox.querySelector('.chips'); chips.innerHTML = '';
      if (!save.cfg.hints) return;
      var pool = [], seen = {};
      function add(w) { if (w && !seen[w]) { seen[w] = 1; pool.push(w); } }
      save.known.forEach(function (c) { add(cmdInfo(c).k === '*' ? null : cmdInfo(c).k); });
      var keyw = norm(answer).replace(/^sudo /, '').split(' ')[0];
      var decoys = pool.filter(function (w) { return w !== keyw; }).sort(function () { return Math.random() - .5; }).slice(0, 5);
      decoys.concat([keyw]).sort(function () { return Math.random() - .5; }).forEach(function (c) { var b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.addEventListener('click', function () { termIn.value = c + ' '; termIn.focus(); }); chips.appendChild(b); });
    }
    function norm(t) { return String(t).trim().replace(/\s+/g, ' ').replace(/[“”]/g, '"').replace(/[‘’]/g, "'"); }

    var B = null;   // the battle in progress
    function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function living() { return B.foes.filter(function (f) { return !f.dead; }); }
    function startBattle(force) {
      var opt = typeof force === 'object' ? force : {}, bossDef = opt.boss ? WD.bosses[opt.boss] : null; if (typeof force === 'object') force = 0;
      var enc = AREA.enc || WD.areas.plaza.enc, tier = AREA.tier || 1, kinds = enc.foes || Object.keys(FOES), r = Math.random(), n = force || (r < .3 ? 1 : r < .55 ? 2 : r < .75 ? 3 : r < .87 ? 4 : r < .95 ? 5 : 6);
      if (!force) n = Math.min(n, enc.max || 6); if (bossDef) n = 1;
      // up to three across; a back row for groups of four or more. Bigger groups hit softer and break faster.
      var SLOTS = [[], [[66, 108]], [[40, 98], [104, 114]], [[28, 94], [92, 110], [140, 94]], [[26, 92], [86, 92], [52, 116], [112, 116]],
        [[18, 90], [74, 90], [130, 90], [44, 116], [102, 116]], [[14, 90], [66, 90], [118, 90], [34, 116], [86, 116], [138, 116]]][n];
      var sc = n <= 2 ? 3 : 2, foes = [], soft = [1, 1, .8, .62, .5, .42, .36][n];
      endTalk();
      for (var i = 0; i < n; i++) {
        var kind = bossDef ? bossDef.kind : kinds[Math.floor(Math.random() * kinds.length)], base0 = FOES[kind], slot = bossDef ? [34, 120] : SLOTS[i];
        var lv = (AREA.lv || 1) + Math.floor(Math.random() * ((AREA.lvMax || AREA.lv || 1) - (AREA.lv || 1) + 1)), elite = !bossDef && lv >= 4 && Math.random() < .12;
        if (elite) lv += 2;
        var hm = 1 + .22 * (lv - 1), am = 1 + .16 * (lv - 1), xm = 1 + .3 * (lv - 1);
        var f = bossDef ? { name: bossDef.name, hp: Math.round(bossDef.hp * 1.4), atk: [Math.round(bossDef.atk[0] * 1.15), Math.round(bossDef.atk[1] * 1.15)], move: bossDef.move, xp: bossDef.xp, boss: true } :
          { name: (elite ? 'Hardened ' : '') + base0.name, lv: lv, hp: Math.round(base0.hp * hm * (elite ? 1.4 : 1)), atk: [Math.round(base0.atk[0] * am), Math.round(base0.atk[1] * am)], move: base0.move, xp: Math.round(base0.xp * xm * (elite ? 1.6 : 1)) };
        if (bossDef) sc = bossDef.sc;
        var c = pickCmd(), info = cmdInfo(c);
        foes.push({ kind: kind, foe: f, hp: Math.round(f.hp * (n >= 4 ? .7 : 1)), max: Math.round(f.hp * (n >= 4 ? .7 : 1)), soft: soft, stun: 0, shake: 0, flash: 0, dead: false, fade: 0, sc: sc,
          cmd: c, sc0: info.when[Math.floor(Math.random() * info.when.length)],
          get scenario() { return this.sc0.t; }, fx: slot[0], fy: slot[1], ph: Math.random() * 6, exposed: 0, slow: 0, leak: 0 });
      }
      B = { foes: foes, focus: false, phase: 'intro', t: 0, vx: 0, pops: [], menu: 'main', sel: 0, cast: 0, target: 0, pending: null, boss: bossDef, onWin: opt.onWin, theme: AREA.theme };
      var hook = opt.boss && WD.bossStart && WD.bossStart[opt.boss], hookMsg = hook ? hook(G, foes[0]) : null; if (hookMsg) setTimeout(function () { log(hookMsg); }, 1300);
      mode = 'swirl'; swirlT = 0; areaEl.classList.remove('on');
    }
    function foeName(f) { return f.foe.name.toLowerCase(); }
    function groupName() {
      var counts = {}; living().forEach(function (f) { counts[f.foe.name] = (counts[f.foe.name] || 0) + 1; });
      return Object.keys(counts).map(function (k) { return counts[k] > 1 ? counts[k] + ' ' + k.toLowerCase() + 's' : 'a ' + k.toLowerCase(); }).join(', ');
    }
    function hudOn() {
      hud.classList.add('on');
      foesBox.innerHTML = ''; foesBox.style.gridTemplateColumns = living().length <= 3 ? '1fr' : '1fr 1fr';
      B.foes.forEach(function (f, i) {
        if (f.dead) return;
        var e = document.createElement('button'); e.type = 'button'; e.className = 'foe' + (B.phase === 'target' && i === B.target ? ' on' : '') + (f.foe.boss ? ' boss' : '');
        if (f.foe.boss) e.innerHTML = '<span>' + f.foe.name + '</span><i><b style="width:' + Math.max(0, Math.round(f.hp / f.max * 100)) + '%"></b></i><em>' + f.hp + ' / ' + f.max + '</em>';
        else e.textContent = f.foe.name;
        e.addEventListener('click', function () { if (B && B.phase === 'target') { B.target = i; confirmTarget(); } });
        e.addEventListener('mouseenter', function () { if (B && B.phase === 'target') { B.target = i; showScenario(); hudOn(); } });
        foesBox.appendChild(e);
      });
      partyBox.innerHTML = '<div class="rpg-row"><span>Vee</span><span>HP <b>' + save.hp + '</b>/' + maxHp() + '</span></div><div class="rpg-row sm"><span>Lv ' + save.lvl + '</span><span>' + save.known.length + (save.known.length === 1 ? ' command' : ' commands') + '</span><span>' + (B.focus ? 'Weak spot marked' : save.streak > 1 ? 'Streak x' + save.streak : '') + '</span></div>';
    }
    function menu(which) {
      B.menu = which; B.sel = 0; cmdBox.innerHTML = '';
      var list = which === 'main' ? [
          { label: 'Fight', tip: 'A plain attack at Vee’s regular strength.', fn: function () { chooseTarget('fight'); } },
          { label: 'Shell', tip: 'Open a shell and type the command that solves a bug’s problem. Right: a bonus attack. Wrong: half power.', fn: function () { chooseTarget('cmd'); } },
          { label: 'Item', tip: 'Bits, bytes and bigger: data that restores HP.', fn: function () { menu('items'); } },
          B.boss ? { label: 'Run', off: true, tip: 'There is no running from this one.', fn: runAway } : { label: 'Run', tip: 'Slip away into the dark.', fn: runAway }]
        : ITEMS.filter(function (it) { return save.items[it.id] > 0; }).map(function (it) { return { label: (innerWidth < 640 && it.short) || it.name, right: 'x' + save.items[it.id], tip: it.tip, fn: function () { item(it.id); } }; })
            .concat([{ label: 'Back', tip: ITEMS.some(function (it) { return save.items[it.id] > 0; }) ? '' : 'No data left. Bugs sometimes drop some.', fn: function () { menu('main'); } }]);
      cmdBox.classList.remove('wide');   // keep Vee's HP in view while choosing an item
      list.forEach(function (o, j) {
        var b = document.createElement('button'); b.type = 'button'; b.disabled = !!o.off; b.className = j === 0 ? 'on' : '';
        b.innerHTML = '<span>' + o.label + '</span>' + (o.right ? '<em>' + o.right + '</em>' : '');
        b.addEventListener('click', function () { if (!b.disabled && B && B.phase === 'menu') o.fn(); });
        b.addEventListener('mouseenter', function () { setSel(j); });
        cmdBox.appendChild(b);
      });
      B.list = list; cmdBox.classList.add('on'); setSel(0);
    }
    function setSel(j) {
      if (!B || !B.list) return; B.sel = (j + B.list.length) % B.list.length;
      [].forEach.call(cmdBox.querySelectorAll('button'), function (b, i) { b.className = i === B.sel ? 'on' : ''; if (i === B.sel && b.scrollIntoView) b.scrollIntoView({ block: 'nearest' }); });
      var o = B.list[B.sel]; if (o && o.tip) log(o.tip, true);
    }
    var logT = 0;
    function log(text, quiet) { titleEl.textContent = text; titleEl.classList.add('on'); clearTimeout(logT); if (!quiet) logT = setTimeout(function () { titleEl.classList.remove('on'); }, 2600); }
    function pop(text, x, y) { B.pops.push({ text: text, x: x, y: y, t: 0 }); }
    function hitFoe(f, n) {
      var crit = B.focus || Math.random() < critC(); if (crit) { n *= 2; B.focus = false; }
      if (f.exposed) n *= 1.5;
      n = Math.max(1, Math.round(n)); f.hp = Math.max(0, f.hp - n); f.shake = 1; f.flash = 1; pop(String(n), f.fx + 16, f.fy - 34);
      if (f.hp <= 0) { f.dead = true; f.fade = 1; }
      return crit ? ' Critical.' : '';
    }
    function base() { return rnd(9, 14) + atk(); }
    // pick a bug; hovering shows the problem it carries
    function showScenario() { var f = B.foes[B.target]; if (f) log(f.foe.name + ': ' + f.scenario, true); }
    function chooseTarget(kind) {
      B.pending = kind; B.phase = 'target'; B.target = B.foes.indexOf(living()[0]); cmdBox.classList.remove('on'); showScenario(); hudOn();
      if (living().length === 1) confirmTarget();
    }
    function moveTarget(d) { var alive = living(), k = alive.indexOf(B.foes[B.target]); k = (k + d + alive.length) % alive.length; B.target = B.foes.indexOf(alive[k]); showScenario(); hudOn(); }
    function confirmTarget() { var kind = B.pending; B.pending = null; if (kind === 'fight') doFight(B.target); else openPrompt(B.target); }
    function cancelTarget() { B.pending = null; closePrompt(); B.phase = 'menu'; menu('main'); hudOn(); }
    function doFight(ti) {
      var f = B.foes[ti]; B.phase = 'anim'; B.vx = 1;
      log('Vee strikes the ' + foeName(f) + '.' + hitFoe(f, base()));
      after();
    }
    // the command prompt
    var termBox = document.createElement('form'); termBox.className = 'ff4w rpg-term'; termBox.setAttribute('autocomplete', 'off');
    termBox.innerHTML = '<p class="sc"></p><label class="row"><span>vee@meridian:~$</span><input type="text" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Type a command"></label><div class="chips"></div><div class="act"><button type="submit">Enter</button><button type="button" class="q">Back</button></div>';
    root.querySelector('.rpg-scr').appendChild(termBox);
    var termIn = termBox.querySelector('input');
    termBox.querySelector('.q').addEventListener('click', function () { if (PZ) cancelPuzzle(); else cancelTarget(); });
    termBox.addEventListener('submit', function (e) { e.preventDefault(); if (PZ) submitPuzzle(termIn.value); else if (B && B.phase === 'type') submitCmd(termIn.value); });
    function openPrompt(ti) {
      var f = B.foes[ti]; B.phase = 'type'; titleEl.classList.remove('on');
      termBox.querySelector('.sc').textContent = f.foe.name + ': ' + f.scenario;
      fillChips(f.sc0.ex[0]);
      termIn.value = ''; termBox.classList.add('on'); setTimeout(function () { termIn.focus(); }, 30);
    }
    function closePrompt() { termBox.classList.remove('on'); termIn.blur(); }
    function submitCmd(raw) {
      var f = B.foes[B.target], info = cmdInfo(f.cmd), J = judge(info, f.sc0, raw), typed = J.first, exact = J.exact, p = prac(f.cmd);
      closePrompt(); B.phase = 'anim'; B.cast = 1;
      if (J.right) {
        var wasM = mastered(f.cmd), tag = '';
        p.last = save.bw;
        if (exact) { p.n++; save.streak++; } else save.streak = 0;
        if (!wasM && mastered(f.cmd)) tag = ' Mastered: ' + f.cmd + '.';
        else if (exact && save.streak >= 2) tag = ' Streak x' + save.streak + '.';
        var bonus = (exact ? 2 : 1.5) * (1 + Math.min(.5, Math.max(0, save.streak - 1) * .1)) * (mastered(f.cmd) ? 1.25 : 1);
        var n = base() * bonus, fxid = info.fx, msg2 = (exact ? 'Exact. ' : 'Valid. ') + info.hit + tag, extra = '';
        if (fxid === 'multi2' || fxid === 'multi3') {
          var hits = fxid === 'multi3' ? 3 : 2, k3 = 0, per = n / (hits === 3 ? 2.1 : 1.6);
          log(msg2); hitFoe(f, per); if (!B.boss) setProblem(f);
          var iv = setInterval(function () { if (!B) { clearInterval(iv); return; } k3++; var tgt = f.dead ? living()[0] : f; if (tgt) hitFoe(tgt, per); hudOn(); if (k3 >= hits - 1) { clearInterval(iv); after(); } }, 260);
          B.vx = 1; return;
        }
        if (fxid === 'all') { living().forEach(function (g) { hitFoe(g, n * .6); }); }
        else if (fxid === 'heavy') extra = hitFoe(f, n * 1.7);
        else if (fxid === 'crit') { B.focus = true; extra = hitFoe(f, n); }
        else {
          extra = hitFoe(f, n);
          if (!f.dead) { if (fxid === 'stun') f.stun = 2; if (fxid === 'expose') f.exposed = 3; if (fxid === 'slow') f.slow = 3; if (fxid === 'leak') f.leak = 3; }
          if (fxid === 'guard') B.guard = 1;
          if (fxid === 'focus') B.focus = true;
          if (fxid === 'heal') { var hh = Math.min(maxHp() - save.hp, 18 + save.lvl * 2); save.hp += hh; pop('+' + hh, 258, 70); }
        }
        log(msg2 + extra); B.vx = 1;
        if (!f.dead && !B.boss) setProblem(f);   // solved: it brings a new problem
      } else {
        save.streak = 0; p.last = save.bw;
        log((typed ? '$ ' + typed + '. Not quite. ' : 'Nothing typed. ') + 'This one called for: ' + f.sc0.ex[0] + '. Half power.' + hitFoe(f, base() * .5));
      }
      after();
    }
    function after() { hudOn(); setTimeout(!living().length ? win : foesTurn, 900); }
    function item(which) {
      B.phase = 'anim'; cmdBox.classList.remove('on');
      var it = ITEMS.filter(function (x) { return x.id === which; })[0];
      if (it && save.items[which] > 0) { save.items[which]--; var h = Math.min(maxHp() - save.hp, it.heal); save.hp += h; pop('+' + h, 258, 70); log('Vee absorbs a ' + it.name.toLowerCase() + ' of clean data. +' + h + ' HP.'); store(); }
      hudOn(); setTimeout(foesTurn, 700);
    }
    function runAway() {
      B.phase = 'anim'; cmdBox.classList.remove('on');
      if (Math.random() < Math.max(.3, .8 - living().length * .1)) { log('Vee slips away into the dark.'); setTimeout(endBattle, 800); }
      else { log('No way through.'); setTimeout(foesTurn, 800); }
    }
    // each bug still standing takes its turn
    function foesTurn() {
      if (!B) return;
      var queue = living().slice(), i = 0;
      (function next() {
        if (!B) return;
        if (i >= queue.length) return myTurn();
        var f = queue[i++];
        if (f.dead) return next();
        if (f.leak > 0) { f.leak--; var lk = 6 + save.lvl; f.hp = Math.max(0, f.hp - lk); pop(String(lk), f.fx + 16, f.fy - 34); if (f.hp <= 0) { f.dead = true; f.fade = 1; hudOn(); if (!living().length) return setTimeout(win, 600); return setTimeout(next, 500); } }
        if (f.exposed > 0) f.exposed--;
        if (f.stun > 0) { f.stun--; log('The ' + foeName(f) + ' strains against its permissions.'); return setTimeout(next, 650); }
        var n = Math.max(1, Math.round(rnd(f.foe.atk[0], f.foe.atk[1]) * f.soft * (f.slow > 0 ? .5 : 1) * (B.guard ? .5 : 1) * CFG.diff[save.cfg.diff] * 100 / (100 + def() * 2.5))); if (f.slow > 0) f.slow--;
        save.hp = Math.max(0, save.hp - n); pop(String(n), 258, 70); B.hurt = 1; f.lunge = 1;
        log('The ' + foeName(f) + ' ' + f.foe.move + '. ' + n + ' damage.'); hudOn();
        if (save.hp <= 0 && gs('revive') && !B.revived) { B.revived = 1; save.hp = Math.round(maxHp() * .3); setTimeout(function () { log('The Watchdog Timer catches Vee mid-fall and restarts him. ' + save.hp + ' HP.'); }, 500); }
        if (save.hp <= 0) return setTimeout(lose, 900);
        setTimeout(next, 800);
      })();
    }
    function myTurn() {
      if (!B) return; B.guard = 0; B.phase = 'menu';
      if (B.boss) B.foes.forEach(setProblem);   // a boss brings a new problem every turn
      menu('main'); hudOn();
    }
    function win() {
      var xp = 0, n = B.foes.length, boss = B.boss, onWin = B.onWin; B.foes.forEach(function (f) { xp += f.foe.xp + (boss ? 0 : rnd(0, 3)); }); xp = Math.round(xp * (1 + gs('xp')) * (save.cfg.diff === 2 ? 1.2 : 1));
      save.wins += n; save.linux += n; save.bw++;
      var lines = [boss ? boss.name + ' is gone.' + (xp ? ' Vee gains ' + xp + ' XP.' : '') : 'The rot clears. Vee gains ' + xp + ' XP.'];
      if (!boss && AREA.id === 'commons' && F.deeds && (F.commonsWins || 0) < 3) { F.commonsWins = (F.commonsWins || 0) + 1; lines.push('Deed: fairground cleared, ' + F.commonsWins + ' of 3.'); }
      if (Math.random() < .35 + n * .07 + gs('drop')) {   // bigger finds as Vee levels up
        var r2 = Math.random() * (40 + save.lvl * 6), tier = r2 < 40 ? 0 : r2 < 60 ? 1 : r2 < 75 ? 2 : r2 < 85 ? 3 : 4;
        tier = Math.min(tier, Math.floor(save.lvl / 3) + 1); var drop = ITEMS[tier];
        save.items[drop.id] = (save.items[drop.id] || 0) + 1; lines.push('The bug drops clean data: a ' + drop.name.toLowerCase() + '.');
      }
      lines = lines.concat(gainXp(xp));
      lines.push('Next level in ' + (xpNeed() - save.xp) + ' XP.');
      store(); B.phase = 'done'; cmdBox.classList.remove('on'); hud.classList.remove('on'); closePrompt();
      setTimeout(function () { say('', lines, null, function () { endBattle(); if (onWin) setTimeout(onWin, 80); }); }, 600);
    }
    function lose() {
      B.phase = 'done'; cmdBox.classList.remove('on'); hud.classList.remove('on'); closePrompt();
      say('', ['Vee’s process halts.', 'Somewhere, a watchdog notices. He restarts at the last place that mended him.'], null, function () { save.hp = maxHp(); store(); endBattle(); me.dir = 'down'; load(save.rest[0], save.rest[1], save.rest[2]); showArea(); });
    }
    function endBattle() { store(); B = null; closePrompt(); hud.classList.remove('on'); cmdBox.classList.remove('on'); titleEl.classList.remove('on'); mode = 'map'; me.safe = 5; }

    /* ---------- loop and drawing ---------- */
    var mode = 'map', raf = 0, last = 0, swirlT = 0, keys = {}, held = null;
    function drawMap() {
      var tnow = performance.now() / 1000;
      if (!me.moving || true) placeCam();
      cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
      cx.drawImage(PAINTED.base, -cam.x, -cam.y - PAINTED.pad);
      var st = { lights: PAINTED.lights, readLog: function (x, y) { var id = AREA.logs && AREA.logs[key(x, y)]; return id && F[id]; }, opened: function (x, y) { return save.opened[AREA.id + ':' + key(x, y)]; },
        gateOpen: gateOpen, isLit: isLit, signal: lights() === 6 || !!F.ending, tether: F.ending === 'cut' ? 'cut' : F.ending === 'reverse' ? 'down' : 'up', fpos: PAINTED.fpos, radio: !!F.radio, mara: !!F.mara };
      ART.live(cx, AREA, MAP, tnow, cam, st, 'under');
      // people, the wagon and Vee, nearest drawn last
      var list = (AREA.npcs || []).map(function (n) { return { y: n.y, draw: function () { ART.person(cx, n.x * TS - cam.x, n.y * TS - cam.y, n, tnow); } }; });
      var w = wagonAt(); if (w) list.push({ y: w[1], draw: function () { ART.wagon(cx, w[0] * TS - cam.x, w[1] * TS - cam.y, tnow); } });
      list.push({ y: me.py / TS + .01, draw: function () {
        var v = veeImg(), vx = me.px - 3 - cam.x, vy = me.py - 10 - (v.bob ? 1 : 0) - cam.y;
        cx.fillStyle = 'rgba(0,0,0,.35)'; cx.beginPath(); cx.ellipse(me.px + 8 - cam.x, me.py + 15 - cam.y, 7, 2.5, 0, 0, 7); cx.fill();
        drawSprite(v.img, vx, vy, v.flip);
      } });
      list.sort(function (a, b) { return a.y - b.y; }).forEach(function (o) { o.draw(); });
      cx.drawImage(PAINTED.over, -cam.x, -cam.y - PAINTED.pad);
      // behind a tall building, Vee shows through as a ghost so you never lose him
      var vb = PAINTED.rises.some(function (r) { return me.px + 14 > r.x && me.px + 2 < r.x + r.w && me.py > r.y - 4 && me.py < r.y + r.h; });
      if (vb) { var v2 = veeImg(); cx.save(); cx.globalAlpha = .55; drawSprite(v2.img, me.px - 3 - cam.x, me.py - 10 - (v2.bob ? 1 : 0) - cam.y, v2.flip); cx.restore(); }
      ART.live(cx, AREA, MAP, tnow, cam, st, 'over');
      drawScan();
      if (fade) { var a = fade.t < .35 ? fade.t / .35 : Math.max(0, 1 - (fade.t - .35) / .35); cx.fillStyle = 'rgba(0,0,0,' + Math.min(1, a) + ')'; cx.fillRect(0, 0, W, H); }
    }
    // the Archive's map of the city
    function drawAtlas() {
      var tnow = performance.now() / 1000;
      cx.fillStyle = '#050507'; cx.fillRect(0, 0, W, H);
      cx.strokeStyle = 'rgba(200,200,214,.08)'; for (var gx = 0; gx < W; gx += 16) { cx.beginPath(); cx.moveTo(gx + .5, 0); cx.lineTo(gx + .5, H); cx.stroke(); } for (var gy = 0; gy < H; gy += 16) { cx.beginPath(); cx.moveTo(0, gy + .5); cx.lineTo(W, gy + .5); cx.stroke(); }
      function pos(id) { var p = WD.atlas[id]; return [30 + p[0] * 50, 16 + p[1] * 34]; }
      var LABEL = { plaza: 'PLAZA', commons: 'COMMONS', halflight: 'HALFLIGHT', gardens: 'GLASSHOUSE', undercroft: 'UNDERCROFT', bastion: 'BASTION', quiet: 'THE QUIET', terminal: 'TERMINAL', line: 'THE LINE', patchwork: 'PATCHWORK', upper: 'UPPER RING', cold: 'COLD STORE' };
      cx.strokeStyle = 'rgba(220,220,236,.45)'; WD.links.forEach(function (l) { var a = pos(l[0]), b = pos(l[1]); cx.beginPath(); cx.moveTo(a[0] + .5, a[1] + .5); cx.lineTo(b[0] + .5, b[1] + .5); cx.stroke(); });
      var anchorAt = { plaza: ['spire', 'archive'], commons: ['ledger'], gardens: ['wagon'], undercroft: ['exit0'], bastion: ['keep'] };
      Object.keys(WD.atlas).forEach(function (id) {
        var p = pos(id), seen = save.seen[id], here = id === AREA.id, A2 = WD.areas[id];
        cx.fillStyle = seen ? '#16161d' : '#0a0a0d'; cx.fillRect(p[0] - 22, p[1] - 9, 44, 18); cx.fillStyle = seen ? '#c0c0cc' : '#3a3a46'; cx.fillRect(p[0] - 22, p[1] - 9, 44, 1);
        if (here && Math.floor(tnow * 3) % 2) { cx.strokeStyle = '#ffffff'; cx.strokeRect(p[0] - 23.5, p[1] - 10.5, 47, 21); }
        var nm = seen ? LABEL[id] || id.toUpperCase() : '???';
        ART.text(cx, nm, Math.round(p[0] - ART.textW(nm) / 2), p[1] - 5, seen ? '#ececf4' : '#4a4a56');
        if (seen && A2.enc) { var lt = 'LV ' + A2.lv; ART.text(cx, lt, Math.round(p[0] + 21 - ART.textW(lt)), p[1] + 3, A2.lv > save.lvl + 2 ? '#ffffff' : '#7a7a86'); }
        (anchorAt[id] || []).forEach(function (a, i) { var on = isLit(a); cx.fillStyle = on ? '#ffffff' : '#3a3a46'; cx.fillRect(p[0] - 4 + i * 6, p[1] + 3, 4, 4); if (on) { cx.fillStyle = 'rgba(255,255,255,.2)'; cx.fillRect(p[0] - 5 + i * 6, p[1] + 2, 6, 6); } });
      });
      ART.text(cx, 'MERIDIAN', 8, 6, '#ffffff', 2);
      ART.text(cx, 'LANDMARKS ' + lights() + ' OF 6', 8, H - 22, '#c0c0cc'); ART.text(cx, 'PRESS ANY KEY', 8, H - 12, Math.floor(tnow * 2) % 2 ? '#ffffff' : '#6a6a76');
      drawScan();
    }
    function drawBattle(dt) {
      var tt = performance.now() / 1000, hy = 64;
      ART.backdrop(cx, (B && B.theme) || (AREA && AREA.theme) || 'plaza', tt, W, H, hy);
      if (!B) return;
      B.t += dt; B.vx = Math.max(0, B.vx - dt * 2.5); B.hurt = Math.max(0, (B.hurt || 0) - dt * 3); B.cast = Math.max(0, B.cast - dt * 2);
      // the bugs, on the left, turned to face Vee; nearer rows drawn last
      var order = B.foes.slice().sort(function (p, q) { return p.fy - q.fy; });
      order.forEach(function (f) {
        f.shake = Math.max(0, f.shake - dt * 3); f.flash = Math.max(0, f.flash - dt * 4); f.lunge = Math.max(0, (f.lunge || 0) - dt * 3);
        if (f.dead) { f.fade = Math.max(0, f.fade - dt * 1.6); if (f.fade <= 0) return; }
        var img = SP.bug(f.kind, Math.floor((B.t + f.ph) * 4)), sc = f.sc, w = img.width * sc, h = img.height * sc;
        var bx = f.fx + (f.shake ? Math.sin(B.t * 80) * 3 * f.shake : 0) + f.lunge * 10, by = f.fy - h + (f.kind === 'moth' || f.kind === 'virus' ? -6 + Math.sin(B.t * 3 + f.ph) * 1.5 : 0);
        cx.fillStyle = 'rgba(0,0,0,.35)'; cx.beginPath(); cx.ellipse(f.fx + w / 2, f.fy + 1, w * .42, 3, 0, 0, 7); cx.fill();
        cx.save(); if (f.dead) cx.globalAlpha = f.fade * (B.t % .16 < .08 ? 1 : .3); if (f.flash > .5) cx.filter = 'brightness(3)';
        drawSprite(img, bx, by, true, sc); cx.restore();
        if (!f.dead) { var tags = []; if (f.stun) tags.push('LOCK'); if (f.exposed) tags.push('EXP'); if (f.slow) tags.push('SLOW'); if (f.leak) tags.push('LEAK');
          if (f.foe.lv) { var lt = 'LV' + f.foe.lv, lw = ART.textW(lt); cx.fillStyle = 'rgba(0,0,0,.55)'; cx.fillRect(Math.round(bx + w / 2 - lw / 2 - 2), Math.round(f.fy + 2), lw + 4, 7); ART.text(cx, lt, Math.round(bx + w / 2 - lw / 2), Math.round(f.fy + 3), f.foe.lv > save.lvl + 2 ? '#ffffff' : '#a8a8b4'); }
          if (tags.length) { cx.font = '5px "Press Start 2P", monospace'; cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillText(tags.join(' '), bx + 1, by - 2); cx.fillStyle = '#f4f4f6'; cx.fillText(tags.join(' '), bx, by - 3); } }
        if (B.phase === 'target' && B.foes[B.target] === f && Math.floor(B.t * 4) % 2 === 0) {   // a target bracket
          cx.fillStyle = '#ffffff'; var x0 = bx - 3, y0 = by - 3, x1 = bx + w + 2, y1 = f.fy + 2;
          [[x0, y0], [x1 - 3, y0], [x0, y1 - 1], [x1 - 3, y1 - 1]].forEach(function (c2) { cx.fillRect(c2[0], c2[1], 4, 1); });
          [[x0, y0], [x1, y0], [x0, y1 - 3], [x1, y1 - 3]].forEach(function (c2) { cx.fillRect(c2[0], c2[1], 1, 4); });
        }
      });
      // Vee, on the right, facing left: smaller than the bugs
      var pose = B.cast > .3 ? 'point' : (B.hurt > .3 ? 'fall' : 'idle'), vx = 250 - B.vx * 34 + (B.hurt ? Math.sin(B.t * 70) * 2 : 0), vfy = 104;
      cx.fillStyle = 'rgba(0,0,0,.4)'; cx.beginPath(); cx.ellipse(vx + 11, vfy, 9, 2.5, 0, 0, 7); cx.fill();
      if (B.focus) { cx.strokeStyle = 'rgba(240,240,244,' + (.35 + Math.sin(B.t * 5) * .15) + ')'; cx.lineWidth = 1; cx.strokeRect(vx - 3.5, vfy - 27.5, 29, 30); }
      drawSprite(SP.frame(pose), vx, vfy - 25, true, 1);
      // damage numbers
      cx.font = '8px "Press Start 2P", monospace'; cx.textAlign = 'center';
      B.pops = B.pops.filter(function (p) { p.t += dt; var x = p.x, y = p.y - p.t * 24; cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillText(p.text, x + 1, y + 1); cx.fillStyle = '#f4f4f6'; cx.fillText(p.text, x, y); return p.t < 1; });
      cx.textAlign = 'left';
      drawScan();
    }
    function drawSwirl(dt) {
      swirlT += dt; drawMap();
      var n = 10, p = Math.min(1, swirlT / .7);
      cx.fillStyle = '#0a0a0c';
      for (var i = 0; i < n; i++) { var h = H / n; cx.fillRect(i % 2 ? W - W * p : 0, i * h, W * p, h + 1); }
      if (swirlT > .5 && swirlT < .62) { cx.fillStyle = 'rgba(255,255,255,.7)'; cx.fillRect(0, 0, W, H); }
      if (swirlT > .8) { mode = 'battle'; B.phase = 'intro'; hudOn(); log('The rot takes shape: ' + groupName() + '.'); setTimeout(myTurn, 1100); }
    }
    function update(dt) {
      if (fade) {
        fade.t += dt;
        if (!fade.swapped && fade.t >= .35) { fade.swapped = true; load(fade.to[0], fade.to[1], fade.to[2]); }
        if (fade.t >= .7) { fade = null; showArea(); }
        return;
      }
      if (mode !== 'map' || talking || PZ) return;
      if (me.moving) {
        var tx = me.x * TS, ty = me.y * TS, sp = 70 * dt;
        me.px += Math.sign(tx - me.px) * Math.min(sp, Math.abs(tx - me.px)); me.py += Math.sign(ty - me.py) * Math.min(sp, Math.abs(ty - me.py)); me.step++;
        if (me.px === tx && me.py === ty) {
          me.moving = false; me.steps++; save.x = me.x; save.y = me.y; if (me.steps % 6 === 0) store();
          var k = key(me.x, me.y), ex = AREA.exits && AREA.exits[k], gt = AREA.gates && AREA.gates[k];
          if (ex) return travel(ex);
          if (gt && gt.to && gateOpen(me.x, me.y)) return travel(gt.to);
          if (WD.steps[AREA.id]) { WD.steps[AREA.id](G, me.x, me.y); if (talking) return; }
          var enc = AREA.enc;
          if (gs('regen') && save.hp < maxHp()) save.hp = Math.min(maxHp(), save.hp + gs('regen'));
          if (enc && enc.tiles.indexOf(tile(me.x, me.y)) >= 0 && --me.safe <= 0 && Math.random() < enc.rate * CFG.enc[save.cfg.enc] * (1 - gs('stealth'))) { startBattle(); return; }
        }
      }
      if (!me.moving && held) tryMove(held);
    }
    function tryMove(d) {
      me.dir = d; var v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d], nx = me.x + v[0], ny = me.y + v[1];
      if (blocked(nx, ny)) return;
      me.x = nx; me.y = ny; me.moving = true;
    }
    function loop(ts) {
      var dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
      update(dt);
      if (mode === 'map' || mode === 'menu') drawMap(); else if (mode === 'atlas') drawAtlas(); else if (mode === 'swirl') drawSwirl(dt); else drawBattle(dt);
      raf = requestAnimationFrame(loop);
    }

    /* ---------- input ---------- */
    var KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
    function press(k) {
      if (!root.classList.contains('open')) return;
      if (talking) {
        if (k === 'a') advance(); else if (k === 'left' || k === 'up') choiceMove(-1); else if (k === 'right' || k === 'down') choiceMove(1);
        return;
      }
      if (mode === 'battle' && B && B.phase === 'type') return;
      if (mode === 'battle' && B && B.phase === 'target') {
        if (k === 'up' || k === 'left') moveTarget(-1); else if (k === 'down' || k === 'right') moveTarget(1);
        else if (k === 'a') confirmTarget(); else if (k === 'b') cancelTarget();
        return;
      }
      if (mode === 'battle' && B && B.phase === 'menu') {
        if (k === 'up') setSel(B.sel - 1); else if (k === 'down') setSel(B.sel + 1);
        else if (k === 'a') { var o = B.list[B.sel]; if (o && !o.off) o.fn(); }
        else if (k === 'b' && B.menu !== 'main') menu('main');
        return;
      }
      if (mode === 'menu') return menuKey(k);
      if (mode === 'atlas') { mode = 'map'; return; }
      if (fade || PZ) return;
      if (mode === 'map') { if (k === 'a') interact(); else if (k === 'b') openMenu(); else held = k; }
    }
    function release(k) { if (held === k) held = null; }
    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('open')) return;
      if (PZ) { if (e.key === 'Escape') { e.preventDefault(); cancelPuzzle(); } e.stopPropagation(); return; }
      if (B && B.phase === 'type') { if (e.key === 'Escape') { e.preventDefault(); cancelTarget(); } e.stopPropagation(); return; }
      if (e.key === 'Escape' && mode === 'menu') { e.preventDefault(); menuKey('b'); return; }
      if (e.key === 'Escape') { if (B && B.phase === 'target') cancelTarget(); else if (B && B.menu && B.menu !== 'main' && B.phase === 'menu') menu('main'); else close(); return; }
      var k = KEYMAP[e.key] || (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z' ? 'a' : e.key === 'x' || e.key === 'X' || e.key === 'Backspace' ? 'b' : null);
      if (!k) return; e.preventDefault(); if (!e.repeat || KEYMAP[e.key]) press(k);
    });
    document.addEventListener('keyup', function (e) { var k = KEYMAP[e.key]; if (k) release(k); });
    [].forEach.call(root.querySelectorAll('.rpg-pad button'), function (b) {
      var k = b.getAttribute('data-k');
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); press(k); });
      b.addEventListener('pointerup', function () { release(k); }); b.addEventListener('pointerleave', function () { release(k); });
    });
    msg.addEventListener('click', function (e) { if (e.target.tagName !== 'BUTTON') advance(); });
    root.querySelector('.rpg-x').addEventListener('click', close);

    /* ---------- open / close ---------- */
    var opener = null;
    function open() {
      opener = document.activeElement; root.classList.add('open'); document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { root.classList.add('show'); });
      cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(loop);
      if (!AREA) { load(save.area, save.x, save.y); syncGear(true); }
      if (mode === 'map' && !talking) showTitle(function () {
        if (talking || mode !== 'map') return;
        if (!save.met) { save.met = true; store(); say('', ['Meridian was built to be the most beautiful place on the network. Two million people lived here. For a while, it was everything it promised.', 'Then the people who owned it built a newer world, Upstream, and took the Lift. Forty thousand seats. They stopped paying for this one.', 'Nothing broken was ever fixed again. The rot set in. District by district, the city has been going dark. Last night, the signal at its heart went quiet.', 'You are Vee, a maintenance process nobody remembered to shut down. You know five commands so far: whoami, pwd, ls, cd and cat. Every level teaches you more.', coarse ? 'Use the pad to move, A to talk and B for the menu.' : 'Arrow keys to move. Enter or Z to talk. X for the menu.'], null, showArea); }
        else say('', ['Vee reconnects. ' + AREA.name + '. Level ' + save.lvl + '.'], null, showArea);
      });
      root.querySelector('.rpg-x').focus({ preventScroll: true });
    }
    function close() {
      root.classList.remove('show'); document.body.style.overflow = ''; held = null;
      setTimeout(function () { if (!root.classList.contains('show')) { root.classList.remove('open'); cancelAnimationFrame(raf); } }, 400);
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }
    window.__quest = { battle: function (n) { startBattle(n); }, boss: function (id) { startBattle({ boss: id }); }, go: function (id, x, y) { if (!AREA) load(id, x, y); else travel([id, x, y]); }, state: function () { return { mode: mode, B: B, me: me, talking: !!talking, save: save, area: AREA && AREA.id, PZ: PZ, map: MAP }; }, press: press, release: release, advance: advance, interact: function () { interact(); }, face: function (d) { me.dir = d; }, puzzle: function (v) { submitPuzzle(v); } };
    return { open: open, close: close };
  })();
})();
