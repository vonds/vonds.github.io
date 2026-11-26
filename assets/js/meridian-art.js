/* Meridian: the art. Every district, building and moving light is painted here, in grayscale pixel art.
   Buildings are painted in two layers so tall ones rise in front of Vee when he walks behind them. */
(function () {
  'use strict';
  var TS = 16;
  function hs(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
  function R(seed) { var s = Math.floor(hs(seed * 3.7 + 1.3) * 233280); return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); var g = c.getContext('2d'); g.imageSmoothingEnabled = false; return c; }
  function P(g) { return function (x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }; }

  /* ---------- a 3x5 pixel font for signs ---------- */
  var GL = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011',
    H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101',
    O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111',
    V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111',
    '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111',
    '9': '111101111001110', '_': '000000000000111', '$': '011110010011110', '>': '100010001010100', ' ': '000000000000000', '.': '000000000000010', ':': '000010000010000', '-': '000000111000000'
  };
  function text(g, s, x, y, c, sc) {
    sc = sc || 1; g.fillStyle = c; s = String(s).toUpperCase();
    for (var i = 0; i < s.length; i++) { var gl = GL[s[i]] || GL[' ']; for (var k = 0; k < 15; k++) if (gl[k] === '1') g.fillRect(x + (i * 4 + k % 3) * sc, y + Math.floor(k / 3) * sc, sc, sc); }
  }
  function textW(s, sc) { return (String(s).length * 4 - 1) * (sc || 1); }

  /* ---------- ground, by district ---------- */
  var THEMES = {
    plaza:      { g0: '#0b0b10', g1: '#15151c', dot: '#2a2a34', road: '#101017', edge: '#8c8c96' },
    commons:    { g0: '#0d0d11', g1: '#18181f', dot: '#2c2c36', road: '#121218', edge: '#9a9aa4' },
    halflight:  { g0: '#0a0a0e', g1: '#131319', dot: '#24242d', road: '#0f0f14', edge: '#7c7c88' },
    gardens:    { g0: '#0c0d0f', g1: '#15171a', dot: '#262a2e', road: '#1a1a20', edge: '#a4a4ae' },
    undercroft: { g0: '#0a0a0d', g1: '#121217', dot: '#1f1f27', road: '#16161c', edge: '#6c6c78' },
    bastion:    { g0: '#0e0e12', g1: '#1a1a21', dot: '#2a2a33', road: '#121218', edge: '#a0a0aa' },
    quiet:      { g0: '#0b0b0f', g1: '#1c1c24', dot: '#33333e', road: '#13131a', edge: '#b8b8c4' },
    terminal:   { g0: '#101015', g1: '#1d1d25', dot: '#30303b', road: '#15151c', edge: '#d0d0da' }
  };

  function paintGround(g, map, theme, W, H, ov) {
    var px = P(g), T = THEMES[theme] || THEMES.plaza;
    function tile(x, y) { return (map[y] || '')[x] || '~'; }
    px(0, 0, W * TS, H * TS, theme === 'quiet' ? '#000000' : '#07070a');
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var t = tile(x, y), X = x * TS, Y = y * TS, r = hs(x * 13 + y * 31);
      if (t === '~') { paintVoid(px, theme, X, Y, x, y, tile); continue; }
      // the floor
      if (theme === 'gardens') {
        px(X, Y, TS, TS, T.g0);
        px(X, Y, TS, 1, '#111316'); for (var i = 0; i < 4; i++) { var gx = Math.floor(hs(x * 7 + y * 3 + i) * 15), gy = Math.floor(hs(x * 5 + y * 11 + i * 2) * 13); px(X + gx, Y + gy, 1, 2, i % 2 ? '#1a1d22' : '#262a30'); px(X + gx + 1, Y + gy + 1, 1, 1, '#1a1d22'); }
        if (r > .9) { px(X + 3, Y + 3, 10, 10, 'rgba(0,0,0,.55)'); }   // a patch where the grass texture was reclaimed
      } else if (theme === 'undercroft') {
        px(X, Y, TS, TS, T.g0); for (var gy2 = 1; gy2 < TS; gy2 += 3) for (var gx2 = 1; gx2 < TS; gx2 += 3) px(X + gx2, Y + gy2, 1, 1, '#15151b');
        px(X, Y, TS, 1, T.g1); px(X, Y, 1, TS, T.g1);
      } else if (theme === 'bastion') {
        px(X, Y, TS, TS, T.g0); px(X, Y, TS, 1, '#1d1d25'); px(X + ((y % 2) ? 8 : 0), Y, 1, 8, '#1d1d25'); px(X, Y + 8, TS, 1, '#1d1d25'); px(X + ((y % 2) ? 0 : 8), Y + 8, 1, 8, '#1d1d25');
      } else if (theme === 'terminal') {
        px(X, Y, TS, TS, T.g0); px(X, Y, TS, 1, '#1a1a22'); px(X, Y, 1, TS, '#1a1a22'); if ((x + y) % 2 === 0) px(X + 1, Y + 1, TS - 1, TS - 1, '#121218');
        px(X + 1, Y + 1, 3, 1, 'rgba(255,255,255,.06)');
      } else if (theme === 'quiet') {
        px(X, Y, TS, TS, '#0d0d12'); px(X, Y, TS, 1, '#2a2a34'); px(X, Y, 1, TS, '#2a2a34'); px(X, Y, 1, 1, '#5a5a66');
        // the edges are coming apart
        if (tile(x, y + 1) === '~') { for (var k = 0; k < 6; k++) px(X + Math.floor(hs(x * 3 + k) * 15), Y + TS - 1 + Math.floor(hs(x + k * 7) * 6), 1 + (k % 2), 1, k % 2 ? '#3a3a46' : '#1c1c24'); px(X, Y + TS - 1, TS, 1, '#6a6a76'); }
        if (tile(x, y - 1) === '~') px(X, Y, TS, 1, '#8a8a96');
        if (tile(x - 1, y) === '~') px(X, Y, 1, TS, '#5a5a66');
        if (tile(x + 1, y) === '~') px(X + TS - 1, Y, 1, TS, '#3a3a46');
      } else {
        px(X, Y, TS, TS, T.g0); px(X, Y, TS, 1, T.g1); px(X, Y, 1, TS, T.g1); px(X, Y, 1, 1, T.dot);
        if (theme === 'commons' && (x + y) % 3 === 0) px(X + 4, Y + 4, 8, 8, '#101015');
        if (theme === 'plaza' && Math.abs(x - 15.5) < 5 && Math.abs(y - 12.5) < 3.5) { px(X, Y, TS, TS, '#121219'); px(X, Y, TS, 1, '#1e1e27'); px(X + 7, Y + 7, 2, 2, '#1e1e27'); }
      }
      if (t === '=') paintRoad(px, theme, X, Y, x, y, tile);
      else if (t === ',') paintField(px, theme, X, Y, x, y);
      else if (t === 'T') paintWall(px, theme, X, Y, x, y, tile);
      else if (t === 'p') paintTree(g, px, X, Y, x, y, ov);
      else if (t === 'E') { px(X, Y, TS, TS, T.road); }
      else if (t === 'D') { for (var s = 0; s < 5; s++) { px(X + 1, Y + s * 3 + 1, TS - 2, 2, s % 2 ? '#2a2a34' : '#3c3c48'); px(X + 1, Y + s * 3 + 1, TS - 2, 1, '#6a6a76'); } px(X, Y, 1, TS, '#8a8a96'); px(X + TS - 1, Y, 1, TS, '#3a3a46'); }
      else if (t === 'G') { px(X, Y, TS, TS, '#0c0c11'); px(X + 1, Y, 2, TS, '#3a3a46'); px(X + 13, Y, 2, TS, '#3a3a46'); px(X + 1, Y, 1, TS, '#9a9aa6'); }
      else if (t === 'F') { /* the fountain is painted whole below */ }
      else if (t === 'l') paintLamp(px, X, Y, theme);
      else if (t === 's') paintKiosk(px, X, Y);
      else if (t === 'o') { px(X + 4, Y + 12, 8, 3, '#1a1a22'); px(X + 4, Y + 12, 8, 1, '#6a6a76'); }
      else if (t === 'c') paintCache(px, X, Y);
    }
    // the plaza fountain, as one piece
    var fx = -1, fy = -1;
    for (var yy = 0; yy < H && fx < 0; yy++) for (var xx = 0; xx < W; xx++) if (tile(xx, yy) === 'F') { fx = xx; fy = yy; break; }
    if (fx >= 0) paintFountain(g, px, fx * TS, fy * TS);
  }
  function paintRoad(px, theme, X, Y, x, y, tile) {
    var T = THEMES[theme] || THEMES.plaza, hz = tile(x - 1, y) === '=' || tile(x + 1, y) === '=' || tile(x - 1, y) === 'E' || tile(x + 1, y) === 'E';
    var vt = tile(x, y - 1) === '=' || tile(x, y + 1) === '=';
    if (theme === 'gardens') { px(X, Y, TS, TS, '#17171d'); for (var i = 0; i < 7; i++) px(X + Math.floor(hs(x * 3 + y * 7 + i) * 15), Y + Math.floor(hs(x * 11 + y + i * 5) * 15), 1, 1, '#34343e'); return; }
    if (theme === 'undercroft') { px(X, Y, TS, TS, '#15151b'); for (var gx = 0; gx < TS; gx += 2) px(X + gx, Y, 1, TS, '#22222a'); px(X, Y, TS, 1, '#4a4a56'); px(X, Y + TS - 1, TS, 1, '#4a4a56'); return; }
    if (theme === 'quiet') { px(X, Y + 5, TS, 6, '#16161d'); px(X, Y + 5, TS, 1, '#9a9aa6'); px(X, Y + 10, TS, 1, '#4a4a56'); if (!hz && vt) { px(X, Y, TS, TS, '#000'); px(X + 5, Y, 6, TS, '#16161d'); px(X + 5, Y, 1, TS, '#9a9aa6'); px(X + 10, Y, 1, TS, '#4a4a56'); } return; }
    px(X, Y, TS, TS, T.road);
    var isH = hz || !vt;
    var both = tile(x, y - 1) === '=' && tile(x, y + 1) === '=' && hz;
    if (theme === 'terminal') { px(X, Y + 7, TS, 2, '#2a2a34'); if (x % 2) { px(X + 4, Y + 6, 6, 1, '#c0c0cc'); px(X + 9, Y + 5, 1, 1, '#c0c0cc'); px(X + 9, Y + 9, 1, 1, '#c0c0cc'); px(X + 10, Y + 7, 1, 2, '#c0c0cc'); } return; }
    // glowing circuit traces at the outer edges of a two-wide road
    if (isH) {
      if (tile(x, y - 1) !== '=') px(X, Y + 1, TS, 1, T.edge);
      if (tile(x, y + 1) !== '=') px(X, Y + TS - 2, TS, 1, T.edge);
      if (tile(x, y + 1) === '=' && x % 2) px(X + 3, Y + TS - 1, 8, 1, 'rgba(236,236,242,.35)');
      if (!both && tile(x, y - 1) !== '=' && tile(x, y + 1) !== '=' && x % 2) px(X + 3, Y + 7, 8, 2, 'rgba(236,236,242,.4)');
    } else {
      if (tile(x - 1, y) !== '=') px(X + 1, Y, 1, TS, T.edge);
      if (tile(x + 1, y) !== '=') px(X + TS - 2, Y, 1, TS, T.edge);
      if (tile(x + 1, y) === '=' && y % 2) px(X + TS - 1, Y + 3, 1, 8, 'rgba(236,236,242,.35)');
    }
    if (theme === 'halflight' && isH && x % 6 === 0) for (var z = 3; z < 13; z += 3) px(X + 2, Y + z, 12, 1, 'rgba(220,220,230,.22)');   // crossings
    if (hs(x * 13 + y * 31) > .78) { var c0 = X + 3 + Math.floor(hs(x + y) * 9); px(c0, Y + 3, 1, 4, '#060609'); px(c0 + 1, Y + 6, 1, 4, '#060609'); px(c0, Y + 10, 2, 1, '#060609'); }
  }
  function paintField(px, theme, X, Y, x, y) {
    var base = theme === 'gardens' ? ['#22262c', '#3a4048', '#6e7680'] : theme === 'undercroft' ? ['#1c1c24', '#33333e', '#5a5a66'] : ['#262630', '#3a3a46', '#6e6e7a'];
    if (theme === 'undercroft') {   // nests of loose cable
      for (var c = 0; c < 3; c++) { var y0 = Y + 3 + c * 4 + Math.floor(hs(x * 3 + c) * 2); for (var i = 0; i < TS; i++) px(X + i, y0 + Math.round(Math.sin((i + x * 16) / 3 + c) * 1.2), 1, 1, base[c % 2 + 1]); }
      return;
    }
    if (theme === 'gardens') { for (var j = 0; j < 6; j++) { var bx = X + 1 + Math.floor(hs(x * 9 + y * 4 + j) * 13), by = Y + Math.floor(hs(x * 2 + y * 13 + j) * 10); px(bx, by + 2, 1, 4, base[1]); px(bx + 1, by, 1, 6, j % 3 ? base[1] : base[2]); px(bx - 1, by + 3, 1, 3, base[0]); } return; }
    for (var k = 0; k < 18; k++) { var r = hs(x * 41 + y * 17 + k); px(X + Math.floor(hs(x * 9 + y * 23 + k * 3) * 15), Y + Math.floor(hs(x * 29 + y * 5 + k * 7) * 15), r > .7 ? 2 : 1, 1, r > .85 ? base[2] : r > .5 ? base[1] : base[0]); }
  }
  function paintVoid(px, theme, X, Y, x, y, tile) {
    if (theme === 'gardens') {   // a pond, its water only partly rendered
      px(X, Y, TS, TS, '#121620'); for (var i = 2; i < TS; i += 4) px(X + (y % 2) * 4, Y + i, 9, 1, 'rgba(200,210,226,.16)');
      if (hs(x * 5 + y * 9) > .55) { px(X + 2, Y + 2, 12, 12, '#010102'); px(X + 2, Y + 2, 12, 1, 'rgba(200,210,226,.3)'); }   // a square of water that stopped rendering
      else if (hs(x * 11 + y) > .6) { px(X + 4, Y + 6, 6, 3, '#3a4a44'); px(X + 4, Y + 6, 6, 1, '#6a7a72'); px(X + 7, Y + 7, 2, 1, '#121620'); }   // a lily pad
      if (tile(x, y - 1) !== '~') { px(X, Y, TS, 2, '#2a2e34'); px(X, Y, TS, 1, '#6e7680'); }
      if (tile(x - 1, y) !== '~') px(X, Y, 1, TS, '#4a4e56'); if (tile(x + 1, y) !== '~') px(X + TS - 1, Y, 1, TS, '#2a2e34');
      return;
    }
    if (theme === 'undercroft') {   // the coolant channel
      px(X, Y, TS, TS, '#050508'); px(X, Y, TS, 1, '#5a5a66'); px(X, Y + TS - 1, TS, 1, '#2a2a34'); px(X, Y + 1, TS, 2, '#0e0e14');
      return;
    }
    px(X, Y, TS, TS, '#000000');
    if (hs(x * 7 + y * 19) > .82) px(X + Math.floor(hs(x + y * 3) * 14), Y + Math.floor(hs(x * 5 + y) * 14), 1, 1, '#4a4a56');
  }
  function paintWall(px, theme, X, Y, x, y, tile) {
    if (theme === 'gardens') {   // glasshouse panes
      px(X, Y, TS, TS, '#0d0e11'); px(X, Y, 1, TS, '#7a7e88'); px(X + TS - 1, Y, 1, TS, '#2a2e34'); px(X, Y + 7, TS, 1, '#4a4e56');
      for (var d = 0; d < 6; d++) px(X + 3 + d, Y + 2 + d, 1, 1, 'rgba(230,236,244,.25)');
      return;
    }
    if (theme === 'undercroft') {   // conduit walls
      px(X, Y, TS, TS, '#0c0c10'); px(X, Y + 3, TS, 3, '#22222b'); px(X, Y + 3, TS, 1, '#5a5a66'); px(X, Y + 9, TS, 4, '#1a1a21'); px(X, Y + 9, TS, 1, '#44444f');
      if (x % 4 === 0) { px(X + 6, Y + 2, 3, 12, '#2a2a34'); px(X + 6, Y + 2, 1, 12, '#6a6a76'); }
      return;
    }
    if (theme === 'bastion') {   // fortified wall with crenellations
      px(X, Y + 3, TS, 13, '#1a1a21'); for (var r = 0; r < 4; r++) { px(X, Y + 6 + r * 3, TS, 1, '#0e0e13'); px(X + ((r + x) % 2 ? 4 : 11), Y + 3 + r * 3, 1, 3, '#0e0e13'); }
      px(X, Y + 3, TS, 1, '#8a8a96'); if (x % 2 === 0) { px(X + 2, Y, 6, 4, '#1f1f27'); px(X + 2, Y, 6, 1, '#a0a0aa'); } px(X + TS - 1, Y + 3, 1, 13, '#0a0a0e');
      return;
    }
    if (theme === 'terminal') {   // a railing at the edge of the platform
      px(X, Y, TS, TS, '#08080b'); px(X, Y + 6, TS, 1, '#c0c0cc'); px(X, Y + 9, TS, 1, '#6a6a76'); px(X + 2, Y + 6, 1, 8, '#6a6a76'); px(X + 10, Y + 6, 1, 8, '#6a6a76'); px(X, Y + 14, TS, 2, '#15151c');
      return;
    }
    // data pylons: slim obelisks with lit edges; some have gone dark, a few are cracked
    px(X, Y, TS, TS, '#09090c');
    px(X + 5, Y + 3, 6, 13, '#16161d'); px(X + 5, Y + 3, 1, 13, '#5c5c68'); px(X + 10, Y + 3, 1, 13, '#2c2c36');
    px(X + 6, Y + 1, 4, 2, '#16161d'); px(X + 7, Y, 2, 1, '#9a9aa6');
    var dead = hs(x * 7 + y * 11) > .62;
    for (var k = 0; k < 3; k++) px(X + 7, Y + 6 + k * 3, 2, 1, dead ? '#202028' : (x + y + k) % 3 ? '#3a3a46' : '#a8a8b4');
    if (dead) { px(X + 7, Y, 2, 1, '#2a2a32'); if (hs(x + y * 3) > .5) { px(X + 8, Y + 5, 1, 4, '#050507'); px(X + 9, Y + 9, 1, 3, '#050507'); } }
  }
  function paintTree(g, px, X, Y, x, y, o) {
    var kind = Math.floor(hs(x * 3 + y * 7) * 3), wire = hs(x * 5 + y * 3), cxT = X + 8, cyT = Y - 1;
    px(X + 1, Y + 12, 15, 4, 'rgba(0,0,0,.45)');
    var po = P(o);
    if (kind === 2) {   // a glasshouse palm
      po(X + 7, Y - 6, 2, 20, '#3a3a40'); for (var r = 0; r < 20; r += 3) po(X + 7, Y - 6 + r, 2, 1, '#5a5a62');
      var fr = [[-9, -1], [-7, 3], [9, -1], [7, 3], [-4, -6], [4, -6], [0, -8]];
      fr.forEach(function (d, i) { o.strokeStyle = wire > .5 && i % 2 ? 'rgba(220,226,236,.7)' : i % 2 ? '#6a7078' : '#8a9098'; o.lineWidth = 1.5; o.beginPath(); o.moveTo(X + 8, Y - 6); o.quadraticCurveTo(X + 8 + d[0] * .6, Y - 10 + d[1] * .3, X + 8 + d[0], Y - 6 + d[1] + 4); o.stroke(); });
      return;
    }
    px(X + 7, Y + 2, 2, 13, '#2a2a30'); px(X + 7, Y + 2, 1, 13, '#5a5a62'); px(X + 5, Y + 13, 6, 2, '#2a2a30');
    var rx = kind === 1 ? 5 : 9, ry = kind === 1 ? 12 : 9, cy0 = kind === 1 ? Y - 4 : Y - 2;
    o.save(); o.beginPath(); o.ellipse(cxT, cy0, rx, ry, 0, 0, 7); o.clip();
    o.fillStyle = '#15171b'; o.fillRect(cxT - rx, cy0 - ry, rx * 2, ry * 2);
    for (var k = 0; k < 46; k++) { var lx = cxT - rx + Math.floor(hs(x * 9 + k) * rx * 2), ly = cy0 - ry + Math.floor(hs(y * 7 + k * 3) * ry * 2), d2 = (lx - cxT + rx * .4) + (ly - cy0 + ry * .4); po(lx, ly, 2, 2, d2 < 0 ? '#8a909c' : d2 < rx ? '#4a505a' : '#2a2e36'); }
    if (wire > .4) {   // the reclaimed half: texture gone, only the mesh left
      var cutX = cxT + (wire - .7) * 10;
      o.fillStyle = '#07080a'; o.beginPath(); o.moveTo(cutX - 6, cy0 - ry - 1); o.lineTo(cxT + rx + 1, cy0 - ry - 1); o.lineTo(cxT + rx + 1, cy0 + ry + 1); o.lineTo(cutX + 6, cy0 + ry + 1); o.fill();
      o.strokeStyle = 'rgba(214,220,232,.55)'; o.lineWidth = 1;
      for (var m = -ry; m <= ry; m += 4) { o.beginPath(); o.moveTo(cutX - 6, cy0 + m + .5); o.lineTo(cxT + rx, cy0 + m + .5); o.stroke(); }
      for (var n = -rx; n <= rx; n += 4) { o.beginPath(); o.moveTo(cxT + n + .5, cy0 - ry); o.lineTo(cxT + n + 4.5, cy0 + ry); o.stroke(); }
    }
    o.restore();
    o.strokeStyle = wire > .4 ? 'rgba(226,232,242,.85)' : 'rgba(110,116,126,.8)'; o.lineWidth = 1; o.beginPath(); o.ellipse(cxT, cy0, rx, ry, 0, 0, 7); o.stroke();
  }
  function paintLamp(px, X, Y, theme) {
    px(X + 4, Y + 13, 8, 2, 'rgba(0,0,0,.4)');
    px(X + 7, Y + 1, 2, 13, '#22222b'); px(X + 7, Y + 1, 1, 13, '#6a6a76'); px(X + 5, Y + 13, 6, 2, '#1a1a22'); px(X + 4, Y, 8, 2, '#2a2a34'); px(X + 4, Y + 2, 8, 1, '#e8e8f0');
  }
  function paintKiosk(px, X, Y) {
    px(X + 3, Y + 13, 10, 3, '#16161d'); px(X + 3, Y + 13, 10, 1, '#8a8a96'); px(X + 7, Y + 7, 2, 6, '#3a3a46');
  }
  function paintCache(px, X, Y) {
    px(X + 2, Y + 13, 13, 2, 'rgba(0,0,0,.5)');
    px(X + 2, Y + 5, 12, 9, '#14141b'); px(X + 2, Y + 5, 12, 1, '#a0a0ac'); px(X + 2, Y + 5, 1, 9, '#7a7a86'); px(X + 13, Y + 5, 1, 9, '#2a2a34');
    px(X + 2, Y + 8, 12, 1, '#3a3a46'); px(X + 7, Y + 7, 2, 3, '#cfcfda');
  }
  function paintFountain(g, px, X, Y) {
    // a circular basin, its water frozen mid-render
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(X + 33, Y + 30, 33, 6, 0, 0, 7); g.fill();
    g.fillStyle = '#1a1a22'; g.beginPath(); g.ellipse(X + 32, Y + 22, 31, 10, 0, 0, 7); g.fill();
    g.strokeStyle = '#b0b0bc'; g.lineWidth = 1; g.beginPath(); g.ellipse(X + 32, Y + 21.5, 31, 10, 0, 0, 7); g.stroke();
    g.fillStyle = '#07070a'; g.beginPath(); g.ellipse(X + 32, Y + 21, 27, 7.5, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(200,200,214,.18)'; for (var i = 1; i < 4; i++) { g.beginPath(); g.ellipse(X + 32, Y + 21, 27 * i / 4, 7.5 * i / 4, 0, 0, 7); g.stroke(); }
    px(X + 29, Y + 4, 6, 18, '#22222b'); px(X + 29, Y + 4, 1, 18, '#8a8a96'); px(X + 25, Y + 3, 14, 3, '#2a2a34'); px(X + 25, Y + 3, 14, 1, '#c0c0cc');
  }

  /* ---------- buildings ---------- */
  // windows on a glass facade: a grid of lit, dim and dark panes, with whole floors gone dark
  function windows(px, rnd, x0, y0, w, h, opt) {
    opt = opt || {}; var cw = opt.cw || 3, ch = opt.ch || 4, lit = opt.lit == null ? .5 : opt.lit;
    for (var y = y0; y + ch - 1 <= y0 + h; y += ch) {
      var floor = rnd(), deadFloor = floor < (opt.dead || .12), band = floor > .93;
      for (var x = x0; x + cw - 1 <= x0 + w; x += cw) {
        var r = rnd(), c = deadFloor ? '#111118' : band ? '#c8c8d6' : r < lit * .35 ? '#ececf4' : r < lit ? '#9c9cac' : r < lit + .2 ? '#34343f' : '#18181f';
        px(x, y, cw - 1, ch - 2, c);
        if (!deadFloor && r < lit * .35) px(x, y + ch - 2, cw - 1, 1, 'rgba(236,236,244,.25)');
      }
    }
  }
  function reflect(g, x0, y0, w, h, off) {
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); g.fillStyle = 'rgba(255,255,255,.06)';
    for (var k = -2; k < 3; k++) { g.beginPath(); var bx = x0 + off + k * 26; g.moveTo(bx, y0 + h); g.lineTo(bx + 7, y0 + h); g.lineTo(bx + 7 + h * .55, y0); g.lineTo(bx + h * .55, y0); g.fill(); }
    g.restore();
  }
  function sign(g, px, s, cx0, y, sc, glow) {
    var w = textW(s, sc); px(cx0 - w / 2 - 3, y - 2, w + 6, 5 * sc + 4, '#08080b'); px(cx0 - w / 2 - 3, y - 2, w + 6, 1, '#5a5a66');
    if (glow) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(cx0 - w / 2 - 2, y - 1, w + 4, 5 * sc + 2); }
    text(g, s, Math.round(cx0 - w / 2), y, '#f2f2f8', sc);
  }
  function damage(px, rnd, x0, y0, w, h) {
    var hx = x0 + Math.floor(rnd() * (w - 10)), hy = y0 + Math.floor(rnd() * (h - 12));
    px(hx, hy, 7, 6, '#020203'); px(hx + 2, hy - 2, 4, 2, '#020203'); px(hx - 1, hy + 2, 2, 3, '#020203'); px(hx + 6, hy + 3, 2, 4, '#020203');
    for (var i = 0; i < 6; i++) px(hx + Math.floor(rnd() * 9), hy + 7 + Math.floor(rnd() * 10), 1, 1, rnd() > .5 ? '#3a3a46' : '#15151b');   // pixels shedding off the hole
  }

  // a glass tower with real depth: a side face, setback tiers with roof terraces, a crown, and sometimes a billboard
  var SLOGANS = ['UPSTREAM', 'SOLD OUT', 'GO NEWER', 'LIFT 9 MIN', 'YOU EARNED IT', 'NEW WORLD', 'LEAVE LIGHT', 'SEATS 0'];
  function facade(px, rnd, x0, y0, w, h, style, lit) {
    if (style === 1) {   // ribbon windows: continuous glass bands
      for (var y = y0 + 2; y < y0 + h - 2; y += 5) {
        px(x0 + 1, y, w - 2, 3, '#1a1a24');
        for (var x = x0 + 1; x < x0 + w - 1;) { var len = 2 + Math.floor(rnd() * 6), r = rnd(); px(x, y, Math.min(len, x0 + w - 1 - x), 3, r < lit * .4 ? '#e6e6f0' : r < lit ? '#8e8e9e' : '#22222c'); x += len + 1; }
        px(x0 + 1, y + 3, w - 2, 1, '#2c2c38');
      }
    } else if (style === 2) {   // vertical fins with lit slots between
      for (var fx = x0 + 1; fx < x0 + w - 1; fx += 4) { px(fx, y0, 1, h, '#2e2e3a'); px(fx, y0, 1, h, 'rgba(200,200,214,.12)'); }
      for (var y2 = y0 + 2; y2 < y0 + h - 3; y2 += 4) for (var x2 = x0 + 2; x2 < x0 + w - 2; x2 += 4) { var r2 = rnd(); px(x2, y2, 2, 3, r2 < lit * .35 ? '#ececf4' : r2 < lit ? '#9a9aaa' : r2 < lit + .2 ? '#30303b' : '#17171e'); }
    } else windows(px, rnd, x0 + 2, y0 + 2, w - 4, h - 4, { lit: lit, dead: .13 });
  }
  function tower(g, W, Ht, Hf, b, lights) {
    var px = P(g), rnd = R(b.seed || 1), side = Math.max(4, Math.min(8, Math.floor(W / 9))), style = b.style != null ? b.style : Math.floor(rnd() * 3);
    var podium = 14, fw0 = W - side - 1, tiers = Ht > 90 ? 3 : 2, crownH = 10, bodyTop = crownH + 2, bodyH = Ht - podium - bodyTop, tierH = Math.floor(bodyH / tiers);
    // tiers, from the top down, each a little wider than the one above
    for (var i = 0; i < tiers; i++) {
      var inset = (tiers - 1 - i) * 3, x0 = 1 + inset, fw = fw0 - inset * 2, y0 = bodyTop + i * tierH, h = (i === tiers - 1 ? Ht - podium : y0 + tierH) - y0;
      // roof slab, seen slightly from above
      px(x0, y0 - 3, fw + side, 3, '#26262f'); px(x0, y0 - 3, fw + side, 1, '#a8a8b6'); px(x0 + fw, y0 - 3, side, 1, '#6a6a78');
      if (i > 0) { for (var pl = x0 + 2; pl < x0 + fw - 2; pl += 5) { px(pl, y0 - 5, 2, 2, '#3e434c'); px(pl, y0 - 6, 1, 1, '#6a707a'); } px(x0, y0 - 4, fw + side, 1, 'rgba(200,200,214,.35)'); }
      // the side face, in shadow
      px(x0 + fw, y0, side, h, '#08080c'); for (var sy = y0 + 3; sy < y0 + h - 2; sy += 4) for (var sx = 1; sx < side - 1; sx += 2) if (rnd() > .62) px(x0 + fw + sx, sy, 1, 2, rnd() > .5 ? '#5a5a68' : '#2a2a34');
      px(x0 + fw, y0, 1, h, '#1e1e28');
      // the front face
      px(x0, y0, fw, h, '#0f0f16'); facade(px, rnd, x0, y0, fw, h, style, .4 + rnd() * .25);
      px(x0, y0, 1, h, '#b0b0be'); px(x0 + fw - 1, y0, 1, h, '#2a2a36');
      if (style === 2 || rnd() > .7) px(x0 + 2, y0, 1, h, 'rgba(236,236,246,.55)');   // an accent light strip
    }
    reflect(g, 1, bodyTop, fw0, Ht - podium - bodyTop, Math.floor(rnd() * 24));
    // the crown
    var tw0 = fw0 - (tiers - 1) * 6, cx0 = 1 + (tiers - 1) * 3, crown = Math.floor(rnd() * 3);
    px(cx0, bodyTop - 4, tw0 + side, 1, '#e4e4ee');
    if (crown === 0) { px(cx0 + Math.floor(tw0 / 2), 0, 1, bodyTop - 4, '#8a8a98'); px(cx0 + Math.floor(tw0 / 2) - 2, bodyTop - 8, 5, 4, '#1d1d26'); lights.push({ x: cx0 + Math.floor(tw0 / 2) - 1, y: 0, kind: 'blink', ph: rnd() * 6 }); }
    else if (crown === 1) { for (var k = 0; k < bodyTop - 4; k++) { var hw = (tw0 / 2) * (k / (bodyTop - 4)); px(cx0 + tw0 / 2 - hw, k, hw * 2, 1, k === bodyTop - 5 ? '#c8c8d4' : '#14141c'); px(cx0 + tw0 / 2 - hw, k, 1, 1, '#9a9aa8'); } lights.push({ x: cx0 + Math.floor(tw0 / 2) - 1, y: 0, kind: 'blink', ph: rnd() * 6 }); }
    else { g.strokeStyle = 'rgba(220,220,236,.6)'; g.beginPath(); g.ellipse(cx0 + tw0 / 2 + side / 2, bodyTop - 5.5, Math.min(9, tw0 / 2 - 2), 2.5, 0, 0, 7); g.stroke(); text(g, 'H', Math.round(cx0 + tw0 / 2 + side / 2 - 1), bodyTop - 8, '#9a9aa8'); for (var u = 0; u < 3; u++) px(cx0 + 2 + u * 4, bodyTop - 7, 3, 3, '#2a2a34'); lights.push({ x: cx0 + 1, y: bodyTop - 8, kind: 'blink', ph: rnd() * 6 }); }
    // damage: a hole where something was reclaimed
    if (rnd() > .45) damage(px, rnd, 4, bodyTop + 6, fw0 - 8, Ht - podium - bodyTop - 14);
    // a billboard for the newer world
    if (rnd() > .4 && W >= 60) {
      var sl = SLOGANS.filter(function (q) { return textW(q) <= fw0 - 14; }), word = sl[Math.floor(rnd() * sl.length)] || 'UPSTREAM', bw = textW(word) + 10, bx = 1 + Math.floor((fw0 - bw) / 2), by = bodyTop + Math.floor(rnd() * Math.max(1, Ht - podium - bodyTop - 30)) + 4;
      px(bx - 1, by - 1, bw + 2, 13, '#d8d8e4'); px(bx, by, bw, 11, '#07070a'); text(g, word, bx + 5, by + 3, '#ffffff');
      px(bx + 2, by + 12, 1, 3, '#5a5a66'); px(bx + bw - 3, by + 12, 1, 3, '#5a5a66');
      lights.push({ x: bx, y: by, w: bw, h: 11, kind: 'bill', ph: rnd() * 6 });
    }
    // podium and lobby
    var py = Ht - podium, pw = W;
    px(0, py, pw, podium, '#0b0b10'); px(0, py, pw, 1, '#c8c8d4'); px(0, py + 1, pw, 1, '#2a2a34'); px(0, py, 1, podium, '#6a6a76'); px(pw - side, py, side, podium, '#060609');
    px(3, py + 4, pw - side - 6, podium - 5, 'rgba(210,210,226,.18)'); for (var m = 6; m < pw - side - 4; m += 5) px(m, py + 4, 1, podium - 5, '#1a1a22');
    px(2, py + 3, pw - side - 4, 1, '#e8e8f0');
    if (b.door != null) { var dx = b.door * TS + 3; px(dx - 2, py + 2, 14, 2, '#d0d0dc'); px(dx, py + 5, 10, podium - 5, '#06060a'); px(dx, py + 5, 10, 1, '#f0f0f6'); px(dx, py + 5, 1, podium - 5, '#b0b0bc'); px(dx + 9, py + 5, 1, podium - 5, '#b0b0bc'); }
  }
  // low-rise homes: balconies, warm windows, a roof garden
  function home(g, W, Ht, Hf, b, lights) {
    var px = P(g), rnd = R(b.seed || 2), roofY = Ht - Hf - 4 > 0 ? Ht - Hf - 4 : 2;
    px(1, roofY, W - 2, 4, '#1a1a22'); px(1, roofY, W - 2, 1, '#b0b0bc');
    for (var s = 3; s < W - 8; s += 7) { px(s, roofY - 3, 5, 3, '#2a2a36'); px(s, roofY - 3, 5, 1, '#8a8a98'); }   // solar panels
    px(W - 7, roofY - 5, 4, 5, '#22222b'); px(W - 7, roofY - 5, 4, 1, '#6a6a76');   // a cooling unit
    var by = roofY + 4, bh = Ht - by;
    px(1, by, W - 2, bh, '#111118'); px(1, by, 1, bh, '#8a8a96'); px(W - 2, by, 1, bh, '#06060a');
    for (var fl = by + 3; fl < Ht - 10; fl += 11) {
      for (var wx = 4; wx < W - 8; wx += 9) { var on = rnd(); px(wx, fl, 7, 6, on > .45 ? '#d8d8e4' : on > .25 ? '#6a6a78' : '#18181f'); px(wx + 3, fl, 1, 6, '#26262f'); if (on > .45) px(wx, fl + 6, 7, 1, 'rgba(236,236,244,.25)'); }
      px(2, fl + 7, W - 4, 1, '#c0c0cc'); for (var r2 = 3; r2 < W - 3; r2 += 3) px(r2, fl + 8, 1, 2, '#5a5a66');   // balcony rail
      px(4, fl + 5, 3, 2, '#3a3e46'); px(W - 9, fl + 5, 3, 2, '#3a3e46');   // planters
    }
    px(Math.floor(W / 2) - 4, Ht - 10, 8, 10, '#07070a'); px(Math.floor(W / 2) - 4, Ht - 10, 8, 1, '#e8e8f0');
    if (rnd() > .6) damage(px, rnd, 3, by + 2, W - 6, bh - 12);
  }
  // BLACK SIGNAL: a faceted glass spire with light strips, orbit rings and a beacon
  function spire(g, W, Ht, Hf, b, lights, lit) {
    var px = P(g), cx0 = W / 2, base = Ht - 18, topY = 14;
    // back halves of the orbit rings
    g.strokeStyle = 'rgba(200,200,214,.35)'; g.lineWidth = 1;
    [[topY + 20, 26, 5], [topY + 40, 34, 7]].forEach(function (o) { g.beginPath(); g.ellipse(cx0, o[0], o[1], o[2], 0, Math.PI, 0); g.stroke(); });
    // the spire: two facets, one catching the light
    for (var y = topY; y < base; y++) {
      var p = (y - topY) / (base - topY), hw = 5 + p * (W * .34);
      px(cx0 - hw, y, hw, 1, '#2a2a36'); px(cx0, y, hw, 1, '#101018');
      px(cx0 - hw, y, 1, 1, '#d8d8e4'); px(cx0 + hw - 1, y, 1, 1, '#06060a'); px(cx0, y, 1, 1, '#8a8a98');
      if (y % 6 === 0) { px(cx0 - hw + 1, y, hw * 2 - 2, 1, 'rgba(236,236,244,.18)'); }
      // vertical light strips running the height of the tower
      [-.66, -.33, .33, .66].forEach(function (k, i) { var sxs = cx0 + k * hw; px(sxs, y, 1, 1, (lit || i !== 2) ? (k < 0 ? '#f4f4fa' : '#9a9aaa') : '#1a1a22'); });
    }
    reflect(g, 0, topY, W, base - topY, 6);
    px(cx0 - 1, 0, 2, topY, '#9a9aa8'); px(cx0 - 3, topY - 3, 6, 3, '#22222c'); px(cx0 - 3, topY - 3, 6, 1, '#e8e8f0');
    lights.push({ x: cx0 - 1, y: 0, kind: 'beacon' });
    // a crack where the signal failed
    if (!lit) { px(cx0 + 8, base - 40, 1, 8, '#020203'); px(cx0 + 9, base - 33, 1, 6, '#020203'); px(cx0 + 7, base - 28, 3, 1, '#020203'); }
    // front halves of the rings
    g.strokeStyle = 'rgba(236,236,246,.75)';
    [[topY + 20, 26, 5], [topY + 40, 34, 7]].forEach(function (o) { g.beginPath(); g.ellipse(cx0, o[0], o[1], o[2], 0, 0, Math.PI); g.stroke(); });
    // the plinth, steps and a lit entrance
    px(2, base, W - 4, 18, '#0d0d13'); px(2, base, W - 4, 1, '#d0d0dc'); px(2, base, 1, 18, '#8a8a96'); px(W - 3, base, 1, 18, '#050508');
    for (var s = 0; s < 3; s++) px(6 + s * 2, Ht - 3 + s - 2, W - 12 - s * 4, 1, '#3a3a46');
    var dx = b.door * TS + 3; px(dx, base + 5, 10, 13, '#050508'); px(dx - 1, base + 4, 12, 1, '#ffffff'); px(dx, base + 5, 1, 13, '#c0c0cc'); px(dx + 9, base + 5, 1, 13, '#c0c0cc');
    sign(g, px, b.sign, W / 2 - (b.door * TS + 8 < W / 2 ? -14 : 14), base + 6, 1, true);
  }
  // DIGITAL RESOURCE MAP: a dome wrapped in map lines, dotted with the places help can be found
  function archiveDome(g, W, Ht, Hf, b, lights) {
    var px = P(g), cxD = W / 2, baseY = Ht - 20, rx = W / 2 - 6, ry = baseY - 6;
    g.fillStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.ellipse(cxD, 6, 18, 3, 0, 0, 7); g.fill();
    g.fillStyle = '#12121a'; g.beginPath(); g.ellipse(cxD, baseY, rx, ry, 0, Math.PI, 0); g.fill();
    // light from the left, shadow to the right
    g.save(); g.beginPath(); g.ellipse(cxD, baseY, rx, ry, 0, Math.PI, 0); g.clip();
    g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.ellipse(cxD - rx * .35, baseY - ry * .5, rx * .55, ry * .7, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(cxD + rx * .45, 0, rx, baseY);
    g.restore();
    g.strokeStyle = 'rgba(200,200,214,.6)'; g.lineWidth = 1; g.beginPath(); g.ellipse(cxD, baseY, rx, ry, 0, Math.PI, 0); g.stroke();
    g.strokeStyle = 'rgba(170,170,186,.32)';
    for (var m = 1; m < 5; m++) { g.beginPath(); g.ellipse(cxD, baseY, rx * m / 5, ry, 0, Math.PI, 0); g.stroke(); }
    for (var n = 1; n < 5; n++) { var yy = baseY - ry * n / 5, ww = rx * Math.sqrt(1 - Math.pow(n / 5, 2)); g.beginPath(); g.moveTo(cxD - ww, Math.floor(yy) + .5); g.lineTo(cxD + ww, Math.floor(yy) + .5); g.stroke(); }
    // map pins: the places on the map
    var pins = [[-.5, .3], [-.2, .55], [.15, .25], [.35, .6], [-.35, .75], [.05, .78], [.55, .35], [-.62, .6]];
    pins.forEach(function (p, i) { var x = Math.round(cxD + p[0] * rx), y = Math.round(baseY - p[1] * ry); px(x - 1, y - 3, 3, 3, '#f4f4fa'); px(x, y, 1, 2, '#9a9aaa'); lights.push({ x: x - 2, y: y - 4, kind: 'pin', ph: i }); });
    // a panel the Reclaimer took
    px(cxD + 12, baseY - ry * .62, 9, 7, '#030305'); px(cxD + 14, baseY - ry * .62 - 2, 5, 2, '#030305');
    px(cxD - 1, 0, 2, baseY - ry + 1, '#9a9aa8');
    // the colonnade
    px(2, baseY, W - 4, 20, '#0d0d13'); px(0, baseY, W, 2, '#22222c'); px(0, baseY, W, 1, '#d0d0dc');
    for (var c = 5; c < W - 5; c += 8) { px(c, baseY + 3, 3, 15, '#2a2a36'); px(c, baseY + 3, 1, 15, '#b0b0bc'); px(c + 3, baseY + 4, 5, 13, 'rgba(220,220,236,.13)'); }
    var dx = b.door * TS + 3; px(dx, baseY + 5, 10, 15, '#050508'); px(dx - 1, baseY + 4, 12, 1, '#ffffff');
    sign(g, px, b.sign, cxD, baseY - 12, 1, true);
  }
  // DEEDS: a civic hall with columns, a pediment and the seal of a verified deed
  function ledger(g, W, Ht, Hf, b, lights, lit) {
    var px = P(g), py = 16, baseY = Ht - 10;
    // pediment
    for (var y = 0; y < py; y++) { var hw = (W / 2 - 3) * (y / py); px(W / 2 - hw, y + 4, hw * 2, 1, y === 0 ? '#e0e0ea' : '#15151d'); px(W / 2 - hw, y + 4, 1, 1, '#d0d0dc'); px(W / 2 + hw - 1, y + 4, 1, 1, '#5a5a66'); }
    // the seal: a check inside a ring
    g.strokeStyle = lit ? '#ffffff' : '#9a9aa8'; g.beginPath(); g.arc(W / 2, 14, 5.5, 0, 7); g.stroke();
    px(W / 2 - 3, 14, 1, 1, lit ? '#fff' : '#bbb'); px(W / 2 - 2, 15, 1, 1, lit ? '#fff' : '#bbb'); px(W / 2 - 1, 16, 1, 1, lit ? '#fff' : '#bbb'); px(W / 2, 15, 1, 1, lit ? '#fff' : '#bbb'); px(W / 2 + 1, 14, 1, 1, lit ? '#fff' : '#bbb'); px(W / 2 + 2, 13, 1, 1, lit ? '#fff' : '#bbb'); px(W / 2 + 3, 12, 1, 1, lit ? '#fff' : '#bbb');
    lights.push({ x: W / 2 - 7, y: 7, w: 14, h: 14, kind: 'seal' });
    // entablature with the name
    px(2, py + 4, W - 4, 9, '#1a1a22'); px(2, py + 4, W - 4, 1, '#d8d8e2'); px(2, py + 12, W - 4, 1, '#3a3a46');
    text(g, b.sign, Math.round(W / 2 - textW(b.sign) / 2), py + 6, '#ececf4');
    // columns, banners, the lit interior
    var cy0 = py + 13; px(4, cy0, W - 8, baseY - cy0, 'rgba(210,210,226,.12)');
    for (var c = 0; c < 7; c++) { var cx1 = 6 + c * Math.floor((W - 16) / 6); px(cx1, cy0, 4, baseY - cy0, '#24242e'); px(cx1, cy0, 1, baseY - cy0, '#c8c8d4'); px(cx1 + 3, cy0, 1, baseY - cy0, '#0e0e14'); px(cx1 - 1, cy0, 6, 2, '#3a3a46'); px(cx1 - 1, baseY - 2, 6, 2, '#3a3a46'); }
    for (var bn = 0; bn < 6; bn++) if (bn !== 2 && bn !== 3) { var bx = 12 + bn * Math.floor((W - 16) / 6); px(bx, cy0 + 2, 5, 16, bn % 2 ? '#3a3a46' : '#5a5a66'); px(bx + 1, cy0 + 18, 1, 2, '#5a5a66'); px(bx + 3, cy0 + 18, 1, 2, '#5a5a66'); px(bx + 2, cy0 + 6, 1, 5, '#d0d0dc'); }
    // a missing column, the decline even here
    if (!lit) { var mc = 6 + 5 * Math.floor((W - 16) / 6); px(mc - 1, cy0 + 8, 6, 14, '#030305'); }
    var dx = b.door * TS + 2; px(dx, baseY - 18, 12, 18, '#050508'); px(dx - 1, baseY - 19, 14, 1, '#ffffff'); px(dx + 5, baseY - 18, 1, 18, '#3a3a46');
    for (var s = 0; s < 3; s++) px(s * 2, baseY + s * 3, W - s * 4, 3, s % 2 ? '#1a1a22' : '#26262f'), px(s * 2, baseY + s * 3, W - s * 4, 1, '#8a8a96');
  }
  // SENTINEL: a fortress keep with battlements, a shield, slit windows and a searchlight
  function keep(g, W, Ht, Hf, b, lights) {
    var px = P(g), t0 = 10, mx = 8, kw = W - mx * 2;
    // side walls
    px(0, Ht - 40, mx + 2, 40, '#15151c'); px(W - mx - 2, Ht - 40, mx + 2, 40, '#15151c'); px(0, Ht - 40, mx + 2, 1, '#9a9aa6'); px(W - mx - 2, Ht - 40, mx + 2, 1, '#9a9aa6');
    for (var m = 0; m < 2; m++) { px(1 + m * 5, Ht - 44, 3, 4, '#1f1f27'); px(W - 4 - m * 5, Ht - 44, 3, 4, '#1f1f27'); }
    // the keep tower
    px(mx, t0, kw, Ht - t0, '#17171e');
    for (var y = t0 + 4; y < Ht; y += 4) { px(mx, y, kw, 1, '#0e0e13'); for (var x = mx + ((y / 4) % 2 ? 3 : 7); x < mx + kw; x += 8) px(x, y - 3, 1, 3, '#0e0e13'); }
    px(mx, t0, 2, Ht - t0, '#8a8a96'); px(mx + kw - 2, t0, 2, Ht - t0, '#08080b');
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(mx + kw * .6, t0, kw * .4, Ht - t0);
    // battlements
    for (var c = 0; c < kw; c += 6) { px(mx + c, t0 - 5, 4, 5, '#1d1d25'); px(mx + c, t0 - 5, 4, 1, '#b0b0bc'); }
    px(mx, t0, kw, 1, '#c8c8d4');
    // searchlight mount
    px(W / 2 - 3, t0 - 9, 6, 4, '#2a2a34'); px(W / 2 - 3, t0 - 9, 6, 1, '#e8e8f0'); lights.push({ x: W / 2, y: t0 - 8, kind: 'search' });
    // slit windows
    for (var r = 0; r < 3; r++) for (var s = 0; s < 3; s++) { var wx = mx + 10 + s * Math.floor((kw - 24) / 2), wy = t0 + 12 + r * 18; px(wx, wy, 3, 9, '#060609'); px(wx + 1, wy + 1, 1, 7, (r + s) % 2 ? '#dcdce6' : '#4a4a56'); }
    // the shield with a lock
    var sx = W / 2, sy = t0 + 26;
    for (var k = 0; k < 20; k++) { var hw = k < 12 ? 9 : 9 - (k - 11) * 1.1; px(sx - hw, sy + k, hw * 2, 1, '#22222c'); px(sx - hw, sy + k, 1, 1, '#d0d0dc'); px(sx + hw - 1, sy + k, 1, 1, '#5a5a66'); }
    px(sx - 3, sy + 7, 6, 5, '#e4e4ee'); px(sx - 2, sy + 4, 1, 3, '#e4e4ee'); px(sx + 1, sy + 4, 1, 3, '#e4e4ee'); px(sx - 1, sy + 3, 2, 1, '#e4e4ee'); px(sx - 1, sy + 9, 2, 2, '#22222c');
    // gate with a portcullis
    var dx = b.door * TS + 1; px(dx - 2, Ht - 22, 18, 22, '#050508'); px(dx - 2, Ht - 23, 18, 1, '#d0d0dc');
    for (var p2 = 0; p2 < 18; p2 += 3) px(dx - 2 + p2, Ht - 22, 1, 14, '#4a4a56'); px(dx - 2, Ht - 16, 18, 1, '#4a4a56');
    sign(g, px, b.sign, W / 2, Ht - 32, 1, true);
  }
  function turret(g, W, Ht, Hf, b, lights) {
    var px = P(g), tw = W - 10, x0 = 5;
    px(x0, 8, tw, Ht - 8, '#17171e'); px(x0, 8, 2, Ht - 8, '#8a8a96'); px(x0 + tw - 2, 8, 2, Ht - 8, '#08080b');
    for (var y = 12; y < Ht; y += 4) px(x0, y, tw, 1, '#0e0e13');
    for (var c = 0; c < tw; c += 5) { px(x0 + c, 4, 3, 4, '#1d1d25'); px(x0 + c, 4, 3, 1, '#b0b0bc'); }
    g.strokeStyle = '#c0c0cc'; g.beginPath(); g.arc(W / 2, 2, 6, 0, Math.PI); g.stroke(); px(W / 2 - .5, 0, 1, 6, '#8a8a96');
    px(W / 2 - 2, 20, 4, 9, '#060609'); px(W / 2 - 1, 21, 2, 7, '#cfcfda'); lights.push({ x: W / 2 - 1, y: 1, kind: 'blink', ph: b.seed });
  }
  // exit_0's proving rooms: concrete blocks with a terminal for a window
  function lab(g, W, Ht, Hf, b, lights) {
    var px = P(g);
    px(0, 4, W, Ht - 4, '#15151b'); px(0, 4, W, 1, '#a0a0ac'); px(0, 4, 1, Ht - 4, '#6a6a76'); px(W - 1, 4, 1, Ht - 4, '#050508');
    for (var s = 0; s < W; s += 6) { px(s, 6, 3, 3, '#d0d0da'); px(s + 3, 6, 3, 3, '#1a1a20'); }   // hazard stripes
    px(4, 12, W - 8, 22, '#050507'); px(4, 12, W - 8, 1, '#8a8a96'); px(4, 33, W - 8, 1, '#3a3a46');
    text(g, '$ EXIT 0', 8, 16, '#e4e4ee'); text(g, b.sign, 8, 24, '#9a9aa8');
    lights.push({ x: 8 + textW('$ EXIT 0') + 2, y: 16, kind: 'cursor' });
    for (var v = 0; v < 3; v++) px(W - 14 + v * 4, 38, 2, 6, '#0c0c10');
    var dx = b.door * TS + 3; px(dx, Ht - 13, 10, 13, '#050508'); px(dx - 1, Ht - 14, 12, 1, '#ffffff');
  }
  // the server core: a cylinder ringed with light
  function core(g, W, Ht, Hf, b, lights, lit) {
    var px = P(g), x0 = 6, cw = W - 12;
    for (var x = 0; x < cw; x++) { var k = x / cw, sh = Math.round(18 + 26 * Math.sin(Math.PI * Math.min(.95, k * 1.4))); px(x0 + x, 8, 1, Ht - 22, 'rgb(' + sh + ',' + sh + ',' + (sh + 8) + ')'); }
    g.fillStyle = '#1f1f28'; g.beginPath(); g.ellipse(W / 2, 8, cw / 2, 5, 0, 0, 7); g.fill(); g.strokeStyle = '#c8c8d4'; g.beginPath(); g.ellipse(W / 2, 8, cw / 2, 5, 0, 0, 7); g.stroke();
    for (var r = 0; r < 4; r++) { var y = 20 + r * 13; g.strokeStyle = r === 2 && !lit ? '#2a2a34' : 'rgba(236,236,246,.8)'; g.beginPath(); g.ellipse(W / 2, y, cw / 2, 4, 0, 0, Math.PI); g.stroke(); lights.push({ x: x0, y: y, w: cw, kind: 'ring', ph: r }); }
    px(0, Ht - 14, W, 14, '#0e0e13'); px(0, Ht - 14, W, 1, '#9a9aa6');
    for (var c = 0; c < 5; c++) px(4 + c * 18, Ht - 14, 2, 14, '#22222b');
    var dx = b.door * TS + 3; px(dx, Ht - 13, 10, 13, '#050508'); px(dx - 1, Ht - 14, 12, 1, '#ffffff');
    sign(g, px, b.sign, W / 2, Ht - 24, 1, true);
  }
  function rack(g, W, Ht, Hf, b, lights) {
    var px = P(g);
    px(0, 2, W, 3, '#22222b'); px(0, 2, W, 1, '#7a7a86');   // cable tray
    for (var x = 0; x < W; x += 12) {
      px(x + 1, 5, 11, Ht - 6, '#101015'); px(x + 1, 5, 1, Ht - 6, '#5a5a66'); px(x + 11, 5, 1, Ht - 6, '#050508');
      for (var y = 8; y < Ht - 3; y += 3) px(x + 3, y, 7, 1, '#1d1d25');
      lights.push({ x: x + 3, y: 8, w: 7, h: Ht - 12, kind: 'leds', ph: x });
    }
  }
  function stall(g, W, Ht, Hf, b, lights) {
    var px = P(g), rnd = R(b.seed);
    px(1, 4, W - 2, 6, '#2a2a34'); for (var s = 1; s < W - 1; s += 6) px(s, 4, 3, 6, '#c8c8d2');   // striped awning
    for (var sc = 1; sc < W - 1; sc += 4) px(sc, 10, 2, 2, s % 2 ? '#8a8a96' : '#5a5a66');
    px(3, 10, 1, Ht - 10, '#5a5a66'); px(W - 4, 10, 1, Ht - 10, '#5a5a66');
    px(1, Ht - 10, W - 2, 10, '#16161d'); px(1, Ht - 10, W - 2, 1, '#a0a0ac');
    for (var c = 0; c < 3; c++) { var cx1 = 6 + Math.floor(rnd() * (W - 14)); px(cx1, Ht - 16, 6, 6, '#26262f'); px(cx1, Ht - 16, 6, 1, '#6a6a76'); }
    lights.push({ x: Math.floor(W / 2) - 6, y: 0, w: 12, h: 4, kind: 'tag', ph: b.seed });
  }
  // the Lift's boarding gates: an arch, a departures board, turnstiles and queue ropes
  function gate(g, W, Ht, Hf, b, lights) {
    var px = P(g);
    px(3, 4, W - 6, Ht - 4, '#0e0e14'); px(3, 4, W - 6, 1, '#d8d8e2'); px(3, 4, 2, Ht - 4, '#8a8a96'); px(W - 5, 4, 2, Ht - 4, '#2a2a34');
    g.strokeStyle = '#c0c0cc'; g.beginPath(); g.ellipse(W / 2, 14, W / 2 - 6, 9, 0, Math.PI, 0); g.stroke();
    text(g, 'BOARDING', Math.round(W / 2 - textW('BOARDING') / 2), 8, '#ececf4');
    px(8, 16, W - 16, 15, '#040406'); px(8, 16, W - 16, 1, '#6a6a76');
    text(g, 'SEATS', 11, 19, '#9a9aa8'); text(g, '0', W - 15, 19, '#ffffff'); text(g, 'NEXT LIFT', 11, 25, '#5a5a66');
    lights.push({ x: 8, y: 16, w: W - 16, h: 15, kind: 'board' });
    for (var t = 0; t < 3; t++) { var tx = 9 + t * Math.floor((W - 18) / 3); px(tx, Ht - 22, 4, 16, '#22222b'); px(tx, Ht - 22, 4, 1, '#e8e8f0'); px(tx + 4, Ht - 16, 9, 2, '#5a5a66'); px(tx + 1, Ht - 20, 2, 2, '#ffffff'); lights.push({ x: tx + 1, y: Ht - 20, kind: 'blink', ph: t * 2 }); }
    for (var q = 4; q < W - 4; q += 10) { px(q, Ht - 6, 2, 6, '#8a8a96'); px(q, Ht - 6, 2, 1, '#ffffff'); if (q + 10 < W - 4) for (var rr = 0; rr < 10; rr++) px(q + 1 + rr, Ht - 5 + Math.round(Math.sin(rr / 10 * Math.PI) * 2), 1, 1, '#6a6a76'); }
  }
  // a palm house: a glass dome and two curved wings, some panes reclaimed
  function glasshouse(g, W, Ht, Hf, b, lights) {
    var px = P(g), cxD = W / 2, base = Ht - 16;
    g.fillStyle = '#0c0d10'; g.fillRect(4, base - 24, W - 8, 24);
    g.beginPath(); g.ellipse(cxD, base - 20, W * .22, 26, 0, Math.PI, 0); g.fill();
    // palms inside, seen through the glass
    for (var p2 = 0; p2 < 5; p2++) { var tx = 12 + p2 * (W - 24) / 4; px(tx, base - 26, 1, 26, '#2a2e34'); g.strokeStyle = '#3a4048'; g.beginPath(); g.moveTo(tx, base - 26); g.lineTo(tx - 6, base - 20); g.moveTo(tx, base - 26); g.lineTo(tx + 6, base - 21); g.stroke(); }
    g.strokeStyle = '#d8dce6'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(cxD, base - 20, W * .22, 26, 0, Math.PI, 0); g.stroke();
    for (var r = 1; r < 6; r++) { g.beginPath(); g.ellipse(cxD, base - 20, W * .22 * r / 6, 26, 0, Math.PI, 0); g.strokeStyle = 'rgba(210,214,226,.35)'; g.stroke(); }
    // wings with curved roofs
    [[4, cxD - W * .22], [cxD + W * .22, W - 4]].forEach(function (w) { g.strokeStyle = '#c8ccd6'; g.beginPath(); g.moveTo(w[0], base - 24); g.quadraticCurveTo((w[0] + w[1]) / 2, base - 36, w[1], base - 24); g.stroke(); for (var m = w[0] + 4; m < w[1]; m += 5) px(m, base - 24, 1, 24, 'rgba(210,214,226,.3)'); });
    px(4, base - 24, W - 8, 1, '#c8ccd6'); for (var y = base - 18; y < base; y += 6) px(4, y, W - 8, 1, 'rgba(210,214,226,.22)');
    // reclaimed panes
    [[18, base - 16], [W - 26, base - 10], [cxD + 6, base - 38]].forEach(function (h) { px(h[0], h[1], 5, 6, '#020203'); });
    reflect(g, 4, base - 46, W - 8, 46, 10);
    px(cxD, base - 50, 1, 6, '#c8ccd6'); lights.push({ x: cxD - 1, y: base - 51, kind: 'blink', ph: 2 });
    px(0, base, W, 16, '#121318'); px(0, base, W, 1, '#c8ccd6');
    for (var s2 = 0; s2 < 3; s2++) px(cxD - 14 + s2 * 2, Ht - 4 + s2, 28 - s2 * 4, 1, '#3a3a46');
    px(cxD - 6, base + 2, 12, 14, '#050507'); px(cxD - 7, base + 1, 14, 1, '#ffffff');
    text(g, 'PALM HOUSE', Math.round(cxD - textW('PALM HOUSE') / 2), base + 5 - 12, '#ececf4');
  }
  // something the Quiet half-erased: the bottom still rendered, the top only a wireframe
  function ruin(g, W, Ht, Hf, b, lights) {
    var px = P(g), rnd = R(b.seed || 4), solidTop = Math.floor(Ht * .55);
    px(2, solidTop, W - 4, Ht - solidTop, '#121219'); windows(px, rnd, 4, solidTop + 2, W - 8, Ht - solidTop - 6, { lit: .15, dead: .4 });
    px(2, solidTop, 1, Ht - solidTop, '#9a9aa8');
    g.strokeStyle = 'rgba(220,220,236,.6)'; g.lineWidth = 1; g.strokeRect(2.5, 4.5, W - 5, solidTop - 4);
    for (var y = 10; y < solidTop; y += 6) { g.beginPath(); g.moveTo(2.5, y + .5); g.lineTo(W - 2.5, y + .5); g.strokeStyle = 'rgba(200,200,220,.25)'; g.stroke(); }
    for (var x = 8; x < W - 4; x += 8) { g.beginPath(); g.moveTo(x + .5, 4.5); g.lineTo(x + .5, solidTop); g.stroke(); }
    // the edge where rendering stops, shedding pixels upward
    for (var k = 0; k < 24; k++) px(2 + Math.floor(rnd() * (W - 4)), solidTop - Math.floor(rnd() * 14), 1 + (k % 2), 1, rnd() > .5 ? '#5a5a66' : '#2a2a34');
  }
  // the Lift station and its tether, rising out of sight
  function tether(g, W, Ht, Hf, b, lights) {
    var px = P(g), cx0 = W / 2, st = Ht - Hf;
    g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(cx0 - 14, 0, 28, st);
    px(cx0 - 4, 0, 8, st + 6, '#1a1a22'); px(cx0 - 4, 0, 1, st + 6, '#e8e8f0'); px(cx0 + 3, 0, 1, st + 6, '#5a5a66');
    for (var y = 0; y < st; y += 10) px(cx0 - 6, y, 12, 1, '#6a6a76');
    lights.push({ x: cx0 - 3, y: 0, h: st, kind: 'tether' });
    // the station: a glass atrium
    g.fillStyle = '#101017'; g.beginPath(); g.moveTo(4, Ht - 8); g.lineTo(W - 4, Ht - 8); g.lineTo(W - 18, st + 8); g.lineTo(18, st + 8); g.fill();
    g.strokeStyle = '#d0d0dc'; g.beginPath(); g.moveTo(4.5, Ht - 8); g.lineTo(18.5, st + 8.5); g.lineTo(W - 18.5, st + 8.5); g.lineTo(W - 4.5, Ht - 8); g.stroke();
    for (var m = 22; m < W - 20; m += 8) px(m, st + 10, 1, Ht - st - 18, 'rgba(200,200,214,.25)');
    reflect(g, 4, st + 8, W - 8, Ht - st - 16, 4);
    px(0, Ht - 8, W, 8, '#0d0d13'); px(0, Ht - 8, W, 1, '#e0e0ea');
    text(g, 'THE LIFT', Math.round(cx0 - textW('THE LIFT') / 2), Ht - 22, '#f2f2f8');
  }

  var PAINT = { tower: tower, home: home, spire: spire, archive: archiveDome, ledger: ledger, keep: keep, turret: turret, lab: lab, core: core, rack: rack, stall: stall, gate: gate, tether: tether, glasshouse: glasshouse, ruin: ruin };

  /* ---------- the sky beyond the walls ---------- */
  function paintSky(g, theme, w, pad) {
    var px = P(g);
    var sk = g.createLinearGradient(0, 0, 0, pad); sk.addColorStop(0, '#020203'); sk.addColorStop(1, theme === 'undercroft' ? '#0a0a0d' : '#14141b'); g.fillStyle = sk; g.fillRect(0, 0, w, pad);
    if (theme === 'undercroft') {   // underground: a ceiling of pipes and cable
      for (var p = 0; p < 4; p++) { var y = 6 + p * Math.floor(pad / 5); px(0, y, w, 3, '#16161c'); px(0, y, w, 1, '#4a4a56'); }
      for (var c = 0; c < w; c += 23) { px(c, 0, 2, pad, '#101015'); px(c, 0, 1, pad, '#2a2a34'); }
      return;
    }
    if (theme !== 'quiet') for (var s = 0; s < w / 9; s++) px(hs(s * 3.1) * w, hs(s * 7.7) * pad * .6, 1, 1, 'rgba(236,236,246,' + (.15 + hs(s) * .5) + ')');
    if (theme === 'quiet') { for (var q = 0; q < w / 6; q++) px(hs(q * 2.3) * w, hs(q * 5.1) * pad, 1, 1, 'rgba(200,200,214,' + hs(q) * .4 + ')'); return; }
    // the skyline of the rest of the city, mostly dark now
    var far = theme === 'gardens' ? 6 : 14;
    for (var b = 0; b * far < w + 20; b++) {
      var bw = 8 + hs(b * 3) * 16, bh = pad * (.25 + hs(b * 7) * .55), bx = b * far * 1.6 - 6, lit = hs(b * 11) > .55;
      if (theme === 'gardens') { g.strokeStyle = 'rgba(200,206,218,.18)'; g.beginPath(); g.moveTo(bx, pad); g.quadraticCurveTo(bx + 30, pad - 40 - hs(b) * 20, bx + 60, pad); g.stroke(); continue; }
      px(bx, pad - bh, bw, bh, '#0c0c12'); px(bx, pad - bh, 1, bh, lit ? 'rgba(220,220,236,.4)' : 'rgba(80,80,92,.25)');
      if (lit) for (var wy = pad - bh + 3; wy < pad - 2; wy += 4) for (var wx = bx + 3; wx < bx + bw - 2; wx += 3) if (hs(wx * 3 + wy) > .82) px(wx, wy, 1, 1, 'rgba(230,230,242,.45)');
    }
    // the Lift, rising Upstream on the horizon
    px(w * .8, 4, 1, pad - 4, 'rgba(236,236,246,.25)');
  }

  /* ---------- paint a whole district ---------- */
  function paintArea(area, map, litFn) {
    var W = map[0].length, H = map.length, need = 0;
    (area.blds || []).forEach(function (b) { if (b.w) need = Math.max(need, (b.rise || 0) - b.y); });
    var pad = Math.max(4, need + 1) * TS;
    var base = mk(W * TS, H * TS + pad), over = mk(W * TS, H * TS + pad), g = base.getContext('2d'), o = over.getContext('2d'), lights = [];
    paintSky(g, area.theme, W * TS, pad);
    g.translate(0, pad); o.translate(0, pad);
    paintGround(g, map, area.theme, W, H, o);
    (area.blds || []).forEach(function (b) {
      if (!b.w || !PAINT[b.kind]) return;
      var Wp = b.w * TS, Hf = b.h * TS, rise = (b.rise || 0) * TS, Ht = Hf + rise, c = mk(Wp, Ht), cg = c.getContext('2d'), L = [];
      PAINT[b.kind](cg, Wp, Ht, Hf, b, L, litFn ? litFn(b) : true);
      var X = b.x * TS, Y = b.y * TS;
      g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(X + 4, Y + Hf, Wp, 4); g.fillRect(X + Wp, Y + 6, 4, Hf - 2);
      g.drawImage(c, 0, rise, Wp, Hf, X, Y, Wp, Hf);
      if (rise) o.drawImage(c, 0, 0, Wp, rise, X, Y - rise, Wp, rise);
      L.forEach(function (l) { l.x += X; l.y += Y - rise; l.over = l.y < Y; lights.push(l); });
    });
    var riseRects = (area.blds || []).filter(function (b) { return b.w && b.rise; }).map(function (b) { return { x: b.x * TS, y: (b.y - b.rise) * TS, w: b.w * TS, h: b.rise * TS }; });
    return { base: base, over: over, lights: lights, W: W, H: H, pad: pad, rises: riseRects };
  }

  /* ---------- things that move ---------- */
  function live(c, area, map, t, cam, st, layer) {
    var W = map[0].length, H = map.length, x0 = Math.max(0, Math.floor(cam.x / TS) - 1), y0 = Math.max(0, Math.floor(cam.y / TS) - 1), x1 = Math.min(W, x0 + 23), y1 = Math.min(H, y0 + 14), th = area.theme;
    function tile(x, y) { return (map[y] || '')[x] || '~'; }
    function px(x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x - cam.x), Math.round(y - cam.y), w, h); }
    if (layer === 'under') {
      for (var y = y0; y < y1; y++) for (var x = x0; x < x1; x++) {
        var tl = tile(x, y), X = x * TS, Y = y * TS;
        if (tl === ',' && th !== 'undercroft') { if (hs(x * 3 + y * 5 + Math.floor(t * 6)) > .55) px(X + Math.floor(hs(x + y + Math.floor(t * 8)) * 14), Y + Math.floor(hs(x * 2 + y + Math.floor(t * 8)) * 14), 2, 1, 'rgba(210,210,224,' + (.25 + hs(x * y + Math.floor(t * 4)) * .4) + ')'); }
        else if (tl === 'l') { c.fillStyle = 'rgba(236,236,244,.07)'; c.beginPath(); c.ellipse(X + 8 - cam.x, Y + 15 - cam.y, 12, 4, 0, 0, 7); c.fill(); px(X + 5, Y + 2, 6, 1, 'rgba(255,255,255,' + (.6 + .3 * Math.sin(t * 3 + x)) + ')'); }
        else if (tl === 's') { var bob = Math.round(Math.sin(t * 2 + x) * 1); px(X + 1, Y - 1 + bob, 14, 9, 'rgba(210,210,224,' + (Math.random() < .04 ? .12 : .3) + ')'); px(X + 1, Y - 1 + bob, 14, 1, 'rgba(255,255,255,.8)'); px(X + 3, Y + 2 + bob, 9, 1, 'rgba(255,255,255,.7)'); px(X + 3, Y + 4 + bob, 6, 1, 'rgba(255,255,255,.7)'); }
        else if (tl === 'o') { var read = st.readLog(x, y), a2 = read ? .25 : .55 + .35 * Math.sin(t * 3 + x); px(X + 6, Y + 3 + Math.round(Math.sin(t * 2 + y) * 1.5), 4, 8, 'rgba(240,240,248,' + a2 + ')'); px(X + 7, Y + 2 + Math.round(Math.sin(t * 2 + y) * 1.5), 2, 10, 'rgba(255,255,255,' + a2 * .8 + ')'); if (!read) { c.fillStyle = 'rgba(255,255,255,.06)'; c.beginPath(); c.arc(X + 8 - cam.x, Y + 7 - cam.y, 8, 0, 7); c.fill(); } }
        else if (tl === 'c') { if (st.opened(x, y)) { px(X + 2, Y + 5, 12, 4, '#0a0a0e'); px(X + 2, Y + 5, 12, 1, '#3a3a46'); } else { px(X + 7, Y + 7, 2, 3, 'rgba(255,255,255,' + (.5 + .5 * Math.sin(t * 4 + x)) + ')'); } }
        else if (tl === 'E') { var ph = (t * 1.5 + x * .3 + y * .3) % 1; px(X + 4, Y + 4 + Math.floor(ph * 8), 8, 1, 'rgba(236,236,244,' + (.35 * (1 - ph)) + ')'); }
        else if (tl === 'G') { var open = st.gateOpen(x, y); for (var fb = 0; fb < 3; fb++) px(X + 4 + fb * 3, Y, 1, TS, 'rgba(230,230,240,' + (open ? .08 : .25 + .3 * Math.abs(Math.sin(t * 3 + fb))) + ')'); if (!open) px(X + 3, Y + Math.floor((t * 20) % 15), 10, 1, 'rgba(255,255,255,.5)'); }
        else if (tl === '~' && th === 'undercroft') { px(X + ((Math.floor(t * 10) + x * 5) % 16), Y + 6 + (x % 3), 4, 1, 'rgba(200,200,220,.25)'); }
        else if (tl === '~' && th === 'gardens') { if (hs(x + y * 3 + Math.floor(t * 2)) > .7) px(X + Math.floor(hs(x * 7 + Math.floor(t)) * 12), Y + 8, 4, 1, 'rgba(200,210,224,.2)'); }
        else if (tl === '=' && (th === 'plaza' || th === 'commons' || th === 'halflight') && (x + y) % 5 === 0) { var u = (t * .7 + x * .13) % 1; if (tile(x + 1, y) === '=' || tile(x - 1, y) === '=') px(X + Math.floor(u * 14), Y + 7, 3, 2, 'rgba(245,245,250,.6)'); else px(X + 7, Y + Math.floor(u * 14), 2, 3, 'rgba(245,245,250,.6)'); }
      }
      // fountain: water renders once every eleven seconds
      if (th === 'plaza') { var fT = (t % 11); if (fT < 1.2) { var fx = 14 * TS, fy = 12 * TS; for (var d = 0; d < 14; d++) { var a = d / 14 * Math.PI, r = fT * 30; px(fx + 32 + Math.cos(a) * r * .9, fy + 6 + (1 - Math.sin(a)) * fT * 14, 1, 2, 'rgba(230,236,248,' + (1 - fT / 1.2) + ')'); } } px(14 * TS + 31, 12 * TS + 2, 2, 1, '#f0f0f6'); }
    }
    // lights painted onto buildings
    st.lights.forEach(function (l) {
      if ((layer === 'over') !== !!l.over && l.kind !== 'search' && l.kind !== 'tether') return;
      if (l.kind === 'search' && layer !== 'over') return; if (l.kind === 'tether' && layer !== 'over') return;
      var lx = l.x - cam.x, ly = l.y - cam.y; if (lx < -80 || lx > 400 || ly < -200 || ly > 260) return;
      if (l.kind === 'blink') { if (Math.floor(t * 1.5 + l.ph) % 2 === 0) { px(l.x, l.y, 2, 2, '#ffffff'); px(l.x - 2, l.y - 2, 6, 6, 'rgba(255,255,255,.15)'); } }
      else if (l.kind === 'beacon') { var on = st.signal; if (on || Math.floor(t * 2) % 3 === 0) { px(l.x, l.y, 2, 2, '#ffffff'); c.fillStyle = 'rgba(255,255,255,' + (on ? .25 : .1) + ')'; c.beginPath(); c.arc(l.x + 1 - cam.x, l.y + 1 - cam.y, on ? 7 + Math.sin(t * 4) * 2 : 4, 0, 7); c.fill(); } }
      else if (l.kind === 'pin') { var a3 = .3 + .7 * Math.max(0, Math.sin(t * 2 + l.ph * 1.3)); px(l.x, l.y, 5, 5, 'rgba(255,255,255,' + a3 * .25 + ')'); }
      else if (l.kind === 'holo') { var k2 = Math.floor(t * 3) % 5; px(l.x + 2, l.y + 3 + k2 * 4, 3, 2, '#ffffff'); if (Math.random() < .03) px(l.x, l.y, l.w, l.h, 'rgba(255,255,255,.2)'); }
      else if (l.kind === 'seal') { if (st.isLit('ledger')) { c.fillStyle = 'rgba(255,255,255,' + (.12 + .08 * Math.sin(t * 2)) + ')'; c.beginPath(); c.arc(l.x + 7 - cam.x, l.y + 7 - cam.y, 9, 0, 7); c.fill(); } }
      else if (l.kind === 'search') { var ang = Math.sin(t * .8) * .9 + Math.PI / 2; c.fillStyle = 'rgba(255,255,255,.06)'; c.beginPath(); c.moveTo(l.x - cam.x, l.y - cam.y); c.lineTo(l.x - cam.x + Math.cos(ang - .12) * 140, l.y - cam.y + Math.sin(ang - .12) * 140); c.lineTo(l.x - cam.x + Math.cos(ang + .12) * 140, l.y - cam.y + Math.sin(ang + .12) * 140); c.fill(); px(l.x - 1, l.y - 1, 3, 2, '#ffffff'); }
      else if (l.kind === 'cursor') { if (Math.floor(t * 2) % 2) px(l.x, l.y, 3, 5, '#ffffff'); }
      else if (l.kind === 'ring') { var b2 = .2 + .8 * Math.max(0, Math.sin(t * 3 - l.ph)); px(l.x + l.w / 2 - 3, l.y + 3, 6, 1, 'rgba(255,255,255,' + b2 + ')'); }
      else if (l.kind === 'leds') { for (var q = 0; q < 6; q++) if (hs(l.ph + q * 7 + Math.floor(t * (3 + q))) > .55) px(l.x + (q % 3) * 3, l.y + Math.floor(q / 3) * 6 + Math.floor(hs(q + l.ph) * (l.h - 8)), 1, 1, '#ffffff'); }
      else if (l.kind === 'tag') { var bob2 = Math.round(Math.sin(t * 2 + l.ph) * 1); px(l.x, l.y - 6 + bob2, l.w, 5, 'rgba(220,220,236,.3)'); px(l.x, l.y - 6 + bob2, l.w, 1, 'rgba(255,255,255,.8)'); px(l.x + 2, l.y - 4 + bob2, 5, 1, 'rgba(255,255,255,.8)'); }
      else if (l.kind === 'bill') { if (Math.random() < .02) px(l.x, l.y, l.w, l.h, 'rgba(0,0,0,.7)'); else { var sy2 = Math.floor((t * 8 + l.ph) % l.h); px(l.x, l.y + sy2, l.w, 1, 'rgba(255,255,255,.18)'); } }
      else if (l.kind === 'board') { if (Math.floor(t * 1.2) % 2) px(l.x + 2, l.y + 9, l.w - 4, 1, '#ffffff'); }
      else if (l.kind === 'tether') {
        var stt = st.tether;   // 'up', 'cut' or 'down'
        if (stt === 'cut') { px(l.x - 1, l.y, 8, l.h - 30, '#000'); return; }
        for (var p = 0; p < 6; p++) { var u2 = ((t * (stt === 'down' ? -.12 : .12) + p / 6) % 1 + 1) % 1, cy = l.y + l.h - u2 * l.h; px(l.x - 1, cy, 8, 5, '#e8e8f0'); px(l.x, cy + 1, 6, 1, '#3a3a46'); }
        c.fillStyle = 'rgba(255,255,255,' + (.05 + .03 * Math.sin(t * 3)) + ')'; c.fillRect(l.x - 10 - cam.x, l.y - cam.y, 26, l.h);
      }
    });
    if (layer === 'over') {
      // weather, by district
      if (th === 'gardens') for (var i = 0; i < 18; i++) { var life = (t * .06 + hs(i * 5)) % 1; px(hs(i * 17) * 320 + cam.x + Math.sin(t + i) * 6, cam.y + life * 190, 1, 1, 'rgba(230,236,244,' + (.5 * (1 - life)) + ')'); }
      else if (th === 'undercroft') for (var v = 0; v < 6; v++) { var lf = (t * .4 + hs(v)) % 1; px(cam.x + hs(v * 9) * 320 + Math.sin(t * 2 + v) * 3, cam.y + 180 - lf * 120, 3, 3, 'rgba(200,200,214,' + .12 * (1 - lf) + ')'); }
      else if (th === 'quiet') for (var q2 = 0; q2 < 30; q2++) { var l2 = (t * .1 + hs(q2 * 3)) % 1; px(cam.x + hs(q2 * 11) * 320, cam.y + 180 - l2 * 200, q2 % 4 ? 1 : 2, 1, 'rgba(220,220,232,' + .6 * (1 - l2) + ')'); }
      else for (var j = 0; j < 14; j++) { var lj = (t * .12 + hs(j * 5)) % 1; px(cam.x + hs(j * 17) * 320 + Math.sin(t + j) * 4, cam.y + 180 - lj * 200, j % 3 ? 1 : 2, j % 3 ? 1 : 2, 'rgba(210,210,224,' + (.45 * (1 - lj)) + ')'); }
    }
  }

  /* ---------- people ---------- */
  // echoes of residents are translucent and flicker; Wren is a hologram on a pad; Ash is solid and armored
  function person(c, X, Y, o, t) {
    var px = function (x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(X + x), Math.round(Y + y), w, h); };
    var hgt = o.look === 'kid' ? 10 : (o.h || 13), top = 15 - hgt, alpha = o.look === 'warden' || o.solid ? 1 : (o.fade != null ? o.fade : .72);
    if (o.flick && Math.random() < .08) alpha *= .3;
    if (o.look === 'drone') {
      var by = Math.round(Math.sin(t * 3) * 1.5);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(X + 8, Y + 15, 5, 1.5, 0, 0, 7); c.fill();
      px(3, 4 + by, 10, 6, '#2a2a34'); px(3, 4 + by, 10, 1, '#c0c0cc'); px(6, 6 + by, 4, 2, Math.floor(t * 2) % 2 ? '#ffffff' : '#6a6a76'); px(1, 6 + by, 2, 1, '#6a6a76'); px(13, 6 + by, 2, 1, '#6a6a76'); px(7, 10 + by, 2, 2, '#3a3a46');
      return;
    }
    c.fillStyle = o.look === 'holo' ? 'rgba(220,220,236,.25)' : 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(X + 8, Y + 15, 6, 2, 0, 0, 7); c.fill();
    c.save(); c.globalAlpha = alpha;
    var skin = '#c8c8d2', cloth = ['#6a6a78', '#8a8a96', '#4a4a58', '#9a9aa8', '#5a5a68', '#7a8078', '#5a5a5a', '#8a7e70'][o.hair || 0];
    if (o.look === 'holo') { skin = '#e0e0ee'; cloth = '#b0b0c8'; }
    if (o.look === 'warden') { skin = '#b8b8c4'; cloth = '#3a3a46'; }
    var hw = o.look === 'kid' ? 5 : 6, hx = 8 - hw / 2;
    px(hx, top, hw, 5, skin); px(hx, top, hw, 2, o.look === 'warden' ? '#8a8a96' : '#2a2a32');   // head and hair
    px(hx + 1, top + 3, 1, 1, '#3a3a46'); px(hx + hw - 2, top + 3, 1, 1, '#3a3a46');
    var bw = o.look === 'kid' ? 6 : 8, bx = 8 - bw / 2, bt = top + 5, bh = hgt - 8;
    px(bx, bt, bw, bh, cloth); px(bx, bt, 1, bh, 'rgba(255,255,255,.3)');
    if (o.look === 'warden') { px(bx - 1, bt, bw + 2, 2, '#9a9aa8'); px(bx + 2, bt + 2, bw - 4, 3, '#d0d0dc'); px(bx + bw, bt + 1, 2, bh + 2, '#6a6a76'); }
    px(bx + 1, bt + bh, 2, 3, '#3a3a46'); px(bx + bw - 3, bt + bh, 2, 3, '#3a3a46');
    if (o.look === 'echo' || o.look === 'holo' || o.look === 'kid') { c.globalAlpha = 1; c.fillStyle = 'rgba(8,8,12,.45)'; for (var s = top; s < 15; s += 2) c.fillRect(X + bx - 1, Y + s, bw + 2, 1); }
    c.restore();
    if (o.look === 'holo') { c.fillStyle = 'rgba(220,220,236,.18)'; c.fillRect(X + 3, Y + top - 1, 10, hgt + 1); }
  }
  function wagon(c, X, Y, t) {
    var px = function (x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(X + x), Math.round(Y + y), w, h); };
    c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(X + 16, Y + 15, 15, 2.5, 0, 0, 7); c.fill();
    px(2, 4, 28, 9, '#1a1a22'); px(2, 4, 28, 1, '#c0c0cc'); px(2, 4, 1, 9, '#8a8a96');
    for (var b = 0; b < 8; b++) px(4 + b * 3, 5 + (b % 3), 2, 7 - (b % 3), ['#d8d8e2', '#8a8a96', '#b0b0bc', '#5a5a66'][b % 4]);
    px(4, 13, 4, 3, '#3a3a46'); px(24, 13, 4, 3, '#3a3a46'); px(5, 14, 2, 1, '#8a8a96'); px(25, 14, 2, 1, '#8a8a96');
    px(29, -4, 1, 8, '#6a6a76'); var fl = .6 + .4 * Math.sin(t * 6) * Math.sin(t * 2.3);
    px(28, -6, 3, 3, 'rgba(255,255,255,' + fl + ')'); c.fillStyle = 'rgba(255,255,255,' + fl * .1 + ')'; c.beginPath(); c.arc(X + 29.5, Y - 4.5, 9, 0, 7); c.fill();
    // Pell, ink on his hands
    px(-6, 1, 6, 5, '#c8c8d2'); px(-6, 1, 6, 2, '#2a2a32'); px(-7, 6, 8, 8, '#7a7268'); px(-6, 14, 2, 2, '#3a3a46'); px(-2, 14, 2, 2, '#3a3a46');
  }

  /* ---------- battle backdrops, by district ---------- */
  function backdrop(cx, theme, t, W, H, hy) {
    function px(x, y, w, h, col) { cx.fillStyle = col; cx.fillRect(Math.round(x), Math.round(y), w, h); }
    var sky = cx.createLinearGradient(0, 0, 0, hy); sky.addColorStop(0, theme === 'undercroft' ? '#020203' : '#040406'); sky.addColorStop(1, theme === 'gardens' ? '#1d2024' : '#1e1e27'); cx.fillStyle = sky; cx.fillRect(0, 0, W, hy);
    if (theme !== 'undercroft') for (var s = 0; s < 22; s++) px(hs(s * 3) * W, hs(s * 7) * (hy - 30), 1, 1, 'rgba(236,236,246,' + (.15 + hs(s) * .4) + ')');
    if (theme === 'undercroft') {
      for (var r = 0; r < 12; r++) { var rx = r * 28 - 6, rh = 30 + hs(r) * 20; px(rx, hy - rh, 22, rh, '#0e0e13'); px(rx, hy - rh, 1, rh, '#3a3a46'); for (var l = 0; l < 6; l++) if (hs(r * 9 + l + Math.floor(t * 3)) > .6) px(rx + 4 + (l % 3) * 5, hy - rh + 6 + Math.floor(l / 3) * 9, 1, 1, '#ffffff'); }
      px(0, 0, W, 10, '#0c0c10'); for (var p = 0; p < W; p += 40) px(p, 0, 3, 18, '#1a1a22');
    } else if (theme === 'gardens') {
      for (var tr = 0; tr < 10; tr++) { var tx = tr * 34 + 6, ty = hy - 18 - hs(tr) * 14; cx.strokeStyle = tr % 2 ? 'rgba(210,216,226,.5)' : 'rgba(120,126,136,.6)'; cx.beginPath(); cx.arc(tx, ty, 12 + hs(tr * 3) * 6, 0, 7); cx.stroke(); px(tx - 1, ty + 8, 2, hy - ty - 8, '#2a2a30'); }
      for (var gl = 0; gl < W; gl += 32) px(gl, 0, 1, hy, 'rgba(200,206,216,.12)');
    } else if (theme === 'bastion') {
      for (var b = 0; b < W; b += 12) { px(b, hy - 26, 12, 26, '#15151c'); px(b, hy - 26, 12, 1, '#6a6a76'); if ((b / 12) % 2 === 0) { px(b + 2, hy - 31, 7, 5, '#15151c'); px(b + 2, hy - 31, 7, 1, '#8a8a96'); } }
      var ang = Math.sin(t * .8) * .8; cx.fillStyle = 'rgba(255,255,255,.05)'; cx.beginPath(); cx.moveTo(W / 2, hy - 30); cx.lineTo(W / 2 + Math.sin(ang - .1) * 200, -20); cx.lineTo(W / 2 + Math.sin(ang + .1) * 200, -20); cx.fill();
    } else if (theme === 'quiet') {
      for (var f = 0; f < 14; f++) { var fx = hs(f * 5) * W, fy = (hs(f * 9) * hy + t * (4 + f % 3)) % hy; px(fx, hy - fy, 6 + (f % 3) * 4, 2, 'rgba(160,160,176,.35)'); }
    } else if (theme === 'terminal') {
      px(W * .62, 0, 10, hy, '#1a1a22'); px(W * .62, 0, 1, hy, '#e8e8f0'); for (var c2 = 0; c2 < 4; c2++) { var cy = hy - ((t * 18 + c2 * 20) % hy); px(W * .62 - 1, cy, 12, 4, '#e8e8f0'); }
      cx.fillStyle = 'rgba(255,255,255,.04)'; cx.fillRect(W * .62 - 14, 0, 38, hy);
    } else {
      var dense = theme === 'halflight' ? 24 : 16;
      for (var sk = 0; sk < dense; sk++) {
        var bw = 8 + hs(sk * 3) * 12, bh = 16 + hs(sk * 7) * (theme === 'halflight' ? 44 : 34), bx2 = sk * (W / dense) - 4, lit = hs(sk * 11) > .45;
        px(bx2, hy - bh, bw, bh, '#101017'); px(bx2, hy - bh, 1, bh, lit ? 'rgba(220,220,236,.45)' : 'rgba(80,80,92,.3)');
        if (lit) for (var wy = hy - bh + 3; wy < hy - 3; wy += 4) if (hs(sk * 13 + wy) > .6) px(bx2 + 3, wy, 1, 1, 'rgba(230,230,242,.4)');
      }
      var ax = W * .7 + ((t * 3) % 80), ay = 14 - ((t * .8) % 10); px(ax, ay, 6, 2, 'rgba(240,240,248,.85)'); px(ax - 9, ay + 1, 9, 1, 'rgba(240,240,248,.25)');
    }
    var fg = cx.createLinearGradient(0, hy, 0, H); fg.addColorStop(0, theme === 'gardens' ? '#17191c' : '#16161d'); fg.addColorStop(1, '#0a0a0e'); cx.fillStyle = fg; cx.fillRect(0, hy, W, H - hy);
    px(0, hy, W, 1, 'rgba(236,236,246,.55)');
    for (var j = -18; j <= 18; j++) { cx.strokeStyle = 'rgba(220,220,236,' + (.16 - Math.abs(j) * .006) + ')'; cx.beginPath(); cx.moveTo(W / 2 + j * 9 + .5, hy); cx.lineTo(W / 2 + j * 34 + .5, H); cx.stroke(); }
    for (var q = 0; q < 9; q++) { var z = (q + (t * .25) % 1) / 9, yz = Math.floor(hy + (H - hy) * z * z) + .5; cx.strokeStyle = 'rgba(220,220,236,' + (.04 + z * .2) + ')'; cx.beginPath(); cx.moveTo(0, yz); cx.lineTo(W, yz); cx.stroke(); }
    cx.fillStyle = '#050507'; [[60, 80, 14], [180, 96, 10], [130, 118, 18], [228, 84, 8]].forEach(function (c3) { cx.fillRect(c3[0], c3[1], c3[2], 1); cx.fillRect(c3[0] + 3, c3[1] + 1, Math.floor(c3[2] / 2), 1); });
  }

  window.MeridianArt = { TS: TS, paintArea: paintArea, live: live, person: person, wagon: wagon, backdrop: backdrop, text: text, textW: textW, hs: hs };
})();
