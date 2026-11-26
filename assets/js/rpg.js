/* Meridian: a small RPG starring Vee, plus the menu that picks between the two hidden games. */
(function () {
  'use strict';
  var SP = window.VondsSprite;
  if (!SP) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && matchMedia('(hover: none), (pointer: coarse)').matches;
  var NAMES = { runner: 'Uptime', rpg: 'Meridian' };

  /* ======================= the game menu ======================= */
  var pick = document.createElement('div'); pick.className = 'gpick'; pick.setAttribute('role', 'dialog'); pick.setAttribute('aria-modal', 'true'); pick.setAttribute('aria-label', 'Choose a game');
  pick.innerHTML = '<div class="ff4w gpick-w"><b class="ff4n">Vee</b><p class="gpick-q">Pick a game.</p>' +
    '<button type="button" class="gpick-o" data-g="runner"><canvas width="44" height="52"></canvas><span><strong>' + NAMES.runner + '</strong><em>An endless runner. Clear the bugs. Stay online.</em></span></button>' +
    '<button type="button" class="gpick-o" data-g="rpg"><canvas width="44" height="52"></canvas><span><strong>' + NAMES.rpg + '</strong><em>A short RPG about the city the rich left behind.</em></span></button>' +
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
    if (which === 'quest' || which === 'rpg' || which === 'meridian') return choose('rpg');
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
    var save = { lvl: 1, xp: 0, hp: 60, mp: 24, coffee: 3, notes: 2, linux: 0, wins: 0, met: false };
    try { var sv = JSON.parse(localStorage.getItem('vonds-quest') || 'null'); if (sv) for (var k0 in sv) save[k0] = sv[k0]; } catch (e) {}
    function store() { try { localStorage.setItem('vonds-quest', JSON.stringify(save)); } catch (e) {} }
    function maxHp() { return 60 + (save.lvl - 1) * 14; }
    function xpNeed() { return 30 + (save.lvl - 1) * 25; }
    function maxMp() { return 24 + (save.lvl - 1) * 6; }

    /* ---------- the town ---------- */
    var MAP = [
      'TTTTTTTTTTTTTTTTTTTT',
      'T..AAAA......BBBBB.T',
      'T..AAAA......BBBBB.T',
      'T..AAdA..s...BBdBB.T',
      'T....=.........=...T',
      'T==================>',
      'T.....=....n.......T',
      'T,,,,.=.....,,,,,,.T',
      'T,,,,.=.....,,,,,,.T',
      'T,,,,.=.....,,,,,,.T',
      'TTTTTTTTTTTTTTTTTTTT'];
    function tile(x, y) { return (MAP[y] || '')[x] || 'T'; }
    function solid(x, y) { return 'TABdsn'.indexOf(tile(x, y)) >= 0; }
    function hs(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
    var mapCanvas = document.createElement('canvas'); mapCanvas.width = W; mapCanvas.height = H;
    (function paint() {
      // a virtual world: dark grid ground, glowing circuit roads, data pylons, static fields, futuristic homes
      var g = mapCanvas.getContext('2d');
      function px(x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
      px(0, 0, W, H, '#07070a');
      for (var y = 0; y < MAP.length; y++) for (var x = 0; x < 20; x++) {
        var t = tile(x, y), X = x * TS, Y = y * TS;
        px(X, Y, TS, TS, '#0b0b10'); px(X, Y, TS, 1, '#15151c'); px(X, Y, 1, TS, '#15151c'); px(X, Y, 1, 1, '#2a2a34');
        if (t === '=' || t === '>') {
          var hz = tile(x - 1, y) === '=' || tile(x + 1, y) === '=' || t === '>';
          px(X, Y, TS, TS, '#101017');
          if (hz) { px(X, Y + 2, TS, 1, '#8c8c96'); px(X, Y + 13, TS, 1, '#8c8c96'); if (x % 2) px(X + 2, Y + 7, 8, 2, 'rgba(236,236,242,.45)'); }
          else { px(X + 2, Y, 1, TS, '#8c8c96'); px(X + 13, Y, 1, TS, '#8c8c96'); if (y % 2) px(X + 7, Y + 2, 2, 8, 'rgba(236,236,242,.45)'); }
          if (hs(x * 13 + y * 31) > .72) {   // cracks where the traces have failed
            var cx0 = X + 3 + Math.floor(hs(x + y) * 9); px(cx0, Y + 1, 1, 4, '#060609'); px(cx0 + 1, Y + 4, 1, 4, '#060609'); px(cx0, Y + 8, 2, 1, '#060609');
            if (hz) px(X + 4, Y + 2, 5, 1, '#3a3a42'); else px(X + 2, Y + 5, 1, 5, '#3a3a42');
          }
        } else if (t === ',') {
          for (var i = 0; i < 18; i++) { var r = hs(x * 41 + y * 17 + i); px(X + Math.floor(hs(x * 9 + y * 23 + i * 3) * 15), Y + Math.floor(hs(x * 29 + y * 5 + i * 7) * 15), r > .7 ? 2 : 1, 1, r > .85 ? '#6e6e7a' : r > .5 ? '#3a3a46' : '#262630'); }
        } else if (t === 'T') {
          // data pylons: slim obelisks with lit edges
          px(X + 5, Y + 3, 6, 13, '#16161d'); px(X + 5, Y + 3, 1, 13, '#5c5c68'); px(X + 10, Y + 3, 1, 13, '#2c2c36');
          px(X + 6, Y + 1, 4, 2, '#16161d'); px(X + 7, Y, 2, 1, '#9a9aa6');
          var dead = hs(x * 7 + y * 11) > .62;   // some pylons have gone dark, a few are cracked
          for (var k = 0; k < 3; k++) px(X + 7, Y + 6 + k * 3, 2, 1, dead ? '#202028' : (x + y + k) % 3 ? '#3a3a46' : '#a8a8b4');
          if (dead) { px(X + 7, Y, 2, 1, '#2a2a32'); if (hs(x + y * 3) > .5) { px(X + 8, Y + 5, 1, 4, '#050507'); px(X + 9, Y + 9, 1, 3, '#050507'); } }
        } else if (t === 's') {
          px(X + 7, Y + 9, 2, 7, '#3a3a46'); px(X + 4, Y + 14, 8, 2, '#22222b');
        } else if (t === '.' && hs(x * 3 + y * 47) > .86) {
          // holes where the world has stopped rendering
          px(X + 3, Y + 4, 9, 7, '#000000'); px(X + 5, Y + 2, 5, 2, '#000000'); px(X + 2, Y + 7, 2, 3, '#000000'); px(X + 12, Y + 6, 2, 3, '#000000');
          px(X + 4, Y + 11, 6, 2, '#000000'); px(X + 3, Y + 4, 1, 1, '#2a2a34'); px(X + 11, Y + 10, 1, 1, '#2a2a34');
        }
      }
      // SIGNAL TOWER (Black Signal): a glass spire home with light strips, orbit rings and a beacon
      var tx = 3 * TS, ty = 1 * TS;
      px(tx + 10, ty + 2, 44, 46, '#12121a'); px(tx + 10, ty + 2, 44, 1, '#7a7a86');
      px(tx + 10, ty + 2, 1, 46, '#a0a0ac'); px(tx + 53, ty + 2, 1, 46, '#3a3a46');
      for (var st = 0; st < 5; st++) px(tx + 15 + st * 8, ty + 6, 2, 34, st === 3 ? '#14141b' : st % 2 ? '#2e2e3a' : '#52525e');
      px(tx + 44, ty + 22, 7, 5, '#050508'); px(tx + 46, ty + 27, 3, 3, '#050508');
      px(tx + 14, ty + 18, 36, 1, '#5a5a66'); px(tx + 14, ty + 30, 36, 1, '#5a5a66');
      px(tx + 2, ty + 40, 60, 8, '#0f0f15'); px(tx + 2, ty + 40, 60, 1, '#9a9aa6');
      px(tx + 22, ty - 6, 20, 8, '#12121a'); px(tx + 22, ty - 6, 20, 1, '#7a7a86');
      px(tx + 30, ty - 16, 4, 10, '#1a1a22'); px(tx + 31, ty - 16, 1, 10, '#8a8a96');
      g.strokeStyle = 'rgba(220,220,230,.55)'; g.lineWidth = 1; g.beginPath(); g.ellipse(tx + 32.5, ty - 10.5, 13, 3, 0, 0, 7); g.stroke();
      g.strokeStyle = 'rgba(220,220,230,.3)'; g.beginPath(); g.ellipse(tx + 32.5, ty - 5.5, 18, 4, 0, 0, 7); g.stroke();
      px(5 * TS + 3, 3 * TS + 1, 10, 15, '#060609'); px(5 * TS + 2, 3 * TS, 12, 1, '#e8e8f0'); px(5 * TS + 2, 3 * TS, 1, 16, '#c8c8d4'); px(5 * TS + 13, 3 * TS, 1, 16, '#c8c8d4');
      // DATA ARCHIVE (Digital Resource Map): a domed home wrapped in map-grid lines
      var lx = 13 * TS, ly = 1 * TS, cxD = lx + 40, cyD = ly + 34;
      px(lx + 2, ly + 34, 76, 14, '#101017'); px(lx + 2, ly + 34, 76, 1, '#9a9aa6');
      g.fillStyle = '#12121a'; g.beginPath(); g.ellipse(cxD, cyD, 34, 30, 0, Math.PI, 0); g.fill();
      g.strokeStyle = 'rgba(200,200,212,.55)'; g.beginPath(); g.ellipse(cxD, cyD, 34, 30, 0, Math.PI, 0); g.stroke();
      g.strokeStyle = 'rgba(160,160,172,.35)';
      for (var m = 1; m < 4; m++) { g.beginPath(); g.ellipse(cxD, cyD, 34 * m / 4, 30, 0, Math.PI, 0); g.stroke(); }
      for (var n = 1; n < 4; n++) { var yy = cyD - 30 * n / 4, ww = 34 * Math.sqrt(1 - Math.pow(n / 4, 2)); g.beginPath(); g.moveTo(cxD - ww, yy + .5); g.lineTo(cxD + ww, yy + .5); g.stroke(); }
      px(cxD - 1, ly + 1, 2, 4, '#9a9aa6');
      px(cxD + 9, ly + 12, 10, 8, '#030305'); px(cxD + 11, ly + 10, 6, 2, '#030305'); px(cxD + 8, ly + 15, 1, 3, '#5a5a66'); px(cxD + 19, ly + 13, 1, 4, '#5a5a66');
      g.strokeStyle = 'rgba(230,230,240,.4)'; g.beginPath(); g.ellipse(cxD, ly + 38, 40, 4, 0, 0, 7); g.stroke();
      px(15 * TS + 3, 3 * TS + 1, 10, 15, '#060609'); px(15 * TS + 2, 3 * TS, 12, 1, '#e8e8f0'); px(15 * TS + 2, 3 * TS, 1, 16, '#c8c8d4'); px(15 * TS + 13, 3 * TS, 1, 16, '#c8c8d4');
    })();
    // things that move: data packets on the roads, the beacon, flickering static, holograms
    function drawLive(t) {
      var c = cx;
      // beacon on the spire
      if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = '#ffffff'; c.fillRect(3 * TS + 31, TS - 18, 2, 2); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(3 * TS + 27, TS - 22, 10, 10); }
      // packets travel along the main road and down the side roads
      c.fillStyle = 'rgba(245,245,250,.9)';
      for (var p = 0; p < 3; p++) { var u = (t * .18 + p / 3) % 1; c.fillRect(Math.floor(TS + u * 18 * TS), 5 * TS + 7, 3, 2); }
      var v1 = (t * .5) % 1; c.fillRect(5 * TS + 7, Math.floor(4 * TS + v1 * TS), 2, 3);
      var v2 = (t * .5 + .5) % 1; c.fillRect(15 * TS + 7, Math.floor(4 * TS + v2 * TS), 2, 3);
      // static fields shimmer
      for (var i = 0; i < 14; i++) { var r1 = hs(i * 7 + Math.floor(t * 8)), r2 = hs(i * 13 + Math.floor(t * 8)); var fx = r1 < .5 ? 1 + Math.floor(r1 * 2 * 4) : 12 + Math.floor((r1 - .5) * 2 * 6), fy = 7 + Math.floor(r2 * 3); c.fillStyle = 'rgba(200,200,214,' + (.25 + r2 * .4) + ')'; c.fillRect(fx * TS + Math.floor(hs(i + t) * 14), fy * TS + Math.floor(hs(i * 3 + t) * 14), 2, 1); }
      // the kiosk's floating hologram panel
      var bob = Math.round(Math.sin(t * 2) * 1), kx = 9 * TS, ky = 3 * TS - 2 + bob;
      c.fillStyle = 'rgba(210,210,224,' + (Math.random() < .05 ? .15 : .32) + ')'; c.fillRect(kx + 1, ky, 14, 9);
      c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(kx + 1, ky, 14, 1); c.fillRect(kx + 3, ky + 3, 9, 1); c.fillRect(kx + 3, ky + 5, 6, 1);
      // the firewall on the east road
      for (var fb = 0; fb < 4; fb++) { var a = .25 + .35 * Math.abs(Math.sin(t * 3 + fb)); c.fillStyle = 'rgba(230,230,240,' + a + ')'; c.fillRect(19 * TS + 2 + fb * 3, 5 * TS + 1, 1, 14); }
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(19 * TS + 1, 5 * TS + 1 + Math.floor((t * 20) % 14), 13, 1);
      // doors pulse
      var dp = .25 + .2 * Math.sin(t * 3); c.fillStyle = 'rgba(230,230,240,' + dp + ')'; c.fillRect(5 * TS + 4, 3 * TS + 2, 8, 13); c.fillRect(15 * TS + 4, 3 * TS + 2, 8, 13);
    }
    function drawDecay(t) {
      // debris drifts upward and fades, like the world slowly coming apart
      for (var i = 0; i < 16; i++) {
        var life = (t * .12 + hs(i * 5)) % 1, x = hs(i * 17) * W, y = H - life * (H + 20);
        cx.fillStyle = 'rgba(210,210,224,' + (.5 * (1 - life)) + ')'; cx.fillRect(Math.floor(x + Math.sin(t + i) * 4), Math.floor(y), i % 3 ? 1 : 2, i % 3 ? 1 : 2);
      }
      // now and then a building briefly fails to render
      var g2 = Math.floor(t * 3);
      if (hs(g2 * 1.7) > .82) {
        var bx = hs(g2) > .5 ? 3 * TS + 12 : 13 * TS + 16, by = TS + 4 + Math.floor(hs(g2 * 3) * 30);
        for (var j = 0; j < 4; j++) { cx.fillStyle = j % 2 ? 'rgba(0,0,0,.85)' : 'rgba(220,220,236,.35)'; cx.fillRect(bx + Math.floor(hs(g2 + j) * 30), by + j * 2, 8 + Math.floor(hs(g2 * 2 + j) * 14), 2); }
      }
    }
    function drawScan() {
      cx.fillStyle = 'rgba(0,0,0,.18)'; for (var y = 0; y < H; y += 2) cx.fillRect(0, y, W, 1);
      var g = cx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .65); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.5)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    }

    /* ---------- Vee on the map ---------- */
    var me = { x: 9, y: 5, dir: 'down', px: 9 * TS, py: 5 * TS, moving: false, step: 0, steps: 0, safe: 4 };
    var npc = { x: 11, y: 6 };
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
      var i = 0; tw = setInterval(function () { for (var k = 0; k < 2 && i < chars.length; k++) chars[i++].className = ''; if (i >= chars.length) clearInterval(tw); }, 20);
    }
    function typing() { return !!msgP.querySelector('.tw-hide'); }
    function finishTyping() { clearInterval(tw); [].forEach.call(msgP.querySelectorAll('.tw-hide'), function (s) { s.className = ''; }); }
    // say a sequence of lines; the last can offer choices
    function say(who, lines, choices, done) {
      talking = { who: who, lines: lines, i: 0, choices: choices, done: done, sel: 0 };
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
    function endTalk() { talking = null; msg.classList.remove('on'); }
    function choiceMove(d) {
      if (!talking || !talking.choices || talking.i !== talking.lines.length - 1) return;
      talking.sel = (talking.sel + d + talking.choices.length) % talking.choices.length;
      [].forEach.call(msgOpts.children, function (b, j) { b.className = j === talking.sel ? 'on' : ''; });
    }

    /* ---------- interactions in town ---------- */
    function facing() { var d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[me.dir]; return [me.x + d[0], me.y + d[1]]; }
    function interact() {
      var f = facing(), t = tile(f[0], f[1]);
      if (f[0] === npc.x && f[1] === npc.y) {
        say('Wren', save.wins ? ['Another light came back on, over by the east wall. That was you.', 'If you’re hurt, the spire still mends. Don’t ask it for much.'] :
          ['You’re still running. I thought I was the last process awake.', 'When the owners took the Lift Upstream, they ran the numbers. Repairing Meridian cost more than replacing it. So they replaced it.', 'Without the signal the city forgets itself, a street at a time. The landmarks still remember what was built here. Start with them.']);
      } else if (t === 's') {
        say('Kiosk', ['MERIDIAN. Population 1,204. Peak 2,000,000.', 'Six landmarks hold the city’s memory. Two still answer. The rest went dark with the east districts.']);
      } else if (t === 'd' && f[0] === 5) {
        save.hp = maxHp(); store();
        say('The Spire', ['BLACK SIGNAL. A school for operators: adaptive training in Linux, Security+, Python, and C, with labs that keep working when the network doesn’t.', 'The spire hums against your code. HP restored.'],
          [{ label: 'Try the demo', fn: function () { window.open('https://black-signal-demo.netlify.app/', '_blank', 'noopener'); } }, { label: 'Back', fn: null }]);
      } else if (t === 'd' && f[0] === 15) {
        say('The Archive', ['DIGITAL RESOURCE MAP. A living index of free devices, internet access, and digital-skills training across Maryland.', 'Every record in the dome points someone toward help they didn’t know was there.'],
          [{ label: 'Try the demo', fn: function () { window.open('https://digital-resource-map-demo.netlify.app/', '_blank', 'noopener'); } }, { label: 'Back', fn: null }]);
      }
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
    // Vee's attacks are real commands, learned one at a time. Each bug carries a scenario that one of them solves.
    var COMMANDS = [
      { cmd: "whoami", learn: "Use it to confirm which account you are running as.", fx: 'multi2', hit: "Two clean hits.",
        when: [{ t: "You are logged in, but not sure which account you are using.", ex: ["whoami"] }, { t: "Before you touch anything on this box, confirm which user you are.", ex: ["whoami"] }, { t: "A script is failing with permission errors. Check which user it is running as.", ex: ["whoami"] }] },
      { cmd: "pwd", learn: "Use it when you have lost track of where you are in the filesystem.", fx: 'focus', hit: "Bearings found. Your next hit lands double.",
        when: [{ t: "You have changed directories five times and lost track of where you are.", ex: ["pwd"] }, { t: "Before deleting anything, print the directory you are standing in.", ex: ["pwd"] }, { t: "You need the full path of this folder to paste into a config file.", ex: ["pwd"] }] },
      { cmd: "ls", learn: "Use it to see what is inside a directory. Add -a to show hidden files.", fx: 'multi3', hit: "Three quick hits.",
        when: [{ t: "You need to see which files are in this directory.", ex: ["ls"] }, { t: "Something is hiding in this folder. Show hidden files too.", ex: ["ls -a", "ls -la", "ls -al"] }, { t: "List the contents of the logs folder.", ex: ["ls logs", "ls logs/"] }, { t: "Show file sizes and permissions in a long list.", ex: ["ls -l", "ls -la", "ls -al", "ls -lh"] }] },
      { cmd: "cd", learn: "Use it to move into another directory.", fx: 'expose', hit: "Vee steps inside its directory. It takes extra damage for 3 turns.",
        when: [{ t: "Move into the projects folder.", ex: ["cd projects", "cd projects/"] }, { t: "Go back up one directory.", ex: ["cd .."] }, { t: "Jump straight to your home directory.", ex: ["cd", "cd ~"] }, { t: "Change into /var/log to read the system logs.", ex: ["cd /var/log", "cd /var/log/"] }] },
      { cmd: "cat", learn: "Use it to print a file’s contents without opening an editor.", fx: 'heal', hit: "Vee reads the file and recovers HP.",
        when: [{ t: "Read what is inside config.txt without opening an editor.", ex: ["cat config.txt"] }, { t: "Dump the contents of notes.md to the screen.", ex: ["cat notes.md"] }, { t: "Check what is in /etc/hostname.", ex: ["cat /etc/hostname"] }] },
      { cmd: "mkdir", learn: "Use it to create a new directory. Vee builds a wall and takes half damage next round.", fx: 'guard', hit: "A wall goes up. Incoming damage is halved this round.",
        when: [{ t: "Create a new folder called backups.", ex: ["mkdir backups"] }, { t: "Make a directory named reports for this month’s files.", ex: ["mkdir reports"] }, { t: "Create the nested folders site/assets/img in one go.", ex: ["mkdir -p site/assets/img"] }] },
      { cmd: "touch", learn: "Use it to create an empty file, or update a file’s timestamp.", fx: 'multi2', hit: "Two quick hits.",
        when: [{ t: "Create an empty file called todo.txt.", ex: ["touch todo.txt"] }, { t: "Make a blank index.html to start a new page.", ex: ["touch index.html"] }, { t: "Create an empty .gitignore in this project.", ex: ["touch .gitignore"] }] },
      { cmd: "cp", learn: "Use it to copy files. Add -r to copy a whole folder.", fx: 'multi2', hit: "Vee copies the attack. Two hits.",
        when: [{ t: "Make a backup copy of config.txt called config.bak.", ex: ["cp config.txt config.bak"] }, { t: "Copy report.pdf into the shared folder.", ex: ["cp report.pdf shared", "cp report.pdf shared/"] }, { t: "Copy the whole photos folder to photos_old.", ex: ["cp -r photos photos_old", "cp -R photos photos_old"] }] },
      { cmd: "mv", learn: "Use it to move or rename files.", fx: 'stun', hit: "Moved out of the way. It cannot act for 2 turns.",
        when: [{ t: "Move report.txt into the archive folder.", ex: ["mv report.txt archive", "mv report.txt archive/"] }, { t: "Rename draft.md to final.md.", ex: ["mv draft.md final.md"] }, { t: "Move every .log file into the old folder.", ex: ["mv *.log old", "mv *.log old/"] }] },
      { cmd: "grep", learn: "Use it to search text for a pattern.", fx: 'expose', hit: "The weak spot is marked. It takes extra damage for 3 turns.",
        when: [{ t: "Find every line that contains ERROR in app.log.", ex: ["grep ERROR app.log", "grep \"ERROR\" app.log", "grep 'ERROR' app.log"] }, { t: "Search config.yml for the word timeout.", ex: ["grep timeout config.yml"] }, { t: "Search every file in this folder for TODO.", ex: ["grep -r TODO .", "grep -r TODO", "grep -R TODO .", "grep -rn TODO ."] }] },
      { cmd: "rm", learn: "Use it to delete files. Careful: there is no trash can.", fx: 'heavy', hit: "Deleted. A massive hit.",
        when: [{ t: "Delete the file old.txt.", ex: ["rm old.txt"] }, { t: "Remove every .tmp file in this folder.", ex: ["rm *.tmp"] }, { t: "Delete the empty-looking cache folder and everything in it.", ex: ["rm -r cache", "rm -rf cache", "rm -r cache/", "rm -rf cache/"] }] },
      { cmd: "chmod", learn: "Use it to change file permissions. It locks a bug in place.", fx: 'stun', hit: "Locked. It cannot act for 2 turns.",
        when: [{ t: "deploy.sh will not run: permission denied. Make it executable.", ex: ["chmod +x deploy.sh", "chmod 755 deploy.sh", "chmod u+x deploy.sh"] }, { t: "Lock secrets.txt so only you can read and write it.", ex: ["chmod 600 secrets.txt"] }, { t: "Remove write permission for everyone else on notes.md.", ex: ["chmod go-w notes.md", "chmod o-w notes.md"] }] },
      { cmd: "find", learn: "Use it to search for files by name, size or age.", fx: 'crit', hit: "Found it. A guaranteed critical.",
        when: [{ t: "Somewhere under this folder is a file named budget.xlsx. Find it.", ex: ["find . -name budget.xlsx", "find -name budget.xlsx"] }, { t: "Find every .jpg file under photos.", ex: ["find photos -name \"*.jpg\"", "find photos -name '*.jpg'"] }, { t: "List the files in /tmp changed in the last day.", ex: ["find /tmp -mtime -1"] }] },
      { cmd: "ps", learn: "Use it to list the processes that are running.", fx: 'slow', hit: "Throttled. Its attacks are halved for 3 turns.",
        when: [{ t: "Something is eating the CPU. See which processes are running.", ex: ["ps", "ps aux", "ps -ef"] }, { t: "Check whether nginx is still running.", ex: ["ps aux | grep nginx", "ps -ef | grep nginx"] }, { t: "List every process on the machine, from every user.", ex: ["ps aux", "ps -ef", "ps -e"] }] },
      { cmd: "kill", learn: "Use it to end a process by its PID. It hits very hard.", fx: 'heavy', hit: "A massive hit.",
        when: [{ t: "A frozen program has PID 4821. End it.", ex: ["kill 4821"] }, { t: "Process 990 ignores a normal kill. Force it to stop.", ex: ["kill -9 990"] }, { t: "A runaway process, PID 3107, is flooding the logs. Stop it.", ex: ["kill 3107", "kill -9 3107"] }] },
      { cmd: "tail", learn: "Use it to read the end of a file, or follow a log as it grows.", fx: 'multi2', hit: "Two hits, tracking it as it moves.",
        when: [{ t: "Watch the newest lines of server.log as they are written.", ex: ["tail -f server.log"] }, { t: "Show only the last ten lines of error.log.", ex: ["tail error.log", "tail -n 10 error.log"] }, { t: "Show the last 50 lines of access.log.", ex: ["tail -n 50 access.log", "tail -50 access.log"] }] },
      { cmd: "df", learn: "Use it to check free disk space.", fx: 'leak', hit: "It starts leaking HP every turn.",
        when: [{ t: "The server says the disk is full. Check how much space is left.", ex: ["df", "df -h"] }, { t: "Show free space on every drive in human-readable sizes.", ex: ["df -h"] }, { t: "Before uploading a big backup, see how much room each drive has.", ex: ["df", "df -h"] }] },
      { cmd: "chown", learn: "Use it to change who owns a file.", fx: 'stun', hit: "Ownership seized. It cannot act for 2 turns.",
        when: [{ t: "Make the user vee the owner of site.conf.", ex: ["chown vee site.conf", "sudo chown vee site.conf"] }, { t: "Give the www folder and everything in it to user web.", ex: ["chown -R web www", "sudo chown -R web www"] }] },
      { cmd: "tar", learn: "Use it to bundle files into one archive, or unpack one.", fx: 'all', hit: "Bundled together. Every bug takes the hit.",
        when: [{ t: "Pack the project folder into project.tar.gz.", ex: ["tar -czf project.tar.gz project", "tar czf project.tar.gz project", "tar -czvf project.tar.gz project"] }, { t: "Unpack backup.tar.gz here.", ex: ["tar -xzf backup.tar.gz", "tar xzf backup.tar.gz", "tar -xzvf backup.tar.gz", "tar -xf backup.tar.gz"] }] },
      { cmd: "sudo", learn: "Use it to run a command as an administrator. It hits every bug at once.", fx: 'all', hit: "Every bug takes the hit.",
        when: [{ t: "Installing curl fails until you run it with admin rights.", ex: ["sudo apt install curl", "sudo dnf install curl", "sudo yum install curl"] }, { t: "Restart the nginx service. It needs root.", ex: ["sudo systemctl restart nginx"] }, { t: "Editing /etc/hosts needs root privileges. Open it in nano.", ex: ["sudo nano /etc/hosts"] }] },
      { cmd: "ssh", learn: "Use it to log into another machine securely.", fx: 'crit', hit: "Inside its defenses: a guaranteed critical.",
        when: [{ t: "Log into the server at 10.0.0.5.", ex: ["ssh 10.0.0.5"] }, { t: "Log into backup.local as the user admin.", ex: ["ssh admin@backup.local"] }, { t: "Connect to 10.0.0.9 on port 2222.", ex: ["ssh -p 2222 10.0.0.9"] }] }
    ];
    if (!save.known || !save.known.length) save.known = ['whoami'];
    if (save.bw == null) save.bw = 0;
    function cmdInfo(c) { return COMMANDS.filter(function (x) { return x.cmd === c; })[0]; }
    function nextCmd() { return COMMANDS.filter(function (x) { return save.known.indexOf(x.cmd) < 0; })[0]; }
    save.known = save.known.filter(function (c) { return cmdInfo(c); });
    while (save.known.length < save.lvl && nextCmd()) save.known.push(nextCmd().cmd);   // one command per level
    function norm(t) { return String(t).trim().replace(/\s+/g, ' ').replace(/[“”]/g, '"').replace(/[‘’]/g, "'"); }

    var B = null;   // the battle in progress
    function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function living() { return B.foes.filter(function (f) { return !f.dead; }); }
    function startBattle(force) {
      var kinds = Object.keys(FOES), r = Math.random(), n = force || (r < .3 ? 1 : r < .55 ? 2 : r < .75 ? 3 : r < .87 ? 4 : r < .95 ? 5 : 6);
      // up to three across; a back row for groups of four or more. Bigger groups hit softer and break faster.
      var SLOTS = [[], [[66, 108]], [[40, 98], [104, 114]], [[28, 94], [92, 110], [140, 94]], [[26, 92], [86, 92], [52, 116], [112, 116]],
        [[18, 90], [74, 90], [130, 90], [44, 116], [102, 116]], [[14, 90], [66, 90], [118, 90], [34, 116], [86, 116], [138, 116]]][n];
      var sc = n <= 2 ? 3 : 2, foes = [], soft = [1, 1, .8, .62, .5, .42, .36][n];
      endTalk();
      for (var i = 0; i < n; i++) {
        var kind = kinds[Math.floor(Math.random() * kinds.length)], f = FOES[kind], slot = SLOTS[i];
        var c = save.known[Math.floor(Math.random() * save.known.length)], info = cmdInfo(c);
        foes.push({ kind: kind, foe: f, hp: Math.round(f.hp * (n >= 4 ? .7 : 1)), max: Math.round(f.hp * (n >= 4 ? .7 : 1)), soft: soft, stun: 0, shake: 0, flash: 0, dead: false, fade: 0, sc: sc,
          cmd: c, sc0: info.when[Math.floor(Math.random() * info.when.length)],
          get scenario() { return this.sc0.t; }, fx: slot[0], fy: slot[1], ph: Math.random() * 6, exposed: 0, slow: 0, leak: 0 });
      }
      B = { foes: foes, focus: false, phase: 'intro', t: 0, vx: 0, pops: [], menu: 'main', sel: 0, cast: 0, target: 0, pending: null };
      mode = 'swirl'; swirlT = 0;
    }
    function foeName(f) { return f.foe.name.toLowerCase(); }
    function groupName() {
      var counts = {}; living().forEach(function (f) { counts[f.foe.name] = (counts[f.foe.name] || 0) + 1; });
      return Object.keys(counts).map(function (k) { return counts[k] > 1 ? counts[k] + ' ' + k.toLowerCase() + 's' : 'a ' + k.toLowerCase(); }).join(', ');
    }
    function hudOn() {
      hud.classList.add('on');
      foesBox.innerHTML = '';
      B.foes.forEach(function (f, i) {
        if (f.dead) return;
        var e = document.createElement('button'); e.type = 'button'; e.className = 'foe' + (B.phase === 'target' && i === B.target ? ' on' : '');
        e.textContent = f.foe.name;
        e.addEventListener('click', function () { if (B && B.phase === 'target') { B.target = i; confirmTarget(); } });
        e.addEventListener('mouseenter', function () { if (B && B.phase === 'target') { B.target = i; showScenario(); hudOn(); } });
        foesBox.appendChild(e);
      });
      partyBox.innerHTML = '<div class="rpg-row"><span>Vee</span><span>HP <b>' + save.hp + '</b>/' + maxHp() + '</span></div><div class="rpg-row sm"><span>Lv ' + save.lvl + '</span><span>' + save.known.length + (save.known.length === 1 ? ' command' : ' commands') + '</span><span>' + (B.focus ? 'Weak spot marked' : '') + '</span></div>';
    }
    function menu(which) {
      B.menu = which; B.sel = 0; cmdBox.innerHTML = '';
      var list = which === 'main' ? [
          { label: 'Fight', tip: 'A plain attack at Vee’s regular strength.', fn: function () { chooseTarget('fight'); } },
          { label: 'Shell', tip: 'Open a shell and type the command that solves a bug’s problem. Right: a bonus attack. Wrong: half power.', fn: function () { chooseTarget('cmd'); } },
          { label: 'Item', tip: 'Coffee, and anything found in the debris.', fn: function () { menu('items'); } },
          { label: 'Run', tip: 'Slip away into the dark.', fn: runAway }]
        : [{ label: 'Coffee', right: 'x' + save.coffee, off: !save.coffee, tip: 'Restores 25 HP.', fn: function () { item('coffee'); } }, { label: 'Back', fn: function () { menu('main'); } }];
      cmdBox.classList.toggle('wide', which !== 'main');
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
      [].forEach.call(cmdBox.querySelectorAll('button'), function (b, i) { b.className = i === B.sel ? 'on' : ''; });
      var o = B.list[B.sel]; if (o && o.tip) log(o.tip, true);
    }
    var logT = 0;
    function log(text, quiet) { titleEl.textContent = text; titleEl.classList.add('on'); clearTimeout(logT); if (!quiet) logT = setTimeout(function () { titleEl.classList.remove('on'); }, 2600); }
    function pop(text, x, y) { B.pops.push({ text: text, x: x, y: y, t: 0 }); }
    function hitFoe(f, n) {
      var crit = B.focus; if (crit) { n *= 2; B.focus = false; }
      if (f.exposed) n *= 1.5;
      n = Math.max(1, Math.round(n)); f.hp = Math.max(0, f.hp - n); f.shake = 1; f.flash = 1; pop(String(n), f.fx + 16, f.fy - 34);
      if (f.hp <= 0) { f.dead = true; f.fade = 1; }
      return crit ? ' Critical.' : '';
    }
    function base() { return rnd(9, 14) + save.lvl * 2; }
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
    termBox.querySelector('.q').addEventListener('click', cancelTarget);
    termBox.addEventListener('submit', function (e) { e.preventDefault(); if (B && B.phase === 'type') submitCmd(termIn.value); });
    function openPrompt(ti) {
      var f = B.foes[ti]; B.phase = 'type'; titleEl.classList.remove('on');
      termBox.querySelector('.sc').textContent = f.foe.name + ': ' + f.scenario;
      var chips = termBox.querySelector('.chips'); chips.innerHTML = '';
      save.known.slice().sort().forEach(function (c) { var b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.addEventListener('click', function () { termIn.value = c + ' '; termIn.focus(); }); chips.appendChild(b); });
      termIn.value = ''; termBox.classList.add('on'); setTimeout(function () { termIn.focus(); }, 30);
    }
    function closePrompt() { termBox.classList.remove('on'); termIn.blur(); }
    function submitCmd(raw) {
      var f = B.foes[B.target], line = norm(raw || ''), info = cmdInfo(f.cmd);
      if (f.cmd !== 'sudo') line = line.replace(/^sudo /, '');
      var typed = line.split(' ')[0].toLowerCase().replace(/^\.\//, ''), exact = f.sc0.ex.some(function (e) { return norm(e).replace(f.cmd !== 'sudo' ? /^sudo / : /^$/, '') === line; });
      closePrompt(); B.phase = 'anim'; B.cast = 1;
      if (typed === f.cmd) {
        var n = base() * (exact ? 2 : 1.5), fxid = info.fx, msg2 = (exact ? 'Exact. ' : '$ ' + typed + '. ') + info.hit, extra = '';
        if (fxid === 'multi2' || fxid === 'multi3') {
          var hits = fxid === 'multi3' ? 3 : 2, k3 = 0, per = n / (hits === 3 ? 2.1 : 1.6);
          log(msg2); hitFoe(f, per);
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
      } else {
        log((typed ? '$ ' + typed + '. Not quite. ' : 'Nothing typed. ') + 'This one called for: ' + f.sc0.ex[0] + '. Half power.' + hitFoe(f, base() * .5));
      }
      after();
    }
    function after() { hudOn(); setTimeout(!living().length ? win : foesTurn, 900); }
    function item(which) {
      B.phase = 'anim'; cmdBox.classList.remove('on');
      if (which === 'coffee' && save.coffee) { save.coffee--; var h = Math.min(maxHp() - save.hp, 25); save.hp += h; pop('+' + h, 258, 70); log('Vee drinks a coffee. +' + h + ' HP.'); }
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
        var n = Math.max(1, Math.round(rnd(f.foe.atk[0], f.foe.atk[1]) * f.soft * (f.slow > 0 ? .5 : 1) * (B.guard ? .5 : 1))); if (f.slow > 0) f.slow--;
        save.hp = Math.max(0, save.hp - n); pop(String(n), 258, 70); B.hurt = 1; f.lunge = 1;
        log('The ' + foeName(f) + ' ' + f.foe.move + '. ' + n + ' damage.'); hudOn();
        if (save.hp <= 0) return setTimeout(lose, 900);
        setTimeout(next, 800);
      })();
    }
    function myTurn() { if (!B) return; B.guard = 0; B.phase = 'menu'; menu('main'); hudOn(); }
    function win() {
      var xp = 0, n = B.foes.length; B.foes.forEach(function (f) { xp += f.foe.xp + rnd(0, 3); });
      save.xp += xp; save.wins += n; save.linux += n; save.bw++;
      var lines = ['The rot clears. Vee gains ' + xp + ' XP.'];
      if (Math.random() < .2 + n * .05) { save.coffee++; lines.push('Something useful in the debris: a coffee.'); }
      while (save.xp >= xpNeed()) {
        save.xp -= xpNeed(); save.lvl++; save.hp = maxHp();
        lines.push('LEVEL UP. Vee is now level ' + save.lvl + '. Max HP ' + maxHp() + '.');
        var nc = nextCmd(); if (nc) { save.known.push(nc.cmd); lines.push('New command: ' + nc.cmd + '. ' + nc.learn, 'Bugs can now bring problems that need ' + nc.cmd + '.'); }
      }
      lines.push('Next level in ' + (xpNeed() - save.xp) + ' XP.');
      store(); B.phase = 'done'; cmdBox.classList.remove('on'); hud.classList.remove('on'); closePrompt();
      setTimeout(function () { say('', lines, null, endBattle); }, 600);
    }
    function lose() {
      B.phase = 'done'; cmdBox.classList.remove('on'); hud.classList.remove('on'); closePrompt();
      say('', ['Vee’s process halts.', 'Somewhere, a watchdog notices. He restarts at the spire.'], null, function () { save.hp = maxHp(); store(); me.x = 5; me.y = 4; me.px = me.x * TS; me.py = me.y * TS; me.dir = 'down'; endBattle(); });
    }
    function endBattle() { store(); B = null; closePrompt(); hud.classList.remove('on'); cmdBox.classList.remove('on'); titleEl.classList.remove('on'); mode = 'map'; me.safe = 5; }

    /* ---------- loop and drawing ---------- */
    var mode = 'map', raf = 0, last = 0, swirlT = 0, keys = {}, held = null;
    function drawMap() {
      cx.drawImage(mapCanvas, 0, 0);
      // NPC: a townsperson, drawn simply
      var nx = npc.x * TS, ny = npc.y * TS;
      var tnow = performance.now() / 1000;
      drawLive(tnow);
      // Ada, a hologram on a light pad
      cx.fillStyle = 'rgba(220,220,236,.25)'; cx.beginPath(); cx.ellipse(nx + 8, ny + 15, 7, 2.5, 0, 0, 7); cx.fill();
      cx.globalAlpha = Math.random() < .06 ? .35 : .78;
      cx.fillStyle = '#dcdce8'; cx.fillRect(nx + 5, ny + 1, 6, 6); cx.fillStyle = '#5a5a6a'; cx.fillRect(nx + 6, ny + 3, 1, 1); cx.fillRect(nx + 9, ny + 3, 1, 1);
      cx.fillStyle = '#a8a8bc'; cx.fillRect(nx + 4, ny + 7, 8, 6); cx.fillRect(nx + 5, ny + 13, 2, 2); cx.fillRect(nx + 9, ny + 13, 2, 2);
      cx.fillStyle = 'rgba(10,10,16,.5)'; for (var sl = 0; sl < 14; sl += 2) cx.fillRect(nx + 4, ny + 1 + sl, 8, 1);
      cx.globalAlpha = 1;
      // Vee, feet on the tile
      var v = veeImg(), vx = me.px - 3, vy = me.py - 10 - (v.bob ? 1 : 0);
      cx.fillStyle = 'rgba(220,220,236,.16)'; cx.beginPath(); cx.ellipse(me.px + 8, me.py + 15, 7, 2.5, 0, 0, 7); cx.fill();
      drawSprite(v.img, vx, vy, v.flip);
      drawDecay(tnow);
      drawScan();
    }
    function drawBattle(dt) {
      var tt = performance.now() / 1000, hy = 64, gy2 = 126;   // horizon, and where the menus begin
      var g = cx.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, '#040406'); g.addColorStop(1, '#1e1e27'); cx.fillStyle = g; cx.fillRect(0, 0, W, hy);
      for (var s3 = 0; s3 < 22; s3++) { cx.fillStyle = 'rgba(236,236,246,' + (.15 + hs(s3) * .4) + ')'; cx.fillRect(Math.floor(hs(s3 * 3) * W), Math.floor(hs(s3 * 7) * (hy - 30)), 1, 1); }
      for (var sk = 0; sk < 16; sk++) {   // the distant skyline: tall and beautiful, many towers dark
        var bw = 8 + hs(sk * 3) * 12, bh = 16 + hs(sk * 7) * 34, bx2 = sk * 21 - 4, lit = hs(sk * 11) > .45;
        cx.fillStyle = '#101017'; cx.fillRect(bx2, hy - bh, bw, bh); cx.fillStyle = lit ? 'rgba(220,220,236,.45)' : 'rgba(80,80,92,.3)'; cx.fillRect(bx2, hy - bh, 1, bh);
        if (lit) for (var wy2 = hy - bh + 3; wy2 < hy - 3; wy2 += 4) if (hs(sk * 13 + wy2) > .6) { cx.fillStyle = 'rgba(230,230,242,.4)'; cx.fillRect(bx2 + 3, wy2, 1, 1); }
      }
      var ax = W * .7 + ((tt * 3) % 80), ay = 14 - ((tt * .8) % 10);   // the Lift, rising Upstream
      cx.fillStyle = 'rgba(240,240,248,.85)'; cx.fillRect(Math.floor(ax), Math.floor(ay), 6, 2); cx.fillStyle = 'rgba(240,240,248,.25)'; cx.fillRect(Math.floor(ax) - 9, Math.floor(ay) + 1, 9, 1);
      var fg = cx.createLinearGradient(0, hy, 0, H); fg.addColorStop(0, '#16161d'); fg.addColorStop(1, '#0a0a0e'); cx.fillStyle = fg; cx.fillRect(0, hy, W, H - hy);
      cx.fillStyle = 'rgba(236,236,246,.55)'; cx.fillRect(0, hy, W, 1);
      for (var j = -18; j <= 18; j++) { cx.strokeStyle = 'rgba(220,220,236,' + (.16 - Math.abs(j) * .006) + ')'; cx.beginPath(); cx.moveTo(W / 2 + j * 9 + .5, hy); cx.lineTo(W / 2 + j * 34 + .5, H); cx.stroke(); }
      for (var q = 0; q < 9; q++) { var z = (q + (tt * .25) % 1) / 9, yz = Math.floor(hy + (H - hy) * z * z) + .5; cx.strokeStyle = 'rgba(220,220,236,' + (.04 + z * .2) + ')'; cx.beginPath(); cx.moveTo(0, yz); cx.lineTo(W, yz); cx.stroke(); }
      // cracks in the floor: the decline reaches here too
      cx.fillStyle = '#050507'; [[60, 80, 14], [180, 96, 10], [130, 118, 18], [228, 84, 8]].forEach(function (c3) { cx.fillRect(c3[0], c3[1], c3[2], 1); cx.fillRect(c3[0] + 3, c3[1] + 1, Math.floor(c3[2] / 2), 1); });
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
      if (mode !== 'map' || talking) return;
      if (me.moving) {
        var tx = me.x * TS, ty = me.y * TS, sp = 70 * dt;
        me.px += Math.sign(tx - me.px) * Math.min(sp, Math.abs(tx - me.px)); me.py += Math.sign(ty - me.py) * Math.min(sp, Math.abs(ty - me.py)); me.step++;
        if (me.px === tx && me.py === ty) {
          me.moving = false; me.steps++;
          if (tile(me.x, me.y) === '>') { me.x--; me.moving = true; say('', ['The east districts are walled off. Four landmarks are somewhere past the dark.']); return; }
          if (tile(me.x, me.y) === ',' && --me.safe <= 0 && Math.random() < .16) { startBattle(); return; }
        }
      }
      if (!me.moving && held) tryMove(held);
    }
    function tryMove(d) {
      me.dir = d; var v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d], nx = me.x + v[0], ny = me.y + v[1];
      if (solid(nx, ny) || (nx === npc.x && ny === npc.y)) return;
      me.x = nx; me.y = ny; me.moving = true;
    }
    function loop(ts) {
      var dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
      update(dt);
      if (mode === 'map') drawMap(); else if (mode === 'swirl') drawSwirl(dt); else drawBattle(dt);
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
      if (mode === 'map') { if (k === 'a') interact(); else if (k !== 'b') held = k; }
    }
    function release(k) { if (held === k) held = null; }
    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('open')) return;
      if (B && B.phase === 'type') { if (e.key === 'Escape') { e.preventDefault(); cancelTarget(); } e.stopPropagation(); return; }
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
      if (mode === 'map' && !talking) {
        if (!save.met) { save.met = true; store(); say('', ['Meridian was built to be the most beautiful place on the network. For a while, it was.', 'Then the people who owned it took the Lift Upstream, to a newer world, and stopped paying for this one.', 'Nothing broken was ever fixed again. The rot set in. Last night, the signal at the heart of the city went quiet.', 'You are Vee, a maintenance process nobody remembered to shut down. You know one command so far: whoami. You will learn more. ' + (coarse ? 'Use the pad to move and A to talk.' : 'Arrow keys to move. Enter or Z to talk.')]); }
        else say('', ['Vee reconnects. Meridian is still here, for now. Level ' + save.lvl + '.']);
      }
      root.querySelector('.rpg-x').focus({ preventScroll: true });
    }
    function close() {
      root.classList.remove('show'); document.body.style.overflow = ''; held = null;
      setTimeout(function () { if (!root.classList.contains('show')) { root.classList.remove('open'); cancelAnimationFrame(raf); } }, 400);
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }
    window.__quest = { battle: function (n) { startBattle(n); }, state: function () { return { mode: mode, B: B, me: me, talking: !!talking, save: save }; }, press: press, release: release, advance: advance };
    return { open: open, close: close };
  })();
})();
