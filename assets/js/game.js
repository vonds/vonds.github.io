/* Hidden game: click the logo in the hero. Endless run across 15 levels. */
(function () {
  'use strict';
  var host = document.createElement('div');
  host.innerHTML = '<div class="gm" id="gm" role="dialog" aria-modal="true" aria-label="Game"><div class="scr"><canvas id="cv" tabindex="-1"></canvas><span class="seam a"></span><span class="seam b"></span></div><button class="x" id="gx" type="button" aria-label="Close game"><i></i><i></i></button><div class="meta"><span id="gname"></span><span class="lg">Space or tap to jump · hold to go higher · Esc to exit</span><span class="sm">Tap to jump · hold to go higher</span></div></div>';
  document.body.appendChild(host.firstChild);
  var cv = document.getElementById('cv'), ctx = cv.getContext('2d');
  var gm = document.getElementById('gm');
  var W = 0, H = 0, DPR = 1, k = 1, GY = 0;

  /* ---------- helpers ---------- */
  function hs(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function mod(a, n) { return ((a % n) + n) % n; }
  var LOGO = new Path2D('M120 80 L200 160 L280 80 M120 140 L200 220 L280 140');
  function logo(c, cx, cy, size, color, lw) {
    var s = size / 190;
    c.save(); c.translate(cx, cy); c.scale(s, s); c.translate(-200, -150);
    c.strokeStyle = color; c.lineWidth = lw || 24; c.lineJoin = 'miter'; c.stroke(LOGO); c.restore();
  }
  // pixel-art copy of the logo for the terminal version
  var pix = document.createElement('canvas'); pix.width = 15; pix.height = 14;
  (function () { var p = pix.getContext('2d'); logo(p, 7.5, 7, 15, '#d8d8d8', 34); })();


  /* ---------- the sprite: a round, chibi Vonds with long locs ---------- */
  // 20 x 24 pixel grid facing right; letters are palette slots
  var HEAD = { r: 1, rows: [
    '........HHHHH.......',
    '......HHhHHHHHH.....',
    '.....HHhHHHHHHHH....',
    '....HHHHHHHHHHHHH...',
    '....HHHHHSSSSSSSH...',
    '...HHHHHSSSSSSSSS...',
    '...HHHHSSSSSSESSSS..',
    '...HHHHSKSSSSESSSS..',
    '...HHHHSSSSSSSSSSS..',
    '...HHHHSSSSSSSSRSS..',
    '....HHHSSSSSSSSSS...',
    '.....HHHSSSSSSSS....',
    '.........SSSS.......'] };
  var BODY = { r: 13, rows: [
    '........TTTTT.......',
    '.......TTTTTTT......',
    '......TTTTTTTTT.....',
    '......TTTTTTTTT.....',
    '......TTTTTTTTT.....',
    '.......LLLLLLL......'] };
  var BEARD = {
    none:  { r: 0, rows: [] },
    short: { r: 10, rows: ['.........F..........', '.........FFF.FFFF...', '..........FFFFFF....', '...........FFFF.....'] },
    full:  { r: 9, rows: ['.........F..........', '.........FF.....F...', '.........FFFFFFFFF..', '..........FFFFFFF...', '...........FFFFF....', '............FFF.....'] }
  };
  var SCARF = { r: 13, rows: ['........XXXXXX......', '.......XxXXXXX......', '........XX..........', '........Xx..........'] };
  var GLASSES = { r: 6, rows: ['............GGGG....', '.........GGGG..G....', '............GGGG....'] };
  // locs: strands of 2px hanging from the back of the head; length set by LOOK.locs
  var STRANDS = [[1, 8, .95], [4, 7, 1.05], [7, 9, .85]];
  var FRONT = [8, 12, .5];   // one strand that falls in front of the shoulder
  var ARM = { fwd: [[0,0],[1,0],[2,1],[3,1]], mid: [[0,0],[0,1],[0,2],[0,3]], back: [[0,0],[-1,1],[-2,1],[-3,2]], up: [[0,0],[1,-1],[2,-2],[2,-3]], point: [[0,0],[1,0],[2,-1],[3,-1],[4,-2],[5,-2],[6,-3],[7,-4],[8,-4]] };
  var LEG = {
    down:  [[[9,19],[10,19],[9,20],[10,20],[9,21],[10,21]], [[9,22],[10,22],[11,22]]],
    fwd:   [[[11,19],[12,19],[12,20],[13,20],[13,21],[14,21]], [[13,22],[14,22],[15,22]]],
    back:  [[[9,19],[10,19],[8,20],[9,20],[7,21],[8,21]], [[5,22],[6,22],[7,22]]],
    up:    [[[10,19],[11,19],[9,20],[10,20],[8,20]], [[7,20],[7,21],[8,21]]],
    tuck:  [[[11,19],[12,19],[12,20],[13,20]], [[12,21],[13,21],[14,21]]],
    trail: [[[9,19],[8,20],[7,20]], [[5,21],[6,21],[7,21]]]
  };
  var POSE = {
    run0: { bl: 'back', fl: 'fwd',  ba: 'fwd',  fa: 'back', bob: 0,  sway: 1 },
    run1: { bl: 'up',   fl: 'down', ba: 'mid',  fa: 'mid',  bob: -1, sway: 0 },
    run2: { bl: 'fwd',  fl: 'back', ba: 'back', fa: 'fwd',  bob: 0,  sway: 1 },
    run3: { bl: 'down', fl: 'up',   ba: 'mid',  fa: 'mid',  bob: -1, sway: 2 },
    jump: { bl: 'trail', fl: 'tuck', ba: 'back', fa: 'up',  bob: 0,  sway: 3, lift: 3 },
    fall: { bl: 'back', fl: 'fwd',  ba: 'up',   fa: 'up',   bob: 0,  sway: -1, lift: 2 },
    idle: { bl: 'down', fl: 'down', ba: 'mid',  fa: 'mid',  bob: 0,  sway: 0 },
    idle2:{ bl: 'down', fl: 'down', ba: 'mid',  fa: 'mid',  bob: -1, sway: 0 },
    point:{ bl: 'down', fl: 'down', ba: 'mid',  fa: 'point', bob: 0, sway: 0 },
    point2:{ bl: 'down', fl: 'down', ba: 'mid', fa: 'point', bob: -1, sway: 1 }
  };
  // extra pieces used by the ten versions
  var HOODDOWN = { r: 11, rows: ['....OOOOO...........', '...OOOOOOO..........', '...OoOOOOO..........', '....OOOO............'] };
  var HOODUP = { r: 1, rows: [
    '.......OOOOOO.......', '.....OOOOOOOOO......', '....OOOOOOOOOOO.....', '...OOOOOOOOOOOOo....', '...OOOOOOo..........',
    '..OOOOOOo...........', '..OOOOOo............', '..OOOOOo............', '..OOOOOo............', '..OOOOOOo...........', '...OOOOOOo..........', '....OOOOOO..........'] };
  var BEANIE = { r: 0, rows: ['.........NN.........', '.......NNNNNN.......', '.....NNNNNNNNNN.....', '....NNNNNNNNNNNN....', '....nNnNnNnNnNnNn...'] };
  var PHONES = { r: 0, rows: ['.........DD.........', '........D...........', '.......D............', '.......D............', '.......D............', '......DDD...........', '......DdD...........', '......DdD...........', '......DDD...........'] };
  var ROUND = { r: 6, rows: ['............GGG.....', '.........GGG...G....', '...........G...G....', '............GGG.....'] };
  var PACK = { r: 13, rows: ['....YYYY............', '...YyYYYY...........', '...YYYYYY...........', '...YyYYYY...........', '...YYYYYY...........', '....YYYY............'] };
  var STRAP = { r: 13, rows: ['.........Y..........', '.........YY.........', '..........Y.........'] };
  var SHIRT = { r: 13, rows: ['..........WWl.......', '..........lWl.......', '...........Wl.......'] };
  var BASE = { skin: '#563520', hairc: '#141414', pants: '#2b2b30', shoes: '#f2f2f2', top: '#4a4a50' };
  var VERSIONS = [
    { name: 'Classic', scarf: true },
    { name: 'Hoodie', top: '#2e2e33', hoodDown: true },
    { name: 'Beanie', top: '#3a3a40', beanie: true },
    { name: 'Tied up', top: '#5c5c62', pony: true },
    { name: 'Headphones', top: '#a2a2a8', phones: true, sleeves: 'short' },
    { name: 'Hacker', top: '#000000', hoodUp: true, round: true },
    { name: 'Traveler', top: '#6e6e74', pack: true },
    { name: 'Consultant', top: '#1c1c20', blazer: true, cuffs: true },
    { name: 'Big eyes', scarf: true, big: true },
    { name: 'Silhouette', sil: true }
  ];
  function look(i) { var v = VERSIONS[i], o = {}, kk; for (kk in BASE) o[kk] = BASE[kk]; for (kk in v) o[kk] = v[kk]; return o; }
  var CUR = 4;
  try { var savedV = +localStorage.getItem('vonds-sprite-v2'); if (savedV >= 0 && savedV < 10) CUR = savedV; } catch (e) {}
  var LOOK = look(CUR);
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function rgb(c) { return 'rgb(' + c.map(Math.round).join(',') + ')'; }
  function shade(h, f) { return rgb(hex(h).map(function (v) { return clamp(f > 0 ? v + (255 - v) * f : v * (1 + f), 0, 255); })); }
  function palette(L) {
    var p = { S: L.skin, K: shade(L.skin, -.2), R: shade(L.skin, .22), E: '#0a0a0a', H: L.hairc, h: L.hairc, F: L.hairc,
      G: '#e8e8e8', W: '#f2f2f2', X: shade(L.top, -.5), x: shade(L.top, -.25), T: L.top, A: shade(L.top, .16), a: shade(L.top, -.38),
      O: L.hoodUp ? '#0e0e10' : shade(L.top, .1), o: L.hoodUp ? '#5a5a60' : shade(L.top, .32), N: '#3c3c42', n: '#55555c', D: '#d0d0d4', d: '#6a6a70', Y: '#2a2a2e', y: '#4a4a50', l: shade(L.top, .25),
      L: shade(L.pants, -.3), P: L.pants, Q: shade(L.pants, -.4), B: L.shoes, b: shade(L.shoes, -.45) };
    for (var key in p) {
      var c = p[key].charAt(0) === '#' ? hex(p[key]) : p[key].match(/\d+/g).map(Number);
      var y = (c[0] * .3 + c[1] * .59 + c[2] * .11) / 255, ex = 'SKR'.indexOf(key) >= 0 ? .78 : .55; p[key] = rgb([1, 1, 1].map(function () { return 30 + 225 * Math.pow(y, ex); }));
    }
    p.H = 'rgb(66,66,70)'; p.h = 'rgb(112,112,118)'; p.E = 'rgb(8,8,8)'; p.W = 'rgb(242,242,242)';
    p.D = 'rgb(14,14,16)'; p.d = 'rgb(54,54,58)';   // headphones: black band and cups
    if (L.sil) { for (var s2 in p) p[s2] = 'rgb(10,10,11)'; p.W = 'rgb(242,242,242)'; }
    return p;
  }
  var cache = {};
  function frame(name, L, onLight) {
    L = L || LOOK;
    var lightBg = onLight || !!(T && T.light), key = L.name + name + (lightBg ? 'L' : 'D');
    if (cache[key]) return cache[key];
    var pal = palette(L), cvs = document.createElement('canvas'); cvs.width = 22; cvs.height = 26;
    var c = cvs.getContext('2d'), pose = POSE[name], oy = 1 + pose.bob;
    function px(x, y, ch) { if (ch && pal[ch]) { c.fillStyle = pal[ch]; c.fillRect(x + 1, y + oy, 1, 1); } }
    function map(m) { m.rows.forEach(function (row, i) { for (var x = 0; x < 20; x++) { var ch = row.charAt(x); if (ch !== '.') px(x, m.r + i, ch); } }); }
    function strand(st, idx) {
      var len = Math.round(11 * st[2]), lift = pose.lift || 0, slant = st[3] || 0;
      for (var i = 0; i < len; i++) {
        var t = i / len, dx = -Math.round(pose.sway * t * 1.6) - Math.round(lift * t * t * 2) + Math.round(slant * Math.min(t * 3, 1)), dy = -Math.round(lift * t * t * 2.2);
        var x = st[0] + dx, y = st[1] + i + dy, ch = (i + idx) % 3 === 0 ? 'h' : 'H';
        if (L.cuffs && (i === 3 || i === 7)) ch = 'W';
        px(x, y, ch); if (i < len - 1) px(x + 1, y, ch === 'W' ? 'W' : 'H');
      }
    }
    function arm(type, sx, ch) { var cells = ARM[type]; cells.forEach(function (cl, i) { var hand = i === cells.length - 1, cc = hand || (L.sleeves === 'short' && i >= 2) ? 'S' : ch; px(sx + cl[0], 15 + cl[1], cc); if (!hand) px(sx + cl[0], 16 + cl[1], cc); }); }
    function leg(type, ch, shoe) { var l = LEG[type]; l[0].forEach(function (cl) { px(cl[0], cl[1], ch); }); l[1].forEach(function (cl) { px(cl[0], cl[1], shoe); }); }
    if (L.pack) map(PACK);
    if (!L.pony) STRANDS.forEach(function (st, i) { strand(st, i); });
    arm(pose.ba, 9, 'a'); leg(pose.bl, 'Q', 'b');
    map(BODY); map(HEAD);
    if (L.pony) { strand([3, 3, .95, -3], 0); strand([5, 3, .8, -2], 1); px(5, 3, 'D'); px(6, 3, 'D'); }
    if (L.blazer) map(SHIRT);
    if (L.pack) map(STRAP);
    if (L.scarf) map(SCARF);
    if (L.hoodDown) { map(HOODDOWN); px(11, 14, 'W'); px(11, 15, 'W'); px(11, 16, 'W'); }
    if (L.hoodUp) { map(HOODUP); strand([7, 12, .5], 2); }
    if (L.beanie) map(BEANIE);
    if (L.phones) map(PHONES);
    if (L.round) map(ROUND);
    if (L.big) { px(13, 7, 'E'); px(14, 7, 'W'); px(13, 8, 'E'); px(14, 8, 'E'); px(15, 10, 'R'); px(16, 10, 'R'); px(16, 11, 'E'); }
    else if (L.sil) { px(13, 7, 'W'); px(13, 8, 'W'); }
    else { px(13, 7, 'E'); px(13, 8, 'E'); }
    if (!L.hoodUp && !L.pony) strand(FRONT, 1);
    leg(pose.fl, 'P', 'B'); arm(pose.fa, 11, 'A');
    var id = c.getImageData(0, 0, 22, 26), d = id.data, out = [];
    for (var y = 0; y < 26; y++) for (var x = 0; x < 22; x++) {
      if (d[(y * 22 + x) * 4 + 3]) continue;
      if ([[1,0],[-1,0],[0,1],[0,-1]].some(function (o) { var xx = x + o[0], yy = y + o[1]; return xx >= 0 && yy >= 0 && xx < 22 && yy < 26 && d[(yy * 22 + xx) * 4 + 3] > 200; })) out.push(x, y);
    }
    c.fillStyle = L.sil ? 'rgba(242,242,242,.92)' : lightBg ? 'rgba(20,20,22,.55)' : 'rgba(236,236,236,.38)'; for (var i = 0; i < out.length; i += 2) c.fillRect(out[i], out[i + 1], 1, 1);
    return (cache[key] = cvs);
  }
  function P() { return Math.max(2, Math.round(2.9 * k * DPR)) / DPR; }
  function drawSprite(c, x, feet, name, glow) {
    var p = P(), img = frame(name);
    c.save(); c.imageSmoothingEnabled = false;
    if (glow) { c.shadowColor = 'rgba(255,255,255,.35)'; c.shadowBlur = 16; }
    c.drawImage(img, Math.round((x - 12 * p) * DPR) / DPR, Math.round((feet - 24 * p) * DPR) / DPR, 22 * p, 26 * p);
    c.restore();
  }
  function poseNow() {
    if (!st || st.mode === 'ready') return Math.floor((st ? st.t : 0) * 2.2) % 2 ? 'idle2' : 'idle';
    if (st.mode === 'over') return 'fall';
    if (!st.grounded) return st.vy < 120 * k ? 'jump' : 'fall';
    return 'run' + (Math.floor(st.d / (26 * k)) % 4);
  }

  /* ---------- the setting-sun version ---------- */
  var THEMES = [
    { id: 'signal', name: 'Signal Run', over: 'Signal lost', hud: '#e8e8e8', ink: '#e8e8e8',
      font: '500 13px Dosis', gaps: false,
      obs: function () { var t = Math.random(); return t < .55 ? { w: rnd(18, 26), h: rnd(34, 50) } : t < .85 ? { w: rnd(40, 60), h: rnd(26, 36) } : { w: rnd(16, 20), h: rnd(56, 66) }; },
      bg: function (c, t, d) {
        c.fillStyle = '#0b0b0c'; c.fillRect(0, 0, W, H);
        for (var i = 0; i < 70; i++) { var x = mod(hs(i) * W * 3 - d * (.03 + hs(i + 9) * .05), W), y = hs(i + 3) * GY * .85; c.fillStyle = 'rgba(232,232,232,' + (.15 + hs(i + 5) * .45) + ')'; c.fillRect(x, y, 1.4, 1.4); }
      },
      ground: function (c, segs, d) {
        c.fillStyle = '#e8e8e8'; segs.forEach(function (s) { c.fillRect(s.x, GY, s.w, 1.5); });
        c.fillStyle = 'rgba(232,232,232,.35)';
        for (var i = 0; i < 40; i++) { var x = mod(i * 61 * k - d, W + 60) - 30; c.fillRect(x, GY + 8 + hs(i) * 18 * k, (2 + hs(i + 1) * 8) * k, 1); }
      },
      ob: function (c, o) {
        var y = GY - o.h; c.fillStyle = '#e8e8e8'; c.fillRect(o.x, y, o.w, o.h);
        c.fillStyle = '#0b0b0c';
        for (var r = 0, yy = y + 7 * k; yy < GY - 3; yy += 9 * k, r++) c.fillRect(o.x + (r % 2 ? 0 : o.w / 2), yy, 1.5, 9 * k), c.fillRect(o.x, yy, o.w, 1.5);
      },
      player: function (c, x, y, sz, name, ghost) { drawSprite(c, x, y + sz * .42, name || poseNow(), false); }
    },
    { id: 'descent', name: 'Descent Grid', over: 'Connection reset', hud: '#f0f0f0', ink: '#ffffff',
      font: '500 13px Dosis', gaps: false, trail: true,
      obs: function () { return Math.random() < .6 ? { w: rnd(26, 36), h: rnd(32, 48), kind: 'tri' } : { w: rnd(30, 44), h: rnd(30, 44), kind: 'cube' }; },
      bg: function (c, t, d) {
        var g = c.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, '#030304'); g.addColorStop(1, '#1d1d21'); c.fillStyle = g; c.fillRect(0, 0, W, GY);
        var sx = W * .5, sy = GY - H * .02, r = H * .26;
        c.save(); c.beginPath(); c.rect(0, 0, W, GY); c.clip();
        var sg = c.createLinearGradient(0, sy - r, 0, sy + r); sg.addColorStop(0, '#f4f4f4'); sg.addColorStop(1, '#5a5a60');
        c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, r, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#18181b';
        for (var i = 0; i < 7; i++) { var yy = sy - r * .1 + i * r * .16, hh = 1.5 + i * 1.6; c.fillRect(sx - r, yy, r * 2, hh * k); }
        c.restore();
        c.fillStyle = '#050506'; c.fillRect(0, GY, W, H - GY);
        c.save(); c.beginPath(); c.rect(0, GY, W, H - GY); c.clip();
        var vx = W * .5, vy = GY - 1;
        c.lineWidth = 1;
        for (var j = -22; j <= 22; j++) { c.strokeStyle = 'rgba(255,255,255,' + (.28 - Math.abs(j) * .009) + ')'; c.beginPath(); c.moveTo(vx + j * 6 * k, vy); c.lineTo(vx + j * W * .09, H); c.stroke(); }
        var off = mod(d * .0035, 1);
        for (var n = 0; n < 14; n++) { var z = (n + off) / 14, y2 = vy + (H - vy) * Math.pow(z, 2.4); c.strokeStyle = 'rgba(255,255,255,' + (.06 + z * .32) + ')'; c.beginPath(); c.moveTo(0, y2); c.lineTo(W, y2); c.stroke(); }
        c.restore();
      },
      ground: function (c) { c.save(); c.shadowColor = '#fff'; c.shadowBlur = 12; c.fillStyle = '#fff'; c.fillRect(0, GY - .5, W, 1.5); c.restore(); },
      ob: function (c, o) {
        c.save(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.shadowColor = '#fff'; c.shadowBlur = 14;
        var y = GY - o.h;
        if (o.kind === 'tri') { c.beginPath(); c.moveTo(o.x, GY); c.lineTo(o.x + o.w / 2, y); c.lineTo(o.x + o.w, GY); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(o.x + o.w / 2, y); c.lineTo(o.x + o.w * .62, GY); c.stroke(); }
        else { var e = o.w * .28; c.strokeRect(o.x, y + e, o.w - e, o.h - e); c.beginPath(); c.moveTo(o.x, y + e); c.lineTo(o.x + e, y); c.lineTo(o.x + o.w, y); c.lineTo(o.x + o.w, GY - e); c.lineTo(o.x + o.w - e, GY); c.moveTo(o.x + o.w - e, y + e); c.lineTo(o.x + o.w, y); c.stroke(); }
        c.restore();
      },
      sprite: true,
      player: function (c, x, y, sz, name, ghost) { drawSprite(c, x, y + sz * .42, name || poseNow(), !ghost); }
    },
    { id: 'terminal', name: 'Root Shell', over: 'Segmentation fault (core dumped)', hud: '#d8d8d8', ink: '#d8d8d8',
      font: '500 13px ui-monospace,Menlo,Consolas,monospace', gaps: false, mono: true,
      words: ['[ERR]', '0xDEAD', '{bug}', 'rm -rf', '404', 'NULL', 'sudo', ':(){ :|:& };:', 'EOF'],
      obs: function () { var w = this.words[(Math.random() * this.words.length) | 0]; return { label: w, w: 0, h: Math.random() < .3 ? 46 : 30 }; },
      bg: function (c, t, d) {
        c.fillStyle = '#0a0a0a'; c.fillRect(0, 0, W, H);
        c.font = 11 * k + 'px ui-monospace,Menlo,Consolas,monospace'; c.fillStyle = 'rgba(216,216,216,.07)';
        for (var i = 0; i < 9; i++) { var x = mod(hs(i) * W * 2 - d * .08, W + 200) - 100; c.fillText(['ssh root@vonds', 'chmod 700 ~/.ssh', 'journalctl -xe', 'grep -r signal', 'systemctl status', 'tar -xzf lab.tgz', 'ping 10.0.0.1', 'umask 027', 'ls -la /var/log'][i], x, 26 * k + hs(i + 4) * (GY - 60 * k)); }
      },
      ground: function (c, segs, d) {
        c.font = 14 * k + 'px ui-monospace,Menlo,Consolas,monospace'; c.fillStyle = '#d8d8d8';
        var step = 9 * k, s = mod(d, step);
        for (var x = -s; x < W; x += step) c.fillText('_', x, GY + 2);
        c.fillStyle = 'rgba(216,216,216,.25)';
        for (var i = 0; i < 26; i++) { var xx = mod(i * 47 * k - d, W + 40) - 20; c.fillText(i % 3 ? '.' : ',', xx, GY + 16 * k + hs(i) * 14 * k); }
      },
      ob: function (c, o) {
        c.font = 600 + ' ' + 12 * k + 'px ui-monospace,Menlo,Consolas,monospace';
        var y = GY - o.h; c.strokeStyle = '#d8d8d8'; c.lineWidth = 1; c.fillStyle = '#0a0a0a';
        c.fillRect(o.x, y, o.w, o.h); c.strokeRect(o.x + .5, y + .5, o.w - 1, o.h - 1);
        c.fillStyle = '#d8d8d8'; c.textAlign = 'center'; c.fillText(o.label, o.x + o.w / 2, y + o.h / 2 + 4 * k); c.textAlign = 'left';
      },
      player: function (c, x, y, sz, name, ghost) { drawSprite(c, x, y + sz * .42, name || poseNow(), false); },
      post: function (c, t) {
        c.fillStyle = 'rgba(255,255,255,.028)'; for (var y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
        var g = c.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .7); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        if (Math.random() < .04) { c.fillStyle = 'rgba(255,255,255,.025)'; c.fillRect(0, 0, W, H); }
      }
    },
    { id: 'ink', name: 'Ink and Paper', over: 'Smudged', hud: '#2e2e30', ink: '#151515',
      font: '500 13px Dosis', gaps: false, light: true,
      obs: function () { return Math.random() < .6 ? { w: rnd(26, 44), h: rnd(22, 38), kind: 'rock', seed: Math.random() * 99 } : { w: rnd(14, 22), h: rnd(40, 58), kind: 'reed', seed: Math.random() * 99 }; },
      bg: function (c, t, d) {
        c.fillStyle = '#eeebe4'; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(21,21,21,.18)'; c.lineWidth = 1; c.beginPath(); c.arc(W * .78, GY * .32, H * .08, 0, Math.PI * 2); c.stroke();
        var layers = [{ f: .08, col: 'rgba(21,21,21,.07)', a: .38, s: .004 }, { f: .2, col: 'rgba(21,21,21,.12)', a: .24, s: .007 }];
        layers.forEach(function (L, li) {
          c.fillStyle = L.col; c.beginPath(); c.moveTo(0, GY);
          for (var x = 0; x <= W; x += 8) { var u = (x + d * L.f) * L.s; var y = GY - H * L.a * (.55 + .3 * Math.sin(u) + .15 * Math.sin(u * 2.7 + li)); c.lineTo(x, y); }
          c.lineTo(W, GY); c.closePath(); c.fill();
        });
      },
      ground: function (c, segs, d) {
        c.fillStyle = '#e4e0d6'; c.fillRect(0, GY, W, H - GY);
        c.strokeStyle = '#151515'; c.lineCap = 'round';
        for (var p = 0; p < 2; p++) { c.lineWidth = p ? .8 : 2; c.beginPath(); for (var x = 0; x <= W; x += 6) { var y = GY + Math.sin((x + d) * .05 + p) * .9 + Math.sin((x + d) * .013) * 1.2 + p * 2; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
        c.fillStyle = 'rgba(21,21,21,.35)';
        for (var i = 0; i < 22; i++) { var xx = mod(i * 73 * k - d, W + 40) - 20; c.beginPath(); c.ellipse(xx, GY + 12 * k + hs(i) * 22 * k, (3 + hs(i + 2) * 9) * k, .9, 0, 0, Math.PI * 2); c.fill(); }
      },
      ob: function (c, o) {
        c.fillStyle = '#151515'; c.strokeStyle = '#151515';
        if (o.kind === 'rock') {
          c.beginPath(); var n = 9;
          for (var i = 0; i <= n; i++) { var a = Math.PI + (i / n) * Math.PI, rr = .82 + hs(o.seed + i) * .3; var px = o.x + o.w / 2 + Math.cos(a) * o.w / 2 * rr, py = GY + Math.sin(a) * o.h * rr; i ? c.lineTo(px, py) : c.moveTo(px, py); }
          c.closePath(); c.fill();
        } else {
          c.lineCap = 'round';
          for (var j = 0; j < 4; j++) { c.lineWidth = 2.2 - j * .35; var bx = o.x + j * o.w / 3.2, top = GY - o.h * (.6 + hs(o.seed + j) * .4); c.beginPath(); c.moveTo(bx, GY); c.quadraticCurveTo(bx + (j - 1.5) * 4, (GY + top) / 2, bx + (j - 1.5) * 7, top); c.stroke(); }
        }
      },
      player: function (c, x, y, sz, name, ghost) { drawSprite(c, x, y + sz * .42, name || poseNow(), false); }
    },
    { id: 'skyline', name: 'Rooftop Run', over: 'Missed the jump', hud: '#e8e8e8', ink: '#e8e8e8',
      font: '500 13px Dosis', gaps: true, trail: true,
      obs: function () { return Math.random() < .65 ? { w: rnd(30, 44), h: rnd(22, 30), kind: 'ac' } : { w: 10, h: rnd(48, 60), kind: 'ant' }; },
      bg: function (c, t, d) {
        var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#050506'); g.addColorStop(1, '#1b1b1f'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = '#e6e6e6'; c.beginPath(); c.arc(W * .82, H * .2, H * .06, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#0d0d0f'; c.beginPath(); c.arc(W * .82 + H * .025, H * .2 - H * .012, H * .055, 0, Math.PI * 2); c.fill();
        [{ f: .12, col: '#16161a', hi: .55, bw: 46, win: .12 }, { f: .32, col: '#202025', hi: .42, bw: 64, win: .3 }].forEach(function (L, li) {
          var bw = L.bw * k, sh = d * L.f, i0 = Math.floor(sh / bw) - 1;
          for (var i = i0; i < i0 + W / bw + 3; i++) {
            var x = i * bw - sh, h = GY * L.hi * (.45 + hs(i * 3.1 + li * 50) * .75), top = GY + 10 * k - h;
            c.fillStyle = L.col; c.fillRect(x, top, bw - 3 * k, H - top);
            if (hs(i + li * 7) > .7) c.fillRect(x + bw * .45, top - 14 * k, 1.5, 14 * k);
            c.fillStyle = 'rgba(230,230,230,' + L.win + ')';
            for (var wy = top + 8 * k; wy < GY; wy += 11 * k) for (var wx = x + 6 * k; wx < x + bw - 10 * k; wx += 9 * k) if (hs(wx * .13 + wy * .71 + i) > .78) c.fillRect(wx, wy, 3 * k, 4 * k);
          }
        });
      },
      ground: function (c, segs) {
        segs.forEach(function (s, i) {
          c.fillStyle = '#2c2c32'; c.fillRect(s.x, GY, s.w, H - GY);
          c.fillStyle = '#e8e8e8'; c.fillRect(s.x, GY, s.w, 1.5);
          c.fillStyle = 'rgba(230,230,230,.16)';
          for (var wy = GY + 16 * k; wy < H; wy += 14 * k) for (var wx = s.x + 10 * k; wx < s.x + s.w - 12 * k; wx += 12 * k) if (hs(wx * .07 + wy + s.id) > .7) c.fillRect(wx, wy, 4 * k, 5 * k);
          c.fillStyle = '#e8e8e8'; c.fillRect(s.x, GY, 1.5, 6 * k); c.fillRect(s.x + s.w - 1.5, GY, 1.5, 6 * k);
        });
      },
      ob: function (c, o) {
        var y = GY - o.h;
        if (o.kind === 'ac') { c.fillStyle = '#d4d4d8'; c.fillRect(o.x, y, o.w, o.h); c.fillStyle = '#2c2c32'; for (var gx = o.x + 4 * k; gx < o.x + o.w - 3 * k; gx += 4 * k) c.fillRect(gx, y + 4 * k, 1.2, o.h - 8 * k); }
        else { c.fillStyle = '#d4d4d8'; c.fillRect(o.x + o.w / 2 - 1, y, 2, o.h); c.fillRect(o.x, GY - 4 * k, o.w, 4 * k); c.fillRect(o.x + 1, y + o.h * .3, o.w - 2, 1.5); c.fillStyle = '#fff'; c.beginPath(); c.arc(o.x + o.w / 2, y, 2.4, 0, Math.PI * 2); c.fill(); }
      },
      player: function (c, x, y, sz, name, ghost) { drawSprite(c, x, y + sz * .42, name || poseNow(), !ghost); }
    },
    { id: 'data', name: 'Data Stream', group: 'cyber', over: 'Stream corrupted', hud: '#e8e8e8', ink: '#e8e8e8', gaps: false,
      obs: function () { var L = ['0xFF', '0x1F', 'NaN', '0b101', 'ACK', '0x00']; return { label: L[(Math.random() * L.length) | 0], w: 0, h: Math.random() < .35 ? 48 : 30 }; },
      bg: function (c, t, d) {
        c.fillStyle = '#060607'; c.fillRect(0, 0, W, H);
        var cw = 15 * k, n = Math.ceil(W / cw) + 1; c.font = 12 * k + 'px ui-monospace,Menlo,Consolas,monospace';
        for (var i = 0; i < n; i++) {
          var x = mod(i * cw - d * .05, W + cw) - cw, sp = 40 + hs(i) * 90, head = mod(t * sp * k + hs(i + 3) * H, GY + 160) - 40;
          for (var j = 0; j < 9; j++) { var y = head - j * 14 * k; if (y < 0 || y > GY - 4) continue; c.fillStyle = 'rgba(236,236,236,' + (j ? .3 * (1 - j / 9) : .85) + ')'; c.fillText(hs(i * 13 + j + Math.floor(t * 8)) > .5 ? '1' : '0', x, y); }
        }
      },
      ground: function (c, segs, d) {
        c.fillStyle = '#e8e8e8'; c.fillRect(0, GY, W, 1.5);
        c.font = 11 * k + 'px ui-monospace,Menlo,Consolas,monospace'; var step = 10 * k, i0 = Math.floor(d / step);
        for (var i = i0; i < i0 + W / step + 2; i++) { c.fillStyle = 'rgba(232,232,232,' + (.18 + hs(i) * .3) + ')'; c.fillText(hs(i * 7) > .5 ? '1' : '0', i * step - d, GY + 16 * k); }
      },
      ob: function (c, o) { var y = GY - o.h; c.fillStyle = '#060607'; c.fillRect(o.x, y, o.w, o.h); c.strokeStyle = '#e8e8e8'; c.lineWidth = 1; c.strokeRect(o.x + .5, y + .5, o.w - 1, o.h - 1); c.fillStyle = '#e8e8e8'; c.font = '600 ' + 12 * k + 'px ui-monospace,Menlo,Consolas,monospace'; c.textAlign = 'center'; c.fillText(o.label, o.x + o.w / 2, y + o.h / 2 + 4 * k); c.textAlign = 'left'; }
    },
    { id: 'firewall', name: 'Firewall', group: 'cyber', over: 'Access denied', hud: '#ececec', ink: '#ececec', gaps: false,
      obs: function () { return { w: rnd(28, 38), h: rnd(40, 58) }; },
      bg: function (c, t, d) {
        var g = c.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, '#050506'); g.addColorStop(1, '#202024'); c.fillStyle = g; c.fillRect(0, 0, W, GY);
        c.strokeStyle = 'rgba(230,230,230,.07)'; c.lineWidth = 1; var r = 18 * k, hx = r * 1.732, off = mod(d * .12, hx);
        for (var row = 0; row * r * 1.5 < GY; row++) for (var col = -1; col * hx < W + hx; col++) {
          var cx = col * hx - off + (row % 2 ? hx / 2 : 0), cy = row * r * 1.5; c.beginPath();
          for (var a = 0; a < 6; a++) { var an = Math.PI / 6 + a * Math.PI / 3; c.lineTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r); } c.closePath(); c.stroke();
        }
        var bw = 7 * k;
        for (var x = -mod(d * .3, bw); x < W; x += bw) { var i = Math.round((x + d * .3) / bw), h = (.15 + .85 * Math.abs(Math.sin(t * (2 + hs(i) * 3) + i))) * H * .22 * (.4 + hs(i + 1)); var fg = c.createLinearGradient(0, GY - h, 0, GY); fg.addColorStop(0, 'rgba(240,240,240,0)'); fg.addColorStop(1, 'rgba(240,240,240,.3)'); c.fillStyle = fg; c.fillRect(x, GY - h, bw - 2, h); }
      },
      ground: function (c, segs, d) { c.fillStyle = '#0b0b0c'; c.fillRect(0, GY, W, H - GY); c.fillStyle = '#ececec'; c.fillRect(0, GY, W, 2); c.fillStyle = 'rgba(236,236,236,.25)'; for (var x = -mod(d, 24 * k); x < W; x += 24 * k) c.fillRect(x, GY + 6 * k, 12 * k, 2); },
      ob: function (c, o) {
        var y = GY - o.h; c.fillStyle = '#ececec'; c.fillRect(o.x, y, 3, o.h); c.fillRect(o.x + o.w - 3, y, 3, o.h);
        for (var yy = y + 6 * k; yy < GY - 2; yy += 8 * k) c.fillRect(o.x, yy, o.w, 2);
        var lx = o.x + o.w / 2, ly = y - 9 * k; c.fillRect(lx - 5 * k, ly, 10 * k, 8 * k); c.strokeStyle = '#ececec'; c.lineWidth = 1.5; c.beginPath(); c.arc(lx, ly, 3.5 * k, Math.PI, 0); c.stroke();
      }
    },
    { id: 'circuit', name: 'Circuit Board', group: 'cyber', over: 'Short circuit', hud: '#e6e6e6', ink: '#e6e6e6', gaps: false,
      obs: function () { return Math.random() < .6 ? { w: rnd(34, 48), h: rnd(24, 34), kind: 'chip' } : { w: rnd(16, 20), h: rnd(34, 46), kind: 'cap' }; },
      bg: function (c, t, d) {
        c.fillStyle = '#0a0b0a'; c.fillRect(0, 0, W, H);
        var cs = 46 * k, sh = d * .25, i0 = Math.floor(sh / cs) - 1; c.lineWidth = 1.2;
        for (var i = i0; i < i0 + W / cs + 3; i++) for (var j = 0; j * cs < GY; j++) {
          var x = i * cs - sh, y = j * cs + 10 * k, r = hs(i * 31 + j * 7);
          if (r < .45) continue;
          c.strokeStyle = 'rgba(220,220,220,.13)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + cs * .6, y); c.lineTo(x + cs * .6 + (r > .7 ? cs * .4 : 0), y + (r > .7 ? cs * .4 : 0)); c.stroke();
          c.fillStyle = 'rgba(220,220,220,.25)'; c.beginPath(); c.arc(x, y, 2.2 * k, 0, Math.PI * 2); c.fill();
          var p = mod(t * .6 + r * 5, 1); if (r > .8) { c.fillStyle = 'rgba(245,245,245,.85)'; c.fillRect(x + cs * .6 * p - 1.5, y - 1.5, 3, 3); }
        }
      },
      ground: function (c, segs, d) { c.fillStyle = '#e6e6e6'; c.fillRect(0, GY, W, 1.5); c.fillRect(0, GY + 6 * k, W, 1); c.strokeStyle = '#e6e6e6'; c.lineWidth = 1; for (var x = -mod(d, 34 * k); x < W; x += 34 * k) { c.beginPath(); c.arc(x, GY + 14 * k, 3 * k, 0, Math.PI * 2); c.stroke(); } },
      ob: function (c, o) {
        var y = GY - o.h;
        if (o.kind === 'chip') { c.fillStyle = '#e6e6e6'; for (var px = o.x + 4 * k; px < o.x + o.w - 3 * k; px += 6 * k) c.fillRect(px, y - 4 * k, 2, o.h + 4 * k); c.fillStyle = '#18181a'; c.fillRect(o.x, y, o.w, o.h - 3 * k); c.strokeStyle = '#e6e6e6'; c.strokeRect(o.x + .5, y + .5, o.w - 1, o.h - 3 * k); c.fillStyle = '#e6e6e6'; c.beginPath(); c.arc(o.x + 6 * k, y + 6 * k, 2 * k, 0, Math.PI * 2); c.fill(); }
        else { c.fillStyle = '#d0d0d4'; c.fillRect(o.x, y + 4 * k, o.w, o.h - 4 * k); c.beginPath(); c.ellipse(o.x + o.w / 2, y + 4 * k, o.w / 2, 4 * k, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#18181a'; c.fillRect(o.x + o.w * .65, y + 6 * k, 3 * k, o.h - 10 * k); }
      }
    },
    { id: 'alley', name: 'Neon Alley', group: 'cyber', over: 'Flatlined', hud: '#ededed', ink: '#ededed', gaps: false, trail: true,
      obs: function () { return Math.random() < .55 ? { w: rnd(30, 40), h: rnd(28, 40), kind: 'crate' } : { w: rnd(40, 52), h: rnd(24, 30), kind: 'bar' }; },
      bg: function (c, t, d) {
        var g = c.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, '#030304'); g.addColorStop(1, '#17171b'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        [{ f: .1, col: '#111114', bw: 54, hi: .9 }, { f: .28, col: '#1b1b20', bw: 72, hi: .75 }].forEach(function (L, li) {
          var bw = L.bw * k, sh = d * L.f, i0 = Math.floor(sh / bw) - 1;
          for (var i = i0; i < i0 + W / bw + 3; i++) {
            var x = i * bw - sh, top = GY * (1 - L.hi * (.5 + hs(i * 5 + li * 9) * .5)); c.fillStyle = L.col; c.fillRect(x, top, bw - 4 * k, GY - top);
            if (hs(i + li * 3) > .55) { var on = .45 + .5 * (Math.sin(t * 3 + i) > -.6 ? 1 : 0); c.fillStyle = 'rgba(240,240,240,' + (li ? .7 : .35) * on + ')'; c.fillRect(x + bw * .2, top + 14 * k, 4 * k, (GY - top) * .35); }
            c.fillStyle = 'rgba(220,220,220,.14)'; for (var wy = top + 8 * k; wy < GY - 6 * k; wy += 10 * k) if (hs(i * 3 + wy) > .82) c.fillRect(x + bw * .55, wy, 6 * k, 2 * k);
          }
        });
        c.strokeStyle = 'rgba(230,230,230,.16)'; c.lineWidth = 1; c.beginPath();
        for (var r = 0; r < 110; r++) { var rx = mod(hs(r) * W * 1.3 - t * 140 * k, W + 40), ry = mod(hs(r + 50) * H + t * 520 * k, H); c.moveTo(rx, ry); c.lineTo(rx - 4 * k, ry + 14 * k); } c.stroke();
      },
      ground: function (c, segs, d) { c.fillStyle = '#0c0c0e'; c.fillRect(0, GY, W, H - GY); c.fillStyle = '#ededed'; c.fillRect(0, GY, W, 1.5); for (var i = 0; i < 18; i++) { var x = mod(i * 97 * k - d * .9, W + 60) - 30; c.fillStyle = 'rgba(237,237,237,' + (.06 + hs(i) * .14) + ')'; c.fillRect(x, GY + 4 * k, 3 * k, (H - GY) * (.4 + hs(i + 2) * .5)); } },
      ob: function (c, o) {
        var y = GY - o.h;
        if (o.kind === 'crate') { c.fillStyle = '#2a2a2f'; c.fillRect(o.x, y, o.w, o.h); c.strokeStyle = '#dcdce0'; c.lineWidth = 1.2; c.strokeRect(o.x + .5, y + .5, o.w - 1, o.h - 1); c.beginPath(); c.moveTo(o.x, y); c.lineTo(o.x + o.w, GY); c.moveTo(o.x + o.w, y); c.lineTo(o.x, GY); c.stroke(); }
        else { c.fillStyle = '#e4e4e8'; c.fillRect(o.x + 3 * k, y, 3 * k, o.h); c.fillRect(o.x + o.w - 6 * k, y, 3 * k, o.h); c.save(); c.beginPath(); c.rect(o.x, y + 2 * k, o.w, 9 * k); c.clip(); c.fillStyle = '#e4e4e8'; c.fillRect(o.x, y + 2 * k, o.w, 9 * k); c.fillStyle = '#111'; for (var sx = o.x - 10 * k; sx < o.x + o.w; sx += 10 * k) { c.beginPath(); c.moveTo(sx, y + 11 * k); c.lineTo(sx + 5 * k, y + 2 * k); c.lineTo(sx + 9 * k, y + 2 * k); c.lineTo(sx + 4 * k, y + 11 * k); c.fill(); } c.restore(); }
      }
    },
    { id: 'tunnel', name: 'Packet Tunnel', group: 'cyber', over: 'Packet dropped', hud: '#efefef', ink: '#efefef', gaps: false, trail: true,
      obs: function () { var L = ['SYN', 'ACK', 'RST', 'FIN', 'UDP']; return { label: L[(Math.random() * L.length) | 0], w: 0, h: rnd(30, 44) }; },
      bg: function (c, t, d) {
        c.fillStyle = '#030303'; c.fillRect(0, 0, W, H);
        var cx = W * .62, cy = GY * .62, N = 16; c.lineWidth = 1;
        for (var i = 0; i < N; i++) { var z = mod(i / N + d * .0012, 1), s = Math.pow(z, 2.2); var w2 = 18 * k + s * W * 1.1, h2 = 12 * k + s * H * 1.1; c.strokeStyle = 'rgba(240,240,240,' + (.04 + s * .4) + ')'; c.strokeRect(cx - w2 / 2, cy - h2 / 2, w2, h2); }
        c.strokeStyle = 'rgba(240,240,240,.1)'; c.beginPath(); [[0, 0], [W, 0], [0, H], [W, H], [W / 2 - W, cy], [W * 2, cy]].forEach(function (p) { c.moveTo(cx, cy); c.lineTo(p[0], p[1]); }); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(cx, cy, 2.2 * k, 0, Math.PI * 2); c.fill();
      },
      ground: function (c) { c.save(); c.shadowColor = '#fff'; c.shadowBlur = 10; c.fillStyle = '#efefef'; c.fillRect(0, GY, W, 1.5); c.restore(); c.fillStyle = 'rgba(3,3,3,.75)'; c.fillRect(0, GY + 1.5, W, H - GY); },
      ob: function (c, o) { var y = GY - o.h; c.save(); c.shadowColor = '#fff'; c.shadowBlur = 12; c.fillStyle = '#efefef'; c.fillRect(o.x, y, o.w, 6 * k); c.restore(); c.strokeStyle = '#efefef'; c.lineWidth = 1.2; c.strokeRect(o.x + .5, y + .5, o.w - 1, o.h - 1); c.fillStyle = '#efefef'; c.font = '600 ' + 12 * k + 'px ui-monospace,Menlo,Consolas,monospace'; c.textAlign = 'center'; c.fillText(o.label, o.x + o.w / 2, y + o.h / 2 + 7 * k); c.textAlign = 'left'; }
    },
    { id: 'server', name: 'Server Room', group: 'cyber', over: 'Kernel panic', hud: '#e6e6e6', ink: '#e6e6e6', gaps: false,
      obs: function () { return Math.random() < .6 ? { w: rnd(40, 54), h: rnd(20, 30), kind: 'unit' } : { w: rnd(30, 40), h: rnd(26, 34), kind: 'cable' }; },
      bg: function (c, t, d) {
        c.fillStyle = '#08080a'; c.fillRect(0, 0, W, H);
        var rw = 78 * k, sh = d * .35, i0 = Math.floor(sh / rw) - 1, top = GY * .1;
        for (var i = i0; i < i0 + W / rw + 3; i++) {
          var x = i * rw - sh; c.fillStyle = '#141418'; c.fillRect(x + 4 * k, top, rw - 8 * k, GY - top); c.strokeStyle = 'rgba(220,220,220,.12)'; c.strokeRect(x + 4.5 * k, top + .5, rw - 9 * k, GY - top);
          for (var u = 0, uy = top + 6 * k; uy < GY - 8 * k; uy += 10 * k, u++) {
            c.fillStyle = 'rgba(220,220,220,.06)'; c.fillRect(x + 9 * k, uy, rw - 18 * k, 7 * k);
            var on = Math.sin(t * (3 + hs(i * 40 + u) * 9) + hs(u + i) * 10) > .2; c.fillStyle = 'rgba(245,245,245,' + (on ? .85 : .15) + ')'; c.fillRect(x + rw - 16 * k, uy + 2.5 * k, 2 * k, 2 * k);
            if (hs(i + u * 3) > .6) { c.fillStyle = 'rgba(245,245,245,' + (Math.sin(t * 7 + u) > 0 ? .6 : .1) + ')'; c.fillRect(x + rw - 22 * k, uy + 2.5 * k, 2 * k, 2 * k); }
          }
        }
        c.fillStyle = 'rgba(8,8,10,.35)'; c.fillRect(0, 0, W, GY);
      },
      ground: function (c, segs, d) { c.fillStyle = '#121216'; c.fillRect(0, GY, W, H - GY); c.fillStyle = '#e6e6e6'; c.fillRect(0, GY, W, 1.5); c.fillStyle = 'rgba(230,230,230,.12)'; for (var x = -mod(d, 40 * k); x < W; x += 40 * k) c.fillRect(x, GY, 1, H - GY); for (var y2 = GY + 18 * k; y2 < H; y2 += 22 * k) c.fillRect(0, y2, W, 1); },
      ob: function (c, o) {
        var y = GY - o.h;
        if (o.kind === 'unit') { c.fillStyle = '#26262c'; c.fillRect(o.x, y, o.w, o.h); c.strokeStyle = '#dcdce0'; c.lineWidth = 1; c.strokeRect(o.x + .5, y + .5, o.w - 1, o.h - 1); c.fillStyle = '#dcdce0'; c.fillRect(o.x, y + o.h / 2, o.w, 1); c.fillStyle = '#fff'; c.fillRect(o.x + o.w - 8 * k, y + 4 * k, 2.5 * k, 2.5 * k); c.fillRect(o.x + o.w - 8 * k, y + o.h / 2 + 4 * k, 2.5 * k, 2.5 * k); }
        else { c.strokeStyle = '#d4d4d8'; c.lineWidth = 2; for (var j = 0; j < 4; j++) { c.beginPath(); c.moveTo(o.x + j * 3 * k, GY); c.bezierCurveTo(o.x + j * 3 * k, y - j * 2 * k, o.x + o.w - j * 3 * k, y - j * 2 * k, o.x + o.w - j * 3 * k, GY); c.stroke(); } }
      }
    },
    { id: 'glitch', name: 'Glitch', group: 'cyber', over: 'Fatal exception', hud: '#f0f0f0', ink: '#f0f0f0', gaps: false,
      obs: function () { return { w: rnd(24, 40), h: rnd(28, 50) }; },
      bg: function (c, t, d) {
        c.fillStyle = '#0a0a0a'; c.fillRect(0, 0, W, H);
        for (var i = 0; i < 40; i++) { c.fillStyle = 'rgba(240,240,240,' + (hs(i + Math.floor(t * 12)) * .08) + ')'; c.fillRect(hs(i * 3 + Math.floor(t * 6)) * W, hs(i * 5 + Math.floor(t * 6)) * GY, hs(i) * 120 * k, 2 * k); }
        c.font = '600 ' + 13 * k + 'px ui-monospace,Menlo,Consolas,monospace';
        ['ERROR', 'CORRUPT', '0xC0000005', 'SIGSEGV', 'NULL PTR'].forEach(function (w, i) { c.fillStyle = 'rgba(240,240,240,' + (.05 + .07 * (Math.sin(t * 5 + i * 2) > .7 ? 1 : 0)) + ')'; c.fillText(w, mod(hs(i) * W * 2 - d * .1, W + 160) - 80, 30 * k + hs(i + 9) * (GY - 70 * k)); });
      },
      ground: function (c, segs, d) { c.fillStyle = '#f0f0f0'; for (var x = -mod(d, 60 * k); x < W; x += 60 * k) { var i = Math.round((x + d) / (60 * k)); c.fillRect(x + (hs(i + Math.floor(Date.now() / 140)) > .9 ? 4 : 0), GY + (hs(i) > .85 ? 2 : 0), 52 * k, 1.5); } },
      ob: function (c, o) { var y = GY - o.h, j = function () { return Math.random() < .2 ? rnd(-4, 4) * k : 0; }; c.fillStyle = '#f0f0f0'; for (var yy = y; yy < GY; yy += 6 * k) c.fillRect(o.x + j(), yy, o.w, Math.min(5 * k, GY - yy)); c.fillStyle = 'rgba(240,240,240,.35)'; c.fillRect(o.x + 4 * k + j(), y - 3 * k, o.w * .6, 2 * k); },
      post: function (c, t) {
        c.fillStyle = 'rgba(255,255,255,.025)'; for (var y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
        if (Math.random() < .07) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); for (var n = 0; n < 3; n++) { var sy = Math.random() * cv.height, sh = rnd(4, 26) * DPR, dx = rnd(-30, 30) * DPR; c.drawImage(cv, 0, sy, cv.width, sh, dx, sy, cv.width, sh); } c.restore(); }
      }
    },
    { id: 'radar', name: 'Sentinel Radar', group: 'cyber', over: 'Target acquired', hud: '#e8e8e8', ink: '#e8e8e8', gaps: false,
      obs: function () { return Math.random() < .6 ? { w: rnd(26, 34), h: rnd(30, 40), kind: 'warn' } : { w: rnd(18, 22), h: rnd(46, 58), kind: 'mast' }; },
      bg: function (c, t, d) {
        c.fillStyle = '#060707'; c.fillRect(0, 0, W, H);
        var cx = W * .68, cy = GY * .52, R = GY * .46; c.lineWidth = 1;
        for (var r = 1; r <= 4; r++) { c.strokeStyle = 'rgba(232,232,232,' + (.06 + r * .02) + ')'; c.beginPath(); c.arc(cx, cy, R * r / 4, 0, Math.PI * 2); c.stroke(); }
        c.beginPath(); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R); c.stroke();
        var a = t * 1.4; for (var s2 = 0; s2 < 26; s2++) { c.fillStyle = 'rgba(232,232,232,' + (.13 * (1 - s2 / 26)) + ')'; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, a - (s2 + 1) * .03, a - s2 * .03); c.closePath(); c.fill(); }
        for (var b = 0; b < 7; b++) { var ba = hs(b) * Math.PI * 2, br = R * (.2 + hs(b + 4) * .75), age = mod(a - ba, Math.PI * 2); if (age < 2.2) { c.fillStyle = 'rgba(245,245,245,' + (1 - age / 2.2) + ')'; c.fillRect(cx + Math.cos(ba) * br - 2, cy + Math.sin(ba) * br - 2, 4, 4); } }
      },
      ground: function (c, segs, d) { c.fillStyle = '#e8e8e8'; c.fillRect(0, GY, W, 1.5); var st2 = 16 * k, i0 = Math.floor(d / st2); for (var i = i0; i < i0 + W / st2 + 2; i++) { var big = i % 6 === 0; c.fillStyle = 'rgba(232,232,232,' + (big ? .7 : .3) + ')'; c.fillRect(i * st2 - d, GY + 3, 1, big ? 9 * k : 4 * k); if (big) { c.font = 9 * k + 'px ui-monospace,Menlo,Consolas,monospace'; c.fillText(String(i * 10), i * st2 - d + 3, GY + 20 * k); } } },
      ob: function (c, o) {
        var y = GY - o.h; c.strokeStyle = '#e8e8e8'; c.fillStyle = '#e8e8e8'; c.lineWidth = 1.5;
        if (o.kind === 'warn') { c.beginPath(); c.moveTo(o.x, GY); c.lineTo(o.x + o.w / 2, y); c.lineTo(o.x + o.w, GY); c.closePath(); c.stroke(); c.fillRect(o.x + o.w / 2 - 1, y + o.h * .35, 2, o.h * .32); c.fillRect(o.x + o.w / 2 - 1, GY - o.h * .2, 2, 2.5); }
        else { c.fillRect(o.x + o.w / 2 - 1, y + 8 * k, 2, o.h - 8 * k); c.beginPath(); c.arc(o.x + o.w / 2, y + 8 * k, o.w / 2, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.fillRect(o.x + o.w / 2 - 1.5, y, 3, 3); }
      }
    },
    { id: 'ridge', name: 'Wireframe Ridge', group: 'cyber', over: 'Out of bounds', hud: '#eeeeee', ink: '#eeeeee', gaps: false, trail: true,
      obs: function () { return { w: rnd(24, 32), h: rnd(40, 58) }; },
      bg: function (c, t, d) {
        var g = c.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, '#020203'); g.addColorStop(1, '#141417'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        var rows = 9, hz = GY * .42; c.lineWidth = 1;
        var hf = function (x, z) { return Math.max(0, Math.sin(x * .011 + z * .7) * .5 + Math.sin(x * .023 - z * 1.3) * .3 + Math.sin(x * .004 + z) * .6); };
        var pts = [];
        for (var z = rows; z >= 0; z--) {
          var p = 1 / (1 + z * .35), yb = hz + (GY - hz) * (1 - z / rows) * .9, row = [];
          for (var x = -20; x <= W + 20; x += 18 * k) { var wx = (x - W / 2) / p + W / 2 + d * .6 * (1 + z * .1); row.push([x, yb - hf(wx, z) * GY * .38 * p]); }
          pts.push(row);
          c.beginPath(); row.forEach(function (q, i) { i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.lineTo(W + 20, GY); c.lineTo(-20, GY); c.closePath(); c.fillStyle = 'rgb(' + Math.round(8 + (1 - z / rows) * 6) + ',' + Math.round(8 + (1 - z / rows) * 6) + ',' + Math.round(10 + (1 - z / rows) * 7) + ')'; c.fill();
          c.strokeStyle = 'rgba(238,238,238,' + (.1 + (1 - z / rows) * .45) + ')'; c.beginPath(); row.forEach(function (q, i) { i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke();
          if (z < rows) { c.strokeStyle = 'rgba(238,238,238,' + (.05 + (1 - z / rows) * .12) + ')'; c.beginPath(); for (var vi = 0; vi < row.length; vi += 2) { c.moveTo(row[vi][0], row[vi][1]); c.lineTo(row[vi][0], row[vi][1] + (GY - hz) / rows * .9); } c.stroke(); }
        }
      },
      ground: function (c) { c.fillStyle = '#050506'; c.fillRect(0, GY, W, H - GY); c.save(); c.shadowColor = '#fff'; c.shadowBlur = 10; c.fillStyle = '#eee'; c.fillRect(0, GY, W, 1.5); c.restore(); },
      ob: function (c, o) { var y = GY - o.h; c.strokeStyle = '#eeeeee'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(o.x, GY); c.lineTo(o.x + o.w / 2, y); c.lineTo(o.x + o.w, GY); for (var s3 = 1; s3 < 4; s3++) { var yy = GY - o.h * s3 / 4, half = o.w / 2 * (1 - s3 / 4); c.moveTo(o.x + o.w / 2 - half, yy); c.lineTo(o.x + o.w / 2 + half, yy); c.lineTo(o.x + o.w / 2 - half * .6, yy + o.h / 4 * .9); } c.stroke(); c.fillStyle = '#fff'; c.fillRect(o.x + o.w / 2 - 1.5, y - 3, 3, 3); }
    },
    { id: 'blacksignal', name: 'Black Signal', group: 'cyber', over: 'No signal', hud: '#eeeeee', ink: '#eeeeee', gaps: false,
      obs: function () { return Math.random() < .6 ? { w: rnd(16, 22), h: rnd(40, 60), kind: 'spike' } : { w: rnd(30, 44), h: rnd(22, 30), kind: 'pulse' }; },
      bg: function (c, t, d) {
        c.fillStyle = '#070707'; c.fillRect(0, 0, W, H);
        for (var i = 0; i < 520; i++) { c.fillStyle = 'rgba(240,240,240,' + Math.random() * .09 + ')'; c.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5); }
        c.strokeStyle = 'rgba(238,238,238,.06)'; c.lineWidth = 1; c.beginPath(); var gs = 40 * k; for (var x = -mod(d * .2, gs); x < W; x += gs) { c.moveTo(x, 0); c.lineTo(x, GY); } for (var y = GY; y > 0; y -= gs) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke();
      },
      ground: function (c, segs, d) { c.save(); c.shadowColor = '#fff'; c.shadowBlur = 12; c.strokeStyle = '#eeeeee'; c.lineWidth = 1.6; c.beginPath(); for (var x = 0; x <= W; x += 4) { var y = GY + Math.sin((x + d) * .045) * 2.2 * k + Math.sin((x + d) * .17) * .8 * k; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.restore(); },
      ob: function (c, o) { c.save(); c.shadowColor = '#fff'; c.shadowBlur = 14; c.strokeStyle = '#eeeeee'; c.lineWidth = 1.8; c.beginPath(); var y = GY - o.h; if (o.kind === 'spike') { c.moveTo(o.x - 6 * k, GY); c.lineTo(o.x + o.w * .35, GY); c.lineTo(o.x + o.w * .5, y); c.lineTo(o.x + o.w * .65, GY + 8 * k); c.lineTo(o.x + o.w * .78, GY); c.lineTo(o.x + o.w + 6 * k, GY); } else { c.moveTo(o.x - 6 * k, GY); c.lineTo(o.x, GY); c.lineTo(o.x, y); c.lineTo(o.x + o.w, y); c.lineTo(o.x + o.w, GY); c.lineTo(o.x + o.w + 6 * k, GY); } c.stroke(); c.restore(); },
      post: function (c) { var g = c.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .7); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    }
  ];

  /* ---------- on-brand pixel obstacles ---------- */
  var OBMAP = {
    beetle: [[".M..............", "..M....DDDDDD...", "...M.DDLLLLLLDD.", "....DLWWLLLLLLLD", "..MMDLLLLLLLLLLD", ".MWMDLLLLLLLLLLD", "MMMMDMMMMMMMMMMD", ".M..DDDDDDDDDDD.", "...M..M...M..M..", "..M..M...M..M..."], [".M..............", "..M....DDDDDD...", "...M.DDLLLLLLDD.", "....DLWWLLLLLLLD", "..MMDLLLLLLLLLLD", ".MWMDLLLLLLLLLLD", "MMMMDMMMMMMMMMMD", ".M..DDDDDDDDDDD.", "....M..M...M..M.", "...M..M...M..M.."]],
    spider: [["......MMM......", ".....MLLLM.....", "....MLWLWLM....", "M...MLLLLLM...M", ".M..DMLLLMD..M.", "..MDMMDDDMMDM..", ".M.M.DLLLD.M.M.", "M.M..DLLLD..M.M", "..M...DDD...M..", ".M...........M."], ["......MMM......", ".....MLLLM.....", "....MLWLWLM....", "M...MLLLLLM...M", ".M..DMLLLMD..M.", "..MDMMDDDMMDM..", ".M.M.DLLLD.M.M.", ".M.M.DLLLD.M.M.", "M..M..DDD..M..M", "...M.......M..."]],
    worm: [["................", ".M..............", ".LLL............", "LWDLMLLMLLMLLMLL", "LLLLMLLMLLMLLMLD", ".DD.DD.DD.DD.DD."], ["......LMLLM.....", ".M...LL...LL....", ".LLL.L.....LL...", "LWDLL.......LL..", "LLLL.........LLD", ".DD...........DD"]],
    moth: [["..M........M..", "...M......M...", "LLL.M.DD.M.LLL", "LMLL..DD..LLML", "LWMLL.DD.LLMWL", "LMMLLLDDLLLMML", ".LLLLLDDLLLLL.", "...LL.DD.LL...", "......DD......"], ["..M........M..", "...M......M...", "....M.DD.M....", "..LL..DD..LL..", ".LMLL.DD.LLML.", "LWMMLLDDLLMMWL", "LMMLLLDDLLLMML", "LLLL..DD..LLLL", ".LL...DD...LL."]],
    virus: [[".....W.....", ".W...M...W.", "..M.DDD.M..", "...DLLLD...", "..DLWLLLD..", "WMDLLLLLDMW", "..DLLLLLD..", "...DLLLD...", "..M.DDD.M..", ".W...M...W.", ".....W....."], ["...W...W...", "....M.M....", "W...DDD...W", ".M.DLLLD.M.", "..DLWLLLD..", "..DLLLLLD..", "..DLLLLLD..", ".M.DLLLD.M.", "W...DDD...W", "....M.M....", "...W...W..."]],
    bytebug: [[".M............", "..M...DDDDD...", "...MDDLLDLLDD.", "..MMDLDLLLLDLD", ".MWMDLLLDLLLLD", "MMMMDLDLLLDLLD", ".M..DDDDDDDDD.", "...M..M..M..M.", "..M..M..M..M.."], [".M............", "..M...DDDDD...", "...MDDLLDLLDD.", "..MMDLDLLLLDLD", ".MWMDLLLDLLLLD", "MMMMDLDLLLDLLD", ".M..DDDDDDDDD.", "....M..M..M..M", "...M..M..M..M."]],
    centipede: [["M...................", ".M..................", ".MDDDDDDDDDDDDDDDDD.", "MWLLMLLMLLMLLMLLMLLD", "MMLLMLLMLLMLLMLLMLLD", ".M.DDDDDDDDDDDDDDDD.", "..M.M.M.M.M.M.M.M.M."], ["M...................", ".M..................", ".MDDDDDDDDDDDDDDDDD.", "MWLLMLLMLLMLLMLLMLLD", "MMLLMLLMLLMLLMLLMLLD", ".M.DDDDDDDDDDDDDDDD.", ".M.M.M.M.M.M.M.M.M.."]],
    scorpion: [["..........WM...", "...........M...", "............M..", "............M..", "...........ML..", "..........LL...", "MM.....LLLL....", "M.M.DDLLLLLL...", ".MMDLLLLLLLD...", "MMWDLLLLLLD....", "...M.M.M.M....."], [".........WM....", "..........M....", "...........M...", "............M..", "...........ML..", "..........LL...", "MM.....LLLL....", "M.M.DDLLLLLL...", ".MMDLLLLLLLD...", "MMWDLLLLLLD....", "....M.M.M.M...."]]
  };
  var BUGSPEC = {"beetle": {"vx": 46, "fps": 9, "hover": 0}, "spider": {"vx": 72, "fps": 12, "hover": 0}, "worm": {"vx": 24, "fps": 3, "hover": 0}, "moth": {"vx": 30, "fps": 11, "hover": 3.2}, "virus": {"vx": 0, "fps": 4, "hover": 3}, "bytebug": {"vx": 40, "fps": 9, "hover": 0}, "centipede": {"vx": 30, "fps": 10, "hover": 0}, "scorpion": {"vx": 18, "fps": 5, "hover": 0}};
  var EXITS = ['exit 1', 'exit 2', 'exit 126', 'exit 127', 'exit 130', 'exit 137', 'exit 139', 'exit 255'];
  var BUGS = ["beetle", "spider", "worm", "moth", "virus", "bytebug", "centipede", "scorpion"];
  var POOLS = {}; ['descent','data','firewall','circuit','alley','tunnel','server','glitch','radar','ridge','blacksignal','signal','terminal','skyline','ink'].forEach(function (id) { POOLS[id] = BUGS; });
  function obPal(light) {
    return light ? { W: '#151515', L: '#3a3a3c', M: '#6a6a6c', D: '#a8a49c', K: '#eeebe4' } : { W: '#f4f4f4', L: '#c4c4c8', M: '#808086', D: '#3c3c42', K: '#111113' };
  }
  var obCache = {};
  function obCanvas(rows, light, key) {
    if (key && obCache[key]) return obCache[key];
    var pal = obPal(light), w = rows[0].length + 2, h = rows.length + 2, cvs = document.createElement('canvas'); cvs.width = w; cvs.height = h;
    var c = cvs.getContext('2d');
    rows.forEach(function (r, y) { for (var x = 0; x < r.length; x++) { var ch = r.charAt(x); if (ch !== '.') { c.fillStyle = pal[ch]; c.fillRect(x + 1, y + 1, 1, 1); } } });
    var d = c.getImageData(0, 0, w, h).data; c.fillStyle = light ? 'rgba(20,20,22,.35)' : 'rgba(240,240,240,.3)';
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { if (d[(y * w + x) * 4 + 3]) continue; if ([[1,0],[-1,0],[0,1],[0,-1]].some(function (o) { var xx = x + o[0], yy = y + o[1]; return xx >= 0 && yy >= 0 && xx < w && yy < h && d[(yy * w + xx) * 4 + 3] > 200; })) c.fillRect(x, y, 1, 1); }
    if (key) obCache[key] = cvs;
    return cvs;
  }
  function corruptRows() { var r = []; for (var y = 0; y < 11; y++) { var s2 = '', off = Math.random() < .25 ? 1 : 0; for (var x = 0; x < 9; x++) { var q = Math.random(); s2 += (x < off) ? '.' : q < .12 ? '.' : q < .3 ? 'W' : q < .6 ? 'L' : q < .85 ? 'M' : 'D'; } r.push(s2); } return r; }
  function mkOb(kind) {
    var p = P(), o = { kind: kind, lift: 0, vx: 0, ph: Math.random() * 6 };
    if (kind === 'exit') { o.label = EXITS[(Math.random() * EXITS.length) | 0]; ctx.font = '600 ' + Math.round(4 * p) + 'px ui-monospace,Menlo,Consolas,monospace'; o.w = Math.ceil(ctx.measureText(o.label).width / p + 5) * p; o.h = 10 * p; return o; }
    if (kind === 'corrupt') { o.w = 9 * p; o.h = 11 * p; return o; }
    var m = OBMAP[kind][0], sp = BUGSPEC[kind]; o.w = m[0].length * p; o.h = m.length * p;
    o.vx = sp.vx * k; if (sp.hover) o.base = sp.hover;
    return o;
  }
  function obFrame(o) { return Math.floor((st.t + o.ph) * ((BUGSPEC[o.kind] || {}).fps || 4)) % 2; }
  function drawOb(c, o) {
    var p = P(), light = !!(o.th && o.th.light), x = Math.round(o.x * DPR) / DPR, y = Math.round((GY - o.lift - o.h) * DPR) / DPR, img;
    c.save(); c.imageSmoothingEnabled = false;
    if (o.kind === 'exit') {
      var pal = obPal(light);
      c.fillStyle = light ? 'rgba(20,20,22,.35)' : 'rgba(240,240,240,.3)'; c.fillRect(x - p, y - p, o.w + 2 * p, o.h + 2 * p);
      c.fillStyle = pal.K; c.fillRect(x, y, o.w, o.h); c.fillStyle = pal.M; c.fillRect(x, y, o.w, 2 * p);
      c.fillStyle = pal.W; [1, 3, 5].forEach(function (i) { c.fillRect(x + i * p, y + .5 * p, p, p); });
      c.strokeStyle = pal.M; c.lineWidth = p * .7; c.strokeRect(x + p * .35, y + p * .35, o.w - p * .7, o.h - p * .7);
      c.font = '600 ' + Math.round(4 * p) + 'px ui-monospace,Menlo,Consolas,monospace'; c.fillStyle = pal.W; c.textBaseline = 'middle';
      c.fillText(o.label, x + 2.5 * p, y + 6.3 * p); c.textBaseline = 'alphabetic';
      if (Math.floor(st.t * 2.5) % 2) c.fillRect(x + o.w - 3 * p, y + 4.5 * p, 1.2 * p, 3.4 * p);
      c.restore(); return;
    }
    if (o.kind === 'corrupt') { img = obCanvas(o.rows || (o.rows = corruptRows()), light); if (Math.random() < .25) o.rows = corruptRows(); x += Math.random() < .15 ? (Math.random() < .5 ? -p : p) * 2 : 0; }
    else img = obCanvas(OBMAP[o.kind][Math.min(obFrame(o), OBMAP[o.kind].length - 1)], light, o.kind + obFrame(o) + light);
    c.drawImage(img, x - p, y - p, img.width * p, img.height * p);
    c.restore();
  }
  // stacked-V tokens to collect for bonus points
  var TOKEN = ['M.....M', 'LM...ML', '.LM.ML.', 'M.LML.M', 'LM.L.ML', '.LM.ML.', '..LML..', '...L...'];
  function drawToken(c, tk) {
    // collectibles read as reward, not threat: a glowing coin that spins, sparkles, and says +50
    var p = P(), light = !!(T && T.light), bob = Math.sin(st.t * 4 + tk.ph) * 2 * p;
    var cx = tk.x + 3.5 * p, cy = GY - tk.lift - 4 * p + bob, r = 5.5 * p, spin = Math.cos(st.t * 3.2 + tk.ph), sx = Math.max(.18, Math.abs(spin));
    var ink = light ? '21,21,21' : '255,255,255', face = light ? '#151515' : '#f6f6f6', cut = light ? '#eeebe4' : '#151517';
    c.save();
    var pulse = .55 + .45 * Math.sin(st.t * 5 + tk.ph), g = c.createRadialGradient(cx, cy, r * .6, cx, cy, r * 2.6);
    g.addColorStop(0, 'rgba(' + ink + ',' + (.28 * pulse) + ')'); g.addColorStop(1, 'rgba(' + ink + ',0)');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r * 2.6, 0, Math.PI * 2); c.fill();
    if (!light) { c.shadowColor = 'rgba(255,255,255,.9)'; c.shadowBlur = 14; }
    c.fillStyle = face; c.beginPath(); c.ellipse(cx, cy, r * sx, r, 0, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = cut; c.lineWidth = p * .8; c.beginPath(); c.ellipse(cx, cy, r * sx * .78, r * .78, 0, 0, Math.PI * 2); c.stroke();
    if (sx > .45) {   // the stacked V on the coin face
      c.save(); c.translate(cx, cy); c.scale(sx, 1); c.strokeStyle = cut; c.lineWidth = p * .95; c.lineJoin = 'miter';
      c.beginPath(); c.moveTo(-2.4 * p, -2.6 * p); c.lineTo(0, -.4 * p); c.lineTo(2.4 * p, -2.6 * p); c.moveTo(-2.4 * p, -.2 * p); c.lineTo(0, 2 * p); c.lineTo(2.4 * p, -.2 * p); c.stroke(); c.restore();
    }
    c.fillStyle = 'rgba(' + ink + ',.95)';
    for (var i = 0; i < 4; i++) {
      var a2 = st.t * 1.6 + tk.ph + i * Math.PI / 2, tw = Math.max(0, Math.sin(st.t * 6 + i * 1.7 + tk.ph)), sr = r * 1.9;
      if (tw < .2) continue; var px2 = cx + Math.cos(a2) * sr, py2 = cy + Math.sin(a2) * sr, z = p * (.6 + tw * .9);
      c.fillRect(px2 - z * 1.5, py2 - z * .3, z * 3, z * .6); c.fillRect(px2 - z * .3, py2 - z * 1.5, z * .6, z * 3);
    }
    c.globalAlpha = .75; c.font = '600 ' + Math.round(3.6 * p) + 'px Dosis,system-ui,sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(' + ink + ',.85)';
    c.fillText('+50', cx, cy - r - 4 * p); c.textAlign = 'left';
    c.restore();
  }


  /* ---------- game state ---------- */
  THEMES.forEach(function (th) { if (!th.player) th.player = function (c, x, y, sz, name, ghost) { drawSprite(c, x, y + sz * .42, name || poseNow(), !ghost && !!th.trail); }; if (!th.font) th.font = '500 13px Dosis'; });
  var ORDER = ['descent', 'data', 'firewall', 'circuit', 'alley', 'tunnel', 'server', 'glitch', 'radar', 'ridge', 'blacksignal', 'signal', 'terminal', 'skyline', 'ink'];
  var LEVELS = ORDER.map(function (id) { return THEMES.filter(function (t) { return t.id === id; })[0]; });
  var LEVEL_PTS = 1000;
  var T = LEVELS[0], best = 0, st, raf = 0, last = 0;
  try { best = +localStorage.getItem('vonds-run-best') || 0; } catch (e) {}
  function reset() {
    T = LEVELS[0];
    st = { tok: [], pops: [], bonus: 0, lvl: 0, prevT: null, fade: 1, banner: 9, mode: 'ready', t: 0, d: 0, speed: 360 * k, py: GY, vy: 0, grounded: true, coyote: 0, buf: 0, hold: false,
      obs: [], segs: [{ x: -50, w: W * 1.6, id: 0 }], segN: 1, next: 500 * k, parts: [], trail: [], squash: 0, shake: 0, overT: 0, score: 0 };
  }
  function resize() {
    var r = cv.getBoundingClientRect(); DPR = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); k = H / 440; GY = Math.round(H * .76);
  }
  var PX = function () { return Math.max(70, W * .16); };
  var SZ = function () { return 46 * k; };

  function extend() {
    var s = st.segs[st.segs.length - 1];
    while (s.x + s.w < W + 600) {
      var gap = T.gaps ? rnd(70, 135) * k * Math.sqrt(st.speed / (360 * k)) : 0;
      s = { x: s.x + s.w + gap, w: (T.gaps ? rnd(380, 820) : 4000) * k, id: st.segN++ }; st.segs.push(s);
    }
  }
  function support(x1, x2) { for (var i = 0; i < st.segs.length; i++) { var s = st.segs[i]; if (x2 > s.x && x1 < s.x + s.w) return s; } return null; }
  function burst(x, y, n, sp, life) { for (var i = 0; i < n; i++) st.parts.push({ x: x, y: y, vx: rnd(-1, 1) * sp, vy: rnd(-1, .2) * sp, life: life * rnd(.6, 1), max: life, sz: rnd(1, 3) * k }); }

  function press() {
    if (st.mode === 'ready') { st.mode = 'run'; }
    if (st.mode === 'over') { if (st.overT > .45) { reset(); st.mode = 'run'; } return; }
    st.hold = true; st.buf = .12;
  }
  function release() { if (!st) return; st.hold = false; if (st.vy < -340 * k) st.vy *= .55; }

  function die() {
    st.mode = 'over'; st.overT = 0; st.shake = 1;
    burst(PX(), st.py - SZ() * .4, 26, 420 * k, .9);
    if (st.score > best) { best = st.score; st.newBest = true; try { localStorage.setItem('vonds-run-best', String(best)); } catch (e) {} }
  }

  function update(dt) {
    var s = st; s.t += dt;
    s.parts.forEach(function (p) { p.x += p.vx * dt - (s.mode === 'run' ? s.speed * dt * .4 : 0); p.y += p.vy * dt; p.vy += 900 * k * dt; p.life -= dt; });
    s.parts = s.parts.filter(function (p) { return p.life > 0; });
    s.shake = Math.max(0, s.shake - dt * 3); s.squash = Math.max(0, s.squash - dt * 5);
    s.fade = Math.min(1, s.fade + dt / 1.8); s.banner += dt;
    if (s.mode === 'over') { s.overT += dt; return; }
    if (s.mode !== 'run') { s.py = GY + Math.sin(s.t * 3) * 0; return; }
    var dx = s.speed * dt; s.d += dx; s.speed = Math.min(880 * k, s.speed + 9 * k * dt);
    s.score = Math.floor(s.d / (36 * k)) + s.bonus;
    // every 1000 points the world fades into the next level while you keep running
    var lv = Math.floor(s.score / LEVEL_PTS);
    if (lv > s.lvl) { s.lvl = lv; s.prevT = T; T = LEVELS[lv % LEVELS.length]; s.fade = 0; s.banner = 0; }
    s.segs.forEach(function (g) { g.x -= dx; }); s.segs = s.segs.filter(function (g) { return g.x + g.w > -60; }); extend();
    s.obs.forEach(function (o) { o.x -= dx + o.vx * dt; if (o.base) o.lift = (o.base + Math.sin(s.t * 4 + o.ph) * 1.5) * P(); });
    s.tok.forEach(function (t2) { t2.x -= dx; }); s.tok = s.tok.filter(function (t2) { return t2.x > -40 && !t2.got; });
    s.pops.forEach(function (pp) { pp.t += dt; }); s.pops = s.pops.filter(function (pp) { return pp.t < .9; }); s.obs = s.obs.filter(function (o) { return o.x + o.w > -40; });
    // spawn
    s.next -= dx;
    if (s.next <= 0) {
      var pool = POOLS[T.id], o = mkOb(pool[(Math.random() * pool.length) | 0]); o.th = T;
      o.x = W + 30; var sup = support(o.x - 30 * k, o.x + o.w + 30 * k);
      if (sup && o.x - 30 * k > sup.x && o.x + o.w + 30 * k < sup.x + sup.w && (!T.gaps || Math.random() < .55)) { s.obs.push(o); s.next = s.speed * rnd(.85, 1.75); if (Math.random() < .3) s.tok.push({ x: o.x + o.w + s.next * .5, lift: 27 * P(), ph: Math.random() * 6 }); }
      else s.next = 60 * k;
    }
    // player
    var px = PX(), half = P() * 3.5, prev = s.py;
    s.coyote = s.grounded ? .09 : s.coyote - dt; s.buf -= dt;
    if (s.buf > 0 && s.coyote > 0) { s.vy = -880 * k; s.grounded = false; s.coyote = 0; s.buf = 0; burst(px, GY, 6, 120 * k, .35); }
    s.vy += (s.vy < 0 && s.hold ? 2000 : 2900) * k * dt; s.py += s.vy * dt;
    var sup2 = support(px - half, px + half);
    if (sup2 && s.py >= GY && prev <= GY + 2) { if (!s.grounded && s.vy > 300 * k) { s.squash = 1; burst(px, GY, 8, 140 * k, .4); } s.py = GY; s.vy = 0; s.grounded = true; }
    else s.grounded = false;
    if (s.py > GY + 4 && sup2) return die();          // ran into the side of a roof
    if (s.py > H + 80) return die();
    // hits
    var bx1 = px - P() * 3.5, bx2 = px + P() * 3.5, by1 = s.py - P() * 20, by2 = s.py - 2;
    var ins = P();
    for (var i = 0; i < s.obs.length; i++) { var q = s.obs[i], qb = GY - q.lift, qt = qb - q.h; if (bx2 > q.x + ins && bx1 < q.x + q.w - ins && by2 > qt + ins && by1 < qb - ins * .5) return die(); }
    for (var j = 0; j < s.tok.length; j++) { var tk = s.tok[j], tx = tk.x + 3.5 * P(), ty = GY - tk.lift - 4 * P(); if (Math.abs(tx - px) < 6 * P() && ty > by1 - 4 * P() && ty < by2) { tk.got = true; s.bonus += 50; s.pops.push({ x: tx, y: ty, t: 0 }); burst(tx, ty, 10, 160 * k, .5); } }
    // motion trail runs on every level, so it never freezes after a level change
    s.trail.push({ x: px, y: s.py, f: poseNow() }); if (s.trail.length > 7) s.trail.shift();
  }

  function text(str, x, y, size, color, align, spacing) {
    ctx.font = (T.mono ? '500 ' + size + 'px ui-monospace,Menlo,Consolas,monospace' : '500 ' + size + 'px Dosis,sans-serif');
    ctx.fillStyle = color; ctx.textAlign = align || 'center';
    if ('letterSpacing' in ctx) ctx.letterSpacing = (spacing || 0) + 'px';
    ctx.fillText(str, x, y); ctx.textAlign = 'left'; if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  function draw() {
    var s = st, sx = s.shake ? rnd(-1, 1) * 8 * s.shake : 0, sy = s.shake ? rnd(-1, 1) * 6 * s.shake : 0;
    ctx.save(); ctx.translate(sx, sy);
    var ease = s.fade * s.fade * (3 - 2 * s.fade);
    if (s.prevT && s.fade < 1) { s.prevT.bg(ctx, s.t, s.d); s.prevT.ground(ctx, s.segs, s.d); ctx.globalAlpha = ease; }
    T.bg(ctx, s.t, s.d); T.ground(ctx, s.segs, s.d); ctx.globalAlpha = 1;
    s.obs.forEach(function (o) { drawOb(ctx, o); });
    s.tok.forEach(function (t2) { drawToken(ctx, t2); });
    s.pops.forEach(function (pp) { ctx.globalAlpha = 1 - pp.t / .9; text('+50', pp.x, pp.y - pp.t * 40 * k, 12 * k, T.hud, 'center', 3); ctx.globalAlpha = 1; });
    var px = PX(), sz = SZ();
    if (s.mode !== 'over' || s.overT < .08) {
      s.trail.forEach(function (p, i) { ctx.globalAlpha = (i + 1) / s.trail.length * .22; T.player(ctx, p.x - (s.trail.length - i) * 7.5 * k, p.y - sz * .42, sz, p.f, true); });
      ctx.globalAlpha = 1;
      var tilt = 0, sq = s.squash * .5;
      var idle = 0;
      ctx.save(); ctx.translate(px, s.py - idle); ctx.rotate(tilt); ctx.scale(1 + sq * .14, 1 - sq * .16);
      T.player(ctx, 0, -sz * .42, sz); ctx.restore();
    }
    ctx.fillStyle = T.ink;
    s.parts.forEach(function (p) { ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillRect(p.x, p.y, p.sz, p.sz); }); ctx.globalAlpha = 1;
    ctx.restore();
    if (s.prevT && s.fade < 1 && s.prevT.post) { ctx.globalAlpha = 1 - ease; s.prevT.post(ctx, s.t); ctx.globalAlpha = 1; }
    if (T.post) { if (s.prevT && s.fade < 1) ctx.globalAlpha = ease; T.post(ctx, s.t); ctx.globalAlpha = 1; }
    // level banner
    if (s.banner < 3 && s.lvl > 0 && s.mode !== 'over') {
      var ba = s.banner < .5 ? s.banner / .5 : s.banner > 2.3 ? (3 - s.banner) / .7 : 1;
      ctx.globalAlpha = clamp(ba, 0, 1);
      text('LEVEL ' + ('0' + (s.lvl + 1)).slice(-2), W / 2, H * .3, 12 * k, T.light ? 'rgba(46,46,48,.6)' : 'rgba(232,232,232,.6)', 'center', 8);
      text(T.name.toUpperCase(), W / 2, H * .3 + 30 * k, 22 * k, T.hud, 'center', 10);
      ctx.globalAlpha = 1;
    }
    // HUD
    var pad = 24 * k, sc = ('00000' + s.score).slice(-5), hi = ('00000' + best).slice(-5), lvName = 'LVL ' + ('0' + (s.lvl + 1)).slice(-2) + '  ·  ' + T.name.toUpperCase();
    if (T.mono) { text('uptime ' + sc, W - pad, pad + 8, 13 * k, T.hud, 'right'); text('best ' + hi, W - pad - 150 * k, pad + 8, 13 * k, T.light ? 'rgba(46,46,48,.5)' : 'rgba(216,216,216,.45)', 'right'); if (W > 560) text('root@vonds:~$ ./jump  [lvl ' + (s.lvl + 1) + ']', pad, pad + 8, 13 * k, 'rgba(216,216,216,.6)', 'left'); }
    else { text(sc, W - pad, pad + 10, 16 * k, T.hud, 'right', 4); text('HI ' + hi, W - pad - 96 * k, pad + 10, 16 * k, T.light ? 'rgba(46,46,48,.45)' : 'rgba(232,232,232,.4)', 'right', 4); if (W > 560) text(lvName, pad, pad + 10, 12 * k, T.light ? 'rgba(46,46,48,.55)' : 'rgba(232,232,232,.5)', 'left', 5); }
    var dim = T.light ? 'rgba(46,46,48,.6)' : 'rgba(232,232,232,.62)';
    if (s.mode === 'ready') { var a = .55 + .45 * Math.sin(s.t * 3); ctx.globalAlpha = a; text(T.mono ? '> press space to run_' : 'PRESS SPACE OR TAP TO RUN', W / 2, H * .38, 15 * k, T.hud, 'center', T.mono ? 0 : 6); ctx.globalAlpha = 1; }
    if (s.mode === 'over' && s.overT > .2) {
      ctx.globalAlpha = clamp((s.overT - .2) * 3, 0, 1);
      text(T.mono ? T.over : T.over.toUpperCase(), W / 2, H * .34, (T.mono ? 16 : 22) * k, T.hud, 'center', T.mono ? 0 : 8);
      text((T.mono ? 'uptime ' : 'SCORE ') + s.score + (s.newBest ? (T.mono ? '  (new best)' : '  ·  NEW BEST') : ''), W / 2, H * .34 + 30 * k, 13 * k, dim, 'center', T.mono ? 0 : 4);
      if (s.overT > .45) text(T.mono ? '> press space to retry_' : 'TAP TO TRY AGAIN', W / 2, H * .34 + 58 * k, 12 * k, dim, 'center', T.mono ? 0 : 5);
      ctx.globalAlpha = 1;
    }
  }

  function loop(ts) {
    var dt = Math.min(.033, (ts - (last || ts)) / 1000); last = ts;
    update(dt); draw(); raf = requestAnimationFrame(loop);
  }

  /* ---------- open / close ---------- */
  var opener = null;
  function open(i) {
    opener = document.activeElement;
    document.getElementById('gname').textContent = 'New level every 1,000 points';
    gm.classList.add('open'); resize(); reset(); draw();
    requestAnimationFrame(function () { gm.classList.add('show'); });
    cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(loop);
    cv.focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';
  }
  function close() {
    gm.classList.remove('show'); document.body.style.overflow = '';
    setTimeout(function () { if (!gm.classList.contains('show')) { gm.classList.remove('open'); cancelAnimationFrame(raf); } }, 650);
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }
  addEventListener('resize', function () { if (gm.classList.contains('open')) { resize(); reset(); } });

  addEventListener('keydown', function (e) {
    if (!gm.classList.contains('open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); if (!e.repeat) press(); }
  });
  addEventListener('keyup', function (e) { if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') release(); });
  cv.addEventListener('pointerdown', function (e) { e.preventDefault(); press(); });
  addEventListener('pointerup', release);
  document.getElementById('gx').addEventListener('click', close);
  gm.addEventListener('pointerdown', function (e) { if (e.target === gm) close(); });

  /* ---------- hook up the header logo ---------- */
  LOOK = look(4);   // Headphones
  var brand = document.querySelector('.header .brand');
  if (brand) brand.addEventListener('click', function (e) {
    // in the hero the logo opens the game; further down it still goes home
    if (window.scrollY > window.innerHeight * .5 || document.body.classList.contains('diving')) return;
    e.preventDefault(); open(0);
  });
  /* ---------- hints that the game exists ---------- */
  window.VondsGame = { open: function () { open(0); } };
  try {
    console.log('%cV O N D S', 'font:600 20px Dosis,system-ui,sans-serif;letter-spacing:.6em;color:#2e2e30');
    console.log('%cHey, fellow builder. The logo up in the hero is a game.\nOr open the terminal with ` and type play.', 'font:13px ui-monospace,Menlo,Consolas,monospace;color:#5a5a60;line-height:1.6');
  } catch (e) {}

  // every 30 seconds in the hero, the sprite walks in along the top, points at the logo, hops, and runs off
  (function peek() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var wrap = document.createElement('div'); wrap.className = 'gpeek'; wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<svg class="gline"><path/></svg><div class="gbub">Psst. Click the logo.</div><canvas></canvas>';
    document.body.appendChild(wrap);
    var pc = wrap.querySelector('canvas'), px2 = pc.getContext('2d'), bub = wrap.querySelector('.gbub'), path = wrap.querySelector('path'), svg = wrap.querySelector('svg');
    var S, CW, CH, raf2 = 0, t0 = 0, played = false;
    function size() { S = innerWidth < 640 ? 2.5 : 3; CW = Math.round(22 * S); CH = Math.round(26 * S); pc.width = CW * 2; pc.height = CH * 2; pc.style.width = CW + 'px'; pc.style.height = CH + 'px'; }
    function ok() { return (window.scrollY || 0) < 40 && !document.hidden && !gm.classList.contains('open') && !document.body.classList.contains('diving') && !document.querySelector('.xp-term.open, .overlay.open, .cs.open, dialog[open]'); }
    // where he stops: just below and left of the logo, so the raised hand points up at it
    function spot() {
      var b = brand ? brand.getBoundingClientRect() : { left: 40, right: 70, top: 20, bottom: 60, width: 30, height: 40 };
      if (b.left > 20.5 * S + 10) return { x: b.left - 2 - 20.5 * S, y: b.bottom + 10 - 12.5 * S, logo: b, flip: false };
      // no room on the left (phones): stand below and right of the logo, turn back and point up at it
      return { x: b.right + 4 - 1.5 * S, y: b.bottom + 4, logo: b, flip: true };
    }
    function draw(name, x, y, mirror) {
      px2.setTransform(1, 0, 0, 1, 0, 0); px2.clearRect(0, 0, pc.width, pc.height); px2.imageSmoothingEnabled = false;
      if (mirror) { px2.translate(pc.width, 0); px2.scale(-1, 1); }
      px2.drawImage(frame(name, null, true), 0, 0, pc.width, pc.height);
      pc.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    }
    function end() { cancelAnimationFrame(raf2); wrap.classList.remove('on', 'talk'); if (brand) brand.classList.remove('g-pulse'); path.setAttribute('d', ''); }
    var WALK = 1.7, POINT = 3.6, HOP = .38, RUN = .6;
    function step(ts) {
      if (!t0) t0 = ts;
      var t = (ts - t0) / 1000, sp = spot(), from = -CW - 10, walkFrame = 'run' + (Math.floor(t * 7) % 4);
      if (!ok()) { end(); return; }
      if (t < WALK) {                                     // walk in along the top
        var e = t / WALK; e = e < .85 ? e / .85 : 1;
        draw(e < 1 ? walkFrame : 'idle', from + (sp.x - from) * (1 - Math.pow(1 - e, 1.6)), sp.y, false);
      } else if (t < WALK + POINT) {                       // point at the logo
        var tp = t - WALK;
        draw(tp < .15 && sp.flip ? 'idle' : Math.floor(tp * 2.6) % 2 ? 'point2' : 'point', sp.x, sp.y, sp.flip);
        wrap.classList.add('talk'); if (brand) brand.classList.add('g-pulse');
        var r = pc.getBoundingClientRect(), hx = sp.flip ? r.left + 1.5 * S : r.left + 21 * S, hy = r.top + 12 * S, lx = sp.logo.left + sp.logo.width * .3, ly = sp.logo.bottom - 2, k3 = Math.min(1, tp / .45);
        path.setAttribute('d', 'M' + hx + ' ' + hy + ' L' + (hx + (lx - hx) * k3) + ' ' + (hy + (ly - hy) * k3));
        if (sp.flip) { bub.style.left = (r.right + 6) + 'px'; bub.style.top = (r.top + r.height * .3) + 'px'; }
        else { bub.style.left = (sp.logo.right + 16) + 'px'; bub.style.top = (sp.logo.top + sp.logo.height / 2 - 16) + 'px'; }
      } else if (t < WALK + POINT + HOP) {                 // turn toward the exit and do a quick hop
        wrap.classList.remove('talk'); if (brand) brand.classList.remove('g-pulse'); path.setAttribute('d', '');
        var u = (t - WALK - POINT) / HOP;
        draw(u > .12 && u < .88 ? 'jump' : 'idle', sp.x, sp.y - Math.sin(Math.PI * u) * 9 * S, true);
      } else if (t < WALK + POINT + HOP + RUN) {           // then run off screen
        var e2 = (t - WALK - POINT - HOP) / RUN;
        draw('run' + (Math.floor(t * 13) % 4), sp.x + (from - sp.x) * e2 * e2, sp.y, true);
      } else { end(); return; }
      raf2 = requestAnimationFrame(step);
    }
    function go() { if (!ok() || played) return; size(); svg.setAttribute('width', innerWidth); svg.setAttribute('height', innerHeight); t0 = 0; wrap.classList.add('on'); raf2 = requestAnimationFrame(step); }
    setInterval(go, 30000);
    // stop nudging once they have found it
    var o2 = open; open = function (i) { played = true; end(); o2(i); }; window.VondsGame.open = function () { open(0); };
    window.__gpeek = go;
  })();

})();
