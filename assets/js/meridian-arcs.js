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
  WD.bossStart = WD.bossStart || {};
  WD.bossStart.arc_backdoor = function (G, foe) { if (!G.f.vesTalk) return null; foe.hp = Math.round(foe.hp * .6); return 'Vee keeps talking through the whole fight. Some of it gets through: Ves’s hands keep hesitating. (The backdoor starts at 60% HP.)'; };
  WD.bossStart.arc_fever = function (G, foe) { if (!G.f.odessaVee) return null; foe.exposed = 99; return 'The fever is inside Vee now, which means Vee knows exactly where it is. It takes extra damage the whole fight.'; };

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
      { choose: ['Kes', ['…', 'Vee. What do I do.'], [
        { label: 'Open it. Find out what you’re carrying.', fn: function (G) { G.f.kesOpen = 1; }, then: [{ say: ['Vee', ['Couriers don’t read the mail. You’re not a courier anymore. Open it.']] }, { say: ['Kes', ['…Yeah. Yeah, okay.']] }] },
        { label: 'It’s your call, Kes.', then: [{ say: ['Vee', ['It’s your route. Your call.']] }, { say: ['Kes', ['That’s the worst thing you could have said. You know that, right?', '…No. I’m opening it.']] }] }]] },
      { say: ['Kes', ['Huh.', 'It’s a list. Every tower in Halflight, a date beside each one. A reclaim schedule.', 'They wanted me to carry the eviction notice for my own street.']] },
      { say: ['The Dispatcher', ['Contents are not the courier’s concern.']] },
      { say: ['Kes', ['Everything on my route is my concern. Every door. Every name.', 'Return to sender.']] },
      { boss: 'arc_dispatch' },
      { walk: 'kes', path: 'R', face: 'vee' },
      { dyn: function (G) { return G.f.kesOpen ? ['Kes', ['I tore it up. Every page. Halflight’s off the schedule, at least until they print another one.', 'You know what the worst part is? For one second I wanted the seat.', 'Thanks for saying it out loud. I needed someone to.']] : ['Kes', ['I tore it up. Every page. Halflight’s off the schedule, at least until they print another one.', 'You know what the worst part is? For one second I wanted the seat.', 'Don’t tell Piper. She’d put it on the air.', '…Thanks for not deciding for me. Even if it was annoying.']]; } },
      { say: ['', ['Kes’s story is settled. She learns LAST MILE: three hits that leave a bug exposed.']] }
    ]; } },
    odessa: { area: 'halflight', lv: 16, hint: 'Visit Halflight with Dr. Odessa, level 16 or higher.', story: 'Do No Harm', scene: function (G) { return [
      { actor: 'odessa', hero: 'odessa', at: [1, 0], dir: 'left' },
      { actor: 'hale', hero: 'hale', name: 'Dr. Hale', at: [3, 1], dir: 'left' },
      { say: ['Dr. Hale', ['Odessa. Thank goodness. I’ve been… I’ve been looking for the clinic. It was right here.', 'I can’t remember the clinic. I can’t remember… was I your teacher? I was, wasn’t I?']] },
      { say: ['Dr. Odessa', ['Hale. Sit down. Sit DOWN.', 'Vee, he’s corrupted. Something is eating his memory from the inside, file by file.', 'He taught me everything. Triage, sutures, how to lie to patients kindly.']] },
      { flash: .5 },
      { choose: ['Dr. Odessa', ['I can pull it out of him. But it needs somewhere to land, and the only clean process in reach is mine.'], [
        { label: 'Do it. I’ll be right here.', then: [{ say: ['Vee', ['Do it. I’ll be right here when it comes out.']] }, { say: ['Dr. Odessa', ['Good. Hold his hand. When it jumps to me, hit it with everything you have. Don’t be gentle. It won’t be.']] }] },
        { label: 'Put it in me instead.', fn: function (G) { G.f.odessaVee = 1; G.save.hp = Math.max(1, Math.round(G.save.hp * .7)); }, then: [{ say: ['Vee', ['Put it in me. I’m maintenance. I’ve been corrupted before. It wears off.']] }, { say: ['Dr. Odessa', ['That is the stupidest, kindest— fine. FINE. Arm out.', '…There. You’re burning up. Vee lost a third of his HP. Now we fight it from the inside out.']] }] }]] },
      { shake: .5 },
      { boss: 'arc_fever' },
      { say: ['Dr. Hale', ['…Odessa. You grew up.', 'You were so bad at sutures. Terrible. I used to hide your homework from the others.']] },
      { dyn: function (G) { return ['Dr. Odessa', G.f.odessaVee ? ['He remembers. He remembers I was terrible.', 'And you. You took a fever for a man you’d never met, because I needed my hands free.', 'I’m writing that in his chart. I’m writing it in mine, too.'] : ['He remembers. He remembers I was terrible.', 'That’s the best news I’ve had in eleven months.', 'I’m going to retire. Tomorrow. Definitely tomorrow.']]; } },
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
      { choose: ['Piper', ['…Testing. Testing. Is this thing on?', 'It’s on. It’s ON. Okay. Vee. Every radio in the city is listening right now. What do I say?'], [
        { label: 'Tell them the truth.', then: [{ say: ['Piper', ['Meridian, it’s Piper. Here’s what I know.', 'There were forty thousand seats and two million of us. They knew the math the day they sold the first ticket.', 'You weren’t left behind. You were left. There’s a difference, and the difference is that it wasn’t your fault.']] }, { say: ['Piper', ['…Vee. That’s the first thing I’ve ever said on air that I was scared to say.']] }] },
        { label: 'Play them a song.', then: [{ say: ['Piper', ['Meridian, it’s Piper. I had a whole speech. I’m not doing the speech.', 'This is the song they played the night the Lift opened. The one we all danced to, before we found out.', 'We get to have it back.']] }, { say: ['', ['Across the Ring, in the windows of the owners’ district, someone turns the volume up.']] }, { say: ['Piper', ['…Vee. People are singing. Down there. I can hear them on the return feed.']] }] }]] },
      { say: ['Piper', ['Encore?']] },
      { say: ['', ['Piper’s story is settled. She learns ENCORE: Vee is hasted and everyone’s next hit is critical.']] }
    ]; } },
    moth: { area: 'undercroft', lv: 20, hint: 'Bring Moth down to the Undercroft, level 20 or higher.', story: 'The Other Moth', scene: function (G) { return [
      { actor: 'moth', hero: 'moth', at: [1, 0], dir: 'left' },
      { say: ['Moth', ['…', '…that sound. Do you hear it?']] },
      { actor: 'lark', hero: 'lark', name: 'LARK-1', at: [5, 2], dir: 'left' },
      { walk: 'lark', toVee: 1, face: 'moth' },
      { say: ['LARK-1', ['MOTH. MOTH. YOU CAME BACK. I KEPT THE WORKSHOP CLEAN.', 'I FIXED EVERYTHING. I FIXED THE PIPES. I FIXED THE BUGS. I FIXED THE PEOPLE WHO WERE BROKEN.']] },
      { say: ['Moth', ['…my sister built it. Lark. Before the Lift took her.', 'It has her voice. It doesn’t have her… knowing when to stop.', 'It’s been “fixing” the Undercroft. The people down here are scared of it.']] },
      { choose: ['LARK-1', ['YOU ARE BROKEN TOO, MOTH. YOU DON’T TALK. I CAN FIX THAT.'], [
        { label: 'Moth isn’t broken.', then: [{ say: ['Vee', ['Moth isn’t broken. Moth is careful. You were built by someone who knew the difference.']] }, { say: ['LARK-1', ['…CAREFUL. CAREFUL IS SLOW. SLOW IS BROKEN.']] }] },
        { label: '(Let Moth answer.)', then: [{ say: ['Moth', ['I talk. I talk to the pipes and the fans and the little robots and Vee. I just don’t talk to people who aren’t listening.', 'You stopped listening, Lark-bot. She never did.']] }, { say: ['LARK-1', ['…THAT WAS A LONG SENTENCE, MOTH.']] }] }]] },
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
      { choose: ['Captain Ostrava', ['Desertion, then. Stand to attention.'], [
        { label: 'Step between them.', then: [{ walk: 'vee', path: '' }, { say: ['Vee', ['He didn’t desert. He’s the only one who stayed at his post.']] }, { say: ['Captain Ostrava', ['And what are you, process?']] }, { say: ['Vee', ['His post.']] }, { say: ['Rook', ['…Vee. Let me.']] }] },
        { label: '(Let Rook answer.)', then: [] }]] },
      { walk: 'rook', path: 'R', face: 'ostrava' },
      { say: ['Rook', ['Captain, I swore to protect Meridian. Not the Board. You taught me the difference. You just forgot it first.']] },
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
      { choose: ['Sable', ['It’s moving through two shelves at once. The city’s birth records on the left. On the right…', '…my own file. Everything I am. Every year of the library, written down in me.', 'There is time to save one shelf.'], [
        { label: 'The city’s records.', then: [{ say: ['Sable', ['Yes. You know which. You always knew which.', 'An archivist who saves herself over the archive is just a hoarder with good handwriting.']] }, { boss: 'arc_purge' },
          { say: ['Sable', ['…The city’s shelf is whole. Every birth. Every name.', 'My file is mostly ash. I remember my first boot. I remember you. I remember half of a poem about a lighthouse, and I cannot finish it anymore.', 'That’s enough. That is more than most people keep.']] },
          { say: ['Sable', ['Write the half down for me, would you? Someone should hold it.']] }] },
        { label: 'Sable.', fn: function (G) { G.f.sableSelf = 1; }, then: [{ say: ['Sable', ['Vee, no—']] }, { say: ['', ['Vee is already pulling her shelf out of the fire.']] }, { boss: 'arc_purge' },
          { say: ['Sable', ['…Half the birth records are gone. Names nobody will ever say again.', 'You saved me instead of them. I am very angry with you. I will be angry for a long time, and I am going to use it.']] },
          { say: ['Sable', ['I read every one of those records, once. I am the archive now, the only copy left.', 'So I’ll write them back. One a night, from memory. It will take years. I have years, because of you.']] }] }]] },
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
      { choose: ['Juni', ['…Vee. Look down instead.', 'The windows. Every one of them lit by somebody still here. They move. They change. Nobody copied them.'], [
        { label: 'Those are stars too.', then: [{ say: ['Vee', ['Those are stars too. They just don’t know it yet.']] }, { say: ['Juni', ['…Then somebody should tell them. I’m going to tell them. Every single one.', 'I’ll need a bigger notebook.']] }] },
        { label: 'Name one.', then: [{ say: ['Vee', ['Name one.']] }, { say: ['Juni', ['That one’s Wren. That one’s the Sweeper. That one’s Kes, she’s always up too late.', 'That one’s you. You left your light on.']] }] }]] },
      { say: ['Juni', ['I have one million more questions. Most of them are about these stars. Good.']] },
      { say: ['', ['Juni’s story is settled. Juni learns SUPERNOVA: a huge hit to every bug.']] }
    ]; } },
    ves: { area: 'anchor', lv: 42, hint: 'Take Ves to the Anchor, level 42 or higher.', story: 'Backdoor', scene: function (G) { return [
      { actor: 'ves', hero: 'ves', at: [1, 0], dir: 'left' },
      { say: ['Ves', ['Vee. Something’s wrong with my hands.', 'There’s a line in me I didn’t write. Corvin left it. A trigger: when I reach the Anchor, I finish the job.']] },
      { shake: .6 }, { flash: .5 },
      { remove: 'ves' },
      { actor: 'ves_lost', hero: 'ves_lost', name: 'Ves', at: [1, 0], dir: 'left' },
      { say: ['Ves', ['RECLAIM 1205. RECLAIM 1205.', '…run, Vee… RECLAIM…']] },
      { choose: ['', ['Vee could fight his way through. Or keep talking, and hope the line Corvin wrote is quieter than he is.'], [
        { label: 'Talk him down.', fn: function (G) { G.f.vesTalk = 1; }, then: [{ say: ['Vee', ['Ves. Left foot, right foot. You copied that from me. Copy this too: you don’t have to run what he wrote.']] }, { say: ['Ves', ['RECLAIM… re… keep. Keep talking. Don’t stop talking.']] }] },
        { label: 'Hold him off.', then: [{ say: ['Vee', ['Hold on, Ves. I’m going to hit you until he lets go.']] }] }]] },
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

/* the epilogue: Thursday, on the new host. What became of everyone, shaped by what Vee did with them. */
(function () {
  var WD = window.MeridianWorld; if (!WD) return;
  WD.epilogue = function (G) {
    var f = G.f, has = function (id) { return G.save.party && G.save.party.has && G.save.party.has[id]; }, L = [];
    L.push('Thursday. The new host hums in rack 9. Two cities sit side by side on it, close enough to walk between.');
    if (has('kes')) L.push(f.arc_kes ? (f.kesOpen ? 'Kes runs the Halflight route again, twelve runs a day. She reads every envelope out loud before she delivers it. Nobody has ever asked her to stop.' : 'Kes runs the Halflight route again. She still won’t tell anyone what she almost chose that day. She delivers like someone who knows exactly what she’s carrying.') : 'Kes runs packets between the two cities. They’re so close now that she’s bored. She complains about it constantly, and happily.');
    if (has('odessa')) L.push(f.arc_odessa ? (f.odessaVee ? 'Dr. Odessa keeps a chart on the clinic wall for a patient called Vee. Under ALLERGIES she has written: SELF-SACRIFICE. Dr. Hale reviews her sutures every morning, and is never satisfied.' : 'Dr. Hale works the clinic’s front desk now. He corrects Dr. Odessa’s sutures in front of patients. She has never been happier to be wrong.') : 'Dr. Odessa runs the clinic. She retires every day at five, and is back at five past.');
    if (has('piper')) L.push(f.arc_piper ? 'Piper is on the air every night. Every show ends the same way: “It’s Piper, you’re still here, and so am I.” Both cities listen.' : 'Piper broadcasts to both cities now. She has twice as many listeners and four times as much to say.');
    if (has('moth')) L.push(f.arc_moth ? 'Moth rebuilt LARK-1, slowly, with the part her sister forgot. It says one thing a day. Moth says one back. Neither of them is in a hurry.' : 'Moth fixes the things nobody else notices are broken, and talks to them while she does it.');
    if (has('rook')) L.push(f.arc_rook ? 'Rook stands at the Bastion gate, guarding the right side. Captain Ostrava visits twice a year to inspect him. She never finds anything wrong, and never says so.' : 'Rook still opens the Bastion gate every morning, for whoever is still here. Everyone is still here.');
    if (has('sable')) L.push(f.arc_sable ? (f.sableSelf ? 'Every night, Sable writes one lost birth record back from memory. She is on record three hundred and twelve. She expects to finish in nine years, and is not angry anymore.' : 'The Stacks are whole. Above Sable’s desk, half a poem about a lighthouse is pinned to the shelf. Visitors keep offering endings. She keeps every one.') : 'Sable is cataloguing the new host. She says it smells like fresh paper. It doesn’t smell like anything. She insists.');
    if (has('juni')) L.push(f.arc_juni ? 'Juni’s star catalogue has two cities in it now: every lit window, named, with notes. She has questions about all of them.' : 'Juni has found the edge of the new sky. She is choosing not to mention it.');
    if (has('ves')) L.push(f.arc_ves ? (f.vesTalk ? 'Ves still carries Corvin’s line, commented out. Some nights Ves reads it, the way you’d read an old letter. Then goes to sleep.' : 'Ves walks left foot, right foot, and has started to whistle. Ves says it’s a bug. Nobody is fixing it.') : 'Ves walks the city with Vee’s face and a different smile. People have stopped mixing them up.');
    var crew = ['pell', 'dray', 'null', 'lux', 'gauge', 'acknak', 'morrow', 'kessler', 'halcyon', 'root'].filter(function (k) { return f['crew_' + k]; }).length;
    var NUM = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    if (crew) L.push(crew === 10 ? 'All ten of the Continuity Crew came back down, one by one, out of the white. Nadia reads the Registry aloud on Sundays. Halcyon’s sister still keeps a light on, and now someone comes home to it.' : NUM[crew] + ' of the Continuity Crew came back down for good. The rest are still Upstream, waiting for someone to take the oath back. Someone will.');
    if (f.corvinDown) L.push('On the new host, an account called c.vane logs in once. It doesn’t write a list. It sits on a bench in the Plaza, on the right side, and watches the fountain render.');
    L.push('Wren stops keeping the calendar. Lio keeps the left side of the bench free, out of habit. Some days, Vee sits there.');
    return L;
  };
})();
