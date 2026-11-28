/* Afterlift's soundtrack: a tiny four-channel chiptune sequencer (two pulses, a triangle bass, noise drums), written in note strings so every track is a few lines. */
(function () {
  var AC = null, master = null, timer = null, cur = null, step = 0, nextT = 0, vol = .5, enabled = true;
  var NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function hz(n) {   // "A4", "C#5", "Eb3"; "." rest; "-" hold
    if (!n || n === '.' || n === '-') return 0;
    var m = /^([A-G])([#b]?)(\d)$/.exec(n); if (!m) return 0;
    var semi = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12;
    return 440 * Math.pow(2, (semi - 69) / 12);
  }
  function seq(s) { return s.trim().split(/\s+/); }
  // each track: bpm, steps are sixteenth notes; lead/harm/bass/drums are equal-length loops (or they wrap independently)
  var T = {
    city: { bpm: 84, swing: 0, lead: seq('A4 - . C5 E5 - D5 C5 B4 - . G4 A4 - - - . . E5 - D5 C5 B4 . C5 - B4 G4 A4 - - - F4 - . A4 C5 - B4 A4 G4 - . E4 G4 - - - E4 - G4 A4 B4 - C5 B4 A4 - - - - - . .'),
      harm: seq('. . . . E4 . . . . . . . D4 . . . . . . . E4 . . . . . . . E4 . . . . . . . C4 . . . . . . . B3 . . . . . . . C4 . . . . . . . E4 . . .'),
      bass: seq('A2 - - - A2 - - - G2 - - - G2 - - - F2 - - - F2 - - - E2 - - - E2 - - - F2 - - - F2 - - - C3 - - - C3 - - - D3 - - - E2 - - - A2 - - - A2 - - -'),
      drum: seq('k . . . h . . . s . . . h . . . k . . . h . k . s . . . h . . .'), wave: 'square', duty: .125 },
    sprawl: { bpm: 96, lead: seq('E4 - G4 A4 - . B4 - D5 - B4 A4 G4 - . . E4 - G4 A4 - . B4 - A4 - G4 E4 D4 - . . G4 - A4 B4 - . D5 - E5 - D5 B4 A4 - . . G4 - E4 D4 - . E4 - - - - - - - . .'),
      harm: seq('B3 . . . . . . . G3 . . . . . . . B3 . . . . . . . A3 . . . . . . . D4 . . . . . . . G3 . . . . . . . B3 . . . . . . . G3 . . . . . . .'),
      bass: seq('E2 - E3 - E2 - E3 - G2 - G3 - G2 - G3 - C3 - C3 - C3 - C3 - D3 - D3 - D3 - D3 -'),
      drum: seq('k . h . k . h . k . h . k . h s'), wave: 'square', duty: .25 },
    battle: { bpm: 144, lead: seq('A4 A4 . A4 C5 . A4 . G4 . E4 . G4 A4 . . A4 A4 . A4 C5 . D5 . E5 . D5 . C5 B4 . . F4 F4 . F4 A4 . F4 . E4 . C4 . E4 F4 . . G4 G4 . G4 B4 . D5 . E5 - - - G#4 - B4 -'),
      harm: seq('E4 . . . E4 . . . E4 . . . E4 . . . E4 . . . E4 . . . E4 . . . E4 . . . C4 . . . C4 . . . C4 . . . C4 . . . D4 . . . D4 . . . E4 . . . E4 . . .'),
      bass: seq('A2 A2 A3 A2 A2 A2 A3 A2 A2 A2 A3 A2 G2 G2 G3 G2 F2 F2 F3 F2 F2 F2 F3 F2 G2 G2 G3 G2 E2 E2 E3 E2'),
      drum: seq('k . h . s . h k k . h . s . h h'), wave: 'square', duty: .25 },
    boss: { bpm: 152, lead: seq('D5 . D5 . D5 . C5 . D5 . F5 . E5 . C5 . D5 . D5 . D5 . C5 . A4 - - - . . . . Bb4 . Bb4 . Bb4 . A4 . Bb4 . D5 . C5 . A4 . G4 . G4 . A4 . Bb4 . C#5 - - - . . . .'),
      harm: seq('A4 . . . A4 . . . A4 . . . A4 . . . F4 . . . F4 . . . E4 . . . E4 . . . F4 . . . F4 . . . G4 . . . G4 . . . E4 . . . E4 . . . A4 . . . A4 . . .'),
      bass: seq('D2 D3 D2 D3 D2 D3 D2 D3 D2 D3 D2 D3 C2 C3 C2 C3 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 A1 A2 A1 A2 A1 A2 A1 A2'),
      drum: seq('k . k h s . k h k . k h s . s s'), wave: 'square', duty: .125 },
    upstream: { bpm: 72, lead: seq('E5 - - - B4 - - - G#5 - - - F#5 - E5 - C#5 - - - B4 - - - A4 - - - - - - - E5 - - - B4 - - - B5 - - - A5 - G#5 - F#5 - - - E5 - - - E5 - - - - - . .'),
      harm: seq('G#4 - - - - - - - E4 - - - - - - - F#4 - - - - - - - E4 - - - - - - - G#4 - - - - - - - E4 - - - - - - - D#4 - - - - - - - E4 - - - - - - -'),
      bass: seq('E2 - - - - - - - C#3 - - - - - - - A2 - - - - - - - B2 - - - - - - -'),
      drum: seq('. . . . h . . . . . . . h . . .'), wave: 'triangle', duty: .5 },
    dungeon: { bpm: 68, lead: seq('D4 - - - . . F4 - E4 - - - . . . . D4 - - - . . A4 - G#4 - - - . . . . F4 - - - E4 - D4 - C#4 - - - . . . . D4 - - - - - - - . . . . . . . .'),
      harm: seq('. . . . . . . . . . . . . . . . A3 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .'),
      bass: seq('D2 - - - - - - - D2 - - - - - - - Bb1 - - - - - - - A1 - - - - - - -'),
      drum: seq('k . . . . . . . . . . . . . h .'), wave: 'triangle', duty: .5 },
    deep: { bpm: 80, lead: seq('C5 - . G4 - . Eb4 - . . G4 - Ab4 - G4 - . . F4 - . Eb4 - D4 - . . Eb4 - - - - - . . C5 - . G4 - . Eb4 - . . G4 - Bb4 - Ab4 - G4 - . . F4 - Eb4 - D4 - C4 - - - - - . .'),
      harm: seq('. . . . Eb4 . . . . . . . C4 . . . . . . . Ab3 . . . . . . . G3 . . . . . . . Eb4 . . . . . . . Eb4 . . . . . . . D4 . . . . . . . C4 . . .'),
      bass: seq('C2 - - - C3 - - - Ab1 - - - Ab2 - - - F1 - - - F2 - - - G1 - - - G2 - - -'),
      drum: seq('k . . h . . s . . . h . k . h .'), wave: 'square', duty: .125 },
    ending: { bpm: 66, lead: seq('C5 - - - E5 - - - G5 - - - - - E5 - F5 - - - E5 - D5 - C5 - - - - - - - A4 - - - C5 - - - F5 - - - - - E5 - D5 - - - C5 - B4 - C5 - - - - - - -'),
      harm: seq('E4 - - - - - - - E4 - - - - - - - F4 - - - - - - - E4 - - - - - - - F4 - - - - - - - A4 - - - - - - - G4 - - - - - - - E4 - - - - - - -'),
      bass: seq('C3 - - - - - - - A2 - - - - - - - F2 - - - - - - - C3 - - - - - - - F2 - - - - - - - D2 - - - - - - - G2 - - - - - - - C3 - - - - - - -'),
      drum: seq('. . . . . . . .'), wave: 'triangle', duty: .5 }
  };
  var noiseBuf = null;
  function ctx() {
    if (AC) return AC;
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    master = AC.createGain(); master.gain.value = vol * .09; master.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate * .3, AC.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return AC;
  }
  var waves = {};
  function pulse(duty) {   // a pulse wave with a chosen duty cycle, for that NES-ish bite
    if (waves[duty]) return waves[duty];
    var n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (var k = 1; k < n; k++) { re[k] = 0; im[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * duty); }
    return (waves[duty] = AC.createPeriodicWave(re, im));
  }
  function tone(f, t, len, type, duty, g0) {
    if (!f) return;
    var o = AC.createOscillator(), g = AC.createGain();
    if (type === 'square') o.setPeriodicWave(pulse(duty)); else o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(g0, t + .006); g.gain.setValueAtTime(g0 * .8, t + len * .6); g.gain.linearRampToValueAtTime(0, t + len);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + len + .02);
  }
  function drum(k, t) {
    if (k === '.' || !k) return;
    if (k === 'k') { var o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + .12); g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .14); o.connect(g); g.connect(master); o.start(t); o.stop(t + .16); return; }
    var s = AC.createBufferSource(), f = AC.createBiquadFilter(), g2 = AC.createGain(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = k === 'h' ? 7000 : 1800;
    g2.gain.setValueAtTime(k === 'h' ? .25 : .55, t); g2.gain.exponentialRampToValueAtTime(.001, t + (k === 'h' ? .04 : .12)); s.connect(f); f.connect(g2); g2.connect(master); s.start(t); s.stop(t + .15);
  }
  function lenOf(arr, i, sd) { var n = 1; while (arr[(i + n) % arr.length] === '-' && n < 16) n++; return n * sd; }
  function tick() {
    if (!cur || !AC) return;
    var tr = T[cur], sd = 60 / tr.bpm / 4;
    while (nextT < AC.currentTime + .15) {
      var L = tr.lead, Hm = tr.harm, Bs = tr.bass, Dr = tr.drum;
      var a = L[step % L.length], b = Hm[step % Hm.length], c = Bs[step % Bs.length];
      if (a !== '-') tone(hz(a), nextT, lenOf(L, step % L.length, sd) * .95, tr.wave, tr.duty, .55);
      if (b !== '-') tone(hz(b), nextT, lenOf(Hm, step % Hm.length, sd) * .9, 'square', .5, .22);
      if (c !== '-') tone(hz(c), nextT, lenOf(Bs, step % Bs.length, sd) * .9, 'triangle', .5, .7);
      drum(Dr[step % Dr.length], nextT);
      step++; nextT += sd;
    }
  }
  function play(name) {
    if (!enabled || !T[name]) { if (!enabled) stop(); return; }
    if (cur === name) return;
    if (!ctx()) return; if (AC.state === 'suspended') AC.resume();
    cur = name; step = 0; nextT = AC.currentTime + .08;
    if (!timer) timer = setInterval(tick, 40);
  }
  function stop() { cur = null; if (timer) { clearInterval(timer); timer = null; } }
  window.MeridianMusic = {
    play: play, stop: stop, tracks: Object.keys(T), now: function () { return cur; },
    volume: function (v) { vol = v; if (master) master.gain.value = vol * .09; },
    enable: function (on) { enabled = !!on; if (!on) stop(); }
  };
})();
