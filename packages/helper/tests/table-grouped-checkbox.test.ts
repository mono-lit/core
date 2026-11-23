// `grouped.selectable` in the DOM: the band row gets a real `<mono-table-checkbox
// type="grouped">` in the column the row checkboxes sit in (pinned like them), its
// tick selects the band's rows in `table.check()` — the same store the row boxes
// read — it never folds the band, and the column survives every band being folded.

import { afterEach, describe, expect, it } from 'vitest'
import '../src/components/table/mono-table-checkbox'
import { monoDataGrid } from '../src/components/table/mono-data-grid'

type Row = { Id: number; Brand: string }
const data = (): Row[] => [
  { Id: 1, Brand: 'A' },
  { Id: 2, Brand: 'A' },
  { Id: 3, Brand: 'B' },
]

const tick = () => new Promise((r) => setTimeout(r, 0))
type Box = HTMLElement & { updateComplete: Promise<unknown>; type: string; groupedPath?: string; dataGrid?: unknown; item?: unknown }

async function setup(selectable: any = true) {
  const grid = monoDataGrid<Row>(data(), { keyExpr: 'Id', grouped: { selectable, fields: ['Brand'] } })
  await grid.load()
  const table = document.createElement('table')
  table.className = 'mono-table'
  table.innerHTML = `
    <thead><tr>
      <th class="mono-table-sticky-left"></th>
      <th class="mono-table-sticky-left" style="--mono-table-sticky-left: 8px"></th>
      <th>Id</th><th>Brand</th>
    </tr></thead>
    <tbody></tbody>`
  document.body.appendChild(table)
  const body = table.tBodies[0]!
  // What a framework does: render the window's rows, each with its row checkbox.
  const render = () => {
    for (const tr of Array.from(body.rows)) if (!tr.hasAttribute('mono-grouped')) tr.remove()
    for (const r of grid.items) {
      const tr = document.createElement('tr')
      tr.innerHTML = `<td class="mono-table-sticky-left"></td>
        <td class="mono-table-sticky-left" style="--mono-table-sticky-left: 8px"><mono-table-checkbox size="sm"></mono-table-checkbox></td>
        <td>${r.Id}</td><td>${r.Brand}</td>`
      const box = tr.querySelector('mono-table-checkbox') as Box
      box.dataGrid = grid
      box.item = r
      body.appendChild(tr)
    }
  }
  render()
  grid.subscribe(render)
  grid.bindGroupedHost(table)
  await tick()
  await tick()
  return { grid, table }
}

const bandOf = (table: HTMLTableElement, brand: string) =>
  Array.from(table.querySelectorAll<HTMLTableRowElement>('tr[mono-grouped]')).find(
    (tr) => tr.querySelector('[mono-grouped-text]')!.textContent === brand,
  )!

afterEach(() => {
  document.body.innerHTML = ''
})

describe('grouped.selectable — band checkbox in the DOM', () => {
  it('puts a type="grouped" box in the row checkboxes\' column, pinned like them', async () => {
    const { table } = await setup()
    const band = bandOf(table, 'A')
    const cells = Array.from(band.cells)
    expect(cells.map((c) => [...c.attributes].map((a) => a.name).filter((n) => n.startsWith('mono-')).sort().join(' '))).toEqual([
      'mono-grouped-lead mono-sticky-left',
      'mono-grouped-check mono-sticky-left',
      'mono-grouped-cell',
    ])
    expect(cells[1]!.getAttribute('style')).toContain('--mono-table-sticky-left: 8px')
    expect(cells[2]!.colSpan).toBe(2)
    const box = cells[1]!.firstElementChild as Box
    expect(box.localName).toBe('mono-table-checkbox')
    expect(box.type).toBe('grouped')
    expect((box as any).size).toBe('sm') // the row boxes' size
    expect(band.hasAttribute('mono-grouped-selectable')).toBe(true)
  })

  it('ticks the band rows in check(), without folding the band; a row untick makes it mixed', async () => {
    const { grid, table } = await setup()
    const band = bandOf(table, 'A')
    const box = band.querySelector('[mono-grouped-check] > mono-table-checkbox') as Box
    await box.updateComplete
    box.querySelector('input')!.click()
    await tick()
    expect(grid.check().getAll().map((r) => r.Id).sort()).toEqual([1, 2])
    expect(grid.isGroupedCollapsed(band.dataset.groupedPath!)).toBe(false)
    await box.updateComplete
    expect(box.querySelector('input')!.checked).toBe(true)

    // The row boxes read the same store.
    const rowBoxes = Array.from(table.querySelectorAll('tr:not([mono-grouped]) mono-table-checkbox')) as Box[]
    await Promise.all(rowBoxes.map((b) => b.updateComplete))
    expect(rowBoxes.map((b) => b.querySelector('input')!.checked)).toEqual([true, true, false])

    grid.check().toggle(grid.items[0]!, false)
    await tick()
    await box.updateComplete
    expect(box.querySelector('input')!.indeterminate).toBe(true)
  })

  it('passes selectable.checkbox props to the box; unset ones follow the row boxes / band label', async () => {
    const { table } = await setup({ checkbox: { size: 'xl', color: 'success', cssClassName: 'band-box', ariaLabelText: 'Pick it' } })
    const box = table.querySelector('tr[mono-grouped] [mono-grouped-check] > mono-table-checkbox') as any
    await box.updateComplete
    expect([box.size, box.color, box.cssClassName, box.ariaLabelText, box.disabled]).toEqual(['xl', 'success', 'band-box', 'Pick it', false])
    expect(box.querySelector('label').classList.contains('band-box')).toBe(true)
    const plain = await setup(true)
    const box2 = plain.table.querySelector('tr[mono-grouped] [mono-grouped-check] > mono-table-checkbox') as any
    expect([box2.size, box2.color, box2.ariaLabelText]).toEqual(['sm', 'primary', 'A'])
  })

  it('a disabled band box ticks nothing', async () => {
    const { grid } = await setup({ checkbox: { disabled: true } })
    grid.checkGrouped(grid.grouped[0]!.path, true)
    expect(grid.check().count()).toBe(0)
  })

  it('keeps the box when every band is folded (the column is remembered)', async () => {
    const { grid, table } = await setup()
    grid.collapseAllGrouped()
    await tick()
    await tick()
    expect(table.querySelectorAll('tbody tr:not([mono-grouped])')).toHaveLength(0)
    expect(table.querySelectorAll('tr[mono-grouped] [mono-grouped-check] > mono-table-checkbox')).toHaveLength(2)
  })

  it('draws no box without row checkboxes, and none on a level with selectable: false', async () => {
    const grid = monoDataGrid<Row>(data(), { keyExpr: 'Id', grouped: { selectable: true, fields: ['Brand'] } })
    await grid.load()
    const table = document.createElement('table')
    table.innerHTML = `<thead><tr><th>Id</th><th>Brand</th></tr></thead><tbody>${grid.items
      .map((r) => `<tr><td>${r.Id}</td><td>${r.Brand}</td></tr>`)
      .join('')}</tbody>`
    document.body.appendChild(table)
    grid.bindGroupedHost(table)
    await tick()
    expect(table.querySelectorAll('[mono-grouped-check]')).toHaveLength(0)
    expect((table.querySelector('tr[mono-grouped] > td') as HTMLTableCellElement).colSpan).toBe(2)

    const off = await setup(false)
    expect(off.table.querySelectorAll('[mono-grouped-check]')).toHaveLength(0)
  })
})
