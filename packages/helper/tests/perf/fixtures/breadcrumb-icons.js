// Fixture for breadcrumb icon rendering.
//
// Four ways an icon reaches a crumb, and every one of them was broken or mis-sized:
//   light  + `item.icon` iconify class
//   light  + user `slot="icon-<id>"` SVG   (placeholder parked it as a GRANDchild)
//   shadow + `item.icon` iconify class
//   shadow + user `slot="icon-<id>"` SVG   (no wrapper was rendered at all)
// Plus the hand-written CSS form, which was always fine and must stay that way.

import '@mono-lit/helper/ui/breadcrumb'
import '@mono-lit/helper/ui/shadow/breadcrumb'

const ICONIFY = [
  { id: 'home', title: 'Dashboard', href: '#', icon: 'i-mdi-view-dashboard' },
  { id: 'team', title: 'Team', href: '#', icon: 'i-mdi-account-group' },
  { id: 'member', title: 'Ahmad Fauzi', icon: 'i-mdi-account-circle' },
]

const SLOTTED = [
  { id: 'home', title: 'Home', href: '#' },
  { id: 'klaim', title: 'Klaim', href: '#' },
  { id: 'detail', title: '#KLM-0053' },
]

const SVGS = `
  <svg slot="icon-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/>
  </svg>
  <svg slot="icon-klaim" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>`

// The hand-written form the css/ demos use — direct-child svg, no element involved.
const RAW = `
  <nav mono-breadcrumb id="raw">
    <ol mono-list>
      <li mono-item><a mono-action href="#">
        <span mono-icon><span mono-glyph class="i-mdi-view-dashboard"></span></span>
        <span mono-content><span mono-title>Dashboard</span></span>
      </a></li>
      <li mono-item><a mono-action href="#">
        <span mono-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12l9-9 9 9"/></svg></span>
        <span mono-content><span mono-title>Home</span></span>
      </a></li>
    </ol>
  </nav>`

document.querySelector('#app').innerHTML = `
  <mono-breadcrumb id="l-icon"></mono-breadcrumb>
  <mono-breadcrumb id="l-slot">${SVGS}</mono-breadcrumb>
  <mono-shadow-breadcrumb id="s-icon"></mono-shadow-breadcrumb>
  <mono-shadow-breadcrumb id="s-slot">${SVGS}</mono-shadow-breadcrumb>
  ${RAW}`

customElements.whenDefined('mono-breadcrumb').then(() => {
  document.querySelector('#l-icon').items = ICONIFY
  document.querySelector('#l-slot').items = SLOTTED
  document.querySelector('#s-icon').items = ICONIFY
  document.querySelector('#s-slot').items = SLOTTED
  setTimeout(() => {
    window.__ready = true
  }, 250)
})

/**
 * For each crumb icon wrapper: the wrapper's box, and the box of whatever actually
 * paints inside it (through a `<slot>`, through the light placeholder, or direct).
 * The painted element must FILL the wrapper — overflowing means the icon spills past
 * its slot, `0` means it is invisible, and `NONE` means nothing rendered at all.
 */
window.__iconReport = (hostId) => {
  const host = document.querySelector('#' + hostId)
  const root = host.shadowRoot ?? host
  return [...root.querySelectorAll('[mono-icon]')].map((wrap) => {
    const wcs = getComputedStyle(wrap)

    // Walk to the element that actually has a box: a slot's assigned node, or past
    // a `display: contents` placeholder.
    let inner = wrap.querySelector('slot')
      ? wrap.querySelector('slot').assignedElements()[0]
      : wrap.firstElementChild
    while (inner && getComputedStyle(inner).display === 'contents') {
      inner = inner.firstElementChild
    }

    const ics = inner && getComputedStyle(inner)
    return {
      wrapW: Math.round(parseFloat(wcs.width) * 100) / 100,
      wrapH: Math.round(parseFloat(wcs.height) * 100) / 100,
      innerW: ics ? Math.round(parseFloat(ics.width) * 100) / 100 : null,
      innerH: ics ? Math.round(parseFloat(ics.height) * 100) / 100 : null,
      tag: inner ? inner.tagName.toLowerCase() : 'NONE',
    }
  })
}
