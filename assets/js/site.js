/* site.js: shared behaviour for subpages (menu, back to top, table-of-contents highlighting). No dependencies. */
(function () {
  var toTop = document.getElementById('toTop');
  function onScroll() {
    if (toTop) toTop.classList.toggle('show', (window.scrollY || document.documentElement.scrollTop) > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  // Overlay menu (same behaviour as the homepage)
  var overlay = document.getElementById('overlay'), openBtn = document.getElementById('menuOpen'), closeBtn = document.getElementById('menuClose');
  if (overlay && openBtn && closeBtn) {
    var setMenu = function (open) {
      overlay.classList.toggle('open', open);
      overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
      openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) closeBtn.focus(); else openBtn.focus({ preventScroll: true });
    };
    openBtn.addEventListener('click', function () { setMenu(true); });
    closeBtn.addEventListener('click', function () { setMenu(false); });
    overlay.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('open')) setMenu(false); });
  }

  // Highlight the current section in the table of contents: the last section whose top has passed the reading line
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  if (links.length) {
    var pairs = links.map(function (a) { return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) }; })
      .filter(function (p) { return p.el; });
    var current = null, ticking = false;
    var setActive = function (p) {
      if (p === current) return;
      current = p;
      links.forEach(function (a) { a.classList.remove('active'); a.removeAttribute('aria-current'); });
      if (!p) return;
      p.a.classList.add('active'); p.a.setAttribute('aria-current', 'location');
      if (window.matchMedia('(max-width: 820px)').matches) {
        var ul = p.a.closest('ul');
        if (ul) ul.scrollTo({ left: p.a.offsetLeft - 24, behavior: 'smooth' });
      }
    };
    var spy = function () {
      ticking = false;
      var line = Math.min(160, window.innerHeight * 0.3), found = pairs[0];
      for (var i = 0; i < pairs.length; i++) { if (pairs[i].el.getBoundingClientRect().top <= line) found = pairs[i]; }
      // at the very bottom, the last section wins
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) found = pairs[pairs.length - 1];
      setActive(found);
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    window.addEventListener('resize', spy);
    spy();
  }

  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();
