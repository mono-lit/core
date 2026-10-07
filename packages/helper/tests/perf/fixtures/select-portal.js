// The select's option list is styled by rules scoped under `[mono-select]`
// (`[mono-select] [mono-item]`, `[mono-select][mono-open] > [mono-dropdown]`), and
// the light build moves the panel into a <body> portal while open. The portal
// therefore has to carry the wrapper's `mono-*` attributes — not just its class
// list, which is all it mirrored before the Basecoat port — or every option in a
// portaled panel paints as a bare <button>. The shadow build keeps its panel in
// the shadow root and is the reference the portaled one must match.

import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/shadow/select'

const ITEMS = [{ v: 'a', l: 'Alpha' }, { v: 'b', l: 'Beta' }, { v: 'c', l: 'Gamma' }]

document.querySelector('#app').innerHTML = `
  <div style="display:flex; gap: 24px; padding: 24px; align-items: flex-start">
    <mono-select id="light" size="sm" color="danger" key-value="v" display-value="l" placeholder="Light" model-value="b" style="width: 240px"></mono-select>
    <mono-shadow-select id="shadow" size="sm" color="danger" key-value="v" display-value="l" placeholder="Shadow" model-value="b" style="width: 240px"></mono-shadow-select>
  </div>
`

for (const id of ['light', 'shadow']) {
  const el = document.getElementById(id)
  el.items = ITEMS
}

const rootOf = (id) => {
  const host = document.getElementById(id)
  return (host.shadowRoot ?? host).querySelector('[mono-select]')
}

window.__open = async (id) => {
  document.getElementById(id).open()
  await new Promise((r) => setTimeout(r, 120))
}
window.__close = async (id) => {
  document.getElementById(id).close()
  await new Promise((r) => setTimeout(r, 120))
}

/** Where the light panel lives now, and what the portal carries. */
window.__portal = () => {
  const portal = document.querySelector('[data-mono-popup-portal]')
  if (!portal) return null
  return {
    attrs: [...portal.attributes].filter((a) => a.name.startsWith('mono-')).map((a) => (a.value ? `${a.name}=${a.value}` : a.name)).sort(),
    holdsPanel: !!portal.querySelector('[mono-dropdown]'),
  }
}

/** Painted metrics of the option rows and the panel, per build. */
window.__panelMetrics = (id) => {
  const host = document.getElementById(id)
  const scope = id === 'light' ? (document.querySelector('[data-mono-popup-portal]') ?? host) : host.shadowRoot
  const panel = scope.querySelector('[mono-dropdown]')
  const items = [...scope.querySelectorAll('[mono-item]')]
  const cs = (el) => getComputedStyle(el)
  const px = (el) => Math.round(el.getBoundingClientRect().height * 100) / 100
  return {
    panelDisplay: panel ? cs(panel).display : null,
    panelRadius: panel ? cs(panel).borderRadius : null,
    panelBg: panel ? cs(panel).backgroundColor : null,
    rows: items.map((i) => ({
      h: px(i),
      radius: cs(i).borderRadius,
      padStart: cs(i).paddingInlineStart,
      bg: cs(i).backgroundColor,
      selected: i.hasAttribute('mono-selected'),
      hasCheck: cs(i).backgroundImage !== 'none',
    })),
    triggerRing: cs(rootOf(id).querySelector('[mono-trigger]')).boxShadow,
  }
}

window.__ready = true
