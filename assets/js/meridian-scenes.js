/* More staged story: the climb up the tether, arriving Upstream, and companions who speak up when Vee walks somewhere that matters to them. */
(function () {
  var WD = window.MeridianWorld; if (!WD) return;
  var S = WD.steps;
  function wrap(area, fn) { var prev = S[area]; S[area] = function (G, x, y) { if (fn(G, x, y)) return; if (prev) return prev(G, x, y); }; }
  var CITIZEN = [{ hair: 'slick', body: 'suit', skin: '#d8b898', top: '#e8e8ee', pants: '#e8e8ee', shoes: '#f4f4f8' }, { hair: 'long', body: 'dress', skin: '#c89a78', top: '#f0f0f4', hairGray: 0 }, { hair: 'bun', body: 'coat', skin: '#8a5a3c', top: '#dcdce2' }];

  // the climb: first time Vee sets foot on the tether
  wrap('tether', function (G, x, y) {
    var f = G.f; if (f.climbSeen) return false; f.climbSeen = 1;
    var p = G.party();
    G.scene([
      { shake: 1, wait: 800 },
      { say: ['', ['The wind on the tether isn’t wind. It’s the sound of forty-one thousand tonnes of cable remembering everything that went up it.', 'Below, Meridian. Every window Vee has relit is a dot of light down there. There are more of them than he expected.']] },
      { face: 'down' }, { wait: 700 }, { face: 'up' },
      { say: ['Vee', ['A year ago this was a one-way trip.']] },
      p.length ? { say: [WD.companions[p[0]].name, [{ kes: 'Race you to the top. Kidding. Don’t race. Please don’t race on this.', odessa: 'If you fall, I’m not catching you. I’m catching what’s left of you. Which is worse.', piper: 'Folks, we are LIVE from the tether, and I would like everyone to know I am not looking down.', moth: '…the cable sings. Hear it? It’s in a minor key.', rook: 'I’ll take the outside. Always take the outside on a climb.', sable: 'The first builders bolted these rungs by hand. I have their names. I’ll read them to you as we go.', juni: 'Vee. VEE. The stars are closer. They are still fake. They are CLOSER.', ves: 'Corvin rode the Lift up this. He never once looked out of the window. I checked.' }[p[0]] || '…']] } : { wait: 1 },
      { say: ['', ['Vee starts to climb.']] }
    ]);
    return true;
  });

  // Upstream: the first step into the owners' world
  wrap('upstream', function (G, x, y) {
    var f = G.f; if (f.upSeen) return false; f.upSeen = 1;
    G.scene([
      { flash: 1.3, wait: 900 },
      { say: ['', ['Upstream is very bright and very quiet. The streets are clean the way rendered things are clean: nothing has ever been dropped on them.', 'Past the first row of buildings, the city stops being finished. Grey boxes. Placeholder trees. Four hundred floors under construction, forever.']] },
      { actor: 'cur1', p: CITIZEN[0], name: 'Resident', at: [-6, 1], dir: 'right' },
      { actor: 'cur2', p: CITIZEN[1], name: 'Resident', at: [6, 1], dir: 'left' },
      { walk: 'cur1', to: [-1, 1], rel: 1 }, { walk: 'cur2', to: [2, 1], rel: 1 },
      { face: 'vee', who: 'cur1' }, { face: 'vee', who: 'cur2' },
      { say: ['Resident', ['…You’re from down there. I can tell. You’re rendered at a lower resolution.', 'Is it true the lights are back on? My mother is still down there. She was on the other list.']] },
      { say: ['Vee', ['The lights are back on. Which district?']] },
      { say: ['Resident', ['Halflight. Tower nine.', '…Don’t tell her I asked. She’ll think I’m coming home.', 'I might be.']] },
      { leave: 'cur1' }, { leave: 'cur2' },
      { say: ['', ['Vee writes it down: Halflight, tower nine. He has a list too, now. It’s a different kind.']] }
    ]);
    return true;
  });

  // companions speak up when Vee brings them somewhere that matters to them, so their stories are easy to find
  var NUDGE = {
    kes: ['concourse', 'Kes: This was my route, you know. …Not now. Ask me when we’re both a bit stronger.'],
    odessa: ['halflight', 'Dr. Odessa: There’s someone in this district I keep meaning to check on. When you’re stronger. I don’t want to drag you into it yet.'],
    piper: ['upper', 'Piper: The big transmitter’s up here. Someday I’m going to say something into it that matters. Not today. My voice isn’t ready.'],
    moth: ['undercroft', 'Moth: …this is where my sister worked. There’s something down here I have to deal with. Later. When we can.'],
    rook: ['bastion', 'Rook: My old captain used to inspect this gate. If she ever comes back down, I’ll need you there.'],
    sable: ['stacks', 'Sable: Some of these shelves are me. I’ll explain when you’re ready to hear something hard.'],
    juni: ['observatory', 'Juni: I’m working on a theory about the sky. It’s not a happy one. Ask me when we’re both braver.'],
    ves: ['anchor', 'Ves: Something in me pulls toward this place. I don’t like it. Not yet, Vee. Not until we’re strong enough.']
  };
  Object.keys(NUDGE).forEach(function (id) {
    var area = NUDGE[id][0];
    wrap(area, function (G) {
      var f = G.f, arc = WD.arcs && WD.arcs[id];
      if (f['arc_' + id] || f['nudge_' + id] || G.party().indexOf(id) < 0 || !arc || G.save.lvl >= arc.lv) return false;
      f['nudge_' + id] = 1; G.say('', [NUDGE[id][1], '(Their story will start here once Vee is level ' + arc.lv + '.)']); return true;
    });
  });
})();

