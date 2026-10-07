// A checkbox / radio / switch inside a table cell must still have a size.
//
// The seamless-inline-editor rule flattens a `<td>` that contains a mono control and
// sets `--theme-control-height-*: auto`. For a FIELD that token is a min-height, so
// `auto` is right. For these three it is the actual geometry — box, circle and track
// are all `calc(token * 0.5)` — and `calc(auto * 0.5)` is invalid at computed-value
// time, so width/height fall back to `auto` and the control renders 0x0.
//
// Every arm below reads a real painted box (`getBoundingClientRect`), never a
// computed string, so "it has a size" is measured rather than asserted.

import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/checkbox'
import '@mono-lit/helper/ui/radio'
import '@mono-lit/helper/ui/switch'
import '@mono-lit/helper/ui/input'

document.querySelector('#app').innerHTML = `
  <table mono-table>
    <thead>
      <tr>
        <th id="th-cell"><mono-checkbox size="sm" aria-label="all"></mono-checkbox></th>
        <th>Header</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td id="td-checkbox"><mono-checkbox size="sm" aria-label="row"></mono-checkbox></td>
        <td>text</td>
      </tr>
      <tr>
        <td id="td-radio"><mono-radio size="sm" name="r" aria-label="row"></mono-radio></td>
        <td>text</td>
      </tr>
      <tr>
        <td id="td-switch"><mono-switch size="sm" aria-label="row"></mono-switch></td>
        <td>text</td>
      </tr>
      <!-- The case a naive selector split would miss: a field AND a box control in
           one cell still matches the editor rule's :has() list. -->
      <tr>
        <td id="td-mixed">
          <mono-input size="sm"></mono-input>
          <mono-checkbox size="sm" aria-label="mixed"></mono-checkbox>
        </td>
        <td>text</td>
      </tr>
      <!-- Control arm: a plain field cell must STILL flatten to auto. -->
      <tr>
        <td id="td-input"><mono-input size="md"></mono-input></td>
        <td>text</td>
      </tr>
    </tbody>
  </table>

  <!-- Baselines: the same controls with no table around them. -->
  <div id="outside"><mono-checkbox size="sm" aria-label="outside"></mono-checkbox></div>
  <div id="outside-radio"><mono-radio size="sm" name="o" aria-label="outside"></mono-radio></div>
  <div id="outside-switch"><mono-switch size="sm" aria-label="outside"></mono-switch></div>
`

/** Painted size of a control's box, looked up inside `sel`. */
function boxOf(sel, part) {
  const host = document.querySelector(sel)
  const el = host?.querySelector(part)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100 }
}

window.__sizes = () => ({
  tdCheckbox: boxOf('#td-checkbox', '.mono-checkbox-box'),
  tdRadio: boxOf('#td-radio', '.mono-radio-circle'),
  tdSwitch: boxOf('#td-switch', '.mono-switch-track'),
  tdMixed: boxOf('#td-mixed', '.mono-checkbox-box'),
  thCheckbox: boxOf('#th-cell', '.mono-checkbox-box'),
  outside: boxOf('#outside', '.mono-checkbox-box'),
  outsideRadio: boxOf('#outside-radio', '.mono-radio-circle'),
  outsideSwitch: boxOf('#outside-switch', '.mono-switch-track'),
})

/**
 * The seamless-editor feature itself: a field cell must still resolve the height
 * token to `auto`, so a fix that simply stopped overriding it cannot pass.
 */
/** The checkbox box's border width — an UNCHECKED box is drawn by its border alone. */
const borderOf = (sel) => {
  const box = document.querySelector(sel)?.querySelector('[mono-box], .mono-checkbox-box')
  return box ? parseFloat(getComputedStyle(box).borderTopWidth) : -1
}
window.__borders = () => ({
  tdCheckbox: borderOf('#td-checkbox'),
  tdMixed: borderOf('#td-mixed'),
  outside: borderOf('#outside'),
})

window.__inputCellToken = () => {
  const td = document.querySelector('#td-input')
  return getComputedStyle(td).getPropertyValue('--theme-control-height-md').trim()
}

setTimeout(() => {
  window.__ready = true
}, 400)
