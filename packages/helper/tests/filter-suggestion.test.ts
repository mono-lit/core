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
    // Case-insensitive, written out (the probe's filter never goes through devextreme's tolower).
    expect(load.mock.calls[0][0].filter).toEqual(["contains(tolower(Nama),'andy')"])
    expect(s).toMatchObject({ value: 'HR', count: 3 })
  })

  it('an OData store: $apply first (case-insensitive), then a url scan when it is rejected', async () => {
    const urls: string[] = []
    const store = {
      version: () => 4,
      _url: 'https://x.test/odata/Orders',
      load: vi.fn(async (opts: { urlOverride?: string }) => {
        urls.push(decodeURIComponent(opts.urlOverride ?? ''))
        if (opts.urlOverride?.includes('$apply')) throw Object.assign(new Error('400'), { httpStatus: 400 })
        return [{ CodeDept: 'HR' }, { CodeDept: 'HR' }, { CodeDept: 'FIN' }]
      }),
    }
    const form = formWith({ Dept: 'MKT' }, { Dept: deptSelect() })
    const g = { ...grid('Andy.K'), dataSource: { store: () => store } }
    const s = await probeFilterSuggestion(cfg, { grid: g, form, gate: createApplyGate(true) })

    expect(urls[0]).toContain('$apply=filter(')
    expect(urls[0]).toContain("contains(tolower(Nama),'andy.k')")
    expect(urls[0]).toContain('/groupby((CodeDept),aggregate($count as count))')
    // The scan carries the filter as text — the "." in the term survives (devextreme's own
    // compiler would have turned it into "/").
    expect(urls[1]).toContain('$filter=')
    expect(urls[1]).toContain("contains(tolower(Nama),'andy.k')")
    expect(urls[1]).toContain('$select=CodeDept')
    expect(s).toMatchObject({ value: 'HR', count: 2 })
  })

  it('accepts a grouped count that arrives as a numeric string', async () => {
    const store = {
      version: () => 4,
      _url: 'https://x.test/odata/Orders',
      load: vi.fn(async () => [{ CodeDept: 'HR', count: '7' }]),
    }
    const form = formWith({ Dept: 'MKT' }, { Dept: deptSelect() })
    const g = { ...grid(), dataSource: { store: () => store } }
    const s = await probeFilterSuggestion(cfg, { grid: g, form, gate: createApplyGate(true) })
    expect(store.load).toHaveBeenCalledTimes(1) // no fallback scan
    expect(s).toMatchObject({ value: 'HR', count: 7 })
  })
})

describe('filter suggestion — one request for several keys', () => {
  it('groups by every relaxed key in ONE $apply and slices each key out of the combinations', async () => {
    const urls: string[] = []
    const store = {
      version: () => 4,
      _url: 'https://x.test/odata/Budget',
      load: vi.fn(async (opts: { urlOverride?: string }) => {
        urls.push(decodeURIComponent(opts.urlOverride ?? ''))
        // Combinations matching the search: (dept, company) → rows.
        return [
          { CodeDept: 'MKT', CompanyId: 1, count: 1 }, // the current combo (the grid shows it's empty after other filters)
          { CodeDept: 'HR', CompanyId: 1, count: 2 }, //  other dept, same company   → Dept offer: HR (2)
          { CodeDept: 'MKT', CompanyId: 2, count: 5 }, // same dept, other company   → Company offer: 2 (5)
          { CodeDept: 'FIN', CompanyId: 2, count: 9 }, // BOTH differ                  → neither single offer
        ]
      }),
    }
    const form = monoForm({
      inputs: {
        Dept: { value: 'MKT', props: { label: 'Departemen' } },
        Company: { value: 1, props: { label: 'Perusahaan' } },
      },
    })
    form._register('Dept', deptSelect())
    form._register('Company', { items: [{ Id: 1, Name: 'EJI' }, { Id: 2, Name: 'IEG' }], keyValue: 'Id', displayValue: 'Name' })

    const g = { ...grid(), dataSource: { store: () => store } }
    const s = await probeFilterSuggestion(
      { keys: { CodeDept: 'Dept', CompanyId: 'Company' } },
      { grid: g, form, gate: createApplyGate(true) },
    )

    expect(store.load).toHaveBeenCalledTimes(1) // not one per key
    expect(urls[0]).toContain('groupby((CodeDept,CompanyId),aggregate($count as count))')
    // Neither key is pinned in the filter — each is freed by grouping, not by a second request.
    expect(urls[0]).not.toContain('CodeDept eq')
    expect(urls[0]).not.toContain('CompanyId eq')
    expect(s).toMatchObject({ key: 'Company', value: 2, count: 5, caption: 'IEG', label: 'Perusahaan', values: { Company: 2 } })
  })

  it('a locked key is pinned in the filter instead of grouped', async () => {
    const urls: string[] = []
    const store = {
      version: () => 4,
      _url: 'https://x.test/odata/Budget',
      load: vi.fn(async (opts: { urlOverride?: string }) => {
        urls.push(decodeURIComponent(opts.urlOverride ?? ''))
        return [{ CodeDept: 'HR', count: 2 }]
      }),
    }
    const form = monoForm({ inputs: { Dept: { value: 'MKT' }, Company: { value: 1 } } })
    form._register('Dept', deptSelect())
    form._register('Company', { readonly: true, items: [{ Id: 1 }], keyValue: 'Id' })
    const g = { ...grid(), dataSource: { store: () => store } }
    const s = await probeFilterSuggestion(
      { keys: { CodeDept: 'Dept', CompanyId: 'Company' } },
      { grid: g, form, gate: createApplyGate(true) },
    )
    expect(urls[0]).toContain('CompanyId eq 1')
    expect(urls[0]).toContain('groupby((CodeDept),')
    expect(s).toMatchObject({ key: 'Dept', value: 'HR', count: 2, label: 'Dept' })
  })
})

