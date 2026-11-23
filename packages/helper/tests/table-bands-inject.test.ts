// `grouped` — the tbody injector (`components/table/table-bands.ts`): band rows go in
// front of the right data rows, the rows that are not data (spacers, fillers, a
// consumer's extras, detail rows) are skipped, a reorder by the framework is undone
// on the next pass, and stop() leaves the tbody as it found it.

import { describe, expect, it } from 'vitest'
import { BandInjector, type BandHost } from '../src/components/table/table-bands'
import { groupedWindow, buildGrouped, normalizeGrouped } from '../src/components/table/grouped-bands'

type Row = { Id: number; Brand: string }
const rows: Row[] = [
  { Id: 1, Brand: 'A' },
  { Id: 2, Brand: 'A' },
  { Id: 3, Brand: 'B' },
]
const fields = normalizeGrouped<Row>({ fields: ['Brand'] })!.fields

function host(collapsed = new Set<string>()) {
  const subs = new Set<() => void>()
  const toggled: string[] = []
  const layout = buildGrouped(rows, fields, collapsed)
  const h: BandHost & { emit(): void; toggled: string[] } = {
    subscribe: (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    groupedWindow: groupedWindow(layout, 0, layout.visible.length),
    items: layout.visible,
    scrollMode: 'off',
    toggleGrouped: (p) => void toggled.push(p),
    emit: () => subs.forEach((cb) => cb()),
    toggled,
  }
  return h
}

function table(dataRows: number) {
  const el = document.createElement('table')
  el.innerHTML = `
    <thead><tr><th>Id</th><th>Brand</th></tr></thead>
    <tbody>
      <tr aria-hidden="true" class="spacer"><td colspan="2"></td></tr>
      ${Array.from({ length: dataRows }, (_, i) => `<tr data-id="${i + 1}"><td>${i + 1}</td><td></td></tr>`).join('')}
      <tr class="mono-table-filler"><td></td><td></td></tr>
    </tbody>`
  document.body.appendChild(el)
  return el
}

const order = (el: HTMLTableElement) =>
  Array.from(el.tBodies[0]!.rows).map((tr) =>
    tr.hasAttribute('mono-grouped')
      ? `band:${tr.querySelector('[mono-grouped-text]')!.textContent}${tr.querySelector('[mono-grouped-count]')!.textContent}`
      : tr.dataset.id
        ? `row:${tr.dataset.id}`
        : tr.className || 'other',
  )

describe('BandInjector', () => {
  it('puts each band in front of its first row, skipping spacer / filler', () => {
    const el = table(3)
    const inj = new BandInjector(host(), el)
    inj.flush()
    expect(order(el)).toEqual(['spacer', 'band:A(2)', 'row:1', 'row:2', 'band:B(1)', 'row:3', 'mono-table-filler'])
    const band = el.querySelector('tr[mono-grouped]')!
    expect(band.hasAttribute('data-mono-stripe-skip')).toBe(true)
    expect((band.firstElementChild as HTMLTableCellElement).colSpan).toBe(2)
    expect(band.getAttribute('mono-variant')).toBe('tonal')
    expect(band.getAttribute('mono-color')).toBe('primary')
    expect(band.getAttribute('aria-expanded')).toBe('true')
    inj.stop()
  })

  it('skips a pass while the row count does not match (mid-patch)', () => {
    const el = table(2)
    const inj = new BandInjector(host(), el)
    inj.flush()
    expect(el.querySelectorAll('tr[mono-grouped]')).toHaveLength(0)
    inj.stop()
  })

  it('re-places bands after the framework reorders rows, reusing the nodes', () => {
    const el = table(3)
    const inj = new BandInjector(host(), el)
    inj.flush()
    const bandA = el.querySelector('tr[mono-grouped]')
    const body = el.tBodies[0]!
    // A framework moving row 3 to the top — the band no longer heads row 1.
    const r3 = body.querySelector('tr[data-id="3"]')!
    body.insertBefore(r3, body.querySelector('tr[data-id="1"]'))
    r3.dataset.id = '1x'
    inj.flush()
    const names = order(el)
    expect(names[1]).toBe('band:A(2)')
    expect(names[2]).toBe('row:1x')
    expect(el.querySelector('tr[mono-grouped]')).toBe(bandA)
    inj.stop()
  })

  it('ignores a consumer row marked data-mono-stripe-skip and a detail row', () => {
    const el = table(3)
    const body = el.tBodies[0]!
    const extra = document.createElement('tr')
    extra.setAttribute('data-mono-stripe-skip', '')
    extra.className = 'extra'
    body.insertBefore(extra, body.querySelector('tr[data-id="3"]'))
    const inj = new BandInjector(host(), el)
    inj.flush()
    expect(order(el)).toEqual(['spacer', 'band:A(2)', 'row:1', 'row:2', 'extra', 'band:B(1)', 'row:3', 'mono-table-filler'])
    inj.stop()
  })

  it('toggles on click / Enter when collapsible', () => {
    const el = table(3)
    const h = host()
    const inj = new BandInjector(h, el)
    inj.flush()
    const band = el.querySelector('tr[mono-grouped]') as HTMLTableRowElement
    band.click()
    band.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(h.toggled).toEqual([band.dataset.groupedPath, band.dataset.groupedPath])
    inj.stop()
  })

  it('draws a folded band after the last row when it is the trailing one', () => {
    const all = buildGrouped(rows, fields)
    const b = all.grouped.find((x) => x.label === 'B')!
    const el = table(2)
    const inj = new BandInjector(host(new Set([b.path])), el)
    inj.flush()
    expect(order(el)).toEqual(['spacer', 'band:A(2)', 'row:1', 'row:2', 'band:B(1)', 'mono-table-filler'])
    expect(el.querySelector('tr[mono-grouped-collapsed]')!.getAttribute('aria-expanded')).toBe('false')
    inj.stop()
  })

  it('stop() removes every band row', () => {
    const el = table(3)
    const inj = new BandInjector(host(), el)
    inj.flush()
    inj.stop()
    expect(el.querySelectorAll('tr[mono-grouped]')).toHaveLength(0)
    expect(el.hasAttribute('mono-grouped-table')).toBe(false)
  })

  it('writes a literal CSS colour inline', () => {
    const cfg = normalizeGrouped<Row>({ fields: [{ field: 'Brand', color: '#7c3aed' }] })!
    const layout = buildGrouped(rows, cfg.fields)
    const h = host()
    ;(h as any).groupedWindow = groupedWindow(layout, 0, 3)
    const el = table(3)
    const inj = new BandInjector(h, el)
    inj.flush()
    const band = el.querySelector('tr[mono-grouped]') as HTMLElement
    expect(band.getAttribute('mono-color')).toBe('custom')
    expect(band.getAttribute('style')).toContain('--_mono-table-grouped-accent-preset:#7c3aed')
    inj.stop()
  })
})
