// @vitest-environment jsdom
//
// `<mono-table-search :control-form :suggestion-filter>` + `<mono-table-empty :control-form>` —
// end to end over an array grid whose base filter comes from the form (`CodeDept = form.Dept`).
// A search that matches nothing under Dept = MKT publishes "3 rows in HR"; the empty state offers
// it, and Adjust Filter writes HR into the form and re-queries (unless the page prevents it).
//
// Elements come from the BUILT artifact (like the other element tests); controllers from src.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { monoDataGrid } from '../src/components/table/mono-data-grid'
import { monoArraySource } from '../src/components/table/array-source'
import { monoForm } from '../src/components/form/mono-form-controller'

const ROWS = [
  { Id: 1, Nama: 'Andy Hart', CodeDept: 'HR' },
  { Id: 2, Nama: 'Andy Lim', CodeDept: 'HR' },
  { Id: 3, Nama: 'Andy Ko', CodeDept: 'HR' },
  { Id: 4, Nama: 'Andy Ops', CodeDept: 'OPS' },
  { Id: 5, Nama: 'Budi', CodeDept: 'MKT' },
]

const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms))
const until = async (fn: () => unknown, ms = 1500) => {
  const end = Date.now() + ms
  while (!fn()) {
    if (Date.now() > end) throw new Error('timed out')
    await tick(20)
  }
}

describe('<mono-table-search> filter suggestion → <mono-table-empty> Adjust Filter', () => {
  beforeAll(async () => {
    await import('../dist/ui/table.js')
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  async function setup(control: Record<string, unknown> = {}) {
    const form = monoForm({ inputs: { Dept: { value: 'MKT' } } })
    // Stand-in for the page's `<mono-select key-form="Dept">`: its options are what the
    // user may pick — OPS is not among them.
    form._register('Dept', { items: [{ Code: 'MKT' }, { Code: 'HR' }], keyValue: 'Code', ...control })

    const grid = monoDataGrid(monoArraySource(ROWS, { keyExpr: 'Id', pageSize: 10 }), {
      keyExpr: 'Id',
      searchValue: ['Nama'],
      dataSourceOptions: () => ({ filter: ['CodeDept', '=', form.values().Dept] }),
    })
    await grid.load()

    const search = document.createElement('mono-table-search') as any
    Object.assign(search, {
      dataGrid: grid,
      controlForm: form,
      suggestionFilter: { keys: { CodeDept: 'Dept' } },
    })
    document.body.appendChild(search)

    const table = document.createElement('table')
    const caption = document.createElement('caption')
    const empty = document.createElement('mono-table-empty') as any
    Object.assign(empty, { dataGrid: grid, controlForm: form })
    caption.appendChild(empty)
    table.appendChild(caption)
    document.body.appendChild(table)
    await tick()
    return { form, grid, search, empty }
  }

  const adjustButton = (empty: any) => empty.querySelector('[mono-empty-adjust]') as HTMLButtonElement | null

  it('an empty search publishes an allowed suggestion and the empty state offers it', async () => {
    const { grid, empty } = await setup()
    await grid.setSearch('andy')
    expect(grid.items).toHaveLength(0)

    await until(() => grid.filterSuggestion)
    expect(grid.filterSuggestion).toMatchObject({ key: 'Dept', value: 'HR', count: 3 })

    await until(() => adjustButton(empty))
    // The message REPLACES the subtitle — one [mono-empty-sub], carrying the offer.
    const subs = empty.querySelectorAll('[mono-empty-sub]')
    expect(subs).toHaveLength(1)
    expect(subs[0].hasAttribute('mono-empty-suggest')).toBe(true)
    expect(subs[0].textContent).toContain('There is 3 data available')
    expect(empty.textContent).not.toContain('Try adjusting your search')
    // Reload left, Adjust Filter right, in one row.
    const row = empty.querySelector('[mono-empty-actions]')!
    expect([...row.children].map((b) => (b as HTMLElement).hasAttribute('mono-empty-adjust'))).toEqual([false, true])
  })

  it('suggestion-filter.message formats the line; the subtitle comes back once rows do', async () => {
    const { grid, empty } = await setup()
    empty.suggestionFilter = {
      message: (count: number) => `Ada ${count} Pencarian lain di filter yang berbeda, ingin meng-Adjust Filter?`,
    }
    await grid.setSearch('andy')
    await until(() => adjustButton(empty))
    expect(empty.querySelector('[mono-empty-suggest]')!.textContent!.trim()).toBe(
      'Ada 3 Pencarian lain di filter yang berbeda, ingin meng-Adjust Filter?',
    )

    // A search that matches nothing ANYWHERE: no offer, so the plain subtitle is back.
    await grid.setSearch('zzz-nothing')
    await tick(400)
    expect(empty.querySelector('[mono-empty-suggest]')).toBeNull()
    expect(empty.querySelector('[mono-empty-sub]')!.textContent).toContain('Try adjusting your search')
  })

  it('Adjust Filter writes the form, emits adjust, and re-queries', async () => {
    const { form, grid, empty } = await setup()
    const seen: any[] = []
    empty.addEventListener('adjust', (e: CustomEvent) => seen.push(e.detail))

    await grid.setSearch('andy')
    await until(() => adjustButton(empty))
    adjustButton(empty)!.click()

    expect(form.values().Dept).toBe('HR')
    expect(seen[0]).toMatchObject({ key: 'Dept', value: 'HR', values: { Dept: 'HR' } })
    await until(() => grid.items.length === 3)
    expect(grid.filterSuggestion).toBeNull()
  })

  it('preventDefault on adjust leaves the re-query to the page', async () => {
    const { form, grid, empty } = await setup()
    const refresh = vi.spyOn(grid, 'refresh')
    empty.addEventListener('adjust', (e: Event) => e.preventDefault())

    await grid.setSearch('andy')
    await until(() => adjustButton(empty))
    adjustButton(empty)!.click()

    expect(form.values().Dept).toBe('HR')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('a readonly field (one-dept user) is never offered a change', async () => {
    const { grid, empty } = await setup({ readonly: true })
    await grid.setSearch('andy')
    await tick(400)
    expect(grid.filterSuggestion).toBeNull()
    expect(adjustButton(empty)).toBeNull()
  })

  it('manual mode (model-value + @input): probes the typed text the page searched with', async () => {
    const { grid, search, empty } = await setup()
    // The page owns the search: it filters through the grid's explicit layer, which
    // the grid can't read back as search terms.
    search.modelValue = ''
    search.suggestionFilter = { keys: { CodeDept: 'Dept' }, searchValue: ['Nama'] }
    search.addEventListener('input', (e: CustomEvent) => {
      const v = e.detail.modelValue as string
      void grid.setFilter(v ? ['Nama', 'contains', v] : null)
    })
    await tick()

    const input = search.querySelector('.mono-input-native') as HTMLInputElement
    input.value = 'andy'
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }))

    await until(() => grid.filterSuggestion)
    expect(grid.searchTerms).toHaveLength(0) // the grid's own search was never used
    expect(grid.filterSuggestion).toMatchObject({ key: 'Dept', value: 'HR', count: 3 })
    await until(() => adjustButton(empty))

    // Clearing the text withdraws it.
    input.value = ''
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
    await tick(300)
    expect(grid.filterSuggestion).toBeNull()
  })

  it('rows coming back withdraw the offer', async () => {
    const { grid } = await setup()
    await grid.setSearch('andy')
    await until(() => grid.filterSuggestion)
    await grid.setSearch('budi')
    await tick(200)
    expect(grid.items).toHaveLength(1)
    expect(grid.filterSuggestion).toBeNull()
  })
})
