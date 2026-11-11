// Filter suggestion — the probe behind `<mono-table-search :suggestion-filter>`.
//
// A search that matches nothing under the form's current filter (`Dept = MKT`) may match
// rows under ANOTHER value. The probe relaxes one mapped field at a time, counts per value,
// and — the part that matters most — only offers values the user can actually PICK in that
// field, which is decided by the field's own option source (per-user / cascading lists).
import { describe, it, expect, vi } from 'vitest'
import {
  allowedValues,
  buildProbeFilter,
  probeFilterSuggestion,
  type ProbeGrid,
} from '../src/components/table/filter-suggestion'
import { monoForm } from '../src/components/form/mono-form-controller'
import { createApplyGate } from '../src/utils/data-source-apply'

const ROWS = [
  { Id: 1, Nama: 'Andy Hart', CodeDept: 'HR', Year: 2026 },
  { Id: 2, Nama: 'Andy Lim', CodeDept: 'HR', Year: 2026 },
  { Id: 3, Nama: 'Andy Ko', CodeDept: 'HR', Year: 2025 },
  { Id: 4, Nama: 'Andy Fin', CodeDept: 'FIN', Year: 2026 },
  { Id: 5, Nama: 'Andy Ops', CodeDept: 'OPS', Year: 2026 },
  { Id: 6, Nama: 'Budi', CodeDept: 'MKT', Year: 2026 },
]

const DEPTS = [
  { Code: 'MKT', Nama: 'Marketing' },
  { Code: 'HR', Nama: 'Human Resources' },
  { Code: 'FIN', Nama: 'Finance' },
  // OPS deliberately absent — this user can't pick it.
]

function grid(term = 'andy', rows: unknown[] = ROWS): ProbeGrid {
  return {
    searchTerms: [{ value: term }],
    dataSource: { data: () => rows },
    searchValue: () => ['Nama'],
  }
}

function formWith(values: Record<string, unknown>, controls: Record<string, object> = {}) {
  const inputs: Record<string, { value: unknown }> = {}
  for (const [k, v] of Object.entries(values)) inputs[k] = { value: v }
  const form = monoForm({ inputs })
  for (const [k, el] of Object.entries(controls)) form._register(k, el)
  return form
}

const deptSelect = (extra: object = {}) => ({
  items: DEPTS,
  keyValue: 'Code',
  displayValue: (d: { Nama: string; Code: string }) => `${d.Nama} (${d.Code})`,
  ...extra,
})

describe('filter suggestion — probe filter', () => {
  it('pins every OTHER mapped field and leaves the relaxed one free', () => {
    const f = buildProbeFilter(
      'CodeDept',
      { CodeDept: 'Dept', Year: 'Year' },
      { Dept: 'MKT', Year: 2026 },
      ['Nama', 'contains', 'andy'],
      null,
    )
    expect(f).toEqual([['Nama', 'contains', 'andy'], 'and', ['Year', '=', 2026]])
  })

  it('an empty form value pins nothing (it already means "all")', () => {
    const f = buildProbeFilter('CodeDept', { CodeDept: 'Dept', Year: 'Year' }, { Dept: 'MKT', Year: '' }, null, null)
    expect(f).toBeNull()
  })
})

describe('filter suggestion — allowed values', () => {
  it('keeps only candidates present in the control items', async () => {
    const out = await allowedValues(undefined, deptSelect(), 'CodeDept', ['HR', 'OPS'])
    expect([...out!.keys()]).toEqual(['HR'])
    expect(out!.get('HR')!.caption).toBe('Human Resources (HR)')
  })

  it("asks a DataSource with ITS filter (the per-user restriction) AND the candidates", async () => {
    const load = vi.fn(async () => [{ Code: 'HR', Nama: 'Human Resources' }])
    const ds = { store: () => ({ load }), filter: () => ['CompanyId', '=', 1] }
    const out = await allowedValues(undefined, { dataSource: ds, keyValue: 'Code' }, 'CodeDept', ['HR', 'OPS'])
    expect(load).toHaveBeenCalledWith({
      filter: [['CompanyId', '=', 1], 'and', [['Code', '=', 'HR'], 'or', ['Code', '=', 'OPS']]],
    })
    expect([...out!.keys()]).toEqual(['HR'])
  })

  it('`sources` overrides the control, with an explicit keyValue', async () => {
    const out = await allowedValues({ source: [{ Kode: 'FIN' }], keyValue: 'Kode' }, deptSelect(), 'CodeDept', ['HR', 'FIN'])
    expect([...out!.keys()]).toEqual(['FIN'])
  })

  it('nothing to check against → null (trust the counts)', async () => {
    expect(await allowedValues(undefined, null, 'CodeDept', ['HR'])).toBeNull()
  })
})

