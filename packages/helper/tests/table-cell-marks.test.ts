// @vitest-environment jsdom
//
// Cell marks — the attributes `table.css` keys the seamless-editor (`mono-edit-cell`) and
// action-cell (`mono-action-cell`) rules on, set by the element in the cell instead of
// `td:has(…)` (which Chrome re-ran over every cell on every virtual-scroll row insert).
//
// Plain elements with mono tag names stand in for the controls: only the helper is under test,
// and the lifecycle hooks in `form-control-core` / `button-core` are one call each.
import { describe, it, expect, afterEach } from 'vitest'
import {
  isActionCellButton,
  isEditCellControl,
  markTableCell,
  unmarkTableCell,
} from '../src/composables/table-cell-marks'

const el = (tag: string) => document.createElement(tag)

function table(cells: number) {
  const t = document.createElement('table')
  t.innerHTML = `<tbody><tr>${'<td></td>'.repeat(cells)}</tr></tbody>`
  document.body.appendChild(t)
  return Array.from(t.querySelectorAll('td'))
}

describe('table cell marks', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('names exactly the controls the old :has() rules listed, in both builds', () => {
    for (const tag of ['input', 'textarea', 'select', 'tag-input', 'date', 'dropdown-table', 'checkbox', 'radio', 'switch']) {
      expect(isEditCellControl(el(`mono-${tag}`))).toBe(true)
      expect(isEditCellControl(el(`mono-shadow-${tag}`))).toBe(true)
    }
    // Form controls that were never flattened stay out.
    for (const tag of ['mono-otp', 'mono-slider', 'mono-file-upload', 'mono-rich-text-editor', 'mono-button', 'input'])
      expect(isEditCellControl(el(tag))).toBe(false)
    expect(isActionCellButton(el('mono-button'))).toBe(true)
    expect(isActionCellButton(el('mono-shadow-button'))).toBe(true)
    expect(isActionCellButton(el('mono-button-dropdown'))).toBe(false)
  })

  it('marks the closest cell of an editor at any depth, and unmarks it when it leaves', () => {
    const [td] = table(1)
    const wrap = el('div')
    const input = el('mono-input')
    wrap.appendChild(input)
    td!.appendChild(wrap)
    markTableCell(input, 'mono-edit-cell')
    expect(td!.hasAttribute('mono-edit-cell')).toBe(true)

    input.remove()
    unmarkTableCell(input)
    expect(td!.hasAttribute('mono-edit-cell')).toBe(false)
  })

  it('keeps the mark while a second editor is still in the cell', () => {
    const [td] = table(1)
    const a = el('mono-input'), b = el('mono-select')
    td!.append(a, b)
    markTableCell(a, 'mono-edit-cell')
    markTableCell(b, 'mono-edit-cell')
    unmarkTableCell(a)
    expect(td!.hasAttribute('mono-edit-cell')).toBe(true)
    unmarkTableCell(b)
    expect(td!.hasAttribute('mono-edit-cell')).toBe(false)
  })

  it('re-homes the mark when the editor moves to another cell', () => {
    const [a, b] = table(2)
    const input = el('mono-input')
    a!.appendChild(input)
    markTableCell(input, 'mono-edit-cell')
    markTableCell(input, 'mono-edit-cell') // idempotent: a re-connect in the same cell
    b!.appendChild(input)
    markTableCell(input, 'mono-edit-cell')
    expect(a!.hasAttribute('mono-edit-cell')).toBe(false)
    expect(b!.hasAttribute('mono-edit-cell')).toBe(true)
    unmarkTableCell(input)
    expect(b!.hasAttribute('mono-edit-cell')).toBe(false)
  })

  it('marks an action cell only for a button that is a DIRECT child (was `td:has(> mono-button)`)', () => {
    const [direct, nested] = table(2)
    const b1 = el('mono-button')
    direct!.appendChild(b1)
    markTableCell(b1, 'mono-action-cell')
    expect(direct!.hasAttribute('mono-action-cell')).toBe(true)

    const b2 = el('mono-button')
    const wrap = el('div')
    wrap.appendChild(b2)
    nested!.appendChild(wrap)
    markTableCell(b2, 'mono-action-cell')
    expect(nested!.hasAttribute('mono-action-cell')).toBe(false)
  })

  it('does nothing outside a table cell', () => {
    const input = el('mono-input')
    document.body.appendChild(input)
    markTableCell(input, 'mono-edit-cell')
    unmarkTableCell(input)
    expect(document.querySelector('[mono-edit-cell]')).toBeNull()
  })
})
