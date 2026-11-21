// lab.js
// Copy buttons + footer year helper (no dependencies)

;(function () {
  function setYear() {
    var el = document.getElementById('year')
    if (el) el.textContent = String(new Date().getFullYear())
  }

  function copyFromSelector(selector) {
    var el = document.querySelector(selector)
    if (!el) return Promise.resolve(false)

    // Prefer innerText for <code> blocks because it preserves line breaks as rendered
    var text = el.innerText || el.textContent || ''
    return navigator.clipboard.writeText(text).then(
      function () {
        return true
      },
      function () {
        return false
      },
    )
  }

  function wireCopyButtons() {
    var buttons = document.querySelectorAll('[data-copy]')
    if (!buttons || !buttons.length) return

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-copy')
        if (!target) return

        var original = btn.textContent

        copyFromSelector(target).then(function (ok) {
          btn.textContent = ok ? 'Copied' : 'Failed'
          window.setTimeout(function () {
            btn.textContent = original
          }, 900)
        })
      })
    })
  }

  function nextLab() {
    const prevLink = document.getElementById('prev-lab')
    const nextLink = document.getElementById('next-lab')

    if (!prevLink || !nextLink) return

    // Extract lab number from filename (lab001.html)
    const match = window.location.pathname.match(/lab(\d+)\.html$/)
    if (!match) return

    const currentLab = parseInt(match[1], 10)


    const prevLab = currentLab - 1
    const nextLab = currentLab + 1

    // Previous
    if (prevLab < 1) {
      prevLink.classList.add('hidden')
    } else {
      prevLink.href = `lab${prevLab}.html`
    }

    // Next
    nextLink.href = `lab${nextLab}.html`
  }

  document.addEventListener('DOMContentLoaded', function () {
    setYear()
    nextLab()
    wireCopyButtons()
  })
})()
