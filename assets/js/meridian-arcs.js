/* Companion stories: one turning point each, staged in the place it belongs to, and only if they're walking with Vee when he gets there. Settling it unlocks their fourth skill. */
(function () {
  var WD = window.MeridianWorld; if (!WD) return;
  var H = WD.heroes, B = WD.bosses, C = WD.companions;
  WD.bossMech = WD.bossMech || {};

  // the people the stories bring in
  H.dispatcher = { id: 'dispatcher', hair: 'slick', skin: '#c89a78', top: '#3a3a44', pants: '#2b2b30', shoes: '#141418', acc: { coat: 1, visor: 1, belt: 1 } };
  H.hale = { id: 'hale', hair: 'bald', skin: '#8a5a3c', top: '#e0e0e4', pants: '#2b2b30', hairGray: 1, acc: { glasses: 1, coat: 1, beard: 1 } };
  H.lark = { id: 'lark', hair: 'beanie', skin: '#8a5a3c', top: '#5a5a62', pants: '#3a3a40', plateLight: 0, acc: { helm: 1, armor: 1, gauntlets: 1, glow: 1, pack: 1 } };
  H.ostrava = { id: 'ostrava', hair: 'buzz', skin: '#3e2618', top: '#2a2a30', pants: '#2b2b30', shoes: '#141418', acc: { armor: 1, gauntlets: 1, pauldrons: 1, scar: 1, cape: 1, blade: 1 } };
  H.ves_lost = { id: 'ves_lost', hair: 'locs', skin: '#563520', top: '#0c0c10', pants: '#0c0c10', shoes: '#0c0c10', acc: { phones: 1, coat: 1, glow: 1, mask: 1 } };

  B.arc_dispatch = { kind: 'dispatcher', name: 'The Dispatcher', lv: 20, hp: 1900, atk: [34, 44], xp: 2600, move: 'stamps Vee RETURN TO SENDER', sc: 1 };
  B.arc_fever = { kind: 'virus', name: 'The Fever', lv: 18, hp: 1700, atk: [30, 40], xp: 2200, move: 'burns through a memory Hale was holding', sc: 4 };
  B.arc_silencer = { kind: 'kpanic', name: 'The Silencer', lv: 24, hp: 2300, atk: [40, 52], xp: 3400, move: 'broadcasts a wall of dead air', sc: 4 };
  B.arc_lark = { kind: 'lark', name: 'LARK-1', lv: 22, hp: 2100, atk: [37, 48], xp: 3000, move: 'swings a wrench it was built to fix things with', sc: 1 };
  B.arc_ostrava = { kind: 'ostrava', name: 'Captain Ostrava', lv: 26, hp: 2600, atk: [46, 60], xp: 4200, move: 'files Rook’s desertion with the flat of her blade', sc: 1 };
  B.arc_purge = { kind: 'rogue_gc', name: 'The Purge', lv: 28, hp: 2900, atk: [52, 66], xp: 5200, move: 'decides a shelf of records was never needed', sc: 4 };
  B.arc_skybox = { kind: 'hashcoll', name: 'The Skybox', lv: 24, hp: 2300, atk: [40, 52], xp: 3400, move: 'paints over a star', sc: 4 };
  B.arc_backdoor = { kind: 'ves_lost', name: 'Ves (backdoored)', lv: 44, hp: 4200, atk: [92, 112], xp: 22000, move: 'runs Corvin’s last instruction through Ves’s hands', sc: 1 };
  WD.bossMech.arc_dispatch = { counter: 3, status: ['slow'] };
  WD.bossMech.arc_fever = { status: ['psn'], phase: 1 };
  WD.bossMech.arc_silencer = { status: ['sil'], firewall: 1 };
  WD.bossMech.arc_lark = { counter: 3, summon: ['bytebug', 'bytebug'] };
  WD.bossMech.arc_ostrava = { counter: 2, phase: 1, status: ['weak'] };
  WD.bossMech.arc_purge = { firewall: 1, phase: 1, status: ['sil', 'weak'] };
  WD.bossMech.arc_skybox = { status: ['daze'], summon: ['moth', 'moth'] };
  WD.bossMech.arc_backdoor = { counter: 2, phase: 1, firewall: 1, status: ['sil', 'daze'] };

  var ARCS = {
    kes: { area: 'concourse', lv: 18, hint: 'Walk the Concourse with Kes, level 18 or higher.', story: 'The Last Delivery', scene: function (G) { return [
      { say: ['Kes', ['…This was my route. Concourse to Halflight, twelve runs a day. I could do it with my eyes shut.', 'Did, once. On a bet.']] },
      { actor: 'dispatcher', hero: 'dispatcher', name: 'The Dispatcher', at: [6, 0], dir: 'left' },
      { walk: 'dispatcher', toVee: 1, face: 'kes' },
      { actor: 'kes', hero: 'kes', at: [-1, 0] },
      { face: 'dispatcher', who: 'kes' },
      { say: ['The Dispatcher', ['Courier K-E-S. You have an undelivered package. It has been undelivered for three hundred and forty days.', 'The Guild does not forget a package.']] },
      { say: ['Kes', ['The Guild’s Upstream. There is no Guild down here. There’s just me and the road.']] },
      { say: ['The Dispatcher', ['Then the road can take you to the Lift. Sealed parcel, priority one. Deliver it, and there’s a seat for you at the top.', 'One seat. Yours.']] },
      { shake: .3 },
      { say: ['Kes', ['…', 'Vee. What do I do.'], [{ label: 'Open the package', fn: null }, { label: 'It’s your call, Kes', fn: null }]] },
      { say: ['Kes', ['…No. I’m opening it.', 'Huh.', 'It’s a list. Every tower in Halflight, a date beside each one. A reclaim schedule.', 'They wanted me to carry the eviction notice for my own street.']] },
      { say: ['The Dispatcher', ['Contents are not the courier’s concern.']] },
      { say: ['Kes', ['Everything on my route is my concern. Every door. Every name.', 'Return to sender.']] },
      { boss: 'arc_dispatch' },
      { walk: 'kes', path: 'R', face: 'vee' },
      { say: ['Kes', ['I tore it up. Every page. Halflight’s off the schedule, at least until they print another one.', 'You know what the worst part is? For one second I wanted the seat.', 'Don’t tell anyone. Especially not Piper. She’d put it on the air.', '…Thanks for not deciding for me.']] },
      { say: ['', ['Kes’s story is settled. She learns LAST MILE: three hits that leave a bug exposed.']] }
    ]; } },
    odessa: { area: 'halflight', lv: 16, hint: 'Visit Halflight with Dr. Odessa, level 16 or higher.', story: 'Do No Harm', scene: function (G) { return [
      { actor: 'odessa', hero: 'odessa', at: [1, 0], dir: 'left' },
      { actor: 'hale', hero: 'hale', name: 'Dr. Hale', at: [3, 1], dir: 'left' },
      { say: ['Dr. Hale', ['Odessa. Thank goodness. I’ve been… I’ve been looking for the clinic. It was right here.', 'I can’t remember the clinic. I can’t remember… was I your teacher? I was, wasn’t I?']] },
      { say: ['Dr. Odessa', ['Hale. Sit down. Sit DOWN.', 'Vee, he’s corrupted. Something is eating his memory from the inside, file by file.', 'He taught me everything. Triage, sutures, how to lie to patients kindly.']] },
      { flash: .5 },
      { say: ['Dr. Odessa', ['I can pull it out of him. But it needs a body to land in, and the only clean one in reach is mine.'], [{ label: 'Let her do it', fn: null }, { label: 'Pull it into Vee instead', fn: null }]] },
      { say: ['Dr. Odessa', ['Don’t you dare argue with a doctor. We do it together. Hold his hand. When it comes out, we hit it with everything.']] },
      { shake: .5 },
      { boss: 'arc_fever' },
      { say: ['Dr. Hale', ['…Odessa. You grew up.', 'You were so bad at sutures. Terrible. I used to hide your homework from the others.']] },
      { say: ['Dr. Odessa', ['He remembers. He remembers I was terrible.', 'That’s the best news I’ve had in eleven months.', 'I’m going to retire. Tomorrow. Definitely tomorrow.']] },
      { remove: 'hale' },
      { say: ['', ['Dr. Odessa’s story is settled. She learns FULL RESTORE: the whole party back up and healed.']] }
    ]; } },
    piper: { area: 'upper', lv: 22, hint: 'Take Piper to the Upper Ring, level 22 or higher.', story: 'Dead Air', scene: function (G) { return [
      { actor: 'piper', hero: 'piper', at: [-1, 0], dir: 'right' },
      { say: ['Piper', ['Folks, we are LIVE from the Upper Ring, where the lawns are fake and the people are fakier—', '…Vee. My signal just died. Every frequency. All of them.']] },
      { flash: .4 },
      { say: ['', ['A tone fills the Ring. Flat, total, endless. It sounds like nobody talking, very loudly.']] },
      { say: ['Piper', ['That’s a jammer. Upstream bought every channel and is playing silence on all of them.', 'They don’t need to shut me down. They just need to make sure nobody hears.', 'I have never in my life been this quiet. I hate it. I HATE it.']] },
      { shake: .4 },
      { boss: 'arc_silencer' },
      { say: ['Piper', ['…Testing. Testing. Is this thing on?', 'It’s on. It’s ON. Meridian, it’s Piper, and I have so much to tell you.'], [{ label: 'Tell them the truth', fn: null }, { label: 'Play a song', fn: null }]] },
      { say: ['Piper', ['Here’s the truth: the Lift was never for everyone. And here’s a song, because the truth is a lot to take without one.', '…Vee. That’s the first time I’ve said something on air that I was scared of.', 'Encore?']] },
      { say: ['', ['Piper’s story is settled. She learns ENCORE: Vee is hasted and everyone’s next hit is critical.']] }
    ]; } },
    moth: { area: 'undercroft', lv: 20, hint: 'Bring Moth down to the Undercroft, level 20 or higher.', story: 'The Other Moth', scene: function (G) { return [
      { actor: 'moth', hero: 'moth', at: [1, 0], dir: 'left' },
      { say: ['Moth', ['…', '…that sound. Do you hear it?']] },
      { actor: 'lark', hero: 'lark', name: 'LARK-1', at: [5, 2], dir: 'left' },
      { walk: 'lark', toVee: 1, face: 'moth' },
      { say: ['LARK-1', ['MOTH. MOTH. YOU CAME BACK. I KEPT THE WORKSHOP CLEAN.', 'I FIXED EVERYTHING. I FIXED THE PIPES. I FIXED THE BUGS. I FIXED THE PEOPLE WHO WERE BROKEN.']] },
      { say: ['Moth', ['…my sister built it. Lark. Before the Lift took her.', 'It has her voice. It doesn’t have her… knowing when to stop.', 'It’s been “fixing” the Undercroft. The people down here are scared of it.']] },
      { say: ['LARK-1', ['YOU ARE BROKEN TOO, MOTH. YOU DON’T TALK. I CAN FIX THAT.']] },
      { shake: .4 },
      { boss: 'arc_lark' },
      { say: ['Moth', ['I’m going to switch you off now. Not forever. Just until I can teach you the part she forgot.', 'The part about leaving things alone when they work, even if they’re quiet.']] },
      { say: ['LARK-1', ['…OKAY, MOTH. GOODNIGHT, MOTH.']] },
      { remove: 'lark' },
      { say: ['Moth', ['Vee. I talk to machines because they don’t mind when I take a long time to say a thing.', 'You never minded either. So. Thank you. That’s the whole sentence.']] },
      { say: ['', ['Moth’s story is settled. Moth learns PATCH TUESDAY: tears down a firewall and a counter stance.']] }
    ]; } },
    rook: { area: 'bastion', lv: 24, hint: 'Walk Rook into the Bastion, level 24 or higher.', story: 'Desertion', scene: function (G) { return [
      { actor: 'rook', hero: 'rook', at: [-1, 0], dir: 'right' },
      { actor: 'ostrava', hero: 'ostrava', name: 'Captain Ostrava', at: [0, -5], dir: 'down' },
      { walk: 'ostrava', toVee: 1, face: 'rook' },
      { say: ['Captain Ostrava', ['Sergeant Rook. Twelve years, a perfect record. Then you vanish the night the Board leaves.', 'I came back down to collect you. That is how much you were worth.']] },
      { say: ['Rook', ['Captain.', 'I didn’t vanish. I stayed. Somebody had to keep the doors open after you locked them.']] },
      { say: ['Captain Ostrava', ['Desertion, then. Stand to attention.'], [{ label: 'Step between them', fn: null }, { label: 'Let Rook answer', fn: null }]] },
      { walk: 'rook', path: 'R', face: 'ostrava' },
      { say: ['Rook', ['No, Vee. This one’s mine.', 'Captain, I swore to protect Meridian. Not the Board. You taught me the difference. You just forgot it first.']] },
      { shake: .5 },
      { boss: 'arc_ostrava' },
      { say: ['Captain Ostrava', ['…You always did guard the left side too much.', 'Fine. I’ll file it as reassignment. Sergeant Rook, permanently posted to Meridian. Indefinitely.']] },
      { walk: 'ostrava', path: 'UUUU' },
      { remove: 'ostrava' },
      { say: ['Rook', ['She came all the way down. Twelve years, and that’s the first time she said my name like it mattered.', 'I’m still on duty, Vee. Just for the right side now.']] },
      { say: ['', ['Rook’s story is settled. He learns LAST STAND: heals half his HP and draws every attack.']] }
    ]; } },
    sable: { area: 'stacks', lv: 26, hint: 'Bring Sable into the Stacks, level 26 or higher.', story: 'What Burns', scene: function (G) { return [
      { actor: 'sable', hero: 'sable', at: [1, 0], dir: 'up' },
      { say: ['Sable', ['Smell that? Records burning. Somebody is purging the Stacks.']] },
      { flash: .6 }, { shake: .5 },
      { say: ['Sable', ['It’s moving through two shelves at once. The city’s birth records on the left. On the right…', '…my own file. Everything I am. Four thousand years of a library, written down in me.', 'There is time to save one shelf.'], [{ label: 'Save the city’s records', fn: null }, { label: 'Save Sable', fn: null }]] },
      { say: ['Sable', ['No, Vee. You know which. You always knew which.', 'An archivist who saves herself over the archive is just a hoarder with good handwriting.', 'The city’s records. Then we stop it.']] },
      { boss: 'arc_purge' },
      { say: ['Sable', ['…the city’s shelf is whole. Every birth. Every name.', 'My file is… mostly ash. I remember my first boot. I remember you. I remember a poem about a lighthouse I cannot finish anymore.', 'That’s enough. That is more than most people keep.']] },
      { say: ['Sable', ['Write it down for me, would you? The lighthouse. Someone should hold it.']] },
      { say: ['', ['Sable’s story is settled. She learns DEEP INDEX: a huge hit to every bug.']] }
    ]; } },
    juni: { area: 'observatory', lv: 22, hint: 'Visit the Observatory with Juni, level 22 or higher.', story: 'Fixed Stars', scene: function (G) { return [
      { actor: 'juni', hero: 'juni', at: [1, 0], dir: 'up' },
      { say: ['Juni', ['Vee, look. I found the edge. The sky has an EDGE. Right there. It repeats.', 'Star 4,112 is the same as star 1. And star 8,224. The renderer just… copies them.', 'I named them. All of them. I named the same star four thousand times.']] },
      { say: ['Juni', ['None of it is real. Is that the question I was supposed to be asking? Is that the last question?']] },
      { flash: .4 },
      { say: ['', ['The dome flickers. Something peels the sky back, the way you’d peel a sticker.']] },
      { boss: 'arc_skybox' },
      { walk: 'juni', path: 'D', face: 'down' },
      { say: ['Juni', ['…Vee. Look down instead.', 'The windows. Every one of them lit by somebody still here. They move. They change. Nobody copied them.'], [{ label: 'Those are stars too', fn: null }, { label: 'Name one', fn: null }]] },
      { say: ['Juni', ['That one’s Wren. That one’s the Sweeper. That one’s Kes, she’s always up too late.', 'That one’s you.', 'I have one million more questions. Most of them are about these stars. Good.']] },
      { say: ['', ['Juni’s story is settled. Juni learns SUPERNOVA: a huge hit to every bug.']] }
    ]; } },
    ves: { area: 'anchor', lv: 42, hint: 'Take Ves to the Anchor, level 42 or higher.', story: 'Backdoor', scene: function (G) { return [
      { actor: 'ves', hero: 'ves', at: [1, 0], dir: 'left' },
      { say: ['Ves', ['Vee. Something’s wrong with my hands.', 'There’s a line in me I didn’t write. Corvin left it. A trigger: when I reach the Anchor, I finish the job.']] },
      { shake: .6 }, { flash: .5 },
      { remove: 'ves' },
      { actor: 'ves_lost', hero: 'ves_lost', name: 'Ves', at: [1, 0], dir: 'left' },
      { say: ['Ves', ['RECLAIM 1205. RECLAIM 1205.', '…run, Vee… RECLAIM…']] },
      { say: ['', ['Vee could fight his way through. Or reach the line Corvin wrote, and overwrite it.'], [{ label: 'Talk him down', fn: null }, { label: 'Hold him off', fn: null }]] },
      { boss: 'arc_backdoor' },
      { remove: 'ves_lost' },
      { actor: 'ves', hero: 'ves', at: [1, 0], dir: 'left' },
      { say: ['Ves', ['…it’s gone. You found the line and you didn’t delete it. You commented it out.', 'So it’s still in me. Just not running.', 'That’s us, isn’t it. All the things Corvin wrote in us. Still there. Not running.']] },
      { say: ['Ves', ['Next time someone tells me to end a thing, I’ll ask nicely first.', 'SIGTERM. Not SIGKILL. Give it a chance to save its work.']] },
      { say: ['', ['Ves’s story is settled. Ves learns KILL -15: ends a weakened bug, or takes a fifth off a boss.']] }
    ]; } }
  };
  WD.arcs = ARCS;
  Object.keys(ARCS).forEach(function (id) { if (C[id]) { C[id].arcHint = ARCS[id].hint; C[id].story = ARCS[id].story; } });

  // wrap each district's step hook: walk in with the right companion, and their story starts
  var running = 0;
  Object.keys(ARCS).forEach(function (id) {
    var arc = ARCS[id], prev = WD.steps[arc.area];
    WD.steps[arc.area] = function (G, x, y) {
      if (!G.f['arc_' + id] && G.party().indexOf(id) >= 0 && G.save.lvl >= arc.lv && Date.now() - running > 30000) {
        running = Date.now();
        return G.scene(arc.scene(G), function () { G.f['arc_' + id] = 1; running = 0; G.note(arc.story + ' — settled.'); });
      }
      if (prev) return prev(G, x, y);
    };
  });
})();