describe('filter suggestion — probe', () => {
  const cfg = { keys: { CodeDept: 'Dept' } }

  it('suggests the allowed value with the most matches', async () => {
    const form = formWith({ Dept: 'MKT' }, { Dept: deptSelect() })
    const s = await probeFilterSuggestion(cfg, { grid: grid(), form, gate: createApplyGate(true) })
    expect(s).toMatchObject({ key: 'Dept', field: 'CodeDept', value: 'HR', count: 3, current: 'MKT', values: { Dept: 'HR' } })
    expect(s!.caption).toBe('Human Resources (HR)')
  })

  it('never offers a value the user cannot pick', async () => {
    const form = formWith({ Dept: 'MKT' }, { Dept: deptSelect({ items: [{ Code: 'MKT' }, { Code: 'OPS2' }] }) })
    const s = await probeFilterSuggestion(cfg, { grid: grid(), form, gate: createApplyGate(true) })
    expect(s).toBeNull()
  })

  it('never relaxes a readonly / disabled field', async () => {
    for (const lock of [{ readonly: true }, { disabled: true }]) {
      const form = formWith({ Dept: 'MKT' }, { Dept: deptSelect(lock) })
      expect(await probeFilterSuggestion(cfg, { grid: grid(), form, gate: createApplyGate(true) })).toBeNull()
    }
  })

  it('holds the other mapped fields at their form values', async () => {
    const form = formWith({ Dept: 'MKT', Year: 2025 }, { Dept: deptSelect() })
    const s = await probeFilterSuggestion(
      { keys: { CodeDept: 'Dept', Year: 'Year' } },
      { grid: grid(), form, gate: createApplyGate(true) },
    )
    // Relaxing Dept holds Year = 2025: only Andy Ko (HR) → 1 row. Relaxing Year holds
    // Dept = MKT: no Andy in MKT at all → nothing. So the offer is HR, counted in 2025 only.
    expect(s).toMatchObject({ key: 'Dept', value: 'HR', count: 1 })
  })

  it('a multi-value field ADDS every allowed value', async () => {
    const form = formWith({ Dept: ['MKT'] }, { Dept: deptSelect() })
    const s = await probeFilterSuggestion(cfg, { grid: grid(), form, gate: createApplyGate(true) })
    expect(s).toMatchObject({ value: ['HR', 'FIN'], count: 4, values: { Dept: ['MKT', 'HR', 'FIN'] } })
  })

  it('nothing to suggest without a search', async () => {
    const form = formWith({ Dept: 'MKT' }, { Dept: deptSelect() })
    const g = { ...grid(), searchTerms: [] }
    expect(await probeFilterSuggestion(cfg, { grid: g, form, gate: createApplyGate(true) })).toBeNull()
  })

  it('counts a remote store through the scan fallback when it cannot $apply', async () => {
    const load = vi.fn(async (opts: { filter?: unknown; select?: string[] }) => {
      expect(opts.select).toEqual(['CodeDept'])
      return ROWS.filter((r) => r.Nama.toLowerCase().includes('andy')).map((r) => ({ CodeDept: r.CodeDept }))
    })
    const form = formWith({ Dept: 'MKT' }, { Dept: deptSelect() })
    const g = { ...grid(), dataSource: { store: () => ({ load }) } }
    const s = await probeFilterSuggestion(cfg, { grid: g, form, gate: createApplyGate(true) })
    expect(load.mock.calls[0][0].filter).toEqual(['Nama', 'contains', 'andy'])
    expect(s).toMatchObject({ value: 'HR', count: 3 })
  })
})
