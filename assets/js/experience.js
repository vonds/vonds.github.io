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
    var measure = function () {
      var r = pf.getBoundingClientRect(), vh = innerHeight;
      var enter = clamp((vh * 0.78 - r.top) / (vh * 0.42));
      var leave = clamp((r.bottom - vh * 0.22) / (vh * 0.42));
      dkT = Math.min(enter, leave);
      dkT = dkT * dkT * (3 - 2 * dkT); // smoothstep
      if (!ticking) { ticking = true; requestAnimationFrame(step); }
    };
    var step = function () {
      dkC += (dkT - dkC) * (reduce ? 1 : 0.14);
      if (Math.abs(dkT - dkC) < 0.002) dkC = dkT;
      pf.style.setProperty('--dk', dkC.toFixed(3));
      body.classList.toggle('xp-dark-grain', dkC > 0.5);
      if (dkC !== dkT) requestAnimationFrame(step); else ticking = false;
    };
    addEventListener('scroll', measure, { passive: true });
    addEventListener('resize', measure);
    measure();
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
      cur.classList.toggle('hot', !!(t.closest && t.closest(HOT)));
      cur.classList.toggle('hide', !!(t.closest && t.closest(TEXT)) || !!doc.querySelector('dialog[open]'));
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
        '  clear             clear the screen\n' +
        '  exit              close the terminal');
    },
    whoami: function () { print('Vonds. Software, systems and security: I build software, secure the systems it runs on, and train the people who use it.'); },
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
    date: function () { print(new Date().toString()); }
  };
  cmds.descend = cmds['step-inside']; cmds.ll = cmds.ls; cmds.dir = cmds.ls; cmds.quit = cmds.exit;
  function run(line) {
    var parts = line.trim().split(/\s+/), c = (parts.shift() || '').toLowerCase(), a = parts.join(' ');
    print('<span class="d">$</span> <span class="c">' + esc(line) + '</span>');
    if (!c) return;
    if (c === 'cd') { var s = doc.getElementById((a || '').replace(/[\/~.]/g, '')); if (s) { close(); s.scrollIntoView(); } else print('cd: ' + esc(a) + ': try about, projects, services or contact'); return; }
    if (cmds[c]) cmds[c](a); else print(esc(c) + ': command not found. Type <span class="c">help</span>');
  }
  function openTerm() {
    if (term.classList.contains('open')) return;
    opener = doc.activeElement;
    if (!out.innerHTML) print('<span class="d">you found the terminal. type</span> <span class="c">help</span> <span class="d">to look around.</span>');
    term.classList.add('open'); body.style.overflow = 'hidden';
    setTimeout(function () { input.focus(); }, 30);
  }
  function close() {
    term.classList.remove('open'); body.style.overflow = '';
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
  try { console.log('%cpsst. press ` for a terminal.', 'font:14px monospace;color:#2e2e30'); } catch (e) {}
})();
