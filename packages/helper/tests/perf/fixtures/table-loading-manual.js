// `<mono-table-loading>`'s manual `loading` prop.
//
// Three overlays share ONE stub controller whose `loading` the spec flips:
//   · `auto`   — no `loading`: follows the controller (the old behaviour);
//   · `forced` — `loading = true`: shown whatever the controller says;
//   · `off`    — `loading = false`: hidden whatever the controller says.
// Plus `bare`, with no controller at all, driven only by the prop, and `attr`, set through the
// attribute (`loading="false"` must mean OFF, not "present, therefore on").
// `min-duration="0"` everywhere, so a hide is immediate and the reads need no waiting.

import '@mono-lit/helper/ui/table'

const listeners = new Set()
const grid = {
  loading: false,
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}
const notify = () => {
  for (const fn of listeners) fn()
}

const table = (id) => `
  <div mono-table-scroll style="height:120px">
    <table mono-table><caption><mono-table-loading id="${id}" min-duration="0"></mono-table-loading></caption>
      <thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody>
    </table>
  </div>`

document.querySelector('#app').innerHTML =
  table('auto') + table('forced') + table('off') + table('bare') +
  table('attr').replace('min-duration="0"', 'min-duration="0" loading="false"')

for (const id of ['auto', 'forced', 'off', 'attr']) document.getElementById(id).dataGrid = grid
document.getElementById('forced').loading = true
document.getElementById('off').loading = false

const tick = () => new Promise((r) => setTimeout(r, 30))

/** Is each overlay showing? (`data-mono-loading` is the element's own state.) */
window.__read = () =>
  Object.fromEntries(
    ['auto', 'forced', 'off', 'bare', 'attr'].map((id) => [id, document.getElementById(id).hasAttribute('data-mono-loading')]),
  )

window.__setController = async (on) => {
  grid.loading = on
  notify()
  await tick()
  return window.__read()
}

window.__setProp = async (id, value) => {
  document.getElementById(id).loading = value
  await tick()
  return window.__read()
}

window.__attrValue = () => document.getElementById('attr').loading

setTimeout(() => {
  window.__ready = true
}, 100)
