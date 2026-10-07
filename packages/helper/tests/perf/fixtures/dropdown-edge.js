import '@mono-lit/helper/ui/dropdown'

/**
 * Mirrors the shape that broke: a trigger pinned near a viewport edge whose slotted
 * body is FORCED wider than the panel's `max-width` preset (a `w-80` profile menu,
 * 320px, against the md preset's 280px).
 */
function mk(id, placement, css, opts = {}) {
  const d = document.createElement('mono-dropdown')
  d.id = id
  d.setAttribute('placement', placement)
  Object.assign(d.style, { position: 'fixed', top: '10px' }, css)

  const btn = document.createElement('button')
  btn.setAttribute('slot', 'main')
  btn.className = 'trigger-' + id
  btn.textContent = 'AD'

  const body = document.createElement('div')
  body.setAttribute('slot', 'body')
  body.className = 'body-' + id
  if (opts.width) body.style.cssText = `width:${opts.width}px;overflow:hidden;border-radius:12px`
  body.innerHTML = opts.html ?? '<div style="padding:14px">Administrator<br>Super Admin</div>'.repeat(4)

  // Open BEFORE connecting, so the very first render is an open one.
  if (opts.open) d.modelValue = true
  d.appendChild(btn)
  d.appendChild(body)
  document.body.appendChild(d)
  return d
}

window.__dd = {
  // the reported case: bottom-start trigger hard against the right edge
  right: mk('right', 'bottom-start', { right: '12px' }, { width: 320 }),
  // mirror: bottom-end trigger hard against the left edge
  left: mk('left', 'bottom-end', { left: '4px' }, { width: 320 }),
  // control: nowhere near an edge — must not move
  mid: mk('mid', 'bottom-start', { left: '400px' }, { width: 320 }),
  // no explicit width, tiny content — must still sit on the min-width preset floor
  narrow: mk('narrow', 'bottom-start', { left: '400px', top: '200px' }, { html: '<div>Hi</div>' }),
  // no explicit width, long prose — must still wrap at the max-width preset
  prose: mk('prose', 'bottom-start', { left: '400px', top: '400px' }, {
    html: '<div>' + 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod. '.repeat(6) + '</div>',
  }),
  // mounted ALREADY open (the docs' css-vars demo) — must sit under its trigger,
  // not in the viewport's top-left corner
  initial: mk('initial', 'bottom-start', { left: '700px', top: '300px' }, { html: '<div>Hi</div>', open: true }),
}

window.__open = async (id, v) => {
  const d = window.__dd[id]
  d.modelValue = v
  await d.updateComplete
  await new Promise((r) => setTimeout(r, 150))
  if (!v) return null

  const content = document.querySelector('.body-' + id)
  const panel = content.closest('.mono-dropdown-panel')
  const trigger = document.querySelector('.trigger-' + id)
  const c = content.getBoundingClientRect()
  const p = panel.getBoundingClientRect()
  const t = trigger.getBoundingClientRect()
  return {
    // the POSITIONED box — the white background the user sees
    panelLeft: Math.round(p.left),
    panelRight: Math.round(p.right),
    panelWidth: Math.round(p.width),
    // the slotted content
    contentLeft: Math.round(c.left),
    contentRight: Math.round(c.right),
    contentWidth: Math.round(c.width),
    triggerLeft: Math.round(t.left),
    triggerRight: Math.round(t.right),
    vw: window.innerWidth,
    overflowRight: Math.round(c.right - window.innerWidth),
    overflowLeft: Math.round(0 - c.left),
    // how far the content escapes its own white box
    escapesPanel: Math.round(Math.max(p.left - c.left, c.right - p.right)),
  }
}

window.__ready = true
