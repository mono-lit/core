// Legacy class contract for the consumer-written table markup.
//
// The table (and the dropdown-table's panel) is markup the CONSUMER writes, and
// host apps still spell it with the pre-port CLASSES: `<div class="mono-table-scroll
// scroll-y"><table class="mono-table mono-table-sticky-head mono-table-fixed">…<th
// class="mono-table-sticky-right">`, rows `.mono-table-row-editing`, the foot
// `.mono-table-foot` > `.mono-table-page-size` > `select.mono-table-sel`, paging
// `.mono-table-pg` > `.mono-table-pgb.on`, and inside a dropdown-table
// `.mono-dropdown-table-region.body table.mono-table tr.mono-dd-row-selected`.
//
// `scripts/legacy-class-alias.mjs` aliases every attribute selector in the two
// sheets to that class. This fixture renders the SAME structure twice — once with
// attributes, once with classes — plus a bare `<table>` as the control, and hands
// the spec every computed property of every element pair.

import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/dropdown-table'

const TABLE = (m) => `
  <div ${m('mono-table-scroll mono-scroll-y', 'mono-table-scroll scroll-y')} style="height: 160px">
    <table ${m('mono-table mono-sticky-head mono-fixed mono-color="danger"', 'mono-table mono-table-sticky-head mono-table-fixed mono-table-danger')}>
      <thead>
        <tr><th>Id</th><th>Name</th><th ${m('mono-sticky-right', 'mono-table-sticky-right')}>Act</th></tr>
      </thead>
      <tbody>
        <tr data-row-key="1"><td>1</td><td>Ada</td><td ${m('mono-sticky-right', 'mono-table-sticky-right')}>x</td></tr>
        <tr data-row-key="2" ${m('mono-editing', 'mono-table-row-editing')}><td>2</td><td>Alan</td><td ${m('mono-sticky-right', 'mono-table-sticky-right')}>x</td></tr>
        <tr data-row-key="3" ${m('mono-selected', 'mono-table-row-selected')}><td>3</td><td>Grace</td><td ${m('mono-sticky-right', 'mono-table-sticky-right')}>x</td></tr>
        <tr data-row-key="4"><td>4</td><td>Kay</td><td ${m('mono-sticky-right', 'mono-table-sticky-right')}>x</td></tr>
        <tr ${m('mono-filler', 'mono-table-filler')} aria-hidden="true"><td colspan="3"></td></tr>
      </tbody>
    </table>
  </div>
  <div ${m('mono-table-foot', 'mono-table-foot')}>
    <label ${m('mono-table-page-size', 'mono-table-page-size')}>Rows <select ${m('mono-sel', 'mono-table-sel')}><option>10</option><option>20</option></select></label>
    <span ${m('mono-table-info', 'mono-table-info')}>1–4 of 4</span>
    <div ${m('mono-table-paging', 'mono-table-pg')}>
      <button type="button" ${m('mono-pgb', 'mono-table-pgb')}>‹</button>
      <button type="button" ${m('mono-pgb mono-on', 'mono-table-pgb on')}>1</button>
      <button type="button" ${m('mono-pgb', 'mono-table-pgb')}>2</button>
      <button type="button" ${m('mono-pgb', 'mono-table-pgb')}>›</button>
    </div>
  </div>`

const DROPDOWN = (m) => `
  <div ${m('mono-dropdown-table mono-open mono-size="sm" mono-has-value', 'mono-dropdown-table open sm has-value')} style="width: 320px">
    <label ${m('mono-dd-label', 'mono-dropdown-table-label')}>Owner</label>
    <div ${m('mono-dd-control', 'mono-dropdown-table-control')}>
      <div ${m('mono-dd-trigger', 'mono-dropdown-table-trigger')} role="combobox" tabindex="0" aria-expanded="true">
        <span ${m('mono-dd-value', 'mono-dropdown-table-value')}><span>Ada</span></span>
        <span ${m('mono-dd-actions', 'mono-dropdown-table-actions')}>
          <span ${m('mono-dd-clear', 'mono-dropdown-table-clear')} role="button">×</span>
          <span ${m('mono-dd-arrow', 'mono-dropdown-table-arrow')} role="button">v</span>
        </span>
      </div>
      <div ${m('mono-dd-panel', 'mono-dropdown-table-panel open')} role="dialog" style="position: static; width: 100%">
        <div ${m('mono-dd-region="search"', 'mono-dropdown-table-region search')}><input type="search" placeholder="Search" /></div>
        <div ${m('mono-dd-region="body"', 'mono-dropdown-table-region body')}>
          <table ${m('mono-table', 'mono-table')}>
            <thead><tr><th>Name</th><th>Role</th></tr></thead>
            <tbody>
              <tr data-row-key="1" ${m('mono-selected', 'mono-dd-row-selected')}><td>Ada</td><td>Analyst</td></tr>
              <tr data-row-key="2" ${m('mono-dd-active', 'mono-dd-row-active')}><td>Alan</td><td>Engineer</td></tr>
              <tr data-row-key="3"><td>Grace</td><td>Admiral</td></tr>
            </tbody>
          </table>
        </div>
        <div ${m('mono-dd-region="foot"', 'mono-dropdown-table-region foot')}>3 of 3</div>
      </div>
    </div>
    <div ${m('mono-dd-message="helper"', 'mono-dropdown-table-message helper')}>Pick one</div>
  </div>`

