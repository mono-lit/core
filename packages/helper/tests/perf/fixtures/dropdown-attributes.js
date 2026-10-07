import '@mono-lit/helper/ui/dropdown'

/**
 * The Basecoat styling attributes live on the ROOT and are applied imperatively
 * (light build → the host), which is browser-only: `isServer` is true under
 * vitest's jsdom, so this has to be asserted here rather than in a unit test.
 */
function mk(id, props = {}) {
  const d = document.createElement('mono-dropdown')
  d.id = id
  const btn = document.createElement('button')
  btn.setAttribute('slot', 'main')
  btn.textContent = 'trigger'
  const body = document.createElement('div')
  body.setAttribute('slot', 'body')
  body.textContent = 'body copy'
  d.append(btn, body)
  document.getElementById('app').appendChild(d)
  Object.assign(d, props)
  return d
}

mk('plain')
mk('props', { size: 'lg', color: 'success', placement: 'top-end', trigger: 'hover' })
mk('centre', { placement: 'left' })
mk('states', { disabled: true })

/** Every `mono-*` attribute on a root, plus the parts it rendered. */
window.__attrs = async (id) => {
  const el = document.getElementById(id)
  await el.updateComplete
  await new Promise((r) => requestAnimationFrame(r))
  const panel = el.querySelector('[mono-panel]')
  return {
    attrs: [...el.attributes]
      .filter((a) => a.name.startsWith('mono-'))
      .map((a) => (a.value ? `${a.name}=${a.value}` : a.name))
      .sort(),
    hasActivator: !!el.querySelector(':scope > [mono-activator]'),
    hasPanel: !!panel,
    hasBody: !!panel?.querySelector('[mono-body]'),
    ariaHidden: panel?.getAttribute('aria-hidden') ?? null,
    legacyClass: el.classList.contains('mono-dropdown'),
    offset: el.offset,
  }
}

/** Open (or close) one dropdown and report the panel's state. */
window.__setOpen = async (id, open) => {
  const el = document.getElementById(id)
  // Capture BEFORE opening: the light build moves the panel into a body portal
  // on first open, so a query afterwards finds nothing under the host.
  window.__panels ??= {}
  window.__panels[id] ??= el.querySelector('[mono-panel]')
  el.modelValue = open
  await el.updateComplete
  // The panel FADES (Basecoat transitions visibility with the opacity), so a
  // single frame still reports the outgoing state — let the transition land.
  await new Promise((r) => setTimeout(r, 300))
  // the panel may have been portaled — it keeps its identity either way
  const panel = window.__panels[id]
  const cs = panel ? getComputedStyle(panel) : null
  return {
    rootOpen: el.hasAttribute('mono-open'),
    ariaHidden: panel?.getAttribute('aria-hidden') ?? null,
    visibility: cs?.visibility ?? null,
    opacity: cs?.opacity ?? null,
  }
}

window.__ready = true