describe("filter suggestion — requestType: 'count'", () => {
  /** An OData store stub answering `$count` by the dept pinned in the url. */
  function countingStore(byDept: Record<string, number>) {
    const urls: string[] = []
    return {
      urls,
      version: () => 4,
      _url: 'https://x.test/odata/Budget',
      load: vi.fn(async () => {
        throw new Error('load must not run in count mode')
      }),
      totalCount: vi.fn(async (opts: { urlOverride?: string }) => {
        const u = decodeURIComponent(opts.urlOverride ?? '')
        urls.push(u)
        const dept = /CodeDept eq '([^']+)'/.exec(u)?.[1] ?? ''
        return byDept[dept] ?? 0
      }),
    }
  }

  it('one $count per allowed option (not the current one); no $apply, no rows', async () => {
    const store = countingStore({ HR: 3, FIN: 1 })
    const form = formWith({ Dept: 'MKT' }, { Dept: deptSelect() }) // options: MKT, HR, FIN
    const g = { ...grid(), dataSource: { store: () => store } }
    const s = await probeFilterSuggestion(
      { keys: { CodeDept: 'Dept' }, requestType: 'count' },
      { grid: g, form, gate: createApplyGate(true) },
    )
    expect(store.load).not.toHaveBeenCalled()
    expect(store.totalCount).toHaveBeenCalledTimes(2) // HR, FIN — never MKT
    expect(store.urls.every((u) => u.includes("contains(tolower(Nama),'andy')"))).toBe(true)
    expect(s).toMatchObject({ value: 'HR', count: 3, caption: 'Human Resources (HR)' })
  })

  it('maxCountRequests caps the requests per field', async () => {
    const store = countingStore({ HR: 3 })
    const form = formWith({ Dept: 'MKT' }, { Dept: deptSelect() })
    const g = { ...grid(), dataSource: { store: () => store } }
    await probeFilterSuggestion(
      { keys: { CodeDept: 'Dept' }, requestType: 'count', maxCountRequests: 1 },
      { grid: g, form, gate: createApplyGate(true) },
    )
    expect(store.totalCount).toHaveBeenCalledTimes(1)
  })

  it('falls back to counting the rows when the source is not an OData store', async () => {
    const form = formWith({ Dept: 'MKT' }, { Dept: deptSelect() })
    const s = await probeFilterSuggestion(
      { keys: { CodeDept: 'Dept' }, requestType: 'count' },
      { grid: grid(), form, gate: createApplyGate(true) }, // array source
    )
    expect(s).toMatchObject({ value: 'HR', count: 3 })
  })
})

describe('filter suggestion — case-insensitive clauses', () => {
  it('wraps a plain field and a collection path in tolower, value lowercased', async () => {
    const { lowerSearchClause } = await import('../src/components/table/filter-suggestion')
    expect(lowerSearchClause('CompanyName', 'contains', 'Shopee')).toEqual(["contains(tolower(CompanyName),'shopee')"])
    expect(lowerSearchClause('Details.[*].NamaPostBudget', 'contains', 'Shopee')).toEqual([
      "Details/any(d: contains(tolower(d/NamaPostBudget),'shopee'))",
    ])
    expect(lowerSearchClause('Name', 'notcontains', "O'Neil")).toEqual(["not contains(tolower(Name),'o''neil')"])
  })
})
