// lab.js: copy buttons for lab code blocks (no dependencies)
;(function () {
  function fallbackCopy(text) {
    var ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    var ok = false
    try { ok = document.execCommand('copy') } catch (e) { ok = false }
    document.body.removeChild(ta)
    return Promise.resolve(ok)
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true }, function () { return fallbackCopy(text) })
    }
    return fallbackCopy(text)
  }

  function wire() {
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      var original = btn.textContent
      btn.addEventListener('click', function () {
        var el = document.querySelector(btn.getAttribute('data-copy'))
        if (!el) return
        // innerText keeps line breaks as rendered
        copyText(el.innerText || el.textContent || '').then(function (ok) {
          btn.textContent = ok ? 'Copied' : 'Press Ctrl+C'
          btn.setAttribute('aria-live', 'polite')
          window.setTimeout(function () { btn.textContent = original }, 1200)
        })
      })
    })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire)
  else wire()
})()
