import { describe, expect, it } from 'vitest'
import { columnCount } from '../src/components/table/table-overlay'

// Regression: `columnCount` used `table.querySelectorAll('thead tr')`, which also matched the header
// of a table NESTED in a row (an open `<mono-table-detail>` panel with its own grid). The outer
// overlay row then got the INNER column count — `colspan="20"` on an 11-column table — and under
// `table-layout: fixed` the phantom columns soaked up the spare width.
const build = (html: string) => {
  const host = document.createElement('div')
  host.innerHTML = html
  return host.querySelector('table') as HTMLTableElement
}

describe('columnCount', () => {
  it('counts only the table\'s own header, not a nested table\'s', () => {
    const table = build(`
      <table>
        <thead>
          <tr><th>A</th><th>B</th><th colspan="2">Band</th></tr>
          <tr><th>C</th><th>D</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>2</td><td>3</td><td>4</td></tr>
          <tr><td colspan="4">
            <table>
              <thead><tr>${'<th>x</th>'.repeat(20)}</tr></thead>
              <tbody><tr>${'<td>y</td>'.repeat(20)}</tr></tbody>
            </table>
          </td></tr>
        </tbody>
      </table>`)
    expect(columnCount(table)).toBe(4)
  })

  it('falls back to the first own body row (skipping overlay rows) without a header', () => {
    const table = build(`
      <table>
        <tbody>
          <tr data-mono-stripe-skip><td colspan="9">overlay</td></tr>
          <tr><td>1</td><td>2</td><td>3</td></tr>
        </tbody>
      </table>`)
    expect(columnCount(table)).toBe(3)
  })
})
