// `check().version` moves on every selection notify, and `monoDataDropdown` forwards a grid
// notify only when something its readers use has moved — not, e.g., a virtual-scroll window shift.
import { describe, it, expect } from 'vitest'
import { monoDataDropdown } from '../src/components/dropdown-table/mono-data-dropdown'

const ROWS = Array.from({ length: 50 }, (_, i) => ({ Id: i + 1, Name: `Row ${i + 1}` }))
const flush = () => new Promise((r) => setTimeout(r, 0))

describe('dropdown grid-notify forwarding', () => {
  it('bumps check().version on every selection notify', async () => {
    const dd = monoDataDropdown(ROWS, { keyExpr: 'Id', displayExpr: 'Name', multiple: true })
    await dd.table.load()
    const v0 = dd.table.check().version
    dd.table.check().toggle(ROWS[0]!)
    expect(dd.table.check().version).toBe(v0 + 1)
    dd.table.check().clear()
    expect(dd.table.check().version).toBe(v0 + 2)
  })

  it('forwards a selection change, skips a window-only notify', async () => {
    const dd = monoDataDropdown(ROWS, { keyExpr: 'Id', displayExpr: 'Name', multiple: true })
    await dd.table.setScrollPaging('virtual')
    await flush()
    let n = 0
    let gridN = 0
    dd.subscribe(() => n++)
    dd.table.subscribe(() => gridN++)

    dd.table.setVirtualWindow(0, 10, 0, 1000)
    await flush()
    dd.table.setVirtualWindow(10, 20, 400, 600)
    await flush()
    expect(gridN).toBeGreaterThan(0) // the grid DID notify…
    expect(n).toBe(0) // …and the dropdown did not pass it on

    dd.table.check().toggle(ROWS[0]!)
    await flush()
    expect(n).toBe(1)
  })
})