/* Out on the Sprawl: a wandering merchant, a rare glitch that roams the country, and records on the islands that tie back to Mara */
(function () {
  var WD = window.MeridianWorld; if (!WD || !WD.areas.sprawl) return;
  var SA = WD.areas.sprawl, G2 = WD.gear;
  G2.fieldguide = { slot: 'acc', name: 'Field Guide', hp: 80, crit: .06, desc: 'Every bug in Meridian, drawn and named in Vee’s own hand. Knowing a thing is half of beating it.' };
  G2.compass = { slot: 'acc', name: 'Wayfarer’s Compass', hp: 60, stealth: .3, desc: 'Points away from trouble. Bugs find Vee less often while he wears it.' };
  G2.oar = { slot: 'weapon', name: 'Packet Oar', atk: 58, crit: .05, desc: 'Ada’s spare. Carved from a decommissioned server blade. Rows nothing; hits hard.' };
  // the merchant moves between four camps; which one depends on the day
  var CAMPS = [[40, 22], [86, 60], [22, 56], [70, 76]], day = Math.floor(Date.now() / 86400000) % CAMPS.length, camp = CAMPS[day];
  for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var row = SA.map[camp[1] + dy]; if (row) SA.map[camp[1] + dy] = row.slice(0, camp[0] + dx) + (dx === 0 && dy === 0 ? '.' : (row.charAt(camp[0] + dx) === 'M' || row.charAt(camp[0] + dx) === '~' || row.charAt(camp[0] + dx) === 'r' ? '.' : row.charAt(camp[0] + dx))) + row.slice(camp[0] + dx + 1); }
  SA.npcs.push({ id: 'merchant', p: { hair: 'hood', body: 'coat', skin: '#6b4a32', top: '#4a4a52' }, x: camp[0], y: camp[1], name: 'Tamsin', look: 'echo', h: 13, solid: 1, still: 1 });
  WD.talk.merchant = function (G) {
    var f = G.f, stock = [
      { label: 'Antivirus x2 · 1 megabyte', cost: ['mb', 1], fn: function () { G.give('av', 2); } },
      { label: 'Gigabyte · 3 megabytes', cost: ['mb', 3], fn: function () { G.give('gb', 1); } },
      { label: 'Wayfarer’s Compass · 2 gigabytes', cost: ['gb', 2], once: 'compass', fn: function () { G.giveGear('compass'); } }
    ];
    var opts = stock.filter(function (o) { return !(o.once && G.ownsGear(o.once)); }).map(function (o) {
      return { label: o.label, fn: function () { if (!G.spend(o.cost[0], o.cost[1])) return G.say('Tamsin', ['You’re short. I don’t do credit. Credit is how the Lift happened.']); o.fn(); G.say('Tamsin', ['Pleasure. Mind the wastes on your way out.']); } };
    }).concat([{ label: 'Just talking', fn: function () { G.say('Tamsin', [['I move camp every day. If you can’t find me, I’m somewhere else. That’s the business model.', 'I sold umbrellas to people waiting for the Lift. Then I sold them back to people who’d stopped waiting.', 'There’s a glitch that wanders the plains out here. Pays well, if you can catch it. Nobody can.'][Math.floor(Math.random() * 3)]]); } }, { label: 'Leave', fn: null }]);
    G.say('Tamsin', f.metTamsin ? ['Back again. What’ll it be?'] : (f.metTamsin = 1, ['A customer! On the Sprawl! Sit down before you fall down.', 'I’m Tamsin. I trade in data, and the occasional thing that fell off the Lift. What do you need?']), opts);
  };
  // the glitch: it roams the plains; catch it and it pays
  WD.bosses.glitch = { kind: 'heisenbug', name: 'The Wandering Glitch', lv: 30, hp: 1400, atk: [40, 55], xp: 9000, move: 'flickers into the last place Vee looked', sc: 4 };
  WD.bossMech = WD.bossMech || {}; WD.bossMech.glitch = { counter: 2, status: ['daze'] };
  var gspot = null; for (var gt = 0; gt < 400 && !gspot; gt++) { var gx = 12 + Math.floor(Math.random() * 96), gy = 12 + Math.floor(Math.random() * 66), r0 = SA.map[gy]; if (r0 && ',f'.indexOf(r0.charAt(gx)) >= 0 && ',f.='.indexOf(r0.charAt(gx + 1)) >= 0 && ',f.='.indexOf(r0.charAt(gx - 1)) >= 0) gspot = [gx, gy]; }
  gspot = gspot || [50, 50];
  SA.npcs.push({ id: 'glitch', p: { hair: 'bald', skin: '#e8e8f0', top: '#f4f4f8', pants: '#f4f4f8', shoes: '#f4f4f8' }, x: gspot[0], y: gspot[1], name: '???', look: 'holo', flick: 1 });
  WD.talk.glitch = function (G) {
    G.say('', ['Something stands in the grass that the renderer can’t decide on. A person, a bug, a smear of white. It looks at Vee from three places at once.'], [{ label: 'Catch it', fn: function () {
      G.boss('glitch', function () { G.f.glitches = (G.f.glitches || 0) + 1; G.give('gb', 2); G.say('', ['The Glitch resolves, for one frame, into a perfectly ordinary person. Then it’s gone. Two gigabytes lie in the grass where it stood.', 'Glitches caught: ' + G.f.glitches + '. It will be somewhere else next time.']); var n = SA.npcs.filter(function (q) { return q.id === 'glitch'; })[0]; if (n) n.hide = 1; });
    } }, { label: 'Leave it be', fn: null }]);
  };
  // records on the islands: Mara came out here before the city opened
  var LOGS = {
    S1: ['A survey stake, old as the city. Tied to it, a note in Mara Quell’s handwriting:', 'Before Meridian. Day 1 of the survey. Nothing out here but sea and static. I am going to put two million people on this.', 'I’ll start with a bench.'],
    S2: ['Carved into the lighthouse door: M.Q. + THE CITY.', 'Under it, newer: SHE CAME OUT HERE TO THINK. SO DID I. — W.'],
    S3: ['A weatherproof box. Inside, Mara’s first sketch of the Plaza. The fountain is in it. So is a bench, circled twice, labeled: LEFT SIDE FOR WHOEVER IS WAITING.'],
    S4: ['A buoy, still blinking, still broadcasting on a band no radio in the city listens to:', 'IF THIS IS FOUND, THE CITY IS STILL HERE. IF IT IS NOT FOUND, THE CITY IS STILL HERE. BOTH ARE TRUE. — M.']
  };
  var ISLE = [[8, 10], [112, 58], [10, 44], [60, 86]];
  SA.logs = SA.logs || {};
  ISLE.forEach(function (c, i) { var x = c[0] + 1, y = c[1]; var row = SA.map[y]; if (!row) return; SA.map[y] = row.slice(0, x) + 'o' + row.slice(x + 1); SA.logs[x + ',' + y] = 'S' + (i + 1); WD.logs['S' + (i + 1)] = LOGS['S' + (i + 1)]; });
})();
