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
    point2:{ bl: 'down', fl: 'down', ba: 'mid', fa: 'point', bob: -1, sway: 1 },
    kneel: { bl: 'tuck', fl: 'tuck', ba: 'mid',  fa: 'fwd',  bob: 3,  sway: 3 },   // hurt badly: down on one knee, head low
    kneel2:{ bl: 'tuck', fl: 'tuck', ba: 'mid',  fa: 'fwd',  bob: 2,  sway: 3 }
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
    p.H = 'rgb(40,40,44)'; p.h = 'rgb(76,76,82)'; p.E = 'rgb(8,8,8)'; p.W = 'rgb(242,242,242)';
    p.D = 'rgb(14,14,16)'; p.d = 'rgb(54,54,58)';   // headphones: black band and cups
    if (L.hairLight) { p.H = 'rgb(200,200,206)'; p.h = 'rgb(232,232,238)'; }
    if (L.hairGray) { p.H = 'rgb(150,150,156)'; p.h = 'rgb(196,196,202)'; }
    if (L.phonesLight) { p.D = 'rgb(226,226,232)'; p.d = 'rgb(160,160,168)'; }
    if (L.plateLight) { p.V = 'rgb(252,252,255)'; p.M = 'rgb(206,206,214)'; p.m = 'rgb(140,140,150)'; p.v = 'rgb(52,52,58)'; }   // war plate: polished white
    else { p.V = 'rgb(168,168,178)'; p.M = 'rgb(84,84,94)'; p.m = 'rgb(44,44,52)'; p.v = 'rgb(16,16,20)'; }   // or gunmetal
    p.Z = 'rgb(255,255,255)';   // the glow in the eye slits
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
    if (L.pre) L.pre(px, pose);
    if (L.pack) map(PACK);
    if (!L.pony && !L.noLocs) STRANDS.forEach(function (st, i) { strand(st, i); });
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
    if (!L.hoodUp && !L.pony && !L.noLocs) strand(FRONT, 1);
    if (L.extra) L.extra(px, pose, HEAD);
    leg(pose.fl, 'P', 'B');
    // a dark seam behind the near arm, so it reads as an arm against the shirt and the locs
    (function () { var cells = ARM[pose.fa], own = {}; cells.forEach(function (cl) { own[cl[0] + ',' + cl[1]] = own[cl[0] + ',' + (cl[1] + 1)] = 1; });
      cells.forEach(function (cl, i) { if (i === cells.length - 1) return; [0, 1].forEach(function (d) { if (!own[(cl[0] - 1) + ',' + (cl[1] + d)]) px(11 + cl[0] - 1, 15 + cl[1] + d, 'd'); }); }); })();
    arm(pose.fa, 11, 'A');
    if (L.noOutline) return (cache[key] = cvs);
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
    ,heisenbug: [["....W.....W....", ".....M...M.....", "..W..DDDDD..W..", "....DLLWLLD....", "...DLWLLLWLD...", "W..DLLLMLLLD..W", "...DLWLLLWLD...", "....DLLWLLD....", "..W..DDDDD..W..", ".....M...M.....", "....W.....W...."], ["...W.......W...", ".....M...M.....", ".....DDDDD.....", "..W.DLLWLLD.W..", "...DLWLLLWLD...", "...DLLLMLLLD...", "...DLWLLLWLD...", "..W.DLLWLLD.W..", ".....DDDDD.....", ".....M...M.....", "...W.......W..."]]
    ,forkbomb: [[".......W....", "......M.....", ".....M......", "...DDDDD....", "..DLLLLLD...", ".DLWLLLLLD..", ".DLLLLLLLD..", ".DLLLMLLLD..", "..DLLLLLD...", "...DDDDD...."], ["......W.W...", ".......M....", ".....M......", "...DDDDD....", "..DLLLLLD...", ".DLWLLLLLD..", ".DLLLLLLLD..", ".DLLMLLLLD..", "..DLLLLLD...", "...DDDDD...."]],
    deadlock: [["..DDDD..DDDD..", ".DLLLLDDLLLLD.", "DLL..DLLD..LLD", "DLW..DLLD..WLD", "DLL..DLLD..LLD", ".DLLLLDDLLLLD.", "..DDDD..DDDD.."], ["..DDDD..DDDD..", ".DLLLLDDLLLLD.", "DLL..DMMD..LLD", "DLW..DMMD..WLD", "DLL..DMMD..LLD", ".DLLLLDDLLLLD.", "..DDDD..DDDD.."]],
    phantom: [["....DDDDD....", "...DLLLLLD...", "..DLWLLLWLD..", "..DLLLLLLLD..", "..DLLMMMLLD..", "..DLLLLLLLD..", "..DLLLLLLLD..", "..DLDLDLDLD..", "..D.D.D.D.D.."], ["....DDDDD....", "...DLLLLLD...", "..DLWLLLWLD..", "..DLLLLLLLD..", "..DLLLMLLLD..", "..DLLLLLLLD..", "..DLLLLLLLD..", "..LDLDLDLDL..", "...D.D.D.D..."]]
  };
  /* ---------- corrupted code: thirty more bugs, drawn from seeds instead of by hand ---------- */
  (function () {
    var DIG = { 0: ['LLL', 'L.L', 'L.L', 'L.L', 'LLL'], 1: ['.L.', 'LL.', '.L.', '.L.', 'LLL'] };
    function rng(seed) { var x = seed * 9301 + 49297; return function () { x = (x * 9301 + 49297) % 233280; return x / 233280; }; }
    function blank(w, h) { var g = []; for (var y = 0; y < h; y++) { g.push([]); for (var x = 0; x < w; x++) g[y].push('.'); } return g; }
    function outline(g) {   // dark edge around every lit pixel, the way the hand-drawn bugs have one
      var h = g.length, w = g[0].length, o = g.map(function (r) { return r.slice(); });
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (g[y][x] === '.') {
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var c = (g[y + dy] || [])[x + dx]; if (c && c !== '.' && c !== 'D') { o[y][x] = 'D'; dy = 2; break; } }
      }
      return o.map(function (r) { return r.join(''); });
    }
    function pad(g, w, h) { var G = blank(w, h), ox = Math.floor((w - g[0].length) / 2), oy = Math.floor((h - g.length) / 2); g.forEach(function (r, y) { r.forEach(function (c, x) { G[y + oy][x + ox] = c; }); }); return G; }
    function digits(g, x0, y0, bits, light) { bits.split('').forEach(function (b, i) { DIG[b].forEach(function (row, y) { row.split('').forEach(function (c, x) { if (c !== '.') g[y0 + y][x0 + i * 4 + x] = light ? 'L' : 'M'; }); }); }); }
    var STY = {
      binary: function (r, f) {   // a block of ones and zeros with eyes and little legs, flipping bits as it breathes
        var cols = 3 + Math.floor(r() * 2), rows = 2, w = cols * 4 + 1, h = rows * 6 + 5, g = blank(w, h), bits = [];
        for (var k = 0; k < rows; k++) { var b = ''; for (var c = 0; c < cols; c++) b += r() < .5 ? '0' : '1'; bits.push(b); }
        for (var x = 1; x < w - 1; x++) g[2][x] = 'M';
        bits.forEach(function (b, k) { if (f) b = b.split('').map(function (d, i) { return (i + k) % 3 === 1 ? (d === '0' ? '1' : '0') : d; }).join(''); digits(g, 1, 3 + k * 6, b, k === 0); });
        [2, w - 4].forEach(function (ex) { g[0][ex] = 'L'; g[0][ex + 1] = 'L'; g[1][ex] = 'L'; g[1][ex + 1] = f ? 'L' : 'W'; g[1][ex + (f ? 0 : 1)] = 'W'; });
        for (var lx = 2; lx < w - 1; lx += 3) g[h - 1][lx + ((lx / 3 + (f ? 1 : 0)) % 2)] = 'L';
        return g;
      },
      invader: function (r, f) {   // a symmetric glitch-creature built from a seed
        var hw = 6, h = 8, g = blank(hw * 2 - 1, h + 1), dens = .45 + r() * .2;
        for (var y = 0; y < h; y++) for (var x = 0; x < hw; x++) { var on = r() < (y > 1 && y < h - 2 ? dens + .2 : dens) || (x === hw - 1 && y < h - 1); if (on) { var c = r() < .2 ? 'M' : 'L'; g[y][x] = c; g[y][hw * 2 - 2 - x] = c; } }
        g[3][hw - 3] = 'W'; g[3][hw + 1] = 'W'; g[2][hw - 3] = 'L'; g[2][hw + 1] = 'L';
        for (var x2 = 0; x2 < hw * 2 - 1; x2 += 2) g[h][x2 + (f ? 1 : 0)] = (x2 / 2) % 2 ? 'M' : '.';
        return g;
      },
      glitch: function (r, f) {   // a torn rectangle of code, its scanlines sliding past each other
        var w = 12, h = 9, g = blank(w + 4, h);
        for (var y = 0; y < h; y++) { var off = Math.floor((r() - .5) * 4 + (f ? (y % 2 ? 1 : -1) : 0)); for (var x = 0; x < w; x++) { var xx = x + 2 + off; if (xx >= 0 && xx < w + 4) g[y][xx] = (x + y) % 5 === 0 ? 'M' : 'L'; } }
        g[3][5] = 'W'; g[3][10] = 'W';
        return g;
      },
      bracket: function (r, f) {   // two curly braces holding something that should never have compiled
        var g = blank(15, 11), sh = f ? 1 : 0;
        ['..LL', '.L..', '.L..', 'L...', '.L..', '.L..', '..LL'].forEach(function (row, y) { row.split('').forEach(function (c, x) { if (c !== '.') { g[y + 2][x + sh] = 'L'; g[y + 2][14 - x - sh] = 'L'; } }); });
        var b = (r() < .5 ? '1' : '0') + (r() < .5 ? '1' : '0'); digits(g, 4, 3, b, true);
        g[1][6] = 'W'; g[1][8] = 'W';
        return g;
      },
      serpent: function (r, f) {   // a long string of bits, slithering
        var n = 6 + Math.floor(r() * 3), g = blank(n * 4 + 2, 11);
        for (var i = 0; i < n; i++) { var yy = 3 + Math.round(Math.sin(i * .9 + (f ? 1.4 : 0)) * 2); DIG[r() < .5 ? 0 : 1].forEach(function (row, y) { row.split('').forEach(function (c, x) { if (c !== '.') g[yy + y][1 + i * 4 + x] = i === 0 ? 'M' : 'L'; }); }); }
        var hy = 3 + Math.round(Math.sin(f ? 1.4 : 0) * 2); g[hy + 1][2] = 'W';
        return g;
      },
      hydra: function (r, f) {   // one body, three greedy heads on long necks, each wanting the same match
        var g = blank(19, 13);
        for (var y = 8; y < 12; y++) for (var x = 4; x < 15; x++) g[y][x] = (x + y) % 4 ? 'L' : 'M';
        for (var lx = 5; lx < 15; lx += 3) g[12][lx + (f ? 1 : 0)] = 'L';
        [1, 8, 15].forEach(function (hx, k) {
          var up = (k + (f ? 1 : 0)) % 2, nx = hx + 1;
          for (var y = 3 + up; y < 8; y++) g[y][Math.min(Math.max(nx + (y < 6 ? (k - 1) : 0), 1), 17)] = 'M';
          var top = 1 + up; for (var dy = 0; dy < 3; dy++) for (var dx = 0; dx < 3; dx++) g[top + dy][hx + dx] = 'L';
          g[top + 1][hx + 1] = 'W'; g[top + 2][hx] = '.'; g[top + 2][hx + 2] = '.';
        });
        return g;
      }      ,
      popup: function (r, f) {   // a dialog box: title bar, an X that won't close, a warning sign, and buttons nobody should press
        var w = 15 + Math.floor(r() * 5), h = 10 + Math.floor(r() * 3), g = blank(w, h + 1), kind = Math.floor(r() * 3);
        for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var edge = !x || x === w - 1 || y === h - 1; g[y][x] = y < 3 ? (y === 2 ? 'L' : 'M') : edge ? 'L' : 'W'; }
        g[1][w - 3] = 'W'; g[1][w - 2] = f ? 'W' : 'L'; g[0][w - 2] = 'W'; g[1][2] = 'L'; g[1][3] = 'L'; g[1][4] = 'L';
        if (kind === 0) { [[4, 3], [5, 2], [5, 3], [5, 4], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5]].forEach(function (q) { g[q[0]][q[1] + 1] = 'M'; }); g[5][4] = 'W'; }   // a warning triangle
        else if (kind === 1) { for (var cy = 4; cy < 7; cy++) for (var cx = 2; cx < 5; cx++) g[cy][cx] = 'M'; g[5][3] = 'W'; }   // a stop sign
        else { g[4][3] = 'M'; g[5][3] = 'M'; g[7][3] = 'M'; }   // an exclamation mark
        g[5][Math.floor(w / 2)] = 'K'; g[5][Math.floor(w / 2) + 3] = 'K';   // eyes
        var nb = 1 + Math.floor(r() * 2), bw = 4;
        for (var b = 0; b < nb; b++) { var bx = w - 2 - (b + 1) * (bw + 1); for (var x2 = bx; x2 < bx + bw; x2++) { g[h - 3][x2] = 'M'; g[h - 2][x2] = b === (f ? 1 : 0) % nb ? 'K' : 'M'; } }
        g[h][3 + (f ? 1 : 0)] = 'L'; g[h][w - 4 - (f ? 1 : 0)] = 'L';
        return g;
      },
      packet: function (r, f) {   // a sealed envelope of data, flap and all, trailing loose bits behind it
        var w = 14 + Math.floor(r() * 3), h = 10, tail = 4, g = blank(w + tail, h + 1);
        for (var y = 1; y < h; y++) for (var x = tail; x < w + tail; x++) g[y][x] = (y === 1 || y === h - 1 || x === tail || x === w + tail - 1) ? 'M' : 'L';
        var mid = tail + Math.floor(w / 2);
        for (var x2 = tail + 1; x2 < w + tail - 1; x2++) { var yy = 2 + Math.round(Math.abs(x2 - mid) > 0 ? (Math.floor(w / 2) - Math.abs(x2 - mid)) * .5 : Math.floor(w / 4)); if (yy < h - 1) g[yy][x2] = 'M'; }
        g[2 + Math.floor(w / 4) + 1][mid] = 'K'; g[2 + Math.floor(w / 4) + 1][mid - 1] = 'K';   // the seal
        g[6][tail + 3] = 'W'; g[6][w + tail - 4] = 'W';
        for (var t = 0; t < 6; t++) if (r() < .75) g[2 + ((t + (f ? 1 : 0)) % 4) * 2][t % tail] = r() < .5 ? 'L' : 'M';
        return g;
      },
      cursor: function (r, f) {   // a pointer that grew a will of its own: an arrow, a pointing hand, or the spinning wait
        var kind = Math.floor(r() * 3), g;
        if (kind === 0) {
          g = blank(12, 16); var rows = ['L', 'LL', 'LWL', 'LWWL', 'LWWWL', 'LWWWWL', 'LWWWWWL', 'LWWWWWWL', 'LWWWWLLLL', 'LWLWWL', 'LL.LWWL', 'L...LWWL', '.....LWL', '......L'];
          rows.forEach(function (row, y) { row.split('').forEach(function (c, x) { if (c !== '.') g[y + 1][x + 1 + (f && y > 9 ? 1 : 0)] = c === 'W' ? 'W' : 'M'; }); });
          g[5][3] = 'K'; g[5][5] = 'K';
        } else if (kind === 1) {
          g = blank(13, 16); var hand = ['....MM', '...MWWM', '...MWWM', '...MWWM', '...MWWMMM', '...MWWMWWMMM', 'MM.MWWMWWMWWM', 'MWMMWWWWWWWWM', 'MWWMWWWWWWWWM', '.MWWWWWWWWWWM', '..MWWWWWWWWM', '...MWWWWWWM', '....MWWWWM', '....MMMMMM'];
          hand.forEach(function (row, y) { row.split('').forEach(function (c, x) { if (c !== '.') g[y + 1 + (f && y < 4 ? -1 : 0)][x] = c; }); });
          g[9][5] = 'K'; g[9][9] = 'K';
        } else {
          g = blank(13, 15); for (var y2 = 0; y2 < 15; y2++) { var half = y2 < 7 ? 6 - y2 : y2 - 8; if (y2 === 0 || y2 === 14) half = 6; if (half < 1) half = 1; for (var x2 = 6 - half; x2 <= 6 + half; x2++) g[y2][x2] = (y2 === 0 || y2 === 14 || x2 === 6 - half || x2 === 6 + half) ? 'M' : (f ? (y2 > 7 ? 'W' : 'L') : (y2 < 7 ? 'W' : 'L')); }
          g[3][4] = 'K'; g[3][8] = 'K';
        }
        return g;
      },
      chip: function (r, f) {   // a black microchip on scuttling pin legs, its part number half rubbed off
        var w = 11 + Math.floor(r() * 4) * 2, h = 8 + Math.floor(r() * 3), g = blank(w + 4, h + 2);
        for (var y = 1; y < h + 1; y++) for (var x = 2; x < w + 2; x++) g[y][x] = (y === 1 || y === h || x === 2 || x === w + 1) ? 'M' : 'K';
        for (var py = 2; py < h; py += 2) { var sh = ((py / 2) + (f ? 1 : 0)) % 2; g[py][0 + sh] = 'L'; g[py][1] = 'L'; g[py][w + 2] = 'L'; g[py][w + 3 - sh] = 'L'; }
        g[2][3] = 'L';   // the pin-1 dot
        g[3][4] = 'W'; g[3][w - 1] = 'W';
        var label = ''; for (var k = 0; k < 3; k++) label += r() < .5 ? '0' : '1';
        for (var lx = 4; lx < w; lx++) if (r() < .6) g[h - 2][lx] = 'M';
        g[0][4 + (f ? 1 : 0)] = 'M'; g[h + 1][w - 2 - (f ? 1 : 0)] = 'M';
        return g;
      },
      botnet: function (r, f) {   // a cluster of infected machines, wired to one ringleader with eyes
        var g = blank(21, 15), cx = 10, cy = 7, n = 4 + Math.floor(r() * 3), nodes = [];
        for (var i = 0; i < n; i++) { var a = (i / n) * Math.PI * 2 + r() * .6, rr = 6 + r() * 2.5; nodes.push([Math.round(cx + Math.cos(a) * rr * 1.25), Math.round(cy + Math.sin(a) * rr * .85)]); }
        nodes.forEach(function (nd) { var st2 = Math.max(Math.abs(nd[0] - cx), Math.abs(nd[1] - cy)); for (var t = 2; t < st2; t++) { var yy = Math.round(cy + (nd[1] - cy) * t / st2), xx = Math.round(cx + (nd[0] - cx) * t / st2); if (g[yy] && xx >= 0 && xx < 21) g[yy][xx] = (t + (f ? 1 : 0)) % 3 ? 'M' : 'W'; } });
        nodes.forEach(function (nd, k) { for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var yy = Math.min(14, Math.max(0, nd[1] + dy)), xx = Math.min(20, Math.max(0, nd[0] + dx)); g[yy][xx] = dx || dy ? 'L' : ((k + (f ? 1 : 0)) % 2 ? 'W' : 'K'); } });
        for (var y3 = cy - 2; y3 <= cy + 2; y3++) for (var x3 = cx - 3; x3 <= cx + 3; x3++) g[y3][x3] = (Math.abs(y3 - cy) === 2 || Math.abs(x3 - cx) === 3) ? 'M' : 'L';
        g[cy - 1][cx - 1] = 'K'; g[cy - 1][cx + 1] = 'K'; g[cy + 1][cx] = 'M';
        return g;
      },
      floppy: function (r, f) {   // a diskette with a metal shutter for a mouth and a label for a face
        var w = 13 + Math.floor(r() * 2), g = blank(w, 15);
        for (var y = 1; y < 14; y++) for (var x = 0; x < w; x++) g[y][x] = (y === 1 || y === 13 || !x || x === w - 1) ? 'M' : 'K';
        g[1][w - 1] = '.'; g[2][w - 1] = 'M'; g[1][w - 2] = 'M';
        var sx = Math.floor(w / 2) - 3; for (var y2 = 1; y2 < 5; y2++) for (var x2 = sx; x2 < sx + 6; x2++) g[y2][x2] = 'L'; for (var y4 = 2; y4 < 4; y4++) g[y4][sx + (f ? 1 : 4)] = 'K';
        for (var y3 = 7; y3 < 13; y3++) for (var x3 = 2; x3 < w - 2; x3++) g[y3][x3] = 'W';
        g[9][4] = 'K'; g[9][w - 5] = 'K'; for (var x4 = 5; x4 < w - 5; x4++) g[11][x4] = f ? 'M' : (x4 % 2 ? 'M' : 'W');
        g[14][3 + (f ? 1 : 0)] = 'L'; g[14][w - 4 - (f ? 1 : 0)] = 'L';
        return g;
      },
      monitor: function (r, f) {   // a fat old CRT on a stand, its picture rolling, its face made of scanlines
        var w = 15 + Math.floor(r() * 3) * 2, h = 11 + Math.floor(r() * 2), g = blank(w, h + 3), face = Math.floor(r() * 3);
        for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var bez = y < 1 || y > h - 3 || x < 2 || x > w - 3; g[y][x] = bez ? 'L' : ((y + (f ? 1 : 0)) % 3 === 0 ? 'D' : 'K'); }
        g[h - 2][w - 4] = f ? 'W' : 'M'; g[h - 2][w - 6] = 'M';   // the power light and a knob
        var ex = Math.floor(w / 2); g[4][ex - 3] = 'W'; g[4][ex + 3] = 'W'; g[5][ex - 3] = 'W'; g[5][ex + 3] = 'W';
        if (face === 0) for (var mx = ex - 2; mx <= ex + 2; mx++) g[7][mx] = 'W';
        else if (face === 1) { g[7][ex - 2] = 'W'; g[8][ex - 1] = 'W'; g[8][ex] = 'W'; g[8][ex + 1] = 'W'; g[7][ex + 2] = 'W'; }
        else { g[7][ex] = 'W'; g[8][ex] = 'W'; g[7][ex - 1] = 'W'; g[7][ex + 1] = 'W'; }
        for (var x2 = ex - 2; x2 <= ex + 2; x2++) g[h][x2] = 'M'; for (var x3 = ex - 5; x3 <= ex + 5; x3++) g[h + 1][x3] = 'M';
        return g;
      }
    };
    window.__corrupt = function (style, seed) {
      var frames = [0, 1].map(function (f) { var r = rng(seed), g = STY[style](r, f); return g; });
      var w = Math.max(frames[0][0].length, frames[1][0].length) + 2, h = Math.max(frames[0].length, frames[1].length) + 2;
      return frames.map(function (g) { return outline(pad(g, w, h)); });
    };
  })();
  var BUGSPEC = {"beetle": {"vx": 46, "fps": 9, "hover": 0}, "spider": {"vx": 72, "fps": 12, "hover": 0}, "worm": {"vx": 24, "fps": 3, "hover": 0}, "moth": {"vx": 30, "fps": 11, "hover": 3.2}, "virus": {"vx": 0, "fps": 4, "hover": 3}, "bytebug": {"vx": 40, "fps": 9, "hover": 0}, "centipede": {"vx": 30, "fps": 10, "hover": 0}, "scorpion": {"vx": 18, "fps": 5, "hover": 0}};
  var EXITS = ['exit 1', 'exit 2', 'exit 126', 'exit 127', 'exit 130', 'exit 137', 'exit 139', 'exit 255'];
  var BUGS = ["beetle", "spider", "worm", "moth", "virus", "bytebug", "centipede", "scorpion"];
  var POOLS = {}; ['descent','data','firewall','circuit','alley','tunnel','server','glitch','radar','ridge','blacksignal','signal','terminal','skyline','ink'].forEach(function (id) { POOLS[id] = BUGS; });
  function obPal(light) {
    return light ? { W: '#151515', L: '#3a3a3c', M: '#6a6a6c', D: '#a8a49c', K: '#eeebe4' } : { W: '#f4f4f4', L: '#c4c4c8', M: '#808086', D: '#3c3c42', K: '#111113' };
  }
  /* the 16-bit pass: the same 8-bit designs, drawn at twice the resolution with a light source.
     Each cell becomes 2x2: lit from the top left, shaded to the bottom right, a dark sel-out edge,
     a dithered mid-tone, glints in the eyes, and a soft rim so it reads against a dark arena. */
  var hdCache = {};
  function hdCanvas(rows, key) {
    if (key && hdCache[key]) return hdCache[key];
    var H = rows.length, W = rows[0].length;
    function at(x, y) { var r = rows[y]; if (!r || x < 0) return '.'; var q = r.charAt(x); return q === '' ? '.' : q; }
    // 1. Scale2x: double the grid, rounding off the stair-steps on diagonals instead of just making bigger squares
    var W2 = W * 2, H2 = H * 2, g = [];
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      // rounding works on the silhouette only (filled or not), so inner details like digits and eyes stay crisp
      var P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
      var mP = P !== '.', mA = A !== '.', mB = B !== '.', mC = C !== '.', mD = D !== '.';
      function pick(n1, n2, m1, m2, mo1, mo2, c1) { return (m1 === m2 && m1 !== mo1 && m2 !== mo2 && m1 !== mP) ? (m1 ? c1 : '.') : P; }
      var e0 = pick(C, A, mC, mA, mD, mB, mA ? A : C), e1 = pick(A, B, mA, mB, mC, mD, mB ? B : A), e2 = pick(D, C, mD, mC, mB, mA, mC ? C : D), e3 = pick(B, D, mB, mD, mA, mC, mD ? D : B);
      g[(y * 2) * W2 + x * 2] = e0; g[(y * 2) * W2 + x * 2 + 1] = e1; g[(y * 2 + 1) * W2 + x * 2] = e2; g[(y * 2 + 1) * W2 + x * 2 + 1] = e3;
    }
    function G(x, y) { return x < 0 || y < 0 || x >= W2 || y >= H2 ? '.' : g[y * W2 + x]; }
    var pad = 2, cw = W2 + pad * 2, ch = H2 + pad * 2, cvs = document.createElement('canvas'); cvs.width = cw; cvs.height = ch; cvs.hd = 2;
    var c = cvs.getContext('2d'), img = c.createImageData(cw, ch), d = img.data, body = [];
    var TONE = { K: 24, D: 58, M: 130, L: 196, W: 250 };
    // 2. volume: inside each patch of one tone, lighter toward its top and left, darker toward its bottom and right
    for (var y2 = 0; y2 < H2; y2++) for (var x2 = 0; x2 < W2; x2++) {
      var q = G(x2, y2); if (q === '.') continue;
      var t = TONE[q] || 160;
      if (q === 'L' || q === 'M') {
        var du = 0, dd = 0, dl = 0, dr = 0;
        while (du < 6 && G(x2, y2 - du - 1) === q) du++; while (dd < 6 && G(x2, y2 + dd + 1) === q) dd++;
        while (dl < 6 && G(x2 - dl - 1, y2) === q) dl++; while (dr < 6 && G(x2 + dr + 1, y2) === q) dr++;
        t += Math.max(-44, Math.min(36, (dd - du) * 9)) + Math.max(-16, Math.min(14, (dr - dl) * 4));
        if (du === 0 && G(x2, y2 - 1) === '.') t += 26;        // a bright rim where light hits the top edge
        if (q === 'M' && (x2 + y2) % 2 && dd < 2) t -= 16;     // dithered shadow at the bottom of mid tones
        t += (0.5 - y2 / H2) * 30;                             // and the whole sprite is lit from above
      }
      if (q === 'W') { var lone = G(x2 - 1, y2) !== 'W' || G(x2 + 1, y2) !== 'W'; if (lone && G(x2 + 1, y2) !== 'W' && G(x2, y2 + 1) !== 'W') t = 170; }   // eyes: a shaded lower corner
      if (q === 'K') { if (G(x2 - 1, y2) !== 'K' && G(x2, y2 - 1) !== 'K') t = 200; }   // a glint at the top-left of every dark patch
      if (q === 'D') t = 46 + (0.5 - y2 / H2) * 16;
      var X = x2 + pad, Y = y2 + pad, k = Y * cw + X, i = k * 4, v = Math.max(6, Math.min(255, Math.round(t)));
      body[k] = 1; d[i] = v; d[i + 1] = v; d[i + 2] = Math.min(255, v + 7); d[i + 3] = 255;
    }
    // 3. a soft rim outside the silhouette, so the dark outline still reads against a dark arena
    for (var Y2 = 0; Y2 < ch; Y2++) for (var X2 = 0; X2 < cw; X2++) {
      var k2 = Y2 * cw + X2, j2 = k2 * 4; if (body[k2]) continue;
      if (body[k2 - 1] || body[k2 + 1] || body[k2 - cw] || body[k2 + cw]) { d[j2] = 232; d[j2 + 1] = 232; d[j2 + 2] = 240; d[j2 + 3] = 62; }
    }
    c.putImageData(img, 0, 0);
    if (key) hdCache[key] = cvs;
    return cvs;
  }
  /* the same 16-bit pass for full-colour sprites (Vee and the people of the city): works on any canvas.
     Scale2x on the silhouette, then each patch of one colour gets lit from above and shaded below,
     with a darker edge on the shadow side. The result is twice the size and flagged .hd = 2. */
  function hdFromCanvas(src) {
    if (src._hd) return src._hd;
    var w = src.width, h = src.height, sd = src.getContext('2d').getImageData(0, 0, w, h).data;
    function px(x, y) { return x < 0 || y < 0 || x >= w || y >= h ? 0 : (sd[(y * w + x) * 4 + 3] >= 200 ? ((sd[(y * w + x) * 4] << 16) | (sd[(y * w + x) * 4 + 1] << 8) | sd[(y * w + x) * 4 + 2]) + 1 : 0); }
    var W2 = w * 2, H2 = h * 2, g = new Array(W2 * H2);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var P = px(x, y), A = px(x, y - 1), B = px(x + 1, y), C = px(x - 1, y), D = px(x, y + 1);
      var mP = !!P, mA = !!A, mB = !!B, mC = !!C, mD = !!D;
      function pick(m1, m2, mo1, mo2, c1, c2) { return (m1 === m2 && m1 !== mo1 && m2 !== mo2 && m1 !== mP) ? (m1 ? c1 : 0) : (mP && m1 && m2 && c1 === c2 && c1 !== P && mo1 && mo2 ? P : P); }
      g[(y * 2) * W2 + x * 2] = pick(mC, mA, mD, mB, A || C, C);
      g[(y * 2) * W2 + x * 2 + 1] = pick(mA, mB, mC, mD, B || A, A);
      g[(y * 2 + 1) * W2 + x * 2] = pick(mD, mC, mB, mA, C || D, D);
      g[(y * 2 + 1) * W2 + x * 2 + 1] = pick(mB, mD, mA, mC, D || B, B);
    }
    function G(x, y) { return x < 0 || y < 0 || x >= W2 || y >= H2 ? 0 : g[y * W2 + x]; }
    function lumOf(q) { var c = q - 1; return ((c >> 16 & 255) * .3 + (c >> 8 & 255) * .59 + (c & 255) * .11) / 255; }
    var out = document.createElement('canvas'); out.width = W2; out.height = H2; out.hd = 2;
    var oc = out.getContext('2d'), img = oc.createImageData(W2, H2), d = img.data;
    for (var gy = 0; gy < h; gy++) for (var gx = 0; gx < w; gx++) {   // soft glow pixels (alpha below 200) are copied as they are, at double size
      var si = (gy * w + gx) * 4, al = sd[si + 3]; if (!al || al >= 200) continue;
      for (var sy = 0; sy < 2; sy++) for (var sx = 0; sx < 2; sx++) { var di = ((gy * 2 + sy) * W2 + gx * 2 + sx) * 4; d[di] = sd[si]; d[di + 1] = sd[si + 1]; d[di + 2] = sd[si + 2]; d[di + 3] = al; }
    }
    for (var y2 = 0; y2 < H2; y2++) for (var x2 = 0; x2 < W2; x2++) {
      var q = G(x2, y2); if (!q) continue;
      var c = q - 1, r = c >> 16 & 255, gg = c >> 8 & 255, b = c & 255, lum = (r * .3 + gg * .59 + b * .11) / 255;
      var du = 0, dd = 0; while (du < 6 && G(x2, y2 - du - 1) === q) du++; while (dd < 6 && G(x2, y2 + dd + 1) === q) dd++;
      var dl = 0, dr = 0; while (dl < 6 && G(x2 - dl - 1, y2) === q) dl++; while (dr < 6 && G(x2 + dr + 1, y2) === q) dr++;
      var tall = du + dd >= 3, wide = dl + dr >= 3;   // thin details (strands of hair, stripes, eyes) stay flat; only real surfaces get volume
      var k = 1 + (tall ? Math.max(-.14, Math.min(.12, (dd - du) * .03)) : 0) + (wide ? Math.max(-.05, Math.min(.05, (dr - dl) * .012)) : 0);
      if (tall && wide && du === 0 && !G(x2, y2 - 1)) k += .1;                    // rim light on top edges
      var edge = !G(x2 + 1, y2) || !G(x2, y2 + 1), edgeL = !G(x2 - 1, y2) || !G(x2, y2 - 1);
      if (edge) k *= .7; else if (edgeL) k *= .9;                               // sel-out: darker on the shadow side
      var up1 = G(x2, y2 - 1), up2 = G(x2, y2 - 2), lft = G(x2 - 1, y2), rgt = G(x2 + 1, y2);
      if (up1 && up1 !== q && lumOf(up1) < lum - .05) k *= .84;                  // contact shadow under hair, arms and collars
      else if (up2 && up1 === q && up2 !== q && lumOf(up2) < lum - .05) k *= .93;
      if (lft && lft !== q) k += lumOf(lft) < lum ? .07 : -.03;                   // each strand and fold gets a lit left side
      if (rgt && rgt !== q && lumOf(rgt) < lum) k *= .9;                          // and a shaded right side
      if (lum < .12) k = 1;                                                      // true blacks (outlines, pupils) stay black
      if (lum < .16 && (x2 % 2 === 0) && (y2 % 2 === 0)) {                        // a dark dot set in a lighter face is an eye: give it a catchlight
        var sl = px((x2 >> 1) - 1, y2 >> 1), sr = px((x2 >> 1) + 1, y2 >> 1);
        var su = px(x2 >> 1, (y2 >> 1) - 1), sb = px(x2 >> 1, (y2 >> 1) + 1);
        var sp0 = px(x2 >> 1, y2 >> 1);
        if (sl && sr && sl === sr && lumOf(sl) > .34 && !(su === sp0 && sb === sp0) && ((su && lumOf(su) > .34) || (sb && lumOf(sb) > .34))) { r = gg = b = 225; k = 1; }
      }
      var add = tall && wide && lum > .12 && du === 0 && dl === 0 && !edge ? 10 : 0, i = (y2 * W2 + x2) * 4;
      d[i] = Math.min(255, r * k + add); d[i + 1] = Math.min(255, gg * k + add); d[i + 2] = Math.min(255, b * k + add); d[i + 3] = 255;
    }
    oc.putImageData(img, 0, 0);
    src._hd = out; return out;
  }
  /* the 16-bit pass for scenery: maps, buildings, battle backdrops. Lighter than the sprite pass so the city
     doesn't look embossed: Scale2x rounds every diagonal between colours, then each colour edge gets a thin lit
     top and left, a thin shade bottom and right, and a contact shadow where something darker sits above. */
  function hdScene(src, out) {
    var w = src.width, h = src.height, sd = src.getContext('2d').getImageData(0, 0, w, h).data, n = w * h;
    var col = new Int32Array(n), al = new Uint8Array(n);
    for (var i = 0; i < n; i++) { al[i] = sd[i * 4 + 3]; col[i] = al[i] ? ((sd[i * 4] << 16) | (sd[i * 4 + 1] << 8) | sd[i * 4 + 2]) + 1 : 0; }
    var W2 = w * 2, H2 = h * 2, g = new Int32Array(W2 * H2), ga = new Uint8Array(W2 * H2);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var k = y * w + x, P = col[k], A = y ? col[k - w] : P, B = x < w - 1 ? col[k + 1] : P, C = x ? col[k - 1] : P, D = y < h - 1 ? col[k + w] : P;
      var o = y * 2 * W2 + x * 2, a = al[k];
      g[o] = (C === A && C !== D && A !== B) ? A : P; g[o + 1] = (A === B && A !== C && B !== D) ? B : P;
      g[o + W2] = (D === C && D !== B && C !== A) ? C : P; g[o + W2 + 1] = (B === D && B !== A && D !== C) ? D : P;
      ga[o] = g[o] === P ? a : 255; ga[o + 1] = g[o + 1] === P ? a : 255; ga[o + W2] = g[o + W2] === P ? a : 255; ga[o + W2 + 1] = g[o + W2 + 1] === P ? a : 255;
      if (!P) { ga[o] = g[o] ? 255 : 0; ga[o + 1] = g[o + 1] ? 255 : 0; ga[o + W2] = g[o + W2] ? 255 : 0; ga[o + W2 + 1] = g[o + W2 + 1] ? 255 : 0; }
    }
    function lum(q) { var c = q - 1; return (c >> 16 & 255) * .3 + (c >> 8 & 255) * .59 + (c & 255) * .11; }
    // run lengths: how far each subpixel is from the top, bottom, left and right of its patch of colour (two scans each way)
    var N2 = W2 * H2, du = new Uint16Array(N2), dd = new Uint16Array(N2), dl = new Uint16Array(N2), dr = new Uint16Array(N2);
    for (var j0 = W2; j0 < N2; j0++) if (g[j0] === g[j0 - W2]) du[j0] = du[j0 - W2] + 1;
    for (var j1 = N2 - W2 - 1; j1 >= 0; j1--) if (g[j1] === g[j1 + W2]) dd[j1] = dd[j1 + W2] + 1;
    for (var yy = 0; yy < H2; yy++) { var row = yy * W2; for (var xx = 1; xx < W2; xx++) if (g[row + xx] === g[row + xx - 1]) dl[row + xx] = dl[row + xx - 1] + 1; for (var xr = W2 - 2; xr >= 0; xr--) if (g[row + xr] === g[row + xr + 1]) dr[row + xr] = dr[row + xr + 1] + 1; }
    out = out || document.createElement('canvas'); if (out.width !== W2) out.width = W2; if (out.height !== H2) out.height = H2; out.hd = 2;
    var oc = out.getContext('2d'), img = oc.createImageData(W2, H2), d = img.data;
    for (var y2 = 0; y2 < H2; y2++) for (var x2 = 0; x2 < W2; x2++) {
      var j = y2 * W2 + x2, q = g[j]; if (!q) continue;
      var c = q - 1, r = c >> 16 & 255, gg = c >> 8 & 255, b = c & 255, L = r * .3 + gg * .59 + b * .11, m = 1, add = 0;
      var up = y2 ? g[j - W2] : q, dn = y2 < H2 - 1 ? g[j + W2] : q, lf = x2 ? g[j - 1] : q, rt = x2 < W2 - 1 ? g[j + 1] : q;
      var vt = du[j] + dd[j], ht = dl[j] + dr[j];
      if (vt >= 6) m *= 1.09 - .18 * (du[j] / vt);                                     // every surface is lit from above: lighter at its top, darker at its foot
      if (ht >= 6) m *= 1.03 - .06 * (dl[j] / ht);                                     // and a little from the left
      function diff(n2) { return n2 && n2 !== q && Math.abs(lum(n2) - L) > 7; }        // neighbouring shades of one gradient don't count as an edge
      if (diff(up)) { if (lum(up) < L - 12) m *= .78; else add += 10; }                 // under something darker: contact shadow; otherwise a lit top edge
      else if (y2 > 1 && up === q && g[j - 2 * W2] !== q && g[j - 2 * W2] && lum(g[j - 2 * W2]) < L - 12) m *= .92;
      if (diff(dn) && lum(dn) < L) m *= .84;                                      // shade along the bottom edge
      if (diff(lf)) add += lum(lf) < L ? 8 : 0;                                    // a lit left edge
      if (diff(rt) && lum(rt) < L) m *= .93;                                       // a shaded right edge
      if (L > 70 && ((x2 ^ y2) & 1) && up === q && dn === q && lf === q && rt === q) add += (x2 + y2) % 4 === 0 ? 3 : -2;   // a fine ordered dither inside flat colour
      var i4 = j * 4; d[i4] = Math.max(0, Math.min(255, r * m + add)); d[i4 + 1] = Math.max(0, Math.min(255, gg * m + add)); d[i4 + 2] = Math.max(0, Math.min(255, b * m + add)); d[i4 + 3] = ga[j];
    }
    oc.putImageData(img, 0, 0);
    return out;
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
    e.preventDefault(); if (window.VondsPick) window.VondsPick(); else open(0);
  });
  /* ---------- hints that the game exists ---------- */
  window.VondsGame = { open: function () { open(0); } };
  window.VondsSprite = { frame: frame, look: function () { return LOOK; }, pose: POSE, arm: ARM,
    bug: function (kind, f) { var fr = OBMAP[kind]; return obCanvas(fr[f % fr.length], false, 'rpg' + kind + (f % fr.length)); }, bugs: Object.keys(OBMAP),
    hd: hdFromCanvas, hdScene: hdScene,
    bugHD: function (kind, f) { var fr = OBMAP[kind]; return hdCanvas(fr[f % fr.length], 'hd' + kind + (f % fr.length)); },
    addBug: function (kind, frames) { OBMAP[kind] = frames; } };
  try {
    console.log('%cV O N D S', 'font:600 20px Dosis,system-ui,sans-serif;letter-spacing:.6em;color:#2e2e30');
    console.log('%cHey, fellow builder. The logo up in the hero is a game.\nOr open the terminal with ` and type play.', 'font:13px ui-monospace,Menlo,Consolas,monospace;color:#5a5a60;line-height:1.6');
  } catch (e) {}

  // every 30 seconds in the hero, the sprite walks in along the top, points at the logo, hops, and runs off
  (function peek() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var wrap = document.createElement('div'); wrap.className = 'gpeek'; wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<i class="gshadow"></i><canvas></canvas>';
    document.body.appendChild(wrap);
    var pc = wrap.querySelector('canvas'), px2 = pc.getContext('2d'), shadow = wrap.querySelector('.gshadow');
    var S, CW, CH, R = 1, raf2 = 0, t0 = 0, played = false, landed = false, kicked = false, prev = null;
    // afterimages for the run-off, same effect as in the game
    var ghosts = [], hist = [];
    for (var gi = 0; gi < 7; gi++) { var gcv = document.createElement('canvas'); gcv.className = 'gghost'; wrap.insertBefore(gcv, pc); ghosts.push(gcv); }
    function snap(v) { return Math.round(v * R) / R; }
    function paint(cv, name, mirror) {
      var c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.imageSmoothingEnabled = false;
      if (mirror) { c.translate(cv.width, 0); c.scale(-1, 1); }
      c.drawImage(frame(name, null, true), 0, 0, cv.width, cv.height);
    }
    function trail(name, x, y, mirror) {
      hist.push({ n: name, x: x, y: y, m: mirror }); if (hist.length > ghosts.length) hist.shift();
      ghosts.forEach(function (g, i) {
        var h = hist[i]; if (!h) { g.style.opacity = 0; return; }
        if (g.width !== pc.width) { g.width = pc.width; g.height = pc.height; g.style.width = CW + 'px'; g.style.height = CH + 'px'; }
        paint(g, h.n, h.m);
        g.style.transform = 'translate3d(' + snap(h.x + (hist.length - i) * 3.5 * S * (h.m ? 1 : -1)) + 'px,' + snap(h.y) + 'px,0)';
        g.style.opacity = ((i + 1) / ghosts.length * .32).toFixed(3);
      });
    }
    function clearTrail() { hist = []; ghosts.forEach(function (g) { g.style.opacity = 0; }); }
    function size() {
      R = Math.min(3, window.devicePixelRatio || 1); S = innerWidth < 640 ? 2.5 : 3; CW = Math.round(22 * S); CH = Math.round(26 * S);
      pc.width = Math.round(CW * R); pc.height = Math.round(CH * R); pc.style.width = CW + 'px'; pc.style.height = CH + 'px';
    }
    function ok() { return (window.scrollY || 0) < 40 && !document.hidden && !(window.VondsGuide && window.VondsGuide.active()) && !gm.classList.contains('open') && !document.body.classList.contains('diving') && !document.querySelector('.xp-term.open, .overlay.open, .cs.open, dialog[open]'); }
    // where he stops: just below and left of the logo, so the raised hand points up at it
    function spot() {
      var b = brand ? brand.getBoundingClientRect() : { left: 40, right: 70, top: 20, bottom: 60, width: 30, height: 40 };
      if (b.left > 20.5 * S + 10) return { x: b.left - 2 - 20.5 * S, y: b.bottom + 10 - 12.5 * S, flip: false };
      // no room on the left (phones): stand below and right of the logo, turn back and point up at it
      return { x: b.right + 4 - 1.5 * S, y: b.bottom + 4, flip: true };
    }
    // name, position, facing, how high off the ground, and a squash amount for landings
    function draw(name, x, y, mirror, air, squash) {
      if (!prev || prev.n !== name || prev.m !== mirror) { paint(pc, name, mirror); prev = { n: name, m: mirror }; }
      var sq = squash || 0, lift = air || 0;
      pc.style.transform = 'translate3d(' + snap(x) + 'px,' + snap(y - lift) + 'px,0) scale(' + (1 + sq * .08).toFixed(3) + ',' + (1 - sq * .1).toFixed(3) + ')';
      var feet = y + 25 * S, cx = x + (mirror ? 10.5 : 11.5) * S, f = Math.max(.35, 1 - lift / (14 * S));
      shadow.style.transform = 'translate3d(' + snap(cx - 5 * S) + 'px,' + snap(feet - 1.2 * S) + 'px,0) scale(' + f.toFixed(3) + ')';
      shadow.style.width = (10 * S) + 'px'; shadow.style.height = (2.4 * S) + 'px'; shadow.style.opacity = (.55 * f).toFixed(3);
    }
    // little pixel dust puffs at the feet
    function dust(x, y, dir, n) {
      for (var i = 0; i < n; i++) {
        var d2 = document.createElement('i'); d2.className = 'gdust';
        var sz = Math.round(S * (1 + Math.random())), dx = (dir * (6 + Math.random() * 14) + (Math.random() - .5) * 10) * S / 3, dy = -(3 + Math.random() * 9) * S / 3;
        d2.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;transform:translate3d(' + snap(x) + 'px,' + snap(y) + 'px,0);--dx:' + dx.toFixed(1) + 'px;--dy:' + dy.toFixed(1) + 'px;animation-delay:' + (i * 18) + 'ms';
        wrap.appendChild(d2); setTimeout(function (el) { return function () { el.remove(); }; }(d2), 900);
      }
    }
    function end() { cancelAnimationFrame(raf2); clearTrail(); wrap.classList.remove('on'); prev = null; }
    var WALK = 1.8, REST = .35, POINT = 2.8, HOP = .4, RUN = .62;
    function ease(u) { return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
    function step(ts) {
      if (!t0) t0 = ts;
      var t = (ts - t0) / 1000, sp = spot(), from = -CW - 10;
      if (!ok()) { end(); return; }
      var footX = sp.x + (sp.flip ? 10.5 : 11.5) * S, feet = sp.y + 25 * S;
      if (t < WALK) {                                      // walk in, steps matched to distance so feet never slide
        var e = 1 - Math.pow(1 - t / WALK, 2.2), x = from + (sp.x - from) * e, travelled = x - from;
        draw(t / WALK > .97 ? 'idle' : 'run' + (Math.floor(travelled / (3.4 * S)) % 4), x, sp.y, false);
      } else if (t < WALK + REST) {                        // a breath before pointing
        draw(sp.flip && t - WALK > .12 ? 'idle2' : 'idle', sp.x, sp.y, sp.flip && t - WALK > .12);
      } else if (t < WALK + REST + POINT) {                // point at the logo, with a small bounce
        var tp = t - WALK - REST;
        draw(Math.floor(tp * 2.4) % 2 ? 'point2' : 'point', sp.x, sp.y, sp.flip);
      } else if (t < WALK + REST + POINT + HOP + .12) {    // turn toward the exit, quick hop, soft landing
        var u = (t - WALK - REST - POINT) / HOP;
        if (u <= 1) draw(u > .12 && u < .88 ? 'jump' : 'idle', sp.x, sp.y, true, Math.sin(Math.PI * u) * 8 * S, u < .12 ? (.12 - u) * 4 : 0);
        else { if (!landed) { landed = true; dust(footX, feet - S, 0, 6); } draw('idle', sp.x, sp.y, true, 0, 1 - (u - 1) * HOP / .12); }
      } else if (t < WALK + REST + POINT + HOP + .12 + RUN) {   // then run off screen, trail streaming behind
        var e2 = (t - WALK - REST - POINT - HOP - .12) / RUN, rx = sp.x + (from - sp.x) * e2 * e2 * (1.2 - .2 * e2);
        if (!kicked) { kicked = true; dust(footX + 2 * S, feet - S, 1, 7); }
        var rf = 'run' + (Math.floor((sp.x - rx) / (3 * S)) % 4);
        draw(rf, rx, sp.y, true); trail(rf, rx, sp.y, true);
      } else { end(); return; }
      raf2 = requestAnimationFrame(step);
    }
    function go() { if (!ok() || played) return; size(); t0 = 0; landed = kicked = false; prev = null; wrap.classList.add('on'); raf2 = requestAnimationFrame(step); }
    setTimeout(go, 8000); setInterval(go, 30000);
    // stop nudging once they have found it
    var o2 = open; open = function (i) { played = true; end(); o2(i); }; window.VondsGame.open = function () { open(0); };
    window.__gpeek = go;
  })();

  /* ---------- Vee: a small guide with a pointer stick ---------- */
  (function guide() {
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    POSE.gdown = { bl: 'down', fl: 'down', ba: 'mid', fa: 'fwd', bob: 0, sway: 0 };
    POSE.gpoint = { bl: 'down', fl: 'down', ba: 'mid', fa: 'point', bob: 0, sway: 0 };
    POSE.ghold = { bl: 'down', fl: 'down', ba: 'mid', fa: 'mid', bob: 0, sway: 0 };
    POSE.gjump = { bl: 'trail', fl: 'tuck', ba: 'back', fa: 'up', bob: 0, sway: 3, lift: 3 };
    // stick pixels in sprite-canvas coordinates (x, y), last two are the bright tip
    var STICK = {
      gdown: [[16, 18], [16, 19], [17, 20], [17, 21], [17, 22], [18, 23], [18, 24], [18, 25], [18, 26]],
      gpoint: [[21, 11], [22, 10], [23, 10], [24, 9], [25, 8], [26, 8], [27, 7], [28, 6], [29, 6]],
      ghold: [[13, 20], [13, 19], [13, 18], [13, 17], [13, 16], [13, 15], [13, 14], [13, 13], [13, 12], [13, 11]],
      gjump: []
    };
    var GW = 40, GH = 40, OX = 9, OY = 6;
    var el = document.createElement('div'); el.className = 'gguide';
    el.innerHTML = '<i class="grope"></i><div class="gbody"><canvas></canvas></div><div class="gtalk" role="status"><b class="gwho">Vee</b><p></p><div class="gacts"></div></div>';
    document.body.appendChild(el);
    var body = el.querySelector('.gbody'), cv2 = el.querySelector('canvas'), cx2 = cv2.getContext('2d'), talk = el.querySelector('.gtalk'), txt = talk.querySelector('p'), acts = talk.querySelector('.gacts'), rope = el.querySelector('.grope');
    var S = 3, R = 1, cur = null, hideT = 0;
    function scale() { R = Math.min(3, window.devicePixelRatio || 1); S = innerWidth < 640 ? 2.4 : 3; cv2.width = Math.round(GW * S * R); cv2.height = Math.round(GH * S * R); cv2.style.width = GW * S + 'px'; cv2.style.height = GH * S + 'px'; }
    // front-facing Vee (for when he turns to the visitor): left half, mirrored
    var FRONT_HALF = [
      '...........', '.......DDDD', '.....DHHHHH', '....DHHhHHH', '...DHHHHHHh', '..HDHHHHHHH', '..DDHHSSSSS', '.HDdHHSSSSS', '.HDdHSSSESS',
      '.HDDHSSSESS', '.HHHHSSSSSS', '.HHHHSRSSSS', '.HHHH.SSSSE', '.HHHH..SSSS', '.......TTTT', '......STTTT', '......STTTT', '......STTTT',
      '.......TTTT', '.......LLLL', '........PP.', '........PP.', '........PP.', '.......BBB.', '...........', '...........'];
    // locs: thick, wavy strands that fall past the waist, matching the side view
    var WAVE = [0, 0, 0, 1, 1, 1];
    function locsFront(x, pal, step) {
      function strand(x0, y, last) { [0, 1].forEach(function (k) { var c = last || k ? 'H' : 'h'; x.fillStyle = pal[c]; x.fillRect(x0 + k, y, 1, 1); x.fillRect(21 - x0 - k, y, 1, 1); }); }
      for (var y = 10; y <= 20; y++) { x.clearRect(0, y, 6, 1); x.clearRect(16, y, 6, 1); }
      for (var y1 = 10; y1 <= 20; y1++) strand(WAVE[y1 % 6], y1, y1 === 20);            // outer strand
      for (var y2 = 10; y2 <= 19; y2++) strand(2 + WAVE[(y2 + 2) % 6], y2, y2 === 19);        // inner strand, behind the arm
      // arms stay in front of the locs: a dark edge, a light sleeve, a bright hand, so they never read as hair
      function both(cx0, y, c) { x.fillStyle = c; x.fillRect(cx0, y, 1, 1); x.fillRect(21 - cx0, y, 1, 1); }
      var tp = x.getImageData(8, 15, 1, 1).data, shirt = 'rgb(' + tp[0] + ',' + tp[1] + ',' + tp[2] + ')', shirtD = 'rgb(' + (tp[0] * .82 | 0) + ',' + (tp[1] * .82 | 0) + ',' + (tp[2] * .82 | 0) + ')', shirtC = 'rgb(' + (tp[0] * .6 | 0) + ',' + (tp[1] * .6 | 0) + ',' + (tp[2] * .6 | 0) + ')';   // sleeves match the shirt
      for (var y3 = 14; y3 <= 18; y3++) { both(4, y3, 'rgb(14,14,16)'); both(5, y3, y3 <= 16 ? shirtD : pal.R); both(6, y3, y3 <= 16 ? shirt : pal.R); if (y3 <= 16) both(7, y3, shirtC); }
      both(5, 19, 'rgb(14,14,16)'); both(6, 19, 'rgb(14,14,16)'); both(5, 13, 'rgb(14,14,16)');
      if (step) {   // arms swing opposite the legs: the hand on the planted-foot side comes forward (up a row), the other trails
        var fx = step === 1 ? 15 : 5;
        x.fillStyle = pal.R; x.fillRect(fx, 16, 2, 1); x.fillStyle = 'rgb(14,14,16)'; x.fillRect(fx, 18, 2, 2);
        var bx = step === 1 ? 5 : 15; x.fillStyle = pal.R; x.fillRect(bx, 19, 2, 1); x.fillStyle = 'rgb(14,14,16)'; x.fillRect(bx, 20, 2, 1);
      }
    }
    function locsBack(x, pal) {
      for (var y0 = 12; y0 <= 21; y0++) { x.clearRect(3, y0, 16, 1); if (y0 <= 20) { x.fillStyle = 'rgba(236,236,236,.38)'; x.fillRect(3, y0, 16, 1); } }   // the light seams between strands
      for (var k = 0; k < 5; k++) for (var y = 12; y <= 21 - (k % 2); y++) {
        var x0 = 3 + k * 3 + WAVE[(y + k * 2) % 6], end = y === 21 - (k % 2);
        x.fillStyle = pal[end ? 'H' : 'h']; x.fillRect(x0, y, 1, 1); x.fillStyle = pal.H; x.fillRect(x0 + 1, y, 1, 1);
      }
      for (var y4 = 20; y4 <= 22; y4++) { x.fillStyle = pal.P; x.fillRect(8, y4, 2, 1); x.fillRect(12, y4, 2, 1); }   // legs show below the hair
    }
    // walking, seen from the front or back: one foot lifts and comes forward (a row higher, a pixel wider), the other plants
    function stepLegs(x, pal, step) {
      if (!step) return;
      var lift = step === 1 ? [7, 10] : [11, 14], plant = step === 1 ? [11, 14] : [7, 10], inner = step === 1 ? 8 : 12;
      x.clearRect(lift[0], 20, 4, 5);
      x.fillStyle = pal.P; x.fillRect(inner, 20, 2, 1);
      x.fillStyle = pal.B; x.fillRect(step === 1 ? 7 : 12, 21, 3, 1);              // the lifted shoe, two rows up, its sole showing
      x.fillStyle = 'rgb(40,40,44)'; x.fillRect(step === 1 ? 7 : 12, 22, 3, 1);
      x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(step === 1 ? 7 : 12, 24, 3, 1);    // its shadow left on the ground
      x.fillStyle = pal.P; x.fillRect(step === 1 ? 12 : 8, 23, 2, 1);              // the planted leg straightens and takes the weight
      x.fillStyle = pal.B; x.fillRect(step === 1 ? 12 : 7, 24, 3, 1);
    }
    var frontCache = {};
    function frontImg(light, blink, step) {
      step = step || 0; var key = (light ? 'L' : 'D') + (blink ? 'b' : '') + step; if (frontCache[key]) return frontCache[key];
      var pal = palette(LOOK), c = document.createElement('canvas'); c.width = 22; c.height = 26; var x = c.getContext('2d');
      FRONT_HALF.forEach(function (half, y) {
        var row = half + half.split('').reverse().join('');
        for (var i = 0; i < 22; i++) { var ch = row.charAt(i); if (ch === '.') continue; if (blink && ch === 'E') ch = 'S'; x.fillStyle = pal[ch] || pal.S; x.fillRect(i, y, 1, 1); }
      });
      if (blink) { x.fillStyle = pal.E; x.fillRect(7, 8, 1, 1); x.fillRect(14, 8, 1, 1); }
      stepLegs(x, pal, step);
      locsFront(x, pal, step);
      var d = x.getImageData(0, 0, 22, 26).data, pts = [];
      for (var yy = 0; yy < 26; yy++) for (var xx = 0; xx < 22; xx++) {
        if (d[(yy * 22 + xx) * 4 + 3]) continue;
        if ([[1,0],[-1,0],[0,1],[0,-1]].some(function (o) { var a = xx + o[0], b = yy + o[1]; return a >= 0 && b >= 0 && a < 22 && b < 26 && d[(b * 22 + a) * 4 + 3] > 200; })) pts.push(xx, yy);
      }
      x.fillStyle = light ? 'rgba(20,20,22,.55)' : 'rgba(236,236,236,.38)'; for (var j = 0; j < pts.length; j += 2) x.fillRect(pts[j], pts[j + 1], 1, 1);
      return (frontCache[key] = c);
    }
    // out of breath, from the side: bent over, hands on knees (facing right; flipped when he faces left)
    var PANT = [
      '......................', '......................', '......................',
      '...........HHHHH......', '.........HHhHHHHHH..W.', '........HHhHHHHHHHH...', '.......HHHHHHHHHHHHH..',
      '.......HHHHHHHSSSSSH..', '......HHHHHHDSSSSSSS..', '......HHHHHHDSSSSESSS.', '.....HHHH.HHDDSSSSSRS.',
      '.....HHH...HSSSSSSSEE.', '....HHH...TTSSSSSSS...', '....HH...TTTTSSSSS....', '...HH..TTTTTTTA.......',
      '...H..TTTTTTTTAA......', '...H.TTTTTTTTT.AA.....', '.....LLLLLLLL...AA....', '.....PPPPPPPP...SS....',
      '......PPP..PPP.SSS....', '......PPP...PPP.......', '......PPP....PP.......', '......PPP....PP.......',
      '.....BBBB....BBBB.....', '......................', '......................'];
    var pantCache = {};
    function pantImg(light, phase) {
      var key = (light ? 'L' : 'D') + phase; if (pantCache[key]) return pantCache[key];
      var pal = palette(LOOK), c = document.createElement('canvas'); c.width = 22; c.height = 26; var x = c.getContext('2d');
      PANT.forEach(function (row, y) {
        for (var i = 0; i < 22; i++) {
          var ch = row.charAt(i); if (ch === '.') continue;
          if (ch === 'W') { if (phase) continue; x.fillStyle = 'rgb(236,236,240)'; x.fillRect(i, y, 1, 1); continue; }   // a bead of sweat
          var dy = phase && y < 18 ? 1 : 0;   // the upper body heaves down on each breath
          x.fillStyle = pal[ch] || pal.S; x.fillRect(i, y + dy, 1, 1);
        }
      });
      var d = x.getImageData(0, 0, 22, 26).data, pts = [];
      for (var yy = 0; yy < 26; yy++) for (var xx = 0; xx < 22; xx++) {
        if (d[(yy * 22 + xx) * 4 + 3]) continue;
        if ([[1,0],[-1,0],[0,1],[0,-1]].some(function (o) { var a = xx + o[0], b = yy + o[1]; return a >= 0 && b >= 0 && a < 22 && b < 26 && d[(b * 22 + a) * 4 + 3] > 200; })) pts.push(xx, yy);
      }
      x.fillStyle = light ? 'rgba(20,20,22,.55)' : 'rgba(236,236,236,.38)'; for (var j = 0; j < pts.length; j += 2) x.fillRect(pts[j], pts[j + 1], 1, 1);
      return (pantCache[key] = c);
    }
    var backCache = {};
    function backImg(light, step) {
      step = step || 0; var key = (light ? 'L' : 'D') + step; if (backCache[key]) return backCache[key];
      var pal = palette(LOOK), c = document.createElement('canvas'); c.width = 22; c.height = 26; var x = c.getContext('2d');
      FRONT_HALF.forEach(function (half, y) {
        var row = half + half.split('').reverse().join('');
        for (var i = 0; i < 22; i++) { var ch = row.charAt(i); if (ch === '.') continue; if (y <= 13 && 'SERK'.indexOf(ch) >= 0) ch = (i + y) % 5 ? 'H' : 'h'; x.fillStyle = pal[ch] || pal.S; x.fillRect(i, y, 1, 1); }
      });
      locsBack(x, pal);
      if (step) {   // from behind: the lifted foot shows its sole, the hair sways the other way
        stepLegs(x, pal, step === 1 ? 2 : 1);
        x.fillStyle = pal.H; var sw = step === 1 ? 2 : 19; for (var ys = 14; ys <= 20; ys++) x.fillRect(sw, ys, 1, 1);
      }
      var d = x.getImageData(0, 0, 22, 26).data, pts = [];
      for (var yy = 0; yy < 26; yy++) for (var xx = 0; xx < 22; xx++) {
        if (d[(yy * 22 + xx) * 4 + 3]) continue;
        if ([[1,0],[-1,0],[0,1],[0,-1]].some(function (o) { var a = xx + o[0], b = yy + o[1]; return a >= 0 && b >= 0 && a < 22 && b < 26 && d[(b * 22 + a) * 4 + 3] > 200; })) pts.push(xx, yy);
      }
      x.fillStyle = light ? 'rgba(20,20,22,.55)' : 'rgba(236,236,236,.38)'; for (var j = 0; j < pts.length; j += 2) x.fillRect(pts[j], pts[j + 1], 1, 1);
      return (backCache[key] = c);
    }

    // the people of Meridian: built from Vee's own front view, with their own hair, clothes and faces
    var personCache = {};
    function personImg(o) {
      o = o || {}; var key = JSON.stringify(o); if (personCache[key]) return personCache[key];
      var L = { name: 'npc', skin: o.skin || '#7a4a30', hairc: '#141414', pants: o.pants || '#2b2b30', shoes: o.shoes || '#d8d8dc', top: o.top || '#5a5a62' };
      if (o.body === 'scrubs') L.pants = L.top;
      var pal = palette(L); if (o.gray) { pal.H = 'rgb(176,176,182)'; pal.h = 'rgb(206,206,212)'; }
      var rows = FRONT_HALF.map(function (r) { return r.split(''); }), hair = o.hair || 'short';
      function set(y, i, ch) { if (y >= 0 && y < 26 && i >= 0 && i < 11) rows[y][i] = ch; }
      // strip Vee's headphones and locs, keep his face
      for (var y = 0; y < 14; y++) for (var i = 0; i < 11; i++) { var ch = rows[y][i]; if (ch === 'D' || ch === 'd') ch = 'H'; if (y >= 5 && i <= 4) ch = '.'; rows[y][i] = ch; }
      for (var y5 = 5; y5 <= 7; y5++) set(y5, 5, 'H');
      // a natural, rounder hairline instead of the room Vee's locs need
      set(4, 3, '.'); set(4, 4, '.'); set(3, 4, '.'); set(2, 5, '.'); set(4, 5, 'H');
      if (hair === 'bald') { for (var b1 = 1; b1 <= 4; b1++) for (var b2 = 0; b2 < 11; b2++) if (rows[b1][b2] === 'H' || rows[b1][b2] === 'h') rows[b1][b2] = (b1 === 1 && b2 < 8) || b2 < 5 ? '.' : 'S'; set(2, 9, 'K'); for (var b3 = 5; b3 <= 7; b3++) set(b3, 5, b3 === 5 ? 'S' : 'H'); set(5, 4, '.'); }
      if (hair === 'bun') { set(0, 9, 'H'); set(0, 10, 'H'); set(-1, 9, 'H'); }
      if (hair === 'puffs') { [[1, 3], [1, 4], [2, 2], [2, 3], [2, 4], [3, 2], [3, 3]].forEach(function (q) { set(q[0], q[1], 'H'); }); set(2, 3, 'h'); }
      if (hair === 'long') for (var l1 = 4; l1 <= 17; l1++) { set(l1, 4, l1 % 3 ? 'H' : 'h'); if (l1 >= 5) set(l1, 3, 'H'); }
      if (hair === 'cap' || hair === 'beanie') { for (var c1 = 1; c1 <= 4; c1++) for (var c2 = 0; c2 < 11; c2++) if (rows[c1][c2] !== '.') rows[c1][c2] = c1 === 4 && hair === 'beanie' ? 'n' : 'N'; if (hair === 'cap') { for (var c3 = 3; c3 < 11; c3++) set(5, c3, 'N'); set(5, 4, 'n'); } else set(0, 10, 'n'); }
      if (hair === 'hood') { for (var h1 = 1; h1 <= 14; h1++) { set(h1, 3, 'O'); set(h1, 4, h1 > 2 ? 'O' : '.'); } for (var h2 = 4; h2 < 11; h2++) { set(1, h2, 'O'); set(2, h2, 'O'); } set(3, 5, 'O'); set(3, 6, 'o'); }
      if (o.phones) { for (var p1 = 7; p1 < 11; p1++) set(1, p1, 'D'); for (var p2 = 5; p2 <= 9; p2++) { set(p2, 3, 'D'); set(p2, 4, p2 === 6 || p2 === 7 ? 'd' : 'D'); } }
      if (o.glasses) { [[7, 6], [7, 7], [7, 8], [8, 6], [8, 8], [9, 6], [9, 7], [9, 8], [8, 9], [8, 10]].forEach(function (q) { set(q[0], q[1], 'G'); }); }
      if (o.beard) { for (var bd = 11; bd <= 13; bd++) for (var bx = 6; bx < 11; bx++) if (rows[bd][bx] === 'S' || rows[bd][bx] === 'E' || rows[bd][bx] === 'R') rows[bd][bx] = 'H'; }
      var body = o.body;
      if (body === 'apron') for (var a1 = 15; a1 <= 21; a1++) { set(a1, 8, 'W'); set(a1, 9, 'W'); set(a1, 10, 'W'); }
      if (body === 'coat' || body === 'dress') for (var k1 = 19; k1 <= (body === 'coat' ? 22 : 21); k1++) for (var k2 = body === 'dress' ? 6 : 7; k2 < 11; k2++) set(k1, k2, k1 === 22 ? 'X' : 'T');
      if (body === 'suit') { set(14, 10, 'W'); set(15, 10, 'W'); set(14, 9, 'W'); set(16, 10, 'X'); }
      if (body === 'armor') { for (var r1 = 6; r1 < 11; r1++) { set(14, r1, 'A'); set(18, r1, 'A'); } set(15, 6, 'A'); }
      if (body === 'scrubs') { set(14, 10, 'S'); set(15, 10, 'S'); }
      var c = document.createElement('canvas'); c.width = 22; c.height = 27; var x = c.getContext('2d');
      rows.forEach(function (half, yy) {
        var row = half.join('') + half.slice().reverse().join('');
        for (var i2 = 0; i2 < 22; i2++) { var ch2 = row.charAt(i2); if (ch2 === '.') continue; x.fillStyle = pal[ch2] || pal.S; x.fillRect(i2, yy + 1, 1, 1); }
      });
      if (hair === 'bun') { x.fillStyle = pal.H; x.fillRect(9, 0, 4, 1); }
      var d = x.getImageData(0, 0, 22, 27).data, pts = [];
      for (var yy2 = 0; yy2 < 27; yy2++) for (var xx = 0; xx < 22; xx++) {
        if (d[(yy2 * 22 + xx) * 4 + 3]) continue;
        if ([[1,0],[-1,0],[0,1],[0,-1]].some(function (q) { var a2 = xx + q[0], b4 = yy2 + q[1]; return a2 >= 0 && b4 >= 0 && a2 < 22 && b4 < 27 && d[(b4 * 22 + a2) * 4 + 3] > 200; })) pts.push(xx, yy2);
      }
      x.fillStyle = 'rgba(236,236,236,.38)'; for (var j = 0; j < pts.length; j += 2) x.fillRect(pts[j], pts[j + 1], 1, 1);
      return (personCache[key] = c);
    }
    /* ---------- heroes: companions and rivals, drawn the way Vee is (front, back and side), each with their own silhouette ---------- */
    var heroCache = {};
    function heroLook(sp, suffix) {
      return { name: 'hero-' + sp.id + (suffix || ''), skin: sp.skin, hairc: '#141414', top: sp.top, pants: sp.pants || '#2b2b30', shoes: sp.shoes || '#d8d8dc', hairLight: sp.hairLight, hairGray: sp.hairGray, phonesLight: sp.acc && sp.acc.phonesLight, plateLight: sp.plateLight };
    }
    function heroGrid(sp, back) {
      var g = [], hair = sp.hair, a = sp.acc || {};
      FRONT_HALF.forEach(function (half) { var row = (half + half.split('').reverse().join('')).split(''); g.push(row); });
      while (g.length < 26) g.push('......................'.split(''));
      function set(x, y, ch) { if (y >= 0 && y < 26 && x >= 0 && x < 22) g[y][x] = ch; }
      function get(x, y) { return y >= 0 && y < 26 && x >= 0 && x < 22 ? g[y][x] : '.'; }
      function both(x, y, ch) { set(x, y, ch); set(21 - x, y, ch); }
      if (hair !== 'locs') {   // take off Vee's locs and headphones; keep the head
        for (var y = 0; y < 14; y++) for (var x = 0; x < 22; x++) { var ch = g[y][x]; if (ch === 'D' || ch === 'd') ch = 'H'; if (y >= 5 && (x <= 4 || x >= 17)) ch = '.'; g[y][x] = ch; }
        for (var y5 = 5; y5 <= 7; y5++) both(5, y5, 'H');
        both(3, 4, '.'); both(4, 4, '.'); both(4, 3, '.'); both(5, 2, '.'); both(5, 4, 'H');
      }
      var face = function (ch) { return 'SERK'.indexOf(ch) >= 0; };
      if (hair !== 'locs' && hair !== 'hood' && hair !== 'long') {   // a rounder head with ears, now that no hair hides the corners
        both(5, 13, '.'); both(6, 13, get(6, 13) === '.' ? '.' : 'S'); both(5, 12, '.'); both(5, 6, get(5, 6) === 'H' ? 'H' : '.');
        if (!back) { both(4, 8, 'K'); both(4, 9, 'K'); } else { both(4, 8, 'S'); both(4, 9, 'S'); }
      }
      if (back) for (var yb = 0; yb < 14; yb++) for (var xb = 0; xb < 22; xb++) if (face(g[yb][xb])) g[yb][xb] = (hair === 'buzz' || hair === 'mohawk') ? (yb < 4 ? 'h' : 'S') : hair === 'hood' ? 'O' : ((xb + yb) % 4 ? 'H' : 'h');
      if (hair === 'buzz' || hair === 'mohawk') {
        for (var y1 = 0; y1 < 6; y1++) for (var x1 = 0; x1 < 22; x1++) if (g[y1][x1] === 'H' || g[y1][x1] === 'h') g[y1][x1] = y1 < 2 ? '.' : (back ? 'h' : 'h');
        for (var y2 = 4; y2 <= 7; y2++) both(5, y2, 'S');
        if (hair === 'mohawk') {
          for (var y9 = 2; y9 <= 5; y9++) for (var x9 = 5; x9 <= 16; x9++) if (g[y9][x9] === 'h') set(x9, y9, (x9 + y9) % 2 ? 'S' : 'K');   // shaved sides
          for (var y3 = 0; y3 <= 5; y3++) for (var x3 = 9; x3 <= 12; x3++) set(x3, y3, (x3 === 9 || x3 === 12) && y3 < 1 ? '.' : x3 === 10 && y3 < 4 ? 'h' : 'H');   // a tall crest, lit down the middle
        }
      }
      if (hair === 'afro') for (var y4 = 0; y4 <= 9; y4++) for (var x4 = 1; x4 <= 20; x4++) {
        var dx = (x4 - 10.5) / 9.6, dy = (y4 - 4.4) / 5.6; if (dx * dx + dy * dy <= 1 && (back || !face(g[y4][x4]))) set(x4, y4, (x4 * 3 + y4 * 5) % 7 ? 'H' : 'h');
      }
      if (hair === 'slick') { for (var x5 = 6; x5 <= 15; x5++) set(x5, 4, x5 < 11 ? 'H' : get(x5, 4)); set(8, 2, 'h'); set(9, 2, 'h'); set(10, 3, 'h'); both(5, 8, 'H'); }
      if (hair === 'long') for (var y6 = 4; y6 <= 17; y6++) { both(3, y6, y6 % 3 ? 'H' : 'h'); both(4, y6, 'H'); if (back) for (var x6 = 5; x6 <= 16; x6++) if (y6 >= 13) set(x6, y6, (x6 + y6) % 3 ? 'H' : 'h'); }
      if (hair === 'pony') { if (back) for (var y7 = 4; y7 <= 15; y7++) { set(10, y7, y7 % 2 ? 'H' : 'h'); set(11, y7, 'H'); } else for (var y8 = 3; y8 <= 13; y8++) { set(19, y8 + 1, y8 % 2 ? 'H' : 'h'); set(18, y8, 'H'); } set(back ? 10 : 18, 3, 'W'); }
      if (hair === 'hood') { for (var h1 = 1; h1 <= 14; h1++) { both(3, h1, 'O'); both(4, h1, h1 > 2 ? 'O' : '.'); } for (var h2 = 4; h2 <= 17; h2++) { set(h2, 1, 'O'); set(h2, 2, 'O'); } both(5, 3, 'O'); both(6, 3, 'o'); }
      if (hair === 'puffs') [[3, 0], [4, 0], [2, 1], [3, 1], [4, 1], [5, 1], [2, 2], [3, 2], [4, 2], [5, 2], [3, 3], [4, 3]].forEach(function (q) { both(q[0], q[1], (q[0] + q[1]) % 3 ? 'H' : 'h'); });
      if (hair === 'bald') { for (var bz = 0; bz < 6; bz++) for (var bzx = 0; bzx < 22; bzx++) if (g[bz][bzx] === 'H' || g[bz][bzx] === 'h') g[bz][bzx] = bz < 2 ? '.' : (back || bz > 2 ? 'S' : 'R'); for (var bz2 = 4; bz2 <= 7; bz2++) both(5, bz2, 'S'); }
      if (hair === 'bun') { for (var u1 = 9; u1 <= 12; u1++) { set(u1, 0, 'H'); set(u1, 1, u1 === 10 ? 'h' : 'H'); } set(10, -1, 'H'); set(8, 1, 'H'); set(13, 1, 'H'); }
      if (hair === 'cap') { for (var u2 = 5; u2 <= 16; u2++) { set(u2, 1, 'N'); set(u2, 2, 'N'); set(u2, 3, 'N'); set(u2, 4, back ? 'N' : 'n'); } for (var u3 = 3; u3 <= 18; u3++) if (!back) set(u3, 5, 'D'); set(10, 2, 'W'); set(11, 2, 'W'); }
      if (hair === 'beanie') for (var c1 = 0; c1 <= 4; c1++) for (var c2 = 0; c2 < 22; c2++) if (g[c1][c2] !== '.' && !face(g[c1][c2]) || (c1 >= 1 && c2 >= 5 && c2 <= 16)) set(c2, c1, c1 === 4 ? 'n' : 'N');
      // what they wear
      if (a.beard && !back) for (var bd = 10; bd <= 13; bd++) for (var bdx = 6; bdx <= 15; bdx++) if ('SERK'.indexOf(get(bdx, bd)) >= 0 && (bd > 10 || bdx < 8 || bdx > 13)) set(bdx, bd, (bdx + bd) % 4 ? 'H' : 'h');
      if (a.apron) for (var ap = 15; ap <= 21; ap++) for (var apx = 8; apx <= 13; apx++) set(apx, ap, back ? (ap === 15 && (apx === 8 || apx === 13) ? 'W' : get(apx, ap)) : apx === 8 || apx === 13 ? 'G' : 'W');
      if (a.dress) for (var dr = 19; dr <= 21; dr++) for (var drx = 5 - (dr - 19); drx <= 16 + (dr - 19); drx++) set(drx, dr, dr === 21 ? 'X' : (drx + dr) % 4 ? 'T' : 'x');
      if (a.suit && !back) { set(10, 13, 'W'); set(11, 13, 'W'); set(10, 14, 'W'); set(11, 14, 'X'); set(11, 15, 'X'); set(11, 16, 'X'); set(9, 14, 'x'); set(12, 14, 'x'); }
      if (a.cape) for (var k1 = 13; k1 <= 23; k1++) { both(2, k1, k1 === 23 ? 'X' : 'x'); both(3, k1, 'X'); if (back) for (var k2 = 4; k2 <= 17; k2++) set(k2, k1, k1 === 23 ? 'X' : ((k2 + k1) % 5 ? 'X' : 'x')); }
      if (a.coat) for (var m1 = 19; m1 <= 21; m1++) for (var m2 = 6; m2 <= 15; m2++) set(m2, m1, m1 === 21 ? 'X' : (m2 === 10 || m2 === 11) && !back ? 'x' : 'T');
      if (a.pauldrons) { for (var q1 = 2; q1 <= 7; q1++) { both(q1, 13, 'W'); both(q1, 14, 'A'); if (q1 > 2) both(q1, 15, 'a'); } }
      if (a.scarf) { for (var s1 = 6; s1 <= 15; s1++) { set(s1, 13, 'X'); set(s1, 14, s1 % 2 ? 'X' : 'x'); } if (!back) { set(13, 15, 'X'); set(13, 16, 'x'); set(14, 17, 'X'); } }
      if (a.belt) { for (var b1 = 7; b1 <= 14; b1++) set(b1, 19, 'D'); if (!back) { set(10, 19, 'G'); set(11, 19, 'G'); } }
      if (!back) {
        if (a.visor) for (var v1 = 6; v1 <= 15; v1++) { set(v1, 8, 'G'); set(v1, 9, v1 === 7 || v1 === 14 ? 'W' : 'G'); }
        if (a.goggles) { for (var g1 = 6; g1 <= 15; g1++) set(g1, 3, 'D'); set(7, 4, 'G'); set(8, 4, 'G'); set(13, 4, 'G'); set(14, 4, 'G'); }
        if (a.glasses) [[7, 6], [7, 7], [7, 8], [8, 6], [8, 8], [9, 6], [9, 7], [9, 8]].forEach(function (q) { set(q[1], q[0], 'G'); set(21 - q[1], q[0], 'G'); });
        if (a.mic) { set(5, 9, 'D'); set(6, 10, 'D'); set(7, 10, 'G'); }
        if (a.scar) { set(14, 8, 'K'); set(15, 9, 'K'); set(14, 10, 'K'); }
        if (a.armband) { set(4, 16, 'W'); set(5, 16, 'W'); set(6, 16, 'W'); }
      } else if (a.goggles) for (var g2 = 6; g2 <= 15; g2++) set(g2, 3, 'D');
      // war gear for the dangerous ones: plate, pauldrons, helms, masks, glowing eye slits, blades. Pauldrons and spikes go on after the arms (g.post)
      var post = g.post = []; function late(x, y, ch) { post.push([x, y, ch]); } function lateBoth(x, y, ch) { late(x, y, ch); late(21 - x, y, ch); }
      if (a.armor) {
        for (var ay = 13; ay <= 19; ay++) for (var ax = 6; ax <= 15; ax++) set(ax, ay, ay === 13 ? 'V' : ay === 19 ? 'v' : (ax === 6 || ax === 15) ? 'v' : ax === 7 && ay <= 16 ? 'V' : 'M');
        if (!back) { [[8, 15], [9, 16], [10, 17], [11, 17], [12, 16], [13, 15]].forEach(function (q) { set(q[0], q[1], 'm'); }); set(10, 14, a.glow ? 'Z' : 'V'); set(11, 14, a.glow ? 'Z' : 'V'); set(10, 15, 'v'); set(11, 15, 'v'); set(10, 19, 'V'); set(11, 19, 'V'); }
        else for (var sy = 14; sy <= 18; sy++) { set(10, sy, 'm'); set(11, sy, 'V'); }
        [[3, 12, 'V'], [4, 12, 'V'], [5, 12, 'V'], [6, 12, 'V'], [2, 13, 'v'], [3, 13, 'V'], [4, 13, 'M'], [5, 13, 'M'], [6, 13, 'M'], [2, 14, 'v'], [3, 14, 'M'], [4, 14, 'M'], [5, 14, 'm'], [6, 14, 'm'], [3, 15, 'v'], [4, 15, 'm'], [5, 15, 'v']].forEach(function (q) { lateBoth(q[0], q[1], q[2]); });   // big rounded pauldrons
        if (a.coat) for (var ty = 20; ty <= 22; ty++) for (var tx = 6; tx <= 15; tx++) if (tx !== 10 && tx !== 11 || back) set(tx, ty, ty === 22 ? 'v' : tx % 3 ? 'M' : 'm');   // plated tassets
      }
      if (a.spikes) [[3, 11, 'V'], [3, 10, 'Z'], [5, 11, 'V'], [5, 10, 'V'], [5, 9, 'Z'], [2, 12, 'V'], [1, 11, 'Z']].forEach(function (q) { lateBoth(q[0], q[1], q[2]); });
      if (a.helm) {   // a sleek full-face shell: polished white dome, one black visor band, a sculpted jaw with vents
        for (var hy = 1; hy <= 13; hy++) for (var hx = 4; hx <= 17; hx++) if (g[hy][hx] !== 'O' && g[hy][hx] !== 'o') set(hx, hy, '.');
        var HW = [[7, 14], [6, 15], [5, 16], [5, 16], [5, 16], [5, 16], [5, 16], [5, 16], [5, 16], [6, 15], [6, 15], [7, 14], [8, 13]];
        HW.forEach(function (r, i) { var y = i + 1; for (var x = r[0]; x <= r[1]; x++) {
          var ch = 'M'; if (x === r[0] || x === r[1]) ch = 'm'; if (y <= 4 && x >= 7 && x <= 9 && x > r[0]) ch = 'V'; if (y === 1 && x > 7 && x < 14) ch = 'V';
          if (!back) {
            if (y === 7 || y === 8) ch = x === r[0] ? 'm' : 'v';   // the visor band
            if (y === 9 && (x === 7 || x === 14)) ch = 'v';
            if (y >= 10 && (x === 7 || x === 14)) ch = 'v';   // cheek seams
            if (y === 11 && x >= 9 && x <= 12) ch = x % 2 ? 'v' : 'm';   // breather
            if (y === 12 && x >= 9 && x <= 12) ch = 'm';
            if (y === 10 && x >= 8 && x <= 13) ch = 'V';
          } else { if (y === 8) ch = 'v'; if (y >= 9 && (x === 10 || x === 11)) ch = 'm'; }
          set(x, y, ch); } });
        if (!back) { if (a.slits || a.glow) [[7, 7], [8, 8], [9, 8], [14, 7], [13, 8], [12, 8]].forEach(function (q) { set(q[0], q[1], 'Z'); }); else { set(7, 7, 'Z'); set(8, 7, 'G'); } }   // angry glow, or a cold glint off the visor
        if (a.crest) for (var cy = 0; cy <= 2; cy++) { set(10, cy, 'V'); set(11, cy, cy < 1 ? 'Z' : 'M'); }
        for (var nk = 8; nk <= 13; nk++) set(nk, 13, 'v');   // black undersuit at the neck
      }
      if (a.horns) [[4, 4, 'M'], [3, 3, 'M'], [3, 2, 'V'], [2, 1, 'V'], [2, 0, 'Z'], [4, 3, 'm'], [5, 4, 'm']].forEach(function (q) { both(q[0], q[1], q[2]); });
      if (a.crown) { for (var cr = 6; cr <= 15; cr++) set(cr, 2, cr % 2 ? 'V' : 'M'); [6, 8, 10, 11, 13, 15].forEach(function (q) { set(q, 1, 'V'); }); [6, 10, 11, 15].forEach(function (q) { set(q, 0, 'Z'); }); }
      if (!back && a.mask && !a.helm) for (var my = 10; my <= 13; my++) for (var mx = 6; mx <= 15; mx++) { if (my === 13 && (mx < 8 || mx > 13)) continue; set(mx, my, my === 10 ? 'v' : my === 13 ? 'm' : (my === 12 && (mx === 8 || mx === 10 || mx === 11 || mx === 13)) ? 'v' : mx === 7 && my === 11 ? 'V' : 'M'); }
      if (!back && a.glow && !a.helm) { for (var gx = 6; gx <= 15; gx++) set(gx, 7, 'v'); [[7, 8], [8, 8], [13, 8], [14, 8]].forEach(function (q) { set(q[0], q[1], 'Z'); }); set(9, 8, 'v'); set(12, 8, 'v'); set(6, 8, 'v'); set(15, 8, 'v'); }
      if (a.sigil && a.armor) { if (!back) { [[10, 14], [11, 14], [9, 15], [10, 15], [11, 15], [12, 15], [8, 16], [9, 16], [12, 16], [13, 16], [10, 17], [11, 17], [10, 18], [11, 18]].forEach(function (q) { set(q[0], q[1], 'Z'); }); set(10, 16, 'v'); set(11, 16, 'v'); }   // the Upstream arrow, burned bright into the breastplate
        for (var tb = 20; tb <= 23; tb++) for (var tbx = 9; tbx <= 12; tbx++) set(tbx, tb, tbx === 9 || tbx === 12 ? 'G' : tb === 23 ? 'G' : 'W'); }   // and a white tabard falling between the legs
      if (a.halo) for (var hy2 = 0; hy2 <= 12; hy2++) for (var hx2 = 0; hx2 < 22; hx2++) { var ex = (hx2 - 10.5) / 10, ey = (hy2 - 5.5) / 6.4, rr = ex * ex + ey * ey; if (rr <= 1 && rr >= .72 && get(hx2, hy2) === '.') set(hx2, hy2, hy2 < 4 ? 'Z' : 'G'); }   // a saint's ring behind the head
      if (a.blade) { var bxp = back ? 1 : 19; for (var by = 2; by <= 16; by++) { set(bxp, by, by <= 3 ? 'Z' : 'V'); set(bxp + 1, by, by <= 2 ? '.' : 'M'); } for (var gq = bxp - 2; gq <= bxp + 2; gq++) set(gq, 17, gq === bxp - 2 || gq === bxp + 2 ? 'V' : 'm'); set(bxp, 18, 'v'); set(bxp, 19, 'v'); set(bxp, 20, 'M'); }
      if (a.phones) { for (var p1 = 6; p1 <= 15; p1++) set(p1, 1, 'D'); for (var p2 = 5; p2 <= 9; p2++) { both(3, p2, 'D'); both(4, p2, p2 === 6 || p2 === 7 ? 'd' : 'D'); } }
      return g;
    }
    function heroPaint(sp, g, back, step) {
      var L = heroLook(sp, back ? 'B' : 'F'), pal = palette(L), c = document.createElement('canvas'); c.width = 22; c.height = 26; var x = c.getContext('2d');
      g.forEach(function (row, y) { row.forEach(function (ch, i) { if (ch === '.') return; x.fillStyle = pal[ch] || pal.S; x.fillRect(i, y, 1, 1); }); });
      if (sp.hair === 'locs') { if (back) locsBack(x, pal); else locsFront(x, pal, step); }
      else {   // arms: a dark edge, a sleeve, a hand, swinging opposite the legs
        var tp = x.getImageData(10, 16, 1, 1).data, sh = 'rgb(' + tp[0] + ',' + tp[1] + ',' + tp[2] + ')', shD = 'rgb(' + (tp[0] * .8 | 0) + ',' + (tp[1] * .8 | 0) + ',' + (tp[2] * .8 | 0) + ')', E2 = 'rgb(14,14,16)';
        [[4, 5, 6, 1], [17, 16, 15, -1]].forEach(function (A, side) {
          var swing = step ? ((step === 1) === (side === 1) ? -1 : 1) : 0;
          var ac = sp.acc || {}, plate = ac.armor ? pal.m : null, plateL = ac.armor ? pal.V : null, gl = ac.gauntlets;
          for (var y3 = 14; y3 <= 18 + Math.max(0, swing); y3++) { var hand = y3 >= 17 + swing; x.fillStyle = E2; x.fillRect(A[0], y3, 1, 1); x.fillStyle = hand ? (gl ? 'rgb(30,30,34)' : back ? shD : pal.R) : (plate || shD); x.fillRect(A[1], y3, 1, 1); x.fillStyle = hand ? (gl ? (y3 === 17 + swing ? 'rgb(236,236,240)' : 'rgb(30,30,34)') : back ? shD : pal.R) : (y3 === 14 && plateL ? plateL : plate || sh); x.fillRect(A[2], y3, 1, 1); }
          x.fillStyle = E2; x.fillRect(A[1], 19 + Math.max(0, swing), 2, 1);
        });
      }
      if (step) stepLegs(x, pal, back ? (step === 1 ? 2 : 1) : step);
      (g.post || []).forEach(function (q) { if (q[0] >= 0 && q[0] < 22 && q[1] >= 0) { x.fillStyle = pal[q[2]]; x.fillRect(q[0], q[1], 1, 1); } });
      var d = x.getImageData(0, 0, 22, 26).data, pts = [];
      for (var yy = 0; yy < 26; yy++) for (var xx = 0; xx < 22; xx++) {
        if (d[(yy * 22 + xx) * 4 + 3]) continue;
        if ([[1,0],[-1,0],[0,1],[0,-1]].some(function (o) { var a2 = xx + o[0], b2 = yy + o[1]; return a2 >= 0 && b2 >= 0 && a2 < 22 && b2 < 26 && d[(b2 * 22 + a2) * 4 + 3] > 200; })) pts.push(xx, yy);
      }
      x.fillStyle = 'rgba(236,236,236,.38)'; for (var j = 0; j < pts.length; j += 2) x.fillRect(pts[j], pts[j + 1], 1, 1);
      return c;
    }
    function heroSideLook(sp) {
      var a = sp.acc || {}, hair = sp.hair, L = heroLook(sp, 'S');
      L.noLocs = !(hair === 'locs' || hair === 'long'); L.pony = hair === 'pony'; L.hoodUp = hair === 'hood'; L.beanie = hair === 'beanie';
      L.scarf = !!a.scarf; L.pack = !!a.pack; L.phones = !!a.phones; L.round = !!a.glasses;
      L.pre = function (px, pose) {
        if (hair === 'afro') for (var y = 0; y <= 9; y++) for (var x = 1; x <= 13; x++) { var dx = (x - 7.5) / 6.8, dy = (y - 4) / 5.2; if (dx * dx + dy * dy <= 1) px(x, y, (x * 3 + y * 5) % 7 ? 'H' : 'h'); }
        if (a.halo) for (var hy3 = -1; hy3 <= 12; hy3++) for (var hx3 = 0; hx3 <= 19; hx3++) { var ex3 = (hx3 - 9) / 9.4, ey3 = (hy3 - 5) / 6.6, r3 = ex3 * ex3 + ey3 * ey3; if (r3 <= 1 && r3 >= .74) px(hx3, hy3, hy3 < 3 ? 'Z' : 'G'); }   // drawn first, so the head sits in front of it
        if (a.cape) for (var y2 = 12; y2 <= 23; y2++) for (var x2 = 3 - Math.round((y2 - 12) * pose.sway * .15); x2 <= 8; x2++) px(x2, y2, x2 === 8 || y2 === 23 ? 'X' : (x2 + y2) % 5 ? 'X' : 'x');
      };
      L.extra = function (px, pose, HEAD0) {
        if (hair === 'buzz' || hair === 'mohawk' || hair === 'slick' || hair === 'cap') HEAD0.rows.forEach(function (row, i) { for (var x = 0; x < 20; x++) if (row.charAt(x) === 'H') { var top = hair === 'slick' ? i <= 4 : i <= 2; px(x, HEAD0.r + i, top ? (hair === 'slick' && i === 2 ? 'h' : 'h') : (x <= 4 ? 'K' : 'S')); } });
        if (hair === 'bun') for (var bx = 5; bx <= 8; bx++) { px(bx, -1, 'H'); px(bx, 0, 'H'); }
        if (hair === 'cap') { for (var cx2 = 4; cx2 <= 12; cx2++) { px(cx2, 1, 'N'); px(cx2, 2, 'N'); px(cx2, 3, 'n'); } for (var cb = 10; cb <= 16; cb++) px(cb, 4, 'D'); }
        if (hair === 'mohawk') for (var y = -1; y <= 3; y++) for (var x2 = 6; x2 <= 11; x2++) if (y >= 0 || (x2 >= 7 && x2 <= 10)) px(x2, y, (x2 + y) % 3 ? 'H' : 'h');
        if (hair === 'puffs') [[4, 0], [5, 0], [4, 1], [5, 1], [6, 1], [3, 2], [4, 2], [5, 2], [9, 0], [10, 0], [9, 1], [10, 1]].forEach(function (q) { px(q[0], q[1], 'H'); });
        if (hair === 'bald') HEAD0.rows.forEach(function (row, i) { for (var x = 0; x < 20; x++) if (row.charAt(x) === 'H' || row.charAt(x) === 'h') px(x, HEAD0.r + i, i <= 1 ? 'R' : x <= 4 ? 'K' : 'S'); });
        if (a.beard) for (var bd2 = 9; bd2 <= 11; bd2++) for (var bx2 = 10; bx2 <= 15; bx2++) if (bd2 > 9 || bx2 < 12) px(bx2, bd2, (bx2 + bd2) % 3 ? 'H' : 'h');
        if (a.apron) for (var ap2 = 14; ap2 <= 20; ap2++) { px(13, ap2, 'W'); px(14, ap2, ap2 > 15 ? 'W' : null); }
        if (a.dress) for (var dr2 = 18; dr2 <= 20; dr2++) for (var dx2 = 6 - (dr2 - 18); dx2 <= 14 + (dr2 - 18); dx2++) px(dx2, dr2, dr2 === 20 ? 'X' : (dx2 + dr2) % 4 ? 'T' : 'x');
        if (a.suit) { px(13, 13, 'W'); px(13, 14, 'X'); px(13, 15, 'X'); }
        if (a.visor) { for (var v = 11; v <= 16; v++) px(v, 7, 'G'); px(14, 8, 'W'); px(15, 8, 'G'); }
        if (a.goggles) { for (var g2 = 9; g2 <= 14; g2++) px(g2, 3, 'D'); px(13, 4, 'G'); px(14, 4, 'G'); }
        if (a.scar) { px(14, 9, 'K'); px(15, 10, 'K'); }
        if (a.mic) { px(14, 10, 'D'); px(15, 10, 'D'); px(16, 10, 'G'); }
        if (a.pauldrons) { for (var q = 7; q <= 13; q++) px(q, 13, 'W'); for (var q2 = 7; q2 <= 12; q2++) px(q2, 14, 'A'); }
        if (a.coat) for (var y3 = 19; y3 <= 21; y3++) for (var x3 = 7; x3 <= 12; x3++) px(x3, y3, y3 === 21 ? 'X' : 'T');
        if (a.belt) for (var b = 7; b <= 13; b++) px(b, 18, 'D');
        if (a.armor) { for (var ay2 = 13; ay2 <= 18; ay2++) for (var ax2 = 8; ax2 <= 13; ax2++) px(ax2, ay2, ay2 === 13 ? 'V' : ay2 === 18 ? 'v' : ax2 === 8 ? 'm' : ax2 === 13 ? 'V' : 'M'); px(12, 15, a.glow ? 'Z' : 'V'); px(11, 16, 'm'); px(12, 17, 'm');
          [[7, 12, 'V'], [8, 12, 'V'], [9, 12, 'V'], [10, 12, 'V'], [6, 13, 'v'], [7, 13, 'V'], [8, 13, 'M'], [9, 13, 'M'], [10, 13, 'M'], [11, 13, 'm'], [6, 14, 'v'], [7, 14, 'M'], [8, 14, 'm'], [9, 14, 'm'], [10, 14, 'v'], [7, 15, 'v'], [8, 15, 'v']].forEach(function (q) { px(q[0], q[1], q[2]); });
          if (a.coat) for (var ty2 = 19; ty2 <= 21; ty2++) for (var tx2 = 7; tx2 <= 12; tx2++) px(tx2, ty2, ty2 === 21 ? 'v' : tx2 % 2 ? 'M' : 'm'); }
        if (a.spikes) [[7, 11, 'V'], [7, 10, 'Z'], [9, 11, 'V'], [9, 10, 'V'], [9, 9, 'Z'], [6, 12, 'V'], [5, 11, 'Z']].forEach(function (q) { px(q[0], q[1], q[2]); });
        if (a.helm) { HEAD0.rows.forEach(function (row, i) { for (var x = 0; x < 20; x++) if (row.charAt(x) !== '.') { var y = HEAD0.r + i, ch = i <= 1 ? 'V' : x <= 5 ? 'm' : 'M'; if (i <= 3 && x >= 7 && x <= 10) ch = 'V'; if ((y === 6 || y === 7) && x >= 10) ch = 'v'; if (y === 9 && x >= 12) ch = 'V'; if (y === 10 && x >= 13 && x % 2) ch = 'v'; if (x === 9 && y >= 8) ch = 'v'; px(x, y, ch); } });
          if (a.slits || a.glow) { px(14, 7, 'Z'); px(15, 7, 'Z'); px(13, 6, 'Z'); } else px(15, 6, 'Z');
          if (a.crest) for (var cs = -1; cs <= 1; cs++) { px(7, cs, 'V'); px(8, cs, cs < 0 ? 'Z' : 'M'); } }
        if (a.horns) [[6, 1, 'M'], [5, 0, 'M'], [5, -1, 'V'], [4, -2, 'Z'], [10, 1, 'M'], [11, 0, 'V'], [12, -1, 'Z']].forEach(function (q) { px(q[0], q[1], q[2]); });
        if (a.crown) { for (var cr2 = 4; cr2 <= 12; cr2++) px(cr2, 1, cr2 % 2 ? 'V' : 'M'); [4, 6, 8, 10, 12].forEach(function (q) { px(q, 0, 'V'); }); [4, 8, 12].forEach(function (q) { px(q, -1, 'Z'); }); }
        if (a.mask && !a.helm) for (var my2 = 9; my2 <= 12; my2++) for (var mx2 = 11; mx2 <= 16; mx2++) { if (my2 === 12 && mx2 > 15) continue; px(mx2, my2, my2 === 9 ? 'v' : (my2 === 11 && mx2 % 2) ? 'v' : 'M'); }
        if (a.glow && !a.helm) { for (var gs = 11; gs <= 16; gs++) px(gs, 6, 'v'); px(13, 7, 'v'); px(14, 7, 'Z'); px(15, 7, 'Z'); px(16, 7, 'v'); }
        if (a.sigil && a.armor) { [[12, 14], [11, 15], [12, 15], [12, 16]].forEach(function (q) { px(q[0], q[1], 'Z'); }); for (var tb2 = 19; tb2 <= 22; tb2++) { px(11, tb2, 'W'); px(12, tb2, tb2 === 22 ? 'G' : 'W'); } }
        if (a.blade) { for (var bl = 1; bl <= 15; bl++) { px(18, bl, bl <= 2 ? 'Z' : 'V'); px(19, bl, bl <= 1 ? null : 'M'); } for (var gd = 16; gd <= 20; gd++) px(gd, 16, gd === 16 || gd === 20 ? 'V' : 'm'); px(18, 17, 'v'); px(18, 18, 'v'); px(18, 19, 'M'); }
      };
      return L;
    }
    function heroImg(sp, view, arg) {
      var k = sp.id + view + (arg || 0); if (heroCache[k]) return heroCache[k];
      var c = view === 'side' ? frame(arg || 'idle', heroSideLook(sp)) : heroPaint(sp, heroGrid(sp, view === 'back'), view === 'back', arg || 0);
      return (heroCache[k] = c);
    }
    // townsfolk get the same body as Vee and the crew: front, back and side, with walk cycles in every direction
    var phCache = {};
    function personHero(o) {
      o = o || {}; var key = JSON.stringify(o); if (phCache[key]) return phCache[key];
      var HAIR = { short: 'short', bald: 'bald', bun: 'bun', puffs: 'puffs', long: 'long', cap: 'cap', beanie: 'beanie', hood: 'hood' }, b = o.body, acc = {};
      if (o.glasses) acc.glasses = 1; if (o.beard) acc.beard = 1; if (o.phones) acc.phones = 1;
      if (b === 'apron') acc.apron = 1; if (b === 'coat') acc.coat = 1; if (b === 'dress') acc.dress = 1; if (b === 'suit') acc.suit = 1; if (b === 'armor') { acc.pauldrons = 1; acc.belt = 1; }
      var sp = { id: 'p' + Object.keys(phCache).length, hair: HAIR[o.hair] || 'short', skin: o.skin || '#7a4a30', top: o.top || '#5a5a62', pants: b === 'scrubs' ? (o.top || '#5a5a62') : (o.pants || '#2b2b30'), shoes: o.shoes || '#d8d8dc', hairGray: !!o.gray, acc: acc };
      return (phCache[key] = sp);
    }
    // which frame a walker shows: dir is up/down/left/right, walk is -1 standing or 0..3 through the cycle
    function walkImg(sp, dir, walk) {
      if (dir === 'left' || dir === 'right') return { img: heroImg(sp, 'side', walk >= 0 ? 'run' + walk : 'idle'), flip: dir === 'left', bob: 0 };
      var step = walk < 0 ? 0 : [1, 0, 2, 0][walk];
      return { img: heroImg(sp, dir === 'up' ? 'back' : 'front', step), flip: false, bob: walk < 0 ? 0 : walk % 2 };
    }
    if (window.VondsSprite) { window.VondsSprite.front = function (blink, step) { return frontImg(false, blink, step); }; window.VondsSprite.back = function (step) { return backImg(false, step); }; window.VondsSprite.person = personImg; window.VondsSprite.hero = heroImg; window.VondsSprite.personHero = personHero; window.VondsSprite.walk = walkImg; }
    function render(pose, dark) {
      var u = S * R; cx2.setTransform(1, 0, 0, 1, 0, 0); cx2.clearRect(0, 0, cv2.width, cv2.height); cx2.imageSmoothingEnabled = false;
      if (pose === 'pant0' || pose === 'pant1') { cx2.drawImage(pantImg(!dark, pose === 'pant1' ? 1 : 0), OX * u, OY * u, 22 * u, 26 * u); return; }
      if (pose === 'front' || pose === 'frontb') { cx2.drawImage(frontImg(!dark, pose === 'frontb'), OX * u, OY * u, 22 * u, 26 * u); return; }
      cx2.drawImage(frame(pose, null, !dark), OX * u, OY * u, 22 * u, 26 * u);
      var pts = STICK[pose] || [];
      pts.forEach(function (q, i) {
        var tip = i >= pts.length - 2;
        cx2.fillStyle = tip ? (dark ? '#f4f4f4' : '#2e2e30') : (dark ? '#c4c4c8' : '#7a7a80');
        cx2.fillRect((OX + q[0]) * u, (OY + q[1]) * u, u, u);
      });
    }
    function place(x, y, side) {
      body.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)';
      var w = GW * S, h = GH * S, tw = talk.offsetWidth, th = talk.offsetHeight, tx, ty;
      if (side === 'right') { tx = x + w * (cur && cur.pose === 'greach' ? .97 : .78); ty = y + h * .22; }
      else if (side === 'left') { tx = x + w * .2 - tw; ty = y + h * .2; }
      else if (side === 'above') { tx = x + w / 2 - tw / 2; ty = y - th + h * .1; }
      else { tx = x + w / 2 - tw / 2; ty = y + h * .95; }
      tx = Math.max(10, Math.min(innerWidth - tw - 10, tx)); ty = Math.max(10, Math.min(innerHeight - th - 10, ty));
      var av = cur && cur.avoid && cur.avoid();   // keep the card off whatever it is explaining
      if (av && tx < av.right && tx + tw > av.left && ty < av.bottom && ty + th > av.top) {
        if (av.left - tw - 14 >= 10) tx = av.left - tw - 14;
        else ty = Math.max(8, av.top - th - 10);
      }
      talk.style.transform = 'translate3d(' + Math.round(tx) + 'px,' + Math.round(ty) + 'px,0)';
      talk.setAttribute('data-side', side);
    }
    var twTimer = 0;
    function typewrite(node, speed) {
      clearInterval(twTimer);
      var chars = [];
      (function walk(n) { for (var c = n.firstChild; c; c = c.nextSibling) { if (c.nodeType === 3) { var t = c.textContent, sp = document.createElement('span'); sp.className = 'tw'; c.parentNode.replaceChild(sp, c); for (var i = 0; i < t.length; i++) { var ch = document.createElement('span'); ch.className = 'tw-hide'; ch.textContent = t[i]; sp.appendChild(ch); chars.push(ch); } c = sp; } else walk(c); } })(node);
      var i = 0; twTimer = setInterval(function () { for (var k = 0; k < 2 && i < chars.length; k++) chars[i++].className = ''; if (i >= chars.length) clearInterval(twTimer); }, speed || 22);
    }
    function say(html, actions, noType) {
      txt.innerHTML = html; acts.innerHTML = '';
      if (!noType && !reduce) typewrite(txt);
      (actions || []).forEach(function (a) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = a.label; if (a.quiet) b.className = 'q'; if (a.code) { b.className = 'cmd'; b.setAttribute('aria-label', 'Run ' + a.label); }
        b.addEventListener('click', function (e) { e.stopPropagation(); a.fn(); }); acts.appendChild(b);
      });
      talk.classList.remove('pop'); void talk.offsetWidth; talk.classList.add('pop');
      if (cur) place(cur.x, cur.y, cur.side);
    }
    // o: { id, dark, pose, x, y, side, enter: 'drop'|'rise'|'pop', rope, mirror, text, actions }
    // walking on or off screen: run frames timed to the distance covered, facing the way he moves
    var walkRaf = 0;
    function walk(fromX, toX, y, dark, done, fast) {
      cancelAnimationFrame(walkRaf);
      var t0 = 0, dur = fast ? Math.min(.75, .3 + Math.abs(toX - fromX) / 1800) : Math.min(1.25, .45 + Math.abs(toX - fromX) / 900), faceLeft = toX < fromX, lastF = '';
      el.classList.toggle('flip', faceLeft);
      (function stepW(ts) {
        if (!t0) t0 = ts;
        var u = Math.min(1, (ts - t0) / 1000 / dur), e = done.out ? u * u : 1 - Math.pow(1 - u, 2.2), x = fromX + (toX - fromX) * e;
        var f = 'run' + (Math.floor(Math.abs(x - fromX) / (3.4 * S)) % 4);
        if (f !== lastF) { render(f, dark); lastF = f; }
        body.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)';
        if (u < 1) walkRaf = requestAnimationFrame(stepW); else done();
      })(performance.now());
    }
    function show(o) {
      clearTimeout(hideT); cancelAnimationFrame(walkRaf); scale();
      var continuing = cur && o.enter === 'stay'; cur = o;
      if (o.enter === 'walk') {
        // always arrive from off screen, on the side he is standing nearest to
        var fromRight = o.from ? o.from === 'right' : o.x + GW * S / 2 > innerWidth / 2;
        el.className = 'gguide on in walking e-walk ' + (o.dark ? 'dark' : 'light');
        rope.style.display = 'none';
        say(o.text, o.actions); place(o.x, o.y, o.side);
        var arrive = function () {
          if (cur !== o) return;
          render(o.pose || 'ghold', o.dark); el.classList.toggle('flip', !!o.mirror);
          el.classList.remove('walking'); say(o.text, o.actions); place(o.x, o.y, o.side);
        };
        walk(fromRight ? innerWidth + 8 : -GW * S - 8, o.x, o.y, o.dark, arrive);
        return;
      }
      el.className = 'gguide on ' + (o.dark ? 'dark ' : 'light ') + 'e-' + (o.enter || 'pop') + (o.mirror ? ' flip' : '') + (continuing ? ' in' : '');
      render(o.pose || 'ghold', o.dark);
      rope.style.display = o.rope ? 'block' : 'none';
      if (o.rope) { rope.style.left = Math.round(o.x + (o.mirror ? GW - 20 : 20) * S) + 'px'; rope.style.height = Math.round(o.y + (OY + 2) * S) + 'px'; }
      say(o.text, o.actions);
      place(o.x, o.y, o.side);
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });
    }
    function pose(p) { if (cur) { cur.pose = p; render(p, cur.dark); } }
    function hop(then) {
      if (!cur) return; var p0 = cur.pose; render('gjump', cur.dark); body.classList.remove('hop'); void body.offsetWidth; body.classList.add('hop');
      setTimeout(function () { if (cur) render(p0, cur.dark); if (then) then(); }, 380);
    }
    function hide(exit) {
      if (!cur) return; var was = cur; cur = null;
      if (exit === 'walk') {
        // walk back off screen toward the nearest edge
        el.classList.add('walking');
        var toRight = was.x + GW * S / 2 > innerWidth / 2, fin = function () { if (!cur) el.className = 'gguide'; };
        fin.out = true;
        walk(was.x, toRight ? innerWidth + 8 : -GW * S - 8, was.y, was.dark, fin);
        return was;
      }
      el.classList.remove('in'); el.classList.add('x-' + (exit || 'fade'));
      hideT = setTimeout(function () { if (!cur) el.className = 'gguide'; }, 650);
      return was;
    }
    var api = { show: show, say: say, pose: pose, hop: hop, hide: hide, active: function () { return cur && cur.id; }, size: function () { return { w: GW * S, h: GH * S }; } };
    window.VondsGuide = api;

    var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

    /* ---- 1. Step inside: Vee bungees down upside down, swings, and points the way ---- */
    var ff = document.getElementById('ff');
    if (ff && !reduce) {
      var hangLook = {}, hk; for (hk in LOOK) hangLook[hk] = LOOK[hk];
      hangLook.noLocs = true; hangLook.noOutline = true; hangLook.name = 'hang';
      var HW = 28, HH = 44, HOX = 3, HIDE = 9, hangCache = {};
      // body flipped, locs redrawn falling from the crown, arm hanging beside the face with a finger pointing down
      var hangImg = function (arm, sway) {
        var key = arm + '|' + sway; if (hangCache[key]) return hangCache[key];
        var c = document.createElement('canvas'); c.width = HW; c.height = HH; var x = c.getContext('2d');
        x.save(); x.translate(HOX, 26); x.scale(1, -1); x.drawImage(frame('idle', hangLook, false), 0, 0); x.restore();
        var px = function (a, b, col) { x.fillStyle = col; x.fillRect(a, b, 1, 1); };
        var skin = 'rgb(117,117,120)', sleeve = 'rgb(205,205,210)', sleeveD = 'rgb(160,160,166)';
        [[HOX + 3, 19, 11], [HOX + 7, 22, 14], [HOX + 11, 23, 13], [HOX + 15, 22, 10]].forEach(function (st, si) {
          for (var i = 0; i < st[2]; i++) {
            var t = i / st[2], dx = Math.round(sway * t * t * 2.2), yy = st[1] + i;
            px(st[0] + dx, yy, (i + si) % 4 === 1 ? 'rgb(118,118,124)' : 'rgb(70,70,74)');
            if (i < st[2] - 1) px(st[0] + dx + 1, yy, 'rgb(52,52,56)');
          }
        });
        var ax = HOX + 18;
        px(ax, 9, sleeve); px(ax + 1, 9, sleeve); px(ax, 10, sleeveD); px(ax + 1, 10, sleeveD);
        if (arm === 'fling') { for (var j = 0; j < 6; j++) { px(ax + 1 + j, 11 + j * .6 | 0, skin); px(ax + 1 + j, 12 + j * .6 | 0, skin); } }
        else {
          for (var r2 = 11; r2 < 21; r2++) { px(ax, r2, skin); px(ax + 1, r2, skin); }
          px(ax - 1, 21, skin); px(ax, 21, skin); px(ax + 1, 21, skin); px(ax, 22, skin); px(ax + 1, 22, skin); px(ax + 1, 23, skin); px(ax + 1, 24, skin);
        }
        var d = x.getImageData(0, 0, HW, HH).data, pts = [];
        var A = function (a, b) { return a >= 0 && b >= 0 && a < HW && b < HH && d[(b * HW + a) * 4 + 3] > 200; };
        for (var y = 0; y < HH; y++) for (var xx = 0; xx < HW; xx++) {
          if (A(xx, y)) continue;
          if (y > 20 && (A(xx - 1, y) || A(xx - 2, y)) && (A(xx + 1, y) || A(xx + 2, y))) continue;
          if (A(xx + 1, y) || A(xx - 1, y) || A(xx, y + 1) || A(xx, y - 1)) pts.push(xx, y);
        }
        x.fillStyle = 'rgba(236,236,236,.38)'; for (var i2 = 0; i2 < pts.length; i2 += 2) x.fillRect(pts[i2], pts[i2 + 1], 1, 1);
        return (hangCache[key] = c);
      };
      var hv = document.createElement('canvas'); hv.className = 'vhang'; hv.setAttribute('aria-hidden', 'true'); document.body.appendChild(hv);
      var vt = document.createElement('div'); vt.className = 'vtalk'; vt.setAttribute('role', 'status'); vt.innerHTML = '<b>Vee</b><span>Scroll down</span>'; document.body.appendChild(vt);
      var vtShown = false;
      var hg = hv.getContext('2d'), hS = 4, hR = 1, hT0 = 0, hRaf = 0, hOut = 0, hOn = false, hLast = '';
      var hangSize = function () { hR = Math.min(3, window.devicePixelRatio || 1); hS = innerWidth < 640 ? 3 : 4; hv.width = Math.round(HW * hS * hR); hv.height = Math.round(HH * hS * hR); hv.style.width = HW * hS + 'px'; hv.style.height = HH * hS + 'px'; hLast = ''; };
      var hangFrame = function (ts) {
        if (!hT0) hT0 = ts;
        var t = (ts - hT0) / 1000, y, arm = 'point', rot = 0, sway = 0;
        if (t < 1.3) {                                   // bungee: drop fast, two bounces
          var e = t / 1.3; y = e < .14 ? -HH * hS * (1 - e / .14) : -38 * Math.exp(-4.2 * (e - .14)) * Math.sin((e - .14) * 15.5) ;
          arm = e < .3 ? 'fling' : 'point'; sway = e < .3 ? -1 : 0;
        } else {                                         // then a gentle pendulum swing while pointing
          var ramp = Math.min(1, (t - 1.3) / 1.2), a = Math.sin((t - 1.3) * 1.7);
          y = 0; rot = a * 6 * ramp; sway = Math.round(-a * 1.4 * ramp * 2) / 2;
        }
        if (hOut) { var u = Math.min(1, (ts - hOut) / 420); y -= u * u * (HH * hS); if (u >= 1) { hangStop(); return; } }
        var key = arm + sway;
        if (key !== hLast) { hLast = key; hg.setTransform(1, 0, 0, 1, 0, 0); hg.clearRect(0, 0, hv.width, hv.height); hg.imageSmoothingEnabled = false; hg.drawImage(hangImg(arm, sway), 0, 0, hv.width, hv.height); }
        if (!hOut && t > 1.25 && !vtShown) { vtShown = true; vt.style.top = Math.round((HH - HIDE - 1) * hS + 10) + 'px'; vt.classList.add('on'); typewrite(vt.querySelector('span'), 45); }
        if (hOut && vtShown) { vtShown = false; vt.classList.remove('on'); }
        hv.style.transformOrigin = '50% ' + (HIDE * hS) + 'px';
        hv.style.transform = 'translate3d(-50%,' + Math.round(-HIDE * hS + y) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
        hRaf = requestAnimationFrame(hangFrame);
      };
      var hangShow = function () { hangSize(); hT0 = 0; hOut = 0; hOn = true; hv.classList.add('on'); cancelAnimationFrame(hRaf); hRaf = requestAnimationFrame(hangFrame); };
      var hangLeave = function () { if (hOn && !hOut) hOut = performance.now(); };
      var hangStop = function () { cancelAnimationFrame(hRaf); hOn = false; hOut = 0; hv.classList.remove('on'); vt.classList.remove('on'); vtShown = false; };

      var openAt = 0, lastMove = 0, lastY = 0, shown = 0, scrolledAny = false, tick = 0;
      function atEnd() { var e = ff.querySelector('.ffend'); return e ? e.getBoundingClientRect().top < innerHeight * .9 : false; }
      ff.addEventListener('scroll', function () {
        var d = Math.abs(ff.scrollTop - lastY); lastY = ff.scrollTop;
        if (d > 2) { lastMove = performance.now(); if (openAt && performance.now() - openAt > 600) scrolledAny = true; }
        if (hOn && d > 1) hangLeave();
      }, { passive: true });
      new MutationObserver(function () {
        var on = ff.classList.contains('open');
        if (on && !openAt) { openAt = lastMove = performance.now(); lastY = ff.scrollTop; shown = 0; scrolledAny = false; clearInterval(tick); tick = setInterval(check, 400); }
        if (!on && openAt) { openAt = 0; clearInterval(tick); hangStop(); }
      }).observe(ff, { attributes: true, attributeFilter: ['class'] });
      // first visit: right after the opening scene settles if they have not moved; later: when they stall partway down
      function check() {
        if (!openAt || hOn || api.active() || document.hidden || atEnd() || shown >= 4) return;
        var now = performance.now(), wait = !scrolledAny ? 3600 : 9000;
        if (now - Math.max(openAt, lastMove) > wait) { shown++; hangShow(); }
      }
    }

    /* ---- 2. The terminal: an offer at the footer, then a short tour inside ---- */
    var T2 = window.VondsTerm, TOUR = 'vonds-tour';
    var coarse = window.matchMedia && matchMedia('(hover: none), (pointer: coarse)').matches;
    var steps = [
      { cmd: 'help', want: function (d) { return d.cmd === 'help'; }, text: 'This is the terminal. Type <code>help</code> and press Enter to see what it can do.', tap: 'Tap below to run <code>help</code>, or type it yourself.' },
      { cmd: 'ls projects', want: function (d) { return d.cmd === 'ls' || d.cmd === 'll' || d.cmd === 'dir'; }, text: 'Nice. Now list the work with <code>ls projects</code>.', tap: 'Nice. Now list the work.' },
      { cmd: 'cat black-signal', want: function (d) { return d.cmd === 'cat' && d.arg; }, text: 'Read about one, like <code>cat black-signal</code>. <span class="tip">Tab finishes names for you.</span>', tap: 'Read about one of the projects.' },
      { cmd: 'play', want: function (d) { return d.cmd === 'play' || d.cmd === 'game' || d.cmd === 'jump' || d.cmd === './jump'; }, text: 'You can also <code>open</code> a project or <code>cd about</code> to jump around. Last secret: type <code>play</code>.', tap: 'Last secret: there’s a game.' }
    ];
    STICK.gup = [[15, 11], [15, 10], [16, 9], [16, 8], [16, 7], [16, 6], [17, 5], [17, 4], [17, 3], [17, 2], [17, 1], [18, 0], [18, -1], [18, -2], [18, -3], [18, -4]];
    POSE.gup = { bl: 'down', fl: 'down', ba: 'mid', fa: 'up', bob: 0, sway: 0 };
    STICK.greach = [[20, 10], [21, 9], [21, 8], [22, 7], [22, 6], [23, 5], [23, 4], [24, 3], [24, 2], [25, 1], [25, 0], [26, -1], [26, -2], [27, -3], [27, -4]];
    POSE.greach = { bl: 'down', fl: 'down', ba: 'mid', fa: 'point', bob: 0, sway: 0 };
    var stepI = 0, touring = false;
    // compact layout when there isn't room beside the terminal (phones, small windows): terminal up top, Vee below it
    function compact() { var sz = api.size(); return innerWidth < 640 || coarse && innerWidth < 900 || T2.win.getBoundingClientRect().left < sz.w * .95 + 16; }
    var phoneTour = function (on) {
      var c = on && compact();
      T2.win.style.alignSelf = c ? 'flex-start' : ''; T2.win.style.marginTop = c ? '8px' : ''; T2.win.style.height = c ? '48vh' : '';
    };
    // Vee stands so the tip of his stick lands right on the line where you type
    function termSpot() {
      var f = T2.form.getBoundingClientRect(), w = T2.win.getBoundingClientRect();
      if (!compact()) {
        var tx = w.left + 14, ty = f.top + f.height / 2;
        return { x: tx - (OX + 29.5) * S, y: ty - (OY + 6.5) * S, side: 'above', mirror: false, pose: 'gpoint', tipX: tx, tipY: ty };
      }
      var tx2 = Math.min(f.left + 104, w.right - 40), ty2 = f.bottom - 5;
      return { x: tx2 - (OX + 27.5) * S, y: ty2 - (OY - 4 + .5) * S, side: 'right', mirror: false, pose: 'greach', tipX: tx2, tipY: ty2 };
    }
    var runFor = function (cmd) { T2.run(cmd); };
    var tipEl = document.createElement('i'); tipEl.className = 'gtip'; el.appendChild(tipEl);
    function target(p) {
      T2.form.classList.toggle('vee-target', !!p);
      if (!p) { tipEl.classList.remove('on'); return; }
      tipEl.style.left = Math.round(p.tipX) + 'px'; tipEl.style.top = Math.round(p.tipY) + 'px';
      setTimeout(function () { if (api.active() === 'tour') tipEl.classList.add('on'); }, 900);
    }
    function tourStep() {
      var st2 = steps[stepI]; phoneTour(true);
      var p = termSpot(), small = compact();
      target(p);
      show({ id: 'tour', dark: true, pose: p.pose, x: p.x, y: p.y, side: p.side, mirror: p.mirror, enter: cur && cur.id === 'tour' ? 'stay' : 'walk', avoid: function () { return T2.win.getBoundingClientRect(); },
        text: '<span class="step">' + (stepI + 1) + ' of ' + steps.length + '</span>' + (small ? st2.tap : st2.text),
        actions: [{ label: st2.cmd, code: true, fn: function () { runFor(st2.cmd); } },
                  { label: 'End tour', quiet: true, fn: function () { touring = false; store.set(TOUR, 'skipped'); hide('walk'); phoneTour(false); target(null); if (!coarse) T2.input.focus(); } }] });
    }
    function startTour() { touring = true; stepI = 0; store.set(TOUR, 'started'); tourStep(); }
    function offerInTerm() {
      phoneTour(true); var p = termSpot();
      if (coarse) T2.input.blur();   // keep the phone keyboard out of the way
      show({ id: 'tour', dark: true, pose: 'ghold', avoid: function () { return T2.win.getBoundingClientRect(); }, x: p.x, y: p.y, side: p.side, mirror: p.mirror, enter: 'walk',
        text: 'First time in here? I can show you around in four quick steps.',
        actions: [{ label: 'Show me', fn: function () { startTour(); if (!coarse) T2.input.focus(); } }, { label: 'I’m good', quiet: true, fn: function () { store.set(TOUR, 'skipped'); hide('walk'); phoneTour(false); target(null); if (!coarse) T2.input.focus(); } }] });
    }
    if (T2) {
      document.addEventListener('xp-term', function (e) {
        var d = e.detail || {};
        if (d.type === 'open') {
          var state = store.get(TOUR);
          if (touring && coarse) T2.input.blur();
          if (touring) setTimeout(tourStep, 260);
          else if (state !== 'done' && state !== 'skipped') setTimeout(offerInTerm, 380);
        } else if (d.type === 'close') { phoneTour(false); target(null); if (api.active() === 'tour' || api.active() === 'footer') hide('walk'); }
        else if (d.type === 'cmd' && touring) {
          if (steps[stepI].want(d)) {
            stepI++;
            if (stepI >= steps.length) { touring = false; store.set(TOUR, 'done'); hide('walk'); phoneTour(false); target(null); return; }
            hop(function () { if (touring) tourStep(); });
          }
        }
      });
      window.addEventListener('resize', function () { if (api.active() === 'tour' && T2.isOpen()) { phoneTour(true); var p = termSpot(); if (touring) target(p); cur.x = p.x; cur.y = p.y; body.style.transform = 'translate3d(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px,0)'; place(p.x, p.y, p.side); } });

      // the offer, at the end of the page
      var foot = document.querySelector('footer');
      if (foot && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (en) {
          en.forEach(function (x) {
            // every time the visitor reaches the very bottom
            if (!x.isIntersecting || api.active() || T2.isOpen() || document.body.classList.contains('diving')) return;
            setTimeout(function () { if (!api.active() && !T2.isOpen()) waitScene(); }, 500);
          });
        }, { threshold: .6 }).observe(foot);
        // scroll up from the bottom and he startles: a jump, a turn, and he runs off
        var lastSY = window.scrollY || 0;
        window.addEventListener('scroll', function () {
          var sy = window.scrollY || 0, up = sy < lastSY - 3; lastSY = sy;
          if (api.active() === 'footer' && up) flee();
        }, { passive: true });
        var flee = function () {
          var was = cur; if (!was) return; cur = null;
          clearTimeout(hideT); cancelAnimationFrame(walkRaf);
          el.classList.add('walking');                        // the card disappears at once
          var bx = (function () { var m = /translate3d\(([-\d.]+)px/.exec(body.style.transform); return m ? +m[1] : was.x; })();
          var toRight = true;
          el.classList.toggle('flip', !toRight);
          render('gjump', false); body.classList.remove('hop'); void body.offsetWidth; body.classList.add('hop');
          setTimeout(function () {
            if (cur) return;
            var fin = function () { if (!cur) el.className = 'gguide'; }; fin.out = true;
            walk(bx, innerWidth + 8, was.y, false, fin, true);
          }, 340);
        };

        // runs in under the form, stops above the footer logo, catches his breath, turns to you: "Wait......"
        var waitScene = function () {
          var sz = api.size(), phone = innerWidth < 640, mark = foot.querySelector('.mark') || foot;
          var r = mark.getBoundingClientRect(), x = innerWidth / 2 - sz.w / 2, y = r.top - 8 - (OY + 25) * S;
          var o = { id: 'footer', dark: false, pose: 'front', x: x, y: y, side: 'above', mirror: false, enter: 'walk', from: 'right', text: '', actions: [] };
          clearTimeout(hideT); cancelAnimationFrame(walkRaf); scale(); cur = o;
          el.className = 'gguide on in walking e-walk light'; rope.style.display = 'none';
          walk(innerWidth + 8, x, y, false, function () {
            if (cur !== o) return;
            // catch his breath from the side: bent over, heaving, gasping out "Wait..."
            el.classList.add('flip'); el.classList.remove('walking');
            say('<strong class="wait">Wait</strong>', []); place(o.x, o.y, 'above');
            var n = 0, dots = 0, heave = setInterval(function () {
              if (cur !== o) { clearInterval(heave); return; }
              render(n % 2 ? 'pant1' : 'pant0', false);
              if (n % 2 === 0) puff(x + (OX + 2) * S, y + (OY + 11) * S);
              if (n % 3 === 2 && dots < 3) { dots++; txt.innerHTML = '<strong class="wait">Wait' + new Array(dots + 1).join('.') + '</strong>'; place(o.x, o.y, 'above'); }
              if (++n > 10) {
                clearInterval(heave);
                render('idle', false);                                          // straightens up
                setTimeout(function () { if (cur !== o) return; el.classList.remove('flip'); render('front', false); }, 220);   // turns to face you
                setTimeout(function () { if (cur === o) render('frontb', false); }, 640);
                setTimeout(function () { if (cur === o) render('front', false); }, 760);
                setTimeout(function () { if (cur === o) talkWait(o); }, 900);
              }
            }, 280);
          });
          setTimeout(function () { if (cur === o) hide('walk'); }, 18000);
        };
        var puff = function (px, py) {
          var p = document.createElement('i'); p.className = 'gpuff';
          p.style.left = Math.round(px) + 'px'; p.style.top = Math.round(py) + 'px'; el.appendChild(p);
          setTimeout(function () { p.remove(); }, 900);
        };
        var talkWait = function (o) {
          say('<strong class="wait">Wait...</strong> Let me show you something before you go!' + (innerWidth < 640 ? '' : ' <span class="tip">This site has a hidden terminal. You can also press <code>`</code> anytime.</span>'),
            [{ label: 'Show me', fn: function () { hide('walk'); setTimeout(function () { touring = true; stepI = 0; store.set(TOUR, 'started'); T2.open(coarse); }, 200); } },
             { label: 'Not now', quiet: true, fn: function () { hide('walk'); } }]);
          place(o.x, o.y, 'above');
        };
      }
    }
  })();

})();
