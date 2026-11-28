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