const attr = (a) => a
const cls = (a, c) => `class="${c}"`

const host = document.createElement('div')
// row hover is opt-in (`--mono-table-hover-bg`); switched on so the hover rule has
// something visible to prove on both spellings
host.style.cssText = 'width: 720px; padding: 16px; display: grid; gap: 24px; --mono-table-hover-bg: rgb(200, 220, 255)'
host.innerHTML = `
  <div id="t-attr">${TABLE(attr)}</div>
  <div id="t-cls">${TABLE(cls)}</div>
  <div id="d-attr">${DROPDOWN(attr)}</div>
  <div id="d-cls">${DROPDOWN(cls)}</div>
  <div id="bare"><table><thead><tr><th>Id</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>`
document.body.appendChild(host)

const PROPS = [
  'display', 'position', 'top', 'right', 'bottom', 'left', 'zIndex', 'height', 'minHeight', 'width',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom',
  'backgroundColor', 'color', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
  'borderTopLeftRadius', 'borderBottomRightRadius', 'boxShadow', 'opacity', 'overflowX', 'overflowY',
  'borderCollapse', 'borderSpacing', 'tableLayout', 'whiteSpace', 'cursor', 'outlineWidth',
]
const paint = (el) => {
  const cs = getComputedStyle(el)
  const out = {}
  for (const p of PROPS) out[p] = cs[p]
  return out
}
const describe = (el) => el.tagName.toLowerCase() + (el.getAttributeNames().filter((n) => n !== 'style' && n !== 'class').map((n) => `[${n}]`).join('') || (el.className ? '.' + String(el.className).split(/\s+/).join('.') : ''))

/** Compare the two renderings of a structure element by element. */
window.__compare = (which) => {
  const a = [...document.querySelectorAll(`#${which}-attr *`)]
  const b = [...document.querySelectorAll(`#${which}-cls *`)]
  if (a.length !== b.length) return { count: [a.length, b.length], diffs: [{ el: 'structure', prop: 'length' }] }
  const diffs = []
  a.forEach((ea, i) => {
    const pa = paint(ea), pb = paint(b[i])
    for (const p of PROPS) if (pa[p] !== pb[p]) diffs.push({ i, el: describe(ea), prop: p, attr: pa[p], cls: pb[p] })
  })
  return { count: [a.length, b.length], diffs: diffs.slice(0, 20) }
}
/** The sheet actually applies: a class-spelled th is not the bare browser th. */
window.__control = () => {
  const th = document.querySelector('#t-cls thead th')
  const bare = document.querySelector('#bare thead th')
  const cth = paint(th), cbare = paint(bare)
  const differs = PROPS.filter((p) => cth[p] !== cbare[p])
  const sticky = document.querySelector('#t-cls tbody td.mono-table-sticky-right')
  const on = document.querySelector('#t-cls .mono-table-pgb.on')
  const off = document.querySelector('#t-cls .mono-table-pgb:not(.on)')
  const sel = document.querySelector('#d-cls tr.mono-dd-row-selected')
  const plain = document.querySelector('#d-cls tbody tr:last-child')
  // the row model paints on the <tr> (cells stay transparent) — read the row
  return {
    differs,
    stickyPosition: getComputedStyle(sticky).position,
    pagingOnDiffers: getComputedStyle(on).backgroundColor !== getComputedStyle(off).backgroundColor,
    selectedRowDiffers: getComputedStyle(sel).backgroundColor !== getComputedStyle(plain).backgroundColor,
  }
}
window.__rowPoint = (which, row) => {
  const r = document.querySelector(`#${which} tbody tr[data-row-key="${row}"] td`).getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}
window.__rowBg = (which, row) => getComputedStyle(document.querySelector(`#${which} tbody tr[data-row-key="${row}"]`)).backgroundColor

window.__ready = true
