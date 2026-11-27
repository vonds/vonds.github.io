/* experience.js: hero light, name intro, gallery darkening, film grain, logo cursor, ascend, hidden terminal.
   No dependencies. Everything degrades gracefully and respects reduced motion. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  var hero = doc.querySelector('.hero');

  /* ---------- 2. the name: letters resolve from the centre outward ---------- */
  var h1 = hero && hero.querySelector('h1');
  if (h1 && !h1.querySelector('.ch')) {
    var word = h1.textContent.trim(), mid = (word.length - 1) / 2;
    h1.setAttribute('aria-label', word);
    h1.innerHTML = word.split('').map(function (c, i) {
      var d = (0.12 + Math.abs(i - mid) * 0.16).toFixed(2);
      return '<span class="ch" aria-hidden="true" style="--d:' + d + 's">' + c + '</span>';
    }).join('');
  }
  if (root.classList.contains('xp-intro')) {
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('xp-go'); }); });
  }

  /* ---------- 1. hero light ---------- */
  if (hero && !reduce) {
    var light = doc.createElement('div');
    light.className = 'xp-light';
    hero.insertBefore(light, hero.firstChild);
    var tx = 50, ty = 42, cx = 50, cy = 42, t0 = performance.now(), pointerSeen = false, heroOn = true;
    setTimeout(function () { light.classList.add('on'); }, 1400);
    if (fine) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width * 100; ty = (e.clientY - r.top) / r.height * 100; pointerSeen = true;
      });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; if (heroOn) requestAnimationFrame(glow); }).observe(hero);
    }
    var glow = function (now) {
      if (!heroOn) return;
      if (!pointerSeen) { // slow, drifting sweep when there is no mouse
        var t = (now - t0) / 1000;
        tx = 50 + Math.sin(t * 0.21) * 28; ty = 42 + Math.sin(t * 0.13 + 1.2) * 14;
      }
      cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
      light.style.setProperty('--lx', cx.toFixed(2) + '%');
      light.style.setProperty('--ly', cy.toFixed(2) + '%');
      requestAnimationFrame(glow);
    };
    requestAnimationFrame(glow);
  }

  /* ---------- 3. gallery darkening ---------- */
  var pf = doc.getElementById('portfolio');
  if (pf && window.CSS && CSS.supports('color', 'color-mix(in srgb, red 50%, blue)')) {
    var dkT = 0, dkC = 0, ticking = false;
    // the room is dark while your eye (the middle of the screen) is inside the portfolio,
    // and the light changes over most of a screen's height on either side, on a smootherstep curve
    var measure = function () {
      var r = pf.getBoundingClientRect(), vh = innerHeight, mid = vh * 0.5, span = vh * 0.75;
      var enter = clamp((mid - r.top + span * 0.5) / span);
      var leave = clamp((r.bottom - mid + span * 0.5) / span);
      var t = Math.min(enter, leave);
      dkT = t * t * t * (t * (t * 6 - 15) + 10); // smootherstep
      if (!ticking) { ticking = true; requestAnimationFrame(step); }
    };
    var step = function () {
      dkC += (dkT - dkC) * (reduce ? 1 : 0.09);
      if (Math.abs(dkT - dkC) < 0.002) dkC = dkT;
      root.style.setProperty('--dk', dkC.toFixed(3));
      body.classList.toggle('xp-dark-grain', dkC > 0.5);
      if (dkC !== dkT) requestAnimationFrame(step); else ticking = false;
    };
    addEventListener('scroll', measure, { passive: true });
    addEventListener('resize', measure);
    measure();
  }


  /* ---------- section index ---------- */
  var IDX = [['about', 'About'], ['portfolio', 'Work'], ['services', 'Services'], ['contact', 'Contact']]
    .map(function (x) { return { el: doc.getElementById(x[0]), id: x[0], label: x[1] }; }).filter(function (x) { return x.el; });
  if (IDX.length) {
    var nav = doc.createElement('nav');
    nav.className = 'xp-index'; nav.setAttribute('aria-label', 'Sections');
    nav.innerHTML = '<ol>' + IDX.map(function (x, i) {
      return '<li><a href="#' + x.id + '"><span class="lb">' + x.label + '</span><span class="n">0' + (i + 1) + '</span><span class="tr"><i></i></span></a></li>';
    }).join('') + '</ol>';
    body.appendChild(nav);
    var links = nav.querySelectorAll('a');
    var idxUpdate = function () {
      var vh = innerHeight, mid = vh * 0.45, any = false;
      IDX.forEach(function (x, i) {
        var r = x.el.getBoundingClientRect();
        var f = clamp((mid - r.top) / Math.max(1, r.height));
        links[i].querySelector('.tr').style.setProperty('--f', f.toFixed(3));
        var on = r.top <= mid && r.bottom > mid; links[i].classList.toggle('on', on);
        if (on) { any = true; links[i].setAttribute('aria-current', 'true'); } else links[i].removeAttribute('aria-current');
      });
      var heroR = hero ? hero.getBoundingClientRect() : { bottom: 0 };
      var foot = doc.querySelector('footer'), fr = foot ? foot.getBoundingClientRect() : { top: 1e9 };
      nav.classList.toggle('show', heroR.bottom < vh * 0.4 && fr.top > vh * 0.6);
    };
    var idxTick = false;
    addEventListener('scroll', function () { if (!idxTick) { idxTick = true; requestAnimationFrame(function () { idxTick = false; idxUpdate(); }); } }, { passive: true });
    addEventListener('resize', idxUpdate); idxUpdate();
  }

  /* ---------- ink-bleed headings ---------- */
  if (!reduce) root.classList.add('xp-ink');


  /* ---------- live product previews ---------- */
  var frames = doc.querySelectorAll('#portfolio .work .frame');
  var saveData = navigator.connection && navigator.connection.saveData;
  if (frames.length && !reduce) {
    var mk = function (fr) {
      if (fr._pv) return fr._pv;
      var img = fr.querySelector('img'); if (!img) return null;
      var name = (img.getAttribute('src') || '').split('/').pop().replace(/\.(png|jpe?g|webp)$/, '');
      var pv = doc.createElement('span'); pv.className = 'pv'; pv.setAttribute('aria-hidden', 'true');
      pv.innerHTML = '<span class="scr"><video muted loop playsinline preload="none" src="assets/video/' + name + '.mp4"></video></span>' +
        '<span class="seam"></span><span class="seam"></span><span class="hud"><i></i><i></i><i></i><i></i></span>' +
        '<span class="tag"><i></i>Live preview</span><span class="tc">00:00</span><span class="prog"><b></b></span><span class="arm"></span>';
      fr.appendChild(pv); fr._pv = pv; fr._v = pv.querySelector('video');
      fr._tc = pv.querySelector('.tc'); fr._pb = pv.querySelector('.prog b');
      return pv;
    };
    // timecode and loop progress, only while a tile is live
    var tick = function (fr) {
      if (!fr.classList.contains('live')) return;
      var v = fr._v, d = v.duration || 0, t = v.currentTime || 0;
      if (d) fr._pb.style.setProperty('--t', (t / d).toFixed(4));
      var s2 = Math.floor(t); fr._tc.textContent = '00:' + (s2 < 10 ? '0' : '') + s2;
      requestAnimationFrame(function () { tick(fr); });
    };
    var goLive = function (fr) {
      if (!fr.classList.contains('playing') || fr.classList.contains('live')) return;
      // next frame, so the opening transition always runs from closed
      requestAnimationFrame(function () { if (fr.classList.contains('playing')) { fr.classList.add('live'); tick(fr); } });
    };
    var play = function (fr) {
      if (!mk(fr)) return;
      fr.classList.remove('arming'); fr.classList.add('playing');
      var v = fr._v;
      // reveal only once real frames are ready, so the screen never opens on black
      if (v.readyState >= 3) goLive(fr); else v.addEventListener('playing', function () { goLive(fr); }, { once: true });
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    };
    var stop = function (fr) {
      fr.classList.remove('arming');
      if (!fr._v) return;
      fr.classList.remove('playing', 'live'); var v = fr._v;
      setTimeout(function () { if (!fr.classList.contains('playing')) { v.pause(); try { v.currentTime = 0; } catch (e) {} } }, 650);
    };
    if (fine) {
      frames.forEach(function (fr) {
        fr.addEventListener('pointerenter', function () { play(fr); });
        fr.addEventListener('pointerleave', function () { stop(fr); });
        fr.addEventListener('focus', function () { play(fr); });
        fr.addEventListener('blur', function () { stop(fr); });
      });
    } else if (!saveData && 'IntersectionObserver' in window) {
      // phones: the tile in the middle of the screen plays on its own
      var vis = new Map(), pending = null, waitT = 0;
      var pick = function () {
        var best = null, bestD = 1e9, mid = innerHeight / 2;
        vis.forEach(function (on, fr) { if (!on) return; var r = fr.getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - mid); if (d < bestD) { bestD = d; best = fr; } });
        frames.forEach(function (fr) { if (fr !== best && fr.classList.contains('playing')) stop(fr); });
        // wait 2 seconds on the centered tile before its preview starts
        if (best !== pending) {
          clearTimeout(waitT);
          if (pending && pending !== best) pending.classList.remove('arming');
          pending = best;
          if (best && !best.classList.contains('playing')) {
            mk(best); best._v.preload = 'auto'; best._v.load();
            void best.offsetWidth; best.classList.add('arming');
            waitT = setTimeout(function () { if (pending === best) play(best); }, 2000);
          }
        }
      };
      var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { vis.set(e.target, e.intersectionRatio > 0.6); }); pick(); }, { threshold: [0, 0.6, 1] });
      frames.forEach(function (fr) { io2.observe(fr); });
      addEventListener('scroll', function () { if (vis.size) requestAnimationFrame(pick); }, { passive: true });
    }
  }

  /* ---------- 4. film grain ---------- */
  var grain = doc.createElement('div');
  grain.className = 'xp-grain'; grain.setAttribute('aria-hidden', 'true');
  body.appendChild(grain);

  /* ---------- 5. logo cursor ---------- */
  if (fine) {
    var cur = doc.createElement('div');
    cur.className = 'xp-cursor'; cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span class="r"></span><span class="m"><svg viewBox="105 62 190 176"><path d="M120 80 L200 160 L280 80 M120 140 L200 220 L280 140" fill="none" stroke="#fff" stroke-width="24" stroke-linejoin="miter"/></svg></span>';
    body.appendChild(cur);
    root.classList.add('xp-cur');
    var mx = -100, my = -100, px = -100, py = -100, moving = false;
    var HOT = 'a,button,[role="button"],summary,label,.frame,.cs-open,.lab-copy-btn';
    var TEXT = 'input,textarea,select,[contenteditable]';
    var move = function () {
      px += (mx - px) * 0.32; py += (my - py) * 0.32;
      cur.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0)';
      if (Math.abs(mx - px) > 0.2 || Math.abs(my - py) > 0.2) requestAnimationFrame(move); else moving = false;
    };
    var syncModal = function () {
      // native dialogs sit in the top layer above everything; use the normal cursor while one is open
      var modal = !!doc.querySelector('dialog[open]');
      root.classList.toggle('xp-cur', !modal);
      cur.classList.toggle('hide', modal);
    };
    addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (px < -50) { px = mx; py = my; }
      cur.classList.add('on');
      var t = e.target;
      cur.classList.toggle('hot', !!(t.closest && t.closest(HOT)) && !(t.closest && t.closest('.header .brand')));
      cur.classList.toggle('hide', !!(t.closest && t.closest(TEXT)) || !!doc.querySelector('dialog[open]'));
      // over Vee's speech boxes and the game windows, draw a solid cursor instead of the inverting one,
      // so it reads clearly on top of their white text (those boxes ignore the pointer, so test their rects)
      var solid = !!(t.closest && t.closest('.gm,.rpg,.gpick,.xp-term,.ff4w'));
      if (!solid) { var bs = doc.querySelectorAll('.gguide.on .gtalk,.vtalk.on'); for (var bi = 0; bi < bs.length && !solid; bi++) { var br = bs[bi].getBoundingClientRect(); solid = mx >= br.left && mx <= br.right && my >= br.top && my <= br.bottom; } }
      cur.classList.toggle('solid', solid);
      if (!moving) { moving = true; requestAnimationFrame(move); }
    }, { passive: true });
    addEventListener('pointerdown', function () { cur.classList.add('down'); });
    addEventListener('pointerup', function () { cur.classList.remove('down'); });
    doc.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
    if ('MutationObserver' in window) {
      new MutationObserver(syncModal).observe(body, { subtree: true, attributes: true, attributeFilter: ['open'] });
    }
  }

  /* ---------- 6. ascend: back to top, in reverse ---------- */
  var toTop = doc.getElementById('toTop');
  if (toTop && hero && !reduce) {
    var asc = doc.createElement('div');
    asc.className = 'xp-ascend'; asc.setAttribute('aria-hidden', 'true');
    for (var k = 0; k < 8; k++) asc.innerHTML += '<i style="--k:' + k + '"></i>';
    body.appendChild(asc);
    var busy = false;
    toTop.addEventListener('click', function (e) {
      e.stopImmediatePropagation(); e.preventDefault();
      if (busy) return; busy = true;
      asc.classList.add('run');
      setTimeout(function () {
        var sb = root.style.scrollBehavior; root.style.scrollBehavior = 'auto';
        window.scrollTo(0, 0); root.style.scrollBehavior = sb;
      }, 480);
      setTimeout(function () { asc.classList.remove('run'); }, 820);
      setTimeout(function () { busy = false; var b = hero.querySelector('.dive-btn, a, button'); if (b) b.focus({ preventScroll: true }); }, 1300);
    }, true);
  }


  /* ---------- phones ---------- */
  var touch = window.matchMedia && matchMedia('(hover: none), (pointer: coarse)').matches;
  // phones: place each logo in the open space above its card and size it to fit, so the two never touch
  var mq = window.matchMedia ? matchMedia('(max-width: 700px)') : null;
  var layoutDescent = function () {
    var scenes = doc.querySelectorAll('.ff .deep[data-i]');
    scenes.forEach(function (sc) {
      if (sc.getAttribute('data-i') === '0') return;
      if (!mq || !mq.matches) { sc.style.removeProperty('--oy'); sc.style.removeProperty('--hs'); return; }
      var card = sc.querySelector('.pcard'), obj = sc.querySelector('.obj');
      if (!card || !obj) return;
      var vh = innerHeight, cs = getComputedStyle(card);
      var bottom = parseFloat(cs.bottom) || 16;
      var cardTop = vh - bottom - card.offsetHeight;
      var zoneTop = 66, zoneBottom = cardTop - 12, avail = Math.max(60, zoneBottom - zoneTop);
      var natural = obj.offsetHeight || 190;
      var hs = Math.max(0.5, Math.min(1.3, avail / natural));
      var centre = zoneTop + avail / 2;
      sc.style.setProperty('--hs', hs.toFixed(3));
      sc.style.setProperty('--oy', Math.round(centre - vh / 2) + 'px');
    });
  };
  layoutDescent();
  addEventListener('resize', layoutDescent);
  if (mq && mq.addEventListener) mq.addEventListener('change', layoutDescent);
  // re-measure when the descent opens (fonts and layout are final by then)
  var ffEl = doc.getElementById('ff');
  if (ffEl && 'MutationObserver' in window) new MutationObserver(function () { if (ffEl.classList.contains('open')) { layoutDescent(); setTimeout(layoutDescent, 400); } }).observe(ffEl, { attributes: true, attributeFilter: ['class'] });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(layoutDescent);

  // phones: each card carries its logo as a corner badge (shown by CSS under 700px only)
  doc.querySelectorAll('.ff .deep[data-i]').forEach(function (sc) {
    if (sc.getAttribute('data-i') === '0') return;
    var src = sc.querySelector('.holo img'), card = sc.querySelector('.pcard');
    if (!src || !card || card.querySelector('.ml')) return;
    var b = doc.createElement('span'); b.className = 'ml'; b.setAttribute('aria-hidden', 'true');
    b.innerHTML = '<img alt="" src="' + src.getAttribute('src') + '"><i class="sl"></i>';
    card.insertBefore(b, card.firstChild);
  });
  // back to top: only when you are heading back up, and never over the form
  var tt = doc.getElementById('toTop');
  if (tt && touch) {
    var lastY = scrollY, idle = null, contact = doc.getElementById('contact'), foot = doc.querySelector('footer');
    var near = function (el) { if (!el) return false; var r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
    tt.classList.add('xp-away');
    addEventListener('scroll', function () {
      var y = scrollY, up = y < lastY - 4;
      if (Math.abs(y - lastY) > 4) lastY = y;
      var blocked = near(contact) || near(foot) || y < innerHeight;
      tt.classList.toggle('xp-away', blocked || !up);
      clearTimeout(idle);
      if (!blocked && up) idle = setTimeout(function () { tt.classList.add('xp-away'); }, 2200);
    }, { passive: true });
  }
  // full-screen screenshot on phones: open centred, show a swipe hint
  var lbEl = doc.getElementById('lb');
  if (lbEl && 'MutationObserver' in window) {
    var hint = null;
    new MutationObserver(function () {
      if (!lbEl.open || !matchMedia('(max-width: 700px)').matches) return;
      var img = doc.getElementById('lbImg');
      var centre = function () { lbEl.scrollLeft = (lbEl.scrollWidth - lbEl.clientWidth) / 2; };
      if (img.complete) centre(); else img.addEventListener('load', centre, { once: true });
      setTimeout(centre, 60);
      if (!hint) { hint = doc.createElement('div'); hint.className = 'xp-swipe'; hint.textContent = 'Swipe to explore'; lbEl.appendChild(hint); }
      hint.classList.remove('gone'); setTimeout(function () { hint.classList.add('gone'); }, 2600);
      lbEl.addEventListener('scroll', function () { hint.classList.add('gone'); }, { once: true, passive: true });
    }).observe(lbEl, { attributes: true, attributeFilter: ['open'] });
  }

  /* ---------- 8. hidden terminal (press `) ---------- */
  var projects = Array.prototype.slice.call(doc.querySelectorAll('#portfolio .work')).map(function (w) {
    var a = w.querySelector('h3 a');
    return a ? { name: a.textContent.trim(), slug: a.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), href: a.href, kicker: (w.querySelector('.kicker') || {}).textContent || '', blurb: (w.querySelector('.cap p') || {}).textContent || '' } : null;
  }).filter(Boolean);
  var mail = doc.querySelector('a[href^="mailto:"]');
  var mailAddr = mail ? mail.getAttribute('href').replace(/^mailto:/, '').split('?')[0] : '';
  var term = doc.createElement('div');
  term.className = 'xp-term'; term.setAttribute('role', 'dialog'); term.setAttribute('aria-modal', 'true'); term.setAttribute('aria-label', 'Terminal');
  term.innerHTML = '<div class="win"><div class="bar"><span>vonds@portfolio: ~</span><button type="button" aria-label="Close terminal">&times;</button></div>' +
    '<div class="out" aria-live="polite"></div><form><span>$</span><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Command"></form></div>';
  body.appendChild(term);
  var out = term.querySelector('.out'), input = term.querySelector('input'), hist = [], hi = 0, opener = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function print(html) { out.insertAdjacentHTML('beforeend', html + '\n'); out.scrollTop = out.scrollHeight; }
  function find(arg) {
    arg = (arg || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return projects.filter(function (p) { return p.slug === arg || p.slug.indexOf(arg) === 0 || p.slug.replace(/^the-/, '').indexOf(arg) === 0; })[0];
  }
  var cmds = {
    help: function () {
      print('<span class="d">available commands</span>\n' +
        '  whoami            who runs this site\n' +
        '  ls                list what is here\n' +
        '  ls projects       list the work\n' +
        '  cat &lt;project&gt;     read about a project\n' +
        '  open &lt;project&gt;    open a project in a new tab\n' +
        '  about             jump to the About section\n' +
        '  contact           how to reach me\n' +
        '  step-inside       take the descent\n' +
        '  play              play a hidden game (uptime or meridian)\n' +
        '  clear             clear the screen\n' +
        '  exit              close the terminal');
    },
    whoami: function () { print('Vonds. Software, systems, and security.'); },
    ls: function (a) {
      if (a && /^proj/.test(a)) { print(projects.map(function (p) { return p.slug; }).join('    ')); return; }
      print('about/    projects/    services/    contact/');
    },
    cat: function (a) {
      var p = find(a);
      if (!p) { print('cat: ' + esc(a || '') + ': no such project. Try <span class="c">ls projects</span>'); return; }
      print('<span class="c">' + esc(p.name) + '</span>  <span class="d">' + esc(p.kicker.trim()) + '</span>\n' + esc(p.blurb.trim()));
    },
    open: function (a) {
      var p = find(a);
      if (!p) { print('open: ' + esc(a || '') + ': no such project. Try <span class="c">ls projects</span>'); return; }
      print('opening ' + esc(p.name) + '…'); window.open(p.href, '_blank', 'noopener');
    },
    about: function () { close(); var s = doc.getElementById('about'); if (s) s.scrollIntoView(); },
    contact: function () {
      print(mailAddr ? 'email     <a href="mailto:' + esc(mailAddr) + '">' + esc(mailAddr) + '</a>\nlinkedin  <a href="https://www.linkedin.com/in/vonds/" target="_blank" rel="noopener">linkedin.com/in/vonds</a>\nor type <span class="c">form</span> to jump to the contact form' : 'type <span class="c">form</span> to jump to the contact form');
    },
    form: function () { close(); var s = doc.getElementById('contact'); if (s) s.scrollIntoView(); },
    'step-inside': function () { close(); var b = doc.querySelector('[data-dive]'); if (b) setTimeout(function () { b.click(); }, 250); },
    clear: function () { out.innerHTML = ''; },
    exit: function () { close(); },
    sudo: function () { print('nice try.'); },
    pwd: function () { print('/home/vonds'); },
    date: function () { print(new Date().toString()); },
    play: function (a) { print('<span class="d">loading games …</span>'); setTimeout(function () { close(); setTimeout(function () { if (window.VondsPick) window.VondsPick(a); else if (window.VondsGame) window.VondsGame.open(); }, 260); }, 350); }
  };
  cmds.descend = cmds['step-inside']; cmds.ll = cmds.ls; cmds.dir = cmds.ls; cmds.quit = cmds.exit; cmds.game = cmds.play; cmds.jump = cmds.play; cmds['./jump'] = cmds.play;
  function run(line) {
    var parts = line.trim().split(/\s+/), c = (parts.shift() || '').toLowerCase(), a = parts.join(' ');
    print('<span class="d">$</span> <span class="c">' + esc(line) + '</span>');
    if (!c) return;
    if (c === 'cd') { var s = doc.getElementById((a || '').replace(/[\/~.]/g, '')); if (s) { close(); s.scrollIntoView(); } else print('cd: ' + esc(a) + ': try about, projects, services or contact'); return; }
    if (cmds[c]) cmds[c](a); else print(esc(c) + ': command not found. Type <span class="c">help</span>');
    try { doc.dispatchEvent(new CustomEvent('xp-term', { detail: { type: 'cmd', cmd: c, arg: a, known: !!cmds[c] } })); } catch (e) {}
  }
  function openTerm(noFocus) {
    if (term.classList.contains('open')) return;
    opener = doc.activeElement;
    if (!out.innerHTML) print('<span class="d">you found the terminal. type</span> <span class="c">help</span> <span class="d">to look around.</span>');
    term.classList.add('open'); body.style.overflow = 'hidden';
    if (noFocus !== true) setTimeout(function () { input.focus(); }, 30);
    try { doc.dispatchEvent(new CustomEvent('xp-term', { detail: { type: 'open' } })); } catch (e) {}
  }
  function close() {
    var was = term.classList.contains('open');
    term.classList.remove('open'); body.style.overflow = '';
    if (was) try { doc.dispatchEvent(new CustomEvent('xp-term', { detail: { type: 'close' } })); } catch (e) {}
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }
  term.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault(); var v = input.value; input.value = '';
    if (v.trim()) { hist.push(v); hi = hist.length; } run(v);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') { if (hi > 0) { hi--; input.value = hist[hi]; } e.preventDefault(); }
    else if (e.key === 'ArrowDown') { if (hi < hist.length - 1) { hi++; input.value = hist[hi]; } else { hi = hist.length; input.value = ''; } e.preventDefault(); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      var p = input.value.split(' '), last = p.pop() || '';
      var pool = p.length ? projects.map(function (x) { return x.slug; }) : Object.keys(cmds);
      var m = pool.filter(function (x) { return x.indexOf(last) === 0; });
      if (m.length === 1) { p.push(m[0]); input.value = p.join(' ') + ' '; }
      else if (m.length > 1) print('<span class="d">' + m.join('    ') + '</span>');
    } else if (e.key === 'Escape') { e.preventDefault(); close(); }
  });
  term.querySelector('.bar button').addEventListener('click', close);
  term.addEventListener('click', function (e) { if (e.target === term) close(); });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== '`' || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.closest && t.closest('input,textarea,select,[contenteditable]')) && !term.contains(t)) return;
    if (doc.querySelector('dialog[open]') || (doc.querySelector('.ff.open'))) return;
    e.preventDefault();
    if (term.classList.contains('open')) close(); else openTerm();
  });
  window.VondsTerm = { open: openTerm, close: close, win: term.querySelector('.win'), form: term.querySelector('form'), input: input, isOpen: function () { return term.classList.contains('open'); },
    run: function (v) { input.value = ''; hist.push(v); hi = hist.length; run(v); } };
  try { console.log('%cpsst. press ` for a terminal.', 'font:14px monospace;color:#2e2e30'); } catch (e) {}
})();
