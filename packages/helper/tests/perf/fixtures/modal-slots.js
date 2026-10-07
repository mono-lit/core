// `header`/`footer` alias `head`/`foot` on mono-modal, and win when both are given.
//
// Four cases per build: the original names, the aliases alone, both together
// (alias must win), and the default header fallback (title + ✕) when neither is
// supplied — that last one is what a naive "always render the alias slot" would
// break, since the fallback lives on the INNER slot.

import '@mono-lit/helper/ui/modal'
import '@mono-lit/helper/ui/shadow/modal'

const CASES = {
  original: '<div slot="head">HEAD-ORIGINAL</div><div slot="foot">FOOT-ORIGINAL</div>',
  alias: '<div slot="header">HEAD-ALIAS</div><div slot="footer">FOOT-ALIAS</div>',
  both:
    '<div slot="head">HEAD-ORIGINAL</div><div slot="header">HEAD-ALIAS</div>' +
    '<div slot="foot">FOOT-ORIGINAL</div><div slot="footer">FOOT-ALIAS</div>',
  fallback: '',
}

document.querySelector('#app').innerHTML = Object.entries(CASES)
  .flatMap(([name, inner]) => [
    `<mono-modal data-t="light|${name}" title="T" model-value>${inner}<p>body</p></mono-modal>`,
    `<mono-shadow-modal data-t="shadow|${name}" title="T" model-value>${inner}<p>body</p></mono-shadow-modal>`,
  ])
  .join('')

/** Rendered text of a region, following slots through to their assigned nodes. */
window.__regionText = (key, region) => {
  const host = document.querySelector(`[data-t="${key}"]`)
  if (!host) return 'NO HOST'
  const root = host._portal ?? host.shadowRoot
  if (!root) return 'NO ROOT'

  const el = root.querySelector(`.mono-modal-${region}`)
  if (!el) return 'NO REGION'

  // Shadow: walk slots to their assigned nodes (textContent of a <slot> is only
  // its fallback, not what is projected into it).
  const text = (node) => {
    if (node.tagName === 'SLOT') {
      const assigned = node.assignedNodes({ flatten: true })
      if (assigned.length) return assigned.map((n) => n.textContent ?? '').join('')
      return [...node.childNodes].map(text).join('')
    }
    if (node.nodeType === Node.TEXT_NODE) return node.data
    return [...node.childNodes].map(text).join('')
  }

  return text(el).replace(/\s+/g, ' ').trim()
}

setTimeout(() => {
  window.__ready = true
}, 300)
