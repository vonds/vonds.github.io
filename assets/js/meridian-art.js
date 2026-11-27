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
      if (t === '~') { if (!voidX(px, theme, X, Y, x, y, tile)) paintVoid(px, theme, X, Y, x, y, tile); continue; }
      if (floorX(px, theme, X, Y, x, y, tile)) { /* themed floor */ } else
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
      if (t === '=') { if (!roadX(px, theme, X, Y, x, y, tile)) paintRoad(px, theme, X, Y, x, y, tile); }
      else if (t === ',') { if (!fieldX(px, theme, X, Y, x, y)) paintField(px, theme, X, Y, x, y); }
      else if (t === 'T') { if (!wallX(px, theme, X, Y, x, y, tile)) paintWall(px, theme, X, Y, x, y, tile); }
      else if (t === 'p') { if (theme === 'upper') paintTopiary(px, g, X, Y, x, y); else paintTree(g, px, X, Y, x, y, ov); }
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
    if (fx >= 0) { if (theme === 'patch') paintBonfire(g, px, fx * TS, fy * TS); else paintFountain(g, px, fx * TS, fy * TS); }
    return fx >= 0 ? [fx * TS, fy * TS] : null;
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

  /* =================== EXPANSION ART =================== */
  THEMES.line = { g0: '#0d0d12', g1: '#1a1a22', dot: '#2a2a34', road: '#16161c', edge: '#9a9aa6' };
  THEMES.patch = { g0: '#0d0c0c', g1: '#191717', dot: '#2a2727', road: '#1a1816', edge: '#8a8580' };
  THEMES.upper = { g0: '#17171d', g1: '#22222a', dot: '#2e2e38', road: '#202028', edge: '#e8e8f0' };
  THEMES.cold = { g0: '#0b0d10', g1: '#151a1f', dot: '#26303a', road: '#13171c', edge: '#aab8c4' };

  var floorX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'line') {
      px(X, Y, TS, TS, '#101015'); px(X, Y, TS, 1, '#1c1c24'); px(X, Y + 8, TS, 1, '#1c1c24'); px(X, Y, 1, TS, '#1c1c24'); px(X + 8, Y, 1, TS, '#18181f');
      if (tile(x, y + 1) === '~' || tile(x, y - 1) === '~') { var edge = tile(x, y + 1) === '~' ? Y + TS - 4 : Y; px(X, edge, TS, 4, '#2a2a32'); for (var s = 0; s < TS; s += 4) px(X + s, edge + 1, 2, 2, '#d8d8e0'); }
      return true;
    }
    if (theme === 'patch') {
      px(X, Y, TS, TS, '#0e0d0d');
      var k = Math.floor(hs(x * 7 + y * 13) * 4); if (k === 0) { px(X + 2, Y + 3, 9, 7, '#1c1a19'); px(X + 2, Y + 3, 9, 1, '#2e2b29'); px(X + 3, Y + 4, 1, 1, '#4a4642'); px(X + 9, Y + 8, 1, 1, '#4a4642'); }
      if (k === 1) { px(X + 6, Y + 1, 8, 12, '#151413'); px(X + 6, Y + 1, 1, 12, '#2a2826'); }
      return true;
    }
    if (theme === 'upper') {
      px(X, Y, TS, TS, '#1a1a21'); px(X, Y, TS, 1, '#26262e'); px(X, Y, 1, TS, '#26262e');
      var v = hs(x * 3 + y * 11); if (v > .6) { for (var i = 0; i < 10; i++) px(X + i + Math.floor(v * 4), Y + 4 + Math.round(Math.sin(i / 2 + v * 6) * 2), 1, 1, 'rgba(255,255,255,.06)'); }   // marble veins
      px(X + 1, Y + 1, 4, 1, 'rgba(255,255,255,.05)');
      return true;
    }
    if (theme === 'cold') {
      px(X, Y, TS, TS, '#0c0f13'); px(X, Y, TS, 1, '#18202a'); px(X, Y, 1, TS, '#18202a');
      for (var f = 0; f < 5; f++) px(X + Math.floor(hs(x * 3 + y * 5 + f) * 15), Y + Math.floor(hs(x * 11 + y + f * 7) * 15), 1, 1, f % 2 ? 'rgba(220,236,250,.35)' : 'rgba(220,236,250,.15)');   // frost
      return true;
    }
    return false;
  }
  var roadX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'patch') { px(X, Y, TS, TS, '#1f1c19'); for (var p = 0; p < TS; p += 4) { px(X, Y + p, TS, 1, '#0c0b0a'); px(X + ((x * 5 + p) % 12), Y + p + 1, 1, 1, '#5a5550'); } return true; }   // boardwalk
    if (theme === 'upper') { px(X, Y, TS, TS, '#24242c'); px(X, Y, TS, 1, '#34343e'); px(X, Y, 1, TS, '#34343e'); if (tile(x, y - 1) !== '=' && tile(x, y - 1) !== 'G') px(X, Y, TS, 1, '#e8e8f0'); if (tile(x, y + 1) !== '=' && tile(x, y + 1) !== 'G') px(X, Y + TS - 1, TS, 1, '#a8a8b4'); return true; }
    if (theme === 'line' || theme === 'cold') { px(X, Y, TS, TS, '#16161c'); for (var g = 0; g < TS; g += 2) px(X + g, Y, 1, TS, '#22222a'); px(X, Y, 1, TS, '#8a8a96'); px(X + TS - 1, Y, 1, TS, '#4a4a56'); return true; }
    return false;
  }
  var fieldX = function (px, theme, X, Y, x, y) {
    if (theme === 'patch') { for (var j = 0; j < 4; j++) { var bx = X + Math.floor(hs(x * 5 + j) * 11), by = Y + Math.floor(hs(y * 7 + j * 3) * 11), w = 3 + Math.floor(hs(x + y + j) * 4); px(bx, by, w, 3, ['#2a2725', '#3a3633', '#1c1a18', '#4a4540'][j]); px(bx, by, w, 1, '#5a554f'); } return true; }   // salvage heaps
    if (theme === 'upper') { px(X, Y, TS, TS, x % 2 ? '#1d2124' : '#191c1f'); px(X, Y, 1, TS, 'rgba(255,255,255,.03)'); return true; }   // striped lawn
    if (theme === 'cold') { for (var d = 0; d < 3; d++) { var dy = Y + 3 + d * 5; for (var i = 0; i < TS; i++) px(X + i, dy + Math.round(Math.sin((i + x * 16) / 4 + d) * 1), 1, 1, 'rgba(220,236,250,' + (.12 + d * .06) + ')'); } return true; }   // frost drifts
    return false;
  }
  var voidX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'line') {   // the tracks
      px(X, Y, TS, TS, '#08080a'); for (var s = 1; s < TS; s += 4) px(X + s, Y, 2, TS, '#121216');
      if (tile(x, y - 1) !== '~') { px(X, Y + 4, TS, 2, '#6a6a76'); px(X, Y + 4, TS, 1, '#d0d0da'); }
      if (tile(x, y + 1) !== '~') { px(X, Y + 9, TS, 2, '#6a6a76'); px(X, Y + 9, TS, 1, '#d0d0da'); }
      return true;
    }
    return false;
  }
  var wallX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'line') { px(X, Y, TS, TS, '#1e1e26'); for (var r = 0; r < TS; r += 4) px(X, Y + r, TS, 1, '#121218'); for (var c = 0; c < TS; c += 8) px(X + c + ((Math.floor(Y / 4)) % 2 ? 4 : 0), Y, 1, TS, '#121218'); px(X, Y + 10, TS, 2, '#d0d0da'); return true; }
    if (theme === 'patch') { var h = 10 + Math.floor(hs(x * 3 + y) * 6); px(X, Y, TS, TS, '#0a0909'); px(X, Y + TS - h, TS, h, ['#2a2725', '#22201e', '#33302d'][x % 3]); for (var k = X + 1; k < X + TS; k += 3) px(k, Y + TS - h, 1, h, '#151312'); px(X, Y + TS - h, TS, 1, '#6a655f'); if (hs(x + y * 5) > .7) px(X + 4, Y + TS - h + 3, 2, 2, '#8a857f'); return true; }
    if (theme === 'upper') { px(X, Y, TS, TS, '#c8c8d0'); px(X, Y, TS, 3, '#2a3034'); for (var l = 0; l < TS; l += 3) px(X + l, Y, 2, 2, '#3c454a'); px(X, Y + 3, TS, 1, '#ffffff'); px(X, Y + TS - 2, TS, 2, '#8a8a94'); px(X + TS - 1, Y + 3, 1, TS - 3, '#a0a0aa'); return true; }
    if (theme === 'cold') { px(X, Y, TS, TS, '#11161b'); px(X, Y + 4, TS, 1, '#2a3540'); px(X, Y + 11, TS, 1, '#2a3540'); if (x % 3 === 0) { px(X + 6, Y, 4, TS, '#1a222a'); px(X + 6, Y, 1, TS, '#5a6a78'); } for (var i = 0; i < 4; i++) px(X + Math.floor(hs(x * 9 + i) * 15), Y + 12 + Math.floor(hs(x + i) * 4), 1, 1, 'rgba(230,240,250,.5)'); return true; }
    return false;
  }
  function paintTopiary(px, g, X, Y, x, y) {
    px(X + 3, Y + 13, 11, 3, 'rgba(0,0,0,.5)');
    px(X + 4, Y + 11, 8, 4, '#2a2a32'); px(X + 4, Y + 11, 8, 1, '#8a8a96');   // a stone planter
    g.fillStyle = '#26302b'; g.beginPath(); g.arc(X + 8, Y + 5, 7, 0, 7); g.fill();
    g.fillStyle = '#3c4a42'; g.beginPath(); g.arc(X + 6.5, Y + 3.5, 4.5, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(X + 5.5, Y + 2.5, 1.8, 0, 7); g.fill();
  }
  function paintBonfire(g, px, X, Y) {
    // the Patchwork's hearth: a ring of salvaged stones and a fire of burning data
    g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(X + 16, Y + 26, 16, 5, 0, 0, 7); g.fill();
    for (var i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2; px(X + 16 + Math.cos(a) * 12 - 2, Y + 20 + Math.sin(a) * 6 - 1, 4, 3, i % 2 ? '#3a3633' : '#5a554f'); }
    px(X + 9, Y + 16, 14, 6, '#140f0c'); for (var l = 0; l < 4; l++) px(X + 10 + l * 3, Y + 14 + (l % 2), 2, 6, '#4a4540');
    for (var s = 0; s < 4; s++) { px(X - 8 + s * 14, Y + 30, 10, 3, '#2a2725'); px(X - 8 + s * 14, Y + 30, 10, 1, '#5a554f'); }   // benches
  }

  /* --- expansion buildings --- */
  function train(g, W, Ht, Hf, b, lights) {
    var px = P(g), y0 = Ht - 23;
    px(0, y0, W, 22, '#1a1a22'); px(0, y0, W, 1, '#e0e0ea'); px(0, y0 + 2, W, 1, '#6a6a76'); px(0, y0 + 21, W, 1, '#0a0a0e');
    px(0, y0 + 16, W, 2, '#d0d0da');   // the stripe
    var rnd = R(b.seed || 1);
    for (var x = 4; x < W - 8; x += 12) { var on = rnd(); px(x, y0 + 5, 9, 8, on > .5 ? '#c8c8d6' : '#22222c'); px(x, y0 + 5, 9, 1, '#f0f0f6'); if (on > .5) { px(x + 2, y0 + 8, 2, 5, '#5a5a66'); } lights.push({ x: x, y: y0 + 5, w: 9, h: 8, kind: 'flick', ph: x }); }
    var dx = b.door * TS + 2; px(dx, y0 + 3, 12, 17, '#0e0e14'); px(dx + 5, y0 + 3, 1, 17, '#5a5a66'); px(dx, y0 + 3, 12, 1, '#ffffff');
    px(W - textW('NOT IN SERVICE') - 10, y0 + 1, textW('NOT IN SERVICE') + 6, 1, '#1a1a22'); text(g, 'NOT IN SERVICE', W - textW('NOT IN SERVICE') - 7, y0 - 6 < 0 ? y0 + 15 : y0 - 6, '#c8c8d4');
    for (var w2 = 6; w2 < W; w2 += 40) { px(w2, Ht - 4, 8, 4, '#2a2a34'); px(w2 + 2, Ht - 3, 4, 2, '#6a6a76'); }
  }
  function booth(g, W, Ht, Hf, b, lights) {
    var px = P(g);
    px(2, 6, W - 4, Ht - 6, '#14141b'); px(2, 6, W - 4, 1, '#d0d0da'); px(2, 6, 1, Ht - 6, '#8a8a96');
    px(6, 14, W - 12, Ht - 26, '#0a0a0e'); for (var s = 14; s < Ht - 12; s += 3) px(6, s, W - 12, 1, '#2a2a34');   // the shutter
    sign(g, px, b.sign, W / 2, 9, 1, true); px(4, Ht - 10, W - 8, 3, '#2a2a34'); px(4, Ht - 10, W - 8, 1, '#a0a0aa');
  }
  // a shack built from salvage: mismatched panels, a corrugated roof, and old Upstream ads for walls
  function shack(g, W, Ht, Hf, b, lights) {
    var px = P(g), rnd = R(b.seed || 1), roofY = 10, ads = ['UPST', 'NEW WOR', 'SOLD', 'LEAVE', 'YOU DESE'];
    // roof: corrugated sheets at slightly different angles
    for (var r = 0; r < 3; r++) { var rx = r * Math.floor(W / 3) - 2, rw = Math.floor(W / 3) + 5, ry = roofY - 2 + Math.floor(rnd() * 4); px(rx, ry, rw, 5, ['#2e2b29', '#3a3633', '#26231f'][r]); for (var c = rx; c < rx + rw; c += 2) px(c, ry, 1, 5, '#1a1816'); px(rx, ry, rw, 1, '#7a756f'); }
    px(W - 10, 0, 2, roofY, '#4a4540'); px(W - 12, 0, 6, 2, '#6a655f');   // a chimney pipe
    // walls: panels of whatever was nearby
    for (var x = 1; x < W - 1;) {
      var pw = 6 + Math.floor(rnd() * 10), shade = ['#1f1d1b', '#2a2725', '#171615', '#33302d', '#24221f'][Math.floor(rnd() * 5)];
      pw = Math.min(pw, W - 1 - x); px(x, roofY + 4, pw, Ht - roofY - 4, shade); px(x, roofY + 4, 1, Ht - roofY - 4, '#0c0b0a');
      px(x + 1, roofY + 6, 1, 1, '#6a655f'); px(x + pw - 2, Ht - 3, 1, 1, '#6a655f');   // bolts
      x += pw;
    }
    // an old billboard turned into a wall
    var ad = ads[Math.floor(rnd() * ads.length)]; if (textW(ad) < W - 10) { var ax = 3 + Math.floor(rnd() * Math.max(1, W - textW(ad) - 8)); px(ax - 2, roofY + 8, textW(ad) + 4, 9, '#d8d4cc'); text(g, ad, ax, roofY + 10, '#1a1816'); px(ax + Math.floor(textW(ad) / 2), roofY + 8, 2, 9, '#2a2725'); }
    // a warm window
    var wx = Math.floor(W * .65); px(wx, roofY + 20, 9, 7, '#e8e0d4'); px(wx + 4, roofY + 20, 1, 7, '#3a3633'); px(wx, roofY + 27, 9, 1, '#5a554f'); lights.push({ x: wx, y: roofY + 20, w: 9, h: 7, kind: 'warm', ph: b.seed });
    if (b.door != null) { var dx = b.door * TS + 3; px(dx, Ht - 13, 10, 13, '#0a0909'); px(dx, Ht - 13, 10, 1, '#8a857f'); px(dx + 8, Ht - 7, 1, 1, '#c8c0b4'); }
    if (b.sign) { px(2, roofY + 5, textW(b.sign) + 4, 7, '#0a0909'); text(g, b.sign, 4, roofY + 6, '#f0ebe2'); }
    // string lights along the eave
    for (var s = 2; s < W - 2; s += 5) lights.push({ x: s, y: roofY + 4 + Math.round(Math.sin(s / W * Math.PI) * 2), kind: 'bulb', ph: s + (b.seed || 0) * 3 });
  }
  // the radio mast: a lattice tower with a dish and a booth at its feet
  function mast(g, W, Ht, Hf, b, lights) {
    var px = P(g), cx0 = W / 2, base = Ht - 26;
    g.strokeStyle = '#8a857f'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(cx0 - 12, base); g.lineTo(cx0 - 2, 6); g.moveTo(cx0 + 12, base); g.lineTo(cx0 + 2, 6); g.stroke();
    for (var y = 10; y < base; y += 8) { var p0 = (y - 6) / (base - 6), hw = 2 + p0 * 10, p1 = (y + 8 - 6) / (base - 6), hw1 = 2 + p1 * 10; g.strokeStyle = 'rgba(160,155,150,.7)'; g.beginPath(); g.moveTo(cx0 - hw, y + .5); g.lineTo(cx0 + hw1, y + 8.5); g.moveTo(cx0 + hw, y + .5); g.lineTo(cx0 - hw1, y + 8.5); g.moveTo(cx0 - hw, y + .5); g.lineTo(cx0 + hw, y + .5); g.stroke(); }
    px(cx0 - .5, 0, 1, 8, '#c8c0b4'); lights.push({ x: cx0 - 1, y: 0, kind: 'blink', ph: 0 }); lights.push({ x: cx0 - 7, y: Math.floor(base * .5), kind: 'blink', ph: 3 });
    g.fillStyle = '#2a2725'; g.beginPath(); g.ellipse(cx0 + 9, 22, 4, 7, -.4, 0, 7); g.fill(); g.strokeStyle = '#c8c0b4'; g.beginPath(); g.ellipse(cx0 + 9, 22, 4, 7, -.4, 0, 7); g.stroke();
    px(2, base, W - 4, 26, '#1f1d1b'); px(2, base, W - 4, 1, '#8a857f'); px(2, base, 1, 26, '#5a554f');
    px(6, base + 4, W - 12, 7, '#0a0909'); text(g, b.sign, Math.round(cx0 - textW(b.sign) / 2), base + 5, '#f0ebe2'); lights.push({ x: 6, y: base + 4, w: W - 12, h: 7, kind: 'onair' });
    var dx = b.door * TS + 3; px(dx, Ht - 13, 10, 13, '#0a0909'); px(dx, Ht - 13, 10, 1, '#8a857f');
  }
  // the owners' villas: pale planes, glass walls, every light on for viewers who never come
  function villa(g, W, Ht, Hf, b, lights) {
    var px = P(g), rnd = R(b.seed || 1), top = Ht - Hf - (b.rise ? 4 : 0) + 4;
    top = Math.max(4, Ht - Hf - 6);
    // cantilevered roof slab
    px(0, top, W, 4, '#d8d8e0'); px(0, top, W, 1, '#ffffff'); px(0, top + 3, W, 1, '#8a8a94');
    // upper floor: glass, warmly lit
    var fy = top + 4, fh = Math.floor((Ht - fy) * .45);
    px(4, fy, W - 8, fh, '#e4e2dc'); for (var m = 4; m < W - 4; m += 7) px(m, fy, 1, fh, '#8a8a94');
    px(4, fy + fh - 2, W - 8, 2, '#b8b6b0'); lights.push({ x: 4, y: fy, w: W - 8, h: fh - 2, kind: 'glow' });
    // the solid white volume below, offset for drama
    var ly = fy + fh, lh = Ht - ly;
    px(1, ly, Math.floor(W * .6), lh, '#c4c4cc'); px(1, ly, Math.floor(W * .6), 1, '#ffffff'); px(1, ly, 1, lh, '#ffffff');
    px(Math.floor(W * .6) + 1, ly + 2, W - Math.floor(W * .6) - 2, lh - 2, '#2a2e32'); px(Math.floor(W * .6) + 1, ly + 2, W - Math.floor(W * .6) - 2, 1, '#8a8a94');
    // an infinity pool, perfectly still
    var pw = W - Math.floor(W * .6) - 6; px(Math.floor(W * .6) + 3, ly + 5, pw, 5, '#9aa4aa'); px(Math.floor(W * .6) + 3, ly + 5, pw, 1, '#e8eef2'); for (var r = 0; r < pw; r += 6) px(Math.floor(W * .6) + 4 + r, ly + 7, 3, 1, '#c8d2d8');
    if (b.door != null) { var dx = b.door * TS + 3; px(dx, Ht - 13, 10, 13, '#3a3a42'); px(dx, Ht - 13, 10, 1, '#ffffff'); px(dx + 4, Ht - 13, 1, 13, '#8a8a94'); }
    px(3, ly + 6, Math.floor(W * .6) - 6, 1, '#a8a8b2');
    reflect(g, 4, fy, W - 8, fh, 4);
  }
  // Meridian Holdings: a monolith, untouched
  function boardroom(g, W, Ht, Hf, b, lights) {
    var px = P(g), cx0 = W / 2, mw = W - 40, mx = 20;
    px(mx, 4, mw, Ht - 22, '#0c0c10');
    for (var x = mx + 3; x < mx + mw - 2; x += 4) px(x, 6, 1, Ht - 26, 'rgba(236,236,246,.55)');   // vertical light lines
    px(mx, 4, mw, 1, '#ffffff'); px(mx, 4, 1, Ht - 22, '#d0d0da'); px(mx + mw - 1, 4, 1, Ht - 22, '#3a3a46');
    reflect(g, mx, 4, mw, Ht - 26, 10);
    // the logo: an arc and a meridian line
    g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.beginPath(); g.arc(cx0, 30, 9, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); px(cx0 - .5, 20, 1, 20, '#ffffff');
    lights.push({ x: cx0 - 10, y: 20, w: 20, h: 20, kind: 'logo' });
    // wings and the plaza
    px(0, Ht - 30, mx, 30, '#d0d0d8'); px(mx + mw, Ht - 30, W - mx - mw, 30, '#d0d0d8'); px(0, Ht - 30, mx, 1, '#ffffff'); px(mx + mw, Ht - 30, W - mx - mw, 1, '#ffffff');
    for (var w = 3; w < mx - 2; w += 5) { px(w, Ht - 24, 3, 14, '#e8e6e0'); px(mx + mw + w, Ht - 24, 3, 14, '#e8e6e0'); }
    px(0, Ht - 18, W, 18, '#1a1a20'); px(0, Ht - 18, W, 1, '#ffffff');
    sign(g, px, b.sign, cx0, Ht - 15, 1, true);
    var dx = b.door * TS + 2; px(dx, Ht - 8, 12, 8, '#050507'); px(dx - 1, Ht - 9, 14, 1, '#ffffff');
  }
  // cryo pods: frosted capsules, a silhouette in each
  function pod(g, W, Ht, Hf, b, lights) {
    var px = P(g);
    px(0, 2, W, 3, '#1a222a'); px(0, 2, W, 1, '#6a7a88');
    for (var x = 1; x < W - 10; x += 13) {
      px(x, 5, 12, Ht - 6, '#11161b'); px(x, 5, 12, 1, '#8a9aa8'); px(x, 5, 1, Ht - 6, '#5a6a78');
      px(x + 2, 8, 8, Ht - 14, '#0a0e12'); px(x + 2, 8, 8, 1, '#c8d8e6');
      // someone inside
      px(x + 5, 11, 3, 3, 'rgba(200,214,226,.35)'); px(x + 4, 14, 5, 9, 'rgba(200,214,226,.22)');
      for (var f = 0; f < 6; f++) px(x + 2 + Math.floor(hs(x + f) * 8), 8 + Math.floor(hs(x * 3 + f) * (Ht - 14)), 1, 1, 'rgba(236,244,252,.6)');
      lights.push({ x: x + 5, y: Ht - 5, kind: 'pod', ph: x + (b.seed || 0) * 7 });
    }
  }
  function vault(g, W, Ht, Hf, b, lights) {
    var px = P(g), cx0 = W / 2, cy = Ht / 2 - 2;
    px(0, 0, W, Ht, '#12171c'); px(0, 0, W, 1, '#8a9aa8'); for (var r = 4; r < Ht; r += 6) px(0, r, W, 1, '#0c1014');
    g.fillStyle = '#1c242c'; g.beginPath(); g.arc(cx0, cy, 17, 0, 7); g.fill(); g.strokeStyle = '#c8d4de'; g.beginPath(); g.arc(cx0, cy, 17, 0, 7); g.stroke(); g.beginPath(); g.arc(cx0, cy, 12, 0, 7); g.strokeStyle = '#5a6a78'; g.stroke();
    for (var s = 0; s < 6; s++) { var a = s / 6 * Math.PI * 2; g.strokeStyle = '#8a9aa8'; g.beginPath(); g.moveTo(cx0, cy); g.lineTo(cx0 + Math.cos(a) * 11, cy + Math.sin(a) * 11); g.stroke(); }
    px(cx0 - 2, cy - 2, 4, 4, '#e8f0f6');
    for (var f = 0; f < 14; f++) px(Math.floor(hs(f * 5 + (b.sign || '').length) * W), Math.floor(hs(f * 3) * 8), 1, 1, 'rgba(236,244,252,.7)');
    px(2, Ht - 9, W - 4, 8, '#0a0d10'); text(g, b.sign, Math.round(cx0 - textW(b.sign) / 2), Ht - 7, b.sign === 'CORRUPT' ? '#8a8a94' : '#e8f0f6');
    lights.push({ x: cx0 - 2, y: cy - 2, kind: 'vaultlight', sign: b.sign });
  }
  PAINT.train = train; PAINT.booth = booth; PAINT.shack = shack; PAINT.mast = mast; PAINT.villa = villa; PAINT.board = boardroom; PAINT.pod = pod; PAINT.vault = vault;

  /* =================== EXPANSION II ART =================== */
  THEMES.concourse = { g0: '#111116', g1: '#1c1c24', dot: '#2c2c36', road: '#18181f', edge: '#d8d8e2' };
  THEMES.clinic = { g0: '#b8bcc4', g1: '#a8acb4', dot: '#c8ccd4', road: '#9aa0a8', edge: '#ffffff' };
  THEMES.margin = { g0: '#3a3a42', g1: '#4a4a54', dot: '#5a5a66', road: '#44444e', edge: '#ffffff' };
  var floorX0 = floorX, roadX0 = roadX, fieldX0 = fieldX, voidX0 = voidX, wallX0 = wallX;
  floorX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'concourse') {   // terrazzo, swept clean every morning
      px(X, Y, TS, TS, '#121218'); px(X, Y, TS, 1, '#1e1e26'); px(X, Y, 1, TS, '#1e1e26');
      for (var i = 0; i < 7; i++) px(X + Math.floor(hs(x * 5 + y * 3 + i) * 15), Y + Math.floor(hs(x * 2 + y * 9 + i * 3) * 15), 1, 1, i % 3 ? '#2a2a34' : '#4a4a56');
      px(X + 2, Y + 2, 5, 1, 'rgba(255,255,255,.05)');
      return true;
    }
    if (theme === 'clinic') {   // pale ward tiles
      px(X, Y, TS, TS, '#b4b8c0'); px(X, Y, TS, 1, '#9ea2aa'); px(X, Y, 1, TS, '#9ea2aa'); px(X + 1, Y + 1, 6, 1, '#d4d8de');
      return true;
    }
    if (theme === 'margin') {   // floor that thins into blank at its edges
      var near = 0; for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) if (tile(x + dx, y + dy) === '~') near++;
      var v = Math.min(1, near / 14), base = Math.round(46 + v * 120);
      px(X, Y, TS, TS, 'rgb(' + base + ',' + base + ',' + (base + 6) + ')'); px(X, Y, TS, 1, 'rgba(255,255,255,.15)'); px(X, Y, 1, TS, 'rgba(255,255,255,.12)');
      if (v > .3) for (var k = 0; k < 3 * v; k++) px(X + Math.floor(hs(x * 7 + k) * 15), Y + Math.floor(hs(y * 3 + k * 5) * 15), 1, 1, 'rgba(244,244,248,.7)');
      return true;
    }
    return floorX0(px, theme, X, Y, x, y, tile);
  };
  roadX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'concourse') { px(X, Y, TS, TS, '#17171e'); if (tile(x, y - 1) !== '=') { px(X, Y, TS, 2, '#26262f'); px(X, Y + 2, TS, 1, '#e8e8f0'); } if (tile(x, y + 1) !== '=') { px(X, Y + TS - 3, TS, 1, '#e8e8f0'); px(X, Y + TS - 2, TS, 2, '#26262f'); } if (x % 4 === 0) px(X + 7, Y + 6, 2, 4, '#2a2a34'); return true; }
    if (theme === 'clinic') { px(X, Y, TS, TS, '#a8acb4'); px(X + 6, Y, 4, TS, '#e8ecf0'); return true; }
    if (theme === 'margin') { px(X, Y + 4, TS, 8, '#56565f'); px(X, Y + 4, TS, 1, '#ffffff'); px(X, Y + 11, TS, 1, '#8a8a94'); return true; }
    return roadX0(px, theme, X, Y, x, y, tile);
  };
  fieldX = function (px, theme, X, Y, x, y) {
    if (theme === 'concourse') { px(X, Y, TS, TS, '#121218'); for (var l = 0; l < 6; l++) { var lx = X + Math.floor(hs(x * 9 + l) * 13), ly = Y + Math.floor(hs(y * 5 + l * 3) * 13); px(lx, ly, 3, 2, ['#3a3633', '#2a2725', '#4a4540'][l % 3]); } return true; }   // the part nobody swept
    return fieldX0(px, theme, X, Y, x, y);
  };
  voidX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'margin') {   // blank: not darkness, just nothing anyone imagined
      px(X, Y, TS, TS, '#ececf0'); if ((x + y) % 2 === 0) px(X, Y, TS, TS, '#f0f0f4');
      if (hs(x * 3 + y * 7) > .9) px(X + 4, Y + 4, 8, 1, 'rgba(160,160,176,.25)');
      return true;
    }
    return voidX0(px, theme, X, Y, x, y, tile);
  };
  wallX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'concourse') { px(X, Y, TS, TS, '#0c0c10'); px(X, Y + 2, TS, 12, '#18181f'); px(X, Y + 2, TS, 1, '#6a6a76'); if (x % 3 === 0) { px(X + 6, Y, 4, TS, '#22222b'); px(X + 6, Y, 1, TS, '#9a9aa6'); } return true; }
    if (theme === 'clinic') { px(X, Y, TS, TS, '#d4d8de'); px(X, Y + 9, TS, 2, '#8a8e96'); px(X, Y + 9, TS, 1, '#ffffff'); px(X, Y + TS - 2, TS, 2, '#9ea2aa'); return true; }
    return wallX0(px, theme, X, Y, x, y, tile);
  };

  function storefrontRoof(px, g, W, Ht, b) {   // a south-side shop seen from the promenade: roof, awning and sign along the top edge
    px(0, 6, W, Ht - 6, '#1a1a21'); px(0, 6, W, 1, '#8a8a96'); for (var r = 10; r < Ht - 4; r += 6) px(2, r, W - 4, 1, '#141419');
    px(4, 12, 10, 6, '#2a2a34'); px(4, 12, 10, 1, '#6a6a76'); px(W - 16, 14, 8, 8, '#22222b'); px(W - 16, 14, 8, 1, '#5a5a66');
    for (var s = 0; s < W; s += 6) px(s, 0, 3, 6, '#c8c8d2'); px(0, 0, W, 6, 'rgba(0,0,0,.15)'); px(0, 5, W, 1, '#3a3a46');
    if (b.sign) { var w = textW(b.sign); px(W / 2 - w / 2 - 3, 7, w + 6, 8, '#07070a'); text(g, b.sign, Math.round(W / 2 - w / 2), 8, '#f0f0f6'); }
    if (b.door != null) { var dx = b.door * TS + 3; px(dx, 0, 10, 4, '#050507'); px(dx, 4, 10, 1, '#ffffff'); }
  }
  function shop(g, W, Ht, Hf, b, lights) {
    var px = P(g);
    if (b.doorTop) return storefrontRoof(px, g, W, Ht, b);
    var y0 = Ht - Hf + 2;
    px(0, y0, W, Ht - y0, '#14141a'); px(0, y0, W, 1, '#b0b0bc'); px(0, y0, 1, Ht - y0, '#8a8a96'); px(W - 1, y0, 1, Ht - y0, '#050508');
    if (b.sign) { var w = textW(b.sign); px(3, y0 + 3, W - 6, 9, '#07070a'); text(g, b.sign, Math.round(W / 2 - w / 2), y0 + 5, '#f4f4fa'); }
    for (var s = 2; s < W - 2; s += 6) { px(s, y0 + 13, 3, 5, '#d0d0da'); px(s + 3, y0 + 13, 3, 5, '#3a3a46'); }   // awning
    var wy = y0 + 20, wh = Ht - wy - 4; px(3, wy, W - 6, wh, '#0a0a0e'); px(3, wy, W - 6, 1, '#6a6a76');
    var kind = b.sign;
    if (kind === 'FLORIST') for (var f = 0; f < 10; f++) { px(6 + f * 6 % (W - 12), wy + 4 + (f % 3) * 6, 3, 3, f % 2 ? '#e8e8f0' : '#9a9aa8'); px(7 + f * 6 % (W - 12), wy + 7 + (f % 3) * 6, 1, 4, '#4a504a'); }
    else if (kind === 'TAILOR') { px(W / 2 - 3, wy + 3, 6, 5, '#c8c8d2'); px(W / 2 - 5, wy + 8, 10, 14, '#8a8a96'); px(W / 2 - 1, wy + 22, 2, 6, '#4a4a56'); }
    else if (kind === 'CAFE') { for (var t = 0; t < 3; t++) { px(6 + t * 28, wy + 14, 12, 2, '#c8c8d2'); px(11 + t * 28, wy + 16, 2, 8, '#6a6a76'); } text(g, 'OPEN', W - 22, wy + 4, '#3a3a46'); }
    else if (kind === 'CINEMA') { px(4, y0 + 13, W - 8, 6, '#e8e8f0'); text(g, 'UPSTREAM', Math.round(W / 2 - textW('UPSTREAM') / 2), y0 + 14, '#0a0a0e'); }
    lights.push({ x: 3, y: wy, w: W - 6, h: wh, kind: 'glow' });
    if (b.door != null) { var dx = b.door * TS + 3; px(dx, Ht - 13, 10, 13, '#050507'); px(dx, Ht - 13, 10, 1, '#ffffff'); }
    px(4, Ht - 9, 14, 6, '#e8e8f0'); text(g, 'SHUT', 5, Ht - 8, '#0a0a0e');
  }
  function arcade(g, W, Ht, Hf, b, lights) {
    var px = P(g), y0 = 6;
    px(0, y0, W, Ht - y0, '#0e0e14'); px(0, y0, W, 1, '#ffffff'); px(0, y0, 2, Ht - y0, '#9a9aa6');
    // a marquee of lights
    px(4, y0 + 4, W - 8, 13, '#050507'); px(4, y0 + 4, W - 8, 1, '#e8e8f0');
    text(g, b.sign, Math.round(W / 2 - textW(b.sign, 2) / 2), y0 + 6, '#ffffff', 2);
    for (var m = 6; m < W - 6; m += 4) lights.push({ x: m, y: y0 + 2, kind: 'bulb', ph: m });
    // cabinets glowing through the glass
    var gy = y0 + 22; px(4, gy, W - 8, Ht - gy - 2, '#08080b'); px(4, gy, W - 8, 1, '#5a5a66');
    for (var c = 0; c < 5; c++) { var cxp = 8 + c * Math.floor((W - 20) / 4); px(cxp, gy + 6, 9, 20, '#1a1a22'); px(cxp + 1, gy + 8, 7, 6, c === 1 ? '#e8e8f0' : '#3a3a46'); px(cxp + 2, gy + 16, 5, 1, '#6a6a76'); lights.push({ x: cxp + 1, y: gy + 8, w: 7, h: 6, kind: c === 1 ? 'screen' : 'flick', ph: c * 7 }); }
    var dx = b.door * TS + 3; px(dx, Ht - 14, 10, 14, '#050507'); px(dx - 1, Ht - 15, 12, 1, '#ffffff');
  }
  function forge(g, W, Ht, Hf, b, lights) {
    var px = P(g), y0 = 12;
    px(W - 22, 0, 10, y0 + 4, '#1e1c1a'); px(W - 22, 0, 10, 1, '#8a857f'); px(W - 22, 0, 1, y0 + 4, '#5a554f'); lights.push({ x: W - 17, y: 0, kind: 'smoke' });
    px(0, y0, W, Ht - y0, '#161412'); px(0, y0, W, 1, '#a8a29a');
    for (var r = y0 + 3; r < Ht; r += 4) { px(0, r, W, 1, '#0c0b0a'); for (var x = (r / 4) % 2 ? 2 : 6; x < W; x += 8) px(x, r - 3, 1, 3, '#0c0b0a'); }   // brick
    var w = textW(b.sign); px(W / 2 - w / 2 - 4, y0 + 4, w + 8, 9, '#07070a'); text(g, b.sign, Math.round(W / 2 - w / 2), y0 + 6, '#f4efe6');
    // the forge's mouth, glowing
    px(6, y0 + 18, 26, 18, '#050404'); px(8, y0 + 22, 22, 14, '#3a2a1e'); lights.push({ x: 8, y: y0 + 22, w: 22, h: 14, kind: 'fire' });
    // an anvil sign
    px(W - 36, y0 + 20, 16, 4, '#c8c2b8'); px(W - 32, y0 + 24, 8, 4, '#8a857f'); px(W - 34, y0 + 28, 12, 2, '#c8c2b8');
    var dx = b.door * TS + 3; px(dx, Ht - 14, 10, 14, '#050404'); px(dx - 1, Ht - 15, 12, 1, '#e8e2d8');
  }
  function school(g, W, Ht, Hf, b, lights) {
    var px = P(g), roofY = 4, y0 = 20;
    for (var k = 0; k < 16; k++) { var hw = W / 2 - 2 - (16 - k) * (W / 2 - 4) / 16; px(W / 2 - hw, roofY + k, hw * 2, 1, k === 0 ? '#c8c8d2' : '#22222a'); px(W / 2 - hw, roofY + k, 1, 1, '#a0a0aa'); }
    // a clock in the gable
    g.strokeStyle = '#e8e8f0'; g.beginPath(); g.arc(W / 2, roofY + 10, 4, 0, 7); g.stroke(); lights.push({ x: W / 2, y: roofY + 10, kind: 'clock' });
    px(2, y0, W - 4, Ht - y0, '#1a1716'); for (var r = y0 + 3; r < Ht; r += 4) { px(2, r, W - 4, 1, '#100e0d'); for (var x = (r / 4) % 2 ? 4 : 8; x < W - 4; x += 8) px(x, r - 3, 1, 3, '#100e0d'); }
    px(2, y0, W - 4, 1, '#a8a29a');
    var w = textW(b.sign); px(W / 2 - w / 2 - 3, y0 + 3, w + 6, 9, '#07070a'); text(g, b.sign, Math.round(W / 2 - w / 2), y0 + 5, '#f4f4fa');
    // a chalkboard in the window
    px(8, y0 + 16, 30, 16, '#8a857f'); px(9, y0 + 17, 28, 14, '#1a201c'); text(g, 'HELLO', 12, y0 + 19, '#e8e8e0'); text(g, 'WORLD', 12, y0 + 25, '#e8e8e0');
    px(W - 38, y0 + 16, 30, 16, '#8a857f'); px(W - 37, y0 + 17, 28, 14, '#e8dcc8'); lights.push({ x: W - 37, y: y0 + 17, w: 28, h: 14, kind: 'warm', ph: 4 });
    var dx = b.door * TS + 3; px(dx, Ht - 14, 10, 14, '#0a0908'); px(dx - 1, Ht - 15, 12, 1, '#e8e2d8'); px(dx + 7, Ht - 8, 1, 1, '#c8c0b4');
  }
  function clinic(g, W, Ht, Hf, b, lights) {
    var px = P(g);
    px(0, 4, W, Ht - 4, '#c8ccd2'); px(0, 4, W, 1, '#ffffff'); px(0, Ht - 2, W, 2, '#8a8e96');
    for (var r = 10; r < Ht - 4; r += 6) px(2, r, W - 4, 1, '#b4b8c0');
    // a cross on the roof
    px(W - 30, 14, 14, 4, '#ffffff'); px(W - 25, 9, 4, 14, '#ffffff'); lights.push({ x: W - 30, y: 9, w: 14, h: 14, kind: 'glow' });
    px(8, 12, 22, 12, '#9aa0a8'); px(8, 12, 22, 1, '#e8ecf0');   // a skylight
    for (var s = 0; s < W; s += 6) px(s, 0, 3, 5, '#e8ecf0'); px(0, 4, W, 1, '#8a8e96');
    var w = textW(b.sign); px(W / 2 - w / 2 - 3, 6, w + 6, 8, '#3a3e46'); text(g, b.sign, Math.round(W / 2 - w / 2), 7, '#ffffff');
    var dx = b.door * TS + 3; px(dx, 0, 10, 4, '#050507'); px(dx, 4, 10, 1, '#ffffff');
  }
  function bed(g, W, Ht, Hf, b, lights) {
    var px = P(g), occupied = /BED/.test(b.sign || '');
    px(2, 4, W - 4, Ht - 6, '#8a8e96'); px(2, 4, W - 4, 1, '#ffffff'); px(4, 6, W - 8, Ht - 10, '#eef0f4'); px(6, 7, W - 12, 5, '#ffffff');   // frame, mattress, pillow
    if (occupied) { px(10, 9, 6, 4, '#8a8e96'); px(7, 13, W - 14, Ht - 18, '#aeb4bc'); }
    px(W - 6, 0, 5, 7, '#2a2e34'); px(W - 6, 0, 5, 1, '#c8ccd2'); lights.push({ x: W - 5, y: 2, w: 3, kind: 'monitor', ph: b.seed });
    if (occupied) text(g, (b.sign || '').replace('BED ', ''), 3, Ht - 5, '#3a3e46');
  }
  PAINT.shop = shop; PAINT.arcade = arcade; PAINT.forge = forge; PAINT.school = school; PAINT.clinic = clinic; PAINT.bed = bed;

  /* ---------- the sky beyond the walls ---------- */
  function paintSky(g, theme, w, pad) {
    var px = P(g);
    var under = theme === 'undercroft' || theme === 'line' || theme === 'cold' || theme === 'clinic';
    if (theme === 'margin') { g.fillStyle = '#ececf0'; g.fillRect(0, 0, w, pad); return; }
    var sk = g.createLinearGradient(0, 0, 0, pad); sk.addColorStop(0, '#020203'); sk.addColorStop(1, under ? '#0a0a0d' : '#14141b'); g.fillStyle = sk; g.fillRect(0, 0, w, pad);
    if (under) {   // underground: a ceiling of pipes and cable
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
    var fpos = paintGround(g, map, area.theme, W, H, o);
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
    if (area.theme === 'line') for (var sx = 2; sx < W - 6; sx += 12) { g.fillStyle = '#0a0a0e'; g.fillRect(sx * TS, 2, textW('CENTRAL') + 6, 9); text(g, 'CENTRAL', sx * TS + 3, 4, '#e8e8f0'); }
    return { base: base, over: over, lights: lights, W: W, H: H, pad: pad, rises: riseRects, fpos: fpos };
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
      if (st.fpos && th === 'patch') { var bx0 = st.fpos[0], by0 = st.fpos[1]; for (var fl = 0; fl < 14; fl++) { var ft = (t * 1.6 + hs(fl)) % 1; px(bx0 + 12 + hs(fl * 3) * 9 + Math.sin(t * 5 + fl) * 1.5, by0 + 16 - ft * 16, 2, 2, 'rgba(255,250,240,' + (1 - ft) * .9 + ')'); } c.fillStyle = 'rgba(255,245,230,' + (.08 + .04 * Math.sin(t * 7)) + ')'; c.beginPath(); c.arc(bx0 + 16 - cam.x, by0 + 16 - cam.y, 30, 0, 7); c.fill(); }
      if (st.fpos && th === 'upper') { for (var sp = 0; sp < 10; sp++) { var su = (t * .9 + sp / 10) % 1; px(st.fpos[0] + 32 + Math.cos(sp) * su * 20, st.fpos[1] + 4 + su * 18 - Math.sin(su * Math.PI) * 10, 1, 2, 'rgba(240,244,250,' + (1 - su) + ')'); } }
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
      else if (l.kind === 'bulb') { var on2 = .45 + .55 * Math.abs(Math.sin(t * 1.3 + l.ph)); px(l.x, l.y, 1, 1, 'rgba(255,248,236,' + on2 + ')'); px(l.x - 1, l.y - 1, 3, 3, 'rgba(255,248,236,' + on2 * .15 + ')'); }
      else if (l.kind === 'warm') { if (Math.random() < .01) return; px(l.x, l.y, l.w, l.h, 'rgba(255,240,220,' + (.08 + .05 * Math.sin(t * 2 + l.ph)) + ')'); }
      else if (l.kind === 'onair') { if (st.radio && Math.floor(t * 1.5) % 2) { px(l.x, l.y, l.w, l.h, 'rgba(255,255,255,.25)'); } }
      else if (l.kind === 'flick') { if (hs(l.ph + Math.floor(t * 6)) > .96) px(l.x, l.y, l.w, l.h, 'rgba(0,0,0,.6)'); }
      else if (l.kind === 'glow') { px(l.x, l.y, l.w, l.h, 'rgba(255,248,232,' + (.06 + .03 * Math.sin(t)) + ')'); }
      else if (l.kind === 'logo') { c.fillStyle = 'rgba(255,255,255,' + (.06 + .04 * Math.sin(t * 1.4)) + ')'; c.beginPath(); c.arc(l.x + 10 - cam.x, l.y + 10 - cam.y, 14, 0, 7); c.fill(); }
      else if (l.kind === 'pod') { if (Math.floor(t * 1.2 + l.ph) % 3) px(l.x, l.y, 2, 1, '#e8f4ff'); }
      else if (l.kind === 'vaultlight') { var vl = l.sign === 'M QUELL' ? (st.mara ? .2 : .5 + .5 * Math.sin(t * 2)) : l.sign === 'CORRUPT' ? (Math.random() < .3 ? 1 : 0) : .6; px(l.x, l.y, 4, 4, 'rgba(255,255,255,' + vl + ')'); }
      else if (l.kind === 'screen') { var sy3 = Math.floor((t * 6) % l.h); px(l.x, l.y + sy3, l.w, 1, '#ffffff'); if (Math.floor(t * 2) % 2) px(l.x + 2, l.y + 2, 3, 2, '#0a0a0e'); }
      else if (l.kind === 'smoke') { for (var sm = 0; sm < 6; sm++) { var su2 = (t * .3 + sm / 6) % 1; c.fillStyle = 'rgba(200,196,190,' + .18 * (1 - su2) + ')'; c.beginPath(); c.arc(l.x - cam.x + Math.sin(t + sm) * 3 + su2 * 6, l.y - cam.y - su2 * 26, 2 + su2 * 5, 0, 7); c.fill(); } }
      else if (l.kind === 'fire') { for (var fr = 0; fr < 8; fr++) { var fu = (t * 2 + hs(fr)) % 1; px(l.x + 2 + hs(fr * 3) * (l.w - 6), l.y + l.h - 2 - fu * (l.h - 2), 2, 2, 'rgba(255,240,220,' + (1 - fu) + ')'); } px(l.x, l.y, l.w, l.h, 'rgba(255,230,200,' + (.15 + .1 * Math.sin(t * 9)) + ')'); }
      else if (l.kind === 'clock') { var ang2 = t * .5; c.strokeStyle = '#ffffff'; c.beginPath(); c.moveTo(l.x - cam.x, l.y - cam.y); c.lineTo(l.x - cam.x + Math.cos(ang2) * 3, l.y - cam.y + Math.sin(ang2) * 3); c.stroke(); }
      else if (l.kind === 'monitor') { var bp = (t * 1.2 + l.ph * .3) % 1; px(l.x + Math.floor(bp * 3), l.y + (bp > .5 && bp < .6 ? 0 : 1), 1, 1, '#ffffff'); }
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
      else if (th === 'cold') { for (var mi = 0; mi < 10; mi++) { var ml = (t * .05 + hs(mi * 7)) % 1; c.fillStyle = 'rgba(220,236,250,' + .05 * Math.sin(ml * Math.PI) + ')'; c.fillRect(Math.round(hs(mi * 3) * 360 - 40 + ml * 60), Math.round(hs(mi * 13) * 180), 60, 10); } for (var sn = 0; sn < 16; sn++) { var sl2 = (t * .08 + hs(sn * 5)) % 1; px(cam.x + hs(sn * 9) * 320 + Math.sin(t + sn) * 5, cam.y + sl2 * 190, 1, 1, 'rgba(236,244,252,' + .6 * (1 - sl2) + ')'); } }
      else if (th === 'line') { if (hs(Math.floor(t * 4)) > .97) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, 320, 180); } }
      else if (th === 'upper') { }
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
    c.fillStyle = o.look === 'holo' ? 'rgba(220,220,236,.25)' : 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(X + 8, Y + 15, o.look === 'kid' ? 5 : 7, 2.5, 0, 0, 7); c.fill();
    var SP = window.VondsSprite;
    if (SP && SP.person) {
      // a person, drawn like Vee: the same face, body and outline, with their own hair and clothes
      var img = o.hero && SP.hero ? SP.hero(o.hero, 'front', 0) : SP.person(o.p || {}); if (SP.hd && window.__afterliftHD) img = SP.hd(img);   // people get the same 16-bit pass as Vee; heroes have their own sprites
      var kid = o.look === 'kid', sc = kid ? .74 : 1, w = 22 * sc, h = 27 * sc;
      var alpha = o.look === 'warden' || o.solid ? 1 : (o.fade != null ? o.fade : .82);
      if (o.flick && Math.random() < .08) alpha *= .3;
      var bob = Math.floor(t * 1.4 + (o.x || 0)) % 6 === 0 ? 1 : 0;   // a breath now and then
      c.save(); c.imageSmoothingEnabled = false; c.globalAlpha = alpha;
      c.drawImage(img, Math.round(X + 8 - w / 2), Math.round(Y + 16 - h + bob), Math.round(w), Math.round(h));
      c.restore();
      if (o.look === 'holo') {   // a hologram: brighter, scanned, standing on its pad
        c.fillStyle = 'rgba(230,230,246,' + (.12 + .06 * Math.sin(t * 4)) + ')'; c.fillRect(Math.round(X + 8 - w / 2), Math.round(Y + 16 - h), Math.round(w), Math.round(h));
        c.fillStyle = 'rgba(8,8,12,.35)'; for (var s = 0; s < h; s += 2) c.fillRect(Math.round(X + 8 - w / 2), Math.round(Y + 16 - h + s), Math.round(w), 1);
        c.fillStyle = 'rgba(230,230,246,.6)'; c.fillRect(Math.round(X + 1), Math.round(Y + 15), 14, 1);
      } else if (o.look !== 'warden' && !o.solid) {   // an echo: a resident still playing back, faintly scanned
        c.fillStyle = 'rgba(8,8,12,.25)'; for (var s2 = (Math.floor(t * 8) % 2); s2 < h; s2 += 3) c.fillRect(Math.round(X + 8 - w / 2), Math.round(Y + 16 - h + s2), Math.round(w), 1);
      }
      return;
    }
    c.save();
    var hgt = o.look === 'kid' ? 10 : (o.h || 13), top = 15 - hgt;
    c.globalAlpha = o.look === 'warden' || o.solid ? 1 : .72;
    px(5, top, 6, 5, '#c8c8d2'); px(4, top + 5, 8, hgt - 8, '#6a6a78');
    c.restore();
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
    if (window.VondsSprite && window.VondsSprite.person) { c.save(); c.imageSmoothingEnabled = false; c.drawImage(window.VondsSprite.person({ hair: 'short', body: 'coat', glasses: 1, skin: '#8a5a3c', top: '#4a4238' }), Math.round(X - 15), Math.round(Y - 11)); c.restore(); }
    else { px(-6, 1, 6, 5, '#c8c8d2'); px(-7, 6, 8, 8, '#7a7268'); }
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
    } else if (theme === 'concourse') {
      for (var sf = 0; sf < 10; sf++) { var sfx = sf * 34; px(sfx, hy - 30, 30, 30, '#121218'); px(sfx, hy - 30, 30, 1, '#6a6a76'); for (var aw = 0; aw < 30; aw += 6) px(sfx + aw, hy - 26, 3, 4, '#c8c8d2'); px(sfx + 4, hy - 18, 22, 14, sf % 3 ? '#0a0a0e' : 'rgba(255,248,232,.25)'); }
    } else if (theme === 'clinic') {
      cx.fillStyle = '#c8ccd2'; cx.fillRect(0, 0, W, hy); for (var cl = 0; cl < W; cl += 40) { px(cl + 6, 8, 28, 3, '#ffffff'); } px(0, hy - 14, W, 2, '#8a8e96'); for (var bd = 0; bd < 6; bd++) { px(bd * 56 + 6, hy - 12, 40, 12, '#eef0f4'); px(bd * 56 + 6, hy - 12, 40, 1, '#ffffff'); }
    } else if (theme === 'margin') {
      cx.fillStyle = '#ececf0'; cx.fillRect(0, 0, W, hy); for (var mg = 0; mg < 12; mg++) px(hs(mg * 3) * W, hs(mg * 7) * hy, 10 + hs(mg) * 20, 1, 'rgba(120,120,140,.2)');
    } else if (theme === 'line') {
      cx.fillStyle = '#08080b'; cx.fillRect(0, 0, W, hy); for (var ar = 0; ar < 4; ar++) { cx.strokeStyle = 'rgba(200,200,214,' + (.12 + ar * .08) + ')'; cx.beginPath(); cx.ellipse(W / 2, hy, 40 + ar * 40, 30 + ar * 14, 0, Math.PI, 0); cx.stroke(); }
      if (Math.floor(t * .5) % 4 === 0) { cx.fillStyle = 'rgba(255,255,255,.5)'; cx.fillRect(W / 2 - 3, hy - 14, 2, 2); cx.fillRect(W / 2 + 2, hy - 14, 2, 2); }
      for (var fl2 = 0; fl2 < W; fl2 += 50) px(fl2, 4, 30, 2, Math.floor(t * 3 + fl2) % 7 ? '#d8d8e2' : '#2a2a34');
    } else if (theme === 'patch') {
      for (var sh = 0; sh < 9; sh++) { var sx2 = sh * 38 - 8, sh2 = 18 + hs(sh) * 16; px(sx2, hy - sh2, 34, sh2, '#141210'); px(sx2, hy - sh2, 34, 2, '#3a3633'); px(sx2 + 20, hy - sh2 + 6, 6, 5, 'rgba(255,240,220,.6)'); }
      for (var bl = 0; bl < W; bl += 9) px(bl, 14 + Math.round(Math.sin(bl / 40) * 6), 1, 1, 'rgba(255,248,236,' + (.4 + .5 * Math.abs(Math.sin(t + bl))) + ')');
      px(W * .8, 6, 1, hy - 6, '#5a554f'); if (Math.floor(t * 1.5) % 2) px(W * .8 - 1, 5, 3, 2, '#ffffff');
    } else if (theme === 'upper') {
      for (var vb = 0; vb < 6; vb++) { var vx2 = vb * 58 + 4; px(vx2, hy - 22, 44, 22, '#c8c8d0'); px(vx2, hy - 22, 44, 1, '#ffffff'); px(vx2 + 4, hy - 18, 36, 8, 'rgba(255,244,228,.55)'); }
      cx.strokeStyle = 'rgba(255,255,255,.3)'; cx.beginPath(); cx.arc(W * .5, 20, 9, Math.PI * 1.1, Math.PI * 1.9); cx.stroke();
    } else if (theme === 'cold') {
      cx.fillStyle = '#05070a'; cx.fillRect(0, 0, W, hy); for (var pd = 0; pd < 14; pd++) { var pdx = pd * 24 + 2; px(pdx, hy - 40, 16, 40, '#11161b'); px(pdx + 3, hy - 36, 10, 30, '#0a0e12'); px(pdx + 6, hy - 32, 4, 4, 'rgba(200,214,226,.3)'); px(pdx + 5, hy - 27, 6, 14, 'rgba(200,214,226,.18)'); }
      cx.fillStyle = 'rgba(220,236,250,.06)'; cx.fillRect(0, hy - 18, W, 18);
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
    var fg = cx.createLinearGradient(0, hy, 0, H); fg.addColorStop(0, theme === 'gardens' ? '#17191c' : theme === 'clinic' ? '#8a8e96' : theme === 'margin' ? '#b0b0ba' : '#16161d'); fg.addColorStop(1, theme === 'margin' ? '#4a4a54' : '#0a0a0e'); cx.fillStyle = fg; cx.fillRect(0, hy, W, H - hy);
    px(0, hy, W, 1, 'rgba(236,236,246,.55)');
    for (var j = -18; j <= 18; j++) { cx.strokeStyle = 'rgba(220,220,236,' + (.16 - Math.abs(j) * .006) + ')'; cx.beginPath(); cx.moveTo(W / 2 + j * 9 + .5, hy); cx.lineTo(W / 2 + j * 34 + .5, H); cx.stroke(); }
    for (var q = 0; q < 9; q++) { var z = (q + (t * .25) % 1) / 9, yz = Math.floor(hy + (H - hy) * z * z) + .5; cx.strokeStyle = 'rgba(220,220,236,' + (.04 + z * .2) + ')'; cx.beginPath(); cx.moveTo(0, yz); cx.lineTo(W, yz); cx.stroke(); }
    cx.fillStyle = '#050507'; [[60, 80, 14], [180, 96, 10], [130, 118, 18], [228, 84, 8]].forEach(function (c3) { cx.fillRect(c3[0], c3[1], c3[2], 1); cx.fillRect(c3[0] + 3, c3[1] + 1, Math.floor(c3[2] / 2), 1); });
  }

  /* =================== EXPANSION III ART: the Stacks and Ring Zero =================== */
  THEMES.stacks = { g0: '#1c1a17', g1: '#24211d', dot: '#34302a', road: '#2a2420', edge: '#d8d0c4' };
  THEMES.ring0 = { g0: '#050506', g1: '#0a0a0c', dot: '#1a1a20', road: '#0c0c10', edge: '#ffffff' };
  var floorX3 = floorX, roadX3 = roadX, fieldX3 = fieldX, voidX3 = voidX, wallX3 = wallX;
  floorX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'stacks') {   // old parquet, worn pale down the middle of every aisle
      px(X, Y, TS, TS, (x + y) % 2 ? '#24211d' : '#211e1a'); px(X, Y + ((x % 2) ? 7 : 0), TS, 1, '#16140f'); px(X + ((y % 2) ? 0 : 8), Y, 1, TS, '#16140f');
      if (hs(x * 13 + y * 7) > .8) px(X + 3, Y + 4, 6, 1, 'rgba(232,224,210,.08)');
      return true;
    }
    if (theme === 'ring0') {   // kernel floor: black glass and the traces under it
      px(X, Y, TS, TS, '#060607'); px(X, Y, TS, 1, '#0e0e12'); px(X, Y, 1, TS, '#0e0e12');
      var h = hs(x * 7 + y * 13);
      if (h > .55) px(X, Y + 7, TS, 1, 'rgba(255,255,255,.13)'); if (h > .78) px(X + 7, Y, 1, TS, 'rgba(255,255,255,.13)');
      if (h > .9) { px(X + 6, Y + 6, 3, 3, '#1a1a20'); px(X + 7, Y + 7, 1, 1, '#ffffff'); }
      return true;
    }
    return floorX3(px, theme, X, Y, x, y, tile);
  };
  roadX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'stacks') { px(X, Y, TS, TS, '#2e2420'); px(X, Y, TS, 1, '#46382f'); px(X, Y + TS - 1, TS, 1, '#1a1411'); if (tile(x, y - 1) !== '=') px(X, Y + 1, TS, 1, '#a08c74'); if (tile(x, y + 1) !== '=') px(X, Y + TS - 2, TS, 1, '#a08c74'); if (tile(x - 1, y) !== '=') px(X + 1, Y, 1, TS, '#a08c74'); if (tile(x + 1, y) !== '=') px(X + TS - 2, Y, 1, TS, '#a08c74'); return true; }
    if (theme === 'ring0') { px(X, Y, TS, TS, '#0b0b0e'); if (tile(x, y - 1) === '~' || tile(x, y + 1) === '~') { px(X, Y, TS, TS, '#101014'); px(X, tile(x, y - 1) === '~' ? Y : Y + TS - 1, TS, 1, '#ffffff'); } var vert = tile(x - 1, y) !== '=' && tile(x + 1, y) !== '='; if (vert) { px(X + 5, Y, 1, TS, '#ffffff'); px(X + 10, Y, 1, TS, 'rgba(255,255,255,.4)'); } else { px(X, Y + 5, TS, 1, '#ffffff'); px(X, Y + 10, TS, 1, 'rgba(255,255,255,.4)'); } return true; }
    return roadX3(px, theme, X, Y, x, y, tile);
  };
  fieldX = function (px, theme, X, Y, x, y) {
    if (theme === 'stacks') { px(X, Y, TS, TS, '#24211d'); for (var t = 0; t < 4; t++) { var tx = X + Math.floor(hs(x * 5 + t) * 12), ty = Y + Math.floor(hs(y * 3 + t * 7) * 12); px(tx, ty, 4, 1, '#0c0b09'); px(tx + 1, ty + 1, 3, 1, '#3a3530'); } px(X + 2, Y + 9, 9, 1, 'rgba(10,9,8,.8)'); return true; }   // unspooled tape on the floor
    if (theme === 'ring0') { px(X, Y, TS, TS, '#060607'); for (var k = 0; k < 5; k++) px(X + Math.floor(hs(x * 11 + k) * 15), Y + Math.floor(hs(y * 7 + k * 5) * 15), 1, 1, '#ffffff'); return true; }   // loose bits
    return fieldX3(px, theme, X, Y, x, y);
  };
  voidX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'stacks') {   // the drop to the lower stacks: rails, then shelves far below
      px(X, Y, TS, TS, '#0b0a08'); for (var r = 3; r < TS; r += 5) px(X, Y + r, TS, 2, (x + r) % 3 ? '#14120f' : '#1c1915');
      if (tile(x, y - 1) !== '~') { px(X, Y, TS, 3, '#3a3128'); px(X, Y, TS, 1, '#b8a48c'); for (var b = 1; b < TS; b += 5) px(X + b, Y + 3, 1, 4, '#5a4c40'); }
      return true;
    }
    if (theme === 'ring0') {   // the well: rings going down forever
      px(X, Y, TS, TS, '#000000');
      var cx0 = 22, cy0 = 10, d = Math.sqrt((x - cx0) * (x - cx0) + (y - cy0) * (y - cy0) * 2.4);
      for (var sy = 0; sy < TS; sy += 2) for (var sx = 0; sx < TS; sx += 2) { var dd = Math.sqrt(Math.pow(x + sx / TS - cx0, 2) + Math.pow(y + sy / TS - cy0, 2) * 2.4); if (Math.abs(dd - Math.round(dd / 1.6) * 1.6) < .09) px(X + sx, Y + sy, 2, 2, 'rgba(255,255,255,' + Math.max(.06, .5 - dd * .06) + ')'); }
      if (tile(x, y - 1) !== '~') { px(X, Y, TS, 1, '#ffffff'); px(X, Y + 1, TS, 1, '#3a3a44'); }
      return true;
    }
    return voidX3(px, theme, X, Y, x, y, tile);
  };
  wallX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'stacks') {   // floor-to-ceiling tape shelving
      px(X, Y, TS, TS, '#15130f'); px(X, Y, TS, 1, '#5a4c40'); px(X, Y + 8, TS, 1, '#5a4c40');
      for (var c = 0; c < 4; c++) { px(X + 1 + c * 4, Y + 2, 3, 5, hs(x * 4 + c + y) > .2 ? '#c8bca8' : '#0b0a08'); px(X + 1 + c * 4, Y + 10, 3, 5, hs(x * 4 + c + y * 3) > .25 ? '#a89c88' : '#0b0a08'); px(X + 1 + c * 4, Y + 4, 3, 1, '#2a2520'); px(X + 1 + c * 4, Y + 12, 3, 1, '#2a2520'); }
      return true;
    }
    if (theme === 'ring0') { px(X, Y, TS, TS, '#000000'); px(X, Y, TS, 1, '#ffffff'); px(X + 2, Y + 3, TS - 4, TS - 6, '#08080a'); if ((x + y) % 4 === 0) px(X + 7, Y + 7, 2, 2, '#ffffff'); return true; }
    return wallX3(px, theme, X, Y, x, y, tile);
  };
  var paintSky3 = paintSky;
  paintSky = function (g, theme, w, pad) {
    var px = P(g);
    if (theme === 'stacks') {   // a vaulted reading-room ceiling, lamps hanging on long cords
      var sk = g.createLinearGradient(0, 0, 0, pad); sk.addColorStop(0, '#050403'); sk.addColorStop(1, '#14110e'); g.fillStyle = sk; g.fillRect(0, 0, w, pad);
      for (var a = 0; a < w; a += 64) { g.strokeStyle = 'rgba(184,164,140,.25)'; g.beginPath(); g.arc(a + 32, pad + 10, 40, Math.PI, 0); g.stroke(); }
      for (var l = 20; l < w; l += 48) { px(l, 0, 1, pad - 14, 'rgba(184,164,140,.3)'); px(l - 3, pad - 14, 7, 3, '#3a3128'); px(l - 2, pad - 11, 5, 1, 'rgba(255,236,204,.8)'); }
      return;
    }
    if (theme === 'ring0') { g.fillStyle = '#000000'; g.fillRect(0, 0, w, pad); for (var i = 0; i < w; i += 32) px(i, 0, 1, pad, 'rgba(255,255,255,.08)'); px(0, pad - 2, w, 1, 'rgba(255,255,255,.4)'); return; }
    return paintSky3(g, theme, w, pad);
  };

  // a run of tape shelving, taller than anyone, labelled by year
  function shelf(g, W, Ht, Hf, b, lights) {
    var px = P(g), rnd = R(b.seed || 3);
    px(0, 0, W, Ht, '#13110e'); px(0, 0, W, 2, '#6a5a4c'); px(0, 0, 1, Ht, '#8a7864'); px(W - 1, 0, 1, Ht, '#2a2420');
    for (var y = 4; y < Ht - 4; y += 7) {
      px(1, y + 5, W - 2, 1, '#5a4c40');
      for (var x = 2; x < W - 3; x += 3) { var on = rnd(); px(x, y, 2, 5, on > .12 ? (on > .6 ? '#d8ccb8' : '#a89c88') : '#050403'); if (on > .97) lights.push({ x: x, y: y + 1, kind: 'blink', ph: x + y }); }
    }
    if (b.sign) { var tw = textW(b.sign); px(W / 2 - tw / 2 - 2, Ht - 10, tw + 4, 8, '#e8dccc'); text(g, b.sign, Math.round(W / 2 - tw / 2), Ht - 8, '#1a1612'); }
  }
  // the tape robot: a glass cabinet with a picker arm that never stops
  function robot(g, W, Ht, Hf, b, lights) {
    var px = P(g);
    px(0, 2, W, Ht - 2, '#0e0d0b'); px(0, 2, W, 1, '#c8bca8'); px(0, 2, 1, Ht - 2, '#8a7864'); px(W - 1, 2, 1, Ht - 2, '#3a3128');
    px(3, 6, W - 6, Ht - 14, '#060504'); px(3, 6, W - 6, 1, '#5a4c40');
    for (var y = 9; y < Ht - 10; y += 5) for (var x = 5; x < W - 6; x += 3) px(x, y, 2, 3, '#7a6e5e');
    px(4, Ht - 8, W - 8, 6, '#1c1915'); text(g, b.sign || 'LIBRARY', 6, Ht - 7, '#e8dccc');
    lights.push({ x: 5, y: 10, w: W - 12, h: Ht - 22, kind: 'screen' });
  }
  // a reading desk with a green-shaded lamp gone grey
  function desk(g, W, Ht, Hf, b, lights) {
    var px = P(g);
    px(1, Ht - 12, W - 2, 6, '#3a3128'); px(1, Ht - 12, W - 2, 1, '#b8a48c'); px(3, Ht - 6, 2, 6, '#2a2420'); px(W - 5, Ht - 6, 2, 6, '#2a2420');
    px(W - 10, Ht - 20, 7, 3, '#5a5a50'); px(W - 7, Ht - 17, 1, 5, '#8a8a80'); px(4, Ht - 14, 8, 2, '#e8dccc'); px(13, Ht - 14, 6, 2, '#a89c88');
    lights.push({ x: W - 9, y: Ht - 16, w: 5, h: 4, kind: 'warm', ph: b.seed || 1 });
  }
  // the Scheduler: a clock the size of a building, its face the crontab
  function core(g, W, Ht, Hf, b, lights) {
    var px = P(g), cx0 = W / 2, cy0 = Ht / 2 + 2, R0 = Math.min(W, Ht) / 2 - 3;
    px(0, Ht - 6, W, 6, '#0a0a0c'); px(0, Ht - 6, W, 1, '#ffffff');
    g.fillStyle = '#050506'; g.beginPath(); g.arc(cx0, cy0, R0, 0, 7); g.fill();
    for (var r = R0; r > 4; r -= 6) { g.strokeStyle = 'rgba(255,255,255,' + (r === R0 ? .9 : .25) + ')'; g.beginPath(); g.arc(cx0, cy0, r, 0, 7); g.stroke(); }
    for (var k = 0; k < 24; k++) { var a = k / 24 * Math.PI * 2, r1 = R0 - (k % 6 === 0 ? 7 : 3); g.strokeStyle = '#ffffff'; g.beginPath(); g.moveTo(cx0 + Math.cos(a) * r1, cy0 + Math.sin(a) * r1); g.lineTo(cx0 + Math.cos(a) * (R0 - 1), cy0 + Math.sin(a) * (R0 - 1)); g.stroke(); }
    var lbl = b.sign || '0 0 * * 1'; px(cx0 - textW(lbl) / 2 - 2, cy0 + R0 / 2 - 2, textW(lbl) + 4, 8, '#000000'); text(g, lbl, Math.round(cx0 - textW(lbl) / 2), cy0 + R0 / 2, '#ffffff');
    lights.push({ x: cx0, y: cy0, kind: 'clock' }); lights.push({ x: cx0 - 1, y: cy0 - 1, kind: 'blink', ph: 3 });
  }
  // a daemon: a pylon that hums and blinks while it waits for its turn
  function daemon(g, W, Ht, Hf, b, lights) {
    var px = P(g), x0 = W / 2 - 5;
    px(x0, 4, 10, Ht - 6, '#08080a'); px(x0, 4, 10, 1, '#ffffff'); px(x0, 4, 1, Ht - 6, '#5a5a66');
    for (var y = 8; y < Ht - 6; y += 4) px(x0 + 3, y, 4, 1, 'rgba(255,255,255,.3)');
    if (b.sign) text(g, b.sign, Math.round(W / 2 - textW(b.sign) / 2), Ht - 1 - 6, '#ffffff');
    lights.push({ x: x0 + 2, y: 8, w: 6, h: Ht - 16, kind: 'leds', ph: b.seed || 2 });
  }
  PAINT.shelf = shelf; PAINT.robot = robot; PAINT.desk = desk; PAINT.core = core; PAINT.daemon = daemon;

  var backdrop3 = backdrop;
  backdrop = function (cx, theme, t, W, H, hy) {
    if (theme !== 'stacks' && theme !== 'ring0') return backdrop3(cx, theme, t, W, H, hy);
    var px = P(cx);
    if (theme === 'stacks') {
      cx.fillStyle = '#0a0907'; cx.fillRect(0, 0, W, hy);
      for (var d = 3; d >= 0; d--) { var sc2 = 1 - d * .2, sh = Math.round(hy * sc2), col = ['#2a2520', '#221e1a', '#1a1714', '#13110e'][d]; for (var s2 = 0; s2 < W; s2 += Math.round(26 * sc2)) { px(s2, hy - sh, Math.round(20 * sc2), sh, col); for (var y2 = hy - sh + 3; y2 < hy - 2; y2 += Math.max(3, Math.round(6 * sc2))) px(s2 + 1, y2, Math.round(18 * sc2), 1, 'rgba(216,204,184,' + (.25 - d * .05) + ')'); } }
      for (var m = 0; m < 16; m++) { var my = (hs(m * 7) * hy + t * (2 + m % 3)) % hy; px(hs(m * 3) * W, my, 1, 1, 'rgba(255,236,204,.5)'); }
      var fg = cx.createLinearGradient(0, hy, 0, H); fg.addColorStop(0, '#2a2420'); fg.addColorStop(1, '#0c0a08'); cx.fillStyle = fg; cx.fillRect(0, hy, W, H - hy);
      px(0, hy, W, 1, 'rgba(216,204,184,.6)');
      for (var j = -12; j <= 12; j++) { cx.strokeStyle = 'rgba(184,164,140,' + (.12 - Math.abs(j) * .006) + ')'; cx.beginPath(); cx.moveTo(W / 2 + j * 12 + .5, hy); cx.lineTo(W / 2 + j * 40 + .5, H); cx.stroke(); }
      return;
    }
    cx.fillStyle = '#000000'; cx.fillRect(0, 0, H > 0 ? W : 0, H);
    var ox = W / 2, oy = hy + 6;
    for (var r = 8; r < W; r += 14) { cx.strokeStyle = 'rgba(255,255,255,' + Math.max(.04, .3 - r * .0012) + ')'; cx.beginPath(); cx.ellipse(ox, oy, r, r * .45, 0, 0, 7); cx.stroke(); }
    var a3 = t * .6; cx.strokeStyle = '#ffffff'; cx.beginPath(); cx.moveTo(ox, oy); cx.lineTo(ox + Math.cos(a3) * 70, oy + Math.sin(a3) * 70 * .45); cx.stroke();
    var a4 = t * .05; cx.strokeStyle = 'rgba(255,255,255,.6)'; cx.beginPath(); cx.moveTo(ox, oy); cx.lineTo(ox + Math.cos(a4) * 46, oy + Math.sin(a4) * 46 * .45); cx.stroke();
    for (var q = 0; q < 9; q++) { var z = (q + (t * .25) % 1) / 9, yz = Math.floor(hy + (H - hy) * z * z) + .5; cx.strokeStyle = 'rgba(255,255,255,' + (.03 + z * .16) + ')'; cx.beginPath(); cx.moveTo(0, yz); cx.lineTo(W, yz); cx.stroke(); }
  };

  /* =================== THE WATERWORKS: the cooling plant under the Line =================== */
  THEMES.water = { g0: '#0d1012', g1: '#151a1d', dot: '#24292d', road: '#1a1f22', edge: '#b8c4cc' };
  var floorX4 = floorX, roadX4 = roadX, fieldX4 = fieldX, voidX4 = voidX, wallX4 = wallX;
  floorX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'water') {   // steel grating over the dark
      px(X, Y, TS, TS, '#14181b'); for (var g = 1; g < TS; g += 3) { px(X + g, Y, 1, TS, '#0a0c0e'); px(X, Y + g, TS, 1, '#0a0c0e'); }
      px(X, Y, TS, 1, '#2a3136'); if (hs(x * 9 + y * 5) > .85) px(X + 5, Y + 6, 4, 3, 'rgba(120,150,160,.12)');
      return true;
    }
    return floorX4(px, theme, X, Y, x, y, tile);
  };
  roadX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'water') { px(X, Y, TS, TS, '#20272b'); px(X + 1, Y, 1, TS, '#c8d4dc'); px(X + TS - 2, Y, 1, TS, '#c8d4dc'); for (var r = 2; r < TS; r += 4) px(X + 2, Y + r, TS - 4, 1, '#2e373c'); return true; }   // a catwalk over the channel
    return roadX4(px, theme, X, Y, x, y, tile);
  };
  fieldX = function (px, theme, X, Y, x, y) {
    if (theme === 'water') { px(X, Y, TS, TS, '#14181b'); px(X + 2, Y + 4, 11, 6, '#0b1418'); px(X + 3, Y + 5, 6, 1, 'rgba(200,220,230,.35)'); px(X + 4, Y + 8, 7, 1, 'rgba(200,220,230,.15)'); return true; }   // puddles from the leaks
    return fieldX4(px, theme, X, Y, x, y);
  };
  voidX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'water') {   // the cooling channel
      px(X, Y, TS, TS, '#071014'); for (var w = 2; w < TS; w += 4) px(X + ((x + w) % 5), Y + w, 9, 1, 'rgba(150,190,205,' + (.08 + hs(x * 3 + w + y) * .14) + ')');
      if (tile(x, y - 1) !== '~') { px(X, Y, TS, 3, '#3a4247'); px(X, Y, TS, 1, '#c8d4dc'); }
      if (tile(x, y + 1) !== '~') px(X, Y + TS - 2, TS, 2, '#2a3136');
      return true;
    }
    return voidX4(px, theme, X, Y, x, y, tile);
  };
  wallX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'water') { px(X, Y, TS, TS, '#0c0f11'); px(X, Y + 3, TS, 8, '#2a3136'); px(X, Y + 3, TS, 1, '#8a98a2'); px(X, Y + 10, TS, 1, '#151a1d'); if (x % 4 === 0) { px(X + 5, Y + 1, 4, 12, '#3a4247'); px(X + 5, Y + 1, 4, 1, '#b8c4cc'); } return true; }   // pipe runs
    return wallX4(px, theme, X, Y, x, y, tile);
  };
  var paintSky4 = paintSky;
  paintSky = function (g, theme, w, pad) { return paintSky4(g, theme === 'water' ? 'undercroft' : theme, w, pad); };

  // a pump house: a great wheel, a pressure gauge, and a door Marisol has opened ten thousand times
  function pump(g, W, Ht, Hf, b, lights) {
    var px = P(g), top = Ht - Hf;
    px(0, top, W, Hf, '#12171a'); px(0, top, W, 1, '#b8c4cc'); px(0, top, 1, Hf, '#6a7880');
    px(0, top - 6 > 0 ? top - 6 : 0, W, 6, '#1a2024'); px(0, top - 6 > 0 ? top - 6 : 0, W, 1, '#8a98a2');
    var cx0 = 16, cy0 = top + 16; g.strokeStyle = '#c8d4dc'; g.beginPath(); g.arc(cx0, cy0, 10, 0, 7); g.stroke();
    for (var s2 = 0; s2 < 6; s2++) { var a = s2 / 6 * Math.PI * 2; g.beginPath(); g.moveTo(cx0, cy0); g.lineTo(cx0 + Math.cos(a) * 10, cy0 + Math.sin(a) * 10); g.stroke(); }
    px(W - 22, top + 6, 14, 14, '#0a0d0f'); g.strokeStyle = '#8a98a2'; g.beginPath(); g.arc(W - 15, top + 13, 6, 0, 7); g.stroke();
    if (b.sign) { var tw2 = textW(b.sign); px(W - tw2 - 7, Ht - 12, tw2 + 4, 8, '#e8eef2'); text(g, b.sign, W - tw2 - 5, Ht - 10, '#0a0d0f'); }
    if (b.door != null) { var dx = b.door * TS + 3; px(dx, Ht - 14, 10, 14, '#050607'); px(dx, Ht - 14, 10, 1, '#c8d4dc'); }
    lights.push({ x: W - 16, y: top + 10, kind: 'monitor', ph: b.seed || 1 }); lights.push({ x: cx0 - 6, y: cy0 - 1, kind: 'clock' });
  }
  // the reservoir tank, its sight glass showing how full the city runs
  function tank(g, W, Ht, Hf, b, lights) {
    var px = P(g);
    px(4, 6, W - 8, Ht - 8, '#141a1d'); px(4, 6, 1, Ht - 8, '#b8c4cc'); px(W - 5, 6, 1, Ht - 8, '#2a3136');
    g.fillStyle = '#1a2024'; g.beginPath(); g.ellipse(W / 2, 6, W / 2 - 4, 5, 0, 0, 7); g.fill(); g.strokeStyle = '#c8d4dc'; g.beginPath(); g.ellipse(W / 2, 6, W / 2 - 4, 5, 0, 0, 7); g.stroke();
    for (var r = 14; r < Ht - 4; r += 10) px(4, r, W - 8, 1, '#2a3136');
    px(W / 2 - 3, 14, 6, Ht - 24, '#05080a'); px(W / 2 - 3, 14 + Math.floor((Ht - 24) * .35), 6, Math.floor((Ht - 24) * .65), 'rgba(140,180,196,.45)');
    text(g, 'RESERVOIR', Math.round(W / 2 - textW('RESERVOIR') / 2), Ht - 10, '#c8d4dc');
    lights.push({ x: W / 2 - 3, y: 14, w: 6, h: Ht - 24, kind: 'board' });
  }
  // the control room: a long window of screens, mostly asleep
  function control(g, W, Ht, Hf, b, lights) {
    var px = P(g);
    px(0, 2, W, Ht - 2, '#101417'); px(0, 2, W, 1, '#c8d4dc');
    px(3, 6, W - 6, Ht - 14, '#05080a'); for (var sx = 5; sx < W - 8; sx += 10) { px(sx, 8, 8, 6, hs(sx) > .5 ? '#c8d8e0' : '#1a2228'); }
    text(g, b.sign || 'CONTROL', 5, Ht - 7, '#e8eef2');
    if (b.door != null) { var dx = b.door * TS + 3; px(dx, 0, 10, 4, '#050607'); px(dx, 4, 10, 1, '#ffffff'); }
    lights.push({ x: 5, y: 8, w: W - 12, h: 6, kind: 'screen' });
  }
  PAINT.pump = pump; PAINT.tank = tank; PAINT.control = control;
  var backdrop4 = backdrop;
  backdrop = function (cx, theme, t, W, H, hy) {
    if (theme !== 'water') return backdrop4(cx, theme, t, W, H, hy);
    var px = P(cx);
    cx.fillStyle = '#05080a'; cx.fillRect(0, 0, W, hy);
    for (var p2 = 0; p2 < 4; p2++) { var py = 8 + p2 * 13; px(0, py, W, 5, '#1a2024'); px(0, py, W, 1, '#6a7880'); for (var f = 20 + p2 * 7; f < W; f += 60) px(f, py - 1, 4, 7, '#2a3136'); }
    for (var tk = 0; tk < 4; tk++) { var tx = 20 + tk * 82; px(tx, hy - 34, 40, 34, '#11161a'); px(tx, hy - 34, 40, 1, '#8a98a2'); px(tx + 18, hy - 28, 4, 22, 'rgba(140,180,196,.3)'); }
    var fg = cx.createLinearGradient(0, hy, 0, H); fg.addColorStop(0, '#0e1a1f'); fg.addColorStop(1, '#03070a'); cx.fillStyle = fg; cx.fillRect(0, hy, W, H - hy);
    px(0, hy, W, 1, 'rgba(200,220,230,.55)');
    for (var q = 0; q < 10; q++) { var z = (q + (t * .3) % 1) / 10, yz = Math.floor(hy + (H - hy) * z * z) + .5; cx.strokeStyle = 'rgba(150,190,205,' + (.04 + z * .18) + ')'; cx.beginPath(); cx.moveTo(0, yz + Math.sin(t + q) * 1.5); cx.lineTo(W, yz - Math.sin(t + q) * 1.5); cx.stroke(); }
  };

  /* =================== THE REGISTRY: where the city keeps track of who exists =================== */
  THEMES.registry = { g0: '#b8b8be', g1: '#c4c4ca', dot: '#d0d0d6', road: '#2a2a30', edge: '#ffffff' };
  var floorX5 = floorX, roadX5 = roadX, fieldX5 = fieldX, wallX5 = wallX;
  floorX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'registry') {   // marble, polished by two million queues
      px(X, Y, TS, TS, (x + y) % 2 ? '#c6c6cc' : '#b4b4ba'); px(X, Y, TS, 1, 'rgba(255,255,255,.35)');
      if (hs(x * 7 + y * 11) > .6) { px(X + 2 + Math.floor(hs(x + y) * 8), Y + 3, 5, 1, 'rgba(120,120,130,.25)'); px(X + 6, Y + 4, 4, 1, 'rgba(120,120,130,.2)'); }   // veins
      return true;
    }
    return floorX5(px, theme, X, Y, x, y, tile);
  };
  roadX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'registry') { px(X, Y, TS, TS, '#26262c'); var vert = tile(x - 1, y) !== '=' && tile(x + 1, y) !== '='; if (vert) { px(X + 1, Y, 1, TS, '#9a9aa4'); px(X + TS - 2, Y, 1, TS, '#9a9aa4'); } else { px(X, Y + 1, TS, 1, '#9a9aa4'); px(X, Y + TS - 2, TS, 1, '#9a9aa4'); } return true; }   // the queue carpet
    return roadX5(px, theme, X, Y, x, y, tile);
  };
  fieldX = function (px, theme, X, Y, x, y) {
    if (theme === 'registry') { px(X, Y, TS, TS, (x + y) % 2 ? '#c6c6cc' : '#b4b4ba'); for (var f = 0; f < 3; f++) { var fx = X + Math.floor(hs(x * 5 + f) * 10), fy = Y + Math.floor(hs(y * 7 + f * 3) * 10); px(fx, fy, 6, 4, '#f4f4f6'); px(fx, fy, 6, 1, '#ffffff'); px(fx + 1, fy + 2, 4, 1, '#9a9aa4'); } return true; }   // forms on the floor, never filed
    return fieldX5(px, theme, X, Y, x, y);
  };
  wallX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'registry') { px(X, Y, TS, TS, '#3a3834'); for (var d = 0; d < 2; d++) for (var c = 0; c < 2; c++) { px(X + 1 + c * 8, Y + 1 + d * 8, 6, 6, '#4a4640'); px(X + 1 + c * 8, Y + 1 + d * 8, 6, 1, '#8a8478'); px(X + 3 + c * 8, Y + 4 + d * 8, 2, 1, '#c8c0b0'); } return true; }   // index-card drawers, floor to ceiling
    return wallX5(px, theme, X, Y, x, y, tile);
  };
  var paintSky5 = paintSky;
  paintSky = function (g, theme, w, pad) {
    if (theme !== 'registry') return paintSky5(g, theme, w, pad);
    var px = P(g); g.fillStyle = '#9a9aa2'; g.fillRect(0, 0, w, pad);
    for (var a = 0; a < w; a += 48) { g.strokeStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(a + 24, pad, 24, Math.PI, 0); g.stroke(); px(a + 23, pad - 26, 2, 4, '#ffffff'); }
    px(0, pad - 2, w, 2, '#ffffff');
  };
  // the Registrar's hall: columns, steps, a pediment with the city seal
  function hall(g, W, Ht, Hf, b, lights) {
    var px = P(g), top = 10;
    g.fillStyle = '#d8d8de'; g.beginPath(); g.moveTo(2, top + 10); g.lineTo(W / 2, 0); g.lineTo(W - 2, top + 10); g.fill(); g.strokeStyle = '#ffffff'; g.beginPath(); g.moveTo(2.5, top + 10.5); g.lineTo(W / 2, .5); g.lineTo(W - 2.5, top + 10.5); g.stroke();
    g.strokeStyle = '#6a6a74'; g.beginPath(); g.arc(W / 2, top + 4, 4, 0, 7); g.stroke();
    px(2, top + 10, W - 4, 4, '#e8e8ee'); px(2, top + 14, W - 4, 1, '#8a8a94');
    for (var c = 6; c < W - 6; c += 14) { px(c, top + 15, 6, Ht - top - 25, '#dcdce2'); px(c, top + 15, 1, Ht - top - 25, '#ffffff'); px(c + 5, top + 15, 1, Ht - top - 25, '#9a9aa4'); }
    px(4, top + 15, W - 8, Ht - top - 25, 'rgba(40,40,48,.25)');
    for (var st = 0; st < 3; st++) px(2 - st, Ht - 10 + st * 3, W - 4 + st * 2, 3, st % 2 ? '#c8c8ce' : '#e0e0e6');
    if (b.sign) text(g, b.sign, Math.round(W / 2 - textW(b.sign) / 2), top + 11, '#2a2a30');
    if (b.door != null) { var dx = b.door * TS + 2; px(dx, Ht - 26, 12, 16, '#16161a'); px(dx, Ht - 26, 12, 1, '#ffffff'); lights.push({ x: dx + 1, y: Ht - 25, w: 10, h: 14, kind: 'warm', ph: 2 }); }
  }
  // a service counter: glass, a bell, a NOW SERVING sign stuck on one number
  function counter(g, W, Ht, Hf, b, lights) {
    var px = P(g);
    px(0, Ht - 18, W, 18, '#3a3834'); px(0, Ht - 18, W, 2, '#d8d0c0'); px(2, Ht - 30, W - 4, 12, 'rgba(220,230,240,.25)'); px(2, Ht - 30, W - 4, 1, '#ffffff');
    px(W - 14, Ht - 22, 4, 3, '#c8c0b0'); px(W - 13, Ht - 23, 2, 1, '#ffffff');   // the bell
    px(4, 2, W - 8, 9, '#16161a'); text(g, 'NOW SERVING', 6, 4, '#e8e8ee');
    var n = b.sign || '0001'; px(W - textW(n) - 8, Ht - 14, textW(n) + 4, 8, '#16161a'); text(g, n, W - textW(n) - 6, Ht - 12, '#ffffff');
    lights.push({ x: 4, y: 2, w: W - 8, h: 9, kind: 'flick', ph: b.seed || 1 });
  }
  // a card catalogue: a thousand small drawers, each a household
  function drawers(g, W, Ht, Hf, b, lights) {
    var px = P(g);
    px(0, 0, W, Ht, '#3a3834'); px(0, 0, W, 2, '#8a8478');
    for (var y = 4; y < Ht - 4; y += 6) for (var x = 2; x < W - 4; x += 7) { var open = hs(x * 3 + y + (b.seed || 0) * 17) > .93; px(x, y, 6, 5, open ? '#16140f' : '#4a4640'); px(x, y, 6, 1, '#8a8478'); if (!open) px(x + 2, y + 3, 2, 1, '#c8c0b0'); }
    if (b.sign) { px(W / 2 - textW(b.sign) / 2 - 2, Ht - 10, textW(b.sign) + 4, 8, '#e8e0d0'); text(g, b.sign, Math.round(W / 2 - textW(b.sign) / 2), Ht - 8, '#1a1814'); }
  }
  PAINT.hall = hall; PAINT.counter = counter; PAINT.drawers = drawers;
  var backdrop5 = backdrop;
  backdrop = function (cx, theme, t, W, H, hy) {
    if (theme !== 'registry') return backdrop5(cx, theme, t, W, H, hy);
    var px = P(cx);
    cx.fillStyle = '#a8a8b0'; cx.fillRect(0, 0, W, hy);
    for (var c = 10; c < W; c += 40) { px(c, 0, 10, hy, '#d4d4da'); px(c, 0, 1, hy, '#ffffff'); px(c + 9, 0, 1, hy, '#8a8a94'); }
    for (var y = 6; y < hy - 6; y += 8) for (var x = 22; x < W; x += 40) { px(x, y, 24, 6, '#3a3834'); px(x + 2, y + 2, 4, 1, '#c8c0b0'); px(x + 10, y + 2, 4, 1, '#c8c0b0'); px(x + 18, y + 2, 4, 1, '#c8c0b0'); }
    var fg = cx.createLinearGradient(0, hy, 0, H); fg.addColorStop(0, '#c4c4ca'); fg.addColorStop(1, '#6a6a72'); cx.fillStyle = fg; cx.fillRect(0, hy, W, H - hy);
    px(0, hy, W, 1, '#ffffff');
    for (var j = -12; j <= 12; j++) { cx.strokeStyle = 'rgba(60,60,70,' + (.18 - Math.abs(j) * .01) + ')'; cx.beginPath(); cx.moveTo(W / 2 + j * 12 + .5, hy); cx.lineTo(W / 2 + j * 40 + .5, H); cx.stroke(); }
  };

  /* =================== THE OBSERVATORY: where someone catalogues a sky that is only a texture =================== */
  THEMES.dome = { g0: '#0c0c12', g1: '#14141c', dot: '#24242e', road: '#16161e', edge: '#d8d8e8' };
  var floorX6 = floorX, roadX6 = roadX, fieldX6 = fieldX, wallX6 = wallX;
  floorX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'dome') { px(X, Y, TS, TS, (x + y) % 2 ? '#13131a' : '#101016'); px(X, Y, TS, 1, '#1c1c26'); if (hs(x * 13 + y * 3) > .82) px(X + Math.floor(hs(x + y * 7) * 14), Y + Math.floor(hs(x * 5 + y) * 14), 1, 1, 'rgba(230,230,250,.55)'); return true; }   // slate that reflects the stars
    return floorX6(px, theme, X, Y, x, y, tile);
  };
  roadX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'dome') { px(X, Y, TS, TS, '#1a1a24'); px(X, Y + 7, TS, 2, 'rgba(220,220,240,.18)'); if (x % 3 === 0) px(X + 7, Y + 7, 2, 2, '#e8e8f8'); return true; }   // a path of small lamps, kept low for the telescope
    return roadX6(px, theme, X, Y, x, y, tile);
  };
  fieldX = function (px, theme, X, Y, x, y) {
    if (theme === 'dome') { px(X, Y, TS, TS, '#101016'); for (var c = 0; c < 4; c++) px(X + Math.floor(hs(x * 5 + c) * 14), Y + Math.floor(hs(y * 9 + c) * 14), 2, 2, 'rgba(200,200,230,' + (.2 + hs(c + x) * .3) + ')'); return true; }   // fallen star-charts, glowing faintly
    return fieldX6(px, theme, X, Y, x, y);
  };
  wallX = function (px, theme, X, Y, x, y, tile) {
    if (theme === 'dome') { px(X, Y, TS, TS, '#08080c'); px(X, Y + 6, TS, 4, '#1e1e28'); px(X, Y + 6, TS, 1, '#c8c8dc'); return true; }   // a low parapet, nothing above it but sky
    return wallX6(px, theme, X, Y, x, y, tile);
  };
  var paintSky6 = paintSky;
  paintSky = function (g, theme, w, pad) {
    if (theme !== 'dome') return paintSky6(g, theme, w, pad);
    var px = P(g); g.fillStyle = '#04040a'; g.fillRect(0, 0, w, pad);
    for (var st = 0; st < w / 3; st++) px(hs(st * 3.3) * w, hs(st * 7.1) * pad, 1, 1, 'rgba(236,236,252,' + (.2 + hs(st) * .7) + ')');
    for (var sx = 0; sx < w; sx += 128) px(sx, 0, 1, pad, 'rgba(120,120,160,.18)');   // the seams where the sky texture tiles
    px(0, Math.floor(pad * .4), w, 1, 'rgba(120,120,160,.12)');
  };
  // the dome: a slit open to the fake sky, a telescope that has watched it for a year
  function dome(g, W, Ht, Hf, b, lights) {
    var px = P(g), base = Ht - 18, R0 = W / 2 - 2;
    px(2, base, W - 4, 18, '#16161e'); px(2, base, W - 4, 1, '#d8d8e8'); for (var r = base + 5; r < Ht - 2; r += 5) px(2, r, W - 4, 1, '#22222c');
    g.fillStyle = '#1e1e28'; g.beginPath(); g.arc(W / 2, base, R0, Math.PI, 0); g.fill(); g.strokeStyle = '#e8e8f6'; g.beginPath(); g.arc(W / 2, base, R0, Math.PI, 0); g.stroke();
    for (var k = 1; k < 6; k++) { var a = Math.PI + k * Math.PI / 6; g.strokeStyle = 'rgba(200,200,220,.25)'; g.beginPath(); g.moveTo(W / 2, base); g.lineTo(W / 2 + Math.cos(a) * R0, base + Math.sin(a) * R0); g.stroke(); }
    px(W / 2 - 4, base - R0 + 2, 8, R0 - 2, '#05050a');   // the slit
    g.strokeStyle = '#c8c8dc'; g.lineWidth = 3; g.beginPath(); g.moveTo(W / 2, base - 6); g.lineTo(W / 2 + 10, base - R0 - 4); g.stroke(); g.lineWidth = 1;
    if (b.sign) text(g, b.sign, 6, Ht - 12, '#e8e8f6');
    if (b.door != null) { var dx = b.door * TS + 3; px(dx, Ht - 14, 10, 14, '#05050a'); px(dx, Ht - 14, 10, 1, '#e8e8f6'); }
    lights.push({ x: W / 2 + 9, y: base - R0 - 5, kind: 'blink', ph: 4 });
  }
  PAINT.dome = dome;
  var backdrop6 = backdrop;
  backdrop = function (cx, theme, t, W, H, hy) {
    if (theme !== 'dome') return backdrop6(cx, theme, t, W, H, hy);
    var px = P(cx);
    cx.fillStyle = '#04040a'; cx.fillRect(0, 0, W, hy);
    for (var s2 = 0; s2 < 90; s2++) { var tw = .3 + .7 * Math.abs(Math.sin(t * (1 + s2 % 3) + s2)); px(hs(s2 * 3.1) * W, hs(s2 * 5.7) * hy, 1, 1, 'rgba(236,236,252,' + tw + ')'); }
    for (var sx = 0; sx < W; sx += 80) px(sx, 0, 1, hy, 'rgba(120,120,160,.15)');
    cx.fillStyle = '#0c0c14'; cx.beginPath(); cx.arc(W * .8, hy, 40, Math.PI, 0); cx.fill(); px(W * .8 + 4, hy - 56, 3, 20, '#3a3a48');
    var fg = cx.createLinearGradient(0, hy, 0, H); fg.addColorStop(0, '#16161e'); fg.addColorStop(1, '#06060a'); cx.fillStyle = fg; cx.fillRect(0, hy, W, H - hy);
    px(0, hy, W, 1, 'rgba(220,220,240,.5)');
    for (var j = -14; j <= 14; j++) { cx.strokeStyle = 'rgba(200,200,230,' + (.12 - Math.abs(j) * .006) + ')'; cx.beginPath(); cx.moveTo(W / 2 + j * 10 + .5, hy); cx.lineTo(W / 2 + j * 36 + .5, H); cx.stroke(); }
  };

  window.MeridianArt = { TS: TS, paintArea: paintArea, live: live, person: person, wagon: wagon, backdrop: backdrop, text: text, textW: textW, hs: hs };
})();
