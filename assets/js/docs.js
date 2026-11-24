// docs.js: exit_0 lab index. Category filter + search (titles, lab numbers and tags), combined.
// No dependencies. Each lab is an <li data-filter="primary tag tag ..." data-title="..." data-num="001">.
(function () {
  'use strict';

  var ORDER = ['shell', 'users', 'services', 'storage', 'networking', 'security', 'containers',
    'packages', 'processes', 'scheduling', 'permissions', 'logging'];

  var grid = document.getElementById('labsGrid');
  var cats = document.getElementById('labCats');
  var input = document.getElementById('labSearch');
  var clearBtn = document.getElementById('clearLabSearch');
  var countEl = document.getElementById('labCount');
  var empty = document.getElementById('labEmpty');
  if (!grid) return;

  var items = Array.prototype.slice.call(grid.querySelectorAll('li[data-filter]'));
  function norm(s) { return String(s || '').toLowerCase().trim(); }
  function terms(s) { return norm(s).split(/\s+/).filter(Boolean); }

  var labs = items.map(function (li) {
    var tags = terms(li.getAttribute('data-filter'));
    return {
      li: li,
      primary: tags[0] || 'other',
      tags: tags,
      hay: norm(li.getAttribute('data-title')) + ' ' + norm(li.getAttribute('data-num')) + ' ' +
           String(parseInt(li.getAttribute('data-num'), 10)) + ' ' + tags.join(' ')
    };
  });

  // Category list with counts
  var counts = {};
  labs.forEach(function (l) { counts[l.primary] = (counts[l.primary] || 0) + 1; });
  var primaries = ORDER.filter(function (p) { return counts[p]; })
    .concat(Object.keys(counts).filter(function (p) { return ORDER.indexOf(p) === -1; }).sort());
  var active = 'all';

  if (cats) {
    var html = '<li><button type="button" data-cat="all" aria-pressed="true">All labs <span class="n">' + labs.length + '</span></button></li>';
    primaries.forEach(function (p) {
      html += '<li><button type="button" data-cat="' + p + '" aria-pressed="false">' + p + ' <span class="n">' + counts[p] + '</span></button></li>';
    });
    cats.innerHTML = html;
    cats.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-cat]');
      if (!b) return;
      active = b.getAttribute('data-cat');
      cats.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      apply(true);
    });
  }

  function apply(fromUser) {
    var q = input ? terms(input.value) : [];
    var shown = 0;
    labs.forEach(function (l) {
      var ok = active === 'all' || l.primary === active || l.tags.indexOf(active) !== -1;
      for (var i = 0; ok && i < q.length; i++) { if (l.hay.indexOf(q[i]) === -1) ok = false; }
      l.li.hidden = !ok;
      if (ok) shown++;
    });
    if (countEl) {
      var where = active === 'all' ? '' : ' in <b>' + active + '</b>';
      var what = q.length ? ' matching <b>' + escapeHtml(q.join(' ')) + '</b>' : '';
      countEl.innerHTML = 'Showing <b>' + shown + '</b> of ' + labs.length + ' labs' + where + what;
    }
    if (empty) empty.hidden = shown !== 0;
    if (clearBtn) clearBtn.hidden = !(q.length || active !== 'all');
    if (fromUser && window.history && history.replaceState) {
      var params = new URLSearchParams();
      if (q.length) params.set('q', q.join(' '));
      if (active !== 'all') params.set('cat', active);
      var qs = params.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c];
    });
  }

  if (input) input.addEventListener('input', function () { apply(true); });
  if (clearBtn) clearBtn.addEventListener('click', function () {
    if (input) input.value = '';
    active = 'all';
    if (cats) cats.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-cat') === 'all')); });
    apply(true);
    if (input) input.focus();
  });

  // Restore state from the URL (?q=lvm&cat=storage), so searches can be shared
  var params = new URLSearchParams(location.search);
  if (input && params.get('q')) input.value = params.get('q');
  if (params.get('cat') && counts[params.get('cat')] && cats) {
    active = params.get('cat');
    cats.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-cat') === active)); });
  }
  apply(false);
})();
