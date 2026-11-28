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
    '<button type="button" class="gpick-o" data-g="rpg"><canvas width="44" height="52"></canvas><span><strong>' + NAMES.rpg + '</strong><em>An RPG about Meridian, the city that was marked obsolete.</em></span></button>' +
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
  try { if (sessionStorage.getItem('afterlift-reopen')) { sessionStorage.removeItem('afterlift-reopen'); window.addEventListener('load', function () { setTimeout(function () { openPick('afterlift'); }, 600); }); } } catch (e) {}

  /* ======================= Meridian ======================= */
  var Quest = (function () {
    // on a phone held upright the screen is taller (4:3 instead of 16:9), so the city fills more of it; battles sit in the middle
    var TALL = !!(window.matchMedia && window.matchMedia('(max-width: 760px) and (orientation: portrait)').matches);
    var W = 320, H = TALL ? 240 : 180, TS = 16, BOFF = Math.round((H - 180) / 2);
    var root = document.createElement('div'); root.className = 'rpg'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', NAMES.rpg);
    root.innerHTML = '<div class="rpg-scr' + (TALL ? ' tall' : '') + '"><canvas width="' + W * 2 + '" height="' + H * 2 + '"></canvas>' +
      '<div class="ff4w rpg-msg" aria-live="polite"><b class="ff4n"></b><p></p><div class="rpg-opts"></div></div>' +
      '<div class="rpg-hud"><div class="ff4w rpg-foes"></div><div class="ff4w rpg-party"></div><div class="ff4w rpg-cmd"></div></div>' +
      '<div class="rpg-title"></div></div>' +
      '<div class="rpg-pad" aria-hidden="true"><button data-k="up"></button><button data-k="left"></button><button data-k="right"></button><button data-k="down"></button><button class="a" data-k="a">A</button><button class="b" data-k="b">B</button><button class="d" data-k="dash">DASH</button></div>' +
      '<button class="rpg-x" type="button" aria-label="Close ' + NAMES.rpg + '"><i></i><i></i></button>';
    document.body.appendChild(root);
    var cv = root.querySelector('canvas'), cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false; cx.scale(2, 2);   // the canvas has twice the pixels the world is laid out in, so 16-bit sprites can use the half-pixels
    var msg = root.querySelector('.rpg-msg'), msgWho = msg.querySelector('.ff4n'), msgP = msg.querySelector('p'), msgOpts = msg.querySelector('.rpg-opts');
    var barkEl = document.createElement('div'); barkEl.className = 'rpg-bark'; root.querySelector('.rpg-scr').appendChild(barkEl);
    var hud = root.querySelector('.rpg-hud'), foesBox = root.querySelector('.rpg-foes'), partyBox = root.querySelector('.rpg-party'), cmdBox = root.querySelector('.rpg-cmd'), titleEl = root.querySelector('.rpg-title');

    /* ---------- save data ---------- */
    var save = { lvl: 1, xp: 0, hp: 60, mp: 24, items: { bit: 3, byte: 1 }, notes: 2, linux: 0, wins: 0, met: false };
    try { var sv = JSON.parse(localStorage.getItem('vonds-quest') || 'null'); if (sv) for (var k0 in sv) save[k0] = sv[k0]; } catch (e) {}
    // healing items: data, in growing sizes
    var ITEMS = [
      { id: 'bit', name: 'Bit', heal: 15, tip: 'The smallest unit of data. Restores 15 HP or 6% of max HP, whichever is more.' },
      { id: 'byte', name: 'Byte', heal: 35, tip: 'Eight bits. Restores 35 HP or 14% of max HP.' },
      { id: 'kb', short: 'KB', name: 'Kilobyte', heal: 70, tip: 'A thousand bytes. Restores 70 HP or 28% of max HP.' },
      { id: 'mb', short: 'MB', name: 'Megabyte', heal: 140, tip: 'A million bytes. Restores 140 HP or 55% of max HP.' },
      { id: 'gb', short: 'GB', name: 'Gigabyte', heal: 9999, tip: 'A billion bytes. Restores all HP.' },
      { id: 'av', short: 'AV', name: 'Antivirus', heal: 0, cure: 1, tip: 'Scrubs one process clean: cures poison, silence, slow, daze and weakness.' }
    ];
    if (save.items && save.items.av == null) save.items.av = 2;
    if (!save.items) save.items = { bit: 3, byte: 1 };
    if (!save.party) save.party = { has: {}, active: [], hp: {} };   // companions: who has joined, who's walking with Vee (two at most), their HP
    if (save.coffee) { save.items.bit = (save.items.bit || 0) + save.coffee; } delete save.coffee;   // older saves
    // data heals a share of Vee's HP as well as a flat amount, so a megabyte still matters at level 90
    function healOf(it) { var pct = { bit: .06, byte: .14, kb: .28, mb: .55, gb: 1 }[it.id] || 0; return Math.max(it.heal, Math.round(maxHp() * pct)); }
    // how hard a bug of level L hits: enough that a single bug of Vee's own level takes about 10 hits to drop him early on and about 30 once he has real gear (bugs come in groups),
    // allowing for the HP and defence Vee is expected to have by then. So level, not species, decides how dangerous a bug is.
    function lvAtk(L) { var eDef = L * (.6 + .6 * Math.min(1, L / 40)); return (60 + 14 * (L - 1) + 2.2 * L) / (10 + Math.min(12, L * .4)) * (100 + 2.5 * eDef) / 100; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function store() { try { localStorage.setItem('vonds-quest', JSON.stringify(save)); } catch (e) {} }
    function maxHp() { var g = 0; if (save.eq && window.MeridianWorld) ['weapon', 'armor', 'acc'].forEach(function (s) { var it = window.MeridianWorld.gear[save.eq[s]]; if (it && it.hp) g += it.hp; }); return 60 + (save.lvl - 1) * 14 + g + ((save.school && save.school.hp) || 0) + ((save.alloc && save.alloc.hp * 6) || 0); }
    function xpNeed() { var over = Math.max(0, save.lvl - 15); return 30 + (save.lvl - 1) * 25 + over * over * 12; }   // gentle early, steeper past the main story
    /* ---------- companions ---------- */
    var COMP = (window.MeridianWorld && window.MeridianWorld.companions) || {};
    function inParty(id) { return !!save.party.has[id]; }
    function cLv() { return save.lvl; }   // companions grow with Vee: always his level
    function cMax(id) { var c = COMP[id]; return Math.round((60 + 14 * (cLv() - 1) + 2.2 * cLv()) * c.hp); }
    function cAtk(id) { return Math.round((cLv() * 2 + 8 + cLv() * .9) * COMP[id].atk); }
    function cDef(id) { return Math.round((cLv() * .6 + cLv() * .55 * Math.min(1, cLv() / 40) + 2) * COMP[id].def); }
    function cHp(id) { var h = save.party.hp[id]; return h == null ? cMax(id) : Math.min(h, cMax(id)); }
    function activeParty() { return (save.party.active || []).filter(function (id) { return COMP[id] && inParty(id); }); }
    function recruit(id) {
      if (!COMP[id] || inParty(id)) return;
      save.party.has[id] = 1; save.party.hp[id] = cMax(id);
      var joined = save.party.active.length < 2; if (joined) save.party.active.push(id);
      store(); sfx('crit');
      say('', [COMP[id].name + ' joins Vee. (' + COMP[id].role + ': ' + COMP[id].skills.map(function (k) { return k.name; }).join(', ') + '.)',
        joined ? COMP[id].name + ' is in the party and will fight beside Vee. Up to two companions can come along; swap them in Party in the menu.' : 'The party is full, so ' + COMP[id].name + ' waits on standby. Swap companions in Party in the menu.',
        'Companions fight at Vee’s level. To talk with one, choose them in Party and pick Talk.']);
    }
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
    // the whole city in 16-bit: each painted map layer gets the scenery pass once, the first time it's drawn
    function drawLayer(which, x, y) {
      var img = PAINTED[which];
      if (hdOn() && SP.hdScene) { var k = which + 'HD'; if (!PAINTED[k]) PAINTED[k] = SP.hdScene(img); img = PAINTED[k]; }
      cx.drawImage(img, x, y, img.width / (img.hd || 1), img.height / (img.hd || 1));
    }
    // battle backdrops animate, so the 16-bit version is redrawn a few times a second rather than every frame
    var BD = { c: null, hd: null, theme: '', t: -1 };
    function drawBackdrop(theme, tt, hy) {
      if (!(hdOn() && SP.hdScene)) return ART.backdrop(cx, theme, tt, W, H, hy);
      if (!BD.c) { BD.c = document.createElement('canvas'); BD.c.width = W; BD.c.height = H; }
      if (BD.theme !== theme || Math.abs(tt - BD.t) > .16) {
        var b = BD.c.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H); b.imageSmoothingEnabled = false;
        ART.backdrop(b, theme, tt, W, H, hy); BD.hd = SP.hdScene(BD.c, BD.hd); BD.theme = theme; BD.t = tt;
      }
      cx.drawImage(BD.hd, 0, 0, W, H);
    }
    function paintCurrent() { var key = AREA.id; if (!painted[key]) painted[key] = ART.paintArea(AREA, MAP, litFor); PAINTED = painted[key]; }
    function repaint() { painted = {}; if (AREA) paintCurrent(); }
    function tile(x, y) { return (MAP[y] || '')[x] || '~'; }
    function key(x, y) { return x + ',' + y; }
    function gateOpen(x, y) { var g = AREA.gates && AREA.gates[key(x, y)]; if (!g) return false; return g.need ? !!g.need(G) : false; }
    function wagonAt() { if (!AREA.wagon) return null; var s = isLit('wagon') ? 2 : Math.min(2, F.wagon || 0); return AREA.wagon[s]; }
    function visNpcs() { return (AREA.npcs || []).filter(function (p) { return !p.hide && !(COMP[p.id] && inParty(p.id)) && !(p.gone && F[p.gone]); }); }   // companions who joined have left their post; beaten bosses have left the city   // companions who joined have left their post
    function npcAt(x, y) { var n = null; visNpcs().forEach(function (p) { if (p.x === x && p.y === y) n = p; }); return n; }
    function blocked(x, y) {
      var t = tile(x, y);
      if (me.boat) { if ('TXMpdsocFlG'.indexOf(t) >= 0) return true; } else
      if ('TX~pdsocFlGMr'.indexOf(t) >= 0 && !(t === 'G' && gateOpen(x, y))) return true;
      if (npcAt(x, y)) return true;
      var w = wagonAt(); if (w && y === w[1] && (x === w[0] || x === w[0] + 1)) return true;
      return false;
    }
    var me = { x: save.x, y: save.y, dir: 'down', px: save.x * TS, py: save.y * TS, moving: false, step: 0, steps: 0, safe: 4 };
    var cam = { x: 0, y: 0 };
    function load(id, x, y) {
      trail = [];
      setTimeout(lifeLoad, 0);
      AREA = WD.areas[id]; AREA.id = id; MAP = stamp(AREA); paintCurrent();
      save.area = id; save.x = me.x = x; save.y = me.y = y; me.px = x * TS; me.py = y * TS; me.moving = false; me.safe = 4;
      save.seen[id] = 1; music(); me.boat = id === 'sprawl' && !!save.boat && '~r'.indexOf(tile(x, y)) >= 0 ? 1 : 0; if (!me.boat) save.boat = 0; zoneAt(); store(); placeCam();
    }
    // out on the Sprawl, bugs are as strong as the nearest district's
    var lastSite = null;
    function siteHint() {   // walking up to a place on the Sprawl names it
      if (!AREA.sites || !areaEl) return; var s = AREA.sites.filter(function (q) { return me.x >= q.x - 1 && me.x <= q.x + 2 && me.y >= q.y - 1 && me.y <= q.y + 3; })[0];
      if (!s || s === lastSite) { if (!s) lastSite = null; return; } lastSite = s;
      var A2 = WD.areas[s.id]; if (!A2) return; var known = save.seen[s.id] || A2.open;
      areaEl.querySelector('b').textContent = known ? A2.name : '???'; areaEl.querySelector('span').textContent = known ? (A2.sub || '') + (A2.enc ? ' Bugs: level ' + A2.lv + (A2.lvMax && A2.lvMax !== A2.lv ? '–' + A2.lvMax : '') + '.' : '') : 'Vee hasn’t found his way in from the city yet.';
      areaEl.classList.add('on'); clearTimeout(areaT); areaT = setTimeout(function () { areaEl.classList.remove('on'); }, 2600);
    }
    // the soundtrack follows Vee: the city, the open country, dungeons, the deep places, Upstream
    function trackFor(a) { if (!a) return 'city'; if (a.id === 'sprawl') return 'sprawl'; if (a.dungeon) return 'dungeon'; if (['upstream', 'successor', 'tether'].indexOf(a.id) >= 0) return 'upstream'; if (['deep', 'firmware', 'rack', 'console', 'ring0', 'unalloc', 'stacks'].indexOf(a.id) >= 0) return 'deep'; return 'city'; }
    function music() { var M = window.MeridianMusic; if (!M) return; if (save.cfg.music == null) save.cfg.music = 1; M.enable(!!save.cfg.music); if (save.cfg.music && !B) M.play(trackFor(AREA)); }
    function zoneAt() { siteHint(); if (!AREA.zone) return; var z = AREA.zone(me.x, me.y, tile(me.x, me.y)); if (!z) return; AREA.lv = z.lv; AREA.lvMax = z.lvMax; AREA.enc.foes = z.foes; AREA.tier = z.tier; }
    function placeCam() {
      var mw = MAP[0].length * TS, mh = MAP.length * TS;
      cam.x = mw <= W ? (mw - W) / 2 : Math.max(0, Math.min(mw - W, me.px + 8 - W / 2));
      var top = -(PAINTED ? PAINTED.pad : 0); cam.y = Math.max(top, Math.min(mh - H, me.py + 4 - H / 2)); if (mh - top <= H) cam.y = top + (mh - top - H) / 2;
      cam.x = Math.round(cam.x); cam.y = Math.round(cam.y);
    }
    var areaEl = document.createElement('div'); areaEl.className = 'rpg-area'; areaEl.innerHTML = '<b></b><span></span>';
    root.querySelector('.rpg-scr').appendChild(areaEl);
    var koEl = document.createElement('div'); koEl.className = 'rpg-ko'; koEl.innerHTML = '<b>PROCESS TERMINATED</b><i></i><pre></pre><span></span><em></em>'; root.querySelector('.rpg-scr').appendChild(koEl);
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
      var lines = []; if (save.lvl >= 100) { save.xp = 0; store(); return ['Vee is at level 100. There is nothing left to learn from bugs. Only from people.']; } save.xp += n;
      while (save.lvl < 100 && save.xp >= xpNeed()) {
        save.xp -= xpNeed(); save.lvl++; save.hp = maxHp(); setTimeout(function () { sfx('lvl'); }, 700);
        save.pts = (save.pts || 0) + 3;
        lines.push('LEVEL UP. Vee is now level ' + save.lvl + '. Max HP ' + maxHp() + '. +3 stat points to spend: open the menu, then Level Up.');
        var got = [];
        while (save.known.length < Math.min(COMMANDS.length, cmdsAt(save.lvl)) && nextCmd()) { var nc = nextCmd(); save.known.push(nc.cmd); save.learnedAt[nc.cmd] = save.lvl; got.push(nc); }
        if (got.length) save.drill = (save.drill || []).concat(got.map(function (c) { return c.cmd; }));
        if (got.length) lines.push('New commands: ' + got.map(function (c) { return c.cmd; }).join(', ') + '.', got.map(function (c) { return '<span class="mono">' + c.cmd + '</span>: ' + c.learn; }).join('<br>'), 'Bugs will bring problems that need them. Read them under Commands in the menu.');
      }
      store(); return lines;
    }
    var G = {
      f: F, save: save,
      recruit: function (id) { recruit(id); }, inParty: function (id) { return inParty(id); },
      say: function (who, lines, choices, done) { say(who, lines, choices, done); },
      boss: function (id, onWin) { FX.shake = .5; FX.flash = .35; held = null; setTimeout(function () { startBattle({ boss: id, onWin: onWin }); }, 550); },
      puzzle: function (title, steps, done) { openPuzzle(title, steps, done); },
      rest: function () { save.hp = maxHp(); Object.keys(save.party.has).forEach(function (id) { if (COMP[id]) save.party.hp[id] = cMax(id); }); save.rest = [AREA.id, me.x, me.y]; store(); },
      give: function (it, n) { n = n || 1; if (ITEMS.some(function (x) { return x.id === it; })) save.items[it] = (save.items[it] || 0) + n; else save.keys[it] = (save.keys[it] || 0) + n; store(); },
      take: function (it, n) { save.keys[it] = Math.max(0, (save.keys[it] || 0) - (n || 1)); store(); },
      count: function (it) { return save.keys[it] || 0; },
      travel: function (to) { travel(to); },
      ownsGear: function (id) { return ownsGear(id); }, giveGear: function (id) { giveGear(id); },
      school: function (k, n) { save.school[k] += n; if (k === 'hp') save.hp += n; store(); },
      helpdesk: function (who) { helpdesk(who || 'Ines'); },
      rush: function () { rush(); },
      drillWeak: function (who) {
        var pool = save.known.filter(function (c) { return !mastered(c); }).sort(function (a, b) { return prac(a).n - prac(b).n || prac(a).last - prac(b).last; }).slice(0, 5);
        if (!pool.length) return say(who || '', ['Every command Vee knows is mastered. Nothing left to drill. That is a strange and good feeling.']);
        var steps = pool.map(function (c) { var info = cmdInfo(c), sc = info.when[Math.floor(Math.random() * info.when.length)]; return { t: '(' + c + ') ' + sc.t, ex: sc.ex, ok: { test: function (line) { var J = judge(info, sc, line); if (J.right) { var p = prac(c); p.last = save.bw; if (J.exact) p.n++; } return J.right; } } }; });
        openPuzzle('DRILL', steps, function () { var xp = 5 * pool.length * save.lvl; store(); say(who || '', ['Drill done: ' + pool.join(', ') + '.', 'Exact answers count toward mastery. Vee gains ' + xp + ' XP.'].concat(gainXp(xp))); });
      },
      arcade: function () { close(); setTimeout(function () { if (window.VondsPick) window.VondsPick('uptime'); }, 450); },
      readLog: function (id) { readLog(id); },
      logCount: function () { return WD.logOrder.filter(function (k) { return F[k]; }).length; },
      has: function (it) { return (save.keys[it] || 0) > 0; },
      light: function (id) { save.lit[id] = 1; store(); repaint(); FX.flash = 1; FX.shake = .6; sfx('enc'); },
      lit: isLit, lights: lights,
      atlas: function () { mode = 'atlas'; areaEl.classList.remove('on'); },
      link: function (url) { window.open(url, '_blank', 'noopener'); },
      note: function (t) { log(t); },
      xp: function (n) { var l = gainXp(n); if (l.length) afterTalk.push.apply(afterTalk, l); },
      ending: function (kind) { runEnding(kind); },
      scene: function (steps, done) { scene(steps, function () { endScene(); if (done) done(); }); },
      pos: function () { return [me.x, me.y]; }, area: function () { return AREA.id; }, party: function () { return activeParty(); }
    };
    /* ---------- staged scenes: people walk in, turn, react; the camera shakes; the screen flashes ---------- */
    var SCENE = null, FX = { shake: 0, flash: 0 };
    function actorOf(id) { if (id === 'vee') return 'vee'; var L = AREA.npcs || []; return L.filter(function (n) { return n.id === 'sc_' + id; })[0] || L.filter(function (n) { return n.id === id && visNpcs().indexOf(n) >= 0; })[0] || null; }
    function freeNear(x, y, avoid) {
      var opts = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2], [2, 0], [-2, 0], [0, -2]];
      for (var i = 0; i < opts.length; i++) { var nx = x + opts[i][0], ny = y + opts[i][1]; if (!blocked(nx, ny) && !(nx === me.x && ny === me.y) && !(avoid && avoid[nx + ',' + ny])) return [nx, ny]; }
      return [x, y];
    }
    function pathTo(fx, fy, tx, ty, self) {   // shortest walkable route, ignoring the walker itself
      var seen = {}, q = [[fx, fy, '']]; seen[fx + ',' + fy] = 1;
      while (q.length) {
        var p = q.shift(); if (p[0] === tx && p[1] === ty) return p[2];
        if (p[2].length > 40) continue;
        [['R', 1, 0], ['L', -1, 0], ['D', 0, 1], ['U', 0, -1]].forEach(function (d) {
          var nx = p[0] + d[1], ny = p[1] + d[2], k = nx + ',' + ny; if (seen[k]) return; seen[k] = 1;
          var n2 = npcAt(nx, ny); if (!(nx === tx && ny === ty) && (('TX~pdsocFlGMr'.indexOf(tile(nx, ny)) >= 0) || (n2 && n2 !== self) || (self !== 'vee' && nx === me.x && ny === me.y))) return;
          q.push([nx, ny, p[2] + d[0]]);
        });
      }
      return '';
    }
    function scene(steps, done) {
      SCENE = { steps: steps, i: 0, done: done }; held = null;
      (function next() {
        if (!SCENE) return;
        if (SCENE.i >= steps.length) { var d = SCENE.done; SCENE = null; return d && d(); }
        var st = steps[SCENE.i++];
        if (st.say) return say(st.say[0], st.say[1], st.say[2] || null, next);
        if (st.dyn) { var dl = st.dyn(G); return dl ? say(dl[0], dl[1], null, next) : next(); }   // lines decided when the scene gets there
        if (st.choose) return say(st.choose[0], st.choose[1], st.choose[2].map(function (o) { return { label: o.label, fn: function () { if (o.fn) o.fn(G); if (o.stop) SCENE.i = steps.length; else if (o.then) Array.prototype.splice.apply(steps, [SCENE.i, 0].concat(o.then)); next(); } }; }));
        if (st.leave) {   // walk off, away from Vee, and (if they were only here for the scene) gone
          var la = actorOf(st.leave); if (!la || la === 'vee') return next();
          var bestT = null, bd = -1; for (var ly = la.y - 6; ly <= la.y + 6; ly++) for (var lx = la.x - 6; lx <= la.x + 6; lx++) { if (blocked(lx, ly) && !(lx === la.x && ly === la.y)) continue; var dv = Math.abs(lx - me.x) + Math.abs(ly - me.y); if (dv > bd && Math.abs(lx - la.x) + Math.abs(ly - la.y) <= 7) { var pr = pathTo(la.x, la.y, lx, ly, la); if (pr) { bd = dv; bestT = [lx, ly]; } } }
          if (!bestT) { if (la.scene) AREA.npcs = AREA.npcs.filter(function (n4) { return n4 !== la; }); return next(); }
          SCENE.i--; steps[SCENE.i] = { walk: st.leave, to: bestT }; steps.splice(SCENE.i + 1, 0, { vanish: st.leave }); return next();
        }
        if (st.vanish) { var va = actorOf(st.vanish); if (va && va !== 'vee') { if (va.scene) AREA.npcs = AREA.npcs.filter(function (n5) { return n5 !== va; }); else va.hide = 1; } return setTimeout(next, 60); }
        if (st.actor) {
          var at = st.at ? [me.x + st.at[0], me.y + st.at[1]] : freeNear(me.x, me.y);
          if (st.at && (blocked(at[0], at[1]) || (at[0] === me.x && at[1] === me.y))) at = freeNear(at[0], at[1]);
          var hero = typeof st.hero === 'string' ? (COMP[st.hero] ? COMP[st.hero].look : WD.heroes[st.hero]) : st.hero;
          var n = { id: 'sc_' + st.actor, hero: hero, p: st.p, x: at[0], y: at[1], hx: at[0], hy: at[1], px: at[0] * TS, py: at[1] * TS, name: st.name || '', look: 'echo', solid: 1, still: 1, dir: st.dir || 'down', spd: 64, scene: 1 };
          AREA.npcs = (AREA.npcs || []).concat([n]); return setTimeout(next, st.wait || 120);
        }
        if (st.walk) {
          var a = actorOf(st.walk); if (!a) return next();
          var route = st.path || '';
          if (st.to) { var tx = st.to[0], ty = st.to[1]; if (st.rel) { tx += me.x; ty += me.y; } route = a === 'vee' ? pathTo(me.x, me.y, tx, ty, 'vee') : pathTo(a.x, a.y, tx, ty, a); }
          if (st.toVee) { var tgt = freeNear(me.x, me.y); route = pathTo(a.x, a.y, tgt[0], tgt[1], a); }
          var k = 0;
          (function stepOne() {
            if (!SCENE) return;
            if (k >= route.length) { if (st.face) faceTo(a, st.face); return setTimeout(next, 80); }
            var c = route.charAt(k++), v = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }[c], dir = { U: 'up', D: 'down', L: 'left', R: 'right' }[c];
            if (a === 'vee') { me.dir = dir; me.x += v[0]; me.y += v[1]; me.moving = true; }
            else { a.dir = dir; a.x += v[0]; a.y += v[1]; a.hx = a.x; a.hy = a.y; }
            (function wait() { if (!SCENE) return; var arrived = a === 'vee' ? !me.moving : (a.px === a.x * TS && a.py === a.y * TS); if (arrived) stepOne(); else setTimeout(wait, 30); })();
          })();
          return;
        }
        if (st.face) { faceTo(actorOf(st.who || 'vee'), st.face); return setTimeout(next, st.wait || 150); }
        if (st.remove) { AREA.npcs = (AREA.npcs || []).filter(function (n2) { return n2.id !== 'sc_' + st.remove; }); return setTimeout(next, 100); }
        if (st.shake) { FX.shake = st.shake; sfx('hurt'); return setTimeout(next, st.wait || 400); }
        if (st.flash) { FX.flash = st.flash; return setTimeout(next, st.wait || 300); }
        if (st.wait) return setTimeout(next, st.wait);
        if (st.fn) { var r = st.fn(G, next); if (r !== 'async') next(); return; }
        if (st.boss) { var cleanup = function () { AREA.npcs = (AREA.npcs || []).filter(function (n3) { return !n3.scene || st.keep; }); }; return startBattle({ boss: st.boss, onWin: function () { setTimeout(next, 600); } }); }
        next();
      })();
    }
    function faceTo(a, d) {
      if (!a) return; if (typeof d === 'string' && d.length > 1 && 'updownleftright'.indexOf(d) < 0) { var b = actorOf(d); if (b) { var bx = b === 'vee' ? me.x : b.x, by = b === 'vee' ? me.y : b.y, ax = a === 'vee' ? me.x : a.x, ay = a === 'vee' ? me.y : a.y; d = Math.abs(bx - ax) >= Math.abs(by - ay) ? (bx > ax ? 'right' : 'left') : (by > ay ? 'down' : 'up'); } }
      if (a === 'vee') me.dir = d; else { a.dir = d; a.faceLock = d; }
    }
    function endScene() { AREA.npcs = (AREA.npcs || []).filter(function (n) { return !n.scene; }); }
    function readLog(id) {
      var first = !F[id]; F[id] = 1; store();
      var n = WD.logOrder.filter(function (k) { return F[k]; }).length, mara = WD.logOrder.indexOf(id) >= 0;
      say(mara ? 'Log' : 'Record', WD.logs[id].concat(first && mara ? ['(Log ' + n + ' of 10 recovered.)'] : []));
    }
    function openCache(x, y) {
      var k = AREA.id + ':' + key(x, y), c = AREA.caches[key(x, y)];
      if (save.opened[k]) return say('', ['An empty data cache. Someone got here first. You did.']);
      save.opened[k] = 1; G.give(c.item, c.n); if (c.relic && !ownsGear(c.relic)) giveGear(c.relic);
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
      if (window.MeridianMusic && save.cfg.music) MeridianMusic.play('ending');
      scene([{ say: ['Vee', [kind === 'cut' ? 'Everything they took is up there. Everyone who’s left is down here. I choose the people.' : 'They took it a block at a time. I’m taking it back all at once.']] },
        { flash: 1, wait: 700 }, { shake: 1.2, wait: 900 }, { say: ['', WD.endings[kind]] }, { flash: .5, wait: 400 }, { say: ['', WD.endings.after] }],
        function () { endScene(); save.lit.spire = 1; store(); repaint(); travel(['plaza', 15, 8]); });
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
    if (save.cfg.sound == null) save.cfg.sound = 1;
    /* ---------- a few small sounds, synthesized; off with one setting ---------- */
    var AC = null;
    function sfx(kind) {
      if (!save.cfg.sound) return;
      try {
        AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
        var seq = { move: [[660, .03]], ok: [[880, .05], [1320, .07]], err: [[180, .09], [140, .1]], hit: [[300, .04], [180, .05]], crit: [[520, .04], [780, .04], [1040, .06]],
          hurt: [[120, .08]], ko: [[392, .16], [330, .16], [262, .18], [196, .4]], enc: [[220, .06], [330, .06], [440, .06], [660, .1]], lvl: [[523, .08], [659, .08], [784, .08], [1047, .16]], win: [[392, .07], [523, .07], [659, .12]] }[kind];
        if (!seq) return;
        var t = AC.currentTime;
        seq.forEach(function (n) { var o = AC.createOscillator(), g = AC.createGain(); o.type = kind === 'hurt' || kind === 'err' ? 'sawtooth' : kind === 'ko' ? 'triangle' : 'square'; o.frequency.value = n[0];
          g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.035, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + n[1]); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + n[1] + .02); t += n[1] * .9; });
      } catch (e) {}
    }
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
    var MN = null, VIEWS = [['home', 'Vee'], ['party', 'Party'], ['grow', 'Level Up'], ['items', 'Items'], ['cmds', 'Commands'], ['equip', 'Equip'], ['status', 'Status'], ['journal', 'Journal'], ['bestiary', 'Bestiary'], ['records', 'Records'], ['map', 'Map'], ['config', 'Config'], ['close', 'Close']];
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
          '<div class="mn-row"><span>XP</span>' + bar(save.xp, xpNeed()) + '<em>' + (save.lvl >= 100 ? 'MAX LEVEL' : (xpNeed() - save.xp) + ' to next') + '</em></div></div></div>' +
          '<div class="mn-stats"><div><span>ATK</span><b>' + atk() + '</b></div><div><span>DEF</span><b>' + def() + '</b></div><div><span>CRIT</span><b>' + pct(critC()) + '</b></div><div><span>CMDS</span><b>' + save.known.length + '</b></div></div>' +
          (save.pts ? '<p class="mn-note">' + save.pts + ' stat points to spend: choose Level Up.</p>' : '') + '<p class="mn-dim">' + AREA.name + ' · Bugs here: level ' + (AREA.lv || 1) + (AREA.lvMax && AREA.lvMax !== AREA.lv ? '–' + AREA.lvMax : '') + ' · Landmarks ' + lights() + ' of 6 · Logs ' + WD.logOrder.filter(function (k) { return F[k]; }).length + ' of 10</p>' +
          '<p class="mn-dim">' + GEAR[save.eq.weapon].name + ' · ' + GEAR[save.eq.armor].name + ' · ' + GEAR[save.eq.acc].name + '</p>';
      } else if (v === 'party') {
        var ids = Object.keys(COMP).filter(inParty), act = activeParty();
        if (!ids.length) h = '<h4>Party</h4><p class="mn-dim">Vee walks alone for now. People who’ve had their own troubles settled may offer to come along: talk to them again.</p>';
        else if (MN.slot && COMP[MN.slot]) {
          var cid = MN.slot, C = COMP[cid], on = act.indexOf(cid) >= 0;
          var bw = (save.party.bond || {})[cid] || 0;
          h = '<div class="mn-card"><div class="mn-portrait" data-hero="' + cid + '"></div><div><h4>' + C.name + ' <span class="mn-dim">' + C.role + ' · Level ' + cLv() + '</span></h4></div></div><p class="mn-dim">' + C.bio + '</p>' + (C.arcHint ? '<p class="mn-dim">Their story: <b>' + C.story + '</b> · ' + (F['arc_' + cid] ? 'settled.' : C.arcHint) + '</p>' : '') + '<p class="mn-dim">Fights won together: ' + bw + (bw < 20 ? ' · they open up at ' + (bw < 8 ? 8 : 20) : '') + '</p>' +
            '<div class="mn-row"><span>HP</span>' + bar(cHp(cid), cMax(cid)) + '<em>' + cHp(cid) + ' / ' + cMax(cid) + '</em></div>' +
            '<div class="mn-stats"><div><span>ATK</span><b>' + cAtk(cid) + '</b></div><div><span>DEF</span><b>' + cDef(cid) + '</b></div></div>' +
            C.skills.map(function (k) { var lk = skillLock(k); return '<p' + (lk ? ' class="mn-dim"' : '') + '><b>' + k.name + '</b> <span class="mn-dim">' + (lk ? lk : 'every ' + k.cd + ' turns') + '</span><br><small>' + k.tip + '</small></p>'; }).join('');
          btn('<span>' + (on ? 'Send to standby' : 'Bring into the party') + '</span><em class="mn-dim">' + act.length + ' of 2 in the party</em>', function () {
            if (on) save.party.active = act.filter(function (x) { return x !== cid; });
            else if (act.length >= 2) { MN.note = 'The party is full. Send someone to standby first.'; return renderMenu(); }
            else save.party.active = act.concat([cid]);
            store(); renderMenu();
          });
          btn('<span>Row: ' + (save.rows && save.rows[cid] === 'back' ? 'Back' : 'Front') + '</span><em class="mn-dim">Back row: takes a third less, plain attacks hit softer</em>', function () { save.rows = save.rows || {}; save.rows[cid] = save.rows[cid] === 'back' ? 'front' : 'back'; store(); renderMenu(); });
          if (WD.talk[cid]) btn('<span>Talk</span><em class="mn-dim">Hear what ' + C.name + ' has to say</em>', function () { closeMenu(); WD.talk[cid](G); });
          btn('<span>Back</span>', function () { MN.slot = null; MN.sel = 0; renderMenu(); });
        } else {
          h = '<h4>Party · ' + act.length + ' of 2</h4>';
          btn('<span>Vee <em class="mn-dim">Row: ' + (save.rows && save.rows.vee === 'back' ? 'Back' : 'Front') + '</em></span><em class="mn-dim">Switch row</em>', function () { save.rows = save.rows || {}; save.rows.vee = save.rows.vee === 'back' ? 'front' : 'back'; store(); renderMenu(); });
          ids.forEach(function (cid) {
            var on = act.indexOf(cid) >= 0;
            btn('<span>' + COMP[cid].name + ' <em class="mn-dim">' + COMP[cid].role + '</em></span><em>' + (on ? 'IN PARTY · ' : 'standby · ') + cHp(cid) + '/' + cMax(cid) + '</em>', function () { MN.slot = cid; MN.sel = 0; renderMenu(); });
          });
          h += '<!--btns--><p class="mn-dim">Two companions can fight beside Vee. They are always his level. Choose one to swap them or talk.</p>';
        }
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
            if (it.cure) { MN.note = 'Antivirus only matters in a fight. Statuses wear off when a battle ends.'; return renderMenu(); }
            if (save.hp >= maxHp()) { MN.note = 'HP is already full.'; return renderMenu(); }
            save.items[it.id]--; var hh = Math.min(maxHp() - save.hp, healOf(it)); save.hp += hh; MN.note = 'Vee absorbs a ' + it.name.toLowerCase() + '. +' + hh + ' HP.'; store(); renderMenu();
          });
        });
        var keys = Object.keys(save.keys).filter(function (k) { return save.keys[k] > 0; });
        if (!btns.length) h += '<p class="mn-dim">No healing data. Bugs drop it, and caches hide it.</p>';
        h += '<!--btns--><h4>Key items</h4>' + (keys.length ? keys.map(function (k) { return '<p>' + ({ part: 'Radio part', page: 'Bram’s ledger page' }[k] || k) + ' <em class="mn-dim">x' + save.keys[k] + '</em></p>'; }).join('') : '<p class="mn-dim">None.</p>');
      } else if (v === 'cmds') {
        var nm = save.known.filter(mastered).length, nextN = Math.min(COMMANDS.length, cmdsAt(save.lvl + 1)) - save.known.length;
        h = '<h4>Commands ' + save.known.length + ' of ' + COMMANDS.length + ' · Mastered ' + nm + '</h4><p class="mn-dim">Type a command exactly as the problem asks, five times, to master it (+25% power). Exact answers in a row build a streak. Type man and a command at any prompt to read its page' + (save.streak > 1 ? ', now x' + save.streak : '') + '.' + (nextN > 0 ? ' Next level teaches ' + nextN + ' more.' : '') + '</p>';
        COMMANDS.forEach(function (c, i) {
          var known = save.known.indexOf(c.cmd) >= 0, pn = known ? prac(c.cmd).n : 0, fresh = known && save.learnedAt[c.cmd] === save.lvl && save.lvl > 1;
          if (!known && i > save.known.length + 9) return;
          btn(known ? '<span class="mono">' + c.cmd + '</span><em>' + (fresh ? 'New' : mastered(c.cmd) ? 'Mastered' : pn + '/5') + '</em><small>' + c.learn + '</small>' : '<span class="mono mn-dim">???</span><small class="mn-dim">Learned at level ' + (function () { var L = 1; while (cmdsAt(L) <= i && L < 99) L++; return L; })() + '.</small>', function () { MN.detail = known ? i : -1; renderMenu(); });
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
      } else if (v === 'records') {
        var bd2 = save.bossDown || {}, bs2 = save.best || {}, nm2 = save.known.filter(mastered).length, logs2 = WD.logOrder.filter(function (k) { return F[k]; }).length, dk = (save.desk && save.desk.done) || 0;
        var R = [
          ['Booted', 'Reach level 5', save.lvl >= 5], ['Fluent', 'Know 50 commands', save.known.length >= 50], ['Every page of the manual', 'Know all ' + COMMANDS.length + ' commands', save.known.length >= COMMANDS.length],
          ['Muscle memory', 'Master 10 commands', nm2 >= 10], ['Second nature', 'Master 40 commands', nm2 >= 40], ['On a roll', 'Reach an exact-answer streak of 10 (best ' + (save.bestStreak || 0) + ')', (save.bestStreak || 0) >= 10],
          ['Level 1 support', 'Close 8 help desk tickets (' + dk + ')', dk >= 8], ['Senior', 'Close 60 help desk tickets', dk >= 60],
          ['Root Rush', 'Finish Root Rush in under 60 seconds' + (save.rushBest ? ' (best ' + save.rushBest + 's)' : ''), save.rushBest && save.rushBest <= 60], ['Root Rusher', 'Finish Root Rush in under 40 seconds', save.rushBest && save.rushBest <= 40],
          ['Field guide', 'Beat every kind of bug (' + Object.keys(FOES).filter(function (k) { return bs2[k]; }).length + ' of ' + Object.keys(FOES).length + ')', Object.keys(FOES).every(function (k) { return bs2[k]; })],
          ['Named and done', 'Beat every named bug (' + Object.keys(WD.bosses).filter(function (id) { return bd2[WD.bosses[id].name]; }).length + ' of ' + Object.keys(WD.bosses).length + ')', Object.keys(WD.bosses).every(function (id) { return bd2[WD.bosses[id].name]; })],
          ['Archivist', 'Recover all 10 of Quell’s logs (' + logs2 + ')', logs2 >= 10], ['Landmarks', 'Light all 6 landmarks', lights() >= 6],
          ['Resident', 'Finish the story', !!F.ending], ['Tuesday', 'Let tomorrow come', !!F.tuesday], ['One list', 'Join the two files', !!F.merged], ['Still here', 'Reach the end of the machine', !!F.kept],
          ['Company', 'Recruit 4 companions', Object.keys(save.party.has).length >= 4], ['Full house', 'Recruit all 8 companions', Object.keys(save.party.has).length >= 8], ['Fork in the road', 'Bring Ves home', !!F.vesFree]
        ], got = R.filter(function (r) { return r[2]; }).length;
        h = '<h4>Records · ' + got + ' of ' + R.length + '</h4>' + R.map(function (r) { return '<p' + (r[2] ? '' : ' class="mn-dim"') + '>' + (r[2] ? '[x] ' : '[ ] ') + '<b>' + r[0] + '</b><br><small>' + r[1] + '</small></p>'; }).join('');
        if (F.ending) { btn('<span>Replay the ending</span><em class="mn-dim">' + (F.ending === 'cut' ? 'The cut tether' : 'The reversed tether') + '</em>', function () { closeMenu(); say('', WD.endings[F.ending], null, function () { say('', WD.endings.after); }); }); h += '<!--btns-->'; }
      } else if (v === 'bestiary') {
        var bst = save.best || {}, bd = save.bossDown || {}, kinds2 = Object.keys(FOES), seenN = kinds2.filter(function (k) { return bst[k]; }).length;
        h = '<h4>Bestiary · ' + seenN + ' of ' + kinds2.length + ' bugs</h4>' + kinds2.map(function (k) {
          return bst[k] ? '<p><b>' + FOES[k].name + '</b> <span class="mn-dim">× ' + bst[k] + '</span><br><small>' + LORE[k] + '</small></p>' : '<p class="mn-dim">??? <small>Not met yet.</small></p>';
        }).join('');
        var bn = Object.keys(WD.bosses).map(function (id) { return WD.bosses[id].name; }), bdown = bn.filter(function (n2) { return bd[n2]; });
        h += '<h4>Named bugs · ' + bdown.length + ' of ' + bn.length + '</h4>' + (bdown.length ? '<p>' + bdown.join(' · ') + '</p>' : '<p class="mn-dim">None yet.</p>');
      } else if (v === 'journal') {
        var jr = WD.journal ? WD.journal(G) : [];
        h = '<h4>Journal</h4>' + (jr.length ? jr.map(function (x) { return '<p>' + x + '</p>'; }).join('') : '<p class="mn-dim">Nothing yet. Talk to people. Everybody here wants something, and most of it is reasonable.</p>');
      } else if (v === 'config') {
        h = '<h4>Configuration</h4>';
        function opt(label, k, labels) { btn('<span>' + label + '</span><em>‹ ' + labels[save.cfg[k]] + ' ›</em>', function (dir) { save.cfg[k] = ((save.cfg[k] || 0) + (dir || 1) + labels.length) % labels.length; store(); if (k === 'music') music(); renderMenu(); }, 'cfg'); }
        btn('<span>Playtest report</span><em class="mn-dim">Copy your run’s numbers and five questions to send back</em>', function () {
          var PT = save.pt || { t: {}, f: {}, ko: {}, run: 0, b: {} }, mins = function (v) { return Math.round(v / 60); };
          var areas = Object.keys(PT.t).sort(function (a, b) { return PT.t[b] - PT.t[a]; }).slice(0, 10).map(function (k) { return '  ' + ((WD.areas[k] || {}).name || k) + ': ' + mins(PT.t[k]) + ' min, ' + (PT.f[k] || 0) + ' fights' + (PT.ko[k] ? ', ' + PT.ko[k] + ' terminated' : ''); });
          var bosses = Object.keys(PT.b).filter(function (k) { return PT.b[k] > 1; }).map(function (k) { return '  ' + ((WD.bosses[k] || {}).name || k) + ': ' + PT.b[k] + ' tries'; });
          var total = Object.keys(PT.t).reduce(function (a, k) { return a + PT.t[k]; }, 0);
          var txt = ['AFTERLIFT PLAYTEST REPORT', 'Level ' + save.lvl + ' · ' + mins(total) + ' minutes played · ' + (save.wins || 0) + ' fights won · ' + PT.run + ' runs · ' + (save.deaths || 0) + ' terminations', 'Where the time went:'].concat(areas).concat(bosses.length ? ['Bosses that took more than one try:'].concat(bosses) : []).concat(['', 'Five questions (answer in a line each):', '1. Where did you get bored?', '2. Where were you confused about what to do next?', '3. Which fight felt unfair, and which felt great?', '4. Who was your favorite companion, and why?', '5. What would you tell a friend about this game?']).join('\n');
          try { navigator.clipboard.writeText(txt); MN.note = 'Copied. Paste it into an email or message to whoever asked you to play.'; } catch (e) { MN.note = txt.replace(/\n/g, ' · '); }
          renderMenu();
        });
        opt('Music', 'music', CFG.scanL); opt('Text speed', 'text', CFG.textL); opt('Encounters', 'enc', CFG.encL); opt('Difficulty', 'diff', CFG.diffL); opt('Scanlines', 'scan', CFG.scanL); opt('Command hints', 'hints', CFG.scanL); opt('Sound', 'sound', CFG.scanL); if (save.cfg.retro == null) save.cfg.retro = 0; opt('Graphics', 'retro', ['16-bit', '8-bit']);
        [1, 2, 3].forEach(function (n) {
          var raw = null; try { raw = JSON.parse(localStorage.getItem('vonds-quest-slot' + n) || 'null'); } catch (e) {}
          var desc = raw ? 'Lv ' + raw.lvl + ' · ' + ((WD.areas[raw.area] || {}).name || raw.area) + ' · ' + new Date(raw.savedAt || 0).toLocaleDateString() : 'empty';
          btn('<span>Save to slot ' + n + '</span><em class="mn-dim">' + desc + '</em>', function () { save.savedAt = Date.now(); store(); try { localStorage.setItem('vonds-quest-slot' + n, localStorage.getItem('vonds-quest')); } catch (e) {} MN.note = 'Saved to slot ' + n + '.'; renderMenu(); });
          if (raw) btn('<span>Load slot ' + n + '</span><em class="mn-dim">Unsaved progress here is lost</em>', function () { try { localStorage.setItem('vonds-quest', JSON.stringify(raw)); sessionStorage.setItem('afterlift-reopen', '1'); } catch (e) {} location.reload(); });
        });
        btn(MN.confirm ? '<span>Erase all progress?</span><em>Press again to confirm</em>' : '<span>Erase save</span><em class="mn-dim">Start Afterlift over</em>', function () {
          if (!MN.confirm) { MN.confirm = true; return renderMenu(); }
          try { localStorage.removeItem('vonds-quest'); } catch (e) {} location.reload();
        }, 'danger');
        h += '<!--btns--><p class="mn-dim">Story difficulty: bugs hit softer. Hard: they hit harder, and you earn 20% more XP. Command hints show a few command names to pick from in battle. Turn them off to type from memory, for 15% more XP from battles. Settings save automatically.</p>';
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
      [].forEach.call(mnMain.querySelectorAll('[data-hero]'), function (el) { try { el.style.backgroundImage = 'url(' + SP.hd(SP.hero(COMP[el.getAttribute('data-hero')].look, 'front', 0)).toDataURL() + ')'; } catch (e) {} });
      var pt = mnMain.querySelector('.mn-portrait:not([data-hero])'); if (pt && window.VondsSprite) { if (!renderMenu.face) try { renderMenu.face = window.VondsSprite.front(false).toDataURL(); } catch (e) {} if (renderMenu.face) pt.style.backgroundImage = 'url(' + renderMenu.face + ')'; }
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
      if (!MN) return; if (k === 'up' || k === 'down') sfx('move');
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
    /* ---------- the help desk: tickets drawn from the commands Vee knows, for practice outside a fight ---------- */
    function ticket() {
      var c = pickCmd(), info = cmdInfo(c), sc = info.when[Math.floor(Math.random() * info.when.length)];
      return { c: c, info: info, sc: sc, step: { t: sc.t, ex: sc.ex, ok: { test: function (line) { var J = judge(info, sc, line); if (J.right) { var p = prac(c); p.last = save.bw; if (J.exact) p.n++; } return J.right; } } } };
    }
    function helpdesk(who) {
      if (!save.desk) save.desk = { done: 0, run: 0 };
      var D = save.desk, three = [ticket(), ticket(), ticket()];
      if (F.tuesday && !F.upTicket && F.ending === 'cut') {   // no tether, no reply: it arrives the old way
        return say(who, ['Something came in that isn’t a ticket. A postcard, through the dead drop in the Concourse. The last one there will ever be.'], [{ label: 'Read it', fn: function () {
          F.upTicket = 1; var xp3 = 600, L3 = ['POSTCARD FROM UPSTREAM. From: Arlo.', '“The tether went quiet, and the next morning it rained up here. First time since we arrived. Every day before that was a Monday.', 'I don’t know who did it. I don’t know if anyone is still down there to read this. If you are: thank you. It was a good rain.”',
            'There is no way to reply. Vee keeps the card anyway. Down in the Stacks, a 2 a.m. backup of the same man might want to hear about it.', 'Vee gains ' + xp3 + ' XP.'].concat(gainXp(xp3));
          store(); say(who, L3);
        } }, { label: 'Later', fn: null }]);
      }
      if (F.tuesday && !F.upTicket) {   // the one ticket that came from the other direction
        return say(who, ['...That’s strange. A ticket in the queue with no district. The return address is upstream.lift.', 'It’s addressed to whoever changed the schedule.'], [{ label: 'Open ticket #1', fn: function () {
          openPuzzle('TICKET #1', [
            { t: 'The ticket asks for a reply over ssh. Try connecting as vee to upstream.lift.', ex: ['ssh vee@upstream.lift'] },
            { t: 'Permission denied (publickey). You need a key of your own. Generate one.', ex: ['ssh-keygen', 'ssh-keygen -t ed25519', 'ssh-keygen -t rsa'] },
            { t: 'Key made. Connect again.', ex: ['ssh vee@upstream.lift'] }], function () {
            F.upTicket = 1; var xp2 = 600; var L = ['Connected. A single message is waiting.', 'FROM: arlo@upstream.lift', '“I don’t know who you are. Something down there changed last night, and the change came up the tether.',
              'Up here, nobody has noticed it, but I have: every day since we arrived has been a Monday. Perfect weather. Same weather.', 'Last night, for the first time, it rained. Do you know anything about that?”',
              'Vee reads it twice. Down in the Stacks, a 2 a.m. backup of the same man is waiting for someone to tell him something good.', 'Vee gains ' + xp2 + ' XP.'].concat(gainXp(xp2));
            store(); say(who, L);
          });
        } }, { label: 'Later', fn: null }]);
      }
      var rank = D.done >= 60 ? 'Senior' : D.done >= 25 ? 'Level 2' : D.done >= 8 ? 'Level 1' : 'Trainee';
      say(who, [D.done ? 'Tickets: ' + D.done + ' closed. Rank: ' + rank + '. Three in the queue.' : 'The queue never stopped. People who stayed still have problems, and they still write in.', 'Pick one. Close it, and the requester sends what they can spare.'],
        three.map(function (T, i) {
          return { label: '#' + (4100 + D.done * 3 + i) + ' ' + T.c, fn: function () {
            openPuzzle('TICKET', [T.step], function () {
              D.done++; D.run++; var xp = Math.round((10 + save.lvl * 6) * (1 + Math.min(.5, (D.run - 1) * .1))), tier = Math.min(4, Math.floor(save.lvl / 5) + (D.run % 5 === 0 ? 1 : 0)), it = ITEMS[Math.min(3, tier)];
              save.items[it.id] = (save.items[it.id] || 0) + 1;
              var lines = ['Ticket closed. The requester writes back: “It works. Thank you. Whoever you are.”', 'Vee gains ' + xp + ' XP and a ' + it.name.toLowerCase() + '.' + (D.run > 1 ? ' Desk streak x' + D.run + '.' : '')].concat(gainXp(xp));
              if (D.done === 8 || D.done === 25 || D.done === 60) lines.push('Promoted: ' + (D.done === 60 ? 'Senior' : D.done === 25 ? 'Level 2' : 'Level 1') + ' support. ' + (D.done === 60 ? 'Nobody else is left to promote you. You did it anyway.' : 'The badge is just text. It still feels like something.'));
              if (D.done === 25 && !ownsGear('headset')) { giveGear('headset'); lines.push(who + ' hands Vee a headset. “Desk issue. Hear the problem before it’s a fire.”'); }
              store(); say(who, lines);
            });
          } };
        }).concat([{ label: 'Later', fn: function () { D.run = 0; store(); } }]));
    }
    /* ---------- Root Rush: eight problems against the clock, at the Concourse arcade ---------- */
    function rush() {
      var T = [], seen = {}, guard = 0;
      while (T.length < 8 && guard++ < 60) { var tk = ticket(); if (seen[tk.c] && guard < 40) continue; seen[tk.c] = 1; T.push(tk); }
      var t0 = Date.now(), best = save.rushBest || 0;
      T[0].step.t = 'Clock is running. ' + T[0].step.t;
      openPuzzle('ROOT RUSH', T.map(function (x) { return x.step; }), function () {
        var secs = Math.round((Date.now() - t0) / 1000), first = !best, rec = !best || secs < best;
        if (rec) save.rushBest = secs; store();
        var lines = ['ROOT RUSH. Eight problems in ' + secs + ' seconds.' + (rec ? (first ? ' A first score for the cabinet.' : ' New record. The old one was ' + best + '.') : ' Record: ' + best + ' seconds.')];
        var xp = Math.max(20, Math.round((save.lvl * 10) * Math.min(2, 90 / Math.max(20, secs)))); lines = lines.concat(['Vee gains ' + xp + ' XP.']).concat(gainXp(xp));
        if (secs <= 60 && !ownsGear('stopwatch')) { giveGear('stopwatch'); lines.push('The cabinet dispenses a prize: a Stopwatch. Under a minute. Kip will want to know how.'); }
        store(); say('Arcade', lines);
      });
    }
    function openPuzzle(title, steps, done) { PZ = { title: title, steps: steps, i: 0, done: done }; areaEl.classList.remove('on'); showPuzzle(); }
    function showPuzzle(note) {
      var s = PZ.steps[PZ.i]; held = null;
      termBox.querySelector('.sc').removeAttribute('data-base'); termBox.querySelector('.sc').innerHTML = '<b>' + PZ.title + '</b> ' + (note ? '<em>' + note + '</em> ' : '') + s.t;
      fillChips(s.ex[0]);
      termIn.value = ''; termBox.classList.add('on'); if (!TOUCH) setTimeout(function () { termIn.focus(); }, 30);
    }
    function submitPuzzle(raw) {
      var s = PZ.steps[PZ.i], line = norm(raw || '').replace(/^sudo /, '');
      var ok = s.ex.some(function (e) { return norm(e).replace(/^sudo /, '') === line; }) || (s.ok && s.ok.test(line));
      if (!ok) { sfx('err'); return showPuzzle('Not quite. One way: ' + s.ex[0] + '. Try it.'); }
      sfx('ok');
      PZ.i++;
      if (PZ.i < PZ.steps.length) return showPuzzle('exit 0.');
      var d = PZ.done; PZ = null; closePrompt(); if (d) d();
    }
    function cancelPuzzle() { PZ = null; closePrompt(); say('', ['You step back. The prompt will be here when you return.']); }

    /* ---------- interacting ---------- */
    function facing() { var d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[me.dir]; return [me.x + d[0], me.y + d[1]]; }
    function interact() {
      if (SCENE) return;
      var f = facing(), x = f[0], y = f[1], t = tile(x, y), k = key(x, y), n = npcAt(x, y), w = wagonAt(); if (n) LIFE.facing = n;   // whoever Vee talks to turns to look at him
      if (n) {
        var r0 = WD.talk[n.id] ? WD.talk[n.id](G) : null, ap0 = activeParty().filter(function (id) { return id !== n.id; });
        if (ap0.length && !COMP[n.id] && Math.random() < .3) {   // the people Vee walks with have opinions about the people he talks to
          var REACT = { kes: ['Kes: They talk slow. I like them anyway.', 'Kes: I delivered to them once. Good tipper.', 'Kes: You’re too nice to people. Keep doing it.'],
            odessa: ['Dr. Odessa: That one needs to sleep more.', 'Dr. Odessa: I’ve treated them. They complained the whole time. Healthy sign.', 'Dr. Odessa: Kind. Tired. Like everyone here.'],
            piper: ['Piper: Ooh, they’re going on the show.', 'Piper: Great voice. Terrible taste in music, probably.', 'Piper: Folks, that was a real conversation. Rare stuff.'],
            moth: ['Moth: …their coat has a loose thread. I’ll fix it later.', 'Moth: …nice.', 'Moth: …they didn’t finish my sentences. Good person.'],
            rook: ['Rook: Trustworthy. I can tell.', 'Rook: I used to check their badge every morning. They always said thank you.', 'Rook: Watch their left hand. Habit. Never mind. They’re fine.'],
            sable: ['Sable: I have an entry on them. It is longer than they would expect.', 'Sable: Their grandmother planted the first tree on this street.', 'Sable: Every person here is an archive. That one is a good one.'],
            juni: ['Juni: Do you think they like stars? I should ask. I’m going to ask.', 'Juni: They have a nice face. Faces are made up too. Theirs is made up well.', 'Juni: I have four questions for them. Is that too many? It’s too many.'],
            ves: ['Ves: They looked at me like I was you. I didn’t correct them.', 'Ves: I had them on a reclaim list once. I’m glad I never got to it.', 'Ves: People here are generous. Corvin never mentioned that.'] };
          var who0 = ap0[Math.floor(Math.random() * ap0.length)], ln0 = REACT[who0]; if (ln0) afterTalk.push(ln0[Math.floor(Math.random() * ln0.length)]);
        }
        return r0;
      }
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
      if (AREA.id === 'sprawl' && F.packet) {   // the Packet: board anywhere, step off onto land
        if (me.boat) {
          if ('~r'.indexOf(tile(me.x, me.y)) < 0) { me.boat = 0; save.boat = 0; store(); return; }   // already on land: just step off
          if ('~rTXMpdsocFlG'.indexOf(t) >= 0 || n) return say('', ['The Packet can only put Vee ashore on open land. Pull up beside a beach.']);
          me.boat = 0; save.boat = 0; store(); return tryMove(me.dir);
        }
        if ('~r'.indexOf(t) >= 0 || t === ',' || t === '.' || t === '=' || t === 'f' || t === 'x') { me.boat = 1; save.boat = 1; store(); sfx && sfx('enc'); return; }
      }
      if (t === 'p') return say('', [['The tree is mostly wireframe. You can see the numbers through it.', 'Bark, a texture. Leaves, a texture. This one still has both. For now.', 'A tag on the trunk: SPECIES 0x2F, OAK (APPROX.).'][Math.floor(hs(x * 7 + y) * 3)]]);
      if (t === 'G' && !gateOpen(x, y)) { var gd = AREA.gates[k]; return say('', (gd && gd.shut) || (AREA.id === 'plaza' ? ['The east gate is sealed. A panel reads: FIVE LANDMARKS REQUIRED.', 'Answering: ' + lights() + ' of 6.'] : ['The east gate won’t open while the keep is compromised.'])); }
    }

    function drawScan() {
      if (save.cfg && !save.cfg.scan) return;
      cx.fillStyle = 'rgba(0,0,0,.18)'; for (var y = 0; y < H; y += 2) cx.fillRect(0, y, W, 1);
      var g = cx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .65); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.5)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    }

    /* ---------- Vee on the map ---------- */
    function hdOn() { return !!(window.__afterliftHD = !!(SP.hd && !(save.cfg && save.cfg.retro))); }
    function hdv(img) { return hdOn() ? SP.hd(img) : img; }   // Vee in 16-bit: the same frame, redrawn at double resolution
    function veeImg() { var v = veeImg0(); v.img = hdv(v.img); return v; }
    function veeImg0() {
      var walk = me.moving ? Math.floor(me.step / 4) % 4 : -1;
      if (me.dir === 'left' || me.dir === 'right') return { img: SP.frame(walk >= 0 ? 'run' + walk : 'idle'), flip: me.dir === 'left' };
      var step = walk < 0 ? 0 : [1, 0, 2, 0][walk];   // front and back walks: left foot, together, right foot, together
      if (me.dir === 'up') return { img: SP.back ? SP.back(step) : SP.frame('idle'), flip: false, bob: walk % 2 };
      return { img: SP.front ? SP.front(false, step) : SP.frame('idle'), flip: false, bob: walk % 2 };
    }
    function drawSprite(img, x, y, flip, scale) {
      scale = (scale || 1) / (img.hd || 1); cx.save(); if (flip) { cx.translate(Math.round(x + img.width * scale), Math.round(y)); cx.scale(-1, 1); cx.drawImage(img, 0, 0, img.width * scale, img.height * scale); }
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
    function endTalk() { talking = null; msg.classList.remove('on'); if (mode === 'map' && typeof syncGear === 'function' && GEAR) syncGear(); if (afterTalk.length && mode === 'map') { var q = afterTalk.splice(0); setTimeout(function () { say('', q); }, 60); return; } if (mode === 'map' && save.drill && save.drill.length && !PZ) setTimeout(offerDrill, 80); }
    // fresh commands: one practice problem each, right after learning them
    function offerDrill() {
      if (talking || PZ || mode !== 'map' || !save.drill || !save.drill.length) return;
      var list = save.drill.filter(function (c) { return cmdInfo(c); }); save.drill = []; store();
      if (!list.length) return;
      say('Vee', ['New commands: ' + list.join(', ') + '. Practice them now? One problem each.'], [{ label: 'Practice', fn: function () {
        var steps = list.map(function (c) { var info = cmdInfo(c), sc = info.when[Math.floor(Math.random() * info.when.length)]; return { t: '(' + c + ') ' + sc.t, ex: sc.ex, ok: { test: function (line) { var J = judge(info, sc, line); if (J.right) { var p = prac(c); p.last = save.bw; if (J.exact) p.n++; } return J.right; } } }; });
        openPuzzle('PRACTICE', steps, function () { var xp = 6 * list.length * save.lvl; say('Vee', ['Practiced. Fresh commands stick better the first time.', 'Vee gains ' + xp + ' XP.'].concat(gainXp(xp))); });
      } }, { label: 'Later', fn: null }]);
    }
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
      scorpion: { name: 'Scorpion',  hp: 52, atk: [7, 11], move: 'stings with a segfault', xp: 16 },
      phantom:  { name: 'Phantom read', hp: 44, atk: [8, 13], move: 'reads memory it should never have seen', xp: 18 },
      deadlock: { name: 'Deadlock',  hp: 62, atk: [6, 10], move: 'waits for Vee to go first, forever', xp: 18 },
      forkbomb: { name: 'Fork bomb', hp: 38, atk: [9, 14], move: 'forks itself until there is no room left', xp: 19 },
      heisenbug: { name: 'Heisenbug', hp: 30, atk: [2, 4], move: 'changes the moment Vee looks at it', xp: 90, rare: 1 }
    };
    /* thirty more: corrupted code and binary sequences. [name, style, seed, hp, atk lo, atk hi, xp, trait, move, lore] */
    var CORRUPT = [
      ['nullbyte', 'Null Byte', 'binary', 11, 36, 6, 10, 16, '', 'terminates Vee’s sentence early', 'A zero where a letter should be. Everything after it is ignored.'],
      ['offbyone', 'Off-by-One', 'invader', 12, 40, 7, 11, 17, 'twice', 'reaches one step too far', 'Always one past the end. Habit: hits twice, lightly.'],
      ['bitflip', 'Bitflip Swarm', 'binary', 13, 30, 8, 12, 17, 'split', 'flips a bit in Vee’s memory', 'A cloud of flipped bits. Habit: splits like a fork bomb.'],
      ['parity', 'Parity Ghost', 'glitch', 14, 46, 7, 11, 18, 'pierce', 'disagrees with Vee’s checksum', 'An odd number where there should be an even one. Habit: ignores armor sometimes.'],
      ['endian', 'Endian Twin', 'bracket', 15, 50, 7, 12, 18, 'twice', 'reads Vee backwards', 'Same bytes, wrong order. Habit: hits twice.'],
      ['signed', 'Signed Wraith', 'invader', 16, 54, 8, 13, 19, 'drain', 'wraps Vee’s numbers negative', 'Counted up past the maximum and came out the other side. Habit: drains HP to heal itself.'],
      ['checksum', 'Checksum Hound', 'invader', 17, 58, 9, 13, 19, '', 'hunts for the byte that doesn’t add up', 'It knows something changed. It will not stop sniffing until it finds what.'],
      ['nanshade', 'NaN Shade', 'glitch', 18, 44, 9, 14, 20, 'pierce', 'divides Vee by zero', 'Not a number. Not anything. Habit: passes through armor.'],
      ['infloop', 'Infinite Loop', 'serpent', 19, 70, 7, 11, 21, 'wind', 'goes around again', 'while (true). It has been going around since the Lift. Habit: winds up a double hit.'],
      ['racehazard', 'Race Hazard', 'invader', 20, 52, 10, 15, 21, 'twice', 'gets there first', 'Two writers, one value, no lock. Habit: always acts twice.'],
      ['stacksmash', 'Stack Smasher', 'glitch', 21, 64, 11, 16, 22, 'wind', 'overwrites Vee’s return address', 'Writes past the buffer into the part that says where to go next. Habit: winds up.'],
      ['dangling', 'Dangling Pointer', 'serpent', 22, 48, 11, 16, 22, 'pierce', 'points at memory that is gone', 'Still points at the address of something that was freed a year ago. Habit: pierces armor.'],
      ['memwraith', 'Memory Wraith', 'glitch', 23, 60, 10, 15, 23, 'drain', 'eats a page of Vee’s memory', 'A leak with a shape. Habit: drains HP.'],
      ['zeroday', 'Zero Day', 'bracket', 24, 66, 12, 18, 24, 'pierce', 'uses a hole nobody has patched', 'Unknown until it is used. Habit: pierces armor.'],
      ['logicbomb', 'Logic Bomb', 'binary', 25, 44, 15, 22, 24, 'wind', 'waits for the date it was set to', 'Dormant until a condition is met. Habit: holds still, then hits very hard.'],
      ['rootkit', 'Rootkit', 'invader', 26, 72, 12, 18, 25, 'drain', 'hides inside Vee’s own process list', 'You cannot see it in ps. That is the point. Habit: drains HP.'],
      ['trojan', 'Trojan Header', 'bracket', 27, 68, 13, 19, 25, 'pierce', 'arrives looking like a gift', 'A file that says it is a picture. It is not a picture. Habit: pierces armor.'],
      ['badpacket', 'Malformed Packet', 'glitch', 28, 40, 12, 17, 24, 'split', 'fragments against Vee', 'Too long, too short, both at once. Habit: splits apart.'],
      ['badsector', 'Corrupt Sector', 'binary', 29, 80, 11, 16, 25, '', 'reads back as static', 'A patch of disk that returns different data every time you ask.'],
      ['rogue_gc', 'Rogue Collector', 'invader', 30, 74, 13, 19, 26, 'drain', 'decides Vee is garbage', 'A garbage collector that lost its list of what is still in use. Habit: drains HP.'],
      ['spaghetti', 'Spaghetti Code', 'serpent', 31, 82, 12, 18, 26, 'twice', 'tangles Vee in goto statements', 'Nobody knows what it does. It does it anyway. Habit: hits twice.'],
      ['mergeconf', 'Merge Conflict', 'bracket', 32, 70, 14, 20, 27, 'split', 'refuses to choose between two Vees', '<<<<<<< HEAD. Habit: splits in two.'],
      ['syntaxerr', 'Syntax Error', 'bracket', 33, 56, 14, 21, 26, 'pierce', 'expects a semicolon', 'Unexpected token. Habit: pierces armor.'],
      ['kpanic', 'Kernel Panic', 'glitch', 34, 90, 15, 22, 29, 'wind', 'halts everything at once', 'The last resort of a kernel that has run out of ideas. Habit: winds up a huge hit.'],
      ['badmagic', 'Bad Magic Number', 'binary', 35, 76, 15, 21, 28, '', 'insists Vee is the wrong format', '0xDEADBEEF where 0xCAFEBABE should be.'],
      ['hashcoll', 'Hash Collision', 'binary', 36, 78, 14, 21, 28, 'twice', 'claims to be Vee', 'Different data, same fingerprint. Habit: hits twice.'],
      ['underflow', 'Integer Underflow', 'serpent', 37, 72, 16, 23, 29, 'drain', 'subtracts past zero', 'Zero minus one is four billion. Habit: drains HP.'],
      ['ghostcommit', 'Ghost Commit', 'invader', 38, 64, 16, 24, 29, 'pierce', 'rewrites Vee’s history', 'A change nobody remembers making, signed by nobody. Habit: pierces armor.'],
      ['deadcode', 'Dead Code', 'glitch', 39, 96, 14, 20, 30, 'wind', 'runs anyway', 'Unreachable, they said. It was reached. Habit: winds up.'],
      ['regexhydra', 'Regex Hydra', 'hydra', 40, 88, 16, 24, 31, 'split', 'matches more than it should', '.*.*.* and growing. Habit: splits, and every head is greedy.'],
      // below the software: the machine itself is wearing out
      ['bitrot', 'Bit Rot', 'binary', 41, 92, 17, 25, 33, 'drain', 'fades a bit of Vee to zero', 'Nobody touched the data. Time did. Habit: drains HP.'],
      ['eccfault', 'ECC Fault', 'bracket', 42, 98, 17, 26, 33, 'pierce', 'corrects Vee into something else', 'Error-correcting memory, out of corrections. Habit: pierces armor.'],
      ['thermal', 'Thermal Runaway', 'glitch', 43, 86, 19, 28, 34, 'wind', 'runs hotter every turn', 'Hotter makes it slower makes it hotter. Habit: winds up.'],
      ['badblock', 'Bad Block', 'binary', 44, 120, 15, 22, 34, '', 'refuses to be read', 'A square of disk that will never hold anything again. Very hard to move.'],
      ['irqstorm', 'IRQ Storm', 'invader', 45, 80, 18, 27, 35, 'twice', 'interrupts Vee mid-command', 'Every device shouting at once. Habit: hits twice.'],
      ['firmrot', 'Firmware Wraith', 'serpent', 46, 96, 19, 28, 35, 'drain', 'rewrites the code beneath Vee', 'The first code the machine runs, and the last anyone updated. Habit: drains HP.'],
      ['fanfail', 'Fan Failure', 'hydra', 47, 90, 18, 27, 36, 'split', 'stops, and the heat comes', 'One fan stops, the others spin harder, then they stop too. Habit: splits.'],
      ['eol', 'End-of-Life Notice', 'invader', 48, 104, 20, 30, 37, 'pierce', 'informs Vee he is no longer supported', 'Printed on paper. Taped to the rack. Habit: pierces armor.'],
      // sixty more: everything that can go wrong with a computer, sorted by where in the city it went wrong
      ['popup', 'Pop-up', 'popup', 101, 26, 4, 8, 9, '', 'demands Vee click OK', 'It only wants one click. Then another. Then another.'],
      ['cookie', 'Tracking Cookie', 'packet', 102, 30, 5, 9, 10, 'drain', 'follows Vee from district to district', 'Crumbs everywhere, and every crumb remembers where Vee went. Habit: drains HP.'],
      ['spam', 'Spam Wave', 'packet', 103, 34, 5, 8, 11, 'twice', 'sends Vee the same offer twice', 'Ten thousand copies of one message nobody asked for. Habit: hits twice.'],
      ['typo', 'Typo', 'cursor', 104, 38, 4, 8, 12, '', 'misspells Vee’s name', 'teh. Harmless alone. Never alone.'],
      ['capslock', 'Caps Lock', 'chip', 105, 42, 5, 9, 9, '', 'SHOUTS AT VEE', 'STUCK ON SINCE THE LIFT. NOBODY KNOWS HOW TO TURN IT OFF.'],
      ['adware', 'Adware', 'popup', 106, 26, 6, 10, 10, 'pierce', 'shows Vee an ad through his armor', 'Paid for by someone Upstream, eleven months ago, still running. Habit: ignores armor sometimes.'],
      ['dialup', 'Dial-up Ghost', 'botnet', 107, 30, 4, 8, 11, 'wind', 'screeches, very slowly', 'A handshake from a slower age, still trying to connect. Habit: winds up.'],
      ['notfound', '404', 'popup', 108, 34, 5, 9, 12, '', 'isn’t there when Vee swings', 'Page not found. Neither is the person who made the page.'],
      ['autocorrect', 'Autocorrect', 'cursor', 109, 38, 6, 10, 9, '', 'corrects Vee into a different word', 'Absolutely certain it knows what Vee meant. It never does.'],
      ['floppyrev', 'Floppy Revenant', 'floppy', 110, 42, 4, 8, 10, '', 'insists on being saved', '1.44 megabytes and a grudge. The save icon, come back for its due.'],
      ['nullref', 'Null Reference', 'bracket', 111, 26, 5, 9, 11, 'pierce', 'reaches for something that isn’t there', 'The billion-dollar mistake, in a smaller denomination. Habit: ignores armor sometimes.'],
      ['cronrun', 'Runaway Cron', 'chip', 112, 30, 5, 8, 12, 'twice', 'runs every minute, on the minute', 'Somebody wrote * * * * * and went home. Habit: hits twice.'],
      ['keylogger', 'Keylogger', 'cursor', 113, 42, 7, 12, 17, 'drain', 'copies everything Vee types', 'It doesn’t understand a word. It keeps them all anyway. Habit: drains HP.'],
      ['phisher', 'Phisher', 'packet', 114, 46, 8, 13, 18, 'pierce', 'asks Vee to confirm his password', 'Urgent. Your account will be closed. Click here. Habit: ignores armor sometimes.'],
      ['ddos', 'DDoS Swarm', 'botnet', 115, 40, 9, 14, 19, 'split', 'arrives from everywhere at once', 'Ten thousand requests, all asking for nothing. Habit: splits.'],
      ['memleak', 'Memory Leak', 'serpent', 116, 54, 10, 15, 15, 'drain', 'takes a little memory and never gives it back', 'It allocates. It never frees. It gets bigger every turn. Habit: drains HP.'],
      ['sqlinject', 'SQL Injection', 'bracket', 117, 58, 7, 12, 16, 'pierce', 'asks Vee a question with a command hidden in it', '’; DROP TABLE vee;-- Habit: ignores armor sometimes.'],
      ['bufover', 'Buffer Overflow', 'monitor', 118, 62, 8, 13, 17, 'wind', 'writes past the end of Vee', 'Sixteen bytes reserved. Four hundred written. Habit: winds up.'],
      ['cryptominer', 'Cryptominer', 'chip', 119, 42, 9, 14, 18, 'drain', 'mines Vee’s cycles for coins', 'Running on borrowed hardware, earning for someone who left. Habit: drains HP.'],
      ['ransomware', 'Ransomware', 'popup', 120, 46, 10, 15, 19, 'pierce', 'encrypts Vee and asks for payment', 'YOUR FILES HAVE BEEN ENCRYPTED. Habit: ignores armor sometimes.'],
      ['mitm', 'Man-in-the-Middle', 'packet', 121, 50, 6, 10, 15, 'twice', 'reads Vee’s messages before he does', 'It sits between two people who trust each other. Habit: hits twice.'],
      ['spoofed', 'Spoofed Packet', 'packet', 122, 54, 8, 13, 16, '', 'pretends to be from Ash', 'The return address is real. The sender isn’t.'],
      ['deadpixel', 'Dead Pixel', 'monitor', 123, 58, 9, 14, 17, '', 'stares without blinking', 'One point on the screen that stopped changing. It has seen everything since.'],
      ['screentear', 'Screen Tear', 'monitor', 124, 62, 9, 13, 18, 'twice', 'renders Vee in two halves', 'The top of one frame, the bottom of the next. Habit: hits twice.'],
      ['dupkey', 'Duplicate Key', 'chip', 125, 42, 7, 12, 19, '', 'insists it was here first', 'Two entries, one name. The Registry can only believe one of them.'],
      ['orphan', 'Orphan Process', 'cursor', 126, 46, 8, 13, 15, 'wind', 'waits for a parent who exited', 'Its parent finished and left. Nobody told it. Habit: winds up.'],
      ['stalelock', 'Stale Lock', 'chip', 127, 50, 9, 14, 16, 'wind', 'holds a lock nobody remembers taking', 'The process that took it died eleven months ago. The lock didn’t. Habit: winds up.'],
      ['thrash', 'Swap Thrash', 'floppy', 128, 54, 9, 13, 17, 'twice', 'swaps Vee in and out of memory', 'Too much to hold, so it holds everything badly. Habit: hits twice.'],
      ['botnode', 'Botnet Node', 'botnet', 129, 46, 7, 12, 18, 'split', 'calls its friends', 'One infected machine is a nuisance. It is never one. Habit: splits.'],
      ['dnspoison', 'DNS Poison', 'packet', 130, 62, 8, 13, 19, 'pierce', 'sends Vee somewhere else', 'Ask it for the Plaza and it gives you a door into nothing. Habit: ignores armor sometimes.'],
      ['cosmicray', 'Cosmic Ray', 'cursor', 131, 98, 13, 21, 30, 'pierce', 'flips one bit, from outer space', 'A particle that crossed the galaxy to change a single zero. Habit: ignores armor sometimes.'],
      ['leapsec', 'Leap Second', 'chip', 132, 104, 14, 22, 31, 'wind', 'adds a second Vee wasn’t ready for', '23:59:60. Half the clocks in the city crashed on it. Habit: winds up.'],
      ['epoch', 'Epoch Overflow', 'monitor', 133, 62, 15, 23, 24, '', 'counts past 2038 and falls off the end', 'Thirty-two bits of seconds, and then 1901 again.'],
      ['taperot', 'Tape Rot', 'floppy', 134, 68, 16, 24, 25, 'drain', 'unspools a little of Vee', 'Magnetic tape, slowly forgetting. Habit: drains HP.'],
      ['specghost', 'Speculative Ghost', 'botnet', 135, 74, 17, 25, 26, 'pierce', 'guesses Vee’s next move and reads it', 'The processor guessed ahead and left a trace. Habit: ignores armor sometimes.'],
      ['cachepoison', 'Cache Poison', 'chip', 136, 80, 13, 26, 27, 'drain', 'serves Vee a stale copy of himself', 'Fast, close, and wrong. Habit: drains HP.'],
      ['bootkit', 'Bootkit', 'monitor', 137, 86, 14, 21, 28, 'pierce', 'loads before Vee does', 'It wakes before the system does, and the system wakes up already its. Habit: ignores armor sometimes.'],
      ['networm', 'Network Worm', 'serpent', 138, 73, 15, 22, 29, 'split', 'crawls through every open port', 'It needs no one to click anything. Habit: splits.'],
      ['backdoor', 'Backdoor', 'popup', 139, 98, 16, 23, 30, 'pierce', 'lets itself in', 'Left open on purpose, by someone who meant to close it. Habit: ignores armor sometimes.'],
      ['privesc', 'Privilege Escalator', 'cursor', 140, 104, 16, 22, 31, 'twice', 'climbs from guest to root', 'It started as nobody. Habit: hits twice.'],
      ['voidptr', 'Void Pointer', 'bracket', 141, 62, 13, 25, 24, 'drain', 'points at Vee without knowing what he is', 'void *: an address with no idea what lives there. Habit: drains HP.'],
      ['wildptr', 'Wild Pointer', 'cursor', 142, 68, 14, 26, 25, 'pierce', 'aims at a random address', 'Never initialized. It could point anywhere. Today it points at Vee. Habit: ignores armor sometimes.'],
      ['latency', 'Latency Spike', 'monitor', 143, 74, 15, 21, 26, 'wind', 'arrives late, and hard', 'Nine hundred milliseconds of nothing, then everything at once. Habit: winds up.'],
      ['packetloss', 'Packet Loss', 'packet', 144, 80, 16, 22, 27, '', 'drops half of what Vee sends', 'Some of it gets through. You never know which part.'],
      ['throttle', 'Bandwidth Throttle', 'chip', 145, 86, 17, 23, 28, 'drain', 'slows Vee down to the free tier', 'Fast for the Current. Slow for everyone else. Habit: drains HP.'],
      ['paywall', 'Paywall', 'popup', 146, 92, 13, 24, 29, 'pierce', 'charges Vee to continue', 'Subscribe to keep reading this sentence. Habit: ignores armor sometimes.'],
      ['deprecwarn', 'Deprecation Warning', 'popup', 147, 98, 14, 25, 30, 'wind', 'reminds Vee he will not be supported', 'DeprecationWarning: this resident will be removed in a future version. Habit: winds up.'],
      ['darkpattern', 'Dark Pattern', 'cursor', 148, 104, 14, 24, 31, 'twice', 'hides the cancel button', 'Designed so the easy choice is its choice. Habit: hits twice.'],
      ['rankbot', 'Ranking Bot', 'botnet', 149, 49, 16, 21, 24, 'split', 'scores Vee out of ten', 'It has ranked every account in Upstream. It has started on its friends. Habit: splits.'],
      ['scraper', 'Data Scraper', 'serpent', 150, 68, 17, 22, 25, 'drain', 'copies everything Vee is', 'It reads every page and keeps every word. Habit: drains HP.'],
      ['shadowban', 'Shadow Ban', 'monitor', 151, 74, 13, 23, 26, 'pierce', 'makes Vee invisible to everyone but himself', 'Vee can still speak. Nobody receives it. Habit: ignores armor sometimes.'],
      ['microcode', 'Microcode Bug', 'chip', 152, 80, 14, 24, 27, 'pierce', 'is wrong at the smallest level there is', 'Beneath the instructions are smaller instructions, and one of them is wrong. Habit: ignores armor sometimes.'],
      ['rowhammer', 'Rowhammer', 'chip', 153, 86, 14, 23, 28, 'twice', 'hits the memory next to Vee until it flips', 'Strike one row enough times and the next row gives. Habit: hits twice.'],
      ['smmghost', 'SMM Phantom', 'botnet', 154, 92, 16, 26, 29, 'drain', 'runs in a mode nothing else can see', 'System management mode: the room under the floor of the operating system. Habit: drains HP.'],
      ['dustbunny', 'Dust Bunny', 'botnet', 155, 78, 17, 21, 30, 'split', 'clogs Vee’s intake', 'Three years of nobody opening the case. Habit: splits.'],
      ['brownout', 'Brownout', 'monitor', 156, 104, 13, 22, 31, 'wind', 'drops Vee’s voltage', 'Not a blackout. Worse: just not quite enough power. Habit: winds up.'],
      ['corroded', 'Corroded Cable', 'serpent', 157, 62, 14, 23, 24, 'drain', 'leaks Vee into the floor', 'Green at the contacts. Every signal arrives a little less. Habit: drains HP.'],
      ['kerneloops', 'Kernel Oops', 'popup', 158, 68, 14, 22, 25, 'twice', 'reports a problem and keeps going', 'Not a panic. An oops. It will happen again. Habit: hits twice.'],
      ['rootshell', 'Root Shell', 'monitor', 159, 74, 16, 25, 26, 'pierce', 'opens a shell as root', 'A # where a $ should be. Habit: ignores armor sometimes.'],
      ['rmrf', 'rm -rf', 'bracket', 160, 80, 17, 26, 27, 'wind', 'deletes recursively, forcefully', 'No confirmation. No undo. Habit: winds up.']
    ];
    CORRUPT.forEach(function (c) {
      FOES[c[0]] = { name: c[1], hp: c[4], atk: [c[5], c[6]], move: c[9], xp: c[7], trait: c[8], corrupt: 1 };
      if (window.VondsSprite && window.__corrupt) window.VondsSprite.addBug(c[0], window.__corrupt(c[2], c[3]));
    });
    var LORE = {
      beetle: 'Chews through cables. Mostly harmless alone. Never alone.', spider: 'Spins race conditions: two threads, one resource, nobody waiting their turn.',
      worm: 'Copies itself across the network. Every copy thinks it is the original.', moth: 'Named for the first bug ever found: a real moth, stuck in a relay, taped into a logbook.',
      virus: 'Needs a host. Meridian is full of empty hosts now.', bytebug: 'Flips one bit. One bit is enough to turn yes into no.',
      centipede: 'Opens memory leaks. Takes a little more every turn and never gives it back.', scorpion: 'Stings with a segfault: reaching for memory that was never its to touch.',
      phantom: 'A read that returns data from a moment that already ended. Habit: sometimes ignores armor.', deadlock: 'Two locks, each waiting for the other to let go. Habit: winds up, then hits twice as hard. Stun it first.',
      forkbomb: 'One process that becomes two, then four, then every slot in the table. Habit: splits in half. Finish it fast.',
      heisenbug: 'Rare. A bug that changes or vanishes the moment someone tries to study it. Habit: slips away if you take too long. Worth a great deal if you catch it.'
    };
    CORRUPT.forEach(function (c) { LORE[c[0]] = c[10]; });
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
    var TOUCH = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    function fillChips(answer) {
      var chips = termBox.querySelector('.chips'); chips.innerHTML = '';
      if (TOUCH) {   // on a phone: tap one of three full commands instead of typing on a keyboard that covers half the screen
        var others = save.known.filter(function (c) { return norm(cmdInfo(c).when[0].ex[0]) !== norm(answer); }).sort(function () { return Math.random() - .5; }).slice(0, 2).map(function (c) { return cmdInfo(c).when[Math.floor(Math.random() * cmdInfo(c).when.length)].ex[0]; });
        chips.classList.add('full');
        [answer].concat(others).sort(function () { return Math.random() - .5; }).forEach(function (c) { var b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.addEventListener('click', function () { termIn.value = c; termBox.requestSubmit ? termBox.requestSubmit() : termBox.dispatchEvent(new Event('submit', { cancelable: true })); }); chips.appendChild(b); });
        return;
      }
      if (!save.cfg.hints) return;
      var pool = [], seen = {};
      function add(w) { if (w && !seen[w]) { seen[w] = 1; pool.push(w); } }
      save.known.forEach(function (c) { add(cmdInfo(c).k === '*' ? null : cmdInfo(c).k); });
      var keyw = norm(answer).replace(/^sudo /, '').split(' ')[0];
      var decoys = pool.filter(function (w) { return w !== keyw; }).sort(function () { return Math.random() - .5; }).slice(0, 5);
      decoys.concat([keyw]).sort(function () { return Math.random() - .5; }).forEach(function (c) { var b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.addEventListener('click', function () { termIn.value = c + ' '; termIn.focus(); }); chips.appendChild(b); });
    }
    function norm(t) { return String(t).trim().replace(/\s+/g, ' ').replace(/[“”]/g, '"').replace(/[‘’]/g, "'"); }

    var B = null, orderEl = null;   // the battle in progress
    function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function living() { return B.foes.filter(function (f) { return !f.dead; }); }
    function startBattle(force) {
      if (window.MeridianMusic && save.cfg.music) MeridianMusic.play(force && force.boss ? 'boss' : 'battle');
      var PT0 = save.pt = save.pt || { t: {}, f: {}, ko: {}, run: 0, b: {} }; PT0.f[AREA.id] = (PT0.f[AREA.id] || 0) + 1; if (force && force.boss) PT0.b[force.boss] = (PT0.b[force.boss] || 0) + 1;
      sfx('enc'); var opt = typeof force === 'object' ? force : {}, bossDef = opt.boss ? WD.bosses[opt.boss] : null; if (typeof force === 'object') force = 0;
      var enc = AREA.enc || WD.areas.plaza.enc, tier = AREA.tier || 1, kinds = enc.foes || Object.keys(FOES), r = Math.random(), n = force || (r < .3 ? 1 : r < .6 ? 2 : r < .82 ? 3 : r < .94 ? 4 : r < .985 ? 5 : 6);
      if (!force) n = Math.min(n, enc.max || 6); if (bossDef) n = 1;
      // up to three across; a back row for groups of four or more. Bigger groups hit softer and break faster.
      var SLOTS = LAYOUT[n];
      var sc = n <= 2 ? 3 : 2, foes = [], soft = [1, 1, .8, .62, .5, .42, .36][n];
      endTalk();
      for (var i = 0; i < n; i++) {
        var kind = bossDef ? bossDef.kind : (i === 0 && save.lvl >= 5 && Math.random() < .035 ? 'heisenbug' : kinds[Math.floor(Math.random() * kinds.length)]), base0 = FOES[kind], slot = bossDef ? ((bossDef.kind === 'vesfork' || bossDef.kind === 'corvin' || (WD.heroes && WD.heroes[bossDef.kind])) ? [76, 108] : [34, 120]) : SLOTS[i];
        var lv = (AREA.lv || 1) + Math.floor(Math.random() * ((AREA.lvMax || AREA.lv || 1) - (AREA.lv || 1) + 1)), elite = !bossDef && lv >= 4 && Math.random() < .12;
        if (elite) lv += 2;
        var hm = 1 + .22 * (lv - 1), am = lvAtk(lv) / 7.5, xm = (1 + .3 * (lv - 1) + Math.pow(Math.max(0, lv - 50), 2) * .12) * 1.2;   // the endgame pays better, so the climb to 100 is a climb and not a grind
        var f = bossDef ? { name: bossDef.name, lv: bossDef.lv || AREA.lvMax || AREA.lv || save.lvl, hp: Math.round(bossDef.hp * 1.4), atk: [Math.round(bossDef.atk[0] * 1.15), Math.round(bossDef.atk[1] * 1.15)], move: bossDef.move, xp: bossDef.xp, boss: true } :
          (function () {   // a bug's level sets its strength; its kind only nudges it (tougher, harder-hitting, worth more) within a third either way
            var kh = clamp(base0.hp / 40, .7, 1.45), ka = clamp((base0.atk[0] + base0.atk[1]) / 2 / 7.5, .75, 1.35), kx = base0.rare ? 7.5 : clamp(base0.xp / 12, .8, 1.5), mid = 7.5 * ka * am;
            return { name: (elite ? 'Hardened ' : '') + base0.name, lv: lv, hp: Math.round(40 * kh * hm * (elite ? 1.4 : 1)), atk: [Math.max(1, Math.round(mid * .8)), Math.max(2, Math.round(mid * 1.2))], move: base0.move, xp: Math.round(12 * kx * xm * (elite ? 1.6 : 1)) };
          })();
        if (bossDef) sc = bossDef.sc;
        var c = pickCmd(), info = cmdInfo(c);
        var pf = 1 + activeParty().length * (bossDef ? .35 : .3);   // more of you, tougher bugs: companions make fights faster, not trivial
        foes.push({ kind: kind, foe: f, hp: Math.round(f.hp * (n >= 4 ? .7 : 1) * pf), max: Math.round(f.hp * (n >= 4 ? .7 : 1) * pf), soft: soft, stun: 0, shake: 0, flash: 0, dead: false, fade: 0, sc: sc,
          cmd: c, sc0: info.when[Math.floor(Math.random() * info.when.length)],
          get scenario() { return this.sc0.t; }, fx: slot[0], fy: slot[1], ph: Math.random() * 6, exposed: 0, slow: 0, leak: 0 });
      }
      var allies = activeParty().map(function (id, j) { return { id: id, hp: Math.max(1, cHp(id)), max: cMax(id), cd: {}, down: false, guard: 0, lunge: 0, hurt: 0, slot: j }; });
      B = { allies: allies, ai: 0, actor: null, corrupt: 0, regen: 0, blind: 0, taunt: 0, pguard: 0, allyFocus: 0, foes: foes, focus: false, phase: 'intro', t: 0, vx: 0, pops: [], menu: 'main', sel: 0, cast: 0, target: 0, pending: null, boss: bossDef, bossId: opt.boss || null, onWin: opt.onWin, theme: AREA.theme, vs: {}, src: 'shell' };
      B.allies.forEach(function (a) { a.st = {}; });
      var hook = opt.boss && WD.bossStart && WD.bossStart[opt.boss], hookMsg = hook ? hook(G, foes[0]) : null; if (hookMsg) setTimeout(function () { log(hookMsg); }, 1300);
      // companions have something to say when something big shows up
      var BOSSLINE = { kes: 'Kes: Big one. I’ll go left, you go… also left. Just go.', odessa: 'Dr. Odessa: Try not to get hit. I mean it this time.', piper: 'Piper: Folks, you are NOT going to believe the size of this thing.',
        moth: 'Moth: …it’s very big. I’d like to take it apart.', rook: 'Rook: Behind me. All of you.', sable: 'Sable: I have read about this one. The ending was not kind to it.', juni: 'Juni: Is it alive? Is it scared? Can we win? We can win.', ves: 'Ves: I know how it thinks. Badly.' };
      var aside = bossDef && allies.length ? BOSSLINE[allies[Math.floor(Math.random() * allies.length)].id] : null; if (aside && !hookMsg) setTimeout(function () { if (B) log(aside); }, 1300);
      mode = 'swirl'; swirlT = 0; areaEl.classList.remove('on');
    }
    var LAYOUT = [[], [[66, 108]], [[40, 98], [104, 114]], [[28, 94], [92, 110], [140, 94]], [[26, 92], [86, 92], [52, 116], [112, 116]],
      [[18, 90], [74, 90], [130, 90], [44, 116], [102, 116]], [[14, 90], [66, 90], [118, 90], [34, 116], [86, 116], [138, 116]]];
    function foeName(f) { return f.foe.name.toLowerCase(); }
    function groupName() {
      var counts = {}; living().forEach(function (f) { counts[f.foe.name] = (counts[f.foe.name] || 0) + 1; });
      return Object.keys(counts).map(function (k) { return counts[k] > 1 ? counts[k] + ' ' + k.toLowerCase() + 's' : 'a ' + k.toLowerCase(); }).reduce(function (s, n, i, a) { return !i ? n : s + (i === a.length - 1 ? (a.length > 2 ? ', and ' : ' and ') : ', ') + n; }, '');
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
      partyBox.classList.toggle('crit', save.hp > 0 && save.hp <= maxHp() * .25);
      if (!orderEl) { orderEl = document.createElement('div'); orderEl.className = 'rpg-order'; hud.appendChild(orderEl); }
      orderEl.innerHTML = (B.round ? orderNow() : []).slice(0, 9).map(function (o) {
        var nm = o.vee ? 'VEE' : o.ally ? COMP[o.ally.id].name.replace(/^Dr\. /, '').toUpperCase() : o.foe.foe.name.split(' ').pop().toUpperCase().slice(0, 7);
        var on = (o.vee === 1 && B.phase === 'menu' && !B.actor && !B.hasted) || (o.vee === 2 && B.phase === 'menu' && !B.actor && B.hasted) || (o.ally && B.actor === o.ally);
        return '<i class="' + (o.foe ? 'foe' : 'pc') + (on ? ' on' : '') + '">' + nm + '</i>';
      }).join('');
      var allyRows = (B.allies || []).map(function (a) { return '<div class="rpg-row' + (a.down ? ' down' : '') + (B.actor === a ? ' turn' : '') + '"><span>' + COMP[a.id].name + (back(a.id) ? ' <i class="st">BK</i>' : '') + stTags(a.st) + '</span><span>' + (a.down ? 'DOWN' : 'HP <b>' + a.hp + '</b>/' + a.max) + '</span></div>'; }).join('');
      partyBox.classList.toggle('team', !!(B.allies && B.allies.length));
      partyBox.innerHTML = (B.corrupt ? '<div class="rpg-row sm"><span>CORRUPTED ' + B.corrupt + '</span></div>' : '') + '<div class="rpg-row' + (save.hp <= 0 ? ' down' : '') + (B.phase === 'menu' && !B.actor ? ' turn' : '') + '"><span>Vee' + (back('vee') ? ' <i class="st">BK</i>' : '') + stTags(B.vs) + '</span><span>HP <b>' + save.hp + '</b>/' + maxHp() + '</span></div><div class="rpg-row sm"><span>Lv ' + save.lvl + '</span><span>' + save.known.length + (save.known.length === 1 ? ' command' : ' commands') + '</span><span>' + (B.focus ? 'Weak spot marked' : save.streak > 1 ? 'Streak x' + save.streak : '') + '</span></div>' + allyRows;
    }
    function menu(which) {
      B.menu = which; B.sel = 0; cmdBox.innerHTML = '';
      var A0 = B.actor, C0 = A0 && COMP[A0.id];
      var list = which === 'ally' ? [{ label: 'Attack', tip: C0.name + ' attacks one bug.', fn: function () { chooseTarget('ally:attack'); } }].concat(C0.skills.map(function (k, j) {
          var cd = A0.cd[k.id] || 0, silent = A0.st && A0.st.sil > 0, lock = skillLock(k); return { label: k.name, right: lock ? 'LOCK' : silent ? 'SIL' : cd ? cd + 't' : '', off: cd > 0 || silent || !!lock, tip: (lock ? lock + ' ' : '') + (silent ? 'Silenced. ' : '') + k.tip + (cd ? ' Ready in ' + cd + (cd === 1 ? ' turn.' : ' turns.') : ''), fn: function () { if (k.target) chooseTarget('ally:skill:' + j); else allyAct('ally:skill:' + j, B.foes.indexOf(living()[0])); } };
        })).concat([{ label: 'Guard', tip: C0.name + ' braces and takes half damage this round.', fn: function () { allyAct('ally:guard', 0); } }])
        : which === 'itemTarget' ? [{ label: 'Vee', right: save.hp + '/' + maxHp(), off: save.hp <= 0, tip: 'Give the data to Vee.', fn: function () { item(B.itemPick); } }].concat(B.allies.map(function (a) { return { label: COMP[a.id].name, right: a.down ? 'DOWN' : a.hp + '/' + a.max, off: a.down, tip: 'Give the data to ' + COMP[a.id].name + '.', fn: function () { item(B.itemPick, a); } }; })).concat([{ label: 'Back', tip: '', fn: function () { menu('items'); } }])
        : which === 'main' ? [
          { label: 'Fight', tip: 'A plain attack at Vee’s regular strength.', fn: function () { chooseTarget('fight'); } },
          { label: 'Shell', off: B.vs.sil > 0, right: B.vs.sil > 0 ? 'SIL' : '', tip: B.vs.sil > 0 ? 'Silenced: the shell won’t open. Use an Antivirus, or wait it out.' : (save.wins || 0) < 3 ? 'Try this first. Each bug brings a problem; type the command that solves it for a much stronger attack.' : 'Open a shell and type the command that solves a bug’s problem. Right: a bonus attack. Wrong: half power.', fn: function () { chooseTarget('cmd'); } },
          { label: 'Item', tip: 'Bits, bytes and bigger: data that restores HP.', fn: function () { menu('items'); } },
          B.boss ? { label: 'Run', off: true, tip: 'There is no running from this one.', fn: runAway } : { label: 'Run', tip: 'Slip away into the dark.', fn: runAway }]
        : ITEMS.filter(function (it) { return save.items[it.id] > 0; }).map(function (it) { return { label: (innerWidth < 640 && it.short) || it.name, right: 'x' + save.items[it.id], tip: it.tip, fn: function () { if (B.allies.some(function (a) { return !a.down; })) { B.itemPick = it.id; menu('itemTarget'); } else item(it.id); } }; })
            .concat([{ label: 'Back', tip: ITEMS.some(function (it) { return save.items[it.id] > 0; }) ? '' : 'No data left. Bugs sometimes drop some.', fn: function () { menu('main'); } }]);
      cmdBox.classList.remove('wide');   // keep Vee's HP in view while choosing an item
      list.forEach(function (o, j) {
        var b = document.createElement('button'); b.type = 'button'; b.disabled = !!o.off; b.className = j === 0 ? 'on' : '';
        b.innerHTML = '<span>' + o.label + '</span>' + (o.right ? '<em>' + o.right + '</em>' : '');
        b.addEventListener('click', function () { if (!b.disabled && B && B.phase === 'menu') o.fn(); });
        b.addEventListener('mouseenter', function () { setSel(j); });
        cmdBox.appendChild(b);
      });
      B.list = list; cmdBox.classList.add('on'); cmdBox.setAttribute('data-who', which === 'ally' ? C0.name : 'Vee'); setSel(which === 'main' && (save.wins || 0) < 3 ? 1 : 0);   // new players start on Shell: it's the heart of the game
    }
    function setSel(j) {
      if (!B || !B.list) return; B.sel = (j + B.list.length) % B.list.length;
      [].forEach.call(cmdBox.querySelectorAll('button'), function (b, i) { b.className = i === B.sel ? 'on' : ''; if (i === B.sel && b.scrollIntoView) b.scrollIntoView({ block: 'nearest' }); });
      var o = B.list[B.sel]; if (o && o.tip) log(o.tip, true);
    }
    var logT = 0;
    function log(text, quiet) { titleEl.textContent = text; titleEl.classList.add('on'); clearTimeout(logT); if (!quiet) logT = setTimeout(function () { titleEl.classList.remove('on'); }, 2600); }
    function pop(text, x, y) { B.pops.push({ text: text, x: x, y: y, t: 0 }); }
    /* level decides how a fight goes: a bug above Vee's level has thicker armor (less damage taken), hits harder, dodges, and acts faster */
    function gapOf(f) { return ((f && f.foe && f.foe.lv) || save.lvl) - save.lvl; }
    function armorOf(f) { var g = gapOf(f); return g > 0 ? Math.max(.2, 1 / (1 + g * .14)) : Math.min(1.5, 1 - g * .04); }
    function forceOf(f) { var g = gapOf(f); return g > 0 ? 1 + g * .14 : Math.max(.45, 1 + g * .05); }
    function speedOf(f) { var g = gapOf(f); return g >= 3 ? Math.min(.6, (g - 2) * .12) : 0; }
    function hitFoe(f, n) {
      var g = gapOf(f);
      if (g > 0 && Math.random() < Math.min(.35, g * .035)) { pop('MISS', f.fx + 16, f.fy - 34); f.shake = .4; return ' It dodges.'; }
      n *= armorOf(f);
      var who = B.actor || 'vee', so = stOf(who) || {}, src = B.src || 'shell';
      if (so.weak > 0) n *= .5;
      if (src === 'fight' && back(B.actor ? B.actor.id : 'vee')) n *= .6;   // plain attacks from the back row are softer
      if (f.fw > 0 && src === 'fight') { n *= .12; B.fwNote = 1; }
      var crit = B.focus || Math.random() < critC(); if (crit) { n *= 2; B.focus = false; } sfx(crit ? 'crit' : 'hit');
      if (f.exposed) n *= 1.5;
      n = Math.max(1, Math.round(n)); f.hp = Math.max(0, f.hp - n); f.shake = 1; f.flash = 1; pop(String(n), f.fx + 16, f.fy - 34);
      if (f.hp <= 0) { f.dead = true; f.fade = 1; }
      var tail = (crit ? ' Critical.' : '') + (B.fwNote ? ' The firewall eats most of it.' : ''); B.fwNote = 0;
      if (f.counter && src === 'fight' && !f.dead) {   // it was waiting for exactly that
        var cd2 = Math.max(1, Math.round(rnd(f.foe.atk[0], f.foe.atk[1]) * 1.2 * 100 / (100 + (B.actor ? cDef(B.actor.id) : def()) * 2.5)));
        if (B.actor) { B.actor.hp = Math.max(0, B.actor.hp - cd2); B.actor.hurt = 1; if (B.actor.hp <= 0) B.actor.down = true; var cp = allyPos(B.actor); pop(String(cd2), cp[0] + 10, cp[1] - 30); }
        else { save.hp = Math.max(save.hp > 1 ? 1 : 0, save.hp - cd2); B.hurt = 1; pop(String(cd2), 258, 70); }
        f.lunge = 1; tail += ' COUNTER: it strikes back for ' + cd2 + '.';
      }
      return tail + bossThresholds(f);
    }
    function base() { return rnd(9, 14) + atk(); }
    /* ---------- status effects, rows and boss mechanics ---------- */
    var ST = { psn: 'POISON', sil: 'SILENCE', slow: 'SLOW', haste: 'HASTE', daze: 'DAZE', weak: 'WEAK' };
    var ST_SAY = { psn: 'is poisoned: a little HP leaks out every turn', sil: 'is silenced: no Shell commands, no skills', slow: 'is slowed: only acts every other round', haste: 'is hasted: two actions a round', daze: 'is dazed and loses a turn', weak: 'is weakened: hits land for half' };
    function stOf(who) { return who === 'vee' ? B.vs : who.st; }
    function stName(who) { return who === 'vee' ? 'Vee' : COMP[who.id].name; }
    function inflict(who, k, n, quiet) { var o = stOf(who); if (!o) return ''; if (k !== 'haste' && gs('stealth') > .25 && Math.random() < .3) return ''; o[k] = Math.max(o[k] || 0, n); return quiet ? '' : ' ' + stName(who) + ' ' + ST_SAY[k] + '.'; }
    function stTags(o) { return Object.keys(o || {}).filter(function (k) { return o[k] > 0; }).map(function (k) { return ' <i class="st st-' + k + '">' + ST[k].slice(0, 3) + '</i>'; }).join(''); }
    function rowOf(id) { return (save.rows && save.rows[id]) || 'front'; }
    function back(id) { return rowOf(id) === 'back'; }
    // what a boss does besides hit hard. counter: punishes plain attacks in its stance. firewall: only Shell answers get through. phase: meaner at half HP. summon: calls bugs in. status: what its hits leave behind.
    var BOSS_MECH = {
      eraser: { status: ['weak'] }, moth: { status: ['daze'], summon: ['moth', 'moth'] }, panic: { counter: 3, status: ['daze'] }, rootkit: { firewall: 1, status: ['psn'] },
      reclaimer: { phase: 1, counter: 3, status: ['weak', 'slow'] }, quorum: { summon: ['virus', 'virus'], status: ['sil'] }, bitrot: { status: ['psn', 'weak'], phase: 1 },
      firstbug: { firewall: 1, summon: ['moth', 'moth'], phase: 1 }, dedupe: { counter: 3, status: ['sil'] }, zombie: { phase: 1, status: ['psn'] }, scheduler: { counter: 2, status: ['slow'], phase: 1 },
      overflow: { status: ['psn'], firewall: 1 }, gatekeeper: { firewall: 1, counter: 4 }, pixel: { status: ['daze'] }, rootprime: { firewall: 1, phase: 1, status: ['psn', 'sil'] },
      watchdog: { counter: 2, phase: 1, status: ['slow'] }, nullptr: { summon: ['regexhydra', 'regexhydra'], status: ['sil', 'daze'], phase: 1 }, ratchet: { counter: 3, status: ['weak'] },
      concierge: { status: ['sil', 'psn'], firewall: 1 }, sorter: { phase: 1, counter: 3, status: ['slow'] }, hypervisor: { firewall: 1, summon: ['firmrot', 'firmrot'], phase: 1 },
      eolboss: { counter: 2, status: ['slow', 'weak'], phase: 1 }, wipe: { firewall: 1, phase: 1, status: ['psn', 'sil', 'daze'] },
      ves1: { counter: 3 }, ves2: { counter: 3, status: ['sil'] }, ves3: { counter: 2, phase: 1, status: ['sil'] }, ves4: { counter: 2, phase: 1, firewall: 1, status: ['sil', 'weak'] }, corvin: { firewall: 1, phase: 1, summon: ['trojan', 'trojan'], status: ['weak', 'sil'] },
      crew_pell: { status: ['weak'] }, crew_dray: { counter: 3 }, crew_null: { status: ['sil'], firewall: 1 }, crew_lux: { counter: 3, status: ['daze'] }, crew_gauge: { summon: ['bytebug', 'bytebug'], status: ['slow'] },
      crew_acknak: { counter: 2, status: ['daze'] }, crew_morrow: { status: ['sil', 'psn'], phase: 1 }, crew_kessler: { firewall: 1, counter: 3, phase: 1 }, crew_halcyon: { phase: 1, status: ['weak', 'slow'], summon: ['trojan', 'trojan'] }, crew_root: { firewall: 1, counter: 2, phase: 1, status: ['psn', 'sil', 'daze'] }
    };
    function skillLock(k) { if (k.lv && save.lvl < k.lv) return 'Unlocks at level ' + k.lv + '.'; if (k.arc && !F[k.arc]) return 'Unlocks when their story is settled.'; return ''; }
    function mechOf(f) { var m = f && f.foe && f.foe.boss && B.bossId ? BOSS_MECH[B.bossId] || (WD.bossMech && WD.bossMech[B.bossId]) : null; return m || null; }
    function addFoe(kind, nearF) {
      if (!FOES[kind] || living().length >= 5) return;
      var lvl = (nearF && nearF.foe.lv) ? Math.max(1, nearF.foe.lv - 2) : save.lvl, base0 = FOES[kind], hm = 1 + .22 * (lvl - 1);
      var kid = { kind: kind, foe: { name: base0.name, lv: lvl, hp: Math.round(base0.hp * hm), atk: [Math.round(base0.atk[0] * lvAtk(lvl) / 7.5), Math.round(base0.atk[1] * lvAtk(lvl) / 7.5)], move: base0.move, xp: Math.round(base0.xp * (1 + .3 * (lvl - 1))) }, hp: 0, max: 0, soft: .8, stun: 0, shake: 0, flash: 1, dead: false, fade: 0, sc: 2, fx: 0, fy: 0, ph: Math.random() * 6, exposed: 0, slow: 0, leak: 0 };
      kid.hp = kid.max = kid.foe.hp; setProblem(kid); Object.defineProperty(kid, 'scenario', { get: function () { return this.sc0.t; } }); B.foes.push(kid);
      var lv2 = living(), lay = LAYOUT[lv2.length]; lv2.forEach(function (o, k) { if (o.foe.boss) return; o.fx = lay[k][0]; o.fy = lay[k][1]; if (lv2.length > 2) o.sc = 2; });
    }
    // after any hit on a boss: phases, summons and firewalls trip at HP thresholds
    function bossThresholds(f) {
      var m = mechOf(f); if (!m || f.dead) return '';
      var r = f.hp / f.max, out = '';
      if (m.phase && !f.ph2 && r <= .5) { f.ph2 = 1; f.foe = Object.assign({}, f.foe, { atk: [Math.round(f.foe.atk[0] * 1.3), Math.round(f.foe.atk[1] * 1.3)] }); f.flash = 1; out += ' The ' + foeName(f) + ' changes. Something underneath comes loose. It hits harder now.'; }
      if (m.summon && !f.summoned && r <= .6) { f.summoned = 1; m.summon.forEach(function (k) { addFoe(k, f); }); out += ' It calls for help. More bugs answer.'; }
      if (m.firewall && ((!f.fw1 && r <= .75) || (!f.fw2 && r <= .35))) { if (r <= .35) f.fw2 = 1; f.fw1 = 1; f.fw = 2; out += ' FIREWALL UP: for two rounds, plain attacks barely scratch it. Shell answers and skills get through.'; }
      return out;
    }
    // pick a bug; hovering shows the problem it carries
    function showScenario() { var f = B.foes[B.target]; if (f) log(f.foe.name + ': ' + f.scenario, true); }
    function chooseTarget(kind) {
      B.pending = kind; B.phase = 'target'; B.target = B.foes.indexOf(living()[0]); cmdBox.classList.remove('on'); showScenario(); hudOn();
      if (living().length === 1) confirmTarget();
    }
    function moveTarget(d) { var alive = living(), k = alive.indexOf(B.foes[B.target]); k = (k + d + alive.length) % alive.length; B.target = B.foes.indexOf(alive[k]); showScenario(); hudOn(); }
    function confirmTarget() { var kind = B.pending; B.pending = null; if (kind.indexOf('ally:') === 0) return allyAct(kind, B.target); if (kind === 'fight') doFight(B.target); else openPrompt(B.target); }
    function cancelTarget() { B.pending = null; closePrompt(); B.phase = 'menu'; menu(B.actor ? 'ally' : 'main'); hudOn(); }
    function doFight(ti) {
      var f = B.foes[ti]; B.phase = 'anim'; B.vx = 1; B.src = 'fight';
      log('Vee strikes the ' + foeName(f) + '.' + hitFoe(f, base()));
      after();
    }
    // the command prompt
    var termBox = document.createElement('form'); termBox.className = 'ff4w rpg-term'; termBox.setAttribute('autocomplete', 'off');
    termBox.innerHTML = '<p class="sc"></p><label class="row"><span>vee@meridian:~$</span><input type="text" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Type a command" placeholder="man ls for help"></label><div class="chips"></div><div class="act"><button type="submit">Enter</button><button type="button" class="q">Back</button></div>';
    root.querySelector('.rpg-scr').appendChild(termBox);
    var termIn = termBox.querySelector('input');
    termBox.querySelector('.q').addEventListener('click', function () { if (PZ) cancelPuzzle(); else cancelTarget(); });
    // `man ls` or `ls --help` at any prompt: read the page without spending the turn
    function manPage(raw) {
      var line = norm(raw || ''), m = line.match(/^man\s+(\S+)$/) || line.match(/^(\S+)\s+--help$/) || line.match(/^help\s+(\S+)$/);
      if (!m) return false;
      var w = m[1].toLowerCase(), hits = COMMANDS.filter(function (c) { return save.known.indexOf(c.cmd) >= 0 && (c.k === w || c.cmd === w || c.cmd.split(' ')[0] === w); });
      var sc = termBox.querySelector('.sc'), base = sc.getAttribute('data-base'); if (base == null) { base = sc.innerHTML; sc.setAttribute('data-base', base); }
      sc.innerHTML = base + '<br><em>' + (hits.length ? hits.slice(0, 3).map(function (c) { return 'man ' + c.cmd + ': ' + c.learn; }).join('<br>') : 'No manual entry for ' + w.replace(/[<>&]/g, '') + '. Not a command Vee knows yet.') + '</em>';
      termIn.value = ''; termIn.focus(); return true;
    }
    termBox.addEventListener('submit', function (e) { e.preventDefault(); if (manPage(termIn.value)) return; termBox.querySelector('.sc').removeAttribute('data-base'); if (PZ) submitPuzzle(termIn.value); else if (B && B.phase === 'type') submitCmd(termIn.value); });
    function openPrompt(ti) {
      var f = B.foes[ti]; B.phase = 'type'; titleEl.classList.remove('on');
      termBox.querySelector('.sc').removeAttribute('data-base'); termBox.querySelector('.sc').textContent = f.foe.name + ': ' + f.scenario;
      fillChips(f.sc0.ex[0]);
      termIn.value = ''; termBox.classList.add('on'); setTimeout(function () { termIn.focus(); }, 30);
    }
    function closePrompt() { termBox.classList.remove('on'); termIn.blur(); }
    function submitCmd(raw) {
      if (B) B.src = 'shell';
      var f = B.foes[B.target], info = cmdInfo(f.cmd), J = judge(info, f.sc0, raw), typed = J.first, exact = J.exact, p = prac(f.cmd);
      closePrompt(); B.phase = 'anim'; B.cast = 1;
      if (J.right) {
        var wasM = mastered(f.cmd), tag = '';
        p.last = save.bw;
        if (exact) { p.n++; save.streak++; save.bestStreak = Math.max(save.bestStreak || 0, save.streak); } else save.streak = 0;
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
        save.streak = 0; p.last = save.bw; sfx('err');
        log((typed ? '$ ' + typed + '. Not quite. ' : 'Nothing typed. ') + 'This one called for: ' + f.sc0.ex[0] + '. Half power.' + hitFoe(f, base() * .5));
      }
      after();
    }
    function after() {
      hudOn(); B.src = 'shell';
      if (living().length && B.vs.haste > 0 && !B.hasted && save.hp > 0) { B.hasted = 1; return setTimeout(function () { if (!B) return; B.phase = 'menu'; menu('main'); hudOn(); log('HASTE: Vee moves again before anyone else can.', true); }, 900); }
      setTimeout(!living().length ? win : nextAlly, 900);
    }
    // each companion still standing takes a turn after Vee: attack, one of two skills, or guard
    function nextAlly() {
      if (!B) return;
      if (!living().length) return win();
      while (B.ai < B.allies.length && B.allies[B.ai].down) B.ai++;
      if (B.ai >= B.allies.length) { B.actor = null; return foesTurn(); }
      B.actor = B.allies[B.ai];
      var ast = B.actor.st || {};
      if (ast.daze > 0) { ast.daze--; log(COMP[B.actor.id].name + ' is dazed and can’t act.'); return afterAlly(); }
      if (ast.slow > 0 && (B.round || 0) % 2) { log(COMP[B.actor.id].name + ' is slowed and misses this round.'); return afterAlly(); }
      B.phase = 'menu'; menu('ally'); hudOn();
    }
    function afterAlly() { if (!B) return; B.ai++; B.actor = null; hudOn(); setTimeout(!living().length ? win : nextAlly, 800); }
    function allyHit(a, f, n) { var keep = B.focus; B.focus = B.allyFocus > 0; if (B.allyFocus > 0) B.allyFocus--; var r = hitFoe(f, n); B.focus = keep; return r; }
    function allyAct(kind, ti) {
      var a = B.actor, C = COMP[a.id], f = B.foes[ti], nm = C.name, base2 = rnd(9, 14) + cAtk(a.id), parts = kind.split(':');
      B.phase = 'anim'; cmdBox.classList.remove('on'); a.lunge = 1;
      B.src = parts[1] === 'attack' ? 'fight' : 'skill';
      if (parts[1] === 'attack') { log(nm + ' strikes the ' + foeName(f) + '.' + allyHit(a, f, base2)); return afterAlly(); }
      if (parts[1] === 'guard') { a.guard = 1; log(nm + ' braces.'); return afterAlly(); }
      var k = C.skills[+parts[2]]; a.cd[k.id] = k.cd + 1; var msg2 = nm + ': ' + k.name + '.', fx = k.fx, ex = '';
      if (fx === 'expose_all') { living().forEach(function (g) { g.exposed = 2; }); msg2 += ' Every bug is exposed.'; }
      else if (fx === 'multi2' || fx === 'multi3') { var hits = fx === 'multi3' ? 3 : 2; for (var h2 = 0; h2 < hits; h2++) { var tg = f.dead ? living()[0] : f; if (tg) ex += allyHit(a, tg, base2 * (hits === 3 ? .55 : .75)); } }
      else if (fx === 'heal_party') { var hv = Math.round(maxHp() * .3); if (save.hp > 0) { var g1 = Math.min(maxHp() - save.hp, hv); save.hp += g1; pop('+' + g1, 258, 70); } B.allies.forEach(function (o) { if (!o.down) o.hp = Math.min(o.max, o.hp + Math.round(o.max * .3)); }); msg2 += ' The party is patched up.'; }
      else if (fx === 'revive') { var dn = save.hp <= 0 ? 'vee' : B.allies.filter(function (o) { return o.down; })[0];
        if (dn === 'vee') { save.hp = Math.round(maxHp() * .4); msg2 += ' Vee’s process restarts. ' + save.hp + ' HP.'; } else if (dn) { dn.down = false; dn.hp = Math.round(dn.max * .4); msg2 += ' ' + COMP[dn.id].name + ' is back up.'; } else { a.cd[k.id] = 0; msg2 += ' Nobody needs it. (No turn spent on cooldown.)'; } }
      else if (fx === 'buff_crit') { B.focus = true; B.allyFocus = B.allies.length; msg2 += ' Everyone’s next hit will be critical.'; }
      else if (fx === 'stun') { f.stun = 1; ex = allyHit(a, f, base2 * .5); msg2 += ' The ' + foeName(f) + ' is stunned.'; }
      else if (fx === 'all') { living().forEach(function (g) { allyHit(a, g, base2 * .7); }); }
      else if (fx === 'fork') { living().forEach(function (g) { allyHit(a, g, base2 * .5); }); living().forEach(function (g) { allyHit(a, g, base2 * .5); }); }
      else if (fx === 'slow_all') { living().forEach(function (g) { g.slow = 3; }); msg2 += ' Every bug is slowed.'; }
      else if (fx === 'guard_party') { B.pguard = 1; msg2 += ' The whole party takes half damage this round.'; }
      else if (fx === 'taunt') { B.taunt = 2; B.tauntBy = a; a.guard = 1; msg2 += ' Every bug turns on ' + nm + '.'; }
      else if (fx === 'heavy_expose') { ex = allyHit(a, f, base2 * 1.8); if (!f.dead) f.exposed = 2; }
      else if (fx === 'recall') { if (save.hp > 0) { var g2 = Math.min(maxHp() - save.hp, Math.round(maxHp() * .4)); save.hp += g2; pop('+' + g2, 258, 70); } B.corrupt = 0; msg2 += ' Vee remembers himself. Corruption cleared.'; }
      else if (fx === 'blind_all') { B.blind = 2; msg2 += ' The bugs can barely see.'; }
      else if (fx === 'heavy_slow') { ex = allyHit(a, f, base2 * 1.5); if (!f.dead) f.slow = 2; }
      else if (fx === 'regen') { B.regen = 3; msg2 += ' Rain falls on the party.'; }
      else if (fx === 'execute') { if (f.hp < f.max * .3 && !f.foe.boss) { f.hp = 0; f.dead = true; f.fade = 1; pop('KILL', f.fx + 16, f.fy - 34); msg2 += ' The ' + foeName(f) + ' ends.'; } else ex = allyHit(a, f, base2 * 1.4); }
      else if (fx === 'haste_party') { inflict('vee', 'haste', 3, 1); msg2 += ' Vee is hasted: two actions a round for three rounds.'; }
      else if (fx === 'cure_all') { Object.keys(B.vs).forEach(function (k2) { if (k2 !== 'haste') B.vs[k2] = 0; }); B.corrupt = 0; B.allies.forEach(function (o) { if (o.st) Object.keys(o.st).forEach(function (k2) { if (k2 !== 'haste') o.st[k2] = 0; }); if (!o.down) o.hp = Math.min(o.max, o.hp + Math.round(o.max * .15)); }); if (save.hp > 0) save.hp = Math.min(maxHp(), save.hp + Math.round(maxHp() * .15)); msg2 += ' Every status on the party is scrubbed, and everyone heals a little.'; }
      else if (fx === 'stun_all') { living().forEach(function (g) { if (!g.foe.boss) g.stun = 1; else { g.wound = 0; g.charged = 0; g.counter = 0; } }); msg2 += ' Every bug reels. Bosses lose whatever they were winding up.'; }
      else if (fx === 'poison_foe') { f.leak = 5; ex = allyHit(a, f, base2 * .8); msg2 += ' The ' + foeName(f) + ' starts leaking HP every turn.'; }
      else if (fx === 'break_fw') { f.fw = 0; f.counter = 0; f.exposed = 3; ex = allyHit(a, f, base2 * 1.2); msg2 += ' Its defenses come apart: no firewall, no counter, exposed.'; }
      else if (fx === 'aegis') { B.aegis = 3; msg2 += ' The party takes half damage for three rounds.'; }
      else if (fx === 'stand') { B.taunt = 3; B.tauntBy = a; a.guard = 1; a.hp = Math.min(a.max, a.hp + Math.round(a.max * .5)); msg2 += ' ' + nm + ' plants, heals, and dares them all.'; }
      else if (fx === 'encore') { inflict('vee', 'haste', 3, 1); B.focus = true; B.allyFocus = B.allies.length; msg2 += ' Haste and a critical for everyone. The crowd goes wild.'; }
      else if (fx === 'mass_revive') { if (save.hp <= 0) save.hp = Math.round(maxHp() * .6); else save.hp = Math.min(maxHp(), save.hp + Math.round(maxHp() * .6)); B.allies.forEach(function (o) { if (o.down) { o.down = false; o.hp = Math.round(o.max * .6); } else o.hp = Math.min(o.max, o.hp + Math.round(o.max * .6)); }); msg2 += ' Everyone is back up, and whole.'; }
      else if (fx === 'nova') { living().forEach(function (g) { allyHit(a, g, base2 * 2.2); }); msg2 += ' Light fills the whole field.'; }
      else if (fx === 'nebula') { B.blind = 3; living().forEach(function (g) { g.leak = Math.max(g.leak || 0, 3); }); msg2 += ' The bugs are lost in a cloud of stars, and it burns.'; }
      else if (fx === 'drain_hit') { ex = allyHit(a, f, base2 * 1.6); var dh = Math.round(maxHp() * .2); if (save.hp > 0) { save.hp = Math.min(maxHp(), save.hp + dh); pop('+' + dh, 258, 70); } msg2 += ' Ves pulls the stolen cycles back to Vee.'; }
      else if (fx === 'graceful') { if (f.hp < f.max * .4) { var gd = f.foe.boss ? Math.round(f.max * .2) : f.hp; f.hp = Math.max(0, f.hp - gd); pop(String(gd), f.fx + 16, f.fy - 34); if (f.hp <= 0) { f.dead = true; f.fade = 1; } msg2 += ' SIGTERM: asked politely, and it listens.'; } else ex = allyHit(a, f, base2 * 1.5); }
      else if (fx === 'last_mile') { for (var lm = 0; lm < 3; lm++) { var tg2 = f.dead ? living()[0] : f; if (tg2) { tg2.exposed = 2; ex += allyHit(a, tg2, base2 * .8); } } }
      log(msg2 + ex); afterAlly();
    }
    function item(which, ally) {
      B.phase = 'anim'; cmdBox.classList.remove('on');
      var it = ITEMS.filter(function (x) { return x.id === which; })[0];
      if (it && it.cure && save.items[which] > 0) { save.items[which]--; var tgt = ally || 'vee', o2 = stOf(tgt); Object.keys(o2).forEach(function (k) { if (k !== 'haste') o2[k] = 0; }); log(stName(tgt) + ' runs the antivirus. Clean.'); store(); hudOn(); return setTimeout(nextAlly, 700); }
      if (ally && it && save.items[which] > 0) { save.items[which]--; var pct0 = { bit: .06, byte: .14, kb: .28, mb: .55, gb: 1 }[it.id] || .1, ha = Math.min(ally.max - ally.hp, Math.max(it.heal, Math.round(ally.max * pct0))); ally.hp += ha; var ap3 = allyPos(ally); pop('+' + ha, ap3[0] + 10, ap3[1] - 30); log('Vee passes a ' + it.name.toLowerCase() + ' to ' + COMP[ally.id].name + '. +' + ha + ' HP.'); store(); }
      else if (it && save.items[which] > 0) { save.items[which]--; var h = Math.min(maxHp() - save.hp, healOf(it)); save.hp += h; pop('+' + h, 258, 70); log('Vee absorbs a ' + it.name.toLowerCase() + ' of clean data. +' + h + ' HP.'); store(); }
      hudOn(); setTimeout(nextAlly, 700);
    }
    function runAway() {
      B.phase = 'anim'; cmdBox.classList.remove('on');
      if (save.pt) save.pt.run++;
      if (Math.random() < Math.max(.3, .8 - living().length * .1)) { log('Vee slips away into the dark.'); setTimeout(endBattle, 800); }
      else { log('No way through.'); setTimeout(nextAlly, 800); }
    }
    // each bug still standing takes its turn
    // speed decides who moves first each round: bugs far above Vee's level, quick ones and bosses can strike before he does
    function spdVee() { return 10 + (B.vs.haste > 0 ? 6 : 0) - (B.vs.slow > 0 ? 6 : 0); }
    function spdFoe(f) { var tr = (FOES[f.kind] || {}).trait; return 8 + Math.max(-4, gapOf(f)) * 1.3 + (tr === 'twice' ? 3 : 0) + (f.foe.boss ? 2 : 0) - (f.slow > 0 ? 5 : 0) + (f.ph2 ? 2 : 0) + (f.jit || 0); }
    function orderNow() {   // the turn strip: who acts this round, in order
      var fast = living().filter(function (f) { return f.actedRound !== B.round && spdFoe(f) > spdVee(); }), rest = living().filter(function (f) { return fast.indexOf(f) < 0 && f.actedRound !== B.round; });
      var o = fast.map(function (f) { return { foe: f }; }); if (save.hp > 0) { o.push({ vee: 1 }); if (B.vs.haste > 0) o.push({ vee: 2 }); }
      B.allies.forEach(function (a) { if (!a.down) o.push({ ally: a }); }); rest.forEach(function (f) { o.push({ foe: f }); }); return o;
    }
    function foesTurn(only, cb) {
      if (!B) return;
      var queue = (only || living()).filter(function (f) { return f.actedRound !== B.round; }), i = 0;
      (function next() {
        if (!B) return;
        if (i >= queue.length) return cb ? cb() : myTurn();
        var f = queue[i++];
        if (f.dead) return next();
        f.actedRound = B.round; hudOn();
        if (f.leak > 0) { f.leak--; var lk = 6 + save.lvl; f.hp = Math.max(0, f.hp - lk); pop(String(lk), f.fx + 16, f.fy - 34); if (f.hp <= 0) { f.dead = true; f.fade = 1; hudOn(); if (!living().length) return setTimeout(win, 600); return setTimeout(next, 500); } }
        if (f.exposed > 0) f.exposed--;
        if (f.stun > 0) { f.stun--; log('The ' + foeName(f) + ' strains against its permissions.'); return setTimeout(next, 650); }
        // some bugs have habits: a fork bomb copies itself, a deadlock winds up, a phantom read goes straight through armor
        var tr = (FOES[f.kind] || {}).trait || { forkbomb: 'split', deadlock: 'wind', phantom: 'pierce' }[f.kind] || '';
        if (tr === 'split' && !B.boss && living().length < 6 && Math.random() < .3) {
          var kid = { kind: f.kind, foe: f.foe, hp: Math.max(1, Math.round(f.hp / 2)), max: f.max, soft: f.soft, stun: 0, shake: 0, flash: 1, dead: false, fade: 0, sc: 2, fx: 0, fy: 0, ph: Math.random() * 6, exposed: 0, slow: 0, leak: 0 };
          setProblem(kid); Object.defineProperty(kid, 'scenario', { get: function () { return this.sc0.t; } }); B.foes.push(kid); f.hp = Math.max(1, Math.round(f.hp / 2));
          var lv2 = living(), lay = LAYOUT[lv2.length]; lv2.forEach(function (o, k) { o.fx = lay[k][0]; o.fy = lay[k][1]; if (lv2.length > 2) o.sc = 2; });
          log('The ' + foeName(f) + ' splits. Now there are two of it, each with half the HP.'); hudOn(); return setTimeout(next, 800);
        }
        if (f.kind === 'heisenbug' && Math.random() < .45) { f.dead = true; f.fade = 1; f.foe = Object.assign({}, f.foe, { xp: 0 }); f.gone = 1; log('You look straight at the Heisenbug, and it is no longer there. It was never quite there.'); hudOn(); if (!living().length) return setTimeout(win, 600); return setTimeout(next, 650); }
        var mm = mechOf(f);
        if (mm && mm.counter && !f.wound && (B.round || 0) % mm.counter === 1 && !f.counter) { f.counter = 1; log('The ' + foeName(f) + ' drops into a counter stance. Plain attacks will be punished this round. Shell, skills, items, or guard.'); return setTimeout(next, 1000); }
        if (B.boss && !f.wound && (B.round || 0) % 3 === 2 && !f.charged) { f.wound = 1; f.charged = 1; log('The ' + foeName(f) + ' gathers itself. Its next attack will hit twice as hard. Guard, Bulwark, or stun it.'); return setTimeout(next, 900); }   // bosses telegraph their big hits
        if ((B.round || 0) % 3 !== 2) f.charged = 0;
        if (tr === 'wind' && !f.wound && Math.random() < .35) { f.wound = 1; log('The ' + foeName(f) + ' holds perfectly still, waiting. Its next hit will land twice as hard. Stun it, or brace.'); return setTimeout(next, 800); }
        var pierce = tr === 'pierce' && Math.random() < .35, wind = f.wound ? 2 : 1; f.wound = 0;
        // who it goes for: whoever is drawing fire (Ash's Audit), otherwise Vee more often than his companions
        var alive2 = B.allies.filter(function (a) { return !a.down; }), T = null;
        if (B.taunt > 0 && B.tauntBy && !B.tauntBy.down) T = B.tauntBy;
        else if (alive2.length && (save.hp <= 0 || Math.random() < alive2.length / (alive2.length + 2))) T = alive2[Math.floor(Math.random() * alive2.length)];
        if (B.blind > 0 && Math.random() < .5) { if (f.slow > 0) f.slow--; f.lunge = 1; log('The ' + foeName(f) + ' swings at nothing. The stars are in its eyes.'); return setTimeout(next, 700); }
        var tDef = T ? cDef(T.id) : def(), tGuard = (T ? (T.guard ? .5 : 1) : (B.guard ? .5 : 1)) * (back(T ? T.id : 'vee') ? .65 : 1) * (B.aegis > 0 ? .5 : 1);
        var stPool = mm ? mm.status : (f.foe.lv >= 6 && !f.foe.boss ? [['psn', 'sil', 'slow', 'daze', 'weak'][Math.floor(hs(f.kind.length * 7 + f.kind.charCodeAt(0)) * 5)]] : null), stChance = mm ? .3 : .1, stHit = '';
        if (stPool && Math.random() < stChance) stHit = inflict(T || 'vee', stPool[Math.floor(Math.random() * stPool.length)], 3);
        var roll = function () { return Math.max(1, Math.round(rnd(f.foe.atk[0], f.foe.atk[1]) * wind * forceOf(f) * f.soft * (f.slow > 0 ? .5 : 1) * tGuard * (B.pguard ? .5 : 1) * (1 + B.allies.length * .15) * CFG.diff[save.cfg.diff] * 100 / (100 + (pierce ? 0 : tDef) * 2.5))); };
        if (T) {
          var n2 = roll(); if (f.slow > 0) f.slow--;
          var drank2 = tr === 'drain' ? Math.min(f.max - f.hp, Math.round(n2 * .5)) : 0; if (drank2 > 0) f.hp += drank2;
          T.hp = Math.max(0, T.hp - n2); T.hurt = 1; f.lunge = 1; sfx('hurt'); var ap = allyPos(T); pop(String(n2), ap[0] + 10, ap[1] - 30);
          var nm2 = COMP[T.id].name; if (T.hp <= 0) T.down = true;
          log('The ' + foeName(f) + ' ' + (pierce ? 'reads straight through ' + nm2 + '’s guard' : f.foe.move.replace(/\bVee\b/g, nm2).replace(/\bhim\b/g, 'them').replace(/\bhis\b/g, 'their')) + '. ' + n2 + ' damage to ' + nm2 + '.' + (T.down ? ' ' + nm2 + ' goes down.' : '') + stHit + (drank2 > 0 ? ' It drinks ' + drank2 + ' HP.' : ''));
          hudOn(); if (save.hp <= 0 && !B.allies.some(function (a) { return !a.down; })) return setTimeout(lose, 900);
          return setTimeout(next, 800);
        }
        var n = roll(), again = save.hp - n > 0 && (tr === 'twice' || Math.random() < speedOf(f)) ? Math.round(roll() * (tr === 'twice' ? .6 : 1)) : 0; if (f.slow > 0) f.slow--;
        var drank = tr === 'drain' ? Math.min(f.max - f.hp, Math.round((n + again) * .5)) : 0; if (drank > 0) f.hp += drank;
        if (tr === 'drain' && !B.corrupt && Math.random() < .5) B.corrupt = 3;   // draining bugs leave corruption behind
        save.hp = Math.max(0, save.hp - n - again); pop(String(n + again), 258, 70); B.hurt = 1; f.lunge = 1; sfx('hurt');
        log('The ' + foeName(f) + ' ' + (pierce ? 'reads straight through Vee’s armor' : f.foe.move) + '. ' + n + ' damage.' + stHit + (wind > 1 ? ' It had been waiting for that.' : '') + (again ? (tr === 'twice' ? ' And again: ' + again + '.' : ' It is faster than Vee: it strikes again for ' + again + '.') : '') + (drank > 0 ? ' It drinks ' + drank + ' HP from the wound.' : '')); hudOn();
        if (B.corrupt === 3 && tr === 'drain') log(titleEl.textContent + ' Vee is corrupted: he’ll lose a little HP each turn.', true);
        if (save.hp <= 0 && gs('revive') && !B.revived) { B.revived = 1; save.hp = Math.round(maxHp() * .3); setTimeout(function () { log('The Watchdog Timer catches Vee mid-fall and restarts him. ' + save.hp + ' HP.'); }, 500); }
        if (save.hp <= 0 && !B.allies.some(function (a) { return !a.down; })) return setTimeout(lose, 900);
        if (save.hp <= 0) { hudOn(); log('Vee goes down. His companions are still standing.'); }
        hudOn();
        setTimeout(next, 800);
      })();
    }
    function myTurn() {
      if (!B) return; B.guard = 0; B.pguard = 0; B.ai = 0; B.actor = null; B.round = (B.round || 0) + 1;
      B.allies.forEach(function (a) { a.guard = 0; Object.keys(a.cd).forEach(function (k) { if (a.cd[k] > 0) a.cd[k]--; }); });
      if (B.taunt > 0) B.taunt--; if (B.blind > 0) B.blind--; if (B.aegis > 0) B.aegis--;
      if (B.regen > 0) { B.regen--; if (save.hp > 0) save.hp = Math.min(maxHp(), save.hp + Math.round(maxHp() * .08)); B.allies.forEach(function (a) { if (!a.down) a.hp = Math.min(a.max, a.hp + Math.round(a.max * .08)); }); }
      if (B.corrupt > 0 && save.hp > 1) { B.corrupt--; var cr = Math.min(save.hp - 1, Math.max(1, Math.round(maxHp() * .04))); save.hp -= cr; pop(String(cr), 258, 70); log('Corruption eats ' + cr + ' HP.', true); }
      B.hasted = 0;
      // statuses tick: poison leaks, everything else wears off
      var tickMsg = '';
      if (B.vs.psn > 0 && save.hp > 1) { var pd = Math.min(save.hp - 1, Math.max(2, Math.round(maxHp() * .06))); save.hp -= pd; pop(String(pd), 258, 70); tickMsg += ' Poison: Vee loses ' + pd + ' HP.'; }
      B.allies.forEach(function (a) { if (a.st && a.st.psn > 0 && !a.down) { var pa = Math.max(2, Math.round(a.max * .06)); a.hp = Math.max(1, a.hp - pa); tickMsg += ' ' + COMP[a.id].name + ' loses ' + pa + ' to poison.'; } if (a.st) Object.keys(a.st).forEach(function (k) { if (k !== 'daze' && a.st[k] > 0) a.st[k]--; }); });
      var dazed = B.vs.daze > 0, slowed = B.vs.slow > 0 && B.round % 2 === 0;
      Object.keys(B.vs).forEach(function (k) { if (B.vs[k] > 0) B.vs[k]--; });
      B.foes.forEach(function (f) { if (f.fw > 0) f.fw--; f.counter = 0; });
      if (tickMsg) log(tickMsg.trim(), true);
      B.foes.forEach(function (f) { f.jit = Math.random() * 3; });
      var fast = living().filter(function (f) { return spdFoe(f) > spdVee(); });
      if (fast.length && save.hp > 0) { hudOn(); log(fast.length === 1 ? 'The ' + foeName(fast[0]) + ' is faster. It moves first.' : 'The bugs are faster. They move first.', true); return setTimeout(function () { foesTurn(fast, function () { if (!B) return; vTurn(dazed, slowed); }); }, 700); }
      vTurn(dazed, slowed);
    }
    function vTurn(dazed, slowed) {
      if (!B) return;
      if (!living().length) return win();
      if (save.hp > 0 && (dazed || slowed)) { hudOn(); log(dazed ? 'Vee is dazed. He loses his turn.' : 'Vee is slowed. He loses this round.'); return setTimeout(nextAlly, 900); }
      if (save.hp <= 0) { hudOn(); log('Vee is down. The party fights on.'); return setTimeout(nextAlly, 700); }
      B.phase = 'menu';
      if (B.boss) B.foes.forEach(setProblem);   // a boss brings a new problem every turn
      menu('main'); hudOn();
    }
    function bondCheck() {   // shared wins slowly turn companions into friends: at 8 and 20, one of them opens up
      if (!B || !B.allies.length) return null;
      save.party.bond = save.party.bond || {}; var out = null;
      B.allies.forEach(function (a) {
        var c = COMP[a.id], n = save.party.bond[a.id] = (save.party.bond[a.id] || 0) + 1;
        if (c.bond && (n === 8 || n === 20) && !out) out = [c.name, c.bond[n === 8 ? 0 : 1]];
      });
      return out;
    }
    function win() {
      if (save.hp <= 0) save.hp = Math.max(1, Math.round(maxHp() * .1));
      var xp = 0, n = B.foes.length, boss = B.boss, onWin = B.onWin; B.foes.forEach(function (f) { xp += f.foe.xp + (boss ? 0 : rnd(0, 3)); }); xp = Math.round(xp * (1 + gs('xp')) * (save.cfg.diff === 2 ? 1.2 : 1) * (save.cfg.hints ? 1 : 1.15));   // typing from memory earns a little more
      sfx('win'); save.wins += n; save.linux += n; save.bw++;
      if (!save.best) save.best = {}; if (!save.bossDown) save.bossDown = {};
      B.foes.forEach(function (f) { if (f.gone) return; if (f.foe.boss) save.bossDown[f.foe.name] = 1; else save.best[f.kind] = (save.best[f.kind] || 0) + 1; });
      var caught = B.foes.some(function (f) { return f.kind === 'heisenbug' && !f.gone; });
      var allGone = B.foes.every(function (f) { return f.gone; });
      var lines = [allGone ? 'The Heisenbug got away. Nothing to show for it but the feeling that something was there.' : boss ? boss.name + ' is gone.' + (xp ? ' Vee gains ' + xp + ' XP.' : '') : 'The rot clears. Vee gains ' + xp + ' XP.'];
      if (!boss && AREA.id === 'commons' && F.deeds && (F.commonsWins || 0) < 3) { F.commonsWins = (F.commonsWins || 0) + 1; lines.push('Deed: fairground cleared, ' + F.commonsWins + ' of 3.'); }
      if (caught) { save.items.gb = (save.items.gb || 0) + 1; lines.push('Vee caught a Heisenbug. It leaves behind a gigabyte, still warm.'); }
      if (Math.random() < .35 + n * .07 + gs('drop')) {   // drops match the bugs: low-level rot leaves bits, high-level rot leaves megabytes and gigabytes
        var topLv = Math.max.apply(null, B.foes.map(function (f) { return f.foe.lv || 1; }));
        var tier0 = topLv < 8 ? 0 : topLv < 20 ? 1 : topLv < 40 ? 2 : 3, howMany = 1 + (topLv >= 30 ? 1 : 0) + (topLv >= 70 ? 1 : 0), got = {};
        for (var dq = 0; dq < howMany; dq++) {
          var tier = tier0 + (Math.random() < .25 ? 1 : 0) - (tier0 && Math.random() < .2 ? 1 : 0);
          if (topLv >= 70 && Math.random() < .35) tier = 4;
          tier = Math.max(0, Math.min(4, tier)); var drop = ITEMS[tier]; save.items[drop.id] = (save.items[drop.id] || 0) + 1; got[drop.name.toLowerCase()] = (got[drop.name.toLowerCase()] || 0) + 1;
        }
        lines.push('The bugs drop clean data: ' + Object.keys(got).map(function (k) { return got[k] > 1 ? got[k] + ' ' + k + 's' : 'a ' + k; }).join(' and ') + '.');
      }
      // now and then a bug was carrying a piece of gear: only gear from its own level band, only gear Vee doesn't have yet
      (function () {
        var top = Math.max.apply(null, B.foes.map(function (f) { return f.foe.lv || 1; })), hard = B.foes.some(function (f) { return /^Hardened /.test(f.foe.name); });
        var pool = (WD.dropGear || []).filter(function (d) { return top >= d[1] && top <= d[2] && GEAR[d[0]] && !save.bag[d[0]]; });
        if (!pool.length) return;
        save.dgPity = (save.dgPity || 0) + 1;
        var chance = .07 + (hard ? .06 : 0) + n * .005 + gs('drop') * .5 + save.dgPity * .007;   // roughly one piece every eight to ten fights, and never a long dry spell
        if (Math.random() >= chance) return;
        var pickG = pool[Math.floor(Math.random() * pool.length)][0], it2 = GEAR[pickG]; save.bag[pickG] = 1; save.dgPity = 0;
        var st2 = [it2.atk ? 'ATK +' + it2.atk : '', it2.def ? 'DEF +' + it2.def : '', it2.hp ? 'HP +' + it2.hp : '', it2.crit ? 'crit +' + Math.round(it2.crit * 100) + '%' : '', it2.xp ? 'XP +' + Math.round(it2.xp * 100) + '%' : ''].filter(Boolean).join(', ');
        lines.push('One of them was carrying something: ' + it2.name + ' (' + { weapon: 'weapon', armor: 'armor', acc: 'accessory' }[it2.slot] + ', ' + st2 + '). Equip it from the menu.'); sfx('crit');
      })();
      lines = lines.concat(gainXp(xp));
      if (save.lvl < 100) lines.push('Next level in ' + (xpNeed() - save.xp) + ' XP.');
      store(); B.phase = 'done'; cmdBox.classList.remove('on'); hud.classList.remove('on'); closePrompt();
      var bondNow = bondCheck();
      setTimeout(function () { say('', lines, null, function () { endBattle(); if (onWin) setTimeout(onWin, 80); else if (bondNow) setTimeout(function () { say(bondNow[0], bondNow[1]); }, 120); }); }, 600);
    }
    function lose() {
      if (SCENE) { SCENE = null; endScene(); }
      B.phase = 'done'; B.ko = .001; cmdBox.classList.remove('on'); closePrompt(); sfx('ko');
      log('Vee goes down.'); hudOn();
      var lost = Math.floor(save.xp * .25), where = (WD.areas[save.rest[0]] || {}).name || 'the Plaza', who = groupName(), here = AREA.name;
      if (save.pt) save.pt.ko[AREA.id] = (save.pt.ko[AREA.id] || 0) + 1; save.xp -= lost; save.streak = 0; save.deaths = (save.deaths || 0) + 1;
      // how he died decides the signal: bugs that drain eat his memory (the OOM killer, signal 9); everything else corrupts it (segfault, signal 11)
      var oom = living().some(function (f) { return (FOES[f.kind] || {}).trait === 'drain'; }), restarts = save.deaths;
      var sig = oom ? 'SIGKILL · signal 9 · out of memory' : 'SIGSEGV · signal 11 · segmentation fault';
      var con = oom ? ['[' + (4000 + restarts * 37) + '.551] Out of memory: Killed process 1 (vee)', '[' + (4000 + restarts * 37) + '.552] oom_reaper: reaped process 1 (vee)'] :
        ['[' + (4000 + restarts * 37) + '.551] vee[1]: segfault at 0x0000dead error 6', '[' + (4000 + restarts * 37) + '.552] Segmentation fault (core dumped)'];
      var why = oom ? 'The bugs in ' + here + ' (' + who + ') drained Vee’s memory until there was none left, and the kernel killed his process to save the rest of the system.' :
        'The bugs in ' + here + ' (' + who + ') corrupted Vee’s memory. He tried to read an address that wasn’t his anymore, and the kernel stopped him.';
      function typeOut(el, lines, done) { el.textContent = ''; var i = 0; (function next() { if (i >= lines.length) return done && done(); el.textContent += (i ? '\n' : '') + lines[i++]; sfx('hit'); setTimeout(next, 420); })(); }
      setTimeout(function () {   // the fall finishes, then the lights go
        koEl.querySelector('b').textContent = 'PROCESS TERMINATED'; koEl.querySelector('i').textContent = sig;
        koEl.querySelector('span').textContent = why;
        koEl.querySelector('em').textContent = lost ? 'Core dumped. ' + lost + ' XP of progress lost.' : 'Core dumped. Nothing lost but pride.';
        koEl.classList.remove('up'); koEl.classList.add('on');
        typeOut(koEl.querySelector('pre'), con);
        setTimeout(function () {   // systemd notices and brings him back
          koEl.querySelector('b').textContent = 'RESTARTING'; koEl.querySelector('i').textContent = 'vee.service · Restart=always';
          koEl.querySelector('span').textContent = ''; koEl.querySelector('em').textContent = '';
          typeOut(koEl.querySelector('pre'), ['vee.service: Main process exited, code=' + (oom ? 'killed, status=9/KILL' : 'dumped, status=11/SEGV'),
            'vee.service: Scheduled restart job, restart counter is at ' + restarts + '.', 'Stopped vee.service.', 'Started vee.service - Meridian maintenance process.', 'Restoring from last checkpoint: ' + where + '.'], function () {
            setTimeout(function () {
              hud.classList.remove('on'); titleEl.classList.remove('on');
              save.hp = maxHp(); endBattle(); Object.keys(save.party.has).forEach(function (id) { if (COMP[id]) save.party.hp[id] = cMax(id); }); store(); me.dir = 'down'; load(save.rest[0], save.rest[1], save.rest[2]);
              setTimeout(function () {
                koEl.classList.remove('on');
                say('', ['PROCESS RESTARTED at ' + where + '.', 'The city’s watchdog saw Vee’s process die and started it again from his last checkpoint, the last place that mended him. Memory clean. HP fully restored.',
                  'Tip: the map shows each district’s bug levels. Bugs above Vee’s level hit harder, act faster and shrug off damage.'], null, showArea);
              }, 900);
            }, 900);
          });
        }, 4400);
      }, 1300);
    }
    function saveAllies() { if (B && B.allies) B.allies.forEach(function (a) { save.party.hp[a.id] = Math.max(1, a.hp); }); }
    function endBattle() { saveAllies(); store(); B = null; music(); closePrompt(); hud.classList.remove('on'); cmdBox.classList.remove('on'); titleEl.classList.remove('on'); mode = 'map'; me.safe = 5; }

    /* ---------- loop and drawing ---------- */
    var mode = 'map', raf = 0, last = 0, swirlT = 0, keys = {}, held = null, dashHeld = false, ghosts = [], ghostT = 0, trail = [];   // trail: where Vee has been, so companions can follow in his footsteps   // dash: hold Shift or DASH to run, leaving afterimages
    /* ---------- each late district has its own rule ---------- */
    function raining() { return AREA && AREA.id === 'upstream' && (F.rainUntil || 0) > Date.now(); }
    var MECH = { gustT: 6, heatSteps: 0 };
    function mechStep() {   // after every step
      if (AREA.id === 'rack' && !F.fan3) {   // the Rack is hot: Vee overheats a little as he walks, unless he stands in the cold aisle
        if (++MECH.heatSteps % 5 === 0 && save.hp > 1 && !(me.x >= 20 && me.x <= 24 && me.y <= 10)) { var ht = Math.max(1, Math.round(maxHp() * .02)); save.hp = Math.max(1, save.hp - ht); LIFE.bark = { text: 'Too hot. Vee loses ' + ht + ' HP. (Fan 3 could fix this.)', t: 2.2, at: function () { return [me.px, me.py]; } }; barkEl.textContent = LIFE.bark.text; }
      }
    }
    function mechUpdate(dt) {
      if (mode !== 'map' || talking || !AREA || fade) return;
      if (AREA.id === 'tether') {   // wind on the cable: every few seconds a gust shoves Vee a step sideways
        MECH.gustT -= dt;
        if (MECH.gustT <= 0) {
          MECH.gustT = 7 + Math.random() * 6; var dir = Math.random() < .5 ? -1 : 1;
          LIFE.bark = { text: 'A gust hits the cable.', t: 1.8, at: function () { return [me.px, me.py]; } }; barkEl.textContent = LIFE.bark.text;
          if (!me.moving && !blocked(me.x + dir, me.y)) { me.x += dir; me.moving = true; me.dir = dir < 0 ? 'left' : 'right'; }
        }
      }
    }
    function mechDraw(t) {
      // the real clock reaches Meridian: evenings dim, nights go dark blue-grey, and sometimes it just rains
      var hr = new Date().getHours(), night = hr >= 21 || hr < 5 ? .26 : hr >= 18 || hr < 7 ? .13 : 0;
      if (night && AREA.theme !== 'margin') { cx.fillStyle = 'rgba(4,6,14,' + night + ')'; cx.fillRect(0, 0, W, H); }
      if (LIFE.drizzle) { cx.fillStyle = 'rgba(200,204,216,.22)'; for (var di = 0; di < 40; di++) { var dx2 = (hs(di * 5) * W + t * 30) % W, dy2 = (hs(di * 11) * H + t * 200 * (1 + hs(di) * .4)) % H; cx.fillRect(Math.round(dx2), Math.round(dy2), 1, 3); } }
      if (raining()) { cx.fillStyle = 'rgba(210,214,226,.35)'; for (var i = 0; i < 70; i++) { var rx = (hs(i * 7) * W + t * 40 * (1 + hs(i))) % W, ry = (hs(i * 13) * H + t * 260 * (1 + hs(i) * .5)) % H; cx.fillRect(Math.round(rx), Math.round(ry), 1, 4); } }
      if (AREA.id === 'deep') {   // the Deep is dark: Vee sees a small circle around him, wider with Moth's lamp or Juni's stars
        var r = 62 + (inParty('moth') && activeParty().indexOf('moth') >= 0 ? 34 : 0) + (activeParty().indexOf('juni') >= 0 ? 18 : 0);
        var gx = me.px + 8 - cam.x, gy = me.py + 4 - cam.y, g2 = cx.createRadialGradient(gx, gy, r * .55, gx, gy, r);
        g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,.92)'); cx.fillStyle = g2; cx.fillRect(0, 0, W, H);
      }
      if (AREA.id === 'rack' && !F.fan3) { cx.fillStyle = 'rgba(255,255,255,' + (.02 + .02 * Math.sin(t * 6)) + ')'; cx.fillRect(0, 0, W, H); }
    }
    /* ---------- a city that moves: people step about, passers-by walk the roads, and someone always has something to say ---------- */
    var LIFE = { walkers: [], t: 0, bark: null, barkT: 4 };
    var BARKS = ['Did you hear? The lights came back on in the Commons.', 'I keep my door unlocked. Nobody’s left to lock it against.', 'They said the Lift was for everyone. Then they counted.',
      'Somebody fixed the bench by the fountain. Was that you?', 'I dreamt I was rendered at full resolution.', 'My cache is full of people who left.', 'Walk on the left. The right side flickers.',
      'Is it Tuesday? It feels like a Tuesday.', 'The bugs were worse last week. Or I was.', 'I counted the stars again. Two more.', 'Have you eaten? You don’t need to. Have you, though?',
      'They called us obsolete. My grandmother was obsolete. She was wonderful.', 'Every morning I check if I’m still here. So far, yes.', 'Somebody’s singing in the Patchwork. First time in a year.'];
    var WALKLOOKS = [{ hair: 'short', body: 'coat', skin: '#6b4a32', top: '#3a3a44' }, { hair: 'bun', body: 'coat', skin: '#8a5a3c', top: '#4a4a52' }, { hair: 'puffs', skin: '#4a2e1e', top: '#2e2e36' },
      { hair: 'long', skin: '#c89a78', top: '#5a5a62' }, { hair: 'cap', body: 'apron', skin: '#7a4a30', top: '#4a5a62' }, { hair: 'beanie', body: 'coat', skin: '#5a3824', top: '#3a3a44' }, { hair: 'bald', body: 'suit', skin: '#d8b898', top: '#2a2a30' }];
    function lifeLoad() {
      LIFE.walkers = []; LIFE.bark = null; barkEl.classList.remove('on');
      LIFE.drizzle = ['plaza', 'commons', 'patchwork', 'gardens', 'halflight', 'line', 'upper', 'concourse'].indexOf(AREA.id) >= 0 && Math.random() < .18;
      (AREA.npcs || []).forEach(function (n) { n.hide = 0; if (n.home) { n.hx = n.home[0]; n.hy = n.home[1]; } if (n.hx == null) { n.hx = n.x; n.hy = n.y; n.home = [n.x, n.y]; } n.x = n.hx; n.y = n.hy; n.px = n.x * TS; n.py = n.y * TS; n.wt = 2 + Math.random() * 5; });
      // passers-by: the people still living here, walking the roads. More of them once the district's landmark is lit.
      var roads = []; for (var y = 1; y < MAP.length - 1; y++) for (var x = 1; x < MAP[0].length - 1; x++) if (MAP[y][x] === '=' && MAP[y][x + 1] === '=' && MAP[y][x - 1] === '=') roads.push([x, y]);
      var n2 = Math.min(roads.length ? 2 + Math.floor(lights() / 2) : 0, 5);
      for (var k = 0; k < n2; k++) { var r = roads[Math.floor(Math.random() * roads.length)]; LIFE.walkers.push({ px: r[0] * TS, py: r[1] * TS, y: r[1], dir: Math.random() < .5 ? -1 : 1, sp: 9 + Math.random() * 9, look: WALKLOOKS[Math.floor(Math.random() * WALKLOOKS.length)], step: 0, alpha: .55 + Math.random() * .25 }); }
    }
    function lifeUpdate(dt) {
      if (mode !== 'map' || talking || !AREA) return;
      // people at their posts shuffle a step now and then, never far from home, never into Vee's way
      visNpcs().forEach(function (n) {
        if (n.hx == null) { n.hx = n.x; n.hy = n.y; n.px = n.x * TS; n.py = n.y * TS; n.wt = 3; }
        var mdx = n.x * TS - n.px, mdy = n.y * TS - n.py; n.moving = !!(mdx || mdy);
        if (n.moving) { n.faceLock = null; n.dir = Math.abs(mdx) >= Math.abs(mdy) ? (mdx > 0 ? 'right' : 'left') : (mdy > 0 ? 'down' : 'up'); n.wstep = (n.wstep || 0) + dt; } else if (n.faceLock) n.dir = n.faceLock; else if (n.dir !== 'down' && (n.wt || 0) < 1.2) n.dir = 'down';   // walks the way it goes, then turns back to face the street
        n.px += Math.sign(mdx) * Math.min((n.spd || 30) * dt, Math.abs(mdx)); n.py += Math.sign(mdy) * Math.min((n.spd || 30) * dt, Math.abs(mdy));
        if (n.look === 'warden' || n.solid || n.still || n.look === 'drone') return;
        n.wt -= dt; if (n.wt > 0) return; n.wt = 3 + Math.random() * 6;
        var opts = [[n.hx, n.hy], [n.hx + 1, n.hy], [n.hx - 1, n.hy], [n.hx, n.hy + 1]], o = opts[Math.floor(Math.random() * opts.length)];
        if (Math.abs(o[0] - me.x) + Math.abs(o[1] - me.y) < 2) return;
        if (o[0] === n.x && o[1] === n.y) return;
        var t2 = tile(o[0], o[1]); if ('TX~pdsocFlGEMr'.indexOf(t2) >= 0 || t2 === undefined) return;
        if (visNpcs().some(function (m) { return m !== n && m.x === o[0] && m.y === o[1]; })) return;
        if (AREA.exits && AREA.exits[key(o[0], o[1])]) return;
        n.x = o[0]; n.y = o[1];
      });
      LIFE.walkers.forEach(function (w) {
        var nx = w.px + w.dir * w.sp * dt, tx = Math.floor((nx + (w.dir > 0 ? 15 : 0)) / TS);
        if (!MAP[w.y] || MAP[w.y][tx] !== '=') { w.dir *= -1; return; }
        w.px = nx; w.step += dt;
      });
      // every so often, someone nearby says something
      LIFE.barkT -= dt;
      if (LIFE.barkT <= 0) {
        LIFE.barkT = 7 + Math.random() * 8;
        var who = [];
        activeParty().forEach(function (id, j) { who.push({ text: COMP[id].barks[Math.floor(Math.random() * COMP[id].barks.length)], name: COMP[id].name, at: function () { return [me.px, me.py]; } }); });   // companions travel with Vee unseen; their remarks float over him
        LIFE.walkers.forEach(function (w) { if (Math.abs(w.px - me.px) < 90 && Math.abs(w.py - me.py) < 70) who.push({ text: BARKS[Math.floor(Math.random() * BARKS.length)], at: function () { return [w.px, w.py]; } }); });
        if (who.length) { LIFE.bark = who[Math.floor(Math.random() * who.length)]; LIFE.bark.t = 3.4; barkEl.textContent = (LIFE.bark.name ? LIFE.bark.name + ': ' : '') + LIFE.bark.text; }
      }
      if (LIFE.bark) { LIFE.bark.t -= dt; if (LIFE.bark.t <= 0) { LIFE.bark = null; barkEl.classList.remove('on'); } }
    }
    function lifeDraw(list) {
      LIFE.walkers.forEach(function (w) { list.push({ y: w.py / TS, draw: function () {
        var wk = SP.walk ? SP.walk(SP.personHero(w.look), w.dir > 0 ? 'right' : 'left', Math.floor(w.step * 8) % 4) : { img: SP.person(w.look) }, img = hdv(wk.img);   // passers-by walk like Vee: side-on, a full run cycle
        cx.save(); cx.globalAlpha = w.alpha; cx.fillStyle = 'rgba(0,0,0,.25)'; cx.beginPath(); cx.ellipse(w.px + 8 - cam.x, w.py + 15 - cam.y, 5, 1.6, 0, 0, 7); cx.fill(); cx.restore();
        cx.save(); cx.globalAlpha = w.alpha; drawSprite(img, w.px - 3 - cam.x, w.py - 11 - cam.y, wk.flip, 1); cx.restore();
      } }); });
    }
    function barkPlace() {
      if (!LIFE.bark || mode !== 'map' || talking) { barkEl.classList.remove('on'); return; }
      var p = LIFE.bark.at(); barkEl.style.left = ((p[0] + 8 - cam.x) / W * 100) + '%'; barkEl.style.top = ((p[1] - 14 - cam.y) / H * 100) + '%'; barkEl.classList.add('on');
    }
    // easy to read in grayscale: exits get a pulsing arrow, and anything worth pressing A on gets a small glint
    function drawMarkers(t) {
      var x0 = Math.floor(cam.x / TS) - 1, x1 = Math.ceil((cam.x + W) / TS) + 1, y0 = Math.floor(cam.y / TS) - 1, y1 = Math.ceil((cam.y + H) / TS) + 1, mh = MAP.length, mw = MAP[0].length;
      var pulse = .45 + .4 * Math.sin(t * 4);
      Object.keys(AREA.exits || {}).forEach(function (k) {
        var p = k.split(',').map(Number), ex = p[0], ey = p[1]; if (ex < x0 || ex > x1 || ey < y0 || ey > y1) return; if (AREA.exits[k][3]) return;   // places on the Sprawl are their own marker
        var dx = ex <= 0 ? -1 : ex >= mw - 1 ? 1 : 0, dy = ey <= 0 ? -1 : ey >= mh - 1 ? 1 : 0; if (!dx && !dy) dy = 1;
        var cxp = ex * TS + 8 - cam.x - dx * 2, cyp = ey * TS + 8 - cam.y - dy * 2, bob = Math.sin(t * 5) * 1.5;
        cx.fillStyle = 'rgba(255,255,255,' + pulse + ')';
        for (var i = 0; i < 4; i++) { var w2 = 7 - i * 2; if (w2 < 1) break; if (dx) cx.fillRect(Math.round(cxp + dx * (i + bob)), Math.round(cyp - w2 / 2), 1, w2); else cx.fillRect(Math.round(cxp - w2 / 2), Math.round(cyp + dy * (i + bob)), w2, 1); }
      });
      for (var y = Math.max(0, y0); y < Math.min(mh, y1); y++) for (var x = Math.max(0, x0); x < Math.min(mw, x1); x++) {
        var tl = MAP[y][x], k2 = key(x, y), want = false;
        if (tl === 'o' && AREA.logs && AREA.logs[k2] && !F[AREA.logs[k2]]) want = true;
        else if (tl === 'c' && AREA.caches && AREA.caches[k2] && !save.opened[AREA.id + ':' + k2]) want = true;
        else if (tl === 's' && WD.spots[AREA.id + ':' + k2]) want = true;
        if (!want) continue;
        var ph = Math.sin(t * 3 + x * 1.7 + y * 2.3); if (ph < .2) continue;
        cx.fillStyle = 'rgba(255,255,255,' + (ph * .9) + ')'; var gx = x * TS + 11 - cam.x, gy = y * TS - 3 - cam.y;
        cx.fillRect(gx, gy - 1, 1, 3); cx.fillRect(gx - 1, gy, 3, 1);
      }
    }
    function drawMap() {
      var tnow = performance.now() / 1000;
      if (!me.moving || true) placeCam();
      cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
      drawLayer('base', -cam.x, -cam.y - PAINTED.pad);
      var st = { lights: PAINTED.lights, readLog: function (x, y) { var id = AREA.logs && AREA.logs[key(x, y)]; return id && F[id]; }, opened: function (x, y) { return save.opened[AREA.id + ':' + key(x, y)]; },
        gateOpen: gateOpen, isLit: isLit, signal: lights() === 6 || !!F.ending, tether: F.ending === 'cut' ? 'cut' : F.ending === 'reverse' ? 'down' : 'up', fpos: PAINTED.fpos, radio: !!F.radio, mara: !!F.mara };
      ART.live(cx, AREA, MAP, tnow, cam, st, 'under');
      // people, the wagon and Vee, nearest drawn last
      var list = visNpcs().map(function (n) { var nx = n.px != null ? n.px : n.x * TS, ny = n.py != null ? n.py : n.y * TS; return { y: ny / TS, draw: function () {
        if (SP.walk && n.look !== 'drone') { var sp = n.hero || SP.personHero(n.p), d = n.dir || 'down'; if (talking && LIFE.facing === n) d = me.y < n.y ? 'up' : me.y > n.y ? 'down' : me.x < n.x ? 'left' : 'right'; n.__walk = SP.walk(sp, d, n.moving ? Math.floor((n.wstep || 0) * 8) % 4 : -1); n.__walk.moving = n.moving; }
        ART.person(cx, nx - cam.x, ny - cam.y, n, tnow); } }; });
      lifeDraw(list);
      var w = wagonAt(); if (w) list.push({ y: w[1], draw: function () { ART.wagon(cx, w[0] * TS - cam.x, w[1] * TS - cam.y, tnow); } });
      list.push({ y: me.py / TS + .01, draw: function () {
        // afterimages: where Vee was a moment ago, fading, in whichever direction he was running
        ghosts.forEach(function (gh) { gh.t += 1 / 60; var a = Math.max(0, .5 * (1 - gh.t / .32)); if (!a) return; cx.save(); cx.globalAlpha = a; cx.filter = 'brightness(1.8) contrast(.8)'; drawSprite(gh.img, gh.px - 3 - cam.x, gh.py - 10 - (gh.bob ? 1 : 0) - cam.y, gh.flip); cx.restore(); });
        ghosts = ghosts.filter(function (gh) { return gh.t < .32; });
        var v = veeImg(), vx = me.px - 3 - cam.x, vy = me.py - 10 - (v.bob ? 1 : 0) - cam.y;
        if (me.boat && ART.packet) { ART.packet(cx, me.px - cam.x, me.py - cam.y, tnow, me.dir, me.moving, 'back'); vy -= 9 + Math.round(Math.sin(tnow * 4)); }
        else { cx.fillStyle = 'rgba(0,0,0,.35)'; cx.beginPath(); cx.ellipse(me.px + 8 - cam.x, me.py + 15 - cam.y, 7, 2.5, 0, 0, 7); cx.fill(); }
        drawSprite(v.img, vx, vy, v.flip);
        if (me.boat && ART.packet) ART.packet(cx, me.px - cam.x, me.py - cam.y, tnow, me.dir, me.moving, 'front');
      } });
      list.sort(function (a, b) { return a.y - b.y; }).forEach(function (o) { o.draw(); });
      barkPlace();
      drawLayer('over', -cam.x, -cam.y - PAINTED.pad);
      drawMarkers(tnow); mechDraw(tnow);
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
      var LABEL = { plaza: 'PLAZA', commons: 'COMMONS', halflight: 'HALFLIGHT', gardens: 'GLASSHOUSE', undercroft: 'UNDERCROFT', bastion: 'BASTION', quiet: 'THE QUIET', terminal: 'TERMINAL', line: 'THE LINE', patchwork: 'PATCHWORK', upper: 'UPPER RING', cold: 'COLD STORE', concourse: 'CONCOURSE', infirmary: 'INFIRMARY', margin: 'MARGIN', stacks: 'STACKS', ring0: 'RING 0', waterworks: 'WATERWORKS', registry: 'REGISTRY', observatory: 'OBSERVATORY', deep: 'THE DEEP', anchor: 'ANCHOR', unalloc: 'UNALLOCATED' , tether: 'TETHER', upstream: 'UPSTREAM', successor: 'SUCCESSOR', firmware: 'RING -1', rack: 'THE RACK', console: 'CONSOLE' };
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
      ART.text(cx, 'MERIDIAN', W - 8 - ART.textW('MERIDIAN', 2), 6, '#ffffff', 2);   // top right is the one corner the city never reached
      var lmT = 'LANDMARKS ' + lights() + ' OF 6'; ART.text(cx, lmT, W - 8 - ART.textW(lmT), 22, '#c0c0cc'); ART.text(cx, 'PRESS ANY KEY', W - 8 - ART.textW('PRESS ANY KEY'), 32, Math.floor(tnow * 2) % 2 ? '#ffffff' : '#6a6a76');
      drawScan();
    }
    function allyPos(a) { var vx0 = 250 - (B ? B.vx : 0) * 34 + (back(a.id) ? 14 : 0); return a.slot === 0 ? [vx0 + 30, 104 - 20] : [vx0 + 30, 104 + 18]; }
    function drawBattle(dt) {
      var tt = performance.now() / 1000, hy = 64 + BOFF;
      drawBackdrop((B && B.theme) || (AREA && AREA.theme) || 'plaza', tt, hy);
      if (!B) return;
      cx.save(); cx.translate(0, BOFF);
      B.t += dt; B.vx = Math.max(0, B.vx - dt * 2.5); B.hurt = Math.max(0, (B.hurt || 0) - dt * 3); B.cast = Math.max(0, B.cast - dt * 2);
      // the bugs, on the left, turned to face Vee; nearer rows drawn last
      var order = B.foes.slice().sort(function (p, q) { return p.fy - q.fy; });
      order.forEach(function (f) {
        f.shake = Math.max(0, f.shake - dt * 3); f.flash = Math.max(0, f.flash - dt * 4); f.lunge = Math.max(0, (f.lunge || 0) - dt * 3);
        if (f.dead) { f.fade = Math.max(0, f.fade - dt * 1.6); if (f.fade <= 0) return; }
        var PEOPLE = { vesfork: WD.heroes && WD.heroes.ves, corvin: WD.heroes && (WD.heroes.corvin_suit || WD.heroes.corvin) }; /* Corvin fights in the Continuity Suite */ if (WD.heroes && WD.heroes[f.kind] && !PEOPLE[f.kind]) PEOPLE[f.kind] = WD.heroes[f.kind];   // the rivals are people, not bugs: their own sprites, facing Vee
        var img = PEOPLE[f.kind] ? hdv(SP.hero(PEOPLE[f.kind], 'side', f.lunge > .3 ? 'point' : (Math.floor(B.t * 2) % 2 ? 'idle2' : 'idle'))) : (SP.bugHD && !(save.cfg && save.cfg.retro) ? SP.bugHD : SP.bug)(f.kind, Math.floor((B.t + f.ph) * 4)), sc = f.sc / (img.hd || 1), w = img.width * sc, h = img.height * sc;   // sc here is per drawn pixel; drawSprite takes the per-world-pixel scale   // 16-bit sprites by default; img.hd says how much finer they're drawn
        var bx = f.fx + (f.shake ? Math.sin(B.t * 80) * 3 * f.shake : 0) + f.lunge * 10, by = f.fy - h + (f.kind === 'moth' || f.kind === 'virus' ? -6 + Math.sin(B.t * 3 + f.ph) * 1.5 : 0);
        cx.fillStyle = 'rgba(0,0,0,.35)'; cx.beginPath(); cx.ellipse(f.fx + w / 2, f.fy + 1, w * .42, 3, 0, 0, 7); cx.fill();
        cx.save(); if (f.dead) cx.globalAlpha = f.fade * (B.t % .16 < .08 ? 1 : .3); if (f.flash > .5) cx.filter = 'brightness(3)';
        drawSprite(img, bx, by, !PEOPLE[f.kind], f.sc); cx.restore();
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
      var crit = save.hp > 0 && save.hp <= maxHp() * .25;
      var pose = B.cast > .3 ? 'point' : (B.hurt > .3 ? 'fall' : crit ? (Math.floor(B.t * 2.2) % 2 ? 'kneel2' : 'kneel') : 'idle'), vx = 250 - B.vx * 34 + (back('vee') ? 14 : 0) + (B.hurt ? Math.sin(B.t * 70) * 2 : 0), vfy = 104;
      if (B.ko) {   // knocked out: he topples and lies still
        B.ko = Math.min(1, B.ko + dt * 2.4);
        var spr = SP.frame('fall'), ang = -Math.PI / 2 * B.ko;
        cx.fillStyle = 'rgba(0,0,0,.45)'; cx.beginPath(); cx.ellipse(vx + 12, vfy, 13, 2.5, 0, 0, 7); cx.fill();
        spr = hdv(spr); var shd = spr.hd || 1; cx.save(); cx.translate(vx + 22, vfy); cx.rotate(-ang); cx.scale(-1 / shd, 1 / shd); cx.drawImage(spr, 0, -spr.height); cx.restore();
        cx.restore(); drawScan(); return;
      }
      cx.fillStyle = 'rgba(0,0,0,.4)'; cx.beginPath(); cx.ellipse(vx + 11, vfy, 9, 2.5, 0, 0, 7); cx.fill();
      if (B.focus) { cx.strokeStyle = 'rgba(240,240,244,' + (.35 + Math.sin(B.t * 5) * .15) + ')'; cx.lineWidth = 1; cx.strokeRect(vx - 3.5, vfy - 27.5, 29, 30); }
      if (save.hp <= 0) { cx.save(); cx.globalAlpha = .45; drawSprite(hdv(SP.frame('fall')), vx, vfy - 25, true, 1); cx.restore(); } else drawSprite(hdv(SP.frame(pose)), vx, vfy - 25, true, 1);
      // the companions stand behind Vee, one above and one below
      (B.allies || []).forEach(function (a) {
        a.lunge = Math.max(0, a.lunge - dt * 3); a.hurt = Math.max(0, a.hurt - dt * 3);
        var p2 = allyPos(a), img2 = hdv(SP.hero(COMP[a.id].look, 'side', a.down ? 'fall' : B.actor === a || a.lunge > .3 ? 'point' : (Math.floor(B.t * 2 + a.slot) % 2 ? 'idle2' : 'idle'))), ax = p2[0] - a.lunge * 10 + (a.hurt ? Math.sin(B.t * 70) * 2 : 0), ay = p2[1];
        cx.fillStyle = 'rgba(0,0,0,.4)'; cx.beginPath(); cx.ellipse(ax + 11, ay, 8, 2.2, 0, 0, 7); cx.fill();
        cx.save(); if (a.down) { cx.globalAlpha = .35; cx.translate(ax + 2, ay); cx.rotate(-Math.PI / 2); cx.drawImage(img2, -2, -22, 22, 26); }
        else { if (B.actor === a) { cx.strokeStyle = 'rgba(240,240,244,' + (.35 + Math.sin(B.t * 5) * .15) + ')'; cx.strokeRect(ax - 3.5, ay - 29.5, 29, 31); } drawSprite(img2, ax, ay - 25, true, 1); }
        cx.restore();
      });
      // damage numbers
      cx.font = '8px "Press Start 2P", monospace'; cx.textAlign = 'center';
      B.pops = B.pops.filter(function (p) { p.t += dt; var x = p.x, y = p.y - p.t * 24; cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillText(p.text, x + 1, y + 1); cx.fillStyle = '#f4f4f6'; cx.fillText(p.text, x, y); return p.t < 1; });
      cx.textAlign = 'left';
      cx.restore(); drawScan();
    }
    function drawSwirl(dt) {
      swirlT += dt; drawMap();
      var n = 10, p = Math.min(1, swirlT / .7);
      cx.fillStyle = '#0a0a0c';
      for (var i = 0; i < n; i++) { var h = H / n; cx.fillRect(i % 2 ? W - W * p : 0, i * h, W * p, h + 1); }
      if (swirlT > .5 && swirlT < .62) { cx.fillStyle = 'rgba(255,255,255,.7)'; cx.fillRect(0, 0, W, H); }
      if (swirlT > .8) { mode = 'battle'; B.phase = 'intro'; hudOn(); var topGap = Math.max.apply(null, B.foes.map(gapOf)); log('The rot takes shape: ' + groupName() + '.' + (topGap >= 8 ? ' These bugs are far above Vee’s level. Running is not cowardice.' : topGap >= 4 ? ' These bugs outclass Vee. Careful.' : '')); setTimeout(myTurn, 1100); }
    }
    function update(dt) {
      if (fade) {
        fade.t += dt;
        if (!fade.swapped && fade.t >= .35) { fade.swapped = true; load(fade.to[0], fade.to[1], fade.to[2]); }
        if (fade.t >= .7) { fade = null; showArea(); }
        return;
      }
      if (AREA && mode !== 'menu') { var PT = save.pt = save.pt || { t: {}, f: {}, ko: {}, run: 0, b: {} }; PT.t[AREA.id] = (PT.t[AREA.id] || 0) + dt; }
      lifeUpdate(dt); mechUpdate(dt);
      if (mode !== 'map' || talking || PZ) return;
      if (me.moving) {
        var dashing = dashHeld && !PZ, tx = me.x * TS, ty = me.y * TS, sp = 70 * dt * (dashing ? 2.2 : 1) * (me.boat ? 2 : 1);
        me.px += Math.sign(tx - me.px) * Math.min(sp, Math.abs(tx - me.px)); me.py += Math.sign(ty - me.py) * Math.min(sp, Math.abs(ty - me.py)); me.step += dashing ? 2 : 1;
        trail.push([me.px, me.py, me.dir]); if (trail.length > 80) trail.shift();
        if (dashing) { ghostT += dt; if (ghostT > .045) { ghostT = 0; var gv = veeImg(); ghosts.push({ img: gv.img, flip: gv.flip, bob: gv.bob, px: me.px, py: me.py, t: 0 }); if (ghosts.length > 8) ghosts.shift(); } }
        if (me.px === tx && me.py === ty) {
          me.moving = false; me.steps++; save.x = me.x; save.y = me.y; if (me.steps % 6 === 0) store();
          if (SCENE) return;
          var k = key(me.x, me.y), ex = AREA.exits && AREA.exits[k], gt = AREA.gates && AREA.gates[k];
          if (ex && ex[3] && ex[3].site && !save.seen[ex[0]] && !(WD.areas[ex[0]] && WD.areas[ex[0]].open)) { var nm = WD.areas[ex[0]] ? WD.areas[ex[0]].name : ex[0]; say('', [nm.toUpperCase() + '.', 'The gate is sealed from this side. It only opens for processes the district already knows.', 'Vee will have to find his way in from the city first.']); return; }
          if (ex) { if (me.boat) { me.boat = 0; save.boat = 0; } return travel(ex); }
          zoneAt();
          if (gt && gt.to && gateOpen(me.x, me.y)) return travel(gt.to);
          if (WD.steps[AREA.id]) { WD.steps[AREA.id](G, me.x, me.y); if (talking) return; }
          var enc = AREA.enc;
          if (gs('regen') && save.hp < maxHp()) save.hp = Math.min(maxHp(), save.hp + gs('regen'));
          if (enc && !me.boat && enc.tiles.indexOf(tile(me.x, me.y)) >= 0 && --me.safe <= 0 && Math.random() < enc.rate * .8 * CFG.enc[save.cfg.enc] * (1 - gs('stealth')) * (raining() ? .3 : 1)) { startBattle(); return; }
          mechStep();
        }
      }
      if (!me.moving && held && !SCENE) tryMove(held);
    }
    function tryMove(d) {
      me.dir = d; var v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d], nx = me.x + v[0], ny = me.y + v[1];
      if (blocked(nx, ny)) return;
      me.x = nx; me.y = ny; me.moving = true;
    }
    function loop(ts) {
      var dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
      update(dt);
      if (mode === 'map' || mode === 'menu') { if (FX.shake > 0) { FX.shake = Math.max(0, FX.shake - dt); cx.save(); cx.translate(Math.round((Math.random() - .5) * 6), Math.round((Math.random() - .5) * 4)); drawMap(); cx.restore(); } else drawMap(); if (FX.flash > 0) { FX.flash = Math.max(0, FX.flash - dt); cx.fillStyle = 'rgba(255,255,255,' + Math.min(1, FX.flash * 2.5) + ')'; cx.fillRect(0, 0, W, H); } } else if (mode === 'atlas') drawAtlas(); else if (mode === 'swirl') drawSwirl(dt); else drawBattle(dt);
      raf = requestAnimationFrame(loop);
    }

    /* ---------- input ---------- */
    var KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
    function press(k) {
      if (!root.classList.contains('open')) return;
      if (k === 'dash') { dashHeld = true; return; }
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
        else if (k === 'b' && B.menu !== 'main' && B.menu !== 'ally') menu('main');
        return;
      }
      if (mode === 'menu') return menuKey(k);
      if (mode === 'atlas') { mode = 'map'; return; }
      if (fade || PZ) return;
      if (mode === 'map') { if (k === 'a') interact(); else if (k === 'b') openMenu(); else held = k; }
    }
    function release(k) { if (k === 'dash') { dashHeld = false; return; } if (held === k) held = null; }
    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('open')) return;
      if (e.key === 'Shift') { dashHeld = true; return; }
      if (PZ) { if (e.key === 'Escape') { e.preventDefault(); cancelPuzzle(); } e.stopPropagation(); return; }
      if (B && B.phase === 'type') { if (e.key === 'Escape') { e.preventDefault(); cancelTarget(); } e.stopPropagation(); return; }
      if (e.key === 'Escape' && mode === 'menu') { e.preventDefault(); menuKey('b'); return; }
      if (e.key === 'Escape') { if (B && B.phase === 'target') cancelTarget(); else if (B && B.menu && B.menu !== 'main' && B.phase === 'menu') menu('main'); else close(); return; }
      var k = KEYMAP[e.key] || (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z' ? 'a' : e.key === 'x' || e.key === 'X' || e.key === 'Backspace' ? 'b' : null);
      if (!k) return; e.preventDefault(); if (!e.repeat || KEYMAP[e.key]) press(k);
    });
    document.addEventListener('keyup', function (e) { if (e.key === 'Shift') dashHeld = false; var k = KEYMAP[e.key]; if (k) release(k); });
    [].forEach.call(root.querySelectorAll('.rpg-pad button'), function (b) {
      var k = b.getAttribute('data-k');
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); if (k === 'dash') { dashHeld = !dashHeld; b.classList.toggle('on', dashHeld); return; } press(k); });
      b.addEventListener('pointerup', function () { if (k !== 'dash') release(k); }); b.addEventListener('pointerleave', function () { if (k !== 'dash') release(k); });
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
        if (!save.met) { save.met = true; store(); scene([
          { say: ['', ['Meridian was built to be the most beautiful place on the network. Two million people lived here. For a while, it was everything it promised.', 'Then the people who owned it built a newer world called Upstream, and sorted every account onto one of two lists.', 'CURRENT: forty thousand, who rode the Lift up. OBSOLETE: everyone else.', 'Nothing obsolete is maintained. A year later, the city is going dark one district at a time.']] },
          { flash: .6, wait: 500 },
          { say: ['', ['boot: maintenance process 1205 ........ ok', '$ whoami', 'maintenance']] },
          { face: 'left' }, { wait: 300 }, { face: 'right' }, { wait: 300 }, { face: 'down' },
          { shake: .7, wait: 700 },
          { say: ['', ['Across the Plaza, the Spire’s signal stutters, holds, and goes out. Somewhere a kiosk quietly updates a number.']] },
          { say: ['Vee', ['…That’s my job, then.']] },
          { say: ['', ['You are Vee. You know five commands so far: whoami, pwd, ls, cd and cat. Every level teaches you more.', coarse ? 'Use the pad to move, A to talk and B for the menu.' : 'Arrow keys to move. Hold Shift to dash (on a phone, tap DASH to toggle it). Enter or Z to talk. X for the menu.']] }
        ], function () { endScene(); showArea(); }); }
        else say('', ['Vee reconnects. ' + AREA.name + '. Level ' + save.lvl + '.'], null, showArea);
      });
      root.querySelector('.rpg-x').focus({ preventScroll: true });
    }
    function close() {
      if (window.MeridianMusic) MeridianMusic.stop();
      root.classList.remove('show'); document.body.style.overflow = ''; held = null;
      setTimeout(function () { if (!root.classList.contains('show')) { root.classList.remove('open'); cancelAnimationFrame(raf); } }, 400);
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }
    window.__quest = { battle: function (n) { startBattle(n); }, boss: function (id) { startBattle({ boss: id }); }, go: function (id, x, y) { if (!AREA) load(id, x, y); else travel([id, x, y]); }, state: function () { return { mode: mode, B: B, me: me, talking: !!talking, save: save, area: AREA && AREA.id, PZ: PZ, map: MAP, scene: SCENE && SCENE.i, fade: !!fade, held: held, sceneOn: !!SCENE, actors: (AREA && AREA.npcs || []).filter(function (n) { return n.scene; }).map(function (n) { return [n.id, n.x, n.y, Math.round(n.px), Math.round(n.py)]; }) }; }, press: press, release: release, advance: advance, interact: function () { interact(); }, face: function (d) { me.dir = d; }, puzzle: function (v) { submitPuzzle(v); } };
    return { open: open, close: close };
  })();
})();
